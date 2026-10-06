import { DomainError, RowQuery } from '@app/api-kernel';

import { MARK_AUDIENCE_SQL, markId, readMarkAudience } from './mark-audience';

/*
 * The mark audience rule over the ROW_QUERY port (the schema-dump contract of the SQL text stays beside
 * realtime-server, apps/realtime-server/src/services/marks/mark-audience.sql.spec.ts, which reads these constants).
 */

const MARK = '55555555-5555-4555-8555-555555555555';
const SES = '33333333-3333-4333-8333-333333333333';
const OWNER = '11111111-1111-4111-8111-111111111111';
const FRIEND = '22222222-2222-4222-8222-222222222222';
const KINDS = ['Q', 'F', 'D'] as const;

function world(rows: readonly unknown[]) {
  const calls: unknown[][] = [];
  const db: RowQuery = { rows: async (sql, params) => { calls.push([sql, params]); return rows as never; } };
  return { db, calls };
}

describe('mark audience (live mark sync), the rule once', () => {
  it('one frozen read per kind, read-only, $1 only, the uuid key against a uuid parameter', () => {
    expect(Object.keys(MARK_AUDIENCE_SQL).sort()).toEqual(['D', 'F', 'Q']);
    expect(Object.isFrozen(MARK_AUDIENCE_SQL)).toBe(true);
    for (const kind of KINDS) {
      const sql = MARK_AUDIENCE_SQL[kind];
      expect(sql.trimStart().startsWith('SELECT')).toBe(true);
      expect(sql).not.toMatch(/\b(INSERT|UPDATE|DELETE|TRUNCATE|DROP|ALTER|CREATE|GRANT)\b/i);
      expect([...new Set([...sql.matchAll(/\$(\d+)/g)].map((m) => m[1]))]).toEqual(['1']);
      expect(sql).toContain('= $1::uuid');
    }
  });

  it.each(KINDS)('%s: sends the constant with the lower-cased id and answers the session and the author + share recipients, once each', async (kind) => {
    const w = world([{ nSesid: SES.toUpperCase(), nOwner: OWNER, aShared: [FRIEND, OWNER, null, 'junk', FRIEND.toUpperCase()] }]);
    await expect(readMarkAudience(w.db, kind, MARK.toUpperCase())).resolves.toEqual({ nSesid: SES, users: [OWNER, FRIEND] });
    expect(w.calls).toEqual([[MARK_AUDIENCE_SQL[kind], [MARK]]]);
  });

  it('a mark with no session (a Document Reader PDF mark) keeps its audience with nSesid null', async () => {
    await expect(readMarkAudience(world([{ nSesid: null, nOwner: OWNER, aShared: [] }]).db, 'F', MARK)).resolves.toEqual({ nSesid: null, users: [OWNER] });
  });

  it('null when the mark does not exist; no read for an id that is not a uuid or an unknown kind', async () => {
    const w = world([]);
    await expect(readMarkAudience(w.db, 'D', MARK)).resolves.toBeNull();
    await expect(readMarkAudience(w.db, 'D', 'not-a-uuid')).resolves.toBeNull();
    await expect(readMarkAudience(w.db, 'X' as never, MARK)).resolves.toBeNull();
    expect(w.calls).toHaveLength(1);
  });

  it('a failed read throws as the port does (the caller logs it and sends no notice from it)', async () => {
    const failing: RowQuery = { rows: async () => { throw new DomainError('upstream', 'row_query_failed', { error: 'db down' }); } };
    await expect(readMarkAudience(failing, 'Q', MARK)).rejects.toMatchObject({ code: 'upstream', detail: { error: 'db down' } });
  });

  it('markId lower-cases a uuid and refuses anything else', () => {
    expect([markId(MARK.toUpperCase()), markId('x'), markId(null), markId(5)]).toEqual([MARK, null, null, null]);
  });
});
