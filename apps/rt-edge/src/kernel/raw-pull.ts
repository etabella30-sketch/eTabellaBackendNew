/**
 * RECOVER's pull-back (spec §5.5 MR-3, `e.rawpull`): every record the cloud raw store holds from `fromSeq` on, in
 * replies of at most 256 KB, chain-verified as they arrive against the box's own hash at fromSeq-1. Nothing on the box
 * changes here; the journal is touched only once the pull is complete and consistent (journal-rewrite.ts).
 *
 * How one reply is read (`pullReplyStep`):
 * - records → verified and kept;
 * - records that do not continue the box's chain → `chain-mismatch` (the uplink freezes the session for an admin's
 *   split, D19, D7). Two checks prove it, against the box's own hash at fromSeq-1 (spec §5.5 MR-3 step 1 "verifies
 *   the chain against the cloud's"): the records decode with consecutive seqs from fromSeq (CRC, seq), and the reply's
 *   `hash` — the cloud's CUMULATIVE chain hash at its toSeq — equals the box's hash at fromSeq-1 continued by those
 *   records. A record carries no back-link, so `hash` is the only proof that the cloud's chain is the box's: a
 *   different value says the cloud's history BEFORE fromSeq differs from the box's (a fork the hello's D19 check could
 *   not see, e.g. a restored image that recorded past the last applied record). It never contradicts the reply's own
 *   records, which cannot be checked against it alone;
 * - `{ok:false, code:'NOT_FOUND'}` or an empty `recs` → the cloud holds nothing more: the end of the pull. The cloud
 *   answers NOT_FOUND past its head AND for a store it flagged corrupt, so an empty answer is never read as "the box
 *   must drop records": a pull that ends with nothing refuses RECOVER (`cloud-behind`), and only records the cloud
 *   actually supplies ever replace the box's;
 * - anything else (no reply, NOT_BOUND, ERROR, CLOUD_JOURNAL_CORRUPT, a reply without records, a request that throws,
 *   a reply whose `toSeq` names a seq its own records do not end at) → the pull FAILED: RECOVER stops with `io-error`,
 *   the journal is kept, and the uplink alerts (RECOVER_FAILED, once per cause) and retries at the next hello. A reply
 *   that contradicts ITSELF is a cloud or transport fault, not proof of a fork, so it never freezes the session.
 */
import type { EdgeRawPullReply } from '@app/edge-sync';
import { verifyRecordBatch } from '@app/rt-ingest';

import type { PulledRange, PulledRecord } from './journal-rewrite';

/** Replies one RECOVER may take before it gives up (≈ 25 GB at 256 KB each: a runaway cloud, never a real session). */
export const RECOVER_MAX_PULLS = 100_000;

export type RawPull = (fromSeq: number, toSeq: number) => Promise<EdgeRawPullReply>;

export type PullReplyStep =
    | { readonly kind: 'records'; readonly recs: Buffer; readonly toSeq: number | null; readonly hash: string | null }
    | { readonly kind: 'end' }
    | { readonly kind: 'failed'; readonly why: string };

export type PullOutcome =
    | { readonly ok: true; readonly range: PulledRange }
    | { readonly ok: false; readonly reason: 'chain-mismatch' | 'io-error'; readonly message: string };

/** What one `e.rawpull` ack means for the pull (see the file header). Never throws. */
export function pullReplyStep(reply: unknown): PullReplyStep {
    if (!reply || typeof reply !== 'object') return { kind: 'failed', why: 'no reply' };
    const r = reply as { ok?: unknown; code?: unknown; recs?: unknown; toSeq?: unknown; hash?: unknown };
    if (r.ok === false) return r.code === 'NOT_FOUND' ? { kind: 'end' } : { kind: 'failed', why: `the cloud answered ${typeof r.code === 'string' ? r.code : 'an error'}` };
    if (!(r.recs instanceof Uint8Array)) return { kind: 'failed', why: 'a reply without records' };
    if (!r.recs.length) return { kind: 'end' };
    if (r.toSeq !== undefined && r.toSeq !== null && !Number.isSafeInteger(r.toSeq)) return { kind: 'failed', why: 'a malformed toSeq' };
    if (r.hash !== undefined && r.hash !== null && typeof r.hash !== 'string') return { kind: 'failed', why: 'a malformed hash' };
    return {
        kind: 'records',
        recs: Buffer.from(r.recs),
        toSeq: typeof r.toSeq === 'number' ? r.toSeq : null,
        hash: typeof r.hash === 'string' && r.hash ? r.hash : null,
    };
}

/** Pull everything the cloud holds from `fromSeq` on; the chain must continue `prev` (the box's hash at fromSeq-1). */
export async function pullCloudRange(fromSeq: number, prev: Buffer, pull: RawPull, maxPulls = RECOVER_MAX_PULLS): Promise<PullOutcome> {
    const parts: Buffer[] = [];
    const records: PulledRecord[] = [];
    let bytes = 0;
    let next = fromSeq;
    let hash = prev;
    for (let n = 0; ; n++) {
        if (n >= maxPulls) return { ok: false, reason: 'io-error', message: `the pull from seq ${fromSeq} did not end after ${maxPulls} replies; the journal is kept` };
        let reply: unknown;
        try {
            reply = await pull(next, Number.MAX_SAFE_INTEGER);
        } catch (err) {
            return { ok: false, reason: 'io-error', message: `the pull from seq ${next} failed (${err instanceof Error ? err.message : String(err)}); the journal is kept` };
        }
        const step = pullReplyStep(reply);
        if (step.kind === 'end') break;
        if (step.kind === 'failed') return { ok: false, reason: 'io-error', message: `the pull from seq ${next} failed (${step.why}); the journal is kept` };
        const check = verifyRecordBatch(step.recs, next, hash);
        if (check.ok === false) return { ok: false, reason: 'chain-mismatch', message: `pulled records do not continue the box's chain at ${check.expectSeq} (${check.reason})` };
        // `hash` is the cloud's CUMULATIVE chain hash at its toSeq (records carry no back-link, so it is the only proof
        // that the cloud's chain continues the box's): a different value means the cloud's history before fromSeq is
        // not the box's — a fork, never a self-contradiction (see the file header).
        if (step.hash !== null && step.hash !== check.hash.toString('hex')) {
            return { ok: false, reason: 'chain-mismatch', message: `the cloud's chain hash at seq ${check.toSeq} differs from the box's chain continued by the pulled records: the cloud's history before seq ${fromSeq} is not the box's` };
        }
        if (step.toSeq !== null && step.toSeq !== check.toSeq) {
            return { ok: false, reason: 'io-error', message: `the cloud's reply names seq ${step.toSeq} but holds ${next}..${check.toSeq}; the journal is kept` };
        }
        for (const rec of check.records) records.push({ seq: rec.seq, hash: rec.hash, offset: bytes + (rec.offset ?? 0), size: rec.size });
        parts.push(step.recs);
        bytes += step.recs.length;
        hash = check.hash;
        next = check.toSeq + 1;
    }
    return { ok: true, range: { fromSeq, recs: parts.length === 1 ? parts[0] : Buffer.concat(parts), records } };
}
