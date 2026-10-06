import { DomainError, type RowQuery } from '@app/api-kernel';
import {
  assertSameTeamRecipients,
  CALLER_TEAMS_SQL,
  callerTeamsFrom,
  callerTeamsOf,
  CROSS_TEAM_RECIPIENT,
  keepSameTeamRows,
  OUTSIDE_CALLER_TEAMS_SQL,
  TEAM_SCOPE_LOOKUP_FAILED,
} from './team-scope';

const CASE = '11111111-1111-4111-8111-111111111111';
const ME = '22222222-2222-4222-8222-222222222222';
const TEAM_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const TEAM_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const ALLY = '33333333-3333-4333-8333-333333333333';
const STRANGER = '44444444-4444-4444-8444-444444444444';

function fakeDb(rows: unknown[] | Error = []): RowQuery & { rows: jest.Mock } {
  const fn = jest.fn();
  if (rows instanceof Error) fn.mockRejectedValue(rows);
  else fn.mockResolvedValue(rows);
  return { rows: fn };
}

async function caught(run: () => Promise<unknown>): Promise<unknown> {
  try {
    await run();
  } catch (err) {
    return err;
  }
  return null;
}

describe('team-scope SQL text', () => {
  it('CALLER_TEAMS_SQL is the team subquery of et_common_my_team_user on ($1 case, $2 user)', () => {
    expect(CALLER_TEAMS_SQL).toBe('SELECT "nTeamid" FROM "TeamRelation" WHERE "nCaseid" = $1 AND "nUserid" = $2');
  });

  it('OUTSIDE_CALLER_TEAMS_SQL unnests $3 as uuid[] and answers one "nUserid" per recipient outside the caller teams', () => {
    expect(OUTSIDE_CALLER_TEAMS_SQL).toContain('unnest($3::uuid[])');
    expect(OUTSIDE_CALLER_TEAMS_SQL).toContain('AS "nUserid"');
    expect(OUTSIDE_CALLER_TEAMS_SQL).toContain('NOT EXISTS');
    // Both TeamRelation rows are pinned to the case: a team shared on another case must not count.
    expect(OUTSIDE_CALLER_TEAMS_SQL).toContain('c."nCaseid" = $1 AND c."nUserid" = $2');
    expect(OUTSIDE_CALLER_TEAMS_SQL).toContain('t."nCaseid" = $1 AND t."nUserid" = r.id');
    expect(OUTSIDE_CALLER_TEAMS_SQL).toContain('c."nTeamid" = t."nTeamid"');
    expect(OUTSIDE_CALLER_TEAMS_SQL).not.toMatch(/\$4/);
  });

  it.each([CALLER_TEAMS_SQL, OUTSIDE_CALLER_TEAMS_SQL])('uses double-quoted identifiers only: %s', (sql) => {
    for (const ident of sql.match(/\b(n[A-Z]\w+|TeamRelation)\b/g) ?? []) {
      expect(sql).toContain(`"${ident}"`);
    }
  });
});

describe('callerTeamsFrom', () => {
  it('lower-cases the ids and drops NULL teams', () => {
    const teams = callerTeamsFrom([{ nTeamid: TEAM_A.toUpperCase() }, { nTeamid: null }, { nTeamid: TEAM_B }, { nTeamid: '' }]);
    expect([...teams].sort()).toEqual([TEAM_A, TEAM_B].sort());
  });

  it('is empty for no rows', () => {
    expect(callerTeamsFrom([]).size).toBe(0);
  });
});

describe('callerTeamsOf', () => {
  it('runs CALLER_TEAMS_SQL with (case, caller) and builds the set', async () => {
    const db = fakeDb([{ nTeamid: TEAM_A }]);
    const teams = await callerTeamsOf(db, CASE, ME);
    expect(db.rows).toHaveBeenCalledWith(CALLER_TEAMS_SQL, [CASE, ME]);
    expect([...teams]).toEqual([TEAM_A]);
  });

  it.each([
    ['the case id', 'nope', ME],
    ['the caller id', CASE, 'nope'],
  ])('gives an empty set without a query when %s is not a uuid', async (_label, nCaseid, callerId) => {
    const db = fakeDb([{ nTeamid: TEAM_A }]);
    expect((await callerTeamsOf(db, nCaseid, callerId)).size).toBe(0);
    expect(db.rows).not.toHaveBeenCalled();
  });
});

