/**
 * Who may view or edit a Fact: the bCanView / bCanEdit columns of `public.et_fact_permissions(nUserid, nFSid)`
 * (owner, FMShared recipient, plus whatever admin rule the SP carries), the one rule realtime-server's factsheet/*
 * and fact/* routes apply (moved here from apps/realtime-server/src/services/factsheet/fact-view-gate.ts in Phase 7a
 * of the shared-libraries plan; that file is now an adapter over this one for the fact/* routes that still live in
 * the app). `userId` is always the verified Caller, never a request value (R4).
 *
 * Outcomes, as DomainErrors the host's envelope renders (realtime-server: the same 500 / 404 / 403 bodies as before):
 *  - the lookup failed (SP error or a throw) -> 'unavailable': a fault is never reported as a refusal;
 *  - no row (the fact does not exist)        -> 'not_found';
 *  - a flag not set                           -> 'forbidden' from the assert* gates, `false` from callerCanViewFact.
 * Call the gates outside a reader's try/catch so the status reaches the client.
 */
import { Logger } from '@nestjs/common';
import { DomainError, SpExecutor } from '@app/api-kernel';

export const FACT_PERMISSIONS_SP = 'fact_permissions';
export const FACT_ACCESS_CHECK_FAILED = 'Could not check access to this fact';
export const FACT_NOT_FOUND = 'Fact not found';
export const FACT_NOT_VIEWABLE = 'You are not permitted to view this fact';
export const FACT_NOT_EDITABLE = 'You are not permitted to edit this fact';

/** One et_fact_permissions row for (caller, fact). */
export interface FactPermissionRow {
  nFSid?: string;
  nUserid?: string;
  bCanView?: boolean;
  bCanEdit?: boolean;
  bCanDelete?: boolean;
  bCanReshare?: boolean;
  bCanComment?: boolean;
  msg?: number;
  error?: unknown;
}

const logger = new Logger('FactVisibility');

/**
 * The caller's et_fact_permissions row for one fact. `nFSid` may be null (a request without one): the SP then
 * answers no row and the fact is "not found", as it always was.
 */
export async function readFactPermission(sp: SpExecutor, userId: string, nFSid: string | null | undefined): Promise<FactPermissionRow> {
  const outcome = await sp.call<FactPermissionRow>(FACT_PERMISSIONS_SP, { nUserid: userId, nFSid });
  // Equality on the discriminant: the repo compiles without strictNullChecks, where `!outcome.ok` does not narrow.
  if (outcome.ok === false) {
    logger.error(`fact_permissions lookup failed for ${nFSid}: ${outcome.error}`);
    throw new DomainError('unavailable', FACT_ACCESS_CHECK_FAILED, { nFSid, error: outcome.error });
  }
  const row = outcome.cursors[0]?.[0];
  if (!row) throw new DomainError('not_found', FACT_NOT_FOUND, { nFSid });
  return row;
}

/**
 * The bCanView rule for reads whose refusal must not be an error: true when the caller may view the fact, false
 * when it exists but they may not ('unavailable' / 'not_found' still throw). The caller then answers its normal
 * EMPTY result and runs no reader SP, so nothing of the fact leaves the server (the legacy app redirects every 403
 * outside its RT and viewer pages to its dashboard, which would throw a whole page away for one panel).
 */
export async function callerCanViewFact(sp: SpExecutor, userId: string, nFSid: string | null | undefined): Promise<boolean> {
  return !!(await readFactPermission(sp, userId, nFSid)).bCanView;
}

/** Read gate: 'unavailable' / 'not_found' as readFactPermission; bCanView not true -> 'forbidden'. */
export async function assertCanViewFact(sp: SpExecutor, userId: string, nFSid: string | null | undefined): Promise<void> {
  const row = await readFactPermission(sp, userId, nFSid);
  if (!row.bCanView) throw new DomainError('forbidden', FACT_NOT_VIEWABLE, { nFSid });
}

/** Write gate: bCanEdit (owner, or an FMShared recipient with edit rights), the rule factsheet/save applies. */
export async function assertCanEditFact(sp: SpExecutor, userId: string, nFSid: string | null | undefined): Promise<void> {
  const row = await readFactPermission(sp, userId, nFSid);
  if (!row.bCanEdit) throw new DomainError('forbidden', FACT_NOT_EDITABLE, { nFSid });
}
