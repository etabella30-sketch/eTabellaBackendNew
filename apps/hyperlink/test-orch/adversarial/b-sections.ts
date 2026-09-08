/**
 * B - Locking across sections / users / bundledetail and the concurrency-5 slot.
 *  B1 two bundles in DIFFERENT sections started together: allowed? slower?
 *  B2 SAME section, DIFFERENT user (nMasterid): allowed? (lock key contains nMasterid)
 *  B3 SAME section + user, one with nBundledetailid null and one with a value: allowed?
 *  B4 six sections at once with concurrency 5: sixth waits in the queue while its
 *     lock key already says "in progress".
 * Stubbed scans (timers), so any slowdown here is pure orchestration overhead.
 */
import { Harness, bodyFor, flushDb9, makeFiles, now, out, queueWith, secs } from './common';

const FILE_MS = 30;

function perBundle(h: Harness, queueName: string, t0: number) {
  const runs = h.runs.filter(r => r.queueName === queueName);
  const calls = h.fileCalls.filter(c => runs.some(r => r.runId === c.runId));
  const last = h.lastResponce(queueName);
  return {
    runs: runs.map(r => ({ run: r.runId, startS: secs(r.start - t0), endS: r.end ? secs(r.end - t0) : null, files: r.filesSeen, outcome: r.outcome })),
    scanCalls: calls.length,
    effectiveMsPerFile: (() => { const r = runs[runs.length - 1]; return r && r.end ? +(((r.end - r.start) / Math.max(1, r.filesSeen))).toFixed(1) : null; })(),
    lastPopup: last ? { nTotal: last.nTotal, nCompleted: last.nCompleted, nFailed: last.nFailed, cStatus: last.cStatus } : null,
  };
}

async function b1() {
  const h = new Harness({ resumeNeutralised: true, label: 'B1' });
  await h.flush();
  const filesS = makeFiles(100, 's'), filesT = makeFiles(100, 't');
  h.db.getfiles = (q) => (q.nSectionid === 'S' ? filesS : filesT);
  h.search = { delayMs: FILE_MS, result: true };
  const q = queueWith(h, 'w');
  const gen = h.makeGenerator(q);
  // baseline: one bundle alone
  const t0 = now();
  const alone = await gen.starthyperlink(bodyFor({ nSectionid: 'S', nBundleid: 'A' }), false);
  h.registerWorker(q, 'w', h.makeProcessor());
  await h.waitForIdle([q], 30000);
  const aloneStats = perBundle(h, alone.data.queueName, t0);
  // together: two bundles in different sections
  const t1 = now();
  const a = await gen.starthyperlink(bodyFor({ nSectionid: 'S', nBundleid: 'A' }), false);
  const c = await gen.starthyperlink(bodyFor({ nSectionid: 'T', nBundleid: 'C' }), false);
  await h.waitForIdle([q], 30000);
  const ra = perBundle(h, a.data.queueName, t1), rc = perBundle(h, c.data.queueName, t1);
  const runsA = h.runs.filter(r => r.queueName === a.data.queueName).slice(-1)[0];
  const runsC = h.runs.filter(r => r.queueName === c.data.queueName).slice(-1)[0];
  const overlapMs = runsA && runsC ? Math.max(0, Math.min(runsA.end!, runsC.end!) - Math.max(runsA.start, runsC.start)) : 0;
  const result = { accepted: { A: a.msg, C: c.msg, Cvalue: c.value }, aloneEffectiveMsPerFile: aloneStats.effectiveMsPerFile, togetherEffectiveMsPerFile: { A: ra.effectiveMsPerFile, C: rc.effectiveMsPerFile }, overlapSeconds: secs(overlapMs), A: ra, C: rc, keysAtEnd: await h.appKeys() };
  await h.teardown(); await flushDb9();
  return result;
}

async function b2() {
  const h = new Harness({ resumeNeutralised: true, label: 'B2' });
  await h.flush();
  const files = makeFiles(100, 'x');
  h.db.getfiles = () => files;                       // same section -> same files for both users
  h.search = { delayMs: FILE_MS, result: true };
  const q = queueWith(h, 'w');
  const gen = h.makeGenerator(q);
  const t0 = now();
  const u1 = await gen.starthyperlink(bodyFor({ nSectionid: 'S', nBundleid: 'A', nMasterid: 'user1' }), false);
  const u2 = await gen.starthyperlink(bodyFor({ nSectionid: 'S', nBundleid: 'A', nMasterid: 'user2' }), false);
  const keysAfterStart = await h.appKeys();
  // what user2 sees in GET /hyperlinks (getHyperLinkProgress is per nMasterid/nCaseid)
  const progressUser2 = await gen.getHyperLinkProgress({ nMasterid: 'user2', nCaseid: 'c1' } as any);
  const progressUser1 = await gen.getHyperLinkProgress({ nMasterid: 'user1', nCaseid: 'c1' } as any);
  h.registerWorker(q, 'w', h.makeProcessor());
  await h.waitForIdle([q], 30000);
  const fc = h.fileCallStats();
  const result = {
    accepted: { user1: u1.msg, user2: u2.msg, user2Value: u2.value }, lockKeysAfterStart: keysAfterStart,
    user1SeesUser2Job: JSON.stringify(progressUser1).includes('user2'), user2SeesUser1Job: JSON.stringify(progressUser2).includes('user1'),
    distinctFiles: fc.distinct, scanCalls: fc.totalCalls, filesScannedTwice: fc.processedMoreThanOnce, sp: h.spStats(),
    ranConcurrently: (() => { const [r1, r2] = h.runs; return r1 && r2 && r1.end && r2.end ? Math.min(r1.end, r2.end) > Math.max(r1.start, r2.start) : false; })(),
    user1: perBundle(h, u1.data.queueName, t0), user2: perBundle(h, u2.data.queueName, t0), notifications: h.notifications().map(e => e.data.cMsg),
  };
  await h.teardown(); await flushDb9();
  return result;
}

