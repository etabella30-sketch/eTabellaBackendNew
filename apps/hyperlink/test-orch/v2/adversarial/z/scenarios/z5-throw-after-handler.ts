/**
 * Z5 (e) - Bull retries a file job whose first attempt already counted it.
 * The throw is injected OUTSIDE the product handler (the worker function
 * registered on the queue awaits handleFile and then throws), so every job --
 * the finalizer included -- is counted, then failed by Bull, then retried
 * after the backoff.
 *   Z5a: throw after the handler on attempt 1 of EVERY job (40 files):
 *        scans == 40, hash done == 40, seen == 40, one finalize / one
 *        notification, 40 non-terminal Bull failures, queue empty.
 *   Z5b: throw after the handler on BOTH attempts of every job: the terminal
 *        Bull failures go through the `failed` listener (counted F there),
 *        which must be a no-op for files already counted: final C 40/40,
 *        hash failed == 0, one notification, failed set empty.
 */
import { HarnessV2, bodyFor, makeFiles, verdict, sleep } from '../../../harness';
import { statusSeq } from '../util';

export async function run() { return [await scenario('Z5a', false), await scenario('Z5b', true)]; }

async function scenario(id: string, throwBoth: boolean) {
  const N = 40;
  const h = new HarnessV2({ label: id });
  await h.flush();
  const files = makeFiles(N, id.toLowerCase());
  h.db.getfiles = () => files;
  h.scan = { delayMs: 20, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '3', HYPERLINK_FILE_BACKOFF_MS: '150' }, { noWorkers: true });
  h.registerOrchestrator(s.bq, s.orchestrator);
  let thrown = 0;
  s.fq.process(5, async (job) => {
    await s.fileProcessor.handleFile(job);
    if (throwBoth || job.attemptsMade === 0) { thrown++; throw new Error(`post-handler crash attempt ${job.attemptsMade + 1}`); }
  });
  const r = await s.gen.starthyperlink(bodyFor({ nSectionid: `S-${id}`, nBundleid: 'B' }), false);
  const key = r.data.queueName, batchId = r.data.batchId;
  const done = await h.waitForDone(key, 30000);
  // wait until every retry went through
  await h.waitFor(async () => { const c = await h.counts(s.fq); return c.waiting + c.active + c.delayed === 0; }, 30000);
  await sleep(1000);
  const hash = await h.redis.hgetall(`HYPERLINK-BATCH/${batchId}`);
  const seen = await h.redis.scard(`HYPERLINK-BATCH/${batchId}/seen`);
  const sc = h.scanStats(batchId);
  const failedEvents = h.bullEvents.filter(e => e.queue === 'hyperlink-file-queue' && e.event === 'failed');
  const seq = statusSeq(h, key);
  const notif = h.notifications().map(e => e.data.cMsg.split(' | ')[0]);
  const counts = await h.counts(s.fq);
  const snapNow = await h.snapshot(key);
  const spC = h.spCalls.filter(c => c.sp.startsWith('hyperlink_update_documents') && c.cStatus === 'C').length;
  const countedF = h.logs.filter(l => /failed for good in Bull/.test(l)).length;
  const pass = done?.cStatus === 'C' && done.nCompleted === N && Number(hash.done) === N && Number(hash.failed) === 0 && seen === N && sc.totalCalls === N && sc.distinct === N && spC === N
    && seq.terminalEmits === 1 && notif.length === 1 && h.regressions(key) === 0 && snapNow?.cStatus === 'C' && snapNow.nCompleted === N && snapNow.nFailed === 0
    && counts.waiting + counts.active + counts.delayed + counts.failed === 0 && thrown === (throwBoth ? 2 * N : N);
  const numbers = `postHandlerThrows=${thrown} (${throwBoth ? 'both attempts' : 'attempt 1'} of ${N} jobs) bullFailedEvents=${failedEvents.length} failedListenerCountedF=${countedF} scans=${sc.totalCalls} (distinct ${sc.distinct}) SP'C'=${spC} final=${done?.cStatus} ${done?.nCompleted}/${done?.nTotal} nowKey=${snapNow?.cStatus} ${snapNow?.nCompleted}/${snapNow?.nFailed} hash=${hash.done}+${hash.failed}/${hash.total} seen=${seen} terminalEmits=${seq.terminalEmits} notifications=[${notif.join(',')}] counterDecreases=${h.regressions(key)} queue=w${counts.waiting}/a${counts.active}/d${counts.delayed}/f${counts.failed}`;
  await h.teardown();
  return verdict(id, pass, numbers);
}
