/**
 * A6 - Throughput. 3,000 files x 20 ms as ONE bundle with HYPERLINK_WORKERS
 * 1 vs 3 vs 5 -> wall times; 3 workers must be >= 2.5x faster than 1.
 * (Each run is a fresh stack; Windows timer granularity inflates 20 ms, the
 * effective per-file time is reported.)
 */
import { HarnessV2, bodyFor, makeFiles, now, verdict } from '../harness';

const N = Number(process.env.ORCH_A6_FILES || 3000), FILE_MS = 20;

async function one(workers: number) {
  const h = new HarnessV2({ label: `A6-w${workers}` });
  await h.flush();
  h.db.getfiles = () => makeFiles(N, `a6w${workers}`);
  h.scan = { delayMs: FILE_MS, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: String(workers) });
  const t0 = now();
  const res = await s.gen.starthyperlink(bodyFor({ nSectionid: `S-A6-${workers}`, nBundleid: 'B' }), false);
  const done = await h.waitForDone(res.data.queueName, 400000);
  const wall = (now() - t0) / 1000;
  const scans = h.scanCalls.filter(c => c.tEnd);
  const perFile = scans.length ? scans.reduce((a, c) => a + (c.tEnd - c.t), 0) / scans.length : 0;
  let maxParallel = 0, cur = 0;
  const evs = h.scanCalls.flatMap(c => [{ t: c.t, d: 1 }, { t: c.tEnd || now(), d: -1 }]).sort((a, b) => a.t - b.t || a.d - b.d);
  for (const e of evs) { cur += e.d; maxParallel = Math.max(maxParallel, cur); }
  const emits = h.responces(res.data.queueName).length;
  await h.teardown();
  return { workers, wall, done, scans: h.scanCalls.length, perFile, maxParallel, emits, decreases: 0 };
}

export async function run() {
  const r1 = await one(1);
  const r3 = await one(3);
  const r5 = await one(5);
  const ratio3 = r1.wall / r3.wall, ratio5 = r1.wall / r5.wall;
  const allOk = [r1, r3, r5].every(r => r.done?.cStatus === 'C' && r.done.nCompleted === N && r.scans === N);
  const pass = allOk && ratio3 >= 2.5 && r1.maxParallel === 1 && r3.maxParallel <= 3 && r5.maxParallel <= 5;
  const numbers = `${N} files: w1=${r1.wall.toFixed(1)}s (parallel ${r1.maxParallel}, ${r1.perFile.toFixed(1)} ms/file) w3=${r3.wall.toFixed(1)}s (parallel ${r3.maxParallel}) w5=${r5.wall.toFixed(1)}s (parallel ${r5.maxParallel}) `
    + `speedup w3=${ratio3.toFixed(2)}x (>= 2.5) w5=${ratio5.toFixed(2)}x; all C ${allOk} scans=${r1.scans}/${r3.scans}/${r5.scans} socketEmits=${r1.emits}/${r3.emits}/${r5.emits} (throttled 1/s)`;
  return verdict('A6', pass, numbers);
}
