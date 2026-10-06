import { ExecutionContext } from '@nestjs/common';
import { CALLER_KEY, Caller, CallerResolver } from './caller';
import { CallerGuard } from './caller.guard';
import { DomainError } from './errors';
import { ROUTE_ID_KEY, RouteId } from './route-id';

const ME = '11111111-1111-4111-8111-111111111111';
const caller: Caller = { userId: ME, family: 'cloud-jwt', isPlatformAdmin: false, caseScope: 'membership' };

class Probe {
  @RouteId('kernel.probe')
  named(): void {
    return;
  }

  unnamed(): void {
    return;
  }
}

function context(req: Record<string, unknown>, handler: (...args: unknown[]) => unknown = Probe.prototype.unnamed): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req, getResponse: () => ({}), getNext: () => undefined }),
    getHandler: () => handler,
    getClass: () => Probe,
    getType: () => 'http',
  } as unknown as ExecutionContext;
}

describe('CallerGuard', () => {
  let resolver: jest.Mocked<CallerResolver>;
  let guard: CallerGuard;

  beforeEach(() => {
    resolver = { resolve: jest.fn() };
    guard = new CallerGuard(resolver);
  });

  it('stamps the resolved caller on the request and lets the request through', async () => {
    resolver.resolve.mockResolvedValue(caller);
    const req: Record<string, unknown> = { headers: {} };
    await expect(guard.canActivate(context(req))).resolves.toBe(true);
    expect(req[CALLER_KEY]).toBe(caller);
    expect(resolver.resolve).toHaveBeenCalledWith(req);
  });

  it('answers unauthenticated when the resolver finds nobody, and stamps no caller', async () => {
    resolver.resolve.mockResolvedValue(null);
    const req: Record<string, unknown> = { headers: {} };
    await expect(guard.canActivate(context(req))).rejects.toMatchObject({ code: 'unauthenticated' });
    await expect(guard.canActivate(context(req))).rejects.toBeInstanceOf(DomainError);
    expect(req[CALLER_KEY]).toBeUndefined();
  });

  it('stamps the handler route id before resolving, so even a 401 reaches the envelope with its route', async () => {
    resolver.resolve.mockResolvedValue(null);
    const req: Record<string, unknown> = {};
    await expect(guard.canActivate(context(req, Probe.prototype.named))).rejects.toMatchObject({ code: 'unauthenticated' });
    expect(req[ROUTE_ID_KEY]).toBe('kernel.probe');

    resolver.resolve.mockResolvedValue(caller);
    const unnamed: Record<string, unknown> = {};
    await guard.canActivate(context(unnamed));
    expect(unnamed[ROUTE_ID_KEY]).toBeNull();
  });

  it('lets a resolver failure (host infrastructure, never a bad token) propagate to the host filter', async () => {
    resolver.resolve.mockRejectedValue(new Error('redis down'));
    await expect(guard.canActivate(context({}))).rejects.toThrow('redis down');
  });
});
