import type { NextFunction, Request, Response } from 'express';
import * as express from 'express';
import * as fs from 'fs';
import { join, posix } from 'path';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { MetadataScanner, ModulesContainer } from '@nestjs/core';
import { SERVE_STATIC_MODULE_OPTIONS } from '@nestjs/serve-static';
import { refuseHeadRequests } from '@app/global/utility/http-surface/http-surface';
// The pathname parser express.static (serve-static) itself uses, so the guard judges exactly the
// path the static handler would serve (absolute-form targets and '#'/whitespace fall back to
// url.parse there too).
import * as parseurl from 'parseurl';

/**
 * Plain Express handlers that realtime-server's main.ts installs right after NestFactory.create().
 * app.use() before init registers them on the Express instance at once, so they run ahead of every
 * Nest middleware and controller route (registered in app.init()). The static files are mounted
 * here too (installHttpSurfaceGuards), right behind the guards: RealtimeServerModule no longer
 * imports ServeStaticModule (R4-005, RT QA 2026-10-28), whose Express loader registered
 * app.get('*', sendFile(<assets>/index.html)) behind every route, so an unknown path under a route
 * root (/doclink/shared) ended in ENOENT and a 500 that named the server's file system path. With
 * no '*' handler an unmatched GET now reaches Nest's own not-found answer: a JSON 404 through
 * HttpErrorFilter, naming no path of the server.
 */

/**
 * HEAD refusal (405 + Allow), shared with the other apps (libs/global http-surface). Nest runs
 * method-scoped middleware (forRoutes(Controller), get(...)) behind a `req.method === 'GET'` check,
 * but Express dispatches HEAD to GET routes, so a HEAD request skipped every auth middleware while
 * the GET handler still ran. No client sends HEAD to this server, so it is refused for the whole
 * app, static files included.
 */
export { ALLOWED_METHODS, refuseHeadRequests } from '@app/global/utility/http-surface/http-surface';

/**
 * The only static files this server hands out. process.cwd()/assets (ASSETS_ROOT) also holds the raw
 * transcripts (realtime-transcripts/s_<nSesid>.json/.TXT, transcript_<ms>.json/.TXT), the session
 * files upload writes (doc/case<id>/), checked-in copies of both ('com 15', 'com backup'), per-case
 * exports (export-excel/), SQL migrations, python scripts, upload chunks, temp files and more. Each
 * entry is a folder prefix: that folder alone is mounted (express.static, at the same URL prefix),
 * only files below it are served, and every other static path answers 404; there is no index.html
 * fallback.
 * The legacy frontend downloads DOCX/PDF exports from /realtime-transcripts/exports/<name> without a
 * token (rt export, export-transcript, transcript-viewer). No other client (new frontend, venue app,
 * other services, tools) loads a file from this server: they call its API routes only.
 */
export const PUBLIC_STATIC_PREFIXES: ReadonlyArray<readonly string[]> = [['realtime-transcripts', 'exports']];

/** The assets folder the public prefixes live under (the old ServeStatic rootPath). */
export const ASSETS_ROOT = join(process.cwd(), 'assets');

/**
 * express.static over each public prefix, mounted at that prefix: no index, no directory redirect, no
 * dotfiles, and fallthrough so a missing export reaches Nest's 404 like any unknown path. The guard
 * ahead of it has already refused every spelling that is not the prefix itself.
 */
export function publicStaticMounts(assetsRoot: string = ASSETS_ROOT): Array<[string, express.Handler]> {
  return PUBLIC_STATIC_PREFIXES.map((prefix) => [
    '/' + prefix.join('/'),
    express.static(join(assetsRoot, ...prefix), { index: false, redirect: false, dotfiles: 'ignore', fallthrough: true }),
  ]);
}

/**
 * First path segments of routes main.ts adds outside the controllers: SwaggerModule.setup('swagger')
 * serves the UI and its assets under /swagger, the document at /swagger-json (the Docker
 * healthcheck) and /swagger-yaml.
 */
export const EXTRA_ROUTE_ROOTS: readonly string[] = ['swagger', 'swagger-json', 'swagger-yaml'];

