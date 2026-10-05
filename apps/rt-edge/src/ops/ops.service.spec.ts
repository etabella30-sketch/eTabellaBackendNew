import * as path from 'path';

import { Logger } from '@nestjs/common';

import { FEED_PARSE_VERSION } from '@app/feed-parse/version';

import { CloudLinkStatus, EdgeSessionStatus, NetworkCheck, NetworkCheckKey, TransmitterSettings, VERDICT_KINDS } from '../contracts';
import { BoxConfig, EDGE_SEQ_BOOT_MARGIN, EdgeAlert, EdgeBusEventName, EdgeDeviceHealth, EdgePortError, InMemoryEdgeEventBus, ServerTime } from '../ports';
import { DEFAULT_OPS_TUNING, OPS_DIAGNOSTICS_LOG_WINDOW_MS, OPS_LOG_KEEP_DAYS, OPS_PURGE_AFTER_SEAL_MS, OpsTuning } from './ops.constants';
import { dayMinus, OpsService, purgeEligible, shortRoot } from './ops.service';
import { actorOf } from './transmitter';
import {
    DIAL,
    FakeAuth,
    FakeBoot,
    FakeKernel,
    FakeOpsHost,
    FakeState,
    FakeUplink,
    failedDns,
    flush,
    goodCertificate,
    identity,
    kernelView,
    linkOf,
    LISTEN,
    ManualTimers,
    NOW,
    okDns,
    principalOf,
    sessionRecord,
    syncOf,
    testConfig,
    TODAY,
} from './testing/ops-fakes';
import { unzip } from './testing/unzip';

const EVENTS: EdgeBusEventName[] = ['session-status', 'device-health', 'alert', 'session-event'];

interface World {
    ops: OpsService;
    serverTime: ServerTime;
    state: FakeState;
    kernel: FakeKernel;
    uplink: FakeUplink;
    auth: FakeAuth;
    host: FakeOpsHost;
    boot: FakeBoot;
    timers: ManualTimers;
    bus: InMemoryEdgeEventBus;
    tuning: OpsTuning;
    config: BoxConfig;
    seen: Record<string, unknown[]>;
    alerts(): EdgeAlert[];
    advance(ms: number): void;
    now(): number;
}

function world(opts: { config?: BoxConfig; cloudClock?: boolean; etabellaClock?: boolean } = {}): World {
    let now = NOW;
    const config = opts.config ?? testConfig();
    const bus = new InMemoryEdgeEventBus();
    const state = new FakeState();
    state.sessionsData = [sessionRecord()];
    const kernel = new FakeKernel();
    const uplink = new FakeUplink();
    const auth = new FakeAuth();
    const host = new FakeOpsHost();
    const boot = new FakeBoot();
    const timers = new ManualTimers();
    const tuning: OpsTuning = { ...DEFAULT_OPS_TUNING, probeTimeoutMs: 20, syncTimeoutMs: 50 };
    const seen: Record<string, unknown[]> = {};
    for (const name of EVENTS) {
        seen[name] = [];
        bus.subscribe(name, payload => seen[name].push(payload));
    }
    // etabella.net time on the PC clock `now` (user decision 2026-10-05): every cloud clock reading the uplink reports
    // is a hello reading for it, as in the box. ops' own EDGE_CLOCK stays `now` unless `etabellaClock`, so the times
    // specs expect do not move; ops reads the PC clock through `serverTime.raw()` where it measures the PC clock.
    const serverTime = new ServerTime(() => now, () => now);
    uplink.serverTime = serverTime;
    const clock = opts.etabellaClock ? () => serverTime.now() : () => now;
    const ops = new OpsService(config, clock, bus, boot, state.asPort(), kernel.asPort(), uplink.asPort(opts.cloudClock), auth.asPort(), host, timers, tuning, serverTime);
    return {
        ops,
        serverTime,
        state,
        kernel,
        uplink,
        auth,
        host,
        boot,
        timers,
        bus,
        tuning,
        config,
        seen,
        alerts: () => seen['alert'] as EdgeAlert[],
        advance: ms => {
            now += ms;
        },
        now: () => now,
    };
}

const admin = principalOf('online');
const ctx = { ip: '10.40.1.77', userAgent: 'Safari', deviceCookie: null };

async function refusal(work: () => unknown): Promise<EdgePortError> {
    try {
        await work();
    } catch (err) {
        expect(err).toBeInstanceOf(EdgePortError);
        return err as EdgePortError;
    }
    throw new Error('expected a refusal');
}

beforeAll(() => Logger.overrideLogger(false));
afterAll(() => Logger.overrideLogger(['log', 'error', 'warn', 'debug', 'verbose']));

describe('OpsService — LAN seq (CONTRACTS.md §9.2)', () => {
    it('seeds from the persisted floor plus the boot margin, then grows strictly across all sessions', () => {
        const w = world();
        w.state.counterValue = NOW + 5;
        const first = w.ops.nextSeq('s1');
        expect(first).toBe(NOW + 5 + EDGE_SEQ_BOOT_MARGIN + 1);
        expect(w.ops.nextSeq('s2')).toBe(first + 1);
        expect(w.ops.nextSeq('s1')).toBe(first + 2);
        expect(w.ops.sessionStatus('s1', { includeOperator: false })?.seq).toBe(first + 2);
    });

    it('is never below the clock, and keeps working when the floor cannot be read', () => {
        const w = world();
        w.state.failCounters = true;
        expect(w.ops.nextSeq('s1')).toBe(NOW);
        w.advance(10_000);
        expect(w.ops.nextSeq('s1')).toBe(NOW + 10_000);
    });

    it('persists the floor on the heartbeat and on close, only when a new seq was issued', async () => {
        const w = world();
        await w.ops.start();
        expect(w.state.raised).toEqual([]);
        const seq = w.ops.nextSeq('s1');
        w.timers.fire(w.tuning.heartbeatMs);
        expect(w.state.raised).toEqual([seq]);
        w.timers.fire(w.tuning.heartbeatMs);
        expect(w.state.raised).toEqual([seq]);
        const later = w.ops.nextSeq('s1');
        await w.ops.close();
        expect(w.state.raised).toEqual([seq, later]);
        await w.ops.close();
        expect(w.state.raised).toEqual([seq, later]);
    });

    it('close persists even when start never ran, and survives a failing store', async () => {
        const w = world();
        const seq = w.ops.nextSeq('s9');
        await w.ops.close();
        expect(w.state.raised).toEqual([seq]);
        const broken = world();
        broken.ops.nextSeq('s1');
        broken.state.failCounters = true;
        await expect(broken.ops.close()).resolves.toBeUndefined();
    });
});

describe('OpsService — status and chips (DR6, DR8, DR9)', () => {
    it('builds one session status from the record, the kernel and the uplink; null for unknown or purged', () => {
        const w = world();
        w.kernel.views = [kernelView()];
        w.uplink.syncs = [syncOf({ lagLines: 3, lagSec: 2 })];
        const s = w.ops.sessionStatus('s1', { includeOperator: false }) as EdgeSessionStatus;
        expect(s).toMatchObject({
            nSesid: 's1',
            seq: 0,
            atMs: NOW,
            venue: 'catching-up',
            lagLines: 3,
            lagSec: 2,
            since: NOW - 600_000,
            lastSyncAt: NOW - 4_000,
            catConnected: true,
            room: { chip: 'live', feed: 'live', marking: 'available', startAtMs: Date.UTC(2026, 9, 1, 9, 0) },
            continuedAs: null,
            // The session's pinned zone: "No new lines since …" and its other times are shown in it (user decision 2026-10-05).
            tz: 'Europe/London',
        });
        expect(s.operator).toBeUndefined();
        w.state.sessionsData = [sessionRecord({ tz: '' })];
        expect(w.ops.sessionStatus('s1', { includeOperator: false })?.tz).toBeNull();
        w.state.sessionsData = [sessionRecord()];
        expect(w.ops.sessionStatus('nope', { includeOperator: true })).toBeNull();
        w.state.sessionsData = [sessionRecord({ localState: 'purged', purgedAtMs: NOW })];
        expect(w.ops.sessionStatus('s1', { includeOperator: true })).toBeNull();
    });

    it('tracks when the venue state changed (cloud-compatible `since`), and honours an explicit seq', () => {
        const w = world();
        expect(w.ops.sessionStatus('s1', { includeOperator: false })?.since).toBe(NOW - 600_000);
        w.advance(5_000);
        w.uplink.online = false;
        expect(w.ops.sessionStatus('s1', { includeOperator: false })).toMatchObject({ venue: 'offline', since: NOW + 5_000 });
        w.advance(5_000);
        expect(w.ops.sessionStatus('s1', { includeOperator: false, seq: 99 })).toMatchObject({ venue: 'offline', since: NOW + 5_000, seq: 99 });
    });

    it('adds the operator field for box admins only', () => {
        const w = world();
        expect(w.ops.sessionStatus('s1', { includeOperator: true })?.operator).toMatchObject({ checkedAtMs: NOW, stale: false });
    });

    it('snapshot: sessions the viewer may open (never deleted ones), operator only for box admins', () => {
        const w = world();
        w.state.sessionsData = [sessionRecord(), sessionRecord({ nSesid: 's2' }), sessionRecord({ nSesid: 's3', deleted: true })];
        w.auth.openable = new Set(['s1', 's3']);
        const snap = w.ops.statusSnapshot(admin);
        expect(snap).toMatchObject({ nowMs: NOW, heartbeatMs: 5_000, staleAfterMs: 15_000, internet: { state: 'up' } });
        expect(snap.sessions.map(s => s.nSesid)).toEqual(['s1']);
        expect(snap.operator).toBeDefined();
        const room = w.ops.statusSnapshot(principalOf('room-code'));
        expect(room.sessions.map(s => s.nSesid)).toEqual(['s1']);
        expect('operator' in room).toBe(false);
    });

    it('operator chip: transmitter (quiet neutral → warn), cloud (synced only when confirmed), problems, to-do', () => {
        const w = world();
        w.kernel.link = linkOf({ state: 'quiet', lastLineAtMs: NOW - 300_000 });
        w.uplink.cloud = { state: 'synced', sinceMs: NOW, lagSec: 0, lagLines: 0, pendingPages: 0, lastSyncedAtMs: null };
        w.uplink.net = { state: 'down', sinceMs: NOW - 60_000 };
        const op = w.ops.operatorStatus();
        expect(op.transmitter.quietLevel).toBe('neutral');
        expect(op.cloud.state).toBe('behind');
        expect(op.problems).toBe(1); // internet unavailable
        expect(op.readinessToDo).toBeGreaterThan(0);
        w.kernel.link = linkOf({ state: 'quiet', lastLineAtMs: NOW - 601_000 });
        expect(w.ops.operatorStatus().transmitter.quietLevel).toBe('warn');
        // Once a session went live today, the to-do count is gone (the verdict took over).
        w.state.sessionsData = [sessionRecord({ firstLineAtMs: NOW - 60_000 })];
        w.kernel.views = [kernelView()];
        expect(w.ops.operatorStatus().readinessToDo).toBe(0);
    });

    it('operator chip: stale when the heartbeat stalled or the uplink loop is stale', async () => {
        const w = world();
        expect(w.ops.operatorStatus().stale).toBe(false);
        await w.ops.start();
        w.advance(15_000);
        expect(w.ops.operatorStatus().stale).toBe(false);
        w.advance(1);
        expect(w.ops.operatorStatus().stale).toBe(true);
        w.timers.fire(w.tuning.heartbeatMs);
        expect(w.ops.operatorStatus().stale).toBe(false);
        w.uplink.linkStatus = { stale: true };
        expect(w.ops.operatorStatus().stale).toBe(true);
        await w.ops.close();
    });
});

