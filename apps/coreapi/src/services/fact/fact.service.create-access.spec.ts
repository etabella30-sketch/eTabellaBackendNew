import { ForbiddenException, InternalServerErrorException, Logger } from '@nestjs/common';
import { OUTSIDE_CALLER_TEAMS_SQL } from '@app/permissions';
import { FactService } from './fact.service';
import { FactController } from '../../controllers/fact/fact.controller';
import { FACT_CREATE_ACCESS_SQL } from './fact-access';

const ME = '11111111-1111-4111-8111-111111111111';
const CASE = '22222222-2222-4222-8222-222222222222';
const DOC = '33333333-3333-4333-8333-333333333333';
const NEW_FACT = '44444444-4444-4444-8444-444444444444';
const OLD_QF = '55555555-5555-4555-8555-555555555555';
const MATE = '66666666-6666-4666-8666-666666666666';
const STRANGER = '77777777-7777-4777-8777-777777777777';

const INSERT_SPS = ['fact_insert', 'fact_insert_detail', 'fact_insert_links', 'fact_insert_issues', 'fact_insert_contact', 'fact_insert_task', 'fact_insert_team'];

/** The create-target row the shared rule reads (@app/permissions FACT_CREATE_TARGET_SQL). */
const allowed = { nCaseid: CASE, bCase: true, bMember: true, bDocInCase: true, bSessionInCase: true };
const notMember = { ...allowed, bMember: false };

/**
 * `access` answers FACT_CREATE_ACCESS_SQL (a rowQuery result, or a thrower); `outsiders` answers the team rule
 * (OUTSIDE_CALLER_TEAMS_SQL) with the recipients outside the caller's teams.
 */
function build(access: any = { success: true, data: [allowed] }, outsiders: string[] = []) {
    const calls: string[] = [];
    const db = {
        rowQuery: jest.fn(async (sql: string) => {
            if (sql === OUTSIDE_CALLER_TEAMS_SQL) {
                calls.push('team');
                return { success: true, data: outsiders.map((nUserid) => ({ nUserid })) };
            }
            calls.push('access');
            if (typeof access === 'function') return access();
            return access;
        }),
        executeRef: jest.fn(async (name: string) => {
            calls.push(name);
            if (name === 'fact_insert') return { success: true, data: [[{ msg: 1, nFSid: NEW_FACT, color: '#f00' }]] };
            if (INSERT_SPS.includes(name)) return { success: true, data: [[{ msg: 1, jNotify: [] }]] };
            throw new Error(`unexpected SP ${name}`);
        }),
    };
    const svc = new FactService(db as any, { sendNotification: jest.fn() } as any);
    return { svc, db, calls, ctrl: new FactController(svc) };
}

/** Each create route, a body the client may send, and the [case, caller, document, session] it is checked against. */
const routes = [
    ['insertfact', { nBDid: DOC, cFtype: 'F', jTasks: '[]', jUsers: '[]' }, [null, ME, DOC, null]],
    ['insertQuickfact', { nBDid: DOC, cFtype: 'QF' }, [null, ME, DOC, null]],
    ['insertfactV2', { nBDid: DOC, nCaseid: CASE, cFFrom: 'I', cFtype: 'F', jTasks: '[]', jUsers: '[]' }, [CASE, ME, DOC, null]],
    ['insertQuickfactV2', { nBDid: DOC, nCaseid: CASE, cFFrom: 'I', cFtype: 'QF' }, [CASE, ME, DOC, null]],
] as const;

const body = (base: object, over: Record<string, any> = {}) => ({ ...base, nMasterid: ME, ...over }) as any;

