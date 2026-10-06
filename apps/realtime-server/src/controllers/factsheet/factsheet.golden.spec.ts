/**
 * G0 characterization of realtime-server's Full Fact editor routes (`factsheet/*`). Written on 2026-10-06 against
 * the app's own FactsheetController + FactsheetService and run green there; it now runs, with the SAME expectations,
 * against the shared @app/rt-features/factsheet feature mounted as TranscriptModule mounts it (Phase 7a of the
 * shared-libraries plan). A real Nest HTTP stack: RealtimeAuthInjectMiddleware as TranscriptModule wires it (JWT
 * cookie, Redis session stub), the CloudPlatformModule ports over a stub DbService, main.ts's global ValidationPipe
 * options and HttpErrorFilter; every SP call is recorded (name, params as passed, schema), and the share
 * notifications are checked as the Kafka `notification` messages UtilityService.sendNotification used to emit
 * (platform-cloud's notificationMessages builds them from the EVENT_DELIVERY event).
 */
import { INestApplication, InternalServerErrorException, Logger, MiddlewareConsumer, Module, NestModule, NotFoundException, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import * as cookieParser from 'cookie-parser';
import * as jwt from 'jsonwebtoken';
import * as request from 'supertest';
import { DomainEvent, EVENT_DELIVERY, HttpErrorFilter, responseArgumentsHost } from '@app/api-kernel';
import { DbService } from '@app/global/db/pg/db.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { CloudPlatformModule, LegacyEnvelope, notificationMessages } from '@app/platform-cloud';
import { FACTSHEET_LEGACY_SHAPES, FactsheetController, FactsheetLiveController, FactsheetRealtimeHttpModule, FactsheetService } from '@app/rt-features/factsheet';
import {
  CASE,
  DETAIL_ROW,
  EXPECTED_HAPPY,
  EXPECTED_NOT_VIEWABLE,
  EXPECTED_SHARE_MESSAGE,
  FACT,
  FRIEND,
  ISSUE,
  ME,
  NOT_VIEWABLE_ROW,
  PERMITTED_ROW,
  SAVE_BODY,
  SHARE_NOTICE,
  SHARED_VIEWER_ROW,
} from '@app/rt-features/factsheet/testing/conformance';
import { RealtimeAuthInjectMiddleware } from '../../middleware/realtime-auth.middleware';

const SECRET = 'factsheet-golden-secret';

/** What the stub database answers per SP (executeRef's `{ success, data }`), and the calls it saw. */
type SpAnswer = { success: true; data: unknown[][] } | { success: false; error: unknown } | Error;
const ok = (...cursors: unknown[][]): SpAnswer => ({ success: true, data: cursors });
const script: Record<string, SpAnswer> = {};
const calls: Array<{ fn: string; params: unknown; schema?: string }> = [];
const db = {
  executeRef: jest.fn(async (fn: string, params: Record<string, unknown>, schema?: string) => {
    calls.push({ fn, params: JSON.parse(JSON.stringify(params)), ...(schema === undefined ? {} : { schema }) });
    const answer = script[fn];
    if (!answer) throw new Error(`golden: no scripted answer for ${fn}`);
    if (answer instanceof Error) throw answer;
    return answer;
  }),
  rowQuery: jest.fn(async () => ({ success: true, data: [] })),
};
/** The Kafka `notification` messages the share notifications become (recorded, not sent). */
const messages: unknown[] = [];
const delivery = { publish: (e: DomainEvent) => void (e.kind === 'notification' && messages.push(...notificationMessages(e))) };
const session = { id: 'browser-1', a: false };
const rds = { getValue: jest.fn(async () => JSON.stringify(session)), deleteValue: jest.fn() };

function happy(): void {
  for (const key of Object.keys(script)) delete script[key];
  Object.assign(script, {
    fact_permissions: ok([{ ...PERMITTED_ROW }]),
    factsheet_detail: ok([{ ...DETAIL_ROW }]),
    factsheet_shared: ok(EXPECTED_HAPPY.shared as unknown[]),
    factsheet_issues: ok(EXPECTED_HAPPY.issues as unknown[]),
    factsheet_contacts: ok(EXPECTED_HAPPY.contacts as unknown[]),
    factsheet_tasks: ok(...(EXPECTED_HAPPY.tasks as unknown[][])),
    factsheet_links: ok(EXPECTED_HAPPY.links as unknown[]),
    getfact_annotation: ok(EXPECTED_HAPPY.annotation as unknown[]),
    factsheet_submit: ok([{ ...(EXPECTED_HAPPY.save as object) }]),
    fact_insert_team: ok([{ jNotify: [{ ...SHARE_NOTICE }] }]),
    factsheet_unshare_withme: ok([{ ...(EXPECTED_HAPPY.unshare as object) }]),
    factsheet_delete: ok([{ ...(EXPECTED_HAPPY.remove as object) }]),
  });
}

@Module({
  imports: [
    CloudPlatformModule.forRoot({ envelope: new LegacyEnvelope({ legacyShape: FACTSHEET_LEGACY_SHAPES }) }),
    FactsheetRealtimeHttpModule.register({ operations: FactsheetService, mount: 'live' }),
  ],
  providers: [
    { provide: DbService, useValue: db },
    { provide: RedisDbService, useValue: rds },
    { provide: ConfigService, useValue: { get: (k: string) => (k === 'JWT_SECRET' ? SECRET : undefined) } },
  ],
})
class FactsheetProbeModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RealtimeAuthInjectMiddleware).forRoutes(FactsheetController, FactsheetLiveController);
  }
}

