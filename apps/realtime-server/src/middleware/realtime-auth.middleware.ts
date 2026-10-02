import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { createHash, timingSafeEqual } from 'crypto';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { DbService } from '@app/global/db/pg/db.service';
import { isUuid } from '../services/utility/safe-path';
import { EdgeRequestAuth, EdgeTokenAuthenticator, isEdgeFamilyToken } from './realtime-edge-token';

/**
 * realtime-server's own HTTP auth. Token checks mirror libs/global JwtMiddleware (Bearer header
 * or `access_token` cookie, JWT_SECRET, Redis `user/<id>` browser binding, `req.isAdmin`), but the
 * identity handling differs: identity fields the client sent are REPLACED with the token user and
 * never added, because the global ValidationPipe runs with forbidNonWhitelisted and would 400 any
 * DTO that does not declare an injected key. Route groups live in realtime-auth.routes.ts.
 */

export interface RealtimeUser {
  userId: string;
  isAdmin: boolean;
}

/** `edge`: set when a venue box's edge token authenticated the request (D22, realtime-edge-token.ts). */
export type RealtimeRequest = Request & { user?: RealtimeUser; isAdmin?: boolean; isService?: boolean; edge?: EdgeRequestAuth };

/** Header the venue (local) realtime app sends with the shared REALTIME_SERVICE_KEY. */
export const SERVICE_KEY_HEADER = 'x-etabella-service-key';

/** RoleMaster id of the per-case "Case Admin" role (same id libs CaseAdminMiddleware checks). */
export const CASE_ADMIN_ROLE_ID = '8632ee5c-e854-411c-b83d-c21656ad39ac';

const IDENTITY_KEYS: readonly string[] = ['nUserid', 'nMasterid'];

/** Replaces top-level identity keys that are already present on `target`; never adds a key. */
export function overwriteIdentity(target: unknown, userId: string, keys: readonly string[] = IDENTITY_KEYS): void {
  if (!target || typeof target !== 'object' || Array.isArray(target)) return;
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(target, key)) (target as any)[key] = userId;
  }
}

/** Constant-time comparison; both sides are hashed first so a length mismatch does not short-circuit. */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(String(a)).digest();
  const hb = createHash('sha256').update(String(b)).digest();
  return timingSafeEqual(ha, hb);
}

export type ServiceKeyState = 'valid' | 'missing' | 'invalid';

export function serviceKeyState(req: Request, configuredKey: string | undefined): ServiceKeyState {
  const raw = req.headers?.[SERVICE_KEY_HEADER];
  const presented = Array.isArray(raw) ? raw[0] : raw;
  if (!presented) return 'missing';
  if (!configuredKey) return 'invalid';
  return safeEqual(presented, configuredKey) ? 'valid' : 'invalid';
}

function routeOf(req: Request): string {
  return String(req.originalUrl || req.url || '').split('?')[0];
}

/**
 * Stable per-route key for log throttling. Express matches routes case-insensitively and with an
 * optional trailing slash, so the raw path is attacker-chosen (/Sync/PushIssue/, /SYNC/pushissue ...).
 * Prefer the matched route pattern when Express has set one; otherwise lower-case the path and
 * strip trailing slashes, which maps every variant that can reach the middleware to one key.
 */
export function routeKeyOf(req: Request): string {
  const pattern = (req as any).route?.path;
  const raw = typeof pattern === 'string' && pattern ? pattern : routeOf(req);
  return raw.toLowerCase().replace(/\/+$/, '') || '/';
}

/** Body for writes, query string for reads: where a route's DTO comes from. */
function paramsOf(req: Request): Record<string, any> {
  const src = req.method === 'GET' ? req.query : req.body;
  return src && typeof src === 'object' ? (src as Record<string, any>) : {};
}

type AuthOutcome =
  | { ok: true; user: RealtimeUser }
  | { ok: false; status: number; message: string };

@Injectable()
export abstract class RealtimeAuthBase implements NestMiddleware {
  protected readonly logger = new Logger('RealtimeAuth');
  private static readonly lastWarn = new Map<string, number>();
  /** Upper bound on throttle entries; far above the ~15 venue routes x 4 key states. */
  static readonly WARN_KEYS_MAX = 500;

