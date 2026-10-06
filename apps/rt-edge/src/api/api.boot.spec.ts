import * as fs from 'fs';
import * as os from 'os';
import { join } from 'path';
import type { DynamicModule } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import * as request from 'supertest';
import type { Request } from 'express';

import { AppModule } from '../app.module';
import { AuthModule } from '../auth/auth.module';
import { FakeState } from '../auth/testing/fake-state';
import { CASE_A, cloudKeys, CloudKeys, edgeWorld, MEMBER, onlineToken, SpecClock } from '../auth/testing/edge-world';
import { LanModule } from '../lan/lan.module';
import { LanApp, startLanApp } from '../lan/testing/lan-test-kit';
import { parseBoxConfig } from '../ports/box-config';
import { CLOUD_RELAY, CloudRelay } from '../ports';
import { EDGE_API_PLATFORM_PROVIDERS, EdgeApiPlatformModule } from './adapters/edge-api-platform.module';
import { LocalApiModule, LOCAL_API_IMPORTS } from './api.module';
import { ApiContextMiddleware, apiRequestContext, runWithApiContext } from './api-context';
import { ApiPathHygieneMiddleware, isHygieneRefusal } from './api-path-hygiene.middleware';
import { LocalAuthModule } from './auth/local-auth.module';
import { LocalCoreModule } from './core/local-core.module';
import { LocalRealtimeModule } from './realtime/local-realtime.module';

/*
 * Gate G5 and the Phase 4 exit gate (shared-libraries plan, 2026-10-06): the local API host is a skeleton that
 * changes nothing the box answers today.
 * - Module graph: LocalApiModule is imported in `serve` mode only (R7), depends only on AuthModule, LanModule and the
 *   three family modules, and nothing in its tree has a lifecycle hook or starts anything (R3).
 * - HTTP: with the host mounted (LAN test kit, localApi: true) a table route still answers first; HEAD, escapes,
 *   dot and empty segments on the three families answer `use_cloud` before the router; an unknown route under a
 *   family still answers `use_cloud`; /edge/* is untouched.
 * - CLOUD_RELAY: RtDataService.call answers exactly what the HTTP table route answers (status, body, X-Edge-*),
 *   with and without a sign-in, because it IS handle() against a recorder.
 */

const LIFECYCLE_HOOKS = ['onModuleInit', 'onApplicationBootstrap', 'onModuleDestroy', 'beforeApplicationShutdown', 'onApplicationShutdown'];

const classesOf = (providers: unknown[]): Function[] =>
    providers.map(p => (typeof p === 'function' ? p : (p as { useClass?: Function }).useClass ?? null)).filter((c): c is Function => typeof c === 'function');

const importsOf = (module: Function): unknown[] => (Reflect.getMetadata('imports', module) as unknown[] | undefined) ?? [];

