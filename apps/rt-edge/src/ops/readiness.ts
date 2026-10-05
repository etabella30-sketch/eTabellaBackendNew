/**
 * "Ready for today" (DR15; CONTRACTS.md §8.3): the checks, each a tick or a fix-it action, evaluated from facts ops
 * gathered (pure; specs beside). The order is READINESS_KEYS.
 *
 * DR23 (2026-10-01, email sign-in only for v1): with `features.operatorCode` off — the v1 default — there is NO
 * `operator-code-issued` line: 7 checks, and `needAttention` / `total` (and so the operator chip's `readinessToDo`)
 * count only those 7. Nothing here offers or requires an operator code then. With the switch on, the eighth line
 * comes back in its READINESS_KEYS place.
 */
import {
    EDGE_CLOCK_FAR_OFFSET_MS,
    EDGE_DISK_ARM_MIN_MB,
    EDGE_DISK_READY_MIN_MB,
    EDGE_SAVED_TIME_WARN_AFTER_MS,
    EdgeCheckLevel,
    EdgeInternetStatus,
    EdgeLinkFailure,
    EdgeTimeSource,
    READINESS_KEYS,
    ReadinessAction,
    ReadinessDetailMap,
    ReadinessItem,
    ReadinessKey,
    ReadinessSessionRef,
    TransmitterLinkState,
    TransmitterMode,
} from '../contracts';
import { isLinkUp } from './status';

/** A session as readiness needs it. */
export interface ReadinessSessionFacts extends ReadinessSessionRef {
    /** Its start date in its own zone is today (or it has no date but is live now). */
    readonly isToday: boolean;
    readonly firstLineAtMs: number | null;
    /** The kernel reports it live (lines received, not ended) right now. */
    readonly liveNow: boolean;
}

/** A clock reading as the checks see it (null fields = not measured). */
export interface ClockFacts {
    /** The PC clock itself reads synced. */
    readonly synced: boolean | null;
    /** The PC clock's own offset from the reference clock. */
    readonly offsetMs: number | null;
    /** Which clock new lines follow (user decision 2026-10-05). */
    readonly source: EdgeTimeSource;
    /** How old the etabella.net reading behind the correction is (PC clock); null for `box` and `chrony`. */
    readonly readingAgeMs: number | null;
}

export interface ReadinessInput {
    /** Today in the box zone (YYYY-MM-DD). */
    readonly today: string;
    /** Box-local day of an instant (`boxDay(ms, BoxConfig.box.timeZone)`). */
    readonly dayOf: (ms: number) => string;
    readonly linkFailure: EdgeLinkFailure | null;
    readonly lastCloudContactAtMs: number | null;
    /** Every unpurged, not-deleted session on the box. */
    readonly sessions: readonly ReadinessSessionFacts[];
    readonly assignmentsSyncedAtMs: number | null;
    /** Distinct active people in the box rosters, cases with a roster, and the box's cases. */
    readonly roster: { readonly people: number; readonly casesWithRoster: number; readonly boxCases: number };
    readonly transmitter: { readonly state: TransmitterLinkState; readonly mode: TransmitterMode };
    readonly internet: EdgeInternetStatus;
    readonly etabellaReachable: boolean;
    /**
     * While etabella.net is NOT reachable: since when ("Can't reach eTabella since 10:42"); the internet's own
     * `sinceMs` is used while the internet is down. Ignored while reachable (the detail then says null).
     */
    readonly unreachableSinceMs?: number | null;
    /** `BoxConfig.features.operatorCode` (DR23: off by default; off = no operator-code line at all). */
    readonly operatorCodeOn: boolean;
    readonly operatorCode: { readonly issued: boolean; readonly issuedAtMs: number | null; readonly mintedByName: string | null };
    /** The viewer is an ONLINE case admin (or super-admin) and the internet is up: the code can be minted here. */
    readonly canIssueOperatorCode: boolean;
    /** Absolute RT Production URL on etabella.net. */
    readonly rtProductionUrl: string;
    /** Free MiB; null when not measured. */
    readonly diskFreeMB: number | null;
    readonly clock: ClockFacts;
}

