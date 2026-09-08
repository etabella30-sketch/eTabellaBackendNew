/**
 * Standalone worker process for scenario E (SIGKILL emulation of a pm2 kill).
 * Runs the REAL HyperLinkProcessor on the real Bull queue with the usual stubs;
 * every socket emit / log line / Bull event is published on the Redis channel
 * "orchtest-events" so the parent can observe what the UI would receive.
 *
 * env: WORKER_TAG, N_FILES, FILE_MS, LOCK_MS, STALLED_MS, MAX_STALLED, RESUME (1 = working-tree resume list active)
 */
import Redis from 'ioredis';
import { Harness, REDIS, makeFiles } from '../harness';
import { queueWith } from './common';
import { HyperLinkProcessor } from '../../src/processor/hyperlink.processor';

const tag = process.env.WORKER_TAG || 'child';
const N = Number(process.env.N_FILES || 400), FILE_MS = Number(process.env.FILE_MS || 50);
const settings = { lockDuration: Number(process.env.LOCK_MS || 30000), stalledInterval: Number(process.env.STALLED_MS || 30000), maxStalledCount: Number(process.env.MAX_STALLED || 1) };
(settings as any).lockRenewTime = settings.lockDuration / 2;

const h = new Harness({ resumeNeutralised: process.env.RESUME !== '1', quiet: true });
h.db.getfiles = () => makeFiles(N, 'k');
h.search = { delayMs: FILE_MS, result: true };
const pub = new Redis({ ...REDIS, maxRetriesPerRequest: null });
const publish = (kind: string, data?: any) => { pub.publish('orchtest-events', JSON.stringify({ t: Date.now(), tag, pid: process.pid, kind, data })).catch(() => { }); };

const q = queueWith(h, tag, { settings });
for (const ev of ['active', 'stalled', 'completed', 'failed']) q.on(ev as any, (job: any, err?: any) => publish('bull:' + ev, { jobId: job && job.id, attemptsMade: job && job.attemptsMade, reason: err && err.message }));
const cfg = h.makeConfig();
const log = { info: (msg: string) => publish('log', msg) };
const utility = { emit: (data: any, topic?: string) => publish(topic || 'hyperlink-response', data) };
const proc = new HyperLinkProcessor(cfg, h.rds, (h as any).dbStub(), log as any, (h as any).searchStub(), utility as any);
h.registerWorker(q, tag, proc);
publish('worker-ready', { settings, N, FILE_MS, resume: process.env.RESUME === '1' });
setInterval(() => publish('heartbeat', { fileCalls: h.fileCalls.length, runs: h.runs.map(r => ({ run: r.runId, attemptsMade: r.attemptsMade, files: r.filesSeen, ended: !!r.end })) }), 1000);
