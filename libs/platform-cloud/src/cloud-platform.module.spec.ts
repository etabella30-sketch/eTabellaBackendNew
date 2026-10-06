import {
  Controller, Get, INestApplication, Inject, Injectable, Logger, MiddlewareConsumer, Module, NestModule, UseFilters, UseGuards,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { NextFunction, Request, Response } from 'express';
import * as request from 'supertest';
import {
  CALLER_KEY, CALLER_RESOLVER, Caller, CallerGuard, CASE_ACCESS, DomainError, DomainErrorFilter, ERROR_ENVELOPE, EVENT_DELIVERY,
  EventDelivery, HttpErrorFilter, ROW_QUERY, RouteId, RowQuery, SP_EXECUTOR, SpExecutor,
} from '@app/api-kernel';
import { CASE_MEMBER_SQL } from '@app/permissions';
import { DbService } from '@app/global/db/pg/db.service';
import { KafkaGlobalService } from '@app/global/utility/kafka/kafka.shared.service';
import { CLOUD_PLATFORM_TOKENS, CloudPlatformModule } from './cloud-platform.module';
import { KafkaNotificationEventDelivery } from './event-delivery';
import { LegacyEnvelope } from './legacy-envelope';
import { PgCaseAccess } from './pg-case-access';
import { PgRowQuery } from './pg-row-query';
import { PgSpExecutor, SP_CALL_FAILED } from './pg-sp-executor';
import { StampedCallerResolver } from './stamped-caller.resolver';

/*
 * The module as a live host would mount it: @Global() in a root module that already provides DbService and the Kafka
 * client in its own (non-exported) scope, exactly the situation of coreapi's SharedModule and realtime-server's root
 * module. The host services are fakes; everything else is the real wiring.
 */

const ME = '11111111-1111-4111-8111-111111111111';
const CASE = 'ca5e0000-0000-4000-8000-0000000000c1';
const MEMBERS = [{ nUserid: ME, cFname: 'Me', nTeamid: 't1' }];

const db = {
  executeRef: jest.fn(async () => ({ success: true, data: [MEMBERS] })),
  rowQuery: jest.fn(async () => ({ success: true, data: [{ '?column?': 1 }] })),
};
const kafka = { sendMessage: jest.fn(async () => true) };

/** A feature provider of the host, injecting the ports without importing CloudPlatformModule (it is @Global). */
@Injectable()
class ProbeService {
  constructor(
    @Inject(SP_EXECUTOR) readonly sp: SpExecutor,
    @Inject(ROW_QUERY) readonly rows: RowQuery,
    @Inject(EVENT_DELIVERY) readonly events: EventDelivery,
  ) {}
}

@Controller('probe')
@UseGuards(CallerGuard)
@UseFilters(DomainErrorFilter)
class ProbeController {
  constructor(private readonly probe: ProbeService) {}

  @Get('team')
  async team(@Caller() caller: Caller) {
    const outcome = await this.probe.sp.call('common_my_team_user', { nCaseid: CASE, nMasterid: caller.userId }, 'public');
    if (outcome.ok === false) throw new DomainError('upstream', outcome.error);
    return outcome.cursors[0];
  }

  @Get('forbidden')
  @RouteId('probe.forbidden')
  forbidden(): never {
    throw new DomainError('forbidden', 'Not a member.', { secret: 'server-side only' });
  }

  @Get('legacy')
  @RouteId('core.myteamusers')
  legacy(): never {
    throw new DomainError('upstream', 'db said no');
  }
}

/** Stands in for the host middleware's one added line: stamps the Caller when the test names a user. */
function stampCaller(req: Request, _res: Response, next: NextFunction): void {
  const userId = req.headers['x-user'];
  if (typeof userId === 'string' && userId) {
    (req as any)[CALLER_KEY] = { userId, family: 'cloud-jwt', isPlatformAdmin: false, caseScope: 'membership' } satisfies Caller;
  }
  next();
}

@Module({ controllers: [ProbeController], providers: [ProbeService] })
class ProbeModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(stampCaller).forRoutes(ProbeController);
  }
}

const legacyShape = {
  'core.myteamusers': (res: Response, err: DomainError) => { res.status(200).json([{ msg: -1, value: 'Failed ', error: err.message }]); },
};

