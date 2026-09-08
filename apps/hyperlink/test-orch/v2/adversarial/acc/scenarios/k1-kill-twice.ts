/**
 * K1 (a) - 2,000 files, the file worker is killed and restarted TWICE mid-batch.
 *   K1a: kill #1 at 2.5 s (enqueue finished, scanning), kill #2 once >= 1000
 *        files are done. EXACT scan count vs 2,000 (extra <= in-flight per
 *        kill), exactly one finalize (one terminal socket event, one
 *        "finished" log line, one notification), final 2000/0/C, hash and
 *        seen set == 2000, queue empty, counter never decreases.
 *   K1b: the PROCESS dies while the ORCHESTRATOR is still enqueueing (its
 *        3rd addBulk chunk never returns, both queues closed) -> the bundle
 *        job stalls, the new process re-runs it ('inflight' -> re-add).
 *        Must still end at exactly 2000 distinct scans, no double scan of the
 *        already completed files, one finalize.
 */
import { HarnessV2, FAST_STALL, bodyFor, makeFiles, now, verdict, sleep } from '../../../harness';

export async function run() {
  return [await killTwice(), await orchestratorDies()];
}

async function killTwice() {
  const N = 2000, FILE_MS = 30;
  const h = new HarnessV2({ label: 'K1a' });
  await h.flush();
  const files = makeFiles(N, 'k1');
  h.db.getfiles = () => files;
  h.scan = { delayMs: FILE_MS, result: true };
  const s1 = await h.stack('w1', { HYPERLINK_WORKERS: '3' }, { settings: FAST_STALL });
  const body = bodyFor({ nSectionid: 'S-K1', nBundleid: 'B-K1' });
  const res = await s1.gen.starthyperlink(body, false);
  const key = res.data.queueName, batchId = res.data.batchId;
  const t0 = now();
  await sleep(2500);
  const enq1 = await h.redis.hget(`HYPERLINK-BATCH/${batchId}`, 'enqueueDone');
  const done1 = Number(await h.redis.hget(`HYPERLINK-BATCH/${batchId}`, 'done'));
  const kill1At = now();
  h.killTag('w1'); await s1.bq.close(true); await s1.fq.close(true);
  const s2 = await h.stack('w2', { HYPERLINK_WORKERS: '3' }, { settings: FAST_STALL });
  const tKill1 = now();
  await h.waitFor(async () => Number(await h.redis.hget(`HYPERLINK-BATCH/${batchId}`, 'done')) >= 1000, 90000, 50);
  const done2 = Number(await h.redis.hget(`HYPERLINK-BATCH/${batchId}`, 'done'));
  const kill2At = now();
  h.killTag('w2'); await s2.bq.close(true); await s2.fq.close(true);
  const s3 = await h.stack('w3', { HYPERLINK_WORKERS: '3' }, { settings: FAST_STALL });
  const done = await h.waitForDone(key, 120000);
  await sleep(2000);   // let any straggler finish
  const wall = (now() - t0) / 1000;
  const sc = h.scanStats(batchId);
  const per = (tag: string) => h.scanCalls.filter(c => c.tag === tag).length;
  // scans running at the kill instant (they complete on the dead worker and are re-run = the allowed duplicates)
  // plus scans the dead worker still STARTED after the kill (never resolve, re-run as well)
  const atKill = (tag: string, at: number) => h.scanCalls.filter(c => c.tag === tag && c.t <= at && (!c.tEnd || c.tEnd > at)).length;
  const afterKill = (tag: string, at: number) => h.scanCalls.filter(c => c.tag === tag && c.t > at).length;
  const inflight1 = atKill('w1', kill1At), inflight2 = atKill('w2', kill2At), dead1 = afterKill('w1', kill1At), dead2 = afterKill('w2', kill2At);
  const WORKERS = 3;   // DESIGN_V2 §6 A2: extra scans <= in-flight (<= workers) per kill
  const stalled = h.bullEvents.filter(e => e.event === 'stalled' && e.queue === 'hyperlink-file-queue').length;
  const bullFailed = h.bullEvents.filter(e => e.event === 'failed' && e.queue === 'hyperlink-file-queue');
  const terminalEmits = h.responces(key).filter(e => e.data.data.cStatus !== 'P').length;
  const finishedLogs = h.logs.filter(l => /finished C:|finished F:/.test(l) && l.includes(batchId)).length;
  const notif = h.notifications().length;
  const hash = await h.redis.hgetall(`HYPERLINK-BATCH/${batchId}`);
  const seen = await h.redis.scard(`HYPERLINK-BATCH/${batchId}/seen`);
  const counts = await h.counts(s3.fq);
  const regress = h.regressions(key);
  const spC = h.spCalls.filter(c => c.cStatus === 'C').length;
  const pass = !!done && done.cStatus === 'C' && done.nCompleted === N && done.nFailed === 0 && done.nTotal === N
    && sc.distinct === N && sc.totalCalls <= N + 2 * WORKERS && sc.totalCalls >= N
    && terminalEmits === 1 && finishedLogs === 1 && notif === 1
    && Number(hash.done) === N && Number(hash.failed) === 0 && seen === N
    && counts.waiting + counts.active + counts.delayed + counts.failed === 0 && regress === 0 && enq1 === '1';
  const numbers = `scans=${sc.totalCalls} vs ${N} (extra=${sc.totalCalls - N} <= ${2 * WORKERS}; at kill1: running=${inflight1} startedAfterKill=${dead1}, at kill2: running=${inflight2} startedAfterKill=${dead2}; doneAtKill1=${done1} doneAtKill2=${done2}, w1=${per('w1')} w2=${per('w2')} w3=${per('w3')}, dupFiles=${sc.moreThanOnce}, maxPerFile=${sc.max}) `
    + `final=${done?.nCompleted}/${done?.nTotal}/${done?.nFailed}/${done?.cStatus} hash=${hash.done}+${hash.failed}/${hash.total} seen=${seen} SP'C'=${spC} terminalEmits=${terminalEmits} finishedLogs=${finishedLogs} notifications=${notif} `
    + `stalledEvents=${stalled} bullFailed=${bullFailed.length} counterDecreases=${regress} queue=w${counts.waiting}/a${counts.active}/d${counts.delayed}/f${counts.failed} enqueueDoneAtKill1=${enq1} wall=${wall.toFixed(1)}s`;
  await h.teardown();
  return verdict('K1a', pass, numbers, { sc, hash, counts, unhandled: h.unhandled });
}

