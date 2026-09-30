/**
 * X4 (d) - throws and false-success probes.
 *   X4a stub: one file whose createHyperlinkFile throws SYNCHRONOUSLY (non-async
 *       function) on every call, one that rejects on every call, one that
 *       returns a result object with ok:false and no reason. Expect: each
 *       counted exactly once as F (the two throwers after Bull's one retry),
 *       batch F with 3 failures + the ok files C, reasons present.
 *   X4b REAL HyperlinksearchService + fake_adv.py: exit 0 + "Error inserting
 *       data into PostgreSQL" -> F; error line split across two stdout chunks
 *       -> F; look-alike lines ("ERRORS: 0", "no Error here") -> C; "Error:" on
 *       stderr only + exit 0 -> reported as is.
 *   X4c REAL service with a non-existent python binary (spawn ENOENT): retried
 *       once by Bull, then F "spawn: ...", exactly one count.
 *   X4d a throw OUTSIDE the handler's try (batch.isCancelled = Redis error) on
 *       both attempts of one file: is the file ever counted / the batch
 *       finalized? (§3.6 "never let a throw escape uncounted")
 */
import * as path from 'path';
import { HarnessV2, bodyFor, makeFiles, verdict, sleep } from '../../harness';
import { HyperlinksearchService } from '../../../../src/services/hyperlinksearch/hyperlinksearch.service';

const FAKE_PY = path.join(__dirname, '..', 'python', 'fake_adv.py');
const file = (id: string) => ({ nBundledetailid: id, cFilename: `${id}.pdf`, cPath: `x/${id}.pdf` });

export async function run() {
  return [await stubThrows(), await realPythonContract(), await enoent(), await throwOutsideTry()];
}

async function stubThrows() {
  const h = new HarnessV2({ label: 'X4a' });
  await h.flush();
  const files = [file('sync-1'), file('reject-1'), file('noreason-1'), ...makeFiles(5, 'ok')];
  h.db.getfiles = () => files;
  h.scan = { delayMs: 10, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '3' });
  const base = s.search;
  const calls: Record<string, number> = {};
  // non-async wrapper: a synchronous throw happens inside the `await expr` of the handler's try
  s.fileProcessor['search'] = {
    ...base,
    createHyperlinkFile: (f: any, jd: any, terms: string, batchId?: string) => {
      calls[f.nBundledetailid] = (calls[f.nBundledetailid] || 0) + 1;
      if (f.nBundledetailid === 'sync-1') throw new Error('sync boom before python');
      if (f.nBundledetailid === 'reject-1') return Promise.reject(new Error('async reject before python'));
      if (f.nBundledetailid === 'noreason-1') return Promise.resolve({ ok: false, code: 7 });
      return base.createHyperlinkFile(f, jd, terms, batchId);
    },
  };
  const res = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-X4a', nBundleid: 'B' }), false);
  const done = await h.waitForDone(res.data.queueName, 20000);
  await sleep(500);
  const reasons = Object.fromEntries((done?.jFailed || []).map(f => [f.nBundledetailid, f.cReason]));
  const failedEvents = h.bullEvents.filter(e => e.queue === 'hyperlink-file-queue' && e.event === 'failed').length;
  const hash = await h.redis.hgetall(`HYPERLINK-BATCH/${res.data.batchId}`);
  const pass = done?.cStatus === 'F' && done.nTotal === 8 && done.nFailed === 3 && done.nCompleted === 5
    && calls['sync-1'] === 2 && calls['reject-1'] === 2 && calls['noreason-1'] === 1
    && /spawn: sync boom/.test(reasons['sync-1'] || '') && /spawn: async reject/.test(reasons['reject-1'] || '') && !!reasons['noreason-1'] && Number(hash.failed) === 3;
  const numbers = `final=${done?.cStatus} ${done?.nCompleted}/${done?.nTotal} failed=${done?.nFailed} hash=${hash.done}+${hash.failed}/${hash.total} calls sync=${calls['sync-1']} reject=${calls['reject-1']} noreason=${calls['noreason-1']} bullFailedEvents=${failedEvents} `
    + `reasons: sync="${reasons['sync-1']}" reject="${reasons['reject-1']}" noreason="${reasons['noreason-1']}"`;
  await h.teardown();
  return verdict('X4a', pass, numbers);
}

