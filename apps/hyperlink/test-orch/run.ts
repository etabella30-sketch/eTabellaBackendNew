/**
 * One-command runner for the hyperlink orchestration scenarios.
 *
 *   cd "D:\etabella tech\etabella_backend-rt"
 *   set TS_NODE_TRANSPILE_ONLY=1 && npx ts-node -r tsconfig-paths/register apps/hyperlink/test-orch/run.ts [S1 S2 ...]
 *
 * Results: <scratchpad>/orch-results.json (+ orch-run.log via shell redirection).
 * Redis DB 9 is flushed before and after every scenario.
 */
import * as fs from 'fs';
import * as path from 'path';
import { SCRATCH, flushDb9, out, now } from './harness';

process.chdir(SCRATCH); // hyperlinksearch.service appends hyperlink_test.txt to cwd; keep it out of the repo
for (const d of ['hl_db', 'hl_out', 'hl_tmp', 'pids']) fs.mkdirSync(path.join(SCRATCH, d), { recursive: true });

const ALL: Record<string, string> = {
  S1: './scenarios/s1-timeout-duplicates', S2: './scenarios/s2-worker-restart', S3: './scenarios/s3-section-lock',
  S4: './scenarios/s4-false-success', S5: './scenarios/s5-report-accuracy', S6: './scenarios/s6-throughput',
  S7: './scenarios/s7-cancel-static', S8: './scenarios/s8-bull-semantics',
};

async function main() {
  const wanted = process.argv.slice(2).length ? process.argv.slice(2).map(s => s.toUpperCase()) : Object.keys(ALL);
  const resultsPath = path.join(SCRATCH, 'orch-results.json');
  const results: Record<string, any> = fs.existsSync(resultsPath) ? JSON.parse(fs.readFileSync(resultsPath, 'utf8')) : {};
  for (const id of wanted) {
    if (!ALL[id]) { out(`unknown scenario ${id}`); continue; }
    out(`\n================ ${id} ================`);
    await flushDb9();
    const t = now();
    try {
      const mod = require(ALL[id]);
      results[id] = await mod.run(results);
      results[id].__wallSeconds = +((now() - t) / 1000).toFixed(1);
      out(`${id} done in ${results[id].__wallSeconds}s`);
    } catch (e) {
      results[id] = { error: String(e && e.stack || e) };
      out(`${id} ERROR ${e && e.stack}`);
    }
    const left = await flushDb9();
    out(`${id}: Redis DB 9 flushed, dbsize=${left}`);
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 1));
  }
  out(`\nresults written to ${resultsPath}`);
  process.exit(0);
}
main().catch(e => { out('FATAL', String(e && e.stack)); process.exit(1); });
