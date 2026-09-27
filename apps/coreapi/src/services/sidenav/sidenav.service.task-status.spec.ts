import { ForbiddenException, InternalServerErrorException, Logger } from '@nestjs/common';
import { SidenavService } from './sidenav.service';
import { SidenavController } from '../../controllers/sidenav/sidenav.controller';
import { TASK_ACCESS_SQL } from '../task/task-access';

const ME = '11111111-1111-4111-8111-111111111111';
const PEER = '22222222-2222-4222-8222-222222222222';
const TASK = '99999999-9999-4999-8999-999999999999';

/** TASK_ACCESS_SQL answers for (TASK, ME). */
const row = (over: Record<string, any>) => ({
    success: true,
    data: [{ bAdmin: false, bMember: true, bCreator: false, bAssignee: false, jAssignees: [PEER], ...over }],
});
const ACCESS = {
    creator: row({ bCreator: true }),
    assignee: row({ bAssignee: true, jAssignees: [PEER, ME] }),
    admin: row({ bAdmin: true, bMember: false }),
    member: row({}), // on the case, but neither created nor assigned (e.g. only owns a linked fact)
    outsider: row({ bMember: false }),
    exCreator: row({ bMember: false, bCreator: true }), // switched off on / removed from the case
    exAssignee: row({ bMember: false, bAssignee: true, jAssignees: [PEER, ME] }),
    missing: { success: true, data: [] },
};

function build(access: any = ACCESS.creator) {
    const calls: string[] = [];
    const db = {
        rowQuery: jest.fn(async (text: string) => {
            calls.push('access');
            if (text !== TASK_ACCESS_SQL) throw new Error('unexpected query');
            if (typeof access === 'function') return access();
            return access;
        }),
        executeRef: jest.fn(async (name: string) => {
            calls.push(name);
            if (name === 'sidenav_task_update_status') return { success: true, data: [[{ msg: 1 }]] };
            throw new Error(`unexpected SP ${name}`);
        }),
    };
    const svc = new SidenavService(db as any);
    return { db, calls, ctrl: new SidenavController(svc) };
}

/** The legacy task table's body (fact.service.updateTaskStatus); JwtMiddleware adds nMasterid. */
const body = (over: Record<string, any> = {}) => ({ nTaskid: TASK, cStatus: 'C', nMasterid: ME, ...over }) as any;

describe('coreapi sidenav/task/status/update needs the task status right (creator, assignee or admin; active member)', () => {
    beforeEach(() => jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined));
    afterEach(() => jest.restoreAllMocks());

    it.each(['member', 'outsider', 'exCreator', 'exAssignee', 'missing'] as const)(
        '%s: 403 and the status is not written', async (who) => {
            const { ctrl, db } = build(ACCESS[who]);
            for (const cStatus of ['C', 'P']) {
                await expect(ctrl.updateTaskStatus(body({ cStatus }))).rejects.toBeInstanceOf(ForbiddenException);
            }
            expect(db.rowQuery).toHaveBeenCalledWith(TASK_ACCESS_SQL, [TASK, ME]); // the token user, not a client id
            expect(db.executeRef).not.toHaveBeenCalled();
        });

    it('500 when the access lookup fails or throws; nothing written', async () => {
        for (const access of [{ success: false, error: 'db down' }, () => { throw new Error('boom'); }]) {
            const { ctrl, db } = build(access);
            await expect(ctrl.updateTaskStatus(body())).rejects.toBeInstanceOf(InternalServerErrorException);
            expect(db.executeRef).not.toHaveBeenCalled();
        }
    });

    it('403 without a lookup when there is no caller or the task id is not a UUID', async () => {
        for (const over of [{ nMasterid: undefined }, { nTaskid: undefined }, { nTaskid: '0' }]) {
            const { ctrl, db } = build();
            await expect(ctrl.updateTaskStatus(body(over))).rejects.toBeInstanceOf(ForbiddenException);
            expect(db.rowQuery).not.toHaveBeenCalled();
            expect(db.executeRef).not.toHaveBeenCalled();
        }
    });

    it.each(['creator', 'assignee', 'admin'] as const)(
        '%s: marks the task complete and back, checked before the write', async (who) => {
            const { ctrl, db, calls } = build(ACCESS[who]);
            await expect(ctrl.updateTaskStatus(body({ cStatus: 'C' }))).resolves.toEqual([{ msg: 1 }]);
            await expect(ctrl.updateTaskStatus(body({ cStatus: 'P' }))).resolves.toEqual([{ msg: 1 }]);
            expect(calls).toEqual(['access', 'sidenav_task_update_status', 'access', 'sidenav_task_update_status']);
            expect(db.executeRef).toHaveBeenCalledWith('sidenav_task_update_status', body({ cStatus: 'P' }));
        });
});
