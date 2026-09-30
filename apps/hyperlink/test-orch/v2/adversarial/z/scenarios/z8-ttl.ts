/**
 * Z8 (h) - progress key TTL after finalize and after cancel, and whether
 * anything that happens AFTERWARDS re-arms it.
 *   Z8a: finalize -> TTLs at +0 and +2 s (all <= done TTL and decreasing);
 *        then a Bull re-run of an already counted job (same data, new id) ->
 *        skipped, TTLs untouched; then the accounting of an already counted
 *        file (what the failed listener does for a stalled-for-good job of a
 *        finished batch) -> reported: does it re-arm the batch keys?
 *   Z8b: cancel with 2 pythons in flight that FINISH 2.5 s later (not
 *        killed): the X snapshot gets their counters; the progress key TTL
 *        must not be extended; the batch keys' TTL after the late accounting
 *        is reported.
 *   Z8c: orchestrator failure (getfiles throws) -> F, TTLs <= done TTL, the
 *        section mutex key gone.
 */
import { HarnessV2, bodyFor, makeFiles, verdict, sleep } from '../../../harness';
import { ttls, fmt, within } from '../util';

export async function run() { return [await afterFinalize(), await afterCancel(), await afterOrchestratorFailure()]; }

async function afterFinalize() {
  const h = new HarnessV2({ label: 'Z8a' });
  await h.flush();
  const files = makeFiles(5, 'z8a');
  h.db.getfiles = () => files;
  h.scan = { delayMs: 20, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '3' });
  const body = bodyFor({ nSectionid: 'S-Z8a', nBundleid: 'B' });
  const r = await s.gen.starthyperlink(body, false);
  const key = r.data.queueName, batchId = r.data.batchId;
  const done = await h.waitForDone(key, 15000);
  const t0 = await ttls(h, key, batchId);
  await sleep(2000);
  const t2 = await ttls(h, key, batchId);
  // a stalled re-run of a counted job: same data, fresh id
  const hash = await h.redis.hgetall(`HYPERLINK-BATCH/${batchId}`);
  const base = s.batch.baseOf({ ...done, batchId } as any);
  await s.fq.add({ batchId, run: hash.run, progressKey: key, file: files[0], jobData: base, searchTermsPath: '' }, { jobId: `${batchId}:${hash.run}:rerun-1`, removeOnComplete: true, removeOnFail: true });
  await sleep(700);
  const t3 = await ttls(h, key, batchId);
  const scansAfter = h.scanCalls.length - 5;
  // the failed listener's accounting of a finished batch (already counted file)
  const acc = await s.batch.account(batchId, hash.run, key, base, files[1], 'F', 'bull: job stalled more than allowable limit');
  await s.batch.afterAccount(acc, batchId, key);
  const t4 = await ttls(h, key, batchId);
  const snap = await h.snapshot(key);
  const notif = h.notifications().length;
  const rearmed = t4.hash > t3.hash || t4.seen > t3.seen || t4.jobs > t3.jobs;
  const pass = done?.cStatus === 'C' && within(t0, 900) && within(t2, 898) && t2.key < t0.key && within(t3, 898) && scansAfter === 0 && t4.key <= t3.key && snap?.cStatus === 'C' && snap.nFailed === 0 && notif === 1 && acc.counted === 0;
  const numbers = `C 5/5: TTL +0s ${fmt(t0)} | +2s ${fmt(t2)} | after a re-run of a counted job (scans=${scansAfter}) ${fmt(t3)} | after a late F accounting of a counted file (counted=${acc.counted}) ${fmt(t4)} key=${snap?.cStatus} ${snap?.nCompleted}/${snap?.nFailed} notifications=${notif} batchKeysReArmed=${rearmed} (progress key extended: ${t4.key > t3.key})`;
  await h.teardown();
  return verdict('Z8a', pass, numbers);
}

