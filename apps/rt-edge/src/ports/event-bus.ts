/**
 * EdgeEventBus (token EDGE_EVENT_BUS, provided by the global EdgeCoreModule): the in-process events the box modules
 * publish and the LAN gateway (and ops) turn into LAN socket traffic and status.
 *
 * Delivery rules (InMemoryEdgeEventBus; any replacement must keep them):
 * - SYNCHRONOUS, in subscription order, inside `publish`. Listeners must be fast and must not block: anything slow
 *   (a socket broadcast, a DB write) is the listener's own business to defer.
 * - A throwing listener never breaks the publisher or the other listeners; the error goes to `onListenerError`.
 * - Publishing from inside a listener is allowed (delivered depth-first, immediately).
 * - A listener added during a delivery does not receive that event; one removed during it is skipped if not yet run.
 * - Payloads are treated as immutable by every listener.
 *
 * What each event means and who publishes it:
 *
 * | Event                 | Publisher        | LAN gateway reaction (CONTRACTS.md §9)                                   |
 * |-----------------------|------------------|--------------------------------------------------------------------------|
 * | `session-status`      | kernel, uplink, ops | rebuild `EdgeSessionStatus` (`OpsPort.sessionStatus`, new seq) → `edge-status` to `S<nSesid>` |
 * | `session-event`       | kernel, uplink   | `edge-session` to `S<nSesid>` (seq from `OpsPort.nextSeq`); `ended` also legacy `on-notification {cStatus:'E'}` |
 * | `session-armed`       | kernel           | legacy `on-notification {cStatus:'R'}` to `S<nSesid>`                  |
 * | `transmitter-changed` | kernel           | `edge-status` with the operator field to box-admin sockets            |
 * | `cloud-link-changed`  | uplink           | same                                                                     |
 * | `internet-changed`    | uplink           | `session-status` for every session (marking paused / available)        |
 * | `assignments-changed` | uplink           | kernel arms / ends; LAN re-checks joined rooms against the new roster  |
 * | `access-revoked`      | auth, uplink     | disconnect the matching LAN sockets at once                            |
 * | `lan-viewers`         | lan              | (uplink reads it for `e.status lanViewers`)                             |
 * | `feed-stopped` / `feed-resumed` | kernel | (ops: verdict problem `feed-stopped` / recovery `reconnected`)         |
 * | `device-health`       | ops              | (uplink caches the latest for the `e.status` `device` block, spec §12) |
 * | `certificate-installed` | uplink         | main.ts `EdgeLanListener`: bind the HTTPS listener (waiting) or hot-reload the pair; ops re-measures `device-health` |
 * | `alert`               | any, lifecycle, main.ts | (uplink forwards P1/P2 in `e.status`; ops lists it)             |
 *
 * A late subscriber gets no replay: `device-health` is re-published every heartbeat for that reason, and boot
 * failures are also kept in EDGE_BOOT_STATUS (ports/boot.ts).
 */
import type { AlertTier } from '@app/rt-ingest';

import type { CloudLinkStatus, EdgeInternetStatus, EdgeLinePosition, EdgePartPointer, TransmitterLinkStatus, TransmitterMode } from '../contracts';
import type { AssignmentsDiff } from './state.port';
import type { Unsubscribe } from './tokens';

/** Why a session's status may have changed (only for logs and coalescing; listeners always rebuild the whole status). */
export type SessionStatusCause = 'line' | 'link' | 'phase' | 'uplink' | 'internet' | 'assignment' | 'split' | 'heartbeat';

export interface SessionStatusChanged {
    readonly nSesid: string;
    readonly cause: SessionStatusCause;
    readonly atMs: number;
}

/** `EdgeSessionEvent` (contracts/socket.ts) before the LAN gateway stamps its `seq`. */
export type EdgeSessionEventDraft =
    | { readonly type: 'first-line'; readonly nSesid: string; readonly atMs: number }
    | { readonly type: 'ended'; readonly nSesid: string; readonly endedAtMs: number }
    | { readonly type: 'split'; readonly nSesid: string; readonly continuedAs: EdgePartPointer };

export interface SessionArmed {
    readonly nSesid: string;
    readonly atMs: number;
}

export interface TransmitterChanged {
    readonly stateVersion: number;
    readonly link: TransmitterLinkStatus;
    readonly atMs: number;
}

/**
 * Tokens / identities whose LAN sockets must close now: sign-out (that jti), room access ended by an admin (that
 * device's jti), cloud revocation (users, jtis), a room-code session that ended. Any matching field matches.
 */
export interface AccessRevoked {
    readonly jtis: readonly string[];
    readonly userIds: readonly string[];
    readonly reason: 'sign-out' | 'room-access-ended' | 'cloud-revocation' | 'session-ended' | 'operator-day-ended';
    readonly atMs: number;
}

export interface LanViewers {
    readonly nSesid: string;
    /** Sockets currently joined to `S<nSesid>`. */
    readonly count: number;
}

/** The transmitter link of a live session went down (verdict `feed-stopped`, DR12). */
export interface FeedStopped {
    readonly nSesid: string;
    readonly feedStoppedAtMs: number;
    /** The last line received; null when none is known. */
    readonly lastLine: EdgeLinePosition | null;
    readonly mode: TransmitterMode;
    readonly peer: string | null;
}

/** The link came back (verdict recovery `reconnected`, "Gap 10:31:05 – 10:36:12"). */
export interface FeedResumed {
    readonly nSesid: string;
    readonly reconnectedAtMs: number;
    readonly gapFromMs: number;
    readonly gapToMs: number;
}

