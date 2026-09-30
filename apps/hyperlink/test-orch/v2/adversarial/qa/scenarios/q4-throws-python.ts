/**
 * Q4 (d) - failures before / around python.
 *   Q4a (stub): one file whose createHyperlinkFile THROWS SYNCHRONOUSLY (not a
 *        rejected promise) before any python; one file whose SP throws; one
 *        file whose SP returns success:false. Expect the batch F with exactly
 *        those files failed, the sync-throw file invoked twice (Bull attempt 2
 *        counts it as F "spawn: ..."), the others once, one notification.
 *   Q4b (REAL HyperlinksearchService + fake python): exit 0 with "Error
 *        inserting data into PostgreSQL" on stdout -> F; exit 4 -> F; an error
 *        line without a trailing newline -> F; a clean file -> C; an error only
 *        on STDERR with exit 0 -> recorded (design contract is stdout-only).
 */
import * as path from 'path';
import { HarnessV2, SCRATCH, bodyFor, makeFiles, verdict, sleep } from '../../../harness';
import { HyperlinksearchService } from '../../../../../src/services/hyperlinksearch/hyperlinksearch.service';

export async function run() {
  return [await stubThrows(), await realPython()];
}

async function stubThrows() {
  const N = 8;
  const h = new HarnessV2({ label: 'Q4a' });
  await h.flush();
  const files = makeFiles(N, 'q4a');
  files[1].nBundledetailid = 'q4a-sync'; files[3].nBundledetailid = 'q4a-spthrow'; files[5].nBundledetailid = 'q4a-spfalse';
  h.db.getfiles = () => files;
  h.scan = { delayMs: 20, result: true };
  h.db.update = (p) => p.nBundledetailid === 'q4a-spthrow' ? new Error('pg connection terminated') : p.nBundledetailid === 'q4a-spfalse' ? { success: false, data: [] } : { success: true, data: [[{ msg: 1 }]] };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '2' });
  const orig = s.search.createHyperlinkFile;
  let syncCalls = 0;
  s.search.createHyperlinkFile = (file: any, ...rest: any[]) => {
    if (file.nBundledetailid === 'q4a-sync') { syncCalls++; throw new Error('sync boom before spawn'); }
    return orig(file, ...rest);
  };
  const r = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-Q4a', nBundleid: 'B' }), false);
  const done = await h.waitForDone(r.data.queueName, 15000);
  await sleep(500);
  const reasons: Record<string, string> = {};
  for (const e of done?.jFailed || []) reasons[e.nBundledetailid] = e.cReason;
  const spF = h.spCalls.filter(c => c.sp.startsWith('hyperlink_update_documents') && c.cStatus === 'F').map(c => c.nBundledetailid);
  const bullFailed = h.bullEvents.filter(e => e.queue === 'hyperlink-file-queue' && e.event === 'failed').length;
  const notif = h.notifications().map(e => e.data.cMsg);
  const pass = done?.cStatus === 'F' && done.nFailed === 3 && done.nCompleted === N - 3 && syncCalls === 2
    && /^spawn: sync boom/.test(reasons['q4a-sync'] || '') && /^sp: pg connection terminated/.test(reasons['q4a-spthrow'] || '') && /^sp: .*success:false/.test(reasons['q4a-spfalse'] || '')
    && notif.length === 1 && /3 failure/.test(notif[0]) && h.unhandled.length === 0;
  const numbers = `final=${done?.cStatus} ${done?.nCompleted}/${done?.nTotal} failed=${done?.nFailed} syncThrowInvocations=${syncCalls} (attempt 2 counted) bullFailedEvents=${bullFailed} `
    + `reasons=${JSON.stringify(reasons)} SP'F'for=[${spF.join(',')}] notification="${notif[0]}" unhandled=${h.unhandled.length}`;
  await h.teardown();
  return verdict('Q4a', pass, numbers, { reasons });
}

async function realPython() {
  const h = new HarnessV2({ label: 'Q4b' });
  await h.flush();
  const fake = path.join(__dirname, '..', 'python', 'fake_qa.py');
  const over = { HYPERLINK_WORKERS: '3', PY_HYPERLINK: fake, PY_HYPERLINK_SMART: fake, PY_HYPERLINK_DEEP: fake, HYPERLINK_FILE_TIMEOUT_MIN: '0.5', HYPERLINK_OUTPUT_PATH: path.join(SCRATCH, 'hl_out'), TEMP_PATH: path.join(SCRATCH, 'hl_tmp') };
  const realSearch = new HyperlinksearchService(h.makeConfig(over));
  const ids = ['pgerr-1', 'exit4-1', 'nonl-1', 'ok-1', 'stderr-1'];
  h.db.getfiles = () => ids.map(id => ({ nBundledetailid: id, cFilename: `${id}.pdf`, cPath: `x/${id}.pdf` }));
  const s = await h.stack('w1', over, { realSearch });
  const r = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-Q4b', nBundleid: 'B', isSmartscan: true }), false);
  const done = await h.waitForDone(r.data.queueName, 40000);
  await sleep(500);
  const reasons: Record<string, string> = {};
  for (const e of done?.jFailed || []) reasons[e.nBundledetailid] = e.cReason;
  const spByFile: Record<string, string> = {};
  for (const c of h.spCalls) if (c.sp.startsWith('hyperlink_update_documents')) spByFile[c.nBundledetailid] = c.cStatus;
  const stderrOk = spByFile['stderr-1'] === 'C';
  const pass = done?.cStatus === 'F' && /Error inserting data into PostgreSQL/.test(reasons['pgerr-1'] || '') && /^exit 0:/.test(reasons['pgerr-1'] || '')
    && /^exit 4:/.test(reasons['exit4-1'] || '') && /^exit 0: Error: no newline/.test(reasons['nonl-1'] || '') && spByFile['ok-1'] === 'C'
    && spByFile['pgerr-1'] === 'F' && spByFile['exit4-1'] === 'F' && spByFile['nonl-1'] === 'F' && done.nFailed === 3 + (stderrOk ? 0 : 1);
  const numbers = `final=${done?.cStatus} ${done?.nCompleted}/${done?.nTotal} failed=${done?.nFailed} reasons=${JSON.stringify(reasons)} SP=${JSON.stringify(spByFile)} `
    + `stderrOnlyErrorExit0=${stderrOk ? 'C (stdout-only contract: NOT detected)' : 'F'} pythonsInFlightAtEnd=${realSearch.inFlight}`;
  await h.teardown();
  return verdict('Q4b', pass, numbers, { reasons, spByFile });
}
