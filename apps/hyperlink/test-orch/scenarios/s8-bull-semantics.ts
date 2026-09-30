/**
 * S8 - Bull 4.12.2 semantics actually used, cited from node_modules/bull with
 * line numbers, plus the empirical numbers from S1/S2 that confirm them.
 */
import * as fs from 'fs';
import * as path from 'path';
import { REPO_ROOT, out } from '../harness';

const B = path.join(REPO_ROOT, 'node_modules', 'bull');
const lines = (rel: string, from: number, to: number) => {
  const src = fs.readFileSync(path.join(B, rel), 'utf8').split('\n');
  return src.slice(from - 1, to).map((l, i) => `${rel}:${from + i}: ${l.replace(/\s+$/, '')}`);
};

export async function run(results: Record<string, any>) {
  const version = JSON.parse(fs.readFileSync(path.join(B, 'package.json'), 'utf8')).version;
  const r: any = { bullVersion: version, citations: {} };
  r.citations.defaults = lines('lib/queue.js', 213, 217);
  r.citations.timeoutWrapsPromise = lines('lib/queue.js', 1141, 1141).concat(lines('lib/queue.js', 1172, 1183));
  r.citations.pTimeoutDoesNotCancel = lines('lib/p-timeout.js', 42, 63);
  r.citations.retryAfterFailure = lines('lib/job.js', 293, 326);
  r.citations.saveAttemptIncrements = lines('lib/job.js', 583, 588);
  r.citations.lockExtender = lines('lib/queue.js', 1120, 1136);
  r.citations.stalledCheckInterval = lines('lib/queue.js', 1050, 1058);
  r.citations.stalledLua = lines('lib/commands/moveStalledJobsToWait-7.lua', 66, 88);
  r.citations.closeDoesNotWait = lines('lib/queue.js', 586, 600);
  r.citations.fixedBackoff = lines('lib/backoffs.js', 5, 10);
  r.statements = [
    'timeout: queue.js:1141/1175 wraps the handler promise in pTimeout; p-timeout.js:58-62 only calls promise.cancel() if it exists (it does not for an async function) and rejects with TimeoutError. The handler keeps running to the end. Measured S1: each run continued ' + JSON.stringify(results.S1?.prod?.secondsEachRunContinuedAfterBullFailedIt) + ' s after Bull failed it.',
    'attempts after timeout: the TimeoutError goes through handleFailed -> job.moveToFailed (job.js:282). job.js:295: attemptsMade < opts.attempts -> moveToDelayed with backoff (fixed 5 min in production, backoffs.js:6-10) -> the job is re-run from scratch while the previous run is still alive. Measured S1: 3 runs, max ' + results.S1?.prod?.maxConcurrentRunsOfSameBundle + ' concurrent, Bull failed events at ' + JSON.stringify(results.S1?.prod?.bullFailedEvents?.map((e: any) => e.at)) + ' s.',
    'stalled: lockDuration 30 s, lockRenewTime 15 s, stalledInterval 30 s, maxStalledCount 1 (queue.js:214-216). The lock extender (queue.js:1120-1136) stops on close/_clearTimers (queue.js:595/609-616). A job whose worker died keeps its lock for <=30 s; the surviving worker checks every 30 s (queue.js:1052-1057): the first check only marks the job (lua:92-97), the next check finds no lock and moves it back to wait (lua:68-85) -> re-run from file 1 with attemptsMade unchanged (stalledCounter, not attemptsMade, is incremented, lua:74). A second stall fails it for good ("job stalled more than allowable limit", lua:75-79). Measured S2: ' + JSON.stringify({ closeToStalled: results.S2?.deadProd?.secondsFromCloseToStalledEvent, closeToRerun: results.S2?.deadProd?.secondsFromCloseToRerunStart, rerunAttemptsMade: results.S2?.deadProd?.rerunAttemptsMade }),
    'a stalled re-run does NOT consume an attempt and is NOT subject to backoff: it starts immediately; the whole-job timeout restarts from zero for the new run.',
    'removeOnFail/removeOnComplete: true -> after the 3rd timeout the job disappears (S1 bullCounts all 0) while the handler loops are still running; nothing in Bull can reach them any more (no cancel API in Bull 4 for a running promise; job.discard() only prevents further retries).',
  ];
  out(JSON.stringify(r, null, 1));
  return r;
}
