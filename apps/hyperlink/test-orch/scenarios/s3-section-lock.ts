/**
 * S3 - Lock per section. Lock key = HYPERLINK/<nMasterid>/<nCaseid>/<nSectionid>/<nBundledetailid|null>
 * (generatehyperlink.service.ts:67) - nBundleid is NOT part of it.
 */
import { Harness, bodyFor, flushDb9, makeFiles, now, out, rel } from '../harness';

export async function run() {
  const r: any = {};

  // ---- (1) A (section S) running, B (section S, other bundle) -> rejected; C (section T) -> allowed and concurrent
  {
    const h = new Harness({ label: 'S3-1' });
    await h.flush();
    const filesA = makeFiles(60, 'A'), filesC = makeFiles(60, 'C');
    h.db.getfiles = (qry) => (qry.nSectionid === 'S' ? filesA : filesC);
    h.search = { delayMs: 50, result: true };
    const q = h.newQueue('w1');
    const gen = h.makeGenerator(q);
    const resA = await gen.starthyperlink(bodyFor({ nSectionid: 'S', nBundleid: 'A' }), false);
    const resB = await gen.starthyperlink(bodyFor({ nSectionid: 'S', nBundleid: 'B' }), false);
    const resC = await gen.starthyperlink(bodyFor({ nSectionid: 'T', nBundleid: 'C' }), false);
    const keysAfterSubmit = await h.appKeys();
    const ttl = await h.redis.ttl(resA.data.queueName);
    h.registerWorker(q, 'w1', h.makeProcessor());
    await h.waitForIdle([q], 60000);
    const runA = h.runs.find(x => x.queueName === resA.data.queueName), runC = h.runs.find(x => x.queueName === resC.data.queueName);
    const overlapMs = runA && runC ? Math.min(runA.end, runC.end) - Math.max(runA.start, runC.start) : 0;
    const keysAtEnd = await h.appKeys();
    const resB2 = await gen.starthyperlink(bodyFor({ nSectionid: 'S', nBundleid: 'B' }), false);
    r.sameSectionOtherBundle = {
      A: { msg: resA.msg, value: resA.value, queueName: resA.data?.queueName },
      B_whileA_running: { msg: resB.msg, value: resB.value },
      C_otherSection: { msg: resC.msg, value: resC.value, queueName: resC.data?.queueName },
      lockKeysAfterSubmit: keysAfterSubmit, lockKeyTtlSeconds: ttl,
      A_and_C_ranConcurrently: overlapMs > 0, overlapMs, runs: h.runs.map(x => ({ q: x.queueName, start: rel(x.start), end: rel(x.end), files: x.filesSeen })),
      keysAfterAandCfinished: keysAtEnd, B_afterA_finished: { msg: resB2.msg, value: resB2.value },
    };
    await h.teardown(); await flushDb9();
  }

  // ---- (2) A fails permanently: hyperlink_getfiles throws (line 29 is outside try/catch) -> attempts exhausted -> lock stays
  {
    const h = new Harness({ label: 'S3-2' });
    await h.flush();
    h.db.getfiles = () => { throw new Error('SP hyperlink_getfiles: connection terminated'); };
    const q = h.newQueue('w1');
    const gen = h.makeGenerator(q);
    const t0 = now();
    const { res: resA } = await h.submitScaled(gen, q, bodyFor({ nSectionid: 'S', nBundleid: 'A' }), { backoff: 1000 });
    h.registerWorker(q, 'w1', h.makeProcessor());
    await h.waitForIdle([q], 60000);
    const resB = await gen.starthyperlink(bodyFor({ nSectionid: 'S', nBundleid: 'B' }), false);
    r.getfilesThrows = {
      wallSeconds: +((now() - t0) / 1000).toFixed(1),
      bullFailed: h.bullEvents.filter(e => e.event === 'failed').map(e => ({ at: rel(e.t), attemptsMade: e.attemptsMade, reason: e.reason })),
      runs: h.runs.map(x => x.outcome), bullCounts: await h.counts(q),
      lockKeyStillPresent: !!(await h.redis.exists(resA.data.queueName)), lockKeyTtlSeconds: await h.redis.ttl(resA.data.queueName), keysAtEnd: await h.appKeys(),
      B_afterA_failedPermanently: { msg: resB.msg, value: resB.value },
      responcesEmitted: h.responces().length, notificationsEmitted: h.notifications().length,
    };
    await h.teardown(); await flushDb9();
  }

  // ---- (3) A: python returns false for every file -> job "completes" -> lock released, but status/notification say success
  {
    const h = new Harness({ label: 'S3-3' });
    await h.flush();
    h.db.getfiles = () => makeFiles(30, 'A');
    h.search = { delayMs: 20, result: false };
    const q = h.newQueue('w1');
    const gen = h.makeGenerator(q);
    const resA = await gen.starthyperlink(bodyFor({ nSectionid: 'S', nBundleid: 'A' }), false);
    h.registerWorker(q, 'w1', h.makeProcessor());
    await h.waitForIdle([q], 60000);
    const last = h.lastResponce(resA.data.queueName);
    const lockStill = !!(await h.redis.exists(resA.data.queueName));
    const spStats = h.spStats();
    const resB = await gen.starthyperlink(bodyFor({ nSectionid: 'S', nBundleid: 'B' }), false);
    r.allFilesFail = {
      lastEmitted: { nTotal: last.nTotal, nCompleted: last.nCompleted, nFailed: last.nFailed, cStatus: last.cStatus },
      spCalls: spStats, notificationTexts: [...new Set(h.notifications().map(e => e.data.cMsg))],
      bullEvents: h.bullEvents.filter(e => e.event === 'completed' || e.event === 'failed').map(e => e.event),
      lockKeyStillPresentAfterA: lockStill, B_afterwards: { msg: resB.msg, value: resB.value },
    };
    await h.teardown(); await flushDb9();
  }
  out(JSON.stringify(r, null, 1));
  return r;
}
