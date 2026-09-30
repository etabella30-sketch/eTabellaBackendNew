/**
 * Independent adversarial acceptance run (acceptance tester's own scenarios,
 * written against DESIGN_V2.md §6 without reusing the implementer's scenarios;
 * only ../../harness.ts infrastructure is reused).
 *
 *   cd "D:\etabella tech\etabella_backend-rt"
 *   set TS_NODE_TRANSPILE_ONLY=1 && set PYTHONIOENCODING=UTF-8 && npx ts-node -r tsconfig-paths/register apps/hyperlink/test-orch/v2/adversarial/qa/run.ts [Q1 Q2 ...]
 *
 * Real classes, real Bull on local Redis DB 9 (prefix "orchtest"), stubs for
 * DB / kafka; Q4b and Q9 use the REAL HyperlinksearchService with a fake
 * python (python/fake_qa.py). Redis DB 9 is flushed before and after every
 * scenario. Results: <scratchpad>/orch-v2-qa.json.
 */
import * as fs from 'fs';
import * as path from 'path';
import { SCRATCH, flushDb9, out, now, Verdict } from '../../harness';

process.chdir(SCRATCH);
for (const d of ['hl_db', 'hl_out', 'hl_tmp', 'pids']) fs.mkdirSync(path.join(SCRATCH, d), { recursive: true });
process.env.ORCH_PID_DIR = path.join(SCRATCH, 'pids');

const ALL: Record<string, string> = {
  Q1: './scenarios/q1-kill-twice',
  Q2: './scenarios/q2-cancel-race',
  Q3: './scenarios/q3-isolation',
  Q4: './scenarios/q4-throws-python',
  Q5: './scenarios/q5-retry-after-account',
  Q6: './scenarios/q6-stale-busy',
  Q7: './scenarios/q7-throughput',
  Q8: './scenarios/q8-ttl',
  Q9: './scenarios/q9-cluster-cancel',
};

async function main() {
  const wanted = process.argv.slice(2).length ? process.argv.slice(2).map(s => s.toUpperCase()) : Object.keys(ALL);
  const resultsPath = path.join(SCRATCH, 'orch-v2-qa.json');
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
  out(`\n================ QA SUMMARY (${((now() - tAll) / 1000).toFixed(1)} s) ================`);
  for (const v of verdicts) out(v.line);
  const failed = verdicts.filter(v => !v.pass).length;
  out(`${verdicts.length - failed}/${verdicts.length} checks passed; results in ${resultsPath}`);
  process.exit(failed ? 1 : 0);
}
main().catch(e => { out('FATAL', String(e && e.stack)); process.exit(1); });
