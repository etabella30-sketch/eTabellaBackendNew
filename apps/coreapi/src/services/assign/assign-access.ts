import { ForbiddenException, InternalServerErrorException, Logger } from '@nestjs/common';
import { DbService } from '@app/global/db/pg/db.service';

const logger = new Logger('AssignAccess');

type RowDb = Pick<DbService, 'rowQuery'>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The documents assign/assigntask may link to a task: $1 = nTaskid, $2 = the document ids. bAllowed
 * when every id is a BundleDetail row whose section is in the task's own case (and the task exists).
 * et_assign_task inserts a BDTasks row for each id as given, and et_sidenave_tasks_filetasks_files
 * then lists those documents to the task's assignees, so a document of another case must not get in.
 */
export const TASK_DOCS_IN_CASE_SQL = `
SELECT NOT EXISTS (
    SELECT 1
    FROM unnest($2::uuid[]) AS d("nBundledetailid")
    WHERE NOT EXISTS (
        SELECT 1
        FROM "BundleDetail" bd
        JOIN "SectionMaster" s ON s."nSectionid" = bd."nSectionid"
        JOIN "TaskMaster" t ON t."nCaseid" = s."nCaseid"
        WHERE bd."nBundledetailid" = d."nBundledetailid"
          AND t."nTaskid" = $1::uuid
    )
) AS "bAllowed"
`;

/**
 * The document ids et_assign_task would insert from jFiles (a JSON array string), lower case and
 * de-duplicated, or null when jFiles holds anything this check cannot vouch for. The SP casts each
 * element's text with ::uuid, and Postgres also reads '{…}', hyphen-less and 4-digit-group spellings
 * (and a 32-digit JSON number) as a uuid, so skipping every element that is not a canonical UUID
 * string let '["{<a document of another case>}"]' be linked unchecked. So every element must be a
 * canonical UUID string, or null (which inserts no document). jFiles that is not JSON or not an array
 * answers null too; the SP cannot insert from those either. No jFiles at all inserts nothing.
 */
export function taskDocIds(jFiles: unknown): string[] | null {
    if (jFiles === undefined || jFiles === null) return [];
    if (typeof jFiles !== 'string') return null;
    let parsed: unknown;
    try {
        parsed = JSON.parse(jFiles);
    } catch {
        return null;
    }
    if (!Array.isArray(parsed)) return null;
    const ids = parsed.filter((id) => id !== null);
    if (!ids.every((id) => typeof id === 'string' && UUID_RE.test(id))) return null;
    return [...new Set((ids as string[]).map((id) => id.toLowerCase()))];
}

/**
 * Gate for assign/assigntask's documents: 403 unless every document in jFiles belongs to the task's
 * case (admins included), or when jFiles holds an element taskDocIds cannot vouch for; 500 when the
 * lookup failed. Run after the task gate and before et_assign_task.
 */
export async function assertTaskDocsInCase(db: RowDb, nTaskid: string, jFiles: unknown): Promise<void> {
    const ids = taskDocIds(jFiles);
    if (ids === null) throw new ForbiddenException({ msg: -1, value: 'These documents are not in the case of this task' });
    if (!ids.length) return;
    let res: any;
    try {
        res = await db.rowQuery(TASK_DOCS_IN_CASE_SQL, [nTaskid, ids]);
    } catch (error) {
        res = { success: false, error };
    }
    if (!res?.success) {
        logger.error(`task document lookup failed for ${nTaskid}: ${res?.error?.message ?? res?.error}`);
        throw new InternalServerErrorException({ msg: -1, value: 'Could not check the documents of this task' });
    }
    if (res.data?.[0]?.bAllowed !== true) {
        throw new ForbiddenException({ msg: -1, value: 'These documents are not in the case of this task' });
    }
}
