import { ForbiddenException, InternalServerErrorException, Logger } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from '../../controllers/comments/comments.controller';

const ME = '11111111-1111-4111-8111-111111111111';
const OWNER = '22222222-2222-4222-8222-222222222222';
const OTHER = '33333333-3333-4333-8333-333333333333';
const FACT = '55555555-5555-4555-8555-555555555555';
const OTHER_FACT = '66666666-6666-4666-8666-666666666666';
const MY_COMMENT = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const THEIR_COMMENT = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const NEW_COMMENT = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

/** et_fact_permissions answers for (ME, FACT). */
const PERM = {
    owner: { success: true, data: [[{ nFSid: FACT, nUserid: ME, bCanView: true, bCanEdit: true }]] },
    viewer: { success: true, data: [[{ nFSid: FACT, nUserid: OWNER, bCanView: true, bCanEdit: null, bCanComment: null }]] },
    refused: { success: true, data: [[{ nFSid: FACT, nUserid: OWNER, bCanView: false, bCanEdit: null }]] },
    missing: { success: true, data: [[]] },
    failed: { success: false, error: 'db down' },
};

/** realtime."Comments" as et_comments_grid sees it (live rows only). */
const COMMENTS = [
    { nCid: MY_COMMENT, nFSid: FACT, nUserid: ME, cMsg: 'mine', cFname: 'Me' },
    { nCid: THEIR_COMMENT, nFSid: FACT, nUserid: OTHER, cMsg: 'theirs', cFname: 'Other' },
    { nCid: NEW_COMMENT, nFSid: FACT, nUserid: ME, cMsg: 'new', cFname: 'Me' },
];

function build(perm: any = PERM.owner, extra: Record<string, any> = {}) {
    const db = {
        executeRef: jest.fn(async (name: string, params: any) => {
            if (name in extra) return typeof extra[name] === 'function' ? extra[name](params) : extra[name];
            if (name === 'fact_permissions') return params.nFSid === FACT ? perm : PERM.missing;
            if (name === 'comments_grid') {
                const rows = COMMENTS.filter((c) => c.nFSid === params.nFSid && (!params.nCid || c.nCid === params.nCid));
                return { success: true, data: [rows] };
            }
            if (name === 'comments_users') return { success: true, data: [[{ nUserid: OTHER, cFname: 'Other' }]] };
            if (name === 'manage_comments') return { success: true, data: [[{ msg: 1, value: 'Done', nCid: params.nCid ?? NEW_COMMENT }]] };
            throw new Error(`unexpected SP ${name}`);
        }),
    };
    const utility = { emit: jest.fn() };
    const svc = new CommentsService(db as any, utility as any);
    return { svc, db, utility, ctrl: new CommentsController(svc) };
}

const spNames = (db: { executeRef: jest.Mock }) => db.executeRef.mock.calls.map((c) => c[0]);
const manage = (over: Record<string, any> = {}) => ({ cMsg: 'hello', nFSid: FACT, nMasterid: ME, ...over }) as any;

describe('coreapi comments read gate (et_fact_permissions bCanView)', () => {
    beforeEach(() => jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined));
    afterEach(() => jest.restoreAllMocks());

    it.each([
        ['getCommentsGrid', 'comments_grid'],
        ['getCommentsUsers', 'comments_users'],
    ])('%s answers [] (not a 403) to a caller who may not view the fact, without running %s', async (method, sp) => {
        const { svc, db } = build(PERM.refused);
        await expect((svc as any)[method]({ nFSid: FACT, nMasterid: ME })).resolves.toEqual([]);
        expect(db.executeRef).toHaveBeenCalledWith('fact_permissions', { nUserid: ME, nFSid: FACT });
        expect(spNames(db)).not.toContain(sp);
    });

    it.each([
        ['getCommentsGrid', 'comments_grid'],
        ['getCommentsUsers', 'comments_users'],
    ])('%s answers [] for a fact that does not exist or a request with no caller', async (method, sp) => {
        const { svc, db } = build(PERM.owner);
        await expect((svc as any)[method]({ nFSid: OTHER_FACT, nMasterid: ME })).resolves.toEqual([]);
        await expect((svc as any)[method]({ nFSid: FACT, nMasterid: undefined })).resolves.toEqual([]);
        expect(spNames(db)).not.toContain(sp);
    });

    it.each([
        ['getCommentsGrid', 'comments_grid'],
        ['getCommentsUsers', 'comments_users'],
    ])('%s answers 500 without running %s when the permission lookup fails', async (method, sp) => {
        const { svc, db } = build(PERM.failed);
        await expect((svc as any)[method]({ nFSid: FACT, nMasterid: ME })).rejects.toBeInstanceOf(InternalServerErrorException);
        expect(spNames(db)).not.toContain(sp);
    });

    it('the owner and a view-only share recipient still get the comments and the commenters', async () => {
        for (const perm of [PERM.owner, PERM.viewer]) {
            const { svc } = build(perm);
            await expect(svc.getCommentsGrid({ nFSid: FACT, nMasterid: ME } as any)).resolves.toEqual(COMMENTS);
            await expect(svc.getCommentsUsers({ nFSid: FACT, nMasterid: ME } as any)).resolves.toEqual([{ nUserid: OTHER, cFname: 'Other' }]);
        }
    });

    it('the controller routes pass the empty answer through', async () => {
        const { ctrl } = build(PERM.refused);
        await expect(ctrl.getCommentsGrid({ nFSid: FACT, nMasterid: ME } as any)).resolves.toEqual([]);
        await expect(ctrl.getCommentsUsers({ nFSid: FACT, nMasterid: ME } as any)).resolves.toEqual([]);
    });
});

