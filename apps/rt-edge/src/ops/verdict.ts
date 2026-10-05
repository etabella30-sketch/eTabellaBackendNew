/**
 * The live verdict (DR12, DR16; CONTRACTS.md §8.4): every problem, ranked worst first by VERDICT_KINDS
 * (recording to disk failed → box not linked → disk low → recovering after restart → cloud refused the history (D19)
 * → feed stopped → COM port quiet → internet unavailable → can't reach eTabella → clock → held captures not
 * uploaded), and the green "Reconnected · gap A–B" recoveries kept until dismissed. Pure builders plus two small
 * stateful helpers (`ProblemClock` for stable `sinceMs`, `FeedIncidents` for feed drops and reconnects); specs beside.
 */
import type { EdgeLocalState } from '@app/edge-sync';

import {
    ConnectivityLogFilter,
    EDGE_CLOCK_WARN_MAX_OFFSET_MS,
    EDGE_DISK_ARM_MIN_MB,
    EDGE_TIMING,
    EdgeInternetStatus,
    EdgeLinePosition,
    EdgeLinkFailure,
    sortVerdictProblems,
    TransmitterLinkState,
    TransmitterMode,
    VERDICT_SEVERITY,
    VerdictAction,
    VerdictDetailMap,
    VerdictHint,
    VerdictKind,
    VerdictOverall,
    VerdictProblem,
    verdictRank,
    VerdictRecovery,
} from '../contracts';
import { EdgeAlert, FeedResumed, FeedStopped, KernelSessionView, resendFromMs, UplinkSessionSync } from '../ports';
import { OPS_DISK_FULL_MB, OPS_MAX_RECOVERIES } from './ops.constants';
import type { ClockFacts } from './readiness';
import { isLinkUp } from './status';

// ---------------------------------------------------------------------------------------------------------------
// Stable "since" per problem id
// ---------------------------------------------------------------------------------------------------------------

/** Remembers when each problem id was first seen, so `sinceMs` and the id stay stable while the problem lasts. */
export class ProblemClock {
    private readonly seen = new Map<string, number>();

    /** `hint` (a known start, e.g. the internet's `sinceMs`) wins; else the first time this id was seen. */
    at(id: string, nowMs: number, hint: number | null = null): number {
        if (hint !== null && Number.isFinite(hint)) {
            this.seen.set(id, hint);
            return hint;
        }
        const known = this.seen.get(id);
        if (known !== undefined) return known;
        this.seen.set(id, nowMs);
        return nowMs;
    }

    /** Forget every id not listed now (a problem that comes back later starts a new `since`). */
    retain(ids: ReadonlySet<string>): void {
        for (const id of [...this.seen.keys()]) if (!ids.has(id)) this.seen.delete(id);
    }

    get size(): number {
        return this.seen.size;
    }
}

// ---------------------------------------------------------------------------------------------------------------
// Feed drops and reconnects
// ---------------------------------------------------------------------------------------------------------------

/** One open feed drop (the verdict's `FeedStoppedIncident` before the time-dependent fields). */
export interface FeedIncident {
    readonly nSesid: string;
    readonly feedStoppedAtMs: number;
    /** The last line's time, else the stop time. */
    readonly gapFromMs: number;
    readonly lastLine: EdgeLinePosition | null;
    readonly mode: TransmitterMode;
    readonly peer: string | null;
    /** A P1/P2 alert for this session reached the uplink (online) at or after the stop. */
    readonly supportAlertedAtMs: number | null;
    /** Ops raised its own FEED_STOPPED alert (once per incident). */
    readonly alertRaisedAtMs: number | null;
}

type MutableIncident = { -readonly [K in keyof FeedIncident]: FeedIncident[K] };

/** Gap start of a drop: the last line's time when known and not after the stop, else the stop time. */
export function gapStartMs(feedStoppedAtMs: number, lastLine: EdgeLinePosition | null): number {
    const at = lastLine?.atMs;
    return at !== null && at !== undefined && Number.isFinite(at) && at <= feedStoppedAtMs ? at : feedStoppedAtMs;
}