/**
 * The `device` block of `e.status` (edge-sync `EdgeStatus.device`, spec §12 "Device"), measured by ops. `null` = not
 * measured (check not run yet, or not available on this box, e.g. no UPS). The uplink adds `sw`, `parserVer`,
 * `uptime` and `egressIp` itself.
 */
export interface EdgeDeviceHealth {
    /** When ops measured it (epoch ms). */
    readonly atMs: number;
    /** Free space on the filesystem of `BoxConfig.paths.dataDir`, MiB (floor). */
    readonly diskFreeMB: number | null;
    /** Bytes under `paths.journalDir`. */
    readonly journalBytes: number | null;
    /** Bytes under `paths.captureDir`. */
    readonly captureBytes: number | null;
    /** Box clock minus reference clock (chrony tracking, else the cloud's `serverNowMs`, RTT-corrected), ms. */
    readonly clockOffsetMs: number | null;
    readonly chronySynced: boolean | null;
    /**
     * `UplinkPort.certificate().daysLeft`: whole days until the installed certificate's notAfter (floor; negative
     * once expired); null while no loadable pair is installed, and with plain HTTP (dev).
     */
    readonly certDaysLeft: number | null;
    /** NUT reports the UPS on battery; null without a UPS. */
    readonly upsOnBattery: boolean | null;
}

/**
 * The uplink installed a new certificate/key pair (`UplinkPort.ensureCertificate`, ports/certificate.ts): both files
 * are in place. The LAN listener binds (when it was waiting) or hot-reloads now instead of at its next poll.
 */
export interface CertificateInstalled {
    readonly atMs: number;
    /** The new leaf's notAfter (epoch ms). */
    readonly notAfterMs: number;
    /** The new leaf's SHA-256 fingerprint (`EdgeCertificateInfo.fingerprint256`). */
    readonly fingerprint256: string;
    /** True when no loadable pair was installed before (first issue, or a replaced broken pair). */
    readonly first: boolean;
}

/** A box-side alert (rt-ingest `IngestAlert`, uplink refusals, disk/clock, failed service starts), spec §12 tiers. */
export interface EdgeAlert {
    readonly source: 'ingest' | 'uplink' | 'auth' | 'ops' | 'state' | 'lan';
    readonly tier: AlertTier;
    /** CRITICAL inside the tier (degraded durability, journal corruption, recording failed). */
    readonly critical: boolean;
    /**
     * e.g. rt-ingest `IngestAlertKind`, 'FORK', 'DISK_LOW', 'START_FAILED' (EdgeLifecycle, ports/boot.ts),
     * 'CERTIFICATE_UNAVAILABLE' / 'LISTEN_FAILED' (main.ts LAN listener), 'CERTIFICATE_EXPIRING' (ops),
     * 'CERTIFICATE_RENEWAL_FAILED' (uplink).
     */
    readonly kind: string;
    readonly message: string;
    readonly atMs: number;
    readonly nSesid: string | null;
    readonly data: Readonly<Record<string, unknown>> | null;
}

export interface EdgeBusEvents {
    'session-status': SessionStatusChanged;
    'session-event': EdgeSessionEventDraft;
    'session-armed': SessionArmed;
    'transmitter-changed': TransmitterChanged;
    'cloud-link-changed': CloudLinkStatus;
    'internet-changed': EdgeInternetStatus;
    'assignments-changed': AssignmentsDiff;
    'access-revoked': AccessRevoked;
    'lan-viewers': LanViewers;
    'feed-stopped': FeedStopped;
    'feed-resumed': FeedResumed;
    'device-health': EdgeDeviceHealth;
    'certificate-installed': CertificateInstalled;
    alert: EdgeAlert;
}

export type EdgeBusEventName = keyof EdgeBusEvents;

export type EdgeBusListener<K extends EdgeBusEventName> = (payload: EdgeBusEvents[K]) => void;

export interface EdgeEventBus {
    publish<K extends EdgeBusEventName>(type: K, payload: EdgeBusEvents[K]): void;
    subscribe<K extends EdgeBusEventName>(type: K, listener: EdgeBusListener<K>): Unsubscribe;
    /** Listeners currently subscribed to `type` (diagnostics, specs). */
    listenerCount(type: EdgeBusEventName): number;
}

export class InMemoryEdgeEventBus implements EdgeEventBus {
    private readonly listeners = new Map<EdgeBusEventName, Array<EdgeBusListener<any>>>();

    constructor(private readonly onListenerError: (type: EdgeBusEventName, error: unknown) => void = () => undefined) {}

    publish<K extends EdgeBusEventName>(type: K, payload: EdgeBusEvents[K]): void {
        const current = this.listeners.get(type);
        if (!current || current.length === 0) return;
        for (const listener of [...current]) {
            if (!this.listeners.get(type)?.includes(listener)) continue;
            try {
                listener(payload);
            } catch (err) {
                try {
                    this.onListenerError(type, err);
                } catch {
                    /* an error reporter must not break the publisher either */
                }
            }
        }
    }

    subscribe<K extends EdgeBusEventName>(type: K, listener: EdgeBusListener<K>): Unsubscribe {
        if (typeof listener !== 'function') throw new TypeError('rt-edge: bus listener must be a function');
        const list = this.listeners.get(type) ?? [];
        list.push(listener);
        this.listeners.set(type, list);
        let active = true;
        return () => {
            if (!active) return;
            active = false;
            const now = this.listeners.get(type);
            if (!now) return;
            const index = now.indexOf(listener);
            if (index >= 0) now.splice(index, 1);
        };
    }

    listenerCount(type: EdgeBusEventName): number {
        return this.listeners.get(type)?.length ?? 0;
    }
}
