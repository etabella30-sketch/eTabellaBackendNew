import { ForbiddenException, InternalServerErrorException, Logger } from '@nestjs/common';
import { DbService } from '@app/global/db/pg/db.service';

const logger = new Logger('TaskAccess');

type RowDb = Pick<DbService, 'rowQuery'>;

/**
 * The tasks a user may see: the ones they created (TaskMaster.nUserid) or are assigned to
 * (TaskShared), the rule et_workspace_task_list and the legacy task lists apply. $1 = nTaskid,
 * $2 = the caller (the JWT user).
 */
export const TASK_VISIBLE_SQL = `
SELECT EXISTS (
    SELECT 1
    FROM "TaskMaster" t
    WHERE t."nTaskid" = $1::uuid
      AND (
            t."nUserid" = $2::uuid
            OR EXISTS (
                SELECT 1 FROM "TaskShared" ts
                WHERE ts."nTaskid" = t."nTaskid" AND ts."nUserid" = $2::uuid
            )
      )
) AS "bVisible"
`;

/**
 * 'visible' when nMasterid created or is assigned to nTaskid, 'hidden' when not (or no such task,
 * or no caller), 'failed' when the lookup failed.
 */
export async function taskVisibility(db: RowDb, nMasterid: string, nTaskid: string): Promise<'visible' | 'hidden' | 'failed'> {
    if (!nMasterid || !nTaskid) return 'hidden';
    let res: any;
    try {
        res = await db.rowQuery(TASK_VISIBLE_SQL, [nTaskid, nMasterid]);
    } catch (error) {
        res = { success: false, error };
    }
    if (!res?.success) {
        logger.error(`task visibility lookup failed for ${nTaskid}: ${res?.error?.message ?? res?.error}`);
        return 'failed';
    }
    return res.data?.[0]?.bVisible === true ? 'visible' : 'hidden';
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (value: unknown): value is string => typeof value === 'string' && UUID_RE.test(value);

/**
 * What the task/* routes decide on, for one task and one caller: $1 = nTaskid, $2 = the caller (the
 * JWT user; JwtMiddleware writes nMasterid over the client value). No row when the task does not exist.
 *   bAdmin      global admin (UserMaster.isAdmin), the bypass FACT_CREATE_ACCESS_SQL uses
 *   bMember     active member of the task's own case (TeamRelation cStatus 'A'), the test et_dashboard_v2
 *               lists cases by and the task-assignee fact-view rule (2026-09-23 migration) requires
 *   bCreator    TaskMaster.nUserid
 *   bAssignee   a TaskShared row
 *   jAssignees  the current assignees as the workspace task list (jAssignees) shows them, TaskShared
 *               joined to UserMaster, so an unchanged save from the new frontend compares equal
 */
export const TASK_ACCESS_SQL = `
SELECT
    EXISTS (SELECT 1 FROM "UserMaster" u WHERE u."nUserid" = $2::uuid AND u."isAdmin" = true) AS "bAdmin",
    EXISTS (
        SELECT 1 FROM "TeamRelation" tr
        WHERE tr."nCaseid" = t."nCaseid" AND tr."nUserid" = $2::uuid AND tr."cStatus" = 'A'
    ) AS "bMember",
    COALESCE(t."nUserid" = $2::uuid, false) AS "bCreator",
    EXISTS (SELECT 1 FROM "TaskShared" ts WHERE ts."nTaskid" = t."nTaskid" AND ts."nUserid" = $2::uuid) AS "bAssignee",
    COALESCE((
        SELECT jsonb_agg(DISTINCT ts."nUserid")
        FROM "TaskShared" ts
        JOIN "UserMaster" u ON u."nUserid" = ts."nUserid"
        WHERE ts."nTaskid" = t."nTaskid"
    ), '[]'::jsonb) AS "jAssignees"
FROM "TaskMaster" t
WHERE t."nTaskid" = $1::uuid
`;

/**
 * What the caller may do to one task. Every right needs an active membership of the task's case, except
 * for a global admin.
 *   view    creator or assignee: gettaskdetail(/v2)
 *   status  creator or assignee: updateTaskProgress, taskBuilder/updatestatus (the legacy task table and
 *           the workspace board offer the progress / status control on every row the caller sees)
 *   edit    creator or assignee: the task's own fields through taskBuilder(/v2) permission <> 'N' and
 *           updateTask. The new frontend puts its Edit pencil on every task row the caller sees, assignee
 *           rows included, so assignees keep that; changing WHO is assigned is `assign`.
 *   assign  creator only: replace the assignees (et_task_insert_assign(_v2)). The legacy task table and
 *           edit form only offer edit to the creator (!isShared / can_edit_all), and an assignee who could
 *           rewrite the list could hand the task's linked facts to anyone on the case once assignees may
 *           view them (2026-09-23_sec_fact_view_task_assignee).
 *   delete  creator only (legacy !isShared, workspace bCanDelete; et_task_delete itself is creator-only)
 */
export interface TaskAccess {
    view: boolean;
    status: boolean;
    edit: boolean;
    assign: boolean;
    delete: boolean;
    /** The current assignees (lower case), see TASK_ACCESS_SQL jAssignees. */
    assignees: string[];
}

export type TaskAction = 'view' | 'status' | 'edit' | 'assign' | 'delete';

const NO_ACCESS: TaskAccess = { view: false, status: false, edit: false, assign: false, delete: false, assignees: [] };

/** The caller's rights on nTaskid (all false when either id is missing or the task does not exist), or 'failed'. */
export async function taskAccess(db: RowDb, nMasterid: unknown, nTaskid: unknown): Promise<TaskAccess | 'failed'> {
    if (!isUuid(nMasterid) || !isUuid(nTaskid)) return { ...NO_ACCESS };
    let res: any;
    try {
        res = await db.rowQuery(TASK_ACCESS_SQL, [nTaskid, nMasterid]);
    } catch (error) {
        res = { success: false, error };
    }
    if (!res?.success || !Array.isArray(res.data)) {
        logger.error(`task access lookup failed for ${nTaskid}: ${res?.error?.message ?? res?.error}`);
        return 'failed';
    }
    const row = res.data[0];
    if (!row) return { ...NO_ACCESS };
    const admin = row.bAdmin === true;
    const member = admin || row.bMember === true;
    const involved = member && (admin || row.bCreator === true || row.bAssignee === true);
    const owner = member && (admin || row.bCreator === true);
    const assignees = (Array.isArray(row.jAssignees) ? row.jAssignees : [])
        .filter((id: unknown): id is string => typeof id === 'string')
        .map((id: string) => id.toLowerCase());
    return { view: involved, status: involved, edit: involved, assign: owner, delete: owner, assignees };
}

/**
 * Write gate: the caller's TaskAccess when `action` is allowed; 403 when it is not (or the task does
 * not exist), 500 when the lookup failed. Nothing is written before it passes; call it outside the
 * route's try/catch so the status reaches the client.
 */
export async function assertTaskAccess(db: RowDb, nMasterid: unknown, nTaskid: unknown, action: TaskAction): Promise<TaskAccess> {
    const access = await taskAccess(db, nMasterid, nTaskid);
    if (access === 'failed') throw new InternalServerErrorException({ msg: -1, value: 'Could not check access to this task' });
    if (!access[action]) throw new ForbiddenException({ msg: -1, value: 'You are not permitted to change this task' });
    return access;
}

/**
 * Where a new task may go (taskBuilder / taskBuilder/v2 permission 'N'): $1 = the case the client names
 * (et_task_insert stores it as given), $2 = the caller. The case must exist and the caller must be an
 * active member of it (TeamRelation cStatus 'A') or a global admin.
 */
export const TASK_CREATE_ACCESS_SQL = `
SELECT (
    EXISTS (SELECT 1 FROM "CaseMaster" c WHERE c."nCaseid" = $1::uuid)
    AND (
        EXISTS (SELECT 1 FROM "UserMaster" u WHERE u."nUserid" = $2::uuid AND u."isAdmin" = true)
        OR EXISTS (
            SELECT 1 FROM "TeamRelation" tr
            WHERE tr."nCaseid" = $1::uuid AND tr."nUserid" = $2::uuid AND tr."cStatus" = 'A'
        )
    )
) AS "bAllowed"
`;

/** Create gate: 403 unless TASK_CREATE_ACCESS_SQL allows (nCaseid, caller), 500 when the lookup failed. */
export async function assertCanCreateTask(db: RowDb, nMasterid: unknown, nCaseid: unknown): Promise<void> {
    const refused = new ForbiddenException({ msg: -1, value: 'You are not permitted to add tasks to this case' });
    if (!isUuid(nMasterid) || !isUuid(nCaseid)) throw refused;
    let res: any;
    try {
        res = await db.rowQuery(TASK_CREATE_ACCESS_SQL, [nCaseid, nMasterid]);
    } catch (error) {
        res = { success: false, error };
    }
    if (!res?.success) {
        logger.error(`task create access lookup failed: ${res?.error?.message ?? res?.error}`);
        throw new InternalServerErrorException({ msg: -1, value: 'Could not check access to this case' });
    }
    if (res.data?.[0]?.bAllowed !== true) throw refused;
}

/**
 * The assignee ids a taskBuilder call would write, lower case: 'ids' is task/taskBuilder's jUsers
 * (["<uuid>", ...], et_task_insert_assign), 'objects' is taskBuilder/v2's ([{nUserid, bCan...}],
 * et_task_insert_assign_v2, which skips entries without an nUserid). null when jUsers is not a JSON
 * array of that shape (the SP would fail or write something else).
 */
export function requestedAssigneeIds(jUsers: unknown, format: 'ids' | 'objects'): string[] | null {
    if (typeof jUsers !== 'string') return null;
    let parsed: unknown;
    try {
        parsed = JSON.parse(jUsers);
    } catch {
        return null;
    }
    if (!Array.isArray(parsed)) return null;
    if (format === 'ids') {
        if (!parsed.every((id) => typeof id === 'string')) return null;
        return parsed.map((id: string) => id.toLowerCase());
    }
    return parsed
        .filter((e: any) => e !== null && typeof e === 'object' && !Array.isArray(e) && e.nUserid != null)
        .map((e: any) => String(e.nUserid).toLowerCase());
}

/** Whether two assignee lists name the same users (order and repeats ignored). */
export function sameAssignees(a: string[], b: string[]): boolean {
    const left = new Set(a.map((id) => id.toLowerCase()));
    const right = new Set(b.map((id) => id.toLowerCase()));
    return left.size === right.size && [...left].every((id) => right.has(id));
}