describe('OpsService — Ready for today (DR15)', () => {
    it('reports "Checks running" (no checkedAtMs) until the first run, then the results', async () => {
        const w = world();
        let release!: () => void;
        w.host.gate = new Promise<void>(resolve => (release = resolve));
        expect(w.ops.readiness()).toMatchObject({ day: TODAY, checkedAtMs: null, running: false, total: 7 });
        const run = w.ops.runReadiness(admin, ctx);
        await flush();
        expect(w.ops.readiness()).toMatchObject({ checkedAtMs: null, running: true });
        expect(w.ops.verdict().running).toBe(true);
        release();
        const done = await run;
        expect(done.running).toBe(false);
        expect(done.checkedAtMs).toBe(NOW);
        expect(done.items).toHaveLength(7);
        expect(w.state.auditRows).toEqual([expect.objectContaining({ action: 'readiness-run', outcome: 'ok', ip: '10.40.1.77', actor: expect.objectContaining({ nUserid: 'u1' }) })]);
    });

    it('a run pulls assignments when the internet is not down, and survives a failing pull', async () => {
        const w = world();
        w.uplink.syncNowImpl = async () => {
            throw new EdgePortError('box_not_linked', 'refused');
        };
        await w.ops.runReadiness(admin);
        expect(w.uplink.syncNowCalls).toBe(1);
        w.uplink.net = { state: 'down', sinceMs: NOW };
        await w.ops.runReadiness(admin);
        expect(w.uplink.syncNowCalls).toBe(1);
        // A pull that never answers is bounded.
        const slow = world();
        slow.uplink.syncNowImpl = () => new Promise<void>(() => undefined);
        await expect(slow.ops.runReadiness(admin)).resolves.toMatchObject({ checkedAtMs: NOW });
    });

    it('concurrent runs share one run', async () => {
        const w = world();
        const [a, b] = await Promise.all([w.ops.runReadiness(admin), w.ops.runReadiness(admin)]);
        expect(a.checkedAtMs).toBe(b.checkedAtMs);
        expect(w.uplink.syncNowCalls).toBe(1);
        expect(w.host.calls.filter(c => c.startsWith('https:'))).toHaveLength(1);
        expect(w.state.auditRows.filter(r => r.action === 'readiness-run')).toHaveLength(2);
    });

    const todaysCode = {
        day: TODAY,
        alg: 'scrypt' as const,
        salt: 'c2FsdA==',
        hash: 'aGFzaA==',
        scryptN: 32768,
        issuedAtMs: NOW - 3_600_000,
        mintedBy: { nUserid: 'u9', name: 'Maria Admin' },
        source: 'relay' as const,
        uses: 0,
        lastUsedAtMs: null,
    };

    it('evaluates every line from the box state (DR23 default: seven lines, no operator code)', async () => {
        const w = world();
        w.kernel.link = linkOf({ state: 'connected-no-session' });
        await w.ops.runReadiness(admin);
        const r = w.ops.readiness(admin);
        expect(r.items.map(i => [i.key, i.ok])).toEqual([
            ['box-linked', true],
            ['sessions-today', true],
            ['team-lists', true],
            ['transmitter-connected', true],
            ['etabella-reachable', true],
            ['disk-free', true],
            ['clock-in-sync', true],
        ]);
        expect([r.needAttention, r.total]).toEqual([0, 7]);
        // With the switch on, the eighth line reads the day's stored code.
        const on = world({ config: testConfig({ features: { operatorCode: true } }) });
        on.state.operatorCodesByDay.set(TODAY, todaysCode as never);
        on.kernel.link = linkOf({ state: 'connected-no-session' });
        await on.ops.runReadiness(admin);
        const eight = on.ops.readiness(admin);
        expect(eight.items.map(i => i.key)).toContain('operator-code-issued');
        expect([eight.needAttention, eight.total]).toEqual([0, 8]);
        expect(eight.items.find(i => i.key === 'operator-code-issued')).toMatchObject({ ok: true, detail: { issued: true, issuedAtMs: NOW - 3_600_000, mintedByName: 'Maria Admin' } });
        expect(r.items.find(i => i.key === 'sessions-today')?.detail).toEqual({
            count: 1,
            sessions: [{ nSesid: 's1', sessionName: 'Day 3 — Morning', caseName: 'Acme v Beta', startAtMs: Date.UTC(2026, 9, 1, 9, 0), tz: 'Europe/London' }],
            assignmentsSyncedAtMs: NOW - 60_000,
        });
        expect(r.landing).toBe(true);
    });

    it('box linked follows edgeLinkFailure (identity, certificate, LAN listener, uplink start)', () => {
        const w = world();
        const linked = () => w.ops.readiness().items.find(i => i.key === 'box-linked')!;
        w.state.identityRecord = null;
        expect(linked().detail).toMatchObject({ linked: false, failure: 'never-enrolled' });
        w.state.identityRecord = identity({ status: 'quarantined' });
        expect(linked()).toMatchObject({ detail: { failure: 'quarantined' }, action: { kind: 'download-diagnostics' } });
        w.state.identityRecord = identity();
        w.uplink.cert = goodCertificate({ daysLeft: 10 });
        expect(linked().detail).toMatchObject({ failure: 'certificate' });
        w.uplink.cert = goodCertificate();
        w.boot.failed.add('uplink');
        expect(linked().detail).toMatchObject({ failure: 'unreachable' });
        w.boot.failed.clear();
        expect(linked().ok).toBe(true);
    });

    it('DR23: with the operator code off nothing reads, offers or counts it (readiness, to-do, verdict)', async () => {
        const w = world();
        let reads = 0;
        const port = w.state.asPort();
        const get = port.operatorCodes.get;
        (port.operatorCodes as { get: unknown }).get = (day: string) => {
            reads++;
            return get(day);
        };
        const ops = new OpsService(w.config, () => NOW, w.bus, w.boot, port, w.kernel.asPort(), w.uplink.asPort(), w.auth.asPort(), w.host, w.timers, w.tuning);
        await ops.runReadiness(admin); // disk and clock measured
        for (const p of [admin, principalOf('online', { isSuperAdmin: true }), null]) {
            const r = ops.readiness(p);
            expect(r.items.map(i => i.key)).not.toContain('operator-code-issued');
            expect(JSON.stringify(r)).not.toMatch(/operator-code|issue-operator-code/);
        }
        // Everything else ready: nothing to do, although no operator code was issued today.
        expect(ops.operatorStatus().readinessToDo).toBe(0);
        expect(JSON.stringify(ops.verdict())).not.toMatch(/operator/);
        expect(reads).toBe(0);
        // Switched on, the unissued code is one thing to do.
        const on = world({ config: testConfig({ features: { operatorCode: true } }) });
        await on.ops.runReadiness(admin);
        expect(on.ops.operatorStatus().readinessToDo).toBe(1);
        expect(on.ops.readiness(admin).items.find(i => i.key === 'operator-code-issued')).toMatchObject({ ok: false, level: 'warn' });
    });

    it('offers "Issue operator code" (switched on) only to an online case admin while etabella.net is reachable', () => {
        const w = world({ config: testConfig({ features: { operatorCode: true } }) });
        const action = (p: Parameters<OpsService['readiness']>[0]) => w.ops.readiness(p).items.find(i => i.key === 'operator-code-issued')!.action;
        expect(action(admin)).toEqual({ kind: 'issue-operator-code', primary: true, href: null });
        expect(action(principalOf('operator'))).toEqual({ kind: 'open-rt-production', primary: false, href: 'https://cloud.invalid/admin/realtime' });
        expect(action(principalOf('online', { adminCaseIds: [] }))?.kind).toBe('open-rt-production');
        expect(action(principalOf('online', { adminCaseIds: [], isSuperAdmin: true }))?.kind).toBe('issue-operator-code');
        expect(action(null)?.kind).toBe('open-rt-production');
        w.uplink.reachable = false;
        expect(action(admin)?.kind).toBe('open-rt-production');
    });

    it("today's sessions use each session's own zone and skip deleted or other days' sessions", () => {
        const w = world();
        w.state.sessionsData = [
            sessionRecord({ nSesid: 'a', dStartDt: '2026-10-01 14:00:00' }),
            sessionRecord({ nSesid: 'b', dStartDt: '2026-10-01', tz: 'Asia/Kolkata' }),
            sessionRecord({ nSesid: 'c', dStartDt: '2026-09-30 10:00:00' }),
            sessionRecord({ nSesid: 'd', deleted: true }),
            sessionRecord({ nSesid: 'e', dStartDt: null }),
        ];
        const detail = w.ops.readiness().items.find(i => i.key === 'sessions-today')!.detail as unknown as { count: number; sessions: { nSesid: string }[] };
        expect(detail.sessions.map(s => s.nSesid)).toEqual(['a', 'b']);
    });
});

describe('OpsService — verdict (DR12)', () => {
    it('lists a feed drop from the kernel event, with "Support alerted" once the FEED_STOPPED alert went out online', async () => {
        const w = world();
        w.kernel.views = [kernelView({ feed: 'stopped', catConnected: false, feedStoppedAtMs: NOW, lastLine: { page: 41, line: 18, atMs: NOW - 5_000 } })];
        w.kernel.link = linkOf({ state: 'disconnected' });
        await w.ops.start();
        w.bus.publish('feed-stopped', { nSesid: 's1', feedStoppedAtMs: NOW, lastLine: { page: 41, line: 18, atMs: NOW - 5_000 }, mode: 'listen', peer: '192.168.20.31:51000' });
        let p = w.ops.verdict().problems.find(x => x.kind === 'feed-stopped')!;
        expect(p.detail).toMatchObject({ feedStoppedAtMs: NOW, gapFromMs: NOW - 5_000, supportAlertedAtMs: null, peer: '192.168.20.31:51000' });

        w.advance(59_000);
        w.timers.fire(w.tuning.heartbeatMs);
        expect(w.alerts().filter(a => a.kind === 'FEED_STOPPED')).toEqual([]);
        w.advance(1_000);
        w.timers.fire(w.tuning.heartbeatMs);
        expect(w.alerts().filter(a => a.kind === 'FEED_STOPPED')).toEqual([expect.objectContaining({ source: 'ops', tier: 'P2', nSesid: 's1', atMs: NOW + 60_000 })]);
        p = w.ops.verdict().problems.find(x => x.kind === 'feed-stopped')!;
        expect((p.detail as { supportAlertedAtMs: number | null }).supportAlertedAtMs).toBe(NOW + 60_000);
        w.timers.fire(w.tuning.heartbeatMs);
        expect(w.alerts().filter(a => a.kind === 'FEED_STOPPED')).toHaveLength(1);
        await w.ops.close();
    });

    it('re-raises FEED_STOPPED once the uplink is back when the first one could not reach support', async () => {
        const w = world();
        w.uplink.online = false;
        w.kernel.views = [kernelView({ feed: 'stopped', catConnected: false, feedStoppedAtMs: NOW })];
        await w.ops.start();
        w.advance(61_000);
        w.timers.fire(w.tuning.heartbeatMs);
        w.timers.fire(w.tuning.heartbeatMs);
        expect(w.alerts().filter(a => a.kind === 'FEED_STOPPED')).toHaveLength(1);
        expect((w.ops.verdict().problems.find(x => x.kind === 'feed-stopped')!.detail as { supportAlertedAtMs: number | null }).supportAlertedAtMs).toBeNull();
        w.uplink.online = true;
        w.advance(5_000);
        w.timers.fire(w.tuning.heartbeatMs);
        expect(w.alerts().filter(a => a.kind === 'FEED_STOPPED')).toHaveLength(2);
        expect((w.ops.verdict().problems.find(x => x.kind === 'feed-stopped')!.detail as { supportAlertedAtMs: number | null }).supportAlertedAtMs).toBe(NOW + 66_000);
        await w.ops.close();
    });

    it('a reconnect leaves a green recovery until "Done" (audited; unknown ids are not_found)', async () => {
        const w = world();
        await w.ops.start();
        w.bus.publish('feed-stopped', { nSesid: 's1', feedStoppedAtMs: NOW - 300_000, lastLine: null, mode: 'dial', peer: null });
        w.bus.publish('feed-resumed', { nSesid: 's1', reconnectedAtMs: NOW, gapFromMs: NOW - 300_000, gapToMs: NOW });
        const v = w.ops.verdict();
        expect(v.problems.filter(p => p.kind === 'feed-stopped')).toEqual([]);
        expect(v.recoveries).toEqual([expect.objectContaining({ kind: 'reconnected', nSesid: 's1', sessionName: 'Day 3 — Morning', sessionTz: 'Europe/London', gapFromMs: NOW - 300_000, gapToMs: NOW })]);
        const id = v.recoveries[0].id;
        expect((await refusal(() => w.ops.dismissRecovery(admin, 'nope', ctx))).code).toBe('not_found');
        w.ops.dismissRecovery(admin, id, ctx);
        expect(w.ops.verdict().recoveries).toEqual([]);
        expect(w.state.auditRows.map(r => [r.action, r.outcome, r.target])).toEqual([
            ['recovery-dismiss', 'not_found', 'nope'],
            ['recovery-dismiss', 'ok', id],
        ]);
        await w.ops.close();
    });

    it('ranks what the box sees: recording failure first, the last safe line from before the failure', async () => {
        const w = world();
        w.kernel.views = [kernelView({ lastLine: { page: 41, line: 12, atMs: NOW - 31_000 } })];
        await w.ops.start();
        w.kernel.views = [kernelView({ durability: 'degraded', degradedSinceMs: NOW, lastLine: { page: 41, line: 20, atMs: NOW } })];
        w.timers.fire(w.tuning.heartbeatMs);
        w.state.identityRecord = null;
        w.uplink.net = { state: 'down', sinceMs: NOW - 1_000 };
        const v = w.ops.verdict();
        expect(v.problems.map(p => p.kind)).toEqual(['recording-failed', 'box-not-linked', 'internet-unavailable']);
        expect(v.problems[0].detail).toEqual({ reason: 'io-error', lastSafe: { page: 41, line: 12, atMs: NOW - 31_000 } });
        expect(v.overall).toBe('critical');
        expect(v.logFilterDefault).toBe('problems');
        expect(VERDICT_KINDS.indexOf('recording-failed')).toBe(0);
        await w.ops.close();
    });

    it('offers Reconnect with the transmitter state version for a dial-mode drop', () => {
        const w = world();
        w.kernel.settings = DIAL;
        w.kernel.stateVersion = 31;
        w.kernel.link = linkOf({ state: 'disconnected', mode: 'dial' });
        w.kernel.views = [kernelView({ feed: 'stopped', mode: 'dial', feedStoppedAtMs: NOW - 10_000, catConnected: false })];
        const p = w.ops.verdict().problems.find(x => x.kind === 'feed-stopped')!;
        expect(p.actions[0]).toEqual({ kind: 'reconnect', primary: true, stateVersion: 31, nSesid: null });
    });
});

