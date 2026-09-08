/**
 * Adversarial runner.
 *   cd "D:\etabella tech\etabella_backend-rt"
 *   set TS_NODE_TRANSPILE_ONLY=1 && npx ts-node -r tsconfig-paths/register apps/hyperlink/test-orch/adversarial/run.ts [A B C D E F]
 * Results: <scratchpad>/adv/adv-results.json. Redis DB 9 flushed before/after each scenario.
 */
import * as fs from 'fs';
import * as path from 'path';
import { ADV_OUT, flushDb9, now, out } from './common';
import { SCRATCH } from '../harness';

process.chdir(SCRATCH);
for (const d of ['hl_db', 'hl_out', 'hl_tmp', 'pids', 'adv']) fs.mkdirSync(path.join(SCRATCH, d), { recursive: true });

const ALL: Record<string, string> = {
  A: './a-bull-settings', B: './b-sections', C: './c-python-modes', D: './d-index-queue', E: './e-sigkill', F: './f-parallel-python', G: './g-misc',
};

async function main() {
  const wanted = process.argv.slice(2).length ? process.argv.slice(2).map(s => s.toUpperCase()) : Object.keys(ALL);
  const resultsPath = path.join(ADV_OUT, 'adv-results.json');
  const results: Record<string, any> = fs.existsSync(resultsPath) ? JSON.parse(fs.readFileSync(resultsPath, 'utf8')) : {};
  for (const id of wanted) {
    if (!ALL[id]) { out(`unknown scenario ${id}`); continue; }
    out(`\n================ ${id} ================`);
    // Redis DB 9 / queue "hyperlink-queue" are shared: refuse to start while another test-orch process is alive
    for (let i = 0; i < 120; i++) {
      let others = '';
      try { others = require('child_process').execSync(`powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \\"name='node.exe'\\" | ? { $_.CommandLine -like '*test-orch*' -and $_.ProcessId -ne ${process.pid} -and $_.CommandLine -notlike '*adversarial/run.ts*' -and $_.CommandLine -notlike '*worker-child*' } | % { $_.ProcessId }"`).toString().trim(); } catch { }
      if (!others) break;
      out(`waiting: another test-orch process is using Redis DB 9 (pids ${others.replace(/\s+/g, ',')})`);
      await new Promise(r => setTimeout(r, 5000));
    }
    await flushDb9();
    const t = now();
    try {
      results[id] = await require(ALL[id]).run(results);
      results[id].__wallSeconds = +((now() - t) / 1000).toFixed(1);
      out(`${id} done in ${results[id].__wallSeconds}s`);
    } catch (e) {
      results[id] = { error: String(e && e.stack || e) };
      out(`${id} ERROR ${e && e.stack}`);
    }
    out(`${id}: Redis DB 9 flushed, dbsize=${await flushDb9()}`);
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 1));
  }
  out(`\nresults written to ${resultsPath}`);
  process.exit(0);
}
main().catch(e => { out('FATAL', String(e && e.stack)); process.exit(1); });
