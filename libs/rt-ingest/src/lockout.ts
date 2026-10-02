/**
 * Listen-mode handshake lockout (spec §3.2, critique S20).
 *
 * The exact rules:
 *  - Only a WRONG PASSWORD for a username that has a LIVE ROUTE counts.
 *  - 5 such failures within one minute for one (IP, user) block that pair
 *    for 5 minutes.
 *  - Handshakes from a blocked pair are dropped (even with the right
 *    password) and NEVER extend the block; they are not counted as failures.
 *  - Unknown usernames never lock anyone out. They count against a per-IP
 *    limit of 30 handshakes per minute; the excess is dropped without a
 *    per-attempt alert. More than 100 unknown-username handshakes from one IP
 *    in an hour raise HANDSHAKE_FLOOD (once per IP per hour).
 *  - D3: an unknown username is refused and alerted (UNKNOWN_LOGIN); nothing
 *    is kept. This class only decides refuse-and-alert vs drop.
 *  - The lockout state is reported (e.status, RT Production) and an Unlock
 *    action clears it.
 *
 * Parallel handshakes: a password is verified asynchronously (scrypt), so the
 * listener RESERVES a verification slot before verifying (`reserve`) and
 * settles it after (`settle`). A verification in flight counts against the
 * pair's budget as if it had failed: at most `failuresToBlock` wrong
 * passwords per window are ever verified for one (IP, user), however many
 * handshakes arrive together. The excess is dropped unverified ('busy'), and
 * so is anything over `maxVerifyPerIp` verifications in flight from one IP.
 * Neither counts as a failure nor as a drop "while blocked".
 *
 * Passwords never reach this class.
 */
import { AlertSink, Clock, safeAlert, systemClock } from './types';

export interface LockoutPolicy {
    /** wrong passwords within `failureWindowMs` that block an (IP, user) pair */
    failuresToBlock: number;
    failureWindowMs: number;
    blockMs: number;
    /** unknown-username handshakes per IP processed per `unknownWindowMs`; the excess is dropped */
    unknownPerIpLimit: number;
    unknownWindowMs: number;
    /** unknown-username handshakes per IP per `floodWindowMs` above which HANDSHAKE_FLOOD fires */
    floodThreshold: number;
    floodWindowMs: number;
    /** bound on tracked (IP, user) pairs and IPs, so a scan cannot grow memory without limit */
    maxTrackedKeys: number;
    /** password verifications in flight at once from one IP (any users); the excess is dropped unverified */
    maxVerifyPerIp: number;
}

export const DEFAULT_LOCKOUT_POLICY: Readonly<LockoutPolicy> = Object.freeze({
    failuresToBlock: 5,
    failureWindowMs: 60_000,
    blockMs: 5 * 60_000,
    unknownPerIpLimit: 30,
    unknownWindowMs: 60_000,
    floodThreshold: 100,
    floodWindowMs: 60 * 60_000,
    maxTrackedKeys: 10_000,
    maxVerifyPerIp: 8,
});

export interface LockoutCheck {
    blocked: boolean;
    /** epoch ms the block ends (when blocked) */
    until?: number;
}

export interface FailureResult {
    /** the pair is blocked after this failure */
    blocked: boolean;
    /** this failure started the block */
    justBlocked: boolean;
    /** failures inside the current window (including this one) */
    failures: number;
    until?: number;
}

export interface UnknownVerdict {
    /** 'refuse-alert': refuse and raise UNKNOWN_LOGIN (D3); 'drop': over the per-IP limit, refuse silently */
    action: 'refuse-alert' | 'drop';
    /** this attempt crossed the hourly flood threshold (HANDSHAKE_FLOOD raised) */
    flood: boolean;
    lastHour: number;
}

/** A reserved password verification; hand it back to `settle` exactly once. */
export interface VerifyTicket {
    readonly ip: string;
    readonly user: string;
}

export type ReserveResult =
    | { ok: true; ticket: VerifyTicket }
    /** the pair is blocked: drop without verifying (counted in droppedWhileBlocked) */
    | { ok: false; reason: 'blocked'; until: number }
    /** the pair's failure budget is taken by verifications in flight, or the IP has too many in flight: drop without verifying */
    | { ok: false; reason: 'busy'; inFlight: number };

/** 'uncounted': verified but not a lockout failure (no live route), or the verification itself errored */
export type VerifyOutcome = 'success' | 'failure' | 'uncounted';

