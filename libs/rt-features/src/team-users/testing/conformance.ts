/**
 * Gate G2 of the team-users feature: the same fixtures and the same expectations on every host that mounts it
 * (coreapi, realtime-server, the box's relay). A host spec feeds `SP_ROWS` to its storage fake (or its fake cloud)
 * and asserts `expectConformantListing(answer)`: the two same-team rows come back, the role-less member included
 * (the 2026-10-06 LEFT JOIN), the cross-team row never (the team rule of @app/permissions, even if the SP leaked it),
 * in the SP's order. Test code only: never imported by a source file.
 */
import type { TeamUserRow } from '@app/api-contracts';

export const CONFORMANCE_CASE = 'ca5e0000-0000-4000-8000-0000000000c1';
export const CONFORMANCE_CALLER = '11111111-1111-4111-8111-111111111111';
export const CONFORMANCE_TEAM = '7ea00000-0000-4000-8000-000000000001';
export const CONFORMANCE_OTHER_TEAM = '7ea00000-0000-4000-8000-000000000002';

const row = (over: Partial<TeamUserRow> & Pick<TeamUserRow, 'nUserid' | 'cFname' | 'cLname' | 'nTeamid'>): TeamUserRow => ({
  cProfile: null,
  isAdmin: false,
  cEmail: null,
  nRoleid: null,
  cRole: null,
  cTeamname: 'Claimant',
  cClr: '#ff3d00',
  ...over,
});

/** The caller, a teammate with a role, a role-less teammate, and a row from the other team. */
export const SP_ROWS: readonly TeamUserRow[] = Object.freeze([
  row({ nUserid: CONFORMANCE_CALLER, cFname: 'Me', cLname: 'Caller', nTeamid: CONFORMANCE_TEAM, nRoleid: 'r1', cRole: 'Default User', cEmail: 'me@x.test' }),
  row({ nUserid: '22222222-2222-4222-8222-222222222222', cFname: 'Team', cLname: 'Mate', nTeamid: CONFORMANCE_TEAM, nRoleid: 'r1', cRole: 'Default User' }),
  row({ nUserid: '33333333-3333-4333-8333-333333333333', cFname: 'No', cLname: 'Role', nTeamid: CONFORMANCE_TEAM }),
  row({ nUserid: '44444444-4444-4444-8444-444444444444', cFname: 'Other', cLname: 'Team', nTeamid: CONFORMANCE_OTHER_TEAM, cTeamname: 'Respondent', cClr: '#0057ff' }),
]);

/** The caller's TeamRelation rows on the case, as CALLER_TEAMS_SQL returns them. */
export const CALLER_TEAM_ROWS: readonly { nTeamid: string }[] = Object.freeze([{ nTeamid: CONFORMANCE_TEAM }]);

/** What every host must answer for SP_ROWS: the three same-team rows, in order, nothing from the other team. */
export const EXPECTED_ROWS: readonly TeamUserRow[] = Object.freeze(SP_ROWS.slice(0, 3));

/** Throws with the difference when a listing is not the conformant one. */
export function expectConformantListing(answer: unknown): void {
  const got = JSON.stringify(answer);
  const want = JSON.stringify(EXPECTED_ROWS);
  if (got !== want) throw new Error(`team-users conformance: expected ${want}\n   got ${got}`);
}
