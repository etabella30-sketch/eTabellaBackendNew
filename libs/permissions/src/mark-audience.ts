/**
 * Who can see one mark, for live mark sync (user decision 2026-10-05): the people whose devices are told "the marks
 * of this session changed" after a write, and the session the mark belongs to.
 *
 * The rule is the one the mark reads apply (2026-07-07_marks_private_by_default: realtime.et_marks and the Mark Nav
 * SPs): a Fact, QFact or DocLink is seen by its author and by the people it is shared with (FMShared / DMShared);
 * a Quick Mark by its author only. No team or admin bypass, so no notice reaches anyone the reload would show
 * nothing new to. Plain parameterised reads on existing tables, no migration. Defined once here since Phase 10 of the
 * shared-libraries plan (moved from apps/realtime-server/src/services/marks/mark-audience.sql.ts, which is now an
 * adapter over this file and whose SQL contract spec still checks these constants against the schema dump).
 */
import { isUuidText, RowQuery } from '@app/api-kernel';

/** Q Quick Mark, F Fact / QFact, D DocLink: the kinds of @app/edge-sync MARK_KINDS, written here so this lib imports nothing of it. */
export type MarkAudienceKind = 'Q' | 'F' | 'D';

/**
 * One read per kind. Each returns one row for the mark: its session ("nSesid", null for a Document Reader PDF mark),
 * its author ("nOwner") and the people it is shared with ("aShared", text[]). $1 is the mark id (its primary key).
 */
export const MARK_AUDIENCE_SQL: Readonly<Record<MarkAudienceKind, string>> = Object.freeze({
  Q: `SELECT h."nSessionId"::text AS "nSesid", h."nUserid"::text AS "nOwner", '{}'::text[] AS "aShared"
  FROM "RHighlights" h
 WHERE h."nHid" = $1::uuid`,
  F: `SELECT f."nSesid"::text AS "nSesid", f."nUserid"::text AS "nOwner",
       ARRAY(SELECT s."nUserid"::text FROM "FMShared" s WHERE s."nFSid" = f."nFSid" AND s."nUserid" IS NOT NULL) AS "aShared"
  FROM "FactMaster" f
 WHERE f."nFSid" = $1::uuid`,
  D: `SELECT m."nSesid"::text AS "nSesid", m."nUserid"::text AS "nOwner",
       ARRAY(SELECT s."nUserid"::text FROM "DMShared" s WHERE s."nDocid" = m."nDocid" AND s."nUserid" IS NOT NULL) AS "aShared"
  FROM "DocMaster" m
 WHERE m."nDocid" = $1::uuid`,
});

/** The session of a mark and everyone who can see it (author first), ids lower-cased. */
export interface MarkAudience {
  nSesid: string | null;
  users: string[];
}

/** Lower-case canonical id, or null when the value is not a uuid. */
export function markId(value: unknown): string | null {
  return isUuidText(value) ? value.toLowerCase() : null;
}

/**
 * The audience of mark `id` of kind `kind`: null when the mark does not exist (or `id` is not a uuid, or the kind is
 * unknown); a failed read throws as the port does, so the caller can tell "nobody" from "unknown".
 */
export async function readMarkAudience(db: RowQuery, kind: MarkAudienceKind, rawId: unknown): Promise<MarkAudience | null> {
  const id = markId(rawId);
  if (!id || !Object.prototype.hasOwnProperty.call(MARK_AUDIENCE_SQL, kind)) return null;
  const rows = await db.rows<{ nSesid?: unknown; nOwner?: unknown; aShared?: unknown }>(MARK_AUDIENCE_SQL[kind], [id]);
  const row = rows[0];
  if (!row) return null;
  const shared = Array.isArray(row.aShared) ? row.aShared : [];
  const users = [...new Set([row.nOwner, ...shared].map(markId).filter((u): u is string => !!u))];
  return { nSesid: markId(row.nSesid), users };
}
