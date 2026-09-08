/**
 * Adversarial scenarios - shared helpers. Reuses the infrastructure part of
 * ../harness.ts (real classes, real Bull queue on 127.0.0.1:6379 DB 9, prefix
 * "orchtest") but every scenario below is written independently of the
 * original s1..s8 files and re-derives its own numbers.
 */
import Queue = require('bull');
import { Job, Queue as BullQueue } from 'bull';
import * as fs from 'fs';
import * as path from 'path';
import { Harness, BULL_PREFIX, QUEUE_NAME, REDIS, SCRATCH, now } from '../harness';

export { Harness, SCRATCH, REPO_ROOT, bodyFor, makeFiles, flushDb9, now, out, rel, sleep, prodOpts } from '../harness';

export const ADV_OUT = path.join(SCRATCH, 'adv');
fs.mkdirSync(ADV_OUT, { recursive: true });

/** Queue with arbitrary Bull options (settings + limiter) wired into the harness event log. */
export function queueWith(h: Harness, tag: string, opts: Queue.QueueOptions = {}): BullQueue {
  const q = new Queue(QUEUE_NAME, { redis: { ...REDIS }, prefix: BULL_PREFIX, ...opts });
  const ev = (event: string) => (job: Job, err?: Error) =>
    h.bullEvents.push({ t: now(), queueTag: tag, event, jobId: job && String(job.id), attemptsMade: job && job.attemptsMade, reason: err && err.message });
  q.on('error', (e) => h.bullEvents.push({ t: now(), queueTag: tag, event: 'error', reason: String(e && e.message) }));
  q.on('failed', ev('failed'));
  q.on('completed', ev('completed'));
  q.on('stalled', ev('stalled'));
  q.on('active', ev('active'));
  h.queues.push({ tag, q });
  return q;
}

export interface JobSummary {
  distinctFiles: number; scanCalls: number; filesScannedMoreThanOnce: number; perFileDistribution: Record<number, number>;
  maxConcurrentRunsOfSameBundle: number; runs: { run: number; attemptsMade: number; startS: string; endS: string | null; files: number; outcome?: string }[];
  bull: { at: string; ev: string; attemptsMade?: number; reason?: string }[];
  sp: Record<string, number>; lastPopup: any; completionPopups: number; notifications: string[]; counterDecreases: number; resetsToZero: number;
  lockKeyAtEnd: any; lockTtl: number; doneKeyAtEnd: any; bullCounts: any; appKeys: string[];
}

export async function summarise(h: Harness, q: BullQueue, queueName: string, t0: number): Promise<JobSummary> {
  const fc = h.fileCallStats();
  const last = h.lastResponce(queueName);
  const reg = h.regressions(queueName);
  const r = (t: number) => ((t - t0) / 1000).toFixed(2);
  let counts: any = null; try { counts = await q.getJobCounts(); } catch { counts = 'queue closed'; }
  return {
    distinctFiles: fc.distinct, scanCalls: fc.totalCalls, filesScannedMoreThanOnce: fc.processedMoreThanOnce, perFileDistribution: fc.distribution,
    maxConcurrentRunsOfSameBundle: h.maxConcurrent.get(queueName) || 0,
    runs: h.runs.map(x => ({ run: x.runId, attemptsMade: x.attemptsMade, startS: r(x.start), endS: x.end ? r(x.end) : null, files: x.filesSeen, outcome: x.outcome })),
    bull: h.bullEvents.filter(e => e.event !== 'error' && e.event !== 'active').map(e => ({ at: r(e.t), ev: e.event, attemptsMade: e.attemptsMade, reason: e.reason })),
    sp: h.spStats(),
    lastPopup: last ? { nTotal: last.nTotal, nCompleted: last.nCompleted, nFailed: last.nFailed, cStatus: last.cStatus } : null,
    completionPopups: h.responces(queueName).filter(e => e.data.data.cStatus === 'C').length,
    notifications: h.notifications().map(e => e.data.cMsg),
    counterDecreases: reg.decreases, resetsToZero: reg.resetsToZero,
    lockKeyAtEnd: await h.redis.get(queueName), lockTtl: await h.redis.ttl(queueName), doneKeyAtEnd: await h.redis.get(queueName + '/done'),
    bullCounts: counts, appKeys: await h.appKeys(),
  };
}

export const secs = (ms: number) => +(ms / 1000).toFixed(2);