export const recoveryId = (nSesid: string, gapFromMs: number): string => `reconnected:${nSesid}:${gapFromMs}`;

/**
 * Feed incidents from the kernel's `feed-stopped` / `feed-resumed` bus events, reconciled with the kernel views on
 * every heartbeat (an incident that started before ops subscribed, e.g. a box restarted mid-hearing, is opened from
 * the view; one whose session ended or closed is dropped without a recovery).
 */
export class FeedIncidents {
    private readonly open = new Map<string, MutableIncident>();
    private readonly recovered = new Map<string, VerdictRecovery>();

    constructor(private readonly maxRecoveries = OPS_MAX_RECOVERIES) {}

    stopped(e: FeedStopped): void {
        const current = this.open.get(e.nSesid);
        if (current && current.feedStoppedAtMs <= e.feedStoppedAtMs) {
            // Same drop reported again: keep its start, fill what was missing.
            if (!current.lastLine && e.lastLine) {
                current.lastLine = e.lastLine;
                current.gapFromMs = gapStartMs(current.feedStoppedAtMs, e.lastLine);
            }
            if (!current.peer && e.peer) current.peer = e.peer;
            return;
        }
        this.open.set(e.nSesid, {
            nSesid: e.nSesid,
            feedStoppedAtMs: e.feedStoppedAtMs,
            gapFromMs: gapStartMs(e.feedStoppedAtMs, e.lastLine),
            lastLine: e.lastLine,
            mode: e.mode,
            peer: e.peer,
            supportAlertedAtMs: null,
            alertRaisedAtMs: null,
        });
    }

    resumed(e: FeedResumed, sessionName: string): VerdictRecovery {
        this.open.delete(e.nSesid);
        return this.addRecovery({
            id: recoveryId(e.nSesid, e.gapFromMs),
            kind: 'reconnected',
            nSesid: e.nSesid,
            sessionName,
            reconnectedAtMs: e.reconnectedAtMs,
            gapFromMs: e.gapFromMs,
            gapToMs: e.gapToMs,
            resendFromMs: resendFromMs(e.gapFromMs),
        });
    }

    /**
     * Align with the kernel: open an incident for a `stopped` feed nobody reported; drop incidents of sessions that
     * ended, have no lines or are no longer open; close (with a recovery) an incident whose feed is flowing again
     * with no `feed-resumed` seen, once it is older than `graceMs` (the kernel publishes `feed-resumed` itself; this
     * only covers a missed event).
     */
    reconcile(
        views: readonly KernelSessionView[],
        nowMs: number,
        sessionName: (nSesid: string) => string,
        fallbackMode: TransmitterMode,
        graceMs: number,
    ): void {
        const byId = new Map(views.map(v => [v.nSesid, v]));
        for (const view of views) {
            if (view.feed !== 'stopped' || this.open.has(view.nSesid)) continue;
            const feedStoppedAtMs = view.feedStoppedAtMs ?? nowMs;
            this.open.set(view.nSesid, {
                nSesid: view.nSesid,
                feedStoppedAtMs,
                gapFromMs: gapStartMs(feedStoppedAtMs, view.lastLine),
                lastLine: view.lastLine,
                mode: view.mode ?? fallbackMode,
                peer: view.peer,
                supportAlertedAtMs: null,
                alertRaisedAtMs: null,
            });
        }
        for (const incident of [...this.open.values()]) {
            const view = byId.get(incident.nSesid);
            if (!view || view.feed === 'ended' || view.feed === 'waiting') {
                this.open.delete(incident.nSesid);
                continue;
            }
            if ((view.feed === 'live' || view.feed === 'quiet') && view.feedStoppedAtMs === null && nowMs - incident.feedStoppedAtMs >= graceMs) {
                this.open.delete(incident.nSesid);
                this.addRecovery({
                    id: recoveryId(incident.nSesid, incident.gapFromMs),
                    kind: 'reconnected',
                    nSesid: incident.nSesid,
                    sessionName: sessionName(incident.nSesid),
                    reconnectedAtMs: nowMs,
                    gapFromMs: incident.gapFromMs,
                    gapToMs: nowMs,
                    resendFromMs: resendFromMs(incident.gapFromMs),
                });
            }
        }
    }

