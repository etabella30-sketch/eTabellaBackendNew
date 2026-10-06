/**
 * The request a shared controller on the local API host is answering (ports/cloud-relay.port.ts ApiRequestContext),
 * kept in an AsyncLocalStorage started by `ApiContextMiddleware` on the three cloud families (api.module.ts), so a
 * relay adapter deep inside a feature's operations port can hand CLOUD_RELAY the real request (its sign-in, cookies
 * and client address) without the controller threading it through. Box-only: shared code never imports this.
 */
import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

import { requestToken } from '../lan/edge-http';
import { splitTarget } from '../lan/rt-data/rt-data.middleware';
import type { ApiRequestContext } from '../ports';
import { isLocalApiPath } from './api-path-hygiene.middleware';

const storage = new AsyncLocalStorage<ApiRequestContext>();

/** The context of the request being answered, or null outside one (a timer, the kernel, a spec). */
export function apiRequestContext(): ApiRequestContext | null {
    return storage.getStore() ?? null;
}

/** Runs `fn` inside a context (specs and local executors that are not on the HTTP path). */
export function runWithApiContext<T>(ctx: ApiRequestContext, fn: () => T): T {
    return storage.run(ctx, fn);
}

@Injectable()
export class ApiContextMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction): void {
        const target = splitTarget(req.originalUrl ?? req.url);
        if (!target || !isLocalApiPath(target.path)) return next();
        storage.run({ req, res, bearer: requestToken(req) }, () => next());
    }
}
