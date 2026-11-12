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
});
