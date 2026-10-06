import * as fs from 'fs';
import * as os from 'os';
import { join } from 'path';
import { RouterModule } from '@nestjs/core';
import { collectRouteInventory } from '@app/global/utility/http-surface/route-inventory';
import { manifestTableRows, ROUTE_MANIFEST } from '@app/api-contracts';

import { AppModule } from '../app.module';
import { EDGE_ROUTES } from '../contracts';
import { parseBoxConfig } from '../ports/box-config';
import { LOCAL_API_IMPORTS, LOCAL_API_ROUTES } from './api.module';
import { isLocalApiPath, LOCAL_API_PREFIXES } from './api-path-hygiene.middleware';

/*
 * Gate G3, invariant R6 of the shared-libraries plan (Phase 4, 2026-10-06): on the box every route has exactly one
 * owner. Under /authapi, /coreapi and /realtimeapi that is either a ROUTE_MANIFEST `table` row (answered by
 * RtDataMiddleware before the router) or a controller mounted under the prefix by the local API host (a `controller`
 * row), never both, and never a controller the manifest does not know. The box's own routes stay under /edge.
 * Read from decorator metadata, like route-inventory.spec.ts: nothing boots. In Phase 4 the prefixes are empty.
 */

const key = (method: string, path: string): string => `${method.toUpperCase()} ${path.toLowerCase()}`;

/** `METHOD /prefix/path` of every controller mounted under a local API prefix, RouterModule prefix applied. */
function prefixedControllerRoutes(): string[] {
    const out: string[] = [];
    for (const route of LOCAL_API_ROUTES) {
        for (const r of collectRouteInventory(route.module)) {
            const [method, path] = r.split(' ');
            out.push(key(method, `/${route.path}${path === '/' ? '' : path}`));
        }
    }
    return out.sort();
}

describe('rt-edge route ownership (G3, R6)', () => {
    let dir: string;
    beforeAll(() => { dir = fs.mkdtempSync(join(os.tmpdir(), 'rt-edge-ownership-')); });
    afterAll(() => { fs.rmSync(dir, { recursive: true, force: true }); });

    const config = () => parseBoxConfig(
        {
            mode: 'dev',
            box: { name: 'Court 3', label: 'VB-014', timeZone: 'Europe/London' },
            cloud: { origin: 'https://cloud.invalid' },
            http: { host: '127.0.0.1', port: 0, tls: null },
            transmitter: { bindAddress: '192.168.20.2', networkCidr: '192.168.20.0/24' },
            paths: { dataDir: './data' },
            shutdownTimeoutMs: 100,
        },
        join(dir, 'rt-edge.json'),
    );

    it('mounts exactly the three cloud families, and the hygiene prefixes are the same three', () => {
        expect(LOCAL_API_ROUTES.map(r => r.path)).toEqual(['authapi', 'coreapi', 'realtimeapi']);
        expect([...LOCAL_API_PREFIXES]).toEqual(LOCAL_API_ROUTES.map(r => `/${r.path}`));
        const router = LOCAL_API_IMPORTS.find(m => typeof m === 'object' && (m as { module?: unknown }).module === RouterModule);
        expect(router).toBeDefined();
    });

    it('every controller route under a prefix is a manifest `controller` row, never a `table` row, and every `controller` row is mounted', () => {
        const mounted = prefixedControllerRoutes();
        const table = new Set(manifestTableRows().map(r => key(r.method, r.path)));
        const controller = new Set(ROUTE_MANIFEST.filter(r => r.boxOwner === 'controller').map(r => key(r.method, r.path)));
        expect(mounted.filter(r => table.has(r))).toEqual([]);
        expect(mounted.filter(r => !controller.has(r))).toEqual([]);
        expect([...controller].filter(r => !mounted.includes(r))).toEqual([]);
        // Phase 4: nothing moved yet.
        expect(mounted).toEqual([]);
        expect(controller.size).toBe(0);
    });

    it("the box's own routes stay under /edge, and no LAN controller answers under a cloud family", () => {
        const routes = collectRouteInventory(AppModule.register({ config: config(), mode: 'serve' }));
        expect(routes.length).toBeGreaterThan(30);
        const edge = new Set(Object.values(EDGE_ROUTES).map(r => key(r.method, r.path.replace(/:\w+/g, ':id'))));
        for (const r of routes) {
            const [, path] = r.split(' ');
            expect([r, isLocalApiPath(path)]).toEqual([r, false]);
            expect([r, path === '/edge-config.json' || path.startsWith('/edge/')]).toEqual([r, true]);
        }
        // Every contract route is mounted (the ops routes have their own table and are not in EDGE_ROUTES).
        const mountedKeys = new Set(routes.map(r => key(r.split(' ')[0], r.split(' ')[1].replace(/:\w+/g, ':id'))));
        expect([...edge].filter(r => !mountedKeys.has(r))).toEqual([]);
    });

    it('a table row and a manifest use_cloud row never share a route key with a /edge route', () => {
        const edge = new Set(Object.values(EDGE_ROUTES).map(r => key(r.method, r.path)));
        for (const row of ROUTE_MANIFEST) expect([row.id, edge.has(key(row.method, row.path))]).toEqual([row.id, false]);
    });
});
