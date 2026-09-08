/**
 * Q3 (c) - two bundles of the same section (admin m1) plus one single-file job
 * of the same section (admin m2) at once, sharing one worker pool.
 *   - all three accepted and running concurrently; counters and keys isolated
 *     (own progress key, own hash, own seen set, exact totals 250/250/1)
 *   - every socket payload of a key carries that key's batchId, its nTotal is
 *     constant and its counter monotonic
 *   - the whole section ('all') is rejected while they run; a file of B1
 *     requested with nBundleid B1 is rejected; the same file requested WITHOUT
 *     nBundleid is recorded (design: accepted -> the file is scanned twice)
 *   - GET /hyperlinks per admin returns only that admin's keys
 *   - the single-file job's queueing delay behind the bundles is measured
 */
import { HarnessV2, bodyFor, makeFiles, now, verdict, sleep } from '../../../harness';

export async function run() {
  const N = 250;
  const h = new HarnessV2({ label: 'Q3' });
  await h.flush();
  const f1 = makeFiles(N, 'q3b1'), f2 = makeFiles(N, 'q3b2');
  const solo = { nBundledetailid: 'q3-solo', cFilename: 'solo.pdf', cPath: 'x/solo.pdf' };
  h.db.getfiles = (q) => {
    if (q.nBundledetailid) return [...f1, ...f2, solo].filter(f => f.nBundledetailid === q.nBundledetailid);
    if (q.nBundleid === 'B1') return f1;
    if (q.nBundleid === 'B2') return f2;
    return [...f1, ...f2, solo];
  };
  h.scan = { delayMs: 20, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '3' });
  const t0 = now();
  const [rB1, rB2, rSolo] = await Promise.all([
    s.gen.starthyperlink(bodyFor({ nSectionid: 'S-Q3', nBundleid: 'B1', nMasterid: 'm1' }), false),
    s.gen.starthyperlink(bodyFor({ nSectionid: 'S-Q3', nBundleid: 'B2', nMasterid: 'm1' }), false),
    s.gen.starthyperlink(bodyFor({ nSectionid: 'S-Q3', nBundledetailid: 'q3-solo', nMasterid: 'm2' }), false),
  ]);
  await sleep(150);
  const rAll = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-Q3', nMasterid: 'm1' }), false);
  const rFileWithBundle = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-Q3', nBundleid: 'B1', nBundledetailid: f1[0].nBundledetailid, nMasterid: 'm1' }), false);
  const rFileNoBundle = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-Q3', nBundledetailid: f1[5].nBundledetailid, nMasterid: 'm2' }), false);
  const keys = [rB1, rB2, rSolo].map(r => r.data?.queueName);
  const dones = await Promise.all(keys.map(k => h.waitForDone(k, 60000)));
  if (rFileNoBundle.msg === 1) await h.waitForDone(rFileNoBundle.data.queueName, 30000);
  await sleep(500);
  const wall = (now() - t0) / 1000;
  const hashes = await Promise.all([rB1, rB2, rSolo].map(r => h.redis.hgetall(`HYPERLINK-BATCH/${r.data.batchId}`)));
  const seens = await Promise.all([rB1, rB2, rSolo].map(r => h.redis.scard(`HYPERLINK-BATCH/${r.data.batchId}/seen`)));
  const allKeys = (await h.appKeys()).filter(k => k.startsWith('HYPERLINK/'));
  // event isolation
  let crossBatch = 0, nonMonotonic = 0, totalChanged = 0;
  for (const r of [rB1, rB2, rSolo]) {
    const evs = h.responces(r.data.queueName).map(e => e.data.data);
    let prev = -1;
    for (const e of evs) {
      if (e.batchId !== r.data.batchId) crossBatch++;
      if (e.nTotal && e.nTotal !== (r === rSolo ? 1 : N)) totalChanged++;
      if (e.nCompleted + e.nFailed < prev) nonMonotonic++;
      prev = e.nCompleted + e.nFailed;
    }
  }
  const sc = h.scanStats();
  const soloScan = h.scanCalls.find(c => c.nBundledetailid === 'q3-solo');
  const soloWait = soloScan ? (soloScan.t - t0) / 1000 : -1;
  const dupFile = h.scanCalls.filter(c => c.nBundledetailid === f1[5].nBundledetailid).length;
  const overlap = [rB1, rB2, rSolo].every(r => h.scanCalls.some(c => c.batchId === r.data.batchId));
  const listM1 = await s.gen.getHyperLinkProgress({ nCaseid: 'c1', nMasterid: 'm1' } as any);
  const listM2 = await s.gen.getHyperLinkProgress({ nCaseid: 'c1', nMasterid: 'm2' } as any);
  const notif = h.notifications().length;
  const expectedNotif = 3 + (rFileNoBundle.msg === 1 ? 1 : 0);
  const pass = [rB1, rB2, rSolo].every(r => r.msg === 1) && rAll.msg === -1 && rFileWithBundle.msg === -1
    && dones[0]?.cStatus === 'C' && dones[0].nCompleted === N && dones[1]?.cStatus === 'C' && dones[1].nCompleted === N && dones[2]?.cStatus === 'C' && dones[2].nCompleted === 1
    && hashes[0].done === String(N) && hashes[1].done === String(N) && hashes[2].done === '1' && seens[0] === N && seens[1] === N && seens[2] === 1
    && new Set(keys).size === 3 && crossBatch === 0 && nonMonotonic === 0 && totalChanged === 0 && overlap
    && (listM1.value?.length === 2) && (listM2.value?.length === (rFileNoBundle.msg === 1 ? 2 : 1)) && notif === expectedNotif;
  const numbers = `starts B1=${rB1.msg} B2=${rB2.msg} solo(m2)=${rSolo.msg} | all=${rAll.msg} fileOfB1+nBundleid=${rFileWithBundle.msg} fileOfB1-noBundleid=${rFileNoBundle.msg}${rFileNoBundle.msg === 1 ? ` (accepted: that file scanned ${dupFile}x)` : ''} | `
    + `finals=${dones.map(d => `${d?.cStatus}${d?.nCompleted}/${d?.nTotal}`).join(',')} hash.done=${hashes.map(x => x.done).join('/')} seen=${seens.join('/')} progressKeys=${allKeys.length} `
    + `events: crossBatch=${crossBatch} nonMonotonic=${nonMonotonic} nTotalChanged=${totalChanged} scans=${sc.totalCalls} (distinct ${sc.distinct}) interleaved=${overlap} `
    + `GET /hyperlinks m1=${listM1.value?.length || 0} m2=${listM2.value?.length || 0} notifications=${notif} singleFileWaitedBehindBundles=${soloWait.toFixed(1)}s wall=${wall.toFixed(1)}s`;
  await h.teardown();
  return verdict('Q3', pass, numbers, { hashes, listM1: listM1.value, listM2: listM2.value });
}
