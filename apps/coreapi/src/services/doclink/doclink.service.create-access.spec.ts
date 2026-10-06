import { ForbiddenException, InternalServerErrorException, Logger } from '@nestjs/common';
import { Caller, callerOf } from '@app/api-kernel';
import { PgRowQuery, PgSpExecutor } from '@app/platform-cloud';
import { DocLinkController, DocLinkService } from '@app/rt-features/doclink';
import { DoclinkService } from './doclink.service';
import { FACT_CREATE_ACCESS_SQL } from '../fact/fact-access';

/** The Caller JwtMiddleware stamps: the request's, else the token user it wrote into nMasterid (Phase 8: the shared controller reads it). */
const callerFor = (req: unknown, body: { nMasterid?: string }): Caller => callerOf(req) ?? ({ userId: body?.nMasterid as string, family: 'cloud-jwt', isPlatformAdmin: false, caseScope: 'membership' });
/** The old controller's surface over the shared DocLinkController (this app's DoclinkService bound as the writes). */
function routesOver(svc: DoclinkService, db: any) {
    const shared = new DocLinkController(new DocLinkService(new PgSpExecutor(db), new PgRowQuery(db), svc));
    return { insertDoc: (body: any, req?: unknown) => shared.insert(callerFor(req, body), body) };
}
import { DOCLINK_SESSION_ACCESS_SQL, DOCLINK_TARGETS_IN_CASE_SQL, docLinkTargetIds } from './doclink-create-gate';
import { DOCLINK_TARGETS_IN_CASE_SQL as REALTIME_DOCLINK_TARGETS_IN_CASE_SQL } from '../../../../realtime-server/src/services/doclink/doclink-create-gate';
import { SESSION_ACCESS_SQL as REALTIME_SESSION_ACCESS_SQL } from '../../../../realtime-server/src/events/realtime-socket-access';

// coreapi doclink/insertdoc runs the same realtime.et_doc_insert as realtime-server's route, which
// stores the client's nCaseid / nBundledetailid / nSesid and writes one DMLinks row per jDl target as
// given. The gate is realtime-server's assertCanCreateDocLink rule for rule (its doclink.insert.authz
// spec is the model for these cases), on coreapi's own lookups: FACT_CREATE_ACCESS_SQL (fact-access.ts)
// for the case, the caller and the source document, then the session, then the targets.

const ME = '11111111-1111-4111-8111-111111111111';
const VICTIM = '22222222-2222-4222-8222-222222222222';
const SES = '33333333-3333-4333-8333-333333333333';
const DOC = '44444444-4444-4444-8444-444444444444';
const NEW_DOCLINK = '55555555-5555-4555-8555-555555555555';
const CASE = '66666666-6666-4666-8666-666666666666';
const TARGET = '77777777-7777-4777-8777-777777777777';
const TEAMMATE = '88888888-8888-4888-8888-888888888888';
const FOREIGN_DOC = '99999999-9999-4999-8999-999999999999';

const REFUSAL = { msg: -1, value: 'You are not permitted to add document links to this case' };

/** What the stub database knows: CASE's team and admins, whether the source document / session is in CASE, and CASE's documents. */
const world = {
    members: new Set<string>([ME]),
    admins: new Set<string>(),
    caseExists: true,
    docInCase: true,
    sessionInCase: true,
    sessionVisible: true,
    accessFails: false,
    sessionFails: false,
    targetsFail: false,
    caseDocs: new Set<string>([DOC, TARGET]),
};

function build() {
    const calls: string[] = [];
    const db = {
        rowQuery: jest.fn(async (text: string, params: any[]) => {
            if (text === FACT_CREATE_ACCESS_SQL) {
                calls.push('access');
                if (world.accessFails) return { success: false, error: 'db down' };
                // 7b: the shared create rule's row ([case, caller, doc, session]); the platform-admin exemption is the Caller's.
                const [nCaseid, caller, nBDid] = params;
                return { success: true, data: [{ nCaseid: CASE, bCase: world.caseExists && nCaseid === CASE, bMember: world.members.has(caller), bDocInCase: nBDid === null || world.docInCase, bSessionInCase: true }] };
            }
            if (text === DOCLINK_SESSION_ACCESS_SQL) {
                calls.push('session');
                if (world.sessionFails) return { success: false, error: 'db down' };
                const [nSesid, nCaseid, caller] = params;
                return {
                    success: true,
                    data: [{
                        bSessionInCase: world.sessionInCase && nSesid === SES && nCaseid === CASE,
                        bSessionVisible: world.admins.has(caller) || world.sessionVisible,
                    }],
                };
            }
            if (text === DOCLINK_TARGETS_IN_CASE_SQL) {
                calls.push('targets');
                if (world.targetsFail) return { success: false, error: 'db down' };
                const [nCaseid, ids] = params;
                const found: string[] = nCaseid === CASE ? ids.filter((id: string) => world.caseDocs.has(id)) : [];
                return { success: true, data: found.map((id) => ({ nBundledetailid: id.toUpperCase() })) };
            }
            throw new Error('unexpected query');
        }),
        executeRef: jest.fn(async (name: string) => {
            calls.push(name);
            if (name === 'doc_insert') return { success: true, data: [[{ msg: 1, nDocid: NEW_DOCLINK, jNotify: [] }]] };
            throw new Error(`unexpected SP ${name}`);
        }),
    };
    const svc = new DoclinkService(db as any, { sendNotification: jest.fn() } as any);
    return { db, calls, ctrl: routesOver(svc, db) };
}