describe('OpsService — Connectivity Log (D34, DR12)', () => {
    it('pages a day newest first with the defaults, collapsed retry rows and their tries', () => {
        const w = world();
        const log = w.state.log;
        const base = { source: 'transmitter' as const, nSesid: 's1', sessionName: 'Day 3 — Morning', actor: null, data: {} };
        log.append({ ...base, atMs: NOW - 9_000, event: 'connected', code: 'tx-connected', problem: false, peer: '192.168.20.31:8080' });
        for (let i = 0; i < 63; i++) {
            log.retry('tx-dial:192.168.20.31:8080', { atMs: NOW - 8_000 + i * 100, error: 'refused', peer: '192.168.20.31:8080' }, { ...base, atMs: NOW - 8_000, event: 'retrying', code: 'tx-refused', problem: true, peer: '192.168.20.31:8080', data: { error: 'refused' } });
        }
        log.append({ ...base, source: 'cloud', atMs: NOW - 1_000, event: 'connected', code: 'cloud-connected', problem: false, peer: null, nSesid: null, sessionName: null });

        const page = w.ops.connectivityLog({});
        expect(page).toMatchObject({ filter: 'all', day: TODAY, days: [TODAY], nextBefore: null });
        expect(page.rows.map(r => r.code)).toEqual(['cloud-connected', 'tx-refused', 'tx-connected']);
        const retry = page.rows[1];
        expect(retry.retry).toEqual({ sinceMs: NOW - 8_000, tries: 63, lastError: 'refused', active: true });
        expect(retry.updatedAtMs).toBe(NOW - 8_000 + 62 * 100);

        expect(w.ops.connectivityLog({ filter: 'problems' }).rows.map(r => r.code)).toEqual(['tx-refused']);
        expect(w.ops.connectivityLog({ filter: 'cloud' }).rows.map(r => r.code)).toEqual(['cloud-connected']);
        expect(w.ops.connectivityLog({ filter: 'transmitter', q: 'REFUSED' }).rows.map(r => r.code)).toEqual(['tx-refused']);
        expect(w.ops.connectivityLog({ q: '   ' }).rows).toHaveLength(3);

        const first = w.ops.connectivityLog({ limit: 2 });
        expect(first.rows).toHaveLength(2);
        const second = w.ops.connectivityLog({ limit: 2, before: first.nextBefore! });
        expect(second.rows.map(r => r.code)).toEqual(['tx-connected']);
        expect(second.nextBefore).toBeNull();

        // "N new events": rows created OR updated since the cursor; the collapsed row comes back with its id.
        const cursor = first.newest!;
        log.retry('tx-dial:192.168.20.31:8080', { atMs: NOW, error: 'timeout', peer: '192.168.20.31:8080' }, { ...base, atMs: NOW, event: 'retrying', code: 'tx-refused', problem: true, peer: null });
        const fresh = w.ops.connectivityLog({ after: cursor });
        expect(fresh.rows.map(r => [r.id, r.retry?.tries])).toEqual([[retry.id, 64]]);

        const tries = w.ops.connectivityLogTries(retry.id, null, 5);
        expect(tries.rows).toHaveLength(5);
        expect(tries.rows[0]).toEqual({ atMs: NOW, error: 'timeout', peer: '192.168.20.31:8080' });
        expect(w.ops.connectivityLogTries(retry.id, tries.nextBefore, 200).rows).toHaveLength(59);
        expect(w.ops.connectivityLogTries(retry.id, null, null).rows).toHaveLength(50);
    });

    it('refuses bad queries with invalid_request and unknown rows with not_found; an empty day is "No events today"', async () => {
        const w = world();
        expect(w.ops.connectivityLog({ day: '2026-09-30' })).toEqual({ filter: 'all', day: '2026-09-30', rows: [], nextBefore: null, newest: null, days: [] });
        for (const q of [{ filter: 'errors' }, { day: '2026-13-01' }, { day: 'today' }, { limit: 0 }, { limit: 201 }, { limit: 1.5 }, { q: 'x'.repeat(201) }, { before: '' }, { after: 'x'.repeat(513) }, { before: 'not-a-cursor' }]) {
            expect((await refusal(() => w.ops.connectivityLog(q as never))).code).toBe('invalid_request');
        }
        expect((await refusal(() => w.ops.connectivityLogTries('r404', null, 10))).code).toBe('not_found');
        expect((await refusal(() => w.ops.connectivityLogTries('', null, 10))).code).toBe('invalid_request');
        expect((await refusal(() => w.ops.connectivityLogTries('r1', null, 0))).code).toBe('invalid_request');
        expect((await refusal(() => w.ops.connectivityLogTries('r1', '', 10))).code).toBe('invalid_request');
    });

    describe('Clear log (super admins, user decision 2026-10-04)', () => {
        const SUPER = principalOf('online', { userId: 'u-super', name: 'A. Jha', isSuperAdmin: true });
        const seed = (w: World): void => {
            const base = { source: 'transmitter' as const, nSesid: 's1', sessionName: 'Day 3 — Morning', peer: '192.168.20.31:8080', actor: null, data: {} };
            w.state.log.append({ ...base, atMs: NOW - 2 * 86_400_000, event: 'connected', code: 'tx-connected', problem: false });
            w.state.log.append({ ...base, atMs: NOW - 9_000, event: 'connected', code: 'tx-connected', problem: false });
            w.state.log.retry('tx-dial:192.168.20.31:8080', { atMs: NOW - 5_000, error: 'refused', peer: null }, { ...base, atMs: NOW - 5_000, event: 'retrying', code: 'tx-refused', problem: true });
        };

        it('a super admin clears every day; ONE log-cleared row names them; audited with the client IP', () => {
            const w = world();
            seed(w);
            const cursor = w.ops.connectivityLog({}).newest!;
            expect(w.ops.connectivityLog({}).days).toEqual([TODAY, '2026-09-29']);

            const cleared = w.ops.clearConnectivityLog(SUPER, ctx);
            const actor = { nUserid: 'u-super', name: 'A. Jha', via: 'online', operatorName: null };
            expect(cleared).toEqual({
                removed: 3,
                row: expect.objectContaining({ atMs: NOW, updatedAtMs: NOW, event: 'success', source: 'box', code: 'log-cleared', problem: false, nSesid: null, sessionName: null, peer: null, actor, data: {}, retry: null }),
            });
            expect(actor).toEqual(actorOf(SUPER));
            expect(w.state.log.all()).toEqual([cleared.row]);
            expect(w.ops.connectivityLog({})).toMatchObject({ rows: [cleared.row], days: [TODAY] });
            expect(w.ops.connectivityLog({ after: cursor }).rows).toEqual([cleared.row]);
            expect(w.state.auditRows).toEqual([expect.objectContaining({ action: 'log-clear', outcome: 'ok', actor, ip: '10.40.1.77', data: { removed: 3 } })]);
        });

        it('refuses a case admin and an operator-code session with not_box_admin, also with box.settingsAccess case-admin; nothing is deleted', async () => {
            const w = world({ config: testConfig({ box: { name: 'Court 3', label: 'VB-014', timeZone: 'Europe/London', settingsAccess: 'case-admin' } }) });
            seed(w);
            const before = w.state.log.all();
            for (const who of [principalOf('online'), principalOf('operator')]) {
                expect(who.isBoxAdmin).toBe(true);
                const err = await refusal(() => w.ops.clearConnectivityLog(who, ctx));
                expect([err.code, err.status]).toEqual(['not_box_admin', 403]);
            }
            expect(w.state.log.all()).toEqual(before);
            expect(w.state.auditRows.map(r => [r.action, r.outcome, r.actor?.via, r.ip])).toEqual([
                ['log-clear', 'not_box_admin', 'online', '10.40.1.77'],
                ['log-clear', 'not_box_admin', 'operator', '10.40.1.77'],
            ]);
        });
    });

    it('writes box-started at start and clock rows on transitions only', async () => {
        const w = world();
        w.host.chronyReading = { offsetMs: 12_000, synced: false, source: 'chrony' };
        await w.ops.start();
        await flush();
        const codes = () => w.state.log.all().map(r => [r.code, r.problem, r.source, r.event]);
        expect(codes()).toEqual([
            ['box-started', false, 'box', 'success'],
            ['clock-unsynced', true, 'box', 'error'],
        ]);
        w.timers.fire(w.tuning.clockCheckMs);
        await flush();
        expect(codes()).toHaveLength(2);
        w.host.chronyReading = { offsetMs: 3, synced: true, source: 'chrony' };
        w.timers.fire(w.tuning.clockCheckMs);
        await flush();
        expect(codes()[2]).toEqual(['clock-synced', false, 'box', 'success']);
        await w.ops.close();

        const synced = world();
        await synced.ops.start();
        await flush();
        expect(synced.state.log.all().map(r => r.code)).toEqual(['box-started']);
        await synced.ops.close();
    });
});

