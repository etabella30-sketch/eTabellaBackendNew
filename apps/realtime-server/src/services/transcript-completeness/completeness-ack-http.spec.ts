jest.mock('child_process', () => {
  const actual = jest.requireActual('child_process');
  return { ...actual, exec: jest.fn() };
});

import { exec } from 'child_process';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as path from 'path';
import { INestApplication, Logger, MiddlewareConsumer, Module, NestModule, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import * as jwt from 'jsonwebtoken';
import * as request from 'supertest';
import { DbService } from '@app/global/db/pg/db.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { IssueController } from '../../controllers/issue/issue.controller';
import { SessionController } from '../../controllers/session/session.controller';
import { TranscriptController } from '../../controllers/transcript/transcript.controller';
import { RealtimeAdminMiddleware, RealtimeAuthInjectMiddleware, RealtimeAuthMiddleware } from '../../middleware/realtime-auth.middleware';
import {
  SERVICE_OR_ADMIN_ROUTES, SESSION_ADMIN_ROUTES, TARGET_USER_ROUTES, TRANSCRIPT_ADMIN_ROUTES, VENUE_SESSION_ROUTES,
} from '../../middleware/realtime-auth.routes';
import { ConversionJsService } from '../conversion.js/conversion.js.service';
import { EclipseSessionService } from '../eclipse-session/eclipse-session.service';
import { ExportService } from '../export/export.service';
import { ExporttranscriptService } from '../exporttranscript/exporttranscript.service';
import { GenerateWordIndexService } from '../exporttranscript/generate_word_index/generate_word_index.service';
import { FileproviderService } from '../fileprovider/fileprovider.service';
import { IssueService } from '../issue/issue.service';
import { SessionService } from '../session/session.service';
import { TranscriptService } from '../transcript/transcript.service';
import { TranscriptpublishService } from '../transcript/transcript_publish.service';
import { UtilityService } from '../utility/utility.service';
import { SESSION_PROVENANCE_SQL } from './transcript-completeness.service';

/*
 * D16 'W' acknowledgement over HTTP (spec 4.4, 6.3 RC-4 "W needs acknowledgement"). Each of the four routes
 * that reach the completeness gate runs through the real HTTP stack: the auth middleware its module wires
 * (RealtimeAuthInjectMiddleware for TranscriptController, RealtimeAuthMiddleware for Issue/Session, then
 * RealtimeAdminMiddleware on the admin routes), the global ValidationPipe with main.ts's options
 * (whitelist + forbidNonWhitelisted + transform), the route's real DTO and controller, and the real
 * service and gate. Only the DB, Redis, fs, Kafka, the Python transfer, the renderer and wkhtmltopdf are
 * stubs. The venue session is sealed with warnings ('W'): bAckWarnings must pass validation and the gate
 * must record et_rtedge_warn_ack for the TOKEN user (a client-sent id never wins) before the route does
 * its work. Before AckWarningsFlag was declared on these DTOs, every such request was a 400.
 */

const SECRET = 'd16-ack-http-secret';
const ME = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';
const SES = '5e551011-0000-4000-8000-0000000000c1';
const NAV_SES = '5e551011-0000-4000-8000-0000000000c2';
const ROW_SES = '5e551011-0000-4000-8000-0000000000c3';
const CASE = 'ca5e1011-0000-4000-8000-0000000000c1';
const TRANS = '7a5e1011-0000-4000-8000-0000000000c1';

const ROOT = 'rt-d16-ack-http';
const BASE = `${ROOT}/realtime-transcripts/`;
const CONFIG: Record<string, string> = {
  REALTIME_PATH: BASE,
  ASSETS: `${ROOT}/assets/`,
  ANNOT_TRANSFER_DIR: `${ROOT}/annot-transfer`,
};

const VENUE = { bEverEdge: true, cApply: null, nPrevPartSesid: null };
const INCIDENTS = [{ kind: 'CONCURRENT_CAT', level: 'warning' }];

/** r1 / r2 of et_rt_transcript_completeness for an unsplit venue session sealed with warnings. */
const SEALED_WITH_WARNINGS = {
  success: true,
  data: [
    [{ msg: 1, value: 'NEEDS_ACK', nSesid: SES, cReason: 'NEEDS_ACK', cSyncState: 'W', cFeedSource: 'E', bEverEdge: true, jIncidents: INCIDENTS, cSealNote: null, bUploadPending: false }],
    [{ nOrder: 1, nSesid: SES, nPartNo: null, cFeedSource: 'E', cSyncState: 'W', cReason: 'NEEDS_ACK', nPendingOrphans: 0, bCurrent: true }],
  ],
};
const ACK_OK = { success: true, data: [[{ msg: 1, value: 'Warnings acknowledged' }]] };
const WARN_ACK_FOR_TOKEN_USER: Call = ['db.executeRef', 'rtedge_warn_ack', { nSesid: SES, nMasterid: ME }];

const codes = (text: string) => Array.from(text).map((c) => c.charCodeAt(0));
const PAGE_1 = JSON.stringify([['10:00:01:00', codes('Closed line'), 0, 'C', 0, 0, 'u1']]);
const TEMPLATE_HTML = '<html><body><table><tr><td class="main-content replacable-content"></td></tr></table><div id="main-content-placeholder"></div>';
const CASE_ROW = { nSesid: ROW_SES, cStatus: 'C', cCasename: 'Smith v Jones', cName: 'Day 3', dDay: 'Wednesday', dSessionDt: '1 Oct 2026' };

type Call = [string, ...any[]];

/** One request's recorded steps and the SP answers it may use; reset before every test. */
const state: { calls: Call[]; sp: Record<string, any> } = { calls: [], sp: {} };

// Plain functions (not jest.fn) so restoreAllMocks between tests never strips an implementation.
const db = {
  async rowQuery(sql: string, params: any[]) {
    state.calls.push(['db.rowQuery', sql, params]);
    if (sql === SESSION_PROVENANCE_SQL) return { success: true, data: [VENUE] };
    // caseOfSession (session-access-gate): every session here belongs to CASE.
    if (sql.includes('"nCaseid" FROM "RSessionMaster"')) return { success: true, data: [{ nCaseid: CASE }] };
    throw new Error(`unexpected query ${sql}`);
  },
  async executeRef(name: string, body: any) {
    // SessionService.onApplicationBootstrap, once at app.init().
    if (name === 'realtime_upcomming_sessions') return { success: true, data: [[]] };
    state.calls.push(['db.executeRef', name, { ...body }]);
    const answer = state.sp[name];
    if (answer === undefined) throw new Error(`unexpected SP ${name}`);
    return answer;
  },
};

const rds = { getValue: async () => JSON.stringify({ id: 'browser-1', a: true }), deleteValue: async () => undefined };
const quiet = { info() { }, error() { }, debug() { }, warn() { } };
const kafka = { sendMessage: (_topic: string, value: any) => { state.calls.push(['kafka', value?.data?.data?.status]); } };
const feedData = {
  readSessionData: async (nSesid: string) => { state.calls.push(['feedData.readSessionData', nSesid]); return {}; },
  sessionEnd: async () => true,
};
const annotTransfer = {
  notifyTransferComplete: (nSesid: string) => { state.calls.push(['annotTransfer.notifyTransferComplete', nSesid]); },
  startTransfer: async (nSesid: string) => { state.calls.push(['annotTransfer.startTransfer', nSesid]); return { msg: 1 }; },
};
const serviceConfig = { get: (key: string) => CONFIG[key] };

/** The real gated services, built in beforeAll (ExportService creates its export folder when constructed). */
const services: { publish?: TranscriptpublishService; issue?: IssueService; session?: SessionService } = {};

@Module({
  controllers: [TranscriptController, IssueController, SessionController],
  providers: [
    { provide: DbService, useValue: db },
    { provide: RedisDbService, useValue: rds },
    { provide: ConfigService, useValue: { get: (k: string) => (k === 'JWT_SECRET' ? SECRET : undefined) } },
    { provide: TranscriptService, useValue: {} },
    { provide: ExporttranscriptService, useValue: {} },
    { provide: GenerateWordIndexService, useValue: {} },
    { provide: FileproviderService, useValue: {} },
    { provide: EclipseSessionService, useValue: {} },
    { provide: TranscriptpublishService, useFactory: () => services.publish },
    { provide: IssueService, useFactory: () => services.issue },
    { provide: SessionService, useFactory: () => services.session },
  ],
})
class AckHttpModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // TranscriptModule's wiring.
    consumer.apply(RealtimeAuthInjectMiddleware).forRoutes(TranscriptController);
    consumer.apply(RealtimeAdminMiddleware).forRoutes(...TRANSCRIPT_ADMIN_ROUTES);
    // RealtimeServerModule's wiring, for the two of its controllers mounted here.
    consumer.apply(RealtimeAuthMiddleware)
      .exclude(...VENUE_SESSION_ROUTES, ...SERVICE_OR_ADMIN_ROUTES, ...TARGET_USER_ROUTES)
      .forRoutes(IssueController, SessionController);
    consumer.apply(RealtimeAdminMiddleware).forRoutes(...SESSION_ADMIN_ROUTES);
  }
}

