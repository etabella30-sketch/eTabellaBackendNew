import { BadRequestException, ForbiddenException, InternalServerErrorException, Logger } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { WorkspaceController } from '../../controllers/workspace/workspace.controller';
import { TASK_VISIBLE_SQL } from '../task/task-access';
import { MAX_FACT_IDS } from '../fact/fact-access';

const ME = '11111111-1111-4111-8111-111111111111';
const OWNER = '22222222-2222-4222-8222-222222222222';
const TASK = '99999999-9999-4999-8999-999999999999';
const MINE = '55555555-5555-4555-8555-555555555555';
const EDITABLE = '66666666-6666-4666-8666-666666666666';
const VIEW_ONLY = '77777777-7777-4777-8777-777777777777';
const HIDDEN = '88888888-8888-4888-8888-888888888888';
const GONE = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

/** et_fact_permissions answers per fact, for ME. */
const FACTS: Record<string, any> = {
    [MINE]: { success: true, data: [[{ nFSid: MINE, nUserid: ME, bCanView: true, bCanEdit: true }]] },
    [EDITABLE]: { success: true, data: [[{ nFSid: EDITABLE, nUserid: OWNER, bCanView: true, bCanEdit: true }]] },
    [VIEW_ONLY]: { success: true, data: [[{ nFSid: VIEW_ONLY, nUserid: OWNER, bCanView: true, bCanEdit: null }]] },
    [HIDDEN]: { success: true, data: [[{ nFSid: HIDDEN, nUserid: OWNER, bCanView: false, bCanEdit: null }]] },
};

function build(opts: { task?: any; facts?: Record<string, any> } = {}) {
    const task = opts.task ?? { success: true, data: [{ bVisible: true }] };
    const facts = { ...FACTS, ...(opts.facts ?? {}) };
    const db = {
        executeRef: jest.fn(async (name: string, params: any) => {
            if (name === 'fact_permissions') return facts[params.nFSid] ?? { success: true, data: [[]] };
            if (name === 'workspace_task_factlink') return { success: true, data: [[{ msg: 1, value: 'Linked' }]] };
            throw new Error(`unexpected SP ${name}`);
        }),
        rowQuery: jest.fn(async () => {
            if (typeof task === 'function') return task();
            return task;
        }),
    };
    const svc = new WorkspaceService(db as any);
    return { svc, db, ctrl: new WorkspaceController(svc) };
}

const spNames = (db: { executeRef: jest.Mock }) => db.executeRef.mock.calls.map((c) => c[0]);
const link = (ids: unknown, over: Record<string, any> = {}) =>
    ({ nTaskid: TASK, jFactids: typeof ids === 'string' ? ids : JSON.stringify(ids), nMasterid: ME, ...over }) as any;

