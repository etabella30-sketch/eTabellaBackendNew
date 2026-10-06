/**
 * Path hygiene of the local API host (plan §3.4): on `/authapi`, `/coreapi` and `/realtimeapi` a request the RT data
 * table did not answer (RtDataMiddleware runs first and matches only plain paths) reaches the Nest router, which
 * would route HEAD to GET handlers and decode `%61`, `\`, `.` and `..` before matching a shared controller. The table
 * refuses all of those today, so this middleware answers them `403 use_cloud` before any controller sees them, the
 * answer every unknown cloud-family route gets (LanExceptionFilter). With no controller mounted yet (Phase 4) nothing
 * observable changes; once one is, a controller route cannot be reached by a path the table would have refused.
 *
 * `/uploadapi` and the other cloud bases of cloud-paths.ts are not here: nothing will ever be mounted under them,
 * and the exception filter keeps answering them `use_cloud`.
 */
import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

import { useCloudError } from '../lan/cloud-paths';
import { sendError } from '../lan/edge-http';
import { splitTarget } from '../lan/rt-data/rt-data.middleware';
import { isPlainPath } from '../lan/rt-data/rt-routes';

/** The three URL families the local API host mounts (api.module.ts LOCAL_API_ROUTES), as path prefixes. */
export const LOCAL_API_PREFIXES: readonly string[] = Object.freeze(['/authapi', '/coreapi', '/realtimeapi']);

/** `/coreapi`, `/coreapi/…` (a listed prefix as a whole segment); `/coreapix` is not. */
export function isLocalApiPath(pathname: string): boolean {
    if (typeof pathname !== 'string') return false;
    return LOCAL_API_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/** What the hygiene rule refuses: HEAD (any path), and a path the RT table could never match. */
export function isHygieneRefusal(method: string, rawPath: string): boolean {
    return method === 'HEAD' || !isPlainPath(rawPath);
}

@Injectable()
export class ApiPathHygieneMiddleware implements NestMiddleware {
    private readonly logger = new Logger('LocalApi');

    use(req: Request, res: Response, next: NextFunction): void {
        const target = splitTarget(req.originalUrl ?? req.url);
        if (!target || !isLocalApiPath(target.path)) return next();
        if (isHygieneRefusal(req.method, target.path)) {
            sendError(res, useCloudError(), this.logger, 'api');
            return;
        }
        next();
    }
}
