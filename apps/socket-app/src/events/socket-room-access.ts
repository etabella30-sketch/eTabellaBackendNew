/**
 * Room rules for socket-app's socket.io gateway (/socketservice/socket.io).
 *
 * Identity comes from the connection middleware (libs/global ws-auth: socket.data.kind / userId /
 * isAdmin). This file decides what a verified 'user' socket may join or drive; 'anonymous' sockets
 * (transition mode only) and 'service' sockets are handled in the gateway.
 *
 * Every lookup is a parametrised query on ids that were validated as UUIDs first. Lookups fail
 * closed (a query error is a "no"), and only positive answers are cached, on `client.data`, for
 * the life of the socket.
 */

import { FACT_VIEW_SQL } from '@app/permissions';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (value: unknown): value is string => typeof value === 'string' && UUID_RE.test(value);

export const sameId = (a: unknown, b: unknown): boolean =>
  typeof a === 'string' && typeof b === 'string' && a.toLowerCase() === b.toLowerCase();

/** Room name a join/leave payload names: the object's `room`, or the payload itself when it is a string. */
export function roomNameOf(payload: unknown): string | null {
  const raw = typeof payload === 'string' ? payload : (payload as any)?.room;
  return typeof raw === 'string' && raw.trim() ? raw.trim() : null;
}

/** `<prefix><uuid>` -> the lower-cased uuid, else null. */
function idAfterPrefix(name: unknown, prefix: string): string | null {
  if (typeof name !== 'string') return null;
  const s = name.trim();
  if (!s.startsWith(prefix)) return null;
  const id = s.slice(prefix.length);
  return isUuid(id) ? id.toLowerCase() : null;
}

/** `P<nPresentid>` -> nPresentid. */
export const presentIdOfRoom = (name: unknown): string | null => idAfterPrefix(name, 'P');
/** `FACT_<nFSid>` -> nFSid. */
export const factIdOfRoom = (name: unknown): string | null => idAfterPrefix(name, 'FACT_');
/** `U<nUserid>` -> nUserid. */
export const userIdOfRoom = (name: unknown): string | null => idAfterPrefix(name, 'U');

export const presentRoom = (nPresentid: string): string => `P${nPresentid.toLowerCase()}`;
export const factRoom = (nFSid: string): string => `FACT_${nFSid.toLowerCase()}`;

/**
 * Host = PresentationMaster.nCreateid (the `isHost` of present.et_present_individual_detail, which
 * the legacy app uses to decide who drives the presentation); member = a present."PMUser" row
 * (et_present_insertupdate_users adds / removes them) that the host has not paused: the host's
 * pause sets PMUser.cStatus = 'I' before it sends present-pause-user, and the legacy app itself
 * never joins the room while its cUStatus is 'I'.
 */
export const PRESENT_ROLE_SQL = `SELECT (p."nCreateid" = $2) AS "isHost",
       EXISTS (SELECT 1 FROM present."PMUser" u
                WHERE u."nPresentid" = p."nPresentid" AND u."nUserid" = $2
                  AND u."cStatus" IS DISTINCT FROM 'I') AS "isMember"
  FROM present."PresentationMaster" p
 WHERE p."nPresentid" = $1
 LIMIT 1`;

/**
 * The bCanView rule of public.et_fact_permissions (the gate realtime-server's factsheet reads use): the fact's
 * owner, an FMShared recipient, or an active-member assignee of a task linked to the fact on its case; no admin /
 * case-role bypass. Defined once in @app/permissions (fact-audience.ts, Phase 10 of the shared-libraries plan, where
 * the comment broadcast lists the same viewers) and re-exported here for the gateway and its specs.
 */
export { FACT_VIEW_SQL };

export interface RowQueryDb {
  rowQuery(text: string, params?: any[]): Promise<any>;
}

export type PresentRole = 'host' | 'member';

/** Per-socket cache of positive answers: `P:<id>:host`, `P:<id>:member`, `F:<id>`. */
const CACHE_KEY = 'socketAcl';

function verifiedUser(client: { data?: any }): string | null {
  const data = client?.data;
  return data && data.kind === 'user' && isUuid(data.userId) ? data.userId : null;
}

function cacheOf(client: { data?: any }): Set<string> {
  const data = client.data;
  return data[CACHE_KEY] instanceof Set ? data[CACHE_KEY] : (data[CACHE_KEY] = new Set<string>());
}

/**
 * The role this socket was granted in presentation `nPresentid` when it joined the room (the cached
 * answer of SocketRoomAccess.presentRole; no query), or null. A user socket can only be in a `P`
 * room through that check, so a socket in the room always carries its role here.
 */
export function cachedPresentRole(client: { data?: any } | null | undefined, nPresentid: unknown): PresentRole | null {
  const cache = client?.data?.[CACHE_KEY];
  if (!(cache instanceof Set) || !isUuid(nPresentid)) return null;
  const id = nPresentid.toLowerCase();
  if (cache.has(`P:${id}:host`)) return 'host';
  if (cache.has(`P:${id}:member`)) return 'member';
  return null;
}

export class SocketRoomAccess {
  constructor(private readonly db: RowQueryDb, private readonly onError: (msg: string) => void = () => undefined) { }

  /**
   * The verified user's role in presentation `nPresentid`: 'host', 'member', or null (no access,
   * not a verified user, malformed id, or lookup error).
   */
  async presentRole(client: { data?: any }, nPresentid: unknown): Promise<PresentRole | null> {
    const me = verifiedUser(client);
    if (!me || !isUuid(nPresentid)) return null;
    const id = nPresentid.toLowerCase();
    const cache = cacheOf(client);
    if (cache.has(`P:${id}:host`)) return 'host';
    if (cache.has(`P:${id}:member`)) return 'member';
    try {
      const res: any = await this.db.rowQuery(PRESENT_ROLE_SQL, [id, me]);
      if (!res?.success) {
        this.onError(`presentation lookup failed for ${id}: ${res?.error ?? 'unknown error'}`);
        return null;
      }
      const row = res.data?.[0];
      if (row?.isHost === true) {
        cache.add(`P:${id}:host`);
        return 'host';
      }
      if (row?.isMember === true) {
        cache.add(`P:${id}:member`);
        return 'member';
      }
      return null;
    } catch (error) {
      this.onError(`presentation lookup failed for ${id}: ${(error as any)?.message ?? error}`);
      return null;
    }
  }

  /** Drops a cached member answer (after the host paused this user), so the next join re-checks. */
  forgetPresentMember(client: { data?: any }, nPresentid: unknown): void {
    const cache = client?.data?.[CACHE_KEY];
    if (cache instanceof Set && isUuid(nPresentid)) cache.delete(`P:${nPresentid.toLowerCase()}:member`);
  }

  /** True when the verified user may view fact `nFSid` (et_fact_permissions bCanView). */
  async canViewFact(client: { data?: any }, nFSid: unknown): Promise<boolean> {
    const me = verifiedUser(client);
    if (!me || !isUuid(nFSid)) return false;
    const id = nFSid.toLowerCase();
    const cache = cacheOf(client);
    if (cache.has(`F:${id}`)) return true;
    try {
      const res: any = await this.db.rowQuery(FACT_VIEW_SQL, [id, me]);
      if (!res?.success) {
        this.onError(`fact lookup failed for ${id}: ${res?.error ?? 'unknown error'}`);
        return false;
      }
      if (!res.data?.length) return false;
      cache.add(`F:${id}`);
      return true;
    } catch (error) {
      this.onError(`fact lookup failed for ${id}: ${(error as any)?.message ?? error}`);
      return false;
    }
  }
}