/** main.ts's global pipe options, read from its source so this spec cannot drift from it unnoticed. */
const MAIN_PIPE = /useGlobalPipes\(new ValidationPipe\(\{([\s\S]*?)\}\)\)/.exec(fs.readFileSync(path.join(__dirname, '../../main.ts'), 'utf8'))?.[1] ?? '';

interface Route {
  name: string;
  path: string;
  /** A valid body for the route's DTO; client-sent user ids name someone else (OTHER). */
  body: Record<string, any>;
  sp: Record<string, any>;
  cPurpose: 'P' | 'X';
  /** The step that shows the route did its work after the gate let it through. */
  done: Call;
}

const ROUTES: Route[] = [
  {
    name: 'POST transcript/publish (TranscriptPublishReq)',
    path: '/transcript/publish',
    body: { cTransid: TRANS, cPath: `t_${TRANS}.TXT`, nCaseid: CASE, nSesid: SES, nMasterid: OTHER, isIgnoreErr: true, errorCount: 0 },
    sp: { transcript_publish: { success: true, data: [[{ msg: 1, value: 'Transcript published', nSesid: SES }]] } },
    cPurpose: 'P',
    done: ['transferAnnotations', SES, ME],
  },
  {
    name: 'POST transcript/annothighlightexport (getAnnotHighlightEEP, Transcript.interface)',
    path: '/transcript/annothighlightexport',
    body: {
      nSessionid: SES, nSesid: NAV_SES, nCaseid: CASE, nUserid: OTHER, nMasterid: OTHER, cTranscript: 'N', cIsDemo: 'N',
      jIssues: [], jHIssues: [], jPages: [], bCoverpg: true, cLayout: 'FULL_PAGE',
    },
    sp: {
      get_transcript_by_sesid: { success: true, data: [[{ msg: 1, cTransid: TRANS, cProtocol: 'C' }]] },
      realtime_export_othercasedetail: { success: true, data: [[CASE_ROW]] },
      get_transcript_detail: { success: true, data: [[{ cTransid: TRANS, nSesid: SES, cPath: `t_${TRANS}.json`, cThemeid: null }]] },
    },
    cPurpose: 'X',
    done: ['generateTranscriptDetail'],
  },
  {
    name: 'POST issue/annothighlightexport (getAnnotHighlightEEP, issue.interface)',
    path: '/issue/annothighlightexport',
    body: {
      nSessionid: SES, nCaseid: CASE, nUserid: OTHER, cCasename: 'Day 3', cUsername: 'Jane Doe', cTranscript: 'N', cIsDemo: 'N',
      jIssues: [], jHIssues: [], jPages: [], bCoverpg: true, bQfact: false, bQmark: false, bTimestamp: true,
      cOrientation: 'P', cQMsize: 'S', cQFsize: 'S', cPgsize: 'A4',
    },
    sp: {
      realtime_get_issue_annotation_highlight_export: { success: true, data: [[], []] },
      realtime_export_othercasedetail: { success: true, data: [[CASE_ROW]] },
      realtime_export_annotations_summary: { success: true, data: [[], []] },
    },
    cPurpose: 'X',
    done: ['exec'],
  },
  {
    name: 'POST session/updatetranscriptstatus (updateTransStatusMDL)',
    path: '/session/updatetranscriptstatus',
    body: { nSesid: SES, nCaseid: CASE, cFlag: 'P', cProtocol: 'B', nUserid: OTHER },
    sp: { realtime_transcript_upload_status: { success: true, data: [[{ msg: 1, value: 'Transcript status updated', nSesid: SES }]] } },
    cPurpose: 'P',
    done: ['annotTransfer.startTransfer', SES],
  },
];