  constructor(
    protected readonly rds: RedisDbService,
    protected readonly config: ConfigService,
    protected readonly db: DbService,
  ) { }

  abstract use(req: Request, res: Response, next: NextFunction): Promise<any> | any;

  protected readToken(req: Request): string | undefined {
    return req.headers?.authorization?.split(' ')[1] || (req as any).cookies?.access_token;
  }

  protected async authenticate(req: Request): Promise<AuthOutcome> {
    const token = this.readToken(req);
    if (!token) return { ok: false, status: 403, message: 'A token is required for authentication' };
    // D22: a venue box's edge token (or a box-signed one) is accepted only by RealtimeAuthMiddleware on the RT
    // allowlist (realtime-edge-token.ts). Every other gate refuses it before trying it as a cookie JWT.
    if (isEdgeFamilyToken(token)) return { ok: false, status: 401, message: 'A room sign-in is not accepted here' };

    let decoded: any;
    try {
      decoded = jwt.verify(token, this.config.get('JWT_SECRET'));
    } catch (err) {
      await this.onRejectedToken(token, err);
      return { ok: false, status: 401, message: 'Invalid Token' };
    }

    try {
      const session = JSON.parse(await this.rds.getValue(`user/${decoded.userId}`));
      if (session.id != decoded.broweserId) {
        await this.insertLog(decoded.userId, 3, 'Browser id not Match');
        return { ok: false, status: 401, message: 'Old Token' };
      }
      return { ok: true, user: { userId: decoded.userId, isAdmin: !!session.a } };
    } catch {
      return { ok: false, status: 401, message: 'Old Token' };
    }
  }

  /** Only a correctly signed token may end its user's Redis session; a forged payload could name anyone. */
  private async onRejectedToken(token: string, err: any): Promise<void> {
    let signed: any = null;
    try {
      signed = jwt.verify(token, this.config.get('JWT_SECRET'), { ignoreExpiration: true });
    } catch { /* forged or malformed: nothing to log against or clear */ }
    if (!signed?.userId) return;
    const remark = err?.name === 'TokenExpiredError' ? `${err?.message} at ${err?.expiredAt}` : (err?.message || 'Invalid token');
    await this.insertLog(signed.userId, 4, remark);
    try {
      await this.endBoundSession(signed);
    } catch (error) {
      this.logger.warn(`session cleanup failed: ${error?.message ?? error}`);
    }
  }

  /**
   * Ends the Redis session a failing (but correctly signed) token belongs to, only while Redis
   * still binds the user to that token's browser: a stale token from a browser the user has since
   * replaced (signed in elsewhere) must not log out the live session. Same rule as libs/global
   * JwtMiddleware.endBoundSession and the browser-id check in authenticate().
   */
  private async endBoundSession(signed: any): Promise<void> {
    if (!signed?.userId || signed.broweserId == null) return;
    const key = `user/${signed.userId}`;
    let bound = false;
    try {
      const session = JSON.parse(await this.rds.getValue(key));
      bound = !!session && session.id != null && session.id == signed.broweserId;
    } catch {
      bound = false;
    }
    // Awaited so a Redis failure lands in the caller's catch, not as an unhandled rejection.
    if (bound) await this.rds.deleteValue(key);
  }

  private async insertLog(nMasterid: string, nLCatid: number, cRemark: string): Promise<void> {
    try {
      await this.db.executeRef('log_insert', { nLCatid, nMasterid, cRemark, cType: 'O', jData: { O: this.config.get('ORIGIN') } });
    } catch (error) {
      this.logger.warn(`log_insert failed: ${error?.message ?? error}`);
    }
  }

  protected attachUser(req: Request, user: RealtimeUser): void {
    (req as RealtimeRequest).user = user;
    (req as RealtimeRequest).isAdmin = user.isAdmin;
  }

  protected isServiceKeyEnforced(): boolean {
    return String(this.config.get('REALTIME_SERVICE_KEY_ENFORCE') ?? '').toLowerCase() === 'true';
  }

