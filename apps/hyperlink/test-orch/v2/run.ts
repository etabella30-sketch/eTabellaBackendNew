/**
 * One-command acceptance run for the v2 hyperlink orchestration (A1..A18).
 *
 *   cd "D:\etabella tech\etabella_backend-rt"
 *   set TS_NODE_TRANSPILE_ONLY=1 && set PYTHONIOENCODING=UTF-8 && npx ts-node -r tsconfig-paths/register apps/hyperlink/test-orch/v2/run.ts [A1 A5 ...]
 *
 * Prints one "<id> PASS|FAIL: <numbers>" line per scenario and a summary;
 * exit code 0 only when every scenario passed. Redis DB 9 is flushed before
 * and after every scenario. Results: <scratchpad>/orch-v2-results.json.
 */
import * as fs from 'fs';
import * as path from 'path';
import { SCRATCH, flushDb9, out, now, Verdict } from './harness';

process.chdir(SCRATCH); // hyperlinksearch.service appends hyperlink_test.txt to cwd; keep it out of the repo
for (const d of ['hl_db', 'hl_out', 'hl_tmp', 'pids']) fs.mkdirSync(path.join(SCRATCH, d), { recursive: true });

const ALL: Record<string, string> = {
  A1: './scenarios/a1-no-duplicate-work', A2: './scenarios/a2-worker-restart', A3: './scenarios/a3-lock',
  A4: './scenarios/a4-strict-success', A5: './scenarios/a5-cancel', A6: './scenarios/a6-throughput',
  A7: './scenarios/a7-stale-lock', A8: './scenarios/a8-popup-compat', A9: './scenarios/a9-index-untouched',
  A10: './scenarios/a10-python-exit-codes',
  A11: './scenarios/a11-cancel-restart-during-getfiles', A12: './scenarios/a12-cancel-finished-and-race', A13: './scenarios/a13-overlapping-scopes',
  A14: './scenarios/a14-ttl-stale-snapshot-guard', A15: './scenarios/a15-bull-failed-handler',
  A16: './scenarios/a16-lost-finalize-window', A17: './scenarios/a17-queue-fairness-takeover-stale', A18: './scenarios/a18-cancel-accuracy-legacy',
};

async function main() {
  const wanted = process.argv.slice(2).length ? process.argv.slice(2).map(s => s.toUpperCase()) : Object.keys(ALL);
  const resultsPath = path.join(SCRATCH, 'orch-v2-results.json');
  const results: Record<string, any> = {};
  const verdicts: Verdict[] = [];
  const tAll = now();
  for (const id of wanted) {
    if (!ALL[id]) { out(`unknown scenario ${id}`); continue; }
    out(`\n================ ${id} ================`);
    await flushDb9();
    const t = now();
    let v: Verdict;
    try {
      const mod = require(ALL[id]);
      v = await mod.run();
    } catch (e) {
      v = { id, pass: false, line: `${id} FAIL: harness error ${e && e.message}`, details: { error: String(e && e.stack || e) } };
    }
    v.details = { ...(v.details || {}), __wallSeconds: +((now() - t) / 1000).toFixed(1) };
    verdicts.push(v);
    results[id] = v;
    out(v.line + ` [${v.details.__wallSeconds}s]`);
    const left = await flushDb9();
    out(`${id}: Redis DB 9 flushed, dbsize=${left}`);
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 1));
  }
  out(`\n================ SUMMARY (${((now() - tAll) / 1000).toFixed(1)} s) ================`);
  for (const v of verdicts) out(v.line);
  const failed = verdicts.filter(v => !v.pass).length;
  out(`${verdicts.length - failed}/${verdicts.length} scenarios passed; results in ${resultsPath}`);
  process.exit(failed ? 1 : 0);
}
main().catch(e => { out('FATAL', String(e && e.stack)); process.exit(1); });
