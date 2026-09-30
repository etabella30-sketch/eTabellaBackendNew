/**
 * Q2 (b) - cancel racing with finalize.
 *   Q2a: deterministic "one file left": workers 1, the last file takes 1.5 s;
 *        cancel is sent when done == total-1 and the last scan is in flight.
 *        Expect X, no 'C' ever emitted, no notification, restart allowed and the
 *        restarted batch finishes C with exactly one notification.
 *   Q2b: randomized race, 30 rounds of a 4-file batch, cancel at a random
 *        moment around the end. Invariants per round: the final key is C or X,
 *        never P/F; C <=> cancel answered "not running" <=> exactly one
 *        notification; X <=> cancel answered 1 <=> one "cancelled" notification (D3); the key
 *        never flips between terminal states; hash finalized+notified.
 *   Q2c: cancel + immediate restart while the ORCHESTRATOR of the first run is
 *        still inside hyperlink_getfiles (an SP taking ~1.2 s). The second run
 *        must reach C N/N with one notification.
 *   Q2d: cancel with 3 scans in flight + immediate restart: the second run must
 *        reach C N/N; the old in-flight scans are ignored (run token).
 */
import { HarnessV2, bodyFor, makeFiles, now, verdict, sleep } from '../../../harness';

export async function run() {
  return [await oneFileLeft(), await randomRace(), await restartDuringOrchestrator(), await restartWithInFlight()];
}

async function oneFileLeft() {
  const N = 12;
  const h = new HarnessV2({ label: 'Q2a' });
  await h.flush();
  const files = makeFiles(N, 'q2a');
  h.db.getfiles = () => files;
  h.scan = { delayMs: (f) => f.nBundledetailid === files[N - 1].nBundledetailid ? 1500 : 20, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '1' });
  const body = bodyFor({ nSectionid: 'S-Q2a', nBundleid: 'B' });
  const r1 = await s.gen.starthyperlink(body, false);
  const key = r1.data.queueName, batchId = r1.data.batchId;
  const armed = await h.waitFor(async () => {
    const hs = await h.redis.hgetall(`HYPERLINK-BATCH/${batchId}`);
    return Number(hs.done) === N - 1 && h.scanCalls.some(c => c.nBundledetailid === files[N - 1].nBundledetailid && !c.tEnd);
  }, 10000, 20);
  const scansAtCancel = h.scanCalls.length;
  const c = await s.gen.cancelhyperlink({ nCaseid: 'c1', nSectionid: 'S-Q2a', nBundleid: 'B' } as any);
  const snapRightAfter = await h.snapshot(key);
  // let the in-flight last file end (1.5 s) and any straggler settle
  await h.waitFor(() => h.scanCalls.every(x => !!x.tEnd), 5000);
  await sleep(600);
  const snapLater = await h.snapshot(key);
  const hash = await h.redis.hgetall(`HYPERLINK-BATCH/${batchId}`);
  const cEmits = h.responces(key).filter(e => e.data.data.cStatus === 'C').length;
  const xEmits = h.responces(key).filter(e => e.data.data.cStatus === 'X').length;
  const notifBefore = h.notifications().length;
  const scansAfterCancel = h.scanCalls.length - scansAtCancel;
  const r2 = await s.gen.starthyperlink(body, false);
  const done2 = await h.waitForDone(key, 15000);
  await sleep(500);
  const notifAfter = h.notifications().length;
  const pass = armed >= 0 && c.msg === 1 && snapRightAfter?.cStatus === 'X' && snapLater?.cStatus === 'X' && cEmits === 0 && notifBefore === 1 && scansAfterCancel === 0
    && hash.finalized === '1' && hash.cancelled === '1' && r2.msg === 1 && done2?.cStatus === 'C' && done2.nCompleted === N && notifAfter === 2;
  const numbers = `armedAt done=${N - 1}/${N} lastInFlight=${armed >= 0} -> cancel msg=${c.msg} "${c.value}" keyRightAfter=${snapRightAfter?.cStatus} ${snapRightAfter?.nCompleted}/${snapRightAfter?.nTotal} `
    + `keyAfterLastFileEnded=${snapLater?.cStatus} ${snapLater?.nCompleted}/${snapLater?.nTotal} hash=${hash.done}/${hash.total} finalized=${hash.finalized} cancelled=${hash.cancelled} `
    + `emits C=${cEmits} X=${xEmits} notifications=${notifBefore} scansAfterCancel=${scansAfterCancel} | restart msg=${r2.msg} -> ${done2?.cStatus} ${done2?.nCompleted}/${done2?.nTotal} notificationsTotal=${notifAfter}`;
  await h.teardown();
  return verdict('Q2a', pass, numbers, { hash });
}

