/**
 * K3 (c) - two bundles of the same section plus one single-file job of the
 * same section (file of a third bundle) started in the SAME instant.
 *   K3a: all three accepted; keys, hashes, seen / jobs sets and counters are
 *        isolated (no id of one batch in another batch's sets; scans per
 *        batch == its own files; every SP call carries the file's own
 *        batch); 3 notifications; no section-lock key left behind.
 *   K3b: B1 and B2 running, B1 cancelled at 1 s: B2 is untouched (its scans
 *        continue, it ends C 150/150, its jobs / seen sets intact, none of
 *        its jobs removed by the drain) while B1 ends X; the single-file
 *        request of a file that B2 owns is refused while B2 runs, one of a
 *        foreign file is accepted.
 */
import { HarnessV2, bodyFor, makeFiles, now, verdict, sleep } from '../../../harness';

const solo = (id: string) => ({ nBundledetailid: id, cFilename: `${id}.pdf`, cPath: `x/${id}.pdf` });

export async function run() {
  return [await threeAtOnce(), await cancelOneOfTwo()];
}

async function threeAtOnce() {
  const N = 150;
  const h = new HarnessV2({ label: 'K3a' });
  await h.flush();
  const b1 = makeFiles(N, 'b1'), b2 = makeFiles(N, 'b2'), f3 = [solo('solo-1')];
  h.db.getfiles = (q) => q.nBundledetailid === 'solo-1' ? f3 : q.nBundleid === 'B1' ? b1 : q.nBundleid === 'B2' ? b2 : [];
  h.scan = { delayMs: 15, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '3' });
  const bodies = [bodyFor({ nSectionid: 'S-K3', nBundleid: 'B1' }), bodyFor({ nSectionid: 'S-K3', nBundleid: 'B2' }), bodyFor({ nSectionid: 'S-K3', nBundleid: 'B3', nBundledetailid: 'solo-1' })];
  const t0 = now();
  const rs = await Promise.all(bodies.map(b => s.gen.starthyperlink(b, false)));
  const startTook = now() - t0;
  const accepted = rs.filter(r => r.msg === 1).length;
  const keys = rs.map(r => r.data?.queueName), ids = rs.map(r => r.data?.batchId);
  const dones = await Promise.all(keys.map(k => h.waitForDone(k, 60000)));
  await sleep(300);
  const hashes = await Promise.all(ids.map(id => h.redis.hgetall(`HYPERLINK-BATCH/${id}`)));
  const seen = await Promise.all(ids.map(id => h.redis.smembers(`HYPERLINK-BATCH/${id}/seen`)));
  const jobs = await Promise.all(ids.map(id => h.redis.smembers(`HYPERLINK-BATCH/${id}/jobs`)));
  const own = [new Set(b1.map(f => f.nBundledetailid)), new Set(b2.map(f => f.nBundledetailid)), new Set(['solo-1'])];
  let leaks = 0;
  for (let i = 0; i < 3; i++) for (const x of [...seen[i], ...jobs[i]]) if (!own[i].has(x)) leaks++;
  const scans = ids.map(id => h.scanStats(id));
  const scansOwn = ids.map((id, i) => h.scanCalls.filter(c => c.batchId === id).every(c => own[i].has(c.nBundledetailid)));
  const spOk = h.spCalls.filter(c => c.sp.startsWith('hyperlink_update_documents')).length === 2 * N + 1;
  const notifs = h.notifications().length;
  const distinctKeys = new Set(keys).size;
  const lockKeys = (await h.appKeys()).filter(k => k.startsWith('HYPERLINK-SECTION-LOCK')).length;
  const regress = keys.map(k => h.regressions(k)).reduce((a, b) => a + b, 0);
  const pass = accepted === 3 && distinctKeys === 3 && dones.every(d => d?.cStatus === 'C') && dones[0]?.nCompleted === N && dones[1]?.nCompleted === N && dones[2]?.nCompleted === 1
    && hashes[0].total === String(N) && hashes[1].total === String(N) && hashes[2].total === '1' && leaks === 0
    && scans[0].totalCalls === N && scans[1].totalCalls === N && scans[2].totalCalls === 1 && scansOwn.every(Boolean) && spOk && notifs === 3 && lockKeys === 0 && regress === 0;
  const numbers = `3 starts at once took ${startTook}ms accepted=${accepted}/3 keys=${distinctKeys} finals=[${dones.map(d => `${d?.cStatus} ${d?.nCompleted}/${d?.nTotal}`).join(', ')}] hash.totals=[${hashes.map(x => x.total).join(',')}] `
    + `seen=[${seen.map(x => x.length).join(',')}] jobs=[${jobs.map(x => x.length).join(',')}] crossBatchIds=${leaks} scansPerBatch=[${scans.map(x => x.totalCalls).join(',')}] scansOwnFilesOnly=${scansOwn.every(Boolean)} spCalls=${h.spCalls.filter(c => c.sp.startsWith('hyperlink_update_documents')).length} notifications=${notifs} sectionLockLeft=${lockKeys} counterDecreases=${regress}`;
  await h.teardown();
  return verdict('K3a', pass, numbers, { hashes });
}