describe('rt-edge local API host: module graph (R3, R7)', () => {
    let dir: string;
    beforeAll(() => { dir = fs.mkdtempSync(join(os.tmpdir(), 'rt-edge-api-boot-')); });
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

    it('is imported after LanModule in serve mode only; a CLI context never sees it', () => {
        const serve = AppModule.register({ config: config(), mode: 'serve' }) as DynamicModule;
        const cli = AppModule.register({ config: config(), mode: 'cli' }) as DynamicModule;
        const serveImports = serve.imports ?? [];
        expect(serveImports).toContain(LocalApiModule);
        expect(serveImports.indexOf(LocalApiModule)).toBeGreaterThan(serveImports.indexOf(LanModule));
        expect(cli.imports ?? []).not.toContain(LocalApiModule);
    });

    it('depends only on the platform adapters, the three family modules and their router registration', () => {
        const direct = importsOf(LocalApiModule);
        const classes = direct.filter((m): m is Function => typeof m === 'function');
        expect(classes.sort((a, b) => a.name.localeCompare(b.name))).toEqual([EdgeApiPlatformModule, LocalAuthModule, LocalCoreModule, LocalRealtimeModule]);
        const dynamic = direct.filter(m => typeof m === 'object');
        expect(dynamic.map(m => (m as { module: unknown }).module)).toEqual([RouterModule]);
        expect(importsOf(EdgeApiPlatformModule)).toEqual([AuthModule, LanModule]);
        // A family module imports only shared feature HTTP modules (dynamic modules of @app/rt-features), nothing else.
        expect(importsOf(LocalAuthModule)).toEqual([]);
        const moduleNames = (family: Function) => importsOf(family).map(m => (m as { module?: { name?: string } }).module?.name);
        expect(moduleNames(LocalCoreModule)).toEqual(['TeamUsersCoreHttpModule']);
        expect(moduleNames(LocalRealtimeModule)).toEqual(['FactsheetRealtimeHttpModule', 'MarkNavigatorHttpModule', 'DocLinkHttpModule']);
        expect(LOCAL_API_IMPORTS.filter(m => typeof m === 'function')).toEqual([LocalAuthModule, LocalCoreModule, LocalRealtimeModule]);
    });

    it('nothing in the tree has a lifecycle hook, and the family modules declare no controllers or providers yet', () => {
        const tree = [...classesOf(EDGE_API_PLATFORM_PROVIDERS), ApiContextMiddleware, ApiPathHygieneMiddleware, LocalApiModule, EdgeApiPlatformModule, LocalAuthModule, LocalCoreModule, LocalRealtimeModule];
        for (const cls of tree) {
            for (const hook of LIFECYCLE_HOOKS) expect([cls.name, hook, hook in cls.prototype]).toEqual([cls.name, hook, false]);
        }
        for (const family of [LocalAuthModule, LocalCoreModule, LocalRealtimeModule]) {
            expect(Reflect.getMetadata('controllers', family) ?? []).toEqual([]);
            expect(Reflect.getMetadata('providers', family) ?? []).toEqual([]);
        }
    });
});

describe('rt-edge local API host: hygiene rule', () => {
    it('refuses HEAD and every path the table could never match, and nothing else', () => {
        expect(isHygieneRefusal('HEAD', '/realtimeapi/marknav/all')).toBe(true);
        for (const p of ['/coreapi/%61', '/realtimeapi/../x', '/realtimeapi/./x', '/coreapi//x', '/coreapi/x\\y', '/realtimeapi/marknav/all//']) {
            expect([p, isHygieneRefusal('GET', p)]).toEqual([p, true]);
        }
        for (const p of ['/coreapi/common/myteamusers', '/realtimeapi/marknav/all/', '/authapi/edge/jwks', '/coreapi']) {
            expect([p, isHygieneRefusal('GET', p)]).toEqual([p, false]);
        }
    });

    it('the request context exists only inside a request', () => {
        expect(apiRequestContext()).toBeNull();
        const ctx = { req: {} as Request, res: {} as never, bearer: null };
        expect(runWithApiContext(ctx, () => apiRequestContext())).toBe(ctx);
        expect(apiRequestContext()).toBeNull();
    });
});

