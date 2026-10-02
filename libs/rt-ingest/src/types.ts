/**
 * Shared vocabulary of libs/rt-ingest: alerts raised to the host app (box
 * kernel or cloud module), incident kinds journaled as INCIDENT records, and
 * the connection descriptors the listener and the dialer hand to the arbiter.
 */

/** Alert tiers of spec §12: P1 pages, P2 notifies, info is chip-only. */
export type AlertTier = 'P1' | 'P2' | 'info';

export type IngestAlertKind =
    /** listen-mode handshake whose username matches no route: refused, nothing kept (D3) */
    | 'UNKNOWN_LOGIN'
    /** one IP sent more than 100 unknown-username handshakes in an hour */
    | 'HANDSHAKE_FLOOD'
    /** 5 wrong passwords in a minute for one (IP, user): 5-minute block */
    | 'LOCKOUT'
    /** a second peer was held while the active connection is busy (orphan kind 'C') */
    | 'HELD_PEER'
    /** a direct stream for a route this listener must never parse (cloud, orphan kind 'H') */
    | 'HELD_ROUTE'
    /** a different peer took over an idle active connection */
    | 'PEER_TAKEOVER'
    /** admin "Make this the active feed" */
    | 'REPINNED'
    /** a connection for a session that is ending or ended was refused */
    | 'ENDING_REFUSED'
    /** the route source could not be read or parsed; the last good routes stay */
    | 'ROUTES_READ_ERROR'
    /** journal appends fail (MR-5): parsing continues from RAM */
    | 'DEGRADED_DURABILITY'
    /** journal appends work again after a degraded period */
    | 'DURABILITY_RESTORED'
    /**
     * records still undurable when the worker closed (degraded journal, last write attempt failed): raised at the
     * close and again at the next open from the lost-tail marker, where it is also journaled as an incident
     */
    | 'UNDURABLE_TAIL_LOST'
    /** a held capture hit its byte cap; further bytes are dropped */
    | 'CAPTURE_CAP'
    /** a capture could not be written */
    | 'CAPTURE_ERROR'
    /** an R..E refresh window was open when the CAT connection changed or the session ended (S-D11) */
    | 'ABORTED_WINDOW'
    /** a later connection asked for a protocol other than the one the session decided */
    | 'PROTOCOL_MISMATCH'
    /** DET-4: the feed format was still unclear after 4096 bytes (or at the end): parsed as CaseView, the default */
    | 'PROTOCOL_FALLBACK'
    /** the parser threw while handling a record */
    | 'PARSER_ERROR'
    /** the boundary or checkpoint callback threw */
    | 'BOUNDARY_ERROR'
    | 'CHECKPOINT_ERROR'
    /** a chunk arrived for a connection that is not the session's active one */
    | 'STRAY_FEED'
    /** the journal failed verification outside the torn tail of its last segment (MR-4): CRITICAL */
    | 'JOURNAL_CORRUPT'
    /** a session worker could not be opened (journal I/O, recovery refused) */
    | 'WORKER_ERROR'
    /** the active CAT connection closed without being superseded or ended */
    | 'CAT_DISCONNECT';

export interface IngestAlert {
    kind: IngestAlertKind;
    tier: AlertTier;
    /** CRITICAL severity inside the tier (degraded durability, journal corruption) */
    critical?: boolean;
    nSesid?: string;
    user?: string;
    peer?: string;
    /** both peers for a held connection: [active, held] */
    peers?: string[];
    /** MAC addresses from the kit's ARP table, when a lookup is configured */
    macs?: Array<string | null>;
    connId?: string;
    message: string;
    at: number;
    data?: Record<string, unknown>;
}

export type AlertSink = (alert: IngestAlert) => void;

/** Spec §4.1 incident kinds. Warning-level ones block 'K' at seal. */
export type IncidentKind =
    | 'ABORTED_WINDOW'
    | 'DEGRADED_DURABILITY'
    | 'JOURNAL_CORRUPT'
    | 'REBASE'
    | 'REPLAY_DIVERGED'
    | 'SHRINK_CONFIRMED'
    | 'AUDIT_MISMATCH'
    | 'SWITCH_UNDRAINED'
    | 'CONCURRENT_CAT'
    | 'CLOCK_UNVERIFIED'
    | 'CAT_DISCONNECT'
    | 'TAIL_TRUNCATED'
    | 'LOCKOUT';

export type IncidentLevel = 'warning' | 'info';

/** Warning-level kinds (spec §4.1); everything else defaults to info. */
export const WARNING_INCIDENTS: ReadonlySet<IncidentKind> = new Set<IncidentKind>([
    'ABORTED_WINDOW',
    'DEGRADED_DURABILITY',
    'JOURNAL_CORRUPT',
    'REBASE',
    'REPLAY_DIVERGED',
    'SHRINK_CONFIRMED',
    'AUDIT_MISMATCH',
    'SWITCH_UNDRAINED',
    'CONCURRENT_CAT',
    'CLOCK_UNVERIFIED',
]);

export function incidentLevel(kind: IncidentKind): IncidentLevel {
    return WARNING_INCIDENTS.has(kind) ? 'warning' : 'info';
}

/** Wire protocol of the CAT stream: Bridge ('B', STX command frames) or CaseView ('C'). */
export type CatProtocol = 'B' | 'C';

/** How a CAT connection reached the box: Eclipse dialed in (listen) or the box dialed out (dial, D34). */
export type TransmitterMode = 'listen' | 'dial';

export type Clock = () => number;

export const systemClock: Clock = () => Date.now();

export function noopAlert(_alert: IngestAlert): void { /* host app did not subscribe */ }

/** Session ids become directory names; only UUID-like ids are accepted. */
export function assertSafeSessionId(nSesid: string): void {
    if (typeof nSesid !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(nSesid)) {
        throw new Error(`rt-ingest: unsafe session id ${JSON.stringify(nSesid)}`);
    }
}

/** A socket's peer as the single-active-connection rule compares it: the IP only, IPv4-mapped IPv6 unwrapped. */
export function normalizePeer(address: string | null | undefined): string {
    const raw = String(address ?? '').trim();
    if (!raw) return 'unknown';
    const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(raw);
    return mapped ? mapped[1] : raw.toLowerCase();
}

let connCounter = 0;

/** Connection ids are journaled in CONN_OPEN/CONN_CLOSE; unique per process and readable in logs. */
export function newConnId(mode: TransmitterMode): string {
    connCounter = (connCounter + 1) % 1_000_000;
    return `${mode === 'dial' ? 'd' : 'l'}-${Date.now().toString(36)}-${connCounter.toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Map the dial-mode protocol setting onto the journaled wire protocol. */
export function catProtocolOf(setting: 'bridge' | 'caseview'): CatProtocol {
    return setting === 'caseview' ? 'C' : 'B';
}

/** One alert sink that never lets a throwing subscriber break ingest. */
export function safeAlert(sink: AlertSink | undefined): AlertSink {
    return (alert: IngestAlert) => {
        try {
            sink?.(alert);
        } catch {
            /* an alert subscriber must not take the CAT path down */
        }
    };
}
