/**
 * Z3 (c) - two bundles of the same section (300 + 200 files) started in the
 * same instant, plus one single-file job of the same section (a file that is
 * in NEITHER bundle) started once the bundles are enqueued. All three must
 * run; counters / seen sets / keys isolated; the single file must be served
 * ahead of the 500 waiting bundle jobs (priority class); cancelling B1 while
 * it runs must not touch B2's jobs nor the single file; B2 and the file end
 * C with exactly their own scan counts; nothing of B1 is scanned after its
 * cancel. Then a second admin (m2) is refused for the running B2, and can
 * start the cancelled B1 (lock released), whose run ends C.
 */
import { HarnessV2, bodyFor, makeFiles, now, verdict, sleep } from '../../../harness';

export async function run() {
  const N1 = 300, N2 = 200;
  const h = new HarnessV2({ label: 'Z3' });
  await h.flush();
  const f1 = makeFiles(N1, 'b1'), f2 = makeFiles(N2, 'b2');
  const solo = { nBundledetailid: 'solo-00001', cFilename: 'solo.pdf', cPath: 'x/solo.pdf' };
  h.db.getfiles = (q) => q.nBundledetailid ? [solo] : q.nBundleid === 'B1' ? f1 : q.nBundleid === 'B2' ? f2 : [];
  h.scan = { delayMs: 20, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '3' });
  const b1 = bodyFor({ nSectionid: 'S', nBundleid: 'B1' }), b2 = bodyFor({ nSectionid: 'S', nBundleid: 'B2' }), bs = bodyFor({ nSectionid: 'S', nBundledetailid: 'solo-00001' });
  const [r1, r2] = await Promise.all([s.gen.starthyperlink(b1, false), s.gen.starthyperlink(b2, false)]);
  const k1 = r1.data?.queueName, k2 = r2.data?.queueName, id1 = r1.data?.batchId, id2 = r2.data?.batchId;
  await h.waitFor(async () => (await h.redis.hget(`HYPERLINK-BATCH/${id1}`, 'enqueueDone')) === '1' && (await h.redis.hget(`HYPERLINK-BATCH/${id2}`, 'enqueueDone')) === '1', 10000);
  const waitingBefore = (await h.counts(s.fq)).waiting;
  const tSolo = now();
  const rs = await s.gen.starthyperlink(bs, false);
  const ks = rs.data?.queueName, ids = rs.data?.batchId;
  await h.waitFor(() => h.scanCalls.some(c => c.batchId === ids), 10000);
  const soloFirst = h.scanCalls.find(c => c.batchId === ids);
  const soloDelay = soloFirst ? soloFirst.t - tSolo : -1;
  // cancel B1 while it runs
  await h.waitFor(async () => Number(await h.redis.hget(`HYPERLINK-BATCH/${id1}`, 'done')) >= 60, 10000);
  const tCancel = now();
  const c1 = await s.gen.cancelhyperlink(b1 as any);
  const b1ScansAtCancel = h.scanCalls.filter(c => c.batchId === id1 && c.t <= tCancel).length;
  const afterCancelCounts = await h.counts(s.fq);
  const keysAfterCancel = await h.redis.keys('orchtest:hyperlink-file-queue:*');
  const b1JobKeysLeft = keysAfterCancel.filter(k => k.includes(`:${id1}:`) && !k.endsWith(':lock')).length;
  const b2JobKeysLeft = keysAfterCancel.filter(k => k.includes(`:${id2}:`) && !k.endsWith(':lock')).length;
  // second admin while B2 is still running
  const b2Running = (await h.snapshot(k2))?.cStatus;
  const m2b2 = await s.gen.starthyperlink({ ...b2, nMasterid: 'm2' }, false);
  const d2 = await h.waitForDone(k2, 60000);
  const dsolo = await h.waitForDone(ks, 60000);
  await sleep(1000);
  const d1 = await h.snapshot(k1);
  const b1ScansAfterCancel = h.scanCalls.filter(c => c.batchId === id1 && c.t > tCancel + 50).length;
  const sc1 = h.scanStats(id1), sc2 = h.scanStats(id2), scs = h.scanStats(ids);
  const hash1 = await h.redis.hgetall(`HYPERLINK-BATCH/${id1}`), hash2 = await h.redis.hgetall(`HYPERLINK-BATCH/${id2}`), hashs = await h.redis.hgetall(`HYPERLINK-BATCH/${ids}`);
  const seen1 = await h.redis.scard(`HYPERLINK-BATCH/${id1}/seen`), seen2 = await h.redis.scard(`HYPERLINK-BATCH/${id2}/seen`), seens = await h.redis.scard(`HYPERLINK-BATCH/${ids}/seen`);
  const progressKeys = (await h.redis.keys('HYPERLINK/*')).sort();
  const notif = h.notifications().map(e => e.data.cMsg.split(' | ')[0]);
  // second admin starts the cancelled B1 (lock released)
  const m2b1 = await s.gen.starthyperlink({ ...b1, nMasterid: 'm2' }, false);
  const d1m2 = m2b1.msg === 1 ? await h.waitForDone(m2b1.data.queueName, 60000) : null;
  await sleep(500);
  const m1KeyStill = await h.snapshot(k1);
  const counts = await h.counts(s.fq);
  const b1JobKeysEnd = (await h.redis.keys('orchtest:hyperlink-file-queue:*')).filter(k => k.includes(`:${id1}:`) && !k.endsWith(':lock')).length;
  const pass = r1.msg === 1 && r2.msg === 1 && rs.msg === 1 && soloDelay >= 0 && soloDelay < 1500 && c1.msg === 1 && d1?.cStatus === 'X' && d2?.cStatus === 'C' && d2.nCompleted === N2 && dsolo?.cStatus === 'C' && dsolo.nCompleted === 1
    && sc2.totalCalls === N2 && scs.totalCalls === 1 && b1ScansAfterCancel === 0 && b1JobKeysLeft <= 5 /* locked / in flight at the cancel */ && b1JobKeysEnd === 0 && b2JobKeysLeft > 0
    && Number(hash1.done) + Number(hash1.failed) === seen1 && seen2 === N2 && seens === 1 && d1.nCompleted === Number(hash1.done) && d1.nTotal === N1
    && progressKeys.length === 3 && notif.length === 3 && b2Running === 'P' && m2b2.msg === -1 && m2b1.msg === 1 && d1m2?.cStatus === 'C' && d1m2.nCompleted === N1 && m1KeyStill?.cStatus === 'X'
    && counts.waiting + counts.active + counts.delayed + counts.failed === 0;
  const numbers = `start B1=${r1.msg} B2=${r2.msg} (same instant) solo=${rs.msg} soloFirstScanAfter=${soloDelay}ms (waiting bundle jobs then: ${waitingBefore}) | cancel B1 at ${b1ScansAtCancel} scans: msg=${c1.msg} removed=${c1.removed} queueAfter=w${afterCancelCounts.waiting}/a${afterCancelCounts.active} B1jobKeysLeft=${b1JobKeysLeft} (locked/in flight; at the end ${b1JobKeysEnd}) B2jobKeysLeft=${b2JobKeysLeft} B1scansAfterCancel=${b1ScansAfterCancel} `
    + `| finals B1=${d1?.cStatus} ${d1?.nCompleted}/${d1?.nTotal} B2=${d2?.cStatus} ${d2?.nCompleted}/${d2?.nTotal} solo=${dsolo?.cStatus} ${dsolo?.nCompleted}/${dsolo?.nTotal} scans B1=${sc1.totalCalls} B2=${sc2.totalCalls}/${N2} solo=${scs.totalCalls} hashes=${hash1.done}+${hash1.failed}|${hash2.done}|${hashs.done} seen=${seen1}/${seen2}/${seens} progressKeys=${progressKeys.length} notifications=[${notif.join(',')}] `
    + `| admin m2: B2 while running (key ${b2Running})=${m2b2.msg} "${m2b2.value}" B1 after cancel=${m2b1.msg} -> ${d1m2?.cStatus} ${d1m2?.nCompleted}/${d1m2?.nTotal} m1KeyStill=${m1KeyStill?.cStatus} queue=w${counts.waiting}/a${counts.active}`;
  await h.teardown();
  return verdict('Z3', pass, numbers, { progressKeys });
}