const isOurs = (p: any) => {
  const s = String(p).replace(/\\/g, '/');
  return s.includes(ROOT) || s.startsWith('data/');
};

function stubIo() {
  const realExists = fs.existsSync;
  const realRead = fs.readFileSync;
  const realReaddir = fs.readdirSync;
  const realWrite = fs.writeFileSync;
  jest.spyOn(fs, 'existsSync').mockImplementation(((p: any) => (isOurs(p) ? true : realExists(p))) as any);
  jest.spyOn(fs, 'readdirSync').mockImplementation(((p: any, ...rest: any[]) => (isOurs(p) ? ['page_1.json'] : (realReaddir as any)(p, ...rest))) as any);
  jest.spyOn(fs, 'readFileSync').mockImplementation(((p: any, ...rest: any[]) => {
    if (!isOurs(p)) return (realRead as any)(p, ...rest);
    const file = path.basename(String(p));
    if (file === 'page_1.json') return PAGE_1;
    if (file === 'htmlTemplate.html') return TEMPLATE_HTML;
    throw new Error(`unexpected read of ${p}`);
  }) as any);
  jest.spyOn(fs, 'writeFileSync').mockImplementation(((p: any, content: any, ...rest: any[]) => {
    if (!isOurs(p)) return (realWrite as any)(p, content, ...rest);
    state.calls.push(['fs.writeFileSync', path.basename(String(p))]);
  }) as any);
  jest.spyOn(fs, 'copyFile').mockImplementation(((src: any, dest: any, cb: any) => { cb(null); }) as any);
  jest.spyOn(fse, 'ensureDir').mockImplementation((async () => undefined) as any);
  (exec as unknown as jest.Mock).mockImplementation((_command: string, cb: (err: any, out?: any) => void) => {
    state.calls.push(['exec']);
    cb(null, { stdout: '', stderr: '' });
  });
  // The Python annotation transfer and the transcript renderer are not under test here.
  jest.spyOn(services.publish, 'transferAnnotations').mockImplementation((async (_file: string, nSesid: string, _t: string, nMasterid: string) => {
    state.calls.push(['transferAnnotations', nSesid, nMasterid]);
    return { msg: 1 };
  }) as any);
  jest.spyOn(services.publish, 'generateTranscriptDetail').mockImplementation((async () => {
    state.calls.push(['generateTranscriptDetail']);
    return { msg: 1, value: 'Transcript detail generated', path: 'x.pdf', name: 'export.pdf' };
  }) as any);
}

