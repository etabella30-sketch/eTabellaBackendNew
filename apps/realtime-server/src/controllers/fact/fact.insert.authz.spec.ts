import { INestApplication, Logger, MiddlewareConsumer, Module, NestModule, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import * as cookieParser from 'cookie-parser';
import * as jwt from 'jsonwebtoken';
import * as request from 'supertest';
import { DbService } from '@app/global/db/pg/db.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { HttpErrorFilter } from '@app/global/middleware/exception';
import { FactController } from './fact.controller';
import { FactService } from '../../services/fact/fact.service';
import { UtilityService } from '../../services/utility/utility.service';
import { RealtimeAuthInjectMiddleware } from '../../middleware/realtime-auth.middleware';
import { SESSION_ACCESS_SQL } from '../../events/realtime-socket-access';
import { FACT_CREATE_TARGET_SQL } from '../../services/fact/fact-create-gate';

// fact/insertfact and fact/insertquickfact through a real Nest HTTP stack: FactController and FactService
// as shipped, RealtimeAuthInjectMiddleware wired as TranscriptModule wires it, and main.ts's global
// ValidationPipe options, cookie parser and HttpErrorFilter. Only the database and Redis are stubs.

const SECRET = 'fact-insert-secret';
const ME = '11111111-1111-4111-8111-111111111111';
const VICTIM = '22222222-2222-4222-8222-222222222222';
const SES = '33333333-3333-4333-8333-333333333333';
const DOC = '44444444-4444-4444-8444-444444444444';
const NEW_FACT = '55555555-5555-4555-8555-555555555555';
const CASE = '66666666-6666-4666-8666-666666666666';
const ISSUE = '77777777-7777-4777-8777-777777777777';
const QFACT = '88888888-8888-4888-8888-888888888888';

/** What the stub database knows: who is on CASE's team, and whether the document / session is in CASE. */
const world = {
  members: new Set<string>([ME]),
  caseExists: true,
  docInCase: true,
  sessionInCase: true,
  sessionVisible: true,
  gateFails: false,
};

let session = { id: 'browser-1', a: false };
const rds = { getValue: jest.fn(async () => JSON.stringify(session)), deleteValue: jest.fn() };
const db = {
  executeRef: jest.fn(async (name: string, _params?: any) => {
    if (name === 'fact_insert') return { success: true, data: [[{ msg: 1, nFSid: NEW_FACT, color: 'ff0000' }]] };
    if (name === 'fact_insert_team') return { success: true, data: [[{ jNotify: [] }]] };
    return { success: true, data: [[]] };
  }),
  rowQuery: jest.fn(async (text: string, params: any[] = []) => {
    if (text === FACT_CREATE_TARGET_SQL) {
      if (world.gateFails) return { success: false, error: 'db down' };
      return {
        success: true,
        data: [{
          bCase: world.caseExists,
          bMember: world.members.has(params[1]),
          bDocInCase: params[2] === null || world.docInCase,
          bSessionInCase: params[3] === null || world.sessionInCase,
        }],
      };
    }
    if (text === SESSION_ACCESS_SQL) return { success: true, data: world.sessionVisible ? [{ '?column?': 1 }] : [] };
    return { success: true, data: [] }; // markAsTranscriptIfPublished's UPDATE
  }),
};

@Module({
  controllers: [FactController],
  providers: [
    FactService,
    { provide: DbService, useValue: db },
    { provide: UtilityService, useValue: { sendNotification: jest.fn() } },
    { provide: RedisDbService, useValue: rds },
    { provide: ConfigService, useValue: { get: (k: string) => (k === 'JWT_SECRET' ? SECRET : undefined) } },
  ],
})
class FactProbeModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RealtimeAuthInjectMiddleware).forRoutes(FactController);
  }
}

const token = () => jwt.sign({ userId: ME, broweserId: 'browser-1' }, SECRET);
const writes = () => db.executeRef.mock.calls.map((c) => c[0]);
const gateCalls = () => db.rowQuery.mock.calls.filter((c) => c[0] === FACT_CREATE_TARGET_SQL);

