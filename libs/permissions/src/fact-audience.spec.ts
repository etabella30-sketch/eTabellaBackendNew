import { DomainError, RowQuery } from '@app/api-kernel';

import { FACT_VIEW_SQL, FACT_VIEWERS_SQL, factViewers, userMayViewFact } from './fact-audience';

/*
 * The fact audience rule, once: the viewers of a fact for the comment broadcast, and the yes/no of one user for the
 * socket room, both over the ROW_QUERY port (moved from coreapi fact-viewers.ts and socket-app socket-room-access.ts).
 */

const FACT = '5d0c5b2e-2b9e-4c7e-8f0a-1a2b3c4d5e6f';
const OWNER = '043c3b64-0e14-494d-af52-eeff4cc407f5';
const KHENT = '9d1f5f0a-52c1-4c3c-9d0e-6f6f0a1b2c3d';
const INDER = '7a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d';

function world(rows: readonly unknown[]) {
  const calls: unknown[][] = [];
  const db: RowQuery = { rows: async (sql, params) => { calls.push([sql, params]); return rows as never; } };
  return { db, calls };
}

describe('fact audience (the bCanView rule, defined once)', () => {
  it("factViewers lists the fact's viewers once each (case-insensitively, the first spelling kept), the author among them, the id lower-cased in the read", async () => {
    const w = world([OWNER, KHENT, KHENT.toUpperCase(), INDER, ' ', null].map((nUserid) => ({ nUserid })));
    await expect(factViewers(w.db, FACT.toUpperCase())).resolves.toEqual([OWNER, KHENT, INDER]);
    expect(w.calls).toEqual([[FACT_VIEWERS_SQL, [FACT]]]);
  });

  it('factViewers answers nobody without a read for an id that is not a uuid; a failed read throws as the port does', async () => {
    const w = world([{ nUserid: OWNER }]);
    await expect(factViewers(w.db, "'; drop table")).resolves.toEqual([]);
    await expect(factViewers(w.db, undefined)).resolves.toEqual([]);
    expect(w.calls).toEqual([]);
    const failing: RowQuery = { rows: async () => { throw new DomainError('upstream', 'row_query_failed'); } };
    await expect(factViewers(failing, FACT)).rejects.toMatchObject({ code: 'upstream' });
  });

  it('userMayViewFact asks FACT_VIEW_SQL for (fact, user) and answers whether a row came back; an id that is not a uuid is a no without a read', async () => {
    const yes = world([{ '?column?': 1 }]);
    await expect(userMayViewFact(yes.db, FACT.toUpperCase(), OWNER)).resolves.toBe(true);
    expect(yes.calls).toEqual([[FACT_VIEW_SQL, [FACT, OWNER]]]);
    const no = world([]);
    await expect(userMayViewFact(no.db, FACT, OWNER)).resolves.toBe(false);
    await expect(userMayViewFact(no.db, 'nope', OWNER)).resolves.toBe(false);
    await expect(userMayViewFact(no.db, FACT, 'nope')).resolves.toBe(false);
    expect(no.calls).toHaveLength(1);
  });

  it("both reads are the same rule, read-only: owner, FMShared recipient, or an active-member assignee of a linked task on the fact's case", () => {
    for (const sql of [FACT_VIEWERS_SQL, FACT_VIEW_SQL]) {
      expect(sql.trimStart().startsWith('SELECT')).toBe(true);
      expect(sql).not.toMatch(/\b(INSERT|UPDATE|DELETE|TRUNCATE|DROP|ALTER|CREATE|GRANT)\b/i);
      for (const table of ['"FactMaster"', '"FMShared"', '"FMTasks"', '"TaskMaster"', '"TaskShared"', '"TeamRelation"']) expect(sql).toContain(table);
      expect(sql).toContain(`tr."cStatus" = 'A'`);
      expect(sql).not.toContain('${');
    }
    expect([...new Set([...FACT_VIEWERS_SQL.matchAll(/\$(\d+)/g)].map((m) => m[1]))]).toEqual(['1']);
    expect([...new Set([...FACT_VIEW_SQL.matchAll(/\$(\d+)/g)].map((m) => m[1]))].sort()).toEqual(['1', '2']);
  });
});
