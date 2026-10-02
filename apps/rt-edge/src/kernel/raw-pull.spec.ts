import type { EdgeRawPullReply } from '@app/edge-sync';
import { chainNext, chainSeed, encodeRecord, RecordType } from '@app/rt-ingest';

import { pullCloudRange, pullReplyStep, RawPull } from './raw-pull';

const SES = 'ses-pull-1';

function records(from: number, to: number, tag = 'cloud'): Buffer[] {
    const out: Buffer[] = [];
    for (let seq = from; seq <= to; seq++) out.push(encodeRecord({ type: RecordType.DATA, flags: 0, seq, tRecvMs: 1000 + seq, payload: Buffer.from(`${tag} ${seq}`) }));
    return out;
}

function hashAfter(recs: readonly Buffer[], upTo: number, start = chainSeed(SES)): Buffer {
    let h = start;
    for (let i = 0; i < upTo; i++) h = chainNext(h, recs[i]);
    return h;
}

/** A cloud that serves `recs` (seq 1..n) `per` records per reply, then answers NOT_FOUND past its head (as realtime-server does). */
function cloud(recs: readonly Buffer[], per = 3, faults: { at?: number; reply?: unknown } = {}): { pull: RawPull; calls: number[] } {
    const calls: number[] = [];
    const pull: RawPull = async fromSeq => {
        calls.push(fromSeq);
        if (faults.at !== undefined && calls.length === faults.at) return faults.reply as EdgeRawPullReply;
        if (fromSeq > recs.length) return { ok: false, code: 'NOT_FOUND' } as unknown as EdgeRawPullReply;
        const to = Math.min(recs.length, fromSeq + per - 1);
        return { recs: Buffer.concat(recs.slice(fromSeq - 1, to)), toSeq: to, hash: hashAfter(recs, to).toString('hex') };
    };
    return { pull, calls };
}

