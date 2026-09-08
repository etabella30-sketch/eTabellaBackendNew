/**
 * A8 - Popup compatibility. Every emitted HYPERLINK-RESPONCE payload carries
 * the legacy fields with the right types (a batch with 2 failures out of 10),
 * and GET /hyperlinks (getHyperLinkProgress) returns both the running and the
 * just-finished batch.
 */
import { HarnessV2, bodyFor, makeFiles, verdict, sleep } from '../harness';

const LEGACY: Record<string, (v: any) => boolean> = {
  queueName: v => typeof v === 'string' && v.startsWith('HYPERLINK/'),
  nCaseid: v => typeof v === 'string',
  nSectionid: v => typeof v === 'string',
  nMasterid: v => typeof v === 'string',
  nBundledetailid: v => v === null || typeof v === 'string',
  nBundleid: v => v === null || typeof v === 'string',
  cType: v => typeof v === 'string',
  cKeeptype: v => typeof v === 'string',
  nTotal: v => Number.isInteger(v),
  nCompleted: v => Number.isInteger(v),
  nFailed: v => Number.isInteger(v),
  cStatus: v => ['P', 'C', 'F', 'X'].includes(v),
  isDeepscan: v => typeof v === 'boolean',
  isSmartscan: v => typeof v === 'boolean',
};

export async function run() {
  const h = new HarnessV2({ label: 'A8' });
  await h.flush();
  h.db.getfiles = (q) => makeFiles(q.nBundleid === 'SLOW' ? 30 : 10, q.nBundleid);
  h.scan = { delayMs: 30, result: (file) => !/-0000[45]$/.test(file.nBundledetailid) || file.nBundledetailid.startsWith('SLOW') };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '2' });
  const body = bodyFor({ nSectionid: 'S-A8', nBundleid: 'FAST' });
  const r = await s.gen.starthyperlink(body, false);
  const done = await h.waitForDone(r.data.queueName, 20000);
  h.scan.delayMs = 400;
  const r2 = await s.gen.starthyperlink(bodyFor({ nSectionid: 'S-A8', nBundleid: 'SLOW' }), false);
  await sleep(600);
  const progress = await s.gen.getHyperLinkProgress({ nCaseid: 'c1', nMasterid: 'm1' } as any);
  const list: any[] = progress.msg === 1 ? progress.value : [];
  const running = list.find(x => x.queueName === r2.data.queueName);
  const finished = list.find(x => x.queueName === r.data.queueName);

  const payloads = h.responces().map(e => e.data.data);
  const bad: string[] = [];
  for (const p of payloads) for (const [k, ok] of Object.entries(LEGACY)) if (!ok(p[k])) bad.push(`${k}=${JSON.stringify(p[k])}`);
  const monotonic = payloads.filter(p => p.queueName === r.data.queueName).every((p, i, a) => i === 0 || p.nCompleted + p.nFailed >= a[i - 1].nCompleted + a[i - 1].nFailed);
  const finalPayload = payloads.filter(p => p.queueName === r.data.queueName).pop();
  const v2ok = !!finalPayload && typeof finalPayload.batchId === 'string' && Array.isArray(finalPayload.jFailed) && finalPayload.jFailed.length === 2 && typeof finalPayload.dUpdate === 'string';
  const pass = bad.length === 0 && payloads.length > 0 && monotonic && v2ok && done?.cStatus === 'F' && done.nCompleted === 8 && done.nFailed === 2
    && progress.msg === 1 && !!running && running.cStatus === 'P' && !!finished && finished.cStatus === 'F';
  const numbers = `payloads=${payloads.length} badFields=${bad.length}${bad.length ? ' ' + bad.slice(0, 3).join(',') : ''} monotonic=${monotonic} v2Fields=${v2ok} finished=${done?.cStatus} ${done?.nCompleted}/${done?.nTotal}/${done?.nFailed} jFailed=${done?.jFailed?.length} `
    + `GET /hyperlinks -> ${list.length} entries: running=${running?.cStatus} ${running?.nCompleted}/${running?.nTotal}, finished=${finished?.cStatus} ${finished?.nCompleted}/${finished?.nTotal}`;
  await h.waitForDone(r2.data.queueName, 30000);
  await h.teardown();
  return verdict('A8', pass, numbers);
}