describe('coreapi comments/add needs view access to the fact', () => {
    beforeEach(() => jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined));
    afterEach(() => jest.restoreAllMocks());

    it.each([
        ['not shared', PERM.refused],
        ['no such fact', PERM.missing],
    ])('403 and nothing written when the fact is %s', async (_label, perm) => {
        const { ctrl, db, utility } = build(perm);
        await expect(ctrl.addComment(manage())).rejects.toBeInstanceOf(ForbiddenException);
        expect(spNames(db)).not.toContain('manage_comments');
        expect(utility.emit).not.toHaveBeenCalled();
    });

    it('403 with no caller, without a lookup', async () => {
        const { ctrl, db } = build(PERM.owner);
        await expect(ctrl.addComment(manage({ nMasterid: undefined }))).rejects.toBeInstanceOf(ForbiddenException);
        expect(spNames(db)).not.toContain('manage_comments');
    });

    it('500 and nothing written when the permission lookup fails', async () => {
        const { ctrl, db } = build(PERM.failed);
        await expect(ctrl.addComment(manage())).rejects.toBeInstanceOf(InternalServerErrorException);
        expect(spNames(db)).not.toContain('manage_comments');
    });

    it.each([
        ['the owner', PERM.owner],
        ['a share recipient', PERM.viewer],
    ])('%s can still comment, and the new comment is still broadcast', async (_label, perm) => {
        const { ctrl, db, utility } = build(perm);
        await expect(ctrl.addComment(manage())).resolves.toEqual({ msg: 1, value: 'Done', nCid: NEW_COMMENT });
        expect(db.executeRef).toHaveBeenCalledWith('manage_comments', expect.objectContaining({ cPermission: 'N', nFSid: FACT, nMasterid: ME }), 'realtime');
        expect(utility.emit).toHaveBeenCalledWith(expect.objectContaining({ type: 'FACT-MESSAGE', nCid: NEW_COMMENT, permission: 'N' }), 'factsheet-comments');
    });
});

describe('coreapi comments/edit and comments/delete are for the comment author only', () => {
    beforeEach(() => jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined));
    afterEach(() => jest.restoreAllMocks());

    const routes = [
        ['editComment', 'E'],
        ['deleteComment', 'D'],
    ] as const;

    it.each(routes)('%s: 403 and nothing written for someone else\'s comment, even on a fact the caller owns', async (route) => {
        const { ctrl, db, utility } = build(PERM.owner);
        await expect((ctrl as any)[route](manage({ nCid: THEIR_COMMENT }))).rejects.toBeInstanceOf(ForbiddenException);
        expect(db.executeRef).toHaveBeenCalledWith('comments_grid', expect.objectContaining({ nFSid: FACT, nCid: THEIR_COMMENT }), 'realtime');
        expect(spNames(db)).not.toContain('manage_comments');
        expect(utility.emit).not.toHaveBeenCalled();
    });

    it.each(routes)('%s: 403 when the comment is not on the fact named (et_manage_comments checks newer comments on the body\'s nFSid)', async (route) => {
        const { ctrl, db } = build(PERM.owner);
        await expect((ctrl as any)[route](manage({ nCid: MY_COMMENT, nFSid: OTHER_FACT }))).rejects.toBeInstanceOf(ForbiddenException);
        expect(spNames(db)).not.toContain('manage_comments');
    });

    it.each(routes)('%s: 403 with no nCid, no nFSid or no caller, without a lookup', async (route) => {
        for (const over of [{ nCid: undefined }, { nCid: MY_COMMENT, nFSid: undefined }, { nCid: MY_COMMENT, nMasterid: undefined }]) {
            const { ctrl, db } = build(PERM.owner);
            await expect((ctrl as any)[route](manage(over))).rejects.toBeInstanceOf(ForbiddenException);
            expect(spNames(db)).toEqual([]);
        }
    });

    it.each(routes)('%s: 500 and nothing written when the owner lookup fails or throws', async (route) => {
        for (const grid of [{ success: false, error: 'db down' }, () => { throw new Error('boom'); }]) {
            const { ctrl, db } = build(PERM.owner, { comments_grid: grid });
            await expect((ctrl as any)[route](manage({ nCid: MY_COMMENT }))).rejects.toBeInstanceOf(InternalServerErrorException);
            expect(spNames(db)).not.toContain('manage_comments');
        }
    });

    it.each(routes)('%s: the author can still change their own comment (ids compared case-insensitively)', async (route, perm) => {
        const { ctrl, db, utility } = build(PERM.viewer);
        await expect((ctrl as any)[route](manage({ nCid: MY_COMMENT, nMasterid: ME.toUpperCase() }))).resolves.toEqual(expect.objectContaining({ msg: 1 }));
        expect(db.executeRef).toHaveBeenCalledWith('manage_comments', expect.objectContaining({ cPermission: perm, nCid: MY_COMMENT }), 'realtime');
        expect(utility.emit).toHaveBeenCalledWith(expect.objectContaining({ nCid: MY_COMMENT, permission: perm }), 'factsheet-comments');
    });
});
