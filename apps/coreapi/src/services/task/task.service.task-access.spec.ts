import { BadRequestException, ForbiddenException, InternalServerErrorException, Logger } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from '../../controllers/task/task.controller';
import {
    TASK_ACCESS_SQL,
    TASK_CREATE_ACCESS_SQL,
    requestedAssigneeIds,
    sameAssignees,
    taskAccess,
} from './task-access';

const ME = '11111111-1111-4111-8111-111111111111';
const PEER = '22222222-2222-4222-8222-222222222222';
const PEER2 = '33333333-3333-4333-8333-333333333333';
const CASE = '44444444-4444-4444-8444-444444444444';
const TASK = '99999999-9999-4999-8999-999999999999';
const NEW_TASK = '88888888-8888-4888-8888-888888888888';

/** TASK_ACCESS_SQL answers for (TASK, ME). jAssignees: the task's current assignees. */
const row = (over: Record<string, any>) => ({
    success: true,
    data: [{ bAdmin: false, bMember: true, bCreator: false, bAssignee: false, jAssignees: [PEER], ...over }],
});
const ACCESS = {
    creator: row({ bCreator: true }),
    assignee: row({ bAssignee: true, jAssignees: [PEER, ME] }),
    member: row({}),
    admin: row({ bAdmin: true, bMember: false }),
    outsider: row({ bMember: false }),
    exCreator: row({ bMember: false, bCreator: true }),
    exAssignee: row({ bMember: false, bAssignee: true, jAssignees: [PEER, ME] }),
    missing: { success: true, data: [] },
    failed: { success: false, error: 'db down' },
};
const CREATE = {
    allowed: { success: true, data: [{ bAllowed: true }] },
    refused: { success: true, data: [{ bAllowed: false }] },
    failed: { success: false, error: 'db down' },
};

const SP_RESULT: Record<string, any> = {
    task_insert: { success: true, data: [[{ msg: 1, value: 'Updated', nTaskid: TASK }]] },
    task_insert_detail: { success: true, data: [[{ msg: 1 }]] },
    task_insert_detail_v2: { success: true, data: [[{ msg: 1 }]] },
    task_insert_reminder: { success: true, data: [[{ msg: 1 }]] },
    task_insert_reminder_v2: { success: true, data: [[{ msg: 1 }]] },
    task_insert_assign: { success: true, data: [[{ msg: 1, value: 'Assigned', jNotify: [] }]] },
    task_insert_assign_V2: { success: true, data: [[{ msg: 1, value: 'Assigned', jNotify: [] }]] },
    task_delete: { success: true, data: [[{ msg: 1, value: 'Deleted' }]] },
    task_update_status: { success: true, data: [[{ msg: 1, value: 'Updated ' }]] },
    task_detail: { success: true, data: [[{ nTaskid: TASK, cSubject: 'Subject' }], [{ nUserid: PEER }], []] },
    task_detail_v2: { success: true, data: [[{ nTaskid: TASK, cSubject: 'Subject' }], [{ nUserid: PEER }], []] },
};

function build(access: any = ACCESS.creator, create: any = CREATE.allowed) {
    const db = {
        executeRef: jest.fn(async (name: string, params: any) => {
            if (name === 'task_insert' && params?.permission === 'N') {
                return { success: true, data: [[{ msg: 1, value: 'Created', nTaskid: NEW_TASK }]] };
            }
            if (SP_RESULT[name]) return SP_RESULT[name];
            throw new Error(`unexpected SP ${name}`);
        }),
        rowQuery: jest.fn(async (text: string) => {
            if (text === TASK_ACCESS_SQL) return access;
            if (text === TASK_CREATE_ACCESS_SQL) return create;
            throw new Error('unexpected query');
        }),
    };
    const utility = { sendNotification: jest.fn() };
    const svc = new TaskService(db as any, utility as any);
    return { svc, db, ctrl: new TaskController(svc) };
}

const spNames = (db: { executeRef: jest.Mock }) => db.executeRef.mock.calls.map((c) => c[0]);
const spArgs = (db: { executeRef: jest.Mock }, name: string) => db.executeRef.mock.calls.filter((c) => c[0] === name).map((c) => c[1]);