export interface LockoutEntry {
    ip: string;
    user: string;
    /** failures inside the current window */
    failures: number;
    blockedUntil: number | null;
    /** handshakes dropped (never verified) because the pair was blocked */
    droppedWhileBlocked: number;
    /** handshakes dropped (never verified) because the pair's budget was taken by verifications in flight */
    droppedBusy: number;
    /** verifications in flight */
    inFlight: number;
    nSesid?: string;
}

export interface UnknownIpEntry {
    ip: string;
    lastMinute: number;
    lastHour: number;
    dropped: number;
}

interface PairState {
    ip: string;
    user: string;
    failures: number[];
    blockedUntil: number | null;
    dropped: number;
    busy: number;
    inFlight: number;
    nSesid?: string;
    touched: number;
}

class Ticket implements VerifyTicket {
    settled = false;
    constructor(
        readonly ip: string,
        readonly user: string,
    ) {}
}

interface IpState {
    ip: string;
    /** processed (refused + alerted) unknown handshakes, newest last, at most `unknownPerIpLimit` kept */
    processed: number[];
    /** per-minute buckets of every unknown handshake (processed or dropped) for the hourly count */
    buckets: Map<number, number>;
    dropped: number;
    floodAlertedAt: number | null;
    touched: number;
}

const SEP = '\u0000';

export class HandshakeLockout {
    readonly policy: LockoutPolicy;
    private readonly clock: Clock;
    private readonly alert: AlertSink;
    private readonly pairs = new Map<string, PairState>();
    private readonly ips = new Map<string, IpState>();
    /** verifications in flight per IP (entries removed at zero; bounded by open handshakes) */
    private readonly verifying = new Map<string, number>();

    constructor(opts: { policy?: Partial<LockoutPolicy>; clock?: Clock; onAlert?: AlertSink } = {}) {
        this.policy = { ...DEFAULT_LOCKOUT_POLICY, ...(opts.policy ?? {}) };
        this.clock = opts.clock ?? systemClock;
        this.alert = safeAlert(opts.onAlert);
    }

    /**
     * Before verifying a known user's password: is this (IP, user) blocked?
     * A blocked handshake is dropped by the caller; it is counted as dropped
     * here and does not extend the block. (The listener uses `reserve`, which
     * also bounds verifications in flight.)
     */
    check(ip: string, user: string): LockoutCheck {
        const now = this.clock();
        const pair = this.pairs.get(pairKey(ip, user));
        if (!pair) return { blocked: false };
        this.expire(pair, now);
        if (pair.blockedUntil !== null) {
            pair.dropped += 1;
            pair.touched = now;
            return { blocked: true, until: pair.blockedUntil };
        }
        return { blocked: false };
    }

    /**
     * Reserve one password verification for (IP, user) BEFORE verifying. Refused
     * when the pair is blocked (a drop while blocked, never extending it), when
     * failures in the window plus verifications in flight already reach
     * `failuresToBlock` (so parallel handshakes cannot verify more guesses than
     * the rule allows), or when the IP has `maxVerifyPerIp` in flight. Every
     * granted ticket must be settled once.
     */
    reserve(ip: string, user: string): ReserveResult {
        const now = this.clock();
        const key = pairKey(ip, user);
        let pair = this.pairs.get(key);
        if (pair) {
            this.expire(pair, now);
            pair.touched = now;
            if (pair.blockedUntil !== null) {
                pair.dropped += 1;
                return { ok: false, reason: 'blocked', until: pair.blockedUntil };
            }
            if (pair.failures.length + pair.inFlight >= this.policy.failuresToBlock) {
                pair.busy += 1;
                return { ok: false, reason: 'busy', inFlight: pair.inFlight };
            }
        }
        const ipInFlight = this.verifying.get(ip) ?? 0;
        if (ipInFlight >= this.policy.maxVerifyPerIp) {
            if (pair) pair.busy += 1;
            return { ok: false, reason: 'busy', inFlight: ipInFlight };
        }
        if (!pair) {
            this.makeRoom(this.pairs, now);
            pair = newPair(ip, user, now);
            this.pairs.set(key, pair);
        }
        pair.inFlight += 1;
        this.verifying.set(ip, ipInFlight + 1);
        return { ok: true, ticket: new Ticket(ip, user) };
    }

