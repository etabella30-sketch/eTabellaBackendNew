/**
 * Q5 (e) - Bull retry of a file job whose first attempt already COUNTED it.
 * The seam is batch.afterAccount (the step right after the accounting Lua):
 *   set A (5 files, incl. the LAST one): afterAccount throws on attempt 1 AND
 *         attempt 2 -> Bull fails the job for good -> the 'failed' listener
 *         tries to count it as F (must be a no-op: seen)
 *   set B (3 files): afterAccount throws on attempt 1 only
 * Expect: hash done == N, failed == 0, seen == N, every A/B file scanned
 * exactly ONCE (fix round 2: the handler retries the post-accounting Redis
 * step itself -- 3 attempts, 0 / 250 / 1000 ms -- so a counted file never
 * reaches Bull's retry and is never re-scanned), final C N/N, exactly one
 * notification, no counter decrease, the queue idle once the in-handler
 * retries have drained.
 */
import { HarnessV2, bodyFor, makeFiles, now, verdict, sleep } from '../../../harness';

export async function run() {
  const N = 40;
  const h = new HarnessV2({ label: 'Q5' });
  await h.flush();
  const files = makeFiles(N, 'q5');
  h.db.getfiles = () => files;
  h.scan = { delayMs: 20, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '3', HYPERLINK_FILE_BACKOFF_MS: '150' });
  const setA = new Set([files[2], files[9], files[17], files[25], files[N - 1]].map(f => f.nBundledetailid));
  const setB = new Set([files[4], files[12], files[30]].map(f => f.nBundledetailid));
  // seam: the accounting Lua has run (the file IS counted) and the handler
  // throws right after it, i.e. before afterAccount (emit / finalize)
  const calls = new Map<string, number>();
  const origAccount = s.batch.account.bind(s.batch);
  (s.batch as any).account = async (...args: any[]) => {
    const r = await origAccount(...args);
    const id = args[4]?.nBundledetailid;
    const n = (calls.get(id) || 0) + 1; calls.set(id, n);
    const throwNow = (setA.has(id) && n <= 2) || (setB.has(id) && n === 1);
    if (throwNow) throw new Error(`post-accounting failure #${n} for ${id}`);
    return r;
  };
  const t0 = now();
  const r = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-Q5', nBundleid: 'B' }), false);
  const done = await h.waitForDone(r.data.queueName, 30000);
  const tDone = now();
  await sleep(1800);   // the in-handler retries of the last set-A files (250 + 1000 ms) drain
  const hash = await h.redis.hgetall(`HYPERLINK-BATCH/${r.data.batchId}`);
  const seen = await h.redis.scard(`HYPERLINK-BATCH/${r.data.batchId}/seen`);
  const sc = h.scanStats(r.data.batchId);
  const scansA = [...setA].map(id => h.scanCalls.filter(c => c.nBundledetailid === id).length);
  const scansB = [...setB].map(id => h.scanCalls.filter(c => c.nBundledetailid === id).length);
  const bullFailed = h.bullEvents.filter(e => e.queue === 'hyperlink-file-queue' && e.event === 'failed');
  const forGood = bullFailed.filter(e => setA.has(String(e.jobId).split(':').pop()));
  const finals = h.responces(r.data.queueName).filter(e => e.data.data.cStatus !== 'P').length;
  const notif = h.notifications().length;
  const counts = await h.counts(s.fq);
  const pass = done?.cStatus === 'C' && done.nCompleted === N && done.nFailed === 0 && Number(hash.done) === N && Number(hash.failed || 0) === 0 && seen === N
    && sc.distinct === N && scansA.every(n => n === 1) && scansB.every(n => n === 1) && sc.totalCalls === N
    && finals === 1 && notif === 1 && h.regressions(r.data.queueName) === 0 && counts.waiting + counts.active + counts.delayed === 0;
  const numbers = `final=${done?.cStatus} ${done?.nCompleted}/${done?.nTotal}/${done?.nFailed} hash=${hash.done}+${hash.failed || 0}/${hash.total} seen=${seen} scans=${sc.totalCalls} (expected ${N}: in-handler retry, no re-scan) `
    + `setA(bothAttemptsThrow, incl. last file) scanned=${scansA.join('/')} setB(firstOnly) scanned=${scansB.join('/')} bullFailedEvents=${bullFailed.length} (for good: ${forGood.length}) `
    + `finalEmits=${finals} notifications=${notif} counterDecreases=${h.regressions(r.data.queueName)} queue=w${counts.waiting}/a${counts.active}/d${counts.delayed}/f${counts.failed} doneAfter=${((tDone - t0) / 1000).toFixed(1)}s`;
  await h.teardown();
  return verdict('Q5', pass, numbers, { hash, scansA, scansB });
}
