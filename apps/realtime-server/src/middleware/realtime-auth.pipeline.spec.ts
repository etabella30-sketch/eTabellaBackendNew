import { Body, Controller, Get, INestApplication, Logger, MiddlewareConsumer, Module, NestModule, Post, Query, RequestMethod, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { IsOptional, IsString } from 'class-validator';
import * as jwt from 'jsonwebtoken';
import * as request from 'supertest';
import { DbService } from '@app/global/db/pg/db.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { RealtimeAdminMiddleware, RealtimeAuthBase, RealtimeAuthMiddleware, RealtimeVenueAuthMiddleware } from './realtime-auth.middleware';

// Runs the middleware through a real Nest HTTP stack with the same global ValidationPipe options as
// realtime-server main.ts, wired with the same exclude()/ordering pattern RealtimeServerModule uses.

const SECRET = 'pipeline-secret';
const ME = '11111111-1111-4111-8111-111111111111';
const VICTIM = '22222222-2222-4222-8222-222222222222';

class NoteDto {
  @IsOptional() @IsString() note?: string;
}

class UserDto {
  @IsOptional() @IsString() nUserid?: string;
  @IsOptional() @IsString() note?: string;
}

@Controller('probe')
class ProbeController {
  @Post('plain') plain(@Body() body: NoteDto) { return body; }
  @Post('user') user(@Body() body: UserDto) { return body; }
  @Get('user') userQuery(@Query() query: UserDto) { return query; }
  @Post('admin') admin(@Body() body: NoteDto) { return { ok: true }; }
  @Post('venue') venue(@Body() body: UserDto) { return body; }
}

const env: Record<string, string | undefined> = {};
let session = { id: 'browser-1', a: false };
const rds = { getValue: jest.fn(async () => JSON.stringify(session)), deleteValue: jest.fn() };
const db = { executeRef: jest.fn(), rowQuery: jest.fn() };

@Module({
  controllers: [ProbeController],
  providers: [
    { provide: RedisDbService, useValue: rds },
    { provide: ConfigService, useValue: { get: (k: string) => env[k] } },
    { provide: DbService, useValue: db },
  ],
})
class ProbeModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RealtimeAuthMiddleware).exclude({ path: 'probe/venue', method: RequestMethod.POST }).forRoutes(ProbeController);
    consumer.apply(RealtimeAdminMiddleware).forRoutes({ path: 'probe/admin', method: RequestMethod.POST });
    consumer.apply(RealtimeVenueAuthMiddleware).forRoutes({ path: 'probe/venue', method: RequestMethod.POST });
  }
}

describe('realtime auth through the HTTP pipeline', () => {
  let app: INestApplication;
  const token = () => jwt.sign({ userId: ME, broweserId: 'browser-1' }, SECRET);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [ProbeModule] }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(() => {
    for (const k of Object.keys(env)) delete env[k];
    Object.assign(env, { JWT_SECRET: SECRET, REALTIME_SERVICE_KEY: 'svc-key' });
    session = { id: 'browser-1', a: false };
  });

  it('does not inject identity into a DTO that does not declare it (no forbidNonWhitelisted 400)', async () => {
    const res = await request(app.getHttpServer()).post('/probe/plain').set('Authorization', `Bearer ${token()}`).send({ note: 'x' });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ note: 'x' });
  });

  it('replaces a client-sent nUserid in the body with the token user', async () => {
    const res = await request(app.getHttpServer()).post('/probe/user').set('Authorization', `Bearer ${token()}`).send({ nUserid: VICTIM, note: 'x' });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ nUserid: ME, note: 'x' });
  });

  it('replaces a client-sent nUserid in the query string, and adds none when absent', async () => {
    const withId = await request(app.getHttpServer()).get(`/probe/user?nUserid=${VICTIM}`).set('Authorization', `Bearer ${token()}`);
    expect(withId.body).toEqual({ nUserid: ME });
    const without = await request(app.getHttpServer()).get('/probe/user?note=a').set('Authorization', `Bearer ${token()}`);
    expect(without.body).toEqual({ note: 'a' });
  });

  it('requires a token on browser routes', async () => {
    const res = await request(app.getHttpServer()).post('/probe/user').send({ note: 'x' });
    expect(res.status).toBe(403);
  });

  it('runs the admin gate after authentication', async () => {
    const denied = await request(app.getHttpServer()).post('/probe/admin').set('Authorization', `Bearer ${token()}`).send({});
    expect(denied.status).toBe(403);
    session = { id: 'browser-1', a: true };
    const allowed = await request(app.getHttpServer()).post('/probe/admin').set('Authorization', `Bearer ${token()}`).send({});
    expect(allowed.status).toBe(201);
  });

  it('applies the admin gate to casing and trailing-slash variants of the gated path', async () => {
    for (const path of ['/PROBE/Admin', '/probe/admin/', '/Probe/ADMIN/']) {
      const denied = await request(app.getHttpServer()).post(path).set('Authorization', `Bearer ${token()}`).send({});
      expect(denied.status).toBe(403);
      expect(denied.body).toEqual({ message: 'Admin rights required' });
    }
  });

  it('excludes venue routes from browser auth (case-insensitively) and applies the venue rule instead', async () => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const transition = await request(app.getHttpServer()).post('/PROBE/Venue').send({ nUserid: VICTIM });
    expect(transition.status).toBe(201);
    expect(transition.body).toEqual({ nUserid: VICTIM });

    env.REALTIME_SERVICE_KEY_ENFORCE = 'true';
    const rejected = await request(app.getHttpServer()).post('/probe/venue').send({ nUserid: VICTIM });
    expect(rejected.status).toBe(401);
    // 401 (venue rule) rather than 403 (browser rule) also for a differently-cased path.
    const rejectedUpper = await request(app.getHttpServer()).post('/PROBE/VENUE').send({ nUserid: VICTIM });
    expect(rejectedUpper.status).toBe(401);
    expect(rejectedUpper.body).toEqual({ message: 'Service key required' });
    const keyed = await request(app.getHttpServer()).post('/probe/venue').set('x-etabella-service-key', 'svc-key').send({ nUserid: VICTIM });
    expect(keyed.status).toBe(201);
    expect(keyed.body).toEqual({ nUserid: VICTIM });
  });

  it('a non-admin login does not open a venue route; a global admin token does', async () => {
    env.REALTIME_SERVICE_KEY_ENFORCE = 'true';
    const denied = await request(app.getHttpServer()).post('/probe/venue').set('Authorization', `Bearer ${token()}`).send({ nUserid: VICTIM });
    expect(denied.status).toBe(403);
    expect(denied.body).toEqual({ message: 'Admin rights required' });

    session = { id: 'browser-1', a: true };
    const admin = await request(app.getHttpServer()).post('/probe/venue').set('Authorization', `Bearer ${token()}`).send({ nUserid: VICTIM });
    expect(admin.status).toBe(201);
    expect(admin.body).toEqual({ nUserid: ME });
  });

  it('logs casing and trailing-slash variants of a venue path under one throttle entry', async () => {
    (RealtimeAuthBase as any).lastWarn.clear();
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    warn.mockClear(); // an earlier test's spy on the same method is reused, with its calls
    for (const path of ['/probe/venue', '/PROBE/Venue', '/Probe/VENUE/', '/probe/venue/']) {
      const res = await request(app.getHttpServer()).post(path).send({ nUserid: VICTIM });
      expect(res.status).toBe(201);
    }
    expect(warn).toHaveBeenCalledTimes(1);
    expect((RealtimeAuthBase as any).lastWarn.size).toBe(1);
    warn.mockRestore();
  });
});
