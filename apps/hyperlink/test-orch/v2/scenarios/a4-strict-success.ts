/**
 * A4 - Strict success. REAL HyperlinksearchService + a fake python
 * (python/fake_smart.py) whose behaviour depends on the nBundledetailid:
 *  (a) exit 0 + "Error: ..." -> F with reason; exit 3 -> F; DB error line -> F; ok -> C
 *  (b) SP {msg:-1} for every file -> all F, cStatus 'F', notification "completed with N failure(s)"
 *  (c) hung python + kill timer (HYPERLINK_FILE_TIMEOUT_MIN=0.05 = 3 s) -> F after
 *      the timer, the batch continues and finishes; no python left alive.
 */
import * as fs from 'fs';
import * as path from 'path';
import { HarnessV2, SCRATCH, bodyFor, now, verdict, sleep } from '../harness';
import { HyperlinksearchService } from '../../../src/services/hyperlinksearch/hyperlinksearch.service';

const FAKE_PY = path.join(__dirname, '..', 'python', 'fake_smart.py');
const PID_DIR = path.join(SCRATCH, 'pids');

function livePids(): number[] {
  const alive: number[] = [];
  for (const f of fs.readdirSync(PID_DIR)) {
    const pid = parseInt(f, 10);
    try { process.kill(pid, 0); alive.push(pid); } catch { /* gone */ }
  }
  return alive;
}
function clearPidDir() { for (const f of fs.readdirSync(PID_DIR)) fs.unlinkSync(path.join(PID_DIR, f)); }
const file = (id: string) => ({ nBundledetailid: id, cFilename: `${id}.pdf`, cPath: `x/${id}.pdf` });

export async function run() {
  process.env.ORCH_PID_DIR = PID_DIR;
  clearPidDir();
  const h = new HarnessV2({ label: 'A4' });
  await h.flush();
  const cfgOver = { PY_HYPERLINK: FAKE_PY, PY_HYPERLINK_SMART: FAKE_PY, PY_HYPERLINK_DEEP: FAKE_PY, HYPERLINK_WORKERS: '3', HYPERLINK_FILE_TIMEOUT_MIN: '0.05' };
  const real = new HyperlinksearchService(h.makeConfig(cfgOver));
  const s = await h.stack('w1', cfgOver, { realSearch: real });

  // (a) python contract
  h.db.getfiles = (q) => q.nBundleid === 'A' ? [file('err0-1'), file('exit3-1'), file('dberr-1'), file('ok-1')] : q.nBundleid === 'B' ? [file('ok-2'), file('ok-3')] : [file('hang-1'), file('ok-4')];
  const rA = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-A4', nBundleid: 'A' }), false, false, true);
  const doneA = await h.waitForDone(rA.data.queueName, 30000);
  const reasons = Object.fromEntries((doneA?.jFailed || []).map(f => [f.nBundledetailid, f.cReason]));
  const okA = doneA?.cStatus === 'F' && doneA.nTotal === 4 && doneA.nCompleted === 1 && doneA.nFailed === 3
    && /exit 0: Error/.test(reasons['err0-1'] || '') && /exit 3/.test(reasons['exit3-1'] || '') && /Error inserting data into PostgreSQL/.test(reasons['dberr-1'] || '')
    && h.spCalls.filter(c => c.cStatus === 'C').length === 1 && h.spCalls.filter(c => c.cStatus === 'F').length === 3;
  const notifA = h.notifications().map(e => e.data.cMsg).pop();

  // (b) SP says no
  h.db.update = () => ({ success: true, data: [[{ msg: -1 }]] });
  const before = h.notifications().length;
  const rB = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-A4', nBundleid: 'B' }), false, false, true);
  const doneB = await h.waitForDone(rB.data.queueName, 30000);
  const notifB = h.notifications().slice(before).map(e => e.data.cMsg).pop();
  const okB = doneB?.cStatus === 'F' && doneB.nTotal === 2 && doneB.nFailed === 2 && doneB.nCompleted === 0
    && (doneB.jFailed || []).every(f => /^sp: /.test(f.cReason)) && /completed with 2 failure\(s\)/.test(notifB || '');
  h.db.update = undefined;

  // (c) hung python
  const t0 = now();
  const rC = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-A4', nBundleid: 'C' }), false, false, true);
  const doneC = await h.waitForDone(rC.data.queueName, 30000);
  const secToDone = (now() - t0) / 1000;
  const hangReason = (doneC?.jFailed || []).find(f => f.nBundledetailid === 'hang-1')?.cReason;
  await sleep(500);
  const alive = livePids();
  const okC = doneC?.cStatus === 'F' && doneC.nCompleted === 1 && doneC.nFailed === 1 && /timeout/.test(hangReason || '') && secToDone >= 3 && secToDone < 15 && alive.length === 0;
  for (const p of alive) { try { process.kill(p); } catch { } }
  delete process.env.ORCH_PID_DIR;

  const pass = okA && okB && okC && /completed with 3 failure\(s\)/.test(notifA || '');
  const numbers = `(a) ${doneA?.nCompleted}/${doneA?.nTotal} failed=${doneA?.nFailed} status=${doneA?.cStatus} reasons={err0:"${reasons['err0-1']}", exit3:"${reasons['exit3-1']}", dberr:"${(reasons['dberr-1'] || '').slice(0, 60)}"} notification="${notifA}" `
    + `| (b) SP msg -1: ${doneB?.nCompleted}/${doneB?.nTotal} failed=${doneB?.nFailed} status=${doneB?.cStatus} reason="${doneB?.jFailed?.[0]?.cReason}" notification="${notifB}" `
    + `| (c) hang: status=${doneC?.cStatus} ${doneC?.nCompleted}/${doneC?.nTotal} failed=${doneC?.nFailed} reason="${hangReason}" doneAfter=${secToDone.toFixed(1)}s (timer 3 s) pythonsAlive=${alive.length}`;
  await h.teardown();
  return verdict('A4', pass, numbers);
}
