/**
 * The audience of one Fact: who may view it. The bCanView rule of public.et_fact_permissions, as of
 * assets/sql-migrations/2026-09-23_sec_fact_view_task_assignee: the fact's owner, an FMShared recipient, or an
 * assignee (TaskShared) of a task (TaskMaster, so not a deleted one) on the fact's case that is linked to the fact
 * (FMTasks) and who is still an active member of that case (TeamRelation cStatus 'A'; removing a member leaves their
 * TaskShared rows behind). No admin / case-role bypass: the SP dropped it on 2026-07-07 (marks private by default).
 *
 * Defined once here (plan Phase 10): the comment broadcast of @app/rt-features/comments names the viewers
 * (FACT_VIEWERS_SQL, the inverse of the rule), socket-app admits a socket to a fact's room with the same rule for one
 * user (FACT_VIEW_SQL). Moved from apps/coreapi/src/services/comments/fact-viewers.ts and
 * apps/socket-app/src/events/socket-room-access.ts, SQL text unchanged. Storage is reached through the ROW_QUERY port.
 */
import { isUuidText, RowQuery } from '@app/api-kernel';

/** Everyone who may view one fact ($1 nFSid): one row per user id. */
export const FACT_VIEWERS_SQL = `SELECT f."nUserid"::text AS "nUserid" FROM "FactMaster" f WHERE f."nFSid" = $1
UNION
SELECT s."nUserid"::text FROM "FMShared" s WHERE s."nFSid" = $1
UNION
SELECT ts."nUserid"::text FROM "FMTasks" fmt
  JOIN "FactMaster" f ON f."nFSid" = fmt."nFSid"
  JOIN "TaskMaster" tm ON tm."nTaskid" = fmt."nTaskid" AND tm."nCaseid" = f."nCaseid"
  JOIN "TaskShared" ts ON ts."nTaskid" = tm."nTaskid"
  JOIN "TeamRelation" tr ON tr."nCaseid" = tm."nCaseid" AND tr."nUserid" = ts."nUserid" AND tr."cStatus" = 'A'
 WHERE fmt."nFSid" = $1`;

/** Whether one user may view one fact ($1 nFSid, $2 nUserid): a row when they may, none otherwise. */
export const FACT_VIEW_SQL = `SELECT 1 FROM "FactMaster" f
 WHERE f."nFSid" = $1
   AND (f."nUserid" = $2
     OR EXISTS (SELECT 1 FROM "FMShared" s WHERE s."nFSid" = f."nFSid" AND s."nUserid" = $2)
     OR EXISTS (SELECT 1 FROM "FMTasks" fmt
                  JOIN "TaskMaster" tm ON tm."nTaskid" = fmt."nTaskid"
                  JOIN "TaskShared" ts ON ts."nTaskid" = tm."nTaskid"
                  JOIN "TeamRelation" tr ON tr."nCaseid" = tm."nCaseid" AND tr."nUserid" = ts."nUserid" AND tr."cStatus" = 'A'
                 WHERE fmt."nFSid" = f."nFSid" AND tm."nCaseid" = f."nCaseid" AND ts."nUserid" = $2))
 LIMIT 1`;

/**
 * Everyone who may view fact `nFSid`, once each (ids compared case-insensitively, the first spelling kept), the
 * author among them; [] without a read for an id that is not a uuid. A failed read throws as the port does: the
 * caller decides whether "unknown" is "nobody" (the comment broadcast still reaches the fact's room without it).
 */
export async function factViewers(db: RowQuery, nFSid: unknown): Promise<string[]> {
  if (!isUuidText(nFSid)) return [];
  const rows = await db.rows<{ nUserid?: unknown }>(FACT_VIEWERS_SQL, [nFSid.toLowerCase()]);
  const seen = new Set<string>();
  const viewers: string[] = [];
  for (const row of rows) {
    const id = typeof row?.nUserid === 'string' ? row.nUserid.trim() : '';
    if (!id || seen.has(id.toLowerCase())) continue;
    seen.add(id.toLowerCase());
    viewers.push(id);
  }
  return viewers;
}

/** Whether `userId` may view fact `nFSid` (FACT_VIEW_SQL); false without a read when either is not a uuid. */
export async function userMayViewFact(db: RowQuery, nFSid: unknown, userId: unknown): Promise<boolean> {
  if (!isUuidText(nFSid) || !isUuidText(userId)) return false;
  const rows = await db.rows(FACT_VIEW_SQL, [nFSid.toLowerCase(), userId]);
  return rows.length > 0;
}
