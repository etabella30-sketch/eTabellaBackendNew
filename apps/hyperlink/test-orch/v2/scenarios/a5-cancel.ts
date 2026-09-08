/**
 * A5 - Cancel. 1,000 files x 50 ms, workers 3; POST /cancelhyperlink at 2 s.
 * Expect status X within 2 s, no scan starts after the cancel (<= workers
 * in flight finish), waiting jobs removed (queue counts 0), lock released
 * (restart allowed).
 */
import { HarnessV2, bodyFor, makeFiles, now, verdict, sleep } from '../harness';

const N = 1000, FILE_MS = 50, CANCEL_AT_MS = 2000;

export async function run() {
  const h = new HarnessV2({ label: 'A5' });
  await h.flush();
  h.db.getfiles = () => makeFiles(N, 'a5');
  h.scan = { delayMs: FILE_MS, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '3' });
  const body = bodyFor({ nSectionid: 'S-A5', nBundleid: 'B-A5' });
  const res = await s.gen.starthyperlink(body, false);
  const progressKey = res.data.queueName;
  await sleep(CANCEL_AT_MS);
  const scansAtCancel = h.scanCalls.length;
  const tCancel = now();
  const cres = await s.gen.cancelhyperlink({ nCaseid: body.nCaseid, nSectionid: body.nSectionid, nBundleid: body.nBundleid, nMasterid: 'someone-else' } as any);
  const cancelTookMs = now() - tCancel;
  const msToX = await h.waitFor(async () => (await h.snapshot(progressKey))?.cStatus === 'X', 5000);
  const xAt = now() - tCancel;
  await sleep(1500);
  const scansAfterCancel = h.scanCalls.filter(c => c.t > tCancel).length;
  const idle = await h.waitFor(async () => { const c = await h.counts(s.fq); return c.waiting + c.active + c.delayed === 0; }, 20000);
  const counts = await h.counts(s.fq);
  const snap = await h.snapshot(progressKey);
  const ttl = await h.redis.ttl(progressKey);
  const cres2 = await s.gen.cancelhyperlink({ nCaseid: body.nCaseid, nSectionid: body.nSectionid, nBundleid: body.nBundleid } as any);   // idempotent
  const restart = await s.gen.starthyperlink(body, false);
  const restarted = restart.msg === 1;
  const totalScans = h.scanCalls.length;
  const pass = cres.msg === 1 && msToX >= 0 && xAt <= 2000 && scansAfterCancel === 0 && totalScans <= scansAtCancel + 3 && idle >= 0
    && counts.waiting + counts.active + counts.delayed === 0 && snap?.cStatus === 'X' && ttl > 0 && cres2.msg === 1 && restarted
    && h.responces(progressKey).some(e => e.data.data.cStatus === 'X');
  const numbers = `cancel msg=${cres.msg} "${cres.value}" removed=${cres.removed} took=${cancelTookMs}ms X_after=${xAt}ms scansAtCancel=${scansAtCancel} scansAfterCancel=${scansAfterCancel} totalScans=${totalScans} (<= ${scansAtCancel}+3) `
    + `queueCounts=w${counts.waiting}/a${counts.active}/d${counts.delayed} idleAfter=${idle}ms snapshot=${snap?.cStatus} ${snap?.nCompleted}/${snap?.nTotal} ttl=${ttl}s cancelAgain=${cres2.msg} restart=${restart.msg}`;
  await h.teardown();
  return verdict('A5', pass, numbers, { counts });
}
