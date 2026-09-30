/**
 * S5 - Progress / report accuracy. Compares, for the S1 and S2 runs already
 * recorded in orch-results.json, the popup fields of the LAST emitted
 * HYPERLINK-RESPONCE and the Redis progress key against the truth measured by
 * the harness (distinct files, SP calls). Also runs one small direct check of
 * what the popup shows at the start of a resumed attempt.
 */
import { Harness, bodyFor, flushDb9, makeFiles, out } from '../harness';

export async function run(results: Record<string, any>) {
  const rows: any[] = [];
  const add = (name: string, v: any) => {
    if (!v) return;
    rows.push({
      run: name, truthDistinctFiles: v.distinctFiles, truthScanCalls: v.totalCreateHyperlinkFileCalls,
      truthSpCcalls: v.spCalls?.['hyperlink_update_documents/C'] || 0, truthSpFcalls: v.spCalls?.['hyperlink_update_documents/F'] || 0,
      popupLast: v.lastEmitted, completionPopups: v.completionResponces, counterDecreases: v.progressCounterRegressions?.decreases, resetsToZero: v.progressCounterRegressions?.resetsToZero,
      notifications: v.notificationsEmitted, redisProgressKeyAtEnd: v.lockKeyAtEnd,
      bullJobState: v.bullCounts, verdict: (v.lastEmitted && v.lastEmitted.nCompleted === v.distinctFiles && v.lastEmitted.cStatus === 'C') ? 'popup says 100% success - hides ' + (v.totalCreateHyperlinkFileCalls - v.distinctFiles) + ' redundant scans and ' + (v.completionResponces - 1) + ' extra completions' : 'popup wrong',
    });
  };
  add('S1 production', results.S1?.prod); add('S1 patched', results.S1?.patched);
  add('S2 alive prod', results.S2?.aliveProd); add('S2 dead prod', results.S2?.deadProd); add('S2 dead patched', results.S2?.deadPatched);

  // direct check: first popup of a resumed attempt (processor.ts:32 emits nCompleted=0 before the resume block at :44-50)
  const h = new Harness({ label: 'S5' });
  await h.flush();
  const files = makeFiles(10, 'e');
  h.db.getfiles = () => files;
  h.search = { delayMs: 10, result: true };
  const name = 'HYPERLINK/m1/c1/S5/null';
  await h.rds.setValue(name + '/done', JSON.stringify(files.slice(0, 7).map(f => f.nBundledetailid)), 3600); // 7 already done by a previous attempt
  const q = h.newQueue('w1');
  const gen = h.makeGenerator(q);
  const res = await gen.starthyperlink(bodyFor({ nSectionid: 'S5' }), false);
  h.registerWorker(q, 'w1', h.makeProcessor());
  await h.waitForIdle([q], 20000);
  const seq = h.responces(res.data.queueName).map(e => e.data.data.nCompleted);
  const resumed = { firstThreeEmittedCounters: seq.slice(0, 3), filesScannedThisAttempt: h.fileCalls.length, finalCounter: seq[seq.length - 1] };
  await h.teardown(); await flushDb9();
  const r = { rows, resumedAttemptPopup: resumed };
  out(JSON.stringify(r, null, 1));
  return r;
}
