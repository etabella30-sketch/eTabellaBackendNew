import { INestApplication, MiddlewareConsumer, Module, NestModule, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import * as jwt from 'jsonwebtoken';
import * as request from 'supertest';
import { DbService } from '@app/global/db/pg/db.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { IssueController } from './issue.controller';
import { IssueService } from '../../services/issue/issue.service';
import { ExportService } from '../../services/export/export.service';
import { FactService } from '../../services/fact/fact.service';
import { UtilityService } from '../../services/utility/utility.service';
import { RealtimeAuthMiddleware } from '../../middleware/realtime-auth.middleware';

// Issue routes whose SP checks ownership, run through the real HTTP stack: RealtimeAuthMiddleware, the
// global ValidationPipe with realtime-server's options (whitelist + forbidNonWhitelisted), the real DTOs,
// IssueController and IssueService, with only the DB mocked. Proves the SP always gets the JWT user in its
// caller key, a client-sent id never wins, the injection never trips forbidNonWhitelisted (the delete DTOs
// declare no user id), and a request that reaches the controller without an authenticated user is refused.

const SECRET = 'issue-caller-secret';
const ME = '11111111-1111-4111-8111-111111111111';
const VICTIM = '22222222-2222-4222-8222-222222222222';
const CASE = '33333333-3333-4333-8333-333333333333';
const SES = '44444444-4444-4444-8444-444444444444';
const IID = '55555555-5555-4555-8555-555555555555';
const IDID = '66666666-6666-4666-8666-666666666666';
const HID = '77777777-7777-4777-8777-777777777777';
const ICID = '88888888-8888-4888-8888-888888888888';

const DETAIL = {
  nUserid: VICTIM, nCaseid: CASE, nSessionid: SES, cONote: 'o', cNote: 'n',
  cIidStr: [{ nIid: IID, nRelid: 1, nImpactid: 1 }], nLID: IID, cPageno: '1', jCordinates: [{ x: 1, y: 2 }], cTranscript: 'N',
};

type Route = { verb: 'post' | 'put' | 'delete'; path: string; body: Record<string, any>; sp: string; keys: string[] };

// Bodies are valid for each route's DTO; nUserid is sent (as someone else) wherever the DTO declares it.
const ROUTES: Route[] = [
  { verb: 'post', path: 'insertIssue', body: { cIName: 'A', cColor: '000000', nICid: ICID, nCaseid: CASE, nUserid: VICTIM }, sp: 'realtime_handle_issue_master', keys: ['nUserid'] },
  { verb: 'put', path: 'updateIssue', body: { nIid: IID, cIName: 'A', cColor: '000000', nICid: ICID, nCaseid: CASE, nUserid: VICTIM }, sp: 'realtime_handle_issue_master', keys: ['nUserid'] },
  { verb: 'delete', path: 'deleteIssue', body: { nIid: IID }, sp: 'realtime_handle_issue_delete', keys: ['nMasterid'] },
  { verb: 'delete', path: 'delete/multi/issue', body: { jIids: [IID] }, sp: 'realtime_handle_issue_delete', keys: ['nMasterid'] },
  { verb: 'post', path: 'insertCategory', body: { nCaseid: CASE, cCategory: 'C', nUserid: VICTIM }, sp: 'realtime_handle_issue_category', keys: ['nUserid', 'nMasterid'] },
  { verb: 'put', path: 'updateCategory', body: { nICid: ICID, nCaseid: CASE, cCategory: 'C', nUserid: VICTIM }, sp: 'realtime_handle_issue_category', keys: ['nUserid', 'nMasterid'] },
  { verb: 'delete', path: 'deleteCategory', body: { nICid: ICID }, sp: 'realtime_handle_issue_category', keys: ['nUserid', 'nMasterid'] },
  { verb: 'post', path: 'insertIssueDetail', body: DETAIL, sp: 'realtime_handle_issue_detail', keys: ['nUserid'] },
  { verb: 'put', path: 'updateIssueDetail', body: { ...DETAIL, nIDid: IDID }, sp: 'realtime_handle_issue_detail', keys: ['nUserid'] },
  { verb: 'delete', path: 'deleteIssueDetail', body: { nIDid: IDID }, sp: 'realtime_handle_issue_detail', keys: ['nUserid'] },
  // 7b / D8: one quick-mark write path, realtime.et_qmark_handler, for the issue/* twins of fact/insertHighlights and fact/deleteHighlights.
  { verb: 'post', path: 'insertHighlights', body: { nUserid: VICTIM, nCaseid: CASE, nSessionid: SES, cNote: 'n', cPageno: '1', cLineno: '2', cTime: '00:00', cTranscript: 'N' }, sp: 'qmark_handler', keys: ['nUserid', 'nMasterid'] },
  { verb: 'post', path: 'removemultihighlights', body: { jHids: [HID], nUserid: VICTIM }, sp: 'realtime_delete_multiple_rhighlights', keys: ['nUserid'] },
  { verb: 'delete', path: 'deleteHighlights', body: { cTranscript: 'N', nHid: HID }, sp: 'qmark_handler', keys: ['nMasterid'] },
  { verb: 'post', path: 'updateHighlightIssueIds', body: { cDefHIssues: [{ nIid: IID }], jHids: [HID], nLID: IID, nSessionid: SES, nUserid: VICTIM }, sp: 'realtime_update_default_h_issue', keys: ['nUserid', 'nMasterid'] },
  { verb: 'post', path: 'update/issuedetail/note', body: { nIDid: IDID, cNote: 'x' }, sp: 'realtime_issue_detail_note', keys: ['nUserid', 'nMasterid'] },
  { verb: 'put', path: 'updateClaimDetail', body: { nICid: ICID, cCategory: 'C', nUserid: VICTIM }, sp: 'realtime_handle_update_claim', keys: ['nUserid'] },
  { verb: 'delete', path: 'deleteClaim', body: { nICid: ICID }, sp: 'realtime_handle_claim_delete', keys: ['nMasterid'] },
];

const db = { executeRef: jest.fn(), rowQuery: jest.fn() };
const rds = { getValue: jest.fn(async () => JSON.stringify({ id: 'browser-1', a: false })), deleteValue: jest.fn() };
const providers = [
  IssueService,
  FactService, // 7b / D8: the highlight routes delegate to it
  { provide: UtilityService, useValue: {} },
  { provide: DbService, useValue: db },
  { provide: ExportService, useValue: {} },
  { provide: RedisDbService, useValue: rds },
  { provide: ConfigService, useValue: { get: (k: string) => (k === 'JWT_SECRET' ? SECRET : undefined) } },
];

@Module({ controllers: [IssueController], providers })
class WithAuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RealtimeAuthMiddleware).forRoutes(IssueController);
  }
}

