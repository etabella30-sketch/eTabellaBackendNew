import { Global, INestApplication, Logger, MiddlewareConsumer, Module, NestModule, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import * as cookieParser from 'cookie-parser';
import * as jwt from 'jsonwebtoken';
import * as request from 'supertest';
import { DbService } from '@app/global/db/pg/db.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { HttpErrorFilter } from '@app/global/middleware/exception';
import { MARK_WRITE_HOOK } from '@app/api-kernel';
import { CloudPlatformModule, LegacyEnvelope } from '@app/platform-cloud';
import { FACTSHEET_LEGACY_SHAPES, FactsheetController, FactsheetLiveController, FactsheetRealtimeHttpModule, FactsheetService } from '@app/rt-features/factsheet';
import { FactController } from '../controllers/fact/fact.controller';
import { DoclinkController } from '../controllers/doclink/doclink.controller';
import { FactService } from '../services/fact/fact.service';
import { DoclinkService } from '../services/doclink/doclink.service';
import { UtilityService } from '../services/utility/utility.service';
import { RealtimeAuthInjectMiddleware } from '../middleware/realtime-auth.middleware';
import { markWriteHookProvider } from './mark-write.interceptor';
import { SESSION_ACCESS_SQL } from '../events/realtime-socket-access';
import { FACT_CREATE_TARGET_SQL } from '../services/fact/fact-create-gate';
import { QUICK_MARK_SESSION_SQL } from '../services/session/quick-mark-gate';
import { DOCLINK_TARGETS_IN_CASE_SQL } from '../services/doclink/doclink-create-gate';
import { MARK_AUDIENCE_SQL } from '../services/marks/mark-audience.sql';
import { MarkChange, MarkEventsService } from '../services/marks/mark-events.service';

// Live mark sync (user decision 2026-10-05) through a real Nest HTTP stack: FactController and DoclinkController with
// their services as shipped, the shared factsheet feature (@app/rt-features/factsheet, Phase 7a) mounted as
// TranscriptModule mounts it over the CloudPlatformModule ports, RealtimeAuthInjectMiddleware wired as TranscriptModule
// wires it, main.ts's global ValidationPipe options and HttpErrorFilter, and MarkEventsService + MARK_WRITE_HOOK
// provided app-wide as MarkEventsModule does. Only the database and Redis are stubs. Every mark write route the plan
// lists tells MarkEventsService who can see the changed mark; a refused or failed write tells nobody.

const SECRET = 'mark-write-secret';
const ME = '11111111-1111-4111-8111-111111111111';
const FRIEND = '22222222-2222-4222-8222-222222222222';
const SES = '33333333-3333-4333-8333-333333333333';
const THIRD = '44444444-4444-4444-8444-444444444444';
const NEW_FACT = '55555555-5555-4555-8555-555555555555';
const CASE = '66666666-6666-4666-8666-666666666666';
const ISSUE = '77777777-7777-4777-8777-777777777777';
const OWNER = '88888888-8888-4888-8888-888888888888';
const FACT = '99999999-9999-4999-8999-999999999999';
const SHARED_FACT = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const NEW_MARK = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const QMARK = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const NEW_DOC = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const DOCLINK = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const TARGET = 'ffffffff-ffff-4fff-8fff-ffffffffffff';

type Row = { nSesid: string | null; nOwner: string; aShared: string[] };

/** What the stub database holds: the marks (per kind, by id), whether the gates pass, and what happened in order. */
const world = {
  marks: { Q: new Map<string, Row>(), F: new Map<string, Row>(), D: new Map<string, Row>() },
  member: true,
  insertFails: false,
  log: [] as string[],
};

function resetWorld() {
  world.marks.Q = new Map([[NEW_MARK, { nSesid: SES, nOwner: ME, aShared: [] }], [QMARK, { nSesid: SES, nOwner: ME, aShared: [] }]]);
  world.marks.F = new Map([
    [NEW_FACT, { nSesid: SES, nOwner: ME, aShared: [FRIEND] }],
    [FACT, { nSesid: SES, nOwner: ME, aShared: [FRIEND] }],
    [SHARED_FACT, { nSesid: SES, nOwner: OWNER, aShared: [ME] }],
  ]);
  world.marks.D = new Map([[NEW_DOC, { nSesid: SES, nOwner: ME, aShared: [THIRD] }], [DOCLINK, { nSesid: SES, nOwner: ME, aShared: [FRIEND] }]]);
  world.member = true;
  world.insertFails = false;
  world.log = [];
}

let session = { id: 'browser-1', a: false };
const rds = { getValue: jest.fn(async () => JSON.stringify(session)), deleteValue: jest.fn() };
const ok = (rows: any[]) => ({ success: true, data: [rows] });
const db = {
  executeRef: jest.fn(async (name: string, params: any = {}) => {
    world.log.push(`sp:${name}`);
    switch (name) {
      case 'fact_insert':
        return world.insertFails ? { success: false, error: 'insert failed' } : ok([{ msg: 1, nFSid: NEW_FACT, color: 'ff0000' }]);
      case 'fact_insert_team':
        if (params.nFSid === FACT) world.marks.F.get(FACT).aShared = [THIRD]; // the Full Fact's new share list
        return ok([{ jNotify: [] }]);
      case 'fact_permissions':
        return ok([{ bCanView: true, bCanEdit: true, bCanReshare: true }]);
      case 'fact_quick_update':
        return ok([{ msg: 1, value: 'Updated' }]);
      case 'qmark_handler':
        if (params.permission === 'D') {
          world.marks.Q.delete(params.nHid);
          return ok([{ msg: 1, value: 'Deleted' }]);
        }
        return ok([{ msg: 1, nHid: NEW_MARK, nSessionId: SES }]);
      case 'factsheet_submit':
        return ok([{ msg: 1, value: 'Fact updated' }]);
      case 'factsheet_unshare_withme':
        world.marks.F.get(params.nFSid).aShared = world.marks.F.get(params.nFSid).aShared.filter(u => u !== params.nMasterid);
        return ok([{ msg: 1, value: 'Unshared' }]);
      case 'factsheet_delete':
        world.marks.F.delete(params.nFSid);
        return ok([{ msg: 1, value: 'Deleted' }]);
      case 'doc_insert':
        return ok([{ msg: 1, nDocid: NEW_DOC, jNotify: [] }]);
      case 'doc_delete':
        world.marks.D.delete(params.nDocid);
        return ok([{ msg: 1, value: 'Deleted' }]);
      default:
        return ok([]);
    }
  }),
  rowQuery: jest.fn(async (text: string, params: any[] = []) => {
    const kind = (Object.keys(MARK_AUDIENCE_SQL) as Array<'Q' | 'F' | 'D'>).find(k => MARK_AUDIENCE_SQL[k] === text);
    if (kind) {
      world.log.push(`read:${kind}`);
      const row = world.marks[kind].get(params[0]);
      return { success: true, data: row ? [{ ...row, aShared: [...row.aShared] }] : [] };
    }
    if (text === FACT_CREATE_TARGET_SQL) return { success: true, data: [{ bCase: true, bMember: world.member, bDocInCase: true, bSessionInCase: true }] };
    if (text === SESSION_ACCESS_SQL || text === QUICK_MARK_SESSION_SQL) return { success: true, data: [{ '?column?': 1 }] };
    if (text === DOCLINK_TARGETS_IN_CASE_SQL) return { success: true, data: params[1].map((id: string) => ({ nBundledetailid: id })) };
    if (text.includes('FROM "RHighlights" WHERE "nHid" = $1')) return { success: true, data: [{ nUserid: ME }] }; // deleteHighlights owner check
    return { success: true, data: [] }; // markAsTranscriptIfPublished's UPDATE
  }),
};

const env: Record<string, string> = { JWT_SECRET: SECRET };
const config = { get: (k: string) => env[k] };

@Global()
@Module({
  providers: [MarkEventsService, { provide: ConfigService, useValue: config }, markWriteHookProvider()],
  exports: [MarkEventsService, ConfigService, MARK_WRITE_HOOK],
})
class MarkEventsProbeModule { }

@Module({
  imports: [
    // The kernel ports over this probe's DbService (found in the container as on live); no Kafka here, and the
    // share replacement below answers no recipients, so nothing is published.
    CloudPlatformModule.forRoot({ envelope: new LegacyEnvelope({ legacyShape: FACTSHEET_LEGACY_SHAPES }) }),
    FactsheetRealtimeHttpModule.register({ operations: FactsheetService, mount: 'live' }),
  ],
  controllers: [FactController, DoclinkController],
  providers: [
    FactService,
    DoclinkService,
    { provide: DbService, useValue: db },
    { provide: UtilityService, useValue: { sendNotification: jest.fn() } },
    { provide: RedisDbService, useValue: rds },
  ],
})
class MarkRoutesProbeModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RealtimeAuthInjectMiddleware).forRoutes(FactController, FactsheetController, FactsheetLiveController, DoclinkController);
  }
}

