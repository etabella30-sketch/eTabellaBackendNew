/**
 * A14 - Owner decision D7.
 *  (a) late accounting after finalize / after cancel never extends the TTLs
 *      (every batch key keeps the done TTL <= HYPERLINK_DONE_TTL_SEC); after
 *      a finalize the terminal snapshot is never rewritten; after a cancel
 *      (round 3) the X snapshot keeps its status and TTL but takes the hash's
 *      counters, so the popup shows the files that finished after the cancel.
 *  (b) the stale check treats a still-queued orchestrator job as alive: a 'P'
 *      key 3 h old whose bundle job is waiting on hyperlink-queue is NOT
 *      released; once that job is gone the same start releases it.
 *  (c) the orchestrator's first snapshot never overwrites a terminal one: the
 *      batch is cancelled while the orchestrator is inside getfiles; when it
 *      resumes the key stays X with nTotal 0, no file job is added, no scan
 *      runs; a direct guarded write against the X key is refused.
 */
import { HarnessV2, bodyFor, makeFiles, verdict, sleep } from '../harness';

const DONE_TTL = 900;

async function ttls(h: HarnessV2, key: string, batchId: string) {
  const names = { key, hash: `HYPERLINK-BATCH/${batchId}`, seen: `HYPERLINK-BATCH/${batchId}/seen`, failed: `HYPERLINK-BATCH/${batchId}/failed`, jobs: `HYPERLINK-BATCH/${batchId}/jobs` };
  const o: Record<string, number> = {};
  for (const [k, v] of Object.entries(names)) o[k] = await h.redis.ttl(v);
  return o;
}
const fmt = (o: Record<string, number>) => Object.entries(o).map(([k, v]) => `${k}=${v}`).join(' ');
/** every existing key has a positive TTL <= the done TTL */
const doneTtls = (o: Record<string, number>) => Object.values(o).every(v => v === -2 || (v > 0 && v <= DONE_TTL));

export async function run() {
  const a = await lateAccounting();
  const b = await staleVsQueuedOrchestrator();
  const c = await snapshotGuard();
  return verdict('A14', a.pass && b.pass && c.pass, `${a.numbers} || ${b.numbers} || ${c.numbers}`);
}

async function lateAccounting() {
  const h = new HarnessV2({ label: 'A14a' });
  await h.flush();
  h.db.getfiles = (q) => q.nBundleid === 'B' ? makeFiles(3, 'a14a') : makeFiles(40, 'a14x');
  h.scan = { delayMs: (f) => f.nBundledetailid.startsWith('a14x') ? 100 : 10, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '3', HYPERLINK_DONE_TTL_SEC: String(DONE_TTL) });
  const late = (batchId: string, run: string, key: string, base: any, id: string) =>
    s.batch.account(batchId, run, key, base, { nBundledetailid: id, cFilename: `${id}.pdf`, cPath: 'x' }, 'C').then(acc => s.batch.afterAccount(acc, batchId, key).then(() => acc));

  // after finalize
  const r = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-A14a', nBundleid: 'B' }), false);
  const key = r.data.queueName, batchId = r.data.batchId;
  const done = await h.waitForDone(key, 10000);
  await sleep(300);
  const t0 = await ttls(h, key, batchId);
  const hash0 = await h.redis.hgetall(`HYPERLINK-BATCH/${batchId}`);
  const raw0 = await h.redis.get(key);
  const notif0 = h.notifications().length;
  const acc = await late(batchId, hash0.run, key, s.batch.baseOf({ ...r.data, batchId }), 'late-1');
  const t1 = await ttls(h, key, batchId);
  const raw1 = await h.redis.get(key);
  const hash1 = await h.redis.hgetall(`HYPERLINK-BATCH/${batchId}`);

  // after cancel (in-flight scans finish and account after the X snapshot)
  const rX = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-A14a', nBundleid: 'X' }), false);
  const keyX = rX.data.queueName, batchX = rX.data.batchId;
  await sleep(350);
  const c = await s.gen.cancelhyperlink({ nCaseid: 'c1', nSectionid: 'S-A14a', nBundleid: 'X' } as any);
  const inFlight = h.scanCalls.filter(x => x.batchId === batchX && !x.tEnd).length;
  await h.waitFor(() => h.scanCalls.filter(x => x.batchId === batchX).every(x => !!x.tEnd), 5000);
  await sleep(400);
  const tx0 = await ttls(h, keyX, batchX);
  const rawX0 = await h.redis.get(keyX);
  const hashX = await h.redis.hgetall(`HYPERLINK-BATCH/${batchX}`);
  const accX = await late(batchX, hashX.run, keyX, s.batch.baseOf({ ...rX.data, batchId: batchX }), 'late-2');
  const tx1 = await ttls(h, keyX, batchX);
  const rawX1 = await h.redis.get(keyX);
  const notif1 = h.notifications().length;
  const snapX1 = JSON.parse(rawX1 || '{}');
  const hashX1 = await h.redis.hgetall(`HYPERLINK-BATCH/${batchX}`);
  // X: status / TTL kept, counters follow the hash (the late file is now counted)
  const xConsistent = snapX1.cStatus === 'X' && snapX1.nCompleted === Number(hashX1.done) && snapX1.nFailed === Number(hashX1.failed) && tx1.key <= tx0.key;

  const pass = done?.cStatus === 'C' && doneTtls(t0) && doneTtls(t1) && acc.counted === 1 && !acc.fin && raw1 === raw0 && Number(hash1.done) === 4
    && c.msg === 1 && JSON.parse(rawX0 || '{}').cStatus === 'X' && doneTtls(tx0) && doneTtls(tx1) && accX.counted === 1 && !accX.fin && xConsistent
    && notif1 === notif0 + 1;   // only the cancel notification was added
  const numbers = `(a) finalized C: TTLs ${fmt(t0)} -> late account counted=${acc.counted} fin=${acc.fin}: ${fmt(t1)} snapshotUnchanged=${raw1 === raw0} hash.done=${hash1.done} `
    + `| cancelled (inFlight=${inFlight}) key=${JSON.parse(rawX0 || '{}').cStatus}: ${fmt(tx0)} -> late account: ${fmt(tx1)} keyStill=${snapX1.cStatus} counters=${snapX1.nCompleted}/${snapX1.nFailed} hash=${hashX1.done}/${hashX1.failed} (X snapshot follows the hash: ${xConsistent}) notifications=${notif1}`;
  await h.teardown();
  return { pass, numbers };
}

