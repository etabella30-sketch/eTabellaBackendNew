import { SESSION_ACCESS_SQL } from '../../events/realtime-socket-access';
import {
  CASE_MEMBER_SQL,
  CASE_OF_BUNDLE_SQL,
  SESSIONS_ACCESS_BATCH_SQL,
  callerIsOnCase,
  caseOf,
  visibleSessionIds,
} from './session-access-gate';

const ME = '11111111-1111-4111-8111-111111111111';
const SES_A = '33333333-3333-4333-8333-333333333333';
const SES_B = '44444444-4444-4444-8444-444444444444';
const CASE = '66666666-6666-4666-8666-666666666666';

/** The membership clause: everything from the deleted-session test up to (not including) LIMIT. */
const membershipClause = (sql: string) => sql.slice(sql.indexOf('r."dDelDt" IS NULL'), sql.includes('LIMIT') ? sql.lastIndexOf('LIMIT') : undefined).trim();

describe('SESSIONS_ACCESS_BATCH_SQL', () => {
  it('uses the single-session rule word for word, so lists and single reads cannot disagree', () => {
    expect(membershipClause(SESSIONS_ACCESS_BATCH_SQL)).toBe(membershipClause(SESSION_ACCESS_SQL));
    expect(membershipClause(SESSION_ACCESS_SQL)).toContain('"RSessionDetail"');
    expect(membershipClause(SESSION_ACCESS_SQL)).toContain('"TeamRelation"');
    expect(SESSIONS_ACCESS_BATCH_SQL).toContain('= ANY($1::uuid[])');
  });
});

describe('visibleSessionIds', () => {
  it('asks once for every distinct UUID and keeps only what the query returns', async () => {
    const db = { rowQuery: jest.fn(async () => ({ success: true, data: [{ nSesid: SES_B }] })) };
    const res = await visibleSessionIds(db, { userId: ME, isAdmin: false }, [SES_A, SES_B.toUpperCase(), null, 'x', SES_A]);
    expect([...res]).toEqual([SES_B]);
    expect(db.rowQuery).toHaveBeenCalledTimes(1);
    expect(db.rowQuery).toHaveBeenCalledWith(SESSIONS_ACCESS_BATCH_SQL, [[SES_A, SES_B], ME]);
  });

  it('gives a global admin every UUID without a query', async () => {
    const db = { rowQuery: jest.fn() };
    const res = await visibleSessionIds(db, { userId: ME, isAdmin: true }, [SES_A, 'x']);
    expect([...res]).toEqual([SES_A]);
    expect(db.rowQuery).not.toHaveBeenCalled();
  });

  it('gives nothing to a missing user, for no UUIDs, and when the lookup fails or throws', async () => {
    const db = { rowQuery: jest.fn() };
    expect((await visibleSessionIds(db, undefined, [SES_A])).size).toBe(0);
    expect((await visibleSessionIds(db, { userId: ME, isAdmin: false }, [null, 'x'])).size).toBe(0);
    expect(db.rowQuery).not.toHaveBeenCalled();
    const failing = { rowQuery: jest.fn(async () => ({ success: false, error: 'down' })) };
    expect((await visibleSessionIds(failing, { userId: ME, isAdmin: false }, [SES_A])).size).toBe(0);
    const throwing = { rowQuery: jest.fn(async () => { throw new Error('boom'); }) };
    expect((await visibleSessionIds(throwing, { userId: ME, isAdmin: false }, [SES_A])).size).toBe(0);
  });
});

describe('callerIsOnCase / caseOf', () => {
  const member = (rows: any[]) => ({ rowQuery: jest.fn(async () => ({ success: true, data: rows })) });

  it('checks TeamRelation with the token user', async () => {
    const db = member([{ '?column?': 1 }]);
    await expect(callerIsOnCase(db, { userId: ME, isAdmin: false }, CASE)).resolves.toBe(true);
    expect(db.rowQuery).toHaveBeenCalledWith(CASE_MEMBER_SQL, [CASE, ME]);
    await expect(callerIsOnCase(member([]), { userId: ME, isAdmin: false }, CASE)).resolves.toBe(false);
  });

  it('runs a case lookup only for non-admins, and refuses when it finds nothing', async () => {
    const lookup = jest.fn(async () => null);
    await expect(callerIsOnCase(member([]), { userId: ME, isAdmin: true }, lookup)).resolves.toBe(true);
    expect(lookup).not.toHaveBeenCalled();
    await expect(callerIsOnCase(member([{ x: 1 }]), { userId: ME, isAdmin: false }, lookup)).resolves.toBe(false);
    expect(lookup).toHaveBeenCalledTimes(1);
  });

  it('fails closed on a missing user, non-UUID ids and lookup errors', async () => {
    const db = member([{ x: 1 }]);
    await expect(callerIsOnCase(db, undefined, CASE)).resolves.toBe(false);
    await expect(callerIsOnCase(db, { userId: 'nope', isAdmin: true }, CASE)).resolves.toBe(false);
    await expect(callerIsOnCase(db, { userId: ME, isAdmin: false }, 'nope')).resolves.toBe(false);
    const throwing = { rowQuery: jest.fn(async () => { throw new Error('boom'); }) };
    await expect(callerIsOnCase(throwing, { userId: ME, isAdmin: false }, CASE)).resolves.toBe(false);
  });

  it('caseOf returns the nCaseid string, or null', async () => {
    await expect(caseOf(member([{ nCaseid: CASE }]), CASE_OF_BUNDLE_SQL, SES_A)).resolves.toBe(CASE);
    await expect(caseOf(member([]), CASE_OF_BUNDLE_SQL, SES_A)).resolves.toBeNull();
    const db = member([{ nCaseid: CASE }]);
    await expect(caseOf(db, CASE_OF_BUNDLE_SQL, 'nope')).resolves.toBeNull();
    expect(db.rowQuery).not.toHaveBeenCalled();
  });
});
