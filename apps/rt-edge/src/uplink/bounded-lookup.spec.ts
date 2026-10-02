/**
 * Review 28: cloud name resolution never occupies libuv's threadpool for long (bounded-lookup.ts), and the box's
 * cloud HTTP client and the ops probe resolve through it. No real DNS: the c-ares side is injected.
 */
import type { LookupAddress } from 'dns';
import * as http from 'http';
import type { AddressInfo, LookupFunction } from 'net';

import { BoundedLookupDeps, boundedLookup, CLOUD_DNS_TIMEOUT_MS, resolveBounded } from './bounded-lookup';
import { CloudNetworkError, createCloudHttp, isNoInternet } from './cloud-http';

const never = (): Promise<string[]> => new Promise(() => undefined);
const fail = (code: string) => (): Promise<string[]> => Promise.reject(Object.assign(new Error(code), { code }));

function deps(over: Partial<BoundedLookupDeps> = {}): BoundedLookupDeps & { fallbacks: string[] } {
    const fallbacks: string[] = [];
    return {
        fallbacks,
        resolve4: async () => ['203.0.113.7'],
        resolve6: fail('ENODATA'),
        fallback: async host => {
            fallbacks.push(host);
            return [{ address: '127.0.0.1', family: 4 }];
        },
        ...over,
    };
}

/** A cancellable c-ares stand-in: answers ETIMEOUT after `ms` like the real query's deadline. */
const timesOut = (host: string, ms: number): Promise<string[]> => new Promise((_, reject) => setTimeout(() => reject(Object.assign(new Error('timeout'), { code: 'ETIMEOUT' })), ms));

function lookupOnce(lookup: LookupFunction, host: string, options: Record<string, unknown>): Promise<{ err: NodeJS.ErrnoException | null; address: string | LookupAddress[]; family?: number }> {
    return new Promise(resolve => lookup(host, options as never, (err, address, family) => resolve({ err, address, family })));
}

describe('bounded cloud DNS lookup (review 28)', () => {
    it('answers an IP literal at once, without asking DNS', async () => {
        const d = deps({ resolve4: never, resolve6: never });
        const res = await lookupOnce(boundedLookup(50, d), '192.0.2.10', {});
        expect(res).toEqual({ err: null, address: '192.0.2.10', family: 4 });
    });

    it('resolves through c-ares (A first, AAAA too), single or all (autoSelectFamily asks all)', async () => {
        const d = deps({ resolve6: async () => ['2001:db8::7'] });
        expect(await lookupOnce(boundedLookup(1_000, d), 'etabella.net', {})).toEqual({ err: null, address: '203.0.113.7', family: 4 });
        expect((await lookupOnce(boundedLookup(1_000, d), 'etabella.net', { all: true })).address).toEqual([
            { address: '203.0.113.7', family: 4 },
            { address: '2001:db8::7', family: 6 },
        ]);
        expect((await lookupOnce(boundedLookup(1_000, d), 'etabella.net', { family: 6 })).address).toBe('2001:db8::7');
        expect(d.fallbacks).toEqual([]);
    });

    it('a black-holed resolver answers EAI_AGAIN within the deadline (no internet), never hangs', async () => {
        const d = deps({ resolve4: timesOut, resolve6: timesOut });
        const t0 = Date.now();
        const res = await lookupOnce(boundedLookup(80, d), 'etabella.net', {});
        expect(Date.now() - t0).toBeLessThan(2_000);
        expect(res.err).toMatchObject({ code: 'EAI_AGAIN' });
        expect(isNoInternet(new CloudNetworkError(res.err!.message, res.err!.code!))).toBe(true);
        expect(d.fallbacks).toEqual([]); // a timeout never falls back to getaddrinfo (it would hang the same way)
        expect(CLOUD_DNS_TIMEOUT_MS).toBeLessThanOrEqual(5_000);
    });

    it('a name DNS does not know falls back to the hosts file (dns.lookup); unknown there too is ENOTFOUND', async () => {
        const d = deps({ resolve4: fail('ENOTFOUND'), resolve6: fail('ENOTFOUND') });
        expect(await lookupOnce(boundedLookup(1_000, d), 'cloud.lab', {})).toEqual({ err: null, address: '127.0.0.1', family: 4 });
        expect(d.fallbacks).toEqual(['cloud.lab']);
        await expect(resolveBounded('nowhere.invalid', 0, 1_000, { ...d, fallback: async () => [] })).rejects.toMatchObject({ code: 'ENOTFOUND' });
    });

    it('the cloud HTTP client resolves the cloud host through its lookup', async () => {
        const server = http.createServer((req, res) => {
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify({ msg: 1, host: req.headers.host }));
        });
        await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
        try {
            const port = (server.address() as AddressInfo).port;
            const asked: string[] = [];
            const lookup: LookupFunction = (host, options, cb) => {
                asked.push(host);
                boundedLookup(1_000, deps({ resolve4: async () => ['127.0.0.1'] }))(host, options, cb);
            };
            const res = await createCloudHttp({ lookup })({ method: 'GET', url: `http://cloud.box-test:${port}/edge/ping` });
            expect(res.status).toBe(200);
            expect(asked).toEqual(['cloud.box-test']);
        } finally {
            await new Promise(resolve => server.close(resolve));
        }
    });
});
