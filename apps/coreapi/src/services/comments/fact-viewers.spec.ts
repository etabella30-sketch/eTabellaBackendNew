import { Logger } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { FACT_VIEWERS_SQL, factCommentRecipients } from './fact-viewers';

const FACT = '5d0c5b2e-2b9e-4c7e-8f0a-1a2b3c4d5e6f';
const OWNER = '043c3b64-0e14-494d-af52-eeff4cc407f5';
const KHENT = '9d1f5f0a-52c1-4c3c-9d0e-6f6f0a1b2c3d';
const INDER = '7a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d';

function dbWithViewers(ids: string[], ok = true) {
    return {
        rowQuery: jest.fn(async () => ok ? { success: true, data: ids.map(nUserid => ({ nUserid })) } : { success: false, error: 'boom' }),
    };
}

describe('factCommentRecipients', () => {
    beforeEach(() => jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined));
    afterEach(() => jest.restoreAllMocks());

    it("lists the fact's viewers once each, the author among them", async () => {
        const db = dbWithViewers([OWNER, KHENT, KHENT.toUpperCase(), INDER]);
        await expect(factCommentRecipients(db, FACT)).resolves.toEqual([OWNER, KHENT, INDER]);
        expect(db.rowQuery).toHaveBeenCalledWith(FACT_VIEWERS_SQL, [FACT]);
    });

    it('answers nobody, and never throws, for a non-UUID id or a failed lookup', async () => {
        const db = dbWithViewers([OWNER]);
        await expect(factCommentRecipients(db, "'; drop table")).resolves.toEqual([]);
        expect(db.rowQuery).not.toHaveBeenCalled();
        await expect(factCommentRecipients(dbWithViewers([], false), FACT)).resolves.toEqual([]);
        await expect(factCommentRecipients({ rowQuery: jest.fn(async () => { throw new Error('down'); }) }, FACT)).resolves.toEqual([]);
    });
});

describe('CommentsService.manageComment broadcast', () => {
    beforeEach(() => jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined));
    afterEach(() => jest.restoreAllMocks());

    function build(viewers: string[]) {
        const db = {
            executeRef: jest.fn(async (name: string, params: any) => {
                if (name === 'fact_permissions') return { success: true, data: [[{ nFSid: FACT, nUserid: params.nUserid, bCanView: true }]] };
                if (name === 'manage_comments') return { success: true, data: [[{ msg: 1, value: 'Done', nCid: 'c-new' }]] };
                if (name === 'comments_grid') return { success: true, data: [[{ nCid: 'c-new', nUserid: KHENT, cFname: 'Khent', cMsg: 'hello', msg: 1, value: 'x' }]] };
                throw new Error(`unexpected SP ${name}`);
            }),
            rowQuery: jest.fn(async () => ({ success: true, data: viewers.map(nUserid => ({ nUserid })) })),
        };
        const utility = { emit: jest.fn() };
        return { svc: new CommentsService(db as any, utility as any), utility };
    }

    // A viewer with no comment thread open never heard of a new comment: the
    // message only went to the fact's socket room. It now names the viewers,
    // for socket-app to deliver to each one's own room.
    it('names the fact id and its viewers on the message', async () => {
        const { svc, utility } = build([OWNER, KHENT, INDER]);
        await svc.manageComment({ cMsg: 'hello', nFSid: FACT, nMasterid: KHENT, cPermission: 'N' } as any);

        expect(utility.emit).toHaveBeenCalledTimes(1);
        const [message, topic] = utility.emit.mock.calls[0];
        expect(topic).toBe('factsheet-comments');
        expect(message).toEqual(expect.objectContaining({ type: 'FACT-MESSAGE', nFSid: FACT, nCid: 'c-new', permission: 'N', recipients: [OWNER, KHENT, INDER] }));
        expect(message).not.toHaveProperty('msg');
        expect(message).not.toHaveProperty('value');
    });

    it('still broadcasts to the fact room alone when the viewer lookup fails', async () => {
        const { svc, utility } = build([]);
        await svc.manageComment({ cMsg: 'hello', nFSid: FACT, nMasterid: KHENT, cPermission: 'N' } as any);
        expect(utility.emit).toHaveBeenCalledWith(expect.objectContaining({ nFSid: FACT, recipients: [] }), 'factsheet-comments');
    });
});