describe('coreapi POST workspace/tasks/factlink: the caller must see the task and edit every fact', () => {
    beforeEach(() => jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined));
    afterEach(() => jest.restoreAllMocks());

    it('403 and nothing linked when the task is not the caller\'s (not its creator or assignee)', async () => {
        const { ctrl, db } = build({ task: { success: true, data: [{ bVisible: false }] } });
        await expect(ctrl.linkTaskFacts(link([MINE]))).rejects.toBeInstanceOf(ForbiddenException);
        expect(db.rowQuery).toHaveBeenCalledWith(TASK_VISIBLE_SQL, [TASK, ME]);
        expect(spNames(db)).not.toContain('workspace_task_factlink');
    });

    it('the task check is the et_workspace_task_list rule: creator or TaskShared assignee', () => {
        expect(TASK_VISIBLE_SQL).toMatch(/"TaskMaster" t[\s\S]*t\."nTaskid" = \$1::uuid/);
        expect(TASK_VISIBLE_SQL).toMatch(/t\."nUserid" = \$2::uuid/);
        expect(TASK_VISIBLE_SQL).toMatch(/"TaskShared" ts[\s\S]*ts\."nUserid" = \$2::uuid/);
    });

    it.each([
        ['view-only', VIEW_ONLY],
        ['not shared', HIDDEN],
        ['missing (403, not 404, so the dialog does not blame an old server)', GONE],
    ])('403 and nothing linked when one fact is %s, even alongside editable ones', async (_label, bad) => {
        const { ctrl, db } = build();
        await expect(ctrl.linkTaskFacts(link([MINE, bad, EDITABLE]))).rejects.toBeInstanceOf(ForbiddenException);
        expect(db.executeRef).toHaveBeenCalledWith('fact_permissions', { nUserid: ME, nFSid: bad });
        expect(spNames(db)).not.toContain('workspace_task_factlink');
    });

    it('403 with no caller, before any fact lookup', async () => {
        const { ctrl, db } = build();
        await expect(ctrl.linkTaskFacts(link([MINE], { nMasterid: undefined }))).rejects.toBeInstanceOf(ForbiddenException);
        expect(db.rowQuery).not.toHaveBeenCalled();
        expect(spNames(db)).toEqual([]);
    });

    it('500 and nothing linked when the task lookup fails or throws, or a fact lookup fails', async () => {
        for (const task of [{ success: false, error: 'db down' }, () => { throw new Error('boom'); }]) {
            const { ctrl, db } = build({ task });
            await expect(ctrl.linkTaskFacts(link([MINE]))).rejects.toBeInstanceOf(InternalServerErrorException);
            expect(spNames(db)).not.toContain('workspace_task_factlink');
        }
        const { ctrl, db } = build({ facts: { [EDITABLE]: { success: false, error: 'db down' } } });
        await expect(ctrl.linkTaskFacts(link([MINE, EDITABLE]))).rejects.toBeInstanceOf(InternalServerErrorException);
        expect(spNames(db)).not.toContain('workspace_task_factlink');
    });

    it.each([
        ['not JSON', 'nope'],
        ['not an array', JSON.stringify(MINE)],
        ['a non-UUID entry', JSON.stringify([MINE, '1 or 1=1'])],
        ['a non-string entry', JSON.stringify([MINE, 42])],
    ])('400 and nothing run when jFactids is %s', async (_label, raw) => {
        const { ctrl, db } = build();
        await expect(ctrl.linkTaskFacts(link(raw))).rejects.toBeInstanceOf(BadRequestException);
        expect(db.rowQuery).not.toHaveBeenCalled();
        expect(spNames(db)).toEqual([]);
    });

    it(`400 and nothing run for more than ${MAX_FACT_IDS} facts`, async () => {
        const many = Array.from({ length: MAX_FACT_IDS + 1 }, (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`);
        const { ctrl, db } = build();
        await expect(ctrl.linkTaskFacts(link(many))).rejects.toBeInstanceOf(BadRequestException);
        expect(spNames(db)).toEqual([]);
    });

    it('a task creator or assignee links facts they own or may edit; duplicates are checked and sent once', async () => {
        const { ctrl, db } = build();
        await expect(ctrl.linkTaskFacts(link([MINE, EDITABLE, MINE.toUpperCase()]))).resolves.toEqual([{ msg: 1, value: 'Linked' }]);
        expect(spNames(db).filter((n) => n === 'fact_permissions')).toHaveLength(2);
        expect(db.executeRef).toHaveBeenCalledWith('workspace_task_factlink', expect.objectContaining({
            nTaskid: TASK,
            nMasterid: ME,
            jFactids: JSON.stringify([MINE, EDITABLE]),
        }));
    });

    it('an empty list still needs the task, and links nothing', async () => {
        const refused = build({ task: { success: true, data: [{ bVisible: false }] } });
        await expect(refused.ctrl.linkTaskFacts(link([]))).rejects.toBeInstanceOf(ForbiddenException);

        const { ctrl, db } = build();
        await expect(ctrl.linkTaskFacts(link([]))).resolves.toEqual([{ msg: 1, value: 'Linked' }]);
        expect(spNames(db)).toEqual(['workspace_task_factlink']);
    });
});
