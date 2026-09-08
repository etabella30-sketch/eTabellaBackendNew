/**
 * A18 - Cancel accuracy, TTL and compatibility minors of fix round 3.
 *  (a) LATE markEnqueueDone: a 3-file batch whose last addBulk reply comes
 *      back 400 ms after the batch finalized must keep the done TTL on the
 *      hash (no re-arm to 48 h).
 *  (b) CANCEL with files in flight: 6 files, workers 3, cancel after 200 ms.
 *      Files 1-2 finish normally after the cancel (counted C for the record,
 *      their SP 'C' call is fine), file 3 hangs until the file job's own
 *      cancel poll kills it -- killFile fails on its first tick (python not
 *      registered yet) and succeeds on the second, so the poll must keep
 *      trying. The killed file gets NO SP 'F' call (DB status untouched) and
 *      is counted F 'cancelled' for the record. The final X snapshot must
 *      carry the counters of the hash (2 C + 1 F, jFailed with the cancelled
 *      entry), exactly one terminal status (X) and one notification.
 *  (c) 1-FILE BUNDLE notification carries the file's nBundledetailid.
 *  (d) LEGACY index key on the single-file scope (no batchId, no dUpdate):
 *      while its job sits on hyperlink-index-queue a v2 starthyperlink for
 *      that file is refused; once the job is gone the key is released as
 *      stale and the v2 start accepted.
 */
import { HarnessV2, bodyFor, makeFiles, now, verdict, sleep } from '../harness';

export async function run() {
  const a = await lateMarkEnqueueDone();
  const b = await cancelAccuracy();
  const c = await oneFileBundle();
  const d = await legacyIndexKey();
  const pass = a.pass && b.pass && c.pass && d.pass;
  return verdict('A18', pass, `(a) ${a.numbers} || (b) ${b.numbers} || (c) ${c.numbers} || (d) ${d.numbers}`);
}

async function ttls(h: HarnessV2, key: string, batchId: string) {
  return { key: await h.redis.ttl(key), hash: await h.redis.ttl(`HYPERLINK-BATCH/${batchId}`), seen: await h.redis.ttl(`HYPERLINK-BATCH/${batchId}/seen`), jobs: await h.redis.ttl(`HYPERLINK-BATCH/${batchId}/jobs`) };
}
const fmt = (t: Record<string, number>) => Object.entries(t).map(([k, v]) => `${k}=${v}`).join(' ');
const within = (t: Record<string, number>, max: number) => Object.values(t).every(v => v === -2 || (v > 0 && v <= max));

async function lateMarkEnqueueDone() {
  const h = new HarnessV2({ label: 'A18a' });
  await h.flush();
  h.db.getfiles = () => makeFiles(3, 'l');
  h.scan = { delayMs: 5, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '3' });
  const origAddBulk = s.fq.addBulk.bind(s.fq);
  (s.fq as any).addBulk = async (jobs: any[]) => { const r = await origAddBulk(jobs); await sleep(400); return r; };   // the reply is late, the jobs are already in
  const r = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-A18a', nBundleid: 'B' }), false);
  const done = await h.waitForDone(r.data.queueName, 15000);
  const atFinalize = await ttls(h, r.data.queueName, r.data.batchId);
  await sleep(1200);   // markEnqueueDone has run by now
  const later = await ttls(h, r.data.queueName, r.data.batchId);
  const hash = await h.redis.hgetall(`HYPERLINK-BATCH/${r.data.batchId}`);
  const pass = done?.cStatus === 'C' && hash.enqueueDone === '1' && within(later, 900) && later.hash > 0;
  await h.teardown();
  return { pass, numbers: `3 files, addBulk reply 400ms late: finalized ${done?.cStatus} ${done?.nCompleted}/${done?.nTotal}, enqueueDone=${hash.enqueueDone || 0} -> TTLs at finalize ${fmt(atFinalize)} | 1.2s later ${fmt(later)} (all <= 900: ${within(later, 900)})` };
}

