/**
 * Pure status rules (DR6, DR8, DR9; CONTRACTS.md §9.1): one session's `EdgeSessionStatus` (room chip, cloud-compatible
 * venue fields, Part 2 pointer) and the normalisation of the operator chip's transmitter and cloud segments.
 */
import {
    CloudLinkStatus,
    EDGE_TIMING,
    EdgeInternetStatus,
    EdgeMarkingState,
    EdgeOperatorStatus,
    EdgePartPointer,
    edgeRoomChip,
    EdgeRoomStatus,
    EdgeSessionStatus,
    EdgeVenueState,
    TransmitterLinkState,
    TransmitterLinkStatus,
} from '../contracts';
import { BoxSessionRecord, deriveFeedState, KernelSessionView, sessionZone, UplinkSessionSync } from '../ports';

/** The transmitter link carries a connection (DR13 "link up"). */
export const LINK_UP_STATES: ReadonlySet<TransmitterLinkState> = new Set<TransmitterLinkState>(['connected-no-session', 'live', 'quiet']);

export function isLinkUp(state: TransmitterLinkState): boolean {
    return LINK_UP_STATES.has(state);
}

/** `${cloudOrigin}/rt/session/<nSesid>` (CONTRACTS.md `EdgeLocalSession.cloudUrl`, `EdgePartPointer.cloudUrl`). */
export function sessionCloudUrl(cloudOrigin: string, nSesid: string): string {
    return `${cloudOrigin.replace(/\/+$/, '')}/rt/session/${encodeURIComponent(nSesid)}`;
}

/**
 * The DR9 Part 2 pointer once the hearing was split (D7). The cloud may not say when (`next.splitAtMs` null); the
 * contract needs a time, so the box uses when it learnt of the end of Part 1 (the split ends it), else the record's
 * last update.
 */
export function partPointer(record: Pick<BoxSessionRecord, 'next' | 'endRequestedAtMs' | 'updatedAtMs'>, cloudOrigin: string): EdgePartPointer | null {
    const next = record.next;
    if (!next) return null;
    return {
        nSesid: next.nSesid,
        nPartNo: next.nPartNo,
        cloudUrl: sessionCloudUrl(cloudOrigin, next.nSesid),
        splitAtMs: next.splitAtMs ?? record.endRequestedAtMs ?? record.updatedAtMs,
    };
}

/** v1 (S-D6): marking is paused while the box's internet is down; `unknown` (boot) does not pause it. */
export function markingOf(internet: EdgeInternetStatus): EdgeMarkingState {
    return internet.state === 'down' ? 'paused' : 'available';
}

/**
 * Cloud-gateway `venue` for one session (spec §9): `offline` while the uplink is not online; `catching-up` while the
 * cloud has not confirmed everything of this session; else `online`.
 */
export function venueOf(uplinkOnline: boolean, sync: UplinkSessionSync | null): EdgeVenueState {
    if (!uplinkOnline) return 'offline';
    if (sync && (sync.dirtyPages > 0 || sync.lagLines > 0 || sync.lagSec > 0 || sync.lagBytes > 0)) return 'catching-up';
    return 'online';
}

export interface SessionStatusInput {
    readonly record: BoxSessionRecord;
    /** Null when the kernel does not hold the session open (not armed yet, or sealed). */
    readonly view: KernelSessionView | null;
    readonly sync: UplinkSessionSync | null;
    readonly uplinkOnline: boolean;
    readonly internet: EdgeInternetStatus;
    readonly cloudOrigin: string;
    readonly seq: number;
    readonly nowMs: number;
    /** When `venue` last changed (ops tracks it). */
    readonly venueSince: number | null;
    readonly startAtMs: number | null;
    readonly operator?: EdgeOperatorStatus;
}

/** The room status of one session: kernel view first, the stored record when the kernel does not hold it. */
export function roomStatus(input: Pick<SessionStatusInput, 'record' | 'view' | 'internet' | 'nowMs' | 'startAtMs'>): EdgeRoomStatus {
    const { record, view, internet, nowMs } = input;
    const endedAtMs = view?.endedAtMs ?? record.endedAtMs ?? null;
    const firstLineAtMs = view?.firstLineAtMs ?? record.firstLineAtMs ?? null;
    const feed = view
        ? view.feed
        : deriveFeedState({ endedAtMs, firstLineAtMs, lastLineAtMs: null, linkUp: false, nowMs });
    const marking = markingOf(internet);
    return {
        chip: edgeRoomChip(feed, marking),
        feed,
        marking,
        startAtMs: input.startAtMs,
        firstLineAtMs,
        lastLineAtMs: view?.lastLineAtMs ?? null,
        feedStoppedAtMs: feed === 'stopped' ? view?.feedStoppedAtMs ?? null : null,
        internetDownSinceMs: internet.state === 'down' ? internet.sinceMs : null,
        endedAtMs,
    };
}

/** One `EdgeSessionStatus` (the `edge-status` payload and a snapshot row). `operator` only when given. */
export function buildSessionStatus(input: SessionStatusInput): EdgeSessionStatus {
    const { record, view, sync } = input;
    const status: EdgeSessionStatus = {
        nSesid: record.nSesid,
        seq: input.seq,
        atMs: input.nowMs,
        venue: venueOf(input.uplinkOnline, sync),
        lagLines: sync?.lagLines ?? 0,
        lagSec: sync?.lagSec ?? 0,
        since: input.venueSince,
        lastSyncAt: sync?.lastSyncedAtMs ?? null,
        catConnected: view?.catConnected ?? false,
        tz: sessionZone(record.tz),
        room: roomStatus(input),
        continuedAs: partPointer(record, input.cloudOrigin),
    };
    return input.operator ? { ...status, operator: input.operator } : status;
}

/**
 * The transmitter segment (DR6): `quietLevel` is `neutral` while the link has been quiet for at most
 * `EDGE_TIMING.quietNeutralMs` (from the last line, else from when the state began), `warn` after; null unless quiet.
 */
export function normalizeTransmitterLink(link: TransmitterLinkStatus, nowMs: number): TransmitterLinkStatus {
    if (link.state !== 'quiet') return link.quietLevel === null ? link : { ...link, quietLevel: null };
    const quietFrom = link.lastLineAtMs ?? link.sinceMs;
    const quietLevel = quietFrom !== null && nowMs - quietFrom > EDGE_TIMING.quietNeutralMs ? 'warn' : 'neutral';
    return link.quietLevel === quietLevel ? link : { ...link, quietLevel };
}

/** The cloud segment (DR6): "Synced" only after a cloud confirmation — a `synced` state without one reads `behind`. */
export function normalizeCloudLink(cloud: CloudLinkStatus): CloudLinkStatus {
    if (cloud.state === 'synced' && cloud.lastSyncedAtMs === null) return { ...cloud, state: 'behind' };
    return cloud;
}
