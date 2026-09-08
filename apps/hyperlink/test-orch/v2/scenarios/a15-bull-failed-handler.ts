/**
 * A15 - Bull's terminal 'failed' event for file jobs is accounted as F
 * (owner decision D10). 10 files x 400 ms, workers 3 (Bull hard cap 5: 3
 * scanning + 2 parked on the semaphore, all 5 hold a Bull lock). After the
 * first round the worker is killed (close(true); its in-flight scans hang); a
 * new worker with maxStalledCount 0 finds the 5 locked-then-expired jobs
 * stalled and Bull fails them for good ("job stalled more than allowable
 * limit") -> the queue's failed listener counts each as F with that reason,
 * the 2 waiting jobs are scanned by the new worker, the batch ends F 5/5 with
 * ONE "completed with 5 failure(s)" notification and no re-scan of the
 * failed files.
 */
import Queue = require('bull');
import { HarnessV2, bodyFor, makeFiles, verdict, sleep } from '../harness';

const N = 10, FILE_MS = 400;
/** lock/stall settings scaled to seconds, and a stalled job fails at once */
const STALL_FAIL: Queue.AdvancedSettings = { lockDuration: 4000, lockRenewTime: 2000, stalledInterval: 2000, maxStalledCount: 0 };

export async function run() {
  const h = new HarnessV2({ label: 'A15' });
  await h.flush();
  h.db.getfiles = () => makeFiles(N, 'a15');
  // the first round (files 1-3) completes on w1; every later scan on w1 hangs
  // (the process is killed while they are in flight), w2 scans normally
  h.scan = { delayMs: FILE_MS, result: (file, _callNo, tag) => tag === 'w1' && parseInt(file.nBundledetailid.slice(-5), 10) > 3 ? 'hang' : true };
  const s1 = await h.stack('w1', { HYPERLINK_WORKERS: '3' }, { settings: STALL_FAIL });
  const body = bodyFor({ nSectionid: 'S-A15', nBundleid: 'B' });
  const r = await s1.gen.starthyperlink(body, false);
  const key = r.data.queueName, batchId = r.data.batchId;
  // first round done, second round in flight
  await h.waitFor(() => h.scanCalls.filter(c => !!c.tEnd).length >= 3 && h.scanCalls.filter(c => !c.tEnd).length >= 3, 10000, 20);
  await sleep(100);
  const countsAtKill = await h.counts(s1.fq);
  const activeAtKill = countsAtKill.active;
  const scansAtKill = h.scanCalls.length;
  const doneAtKill = Number(await h.redis.hget(`HYPERLINK-BATCH/${batchId}`, 'done'));
  h.killTag('w1');
  await s1.bq.close(true);
  await s1.fq.close(true);
  const s2 = await h.stack('w2', { HYPERLINK_WORKERS: '3' }, { settings: STALL_FAIL });
  const done = await h.waitForDone(key, 40000);
  await sleep(600);
  const failedEvents = h.bullEvents.filter(e => e.queue === 'hyperlink-file-queue' && e.event === 'failed' && /stalled more than/.test(e.reason || ''));
  const counted = h.logs.filter(l => /failed for good in Bull/.test(l)).length;
  const reasons = (done?.jFailed || []).map(f => f.cReason);
  const allStalledReasons = reasons.length > 0 && reasons.every(x => /^bull: job stalled more than allowable limit/.test(x));
  const notifs = h.notifications().map(e => String(e.data.cMsg));
  const w2Scans = h.scanCalls.filter(c => c.tag === 'w2').length;
  const counts = await h.counts(s2.fq);
  const pass = done?.cStatus === 'F' && done.nTotal === N && done.nFailed === activeAtKill && done.nCompleted === N - activeAtKill
    && failedEvents.length === activeAtKill && counted === activeAtKill && allStalledReasons
    && notifs.length === 1 && new RegExp(`completed with ${activeAtKill} failure\\(s\\)`).test(notifs[0])
    && h.scanCalls.length === scansAtKill + (N - doneAtKill - activeAtKill) && w2Scans === N - doneAtKill - activeAtKill
    && counts.waiting + counts.active + counts.delayed + counts.failed === 0;
  const numbers = `killed w1 with active=${activeAtKill} (done=${doneAtKill}, waiting=${countsAtKill.waiting}) -> Bull failed-for-good events=${failedEvents.length} countedAsF=${counted} `
    + `final=${done?.cStatus} ${done?.nCompleted}/${done?.nTotal} failed=${done?.nFailed} reasons=${allStalledReasons ? '"bull: job stalled more than allowable limit" x' + reasons.length : JSON.stringify(reasons)} `
    + `notifications=${notifs.length} "${notifs[0]}" scans=${h.scanCalls.length} (atKill=${scansAtKill}, w1=${h.scanCalls.filter(c => c.tag === 'w1').length}, w2=${w2Scans}, no re-scan of the failed files) queue=w${counts.waiting}/a${counts.active}/f${counts.failed}`;
  await h.teardown();
  return verdict('A15', pass, numbers, { countsAtKill });
}
