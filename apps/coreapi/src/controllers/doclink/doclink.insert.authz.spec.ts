import { INestApplication, Logger, MiddlewareConsumer, Module, NestModule, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import * as cookieParser from 'cookie-parser';
import * as jwt from 'jsonwebtoken';
import * as request from 'supertest';
import { DbService } from '@app/global/db/pg/db.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';
import { HttpErrorFilter } from '@app/global/middleware/exception';
import { EventLogService } from '@app/global/utility/event-log/event-log.service';
import { DoclinkController } from './doclink.controller';
import { DoclinkService } from '../../services/doclink/doclink.service';
import { UtilityService } from '../../services/utility/utility.service';
import { FACT_CREATE_ACCESS_SQL } from '../../services/fact/fact-access';
import { DOCLINK_SESSION_ACCESS_SQL, DOCLINK_TARGETS_IN_CASE_SQL } from '../../services/doclink/doclink-create-gate';

// doclink/insertdoc through a real Nest HTTP stack: DoclinkController and DoclinkService as shipped,
// JwtMiddleware wired as IndividualModule wires it (forRoutes(DoclinkController); it writes the token
// user over body.nMasterid), and main.ts's global ValidationPipe options, cookie parser and
// HttpErrorFilter. Only the database, Redis and config are stubs. The model is realtime-server's
// doclink.insert.authz.spec.ts: coreapi runs the same realtime.et_doc_insert.

const SECRET = 'coreapi-doclink-insert-secret';
const ME = '11111111-1111-4111-8111-111111111111';
const VICTIM = '22222222-2222-4222-8222-222222222222';
const SES = '33333333-3333-4333-8333-333333333333';
const DOC = '44444444-4444-4444-8444-444444444444';
const NEW_DOCLINK = '55555555-5555-4555-8555-555555555555';
const CASE = '66666666-6666-4666-8666-666666666666';
const TARGET = '77777777-7777-4777-8777-777777777777';
const TEAMMATE = '88888888-8888-4888-8888-888888888888';
const FOREIGN_DOC = '99999999-9999-4999-8999-999999999999';

/** What the stub database knows: CASE's team and admins, whether the source document is in CASE, and CASE's documents. */
const world = {
    members: new Set<string>([ME]),
    admins: new Set<string>(),
    caseExists: true,
    docInCase: true,
    accessFails: false,
    targetsFail: false,
    caseDocs: new Set<string>([DOC, TARGET]),
};

const rds = { getValue: jest.fn(async () => JSON.stringify({ id: 'browser-1', a: false })), deleteValue: jest.fn() };
const db = {
    executeRef: jest.fn(async (name: string, _params?: any) => {
        if (name === 'doc_insert') return { success: true, data: [[{ msg: 1, nDocid: NEW_DOCLINK, jNotify: [] }]] };
        return { success: true, data: [[]] };
    }),
    rowQuery: jest.fn(async (text: string, params: any[] = []) => {
        if (text === FACT_CREATE_ACCESS_SQL) {
            if (world.accessFails) return { success: false, error: 'db down' };
            const [caller, nCaseid, nBDid] = params;
            const allowed = world.caseExists && nCaseid === CASE && (nBDid === null || world.docInCase)
                && (world.admins.has(caller) || world.members.has(caller));
            return { success: true, data: [{ bAllowed: allowed }] };
        }
        if (text === DOCLINK_TARGETS_IN_CASE_SQL) {
            if (world.targetsFail) return { success: false, error: 'db down' };
            const ids: string[] = params[0] === CASE ? params[1] : [];
            return { success: true, data: ids.filter((id) => world.caseDocs.has(id)).map((id) => ({ nBundledetailid: id.toUpperCase() })) };
        }
        throw new Error(`unexpected query ${text.slice(0, 40)}`);
    }),
};

@Module({
    controllers: [DoclinkController],
    providers: [
        DoclinkService,
        { provide: DbService, useValue: db },
        { provide: UtilityService, useValue: { sendNotification: jest.fn() } },
        { provide: RedisDbService, useValue: rds },
        { provide: ConfigService, useValue: { get: (k: string) => (k === 'JWT_SECRET' ? SECRET : undefined) } },
        { provide: EventLogService, useValue: { insertLog: jest.fn(async () => undefined) } }, // docdetail's LogInterceptor
    ],
})
class DoclinkProbeModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(JwtMiddleware).forRoutes(DoclinkController);
    }
}

