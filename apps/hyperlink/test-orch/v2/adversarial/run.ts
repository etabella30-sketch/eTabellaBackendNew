/**
 * Adversarial acceptance run for the v2 hyperlink orchestration.
 *
 *   cd "D:\etabella tech\etabella_backend-rt"
 *   set TS_NODE_TRANSPILE_ONLY=1 && set PYTHONIOENCODING=UTF-8 && npx ts-node -r tsconfig-paths/register apps/hyperlink/test-orch/v2/adversarial/run.ts [X1 X3 ...]
 *
 * Reuses only the infrastructure of ../harness.ts (real classes, real Bull on
 * local Redis DB 9 prefix "orchtest", stubs for DB / python / kafka). Every
 * scenario prints "<id> PASS|FAIL: <numbers>"; Redis DB 9 is flushed before
 * and after every scenario. Results: <scratchpad>/orch-v2-adversarial.json.
 */
import * as fs from 'fs';
import * as path from 'path';
import { SCRATCH, flushDb9, out, now, Verdict } from '../harness';

process.chdir(SCRATCH);
for (const d of ['hl_db', 'hl_out', 'hl_tmp', 'pids']) fs.mkdirSync(path.join(SCRATCH, d), { recursive: true });

const ALL: Record<string, string> = {
  X1: './scenarios/x1-kill-twice',
  X2: './scenarios/x2-cancel-race',
  X3: './scenarios/x3-isolation',
  X4: './scenarios/x4-throws',
  X5: './scenarios/x5-retry-after-account',
  X6: './scenarios/x6-stale-alive',
  X7: './scenarios/x7-throughput-5x600',
  X8: './scenarios/x8-ttl',
  X9: './scenarios/x9-first-snapshot-race',
};

async function main() {
  const wanted = process.argv.slice(2).length ? process.argv.slice(2).map(s => s.toUpperCase()) : Object.keys(ALL);
  const resultsPath = path.join(SCRATCH, 'orch-v2-adversarial.json');
  const results: Record<string, any> = {};
  const verdicts: Verdict[] = [];
  const tAll = now();
  for (const id of wanted) {
    if (!ALL[id]) { out(`unknown scenario ${id}`); continue; }
    out(`\n================ ${id} ================`);
    await flushDb9();
    const t = now();
    let vs: Verdict[];
    try {
      const mod = require(ALL[id]);
      const r = await mod.run();
      vs = Array.isArray(r) ? r : [r];
    } catch (e) {
      vs = [{ id, pass: false, line: `${id} FAIL: harness error ${e && e.message}`, details: { error: String(e && e.stack || e) } }];
    }
    for (const v of vs) {
      v.details = { ...(v.details || {}), __wallSeconds: +((now() - t) / 1000).toFixed(1) };
      verdicts.push(v);
      results[v.id] = v;
      out(v.line);
    }
    out(`${id}: wall ${((now() - t) / 1000).toFixed(1)}s`);
    const left = await flushDb9();
    out(`${id}: Redis DB 9 flushed, dbsize=${left}`);
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 1));
  }
  out(`\n================ ADVERSARIAL SUMMARY (${((now() - tAll) / 1000).toFixed(1)} s) ================`);
  for (const v of verdicts) out(v.line);
  const failed = verdicts.filter(v => !v.pass).length;
  out(`${verdicts.length - failed}/${verdicts.length} checks passed; results in ${resultsPath}`);
  process.exit(failed ? 1 : 0);
}
main().catch(e => { out('FATAL', String(e && e.stack)); process.exit(1); });
