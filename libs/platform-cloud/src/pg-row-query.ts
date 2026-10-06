/**
 * ROW_QUERY over the host's DbService.rowQuery, which answers `{success: true, data: rows}` or `{success: false,
 * error}` and never throws itself. The port promises rows or a DomainError('upstream'): a shared gate (the team
 * rule, case membership) must not mistake a failed lookup for "no rows", which would turn a database fault into a
 * permission answer. The database's text stays in `detail` (server-side); the message is a stable code.
 */
import type { DbService } from '@app/global/db/pg/db.service';
import { DomainError, RowQuery } from '@app/api-kernel';
import { errorText } from './pg-sp-executor';

/** What this adapter needs of DbService. */
export type RowDb = Pick<DbService, 'rowQuery'>;

/** Message of the DomainError('upstream') a failed or throwing query becomes. */
export const ROW_QUERY_FAILED = 'row_query_failed';

export class PgRowQuery implements RowQuery {
  constructor(private readonly db: RowDb) {}

  async rows<R = Record<string, unknown>>(sql: string, params: readonly unknown[]): Promise<readonly R[]> {
    let res: { success?: unknown; data?: unknown; error?: unknown } | null | undefined;
    try {
      // rowQuery takes a mutable array; the caller's list is never handed over.
      res = await this.db.rowQuery(sql, [...params]);
    } catch (error) {
      throw new DomainError('upstream', ROW_QUERY_FAILED, { error: errorText(error) });
    }
    if (res?.success !== true) throw new DomainError('upstream', ROW_QUERY_FAILED, { error: errorText(res?.error) });
    return Array.isArray(res.data) ? (res.data as R[]) : [];
  }
}
