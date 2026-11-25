import { INestApplication, Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { getRedisConnectionToken } from '@nestjs-modules/ioredis';
import * as cookieParser from 'cookie-parser';
import * as jwt from 'jsonwebtoken';
import * as request from 'supertest';
import { DbService } from '@app/global/db/pg/db.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { PermissionModule } from '../../modules/permission/permission.module';

const SECRET = 'permission-wiring-test-secret';
const USER = '11111111-1111-4111-8111-111111111111';
const FORGED = '22222222-2222-4222-8222-222222222222';
const CASE = '33333333-3333-4333-8333-333333333333';

@Module({ imports: [ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }), PermissionModule] })
class ProductionPermissionHarness {}

describe('production PermissionModule access control', () => {
  let app: INestApplication;
  let caseAdmin = false;
  const db = {
    rowQuery: jest.fn(async () => ({ success: true, data: caseAdmin ? [{ '?column?': 1 }] : [] })),
    executeRef: jest.fn(async () => ({ success: true, data: [[{ msg: 1 }]] })),
  };

  beforeAll(async () => {
    const testing = await Test.createTestingModule({ imports: [ProductionPermissionHarness] })
      .overrideProvider(DbService).useValue(db)
      .overrideProvider(RedisDbService).useValue({ getValue: jest.fn(async () => JSON.stringify({ id: 'browser-1', a: false })) })
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
  beforeEach(() => { caseAdmin = false; db.rowQuery.mockClear(); db.executeRef.mockClear(); });
  const token = () => jwt.sign({ userId: USER, broweserId: 'browser-1' }, SECRET);

  it('denies a non-admin permission change before running a write', async () => {
    const res = await request(app.getHttpServer()).post('/permission/resetpermission')
      .set('Cookie', `access_token=${token()}`).send({ nCaseid: CASE, nMasterid: FORGED });
    expect(res.status).toBe(403);
    expect(db.rowQuery).toHaveBeenCalledWith(expect.any(String), expect.arrayContaining([CASE, USER]));
    expect(db.executeRef).not.toHaveBeenCalled();
  });

  it('allows a case admin and uses the authenticated user as actor', async () => {
    caseAdmin = true;
    const res = await request(app.getHttpServer()).post('/permission/resetpermission')
      .set('Cookie', `access_token=${token()}`).send({ nCaseid: CASE, nMasterid: FORGED });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ msg: 1 });
    expect(db.executeRef).toHaveBeenCalledWith('pm_reset_permission', expect.objectContaining({ nCaseid: CASE, nMasterid: USER }));
  });

  it('lets a signed-in non-admin read their own case permissions', async () => {
    const res = await request(app.getHttpServer()).get('/permission/casepermission')
      .query({ nCaseid: CASE, nMasterid: FORGED }).set('Cookie', `access_token=${token()}`);
    expect(res.status).toBe(200);
    expect(db.rowQuery).not.toHaveBeenCalled();
    expect(db.executeRef).toHaveBeenCalledWith('pm_get_case_permission', expect.objectContaining({ nCaseid: CASE, nMasterid: USER }));
  });
});