    /** A P1/P2 alert for a session with an open drop reached the (online) uplink: "Support alerted HH:MM". */
    noteAlert(alert: Pick<EdgeAlert, 'nSesid' | 'tier' | 'atMs'>, uplinkOnline: boolean): void {
        if (!alert.nSesid || (alert.tier !== 'P1' && alert.tier !== 'P2') || !uplinkOnline) return;
        const incident = this.open.get(alert.nSesid);
        if (!incident || incident.supportAlertedAtMs !== null || alert.atMs < incident.feedStoppedAtMs) return;
        incident.supportAlertedAtMs = alert.atMs;
    }

    markAlertRaised(nSesid: string, atMs: number): void {
        const incident = this.open.get(nSesid);
        if (incident && incident.alertRaisedAtMs === null) incident.alertRaisedAtMs = atMs;
    }

    incident(nSesid: string): FeedIncident | null {
        const incident = this.open.get(nSesid);
        return incident ? { ...incident } : null;
    }

    incidents(): readonly FeedIncident[] {
        return [...this.open.values()].map(i => ({ ...i }));
    }

    /** Oldest reconnect first. */
    recoveries(): readonly VerdictRecovery[] {
        return [...this.recovered.values()].sort((a, b) => a.reconnectedAtMs - b.reconnectedAtMs || a.id.localeCompare(b.id));
    }

    /** "Done": true when the id was listed. */
    dismiss(id: string): boolean {
        return this.recovered.delete(id);
    }

    private addRecovery(recovery: VerdictRecovery): VerdictRecovery {
        const frozen = Object.freeze({ ...recovery });
        this.recovered.delete(recovery.id);
        this.recovered.set(recovery.id, frozen);
        while (this.recovered.size > this.maxRecoveries) {
            const oldest = this.recoveries()[0];
            this.recovered.delete(oldest.id);
        }
        return frozen;
    }
}

// ---------------------------------------------------------------------------------------------------------------
// Problems
// ---------------------------------------------------------------------------------------------------------------

/** Held captures waiting for upload, and the last failed upload (`captures-not-uploaded`). */
export interface HeldCaptureFacts {
    readonly pending: number;
    readonly lastError: VerdictDetailMap['captures-not-uploaded']['lastError'] | null;
}

/**
 * The held-capture fields of the cloud link (`CloudLinkStatus.heldCapturesPending`, `.lastUploadError`; user decision
 * 2026-10-04), read defensively: an uplink that does not send them, or sends something else, reads 0 pending and no
 * error, so no problem is claimed.
 */
export function heldCapturesOf(cloud: unknown): HeldCaptureFacts {
    const c = (cloud && typeof cloud === 'object' ? cloud : {}) as { readonly heldCapturesPending?: unknown; readonly lastUploadError?: unknown };
    const n = c.heldCapturesPending;
    const pending = typeof n === 'number' && Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
    const e = (c.lastUploadError && typeof c.lastUploadError === 'object' ? c.lastUploadError : null) as { readonly atMs?: unknown; readonly status?: unknown; readonly code?: unknown } | null;
    const lastError =
        e && typeof e.atMs === 'number' && Number.isFinite(e.atMs)
            ? { atMs: e.atMs, status: typeof e.status === 'number' && Number.isFinite(e.status) ? e.status : null, code: typeof e.code === 'string' ? e.code : null }
            : null;
    return { pending, lastError };
}

