/**
 * S4 - False success.
 *  (a) createHyperlinkFile true but the SP says no -> still counted as completed.
 *  (b) real python (assets/pythons/hyperlink/smarthyperlink.py): download failure /
 *      DB unreachable print "Error: ..." and exit 0 -> REAL HyperlinksearchService
 *      resolves true -> file counted as 'C'.
 *  (c) python hangs forever: working-tree per-file kill timer vs production (no timer).
 */
import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { Harness, REPO_ROOT, SCRATCH, bodyFor, flushDb9, makeFiles, now, out, rel, sleep } from '../harness';
import { HyperlinksearchService } from '../../src/services/hyperlinksearch/hyperlinksearch.service';

const HANG_PY = path.join(__dirname, '..', 'python', 'hang.py');
const PID_DIR = path.join(SCRATCH, 'pids');

async function partA() {
  const cases: Record<string, () => any> = {
    spReturnsSuccessFalse: () => ({ success: false, data: [] }),
    spReturnsMsgMinus1: () => ({ success: true, data: [[{ msg: -1 }]] }),
    spThrows: () => new Error('SP hyperlink_update_documents failed'),
  };
  const r: any = {};
  for (const [name, update] of Object.entries(cases)) {
    const h = new Harness({ label: 'S4a-' + name });
    await h.flush();
    h.db.getfiles = () => makeFiles(20, 'd');
    h.db.update = update;
    h.search = { delayMs: 10, result: true };
    const q = h.newQueue('w1');
    const gen = h.makeGenerator(q);
    const res = await gen.starthyperlink(bodyFor({ nSectionid: 'S4a' }), false);
    h.registerWorker(q, 'w1', h.makeProcessor());
    await h.waitForIdle([q], 30000);
    const last = h.lastResponce(res.data.queueName);
    r[name] = { lastEmitted: { nTotal: last.nTotal, nCompleted: last.nCompleted, nFailed: last.nFailed, cStatus: last.cStatus }, spCalls: h.spStats(), bull: h.bullEvents.filter(e => e.event === 'completed' || e.event === 'failed').map(e => e.event), notificationTexts: [...new Set(h.notifications().map(e => e.data.cMsg))] };
    await h.teardown(); await flushDb9();
  }
  return r;
}

async function partB() {
  const r: any = {};
  // -- (b1) exit codes measured directly with pytest (scratchpad/test_smarthyperlink_exit.py)
  const pytestFile = path.join(SCRATCH, 'test_smarthyperlink_exit.py');
  const py = spawnSync('python', ['-m', 'pytest', '-q', '-p', 'no:cacheprovider', pytestFile], {
    cwd: SCRATCH, encoding: 'utf8',
    env: { ...process.env, PYTHONIOENCODING: 'UTF-8', ORCH_REPO: REPO_ROOT, ORCH_SCRATCH: SCRATCH, DB_HOST: '127.0.0.1', DB_PORT: '1', DB_DATABASE: 'orchtest', DB_USERNAME: 'x', DB_PASSWORD: 'x', SMART_DRYRUN: '', SMART_LOCAL: '' },
  });
  r.pytest = { status: py.status, tail: (py.stdout || '').split('\n').slice(-6).join('\n'), stderr: (py.stderr || '').slice(0, 500) };
  const resultsFile = path.join(SCRATCH, 'smarthyperlink_exit_results.json');
  r.pythonRuns = fs.existsSync(resultsFile) ? JSON.parse(fs.readFileSync(resultsFile, 'utf8')) : 'pytest did not write results';

  // -- (b2) the REAL HyperlinksearchService.createHyperlinkFile on those same inputs
  const h = new Harness({ label: 'S4b' });
  await h.flush();
  const cfg = h.makeConfig({ HYPERLINK_FILE_TIMEOUT_MIN: '45' });
  const real = new HyperlinksearchService(cfg);
  const pdf = path.join(SCRATCH, 'orch_small.pdf');
  const jobData: any = { queueName: 'HYPERLINK/m1/c1/S4b/null', nSectionid: 'S4b', nMasterid: 'm1', nCaseid: 'c1', isDeepscan: false, isSmartscan: true, cType: 'E', cKeeptype: 'R', nTotal: 2, nCompleted: 0, nFailed: 0, cStatus: 'P' };
  const cases = [
    { label: 'non-existent S3 key, download from 127.0.0.1:1 fails', file: { nBundledetailid: 'nx-1', cFilename: 'missing.pdf', cPath: 'does/not/exist/missing.pdf' }, env: {} },
    { label: 'real small PDF, DB_HOST=127.0.0.1 DB_PORT=1 unreachable (SMART_LOCAL=1)', file: { nBundledetailid: 'pdf-1', cFilename: 'orch_small.pdf', cPath: pdf }, env: { SMART_LOCAL: '1' } },
  ];
  r.realService = [];
  for (const c of cases) {
    const saved = { ...process.env };
    Object.assign(process.env, c.env);
    const before = h.consoleLines.length;
    const t = now();
    const ret = await real.createHyperlinkFile(c.file as any, jobData, path.join(SCRATCH, 'hl_db', 'search_termsS4b.txt'));
    process.env = saved as any;
    const lines = h.consoleLines.slice(before).filter(l => /Error|SMART|exited with code|usage/.test(l)).map(l => l.replace(/[\r\n]+/g, ' ').trim().slice(0, 220));
    r.realService.push({ case: c.label, createHyperlinkFileReturned: ret, ms: now() - t, pythonOutput: lines });
  }
  // -- (b3) same two files through the REAL processor: what gets counted
  h.realSearch = real;
  h.db.getfiles = () => cases.map(c => c.file as any);
  process.env.SMART_LOCAL = '1';
  const q = h.newQueue('w1');
  const gen = h.makeGenerator(q);
  const res = await gen.starthyperlink(bodyFor({ nSectionid: 'S4b' }), false, false, true);
  h.registerWorker(q, 'w1', h.makeProcessor(cfg));
  await h.waitForIdle([q], 60000);
  delete process.env.SMART_LOCAL;
  const last = h.lastResponce(res.data.queueName);
  r.processorWithRealPython = { lastEmitted: { nTotal: last.nTotal, nCompleted: last.nCompleted, nFailed: last.nFailed, cStatus: last.cStatus }, spCalls: h.spStats(), notificationTexts: [...new Set(h.notifications().map(e => e.data.cMsg))] };
  await h.teardown(); await flushDb9();
  return r;
}

