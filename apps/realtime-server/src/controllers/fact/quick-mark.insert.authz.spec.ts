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
import { IssueController } from '../issue/issue.controller';
import { FactService } from '../../services/fact/fact.service';
import { IssueService } from '../../services/issue/issue.service';
import { ExportService } from '../../services/export/export.service';
import { UtilityService } from '../../services/utility/utility.service';
import { RealtimeAuthInjectMiddleware, RealtimeAuthMiddleware } from '../../middleware/realtime-auth.middleware';
import { SESSION_ACCESS_SQL } from '../../events/realtime-socket-access';
import { QUICK_MARK_SESSION_SQL } from '../../services/session/quick-mark-gate';

// Quick mark inserts, fact/insertHighlights (realtime.et_qmark_handler) and issue/insertHighlights
// (public.et_realtime_handle_rhighlights), through a real Nest HTTP stack: the controllers and services as
// shipped, each with the auth middleware realtime-server wires on it (RealtimeAuthInjectMiddleware on
// FactController via TranscriptModule, RealtimeAuthMiddleware on IssueController), and main.ts's global
// ValidationPipe options, cookie parser and HttpErrorFilter. Only the database and Redis are stubs.
// Both SPs store the client's nCaseid / nSessionid as given.

const SECRET = 'quick-mark-secret';
const ME = '11111111-1111-4111-8111-111111111111';
const VICTIM = '22222222-2222-4222-8222-222222222222';
const SES = '33333333-3333-4333-8333-333333333333';
const NEW_MARK = '55555555-5555-4555-8555-555555555555';
const CASE = '66666666-6666-4666-8666-666666666666';
const OTHER_CASE = '77777777-7777-4777-8777-777777777777';

/** What the stub database knows: whether SES is a live session of CASE, and whether the caller may see it. */
const world = { sessionInCase: true, sessionVisible: true, lookupFails: false };

let session = { id: 'browser-1', a: false };
const rds = { getValue: jest.fn(async () => JSON.stringify(session)), deleteValue: jest.fn() };
const db = {
  executeRef: jest.fn(async (_name: string, _params?: any, _schema?: string) =>
    ({ success: true, data: [[{ msg: 1, message: 'Inserted', nHid: NEW_MARK, pageData: [] }]] })),
  rowQuery: jest.fn(async (text: string, params: any[] = []) => {
    if (text === QUICK_MARK_SESSION_SQL) {
      if (world.lookupFails) return { success: false, error: 'db down' };
      const hit = world.sessionInCase && params[0] === SES && params[1] === CASE;
      return { success: true, data: hit ? [{ '?column?': 1 }] : [] };
    }
    if (text === SESSION_ACCESS_SQL) return { success: true, data: world.sessionVisible ? [{ '?column?': 1 }] : [] };
    return { success: true, data: [] };
  }),
};

@Module({
  controllers: [FactController, IssueController],
  providers: [
    FactService,
    IssueService,
    { provide: DbService, useValue: db },
    { provide: UtilityService, useValue: { sendNotification: jest.fn() } },
    { provide: ExportService, useValue: {} },
    { provide: RedisDbService, useValue: rds },
    { provide: ConfigService, useValue: { get: (k: string) => (k === 'JWT_SECRET' ? SECRET : undefined) } },
  ],
})
class QuickMarkProbeModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RealtimeAuthInjectMiddleware).forRoutes(FactController);
    consumer.apply(RealtimeAuthMiddleware).forRoutes(IssueController);
  }
}

const token = () => jwt.sign({ userId: ME, broweserId: 'browser-1' }, SECRET);
const writes = () => db.executeRef.mock.calls.map((c) => c[0]);

/** New frontend, realtime page (insertQuickMark): live draft quick mark. */
const realtimePageMark = () => ({
  nCaseid: CASE, nSessionid: SES, nUserid: ME, cNote: 'line text', cPageno: '2', cLineno: '7', cTime: '10:00:00:00',
  cTranscript: 'N', oP: 2, oL: 7, identity: '603973172365200',
});
/** Legacy (and venue) rt feed-line highlightLine: same shape, transcript flag from the session. */
const legacyFeedLineMark = () => ({
  nCaseid: CASE, nSessionid: SES, nUserid: ME, cNote: 'line text', cPageno: '4', cLineno: '12', cTime: '10:01:00:00',
  cTranscript: 'Y', oP: 0, oL: 0, identity: '42',
});

/** The two quick mark routes, as each client spells them. */
const ROUTES = [
  { label: 'fact/inserthighlights', path: '/fact/inserthighlights', sp: 'qmark_handler', schema: 'realtime' },
  // 7b / D8: one write path; issue/inserthighlights delegates to FactService and writes through realtime.et_qmark_handler too.
  { label: 'issue/inserthighlights', path: '/issue/inserthighlights', sp: 'qmark_handler', schema: 'realtime' },
];