/** taskBuilder (v1) body: jUsers is a JSON array of user ids. */
const v1 = (over: Record<string, any> = {}) => ({
    nTaskid: TASK, cSubject: 'S', cDesc: 'D', jEmailnotify: '{}', nPriority: 3, nProgress: 0, jTimeline: '{}',
    cTasktype: 'F', jReminder: '[]', jUsers: JSON.stringify([PEER]), permission: 'E', nCaseid: CASE, nMasterid: ME, ...over,
}) as any;
/** taskBuilder/v2 body: jUsers is a JSON array of {nUserid, flags}. */
const v2 = (over: Record<string, any> = {}) => ({
    nTaskid: TASK, cSubject: 'S', cDesc: 'D', jEmailnotify: '{}', nPriority: 3, nProgress: 0, nStatus: 238, jTimeline: '{}',
    cTasktype: 'F', jUsers: JSON.stringify([{ nUserid: PEER, bCanComment: true, bCanEdit: false }]), permission: 'E',
    nCaseid: CASE, dReminderDt: '', nMasterid: ME, ...over,
}) as any;
const users = (...ids: string[]) => JSON.stringify(ids.map((nUserid) => ({ nUserid, bCanComment: true, bCanCopy: false, bCanEdit: false, bCanReshare: false })));

const BUILDERS = [
    { name: 'task/taskBuilder', call: (c: TaskController, b: any) => c.getCreate(b), body: v1, list: (...ids: string[]) => JSON.stringify(ids), sps: ['task_insert', 'task_insert_detail', 'task_insert_reminder'], assign: 'task_insert_assign' },
    { name: 'task/taskBuilder/v2', call: (c: TaskController, b: any) => c.taskBuilder(b), body: v2, list: users, sps: ['task_insert', 'task_insert_detail_v2', 'task_insert_reminder_v2'], assign: 'task_insert_assign_V2' },
];

