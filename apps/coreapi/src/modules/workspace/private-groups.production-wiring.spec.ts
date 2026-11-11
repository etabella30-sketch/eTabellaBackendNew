import { INestApplication, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { getRedisConnectionToken } from '@nestjs-modules/ioredis';
import * as cookieParser from 'cookie-parser';
import * as jwt from 'jsonwebtoken';
import * as request from 'supertest';
import { of } from 'rxjs';
import { DbService } from '@app/global/db/pg/db.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { WorkspaceModule } from './workspace.module';

const SECRET = 'workspace-module-test-secret';
const USER = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';
const CASE = '33333333-3333-4333-8333-333333333333';
@Module({ imports: [ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }), WorkspaceModule] })
class WorkspaceHarness {}

describe('private-group authenticated event wiring', () => {
  let app: INestApplication;
  const db = { executeRef: jest.fn(async () => ({ success: true, data: [[{ msg: 1, groups: [], assignments: {} }]] })) };
  const kafka = { connect: jest.fn(), close: jest.fn(), emit: jest.fn(() => of({})), send: jest.fn() };
  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [WorkspaceHarness] })
      .overrideProvider(DbService).useValue(db)
      .overrideProvider(RedisDbService).useValue({ getValue: jest.fn(async () => JSON.stringify({ id: 'browser-1', a: false })) })
      .overrideProvider(ConfigService).useValue({ get: (key: string) => key === 'JWT_SECRET' ? SECRET : undefined })
      .overrideProvider(getRedisConnectionToken()).useValue({})
      .overrideProvider('KAFKA_SERVICE').useValue(kafka).compile();
    app = module.createNestApplication({ logger: false }); app.use(cookieParser()); await app.init();
  });
  afterAll(async () => { await app?.close(); });
  beforeEach(() => { db.executeRef.mockClear(); kafka.emit.mockClear(); });

  it('rejects unsigned writes without emitting', async () => {
    const res = await request(app.getHttpServer()).post('/workspace/private-groups').send({ nCaseid: CASE, operation: 'create', cName: 'Private' });
    expect(res.status).toBe(403); expect(db.executeRef).not.toHaveBeenCalled(); expect(kafka.emit).not.toHaveBeenCalled();
  });
  it('uses the signed-in actor for both the write and the metadata-free event', async () => {
    const token = jwt.sign({ userId: USER, broweserId: 'browser-1' }, SECRET);
    const res = await request(app.getHttpServer()).post('/workspace/private-groups').set('Cookie', `access_token=${token}`)
      .send({ nCaseid: CASE, nMasterid: OTHER, operation: 'create', cName: 'Private' });
    expect(res.status).toBe(201);
    expect(db.executeRef).toHaveBeenCalledWith('workspace_private_groups', expect.objectContaining({ nMasterid: USER }));
    expect(kafka.emit).toHaveBeenCalledWith('private-groups-changed', { userId: USER });
  });
});
