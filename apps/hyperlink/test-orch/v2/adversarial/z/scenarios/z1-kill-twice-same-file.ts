/**
 * Z1 (a) - 2,000 files, the file worker killed and restarted TWICE, and the
 * same 3 files in flight at BOTH kills (they hang on w1 and w2, would succeed
 * on w3). Bull's maxStalledCount (1, production default and FAST_STALL) fails
 * a job for good on its second stall, so the guarantee under test is: the
 * batch still reaches ONE terminal state with total accounting == 2,000,
 * exactly one finalize / notification, no counter decrease, empty queue, and
 * the fast files are never scanned more than twice. Reported: exact scan
 * count vs 2,000 and what became of the 3 twice-stalled files.
 */
import { HarnessV2, FAST_STALL, bodyFor, makeFiles, now, verdict, sleep } from '../../../harness';
import { statusSeq } from '../util';

export async function run() {
  const N = 2000, FILE_MS = 20;
  const h = new HarnessV2({ label: 'Z1' });
  await h.flush();
  const files = makeFiles(N, 'z1');
  const SLOW = new Set(['z1-00001', 'z1-00002', 'z1-00003']);
  h.db.getfiles = () => files;
  h.scan = { delayMs: FILE_MS, result: (f, _n, tag) => (SLOW.has(f.nBundledetailid) && tag !== 'w3') ? 'hang' : true };
  const s1 = await h.stack('w1', { HYPERLINK_WORKERS: '3' }, { settings: FAST_STALL });
  const body = bodyFor({ nSectionid: 'S-Z1', nBundleid: 'B-Z1' });
  const res = await s1.gen.starthyperlink(body, false);
  const key = res.data.queueName, batchId = res.data.batchId;
  const t0 = now();
  // kill 1: the 3 slow files are in flight (FIFO: first picked), the rest waiting
  await h.waitFor(() => h.scanCalls.filter(c => c.tag === 'w1' && c.tEnd).length >= 30, 10000);
  const slowInFlight1 = [...SLOW].filter(id => h.scanCalls.some(c => c.tag === 'w1' && c.nBundledetailid === id && !c.tEnd)).length;
  const runningAtKill1 = h.scanCalls.filter(c => c.tag === 'w1' && !c.tEnd).length;
  const doneAtKill1 = h.scanCalls.filter(c => c.tag === 'w1' && c.tEnd).length;
  const tKill1 = now();
  h.killTag('w1'); await s1.bq.close(true); await s1.fq.close(true);
  const s2 = await h.stack('w2', { HYPERLINK_WORKERS: '3' }, { settings: FAST_STALL });
  // kill 2: as soon as the stalled re-run of the slow files is in flight on w2
  const rerun = await h.waitFor(() => [...SLOW].every(id => h.scanCalls.some(c => c.tag === 'w2' && c.nBundledetailid === id)), 60000);
  await sleep(500);
  const runningAtKill2 = h.scanCalls.filter(c => c.tag === 'w2' && !c.tEnd).length;
  const doneAtKill2 = h.scanCalls.filter(c => c.tEnd).length;
  const tKill2 = now();
  h.killTag('w2'); await s2.bq.close(true); await s2.fq.close(true);
  const s3 = await h.stack('w3', { HYPERLINK_WORKERS: '3' }, { settings: FAST_STALL });
  const done = await h.waitForDone(key, 120000);
  await sleep(1500);
  const wall = (now() - t0) / 1000;
  const sc = h.scanStats(batchId);
  const per = (tag: string) => h.scanCalls.filter(c => c.tag === tag).length;
  const slowScans = [...SLOW].map(id => h.scanCalls.filter(c => c.nBundledetailid === id).map(c => c.tag).join('+'));
  const fastMax = Math.max(...files.filter(f => !SLOW.has(f.nBundledetailid)).map(f => h.scanCalls.filter(c => c.nBundledetailid === f.nBundledetailid).length));
  const stalled = h.bullEvents.filter(e => e.event === 'stalled' && e.queue === 'hyperlink-file-queue').length;
  const bullFailed = h.bullEvents.filter(e => e.event === 'failed' && e.queue === 'hyperlink-file-queue');
  const seqInfo = statusSeq(h, key);
  const notif = h.notifications().map(e => e.data.cMsg.split(' | ')[0]);
  const hash = await h.redis.hgetall(`HYPERLINK-BATCH/${batchId}`);
  const seen = await h.redis.scard(`HYPERLINK-BATCH/${batchId}/seen`);
  const counts = await h.counts(s3.fq);
  const regress = h.regressions(key);
  const spC = h.spCalls.filter(c => c.sp.startsWith('hyperlink_update_documents') && c.cStatus === 'C').length;
  const spF = h.spCalls.filter(c => c.sp.startsWith('hyperlink_update_documents') && c.cStatus === 'F').length;
  const reasons = (done?.jFailed || []).map(f => `${f.nBundledetailid}:${f.cReason}`).join('; ');
  const pass = !!done && done.cStatus !== 'P' && Number(hash.done) + Number(hash.failed) === N && seen === N && done.nCompleted + done.nFailed === N
    && seqInfo.terminalEmits === 1 && notif.length === 1 && regress === 0 && fastMax <= 2 && sc.distinct === N
    && counts.waiting + counts.active + counts.delayed + counts.failed === 0 && Number(hash.finalized) === 1 && Number(hash.notified) === 1;
  const numbers = `scans=${sc.totalCalls} vs ${N} (extra=${sc.totalCalls - N}; kill1@${((tKill1 - t0) / 1000).toFixed(1)}s running=${runningAtKill1} slowInFlight=${slowInFlight1} done=${doneAtKill1}; rerunOnW2 after ${(rerun / 1000).toFixed(1)}s; kill2@${((tKill2 - t0) / 1000).toFixed(1)}s running=${runningAtKill2} done=${doneAtKill2}; w1=${per('w1')} w2=${per('w2')} w3=${per('w3')} dupFiles=${sc.moreThanOnce} fastMaxScans=${fastMax}) `
    + `slowFiles=[${slowScans.join(' ')}] stalledEvents=${stalled} bullFailedForGood=${bullFailed.length}${bullFailed.length ? ` ("${bullFailed[0].reason}")` : ''} `
    + `final=${done?.cStatus} ${done?.nCompleted}/${done?.nTotal} failed=${done?.nFailed} [${reasons}] hash=${hash.done}+${hash.failed}/${hash.total} seen=${seen} SP C/F=${spC}/${spF} terminalEmits=${seqInfo.terminalEmits} seqTail=${seqInfo.seq.slice(-6)} notifications=[${notif.join(',')}] counterDecreases=${regress} queue=w${counts.waiting}/a${counts.active}/d${counts.delayed}/f${counts.failed} wall=${wall.toFixed(1)}s`;
  await h.teardown();
  return verdict('Z1', pass, numbers, { sc, hash, counts, unhandled: h.unhandled });
}
