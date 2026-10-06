import { INestApplication, Logger, MiddlewareConsumer, Module, NestModule, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { importJWK, JWK, SignJWT } from 'jose';
import * as jwt from 'jsonwebtoken';
import * as request from 'supertest';
import { EDGE_TOKEN_ISSUER, EDGE_TOKEN_TYP, edgeAudience, generateEdgeSigningKey } from '@app/edge-token';
import { DbService } from '@app/global/db/pg/db.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { HttpErrorFilter } from '@app/global/middleware/exception';
import { CALLER_TEAMS_SQL } from '@app/permissions';
import { CloudPlatformModule, LegacyEnvelope } from '@app/platform-cloud';
import { RealtimeTeamUsersController, TEAM_USERS_LEGACY_SHAPES, TeamUsersRealtimeHttpModule, TeamUsersService } from '@app/rt-features/team-users';
import { CALLER_TEAM_ROWS, CONFORMANCE_CASE, expectConformantListing, SP_ROWS } from '@app/rt-features/team-users/testing/conformance';
import { RealtimeAuthInjectMiddleware } from '../../middleware/realtime-auth.middleware';
import { EDGE_BOX_CASES_SQL, EDGE_USER_ACTIVE_SQL } from '../../middleware/realtime-edge-token';

/*
 * GET factsheet/teamusers through the real HTTP pipeline, now served by the shared team-users feature (Phase 5 of
 * the shared-libraries plan): @app/rt-features' RealtimeTeamUsersController over TeamUsersService, wired as
 * TranscriptModule and the app root wire them (RealtimeAuthInjectMiddleware by controller class, CloudPlatformModule
 * over the mocked DbService, this route's legacy 500 shape, main.ts's global ValidationPipe + HttpErrorFilter). Every
 * answer is the one the hand-written route gave. Only the database and Redis storage boundary are replaced.
 */
const BOX = 'b0c5b0c5-0000-4000-8000-0000000000b1';
const ME = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';
const CASE = 'ca5e0000-0000-4000-8000-0000000000c1';
const OTHER_CASE = 'ca5e0000-0000-4000-8000-0000000000c2';
const TEAM = '7ea00000-0000-4000-8000-000000000001';
const MEMBERS = [{ nUserid: OTHER, cFname: 'Team', cLname: 'Member', nTeamid: TEAM }];
const env: Record<string, string> = {};
const rds = {
  keyExists: jest.fn(async () => 0),
  getValue: jest.fn(async () => JSON.stringify({ id: 'browser-1', a: false })),
  deleteValue: jest.fn(),
};
const db = {
  executeRef: jest.fn(),
  rowQuery: jest.fn(async (sql: string, params: any[]) => {
    if (sql === EDGE_USER_ACTIVE_SQL) return { success: true, data: [{ bActive: true }] };
    if (sql === EDGE_BOX_CASES_SQL) return { success: true, data: params[1].filter((id: string) => id === CASE).map((nCaseid: string) => ({ nCaseid })) };
    if (sql === CALLER_TEAMS_SQL) return { success: true, data: params[0] === CONFORMANCE_CASE ? [...CALLER_TEAM_ROWS] : [{ nTeamid: TEAM }] };
    throw new Error('Unexpected scope query');
  }),
};

@Module({
  imports: [
    CloudPlatformModule.forRoot({ envelope: new LegacyEnvelope({ legacyShape: TEAM_USERS_LEGACY_SHAPES }) }),
    TeamUsersRealtimeHttpModule.register({ operations: TeamUsersService }),
  ],
  providers: [
    { provide: RedisDbService, useValue: rds },
    { provide: ConfigService, useValue: { get: (key: string) => env[key] } },
    { provide: DbService, useValue: db },
  ],
})
class TeamUsersModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RealtimeAuthInjectMiddleware).forRoutes(RealtimeTeamUsersController);
  }
}

