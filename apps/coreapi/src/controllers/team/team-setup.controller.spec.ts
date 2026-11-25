import { INestApplication, Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { getRedisConnectionToken } from '@nestjs-modules/ioredis';
import * as cookieParser from 'cookie-parser';
import * as jwt from 'jsonwebtoken';
import * as request from 'supertest';
import { DbService } from '@app/global/db/pg/db.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { TeamSetupModule } from '../../modules/team/team-setup.module';

const SECRET = 'team-module-test-secret';
const USER = '11111111-1111-4111-8111-111111111111';
const TARGET = '22222222-2222-4222-8222-222222222222';
const FORGED = '33333333-3333-4333-8333-333333333333';
const CASE = '44444444-4444-4444-8444-444444444444';

@Module({ imports: [ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }), TeamSetupModule] })
class TeamHarness {}

describe('production TeamSetupModule access control', () => {
  let app: INestApplication;
  let admin = false;
  const db = {
    rowQuery: jest.fn(async () => ({ success: true, data: [] })),
    executeRef: jest.fn(async () => ({ success: true, data: [[{ msg: 1 }]] })),
  };
  const redis = {
    getValue: jest.fn(async () => JSON.stringify({ id: 'browser-1', a: admin })),
    deleteValue: jest.fn(async () => undefined),
  };

  beforeAll(async () => {
    const testing = await Test.createTestingModule({ imports: [TeamHarness] })
      .overrideProvider(DbService).useValue(db)
      .overrideProvider(RedisDbService).useValue(redis)
      .overrideProvider(ConfigService).useValue({ get: (key: string) => key === 'JWT_SECRET' ? SECRET : undefined })
      .overrideProvider(getRedisConnectionToken()).useValue({})
      .overrideProvider('KAFKA_SERVICE').useValue({ connect: jest.fn(), close: jest.fn(), emit: jest.fn(), send: jest.fn() })
      .compile();
    app = testing.createNestApplication({ logger: false });
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(async () => { await app?.close(); });
  beforeEach(() => { admin = false; jest.clearAllMocks(); });
  const token = () => jwt.sign({ userId: USER, broweserId: 'browser-1' }, SECRET);

  it('rejects an unsigned user deletion before reaching the database', async () => {
    const res = await request(app.getHttpServer()).post('/team-setup/userdelete')
      .send({ nUserid: TARGET, permission: 'D' });
    expect(res.status).toBe(403);
    expect(db.executeRef).not.toHaveBeenCalled();
  });

  it('rejects a non-admin user deletion even with a forged actor', async () => {
    const res = await request(app.getHttpServer()).post('/team-setup/userdelete')
      .set('Cookie', `access_token=${token()}`).send({ nUserid: TARGET, nMasterid: FORGED, permission: 'D' });
    expect(res.status).toBe(403);
    expect(db.executeRef).not.toHaveBeenCalled();
    expect(redis.deleteValue).not.toHaveBeenCalled();
  });

  it('allows a global admin to delete a user and invalidate that user session', async () => {
    admin = true;
    const res = await request(app.getHttpServer()).post('/team-setup/userdelete')
      .set('Cookie', `access_token=${token()}`).send({ nUserid: TARGET, nMasterid: FORGED, permission: 'D' });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ msg: 1 });
    expect(db.executeRef).toHaveBeenCalledWith('userbuilder', expect.objectContaining({ nUserid: TARGET, nMasterid: USER, permission: 'D' }));
    expect(redis.deleteValue).toHaveBeenCalledWith(`user/${TARGET}`);
  });

  it('denies team assignment to a non-admin before any write', async () => {
    const res = await request(app.getHttpServer()).post('/team-setup/assignteam')
      .set('Cookie', `access_token=${token()}`).send({ nCaseid: CASE, nMasterid: FORGED });
    expect(res.status).toBe(403);
    expect(db.rowQuery).toHaveBeenCalledWith(expect.any(String), expect.arrayContaining([CASE, USER]));
    expect(db.executeRef).not.toHaveBeenCalled();
  });

  // Highlight colour preferences (owner 2026-11-23): a user reads and saves only their own row for a case.
  describe('highlight preferences', () => {
    const A = '55555555-5555-4555-8555-555555555555', B = '66666666-6666-4666-8666-666666666666', C = '77777777-7777-4777-8777-777777777777';
    const valid = () => ({ nCaseid: CASE, bOn: true, cMode: 'M', jMyOrder: [B, A], jCombos: { [`team:${A}+${B}`]: B }, nRev: 3 });
    const get = (query: Record<string, string>) => request(app.getHttpServer()).get('/team-setup/highlight-prefs').set('Cookie', `access_token=${token()}`).query(query);
    const post = (body: unknown) => request(app.getHttpServer()).post('/team-setup/highlight-prefs').set('Cookie', `access_token=${token()}`).send(body as object);

    it('refuses an unsigned read and an unsigned save before reaching the database', async () => {
      expect((await request(app.getHttpServer()).get('/team-setup/highlight-prefs').query({ nCaseid: CASE })).status).toBe(403);
      expect((await request(app.getHttpServer()).post('/team-setup/highlight-prefs').send(valid())).status).toBe(403);
      expect(db.executeRef).not.toHaveBeenCalled();
    });

    it('reads for the signed-in user, never for a forged one', async () => {
      db.executeRef.mockResolvedValueOnce({ success: true, data: [[{ msg: 1, bExists: false, bOn: true, cMode: 'D', jMyOrder: null, jCombos: {}, nRev: 0 }]] } as never);
      const res = await get({ nCaseid: CASE, nMasterid: FORGED });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ msg: 1, bExists: false, bOn: true, cMode: 'D', jMyOrder: null, jCombos: {}, nRev: 0 });
      expect(db.executeRef).toHaveBeenCalledTimes(1);
      expect(db.executeRef).toHaveBeenCalledWith('user_case_highlight_get', expect.objectContaining({ nCaseid: CASE, nMasterid: USER }));
    });

    it('a read needs a case id that is a UUID', async () => {
      expect((await get({})).status).toBe(400);
      expect((await get({ nCaseid: 'c1' })).status).toBe(400);
      expect(db.executeRef).not.toHaveBeenCalled();
    });

    it('saves for the signed-in user, never for a forged one, and passes the preferences as sent', async () => {
      const res = await post({ ...valid(), nMasterid: FORGED });
      expect(res.status).toBe(201);
      expect(db.executeRef).toHaveBeenCalledTimes(1);
      expect(db.executeRef).toHaveBeenCalledWith('user_case_highlight_set', { ...valid(), nMasterid: USER });
    });

    it('accepts "never set" for My ranking and no saved choices', async () => {
      expect((await post({ nCaseid: CASE, bOn: false, cMode: 'D', jMyOrder: null, jCombos: {}, nRev: 0 })).status).toBe(201);
      expect((await post({ nCaseid: CASE, bOn: false, cMode: 'D', jCombos: {}, nRev: 0 })).status).toBe(201);
      expect((await post({ ...valid(), jCombos: { [`private:${A.toUpperCase()}+${B}+${C}`]: C } })).status).toBe(201);
    });

    it.each([
      ['no case', { nCaseid: undefined }],
      ['a case id that is not a UUID', { nCaseid: 'c1' }],
      ['a switch that is not true or false', { bOn: 'yes' }],
      ['an unknown mode', { cMode: 'X' }],
      ['a ranking that is not a list', { jMyOrder: 'a,b' }],
      ['a ranked id that is not a UUID', { jMyOrder: [A, "x'; DROP TABLE"] }],
      ['the same id ranked twice', { jMyOrder: [A, A.toUpperCase()] }],
      ['more than 200 ranked ids', { jMyOrder: Array.from({ length: 201 }, (_, n) => `40000000-0000-4000-8000-${n.toString(16).padStart(12, '0')}`) }],
      ['choices that are a list', { jCombos: [] }],
      ['no choices object', { jCombos: undefined }],
      ['a combination of one id', { jCombos: { [`team:${A}`]: A } }],
      ['a combination of an unknown kind', { jCombos: { [`other:${A}+${B}`]: A } }],
      ['a choice outside its combination', { jCombos: { [`team:${A}+${B}`]: C } }],
      ['a choice that is not text', { jCombos: { [`team:${A}+${B}`]: 5 } }],
      ['more than 500 choices', { jCombos: Object.fromEntries(Array.from({ length: 501 }, (_, n) => [`team:${A}+40000000-0000-4000-8000-${n.toString(16).padStart(12, '0')}`, A])) }],
      ['a negative revision', { nRev: -1 }],
      ['a revision that is not a whole number', { nRev: 1.5 }],
      ['no revision', { nRev: undefined }],
      ['a field the route does not know', { cName: 'x' }],
    ])('refuses %s before reaching the database', async (_label, change) => {
      const res = await post({ ...valid(), ...change });
      expect(res.status).toBe(400);
      expect(db.executeRef).not.toHaveBeenCalled();
    });

    it('a save changed in another window comes back as msg -2 with the stored row', async () => {
      const stored = { msg: -2, value: 'These preferences were changed in another window', bExists: true, bOn: true, cMode: 'D', jMyOrder: null, jCombos: {}, nRev: 9 };
      db.executeRef.mockResolvedValueOnce({ success: true, data: [[stored]] } as never);
      const res = await post(valid());
      expect(res.status).toBe(201);
      expect(res.body).toEqual(stored);
    });

    it('a database failure is reported without its detail', async () => {
      db.executeRef.mockResolvedValueOnce({ success: false, error: 'relation "UserCaseHighlightPrefs" does not exist' } as never);
      expect((await post(valid())).body).toEqual({ msg: -1, value: 'Could not save the highlight preferences' });
      db.executeRef.mockResolvedValueOnce({ success: false, error: 'connection refused 10.0.0.5' } as never);
      expect((await get({ nCaseid: CASE })).body).toEqual({ msg: -1, value: 'Could not read the highlight preferences' });
    });
  });
});
