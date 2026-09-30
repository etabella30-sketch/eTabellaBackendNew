/**
 * Q9 - cancel under the production process model. ecosystem.config.js runs
 * 'hyperlink' with instances 'max' / cluster mode, so file jobs of one batch
 * are in flight in SEVERAL processes while POST /cancelhyperlink lands in one
 * of them. The in-flight python registry (HyperlinksearchService) is per
 * process. Two stacks with the REAL HyperlinksearchService and a hanging fake
 * python (2 workers each -> 4 pythons alive); cancel through stack 1. Design
 * §3 Cancel: "kill registered in-flight pythons of that batch".
 * Measured: pythons alive 1 s after the cancel, per process.
 */
import * as fs from 'fs';
import * as path from 'path';
import { HarnessV2, SCRATCH, bodyFor, verdict, sleep } from '../../../harness';
import { HyperlinksearchService } from '../../../../../src/services/hyperlinksearch/hyperlinksearch.service';

const alive = (pid: number) => { try { process.kill(pid, 0); return true; } catch { return false; } };

export async function run() {
  const h = new HarnessV2({ label: 'Q9' });
  await h.flush();
  const pidDir = path.join(SCRATCH, 'pids');
  for (const f of fs.readdirSync(pidDir)) { try { fs.unlinkSync(path.join(pidDir, f)); } catch { /* ignore */ } }
  const fake = path.join(__dirname, '..', 'python', 'fake_qa.py');
  const over = { HYPERLINK_WORKERS: '2', PY_HYPERLINK: fake, PY_HYPERLINK_SMART: fake, PY_HYPERLINK_DEEP: fake, HYPERLINK_FILE_TIMEOUT_MIN: '0.25', HYPERLINK_OUTPUT_PATH: path.join(SCRATCH, 'hl_out'), TEMP_PATH: path.join(SCRATCH, 'hl_tmp') };
  const search1 = new HyperlinksearchService(h.makeConfig(over));
  const search2 = new HyperlinksearchService(h.makeConfig(over));
  const ids = Array.from({ length: 8 }, (_, i) => `hang-q9-${i + 1}`);
  h.db.getfiles = () => ids.map(id => ({ nBundledetailid: id, cFilename: `${id}.pdf`, cPath: `x/${id}.pdf` }));
  const s1 = await h.stack('p1', over, { realSearch: search1 });
  const s2 = await h.stack('p2', over, { realSearch: search2 });
  const r = await s1.gen.starthyperlink(bodyFor({ nSectionid: 'S-Q9', nBundleid: 'B' }), false);
  const key = r.data.queueName, batchId = r.data.batchId;
  await h.waitFor(() => search1.inFlight + search2.inFlight >= 4, 8000);
  await sleep(800);
  const pidsBefore = fs.readdirSync(pidDir).map(f => Number(f.replace('.pid', '')));
  const aliveBefore = pidsBefore.filter(alive).length;
  const inFlight = { p1: search1.inFlight, p2: search2.inFlight };
  const c = await s1.gen.cancelhyperlink({ nCaseid: 'c1', nSectionid: 'S-Q9', nBundleid: 'B' } as any);
  await sleep(1000);
  const aliveAfter = pidsBefore.filter(alive).length;
  const stillInFlight = { p1: search1.inFlight, p2: search2.inFlight };
  const snap = await h.snapshot(key);
  // let the per-file timer (15 s) and/or the cleanup kill the survivors
  const killedByCleanup = search2.killBatch(batchId);
  await sleep(600);
  const aliveEnd = pidsBefore.filter(alive).length;
  const hash = await h.redis.hgetall(`HYPERLINK-BATCH/${batchId}`);
  const allKilled = aliveAfter === 0;
  const numbers = `pythons alive before cancel=${aliveBefore} (p1 inFlight=${inFlight.p1}, p2 inFlight=${inFlight.p2}) -> cancel via p1 msg=${c.msg} killed=${c.killed} -> 1 s later alive=${aliveAfter} (p1=${stillInFlight.p1}, p2=${stillInFlight.p2}) key=${snap?.cStatus} `
    + `| survivors killed by test cleanup=${killedByCleanup}, aliveEnd=${aliveEnd} hash.cancelled=${hash.cancelled}`;
  await h.teardown();
  return verdict('Q9', allKilled, numbers, { inFlight, stillInFlight });
}