const token = () => jwt.sign({ userId: ME, broweserId: 'browser-1' }, SECRET);
const gateCalls = () => db.rowQuery.mock.calls.filter((c) => c[0] === FACT_CREATE_ACCESS_SQL);
const targetCalls = () => db.rowQuery.mock.calls.filter((c) => c[0] === DOCLINK_TARGETS_IN_CASE_SQL);
const linkingTo = (...ids: string[]) => JSON.stringify(ids.map((id) => [id, { type: 'F', start: 1, end: 9, pages: [] }, [], []]));
const sharedWith = () => JSON.stringify([{ nUserid: TEAMMATE, bCanEdit: true, bCanCopy: true, bCanReshare: true, bCanComment: true }]);

/** A PDF-source DocLink in the shape coreapi's InsertDoc accepts (the fields the legacy viewer's docform must send). */
const pdfDocLink = () => ({
    nBundledetailid: DOC, nCaseid: CASE, cType: 'S', cDFrom: 'I', nPage: 3, nLine: 0,
    jDl: linkingTo(TARGET), jT: '["note"]', jOT: '["quoted"]', jUsers: sharedWith(),
    jAn: [{ uuid: 'a1', type: 'highlight', page: 3, rects: [{ x: 1, y: 2, width: 3, height: 4 }] }],
});
/**
 * What the legacy viewer's docform (pdf/components/doc/docform, DocService.saveDoc) sends today:
 * nBDid and jLT, which InsertDoc does not declare, and jAn as a string. main.ts's forbidNonWhitelisted
 * ValidationPipe refuses it before any handler runs, gate or no gate.
 */
const legacyDocformDocLink = () => ({
    nBDid: DOC, jLT: JSON.stringify({ type: 'H', start: 1, end: 26, pages: [3] }),
    jAn: JSON.stringify([{ uuid: 'a2', type: 'strikeout1', page: 3, rects: [{ x: 1, y: 2, width: 3, height: 4 }] }]),
    jDl: linkingTo(TARGET), jOT: '["quoted"]', jUsers: JSON.stringify([TEAMMATE]), cType: 'S',
});