async function cancelAccuracy() {
  const N = 6, FILE_MS = 500;
  const h = new HarnessV2({ label: 'A18b' });
  await h.flush();
  h.db.getfiles = () => makeFiles(N, 'cx');
  // file 3 hangs (python running) until the job's cancel poll kills it
  h.scan = { delayMs: FILE_MS, result: (f) => f.nBundledetailid === 'cx-00003' ? 'hang' : true };
  const killAttempts = new Map<string, number>();
  h.killFileHook = (_b, id) => { const n = (killAttempts.get(id) || 0) + 1; killAttempts.set(id, n); return n >= 2; };   // 1st tick: not registered yet; 2nd tick: signalled
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '3', HYPERLINK_CANCEL_POLL_MS: '300' });
  const body = bodyFor({ nSectionid: 'S-A18b', nBundleid: 'B' });
  const r = await s.gen.starthyperlink(body, false);
  const key = r.data.queueName, batchId = r.data.batchId;
  await h.waitFor(() => h.scanCalls.filter(c => !c.tEnd).length >= 3, 5000, 10);
  const inFlight = h.scanCalls.filter(c => !c.tEnd).length;
  const tCancel = now();
  const cres = await s.gen.cancelhyperlink({ nCaseid: body.nCaseid, nSectionid: body.nSectionid, nBundleid: body.nBundleid } as any);
  const snapAtCancel = await h.snapshot(key);
  // files 1-2 finish (500 ms), file 3 is killed by the 2nd poll tick (~600 ms)
  await h.waitFor(async () => { const hs = await h.redis.hgetall(`HYPERLINK-BATCH/${batchId}`); return Number(hs.done || 0) + Number(hs.failed || 0) >= 3; }, 5000, 20);
  await sleep(400);
  const hash = await h.redis.hgetall(`HYPERLINK-BATCH/${batchId}`);
  const snap = await h.snapshot(key);
  const t = await ttls(h, key, batchId);
  const kills = h.killFileCalls.filter(k => k.nBundledetailid === 'cx-00003');
  const spFor3 = h.spCalls.filter(c => c.nBundledetailid === 'cx-00003' && /hyperlink_update_documents/.test(c.sp));
  const spC = h.spCalls.filter(c => /hyperlink_update_documents/.test(c.sp) && c.cStatus === 'C').length;
  const spF = h.spCalls.filter(c => /hyperlink_update_documents/.test(c.sp) && c.cStatus === 'F').length;
  const untouchedLog = h.logs.filter(l => /cancelled while scanning, DB status left untouched/.test(l)).length;
  const terminal = new Set(h.responces(key).filter(e => e.data.data.cStatus !== 'P').map(e => e.data.data.cStatus));
  const notifs = h.notifications().map(e => String(e.data.cMsg));
  const counts = await h.counts(s.fq);
  const cancelledEntry = (snap?.jFailed || []).find(f => f.nBundledetailid === 'cx-00003');
  const scansAfterCancel = h.scanCalls.filter(c => c.t > tCancel).length;
  const pass = cres.msg === 1 && inFlight === 3 && snapAtCancel?.cStatus === 'X'
    && kills.length === 2 && kills[0].result === false && kills[1].result === true
    && spFor3.length === 0 && spF === 0 && spC === 2 && untouchedLog === 1
    && Number(hash.done) === 2 && Number(hash.failed) === 1
    && snap?.cStatus === 'X' && snap.nCompleted === 2 && snap.nFailed === 1 && !!cancelledEntry && cancelledEntry.cReason === 'cancelled'
    && terminal.size === 1 && terminal.has('X') && notifs.length === 1 && /cancelled/.test(notifs[0])
    && within(t, 900) && t.key > 0 && scansAfterCancel === 0 && counts.waiting + counts.active + counts.delayed === 0;
  const numbers = `cancel with ${inFlight} in flight msg=${cres.msg} removed=${cres.removed} keyAtCancel=${snapAtCancel?.cStatus} ${snapAtCancel?.nCompleted}/${snapAtCancel?.nTotal}; poll killFile ticks for cx-00003=${kills.length} [${kills.map(k => k.result).join(',')}] `
    + `SP calls: C=${spC} F=${spF} forKilledFile=${spFor3.length} dbUntouchedLog=${untouchedLog}; hash done=${hash.done} failed=${hash.failed} -> X snapshot ${snap?.nCompleted}/${snap?.nTotal} failed=${snap?.nFailed} jFailed=${JSON.stringify((snap?.jFailed || []).map(f => `${f.nBundledetailid}:${f.cReason}`))} `
    + `terminalStatuses=${[...terminal].join('')} notifications=${notifs.length} "${notifs[0]}" scansAfterCancel=${scansAfterCancel} TTLs ${fmt(t)} queue=w${counts.waiting}/a${counts.active}`;
  await h.teardown();
  return { pass, numbers };
}

