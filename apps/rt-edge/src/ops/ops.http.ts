/**
 * The LAN HTTP conventions for the ops routes (CONTRACTS.md §1, §2.4; ports/lan.port.ts):
 * - `EdgeBoxAdminGuard`: `Authorization: Bearer` → `AuthPort.authenticate` (with the request context) →
 *   `AuthPort.requireBoxAdmin`; the principal and context ride on the request. 401 only for sign-in problems.
 * - `EdgeReplyInterceptor`: `msg: 1` on every JSON success body; `Cache-Control: no-store` on every reply.
 * - `EdgeErrorFilter`: any thrown value → `edgeErrorResponse(err)` (`{msg:-1, error, message, …extra}` with the
 *   contract status); unknown errors never leak their message.
 */
import {
    ArgumentsHost,
    CallHandler,
    CanActivate,
    Catch,
    createParamDecorator,
    ExceptionFilter,
    ExecutionContext,
    HttpException,
    Inject,
    Injectable,
    Logger,
    NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { map, Observable } from 'rxjs';

import { CONNECTIVITY_LOG_MAX_LIMIT, ConnectivityLogFilter, ConnectivityLogQuery, EDGE_DEVICE_COOKIE } from '../contracts';
import { AUTH_PORT, AuthPort, bearerToken, EdgePortError, edgeErrorResponse, EdgePrincipal, EdgeRequestContext, isEdgePortError } from '../ports';

/** What the guard attaches to the request. */
export interface EdgeAuthedRequest extends Request {
    edgePrincipal?: EdgePrincipal;
    edgeContext?: EdgeRequestContext;
}

/** `::ffff:192.168.1.5` → `192.168.1.5`; null when unknown. */
export function clientIp(req: Pick<Request, 'socket'>): string | null {
    const raw = req.socket?.remoteAddress ?? null;
    if (!raw) return null;
    return raw.startsWith('::ffff:') && raw.includes('.') ? raw.slice(7) : raw;
}

/** The request context of the LAN layer (never trusted for identity). */
export function requestContext(req: Request): EdgeRequestContext {
    const ua = req.headers?.['user-agent'];
    const cookies = (req as Request & { cookies?: Record<string, unknown> }).cookies;
    const device = cookies && typeof cookies[EDGE_DEVICE_COOKIE] === 'string' ? (cookies[EDGE_DEVICE_COOKIE] as string) : null;
    return { ip: clientIp(req), userAgent: typeof ua === 'string' ? ua : null, deviceCookie: device };
}

@Injectable()
export class EdgeBoxAdminGuard implements CanActivate {
    constructor(@Inject(AUTH_PORT) private readonly auth: AuthPort) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest<EdgeAuthedRequest>();
        const ctx = requestContext(req);
        const principal = await this.auth.authenticate(bearerToken(req.headers?.authorization), ctx);
        this.auth.requireBoxAdmin(principal);
        req.edgePrincipal = principal;
        req.edgeContext = ctx;
        return true;
    }
}

/** The verified box-admin principal (set by EdgeBoxAdminGuard). */
export const EdgeCaller = createParamDecorator((_data: unknown, context: ExecutionContext): EdgePrincipal => {
    const principal = context.switchToHttp().getRequest<EdgeAuthedRequest>().edgePrincipal;
    if (!principal) throw new EdgePortError('unauthenticated', 'no verified principal on the request');
    return principal;
});

/** The request context (client IP, user agent, device cookie) captured by EdgeBoxAdminGuard. */
export const EdgeContext = createParamDecorator((_data: unknown, context: ExecutionContext): EdgeRequestContext => {
    const req = context.switchToHttp().getRequest<EdgeAuthedRequest>();
    return req.edgeContext ?? requestContext(req);
});

@Injectable()
export class EdgeReplyInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const res = context.switchToHttp().getResponse<Response>();
        res.setHeader('Cache-Control', 'no-store');
        return next.handle().pipe(
            map(data => {
                if (data === undefined || data === null || Buffer.isBuffer(data) || typeof data !== 'object' || Array.isArray(data)) return data;
                return Object.assign({ msg: 1 }, data, { msg: 1 });
            }),
        );
    }
}

