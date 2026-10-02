import { Body, Controller, Get, INestApplication, Module, MiddlewareConsumer, NestModule, Post, Query, Req, RequestMethod, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { IsOptional, IsString } from 'class-validator';
import { randomUUID } from 'crypto';
import { importJWK, JWK, SignJWT } from 'jose';
import * as request from 'supertest';
import { EDGE_TOKEN_ISSUER, EDGE_TOKEN_TYP, edgeAudience, generateEdgeSigningKey } from '@app/edge-token';
import { DbService } from '@app/global/db/pg/db.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';

import {
  RealtimeAdminMiddleware,
  RealtimeAuthInjectMiddleware,
  RealtimeAuthMiddleware,
  RealtimeVenueAuthMiddleware,
} from './realtime-auth.middleware';
import { EDGE_BOX_CASES_SQL, EDGE_SCOPE_SESSIONS_SQL, EDGE_USER_ACTIVE_SQL } from './realtime-edge-token';

/*
 * D22 through a real Nest HTTP stack (the global ValidationPipe of main.ts, the route wiring pattern of
 * RealtimeServerModule / TranscriptModule): an edge token reaches an allowlisted route as a non-admin, is refused on
 * the admin and venue routes, and a write gets its identity from the token.
 */

const BOX = 'b0c5b0c5-0000-4000-8000-0000000000b1';
const ME = '11111111-1111-4111-8111-111111111111';
const CASE = 'ca5e0000-0000-4000-8000-0000000000c1';
const OTHER_CASE = 'ca5e0000-0000-4000-8000-0000000000c2';
const SES = '5e550000-0000-4000-8000-0000000000a1';

class SessionQuery {
  @IsOptional() @IsString() nSesid?: string;
  @IsOptional() @IsString() nCaseid?: string;
  @IsOptional() @IsString() nUserid?: string;
}

class HighlightBody {
  @IsOptional() @IsString() nCaseid?: string;
  @IsOptional() @IsString() nSessionid?: string;
  @IsOptional() @IsString() nMasterid?: string;
  @IsOptional() @IsString() cNote?: string;
}

@Controller('session')
class SessionProbe {
  @Get('realtimedatabysesid') data(@Query() q: SessionQuery, @Req() req: any) { return { q, user: req.user, edge: req.edge }; }
  @Post('eclipse') create(@Body() b: SessionQuery) { return { created: true }; }
  @Post('sessionend') end(@Body() b: SessionQuery) { return { ended: true }; }
}

@Controller('fact')
class FactProbe {
  @Post('insertHighlights') insert(@Body() b: HighlightBody) { return b; }
}

const env: Record<string, string | undefined> = {};
const rds = { keyExists: jest.fn(async () => 0), getValue: jest.fn(async () => JSON.stringify({ id: 'browser-1', a: false })), deleteValue: jest.fn() };
const db = {
  executeRef: jest.fn(),
  rowQuery: jest.fn(async (sql: string, params: any[]) => {
    // Review #10: the token user's account is active (UserMaster.cStatus = 'A').
    if (sql === EDGE_USER_ACTIVE_SQL) return { success: true, data: params[0] === ME ? [{ bActive: true }] : [] };
    if (sql === EDGE_SCOPE_SESSIONS_SQL) return { success: true, data: params[0].filter((id: string) => id === SES).map((id: string) => ({ nSesid: id, nCaseid: CASE })) };
    if (sql === EDGE_BOX_CASES_SQL) return { success: true, data: params[1].filter((c: string) => c === CASE).map((c: string) => ({ nCaseid: c })) };
    return { success: true, data: [] };
  }),
};

@Module({
  controllers: [SessionProbe, FactProbe],
  providers: [
    { provide: RedisDbService, useValue: rds },
    { provide: ConfigService, useValue: { get: (k: string) => env[k] } },
    { provide: DbService, useValue: db },
  ],
})
class ProbeModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RealtimeAuthMiddleware).exclude({ path: 'session/sessionend', method: RequestMethod.POST }).forRoutes(SessionProbe);
    consumer.apply(RealtimeAdminMiddleware).forRoutes({ path: 'session/eclipse', method: RequestMethod.POST });
    consumer.apply(RealtimeVenueAuthMiddleware).forRoutes({ path: 'session/sessionend', method: RequestMethod.POST });
    consumer.apply(RealtimeAuthInjectMiddleware).forRoutes(FactProbe);
  }
}

