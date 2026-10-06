import { ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { isDomainError } from '@app/api-kernel';
import {
  assertCanAddQuickMark as assertCanAddQuickMarkRule,
  assertCanDeleteQuickMark as assertCanDeleteQuickMarkRule,
  QUICK_MARK_SESSION_SQL as SHARED_QUICK_MARK_SESSION_SQL,
} from '@app/permissions';
import { PgRowQuery } from '@app/platform-cloud';
import type { RowQueryDb } from '../../events/realtime-socket-access';
import type { RealtimeUser } from '../../middleware/realtime-auth.middleware';
import { callerCanSeeSession } from './session-access-gate';

/**
 * Quick-mark gates for fact/insertHighlights, fact/deleteHighlights and the issue/* twins (one write path since
 * Phase 7b / D8 of the shared-libraries plan). The rules live once in @app/permissions (quick-mark.ts): the session
 * must belong to the named case and not be deleted, the caller must see it under this host's session rule
 * (callerCanSeeSession), and a quick mark is deleted by its owner or a platform admin only. This file adapts them
 * over the app's DbService and turns DomainErrors back into the 403 / 500 the callers expect, same messages.
 */
export const QUICK_MARK_SESSION_SQL = SHARED_QUICK_MARK_SESSION_SQL;

/** The fields of an InsertHighlightsRequestBody the gate reads. */
export interface QuickMarkTarget {
  nCaseid?: unknown;
  nSessionid?: unknown;
}

function asHttp<T>(run: () => Promise<T>, failedMessage: string): Promise<T> {
  return run().catch((error: unknown) => {
    if (!isDomainError(error)) throw error;
    if (error.code === 'forbidden') throw new ForbiddenException(error.message);
    throw new InternalServerErrorException(failedMessage);
  });
}

/** Insert gate: 403 on any refusal, 500 when the session lookup fails. Call it outside any try/catch that answers 200. */
export function assertCanAddQuickMark(db: RowQueryDb, user: RealtimeUser | undefined, body: QuickMarkTarget | undefined): Promise<void> {
  const caller = user?.userId ? { userId: user.userId, isPlatformAdmin: user.isAdmin === true } : null;
  return asHttp(
    () => assertCanAddQuickMarkRule(new PgRowQuery(db), caller, body, { sessionVisible: (nSesid) => callerCanSeeSession(db, user, nSesid) }),
    'Could not check access to this session',
  );
}

/** Delete gate: the owner or a platform admin; 403 otherwise, 500 when the owner lookup fails. */
export function assertCanDeleteQuickMark(db: RowQueryDb, user: RealtimeUser | undefined, nHid: unknown): Promise<void> {
  const caller = user?.userId ? { userId: user.userId, isPlatformAdmin: user.isAdmin === true } : null;
  return asHttp(() => assertCanDeleteQuickMarkRule(new PgRowQuery(db), caller, nHid), 'Could not check who owns this quick mark');
}