async function orchestratorDies() {
  const N = 2000, FILE_MS = 20;
  const h = new HarnessV2({ label: 'K1b' });
  await h.flush();
  const files = makeFiles(N, 'k1b');
  h.db.getfiles = () => files;
  h.scan = { delayMs: FILE_MS, result: true };
  const s1 = await h.stack('w1', { HYPERLINK_WORKERS: '3' }, { settings: FAST_STALL });
  // the orchestrator's 3rd addBulk chunk never returns = the process died there
  const origAddBulk = s1.fq.addBulk.bind(s1.fq);
  let chunks = 0;
  let hung = false;
  (s1.fq as any).addBulk = (jobs: any[]) => {
    chunks++;
    if (chunks === 3) { hung = true; return new Promise(() => { /* dead */ }); }
    return origAddBulk(jobs);
  };
  const body = bodyFor({ nSectionid: 'S-K1b', nBundleid: 'B-K1b' });
  const res = await s1.gen.starthyperlink(body, false);
  const key = res.data.queueName, batchId = res.data.batchId;
  const t0 = now();
  const hungAt = await h.waitFor(() => hung, 10000, 20);
  await sleep(300);   // some of the first 1000 jobs are scanning now
  const hashAtKill = await h.redis.hgetall(`HYPERLINK-BATCH/${batchId}`);
  const jobsAtKill = await h.redis.scard(`HYPERLINK-BATCH/${batchId}/jobs`);
  const tKill = now();
  h.killTag('w1'); await s1.bq.close(true); await s1.fq.close(true);
  const inflight = h.scanCalls.filter(c => c.tag === 'w1' && c.t <= tKill && (!c.tEnd || c.tEnd > tKill)).length;
  const deadStarts = h.scanCalls.filter(c => c.tag === 'w1' && c.t > tKill).length;
  const s2 = await h.stack('w2', { HYPERLINK_WORKERS: '3' }, { settings: FAST_STALL });
  const rerun = await h.waitFor(() => h.bullEvents.some(e => e.queue === 'hyperlink-queue' && e.event === 'stalled'), 30000, 100);
  const done = await h.waitForDone(key, 120000);
  await sleep(1500);
  const wall = (now() - t0) / 1000;
  const sc = h.scanStats(batchId);
  const hash = await h.redis.hgetall(`HYPERLINK-BATCH/${batchId}`);
  const seen = await h.redis.scard(`HYPERLINK-BATCH/${batchId}/seen`);
  const jobsSet = await h.redis.scard(`HYPERLINK-BATCH/${batchId}/jobs`);
  const counts = await h.counts(s2.fq);
  const bcounts = await h.counts(s2.bq);
  const terminalEmits = h.responces(key).filter(e => e.data.data.cStatus !== 'P').length;
  const notif = h.notifications().length;
  const regress = h.regressions(key);
  const readd = h.logs.filter(l => /re-adding/.test(l)).length;
  const skippedSeen = h.logs.filter(l => /already counted, skipped before python/.test(l)).length;
  const bundleFailed = h.bullEvents.filter(e => e.queue === 'hyperlink-queue' && e.event === 'failed');
  const pass = hungAt >= 0 && !!done && done.cStatus === 'C' && done.nCompleted === N && done.nFailed === 0
    && sc.distinct === N && sc.totalCalls <= N + 3 /* <= workers in flight at the kill */ && terminalEmits === 1 && notif === 1
    && Number(hash.done) === N && seen === N && jobsSet === N && hash.enqueueDone === '1'
    && counts.waiting + counts.active + counts.delayed + counts.failed === 0 && bcounts.waiting + bcounts.active + bcounts.delayed + bcounts.failed === 0 && regress === 0;
  const numbers = `orchestrator died in addBulk chunk 3 (hash.total=${hashAtKill.total} enqueueDone=${hashAtKill.enqueueDone || 0} jobsRecorded=${jobsAtKill} runningAtKill=${inflight} startedAfterKill=${deadStarts}) -> bundle job stalled+rerun after ${rerun >= 0 ? (rerun / 1000).toFixed(1) + 's' : 'never'} readdLogs=${readd} `
    + `scans=${sc.totalCalls} vs ${N} (distinct=${sc.distinct} dup=${sc.moreThanOnce}) skippedAsSeen=${skippedSeen} final=${done?.nCompleted}/${done?.nTotal}/${done?.nFailed}/${done?.cStatus} hash=${hash.done}/${hash.total} enqueueDone=${hash.enqueueDone} seen=${seen} jobsSet=${jobsSet} `
    + `terminalEmits=${terminalEmits} notifications=${notif} bundleFailed=${bundleFailed.length} counterDecreases=${regress} fileQueue=w${counts.waiting}/a${counts.active}/d${counts.delayed}/f${counts.failed} bundleQueue=w${bcounts.waiting}/a${bcounts.active} wall=${wall.toFixed(1)}s (kill at +${((tKill - t0) / 1000).toFixed(1)}s)`;
  await h.teardown();
  return verdict('K1b', pass, numbers, { sc, hash, counts, unhandled: h.unhandled });
}