/** Nest's own HTTP exceptions (a body the JSON parser refused, …) mapped onto contract codes. */
function fromHttpException(err: HttpException): EdgePortError {
    const status = err.getStatus();
    if (status === 404) return new EdgePortError('not_found', 'not found');
    if (status >= 400 && status < 500) return new EdgePortError('invalid_request', 'malformed request');
    return new EdgePortError('server_error', 'internal error');
}

@Catch()
export class EdgeErrorFilter implements ExceptionFilter {
    private readonly logger = new Logger('EdgeOpsHttp');

    catch(err: unknown, host: ArgumentsHost): void {
        const res = host.switchToHttp().getResponse<Response>();
        const mapped = isEdgePortError(err) ? err : err instanceof HttpException ? fromHttpException(err) : err;
        if (!isEdgePortError(mapped)) this.logger.error(`unhandled error on an ops route: ${err instanceof Error ? err.stack ?? err.message : String(err)}`);
        else if ((mapped as EdgePortError & { notImplemented?: boolean }).notImplemented) this.logger.warn(mapped.message);
        const { status, body } = edgeErrorResponse(mapped);
        if (res.headersSent) return;
        res.status(status).setHeader('Cache-Control', 'no-store');
        res.json(body);
    }
}

// ---------------------------------------------------------------------------------------------------------------
// Query and body parsing (strings from Express; contract errors: invalid_request)
// ---------------------------------------------------------------------------------------------------------------

const FILTERS: readonly ConnectivityLogFilter[] = ['all', 'problems', 'transmitter', 'cloud'];

function single(query: Record<string, unknown>, key: string): string | undefined {
    const v = query[key];
    if (v === undefined) return undefined;
    if (typeof v !== 'string') throw new EdgePortError('invalid_request', `${key} must be given once`);
    return v;
}

/** A positive integer query value 1–CONNECTIVITY_LOG_MAX_LIMIT; undefined when absent. */
export function parseLimit(raw: string | undefined): number | undefined {
    if (raw === undefined) return undefined;
    if (!/^\d{1,4}$/.test(raw)) throw new EdgePortError('invalid_request', 'limit must be an integer');
    const n = Number(raw);
    if (n < 1 || n > CONNECTIVITY_LOG_MAX_LIMIT) throw new EdgePortError('invalid_request', `limit must be 1-${CONNECTIVITY_LOG_MAX_LIMIT}`);
    return n;
}

/** `GET /edge/local/ops/log?filter&day&q&before&after&limit` → `ConnectivityLogQuery`. Unknown keys are ignored. */
export function parseLogQuery(query: unknown): ConnectivityLogQuery {
    const q = (query && typeof query === 'object' ? query : {}) as Record<string, unknown>;
    const filter = single(q, 'filter');
    if (filter !== undefined && !FILTERS.includes(filter as ConnectivityLogFilter)) throw new EdgePortError('invalid_request', 'unknown filter');
    const out: { -readonly [K in keyof ConnectivityLogQuery]: ConnectivityLogQuery[K] } = {};
    if (filter !== undefined) out.filter = filter as ConnectivityLogFilter;
    const day = single(q, 'day');
    if (day !== undefined && day !== '') out.day = day;
    const text = single(q, 'q');
    if (text !== undefined && text.trim() !== '') out.q = text;
    const before = single(q, 'before');
    if (before !== undefined && before !== '') out.before = before;
    const after = single(q, 'after');
    if (after !== undefined && after !== '') out.after = after;
    const limit = parseLimit(single(q, 'limit'));
    if (limit !== undefined) out.limit = limit;
    return out;
}

/** `?before&limit` of the tries route. */
export function parseTriesQuery(query: unknown): { readonly before: string | null; readonly limit: number | null } {
    const q = (query && typeof query === 'object' ? query : {}) as Record<string, unknown>;
    const before = single(q, 'before');
    return { before: before === undefined || before === '' ? null : before, limit: parseLimit(single(q, 'limit')) ?? null };
}

/** POST bodies documented as `{}`: absent or an object; anything else is malformed. */
export function expectEmptyBody(body: unknown): void {
    if (body === undefined || body === null) return;
    if (typeof body !== 'object' || Array.isArray(body)) throw new EdgePortError('invalid_request', 'the body must be an object');
}

/** A `:id` path segment (decoded by Express): 1–200 characters. */
export function pathId(raw: unknown): string {
    if (typeof raw !== 'string' || raw.length === 0 || raw.length > 200) throw new EdgePortError('invalid_request', 'bad id');
    return raw;
}
