import { EDGE_BOX_CLOCK_SKEW_SEC, EDGE_JTI_MAX_LENGTH, EDGE_RENEWAL_CEILING_SEC, EDGE_UUID_RE } from './constants';
import { EdgeRevocationCheck } from './verify';

/**
 * Revocation (spec §8.4 "Revocation"): authapi records revoked token ids in Redis; realtime-server reads them to fill
 * `revocations{users, jtis, since}` in the `e.hello` reply and the 60 s pull; the box keeps what it received, plus its
 * own sign-out denylist, in an `EdgeRevocationList` and refuses those tokens offline.
 */

/** `revocationsSince` hands back a `since` this far behind its read, so a revocation written during the read is never skipped. */
export const EDGE_REVOCATION_OVERLAP_MS = 60 * 1000;
/** Revocation index entries older than this are pruned: no edge token outlives `auth_time` + 24 h. */
export const EDGE_REVOKED_KEEP_MS = 25 * 3600 * 1000;

/**
 * The Redis keys authapi writes and realtime-server reads (one definition, so they cannot drift):
 *   edge:revoked:<jti>   "1" until the revoked token would have expired (plus the boxes' clock skew)
 *   edge:revoked         sorted set: member jti, score = revoked-at epoch ms (pruned past EDGE_REVOKED_KEEP_MS)
 */
export const EDGE_REVOCATION_REDIS_KEYS = {
    jti: (jti: string): string => `edge:revoked:${jti}`,
    index: 'edge:revoked',
} as const;

/** One revoked token id and when it was revoked (epoch ms). */
export interface EdgeRevokedEntry {
    jti: string;
    at: number;
}

/** A flat `ZRANGEBYSCORE … WITHSCORES` reply of the revocation index (`[jti, score, jti, score, …]`) as entries. */
export function parseEdgeRevokedIndex(flat: readonly (string | number)[] | null | undefined): EdgeRevokedEntry[] {
    const out: EdgeRevokedEntry[] = [];
    const list = Array.isArray(flat) ? flat : [];
    for (let i = 0; i + 1 < list.length; i += 2) out.push({ jti: String(list[i]), at: Number(list[i + 1]) });
    return out;
}

/** `revocations{jtis, since}` for entries read at `asOfMs`: unique ids, and a `since` that overlaps the read. */
export function edgeRevocationsReply(entries: readonly EdgeRevokedEntry[], asOfMs: number): { jtis: string[]; since: number } {
    return { jtis: [...new Set(entries.map(r => r.jti))], since: Math.max(0, asOfMs - EDGE_REVOCATION_OVERLAP_MS) };
}

/** What the cloud sends (`EdgeRevocations` of libs/edge-sync protocol.ts): users to cut off, token ids, and the next cursor. */
export interface EdgeRevocationPayload {
    users?: readonly unknown[] | null;
    jtis?: readonly unknown[] | null;
    since?: number | null;
}

export interface EdgeRevocationListOptions {
    /** How long a cloud-listed entry is kept after it arrives, seconds; default 24 h + 5 min (no token it matches lives longer). */
    retainSec?: number;
    /** A user revocation cuts off tokens issued up to arrival + this, seconds (box clock vs cloud clock); default 5 min. */
    userCutoffSkewSec?: number;
}

/** A serialisable snapshot (the box persists it so revocations survive a restart while offline). */
export interface EdgeRevocationListState {
    v: 1;
    /** [jti, kept until (epoch s)] */
    jtis: Array<[string, number]>;
    /** [nUserid, tokens issued at or before this are revoked (epoch s), kept until (epoch s)] */
    users: Array<[string, number, number]>;
    /** The cloud's `since` to send on the next pull; null before the first. */
    cursor: number | null;
}

const isJti = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= EDGE_JTI_MAX_LENGTH;
const isTime = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;

/**
 * The revocations a verifier holds in memory: token ids (cloud-listed or denylisted on the box at sign-out / "End
 * <name>'s room access") and per-user cut-offs ("every token of this user issued up to T", from `revocations{users}`).
 * Implements `EdgeRevocationCheck` for `verifyEdgeToken`, `verifyEdgeBoxToken` and `verifyEdgeBearer`.
 *
 * A user listed by the cloud is cut off at arrival + 5 min (the boxes' clock skew), so a token issued just before the
 * revocation on a faster cloud clock is never missed. The cost, in the safe direction: if a reinstated user signs in
 * again within those minutes, or within the 60 s pull overlap that lists them again, that token is refused too and
 * the user signs in once more.
 */
export class EdgeRevocationList implements EdgeRevocationCheck {
    private readonly jtis = new Map<string, number>();
    private readonly users = new Map<string, { cutoff: number; until: number }>();
    private cursorMs: number | null = null;
    private readonly retainSec: number;
    private readonly userCutoffSkewSec: number;

