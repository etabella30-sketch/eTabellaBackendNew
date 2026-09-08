/**
 * X6 (f) - stale-lock false positives. A batch that is slow but ALIVE must
 * not be released by the stale check.
 *   X6a: workers 1, file 1 hangs (in flight = Bull 'active'), 7 files waiting;
 *        the progress key's dUpdate is rewritten to 100 min ago -> the same
 *        scope started again must be rejected.
 *   X6b: the only remaining file job is in Bull 'delayed' (spawn failure with
 *        a 60 s backoff) and dUpdate is 100 min old -> rejected.
 *   X6c: 5 hung jobs fill the hard cap (active), dUpdate old -> rejected.
 *   X6d: the orchestrator job has NOT run yet (bundle queue has no worker),
 *        hash.total == 0, no file jobs, dUpdate 100 min old -> the batch is
 *        not dead (its orchestrator job is still queued): rejected?
 */
import { HarnessV2, bodyFor, makeFiles, verdict, sleep } from '../../harness';

const OLD = () => new Date(Date.now() - 100 * 60 * 1000).toISOString();

async function ageKey(h: HarnessV2, key: string) {
  const snap = await h.snapshot(key);
  snap.dUpdate = OLD(); snap.dStart = OLD();
  await h.redis.set(key, JSON.stringify(snap), 'KEEPTTL' as any).catch(async () => { await h.redis.set(key, JSON.stringify(snap)); });
  return snap;
}

export async function run() {
  return [await activeHang(), await delayedOnly(), await capFull(), await orchestratorNotRun()];
}

async function activeHang() {
  const h = new HarnessV2({ label: 'X6a' });
  await h.flush();
  const files = makeFiles(8, 'x6a');
  h.db.getfiles = () => files;
  h.scan = { delayMs: 30, result: (f) => f.nBundledetailid === 'x6a-00001' ? 'hang' : true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '1', HYPERLINK_STALE_MIN: '90' });
  const body = bodyFor({ nSectionid: 'S-X6a', nBundleid: 'B' });
  const r1 = await s.gen.starthyperlink(body, false);
  await sleep(700);
  const snap = await ageKey(h, r1.data.queueName);
  const counts = await h.counts(s.fq);
  const r2 = await s.gen.starthyperlink(body, false);
  const after = await h.snapshot(r1.data.queueName);
  const pass = r2.msg === -1 && after?.cStatus === 'P' && !r2.staleReleased;
  const numbers = `alive batch ${snap.nCompleted}/${snap.nTotal} dUpdate=100min old, queue=w${counts.waiting}/a${counts.active}/d${counts.delayed} -> start again msg=${r2.msg} "${r2.value}" staleReleased=${!!r2.staleReleased} keyAfter=${after?.cStatus}`;
  await h.teardown();
  return verdict('X6a', pass, numbers);
}

async function delayedOnly() {
  const h = new HarnessV2({ label: 'X6b' });
  await h.flush();
  const files = makeFiles(4, 'x6b');
  h.db.getfiles = () => files;
  h.scan = { delayMs: 10, result: (f, callNo) => (f.nBundledetailid === 'x6b-00004' && callNo === 1) ? 'throw' : true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '1', HYPERLINK_STALE_MIN: '90', HYPERLINK_FILE_BACKOFF_MS: '60000' });
  const body = bodyFor({ nSectionid: 'S-X6b', nBundleid: 'B' });
  const r1 = await s.gen.starthyperlink(body, false);
  const delayed = await h.waitFor(async () => { const c = await h.counts(s.fq); return c.delayed === 1 && c.active + c.waiting === 0; }, 5000);
  const snap = await ageKey(h, r1.data.queueName);
  const counts = await h.counts(s.fq);
  const r2 = await s.gen.starthyperlink(body, false);
  const after = await h.snapshot(r1.data.queueName);
  const pass = delayed >= 0 && r2.msg === -1 && after?.cStatus === 'P';
  const numbers = `batch ${snap.nCompleted}/${snap.nTotal}, last job delayed (backoff 60 s), queue=w${counts.waiting}/a${counts.active}/d${counts.delayed} -> start again msg=${r2.msg} "${r2.value}" keyAfter=${after?.cStatus}`;
  await h.teardown();
  return verdict('X6b', pass, numbers);
}

async function capFull() {
  const h = new HarnessV2({ label: 'X6c' });
  await h.flush();
  const files = makeFiles(6, 'x6c');
  h.db.getfiles = () => files;
  h.scan = { delayMs: 10, result: 'hang' };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '5', HYPERLINK_STALE_MIN: '90' });
  const body = bodyFor({ nSectionid: 'S-X6c', nBundleid: 'B' });
  const r1 = await s.gen.starthyperlink(body, false);
  await sleep(700);
  await ageKey(h, r1.data.queueName);
  const counts = await h.counts(s.fq);
  const r2 = await s.gen.starthyperlink(body, false);
  const pass = r2.msg === -1 && counts.active === 5;
  const numbers = `5 hung jobs active, 1 waiting, dUpdate old, queue=w${counts.waiting}/a${counts.active} -> start again msg=${r2.msg} "${r2.value}"`;
  await h.teardown();
  return verdict('X6c', pass, numbers);
}

async function orchestratorNotRun() {
  const h = new HarnessV2({ label: 'X6d' });
  await h.flush();
  h.db.getfiles = () => makeFiles(3, 'x6d');
  h.scan = { delayMs: 10, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '3', HYPERLINK_STALE_MIN: '90' }, { noWorkers: true });
  const body = bodyFor({ nSectionid: 'S-X6d', nBundleid: 'B' });
  const r1 = await s.gen.starthyperlink(body, false);
  await sleep(200);
  await ageKey(h, r1.data.queueName);
  const bq = await h.counts(s.bq);
  const r2 = await s.gen.starthyperlink(body, false);
  const after = await h.snapshot(r1.data.queueName);
  const bq2 = await h.counts(s.bq);
  const pass = r2.msg === -1;
  const numbers = `orchestrator job still waiting (bundle queue w${bq.waiting}), hash.total=0, no file jobs, dUpdate old -> start again msg=${r2.msg} staleReleased=${!!r2.staleReleased} keyAfter=${after?.cStatus} bundleQueueNow=w${bq2.waiting} (two orchestrator jobs for one scope)`;
  await h.teardown();
  return verdict('X6d', pass, numbers);
}
