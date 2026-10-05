import { RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { RouteInfo } from '@nestjs/common/interfaces';
import { SessionController } from '../controllers/session/session.controller';
import { TranscriptController } from '../controllers/transcript/transcript.controller';
import { SyncController } from '../controllers/sync/sync.controller';
import { IssueController } from '../controllers/issue/issue.controller';
import { MarknavController } from '../controllers/marknav/marknav.controller';
import { FeedController } from '../controllers/feed/feed.controller';
import { UploadController } from '../controllers/upload/upload.controller';
import { CaseTupleController } from '../controllers/case-tuple/case-tuple.controller';
import { FactController } from '../controllers/fact/fact.controller';
import { DoclinkController } from '../controllers/doclink/doclink.controller';
import { FactsheetController } from '../controllers/factsheet/factsheet.controller';
import { RealtimeServerModule } from '../realtime-server.module';
import { TranscriptModule } from '../modules/transcript/transcript.module';
import {
  RealtimeAdminMiddleware,
  RealtimeAuthInjectMiddleware,
  RealtimeAuthMiddleware,
  RealtimeServiceOrAdminMiddleware,
  RealtimeTargetUserMiddleware,
  RealtimeVenueAuthMiddleware,
} from './realtime-auth.middleware';
import {
  SERVICE_OR_ADMIN_ROUTES,
  SESSION_ADMIN_ROUTES,
  TARGET_USER_ROUTES,
  TRANSCRIPT_ADMIN_ROUTES,
  UPLOAD_ADMIN_ROUTES,
  VENUE_SESSION_ROUTES,
} from './realtime-auth.routes';

/** Every (method, path) a controller serves, lower-cased like Express matching. */
function routesOf(controller: any): Set<string> {
  const prefix = String(Reflect.getMetadata(PATH_METADATA, controller) ?? '');
  const out = new Set<string>();
  for (const name of Object.getOwnPropertyNames(controller.prototype)) {
    const handler = controller.prototype[name];
    if (typeof handler !== 'function' || name === 'constructor') continue;
    const path = Reflect.getMetadata(PATH_METADATA, handler);
    const method = Reflect.getMetadata(METHOD_METADATA, handler);
    if (path === undefined || method === undefined) continue;
    const full = [prefix, path].filter(p => p && p !== '/').join('/').replace(/\/+/g, '/').toLowerCase();
    out.add(`${method}:${full}`);
  }
  return out;
}

const key = (r: RouteInfo) => `${r.method}:${r.path.toLowerCase()}`;
const post = (path: string): RouteInfo => ({ path, method: RequestMethod.POST });
const get = (path: string): RouteInfo => ({ path, method: RequestMethod.GET });

/**
 * Non-GET routes that are deliberately left on the plain login check (RealtimeAuthMiddleware /
 * RealtimeAuthInjectMiddleware). Adding a write route to SessionController or TranscriptController
 * fails the classification test below until it is put in a gated group or reviewed in here.
 */
const BROWSER_ALLOWED: { route: RouteInfo; reason: string }[] = [
  { route: post('session/log/join'), reason: 'legacy RT feed logs the caller joining a session; nUserid is the token user and the handler requires session membership (session-access-gate.ts)' },
  { route: post('transcript/annothighlightexport'), reason: "legacy RT feed export of the caller's own marks; nMasterid is injected from the token and the handler requires session membership (session-access-gate.ts)" },
  { route: post('session/getSessionsByCaseIds'), reason: 'read only: the session lists of many cases in one request (RT Production); POST only for the id list, and each case passes the getSessionsByCaseId audience rule (casesCallerCanList, session-access-gate.ts)' },
];

function recordingConsumer() {
  const calls: { middleware: any[]; exclude: any[]; forRoutes: any[] }[] = [];
  const consumer: any = {
    apply: (...middleware: any[]) => {
      const entry = { middleware, exclude: [] as any[], forRoutes: [] as any[] };
      calls.push(entry);
      const chain: any = {
        exclude: (...routes: any[]) => { entry.exclude.push(...routes); return chain; },
        forRoutes: (...routes: any[]) => { entry.forRoutes.push(...routes); return consumer; },
      };
      return chain;
    },
  };
  return { consumer, calls };
}

describe('realtime auth route lists', () => {
  const session = routesOf(SessionController);
  const transcript = routesOf(TranscriptController);
  const upload = routesOf(UploadController);

  it.each([
    ['VENUE_SESSION_ROUTES', VENUE_SESSION_ROUTES, session],
    ['SERVICE_OR_ADMIN_ROUTES', SERVICE_OR_ADMIN_ROUTES, session],
    ['TARGET_USER_ROUTES', TARGET_USER_ROUTES, session],
    ['SESSION_ADMIN_ROUTES', SESSION_ADMIN_ROUTES, session],
    ['TRANSCRIPT_ADMIN_ROUTES', TRANSCRIPT_ADMIN_ROUTES, transcript],
    ['UPLOAD_ADMIN_ROUTES', UPLOAD_ADMIN_ROUTES, upload],
  ])('%s names real handlers with the right HTTP method', (_name, list, served) => {
    for (const route of list as RouteInfo[]) {
      expect(served).toContain(key(route));
    }
  });

  it('keeps the venue, target and admin groups disjoint', () => {
    const groups = [VENUE_SESSION_ROUTES, SERVICE_OR_ADMIN_ROUTES, TARGET_USER_ROUTES, SESSION_ADMIN_ROUTES, UPLOAD_ADMIN_ROUTES].map(g => g.map(key));
    const all = groups.flat();
    expect(new Set(all).size).toBe(all.length);
  });

  it.each([
    'session/eclipse',
    'session/checkforrunningsession',
    'session/publishfile',
    'session/checkduplicacy',
    'session/deleteConnetivityLog',
  ])('puts POST %s behind the global-admin gate', (path) => {
    expect(SESSION_ADMIN_ROUTES.map(key)).toContain(key(post(path)));
  });

  it('puts GET session/eclipse/credential (clear-text Eclipse password) behind the global-admin gate', () => {
    expect(SESSION_ADMIN_ROUTES.map(key)).toContain(key(get('session/eclipse/credential')));
  });

  it.each([
    'transcript/html-file-to-doc-stream',
    'transcript/generate-file-index',
  ])('puts POST %s behind the global-admin gate', (path) => {
    expect(TRANSCRIPT_ADMIN_ROUTES.map(key)).toContain(key(post(path)));
  });

  it.each([
    'upload',
    'upload/transcript-file',
  ])('puts POST %s behind the global-admin gate', (path) => {
    expect(UPLOAD_ADMIN_ROUTES.map(key)).toContain(key(post(path)));
  });
});

describe('non-GET route classification', () => {
  const groups: [string, RouteInfo[]][] = [
    ['venue', VENUE_SESSION_ROUTES],
    ['service-or-admin', SERVICE_OR_ADMIN_ROUTES],
    ['target-user', TARGET_USER_ROUTES],
    ['session-admin', SESSION_ADMIN_ROUTES],
    ['transcript-admin', TRANSCRIPT_ADMIN_ROUTES],
    ['upload-admin', UPLOAD_ADMIN_ROUTES],
    ['browser-allowed', BROWSER_ALLOWED.map(b => b.route)],
  ];
  const groupsOf = (route: string) => groups.filter(([, list]) => list.map(key).includes(route)).map(([name]) => name);
  const writesOf = (controller: any) => [...routesOf(controller)].filter(r => !r.startsWith(`${RequestMethod.GET}:`)).sort();

  it.each([
    ['SessionController', SessionController, 'session/eclipse'],
    ['TranscriptController', TranscriptController, 'transcript/html-file-to-doc-stream'],
  ])('every non-GET %s route is in exactly one reviewed group', (_name, controller, known) => {
    const writes = writesOf(controller);
    // Guard against a vacuous pass if the metadata walk stops finding handlers.
    expect(writes).toContain(key(post(known)));
    expect(writes.filter(r => groupsOf(r).length === 0)).toEqual([]);
    expect(writes.filter(r => groupsOf(r).length > 1)).toEqual([]);
  });

  it('every UploadController route, of any method, is in exactly one reviewed group', () => {
    const all = [...routesOf(UploadController)].sort();
    // Guard against a vacuous pass if the metadata walk stops finding handlers.
    expect(all).toEqual(expect.arrayContaining([key(post('upload')), key(post('upload/transcript-file'))]));
    expect(all.filter(r => groupsOf(r).length === 0)).toEqual([]);
    expect(all.filter(r => groupsOf(r).length > 1)).toEqual([]);
  });

  it('only lists real non-GET routes as browser-allowed, each with a reason', () => {
    const writes = new Set([...writesOf(SessionController), ...writesOf(TranscriptController)]);
    for (const { route, reason } of BROWSER_ALLOWED) {
      expect(writes).toContain(key(route));
      expect(reason.trim().length).toBeGreaterThan(10);
    }
  });
});

describe('RealtimeServerModule.configure', () => {
  const { consumer, calls } = recordingConsumer();
  new RealtimeServerModule().configure(consumer);
  const find = (mw: any) => calls.find(c => c.middleware.includes(mw));

  it('puts every browser-facing controller behind the JWT middleware, minus the venue/target/service routes', () => {
    const browser = find(RealtimeAuthMiddleware);
    expect(browser.forRoutes).toEqual(expect.arrayContaining(
      [IssueController, MarknavController, FeedController, UploadController, CaseTupleController, SessionController]));
    expect(browser.forRoutes).not.toContain(SyncController);
    expect(browser.exclude.map(key).sort()).toEqual(
      [...VENUE_SESSION_ROUTES, ...SERVICE_OR_ADMIN_ROUTES, ...TARGET_USER_ROUTES].map(key).sort());
  });

  it('registers the admin gate after the JWT middleware', () => {
    const authIndex = calls.findIndex(c => c.middleware.includes(RealtimeAuthMiddleware));
    const adminIndex = calls.findIndex(c => c.middleware.includes(RealtimeAdminMiddleware));
    expect(adminIndex).toBeGreaterThan(authIndex);
    expect(calls[adminIndex].forRoutes).toEqual([...SESSION_ADMIN_ROUTES, ...UPLOAD_ADMIN_ROUTES]);
  });

  it('gates both upload routes to global admins behind the JWT middleware that covers UploadController', () => {
    const browser = find(RealtimeAuthMiddleware);
    const admin = find(RealtimeAdminMiddleware);
    expect(browser.forRoutes).toContain(UploadController);
    const excluded = browser.exclude.map(key);
    for (const route of UPLOAD_ADMIN_ROUTES) {
      expect(admin.forRoutes.map(key)).toContain(key(route));
      expect(excluded).not.toContain(key(route));
    }
  });

  it('wires the venue, service-or-admin and target-user rules', () => {
    expect(find(RealtimeVenueAuthMiddleware).forRoutes).toEqual([SyncController, ...VENUE_SESSION_ROUTES]);
    expect(find(RealtimeServiceOrAdminMiddleware).forRoutes).toEqual(SERVICE_OR_ADMIN_ROUTES);
    expect(find(RealtimeTargetUserMiddleware).forRoutes).toEqual(TARGET_USER_ROUTES);
  });
});

describe('TranscriptModule.configure', () => {
  it('covers transcript/fact/doclink/factsheet with the injecting JWT middleware, then gates admin writes', () => {
    const { consumer, calls } = recordingConsumer();
    new TranscriptModule().configure(consumer);
    expect(calls[0].middleware).toEqual([RealtimeAuthInjectMiddleware]);
    expect(calls[0].forRoutes).toEqual([TranscriptController, FactController, DoclinkController, FactsheetController]);
    expect(calls[1].middleware).toEqual([RealtimeAdminMiddleware]);
    expect(calls[1].forRoutes).toEqual(TRANSCRIPT_ADMIN_ROUTES);
    expect(TRANSCRIPT_ADMIN_ROUTES.every(r => r.method !== RequestMethod.GET)).toBe(true);
  });
});
