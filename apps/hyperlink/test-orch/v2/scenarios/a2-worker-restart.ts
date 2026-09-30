/**
 * A2 - Worker restart (pm2). 400 files x 50 ms, workers 3. After 3 s the
 * first file worker is closed without waiting (queue.close(true)) and its
 * pending scans never resolve (process dead); a fresh worker is started.
 * Bull's stalled handling re-runs only the in-flight jobs (lock/stall
 * settings scaled to seconds: FAST_STALL), the seen set prevents double
 * counting. Expect total scans <= 400 + in-flight (<= workers... the Bull
 * cap of 5 active jobs is the hard bound), final 400/0/C, 1 notification,
 * progress key present with the final snapshot.
 */
import { HarnessV2, FAST_STALL, bodyFor, makeFiles, now, verdict, sleep } from '../harness';
import { HyperlinkService } from '../../../src/hyperlink.service';

const N = 400, FILE_MS = 50, CLOSE_AFTER_MS = 3000;

export async function run() {
  const h = new HarnessV2({ label: 'A2' });
  await h.flush();
  const files = makeFiles(N, 'a2');
  h.db.getfiles = () => files;
  h.scan = { delayMs: FILE_MS, result: true };

  const s1 = await h.stack('w1', { HYPERLINK_WORKERS: '3' }, { settings: FAST_STALL });
  const body = bodyFor({ nSectionid: 'S-A2', nBundleid: 'B-A2' });
  const res = await s1.gen.starthyperlink(body, false);
  const progressKey = res.data.queueName;
  const t0 = now();
  await sleep(CLOSE_AFTER_MS);
  const scansBeforeClose = h.scanCalls.length;
  const snapBefore = await h.snapshot(progressKey);
  const tClose = now();
  h.killTag('w1');                                         // pm2 killed the process: nothing of w1 resolves any more
  await s1.bq.close(true);
  await s1.fq.close(true);
  const s2 = await h.stack('w2', { HYPERLINK_WORKERS: '3' }, { settings: FAST_STALL });
  // the service restart also runs HyperlinkService.onModuleInit's wipe: it must
  // remove only legacy index keys (no batchId) and keep the v2 lock/progress
  // key, so an immediate restart of the same bundle is still rejected
  const legacyKey = 'HYPERLINK/m1/c1/S-legacy/null';
  await h.redis.set(legacyKey, JSON.stringify({ queueName: legacyKey, nCaseid: 'c1', nSectionid: 'S-legacy', nMasterid: 'm1', nBundledetailid: null, cStatus: 'P', nTotal: 3, nCompleted: 1, nFailed: 0 }));
  const wipe = await new HyperlinkService(s2.cfg, h.rds).deleteAllRunningHyperlinkJobs();
  const keyAfterWipe = await h.snapshot(progressKey);
  const legacyAfterWipe = await h.redis.get(legacyKey);
  const restartDuring = await s2.gen.starthyperlink(body, false);
  const done = await h.waitForDone(progressKey, 150000);
  await sleep(1000);
  const stalled = h.bullEvents.filter(e => e.event === 'stalled' && e.queue === 'hyperlink-file-queue');
  const firstRerun = h.scanCalls.find(c => c.tag === 'w2');
  const sc = h.scanStats(res.data.batchId);
  const w1Calls = h.scanCalls.filter(c => c.tag === 'w1').length;
  const w2Calls = h.scanCalls.filter(c => c.tag === 'w2').length;
  const notif = h.notifications().length;
  const counts = await h.counts(s2.fq);
  const keyAtEnd = await h.snapshot(progressKey);
  const pass = !!done && done.cStatus === 'C' && done.nCompleted === N && done.nFailed === 0
    && sc.totalCalls <= N + 5 && sc.distinct === N && notif === 1 && !!keyAtEnd && keyAtEnd.cStatus === 'C'
    && counts.waiting + counts.active + counts.delayed === 0
    && !!keyAfterWipe && keyAfterWipe.cStatus === 'P' && legacyAfterWipe === null && restartDuring.msg === -1;
  const numbers = `bootWipe: deleted=${wipe[0]} kept=${wipe[1]} v2KeyKept=${keyAfterWipe?.cStatus === 'P'} legacyKeyDeleted=${legacyAfterWipe === null} restartDuringBatch=${restartDuring.msg} | scans=${sc.totalCalls} (<= ${N}+5; w1=${w1Calls} incl. ${w1Calls - scansBeforeClose <= 0 ? 0 : w1Calls - scansBeforeClose} after close, w2=${w2Calls}, dupFiles=${sc.moreThanOnce}) `
    + `doneBeforeClose=${snapBefore?.nCompleted} stalledEvents=${stalled.length} rerunAfterClose=${firstRerun ? ((firstRerun.t - tClose) / 1000).toFixed(1) : 'n/a'}s `
    + `final=${done?.nCompleted}/${done?.nTotal}/${done?.nFailed}/${done?.cStatus} notifications=${notif} keyAtEnd=${keyAtEnd?.cStatus} counterDecreases=${h.regressions(progressKey)} wall=${((now() - t0) / 1000).toFixed(1)}s`;
  await h.teardown();
  return verdict('A2', pass, numbers, { sc, counts });
}
