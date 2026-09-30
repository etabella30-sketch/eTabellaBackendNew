/**
 * X3 (c) - isolation.
 *   X3a: two bundles of the same section (120 + 80 files) plus one single-file
 *        job of the same section (the file also belongs to bundle 1), started
 *        together: counters, keys, hashes, seen sets and job ids isolated;
 *        exactly 3 progress keys under HYPERLINK/m1/c1/S-X3; 3 notifications.
 *   X3b: the SAME bundle started by two different admins (nMasterid m1 / m2)
 *        while it runs. The progress key (= the lock) carries nMasterid, the
 *        batch hash does not -> is the second start rejected (A3) and is the
 *        work done once (A1)?
 *   X3c: REAL HyperlinksearchService. Single-file batch of f1 first, then a
 *        bundle containing f1: refused while f1 runs alone (D5); cancel the
 *        single-file batch (its python dies), then the bundle is accepted and
 *        ends F 0/2 through the per-file timer.
 */
import * as fs from 'fs';
import * as path from 'path';
import { HarnessV2, SCRATCH, bodyFor, makeFiles, now, verdict, sleep } from '../../harness';
import { HyperlinksearchService } from '../../../../src/services/hyperlinksearch/hyperlinksearch.service';

const FAKE_PY = path.join(__dirname, '..', 'python', 'fake_adv.py');
const PID_DIR = path.join(SCRATCH, 'pids');
function livePids(): number[] {
  const alive: number[] = [];
  for (const f of fs.readdirSync(PID_DIR)) { const pid = parseInt(f, 10); try { process.kill(pid, 0); alive.push(pid); } catch { /* gone */ } }
  return alive;
}
function clearPidDir() { for (const f of fs.readdirSync(PID_DIR)) fs.unlinkSync(path.join(PID_DIR, f)); }

export async function run() {
  return [await threeBatches(), await twoAdmins(), await registryCollision()];
}

async function threeBatches() {
  const h = new HarnessV2({ label: 'X3a' });
  await h.flush();
  const b1 = makeFiles(120, 'b1'), b2 = makeFiles(80, 'b2');
  const shared = b1[4];                                  // b1-00005 also runs as a single-file job
  h.db.getfiles = (q) => q.nBundledetailid ? [shared] : q.nBundleid === 'B1' ? b1 : b2;
  h.scan = { delayMs: 30, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '3' });
  const bodies = [bodyFor({ nSectionid: 'S-X3', nBundleid: 'B1' }), bodyFor({ nSectionid: 'S-X3', nBundleid: 'B2' }), bodyFor({ nSectionid: 'S-X3', nBundledetailid: shared.nBundledetailid })];
  const t0 = now();
  const rs = await Promise.all(bodies.map(b => s.gen.starthyperlink(b, false)));
  // fix round 2 (D5): the single-file request overlaps B1 (its file belongs to
  // B1), so exactly ONE of the two is accepted (the section mutex serializes
  // the simultaneous starts); B2 is always accepted
  const accepted = rs.map((r, i) => r.msg === 1 ? i : -1).filter(i => i >= 0);
  const keys = accepted.map(i => rs[i].data.queueName), ids = accepted.map(i => rs[i].data.batchId);
  const dones = await Promise.all(keys.map(k => h.waitForDone(k, 60000)));
  await sleep(800);
  const expect = accepted.map(i => [120, 80, 1][i]);
  const hashes = await Promise.all(ids.map(id => h.redis.hgetall(`HYPERLINK-BATCH/${id}`)));
  const seens = await Promise.all(ids.map(id => h.redis.scard(`HYPERLINK-BATCH/${id}/seen`)));
  const prefixKeys = (await h.redis.keys('HYPERLINK/m1/c1/S-X3/*')).sort();
  const sharedScans = h.scanCalls.filter(c => c.nBundledetailid === shared.nBundledetailid);
  const perBatch = ids.map(id => h.scanStats(id).totalCalls);
  const notif = h.notifications().length;
  const overlapResolved = rs[1].msg === 1 && ((rs[0].msg === 1) !== (rs[2].msg === 1));
  const countersOk = dones.every((d, i) => d?.cStatus === 'C' && d.nTotal === expect[i] && d.nCompleted === expect[i] && d.nFailed === 0)
    && hashes.every((x, i) => Number(x.done) === expect[i] && Number(x.total) === expect[i]) && seens.every((n, i) => n === expect[i]);
  const pass = overlapResolved && countersOk && prefixKeys.length === 2 && new Set(ids).size === 2 && sharedScans.length === 1 && notif === 2 && h.scanCalls.length === expect.reduce((a, b) => a + b, 0);
  const numbers = `started=${rs.map(r => r.msg).join('/')} batchIds=${new Set(ids).size} keysUnderSection=${prefixKeys.length} [${prefixKeys.map(k => k.split('/').pop()).join(',')}] `
    + `finals=${dones.map((d, i) => `${d?.cStatus} ${d?.nCompleted}/${d?.nTotal}`).join(' | ')} hashes=${hashes.map(x => `${x.done}/${x.total}`).join(' | ')} seen=${seens.join('/')} `
    + `scansPerBatch=${perBatch.join('/')} sharedFileScans=${sharedScans.length} (batches: ${sharedScans.map(c => c.batchId.split(':').pop()).join(',')}) totalScans=${h.scanCalls.length} notifications=${notif} wall=${((now() - t0) / 1000).toFixed(1)}s`;
  await h.teardown();
  return verdict('X3a', pass, numbers);
}

