import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing';

import { AppModule, EdgeLifecycle } from './app.module';
import { AccessStub, AuthStub } from './auth/auth.stub';
import { CliStub } from './cli/cli.stub';
import { KernelStub } from './kernel/kernel.stub';
import { LanStub } from './lan/lan.stub';
import { OpsStub } from './ops/ops.stub';
import {
    ACCESS_PORT,
    AccessPort,
    AUTH_PORT,
    AuthPort,
    BOX_CONFIG,
    BoxConfig,
    CLI_PORT,
    CliPort,
    EDGE_BOOT_STATUS,
    EDGE_CLOCK,
    EDGE_EVENT_BUS,
    EDGE_RUN_MODE,
    EdgeAlert,
    EdgeBootRecorder,
    EdgeBootStatus,
    EdgeEventBus,
    EdgePrincipal,
    EdgeRunMode,
    InMemoryEdgeEventBus,
    KERNEL_PORT,
    KernelPort,
    LAN_PORT,
    LanPort,
    NotImplementedPortError,
    OPS_PORT,
    OpsPort,
    parseBoxConfig,
    STATE_PORT,
    StatePort,
    UPLINK_PORT,
    UplinkPort,
} from './ports';
import { bareBox, LIFECYCLE_PORT_TOKENS, lifecyclePorts } from './ports/testing/bare-box';
import { StateStub } from './state/state.stub';
import { UplinkStub } from './uplink/uplink.stub';

const NOW = Date.UTC(2026, 9, 1, 9, 30); // 2026-10-01 10:30 in London

const silentLogger = { log: () => undefined, error: () => undefined, warn: () => undefined, debug: () => undefined, verbose: () => undefined };

/** Every port token of the box and the skeleton stub that implements it. */
const STUBS = [
    [STATE_PORT, StateStub],
    [KERNEL_PORT, KernelStub],
    [UPLINK_PORT, UplinkStub],
    [AUTH_PORT, AuthStub],
    [ACCESS_PORT, AccessStub],
    [OPS_PORT, OpsStub],
    [LAN_PORT, LanStub],
    [CLI_PORT, CliStub],
] as const;

const principal = (kind: EdgePrincipal['kind']): EdgePrincipal => ({
    kind,
    userId: kind === 'operator' ? null : 'u1',
    name: 'P. Shah',
    email: null,
    caseIds: ['c1'],
    adminCaseIds: ['c1'],
    isBoxAdmin: true,
    isSuperAdmin: false,
    validUntil: NOW + 3_600_000,
    untilSessionEnds: false,
    jti: 'j1',
    issuedAt: NOW,
    authTime: NOW,
    mintedBy: null,
    operatorDay: null,
    deviceHash: null,
    forwardable: kind === 'online',
    token: 't',
});

async function expectNotImplemented(work: () => unknown): Promise<void> {
    let caught: unknown;
    try {
        await work();
    } catch (err) {
        caught = err;
    }
    expect(caught).toBeInstanceOf(NotImplementedPortError);
    expect((caught as NotImplementedPortError).status).toBe(500);
    expect((caught as NotImplementedPortError).code).toBe('server_error');
}

const flush = async (): Promise<void> => {
    for (let i = 0; i < 5; i++) await new Promise(resolve => setImmediate(resolve));
};

