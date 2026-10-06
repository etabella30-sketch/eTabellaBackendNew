import { INestApplication, MiddlewareConsumer, Module, NestModule, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import * as jwt from 'jsonwebtoken';
import * as request from 'supertest';
import { DbService } from '@app/global/db/pg/db.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { HttpErrorFilter } from '@app/global/middleware/exception';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';
import { CALLER_TEAMS_SQL } from '@app/permissions';
import { CloudPlatformModule, LegacyEnvelope } from '@app/platform-cloud';
import { CoreTeamUsersController, TEAM_USERS_LEGACY_SHAPES, TeamUsersCoreHttpModule, TeamUsersService } from '@app/rt-features/team-users';
import { CALLER_TEAM_ROWS, CONFORMANCE_CASE, expectConformantListing, SP_ROWS } from '@app/rt-features/team-users/testing/conformance';

/**
 * G0 characterization of GET common/myteamusers as coreapi serves it (Phase 0 of the shared-libraries plan,
 * 2026-10-06), now against the shared feature that serves it since Phase 5: @app/rt-features' CoreTeamUsersController
 * over TeamUsersService, wired exactly as CommonModule and the app root wire them (JwtMiddleware by controller class,
 * CloudPlatformModule over the mocked DbService, the legacy shape of this route, main.ts's global ValidationPipe +
 * HttpErrorFilter). Every answer below is the one the hand-written route gave, byte for byte. Two things the move
 * changed below the HTTP surface, both recorded here: the SP is called with the schema named ('public', the default
 * before), and the caller's teams are read once more (CALLER_TEAMS_SQL) for the team rule of @app/permissions.
 */
const SECRET = 'myteamusers-golden-secret';
const ME = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';
const CASE = 'ca5e0000-0000-4000-8000-0000000000c1';
const TEAM = '7ea00000-0000-4000-8000-000000000001';
const MEMBERS = [
  { nUserid: ME, cFname: 'Me', cLname: 'User', cProfile: null, isAdmin: false, cEmail: 'me@x.test', nRoleid: 'r1', cRole: 'Default User', nTeamid: TEAM, cTeamname: 'Claimant', cClr: '#ff3d00' },
  // 2026-10-06 role-less member (LEFT JOIN RoleMaster): listed with a NULL role, never an admin
  { nUserid: OTHER, cFname: 'No', cLname: 'Role', cProfile: null, isAdmin: false, cEmail: 'nr@x.test', nRoleid: null, cRole: null, nTeamid: TEAM, cTeamname: 'Claimant', cClr: '#ff3d00' },
];
const db = {
  executeRef: jest.fn(),
  rowQuery: jest.fn(async (sql: string) => (sql === CALLER_TEAMS_SQL ? { success: true, data: [{ nTeamid: TEAM }] } : { success: false, error: 'unexpected query' })),
};
const rds = { getValue: jest.fn(async () => JSON.stringify({ id: 'browser-1', a: false })), deleteValue: jest.fn() };

@Module({
  imports: [
    CloudPlatformModule.forRoot({ envelope: new LegacyEnvelope({ legacyShape: TEAM_USERS_LEGACY_SHAPES }) }),
    TeamUsersCoreHttpModule.register({ operations: TeamUsersService }),
  ],
  providers: [
    { provide: DbService, useValue: db },
    { provide: RedisDbService, useValue: rds },
    { provide: ConfigService, useValue: { get: (k: string) => (k === 'JWT_SECRET' ? SECRET : undefined) } },
  ],
})
class GoldenModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtMiddleware).forRoutes(CoreTeamUsersController);
  }
}

const token = () => jwt.sign({ userId: ME, broweserId: 'browser-1' }, SECRET);

