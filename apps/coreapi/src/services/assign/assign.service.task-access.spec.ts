import { ForbiddenException, InternalServerErrorException, Logger } from '@nestjs/common';
import { AssignService } from './assign.service';
import { AssignController } from '../../controllers/assign/assign.controller';
import { TASK_ACCESS_SQL } from '../task/task-access';
import { TASK_DOCS_IN_CASE_SQL, taskDocIds } from './assign-access';

const ME = '11111111-1111-4111-8111-111111111111';
const PEER = '22222222-2222-4222-8222-222222222222';
const TASK = '99999999-9999-4999-8999-999999999999';
const DOC_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'; // in the task's case
const DOC_A2 = 'abababab-abab-4bab-8bab-abababababab'; // in the task's case
const DOC_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'; // in another case

/** TASK_ACCESS_SQL answers for (TASK, ME). */
const row = (over: Record<string, any>) => ({
    success: true,
    data: [{ bAdmin: false, bMember: true, bCreator: false, bAssignee: false, jAssignees: [PEER], ...over }],
});
const ACCESS = {
    creator: row({ bCreator: true }),
    assignee: row({ bAssignee: true, jAssignees: [PEER, ME] }),
    admin: row({ bAdmin: true, bMember: false }),
    member: row({}), // on the case, but neither created nor assigned
    outsider: row({ bMember: false }),
    exCreator: row({ bMember: false, bCreator: true }), // switched off on / removed from the case
    exAssignee: row({ bMember: false, bAssignee: true, jAssignees: [PEER, ME] }),
    missing: { success: true, data: [] },
};
const REFUSED = ['member', 'outsider', 'exCreator', 'exAssignee', 'missing'] as const;
const ALLOWED = ['creator', 'assignee', 'admin'] as const;
const IN_CASE = new Set([DOC_A, DOC_A2]);

function build(access: any = ACCESS.creator, docs: any = null) {
    const calls: string[] = [];
    const db = {
        rowQuery: jest.fn(async (text: string, params: any[]) => {
            if (text === TASK_ACCESS_SQL) {
                calls.push('task');
                return typeof access === 'function' ? access() : access;
            }
            if (text === TASK_DOCS_IN_CASE_SQL) {
                calls.push('docs');
                if (docs) return typeof docs === 'function' ? docs() : docs;
                return { success: true, data: [{ bAllowed: params[1].every((id: string) => IN_CASE.has(id)) }] };
            }
            throw new Error('unexpected query');
        }),
        executeRef: jest.fn(async (name: string) => {
            calls.push(name);
            if (name === 'assign_task') return { success: true, data: [[{ msg: 1, value: 'Assinged' }]] };
            if (name === 'unassign_task') return { success: true, data: [[{ msg: 1, value: 'Unassinged' }]] };
            throw new Error(`unexpected SP ${name}`);
        }),
    };
    const svc = new AssignService(db as any);
    return { db, calls, ctrl: new AssignController(svc) };
}

/** What legacy Properties / taskpopup and the new frontend send; JwtMiddleware adds nMasterid. */
const assign = (over: Record<string, any> = {}) => ({ nTaskid: TASK, jFiles: JSON.stringify([DOC_A]), nMasterid: ME, ...over }) as any;
const unassign = (over: Record<string, any> = {}) => ({ nTaskid: TASK, jBDids: [DOC_A], nMasterid: ME, ...over }) as any;