async function staleVsQueuedOrchestrator() {
  const h = new HarnessV2({ label: 'A14b' });
  await h.flush();
  h.db.getfiles = () => makeFiles(5, 'a14b');
  const s = await h.stack('idle', { HYPERLINK_STALE_MIN: '90' }, { noWorkers: true });   // no processor: the bundle job stays queued
  const body = bodyFor({ nSectionid: 'S-A14b', nBundleid: 'B' });
  const r1 = await s.gen.starthyperlink(body, false);
  const key = r1.data.queueName;
  const old = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
  const snap = await h.snapshot(key);
  const keyTtl = await h.redis.ttl(key);
  await h.redis.set(key, JSON.stringify({ ...snap, dStart: old, dUpdate: old }), 'EX', keyTtl > 0 ? keyTtl : 172800);
  const queued = (await h.counts(s.bq)).waiting;
  const r2 = await s.gen.starthyperlink(body, false);                 // orchestrator job still queued -> alive
  const keyAfter = await h.snapshot(key);
  for (const j of await s.bq.getJobs(['waiting', 'delayed', 'paused'])) { try { await j.remove(); } catch { /* */ } }
  const r3 = await s.gen.starthyperlink(body, false);                 // job gone -> stale -> released
  const pass = r1.msg === 1 && queued === 1 && r2.msg === -1 && !r2.staleReleased && keyAfter?.cStatus === 'P' && r3.msg === 1 && r3.staleReleased === true;
  const numbers = `(b) 3h-old 'P' key, bundle job queued=${queued}: start -> msg=${r2.msg} "${r2.value}" keyStill=${keyAfter?.cStatus} | job removed: start -> msg=${r3.msg} staleReleased=${r3.staleReleased}`;
  await h.teardown();
  return { pass, numbers };
}

async function snapshotGuard() {
  const h = new HarnessV2({ label: 'A14c' });
  await h.flush();
  h.db.getfiles = async () => { await sleep(600); return makeFiles(10, 'a14c'); };
  h.scan = { delayMs: 10, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '3' });
  const body = bodyFor({ nSectionid: 'S-A14c', nBundleid: 'B' });
  const r = await s.gen.starthyperlink(body, false);
  const key = r.data.queueName, batchId = r.data.batchId;
  await sleep(150);
  const c = await s.gen.cancelhyperlink({ nCaseid: 'c1', nSectionid: 'S-A14c', nBundleid: 'B' } as any);
  await h.waitFor(() => h.getfilesCalls >= 1, 3000);
  await h.waitFor(async () => { const b = await h.counts(s.bq); return b.active + b.waiting === 0; }, 5000);
  await sleep(400);
  const snap = await h.snapshot(key);
  const hash = await h.redis.hgetall(`HYPERLINK-BATCH/${batchId}`);
  const counts = await h.counts(s.fq);
  const emits = h.responces(key).map(e => e.data.data.cStatus);
  const lastEmit = emits[emits.length - 1];
  const pAfterX = emits.slice(emits.indexOf('X') + 1).filter(x => x === 'P').length;
  // a direct guarded write against the terminal key is refused
  const wrote = await s.batch.writeSnapshotIfRunning({ ...(snap as any), cStatus: 'P', nTotal: 99 }, 172800, true, hash.run);
  const snapAfter = await h.snapshot(key);
  const errors = h.logs.filter(l => /Error in hyperlink batch/.test(l)).length;
  const pass = c.msg === 1 && snap?.cStatus === 'X' && snap.nTotal === 0 && Number(hash.total || 0) === 0 && counts.waiting + counts.active + counts.delayed === 0
    && h.scanCalls.length === 0 && lastEmit === 'X' && pAfterX === 0 && wrote === false && snapAfter?.cStatus === 'X' && snapAfter.nTotal === 0 && errors === 0;
  const numbers = `(c) cancel@150ms during getfiles(600ms) msg=${c.msg} -> after the orchestrator resumed: key=${snap?.cStatus} nTotal=${snap?.nTotal} hash.total=${hash.total} enqueued=${hash.enqueued || 0} fileJobs=${counts.waiting + counts.active} scans=${h.scanCalls.length} `
    + `emits=[${emits.join(',')}] P-after-X=${pAfterX} guardedWriteOnTerminalKey=${wrote} keyAfter=${snapAfter?.cStatus}/${snapAfter?.nTotal} orchestratorErrors=${errors}`;
  await h.teardown();
  return { pass, numbers };
}
