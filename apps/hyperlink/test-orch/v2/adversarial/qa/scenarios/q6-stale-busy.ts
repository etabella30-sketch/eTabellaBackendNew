/**
 * Q6 (f) - stale-lock false positives on a batch that is slow but ALIVE
 * because the shared worker pool is busy with OTHER batches.
 *   - batch A1 (own section): 5 hung files fill the hard cap (Bull 'active')
 *   - batch B (victim): 10 files, all still 'waiting' behind A1
 *   - batch A2 (own section): 5,500 more waiting files added AFTER B, so B's
 *     jobs sit at the far end of the wait list (getJobs pages from the head)
 *   B's dUpdate is rewritten to 100 min ago. Starting B again must be
 *   rejected ('P' kept) both with 5,500 newer jobs ahead (the stale check
 *   scans at most 5,000 -> must keep the lock) and after A2 is cancelled
 *   (B's jobs are then inside the first page). A1 with an old dUpdate must be
 *   rejected too (its jobs are active). Negative control: a batch whose jobs
 *   are gone (hash 2/10, no jobs) IS released.
 */
import { HarnessV2, bodyFor, makeFiles, now, verdict, sleep } from '../../../harness';

const OLD = () => new Date(Date.now() - 100 * 60 * 1000).toISOString();
async function ageKey(h: HarnessV2, key: string) {
  const snap = await h.snapshot(key);
  snap.dUpdate = OLD(); snap.dStart = OLD();
  const ttl = await h.redis.ttl(key);
  await h.redis.set(key, JSON.stringify(snap), 'EX', ttl > 0 ? ttl : 172800);
  return snap;
}

export async function run() {
  const h = new HarnessV2({ label: 'Q6' });
  await h.flush();
  const fA1 = makeFiles(5, 'q6a1'), fB = makeFiles(10, 'q6b'), fA2 = makeFiles(5500, 'q6a2');
  h.db.getfiles = (q) => q.nBundleid === 'A1' ? fA1 : q.nBundleid === 'B' ? fB : q.nBundleid === 'A2' ? fA2 : [];
  h.scan = { delayMs: 10, result: (f) => f.nBundledetailid.startsWith('q6a') ? 'hang' : true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '5', HYPERLINK_STALE_MIN: '90' });
  const rA1 = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-Q6A1', nBundleid: 'A1' }), false);
  await h.waitFor(async () => (await h.counts(s.fq)).active >= 5, 5000);
  const rB = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-Q6B', nBundleid: 'B' }), false);
  await h.waitFor(async () => (await h.counts(s.fq)).waiting >= 10, 5000);
  const rA2 = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-Q6A2', nBundleid: 'A2' }), false);
  await h.waitFor(async () => (await h.counts(s.fq)).waiting >= 5510, 20000);
  const counts1 = await h.counts(s.fq);
  await ageKey(h, rB.data.queueName);
  await ageKey(h, rA1.data.queueName);
  const t1 = now();
  const rB2 = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-Q6B', nBundleid: 'B' }), false);
  const staleMs1 = now() - t1;
  const keyB1 = await h.snapshot(rB.data.queueName);
  const rA1b = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-Q6A1', nBundleid: 'A1' }), false);
  const keyA1 = await h.snapshot(rA1.data.queueName);
  const conservative = h.logs.filter(l => /> 5000 jobs queued, keeping the lock/.test(l)).length;
  // now drain A2 so B's jobs are within the first page and check again
  const cA2 = await s.gen.cancelhyperlink({ nCaseid: 'c1', nSectionid: 'S-Q6A2', nBundleid: 'A2' } as any);
  const counts2 = await h.counts(s.fq);
  await ageKey(h, rB.data.queueName);
  const t2 = now();
  const rB3 = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-Q6B', nBundleid: 'B' }), false);
  const staleMs2 = now() - t2;
  const keyB2 = await h.snapshot(rB.data.queueName);
  // negative control: same shape, but the jobs are gone (worker crashed before finalize)
  const deadKey = 'HYPERLINK/m1/c1/S-Q6D/D';
  await h.redis.set(deadKey, JSON.stringify({ queueName: deadKey, nCaseid: 'c1', nSectionid: 'S-Q6D', nMasterid: 'm1', nBundleid: 'D', nBundledetailid: null, cType: 'E', cKeeptype: 'R', nTotal: 10, nCompleted: 2, nFailed: 0, cStatus: 'P', isDeepscan: false, batchId: 'c1:S-Q6D:D', dStart: OLD(), dUpdate: OLD() }), 'EX', 172800);
  await h.redis.hmset('HYPERLINK-BATCH/c1:S-Q6D:D', { total: 10, done: 2, failed: 0, cancelled: 0, owner: deadKey, run: 'deadrun', enqueued: 1, enqueueDone: 1 });
  h.db.getfiles = (q) => q.nBundleid === 'D' ? makeFiles(2, 'q6d') : q.nBundleid === 'A1' ? fA1 : q.nBundleid === 'B' ? fB : [];
  const rD = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-Q6D', nBundleid: 'D' }), false);
  // (D's file jobs cannot run in this process: the 5 hung A1 stubs hold the hard cap for good; only the release is judged)
  await sleep(500);
  const dDone = await h.snapshot(deadKey);
  const dHash = await h.redis.hgetall('HYPERLINK-BATCH/c1:S-Q6D:D');
  // cleanup: cancel A1 and B (hung / waiting), leave the queue empty for the flush
  await s.gen.cancelhyperlink({ nCaseid: 'c1', nSectionid: 'S-Q6A1', nBundleid: 'A1' } as any);
  await s.gen.cancelhyperlink({ nCaseid: 'c1', nSectionid: 'S-Q6B', nBundleid: 'B' } as any);
  const pass = rA1.msg === 1 && rB.msg === 1 && rA2.msg === 1 && rB2.msg === -1 && !rB2.staleReleased && keyB1?.cStatus === 'P'
    && rA1b.msg === -1 && keyA1?.cStatus === 'P' && cA2.msg === 1 && rB3.msg === -1 && keyB2?.cStatus === 'P'
    && rD.msg === 1 && !!rD.staleReleased && dDone?.cStatus === 'P' && dHash.run !== 'deadrun' && dHash.total === '2';
  const numbers = `queue at check: w${counts1.waiting}/a${counts1.active} (B's 10 jobs behind ${fA2.length} newer ones) B dUpdate=100min -> start B msg=${rB2.msg} "${rB2.value}" staleReleased=${!!rB2.staleReleased} keyB=${keyB1?.cStatus} (${staleMs1} ms, conservative>5000 logged=${conservative}) `
    + `| A1 (5 active hung) old -> msg=${rA1b.msg} keyA1=${keyA1?.cStatus} | cancel A2 msg=${cA2.msg} removed=${cA2.removed} queue=w${counts2.waiting}/a${counts2.active} -> start B again msg=${rB3.msg} keyB=${keyB2?.cStatus} (${staleMs2} ms) `
    + `| dead control (hash 2/10, no jobs, 100 min) -> msg=${rD.msg} staleReleased=${!!rD.staleReleased} newBatch=${dDone?.cStatus} ${dDone?.nCompleted}/${dDone?.nTotal} newRun=${dHash.run !== 'deadrun'} (its jobs queue behind A1's hung cap, not judged)`;
  await h.teardown();
  return verdict('Q6', pass, numbers);
}
