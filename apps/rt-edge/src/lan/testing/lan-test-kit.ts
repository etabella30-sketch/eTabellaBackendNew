/**
 * SPEC SUPPORT (never imported by the app): the LAN surface (controllers, static files, gateway, exception filter) and
 * the real auth module, wired in a Nest app over fake kernel / uplink / ops ports and the in-memory state of
 * auth/testing, listening on 127.0.0.1:0. Nothing here opens a CAT socket, a database or a cloud connection.
 */
import * as fs from 'fs';
import type { AddressInfo } from 'net';
import * as os from 'os';
import * as path from 'path';

import { INestApplication, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as cookieParser from 'cookie-parser';
import type { Cut, CutterView } from '@app/edge-sync';

import { EDGE_API_PLATFORM_PROVIDERS } from '../../api/adapters/edge-api-platform.module';
import { configureLocalApiMiddleware, LOCAL_API_IMPORTS } from '../../api/api.module';
import { EdgeCoreModule } from '../../app.module';
import { AUTH_PROVIDERS } from '../../auth/auth.module';
import { FakeState } from '../../auth/testing/fake-state';
import { boxConfig, CODES_ON, NOW } from '../../auth/testing/edge-world';
import type {
    EdgeInternetStatus,
    EdgeOperatorStatus,
    EdgeSessionStatus,
    EdgeStatusSnapshot,
    ReporterCardRequest,
    TransmitterApplyRequest,
    TransmitterStateResponse,
    TransmitterTestRequest,
} from '../../contracts';
import {
    AUTH_PORT,
    AuthPort,
    BoxConfig,
    CutListener,
    EDGE_EVENT_BUS,
    EdgeEventBus,
    EdgePrincipal,
    KERNEL_PORT,
    KernelPort,
    KernelSessionView,
    LAN_PORT,
    LanPort,
    OPS_PORT,
    OpsPort,
    Reply,
    STATE_PORT,
    UPLINK_PORT,
    UplinkPort,
} from '../../ports';
import { TransmitterControl } from '../../ops/transmitter';
import { configureLanMiddleware, LAN_CONTROLLERS, LAN_PROVIDERS } from '../lan.module';
import { RT_DATA_OPTIONS, rtDataOptions, RtDataOptions } from '../rt-data/rt-data.options';

export const silentLogger = { log: () => undefined, error: () => undefined, warn: () => undefined, debug: () => undefined, verbose: () => undefined };

/** Every call a fake port received, in order (`'method:arg'`). */
export type CallLog = string[];

export class FakeKernel {
    readonly calls: CallLog = [];
    readonly views = new Map<string, Partial<KernelSessionView>>();
    readonly cuts = new Map<string, Cut>();
    readonly listeners = new Set<CutListener>();
    /** Sessions held but not readable yet (journal replay after a restart, RECOVER): `view()` is null for them. */
    readonly recovering = new Set<string>();
    transmitter: Reply<TransmitterStateResponse> = {
        stateVersion: 3,
        settings: null,
        applied: null,
        link: { state: 'waiting', mode: 'listen', protocol: null, sinceMs: null, attempt: null, quietLevel: null, peer: null, bytesIn: 0, lastLineAtMs: null, receivingSesid: null, heldPeers: 0, lockout: false },
        sessions: [],
        listen: { boxTransmitterAddress: '192.168.20.2', port: 2500 },
        actions: { connect: false, testOnly: true, reconnect: false },
    };
    failWith: Error | null = null;

    session(nSesid: string): KernelSessionView | null {
        return (this.views.get(nSesid) as KernelSessionView) ?? null;
    }
    sessions(): KernelSessionView[] {
        return [...this.views.values()] as KernelSessionView[];
    }
    onCut(listener: CutListener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    /** Commit a cut: remembered as current and handed to every listener (as the kernel lane does). */
    commit(cut: Cut): void {
        this.cuts.set(cut.nSesid, cut);
        for (const l of this.listeners) l(cut);
    }
    currentCut(nSesid: string): Cut | null {
        return this.recovering.has(nSesid) ? null : (this.cuts.get(nSesid) ?? null);
    }
    /** The committed view: null for a session not held or still recovering; an armed session with no cut reads as empty. */
    view(nSesid: string): CutterView | null {
        if (!this.views.has(nSesid) || this.recovering.has(nSesid)) return null;
        const cut = this.cuts.get(nSesid);
        return { nSesid, rev: cut?.rev ?? 0, totalLines: cut?.totalLines ?? 0, root: cut?.root ?? '', digests: [], dirtyPages: [] } as unknown as CutterView;
    }
    pages(nSesid: string) {
        return this.currentCut(nSesid)?.allPages ?? [];
    }
    transmitterState(): Reply<TransmitterStateResponse> {
        this.calls.push('transmitterState');
        return this.transmitter;
    }
    private async write(name: string, arg: unknown): Promise<Reply<TransmitterStateResponse>> {
        this.calls.push(`${name}:${JSON.stringify(arg)}`);
        if (this.failWith) throw this.failWith;
        return this.transmitter;
    }
    applyTransmitter(req: TransmitterApplyRequest, actor: unknown) {
        return this.write('applyTransmitter', { req, actor });
    }
    connectTransmitter(stateVersion: number, actor: unknown) {
        return this.write('connectTransmitter', { stateVersion, actor });
    }
    reconnectTransmitter(stateVersion: number, actor: unknown) {
        return this.write('reconnectTransmitter', { stateVersion, actor });
    }
    async testTransmitter(req: TransmitterTestRequest, actor: unknown) {
        this.calls.push(`testTransmitter:${JSON.stringify({ req, actor })}`);
        if (this.failWith) throw this.failWith;
        return { result: 'refused' as const, protocolSeen: null, bytes: 0, durationMs: 12 };
    }
}

export class FakeUplink {
    internetStatus: EdgeInternetStatus = { state: 'up', sinceMs: NOW - 3_600_000 };
    online = true;
    relayed: EdgePrincipal[] = [];
    relayReply: () => Promise<unknown> = async () => {
        throw new Error('relay not set up in this spec');
    };
    relayOperatorCode(principal: EdgePrincipal): Promise<unknown> {
        this.relayed.push(principal);
        return this.relayReply();
    }
    internet(): EdgeInternetStatus {
        return this.internetStatus;
    }
    status() {
        return { online: this.online, lagSec: 0, pendingPages: 0, lastSyncAt: null, lastCheckedAt: NOW, stale: false };
    }
    etabellaReachable(): boolean {
        return this.online;
    }
}

export const OPERATOR_STATUS: EdgeOperatorStatus = {
    checkedAtMs: NOW,
    stale: false,
    transmitter: { state: 'live', mode: 'listen', protocol: 'bridge', sinceMs: NOW - 60_000, attempt: null, quietLevel: null, peer: '192.168.20.31:51022', bytesIn: 1024, lastLineAtMs: NOW, receivingSesid: null, heldPeers: 0, lockout: false },
    cloud: { state: 'synced', sinceMs: NOW - 60_000, lagSec: 0, lagLines: 0, pendingPages: 0, lastSyncedAtMs: NOW },
    problems: 0,
    readinessToDo: 0,
    listen: { address: '192.168.20.2', port: 2500 },
};

export class FakeOps {
    readonly calls: CallLog = [];
    seq = 1_000;
    failSeq = false;
    known: (nSesid: string) => boolean = () => true;

    nextSeq(_nSesid: string): number {
        if (this.failSeq) throw new Error('ops not started');
        return ++this.seq;
    }
    sessionStatus(nSesid: string, opts: { includeOperator: boolean; seq?: number }): EdgeSessionStatus | null {
        if (!this.known(nSesid)) return null;
        return {
            nSesid,
            seq: opts.seq ?? this.seq,
            atMs: NOW,
            venue: 'online',
            lagLines: 0,
            lagSec: 0,
            since: NOW - 60_000,
            lastSyncAt: NOW,
            catConnected: true,
            tz: 'Europe/London',
            room: { chip: 'live', feed: 'live', marking: 'available', startAtMs: null, firstLineAtMs: NOW - 60_000, lastLineAtMs: NOW, feedStoppedAtMs: null, internetDownSinceMs: null, endedAtMs: null },
            continuedAs: null,
            ...(opts.includeOperator ? { operator: OPERATOR_STATUS } : {}),
        };
    }
    statusSnapshot(principal: EdgePrincipal): Reply<EdgeStatusSnapshot> {
        this.calls.push(`statusSnapshot:${principal.kind}`);
        return { nowMs: NOW, heartbeatMs: 5000, staleAfterMs: 15000, internet: { state: 'up', sinceMs: null }, sessions: [], ...(principal.isBoxAdmin ? { operator: OPERATOR_STATUS } : {}) };
    }
    readiness() {
        this.calls.push('readiness');
        return { day: '2026-10-01', checkedAtMs: null, running: false, landing: true, firstLiveAtMs: null, items: [], needAttention: 0, total: 8 };
    }
    async runReadiness(principal: EdgePrincipal) {
        this.calls.push(`runReadiness:${principal.kind}`);
        return this.readiness();
    }
    verdict() {
        this.calls.push('verdict');
        return { checkedAtMs: NOW, running: false, overall: 'ok', problems: [], recoveries: [], logFilterDefault: 'all' };
    }
    dismissRecovery(_principal: EdgePrincipal, id: string): void {
        this.calls.push(`dismissRecovery:${id}`);
    }
    connectivityLog(query: unknown) {
        this.calls.push(`connectivityLog:${JSON.stringify(query)}`);
        return { filter: 'all', day: '2026-10-01', rows: [], nextBefore: null, newest: null, days: [] };
    }
    connectivityLogTries(rowId: string, before: string | null, limit: number | null) {
        this.calls.push(`connectivityLogTries:${JSON.stringify([rowId, before, limit])}`);
        return { rowId, rows: [], nextBefore: null };
    }
    clearConnectivityLog(principal: EdgePrincipal) {
        this.calls.push(`clearConnectivityLog:${principal.kind}:${principal.isSuperAdmin}`);
        const actor = { nUserid: principal.userId, name: principal.name, via: principal.kind, operatorName: null };
        return { removed: 4, row: { id: '42', atMs: NOW, updatedAtMs: NOW, event: 'success', source: 'box', code: 'log-cleared', problem: false, nSesid: null, sessionName: null, peer: null, actor, data: {}, retry: null } };
    }
    network() {
        this.calls.push('network');
        return { running: false, checkedAtMs: null, checks: [] };
    }
    async runNetwork(principal: EdgePrincipal) {
        this.calls.push(`runNetwork:${principal.kind}`);
        return this.network();
    }
    boxDetails() {
        this.calls.push('boxDetails');
        return { nEdgeid: 'e', boxName: 'Court 3', boxLabel: 'VB-014', version: '1.0.0', parserVer: 'fp', backendCommit: null, feCommit: null, nowMs: NOW, timeZone: 'Europe/London', uptimeSec: 1, clockOffsetMs: null, clockSynced: true, diskFreeMB: 1, diskTotalMB: 2, journalMB: 0, certDaysLeft: null, upsOnBattery: null, cloudRootShort: null };
    }
    async diagnostics(principal: EdgePrincipal) {
        this.calls.push(`diagnostics:${principal.kind}`);
        return { fileName: 'etabella-box-VB-014-20261001-1030.zip', contentType: 'application/zip' as const, body: Buffer.from('PK\u0003\u0004zip-bytes') };
    }
    reporterCard(principal: EdgePrincipal, req: ReporterCardRequest) {
        this.calls.push(`reporterCard:${req.nSesid}`);
        return { nSesid: req.nSesid, sessionName: 'Day 3 — Morning', caseName: 'Harlow v Mercer Logistics', serverAddress: '192.168.20.2', port: 2500, username: 'court3-day3', password: null, passwordSource: 'rt-production' as const, mode: 'listen' as const, openedAtMs: NOW };
    }
    metrics(): string {
        this.calls.push('metrics');
        return '# TYPE rt_edge_lan_viewers gauge\nrt_edge_lan_viewers 0\n';
    }
    operatorStatus() {
        return OPERATOR_STATUS;
    }
    async start(): Promise<void> {
        /* nothing to start */
    }
    async close(): Promise<void> {
        /* nothing to close */
    }
}

/** A temp FE `edge` dist: index.html, a content-hashed bundle, an unhashed font, a dot-file, and a file OUTSIDE it. */
export function makePublicDir(): { root: string; publicDir: string; mainJs: string; cleanup: () => void } {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-edge-lan-'));
    const publicDir = path.join(root, 'public');
    fs.mkdirSync(path.join(publicDir, 'assets', 'fonts'), { recursive: true });
    fs.mkdirSync(path.join(publicDir, 'media'), { recursive: true });
    fs.writeFileSync(path.join(publicDir, 'index.html'), '<!doctype html><html><head><title>eTabella</title></head><body><app-root></app-root></body></html>');
    const mainJs = `console.log(${JSON.stringify('x'.repeat(4000))});\n`;
    fs.writeFileSync(path.join(publicDir, 'main-ABCD1234.js'), mainJs);
    fs.writeFileSync(path.join(publicDir, 'styles-ZZZZ9999.css'), 'body{margin:0}');
    fs.writeFileSync(path.join(publicDir, 'assets', 'fonts', 'inter.woff2'), Buffer.from([0x77, 0x4f, 0x46, 0x32, 1, 2, 3]));
    fs.writeFileSync(path.join(publicDir, 'favicon.ico'), Buffer.from([0, 0, 1, 0]));
    fs.writeFileSync(path.join(publicDir, 'edge-config.json'), '{"stale":"placeholder from the FE build"}');
    fs.writeFileSync(path.join(publicDir, '.env'), 'SECRET=1');
    fs.writeFileSync(path.join(root, 'outside.txt'), 'outside the public dir');
    return { root, publicDir, mainJs, cleanup: () => fs.rmSync(root, { recursive: true, force: true }) };
}

export interface LanApp {
    readonly app: INestApplication;
    readonly url: string;
    readonly port: number;
    readonly state: FakeState;
    readonly kernel: FakeKernel;
    readonly uplink: FakeUplink;
    readonly ops: FakeOps;
    readonly bus: EdgeEventBus;
    readonly auth: AuthPort;
    readonly lan: LanPort;
    readonly config: BoxConfig;
    close(): Promise<void>;
}

export interface LanAppOptions {
    readonly state: FakeState;
    readonly clock: () => number;
    readonly publicDir?: string;
    readonly config?: Record<string, unknown>;
    /**
     * Run with the box-config defaults v1 ships (room codes and the operator code OFF, DR23) instead of the kit's
     * codes-on default. `config.features`, when given, still wins.
     */
    readonly shippedFeatures?: boolean;
    /** Limits of the RT data routes (timeouts, sizes, cache) over the box defaults. */
    readonly rtData?: Partial<RtDataOptions>;
    /**
     * Mount the local API host too (api/: the /authapi, /coreapi, /realtimeapi prefixes, their path hygiene and
     * request context, the kernel-port adapters), after the LAN middleware, as AppModule does in `serve` mode.
     * Off by default so the LAN suites stay the table-only baseline.
     */
    readonly localApi?: boolean;
}

/** Build, init and listen (127.0.0.1, any port). The caller closes it. */
export async function startLanApp(opts: LanAppOptions): Promise<LanApp> {
    // v1 ships room codes and the operator code switched off (box-config.ts defaults, "email sign-in only"); this kit
    // switches them ON so the LAN suite keeps exercising those routes. `shippedFeatures: true` (or `config.features`)
    // runs a spec with the shipped defaults instead.
    const config = boxConfig({
        features: opts.shippedFeatures ? {} : CODES_ON,
        paths: { dataDir: path.join(os.tmpdir(), 'rt-edge-lan-data'), publicDir: opts.publicDir ?? path.join(os.tmpdir(), 'rt-edge-lan-no-public') },
        ...(opts.config ?? {}),
    });
    const kernel = new FakeKernel();
    const uplink = new FakeUplink();
    const ops = new FakeOps();

    @Module({
        imports: [EdgeCoreModule.register({ config, mode: 'serve', clock: opts.clock }), ...(opts.localApi ? LOCAL_API_IMPORTS : [])],
        controllers: LAN_CONTROLLERS,
        providers: [
            ...LAN_PROVIDERS,
            ...AUTH_PROVIDERS,
            TransmitterControl, // OpsModule exports it for the mounted OpsController
            { provide: STATE_PORT, useValue: opts.state },
            { provide: KERNEL_PORT, useValue: kernel as unknown as KernelPort },
            { provide: UPLINK_PORT, useValue: uplink as unknown as UplinkPort },
            { provide: OPS_PORT, useValue: ops as unknown as OpsPort },
            ...(opts.rtData ? [{ provide: RT_DATA_OPTIONS, useValue: rtDataOptions(opts.rtData) }] : []),
            ...(opts.localApi ? EDGE_API_PLATFORM_PROVIDERS : []),
        ],
    })
    class LanSpecModule implements NestModule {
        configure(consumer: MiddlewareConsumer): void {
            configureLanMiddleware(consumer);
            if (opts.localApi) configureLocalApiMiddleware(consumer);
        }
    }

    const ref = await Test.createTestingModule({ imports: [LanSpecModule] }).setLogger(silentLogger).compile();
    const app = ref.createNestApplication({ logger: false });
    app.use(cookieParser());
    await app.init();
    await app.listen(0, '127.0.0.1');
    const port = (app.getHttpServer().address() as AddressInfo).port;
    const auth = app.get<AuthPort>(AUTH_PORT);
    const lan = app.get<LanPort>(LAN_PORT);
    return {
        app,
        url: `http://127.0.0.1:${port}`,
        port,
        state: opts.state,
        kernel,
        uplink,
        ops,
        bus: app.get<EdgeEventBus>(EDGE_EVENT_BUS),
        auth,
        lan,
        config,
        close: async () => {
            await lan.close();
            await app.close();
        },
    };
}
