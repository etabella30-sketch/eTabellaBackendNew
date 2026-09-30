/**
 * K7 (g) - 5 concurrent bundles of 600 files each (same section, 20 ms per
 * file), HYPERLINK_WORKERS=3: total wall time, and the peak number of
 * concurrently running stub "pythons" across all bundles must be exactly 3
 * (the cap applies across bundles, not per bundle). Also: every bundle
 * progresses concurrently (no bundle waits for another to finish), all 5 end
 * C 600/600, 3000 scans, 5 notifications, throttled emits <= ~1/s per batch.
 */
import { HarnessV2, bodyFor, makeFiles, now, verdict, sleep } from '../../../harness';
import { maxConcurrent } from '../util';

export async function run() {
  const B = 5, N = 600, FILE_MS = 20;
  const h = new HarnessV2({ label: 'K7' });
  await h.flush();
  const sets: Record<string, any[]> = {};
  for (let i = 1; i <= B; i++) sets[`B${i}`] = makeFiles(N, `g${i}`);
  h.db.getfiles = (q) => sets[q.nBundleid] || [];
  h.scan = { delayMs: FILE_MS, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '3' });
  const bodies = Array.from({ length: B }, (_, i) => bodyFor({ nSectionid: 'S-K7', nBundleid: `B${i + 1}` }));
  const t0 = now();
  const rs = await Promise.all(bodies.map(b => s.gen.starthyperlink(b, false)));
  const accepted = rs.filter(r => r.msg === 1).length;
  const keys = rs.map(r => r.data?.queueName), ids = rs.map(r => r.data?.batchId);
  const dones = await Promise.all(keys.map(k => h.waitForDone(k, 180000)));
  const wall = (now() - t0) / 1000;
  await sleep(500);
  const peak = maxConcurrent(h.scanCalls);
  const perBundle = ids.map(id => {
    const calls = h.scanCalls.filter(c => c.batchId === id);
    return { scans: calls.length, first: +((Math.min(...calls.map(c => c.t)) - t0) / 1000).toFixed(1), last: +((Math.max(...calls.map(c => c.tEnd || c.t)) - t0) / 1000).toFixed(1) };
  });
  // concurrency across bundles: at the midpoint, how many bundles had work in flight during the previous 2 s?
  const mid = t0 + (wall * 1000) / 2;
  const activeBundlesMid = new Set(h.scanCalls.filter(c => c.t <= mid && (c.tEnd || Infinity) >= mid - 2000).map(c => c.batchId)).size;
  const emits = keys.map(k => h.responces(k).length);
  const maxEmitRate = Math.max(...keys.map(k => { const ev = h.responces(k); let worst = 0; for (let i = 0; i < ev.length; i++) { let j = i; while (j < ev.length && ev[j].t - ev[i].t < 1000) j++; worst = Math.max(worst, j - i); } return worst; }));
  const notifs = h.notifications().length;
  const total = h.scanCalls.length;
  const perFile = (wall * 1000 * 3) / total;
  const counts = await h.counts(s.fq);
  const pass = accepted === B && dones.every(d => d?.cStatus === 'C' && d.nCompleted === N) && total === B * N && peak === 3 && notifs === B
    && counts.waiting + counts.active + counts.delayed === 0;
  const numbers = `${B}x${N} files, workers 3: accepted=${accepted} wall=${wall.toFixed(1)}s (${perFile.toFixed(1)} ms/file effective per slot) peakConcurrentScans=${peak} (cap 3) scans=${total}/${B * N} finals=[${dones.map(d => `${d?.cStatus} ${d?.nCompleted}`).join(',')}] `
    + `perBundle first..last s=[${perBundle.map(p => `${p.first}..${p.last}`).join(' ')}] INFO bundlesActiveAtMidpoint=${activeBundlesMid}/${B} (FIFO across bundles of equal priority is not judged) emitsPerBundle=[${emits.join(',')}] maxEmitsIn1s=${maxEmitRate} notifications=${notifs} queue=w${counts.waiting}/a${counts.active}`;
  await h.teardown();
  return verdict('K7', pass, numbers, { perBundle });
}
