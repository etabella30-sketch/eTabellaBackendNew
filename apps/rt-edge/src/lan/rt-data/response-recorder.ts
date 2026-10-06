/**
 * The slice of an Express `Response` the RT data layer writes to (rt-data.service.ts sendRtJson / sendRtRaw,
 * edge-http.ts sendOk / sendError), recorded instead of sent: status, headers and bytes. `RtDataService.call` (the
 * CLOUD_RELAY port) runs the unchanged `handle()` against one of these, so a relay adapter gets exactly the answer
 * the table route would have sent, without a second implementation of the route.
 */
import type { RelayAnswer } from '../../ports';

export class ResponseRecorder {
    private statusCode = 200;
    private readonly headerMap: Record<string, string> = {};
    private readonly chunks: Buffer[] = [];
    private ended = false;

    get headersSent(): boolean {
        return this.ended;
    }

    status(code: number): this {
        this.statusCode = code;
        return this;
    }

    setHeader(name: string, value: string | number | readonly string[]): this {
        this.headerMap[name.toLowerCase()] = Array.isArray(value) ? value.join(', ') : String(value);
        return this;
    }

    getHeader(name: string): string | undefined {
        return this.headerMap[name.toLowerCase()];
    }

    json(body: unknown): this {
        if (this.ended) return this;
        this.setHeader('Content-Type', 'application/json; charset=utf-8');
        return this.end(Buffer.from(JSON.stringify(body), 'utf8'));
    }

    send(body?: unknown): this {
        if (Buffer.isBuffer(body) || typeof body === 'string' || body === undefined) return this.end(body as Buffer | string | undefined);
        return this.json(body);
    }

    end(chunk?: Buffer | string): this {
        if (this.ended) return this;
        if (chunk !== undefined) this.chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk), 'utf8'));
        this.ended = true;
        return this;
    }

    answer(): RelayAnswer {
        const raw = Buffer.concat(this.chunks);
        let body: unknown = null;
        if (raw.length) {
            try {
                body = JSON.parse(raw.toString('utf8'));
            } catch {
                body = null;
            }
        }
        return { status: this.statusCode, headers: { ...this.headerMap }, body, raw };
    }
}
