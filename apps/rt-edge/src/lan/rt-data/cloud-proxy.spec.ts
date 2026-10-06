import { Logger } from '@nestjs/common';

import { boxConfig } from '../../auth/testing/edge-world';
import { CloudCall, CloudResult, proxyBase, RtCloudProxy, WAITING_PER_SLOT } from './cloud-proxy';
import { DEFAULT_RT_DATA_OPTIONS, rtDataOptions, RtDataOptions } from './rt-data.options';
import { FakeCloudApi } from './testing/fake-cloud-api';

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

describe('RtCloudProxy slots (live mark sync, user decision 2026-10-05: reads leave slots for writes; a stale read may wait)', () => {
    let cloudApi: FakeCloudApi;
    const proxies: RtCloudProxy[] = [];
    const make = (over: Partial<RtDataOptions>): RtCloudProxy => {
        const proxy = new RtCloudProxy(boxConfig({ cloud: { origin: cloudApi.origin } }), over);
        proxies.push(proxy);
        return proxy;
    };
    const call = (method: CloudCall['method'], over: Partial<CloudCall> = {}): CloudCall => ({
        method,
        cloudPath: 'marknav/all',
        query: '',
        body: method === 'GET' ? null : Buffer.from('{}'),
        token: 't',
        timeoutMs: 2_000,
        maxBytes: 1024,
        ...over,
    });
    const outcome = (r: CloudResult): string => (r.kind === 'response' ? String(r.status) : r.reason);

    beforeAll(async () => {
        cloudApi = new FakeCloudApi();
        await cloudApi.start();
    });

    beforeEach(() => {
        cloudApi.requests.length = 0;
    });

    afterAll(async () => {
        for (const p of proxies) p.onModuleDestroy();
        await cloudApi.close();
    });

    it('reads stop at maxInFlight - writeSlots; writes may take every slot', async () => {
        const proxy = make({ maxInFlight: 3, writeSlots: 1 });
        cloudApi.reply = () => ({ status: 200, json: [], delayMs: 200 });
        const reads = [proxy.send(call('GET')), proxy.send(call('GET'))];
        expect(outcome(await proxy.send(call('GET')))).toBe('busy');
        const write = proxy.send(call('POST'));
        expect(outcome(await proxy.send(call('POST')))).toBe('busy'); // every slot is taken now
        expect((await Promise.all([...reads, write])).map(outcome)).toEqual(['200', '200', '200']);
        // Never fewer than one read slot.
        const small = make({ maxInFlight: 2, writeSlots: 8 });
        const one = small.send(call('GET'));
        expect(outcome(await small.send(call('GET')))).toBe('busy');
        expect(outcome(await one)).toBe('200');
    });

    it('a call that may wait gets the next free slot, oldest first, ahead of later callers; past its wait it is busy', async () => {
        const proxy = make({ maxInFlight: 1 });
        cloudApi.reply = r => ({ status: 200, json: [r.query.get('n')], delayMs: Number(r.query.get('d') ?? 0) });
        const first = proxy.send(call('GET', { query: 'n=1&d=150' }));
        const second = proxy.send(call('GET', { query: 'n=2&d=50', waitForSlotMs: 2_000 }));
        const third = proxy.send(call('GET', { query: 'n=3', waitForSlotMs: 2_000 }));
        const impatient = proxy.send(call('GET', { query: 'n=4', waitForSlotMs: 50 }));
        expect(outcome(await impatient)).toBe('busy');
        expect(outcome(await first)).toBe('200');
        expect(outcome(await proxy.send(call('GET', { query: 'n=5' })))).toBe('busy'); // the freed slot went to the oldest waiter
        expect((await Promise.all([second, third])).map(outcome)).toEqual(['200', '200']);
        expect(cloudApi.requests.map(r => r.query.get('n'))).toEqual(['1', '2', '3']);
    });

    it(`at most ${WAITING_PER_SLOT} calls per slot wait; closing the proxy releases them as busy`, async () => {
        const proxy = make({ maxInFlight: 1 });
        cloudApi.reply = () => ({ status: 200, json: [], delayMs: 300 });
        const first = proxy.send(call('GET'));
        const waiting = Array.from({ length: WAITING_PER_SLOT }, () => proxy.send(call('GET', { waitForSlotMs: 5_000 })));
        expect(outcome(await proxy.send(call('GET', { waitForSlotMs: 5_000 })))).toBe('busy');
        proxy.onModuleDestroy();
        expect((await Promise.all(waiting)).map(outcome)).toEqual(Array(WAITING_PER_SLOT).fill('busy'));
        await first;
    });
});
