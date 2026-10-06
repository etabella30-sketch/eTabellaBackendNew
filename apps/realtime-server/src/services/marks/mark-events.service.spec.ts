import { Logger } from '@nestjs/common';
import { EdgeEvent, MARKS_CHANGED_EVENT } from '@app/edge-sync';

import { MARK_EVENTS_WINDOW_MS, MarkEventsService } from './mark-events.service';

// Live mark sync (user decision 2026-10-05): notices only, grouped per (session, user) over 300 ms, to the user's
// own room; the session's venue box gets one c.marks per window when it is online.

const SES = '33333333-3333-4333-8333-333333333333';
const SES2 = '66666666-6666-4666-8666-666666666666';
const ME = '11111111-1111-4111-8111-111111111111';
const FRIEND = '22222222-2222-4222-8222-222222222222';
const THIRD = '44444444-4444-4444-8444-444444444444';
const BOX = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

function world(env: Record<string, string | undefined> = {}) {
    const config = { get: (k: string) => env[k] };
    const emitted: Array<{ room: string; event: string; payload: any }> = [];
    const server = { to: jest.fn((room: string) => ({ emit: (event: string, payload: any): unknown => emitted.push({ room, event, payload }) })) };
    const bindings = new Map<string, any>([[SES, { nSesid: SES, nEdgeid: BOX, bDeleted: false }], [SES2, { nSesid: SES2, nEdgeid: null, bDeleted: false }]]);
    const online = new Set<string>([BOX]);
    const edgeSync = { binding: jest.fn(async (id: string) => bindings.get(id) ?? null) };
    const link = {
        connection: jest.fn((id: string) => (online.has(id) ? { nEdgeid: id } : null)),
        notify: jest.fn((_id: string, _event: string, _payload: unknown) => true),
    };
    const registry = { gateway: link as any };
    const service = new MarkEventsService(config as any, edgeSync as any, registry as any);
    service.server = server;
    return { env, service, server, emitted, edgeSync, link, registry, bindings, online };
}

const settle = async (ms = MARK_EVENTS_WINDOW_MS) => {
    await jest.advanceTimersByTimeAsync(ms);
};

