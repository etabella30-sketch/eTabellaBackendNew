import { INestApplication, Logger, MiddlewareConsumer, Module, NestModule, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import * as cookieParser from 'cookie-parser';
import * as jwt from 'jsonwebtoken';
import * as request from 'supertest';
import { DbService } from '@app/global/db/pg/db.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { HttpErrorFilter } from '@app/global/middleware/exception';
import { DoclinkService } from '../../services/doclink/doclink.service';
import { DOCLINK_LEGACY_SHAPES, DocLinkController, DocLinkHttpModule, DocLinkLiveController, DocLinkService } from '@app/rt-features/doclink';
import { CloudPlatformModule, LegacyEnvelope } from '@app/platform-cloud';
import { UtilityService } from '../../services/utility/utility.service';
import { RealtimeAuthInjectMiddleware } from '../../middleware/realtime-auth.middleware';
import { SESSION_ACCESS_SQL } from '../../events/realtime-socket-access';
import { FACT_CREATE_TARGET_SQL } from '../../services/fact/fact-create-gate';
import { DOCLINK_TARGETS_IN_CASE_SQL } from '../../services/doclink/doclink-create-gate';

// doclink/insertdoc through a real Nest HTTP stack: DoclinkController and DoclinkService as shipped,
// RealtimeAuthInjectMiddleware wired as TranscriptModule wires it, and main.ts's global ValidationPipe
// options, cookie parser and HttpErrorFilter. Only the database and Redis are stubs. realtime.et_doc_insert
// stores the client's nCaseid / nBundledetailid / nSesid as given, so the fact create rule applies.

const SECRET = 'doclink-insert-secret';
const ME = '11111111-1111-4111-8111-111111111111';
const VICTIM = '22222222-2222-4222-8222-222222222222';
const SES = '33333333-3333-4333-8333-333333333333';
const DOC = '44444444-4444-4444-8444-444444444444';
const NEW_DOCLINK = '55555555-5555-4555-8555-555555555555';
const CASE = '66666666-6666-4666-8666-666666666666';
const TARGET = '77777777-7777-4777-8777-777777777777';
const TEAMMATE = '88888888-8888-4888-8888-888888888888';
const FOREIGN_DOC = '99999999-9999-4999-8999-999999999999';

/** What the stub database knows: who is on CASE's team, whether the document / session is in CASE, and CASE's documents. */
const world = {
  members: new Set<string>([ME]),
  caseExists: true,
  docInCase: true,
  sessionInCase: true,
  sessionVisible: true,
  gateFails: false,
  caseDocs: new Set<string>([DOC, TARGET]),
  targetsFail: false,
};

let session = { id: 'browser-1', a: false };
const rds = { getValue: jest.fn(async () => JSON.stringify(session)), deleteValue: jest.fn() };
const db = {
  executeRef: jest.fn(async (name: string, _params?: any) => {
    if (name === 'doc_insert') return { success: true, data: [[{ msg: 1, nDocid: NEW_DOCLINK, jNotify: [] }]] };
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
    if (text === DOCLINK_TARGETS_IN_CASE_SQL) {
      if (world.targetsFail) return { success: false, error: 'db down' };
      const ids: string[] = params[0] === CASE ? params[1] : [];
      return { success: true, data: ids.filter((id) => world.caseDocs.has(id)).map((id) => ({ nBundledetailid: id.toUpperCase() })) };
    }
    return { success: true, data: [] }; // markAsTranscriptIfPublished's UPDATE
  }),
};

@Module({
  // Phase 8: the routes are the shared DocLinkController / DocLinkLiveController over DocLinkService (reads) and this
  // app's DoclinkService (writes), the kernel ports bound by CloudPlatformModule over the mocked DbService.
  imports: [
    CloudPlatformModule.forRoot({ envelope: new LegacyEnvelope({ legacyShape: DOCLINK_LEGACY_SHAPES }) }),
    DocLinkHttpModule.register({ operations: DocLinkService, writes: DoclinkService, mount: 'live' }),
  ],
  providers: [
    DoclinkService,
    { provide: DbService, useValue: db },
    { provide: UtilityService, useValue: { sendNotification: jest.fn() } },
    { provide: RedisDbService, useValue: rds },
    { provide: ConfigService, useValue: { get: (k: string) => (k === 'JWT_SECRET' ? SECRET : undefined) } },
  ],
})
class DoclinkProbeModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RealtimeAuthInjectMiddleware).forRoutes(DocLinkController, DocLinkLiveController);
  }
}

