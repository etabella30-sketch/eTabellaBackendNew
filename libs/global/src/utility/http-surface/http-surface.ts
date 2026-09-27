import type { NextFunction, Request, Response } from 'express';

/**
 * Plain Express handlers every Nest HTTP app installs in its main.ts right after
 * NestFactory.create(). app.use() before app.init() puts a handler on the Express stack at once, so
 * it runs ahead of every Nest middleware and controller route (both registered later, in app.init()).
 */

/** Methods these servers answer (CORS preflight OPTIONS included); sent as `Allow` with the 405. */
export const ALLOWED_METHODS = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';

/**
 * Nest applies route-scoped middleware (`consumer.apply(JwtMiddleware).forRoutes(Controller)` and
 * `forRoutes({ path, method: RequestMethod.GET })`) behind a `req.method === <route method>` check
 * (@nestjs/core middleware-module registerHandler), but Express dispatches HEAD to GET routes. A HEAD
 * request therefore skipped JwtMiddleware while the GET handler still ran: no token needed, and the
 * query's own nMasterid reached the handler (JwtMiddleware only overwrites it for GET/POST/PUT/DELETE);
 * the status and Content-Length leaked. No client sends HEAD to these servers, so it is refused for
 * the whole app.
 */
export function refuseHeadRequests(req: Request, res: Response, next: NextFunction): void {
  if (req.method !== 'HEAD') return next();
  res.setHeader('Allow', ALLOWED_METHODS);
  res.status(405).end();
}

/** Installs the guards above. main.ts calls it straight after NestFactory.create(), before anything else. */
export function installHttpSurfaceGuards(app: { use: (...handlers: any[]) => unknown }): void {
  app.use(refuseHeadRequests);
}
