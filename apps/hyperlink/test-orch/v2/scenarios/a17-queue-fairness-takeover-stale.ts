/**
 * A17 - Queue-level minors of fix round 3.
 *  (a) FAIR SHARE: two bundles of one section (300 files x 20 ms each,
 *      workers 3, HYPERLINK_FAIR_CHUNK 50) started in the same instant must
 *      interleave: both have done > 0 at the midpoint and B2's first scan
 *      starts long before B1's last one (Bull is FIFO within one priority;
 *      the per-slice priority makes the batches share the workers).
 *  (b) DEAD ORCHESTRATOR TAKEOVER: 600 files, the orchestrator's 2nd addBulk
 *      chunk never returns (process dead), both queues closed; the new
 *      process re-runs the stalled bundle job, finds the enqueue 'inflight'
 *      and takes it over as soon as hash.enqueueAt is older than
 *      HYPERLINK_ENQUEUE_STALE_MS (2 s here) instead of waiting 30 s; only
 *      the files not yet counted are re-added. Final C 600/600, one
 *      notification, queues empty.
 *  (c) STALE CHECK WITH A BUSY QUEUE: a foreign bundle Z holds 5,200 hung /
 *      waiting file jobs; batch A (30 files) is queued behind it with a
 *      100-min-old key -> alive, restart REFUSED; a dead batch D (old key,
 *      hash 2/10, no job anywhere) -> RELEASED and restarted although more
 *      than 5,000 foreign jobs are queued (looked up by its own job ids).
 */
import { HarnessV2, FAST_STALL, bodyFor, makeFiles, now, verdict, sleep } from '../harness';

export async function run() {
  const a = await fairShare();
  const b = await takeover();
  const c = await staleBusy();
  const pass = a.pass && b.pass && c.pass;
  return verdict('A17', pass, `(a) ${a.numbers} || (b) ${b.numbers} || (c) ${c.numbers}`, { a: a.details, b: b.details, c: c.details });
}

async function fairShare() {
  const N = 300, FILE_MS = 20;
  const h = new HarnessV2({ label: 'A17a' });
  await h.flush();
  h.db.getfiles = (q) => makeFiles(N, q.nBundleid === 'B1' ? 'b1' : 'b2');
  h.scan = { delayMs: FILE_MS, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '3', HYPERLINK_FAIR_CHUNK: '50' });
  const [r1, r2] = await Promise.all([
    s.gen.starthyperlink(bodyFor({ nSectionid: 'S-A17a', nBundleid: 'B1' }), false),
    s.gen.starthyperlink(bodyFor({ nSectionid: 'S-A17a', nBundleid: 'B2' }), false),
  ]);
  const k1 = r1.data.queueName, k2 = r2.data.queueName, id1 = r1.data.batchId, id2 = r2.data.batchId;
  const t0 = now();
  // midpoint: half of all scans done
  await h.waitFor(() => h.scanCalls.filter(c => !!c.tEnd).length >= N, 60000, 20);
  const doneMid = { b1: Number(await h.redis.hget(`HYPERLINK-BATCH/${id1}`, 'done')), b2: Number(await h.redis.hget(`HYPERLINK-BATCH/${id2}`, 'done')) };
  const d1 = await h.waitForDone(k1, 60000);
  const d2 = await h.waitForDone(k2, 60000);
  await sleep(300);
  const wall = (now() - t0) / 1000;
  const calls = (id: string) => h.scanCalls.filter(c => c.batchId === id);
  const first = (id: string) => Math.min(...calls(id).map(c => c.t));
  const last = (id: string) => Math.max(...calls(id).map(c => c.tEnd || c.t));
  const span = (id: string) => `${((first(id) - t0) / 1000).toFixed(1)}..${((last(id) - t0) / 1000).toFixed(1)}s`;
  const b2StartsBeforeB1Ends = first(id2) < last(id1) - 1000;
  const bothActiveAtMid = doneMid.b1 > 0 && doneMid.b2 > 0;
  const notifs = h.notifications().length;
  const counts = await h.counts(s.fq);
  const sc = h.scanStats();
  const pass = r1.msg === 1 && r2.msg === 1 && d1?.cStatus === 'C' && d2?.cStatus === 'C' && d1.nCompleted === N && d2.nCompleted === N
    && bothActiveAtMid && b2StartsBeforeB1Ends && sc.totalCalls === 2 * N && sc.distinct === 2 * N && notifs === 2
    && counts.waiting + counts.active + counts.delayed === 0;
  const numbers = `2 x ${N} files same section, workers 3, fairChunk 50: doneAtMidpoint B1=${doneMid.b1} B2=${doneMid.b2} (bundlesActiveAtMidpoint=${(doneMid.b1 > 0 ? 1 : 0) + (doneMid.b2 > 0 ? 1 : 0)}/2) scans B1=${span(id1)} B2=${span(id2)} `
    + `final B1=${d1?.cStatus} ${d1?.nCompleted}/${d1?.nTotal} B2=${d2?.cStatus} ${d2?.nCompleted}/${d2?.nTotal} scans=${sc.totalCalls}/${2 * N} notifications=${notifs} wall=${wall.toFixed(1)}s`;
  await h.teardown();
  return { pass, numbers, details: { doneMid } };
}