describe('rt-edge local API host over the LAN (table first, hygiene, use_cloud, relay parity)', () => {
    let cloud: CloudKeys;
    let state: FakeState;
    let clock: SpecClock;
    let lan: LanApp;
    let token: string;

    beforeAll(async () => {
        cloud = await cloudKeys();
    });

    beforeEach(async () => {
        state = edgeWorld(cloud.keys);
        clock = new SpecClock();
        lan = await startLanApp({ state, clock: clock.now, localApi: true, config: { cloud: { origin: 'https://cloud.invalid' } } });
        token = await onlineToken(cloud, { sub: MEMBER });
    });

    afterEach(async () => {
        await lan.close();
    });

    const useCloud = { msg: -1, error: 'use_cloud', message: expect.any(String), useCloud: true };

    it('HEAD, escapes, dot and empty segments on the three families answer 403 use_cloud before any controller', async () => {
        const head = await request(lan.url).head('/realtimeapi/marknav/all').set('Authorization', `Bearer ${token}`);
        expect([head.status, head.headers['cache-control']]).toEqual([403, 'no-store']);
        for (const p of ['/coreapi/%61', '/realtimeapi/../marknav/all', '/coreapi//common/getcode', '/realtimeapi/./x']) {
            const res = await request(lan.url).get(p).set('Authorization', `Bearer ${token}`);
            expect([p, res.status, res.body]).toEqual([p, 403, useCloud]);
        }
    });

    it('a route no controller answers under a family is still use_cloud, any method; /edge/ping is untouched', async () => {
        for (const [method, p] of [['get', '/authapi/edge/jwks'], ['post', '/coreapi/comments/add'], ['get', '/realtimeapi/session/feedstatus?nSesid=1'], ['put', '/realtimeapi']] as const) {
            const res = await (request(lan.url) as unknown as Record<string, (u: string) => request.Test>)[method](p).set('Authorization', `Bearer ${token}`);
            expect([method, p, res.status, res.body]).toEqual([method, p, 403, useCloud]);
        }
        const ping = await request(lan.url).get('/edge/ping');
        expect([ping.status, ping.body.msg]).toEqual([200, 1]);
    });

    it('the table still answers first: a table route without a sign-in is 401 from the table, with one it is the box answer', async () => {
        const anon = await request(lan.url).get('/realtimeapi/session/getSessionsByCaseId').query({ nCaseid: CASE_A });
        expect([anon.status, anon.body.error]).toEqual([401, 'unauthenticated']);
        const mine = await request(lan.url).get('/realtimeapi/session/getSessionsByCaseId').query({ nCaseid: CASE_A }).set('Authorization', `Bearer ${token}`);
        expect([mine.status, mine.headers['x-edge-source'], Array.isArray(mine.body)]).toEqual([200, 'box', true]);
        // a cloud-read TABLE row with no cloud: the box's offline answer, never use_cloud (Phase 8 moved marknav/all to a
        // shared controller, so the issue list is the table's sample now)
        const marks = await request(lan.url).get('/realtimeapi/issue/issuelist_V2').query({ nCaseid: CASE_A }).set('Authorization', `Bearer ${token}`);
        expect([marks.status, marks.headers['x-edge-source']]).toEqual([200, 'box']);
    });

    it('CLOUD_RELAY answers exactly what the table route answers: the same instance, the same handle()', async () => {
        const relay = lan.app.get<CloudRelay>(CLOUD_RELAY);
        const fakeReq = (authorization?: string) => ({ headers: authorization ? { authorization } : {}, socket: { remoteAddress: '127.0.0.1' }, cookies: {}, method: 'GET', originalUrl: '/x' }) as unknown as Request;
        const ctx = (authorization?: string) => ({ req: fakeReq(authorization), res: {} as never, bearer: null });

        const anon = await relay.call('session.list', { nCaseid: CASE_A }, null, ctx());
        const anonHttp = await request(lan.url).get('/realtimeapi/session/getSessionsByCaseId').query({ nCaseid: CASE_A });
        expect([anon.status, anon.body, anon.headers['cache-control']]).toEqual([anonHttp.status, anonHttp.body, anonHttp.headers['cache-control']]);

        const mine = await relay.call('session.list', { nCaseid: CASE_A }, null, ctx(`Bearer ${token}`));
        const mineHttp = await request(lan.url).get('/realtimeapi/session/getSessionsByCaseId').query({ nCaseid: CASE_A }).set('Authorization', `Bearer ${token}`);
        expect([mine.status, mine.body, mine.headers['x-edge-source'], mine.headers['content-type']]).toEqual([mineHttp.status, mineHttp.body, 'box', mineHttp.headers['content-type']]);
        expect(mine.raw.toString('utf8')).toBe(mineHttp.text);

        const offline = await relay.call('issue.list', { nCaseid: CASE_A }, null, ctx(`Bearer ${token}`));
        const offlineHttp = await request(lan.url).get('/realtimeapi/issue/issuelist_V2').query({ nCaseid: CASE_A }).set('Authorization', `Bearer ${token}`);
        expect([offline.status, offline.body, offline.headers['x-edge-source'], offline.headers['x-edge-offline']]).toEqual([offlineHttp.status, offlineHttp.body, 'box', offlineHttp.headers['x-edge-offline']]);

        const unknown = await relay.call('no.such.route', {}, null, ctx(`Bearer ${token}`));
        expect([unknown.status, (unknown.body as { error: string }).error]).toEqual([500, 'server_error']);
        expect(lan.app.get(CLOUD_RELAY)).toBe(lan.app.get((await import('../lan/rt-data/rt-data.service')).RtDataService));
    });
});
