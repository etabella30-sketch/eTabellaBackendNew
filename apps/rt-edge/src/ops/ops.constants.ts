/**
 * Tunables of the ops module (status, readiness, verdict, network checks, diagnostics, retention). Contract
 * thresholds (EDGE_TIMING, EDGE_DISK_*, EDGE_CLOCK_*) live in ../contracts; these are the box-side choices the
 * contract leaves to the implementation. Times are ms.
 */
import { EDGE_TIMING } from '../contracts';

/** DI token: `OpsTuning` (defaults: DEFAULT_OPS_TUNING). Specs pass short budgets. */
export const OPS_TUNING = 'RT_EDGE_OPS_TUNING';

export interface OpsTuning {
    /** Heartbeat: `session-status` (cause 'heartbeat') for every unpurged session, `device-health`, alerts. */
    readonly heartbeatMs: number;
    /** Clock and UPS measurement (spawns `chronyc` / `upsc` on the box). */
    readonly clockCheckMs: number;
    /** Retention sweep (§10 #19 purge, log / audit / operator-code / revocation pruning). */
    readonly retentionEveryMs: number;
    /** One network probe (DNS, HTTPS) gives up after this long. */
    readonly probeTimeoutMs: number;
    /** `UplinkPort.syncNow` budget inside a readiness run (the whole run stays within ~10 s). */
    readonly syncTimeoutMs: number;
}

export const DEFAULT_OPS_TUNING: OpsTuning = Object.freeze({
    heartbeatMs: EDGE_TIMING.statusHeartbeatMs,
    clockCheckMs: 60_000,
    retentionEveryMs: 10 * 60_000,
    probeTimeoutMs: EDGE_TIMING.pingTimeoutMs,
    syncTimeoutMs: 5_000,
});

/** §10 #19 / S-D9: a 'K' session is purged 24 h after the cloud confirmed the seal (publish is not visible on the box). */
export const OPS_PURGE_AFTER_SEAL_MS = 24 * 3_600_000;
/** Connectivity Log days kept on the box (the diagnostics bundle needs only the last 24 h). */
export const OPS_LOG_KEEP_DAYS = 30;
/** Audit rows kept on the box. */
export const OPS_AUDIT_KEEP_MS = 90 * 86_400_000;

/** Spec §12 P2 "Disk <5 GB". */
export const OPS_DISK_ALERT_MB = 5_120;
/** A degraded journal with less free space than this reads `recording-failed {reason:'disk-full'}`, else `io-error`. */
export const OPS_DISK_FULL_MB = 512;
/** Spec §12: clock offset > 5 s P2, > 60 s P1; chrony unsynced > 1 h with a CaseView session P1. */
export const OPS_CLOCK_ALERT_P2_MS = 5_000;
export const OPS_CLOCK_ALERT_P1_MS = 60_000;
export const OPS_CLOCK_UNSYNCED_PAGE_MS = 3_600_000;
/** A cloud clock reading (hello `serverNowMs`) older than this is not used for the offset. */
export const OPS_CLOUD_CLOCK_MAX_AGE_MS = 15 * 60_000;
/**
 * Spec §10 #8 cloud-time fallback: step the clock from the cloud's `serverNowMs` when chrony has been unsynced for
 * over 1 h (OPS_CLOCK_UNSYNCED_PAGE_MS) or the box is off by more than OPS_CLOCK_ALERT_P1_MS. Only with a cloud reading
 * at most this old and a round trip at most OPS_CLOCK_STEP_MAX_RTT_MS, at most once per OPS_CLOCK_STEP_EVERY_MS, and
 * only on a production box (a dev machine's clock is never touched).
 */
export const OPS_CLOCK_STEP_MAX_AGE_MS = 5 * 60_000;
export const OPS_CLOCK_STEP_MAX_RTT_MS = 2_000;
export const OPS_CLOCK_STEP_EVERY_MS = 15 * 60_000;

/**
 * DR12 "Support alerted HH:MM": a feed that stays stopped this long (a reconnect inside it is the normal "CAT
 * disconnect and reconnect", spec §12 Info) raises ONE `FEED_STOPPED` P2 alert from ops, which the uplink forwards to
 * the cloud pager; `supportAlertedAtMs` is when it was raised with the uplink online.
 */
export const OPS_FEED_STOPPED_ALERT_AFTER_MS = 60_000;

/** Diagnostics: the Connectivity Log window and a row cap. */
export const OPS_DIAGNOSTICS_LOG_WINDOW_MS = 24 * 3_600_000;
export const OPS_DIAGNOSTICS_MAX_LOG_ROWS = 5_000;
/** Recent bus alerts kept for the diagnostics bundle. */
export const OPS_ALERT_BUFFER = 200;
/** "Reconnected · gap" recoveries kept until dismissed (oldest dropped beyond this). */
export const OPS_MAX_RECOVERIES = 50;

/** RT Production on etabella.net (cloud FE route `admin/realtime`): readiness `open-rt-production` href. */
export const OPS_RT_PRODUCTION_PATH = '/admin/realtime';

/**
 * Public names resolved by the `internet` network check through the box's resolver (the router). The box's
 * firewall allows only the cloud on 443 plus DNS and NTS/NTP outbound (spec §11), so a recursive DNS answer is the
 * one internet signal that does not involve etabella.net ("Internet unavailable" vs "Can't reach eTabella", DR16).
 */
export const OPS_INTERNET_PROBE_HOSTS: readonly string[] = Object.freeze(['one.one.one.one', 'dns.google']);