async function takeover() {
  const N = 600, FILE_MS = 20;
  const h = new HarnessV2({ label: 'A17b' });
  await h.flush();
  const files = makeFiles(N, 'tk');
  h.db.getfiles = () => files;
  h.scan = { delayMs: FILE_MS, result: true };
  const cfg = { HYPERLINK_WORKERS: '3', HYPERLINK_ENQUEUE_STALE_MS: '2000' };
  const s1 = await h.stack('w1', cfg, { settings: FAST_STALL });
  const origAddBulk = s1.fq.addBulk.bind(s1.fq);
  let chunks = 0, hung = false;
  (s1.fq as any).addBulk = (jobs: any[]) => { chunks++; if (chunks === 2) { hung = true; return new Promise(() => { /* dead */ }); } return origAddBulk(jobs); };
  const body = bodyFor({ nSectionid: 'S-A17b', nBundleid: 'B' });
  const r = await s1.gen.starthyperlink(body, false);
  const key = r.data.queueName, batchId = r.data.batchId;
  const t0 = now();
  const hungAt = await h.waitFor(() => hung, 10000, 20);
  await sleep(300);
  const hashAtKill = await h.redis.hgetall(`HYPERLINK-BATCH/${batchId}`);
  const tKill = now();
  h.killTag('w1'); await s1.bq.close(true); await s1.fq.close(true);
  const s2 = await h.stack('w2', cfg, { settings: FAST_STALL });
  const rerun = await h.waitFor(() => h.bullEvents.some(e => e.queue === 'hyperlink-queue' && e.event === 'stalled'), 30000, 50);
  const tRerun = now();
  const readdAt = await h.waitFor(() => h.logs.some(l => /re-adding \d+ of \d+ file job/.test(l)), 40000, 50);
  const readdLog = h.logs.find(l => /re-adding \d+ of \d+ file job/.test(l)) || '';
  const takeoverLog = h.logs.find(l => /stopped moving \(dead orchestrator\)/.test(l)) || '';
  const done = await h.waitForDone(key, 60000);
  await sleep(1000);
  const wall = (now() - t0) / 1000;
  const sc = h.scanStats(batchId);
  const hash = await h.redis.hgetall(`HYPERLINK-BATCH/${batchId}`);
  const seen = await h.redis.scard(`HYPERLINK-BATCH/${batchId}/seen`);
  const counts = await h.counts(s2.fq);
  const bcounts = await h.counts(s2.bq);
  const terminalEmits = h.responces(key).filter(e => e.data.data.cStatus !== 'P').length;
  const notif = h.notifications().length;
  const skippedSeen = h.logs.filter(l => /already counted, skipped before python/.test(l)).length;
  const waitedMs = readdAt >= 0 ? (tRerun + readdAt) - tRerun : -1;
  const m = /re-adding (\d+) of (\d+) file job\(s\) \((\d+) already counted\)/.exec(readdLog);
  const pass = hungAt >= 0 && rerun >= 0 && readdAt >= 0 && !!takeoverLog && waitedMs < 5000 && !!m && Number(m[1]) + Number(m[3]) === N
    && !!done && done.cStatus === 'C' && done.nCompleted === N && done.nFailed === 0
    && sc.distinct === N && sc.totalCalls <= N + 3 && terminalEmits === 1 && notif === 1 && Number(hash.done) === N && seen === N && hash.enqueueDone === '1'
    && counts.waiting + counts.active + counts.delayed + counts.failed === 0 && bcounts.waiting + bcounts.active + bcounts.delayed + bcounts.failed === 0;
  const numbers = `orchestrator died in addBulk chunk 2 (total=${hashAtKill.total} enqueueDone=${hashAtKill.enqueueDone || 0}) -> stalled re-run after ${rerun >= 0 ? (rerun / 1000).toFixed(1) + 's' : 'never'}, `
    + `takeover=${!!takeoverLog} re-add ${waitedMs >= 0 ? (waitedMs / 1000).toFixed(1) + 's' : 'never'} after the re-run (enqueueStale 2 s, no 30 s wait) "${m ? m[0] : readdLog}" skippedAsSeen=${skippedSeen} `
    + `scans=${sc.totalCalls}/${N} (distinct ${sc.distinct}) final=${done?.nCompleted}/${done?.nTotal}/${done?.nFailed}/${done?.cStatus} seen=${seen} terminalEmits=${terminalEmits} notifications=${notif} fileQueue=w${counts.waiting}/a${counts.active}/f${counts.failed} bundleQueue=w${bcounts.waiting}/a${bcounts.active} wall=${wall.toFixed(1)}s (kill at +${((tKill - t0) / 1000).toFixed(1)}s)`;
  await h.teardown();
  return { pass, numbers, details: { hash, counts } };
}