describe('RECOVER pull-back (raw-pull.ts)', () => {
    it('reads each e.rawpull ack: records, the end of the store, or a failure', () => {
        const one = records(1, 1)[0];
        expect(pullReplyStep({ recs: one, toSeq: 1, hash: 'ab' })).toMatchObject({ kind: 'records', toSeq: 1, hash: 'ab' });
        expect(pullReplyStep({ recs: new Uint8Array(one) })).toMatchObject({ kind: 'records', toSeq: null, hash: null });
        // The end: NOT_FOUND (past the cloud's head, or a store the cloud flagged corrupt) or an empty answer.
        expect(pullReplyStep({ ok: false, code: 'NOT_FOUND' })).toEqual({ kind: 'end' });
        expect(pullReplyStep({ recs: Buffer.alloc(0), toSeq: 4, hash: '' })).toEqual({ kind: 'end' });
        // Everything else is a failure, never "the cloud holds nothing".
        for (const reply of [null, undefined, 'x', { ok: false, code: 'NOT_BOUND' }, { ok: false, code: 'ERROR' }, { ok: false }, {}, { recs: [1, 2] }, { recs: one, toSeq: 'x' }, { recs: one, hash: 5 }]) {
            expect(pullReplyStep(reply)).toMatchObject({ kind: 'failed' });
        }
    });

    it('pulls in parts until the cloud says it holds nothing more, chain-verified from the box hash', async () => {
        const recs = records(1, 10);
        const { pull, calls } = cloud(recs);
        const out = await pullCloudRange(4, hashAfter(recs, 3), pull);
        expect(out.ok).toBe(true);
        const range = (out as Extract<typeof out, { ok: true }>).range;
        expect(range.records.map(r => r.seq)).toEqual([4, 5, 6, 7, 8, 9, 10]);
        expect(range.recs.equals(Buffer.concat(recs.slice(3)))).toBe(true);
        expect(range.records[6].hash.equals(hashAfter(recs, 10))).toBe(true);
        const last = range.records[6];
        expect(range.recs.subarray(last.offset, last.offset + last.size).equals(recs[9])).toBe(true);
        expect(calls).toEqual([4, 7, 10, 11]);
    });

    it('a cloud that holds nothing from fromSeq gives an EMPTY range (the kernel refuses it), never a failure or a truncation order', async () => {
        const recs = records(1, 5);
        const out = await pullCloudRange(6, hashAfter(recs, 5), cloud(recs).pull);
        expect(out).toMatchObject({ ok: true, range: { fromSeq: 6, records: [] } });
    });

    it('a failed reply at any point — first or after some records — fails the whole pull (io-error), keeping nothing', async () => {
        const recs = records(1, 10);
        const prev = hashAfter(recs, 3);
        for (const reply of [{ ok: false, code: 'ERROR' }, { ok: false, code: 'NOT_BOUND' }, null, { recs: 'nope' }]) {
            for (const at of [1, 2]) {
                const out = await pullCloudRange(4, prev, cloud(recs, 3, { at, reply }).pull);
                expect([JSON.stringify(reply), at, out]).toEqual([JSON.stringify(reply), at, { ok: false, reason: 'io-error', message: expect.stringContaining('the journal is kept') }]);
            }
        }
        const thrown = await pullCloudRange(4, prev, async () => {
            throw new Error('no ack for e.rawpull');
        });
        expect(thrown).toMatchObject({ ok: false, reason: 'io-error', message: expect.stringContaining('no ack for e.rawpull') });
    });

    it('a reply whose toSeq contradicts its records is a failure; one that does not continue the box chain is a chain mismatch', async () => {
        const recs = records(1, 10);
        const prev = hashAfter(recs, 3);
        const lying: RawPull = async () => ({ recs: Buffer.concat(recs.slice(3, 6)), toSeq: 9, hash: '' });
        expect(await pullCloudRange(4, prev, lying)).toMatchObject({ ok: false, reason: 'io-error' });
        const other = records(1, 10, 'other lineage');
        const forked: RawPull = async () => ({ recs: Buffer.concat(other.slice(3, 6)), toSeq: 6, hash: hashAfter(other, 6).toString('hex') });
        expect(await pullCloudRange(4, prev, forked)).toMatchObject({ ok: false, reason: 'chain-mismatch' });
        const gap: RawPull = async () => ({ recs: Buffer.concat(recs.slice(4, 6)), toSeq: 6, hash: '' });
        expect(await pullCloudRange(4, prev, gap)).toMatchObject({ ok: false, reason: 'chain-mismatch' });
    });

    it("the reply's hash is the cloud's cumulative chain hash: one the box's chain plus the pulled records does not reach is a fork BEFORE fromSeq (chain-mismatch); a toSeq its own records contradict is a cloud fault (io-error)", async () => {
        const recs = records(1, 10);
        const prev = hashAfter(recs, 3);
        // The cloud holds the SAME records 4..6 but a different 1..3 (a box image that recorded past the last applied
        // record): the records decode and follow seq 3, so only the cumulative hash shows the cloud's chain is not the box's.
        const cloudPrefix = records(1, 3, 'restored image');
        const sameRecordsOtherHistory: RawPull = async () => ({ recs: Buffer.concat(recs.slice(3, 6)), toSeq: 6, hash: hashAfter([...cloudPrefix, ...recs.slice(3)], 6).toString('hex') });
        expect(await pullCloudRange(4, prev, sameRecordsOtherHistory)).toEqual({ ok: false, reason: 'chain-mismatch', message: expect.stringContaining("history before seq 4 is not the box's") });
        // The same in a later part of a multi-part pull.
        const { pull } = cloud(recs, 3, { at: 2, reply: { recs: Buffer.concat(recs.slice(6, 9)), toSeq: 9, hash: 'ab'.repeat(32) } });
        expect(await pullCloudRange(4, prev, pull)).toMatchObject({ ok: false, reason: 'chain-mismatch' });
        // A reply that contradicts ITSELF (its toSeq is not where its own records end) never freezes: io-error, journal kept.
        const selfContradicting: RawPull = async () => ({ recs: Buffer.concat(recs.slice(3, 6)), toSeq: 5, hash: hashAfter(recs, 6).toString('hex') });
        expect(await pullCloudRange(4, prev, selfContradicting)).toEqual({ ok: false, reason: 'io-error', message: expect.stringContaining('the journal is kept') });
        // No hash (an empty one): the records alone decide, and the box's own chain continues.
        const noHash: RawPull = async from => (from > 6 ? ({ ok: false, code: 'NOT_FOUND' } as unknown as EdgeRawPullReply) : { recs: Buffer.concat(recs.slice(3, 6)), toSeq: 6, hash: '' });
        expect(await pullCloudRange(4, prev, noHash)).toMatchObject({ ok: true, range: { fromSeq: 4 } });
    });

    it('gives up (io-error) on a cloud that never ends', async () => {
        const recs = records(1, 1000);
        expect(await pullCloudRange(1, chainSeed(SES), cloud(recs, 1).pull, 5)).toMatchObject({ ok: false, reason: 'io-error' });
    });
});
