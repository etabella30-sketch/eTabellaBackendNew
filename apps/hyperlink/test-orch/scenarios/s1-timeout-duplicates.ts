/**
 * S1 - Bull job `timeout` -> duplicate concurrent runs of the same bundle.
 * 600 files x 50 ms (30 s of work), job timeout 5 s, attempts 3, backoff 1 s.
 * Runs twice: resume neutralised (production) and with the working-tree resume patch.
 */
import { Harness, bodyFor, flushDb9, makeFiles, now, out, rel } from '../harness';

const N = 600, FILE_MS = 50, TIMEOUT = 5000, BACKOFF = 1000;

async function variant(label: string, resumeNeutralised: boolean) {
  const h = new Harness({ resumeNeutralised, label });
  await h.flush();
  const files = makeFiles(N, 'a');
  h.db.getfiles = () => files;
  h.search = { delayMs: FILE_MS, result: true };
  const q = h.newQueue('w1');
  const gen = h.makeGenerator(q);
  const body = bodyFor({ nSectionid: 'S1', nBundleid: 'A' });
  const t0 = now();
  const { res, job } = await h.submitScaled(gen, q, body, { timeout: TIMEOUT, backoff: BACKOFF, attempts: 3 });
  const queueName = res.data.queueName;
  const lockDuringRun: { t: number; present: boolean }[] = [];
  h.registerWorker(q, 'w1', h.makeProcessor());
  // sample the lock key every 500 ms while everything runs
  const sampler = setInterval(async () => { try { lockDuringRun.push({ t: now(), present: !!(await h.redis.exists(queueName)) }); } catch { } }, 500);
  const idle = await h.waitForIdle([q], 120000);
  clearInterval(sampler);
  const wall = (now() - t0) / 1000;
  const fc = h.fileCallStats();
  const last = h.lastResponce(queueName);
  const keyVal = await h.redis.get(queueName);
  const doneVal = await h.redis.get(queueName + '/done');
  const timeoutFails = h.bullEvents.filter(e => e.event === 'failed');
  const runsSummary = h.runs.map(r => ({ run: r.runId, attemptsMade: r.attemptsMade, start: rel(r.start), end: r.end ? rel(r.end) : null, secs: r.end ? ((r.end - r.start) / 1000).toFixed(1) : null, files: r.filesSeen, outcome: r.outcome }));
  const bullFailAt = timeoutFails.map(e => rel(e.t));
  // how long each run kept working AFTER Bull declared its attempt failed
  const zombieSeconds = h.runs.map((r, i) => timeoutFails[i] ? ((r.end || now()) - timeoutFails[i].t) / 1000 : 0);
  const lockGaps = lockDuringRun.filter(s => !s.present).length;
  const result = {
    scenario: 'S1', variant: label, idle, wallSeconds: +wall.toFixed(1), jobId: job.id,
    distinctFiles: fc.distinct, totalCreateHyperlinkFileCalls: fc.totalCalls, filesProcessedMoreThanOnce: fc.processedMoreThanOnce, callsPerFileDistribution: fc.distribution,
    maxConcurrentRunsOfSameBundle: h.maxConcurrent.get(queueName) || 0,
    runs: runsSummary, bullFailedEvents: timeoutFails.map(e => ({ at: rel(e.t), attemptsMade: e.attemptsMade, reason: e.reason })),
    secondsEachRunContinuedAfterBullFailedIt: zombieSeconds.map(z => +z.toFixed(1)),
    spCalls: h.spStats(),
    lastEmitted: last ? { nTotal: last.nTotal, nCompleted: last.nCompleted, nFailed: last.nFailed, cStatus: last.cStatus } : null,
    responcesEmitted: h.responces(queueName).length, completionResponces: h.responces(queueName).filter(e => e.data.data.cStatus === 'C').length,
    progressCounterRegressions: h.regressions(queueName), notificationsEmitted: h.notifications().length,
    notificationTexts: [...new Set(h.notifications().map(e => e.data.cMsg))],
    lockKeyAtEnd: keyVal, doneKeyAtEnd: doneVal, lockSamples: lockDuringRun.length, lockSamplesAbsent: lockGaps,
    bullCounts: await h.counts(q), redisAppKeysAtEnd: await h.appKeys(), bullErrors: h.bullEvents.filter(e => e.event === 'error').map(e => e.reason), unhandledRejections: h.unhandled.length,
  };
  await h.teardown();
  await flushDb9();
  return result;
}

export async function run() {
  const prod = await variant('production (resume neutralised, 1 h timeout scaled to 5 s)', true);
  out(JSON.stringify(prod, null, 1));
  const patched = await variant('working-tree patch (resume list active, timeout scaled to 5 s)', false);
  out(JSON.stringify(patched, null, 1));
  return { prod, patched };
}
