/**
 * A11 - Cancel + restart while the first orchestrator is still inside
 * hyperlink_getfiles (owner decision D2). The SP takes 1.2 s; the user cancels
 * at 300 ms and starts the same bundle again at 400 ms. The OLD orchestrator
 * resumes after the SP with a run token that no longer matches the hash: it
 * must abort without touching the new batch (no jobs of the old run, no
 * total/enqueue claim), and the NEW run must reach C N/N with exactly one
 * "Hyperlink Successful" notification (plus the one "Hyperlink cancelled").
 * A third start afterwards is accepted (the lock was released by finalize).
 */
import { HarnessV2, bodyFor, makeFiles, verdict, sleep } from '../harness';

const N = 20;

export async function run() {
  const h = new HarnessV2({ label: 'A11' });
  await h.flush();
  const files = makeFiles(N, 'a11');
  h.db.getfiles = async () => { await sleep(1200); return files; };
  h.scan = { delayMs: 20, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '3' });
  const body = bodyFor({ nSectionid: 'S-A11', nBundleid: 'B' });
  const r1 = await s.gen.starthyperlink(body, false);
  const key = r1.data.queueName, batchId = r1.data.batchId;
  const run1 = (await h.redis.hgetall(`HYPERLINK-BATCH/${batchId}`)).run;
  await sleep(300);
  const c = await s.gen.cancelhyperlink({ nCaseid: 'c1', nSectionid: 'S-A11', nBundleid: 'B' } as any);
  await sleep(100);
  const r2 = await s.gen.starthyperlink(body, false);
  const run2 = (await h.redis.hgetall(`HYPERLINK-BATCH/${batchId}`)).run;
  await h.waitFor(() => h.getfilesCalls >= 2, 5000);
  const done = await h.waitForDone(key, 20000);
  await h.waitFor(async () => (await h.counts(s.bq)).active + (await h.counts(s.bq)).waiting === 0, 5000);
  await sleep(600);
  const hash = await h.redis.hgetall(`HYPERLINK-BATCH/${batchId}`);
  const jobsSet = await h.redis.scard(`HYPERLINK-BATCH/${batchId}/jobs`);
  const superseded = h.logs.filter(l => /superseded by a newer run while loading files/.test(l)).length;
  const ignored = h.logs.filter(l => /belongs to an older run|superseded run, skipped before python/.test(l)).length;
  const sc = h.scanStats(batchId);
  const spC = h.spCalls.filter(x => x.sp.startsWith('hyperlink_update_documents') && x.cStatus === 'C').length;
  const notifs = h.notifications().map(e => e.data.cMsg);
  const successful = notifs.filter(m => /Successful/.test(m)).length;
  const cancelled = notifs.filter(m => /cancelled/.test(m)).length;
  const counts = await h.counts(s.fq);
  const r3 = await s.gen.starthyperlink(body, false);
  const pass = c.msg === 1 && r2.msg === 1 && run1 !== run2 && hash.run === run2 && done?.cStatus === 'C' && done.nCompleted === N && done.nTotal === N
    && Number(hash.total) === N && jobsSet === N && superseded === 1 && ignored === 0 && sc.totalCalls === N && sc.distinct === N && spC === N
    && successful === 1 && cancelled === 1 && notifs.length === 2 && counts.waiting + counts.active + counts.delayed === 0 && r3.msg === 1;
  const numbers = `getfiles=1.2s cancel@300ms msg=${c.msg} restart@400ms msg=${r2.msg} runChanged=${run1 !== run2} getfilesCalls=${h.getfilesCalls} oldOrchestratorAborted=${superseded} `
    + `| final key=${done?.cStatus} ${done?.nCompleted}/${done?.nTotal} hash run=${hash.run === run2 ? 'new' : 'OLD'} total=${hash.total} done=${hash.done} enqueueDone=${hash.enqueueDone} jobsSet=${jobsSet} `
    + `scans=${sc.totalCalls} distinct=${sc.distinct} SP'C'=${spC} oldRunJobsIgnored=${ignored} notifications=${notifs.length} (successful=${successful} cancelled=${cancelled}) queue=w${counts.waiting}/a${counts.active} | 3rd start msg=${r3.msg}`;
  await h.teardown();
  return verdict('A11', pass, numbers, { hash });
}
