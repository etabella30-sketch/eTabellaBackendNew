/**
 * What the viewer gateway needs to know about venue-box sessions (RT edge spec section 5.8, section 12
 * "Cloud" and "Who knows the box is behind"; ledger D14, D20).
 *
 * EventsGateway never imports the edge module (apps/realtime-server/src/edge imports the gateway, so
 * the reverse import would be a cycle): it takes this port, optionally. RealtimeServerModule provides
 * it from EdgeSyncService and EdgeRegistryService, which EdgeModule exports. Without the port (unit
 * rigs, or a build without the edge module) the gateway behaves exactly as before.
 */
import type { EdgeRegistryService } from '../edge/edge-registry.service';
import type { EdgeSyncService } from '../edge/edge-sync.service';

export const EDGE_VIEWER_PORT = 'RT_EDGE_VIEWER_PORT';

export type EdgeViewerState = 'live' | 'catching-up' | 'offline' | 'sealed';

/**
 * The venue values of the cloud `edge-status` (spec section 9, FE row "`edgeStatus` signal
 * {venue, lagLines, lagSec, since, lastSyncAt, catConnected}"; apps/rt-edge CONTRACTS.md 9.1 keeps the same
 * names on the LAN payload "so one store reads both").
 */
export type EdgeVenueState = 'online' | 'offline' | 'catching-up';

/** `edge-status` as viewers of room S<nSesid> receive it (the banner "transcript up to ..."). */
export interface EdgeViewerStatus {
    nSesid: string;
    state: EdgeViewerState;
    atMs: number;
    /** rev of the last round the cloud applied */
    appliedRev: number;
    totalLines: number;
    /** when the cloud last applied or recorded anything for the session */
    lastSyncedAtMs: number | null;
    /** the box's own report (e.status, every 5 s); absent while the box is silent */
    lagSec?: number;
    lagLines?: number;
    /** pages the box still has to upload */
    pendingPages?: number;
    /** the transmitter (CAT) link as the box last reported it */
    catConnected?: boolean;
    /** when the box's last report for the session arrived (the cloud's "last seen") */
    reportedAtMs?: number | null;
    // ---- the cloud-viewer names (spec section 9; CONTRACTS.md 9.1 "cloud-compatible fields"), epoch ms.
    // Added by cloudEdgeStatus; every field above stays as it was.
    venue?: EdgeVenueState;
    /** when `venue` last changed ("Venue box offline since 10:42") */
    since?: number | null;
    /** last cloud-confirmed sync ("transcript up to 10:41:58") */
    lastSyncAt?: number | null;
}

/** The venue value of a viewer state. A sealed session has everything in the cloud: no banner, no lag. */
export function venueOf(state: EdgeViewerState): EdgeVenueState {
    if (state === 'offline') return 'offline';
    if (state === 'catching-up') return 'catching-up';
    return 'online';
}

/**
 * The payload cloud viewers get: the status as given plus the cloud-viewer names, `lagLines` / `lagSec`
 * always numbers and `catConnected` always a boolean (false when unknown). While the box is silent the cloud
 * reports at least `now - lastSeen` of lag (spec section 12, "Who knows the box is behind"). `since` is the
 * caller's (it remembers when the venue value last changed; see EventsGateway).
 */
export function cloudEdgeStatus(status: EdgeViewerStatus, since: number | null): EdgeViewerStatus {
    const venue = venueOf(status.state);
    const sealed = status.state === 'sealed';
    let lagSec = sealed ? 0 : (finite(status.lagSec) ?? 0);
    const lagLines = sealed ? 0 : (finite(status.lagLines) ?? 0);
    if (venue === 'offline') {
        const lastSeen = lastContactMs(status) ?? since;
        if (lastSeen !== null && lastSeen !== undefined && status.atMs > lastSeen) {
            lagSec = Math.max(lagSec, Math.floor((status.atMs - lastSeen) / 1000));
        }
    }
    return {
        ...status,
        venue,
        lagLines,
        lagSec,
        since,
        lastSyncAt: finite(status.lastSyncedAtMs) ?? null,
        catConnected: status.catConnected === true,
    };
}

