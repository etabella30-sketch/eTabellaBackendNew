/**
 * Z6 (f) - stale-lock false positives: a batch whose progress key is 100 min
 * old but which is ALIVE must not be released by the stale check -- not for
 * the same scope, not for the whole section, not for one of its files.
 *   Z6a: workers 1, file 1 hangs (Bull active), 11 waiting.
 *   Z6b: same, but the batch's expected set (jobs key) is deleted -> the
 *        stale check must fall back to paging the queue lists.
 *   Z6c: the orchestrator is still inside hyperlink_getfiles (4 s) when the
 *        key is aged: hash.total 0, no file jobs yet -> alive (bundle job
 *        active); afterwards the batch ends C.
 *   Z6d: workers 1 with the hard cap 5: file 1 hangs, 4 jobs parked in the
 *        semaphore (active in Bull, no python), 0 waiting.
 *   Z6e: control: a dead batch (no worker, jobs gone) IS released.
 */
import { HarnessV2, bodyFor, makeFiles, verdict, sleep } from '../../../harness';
import { age } from '../util';

export async function run() { return [await activeHang(), await noExpectedSet(), await orchestratorMidGetfiles(), await parkedInSemaphore(), await deadControl()]; }

async function probe(h: HarnessV2, s: any, body: any, key: string, fileOfBatch: string) {
  const same = await s.gen.starthyperlink(body, false);
  const all = await s.gen.starthyperlink(bodyFor({ nSectionid: body.nSectionid }), false);
  const one = await s.gen.starthyperlink(bodyFor({ nSectionid: body.nSectionid, nBundleid: body.nBundleid, nBundledetailid: fileOfBatch }), false);
  const after = await h.snapshot(key);
  const staleLogs = h.logs.filter(l => /is stale/.test(l)).length + h.consoleLines.filter(l => /is stale/.test(l)).length;
  return { same, all, one, after, staleLogs, ok: same.msg === -1 && all.msg === -1 && one.msg === -1 && after?.cStatus === 'P' && !same.staleReleased && staleLogs === 0 };
}
const fmtProbe = (p: any) => `sameScope=${p.same.msg} wholeSection=${p.all.msg} oneFileOfIt=${p.one.msg} keyAfter=${p.after?.cStatus} staleReleased=${!!p.same.staleReleased} staleLogs=${p.staleLogs}`;

async function activeHang() {
  const h = new HarnessV2({ label: 'Z6a' });
  await h.flush();
  const files = makeFiles(12, 'z6a');
  h.db.getfiles = () => files;
  h.scan = { delayMs: 20, result: (f) => f.nBundledetailid === 'z6a-00001' ? 'hang' : true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '1' });
  const body = bodyFor({ nSectionid: 'S-Z6a', nBundleid: 'B' });
  const r = await s.gen.starthyperlink(body, false);
  await sleep(700);
  await age(h, r.data.queueName, 100);
  const counts = await h.counts(s.fq);
  const p = await probe(h, s, body, r.data.queueName, 'z6a-00005');
  const numbers = `alive: 1 hung active, queue=w${counts.waiting}/a${counts.active}, dUpdate 100 min old -> ${fmtProbe(p)}`;
  await h.teardown();
  return verdict('Z6a', p.ok, numbers);
}

async function noExpectedSet() {
  const h = new HarnessV2({ label: 'Z6b' });
  await h.flush();
  const files = makeFiles(12, 'z6b');
  h.db.getfiles = () => files;
  h.scan = { delayMs: 20, result: (f) => f.nBundledetailid === 'z6b-00001' ? 'hang' : true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '1' });
  const body = bodyFor({ nSectionid: 'S-Z6b', nBundleid: 'B' });
  const r = await s.gen.starthyperlink(body, false);
  await sleep(700);
  await age(h, r.data.queueName, 100);
  const delJobs = await h.redis.del(`HYPERLINK-BATCH/${r.data.batchId}/jobs`);
  const counts = await h.counts(s.fq);
  const p = await probe(h, s, body, r.data.queueName, 'z6b-00005');
  const numbers = `alive, expected set deleted (${delJobs}), queue=w${counts.waiting}/a${counts.active}, dUpdate 100 min old -> ${fmtProbe(p)}`;
  await h.teardown();
  return verdict('Z6b', p.ok, numbers);
}

