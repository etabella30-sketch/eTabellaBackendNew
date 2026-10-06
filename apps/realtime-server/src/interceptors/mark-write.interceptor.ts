/**
 * @MarkWrite + MarkWriteInterceptor: the one hook after each successful mark write (live mark sync, user decision
 * 2026-10-05). Quick Marks, QFacts / Facts and DocLinks are written by fact/*, factsheet/* and doclink/* routes that
 * answer HTTP only; this tells MarkEventsService who can see the changed mark, so their open Realtime pages reload
 * their marks without a refresh.
 *
 * - Before the route runs (update, delete): read who can see the mark (its "audience", mark-audience.sql.ts). A
 *   delete removes the share rows, so this is the only moment they can be read. The read is bounded
 *   (MARK_AUDIENCE_READ_MS) and a failure never blocks the write.
 * - After the route answered, only when the status is 2xx and the reply is not a failure (msg below 0, or an `error`
 *   in the reply): read the audience again (insert, update), in the background so the reply is not held up.
 * - Audience = before ∪ after: people taken off a share are told too, so the mark disappears for them.
 * - Unshare ("Remove from my list", factsheet/unshare) is read like an update, but it is only passed on when the
 *   writer was in the audience before and is not after. That route checks no permission and its SP answers msg 1
 *   even when it removed no share row, so anyone else calling it (someone the fact was never shared with, or its
 *   author) changed nothing. When the read before fails or times out, an unshare sends nothing.
 * - The session comes from the mark's own row. A mark with no session (a Document Reader PDF mark) sends nothing.
 *
 * The writer (`by`) is the verified token user (req.user, set by the auth middleware; a write made on a venue box
 * arrives with the real user's edge token). Without MarkEventsService or a database in the module, with
 * RT_MARK_EVENTS off, or without a verified user, the route runs exactly as before.
 */
import { applyDecorators, CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor, Optional, SetMetadata, UseInterceptors } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { defer, Observable, switchMap, tap } from 'rxjs';
import { MarkKind } from '@app/edge-sync';
import { DbService } from '@app/global/db/pg/db.service';

import { MarkAudience, markId, readMarkAudience } from '../services/marks/mark-audience.sql';
import { MarkEventsService } from '../services/marks/mark-events.service';

/** Metadata key of @MarkWrite. */
export const MARK_WRITE_KEY = 'rt:mark-write';

/** The longest a read before the write may hold the write up; past it the write runs as if the read failed. */
export const MARK_AUDIENCE_READ_MS = 2_000;

/** `unshare`: an update that counts only when it took the writer off the mark's audience (see the top of this file). */
export type MarkWriteOp = 'insert' | 'update' | 'delete' | 'unshare';

/** What a mark route writes, and where its mark id is. */
export interface MarkWriteSpec {
    kind: MarkKind;
    op: MarkWriteOp;
    /**
     * `body.<key>`: the request names the mark (update, delete, unshare); `reply.<key>`: the route answers the new id (insert).
     * A reply that is a list of SP rows is read from its first row.
     */
    idFrom: `body.${string}` | `reply.${string}`;
}

/** The first row when the value is a list of SP rows, else the value itself. */
const firstRow = (value: unknown): any => (Array.isArray(value) ? value[0] : value);

/** The mark id at `body.<key>` / `reply.<key>`. */
function idAt(spec: MarkWriteSpec, body: unknown, reply?: unknown): string | null {
    const [from, key] = spec.idFrom.split('.', 2);
    const source = from === 'body' ? body : firstRow(reply);
    return source && typeof source === 'object' ? markId((source as any)[key]) : null;
}

/**
 * The route wrote: a 2xx status and a reply that is not a failure. The routes answer failures as 200s with
 * `msg: -1` (or a negative refusal code), and doclink/docdelete's catch answers `msg: 1` with an `error`.
 */
