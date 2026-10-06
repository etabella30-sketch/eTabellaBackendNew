import { INestApplication, MiddlewareConsumer, Module, NestModule, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import * as jwt from 'jsonwebtoken';
import * as request from 'supertest';
import { DbService } from '@app/global/db/pg/db.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { HttpErrorFilter } from '@app/global/middleware/exception';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';
import { CloudPlatformModule, LegacyEnvelope } from '@app/platform-cloud';
import { CODE_TABLE_LEGACY_SHAPES, CodeTableCoreHttpModule, CodeTableService, CoreCodeTableController } from '@app/rt-features/code-tables';
import { CODE_ROWS, CONFORMANCE_CATEGORY, expectConformantCodes } from '@app/rt-features/code-tables/testing/conformance';

/**
 * G0 characterization of GET common/getcode as coreapi serves it (Phase 10 of the shared-libraries plan, D12),
 * against the shared feature that serves it now: @app/rt-features' CoreCodeTableController over CodeTableService,
 * wired exactly as CommonModule and the app root wire them (JwtMiddleware by controller class, CloudPlatformModule
 * over the mocked DbService, the legacy shape of this route, main.ts's global ValidationPipe + HttpErrorFilter).
 * Every answer below is the one the hand-written route (CommonService.getcCodeMaster) gave, byte for byte. Two things
 * the move changed below the HTTP surface, both recorded here: the SP is called with the schema named ('public', the
 * default before) and without the injected nMasterid (the SP takes no user; coreapi used to forward it, realtime-server
 * never did).
 */
const SECRET = 'getcode-golden-secret';
const ME = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';
const GRADES = [
  { nValue: 1, cKey: 'Low', jObject: null, nSerialno: 1 },
  { nValue: 2, cKey: 'Medium', jObject: null, nSerialno: 2 },
  { nValue: 3, cKey: 'High', jObject: null, nSerialno: 3 },
];
const db = { executeRef: jest.fn(), rowQuery: jest.fn(async () => ({ success: false, error: 'unexpected query' })) };
const rds = { getValue: jest.fn(async () => JSON.stringify({ id: 'browser-1', a: false })), deleteValue: jest.fn() };

@Module({
  imports: [
    CloudPlatformModule.forRoot({ envelope: new LegacyEnvelope({ legacyShape: CODE_TABLE_LEGACY_SHAPES }) }),
    CodeTableCoreHttpModule.register({ operations: CodeTableService }),
  ],
  providers: [
    { provide: DbService, useValue: db },
    { provide: RedisDbService, useValue: rds },
    { provide: ConfigService, useValue: { get: (k: string) => (k === 'JWT_SECRET' ? SECRET : undefined) } },
  ],
})
class GoldenModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtMiddleware).forRoutes(CoreCodeTableController);
  }
}

const token = () => jwt.sign({ userId: ME, broweserId: 'browser-1' }, SECRET);

describe('GET common/getcode (coreapi, golden)', () => {
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
    db.executeRef.mockResolvedValue({ success: true, data: [GRADES] });
    db.rowQuery.mockClear();
  });

  const get = (query: Record<string, string>, auth = true) => {
    const req = request(app.getHttpServer()).get('/common/getcode').query(query);
    return auth ? req.set('Authorization', 'Bearer ' + token()) : req;
  };

  it('returns the SP rows unchanged and calls the public SP with the category only, whatever nMasterid the client (or the middleware) sends', async () => {
    const res = await get({ nCategoryid: '4', nMasterid: OTHER });
    expect(res.status).toBe(200);
    expect(res.body).toEqual(GRADES);
    expect(db.executeRef).toHaveBeenCalledTimes(1);
    expect(db.executeRef).toHaveBeenCalledWith('combo_codemaster', { nCategoryid: 4 }, 'public');
    expect(db.rowQuery).not.toHaveBeenCalled();
  });

  it('G2 conformance: the same fixture answers the same rows on every host', async () => {
    db.executeRef.mockResolvedValue({ success: true, data: [CODE_ROWS] });
    const res = await get({ nCategoryid: String(CONFORMANCE_CATEGORY) });
    expect(res.status).toBe(200);
    expectConformantCodes(res.body);
    expect(db.executeRef).toHaveBeenCalledWith('combo_codemaster', { nCategoryid: CONFORMANCE_CATEGORY }, 'public');
  });

  it('returns [] for an empty table', async () => {
    db.executeRef.mockResolvedValue({ success: true, data: [[]] });
    const res = await get({ nCategoryid: '99' });
    expect([res.status, res.body]).toEqual([200, []]);
  });

  // Today's legacy shape: a failed lookup is a 200 with one {msg:-1} row (realtime-server's twin answers the bare row).
  it('reports an SP failure as 200 [{ msg: -1, value: "Failed to fetch", error }] (legacy coreapi shape)', async () => {
    db.executeRef.mockResolvedValue({ success: false, error: 'db said no' });
    const res = await get({ nCategoryid: '4' });
    expect([res.status, res.body]).toEqual([200, [{ msg: -1, value: 'Failed to fetch', error: 'db said no' }]]);
  });

  it('refuses a missing or non-numeric category with 400 before touching the database (ComboCodeReq did the same: Number() + IsNumber)', async () => {
    for (const query of [{}, { nCategoryid: 'party' }, { nCategoryid: '4abc' }]) {
      const res = await get(query as Record<string, string>);
      expect([query, res.status]).toEqual([query, 400]);
    }
    expect(db.executeRef).not.toHaveBeenCalled();
  });

  it('refuses a request without a token before touching the database', async () => {
    const res = await get({ nCategoryid: '4' }, false);
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: 'A token is required for authentication' });
    expect(db.executeRef).not.toHaveBeenCalled();
  });
});
