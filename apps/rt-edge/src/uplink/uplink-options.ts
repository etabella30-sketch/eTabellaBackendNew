/**
 * Tunables and test seams of the uplink. Production uses the defaults (spec §5.3, §5.6, §10 #2 values); specs inject
 * a short backoff, a deterministic jitter and fast timers through the optional UPLINK_OPTIONS provider.
 */
import type { ManagerOptions, Socket, SocketOptions } from 'socket.io-client';

import type { CloudHttp } from './cloud-http';

/** Optional DI token (uplink.module.ts provides nothing for it by default). */
export const UPLINK_OPTIONS = 'RT_EDGE_UPLINK_OPTIONS';

export type SocketFactory = (url: string, opts: Partial<ManagerOptions & SocketOptions>) => Socket;

export interface UplinkOptions {
    /** socket.io-client `io` (specs may wrap it). */
    readonly io?: SocketFactory;
    /** HTTPS JSON client for challenge / enroll / cert / archive-url / operator-code and the reachability probe. */
    readonly http?: CloudHttp;
    /** Jitter source in [0, 1) (spec §10 #2 "full jitter"). */
    readonly random?: () => number;
    /** Reconnect backoff: base (1 s) doubling to max (30 s), reset after `stableResetMs` (60 s) connected. */
    readonly backoffBaseMs?: number;
    readonly backoffMaxMs?: number;
    readonly stableResetMs?: number;
    /** emitWithAck timeout (ACK_TIMEOUT_MS = 15 s). */
    readonly ackTimeoutMs?: number;
    /** Socket.IO connect timeout (20 s). */
    readonly connectTimeoutMs?: number;
    /** `e.status` cadence (STATUS_INTERVAL_MS = 5 s). */
    readonly statusIntervalMs?: number;
    /** Periodic hello: revocations, JWKS and assignments stay fresh (60 s; a revoked user is cut off within 60 s). */
    readonly rehelloEveryMs?: number;
    /** Reachability probe of `cloud.pingUrl` while offline / online. */
    readonly probeOfflineEveryMs?: number;
    readonly probeOnlineEveryMs?: number;
    /** Housekeeping tick (pump wake-up, link status, internet hysteresis). */
    readonly tickMs?: number;
    /** Re-hello cadence while a round is held by the shrink guard (MR-2). */
    readonly heldShrinkRehelloMs?: number;
    /** A seal the cloud answered incomplete is retried after this long. */
    readonly sealRetryMs?: number;
    /** scrypt cost of a relayed operator-code hash (2^15 like new routes). */
    readonly operatorScryptN?: number;
    /** Internet hysteresis (EDGE_TIMING: offline after 15 s down, online after 10 s up). */
    readonly internetOfflineAfterMs?: number;
    readonly internetOnlineAfterMs?: number;
    /** Certificate re-check while online (EDGE_CERT_CHECK_INTERVAL_MS). */
    readonly certCheckEveryMs?: number;
    /** After a failed background certificate attempt, the next one waits this long (default `certCheckEveryMs`). */
    readonly certRetryMs?: number;
    /**
     * The clock of every pacing, backoff and retry interval (default `performance.now()`, link-control
     * `monotonicMs`): it must never step. EDGE_CLOCK (the wall clock, which ops may step) only stamps times.
     */
    readonly monotonic?: () => number;
    /** Uplink budget fallback before the hello reply's limits arrive (1 MB/s). */
    readonly edgeBps?: number;
    /** A held capture whose upload failed is retried after this long (60 s). */
    readonly captureRetryMs?: number;
    /** `syncNow` waits this long for a connect + hello before it answers `offline` (10 s; a CLI connect waits twice). */
    readonly syncNowTimeoutMs?: number;
    /** RECOVER_FAILED is raised again for the same session and cause only after this long (RECOVER_FAILED_REALERT_MS, 1 h). */
    readonly recoverRealertMs?: number;
    /** Refusals in a row that freeze a corrupt-journal session for an admin (RECOVER_ESCALATE_AFTER, 3; MR-4). */
    readonly recoverEscalateAfter?: number;
}

export const UPLINK_DEFAULTS = Object.freeze({
    backoffBaseMs: 1_000,
    backoffMaxMs: 30_000,
    stableResetMs: 60_000,
    ackTimeoutMs: 15_000,
    connectTimeoutMs: 20_000,
    statusIntervalMs: 5_000,
    rehelloEveryMs: 60_000,
    probeOfflineEveryMs: 10_000,
    probeOnlineEveryMs: 30_000,
    tickMs: 250,
    heldShrinkRehelloMs: 30_000,
    sealRetryMs: 5_000,
    operatorScryptN: 1 << 15,
    edgeBps: 1_000_000,
    captureRetryMs: 60_000,
    syncNowTimeoutMs: 10_000,
});
