/**
 * Who can see one mark, for live mark sync (user decision 2026-10-05): the people whose devices are told
 * "the marks of this session changed" after a write, and the session the mark belongs to.
 *
 * The rule is the one the mark reads apply (2026-07-07_marks_private_by_default: realtime.et_marks and the Mark Nav
 * SPs): a Fact, QFact or DocLink is seen by its author and by the people it is shared with (FMShared / DMShared);
 * a Quick Mark by its author only. No team or admin bypass, so no notice reaches anyone the reload would show
 * nothing new to. Plain parameterised reads on existing tables, no migration (mark-audience.sql.spec.ts checks them
 * against the schema and the read rule).
 */
import { MarkKind } from '@app/edge-sync';

import { isUuid } from '../utility/safe-path';

/**
 * One read per kind. Each returns one row for the mark: its session ("nSesid", null for a Document Reader PDF mark),
 * its author ("nOwner") and the people it is shared with ("aShared", text[]). $1 is the mark id (its primary key).
 */
export const MARK_AUDIENCE_SQL: Readonly<Record<MarkKind, string>> = Object.freeze({
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

/** The part of DbService these reads use. */
export interface MarkAudienceDb {
    rowQuery(text: string, params?: any[]): Promise<any>;
}

/** Lower-case canonical id, or null when the value is not a uuid. */
export function markId(value: unknown): string | null {
    return isUuid(value) ? value.toLowerCase() : null;
}

/**
 * The audience of mark `id` of kind `kind`: null when the mark does not exist (or `id` is not a uuid); throws when
 * the read fails, so the caller can tell "nobody" from "unknown".
 */
export async function readMarkAudience(db: MarkAudienceDb, kind: MarkKind, rawId: unknown): Promise<MarkAudience | null> {
    const id = markId(rawId);
    if (!id || !Object.prototype.hasOwnProperty.call(MARK_AUDIENCE_SQL, kind)) return null;
    const res = await db.rowQuery(MARK_AUDIENCE_SQL[kind], [id]);
    if (!res?.success) throw new Error(`mark audience read (${kind}) failed: ${res?.error ?? 'no result'}`);
    const row = Array.isArray(res.data) ? res.data[0] : null;
    if (!row) return null;
    const shared = Array.isArray(row.aShared) ? row.aShared : [];
    const users = [...new Set([row.nOwner, ...shared].map(markId).filter((u): u is string => !!u))];
    return { nSesid: markId(row.nSesid), users };
}