const destinations = () => JSON.stringify([[TARGET, { type: 'F', start: 1, end: 9, pages: [] }, [], []]]);
const linkingTo = (...ids: string[]) => JSON.stringify(ids.map((id) => [id, { type: 'F', start: 1, end: 9, pages: [] }, [], []]));
const sharedWith = () => JSON.stringify([{ nUserid: TEAMMATE, bCanEdit: true, bCanCopy: true, bCanReshare: true, bCanComment: true }]);

/** A PDF-source DocLink as the service receives it: coreapi's InsertDoc after JwtMiddleware wrote nMasterid. */
const pdfDocLink = () => ({
    nBundledetailid: DOC, nCaseid: CASE, nMasterid: ME, cType: 'S', cDFrom: 'I', nPage: 3, nLine: 0,
    jDl: destinations(), jT: '["note"]', jOT: '["quoted"]', jUsers: sharedWith(),
    jAn: [{ uuid: 'a1', type: 'highlight', page: 3, rects: [{ x: 1, y: 2, width: 3, height: 4 }] }],
}) as any;
/**
 * A transcript-source DocLink, the shape realtime-server's clients send (IsItUUID turns the empty
 * nBundledetailid into null). coreapi's InsertDoc has no nSesid today, so this only reaches the service
 * once the DTO gains one; the HTTP spec pins the 400 the ValidationPipe gives it until then.
 */
const transcriptDocLink = () => ({
    nBundledetailid: null, nCaseid: CASE, nMasterid: ME, cType: 'S', cDFrom: 'RT', nPage: 2, nLine: 7,
    jDl: destinations(), jT: '[]', jOT: '["line"]', jUsers: '[]', jAn: [], nSesid: SES,
}) as any;

const payloads = [
    ['a PDF source', pdfDocLink],
    ['a transcript source', transcriptDocLink],
] as const;

const INSERTED = { msg: 1, value: 'Doclink inserted successfully', nDocid: NEW_DOCLINK };
/** A request JwtMiddleware stamped for a platform admin (the create rule's admin exemption reads the Caller, 7b). */
const adminReq = () => ({ etCaller: { userId: ME, family: 'cloud-jwt', isPlatformAdmin: true, caseScope: 'membership' } }) as any;

async function refusal(pending: Promise<any>): Promise<any> {
    const error = await pending.then(() => null, (e) => e);
    expect(error).toBeInstanceOf(ForbiddenException);
    expect(error.getResponse()).toEqual(REFUSAL);
    return error;
}

