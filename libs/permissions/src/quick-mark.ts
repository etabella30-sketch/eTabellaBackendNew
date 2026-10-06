/**
 * Quick marks (RHighlights): who may add one to a session and who may delete one, once for every host (Phase 7b of
 * the shared-libraries plan, 2026-10-06; before it realtime-server carried quick-mark-gate.ts for the insert and an
 * ownership read inside FactService.deleteHighlights, while issue/deleteHighlights checked nothing).
 *
 * Insert: realtime.et_qmark_handler stores the client's nCaseid and nSessionid on the new row as given (and picks the
 * case's default issue from nCaseid), so the session must belong to that case and not be deleted, and the caller
 * must be able to see the session under the host's session rule (realtime-server callerCanSeeSession: RSessionDetail
 * assignment, the case team, or a platform admin). Both ids are required; the session/case test applies to admins
 * too.
 *
 * Delete: et_qmark_handler deletes by nHid alone, so the owner is read first: a quick mark belongs to its nUserid,
 * and only that user or a platform admin may remove it. No row = nothing to protect (the SP then deletes nothing).
 *
 * Outcomes are DomainErrors the host envelope renders as its old statuses: 'forbidden' (403), 'unavailable' (500).
 */
import { DomainError, isUuidText, RowQuery } from '@app/api-kernel';

export const QUICK_MARK_ADD_REFUSED = 'You are not permitted to add quick marks to this session';
export const QUICK_MARK_SESSION_CHECK_FAILED = 'Could not check access to this session';
export const QUICK_MARK_DELETE_REFUSED = 'You can only delete your own quick marks';
export const QUICK_MARK_OWNER_CHECK_FAILED = 'Could not check who owns this quick mark';

/** $1 nSessionid, $2 nCaseid: one row when the session exists, is not deleted and belongs to that case. */
export const QUICK_MARK_SESSION_SQL = `SELECT 1 FROM "RSessionMaster" r
 WHERE r."nSesid" = $1::uuid AND r."nCaseid" = $2::uuid AND r."dDelDt" IS NULL
 LIMIT 1`;

/** $1 nHid: the quick mark's owner. */
export const QUICK_MARK_OWNER_SQL = `SELECT "nUserid"::text AS "nUserid" FROM "RHighlights" WHERE "nHid" = $1::uuid`;

/** The fields of an insertHighlights body the rule reads. */
export interface QuickMarkTarget {
  readonly nCaseid?: unknown;
  readonly nSessionid?: unknown;
}

export interface QuickMarkActor {
  readonly userId: string;
  readonly isPlatformAdmin: boolean;
}

export interface QuickMarkOptions {
  /** The host's session-visibility rule; required for the insert gate (a box has none, so it relays instead). */
  readonly sessionVisible: (nSesid: string) => Promise<boolean>;
}

/** Insert gate: throws 'forbidden' on any refusal, 'unavailable' when the session lookup failed. */
export async function assertCanAddQuickMark(
  db: RowQuery,
  caller: QuickMarkActor | null | undefined,
  body: QuickMarkTarget | null | undefined,
  opts: QuickMarkOptions,
): Promise<void> {
  const refused = () => new DomainError('forbidden', QUICK_MARK_ADD_REFUSED);
  if (!caller || !isUuidText(caller.userId)) throw refused();
  const nCaseid = body?.nCaseid;
  const nSessionid = body?.nSessionid;
  if (!isUuidText(nCaseid) || !isUuidText(nSessionid)) throw refused();
  let rows: readonly unknown[];
  try {
    rows = await db.rows(QUICK_MARK_SESSION_SQL, [nSessionid, nCaseid]);
  } catch (error) {
    throw new DomainError('unavailable', QUICK_MARK_SESSION_CHECK_FAILED, { error: (error as Error)?.message ?? String(error) });
  }
  if (!rows.length) throw refused();
  if (!(await opts.sessionVisible(nSessionid))) throw refused();
}

/** Delete gate: the owner or a platform admin; a missing row passes (nothing to protect). */
export async function assertCanDeleteQuickMark(
  db: RowQuery,
  caller: QuickMarkActor | null | undefined,
  nHid: unknown,
): Promise<void> {
  const refused = () => new DomainError('forbidden', QUICK_MARK_DELETE_REFUSED);
  if (!caller || !isUuidText(caller.userId)) throw refused();
  if (!isUuidText(nHid)) throw refused();
  let rows: readonly { nUserid?: string | null }[];
  try {
    rows = await db.rows<{ nUserid?: string | null }>(QUICK_MARK_OWNER_SQL, [nHid]);
  } catch (error) {
    throw new DomainError('unavailable', QUICK_MARK_OWNER_CHECK_FAILED, { error: (error as Error)?.message ?? String(error) });
  }
  const owner = rows[0]?.nUserid;
  if (!owner) return;
  if (caller.isPlatformAdmin === true) return;
  if (String(owner).toLowerCase() !== caller.userId.toLowerCase()) throw refused();
}
