/**
 * X5 (e) - Bull retry of a file job whose first attempt already counted it.
 *   X5a: 60 files, workers 3; for 6 files batch.account runs for real and THEN
 *        the handler throws (first attempt only). Expect: no double count
 *        (hash done == 60, seen == 60), each of the 6 files scanned at most
 *        twice, one finalize, one notification, status C.
 *   X5b: 1 worker so the order is FIFO; the LAST file's first attempt throws
 *        after accounting (= after the Lua that finalized the batch). Does the
 *        retry still produce the finalize / notification?
 */
import { HarnessV2, bodyFor, makeFiles, verdict, sleep } from '../../harness';

export async function run() {
  return [await midBatch(), await lastFile()];
}

function armAccountThrow(batch: any, ids: Set<string>) {
  const orig = batch.account.bind(batch);
  const thrown = new Set<string>();
  batch.account = async (...args: any[]) => {
    const r = await orig(...args);
    const id = args[4]?.nBundledetailid;
    if (ids.has(id) && !thrown.has(id)) { thrown.add(id); throw new Error(`post-accounting failure for ${id}`); }
    return r;
  };
  return thrown;
}

async function midBatch() {
  const N = 60;
  const h = new HarnessV2({ label: 'X5a' });
  await h.flush();
  const files = makeFiles(N, 'x5a');
  h.db.getfiles = () => files;
  h.scan = { delayMs: 20, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '3' });
  const ids = new Set(files.slice(3, 9).map(f => f.nBundledetailid));
  const thrown = armAccountThrow(s.batch, ids);
  const res = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-X5a', nBundleid: 'B' }), false);
  const done = await h.waitForDone(res.data.queueName, 30000);
  await sleep(800);
  const hash = await h.redis.hgetall(`HYPERLINK-BATCH/${res.data.batchId}`);
  const seen = await h.redis.scard(`HYPERLINK-BATCH/${res.data.batchId}/seen`);
  const sc = h.scanStats(res.data.batchId);
  const scansOfThrowers = [...ids].map(id => h.scanCalls.filter(c => c.nBundledetailid === id).length);
  const finals = h.responces(res.data.queueName).filter(e => e.data.data.cStatus !== 'P').length;
  const notif = h.notifications().length;
  const failedEvents = h.bullEvents.filter(e => e.queue === 'hyperlink-file-queue' && e.event === 'failed').length;
  const pass = done?.cStatus === 'C' && done.nCompleted === N && Number(hash.done) === N && seen === N && sc.distinct === N
    && scansOfThrowers.every(n => n === 1) && sc.totalCalls === N && finals === 1 && notif === 1 && h.regressions(res.data.queueName) === 0;   // fix round 2: the handler retries the post-accounting step itself, no Bull retry / re-scan
  const numbers = `thrownAfterAccount=${thrown.size} bullRetries=${failedEvents} scans=${sc.totalCalls} (distinct ${sc.distinct}, throwers scanned ${scansOfThrowers.join('/')} times) final=${done?.cStatus} ${done?.nCompleted}/${done?.nTotal} `
    + `hash.done=${hash.done} seen=${seen} finalizes=${finals} notifications=${notif} counterDecreases=${h.regressions(res.data.queueName)}`;
  await h.teardown();
  return verdict('X5a', pass, numbers);
}

async function lastFile() {
  const N = 5;
  const h = new HarnessV2({ label: 'X5b' });
  await h.flush();
  const files = makeFiles(N, 'x5b');
  h.db.getfiles = () => files;
  h.scan = { delayMs: 20, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '1' });
  const thrown = armAccountThrow(s.batch, new Set([files[N - 1].nBundledetailid]));
  const res = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-X5b', nBundleid: 'B' }), false);
  const done = await h.waitForDone(res.data.queueName, 15000);
  await sleep(1500);
  const hash = await h.redis.hgetall(`HYPERLINK-BATCH/${res.data.batchId}`);
  const notif = h.notifications().length;
  const finals = h.responces(res.data.queueName).filter(e => e.data.data.cStatus !== 'P').length;
  const lastScans = h.scanCalls.filter(c => c.nBundledetailid === files[N - 1].nBundledetailid).length;
  const pass = done?.cStatus === 'C' && Number(hash.done) === N && notif === 1;
  const numbers = `lastFileThrewAfterAccount=${thrown.size} lastFileScans=${lastScans} key=${done?.cStatus} ${done?.nCompleted}/${done?.nTotal} hash=${hash.done}/${hash.total} finalized=${hash.finalized} finalEmits=${finals} notifications=${notif} (expected 1)`;
  await h.teardown();
  return verdict('X5b', pass, numbers);
}
