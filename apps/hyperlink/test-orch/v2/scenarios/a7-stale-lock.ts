/**
 * A7 - Stale lock. A progress key with cStatus 'P' whose dUpdate is 3 h old,
 * a batch hash with done + failed < total and an empty file queue -> the
 * next starthyperlink is accepted and the old key is marked F/stale first.
 * Control: the same key with a fresh dUpdate is still rejected.
 */
import { HarnessV2, bodyFor, makeFiles, verdict } from '../harness';

export async function run() {
  const h = new HarnessV2({ label: 'A7' });
  await h.flush();
  h.db.getfiles = () => makeFiles(5, 'a7');
  h.scan = { delayMs: 10, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '3', HYPERLINK_STALE_MIN: '90' });
  const body = bodyFor({ nSectionid: 'S-A7', nBundleid: 'B-A7' });
  const batchId = s.batch.batchIdFor(body);
  const key = s.batch.progressKeyFor(body);
  const old = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
  const dead = { queueName: key, batchId, nCaseid: 'c1', nSectionid: 'S-A7', nMasterid: 'm1', nBundledetailid: null, nBundleid: 'B-A7', cType: 'E', cKeeptype: 'R', nTotal: 10, nCompleted: 2, nFailed: 0, cStatus: 'P', isDeepscan: false, isSmartscan: false, dStart: old, dUpdate: old };
  await h.redis.set(key, JSON.stringify(dead));
  await h.redis.hset(`HYPERLINK-BATCH/${batchId}`, 'total', '10', 'done', '2', 'failed', '0', 'cancelled', '0', 'finalized', '0', 'owner', key, 'run', 'deadrun');

  // control: a fresh 'P' key is NOT stale
  const fresh = { ...dead, dUpdate: new Date().toISOString() };
  await h.redis.set(key, JSON.stringify(fresh));
  const rFresh = await s.gen.starthyperlink(body, false);
  await h.redis.set(key, JSON.stringify(dead));

  const counts = await h.counts(s.fq);
  const r = await s.gen.starthyperlink(body, false);
  const staleEmit = h.responces(key).find(e => e.data.data.cStatus === 'F' && (e.data.data.jFailed || []).some(f => f.cReason === 'stale'));
  const logged = h.consoleLines.some(l => /is stale/.test(l));
  const done = await h.waitForDone(r.data?.queueName || key, 20000);
  const pass = rFresh.msg === -1 && r.msg === 1 && r.staleReleased === true && !!staleEmit && logged && done?.cStatus === 'C' && done.nTotal === 5
    && counts.waiting + counts.active + counts.delayed === 0;
  const numbers = `freshKey -> msg=${rFresh.msg} (${rFresh.value}); 3h-old key, hash 2/10, queue empty (w${counts.waiting}/a${counts.active}) -> msg=${r.msg} staleReleased=${r.staleReleased} `
    + `oldKeyMarked=${staleEmit ? `${staleEmit.data.data.cStatus}/${staleEmit.data.data.jFailed.map(f => f.cReason).join(',')}` : 'no'} logged=${logged} newBatch=${done?.cStatus} ${done?.nCompleted}/${done?.nTotal}`;
  await h.teardown();
  return verdict('A7', pass, numbers);
}