describe('quick mark create gate (HTTP pipeline)', () => {
  let app: INestApplication;
  let logSpy: jest.SpyInstance;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [QuickMarkProbeModule] }).compile();
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
    Object.assign(world, { sessionInCase: true, sessionVisible: true, lookupFails: false });
    session = { id: 'browser-1', a: false };
    db.executeRef.mockClear();
    db.rowQuery.mockClear();
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined); // IssueController logs bodies
  });

  afterEach(() => {
    logSpy.mockRestore();
    jest.restoreAllMocks();
  });

  const post = (path: string, body: object) =>
    request(app.getHttpServer()).post(path).set('Authorization', `Bearer ${token()}`).send(body);

  describe.each(ROUTES)('$label', (route) => {
    describe('callers who can see the session keep adding quick marks', () => {
      it.each([
        ['new realtime page', realtimePageMark],
        ['legacy / venue rt feed-line', legacyFeedLineMark],
      ])('%s', async (_label, payload) => {
        const res = await post(route.path, { ...payload(), nUserid: VICTIM });
        expect(res.status).toBe(201);
        expect(res.body).toEqual([expect.objectContaining({ msg: 1, nHid: NEW_MARK })]);
        expect(writes()).toEqual([route.sp]);
        const [, param, schema] = db.executeRef.mock.calls[0];
        expect(schema).toBe(route.schema);
        expect(param).toEqual(expect.objectContaining({ nCaseid: CASE, nSessionid: SES, nUserid: ME, permission: 'I' }));
        expect(db.rowQuery).toHaveBeenCalledWith(QUICK_MARK_SESSION_SQL, [SES, CASE]);
        expect(db.rowQuery).toHaveBeenCalledWith(SESSION_ACCESS_SQL, [SES, ME]);
      });

      it('with the access_token cookie instead of the header', async () => {
        const res = await request(app.getHttpServer()).post(route.path)
          .set('Cookie', `access_token=${token()}`).send(realtimePageMark());
        expect(res.status).toBe(201);
        expect(writes()).toEqual([route.sp]);
      });

      it('a global admin (no session-visibility query, the session/case test still runs)', async () => {
        session = { id: 'browser-1', a: true };
        world.sessionVisible = false;
        const res = await post(route.path, realtimePageMark());
        expect(res.status).toBe(201);
        expect(writes()).toEqual([route.sp]);
        expect(db.rowQuery.mock.calls.map((c) => c[0])).toEqual([QUICK_MARK_SESSION_SQL]);
      });
    });

    describe('refusals are a 403 before anything is written', () => {
      it('a session the caller cannot see', async () => {
        world.sessionVisible = false;
        const res = await post(route.path, realtimePageMark());
        expect(res.status).toBe(403);
        expect(res.body.statusCode).toBe(403);
        expect(res.body.detailedError).toContain('You are not permitted to add quick marks to this session');
        expect(db.executeRef).not.toHaveBeenCalled();
      });

      it('a visible session paired with another case id', async () => {
        const res = await post(route.path, { ...realtimePageMark(), nCaseid: OTHER_CASE });
        expect(res.status).toBe(403);
        expect(db.rowQuery).toHaveBeenCalledWith(QUICK_MARK_SESSION_SQL, [SES, OTHER_CASE]);
        expect(db.executeRef).not.toHaveBeenCalled();
      });

      it('a session of another case (or a deleted one), even for a global admin', async () => {
        world.sessionInCase = false;
        session = { id: 'browser-1', a: true };
        const res = await post(route.path, legacyFeedLineMark());
        expect(res.status).toBe(403);
        expect(db.executeRef).not.toHaveBeenCalled();
      });

      it('no nCaseid or no nSessionid (absent, empty or "0")', async () => {
        const { nCaseid, ...noCase } = realtimePageMark();
        const { nSessionid, ...noSession } = realtimePageMark();
        for (const body of [noCase, noSession, { ...realtimePageMark(), nCaseid: '' }, { ...realtimePageMark(), nSessionid: '0' }]) {
          const res = await post(route.path, body);
          expect(res.status).toBe(403);
        }
        expect(db.rowQuery).not.toHaveBeenCalled();
        expect(db.executeRef).not.toHaveBeenCalled();
      });

      it('answers 500, and writes nothing, when the session lookup fails', async () => {
        jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
        world.lookupFails = true;
        const res = await post(route.path, realtimePageMark());
        expect(res.status).toBe(500);
        expect(db.executeRef).not.toHaveBeenCalled();
      });

      it('without a token the middleware refuses before the controller', async () => {
        const res = await request(app.getHttpServer()).post(route.path).send(realtimePageMark());
        expect(res.status).toBe(403);
        expect(db.rowQuery).not.toHaveBeenCalled();
        expect(db.executeRef).not.toHaveBeenCalled();
      });
    });
  });
});
