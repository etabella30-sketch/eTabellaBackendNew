import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';
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
 * six apps uses one today. RouterModule prefixes are not applied; no app registers RouterModule today, and the
 * rt-edge local API host (Phase 4) adds its own check for them.
 */
export function collectRouteInventory(rootModule: unknown): string[] {
  const routes = new Set<string>();
  const seen = new Set<unknown>();
  const visit = (entry: unknown): void => {
    if (!entry || seen.has(entry)) return;
    seen.add(entry);
    const unwrapped = unwrapModule(entry);
    if (!unwrapped) return;
    const { metatype, extraImports, extraControllers } = unwrapped;
    if (!metatype) return;
    const controllers = [
      ...((Reflect.getMetadata('controllers', metatype) as unknown[] | undefined) ?? []),
      ...extraControllers,
    ];
    for (const controller of controllers) for (const route of routesOf(controller)) routes.add(route);
    const imports = [
      ...((Reflect.getMetadata('imports', metatype) as unknown[] | undefined) ?? []),
      ...extraImports,
    ];
    for (const imported of imports) visit(imported);
  };
  visit(rootModule);
  return [...routes].sort();
}

function unwrapModule(entry: unknown): { metatype: Function | null; extraImports: unknown[]; extraControllers: unknown[] } | null {
  if (typeof entry === 'function') return { metatype: entry, extraImports: [], extraControllers: [] };
  if (!entry || typeof entry !== 'object') return null;
  const record = entry as { module?: unknown; imports?: unknown[]; controllers?: unknown[]; forwardRef?: () => unknown; then?: unknown };
  if (typeof record.then === 'function') return null;                       // an async dynamic module: not readable statically
  if (typeof record.forwardRef === 'function') return unwrapModule(record.forwardRef());
  if (typeof record.module === 'function') {
    return { metatype: record.module, extraImports: record.imports ?? [], extraControllers: record.controllers ?? [] };
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
