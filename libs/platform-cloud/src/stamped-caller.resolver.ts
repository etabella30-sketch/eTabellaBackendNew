/**
 * CALLER_RESOLVER of the live hosts. Authentication stays with each host's middleware (libs/global JwtMiddleware with
 * its Redis browser binding, realtime-server's RealtimeAuth* family with its edge-token allowlist): once it has
 * verified a request it stamps req[CALLER_KEY] (the one added line of Phase 1 step 6), and this resolver only reads
 * that back, through callerOf, so a half-stamped request still counts as not signed in. No token is parsed here, so
 * a bad token can never throw here either; the middleware has already answered it.
 */
import { Injectable } from '@nestjs/common';
import { Caller, callerOf, CallerResolver } from '@app/api-kernel';

@Injectable()
export class StampedCallerResolver implements CallerResolver {
  async resolve(req: unknown): Promise<Caller | null> {
    return callerOf(req);
  }
}
