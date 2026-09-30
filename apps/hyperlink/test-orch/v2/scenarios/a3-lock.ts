/**
 * A3 - Lock. Bundle A running; the same bundle again -> rejected; a different
 * bundle of the same section -> accepted and both run concurrently; after A
 * finishes the key shows C with the done TTL and A can be restarted.
 * Orchestrator throw (hyperlink_getfiles) -> key 'F' within 1 s, restart allowed.
 */
import { HarnessV2, bodyFor, makeFiles, now, rel, verdict, sleep } from '../harness';

export async function run() {
  const h = new HarnessV2({ label: 'A3' });
  await h.flush();
  const filesA = makeFiles(24, 'a3a'), filesB = makeFiles(12, 'a3b');
  h.db.getfiles = (q) => {
    if (q.nBundleid === 'ERR') throw new Error('hyperlink_getfiles exploded');
    return q.nBundleid === 'A' ? filesA : filesB;
  };
  // varied per-file durations so the 3 workers do not finish A's last round in lockstep
  h.scan = { delayMs: (file) => 120 + (parseInt(file.nBundledetailid.slice(-2), 10) % 5) * 70, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '3', HYPERLINK_DONE_TTL_SEC: '900' });

  const bodyA = bodyFor({ nSectionid: 'S-A3', nBundleid: 'A' });
  const bodyB = bodyFor({ nSectionid: 'S-A3', nBundleid: 'B' });
  const r1 = await s.gen.starthyperlink(bodyA, false);
  await sleep(300);
  const r2 = await s.gen.starthyperlink(bodyA, false);          // same bundle while running
  const r3 = await s.gen.starthyperlink(bodyB, false);          // other bundle, same section
  const keyA = r1.data.queueName, keyB = r3.data.queueName;
  const doneA = await h.waitForDone(keyA, 30000);
  const ttlA = await h.redis.ttl(keyA);
  // both ran at the same time: B's first scan started before A's final snapshot was emitted
  const aFinalAt = h.responces(keyA).find(e => e.data.data.cStatus !== 'P')?.t || 0;
  const bFirstScan = h.scanCalls.find(c => c.batchId === r3.data.batchId);
  const aLastScan = h.scanCalls.filter(c => c.batchId === r1.data.batchId).map(c => c.tEnd || c.t).sort().pop() || 0;
  const bothRunning = !!bFirstScan && bFirstScan.t < aFinalAt;
  const overlapMs = bFirstScan ? aFinalAt - bFirstScan.t : null;
  const timeline = `B.firstScan=${bFirstScan ? rel(bFirstScan.t) : 'n/a'} A.lastScanEnd=${rel(aLastScan)} A.finalEmit=${rel(aFinalAt)} overlap=${overlapMs}ms`;
  const r4 = await s.gen.starthyperlink(bodyA, false);          // restart after C
  const doneB = await h.waitForDone(keyB, 30000);
  const doneA2 = await h.waitForDone(r4.data?.queueName || keyA, 30000);

  // orchestrator throw
  const bodyE = bodyFor({ nSectionid: 'S-A3', nBundleid: 'ERR' });
  const tE = now();
  const r5 = await s.gen.starthyperlink(bodyE, false);
  const keyE = r5.data.queueName;
  const msToF = await h.waitFor(async () => (await h.snapshot(keyE))?.cStatus === 'F', 5000);
  const snapE = await h.snapshot(keyE);
  const ttlE = await h.redis.ttl(keyE);
  const r6 = await s.gen.starthyperlink(bodyE, false);          // restart allowed after F
  const failNotif = h.notifications().filter(e => /failed/i.test(e.data.cMsg)).length;
  await sleep(500);

  const pass = r1.msg === 1 && r2.msg === -1 && r3.msg === 1 && bothRunning
    && doneA?.cStatus === 'C' && ttlA > 800 && ttlA <= 900 && r4.msg === 1 && doneB?.cStatus === 'C' && doneA2?.cStatus === 'C'
    && r5.msg === 1 && msToF >= 0 && msToF < 1000 && snapE?.cStatus === 'F' && (snapE.jFailed || []).some(f => /getfiles exploded/.test(f.cReason))
    && ttlE > 0 && r6.msg === 1 && failNotif >= 1;
  const numbers = `A=${r1.msg} sameA=${r2.msg}(${r2.value}) B=${r3.msg} bothRunning=${bothRunning} (${timeline}) A_done=${doneA?.cStatus} ${doneA?.nCompleted}/${doneA?.nTotal} keyTTL=${ttlA}s restartA=${r4.msg} `
    + `B_done=${doneB?.cStatus} A2_done=${doneA2?.cStatus} | getfilesThrow: start=${r5.msg} F_after=${msToF}ms status=${snapE?.cStatus} reason="${snapE?.jFailed?.[0]?.cReason}" ttl=${ttlE}s restart=${r6.msg} failNotifications=${failNotif}`;
  await h.teardown();
  return verdict('A3', pass, numbers);
}