describe('coreapi doclink/insertdoc create gate (HTTP pipeline)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        jest.spyOn(console, 'log').mockImplementation(() => undefined); // JwtMiddleware's request log
        const moduleRef = await Test.createTestingModule({ imports: [DoclinkProbeModule] }).compile();
        app = moduleRef.createNestApplication({ logger: false });
        app.use(cookieParser());
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
        app.useGlobalFilters(new HttpErrorFilter());
        await app.init();
    });

    afterAll(async () => {
        await app?.close();
        jest.restoreAllMocks();
    });

    beforeEach(() => {
        Object.assign(world, { caseExists: true, docInCase: true, accessFails: false, targetsFail: false });
        world.members = new Set([ME]);
        world.admins = new Set();
        world.caseDocs = new Set([DOC, TARGET]);
        db.executeRef.mockClear();
        db.rowQuery.mockClear();
        jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    });

    const post = (body: object) =>
        request(app.getHttpServer()).post('/doclink/insertdoc').set('Cookie', `access_token=${token()}`).send(body);

    describe('case members keep creating DocLinks', () => {
        it('a member (cookie): checked as the token user, then et_doc_insert', async () => {
            const res = await post(pdfDocLink());
            expect(res.status).toBe(201);
            expect(res.body).toEqual({ msg: 1, value: 'Doclink inserted successfully', nDocid: NEW_DOCLINK });
            expect(db.executeRef.mock.calls.map((c) => c[0])).toEqual(['doc_insert']);
            expect((db.executeRef.mock.calls[0][1] as any).nMasterid).toBe(ME);
            expect(gateCalls()).toEqual([[FACT_CREATE_ACCESS_SQL, [ME, CASE, DOC]]]);
            expect(targetCalls()).toEqual([[DOCLINK_TARGETS_IN_CASE_SQL, [CASE, [TARGET]]]]);
        });

        it('a member with an Authorization header', async () => {
            const res = await request(app.getHttpServer())
                .post('/doclink/insertdoc').set('Authorization', `Bearer ${token()}`).send(pdfDocLink());
            expect(res.status).toBe(201);
            expect(res.body).toMatchObject({ msg: 1, nDocid: NEW_DOCLINK });
            expect((db.executeRef.mock.calls[0][1] as any).nMasterid).toBe(ME);
        });

        it('a global admin who is not on the case team', async () => {
            world.members = new Set();
            world.admins = new Set([ME]);
            const res = await post(pdfDocLink());
            expect(res.status).toBe(201);
            expect(db.executeRef.mock.calls.map((c) => c[0])).toEqual(['doc_insert']);
        });
    });

    describe('refusals are a 403 before anything is written', () => {
        it('a caller who is not on the case team', async () => {
            world.members = new Set([VICTIM]);
            const res = await post(pdfDocLink());
            expect(res.status).toBe(403);
            expect(res.body.statusCode).toBe(403);
            expect(res.body.detailedError).toContain('You are not permitted to add document links to this case');
            expect(db.executeRef).not.toHaveBeenCalled();
            expect(db.rowQuery.mock.calls.map((c) => c[0])).toEqual([FACT_CREATE_ACCESS_SQL]);
        });

        it('checks the token user, not an nMasterid the client sent', async () => {
            world.members = new Set([VICTIM]);
            const res = await post({ ...pdfDocLink(), nMasterid: VICTIM });
            expect(res.status).toBe(403);
            expect(gateCalls()[0][1][0]).toBe(ME);
            expect(db.executeRef).not.toHaveBeenCalled();
        });

        it('a source document of another case', async () => {
            world.docInCase = false;
            expect((await post(pdfDocLink())).status).toBe(403);
            expect(db.executeRef).not.toHaveBeenCalled();
        });

        it('a case that does not exist, no nCaseid at all, or the "0" the legacy client sends for none', async () => {
            world.caseExists = false;
            expect((await post(pdfDocLink())).status).toBe(403);
            world.caseExists = true;
            const { nCaseid, ...noCase } = pdfDocLink();
            expect((await post(noCase)).status).toBe(403);
            expect((await post({ ...pdfDocLink(), nCaseid: '0' })).status).toBe(403);
            expect(gateCalls()).toHaveLength(1); // only the first reached a lookup
            expect(db.executeRef).not.toHaveBeenCalled();
        });

        it('a target document of another case, for a member and for a global admin', async () => {
            const res = await post({ ...pdfDocLink(), jDl: linkingTo(TARGET, FOREIGN_DOC) });
            expect(res.status).toBe(403);
            expect(res.body.detailedError).toContain('You are not permitted to add document links to this case');
            expect(targetCalls()).toEqual([[DOCLINK_TARGETS_IN_CASE_SQL, [CASE, [TARGET, FOREIGN_DOC]]]]);

            world.members = new Set();
            world.admins = new Set([ME]);
            expect((await post({ ...pdfDocLink(), jDl: linkingTo(FOREIGN_DOC) })).status).toBe(403);
            expect(db.executeRef).not.toHaveBeenCalled();
        });

        it('a target that is not a UUID, or a jDl that is not a JSON list, before any lookup', async () => {
            for (const jDl of [JSON.stringify([['folder:abc', {}, [], []]]), JSON.stringify([[7, {}, [], []]]), '{"a":1}', 'not json']) {
                expect((await post({ ...pdfDocLink(), jDl })).status).toBe(403);
            }
            expect(db.rowQuery).not.toHaveBeenCalled();
            expect(db.executeRef).not.toHaveBeenCalled();
        });

        it('500, and nothing written, when the membership or the target lookup fails', async () => {
            world.accessFails = true;
            expect((await post(pdfDocLink())).status).toBe(500);
            world.accessFails = false;
            world.targetsFail = true;
            expect((await post(pdfDocLink())).status).toBe(500);
            expect(db.executeRef).not.toHaveBeenCalled();
        });

        it('without a token: JwtMiddleware\'s 403, before the DTO and the gate', async () => {
            const res = await request(app.getHttpServer()).post('/doclink/insertdoc').send(pdfDocLink());
            expect(res.status).toBe(403);
            expect(db.rowQuery).not.toHaveBeenCalled();
            expect(db.executeRef).not.toHaveBeenCalled();
        });
    });

    describe('what the DTO refuses before the gate (documents today\'s behaviour, nothing written either way)', () => {
        it('a transcript source: InsertDoc has no nSesid, so the ValidationPipe answers 400', async () => {
            const res = await post({ ...pdfDocLink(), nBundledetailid: '', cDFrom: 'RT', nPage: 2, nLine: 7, nSesid: SES, jAn: [] });
            expect(res.status).toBe(400);
            expect(res.body.detailedError).toContain('nSesid');
            expect(db.rowQuery).not.toHaveBeenCalledWith(DOCLINK_SESSION_ACCESS_SQL, expect.anything());
            expect(db.rowQuery).not.toHaveBeenCalled();
            expect(db.executeRef).not.toHaveBeenCalled();
        });

        it('the legacy viewer docform payload (nBDid, jLT, jAn as a string): 400 from the ValidationPipe', async () => {
            const res = await post(legacyDocformDocLink());
            expect(res.status).toBe(400);
            expect(res.body.detailedError).toContain('nBDid');
            expect(db.rowQuery).not.toHaveBeenCalled();
            expect(db.executeRef).not.toHaveBeenCalled();
        });
    });
});