/** A path segment as a case-insensitive Windows/macOS file system could resolve it. */
function canonicalSegment(segment: string): string {
  return segment
    .split(':')[0] // NTFS stream suffix (name::$DATA, dir::$INDEX_ALLOCATION)
    .replace(/[. ]+$/, '') // Win32 drops trailing dots and spaces
    .toLowerCase();
}

/**
 * The path send (the file server behind express.static) would serve, as segments: one
 * decodeURIComponent, then '.'/'..' resolution. null when no file may be meant: undecodable or NUL
 * (send answers 400 for both), and any backslash. send reads a backslash as a separator on Windows
 * and as part of a name on Linux, so the two platforms could land in different folders; no client
 * and no route puts one in a path, so it is refused outright rather than guessed at.
 */
function staticPathSegments(pathname: string): string[] | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(String(pathname ?? ''));
  } catch {
    return null;
  }
  if (decoded.includes('\\') || decoded.includes('\0')) return null;
  return posix.normalize('/' + decoded).split('/').filter(s => s !== '');
}

/**
 * True for a file below one of PUBLIC_STATIC_PREFIXES. The prefix must match exactly, letter case
 * included, so no Windows spelling of another folder (REALTI~1, 'exports.', 'exports::$DATA') can
 * pass; and no segment may be one Windows could read as '.', '..' or nothing at all ('...', '.. ',
 * a bare '::$DATA' stream suffix).
 */
export function isPublicStaticPath(pathname: string): boolean {
  const segments = staticPathSegments(pathname);
  if (!segments || segments.some(s => canonicalSegment(s) === '')) return false;
  return PUBLIC_STATIC_PREFIXES.some(prefix =>
    segments.length > prefix.length && prefix.every((name, i) => segments[i] === name));
}

/**
 * Whether a GET may go past the guard. A path under a route root (the first segment of a controller
 * or Swagger route, compared the way Windows could resolve it) goes on to the Nest routes, once
 * createStaticAllowlistGuard has checked that a static root (none since R4-005) would find nothing there. Any other
 * path can only end at the public static mount or Nest's 404, and goes on only when isPublicStaticPath. A segment
 * Windows could read as '.', '..' or nothing ('...', '.. ', '::$DATA') is refused wherever it sits.
 */
export function mayPassStaticGuard(pathname: string, routeRoots: ReadonlySet<string>): boolean {
  const segments = staticPathSegments(pathname);
  if (!segments || segments.some(s => canonicalSegment(s) === '')) return false;
  if (!segments.length) return pathname === '/' && routeRoots.has(''); // the app's own GET /
  if (routeRoots.has(canonicalSegment(segments[0]))) return true;
  return isPublicStaticPath(pathname);
}

/**
 * The first path segment (lower case) of every HTTP route the app's controllers declare, '' for a
 * route at '/', plus EXTRA_ROUTE_ROOTS. NestFactory.create() has scanned every module into the
 * container before main.ts installs the guard, so controllers added later are picked up without a
 * list to maintain. realtime-server sets no global prefix, version or RouterModule path: controller
 * path + method path is the route. A route whose first segment is not a fixed name (':id', '*')
 * fails the start, since static paths could no longer be told apart from it.
 */
export function collectRouteRoots(modules: { values(): Iterable<{ controllers: Map<unknown, { metatype?: unknown }> }> }): Set<string> {
  const roots = new Set<string>(EXTRA_ROUTE_ROOTS);
  const scanner = new MetadataScanner();
  const pathsOf = (target: object): string[] => ([] as string[]).concat(Reflect.getMetadata(PATH_METADATA, target) ?? '/');
  for (const moduleRef of modules.values()) {
    for (const { metatype } of moduleRef.controllers.values()) {
      if (typeof metatype !== 'function') continue;
      const prototype = metatype.prototype;
      for (const name of scanner.getAllMethodNames(prototype)) {
        const handler = prototype[name];
        if (typeof handler !== 'function' || Reflect.getMetadata(METHOD_METADATA, handler) === undefined) continue;
        for (const base of pathsOf(metatype)) {
          for (const sub of pathsOf(handler)) {
            const root = `${base}/${sub}`.split('/').find(s => s !== '') ?? '';
            if (/[:*?+()]/.test(root)) {
              throw new Error(`realtime-http-surface: route "${base}/${sub}" has no fixed first segment, so the static guard cannot tell it from a static path`);
            }
            roots.add(root.toLowerCase());
          }
        }
      }
    }
  }
  return roots;
}

