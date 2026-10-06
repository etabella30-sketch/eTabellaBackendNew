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

/**
 * The ACTIVE teams of user $2 on case $1: the subquery et_common_my_team_user filters by, word for word. A
 * TeamRelation row is active while cStatus = 'A'; the per-case user switch (coreapi permission/usermanage,
 * et_pm_user_statusmanage) sets another value to deactivate a member on that case, and a deactivated member is on no
 * team for this rule (decision D3, 2026-10-06), as the fact create gates already read it.
 */
export const CALLER_TEAMS_SQL = `SELECT "nTeamid" FROM "TeamRelation" WHERE "nCaseid" = $1 AND "nUserid" = $2 AND "cStatus" = 'A'`;

/**
 * Of the user ids in $3 (uuid[]), those that share NO active nTeamid with caller $2 on case $1: one "nUserid" row
 * each. A recipient with no TeamRelation row on the case, only rows whose nTeamid is NULL (NULL never equals a
 * team), or only deactivated rows is outside too, so "not on the case", "on another team" and "deactivated" are
 * refused by the same rule; a deactivated caller is on no team and may share with nobody. Unnest keeps the answer
 * one query however many recipients a share names.
 */
export const OUTSIDE_CALLER_TEAMS_SQL = `SELECT DISTINCT r.id AS "nUserid"
 FROM unnest($3::uuid[]) AS r(id)
 WHERE NOT EXISTS (
   SELECT 1 FROM "TeamRelation" t
   JOIN "TeamRelation" c ON c."nTeamid" = t."nTeamid" AND c."nCaseid" = $1 AND c."nUserid" = $2 AND c."cStatus" = 'A'
   WHERE t."nCaseid" = $1 AND t."nUserid" = r.id AND t."cStatus" = 'A')`;

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
 * Of `userIds`, the ones that share no team with the caller on the case (lower-cased, each once). Ids that are not
 * uuids count as outside without a query (they match no TeamRelation row); when the caller or the case id is not a
 * uuid nothing can be on the caller's team, so every id is outside. An empty list asks nothing. A failed lookup is
 * DomainError('unavailable', 'team_scope_lookup_failed'): a fault, never "everyone is inside".
 */
export async function outsideCallerTeams(
  db: RowQuery,
  nCaseid: string | null | undefined,
  callerId: string,
  userIds: readonly string[],
): Promise<ReadonlySet<string>> {
  const unique = [...new Set(userIds.map((id) => (typeof id === 'string' ? lower(id) : id)))];
  if (unique.length === 0) return new Set();
  if (!isUuidText(nCaseid) || !isUuidText(callerId)) return new Set(unique);
  const outside = new Set<string>(unique.filter((id) => !isUuidText(id)));
  const wellFormed = unique.filter(isUuidText);
  if (wellFormed.length === 0) return outside;
  let rows: readonly OutsideCallerTeamsRow[];
  try {
    rows = await db.rows<OutsideCallerTeamsRow>(OUTSIDE_CALLER_TEAMS_SQL, [nCaseid, callerId, wellFormed]);
  } catch {
    throw new DomainError('unavailable', TEAM_SCOPE_LOOKUP_FAILED);
  }
  for (const row of rows) if (typeof row?.nUserid === 'string') outside.add(lower(row.nUserid));
  return outside;
}

/**
 * Keeps the rows whose nUserid is not in `outside` (as outsideCallerTeams answers it), plus the caller's own rows:
 * the team filter for a list whose rows carry no nTeamid (et_factsheet_shared). Order kept, input not mutated.
 */
export function keepSameTeamUsers<R extends { nUserid?: string | null }>(rows: readonly R[], outside: ReadonlySet<string>, callerId?: string): R[] {
  const me = typeof callerId === 'string' && callerId ? lower(callerId) : null;
  return rows.filter((row) => {
    const id = typeof row?.nUserid === 'string' ? lower(row.nUserid) : null;
    if (me !== null && id === me) return true;
    return id !== null && !outside.has(id);
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
  const outside = await outsideCallerTeams(db, nCaseid, callerId, recipientIds);
  if (outside.size > 0) throw new DomainError('forbidden', CROSS_TEAM_RECIPIENT, { count: outside.size });
}
