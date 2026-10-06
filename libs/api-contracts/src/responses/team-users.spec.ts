/**
 * TeamUserRow is the wire shape the conformance fixtures of Phase 5 are typed with, so its key set is pinned here:
 * a column added to the SP must be added to the interface on purpose, and a key removed by mistake fails to compile.
 */
import type { TeamUserRow, TeamUsersQuery } from './team-users';

/** `true` only when A and B are the same type in both directions. */
type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

const rowKeysAreExact: Equals<
  keyof TeamUserRow,
  'nUserid' | 'cFname' | 'cLname' | 'cProfile' | 'isAdmin' | 'cEmail' | 'nRoleid' | 'cRole' | 'nTeamid' | 'cTeamname' | 'cClr'
> = true;

const queryKeysAreExact: Equals<keyof TeamUsersQuery, 'nCaseid'> = true;

/** A role-less member of a team, exactly as the SP returns one after the 2026-10-06 LEFT JOIN. */
const roleless: TeamUserRow = {
  nUserid: '2f0d1a6e-5b4c-4e8f-9a1b-0c3d4e5f6a7b',
  cFname: 'CL',
  cLname: '02',
  cProfile: null,
  isAdmin: false,
  cEmail: null,
  nRoleid: null,
  cRole: null,
  nTeamid: '8d9e0f1a-2b3c-4d5e-6f7a-8b9c0d1e2f3a',
  cTeamname: 'Local - Respondent',
  cClr: null,
};

describe('libs/api-contracts responses/team-users', () => {
  it('pins the TeamUserRow and TeamUsersQuery keys', () => {
    expect([rowKeysAreExact, queryKeysAreExact]).toEqual([true, true]);
  });

  it('a role-less member is representable: nRoleid and cRole null, isAdmin false', () => {
    expect(Object.keys(roleless).length).toBe(11);
    expect(roleless.nRoleid).toBeNull();
    expect(roleless.cRole).toBeNull();
    expect(roleless.isAdmin).toBe(false);
  });
});
