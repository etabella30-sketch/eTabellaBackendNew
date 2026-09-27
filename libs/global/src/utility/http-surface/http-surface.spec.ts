import { Body, Controller, Get, INestApplication, MiddlewareConsumer, Module, NestModule, Post, Query, RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import * as jwt from 'jsonwebtoken';
import * as request from 'supertest';
import { DbService } from '../../db/pg/db.service';
import { RedisDbService } from '../../db/redis-db/redis-db.service';
import { JwtMiddleware } from '../../middleware/jwt.middleware';
import { ALLOWED_METHODS, installHttpSurfaceGuards, refuseHeadRequests } from './http-surface';

// A real Nest HTTP app wired like the apps that install this helper: the shared JwtMiddleware applied
// with forRoutes(Controller) (batchfile, downloadapi, export, hyperlink, indexapi, pagination,
// presentation, sfu) and with forRoutes({ path, method: GET }) (authapi auth/userinfo, upload
// upload/status). Only Redis, the database and config are stand-ins.

const SECRET = 'http-surface-secret';
const ME = '11111111-1111-4111-8111-111111111111';
const OWNER = '22222222-2222-4222-8222-222222222222';

const handled = jest.fn();

@Controller('probe')
class ProbeController {
  // Answers with the nMasterid it was given: JwtMiddleware overwrites it with the token user on GET.
  @Get('secret') secret(@Query('nMasterid') nMasterid: string) { handled('secret', nMasterid); return { nMasterid }; }
  @Post('secret') write(@Body() body: any) { handled('post', body?.nMasterid); return { ok: true }; }
}

@Controller('routed')
class RoutedController {
  @Get('info') info(@Query('nMasterid') nMasterid: string) { handled('info', nMasterid); return { nMasterid }; }
}

const rds = { getValue: jest.fn(async () => JSON.stringify({ id: 'browser-1', a: false })), deleteValue: jest.fn() };

@Module({
  controllers: [ProbeController, RoutedController],
  providers: [
    { provide: RedisDbService, useValue: rds },
    { provide: ConfigService, useValue: { get: (k: string) => (k === 'JWT_SECRET' ? SECRET : undefined) } },
    { provide: DbService, useValue: { executeRef: jest.fn(async () => ({ success: true, data: [] })) } },
  ],
})
class ProbeModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtMiddleware).forRoutes(ProbeController);
    consumer.apply(JwtMiddleware).forRoutes({ path: 'routed/info', method: RequestMethod.GET });
  }
}

async function boot(guarded: boolean): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [ProbeModule] }).compile();
  const app = moduleRef.createNestApplication({ logger: false });
  if (guarded) installHttpSurfaceGuards(app); // where every main.ts installs it: before init
  await app.init();
  return app;
}

const token = () => jwt.sign({ userId: ME, broweserId: 'browser-1' }, SECRET);
const asOwner = `nMasterid=${OWNER}`;

describe('shared HTTP surface guard (libs/global http-surface)', () => {
  let guarded: INestApplication;
  let bare: INestApplication;

  beforeAll(async () => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined); // JwtMiddleware logs every request
    guarded = await boot(true);
    bare = await boot(false);
  });

  afterAll(async () => {
    await guarded?.close();
    await bare?.close();
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    handled.mockClear();
    rds.getValue.mockClear();
  });

  it('baseline: without the guard a token-less HEAD skips JwtMiddleware and runs the GET handler as the nMasterid it names', async () => {
    // The Nest/Express behaviour the guard exists for (both forRoutes styles). If it ever stops
    // holding, the guard is still harmless.
    for (const [target, name] of [[`/probe/secret?${asOwner}`, 'secret'], [`/routed/info?${asOwner}`, 'info']]) {
      expect((await request(bare.getHttpServer()).head(target)).status).toBe(200);
      expect(handled).toHaveBeenLastCalledWith(name, OWNER);
    }
    expect(rds.getValue).not.toHaveBeenCalled(); // JwtMiddleware never ran
  });

  it('answers every HEAD with 405 and an Allow header, before any middleware or handler runs', async () => {
    const targets = [
      `/probe/secret?${asOwner}`,
      `/PROBE/Secret/?${asOwner}`,
      `/routed/info?${asOwner}`,
      '/Routed/Info/',
      '/',
      '/no-such-route',
    ];
    for (const target of targets) {
      for (const auth of [undefined, `Bearer ${token()}`]) {
        let req = request(guarded.getHttpServer()).head(target);
        if (auth) req = req.set('Authorization', auth);
        const res = await req;
        expect(res.status).toBe(405);
        expect(res.headers.allow).toBe(ALLOWED_METHODS);
      }
    }
    expect(handled).not.toHaveBeenCalled();
    expect(rds.getValue).not.toHaveBeenCalled();
  });

  it('leaves GET alone: still needs a token and runs as the token user, not the nMasterid it names', async () => {
    for (const [target, name] of [[`/probe/secret?${asOwner}`, 'secret'], [`/routed/info?${asOwner}`, 'info']]) {
      expect((await request(guarded.getHttpServer()).get(target)).status).toBe(403);
      expect(handled).not.toHaveBeenCalled();

      const res = await request(guarded.getHttpServer()).get(target).set('Authorization', `Bearer ${token()}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ nMasterid: ME });
      expect(handled).toHaveBeenLastCalledWith(name, ME);
      handled.mockClear();
    }
  });

  it('leaves POST and OPTIONS alone', async () => {
    expect((await request(guarded.getHttpServer()).post('/probe/secret').send({ nMasterid: OWNER })).status).toBe(403);
    const res = await request(guarded.getHttpServer()).post('/probe/secret').set('Authorization', `Bearer ${token()}`).send({ nMasterid: OWNER });
    expect(res.status).toBe(201);
    expect(handled).toHaveBeenCalledWith('post', ME);
    expect((await request(guarded.getHttpServer()).options('/probe/secret')).status).not.toBe(405);
  });

  it('is the first handler on the Express stack, ahead of the Nest middleware and routes', () => {
    const stack: any[] = guarded.getHttpAdapter().getInstance()._router.stack;
    const head = stack.findIndex((layer) => layer.handle === refuseHeadRequests);
    expect(head).toBeGreaterThan(-1);
    expect(stack.slice(0, head).every((layer) => ['query', 'expressInit'].includes(layer.name))).toBe(true);
    expect(stack.findIndex((layer) => layer.route)).toBeGreaterThan(head);
    expect(stack.filter((layer) => layer.handle === refuseHeadRequests)).toHaveLength(1);
  });

  it('calls next() for every other method', () => {
    for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']) {
      const next = jest.fn();
      const res = { setHeader: jest.fn(), status: jest.fn(() => ({ end: jest.fn() })) };
      refuseHeadRequests({ method } as any, res as any, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    }
  });
});
