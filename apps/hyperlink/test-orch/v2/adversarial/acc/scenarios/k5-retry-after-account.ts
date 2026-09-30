/**
 * K5 (e) - Bull retry of a file job whose first attempt already counted it.
 *   K5a: the worker wrapper throws AFTER handleFile returned (scan done,
 *        accounted) for file e-00003, attempt 1 only. Bull retries the job
 *        (attempts 2, backoff 100 ms): the file must NOT be double counted
 *        and must NOT be scanned again; final C 10/10, one finalize.
 *   K5b: the same, but on the LAST file and the crash sits BETWEEN the
 *        accounting Lua and the finalize (finalize() never returns = the
 *        process died right there; then the worker is killed and a new one
 *        started so Bull re-runs the stalled job). §6 promises exactly one
 *        finalize / one notification per batch -- does the re-run recover
 *        the lost notification, or is the batch C with 0 notifications?
 */
import { Job } from 'bull';
import { HarnessV2, FAST_STALL, bodyFor, makeFiles, now, verdict, sleep } from '../../../harness';

export async function run() {
  return [await throwAfterAccount(), await crashBetweenLuaAndFinalize()];
}

async function throwAfterAccount() {
  const N = 10;
  const h = new HarnessV2({ label: 'K5a' });
  await h.flush();
  h.db.getfiles = () => makeFiles(N, 'e');
  // e-00010 is slow so the batch is still RUNNING when the retry of e-00003 executes (the 'seen' pre-check path)
  h.scan = { delayMs: (f) => f.nBundledetailid === 'e-00010' ? 2500 : 20, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '2', HYPERLINK_FILE_BACKOFF_MS: '100' }, { noWorkers: true });
  h.registerOrchestrator(s.bq, s.orchestrator);
  let thrown = 0;
  s.fq.process(5, async (job: Job) => {
    await s.fileProcessor.handleFile(job);
    if (job.data.file.nBundledetailid === 'e-00003' && job.attemptsMade === 0) { thrown++; throw new Error('crash after accounting'); }
  });
  const r = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-K5a', nBundleid: 'B' }), false);
  const done = await h.waitForDone(r.data.queueName, 20000);
  await sleep(1500);   // the retry runs after the backoff
  const hash = await h.redis.hgetall(`HYPERLINK-BATCH/${r.data.batchId}`);
  const seen = await h.redis.scard(`HYPERLINK-BATCH/${r.data.batchId}/seen`);
  const sc = h.scanStats(r.data.batchId);
  const scansOf3 = h.scanCalls.filter(c => c.nBundledetailid === 'e-00003').length;
  const skipped = h.logs.filter(l => /already counted, skipped before python/.test(l)).length;
  const bullFailed = h.bullEvents.filter(e => e.queue === 'hyperlink-file-queue' && e.event === 'failed');
  const jobId3 = s.batch.fileJobId(r.data.batchId, hash.run, 'e-00003');
  const completed3 = h.bullEvents.filter(e => e.queue === 'hyperlink-file-queue' && e.event === 'completed' && e.jobId === jobId3).length;
  const failed3 = bullFailed.filter(e => e.jobId === jobId3).length;
  const counts = await h.counts(s.fq);
  const terminalEmits = h.responces(r.data.queueName).filter(e => e.data.data.cStatus !== 'P').length;
  const notifs = h.notifications().length;
  const pass = thrown === 1 && failed3 === 1 && completed3 === 1 && done?.cStatus === 'C' && done.nCompleted === N && done.nFailed === 0 && Number(hash.done) === N && Number(hash.failed) === 0 && seen === N
    && sc.totalCalls === N && scansOf3 === 1 && skipped === 1 && terminalEmits === 1 && notifs === 1 && counts.waiting + counts.active + counts.delayed + counts.failed === 0;
  const numbers = `thrownAfterAccount=${thrown} bull(e-00003): failed=${failed3} completedOnRetry=${completed3} (${bullFailed.map(e => e.reason).join(';')}) retrySkippedBeforePython=${skipped} scansOfRetriedFile=${scansOf3} scans=${sc.totalCalls}/${N} final=${done?.cStatus} ${done?.nCompleted}/${done?.nTotal}/${done?.nFailed} hash=${hash.done}+${hash.failed} seen=${seen} terminalEmits=${terminalEmits} notifications=${notifs} queue=w${counts.waiting}/a${counts.active}/d${counts.delayed}/f${counts.failed}`;
  await h.teardown();
  return verdict('K5a', pass, numbers);
}

