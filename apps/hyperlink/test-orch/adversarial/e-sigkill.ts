/**
 * E - The worker PROCESS is killed (SIGKILL / pm2 kill) mid-bundle.
 * A child node process runs the real processor + real Bull worker; the parent
 * submits the job through the real starthyperlink, observes the Redis progress
 * key, the socket emits (relayed over Redis pub/sub) and the Bull job, kills the
 * child with SIGKILL, and then starts a replacement worker.
 *  E1 Bull defaults (lock 30 s / stalled 30 s / maxStalledCount 1), production (no resume list)
 *  E2 lock 3 s / stalled 3 s (scaled), working-tree resume list; the replacement is killed too
 *     -> second stall -> "job stalled more than allowable limit"
 */
import { spawn, ChildProcess } from 'child_process';
import Redis from 'ioredis';
import * as path from 'path';
import { Harness, REPO_ROOT, bodyFor, flushDb9, now, out, queueWith, secs, sleep } from './common';
import { REDIS } from '../harness';

interface Ev { t: number; tag: string; pid: number; kind: string; data?: any }

function spawnWorker(tag: string, env: Record<string, string>): ChildProcess {
  const child = spawn(process.execPath, ['-r', require.resolve('ts-node/register'), '-r', require.resolve('tsconfig-paths/register'), path.join(__dirname, 'worker-child.ts')], {
    cwd: REPO_ROOT, env: { ...process.env, TS_NODE_TRANSPILE_ONLY: '1', WORKER_TAG: tag, ...env }, stdio: ['ignore', 'ignore', 'pipe'], windowsHide: true,
  });
  child.stderr!.on('data', (d) => { const s = d.toString(); if (/error/i.test(s)) out(`[${tag} stderr] ${s.slice(0, 300)}`); });
  return child;
}