/** A session as the verdict needs it. */
export interface VerdictSessionFacts {
    readonly nSesid: string;
    readonly sessionName: string;
    readonly localState: EdgeLocalState;
    /** Null when the kernel does not hold it open. */
    readonly view: KernelSessionView | null;
    readonly sync: UplinkSessionSync | null;
    /** An admin already split the hearing (Part 2 pointer delivered). */
    readonly splitDone: boolean;
}

export interface VerdictInput {
    readonly nowMs: number;
    readonly sessions: readonly VerdictSessionFacts[];
    readonly linkFailure: EdgeLinkFailure | null;
    readonly lastLinkedAtMs: number | null;
    readonly diskFreeMB: number | null;
    readonly internet: EdgeInternetStatus;
    readonly pendingPages: number;
    readonly lagSec: number;
    /** `measured` false = no reading yet (no clock problem is claimed). */
    readonly clock: ClockFacts & { readonly measured: boolean };
    /** The applied transmitter (actions are offered for it, DR13). */
    readonly transmitter: {
        readonly mode: TransmitterMode;
        readonly linkState: TransmitterLinkState;
        readonly stateVersion: number;
        readonly hasDialAddress: boolean;
        /** The applied COM port and baud rate; null outside COM port mode or before one is applied. */
        readonly serialPath: string | null;
        readonly baudRate: number | null;
        /** Where Eclipse "Connect to server" reaches the box (`TransmitterStateResponse.listen.port`). */
        readonly listenPort: number;
    };
    /**
     * "Can't reach eTabella" with the internet not down: since when (the uplink's `cant-reach-etabella` since, else
     * when ops' own etabella.net probe started failing); null while etabella.net is reachable.
     */
    readonly cantReachSinceMs: number | null;
    /** Held captures waiting for upload and the last failed upload (`heldCapturesOf(UplinkPort.cloudLink())`). */
    readonly heldCaptures: HeldCaptureFacts;
    readonly feedIncidents: readonly FeedIncident[];
    /** The last line seen while the session's durability was still ok (recording-failed `lastSafe`). */
    readonly lastSafe: (nSesid: string) => EdgeLinePosition | null;
    readonly since: ProblemClock;
}

const act = (kind: VerdictAction['kind'], primary = false, extra: Partial<Pick<VerdictAction, 'stateVersion' | 'nSesid'>> = {}): VerdictAction => ({
    kind,
    primary,
    stateVersion: extra.stateVersion ?? null,
    nSesid: extra.nSesid ?? null,
});

function problem<K extends VerdictKind>(
    kind: K,
    id: string,
    sinceMs: number,
    nSesid: string | null,
    sessionName: string | null,
    detail: VerdictDetailMap[K],
    hints: readonly VerdictHint[],
    actions: readonly VerdictAction[],
): VerdictProblem {
    return { id, kind, rank: verdictRank(kind), severity: VERDICT_SEVERITY[kind], sinceMs, nSesid, sessionName, detail, hints, actions } as unknown as VerdictProblem;
}

const LINK_HINTS: Readonly<Record<EdgeLinkFailure, readonly VerdictHint[]>> = {
    'never-enrolled': ['contact-support'],
    revoked: ['contact-support'],
    quarantined: ['contact-support'],
    'key-refused': ['contact-support'],
    certificate: ['contact-support'],
    unreachable: ['check-internet'],
};