  /**
   * At most one warning per key per minute: the venue app syncs every few seconds. Anonymous
   * callers choose part of the key, so the map is capped and drops its least recently warned
   * entry (Map keeps insertion order; a re-warned key is moved to the end).
   */
  protected warnThrottled(key: string, message: string): void {
    const map = RealtimeAuthBase.lastWarn;
    const now = Date.now();
    const last = map.get(key);
    if (last !== undefined && now - last < 60_000) return;
    map.delete(key);
    while (map.size >= RealtimeAuthBase.WARN_KEYS_MAX) {
      const oldest = map.keys().next().value;
      if (oldest === undefined) break;
      map.delete(oldest);
    }
    map.set(key, now);
    this.logger.warn(message);
  }

  protected reject(res: Response, outcome: { status: number; message: string }) {
    return res.status(outcome.status).json({ message: outcome.message });
  }
}

/**
 * Browser routes: a valid JWT is required and client-sent nUserid / nMasterid become the token user.
 *
 * D22 (spec §7): a venue box's edge token is accepted here too, only on the RT allowlist and only for that box's
 * cases (realtime-edge-token.ts); its user is never an admin. Any other token takes exactly today's path.
 */
@Injectable()
export class RealtimeAuthMiddleware extends RealtimeAuthBase {
  private edgeTokenAuth?: EdgeTokenAuthenticator;

  /** Built on first use from this middleware's own Redis, config and DB (no new DI dependency). */
  protected get edgeTokens(): EdgeTokenAuthenticator {
    if (!this.edgeTokenAuth) this.edgeTokenAuth = new EdgeTokenAuthenticator({ config: this.config, redis: this.rds, db: this.db });
    return this.edgeTokenAuth;
  }

  async use(req: Request, res: Response, next: NextFunction) {
    const token = this.readToken(req);
    if (token && isEdgeFamilyToken(token)) {
      const edge = await this.edgeTokens.authenticate(req, token);
      if (edge.ok === false) return res.status(edge.status).json({ message: edge.message, cCode: edge.cCode });
      const user: RealtimeUser = { userId: edge.userId, isAdmin: false };
      this.attachUser(req, user);
      (req as RealtimeRequest).edge = edge.edge;
      this.applyIdentity(req, user.userId);
      return next();
    }
    const auth = await this.authenticate(req);
    if (auth.ok === false) return this.reject(res, auth);
    this.attachUser(req, auth.user);
    this.applyIdentity(req, auth.user.userId);
    next();
  }

  protected applyIdentity(req: Request, userId: string): void {
    overwriteIdentity(req.body, userId);
    overwriteIdentity(req.query, userId);
  }
}

/**
 * Transcript / fact / doclink / factsheet routes. Their DTOs all declare nMasterid and their services
 * read it, so this keeps JwtMiddleware's contract of always setting it (body for POST/PUT/DELETE,
 * query for GET) on top of the nUserid overwrite.
 */
@Injectable()
export class RealtimeAuthInjectMiddleware extends RealtimeAuthMiddleware {
  protected applyIdentity(req: Request, userId: string): void {
    super.applyIdentity(req, userId);
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
      if (req.body && typeof req.body === 'object') req.body.nMasterid = userId;
    } else if (req.method === 'GET' && req.query) {
      (req.query as any).nMasterid = userId;
    }
  }
}

/**
 * Routes the venue realtime app calls on the cloud server. Accepts either a valid
 * x-etabella-service-key (constant-time compare against REALTIME_SERVICE_KEY) or a global
 * admin's JWT: the venue app only ever sends the key, and the one browser caller is the
 * admin-only RT Production page (session/sessionend). Any other presented JWT (invalid, or a
 * non-admin user's) is refused in both modes. Until REALTIME_SERVICE_KEY_ENFORCE=true, a call
 * with neither key nor token is logged and allowed so venue installs that predate the key keep
 * syncing.
 */
