/**
 * Who can see one mark, for live mark sync (user decision 2026-10-05): the people whose devices are told
 * "the marks of this session changed" after a write, and the session the mark belongs to.
 *
 * The rule lives once in @app/permissions (mark-audience.ts) since Phase 10 of the shared-libraries plan: the reads
 * (MARK_AUDIENCE_SQL, one per kind: Facts and DocLinks author + share rows, Quick Marks the author only), the
 * MarkAudience shape and markId. This file is the host's adapter: the same names for the mark-sync code
 * (mark-events.service.ts, interceptors/mark-write.interceptor.ts) and for mark-audience.sql.spec.ts, which still
 * checks the constants against the schema dump, over this app's DbService through the kernel's ROW_QUERY adapter.
 * A failed read throws (an Error carrying the database's words), so the caller can tell "nobody" from "unknown".
 */
import { MarkKind } from '@app/edge-sync';
import { isDomainError } from '@app/api-kernel';
import { MARK_AUDIENCE_SQL, MarkAudience, markId, readMarkAudience as readSharedMarkAudience } from '@app/permissions';
import { PgRowQuery, RowDb } from '@app/platform-cloud';

export { MARK_AUDIENCE_SQL, markId };
export type { MarkAudience };

/** The part of DbService these reads use. */
export interface MarkAudienceDb {
    rowQuery(text: string, params?: any[]): Promise<any>;
}

/**
 * The audience of mark `id` of kind `kind`: null when the mark does not exist (or `id` is not a uuid); throws when
 * the read fails, so the caller can tell "nobody" from "unknown".
 */
export async function readMarkAudience(db: MarkAudienceDb, kind: MarkKind, rawId: unknown): Promise<MarkAudience | null> {
    try {
        return await readSharedMarkAudience(new PgRowQuery(db as RowDb), kind, rawId);
    } catch (error) {
        if (isDomainError(error)) {
            const said = (error.detail as { error?: unknown } | undefined)?.error;
            throw new Error(`mark audience read (${kind}) failed: ${said === undefined ? error.message : String(said)}`);
        }
        throw error;
    }
}