const token = (userId = ME) => jwt.sign({ userId, broweserId: 'browser-1' }, SECRET);

const realtimeQuickFact = () => ({
  nCaseid: CASE, cFFrom: 'RT', nSesid: SES, nPage: 2, nLine: 7, jOT: '["line"]', jT: '[]', jIssues: `[["${ISSUE}",0,0]]`,
  jUsers: '[]', jCordinates: [{ t: '10:00:00:00', p: 2, l: 7, text: 'line' }], nColorid: ISSUE, cFtype: 'QF', cIsNote: 'N',
  bIsHighlighted: false,
});
const realtimeFact = () => ({
  nCaseid: CASE, cFFrom: 'RT', nSesid: SES, nPage: 2, nLine: 7, jOT: '["line"]', jT: '["note"]', jIssues: `[["${ISSUE}",0,0]]`,
  jUsers: '[]', jCordinates: [{ t: '10:00:00:00', p: 2, l: 7 }], nColorid: ISSUE, cFtype: 'F', nFt: 0, nSt: 0,
  jFl: '[]', jContacts: '[]', jTasks: '[]', jDate: '{}',
});
const readerPdfFact = () => ({
  nCaseid: CASE, nColorid: ISSUE, jOT: '["quoted"]', jT: '[]', jIssues: `[["${ISSUE}",0,0]]`, jUsers: '[]',
  cFFrom: 'I', nBDid: TARGET, jAn: '[]', nPage: 3, cFtype: 'F', nFt: 0, nSt: 0, jFl: '[]', jContacts: '[]', jTasks: '[]', jDate: '{}',
});
const realtimePageMark = () => ({
  nCaseid: CASE, nSessionid: SES, nUserid: ME, cNote: 'line text', cPageno: '2', cLineno: '7', cTime: '10:00:00:00',
  cTranscript: 'N', oP: 2, oL: 7, identity: '603973172365200',
});
const realtimeDocLink = () => ({
  nBundledetailid: '', nCaseid: CASE, nMasterid: ME, cType: 'S', cDFrom: 'RT', nPage: 2, nLine: 7,
  jDl: JSON.stringify([[TARGET, { type: 'F', start: 1, end: 9, pages: [] }, [], []]]), jT: '[]', jOT: '["line"]',
  jUsers: JSON.stringify([{ nUserid: THIRD, bCanEdit: false, bCanCopy: false, bCanReshare: false, bCanComment: true }]), jAn: [], nSesid: SES,
  jCordinates: [{ t: '10:00:00:00', p: 2, l: 7, text: 'line' }],
});
const fullFactSave = () => ({
  nFSid: FACT, nSesid: SES, jT: '["note"]', nFt: 0, nSt: 0, jFl: '[]', nColorid: ISSUE, jIssues: '[]', jContacts: '[]', jTasks: '[]',
  jDate: '{}', jUsers: JSON.stringify([{ nUserid: THIRD, bCanEdit: false }]), bIsUserUpdated: true,
});