describe('coreapi doclink/insertdoc create gate: active case member or global admin, source and targets in that case', () => {
    beforeEach(() => {
        jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
        Object.assign(world, { caseExists: true, docInCase: true, sessionInCase: true, sessionVisible: true, accessFails: false, sessionFails: false, targetsFail: false });
        world.members = new Set([ME]);
        world.admins = new Set();
        world.caseDocs = new Set([DOC, TARGET]);
    });
    afterEach(() => jest.restoreAllMocks());

    describe('case members keep creating DocLinks', () => {
        it.each(payloads)('%s: every check runs, in order, before et_doc_insert, and the body goes to the SP unchanged', async (_label, payload) => {
            const { ctrl, db, calls } = build();
            const body = payload();
            await expect(ctrl.insertDoc(body)).resolves.toEqual(INSERTED);
            expect(calls).toEqual(['access', ...(body.nSesid ? ['session'] : []), 'targets', 'doc_insert']);
            expect(db.rowQuery).toHaveBeenCalledWith(FACT_CREATE_ACCESS_SQL, [CASE, ME, body.nBundledetailid ?? null, null]);
            if (body.nSesid) expect(db.rowQuery).toHaveBeenCalledWith(DOCLINK_SESSION_ACCESS_SQL, [SES, CASE, ME]);
            expect(db.rowQuery).toHaveBeenCalledWith(DOCLINK_TARGETS_IN_CASE_SQL, [CASE, [TARGET]]);
            expect(db.executeRef).toHaveBeenCalledWith('doc_insert', body, 'realtime');
        });

        it('a global admin who is not on the case team', async () => {
            world.members = new Set();
            world.admins = new Set([ME]);
            const { ctrl, calls } = build();
            await expect(ctrl.insertDoc(transcriptDocLink(), adminReq())).resolves.toEqual(INSERTED);
            expect(calls).toEqual(['access', 'session', 'targets', 'doc_insert']);
        });

        it('no target at all: no target lookup, and the insert goes ahead', async () => {
            const { ctrl, calls } = build();
            await expect(ctrl.insertDoc({ ...pdfDocLink(), jDl: '[]' })).resolves.toEqual(INSERTED);
            expect(calls).toEqual(['access', 'doc_insert']);
        });

        it('repeated, upper-case and empty targets: one lookup of the distinct ids', async () => {
            const { ctrl, db, calls } = build();
            await expect(ctrl.insertDoc({ ...pdfDocLink(), jDl: linkingTo(TARGET, TARGET.toUpperCase(), '') })).resolves.toEqual(INSERTED);
            expect(db.rowQuery).toHaveBeenCalledWith(DOCLINK_TARGETS_IN_CASE_SQL, [CASE, [TARGET]]);
            expect(calls).toEqual(['access', 'targets', 'doc_insert']);
        });
    });

    describe('refusals are a 403 before anything is written', () => {
        it.each(payloads)('%s from a caller who is not on the case team (or switched off on it)', async (_label, payload) => {
            world.members = new Set([VICTIM]);
            const { ctrl, db, calls } = build();
            await refusal(ctrl.insertDoc(payload()));
            expect(db.rowQuery).toHaveBeenCalledWith(FACT_CREATE_ACCESS_SQL, [CASE, ME, payload().nBundledetailid ?? null, null]);
            expect(calls).toEqual(['access']);
            expect(db.executeRef).not.toHaveBeenCalled();
        });

        it('a source document of another case', async () => {
            world.docInCase = false;
            const { ctrl, db } = build();
            await refusal(ctrl.insertDoc(pdfDocLink()));
            expect(db.executeRef).not.toHaveBeenCalled();
        });

        it('a session of another case (or a deleted one), even for a global admin', async () => {
            world.sessionInCase = false;
            world.members = new Set();
            world.admins = new Set([ME]);
            const { ctrl, db, calls } = build();
            await refusal(ctrl.insertDoc(transcriptDocLink(), adminReq()));
            expect(calls).toEqual(['access', 'session']);
            expect(db.executeRef).not.toHaveBeenCalled();
        });

        it('a session the caller cannot see', async () => {
            world.sessionVisible = false;
            const { ctrl, db } = build();
            await refusal(ctrl.insertDoc(transcriptDocLink()));
            expect(db.executeRef).not.toHaveBeenCalled();
        });

        it('a case that does not exist', async () => {
            world.caseExists = false;
            const { ctrl, db } = build();
            await refusal(ctrl.insertDoc(pdfDocLink()));
            expect(db.executeRef).not.toHaveBeenCalled();
        });

        it('no nCaseid (the SP would store a DocLink with no case), no caller, or an id that is not a UUID: 403 without a lookup', async () => {
            const bodies = [
                { ...pdfDocLink(), nCaseid: null }, // IsItUUID turns '', '0', 'null' into null
                { ...pdfDocLink(), nCaseid: undefined },
                { ...pdfDocLink(), nCaseid: 'not-a-uuid' },
                { ...pdfDocLink(), nMasterid: undefined },
                { ...pdfDocLink(), nBundledetailid: 'folder:abc' },
                { ...transcriptDocLink(), nSesid: '7' },
            ];
            for (const body of bodies) {
                const { ctrl, db } = build();
                await refusal(ctrl.insertDoc(body));
                expect(db.rowQuery).not.toHaveBeenCalled();
                expect(db.executeRef).not.toHaveBeenCalled();
            }
        });

        it('500, and nothing written, when the membership lookup fails or throws', async () => {
            world.accessFails = true;
            const failed = build();
            await expect(failed.ctrl.insertDoc(pdfDocLink())).rejects.toBeInstanceOf(InternalServerErrorException);
            expect(failed.db.executeRef).not.toHaveBeenCalled();

            world.accessFails = false;
            const thrown = build();
            thrown.db.rowQuery.mockImplementationOnce(async () => { throw new Error('boom'); });
            await expect(thrown.ctrl.insertDoc(pdfDocLink())).rejects.toBeInstanceOf(InternalServerErrorException);
            expect(thrown.db.executeRef).not.toHaveBeenCalled();
        });

        it('500, and nothing written, when the session lookup fails', async () => {
            world.sessionFails = true;
            const { ctrl, db } = build();
            await expect(ctrl.insertDoc(transcriptDocLink())).rejects.toBeInstanceOf(InternalServerErrorException);
            expect(db.executeRef).not.toHaveBeenCalled();
        });

        describe('link targets (jDl) outside the case', () => {
            it.each(payloads)('%s: a target document of another case, next to one of this case', async (_label, payload) => {
                const { ctrl, db } = build();
                await refusal(ctrl.insertDoc({ ...payload(), jDl: linkingTo(TARGET, FOREIGN_DOC) }));
                expect(db.rowQuery).toHaveBeenCalledWith(DOCLINK_TARGETS_IN_CASE_SQL, [CASE, [TARGET, FOREIGN_DOC]]);
                expect(db.executeRef).not.toHaveBeenCalled();
            });

            it('even for a global admin', async () => {
                world.members = new Set();
                world.admins = new Set([ME]);
                const { ctrl, db } = build();
                await refusal(ctrl.insertDoc({ ...pdfDocLink(), jDl: linkingTo(FOREIGN_DOC) }));
                expect(db.executeRef).not.toHaveBeenCalled();
            });

            it('a target that is not a UUID, or a jDl that is not a JSON list, is refused before any lookup', async () => {
                for (const jDl of [JSON.stringify([['folder:abc', {}, [], []]]), JSON.stringify([[7, {}, [], []]]), '{"a":1}', 'not json', undefined]) {
                    const { ctrl, db } = build();
                    await refusal(ctrl.insertDoc({ ...pdfDocLink(), jDl }));
                    expect(db.rowQuery).not.toHaveBeenCalled();
                    expect(db.executeRef).not.toHaveBeenCalled();
                }
            });

            it('500, and nothing written, when the target lookup fails', async () => {
                world.targetsFail = true;
                const { ctrl, db } = build();
                await expect(ctrl.insertDoc(pdfDocLink())).rejects.toBeInstanceOf(InternalServerErrorException);
                expect(db.executeRef).not.toHaveBeenCalled();
            });
        });
    });

    describe('the rules are realtime-server\'s', () => {
        it('the target check is its DOCLINK_TARGETS_IN_CASE_SQL, word for word', () => {
            expect(DOCLINK_TARGETS_IN_CASE_SQL).toBe(REALTIME_DOCLINK_TARGETS_IN_CASE_SQL);
        });

        it('the session visibility clause is its SESSION_ACCESS_SQL membership clause, with the caller as $3', () => {
            const from = REALTIME_SESSION_ACCESS_SQL.indexOf('AND (EXISTS');
            const to = REALTIME_SESSION_ACCESS_SQL.lastIndexOf('))') + 2;
            expect(from).toBeGreaterThan(0);
            const clause = REALTIME_SESSION_ACCESS_SQL.slice(from, to).replace(/\$2/g, () => '$3');
            expect(clause).toContain('"RSessionDetail"');
            expect(clause).toContain('"TeamRelation"');
            expect(DOCLINK_SESSION_ACCESS_SQL).toContain(clause);
            expect(DOCLINK_SESSION_ACCESS_SQL).toContain('r."dDelDt" IS NULL) AS "bSessionInCase"');
            expect(DOCLINK_SESSION_ACCESS_SQL).toContain('u."isAdmin" = true');
        });

        it('the membership rule is the fact create rule: active TeamRelation or global admin, the case exists, the document in it', () => {
            expect(FACT_CREATE_ACCESS_SQL).toContain(`tr."cStatus" = 'A'`);
            expect(FACT_CREATE_ACCESS_SQL).not.toContain('"isAdmin"'); // 7b: the platform-admin exemption is the stamped Caller's, not a UserMaster read
            expect(FACT_CREATE_ACCESS_SQL).toContain('"CaseMaster"');
            for (const sql of [DOCLINK_TARGETS_IN_CASE_SQL, DOCLINK_SESSION_ACCESS_SQL, FACT_CREATE_ACCESS_SQL]) {
                expect(sql).not.toMatch(/\$\{/); // parametrised, nothing interpolated
            }
        });

        it('docLinkTargetIds reads jDl as et_doc_insert does', () => {
            expect(docLinkTargetIds(linkingTo(TARGET, TARGET.toUpperCase(), '', FOREIGN_DOC))).toEqual([TARGET, FOREIGN_DOC]);
            expect(docLinkTargetIds(JSON.stringify([[null, {}, [], []], 'not-a-list']))).toEqual([]);
            expect(docLinkTargetIds('[]')).toEqual([]);
            for (const bad of [JSON.stringify([['x', {}, [], []]]), JSON.stringify([[1]]), '{"a":1}', '"x"', 'nope', undefined, null, 5]) {
                expect(docLinkTargetIds(bad)).toBeNull();
            }
        });
    });
});