/**
 * The rootPath of every ServeStatic registration mounted at '/'. Registrations with a serveRoot are
 * left out. [] when the app has no ServeStatic options (RealtimeServerModule since R4-005: it
 * imports none), which only disables the existence check below; it is kept so an app that mounts a
 * static root at '/' again is still covered.
 *
 * The options are looked up in the ModulesContainer, never with app.get(SERVE_STATIC_MODULE_OPTIONS):
 * NestFactory.create() returns a proxy that runs app.get() inside its ExceptionsZone, which logs a
 * missing provider and calls process.exit(1) (abortOnError defaults to true) before a catch here
 * could ever see the error, so the server died on boot.
 */
export function serveStaticRoots(app: { get: (token: any) => any }): string[] {
  let options: unknown;
  const container: ModulesContainer = app.get(ModulesContainer);
  for (const module of container.values()) {
    const wrapper = module.providers.get(SERVE_STATIC_MODULE_OPTIONS);
    if (wrapper) {
      options = wrapper.instance;
      break;
    }
  }
  return ([] as any[]).concat(options ?? [])
    .filter((o) => o && typeof o.rootPath === 'string' && !o.serveRoot)
    .map((o) => o.rootPath as string);
}

/**
 * Calls back true when a static root holds an entry at the path send would open for this request
 * (root + the decoded, dot-resolved path; the file system then folds case, trailing dots/spaces,
 * streams and short names exactly as it does for send). Any stat error means send cannot open it
 * either. Asynchronous, so a slow volume never blocks the event loop.
 */
export function staticEntryExists(pathname: string, staticRoots: readonly string[], done: (exists: boolean) => void): void {
  const segments = staticPathSegments(pathname);
  const targets = segments?.length ? staticRoots.map((root) => join(root, ...segments)) : [];
  const probe = (i: number): void => {
    if (i >= targets.length) return done(false);
    fs.stat(targets[i], (err) => (err ? probe(i + 1) : done(true)));
  };
  probe(0);
}

/**
 * 404s, before routing, any GET/HEAD that would reach a static file outside PUBLIC_STATIC_PREFIXES
 * (only GET/HEAD reach express.static). A path under a route root goes on to Nest (its 404 when no
 * route matches), but only while the static roots mounted at '/' (none today) hold nothing there:
 * the assets folder is shared with the other services on one host (PM2 runs them all from the same
 * working directory), and a folder there named like a route root (assets/session/..., written by
 * mistake or through another service) must never be served at /session/<file>.
 */
export function createStaticAllowlistGuard(routeRoots: ReadonlySet<string>, staticRoots: readonly string[] = []) {
  return function blockNonPublicStaticFiles(req: Request, res: Response, next: NextFunction) {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    const pathname = parseurl(req)?.pathname;
    const notFound = () => { res.status(404).json({ statusCode: 404, message: 'Not Found' }); };
    if (!mayPassStaticGuard(pathname, routeRoots)) return notFound();
    if (isPublicStaticPath(pathname)) return next();
    staticEntryExists(pathname, staticRoots, (exists) => (exists ? notFound() : next()));
  };
}

/**
 * Called in main.ts immediately after NestFactory.create(), before anything else is registered: the
 * HEAD refusal, the static allowlist guard, then the public static mount(s) under `assetsRoot`
 * (process.cwd()/assets in production; a test passes its own folder).
 */
export function installHttpSurfaceGuards(app: { use: (...handlers: any[]) => unknown; get: (token: any) => any }, assetsRoot: string = ASSETS_ROOT): void {
  app.use(refuseHeadRequests);
  app.use(createStaticAllowlistGuard(collectRouteRoots(app.get(ModulesContainer)), serveStaticRoots(app)));
  for (const [mountPath, handler] of publicStaticMounts(assetsRoot)) app.use(mountPath, handler);
}
