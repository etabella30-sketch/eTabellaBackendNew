/**
 * SPEC SUPPORT (never imported by the app): a fake etabella.net realtime API on 127.0.0.1, port 0. It records every
 * request it gets and answers with whatever the spec's `reply` returns: a status and a JSON or raw body, a delay, a
 * redirect, an oversized body, a connection that hangs or is cut. Nothing here reaches a real cloud.
 */
import * as http from 'http';
import type { AddressInfo } from 'net';

export interface FakeCloudRequest {
    readonly method: string;
    /** Path without the query, as received. */
    readonly path: string;
    readonly query: URLSearchParams;
    readonly headers: http.IncomingHttpHeaders;
    readonly body: string;
}

export interface FakeCloudReply {
    readonly status?: number;
    /** Sent as JSON (unless `raw` is given). */
    readonly json?: unknown;
    readonly raw?: string | Buffer;
    readonly headers?: Record<string, string>;
    /** Answer after this many ms. */
    readonly delayMs?: number;
    /** Never answer (the connection stays open until the spec closes the server). */
    readonly hang?: boolean;
    /** Cut the connection without an answer. */
    readonly destroy?: boolean;
    /** Send this many bytes of JSON-ish filler (chunked, no Content-Length). */
    readonly streamBytes?: number;
}

export class FakeCloudApi {
    readonly requests: FakeCloudRequest[] = [];
    reply: (req: FakeCloudRequest) => FakeCloudReply = () => ({ status: 200, json: [] });
    private server: http.Server | null = null;
    private readonly timers = new Set<NodeJS.Timeout>();
    origin = '';

    async start(): Promise<string> {
        this.server = http.createServer((req, res) => {
            const chunks: Buffer[] = [];
            req.on('data', (c: Buffer) => chunks.push(c));
            req.on('end', () => {
                const url = new URL(req.url ?? '/', 'http://fake.invalid');
                const recorded: FakeCloudRequest = {
                    method: req.method ?? '',
                    path: url.pathname,
                    query: url.searchParams,
                    headers: req.headers,
                    body: Buffer.concat(chunks).toString('utf8'),
                };
                this.requests.push(recorded);
                let answer: FakeCloudReply;
                try {
                    answer = this.reply(recorded);
                } catch (err) {
                    answer = { status: 500, json: { message: String(err) } };
                }
                const send = (): void => {
                    if (answer.hang) return;
                    if (answer.destroy) {
                        req.socket.destroy();
                        return;
                    }
                    if (answer.streamBytes) {
                        res.writeHead(answer.status ?? 200, { 'Content-Type': 'application/json', ...(answer.headers ?? {}) });
                        const block = Buffer.alloc(64 * 1024, 0x20);
                        let left = answer.streamBytes;
                        const pump = (): void => {
                            while (left > 0) {
                                const piece = left >= block.length ? block : block.subarray(0, left);
                                left -= piece.length;
                                if (!res.write(piece)) return void res.once('drain', pump);
                            }
                            res.end();
                        };
                        res.on('error', () => undefined);
                        pump();
                        return;
                    }
                    const body = answer.raw !== undefined ? answer.raw : answer.json === undefined ? '' : JSON.stringify(answer.json);
                    const headers: Record<string, string> = {
                        ...(answer.raw === undefined && answer.json !== undefined ? { 'Content-Type': 'application/json; charset=utf-8' } : {}),
                        // Everything a box must NOT pass on to the room.
                        'Set-Cookie': 'cloud_session=secret; HttpOnly',
                        'X-Cloud-Internal': 'leak',
                        ...(answer.headers ?? {}),
                    };
                    res.writeHead(answer.status ?? 200, headers);
                    res.end(body);
                };
                if (answer.delayMs) {
                    const t = setTimeout(() => {
                        this.timers.delete(t);
                        send();
                    }, answer.delayMs);
                    this.timers.add(t);
                } else {
                    send();
                }
            });
        });
        await new Promise<void>(resolve => this.server.listen(0, '127.0.0.1', () => resolve()));
        this.origin = `http://127.0.0.1:${(this.server.address() as AddressInfo).port}`;
        return this.origin;
    }

    /** Requests whose path ends with `suffix` (e.g. `/marknav/all`). */
    calls(suffix: string): FakeCloudRequest[] {
        return this.requests.filter(r => r.path.endsWith(suffix));
    }

    async close(): Promise<void> {
        for (const t of this.timers) clearTimeout(t);
        this.timers.clear();
        if (!this.server) return;
        const server = this.server;
        this.server = null;
        server.closeAllConnections?.();
        await new Promise<void>(resolve => server.close(() => resolve()));
    }
}
