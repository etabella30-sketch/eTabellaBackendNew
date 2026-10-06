/**
 * The fact visibility rule for the fact/* routes that still live in this app (fact.service.ts), as the HTTP
 * exceptions they always threw. The rule itself moved to @app/permissions (fact-visibility.ts) in Phase 7a of the
 * shared-libraries plan, where the shared factsheet feature applies it; this file adapts it over the app's
 * DbService (one PgSpExecutor per call, the same `fact_permissions` call as before) and turns its DomainErrors back
 * into the 500 / 404 / 403 the fact/* handlers' callers expect, with the same messages. Phase 7b retires it with
 * the fact routes.
 */
import { ForbiddenException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { isDomainError } from '@app/api-kernel';
import { DbService } from '@app/global/db/pg/db.service';
import {
  assertCanEditFact as assertCanEditFactRule,
  assertCanViewFact as assertCanViewFactRule,
  callerCanViewFact as callerCanViewFactRule,
  FactPermissionRow,
  readFactPermission as readFactPermissionRule,
} from '@app/permissions';
import { PgSpExecutor } from '@app/platform-cloud';

export type { FactPermissionRow };

/** A DomainError of the rule as the HTTP exception the gate threw before the move. */
async function asHttp<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (!isDomainError(error)) throw error;
    switch (error.code) {
      case 'not_found':
        throw new NotFoundException(error.message);
      case 'forbidden':
        throw new ForbiddenException(error.message);
      default:
        throw new InternalServerErrorException(error.message);
    }
  }
}

/**
 * The caller's et_fact_permissions row for one fact (owner, FMShared recipient, plus whatever admin rule the SP
 * carries). `nMasterid` must be the token user, which RealtimeAuthInjectMiddleware writes over the client value.
 *  - lookup failed (SP error or a throw)  -> 500, so a fault is not reported as a refusal
 *  - no row (the fact does not exist)     -> 404
 * Call the gates below outside the readers' / writers' try/catch so the status reaches the client.
 */
export function readFactPermission(db: Pick<DbService, 'executeRef'>, nMasterid: string, nFSid: string): Promise<FactPermissionRow> {
  return asHttp(() => readFactPermissionRule(new PgSpExecutor(db), nMasterid, nFSid));
}

/** Read gate: the bCanView column of et_fact_permissions. 500 / 404 as readFactPermission; bCanView not true -> 403. */
export function assertCanViewFact(db: Pick<DbService, 'executeRef'>, nMasterid: string, nFSid: string): Promise<void> {
  return asHttp(() => assertCanViewFactRule(new PgSpExecutor(db), nMasterid, nFSid));
}

/**
 * Same bCanView rule for reads whose refusal must not be a 403: true when the caller may view the fact, false when
 * it exists but they may not (500 / 404 still throw). The caller then answers with its normal EMPTY result.
 */
export function callerCanViewFact(db: Pick<DbService, 'executeRef'>, nMasterid: string, nFSid: string): Promise<boolean> {
  return asHttp(() => callerCanViewFactRule(new PgSpExecutor(db), nMasterid, nFSid));
}

/** Write gate: the bCanEdit column of et_fact_permissions. 500 / 404 as readFactPermission; bCanEdit not true -> 403. */
export function assertCanEditFact(db: Pick<DbService, 'executeRef'>, nMasterid: string, nFSid: string): Promise<void> {
  return asHttp(() => assertCanEditFactRule(new PgSpExecutor(db), nMasterid, nFSid));
}