describe('keepSameTeamRows', () => {
  const rows = [
    { nUserid: ALLY, nTeamid: TEAM_A, cFname: 'Ally' },
    { nUserid: STRANGER, nTeamid: TEAM_B, cFname: 'Stranger' },
    { nUserid: '55555555-5555-4555-8555-555555555555', nTeamid: null, cFname: 'Teamless' },
    { nUserid: '66666666-6666-4666-8666-666666666666', cFname: 'NoTeamField' },
    { nUserid: ME, nTeamid: TEAM_B, cFname: 'Me on B' },
  ];

  it('keeps only rows whose nTeamid is one of the caller teams', () => {
    expect(keepSameTeamRows(new Set([TEAM_A]), rows).map((r) => r.cFname)).toEqual(['Ally']);
  });

  it('drops rows without a team: "no team" is not "every team"', () => {
    expect(keepSameTeamRows(new Set([TEAM_A, TEAM_B]), rows).map((r) => r.cFname)).toEqual(['Ally', 'Stranger', 'Me on B']);
  });

  it('keeps the caller own rows when callerId is given, whatever their team', () => {
    expect(keepSameTeamRows(new Set([TEAM_A]), rows, ME).map((r) => r.cFname)).toEqual(['Ally', 'Me on B']);
  });

  it('compares ids case-insensitively, as Postgres compares uuids', () => {
    expect(keepSameTeamRows(new Set([TEAM_A.toUpperCase()]), rows, ME.toUpperCase()).map((r) => r.cFname)).toEqual(['Ally', 'Me on B']);
  });

  it('keeps nothing for an empty team set without a caller, and never mutates the input', () => {
    const copy = rows.map((r) => ({ ...r }));
    expect(keepSameTeamRows(new Set(), rows)).toEqual([]);
    expect(rows).toEqual(copy);
  });

  it('returns a new array in the original order with the row objects themselves', () => {
    const kept = keepSameTeamRows(new Set([TEAM_A, TEAM_B]), rows);
    expect(kept).not.toBe(rows);
    expect(kept[0]).toBe(rows[0]);
  });
});

describe('assertSameTeamRecipients', () => {
  it('passes an empty list without a query', async () => {
    const db = fakeDb();
    await expect(assertSameTeamRecipients(db, CASE, ME, [])).resolves.toBeUndefined();
    expect(db.rows).not.toHaveBeenCalled();
  });

  it('runs OUTSIDE_CALLER_TEAMS_SQL once with (case, caller, uuid[]) and passes when nobody is outside', async () => {
    const db = fakeDb([]);
    await expect(assertSameTeamRecipients(db, CASE, ME, [ALLY])).resolves.toBeUndefined();
    expect(db.rows).toHaveBeenCalledTimes(1);
    expect(db.rows).toHaveBeenCalledWith(OUTSIDE_CALLER_TEAMS_SQL, [CASE, ME, [ALLY]]);
  });

  it('sends each recipient once, lower-cased, so the count is of users and not of repeats', async () => {
    const db = fakeDb([]);
    await assertSameTeamRecipients(db, CASE, ME, [ALLY, ALLY.toUpperCase(), ALLY]);
    expect(db.rows).toHaveBeenCalledWith(OUTSIDE_CALLER_TEAMS_SQL, [CASE, ME, [ALLY]]);
  });

  it('throws DomainError forbidden cross_team_recipient with only a count, never the ids', async () => {
    const db = fakeDb([{ nUserid: STRANGER }]);
    const err = await caught(() => assertSameTeamRecipients(db, CASE, ME, [ALLY, STRANGER]));
    expect(err).toBeInstanceOf(DomainError);
    expect((err as DomainError).code).toBe('forbidden');
    expect((err as DomainError).message).toBe(CROSS_TEAM_RECIPIENT);
    expect((err as DomainError).detail).toEqual({ count: 1 });
    expect(JSON.stringify(err)).not.toContain(STRANGER);
    expect(JSON.stringify(err)).not.toContain(ALLY);
  });

  it('counts a recipient id that is not a uuid as outside, with the query run only for the uuids', async () => {
    const db = fakeDb([{ nUserid: STRANGER }]);
    const err = await caught(() => assertSameTeamRecipients(db, CASE, ME, ['bob', STRANGER, ALLY]));
    expect((err as DomainError).detail).toEqual({ count: 2 });
    expect(db.rows).toHaveBeenCalledWith(OUTSIDE_CALLER_TEAMS_SQL, [CASE, ME, [STRANGER, ALLY]]);
  });

  it('refuses without a query when no recipient id is a uuid', async () => {
    const db = fakeDb();
    const err = await caught(() => assertSameTeamRecipients(db, CASE, ME, ['bob', '']));
    expect((err as DomainError).code).toBe('forbidden');
    expect((err as DomainError).detail).toEqual({ count: 2 });
    expect(db.rows).not.toHaveBeenCalled();
  });

  it.each([
    ['the case id', 'nope', ME],
    ['the caller id', CASE, 'nope'],
  ])('refuses every recipient without a query when %s is not a uuid', async (_label, nCaseid, callerId) => {
    const db = fakeDb();
    const err = await caught(() => assertSameTeamRecipients(db, nCaseid, callerId, [ALLY, STRANGER]));
    expect((err as DomainError).code).toBe('forbidden');
    expect((err as DomainError).detail).toEqual({ count: 2 });
    expect(db.rows).not.toHaveBeenCalled();
  });

  it('reports a failed lookup as unavailable, never as a refusal', async () => {
    const db = fakeDb(new Error('connection reset'));
    const err = await caught(() => assertSameTeamRecipients(db, CASE, ME, [ALLY]));
    expect(err).toBeInstanceOf(DomainError);
    expect((err as DomainError).code).toBe('unavailable');
    expect((err as DomainError).message).toBe(TEAM_SCOPE_LOOKUP_FAILED);
    expect(JSON.stringify(err)).not.toContain(ALLY);
  });
});