async function twoAdmins() {
  const N = 120;
  const h = new HarnessV2({ label: 'X3b' });
  await h.flush();
  const files = makeFiles(N, 'x3b');
  h.db.getfiles = () => files;
  h.scan = { delayMs: 30, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '3' });
  const body1 = bodyFor({ nSectionid: 'S-X3b', nBundleid: 'B', nMasterid: 'm1' });
  const body2 = bodyFor({ nSectionid: 'S-X3b', nBundleid: 'B', nMasterid: 'm2' });
  const r1 = await s.gen.starthyperlink(body1, false);
  await sleep(600);
  const doneAtR2 = Number(await h.redis.hget(`HYPERLINK-BATCH/${r1.data.batchId}`, 'done'));
  const scansAtR2 = h.scanCalls.length;
  const r2 = await s.gen.starthyperlink(body2, false);
  const key1 = r1.data.queueName, key2 = r2.data?.queueName;
  const done2 = key2 ? await h.waitForDone(key2, 60000) : null;
  const done1 = await h.waitForDone(key1, 5000);
  await sleep(1500);
  const snap1 = await h.snapshot(key1), snap2 = key2 ? await h.snapshot(key2) : null;
  const sc = h.scanStats(r1.data.batchId);
  const olderRun = h.logs.filter(l => /belongs to an older run/.test(l)).length;
  const notif = h.notifications().length;
  const counts = await h.counts(s.fq);
  const sameBatchId = r2.data?.batchId === r1.data.batchId;
  const pass = r2.msg === -1 && sc.totalCalls === N && snap1?.cStatus === 'C' && snap1.nCompleted === N && notif === 1;
  const numbers = `m1 start=${r1.msg}; at ${doneAtR2}/${N} done m2 start=${r2.msg} "${r2.value}" sameBatchId=${sameBatchId} | scans=${sc.totalCalls} (distinct ${sc.distinct}, moreThanOnce=${sc.moreThanOnce}, expected ${N}) `
    + `m1 key=${snap1?.cStatus} ${snap1?.nCompleted}/${snap1?.nTotal} m2 key=${snap2 ? `${snap2.cStatus} ${snap2.nCompleted}/${snap2.nTotal}` : 'n/a'} ignoredOlderRunJobs=${olderRun} notifications=${notif} queue=w${counts.waiting}/a${counts.active}`;
  await h.teardown();
  return verdict('X3b', pass, numbers, { r2, snap1, snap2, sc });
}

async function registryCollision() {
  process.env.ORCH_PID_DIR = PID_DIR;
  clearPidDir();
  const h = new HarnessV2({ label: 'X3c' });
  await h.flush();
  const cfgOver = { PY_HYPERLINK: FAKE_PY, PY_HYPERLINK_SMART: FAKE_PY, PY_HYPERLINK_DEEP: FAKE_PY, HYPERLINK_WORKERS: '3', HYPERLINK_FILE_TIMEOUT_MIN: '0.1' };
  const real = new HyperlinksearchService(h.makeConfig(cfgOver));
  const s = await h.stack('w1', cfgOver, { realSearch: real });
  const f1 = { nBundledetailid: 'hang-f1', cFilename: 'f1.pdf', cPath: 'x/f1.pdf' };
  const f2 = { nBundledetailid: 'hang-f2', cFilename: 'f2.pdf', cPath: 'x/f2.pdf' };
  h.db.getfiles = (q) => q.nBundledetailid ? [f1] : [f1, f2];
  const single = bodyFor({ nSectionid: 'S-X3c', nBundledetailid: f1.nBundledetailid });
  const bundle = bodyFor({ nSectionid: 'S-X3c', nBundleid: 'B' });
  const rS = await s.gen.starthyperlink(single, false, false, true);
  await sleep(700);
  const rB = await s.gen.starthyperlink(bundle, false, false, true);
  await sleep(1500);
  const aliveBefore = livePids().length;
  const registryBefore = real.inFlight;
  // fix round 2 (D5): the bundle contains the file that runs alone -> refused
  // while the single-file batch runs; accepted once that batch is cancelled
  const cres = await s.gen.cancelhyperlink({ nCaseid: single.nCaseid, nSectionid: single.nSectionid, nBundledetailid: f1.nBundledetailid } as any);
  await sleep(400);
  const aliveAfter = livePids().length;
  const doneS = await h.snapshot(rS.data.queueName);
  const rB2 = await s.gen.starthyperlink(bundle, false, false, true);
  const doneB = rB2.msg === 1 ? await h.waitForDone(rB2.data.queueName, 30000) : null;   // both hang -> killed by the 6 s timer -> F 0/2
  await sleep(300);
  const aliveEnd = livePids().length;
  for (const p of livePids()) { try { process.kill(p); } catch { /* */ } }
  delete process.env.ORCH_PID_DIR;
  const reasons = (doneB?.jFailed || []).map(f => `${f.nBundledetailid}:${f.cReason}`).join('; ');
  const pass = rB.msg === -1 && cres.killed === 1 && aliveBefore === 1 && aliveAfter === 0 && doneS?.cStatus === 'X' && rB2.msg === 1 && doneB?.cStatus === 'F' && doneB.nFailed === 2 && /timeout/.test(reasons) && !/cancelled/.test(reasons) && aliveEnd === 0;
  const numbers = `single=${rS.msg} bundleWhileSingleRuns=${rB.msg} pythonsAlive=${aliveBefore} registryEntries=${registryBefore} -> cancel(single) killed=${cres.killed} pythonsAlive=${aliveAfter} single=${doneS?.cStatus} `
    + `| bundle after the cancel=${rB2.msg} -> ${doneB?.cStatus} ${doneB?.nCompleted}/${doneB?.nTotal} reasons="${reasons}" pythonsAtEnd=${aliveEnd}`;
  await h.teardown();
  return verdict('X3c', pass, numbers);
}
