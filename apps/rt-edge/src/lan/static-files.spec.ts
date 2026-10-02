import * as fs from 'fs';
import * as http from 'http';
import type { AddressInfo } from 'net';
import * as os from 'os';
import * as path from 'path';

import * as express from 'express';

import type { BoxConfig } from '../ports';
import { EdgeStaticFiles } from './static-files';

jest.setTimeout(20_000);

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/** The static middleware, recording every file stream it opens. */
class WatchedStaticFiles extends EdgeStaticFiles {
    readonly opened: fs.ReadStream[] = [];

    protected override openFile(file: string): fs.ReadStream {
        const stream = super.openFile(file);
        this.opened.push(stream);
        return stream;
    }
}

function get(url: string, headers: Record<string, string> = {}, method = 'GET'): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: Buffer }> {
    return new Promise((resolve, reject) => {
        const req = http.request(url, { method, headers }, res => {
            const parts: Buffer[] = [];
            res.on('data', (chunk: Buffer) => parts.push(chunk));
            res.on('end', () => resolve({ status: res.statusCode ?? 0, headers: res.headers, body: Buffer.concat(parts) }));
        });
        req.on('error', reject);
        req.end();
    });
}

describe('LAN static files: the file stream ends with its response (spec §8.1)', () => {
    let root: string;
    let server: http.Server;
    let files: WatchedStaticFiles;
    let base: string;
    const big = Buffer.alloc(24 * 1024 * 1024, 7); // a large, non-compressible asset: streamed, never gzipped

    beforeAll(async () => {
        root = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-edge-static-'));
        fs.writeFileSync(path.join(root, 'index.html'), '<!doctype html><title>eTabella</title>');
        fs.writeFileSync(path.join(root, 'poster.png'), big);
        fs.writeFileSync(path.join(root, 'inter.woff2'), Buffer.from([0x77, 0x4f, 0x46, 0x32, 1, 2, 3]));
        files = new WatchedStaticFiles({ paths: { publicDir: root } } as unknown as BoxConfig);
        const app = express();
        app.use((req, res, next) => files.use(req, res, next));
        app.use((_req, res) => res.status(404).end());
        server = app.listen(0, '127.0.0.1');
        await new Promise(resolve => server.once('listening', resolve));
        base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    });

    afterAll(async () => {
        await new Promise(resolve => server.close(resolve));
        fs.rmSync(root, { recursive: true, force: true });
    });

    it('a client that aborts mid-transfer releases the file (the stream is destroyed, its descriptor closed)', async () => {
        const before = files.opened.length;
        await new Promise<void>((resolve, reject) => {
            const req = http.get(`${base}/poster.png`, res => {
                res.once('data', () => {
                    res.pause();
                    req.destroy(); // the device went away after the first chunk
                    resolve();
                });
            });
            req.on('error', err => ((err as NodeJS.ErrnoException).code === 'ECONNRESET' ? undefined : reject(err)));
        });
        expect(files.opened.length).toBe(before + 1);
        const stream = files.opened[before];
        const deadline = Date.now() + 3000;
        while (!stream.destroyed && Date.now() < deadline) await sleep(10);
        expect(stream.destroyed).toBe(true);
        expect(stream.bytesRead).toBeLessThan(big.length); // it never read the whole file for nobody
        await new Promise<void>(resolve => (stream.closed ? resolve() : stream.once('close', () => resolve())));
    });

    it('a complete GET still streams the whole file and closes it; HEAD and a matching ETag open nothing', async () => {
        const full = await get(`${base}/poster.png`);
        expect([full.status, full.headers['content-type'], full.headers['content-length'], full.body.equals(big)]).toEqual([200, 'image/png', String(big.length), true]);
        const stream = files.opened[files.opened.length - 1];
        const deadline = Date.now() + 3000;
        while (!stream.destroyed && Date.now() < deadline) await sleep(10);
        expect(stream.destroyed).toBe(true);

        const opened = files.opened.length;
        const head = await get(`${base}/inter.woff2`, {}, 'HEAD');
        expect([head.status, head.headers['content-length'], head.body.length]).toEqual([200, '7', 0]);
        const again = await get(`${base}/inter.woff2`, { 'If-None-Match': String(head.headers.etag) });
        expect([again.status, again.body.length]).toEqual([304, 0]);
        expect(files.opened.length).toBe(opened);
        expect((await get(`${base}/inter.woff2`)).body).toEqual(Buffer.from([0x77, 0x4f, 0x46, 0x32, 1, 2, 3]));
    });
});
