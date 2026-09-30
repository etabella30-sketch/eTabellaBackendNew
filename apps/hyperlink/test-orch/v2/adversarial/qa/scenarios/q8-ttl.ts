/**
 * Q8 (h) - TTL of the progress key / batch keys.
 *   Q8a finalize (with one failure): while running the key has the batch TTL
 *       (> 900); after finalize key/hash/seen/failed are within the done TTL
 *       (0 < ttl <= 900). Then two late arrivals must NOT refresh them nor
 *       rewrite the key: a re-queued file job of the same run (stalled re-run)
 *       and a Bull 'failed' event ("stalled more than allowable limit") for an
 *       already counted file.
 *   Q8b cancel with in-flight scans: key/hash/seen within the done TTL right
 *       after the cancel and after the in-flight files ended.
 *   Q8c cancel BEFORE the orchestrator ran; then the orchestrator runs: key
 *       stays X within the done TTL.
 *   Q8d orchestrator failure (getfiles throws): key/hash within the done TTL.
 */
import { HarnessV2, bodyFor, makeFiles, verdict, sleep } from '../../../harness';

const DONE = 900;
const within = (t: number) => t > 0 && t <= DONE;

export async function run() {
  return [await afterFinalize(), await afterCancel(), await cancelBeforeOrchestrator(), await orchestratorFailure()];
}

async function ttls(h: HarnessV2, key: string, batchId: string) {
  const [k, hash, seen, failed] = await Promise.all([h.redis.ttl(key), h.redis.ttl(`HYPERLINK-BATCH/${batchId}`), h.redis.ttl(`HYPERLINK-BATCH/${batchId}/seen`), h.redis.ttl(`HYPERLINK-BATCH/${batchId}/failed`)]);
  return { k, hash, seen, failed, str: `key=${k} hash=${hash} seen=${seen} failed=${failed}` };
}

async function afterFinalize() {
  const N = 6;
  const h = new HarnessV2({ label: 'Q8a' });
  await h.flush();
  const files = makeFiles(N, 'q8a');
  h.db.getfiles = () => files;
  h.scan = { delayMs: 150, result: (f) => f.nBundledetailid === files[2].nBundledetailid ? false : true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '1' });
  const r = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-Q8a', nBundleid: 'B' }), false);
  const key = r.data.queueName, batchId = r.data.batchId;
  await sleep(400);
  const running = await ttls(h, key, batchId);
  const done = await h.waitForDone(key, 15000);
  await sleep(300);
  const t1 = await ttls(h, key, batchId);
  const hash = await h.redis.hgetall(`HYPERLINK-BATCH/${batchId}`);
  const notif1 = h.notifications().length;
  // late arrival 1: a re-queued job of the same run (what a stalled re-run looks like)
  const late = { batchId, run: hash.run, progressKey: key, file: files[0], jobData: s.batch.baseOf({ ...r.data, batchId }), searchTermsPath: '' };
  await s.fq.add(late, { jobId: `${batchId}:${hash.run}:${files[0].nBundledetailid}`, removeOnComplete: true, removeOnFail: true, attempts: 2 });
  await h.waitFor(async () => { const c = await h.counts(s.fq); return c.waiting + c.active + c.delayed === 0; }, 5000);
  await sleep(300);
  const t2 = await ttls(h, key, batchId);
  const snap2 = await h.snapshot(key);
  // late arrival 2: Bull fails an already counted job for good (stalled more than allowable limit)
  (s.fq as any).emit('failed', { id: `${batchId}:${hash.run}:${files[1].nBundledetailid}`, data: { ...late, file: files[1] }, opts: { attempts: 2 }, attemptsMade: 0 }, new Error('job stalled more than allowable limit'));
  await sleep(500);
  const t3 = await ttls(h, key, batchId);
  const snap3 = await h.snapshot(key);
  const hash3 = await h.redis.hgetall(`HYPERLINK-BATCH/${batchId}`);
  const notif = h.notifications().length;
  const lateScans = h.scanCalls.filter(c => c.nBundledetailid === files[0].nBundledetailid).length;
  const pass = running.k > DONE && done?.cStatus === 'F' && within(t1.k) && within(t1.hash) && within(t1.seen) && within(t1.failed)
    && within(t2.k) && within(t2.hash) && within(t2.seen) && within(t2.failed) && snap2?.cStatus === 'F' && snap2.nCompleted === N - 1
    && within(t3.k) && within(t3.hash) && within(t3.seen) && within(t3.failed) && snap3?.cStatus === 'F' && snap3.nCompleted === N - 1 && snap3.nFailed === 1
    && hash3.done === String(N - 1) && hash3.failed === '1' && notif === 1 && notif1 === 1;
  const numbers = `running: key ttl=${running.k} (batch TTL) | finalize ${done?.cStatus} ${done?.nCompleted}/${done?.nTotal}/${done?.nFailed}: ${t1.str} | after a re-queued job of the same run (scanned ${lateScans}x): ${t2.str} key=${snap2?.cStatus} ${snap2?.nCompleted}/${snap2?.nFailed} `
    + `| after Bull 'stalled more than allowable limit' for a counted file: ${t3.str} key=${snap3?.cStatus} ${snap3?.nCompleted}/${snap3?.nFailed} hash=${hash3.done}+${hash3.failed} notifications=${notif}`;
  await h.teardown();
  return verdict('Q8a', pass, numbers);
}