function livePids(): number[] {
  const alive: number[] = [];
  for (const f of fs.readdirSync(PID_DIR)) {
    const pid = parseInt(f, 10);
    try { process.kill(pid, 0); alive.push(pid); } catch { /* gone */ }
  }
  return alive;
}
function killAll(pids: number[]) { for (const p of pids) { try { process.kill(p); } catch { } } }
function clearPidDir() { for (const f of fs.readdirSync(PID_DIR)) fs.unlinkSync(path.join(PID_DIR, f)); }

async function partC() {
  const r: any = {};
  process.env.ORCH_PID_DIR = PID_DIR;
  // -- patched: kill timer, HYPERLINK_FILE_TIMEOUT_MIN=0.02 (clamped to 1 min by Math.max(1, ...) at hyperlinksearch.service.ts:105)
  {
    clearPidDir();
    const h = new Harness({ label: 'S4c-patched' });
    await h.flush();
    const cfg = h.makeConfig({ PY_HYPERLINK_SMART: HANG_PY, PY_HYPERLINK: HANG_PY, HYPERLINK_FILE_TIMEOUT_MIN: '0.02' });
    h.realSearch = new HyperlinksearchService(cfg);
    const files = [{ nBundledetailid: 'hang-1', cFilename: 'hang.pdf', cPath: 'x/hang.pdf' }, { nBundledetailid: 'ok-2', cFilename: 'ok.pdf', cPath: 'x/ok.pdf' }];
    h.db.getfiles = () => files;
    const q = h.newQueue('w1');
    const gen = h.makeGenerator(q);
    const res = await gen.starthyperlink(bodyFor({ nSectionid: 'S4c' }), false, false, true);
    const t0 = now();
    h.registerWorker(q, 'w1', h.makeProcessor(cfg));
    const idle = await h.waitForIdle([q], 150000);
    const fCall = h.spCalls.find(c => c.nBundledetailid === 'hang-1');
    const cCall = h.spCalls.find(c => c.nBundledetailid === 'ok-2');
    const last = h.lastResponce(res.data.queueName);
    r.patchedKillTimer = {
      configuredMin: 0.02, effectiveTimerMs: Math.max(1, Number('0.02') || 45) * 60 * 1000, idle,
      secondsUntilHungFileMarked: fCall ? +((fCall.t - t0) / 1000).toFixed(1) : null, hungFileStatus: fCall?.cStatus,
      nextFileProcessed: !!cCall, nextFileStatus: cCall?.cStatus, secondsUntilJobDone: +((h.runs[0].end - t0) / 1000).toFixed(1),
      lastEmitted: { nTotal: last.nTotal, nCompleted: last.nCompleted, nFailed: last.nFailed, cStatus: last.cStatus },
      bull: h.bullEvents.filter(e => e.event === 'completed' || e.event === 'failed').map(e => e.event), pythonsStillAlive: livePids().length,
      killLogLine: h.consoleLines.find(l => l.includes('exceeded'))?.slice(0, 160),
    };
    killAll(livePids());
    await h.teardown(); await flushDb9();
  }
  // -- production: no kill timer (neutralised with HYPERLINK_FILE_TIMEOUT_MIN=35000 -> 24 days), Bull timeout 1 h scaled to 3 s, backoff 5 min scaled to 1 s
  {
    clearPidDir();
    const h = new Harness({ label: 'S4c-prod', resumeNeutralised: true });
    await h.flush();
    const cfg = h.makeConfig({ PY_HYPERLINK_SMART: HANG_PY, PY_HYPERLINK: HANG_PY, HYPERLINK_FILE_TIMEOUT_MIN: '35000' });
    h.realSearch = new HyperlinksearchService(cfg);
    const files = [{ nBundledetailid: 'hang-1', cFilename: 'hang.pdf', cPath: 'x/hang.pdf' }, { nBundledetailid: 'ok-2', cFilename: 'ok.pdf', cPath: 'x/ok.pdf' }];
    h.db.getfiles = () => files;
    const q = h.newQueue('w1');
    const gen = h.makeGenerator(q);
    const t0 = now();
    const { res } = await h.submitScaled(gen, q, bodyFor({ nSectionid: 'S4c' }), { timeout: 3000, backoff: 1000 });
    h.registerWorker(q, 'w1', h.makeProcessor(cfg));
    // wait until Bull has given up (3 failed events) plus a grace period
    for (let i = 0; i < 120 && h.bullEvents.filter(e => e.event === 'failed').length < 3; i++) await sleep(250);
    await sleep(1500);
    const failed = h.bullEvents.filter(e => e.event === 'failed');
    const alive = livePids();
    r.productionNoTimer = {
      secondsUntilBullGaveUp: failed.length ? +((failed[failed.length - 1].t - t0) / 1000).toFixed(1) : null,
      bullFailed: failed.map(e => ({ at: rel(e.t), attemptsMade: e.attemptsMade, reason: e.reason })),
      bullCountsAfterGiveUp: await h.counts(q),
      handlerRunsStarted: h.runs.length, handlerRunsStillRunning: h.runs.filter(x => !x.end).length,
      hungPythonProcessesAlive: alive.length, pythonPids: alive,
      lockKeyStillPresent: !!(await h.redis.exists(res.data.queueName)), lockKeyTtl: await h.redis.ttl(res.data.queueName), keys: await h.appKeys(),
      lastEmitted: (() => { const l = h.lastResponce(res.data.queueName); return l ? { nTotal: l.nTotal, nCompleted: l.nCompleted, nFailed: l.nFailed, cStatus: l.cStatus } : null; })(),
      spCallsSoFar: h.spStats(),
      note: 'in production the timeout is 1 h and backoff 5 min: the 3rd attempt fails at ~3h10 and every hung python stays alive; the lock key is never deleted',
    };
    killAll(alive);                                   // manual operator action: only way out
    await h.waitForIdle([q], 30000);
    r.productionNoTimer.afterManualKill = { runsEnded: h.runs.filter(x => x.end).length, lockKeyStillPresent: !!(await h.redis.exists(res.data.queueName)), spCalls: h.spStats(), bullErrors: h.bullEvents.filter(e => e.event === 'error').map(e => e.reason).slice(0, 3) };
    await h.teardown(); await flushDb9();
  }
  delete process.env.ORCH_PID_DIR;
  return r;
}

export async function run() {
  const r: any = {};
  r.a = await partA(); out(JSON.stringify({ S4a: r.a }, null, 1));
  r.b = await partB(); out(JSON.stringify({ S4b: r.b }, null, 1));
  r.c = await partC(); out(JSON.stringify({ S4c: r.c }, null, 1));
  return r;
}
