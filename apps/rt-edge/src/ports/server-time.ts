/**
 * etabella.net time on the box (token EDGE_SERVER_TIME, provided by the global EdgeCoreModule; user decision
 * 2026-10-05): new lines carry etabella.net's time — the box PC's clock corrected by the offset the uplink measures at
 * every hello — formatted in the session's pinned zone, the same way a session fed straight to etabella.net is.
 *
 * - `raw()` is the box PC's own clock (EDGE_RAW_CLOCK). The uplink measures the cloud offset on it; measured on the
 *   corrected clock the offset would shrink to 0 and stop correcting anything. ops reads it for how far the PC clock
 *   itself is off.
 * - `now()` is raw minus the correction in use (EDGE_CLOCK is `() => serverTime.now()`): the whole box follows it, so
 *   line stamps and the "No new lines" / "feed stopped" checks read the same clock.
 * - The correction comes from the lowest-round-trip reading of the last 5 hellos (one each minute); a reply slower than
 *   5 s is not used. A correction that moves time forward applies at once; one that moves it back is applied at most
 *   100 ms per second, so line times never stall (the journal never lets a stamp go back: a jump back would give a
 *   run of lines the same time). The very first reading, while the box still follows its own clock, applies at once:
 *   "switch to etabella.net time as soon as it arrives" (user decision 2026-10-05) — and so does the first reading
 *   after a restart that does not confirm the saved correction (more than SERVER_TIME_SAVED_CONFIRM_MS from it): that
 *   one was never checked in this run (review 2026-10-05).
 * - With no etabella.net time since the start and nothing saved, it is the box clock itself (source 'box'): lines
 *   then use the box's own clock and the Status page warns "No etabella.net time yet".
 * - A jump of the PC clock (Windows setting its clock, someone changing it) is folded into the correction on EVERY
 *   read — `now()`, `status()`, `observe()` before it keeps the reading — against a monotonic clock, so etabella.net
 *   time does not move with it, not even for the chunks stamped before the uplink's next tick (review 2026-10-05).
 *   The tick (`checkJump`) stays a heartbeat: it reports the jumps folded since the last tick (for the log) and saves
 *   the progress of a backward correction.
 * - The correction IN USE and the one it moves to are saved in edge.sqlite (state `clockCorrection`) and restored as
 *   the database opens: a box that restarts offline follows the saved one (source 'saved') until etabella.net answers
 *   again, and a restart during a backward correction carries on applying it instead of jumping back (review
 *   2026-10-05). A saved row whose reading lies in the PC clock's future (the clock went back while rt-edge was not
 *   running: set by hand, a flat CMOS battery) is not used: the box clock.
 */
import type { EdgeClock } from './tokens';

/** Which clock `now()` follows: a reading from etabella.net, a saved one (restart), or the box PC's own clock. */
export type ServerTimeSource = 'etabella' | 'saved' | 'box';

/** One hello's reading (uplink): the raw box clock minus etabella.net's `serverNowMs`, RTT-corrected. */
export interface ServerTimeSample {
    readonly offsetMs: number;
    readonly rttMs: number;
    /** Raw box clock when the reply came. */
    readonly atMs: number;
}

/** What the box keeps across a restart (state `clockCorrection`, one row). */
export interface SavedServerTime {
    /** The correction IN USE when it was saved (raw box clock minus etabella.net), ms. */
    readonly offsetMs: number;
    /** The correction it moves to: above `offsetMs` while a backward one is still being applied, else equal. */
    readonly targetMs: number;
    /** Raw box clock of the last etabella.net reading behind it. */
    readonly checkedAtMs: number;
    /** Round trip of the reading in use; null when unknown. */
    readonly rttMs: number | null;
}

/** Where the correction is saved (StatePort `clockCorrection`). `save(null)` forgets it. */
export interface ServerTimeStore {
    load(): SavedServerTime | null;
    save(saved: SavedServerTime | null): void;
}

export interface ServerTimeStatus {
    readonly source: ServerTimeSource;
    /** The correction in use now (raw minus etabella.net), ms; 0 for 'box'. */
    readonly correctionMs: number;
    /** The correction it moves to: equal to `correctionMs` unless a backward one is still being applied. */
    readonly targetMs: number;
    /** Raw box clock of the newest etabella.net reading (the saved one's for 'saved'); null for 'box'. */
    readonly checkedAtMs: number | null;
}

/** Readings kept: the correction uses the lowest round trip of the last 5 hellos. */
export const SERVER_TIME_SAMPLES = 5;
/** A hello reply slower than this is not used. */
export const SERVER_TIME_MAX_RTT_MS = 5_000;
/** A backward correction is applied at most this many ms per second. */
export const SERVER_TIME_SLEW_MS_PER_SEC = 100;
/** A difference this big between the PC clock and the monotonic clock since the last read is a PC clock jump. */
export const SERVER_TIME_JUMP_MS = 1_000;
/**
 * The first reading after a restart confirms the saved correction when it is at most this far from it (the slow
 * change back then goes on); further off, the saved one was wrong and the reading applies at once (review 2026-10-05).
 */