describe('GET common/myteamusers (coreapi, golden)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const moduleRef = await Test.createTestingModule({ imports: [GoldenModule] }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new HttpErrorFilter());
    await app.init();
  });
  afterAll(async () => { await app?.close(); jest.restoreAllMocks(); });
  beforeEach(() => {
    db.executeRef.mockReset();
    db.executeRef.mockResolvedValue({ success: true, data: [MEMBERS] });
    db.rowQuery.mockClear();
  });

  const get = (query: Record<string, string>, auth = true) => {
    const req = request(app.getHttpServer()).get('/common/myteamusers').query(query);
    return auth ? req.set('Authorization', 'Bearer ' + token()) : req;
  };

  it('returns the SP rows unchanged and calls the public SP with the caller from the token, even when the client sends another nMasterid', async () => {
    const res = await get({ nCaseid: CASE, nMasterid: OTHER });
    expect(res.status).toBe(200);
    expect(res.body).toEqual(MEMBERS);
    expect(db.executeRef).toHaveBeenCalledTimes(1);
    expect(db.executeRef).toHaveBeenCalledWith('common_my_team_user', { nCaseid: CASE, nMasterid: ME }, 'public');
    expect(db.rowQuery).toHaveBeenCalledWith(CALLER_TEAMS_SQL, [CASE, ME]);
  });

  it('injects the caller when nMasterid is omitted', async () => {
    await get({ nCaseid: CASE });
    expect(db.executeRef).toHaveBeenCalledWith('common_my_team_user', { nCaseid: CASE, nMasterid: ME }, 'public');
  });

  it('G2 conformance: the same fixtures answer the same rows on every host (role-less member kept, other team never)', async () => {
    db.executeRef.mockResolvedValue({ success: true, data: [SP_ROWS] });
    db.rowQuery.mockImplementationOnce(async () => ({ success: true, data: [...CALLER_TEAM_ROWS] }));
    const res = await get({ nCaseid: CONFORMANCE_CASE });
    expect(res.status).toBe(200);
    expectConformantListing(res.body);
  });

  it('returns [] for an empty membership cursor', async () => {
    db.executeRef.mockResolvedValue({ success: true, data: [[]] });
    const res = await get({ nCaseid: CASE });
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  // Today's legacy shape: a failed lookup is a 200 with one {msg:-1} row (realtime-server's twin answers 500).
  it('reports an SP failure as 200 [{msg:-1}] (legacy coreapi shape)', async () => {
    db.executeRef.mockResolvedValue({ success: false, error: 'db said no' });
    const res = await get({ nCaseid: CASE });
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ msg: -1, value: 'Failed ', error: 'db said no' }]);
  });

  it("passes the SP's own failure row through as it was (legacy coreapi shape)", async () => {
    db.executeRef.mockResolvedValue({ success: true, data: [[{ msg: -1, error: 'sp said no' }]] });
    const res = await get({ nCaseid: CASE });
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ msg: -1, error: 'sp said no' }]);
  });

  it('refuses a request without a token before touching the database', async () => {
    const res = await get({ nCaseid: CASE }, false);
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: 'A token is required for authentication' });
    expect(db.executeRef).not.toHaveBeenCalled();
  });

  // IsItUUID turns '', 'null', 'undefined' and '0' into null and skips validation: the SP is still called.
  it.each(['', 'null', 'undefined', '0'])('passes nCaseid %j to the SP as null (nullable UUID, today\'s behaviour)', async (nCaseid) => {
    const res = await get({ nCaseid });
    expect(res.status).toBe(200);
    expect(db.executeRef).toHaveBeenCalledWith('common_my_team_user', { nCaseid: null, nMasterid: ME }, 'public');
  });

  it('rejects a malformed nCaseid with 400 before the SP', async () => {
    const res = await get({ nCaseid: 'not-a-uuid' });
    expect(res.status).toBe(400);
    expect(db.executeRef).not.toHaveBeenCalled();
  });

  it('rejects an unknown query key with 400 (forbidNonWhitelisted)', async () => {
    const res = await get({ nCaseid: CASE, extra: 'x' });
    expect(res.status).toBe(400);
    expect(db.executeRef).not.toHaveBeenCalled();
  });
});
