/**
 * Review check B: S3-2 re-run with the REAL DbService contract. The real
 * executeRef never throws (db.service.ts:71-83: every error is caught and
 * returned as { success:false, error }). What does the real processor +
 * real starthyperlink do then? Uses Redis DB 9 / prefix orchtest like the harness.
 */
import { Harness, bodyFor, flushDb9, out } from '../harness';

(async () => {
  await flushDb9();
  const h = new Harness({ label: 'review-S3-2-realdb' });
  await h.flush();
  const orig = (h as any).dbStub.bind(h);
  (h as any).dbStub = () => {
    const s = orig();
    const inner = s.executeRef;
    s.executeRef = async (sp: string, p: any) => {
      if (sp === 'hyperlink_getfiles') { h.spCalls.push({ t: Date.now(), sp }); return { success: false, error: 'connection to server at "127.0.0.1", port 1 failed' }; }
      return inner(sp, p);
    };
    return s;
  };
  const q = h.newQueue('w1');
  const gen = h.makeGenerator(q);
  const resA = await gen.starthyperlink(bodyFor({ nSectionid: 'S', nBundleid: 'A' }), false);
  h.registerWorker(q, 'w1', h.makeProcessor());
  const idle = await h.waitForIdle([q], 30000);
  const last = h.lastResponce(resA.data.queueName);
  const lockStill = !!(await h.redis.exists(resA.data.queueName));
  const keys = await h.appKeys();
  const resB = await gen.starthyperlink(bodyFor({ nSectionid: 'S', nBundleid: 'B' }), false);
  out(JSON.stringify({
    idle, runs: h.runs.map(r => r.outcome),
    bull: h.bullEvents.filter(e => e.event === 'completed' || e.event === 'failed').map(e => ({ ev: e.event, attemptsMade: e.attemptsMade, reason: e.reason })),
    spCalls: h.spStats(),
    lastEmitted: last ? { nTotal: last.nTotal, nCompleted: last.nCompleted, nFailed: last.nFailed, cStatus: last.cStatus } : null,
    notifications: [...new Set(h.notifications().map(e => e.data.cMsg))],
    lockKeyStillPresentAfterA: lockStill, appKeysAfterA: keys,
    B_afterwards: { msg: resB.msg, value: resB.value },
  }, null, 1));
  await h.teardown();
  await flushDb9();
  process.exit(0);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
