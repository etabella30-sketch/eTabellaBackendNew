import { EdgeBoxTokenSigner } from '@app/edge-token';
import type { Cut } from '@app/edge-sync';
import { io, Socket as ClientSocket } from 'socket.io-client';

import { endOfBoxDayMs } from '../auth/box-time';
import { FakeState } from '../auth/testing/fake-state';
import { ADMIN, ASSIGNEE, BOX, CASE_A, CASE_B, cloudKeys, CloudKeys, edgeWorld, H, MEMBER, NOW, NOW_SEC, onlineToken, OUTSIDER, PERSON, S_B, S_LIVE, S_NEXT, SpecClock } from '../auth/testing/edge-world';
import { ACCESS_PORT, AccessPort, KernelSessionView, LanViewers, NO_REQUEST_CONTEXT } from '../ports';
import { LAN_MARKS_WINDOW_MS, LanGateway, lapsed, refusalError, roomNameOf } from './lan.gateway';
import { RtReadCache } from './rt-data/read-cache';
import { RtDataService } from './rt-data/rt-data.service';
import { LanApp, startLanApp } from './testing/lan-test-kit';

const NLINES = 25;
const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));
const ASSIGNMENTS_CHANGED = { atMs: NOW, full: true, sessionsAdded: [], sessionsUpdated: [], sessionsEndRequested: [], sessionsUnlisted: [], sessionsPurged: [], casesAdded: [], casesRemoved: [], rosterChanged: true, operatorCodeChanged: false };

async function until(condition: () => boolean, timeoutMs = 5000): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (!condition()) {
        if (Date.now() > deadline) throw new Error('condition not met in time');
        await sleep(5);
    }
}

function pagesOf(totalLines: number, tag = 'v1'): unknown[][][] {
    const pages: unknown[][][] = [];
    for (let i = 0; i < totalLines; i++) {
        const p = Math.floor(i / NLINES);
        (pages[p] ??= []).push([`10:00:${String(i % 60).padStart(2, '0')}:00`, [72, 105], i, tag]);
    }
    return pages;
}

/** A committed cut as the kernel publishes it (only what the plan and the snapshot read is meaningful). */
function cutOf(nSesid: string, rev: number, prevTotal: number, totalLines: number, changed: number[], tag = 'v1'): Cut {
    const all = pagesOf(totalLines, tag);
    const changedPages = [...new Set(changed.map(i => Math.floor(i / NLINES) + 1))].filter(p => p <= all.length);
    return {
        nSesid,
        fmt: 1,
        nLines: NLINES,
        rev,
        prevTotal,
        totalLines,
        from: changed[0] ?? totalLines,
        rawSeqThrough: rev,
        rawHashThrough: 'h'.repeat(64),
        ...(totalLines < prevTotal ? { shrink: { lines: prevTotal - totalLines } } : {}),
        pages: changedPages.map(p => ({ p, d: 'd'.repeat(64), lines: all[p - 1] })),
        changed,
        changedPages,
        droppedPages: [],
        root: 'r'.repeat(64),
        digests: [],
        allPages: all,
    } as unknown as Cut;
}

