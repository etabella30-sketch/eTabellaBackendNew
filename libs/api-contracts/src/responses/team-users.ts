/**
 * Wire shapes of the team-users lookup, slice 1 of the shared-libraries plan (Phase 5): `GET /coreapi/common/myteamusers`
 * and `GET /realtimeapi/factsheet/teamusers`, both over `public.et_common_my_team_user`.
 *
 * Interfaces only. The validated request class (`TeamUsersQuery extends ActorFields`, class-validator rules) lives
 * with the feature in @app/rt-features; this is the shape the two hosts, the box relay and the FE agree on, which the
 * FE JSON export can carry without a class in it.
 */

/**
 * One same-team user of the caller on a case. Nullable columns follow the SP: `cProfile`, `cEmail`, `cTeamname` and
 * `cClr` are NULL when unset, and a member without a role has `nRoleid` and `cRole` NULL (the 2026-10-06 LEFT JOIN on
 * RoleMaster; before it such members vanished from every team list). `isAdmin` is `UserMaster.isAdmin OR RoleMaster.nSrno = 1`,
 * so a role-less member is an admin only by their user flag.
 */
export interface TeamUserRow {
  nUserid: string;
  cFname: string;
  cLname: string;
  cProfile: string | null;
  isAdmin: boolean;
  cEmail: string | null;
  nRoleid: string | null;
  cRole: string | null;
  nTeamid: string;
  cTeamname: string | null;
  cClr: string | null;
}

/** The query of the lookup. The actor is the verified Caller, never a field here (R4). */
export interface TeamUsersQuery {
  nCaseid: string;
}
