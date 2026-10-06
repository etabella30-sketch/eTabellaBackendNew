import {
  Body, Controller, Get, INestApplication, Module, Post, Query, UseFilters, UseGuards, UsePipes, ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { IsUUID } from 'class-validator';
import type { Response } from 'express';
import * as request from 'supertest';
import { ActorFields } from './actor-fields';
import { CALLER_RESOLVER, Caller, CallerResolver } from './caller';
import { CallerGuard } from './caller.guard';
import { CASE_ACCESS, CaseAccess } from './case-access';
import { CaseScoped, CaseScopeGuard } from './case-access.guard';
import { DomainErrorFilter } from './domain-error.filter';
import { DomainError, ERROR_ENVELOPE, ErrorEnvelope, SHARED_VALIDATION } from './errors';
import { HttpErrorFilter } from './http-error.filter';
import { RouteId } from './route-id';

/*
 * The request plumbing of a shared controller (plan §3.3) on a real Nest HTTP pipeline: controller-scoped
 * CallerGuard + CaseScopeGuard, the SHARED_VALIDATION pipe stacked on an identical global one (as on the live hosts),
 * DomainErrorFilter over a global HttpErrorFilter. Only the two ports are fakes, keyed by request headers.
 */

const ME = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';
const CASE = 'ca5e0000-0000-4000-8000-0000000000c1';
const OTHER_CASE = 'ca5e0000-0000-4000-8000-0000000000c2';

class ScopedQuery extends ActorFields {
  @IsUUID()
  nCaseid: string;
}

@Controller('kernel')
@UseGuards(CallerGuard, CaseScopeGuard)
@UsePipes(new ValidationPipe(SHARED_VALIDATION))
@UseFilters(DomainErrorFilter)
class KernelProbeController {
  @Get('whoami')
  whoami(@Caller() caller: Caller) {
    return { userId: caller.userId, family: caller.family };
  }

  @Get('scoped')
  @CaseScoped('nCaseid')
  scoped(@Query() q: ScopedQuery, @Caller() caller: Caller) {
    return { nCaseid: q.nCaseid, nMasterid: q.nMasterid ?? null, actor: caller.userId };
  }

  @Post('scoped-cloud')
  @CaseScoped('nCaseid', { cloudCaseCheck: true })
  scopedCloud(@Body() b: ScopedQuery, @Caller() caller: Caller) {
    return { nCaseid: b.nCaseid, actor: caller.userId };
  }

  @Get('boom')
  @RouteId('kernel.boom')
  boom(): never {
    throw new DomainError('conflict', 'Already there.', { secret: 'server-side only' });
  }

  @Get('plain')
  plain(): never {
    throw new Error('not a domain error');
  }
}

const resolver: jest.Mocked<CallerResolver> = {
  resolve: jest.fn(async (req: any): Promise<Caller | null> => {
    const userId = req.headers['x-user'];
    if (!userId) return null;
    return { userId, family: req.headers['x-family'] ?? 'cloud-jwt', isPlatformAdmin: false, caseScope: 'membership' };
  }),
};
const access: jest.Mocked<CaseAccess> = {
  assertMember: jest.fn(async (_caller: Caller, nCaseid: string) => {
    if (nCaseid !== CASE) throw new DomainError('forbidden', 'Not a member.');
  }),
};

async function boot(envelope?: ErrorEnvelope): Promise<INestApplication> {
  @Module({
    controllers: [KernelProbeController],
    providers: [
      { provide: CALLER_RESOLVER, useValue: resolver },
      { provide: CASE_ACCESS, useValue: access },
      ...(envelope ? [{ provide: ERROR_ENVELOPE, useValue: envelope }] : []),
    ],
  })
  class ProbeModule {}
  const moduleRef = await Test.createTestingModule({ imports: [ProbeModule] }).compile();
  const app = moduleRef.createNestApplication({ logger: false });
  app.useGlobalPipes(new ValidationPipe(SHARED_VALIDATION));
  app.useGlobalFilters(new HttpErrorFilter());
  await app.init();
  return app;
}

describe('api-kernel request plumbing on a real HTTP pipeline', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await boot();
  });
  afterAll(async () => {
    await app?.close();
  });
  beforeEach(() => jest.clearAllMocks());

  const as = (userId: string | null, family = 'cloud-jwt') => {
    const headers: Record<string, string> = userId ? { 'x-user': userId, 'x-family': family } : {};
    return {
      get: (url: string) => request(app.getHttpServer()).get(url).set(headers),
      post: (url: string, body: object) => request(app.getHttpServer()).post(url).set(headers).send(body),
    };
  };

  it('answers 401 in the plain shape when nobody is signed in, before any case check', async () => {
    const res = await as(null).get(`/kernel/scoped?nCaseid=${CASE}`);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ statusCode: 401, cCode: 'unauthenticated', message: 'Sign in to continue.' });
    expect(access.assertMember).not.toHaveBeenCalled();
  });

  it('@Caller() hands the handler the resolved caller', async () => {
    const res = await as(ME).get('/kernel/whoami');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ userId: ME, family: 'cloud-jwt' });
  });

  it('an edge caller is checked against the named case; a forged nMasterid passes validation but is not the actor', async () => {
    const res = await as(ME, 'edge-online').get(`/kernel/scoped?nCaseid=${CASE}&nMasterid=${OTHER}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ nCaseid: CASE, nMasterid: OTHER, actor: ME });
    expect(access.assertMember).toHaveBeenCalledWith(expect.objectContaining({ userId: ME, family: 'edge-online' }), CASE);
  });

  it('an edge caller outside the case is refused with the adapter\'s forbidden, and the handler never runs', async () => {
    const res = await as(ME, 'edge-box').get(`/kernel/scoped?nCaseid=${OTHER_CASE}`);
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ statusCode: 403, cCode: 'forbidden', message: 'Not a member.' });
  });

  it('an edge caller that names no case is refused before the pipe can complain', async () => {
    const res = await as(ME, 'edge-online').get('/kernel/scoped?nCaseid=null');
    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ cCode: 'forbidden', message: 'The request names no case.' });
    expect(access.assertMember).not.toHaveBeenCalled();
  });

  it('a cloud JWT is not case-checked unless the route says cloudCaseCheck (today\'s cloud behaviour)', async () => {
    const res = await as(ME).get(`/kernel/scoped?nCaseid=${OTHER_CASE}`);
    expect(res.status).toBe(200);
    expect(access.assertMember).not.toHaveBeenCalled();

    const refused = await as(ME).post('/kernel/scoped-cloud', { nCaseid: OTHER_CASE });
    expect(refused.status).toBe(403);
    const allowed = await as(ME).post('/kernel/scoped-cloud', { nCaseid: CASE, nUserid: OTHER });
    expect(allowed.status).toBe(201);
    expect(allowed.body).toEqual({ nCaseid: CASE, actor: ME });
  });

  it('validation failures keep the host\'s legacy body: HttpErrorFilter, not DomainErrorFilter, answers them', async () => {
    const bad = await as(ME).get('/kernel/scoped?nCaseid=not-an-id');
    expect(bad.status).toBe(400);
    expect(bad.body).toMatchObject({ statusCode: 400, message: 'Bad Request' });
    expect(bad.body.detailedError).toContain('nCaseid must be a UUID');

    const extra = await as(ME).get(`/kernel/scoped?nCaseid=${CASE}&nForged=1`);
    expect(extra.status).toBe(400);
    expect(extra.body.detailedError).toContain('property nForged should not exist');
  });

  it('the identity keys the live middleware injects pass both the controller pipe and the global pipe', async () => {
    const res = await as(ME).get(`/kernel/scoped?nCaseid=${CASE}&nMasterid=${ME}&nUserid=`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ nCaseid: CASE, nMasterid: ME, actor: ME });
  });

  it('a DomainError from the handler is answered in the plain shape without its detail', async () => {
    const res = await as(ME).get('/kernel/boom');
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ statusCode: 409, cCode: 'conflict', message: 'Already there.' });
    expect(JSON.stringify(res.body)).not.toContain('server-side only');
  });

  it('any other exception still reaches the host\'s global filter', async () => {
    const res = await as(ME).get('/kernel/plain');
    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({ statusCode: 500, message: 'not a domain error', detailedError: '{"error":"not a domain error"}' });
  });
});

describe('api-kernel with a host ErrorEnvelope bound', () => {
  let app: INestApplication;
  const envelope: jest.Mocked<ErrorEnvelope> = {
    send: jest.fn((res: Response, err: unknown, routeId: string | null) => {
      res.status(418).json({ envelope: routeId, cCode: (err as DomainError).code });
    }),
  };

  beforeAll(async () => {
    app = await boot(envelope);
  });
  afterAll(async () => {
    await app?.close();
  });
  beforeEach(() => jest.clearAllMocks());

  it('DomainErrorFilter hands the envelope the error and the handler\'s @RouteId', async () => {
    const res = await request(app.getHttpServer()).get('/kernel/boom').set({ 'x-user': ME });
    expect(res.status).toBe(418);
    expect(res.body).toEqual({ envelope: 'kernel.boom', cCode: 'conflict' });
    expect(envelope.send).toHaveBeenCalledWith(expect.anything(), expect.any(DomainError), 'kernel.boom');
  });

  it('a 401 from CallerGuard reaches the envelope too, with a null route id for a handler without @RouteId', async () => {
    const res = await request(app.getHttpServer()).get('/kernel/whoami');
    expect(res.status).toBe(418);
    expect(res.body).toEqual({ envelope: null, cCode: 'unauthenticated' });
  });
});
