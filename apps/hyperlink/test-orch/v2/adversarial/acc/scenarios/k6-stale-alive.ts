/**
 * K6 (f) - stale-lock false positives with a BUSY queue.
 *   K6a: a foreign bundle Z (other section) holds 5,500 waiting jobs AHEAD of
 *        batch A (300 files) and every python hangs (5 active = Z's). A's
 *        key is 100 min old, hash 0/300, its 300 jobs sit beyond the 5,000
 *        jobs the stale check pages through. Starting A again must be
 *        REFUSED (A is alive, merely queued behind Z). Also measures how
 *        long the check takes (it runs under the section mutex).
 *   K6b: the same busy queue but A has one hung ACTIVE file and the rest
 *        waiting right behind the active ones (A added first): refused.
 *   K6c: informational -- a truly DEAD batch (no jobs anywhere) while the
 *        foreign 5,500 jobs are still queued: does the conservative branch
 *        keep the dead lock (restart refused until the queue drains)?
 */
import { HarnessV2, bodyFor, makeFiles, now, verdict, sleep } from '../../../harness';

const OLD = () => new Date(Date.now() - 100 * 60 * 1000).toISOString();
async function ageKey(h: HarnessV2, key: string) {
  const snap = await h.snapshot(key);
  const ttl = await h.redis.ttl(key);
  snap.dUpdate = OLD(); snap.dStart = OLD();
  await h.redis.set(key, JSON.stringify(snap), 'EX', ttl > 0 ? ttl : 172800);
  return snap;
}

export async function run() {
  return [await queuedBehindForeign(), await activeAndQueued(), await deadWithBusyQueue()];
}

async function queuedBehindForeign() {
  const h = new HarnessV2({ label: 'K6a' });
  await h.flush();
  h.db.getfiles = (q) => q.nBundleid === 'Z' ? makeFiles(5500, 'z') : makeFiles(300, 'a');
  h.scan = { delayMs: 10, result: 'hang' };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '5', HYPERLINK_STALE_MIN: '90' });
  const rZ = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-K6z', nBundleid: 'Z' }), false);
  await h.waitFor(async () => (await h.redis.hget(`HYPERLINK-BATCH/${rZ.data.batchId}`, 'enqueueDone')) === '1', 20000, 100);
  const rA = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-K6a', nBundleid: 'A' }), false);
  await h.waitFor(async () => (await h.redis.hget(`HYPERLINK-BATCH/${rA.data.batchId}`, 'enqueueDone')) === '1', 20000, 100);
  await sleep(300);
  const snap = await ageKey(h, rA.data.queueName);
  const counts = await h.counts(s.fq);
  const t0 = now();
  const r2 = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-K6a', nBundleid: 'A' }), false);
  const took = now() - t0;
  const after = await h.snapshot(rA.data.queueName);
  const conservative = h.logs.filter(l => /> 5000 jobs queued, keeping the lock/.test(l)).length;
  const pass = r2.msg === -1 && after?.cStatus === 'P' && !r2.staleReleased && rZ.msg === 1 && rA.msg === 1;
  const numbers = `Z=5500 jobs ahead, A=300 queued behind, all pythons hung: queue=w${counts.waiting}/a${counts.active}; A key ${snap.nCompleted}/${snap.nTotal} dUpdate=100min old -> start A again msg=${r2.msg} "${r2.value}" staleReleased=${!!r2.staleReleased} keyAfter=${after?.cStatus} conservativeBranchLogged=${conservative} staleCheckTook=${took}ms`;
  await h.teardown();
  return verdict('K6a', pass, numbers);
}

