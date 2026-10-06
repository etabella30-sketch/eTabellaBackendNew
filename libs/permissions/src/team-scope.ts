/**
 * The team rule, once (shared-libraries plan §3.6; product rule 2026-10-06): on a case a user may see, list or share
 * with only users who share at least one TeamRelation.nTeamid with them on that case. Nothing crosses teams:
 * comments, shares, participants, claims, issues, facts, QFacts, marks, tasks. Until now the rule existed only inside
 * SPs (et_common_my_team_user's team subquery); here it is text plus two pure-ish helpers every slice calls:
 *  - reads filter with keepSameTeamRows (defence in depth behind the SP's own filter);
 *  - writes with recipients call assertSameTeamRecipients before fact_insert_team and every share / assign write.
 * The box never runs either: its roster has no nTeamid, so a teamScoped route is always a relay (R5).
 *
 * R2: only @app/api-kernel is imported (the RowQuery port and DomainError); no database, no Nest, no apps/.
 */
import { DomainError, type RowQuery } from '@app/api-kernel';
import { isUuidText } from './case-membership';

/** The teams of user $2 on case $1: the subquery et_common_my_team_user filters by, word for word. */
export const CALLER_TEAMS_SQL = `SELECT "nTeamid" FROM "TeamRelation" WHERE "nCaseid" = $1 AND "nUserid" = $2`;

/**
 * Of the user ids in $3 (uuid[]), those that share NO nTeamid with caller $2 on case $1: one "nUserid" row each.
 * A recipient with no TeamRelation row on the case, or only rows whose nTeamid is NULL, is outside too (NULL never
 * equals a team), so "not on the case" and "on another team" are refused by the same rule. Unnest keeps the answer
 * one query however many recipients a share names.
 */
export const OUTSIDE_CALLER_TEAMS_SQL = `SELECT DISTINCT r.id AS "nUserid"
 FROM unnest($3::uuid[]) AS r(id)
 WHERE NOT EXISTS (
   SELECT 1 FROM "TeamRelation" t
   JOIN "TeamRelation" c ON c."nTeamid" = t."nTeamid" AND c."nCaseid" = $1 AND c."nUserid" = $2
   WHERE t."nCaseid" = $1 AND t."nUserid" = r.id)`;

/** A row CALLER_TEAMS_SQL answers with. */
export interface CallerTeamRow {
  readonly nTeamid: string | null;
}

/** A row OUTSIDE_CALLER_TEAMS_SQL answers with. */
export interface OutsideCallerTeamsRow {
  readonly nUserid: string;
}

/** Thrown by assertSameTeamRecipients; the message is the stable code the FE and the conformance specs match on. */
export const CROSS_TEAM_RECIPIENT = 'cross_team_recipient';

/** Thrown by assertSameTeamRecipients when the lookup itself failed: a fault, never reported as a refusal. */
export const TEAM_SCOPE_LOOKUP_FAILED = 'team_scope_lookup_failed';

const lower = (id: string): string => id.toLowerCase();

/**
 * The caller's team set from CALLER_TEAMS_SQL rows. Ids are lower-cased so a set built from Postgres (lower-case
 * uuids) matches rows and tokens whatever their case; NULL teams are dropped because they are not a team.
 */
export function callerTeamsFrom(rows: readonly CallerTeamRow[]): ReadonlySet<string> {
  const teams = new Set<string>();
  for (const row of rows) {
    if (typeof row?.nTeamid === 'string' && row.nTeamid) teams.add(lower(row.nTeamid));
  }
  return teams;
}

/** CALLER_TEAMS_SQL through the RowQuery port; non-uuid ids give an empty set without a query (fails closed). */
export async function callerTeamsOf(db: RowQuery, nCaseid: string, callerId: string): Promise<ReadonlySet<string>> {
  if (!isUuidText(nCaseid) || !isUuidText(callerId)) return new Set();
  return callerTeamsFrom(await db.rows<CallerTeamRow>(CALLER_TEAMS_SQL, [nCaseid, callerId]));
}

/**
 * Keeps the rows whose nTeamid is one of the caller's teams, plus (when `callerId` is given) the caller's own rows,
 * so a list never loses its reader. Strict on purpose: a row without a nTeamid is dropped, because "no team" is not
 * "every team". Order is kept; the input is not mutated.
 */
export function keepSameTeamRows<R extends { nUserid: string; nTeamid?: string | null }>(
  callerTeams: ReadonlySet<string>,
  rows: readonly R[],
  callerId?: string,
): R[] {
  const teams = new Set<string>();
  callerTeams.forEach((id) => teams.add(lower(id)));
  const me = typeof callerId === 'string' && callerId ? lower(callerId) : null;
  return rows.filter((row) => {
    if (me !== null && typeof row.nUserid === 'string' && lower(row.nUserid) === me) return true;
    return typeof row.nTeamid === 'string' && teams.has(lower(row.nTeamid));
  });
}

/**
 * Refuses a write whose recipients are not all on one of the caller's teams on the case. Throws
 * DomainError('forbidden', 'cross_team_recipient') with `detail.count` only: the ids are never echoed, so a refusal
 * cannot be used to probe who is on the case. Ids that are not uuids count as outside without a query (they match
 * no TeamRelation row), duplicates are checked once, and an empty list passes without a query. A failed lookup is
 * DomainError('unavailable', 'team_scope_lookup_failed'), never a refusal.
 */
export async function assertSameTeamRecipients(
  db: RowQuery,
  nCaseid: string,
  callerId: string,
  recipientIds: readonly string[],
): Promise<void> {
  const unique = [...new Set(recipientIds.map((id) => (typeof id === 'string' ? lower(id) : id)))];
  if (unique.length === 0) return;
  const refuse = (count: number): never => {
    throw new DomainError('forbidden', CROSS_TEAM_RECIPIENT, { count });
  };
  const wellFormed = unique.filter(isUuidText);
  const malformed = unique.length - wellFormed.length;
  // The caller or case id not being a uuid means nothing can be on the caller's team: refuse every recipient.
  if (!isUuidText(nCaseid) || !isUuidText(callerId)) refuse(unique.length);
  let outside: readonly OutsideCallerTeamsRow[];
  if (wellFormed.length === 0) {
    outside = [];
  } else {
    try {
      outside = await db.rows<OutsideCallerTeamsRow>(OUTSIDE_CALLER_TEAMS_SQL, [nCaseid, callerId, wellFormed]);
    } catch {
      throw new DomainError('unavailable', TEAM_SCOPE_LOOKUP_FAILED);
    }
  }
  const count = malformed + outside.length;
  if (count > 0) refuse(count);
}
