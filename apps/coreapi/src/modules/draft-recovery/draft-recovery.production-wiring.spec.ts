import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import * as jwt from 'jsonwebtoken';
import * as request from 'supertest';
import { DbService } from '@app/global/db/pg/db.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { draftRecoveryRecordKey } from '@app/global/db/redis-db/draft-recovery-keys';
import { SharedModule } from '../../shared/shared.module';
import { DraftRecoveryModule } from './draft-recovery.module';

const USER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const OTHER = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const CASE = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const DOC = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const SECRET = 'synthetic-jwt-secret';
let access = true;
let records = new Map<string, string>();

const db = {
  rowQuery: jest.fn(async () => ({ success: true, data: [{ allowed: access }] })),
  executeRef: jest.fn(async () => ({ success: true })),
};
const redis = {
  getValue: jest.fn(async (key: string) => key.startsWith('user/') ? JSON.stringify({ id: 'browser', a: false }) : records.get(key) ?? null),
  getDraftRecoveryEpoch: jest.fn(async () => '0'),
  putDraftRecoveryIfEpoch: jest.fn(async (user: string, _b: string, _h: string, id: string, epoch: string, value: string) => {
    if (epoch !== '0') return false;
    records.set(draftRecoveryRecordKey(user, id), value); return true;
  }),
  getDraftRecoveryIfEpoch: jest.fn(async (user: string, _b: string, _h: string, id: string, epoch: string) => epoch === '0' ? records.get(draftRecoveryRecordKey(user, id)) ?? null : null),
  deleteDraftRecoveryIfEpoch: jest.fn(async (user: string, _b: string, hash: string, id: string, epoch: string, value: string) => {
    const key = draftRecoveryRecordKey(user, id);
    if (epoch !== '0' || records.get(key) !== value || hash !== currentTokenHash) return false;
    return records.delete(key);
  }),
  deleteValue: jest.fn(async (key: string) => { records.delete(key); }),
};
const config = { get: (key: string) => key === 'JWT_SECRET' ? SECRET : key === 'DRAFT_RECOVERY_MASTER_KEY' ? Buffer.alloc(32, 7).toString('base64') : 'test' };
let currentTokenHash = '';

@Module({ providers: [
  { provide: DbService, useValue: db },
  { provide: RedisDbService, useValue: redis },
  { provide: ConfigService, useValue: config },
], exports: [DbService, RedisDbService, ConfigService] })
class TestSharedModule {}

describe('DraftRecoveryModule HTTP wiring', () => {
  let app: any;
  const token = (userId: string) => jwt.sign({ userId, broweserId: 'browser' }, SECRET);

  beforeEach(async () => {
    access = true; records = new Map(); jest.clearAllMocks();
    const module = await Test.createTestingModule({ imports: [DraftRecoveryModule] })
      .overrideModule(SharedModule).useModule(TestSharedModule).compile();
    app = module.createNestApplication();
    await app.init();
  });
  afterEach(async () => { await app.close(); });

  it('protects real routes with JWT middleware and rechecks authorization before releasing an owner-bound key', async () => {
    await request(app.getHttpServer()).post('/draft-recovery/keys').send({ caseId: CASE, sourceKind: 'pdf', sourceId: DOC }).expect(403);
    const issued = await request(app.getHttpServer()).post('/draft-recovery/keys')
      .set('Authorization', `Bearer ${token(USER)}`)
      .send({ caseId: CASE, sourceKind: 'pdf', sourceId: DOC, nMasterid: OTHER }).expect(201);
    expect(issued.headers['cache-control']).toBe('no-store');
    expect(issued.body.key).toMatch(/^[A-Za-z0-9+/]{43}=$/);
    await request(app.getHttpServer()).get(`/draft-recovery/keys/${issued.body.draftId}`)
      .set('Authorization', `Bearer ${token(OTHER)}`).expect(403);
    const restored = await request(app.getHttpServer()).get(`/draft-recovery/keys/${issued.body.draftId}`)
      .set('Authorization', `Bearer ${token(USER)}`).expect(200);
    expect(restored.body.key).toBe(issued.body.key);
    expect(restored.headers['cache-control']).toBe('no-store');
    access = false;
    await request(app.getHttpServer()).get(`/draft-recovery/keys/${issued.body.draftId}`)
      .set('Authorization', `Bearer ${token(USER)}`).expect(403);
  });

  it('binds a DELETE to the current verified token even when an old token shares the browser ID', async () => {
    const { createHash } = require('crypto') as typeof import('crypto');
    const current = jwt.sign({ userId: USER, broweserId: 'browser', jti: 'current' }, SECRET);
    const stale = jwt.sign({ userId: USER, broweserId: 'browser', jti: 'stale' }, SECRET);
    currentTokenHash = createHash('sha256').update(current).digest('hex');
    const issued = await request(app.getHttpServer()).post('/draft-recovery/keys')
      .set('Authorization', `Bearer ${current}`)
      .send({ caseId: CASE, sourceKind: 'pdf', sourceId: DOC }).expect(201);
    await request(app.getHttpServer()).delete(`/draft-recovery/keys/${issued.body.draftId}`)
      .set('Authorization', `Bearer ${stale}`).expect(403);
    await request(app.getHttpServer()).get(`/draft-recovery/keys/${issued.body.draftId}`)
      .set('Authorization', `Bearer ${current}`).expect(200);
    await request(app.getHttpServer()).delete(`/draft-recovery/keys/${issued.body.draftId}`)
      .set('Authorization', `Bearer ${current}`).expect(200);
    await request(app.getHttpServer()).get(`/draft-recovery/keys/${issued.body.draftId}`)
      .set('Authorization', `Bearer ${current}`).expect(403);
  });
});
