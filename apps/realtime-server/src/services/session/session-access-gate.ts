import { ForbiddenException } from '@nestjs/common';
import { RealtimeSessionAccess, RowQueryDb } from '../../events/realtime-socket-access';
import type { RealtimeUser } from '../../middleware/realtime-auth.middleware';
import { isUuid } from '../utility/safe-path';

/**
 * HTTP side of the socket session-membership rule. It reuses RealtimeSessionAccess.canSeeSession
 * (RSessionDetail assignment, TeamRelation on the session's case, or a global admin; deleted
 * sessions excluded; non-UUID ids and lookup errors refused) instead of repeating its SQL.
 *
 * The token user from the auth middleware (req.user) is wrapped as a verified 'user' socket. A new
 * wrapper and access object per call means the positive-answer cache lives only for this request.
 */
export async function callerCanSeeSession(
  db: RowQueryDb,
  user: RealtimeUser | undefined,
  nSesid: unknown,
): Promise<boolean> {
  if (!user?.userId) return false;
  const client = { data: { kind: 'user', userId: user.userId, isAdmin: user.isAdmin === true } };
  return new RealtimeSessionAccess(db).canSeeSession(client, nSesid);
}

/** The session's case id, or null when there is no such session or the lookup fails. */
export async function caseOfSession(db: RowQueryDb, nSesid: string): Promise<string | null> {
  try {
    const res: any = await db.rowQuery(`SELECT "nCaseid" FROM "RSessionMaster" WHERE "nSesid" = $1 LIMIT 1`, [nSesid]);
    const nCaseid = res?.success ? res.data?.[0]?.nCaseid : null;
    return typeof nCaseid === 'string' ? nCaseid : null;
  } catch {
    return null;
  }
}

/**
 * 403 unless the caller can see every session id given. The empty, null and undefined values the
 * DTOs allow are skipped, but at least one id is required: a request that names no session has no
 * session to check. When `nCaseid` is given, every session must also belong to that case, so a
 * visible session cannot be paired with another case's id (the export prints that case's name).
 */
export async function assertCallerCanSeeSessions(
  db: RowQueryDb,
  user: RealtimeUser | undefined,
  ids: unknown[],
  nCaseid?: unknown,
): Promise<void> {
  const given = ids.filter((id) => id !== undefined && id !== null && id !== '');
  if (!given.length) throw new ForbiddenException('A session is required');
  for (const id of given) {
    if (!(await callerCanSeeSession(db, user, id))) {
      throw new ForbiddenException('You are not permitted to access this session');
    }
    if (nCaseid !== undefined && nCaseid !== null && nCaseid !== '') {
      const actual = await caseOfSession(db, id as string);
      if (!actual || typeof nCaseid !== 'string' || actual.toLowerCase() !== nCaseid.toLowerCase()) {
        throw new ForbiddenException('The session does not belong to this case');
      }
    }
  }
}

/**
 * The session-list form of SESSION_ACCESS_SQL: which of the ids in $1 (uuid[]) user $2 may see. The
 * WHERE clause after the id test is SESSION_ACCESS_SQL's, word for word (session-access-gate.spec.ts
 * checks that), so a list and a single read cannot disagree. Global admins never reach it.
 */
export const SESSIONS_ACCESS_BATCH_SQL = `SELECT r."nSesid" FROM "RSessionMaster" r
 WHERE r."nSesid" = ANY($1::uuid[]) AND r."dDelDt" IS NULL
   AND (EXISTS (SELECT 1 FROM "RSessionDetail" d WHERE d."nSesid" = r."nSesid" AND d."nUserid" = $2)
     OR EXISTS (SELECT 1 FROM "TeamRelation" t WHERE t."nCaseid" = r."nCaseid" AND t."nUserid" = $2))`;

/**
 * The ids in `ids` (lower-cased) that the token user may see under the socket membership rule, in one
 * query. A global admin sees every UUID given; no user, no UUIDs or a failed lookup gives none.
 */
export async function visibleSessionIds(db: RowQueryDb, user: RealtimeUser | undefined, ids: unknown[]): Promise<Set<string>> {
  const asked = [...new Set(ids.filter(isUuid).map((id) => id.toLowerCase()))];
  if (!user?.userId || !isUuid(user.userId) || !asked.length) return new Set();
  if (user.isAdmin === true) return new Set(asked);
  try {
    const res: any = await db.rowQuery(SESSIONS_ACCESS_BATCH_SQL, [asked, user.userId]);
    if (!res?.success || !Array.isArray(res.data)) return new Set();
    return new Set(res.data.map((row: any) => String(row?.nSesid ?? '').toLowerCase()).filter((id: string) => asked.includes(id)));
  } catch {
    return new Set();
  }
}

/** On the case's team: the TeamRelation rule et_is_case_member encodes. */
export const CASE_MEMBER_SQL = `SELECT 1 FROM "TeamRelation" t WHERE t."nCaseid" = $1 AND t."nUserid" = $2 LIMIT 1`;

/**
 * Who may list a case's sessions: its team (TeamRelation), or anyone assigned (RSessionDetail) to one
 * of its sessions that is not deleted. The second half keeps the legacy RT toolbar working for users
 * assigned to a session without a team row, who can already open that session (SESSION_ACCESS_SQL).
 */