async function afterCancel() {
  const h = new HarnessV2({ label: 'Z8b' });
  await h.flush();
  const files = makeFiles(8, 'z8b');
  h.db.getfiles = () => files;
  const SLOW = new Set(['z8b-00003', 'z8b-00004']);
  h.scan = { delayMs: (f) => SLOW.has(f.nBundledetailid) ? 2500 : 20, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '2' });
  const body = bodyFor({ nSectionid: 'S-Z8b', nBundleid: 'B' });
  const r = await s.gen.starthyperlink(body, false);
  const key = r.data.queueName, batchId = r.data.batchId;
  await h.waitFor(async () => (await h.redis.hget(`HYPERLINK-BATCH/${batchId}`, 'done')) === '2' && h.scanCalls.filter(c => SLOW.has(c.nBundledetailid)).length === 2, 10000);
  const c = await s.gen.cancelhyperlink(body as any);
  const t0 = await ttls(h, key, batchId);
  const snap0 = await h.snapshot(key);
  await sleep(3200);   // the two slow scans finish and account late
  const t3 = await ttls(h, key, batchId);
  const snap3 = await h.snapshot(key);
  const hash = await h.redis.hgetall(`HYPERLINK-BATCH/${batchId}`);
  const notif = h.notifications().map(e => e.data.cMsg.split(' | ')[0]);
  const spSlow = h.spCalls.filter(x => SLOW.has(x.nBundledetailid) && x.sp.startsWith('hyperlink_update')).map(x => x.cStatus).join(',');
  const counts = await h.counts(s.fq);
  const pass = c.msg === 1 && snap0?.cStatus === 'X' && snap3?.cStatus === 'X' && snap3.nCompleted === 4 && Number(hash.done) === 4 && within(t0, 900) && t3.key <= t0.key - 3 && t3.key > 0 && notif.length === 1 && counts.waiting + counts.active + counts.delayed === 0;
  const numbers = `cancel msg=${c.msg} removed=${c.removed} at ${snap0?.nCompleted}/${snap0?.nTotal}: TTL +0s ${fmt(t0)} | +3.2s after the 2 in-flight files finished (SP ${spSlow}) key=${snap3?.cStatus} ${snap3?.nCompleted}/${snap3?.nTotal} hash=${hash.done}+${hash.failed}: ${fmt(t3)} progressKeyExtended=${t3.key > t0.key} batchKeysReArmed=${t3.hash > t0.hash} notifications=[${notif.join(',')}] queue=w${counts.waiting}/a${counts.active}`;
  await h.teardown();
  return verdict('Z8b', pass, numbers);
}

async function afterOrchestratorFailure() {
  const h = new HarnessV2({ label: 'Z8c' });
  await h.flush();
  h.db.getfiles = () => { throw new Error('getfiles exploded'); };
  h.scan = { delayMs: 20, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '3' });
  const body = bodyFor({ nSectionid: 'S-Z8c', nBundleid: 'B' });
  const r = await s.gen.starthyperlink(body, false);
  const key = r.data.queueName, batchId = r.data.batchId;
  const done = await h.waitForDone(key, 10000);
  const t = await ttls(h, key, batchId);
  const lock = await h.redis.exists(s.batch.sectionLockKey(body));
  const notif = h.notifications().map(e => e.data.cMsg.split(' | ')[0]);
  const again = await s.gen.starthyperlink(body, false);
  const pass = done?.cStatus === 'F' && within(t, 900) && t.key > 0 && lock === 0 && notif.length === 1 && /failed/.test(notif[0]) && again.msg === 1;
  const numbers = `getfiles throws -> key=${done?.cStatus} reason="${done?.jFailed?.[0]?.cReason}" TTL ${fmt(t)} sectionLockKeyLeft=${lock} notifications=[${notif.join(',')}] restart=${again.msg}`;
  await h.teardown();
  return verdict('Z8c', pass, numbers);
}
