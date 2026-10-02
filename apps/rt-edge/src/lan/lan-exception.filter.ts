/**
 * The box's catch-all for anything a controller did not answer itself (the LAN controllers catch their own errors):
 * Nest's 404 for an unknown route, a body the JSON parser refused, an error thrown by the static-file middleware. It
 * answers in the contract envelope (`{msg:-1, error, message}`), so the FE's `edgeCallFailure` reads every box reply
 * the same way, and with `Cache-Control: no-store` (CONTRACTS.md §1). Registered app-wide (APP_FILTER) by the LAN
 * module: the LAN owns the box's whole HTTP surface. Socket errors are not HTTP and are left to the gateway.
 *
 * An unknown route under a cloud service base (`/realtimeapi/…`, `/coreapi/…`, cloud-paths.ts) is not "no such
 * route" but "the box never serves it": `use_cloud` 403 `{useCloud:true}` (spec §8.2, CONTRACTS.md §2.4), any method.
 *
 * A body over the parser's limit (body-parser's 413 `entity.too.large`, main.ts EDGE_BODY_LIMIT_BYTES) is
 * `payload_too_large` 413, not a malformed request (CONTRACTS.md §3), the same code the RT write path answers for a
 * body over its own 1 MiB check (rt-data.service.ts).
 */
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';

import { EdgePortError } from '../ports';
import { isCloudApiPath, useCloudError } from './cloud-paths';
import { sendError } from './edge-http';

type HttpMappedCode = 'not_found' | 'unauthenticated' | 'payload_too_large' | 'invalid_request' | 'server_error';

/** The contract code for an HTTP status Nest or Express produced. */
export function edgeCodeOfHttpStatus(status: number): HttpMappedCode {
    if (status === 404 || status === 405) return 'not_found';
    if (status === 401) return 'unauthenticated';
    if (status === 413) return 'payload_too_large';
    if (status >= 400 && status < 500) return 'invalid_request';
    return 'server_error';
}

const HTTP_CODE_MESSAGE: Readonly<Record<Exclude<HttpMappedCode, 'server_error'>, string>> = {
    not_found: 'no such route',
    unauthenticated: 'the request was refused',
    payload_too_large: 'the request body is larger than the box accepts',
    invalid_request: 'the request was refused',
};

/**
 * Map anything thrown on the HTTP path to an `EdgePortError` (unknown errors stay unknown: a generic 500). `pathname`
 * (when known) turns a missing route under a cloud service base into `use_cloud`.
 */
export function toEdgeError(exception: unknown, pathname: string | null = null): unknown {
    if (exception instanceof EdgePortError) return exception;
    const status =
        exception instanceof HttpException
            ? exception.getStatus()
            : ((exception as { status?: unknown })?.status ?? (exception as { statusCode?: unknown })?.statusCode);
    if (typeof status !== 'number') return exception;
    const code = edgeCodeOfHttpStatus(status);
    if (code === 'server_error') return exception;
    if (code === 'not_found' && pathname !== null && isCloudApiPath(pathname)) return useCloudError();
    return new EdgePortError(code, HTTP_CODE_MESSAGE[code]);
}

/** The decoded-enough path of a request (no query); null when it cannot be read. */
export function requestPathname(req: Pick<Request, 'originalUrl' | 'url'> | null | undefined): string | null {
    const raw = req?.originalUrl ?? req?.url;
    if (typeof raw !== 'string' || !raw) return null;
    try {
        return new URL(raw, 'http://box.invalid').pathname;
    } catch {
        return null;
    }
}

@Catch()
export class LanExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger('LanHttp');

    catch(exception: unknown, host: ArgumentsHost): void {
        if (host.getType() !== 'http') {
            this.logger.error(`unhandled ${host.getType()} error: ${exception instanceof Error ? exception.message : String(exception)}`);
            return;
        }
        const http = host.switchToHttp();
        const res = http.getResponse<Response>();
        sendError(res, toEdgeError(exception, requestPathname(http.getRequest<Request>())), this.logger, 'http');
    }
}
