import { isUuid } from '../services/utility/safe-path';

/**
 * Room and session-membership rules for realtime-server's socket.io gateway.
 *
 * Identity comes from the connection middleware (libs/global ws-auth: socket.data.kind / userId /
 * isAdmin). This file decides what a verified 'user' socket may join or read; 'anonymous' sockets
 * (transition mode only) and 'service' sockets are handled in the gateway.
 */

export type RealtimeRoom =
  | { kind: 'user'; userId: string }
  | { kind: 'session'; nSesid: string }
  | { kind: 'demo' };

/** Demo rooms the legacy app joins (`<nDemoid>` and `D<nDemoid>`). nDemoid is a small integer (the SP returns 1). */
const DEMO_ROOM_RE = /^D?\d{1,9}$/;

/**
 * Parses a join-room name into one of the shapes the frontends use:
 * `U<userId>` (own user room), `S<nSesid>` (live/recorded session feed), `<n>` / `D<n>` (legacy demo).
 * Anything else (including another socket's id, which is a private delivery room) returns null.
 * The id parts are strict (UUID / short integer), so a parsed name can never equal a socket id.
 */
export function parseRealtimeRoom(room: unknown): RealtimeRoom | null {
  if (typeof room !== 'string') return null;
  const name = room.trim();
  if (name.length > 1 && name[0] === 'U' && isUuid(name.slice(1))) return { kind: 'user', userId: name.slice(1) };
  if (name.length > 1 && name[0] === 'S' && isUuid(name.slice(1))) return { kind: 'session', nSesid: name.slice(1) };
  if (DEMO_ROOM_RE.test(name)) return { kind: 'demo' };
  return null;
}

/** Room name a join-room / leave-room payload names: the object's `room`, or the payload itself when it is a string. */
export function roomNameOf(payload: unknown): string | null {
  const raw = typeof payload === 'string' ? payload : (payload as any)?.room;
  return typeof raw === 'string' && raw.trim() ? raw.trim() : null;
}

export const sameId = (a: unknown, b: unknown): boolean =>
  typeof a === 'string' && typeof b === 'string' && a.toLowerCase() === b.toLowerCase();

/**
 * Who may see a session: the same audience the session lists use today.
 * - an explicit assignment row in RSessionDetail (et_realtime_assignment; the legacy RT lists and
 *   et_realtime_livesession_bycaseid / et_realtime_sessiondata gate on it), or
 * - membership of the session's case in TeamRelation (the rule et_is_case_member encodes; the new
 *   frontend lists every session of an open case via et_realtime_combo_sessionlist), or
 * - a global admin (checked before the query).
 * Soft-deleted sessions (dDelDt) are excluded, as every session list excludes them.
 */
export const SESSION_ACCESS_SQL = `SELECT 1 FROM "RSessionMaster" r
 WHERE r."nSesid" = $1 AND r."dDelDt" IS NULL
   AND (EXISTS (SELECT 1 FROM "RSessionDetail" d WHERE d."nSesid" = r."nSesid" AND d."nUserid" = $2)
     OR EXISTS (SELECT 1 FROM "TeamRelation" t WHERE t."nCaseid" = r."nCaseid" AND t."nUserid" = $2))
 LIMIT 1`;

export interface RowQueryDb {
  rowQuery(text: string, params?: any[]): Promise<any>;
}

/** Per-socket cache of sessions this socket has already been allowed into (positive results only). */
const CACHE_KEY = 'rtSessions';
/** In-flight lookups on this socket, so concurrent checks for one session share a query. */
const PENDING_KEY = 'rtSessionsPending';

export class RealtimeSessionAccess {
  constructor(private readonly db: RowQueryDb) { }

  /**
   * True when the verified user on `client` may see session `nSesid`. Fails closed: a non-UUID id,
   * a socket without a verified user, or a lookup error all return false. Positive answers are cached
   * on `client.data` for the life of the socket, so a session costs one query per connection.
   */
  async canSeeSession(client: { data?: any }, nSesid: unknown): Promise<boolean> {
    const data = client?.data;
    if (!data || data.kind !== 'user' || !isUuid(data.userId) || !isUuid(nSesid)) return false;
    const key = nSesid.toLowerCase();
    const cache: Set<string> = data[CACHE_KEY] instanceof Set ? data[CACHE_KEY] : (data[CACHE_KEY] = new Set<string>());
    if (cache.has(key)) return true;
    if (data.isAdmin === true) {
      cache.add(key);
      return true;
    }
    // Clients send join-room and fetch-data back to back; share one lookup between them.
    const pending: Map<string, Promise<boolean>> = data[PENDING_KEY] instanceof Map ? data[PENDING_KEY] : (data[PENDING_KEY] = new Map());
    let lookup = pending.get(key);
    if (!lookup) {
      lookup = this.lookup(nSesid, data.userId).finally(() => pending.delete(key));
      pending.set(key, lookup);
    }
    const allowed = await lookup;
    if (allowed) cache.add(key);
    return allowed;
  }

  private async lookup(nSesid: string, userId: string): Promise<boolean> {
    try {
      const res: any = await this.db.rowQuery(SESSION_ACCESS_SQL, [nSesid, userId]);
      return !!(res?.success && Array.isArray(res.data) && res.data.length);
    } catch {
      return false;
    }
  }
}
