/**
 * Z9 - "notification exactly once": the notified flag is claimed (HSETNX)
 * BEFORE the notification is emitted. If the emit itself fails (Kafka down
 * for a moment) the notification is gone for good: nothing retries it, the
 * lost-finalize recovery sees notified=1 and does nothing. Measured, reported
 * as a nuance (at-most-once, not exactly-once).
 *   Z9a: utility.emit throws once on the 'notification' topic during the
 *        finalize of a 3-file batch -> notifications delivered, hash.notified,
 *        whether a later re-run / recovery resends.
 */
import { HarnessV2, bodyFor, makeFiles, verdict, sleep } from '../../../harness';

export async function run() {
  const h = new HarnessV2({ label: 'Z9a' });
  await h.flush();
  const files = makeFiles(3, 'z9a');
  h.db.getfiles = () => files;
  h.scan = { delayMs: 20, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '3' });
  const util: any = (s.batch as any).utility;
  const origEmit = util.emit.bind(util);
  let thrown = 0;
  util.emit = (data: any, topic?: string) => { if (topic === 'notification' && thrown === 0) { thrown++; throw new Error('kafka down'); } return origEmit(data, topic); };
  const body = bodyFor({ nSectionid: 'S-Z9a', nBundleid: 'B' });
  const r = await s.gen.starthyperlink(body, false);
  const key = r.data.queueName, batchId = r.data.batchId;
  const done = await h.waitForDone(key, 10000);
  await sleep(500);
  const hash = await h.redis.hgetall(`HYPERLINK-BATCH/${batchId}`);
  const notifAfterFinalize = h.notifications().length;
  // whatever looks at the batch next: a re-run of a counted job and the explicit recovery
  const base = s.batch.baseOf({ ...done, batchId } as any);
  await s.fq.add({ batchId, run: hash.run, progressKey: key, file: files[0], jobData: base, searchTermsPath: '' }, { jobId: `${batchId}:${hash.run}:rerun-1`, removeOnComplete: true, removeOnFail: true });
  await sleep(500);
  const recovered = await s.batch.recoverLostFinalize(batchId, key);
  const notifEnd = h.notifications().length;
  const pass = done?.cStatus === 'C' && thrown === 1;   // the guarantee under test is reported, not asserted
  const numbers = `emit threw once during finalize: key=${done?.cStatus} ${done?.nCompleted}/${done?.nTotal} hash.notified=${hash.notified} notificationsDelivered=${notifAfterFinalize} afterReRunAndRecovery=${notifEnd} (recoverLostFinalize=${recovered}) -> ${notifEnd === 0 ? 'NOTIFICATION LOST (at-most-once)' : 'redelivered'}`;
  await h.teardown();
  return verdict('Z9a', pass, numbers);
}