async function b3() {
  const h = new Harness({ resumeNeutralised: true, label: 'B3' });
  await h.flush();
  const files = makeFiles(60, 'y');
  h.db.getfiles = (q) => (q.nBundledetailid ? files.slice(0, 1) : files);
  h.search = { delayMs: FILE_MS, result: true };
  const q = queueWith(h, 'w');
  const gen = h.makeGenerator(q);
  const t0 = now();
  const whole = await gen.starthyperlink(bodyFor({ nSectionid: 'S', nBundleid: 'A' }), false);
  const single = await gen.starthyperlink(bodyFor({ nSectionid: 'S', nBundleid: 'A', nBundledetailid: 'y-00001' }), false);
  const again = await gen.starthyperlink(bodyFor({ nSectionid: 'S', nBundleid: 'A' }), false);
  h.registerWorker(q, 'w', h.makeProcessor());
  await h.waitForIdle([q], 30000);
  const fc = h.fileCallStats();
  const result = { accepted: { wholeBundle: whole.msg, singleFileSameSection: single.msg, wholeBundleAgain: again.msg, againValue: again.value }, keys: [whole.data?.queueName, single.data?.queueName], scanCalls: fc.totalCalls, distinct: fc.distinct, perFile: fc.distribution, whole: perBundle(h, whole.data.queueName, t0), single: single.data ? perBundle(h, single.data.queueName, t0) : null };
  await h.teardown(); await flushDb9();
  return result;
}

async function b4() {
  const h = new Harness({ resumeNeutralised: true, label: 'B4' });
  await h.flush();
  h.db.getfiles = (q) => makeFiles(80, 'sec' + q.nSectionid);
  h.search = { delayMs: FILE_MS, result: true };
  const q = queueWith(h, 'w');
  const gen = h.makeGenerator(q);
  const t0 = now();
  const starts: any[] = [];
  for (let i = 1; i <= 6; i++) starts.push(await gen.starthyperlink(bodyFor({ nSectionid: 'S' + i, nBundleid: 'B' + i }), false));
  h.registerWorker(q, 'w', h.makeProcessor());
  await new Promise(r => setTimeout(r, 1200));
  const countsWhileRunning = await q.getJobCounts();
  const sixthKey = await h.redis.get(starts[5].data.queueName);
  const sixthProgress = await gen.getHyperLinkProgress({ nMasterid: 'm1', nCaseid: 'c1' } as any);
  const sixthRetry = await gen.starthyperlink(bodyFor({ nSectionid: 'S6', nBundleid: 'B6' }), false);
  await h.waitForIdle([q], 60000);
  const per = starts.map(s => ({ q: s.data.queueName, ...perBundle(h, s.data.queueName, t0) }));
  const result = {
    accepted: starts.map(s => s.msg), bullCountsAt1_2s: countsWhileRunning, maxConcurrentDistinctJobs: (() => { let m = 0; for (const r of h.runs) m = Math.max(m, h.runs.filter(x => x.start <= r.start && (!x.end || x.end >= r.start)).length); return m; })(),
    sixthLockKeyWhileWaiting: sixthKey && JSON.parse(sixthKey).cStatus, sixthListedInProgress: (sixthProgress.value || []).length, sixthRetryWhileWaiting: sixthRetry.value,
    perBundle: per, effectiveMsPerFileAll: per.map(p => p.effectiveMsPerFile), wallSeconds: secs(now() - t0),
  };
  await h.teardown(); await flushDb9();
  return result;
}

export async function run() {
  const r: any = {};
  r.b1_twoSections = await b1(); out(JSON.stringify(r.b1_twoSections, null, 1));
  r.b2_sameSectionTwoUsers = await b2(); out(JSON.stringify(r.b2_sameSectionTwoUsers, null, 1));
  r.b3_bundleVsSingleFile = await b3(); out(JSON.stringify(r.b3_bundleVsSingleFile, null, 1));
  r.b4_sixSectionsConcurrency5 = await b4(); out(JSON.stringify(r.b4_sixSectionsConcurrency5, null, 1));
  return r;
}
