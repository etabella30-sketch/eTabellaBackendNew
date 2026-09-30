/**
 * K8 (h) - TTL of the progress key (and the batch keys) after finalize and
 * after cancel.
 *   K8a: finalize (C) -> key TTL in (0, 900], hash/seen/failed/jobs <= 900.
 *   K8b: finalize (F, getfiles throws) -> the same.
 *   K8c: cancel with files in flight -> immediately after the cancel and
 *        again after the in-flight files finished: all <= 900, key still X.
 *   K8d: the finalize lands BEFORE the orchestrator's markEnqueueDone (a
 *        3-file batch whose addBulk reply is 400 ms late): after everything
 *        settled the hash must still carry the done TTL, not 48 h.
 */
import { HarnessV2, bodyFor, makeFiles, verdict, sleep } from '../../../harness';
import { batchTtls, fmtTtls, allTtlsWithin } from '../util';

export async function run() {
  return [await afterFinalizeC(), await afterFailBatch(), await afterCancel(), await lateMarkEnqueueDone()];
}

async function afterFinalizeC() {
  const h = new HarnessV2({ label: 'K8a' });
  await h.flush();
  h.db.getfiles = () => makeFiles(5, 't');
  h.scan = { delayMs: 10, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '3' });
  const r = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-K8a', nBundleid: 'B' }), false);
  const done = await h.waitForDone(r.data.queueName, 15000);
  await sleep(500);
  const ttls = await batchTtls(h, r.data.queueName, r.data.batchId);
  const pass = done?.cStatus === 'C' && allTtlsWithin(ttls, 900) && ttls.key > 0;
  await h.teardown();
  return verdict('K8a', pass, `finalized ${done?.cStatus} ${done?.nCompleted}/${done?.nTotal}: TTLs ${fmtTtls(ttls)} (all in (0,900]: ${allTtlsWithin(ttls, 900)})`);
}

async function afterFailBatch() {
  const h = new HarnessV2({ label: 'K8b' });
  await h.flush();
  h.db.getfiles = () => { throw new Error('getfiles exploded'); };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '3' });
  const r = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-K8b', nBundleid: 'B' }), false);
  const done = await h.waitForDone(r.data.queueName, 15000);
  await sleep(300);
  const ttls = await batchTtls(h, r.data.queueName, r.data.batchId);
  const pass = done?.cStatus === 'F' && allTtlsWithin(ttls, 900) && ttls.key > 0;
  await h.teardown();
  return verdict('K8b', pass, `orchestrator failure -> ${done?.cStatus}: TTLs ${fmtTtls(ttls)} (all in (0,900]: ${allTtlsWithin(ttls, 900)})`);
}

async function afterCancel() {
  const N = 400;
  const h = new HarnessV2({ label: 'K8c' });
  await h.flush();
  h.db.getfiles = () => makeFiles(N, 'x');
  h.scan = { delayMs: 300, result: true };   // slow files so 3 are in flight at the cancel
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '3' });
  const body = bodyFor({ nSectionid: 'S-K8c', nBundleid: 'B' });
  const r = await s.gen.starthyperlink(body, false);
  await h.waitFor(() => h.scanCalls.filter(c => !c.tEnd).length >= 3, 5000, 10);
  const inFlight = h.scanCalls.filter(c => !c.tEnd).length;
  const cancel = await s.gen.cancelhyperlink({ nCaseid: body.nCaseid, nSectionid: body.nSectionid, nBundleid: body.nBundleid } as any);
  const t1 = await batchTtls(h, r.data.queueName, r.data.batchId);
  const snap1 = await h.snapshot(r.data.queueName);
  await sleep(700);   // the in-flight files finish and account "for the record"
  const t2 = await batchTtls(h, r.data.queueName, r.data.batchId);
  const snap2 = await h.snapshot(r.data.queueName);
  const hash = await h.redis.hgetall(`HYPERLINK-BATCH/${r.data.batchId}`);
  const counts = await h.counts(s.fq);
  const pass = cancel.msg === 1 && snap1?.cStatus === 'X' && snap2?.cStatus === 'X' && allTtlsWithin(t1, 900) && allTtlsWithin(t2, 900) && t2.key > 0
    && counts.waiting + counts.active + counts.delayed === 0;
  await h.teardown();
  return verdict('K8c', pass, `cancel with ${inFlight} in flight msg=${cancel.msg} removed=${cancel.removed}: right after: key=${snap1?.cStatus} TTLs ${fmtTtls(t1)} | 700ms later (hash done=${hash.done}): key=${snap2?.cStatus} ${snap2?.nCompleted}/${snap2?.nTotal} TTLs ${fmtTtls(t2)} (all <= 900: ${allTtlsWithin(t1, 900) && allTtlsWithin(t2, 900)}) queue=w${counts.waiting}/a${counts.active}`);
}

async function lateMarkEnqueueDone() {
  const h = new HarnessV2({ label: 'K8d' });
  await h.flush();
  h.db.getfiles = () => makeFiles(3, 'l');
  h.scan = { delayMs: 5, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '3' });
  const origAddBulk = s.fq.addBulk.bind(s.fq);
  (s.fq as any).addBulk = async (jobs: any[]) => { const r = await origAddBulk(jobs); await sleep(400); return r; };   // the reply is late, the jobs are already in
  const r = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-K8d', nBundleid: 'B' }), false);
  const done = await h.waitForDone(r.data.queueName, 15000);
  const ttlAtFinalize = await batchTtls(h, r.data.queueName, r.data.batchId);
  await sleep(1200);   // markEnqueueDone has run by now
  const ttls = await batchTtls(h, r.data.queueName, r.data.batchId);
  const hash = await h.redis.hgetall(`HYPERLINK-BATCH/${r.data.batchId}`);
  const pass = done?.cStatus === 'C' && allTtlsWithin(ttls, 900);
  await h.teardown();
  return verdict('K8d', pass, `3 files, addBulk reply 400ms late: finalized ${done?.cStatus} ${done?.nCompleted}/${done?.nTotal} with enqueueDone=${hash.enqueueDone || 0} -> TTLs at finalize ${fmtTtls(ttlAtFinalize)} | 1.2s later ${fmtTtls(ttls)} (all <= 900: ${allTtlsWithin(ttls, 900)})`);
}
