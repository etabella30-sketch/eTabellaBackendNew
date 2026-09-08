/**
 * A13 - Overlapping scopes (owner decision D5). The same file must never be
 * scanned by two batches at once, even when the request does not say which
 * bundle the file belongs to:
 *   bundle B1 running (its files are looked up from the batch's expected set)
 *     - single file of B1 WITH nBundleid            -> -1
 *     - single file of B1 WITHOUT nBundleid         -> -1 (expected set)
 *     - a file of another bundle WITHOUT nBundleid  -> 1  (runs alongside)
 *     - whole section                                -> -1
 *     - another bundle B2                            -> 1
 *     - while B1 is still LOADING its files (expected set unknown) every
 *       single-file request without nBundleid is refused (conservative)
 *   whole section running: bundle -> -1, single file -> -1 (both ways)
 *   single-file batch WITHOUT nBundleid running: a bundle request -> -1
 *     (conservative), the same file with nBundleid -> -1
 *   after everything finished every scope is accepted again; no file was
 *   ever scanned by two batches at the same time.
 */
import { HarnessV2, bodyFor, makeFiles, verdict, sleep } from '../harness';

export async function run() {
  const h = new HarnessV2({ label: 'A13' });
  await h.flush();
  const b1 = makeFiles(12, 'b1'), b2 = makeFiles(6, 'b2');
  const other = [{ nBundledetailid: 'other-1', cFilename: 'o1.pdf', cPath: 'x/o1.pdf' }, { nBundledetailid: 'other-2', cFilename: 'o2.pdf', cPath: 'x/o2.pdf' }];
  const all = [...b1, ...b2, ...other];
  h.db.getfiles = async (q) => {
    if (q.nBundledetailid) return all.filter(f => f.nBundledetailid === q.nBundledetailid);
    if (q.nBundleid === 'B1') { await sleep(700); return b1; }
    if (q.nBundleid === 'B2') return b2;
    if (q.nBundleid === 'B3') return [other[1]];
    return all;
  };
  h.scan = { delayMs: (f) => f.nBundledetailid === 'other-2' ? 1500 : 150, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '2' });
  const S = 'S-A13';
  const enqueued = (batchId: string) => h.waitFor(async () => (await h.redis.hget(`HYPERLINK-BATCH/${batchId}`, 'enqueueDone')) === '1', 5000);
  const r: Record<string, any> = {};

  r.B1 = await s.gen.starthyperlink(bodyFor({ nSectionid: S, nBundleid: 'B1' }), false);
  await sleep(200);                                                        // B1's orchestrator is inside hyperlink_getfiles (700 ms)
  r.loadingFile = await s.gen.starthyperlink(bodyFor({ nSectionid: S, nBundledetailid: 'b1-00003' }), false);
  r.loadingOther = await s.gen.starthyperlink(bodyFor({ nSectionid: S, nBundledetailid: 'other-1' }), false);
  await enqueued(r.B1.data.batchId);
  r.fileWithBundle = await s.gen.starthyperlink(bodyFor({ nSectionid: S, nBundleid: 'B1', nBundledetailid: 'b1-00003' }), false);
  r.fileNoBundle = await s.gen.starthyperlink(bodyFor({ nSectionid: S, nBundledetailid: 'b1-00003' }), false);
  r.section = await s.gen.starthyperlink(bodyFor({ nSectionid: S }), false);
  r.B2 = await s.gen.starthyperlink(bodyFor({ nSectionid: S, nBundleid: 'B2' }), false);
  if (r.B2.msg === 1) await enqueued(r.B2.data.batchId);
  r.otherFile = await s.gen.starthyperlink(bodyFor({ nSectionid: S, nBundledetailid: 'other-1' }), false);
  const doneB1 = await h.waitForDone(r.B1.data.queueName, 20000);
  const doneB2 = r.B2.msg === 1 ? await h.waitForDone(r.B2.data.queueName, 20000) : null;
  const doneOther = r.otherFile.msg === 1 ? await h.waitForDone(r.otherFile.data.queueName, 20000) : null;

  // whole section running
  r.all = await s.gen.starthyperlink(bodyFor({ nSectionid: S }), false);
  await sleep(150);
  r.bundleWhileAll = await s.gen.starthyperlink(bodyFor({ nSectionid: S, nBundleid: 'B1' }), false);
  r.fileWhileAll = await s.gen.starthyperlink(bodyFor({ nSectionid: S, nBundledetailid: 'b2-00001' }), false);
  const doneAll = await h.waitForDone(r.all.data.queueName, 30000);

  // single-file batch without nBundleid running (1.5 s scan)
  r.solo = await s.gen.starthyperlink(bodyFor({ nSectionid: S, nBundledetailid: 'other-2' }), false);
  await h.waitFor(() => h.scanCalls.some(c => c.nBundledetailid === 'other-2' && c.batchId === r.solo.data?.batchId), 5000);
  r.bundleWhileSolo = await s.gen.starthyperlink(bodyFor({ nSectionid: S, nBundleid: 'B3' }), false);
  r.soloWithBundle = await s.gen.starthyperlink(bodyFor({ nSectionid: S, nBundleid: 'B3', nBundledetailid: 'other-2' }), false);
  const doneSolo = await h.waitForDone(r.solo.data.queueName, 20000);

  // everything finished: accepted again
  r.afterB1 = await s.gen.starthyperlink(bodyFor({ nSectionid: S, nBundleid: 'B1' }), false);
  const doneAfter = await h.waitForDone(r.afterB1.data.queueName, 20000);
  await sleep(300);

  // no file scanned by two batches at the same time
  let concurrentSameFile = 0;
  const byFile = new Map<string, { t: number; tEnd: number }[]>();
  for (const c of h.scanCalls) { const l = byFile.get(c.nBundledetailid) || []; l.push({ t: c.t, tEnd: c.tEnd || Infinity }); byFile.set(c.nBundledetailid, l); }
  for (const l of byFile.values()) for (let i = 0; i < l.length; i++) for (let j = i + 1; j < l.length; j++) if (l[i].t < l[j].tEnd && l[j].t < l[i].tEnd) concurrentSameFile++;

  const m = (k: string) => r[k]?.msg;
  const pass = m('B1') === 1 && m('loadingFile') === -1 && m('loadingOther') === -1 && m('fileWithBundle') === -1 && m('fileNoBundle') === -1 && m('section') === -1
    && m('B2') === 1 && m('otherFile') === 1 && doneB1?.cStatus === 'C' && doneB2?.cStatus === 'C' && doneOther?.cStatus === 'C'
    && m('all') === 1 && m('bundleWhileAll') === -1 && m('fileWhileAll') === -1 && doneAll?.cStatus === 'C' && doneAll.nTotal === all.length
    && m('solo') === 1 && m('bundleWhileSolo') === -1 && m('soloWithBundle') === -1 && doneSolo?.cStatus === 'C'
    && m('afterB1') === 1 && doneAfter?.cStatus === 'C' && concurrentSameFile === 0;
  const numbers = `B1=${m('B1')} | while B1 loads files: fileOfB1(noBundleid)=${m('loadingFile')} otherFile(noBundleid)=${m('loadingOther')} | B1 enqueued: fileOfB1+nBundleid=${m('fileWithBundle')} fileOfB1(noBundleid)=${m('fileNoBundle')} `
    + `wholeSection=${m('section')} B2=${m('B2')} otherFile(noBundleid)=${m('otherFile')} -> B1=${doneB1?.cStatus} B2=${doneB2?.cStatus} other=${doneOther?.cStatus} `
    + `| section running: all=${m('all')} bundle=${m('bundleWhileAll')} file=${m('fileWhileAll')} -> ${doneAll?.cStatus} ${doneAll?.nCompleted}/${doneAll?.nTotal} `
    + `| single file (noBundleid) running: solo=${m('solo')} bundle=${m('bundleWhileSolo')} sameFile+nBundleid=${m('soloWithBundle')} -> ${doneSolo?.cStatus} | afterwards B1=${m('afterB1')} -> ${doneAfter?.cStatus} `
    + `| scans=${h.scanCalls.length} sameFileScannedConcurrently=${concurrentSameFile}`;
  await h.teardown();
  return verdict('A13', pass, numbers, { msgs: Object.fromEntries(Object.entries(r).map(([k, v]) => [k, (v as any).msg])) });
}
