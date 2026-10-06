/**
 * The mark-write hook port (shared-libraries plan Phase 7a). A shared controller that writes a mark (a Fact, a
 * Quick Mark, a DocLink) names the write on its handler with `@MarkWrite(spec)`; the host decides what happens
 * around it. On realtime-server that is its MarkWriteInterceptor (interceptors/mark-write.interceptor.ts, live mark
 * sync of 2026-10-05: it reads who can see the mark BEFORE the write, bounded to two seconds, and tells
 * MarkEventsService after a successful one); on the venue box nothing is bound and the handler runs as is, because
 * the cloud sends `c.marks` back over the uplink for every relayed write.
 *
 * Why an interceptor port and not a `marks.changed` DomainEvent on EVENT_DELIVERY: the audience of a deleted or
 * unshared mark can only be read before the write, and that read is bounded by a timer, which shared code may not
 * own (R3). The host keeps both; the shared controller only declares the fact of the write, with the metadata key
 * and shape realtime-server's interceptor has read since 2026-10-05, so the one interceptor serves app routes and
 * shared routes alike.
 */
import { applyDecorators, CallHandler, ExecutionContext, Inject, Injectable, NestInterceptor, Optional, SetMetadata, UseInterceptors } from '@nestjs/common';
import type { Observable } from 'rxjs';

/** Metadata key of @MarkWrite on a handler (the value realtime-server's interceptor reads). */
export const MARK_WRITE_KEY = 'rt:mark-write';

/** F Fact (QFact included), Q Quick Mark, D DocLink: the mark families with their own share rows. */
export type MarkWriteKind = 'F' | 'Q' | 'D';

/** `unshare`: an update that counts only when it took the writer off the mark's audience. */
export type MarkWriteOp = 'insert' | 'update' | 'delete' | 'unshare';

/** What a mark route writes, and where its mark id is. */
export interface MarkWriteSpec {
  readonly kind: MarkWriteKind;
  readonly op: MarkWriteOp;
  /**
   * `body.<key>`: the request names the mark (update, delete, unshare); `reply.<key>`: the route answers the new id
   * (insert). A reply that is a list of SP rows is read from its first row.
   */
  readonly idFrom: `body.${string}` | `reply.${string}`;
}

/** The port: the host's interceptor around a mark write, if it has one. */
export const MARK_WRITE_HOOK = 'ET_MARK_WRITE_HOOK';

/**
 * The interceptor every @MarkWrite handler of a shared controller carries. It delegates to the host's MARK_WRITE_HOOK
 * when one is bound and is a pass-through otherwise, so a box without a hook, or a test without one, runs the route
 * exactly as written.
 */
@Injectable()
export class MarkWriteHook implements NestInterceptor {
  constructor(@Optional() @Inject(MARK_WRITE_HOOK) private readonly hook: NestInterceptor | null = null) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> | Promise<Observable<unknown>> {
    return this.hook ? this.hook.intercept(context, next) : next.handle();
  }
}

/** The @MarkWrite of the handler, else null. */
export function markWriteOf(handler: object | undefined): MarkWriteSpec | null {
  if (!handler) return null;
  const spec: unknown = Reflect.getMetadata(MARK_WRITE_KEY, handler);
  return spec && typeof spec === 'object' && typeof (spec as MarkWriteSpec).idFrom === 'string' ? (spec as MarkWriteSpec) : null;
}

/** Declares a handler of a shared controller as a mark write (see the top of this file). */
export function MarkWrite(spec: MarkWriteSpec): MethodDecorator {
  return applyDecorators(SetMetadata(MARK_WRITE_KEY, spec), UseInterceptors(MarkWriteHook));
}
