import { ROW_QUERY, RowQuery, SP_EXECUTOR, SpExecutor, SpOutcome, SpSchema } from './storage';

// The storage ports platform-cloud binds and rt-features' live services call: tokens and the outcome shape are pinned.

/** A fake executor in the shape of executeRef's answers: cursors on success, one error string on failure. */
class RecordingExecutor implements SpExecutor {
  readonly calls: Array<{ fn: string; params: Readonly<Record<string, unknown>>; schema: SpSchema | undefined }> = [];

  constructor(private readonly answer: SpOutcome<Record<string, unknown>>) {}

  async call<R = Record<string, unknown>>(fn: string, params: Readonly<Record<string, unknown>>, schema?: SpSchema): Promise<SpOutcome<R>> {
    this.calls.push({ fn, params, schema });
    return this.answer as SpOutcome<R>;
  }
}

describe('storage ports', () => {
  it('pins the tokens and the schema names executeRef accepts', () => {
    expect(SP_EXECUTOR).toBe('ET_SP_EXECUTOR');
    expect(ROW_QUERY).toBe('ET_ROW_QUERY');
    const schemas: SpSchema[] = ['public', 'realtime', 'transcript', 'task', 'present', 'helpcenter', 'elastic', 'download'];
    expect(schemas).toHaveLength(8);
  });

  it('an SpOutcome narrows on ok, so a service cannot read cursors of a failed call', async () => {
    const ok = new RecordingExecutor({ ok: true, cursors: [[{ nUserid: 'u1' }], []] });
    const outcome = await ok.call<{ nUserid: string }>('common_my_team_user', { nCaseid: 'c1', nMasterid: 'u1' }, 'public');
    expect(outcome.ok).toBe(true);
    if (outcome.ok) expect(outcome.cursors[0][0].nUserid).toBe('u1');
    expect(ok.calls).toEqual([{ fn: 'common_my_team_user', params: { nCaseid: 'c1', nMasterid: 'u1' }, schema: 'public' }]);

    const failed = new RecordingExecutor({ ok: false, error: 'private database diagnostic' });
    const failure = await failed.call('common_my_team_user', { nCaseid: 'c1' });
    expect(failure).toEqual({ ok: false, error: 'private database diagnostic' });
    expect(failed.calls[0].schema).toBeUndefined();
  });

  it('a RowQuery answers plain rows for parameterised SQL', async () => {
    const db: RowQuery = { rows: async <R>(_sql: string, params: readonly unknown[]) => [{ n: params.length }] as unknown as R[] };
    await expect(db.rows<{ n: number }>('SELECT 1', ['a', 'b'])).resolves.toEqual([{ n: 2 }]);
  });
});
