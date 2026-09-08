/**
 * C - createHyperlinkFile failure modes through the REAL processor:
 *  C1 stub throws synchronously / returns a rejected promise / hangs (no kill timer)
 *  C2 real HyperlinksearchService, python binary missing (spawn ENOENT)
 *  C3 real HyperlinksearchService, python writes to stderr but exits 0
 *  C4 stub hangs on file 2 with no kill timer, Bull timeout 2 s x 3 attempts (production)
 */
import * as fs from 'fs';
import * as path from 'path';
import { Harness, SCRATCH, bodyFor, flushDb9, makeFiles, now, out, queueWith, secs, sleep, summarise } from './common';
import { HyperlinksearchService } from '../../src/services/hyperlinksearch/hyperlinksearch.service';

const PY_DIR = path.join(__dirname, 'python');
const PID_DIR = path.join(SCRATCH, 'pids');
const livePids = () => fs.readdirSync(PID_DIR).map(f => parseInt(f, 10)).filter(p => { try { process.kill(p, 0); return true; } catch { return false; } });
const clearPids = () => { for (const f of fs.readdirSync(PID_DIR)) fs.unlinkSync(path.join(PID_DIR, f)); };

async function c1() {
  const h = new Harness({ label: 'C1' });
  await h.flush();
  const files = [{ nBundledetailid: 'sync-throw', cFilename: 'a.pdf', cPath: 'a' }, { nBundledetailid: 'reject', cFilename: 'b.pdf', cPath: 'b' }, { nBundledetailid: 'ok', cFilename: 'c.pdf', cPath: 'c' }];
  h.db.getfiles = () => files;
  const q = queueWith(h, 'w');
  const gen = h.makeGenerator(q);
  const t0 = now();
  const res = await gen.starthyperlink(bodyFor({ nSectionid: 'C1' }), false);
  const proc = h.makeProcessor();
  const calls: string[] = [];
  // NOT async: a synchronous throw is thrown by the call expression itself, before any await
  (proc as any).hyperlinksearchService = {
    createHyperlinkFile(file: any) {
      calls.push(file.nBundledetailid);
      if (file.nBundledetailid === 'sync-throw') throw new Error('synchronous throw from createHyperlinkFile');
      if (file.nBundledetailid === 'reject') return Promise.reject(new Error('rejected promise'));
      return Promise.resolve(true);
    },
  };
  h.registerWorker(q, 'w', proc);
  const idle = await h.waitForIdle([q], 20000);
  const s = await summarise(h, q, res.data.queueName, t0);
  const result = { idle, calls, perFileSp: h.spCalls.filter(c => c.nBundledetailid).map(c => `${c.nBundledetailid}:${c.cStatus}`), lastPopup: s.lastPopup, bull: s.bull, notifications: s.notifications, lockKeyAtEnd: s.lockKeyAtEnd, wallSeconds: secs(now() - t0) };
  await h.teardown(); await flushDb9();
  return result;
}

async function realVariant(label: string, cfgOver: Record<string, any>, files: any[], envOver: Record<string, string>) {
  clearPids();
  const h = new Harness({ label });
  await h.flush();
  const cfg = h.makeConfig(cfgOver);
  h.realSearch = new HyperlinksearchService(cfg);
  h.db.getfiles = () => files;
  const q = queueWith(h, 'w');
  const gen = h.makeGenerator(q);
  const saved = { ...process.env };
  Object.assign(process.env, { ORCH_PID_DIR: PID_DIR, ...envOver });
  const t0 = now();
  const res = await gen.starthyperlink(bodyFor({ nSectionid: label }), false, false, true);
  h.registerWorker(q, 'w', h.makeProcessor(cfg));
  const idle = await h.waitForIdle([q], 60000);
  process.env = saved as any;
  const s = await summarise(h, q, res.data.queueName, t0);
  const errLines = h.consoleLines.filter(l => /ERROR|exited with code|ENOENT|Warning/.test(l)).map(l => l.replace(/[\r\n]+/g, ' ').trim().slice(0, 160)).slice(0, 6);
  const result = { idle, wallSeconds: secs(now() - t0), perFileSp: h.spCalls.filter(c => c.nBundledetailid).map(c => `${c.nBundledetailid}:${c.cStatus}`), lastPopup: s.lastPopup, bull: s.bull, notifications: s.notifications, lockKeyAtEnd: s.lockKeyAtEnd, pythonsAlive: livePids().length, consoleSample: errLines };
  for (const p of livePids()) { try { process.kill(p); } catch { } }
  await h.teardown(); await flushDb9();
  return result;
}

async function c4() {
  clearPids();
  const h = new Harness({ resumeNeutralised: true, label: 'C4' });
  await h.flush();
  const files = makeFiles(3, 'h');
  h.db.getfiles = () => files;
  h.search = { delayMs: 20, result: (f) => (f.nBundledetailid === 'h-00002' ? 'hang' : true) };
  const q = queueWith(h, 'w');
  const gen = h.makeGenerator(q);
  const t0 = now();
  const { res } = await h.submitScaled(gen, q, bodyFor({ nSectionid: 'C4' }), { timeout: 2000, backoff: 500 });
  h.registerWorker(q, 'w', h.makeProcessor());
  for (let i = 0; i < 80 && h.bullEvents.filter(e => e.event === 'failed').length < 3; i++) await sleep(250);
  await sleep(1000);
  const s = await summarise(h, q, res.data.queueName, t0);
  const result = { secondsUntilBullGaveUp: secs((h.bullEvents.filter(e => e.event === 'failed').slice(-1)[0]?.t || now()) - t0), runsStarted: h.runs.length, runsStillHung: h.runs.filter(r => !r.end).length, scanCalls: s.scanCalls, perFileDistribution: s.perFileDistribution, sp: s.sp, lastPopup: s.lastPopup, lockTtl: s.lockTtl, lockKeyPresent: !!s.lockKeyAtEnd, bullCounts: s.bullCounts, bull: s.bull, note: 'production: 1 h timeout x 3 + 5 min x 2 = 3 h 10 before Bull gives up; the three hung handler runs and the lock key stay forever (patched tree: kill timer >= 1 min frees the file)' };
  await h.teardown(); await flushDb9();
  return result;
}

export async function run() {
  const r: any = {};
  r.c1_syncThrow_reject = await c1(); out(JSON.stringify(r.c1_syncThrow_reject, null, 1));
  r.c2_pythonBinaryMissing = await realVariant('C2', { pythonV: 'no-such-python-binary-xyz' }, makeFiles(3, 'e'), {});
  out(JSON.stringify(r.c2_pythonBinaryMissing, null, 1));
  r.c3_stderrButExit0 = await realVariant('C3', { PY_HYPERLINK_SMART: path.join(PY_DIR, 'stderr_then_ok.py'), HYPERLINK_FILE_TIMEOUT_MIN: '45' }, makeFiles(2, 'w'), { SLEEP_S: '1' });
  out(JSON.stringify(r.c3_stderrButExit0, null, 1));
  r.c4_hangNoTimer = await c4(); out(JSON.stringify(r.c4_hangNoTimer, null, 1));
  return r;
}