describe('MarkEventsService', () => {
    beforeAll(() => Logger.overrideLogger(false));
    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(1_760_000_000_000);
    });
    afterEach(() => jest.useRealTimers());

    it('waits 300 ms, then sends ONE marks-changed per user for 5 writes, to U<user> only', async () => {
        const w = world();
        for (let i = 0; i < 5; i++) {
            w.service.changed({ nSesid: SES, kind: i % 2 ? 'Q' : 'F', by: ME, users: [ME] });
            await jest.advanceTimersByTimeAsync(10);
        }
        expect(w.emitted).toEqual([]);
        await settle();
        expect(w.emitted).toEqual([{ room: `U${ME}`, event: MARKS_CHANGED_EVENT, payload: { nSesid: SES, kinds: ['Q', 'F'], by: ME, atMs: 1_760_000_000_040 } }]);
        expect(w.emitted[0].event).toBe('marks-changed');
        // No session room, never realtime-events (the live feed store would re-sync the transcript text).
        expect(w.server.to.mock.calls.map(c => c[0])).toEqual([`U${ME}`]);
    });

    it('the window runs from the first write: a steady stream still flushes every 300 ms', async () => {
        const w = world();
        w.service.changed({ nSesid: SES, kind: 'F', by: ME, users: [ME] });
        await jest.advanceTimersByTimeAsync(200);
        w.service.changed({ nSesid: SES, kind: 'F', by: ME, users: [ME] });
        await jest.advanceTimersByTimeAsync(100);
        expect(w.emitted).toHaveLength(1);
        w.service.changed({ nSesid: SES, kind: 'D', by: ME, users: [ME] });
        await settle();
        expect(w.emitted.map(e => e.payload.kinds)).toEqual([['F'], ['D']]);
    });

    it('gives every user of the audience their own notice, and each session its own', async () => {
        const w = world();
        w.service.changed({ nSesid: SES, kind: 'F', by: ME, users: [ME, FRIEND.toUpperCase(), FRIEND] });
        w.service.changed({ nSesid: SES2, kind: 'D', by: ME, users: [ME] });
        await settle();
        const sent = w.emitted.map(e => [e.room, e.payload.nSesid, e.payload.kinds]).sort();
        expect(sent).toEqual([
            [`U${FRIEND}`, SES, ['F']],
            [`U${ME}`, SES, ['F']],
            [`U${ME}`, SES2, ['D']],
        ].sort());
    });

    it('names in `by` someone other than the recipient when others wrote too (the own-echo skip never hides their change)', async () => {
        const w = world();
        w.service.changed({ nSesid: SES, kind: 'F', by: FRIEND, users: [ME, FRIEND] });
        w.service.changed({ nSesid: SES, kind: 'F', by: ME, users: [ME, FRIEND] });
        await settle();
        const byRoom = Object.fromEntries(w.emitted.map(e => [e.room, e.payload.by]));
        expect(byRoom).toEqual({ [`U${ME}`]: FRIEND, [`U${FRIEND}`]: ME });

        w.emitted.length = 0;
        w.service.changed({ nSesid: SES, kind: 'Q', by: ME, users: [ME] });
        await settle();
        expect(w.emitted.map(e => e.payload.by)).toEqual([ME]);
    });

    it('ignores a notice without a session, a writer, an audience or a known kind', async () => {
        const w = world();
        w.service.changed({ nSesid: null as any, kind: 'F', by: ME, users: [ME] });
        w.service.changed({ nSesid: 'not-a-uuid', kind: 'F', by: ME, users: [ME] });
        w.service.changed({ nSesid: SES, kind: 'X' as any, by: ME, users: [ME] });
        w.service.changed({ nSesid: SES, kind: 'F', by: '', users: [ME] });
        w.service.changed({ nSesid: SES, kind: 'F', by: ME, users: [] });
        w.service.changed({ nSesid: SES, kind: 'F', by: ME, users: ['junk', null as any] });
        await settle(1_000);
        expect(w.emitted).toEqual([]);
        expect(w.link.notify).not.toHaveBeenCalled();
    });

    describe('RT_MARK_EVENTS kill switch (default on)', () => {
        it.each([undefined, '', '1', 'true', 'on', 'yes'])('on for %p', value => {
            expect(world({ RT_MARK_EVENTS: value }).service.enabled()).toBe(true);
        });

        it.each(['0', 'false', 'FALSE', 'off', 'no', ' Off '])('off for %p: nothing is sent, to devices or to the box', async value => {
            const w = world({ RT_MARK_EVENTS: value, EDGE_ENABLED: '1' });
            expect(w.service.enabled()).toBe(false);
            w.service.changed({ nSesid: SES, kind: 'F', by: ME, users: [ME] });
            await settle(1_000);
            expect(w.emitted).toEqual([]);
            expect(w.edgeSync.binding).not.toHaveBeenCalled();
            expect(w.link.notify).not.toHaveBeenCalled();
        });
    });

    it('sends nothing, and does not throw, before EventsGateway handed the server over', async () => {
        const w = world();
        w.service.server = null;
        w.service.changed({ nSesid: SES, kind: 'F', by: ME, users: [ME] });
        await settle();
        expect(w.emitted).toEqual([]);
    });

    it('a failing emit is logged, not thrown; the other users still get theirs', async () => {
        const w = world();
        w.server.to.mockImplementation((room: string) => ({
            emit: (event: string, payload: any) => {
                if (room === `U${ME}`) throw new Error('adapter down');
                w.emitted.push({ room, event, payload });
            },
        }));
        w.service.changed({ nSesid: SES, kind: 'F', by: ME, users: [ME, FRIEND] });
        await settle();
        expect(w.emitted.map(e => e.room)).toEqual([`U${FRIEND}`]);
    });

    describe('c.marks to the session\'s venue box', () => {
        it('one c.marks per session per window, no ack, only with EDGE_ENABLED and the box online', async () => {
            const w = world({ EDGE_ENABLED: '1' });
            for (let i = 0; i < 5; i++) w.service.changed({ nSesid: SES, kind: i ? 'F' : 'D', by: ME, users: i === 4 ? [FRIEND] : [ME] });
            await settle();
            expect(w.edgeSync.binding).toHaveBeenCalledTimes(1);
            expect(w.link.notify.mock.calls).toEqual([[BOX, EdgeEvent.marks, { nSesid: SES, users: [ME, FRIEND], kinds: ['F', 'D'], atMs: 1_760_000_000_000 }]]);
            expect(EdgeEvent.marks).toBe('c.marks');
        });

        it.each([
            ['EDGE_ENABLED is off', { EDGE_ENABLED: '0' }, (_w: ReturnType<typeof world>) => undefined],
            ['the box is offline', { EDGE_ENABLED: '1' }, (w: ReturnType<typeof world>) => w.online.clear()],
            ['the /edge gateway is not attached', { EDGE_ENABLED: '1' }, (w: ReturnType<typeof world>) => { w.registry.gateway = null; }],
            ['the binding is deleted', { EDGE_ENABLED: 'true' }, (w: ReturnType<typeof world>) => { w.bindings.get(SES).bDeleted = true; }],
            ['the session has no box', { EDGE_ENABLED: '1' }, (w: ReturnType<typeof world>) => { w.bindings.get(SES).nEdgeid = null; }],
            ['the session is unknown', { EDGE_ENABLED: '1' }, (w: ReturnType<typeof world>) => { w.bindings.clear(); }],
        ])('none when %s (the devices still get theirs)', async (_label, env, arrange) => {
            const w = world(env);
            arrange(w);
            w.service.changed({ nSesid: SES, kind: 'Q', by: ME, users: [ME] });
            await settle();
            expect(w.link.notify).not.toHaveBeenCalled();
            expect(w.emitted).toHaveLength(1);
        });

        it('a failed binding read, a refused notify or an old link without notify never throw', async () => {
            const w = world({ EDGE_ENABLED: '1' });
            w.edgeSync.binding.mockRejectedValueOnce(new Error('db down'));
            w.service.changed({ nSesid: SES, kind: 'F', by: ME, users: [ME] });
            await settle();
            expect(w.link.notify).not.toHaveBeenCalled();

            w.link.notify.mockReturnValueOnce(false);
            w.service.changed({ nSesid: SES, kind: 'F', by: ME, users: [ME] });
            await settle();
            expect(w.link.notify).toHaveBeenCalledTimes(1);

            delete (w.link as any).notify;
            w.service.changed({ nSesid: SES, kind: 'F', by: ME, users: [ME] });
            await settle();
            expect(w.emitted).toHaveLength(3);
        });

        it('splits more than 200 users over several c.marks (C_MARKS_MAX_USERS), nobody left out', async () => {
            const w = world({ EDGE_ENABLED: '1' });
            const users = Array.from({ length: 450 }, (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`);
            w.service.changed({ nSesid: SES, kind: 'F', by: ME, users });
            await settle();
            const sent = w.link.notify.mock.calls.map(c => (c[2] as any).users);
            expect(sent.map(u => u.length)).toEqual([200, 200, 50]);
            expect(sent.flat()).toEqual(users);
        });

        it('makes no binding read at all without EDGE_ENABLED', async () => {
            const w = world();
            w.service.changed({ nSesid: SES, kind: 'F', by: ME, users: [ME, THIRD] });
            await settle();
            expect(w.edgeSync.binding).not.toHaveBeenCalled();
        });

        it('works without the edge module (no EdgeSyncService / EdgeRegistryService)', async () => {
            const config = { get: (k: string) => ({ EDGE_ENABLED: '1' } as Record<string, string>)[k] };
            const service = new MarkEventsService(config as any);
            const emitted: string[] = [];
            service.server = { to: (room: string) => ({ emit: () => emitted.push(room) }) };
            service.changed({ nSesid: SES, kind: 'F', by: ME, users: [ME] });
            await settle();
            expect(emitted).toEqual([`U${ME}`]);
        });
    });

    it('drops pending notices on shutdown', async () => {
        const w = world({ EDGE_ENABLED: '1' });
        w.service.changed({ nSesid: SES, kind: 'F', by: ME, users: [ME] });
        w.service.onModuleDestroy();
        await settle(1_000);
        expect(w.emitted).toEqual([]);
        expect(w.link.notify).not.toHaveBeenCalled();
    });
});