async function until(cond: () => boolean, ms = 3000): Promise<void> {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (cond()) return;
    await new Promise(r => setTimeout(r, 5));
  }
  throw new Error('condition not met in time');
}

describe('mark write routes tell MarkEventsService (HTTP pipeline)', () => {
  let app: INestApplication;
  let markEvents: MarkEventsService;
  let changes: MarkChange[];

  beforeAll(async () => {
    Logger.overrideLogger(false);
    const moduleRef = await Test.createTestingModule({ imports: [MarkEventsProbeModule, MarkRoutesProbeModule] }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new HttpErrorFilter());
    await app.init();
    markEvents = app.get(MarkEventsService);
  });

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(() => {
    resetWorld();
    session = { id: 'browser-1', a: false };
    delete env.RT_MARK_EVENTS;
    db.executeRef.mockClear();
    db.rowQuery.mockClear();
    changes = [];
    jest.spyOn(markEvents, 'changed').mockImplementation(change => void changes.push(change));
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  const post = (path: string, body: object, as = ME) => request(app.getHttpServer()).post(path).set('Cookie', `access_token=${token(as)}`).send(body);

  it.each([
    ['fact/insertquickfact', realtimeQuickFact, { kind: 'F', users: [ME, FRIEND] }, ['sp:fact_insert', 'read:F']],
    ['fact/insertfact', realtimeFact, { kind: 'F', users: [ME, FRIEND] }, ['sp:fact_insert', 'read:F']],
    ['fact/quickfactupdate', () => ({ nFSid: FACT, nColorid: ISSUE, jTexts: '["x"]', jIssue: '[]', nPage: 2, nLine: 7 }), { kind: 'F', users: [ME, FRIEND] }, ['read:F', 'sp:fact_quick_update', 'read:F']],
    ['fact/insertHighlights', realtimePageMark, { kind: 'Q', users: [ME] }, ['sp:qmark_handler', 'read:Q']],
    ['fact/deleteHighlights', () => ({ nHid: QMARK }), { kind: 'Q', users: [ME] }, ['read:Q', 'sp:qmark_handler']],
    // A Full Fact save that replaces the share list: FRIEND (taken off) and THIRD (added) are both told.
    ['factsheet/save', fullFactSave, { kind: 'F', users: [ME, FRIEND, THIRD] }, ['read:F', 'sp:factsheet_submit', 'sp:fact_insert_team', 'read:F']],
    // "Remove from my list": the author is told, and so are the caller's other devices.
    ['factsheet/unshare', () => ({ nFSid: SHARED_FACT }), { kind: 'F', users: [OWNER, ME] }, ['read:F', 'sp:factsheet_unshare_withme', 'read:F']],
    ['factsheet/delete', () => ({ nFSid: FACT }), { kind: 'F', users: [ME, FRIEND] }, ['read:F', 'sp:factsheet_delete']],
    ['doclink/insertdoc', realtimeDocLink, { kind: 'D', users: [ME, THIRD] }, ['sp:doc_insert', 'read:D']],
    ['doclink/docdelete', () => ({ nDocid: DOCLINK }), { kind: 'D', users: [ME, FRIEND] }, ['read:D', 'sp:doc_delete']],
  ])('%s', async (route, body, expected, order) => {
    const res = await post(`/${route}`, body());
    expect(res.status).toBe(201);
    await until(() => changes.length > 0);
    expect(changes).toEqual([{ nSesid: SES, kind: expected.kind, by: ME, users: expected.users }]);
    // The audience reads around the route's own SPs (a delete is read BEFORE it runs, never after).
    expect(world.log.filter(e => e.startsWith('read:') || order.includes(e))).toEqual(order);
  });

  describe('a write that did not happen tells nobody', () => {
    it('a refused create (403 from the gate)', async () => {
      world.member = false;
      expect((await post('/fact/insertfact', realtimeFact())).status).toBe(403);
      await new Promise(r => setTimeout(r, 50));
      expect(changes).toEqual([]);
      expect(world.log).toEqual([]);
    });

    it('a failed insert (msg -1)', async () => {
      world.insertFails = true;
      const res = await post('/fact/insertquickfact', realtimeQuickFact());
      expect(res.body).toMatchObject({ msg: -1 });
      await new Promise(r => setTimeout(r, 50));
      expect(changes).toEqual([]);
      expect(world.log.filter(e => e.startsWith('read:'))).toEqual([]);
    });

    // et_factsheet_unshare_withme answers msg 1 'Unshared' even when it removed no share row, and the route checks no
    // permission: only a caller who could see the fact before and cannot see it after has changed anything.
    it.each([
      ['someone the fact was never shared with', THIRD],
      ['the fact\'s own author', ME],
    ])('"Remove from my list" by %s (no share row removed)', async (_label, caller) => {
      const res = await post('/factsheet/unshare', { nFSid: FACT }, caller);
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ msg: 1, value: 'Unshared' });
      await new Promise(r => setTimeout(r, 50));
      expect(world.marks.F.get(FACT).aShared).toEqual([FRIEND]);
      expect(world.log).toEqual(['read:F', 'sp:factsheet_unshare_withme', 'read:F']);
      expect(changes).toEqual([]);
    });

    it('a Document Reader PDF fact (no session)', async () => {
      world.marks.F.get(NEW_FACT).nSesid = null;
      expect((await post('/fact/insertfact', readerPdfFact())).status).toBe(201);
      await new Promise(r => setTimeout(r, 50));
      expect(world.log.filter(e => e.startsWith('read:'))).toEqual(['read:F']);
      expect(changes).toEqual([]);
    });

    it('RT_MARK_EVENTS=0: the routes run exactly as before, with no audience read', async () => {
      env.RT_MARK_EVENTS = '0';
      expect((await post('/factsheet/delete', { nFSid: FACT })).status).toBe(201);
      expect((await post('/doclink/insertdoc', realtimeDocLink())).status).toBe(201);
      await new Promise(r => setTimeout(r, 50));
      expect(world.log.filter(e => e.startsWith('read:'))).toEqual([]);
      expect(changes).toEqual([]);
    });
  });

  it('end to end: the notice reaches U<user> as marks-changed after the 300 ms window', async () => {
    (markEvents.changed as jest.Mock).mockRestore();
    const emitted: Array<{ room: string; event: string; payload: any }> = [];
    markEvents.server = { to: (room: string) => ({ emit: (event: string, payload: unknown): unknown => emitted.push({ room, event, payload }) }) };
    try {
      expect((await post('/fact/insertfact', realtimeFact())).status).toBe(201);
      expect((await post('/fact/insertHighlights', realtimePageMark())).status).toBe(201);
      const kindsOf = (user: string) => emitted.filter(e => e.room === `U${user}`).flatMap(e => e.payload.kinds);
      await until(() => kindsOf(FRIEND).length > 0 && kindsOf(ME).includes('Q') && kindsOf(ME).includes('F'), 2000);
      await new Promise(r => setTimeout(r, 400)); // nothing else is on its way
      for (const e of emitted) {
        expect(e.event).toBe('marks-changed');
        expect(e.payload).toEqual({ nSesid: SES, kinds: expect.any(Array), by: ME, atMs: expect.any(Number) });
      }
      // The fact is shared with FRIEND; the Quick Mark is the author's only, so FRIEND never hears about it.
      expect(kindsOf(FRIEND)).toEqual(['F']);
      expect(emitted.map(e => e.room).every(r => r === `U${ME}` || r === `U${FRIEND}`)).toBe(true);
    } finally {
      markEvents.server = null;
    }
  });
});
