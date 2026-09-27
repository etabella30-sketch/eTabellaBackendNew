import { INestApplicationContext, Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import * as jwt from 'jsonwebtoken';
import { createHash, timingSafeEqual } from 'crypto';

/**
 * Socket.io connection-time authentication, shared by socket-app and realtime-server.
 *
 * Every socket gets `socket.data = { kind, userId?, isAdmin? }` before any handler runs:
 * - 'user'      a browser that presented a valid JWT still bound to its browser in Redis
 *               (same checks as JwtMiddleware / WsJwtGuard);
 * - 'service'   a server-side emitter (venue app, feed-replay tools) that presented REALTIME_SERVICE_KEY;
 * - 'anonymous' no usable credential. Allowed only while WS_AUTH_ENFORCE is not 'true' (transition),
 *               so older clients keep working; handlers fall back to the client-sent user id for these.
 * A credential that is presented but wrong is refused when enforcing; during transition it is logged and
 * the socket is treated as anonymous, which is exactly how it connected before this change.
 */

export type WsKind = 'user' | 'service' | 'anonymous';

export interface WsIdentity {
  kind: WsKind;
  userId?: string;
  isAdmin?: boolean;
}

export interface WsAuthDeps {
  jwtSecret: string | undefined;
  serviceKey?: string | undefined;
  /** Redis GET; resolves to the stored JSON string (or null). */
  getValue: (key: string) => Promise<any>;
}

/** `degraded` (transition only): why a presented credential was ignored and the socket let in as anonymous. */
export type WsAuthResult = { ok: true; identity: WsIdentity; degraded?: string } | { ok: false; reason: string };

interface HandshakeLike {
  auth?: Record<string, any>;
  query?: Record<string, any>;
  headers?: Record<string, any>;
}

const first = (v: any): string | undefined => {
  const s = Array.isArray(v) ? v[0] : v;
  return typeof s === 'string' && s.trim() ? s.trim() : undefined;
};

function cookieValue(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) {
      try {
        return decodeURIComponent(part.slice(i + 1).trim()) || undefined;
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
}

/** Token lookup order: `auth.token`, `query.token`, `Authorization: Bearer`, `access_token` cookie. */
export function handshakeToken(h: HandshakeLike): string | undefined {
  const fromAuth = first(h.auth?.token);
  if (fromAuth) return fromAuth;
  const fromQuery = first(h.query?.token);
  if (fromQuery) return fromQuery;
  const header = first(h.headers?.authorization);
  if (header) return header.startsWith('Bearer ') ? header.slice(7).trim() || undefined : header;
  return cookieValue(first(h.headers?.cookie), 'access_token');
}

export function handshakeServiceKey(h: HandshakeLike): string | undefined {
  return first(h.auth?.serviceKey) ?? first(h.headers?.['x-etabella-service-key']);
}

/** Constant-time comparison; both sides are hashed first so a length mismatch does not short-circuit. */
export function wsSafeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(String(a)).digest();
  const hb = createHash('sha256').update(String(b)).digest();
  return timingSafeEqual(ha, hb);
}

export function wsAuthEnforced(env: { get(key: string): any } | NodeJS.ProcessEnv = process.env): boolean {
  const raw = typeof (env as any).get === 'function' ? (env as any).get('WS_AUTH_ENFORCE') : (env as any).WS_AUTH_ENFORCE;
  return String(raw ?? '').trim().toLowerCase() === 'true';
}

export async function authenticateHandshake(h: HandshakeLike, deps: WsAuthDeps, enforce: boolean): Promise<WsAuthResult> {
  const checked = await checkCredential(h, deps);
  if (checked.ok) return checked;
  const reason = (checked as { reason: string }).reason;
  if (enforce) return { ok: false, reason };
  // Transition: a client that sent no credential, or one that no longer verifies (the legacy app keeps
  // expired tokens; a misconfigured JWT_SECRET/service key), connects exactly as it did before this change.
  // That grants nothing an omitted credential would not, and keeps every existing client working.
  return { ok: true, identity: { kind: 'anonymous' }, degraded: reason === 'unauthorized' ? undefined : reason };
}

async function checkCredential(h: HandshakeLike, deps: WsAuthDeps): Promise<WsAuthResult> {
  const serviceKey = handshakeServiceKey(h);
  if (serviceKey) {
    if (deps.serviceKey && wsSafeEqual(serviceKey, deps.serviceKey)) return { ok: true, identity: { kind: 'service' } };
    return { ok: false, reason: 'invalid service key' };
  }

  const token = handshakeToken(h);
  if (token) {
    if (!deps.jwtSecret) return { ok: false, reason: 'server has no JWT_SECRET' };
    let decoded: any;
    try {
      decoded = jwt.verify(token, deps.jwtSecret);
    } catch {
      return { ok: false, reason: 'invalid token' };
    }
    const userId = first(decoded?.userId);
    if (!userId) return { ok: false, reason: 'invalid token' };
    try {
      const bound = JSON.parse(await deps.getValue(`user/${userId}`));
      if (!bound || bound.id !== decoded.broweserId) return { ok: false, reason: 'old token' };
      return { ok: true, identity: { kind: 'user', userId, isAdmin: !!bound.a } };
    } catch {
      return { ok: false, reason: 'old token' };
    }
  }

  return { ok: false, reason: 'unauthorized' };
}

/** The verified user id, or null for service/anonymous sockets. */
export function wsVerifiedUserId(client: { data?: any }): string | null {
  const d = client?.data;
  return d?.kind === 'user' && typeof d.userId === 'string' ? d.userId : null;
}

/**
 * The user id a handler should act as: the verified id for a 'user' socket; for an 'anonymous'
 * socket (transition mode only) the id the client claims; null for a 'service' socket or when
 * nothing is known.
 */
export function wsActingUserId(client: { data?: any }, claimed?: unknown): string | null {
  const verified = wsVerifiedUserId(client);
  if (verified) return verified;
  if (client?.data?.kind === 'anonymous') {
    const c = first(claimed);
    return c ?? null;
  }
  return null;
}

export const isServiceSocket = (client: { data?: any }): boolean => client?.data?.kind === 'service';
export const isAnonymousSocket = (client: { data?: any }): boolean => client?.data?.kind === 'anonymous';

const warned = new Map<string, number>();
/** At most one warning per key per minute. */
export function wsWarnThrottled(logger: { warn(msg: string): any }, key: string, msg: string): void {
  const now = Date.now();
  if ((warned.get(key) ?? 0) > now - 60_000) return;
  warned.set(key, now);
  logger.warn(msg);
}

/**
 * IoAdapter that installs the connection middleware on every server/namespace Nest creates
 * (including the shared AppGateway on /socket.io), so no gateway can be reached unauthenticated.
 */
export class WsAuthIoAdapter extends IoAdapter {
  private readonly logger = new Logger('ws-auth');
  private readonly installed = new WeakSet<object>();

  constructor(app: INestApplicationContext | any, private readonly deps: () => WsAuthDeps, private readonly enforce: () => boolean) {
    super(app);
  }

  create(port: number, options?: any): any {
    const server = super.create(port, options);
    if (server && typeof server.use === 'function' && !this.installed.has(server)) {
      this.installed.add(server);
      server.use((socket: any, next: (err?: Error) => void) => {
        const enforce = this.enforce();
        authenticateHandshake(socket.handshake ?? {}, this.deps(), enforce)
          .then((res) => {
            if (!res.ok) {
              const reason = (res as { reason: string }).reason;
              wsWarnThrottled(this.logger, `refuse:${reason}`, `[ws-auth] refused socket: ${reason}`);
              return next(new Error('unauthorized'));
            }
            const { identity, degraded } = res as { identity: WsIdentity; degraded?: string };
            socket.data = { ...(socket.data || {}), ...identity };
            if (degraded) {
              wsWarnThrottled(this.logger, `degraded:${degraded}`, `[ws-auth] transition mode: ${degraded}, accepted as anonymous`);
            } else if (identity.kind === 'anonymous') {
              wsWarnThrottled(this.logger, 'anonymous', '[ws-auth] transition mode: accepted a socket with no credential');
            }
            next();
          })
          .catch(() => next(new Error('unauthorized')));
      });
    }
    return server;
  }
}