describe('coreapi task routes: who may see and change a task (task-access.ts)', () => {
    beforeEach(() => jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined));
    afterEach(() => jest.restoreAllMocks());

    describe.each(BUILDERS)('$name with a permission other than N (edit of an existing task)', (b) => {
        it.each([
            ['an active case member who is neither creator nor assignee', ACCESS.member],
            ['a user outside the case', ACCESS.outsider],
            ['the creator after leaving the case', ACCESS.exCreator],
            ['an assignee after leaving the case', ACCESS.exAssignee],
            ['anyone, for a task that does not exist', ACCESS.missing],
        ])('403 and nothing written for %s', async (_label, access) => {
            const { ctrl, db } = build(access);
            await expect(b.call(ctrl, b.body())).rejects.toBeInstanceOf(ForbiddenException);
            expect(db.rowQuery).toHaveBeenCalledWith(TASK_ACCESS_SQL, [TASK, ME]);
            expect(db.executeRef).not.toHaveBeenCalled();
        });

        it('the reported hole: a case member cannot make themselves an assignee of someone else\'s task', async () => {
            const { ctrl, db } = build(ACCESS.member);
            await expect(b.call(ctrl, b.body({ jUsers: b.list(PEER, ME) }))).rejects.toBeInstanceOf(ForbiddenException);
            expect(spNames(db)).not.toContain(b.assign);
            expect(db.executeRef).not.toHaveBeenCalled();
        });

        it('any permission other than N is an edit (the assign SP replaces the assignees whatever it says)', async () => {
            for (const permission of ['S', 'X', '']) {
                const { ctrl, db } = build(ACCESS.outsider);
                await expect(b.call(ctrl, b.body({ permission }))).rejects.toBeInstanceOf(ForbiddenException);
                expect(db.executeRef).not.toHaveBeenCalled();
            }
        });

        it('500 and nothing written when the access lookup fails', async () => {
            const { ctrl, db } = build(ACCESS.failed);
            await expect(b.call(ctrl, b.body())).rejects.toBeInstanceOf(InternalServerErrorException);
            expect(db.executeRef).not.toHaveBeenCalled();
        });

        it.each([
            ['the creator', ACCESS.creator],
            ['a global admin with no row on the case', ACCESS.admin],
        ])('%s can edit the task and replace its assignees', async (_label, access) => {
            const { ctrl, db } = build(access);
            const body = b.body({ jUsers: b.list(PEER2) });
            await expect(b.call(ctrl, body)).resolves.toEqual({ msg: 1, value: 'Updated', nTaskid: TASK });
            expect(spNames(db)).toEqual([...b.sps, b.assign]);
            expect(spArgs(db, b.assign)[0].nTaskid).toBe(TASK);
        });

        it('an assignee can save the task\'s fields when the assignee list is unchanged; the assign step is skipped', async () => {
            const { ctrl, db } = build(ACCESS.assignee);
            // Same users, other order, different flags: the flags must not change either.
            const body = b.body({ jUsers: b.list(ME.toUpperCase(), PEER) });
            await expect(b.call(ctrl, body)).resolves.toEqual({ msg: 1, value: 'Updated', nTaskid: TASK });
            expect(spNames(db)).toEqual(b.sps);
        });

        it.each([
            ['adds a user', (l: any) => l(PEER, ME, PEER2)],
            ['removes a user', (l: any) => l(ME)],
            ['clears the list', (l: any) => l()],
            ['sends something that is not a list', () => '{"nUserid":"x"}'],
        ])('403 and nothing written when an assignee %s', async (_label, jUsers) => {
            const { ctrl, db } = build(ACCESS.assignee);
            await expect(b.call(ctrl, b.body({ jUsers: jUsers(b.list) }))).rejects.toBeInstanceOf(ForbiddenException);
            expect(db.executeRef).not.toHaveBeenCalled();
        });
    });

    describe.each(BUILDERS)('$name with permission N (a new task)', (b) => {
        it('an active member of the case creates it; the assignee step runs on the new task, not the client nTaskid', async () => {
            const { ctrl, db } = build();
            const body = b.body({ permission: 'N', nTaskid: TASK, jUsers: b.list(PEER) });
            await expect(b.call(ctrl, body)).resolves.toEqual({ msg: 1, value: 'Created', nTaskid: NEW_TASK });
            expect(db.rowQuery).toHaveBeenCalledWith(TASK_CREATE_ACCESS_SQL, [CASE, ME]);
            expect(db.rowQuery).not.toHaveBeenCalledWith(TASK_ACCESS_SQL, expect.anything());
            expect(spNames(db)).toEqual([...b.sps, b.assign]);
            expect(spArgs(db, b.assign)[0].nTaskid).toBe(NEW_TASK);
        });

        it('403 and nothing written in a case the caller is not an active member of', async () => {
            const { ctrl, db } = build(ACCESS.creator, CREATE.refused);
            await expect(b.call(ctrl, b.body({ permission: 'N' }))).rejects.toBeInstanceOf(ForbiddenException);
            expect(db.executeRef).not.toHaveBeenCalled();
        });

        it('403 without a lookup when no case is named; 500 when the lookup fails', async () => {
            const none = build();
            await expect(b.call(none.ctrl, b.body({ permission: 'N', nCaseid: null }))).rejects.toBeInstanceOf(ForbiddenException);
            expect(none.db.rowQuery).not.toHaveBeenCalled();
            expect(none.db.executeRef).not.toHaveBeenCalled();

            const failed = build(ACCESS.creator, CREATE.failed);
            await expect(b.call(failed.ctrl, b.body({ permission: 'N' }))).rejects.toBeInstanceOf(InternalServerErrorException);
            expect(failed.db.executeRef).not.toHaveBeenCalled();
        });
    });

    describe('task/updateTask (et_task_insert_detail)', () => {
        it.each([['an uninvolved member', ACCESS.member], ['an outsider', ACCESS.outsider]])('403 for %s, nothing written', async (_l, access) => {
            const { ctrl, db } = build(access);
            await expect(ctrl.createTaskDetail(v1())).rejects.toBeInstanceOf(ForbiddenException);
            expect(db.executeRef).not.toHaveBeenCalled();
        });

        it.each([['the creator', ACCESS.creator], ['an assignee', ACCESS.assignee], ['a global admin', ACCESS.admin]])('%s can update the fields', async (_l, access) => {
            const { ctrl, db } = build(access);
            await expect(ctrl.createTaskDetail(v1())).resolves.toEqual([{ msg: 1 }]);
            expect(spNames(db)).toEqual(['task_insert_detail']);
        });

        it('400 and nothing written for a permission that would not update the task (N inserts a second TaskDetail row)', async () => {
            for (const permission of ['N', 'X', '']) {
                const { ctrl, db } = build(ACCESS.assignee);
                await expect(ctrl.createTaskDetail(v1({ permission }))).rejects.toBeInstanceOf(BadRequestException);
                expect(db.executeRef).not.toHaveBeenCalled();
            }
            const progress = build(ACCESS.creator);
            await expect(progress.ctrl.createTaskDetail(v1({ permission: 'S' }))).resolves.toEqual([{ msg: 1 }]);
            expect(spArgs(progress.db, 'task_insert_detail')[0].permission).toBe('S');
        });
    });

    describe('task/updateTaskProgress and task/taskBuilder/updatestatus (creator or assignee)', () => {
        it.each([['an uninvolved member', ACCESS.member], ['an outsider', ACCESS.outsider], ['an ex-member assignee', ACCESS.exAssignee]])(
            '403 for %s, nothing written',
            async (_l, access) => {
                const progress = build(access);
                await expect(progress.ctrl.updateTaskStatus({ nTaskid: TASK, nProgress: 50, permission: 'S', nMasterid: ME } as any)).rejects.toBeInstanceOf(ForbiddenException);
                expect(progress.db.executeRef).not.toHaveBeenCalled();

                const status = build(access);
                await expect(status.ctrl.taskUpdateStatus({ nTaskid: TASK, nProgress: 50, nStatus: 239, nMasterid: ME } as any)).rejects.toBeInstanceOf(ForbiddenException);
                expect(status.db.executeRef).not.toHaveBeenCalled();
            },
        );

        it('403 for a missing nTaskid, without a lookup', async () => {
            const { ctrl, db } = build();
            await expect(ctrl.taskUpdateStatus({ nTaskid: null, nProgress: 50, nStatus: 239, nMasterid: ME } as any)).rejects.toBeInstanceOf(ForbiddenException);
            expect(db.rowQuery).not.toHaveBeenCalled();
            expect(db.executeRef).not.toHaveBeenCalled();
        });

        it.each([['an assignee', ACCESS.assignee], ['the creator', ACCESS.creator], ['a global admin', ACCESS.admin]])('%s can update status and progress', async (_l, access) => {
            const status = build(access);
            await expect(status.ctrl.taskUpdateStatus({ nTaskid: TASK, nProgress: 50, nStatus: 239, nMasterid: ME } as any)).resolves.toEqual([{ msg: 1, value: 'Updated ' }]);
            expect(spNames(status.db)).toEqual(['task_update_status']);

            const progress = build(access);
            await expect(progress.ctrl.updateTaskStatus({ nTaskid: TASK, nProgress: 50, permission: 'S', nMasterid: ME } as any)).resolves.toEqual([{ msg: 1 }]);
            expect(spArgs(progress.db, 'task_insert_detail')).toEqual([{ nTaskid: TASK, nProgress: 50, permission: 'S', nMasterid: ME }]);
        });

        it('updateTaskProgress only ever runs the progress branch, whatever permission is sent', async () => {
            for (const permission of ['E', 'N']) {
                const { ctrl, db } = build(ACCESS.assignee);
                await ctrl.updateTaskStatus({ nTaskid: TASK, nProgress: 50, permission, nMasterid: ME } as any);
                expect(spArgs(db, 'task_insert_detail')[0].permission).toBe('S');
            }
        });

        it('500 when the lookup fails', async () => {
            const { ctrl, db } = build(ACCESS.failed);
            await expect(ctrl.taskUpdateStatus({ nTaskid: TASK, nProgress: 50, nStatus: 239, nMasterid: ME } as any)).rejects.toBeInstanceOf(InternalServerErrorException);
            expect(db.executeRef).not.toHaveBeenCalled();
        });
    });

    describe('task/taskdelete (creator or global admin)', () => {
        it.each([['an assignee', ACCESS.assignee], ['an uninvolved member', ACCESS.member], ['the creator after leaving the case', ACCESS.exCreator]])(
            '403 for %s, nothing deleted',
            async (_l, access) => {
                const { ctrl, db } = build(access);
                await expect(ctrl.taskDelete({ nTaskid: TASK, nMasterid: ME } as any)).rejects.toBeInstanceOf(ForbiddenException);
                expect(db.executeRef).not.toHaveBeenCalled();
            },
        );

        it.each([['the creator', ACCESS.creator], ['a global admin', ACCESS.admin]])('%s reaches et_task_delete', async (_l, access) => {
            const { ctrl, db } = build(access);
            await expect(ctrl.taskDelete({ nTaskid: TASK, nMasterid: ME } as any)).resolves.toEqual([{ msg: 1, value: 'Deleted' }]);
            expect(spNames(db)).toEqual(['task_delete']);
        });
    });

    describe.each([
        { name: 'task/gettaskdetail', call: (c: TaskController, q: any) => c.getTaskDetail(q), sp: 'task_detail', shape: SP_RESULT.task_detail.data },
        { name: 'task/gettaskdetail/v2', call: (c: TaskController, q: any) => c.getTaskDetailV2(q), sp: 'task_detail_v2', shape: SP_RESULT.task_detail_v2.data },
    ])('$name (creator, assignee or global admin)', (r) => {
        it.each([
            ['an uninvolved member', ACCESS.member],
            ['an outsider', ACCESS.outsider],
            ['the creator after leaving the case', ACCESS.exCreator],
            ['anyone, for a missing task', ACCESS.missing],
        ])('%s gets the SP\'s empty cursors, not the task', async (_l, access) => {
            const { ctrl, db } = build(access);
            await expect(r.call(ctrl, { nTaskid: TASK, nMasterid: ME })).resolves.toEqual([[], [], []]);
            expect(db.executeRef).not.toHaveBeenCalled();
        });

        it('the route\'s failure shape when the lookup fails', async () => {
            const { ctrl, db } = build(ACCESS.failed);
            await expect(r.call(ctrl, { nTaskid: TASK, nMasterid: ME })).resolves.toEqual([{ msg: -1, value: 'Failed to fetch' }]);
            expect(db.executeRef).not.toHaveBeenCalled();
        });

        it.each([['the creator', ACCESS.creator], ['an assignee', ACCESS.assignee], ['a global admin', ACCESS.admin]])('%s reads the task', async (_l, access) => {
            const { ctrl, db } = build(access);
            await expect(r.call(ctrl, { nTaskid: TASK, nMasterid: ME })).resolves.toEqual(r.shape);
            expect(spNames(db)).toEqual([r.sp]);
        });
    });

    describe('helpers', () => {
        it('taskAccess asks nothing without a caller or a task id', async () => {
            const db = { rowQuery: jest.fn() };
            for (const [who, id] of [[undefined, TASK], [ME, null], ['x', TASK], [ME, 'not-a-uuid']]) {
                const access = await taskAccess(db as any, who, id);
                expect(access).toEqual(expect.objectContaining({ view: false, status: false, edit: false, assign: false, delete: false }));
            }
            expect(db.rowQuery).not.toHaveBeenCalled();
        });

        it('taskAccess: rights by role', async () => {
            const read = async (r: any) => taskAccess({ rowQuery: jest.fn(async () => r) } as any, ME, TASK);
            expect(await read(ACCESS.creator)).toEqual({ view: true, status: true, edit: true, assign: true, delete: true, assignees: [PEER] });
            expect(await read(ACCESS.assignee)).toEqual({ view: true, status: true, edit: true, assign: false, delete: false, assignees: [PEER, ME] });
            expect(await read(ACCESS.admin)).toEqual({ view: true, status: true, edit: true, assign: true, delete: true, assignees: [PEER] });
            for (const r of [ACCESS.member, ACCESS.outsider, ACCESS.exCreator, ACCESS.exAssignee, ACCESS.missing]) {
                expect(await read(r)).toEqual(expect.objectContaining({ view: false, status: false, edit: false, assign: false, delete: false }));
            }
            expect(await read(ACCESS.failed)).toBe('failed');
        });

        it('requestedAssigneeIds reads both jUsers shapes the way the assign SPs do', () => {
            expect(requestedAssigneeIds(JSON.stringify([PEER.toUpperCase(), ME]), 'ids')).toEqual([PEER, ME]);
            expect(requestedAssigneeIds(JSON.stringify([{ nUserid: PEER }, 'x', { bCanEdit: true }, { nUserid: null }]), 'objects')).toEqual([PEER]);
            expect(requestedAssigneeIds('[]', 'objects')).toEqual([]);
            expect(requestedAssigneeIds(JSON.stringify([{ nUserid: PEER }]), 'ids')).toBeNull();
            expect(requestedAssigneeIds('{"nUserid":"x"}', 'objects')).toBeNull();
            expect(requestedAssigneeIds('not json', 'ids')).toBeNull();
            expect(requestedAssigneeIds(undefined, 'ids')).toBeNull();
        });

        it('sameAssignees ignores order, case and repeats', () => {
            expect(sameAssignees([PEER, ME, ME], [ME.toUpperCase(), PEER])).toBe(true);
            expect(sameAssignees([PEER], [PEER, ME])).toBe(false);
            expect(sameAssignees([], [])).toBe(true);
        });

        it('the SQL is parametrised and uses the active-member and global-admin tests', () => {
            for (const sql of [TASK_ACCESS_SQL, TASK_CREATE_ACCESS_SQL]) {
                expect(sql).toContain(`"cStatus" = 'A'`);
                expect(sql).toContain(`u."isAdmin" = true`);
                expect(sql).not.toMatch(/\$\{/);
            }
            expect(TASK_ACCESS_SQL).toContain('t."nTaskid" = $1::uuid');
            expect(TASK_CREATE_ACCESS_SQL).toContain('c."nCaseid" = $1::uuid');
        });
    });
});
