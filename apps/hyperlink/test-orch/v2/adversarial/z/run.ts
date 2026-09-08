/**
 * Z adversarial run (independent acceptance tester, round 4).
 *
 *   cd "D:\etabella tech\etabella_backend-rt"
 *   set TS_NODE_TRANSPILE_ONLY=1 && set PYTHONIOENCODING=UTF-8 && npx ts-node -r tsconfig-paths/register apps/hyperlink/test-orch/v2/adversarial/z/run.ts [Z1 Z3 ...]
 *
 * Reuses only ../../harness.ts (real classes, real Bull on 127.0.0.1:6379 DB 9
 * prefix "orchtest", stubs for DB / python / kafka). Results:
 * <scratchpad>/orch-v2-z.json. DB 9 flushed before and after every scenario.
 */
import * as fs from 'fs';
import * as path from 'path';
import { SCRATCH, flushDb9, out, now, Verdict } from '../../harness';

process.chdir(SCRATCH);
for (const d of ['hl_db', 'hl_out', 'hl_tmp', 'pids']) fs.mkdirSync(path.join(SCRATCH, d), { recursive: true });

const ALL: Record<string, string> = {
  Z1: './scenarios/z1-kill-twice-same-file',
  Z2: './scenarios/z2-cancel-vs-finalize',
  Z3: './scenarios/z3-isolation-three-scopes',
  Z4: './scenarios/z4-throws-and-exit0',
  Z5: './scenarios/z5-throw-after-handler',
  Z6: './scenarios/z6-stale-alive',
  Z7: './scenarios/z7-throughput-cap',
  Z8: './scenarios/z8-ttl',
  Z9: './scenarios/z9-notification-once',
};

async function main() {
  const wanted = process.argv.slice(2).length ? process.argv.slice(2).map(s => s.toUpperCase()) : Object.keys(ALL);
  const resultsPath = path.join(SCRATCH, 'orch-v2-z.json');
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
  out(`\n================ Z SUMMARY (${((now() - tAll) / 1000).toFixed(1)} s) ================`);
  for (const v of verdicts) out(v.line);
  const failed = verdicts.filter(v => !v.pass).length;
  out(`${verdicts.length - failed}/${verdicts.length} checks passed; results in ${resultsPath}`);
  process.exit(failed ? 1 : 0);
}
main().catch(e => { out('FATAL', String(e && e.stack)); process.exit(1); });