const token = () => jwt.sign({ userId: ME, broweserId: 'browser-1' }, SECRET);
const gateCalls = () => db.rowQuery.mock.calls.filter((c) => c[0] === FACT_CREATE_TARGET_SQL);
const targetCalls = () => db.rowQuery.mock.calls.filter((c) => c[0] === DOCLINK_TARGETS_IN_CASE_SQL);
const destinations = () => JSON.stringify([[TARGET, { type: 'F', start: 1, end: 9, pages: [] }, [], []]]);
const sharedWith = () => JSON.stringify([{ nUserid: TEAMMATE, bCanEdit: true, bCanCopy: true, bCanReshare: true, bCanComment: true }]);

/** New frontend, document reader (persistDocLink): PDF source, geometry in jAn. */
const readerPdfDocLink = () => ({
  nBundledetailid: DOC, nCaseid: CASE, nMasterid: ME, cType: 'S', cDFrom: 'I', nPage: 3,
  jDl: destinations(), jT: '["note"]', jOT: '["quoted"]', jUsers: sharedWith(),
  jAn: [{ uuid: 'a1', type: 'highlight', page: 3, rects: [{ x: 1, y: 2, width: 3, height: 4 }] }],
});
/** New frontend, document reader (persistDocLink): transcript tab, empty nBundledetailid, nSesid + jCordinates. */
const readerTranscriptDocLink = () => ({
  nBundledetailid: '', nCaseid: CASE, nMasterid: ME, cType: 'S', cDFrom: 'RT', nPage: 2, nLine: 7,
  jDl: destinations(), jT: '[]', jOT: '["line"]', jUsers: '[]', jAn: [], nSesid: SES,
  jCordinates: [{ t: '10:00:00:00', p: 2, l: 7, text: 'line', oP: 2, oL: 7, identity: '42' }],
});
/** New frontend, realtime page (onDocLinkCreate). */
const realtimeDocLink = () => ({
  nBundledetailid: '', nCaseid: CASE, nMasterid: ME, cType: 'S', cDFrom: 'RT', nPage: 2, nLine: 7,
  jDl: destinations(), jT: '[]', jOT: '["line"]', jUsers: sharedWith(), jAn: [], nSesid: SES,
  jCordinates: [{ t: '10:00:00:00', p: 2, l: 7, text: 'line' }],
});
/** Legacy doc-link-creation (RtDocsService.saveDoc) on a transcript: no nMasterid, nSesid + jCordinates. */
const legacyRtDocLink = () => ({
  jT: '[]', jDl: destinations(), jOT: '["line"]', jUsers: '[]', cType: 'S', cDFrom: 'RT', nCaseid: CASE,
  nLine: 7, nPage: 2, nSesid: SES, jCordinates: [{ t: '10:00:00:00', p: 2, l: 7 }],
});
/** Legacy doc-link-creation on the PDF viewer: nBundledetailid + jAn. */
const legacyPdfDocLink = () => ({
  jT: '[]', jDl: destinations(), jOT: '["quoted"]', jUsers: '[]', cType: 'S', cDFrom: 'I', nCaseid: CASE,
  nLine: 0, nPage: 1, nBundledetailid: DOC,
  jAn: [{ uuid: 'a2', type: 'highlight', page: 1, rects: [{ x: 1, y: 2, width: 3, height: 4 }], lines: [], width: 1 }],
});