export interface ReadinessEvaluation {
    readonly items: readonly ReadinessItem[];
    readonly needAttention: number;
    readonly total: number;
    readonly landing: boolean;
    readonly firstLiveAtMs: number | null;
}

const action = (kind: ReadinessAction['kind'], primary = false, href: string | null = null): ReadinessAction => ({ kind, primary, href });

type ItemOf<K extends ReadinessKey> = Extract<ReadinessItem, { key: K }>;

function item<K extends ReadinessKey>(key: K, ok: boolean, level: EdgeCheckLevel, detail: ReadinessDetailMap[K], fix: ReadinessAction): ItemOf<K> {
    return { key, ok, level: ok ? 'ok' : level, detail, action: ok ? null : fix } as unknown as ItemOf<K>;
}

/** Disk: ok from EDGE_DISK_READY_MIN_MB, warn from EDGE_DISK_ARM_MIN_MB, else (or unmeasured) bad. */
export function diskLevel(freeMB: number | null): EdgeCheckLevel {
    if (freeMB === null || !Number.isFinite(freeMB)) return 'bad';
    if (freeMB >= EDGE_DISK_READY_MIN_MB) return 'ok';
    if (freeMB >= EDGE_DISK_ARM_MIN_MB) return 'warn';
    return 'bad';
}

/**
 * Clock (user decision 2026-10-05: new lines follow etabella.net time): bad from 60 s off whatever the lines follow;
 * else ok while they follow etabella.net (a fresh reading, or a saved correction under 24 h old) or chrony keeps the
 * PC clock synced; warn on the box's own clock ("No etabella.net time yet") or a saved correction over 24 h old.
 * Windows Time's "not synced" stays a fact about the PC clock (`synced`) and no longer decides the level.
 */
export function clockLevel(clock: ClockFacts): EdgeCheckLevel {
    if (clock.offsetMs !== null && Number.isFinite(clock.offsetMs) && Math.abs(clock.offsetMs) >= EDGE_CLOCK_FAR_OFFSET_MS) return 'bad';
    switch (clock.source) {
        case 'etabella':
        case 'chrony':
            return 'ok';
        case 'saved':
            return clock.readingAgeMs !== null && clock.readingAgeMs > EDGE_SAVED_TIME_WARN_AFTER_MS ? 'warn' : 'ok';
        default:
            return 'warn';
    }
}

/** Earliest session start, then name: "Day 3 — Morning 10:00, …". */
const bySessionStart = (a: ReadinessSessionRef, b: ReadinessSessionRef): number =>
    (a.startAtMs ?? Number.POSITIVE_INFINITY) - (b.startAtMs ?? Number.POSITIVE_INFINITY) ||
    a.sessionName.localeCompare(b.sessionName) ||
    a.nSesid.localeCompare(b.nSesid);

