/**
 * A - Do the "restart from file 1" and duplicate concurrent runs depend on the
 * Bull lock/stall settings, on the module's rate limiter, or only on
 * timeout + attempts? 150 files x 50 ms (~9 s of work), job timeout 2 s,
 * backoff 500 ms; production behaviour (resume neutralised) unless stated.
 */
import { Harness, bodyFor, flushDb9, makeFiles, now, out, queueWith, secs, summarise } from './common';

const N = 150, FILE_MS = 50, TIMEOUT = 2000, BACKOFF = 500;

interface Variant { label: string; settings?: any; limiter?: any; attempts?: number; resume?: boolean; timeout?: number }

async function variant(v: Variant) {
  const h = new Harness({ resumeNeutralised: !v.resume, label: v.label });
  await h.flush();
  h.db.getfiles = () => makeFiles(N, 'a');
  h.search = { delayMs: FILE_MS, result: true };
  const q = queueWith(h, 'w', { settings: v.settings, limiter: v.limiter });
  const gen = h.makeGenerator(q);
  const t0 = now();
  const { res, job } = await h.submitScaled(gen, q, bodyFor({ nSectionid: 'A', nBundleid: 'A' }), { timeout: ('timeout' in v) ? v.timeout : TIMEOUT, backoff: BACKOFF, attempts: v.attempts ?? 3 });
  const queueName = res.data.queueName;
  h.registerWorker(q, 'w', h.makeProcessor());
  const idle = await h.waitForIdle([q], 90000);
  const s = await summarise(h, q, queueName, t0);
  const result = { ...v, idle, jobId: job?.id, wallSeconds: secs(now() - t0), ...s };
  await h.teardown(); await flushDb9();
  return result;
}

export async function run() {
  const r: any = {};
  r.defaults = await variant({ label: 'A1 Bull defaults (lock 30 s / stalled 30 s / maxStalled 1), timeout 2 s, attempts 3' });
  out(JSON.stringify(r.defaults, null, 1));
  r.shortLocks = await variant({ label: 'A2 lockDuration 1 s / stalledInterval 1 s / maxStalledCount 0, timeout 2 s, attempts 3', settings: { lockDuration: 1000, lockRenewTime: 500, stalledInterval: 1000, maxStalledCount: 0 } });
  out(JSON.stringify(r.shortLocks, null, 1));
  r.noStallCheck = await variant({ label: 'A3 stalledInterval 0 (stall detection off), lockDuration 300 s, timeout 2 s, attempts 3', settings: { lockDuration: 300000, stalledInterval: 0 } });
  out(JSON.stringify(r.noStallCheck, null, 1));
  r.moduleLimiter = await variant({ label: 'A4 module limiter {max 1000, duration 60 s} as registered in hyperlink.module.ts, timeout 2 s, attempts 3', limiter: { max: 1000, duration: 60000 } });
  out(JSON.stringify(r.moduleLimiter, null, 1));
  r.attemptsOne = await variant({ label: 'A5 attempts 1 (no retry), timeout 2 s', attempts: 1 });
  out(JSON.stringify(r.attemptsOne, null, 1));
  r.noTimeout = await variant({ label: 'A6 no timeout at all (opts.timeout undefined), attempts 3', timeout: undefined });
  out(JSON.stringify(r.noTimeout, null, 1));
  return r;
}