const OLD = () => new Date(Date.now() - 100 * 60 * 1000).toISOString();

async function staleBusy() {
  const FOREIGN = 5200;
  const h = new HarnessV2({ label: 'A17c' });
  await h.flush();
  h.db.getfiles = (q) => q.nBundleid === 'Z' ? makeFiles(FOREIGN, 'z') : makeFiles(30, 'a');
  h.scan = { delayMs: 10, result: 'hang' };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '5', HYPERLINK_STALE_MIN: '90' });
  const tAdd = now();
  const rZ = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-A17z', nBundleid: 'Z' }), false);
  await h.waitFor(async () => (await h.redis.hget(`HYPERLINK-BATCH/${rZ.data.batchId}`, 'enqueueDone')) === '1', 60000, 100);
  const rA = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-A17a2', nBundleid: 'A' }), false);
  await h.waitFor(async () => (await h.redis.hget(`HYPERLINK-BATCH/${rA.data.batchId}`, 'enqueueDone')) === '1', 20000, 100);
  await sleep(300);
  const addSec = ((now() - tAdd) / 1000).toFixed(1);
  // age A's key (alive: its 30 jobs wait behind Z's)
  const snapA = await h.snapshot(rA.data.queueName);
  snapA.dUpdate = OLD(); snapA.dStart = OLD();
  await h.redis.set(rA.data.queueName, JSON.stringify(snapA), 'EX', 172800);
  // a dead batch D: 'P' key 100 min old, hash 2/10, enqueueDone, expected set, but NO job of it anywhere
  const bodyD = bodyFor({ nSectionid: 'S-A17d', nBundleid: 'D' });
  const keyD = s.batch.progressKeyFor(bodyD), idD = s.batch.batchIdFor(bodyD);
  const snapD = { queueName: keyD, nCaseid: 'c1', nSectionid: 'S-A17d', nMasterid: 'm1', nBundledetailid: null, nBundleid: 'D', cType: 'E', cKeeptype: 'R', nTotal: 10, nCompleted: 2, nFailed: 0, cStatus: 'P', isDeepscan: false, isSmartscan: false, batchId: idD, dStart: OLD(), dUpdate: OLD(), jFailed: [], nFailedTruncated: false };
  await h.redis.set(keyD, JSON.stringify(snapD), 'EX', 172800);
  await h.redis.hmset(`HYPERLINK-BATCH/${idD}`, { total: '10', done: '2', failed: '0', cancelled: '0', owner: keyD, run: 'deadrun', dStart: OLD(), enqueued: '1', enqueueDone: '1' });
  await h.redis.sadd(`HYPERLINK-BATCH/${idD}/jobs`, ...makeFiles(10, 'd').map(f => f.nBundledetailid));
  await h.redis.sadd(`HYPERLINK-BATCH/${idD}/seen`, 'd-00001', 'd-00002');
  const counts = await h.counts(s.fq);
  let t = now();
  const r2A = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-A17a2', nBundleid: 'A' }), false);
  const tookA = now() - t;
  const afterA = await h.snapshot(rA.data.queueName);
  h.db.getfiles = () => makeFiles(3, 'd2');
  h.scan = { delayMs: 10, result: true };
  t = now();
  const r2D = await s.gen.starthyperlink(bodyD, false);
  const tookD = now() - t;
  const staleEmit = h.responces(keyD).find(e => e.data.data.cStatus === 'F' && (e.data.data.jFailed || []).some((f: any) => f.cReason === 'stale'));
  const conservative = h.logs.filter(l => /keeping the lock/.test(l)).length;
  const pass = rZ.msg === 1 && rA.msg === 1 && counts.waiting + counts.active > 5000
    && r2A.msg === -1 && afterA?.cStatus === 'P' && !r2A.staleReleased
    && r2D.msg === 1 && r2D.staleReleased === true && !!staleEmit && conservative === 0;
  const numbers = `Z=${FOREIGN} hung/waiting foreign jobs (queue w${counts.waiting}/a${counts.active}, added in ${addSec}s), A=30 queued behind with a 100-min-old key -> restart A msg=${r2A.msg} "${r2A.value}" keyAfter=${afterA?.cStatus} (alive, ${tookA}ms); `
    + `dead D (old key, hash 2/10, no job) -> restart D msg=${r2D.msg} staleReleased=${!!r2D.staleReleased} oldKeyMarked=${staleEmit ? 'F/stale' : 'no'} (${tookD}ms) conservativeBranchLogged=${conservative}`;
  await h.teardown();
  return { pass, numbers, details: { counts } };
}
