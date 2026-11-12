import { INestApplication, Module, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import * as cookieParser from 'cookie-parser';
import * as jwt from 'jsonwebtoken';
import * as request from 'supertest';
import { getRedisConnectionToken } from '@nestjs-modules/ioredis';
import { DbService } from '@app/global/db/pg/db.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { LogService } from '@app/global/utility/log/log.service';
import { CloudPlatformModule, LegacyEnvelope } from '@app/platform-cloud';
import { FACTSHEET_LEGACY_SHAPES } from '@app/rt-features/factsheet';
import { EVENT_DELIVERY } from '@app/api-kernel';
import { DOCLINK_DELETE_ACCESS_SQL } from '@app/permissions';
import { QFACT_DELETE_FORBIDDEN } from '@app/permissions';
import { FeedDataService } from '../../services/feed-data/feed-data.service';
import { TranscriptModule } from './transcript.module';

const SECRET = 'transcript-module-test-secret';
const OWNER = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';
const FACT = '33333333-3333-4333-8333-333333333333';
const DOC = '44444444-4444-4444-8444-444444444444';

@Module({ imports: [CloudPlatformModule.forRoot({ envelope: new LegacyEnvelope({ legacyShape: FACTSHEET_LEGACY_SHAPES }) }), TranscriptModule] })
class ProductionTranscriptHarness {}

describe('production TranscriptModule Factsheet wiring', () => {
  let app: INestApplication;
  let qfactExists = true;
  const sqlClient = {
    query: jest.fn(async (sql: string) => {
      if (sql === 'delete-qfact;fetch') {
        qfactExists = false;
        return [{ command: 'FETCH', rows: [{ msg: 1, value: 'Deleted' }] }];
      }
      if (sql.includes('FactMaster')) return { rows: qfactExists ? [{ cFType: 'QF', nUserid: OWNER, nCaseid: FACT }] : [] };
      return { rows: [] };
    }),
    release: jest.fn(),
  };
  // Execute the real database guard and transaction flow with only the PostgreSQL client stubbed.
  const guardedDb = Object.create(DbService.prototype) as DbService;
  (guardedDb as any).pool = { connect: jest.fn(async () => sqlClient) };
  guardedDb.queryBuilder = { buildQuery: jest.fn(async () => 'delete-qfact;fetch') } as never;
  const db = {
    executeRef: jest.fn(async (name: string, params: Record<string, unknown>) => {
      if (name === 'fact_permissions') return { success: true, data: [[{ nFSid: FACT, nUserid: OWNER, bCanView: params.nUserid === OWNER }]] };
      if (name === 'factsheet_detail') return { success: true, data: [[{ nFSid: FACT, jTexts: ['private test note'] }]] };
      if (name === 'doc_delete') return { success: true, data: [[{ msg: 1, value: 'Deleted' }]] };
      if (name === 'factsheet_delete') return guardedDb.executeRef(name, params, 'realtime');
      throw new Error(`Unexpected stored procedure: ${name}`);
    }),
    rowQuery: jest.fn(async (sql: string, params: unknown[]) => ({
      success: true,
      data: sql === DOCLINK_DELETE_ACCESS_SQL ? [{ bAllowed: params[1] === OWNER }] : [],
    })),
  };
  const config = { get: (key: string) => key === 'JWT_SECRET' ? SECRET : undefined };
  const redis = { getValue: jest.fn(async () => JSON.stringify({ id: 'browser-1', a: false })) };

  beforeAll(async () => {
    const testing = await Test.createTestingModule({ imports: [ProductionTranscriptHarness] })
      .overrideProvider(DbService).useValue(db)
      .overrideProvider(RedisDbService).useValue(redis)
      .overrideProvider(LogService).useValue({ info: jest.fn(), warn: jest.fn(), error: jest.fn() })
      .overrideProvider(ConfigService).useValue(config)
      .overrideProvider(getRedisConnectionToken()).useValue({})
      .overrideProvider('KAFKA_SERVICE').useValue({ connect: jest.fn(), close: jest.fn(), emit: jest.fn(), send: jest.fn() })
      .overrideProvider(EVENT_DELIVERY).useValue({ publish: jest.fn() })
      .overrideProvider(FeedDataService).useValue({})
      .compile();
    app = testing.createNestApplication({ logger: false });
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(async () => { await app?.close(); });
  beforeEach(() => { qfactExists = true; db.executeRef.mockClear(); db.rowQuery.mockClear(); sqlClient.query.mockClear(); });

  const token = (userId: string) => jwt.sign({ userId, broweserId: 'browser-1' }, SECRET);
  it('authenticates the owner and serves the fact through the production module', async () => {
    const res = await request(app.getHttpServer()).get(`/factsheet/detail?nFSid=${FACT}`).set('Cookie', `access_token=${token(OWNER)}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ nFSid: FACT, jTexts: ['private test note'] });
    expect(db.executeRef.mock.calls.map(([name]) => name)).toEqual(['fact_permissions', 'factsheet_detail']);
  });

  it('does not fetch fact details for another authenticated user', async () => {
    const res = await request(app.getHttpServer()).get(`/factsheet/detail?nFSid=${FACT}`).set('Cookie', `access_token=${token(OTHER)}`);
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toContain('private test note');
    expect(db.executeRef.mock.calls.map(([name]) => name)).toEqual(['fact_permissions']);
  });

  it('routes DocLink deletes through the owner gate in the production module', async () => {
    const refused = await request(app.getHttpServer()).post('/doclink/docdelete')
      .set('Cookie', `access_token=${token(OTHER)}`).send({ nDocid: DOC, nMasterid: OWNER });
    expect(refused.status).toBe(403);
    expect(db.executeRef).not.toHaveBeenCalled();

    const allowed = await request(app.getHttpServer()).post('/doclink/docdelete')
      .set('Cookie', `access_token=${token(OWNER)}`).send({ nDocid: DOC });
    expect(allowed.status).toBe(201);
    expect(allowed.body).toEqual([{ msg: 1, value: 'Deleted' }]);
    expect(db.executeRef).toHaveBeenCalledWith('doc_delete', expect.objectContaining({ nDocid: DOC, nMasterid: OWNER }), 'realtime');
  });

  it('refuses another user deleting a private QFact and lets its owner delete it', async () => {
    const refused = await request(app.getHttpServer()).post('/factsheet/delete')
      .set('Cookie', `access_token=${token(OTHER)}`).send({ nFSid: FACT, nMasterid: OWNER });
    expect(refused.status).toBe(201);
    expect(refused.body).toMatchObject({ msg: -1, error: QFACT_DELETE_FORBIDDEN });
    expect(qfactExists).toBe(true);
    expect(sqlClient.query).not.toHaveBeenCalledWith('delete-qfact;fetch');

    const allowed = await request(app.getHttpServer()).post('/factsheet/delete')
      .set('Cookie', `access_token=${token(OWNER)}`).send({ nFSid: FACT });
    expect(allowed.status).toBe(201);
    expect(allowed.body).toEqual({ msg: 1, value: 'Deleted' });
    expect(qfactExists).toBe(false);
  });
});
