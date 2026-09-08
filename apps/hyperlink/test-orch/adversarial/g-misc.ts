/**
 * G - Nuances on findings 2 and 4:
 *  G1 the lock-key "flicker": after the first zombie run finishes (deletes the key) while
 *     retry runs are still alive, is a NEW starthyperlink for the same section accepted?
 *  G2 stalled re-run while the old loop is still alive AND the resume list exists
 *     (working tree): does the re-run resume or restart from file 1? (finding 4 inferred "from file 1")
 *  G3 zero-file bundle: starthyperlink writes the lock AFTER queue.add; the handler deletes it
 *     at the end - measure the gap between the two with local Redis.
 */
import { Harness, bodyFor, flushDb9, makeFiles, now, out, queueWith, secs, sleep, summarise } from './common';

async function g1() {
  const h = new Harness({ resumeNeutralised: true, label: 'G1' });
  await h.flush();
  h.db.getfiles = () => makeFiles(80, 'g');
  h.search = { delayMs: 50, result: true };
  const q = queueWith(h, 'w');
  const gen = h.makeGenerator(q);
  const t0 = now();
  const { res } = await h.submitScaled(gen, q, bodyFor({ nSectionid: 'G1', nBundleid: 'A' }), { timeout: 1500, backoff: 300 });
  h.registerWorker(q, 'w', h.makeProcessor());
  // wait until the first run has finished while others are alive, then try to start again
  while (!(h.runs[0] && h.runs[0].end) && now() - t0 < 30000) await sleep(20);
  await sleep(30);
  const aliveWhenTried = h.runs.filter(r => !r.end).length;
  const keyWhenTried = await h.redis.get(res.data.queueName);
  const second = await gen.starthyperlink(bodyFor({ nSectionid: 'G1', nBundleid: 'A' }), false);
  const secondJobId = second.msg === 1 ? (await q.getWaiting()).map(j => j.id) : null;
  const idle = await h.waitForIdle([q], 60000);
  const s = await summarise(h, q, res.data.queueName, t0);
  const result = { firstRunEndedAt: secs(h.runs[0].end! - t0), retryRunsAliveWhenTried: aliveWhenTried, keyPresentWhenTried: !!keyWhenTried, secondStartAccepted: second.msg === 1, secondJobIds: secondJobId, idle, runsTotal: h.runs.length, scanCalls: s.scanCalls, perFileDistribution: s.perFileDistribution, completionPopups: s.completionPopups, notifications: s.notifications.length, lockKeyAtEnd: s.lockKeyAtEnd };
  await h.teardown(); await flushDb9();
  return result;
}

async function g2() {
  const h = new Harness({ resumeNeutralised: false, label: 'G2' });   // working-tree resume list active
  await h.flush();
  h.db.getfiles = () => makeFiles(300, 'r');
  h.search = { delayMs: 50, result: true };
  const settings = { lockDuration: 3000, lockRenewTime: 1500, stalledInterval: 3000, maxStalledCount: 1 };
  const q1 = queueWith(h, 'old', { settings });
  const gen = h.makeGenerator(q1);
  const t0 = now();
  const res = await gen.starthyperlink(bodyFor({ nSectionid: 'G2', nBundleid: 'R' }), false);
  h.registerWorker(q1, 'old', h.makeProcessor());
  await sleep(3000);
  const doneBeforeClose = JSON.parse((await h.redis.get(res.data.queueName + '/done')) || '[]').length;
  await q1.close(true);                                   // worker "restarts" but the old loop stays alive in-process
  const tClose = now();
  const q2 = queueWith(h, 'new', { settings });
  h.registerWorker(q2, 'new', h.makeProcessor());
  const idle = await h.waitForIdle([q2], 90000);
  const s = await summarise(h, q2, res.data.queueName, t0);
  const newRun = h.runs.find(r => r.queueTag === 'new');
  const oldRun = h.runs.find(r => r.queueTag === 'old');
  const firstNewPopup = h.responces(res.data.queueName).filter(e => e.t >= (newRun?.start || 0)).slice(0, 2).map(e => e.data.data.nCompleted);
  const result = { idle, doneListLengthAtClose: doneBeforeClose, secondsCloseToRerun: newRun ? secs(newRun.start - tClose) : null, oldLoopStillAliveAtRerunStart: !!(oldRun && newRun && (!oldRun.end || oldRun.end > newRun.start)), oldRunEndedAt: oldRun?.end ? secs(oldRun.end - t0) : null, newRunStartedAt: newRun ? secs(newRun.start - t0) : null, rerunFirstPopupCounters: firstNewPopup, rerunFilesScanned: newRun?.filesSeen, oldFilesScanned: oldRun?.filesSeen, scanCalls: s.scanCalls, distinct: s.distinctFiles, filesScannedTwice: s.filesScannedMoreThanOnce, lastPopup: s.lastPopup, completionPopups: s.completionPopups, notifications: s.notifications.length, lockKeyAtEnd: s.lockKeyAtEnd, doneKeyAtEnd: s.doneKeyAtEnd, bull: s.bull };
  await h.teardown(); await flushDb9();
  return result;
}

async function g3() {
  const h = new Harness({ label: 'G3' });
  await h.flush();
  h.db.getfiles = () => [];
  const q = queueWith(h, 'w');
  const gen = h.makeGenerator(q);
  h.registerWorker(q, 'w', h.makeProcessor());
  const trials: any[] = [];
  for (let i = 0; i < 5; i++) {
    const before = h.spCalls.length;
    const tStart = now();
    const res = await gen.starthyperlink(bodyFor({ nSectionid: 'G3-' + i }), false);
    const tStarted = now();                                // lock written (setValue at generatehyperlink.service.ts:104) just before this
    await h.waitForIdle([q], 10000);
    const run = h.runs[h.runs.length - 1];
    await sleep(200);
    trials.push({ startMs: tStarted - tStart, handlerStartAfterStartMs: run.start - tStarted, handlerEndAfterStartMs: run.end! - tStarted, keyLeft: !!(await h.redis.get(res.data.queueName)), lastPopup: (({ nTotal, cStatus }) => ({ nTotal, cStatus }))(h.lastResponce(res.data.queueName)) });
    void before;
  }
  const result = { trials, note: 'keyLeft true would mean the handler deleted the key BEFORE starthyperlink wrote it (permanent lock); the window is queue.add->setValue (one round trip) vs moveToActive->getfiles->emit->del' };
  await h.teardown(); await flushDb9();
  return result;
}

export async function run() {
  const r: any = {};
  r.g1_lockFlickerAcceptsDuplicate = await g1(); out(JSON.stringify(r.g1_lockFlickerAcceptsDuplicate, null, 1));
  r.g2_stalledRerunWhileOldAlive_resume = await g2(); out(JSON.stringify(r.g2_stalledRerunWhileOldAlive_resume, null, 1));
  r.g3_zeroFileRace = await g3(); out(JSON.stringify(r.g3_zeroFileRace, null, 1));
  return r;
}
