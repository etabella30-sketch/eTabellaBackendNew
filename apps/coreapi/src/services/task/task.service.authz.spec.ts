import { ForbiddenException, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from '../../controllers/task/task.controller';

const ME = '11111111-1111-4111-8111-111111111111';
const OWNER = '22222222-2222-4222-8222-222222222222';
const FACT = '55555555-5555-4555-8555-555555555555';
const TASK = '99999999-9999-4999-8999-999999999999';

/** et_fact_permissions answers for (ME, FACT). */
const PERM = {
    owner: { success: true, data: [[{ nFSid: FACT, nUserid: ME, bCanView: true, bCanEdit: true }]] },
    editor: { success: true, data: [[{ nFSid: FACT, nUserid: OWNER, bCanView: true, bCanEdit: true }]] },
    viewer: { success: true, data: [[{ nFSid: FACT, nUserid: OWNER, bCanView: true, bCanEdit: null }]] },
    refused: { success: true, data: [[{ nFSid: FACT, nUserid: OWNER, bCanView: false, bCanEdit: null }]] },
    missing: { success: true, data: [[]] },
    failed: { success: false, error: 'db down' },
};

function build(perm: any) {
    const db = {
        executeRef: jest.fn(async (name: string) => {
            if (name === 'fact_permissions') return perm;
            if (name === 'fact_task_delete') return { success: true, data: [[{ msg: 1, value: 'Deleted' }]] };
            throw new Error(`unexpected SP ${name}`);
        }),
        rowQuery: jest.fn(),
    };
    const svc = new TaskService(db as any, { sendNotification: jest.fn() } as any);
    return { svc, db, ctrl: new TaskController(svc) };
}

const spNames = (db: { executeRef: jest.Mock }) => db.executeRef.mock.calls.map((c) => c[0]);
const body = (over: Record<string, any> = {}) => ({ nTaskid: TASK, nFSid: FACT, nMasterid: ME, ...over }) as any;

describe('coreapi task/facttaskdelete needs edit access to the fact (et_fact_permissions bCanEdit)', () => {
    beforeEach(() => jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined));
    afterEach(() => jest.restoreAllMocks());

    it.each([
        ['a view-only share recipient', PERM.viewer],
        ['a user the fact is not shared with', PERM.refused],
    ])('403 and the link is kept for %s', async (_label, perm) => {
        const { ctrl, db } = build(perm);
        await expect(ctrl.facttaskdelete(body())).rejects.toBeInstanceOf(ForbiddenException);
        expect(db.executeRef).toHaveBeenCalledWith('fact_permissions', { nUserid: ME, nFSid: FACT });
        expect(spNames(db)).not.toContain('fact_task_delete');
    });

    it('403 with no caller, without a lookup', async () => {
        const { ctrl, db } = build(PERM.owner);
        await expect(ctrl.facttaskdelete(body({ nMasterid: undefined }))).rejects.toBeInstanceOf(ForbiddenException);
        expect(spNames(db)).toEqual([]);
    });

    it('404 for a fact that does not exist, 500 when the lookup fails; nothing deleted either way', async () => {
        const missing = build(PERM.missing);
        await expect(missing.ctrl.facttaskdelete(body())).rejects.toBeInstanceOf(NotFoundException);
        expect(spNames(missing.db)).not.toContain('fact_task_delete');

        const failed = build(PERM.failed);
        await expect(failed.ctrl.facttaskdelete(body())).rejects.toBeInstanceOf(InternalServerErrorException);
        expect(spNames(failed.db)).not.toContain('fact_task_delete');
    });

    it.each([
        ['the fact owner', PERM.owner],
        ['a share recipient with edit', PERM.editor],
    ])('%s can still unlink a task, whoever created the task', async (_label, perm) => {
        const { ctrl, db } = build(perm);
        await expect(ctrl.facttaskdelete(body())).resolves.toEqual([{ msg: 1, value: 'Deleted' }]);
        expect(db.executeRef).toHaveBeenCalledWith('fact_task_delete', body());
        // The task's own visibility is not consulted (et_fact_update already lets an editor rewrite jTasks).
        expect(db.rowQuery).not.toHaveBeenCalled();
    });
});