describe('doclink/insertdoc create gate (HTTP pipeline)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [DoclinkProbeModule] }).compile();
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
    Object.assign(world, { caseExists: true, docInCase: true, sessionInCase: true, sessionVisible: true, gateFails: false, targetsFail: false });
    world.members = new Set([ME]);
    world.caseDocs = new Set([DOC, TARGET]);
    session = { id: 'browser-1', a: false };
    db.executeRef.mockClear();
    db.rowQuery.mockClear();
  });

  afterEach(() => jest.restoreAllMocks());

  const post = (body: object) =>
    request(app.getHttpServer()).post('/doclink/insertdoc').set('Cookie', `access_token=${token()}`).send(body);

  describe('case members keep creating DocLinks from every client', () => {
    it.each([
      ['new reader, PDF source (cookie)', readerPdfDocLink],
      ['new reader, transcript source', readerTranscriptDocLink],
      ['new realtime page', realtimeDocLink],
    ])('%s', async (_label, payload) => {
      const res = await post(payload());
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ msg: 1, nDocid: NEW_DOCLINK });
      expect(db.executeRef.mock.calls.map((c) => c[0])).toEqual(['doc_insert']);
      expect((db.executeRef.mock.calls[0][1] as any).nMasterid).toBe(ME);
      expect(gateCalls()).toHaveLength(1);
      const sent: any = payload();
      expect(gateCalls()[0][1]).toEqual([CASE, ME, sent.nBundledetailid || null, sent.nSesid ?? null]);
      if (sent.nSesid) expect(db.rowQuery).toHaveBeenCalledWith(SESSION_ACCESS_SQL, [SES, ME]);
      expect(targetCalls()).toEqual([[DOCLINK_TARGETS_IN_CASE_SQL, [CASE, [TARGET]]]]);
    });

    it.each([
      ['legacy RT doc-link-creation', legacyRtDocLink],
      ['legacy PDF viewer doc-link-creation', legacyPdfDocLink],
    ])('%s with an Authorization header and no nMasterid', async (_label, payload) => {
      const res = await request(app.getHttpServer())
        .post('/doclink/insertdoc').set('Authorization', `Bearer ${token()}`).send(payload());
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ msg: 1, nDocid: NEW_DOCLINK });
      expect((db.executeRef.mock.calls[0][1] as any).nMasterid).toBe(ME);
    });

    it('a global admin who is not on the case team', async () => {
      world.members = new Set();
      session = { id: 'browser-1', a: true };
      const res = await post(realtimeDocLink());
      expect(res.status).toBe(201);
      expect(db.executeRef.mock.calls.map((c) => c[0])).toEqual(['doc_insert']);
    });
  });

  describe('refusals are a 403 before anything is written', () => {
    it.each([
      ['new reader, PDF source', readerPdfDocLink],
      ['new reader, transcript source', readerTranscriptDocLink],
      ['new realtime page', realtimeDocLink],
      ['legacy RT', legacyRtDocLink],
      ['legacy PDF viewer', legacyPdfDocLink],
    ])('%s from a caller who is not on the case team', async (_label, payload) => {
      world.members = new Set([VICTIM]);
      const res = await post(payload());
      expect(res.status).toBe(403);
      expect(res.body.statusCode).toBe(403);
      expect(res.body.detailedError).toContain('You are not permitted to add document links to this case');
      expect(db.executeRef).not.toHaveBeenCalled();
      expect(db.rowQuery.mock.calls.map((c) => c[0])).toEqual([FACT_CREATE_TARGET_SQL]);
    });

    it('checks the token user, not an nMasterid the client sent', async () => {
      world.members = new Set([VICTIM]);
      const res = await post({ ...readerPdfDocLink(), nMasterid: VICTIM });
      expect(res.status).toBe(403);
      expect(gateCalls()[0][1][1]).toBe(ME);
      expect(db.executeRef).not.toHaveBeenCalled();
    });

    it('a source document of another case', async () => {
      world.docInCase = false;
      expect((await post(readerPdfDocLink())).status).toBe(403);
      expect((await post(legacyPdfDocLink())).status).toBe(403);
      expect(db.executeRef).not.toHaveBeenCalled();
    });

    it('a session of another case (or a deleted one), even for a global admin', async () => {
      world.sessionInCase = false;
      session = { id: 'browser-1', a: true };
      expect((await post(realtimeDocLink())).status).toBe(403);
      expect((await post(readerTranscriptDocLink())).status).toBe(403);
      expect(db.executeRef).not.toHaveBeenCalled();
    });

    it('a session the caller cannot see', async () => {
      world.sessionVisible = false;
      const res = await post(realtimeDocLink());
      expect(res.status).toBe(403);
      expect(db.executeRef).not.toHaveBeenCalled();
    });

    it('a case that does not exist, or no nCaseid at all', async () => {
      world.caseExists = false;
      expect((await post(readerPdfDocLink())).status).toBe(403);
      world.caseExists = true;
      const { nCaseid, ...noCase } = readerPdfDocLink();
      expect((await post(noCase)).status).toBe(403);
      expect((await post({ ...realtimeDocLink(), nCaseid: '0' })).status).toBe(403);
      expect(db.executeRef).not.toHaveBeenCalled();
    });

    it('answers 500, and writes nothing, when the access lookup fails', async () => {
      jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
      world.gateFails = true;
      const res = await post(realtimeDocLink());
      expect(res.status).toBe(500);
      expect(db.executeRef).not.toHaveBeenCalled();
    });

    describe('link targets (jDl) outside the case', () => {
      const linkingTo = (...ids: string[]) =>
        JSON.stringify(ids.map((id) => [id, { type: 'F', start: 1, end: 9, pages: [] }, [], []]));

      it.each([
        ['new reader, PDF source', readerPdfDocLink],
        ['new realtime page', realtimeDocLink],
        ['legacy RT', legacyRtDocLink],
        ['legacy PDF viewer', legacyPdfDocLink],
      ])('%s: a target document of another case, next to one of this case', async (_label, payload) => {
        const res = await post({ ...payload(), jDl: linkingTo(TARGET, FOREIGN_DOC) });
        expect(res.status).toBe(403);
        expect(res.body.detailedError).toContain('You are not permitted to add document links to this case');
        expect(targetCalls()).toEqual([[DOCLINK_TARGETS_IN_CASE_SQL, [CASE, [TARGET, FOREIGN_DOC]]]]);
        expect(db.executeRef).not.toHaveBeenCalled();
      });

      it('even for a global admin', async () => {
        world.members = new Set();
        session = { id: 'browser-1', a: true };
        const res = await post({ ...readerPdfDocLink(), jDl: linkingTo(FOREIGN_DOC) });
        expect(res.status).toBe(403);
        expect(db.executeRef).not.toHaveBeenCalled();
      });

      it('a target that is not a UUID, or a jDl that is not a JSON list, is refused before any lookup', async () => {
        for (const jDl of [JSON.stringify([['folder:abc', {}, [], []]]), JSON.stringify([[7, {}, [], []]]), '{"a":1}', 'not json']) {
          const res = await post({ ...readerPdfDocLink(), jDl });
          expect(res.status).toBe(403);
        }
        expect(db.rowQuery).not.toHaveBeenCalled();
        expect(db.executeRef).not.toHaveBeenCalled();
      });

      it('repeated, upper-case and empty targets: one lookup of the distinct ids', async () => {
        const res = await post({ ...readerPdfDocLink(), jDl: linkingTo(TARGET, TARGET.toUpperCase(), '') });
        expect(res.status).toBe(201);
        expect(targetCalls()).toEqual([[DOCLINK_TARGETS_IN_CASE_SQL, [CASE, [TARGET]]]]);
        expect(db.executeRef.mock.calls.map((c) => c[0])).toEqual(['doc_insert']);
      });

      it('answers 500, and writes nothing, when the target lookup fails', async () => {
        jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
        world.targetsFail = true;
        const res = await post(readerPdfDocLink());
        expect(res.status).toBe(500);
        expect(db.executeRef).not.toHaveBeenCalled();
      });
    });
  });
});
