/**
 * X1 (a) - 2,000 files, the file worker is killed and restarted TWICE mid-batch.
 *   Exact scan count vs 2,000 (extra = files in flight at each kill, <= workers
 *   per kill), exactly one finalize, one notification, final 2000/0/C.
 * X1b - the SAME long file is in flight at both kills (a 12 s file with one
 *   worker, killed at 2 s and again ~2 s after the stalled re-run started).
 *   Bull's maxStalledCount (1 by default, also in FAST_STALL) fails the job for
 *   good on the second stall: does the batch still reach a terminal state?
 */
import { HarnessV2, FAST_STALL, bodyFor, makeFiles, now, verdict, sleep } from '../../harness';

export async function run() {
  const out: any[] = [];
  out.push(await killTwice());
  out.push(await sameFileTwice());
  return out;
}

async function killTwice() {
  const N = 2000, FILE_MS = 30;
  const h = new HarnessV2({ label: 'X1' });
  await h.flush();
  const files = makeFiles(N, 'x1');
  h.db.getfiles = () => files;
  h.scan = { delayMs: FILE_MS, result: true };
  const s1 = await h.stack('w1', { HYPERLINK_WORKERS: '3' }, { settings: FAST_STALL });
  const body = bodyFor({ nSectionid: 'S-X1', nBundleid: 'B-X1' });
  const res = await s1.gen.starthyperlink(body, false);
  const key = res.data.queueName, batchId = res.data.batchId;
  const t0 = now();
  await sleep(3000);
  const inflight1 = h.scanCalls.filter(c => c.tag === 'w1' && !c.tEnd).length;
  h.killTag('w1'); await s1.bq.close(true); await s1.fq.close(true);
  const s2 = await h.stack('w2', { HYPERLINK_WORKERS: '3' }, { settings: FAST_STALL });
  // second kill once w2 has done a good chunk of work
  await h.waitFor(() => h.scanCalls.filter(c => c.tag === 'w2' && c.tEnd).length >= 400, 60000);
  const inflight2 = h.scanCalls.filter(c => c.tag === 'w2' && !c.tEnd).length;
  h.killTag('w2'); await s2.bq.close(true); await s2.fq.close(true);
  const s3 = await h.stack('w3', { HYPERLINK_WORKERS: '3' }, { settings: FAST_STALL });
  const done = await h.waitForDone(key, 180000);
  await sleep(1500);
  const wall = (now() - t0) / 1000;
  const sc = h.scanStats(batchId);
  const per = (tag: string) => h.scanCalls.filter(c => c.tag === tag).length;
  const stalled = h.bullEvents.filter(e => e.event === 'stalled' && e.queue === 'hyperlink-file-queue').length;
  const bullFailed = h.bullEvents.filter(e => e.event === 'failed' && e.queue === 'hyperlink-file-queue');
  const finals = h.responces(key).filter(e => e.data.data.cStatus !== 'P').length;
  const notif = h.notifications().length;
  const hash = await h.redis.hgetall(`HYPERLINK-BATCH/${batchId}`);
  const seen = await h.redis.scard(`HYPERLINK-BATCH/${batchId}/seen`);
  const counts = await h.counts(s3.fq);
  const regress = h.regressions(key);
  const pass = !!done && done.cStatus === 'C' && done.nCompleted === N && done.nFailed === 0 && sc.distinct === N
    && sc.totalCalls <= N + 2 * 3 /* <= HYPERLINK_WORKERS in flight per kill, incl. a job picked up during close(true) */ && finals === 1 && notif === 1 && Number(hash.done) === N && seen === N
    && counts.waiting + counts.active + counts.delayed + counts.failed === 0 && regress === 0;
  const numbers = `scans=${sc.totalCalls} vs ${N} (extra=${sc.totalCalls - N} <= 3 per kill, scanningAtKill1=${inflight1}, scanningAtKill2=${inflight2}, w1=${per('w1')} w2=${per('w2')} w3=${per('w3')}, dupFiles=${sc.moreThanOnce}) `
    + `stalledEvents=${stalled} bullFailed=${bullFailed.length} final=${done?.nCompleted}/${done?.nTotal}/${done?.nFailed}/${done?.cStatus} hash.done=${hash.done} seen=${seen} finalizes=${finals} notifications=${notif} counterDecreases=${regress} `
    + `queue=w${counts.waiting}/a${counts.active}/d${counts.delayed}/f${counts.failed} wall=${wall.toFixed(1)}s`;
  await h.teardown();
  return verdict('X1', pass, numbers, { sc, hash, counts, unhandled: h.unhandled });
}