describe("D16 'W' acknowledgement over HTTP (bAckWarnings on the gated routes' DTOs)", () => {
  let app: INestApplication;
  const token = jwt.sign({ userId: ME, broweserId: 'browser-1' }, SECRET);
  const nodeEnv = process.env.NODE_ENV;

  const post = (route: Route, extra: Record<string, any> = {}) =>
    request(app.getHttpServer()).post(route.path).set('Authorization', `Bearer ${token}`).send({ ...route.body, ...extra });

  const steps = () => state.calls.map((c) => (c[0] === 'db.executeRef' ? `sp:${c[1]}` : c[0]));
  const indexOf = (call: Call) => state.calls.findIndex((c) => JSON.stringify(c) === JSON.stringify(call));

  beforeAll(async () => {
    const ensureDir = jest.spyOn(fse, 'ensureDir').mockImplementation((async () => undefined) as any);
    services.publish = new TranscriptpublishService(
      serviceConfig as any, db as any, quiet as any, { generateHtml: () => '<html><body></body></html>' } as any,
      { savehtmlToFile: async () => undefined, getThemeDetail: async () => ({}) } as any, kafka as any,
      {} as any, {} as any, {} as any, new ConversionJsService(), feedData as any, {} as any, annotTransfer as any,
    );
    const exportService = new ExportService(new UtilityService({} as any), serviceConfig as any, new ConversionJsService(), db as any, feedData as any);
    services.issue = new IssueService(db as any, exportService);
    // Constructor order: db, dateTimeService, annotTransfer, ios, schedulerService, firebaseService, user, config,
    // issueService, feedData, conversionJs, eclipseSession, edgeAssignPush (optional).
    services.session = new (SessionService as any)(
      db, {}, annotTransfer, { server: { emit: () => true } }, { cancelJob() { }, scheduleTask() { } }, {}, {}, serviceConfig,
      services.issue, feedData, new ConversionJsService(), { removeEclipseRoute: async () => undefined },
    );
    await Promise.resolve();
    ensureDir.mockRestore();

    const moduleRef = await Test.createTestingModule({ imports: [AckHttpModule] }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(() => {
    state.calls = [];
    state.sp = {};
    process.env.NODE_ENV = 'production';
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    stubIo();
  });

  afterEach(() => {
    if (nodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = nodeEnv;
    jest.restoreAllMocks();
    (exec as unknown as jest.Mock).mockReset();
  });

  it("the pipe here is main.ts's: whitelist, forbidNonWhitelisted and transform are all on", () => {
    expect(MAIN_PIPE).toMatch(/whitelist:\s*true/);
    expect(MAIN_PIPE).toMatch(/forbidNonWhitelisted:\s*true/);
    expect(MAIN_PIPE).toMatch(/transform:\s*true/);
  });

  describe.each(ROUTES)('$name', (route) => {
    const gateRead: Call = ['db.executeRef', 'rt_transcript_completeness', { nSesid: SES, cPurpose: route.cPurpose, ref: 2 }];

    it('bAckWarnings: true passes validation; the gate records et_rtedge_warn_ack for the token user, then the route does its work', async () => {
      state.sp = { ...route.sp, rt_transcript_completeness: SEALED_WITH_WARNINGS, rtedge_warn_ack: ACK_OK };
      const res = await post(route, { bAckWarnings: true });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ msg: 1, completeness: { bGated: true, cSyncState: 'W', acknowledged: [SES], bIncomplete: false } });
      // Recorded for the JWT user: the client-sent OTHER was replaced by the auth middleware.
      expect(state.calls).toContainEqual(WARN_ACK_FOR_TOKEN_USER);
      expect(steps().filter((s) => s === 'sp:rtedge_warn_ack')).toHaveLength(1);
      // Gate read, then the acknowledgement, then the route's own work.
      expect(indexOf(gateRead)).toBeGreaterThan(-1);
      expect(indexOf(WARN_ACK_FOR_TOKEN_USER)).toBeGreaterThan(indexOf(gateRead));
      expect(indexOf(route.done)).toBeGreaterThan(indexOf(WARN_ACK_FOR_TOKEN_USER));
    });

    it('without the flag the request is refused with NEEDS_ACK: nothing acknowledged, nothing done', async () => {
      state.sp = { ...route.sp, rt_transcript_completeness: SEALED_WITH_WARNINGS, rtedge_warn_ack: ACK_OK };
      const res = await post(route);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ msg: -1, cCode: 'NEEDS_ACK', bGated: true, cSyncState: 'W', incidents: INCIDENTS });
      expect(indexOf(gateRead)).toBeGreaterThan(-1);
      expect(steps()).not.toContain('sp:rtedge_warn_ack');
      expect(indexOf(route.done)).toBe(-1);
    });

    it("the strings 'true' and 'false' (a form-encoded client) are read as the booleans they name", async () => {
      state.sp = { ...route.sp, rt_transcript_completeness: SEALED_WITH_WARNINGS, rtedge_warn_ack: ACK_OK };
      const acked = await post(route, { bAckWarnings: 'true' });
      expect(acked.status).toBe(201);
      expect(acked.body).toMatchObject({ msg: 1, completeness: { acknowledged: [SES] } });
      expect(state.calls).toContainEqual(WARN_ACK_FOR_TOKEN_USER);

      state.calls = [];
      const refused = await post(route, { bAckWarnings: 'false' });
      expect(refused.status).toBe(201);
      expect(refused.body).toMatchObject({ msg: -1, cCode: 'NEEDS_ACK' });
      expect(steps()).not.toContain('sp:rtedge_warn_ack');
    });

    it('any other value is a 400 before the controller runs, and the DTO still refuses undeclared keys', async () => {
      for (const value of ['yes', 1, { b: true }]) {
        const res = await post(route, { bAckWarnings: value });
        expect(res.status).toBe(400);
        expect(JSON.stringify(res.body.message)).toContain('bAckWarnings must be a boolean value');
      }
      const undeclared = await post(route, { bAckWarningz: true });
      expect(undeclared.status).toBe(400);
      expect(JSON.stringify(undeclared.body.message)).toContain('property bAckWarningz should not exist');
      // Nothing past the pipe ran: no session-access read, no SP, no file step.
      expect(state.calls).toEqual([]);
    });
  });
});