async function randomRace() {
  const ROUNDS = 30, N = 4, FILE_MS = 15;
  const h = new HarnessV2({ label: 'Q2b' });
  await h.flush();
  h.scan = { delayMs: FILE_MS, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '2' });
  const outcomes: string[] = [];
  const problems: string[] = [];
  for (let i = 0; i < ROUNDS; i++) {
    const files = makeFiles(N, `q2b${i}`);
    h.db.getfiles = () => files;
    const section = `S-Q2b-${i}`;
    const body = bodyFor({ nSectionid: section, nBundleid: 'B' });
    const evBefore = h.events.length;
    const r = await s.gen.starthyperlink(body, false);
    if (r.msg !== 1) { problems.push(`round ${i}: start msg ${r.msg}`); continue; }
    const key = r.data.queueName, batchId = r.data.batchId;
    // somewhere between "nothing scanned" and "just finished"
    await sleep(Math.floor(Math.random() * (N * FILE_MS + 60)));
    const c = await s.gen.cancelhyperlink({ nCaseid: 'c1', nSectionid: section, nBundleid: 'B' } as any);
    await h.waitFor(async () => { const sn = await h.snapshot(key); return !!sn && sn.cStatus !== 'P'; }, 5000, 10);
    await h.waitFor(() => h.scanCalls.filter(x => x.batchId === batchId).every(x => !!x.tEnd), 3000, 10);
    await sleep(120);
    const snap = await h.snapshot(key);
    const hash = await h.redis.hgetall(`HYPERLINK-BATCH/${batchId}`);
    const evs = h.events.slice(evBefore);
    const notif = evs.filter(e => e.topic === 'notification').length;
    const terminalEmits = evs.filter(e => e.topic === 'hyperlink-response' && e.data?.data?.queueName === key && e.data.data.cStatus !== 'P').map(e => e.data.data.cStatus);
    const distinctTerminal = new Set(terminalEmits);
    const st = snap?.cStatus;
    outcomes.push(`${st}${c.msg === 1 ? '!' : ''}`);
    if (st !== 'C' && st !== 'X') problems.push(`round ${i}: final key ${st}`);
    if (c.msg === 1 && (st !== 'X' || notif !== 1)) problems.push(`round ${i}: cancel claimed but key=${st} notif=${notif}`);
    if (c.msg !== 1 && (st !== 'C' || notif !== 1)) problems.push(`round ${i}: cancel refused (${c.value}) but key=${st} notif=${notif}`);
    if (distinctTerminal.size > 1) problems.push(`round ${i}: terminal emits ${terminalEmits.join(',')}`);
    if (hash.finalized !== '1' || hash.notified !== '1') problems.push(`round ${i}: hash finalized=${hash.finalized} notified=${hash.notified}`);
    if (st === 'X' && snap.nCompleted > N) problems.push(`round ${i}: X with nCompleted ${snap.nCompleted} > ${N}`);
  }
  const cancelled = outcomes.filter(o => o.endsWith('!')).length;
  const pass = problems.length === 0 && cancelled > 0 && cancelled < ROUNDS;
  const numbers = `rounds=${ROUNDS} cancelledInTime=${cancelled} finishedFirst=${ROUNDS - cancelled} outcomes=[${outcomes.join(' ')}] invariantViolations=${problems.length}${problems.length ? ' :: ' + problems.slice(0, 4).join(' | ') : ''}`;
  await h.teardown();
  return verdict('Q2b', pass, numbers, { problems });
}

