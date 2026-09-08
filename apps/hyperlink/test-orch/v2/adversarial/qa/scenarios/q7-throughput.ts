/**
 * Q7 (g) - 5 concurrent bundles of 600 files (20 ms each) in 5 sections,
 * started by two admins, ONE process with HYPERLINK_WORKERS 3: wall time,
 * maximum number of stub scans running at the same instant across bundles
 * (must be <= 3), every bundle C 600/600, 5 notifications, 3,000 scans.
 *
 * Q7b - the same queues served by TWO processes (pm2 cluster: ecosystem
 * .config.js runs 'hyperlink' with instances 'max'): the cap is per process,
 * so the measured parallelism is expected to reach 2 x HYPERLINK_WORKERS.
 * Reported, not judged (the design speaks of one process).
 */
import { HarnessV2, bodyFor, makeFiles, now, verdict } from '../../../harness';

function maxParallel(h: HarnessV2) {
  let max = 0, cur = 0;
  const evs = h.scanCalls.flatMap(c => [{ t: c.t, d: 1 }, { t: c.tEnd || now(), d: -1 }]).sort((a, b) => a.t - b.t || a.d - b.d);
  for (const e of evs) { cur += e.d; max = Math.max(max, cur); }
  return max;
}

export async function run() {
  return [await oneProcess(), await twoProcesses()];
}

async function oneProcess() {
  const B = 5, N = 600, FILE_MS = 20;
  const h = new HarnessV2({ label: 'Q7' });
  await h.flush();
  const sets = Array.from({ length: B }, (_, i) => makeFiles(N, `q7b${i}`));
  h.db.getfiles = (q) => sets[Number(String(q.nBundleid).slice(1))];
  h.scan = { delayMs: FILE_MS, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '3' });
  const t0 = now();
  const rs = await Promise.all(Array.from({ length: B }, (_, i) => s.gen.starthyperlink(bodyFor({ nSectionid: `S-Q7-${i}`, nBundleid: `B${i}`, nMasterid: i % 2 ? 'm2' : 'm1' }), false)));
  const dones = await Promise.all(rs.map(r => h.waitForDone(r.data.queueName, 300000)));
  const wall = (now() - t0) / 1000;
  const scans = h.scanCalls.filter(c => c.tEnd);
  const perFile = scans.reduce((a, c) => a + (c.tEnd - c.t), 0) / Math.max(1, scans.length);
  const mp = maxParallel(h);
  const finishOrder = rs.map((r, i) => ({ i, t: Math.max(...h.scanCalls.filter(c => c.batchId === r.data.batchId).map(c => c.tEnd || 0)) })).sort((a, b) => a.t - b.t).map(x => `B${x.i}@${((x.t - t0) / 1000).toFixed(1)}s`);
  const notif = h.notifications().length;
  const regress = rs.reduce((a, r) => a + h.regressions(r.data.queueName), 0);
  const ideal = (B * N * perFile) / 3 / 1000;
  const pass = rs.every(r => r.msg === 1) && dones.every(d => d?.cStatus === 'C' && d.nCompleted === N) && h.scanCalls.length === B * N && mp <= 3 && notif === B && regress === 0;
  const numbers = `${B}x${N}: wall=${wall.toFixed(1)}s (ideal at 3 parallel ${ideal.toFixed(1)}s, ${perFile.toFixed(1)} ms/file) maxConcurrentScansAcrossBundles=${mp} (cap 3) finishOrder=[${finishOrder.join(' ')}] `
    + `finals=${dones.map(d => `${d?.cStatus}${d?.nCompleted}`).join(',')} scans=${h.scanCalls.length} notifications=${notif} counterDecreases=${regress}`;
  await h.teardown();
  return verdict('Q7', pass, numbers);
}

async function twoProcesses() {
  const B = 2, N = 300, FILE_MS = 20;
  const h = new HarnessV2({ label: 'Q7b' });
  await h.flush();
  const sets = Array.from({ length: B }, (_, i) => makeFiles(N, `q7c${i}`));
  h.db.getfiles = (q) => sets[Number(String(q.nBundleid).slice(1))];
  h.scan = { delayMs: FILE_MS, result: true };
  const s1 = await h.stack('p1', { HYPERLINK_WORKERS: '3' });
  const s2 = await h.stack('p2', { HYPERLINK_WORKERS: '3' });
  const t0 = now();
  const rs = await Promise.all(Array.from({ length: B }, (_, i) => s1.gen.starthyperlink(bodyFor({ nSectionid: `S-Q7b-${i}`, nBundleid: `B${i}` }), false)));
  const dones = await Promise.all(rs.map(r => h.waitForDone(r.data.queueName, 120000)));
  const wall = (now() - t0) / 1000;
  const mp = maxParallel(h);
  const per = (tag: string) => h.scanCalls.filter(c => c.tag === tag).length;
  const pass = dones.every(d => d?.cStatus === 'C' && d.nCompleted === N) && h.scanCalls.length === B * N && h.notifications().length === B;
  const numbers = `2 processes x HYPERLINK_WORKERS=3, ${B}x${N}: maxConcurrentScans=${mp} (per-process cap 3 -> ${mp > 3 ? 'cap is PER PROCESS; pm2 instances:max multiplies it' : 'global'}) p1=${per('p1')} p2=${per('p2')} wall=${wall.toFixed(1)}s finals=${dones.map(d => `${d?.cStatus}${d?.nCompleted}`).join(',')}`;
  await h.teardown();
  void s2;
  return verdict('Q7b', pass, numbers);
}