async function sameFileTwice() {
  const N = 40;
  const h = new HarnessV2({ label: 'X1b' });
  await h.flush();
  const files = makeFiles(N, 'x1b');
  files[0].nBundledetailid = 'x1b-slow';
  h.db.getfiles = () => files;
  h.scan = { delayMs: (f) => f.nBundledetailid === 'x1b-slow' ? 12000 : 30, result: true };
  const s1 = await h.stack('w1', { HYPERLINK_WORKERS: '1' }, { settings: FAST_STALL });
  const body = bodyFor({ nSectionid: 'S-X1b', nBundleid: 'B-X1b' });
  const res = await s1.gen.starthyperlink(body, false);
  const key = res.data.queueName, batchId = res.data.batchId;
  const t0 = now();
  await sleep(2000);
  const slowInFlight1 = h.scanCalls.some(c => c.tag === 'w1' && c.nBundledetailid === 'x1b-slow' && !c.tEnd);
  h.killTag('w1'); await s1.bq.close(true); await s1.fq.close(true);
  const s2 = await h.stack('w2', { HYPERLINK_WORKERS: '1' }, { settings: FAST_STALL });
  // wait for the stalled re-run of the slow file on w2, then kill again while it runs
  const rerun = await h.waitFor(() => h.scanCalls.some(c => c.tag === 'w2' && c.nBundledetailid === 'x1b-slow'), 60000);
  await sleep(2000);
  const slowInFlight2 = h.scanCalls.some(c => c.tag === 'w2' && c.nBundledetailid === 'x1b-slow' && !c.tEnd);
  h.killTag('w2'); await s2.bq.close(true); await s2.fq.close(true);
  const s3 = await h.stack('w3', { HYPERLINK_WORKERS: '1' }, { settings: FAST_STALL });
  const done = await h.waitForDone(key, 45000);
  const snap = await h.snapshot(key);
  const hash = await h.redis.hgetall(`HYPERLINK-BATCH/${batchId}`);
  const counts = await h.counts(s3.fq);
  const bullFailed = h.bullEvents.filter(e => e.event === 'failed' && e.queue === 'hyperlink-file-queue');
  const slowScans = h.scanCalls.filter(c => c.nBundledetailid === 'x1b-slow').map(c => c.tag).join(',');
  const notif = h.notifications().length;
  const terminal = !!done && done.cStatus !== 'P';
  const pass = terminal && Number(hash.done) + Number(hash.failed) === N && notif === 1;
  const numbers = `slowInFlightAtKill1=${slowInFlight1} rerunOnW2After=${rerun >= 0 ? (rerun / 1000).toFixed(1) + 's' : 'never'} slowInFlightAtKill2=${slowInFlight2} slowScans=[${slowScans}] `
    + `bullFailed=${bullFailed.length}${bullFailed.length ? ` ("${bullFailed[0].reason}")` : ''} afterKill2: status=${snap?.cStatus} ${snap?.nCompleted}/${snap?.nTotal} failed=${snap?.nFailed} hash=${hash.done}+${hash.failed}/${hash.total} finalized=${hash.finalized || 0} `
    + `queue=w${counts.waiting}/a${counts.active}/d${counts.delayed}/f${counts.failed} notifications=${notif} terminalWithin45s=${terminal} wall=${((now() - t0) / 1000).toFixed(1)}s`;
  await h.teardown();
  return verdict('X1b', pass, numbers, { hash, counts, bullFailed });
}
