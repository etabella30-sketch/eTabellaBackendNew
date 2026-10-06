import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';
import { ROUTES } from '@nestjs/core/router/router-module';
import * as fs from 'fs';

/**
 * Every HTTP route an app's module tree declares, read from the controllers' decorator metadata without
 * booting the app (no DI, no database, no Redis): one `"METHOD /path"` per handler, sorted. Phase 0 of the
 * shared-libraries plan (2026-10-06) pins each app's inventory to a committed JSON so a later move of a
 * feature into a shared library, or a module imported into another app (coreapi's CommonModule in download
 * and export), cannot add or drop a route unnoticed.
 *
 * What is walked: `@Module({ imports, controllers })` metadata, dynamic modules (`{ module, imports?,
 * controllers? }`, as ConfigModule.forRoot() or ServeStaticModule.forRoot() return) and forwardRef() entries.
 * A module given as a Promise (an async dynamic module) cannot be read statically and is skipped; none of the
 * six apps uses one today.
 *
 * RouterModule prefixes ARE applied (Phase 5, 2026-10-06): a `RouterModule.register(routes)` entry anywhere in the
 * tree names the modules mounted under each path (`{ path, module, children }`), and the controllers of those
 * modules are listed with the prefix, as Express serves them. The venue box mounts @app/rt-features' controllers
 * under /authapi, /coreapi and /realtimeapi this way; the live apps register no RouterModule, so their inventories
 * are unchanged by this.
 */
export function collectRouteInventory(rootModule: unknown): string[] {
  const prefixes = collectRoutePrefixes(rootModule);
  const routes = new Set<string>();
  const seen = new Set<unknown>();
  const visit = (entry: unknown): void => {
    if (!entry || seen.has(entry)) return;
    seen.add(entry);
    const unwrapped = unwrapModule(entry);
    if (!unwrapped) return;
    const { metatype, extraImports, extraControllers } = unwrapped;
    if (!metatype) return;
    const prefix = prefixes.get(metatype) ?? '';
    const controllers = [
      ...((Reflect.getMetadata('controllers', metatype) as unknown[] | undefined) ?? []),
      ...extraControllers,
    ];
    for (const controller of controllers) for (const route of routesOf(controller)) routes.add(withPrefix(prefix, route));
    const imports = [
      ...((Reflect.getMetadata('imports', metatype) as unknown[] | undefined) ?? []),
      ...extraImports,
    ];
    for (const imported of imports) visit(imported);
  };
  visit(rootModule);
  return [...routes].sort();
}

/** `"GET /common/x"` under prefix `/coreapi` → `"GET /coreapi/common/x"`; an empty prefix changes nothing. */
export function withPrefix(prefix: string, route: string): string {
  if (!prefix) return route;
  const [method, path] = route.split(' ');
  const full = ('/' + [prefix, path].join('/')).replace(/\/+/g, '/').replace(/(.)\/$/, '$1');
  return `${method} ${full}`;
}

interface RouteEntry {
  path?: string;
  module?: unknown;
  children?: unknown[];
}

/**
 * The RouterModule prefix of every module class the tree mounts under a path: `RouterModule.register(routes)` is a
 * dynamic module whose ROUTES provider holds the list; a route's `children` may be module classes (same prefix) or
 * nested routes (prefix + their path), as Nest's RoutesMapper reads them.
 */