describe('CloudPlatformModule on a host that provides DbService and the Kafka client', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CloudPlatformModule.forRoot({ envelope: new LegacyEnvelope({ legacyShape }) }), ProbeModule],
      providers: [
        { provide: DbService, useValue: db },
        { provide: KafkaGlobalService, useValue: kafka },
      ],
    }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    app.useGlobalFilters(new HttpErrorFilter());
    await app.init();
  });
  afterAll(async () => { await app?.close(); });
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers({ now: new Date('2026-10-06T10:00:00.000Z'), doNotFake: ['nextTick', 'setImmediate', 'setTimeout', 'setInterval', 'queueMicrotask'] });
  });
  afterEach(() => jest.useRealTimers());

  it('binds the six port tokens to the live adapters', () => {
    expect(CLOUD_PLATFORM_TOKENS).toEqual([SP_EXECUTOR, ROW_QUERY, CALLER_RESOLVER, CASE_ACCESS, EVENT_DELIVERY, ERROR_ENVELOPE]);
    expect(app.get(SP_EXECUTOR)).toBeInstanceOf(PgSpExecutor);
    expect(app.get(ROW_QUERY)).toBeInstanceOf(PgRowQuery);
    expect(app.get(CALLER_RESOLVER)).toBeInstanceOf(StampedCallerResolver);
    expect(app.get(CASE_ACCESS)).toBeInstanceOf(PgCaseAccess);
    expect(app.get(EVENT_DELIVERY)).toBeInstanceOf(KafkaNotificationEventDelivery);
    expect(app.get(ERROR_ENVELOPE)).toBeInstanceOf(LegacyEnvelope);
  });

  it('a feature provider reaches the ports without importing the module, and they use the host\'s own DbService', async () => {
    const probe = app.get(ProbeService);
    await expect(probe.sp.call('x', { a: 1 })).resolves.toEqual({ ok: true, cursors: [MEMBERS] });
    expect(db.executeRef.mock.calls[0]).toEqual(['x', { a: 1 }]);
    await expect(probe.rows.rows(CASE_MEMBER_SQL, [CASE, ME])).resolves.toEqual([{ '?column?': 1 }]);
    expect(db.rowQuery).toHaveBeenCalledWith(CASE_MEMBER_SQL, [CASE, ME]);
  });

  it('CASE_ACCESS runs the membership rule through the host\'s DbService', async () => {
    const access = app.get<PgCaseAccess>(CASE_ACCESS);
    await expect(access.assertMember({ userId: ME, family: 'cloud-jwt', isPlatformAdmin: false, caseScope: 'membership' }, CASE)).resolves.toBeUndefined();
    expect(db.rowQuery).toHaveBeenCalledWith(CASE_MEMBER_SQL, [CASE, ME]);
  });

  it('EVENT_DELIVERY emits notifications through the host\'s KafkaGlobalService', () => {
    app.get<EventDelivery>(EVENT_DELIVERY).publish({ kind: 'notification', toUserIds: [ME], template: 'FS', data: { cTitle: 't' } });
    expect(kafka.sendMessage).toHaveBeenCalledWith('notification', expect.objectContaining({ nUserid: ME, cType: 'FS', cTitle: 't' }));
  });

  describe('through the HTTP pipeline', () => {
    const get = (url: string, user: string | null = ME) => {
      const req = request(app.getHttpServer()).get(url);
      return user ? req.set('x-user', user) : req;
    };

    it('CallerGuard resolves the stamped caller and the handler reaches the SP with the actor', async () => {
      const res = await get('/probe/team');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(MEMBERS);
      expect(db.executeRef).toHaveBeenCalledWith('common_my_team_user', { nCaseid: CASE, nMasterid: ME }, 'public');
    });

    it('without a stamp the 401 wears today\'s HttpErrorFilter body for an UnauthorizedException', async () => {
      const res = await get('/probe/team', null);
      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        statusCode: 401,
        message: 'Unauthorized',
        detailedError: '{"message":"Sign in to continue.","error":"Unauthorized","statusCode":401}',
        timestamp: '2026-10-06T10:00:00.000Z',
      });
      expect(db.executeRef).not.toHaveBeenCalled();
    });

    it('a DomainError answers exactly as a ForbiddenException does today, detail kept server-side', async () => {
      const res = await get('/probe/forbidden');
      expect(res.status).toBe(403);
      expect(res.body).toEqual({
        statusCode: 403,
        message: 'Forbidden',
        detailedError: '{"message":"Not a member.","error":"Forbidden","statusCode":403}',
        timestamp: '2026-10-06T10:00:00.000Z',
      });
      expect(JSON.stringify(res.body)).not.toContain('server-side only');
    });

    it('a route with a legacyShape answers in that shape (coreapi 200 [{msg:-1}])', async () => {
      const res = await get('/probe/legacy');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ msg: -1, value: 'Failed ', error: 'db said no' }]);
    });
  });
});

describe('CloudPlatformModule on a host without DbService or Kafka (nothing throws at construction)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const moduleRef = await Test.createTestingModule({ imports: [CloudPlatformModule.forRoot()] }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    await app.init();
  });
  afterAll(async () => {
    await app?.close();
    jest.restoreAllMocks();
  });

  it('boots, binds a plain LegacyEnvelope, and reports the missing services per call', async () => {
    expect(app.get(ERROR_ENVELOPE)).toBeInstanceOf(LegacyEnvelope);
    await expect(app.get<SpExecutor>(SP_EXECUTOR).call('x', {})).resolves.toEqual({ ok: false, error: SP_CALL_FAILED });
    await expect(app.get<RowQuery>(ROW_QUERY).rows('SELECT 1', [])).rejects.toMatchObject({ code: 'upstream' });
    const caller: Caller = { userId: ME, family: 'cloud-jwt', isPlatformAdmin: false, caseScope: 'membership' };
    await expect(app.get<PgCaseAccess>(CASE_ACCESS).assertMember(caller, CASE)).rejects.toMatchObject({ code: 'unavailable' });
    expect(() => app.get<EventDelivery>(EVENT_DELIVERY).publish({ kind: 'notification', toUserIds: [ME], template: 'FS', data: {} })).not.toThrow();
  });
});
