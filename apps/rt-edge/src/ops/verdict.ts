/**
 * The live verdict (DR12, DR16; CONTRACTS.md §8.4): every problem, ranked worst first by VERDICT_KINDS
 * (recording to disk failed → box not linked → disk low → recovering after restart → cloud refused the history (D19)
 * → feed stopped → internet unavailable → clock), and the green "Reconnected · gap A–B" recoveries kept until
 * dismissed. Pure builders plus two small stateful helpers (`ProblemClock` for stable `sinceMs`, `FeedIncidents`
 * for feed drops and reconnects); specs beside.
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
    };
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

    // 1. box not linked.
    if (input.linkFailure !== null) {
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

    // 5. feed stopped, per open incident.
    const tx = input.transmitter;
    for (const incident of input.feedIncidents) {
        if (!names.has(incident.nSesid)) continue;
        const id = `feed-stopped:${incident.nSesid}:${incident.feedStoppedAtMs}`;
        const splitOfferedFromMs = incident.feedStoppedAtMs + EDGE_TIMING.splitOfferAfterMs;
        const actions: VerdictAction[] = [];
        if (tx.mode === 'dial') {
            if (tx.hasDialAddress && !isLinkUp(tx.linkState)) actions.push(act('reconnect', true, { stateVersion: tx.stateVersion }));
            actions.push(act('open-transmitter', actions.length === 0));
        } else {
            actions.push(act('show-to-reporter', true, { nSesid: incident.nSesid }));
            actions.push(act('open-transmitter'));
        }
        if (nowMs >= splitOfferedFromMs) actions.push(act('split-to-cloud-info'));
        const hints: VerdictHint[] =
            tx.mode === 'dial' ? ['check-eclipse-output', 'check-cable', 'check-transmitter-address'] : ['check-eclipse-output', 'check-cable', 'check-reporter-login'];
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
                },
                hints,
                actions,
            ),
        );
    }

    // 6. internet unavailable ("Can't reach eTabella" with the internet up is the cloud chip's, not this kind).
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

    // 7. clock: unsynced, or off by the alert threshold (5 s) or more.
    const c = input.clock;
    if (c.measured && (c.synced === false || (c.offsetMs !== null && Math.abs(c.offsetMs) >= EDGE_CLOCK_WARN_MAX_OFFSET_MS))) {
        out.push(
            problem('clock', 'clock', since.at('clock', nowMs), null, null, { synced: c.synced === true, offsetMs: c.offsetMs }, ['check-internet'], [act('run-checks-again', true)]),
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