async function crashBetweenLuaAndFinalize() {
  const N = 6;
  const h = new HarnessV2({ label: 'K5b' });
  await h.flush();
  h.db.getfiles = () => makeFiles(N, 'e2');
  h.scan = { delayMs: 20, result: true };
  const s1 = await h.stack('w1', { HYPERLINK_WORKERS: '1' }, { settings: FAST_STALL });
  // the process dies right after the accounting Lua of the finalizing file: finalize() never returns
  let finalizeCalls = 0;
  const origFinalize = s1.batch.finalize.bind(s1.batch);
  (s1.batch as any).finalize = (snap: any) => { finalizeCalls++; if (finalizeCalls === 1) return new Promise(() => { /* dead */ }); return origFinalize(snap); };
  const r = await s1.gen.starthyperlink(bodyFor({ nSectionid: 'S-K5b', nBundleid: 'B' }), false);
  const key = r.data.queueName, batchId = r.data.batchId;
  const keyC = await h.waitFor(async () => (await h.snapshot(key))?.cStatus === 'C', 10000, 20);
  await sleep(300);
  const notifBeforeKill = h.notifications().length;
  const hashAtKill = await h.redis.hgetall(`HYPERLINK-BATCH/${batchId}`);
  const activeAtKill = (await h.counts(s1.fq)).active;
  h.killTag('w1'); await s1.bq.close(true); await s1.fq.close(true);
  const s2 = await h.stack('w2', { HYPERLINK_WORKERS: '1' }, { settings: FAST_STALL });
  const t0 = now();
  const rerun = await h.waitFor(() => h.bullEvents.some(e => e.queue === 'hyperlink-file-queue' && e.event === 'stalled'), 30000, 100);
  await h.waitFor(async () => { const c = await h.counts(s2.fq); return c.active + c.waiting + c.delayed === 0; }, 30000, 100);
  await sleep(1000);
  const hash = await h.redis.hgetall(`HYPERLINK-BATCH/${batchId}`);
  const notifs = h.notifications().length;
  const terminalEmits = h.responces(key).filter(e => e.data.data.cStatus !== 'P').length;
  const skipped = h.logs.filter(l => /already counted, skipped before python/.test(l)).length;
  const recovered = h.logs.filter(l => /finished C:/.test(l)).length;
  const counts = await h.counts(s2.fq);
  const snap = await h.snapshot(key);
  const ttls = { key: await h.redis.ttl(key), hash: await h.redis.ttl(`HYPERLINK-BATCH/${batchId}`) };
  const pass = keyC >= 0 && notifBeforeKill === 0 && notifs === 1 && terminalEmits >= 1 && snap?.cStatus === 'C' && hash.notified === '1'
    && counts.active + counts.waiting + counts.delayed + counts.failed === 0;
  const numbers = `key C after ${keyC}ms with finalize() hung (hash finalized=${hashAtKill.finalized} notified=${hashAtKill.notified || 0}, active=${activeAtKill}, notificationsBeforeKill=${notifBeforeKill}) -> worker killed, w2: stalled re-run after ${rerun >= 0 ? (rerun / 1000).toFixed(1) + 's' : 'never'} `
    + `retrySkippedBeforePython=${skipped} finalizeRecoveredLogs=${recovered} notificationsTotal=${notifs} terminalEmits=${terminalEmits} hash.notified=${hash.notified || 0} key=${snap?.cStatus} ${snap?.nCompleted}/${snap?.nTotal} ttl key=${ttls.key} hash=${ttls.hash} queue=w${counts.waiting}/a${counts.active}/f${counts.failed} (+${((now() - t0) / 1000).toFixed(1)}s)`;
  await h.teardown();
  return verdict('K5b', pass, numbers, { hash, hashAtKill });
}