export const SERVER_TIME_SAVED_CONFIRM_MS = 5_000;
/** While a backward correction is being applied, the uplink's tick saves its progress this often (PC clock). */
export const SERVER_TIME_SAVE_EVERY_MS = 5_000;

const monotonicNow = (): number => performance.now();
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

export class ServerTime {
    private samples: ServerTimeSample[] = [];
    private source: ServerTimeSource = 'box';
    /** Correction at `baseRaw`; a backward change moves from it towards `target`. */
    private base = 0;
    private baseRaw = 0;
    private target = 0;
    private checkedAtMs: number | null = null;
    /** Round trip of the reading behind the correction (saved with it); null when unknown. */
    private rttMs: number | null = null;
    private store: ServerTimeStore | null = null;
    private onStoreError: (err: unknown) => void = () => undefined;
    /** PC and monotonic clock at the last read: a jump is a difference between the two since then. */
    private lastRaw: number | null = null;
    private lastMono: number | null = null;
    /** Jumps folded since the last tick (`checkJump` reports them). */
    private jumpedMs = 0;
    /** The correction in use last saved, and the PC clock then (null: nothing saved in this run). */
    private savedOffsetMs: number | null = null;
    private savedAtRaw = 0;

    constructor(
        private readonly rawClock: EdgeClock,
        private readonly monotonic: () => number = monotonicNow,
    ) {}

    /** The box PC's own clock (EDGE_RAW_CLOCK). */
    raw(): number {
        return this.rawClock();
    }

    /** etabella.net time (EDGE_CLOCK): the raw clock minus the correction in use; always whole ms. */
    now(): number {
        const raw = this.rawClock();
        this.foldJump(raw);
        return raw - this.correctionAt(raw);
    }

    status(): ServerTimeStatus {
        const raw = this.rawClock();
        this.foldJump(raw);
        return { source: this.source, correctionMs: this.correctionAt(raw), targetMs: this.target, checkedAtMs: this.checkedAtMs };
    }

    /**
     * Restore the saved correction (when nothing newer is in use) and save every later change there. The state module
     * calls it as edge.sqlite opens, before the kernel stamps a line. A store that throws never stops the correction.
     */
    attach(store: ServerTimeStore, onError?: (err: unknown) => void): void {
        this.store = store;
        if (onError) this.onStoreError = onError;
        let saved: SavedServerTime | null = null;
        try {
            saved = store.load();
        } catch (err) {
            this.onStoreError(err);
        }
        if (this.source !== 'box' || !saved || !finite(saved.offsetMs) || !finite(saved.checkedAtMs)) return;
        const raw = this.rawClock();
        // The reading lies in the PC clock's future: the clock went back while rt-edge was not running, and the
        // correction no longer fits it. The box clock until etabella.net answers (review 2026-10-05).
        if (saved.checkedAtMs > raw) return;
        const inUse = Math.round(saved.offsetMs);
        const target = finite(saved.targetMs) ? Math.round(saved.targetMs) : inUse;
        this.source = 'saved';
        // Carry on from the correction in use: a backward one still being applied goes on at 100 ms/s from there, so a
        // restart never moves etabella.net time back.
        if (target > inUse) {
            this.base = inUse;
            this.baseRaw = raw;
            this.target = target;
        } else {
            this.setAtOnce(target, raw);
        }
        this.checkedAtMs = saved.checkedAtMs;
        this.rttMs = finite(saved.rttMs) ? saved.rttMs : null;
        this.savedOffsetMs = inUse;
        this.savedAtRaw = raw;
    }

    /** One hello's reading. False when it is not used (a round trip over 5 s, or not a number). */
    observe(sample: ServerTimeSample): boolean {
        if (!sample || !finite(sample.offsetMs) || !finite(sample.rttMs) || !finite(sample.atMs) || sample.rttMs < 0 || sample.rttMs > SERVER_TIME_MAX_RTT_MS) return false;
        const raw = this.rawClock();
        // A jump since the last read moves the readings kept into the PC clock's new frame BEFORE this one (measured in
        // that frame) joins them; the tick then finds nothing left to fold.
        this.foldJump(raw);
        this.samples.push({ offsetMs: Math.round(sample.offsetMs), rttMs: sample.rttMs, atMs: sample.atMs });
        if (this.samples.length > SERVER_TIME_SAMPLES) this.samples.splice(0, this.samples.length - SERVER_TIME_SAMPLES);
        // Lowest round trip; of equal ones the newest.
        const best = this.samples.reduce((a, b) => (b.rttMs <= a.rttMs ? b : a));
        const unconfirmed = this.source === 'saved' && Math.abs(best.offsetMs - this.target) > SERVER_TIME_SAVED_CONFIRM_MS;
        if (this.source === 'box' || unconfirmed) this.setAtOnce(best.offsetMs, raw);
        else this.moveTo(best.offsetMs, raw);
        // The newest reading says when etabella.net time was last checked (never moved back by an older one).
        this.checkedAtMs = this.source === 'etabella' && this.checkedAtMs !== null ? Math.max(this.checkedAtMs, sample.atMs) : sample.atMs;
        this.source = 'etabella';
        this.rttMs = best.rttMs;
        this.persistNow(raw);
        return true;
    }