async function afterCancel() {
  const N = 40;
  const h = new HarnessV2({ label: 'Q8b' });
  await h.flush();
  const files = makeFiles(N, 'q8b');
  h.db.getfiles = () => files;
  h.scan = { delayMs: 600, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '3' });
  const r = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-Q8b', nBundleid: 'B' }), false);
  const key = r.data.queueName, batchId = r.data.batchId;
  await h.waitFor(() => h.scanCalls.length >= 3, 5000);
  const c = await s.gen.cancelhyperlink({ nCaseid: 'c1', nSectionid: 'S-Q8b', nBundleid: 'B' } as any);
  const inFlight = h.scanCalls.filter(x => !x.tEnd).length;
  const t1 = await ttls(h, key, batchId);
  await h.waitFor(() => h.scanCalls.every(x => !!x.tEnd), 5000);
  await sleep(400);
  const t2 = await ttls(h, key, batchId);
  const snap = await h.snapshot(key);
  const hash = await h.redis.hgetall(`HYPERLINK-BATCH/${batchId}`);
  // right after the cancel nothing has been counted yet: seen/failed may not exist (-2)
  const okOrAbsent = (t: number) => t === -2 || within(t);
  const pass = c.msg === 1 && within(t1.k) && within(t1.hash) && okOrAbsent(t1.seen) && within(t2.k) && within(t2.hash) && within(t2.seen) && okOrAbsent(t2.failed) && snap?.cStatus === 'X';
  const numbers = `cancel msg=${c.msg} inFlight=${inFlight}: ${t1.str} | after the in-flight files ended: ${t2.str} key=${snap?.cStatus} ${snap?.nCompleted}/${snap?.nTotal} hash.done=${hash.done} (in-flight counted for the record, key not rewritten)`;
  await h.teardown();
  return verdict('Q8b', pass, numbers);
}

async function cancelBeforeOrchestrator() {
  const h = new HarnessV2({ label: 'Q8c' });
  await h.flush();
  h.db.getfiles = () => makeFiles(5, 'q8c');
  h.scan = { delayMs: 10, result: true };
  const s0 = await h.stack('idle', { HYPERLINK_WORKERS: '3' }, { noWorkers: true });
  const r = await s0.gen.starthyperlink(bodyFor({ nSectionid: 'S-Q8c', nBundleid: 'B' }), false);
  const key = r.data.queueName, batchId = r.data.batchId;
  const c = await s0.gen.cancelhyperlink({ nCaseid: 'c1', nSectionid: 'S-Q8c', nBundleid: 'B' } as any);
  const t1 = await ttls(h, key, batchId);
  const s1 = await h.stack('w1', { HYPERLINK_WORKERS: '3' });   // now the orchestrator job runs
  await h.waitFor(async () => (await h.counts(s1.bq)).waiting + (await h.counts(s1.bq)).active === 0, 5000);
  await sleep(400);
  const t2 = await ttls(h, key, batchId);
  const snap = await h.snapshot(key);
  const counts = await h.counts(s1.fq);
  const pass = c.msg === 1 && within(t1.k) && within(t1.hash) && within(t2.k) && within(t2.hash) && snap?.cStatus === 'X' && snap.nTotal === 0 && counts.waiting + counts.active === 0 && h.scanCalls.length === 0;
  const numbers = `cancel before orchestrator msg=${c.msg}: ${t1.str} | after the orchestrator ran: ${t2.str} key=${snap?.cStatus} nTotal=${snap?.nTotal} fileJobsAdded=${counts.waiting + counts.active} scans=${h.scanCalls.length}`;
  await h.teardown();
  return verdict('Q8c', pass, numbers);
}

async function orchestratorFailure() {
  const h = new HarnessV2({ label: 'Q8d' });
  await h.flush();
  h.db.getfiles = () => { throw new Error('getfiles boom'); };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '3' });
  const r = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-Q8d', nBundleid: 'B' }), false);
  const key = r.data.queueName, batchId = r.data.batchId;
  const done = await h.waitForDone(key, 5000);
  await sleep(200);
  const t = await ttls(h, key, batchId);
  const pass = done?.cStatus === 'F' && within(t.k) && within(t.hash) && h.notifications().length === 1;
  const numbers = `getfiles throws -> key=${done?.cStatus} reason="${done?.jFailed?.[0]?.cReason}": ${t.str} notifications=${h.notifications().length}`;
  await h.teardown();
  return verdict('Q8d', pass, numbers);
}
