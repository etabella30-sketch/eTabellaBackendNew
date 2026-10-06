import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { CALLER_KEY, CALLER_RESOLVER, Caller, callerOf } from './caller';
import { DomainError } from './errors';

const ME = '11111111-1111-4111-8111-111111111111';
const caller: Caller = { userId: ME, family: 'edge-online', isPlatformAdmin: false, caseScope: ['ca5e0000-0000-4000-8000-0000000000c1'] };

/** The factory Nest would call for a `@Caller()` parameter (createParamDecorator stores it in the route-args metadata). */
function callerFactory(): (data: unknown, context: ExecutionContext) => unknown {
  class Probe {
    handler(@Caller() _caller: Caller): void {
      return;
    }
  }
  const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, Probe, 'handler');
  return args[Object.keys(args)[0]].factory;
}

const httpContext = (req: unknown): ExecutionContext =>
  ({ switchToHttp: () => ({ getRequest: () => req }) }) as unknown as ExecutionContext;

describe('Caller', () => {
  it('pins the resolver token and the request key the live middleware stamps', () => {
    expect(CALLER_RESOLVER).toBe('ET_CALLER_RESOLVER');
    expect(CALLER_KEY).toBe('etCaller');
  });

  it('callerOf reads a stamped caller and refuses anything half-formed', () => {
    expect(callerOf({ [CALLER_KEY]: caller })).toBe(caller);
    expect(callerOf({})).toBeNull();
    expect(callerOf(null)).toBeNull();
    expect(callerOf(undefined)).toBeNull();
    expect(callerOf({ [CALLER_KEY]: 'me' })).toBeNull();
    expect(callerOf({ [CALLER_KEY]: { userId: '', family: 'cloud-jwt' } })).toBeNull();
    expect(callerOf({ [CALLER_KEY]: { userId: ME } })).toBeNull();
  });

  it('@Caller() hands the handler the stamped caller', () => {
    expect(callerFactory()(undefined, httpContext({ [CALLER_KEY]: caller }))).toBe(caller);
  });

  it('@Caller() without a stamped caller throws unauthenticated instead of handing over undefined', () => {
    expect(() => callerFactory()(undefined, httpContext({}))).toThrow(DomainError);
    try {
      callerFactory()(undefined, httpContext({ body: { nMasterid: ME } }));
    } catch (err) {
      expect((err as DomainError).code).toBe('unauthenticated');
    }
  });
});