describe('edge tokens through the HTTP pipeline (D22)', () => {
  let app: INestApplication;
  let key: JWK;

  const token = async (claims: Record<string, any> = {}) => {
    const now = Math.floor(Date.now() / 1000);
    return new SignJWT({
      iss: EDGE_TOKEN_ISSUER, sub: ME, userId: ME, aud: edgeAudience(BOX), edge: BOX, cases: [CASE], scope: 'rt',
      jti: randomUUID(), iat: now - 5, exp: now + 3600, auth_time: now - 10, ...claims,
    }).setProtectedHeader({ alg: 'ES256', typ: EDGE_TOKEN_TYP, kid: 'kid-1' }).sign(await importJWK(key, 'ES256'));
  };

  beforeAll(async () => {
    key = await generateEdgeSigningKey('kid-1');
    const { d: _d, ...pub } = key as any;
    Object.assign(env, { EDGE_ENABLED: '1', EDGE_TOKEN_JWKS: JSON.stringify({ keys: [pub] }), JWT_SECRET: 'pipeline-secret', REALTIME_SERVICE_KEY: 'svc' });
    const moduleRef = await Test.createTestingModule({ imports: [ProbeModule] }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('an allowlisted read in the box\'s case passes as the token user (nUserid overwritten, not an admin)', async () => {
    const res = await request(app.getHttpServer())
      .get('/session/realtimedatabysesid')
      .query({ nSesid: SES, nCaseid: CASE, nUserid: 'someone-else' })
      .set('Authorization', `Bearer ${await token()}`);
    expect(res.status).toBe(200);
    expect(res.body.q).toEqual({ nSesid: SES, nCaseid: CASE, nUserid: ME });
    expect(res.body.user).toEqual({ userId: ME, isAdmin: false });
    expect(res.body.edge).toMatchObject({ nEdgeid: BOX, cases: [CASE] });
  });

  it('the same read for a case outside the token is 403', async () => {
    const res = await request(app.getHttpServer())
      .get('/session/realtimedatabysesid')
      .query({ nSesid: SES, nCaseid: OTHER_CASE })
      .set('Authorization', `Bearer ${await token()}`);
    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ cCode: 'case_not_allowed' });
  });

  it('an allowlisted write gets nMasterid from the token', async () => {
    const res = await request(app.getHttpServer())
      .post('/fact/insertHighlights')
      .set('Authorization', `Bearer ${await token()}`)
      .send({ nCaseid: CASE, nSessionid: SES, nMasterid: 'forged', cNote: 'x' });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ nCaseid: CASE, nSessionid: SES, nMasterid: ME, cNote: 'x' });
  });

  it('the admin create route (session/eclipse) refuses it: 403 before the admin gate', async () => {
    const res = await request(app.getHttpServer()).post('/session/eclipse').set('Authorization', `Bearer ${await token()}`).send({ nCaseid: CASE });
    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ cCode: 'route_not_allowed' });
  });

  it('the venue route (session/sessionend) refuses it: 401', async () => {
    const res = await request(app.getHttpServer()).post('/session/sessionend').set('Authorization', `Bearer ${await token()}`).send({ nSesid: SES });
    expect(res.status).toBe(401);
  });

  it('an expired edge token is 401', async () => {
    const now = Math.floor(Date.now() / 1000);
    const res = await request(app.getHttpServer())
      .get('/session/realtimedatabysesid')
      .query({ nSesid: SES })
      .set('Authorization', `Bearer ${await token({ iat: now - 7200, exp: now - 60, auth_time: now - 7300 })}`);
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ cCode: 'token_expired' });
  });
});
