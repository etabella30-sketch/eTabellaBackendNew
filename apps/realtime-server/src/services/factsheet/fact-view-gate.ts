import { ForbiddenException, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { DbService } from '@app/global/db/pg/db.service';

const logger = new Logger('FactViewGate');

/** One et_fact_permissions row for (caller, fact). */
export interface FactPermissionRow {
  nFSid?: string;
  nUserid?: string;
  bCanView?: boolean;
  bCanEdit?: boolean;
  bCanReshare?: boolean;
  bCanComment?: boolean;
}

/**
 * The caller's et_fact_permissions row for one fact (owner, FMShared recipient, plus whatever admin
 * rule the SP carries). `nMasterid` must be the token user, which RealtimeAuthInjectMiddleware
 * writes over the client value.
 *
 *  - lookup failed (SP error or a throw)  -> 500, so a fault is not reported as a refusal
 *  - no row (the fact does not exist)     -> 404
 *
 * Call the gates below outside the readers' / writers' try/catch so the status reaches the client.
 */
export async function readFactPermission(
  db: Pick<DbService, 'executeRef'>,
  nMasterid: string,
  nFSid: string,
): Promise<FactPermissionRow> {
  let res: any;
  try {
    res = await db.executeRef('fact_permissions', { nUserid: nMasterid, nFSid });
  } catch (error) {
    res = { success: false, error };
  }
  if (!res?.success) {
    logger.error(`fact_permissions lookup failed for ${nFSid}: ${res?.error?.message ?? res?.error}`);
    throw new InternalServerErrorException('Could not check access to this fact');
  }
  const row: FactPermissionRow | undefined = res.data?.[0]?.[0];
  if (!row) throw new NotFoundException('Fact not found');
  return row;
}

/**
 * Read gate for a fact, shared by factsheet/* and fact/* so both route families apply one rule:
 * the bCanView column of et_fact_permissions. 500 / 404 as readFactPermission; bCanView not true
 * -> 403.
 */
export async function assertCanViewFact(
  db: Pick<DbService, 'executeRef'>,
  nMasterid: string,
  nFSid: string,
): Promise<void> {
  const row = await readFactPermission(db, nMasterid, nFSid);
  if (!row.bCanView) throw new ForbiddenException('You are not permitted to view this fact');
}

/**
 * Same bCanView rule for reads whose refusal must not be a 403: true when the caller may view the
 * fact, false when it exists but they may not (500 / 404 still throw). The caller then answers with
 * its normal EMPTY result and runs no reader SP, so nothing of the fact leaves the server. Used where
 * the legacy app reads for facts the caller may not see (task / workspace tables, restored fact-sheet
 * tabs): its interceptor sends every 403 outside /realtime, /rt-realtime and /viewer to
 * /user/dashboard, which would throw the whole page away for one badge or panel.
 */
export async function callerCanViewFact(
  db: Pick<DbService, 'executeRef'>,
  nMasterid: string,
  nFSid: string,
): Promise<boolean> {
  return !!(await readFactPermission(db, nMasterid, nFSid)).bCanView;
}

/**
 * Write gate: the bCanEdit column of et_fact_permissions (owner, or an FMShared recipient with edit
 * rights), the rule factsheet/save applies. 500 / 404 as readFactPermission; bCanEdit not true -> 403.
 */
export async function assertCanEditFact(
  db: Pick<DbService, 'executeRef'>,
  nMasterid: string,
  nFSid: string,
): Promise<void> {
  const row = await readFactPermission(db, nMasterid, nFSid);
  if (!row.bCanEdit) throw new ForbiddenException('You are not permitted to edit this fact');
}
