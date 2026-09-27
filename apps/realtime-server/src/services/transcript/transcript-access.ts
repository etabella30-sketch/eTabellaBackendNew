import type { RowQueryDb } from '../../events/realtime-socket-access';
import type { RealtimeUser } from '../../middleware/realtime-auth.middleware';
import { callerCanSeeSession, visibleSessionIds } from '../session/session-access-gate';
import { isSafeBasename, isUuid } from '../utility/safe-path';

/**
 * Who may read a produced transcript through the transcript/* read routes.
 *
 * A transcript belongs to a case through the session it is published to (transcript."Transcripts".nSesid
 * -> RSessionMaster.nCaseid). A caller may read it when they can see that session under the socket
 * membership rule (session-access-gate.ts: on the session's case team, assigned to the session, or a
 * global admin; deleted sessions excluded). That is the rule session/realtimedatabysesid already
 * applies to the same published transcript, so these routes cannot hand out more than it does.
 * Unpublished transcripts (no nSesid) and anything that cannot be tied to a session are global-admin
 * only: they exist only in the admin transcript-production screens.
 */

export const TRANSCRIPT_SESSION_BY_ID_SQL = `SELECT "nSesid" FROM transcript."Transcripts" WHERE "cTransid" = $1 LIMIT 1`;
export const TRANSCRIPT_SESSIONS_BY_PATH_SQL = `SELECT "nSesid" FROM transcript."Transcripts" WHERE "cPath" = $1 AND "nSesid" IS NOT NULL`;

/** The published transcript of a session: REALTIME_PATH/s_<nSesid>.json (session.service, feed.service, publish). */
const PUBLISHED_FILE_RE = /^s_([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.json$/i;

function isAdmin(user: RealtimeUser | undefined): boolean {
  return !!user && user.isAdmin === true && isUuid(user.userId);
}

/**
 * The transcript-production pickers (get_field_data: distinct values of any Transcripts column across
 * every transcript, cHtmlpath included, whose exports/ files are served without a token; case_combo:
 * every case) are cross-case by design. Their only callers are the global-admin RT Production /
 * legacy admin transcript screens, whose writes (transcript_builder, publish) already need an admin.
 */
export function callerIsTranscriptAdmin(user: RealtimeUser | undefined): boolean {
  return isAdmin(user);
}

async function rows(db: RowQueryDb, text: string, params: any[]): Promise<any[] | null> {
  try {
    const res: any = await db.rowQuery(text, params);
    return res?.success && Array.isArray(res.data) ? res.data : null;
  } catch {
    return null;
  }
}

/** get_transcript_detail / html-file: may the token user read transcript `cTransid`? Fails closed. */
export async function callerCanSeeTranscript(db: RowQueryDb, user: RealtimeUser | undefined, cTransid: unknown): Promise<boolean> {
  if (!user?.userId) return false;
  if (isAdmin(user)) return true;
  if (!isUuid(cTransid)) return false;
  const found = await rows(db, TRANSCRIPT_SESSION_BY_ID_SQL, [cTransid]);
  const nSesid = found?.[0]?.nSesid;
  return isUuid(nSesid) && callerCanSeeSession(db, user, nSesid);
}

/**
 * filedata / summary / html: may the token user read the transcript JSON at REALTIME_PATH + cPath?
 * Non-admins only name a plain file: the published s_<nSesid>.json of a session they can see, or the
 * source file (Transcripts.cPath) of a transcript published to such a session. Fails closed.
 */
export async function callerCanReadTranscriptFile(db: RowQueryDb, user: RealtimeUser | undefined, cPath: unknown): Promise<boolean> {
  if (!user?.userId) return false;
  if (isAdmin(user)) return true;
  if (!isSafeBasename(cPath)) return false;
  const published = PUBLISHED_FILE_RE.exec(cPath);
  if (published) return callerCanSeeSession(db, user, published[1].toLowerCase());
  const found = await rows(db, TRANSCRIPT_SESSIONS_BY_PATH_SQL, [cPath]);
  if (!found?.length) return false;
  return (await visibleSessionIds(db, user, found.map((row) => row?.nSesid))).size > 0;
}

/**
 * get_transcripts: the rows (et_list_transcripts returns every transcript) whose session the token
 * user can see, in one membership query. Global admins get every row, unpublished ones included.
 */
export async function visibleTranscriptRows<T>(db: RowQueryDb, user: RealtimeUser | undefined, list: T[]): Promise<T[]> {
  if (!user?.userId) return [];
  if (isAdmin(user)) return list;
  const sesOf = (row: T): unknown => (row && typeof row === 'object' ? (row as any).nSesid : undefined);
  const visible = await visibleSessionIds(db, user, list.map(sesOf));
  return list.filter((row) => {
    const nSesid = sesOf(row);
    return isUuid(nSesid) && visible.has(nSesid.toLowerCase());
  });
}
