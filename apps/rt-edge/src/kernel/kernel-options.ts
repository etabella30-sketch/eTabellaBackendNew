/**
 * Tunables and test seams of the kernel. Production uses the defaults (spec values); specs inject short timers, a
 * fake disk probe or a fixed build date through the optional KERNEL_OPTIONS provider.
 */
import type * as net from 'net';

import type { JournalFs, LaneFactory, SessionWorkerOptions } from '@app/rt-ingest';

/** Optional DI token (kernel.module.ts provides nothing for it by default). */
export const KERNEL_OPTIONS = 'RT_EDGE_KERNEL_OPTIONS';

/**
 * RTC sanity floor (spec §3.4 "Time", §10 #8): a box clock earlier than this build blocks arming a new CaseView
 * session (CaseView times come from the receive clock, DET-1). The release script stamps nothing at runtime, so the
 * floor is the date this kernel was written; any box clock before it is certainly wrong.
 */
export const KERNEL_BUILD_FLOOR_MS = Date.UTC(2026, 9, 1);

export interface KernelOptions {
    /** The running parser version (default FEED_PARSE_VERSION). */
    readonly parserVer?: string;
    /** Boundary timer (spec §2.1: 50 ms). */
    readonly boundaryMs?: number;
    /** Checkpoint cadence (spec §6.2: 60 s). */
    readonly checkpointEveryMs?: number;
    /** Digest audit cadence (spec §6.2: 60 s, plus at every end). */
    readonly auditEveryMs?: number;
    /** Status/incident/link housekeeping tick (default 1 s). */
    readonly tickMs?: number;
    /** End drain (spec §4.4: idle 60 s, bound 5 min after the end request, poll 1 s). */
    readonly drain?: { readonly idleMs?: number; readonly boundMs?: number; readonly pollMs?: number };
    /** Dial reconnect interval (TRANSMITTER_RECONNECT_EVERY_SEC = 3 s). */
    readonly dialReconnectMs?: number;
    readonly dialConnectTimeoutMs?: number;
    /** Listen-mode handshake timeout (rt-ingest default 15 s). */
    readonly handshakeTimeoutMs?: number;
    /** Retry of a CAT listener that could not bind (default 5 s). */
    readonly listenRetryMs?: number;
    /** "Test only": how long to wait for bytes once connected (default and cap: TRANSMITTER_TEST_MAX_MS minus the connect). */
    readonly testWindowMs?: number;
    readonly createConnection?: (opts: net.NetConnectOpts) => net.Socket;
    /** Free MiB on the journal's filesystem; null when unknown (default fs.statfs). */
    readonly diskFreeMb?: (dir: string) => Promise<number | null>;
    /** RTC floor (default KERNEL_BUILD_FLOOR_MS). */
    readonly buildDateMs?: number;
    readonly journal?: SessionWorkerOptions['journal'];
    /** Journal file system (specs inject failures for degraded durability, MR-5). */
    readonly journalFs?: JournalFs;
    /** Retry interval of failing journal appends (rt-ingest default 5 s, MR-5). */
    readonly degradedRetryMs?: number;
    readonly laneFactory?: LaneFactory;
    /** How long a started session keeps the transmitter after its last activity (default CLOUD_REPORTER_HOLD_MS, 6 h). */
    readonly cloudReporterHoldMs?: number;
    /** How often the tick re-reads who owns the transmitter (default CLOUD_REPORTER_RECHECK_MS, 15 s). */
    readonly cloudReporterRecheckMs?: number;
}

export const KERNEL_DEFAULTS = Object.freeze({
    boundaryMs: 50,
    checkpointEveryMs: 60_000,
    auditEveryMs: 60_000,
    tickMs: 1_000,
    drainIdleMs: 60_000,
    drainBoundMs: 5 * 60_000,
    drainPollMs: 1_000,
    dialReconnectMs: 3_000,
    dialConnectTimeoutMs: 5_000,
    listenRetryMs: 5_000,
});