/** Every problem now, sorted with `sortVerdictProblems`; `input.since` keeps their ids' start times. */
export function buildVerdictProblems(input: VerdictInput): VerdictProblem[] {
    const { nowMs, since } = input;
    const out: VerdictProblem[] = [];
    const names = new Map(input.sessions.map(s => [s.nSesid, s.sessionName]));

    // 0. recording to disk failed (critical), per session.
    for (const s of input.sessions) {
        const view = s.view;
        if (!view) continue;
        let reason: VerdictDetailMap['recording-failed']['reason'] | null = null;
        if (view.durability === 'degraded') {
            reason = input.diskFreeMB !== null && input.diskFreeMB < OPS_DISK_FULL_MB ? 'disk-full' : 'io-error';
        } else if (view.journalCorrupt) {
            reason = 'journal-corrupt';
        }
        if (!reason) continue;
        const id = `recording-failed:${s.nSesid}`;
        const hints: VerdictHint[] = reason === 'disk-full' ? ['free-disk-space', 'contact-support'] : reason === 'io-error' ? ['replace-disk', 'contact-support'] : ['contact-support'];
        out.push(
            problem(
                'recording-failed',
                id,
                since.at(id, nowMs, reason === 'journal-corrupt' ? null : view.degradedSinceMs),
                s.nSesid,
                s.sessionName,
                { reason, lastSafe: reason === 'journal-corrupt' ? null : input.lastSafe(s.nSesid) },
                hints,
                [act('download-diagnostics', true)],
            ),
        );
    }

    // "Can't reach eTabella" with the internet not down, and since when (kind 8).
    const cantReach = input.cantReachSinceMs !== null && Number.isFinite(input.cantReachSinceMs) && input.internet.state !== 'down' ? input.cantReachSinceMs : null;
    // A box that linked before and recorded `unreachable` (the uplink does on its first failed reconnect, a second after
    // the drop) has lost etabella.net, it was not unlinked: the same fact as kind 8, listed there with its own start,
    // pending pages and lag (review 2026-10-04). Never-enrolled, revoked, quarantined, a refused key or a certificate
    // problem are the box's own and stay "Box not linked".
    const lostEtabella = input.linkFailure === 'unreachable' && input.lastLinkedAtMs !== null && cantReach !== null;

    // 1. box not linked.
    if (input.linkFailure !== null && !lostEtabella) {
        const terminal = input.linkFailure === 'revoked' || input.linkFailure === 'quarantined';
        out.push(
            problem(
                'box-not-linked',
                'box-not-linked',
                since.at('box-not-linked', nowMs),
                null,
                null,
                { failure: input.linkFailure, lastLinkedAtMs: input.lastLinkedAtMs },
                LINK_HINTS[input.linkFailure],
                terminal ? [act('run-checks-again', true), act('download-diagnostics')] : [act('run-checks-again', true)],
            ),
        );
    }

    // 2. disk low: a new session will not arm below EDGE_DISK_ARM_MIN_MB (spec §10 #3).
    if (input.diskFreeMB !== null && input.diskFreeMB < EDGE_DISK_ARM_MIN_MB) {
        out.push(
            problem(
                'disk-low',
                'disk-low',
                since.at('disk-low', nowMs),
                null,
                null,
                { freeMB: input.diskFreeMB, minFreeMB: EDGE_DISK_ARM_MIN_MB },
                ['free-disk-space', 'contact-support'],
                [act('download-diagnostics', true)],
            ),
        );
    }

    // 3. recovering after a restart, per session.
    for (const s of input.sessions) {
        const recovering = s.view?.recovering;
        if (!recovering) continue;
        const id = `recovering:${s.nSesid}`;
        out.push(
            problem(
                'recovering',
                id,
                since.at(id, nowMs, recovering.startedAtMs),
                s.nSesid,
                s.sessionName,
                { startedAtMs: recovering.startedAtMs, progressPct: recovering.progressPct },
                ['wait-for-recovery'],
                [],
            ),
        );
    }

    // 4. the cloud refused the history (D19): the session's uplink is frozen until an admin splits.
    for (const s of input.sessions) {
        const frozen = s.sync?.uplinkState === 'frozen' || s.sync?.verdict === 'frozen' || s.localState === 'frozen';
        if (!frozen) continue;
        const id = `history-refused:${s.nSesid}`;
        const refusedAtMs = since.at(id, nowMs, s.sync?.frozenAtMs ?? null);
        out.push(
            problem('history-refused', id, refusedAtMs, s.nSesid, s.sessionName, { refusedAtMs, splitDone: s.splitDone }, ['contact-support'], [act('split-to-cloud-info', true)]),
        );
    }

    // 5. feed stopped, per open incident. The box opens the link itself in dial and COM port mode, so Reconnect is
    // offered there while the link is down and something is applied to reconnect to (the box refuses it otherwise:
    // `link_up`, `not_configured`); in listen mode the reporter reconnects, hence the login card. A COM port has no
    // reporter login and no transmitter switch: its hints are Eclipse's output and the serial cable (user decision
    // 2026-10-04).
    const tx = input.transmitter;
    const outboundConfigured = tx.mode === 'dial' ? tx.hasDialAddress : tx.mode === 'serial' && tx.serialPath !== null;
    const outboundActions = (): VerdictAction[] => {
        const actions: VerdictAction[] = [];
        if (outboundConfigured && !isLinkUp(tx.linkState)) actions.push(act('reconnect', true, { stateVersion: tx.stateVersion }));
        actions.push(act('open-transmitter', actions.length === 0));
        return actions;
    };
    for (const incident of input.feedIncidents) {
        if (!names.has(incident.nSesid)) continue;
        const id = `feed-stopped:${incident.nSesid}:${incident.feedStoppedAtMs}`;
        const splitOfferedFromMs = incident.feedStoppedAtMs + EDGE_TIMING.splitOfferAfterMs;
        const actions: VerdictAction[] =
            tx.mode === 'listen' ? [act('show-to-reporter', true, { nSesid: incident.nSesid }), act('open-transmitter')] : outboundActions();
        if (nowMs >= splitOfferedFromMs) actions.push(act('split-to-cloud-info'));
        const hints: VerdictHint[] =
            tx.mode === 'dial'
                ? ['check-eclipse-output', 'check-cable', 'check-transmitter-address']
                : tx.mode === 'serial'
                  ? ['check-eclipse-output', 'check-com-cable']
                  : ['check-eclipse-output', 'check-cable', 'check-reporter-login'];
        since.at(id, nowMs, incident.feedStoppedAtMs);
        out.push(
            problem(
                'feed-stopped',
                id,
                incident.feedStoppedAtMs,
                incident.nSesid,
                names.get(incident.nSesid) ?? null,
                {
                    feedStoppedAtMs: incident.feedStoppedAtMs,
                    gapFromMs: incident.gapFromMs,
                    gapToMs: null,
                    lastLine: incident.lastLine,
                    resendFromMs: resendFromMs(incident.gapFromMs),
                    supportAlertedAtMs: incident.supportAlertedAtMs,
                    splitOfferedFromMs,
                    mode: incident.mode,
                    peer: incident.peer,
                    serialPath: tx.mode === 'serial' ? tx.serialPath : null,
                    listenPort: tx.mode === 'listen' ? tx.listenPort : null,
                },
                hints,
                actions,
            ),
        );
    }

    // 6. COM port quiet past the neutral window, per session (user decision 2026-10-04): the port stays open when
    // Eclipse output stops or the cable comes out at the reporter's end, so the feed only turns `quiet`. Raised when
    // the Transmitter pill turns amber (normalizeTransmitterLink: more than EDGE_TIMING.quietNeutralMs since the last
    // line). A warning only: no FEED_STOPPED page, no split offer. A session with an open drop shows the drop.
    const dropped = new Set(input.feedIncidents.map(i => i.nSesid));
    for (const s of input.sessions) {
        const view = s.view;
        if (!view || view.feed !== 'quiet' || (view.mode ?? tx.mode) !== 'serial' || dropped.has(s.nSesid)) continue;
        const lastLineAtMs = view.lastLineAtMs ?? view.lastLine?.atMs ?? null;
        if (lastLineAtMs === null || !Number.isFinite(lastLineAtMs) || nowMs - lastLineAtMs <= EDGE_TIMING.quietNeutralMs) continue;
        const id = `feed-quiet:${s.nSesid}:${lastLineAtMs}`;
        since.at(id, nowMs, lastLineAtMs);
        out.push(
            problem(
                'feed-quiet',
                id,
                lastLineAtMs,
                s.nSesid,
                s.sessionName,
                { lastLineAtMs, lastLine: view.lastLine, serialPath: tx.serialPath, baudRate: tx.baudRate },
                ['check-eclipse-output', 'check-com-cable'],
                outboundActions(),
            ),
        );
    }

    // 7. internet unavailable ("Can't reach eTabella" with the internet up is kind 8).
    if (input.internet.state === 'down') {
        const sinceMs = since.at('internet-unavailable', nowMs, input.internet.sinceMs);
        out.push(
            problem(
                'internet-unavailable',
                'internet-unavailable',
                sinceMs,
                null,
                null,
                { sinceMs, pendingPages: input.pendingPages, lagSec: input.lagSec },
                ['check-internet'],
                [act('run-checks-again', true)],
            ),
        );
    }

    // 8. can't reach eTabella with the internet not down (user decision 2026-10-04): what the Cloud card shows, after
    // the internet's own hysteresis (a socket reconnect takes seconds). Never beside internet-unavailable, nor beside a
    // box-not-linked of the box's own (never enrolled, revoked, quarantined, key refused); a certificate problem does
    // not hide it, and an `unreachable` failure of a box that linked before is listed here instead (above).
    const linkAllows = input.linkFailure === null || input.linkFailure === 'certificate' || lostEtabella;
    if (cantReach !== null && linkAllows && nowMs - cantReach >= EDGE_TIMING.internetOfflineAfterMs) {
        const sinceMs = since.at('cant-reach-etabella', nowMs, cantReach);
        out.push(
            problem(
                'cant-reach-etabella',
                'cant-reach-etabella',
                sinceMs,
                null,
                null,
                { sinceMs, pendingPages: input.pendingPages, lagSec: input.lagSec },
                ['contact-support'],
                [act('run-checks-again', true)],
            ),
        );
    }

    // 9. clock: unsynced, or off by the alert threshold (5 s) or more.
    const c = input.clock;
    if (c.measured && (c.synced === false || (c.offsetMs !== null && Math.abs(c.offsetMs) >= EDGE_CLOCK_WARN_MAX_OFFSET_MS))) {
        out.push(
            problem('clock', 'clock', since.at('clock', nowMs), null, null, { synced: c.synced === true, offsetMs: c.offsetMs }, ['check-internet'], [act('run-checks-again', true)]),
        );
    }

    // 10. held captures not uploaded (user decision 2026-10-04): a capture waits and the last upload failed. `sinceMs`
    // is when the verdict first saw it (every retry moves the error's own time).
    const held = input.heldCaptures;
    if (held.pending > 0 && held.lastError !== null) {
        out.push(
            problem(
                'captures-not-uploaded',
                'captures-not-uploaded',
                since.at('captures-not-uploaded', nowMs),
                null,
                null,
                { pending: held.pending, lastError: held.lastError },
                ['contact-support'],
                [act('download-diagnostics', true)],
            ),
        );
    }

    since.retain(new Set(out.map(p => p.id)));
    return sortVerdictProblems(out);
}

/** `critical` if a critical problem is listed, `problem` if any other, `ok` if none. */
export function verdictOverall(problems: readonly Pick<VerdictProblem, 'severity'>[]): VerdictOverall {
    if (problems.some(p => p.severity === 'critical')) return 'critical';
    return problems.length ? 'problem' : 'ok';
}

/** DR12: the Connectivity Log opens on Problems while the verdict is red (a critical or bad problem). */
export function logFilterDefaultOf(problems: readonly Pick<VerdictProblem, 'severity'>[]): ConnectivityLogFilter {
    return problems.some(p => p.severity === 'critical' || p.severity === 'bad') ? 'problems' : 'all';
}
