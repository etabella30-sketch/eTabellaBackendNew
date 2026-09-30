/**
 * Z4 (d) - throws before python, and exit 0 with the PostgreSQL error line.
 *   Z4a (stub, plain non-async functions so the throw is SYNCHRONOUS):
 *        'once-1' throws on attempt 1 only -> Bull retry (backoff 100 ms) ->
 *        C, scanned once; 'twice-1' throws on both attempts -> F 'spawn:',
 *        never scanned; 'spthrow-1' -> the SP throws -> F 'sp:' (scanned
 *        once). Batch F 2/4 (ok-1 C), every file counted once, queue empty,
 *        one notification.
 *   Z4b (REAL HyperlinksearchService + python/fake_z.py): pgerr0 (exit 0 +
 *        error line) -> F with the SP called with 'F'; pgerr4 (exit 4) -> F;
 *        nonl (error line without trailing newline as the last output) -> F;
 *        late (error line 0.2 s after the summary) -> F; okish (the words
 *        inside normal lines) -> C; ok -> C.
 */
import * as path from 'path';
import { HarnessV2, bodyFor, verdict, sleep } from '../../../harness';
import { HyperlinksearchService } from '../../../../../src/services/hyperlinksearch/hyperlinksearch.service';

const FAKE_PY = path.join(__dirname, '..', 'python', 'fake_z.py');
const file = (id: string) => ({ nBundledetailid: id, cFilename: `${id}.pdf`, cPath: `x/${id}.pdf` });

export async function run() { return [await syncThrows(), await exitZero()]; }

async function syncThrows() {
  const h = new HarnessV2({ label: 'Z4a' });
  await h.flush();
  h.db.getfiles = () => [file('once-1'), file('twice-1'), file('spthrow-1'), file('ok-1')];
  h.scan = { delayMs: 20, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '3', HYPERLINK_FILE_BACKOFF_MS: '100' });
  const origCreate = s.search.createHyperlinkFile;
  const throws: Record<string, number> = { 'once-1': 0, 'twice-1': 0 };
  s.search.createHyperlinkFile = function (f: any, ...rest: any[]) {
    if (f.nBundledetailid === 'once-1' && throws['once-1'] === 0) { throws['once-1']++; throw new Error('sync boom once'); }
    if (f.nBundledetailid === 'twice-1') { throws['twice-1']++; throw new Error('sync boom always'); }
    return origCreate.apply(this, [f, ...rest]);
  };
  h.db.update = (p: any) => { if (p.nBundledetailid === 'spthrow-1') return new Error('sync SP boom'); return { success: true, data: [[{ msg: 1 }]] }; };
  const r = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-Z4a', nBundleid: 'B' }), false);
  const done = await h.waitForDone(r.data.queueName, 20000);
  await sleep(500);
  const hash = await h.redis.hgetall(`HYPERLINK-BATCH/${r.data.batchId}`);
  const seen = await h.redis.scard(`HYPERLINK-BATCH/${r.data.batchId}/seen`);
  const counts = await h.counts(s.fq);
  const reasons = Object.fromEntries((done?.jFailed || []).map(f => [f.nBundledetailid, f.cReason]));
  const scans = (id: string) => h.scanCalls.filter(c => c.nBundledetailid === id).length;
  const bullFailed = h.bullEvents.filter(e => e.queue === 'hyperlink-file-queue' && e.event === 'failed').map(e => `${e.jobId?.split(':').pop()}:${e.reason}`);
  const notifs = h.notifications().map(e => e.data.cMsg.split(' | ')[0]);
  const pass = !!done && done.cStatus === 'F' && done.nTotal === 4 && done.nCompleted === 2 && done.nFailed === 2 && seen === 4 && Number(hash.done) === 2 && Number(hash.failed) === 2
    && throws['once-1'] === 1 && throws['twice-1'] === 2 && scans('once-1') === 1 && scans('twice-1') === 0 && scans('spthrow-1') === 1
    && /spawn/.test(reasons['twice-1'] || '') && /^sp:/.test(reasons['spthrow-1'] || '') && !reasons['once-1']
    && counts.waiting + counts.active + counts.delayed + counts.failed === 0 && notifs.length === 1 && h.unhandled.length === 0;
  const numbers = `final=${done?.cStatus} ${done?.nCompleted}/${done?.nTotal} failed=${done?.nFailed} seen=${seen} hash=${hash.done}+${hash.failed} throws once/twice=${throws['once-1']}/${throws['twice-1']} scans once/twice/spthrow/ok=${scans('once-1')}/${scans('twice-1')}/${scans('spthrow-1')}/${scans('ok-1')} bullFailedEvents=[${bullFailed.join(' ; ')}] reasons=${JSON.stringify(reasons)} queue=w${counts.waiting}/a${counts.active}/d${counts.delayed}/f${counts.failed} notifications=[${notifs.join(',')}] unhandled=${h.unhandled.length}`;
  await h.teardown();
  return verdict('Z4a', pass, numbers);
}

async function exitZero() {
  const h = new HarnessV2({ label: 'Z4b' });
  await h.flush();
  const cfgOver = { PY_HYPERLINK: FAKE_PY, PY_HYPERLINK_SMART: FAKE_PY, PY_HYPERLINK_DEEP: FAKE_PY, HYPERLINK_WORKERS: '3', HYPERLINK_FILE_TIMEOUT_MIN: '0.5' };
  const real = new HyperlinksearchService(h.makeConfig(cfgOver));
  const s = await h.stack('w1', cfgOver, { realSearch: real });
  const ids = ['pgerr0-1', 'pgerr4-1', 'nonl-1', 'late-1', 'okish-1', 'ok-1'];
  h.db.getfiles = () => ids.map(file);
  const r = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-Z4b', nBundleid: 'B' }), false, false, true);
  const done = await h.waitForDone(r.data.queueName, 60000);
  await sleep(300);
  const reasons = Object.fromEntries((done?.jFailed || []).map(f => [f.nBundledetailid, f.cReason]));
  const sp = Object.fromEntries(h.spCalls.filter(c => c.sp.startsWith('hyperlink_update_documents')).map(c => [c.nBundledetailid, c.cStatus]));
  const spNames = new Set(h.spCalls.filter(c => c.sp.startsWith('hyperlink_update_documents')).map(c => c.sp));
  const counts = await h.counts(s.fq);
  const mustF = ['pgerr0-1', 'pgerr4-1', 'nonl-1', 'late-1'].every(id => sp[id] === 'F' && /Error inserting|ERROR: late/.test(reasons[id] || ''));
  const mustC = ['okish-1', 'ok-1'].every(id => sp[id] === 'C' && !reasons[id]);
  const pass = !!done && done.cStatus === 'F' && done.nTotal === 6 && done.nFailed === 4 && done.nCompleted === 2 && mustF && mustC && real.inFlight === 0
    && counts.waiting + counts.active + counts.delayed + counts.failed === 0 && [...spNames].join() === 'hyperlink_update_documents_v2';
  const numbers = `final=${done?.cStatus} ${done?.nCompleted}/${done?.nTotal} failed=${done?.nFailed} sp=${JSON.stringify(sp)} (${[...spNames].join()}) reasons=${JSON.stringify(reasons)} pythonsRegistered=${real.inFlight} queue=w${counts.waiting}/a${counts.active}`;
  await h.teardown();
  return verdict('Z4b', pass, numbers);
}