    constructor(opts: EdgeRevocationListOptions = {}) {
        this.retainSec = isTime(opts.retainSec) ? opts.retainSec : EDGE_RENEWAL_CEILING_SEC + EDGE_BOX_CLOCK_SKEW_SEC;
        this.userCutoffSkewSec = isTime(opts.userCutoffSkewSec) ? opts.userCutoffSkewSec : EDGE_BOX_CLOCK_SKEW_SEC;
    }

    /**
     * Applies a cloud `revocations` payload received at `receivedAtMs` (box clock). Malformed entries are skipped.
     * Returns what was not already listed. The payload's `since` becomes the cursor for the next pull.
     */
    applyCloud(payload: EdgeRevocationPayload | null | undefined, receivedAtMs: number): { jtis: string[]; users: string[] } {
        if (!isTime(receivedAtMs)) throw new Error('revocations: receivedAtMs must be a time');
        const at = Math.floor(receivedAtMs / 1000);
        const added = { jtis: [] as string[], users: [] as string[] };
        for (const jti of Array.isArray(payload?.jtis) ? payload.jtis : []) {
            if (!isJti(jti)) continue;
            if (!this.jtis.has(jti)) added.jtis.push(jti);
            this.revoke(jti, at + this.retainSec);
        }
        for (const raw of Array.isArray(payload?.users) ? payload.users : []) {
            if (typeof raw !== 'string' || !EDGE_UUID_RE.test(raw.trim())) continue;
            const sub = raw.trim().toLowerCase();
            if (!this.users.has(sub)) added.users.push(sub);
            const cutoff = at + this.userCutoffSkewSec;
            this.revokeUser(sub, cutoff, cutoff + this.retainSec);
        }
        if (isTime(payload?.since)) this.cursorMs = payload.since;
        return added;
    }

    /** Denylists one token id until `untilSec` (its `exp`, plus any skew the verifier allows). Never shortens an entry. */
    revoke(jti: string, untilSec: number): void {
        if (!isJti(jti) || !isTime(untilSec)) throw new Error('revocations: a jti and a time are required');
        this.jtis.set(jti, Math.max(this.jtis.get(jti) ?? 0, Math.ceil(untilSec)));
    }

    /** Cuts off every token of `sub` issued at or before `cutoffSec`, kept until `untilSec` (default cutoff + retain). */
    revokeUser(sub: string, cutoffSec: number, untilSec: number = cutoffSec + this.retainSec): void {
        if (typeof sub !== 'string' || !sub || !isTime(cutoffSec) || !isTime(untilSec)) throw new Error('revocations: a user and times are required');
        const key = sub.toLowerCase();
        const prev = this.users.get(key);
        this.users.set(key, { cutoff: Math.max(prev?.cutoff ?? 0, Math.floor(cutoffSec)), until: Math.max(prev?.until ?? 0, Math.ceil(untilSec)) });
    }

    isRevoked(jti: string, sub: string, iat: number): boolean {
        if (typeof jti === 'string' && this.jtis.has(jti)) return true;
        const user = typeof sub === 'string' ? this.users.get(sub.toLowerCase()) : undefined;
        return !!user && typeof iat === 'number' && iat <= user.cutoff;
    }

    /** The `since` to send on the next pull, or null before the first payload. */
    get cursor(): number | null {
        return this.cursorMs;
    }

    get size(): { jtis: number; users: number } {
        return { jtis: this.jtis.size, users: this.users.size };
    }

    /** Drops entries kept past their time (no token they match can still be valid). Returns how many went. */
    prune(nowMs: number): number {
        if (!isTime(nowMs)) return 0;
        const now = Math.floor(nowMs / 1000);
        let dropped = 0;
        for (const [jti, until] of this.jtis) if (until < now) { this.jtis.delete(jti); dropped++; }
        for (const [sub, u] of this.users) if (u.until < now) { this.users.delete(sub); dropped++; }
        return dropped;
    }

    toJSON(): EdgeRevocationListState {
        return {
            v: 1,
            jtis: [...this.jtis.entries()],
            users: [...this.users.entries()].map(([sub, u]) => [sub, u.cutoff, u.until] as [string, number, number]),
            cursor: this.cursorMs,
        };
    }

    /** Restores a snapshot; malformed rows are skipped, an unknown version starts empty. */
    static fromJSON(state: unknown, opts?: EdgeRevocationListOptions): EdgeRevocationList {
        const list = new EdgeRevocationList(opts);
        const s = state as Partial<EdgeRevocationListState> | null;
        if (!s || typeof s !== 'object' || s.v !== 1) return list;
        for (const row of Array.isArray(s.jtis) ? s.jtis : []) {
            if (Array.isArray(row) && isJti(row[0]) && isTime(row[1])) list.revoke(row[0], row[1]);
        }
        for (const row of Array.isArray(s.users) ? s.users : []) {
            if (Array.isArray(row) && typeof row[0] === 'string' && row[0] && isTime(row[1]) && isTime(row[2])) list.revokeUser(row[0], row[1], row[2]);
        }
        if (isTime(s.cursor)) list.cursorMs = s.cursor;
        return list;
    }
}
