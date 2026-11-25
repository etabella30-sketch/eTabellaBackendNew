import { INestApplication, Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { getRedisConnectionToken } from '@nestjs-modules/ioredis';
import * as cookieParser from 'cookie-parser';
import * as jwt from 'jsonwebtoken';
import * as request from 'supertest';
import { DbService } from '@app/global/db/pg/db.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { CaseModule } from '../../modules/case/case.module';

const SECRET = 'case-module-test-secret';
const USER = '11111111-1111-4111-8111-111111111111';
const FORGED = '22222222-2222-4222-8222-222222222222';
const CASE = '33333333-3333-4333-8333-333333333333';

@Module({ imports: [ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }), CaseModule] })
class CaseHarness {}

describe('production CaseModule deletion access control', () => {
  let app: INestApplication;
  let caseAdmin = false;
  const db = {
    rowQuery: jest.fn(async () => ({ success: true, data: caseAdmin ? [{ '?column?': 1 }] : [] })),
    executeRef: jest.fn(async () => ({ success: true, data: [[{ msg: 1 }]] })),
  };

  beforeAll(async () => {
    const testing = await Test.createTestingModule({ imports: [CaseHarness] })
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
  beforeEach(() => { caseAdmin = false; jest.clearAllMocks(); });
  const token = () => jwt.sign({ userId: USER, broweserId: 'browser-1' }, SECRET);

  it('rejects an unsigned deletion before database access', async () => {
    const res = await request(app.getHttpServer()).post('/case/casedelete').send({ nCaseid: CASE });
    expect(res.status).toBe(403);
    expect(db.rowQuery).not.toHaveBeenCalled();
    expect(db.executeRef).not.toHaveBeenCalled();
  });

  it('denies deletion when the signed-in user is not a case admin', async () => {
    const res = await request(app.getHttpServer()).post('/case/casedelete')
      .set('Cookie', `access_token=${token()}`).send({ nCaseid: CASE, nMasterid: FORGED });
    expect(res.status).toBe(403);
    expect(db.rowQuery).toHaveBeenCalledWith(expect.any(String), expect.arrayContaining([CASE, USER]));
    expect(db.executeRef).not.toHaveBeenCalled();
  });

  it('allows a case admin and passes the signed-in actor to the delete operation', async () => {
    caseAdmin = true;
    const res = await request(app.getHttpServer()).post('/case/casedelete')
      .set('Cookie', `access_token=${token()}`).send({ nCaseid: CASE, nMasterid: FORGED });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ msg: 1 });
    expect(db.executeRef).toHaveBeenCalledWith('admin_case_delete', expect.objectContaining({ nCaseid: CASE, nMasterid: USER }));
  });
});
