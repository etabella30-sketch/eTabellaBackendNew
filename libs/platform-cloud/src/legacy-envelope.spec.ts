import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';
import { DOMAIN_ERROR_STATUS, DomainError, DomainErrorCode, HttpErrorFilter } from '@app/api-kernel';
import { httpExceptionFor, LegacyEnvelope, responseHost } from './legacy-envelope';

/** Spelled out again here, independently of the envelope's table: what a live handler throws per code today. */
const LIVE_EXCEPTION: Record<DomainErrorCode, new (message: string) => HttpException> = {
  invalid: BadRequestException,
  unauthenticated: UnauthorizedException,
  forbidden: ForbiddenException,
  not_found: NotFoundException,
  conflict: ConflictException,
  unavailable: ServiceUnavailableException,
  offline: ServiceUnavailableException,
  reauth: ServiceUnavailableException,
  upstream: BadGatewayException,
  cloud_refused: BadGatewayException,
};

interface Written { status: number; body: unknown }

function fakeRes(): { res: Response; written: () => Written } {
  const calls: Partial<Written> = {};
  const res = {
    status: jest.fn((code: number) => { calls.status = code; return res; }),
    json: jest.fn((body: unknown) => { calls.body = body; return res; }),
  };
  return { res: res as unknown as Response, written: () => calls as Written };
}

/** What today's global HttpErrorFilter writes for this exception, serialised (the timestamp is frozen below). */
function liveAnswer(exception: unknown): string {
  const { res, written } = fakeRes();
  new HttpErrorFilter().catch(exception, responseHost(res));
  return JSON.stringify(written());
}

describe('LegacyEnvelope', () => {
  beforeEach(() => jest.useFakeTimers({ now: new Date('2026-10-06T10:00:00.000Z') }));
  afterEach(() => jest.useRealTimers());

  it.each(Object.keys(DOMAIN_ERROR_STATUS) as DomainErrorCode[])(
    'answers a DomainError(%s) byte for byte as HttpErrorFilter answers the live HttpException of its status',
    (code) => {
      const err = new DomainError(code, `Shared ${code} message`, { secret: 'server-side only' });
      const { res, written } = fakeRes();
      new LegacyEnvelope().send(res, err, 'any.route');
      const answer = JSON.stringify(written());
      expect(answer).toBe(liveAnswer(new LIVE_EXCEPTION[code](`Shared ${code} message`)));
      expect(written().status).toBe(DOMAIN_ERROR_STATUS[code]);
      expect(answer).not.toContain('server-side only');
    },
  );

  it('writes the legacy body shape, with the detailedError today\'s FE interceptors parse', () => {
    const { res, written } = fakeRes();
    new LegacyEnvelope().send(res, new DomainError('forbidden', 'cross_team_recipient'), null);
    expect(written()).toEqual({
      status: 403,
      body: {
        statusCode: 403,
        message: 'Forbidden',
        detailedError: '{"message":"cross_team_recipient","error":"Forbidden","statusCode":403}',
        timestamp: '2026-10-06T10:00:00.000Z',
      },
    });
  });

  it('httpExceptionFor builds the Nest class of the mapped status with the error message', () => {
    const exception = httpExceptionFor(new DomainError('not_found', 'No such fact.'));
    expect(exception).toBeInstanceOf(NotFoundException);
    expect(exception.getStatus()).toBe(404);
    expect(exception.getResponse()).toEqual({ message: 'No such fact.', error: 'Not Found', statusCode: 404 });
    expect(httpExceptionFor(new DomainError('weird' as DomainErrorCode, 'x'))).toBeInstanceOf(InternalServerErrorException);
  });

  it('hands anything that is not a DomainError to the filter unchanged, as the host\'s global filter would get it', () => {
    const plain = fakeRes();
    new LegacyEnvelope().send(plain.res, new Error('not a domain error'), 'r');
    expect(JSON.stringify(plain.written())).toBe(liveAnswer(new Error('not a domain error')));
    expect(plain.written().status).toBe(500);

    const http = fakeRes();
    new LegacyEnvelope().send(http.res, new ConflictException('taken'), 'r');
    expect(JSON.stringify(http.written())).toBe(liveAnswer(new ConflictException('taken')));
    expect(http.written().status).toBe(409);
  });

  describe('legacyShape', () => {
    const shape = jest.fn((res: Response, err: DomainError) => {
      res.status(200).json([{ msg: -1, value: 'Failed ', error: err.message }]);
    });
    const envelope = new LegacyEnvelope({ legacyShape: { 'core.myteamusers': shape } });

    beforeEach(() => shape.mockClear());

    it('answers the bound route in its own legacy shape (coreapi 200 [{msg:-1}]) instead of the filter body', () => {
      const { res, written } = fakeRes();
      const err = new DomainError('upstream', 'db said no');
      envelope.send(res, err, 'core.myteamusers');
      expect(written()).toEqual({ status: 200, body: [{ msg: -1, value: 'Failed ', error: 'db said no' }] });
      expect(shape).toHaveBeenCalledWith(res, err, 'core.myteamusers');
    });

    it('leaves every other route, a null route id and non-DomainErrors on the filter path', () => {
      const other = fakeRes();
      envelope.send(other.res, new DomainError('upstream', 'db said no'), 'realtime.teamusers');
      expect(other.written().status).toBe(502);

      const anonymous = fakeRes();
      envelope.send(anonymous.res, new DomainError('upstream', 'db said no'), null);
      expect(anonymous.written().status).toBe(502);

      const http = fakeRes();
      envelope.send(http.res, new InternalServerErrorException('Failed to fetch team members'), 'core.myteamusers');
      expect(http.written().status).toBe(500);
      expect(shape).not.toHaveBeenCalled();
    });

    it('never resolves an inherited object property as a route shape', () => {
      expect(envelope.shapeOf('constructor')).toBeNull();
      expect(envelope.shapeOf('toString')).toBeNull();
      expect(envelope.shapeOf('__proto__')).toBeNull();
      expect(envelope.shapeOf('core.myteamusers')).toBe(shape);
      expect(new LegacyEnvelope().shapeOf('constructor')).toBeNull();
    });
  });
});
