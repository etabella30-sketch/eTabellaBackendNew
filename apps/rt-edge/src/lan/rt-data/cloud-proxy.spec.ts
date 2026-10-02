import { Logger } from '@nestjs/common';

import { boxConfig } from '../../auth/testing/edge-world';
import { proxyBase, RtCloudProxy } from './cloud-proxy';
import { DEFAULT_RT_DATA_OPTIONS, rtDataOptions } from './rt-data.options';

describe('RtCloudProxy (only the configured cloud origin)', () => {
    const proxies: RtCloudProxy[] = [];
    const make = (cloud: Record<string, unknown>, extra: Record<string, unknown> = {}): RtCloudProxy => {
        const proxy = new RtCloudProxy(boxConfig({ cloud, ...extra }));
        proxies.push(proxy);
        return proxy;
    };

    beforeAll(() => Logger.overrideLogger(false)); // the "proxy is disabled" error lines are expected here

    afterAll(() => {
        for (const p of proxies) p.onModuleDestroy();
    });

    it('builds every URL as realtimeApiUrl + a table path + the query, on cloud.origin', () => {
        const proxy = make({ origin: 'https://etabella.net' });
        expect(proxy.disabled()).toBeNull();
        expect(proxy.urlFor('marknav/all', 'nSesid=a&nUserid=b')?.href).toBe('https://etabella.net/realtimeapi/marknav/all?nSesid=a&nUserid=b');
        expect(proxy.urlFor('issue/issuelist_V2', '')?.href).toBe('https://etabella.net/realtimeapi/issue/issuelist_V2');
        const custom = make({ origin: 'https://etabella.net', realtimeApiUrl: 'https://etabella.net/rt/api/' });
        expect(custom.urlFor('fact/insertHighlights', '')?.href).toBe('https://etabella.net/rt/api/fact/insertHighlights');
    });

    it('refuses any path that is not a plain table path (no dots, escapes, schemes or hosts)', () => {
        const proxy = make({ origin: 'https://etabella.net' });
        for (const p of ['../authapi/x', 'marknav/../../x', '//evil.example/x', 'https://evil.example/x', 'marknav/%2e%2e/x', 'marknav/all?x=1', 'marknav/all#x', '', 'a//b', 'a/b/']) {
            expect([p, proxy.urlFor(p, '')]).toEqual([p, null]);
        }
    });

    it('is disabled when realtimeApiUrl leaves cloud.origin, or is not https outside dev', async () => {
        const other = make({ origin: 'https://etabella.net', realtimeApiUrl: 'https://evil.example/realtimeapi' });
        expect(other.disabled()).toMatch(/not on cloud.origin/);
        expect(other.urlFor('marknav/all', '')).toBeNull();
        await expect(other.send({ method: 'GET', cloudPath: 'marknav/all', query: '', body: null, token: 't', timeoutMs: 100, maxBytes: 100 })).resolves.toMatchObject({ kind: 'refused', reason: 'disabled' });
        const port = make({ origin: 'https://etabella.net', realtimeApiUrl: 'https://etabella.net:8443/realtimeapi' });
        expect(port.disabled()).toMatch(/not on cloud.origin/);

        expect(proxyBase(boxConfig({ cloud: { origin: 'http://127.0.0.1:3000' } })).problem).toBeNull(); // dev only
        const prod = { ...boxConfig({ cloud: { origin: 'https://etabella.net' } }), mode: 'production' as const };
        expect(proxyBase({ ...prod, cloud: { ...prod.cloud, origin: 'http://etabella.net', realtimeApiUrl: 'http://etabella.net/realtimeapi' } }).problem).toMatch(/https/);
        expect(proxyBase({ ...prod, cloud: { ...prod.cloud, realtimeApiUrl: 'https://etabella.net/realtimeapi?x=1' } }).problem).toMatch(/plain base/);
        expect(proxyBase({ ...prod, cloud: { ...prod.cloud, realtimeApiUrl: 'not a url' } }).problem).toMatch(/not a URL/);
    });

    it('options: defaults, and only positive numbers override them', () => {
        expect(rtDataOptions(undefined)).toEqual(DEFAULT_RT_DATA_OPTIONS);
        expect(rtDataOptions({ readTimeoutMs: 5, writeTimeoutMs: 0, maxInFlight: -1, cacheFreshMs: Number.NaN })).toEqual({ ...DEFAULT_RT_DATA_OPTIONS, readTimeoutMs: 5 });
        expect(Object.isFrozen(DEFAULT_RT_DATA_OPTIONS)).toBe(true);
    });
});