describe('coreapi assign/assigntask and assign/unassigntask need the task edit right (creator, assignee or admin; active member)', () => {
    beforeEach(() => jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined));
    afterEach(() => jest.restoreAllMocks());

    it.each(REFUSED)('%s: 403 on both routes, nothing linked or unlinked', async (who) => {
        const { ctrl, db, calls } = build(ACCESS[who]);
        await expect(ctrl.assigntask(assign())).rejects.toBeInstanceOf(ForbiddenException);
        await expect(ctrl.unassigtask(unassign())).rejects.toBeInstanceOf(ForbiddenException);
        expect(db.rowQuery).toHaveBeenCalledWith(TASK_ACCESS_SQL, [TASK, ME]); // the token user
        expect(calls).toEqual(['task', 'task']); // no document lookup, no SP
        expect(db.executeRef).not.toHaveBeenCalled();
    });

    it('500 when the task lookup fails or throws; nothing written', async () => {
        for (const access of [{ success: false, error: 'db down' }, () => { throw new Error('boom'); }]) {
            const { ctrl, db } = build(access);
            await expect(ctrl.assigntask(assign())).rejects.toBeInstanceOf(InternalServerErrorException);
            await expect(ctrl.unassigtask(unassign())).rejects.toBeInstanceOf(InternalServerErrorException);
            expect(db.executeRef).not.toHaveBeenCalled();
        }
    });

    it('403 without a lookup when there is no caller or no task id', async () => {
        for (const over of [{ nMasterid: undefined }, { nTaskid: undefined }, { nTaskid: null }]) {
            const { ctrl, db } = build();
            await expect(ctrl.assigntask(assign(over))).rejects.toBeInstanceOf(ForbiddenException);
            await expect(ctrl.unassigtask(unassign(over))).rejects.toBeInstanceOf(ForbiddenException);
            expect(db.rowQuery).not.toHaveBeenCalled();
            expect(db.executeRef).not.toHaveBeenCalled();
        }
    });

    it.each(ALLOWED)('%s: links documents of the task case and unlinks them, each checked before the SP', async (who) => {
        const { ctrl, db, calls } = build(ACCESS[who]);
        const jFiles = JSON.stringify([DOC_A, DOC_A2.toUpperCase(), DOC_A]);
        await expect(ctrl.assigntask(assign({ jFiles }))).resolves.toEqual({ msg: 1, value: 'Assinged' });
        await expect(ctrl.unassigtask(unassign())).resolves.toEqual([{ msg: 1, value: 'Unassinged' }]);
        expect(calls).toEqual(['task', 'docs', 'assign_task', 'task', 'unassign_task']);
        expect(db.rowQuery).toHaveBeenCalledWith(TASK_DOCS_IN_CASE_SQL, [TASK, [DOC_A, DOC_A2]]); // lower case, once each
        expect(db.executeRef).toHaveBeenCalledWith('assign_task', assign({ jFiles })); // body passed on unchanged
    });

    it.each(ALLOWED)('%s: 403 when any document is from another case (admins too); nothing linked', async (who) => {
        const { ctrl, db } = build(ACCESS[who]);
        for (const jFiles of [[DOC_B], [DOC_A, DOC_B]]) {
            await expect(ctrl.assigntask(assign({ jFiles: JSON.stringify(jFiles) }))).rejects.toBeInstanceOf(ForbiddenException);
        }
        expect(db.executeRef).not.toHaveBeenCalled();
    });

    it('500 when the document lookup fails or throws, 403 when it answers no row; nothing linked', async () => {
        for (const docs of [{ success: false, error: 'db down' }, () => { throw new Error('boom'); }]) {
            const { ctrl, db } = build(ACCESS.creator, docs);
            await expect(ctrl.assigntask(assign())).rejects.toBeInstanceOf(InternalServerErrorException);
            expect(db.executeRef).not.toHaveBeenCalled();
        }
        const none = build(ACCESS.creator, { success: true, data: [] });
        await expect(none.ctrl.assigntask(assign())).rejects.toBeInstanceOf(ForbiddenException);
        expect(none.db.executeRef).not.toHaveBeenCalled();
    });

    it.each(ALLOWED)('%s: 403 for another case\'s document in a spelling Postgres still reads as that uuid; nothing linked', async (who) => {
        // et_assign_task casts each element with ::uuid, which takes these too; a check that skipped
        // them linked the document unchecked.
        const hex = DOC_B.replace(/-/g, '');
        const spellings = [`{${DOC_B}}`, hex, hex.toUpperCase(), hex.match(/.{4}/g)!.join('-'), `{${DOC_A}}`];
        for (const spelling of spellings) {
            for (const jFiles of [[spelling], [DOC_A, spelling]]) {
                const { ctrl, db } = build(ACCESS[who]);
                await expect(ctrl.assigntask(assign({ jFiles: JSON.stringify(jFiles) }))).rejects.toBeInstanceOf(ForbiddenException);
                expect(db.executeRef).not.toHaveBeenCalled();
            }
        }
        const digits = build(ACCESS[who]); // a 32-digit JSON number is read as a uuid as well
        await expect(digits.ctrl.assigntask(assign({ jFiles: '[12345678901234567890123456789012]' }))).rejects.toBeInstanceOf(ForbiddenException);
        expect(digits.db.executeRef).not.toHaveBeenCalled();
    });

    it('403 without a document lookup for a jFiles the check cannot read (not JSON, not an array, a non-UUID element)', async () => {
        for (const jFiles of ['not json', '{"a":1}', JSON.stringify(DOC_A), '["x"]', `["${DOC_A}", 7]`, `[["${DOC_B}"]]`, '']) {
            const { ctrl, db, calls } = build();
            await expect(ctrl.assigntask(assign({ jFiles }))).rejects.toBeInstanceOf(ForbiddenException);
            expect(calls).toEqual(['task']);
            expect(db.executeRef).not.toHaveBeenCalled();
        }
    });

    it('a jFiles with no document id to insert is left to the SP, as before, once the task gate passed', async () => {
        for (const jFiles of ['[]', '[null]', undefined]) {
            const { ctrl, calls } = build();
            await ctrl.assigntask(assign({ jFiles }));
            expect(calls).toEqual(['task', 'assign_task']);
        }
        const refused = build(ACCESS.outsider);
        await expect(refused.ctrl.assigntask(assign({ jFiles: '[]' }))).rejects.toBeInstanceOf(ForbiddenException);
        expect(refused.db.executeRef).not.toHaveBeenCalled();
    });

    it('TASK_DOCS_IN_CASE_SQL: every id must be a document whose section is in the task own case', () => {
        const sql = TASK_DOCS_IN_CASE_SQL.replace(/\s+/g, ' ');
        expect(sql).toContain('SELECT NOT EXISTS ( SELECT 1 FROM unnest($2::uuid[]) AS d("nBundledetailid") WHERE NOT EXISTS (');
        expect(sql).toContain('JOIN "SectionMaster" s ON s."nSectionid" = bd."nSectionid" JOIN "TaskMaster" t ON t."nCaseid" = s."nCaseid"');
        expect(sql).toContain('WHERE bd."nBundledetailid" = d."nBundledetailid" AND t."nTaskid" = $1::uuid');
    });

    it('taskDocIds: the UUID strings of a JSON array, lower case and de-duplicated; null for anything else', () => {
        expect(taskDocIds(JSON.stringify([DOC_A, DOC_B.toUpperCase(), DOC_A, null]))).toEqual([DOC_A, DOC_B]);
        for (const v of [undefined, null, '[]', '[null]']) expect(taskDocIds(v)).toEqual([]);
        expect(taskDocIds(JSON.stringify(DOC_A))).toBeNull(); // the SP cannot expand a scalar either
        for (const v of [5, '', 'nope', '{}', '["x"]', `["${DOC_A}", 7]`, `["{${DOC_A}}"]`, `["${DOC_A.replace(/-/g, '')}"]`]) {
            expect(taskDocIds(v)).toBeNull();
        }
    });
});
