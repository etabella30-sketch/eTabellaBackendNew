/**
 * SP_EXECUTOR over the host's DbService.executeRef (libs/global/src/db/pg/db.service.ts): how a live shared service
 * calls a stored procedure. Never bound on the venue box. Two facts of executeRef shape this adapter:
 *  - it mutates its params (`delete params.ref`), so the caller's object is copied first: a service may keep and
 *    reuse what it passed, and `ref` (the cursor count) still reaches executeRef through the copy;
 *  - it answers `{success, data: cursor[]}` or `{success: false, error}` and only throws when the pool itself does,
 *    so a throw is a fault, not a database answer: it becomes ok:false with a fixed message, and the real error goes
 *    to the host's logger (Nest's Logger, which the live apps route to Winston), never into a response.
 * The schema is forwarded only when given, so a call without one reaches executeRef exactly as today's services make it.
 */
import { Logger } from '@nestjs/common';
import type { DbService } from '@app/global/db/pg/db.service';
import { SpExecutor, SpOutcome, SpSchema } from '@app/api-kernel';

/** What this adapter needs of DbService. */
export type SpDb = Pick<DbService, 'executeRef'>;

/** The `error` of an ok:false outcome when executeRef threw (the real error is logged, never answered). */
export const SP_CALL_FAILED = 'stored_procedure_call_failed';

/** The `error` of an ok:false outcome when the host reported a failure without saying why. */
export const SP_UNKNOWN_ERROR = 'unknown_error';

/** The text of whatever the host put in `error`: executeRef's own catch stores the Error object, rowQuery its message. */
export function errorText(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error || SP_UNKNOWN_ERROR;
  if (error && typeof error === 'object' && typeof (error as { message?: unknown }).message === 'string') {
    return (error as { message: string }).message;
  }
  return error === undefined || error === null ? SP_UNKNOWN_ERROR : String(error);
}

export class PgSpExecutor implements SpExecutor {
  private readonly logger = new Logger(PgSpExecutor.name);

  constructor(private readonly db: SpDb) {}

  async call<R = Record<string, unknown>>(
    fn: string,
    params: Readonly<Record<string, unknown>>,
    schema?: SpSchema,
  ): Promise<SpOutcome<R>> {
    const copy: Record<string, unknown> = { ...params };
    let res: { success?: unknown; data?: unknown; error?: unknown } | null | undefined;
    try {
      res = schema === undefined ? await this.db.executeRef(fn, copy) : await this.db.executeRef(fn, copy, schema);
    } catch (error) {
      this.logger.error(`${schema ?? 'public'}.et_${fn} threw: ${errorText(error)}`);
      return { ok: false, error: SP_CALL_FAILED };
    }
    if (res?.success === true) {
      return { ok: true, cursors: Array.isArray(res.data) ? (res.data as ReadonlyArray<ReadonlyArray<R>>) : [] };
    }
    return { ok: false, error: errorText(res?.error) };
  }
}
