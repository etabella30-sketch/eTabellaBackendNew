/**
 * Names a handler's manifest route for the ErrorEnvelope. Nest hands an exception filter only the request and the
 * response (router-proxy builds a fresh ArgumentsHost without the handler), so the id is read from the handler's
 * metadata by CallerGuard and stamped on the request, where DomainErrorFilter picks it up.
 */
import { CustomDecorator, SetMetadata } from '@nestjs/common';

/** Metadata key of @RouteId on a handler or a controller class. */
export const ROUTE_ID_METADATA = 'et:routeId';

/** The request property CallerGuard stamps the route id on. */
export const ROUTE_ID_KEY = 'etRouteId';

/** Where a guard reads handler and class metadata from: what an ExecutionContext offers, without its generics. */
export interface MetadataTargets {
  getHandler(): object | undefined;
  getClass(): object | undefined;
}

/** Declares the manifest id (`libs/api-contracts` ROUTE_MANIFEST row id) of a handler, or of every handler of a class. */
export const RouteId = (id: string): CustomDecorator<string> => SetMetadata(ROUTE_ID_METADATA, id);

/** The @RouteId of the handler, else of its class, else null. */
export function routeIdFromContext(context: MetadataTargets): string | null {
  for (const target of [context.getHandler(), context.getClass()]) {
    if (!target) continue;
    const id: unknown = Reflect.getMetadata(ROUTE_ID_METADATA, target);
    if (typeof id === 'string' && id) return id;
  }
  return null;
}

/** The route id stamped on a request, else null. */
export function routeIdOf(req: unknown): string | null {
  const id = (req as Record<string, unknown> | null)?.[ROUTE_ID_KEY];
  return typeof id === 'string' && id ? id : null;
}
