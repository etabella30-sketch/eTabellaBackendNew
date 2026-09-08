/**
 * X7 (g) - 5 concurrent bundles of 600 files each (20 ms per file), one
 * process, HYPERLINK_WORKERS 3. Measures the total wall time and the maximum
 * number of concurrently running stub scans ACROSS bundles (must be <= 3:
 * the semaphore caps the pythons per process, not per bundle), every bundle
 * C 600/600, 3,000 scans, 5 notifications, no counter decrease.
 */
import { HarnessV2, bodyFor, makeFiles, now, verdict } from '../../harness';

const B = 5, N = 600, FILE_MS = 20;

export async function run() {
  const h = new HarnessV2({ label: 'X7' });
  await h.flush();
  const sets = Array.from({ length: B }, (_, i) => makeFiles(N, `x7b${i}`));
  h.db.getfiles = (q) => sets[Number(q.nBundleid.slice(1))];
  h.scan = { delayMs: FILE_MS, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '3' });
  const t0 = now();
  const rs = await Promise.all(Array.from({ length: B }, (_, i) => s.gen.starthyperlink(bodyFor({ nSectionid: 'S-X7', nBundleid: `B${i}` }), false)));
  const dones = await Promise.all(rs.map(r => h.waitForDone(r.data.queueName, 300000)));
  const wall = (now() - t0) / 1000;
  const scans = h.scanCalls.filter(c => c.tEnd);
  const perFile = scans.length ? scans.reduce((a, c) => a + (c.tEnd - c.t), 0) / scans.length : 0;
  let maxParallel = 0, cur = 0;
  const evs = h.scanCalls.flatMap(c => [{ t: c.t, d: 1 }, { t: c.tEnd || now(), d: -1 }]).sort((a, b) => a.t - b.t || a.d - b.d);
  for (const e of evs) { cur += e.d; maxParallel = Math.max(maxParallel, cur); }
  // parallelism per bundle at the same instant (how the semaphore is shared)
  const overlapBundles = new Set<string>();
  for (const c of h.scanCalls) { for (const o of h.scanCalls) { if (o !== c && o.batchId !== c.batchId && o.t < (c.tEnd || 0) && (o.tEnd || 0) > c.t) { overlapBundles.add(c.batchId); break; } } }
  const notif = h.notifications().length;
  const regress = rs.reduce((a, r) => a + h.regressions(r.data.queueName), 0);
  const ideal = (B * N * perFile) / 3 / 1000;
  const pass = dones.every(d => d?.cStatus === 'C' && d.nCompleted === N) && h.scanCalls.length === B * N && maxParallel <= 3 && notif === B && regress === 0;
  const numbers = `${B}x${N} files: wall=${wall.toFixed(1)}s (ideal at 3 parallel ~${ideal.toFixed(1)}s, ${perFile.toFixed(1)} ms/file) maxParallelAcrossBundles=${maxParallel} (cap 3) bundlesInterleaved=${overlapBundles.size}/${B} `
    + `finals=${dones.map(d => `${d?.cStatus}${d?.nCompleted}`).join(',')} scans=${h.scanCalls.length} notifications=${notif} counterDecreases=${regress} socketEmits=${h.responces().length}`;
  await h.teardown();
  return verdict('X7', pass, numbers);
}