async function scenario(label: string, env: Record<string, string>, killReplacementToo: boolean) {
  const h = new Harness({ label, quiet: true });
  await h.flush();
  const sub = new Redis({ ...REDIS, maxRetriesPerRequest: null });
  const events: Ev[] = [];
  await sub.subscribe('orchtest-events');
  sub.on('message', (_c, m) => { try { events.push(JSON.parse(m)); } catch { } });
  const waitFor = async (pred: (e: Ev) => boolean, maxMs: number) => { const s = now(); while (now() - s < maxMs) { const e = events.find(pred); if (e) return e; await sleep(100); } return null; };
  const q = queueWith(h, 'parent');                    // observer only: no process() registered, so no stall checker in the parent
  const gen = h.makeGenerator(q);
  const t0 = now();
  const res = await gen.starthyperlink(bodyFor({ nSectionid: 'E', nBundleid: 'K' }), false);   // production opts: 12 h timeout / 3 attempts / 5 min backoff
  const queueName = res.data.queueName;
  const jobId = (await q.getWaiting())[0].id;
  const lockKey = `orchtest:hyperlink-queue:${jobId}:lock`;
  const R = (t: number) => secs(t - t0);
  const popupOf = (e: Ev | undefined | null) => e ? { nTotal: e.data.data.nTotal, nCompleted: e.data.data.nCompleted, nFailed: e.data.data.nFailed, cStatus: e.data.data.cStatus } : null;
  const readKey = async () => { const v = await h.redis.get(queueName); return v ? (({ nTotal, nCompleted, nFailed, cStatus }) => ({ nTotal, nCompleted, nFailed, cStatus }))(JSON.parse(v)) : null; };

  // ---- worker 1
  const w1 = spawnWorker('w1', env);
  await waitFor(e => e.kind === 'worker-ready' && e.tag === 'w1', 60000);
  const first = await waitFor(e => e.kind === 'hyperlink-response' && e.tag === 'w1', 30000);
  await sleep(3000);
  const keyBeforeKill = await readKey();
  const lockTtlBeforeKill = await h.redis.pttl(lockKey);
  const emitsBeforeKill = events.filter(e => e.kind === 'hyperlink-response' && e.tag === 'w1').length;
  const tKill = now();
  w1.kill('SIGKILL');
  await new Promise(r => w1.once('exit', r));
  const tDead = now();
  // ---- observe the dead period: does anything move?
  const samples: any[] = [];
  for (let i = 0; i < 8; i++) { await sleep(1000); samples.push({ at: R(now()), key: await readKey(), jobLockPttl: await h.redis.pttl(lockKey), emitsSinceKill: events.filter(e => e.kind === 'hyperlink-response' && e.t > tKill).length }); }
  const countsDead = await q.getJobCounts();
  const uiGet = await gen.getHyperLinkProgress({ nMasterid: 'm1', nCaseid: 'c1' } as any);
  const restartWhileDead = await gen.starthyperlink(bodyFor({ nSectionid: 'E', nBundleid: 'K' }), false);
  // ---- replacement worker (pm2 restart)
  const w2 = spawnWorker('w2', env);
  await waitFor(e => e.kind === 'worker-ready' && e.tag === 'w2', 60000);
  const tW2Ready = now();
  const rerunFirst = await waitFor(e => e.kind === 'hyperlink-response' && e.tag === 'w2', 240000);
  const stalledEv = events.find(e => e.kind === 'bull:stalled');
  const firstThreeRerunPopups = events.filter(e => e.kind === 'hyperlink-response' && e.tag === 'w2').slice(0, 3).map(popupOf);
  let w3Result: any = null;
  if (killReplacementToo && rerunFirst) {
    await sleep(3000);
    const keyBeforeKill2 = await readKey();
    const tKill2 = now();
    w2.kill('SIGKILL');
    await new Promise(r => w2.once('exit', r));
    const w3 = spawnWorker('w3', env);
    await waitFor(e => e.kind === 'worker-ready' && e.tag === 'w3', 60000);
    const failedEv = await waitFor(e => e.kind === 'bull:failed' && e.tag === 'w3', 60000);
    const anyRerun = await waitFor(e => e.kind === 'hyperlink-response' && e.tag === 'w3', failedEv ? 5000 : 60000);
    await sleep(8000);
    const failedJobs = await q.getFailed();
    w3Result = {
      keyBeforeSecondKill: keyBeforeKill2, secondKillAt: R(tKill2), w3FailedEvent: failedEv ? { at: R(failedEv.t), ...failedEv.data } : null, w3EverEmittedProgress: !!anyRerun,
      bullCounts: await q.getJobCounts(), failedJobs: failedJobs.map(j => ({ id: j.id, attemptsMade: j.attemptsMade, failedReason: j.failedReason, stalledCounter: (j as any).stalledCounter })),
      keyAfter: await readKey(), lockTtl: await h.redis.ttl(queueName), doneKey: !!(await h.redis.get(queueName + '/done')), doneKeyTtl: await h.redis.ttl(queueName + '/done'),
      uiGetAfter: gen.getHyperLinkProgress({ nMasterid: 'm1', nCaseid: 'c1' } as any).then(x => x.msg), restartAfter: (await gen.starthyperlink(bodyFor({ nSectionid: 'E', nBundleid: 'K' }), false)).value,
      emitsAfterSecondKill: events.filter(e => e.kind === 'hyperlink-response' && e.t > tKill2).length, notifications: events.filter(e => e.kind === 'notification').length,
    };
    w3Result.uiGetAfter = await w3Result.uiGetAfter;
    w3.kill('SIGKILL');
  } else {
    const done = await waitFor(e => e.kind === 'hyperlink-response' && e.tag === 'w2' && e.data.data.cStatus === 'C', 120000);
    await sleep(500);
    w3Result = { rerunFinishedAt: done ? R(done.t) : null, keyAfter: await readKey(), lockTtl: await h.redis.ttl(queueName), bullCounts: await q.getJobCounts(), notifications: events.filter(e => e.kind === 'notification').length };
    w2.kill('SIGKILL');
  }
  const scansBy = (tag: string) => { const hb = events.filter(e => e.kind === 'heartbeat' && e.tag === tag).slice(-1)[0]; return hb ? hb.data.fileCalls : null; };
  const result = {
    label, env, jobId, firstEmitAt: first ? R(first.t) : null, killedAt: R(tKill), exitConfirmedMs: tDead - tKill, emitsBeforeKill, keyBeforeKill, lockTtlBeforeKill,
    deadPeriodSamples: samples, bullCountsWhileDead: countsDead, uiGetWhileDead: uiGet.msg === 1 ? 'in progress (popup stays)' : uiGet.value, restartWhileDead: restartWhileDead.value,
    replacementReadyAt: R(tW2Ready), stalledEventAt: stalledEv ? R(stalledEv.t) : null, rerunFirstEmitAt: rerunFirst ? R(rerunFirst.t) : null,
    secondsFromKillToRerun: rerunFirst ? secs(rerunFirst.t - tKill) : null, rerunAttemptsMade: events.find(e => e.kind === 'bull:active' && e.tag === 'w2')?.data.attemptsMade,
    firstThreeRerunPopups, scansByW1: scansBy('w1'), scansByW2: scansBy('w2'), ...w3Result,
  };
  await sub.quit();
  await h.teardown(); await flushDb9();
  return result;
}

export async function run() {
  const r: any = {};
  r.e1_defaults_prod = await scenario('E1 SIGKILL worker, Bull defaults, production (no resume)', { N_FILES: '400', FILE_MS: '50', LOCK_MS: '30000', STALLED_MS: '30000', MAX_STALLED: '1', RESUME: '0' }, false);
  out(JSON.stringify(r.e1_defaults_prod, null, 1));
  r.e2_twoKills_patched = await scenario('E2 SIGKILL worker twice, lock/stalled 3 s (scaled), working-tree resume', { N_FILES: '400', FILE_MS: '50', LOCK_MS: '3000', STALLED_MS: '3000', MAX_STALLED: '1', RESUME: '1' }, true);
  out(JSON.stringify(r.e2_twoKills_patched, null, 1));
  return r;
}