@Injectable()
export class RealtimeVenueAuthMiddleware extends RealtimeAuthBase {
  async use(req: Request, res: Response, next: NextFunction) {
    const key = serviceKeyState(req, this.config.get('REALTIME_SERVICE_KEY'));
    if (key === 'valid') {
      (req as RealtimeRequest).isService = true;
      return next();
    }

    if (this.readToken(req)) {
      const auth = await this.authenticate(req);
      if (auth.ok === false) return this.reject(res, auth);
      if (!auth.user.isAdmin) return res.status(403).json({ message: 'Admin rights required' });
      this.attachUser(req, auth.user);
      overwriteIdentity(req.body, auth.user.userId);
      overwriteIdentity(req.query, auth.user.userId);
      return next();
    }

    const route = `${req.method} ${routeKeyOf(req)}`;
    if (this.isServiceKeyEnforced()) {
      this.warnThrottled(`reject:${key}:${route}`, `[realtime-auth] rejected ${route} from ${req.ip}: service key ${key}`);
      return res.status(401).json({ message: 'Service key required' });
    }
    this.warnThrottled(`allow:${key}:${route}`,
      `[realtime-auth] transition mode: allowed ${route} from ${req.ip} with ${key} service key (REALTIME_SERVICE_KEY_ENFORCE is not 'true')`);
    next();
  }
}

/**
 * session/getallusers returns every active user's name and email. It needs the service key or a
 * global admin, with no transition window: the venue app's only call to it is commented out.
 */
@Injectable()
export class RealtimeServiceOrAdminMiddleware extends RealtimeAuthBase {
  async use(req: Request, res: Response, next: NextFunction) {
    if (serviceKeyState(req, this.config.get('REALTIME_SERVICE_KEY')) === 'valid') {
      (req as RealtimeRequest).isService = true;
      return next();
    }
    const auth = await this.authenticate(req);
    if (auth.ok === false) return this.reject(res, auth);
    this.attachUser(req, auth.user);
    if (!auth.user.isAdmin) return res.status(403).json({ message: 'Admin rights required' });
    next();
  }
}

/**
 * Routes whose nUserid names the user being looked AT (rt log viewer, connectivity log), not the
 * caller. nUserid is kept as sent; the caller must be a global admin, a case admin of the case in
 * scope (nCaseid, or the case of nSesid), or the target user themself.
 */
@Injectable()
export class RealtimeTargetUserMiddleware extends RealtimeAuthBase {
  async use(req: Request, res: Response, next: NextFunction) {
    const auth = await this.authenticate(req);
    if (auth.ok === false) return this.reject(res, auth);
    this.attachUser(req, auth.user);
    const me = auth.user.userId;
    overwriteIdentity(req.body, me, ['nMasterid']);
    overwriteIdentity(req.query, me, ['nMasterid']);
    if (auth.user.isAdmin) return next();

    const params = paramsOf(req);
    if (params.nUserid && String(params.nUserid).toLowerCase() === String(me).toLowerCase()) return next();

    const nCaseid = isUuid(params.nCaseid) ? params.nCaseid
      : isUuid(params.nSesid) ? await this.caseOfSession(params.nSesid) : null;
    if (nCaseid && (await this.isCaseAdmin(nCaseid, me))) return next();
    return res.status(403).json({ message: 'Admin or case admin rights required' });
  }

  private async caseOfSession(nSesid: string): Promise<string | null> {
    const res: any = await this.db.rowQuery(`SELECT "nCaseid" FROM "RSessionMaster" WHERE "nSesid" = $1 LIMIT 1`, [nSesid]);
    return res?.success ? res.data?.[0]?.nCaseid ?? null : null;
  }

  private async isCaseAdmin(nCaseid: string, nUserid: string): Promise<boolean> {
    const res: any = await this.db.rowQuery(
      `SELECT 1 FROM "TeamRelation" WHERE "nCaseid" = $1 AND "nUserid" = $2 AND "nRoleid" = $3`,
      [nCaseid, nUserid, CASE_ADMIN_ROLE_ID],
    );
    return !!(res?.success && res.data?.length);
  }
}

/**
 * Global-admin gate. Registered after an auth middleware on the same routes; if that did not run,
 * req.user is missing and the request is refused, so a wiring mistake fails closed.
 */
@Injectable()
export class RealtimeAdminMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const user = (req as RealtimeRequest).user;
    if (!user) return res.status(403).json({ message: 'A token is required for authentication' });
    if (!user.isAdmin) return res.status(403).json({ message: 'Admin rights required' });
    next();
  }
}