async function cancelOneOfTwo() {
  const N = 150;
  const h = new HarnessV2({ label: 'K3b' });
  await h.flush();
  const b1 = makeFiles(N, 'c1'), b2 = makeFiles(N, 'c2');
  h.db.getfiles = (q) => q.nBundledetailid ? [solo(q.nBundledetailid)] : q.nBundleid === 'B1' ? b1 : q.nBundleid === 'B2' ? b2 : [];
  h.scan = { delayMs: 30, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '3' });
  const body1 = bodyFor({ nSectionid: 'S-K3b', nBundleid: 'B1' }), body2 = bodyFor({ nSectionid: 'S-K3b', nBundleid: 'B2' });
  const [r1, r2] = await Promise.all([s.gen.starthyperlink(body1, false), s.gen.starthyperlink(body2, false)]);
  const k1 = r1.data.queueName, k2 = r2.data.queueName, id1 = r1.data.batchId, id2 = r2.data.batchId;
  await h.waitFor(async () => (await h.redis.hget(`HYPERLINK-BATCH/${id2}`, 'enqueueDone')) === '1', 5000, 20);
  // single-file requests without nBundleid while both bundles run
  const rOwned = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-K3b', nBundledetailid: 'c2-00100' }), false);
  const rForeign = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-K3b', nBundledetailid: 'foreign-1' }), false);
  await sleep(1000);
  const b2JobsBefore = await h.redis.scard(`HYPERLINK-BATCH/${id2}/jobs`);
  const b2DoneAtCancel = Number(await h.redis.hget(`HYPERLINK-BATCH/${id2}`, 'done'));
  const tC = now();
  const cancel = await s.gen.cancelhyperlink({ nCaseid: 'c1', nSectionid: 'S-K3b', nBundleid: 'B1' } as any);
  const b2Scans = () => h.scanCalls.filter(c => c.batchId === id2).length;
  const b2ScansAtCancel = b2Scans();
  const d2 = await h.waitForDone(k2, 60000);
  const dF = rForeign.msg === 1 ? await h.waitForDone(rForeign.data.queueName, 30000) : null;
  await sleep(500);
  const s1 = await h.snapshot(k1);
  const b1ScansAfter = h.scanCalls.filter(c => c.batchId === id1 && c.t > tC + 50).length;
  const b2ScansAfter = b2Scans() - b2ScansAtCancel;
  const b2Jobs = await h.redis.scard(`HYPERLINK-BATCH/${id2}/jobs`);
  const b2Seen = await h.redis.scard(`HYPERLINK-BATCH/${id2}/seen`);
  const h2 = await h.redis.hgetall(`HYPERLINK-BATCH/${id2}`);
  const h1 = await h.redis.hgetall(`HYPERLINK-BATCH/${id1}`);
  const counts = await h.counts(s.fq);
  const notifs = h.notifications().map(e => e.data.cMsg.split(' | ')[0]);
  const pass = r1.msg === 1 && r2.msg === 1 && rOwned.msg === -1 && rForeign.msg === 1 && cancel.msg === 1 && s1?.cStatus === 'X'
    && d2?.cStatus === 'C' && d2.nCompleted === N && Number(h2.done) === N && h2.cancelled !== '1' && b2Seen === N && b2Jobs === N && b2JobsBefore === N
    && h.scanStats(id2).totalCalls === N && b2ScansAfter > 0 && b1ScansAfter === 0 && (cancel.removed || 0) <= N && dF?.cStatus === 'C'
    && counts.waiting + counts.active + counts.delayed === 0 && notifs.length === 3;
  const numbers = `B1=${r1.msg} B2=${r2.msg} fileOwnedByB2(noBundleid)=${rOwned.msg} foreignFile(noBundleid)=${rForeign.msg} | cancel B1 @1s msg=${cancel.msg} removed=${cancel.removed} -> B1=${s1?.cStatus} ${s1?.nCompleted}/${s1?.nTotal} (hash cancelled=${h1.cancelled}) b1ScansAfterCancel=${b1ScansAfter} `
    + `| B2 at cancel done=${b2DoneAtCancel} -> ${d2?.cStatus} ${d2?.nCompleted}/${d2?.nTotal} hash.done=${h2.done} cancelled=${h2.cancelled || 0} scans=${h.scanStats(id2).totalCalls} scansAfterCancel=${b2ScansAfter} jobsSet=${b2JobsBefore}->${b2Jobs} seen=${b2Seen} | foreign file -> ${dF?.cStatus} | queue=w${counts.waiting}/a${counts.active}/d${counts.delayed} notifications=[${notifs.join(', ')}]`;
  await h.teardown();
  return verdict('K3b', pass, numbers);
}
