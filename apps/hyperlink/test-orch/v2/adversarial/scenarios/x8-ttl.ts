/**
 * X8 (h) - TTL of the progress key and the batch keys after finalize and
 * after cancel (HYPERLINK_DONE_TTL_SEC 900 in the harness config).
 *   X8a: batch with one failure completes -> TTL of progress key, hash, seen,
 *        failed list all in (850, 900].
 *   X8b: cancel of a running batch with jobs in flight; after the in-flight
 *        jobs settle, the same four TTLs (an in-flight job's accounting runs
 *        after the cancel).
 *   X8c: after finalize, a late duplicate of a file job of the same run is
 *        processed (stalled re-run) -> TTLs afterwards.
 */
import { HarnessV2, bodyFor, makeFiles, verdict, sleep } from '../../harness';

async function ttls(h: HarnessV2, key: string, batchId: string) {
  const t = async (k: string) => await h.redis.ttl(k);
  return { key: await t(key), hash: await t(`HYPERLINK-BATCH/${batchId}`), seen: await t(`HYPERLINK-BATCH/${batchId}/seen`), failed: await t(`HYPERLINK-BATCH/${batchId}/failed`) };
}
const fmt = (o: any) => `key=${o.key} hash=${o.hash} seen=${o.seen} failed=${o.failed}`;
const okDone = (o: any, withFailed: boolean) => [o.key, o.hash, o.seen, ...(withFailed ? [o.failed] : [])].every(v => v > 850 && v <= 900);

export async function run() {
  return [await afterFinalize(), await afterCancel(), await lateDuplicate()];
}

async function afterFinalize() {
  const h = new HarnessV2({ label: 'X8a' });
  await h.flush();
  h.db.getfiles = () => makeFiles(6, 'x8a');
  h.scan = { delayMs: 10, result: (f) => f.nBundledetailid !== 'x8a-00003' };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '3' });
  const res = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-X8a', nBundleid: 'B' }), false);
  const done = await h.waitForDone(res.data.queueName, 10000);
  await sleep(300);
  const o = await ttls(h, res.data.queueName, res.data.batchId);
  const pass = done?.cStatus === 'F' && okDone(o, true);
  await h.teardown();
  return verdict('X8a', pass, `final=${done?.cStatus} ${done?.nCompleted}/${done?.nTotal}/${done?.nFailed} TTLs: ${fmt(o)} (expected all ~900)`);
}

async function afterCancel() {
  const h = new HarnessV2({ label: 'X8b' });
  await h.flush();
  h.db.getfiles = () => makeFiles(60, 'x8b');
  h.scan = { delayMs: 60, result: (f) => f.nBundledetailid !== 'x8b-00002' };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '3' });
  const body = bodyFor({ nSectionid: 'S-X8b', nBundleid: 'B' });
  const res = await s.gen.starthyperlink(body, false);
  await sleep(400);
  const inflight = h.scanCalls.filter(c => !c.tEnd).length;
  const cres = await s.gen.cancelhyperlink({ nCaseid: body.nCaseid, nSectionid: body.nSectionid, nBundleid: body.nBundleid } as any);
  const right = await ttls(h, res.data.queueName, res.data.batchId);
  await sleep(1200);                                        // in-flight scans finish and run their accounting
  const later = await ttls(h, res.data.queueName, res.data.batchId);
  const snap = await h.snapshot(res.data.queueName);
  const pass = cres.msg === 1 && snap?.cStatus === 'X' && okDone(right, true) && okDone(later, true);
  await h.teardown();
  return verdict('X8b', pass, `cancel=${cres.msg} inFlightAtCancel=${inflight} final=${snap?.cStatus} ${snap?.nCompleted}/${snap?.nTotal} TTLs right after cancel: ${fmt(right)} | 1.2 s later: ${fmt(later)} (expected all ~900)`);
}

async function lateDuplicate() {
  const h = new HarnessV2({ label: 'X8c' });
  await h.flush();
  const files = makeFiles(4, 'x8c');
  h.db.getfiles = () => files;
  h.scan = { delayMs: 10, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '3' });
  const res = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-X8c', nBundleid: 'B' }), false);
  const done = await h.waitForDone(res.data.queueName, 10000);
  await sleep(300);
  const before = await ttls(h, res.data.queueName, res.data.batchId);
  // a stalled re-run of a job of the same run arriving after the finalize
  const run = await h.redis.hget(`HYPERLINK-BATCH/${res.data.batchId}`, 'run');
  const base = s.batch.baseOf(res.data); base.batchId = res.data.batchId;
  await s.fq.add({ batchId: res.data.batchId, run, progressKey: res.data.queueName, file: files[1], jobData: base, searchTermsPath: '' }, { removeOnComplete: true, removeOnFail: true, jobId: `${res.data.batchId}:${run}:late-dup` });
  await sleep(800);
  const after = await ttls(h, res.data.queueName, res.data.batchId);
  const snap = await h.snapshot(res.data.queueName);
  const hash = await h.redis.hgetall(`HYPERLINK-BATCH/${res.data.batchId}`);
  const pass = done?.cStatus === 'C' && okDone(before, false) && okDone(after, false) && Number(hash.done) === 4 && snap?.cStatus === 'C' && snap.nCompleted === 4;
  await h.teardown();
  return verdict('X8c', pass, `final=${done?.cStatus} TTLs after finalize: ${fmt(before)} | after a late duplicate job: ${fmt(after)} hash.done=${hash.done} key=${snap?.cStatus} ${snap?.nCompleted}/${snap?.nTotal} notifications=${h.notifications().length}`);
}
