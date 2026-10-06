import { ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { isDomainError } from '@app/api-kernel';
import { FACT_CREATE_TARGET_SQL as SHARED_FACT_CREATE_TARGET_SQL, resolveFactCreateTarget } from '@app/permissions';
import { PgRowQuery } from '@app/platform-cloud';
import type { RowQueryDb } from '../../events/realtime-socket-access';
import type { RealtimeUser } from '../../middleware/realtime-auth.middleware';
import { callerCanSeeSession } from '../session/session-access-gate';
import { isUuid } from '../utility/safe-path';

/**
 * Create gate for fact/insertfact and fact/insertquickfact, run before realtime.et_fact_insert or any other write.
 * The rule itself (the case exists, the caller is an active member or a platform admin, the document and the
 * session belong to the case) lives once in @app/permissions (fact-create.ts, Phase 7b of the shared-libraries
 * plan); this file adapts it over the app's DbService, adds the session-visibility rule of this host
 * (callerCanSeeSession) and turns its DomainErrors back into the 403 / 500 the fact/* callers expect, with the same
 * messages. nCaseid stays REQUIRED here: this host's DTOs require it and the SP stores it as the fact's case, so a
 * request without one is refused before any query (the shared rule would derive it from the document for coreapi's
 * v1 routes).
 */
export const FACT_CREATE_TARGET_SQL = SHARED_FACT_CREATE_TARGET_SQL;

/** The fields of an InsertFact / InsertQuickFact body the gate reads. */
export interface FactCreateTarget {
  nMasterid?: unknown;
  nCaseid?: unknown;
  nBDid?: unknown;
  nSesid?: unknown;
}

const refused = () => new ForbiddenException('You are not permitted to add facts to this case');

export async function assertCanCreateFact(
  db: RowQueryDb,
  user: RealtimeUser | undefined,
  body: FactCreateTarget | undefined,
): Promise<void> {
  if (!user?.userId || !isUuid(user.userId)) throw refused();
  if (!isUuid(body?.nCaseid)) throw refused();
  try {
    await resolveFactCreateTarget(
      new PgRowQuery(db),
      { userId: user.userId, isPlatformAdmin: user.isAdmin === true },
      body,
      { sessionVisible: (nSesid) => callerCanSeeSession(db, user, nSesid) },
    );
  } catch (error) {
    if (!isDomainError(error)) throw error;
    if (error.code === 'forbidden') throw refused();
    throw new InternalServerErrorException('Could not check access to this case');
  }
}
