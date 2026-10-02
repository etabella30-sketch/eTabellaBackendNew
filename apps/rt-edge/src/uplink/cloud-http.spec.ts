import * as http from 'http';
import type { AddressInfo } from 'net';

import { CloudNetworkError, isNoInternet, nodeCloudHttp } from './cloud-http';

describe('uplink cloud HTTP client (node:http/https, loopback only)', () => {
    let server: http.Server;
    let base: string;
    const seen: Array<{ method: string; url: string; headers: http.IncomingHttpHeaders; body: Buffer }> = [];

    beforeAll(async () => {
        server = http.createServer((req, res) => {
            const chunks: Buffer[] = [];
            req.on('data', c => chunks.push(c));
            req.on('end', () => {
                seen.push({ method: req.method!, url: req.url!, headers: req.headers, body: Buffer.concat(chunks) });
                if (req.url === '/json') {
                    res.writeHead(200, { 'content-type': 'application/json' });
                    res.end(JSON.stringify({ msg: 1, nonce: 'abc' }));
                } else if (req.url === '/text') {
                    res.writeHead(503);
                    res.end('Service Unavailable');
                } else if (req.url === '/broken-json') {
                    res.writeHead(200);
                    res.end('{not json');
                } else if (req.url === '/slow') {
                    setTimeout(() => res.end('late'), 2_000);
                } else {
                    res.writeHead(201);
                    res.end();
                }
            });
        });
        await new Promise<void>(resolve => server.listen(0, '127.0.0.1', () => resolve()));
        base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    });
    afterAll(async () => {
        server.closeAllConnections?.();
        await new Promise<void>(resolve => server.close(() => resolve()));
    });

    it('parses JSON replies, keeps the text of others, and sends JSON or raw bodies with their headers', async () => {
        expect(await nodeCloudHttp({ method: 'GET', url: `${base}/json` })).toEqual({ status: 200, json: { msg: 1, nonce: 'abc' }, text: '{"msg":1,"nonce":"abc"}' });
        expect(await nodeCloudHttp({ method: 'GET', url: `${base}/text` })).toEqual({ status: 503, json: null, text: 'Service Unavailable' });
        expect((await nodeCloudHttp({ method: 'GET', url: `${base}/broken-json` })).json).toBeNull();
        await nodeCloudHttp({ method: 'POST', url: `${base}/post`, body: { code: 'K7' }, headers: { authorization: 'Bearer t' } });
        const post = seen.find(s => s.url === '/post')!;
        expect(post.headers['content-type']).toBe('application/json');
        expect(post.headers.authorization).toBe('Bearer t');
        expect(JSON.parse(post.body.toString())).toEqual({ code: 'K7' });
        await nodeCloudHttp({ method: 'PUT', url: `${base}/put`, body: Buffer.from([1, 2, 3]), headers: { 'content-type': 'application/octet-stream' } });
        const put = seen.find(s => s.url === '/put')!;
        expect([...put.body]).toEqual([1, 2, 3]);
        expect(put.headers['content-length']).toBe('3');
    });

    it('turns a refused connection, a timeout and a bad URL into CloudNetworkError; only DNS/route failures mean "no internet"', async () => {
        const closed = http.createServer();
        await new Promise<void>(resolve => closed.listen(0, '127.0.0.1', () => resolve()));
        const port = (closed.address() as AddressInfo).port;
        await new Promise<void>(resolve => closed.close(() => resolve()));
        const refused = await nodeCloudHttp({ method: 'GET', url: `http://127.0.0.1:${port}/` }).catch(e => e);
        expect(refused).toBeInstanceOf(CloudNetworkError);
        expect(refused.code).toBe('ECONNREFUSED');
        expect(isNoInternet(refused)).toBe(false);
        const slow = await nodeCloudHttp({ method: 'GET', url: `${base}/slow`, timeoutMs: 100 }).catch(e => e);
        expect(slow).toBeInstanceOf(CloudNetworkError);
        expect(slow.code).toBe('ETIMEDOUT');
        expect(isNoInternet(slow)).toBe(true);
        const bad = await nodeCloudHttp({ method: 'GET', url: 'not a url' }).catch(e => e);
        expect(bad).toMatchObject({ code: 'EINVAL' });
        expect(isNoInternet(new CloudNetworkError('x', 'ENOTFOUND'))).toBe(true);
        expect(isNoInternet(new Error('ENOTFOUND'))).toBe(false);
    });
});