/** Same controller with the auth middleware NOT wired: req.user never gets set. */
@Module({ controllers: [IssueController], providers })
class NoAuthModule { }

async function start(module: any): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [module] }).compile();
  const app = moduleRef.createNestApplication({ logger: false });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  await app.init();
  return app;
}

describe('issue routes pass the JWT user to ownership-checking SPs', () => {
  let withAuth: INestApplication;
  let noAuth: INestApplication;
  const token = jwt.sign({ userId: ME, broweserId: 'browser-1' }, SECRET);

  beforeAll(async () => {
    withAuth = await start(WithAuthModule);
    noAuth = await start(NoAuthModule);
  });

  afterAll(async () => {
    await withAuth?.close();
    await noAuth?.close();
  });

  let logSpy: jest.SpyInstance;
  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    db.executeRef.mockReset().mockResolvedValue({ success: true, data: [[{ msg: 1 }]] });
    // insertHighlights' quick mark gate: SES is a live session of CASE the caller can see (the gate's
    // refusals are covered in controllers/fact/quick-mark.insert.authz.spec.ts).
    db.rowQuery.mockReset().mockResolvedValue({ success: true, data: [{ '?column?': 1 }] });
  });

  afterEach(() => logSpy.mockRestore());

  const send = (app: INestApplication, r: Route) => {
    const req = request(app.getHttpServer())[r.verb](`/issue/${r.path}`);
    return (app === withAuth ? req.set('Authorization', `Bearer ${token}`) : req).send(r.body);
  };

  describe.each(ROUTES)('$verb issue/$path', (r) => {
    it(`${r.sp} gets the token user as ${r.keys.join(' + ')}, whatever the client sent`, async () => {
      const res = await send(withAuth, r);

      expect(res.status).toBeLessThan(300); // not a forbidNonWhitelisted 400
      const call = db.executeRef.mock.calls.find(([sp]) => sp === r.sp);
      expect(call).toBeDefined();
      for (const key of r.keys) expect(call[1][key]).toBe(ME);
      expect(Object.values(call[1])).not.toContain(VICTIM);
    });

    it('is refused with msg -1 when the request reaches it without an authenticated user', async () => {
      const res = await send(noAuth, r);

      expect(res.status).toBeLessThan(300);
      expect(res.body).toEqual(expect.objectContaining({ msg: -1 }));
      expect(db.executeRef).not.toHaveBeenCalled();
    });
  });

  it('a client cannot smuggle an identity key the DTO does not declare (400, nothing reaches the SP)', async () => {
    const res = await request(withAuth.getHttpServer()).delete('/issue/deleteIssue')
      .set('Authorization', `Bearer ${token}`).send({ nIid: IID, nMasterid: VICTIM });
    // RealtimeAuthMiddleware overwrites the sent nMasterid, but the DTO still rejects the extra key.
    expect(res.status).toBe(400);
    expect(db.executeRef).not.toHaveBeenCalled();
  });

  it('without a token the middleware rejects before the controller', async () => {
    const res = await request(withAuth.getHttpServer()).delete('/issue/deleteIssue').send({ nIid: IID });
    expect(res.status).toBe(403);
    expect(db.executeRef).not.toHaveBeenCalled();
  });

  // The legacy frontend calls these two in lower case (issue.service insertHyperlink / deleteHyperlink).
  // Express matches routes case-insensitively; the auth middleware must too, or the service would
  // refuse every legacy highlight write with msg -1 (no req.user) and an unauthenticated call would not 403.
  describe.each([
    { verb: 'post' as const, path: '/issue/inserthighlights', body: { nUserid: VICTIM, nCaseid: CASE, nSessionid: SES, cNote: 'n', cPageno: '1', cLineno: '2', cTime: '00:00', cTranscript: 'N' } },
    { verb: 'delete' as const, path: '/issue/deletehighlights', body: { nHid: HID, cTranscript: 'N' } },
  ])('legacy lower-case $verb $path', ({ verb, path, body }) => {
    it('still runs the auth middleware and hands the SP the token user', async () => {
      const res = await request(withAuth.getHttpServer())[verb](path).set('Authorization', `Bearer ${token}`).send(body);
      expect(res.status).toBeLessThan(300);
      expect(res.body).not.toEqual(expect.objectContaining({ msg: -1 }));
      const call = db.executeRef.mock.calls.find(([sp]) => sp === 'qmark_handler');
      expect(call?.[1]?.nUserid ?? call?.[1]?.nMasterid).toBe(ME);
      expect(Object.values(call[1])).not.toContain(VICTIM);
    });

    it('is refused by the middleware without a token', async () => {
      const res = await request(withAuth.getHttpServer())[verb](path).send(body);
      expect(res.status).toBe(403);
      expect(db.executeRef).not.toHaveBeenCalled();
    });
  });
});
