import { ForbiddenException, InternalServerErrorException, Logger } from '@nestjs/common';
import { FactService } from './fact.service';
import { FactController } from '../../controllers/fact/fact.controller';
import { FACT_CREATE_ACCESS_SQL } from './fact-access';

const ME = '11111111-1111-4111-8111-111111111111';
const CASE = '22222222-2222-4222-8222-222222222222';
const DOC = '33333333-3333-4333-8333-333333333333';
const NEW_FACT = '44444444-4444-4444-8444-444444444444';
const OLD_QF = '55555555-5555-4555-8555-555555555555';

const INSERT_SPS = ['fact_insert', 'fact_insert_detail', 'fact_insert_links', 'fact_insert_issues', 'fact_insert_contact', 'fact_insert_task', 'fact_insert_team'];

function build(access: any = { success: true, data: [{ bAllowed: true }] }) {
    const calls: string[] = [];
    const db = {
        rowQuery: jest.fn(async () => {
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

/** Each create route, a body the client may send, and the (caller, case, document) it is checked against. */
const routes = [
    ['insertfact', { nBDid: DOC, cFtype: 'F', jTasks: '[]', jUsers: '[]' }, [ME, null, DOC]],
    ['insertQuickfact', { nBDid: DOC, cFtype: 'QF' }, [ME, null, DOC]],
    ['insertfactV2', { nBDid: DOC, nCaseid: CASE, cFFrom: 'I', cFtype: 'F', jTasks: '[]', jUsers: '[]' }, [ME, CASE, DOC]],
    ['insertQuickfactV2', { nBDid: DOC, nCaseid: CASE, cFFrom: 'I', cFtype: 'QF' }, [ME, CASE, DOC]],
] as const;

const body = (base: object, over: Record<string, any> = {}) => ({ ...base, nMasterid: ME, ...over }) as any;

describe('coreapi fact/insertfact* need active case membership (TeamRelation cStatus A, or global admin) and the document in that case', () => {
    beforeEach(() => jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined));
    afterEach(() => jest.restoreAllMocks());

    it.each(routes)('%s: 403 and nothing written for a caller outside the case, or a document from another case', async (route, base, params) => {
        const { ctrl, db } = build({ success: true, data: [{ bAllowed: false }] });
        await expect((ctrl as any)[route](body(base))).rejects.toBeInstanceOf(ForbiddenException);
        expect(db.rowQuery).toHaveBeenCalledWith(FACT_CREATE_ACCESS_SQL, [...params]);
        expect(db.executeRef).not.toHaveBeenCalled();
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

    it.each(routes)('%s: a case member still creates the fact, checked before anything is written', async (route, base) => {
        const { ctrl, calls } = build();
        await expect((ctrl as any)[route](body(base))).resolves.toEqual(expect.objectContaining({ msg: 1, nFSid: NEW_FACT }));
        expect(calls[0]).toBe('access');
        expect(calls[1]).toBe('fact_insert');
    });

    it('insertfact v1 with no document has no case to check: 403, nothing written', async () => {
        const { ctrl, db } = build();
        await expect(ctrl.insertfact(body({ cFtype: 'F' }, { nBDid: null }))).rejects.toBeInstanceOf(ForbiddenException);
        await expect(ctrl.insertQuickfact(body({ cFtype: 'QF' }, { nBDid: null }))).rejects.toBeInstanceOf(ForbiddenException);
        expect(db.rowQuery).not.toHaveBeenCalled();
        expect(db.executeRef).not.toHaveBeenCalled();
    });

    it('the v2 routes check the named case even with no document (an RT fact), and refuse neither-case-nor-document', async () => {
        const rt = build();
        await expect(rt.ctrl.insertQuickfactV2(body({ nCaseid: CASE, cFFrom: 'RT', cFtype: 'QF' }, { nBDid: null }))).resolves.toEqual(expect.objectContaining({ msg: 1 }));
        expect(rt.db.rowQuery).toHaveBeenCalledWith(FACT_CREATE_ACCESS_SQL, [ME, CASE, null]);

        const none = build();
        await expect(none.ctrl.insertfactV2(body({ cFFrom: 'I', cFtype: 'F' }, { nBDid: null, nCaseid: null }))).rejects.toBeInstanceOf(ForbiddenException);
        expect(none.db.rowQuery).not.toHaveBeenCalled();
        expect(none.db.executeRef).not.toHaveBeenCalled();
    });

    it('converting a quick fact (nQFSid) goes through the same gate first', async () => {
        const { ctrl, db } = build({ success: true, data: [{ bAllowed: false }] });
        await expect(ctrl.insertfact(body(routes[0][1], { nQFSid: OLD_QF }))).rejects.toBeInstanceOf(ForbiddenException);
        expect(db.executeRef).not.toHaveBeenCalled();
    });

    it('the SQL is the membership rule: admin or TeamRelation in the case, the case exists, the document is in it', () => {
        const sql = FACT_CREATE_ACCESS_SQL.replace(/\s+/g, ' ');
        expect(sql).toContain('COALESCE($2::uuid, ( SELECT s."nCaseid" FROM "BundleDetail" bd JOIN "SectionMaster" s ON s."nSectionid" = bd."nSectionid" WHERE bd."nBundledetailid" = $3::uuid');
        expect(sql).toContain('EXISTS (SELECT 1 FROM "CaseMaster" c WHERE c."nCaseid" = t."nCaseid")');
        expect(sql).toContain('$3::uuid IS NULL OR EXISTS');
        expect(sql).toContain('AND s."nCaseid" = t."nCaseid"');
        expect(sql).toContain('u."nUserid" = $1::uuid AND u."isAdmin" = true');
        expect(sql).toContain('tr."nCaseid" = t."nCaseid" AND tr."nUserid" = $1::uuid');
    });

    it('counts only an active team row (cStatus A), as realtime-server and the task gates do: a user switched off on the case is not a member', () => {
        // permission/usermanage (et_pm_user_statusmanage) sets TeamRelation.cStatus per user and case.
        const sql = FACT_CREATE_ACCESS_SQL.replace(/\s+/g, ' ');
        expect(sql).toContain(`WHERE tr."nCaseid" = t."nCaseid" AND tr."nUserid" = $1::uuid AND tr."cStatus" = 'A' )`);
        expect(sql.match(/"TeamRelation"/g)).toHaveLength(1); // no second, unfiltered membership test
    });
});