/** New frontend, document reader: PDF QFact (persistPdfFactHighlight). */
const readerPdfQuickFact = () => ({
  nCaseid: CASE, nColorid: ISSUE, jOT: '["quoted"]', jT: '[]', jIssues: `[["${ISSUE}",0,0]]`, jUsers: '[]',
  cFFrom: 'I', nBDid: DOC, jAn: '[]', nPage: 3, cFtype: 'QF', cIsNote: 'N', bIsHighlighted: false,
});
/** New frontend, realtime page: transcript QFact (nSesid + jCordinates). */
const realtimeQuickFact = () => ({
  nCaseid: CASE, cFFrom: 'RT', nSesid: SES, nPage: 2, nLine: 7, jOT: '["line"]', jT: '[]', jIssues: `[["${ISSUE}",0,0]]`,
  jUsers: '[]', jCordinates: [{ t: '10:00:00:00', p: 2, l: 7, text: 'line' }], nColorid: ISSUE, cFtype: 'QF', cIsNote: 'N',
  bIsHighlighted: false,
});
/** New frontend, realtime page: full transcript Fact. */
const realtimeFact = () => ({
  nCaseid: CASE, cFFrom: 'RT', nSesid: SES, nPage: 2, nLine: 7, jOT: '["line"]', jT: '["note"]', jIssues: `[["${ISSUE}",0,0]]`,
  jUsers: '[]', jCordinates: [{ t: '10:00:00:00', p: 2, l: 7 }], nColorid: ISSUE, cFtype: 'F', nFt: 0, nSt: 0,
  jFl: '[]', jContacts: '[]', jTasks: '[]', jDate: '{}',
});
/** New frontend, document reader: full PDF Fact. */
const readerPdfFact = () => ({
  nCaseid: CASE, nColorid: ISSUE, jOT: '["quoted"]', jT: '[]', jIssues: `[["${ISSUE}",0,0]]`, jUsers: '[]',
  cFFrom: 'I', nBDid: DOC, jAn: '[]', nPage: 3, cFtype: 'F', nFt: 0, nSt: 0, jFl: '[]', jContacts: '[]', jTasks: '[]', jDate: '{}',
});
/** Legacy RtFactService.submitQuickFact in PDF mode (cFFrom 'I', nBDid, jLinktype). */
const legacyPdfQuickFact = () => ({
  nColorid: ISSUE, jOT: '["quoted"]', jT: '["quoted"]', jIssues: `[["${ISSUE}",0,0]]`, cFtype: 'QF', cIsNote: 'N', cFFrom: 'I',
  nCaseid: CASE, bIsHighlighted: false, jUsers: '[]', nBDid: DOC, jAn: '"[]"', nPage: 1, jLinktype: '{}',
});

