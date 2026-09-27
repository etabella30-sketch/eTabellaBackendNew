import { ForbiddenException, HttpException, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { FactService } from './fact.service';
import { FactController } from '../../controllers/fact/fact.controller';
import { MAX_FACT_IDS } from './fact-access';

const ME = '11111111-1111-4111-8111-111111111111';
const OWNER = '22222222-2222-4222-8222-222222222222';
const SHARED_A = '33333333-3333-4333-8333-333333333333';
const SHARED_B = '44444444-4444-4444-8444-444444444444';
const FACT = '55555555-5555-4555-8555-555555555555';
const MINE = '66666666-6666-4666-8666-666666666666';
const OTHERS = '77777777-7777-4777-8777-777777777777';
const GONE = '88888888-8888-4888-8888-888888888888';

/** et_fact_permissions answers, per fact id. */
const ROW = {
    view: { success: true, data: [[{ nFSid: FACT, nUserid: OWNER, bCanView: true, bCanEdit: false, bCanReshare: false }]] },
    edit: { success: true, data: [[{ nFSid: FACT, nUserid: OWNER, bCanView: true, bCanEdit: true, bCanReshare: false }]] },
    owner: { success: true, data: [[{ nFSid: FACT, nUserid: ME, bCanView: true, bCanEdit: true, bCanReshare: true }]] },
    refused: { success: true, data: [[{ nFSid: FACT, nUserid: OWNER, bCanView: false, bCanEdit: null, bCanReshare: null }]] },
    missing: { success: true, data: [[]] },
    failed: { success: false, error: 'db down' },
};

/** What each SP answers when it runs. */
const ROWS = [{ nFSid: FACT, cFname: 'Secret', jTexts: ['secret'] }];
const CURSORS3 = [ROWS, [{ nUserid: SHARED_A }], [{ nTaskid: 't' }]];
const CURSORS2 = [ROWS, [{ nFMLid: 'l' }]];
const SP_DATA: Record<string, any> = {
    fact_get_contact: [ROWS],
    fact_get_shared: [[{ nFSid: FACT, nUserid: SHARED_A }, { nFSid: FACT, nUserid: SHARED_B }]],
    fact_get_links: [ROWS],
    fact_get_task: CURSORS3,
    fact_get_detail: [ROWS],
    fact_get_issue_links: CURSORS2,
    fact_quick_update: [[{ msg: 1, value: 'Updated' }]],
    fact_update: [[{ msg: 1, value: 'Updated', jNotify: [] }]],
    fact_highlight_delete_by_uuid: [[{ msg: 1 }]],
    fact_highlight_add: [[{ msg: 1 }]],
    fact_convert: [[{ msg: 1 }]],
    individual_update_facts_note: [[{ msg: 1 }]],
};

function build(perm: any, extra: Record<string, any> = {}) {
    const byFact: Record<string, any> = typeof perm === 'object' && !('success' in perm) ? perm : { [FACT]: perm };
    const db = {
        executeRef: jest.fn(async (name: string, params: any) => {
            if (name === 'fact_permissions') return byFact[params.nFSid] ?? ROW.missing;
            if (name in extra) return extra[name];
            return { success: true, data: SP_DATA[name] };
        }),
    };
    const utility = { sendNotification: jest.fn() };
    const svc = new FactService(db as any, utility as any);
    return { svc, db, ctrl: new FactController(svc) };
}

const spNames = (db: { executeRef: jest.Mock }) => db.executeRef.mock.calls.map((c) => c[0]);
const one = () => ({ nFSid: FACT, nMasterid: ME }) as any;

/** Single-fact list reads: method, SP, and the empty body a hidden fact answers. */
const listReads = [
    ['getFactcontact', 'fact_get_contact', []],
    ['getFactshared', 'fact_get_shared', []],
    ['getFactlinks', 'fact_get_links', []],
    ['getFacttask', 'fact_get_task', [[], [], []]],
] as const;

describe('coreapi FactService read gate (et_fact_permissions bCanView)', () => {
    beforeEach(() => {
        jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
        jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    });
    afterEach(() => jest.restoreAllMocks());

    it.each(listReads)('%s answers the normal empty body, not a 403, to a caller who may not view the fact, without running %s', async (method, sp, empty) => {
        const { svc, db } = build(ROW.refused);
        await expect((svc as any)[method](one())).resolves.toEqual(empty);
        expect(db.executeRef).toHaveBeenCalledWith('fact_permissions', { nUserid: ME, nFSid: FACT });
        expect(spNames(db)).not.toContain(sp);
    });

    it.each(listReads)('%s answers the empty body for a fact that does not exist', async (method, sp, empty) => {
        const { svc, db } = build(ROW.missing);
        await expect((svc as any)[method](one())).resolves.toEqual(empty);
        expect(spNames(db)).not.toContain(sp);
    });

    it.each(listReads)('%s answers the empty body with no caller id, without a lookup', async (method, _sp, empty) => {
        const { svc, db } = build(ROW.owner);
        await expect((svc as any)[method]({ nFSid: FACT })).resolves.toEqual(empty);
        expect(db.executeRef).not.toHaveBeenCalled();
    });

    it.each(listReads)('%s answers its failure body when the permission lookup fails', async (method, sp) => {
        const { svc, db } = build(ROW.failed);
        await expect((svc as any)[method](one())).resolves.toEqual({ msg: -1, value: 'Fetch failed' });
        expect(spNames(db)).not.toContain(sp);
    });

    it.each(listReads)('%s also answers its failure body when the lookup throws', async (method, sp) => {
        const { svc, db } = build(ROW.owner);
        db.executeRef.mockImplementationOnce(async () => { throw new Error('socket closed'); });
        await expect((svc as any)[method](one())).resolves.toEqual({ msg: -1, value: 'Fetch failed' });
        expect(spNames(db)).not.toContain(sp);
    });

    it('keeps each response shape for a caller who may view the fact (shared, view only)', async () => {
        const { svc, db } = build(ROW.view);
        await expect(svc.getFactcontact(one())).resolves.toEqual(ROWS);
        await expect(svc.getFactlinks(one())).resolves.toEqual(ROWS);
        await expect(svc.getFactshared(one())).resolves.toEqual(SP_DATA.fact_get_shared[0]);
        await expect(svc.getFacttask(one())).resolves.toEqual(CURSORS3);
        expect(spNames(db)).toEqual([
            'fact_permissions', 'fact_get_contact',
            'fact_permissions', 'fact_get_links',
            'fact_permissions', 'fact_get_shared',
            'fact_permissions', 'fact_get_task',
        ]);
    });

    it('the controller read routes answer 200 bodies, so no interceptor redirects', async () => {
        const { ctrl } = build(ROW.refused);
        await expect(ctrl.getFactContact(one())).resolves.toEqual([]);
        await expect(ctrl.getFacttask(one())).resolves.toEqual([[], [], []]);
        await expect(ctrl.getFactshared(one())).resolves.toEqual([]);
        await expect(ctrl.getFactlinks(one())).resolves.toEqual([]);
        await expect(ctrl.getFactdetail({ jFSids: JSON.stringify([FACT]), nMasterid: ME } as any)).resolves.toEqual([]);
        await expect(ctrl.getFactIssuelinks({ jFSids: JSON.stringify([FACT]), nMasterid: ME } as any)).resolves.toEqual([[], []]);
    });
});

describe('coreapi FactService multi-fact reads keep only the facts the caller may view', () => {
    const perms = { [MINE]: ROW.owner, [FACT]: ROW.view, [OTHERS]: ROW.refused, [GONE]: ROW.missing };
    const multi = [
        ['getFactdetail', 'fact_get_detail', []],
        ['getFactIssuelinks', 'fact_get_issue_links', [[], []]],
    ] as const;

    beforeEach(() => {
        jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
        jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    });
    afterEach(() => jest.restoreAllMocks());

    it.each(multi)('%s passes only viewable ids to %s, in order', async (method, sp) => {
        const { svc, db } = build(perms);
        await (svc as any)[method]({ jFSids: JSON.stringify([OTHERS, MINE, GONE, FACT]), nMasterid: ME });
        const call = db.executeRef.mock.calls.find((c) => c[0] === sp);
        expect(JSON.parse(call[1].jFSids)).toEqual([MINE, FACT]);
    });

    it.each(multi)('%s answers the empty body without running %s when no id is viewable', async (method, sp, empty) => {
        const { svc, db } = build(perms);
        await expect((svc as any)[method]({ jFSids: JSON.stringify([OTHERS, GONE]), nMasterid: ME })).resolves.toEqual(empty);
        expect(spNames(db)).not.toContain(sp);
    });

    it.each(multi)('%s accepts one id sent as a bare JSON string (legacy taskpopup)', async (method, sp) => {
        const { svc, db } = build(perms);
        await (svc as any)[method]({ jFSids: JSON.stringify(MINE), nMasterid: ME });
        const call = db.executeRef.mock.calls.find((c) => c[0] === sp);
        expect(JSON.parse(call[1].jFSids)).toEqual([MINE]);
        const { svc: svc2, db: db2 } = build(perms);
        await (svc2 as any)[method]({ jFSids: JSON.stringify(OTHERS), nMasterid: ME });
        expect(spNames(db2)).not.toContain(sp);
    });

    it.each(multi)('%s drops non-UUID entries and malformed input without a lookup', async (method, sp, empty) => {
        const { svc, db } = build(perms);
        await expect((svc as any)[method]({ jFSids: JSON.stringify([1, null, 'x', { a: 1 }]), nMasterid: ME })).resolves.toEqual(empty);
        await expect((svc as any)[method]({ jFSids: 'not json', nMasterid: ME })).resolves.toEqual(empty);
        expect(db.executeRef).not.toHaveBeenCalled();
        expect(spNames(db)).not.toContain(sp);
    });

    it.each(multi)('%s checks each distinct id once', async (method) => {
        const { svc, db } = build(perms);
        await (svc as any)[method]({ jFSids: JSON.stringify([MINE, MINE.toUpperCase(), MINE]), nMasterid: ME });
        expect(spNames(db).filter((n) => n === 'fact_permissions')).toHaveLength(1);
    });

    it.each(multi)('%s answers its failure body when any lookup fails', async (method, sp) => {
        const { svc, db } = build({ ...perms, [GONE]: ROW.failed });
        await expect((svc as any)[method]({ jFSids: JSON.stringify([MINE, GONE]), nMasterid: ME })).resolves.toEqual({ msg: -1, value: 'Fetch failed' });
        expect(spNames(db)).not.toContain(sp);
    });

    it.each(multi)('%s refuses more than MAX_FACT_IDS distinct ids without any lookup', async (method, sp) => {
        const { svc, db } = build(perms);
        const ids = Array.from({ length: MAX_FACT_IDS + 1 }, (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`);
        await expect((svc as any)[method]({ jFSids: JSON.stringify(ids), nMasterid: ME })).resolves.toEqual({ msg: -1, value: 'Fetch failed' });
        expect(db.executeRef).not.toHaveBeenCalled();
        expect(spNames(db)).not.toContain(sp);
    });

    it('keeps the response shapes for viewable facts', async () => {
        const { svc } = build(perms);
        await expect(svc.getFactdetail({ jFSids: JSON.stringify([MINE]), nMasterid: ME } as any)).resolves.toEqual(ROWS);
        await expect(svc.getFactIssuelinks({ jFSids: JSON.stringify([MINE]), nMasterid: ME } as any)).resolves.toEqual(CURSORS2);
    });
});

describe('coreapi FactService edit gate (et_fact_permissions bCanEdit)', () => {
    const body = (extra: any = {}) => ({ nFSid: FACT, nMasterid: ME, ...extra }) as any;
    /** Edit routes: service method, SP, controller method. */
    const edits = [
        ['quickfactUpdate', 'fact_quick_update', 'quickfactupdate'],
        ['factUpdate', 'fact_update', 'factupdate'],
        ['deletehighlight', 'fact_highlight_delete_by_uuid', 'deleteHighlight'],
        ['addhighlight', 'fact_highlight_add', 'addhighlight'],
        ['convertFact', 'fact_convert', 'convertfact'],
        ['updateFactNote', 'individual_update_facts_note', 'updateFactNote'],
    ] as const;

    beforeEach(() => jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined));
    afterEach(() => jest.restoreAllMocks());

    it.each(edits)('%s refuses with 403 a caller who may view but not edit, without running %s', async (method, sp) => {
        const { svc, db } = build(ROW.view);
        const err = await (svc as any)[method](body({ jU: '[]' })).then(() => null, (e: any) => e);
        expect(err).toBeInstanceOf(ForbiddenException);
        expect(err.getResponse()).toMatchObject({ msg: -1 });
        expect(db.executeRef).toHaveBeenCalledWith('fact_permissions', { nUserid: ME, nFSid: FACT });
        expect(spNames(db)).not.toContain(sp);
    });

    it.each(edits)('%s refuses with 403 a caller the fact is not shared with', async (method, sp) => {
        const { svc, db } = build(ROW.refused);
        await expect((svc as any)[method](body())).rejects.toBeInstanceOf(ForbiddenException);
        expect(spNames(db)).not.toContain(sp);
    });

    it.each(edits)('%s refuses with 403 when there is no caller id, without a lookup', async (method) => {
        const { svc, db } = build(ROW.owner);
        await expect((svc as any)[method]({ nFSid: FACT })).rejects.toBeInstanceOf(ForbiddenException);
        expect(db.executeRef).not.toHaveBeenCalled();
    });

    it.each(edits)('%s answers 404 for a fact that does not exist', async (method, sp) => {
        const { svc, db } = build(ROW.missing);
        await expect((svc as any)[method](body())).rejects.toBeInstanceOf(NotFoundException);
        expect(spNames(db)).not.toContain(sp);
    });

    it.each(edits)('%s answers 500 when the permission lookup fails', async (method, sp) => {
        const { svc, db } = build(ROW.failed);
        await expect((svc as any)[method](body())).rejects.toBeInstanceOf(InternalServerErrorException);
        expect(spNames(db)).not.toContain(sp);
    });

    it.each(edits)('%s runs %s for the owner and for a share recipient with bCanEdit', async (method, sp) => {
        for (const perm of [ROW.owner, ROW.edit]) {
            const { svc, db } = build(perm);
            await (svc as any)[method](body({ jU: '[]' }));
            expect(spNames(db)[0]).toBe('fact_permissions');
            expect(spNames(db)).toContain(sp);
        }
    });

    it.each(edits)('the controller lets the gate status through for %s (%s, route %s)', async (_m, _sp, route) => {
        const { ctrl } = build(ROW.refused);
        const err = await (ctrl as any)[route](body()).then(() => null, (e: any) => e);
        expect(err).toBeInstanceOf(HttpException);
        expect(err.getStatus()).toBe(403);
    });

    it('the controller still answers a 200 failure body for an SP error on an allowed edit', async () => {
        const { ctrl } = build(ROW.owner);
        await expect(ctrl.quickfactupdate(body())).resolves.toEqual([{ msg: 1, value: 'Updated' }]);
        const { ctrl: ctrl2 } = build(ROW.owner, { fact_quick_update: { success: false, error: 'boom' } });
        await expect(ctrl2.quickfactupdate(body())).resolves.toMatchObject({ msg: -1 });
    });

    describe('factupdate sharing (et_fact_update replaces FMShared with jU)', () => {
        const NEWCOMER = '99999999-9999-4999-8999-999999999999';

        it('an editor without bCanReshare cannot change who the fact is shared with', async () => {
            const { svc, db } = build(ROW.edit);
            await svc.factUpdate(body({ jU: JSON.stringify([NEWCOMER]) }));
            const call = db.executeRef.mock.calls.find((c) => c[0] === 'fact_update');
            expect(JSON.parse(call[1].jU)).toEqual([SHARED_A, SHARED_B]);
            expect(db.executeRef).toHaveBeenCalledWith('fact_get_shared', { nFSid: FACT });
        });

        it('the owner (bCanReshare) still sets the share list', async () => {
            const { svc, db } = build(ROW.owner);
            await svc.factUpdate(body({ jU: JSON.stringify([NEWCOMER]) }));
            const call = db.executeRef.mock.calls.find((c) => c[0] === 'fact_update');
            expect(JSON.parse(call[1].jU)).toEqual([NEWCOMER]);
            expect(spNames(db)).not.toContain('fact_get_shared');
        });

        it('answers 500 and does not update when the current share list cannot be read', async () => {
            const { svc, db } = build(ROW.edit, { fact_get_shared: { success: false, error: 'db down' } });
            await expect(svc.factUpdate(body({ jU: '[]' }))).rejects.toBeInstanceOf(InternalServerErrorException);
            expect(spNames(db)).not.toContain('fact_update');
        });
    });
});
