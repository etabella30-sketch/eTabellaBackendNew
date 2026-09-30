/**
 * S6 - Throughput. 3,000 files x 20 ms as ONE bundle job vs the same 3,000 files
 * as 5 bundle jobs (5 sections, because the lock key is per section - S3).
 * Production job opts (12 h timeout) via the real starthyperlink.
 * Note: on Windows setTimeout(20) fires every ~31 ms (timer granularity), the
 * effective per-file time is reported.
 */
import { Harness, bodyFor, flushDb9, makeFiles, now, out } from '../harness';

const N = 3000, FILE_MS = 20;

async function one() {
  const h = new Harness({ label: 'S6-one' });
  await h.flush();
  h.db.getfiles = () => makeFiles(N, 'g');
  h.search = { delayMs: FILE_MS, result: true };
  const q = h.newQueue('w1');
  const gen = h.makeGenerator(q);
  await gen.starthyperlink(bodyFor({ nSectionid: 'S6' }), false);
  const t0 = now();
  h.registerWorker(q, 'w1', h.makeProcessor());
  const idle = await h.waitForIdle([q], 280000);
  const wall = (now() - t0) / 1000;
  const r = { idle, files: N, jobs: 1, wallSeconds: +wall.toFixed(1), effectiveMsPerFile: +((wall * 1000) / N).toFixed(1), maxConcurrentJobs: Math.max(...h.maxConcurrent.values()), spCalls: h.spStats(), responces: h.responces().length, bull: h.bullEvents.filter(e => e.event === 'completed').length + ' completed' };
  await h.teardown(); await flushDb9();
  return r;
}

async function five() {
  const h = new Harness({ label: 'S6-five' });
  await h.flush();
  h.db.getfiles = (qry) => makeFiles(N / 5, 'g' + qry.nSectionid);
  h.search = { delayMs: FILE_MS, result: true };
  const q = h.newQueue('w1');
  const gen = h.makeGenerator(q);
  for (let i = 1; i <= 5; i++) await gen.starthyperlink(bodyFor({ nSectionid: 'T' + i }), false);
  const t0 = now();
  h.registerWorker(q, 'w1', h.makeProcessor());
  const idle = await h.waitForIdle([q], 280000);
  const wall = (now() - t0) / 1000;
  const concurrent = (() => { let m = 0; for (const a of h.runs) m = Math.max(m, h.runs.filter(b => b.start <= a.start && (b.end ?? Infinity) > a.start).length); return m; })();
  const r = { idle, files: N, jobs: 5, wallSeconds: +wall.toFixed(1), effectiveMsPerFile: +((wall * 1000) / N).toFixed(1), jobsRunningConcurrently: concurrent, perJobSeconds: h.runs.map(x => +((x.end - x.start) / 1000).toFixed(1)), spCalls: h.spStats(), bull: h.bullEvents.filter(e => e.event === 'completed').length + ' completed' };
  await h.teardown(); await flushDb9();
  return r;
}

export async function run() {
  const r: any = {};
  r.oneJob = await one(); out(JSON.stringify(r.oneJob));
  r.fiveJobs = await five(); out(JSON.stringify(r.fiveJobs));
  r.speedup = +(r.oneJob.wallSeconds / r.fiveJobs.wallSeconds).toFixed(2);
  r.projected = { note: 'measured effective ms/file scaled to a real 60 s/file scan', oneJob_2446files_hours: +((2446 * 60) / 3600).toFixed(1), oneJob_3000files_hours: +((3000 * 60) / 3600).toFixed(1), fiveParallel_3000files_hours: +((3000 * 60) / 5 / 3600).toFixed(1) };
  out(JSON.stringify(r, null, 1));
  return r;
}