describe('fact/insertfact and fact/insertquickfact create gate (HTTP pipeline)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [FactProbeModule] }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new HttpErrorFilter());
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(() => {
    Object.assign(world, { caseExists: true, docInCase: true, sessionInCase: true, sessionVisible: true, gateFails: false });
    world.members = new Set([ME]);
    session = { id: 'browser-1', a: false };
    db.executeRef.mockClear();
    db.rowQuery.mockClear();
  });

  afterEach(() => jest.restoreAllMocks());

  const post = (path: string, body: object) =>
    request(app.getHttpServer()).post(`/fact/${path}`).set('Cookie', `access_token=${token()}`).send(body);

  describe('case members keep creating facts from every client', () => {
    it.each([
      ['insertquickfact', 'reader PDF QFact (cookie)', readerPdfQuickFact],
      ['insertquickfact', 'realtime transcript QFact', realtimeQuickFact],
      ['insertfact', 'realtime transcript Fact', realtimeFact],
      ['insertfact', 'reader PDF Fact', readerPdfFact],
    ])('%s: %s', async (route, _label, payload) => {
      const res = await post(route, payload());
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ msg: 1, nFSid: NEW_FACT });
      expect(writes()[0]).toBe('fact_insert');
      const factInsertBody: any = db.executeRef.mock.calls[0][1];
      expect(factInsertBody.nMasterid).toBe(ME);
      expect(gateCalls()).toHaveLength(1);
      const sent: any = payload();
      expect(gateCalls()[0][1]).toEqual([CASE, ME, sent.nBDid ?? null, sent.nSesid ?? null]);
      if (sent.nSesid) expect(db.rowQuery).toHaveBeenCalledWith(SESSION_ACCESS_SQL, [SES, ME]);
    });

    // The Full Fact dialog (realtime page and document reader) always sends the Review Status as
    // nRv. While InsertFact did not declare it the global pipe (forbidNonWhitelisted) answered 400
    // "property nRv should not exist": no Fact could be created, nor a QFact converted (nQFSid).
    it.each([
      ['realtime Fact with a Review Status', () => ({ ...realtimeFact(), nRv: 0 })],
      ['reader PDF Fact with a Review Status', () => ({ ...readerPdfFact(), nRv: 3 })],
      ['a QFact converted to a Fact', () => ({ ...realtimeFact(), nRv: 0, nQFSid: QFACT })],
    ])('insertfact: %s', async (_label, payload) => {
      const res = await post('insertfact', payload());
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ msg: 1, nFSid: NEW_FACT });
      const detail = db.executeRef.mock.calls.find(call => call[0] === 'fact_insert_detail');
      expect((detail?.[1] as any).nRv).toBe((payload() as any).nRv);
    });

    it('legacy RtFactService PDF quick fact with an Authorization header', async () => {
      const res = await request(app.getHttpServer())
        .post('/fact/insertquickfact').set('Authorization', `Bearer ${token()}`).send(legacyPdfQuickFact());
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ msg: 1, nFSid: NEW_FACT });
      expect(writes()).toEqual(['fact_insert', 'fact_insert_detail', 'fact_insert_issues', 'fact_insert_contact', 'fact_insert_team']);
    });

    it('a global admin who is not on the case team', async () => {
      world.members = new Set();
      session = { id: 'browser-1', a: true };
      const res = await post('insertfact', realtimeFact());
      expect(res.status).toBe(201);
      expect(writes()[0]).toBe('fact_insert');
    });
  });

  describe('refusals are a 403 before anything is written', () => {
    it.each([
      ['insertquickfact', readerPdfQuickFact],
      ['insertquickfact', realtimeQuickFact],
      ['insertfact', realtimeFact],
      ['insertfact', readerPdfFact],
    ])('%s from a caller who is not on the case team', async (route, payload) => {
      world.members = new Set([VICTIM]);
      const res = await post(route, payload());
      expect(res.status).toBe(403);
      expect(res.body.statusCode).toBe(403);
      expect(db.executeRef).not.toHaveBeenCalled();
      expect(db.rowQuery.mock.calls.map((c) => c[0])).toEqual([FACT_CREATE_TARGET_SQL]);
    });

    it('checks the token user, not an nMasterid the client sent', async () => {
      world.members = new Set([VICTIM]);
      const res = await post('insertfact', { ...readerPdfFact(), nMasterid: VICTIM });
      expect(res.status).toBe(403);
      expect(gateCalls()[0][1][1]).toBe(ME);
      expect(db.executeRef).not.toHaveBeenCalled();
    });

    it('a document of another case', async () => {
      world.docInCase = false;
      for (const [route, payload] of [['insertquickfact', readerPdfQuickFact], ['insertfact', readerPdfFact]] as const) {
        const res = await post(route, payload());
        expect(res.status).toBe(403);
      }
      expect(db.executeRef).not.toHaveBeenCalled();
    });

    it('a session of another case (or a deleted one), even for a global admin', async () => {
      world.sessionInCase = false;
      session = { id: 'browser-1', a: true };
      for (const [route, payload] of [['insertquickfact', realtimeQuickFact], ['insertfact', realtimeFact]] as const) {
        const res = await post(route, payload());
        expect(res.status).toBe(403);
      }
      expect(db.executeRef).not.toHaveBeenCalled();
    });

    it('a session the caller cannot see', async () => {
      world.sessionVisible = false;
      const res = await post('insertquickfact', realtimeQuickFact());
      expect(res.status).toBe(403);
      expect(db.executeRef).not.toHaveBeenCalled();
    });

    it('a case that does not exist, or no nCaseid at all', async () => {
      world.caseExists = false;
      expect((await post('insertquickfact', readerPdfQuickFact())).status).toBe(403);
      world.caseExists = true;
      const { nCaseid, ...noCase } = readerPdfQuickFact();
      expect((await post('insertquickfact', noCase)).status).toBe(403);
      expect((await post('insertfact', { ...readerPdfFact(), nCaseid: '0' })).status).toBe(403);
      expect(db.executeRef).not.toHaveBeenCalled();
    });

    it('answers 500, and writes nothing, when the access lookup fails', async () => {
      jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
      world.gateFails = true;
      const res = await post('insertfact', realtimeFact());
      expect(res.status).toBe(500);
      expect(db.executeRef).not.toHaveBeenCalled();
    });
  });
});
