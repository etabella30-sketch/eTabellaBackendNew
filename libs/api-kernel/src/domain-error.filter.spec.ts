import { ArgumentsHost } from '@nestjs/common';
import { FILTER_CATCH_EXCEPTIONS } from '@nestjs/common/constants';
import { domainErrorBody, DomainErrorFilter } from './domain-error.filter';
import { DOMAIN_ERROR_STATUS, DomainError, DomainErrorCode, ErrorEnvelope } from './errors';
import { ROUTE_ID_KEY } from './route-id';

function host(req: Record<string, unknown> = {}): { host: ArgumentsHost; res: { status: jest.Mock; json: jest.Mock } } {
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  return { res, host: { switchToHttp: () => ({ getRequest: () => req, getResponse: () => res }) } as unknown as ArgumentsHost };
}

describe('DomainErrorFilter', () => {
  it('catches DomainError only, so every other exception still reaches the host filter', () => {
    expect(Reflect.getMetadata(FILTER_CATCH_EXCEPTIONS, DomainErrorFilter)).toEqual([DomainError]);
  });

  it('without an envelope answers the plain {statusCode, cCode, message} and keeps detail server-side', () => {
    const { host: h, res } = host();
    new DomainErrorFilter().catch(new DomainError('conflict', 'Already there.', { nFSid: 'f1' }), h);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ statusCode: 409, cCode: 'conflict', message: 'Already there.' });
  });

  it.each(Object.keys(DOMAIN_ERROR_STATUS) as DomainErrorCode[])('maps %s to its status', (code) => {
    const { host: h, res } = host();
    new DomainErrorFilter(null).catch(new DomainError(code, code), h);
    expect(res.status).toHaveBeenCalledWith(DOMAIN_ERROR_STATUS[code]);
    expect(res.json).toHaveBeenCalledWith({ statusCode: DOMAIN_ERROR_STATUS[code], cCode: code, message: code });
  });

  it('domainErrorBody answers 500 for a code it does not know rather than leaking a 200', () => {
    expect(domainErrorBody(new DomainError('made_up' as DomainErrorCode, 'x'))).toEqual({ statusCode: 500, cCode: 'made_up', message: 'x' });
  });

  it('with an envelope bound, hands it the response, the error and the stamped route id and writes nothing itself', () => {
    const envelope: jest.Mocked<ErrorEnvelope> = { send: jest.fn() };
    const err = new DomainError('offline', 'The cloud is not reachable.');
    const named = host({ [ROUTE_ID_KEY]: 'core.myteamusers' });
    new DomainErrorFilter(envelope).catch(err, named.host);
    expect(envelope.send).toHaveBeenCalledWith(named.res, err, 'core.myteamusers');
    expect(named.res.status).not.toHaveBeenCalled();
    expect(named.res.json).not.toHaveBeenCalled();

    const unnamed = host({});
    new DomainErrorFilter(envelope).catch(err, unnamed.host);
    expect(envelope.send).toHaveBeenLastCalledWith(unnamed.res, err, null);
  });
});