async function restartDuringOrchestrator() {
  const N = 20;
  const h = new HarnessV2({ label: 'Q2c' });
  await h.flush();
  const files = makeFiles(N, 'q2c');
  h.db.getfiles = async () => { await sleep(1200); return files; };   // a slow hyperlink_getfiles (same latency every call)
  h.scan = { delayMs: 20, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '3' });
  const body = bodyFor({ nSectionid: 'S-Q2c', nBundleid: 'B' });
  const r1 = await s.gen.starthyperlink(body, false);
  const key = r1.data.queueName, batchId = r1.data.batchId;
  await sleep(300);
  const c = await s.gen.cancelhyperlink({ nCaseid: 'c1', nSectionid: 'S-Q2c', nBundleid: 'B' } as any);
  await sleep(100);
  const r2 = await s.gen.starthyperlink(body, false);
  const hashAfterRestart = await h.redis.hgetall(`HYPERLINK-BATCH/${batchId}`);
  // wait for both orchestrator runs and every scan to end
  await h.waitFor(() => h.getfilesCalls >= 2 && h.scanCalls.length >= N && h.scanCalls.every(x => !!x.tEnd), 20000);
  await h.waitFor(async () => { const sn = await h.snapshot(key); return !!sn && sn.cStatus !== 'P'; }, 6000);
  await sleep(1000);
  const snap = await h.snapshot(key);
  const hash = await h.redis.hgetall(`HYPERLINK-BATCH/${batchId}`);
  const ignored = h.logs.filter(l => /belongs to an older run/.test(l)).length;
  const skipped = h.logs.filter(l => /already enqueued by an earlier run|enqueued by a concurrent run/.test(l)).length;
  const sc = h.scanStats(batchId);
  const spC = h.spCalls.filter(x => x.sp.startsWith('hyperlink_update_documents') && x.cStatus === 'C').length;
  const notif = h.notifications().length;
  const counts = await h.counts(s.fq);
  const r3 = await s.gen.starthyperlink(body, false);
  const pass = c.msg === 1 && r2.msg === 1 && snap?.cStatus === 'C' && snap.nCompleted === N && notif === 2 && ignored === 0;
  const numbers = `cancel@300ms msg=${c.msg} restart@400ms msg=${r2.msg} (new run=${hashAfterRestart.run}) getfilesCalls=${h.getfilesCalls} orchestratorSkips=${skipped} | `
    + `after all scans: key=${snap?.cStatus} ${snap?.nCompleted}/${snap?.nTotal} hash=${hash.done}+${hash.failed}/${hash.total} run=${hash.run} enqueueDone=${hash.enqueueDone} finalized=${hash.finalized || 0} `
    + `scans=${sc.totalCalls} SP'C'=${spC} fileJobsIgnoredAsOlderRun=${ignored} notifications=${notif} queue=w${counts.waiting}/a${counts.active} | 3rd start now -> msg=${r3.msg} "${r3.value}"`;
  await h.teardown();
  return verdict('Q2c', pass, numbers, { hash, ignored });
}

async function restartWithInFlight() {
  const N = 30;
  const h = new HarnessV2({ label: 'Q2d' });
  await h.flush();
  const files = makeFiles(N, 'q2d');
  h.db.getfiles = () => files;
  h.scan = { delayMs: 400, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '3' });
  const body = bodyFor({ nSectionid: 'S-Q2d', nBundleid: 'B' });
  const r1 = await s.gen.starthyperlink(body, false);
  const key = r1.data.queueName, batchId = r1.data.batchId;
  await h.waitFor(() => h.scanCalls.filter(c => c.tEnd).length >= 3, 5000);
  const c = await s.gen.cancelhyperlink({ nCaseid: 'c1', nSectionid: 'S-Q2d', nBundleid: 'B' } as any);
  const inFlight = h.scanCalls.filter(x => !x.tEnd).length;
  const scansRun1 = h.scanCalls.length;
  const r2 = await s.gen.starthyperlink(body, false);
  const done = await h.waitForDone(key, 30000);
  await sleep(800);
  const hash = await h.redis.hgetall(`HYPERLINK-BATCH/${batchId}`);
  const ignored = h.logs.filter(l => /belongs to an older run/.test(l)).length;
  const scansRun2 = h.scanCalls.length - scansRun1;
  const notif = h.notifications().length;
  const cEmits = h.responces(key).filter(e => e.data.data.cStatus === 'C').length;
  // jobs held 'active' by the hard cap (5) but waiting on the semaphore (3)
  // cannot be drained by cancel; after an immediate restart they scan for
  // nothing (the new hash is not cancelled) and are then ignored: <= 2 wasted
  const wasted = scansRun2 - N;
  const pass = c.msg === 1 && r2.msg === 1 && done?.cStatus === 'C' && done.nCompleted === N && Number(hash.done) === N && notif === 2 && ignored === inFlight + wasted && wasted <= 2 && cEmits === 1;
  const numbers = `cancel msg=${c.msg} inFlightAtCancel=${inFlight} restart msg=${r2.msg} -> ${done?.cStatus} ${done?.nCompleted}/${done?.nTotal} hash=${hash.done}/${hash.total} `
    + `scansRun1=${scansRun1} scansAfterRestart=${scansRun2} (= ${N} new run + ${wasted} run-1 jobs the drain could not remove, scanned for nothing) oldRunJobsIgnored=${ignored} notifications=${notif} finalCEmits=${cEmits}`;
  await h.teardown();
  return verdict('Q2d', pass, numbers, { hash });
}
