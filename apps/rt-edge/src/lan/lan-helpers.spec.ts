import { BadRequestException, NotFoundException, PayloadTooLargeException } from '@nestjs/common';

import { sessionRecord } from '../auth/testing/fake-state';
import { boxConfig, NOW } from '../auth/testing/edge-world';
import { EdgeLocalSession } from '../contracts';
import { EdgePortError } from '../ports';
import { buildEdgeConfig, buildPing } from './edge-config';
import { bodyInt, bodyObject, clientIp, handshakeContext, queryInt, queryString, readCookie } from './edge-http';
import { edgeCodeOfHttpStatus, requestPathname, toEdgeError } from './lan-exception.filter';
import { CLOUD_API_PREFIXES, isCloudApiPath, useCloudError } from './cloud-paths';
import { caseRt, cloudSessionUrl, partPointer, sessionStartOrder } from './local-cases';
import { cacheControlFor, isApiPath, staticTarget } from './static-files';

const session = (over: Partial<EdgeLocalSession>): EdgeLocalSession =>
    ({ nSesid: 's', cName: 'S', isToday: false, phase: 'not-started', startAtMs: null, firstLineAtMs: null, ...over }) as EdgeLocalSession;

describe('LAN helpers', () => {
    describe('static paths', () => {
        it('never serves the API paths', () => {
            for (const p of ['/edge', '/edge/ping', '/edge/auth/me', '/edge-config.json', '/realtimeapi', '/realtimeapi/session/x', '/coreapi/case/caseinfo', '/downloadapi', '/socket.io', '/socket.io/?EIO=4']) expect([p, isApiPath(p)]).toEqual([p, true]);
            for (const p of ['/', '/edgelord', '/edge-config.json.bak', '/realtimeapix', '/coreapix', '/assets/x.js', '/downloads']) expect([p, isApiPath(p)]).toEqual([p, false]);
        });

        it('cloud service bases: every edge-build API base, as whole segments; their refusal is use_cloud 403', () => {
            expect(CLOUD_API_PREFIXES).toEqual(['/realtimeapi', '/coreapi', '/authapi', '/uploadapi', '/indexapi', '/elasticsearch', '/presentation', '/export', '/download', '/downloadapi']);
            expect(isCloudApiPath('/export')).toBe(true);
            expect(isCloudApiPath('/export/x')).toBe(true);
            expect(isCloudApiPath('/exports')).toBe(false);
            expect(isCloudApiPath(undefined as never)).toBe(false);
            const err = useCloudError();
            expect([err.code, err.status, err.toBody()]).toEqual(['use_cloud', 403, { msg: -1, error: 'use_cloud', message: expect.any(String), useCloud: true }]);
        });

        it('decodes once and refuses traversal, dot-files, NUL, backslashes and drive prefixes', () => {
            expect(staticTarget('/')).toEqual({ kind: 'index' });
            expect(staticTarget('/index.html')).toEqual({ kind: 'index' });
            expect(staticTarget('/assets/fonts/inter.woff2')).toEqual({ kind: 'file', segments: ['assets', 'fonts', 'inter.woff2'] });
            expect(staticTarget('/rt/session/')).toEqual({ kind: 'file', segments: ['rt', 'session'] });
            expect(staticTarget('/a%20b.js')).toEqual({ kind: 'file', segments: ['a b.js'] });
            for (const p of ['/..', '/../x', '/a/../../x', '/%2e%2e/x', '/..%2fx', '/a/./b', '/.env', '/a/.git/config', '/a%00.js', '/a%5c..%5cx', '/a//b', '/C:%5cx', '/c:/x']) {
                expect([p, staticTarget(p).kind]).toEqual([p, 'refused']);
            }
            expect(staticTarget('/%E0%A4%A')).toEqual({ kind: 'bad-request' });
        });

        it('caches hashed bundles for a year, HTML never, the rest for an hour', () => {
            expect(cacheControlFor('index.html')).toBe('no-cache');
            expect(cacheControlFor('main-ABCD1234.js')).toBe('public, max-age=31536000, immutable');
            expect(cacheControlFor('chunk-7XQ2LMNO.js')).toBe('public, max-age=31536000, immutable');
            expect(cacheControlFor('inter-ABCDEFGH.woff2')).toBe('public, max-age=31536000, immutable');
            expect(cacheControlFor('favicon.ico')).toBe('public, max-age=3600');
            expect(cacheControlFor('main-abcd1234.js')).toBe('public, max-age=3600');
        });
    });

    describe('request plumbing', () => {
        it('unwraps IPv4-mapped IPv6 and never invents an IP', () => {
            expect(clientIp('::ffff:10.0.0.5')).toBe('10.0.0.5');
            expect(clientIp('fe80::1')).toBe('fe80::1');
            expect(clientIp('')).toBeNull();
            expect(clientIp(undefined)).toBeNull();
        });

        it('reads one cookie from a Cookie header', () => {
            expect(readCookie('a=1; etab_edge_device=abc; b=2', 'etab_edge_device')).toBe('abc');
            expect(readCookie('etab_edge_device="q%20x"', 'etab_edge_device')).toBe('q x');
            expect(readCookie(['x=1', 'etab_edge_device=z'], 'etab_edge_device')).toBe('z');
            expect(readCookie('xetab_edge_device=1', 'etab_edge_device')).toBeNull();
            expect(readCookie(undefined, 'etab_edge_device')).toBeNull();
            expect(readCookie('etab_edge_device=%E0%A4%A', 'etab_edge_device')).toBe('%E0%A4%A');
        });

        it('builds the socket handshake context from its address and headers', () => {
            expect(handshakeContext({ address: '::ffff:10.0.0.9', headers: { 'user-agent': 'iPad', cookie: 'etab_edge_device=dev' } })).toEqual({ ip: '10.0.0.9', userAgent: 'iPad', deviceCookie: 'dev' });
            expect(handshakeContext(null)).toEqual({ ip: null, userAgent: null, deviceCookie: null });
        });

        it('checks body and query shapes with invalid_request', () => {
            expect(bodyObject(undefined)).toEqual({});
            expect(bodyObject('')).toEqual({});
            expect(bodyObject({ a: 1 })).toEqual({ a: 1 });
            expect(() => bodyObject([1])).toThrow(EdgePortError);
            expect(() => bodyObject('text')).toThrow(EdgePortError);
            expect(queryString(undefined, 'q')).toBeNull();
            expect(queryString('x', 'q')).toBe('x');
            expect(() => queryString(['a', 'b'], 'q')).toThrow(expect.objectContaining({ code: 'invalid_request' }));
            expect(() => queryString('x'.repeat(300), 'q')).toThrow(EdgePortError);
            expect(queryInt('20', 'limit')).toBe(20);
            expect(queryInt('', 'limit')).toBeNull();
            expect(() => queryInt('-1', 'limit')).toThrow(EdgePortError);
            expect(() => queryInt('1e3', 'limit')).toThrow(EdgePortError);
            expect(bodyInt(3, 'stateVersion')).toBe(3);
            for (const bad of ['3', -1, 1.5, null, Number.MAX_SAFE_INTEGER + 2]) expect(() => bodyInt(bad, 'stateVersion')).toThrow(EdgePortError);
        });
    });

    describe('error mapping (anything the controllers did not answer)', () => {
        it('maps HTTP statuses to contract codes', () => {
            expect(edgeCodeOfHttpStatus(404)).toBe('not_found');
            expect(edgeCodeOfHttpStatus(405)).toBe('not_found');
            expect(edgeCodeOfHttpStatus(401)).toBe('unauthenticated');
            expect(edgeCodeOfHttpStatus(413)).toBe('payload_too_large');
            expect(edgeCodeOfHttpStatus(400)).toBe('invalid_request');
            expect(edgeCodeOfHttpStatus(422)).toBe('invalid_request');
            expect(edgeCodeOfHttpStatus(500)).toBe('server_error');
        });

        it('keeps EdgePortErrors, converts Nest and body-parser errors, leaves unknown errors unknown', () => {
            const own = new EdgePortError('code_wrong', 'x', { attemptsLeft: 2 });
            expect(toEdgeError(own)).toBe(own);
            expect(toEdgeError(own, '/realtimeapi/x')).toBe(own);
            expect(toEdgeError(new NotFoundException())).toMatchObject({ code: 'not_found', status: 404 });
            expect(toEdgeError(new NotFoundException(), '/edge/x')).toMatchObject({ code: 'not_found', status: 404 });
            expect(toEdgeError(new NotFoundException(), '/realtimeapi/session/eclipse')).toMatchObject({ code: 'use_cloud', status: 403, extra: { useCloud: true } });
            expect(toEdgeError(new BadRequestException(), '/realtimeapi/x')).toMatchObject({ code: 'invalid_request' });
            expect(requestPathname({ originalUrl: '/a/b?c=1', url: '/x' })).toBe('/a/b');
            expect(requestPathname({ url: '/x?y' } as never)).toBe('/x');
            expect(requestPathname(null)).toBeNull();
            expect(toEdgeError(new BadRequestException())).toMatchObject({ code: 'invalid_request', status: 400 });
            // A body over the limit is its own code (413), never "malformed": body-parser's error and Nest's exception.
            expect(toEdgeError(new PayloadTooLargeException())).toMatchObject({ code: 'payload_too_large', status: 413 });
            expect(toEdgeError(Object.assign(new Error('request entity too large'), { status: 413, statusCode: 413, type: 'entity.too.large' }), '/realtimeapi/fact/insertfact')).toMatchObject({ code: 'payload_too_large', status: 413 });
            expect(toEdgeError(Object.assign(new SyntaxError('Unexpected token'), { status: 400, type: 'entity.parse.failed' }))).toMatchObject({ code: 'invalid_request' });
            const boom = new Error('boom');
            expect(toEdgeError(boom)).toBe(boom);
        });
    });

    describe('dashboard rules (DR4, DR8)', () => {
        it('rt: live (most recently started) → next-today (earliest start) → today-not-started → other', () => {
            expect(caseRt([session({ nSesid: 'a', phase: 'live', firstLineAtMs: 1 }), session({ nSesid: 'b', phase: 'live', firstLineAtMs: 5 }), session({ nSesid: 'c', isToday: true, startAtMs: 3 })])).toEqual({ kind: 'live', nSesid: 'b', sessionName: 'S', startAtMs: null, rank: 0 });
            expect(caseRt([session({ nSesid: 'a', isToday: true, startAtMs: 9 }), session({ nSesid: 'b', isToday: true, startAtMs: 4 }), session({ nSesid: 'c', isToday: true })])).toMatchObject({ kind: 'next-today', nSesid: 'b', startAtMs: 4, rank: 1 });
            expect(caseRt([session({ nSesid: 'c', isToday: true }), session({ nSesid: 'd', isToday: true, phase: 'ended' })])).toMatchObject({ kind: 'today-not-started', nSesid: 'c', rank: 2 });
            expect(caseRt([session({ nSesid: 'd', isToday: true, phase: 'ended' }), session({ nSesid: 'e', startAtMs: 1 })])).toEqual({ kind: 'other', nSesid: null, sessionName: null, startAtMs: null, rank: 3 });
            expect(caseRt([])).toMatchObject({ kind: 'other' });
        });

        it('sessions run oldest start first: a date-only start counts from the start of its day, no start last', () => {
            const s = (nSesid: string, dStartDt: string | null, startAtMs: number | null, tz = 'Europe/London') => session({ nSesid, dStartDt, startAtMs, tz });
            const list = [
                s('none', null, null),
                s('oct1-14', '2026-10-01 14:00:00', Date.UTC(2026, 9, 1, 13)),
                s('oct1-date', '2026-10-01', null),
                s('sep29-date', '2026-09-29', null),
                s('sep30-10', '2026-09-30 10:00:00', Date.UTC(2026, 8, 30, 9)),
                s('bad-zone', '2026-09-28', null, 'Mars/Olympus'),
            ];
            expect([...list].sort(sessionStartOrder).map(x => x.nSesid)).toEqual(['sep29-date', 'sep30-10', 'oct1-date', 'oct1-14', 'bad-zone', 'none']);
        });

        it('Part 2 pointers fall back to the end request time when the cloud gave no split time', () => {
            const config = boxConfig();
            const s = sessionRecord({ nSesid: 's1', nCaseid: 'c1', next: { nSesid: 'p2', nPartNo: 2, splitAtMs: null }, endRequestedAtMs: NOW - 5 });
            expect(partPointer(config, s)).toEqual({ nSesid: 'p2', nPartNo: 2, cloudUrl: 'https://cloud.invalid/rt/session/p2', splitAtMs: NOW - 5 });
            expect(partPointer(config, sessionRecord({ nSesid: 's1', nCaseid: 'c1' }))).toBeNull();
            expect(cloudSessionUrl(config, 'a/b')).toBe('https://cloud.invalid/rt/session/a%2Fb');
        });
    });

    it('edge config and ping without Wi-Fi name or identity', () => {
        const config = boxConfig({ box: { name: 'Court 9', label: 'VB-1', timeZone: 'Asia/Kolkata' } });
        const identity = { nEdgeid: 'E0000000-0000-4000-8000-0000000000ED', slug: 'AbC123', status: 'active' } as never;
        const edge = buildEdgeConfig(config, identity);
        expect(edge).toMatchObject({ boxName: 'Court 9', venueLabel: 'Live transcript · Court 9', roomWifiSsid: null, timeZone: 'Asia/Kolkata', boxHost: 'abc123.etabella-edge.net' });
        expect(edge.pkce.audience).toBe('edge:e0000000-0000-4000-8000-0000000000ed');
        expect(buildPing(config, null, { state: 'down', sinceMs: 5 }, NOW)).toEqual({ nEdgeid: '', nowMs: NOW, timeZone: 'Asia/Kolkata', internet: { state: 'down', sinceMs: 5 }, cloudLinked: false });
    });
});