describe('rt-edge AppModule (skeleton)', () => {
    let moduleRef: TestingModule;
    /** Every config of this suite lives in its own temp directory, removed after the test (nothing is shared between tests or runs). */
    let dirs: string[] = [];

    function tempDir(): string {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-edge-app-'));
        dirs.push(dir);
        return dir;
    }

    function devConfig(extra: Record<string, unknown> = {}): BoxConfig {
        return parseBoxConfig(
            {
                mode: 'dev',
                box: { name: 'Court 3', label: 'VB-014', timeZone: 'Europe/London' },
                // `.invalid` never resolves (RFC 2606): no module can reach a cloud from this spec.
                cloud: { origin: 'https://cloud.invalid' },
                http: { host: '127.0.0.1', port: 0, tls: null },
                transmitter: { bindAddress: '192.168.20.2', networkCidr: '192.168.20.0/24' },
                paths: { dataDir: './data' },
                shutdownTimeoutMs: 100,
                ...extra,
            },
            path.join(tempDir(), 'rt-edge.json'),
        );
    }

    function compile(
        mode: EdgeRunMode,
        config: BoxConfig,
        configure: (builder: TestingModuleBuilder) => void = () => undefined,
        startStepBudgetMs?: number,
    ): Promise<TestingModule> {
        const builder = Test.createTestingModule({ imports: [AppModule.register({ config, mode, clock: () => NOW, startStepBudgetMs })] });
        configure(builder);
        return builder.setLogger(silentLogger).compile();
    }

    /** The real AppModule graph with EVERY port replaced by its skeleton stub (whatever the modules provide today). */
    const withStubs = (builder: TestingModuleBuilder): void => {
        for (const [token, stub] of STUBS) builder.overrideProvider(token).useClass(stub);
    };

    afterEach(async () => {
        await moduleRef?.close().catch(() => undefined);
        moduleRef = undefined as unknown as TestingModule;
        for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
        dirs = [];
    });

    it('refuses a start budget that is not a positive integer', () => {
        expect(() => AppModule.register({ config: devConfig(), mode: 'serve', startStepBudgetMs: 0 })).toThrow(RangeError);
        expect(() => AppModule.register({ config: devConfig(), mode: 'serve', startStepBudgetMs: 1.5 })).toThrow(RangeError);
    });

    describe('the module graph as the modules provide it today (stub or real implementation)', () => {
        it.each(['serve', 'cli'] as const)("compiles in '%s' mode, resolves the core and every port, starts nothing, and closes", async mode => {
            const config = devConfig();
            moduleRef = await compile(mode, config);

            expect(moduleRef.get(BOX_CONFIG)).toBe(config);
            expect(moduleRef.get(EDGE_RUN_MODE)).toBe(mode);
            expect(moduleRef.get<() => number>(EDGE_CLOCK)()).toBe(NOW);
            expect(moduleRef.get(EDGE_EVENT_BUS)).toBeInstanceOf(InMemoryEdgeEventBus);
            expect(moduleRef.get(EDGE_BOOT_STATUS)).toBeInstanceOf(EdgeBootRecorder);
            expect(moduleRef.get(EdgeLifecycle)).toBeInstanceOf(EdgeLifecycle);

            // No class is asserted: each module swaps its stub for the implementation and keeps the token.
            for (const [token] of STUBS) {
                const port = moduleRef.get<object>(token);
                expect(port).toBeDefined();
                expect(typeof port).toBe('object');
                expect(moduleRef.get(token, { strict: false })).toBe(port); // one instance for the whole app
            }
            for (const token of LIFECYCLE_PORT_TOKENS) {
                const port = moduleRef.get<{ close?: unknown }>(token);
                expect(typeof port.close).toBe('function'); // what the shutdown calls
            }

            // Compiled, not initialised: nothing was started (EdgeLifecycle starts the kernel in the bootstrap hook).
            const boot = moduleRef.get<EdgeBootStatus>(EDGE_BOOT_STATUS);
            expect(boot.phase()).toBe('booting');
            expect(boot.lanListener().state).toBe('not-started');

            // The shutdown runs to the end (the state closes last, so the temp directory can be removed).
            await moduleRef.close();
            moduleRef = undefined as unknown as TestingModule;
            expect(boot.phase()).toBe('stopped');
        });
    });

    describe('with every port wired to its skeleton stub', () => {
        it('compiles and resolves the core tokens and every port to its stub', async () => {
            const config = devConfig();
            moduleRef = await compile('serve', config, withStubs);

            expect(moduleRef.get(BOX_CONFIG)).toBe(config);
            expect(moduleRef.get(EDGE_RUN_MODE)).toBe('serve');
            expect(moduleRef.get<() => number>(EDGE_CLOCK)()).toBe(NOW);
            expect(moduleRef.get(EDGE_EVENT_BUS)).toBeInstanceOf(InMemoryEdgeEventBus);
            expect(moduleRef.get(EDGE_BOOT_STATUS)).toBeInstanceOf(EdgeBootRecorder);
            expect(moduleRef.get<EdgeBootStatus>(EDGE_BOOT_STATUS).phase()).toBe('booting');

            for (const [token, stub] of STUBS) expect(moduleRef.get(token)).toBeInstanceOf(stub);
            expect(moduleRef.get(EdgeLifecycle)).toBeInstanceOf(EdgeLifecycle);
        });

        it('opens no state database (the state stub keeps nothing between tests or runs)', async () => {
            const config = devConfig();
            moduleRef = await compile('serve', config, withStubs);
            expect(moduleRef.get<StatePort>(STATE_PORT).health()).toEqual({ ok: false, file: config.paths.stateDb, sizeBytes: 0, walBytes: 0, schemaVersion: 0 });
            await moduleRef.close();
            moduleRef = undefined as unknown as TestingModule;
            expect(fs.existsSync(config.paths.stateDb)).toBe(false);
        });

        it('provides one instance of each port and one bus for the whole app', async () => {
            moduleRef = await compile('serve', devConfig(), withStubs);
            expect(moduleRef.get(STATE_PORT)).toBe(moduleRef.get(STATE_PORT, { strict: false }));
            const bus = moduleRef.get<EdgeEventBus>(EDGE_EVENT_BUS);
            const seen: string[] = [];
            bus.subscribe('session-status', e => seen.push(e.nSesid));
            moduleRef.get<EdgeEventBus>(EDGE_EVENT_BUS, { strict: false }).publish('session-status', { nSesid: 's1', cause: 'line', atMs: NOW });
            expect(seen).toEqual(['s1']);
        });

        it('stub reads return empty data', async () => {
            moduleRef = await compile('serve', devConfig(), withStubs);
            const state = moduleRef.get<StatePort>(STATE_PORT);
            const kernel = moduleRef.get<KernelPort>(KERNEL_PORT);
            const uplink = moduleRef.get<UplinkPort>(UPLINK_PORT);
            const auth = moduleRef.get<AuthPort>(AUTH_PORT);
            const access = moduleRef.get<AccessPort>(ACCESS_PORT);
            const ops = moduleRef.get<OpsPort>(OPS_PORT);
            const lan = moduleRef.get<LanPort>(LAN_PORT);

            expect(state.sessions.list()).toEqual([]);
            expect(state.sessions.get('s1')).toBeNull();
            expect(state.assignments.syncedAtMs()).toBeNull();
            expect(state.identity.get()).toBeNull();
            expect(state.transmitter.get()).toEqual({ settings: null, applied: null });
            expect(state.transmitter.version()).toBe(0);
            expect(state.counters.get('lan-seq')).toBe(0);
            expect(state.revocations.userRevokedAtMs('u1')).toBeNull();
            expect(state.connectivityLog.page({}, '2026-10-01')).toEqual({ filter: 'all', day: '2026-10-01', rows: [], nextBefore: null, newest: null, days: [] });
            expect(state.transaction(() => 42)).toBe(42);
            expect(state.health().ok).toBe(false);
            await expect(state.checkpoints.latest('s1')).resolves.toBeNull();

            expect(kernel.sessions()).toEqual([]);
            expect(kernel.currentCut('s1')).toBeNull();
            expect(kernel.pages('s1')).toEqual([]);
            expect(kernel.endResult('s1')).toBeNull();
            const unsubscribe = kernel.onCut(() => undefined);
            expect(() => unsubscribe()).not.toThrow();
            const tx = kernel.transmitterState();
            expect(tx.settings).toBeNull();
            expect(tx.stateVersion).toBe(0);
            expect(tx.link.mode).toBe('listen');
            expect(tx.listen).toEqual({ boxTransmitterAddress: '192.168.20.2', port: 2500 });
            expect(tx.actions).toEqual({ connect: false, testOnly: false, reconnect: false });

            expect(uplink.status()).toEqual({ online: false, lagSec: 0, pendingPages: 0, lastSyncAt: null, lastCheckedAt: NOW, stale: false });
            expect(uplink.cloudLink().state).toBe('not-linked');
            expect(uplink.internet()).toEqual({ state: 'unknown', sinceMs: null });
            expect(uplink.sessions()).toEqual([]);
            // Plain HTTP (dev): no certificate by design.
            expect(uplink.certificate()).toEqual({ state: 'not-configured', problem: null, info: null, daysLeft: null, coversHost: null, checkedAtMs: NOW });
            expect(moduleRef.get<EdgeBootStatus>(EDGE_BOOT_STATUS).lanListener().state).toBe('not-started');

            expect(auth.canOpenSession(principal('online'), 's1')).toBe(false);
            expect(auth.rooms(principal('online'))).toEqual([]);
            expect(access.listRoomCodes(principal('online'), null)).toEqual({ rows: [], unusedCount: 0 });
            expect(access.roomCodePicker(principal('operator')).operatorNameRequired).toBe(true);
            expect(access.operatorCodeStatus(principal('online'), NOW)).toEqual({
                day: '2026-10-01',
                issued: false,
                issuedAtMs: null,
                mintedBy: null,
                validUntilMs: null,
                usesToday: 0,
            });

            expect(ops.statusSnapshot(principal('online'))).toEqual({
                nowMs: NOW,
                heartbeatMs: 5000,
                staleAfterMs: 15000,
                internet: { state: 'unknown', sinceMs: null },
                sessions: [],
            });
            expect(ops.connectivityLog({ filter: 'problems' })).toMatchObject({ filter: 'problems', day: '2026-10-01', rows: [] });
            expect(ops.sessionStatus('s1', { includeOperator: true })).toBeNull();
            expect(lan.viewerCount()).toBe(0);
        });

        it('the uplink stub inspects the configured certificate files (missing on a box before its first certificate)', async () => {
            const certDir = path.join(tempDir(), 'no-such-dir');
            const certFile = path.join(certDir, 'fullchain.pem');
            moduleRef = await compile('serve', devConfig({ http: { host: '127.0.0.1', port: 0, tls: { certFile, keyFile: path.join(certDir, 'privkey.pem') } } }), withStubs);
            const status = moduleRef.get<UplinkPort>(UPLINK_PORT).certificate();
            expect(status).toMatchObject({ state: 'missing', problem: { reason: 'missing', file: certFile, message: 'ENOENT' }, daysLeft: null, checkedAtMs: NOW });
        });

        it('stub actions throw NotImplementedPortError (500 server_error)', async () => {
            moduleRef = await compile('serve', devConfig(), withStubs);
            const state = moduleRef.get<StatePort>(STATE_PORT);
            const kernel = moduleRef.get<KernelPort>(KERNEL_PORT);
            const uplink = moduleRef.get<UplinkPort>(UPLINK_PORT);
            const auth = moduleRef.get<AuthPort>(AUTH_PORT);
            const access = moduleRef.get<AccessPort>(ACCESS_PORT);
            const ops = moduleRef.get<OpsPort>(OPS_PORT);
            const cli = moduleRef.get<CliPort>(CLI_PORT);
            const actor = { nUserid: 'u1', name: 'P. Shah', via: 'online' as const, operatorName: null };
            const ctx = { ip: null, userAgent: null, deviceCookie: null };

            await expectNotImplemented(() => state.transmitter.bumpVersion());
            await expectNotImplemented(() => state.counters.raise('lan-seq', 5));
            await expectNotImplemented(() => state.revocations.revokeUser('u1', NOW));
            await expectNotImplemented(() => state.identity.secret('room-code-hmac'));
            await expectNotImplemented(() => state.checkpoints.save({ nSesid: 's1', rawSeq: 1, rawHash: 'h', parserVer: 'fp', createdAt: NOW, lane: null }));
            await expectNotImplemented(() => kernel.arm('s1'));
            await expectNotImplemented(() => kernel.requestEnd('s1', 'cloud'));
            await expectNotImplemented(() => kernel.applyTransmitter({ stateVersion: 0, settings: { mode: 'listen', protocol: null, host: null, port: null, autoReconnect: true, receivingSesid: null }, confirmInterrupt: false }, actor));
            await expectNotImplemented(() => kernel.testTransmitter({ protocol: 'bridge', host: '192.168.20.31', port: 8080 }, actor));
            await expectNotImplemented(() => uplink.syncNow());
            await expectNotImplemented(() => uplink.enrol({ code: 'abc' }));
            await expectNotImplemented(() => uplink.ensureCertificate());
            await expectNotImplemented(() => auth.authenticate('token', ctx));
            await expectNotImplemented(() => auth.requireBoxAdmin(principal('online')));
            await expectNotImplemented(() => access.redeemRoomCode({ code: 'K7Q4M2' }, ctx));
            await expectNotImplemented(() => access.issueRoomCodes(principal('online'), { nSesid: 's1', userIds: ['u2'] }, ctx));
            await expectNotImplemented(() => ops.readiness());
            await expectNotImplemented(() => ops.verdict());
            await expectNotImplemented(() => ops.nextSeq('s1'));
            await expectNotImplemented(() => cli.run({ name: 'status', json: false }, { log: () => undefined, error: () => undefined }));
        });
    });

    describe('bareBox (spec helper)', () => {
        it('keeps the core, the lifecycle and its budget of the registered box, and nothing of the feature modules', async () => {
            const config = devConfig();
            const box = bareBox(AppModule.register({ config, mode: 'cli', clock: () => NOW }), lifecyclePorts());
            moduleRef = await Test.createTestingModule({ imports: [box] }).setLogger(silentLogger).compile();
            expect(moduleRef.get(BOX_CONFIG, { strict: false })).toBe(config);
            expect(moduleRef.get(EDGE_RUN_MODE, { strict: false })).toBe('cli');
            expect(moduleRef.get(EdgeLifecycle)).toBeInstanceOf(EdgeLifecycle);
            for (const token of [AUTH_PORT, ACCESS_PORT, CLI_PORT]) expect(() => moduleRef.get(token, { strict: false })).toThrow();
        });

        it('refuses a module that is not an AppModule.register result', () => {
            expect(() => bareBox({ module: AppModule }, [])).toThrow('bareBox: expected an AppModule.register(...) result');
        });
    });

    describe('EdgeLifecycle', () => {
        type Fake = { start: jest.Mock; close: jest.Mock };
        type Fakes = Record<'state' | 'kernel' | 'uplink' | 'ops' | 'lan', Fake>;
        let calls: string[];
        let alerts: EdgeAlert[];

        const fake = (name: string, close?: () => Promise<void>): Fake => ({
            start: jest.fn(async () => {
                calls.push(`${name}.start`);
            }),
            close: jest.fn(async () => {
                calls.push(`${name}.close`);
                if (close) await close();
            }),
        });
        const allFakes = (): Fakes => ({ state: fake('state'), kernel: fake('kernel'), uplink: fake('uplink'), ops: fake('ops'), lan: fake('lan') });

        /** The lifecycle with its five ports faked, on the bare box: no feature module is built at all. */
        const withFakes = async (mode: EdgeRunMode, fakes: Fakes, budgetMs = 1000): Promise<TestingModule> => {
            const box = AppModule.register({ config: devConfig({ shutdownTimeoutMs: 50 }), mode, clock: () => NOW, startStepBudgetMs: budgetMs });
            const ports = lifecyclePorts({
                [STATE_PORT]: fakes.state,
                [KERNEL_PORT]: fakes.kernel,
                [UPLINK_PORT]: fakes.uplink,
                [OPS_PORT]: fakes.ops,
                [LAN_PORT]: fakes.lan,
            });
            const ref = await Test.createTestingModule({ imports: [bareBox(box, ports)] })
                .setLogger(silentLogger)
                .compile();
            ref.get<EdgeEventBus>(EDGE_EVENT_BUS, { strict: false }).subscribe('alert', a => alerts.push(a));
            return ref;
        };
        const lifecycle = (): EdgeLifecycle => moduleRef.get(EdgeLifecycle);
        const boot = (): EdgeBootStatus => moduleRef.get<EdgeBootStatus>(EDGE_BOOT_STATUS, { strict: false });

        beforeEach(() => {
            calls = [];
            alerts = [];
        });

        it("starts only the kernel at bootstrap, then uplink → ops → lan in startServices, and closes lan → ops → uplink → kernel → state", async () => {
            const fakes = allFakes();
            moduleRef = await withFakes('serve', fakes);
            await moduleRef.init();
            expect(calls).toEqual(['kernel.start']);
            expect(boot().phase()).toBe('recording');
            expect(boot().phaseSinceMs()).toBe(NOW);

            await Promise.all([lifecycle().startServices(), lifecycle().startServices()]);
            await lifecycle().startServices();
            expect(calls).toEqual(['kernel.start', 'uplink.start', 'ops.start', 'lan.start']);
            expect(boot().phase()).toBe('started');
            expect(boot().startFailures()).toEqual([]);
            expect(fakes.state.start).not.toHaveBeenCalled();
            expect(alerts).toEqual([]);

            calls = [];
            await moduleRef.close();
            moduleRef = undefined as unknown as TestingModule;
            expect(calls).toEqual(['lan.close', 'ops.close', 'uplink.close', 'kernel.close', 'state.close']);
        });

        it("starts nothing in 'cli' mode (startServices is a no-op) but still closes everything", async () => {
            const fakes = allFakes();
            moduleRef = await withFakes('cli', fakes);
            await moduleRef.init();
            await lifecycle().startServices();
            expect(calls).toEqual([]);
            expect(boot().phase()).toBe('booting');
            const recorder = boot();
            await moduleRef.close();
            moduleRef = undefined as unknown as TestingModule;
            expect(calls).toEqual(['lan.close', 'ops.close', 'uplink.close', 'kernel.close', 'state.close']);
            expect(recorder.phase()).toBe('stopped');
        });

        it('does not start the services before the kernel started', async () => {
            const fakes = allFakes();
            moduleRef = await withFakes('serve', fakes);
            await lifecycle().startServices(); // no init yet
            expect(calls).toEqual([]);
        });

        it('a rejected uplink start is not fatal: the kernel keeps running, ops and lan start, an alert is raised', async () => {
            const fakes = allFakes();
            fakes.uplink.start.mockImplementation(async () => {
                calls.push('uplink.start');
                throw new Error('device key unreadable');
            });
            moduleRef = await withFakes('serve', fakes);
            await moduleRef.init();
            await expect(lifecycle().startServices()).resolves.toBeUndefined();

            expect(calls).toEqual(['kernel.start', 'uplink.start', 'ops.start', 'lan.start']);
            expect(fakes.kernel.close).not.toHaveBeenCalled();
            expect(boot().phase()).toBe('started');
            expect(boot().startFailures()).toEqual([{ step: 'uplink', reason: 'rejected', message: 'device key unreadable', atMs: NOW }]);
            expect(boot().stepFailed('uplink')).toBe(true);
            expect(boot().stepFailed('ops')).toBe(false);
            expect(alerts).toEqual([
                {
                    source: 'uplink',
                    tier: 'P1',
                    critical: false,
                    kind: 'START_FAILED',
                    message: 'uplink failed to start (rejected): device key unreadable; the box keeps recording',
                    atMs: NOW,
                    nSesid: null,
                    data: { step: 'uplink', reason: 'rejected' },
                },
            ]);
        });

        it('isolates a synchronous throw in ops.start and a rejected lan.start the same way', async () => {
            const fakes = allFakes();
            fakes.ops.start = jest.fn(() => {
                calls.push('ops.start');
                throw new Error('sync boom');
            });
            fakes.lan.start.mockImplementation(async () => {
                calls.push('lan.start');
                throw 'not an Error';
            });
            moduleRef = await withFakes('serve', fakes);
            await moduleRef.init();
            await lifecycle().startServices();
            expect(calls).toEqual(['kernel.start', 'uplink.start', 'ops.start', 'lan.start']);
            expect(boot().startFailures().map(f => [f.step, f.reason, f.message])).toEqual([
                ['ops', 'rejected', 'sync boom'],
                ['lan', 'rejected', 'not an Error'],
            ]);
            expect(alerts.map(a => a.source)).toEqual(['ops', 'lan']);
        });

        it('moves on after the budget when a start hangs, and records how it ends later', async () => {
            const fakes = allFakes();
            let releaseUplink!: () => void;
            fakes.uplink.start.mockImplementation(() => {
                calls.push('uplink.start');
                return new Promise<void>(resolve => (releaseUplink = resolve));
            });
            let failOps!: (err: Error) => void;
            fakes.ops.start.mockImplementation(() => {
                calls.push('ops.start');
                return new Promise<void>((_resolve, reject) => (failOps = reject));
            });
            moduleRef = await withFakes('serve', fakes, 30);
            await moduleRef.init();
            const started = Date.now();
            await lifecycle().startServices();
            expect(Date.now() - started).toBeLessThan(2_000);
            expect(calls).toEqual(['kernel.start', 'uplink.start', 'ops.start', 'lan.start']);
            expect(boot().startFailures().map(f => [f.step, f.reason])).toEqual([
                ['uplink', 'timeout'],
                ['ops', 'timeout'],
            ]);
            expect(boot().stepFailed('uplink')).toBe(true);

            releaseUplink();
            failOps(new Error('late failure'));
            await flush();
            expect(boot().stepFailed('uplink')).toBe(false); // it started late
            expect(boot().stepFailed('ops')).toBe(true);
            expect(boot().startFailures().map(f => [f.step, f.reason])).toEqual([
                ['uplink', 'timeout'],
                ['ops', 'timeout'],
                ['ops', 'rejected'],
            ]);
            expect(alerts.map(a => a.message)).toEqual([
                'uplink failed to start (timeout): uplink.start() did not resolve within 30 ms; the box keeps recording',
                'ops failed to start (timeout): ops.start() did not resolve within 30 ms; the box keeps recording',
                'ops failed to start (rejected): late failure; the box keeps recording',
            ]);
        });

        it('a shutdown during startServices lets the current step finish and starts nothing more', async () => {
            const fakes = allFakes();
            let releaseUplink!: () => void;
            fakes.uplink.start.mockImplementation(() => {
                calls.push('uplink.start');
                return new Promise<void>(resolve => (releaseUplink = resolve));
            });
            moduleRef = await withFakes('serve', fakes, 5_000);
            await moduleRef.init();
            const services = lifecycle().startServices();
            await flush();
            const shutdown = lifecycle().beforeApplicationShutdown('SIGTERM');
            await flush();
            expect(fakes.lan.close).not.toHaveBeenCalled(); // waiting for the uplink step
            releaseUplink();
            await Promise.all([services, shutdown]);
            expect(calls).toEqual(['kernel.start', 'uplink.start', 'lan.close', 'ops.close', 'uplink.close', 'kernel.close', 'state.close']);
            expect(fakes.ops.start).not.toHaveBeenCalled();
            expect(boot().phase()).toBe('stopped');
            await lifecycle().startServices();
            expect(fakes.ops.start).not.toHaveBeenCalled();
        });

        it('keeps shutting down after a step fails or hangs past shutdownTimeoutMs', async () => {
            const fakes = {
                state: fake('state'),
                kernel: fake('kernel'),
                uplink: fake('uplink', () => new Promise<void>(() => undefined)), // never resolves
                ops: fake('ops', async () => {
                    throw new Error('boom');
                }),
                lan: fake('lan'),
            };
            moduleRef = await withFakes('serve', fakes);
            await moduleRef.init();
            await lifecycle().startServices();
            calls = [];
            const started = Date.now();
            await moduleRef.close();
            moduleRef = undefined as unknown as TestingModule;
            expect(calls).toEqual(['lan.close', 'ops.close', 'uplink.close', 'kernel.close', 'state.close']);
            expect(Date.now() - started).toBeLessThan(2_000);
        });

        it('a synchronous throw in close is isolated too', async () => {
            const fakes = allFakes();
            fakes.lan.close = jest.fn(() => {
                calls.push('lan.close');
                throw new Error('sync boom');
            });
            moduleRef = await withFakes('serve', fakes);
            await moduleRef.init();
            calls = [];
            await moduleRef.close();
            moduleRef = undefined as unknown as TestingModule;
            expect(calls).toEqual(['lan.close', 'ops.close', 'uplink.close', 'kernel.close', 'state.close']);
        });

        it('shuts down once even when asked twice', async () => {
            const fakes = allFakes();
            moduleRef = await withFakes('serve', fakes);
            await moduleRef.init();
            await Promise.all([lifecycle().beforeApplicationShutdown('SIGTERM'), lifecycle().beforeApplicationShutdown('SIGINT')]);
            await moduleRef.close();
            moduleRef = undefined as unknown as TestingModule;
            expect(fakes.kernel.close).toHaveBeenCalledTimes(1);
            expect(fakes.state.close).toHaveBeenCalledTimes(1);
        });

        it('a failed kernel start fails the boot: nothing else starts, everything closes once', async () => {
            const fakes = allFakes();
            fakes.kernel.start.mockImplementation(async () => {
                calls.push('kernel.start');
                throw new Error('recording cannot start');
            });
            moduleRef = await withFakes('serve', fakes);
            const recorder = boot();
            await expect(moduleRef.init()).rejects.toThrow('recording cannot start');
            expect(calls).toEqual(['kernel.start', 'lan.close', 'ops.close', 'uplink.close', 'kernel.close', 'state.close']);
            expect(recorder.phase()).toBe('failed');
            await lifecycle().startServices();
            expect(fakes.uplink.start).not.toHaveBeenCalled();
            expect(fakes.ops.start).not.toHaveBeenCalled();
            expect(fakes.lan.start).not.toHaveBeenCalled();
            // Nest's close() re-throws the failed init of a context; the lifecycle already closed everything once.
            await expect(moduleRef.close()).rejects.toThrow('recording cannot start');
            moduleRef = undefined as unknown as TestingModule;
            expect(fakes.state.close).toHaveBeenCalledTimes(1);
            expect(recorder.phase()).toBe('failed');
        });
    });
});