describe('OpsService — network checks, this box, metrics', () => {
    it('reports addresses before any run and the probes after "Run checks again" (audited)', async () => {
        const w = world();
        const before = w.ops.network();
        expect(before.checkedAtMs).toBeNull();
        expect(before.everyMs).toBe(w.tuning.networkCheckMs);
        expect(before.checks.map(c => [c.key, c.ok, c.value])).toEqual([
            // A plain-HTTP box (`http.tls: null`): the room opens a URL.
            ['box-room-address', true, 'http://10.40.1.5'],
            ['box-transmitter-address', true, '192.168.20.2'],
            ['internet', true, null],
            // The uplink reaches etabella.net now: no probe needed for the tick.
            ['etabella-reachable', true, null],
            ['dns', false, 'cloud.invalid'],
            ['clock-offset', false, null],
        ]);
        w.host.dns['one.one.one.one'] = failedDns('ETIMEOUT');
        const after = await w.ops.runNetwork(admin, ctx);
        expect(after.checkedAtMs).toBe(NOW);
        expect(after.checks.every(c => c.ok)).toBe(true);
        expect(w.host.calls).toEqual(expect.arrayContaining(['https:https://cloud.invalid/favicon.ico', 'resolve:cloud.invalid', 'resolve:one.one.one.one', 'resolve:dns.google']));
        expect(w.state.auditRows).toEqual([expect.objectContaining({ action: 'network-run', outcome: 'ok', ip: '10.40.1.77' })]);
    });

    it('bounds a probe that never answers', async () => {
        const w = world();
        w.uplink.reachable = false;
        w.host.gate = new Promise<void>(() => undefined);
        const started = Date.now();
        const result = await w.ops.runNetwork(admin);
        expect(Date.now() - started).toBeLessThan(5_000);
        expect(result.checks.find(c => c.key === 'etabella-reachable')).toMatchObject({ ok: false, level: 'bad' });
        expect(result.checks.find(c => c.key === 'dns')).toMatchObject({ ok: false });
    }, 10_000);

    it('"This box": versions, disk, journal, clock, certificate, UPS and the short cloud root', async () => {
        const w = world();
        w.host.bytes[w.config.paths.journalDir] = 5 * 1_048_576 + 104_858;
        w.uplink.syncs = [syncOf({ cloudRoot: 'aaaa' + '0'.repeat(56) + 'bbbb', lastSyncedAtMs: NOW - 9_000 }), syncOf({ nSesid: 's2', cloudRoot: '9f3c' + 'e'.repeat(56) + 'c0a1', lastSyncedAtMs: NOW - 1_000 })];
        await w.ops.runReadiness(admin);
        expect(w.ops.boxDetails()).toEqual({
            nEdgeid: 'e7d1c2b0-0000-4000-8000-000000000014',
            boxName: 'Court 3',
            boxLabel: 'VB-014',
            version: '1.0.3',
            parserVer: FEED_PARSE_VERSION,
            backendCommit: 'abc1234',
            feCommit: 'def5678',
            nowMs: NOW,
            timeZone: 'Europe/London',
            uptimeSec: 3_600,
            clockOffsetMs: 2,
            clockSynced: true,
            // chrony synced and no etabella.net reading yet: lines use the chrony-synced PC clock (user decision 2026-10-05).
            timeSource: 'chrony',
            serverTimeCheckedAtMs: null,
            diskFreeMB: 212_000,
            diskTotalMB: 480_000,
            journalMB: 5.1,
            certDaysLeft: 80,
            upsOnBattery: false,
            cloudRootShort: '9f3c…c0a1',
        });
        w.state.identityRecord = null;
        expect(w.ops.boxDetails().nEdgeid).toBe('');
        expect(shortRoot(null)).toBeNull();
        expect(shortRoot('abcd')).toBe('abcd');
    });

    it('measures the disk on demand when no heartbeat ran yet', () => {
        const w = world();
        w.host.diskUsage = { freeMB: 9_000, totalMB: 100_000 };
        expect(w.ops.boxDetails().diskFreeMB).toBe(9_000);
    });

    it('metrics: Prometheus text, labelled by session id only (never names)', () => {
        const w = world();
        w.kernel.views = [kernelView()];
        w.uplink.syncs = [syncOf({ lagLines: 7 })];
        w.bus.publish('lan-viewers', { nSesid: 's1', count: 3 });
        const text = w.ops.metrics();
        expect(text).toContain('# TYPE rt_edge_up gauge\nrt_edge_up 1');
        expect(text).toContain('rt_edge_session_total_lines{nsesid="s1"} 1018');
        expect(text).toContain('rt_edge_session_lag_lines{nsesid="s1"} 7');
        expect(text).toContain('rt_edge_verdict_problems{severity="critical"} 0');
        expect(text).toContain('rt_edge_cert_days_left 80');
        expect(text).not.toContain('Day 3');
        expect(text).not.toContain('Acme');
    });

    it('metrics count LAN viewers once ops is subscribed', async () => {
        const w = world();
        await w.ops.start();
        w.kernel.views = [kernelView()];
        w.bus.publish('lan-viewers', { nSesid: 's1', count: 3 });
        expect(w.ops.metrics()).toContain('rt_edge_session_lan_viewers{nsesid="s1"} 3');
        await w.ops.close();
    });
});

describe('OpsService — diagnostics (redacted) and the reporter card (O-12)', () => {
    it('zips every section, audits the download, and never leaks secrets or transcript text', async () => {
        const w = world();
        w.kernel.views = [kernelView()];
        w.uplink.syncs = [syncOf()];
        w.state.captures = [{ id: 'cap1', nSesid: 's1', kind: 'C', user: 'eclipse-user-7', peer: '192.168.20.40:5000', fromMs: NOW - 9_000, toMs: NOW - 1_000, bytes: 900, sha256: 'c'.repeat(64), file: '/var/lib/etabella-edge/capture/cap1.bin', uploadedAtMs: null, nOrphanid: null }];
        w.state.auditRows.push({ id: 'a0', atMs: NOW - 60_000, action: 'room-code-redeem', actor: null, outcome: 'code_wrong', nSesid: 's1', target: null, ip: '10.40.1.80', deviceHash: 'd'.repeat(64), data: { attemptsLeft: 4 } });
        w.state.log.append({ atMs: NOW - 5_000, event: 'error', source: 'transmitter', code: 'tx-login-refused', problem: true, nSesid: 's1', sessionName: 'Day 3 — Morning', peer: '192.168.20.40:5000', actor: null, data: { error: 'refused' } });
        w.state.log.append({ atMs: NOW - OPS_DIAGNOSTICS_LOG_WINDOW_MS - 1, event: 'success', source: 'box', code: 'box-started', problem: false, nSesid: null, sessionName: null, peer: null, actor: null, data: {} });
        await w.ops.start();
        w.bus.publish('alert', { source: 'auth', tier: 'P2', critical: false, kind: 'TOKEN_REFUSED', message: `refused ${admin.token}`, atMs: NOW, nSesid: null, data: { token: admin.token, password: 'hunter2' } });

        const file = await w.ops.diagnostics(admin, ctx);
        expect(file.fileName).toBe('etabella-box-VB-014-20261001-1030.zip');
        expect(file.contentType).toBe('application/zip');
        const entries = unzip(file.body);
        expect(entries.map(e => e.name)).toEqual([
            'README.txt',
            'manifest.json',
            'box.json',
            'status.json',
            'readiness.json',
            'verdict.json',
            'network.json',
            'transmitter.json',
            'sessions.json',
            'device.json',
            'boot.json',
            'certificate.json',
            'state-health.json',
            'connectivity-log.json',
            'alerts.json',
            'audit.json',
        ]);
        const json = (name: string) => JSON.parse(entries.find(e => e.name === name)!.data.toString());
        expect(json('manifest.json').versions).toEqual({ sw: '1.0.3', backendCommit: 'abc1234', feCommit: 'def5678', parserVer: FEED_PARSE_VERSION, edgeProto: 1, edgeFmt: 1, contract: '1.0.0', node: process.version });
        // The last 24 h, newest first: today's box-started (from start()) and the refused login; not yesterday's row.
        expect(json('connectivity-log.json').map((r: { code: string }) => r.code)).toEqual(['box-started', 'tx-login-refused']);
        expect(json('sessions.json')[0]).toMatchObject({ nSesid: 's1', hasRoute: true, kernel: { feed: 'live', raw: { headSeq: 900, durableSeq: 900 } }, uplink: { uplinkState: 'ok' } });
        expect(json('sessions.json')[0].incidents).toEqual([{ kind: 'CAT_DISCONNECT', level: 'info', seq: 12, atMs: NOW - 600_000, fromSeq: null, toSeq: null }]);
        expect(json('alerts.json')[0].data).toEqual({ token: '[redacted]', password: '[redacted]' });

        const everything = entries.map(e => e.data.toString('utf8')).join('\n');
        const secrets = [
            admin.token,
            'eclipse-user-7',
            'c2FsdHNhbHRzYWx0c2FsdA==',
            'aGFzaGhhc2hoYXNoaGFzaGhhc2hoYXNoaGFzaGhhc2g=',
            'f'.repeat(64),
            'a'.repeat(64),
            'b'.repeat(64),
            'c'.repeat(64),
            'd'.repeat(64),
            '9f3c' + 'e'.repeat(56) + 'c0a1',
            '9f3c…c0a1',
            identity().keyFingerprint,
            identity().publicKeySpki,
            goodCertificate().info!.fingerprint256,
            w.kernel.pagesText,
            'TRANSCRIPT SNIPPET IN A NOTE',
            'hunter2',
        ];
        for (const secret of secrets) expect(everything).not.toContain(secret);
        expect(everything).toContain('192.168.20.40:5000');
        expect(w.state.auditRows[w.state.auditRows.length - 1]).toMatchObject({ action: 'diagnostics-download', outcome: 'ok', ip: '10.40.1.77', data: { bytes: file.body.length } });
        await w.ops.close();
    });

    it('a failing section is reported as unavailable instead of failing the download', async () => {
        const w = world();
        const port = w.kernel.asPort();
        (port as { transmitterState: unknown }).transmitterState = () => {
            throw new Error('kernel busy');
        };
        const ops = new OpsService(w.config, () => NOW, w.bus, w.boot, w.state.asPort(), port, w.uplink.asPort(), w.auth.asPort(), w.host, w.timers, w.tuning);
        const entries = unzip((await ops.diagnostics(admin)).body);
        expect(JSON.parse(entries.find(e => e.name === 'transmitter.json')!.data.toString())).toEqual({ unavailable: 'kernel busy' });
    });

    it('reporter card: server address, port 2500 and the Eclipse username; never a password (O-12); audited', async () => {
        const w = world();
        const card = w.ops.reporterCard(admin, { nSesid: ' s1 ' }, ctx);
        expect(card).toEqual({
            nSesid: 's1',
            sessionName: 'Day 3 — Morning',
            caseName: 'Acme v Beta',
            serverAddress: '192.168.20.2',
            port: 2500,
            username: 'eclipse-user-7',
            password: null,
            passwordSource: 'rt-production',
            mode: 'listen',
            openedAtMs: NOW,
        });
        expect(w.state.auditRows).toEqual([expect.objectContaining({ action: 'reporter-card', outcome: 'ok', nSesid: 's1', target: 's1', ip: '10.40.1.77' })]);
        // Even with the feature flag on, the box holds no password to show.
        const flagged = world({ config: testConfig({ features: { reporterPasswordOnBox: true } }) });
        expect(flagged.ops.reporterCard(admin, { nSesid: 's1' }).password).toBeNull();
    });

    it('reporter card: unknown, purged, deleted or not-visible sessions are session_not_found (audited)', async () => {
        const w = world();
        w.state.sessionsData = [sessionRecord(), sessionRecord({ nSesid: 's2', deleted: true }), sessionRecord({ nSesid: 's3', localState: 'purged', purgedAtMs: NOW })];
        w.auth.openable = new Set(['s1', 's2', 's3']);
        for (const id of ['nope', 's2', 's3']) expect((await refusal(() => w.ops.reporterCard(admin, { nSesid: id }))).code).toBe('session_not_found');
        w.auth.openable = new Set();
        expect((await refusal(() => w.ops.reporterCard(admin, { nSesid: 's1' }))).code).toBe('session_not_found');
        expect(w.ops.reporterCard(principalOf('online', { isSuperAdmin: true }), { nSesid: 's1' }).nSesid).toBe('s1');
        expect((await refusal(() => w.ops.reporterCard(admin, { nSesid: '' }))).code).toBe('invalid_request');
        expect(w.state.auditRows.filter(r => r.outcome === 'session_not_found')).toHaveLength(4);
        // No route delivered (dial-only session): an empty username, not a crash.
        w.state.sessionsData = [sessionRecord({ route: null })];
        w.auth.openable = new Set(['s1']);
        expect(w.ops.reporterCard(admin, { nSesid: 's1' }).username).toBe('');
    });
});

