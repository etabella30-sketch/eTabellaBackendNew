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
import { LocalAuthModule } from './auth/local-auth.module';
import { LocalCoreModule } from './core/local-core.module';
import { LocalRealtimeModule } from './realtime/local-realtime.module';

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

    it("each family's router children are exactly the shared feature modules it imports (a prefix never reaches a module that is only imported)", () => {
        const families: Record<string, Function> = { authapi: LocalAuthModule, coreapi: LocalCoreModule, realtimeapi: LocalRealtimeModule };
        for (const route of LOCAL_API_ROUTES) {
            const family = families[route.path];
            expect(route.module).toBe(family);
            const imported = ((Reflect.getMetadata('imports', family) as unknown[] | undefined) ?? []).map(m => (typeof m === 'function' ? m : (m as { module: unknown }).module));
            expect([route.path, route.children ?? []]).toEqual([route.path, imported]);
        }
    });

    it('every controller route under a prefix is a manifest `controller` row, never a `table` row, and every `controller` row is mounted', () => {
        const mounted = prefixedControllerRoutes();
        const table = new Set(manifestTableRows().map(r => key(r.method, r.path)));
        const controller = new Set(ROUTE_MANIFEST.filter(r => r.boxOwner === 'controller').map(r => key(r.method, r.path)));
        expect(mounted.filter(r => table.has(r))).toEqual([]);
        expect(mounted.filter(r => !controller.has(r))).toEqual([]);
        expect([...controller].filter(r => !mounted.includes(r))).toEqual([]);
        // Phase 5: the team-users row; Phase 7a: the eight Full Fact editor rows (FactsheetController, mount 'box');
        // Phase 8: the two Mark Navigator rows (MarkNavigatorController) and the three DocLink rows (DocLinkController, mount 'rows');
        // Phase 9: the nine issue and claim rows (IssuesController).
        const expected = [
            'DELETE /realtimeapi/issue/delete/multi/issue',
            'DELETE /realtimeapi/issue/deleteissue',
            'GET /coreapi/common/myteamusers',
            'GET /realtimeapi/doclink/docdetail',
            'GET /realtimeapi/factsheet/contacts',
            'GET /realtimeapi/factsheet/detail',
            'GET /realtimeapi/factsheet/issues',
            'GET /realtimeapi/factsheet/links',
            'GET /realtimeapi/factsheet/shared',
            'GET /realtimeapi/factsheet/tasks',
            'GET /realtimeapi/issue/issuelist_v2',
            'GET /realtimeapi/marknav/all',
            'GET /realtimeapi/marknav/quickmarklist',
            'POST /realtimeapi/doclink/docdelete',
            'POST /realtimeapi/doclink/insertdoc',
            'POST /realtimeapi/factsheet/delete',
            'POST /realtimeapi/factsheet/save',
            'POST /realtimeapi/issue/insertcategory',
            'POST /realtimeapi/issue/insertissue',
            'POST /realtimeapi/issue/qfact/claim/sequence',
            'POST /realtimeapi/issue/qfact/sequence',
            'PUT /realtimeapi/issue/updateclaimdetail',
            'PUT /realtimeapi/issue/updateissue',
        ];
        expect(mounted).toEqual(expected);
        expect([...controller].sort()).toEqual(expected);
        // The cloud-only factsheet and doclink routes are not mounted on the box (FactsheetLiveController, DocLinkLiveController).
        for (const p of ['GET /realtimeapi/factsheet/permissions', 'POST /realtimeapi/factsheet/unshare', 'GET /realtimeapi/factsheet/factannotation', 'GET /realtimeapi/doclink/docshared']) {
            expect(mounted).not.toContain(key(p.split(' ')[0], p.split(' ')[1]));
        }
    });

    it("the box's own routes stay under /edge; under a cloud family the app serves exactly the mounted shared controllers", () => {
        const routes = collectRouteInventory(AppModule.register({ config: config(), mode: 'serve' }));
        expect(routes.length).toBeGreaterThan(30);
        const edge = new Set(Object.values(EDGE_ROUTES).map(r => key(r.method, r.path.replace(/:\w+/g, ':id'))));
        const underFamilies = routes.filter(r => isLocalApiPath(r.split(' ')[1])).map(r => key(r.split(' ')[0], r.split(' ')[1]));
        expect(underFamilies).toEqual(prefixedControllerRoutes());
        for (const r of routes.filter(r => !isLocalApiPath(r.split(' ')[1]))) {
            const [, path] = r.split(' ');
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