export function writeSucceeded(statusCode: unknown, reply: unknown): boolean {
    const status = Number(statusCode ?? 200);
    if (!(status >= 200 && status < 300)) return false;
    const row = firstRow(reply);
    if (row && typeof row === 'object') {
        if (Number((row as any).msg) < 0) return false;
        if ((row as any).error) return false;
    }
    return true;
}

@Injectable()
export class MarkWriteInterceptor implements NestInterceptor {
    private readonly logger = new Logger('MarkWrite');

    constructor(
        private readonly reflector: Reflector,
        // Both optional: a module (or a test) without them keeps the route exactly as it was.
        @Optional() private readonly marks?: MarkEventsService,
        @Optional() private readonly db?: DbService,
    ) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const spec = this.reflector.get<MarkWriteSpec | undefined>(MARK_WRITE_KEY, context.getHandler());
        if (!spec || !this.marks || !this.db || context.getType() !== 'http' || !this.marks.enabled()) return next.handle();
        const http = context.switchToHttp();
        const req: any = http.getRequest();
        const res: any = http.getResponse();
        const by = markId(req?.user?.userId);
        if (!by) return next.handle();
        const bodyId = spec.idFrom.startsWith('body.') ? idAt(spec, req?.body) : null;
        if (spec.idFrom.startsWith('body.') && !bodyId) return next.handle();

        return defer(() => (spec.op === 'insert' ? Promise.resolve(null) : this.audience(spec.kind, bodyId))).pipe(
            switchMap(before =>
                next.handle().pipe(
                    tap(reply => {
                        if (writeSucceeded(res?.statusCode, reply)) void this.afterWrite(spec, by, bodyId, reply, before);
                    }),
                ),
            ),
        );
    }

    private async afterWrite(spec: MarkWriteSpec, by: string, bodyId: string | null, reply: unknown, before: MarkAudience | null): Promise<void> {
        try {
            const id = spec.op === 'insert' ? idAt(spec, null, reply) : bodyId;
            const after = spec.op === 'delete' || !id ? null : await this.audience(spec.kind, id);
            // An unshare that did not take the writer off the audience changed nothing, whatever the SP answered.
            if (spec.op === 'unshare' && !(before?.users.includes(by) && !after?.users.includes(by))) return;
            const nSesid = after?.nSesid ?? before?.nSesid ?? null;
            if (!nSesid) return;
            const users = [...new Set([...(before?.users ?? []), ...(after?.users ?? [])])];
            this.marks.changed({ nSesid, kind: spec.kind, by, users });
        } catch (error) {
            this.logger.warn(`mark change (${spec.kind} ${spec.op}) not passed on: ${(error as Error)?.message ?? error}`);
        }
    }

    /** The audience of one mark, or null (not found, the read failed, or it took longer than MARK_AUDIENCE_READ_MS). */
    private async audience(kind: MarkKind, id: string): Promise<MarkAudience | null> {
        let timer: ReturnType<typeof setTimeout>;
        const bound = new Promise<null>(resolve => {
            timer = setTimeout(() => {
                this.logger.warn(`mark audience read (${kind} ${id}) took longer than ${MARK_AUDIENCE_READ_MS} ms`);
                resolve(null);
            }, MARK_AUDIENCE_READ_MS);
        });
        try {
            return await Promise.race([readMarkAudience(this.db, kind, id), bound]);
        } catch (error) {
            this.logger.warn(`mark audience read (${kind} ${id}) failed: ${(error as Error)?.message ?? error}`);
            return null;
        } finally {
            clearTimeout(timer);
        }
    }
}

/**
 * Marks a route as a mark write: after a successful answer, the people who can see the mark are told that the
 * marks of its session changed (see MarkWriteInterceptor).
 */
export function MarkWrite(spec: MarkWriteSpec): MethodDecorator {
    return applyDecorators(SetMetadata(MARK_WRITE_KEY, spec), UseInterceptors(MarkWriteInterceptor));
}