async function oneFileBundle() {
  const h = new HarnessV2({ label: 'A18c' });
  await h.flush();
  h.db.getfiles = () => makeFiles(1, 'one');
  h.scan = { delayMs: 10, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '3' });
  const r = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-A18c', nBundleid: 'B1' }), false);
  const done = await h.waitForDone(r.data.queueName, 10000);
  await sleep(300);
  const n = h.notifications();
  const id = n[0]?.data?.nBundledetailid;
  const pass = done?.cStatus === 'C' && done.nTotal === 1 && n.length === 1 && id === 'one-00001';
  await h.teardown();
  return { pass, numbers: `1-file bundle -> ${done?.cStatus} ${done?.nCompleted}/${done?.nTotal}, notification nBundledetailid=${id} "${n[0]?.data?.cMsg}"` };
}

async function legacyIndexKey() {
  const h = new HarnessV2({ label: 'A18d' });
  await h.flush();
  h.db.getfiles = () => makeFiles(1, 'lg');
  h.scan = { delayMs: 10, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '3' }, { indexQueue: true });
  const body = bodyFor({ nSectionid: 'S-A18d', nBundledetailid: 'lg-00001' });
  const key = s.batch.progressKeyFor(body);   // == the legacy index key shape HYPERLINK/<m>/<c>/<s>/<nBundledetailid>
  const legacy = { queueName: key, nCaseid: 'c1', nSectionid: 'S-A18d', nMasterid: 'm1', nBundledetailid: 'lg-00001', nBundleid: null, cType: 'E', nTotal: 0, nCompleted: 0, nFailed: 0, cStatus: 'P', cKeeptype: 'R', isDeepscan: false, isSmartscan: false };
  const job = await s.iq.add(legacy, { removeOnComplete: true, removeOnFail: true });   // no worker: the index job waits
  await h.redis.set(key, JSON.stringify(legacy));   // no TTL, no dUpdate, no batchId: exactly what the legacy path writes
  const r1 = await s.gen.starthyperlink(body, false);
  const keyAfter1 = await h.snapshot(key);
  await job.remove();   // the index job is gone (finished / crashed): the legacy key is dead
  const r2 = await s.gen.starthyperlink(body, false);
  const done = await h.waitForDone(key, 10000);
  const pass = r1.msg === -1 && keyAfter1?.cStatus === 'P' && !keyAfter1.batchId && r2.msg === 1 && r2.staleReleased === true && done?.cStatus === 'C' && done.nTotal === 1;
  await h.teardown();
  return { pass, numbers: `legacy index key (no batchId/dUpdate) + index job waiting -> v2 start msg=${r1.msg} "${r1.value}" keyKept=${keyAfter1?.cStatus === 'P' && !keyAfter1?.batchId}; index job removed -> msg=${r2.msg} staleReleased=${!!r2.staleReleased} newBatch=${done?.cStatus} ${done?.nCompleted}/${done?.nTotal}` };
}