    /**
     * The uplink's tick (a heartbeat): folds a jump of the PC clock since the last read, as every read does, and
     * returns the jumps folded since the last tick (0 when none, or while the box follows its own clock) for the log.
     * While a backward correction is being applied it saves its progress every SERVER_TIME_SAVE_EVERY_MS, and once
     * more when it is complete.
     */
    checkJump(): number {
        const raw = this.rawClock();
        this.foldJump(raw);
        const jumped = this.jumpedMs;
        this.jumpedMs = 0;
        if (this.source !== 'box' && this.savedOffsetMs !== null) {
            const inUse = this.correctionAt(raw);
            if (inUse !== this.savedOffsetMs && (inUse >= this.target || raw - this.savedAtRaw >= SERVER_TIME_SAVE_EVERY_MS)) this.persistNow(raw);
        }
        return jumped;
    }

    /**
     * Back to the box clock until the next reading, and forget the saved correction: ops calls it after it stepped
     * the box's OS clock to the cloud's time (production Linux only), so the correction is not applied twice.
     */
    reset(): void {
        const raw = this.rawClock();
        this.samples = [];
        this.source = 'box';
        this.setAtOnce(0, raw);
        this.checkedAtMs = null;
        this.rttMs = null;
        this.lastRaw = raw;
        this.lastMono = this.monotonic();
        this.jumpedMs = 0;
        this.savedOffsetMs = null;
        this.persist(null);
    }

    /**
     * A jump of the PC clock since the last read (it moved more or less than the monotonic clock, by 1 s or more) is
     * folded into the correction at once, so etabella.net time does not move with it. Nothing to fold while the box
     * follows its own clock (it IS the box clock).
     */
    private foldJump(raw: number): void {
        const mono = this.monotonic();
        const prevRaw = this.lastRaw;
        const prevMono = this.lastMono;
        this.lastRaw = raw;
        this.lastMono = mono;
        if (prevRaw === null || prevMono === null || this.source === 'box') return;
        const jump = Math.round(raw - prevRaw - (mono - prevMono));
        if (Math.abs(jump) < SERVER_TIME_JUMP_MS) return;
        this.base += jump;
        this.baseRaw += jump;
        this.target += jump;
        this.samples = this.samples.map(s => ({ ...s, offsetMs: s.offsetMs + jump, atMs: s.atMs + jump }));
        if (this.checkedAtMs !== null) this.checkedAtMs += jump;
        this.jumpedMs += jump;
        this.persistNow(raw);
    }

    private correctionAt(raw: number): number {
        if (this.base >= this.target) return this.target;
        const moved = this.base + Math.floor((Math.max(0, raw - this.baseRaw) * SERVER_TIME_SLEW_MS_PER_SEC) / 1_000);
        return Math.min(this.target, moved);
    }

    private setAtOnce(correction: number, raw: number): void {
        this.base = correction;
        this.target = correction;
        this.baseRaw = raw;
    }

    /** Forward (a smaller correction) at once; backward from where it is now, at most 100 ms per second. */
    private moveTo(correction: number, raw: number): void {
        const current = this.correctionAt(raw);
        if (correction <= current) {
            this.setAtOnce(correction, raw);
            return;
        }
        this.base = current;
        this.baseRaw = raw;
        this.target = correction;
    }

    /** Save the correction in use at `raw` and the one it moves to (never the target alone: a restart would jump). */
    private persistNow(raw: number): void {
        if (this.source === 'box' || this.checkedAtMs === null) return;
        const inUse = this.correctionAt(raw);
        this.savedOffsetMs = inUse;
        this.savedAtRaw = raw;
        this.persist({ offsetMs: inUse, targetMs: this.target, checkedAtMs: this.checkedAtMs, rttMs: this.rttMs });
    }

    private persist(saved: SavedServerTime | null): void {
        if (!this.store) return;
        try {
            this.store.save(saved);
        } catch (err) {
            this.onStoreError(err);
        }
    }
}
