/**
 * A1 - No duplicate work. 600 files x 50 ms, HYPERLINK_WORKERS 3.
 *  - the bundle (orchestrator) job is re-submitted with an artificial Bull
 *    timeout of 2 s / attempts 2 (the ORCH_FINDINGS blocker 1 mechanism):
 *    hyperlink_getfiles takes 2.5 s on its first call, so attempt 1 is failed
 *    by Bull while still running and attempt 2 starts beside it;
 *  - 20 random file jobs reject once (python spawn error) -> Bull retry.
 * Expect: scans == 600 + 20 (retries), done == 600, exactly 1 finalize,
 * 1 notification, the counter never decreases.
 */
import { HarnessV2, bodyFor, makeFiles, now, verdict, sleep } from '../harness';

const N = 600, FILE_MS = 50;

export async function run() {
  const h = new HarnessV2({ label: 'A1' });
  await h.flush();
  const files = makeFiles(N, 'a1');
  const retryIds = new Set<string>();
  while (retryIds.size < 20) retryIds.add(files[Math.floor(Math.random() * N)].nBundledetailid);
  h.db.getfiles = async (_q, callNo) => { if (callNo === 1) await sleep(2500); return files; };
  h.scan = { delayMs: FILE_MS, result: (file, callNo) => (retryIds.has(file.nBundledetailid) && callNo === 1) ? 'throw' : true };

  const s = await h.stack('w1', { HYPERLINK_WORKERS: '3' }, { noWorkers: true });
  const body = bodyFor({ nSectionid: 'S-A1', nBundleid: 'B-A1' });
  const res = await s.gen.starthyperlink(body, false);
  // swap the real bundle job for one with the scaled timeout/attempts (same data)
  const waiting = await s.bq.getWaiting();
  for (const j of waiting) await j.remove();
  await s.bq.add(res.data, { removeOnComplete: true, removeOnFail: true, timeout: 2000, attempts: 2, backoff: 500 });
  const t0 = now();
  h.registerOrchestrator(s.bq, s.orchestrator);
  h.registerFileWorker(s.fq, s.fileProcessor);

  const progressKey = res.data.queueName;
  const done = await h.waitForDone(progressKey, 120000);
  await sleep(1500);                                       // let stragglers (if any) show up
  const wall = (now() - t0) / 1000;
  const sc = h.scanStats(res.data.batchId);
  const orchestratorRuns = h.logs.filter(l => l.startsWith('Processing hyperlink batch')).length;
  const orchestratorSkips = h.logs.filter(l => /enqueued by (an earlier|a concurrent) run|already enqueued/.test(l)).length;
  const bundleTimeouts = h.bullEvents.filter(e => e.queue === 'hyperlink-queue' && e.event === 'failed').length;
  const fileRetries = h.bullEvents.filter(e => e.queue === 'hyperlink-file-queue' && e.event === 'failed').length;
  const finals = h.responces(progressKey).filter(e => e.data.data.cStatus !== 'P').length;
  const notif = h.notifications().length;
  const regress = h.regressions(progressKey);
  const hash = await h.redis.hgetall(`HYPERLINK-BATCH/${res.data.batchId}`);
  const counts = await h.counts(s.fq);
  const pass = !!done && done.cStatus === 'C' && done.nCompleted === N && done.nFailed === 0
    && sc.distinct === N && sc.totalCalls === N + 20 && finals === 1 && notif === 1 && regress === 0
    && Number(hash.done) === N && counts.waiting + counts.active + counts.delayed === 0 && orchestratorRuns >= 2;
  const numbers = `scans=${sc.totalCalls} (distinct ${sc.distinct}, expected ${N}+20) done=${done?.nCompleted}/${done?.nTotal} failed=${done?.nFailed} status=${done?.cStatus} `
    + `orchestratorRuns=${orchestratorRuns} (bullTimeouts=${bundleTimeouts}, skipped=${orchestratorSkips}) fileRetries=${fileRetries} finalizes=${finals} notifications=${notif} counterDecreases=${regress} wall=${wall.toFixed(1)}s`;
  await h.teardown();
  return verdict('A1', pass, numbers, { sc, hash, counts, unhandled: h.unhandled.length });
}
