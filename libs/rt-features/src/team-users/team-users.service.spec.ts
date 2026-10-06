import { Caller, DomainError, SpExecutor, SpOutcome, RowQuery } from '@app/api-kernel';
import { CALLER_TEAMS_SQL } from '@app/permissions';

import { isFailureRow, TEAM_USERS_FAILED, TEAM_USERS_SP, TeamUsersService } from './team-users.service';
import { CALLER_TEAM_ROWS, CONFORMANCE_CALLER, CONFORMANCE_CASE, expectConformantListing, SP_ROWS } from './testing/conformance';

/*
 * The live executor against fakes of the two storage ports: the SP call it makes (the verified caller as
 * nMasterid, the case as the DTO delivered it), the team rule applied to the rows, and the one DomainError every
 * failure becomes (a failed call, a missing cursor, the SP's own failure row), which the hosts' legacy shapes render.
 */

const caller: Caller = { userId: CONFORMANCE_CALLER, family: 'cloud-jwt', isPlatformAdmin: false, caseScope: 'membership' };

function world(outcome: SpOutcome<unknown>, teamRows: readonly unknown[] = CALLER_TEAM_ROWS) {
  const calls: unknown[][] = [];
  const sp: SpExecutor = { call: async (...args) => { calls.push(args); return outcome as unknown as SpOutcome<never>; } };
  const queries: unknown[][] = [];
  const rows: RowQuery = { rows: async (sql, params) => { queries.push([sql, params]); return teamRows as never; } };
  return { service: new TeamUsersService(sp, rows), calls, queries };
}

describe('TeamUsersService (the live executor)', () => {
  it('calls public.et_common_my_team_user with the verified caller, never the request\'s ids, and answers the same-team rows', async () => {
    const w = world({ ok: true, cursors: [SP_ROWS] });
    const answer = await w.service.listMyTeamUsers(caller, { nCaseid: CONFORMANCE_CASE, nMasterid: 'forged', nUserid: 'forged' });
    expect(w.calls).toEqual([[TEAM_USERS_SP, { nMasterid: CONFORMANCE_CALLER, nCaseid: CONFORMANCE_CASE }, 'public']]);
    expect(w.queries).toEqual([[CALLER_TEAMS_SQL, [CONFORMANCE_CASE, CONFORMANCE_CALLER]]]);
    expectConformantListing(answer);
  });

  it('sends nCaseid as delivered (null for the coreapi sentinels) and omits it when absent; a non-uuid case keeps only the caller\'s own rows', async () => {
    const nulled = world({ ok: true, cursors: [SP_ROWS] });
    expect(await nulled.service.listMyTeamUsers(caller, { nCaseid: null })).toEqual([SP_ROWS[0]]);
    expect(nulled.calls[0][1]).toEqual({ nMasterid: CONFORMANCE_CALLER, nCaseid: null });
    expect(nulled.queries).toEqual([]);
    const absent = world({ ok: true, cursors: [[]] });
    expect(await absent.service.listMyTeamUsers(caller, {})).toEqual([]);
    expect(absent.calls[0][1]).toEqual({ nMasterid: CONFORMANCE_CALLER });
  });

  it('a failed call is upstream with what the SP said; a missing cursor too', async () => {
    await expect(world({ ok: false, error: 'db said no' }).service.listMyTeamUsers(caller, { nCaseid: CONFORMANCE_CASE }))
      .rejects.toMatchObject({ code: 'upstream', message: TEAM_USERS_FAILED, detail: { error: 'db said no' } });
    await expect(world({ ok: true, cursors: [] }).service.listMyTeamUsers(caller, { nCaseid: CONFORMANCE_CASE }))
      .rejects.toMatchObject({ code: 'upstream', detail: { error: 'no_cursor' } });
  });

  it('the SP\'s own failure row is upstream carrying that row (coreapi passes it through, realtime-server answers 500)', async () => {
    const row = { msg: -1, error: 'private diagnostic' };
    const err = await world({ ok: true, cursors: [[row]] }).service.listMyTeamUsers(caller, { nCaseid: CONFORMANCE_CASE }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(DomainError);
    expect((err as DomainError).detail).toEqual({ error: 'private diagnostic', row });
    expect([isFailureRow({ msg: -1 }), isFailureRow({ msg: '-1' }), isFailureRow({ msg: 1 }), isFailureRow({ nUserid: 'x' }), isFailureRow(null)]).toEqual([true, true, false, false, false]);
  });

  it('a failed team lookup fails closed (the rule exists once, and it must run)', async () => {
    const sp: SpExecutor = { call: async () => ({ ok: true, cursors: [SP_ROWS] }) as unknown as SpOutcome<never> };
    const rows: RowQuery = { rows: async () => { throw new DomainError('upstream', 'row_query_failed'); } };
    await expect(new TeamUsersService(sp, rows).listMyTeamUsers(caller, { nCaseid: CONFORMANCE_CASE })).rejects.toMatchObject({ code: 'upstream' });
  });
});