async function activeAndQueued() {
  const h = new HarnessV2({ label: 'K6b' });
  await h.flush();
  h.db.getfiles = (q) => q.nBundleid === 'Z' ? makeFiles(5500, 'z') : makeFiles(30, 'a');
  h.scan = { delayMs: 10, result: 'hang' };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '1', HYPERLINK_STALE_MIN: '90' });
  const rA = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-K6b', nBundleid: 'A' }), false);
  await h.waitFor(async () => (await h.redis.hget(`HYPERLINK-BATCH/${rA.data.batchId}`, 'enqueueDone')) === '1', 20000, 100);
  const rZ = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-K6z2', nBundleid: 'Z' }), false);
  await h.waitFor(async () => (await h.redis.hget(`HYPERLINK-BATCH/${rZ.data.batchId}`, 'enqueueDone')) === '1', 20000, 100);
  await sleep(300);
  await ageKey(h, rA.data.queueName);
  const counts = await h.counts(s.fq);
  const t0 = now();
  const r2 = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-K6b', nBundleid: 'A' }), false);
  const took = now() - t0;
  const after = await h.snapshot(rA.data.queueName);
  const pass = r2.msg === -1 && after?.cStatus === 'P';
  const numbers = `A: 1 hung active + 25 waiting (Bull cap 5 active), Z=5500 waiting behind; queue=w${counts.waiting}/a${counts.active}; A dUpdate 100min old -> start A again msg=${r2.msg} "${r2.value}" keyAfter=${after?.cStatus} staleCheckTook=${took}ms`;
  await h.teardown();
  return verdict('K6b', pass, numbers);
}

async function deadWithBusyQueue() {
  const h = new HarnessV2({ label: 'K6c' });
  await h.flush();
  h.db.getfiles = (q) => q.nBundleid === 'Z' ? makeFiles(5500, 'z') : makeFiles(10, 'd');
  h.scan = { delayMs: 10, result: 'hang' };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '1', HYPERLINK_STALE_MIN: '90' });
  const rZ = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-K6z3', nBundleid: 'Z' }), false);
  await h.waitFor(async () => (await h.redis.hget(`HYPERLINK-BATCH/${rZ.data.batchId}`, 'enqueueDone')) === '1', 20000, 100);
  // a dead batch D: 'P' key 100 min old, hash 2/10, enqueueDone, but NO job of it anywhere
  const bodyD = bodyFor({ nSectionid: 'S-K6d', nBundleid: 'D' });
  const keyD = s.batch.progressKeyFor(bodyD), idD = s.batch.batchIdFor(bodyD);
  const snapD = { queueName: keyD, nCaseid: 'c1', nSectionid: 'S-K6d', nMasterid: 'm1', nBundledetailid: null, nBundleid: 'D', cType: 'E', cKeeptype: 'R', nTotal: 10, nCompleted: 2, nFailed: 0, cStatus: 'P', isDeepscan: false, isSmartscan: false, batchId: idD, dStart: OLD(), dUpdate: OLD(), jFailed: [], nFailedTruncated: false };
  await h.redis.set(keyD, JSON.stringify(snapD), 'EX', 172800);
  await h.redis.hmset(`HYPERLINK-BATCH/${idD}`, { total: '10', done: '2', failed: '0', cancelled: '0', owner: keyD, run: 'deadrun', dStart: OLD(), enqueued: '1', enqueueDone: '1' });
  const counts = await h.counts(s.fq);
  const t0 = now();
  const r2 = await s.gen.starthyperlink(bodyD, false);
  const took = now() - t0;
  const after = await h.snapshot(keyD);
  // informational: a conservative refusal is a documented limitation, a release is the ideal
  const pass = true;
  const numbers = `INFO: dead batch D (no jobs, 100min old, hash 2/10) with a foreign queue of w${counts.waiting}/a${counts.active} -> restart D msg=${r2.msg} "${r2.value}" staleReleased=${!!r2.staleReleased} keyAfter=${after?.cStatus} took=${took}ms ${r2.msg === -1 ? '(dead lock KEPT until the foreign queue drains below 5000 jobs)' : '(released)'}`;
  await h.teardown();
  return verdict('K6c', pass, numbers);
}
