import { ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { isDomainError } from '@app/api-kernel';
import {
  assertCanDeleteDocLink as assertCanDeleteDocLinkRule,
  DOCLINK_VIEW_SQL,
  parseDocIds,
  viewableDocLinkIds as viewableDocLinkIdsRule,
} from '@app/permissions';
import { PgRowQuery } from '@app/platform-cloud';

export interface RowQueryDb {
  rowQuery(text: string, params?: any[]): Promise<any>;
}

/**
 * The DocLink rules of this app's doclink/* routes (view: owner or DMShared recipient; delete: owner only, Phase 8
 * of the shared-libraries plan closed the docdelete gap), adapted over the app's DbService from the one copy in
 * @app/permissions (doclink.ts): the same answers as before (null = the lookup failed) and the same HTTP exceptions.
 */
export { DOCLINK_VIEW_SQL, parseDocIds };

/**
 * The ids in `nDocids` that `nMasterid` (the token user; RealtimeAuthInjectMiddleware writes it over the client
 * value) may read, in the order given, without duplicates. Ids that are not UUIDs, missing DocLinks and other
 * people's unshared DocLinks are left out. Returns null when the lookup fails, so the caller answers with its
 * failure shape instead of treating a fault as "nothing visible".
 */
export async function viewableDocLinkIds(db: RowQueryDb, nMasterid: unknown, nDocids: unknown[]): Promise<string[] | null> {
  try {
    return await viewableDocLinkIdsRule(new PgRowQuery(db), nMasterid, nDocids);
  } catch {
    return null;
  }
}

/**
 * Delete gate for doclink/docdelete: the owner only (a platform admin is not exempt, as et_doc_delete itself tests
 * the owner). 403 with the SP's own refusal text, 500 when the owner lookup fails. Call it outside any try/catch that
 * answers 200.
 */
export async function assertCanDeleteDocLink(db: RowQueryDb, nMasterid: unknown, nDocid: unknown, nDMLids?: unknown): Promise<void> {
  try {
    await assertCanDeleteDocLinkRule(new PgRowQuery(db), nMasterid, nDocid, nDMLids);
  } catch (error) {
    if (isDomainError(error) && error.code === 'forbidden') throw new ForbiddenException(error.message);
    if (isDomainError(error)) throw new InternalServerErrorException('Could not check access to this DocLink');
    throw error;
  }
}