export function collectRoutePrefixes(rootModule: unknown): Map<unknown, string> {
  const prefixes = new Map<unknown, string>();
  const seen = new Set<unknown>();
  const assign = (entries: unknown[], parent: string): void => {
    for (const raw of entries) {
      if (typeof raw === 'function') {
        prefixes.set(raw, parent);
        continue;
      }
      const entry = raw as RouteEntry | null;
      if (!entry || typeof entry !== 'object') continue;
      const full = ('/' + [parent, entry.path ?? ''].join('/')).replace(/\/+/g, '/').replace(/(.)\/$/, '$1');
      if (typeof entry.module === 'function') prefixes.set(entry.module, full === '/' ? '' : full);
      if (Array.isArray(entry.children)) assign(entry.children, full === '/' ? '' : full);
    }
  };
  const visit = (entry: unknown): void => {
    if (!entry || seen.has(entry)) return;
    seen.add(entry);
    const unwrapped = unwrapModule(entry);
    if (!unwrapped) return;
    for (const provider of unwrapped.providers) {
      const p = provider as { provide?: unknown; useValue?: unknown } | null;
      if (p && p.provide === ROUTES && Array.isArray(p.useValue)) assign(p.useValue, '');
    }
    if (!unwrapped.metatype) return;
    const imports = [
      ...((Reflect.getMetadata('imports', unwrapped.metatype) as unknown[] | undefined) ?? []),
      ...unwrapped.extraImports,
    ];
    for (const imported of imports) visit(imported);
  };
  visit(rootModule);
  return prefixes;
}

function unwrapModule(entry: unknown): { metatype: Function | null; extraImports: unknown[]; extraControllers: unknown[]; providers: unknown[] } | null {
  if (typeof entry === 'function') return { metatype: entry, extraImports: [], extraControllers: [], providers: [] };
  if (!entry || typeof entry !== 'object') return null;
  const record = entry as { module?: unknown; imports?: unknown[]; controllers?: unknown[]; providers?: unknown[]; forwardRef?: () => unknown; then?: unknown };
  if (typeof record.then === 'function') return null;                       // an async dynamic module: not readable statically
  if (typeof record.forwardRef === 'function') return unwrapModule(record.forwardRef());
  if (typeof record.module === 'function') {
    return { metatype: record.module, extraImports: record.imports ?? [], extraControllers: record.controllers ?? [], providers: record.providers ?? [] };
  }
  return null;
}

/** `"METHOD /prefix/path"` for every handler of a controller class; the path as Express sees it (no trailing slash, '/' for a root route). */
export function routesOf(controller: unknown): string[] {
  if (typeof controller !== 'function') return [];
  const prefixes = ([] as string[]).concat((Reflect.getMetadata(PATH_METADATA, controller) as string | string[] | undefined) ?? '/');
  const out: string[] = [];
  const prototype = controller.prototype;
  for (const name of Object.getOwnPropertyNames(prototype)) {
    if (name === 'constructor') continue;
    const handler = prototype[name];
    if (typeof handler !== 'function') continue;
    const method = Reflect.getMetadata(METHOD_METADATA, handler) as RequestMethod | undefined;
    if (method === undefined) continue;
    const paths = ([] as string[]).concat((Reflect.getMetadata(PATH_METADATA, handler) as string | string[] | undefined) ?? '/');
    for (const prefix of prefixes) {
      for (const path of paths) {
        const full = ('/' + [prefix, path].join('/')).replace(/\/+/g, '/').replace(/(.)\/$/, '$1');
        out.push(`${RequestMethod[method]} ${full}`);
      }
    }
  }
  return out;
}

/**
 * The spec body every app shares: the inventory must equal the committed JSON. `ROUTE_INVENTORY_WRITE=1`
 * rewrites the file instead (after an approved route change), so the diff is reviewed in git.
 */
export function expectRouteInventory(app: string, rootModule: unknown, jsonPath: string): void {
  const routes = collectRouteInventory(rootModule);
  if (process.env['ROUTE_INVENTORY_WRITE'] === '1') {
    fs.writeFileSync(jsonPath, JSON.stringify({ app, routes }, null, 2) + '\n');
  }
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`${app}: no route inventory at ${jsonPath}; run with ROUTE_INVENTORY_WRITE=1 once and commit it`);
  }
  const committed = JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as { app: string; routes: string[] };
  expect(routes).toEqual(committed.routes);
}