async function realPythonContract() {
  const h = new HarnessV2({ label: 'X4b' });
  await h.flush();
  const cfgOver = { PY_HYPERLINK: FAKE_PY, PY_HYPERLINK_SMART: FAKE_PY, PY_HYPERLINK_DEEP: FAKE_PY, HYPERLINK_WORKERS: '3' };
  const real = new HyperlinksearchService(h.makeConfig(cfgOver));
  const s = await h.stack('w1', cfgOver, { realSearch: real });
  h.db.getfiles = () => [file('dbexit0-1'), file('errsplit-1'), file('okwarn-1'), file('stderr0-1')];
  const res = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-X4b', nBundleid: 'B' }), false, false, true);
  const done = await h.waitForDone(res.data.queueName, 30000);
  const reasons = Object.fromEntries((done?.jFailed || []).map(f => [f.nBundledetailid, f.cReason]));
  const spC = h.spCalls.filter(c => c.cStatus === 'C').map(c => c.nBundledetailid);
  const pass = /Error inserting data into PostgreSQL/.test(reasons['dbexit0-1'] || '') && /exit 0: Error: split across chunks/.test(reasons['errsplit-1'] || '')
    && !reasons['okwarn-1'] && spC.includes('okwarn-1');
  const numbers = `final=${done?.cStatus} ${done?.nCompleted}/${done?.nTotal} failed=${done?.nFailed} dbexit0="${reasons['dbexit0-1']}" errsplit="${reasons['errsplit-1']}" okwarn=${reasons['okwarn-1'] ? `F "${reasons['okwarn-1']}"` : 'C'} `
    + `stderr0=${reasons['stderr0-1'] ? `F "${reasons['stderr0-1']}"` : 'C (stderr not part of the contract)'} SP C for=[${spC.join(',')}]`;
  await h.teardown();
  return verdict('X4b', pass, numbers);
}

async function enoent() {
  const h = new HarnessV2({ label: 'X4c' });
  await h.flush();
  const cfgOver = { pythonV: 'no-such-python-binary-xyz', PY_HYPERLINK: FAKE_PY, PY_HYPERLINK_SMART: FAKE_PY, HYPERLINK_WORKERS: '3' };
  const real = new HyperlinksearchService(h.makeConfig(cfgOver));
  const s = await h.stack('w1', cfgOver, { realSearch: real });
  h.db.getfiles = () => [file('enoent-1'), file('enoent-2')];
  const res = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-X4c', nBundleid: 'B' }), false, false, true);
  const done = await h.waitForDone(res.data.queueName, 20000);
  await sleep(300);
  const failedEvents = h.bullEvents.filter(e => e.queue === 'hyperlink-file-queue' && e.event === 'failed');
  const hash = await h.redis.hgetall(`HYPERLINK-BATCH/${res.data.batchId}`);
  const seen = await h.redis.scard(`HYPERLINK-BATCH/${res.data.batchId}/seen`);
  const reasons = (done?.jFailed || []).map(f => f.cReason);
  const pass = done?.cStatus === 'F' && done.nFailed === 2 && done.nCompleted === 0 && Number(hash.failed) === 2 && seen === 2
    && failedEvents.length === 2 && reasons.every(r => /^spawn: /.test(r) && /ENOENT/.test(r));
  const numbers = `final=${done?.cStatus} ${done?.nCompleted}/${done?.nTotal} failed=${done?.nFailed} hash.failed=${hash.failed} seen=${seen} bullRetries=${failedEvents.length} reasons=[${reasons.map(r => `"${r}"`).join(',')}] notifications=${h.notifications().length}`;
  await h.teardown();
  return verdict('X4c', pass, numbers);
}

async function throwOutsideTry() {
  const h = new HarnessV2({ label: 'X4d' });
  await h.flush();
  h.db.getfiles = () => makeFiles(2, 'x4d');
  h.scan = { delayMs: 10, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '1' });
  // isCancelled throws (Redis blip) for the first 3 calls: f1 attempt 1, f2 attempt 1, f1 attempt 2 -> f1 exhausts its attempts
  const orig = s.batch.isCancelled.bind(s.batch);
  let n = 0;
  s.batch.isCancelled = async (batchId: string) => { n++; if (n <= 3) throw new Error(`simulated redis error #${n}`); return orig(batchId); };
  const res = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-X4d', nBundleid: 'B' }), false);
  const done = await h.waitForDone(res.data.queueName, 6000);
  const snap = await h.snapshot(res.data.queueName);
  const hash = await h.redis.hgetall(`HYPERLINK-BATCH/${res.data.batchId}`);
  const counts = await h.counts(s.fq);
  const failedEvents = h.bullEvents.filter(e => e.queue === 'hyperlink-file-queue' && e.event === 'failed');
  const pass = !!done && done.cStatus !== 'P';
  const numbers = `isCancelledThrows=3 bullFailedEvents=${failedEvents.length} after 6 s: key=${snap?.cStatus} ${snap?.nCompleted}/${snap?.nTotal} hash=${hash.done}+${hash.failed}/${hash.total} finalized=${hash.finalized || 0} `
    + `queue=w${counts.waiting}/a${counts.active}/d${counts.delayed}/f${counts.failed} notifications=${h.notifications().length} terminal=${pass}`;
  await h.teardown();
  return verdict('X4d', pass, numbers);
}
