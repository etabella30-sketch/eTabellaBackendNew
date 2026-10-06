/**
 * Case membership: the TeamRelation rule the dev-only SP et_is_case_member encodes and that realtime-server's
 * session gates already spell out in SQL (session-access-gate.ts CASE_MEMBER_SQL, download/export *-access.ts).
 * The text lives here so PgCaseAccess (platform-cloud, Phase 1) and later slices run one query; the helpers around
 * it are pure so the box can share them without a database (R2, permissions.purity.spec.ts).
 *
 * Deliberately NOT part of this rule: the `cStatus = 'A'` test some create gates add (coreapi fact-access.ts,
 * realtime-server fact-create-gate.ts) and the global-admin exemption. Reads use plain membership today; a slice
 * that needs the stricter form adds it in its own commit, with its behaviour-change list.
 */
import { isUuidText } from '@app/api-kernel';

/** One row when user $2 is on case $1 (any team, any role, any cStatus), nothing otherwise. */
export const CASE_MEMBER_SQL = `SELECT 1 FROM "TeamRelation" t WHERE t."nCaseid" = $1 AND t."nUserid" = $2 LIMIT 1`;

/**
 * Hyphenated RFC 4122 form, the only shape ids reach the gates in. The sql above compares against uuid columns, so
 * anything else can never match; refusing it before the query also keeps a cast error from being read as a fault.
 * The test itself is the kernel's (actor-fields.ts UUID_TEXT_RE), re-exported here so the gates, the shared DTOs
 * and the box can never disagree on what a uuid looks like.
 */
export { isUuidText };

/**
 * The parameter pair for CASE_MEMBER_SQL, or null when either id is not a uuid: the caller then refuses without a
 * query (fails closed), the rule every realtime-server gate applies to non-UUID ids.
 */
export function caseMemberParams(nCaseid: unknown, nUserid: unknown): readonly [string, string] | null {
  if (!isUuidText(nCaseid) || !isUuidText(nUserid)) return null;
  return [nCaseid, nUserid];
}

/** What CASE_MEMBER_SQL's answer means: a member when at least one row came back. */
export function hasCaseMemberRow(rows: readonly unknown[] | null | undefined): boolean {
  return Array.isArray(rows) && rows.length > 0;
}