    /**
     * Release a reserved verification with its outcome: 'failure' records a
     * wrong password (and may start the block), 'success' starts the window
     * over, 'uncounted' only frees the slot. A second settle is a no-op (null).
     */
    settle(ticket: VerifyTicket, outcome: VerifyOutcome, nSesid?: string): FailureResult | null {
        if (!(ticket instanceof Ticket) || ticket.settled) return null;
        ticket.settled = true;
        const left = (this.verifying.get(ticket.ip) ?? 1) - 1;
        if (left > 0) this.verifying.set(ticket.ip, left);
        else this.verifying.delete(ticket.ip);
        const key = pairKey(ticket.ip, ticket.user);
        const pair = this.pairs.get(key);
        if (pair && pair.inFlight > 0) pair.inFlight -= 1;
        if (outcome === 'failure') return this.recordFailure(ticket.ip, ticket.user, nSesid);
        if (outcome === 'success') {
            this.recordSuccess(ticket.ip, ticket.user);
            return null;
        }
        if (pair && this.idle(pair, this.clock())) this.pairs.delete(key);
        return null;
    }

    /** A wrong password for a username that has a live route. */
    recordFailure(ip: string, user: string, nSesid?: string): FailureResult {
        const now = this.clock();
        const key = pairKey(ip, user);
        let pair = this.pairs.get(key);
        if (!pair) {
            this.makeRoom(this.pairs, now);
            pair = newPair(ip, user, now);
            this.pairs.set(key, pair);
        }
        if (nSesid) pair.nSesid = nSesid;
        pair.touched = now;
        this.expire(pair, now);
        if (pair.blockedUntil !== null) {
            // A failure reported while blocked was verified, not dropped: it is neither counted nor allowed to extend
            // the block. (A verification granted by `reserve` cannot end here: in-flight ones hold the budget.)
            return { blocked: true, justBlocked: false, failures: pair.failures.length, until: pair.blockedUntil };
        }
        pair.failures.push(now);
        if (pair.failures.length >= this.policy.failuresToBlock) {
            pair.blockedUntil = now + this.policy.blockMs;
            const failures = pair.failures.length;
            pair.failures = [];
            this.alert({
                kind: 'LOCKOUT',
                tier: 'info',
                nSesid: pair.nSesid,
                user,
                peer: ip,
                message: `Eclipse login '${user}' from ${ip} locked for ${Math.round(this.policy.blockMs / 60_000)} min after ${failures} wrong passwords`,
                at: now,
                data: { until: pair.blockedUntil, failures },
            });
            return { blocked: true, justBlocked: true, failures, until: pair.blockedUntil };
        }
        return { blocked: false, justBlocked: false, failures: pair.failures.length };
    }

    /** A correct password: the pair's failure window starts over. A block is not lifted by success. */
    recordSuccess(ip: string, user: string): void {
        const key = pairKey(ip, user);
        const pair = this.pairs.get(key);
        if (!pair) return;
        const now = this.clock();
        this.expire(pair, now);
        if (pair.blockedUntil !== null) return;
        pair.failures = [];
        if (this.idle(pair, now)) this.pairs.delete(key);
    }

    /** A handshake whose username matches no route (D3): refuse + alert, or drop above the per-IP limit. */
    noteUnknown(ip: string): UnknownVerdict {
        const now = this.clock();
        let st = this.ips.get(ip);
        if (!st) {
            this.makeRoom(this.ips, now);
            st = { ip, processed: [], buckets: new Map(), dropped: 0, floodAlertedAt: null, touched: now };
            this.ips.set(ip, st);
        }
        st.touched = now;
        const minute = Math.floor(now / 60_000);
        st.buckets.set(minute, (st.buckets.get(minute) ?? 0) + 1);
        this.pruneBuckets(st, now);
        const lastHour = sumBuckets(st);

        let flood = false;
        if (lastHour > this.policy.floodThreshold && (st.floodAlertedAt === null || now - st.floodAlertedAt >= this.policy.floodWindowMs)) {
            st.floodAlertedAt = now;
            flood = true;
            this.alert({
                kind: 'HANDSHAKE_FLOOD',
                tier: 'P2',
                peer: ip,
                message: `${lastHour} Eclipse handshakes with unknown usernames from ${ip} in the last hour`,
                at: now,
                data: { lastHour },
            });
        }

        st.processed = st.processed.filter(t => now - t < this.policy.unknownWindowMs);
        if (st.processed.length >= this.policy.unknownPerIpLimit) {
            st.dropped += 1;
            return { action: 'drop', flood, lastHour };
        }
        st.processed.push(now);
        return { action: 'refuse-alert', flood, lastHour };
    }

    /**
     * Unlock action: clear blocks and failure counts matching the filter (all
     * when empty). Returns how many pairs were cleared. Verifications still in
     * flight keep their slots (they settle later).
     */
    unlock(filter: { ip?: string; user?: string; nSesid?: string } = {}): number {
        let n = 0;
        for (const [key, pair] of this.pairs) {
            if (filter.ip !== undefined && pair.ip !== filter.ip) continue;
            if (filter.user !== undefined && pair.user !== filter.user) continue;
            if (filter.nSesid !== undefined && pair.nSesid !== filter.nSesid) continue;
            n += 1;
            if (pair.inFlight > 0) {
                pair.failures = [];
                pair.blockedUntil = null;
                pair.dropped = 0;
                pair.busy = 0;
            } else {
                this.pairs.delete(key);
            }
        }
        return n;
    }