export function evaluateReadiness(input: ReadinessInput): ReadinessEvaluation {
    const items: ReadinessItem[] = [];

    // 1. box linked: confirmed identity, no link failure, and the cloud seen today.
    const linked = input.linkFailure === null;
    const seenToday = input.lastCloudContactAtMs !== null && input.dayOf(input.lastCloudContactAtMs) === input.today;
    const terminal = input.linkFailure === 'revoked' || input.linkFailure === 'quarantined';
    items.push(
        item(
            'box-linked',
            linked && seenToday,
            'bad',
            { linked, lastCloudContactAtMs: input.lastCloudContactAtMs, failure: input.linkFailure },
            terminal ? action('download-diagnostics') : action('run-checks-again'),
        ),
    );

    // 2. today's sessions on the box.
    const todays = input.sessions.filter(s => s.isToday || s.liveNow);
    const refs: ReadinessSessionRef[] = todays
        .map(s => ({ nSesid: s.nSesid, sessionName: s.sessionName, caseName: s.caseName, startAtMs: s.startAtMs, tz: s.tz }))
        .sort(bySessionStart);
    items.push(
        item(
            'sessions-today',
            refs.length >= 1,
            'warn',
            { count: refs.length, sessions: refs, assignmentsSyncedAtMs: input.assignmentsSyncedAtMs },
            action('open-rt-production', false, input.rtProductionUrl),
        ),
    );

    // 3. case team lists stored: every box case has a roster, synced today.
    const syncedToday = input.assignmentsSyncedAtMs !== null && input.dayOf(input.assignmentsSyncedAtMs) === input.today;
    const rostersComplete = input.roster.boxCases > 0 && input.roster.casesWithRoster >= input.roster.boxCases;
    items.push(
        item(
            'team-lists',
            syncedToday && rostersComplete,
            'warn',
            { people: input.roster.people, cases: input.roster.casesWithRoster, syncedAtMs: input.assignmentsSyncedAtMs },
            action('run-checks-again'),
        ),
    );

    // 4. transmitter connected.
    items.push(
        item(
            'transmitter-connected',
            isLinkUp(input.transmitter.state),
            'bad',
            { state: input.transmitter.state, mode: input.transmitter.mode },
            action('open-transmitter'),
        ),
    );

    // 5. eTabella reachable (DR16: the detail keeps "Internet unavailable" apart from "Can't reach eTabella"; `sinceMs`
    //    is when it stopped being reachable: the internet's down time, else when etabella.net stopped answering).
    const unreachableSince = input.etabellaReachable ? null : input.internet.state === 'down' ? input.internet.sinceMs : input.unreachableSinceMs ?? null;
    items.push(
        item(
            'etabella-reachable',
            input.etabellaReachable,
            'bad',
            { internet: input.internet.state, reachable: input.etabellaReachable, sinceMs: unreachableSince },
            action('open-network-checks'),
        ),
    );

    // 6. today's operator code issued (DR7): only while the box has the operator code switched on (DR23); mintable
    //    here only by an online case admin with etabella.net reachable.
    if (input.operatorCodeOn) {
        items.push(
            item(
                'operator-code-issued',
                input.operatorCode.issued,
                'warn',
                { issued: input.operatorCode.issued, issuedAtMs: input.operatorCode.issuedAtMs, mintedByName: input.operatorCode.mintedByName },
                input.canIssueOperatorCode ? action('issue-operator-code', true) : action('open-rt-production', false, input.rtProductionUrl),
            ),
        );
    }

    // 7. disk free.
    const disk = diskLevel(input.diskFreeMB);
    items.push(
        item(
            'disk-free',
            disk === 'ok',
            disk,
            { freeMB: input.diskFreeMB ?? 0, minFreeMB: EDGE_DISK_READY_MIN_MB },
            action('download-diagnostics'),
        ),
    );

    // 8. clock in sync.
    const clock = clockLevel(input.clock);
    items.push(
        item(
            'clock-in-sync',
            clock === 'ok',
            clock,
            { synced: input.clock.synced === true, offsetMs: input.clock.offsetMs, source: input.clock.source },
            action('run-checks-again'),
        ),
    );

    // Landing (DR15): until the day's first session goes live.
    const liveTimes = input.sessions
        .filter(s => s.firstLineAtMs !== null && (s.liveNow || input.dayOf(s.firstLineAtMs) === input.today))
        .map(s => s.firstLineAtMs as number);
    const firstLiveAtMs = liveTimes.length ? Math.min(...liveTimes) : null;
    const landing = firstLiveAtMs === null && !input.sessions.some(s => s.liveNow);

    const ordered = READINESS_KEYS.map(key => items.find(i => i.key === key)).filter((i): i is ReadinessItem => i !== undefined);
    return {
        items: ordered,
        needAttention: ordered.filter(i => !i.ok).length,
        total: ordered.length,
        landing,
        firstLiveAtMs,
    };
}
