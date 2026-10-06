import { ROUTE_ID_KEY, ROUTE_ID_METADATA, RouteId, routeIdFromContext, routeIdOf } from './route-id';

class Probe {
  @RouteId('kernel.one')
  one(): void {
    return;
  }

  two(): void {
    return;
  }
}

@RouteId('kernel.all')
class Whole {
  @RouteId('kernel.special')
  special(): void {
    return;
  }

  plain(): void {
    return;
  }
}

describe('RouteId', () => {
  it('pins the metadata and request keys', () => {
    expect(ROUTE_ID_METADATA).toBe('et:routeId');
    expect(ROUTE_ID_KEY).toBe('etRouteId');
    expect(Reflect.getMetadata(ROUTE_ID_METADATA, Probe.prototype.one)).toBe('kernel.one');
  });

  it('reads the handler id, else the class id, else null', () => {
    expect(routeIdFromContext({ getHandler: () => Probe.prototype.one, getClass: () => Probe })).toBe('kernel.one');
    expect(routeIdFromContext({ getHandler: () => Probe.prototype.two, getClass: () => Probe })).toBeNull();
    expect(routeIdFromContext({ getHandler: () => Whole.prototype.plain, getClass: () => Whole })).toBe('kernel.all');
    expect(routeIdFromContext({ getHandler: () => Whole.prototype.special, getClass: () => Whole })).toBe('kernel.special');
    expect(routeIdFromContext({ getHandler: () => undefined, getClass: () => undefined })).toBeNull();
  });

  it('routeIdOf reads only a non-empty string stamped on the request', () => {
    expect(routeIdOf({ [ROUTE_ID_KEY]: 'kernel.one' })).toBe('kernel.one');
    expect(routeIdOf({ [ROUTE_ID_KEY]: '' })).toBeNull();
    expect(routeIdOf({ [ROUTE_ID_KEY]: 7 })).toBeNull();
    expect(routeIdOf({})).toBeNull();
    expect(routeIdOf(null)).toBeNull();
    expect(routeIdOf(undefined)).toBeNull();
  });
});