/** The HttpErrorFilter body a live `throw new <Exception>(message)` produces, timestamp normalised. */
function liveError(exception: Error): unknown {
  let body: unknown;
  const res = { status: () => res, json: (b: unknown) => { body = b; return res; } } as never;
  new HttpErrorFilter().catch(exception, responseArgumentsHost(res));
  return { ...(body as object), timestamp: '<timestamp>' };
}
const normalise = (body: unknown): unknown => (body && typeof body === 'object' && 'timestamp' in (body as object) ? { ...(body as object), timestamp: '<timestamp>' } : body);

const READS = ['detail', 'shared', 'issues', 'contacts', 'tasks', 'links', 'factannotation'] as const;
const KEY_OF: Record<(typeof READS)[number], string> = { detail: 'detail', shared: 'shared', issues: 'issues', contacts: 'contacts', tasks: 'tasks', links: 'links', factannotation: 'annotation' };
const SP_OF: Record<(typeof READS)[number], string> = { detail: 'factsheet_detail', shared: 'factsheet_shared', issues: 'factsheet_issues', contacts: 'factsheet_contacts', tasks: 'factsheet_tasks', links: 'factsheet_links', factannotation: 'getfact_annotation' };
const PERMISSION_CALL = { fn: 'fact_permissions', params: { nUserid: ME, nFSid: FACT } };
const readCall = (fn: string, extra: Record<string, unknown> = {}) => ({ fn, params: { nFSid: FACT, nMasterid: ME, ...extra }, schema: 'realtime' });

