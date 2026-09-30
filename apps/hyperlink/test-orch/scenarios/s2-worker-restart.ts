/**
 * S2 - Worker restart mid-batch (pm2 restart). 400 files x 50 ms. After 3 s the
 * first queue is closed without waiting (queue.close(true)); a fresh queue +
 * processor is opened; Bull's stalled-job handling (lockDuration 30 s,
 * stalledInterval 30 s, maxStalledCount 1 - production defaults) re-runs the job.
 *
 *  (a) old process kept alive: the first loop keeps running (JS promise is not
 *      cancellable) and keeps writing progress with its own Redis client.
 *  (b) old process dead (pm2 kills it): every further createHyperlinkFile call of
 *      the old worker never resolves and has no side effects.
 */
import { Harness, bodyFor, flushDb9, makeFiles, now, out, rel } from '../harness';

const N = 400, FILE_MS = 50, CLOSE_AFTER_MS = 3000;

async function variant(label: string, dead: boolean, resumeNeutralised: boolean) {
  const h = new Harness({ resumeNeutralised, label });
  await h.flush();
  const files = makeFiles(N, 'b');
  h.db.getfiles = () => files;
  h.search = { delayMs: FILE_MS, result: true };
  const q1 = h.newQueue('w1');
  const gen = h.makeGenerator(q1);
  const body = bodyFor({ nSectionid: 'S2', nBundleid: 'B' });
  const res = await gen.starthyperlink(body, false);           // production opts: 12 h timeout, 3 attempts, 5 min backoff
  const queueName = res.data.queueName;
  const t0 = now();
  h.registerWorker(q1, 'w1', h.makeProcessor());
  await new Promise(r => setTimeout(r, CLOSE_AFTER_MS));
  const filesBeforeClose = h.fileCalls.length;
  const progressBeforeClose = JSON.parse(await h.redis.get(queueName) || 'null');
  const lockKey = `orchtest:hyperlink-queue:${res && (await q1.getActive())[0]?.id}:lock`;
  const lockTtlBeforeClose = await h.redis.pttl(lockKey);
  const tClose = now();
  if (dead) h.killQueueRuns('w1');
  await q1.close(true);                                         // doNotWaitJobs = true: like SIGINT/SIGKILL, the handler promise is abandoned
  const tClosed = now();
  const q2 = h.newQueue('w2');
  h.registerWorker(q2, 'w2', h.makeProcessor());
  const idle = await h.waitForIdle([q2], 200000);
  const wall = (now() - t0) / 1000;
  const fc = h.fileCallStats();
  const w2Run = h.runs.find(r => r.queueTag === 'w2');
  const stalledEv = h.bullEvents.find(e => e.event === 'stalled');
  const last = h.lastResponce(queueName);
  const w1Run = h.runs.find(r => r.queueTag === 'w1');
  const w1Calls = h.fileCalls.filter(c => c.queueTag === 'w1').length;
  const w2Calls = h.fileCalls.filter(c => c.queueTag === 'w2').length;
  // when the old (alive) loop finishes AFTER the new one, its final write wins the popup/Redis key
  const lastWriter = h.responces(queueName).slice(-1)[0];
  const result = {
    scenario: 'S2', variant: label, idle, wallSeconds: +wall.toFixed(1),
    filesDoneBeforeClose: filesBeforeClose, progressKeyBeforeClose: progressBeforeClose && { nCompleted: progressBeforeClose.nCompleted, nFailed: progressBeforeClose.nFailed, cStatus: progressBeforeClose.cStatus },
    jobLockTtlMsBeforeClose: lockTtlBeforeClose, closeTookMs: tClosed - tClose,
    secondsFromCloseToStalledEvent: stalledEv ? +((stalledEv.t - tClose) / 1000).toFixed(1) : null,
    secondsFromCloseToRerunStart: w2Run ? +((w2Run.start - tClose) / 1000).toFixed(1) : null,
    rerunAttemptsMade: w2Run?.attemptsMade, rerunFilesProcessed: w2Run?.filesSeen, rerunOutcome: w2Run?.outcome,
    oldWorkerCalls: w1Calls, oldWorkerOutcome: w1Run?.outcome || (dead ? 'never resolved (process dead)' : 'still running'), oldWorkerEndedAt: w1Run?.end ? rel(w1Run.end) : null,
    newWorkerCalls: w2Calls,
    distinctFiles: fc.distinct, totalCreateHyperlinkFileCalls: fc.totalCalls, filesProcessedMoreThanOnce: fc.processedMoreThanOnce, callsPerFileDistribution: fc.distribution,
    maxConcurrentRunsOfSameBundle: h.maxConcurrent.get(queueName) || 0,
    spCalls: h.spStats(),
    lastEmitted: last ? { nTotal: last.nTotal, nCompleted: last.nCompleted, nFailed: last.nFailed, cStatus: last.cStatus } : null,
    lastEmittedBy: lastWriter ? (h.runs.find(r => r.runId === (h.fileCalls.slice().reverse().find(c => c.t <= lastWriter.t)?.runId))?.queueTag) : null,
    completionResponces: h.responces(queueName).filter(e => e.data.data.cStatus === 'C').length,
    progressCounterRegressions: h.regressions(queueName), notificationsEmitted: h.notifications().length,
    lockKeyAtEnd: await h.redis.get(queueName), doneKeyAtEnd: await h.redis.get(queueName + '/done'),
    bullEvents: h.bullEvents.filter(e => e.event !== 'error').map(e => ({ at: rel(e.t), q: e.queueTag, ev: e.event, attemptsMade: e.attemptsMade, reason: e.reason })),
    bullErrors: h.bullEvents.filter(e => e.event === 'error').map(e => e.reason).slice(0, 5),
    bullCounts: await h.counts(q2), redisAppKeysAtEnd: await h.appKeys(), unhandledRejections: h.unhandled.length,
  };
  await h.teardown();
  await flushDb9();
  return result;
}

export async function run() {
  const r: any = {};
  r.aliveProd = await variant('(a) old process alive, production (resume neutralised)', false, true);
  out(JSON.stringify(r.aliveProd, null, 1));
  r.deadProd = await variant('(b) old process dead, production (resume neutralised)', true, true);
  out(JSON.stringify(r.deadProd, null, 1));
  r.deadPatched = await variant('(b) old process dead, working-tree resume patch', true, false);
  out(JSON.stringify(r.deadPatched, null, 1));
  return r;
}
