import { ForbiddenException, InternalServerErrorException, Logger } from '@nestjs/common';
import { Caller, callerOf } from '@app/api-kernel';
import { PgRowQuery, PgSpExecutor } from '@app/platform-cloud';
import { DocLinkController, DocLinkService } from '@app/rt-features/doclink';
import { DoclinkService } from './doclink.service';
import { DOCLINK_DELETE_ACCESS_SQL, DOCLINK_VIEW_SQL, parseDocIds, viewableDocLinkIds } from './doclink-access';

/** The Caller JwtMiddleware stamps: the request's, else the token user it wrote into nMasterid (Phase 8: the shared controller reads it). */
const callerFor = (req: unknown, body: { nMasterid?: string }): Caller => callerOf(req) ?? ({ userId: body?.nMasterid as string, family: 'cloud-jwt', isPlatformAdmin: false, caseScope: 'membership' });
/** The old controller's surface over the shared DocLinkController (the shared service for the read, this app's for the writes). */
function routesOver(svc: DoclinkService, db: any) {
    const shared = new DocLinkController(new DocLinkService(new PgSpExecutor(db), new PgRowQuery(db), svc));
    return {
        insertDoc: (body: any, req?: unknown) => shared.insert(callerFor(req, body), body),
        factdelete: (body: any) => shared.remove(callerFor(undefined, body), body),
        docDetail: (q: any) => shared.detail(callerFor(undefined, q), q),
    };
}
import { DOCLINK_VIEW_SQL as REALTIME_DOCLINK_VIEW_SQL } from '../../../../realtime-server/src/services/doclink/doclink-view-gate';

const ME = '11111111-1111-4111-8111-111111111111';
const MINE = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const SHARED = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const OTHERS = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const MY_LINK = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const OTHER_LINK = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

const DETAIL = [[{ nDocid: MINE }], [{ nDocid: MINE, nDMLids: MY_LINK }], [{ docids: [MINE], nUserid: ME }]];

/**
 * A DB where ME owns MINE (whose link is MY_LINK), was shared SHARED, and has nothing to do with
 * OTHERS (whose link is OTHER_LINK).
 */
function build(opts: { viewFails?: boolean; deleteFails?: boolean } = {}) {
    const db = {
        rowQuery: jest.fn(async (text: string, params: any[]) => {
            if (text === DOCLINK_VIEW_SQL) {
                if (opts.viewFails) return { success: false, error: 'db down' };
                const [ids, caller] = params;
                const visible = caller === ME ? ids.filter((id: string) => id === MINE || id === SHARED) : [];
                return { success: true, data: visible.map((nDocid: string) => ({ nDocid })) };
            }
            if (text === DOCLINK_DELETE_ACCESS_SQL) {
                if (opts.deleteFails) return { success: false, error: 'db down' };
                const [nDocid, caller, nDMLids] = params;
                const allowed = nDocid === MINE && caller === ME && (nDMLids === null || nDMLids === MY_LINK);
                return { success: true, data: [{ bAllowed: allowed }] };
            }
            throw new Error('unexpected query');
        }),
        executeRef: jest.fn(async (name: string) => {
            if (name === 'doc_detail') return { success: true, data: DETAIL };
            if (name === 'doc_delete') return { success: true, data: [[{ msg: 1, value: 'Deleted' }]] };
            throw new Error(`unexpected SP ${name}`);
        }),
    };
    const svc = new DoclinkService(db as any, { sendNotification: jest.fn() } as any);
    return { db, svc, ctrl: routesOver(svc, db) };
}

const detailArgs = (db: { executeRef: jest.Mock }) => db.executeRef.mock.calls.filter((c) => c[0] === 'doc_detail').map((c) => c[1]);

