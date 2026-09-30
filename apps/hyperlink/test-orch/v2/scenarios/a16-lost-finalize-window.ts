/**
 * A16 - Lost finalize window (fix round 3 blocker). The LAST file's accounting
 * Lua has set hash.finalized=1 and written the C snapshot, then the process
 * dies before finalize() (HSETNX notified, notification, final socket event):
 * finalize() never returns, the worker is killed, a new worker starts and
 * Bull re-runs the stalled job. The pre-check turns that re-run away
 * (finalized) and it must RECOVER the lost finalize: exactly one
 * notification, hash.notified 1, a terminal HYPERLINK-RESPONCE emit, queue
 * empty. Control: a second batch on the new worker finalizes normally.
 */
import { HarnessV2, FAST_STALL, bodyFor, makeFiles, now, verdict, sleep } from '../harness';

const N = 6;

export async function run() {
  const h = new HarnessV2({ label: 'A16' });
  await h.flush();
  h.db.getfiles = () => makeFiles(N, 'a16');
  h.scan = { delayMs: 20, result: true };
  const s1 = await h.stack('w1', { HYPERLINK_WORKERS: '1' }, { settings: FAST_STALL });
  // the process dies right after the accounting Lua of the finalizing file: finalize() never returns
  let finalizeCalls = 0;
  const origFinalize = s1.batch.finalize.bind(s1.batch);
  (s1.batch as any).finalize = (snap: any) => { finalizeCalls++; if (finalizeCalls === 1) return new Promise(() => { /* dead */ }); return origFinalize(snap); };
  const body = bodyFor({ nSectionid: 'S-A16', nBundleid: 'B' });
  const r = await s1.gen.starthyperlink(body, false);
  const key = r.data.queueName, batchId = r.data.batchId;
  const keyC = await h.waitFor(async () => (await h.snapshot(key))?.cStatus === 'C', 10000, 20);
  await sleep(300);
  const notifBeforeKill = h.notifications().length;
  const hashAtKill = await h.redis.hgetall(`HYPERLINK-BATCH/${batchId}`);
  const activeAtKill = (await h.counts(s1.fq)).active;
  h.killTag('w1'); await s1.bq.close(true); await s1.fq.close(true);
  const s2 = await h.stack('w2', { HYPERLINK_WORKERS: '1' }, { settings: FAST_STALL });
  const t0 = now();
  const rerun = await h.waitFor(() => h.bullEvents.some(e => e.queue === 'hyperlink-file-queue' && e.event === 'stalled'), 30000, 100);
  const recoveredAt = await h.waitFor(async () => (await h.redis.hget(`HYPERLINK-BATCH/${batchId}`, 'notified')) === '1', 30000, 50);
  await h.waitFor(async () => { const c = await h.counts(s2.fq); return c.active + c.waiting + c.delayed === 0; }, 30000, 100);
  await sleep(500);
  const hash = await h.redis.hgetall(`HYPERLINK-BATCH/${batchId}`);
  const notifs = h.notifications();
  const terminalEmits = h.responces(key).filter(e => e.data.data.cStatus !== 'P').length;
  const skipped = h.logs.filter(l => /batch finished \/ cancelled, skipped before python/.test(l)).length;
  const recovered = h.logs.filter(l => /finalize was lost/.test(l)).length;
  const finished = h.logs.filter(l => /finished C:/.test(l) && l.includes(batchId)).length;
  const counts = await h.counts(s2.fq);
  const snap = await h.snapshot(key);
  const ttls = { key: await h.redis.ttl(key), hash: await h.redis.ttl(`HYPERLINK-BATCH/${batchId}`) };
  // control: the next batch on the new worker finalizes normally (exactly one more notification)
  const r2 = await s2.gen.starthyperlink(bodyFor({ nSectionid: 'S-A16', nBundleid: 'B2' }), false);
  const done2 = await h.waitForDone(r2.data.queueName, 10000);
  await sleep(300);
  const notifsAll = h.notifications().length;
  const pass = keyC >= 0 && notifBeforeKill === 0 && hashAtKill.finalized === '1' && (hashAtKill.notified || '0') !== '1'
    && rerun >= 0 && recoveredAt >= 0 && notifs.length === 1 && /Hyperlink Successful/.test(String(notifs[0]?.data?.cMsg)) && terminalEmits >= 1 && snap?.cStatus === 'C' && hash.notified === '1'
    && skipped >= 1 && recovered === 1 && finished === 1
    && ttls.key > 0 && ttls.key <= 900 && ttls.hash > 0 && ttls.hash <= 900
    && counts.active + counts.waiting + counts.delayed + counts.failed === 0
    && done2?.cStatus === 'C' && notifsAll === 2;
  const numbers = `key C after ${keyC}ms with finalize() dead (hash finalized=${hashAtKill.finalized} notified=${hashAtKill.notified || 0}, active=${activeAtKill}, notificationsBeforeKill=${notifBeforeKill}) -> worker killed; w2: stalled re-run after ${rerun >= 0 ? (rerun / 1000).toFixed(1) + 's' : 'never'} `
    + `precheckSkipped=${skipped} recoveredLogs=${recovered} recoveredAfter=${recoveredAt >= 0 ? (recoveredAt / 1000).toFixed(1) + 's' : 'never'} finishedLogs=${finished} notifications=${notifs.length} "${notifs[0]?.data?.cMsg}" terminalEmits=${terminalEmits} hash.notified=${hash.notified || 0} key=${snap?.cStatus} ${snap?.nCompleted}/${snap?.nTotal} `
    + `ttl key=${ttls.key} hash=${ttls.hash} queue=w${counts.waiting}/a${counts.active}/f${counts.failed} | control batch=${done2?.cStatus} totalNotifications=${notifsAll} (+${((now() - t0) / 1000).toFixed(1)}s)`;
  await h.teardown();
  return verdict('A16', pass, numbers, { hash, hashAtKill });
}