describe('OpsService — lifecycle, heartbeat and alerts', () => {
    it('start: subscribes, starts four timers, publishes device-health and a heartbeat per unpurged session; close undoes it', async () => {
        const w = world();
        w.state.sessionsData = [sessionRecord(), sessionRecord({ nSesid: 's2' }), sessionRecord({ nSesid: 's3', localState: 'purged', purgedAtMs: NOW })];
        await w.ops.start();
        await w.ops.start();
        expect(w.timers.active.size).toBe(4);
        // Heartbeat, clock, network re-run (user decision 2026-10-04), retention.
        expect([...w.timers.active.values()].map(t => t.ms).sort((a, b) => a - b)).toEqual([5_000, 60_000, 120_000, 600_000]);
        expect(w.bus.listenerCount('feed-stopped')).toBe(1);
        expect(w.seen['session-status']).toEqual([
            { nSesid: 's1', cause: 'heartbeat', atMs: NOW },
            { nSesid: 's2', cause: 'heartbeat', atMs: NOW },
        ]);
        expect(w.seen['device-health'][0]).toEqual({
            atMs: NOW,
            diskFreeMB: 212_000,
            journalBytes: 3 * 1_048_576,
            captureBytes: 3 * 1_048_576,
            clockOffsetMs: null,
            chronySynced: null,
            certDaysLeft: 80,
            upsOnBattery: null,
        } as EdgeDeviceHealth);
        await flush();
        w.advance(5_000);
        w.timers.fire(5_000);
        expect(w.seen['device-health'][w.seen['device-health'].length - 1]).toMatchObject({ atMs: NOW + 5_000, clockOffsetMs: 2, chronySynced: true, upsOnBattery: false });
        w.bus.publish('certificate-installed', { atMs: NOW, notAfterMs: NOW + 90 * 86_400_000, fingerprint256: 'AA', first: true });
        expect(w.seen['device-health']).toHaveLength(3);

        await w.ops.close();
        expect(w.timers.active.size).toBe(0);
        expect(w.bus.listenerCount('feed-stopped')).toBe(0);
        const before = w.seen['session-status'].length;
        await w.ops.start();
        expect(w.timers.active.size).toBe(0);
        expect(w.seen['session-status']).toHaveLength(before);
    });

    it('a failing dependency on the heartbeat is isolated (the rest still runs)', async () => {
        const w = world();
        const port = w.state.asPort();
        (port.sessions as { list: unknown }).list = () => {
            throw new Error('sqlite busy');
        };
        const ops = new OpsService(w.config, () => NOW, w.bus, w.boot, port, w.kernel.asPort(), w.uplink.asPort(), w.auth.asPort(), w.host, w.timers, w.tuning);
        await expect(ops.start()).resolves.toBeUndefined();
        expect(w.seen['device-health']).toHaveLength(1);
        await ops.close();
    });

    it('certificate alerts: P2 under 21 days, P1 under 7 with an unsealed session, each once per day', async () => {
        const w = world();
        w.uplink.cert = goodCertificate({ daysLeft: 20 });
        await w.ops.start();
        w.timers.fire(5_000);
        expect(w.alerts().filter(a => a.kind === 'CERTIFICATE_EXPIRING').map(a => a.tier)).toEqual(['P2']);
        w.uplink.cert = goodCertificate({ daysLeft: 6 });
        w.timers.fire(5_000);
        expect(w.alerts().filter(a => a.kind === 'CERTIFICATE_EXPIRING').map(a => a.tier)).toEqual(['P2', 'P1']);
        w.advance(86_400_000);
        w.state.sessionsData = [sessionRecord({ sealedAtMs: NOW, sealState: 'K', localState: 'sealed' })];
        w.timers.fire(5_000);
        expect(w.alerts().filter(a => a.kind === 'CERTIFICATE_EXPIRING').map(a => a.tier)).toEqual(['P2', 'P1', 'P2']);
        await w.ops.close();
    });

    it('disk alert: P2 under 5 GB, once per day', async () => {
        const w = world();
        w.host.diskUsage = { freeMB: 4_000, totalMB: 100_000 };
        await w.ops.start();
        w.timers.fire(5_000);
        expect(w.alerts().filter(a => a.kind === 'DISK_LOW')).toEqual([expect.objectContaining({ tier: 'P2', source: 'ops', data: { freeMB: 4_000 } })]);
        await w.ops.close();
    });

    it('clock alerts: offset over 5 s P2, over 60 s P1; unsynced over 1 h with a CaseView session P1; UPS on battery P2', async () => {
        const w = world();
        w.host.chronyReading = { offsetMs: 7_000, synced: true, source: 'chrony' };
        w.host.ups = true;
        await w.ops.start();
        await flush();
        expect(w.alerts().map(a => [a.kind, a.tier])).toEqual([
            ['CLOCK_OFFSET', 'P2'],
            ['UPS_ON_BATTERY', 'P2'],
        ]);
        w.host.chronyReading = { offsetMs: -61_000, synced: false, source: 'chrony' };
        w.kernel.views = [kernelView({ protocol: 'C' })];
        w.timers.fire(60_000);
        await flush();
        w.advance(3_600_001);
        w.timers.fire(60_000);
        await flush();
        expect(w.alerts().map(a => [a.kind, a.tier])).toEqual([
            ['CLOCK_OFFSET', 'P2'],
            ['UPS_ON_BATTERY', 'P2'],
            ['CLOCK_OFFSET', 'P1'],
            ['CLOCK_UNSYNCED', 'P1'],
        ]);
        await w.ops.close();
    });

    it('clock source: chrony, else the cloud clock from the uplink, else the etabella.net Date header', async () => {
        const w = world({ cloudClock: true });
        w.host.chronyReading = null;
        w.uplink.cloudClock = { offsetMs: 420, rttMs: 80, atMs: NOW - 1_000 };
        await w.ops.runNetwork(admin);
        expect(w.ops.boxDetails()).toMatchObject({ clockOffsetMs: 420, clockSynced: true });
        w.uplink.cloudClock = { offsetMs: 420, rttMs: 80, atMs: NOW - 16 * 60_000 };
        w.host.https = { ok: true, status: 204, ms: 100, serverDateMs: NOW - 10_000, sentAtMs: NOW - 100, receivedAtMs: NOW, error: null };
        await w.ops.runNetwork(admin);
        expect(w.ops.boxDetails()).toMatchObject({ clockOffsetMs: 9_450, clockSynced: false });
    });

    it("network clock-offset: against the cloud's serverNowMs while a fresh reading exists, with chrony's synced flag", async () => {
        const w = world({ cloudClock: true });
        const clockCheck = async () => (await w.ops.runNetwork(admin)).checks.find(c => c.key === 'clock-offset');
        w.host.chronyReading = { offsetMs: 2, synced: true, source: 'chrony' };
        w.uplink.cloudClock = { offsetMs: 640, rttMs: 80, atMs: NOW - 1_000 };
        expect(await clockCheck()).toEqual({ key: 'clock-offset', ok: true, level: 'ok', value: null, ms: 640, applies: true, resolver: null });
        // "This box" and readiness keep the box's own clock reading (chrony first, ports/event-bus.ts).
        expect(w.ops.boxDetails().clockOffsetMs).toBe(2);
        // The lines follow etabella.net time (user decision 2026-10-05): a PC clock seconds off is corrected, ok under 60 s.
        w.uplink.cloudClock = { offsetMs: 2_600, rttMs: 80, atMs: NOW };
        expect(await clockCheck()).toMatchObject({ ok: true, level: 'ok', ms: 2_600 });
        w.uplink.cloudClock = { offsetMs: -6_000, rttMs: 80, atMs: NOW };
        expect(await clockCheck()).toMatchObject({ ok: true, level: 'ok', ms: -6_000 });
        w.uplink.cloudClock = { offsetMs: -60_000, rttMs: 80, atMs: NOW };
        expect(await clockCheck()).toMatchObject({ ok: false, level: 'bad', ms: -60_000 });
        // chrony unsynced: still ok while the lines follow etabella.net time.
        w.host.chronyReading = { offsetMs: 2, synced: false, source: 'chrony' };
        w.uplink.cloudClock = { offsetMs: 300, rttMs: 80, atMs: NOW };
        expect(await clockCheck()).toMatchObject({ ok: true, level: 'ok', ms: 300 });
        // No chrony: the cloud reading decides on its own (under 1 s = in sync).
        w.host.chronyReading = null;
        w.uplink.cloudClock = { offsetMs: -300, rttMs: 80, atMs: NOW };
        expect(await clockCheck()).toMatchObject({ ok: true, level: 'ok', ms: -300 });
        // A stale cloud reading is not used: back to chrony.
        w.host.chronyReading = { offsetMs: 7, synced: true, source: 'chrony' };
        w.uplink.cloudClock = { offsetMs: 9_999, rttMs: 80, atMs: NOW - 16 * 60_000 };
        expect(await clockCheck()).toMatchObject({ ok: true, ms: 7 });
        // An uplink without the cloud clock: chrony.
        const plain = world();
        expect((await plain.ops.runNetwork(admin)).checks.find(c => c.key === 'clock-offset')).toMatchObject({ ok: true, ms: 2 });
    });

    it("readiness eTabella reachable: since when it stopped answering (the uplink's cant-reach since, else ops' own probe)", async () => {
        const w = world();
        const detail = () => w.ops.readiness().items.find(i => i.key === 'etabella-reachable')!.detail as { internet: string; reachable: boolean; sinceMs: number | null };
        w.uplink.reachable = false;
        w.host.https = { ok: false, status: null, ms: null, serverDateMs: null, sentAtMs: NOW - 2_000, receivedAtMs: null, error: 'ECONNREFUSED' };
        await w.ops.runNetwork(admin);
        expect(detail()).toEqual({ internet: 'up', reachable: false, sinceMs: NOW - 2_000 });
        w.advance(30_000);
        w.host.https = { ...w.host.https, sentAtMs: w.now() };
        await w.ops.runNetwork(admin);
        expect(detail().sinceMs).toBe(NOW - 2_000);
        w.uplink.cloud = { state: 'cant-reach-etabella', sinceMs: NOW - 50_000, lagSec: 50, lagLines: 0, pendingPages: 0, lastSyncedAtMs: NOW - 50_000 };
        expect(detail().sinceMs).toBe(NOW - 50_000);
        w.uplink.net = { state: 'down', sinceMs: NOW - 70_000 };
        expect(detail()).toEqual({ internet: 'down', reachable: false, sinceMs: NOW - 70_000 });
        w.uplink.net = { state: 'up', sinceMs: NOW };
        // The website answering is not enough while the box's link is still refused (review 2026-10-04)...
        w.uplink.reachable = true;
        expect(detail()).toEqual({ internet: 'up', reachable: false, sinceMs: NOW - 50_000 });
        // ...the link back is.
        w.uplink.cloud = { state: 'synced', sinceMs: w.now(), lagSec: 0, lagLines: 0, pendingPages: 0, lastSyncedAtMs: w.now() };
        expect(detail()).toEqual({ internet: 'up', reachable: true, sinceMs: null });
        // A probe that answers again resets ops' own start.
        w.uplink.reachable = false;
        w.uplink.cloud = { state: 'synced', sinceMs: NOW, lagSec: 0, lagLines: 0, pendingPages: 0, lastSyncedAtMs: NOW };
        w.host.https = { ok: true, status: 204, ms: 30, serverDateMs: w.now(), sentAtMs: w.now(), receivedAtMs: w.now() + 30, error: null };
        await w.ops.runNetwork(admin);
        expect(detail()).toMatchObject({ reachable: true, sinceMs: null });
    });

    it('steps the clock from the cloud (production only) after an hour unsynced or more than a minute off', async () => {
        const prod = testConfig({ mode: 'production', http: { host: '0.0.0.0', port: 0 } });
        const w = world({ config: prod, cloudClock: true });
        w.host.chronyReading = { offsetMs: 90_000, synced: true, source: 'chrony' };
        w.uplink.cloudClock = { offsetMs: 90_000, rttMs: 120, atMs: NOW - 2_000 };
        expect(w.serverTime.status()).toMatchObject({ source: 'etabella', correctionMs: 90_000 });
        await w.ops.runNetwork(admin);
        expect(w.host.steps).toEqual([NOW - 90_000]);
        expect(w.alerts().filter(a => a.kind === 'CLOCK_STEPPED')).toEqual([expect.objectContaining({ tier: 'P2', data: { offsetMs: 90_000, reason: 'offset' } })]);
        // The OS clock now is the cloud's time: etabella.net time goes back to it until the next hello, so the
        // correction is not applied twice (user decision 2026-10-05).
        expect(w.serverTime.status()).toEqual({ source: 'box', correctionMs: 0, targetMs: 0, checkedAtMs: null });
        // Rate limited.
        await w.ops.runNetwork(admin);
        expect(w.host.steps).toHaveLength(1);
        w.advance(15 * 60_000);
        w.uplink.cloudClock = { offsetMs: 90_000, rttMs: 120, atMs: w.now() };
        w.host.stepResult = false;
        await w.ops.runNetwork(admin);
        expect(w.host.steps).toHaveLength(2);
        expect(w.alerts().filter(a => a.kind === 'CLOCK_STEP_FAILED')).toHaveLength(1);
        // A failed step changes nothing: the correction stays.
        expect(w.serverTime.status()).toMatchObject({ source: 'etabella', correctionMs: 90_000 });

        // Unsynced for over an hour with a small offset: still stepped to the cloud.
        const u = world({ config: prod, cloudClock: true });
        u.host.chronyReading = { offsetMs: 3_000, synced: false, source: 'chrony' };
        u.uplink.cloudClock = { offsetMs: 3_000, rttMs: 50, atMs: NOW };
        await u.ops.runNetwork(admin);
        expect(u.host.steps).toEqual([]);
        u.advance(3_600_001);
        u.uplink.cloudClock = { offsetMs: 3_000, rttMs: 50, atMs: u.now() };
        await u.ops.runNetwork(admin);
        expect(u.host.steps).toEqual([u.now() - 3_000]);
    });

    it('never steps the clock in dev mode, with a slow or stale cloud reading, or when it is within a second', async () => {
        const dev = world({ cloudClock: true });
        dev.uplink.cloudClock = { offsetMs: 120_000, rttMs: 50, atMs: NOW };
        await dev.ops.runNetwork(admin);
        expect(dev.host.steps).toEqual([]);

        const prod = testConfig({ mode: 'production', http: { host: '0.0.0.0', port: 0 } });
        for (const cloud of [
            { offsetMs: 120_000, rttMs: 2_500, atMs: NOW },
            { offsetMs: 120_000, rttMs: 50, atMs: NOW - 6 * 60_000 },
        ]) {
            const w = world({ config: prod, cloudClock: true });
            w.uplink.cloudClock = cloud;
            await w.ops.runNetwork(admin);
            expect(w.host.steps).toEqual([]);
        }
        const fine = world({ config: prod, cloudClock: true });
        fine.host.chronyReading = { offsetMs: 500, synced: false, source: 'chrony' };
        fine.advance(0);
        fine.uplink.cloudClock = { offsetMs: 500, rttMs: 50, atMs: NOW };
        await fine.ops.runNetwork(admin);
        fine.advance(3_600_001);
        fine.uplink.cloudClock = { offsetMs: 500, rttMs: 50, atMs: fine.now() };
        await fine.ops.runNetwork(admin);
        expect(fine.host.steps).toEqual([]);
    });
});