/** The last time the cloud heard about the session from the box: its last report or its last applied round. */
export function lastContactMs(status: Pick<EdgeViewerStatus, 'reportedAtMs' | 'lastSyncedAtMs'>): number | null {
    const known = [finite(status.reportedAtMs), finite(status.lastSyncedAtMs)].filter((v): v is number => v !== undefined);
    return known.length ? Math.max(...known) : null;
}

/** An admin alert (spec section 12): logged, audited, sent to admins' U rooms and to the pager. */
export interface EdgeViewerAlert {
    kind: string;
    tier: 'P1' | 'P2' | 'info';
    nSesid?: string | null;
    nEdgeid?: string | null;
    message: string;
    data?: Record<string, unknown>;
}

export interface EdgeViewerPort {
    /** rev of the last round applied to a venue session; undefined when this process holds none. */
    appliedRev(nSesid: string): number | undefined;
    /** The session's current viewer status, or null when it is not a venue session known here. */
    status(nSesid: string): EdgeViewerStatus | null;
    /** Raise an admin alert. Never throws. */
    alert(alert: EdgeViewerAlert): void;
}

const finite = (value: unknown): number | undefined => (typeof value === 'number' && Number.isFinite(value) ? value : undefined);

/** The port over the edge module's services (EdgeSyncService state, the box's last e.status). */
export class EdgeViewerAdapter implements EdgeViewerPort {
    constructor(
        private readonly sync: Pick<EdgeSyncService, 'peekMeta' | 'viewerState'>,
        private readonly registry: Pick<EdgeRegistryService, 'sessionStatus' | 'alert'> & { gateway?: { connection(nEdgeid: string): unknown } | null },
        private readonly clock: () => number = () => Date.now(),
    ) { }

    appliedRev(nSesid: string): number | undefined {
        const rev = this.sync.peekMeta(nSesid)?.appliedRev;
        return Number.isSafeInteger(rev) && rev > 0 ? rev : undefined;
    }

    status(nSesid: string): EdgeViewerStatus | null {
        const meta = this.sync.peekMeta(nSesid);
        let state = this.sync.viewerState(nSesid) as EdgeViewerState | null;
        if (!meta && !state) return null;
        if (!state) {
            // No transition was emitted yet in this process: say what is known now.
            state = meta?.sealed ? 'sealed' : meta?.nEdgeid && this.registry.gateway?.connection(meta.nEdgeid) ? 'live' : 'offline';
        }
        const status: EdgeViewerStatus = {
            nSesid: String(nSesid).toLowerCase(),
            state,
            atMs: this.clock(),
            appliedRev: meta?.appliedRev ?? 0,
            totalLines: meta?.totalLines ?? 0,
            lastSyncedAtMs: meta?.updatedAtMs ?? null,
        };
        const report = meta?.nEdgeid ? this.registry.sessionStatus(meta.nEdgeid, nSesid) : null;
        const box = report?.session;
        if (box) {
            const lagSec = finite(box.lagSec);
            const lagLines = finite(box.lagLines);
            const pendingPages = finite(box.dirtyPages);
            if (lagSec !== undefined) status.lagSec = lagSec;
            if (lagLines !== undefined) status.lagLines = lagLines;
            if (pendingPages !== undefined) status.pendingPages = pendingPages;
            if (typeof box.catConnected === 'boolean') status.catConnected = box.catConnected;
        }
        const reportedAtMs = finite(report?.receivedAtMs);
        if (reportedAtMs !== undefined) status.reportedAtMs = reportedAtMs;
        return status;
    }

    alert(alert: EdgeViewerAlert): void {
        try {
            this.registry.alert({ kind: alert.kind, tier: alert.tier, nSesid: alert.nSesid ?? null, nEdgeid: alert.nEdgeid ?? null, message: alert.message, ...(alert.data ? { data: alert.data } : {}) });
        } catch {
            /* an alert must never break the feed */
        }
    }
}
