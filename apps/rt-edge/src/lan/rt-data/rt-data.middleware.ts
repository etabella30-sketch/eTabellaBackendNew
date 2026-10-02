/**
 * Mounts the RT data routes (rt-routes.ts) on the box's one origin, beside the static files (lan.module.ts
 * `configureLanMiddleware`). A request under a cloud service base (cloud-paths.ts) whose method and RAW path match
 * the table goes to `RtDataService`; anything else falls through (`next()`), so Nest's 404 becomes the contract's
 * `403 use_cloud` in LanExceptionFilter, exactly as before this table existed.
 */
import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

import { isCloudApiPath } from '../cloud-paths';
import { RtDataService } from './rt-data.service';
import { matchRtRoute } from './rt-routes';

/** `/a/b?x=1` → `{ path: '/a/b', query: 'x=1' }` (the raw request target, nothing decoded or normalised). */
export function splitTarget(target: string | undefined | null): { path: string; query: string } | null {
    if (typeof target !== 'string' || !target.startsWith('/')) return null;
    const q = target.indexOf('?');
    return q < 0 ? { path: target, query: '' } : { path: target.slice(0, q), query: target.slice(q + 1) };
}

@Injectable()
export class RtDataMiddleware implements NestMiddleware {
    constructor(private readonly service: RtDataService) {}

    use(req: Request, res: Response, next: NextFunction): void {
        const target = splitTarget(req.originalUrl ?? req.url);
        if (!target || !isCloudApiPath(target.path)) return next();
        const route = matchRtRoute(req.method, target.path);
        if (!route) return next();
        void this.service.handle(route, req, res, target.query);
    }
}