    /** Pairs with failures or an active block, for e.status and RT Production. */
    status(): LockoutEntry[] {
        const now = this.clock();
        const out: LockoutEntry[] = [];
        for (const [key, pair] of this.pairs) {
            this.expire(pair, now);
            if (pair.blockedUntil === null && !pair.failures.length) {
                if (this.idle(pair, now)) this.pairs.delete(key);
                continue;
            }
            out.push({
                ip: pair.ip,
                user: pair.user,
                failures: pair.failures.length,
                blockedUntil: pair.blockedUntil,
                droppedWhileBlocked: pair.dropped,
                droppedBusy: pair.busy,
                inFlight: pair.inFlight,
                nSesid: pair.nSesid,
            });
        }
        return out.sort((a, b) => (b.blockedUntil ?? 0) - (a.blockedUntil ?? 0) || a.ip.localeCompare(b.ip));
    }

    /** Verifications in flight from one IP (all users). */
    inFlight(ip: string): number {
        return this.verifying.get(ip) ?? 0;
    }

    /** IPs that sent unknown usernames recently. */
    unknownStatus(): UnknownIpEntry[] {
        const now = this.clock();
        const out: UnknownIpEntry[] = [];
        for (const [ip, st] of this.ips) {
            this.pruneBuckets(st, now);
            st.processed = st.processed.filter(t => now - t < this.policy.unknownWindowMs);
            const lastHour = sumBuckets(st);
            if (!lastHour) {
                this.ips.delete(ip);
                continue;
            }
            const minute = Math.floor(now / 60_000);
            out.push({ ip, lastMinute: st.buckets.get(minute) ?? 0, lastHour, dropped: st.dropped });
        }
        return out;
    }

    isBlocked(ip: string, user: string): boolean {
        const pair = this.pairs.get(pairKey(ip, user));
        if (!pair) return false;
        this.expire(pair, this.clock());
        return pair.blockedUntil !== null;
    }

    private expire(pair: PairState, now: number): void {
        if (pair.blockedUntil !== null && now >= pair.blockedUntil) {
            pair.blockedUntil = null;
            pair.failures = [];
            pair.dropped = 0;
            pair.busy = 0;
        }
        pair.failures = pair.failures.filter(t => now - t < this.policy.failureWindowMs);
    }

    /** Nothing left to remember about the pair (expire() first). */
    private idle(pair: PairState, now: number): boolean {
        this.expire(pair, now);
        return pair.blockedUntil === null && !pair.failures.length && pair.inFlight === 0;
    }

    private pruneBuckets(st: IpState, now: number): void {
        const oldest = Math.floor((now - this.policy.floodWindowMs) / 60_000);
        for (const minute of st.buckets.keys()) if (minute <= oldest) st.buckets.delete(minute);
    }

    /** Keep the maps bounded: drop idle entries first, never an active block or a pair with verifications in flight. */
    private makeRoom<T extends { touched: number }>(map: Map<string, T>, now: number): void {
        if (map.size < this.policy.maxTrackedKeys) return;
        const kept = (value: T): boolean => {
            const pair = value as unknown as Partial<PairState>;
            return (typeof pair.blockedUntil === 'number' && pair.blockedUntil > now) || (pair.inFlight ?? 0) > 0;
        };
        for (const [key, value] of map) {
            if (kept(value)) continue;
            if (now - value.touched > Math.max(this.policy.failureWindowMs, this.policy.unknownWindowMs)) map.delete(key);
        }
        if (map.size < this.policy.maxTrackedKeys) return;
        const victims = [...map.entries()].filter(([, v]) => !kept(v)).sort((a, b) => a[1].touched - b[1].touched);
        for (const [key] of victims.slice(0, Math.max(1, map.size - this.policy.maxTrackedKeys + 1))) map.delete(key);
    }
}

function pairKey(ip: string, user: string): string {
    return `${ip}${SEP}${user}`;
}

function newPair(ip: string, user: string, now: number): PairState {
    return { ip, user, failures: [], blockedUntil: null, dropped: 0, busy: 0, inFlight: 0, touched: now };
}

function sumBuckets(st: IpState): number {
    let n = 0;
    for (const v of st.buckets.values()) n += v;
    return n;
}
