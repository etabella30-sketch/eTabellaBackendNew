/**
 * Q1 (a) - 2,000 files; the file worker (whole stack) is killed and restarted
 * TWICE mid-batch, with the PRODUCTION maxStalledCount (3) and fast Bull lock
 * / stall timings. The scan count must be EXACTLY 2,000 + the scans that were
 * in flight on a dead worker (those are re-run once by Bull's stalled
 * handling); done must be exactly 2,000, exactly one finalize, one
 * notification, no counter decrease, no file failed for good by Bull.
 *
 * Q1b - the worker dies while the ORCHESTRATOR is inside hyperlink_getfiles
 * (before any file job exists): the stalled orchestrator job must be re-run by
 * the new worker and the batch must complete exactly once.
 */
import { HarnessV2, FAST_STALL, bodyFor, makeFiles, now, verdict, sleep } from '../../../harness';

const PROD_STALL = { ...FAST_STALL, maxStalledCount: 3 };

export async function run() {
  return [await killTwice(), await killDuringOrchestrator()];
}

async function killTwice() {
  const N = 2000, FILE_MS = 30;
  const h = new HarnessV2({ label: 'Q1' });
  await h.flush();
  const files = makeFiles(N, 'q1');
  h.db.getfiles = () => files;
  h.scan = { delayMs: FILE_MS, result: true };
  const s1 = await h.stack('w1', { HYPERLINK_WORKERS: '3' }, { settings: PROD_STALL });
  const body = bodyFor({ nSectionid: 'S-Q1', nBundleid: 'B-Q1' });
  const res = await s1.gen.starthyperlink(body, false);
  const key = res.data.queueName, batchId = res.data.batchId;
  const t0 = now();
  await h.waitFor(() => h.scanCalls.filter(c => c.tEnd).length >= 150, 20000);
  h.killTag('w1'); await s1.bq.close(true); await s1.fq.close(true);
  const tKill1 = now();
  const s2 = await h.stack('w2', { HYPERLINK_WORKERS: '3' }, { settings: PROD_STALL });
  await h.waitFor(() => h.scanCalls.filter(c => c.tag === 'w2' && c.tEnd).length >= 700, 90000);
  h.killTag('w2'); await s2.bq.close(true); await s2.fq.close(true);
  const tKill2 = now();
  const s3 = await h.stack('w3', { HYPERLINK_WORKERS: '3' }, { settings: PROD_STALL });
  const done = await h.waitForDone(key, 240000);
  const tDone = now();
  await sleep(1500);
  const lost1 = h.scanCalls.filter(c => c.tag === 'w1' && !c.tEnd).length;
  const lost2 = h.scanCalls.filter(c => c.tag === 'w2' && !c.tEnd).length;
  const expected = N + lost1 + lost2;
  const sc = h.scanStats(batchId);
  const stalled = h.bullEvents.filter(e => e.event === 'stalled' && e.queue === 'hyperlink-file-queue').length;
  const bullFailed = h.bullEvents.filter(e => e.event === 'failed' && e.queue === 'hyperlink-file-queue').length;
  const finals = h.responces(key).filter(e => e.data.data.cStatus !== 'P').length;
  const notif = h.notifications().length;
  const hash = await h.redis.hgetall(`HYPERLINK-BATCH/${batchId}`);
  const seen = await h.redis.scard(`HYPERLINK-BATCH/${batchId}/seen`);
  const counts = await h.counts(s3.fq);
  const regress = h.regressions(key);
  const per = (tag: string) => h.scanCalls.filter(c => c.tag === tag).length;
  const pass = !!done && done.cStatus === 'C' && done.nCompleted === N && done.nFailed === 0
    && sc.totalCalls === expected && sc.distinct === N && Number(hash.done) === N && Number(hash.failed || 0) === 0 && seen === N
    && finals === 1 && notif === 1 && regress === 0 && bullFailed === 0
    && counts.waiting + counts.active + counts.delayed + counts.failed === 0 && h.unhandled.length === 0;
  const numbers = `scans=${sc.totalCalls} expected=${N}+${lost1}+${lost2}=${expected} (exact=${sc.totalCalls === expected}, distinct=${sc.distinct}, w1=${per('w1')} w2=${per('w2')} w3=${per('w3')}) `
    + `final=${done?.cStatus} ${done?.nCompleted}/${done?.nTotal}/${done?.nFailed} hash=${hash.done}+${hash.failed}/${hash.total} seen=${seen} finalizes=${finals} notifications=${notif} counterDecreases=${regress} `
    + `stalledEvents=${stalled} bullFailedForGood=${bullFailed} queue=w${counts.waiting}/a${counts.active}/d${counts.delayed}/f${counts.failed} `
    + `kill1@${((tKill1 - t0) / 1000).toFixed(1)}s kill2@${((tKill2 - t0) / 1000).toFixed(1)}s done@${((tDone - t0) / 1000).toFixed(1)}s unhandled=${h.unhandled.length}`;
  await h.teardown();
  return verdict('Q1', pass, numbers, { sc, hash, counts, unhandled: h.unhandled });
}

