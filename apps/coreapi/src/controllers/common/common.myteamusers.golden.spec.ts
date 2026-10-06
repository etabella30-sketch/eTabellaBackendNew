import { INestApplication, MiddlewareConsumer, Module, NestModule, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import * as jwt from 'jsonwebtoken';
import * as request from 'supertest';
import { DbService } from '@app/global/db/pg/db.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { HttpErrorFilter } from '@app/global/middleware/exception';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';
import { CommonService } from '../../services/common/common.service';
import { CommonController } from './common.controller';

/**
 * G0 characterization of GET common/myteamusers as coreapi serves it today (Phase 0 of the shared-libraries
 * plan, 2026-10-06): status, body and the exact SP call after JwtMiddleware has injected the caller. Phase 5
 * moves this route into @app/rt-features/team-users; the shared controller must keep every answer below
 * byte for byte (legacyShape = coreapi) until a change is approved. Wired like CommonModule: JwtMiddleware,
 * main.ts's global ValidationPipe + HttpErrorFilter; only the database, Redis and config are mocked.
 */
const SECRET = 'myteamusers-golden-secret';
const ME = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';
const CASE = 'ca5e0000-0000-4000-8000-0000000000c1';
const MEMBERS = [
  { nUserid: ME, cFname: 'Me', cLname: 'User', cProfile: null, isAdmin: false, cEmail: 'me@x.test', nRoleid: 'r1', cRole: 'Default User', nTeamid: 't1', cTeamname: 'Claimant', cClr: '#ff3d00' },
  // 2026-10-06 role-less member (LEFT JOIN RoleMaster): listed with a NULL role, never an admin
  { nUserid: OTHER, cFname: 'No', cLname: 'Role', cProfile: null, isAdmin: false, cEmail: 'nr@x.test', nRoleid: null, cRole: null, nTeamid: 't1', cTeamname: 'Claimant', cClr: '#ff3d00' },
];
const db = { executeRef: jest.fn() };
const rds = { getValue: jest.fn(async () => JSON.stringify({ id: 'browser-1', a: false })), deleteValue: jest.fn() };

@Module({
  controllers: [CommonController],
  providers: [
    CommonService,
    { provide: DbService, useValue: db },
    { provide: RedisDbService, useValue: rds },
    { provide: ConfigService, useValue: { get: (k: string) => (k === 'JWT_SECRET' ? SECRET : undefined) } },
  ],
})
class GoldenModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtMiddleware).forRoutes(CommonController);
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
    expect(db.executeRef).toHaveBeenCalledWith('common_my_team_user', { nCaseid: CASE, nMasterid: ME });
  });

  it('injects the caller when nMasterid is omitted', async () => {
    await get({ nCaseid: CASE });
    expect(db.executeRef).toHaveBeenCalledWith('common_my_team_user', { nCaseid: CASE, nMasterid: ME });
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

  it('refuses a request without a token before touching the database', async () => {
    const res = await get({ nCaseid: CASE }, false);
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: 'A token is required for authentication' });
    expect(db.executeRef).not.toHaveBeenCalled();
  });

  // IsItUUID turns '', 'null', 'undefined' and '0' into null and skips validation: today the SP is still called.
  it.each(['', 'null', 'undefined', '0'])('passes nCaseid %j to the SP as null (nullable UUID, today\'s behaviour)', async (nCaseid) => {
    const res = await get({ nCaseid });
    expect(res.status).toBe(200);
    expect(db.executeRef).toHaveBeenCalledWith('common_my_team_user', { nCaseid: null, nMasterid: ME });
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