describe('coreapi doclink/docdetail: only DocLinks the caller owns or was shared', () => {
    beforeEach(() => jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined));
    afterEach(() => jest.restoreAllMocks());

    it('someone else\'s unshared DocLink: the SP\'s empty cursors, and et_doc_detail never runs', async () => {
        const { ctrl, db } = build();
        await expect(ctrl.docDetail({ jDocids: JSON.stringify([OTHERS]), nMasterid: ME })).resolves.toEqual([[], [], []]);
        expect(db.rowQuery).toHaveBeenCalledWith(DOCLINK_VIEW_SQL, [[OTHERS], ME]);
        expect(db.executeRef).not.toHaveBeenCalled();
    });

    it('a mixed list runs et_doc_detail with the caller\'s own and shared DocLinks only', async () => {
        const { ctrl, db } = build();
        await expect(ctrl.docDetail({ jDocids: JSON.stringify([OTHERS, MINE, SHARED.toUpperCase()]), nMasterid: ME })).resolves.toEqual(DETAIL);
        // Phase 8: the shared DocLinkService also sets nUserid to the caller (the SP reads nMasterid).
        expect(detailArgs(db)).toEqual([expect.objectContaining({ jDocids: JSON.stringify([MINE, SHARED]), nMasterid: ME, ref: 3 })]);
    });

    it('the legacy compare view\'s single-id call still works for the owner', async () => {
        const { ctrl, db } = build();
        await expect(ctrl.docDetail({ jDocids: JSON.stringify([MINE]), nMasterid: ME })).resolves.toEqual(DETAIL);
        expect(detailArgs(db)[0].jDocids).toBe(JSON.stringify([MINE]));
    });

    it('a single JSON string is accepted, as et_doc_detail accepts it', async () => {
        const { ctrl, db } = build();
        await expect(ctrl.docDetail({ jDocids: JSON.stringify(SHARED), nMasterid: ME })).resolves.toEqual(DETAIL);
        expect(detailArgs(db)[0].jDocids).toBe(JSON.stringify([SHARED]));
    });

    it('no caller, or no id that could match: empty cursors without a lookup', async () => {
        for (const query of [{ jDocids: JSON.stringify([MINE]), nMasterid: undefined }, { jDocids: '["x"]', nMasterid: ME }, { jDocids: '[]', nMasterid: ME }]) {
            const { ctrl, db } = build();
            await expect(ctrl.docDetail(query as any)).resolves.toEqual([[], [], []]);
            expect(db.rowQuery).not.toHaveBeenCalled();
            expect(db.executeRef).not.toHaveBeenCalled();
        }
    });

    it('a jDocids et_doc_detail could not read, or a failed lookup, gets the route\'s failure shape', async () => {
        for (const jDocids of ['not json', '["x", 5]', '{"a":1}']) {
            const bad = build();
            await expect(bad.ctrl.docDetail({ jDocids, nMasterid: ME })).resolves.toEqual({ msg: -1, value: 'Fetch failed' });
            expect(bad.db.executeRef).not.toHaveBeenCalled();
        }

        const failed = build({ viewFails: true });
        await expect(failed.ctrl.docDetail({ jDocids: JSON.stringify([MINE]), nMasterid: ME })).resolves.toEqual({ msg: -1, value: 'Fetch failed' });
        expect(failed.db.executeRef).not.toHaveBeenCalled();
    });

    it('the rule is realtime-server\'s, word for word', () => {
        expect(DOCLINK_VIEW_SQL).toBe(REALTIME_DOCLINK_VIEW_SQL);
    });

    it('parseDocIds / viewableDocLinkIds edge cases', async () => {
        expect(parseDocIds(JSON.stringify([MINE, OTHERS]))).toEqual([MINE, OTHERS]);
        expect(parseDocIds(JSON.stringify(MINE))).toEqual([MINE]);
        expect(parseDocIds('{"a":1}')).toBeNull();
        expect(parseDocIds(undefined)).toBeNull();
        const db = { rowQuery: jest.fn(async () => ({ success: true, data: [{ nDocid: MINE.toUpperCase() }] })) };
        await expect(viewableDocLinkIds(db as any, ME, [MINE, MINE, 'nope'])).resolves.toEqual([MINE]);
        expect(db.rowQuery).toHaveBeenCalledWith(DOCLINK_VIEW_SQL, [[MINE], ME]);
        await expect(viewableDocLinkIds({ rowQuery: jest.fn(async () => { throw new Error('boom'); }) } as any, ME, [MINE])).resolves.toBeNull();
    });
});

describe('coreapi doclink/docdelete: owner only, and the link must belong to that DocLink', () => {
    beforeEach(() => jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined));
    afterEach(() => jest.restoreAllMocks());

    it('the reported hole: an owner cannot remove a target (DMLinks row) of someone else\'s DocLink', async () => {
        const { ctrl, db } = build();
        await expect(ctrl.factdelete({ nDocid: MINE, nDMLids: OTHER_LINK, nMasterid: ME })).rejects.toBeInstanceOf(ForbiddenException);
        expect(db.rowQuery).toHaveBeenCalledWith(DOCLINK_DELETE_ACCESS_SQL, [MINE, ME, OTHER_LINK]);
        expect(db.executeRef).not.toHaveBeenCalled();
    });

    it.each([
        ['a DocLink shared with the caller', SHARED, MY_LINK],
        ['someone else\'s DocLink', OTHERS, OTHER_LINK],
    ])('403 for %s, nothing deleted', async (_l, nDocid, nDMLids) => {
        const { ctrl, db } = build();
        await expect(ctrl.factdelete({ nDocid, nDMLids, nMasterid: ME })).rejects.toBeInstanceOf(ForbiddenException);
        expect(db.executeRef).not.toHaveBeenCalled();
    });

    it('403 without a lookup for a missing caller or ids that are not UUIDs', async () => {
        for (const body of [{ nDocid: MINE, nDMLids: MY_LINK }, { nDocid: null, nDMLids: MY_LINK, nMasterid: ME }, { nDocid: MINE, nDMLids: 'x', nMasterid: ME }]) {
            const { ctrl, db } = build();
            await expect(ctrl.factdelete(body as any)).rejects.toBeInstanceOf(ForbiddenException);
            expect(db.rowQuery).not.toHaveBeenCalled();
            expect(db.executeRef).not.toHaveBeenCalled();
        }
    });

    it('500 when the lookup fails; the controller does not swallow it into a success-looking body', async () => {
        const { ctrl, db } = build({ deleteFails: true });
        await expect(ctrl.factdelete({ nDocid: MINE, nDMLids: MY_LINK, nMasterid: ME })).rejects.toBeInstanceOf(InternalServerErrorException);
        expect(db.executeRef).not.toHaveBeenCalled();
    });

    it.each([
        ['one of its own links', MY_LINK],
        ['no link id (et_doc_delete then only removes the DocLink if it has no links left)', null],
    ])('the owner can delete with %s', async (_l, nDMLids) => {
        const { ctrl, db } = build();
        const body = { nDocid: MINE, nDMLids, nMasterid: ME };
        await expect(ctrl.factdelete(body as any)).resolves.toEqual([{ msg: 1, value: 'Deleted' }]);
        expect(db.executeRef).toHaveBeenCalledWith('doc_delete', body);
    });

    it('the delete check is parametrised and ties the link to the DocLink', () => {
        expect(DOCLINK_DELETE_ACCESS_SQL).toContain('l."nDMLids" = $3::uuid AND l."nDocid" = d."nDocid"');
        expect(DOCLINK_DELETE_ACCESS_SQL).toContain('d."nUserid" = $2::uuid');
        expect(DOCLINK_DELETE_ACCESS_SQL).not.toMatch(/\$\{/);
    });
});
