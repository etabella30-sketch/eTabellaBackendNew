import { INestApplication, Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { getRedisConnectionToken } from '@nestjs-modules/ioredis';
import * as cookieParser from 'cookie-parser';
import * as jwt from 'jsonwebtoken';
import * as request from 'supertest';
import { DbService } from '@app/global/db/pg/db.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { CloudPlatformModule } from '@app/platform-cloud';
import { IndividualModule } from './individual.module';

const SECRET = 'individual-module-test-secret';
const USER = '11111111-1111-4111-8111-111111111111';
const FORGED = '22222222-2222-4222-8222-222222222222';
const FACT = '33333333-3333-4333-8333-333333333333';

@Module({ imports: [ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }), CloudPlatformModule.forRoot(), IndividualModule] })
class ProductionIndividualHarness {}

describe('production IndividualModule fact route wiring', () => {
  let app: INestApplication;
  const db = {
    executeRef: jest.fn(async (name: string) => {
      if (name === 'fact_delete') return { success: true, data: [[{ msg: 1, value: 'Deleted' }]] };
      throw new Error(`Unexpected stored procedure: ${name}`);
    }),
    rowQuery: jest.fn(async () => ({ success: true, data: [] })),
  };

  beforeAll(async () => {
    const testing = await Test.createTestingModule({ imports: [ProductionIndividualHarness] })
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
  beforeEach(() => { db.executeRef.mockClear(); });

  it('rejects unsigned delete requests before they reach the database', async () => {
    const res = await request(app.getHttpServer()).post('/fact/factdelete').send({ nFSid: FACT });
    expect(res.status).toBe(403);
    expect(db.executeRef).not.toHaveBeenCalled();
  });

  it('uses the signed-in actor rather than a client-supplied actor for deletion', async () => {
    const token = jwt.sign({ userId: USER, broweserId: 'browser-1' }, SECRET);
    const res = await request(app.getHttpServer()).post('/fact/factdelete')
      .set('Cookie', `access_token=${token}`).send({ nFSid: FACT, nMasterid: FORGED });
    expect(res.status).toBe(201);
    expect(res.body).toEqual([{ msg: 1, value: 'Deleted' }]);
    expect(db.executeRef).toHaveBeenCalledWith('fact_delete', expect.objectContaining({ nFSid: FACT, nMasterid: USER }));
  });
});