async function orchestratorMidGetfiles() {
  const h = new HarnessV2({ label: 'Z6c' });
  await h.flush();
  const files = makeFiles(6, 'z6c');
  h.db.getfiles = async () => { await sleep(4000); return files; };
  h.scan = { delayMs: 20, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '3' });
  const body = bodyFor({ nSectionid: 'S-Z6c', nBundleid: 'B' });
  const r = await s.gen.starthyperlink(body, false);
  await sleep(800);
  await age(h, r.data.queueName, 100);
  const bq = await h.counts(s.bq);
  const hash = await h.redis.hgetall(`HYPERLINK-BATCH/${r.data.batchId}`);
  const p = await probe(h, s, body, r.data.queueName, 'z6c-00002');
  const done = await h.waitForDone(r.data.queueName, 20000);
  const notif = h.notifications().length;
  const pass = p.ok && done?.cStatus === 'C' && done.nCompleted === 6 && notif === 1;
  const numbers = `orchestrator inside getfiles (bundle queue a${bq.active}/w${bq.waiting}, hash.total=${hash.total || 0}), dUpdate 100 min old -> ${fmtProbe(p)} | then final=${done?.cStatus} ${done?.nCompleted}/${done?.nTotal} notifications=${notif}`;
  await h.teardown();
  return verdict('Z6c', pass, numbers);
}

async function parkedInSemaphore() {
  const h = new HarnessV2({ label: 'Z6d' });
  await h.flush();
  const files = makeFiles(5, 'z6d');
  h.db.getfiles = () => files;
  h.scan = { delayMs: 20, result: (f) => f.nBundledetailid === 'z6d-00001' ? 'hang' : true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '1' });
  const body = bodyFor({ nSectionid: 'S-Z6d', nBundleid: 'B' });
  const r = await s.gen.starthyperlink(body, false);
  await sleep(700);
  await age(h, r.data.queueName, 100);
  const counts = await h.counts(s.fq);
  const scanning = h.scanCalls.filter(c => !c.tEnd).length;
  const p = await probe(h, s, body, r.data.queueName, 'z6d-00003');
  const pass = p.ok && counts.active === 5 && counts.waiting === 0 && scanning === 1;
  const numbers = `1 hung python, ${counts.active - scanning} parked in the semaphore, queue=w${counts.waiting}/a${counts.active}, dUpdate 100 min old -> ${fmtProbe(p)}`;
  await h.teardown();
  return verdict('Z6d', pass, numbers);
}

async function deadControl() {
  const h = new HarnessV2({ label: 'Z6e' });
  await h.flush();
  h.db.getfiles = () => makeFiles(4, 'z6e');
  h.scan = { delayMs: 20, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '1' });
  const body = bodyFor({ nSectionid: 'S-Z6e', nBundleid: 'B' });
  // a dead batch: 'P' key + hash 1/4 counted, expected set of 4, no job anywhere
  const key = s.batch.progressKeyFor(body), batchId = s.batch.batchIdFor(body);
  const snap = { ...body, queueName: key, batchId, nTotal: 4, nCompleted: 1, nFailed: 0, cStatus: 'P', dStart: new Date().toISOString(), dUpdate: new Date().toISOString(), jFailed: [] };
  await h.redis.set(key, JSON.stringify(snap), 'EX', 172800);
  await h.redis.hmset(`HYPERLINK-BATCH/${batchId}`, { total: '4', done: '1', failed: '0', cancelled: '0', owner: key, run: 'deadrun', enqueued: '1', enqueueDone: '1' });
  await h.redis.sadd(`HYPERLINK-BATCH/${batchId}/jobs`, 'z6e-00001', 'z6e-00002', 'z6e-00003', 'z6e-00004');
  await h.redis.sadd(`HYPERLINK-BATCH/${batchId}/seen`, 'z6e-00001');
  await age(h, key, 100);
  const r = await s.gen.starthyperlink(body, false);
  const done = r.msg === 1 ? await h.waitForDone(key, 15000) : null;
  const pass = r.msg === 1 && !!r.staleReleased && done?.cStatus === 'C' && done.nCompleted === 4;
  const numbers = `dead batch (no worker ever saw it, hash 1/4, no jobs) 100 min old -> start msg=${r.msg} staleReleased=${!!r.staleReleased} newBatch=${done?.cStatus} ${done?.nCompleted}/${done?.nTotal}`;
  await h.teardown();
  return verdict('Z6e', pass, numbers);
}