describe('rt-edge LAN socket gateway (CONTRACTS.md §9)', () => {
    let cloud: CloudKeys;
    let state: FakeState;
    let clock: SpecClock;
    let lan: LanApp;
    let gateway: LanGateway;
    let clients: ClientSocket[];
    let viewers: LanViewers[];

    beforeAll(async () => {
        cloud = await cloudKeys();
    });

    beforeEach(async () => {
        state = edgeWorld(cloud.keys);
        clock = new SpecClock();
        lan = await startLanApp({ state, clock: clock.now });
        gateway = lan.app.get(LanGateway);
        await lan.lan.start();
        clients = [];
        viewers = [];
        lan.bus.subscribe('lan-viewers', v => viewers.push(v));
    });

    afterEach(async () => {
        for (const c of clients) c.disconnect();
        await lan.close();
    });

    function client(token: unknown): ClientSocket {
        const socket = io(lan.url, { path: '/socket.io', transports: ['websocket'], auth: { token }, reconnection: false, forceNew: true, query: { nUserid: 'spoofed' } });
        clients.push(socket);
        return socket;
    }

    function connect(token: unknown): Promise<ClientSocket> {
        const socket = client(token);
        return new Promise((resolve, reject) => {
            socket.once('connect', () => resolve(socket));
            socket.once('connect_error', reject);
        });
    }

    function refusal(token: unknown): Promise<Error & { data?: { error: string; status: number } }> {
        const socket = client(token);
        return new Promise((resolve, reject) => {
            socket.once('connect', () => reject(new Error('expected the handshake to be refused')));
            socket.once('connect_error', err => resolve(err as Error & { data?: { error: string; status: number } }));
        });
    }

    function next<T = unknown>(socket: ClientSocket, event: string, timeoutMs = 3000): Promise<T> {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error(`no '${event}' within ${timeoutMs} ms`)), timeoutMs);
            socket.once(event, (payload: T) => {
                clearTimeout(timer);
                resolve(payload);
            });
        });
    }

    function record<T = unknown>(socket: ClientSocket, event: string): T[] {
        const seen: T[] = [];
        socket.on(event, (payload: T) => seen.push(payload));
        return seen;
    }

    async function join(socket: ClientSocket, nSesid: string): Promise<unknown> {
        const status = next(socket, 'edge-status');
        socket.emit('join-room', { room: `S${nSesid}`, nSesid, nUserid: 'spoofed', isCreator: false });
        return status;
    }

    const disconnected = (socket: ClientSocket): Promise<string> => new Promise(resolve => socket.once('disconnect', reason => resolve(reason)));
    const tokenFor = (sub: string, over: Record<string, unknown> = {}) => onlineToken(cloud, { sub, ...over });
    const signer = () => EdgeBoxTokenSigner.create(BOX, state.identity.secret('box-token-signing'));

    async function roomCodeToken(nUserid = PERSON, nSesid = S_LIVE): Promise<string> {
        const accessPort = lan.app.get<AccessPort>(ACCESS_PORT);
        const admin = await lan.auth.authenticate(await tokenFor(ADMIN), NO_REQUEST_CONTEXT);
        const result = accessPort.issueRoomCodes(admin, { nSesid, userIds: [nUserid] }, NO_REQUEST_CONTEXT).results[0];
        if (result.status !== 'issued') throw new Error(result.error);
        return (await accessPort.redeemRoomCode({ code: result.issued.code }, { ip: '10.0.0.9', userAgent: null, deviceCookie: null })).reply.token;
    }

    // ---- handshake ---------------------------------------------------------------------------------------------------

    describe('handshake (auth: {token})', () => {
        it("refuses a missing, unreadable, expired or revoked token with 'unauthorized' (the FE stops retrying)", async () => {
            const expired = await tokenFor(MEMBER, { iat: NOW_SEC - 13 * 3600, exp: NOW_SEC - 3600, auth_time: NOW_SEC - 14 * 3600 });
            const revoked = await tokenFor(MEMBER, { jti: 'j-revoked' });
            state.revocations.denyJti('j-revoked', NOW + H, 'sign-out', NOW);
            const cases: Array<[unknown, string]> = [[undefined, 'unauthenticated'], [42, 'unauthenticated'], ['garbage', 'unauthenticated'], [expired, 'token_expired'], [revoked, 'token_revoked']];
            for (const [token, code] of cases) {
                const err = await refusal(token);
                expect([err.message, err.data]).toEqual(['unauthorized', { error: code, status: 401 }]);
            }
        });

        it('names a 503 condition instead (never a sign-out): no identity, no cloud keys', async () => {
            const token = await tokenFor(MEMBER);
            state.jwksRow = null;
            expect((await refusal(token)).message).toBe('box_not_linked');
            state.identityRow = null;
            const err = await refusal(token);
            expect([err.message, err.data]).toEqual(['box_not_configured', { error: 'box_not_configured', status: 503 }]);
        });

        it('connects online, room-code and operator sign-ins; query.nUserid is ignored', async () => {
            await connect(await tokenFor(MEMBER));
            await connect(await roomCodeToken());
            const op = await signer().mintOperatorToken({ day: '2026-10-01', mintedBy: ADMIN, nowMs: NOW - 60_000, validUntilMs: endOfBoxDayMs('2026-10-01', 'Europe/London') });
            await connect(op.token);
            expect(lan.lan.viewerCount()).toBe(3);
        });
    });

    // ---- rooms ---------------------------------------------------------------------------------------------------------

    describe('join-room / leave-room (scope, DR10, DR19)', () => {
        it('joins a session the person may open and sends edge-status at once (operator field for box admins only)', async () => {
            const admin = await connect(await tokenFor(ADMIN));
            const member = await connect(await tokenFor(MEMBER));
            const forAdmin = (await join(admin, S_LIVE)) as { nSesid: string; seq: number; operator?: unknown };
            const forMember = (await join(member, S_LIVE)) as { nSesid: string; seq: number; operator?: unknown };
            expect(forAdmin).toMatchObject({ nSesid: S_LIVE, room: { chip: 'live' } });
            expect(forAdmin.operator).toBeDefined();
            expect(forMember.operator).toBeUndefined();
            expect(forMember.seq).toBeGreaterThan(forAdmin.seq);
            expect(lan.lan.viewerCount(S_LIVE)).toBe(2);
            expect(viewers).toEqual([
                { nSesid: S_LIVE, count: 1 },
                { nSesid: S_LIVE, count: 2 },
            ]);
        });

        it('ignores joins outside the scope: another case, an assignee on another session, a mismatched nSesid, a room-code token elsewhere', async () => {
            const admin = await connect(await tokenFor(ADMIN, { cases: [CASE_B] })); // case A is not in this token
            const assignee = await connect(await tokenFor(ASSIGNEE, { cases: [CASE_A] }));
            const room = await connect(await roomCodeToken());
            const statuses = [record(admin, 'edge-status'), record(assignee, 'edge-status'), record(room, 'edge-status')];
            admin.emit('join-room', { room: `S${S_LIVE}`, nSesid: S_LIVE });
            assignee.emit('join-room', { room: `S${S_NEXT}`, nSesid: S_NEXT });
            assignee.emit('join-room', { room: `S${S_LIVE}`, nSesid: S_NEXT });
            room.emit('join-room', { room: `S${S_NEXT}`, nSesid: S_NEXT });
            room.emit('join-room', 'S' + S_B);
            room.emit('join-room', { room: 'X1' });
            room.emit('join-room', null);
            await sleep(150);
            expect(statuses.map(s => s.length)).toEqual([0, 0, 0]);
            expect(lan.lan.viewerCount(S_LIVE) + lan.lan.viewerCount(S_NEXT) + lan.lan.viewerCount(S_B)).toBe(0);
            await join(assignee, S_LIVE);
            await join(room, S_LIVE);
            expect(lan.lan.viewerCount(S_LIVE)).toBe(2);
        });

        it('uses the stored session id for the room, whatever the case the client wrote', async () => {
            const member = await connect(await tokenFor(MEMBER));
            await join(member, S_LIVE.toUpperCase());
            expect(lan.lan.viewerCount(S_LIVE)).toBe(1);
        });

        it('leave-room and disconnect publish the new viewer counts', async () => {
            const a = await connect(await tokenFor(MEMBER));
            const b = await connect(await tokenFor(ADMIN));
            await join(a, S_LIVE);
            await join(b, S_LIVE);
            a.emit('leave-room', { room: `S${S_LIVE}`, nSesid: S_LIVE, nUserid: MEMBER });
            await until(() => lan.lan.viewerCount(S_LIVE) === 1);
            b.disconnect();
            await until(() => viewers.length === 4);
            expect(lan.lan.viewerCount(S_LIVE)).toBe(0);
            expect(viewers.map(v => v.count)).toEqual([1, 2, 1, 0]);
        });
    });

    // ---- fetch-data snapshot -------------------------------------------------------------------------------------------

    describe('fetch-data (D11, D12, D20)', () => {
        it('streams the committed pages newest first, rev-tagged with a:[] h:[] and the tab, then previous-data-end', async () => {
            lan.kernel.cuts.set(S_LIVE, cutOf(S_LIVE, 7, 0, 60, [], 'v7'));
            const member = await connect(await tokenFor(MEMBER));
            const pages = record<{ page: number; data: string; totalPages: number; rev: number; a: unknown[]; h: unknown[]; tab: unknown; nSesid: string; msg: number }>(member, 'previous-data');
            const end = next(member, 'previous-data-end');
            member.emit('fetch-data', { nSesid: S_LIVE, nUserid: 'spoofed', tab: 'tab-3' });
            expect(await end).toEqual({ nSesid: S_LIVE, tab: 'tab-3' });
            expect(pages.map(p => p.page)).toEqual([3, 2, 1]);
            expect(pages[0]).toMatchObject({ msg: 1, totalPages: 3, nSesid: S_LIVE, a: [], h: [], tab: 'tab-3', rev: 7 });
            expect(JSON.parse(pages[2].data)).toHaveLength(25);
            expect(JSON.parse(pages[0].data)).toHaveLength(10);
        });

        it('a session with no line yet gets only previous-data-end; a refused session gets nothing', async () => {
            const room = await connect(await roomCodeToken());
            const pages = record(room, 'previous-data');
            const ends = record(room, 'previous-data-end');
            room.emit('fetch-data', { nSesid: S_NEXT, tab: 1 });
            room.emit('fetch-data', { nSesid: S_LIVE, tab: 2 });
            room.emit('fetch-data', {});
            await until(() => ends.length >= 1);
            await sleep(100);
            expect(pages).toEqual([]);
            expect(ends).toEqual([{ nSesid: S_LIVE, tab: 2 }]);
        });
    });

    // ---- readers served while the kernel replays a journal (box boot, RECOVER) ------------------------------------------

    describe('a reader who connects while the journal replays (box restart)', () => {
        const recovering = (nSesid: string): void => {
            lan.kernel.views.set(nSesid, { nSesid, localState: 'recovering', phase: 'live' } as Partial<KernelSessionView>);
            lan.kernel.recovering.add(nSesid);
        };
        const replayed = (nSesid: string, cut: Cut | null): void => {
            if (cut) lan.kernel.cuts.set(nSesid, cut);
            lan.kernel.recovering.delete(nSesid);
            lan.kernel.views.set(nSesid, { nSesid, localState: 'live', phase: 'live' } as Partial<KernelSessionView>);
        };
        const fetched = (socket: ClientSocket, nSesid: string, tab: string): Promise<unknown> => {
            const end = next(socket, 'previous-data-end');
            socket.emit('fetch-data', { nSesid, tab });
            return end;
        };

        it('gets previous-data-end at once (nothing to wait for), one feed-resync to the room when the replay commits, and the whole transcript on the refetch', async () => {
            recovering(S_LIVE);
            const member = await connect(await tokenFor(MEMBER));
            const outside = await connect(await tokenFor(ADMIN)); // may open it, not in the room
            await join(member, S_LIVE);
            const pages = record<{ page: number; rev: number }>(member, 'previous-data');
            const events = record<{ type: string; nSesid: string; rev: number }>(member, 'realtime-events');
            const leaked = record(outside, 'realtime-events');
            expect(await fetched(member, S_LIVE, 'boot-1')).toEqual({ nSesid: S_LIVE, tab: 'boot-1' });
            expect(pages).toEqual([]);
            // Still replaying: a status change says nothing about the pages yet.
            lan.bus.publish('session-status', { nSesid: S_LIVE, cause: 'line', atMs: NOW });
            await sleep(60);
            expect(events).toEqual([]);

            replayed(S_LIVE, cutOf(S_LIVE, 7, 0, 60, [], 'v7'));
            lan.bus.publish('session-status', { nSesid: S_LIVE, cause: 'phase', atMs: NOW });
            await until(() => events.length >= 1);
            expect(events).toEqual([{ type: 'feed-resync', nSesid: S_LIVE, rev: 7 }]);
            lan.bus.publish('session-status', { nSesid: S_LIVE, cause: 'line', atMs: NOW }); // owed once, not on every status
            gateway.heartbeatTick();
            await sleep(60);
            expect(events).toHaveLength(1);
            expect(leaked).toEqual([]);

            expect(await fetched(member, S_LIVE, 'boot-2')).toEqual({ nSesid: S_LIVE, tab: 'boot-2' });
            expect(pages.map(p => p.page)).toEqual([3, 2, 1]);
            expect(pages.every(p => p.rev === 7)).toBe(true);
        });

        it('an armed session with no line yet, and a session the box does not hold, answer at once and are never resynced', async () => {
            lan.kernel.views.set(S_NEXT, { nSesid: S_NEXT, localState: 'armed', phase: 'not-started' } as Partial<KernelSessionView>); // readable, empty
            const member = await connect(await tokenFor(MEMBER));
            await join(member, S_NEXT);
            await join(member, S_B); // held by nobody: the kernel has no session for it
            const pages = record(member, 'previous-data');
            const events = record(member, 'realtime-events');
            expect(await fetched(member, S_NEXT, 'a')).toEqual({ nSesid: S_NEXT, tab: 'a' });
            expect(await fetched(member, S_B, 'b')).toEqual({ nSesid: S_B, tab: 'b' });
            expect(pages).toEqual([]);
            lan.bus.publish('session-status', { nSesid: S_NEXT, cause: 'phase', atMs: NOW });
            lan.bus.publish('session-status', { nSesid: S_B, cause: 'phase', atMs: NOW });
            gateway.heartbeatTick();
            await sleep(80);
            expect(events).toEqual([]);
        });

        it('the 5 s tick covers a replay whose status never reached the gateway; a session that never becomes readable, or is dropped, holds nobody up', async () => {
            recovering(S_LIVE);
            recovering(S_NEXT);
            recovering(S_B);
            const member = await connect(await tokenFor(MEMBER));
            for (const nSesid of [S_LIVE, S_NEXT, S_B]) {
                await join(member, nSesid);
                await fetched(member, nSesid, 't');
            }
            const events = record<{ type: string; nSesid: string; rev: number }>(member, 'realtime-events');
            replayed(S_LIVE, cutOf(S_LIVE, 3, 0, 30, [], 'v3')); // committed, but its session-status was never published
            lan.kernel.views.delete(S_B); // sealed / purged meanwhile: the kernel dropped it
            gateway.heartbeatTick();
            await until(() => events.length >= 1);
            gateway.heartbeatTick();
            await sleep(60);
            expect(events).toEqual([{ type: 'feed-resync', nSesid: S_LIVE, rev: 3 }]); // S_NEXT still replays, S_B is gone
            // S_B comes back as a fresh (readable) session later: forgotten, so no stale resync.
            lan.kernel.views.set(S_B, { nSesid: S_B, localState: 'armed', phase: 'not-started' } as Partial<KernelSessionView>);
            lan.bus.publish('session-status', { nSesid: S_B, cause: 'phase', atMs: NOW });
            // S_NEXT's replay fails for good (corrupt journal): nothing is owed until RECOVER repairs it, nothing blocks.
            await sleep(60);
            expect(events).toHaveLength(1);
            replayed(S_NEXT, null); // repaired, no line
            lan.bus.publish('session-status', { nSesid: S_NEXT, cause: 'uplink', atMs: NOW });
            await until(() => events.length >= 2);
            expect(events[1]).toEqual({ type: 'feed-resync', nSesid: S_NEXT, rev: 0 });
        });

        it('start() resyncs the rooms joined before the gateway started (the listener binds first; cuts of that window are not broadcast)', async () => {
            const early = await startLanApp({ state, clock: clock.now });
            try {
                early.kernel.cuts.set(S_LIVE, cutOf(S_LIVE, 2, 0, 30, [], 'v2'));
                early.kernel.views.set(S_LIVE, { nSesid: S_LIVE, localState: 'live', phase: 'live' } as Partial<KernelSessionView>);
                early.kernel.views.set(S_NEXT, { nSesid: S_NEXT, localState: 'recovering', phase: 'live' } as Partial<KernelSessionView>);
                early.kernel.recovering.add(S_NEXT);
                const socket = io(early.url, { path: '/socket.io', transports: ['websocket'], auth: { token: await tokenFor(MEMBER) }, reconnection: false, forceNew: true });
                clients.push(socket);
                await new Promise<void>((resolve, reject) => {
                    socket.once('connect', () => resolve());
                    socket.once('connect_error', reject);
                });
                await join(socket, S_LIVE);
                await join(socket, S_NEXT);
                const pages = record<{ page: number; rev: number }>(socket, 'previous-data');
                const events = record<{ type: string; nSesid: string; rev: number }>(socket, 'realtime-events');
                await fetched(socket, S_LIVE, 'x');
                await fetched(socket, S_NEXT, 'x');
                expect(pages.map(p => [p.page, p.rev])).toEqual([[2, 2], [1, 2]]);
                // Before start(): a new cut is committed (not broadcast: nobody listens yet) and S_NEXT's replay commits.
                early.kernel.commit(cutOf(S_LIVE, 3, 30, 31, [30], 'v3'));
                early.kernel.cuts.set(S_NEXT, cutOf(S_NEXT, 5, 0, 10, [], 'v5'));
                early.kernel.recovering.delete(S_NEXT);
                await sleep(60);
                expect(events).toEqual([]);
                await early.lan.start();
                await until(() => events.length >= 2);
                await sleep(60);
                expect(events.map(e => [e.type, e.nSesid, e.rev]).sort()).toEqual([
                    ['feed-resync', S_LIVE, 3],
                    ['feed-resync', S_NEXT, 5],
                ]);
            } finally {
                await early.close();
            }
        });
    });

    // ---- cut broadcast -------------------------------------------------------------------------------------------------

    describe('cut broadcast (spec §5.8)', () => {
        it('a pure append goes out as one rev-tagged message to the room only', async () => {
            const inRoom = await connect(await tokenFor(MEMBER));
            const outside = await connect(await tokenFor(ADMIN));
            await join(inRoom, S_LIVE);
            const messages = record<{ i: number; d: unknown[]; date: string; l: number; p: number; rev: number }>(inRoom, 'message');
            const leaked = record(outside, 'message');
            lan.kernel.commit(cutOf(S_LIVE, 2, 25, 27, [25, 26]));
            await until(() => messages.length >= 1);
            await sleep(50);
            expect(messages).toHaveLength(1);
            expect(messages[0]).toMatchObject({ i: 27, date: S_LIVE, l: 25, p: 2, rev: 2 });
            expect(messages[0].d).toHaveLength(2);
            expect(leaked).toEqual([]);
        });

        it('a rewrite goes out as paced, rev-tagged previous-data pages newest first; a shrink adds feed-shrink', async () => {
            const member = await connect(await tokenFor(MEMBER));
            await join(member, S_LIVE);
            const pages: Array<{ page: number; rev: number; totalLines: number; at: number }> = [];
            member.on('previous-data', (p: { page: number; rev: number; totalLines: number }) => pages.push({ ...p, at: Date.now() }));
            const events = record<{ type: string; totalLines?: number; rev: number }>(member, 'realtime-events');
            const changed = Array.from({ length: 25 * 25 }, (_, i) => i); // rewrite of 25 pages
            lan.kernel.commit(cutOf(S_LIVE, 4, 700, 625, changed));
            await until(() => pages.length === 25);
            expect(events).toEqual([{ type: 'feed-shrink', nSesid: S_LIVE, totalLines: 625, rev: 4 }]);
            expect(pages.map(p => p.page)).toEqual([25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
            expect(pages.every(p => p.rev === 4 && p.totalLines === 625)).toBe(true);
            // ≤ 20 pages per 100 ms: the 21st page comes one pacing tick after the first batch.
            expect(pages[20].at - pages[19].at).toBeGreaterThanOrEqual(60);
            expect(pages[19].at - pages[0].at).toBeLessThan(60);
        });

        it('more than 400 changed pages is one feed-resync; a cut nobody watches is not planned', async () => {
            const member = await connect(await tokenFor(MEMBER));
            await join(member, S_LIVE);
            const events = record<{ type: string }>(member, 'realtime-events');
            const big = { ...cutOf(S_LIVE, 9, 0, 1, []), pages: Array.from({ length: 401 }, (_, k) => ({ p: k + 1, d: 'd', lines: [] })) } as unknown as Cut;
            lan.kernel.commit(big);
            await until(() => events.length >= 1);
            expect(events).toEqual([{ type: 'feed-resync', nSesid: S_LIVE, rev: 9 }]);
            const nobody = { ...cutOf(S_NEXT, 1, 0, 1, [0]), changed: null } as unknown as Cut; // would throw if it were planned
            expect(() => gateway.broadcastCut(nobody)).not.toThrow();
        });
    });

    // ---- status and session events ---------------------------------------------------------------------------------------

    describe('edge-status and edge-session (DR6, DR8, DR9)', () => {
        it('session-status re-emits to the room with one new seq; transmitter / cloud changes reach box-admin sockets only', async () => {
            const admin = await connect(await tokenFor(ADMIN));
            const member = await connect(await tokenFor(MEMBER));
            await join(admin, S_LIVE);
            await join(member, S_LIVE);
            const a = record<{ seq: number; operator?: unknown }>(admin, 'edge-status');
            const m = record<{ seq: number; operator?: unknown }>(member, 'edge-status');
            lan.bus.publish('session-status', { nSesid: S_LIVE, cause: 'line', atMs: NOW });
            lan.bus.publish('session-status', { nSesid: S_LIVE, cause: 'link', atMs: NOW }); // same turn: coalesced
            await until(() => a.length >= 1 && m.length >= 1);
            await sleep(50);
            expect(a).toHaveLength(1);
            expect(m).toHaveLength(1);
            expect(a[0].seq).toBe(m[0].seq);
            expect(a[0].operator).toBeDefined();
            expect(m[0].operator).toBeUndefined();
            lan.bus.publish('transmitter-changed', { stateVersion: 4, link: lan.kernel.transmitter.link, atMs: NOW });
            await until(() => a.length >= 2);
            await sleep(50);
            expect([a.length, m.length]).toEqual([2, 1]);
            lan.bus.publish('cloud-link-changed', { state: 'behind', sinceMs: NOW, lagSec: 18, lagLines: 4, pendingPages: 1, lastSyncedAtMs: NOW });
            lan.bus.publish('internet-changed', { state: 'down', sinceMs: NOW });
            await until(() => a.length >= 3 && m.length >= 2);
            await sleep(50);
            expect([a.length, m.length]).toEqual([3, 2]);
            expect(a[2].seq).toBeGreaterThan(a[1].seq);
        });

        it('first-line / ended / split become edge-session events with a seq; ended and armed send the legacy on-notification to who may open it', async () => {
            const member = await connect(await tokenFor(MEMBER));
            const elsewhere = await connect(await tokenFor(MEMBER)); // may open, not joined
            const room = await connect(await roomCodeToken(PERSON, S_NEXT));
            await join(member, S_LIVE);
            const sessionEvents = record<{ type: string; seq: number }>(member, 'edge-session');
            const notes = [record(member, 'on-notification'), record(elsewhere, 'on-notification'), record(room, 'on-notification')];
            lan.bus.publish('session-event', { type: 'first-line', nSesid: S_LIVE, atMs: NOW });
            lan.bus.publish('session-event', { type: 'split', nSesid: S_LIVE, continuedAs: { nSesid: 'p2', nPartNo: 2, cloudUrl: 'https://cloud.invalid/rt/session/p2', splitAtMs: NOW } });
            lan.bus.publish('session-event', { type: 'ended', nSesid: S_LIVE, endedAtMs: NOW + 1 });
            lan.bus.publish('session-armed', { nSesid: S_LIVE, atMs: NOW });
            await until(() => sessionEvents.length >= 3 && notes[0].length >= 2 && notes[1].length >= 2);
            await sleep(50);
            expect(sessionEvents.map(e => e.type)).toEqual(['first-line', 'split', 'ended']);
            expect(sessionEvents[0]).toMatchObject({ nSesid: S_LIVE, atMs: NOW });
            expect(sessionEvents[2]).toMatchObject({ nSesid: S_LIVE, endedAtMs: NOW + 1 });
            expect(sessionEvents[1].seq).toBeGreaterThan(sessionEvents[0].seq);
            expect(notes[0]).toEqual([
                { msg: 1, nSesid: S_LIVE, nCaseid: CASE_A, cStatus: 'E' },
                { msg: 1, nSesid: S_LIVE, nCaseid: CASE_A, cStatus: 'R' },
            ]);
            expect(notes[1]).toHaveLength(2);
            expect(notes[2]).toEqual([]); // a room-code sign-in for another session
        });

        it('the 5 s heartbeat re-sends edge-status when ops has not (stale detection, DR6)', async () => {
            const member = await connect(await tokenFor(MEMBER));
            await join(member, S_LIVE);
            const seen = record(member, 'edge-status');
            gateway.heartbeatTick();
            await until(() => seen.length >= 1); // nothing had gone to the room yet
            gateway.heartbeatTick();
            await sleep(80);
            expect(seen).toHaveLength(1); // just sent
            clock.advance(5000);
            gateway.heartbeatTick();
            await until(() => seen.length >= 2);
            expect(seen).toHaveLength(2);
        });

        it('without a LAN seq (ops failed) no status goes out and nothing breaks', async () => {
            const member = await connect(await tokenFor(MEMBER));
            lan.ops.failSeq = true;
            const seen = record(member, 'edge-status');
            member.emit('join-room', { room: `S${S_LIVE}`, nSesid: S_LIVE });
            await sleep(100);
            lan.bus.publish('session-status', { nSesid: S_LIVE, cause: 'line', atMs: NOW });
            await sleep(100);
            expect(seen).toEqual([]);
            expect(lan.lan.viewerCount(S_LIVE)).toBe(1);
        });
    });

    // ---- revocation, re-checks, lapses ----------------------------------------------------------------------------------

    describe('revocation and lapses (§6.6, DR10, §8.4)', () => {
        it('sign-out over HTTP closes that sign-in\'s sockets only (another etabella.net sign-in of the same person stays)', async () => {
            const token = await tokenFor(MEMBER, { jti: 'j-out' });
            const mine = await connect(token);
            const other = await connect(await tokenFor(MEMBER, { jti: 'j-stay', auth_time: NOW_SEC - 1800 }));
            const gone = disconnected(mine);
            const res = await fetch(`${lan.url}/edge/auth/sign-out`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
            expect(res.status).toBe(200);
            expect(await gone).toBe('io server disconnect');
            await sleep(50);
            expect(other.connected).toBe(true);
            expect((await refusal(token)).data).toEqual({ error: 'token_revoked', status: 401 });
        });

        it('closeSignIn: the same token, or an earlier token of the same online sign-in (same user and auth_time); never another person', async () => {
            const earlier = await connect(await tokenFor(MEMBER, { jti: 'm-1', iat: NOW_SEC - 7200, exp: NOW_SEC + 3600, auth_time: NOW_SEC - 7200 }));
            const otherPerson = await connect(await tokenFor(ADMIN, { jti: 'a-1', iat: NOW_SEC - 7200, exp: NOW_SEC + 3600, auth_time: NOW_SEC - 7200 }));
            const roomToken = await roomCodeToken();
            const room = await connect(roomToken);
            const renewed = await lan.auth.authenticate(await tokenFor(MEMBER, { jti: 'm-2', iat: NOW_SEC - 60, exp: NOW_SEC + 3600, auth_time: NOW_SEC - 7200 }), NO_REQUEST_CONTEXT);
            const gone = disconnected(earlier);
            expect(gateway.closeSignIn(renewed)).toBe(1);
            expect(await gone).toBe('io server disconnect');
            await sleep(50);
            expect([otherPerson.connected, room.connected]).toEqual([true, true]);
            const roomGone = disconnected(room);
            expect(gateway.closeSignIn(await lan.auth.authenticate(roomToken, NO_REQUEST_CONTEXT))).toBe(1);
            expect(await roomGone).toBe('io server disconnect');
            await sleep(50);
            expect(otherPerson.connected).toBe(true);
            expect(gateway.closeSignIn(null as never)).toBe(0);
        });

        it("ending a room access closes that device's socket at once", async () => {
            const accessPort = lan.app.get<AccessPort>(ACCESS_PORT);
            const admin = await lan.auth.authenticate(await tokenFor(ADMIN), NO_REQUEST_CONTEXT);
            const issued = accessPort.issueRoomCodes(admin, { nSesid: S_LIVE, userIds: [PERSON] }, NO_REQUEST_CONTEXT).results[0] as { issued: { id: string; code: string } };
            const { reply } = await accessPort.redeemRoomCode({ code: issued.issued.code }, { ip: '10.0.0.9', userAgent: null, deviceCookie: null });
            const socket = await connect(reply.token);
            await join(socket, S_LIVE);
            const gone = disconnected(socket);
            accessPort.endRoomAccess(admin, issued.issued.id, NO_REQUEST_CONTEXT);
            expect(await gone).toBe('io server disconnect');
        });

        it('a cloud user revocation closes the sockets its cut-off covers', async () => {
            const old = await connect(await tokenFor(MEMBER, { iat: NOW_SEC - 600 }));
            const admin = await connect(await tokenFor(ADMIN));
            state.revocations.revokeUser(MEMBER, NOW);
            const gone = disconnected(old);
            lan.bus.publish('access-revoked', { jtis: [], userIds: [MEMBER], reason: 'cloud-revocation', atMs: NOW });
            expect(await gone).toBe('io server disconnect');
            await sleep(50);
            expect(admin.connected).toBe(true);
        });

        it('assignments-changed re-checks every socket: rooms it may no longer open are left; a revoked online token loses its transport (the handshake decides on retry)', async () => {
            const member = await connect(await tokenFor(MEMBER));
            const revoked = await connect(await tokenFor(ADMIN, { jti: 'j-later' }));
            await join(member, S_LIVE);
            await join(revoked, S_LIVE);
            state.rosterRows = state.rosterRows.filter(m => !(m.nUserid === MEMBER && m.nCaseid === CASE_A));
            state.revocations.denyJti('j-later', NOW + H, 'cloud', NOW);
            const gone = disconnected(revoked);
            lan.bus.publish('assignments-changed', ASSIGNMENTS_CHANGED);
            expect(await gone).toBe('transport close');
            await gateway.recheckSockets();
            expect(member.connected).toBe(true);
            expect(lan.lan.viewerCount(S_LIVE)).toBe(0);
        });

        it('assignments-changed re-derives an online socket past its exp (D28: no renewal could run) from the live roster: the admin flags and the rooms follow it', async () => {
            const admin = await connect(await tokenFor(ADMIN, { iat: NOW_SEC - 3600, exp: NOW_SEC + 600, auth_time: NOW_SEC - 7200 }));
            expect(((await join(admin, S_LIVE)) as { operator?: unknown }).operator).toBeDefined();
            clock.nowMs = NOW + 2 * H; // past exp + 5 min, inside auth_time + 24 h: the open socket stays
            gateway.heartbeatTick();
            await sleep(50);
            expect(admin.connected).toBe(true);

            // Still case admin: nothing changes.
            lan.bus.publish('assignments-changed', ASSIGNMENTS_CHANGED);
            await gateway.recheckSockets();
            expect(lan.lan.viewerCount(S_LIVE)).toBe(1);

            // No longer case admin on etabella.net: still on the team (keeps the room), no box-admin status any more.
            state.rosterRows = state.rosterRows.map(m => (m.nUserid === ADMIN && m.nCaseid === CASE_A ? { ...m, isCaseAdmin: false } : m));
            lan.bus.publish('assignments-changed', ASSIGNMENTS_CHANGED);
            await gateway.recheckSockets();
            expect(lan.lan.viewerCount(S_LIVE)).toBe(1);
            const status = next<{ operator?: unknown }>(admin, 'edge-status');
            gateway.emitStatusToRoom(S_LIVE);
            expect((await status).operator).toBeUndefined();

            // Taken off the case: the room is left, the socket stays (another case may still be open to it).
            state.rosterRows = state.rosterRows.filter(m => !(m.nUserid === ADMIN && m.nCaseid === CASE_A));
            lan.bus.publish('assignments-changed', ASSIGNMENTS_CHANGED);
            await gateway.recheckSockets();
            expect(lan.lan.viewerCount(S_LIVE)).toBe(0);
            expect(admin.connected).toBe(true);
        });

        it('a silent renewal the box has seen: the cloud listing the replaced token leaves the socket on, now holding the renewed token', async () => {
            const socket = await connect(await tokenFor(MEMBER, { jti: 'm-1', iat: NOW_SEC - 7200, exp: NOW_SEC + 3600, auth_time: NOW_SEC - 7200 }));
            await join(socket, S_LIVE);
            const reasons = record<string>(socket, 'disconnect');
            // The device renewed on etabella.net and used the new token on the box (any HTTP call).
            const renewed = await tokenFor(MEMBER, { jti: 'm-2', iat: NOW_SEC - 60, exp: NOW_SEC + 11 * 3600, auth_time: NOW_SEC - 7200 });
            expect((await fetch(`${lan.url}/edge/auth/me`, { headers: { Authorization: `Bearer ${renewed}` } })).status).toBe(200);
            // etabella.net revoked the replaced token (one active token per person and box); the uplink stored and published it.
            state.revocations.denyJti('m-1', NOW + 12 * H, 'cloud', NOW);
            lan.bus.publish('access-revoked', { jtis: ['m-1'], userIds: [], reason: 'cloud-revocation', atMs: NOW });
            await sleep(100);
            expect([socket.connected, lan.lan.viewerCount(S_LIVE), reasons]).toEqual([true, 1, []]);
            const messages = record(socket, 'message');
            lan.kernel.commit(cutOf(S_LIVE, 2, 25, 27, [25, 26]));
            await until(() => messages.length >= 1);
            // It now holds the renewed token: when THAT one is revoked, it goes too.
            state.revocations.denyJti('m-2', NOW + 12 * H, 'cloud', NOW);
            const gone = disconnected(socket);
            lan.bus.publish('access-revoked', { jtis: ['m-2'], userIds: [], reason: 'cloud-revocation', atMs: NOW });
            expect(await gone).toBe('transport close');
        });

        it('a cloud-listed token the box has not seen renewed closes only the transport: the device comes back with its renewed token; a revoked one is refused for good', async () => {
            let current = await tokenFor(MEMBER, { jti: 'r-1', iat: NOW_SEC - 7200, exp: NOW_SEC + 3600, auth_time: NOW_SEC - 7200 });
            // As the FE's RealtimeSocketService: the auth callback is read again on every (re)connect.
            const device = io(lan.url, { path: '/socket.io', transports: ['websocket'], auth: cb => cb({ token: current }), reconnection: true, reconnectionDelay: 20, reconnectionDelayMax: 50, forceNew: true });
            clients.push(device);
            await new Promise<void>(resolve => device.once('connect', () => resolve()));
            await join(device, S_LIVE);

            // Renewed on etabella.net while the box never saw the new token; then the cloud lists the replaced one.
            current = await tokenFor(MEMBER, { jti: 'r-2', iat: NOW_SEC - 60, exp: NOW_SEC + 11 * 3600, auth_time: NOW_SEC - 7200 });
            state.revocations.denyJti('r-1', NOW + 12 * H, 'cloud', NOW);
            const gone = disconnected(device);
            const back = new Promise<void>(resolve => device.once('connect', () => resolve())); // the namespace, after the handshake
            lan.bus.publish('access-revoked', { jtis: ['r-1'], userIds: [], reason: 'cloud-revocation', atMs: NOW });
            expect(await gone).toBe('transport close'); // never 'io server disconnect', which socket.io-client does not retry
            await back;
            expect(device.connected).toBe(true);
            await join(device, S_LIVE); // the FE re-joins and refetches on connect
            expect(lan.lan.viewerCount(S_LIVE)).toBe(1);

            // A real revocation (signed out on etabella.net): the device holds only the revoked token; its retry is refused.
            state.revocations.denyJti('r-2', NOW + 12 * H, 'cloud', NOW);
            const refused = new Promise<Error & { data?: unknown }>(resolve => device.once('connect_error', resolve));
            lan.bus.publish('access-revoked', { jtis: ['r-2'], userIds: [], reason: 'cloud-revocation', atMs: NOW });
            const err = await refused;
            expect([err.message, err.data]).toEqual(['unauthorized', { error: 'token_revoked', status: 401 }]);
            await sleep(100);
            expect([device.connected, lan.lan.viewerCount(S_LIVE)]).toEqual([false, 0]);
        });

        it('box-side revocations stay final: a sign-out on the box ends the socket with no retry', async () => {
            const token = await tokenFor(MEMBER, { jti: 'b-1' });
            const socket = await connect(token);
            const gone = disconnected(socket);
            state.revocations.denyJti('b-1', NOW + H, 'sign-out', NOW);
            lan.bus.publish('access-revoked', { jtis: ['b-1'], userIds: [], reason: 'sign-out', atMs: NOW });
            expect(await gone).toBe('io server disconnect');
        });

        it('box sign-ins lapse on the open socket: the operator at the end of its day, a room code at its cap; online only past the D24 ceiling', async () => {
            const op = await signer().mintOperatorToken({ day: '2026-10-01', mintedBy: ADMIN, nowMs: NOW - 60_000, validUntilMs: endOfBoxDayMs('2026-10-01', 'Europe/London') });
            const operator = await connect(op.token);
            const online = await connect(await tokenFor(MEMBER, { iat: NOW_SEC - 600, exp: NOW_SEC + 600, auth_time: NOW_SEC - 3600 }));
            const gone = disconnected(operator);
            clock.nowMs = endOfBoxDayMs('2026-10-01', 'Europe/London') + 1;
            gateway.heartbeatTick();
            expect(await gone).toBe('io server disconnect');
            await sleep(50);
            expect(online.connected).toBe(true); // past exp but inside auth_time + 24 h: the FE renews

            const base = { kind: 'online', authTime: NOW - H, validUntil: NOW } as never;
            expect(lapsed(base, NOW - H + 24 * H + 300_000 - 1, '2026-10-01')).toBe(false);
            expect(lapsed(base, NOW - H + 24 * H + 300_000, '2026-10-01')).toBe(true);
            expect(lapsed({ kind: 'room-code', validUntil: NOW } as never, NOW, '2026-10-01')).toBe(true);
            expect(lapsed({ kind: 'room-code', validUntil: NOW } as never, NOW - 1, '2026-10-01')).toBe(false);
            expect(lapsed({ kind: 'operator', operatorDay: '2026-10-01', validUntil: NOW + H } as never, NOW, '2026-10-02')).toBe(true);
        });
    });

    // ---- live mark sync (user decision 2026-10-05) ----------------------------------------------------------------------

    describe('marks-changed (live mark sync, user decision 2026-10-05)', () => {
        type Notice = { nSesid: string | null; kinds?: string[]; by?: string; atMs: number; reason?: string };
        const cloudNotice = (nSesid: string, users: string[], kinds: Array<'Q' | 'F' | 'D'>, atMs = NOW): void =>
            lan.bus.publish('marks-changed', { reason: 'cloud', nSesid, users, kinds, atMs });
        const userRoom = (id: string): number => gateway.server.sockets.adapter.rooms.get(`U${id}`)?.size ?? 0;
        const rtData = (): RtDataService => lan.app.get(RtDataService);
        const seed = (user: string): string => {
            const key = RtReadCache.key(user, 'marknav.all', `nSesid=${S_LIVE}`);
            rtData().cache.set(key, user, Buffer.from('[[],[],[]]'));
            return key;
        };
        const operatorToken = async (): Promise<string> =>
            (await signer().mintOperatorToken({ day: '2026-10-01', mintedBy: ADMIN, nowMs: NOW - 60_000, validUntilMs: endOfBoxDayMs('2026-10-01', 'Europe/London') })).token;
        const link = (state: string): void => lan.bus.publish('cloud-link-changed', { state, sinceMs: NOW, lagSec: 0, lagLines: 0, pendingPages: 0, lastSyncedAtMs: NOW } as never);

        it('an online sign-in joins its own U room at connect; room-code and operator sign-ins never do', async () => {
            await connect(await tokenFor(MEMBER));
            const room = await connect(await roomCodeToken(PERSON, S_LIVE));
            await connect(await operatorToken());
            await until(() => userRoom(MEMBER) === 1);
            expect(userRoom(PERSON)).toBe(0);
            // Joining its own U room by hand is still allowed (as the cloud), but a room-code sign-in reads no marks,
            // so it is never told about them either.
            room.emit('join-room', { room: `U${PERSON}` });
            await until(() => userRoom(PERSON) === 1);
            const told = record(room, 'marks-changed');
            cloudNotice(S_LIVE, [PERSON], ['F']);
            await sleep(LAN_MARKS_WINDOW_MS + 150);
            expect(told).toEqual([]);
            const userRooms = [...gateway.server.sockets.adapter.rooms.keys()].filter(r => r.startsWith('U') && !gateway.server.sockets.sockets.has(r));
            expect(userRooms.sort()).toEqual([`U${MEMBER}`, `U${PERSON}`].sort());
        });

        it("a cloud notice reaches every device of the listed users who may open the session, one per session and user per 250 ms window (that user's kinds), after their cached reads went stale; nobody else", async () => {
            const phone = await connect(await tokenFor(MEMBER));
            const laptop = await connect(await tokenFor(MEMBER, { jti: 'm-laptop' }));
            const admin = await connect(await tokenFor(ADMIN));
            const outsider = await connect(await tokenFor(OUTSIDER)); // listed, but may open nothing on the box
            const assignee = await connect(await tokenFor(ASSIGNEE)); // listed, may open S_LIVE only
            await until(() => userRoom(MEMBER) === 2 && userRoom(OUTSIDER) === 1 && userRoom(ASSIGNEE) === 1);
            const memberKey = seed(MEMBER);
            const adminKey = seed(ADMIN);
            const freshWhenTold: Array<boolean | undefined> = [];
            phone.on('marks-changed', () => freshWhenTold.push(rtData().cache.get(memberKey)?.fresh));
            const seen = [record<Notice>(phone, 'marks-changed'), record<Notice>(laptop, 'marks-changed'), record<Notice>(admin, 'marks-changed'), record<Notice>(outsider, 'marks-changed'), record<Notice>(assignee, 'marks-changed')];

            const sentAt = Date.now();
            cloudNotice(S_LIVE, [MEMBER, OUTSIDER], ['Q'], NOW + 1);
            // The cache went stale inside the publish, before any device is told.
            expect([rtData().cache.get(memberKey)?.fresh, rtData().cache.get(adminKey)?.fresh]).toEqual([false, true]);
            cloudNotice(S_LIVE, [MEMBER.toUpperCase(), ASSIGNEE], ['F'], NOW + 3);
            cloudNotice(S_NEXT, [MEMBER, ASSIGNEE], ['D'], NOW + 2);
            await until(() => seen[0].length >= 2 && seen[1].length >= 2 && seen[4].length >= 1);
            expect(Date.now() - sentAt).toBeGreaterThanOrEqual(LAN_MARKS_WINDOW_MS - 20);
            await sleep(LAN_MARKS_WINDOW_MS + 100);
            const forMember = [
                { nSesid: S_LIVE, kinds: ['Q', 'F'], by: '', atMs: NOW + 3 },
                { nSesid: S_NEXT, kinds: ['D'], by: '', atMs: NOW + 2 },
            ];
            expect(seen.map(s => [...s].sort((a, b) => String(a.nSesid).localeCompare(String(b.nSesid))))).toEqual([
                forMember,
                forMember,
                [], // ADMIN was not listed
                [], // OUTSIDER may not open S_LIVE
                [{ nSesid: S_LIVE, kinds: ['F'], by: '', atMs: NOW + 3 }], // ASSIGNEE: S_LIVE only
            ]);
            expect(freshWhenTold).toEqual([false, false]);

            // No mark ever rides on the socket: the snapshot keeps carrying none.
            const pages = record<{ a: unknown[]; h: unknown[] }>(phone, 'previous-data');
            lan.kernel.cuts.set(S_LIVE, cutOf(S_LIVE, 3, 0, 10, [], 'v3'));
            const end = next(phone, 'previous-data-end');
            phone.emit('fetch-data', { nSesid: S_LIVE, tab: 't' });
            await end;
            expect(pages.map(p => [p.a, p.h])).toEqual([[[], []]]);
        });

        it('the cloud link coming back (down → synced / behind) sends one resync to every online sign-in and makes every cached read stale; behind ↔ synced does not', async () => {
            const member = await connect(await tokenFor(MEMBER));
            const admin = await connect(await tokenFor(ADMIN));
            const room = await connect(await roomCodeToken(PERSON, S_LIVE));
            const operator = await connect(await operatorToken());
            const onBus: unknown[] = [];
            lan.bus.subscribe('marks-changed', e => onBus.push(e));
            const seen = [record<Notice>(member, 'marks-changed'), record<Notice>(admin, 'marks-changed'), record<Notice>(room, 'marks-changed'), record<Notice>(operator, 'marks-changed')];
            const keys = [seed(MEMBER), seed(ADMIN)];

            link('cant-reach-etabella');
            await sleep(LAN_MARKS_WINDOW_MS + 100);
            expect([onBus, seen.map(s => s.length)]).toEqual([[], [0, 0, 0, 0]]);

            cloudNotice(S_LIVE, [MEMBER], ['Q']); // folded into the resync of the same window
            link('synced');
            expect(onBus).toEqual([
                { reason: 'cloud', nSesid: S_LIVE, users: [MEMBER], kinds: ['Q'], atMs: NOW },
                { reason: 'resync', nSesid: null, users: null, kinds: ['Q', 'F', 'D'], atMs: NOW },
            ]);
            expect(keys.map(k => rtData().cache.get(k)?.fresh)).toEqual([false, false]);
            await until(() => seen[0].length >= 1 && seen[1].length >= 1);
            await sleep(LAN_MARKS_WINDOW_MS + 100);
            const resync = { nSesid: null, reason: 'resync', atMs: NOW };
            expect(seen).toEqual([[resync], [resync], [], []]);

            link('behind');
            link('synced');
            await sleep(LAN_MARKS_WINDOW_MS + 100);
            expect(onBus).toHaveLength(2);
            link('internet-unavailable');
            link('behind');
            await until(() => seen[0].length >= 2);
            expect(onBus).toHaveLength(3);
            await sleep(LAN_MARKS_WINDOW_MS + 100);
            expect(seen.map(s => s.length)).toEqual([2, 2, 0, 0]);
        });

        it('the first link state the gateway sees counts as coming back when it is up (devices may have read marks while the box was starting)', async () => {
            const member = await connect(await tokenFor(MEMBER));
            const seen = record<Notice>(member, 'marks-changed');
            link('synced');
            await until(() => seen.length >= 1);
            expect(seen).toEqual([{ nSesid: null, reason: 'resync', atMs: NOW }]);
        });

        it('close() drops a pending window and stops listening; RtDataService keeps its own listener', async () => {
            const member = await connect(await tokenFor(MEMBER));
            await until(() => userRoom(MEMBER) === 1);
            expect(lan.bus.listenerCount('marks-changed')).toBe(2); // RtDataService + the gateway
            const seen = record(member, 'marks-changed');
            cloudNotice(S_LIVE, [MEMBER], ['Q']);
            await lan.lan.close();
            expect(lan.bus.listenerCount('marks-changed')).toBe(1);
            await sleep(LAN_MARKS_WINDOW_MS + 100);
            expect(seen).toEqual([]);
        });
    });

    describe('LanPort lifecycle', () => {
        it('close() drops every socket at the transport (so clients retry after a restart), stops listening to the bus, drops new handshakes and is idempotent', async () => {
            const member = await connect(await tokenFor(MEMBER));
            await join(member, S_LIVE);
            const gone = disconnected(member);
            await lan.lan.close();
            // Not 'io server disconnect': socket.io-client never retries that one, and a restart must be retried.
            expect(await gone).toBe('transport close');
            await lan.lan.close();
            expect(lan.bus.listenerCount('session-status')).toBe(0);
            expect(lan.kernel.listeners.size).toBe(0);
            // A handshake during the shutdown is neither accepted nor refused (a refusal is never retried either).
            const late = client(await tokenFor(MEMBER));
            let outcome = 'none';
            late.once('connect', () => (outcome = 'connected'));
            late.once('connect_error', () => (outcome = 'refused'));
            expect(await disconnected(late)).toBe('transport close');
            expect(outcome).toBe('none');
            await lan.lan.start(); // never restarts after close
            expect(lan.bus.listenerCount('session-status')).toBe(0);
        });

        it('start() is idempotent', async () => {
            await lan.lan.start();
            expect(lan.bus.listenerCount('session-status')).toBe(1);
            expect(lan.kernel.listeners.size).toBe(1);
        });
    });

    it('helpers: room names and refusal errors', () => {
        expect(roomNameOf({ room: `S${S_LIVE}` })).toBe(`S${S_LIVE}`);
        expect(roomNameOf('U1')).toBe('U1');
        expect(roomNameOf({ room: 5 })).toBeNull();
        expect(roomNameOf('x'.repeat(81))).toBeNull();
        expect(refusalError(new Error('boom')).message).toBe('server_error');
    });
});
