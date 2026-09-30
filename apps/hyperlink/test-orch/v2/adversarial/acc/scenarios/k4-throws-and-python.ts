/**
 * K4 (d) - throws before python and python exit 0 with errors in the output.
 *   K4a (stub): file 'sync-1' -> createHyperlinkFile throws SYNCHRONOUSLY
 *        (not a rejected promise); file 'csv-1' -> csvPathFor throws
 *        synchronously (after the scan, before the SP); the others succeed.
 *        Every file must be counted exactly once, the batch must end (F,
 *        with reasons), nothing double counted, no job left in Bull.
 *   K4b (REAL HyperlinksearchService + python/fake_acc.py, every case exits 0):
 *        pgerr -> F ("Error inserting data into PostgreSQL" on stdout),
 *        tb -> F (traceback on stderr only), errmid -> C (the word Error in
 *        the middle of an INFO line must not fail the file), ok -> C.
 *        Informational: cr (error line hidden behind a '\r') and lower
 *        ("error:" lowercase) -- reported, not judged.
 */
import * as fs from 'fs';
import * as path from 'path';
import { HarnessV2, SCRATCH, bodyFor, verdict, sleep } from '../../../harness';
import { HyperlinksearchService } from '../../../../../src/services/hyperlinksearch/hyperlinksearch.service';

const FAKE_PY = path.join(__dirname, '..', 'python', 'fake_acc.py');
const file = (id: string) => ({ nBundledetailid: id, cFilename: `${id}.pdf`, cPath: `x/${id}.pdf` });

export async function run() {
  return [await throwsBeforePython(), await pythonExitZero()];
}

async function throwsBeforePython() {
  const h = new HarnessV2({ label: 'K4a' });
  await h.flush();
  h.db.getfiles = () => [file('sync-1'), file('csv-1'), file('ok-1'), file('ok-2')];
  h.scan = { delayMs: 20, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '3', HYPERLINK_FILE_BACKOFF_MS: '100' });
  // synchronous throws: plain functions, not async
  const origCreate = s.search.createHyperlinkFile;
  let syncThrows = 0, csvThrows = 0;
  s.search.createHyperlinkFile = function (f: any, ...rest: any[]) {
    if (f.nBundledetailid === 'sync-1') { syncThrows++; throw new Error('sync boom before spawn'); }
    return origCreate.apply(this, [f, ...rest]);
  };
  const origCsv = s.search.csvPathFor;
  s.search.csvPathFor = function (f: any, ...rest: any[]) {
    if (f.nBundledetailid === 'csv-1') { csvThrows++; throw new Error('sync boom in csvPathFor'); }
    return origCsv.apply(this, [f, ...rest]);
  };
  const r = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-K4a', nBundleid: 'B' }), false);
  const done = await h.waitForDone(r.data.queueName, 20000);
  await sleep(500);
  const hash = await h.redis.hgetall(`HYPERLINK-BATCH/${r.data.batchId}`);
  const seen = await h.redis.scard(`HYPERLINK-BATCH/${r.data.batchId}/seen`);
  const counts = await h.counts(s.fq);
  const reasons = Object.fromEntries((done?.jFailed || []).map(f => [f.nBundledetailid, f.cReason]));
  const bullFailed = h.bullEvents.filter(e => e.queue === 'hyperlink-file-queue' && e.event === 'failed').length;
  const notifs = h.notifications().map(e => e.data.cMsg.split(' | ')[0]);
  const pass = !!done && done.cStatus === 'F' && done.nTotal === 4 && done.nCompleted === 2 && done.nFailed === 2 && seen === 4
    && Number(hash.done) === 2 && Number(hash.failed) === 2 && !!reasons['sync-1'] && !!reasons['csv-1'] && /csvPathFor/.test(reasons['csv-1'])
    && counts.waiting + counts.active + counts.delayed + counts.failed === 0 && notifs.length === 1 && h.unhandled.length === 0;
  const numbers = `final=${done?.cStatus} ${done?.nCompleted}/${done?.nTotal} failed=${done?.nFailed} seen=${seen} hash=${hash.done}+${hash.failed} syncThrowAttempts=${syncThrows} csvThrows=${csvThrows} bullFailedEvents=${bullFailed} `
    + `reasons=${JSON.stringify(reasons)} queue=w${counts.waiting}/a${counts.active}/d${counts.delayed}/f${counts.failed} notifications=[${notifs.join(',')}] unhandledRejections=${h.unhandled.length}`;
  await h.teardown();
  return verdict('K4a', pass, numbers);
}

async function pythonExitZero() {
  const PID_DIR = path.join(SCRATCH, 'pids');
  process.env.ORCH_PID_DIR = PID_DIR;
  const h = new HarnessV2({ label: 'K4b' });
  await h.flush();
  const cfgOver = { PY_HYPERLINK: FAKE_PY, PY_HYPERLINK_SMART: FAKE_PY, PY_HYPERLINK_DEEP: FAKE_PY, HYPERLINK_WORKERS: '3', HYPERLINK_FILE_TIMEOUT_MIN: '0.5' };
  const real = new HyperlinksearchService(h.makeConfig(cfgOver));
  const s = await h.stack('w1', cfgOver, { realSearch: real });
  h.db.getfiles = () => [file('pgerr-1'), file('tb-1'), file('errmid-1'), file('ok-1'), file('cr-1'), file('lower-1')];
  const r = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-K4b', nBundleid: 'B' }), false, false, true);
  const done = await h.waitForDone(r.data.queueName, 60000);
  await sleep(300);
  const reasons = Object.fromEntries((done?.jFailed || []).map(f => [f.nBundledetailid, f.cReason]));
  const sp = Object.fromEntries(h.spCalls.filter(c => c.sp.startsWith('hyperlink_update_documents')).map(c => [c.nBundledetailid, c.cStatus]));
  const mustFail = ['pgerr-1', 'tb-1'].every(id => sp[id] === 'F' && !!reasons[id]);
  const mustPass = ['errmid-1', 'ok-1'].every(id => sp[id] === 'C' && !reasons[id]);
  const counts = await h.counts(s.fq);
  const pass = !!done && done.cStatus === 'F' && done.nTotal === 6 && mustFail && mustPass && /Error inserting data into PostgreSQL/.test(reasons['pgerr-1'] || '') && /stderr: Traceback/.test(reasons['tb-1'] || '')
    && counts.waiting + counts.active + counts.delayed + counts.failed === 0 && real.inFlight === 0;
  const numbers = `final=${done?.cStatus} ${done?.nCompleted}/${done?.nTotal} failed=${done?.nFailed} sp=${JSON.stringify(sp)} reasons=${JSON.stringify(reasons)} `
    + `| informational: cr(\\r-hidden error line)=${sp['cr-1']} lower("error:")=${sp['lower-1']} | pythonsRegistered=${real.inFlight} queue=w${counts.waiting}/a${counts.active}`;
  await h.teardown();
  return verdict('K4b', pass, numbers);
}