describe('coreapi fact/insertfact* need active case membership (TeamRelation cStatus A, or a platform admin) and the document in that case', () => {
    beforeEach(() => jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined));
    afterEach(() => jest.restoreAllMocks());

    it.each(routes)('%s: 403 and nothing written for a caller outside the case, or a document from another case', async (route, base, params) => {
        for (const row of [notMember, { ...allowed, bDocInCase: false }]) {
            const { ctrl, db } = build({ success: true, data: [row] });
            await expect((ctrl as any)[route](body(base))).rejects.toBeInstanceOf(ForbiddenException);
            expect(db.rowQuery).toHaveBeenCalledWith(FACT_CREATE_ACCESS_SQL, [...params]);
            expect(db.executeRef).not.toHaveBeenCalled();
        }
    });

    it.each(routes)('%s: 500 when the access lookup fails or throws, 403 when it answers no row; nothing written', async (route, base) => {
        for (const access of [{ success: false, error: 'db down' }, () => { throw new Error('boom'); }, { success: true, data: [] }]) {
            const { ctrl, db } = build(access);
            const pending = (ctrl as any)[route](body(base));
            if ((access as any).data) {
                await expect(pending).rejects.toBeInstanceOf(ForbiddenException); // no row: refused, not an error
            } else {
                await expect(pending).rejects.toBeInstanceOf(InternalServerErrorException);
            }
            expect(db.executeRef).not.toHaveBeenCalled();
        }
    });

    it.each(routes)('%s: 403 with no caller, without a lookup', async (route, base) => {
        const { ctrl, db } = build();
        await expect((ctrl as any)[route](body(base, { nMasterid: undefined }))).rejects.toBeInstanceOf(ForbiddenException);
        expect(db.rowQuery).not.toHaveBeenCalled();
        expect(db.executeRef).not.toHaveBeenCalled();
    });

    it.each(routes)('%s: a case member still creates the fact, checked before anything is written, on the realtime schema (7b, D8)', async (route, base) => {
        const { ctrl, calls, db } = build();
        await expect((ctrl as any)[route](body(base))).resolves.toEqual(expect.objectContaining({ msg: 1, nFSid: NEW_FACT }));
        expect(calls[0]).toBe('access');
        expect(calls[1]).toBe('fact_insert');
        expect(db.executeRef).toHaveBeenCalledWith('fact_insert', expect.objectContaining({ nCaseid: CASE }), 'realtime');
    });

    it('insertfact v1 with no document and no case has nothing to resolve the case from: 403, nothing written', async () => {
        const { ctrl, db } = build();
        await expect(ctrl.insertfact(body({ cFtype: 'F' }, { nBDid: null }))).rejects.toBeInstanceOf(ForbiddenException);
        await expect(ctrl.insertQuickfact(body({ cFtype: 'QF' }, { nBDid: null }))).rejects.toBeInstanceOf(ForbiddenException);
        expect(db.rowQuery).not.toHaveBeenCalled();
        expect(db.executeRef).not.toHaveBeenCalled();
    });

    it('insertfact v1 stores the case the rule derived from the document (public.et_fact_insert used to derive it itself)', async () => {
        const { ctrl, db } = build({ success: true, data: [{ ...allowed, nCaseid: CASE.toUpperCase() }] });
        await ctrl.insertfact(body(routes[0][1]));
        expect(db.executeRef).toHaveBeenCalledWith('fact_insert', expect.objectContaining({ nCaseid: CASE }), 'realtime');
    });

    it('the v2 routes check the named case even with no document (an RT fact), and refuse neither-case-nor-document', async () => {
        const rt = build();
        await expect(rt.ctrl.insertQuickfactV2(body({ nCaseid: CASE, cFFrom: 'RT', cFtype: 'QF' }, { nBDid: null }))).resolves.toEqual(expect.objectContaining({ msg: 1 }));
        expect(rt.db.rowQuery).toHaveBeenCalledWith(FACT_CREATE_ACCESS_SQL, [CASE, ME, null, null]);

        const none = build();
        await expect(none.ctrl.insertfactV2(body({ cFFrom: 'I', cFtype: 'F' }, { nBDid: null, nCaseid: null }))).rejects.toBeInstanceOf(ForbiddenException);
        expect(none.db.rowQuery).not.toHaveBeenCalled();
        expect(none.db.executeRef).not.toHaveBeenCalled();
    });

    it('converting a quick fact (nQFSid) goes through the same gate first', async () => {
        const { ctrl, db } = build({ success: true, data: [notMember] });
        await expect(ctrl.insertfact(body(routes[0][1], { nQFSid: OLD_QF }))).rejects.toBeInstanceOf(ForbiddenException);
        expect(db.executeRef).not.toHaveBeenCalled();
    });

    it('a stamped platform admin passes the membership test only (the Caller from the request, not a UserMaster read)', async () => {
        const { svc, db } = build({ success: true, data: [notMember] });
        await expect(svc.insertFactV2(body(routes[2][1]), { userId: ME, family: 'cloud-jwt', isPlatformAdmin: true, caseScope: 'membership' }))
            .resolves.toEqual(expect.objectContaining({ nFSid: NEW_FACT }));
        expect(db.executeRef).toHaveBeenCalledWith('fact_insert', expect.anything(), 'realtime');
    });

    describe('the share list (jUsers) obeys the team rule BEFORE the fact exists (7b item 4)', () => {
        it('insertfact v2: a recipient outside the caller teams answers the refusal row and writes nothing', async () => {
            const { ctrl, calls } = build(undefined, [STRANGER]);
            const res = await ctrl.insertfactV2(body(routes[2][1], { jUsers: JSON.stringify([{ nUserid: MATE, bCanEdit: true }, STRANGER]) }));
            expect(res).toEqual(expect.objectContaining({ msg: -1, error: 'cross_team_recipient' }));
            expect(calls).toEqual(['access', 'team']);
        });

        it('insertfact v1 and v2: same-team recipients, as ids or objects, are written in the one object shape', async () => {
            for (const route of ['insertfact', 'insertfactV2'] as const) {
                const { ctrl, db } = build();
                const base = route === 'insertfact' ? routes[0][1] : routes[2][1];
                await expect((ctrl as any)[route](body(base, { jUsers: JSON.stringify([MATE, { nUserid: ME, bCanEdit: true }]) }))).resolves.toEqual(expect.objectContaining({ msg: 1 }));
                const shareCall = db.executeRef.mock.calls.find((c) => c[0] === 'fact_insert_team') as any[];
                expect(shareCall[2]).toBe('realtime');
                expect(JSON.parse(shareCall[1].jUsers)).toEqual([
                    { nUserid: MATE, bCanEdit: false, bCanReshare: false, bCanComment: false },
                    { nUserid: ME, bCanEdit: true, bCanReshare: false, bCanComment: false },
                ]);
            }
        });

        it('a team lookup fault is the failure row, never a silent share', async () => {
            const { svc } = build();
            (svc as any).db.rowQuery = jest.fn(async (sql: string) => (sql === OUTSIDE_CALLER_TEAMS_SQL ? { success: false, error: 'down' } : { success: true, data: [allowed] }));
            const res = await svc.insertFactV2(body(routes[2][1], { jUsers: JSON.stringify([MATE]) }), null);
            expect(res).toEqual(expect.objectContaining({ msg: -1, error: 'team_scope_lookup_failed' }));
        });
    });

    it('the SQL is the shared create rule: the case resolved from $1 or the document, active membership, the document and a live session in it', () => {
        const sql = FACT_CREATE_ACCESS_SQL.replace(/\s+/g, ' ');
        expect(sql).toContain('COALESCE($1::uuid, ( SELECT s."nCaseid" FROM "BundleDetail" bd JOIN "SectionMaster" s ON s."nSectionid" = bd."nSectionid" WHERE bd."nBundledetailid" = $3::uuid');
        expect(sql).toContain('EXISTS (SELECT 1 FROM "CaseMaster" c WHERE c."nCaseid" = t."nCaseid")');
        expect(sql).toContain('$3::uuid IS NULL OR EXISTS');
        expect(sql).toContain('AND s."nCaseid" = t."nCaseid"');
        expect(sql).toContain(`tr."nCaseid" = t."nCaseid" AND tr."nUserid" = $2::uuid AND tr."cStatus" = 'A'`);
        expect(sql).not.toContain('"isAdmin"'); // the platform-admin exemption is the stamped Caller's, not a UserMaster read
        expect(sql.match(/"TeamRelation"/g)).toHaveLength(1); // no second, unfiltered membership test
    });
});