export const CASE_SESSIONS_AUDIENCE_SQL = `SELECT 1
 WHERE EXISTS (SELECT 1 FROM "TeamRelation" t WHERE t."nCaseid" = $1 AND t."nUserid" = $2)
    OR EXISTS (SELECT 1 FROM "RSessionMaster" r JOIN "RSessionDetail" d ON d."nSesid" = r."nSesid"
                WHERE r."nCaseid" = $1 AND r."dDelDt" IS NULL AND d."nUserid" = $2)`;

/**
 * The case-list form of CASE_SESSIONS_AUDIENCE_SQL: which of the case ids in $1 (uuid[]) user $2 may list. Its
 * two EXISTS tests are CASE_SESSIONS_AUDIENCE_SQL's with `$1` read as `c.id` (session-access-gate.spec.ts checks
 * that), so a batch and a single read cannot disagree. Global admins never reach it.
 */
export const CASES_SESSIONS_AUDIENCE_BATCH_SQL = `SELECT c.id AS "nCaseid" FROM unnest($1::uuid[]) AS c(id)
 WHERE EXISTS (SELECT 1 FROM "TeamRelation" t WHERE t."nCaseid" = c.id AND t."nUserid" = $2)
    OR EXISTS (SELECT 1 FROM "RSessionMaster" r JOIN "RSessionDetail" d ON d."nSesid" = r."nSesid"
                WHERE r."nCaseid" = c.id AND r."dDelDt" IS NULL AND d."nUserid" = $2)`;

/**
 * session/getSessionsByCaseIds: the case ids in `ids` (lower-cased) whose sessions the token user may list, in one
 * query: callerCanListCaseSessions for many cases. A global admin gets every UUID given; no user, no UUIDs or a
 * failed lookup gives none.
 */
export async function casesCallerCanList(db: RowQueryDb, user: RealtimeUser | undefined, ids: unknown[]): Promise<Set<string>> {
  const asked = [...new Set(ids.filter(isUuid).map((id) => id.toLowerCase()))];
  if (!user?.userId || !isUuid(user.userId) || !asked.length) return new Set();
  if (user.isAdmin === true) return new Set(asked);
  try {
    const res: any = await db.rowQuery(CASES_SESSIONS_AUDIENCE_BATCH_SQL, [asked, user.userId]);
    if (!res?.success || !Array.isArray(res.data)) return new Set();
    return new Set(res.data.map((row: any) => String(row?.nCaseid ?? '').toLowerCase()).filter((id: string) => asked.includes(id)));
  } catch {
    return new Set();
  }
}

/** SectionMaster.nCaseid through the row's section (BundleMaster and BundleDetail carry no nCaseid). */
export const CASE_OF_SECTION_SQL = `SELECT s."nCaseid" FROM "SectionMaster" s WHERE s."nSectionid" = $1 LIMIT 1`;
export const CASE_OF_BUNDLE_SQL = `SELECT s."nCaseid" FROM "BundleMaster" b JOIN "SectionMaster" s ON s."nSectionid" = b."nSectionid" WHERE b."nBundleid" = $1 LIMIT 1`;
export const CASE_OF_BUNDLE_DETAIL_SQL = `SELECT s."nCaseid" FROM "BundleDetail" b JOIN "SectionMaster" s ON s."nSectionid" = b."nSectionid" WHERE b."nBundledetailid" = $1 LIMIT 1`;

async function hasRow(db: RowQueryDb, text: string, params: any[]): Promise<boolean> {
  try {
    const res: any = await db.rowQuery(text, params);
    return !!(res?.success && Array.isArray(res.data) && res.data.length);
  } catch {
    return false;
  }
}

/**
 * A case-scoped read: a global admin, or a member of the case (TeamRelation). `nCaseid` is either the
 * case id or a lookup that finds it (only run for non-admins; a missing row or a failed lookup
 * refuses). Fails closed on a missing user and on non-UUID ids.
 */
export async function callerIsOnCase(
  db: RowQueryDb,
  user: RealtimeUser | undefined,
  nCaseid: unknown | (() => Promise<string | null>),
): Promise<boolean> {
  if (!user?.userId || !isUuid(user.userId)) return false;
  if (user.isAdmin === true) return true;
  const id = typeof nCaseid === 'function' ? await nCaseid() : nCaseid;
  if (!isUuid(id)) return false;
  return hasRow(db, CASE_MEMBER_SQL, [id, user.userId]);
}

/** session/getSessionsByCaseId: nCaseid is required (no id means "every case" to the SP), then admin or CASE_SESSIONS_AUDIENCE_SQL. */
export async function callerCanListCaseSessions(db: RowQueryDb, user: RealtimeUser | undefined, nCaseid: unknown): Promise<boolean> {
  if (!user?.userId || !isUuid(user.userId) || !isUuid(nCaseid)) return false;
  if (user.isAdmin === true) return true;
  return hasRow(db, CASE_SESSIONS_AUDIENCE_SQL, [nCaseid, user.userId]);
}

/** The case a section / bundle / bundle file belongs to; null for a non-UUID id, no row or a failed lookup. */
export async function caseOf(db: RowQueryDb, text: string, id: unknown): Promise<string | null> {
  if (!isUuid(id)) return null;
  try {
    const res: any = await db.rowQuery(text, [id]);
    const nCaseid = res?.success ? res.data?.[0]?.nCaseid : null;
    return typeof nCaseid === 'string' ? nCaseid : null;
  } catch {
    return null;
  }
}
