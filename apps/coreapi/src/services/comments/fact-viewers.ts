import { Logger } from '@nestjs/common';
import { DbService } from '@app/global/db/pg/db.service';

const logger = new Logger('FactViewers');

type RowDb = Pick<DbService, 'rowQuery'>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Everyone who may view one fact: the inverse of the bCanView rule of public.et_fact_permissions
 * (see socket-app's FACT_VIEW_SQL): the fact's owner, an FMShared recipient, or an assignee of a
 * task on the fact's case linked to the fact who is still an active member of that case.
 */
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

/**
 * The users a comment on `nFSid` is for: its viewers, the author among them (their other open
 * windows count the comment too; a client skips the badge for its own user). Lets a live "new
 * comment" reach a viewer's own socket room without every viewer joining the fact's room first.
 * Empty (never a throw) when the id is not a UUID or the lookup fails: the comment is saved
 * either way, and the fact's room still hears it.
 */
export async function factCommentRecipients(db: RowDb, nFSid: unknown): Promise<string[]> {
    if (typeof nFSid !== 'string' || !UUID_RE.test(nFSid)) return [];
    let res: any;
    try {
        res = await db.rowQuery(FACT_VIEWERS_SQL, [nFSid.toLowerCase()]);
    } catch (error) {
        res = { success: false, error };
    }
    if (!res?.success) {
        logger.error(`fact viewers lookup failed for ${nFSid}: ${res?.error?.message ?? res?.error}`);
        return [];
    }
    const seen = new Set<string>();
    const recipients: string[] = [];
    for (const row of res.data ?? []) {
        const id = typeof row?.nUserid === 'string' ? row.nUserid.trim() : '';
        if (!id || seen.has(id.toLowerCase())) continue;
        seen.add(id.toLowerCase());
        recipients.push(id);
    }
    return recipients;
}