describe('OpsService — retention (§10 #19)', () => {
    const sealedLongAgo = { sealedAtMs: NOW - OPS_PURGE_AFTER_SEAL_MS - 1, sealState: 'K' as const, localState: 'sealed' as const, endedAtMs: NOW - OPS_PURGE_AFTER_SEAL_MS - 60_000 };

    it('purge conditions: sealed K, 24 h after the seal, not purged', () => {
        expect(purgeEligible(sessionRecord(sealedLongAgo), NOW)).toBe(true);
        expect(purgeEligible(sessionRecord({ ...sealedLongAgo, sealState: 'W' }), NOW)).toBe(false);
        expect(purgeEligible(sessionRecord({ ...sealedLongAgo, sealedAtMs: NOW - 1_000 }), NOW)).toBe(false);
        expect(purgeEligible(sessionRecord({ ...sealedLongAgo, sealedAtMs: null }), NOW)).toBe(false);
        expect(purgeEligible(sessionRecord({ ...sealedLongAgo, purgedAtMs: NOW }), NOW)).toBe(false);
        expect(dayMinus('2026-10-01', 30)).toBe('2026-09-01');
        expect(dayMinus('2026-03-01', 1)).toBe('2026-02-28');
    });

    it('purges an eligible session, then deletes its journal and uploaded captures inside the data dirs only', async () => {
        const w = world();
        const captureDir = w.config.paths.captureDir;
        w.state.sessionsData = [
            sessionRecord({ nSesid: 'old', ...sealedLongAgo }),
            sessionRecord({ nSesid: 'w', ...sealedLongAgo, sealState: 'W' }),
            sessionRecord({ nSesid: 'held', ...sealedLongAgo }),
            sessionRecord({ nSesid: 'open', ...sealedLongAgo }),
            sessionRecord({ nSesid: '../escape', ...sealedLongAgo }),
            sessionRecord({ nSesid: 'live' }),
        ];
        w.kernel.views = [kernelView({ nSesid: 'open' })];
        const capture = (id: string, nSesid: string, file: string, uploadedAtMs: number | null) => ({
            id,
            nSesid,
            kind: 'C' as const,
            user: null,
            peer: '192.168.20.40:5000',
            fromMs: NOW - 99_000_000,
            toMs: NOW - 98_000_000,
            bytes: 10,
            sha256: 'c'.repeat(64),
            file,
            uploadedAtMs,
            nOrphanid: uploadedAtMs ? 'o1' : null,
        });
        w.state.captures = [
            capture('k1', 'old', path.join(captureDir, 'k1.bin'), NOW - 90_000_000),
            capture('k2', 'old', path.join(w.config.paths.dataDir, '..', 'outside.bin'), NOW - 90_000_000),
            capture('k3', 'held', path.join(captureDir, 'k3.bin'), null),
        ];
        await w.ops.start();
        await flush();
        expect(w.state.purged).toEqual(['old']);
        expect(w.host.removed).toEqual([path.resolve(w.config.paths.journalDir, 'old'), path.resolve(captureDir, 'k1.bin')]);
        expect(w.state.pruned).toEqual([
            ['audit', NOW - 90 * 86_400_000],
            ['operatorCodes', TODAY],
            ['revocations', NOW],
        ]);
        expect(w.state.log.days()).toEqual([TODAY]);
        await w.ops.close();
    });

    it('prunes the Connectivity Log to the last 30 days and alerts when files cannot be deleted', async () => {
        const w = world();
        w.state.log.append({ atMs: NOW - (OPS_LOG_KEEP_DAYS + 2) * 86_400_000, event: 'success', source: 'box', code: 'box-started', problem: false, nSesid: null, sessionName: null, peer: null, actor: null, data: {} });
        w.state.sessionsData = [sessionRecord({ nSesid: 'old', ...sealedLongAgo })];
        w.host.removeFails.add(path.resolve(w.config.paths.journalDir, 'old'));
        await w.ops.start();
        await flush();
        expect(w.state.log.days()).toEqual([TODAY]);
        expect(w.state.purged).toEqual(['old']);
        expect(w.alerts().filter(a => a.kind === 'PURGE_FILES_FAILED')).toEqual([expect.objectContaining({ nSesid: 'old', tier: 'P2' })]);
        await w.ops.close();
    });
});