describe('realtime-server factsheet/* golden (G0, 2026-10-06)', () => {
  let app: INestApplication;
  const token = (userId = ME) => jwt.sign({ userId, broweserId: 'browser-1' }, SECRET);
  const get = (path: string, as = ME) => request(app.getHttpServer()).get(`/factsheet/${path}`).set('Cookie', `access_token=${token(as)}`);
  const post = (path: string, body: object, as = ME) => request(app.getHttpServer()).post(`/factsheet/${path}`).set('Cookie', `access_token=${token(as)}`).send(body);

  beforeAll(async () => {
    Logger.overrideLogger(false);
    const moduleRef = await Test.createTestingModule({ imports: [FactsheetProbeModule] }).overrideProvider(EVENT_DELIVERY).useValue(delivery).compile();
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
    happy();
    calls.length = 0;
    messages.length = 0;
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it.each(READS)('GET %s: the rows for a caller who may view the fact; the lookup then the read, the token user as nMasterid', async (route) => {
    const res = await get(`${route}?nFSid=${FACT}`);
    expect([res.status, res.body]).toEqual([200, EXPECTED_HAPPY[KEY_OF[route]]]);
    expect(res.headers['content-type']).toMatch(/^application\/json/);
    expect(calls).toEqual([PERMISSION_CALL, readCall(SP_OF[route], route === 'tasks' ? { ref: 3 } : {})]);
  });

  it('a client-sent nMasterid is overwritten by the token user before any SP runs (R4)', async () => {
    const res = await get(`detail?nFSid=${FACT}&nMasterid=${FRIEND}`);
    expect(res.status).toBe(200);
    expect(calls).toEqual([PERMISSION_CALL, readCall('factsheet_detail')]);
  });

  it.each(READS)('GET %s: a caller who may not view the fact gets the empty answer (200) and no reader SP runs', async (route) => {
    script.fact_permissions = ok([{ ...NOT_VIEWABLE_ROW }]);
    const res = await get(`${route}?nFSid=${FACT}`);
    expect([res.status, res.body]).toEqual([200, EXPECTED_NOT_VIEWABLE[KEY_OF[route]]]);
    expect(res.text).not.toContain('secret');
    expect(calls).toEqual([PERMISSION_CALL]);
  });

  it.each(READS)('GET %s: a failed permission lookup is 500 "Could not check access to this fact", an unknown fact 404 "Fact not found"', async (route) => {
    script.fact_permissions = { success: false, error: 'db down' };
    const down = await get(`${route}?nFSid=${FACT}`);
    expect([down.status, normalise(down.body)]).toEqual([500, liveError(new InternalServerErrorException('Could not check access to this fact'))]);
    script.fact_permissions = new Error('connection reset');
    const thrown = await get(`${route}?nFSid=${FACT}`);
    expect([thrown.status, normalise(thrown.body)]).toEqual([500, liveError(new InternalServerErrorException('Could not check access to this fact'))]);
    script.fact_permissions = ok([]);
    const unknown = await get(`${route}?nFSid=${FACT}`);
    expect([unknown.status, normalise(unknown.body)]).toEqual([404, liveError(new NotFoundException('Fact not found'))]);
    expect(calls.map((c) => c.fn)).toEqual(['fact_permissions', 'fact_permissions', 'fact_permissions']);
  });

  it.each(READS)('GET %s: a failed reader SP answers the failure row with 200, never an empty list', async (route) => {
    script[SP_OF[route]] = { success: false, error: 'relation missing' };
    const res = await get(`${route}?nFSid=${FACT}`);
    expect([res.status, res.body]).toEqual([200, { msg: -1, value: 'Fetch failed', error: 'relation missing' }]);
  });

  it('validation: a non-UUID nFSid and an unknown query key are the global pipe\'s 400; an absent nFSid reaches the lookup and is "not found"', async () => {
    const bad = await get('detail?nFSid=f1');
    expect(bad.status).toBe(400);
    expect(JSON.parse(bad.body.detailedError).message).toEqual(['nFSid must be a UUID']);
    const extra = await get(`detail?nFSid=${FACT}&foo=1`);
    expect(extra.status).toBe(400);
    expect(JSON.parse(extra.body.detailedError).message).toEqual(['property foo should not exist']);
    expect(calls).toEqual([]);
    script.fact_permissions = ok([]);
    const absent = await get('detail');
    expect(absent.status).toBe(404);
    expect(calls).toEqual([{ fn: 'fact_permissions', params: { nUserid: ME } }]);
  });

  it('GET permissions: the whole row to a viewer (owner named), the refusal row to anyone else, the lookup failure row and the empty answer as they were', async () => {
    script.fact_permissions = ok([{ ...SHARED_VIEWER_ROW }]);
    const viewer = await get(`permissions?nFSid=${FACT}`);
    expect([viewer.status, viewer.body]).toEqual([200, SHARED_VIEWER_ROW]);
    script.fact_permissions = ok([{ ...NOT_VIEWABLE_ROW }]);
    const refused = await get(`permissions?nFSid=${FACT}`);
    expect([refused.status, refused.body]).toEqual([200, { msg: -1, value: 'You are not permitted to view this fact' }]);
    expect(refused.text).not.toContain(NOT_VIEWABLE_ROW.nUserid);
    script.fact_permissions = { success: false, error: 'db down' };
    const down = await get(`permissions?nFSid=${FACT}`);
    expect([down.status, down.body]).toEqual([200, { msg: -1, error: 'db down' }]);
    script.fact_permissions = ok([]);
    const unknown = await get(`permissions?nFSid=${FACT}`);
    expect([unknown.status, unknown.text]).toEqual([200, '']);
    expect(calls).toEqual([PERMISSION_CALL, PERMISSION_CALL, PERMISSION_CALL, PERMISSION_CALL]);
  });

  it('POST save: 201 "Fact updated"; the fact written with the token user as nMasterid, the share list replaced and the recipient notified', async () => {
    const res = await post('save', { ...SAVE_BODY });
    expect([res.status, res.body]).toEqual([201, EXPECTED_HAPPY.save]);
    const params = { ...SAVE_BODY, nMasterid: ME };
    expect(calls).toEqual([
      PERMISSION_CALL,
      { fn: 'factsheet_submit', params, schema: 'realtime' },
      { fn: 'fact_insert_team', params, schema: 'realtime' },
    ]);
    expect(messages).toEqual([EXPECTED_SHARE_MESSAGE]);
  });

  it('POST save: no share replacement without bIsUserUpdated or without reshare rights', async () => {
    await post('save', { ...SAVE_BODY, bIsUserUpdated: false });
    expect(calls.map((c) => c.fn)).toEqual(['fact_permissions', 'factsheet_submit']);
    calls.length = 0;
    script.fact_permissions = ok([{ ...SHARED_VIEWER_ROW, bCanEdit: true, bCanReshare: false }]);
    await post('save', { ...SAVE_BODY });
    expect(calls.map((c) => c.fn)).toEqual(['fact_permissions', 'factsheet_submit']);
    expect(messages).toEqual([]);
  });

  it('POST save: refused without bCanEdit (a lookup fault or an unknown fact included) as a 201 failure row; the SP failure row; a failed share replacement keeps "Fact updated"', async () => {
    script.fact_permissions = ok([{ ...SHARED_VIEWER_ROW }]);
    const viewer = await post('save', { ...SAVE_BODY });
    expect([viewer.status, viewer.body]).toEqual([201, { msg: -1, value: 'You are not authorized to edit this fact' }]);
    script.fact_permissions = { success: false, error: 'db down' };
    expect((await post('save', { ...SAVE_BODY })).body).toEqual({ msg: -1, value: 'You are not authorized to edit this fact' });
    script.fact_permissions = ok([]);
    expect((await post('save', { ...SAVE_BODY })).body).toEqual({ msg: -1, value: 'You are not authorized to edit this fact' });
    expect(calls.map((c) => c.fn)).toEqual(['fact_permissions', 'fact_permissions', 'fact_permissions']);
    happy();
    script.factsheet_submit = { success: false, error: 'constraint' };
    expect((await post('save', { ...SAVE_BODY })).body).toEqual({ msg: -1, value: 'Failed to save', error: 'constraint' });
    happy();
    script.fact_insert_team = { success: false, error: 'team missing' };
    const kept = await post('save', { ...SAVE_BODY });
    expect([kept.status, kept.body]).toEqual([201, EXPECTED_HAPPY.save]);
    expect(messages).toEqual([]);
  });

  it('POST save: a body missing a required field, or carrying an unknown one, is the global pipe\'s 400 before any SP', async () => {
    const { jT: _omitted, ...withoutText } = SAVE_BODY;
    const missing = await post('save', withoutText);
    expect(missing.status).toBe(400);
    expect(JSON.parse(missing.body.detailedError).message).toEqual(['jT must be a string']);
    const unknown = await post('save', { ...SAVE_BODY, nope: 1 });
    expect(unknown.status).toBe(400);
    expect(calls).toEqual([]);
  });

  it('POST unshare and POST delete: the SP row with the token user as nMasterid, no permission check; the failure row when the SP fails', async () => {
    const unshared = await post('unshare', { nFSid: FACT });
    expect([unshared.status, unshared.body]).toEqual([201, EXPECTED_HAPPY.unshare]);
    const deleted = await post('delete', { nFSid: FACT, nMasterid: FRIEND });
    expect([deleted.status, deleted.body]).toEqual([201, EXPECTED_HAPPY.remove]);
    expect(calls).toEqual([readCall('factsheet_unshare_withme'), readCall('factsheet_delete')]);
    script.factsheet_unshare_withme = { success: false, error: 'x' };
    script.factsheet_delete = { success: false, error: 'y' };
    expect((await post('unshare', { nFSid: FACT })).body).toEqual({ msg: -1, value: 'Failed to save', error: 'x' });
    expect((await post('delete', { nFSid: FACT })).body).toEqual({ msg: -1, value: 'Failed to save', error: 'y' });
  });

  it('no sign-in: 403 from the auth middleware (as before the move), nothing runs', async () => {
    const res = await request(app.getHttpServer()).get(`/factsheet/detail?nFSid=${FACT}`);
    expect(res.status).toBe(403);
    expect(calls).toEqual([]);
  });

  it('the fixture ids are the ones the conformance shares with the lib spec', () => {
    expect([CASE, ISSUE].every((id) => /^[0-9a-f-]{36}$/.test(id))).toBe(true);
  });
});
