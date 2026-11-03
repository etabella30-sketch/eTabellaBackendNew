import { INestApplication, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { getRedisConnectionToken } from '@nestjs-modules/ioredis';
import * as cookieParser from 'cookie-parser';
import * as jwt from 'jsonwebtoken';
import * as request from 'supertest';
import { DbService } from '@app/global/db/pg/db.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { AuthModule } from './auth.module';

const SECRET = 'auth-production-wiring-test-secret';
const USER = '11111111-1111-4111-8111-111111111111';

@Module({ imports: [ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }), AuthModule] })
class ProductionAuthHarness {}

describe('production AuthModule session validation', () => {
  let app: INestApplication;
  const redis = { getValue: jest.fn() };
  const db = { executeRef: jest.fn(async () => ({ success: true, data: [[{ nUserid: USER }]] })) };

  beforeAll(async () => {
    const testing = await Test.createTestingModule({ imports: [ProductionAuthHarness] })
      .overrideProvider(DbService).useValue(db)
      .overrideProvider(RedisDbService).useValue(redis)
      .overrideProvider(ConfigService).useValue({ get: (key: string) => key === 'JWT_SECRET' ? SECRET : undefined })
      .overrideProvider(getRedisConnectionToken()).useValue({})
      .overrideProvider('KAFKA_SERVICE').useValue({ connect: jest.fn(), close: jest.fn(), emit: jest.fn(), send: jest.fn() })
      .compile();
    app = testing.createNestApplication({ logger: false });
    app.use(cookieParser());
    await app.init();
  });

  afterAll(async () => { await app?.close(); });
  beforeEach(() => { redis.getValue.mockReset(); db.executeRef.mockClear(); });

  it('refuses a signed token when its browser session has been replaced', async () => {
    redis.getValue.mockResolvedValue(JSON.stringify({ id: 'different-browser' }));
    const token = jwt.sign({ userId: USER, broweserId: 'browser-1' }, SECRET);
    const res = await request(app.getHttpServer()).get('/auth/validate').set('Cookie', `access_token=${token}`);
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ msg: -1, message: 'Old Token' });
    expect(db.executeRef).not.toHaveBeenCalled();
  });

  it('returns user information only for the current browser session', async () => {
    redis.getValue.mockResolvedValue(JSON.stringify({ id: 'browser-1' }));
    const token = jwt.sign({ userId: USER, broweserId: 'browser-1' }, SECRET);
    const res = await request(app.getHttpServer()).get('/auth/validate').set('Cookie', `access_token=${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ msg: 1, userDetail: { nUserid: USER } });
    expect(db.executeRef).toHaveBeenCalledWith('userdetail', { nMasterid: USER });
  });
});
