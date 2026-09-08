/**
 * Diagnostic (not part of the acceptance run): why does A5 remove fewer jobs
 * than SDIFF(jobs, seen) reports? Counts getJob() nulls vs remove() failures
 * during the cancel drain of a 1,000-file batch cancelled at 2 s.
 */
import { HarnessV2, bodyFor, makeFiles, now, out, sleep, flushDb9 } from '../../harness';

async function main() {
  await flushDb9();
  const h = new HarnessV2({ label: 'DIAG' });
  h.db.getfiles = () => makeFiles(1000, 'a5');
  h.scan = { delayMs: 50, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '3' });
  const body = bodyFor({ nSectionid: 'S-D', nBundleid: 'B' });
  const res = await s.gen.starthyperlink(body, false);
  await sleep(2000);
  const batchId = res.data.batchId;
  const pendingBefore = (await h.redis.sdiff(`HYPERLINK-BATCH/${batchId}/jobs`, `HYPERLINK-BATCH/${batchId}/seen`)).length;
  const countsBefore = await h.counts(s.fq);
  const origGetJob = s.fq.getJob.bind(s.fq);
  let nulls = 0, found = 0;
  (s.fq as any).getJob = async (id: string) => { const j = await origGetJob(id); if (j) found++; else nulls++; return j; };
  const scansBefore = h.scanCalls.length;
  const skippedBefore = h.logs.filter(l => /skipped before python/.test(l)).length;
  const t0 = now();
  const c = await s.gen.cancelhyperlink({ nCaseid: 'c1', nSectionid: 'S-D', nBundleid: 'B' } as any);
  const took = now() - t0;
  await sleep(1500);
  const skippedAfter = h.logs.filter(l => /skipped before python/.test(l)).length;
  const counts = await h.counts(s.fq);
  out(`pendingBefore=${pendingBefore} counts=w${countsBefore.waiting}/a${countsBefore.active} removed=${c.removed} took=${took}ms getJob found=${found} null=${nulls} skippedByPrecheckDuringAndAfter=${skippedAfter - skippedBefore} scansAfter=${h.scanCalls.length - scansBefore} after=w${counts.waiting}/a${counts.active}`);
  const removeErrors = h.logs.filter(l => /draining/.test(l));
  out(`drainLogs=${JSON.stringify(removeErrors)}`);
  await h.teardown();
  await flushDb9();
}
main().catch(e => { out(String(e && e.stack)); process.exit(1); });
