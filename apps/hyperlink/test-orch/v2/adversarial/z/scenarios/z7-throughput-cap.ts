/**
 * Z7 (g) - 5 bundles x 600 files (same section, 15 ms per file) started in
 * the same instant with HYPERLINK_WORKERS=3: total wall time; the peak number
 * of stub "pythons" running at the same instant across ALL bundles must be
 * exactly 3 (never above); all 5 end C 600/600 with 3,000 scans, 5
 * notifications, queue empty. Reported: per-bundle first..last scan (fair
 * slicing between bundles), effective ms per file per slot, emits per bundle.
 * Then INFO: a second worker process (own semaphore) on the same queue ->
 * peak per process still 3, total up to 6 (the cap is per process).
 */
import { HarnessV2, bodyFor, makeFiles, now, verdict, sleep } from '../../../harness';
import { peakConcurrent } from '../util';

export async function run() {
  const B = 5, N = 600, FILE_MS = 15;
  const h = new HarnessV2({ label: 'Z7' });
  await h.flush();
  const sets: Record<string, any[]> = {};
  for (let i = 1; i <= B; i++) sets[`B${i}`] = makeFiles(N, `z7b${i}`);
  h.db.getfiles = (q) => sets[q.nBundleid] || [];
  h.scan = { delayMs: FILE_MS, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '3' });
  const bodies = Array.from({ length: B }, (_, i) => bodyFor({ nSectionid: 'S-Z7', nBundleid: `B${i + 1}` }));
  const t0 = now();
  const rs = await Promise.all(bodies.map(b => s.gen.starthyperlink(b, false)));
  const accepted = rs.filter(r => r.msg === 1).length;
  const keys = rs.map(r => r.data?.queueName), ids = rs.map(r => r.data?.batchId);
  const dones = await Promise.all(keys.map(k => h.waitForDone(k, 180000)));
  const wall = (now() - t0) / 1000;
  await sleep(500);
  const peak = peakConcurrent(h.scanCalls);
  const perBundle = ids.map(id => { const c = h.scanCalls.filter(x => x.batchId === id); return `${((Math.min(...c.map(x => x.t)) - t0) / 1000).toFixed(1)}..${((Math.max(...c.map(x => x.tEnd || x.t)) - t0) / 1000).toFixed(1)}`; });
  const mid = t0 + wall * 500;
  const bundlesActiveMid = new Set(h.scanCalls.filter(c => c.t <= mid && (c.tEnd || Infinity) >= mid - 1500).map(c => c.batchId)).size;
  const total = h.scanCalls.length;
  const notifs = h.notifications().length;
  const emits = keys.map(k => h.responces(k).length);
  const counts = await h.counts(s.fq);
  const single = accepted === B && dones.every(d => d?.cStatus === 'C' && d.nCompleted === N) && total === B * N && peak === 3 && notifs === B && counts.waiting + counts.active + counts.delayed + counts.failed === 0;
  // INFO: second process on the same queue
  h.scanCalls.length = 0;
  const s2 = await h.stack('w2', { HYPERLINK_WORKERS: '3' });
  const sets2: Record<string, any[]> = { C1: makeFiles(300, 'z7c1'), C2: makeFiles(300, 'z7c2') };
  h.db.getfiles = (q) => sets2[q.nBundleid] || [];
  const t1 = now();
  const rs2 = await Promise.all(['C1', 'C2'].map(b => s2.gen.starthyperlink(bodyFor({ nSectionid: 'S-Z7b', nBundleid: b }), false)));
  await Promise.all(rs2.map(r => h.waitForDone(r.data.queueName, 60000)));
  await sleep(300);
  const wall2 = (now() - t1) / 1000;
  const peakAll = peakConcurrent(h.scanCalls), peakW1 = peakConcurrent(h.scanCalls.filter(c => c.tag === 'w1')), peakW2 = peakConcurrent(h.scanCalls.filter(c => c.tag === 'w2'));
  const pass = single && peakW1 <= 3 && peakW2 <= 3;
  const numbers = `${B}x${N} files, workers 3, one process: accepted=${accepted} wall=${wall.toFixed(1)}s (${((wall * 1000 * 3) / total).toFixed(1)} ms/file/slot) peakConcurrentScans=${peak} (cap 3) scans=${total}/${B * N} finals=[${dones.map(d => `${d?.cStatus} ${d?.nCompleted}`).join(',')}] perBundle first..last=[${perBundle.join(' ')}] bundlesActiveAtMidpoint=${bundlesActiveMid}/${B} emits=[${emits.join(',')}] notifications=${notifs} queue=w${counts.waiting}/a${counts.active} `
    + `| INFO two processes, 2x300: wall=${wall2.toFixed(1)}s peak w1=${peakW1} w2=${peakW2} total=${peakAll} (cap is per process: 3 x N instances)`;
  await h.teardown();
  return verdict('Z7', pass, numbers);
}
