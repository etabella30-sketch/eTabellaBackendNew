/**
 * The per-case "Case Admin" role, defined once (shared-libraries plan §3.2, Phase 1 step 4). Until 2026-10-06 the
 * same uuid was typed twice, in libs/global CaseAdminMiddleware and in realtime-server RealtimeTargetUserMiddleware;
 * both now re-export this constant, so their importers keep working and the id can only ever drift here.
 *
 * Pure text and values only (R2, permissions.purity.spec.ts): nothing in this module runs a query.
 */

/** RoleMaster id of the per-case "Case Admin" role. */
export const CASE_ADMIN_ROLE_ID = '8632ee5c-e854-411c-b83d-c21656ad39ac';

/**
 * One row when user $2 holds role $3 on case $1, nothing otherwise. Callers pass CASE_ADMIN_ROLE_ID as $3 (see
 * caseAdminParams) so the role id is never typed at a call site. It is the query both middlewares run today, in one
 * spelling; they keep their own text until a slice moves them, so nothing changes behaviour in Phase 1.
 */
export const CASE_ADMIN_SQL = `SELECT 1 FROM "TeamRelation" WHERE "nCaseid" = $1 AND "nUserid" = $2 AND "nRoleid" = $3`;

/** The parameter triple for CASE_ADMIN_SQL; the role id is fixed so a caller cannot ask about another role by mistake. */
export function caseAdminParams(nCaseid: string, nUserid: string): readonly [string, string, string] {
  return [nCaseid, nUserid, CASE_ADMIN_ROLE_ID];
}

/** True when a TeamRelation row's role is the Case Admin role (case-insensitive, as Postgres compares uuids). */
export function isCaseAdminRole(nRoleid: unknown): boolean {
  return typeof nRoleid === 'string' && nRoleid.toLowerCase() === CASE_ADMIN_ROLE_ID;
}