describe('GET factsheet/teamusers through the real HTTP pipeline', () => {
  let app: INestApplication;
  let signingKey: JWK;
  let edgeToken: string;
  let cloudToken: string;

  beforeAll(async () => {
    signingKey = await generateEdgeSigningKey('teamusers-key');
    const { d: privatePart, ...publicKey } = signingKey as any;
    Object.assign(env, { EDGE_ENABLED: '1', EDGE_TOKEN_JWKS: JSON.stringify({ keys: [publicKey] }), JWT_SECRET: 'teamusers-test-secret' });
    const now = Math.floor(Date.now() / 1000);
    edgeToken = await new SignJWT({
      iss: EDGE_TOKEN_ISSUER, sub: ME, userId: ME, aud: edgeAudience(BOX), edge: BOX,
      cases: [CASE, CONFORMANCE_CASE], scope: 'rt', jti: randomUUID(), iat: now - 5, exp: now + 3600, auth_time: now - 10,
    }).setProtectedHeader({ alg: 'ES256', typ: EDGE_TOKEN_TYP, kid: 'teamusers-key' }).sign(await importJWK(signingKey, 'ES256'));
    cloudToken = jwt.sign({ userId: ME, broweserId: 'browser-1' }, env.JWT_SECRET, { expiresIn: '1h' });
    const moduleRef = await Test.createTestingModule({ imports: [TeamUsersModule] }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new HttpErrorFilter());
    await app.init();
  });

  beforeEach(() => {
    db.executeRef.mockReset();
    db.executeRef.mockResolvedValue({ success: true, data: [MEMBERS] });
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => jest.restoreAllMocks());
  afterAll(async () => { await app?.close(); });

  const get = (query: Record<string, any>, token = edgeToken) => request(app.getHttpServer())
    .get('/factsheet/teamusers').query(query).set('Authorization', 'Bearer ' + token);

  it('returns the existing same-team public SP rows unchanged, using the Edge token caller rather than a forged identity', async () => {
    const res = await get({ nCaseid: CASE, nMasterid: OTHER });
    expect(res.status).toBe(200);
    expect(res.body).toEqual(MEMBERS);
    expect(db.executeRef).toHaveBeenCalledTimes(1);
    expect(db.executeRef).toHaveBeenCalledWith('common_my_team_user', { nCaseid: CASE, nMasterid: ME }, 'public');
  });

  it('supports the existing cloud JWT and injects the caller when nMasterid is omitted', async () => {
    const res = await get({ nCaseid: CASE }, cloudToken);
    expect(res.status).toBe(200);
    expect(db.executeRef).toHaveBeenCalledWith('common_my_team_user', { nCaseid: CASE, nMasterid: ME }, 'public');
  });

  it('G2 conformance: the same fixtures answer the same rows as coreapi and the box (role-less member kept, other team never)', async () => {
    db.executeRef.mockResolvedValue({ success: true, data: [SP_ROWS] });
    const res = await get({ nCaseid: CONFORMANCE_CASE });
    expect(res.status).toBe(200);
    expectConformantListing(res.body);
  });

  it('refuses a case outside the Edge token before looking up any team members', async () => {
    const res = await get({ nCaseid: OTHER_CASE });
    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ cCode: 'case_not_allowed' });
    expect(db.executeRef).not.toHaveBeenCalled();
  });

  it('refuses an unauthenticated recipient lookup before reaching the SP', async () => {
    const res = await request(app.getHttpServer()).get('/factsheet/teamusers').query({ nCaseid: CASE });
    expect(res.status).toBe(403);
    expect(db.executeRef).not.toHaveBeenCalled();
  });

  it.each([undefined, '', 'null', 'not-a-uuid'])('requires a real nCaseid UUID (%s)', async (nCaseid) => {
    const res = await get(nCaseid === undefined ? {} : { nCaseid }, cloudToken);
    expect(res.status).toBe(400);
    expect(db.executeRef).not.toHaveBeenCalled();
  });

  it('returns [] only for a successful empty membership cursor', async () => {
    db.executeRef.mockResolvedValue({ success: true, data: [[]] });
    const res = await get({ nCaseid: CASE });
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it.each([
    { success: false, error: 'private database diagnostic' },
    { success: true, data: [] },
    { success: true, data: [[{ msg: -1, error: 'private database diagnostic' }]] },
  ])('reports a failed or malformed lookup as HTTP500 rather than an empty membership list', async (result) => {
    db.executeRef.mockResolvedValue(result);
    const res = await get({ nCaseid: CASE });
    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain('private database diagnostic');
    expect(res.body).toMatchObject({ statusCode: 500 });
    expect(JSON.parse(res.body.detailedError)).toMatchObject({ message: 'Failed to fetch team members' });
  });

  it('reports a thrown database error as HTTP500 without exposing its diagnostic', async () => {
    db.executeRef.mockRejectedValue(new Error('private database diagnostic'));
    const res = await get({ nCaseid: CASE });
    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain('private database diagnostic');
  });
});
