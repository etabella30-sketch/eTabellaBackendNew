import type { NextFunction, Request, Response } from 'express';

/**
 * Plain Express handlers that coreapi's main.ts installs right after NestFactory.create().
 * app.use() before init registers them on the Express instance at once, so they run ahead of every
 * Nest middleware and controller route (both registered later, in app.init()).
 */

/** Methods this server answers (CORS preflight OPTIONS included). */
export const ALLOWED_METHODS = 'GET, POST, PUT, DELETE, OPTIONS';

/**
 * Nest runs method-scoped middleware (every `forRoutes(Controller)`, JwtMiddleware included) behind
 * a `req.method === 'GET'` check, but Express dispatches HEAD to GET routes. A HEAD request therefore
 * skipped JwtMiddleware while the GET handler still ran, with no token and with whatever nMasterid
 * the query named (JwtMiddleware only overwrites it for GET/POST/PUT/DELETE). No client sends HEAD
 * to coreapi, so it is refused for the whole app.
 */
export function refuseHeadRequests(req: Request, res: Response, next: NextFunction) {
    if (req.method !== 'HEAD') return next();
    res.setHeader('Allow', ALLOWED_METHODS);
    res.status(405).end();
}

/** Installs the guards above; main.ts calls it before anything else is added to the app. */
export function installHttpSurfaceGuards(app: { use: (...handlers: any[]) => unknown }): void {
    app.use(refuseHeadRequests);
}
