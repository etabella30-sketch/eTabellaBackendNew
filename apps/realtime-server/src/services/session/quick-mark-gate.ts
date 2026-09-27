import { ForbiddenException, InternalServerErrorException, Logger } from '@nestjs/common';
import type { RowQueryDb } from '../../events/realtime-socket-access';
import type { RealtimeUser } from '../../middleware/realtime-auth.middleware';
import { callerCanSeeSession } from './session-access-gate';
import { isUuid } from '../utility/safe-path';

const logger = new Logger('QuickMarkGate');

/** $1 nSessionid, $2 nCaseid: the session exists, is not deleted and belongs to that case. */
export const QUICK_MARK_SESSION_SQL = `SELECT 1 FROM "RSessionMaster" r
 WHERE r."nSesid" = $1::uuid AND r."nCaseid" = $2::uuid AND r."dDelDt" IS NULL
 LIMIT 1`;

/** The fields of an InsertHighlightsRequestBody the gate reads. */
export interface QuickMarkTarget {
  nCaseid?: unknown;
  nSessionid?: unknown;
}

/**
 * Create gate for the quick mark inserts, fact/insertHighlights (realtime.et_qmark_handler) and
 * issue/insertHighlights (public.et_realtime_handle_rhighlights), run before the SP. Both SPs store
 * the client's nCaseid and nSessionid on the new RHighlights row as given (and pick the case's default
 * issue from nCaseid), so the caller (req.user, the token user) must be able to see the session under
 * the session rule (callerCanSeeSession: RSessionDetail assignment, the case team, or a global admin)
 * and the session must belong to nCaseid and not be deleted. Both ids are required; the session/case
 * test applies to global admins too.
 *
 * 403 on any refusal, 500 when the session lookup fails. Call it outside any try/catch that turns
 * errors into a 200, so the status reaches the client.
 */
export async function assertCanAddQuickMark(
  db: RowQueryDb,
  user: RealtimeUser | undefined,
  body: QuickMarkTarget | undefined,
): Promise<void> {
  const refused = () => new ForbiddenException('You are not permitted to add quick marks to this session');
  if (!user?.userId || !isUuid(user.userId)) throw refused();
  const nCaseid = body?.nCaseid;
  const nSessionid = body?.nSessionid;
  if (!isUuid(nCaseid) || !isUuid(nSessionid)) throw refused();

  let res: any;
  try {
    res = await db.rowQuery(QUICK_MARK_SESSION_SQL, [nSessionid, nCaseid]);
  } catch (error) {
    res = { success: false, error };
  }
  if (!res?.success || !Array.isArray(res.data)) {
    logger.error(`quick mark session lookup failed: ${res?.error?.message ?? res?.error}`);
    throw new InternalServerErrorException('Could not check access to this session');
  }
  if (!res.data.length) throw refused();
  if (!(await callerCanSeeSession(db, user, nSessionid))) throw refused();
}
