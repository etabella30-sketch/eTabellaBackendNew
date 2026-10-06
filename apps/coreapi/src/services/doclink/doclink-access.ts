import { ForbiddenException, InternalServerErrorException, Logger } from '@nestjs/common';
import { DbService } from '@app/global/db/pg/db.service';
import { isDomainError } from '@app/api-kernel';
import {
  assertCanDeleteDocLink as assertCanDeleteDocLinkRule,
  DOCLINK_DELETE_ACCESS_SQL,
  DOCLINK_VIEW_SQL,
  parseDocIds,
  viewableDocLinkIds as viewableDocLinkIdsRule,
} from '@app/permissions';
import { PgRowQuery } from '@app/platform-cloud';

/**
 * The DocLink rules of coreapi's doclink/* routes, as the HTTP exceptions and bodies they always answered. The rules
 * themselves (who may read a DocLink, who may delete one) live once in @app/permissions (doclink.ts, Phase 8 of the
 * shared-libraries plan), shared with realtime-server and the venue box; this file adapts them over the app's
 * DbService and keeps coreapi's `{ msg: -1, value }` error bodies and its "null = the lookup failed" reads.
 */
const logger = new Logger('DocLinkAccess');

type RowDb = Pick<DbService, 'rowQuery'>;

export { DOCLINK_DELETE_ACCESS_SQL, DOCLINK_VIEW_SQL, parseDocIds };

/**
 * The ids in `nDocids` the caller may read, lower case, in the order given, without repeats. Ids that are not UUIDs,
 * missing DocLinks and other people's unshared DocLinks are left out. null when the lookup failed, so the route
 * answers with its failure shape instead of reading a fault as "nothing visible".
 */
export async function viewableDocLinkIds(db: RowDb, nMasterid: unknown, nDocids: unknown[]): Promise<string[] | null> {
    try {
        return await viewableDocLinkIdsRule(new PgRowQuery(db), nMasterid, nDocids);
    } catch (error) {
        logger.error(`doclink view lookup failed: ${(error as Error)?.message ?? error}`);
        return null;
    }
}

/**
 * Delete gate: 403 unless the shared rule allows it (same message as et_doc_delete's own refusal), 500 when the
 * lookup failed. Call it outside the route's try/catch, or rethrow HttpException.
 */
export async function assertCanDeleteDocLink(db: RowDb, nMasterid: unknown, nDocid: unknown, nDMLids: unknown): Promise<void> {
    try {
        await assertCanDeleteDocLinkRule(new PgRowQuery(db), nMasterid, nDocid, nDMLids);
    } catch (error) {
        if (isDomainError(error) && error.code === 'forbidden') {
            throw new ForbiddenException({ msg: -1, value: 'You do not have a permission for delete' });
        }
        logger.error(`doclink delete access lookup failed for ${nDocid}: ${(error as Error)?.message ?? error}`);
        throw new InternalServerErrorException({ msg: -1, value: 'Could not check access to this DocLink' });
    }
}