describe('OpsService — the Status page on the box PC (user decision 2026-10-04)', () => {
    /** This box: plain HTTP on :4000, no reporter network configured (dev, every interface), reporter port 5555. */
    const thisBox = (): BoxConfig => testConfig({ http: { host: '0.0.0.0', port: 4000, tls: null }, transmitter: { listenPort: 5555 } });
    const COM13: TransmitterSettings = { mode: 'serial', protocol: 'caseview', host: null, port: null, serialPath: 'COM13', baudRate: 9600, autoReconnect: true, receivingSesid: null };
    /** os.networkInterfaces() order on the box PC: two VPNs and a virtual switch before the Wi-Fi. */
    function onThisPc(w: World): void {
        w.host.addresses = [
            { name: 'Loopback Pseudo-Interface 1', address: '127.0.0.1', internal: true },
            { name: 'Radmin VPN', address: '26.118.179.38', internal: false },
            { name: 'Hamachi', address: '25.27.55.98', internal: false },
            { name: 'vEthernet (Default Switch)', address: '172.18.64.1', internal: false },
            { name: 'Wi-Fi 2', address: '192.168.1.5', internal: false },
        ];
        w.host.defaultRoute = '192.168.1.5';
    }
    const row = (checks: readonly NetworkCheck[], key: NetworkCheckKey): NetworkCheck => checks.find(c => c.key === key) as NetworkCheck;

    it('re-runs the network checks by themselves every networkCheckMs (not audited); the reply says how often', async () => {
        const w = world();
        await w.ops.start();
        await flush();
        expect(w.ops.network()).toMatchObject({ checkedAtMs: NOW, everyMs: 120_000 });
        const probes = () => w.host.calls.filter(c => c.startsWith('https:')).length;
        const before = probes();
        w.advance(120_000);
        w.timers.fire(w.tuning.networkCheckMs);
        await flush();
        expect(probes()).toBe(before + 1);
        expect(w.ops.network().checkedAtMs).toBe(NOW + 120_000);
        expect(w.state.auditRows.filter(r => r.action === 'network-run')).toEqual([]);
        await w.ops.close();
    });

    it('the background re-run never reads "Running checks…"; a run someone started (or joined) does (review 2026-10-04)', async () => {
        const w = world();
        await w.ops.start();
        await flush();
        let release!: () => void;
        w.host.gate = new Promise<void>(resolve => (release = resolve));
        const before = w.host.calls.filter(c => c.startsWith('https:')).length;
        w.timers.fire(w.tuning.networkCheckMs);
        await flush();
        expect(w.host.calls.filter(c => c.startsWith('https:')).length).toBe(before + 1); // in flight
        expect(w.ops.verdict().running).toBe(false);
        expect(w.ops.network().running).toBe(false);
        // "Run checks again" joins the run in flight: now someone waits for it.
        const joined = w.ops.runNetwork(admin);
        await flush();
        expect(w.ops.verdict().running).toBe(true);
        expect(w.ops.network().running).toBe(true);
        release();
        await joined;
        expect(w.ops.verdict().running).toBe(false);
        // A background run started after it is quiet again.
        w.host.gate = new Promise<void>(resolve => (release = resolve));
        w.timers.fire(w.tuning.networkCheckMs);
        await flush();
        expect([w.ops.verdict().running, w.ops.network().running]).toEqual([false, false]);
        release();
        await flush();
        await w.ops.close();
    });

    it('the Internet and eTabella rows turn red when the link drops after the probes ran', async () => {
        const w = world();
        await w.ops.runNetwork(admin);
        expect(['internet', 'etabella-reachable'].map(k => row(w.ops.network().checks, k as NetworkCheckKey).ok)).toEqual([true, true]);
        w.uplink.net = { state: 'down', sinceMs: NOW + 60_000 };
        w.uplink.reachable = false;
        w.advance(10 * 60_000);
        const later = w.ops.network().checks;
        expect(row(later, 'internet')).toMatchObject({ ok: false, level: 'bad', ms: null });
        expect(row(later, 'etabella-reachable')).toMatchObject({ ok: false, level: 'bad', ms: null });
        // Readiness reads the same five-minute limit for the probe.
        w.uplink.net = { state: 'up', sinceMs: NOW + 9 * 60_000 };
        expect(w.ops.readiness().items.find(i => i.key === 'etabella-reachable')).toMatchObject({ ok: false });
    });

    it("eTabella reachable reads not ok while the uplink's link cannot connect, though the website answers (review 2026-10-04)", async () => {
        const w = world();
        await w.ops.runNetwork(admin);
        // The edge-sync gateway is down: the HTTPS pings (ops' and the uplink's) answer, the box's link is refused.
        w.uplink.reachable = true;
        w.uplink.cloud = { state: 'cant-reach-etabella', sinceMs: NOW - 30_000, lagSec: 30, lagLines: 0, pendingPages: 0, lastSyncedAtMs: NOW - 31_000 };
        expect(row(w.ops.network().checks, 'etabella-reachable')).toMatchObject({ ok: false, level: 'bad', value: 'website answers · box link refused' });
        expect(w.ops.readiness().items.find(i => i.key === 'etabella-reachable')).toMatchObject({ ok: false, detail: { internet: 'up', reachable: false, sinceMs: NOW - 30_000 } });
        // Linked again: ✓ on both.
        w.uplink.cloud = { state: 'synced', sinceMs: w.now(), lagSec: 0, lagLines: 0, pendingPages: 0, lastSyncedAtMs: w.now() };
        expect(row(w.ops.network().checks, 'etabella-reachable')).toMatchObject({ ok: true, value: null });
        expect(w.ops.readiness().items.find(i => i.key === 'etabella-reachable')).toMatchObject({ ok: true, detail: { reachable: true, sinceMs: null } });
    });

    it('room address: the default-route address as http://…:4000, never the Radmin VPN listed first', async () => {
        const w = world({ config: thisBox() });
        onThisPc(w);
        // Before the first run the ranking alone already skips the VPN and virtual adapters.
        expect(row(w.ops.network().checks, 'box-room-address')).toMatchObject({ ok: true, value: 'http://192.168.1.5:4000' });
        // After a run, the address the OS routes from (here a wired adapter the OS lists after the Wi-Fi).
        w.host.addresses = [...w.host.addresses, { name: 'Ethernet', address: '10.0.0.9', internal: false }];
        w.host.defaultRoute = '10.0.0.9';
        await w.ops.runNetwork(admin);
        expect(w.host.calls).toContain('default-route');
        expect(row(w.ops.network().checks, 'box-room-address')).toMatchObject({ ok: true, value: 'http://10.0.0.9:4000' });
    });

    it('reporter-network row: muted on a COM port; in listen mode (dev, every interface) the default-route address', async () => {
        const w = world({ config: thisBox() });
        onThisPc(w);
        w.kernel.settings = COM13;
        expect(row(w.ops.network().checks, 'box-transmitter-address')).toEqual({ key: 'box-transmitter-address', ok: true, level: 'ok', value: 'COM13', ms: null, applies: false, resolver: null });
        w.kernel.settings = LISTEN;
        await w.ops.runNetwork(admin);
        expect(row(w.ops.network().checks, 'box-transmitter-address')).toMatchObject({ ok: true, applies: true, value: '192.168.1.5' });
    });

    it('reporter card and operator status: the box on the reporter network falls back to the default-route address; lockout and held connections stay', async () => {
        const w = world({ config: thisBox() });
        onThisPc(w);
        w.kernel.listenAddress = null;
        w.kernel.listenPort = 5555;
        expect(w.ops.reporterCard(admin, { nSesid: 's1' })).toMatchObject({ serverAddress: '192.168.1.5', port: 5555 });
        expect(w.ops.operatorStatus().listen).toEqual({ address: '192.168.1.5', port: 5555 });
        w.kernel.link = linkOf({ heldPeers: 1, lockout: true });
        expect(w.ops.operatorStatus().transmitter).toMatchObject({ heldPeers: 1, lockout: true });
        // The kernel's own address (a configured bind address) wins.
        w.kernel.listenAddress = '192.168.20.2';
        expect(w.ops.operatorStatus().listen).toEqual({ address: '192.168.20.2', port: 5555 });
        expect(w.ops.sessionStatus('s1', { includeOperator: true })?.operator?.listen).toEqual({ address: '192.168.20.2', port: 5555 });
    });

    it('verdict on COM13: quiet past 10 min is feed-quiet (no page); a closed port is feed-stopped with Reconnect and COM hints', async () => {
        const w = world({ config: thisBox() });
        w.kernel.settings = COM13;
        w.kernel.stateVersion = 40;
        const lastLine = { page: 7, line: 3, atMs: NOW - 601_000 };
        w.kernel.link = linkOf({ state: 'quiet', mode: 'serial', peer: 'COM13 @ 9600', lastLineAtMs: lastLine.atMs });
        w.kernel.views = [kernelView({ feed: 'quiet', mode: 'serial', peer: 'COM13 @ 9600', lastLineAtMs: lastLine.atMs, lastLine })];
        await w.ops.start();
        const quiet = w.ops.verdict();
        expect(quiet.problems.map(p => p.kind)).toEqual(['feed-quiet']);
        expect(quiet.problems[0].detail).toEqual({ lastLineAtMs: lastLine.atMs, lastLine, serialPath: 'COM13', baudRate: 9600 });
        expect(quiet).toMatchObject({ overall: 'problem', logFilterDefault: 'all' });
        w.advance(120_000);
        w.timers.fire(w.tuning.heartbeatMs);
        expect(w.alerts().filter(a => a.kind === 'FEED_STOPPED')).toEqual([]);

        w.kernel.link = linkOf({ state: 'disconnected', mode: 'serial', peer: 'COM13 @ 9600' });
        w.kernel.views = [kernelView({ feed: 'stopped', mode: 'serial', catConnected: false, feedStoppedAtMs: w.now() - 5_000, lastLine })];
        const stopped = w.ops.verdict().problems.find(p => p.kind === 'feed-stopped')!;
        expect(stopped.actions[0]).toEqual({ kind: 'reconnect', primary: true, stateVersion: 40, nSesid: null });
        expect(stopped.hints).toEqual(['check-eclipse-output', 'check-com-cable']);
        expect(stopped.detail).toMatchObject({ serialPath: 'COM13', listenPort: null });
        // Listen mode names the box's real port for the reporter login.
        w.kernel.settings = LISTEN;
        w.kernel.listenPort = 5555;
        expect(w.ops.verdict().problems.find(p => p.kind === 'feed-stopped')!.detail).toMatchObject({ serialPath: null, listenPort: 5555 });
        await w.ops.close();
    });

    it("verdict: can't reach eTabella after 15 s, from the uplink's cloud state (else ops' own failing probe)", async () => {
        const w = world();
        w.uplink.reachable = false;
        w.uplink.linkStatus = { pendingPages: 1, lagSec: 12 };
        w.uplink.cloud = { state: 'cant-reach-etabella', sinceMs: NOW - 10_000, lagSec: 12, lagLines: 3, pendingPages: 1, lastSyncedAtMs: NOW - 12_000 };
        expect(w.ops.verdict().problems).toEqual([]);
        w.advance(5_000);
        const v = w.ops.verdict();
        expect(v.problems.map(p => [p.kind, p.sinceMs, p.detail])).toEqual([['cant-reach-etabella', NOW - 10_000, { sinceMs: NOW - 10_000, pendingPages: 1, lagSec: 12 }]]);
        expect(v.logFilterDefault).toBe('problems');
        expect(w.ops.operatorStatus().problems).toBe(1);
        // Online again: gone, whatever an old probe said.
        w.uplink.cloud = { state: 'synced', sinceMs: w.now(), lagSec: 0, lagLines: 0, pendingPages: 0, lastSyncedAtMs: w.now() };
        expect(w.ops.verdict().problems).toEqual([]);
        // A cloud state without a time: since ops' own probe started failing.
        w.host.https = { ok: false, status: null, ms: null, serverDateMs: null, sentAtMs: w.now() - 20_000, receivedAtMs: null, error: 'ECONNREFUSED' };
        await w.ops.runNetwork(admin);
        w.uplink.cloud = { state: 'cant-reach-etabella', sinceMs: null, lagSec: 0, lagLines: 0, pendingPages: 0, lastSyncedAtMs: null };
        expect(w.ops.verdict().problems.map(p => [p.kind, p.sinceMs])).toEqual([['cant-reach-etabella', w.now() - 20_000]]);
        // Never beside "Internet unavailable".
        w.uplink.net = { state: 'down', sinceMs: w.now() - 60_000 };
        expect(w.ops.verdict().problems.map(p => p.kind)).toEqual(['internet-unavailable']);
    });

    it("verdict: can't reach eTabella when the uplink recorded the link failure `unreachable` (a box that linked before)", () => {
        // The real uplink sets identity.linkFailure 'unreachable' on the first failed reconnect, ~1 s after the drop.
        const w = world();
        w.uplink.reachable = false;
        w.uplink.online = false;
        w.uplink.linkStatus = { online: false, pendingPages: 2, lagSec: 40 };
        w.state.identityRecord = identity({ linkFailure: 'unreachable', lastCloudContactAtMs: NOW - 41_000 });
        w.uplink.cloud = { state: 'cant-reach-etabella', sinceMs: NOW - 40_000, lagSec: 40, lagLines: 6, pendingPages: 2, lastSyncedAtMs: NOW - 41_000 };
        const v = w.ops.verdict();
        expect(v.problems.map(p => [p.kind, p.sinceMs, p.detail])).toEqual([['cant-reach-etabella', NOW - 40_000, { sinceMs: NOW - 40_000, pendingPages: 2, lagSec: 40 }]]);
        expect(v).toMatchObject({ overall: 'problem', logFilterDefault: 'problems' });
        // A box that never linked keeps "Box not linked".
        w.state.identityRecord = identity({ linkFailure: 'unreachable', lastCloudContactAtMs: null });
        expect(w.ops.verdict().problems.map(p => p.kind)).toEqual(['box-not-linked']);
        // A refused key stays "Box not linked" alone.
        w.state.identityRecord = identity({ linkFailure: 'key-refused' });
        w.uplink.cloud = { ...w.uplink.cloud, state: 'not-linked' };
        expect(w.ops.verdict().problems.map(p => p.kind)).toEqual(['box-not-linked']);
    });

    it("verdict: can't reach eTabella with no known start is listed 15 s after the box first saw it", () => {
        const w = world();
        w.uplink.reachable = false;
        w.uplink.cloud = { state: 'cant-reach-etabella', sinceMs: null, lagSec: 0, lagLines: 0, pendingPages: 0, lastSyncedAtMs: null };
        expect(w.ops.verdict().problems).toEqual([]);
        w.advance(15_000);
        expect(w.ops.verdict().problems.map(p => [p.kind, p.sinceMs])).toEqual([['cant-reach-etabella', NOW]]);
    });

    it('verdict: held captures not uploaded, from the cloud link fields (absent fields read none)', () => {
        const w = world();
        expect(w.ops.verdict().problems).toEqual([]);
        // No archive on etabella.net: nothing to show (user decision 2026-10-05).
        w.uplink.cloud = { ...w.uplink.cloud, heldCapturesPending: 1, lastUploadError: { atMs: NOW - 60_000, status: 503, code: 'NOT_CONFIGURED' } } as CloudLinkStatus;
        expect(w.ops.verdict().problems).toEqual([]);
        const lastUploadError = { atMs: NOW - 60_000, status: 500, code: 'ERROR' };
        w.uplink.cloud = { ...w.uplink.cloud, heldCapturesPending: 1, lastUploadError } as CloudLinkStatus;
        const v = w.ops.verdict();
        expect(v.problems.map(p => [p.kind, p.detail])).toEqual([['captures-not-uploaded', { pending: 1, lastError: lastUploadError }]]);
        expect(v).toMatchObject({ overall: 'problem', logFilterDefault: 'all' });
    });

    it('clock on a Windows box (no chrony), user decision 2026-10-05: "Leap 3" stays a fact about the PC clock, but the lines follow etabella.net time: Clock ok, no clock problem', async () => {
        const w = world({ cloudClock: true });
        w.host.chronyReading = null;
        w.host.windowsSynced = false; // this box PC: Leap 3 / Local CMOS Clock
        w.uplink.cloudClock = { offsetMs: 347, rttMs: 80, atMs: NOW - 1_000 };
        expect(row((await w.ops.runNetwork(admin)).checks, 'clock-offset')).toMatchObject({ ok: true, level: 'ok', ms: 347 });
        // "Following etabella.net time · 0.3 s": the offset is how far the PC clock is off, and it is corrected.
        expect(w.ops.boxDetails()).toMatchObject({ clockOffsetMs: 347, clockSynced: false, timeSource: 'etabella', serverTimeCheckedAtMs: NOW - 1_000 - 347 });
        expect(w.ops.verdict().problems).toEqual([]);
        expect(w.ops.readiness().items.find(i => i.key === 'clock-in-sync')).toMatchObject({ ok: true, level: 'ok', detail: { synced: false, offsetMs: 347, source: 'etabella' } });
        // Windows Time only vetoes, never vouches (review 2026-10-04): a cloud-measured 2.5 s still reads "not synced" for
        // the PC clock although w32tm says Leap 0; the lines are corrected, so it is no problem.
        w.host.windowsSynced = true;
        w.uplink.cloudClock = { offsetMs: 2_500, rttMs: 80, atMs: NOW };
        expect(row((await w.ops.runNetwork(admin)).checks, 'clock-offset')).toMatchObject({ ok: true, level: 'ok', ms: 2_500 });
        expect(w.ops.boxDetails()).toMatchObject({ clockOffsetMs: 2_500, clockSynced: false, timeSource: 'etabella' });
        expect(w.ops.verdict().problems).toEqual([]);
        // 60 s or more stays a problem, and pages P1.
        w.uplink.cloudClock = { offsetMs: 61_000, rttMs: 80, atMs: NOW };
        expect(row((await w.ops.runNetwork(admin)).checks, 'clock-offset')).toMatchObject({ ok: false, level: 'bad', ms: 61_000 });
        expect(w.ops.verdict().problems.map(p => [p.kind, p.detail])).toEqual([['clock', { synced: false, offsetMs: 61_000, source: 'etabella' }]]);
        expect(w.alerts().filter(a => a.kind.startsWith('CLOCK')).map(a => [a.kind, a.tier])).toEqual([['CLOCK_OFFSET', 'P1']]);
        // chrony, when it answers, still gives the PC clock's own reading.
        w.uplink.cloudClock = { offsetMs: 347, rttMs: 80, atMs: NOW };
        w.host.chronyReading = { offsetMs: 2, synced: true, source: 'chrony' };
        await w.ops.runNetwork(admin);
        expect(w.ops.boxDetails()).toMatchObject({ clockOffsetMs: 2, clockSynced: true, timeSource: 'etabella' });
    });

    it('no etabella.net time yet and nothing saved: new lines use the box clock, so Clock warns and the verdict lists it until a reading arrives (user decision 2026-10-05)', async () => {
        const w = world({ cloudClock: true });
        w.host.chronyReading = null;
        w.host.windowsSynced = false;
        // Before the first clock check nothing is claimed.
        expect(w.ops.verdict().problems).toEqual([]);
        await w.ops.runNetwork(admin);
        expect(w.ops.boxDetails()).toMatchObject({ timeSource: 'box', serverTimeCheckedAtMs: null, clockOffsetMs: -476, clockSynced: false });
        expect(w.ops.readiness().items.find(i => i.key === 'clock-in-sync')).toMatchObject({ ok: false, level: 'warn', detail: { synced: false, offsetMs: -476, source: 'box' } });
        expect(w.ops.verdict().problems.map(p => [p.kind, p.severity, p.detail])).toEqual([['clock', 'warn', { synced: false, offsetMs: -476, source: 'box' }]]);
        expect(row((await w.ops.runNetwork(admin)).checks, 'clock-offset')).toMatchObject({ ok: false, level: 'warn' });
        // The first etabella.net reading: switched at once, the warning goes.
        w.uplink.cloudClock = { offsetMs: 347, rttMs: 80, atMs: NOW };
        await w.ops.runNetwork(admin);
        expect(w.ops.boxDetails().timeSource).toBe('etabella');
        expect(w.ops.verdict().problems).toEqual([]);
        expect(w.ops.readiness().items.find(i => i.key === 'clock-in-sync')).toMatchObject({ ok: true });
    });

    it('a saved correction (restart offline, or no reading for 15 min) reads "saved": ok for 24 h, then a warning, never a verdict problem (user decision 2026-10-05)', async () => {
        const w = world({ cloudClock: true });
        w.host.chronyReading = null;
        const saved = { offsetMs: 347, targetMs: 347, checkedAtMs: NOW - 3_600_000, rttMs: 40 };
        w.serverTime.attach({ load: () => saved, save: () => undefined });
        await w.ops.runNetwork(admin);
        expect(w.ops.boxDetails()).toMatchObject({ timeSource: 'saved', serverTimeCheckedAtMs: NOW - 3_600_000 - 347 });
        expect(w.ops.readiness().items.find(i => i.key === 'clock-in-sync')).toMatchObject({ ok: true, detail: { source: 'saved' } });
        expect(w.ops.verdict().problems).toEqual([]);
        w.advance(23 * 3_600_000 + 1);
        await w.ops.runNetwork(admin);
        expect(w.ops.readiness().items.find(i => i.key === 'clock-in-sync')).toMatchObject({ ok: false, level: 'warn', detail: { source: 'saved' } });
        expect(w.ops.verdict().problems).toEqual([]);
        // A reading older than 15 min (the box offline since) is "saved" too.
        const later = world({ cloudClock: true });
        later.uplink.cloudClock = { offsetMs: 347, rttMs: 80, atMs: NOW };
        later.advance(16 * 60_000);
        await later.ops.runNetwork(admin);
        expect(later.ops.boxDetails()).toMatchObject({ timeSource: 'saved', serverTimeCheckedAtMs: NOW - 347 });
    });

    it('a reading in the PC clock\'s future (the clock went back under it) is stale, never fresh: "saved" and a warning (review 2026-10-05)', async () => {
        const w = world({ cloudClock: true });
        w.host.chronyReading = null;
        w.uplink.cloudClock = { offsetMs: 347, rttMs: 80, atMs: NOW };
        await w.ops.runNetwork(admin);
        expect(w.ops.boxDetails().timeSource).toBe('etabella');
        // The PC clock goes back 2 min, and nothing folded it (this world's monotonic clock moves with it): the age of
        // the reading would be -2 min, which is not "0 s old".
        w.advance(-120_000);
        await w.ops.runNetwork(admin);
        expect(w.ops.boxDetails()).toMatchObject({ timeSource: 'saved' });
        // The hello's offset no longer describes the PC clock either: not a fresh cloud reading (never a step from it).
        expect(w.ops.boxDetails()).toMatchObject({ clockOffsetMs: -476 });
        expect(w.ops.readiness().items.find(i => i.key === 'clock-in-sync')).toMatchObject({ ok: false, level: 'warn', detail: { source: 'saved' } });
        // A saved correction read back the same way is stale too.
        const saved = world({ cloudClock: true });
        saved.host.chronyReading = null;
        saved.serverTime.attach({ load: () => ({ offsetMs: 347, targetMs: 347, checkedAtMs: NOW - 1_000, rttMs: 40 }), save: () => undefined });
        saved.advance(-60_000);
        await saved.ops.runNetwork(admin);
        expect(saved.ops.readiness().items.find(i => i.key === 'clock-in-sync')).toMatchObject({ ok: false, level: 'warn', detail: { source: 'saved' } });
    });

    it('CLOCK_UNSYNCED pages only while the box is not following etabella.net time (user decision 2026-10-05)', async () => {
        const w = world({ cloudClock: true });
        w.host.chronyReading = null;
        w.host.windowsSynced = false; // this box PC: Leap 3 / Local CMOS Clock
        w.kernel.views = [kernelView({ protocol: 'C' })]; // a live CaseView session (spec §12)
        w.uplink.cloudClock = { offsetMs: 347, rttMs: 80, atMs: NOW };
        await w.ops.runNetwork(admin);
        w.advance(3_600_001);
        w.uplink.cloudClock = { offsetMs: 1_400, rttMs: 80, atMs: w.now() };
        await w.ops.runNetwork(admin);
        w.advance(3_600_001);
        w.uplink.cloudClock = { offsetMs: 1_300, rttMs: 80, atMs: w.now() };
        await w.ops.runNetwork(admin);
        expect(w.alerts().filter(a => a.kind === 'CLOCK_UNSYNCED')).toEqual([]);
        expect(w.ops.verdict().problems).toEqual([]);
        // The Connectivity Log follows the same clock problem: no "clock not synced" row while the lines are corrected.
        expect(w.state.log.all().map(r => r.code)).not.toContain('clock-unsynced');

        // chrony unsynced with no etabella.net time pages whatever the offset, as before.
        const c = world();
        c.host.chronyReading = { offsetMs: 40, synced: false, source: 'chrony' };
        c.kernel.views = [kernelView({ protocol: 'C' })];
        await c.ops.runNetwork(admin);
        c.advance(3_600_001);
        await c.ops.runNetwork(admin);
        expect(c.alerts().filter(a => a.kind === 'CLOCK_UNSYNCED')).toHaveLength(1);
    });

    it('CLOCK_UNSYNCED on the box clock (no etabella.net time reached it): not from Windows Time alone under 1 s; an hour of a drift of 1 s or more does (review 2026-10-04)', async () => {
        const w = world({ cloudClock: true });
        // The uplink reports readings ops sees, none of which reached etabella.net time (an uplink without it).
        w.uplink.serverTime = null;
        w.host.chronyReading = null;
        w.host.windowsSynced = false; // Leap 3 / Local CMOS Clock
        w.kernel.views = [kernelView({ protocol: 'C' })];
        const pages = () => w.alerts().filter(a => a.kind === 'CLOCK_UNSYNCED');
        w.uplink.cloudClock = { offsetMs: 347, rttMs: 80, atMs: NOW };
        await w.ops.runNetwork(admin);
        w.advance(3_600_001);
        w.uplink.cloudClock = { offsetMs: 412, rttMs: 80, atMs: w.now() };
        await w.ops.runNetwork(admin);
        expect(pages()).toEqual([]);
        // The Status page warns: new lines use the box's own clock.
        expect(w.ops.verdict().problems.map(p => [p.kind, p.severity])).toEqual([['clock', 'warn']]);
        // A measured drift of 1 s or more starts its own hour: its first reading does not page, an hour of it does.
        const driftFrom = w.now();
        w.uplink.cloudClock = { offsetMs: 1_400, rttMs: 80, atMs: w.now() };
        await w.ops.runNetwork(admin);
        expect(pages()).toEqual([]);
        w.advance(3_600_001);
        w.uplink.cloudClock = { offsetMs: 1_300, rttMs: 80, atMs: w.now() };
        await w.ops.runNetwork(admin);
        expect(pages()).toEqual([expect.objectContaining({ tier: 'P1', data: { sinceMs: driftFrom } })]);
    });

    it('measures the PC clock on the raw clock, not on etabella.net time: a fresh reading stays fresh and the step target is the cloud time (user decision 2026-10-05)', async () => {
        const prod = testConfig({ mode: 'production', http: { host: '0.0.0.0', port: 0 } });
        // ops' EDGE_CLOCK is etabella.net time here, as in the box; the PC clock runs 20 min slow.
        const w = world({ config: prod, cloudClock: true, etabellaClock: true });
        w.host.chronyReading = null;
        w.uplink.cloudClock = { offsetMs: -1_200_000, rttMs: 80, atMs: NOW - 2_000 };
        await w.ops.runNetwork(admin);
        // Fresh on the PC clock (2 s old; on etabella.net time it would read 20 min old): the cloud's reading is used.
        expect(w.ops.boxDetails()).toMatchObject({ clockOffsetMs: -1_200_000 });
        // Stepped to the cloud's time, from the PC clock: no correction twice, and back to the box clock until the next hello.
        expect(w.host.steps).toEqual([NOW + 1_200_000]);
        expect(w.serverTime.status()).toEqual({ source: 'box', correctionMs: 0, targetMs: 0, checkedAtMs: null });
    });

    it('CLOCK_UNSYNCED page: one reading of 1 s or more after hours under 1 s does not page; an hour of drift does (review 2026-10-04)', async () => {
        const w = world({ cloudClock: true });
        // On the box clock (none of these readings reached etabella.net time): following it, nothing pages at all.
        w.uplink.serverTime = null;
        w.host.chronyReading = null;
        w.host.windowsSynced = false; // Leap 3 / Local CMOS Clock
        w.kernel.views = [kernelView({ protocol: 'C' })];
        const reading = async (offsetMs: number): Promise<void> => {
            w.uplink.cloudClock = { offsetMs, rttMs: 80, atMs: w.now() };
            await w.ops.runNetwork(admin);
        };
        const pages = () => w.alerts().filter(a => a.kind === 'CLOCK_UNSYNCED');
        // 0.3 s for two hours, a reading every 10 min.
        for (let i = 0; i < 12; i++) {
            await reading(300);
            w.advance(600_000);
        }
        await reading(300);
        // One hello with a slow round trip measures 1.05 s: no page.
        await reading(1_050);
        expect(pages()).toEqual([]);
        // Back under 1 s ends that drift; a later one starts a new hour, and only a whole hour of it pages.
        w.advance(600_000);
        await reading(300);
        w.advance(600_000);
        const driftFrom = w.now();
        await reading(1_200);
        w.advance(1_800_000);
        await reading(1_100);
        expect(pages()).toEqual([]);
        w.advance(1_800_001);
        await reading(1_150);
        expect(pages()).toEqual([expect.objectContaining({ tier: 'P1', data: { sinceMs: driftFrom } })]);
    });

    it('DNS row: the cloud host as its value, the resolver as an IPv4', async () => {
        const w = world();
        w.host.dns['cloud.invalid'] = okDns(16, '192.168.1.1');
        expect(row((await w.ops.runNetwork(admin)).checks, 'dns')).toMatchObject({ ok: true, value: 'cloud.invalid', resolver: '192.168.1.1', ms: 16 });
    });

    it('"This box": the disk reads null when it could not be measured (never "0 GB of 0 GB")', () => {
        const w = world();
        w.host.diskUsage = null;
        expect(w.ops.boxDetails()).toMatchObject({ diskFreeMB: null, diskTotalMB: null });
    });
});
