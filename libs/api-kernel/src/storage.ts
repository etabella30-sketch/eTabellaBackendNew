/**
 * Storage ports of the live hosts. They are bound by @app/platform-cloud over each app's existing DbService (one pg
 * pool per host, as today) and never on the venue box, which has no database: a shared service that needs storage
 * is mounted on the box only behind a relay or a local executor (plan §3.3).
 *
 * SpOutcome mirrors what `executeRef` returns today (`{success, data: cursor[]}` / `{success:false, error}`) as a
 * discriminated union, so a service cannot forget the failure branch.
 */

export const SP_EXECUTOR = 'ET_SP_EXECUTOR';

export type SpSchema = 'public' | 'realtime' | 'transcript' | 'task' | 'present' | 'helpcenter' | 'elastic' | 'download';

export type SpOutcome<R> =
  | { readonly ok: true; readonly cursors: ReadonlyArray<ReadonlyArray<R>> }
  | { readonly ok: false; readonly error: string };

export interface SpExecutor {
  /** Calls stored procedure `fn` (without the `et_` prefix, as executeRef takes it) in `schema` (default public). */
  call<R = Record<string, unknown>>(fn: string, params: Readonly<Record<string, unknown>>, schema?: SpSchema): Promise<SpOutcome<R>>;
}

export const ROW_QUERY = 'ET_ROW_QUERY';

/** Parameterised SQL reads (the gate SQL of @app/permissions). Replaces the per-app RowQueryDb / Pick<DbService> types. */
export interface RowQuery {
  rows<R = Record<string, unknown>>(sql: string, params: readonly unknown[]): Promise<readonly R[]>;
}