async function killDuringOrchestrator() {
  const N = 300;
  const h = new HarnessV2({ label: 'Q1b' });
  await h.flush();
  const files = makeFiles(N, 'q1b');
  // first getfiles call = the SP call the dead process never returned from
  h.db.getfiles = (_q, callNo) => callNo === 1 ? new Promise<any>(() => { }) : files;
  h.scan = { delayMs: 20, result: true };
  const s1 = await h.stack('w1', { HYPERLINK_WORKERS: '3' }, { settings: PROD_STALL });
  const body = bodyFor({ nSectionid: 'S-Q1b', nBundleid: 'B-Q1b' });
  const res = await s1.gen.starthyperlink(body, false);
  const key = res.data.queueName, batchId = res.data.batchId;
  const t0 = now();
  await sleep(600);
  const hashAtKill = await h.redis.hgetall(`HYPERLINK-BATCH/${batchId}`);
  h.killTag('w1'); await s1.bq.close(true); await s1.fq.close(true);
  const s2 = await h.stack('w2', { HYPERLINK_WORKERS: '3' }, { settings: PROD_STALL });
  const done = await h.waitForDone(key, 60000);
  await sleep(800);
  const sc = h.scanStats(batchId);
  const orchStalled = h.bullEvents.filter(e => e.event === 'stalled' && e.queue === 'hyperlink-queue').length;
  const orchFailed = h.bullEvents.filter(e => e.event === 'failed' && e.queue === 'hyperlink-queue').length;
  const finals = h.responces(key).filter(e => e.data.data.cStatus !== 'P').length;
  const notif = h.notifications().length;
  const hash = await h.redis.hgetall(`HYPERLINK-BATCH/${batchId}`);
  const counts = await h.counts(s2.fq);
  const pass = !!done && done.cStatus === 'C' && done.nCompleted === N && h.getfilesCalls === 2 && sc.totalCalls === N && sc.distinct === N
    && finals === 1 && notif === 1 && counts.waiting + counts.active + counts.delayed === 0;
  const numbers = `getfilesCalls=${h.getfilesCalls} (1st never returned) enqueuedAtKill=${hashAtKill.enqueued || 0} orchestratorStalled=${orchStalled} orchestratorFailed=${orchFailed} `
    + `final=${done?.cStatus} ${done?.nCompleted}/${done?.nTotal}/${done?.nFailed} scans=${sc.totalCalls} (distinct ${sc.distinct}) hash=${hash.done}/${hash.total} finalizes=${finals} notifications=${notif} `
    + `queue=w${counts.waiting}/a${counts.active}/d${counts.delayed} wall=${((now() - t0) / 1000).toFixed(1)}s`;
  await h.teardown();
  return verdict('Q1b', pass, numbers, { hash, counts });
}
