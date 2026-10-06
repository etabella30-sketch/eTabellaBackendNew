import { ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';

import { MARK_AUDIENCE_SQL } from '../services/marks/mark-audience.sql';
import { MARK_AUDIENCE_READ_MS, MARK_WRITE_KEY, MarkWrite, MarkWriteInterceptor, MarkWriteSpec } from './mark-write.interceptor';

// Live mark sync (user decision 2026-10-05): after a successful mark write, the mark's audience before and after
// the write is told "the marks of this session changed". The interceptor only reads who can see the mark; the
// grouping and the emits are MarkEventsService's (mark-events.service.spec.ts).

const ME = '11111111-1111-4111-8111-111111111111';
const FRIEND = '22222222-2222-4222-8222-222222222222';
const THIRD = '44444444-4444-4444-8444-444444444444';
const SES = '33333333-3333-4333-8333-333333333333';
const MARK = '55555555-5555-4555-8555-555555555555';

class Probe {
    @MarkWrite({ kind: 'F', op: 'insert', idFrom: 'reply.nFSid' }) insertFact() { }
    @MarkWrite({ kind: 'F', op: 'update', idFrom: 'body.nFSid' }) saveFact() { }
    @MarkWrite({ kind: 'F', op: 'delete', idFrom: 'body.nFSid' }) deleteFact() { }
    @MarkWrite({ kind: 'Q', op: 'insert', idFrom: 'reply.nHid' }) insertQuickMark() { }
    @MarkWrite({ kind: 'Q', op: 'delete', idFrom: 'body.nHid' }) deleteQuickMark() { }
    @MarkWrite({ kind: 'D', op: 'delete', idFrom: 'body.nDocid' }) deleteDocLink() { }
    @MarkWrite({ kind: 'F', op: 'unshare', idFrom: 'body.nFSid' }) unshareFact() { }
    plain() { }
}

type Row = { nSesid: string | null; nOwner: string; aShared: string[] } | null;

function world(opts: { enabled?: boolean } = {}) {
    const order: string[] = [];
    /** what each audience read answers, in call order (a function gets the id) */
    const answers: Array<Row | Error | Promise<any> | ((id: string) => Row)> = [];
    const db = {
        rowQuery: jest.fn(async (text: string, params: any[]) => {
            const kind = (Object.keys(MARK_AUDIENCE_SQL) as Array<keyof typeof MARK_AUDIENCE_SQL>).find(k => MARK_AUDIENCE_SQL[k] === text);
            order.push(`read:${kind}:${params[0]}`);
            const next = answers.shift();
            if (next instanceof Error) return { success: false, error: next.message };
            if (next instanceof Promise) return next;
            const row = typeof next === 'function' ? next(params[0]) : next;
            return { success: true, data: row ? [row] : [] };
        }),
    };
    const marks = { enabled: jest.fn(() => opts.enabled ?? true), changed: jest.fn() };
    const interceptor = new MarkWriteInterceptor(new Reflector(), marks as any, db as any);
    return { order, answers, db, marks, interceptor };
}

function ctx(handler: Function, req: any, res: any = { statusCode: 201 }) {
    return {
        getType: () => 'http',
        getHandler: () => handler,
        getClass: () => Probe,
        switchToHttp: () => ({ getRequest: () => req, getResponse: () => res }),
    } as any;
}

const req = (body: any = {}) => ({ body, user: { userId: ME, isAdmin: false } });

/** A CallHandler whose handler logs when it runs (Nest's handle() runs the route on subscribe). */
function handler(order: string[], reply: () => Observable<unknown>) {
    return { handle: jest.fn(() => new Observable<unknown>(sub => { order.push('handler'); return reply().subscribe(sub); })) };
}

/** Let the background after-write work (an awaited read, then changed()) finish. */
const settle = () => new Promise(resolve => setImmediate(resolve));

describe('MarkWriteInterceptor', () => {
    beforeAll(() => Logger.overrideLogger(false));

    it('@MarkWrite records its spec on the route and installs the interceptor', () => {
        const spec: MarkWriteSpec = new Reflector().get(MARK_WRITE_KEY, Probe.prototype.saveFact);
        expect(spec).toEqual({ kind: 'F', op: 'update', idFrom: 'body.nFSid' });
        expect(Reflect.getMetadata('__interceptors__', Probe.prototype.saveFact)).toEqual([MarkWriteInterceptor]);
        expect(new Reflector().get(MARK_WRITE_KEY, Probe.prototype.plain)).toBeUndefined();
    });

    it('insert: no read before; after the reply, the new mark\'s audience by the id in the reply', async () => {
        const w = world();
        w.answers.push({ nSesid: SES, nOwner: ME, aShared: [FRIEND] });
        const reply = { msg: 1, value: 'Fact inserted successfully', nFSid: MARK.toUpperCase(), color: 'ff0000' };
        const out = await firstValueFrom(w.interceptor.intercept(ctx(Probe.prototype.insertFact, req({ nSesid: SES })), handler(w.order, () => of(reply))));
        expect(out).toBe(reply);
        await settle();
        expect(w.order).toEqual(['handler', `read:F:${MARK}`]);
        expect(w.marks.changed.mock.calls).toEqual([[{ nSesid: SES, kind: 'F', by: ME, users: [ME, FRIEND] }]]);
    });

    it('update: audience before ∪ after, so someone taken off the share is told too', async () => {
        const w = world();
        w.answers.push({ nSesid: SES, nOwner: ME, aShared: [FRIEND] }, { nSesid: SES, nOwner: ME, aShared: [THIRD] });
        await firstValueFrom(w.interceptor.intercept(ctx(Probe.prototype.saveFact, req({ nFSid: MARK })), handler(w.order, () => of({ msg: 1 }))));
        await settle();
        expect(w.order).toEqual([`read:F:${MARK}`, 'handler', `read:F:${MARK}`]);
        expect(w.marks.changed.mock.calls).toEqual([[{ nSesid: SES, kind: 'F', by: ME, users: [ME, FRIEND, THIRD] }]]);
    });

    it.each([
        ['deleteFact', 'F', 'nFSid', { msg: 1, value: 'Deleted' }],
        ['deleteQuickMark', 'Q', 'nHid', [{ msg: 1, value: 'Deleted' }]],
        ['deleteDocLink', 'D', 'nDocid', [{ msg: 1, value: 'Deleted' }]],
    ] as const)('delete (%s): reads the audience BEFORE the delete runs, and never after', async (route, kind, key, reply) => {
        const w = world();
        w.answers.push({ nSesid: SES, nOwner: ME, aShared: kind === 'Q' ? [] : [FRIEND] });
        await firstValueFrom(w.interceptor.intercept(ctx((Probe.prototype as any)[route], req({ [key]: MARK })), handler(w.order, () => of(reply))));
        await settle();
        expect(w.order).toEqual([`read:${kind}:${MARK}`, 'handler']);
        expect(w.marks.changed.mock.calls).toEqual([[{ nSesid: SES, kind, by: ME, users: kind === 'Q' ? [ME] : [ME, FRIEND] }]]);
    });

    // factsheet/unshare ("Remove from my list") checks no permission and its SP answers msg 1 even when it removed no
    // share row, so only a caller who could see the fact before and cannot after has changed anything.
    describe('unshare', () => {
        const unshare = async (w: ReturnType<typeof world>) => {
            await firstValueFrom(w.interceptor.intercept(ctx(Probe.prototype.unshareFact, req({ nFSid: MARK })), handler(w.order, () => of({ msg: 1, value: 'Unshared' }))));
            await settle();
        };

        it('a recipient leaves: the author and the caller (their other devices) are told', async () => {
            const w = world();
            w.answers.push({ nSesid: SES, nOwner: FRIEND, aShared: [ME, THIRD] }, { nSesid: SES, nOwner: FRIEND, aShared: [THIRD] });
            await unshare(w);
            expect(w.order).toEqual([`read:F:${MARK}`, 'handler', `read:F:${MARK}`]);
            expect(w.marks.changed.mock.calls).toEqual([[{ nSesid: SES, kind: 'F', by: ME, users: [FRIEND, ME, THIRD] }]]);
        });

        it('the read after fails: the audience before is still told', async () => {
            const w = world();
            w.answers.push({ nSesid: SES, nOwner: FRIEND, aShared: [ME] }, new Error('db down'));
            await unshare(w);
            expect(w.marks.changed.mock.calls).toEqual([[{ nSesid: SES, kind: 'F', by: ME, users: [FRIEND, ME] }]]);
        });

        it.each([
            ['someone it was never shared with', { nSesid: SES, nOwner: FRIEND, aShared: [THIRD] }, { nSesid: SES, nOwner: FRIEND, aShared: [THIRD] }],
            ['its own author (still sees it)', { nSesid: SES, nOwner: ME, aShared: [FRIEND] }, { nSesid: SES, nOwner: ME, aShared: [FRIEND] }],
            ['a caller whose read before failed', new Error('db down'), { nSesid: SES, nOwner: FRIEND, aShared: [] }],
        ] as Array<[string, Row | Error, Row]>)('tells nobody when the caller is %s', async (_label, before, after) => {
            const w = world();
            w.answers.push(before, after);
            await unshare(w);
            expect(w.order).toEqual([`read:F:${MARK}`, 'handler', `read:F:${MARK}`]);
            expect(w.marks.changed).not.toHaveBeenCalled();
        });
    });

    it('Quick Mark insert: the id comes from the SP row the route answers (an array of rows)', async () => {
        const w = world();
        w.answers.push({ nSesid: SES, nOwner: ME, aShared: [] });
        await firstValueFrom(w.interceptor.intercept(ctx(Probe.prototype.insertQuickMark, req({ nSessionid: SES })), handler(w.order, () => of([{ msg: 1, nHid: MARK, nSessionId: SES }]))));
        await settle();
        expect(w.order).toEqual(['handler', `read:Q:${MARK}`]);
        expect(w.marks.changed).toHaveBeenCalledWith({ nSesid: SES, kind: 'Q', by: ME, users: [ME] });
    });

    describe('no notice when the write did not happen', () => {
        it.each([
            ['msg -1', { msg: -1, value: 'Fact not inserted successfully' }],
            ['msg "-1"', { msg: '-1', value: 'Failed' }],
            ['a refusal row (msg -3)', [{ msg: -3, value: 'not allowed' }]],
            ['a failure that still says msg 1 (doclink/docdelete catch)', { msg: 1, value: 'Doclink Delete Failed', error: {} }],
        ])('%s', async (_label, reply) => {
            const w = world();
            w.answers.push({ nSesid: SES, nOwner: ME, aShared: [] }, { nSesid: SES, nOwner: ME, aShared: [] });
            const out = await firstValueFrom(w.interceptor.intercept(ctx(Probe.prototype.saveFact, req({ nFSid: MARK })), handler(w.order, () => of(reply))));
            expect(out).toBe(reply);
            await settle();
            expect(w.order).toEqual([`read:F:${MARK}`, 'handler']);
            expect(w.marks.changed).not.toHaveBeenCalled();
        });

        it('a non-2xx status', async () => {
            const w = world();
            w.answers.push({ nSesid: SES, nOwner: ME, aShared: [] });
            await firstValueFrom(w.interceptor.intercept(ctx(Probe.prototype.insertFact, req(), { statusCode: 403 }), handler(w.order, () => of({ msg: 1, nFSid: MARK }))));
            await settle();
            expect(w.marks.changed).not.toHaveBeenCalled();
            expect(w.db.rowQuery).not.toHaveBeenCalled();
        });

        it('a handler that throws (the gate\'s 403): the error passes through unchanged', async () => {
            const w = world();
            w.answers.push({ nSesid: SES, nOwner: ME, aShared: [] });
            const refusal = new ForbiddenException('You are not permitted to edit this fact');
            await expect(firstValueFrom(w.interceptor.intercept(ctx(Probe.prototype.saveFact, req({ nFSid: MARK })), handler(w.order, () => throwError(() => refusal))))).rejects.toBe(refusal);
            await settle();
            expect(w.marks.changed).not.toHaveBeenCalled();
        });
    });

    it('skips a mark with no session (a Document Reader PDF mark) and one that cannot be found', async () => {
        const w = world();
        w.answers.push({ nSesid: null, nOwner: ME, aShared: [FRIEND] });
        await firstValueFrom(w.interceptor.intercept(ctx(Probe.prototype.insertFact, req()), handler(w.order, () => of({ msg: 1, nFSid: MARK }))));
        w.answers.push(null);
        await firstValueFrom(w.interceptor.intercept(ctx(Probe.prototype.insertFact, req()), handler(w.order, () => of({ msg: 1, nFSid: MARK }))));
        await settle();
        expect(w.marks.changed).not.toHaveBeenCalled();
    });

    it('a failed read before the write never blocks it; the read after still names the audience', async () => {
        const w = world();
        w.answers.push(new Error('db down'), { nSesid: SES, nOwner: ME, aShared: [FRIEND] });
        const out = await firstValueFrom(w.interceptor.intercept(ctx(Probe.prototype.saveFact, req({ nFSid: MARK })), handler(w.order, () => of({ msg: 1 }))));
        expect(out).toEqual({ msg: 1 });
        await settle();
        expect(w.marks.changed).toHaveBeenCalledWith({ nSesid: SES, kind: 'F', by: ME, users: [ME, FRIEND] });
        // A delete whose read failed: the write still runs, nothing is known to tell.
        const d = world();
        d.answers.push(new Error('db down'));
        await firstValueFrom(d.interceptor.intercept(ctx(Probe.prototype.deleteFact, req({ nFSid: MARK })), handler(d.order, () => of({ msg: 1 }))));
        await settle();
        expect(d.order).toEqual([`read:F:${MARK}`, 'handler']);
        expect(d.marks.changed).not.toHaveBeenCalled();
    });

    it(`a slow read before the write holds it at most MARK_AUDIENCE_READ_MS (${MARK_AUDIENCE_READ_MS} ms)`, async () => {
        jest.useFakeTimers();
        try {
            const w = world();
            w.answers.push(new Promise(() => undefined));
            let out: unknown;
            w.interceptor.intercept(ctx(Probe.prototype.deleteFact, req({ nFSid: MARK })), handler(w.order, () => of({ msg: 1 }))).subscribe(v => (out = v));
            await jest.advanceTimersByTimeAsync(MARK_AUDIENCE_READ_MS - 1);
            expect(w.order).toEqual([`read:F:${MARK}`]);
            await jest.advanceTimersByTimeAsync(1);
            expect(w.order).toEqual([`read:F:${MARK}`, 'handler']);
            expect(out).toEqual({ msg: 1 });
        } finally {
            jest.useRealTimers();
        }
    });

    it('answers the reply without waiting for the read after it', async () => {
        const w = world();
        let release: (v: any) => void;
        w.answers.push(new Promise(r => (release = r)));
        const out = await firstValueFrom(w.interceptor.intercept(ctx(Probe.prototype.insertFact, req()), handler(w.order, () => of({ msg: 1, nFSid: MARK }))));
        expect(out).toEqual({ msg: 1, nFSid: MARK });
        expect(w.marks.changed).not.toHaveBeenCalled();
        release({ success: true, data: [{ nSesid: SES, nOwner: ME, aShared: [] }] });
        await settle();
        expect(w.marks.changed).toHaveBeenCalledTimes(1);
    });

    describe('passes straight through (no read, no notice)', () => {
        it.each([
            ['RT_MARK_EVENTS is off', (w: ReturnType<typeof world>) => w.marks.enabled.mockReturnValue(false), req({ nFSid: MARK })],
            ['the route has no @MarkWrite', () => undefined, req({ nFSid: MARK })],
            ['the request has no verified user', () => undefined, { body: { nFSid: MARK } }],
            ['the body names no mark (not a uuid)', () => undefined, req({ nFSid: 'nope' })],
        ])('when %s', async (label, arrange, request) => {
            const w = world();
            arrange(w);
            w.answers.push({ nSesid: SES, nOwner: ME, aShared: [] });
            const route = label.includes('no @MarkWrite') ? Probe.prototype.plain : Probe.prototype.deleteFact;
            await firstValueFrom(w.interceptor.intercept(ctx(route, request), handler(w.order, () => of({ msg: 1 }))));
            await settle();
            expect(w.order).toEqual(['handler']);
            expect(w.marks.changed).not.toHaveBeenCalled();
        });

        it('without MarkEventsService or a database (a module that does not provide them)', async () => {
            for (const interceptor of [new MarkWriteInterceptor(new Reflector()), new MarkWriteInterceptor(new Reflector(), { enabled: () => true, changed: jest.fn() } as any)]) {
                const order: string[] = [];
                const out = await firstValueFrom(interceptor.intercept(ctx(Probe.prototype.deleteFact, req({ nFSid: MARK })), handler(order, () => of({ msg: 1 }))));
                expect(out).toEqual({ msg: 1 });
                expect(order).toEqual(['handler']);
            }
        });

        it('for a non-HTTP context', async () => {
            const w = world();
            const c = { ...ctx(Probe.prototype.deleteFact, req({ nFSid: MARK })), getType: () => 'ws' };
            await firstValueFrom(w.interceptor.intercept(c, handler(w.order, () => of({ msg: 1 }))));
            expect(w.order).toEqual(['handler']);
        });
    });
});
