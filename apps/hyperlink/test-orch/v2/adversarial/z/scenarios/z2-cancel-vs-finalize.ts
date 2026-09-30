/**
 * Z2 (b) - cancel racing the finalize when ONE file is left.
 *   Z2a: the last file is in flight (python hangs, killFile "signals" it) ->
 *        cancel: X, the killed file gets no SP call, one "cancelled"
 *        notification, no "Successful" one.
 *   Z2b: cancel lands INSIDE the window between the finalizing Lua (hash
 *        finalized, key already C) and finalize() (delayed 400 ms by a hook):
 *        cancel must answer "not running", the key must stay C, exactly one
 *        notification ("Successful"), no X anywhere.
 *   Z2c: 30 tight rounds (3 files, cancel fired the instant done reaches 2):
 *        every round ends with exactly one terminal status, one notification
 *        matching it, no 'P' after the terminal event, key TTL <= done TTL,
 *        finalized=notified=1, and the scope can be started again.
 */
import { HarnessV2, bodyFor, makeFiles, verdict, sleep, now } from '../../../harness';
import { statusSeq } from '../util';

export async function run() {
  return [await lastInFlight(), await insideWindow(), await tightRounds()];
}

async function lastInFlight() {
  const h = new HarnessV2({ label: 'Z2a' });
  await h.flush();
  const files = makeFiles(6, 'z2a');
  h.db.getfiles = () => files;
  h.scan = { delayMs: 20, result: (f) => f.nBundledetailid === 'z2a-00006' ? 'hang' : true };
  h.killFileHook = () => true;
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '1' });
  const body = bodyFor({ nSectionid: 'S-Z2a', nBundleid: 'B' });
  const r = await s.gen.starthyperlink(body, false);
  const key = r.data.queueName, batchId = r.data.batchId;
  await h.waitFor(async () => (await h.redis.hget(`HYPERLINK-BATCH/${batchId}`, 'done')) === '5' && h.scanCalls.some(c => c.nBundledetailid === 'z2a-00006'), 10000);
  const c = await s.gen.cancelhyperlink(body as any);
  await sleep(1500);
  const snap = await h.snapshot(key);
  const hash = await h.redis.hgetall(`HYPERLINK-BATCH/${batchId}`);
  const sp6 = h.spCalls.filter(x => x.nBundledetailid === 'z2a-00006' && x.sp.startsWith('hyperlink_update')).length;
  const notif = h.notifications().map(e => e.data.cMsg.split(' | ')[0]);
  const seq = statusSeq(h, key);
  const ttl = await h.redis.ttl(key);
  const pass = c.msg === 1 && snap?.cStatus === 'X' && snap.nCompleted === 5 && sp6 === 0 && notif.length === 1 && /cancelled/.test(notif[0]) && seq.terminals.length === 1 && seq.pAfterTerminal === 0 && ttl > 0 && ttl <= 900;
  const numbers = `cancel with the 6th file in flight: msg=${c.msg} killed=${c.killed} -> key=${snap?.cStatus} ${snap?.nCompleted}/${snap?.nTotal} failed=${snap?.nFailed} jFailed=${JSON.stringify(snap?.jFailed?.map(f => `${f.nBundledetailid}:${f.cReason}`))} hash=${hash.done}+${hash.failed} SPcallsForKilledFile=${sp6} notifications=[${notif.join(',')}] seq=${seq.seq} ttl=${ttl}`;
  await h.teardown();
  return verdict('Z2a', pass, numbers);
}

async function insideWindow() {
  const h = new HarnessV2({ label: 'Z2b' });
  await h.flush();
  const files = makeFiles(5, 'z2b');
  h.db.getfiles = () => files;
  h.scan = { delayMs: 20, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '1' });
  const origFinalize = s.batch.finalize.bind(s.batch);
  let finalizeCalls = 0, cancelDuringWindow: any = null, keyDuringWindow: any = null;
  const body = bodyFor({ nSectionid: 'S-Z2b', nBundleid: 'B' });
  s.batch.finalize = async (snap: any) => {
    finalizeCalls++;
    // the window: hash finalized=1, key C, notification not sent yet
    keyDuringWindow = await h.snapshot(snap.queueName);
    cancelDuringWindow = await s.gen.cancelhyperlink(body as any);
    await sleep(400);
    return origFinalize(snap);
  };
  const r = await s.gen.starthyperlink(body, false);
  const key = r.data.queueName, batchId = r.data.batchId;
  await h.waitFor(() => finalizeCalls > 0, 10000);
  await sleep(1500);
  const snap = await h.snapshot(key);
  const hash = await h.redis.hgetall(`HYPERLINK-BATCH/${batchId}`);
  const notif = h.notifications().map(e => e.data.cMsg.split(' | ')[0]);
  const seq = statusSeq(h, key);
  const again = await s.gen.starthyperlink(body, false);
  const pass = finalizeCalls === 1 && cancelDuringWindow?.msg === -1 && keyDuringWindow?.cStatus === 'C' && snap?.cStatus === 'C' && snap.nCompleted === 5
    && notif.length === 1 && /Successful/.test(notif[0]) && seq.terminals.length === 1 && seq.terminals[0] === 'C' && again.msg === 1;
  const numbers = `finalizeCalls=${finalizeCalls} keyInWindow=${keyDuringWindow?.cStatus} cancelInWindow msg=${cancelDuringWindow?.msg} "${cancelDuringWindow?.value}" -> key=${snap?.cStatus} ${snap?.nCompleted}/${snap?.nTotal} hash finalized=${hash.finalized} notified=${hash.notified} cancelled=${hash.cancelled} notifications=[${notif.join(',')}] seq=${seq.seq} restartAfter=${again.msg}`;
  await h.teardown();
  return verdict('Z2b', pass, numbers);
}

async function tightRounds() {
  const ROUNDS = 30;
  const h = new HarnessV2({ label: 'Z2c' });
  await h.flush();
  // the last file's scan length varies per round (0..7 ms) so the cancel lands
  // at different points of the finalizing file's life
  let round = 0;
  h.scan = { delayMs: (f) => f.nBundledetailid.endsWith('00003') ? (round % 8) : 5, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '3' });
  const outcomes: string[] = [];
  const violations: string[] = [];
  let cancelledRounds = 0;
  for (let i = 0; i < ROUNDS; i++) {
    round = i;
    const files = makeFiles(3, `z2c${i}`);
    h.db.getfiles = () => files;
    const body = bodyFor({ nSectionid: `S-Z2c-${i}`, nBundleid: 'B' });
    const notifBefore = h.notifications().length;
    const r = await s.gen.starthyperlink(body, false);
    const key = r.data.queueName, batchId = r.data.batchId;
    // fire the cancel the instant the second file is counted
    const t = now();
    while (now() - t < 5000) { const d = await h.redis.hget(`HYPERLINK-BATCH/${batchId}`, 'done'); if (Number(d) >= 2) break; }
    const c = await s.gen.cancelhyperlink(body as any);
    const done = await h.waitForDone(key, 5000);
    await sleep(250);
    const hash = await h.redis.hgetall(`HYPERLINK-BATCH/${batchId}`);
    const notifs = h.notifications().slice(notifBefore).map(e => e.data.cMsg.split(' | ')[0]);
    const seq = statusSeq(h, key);
    const ttl = await h.redis.ttl(key);
    const counts = await h.counts(s.fq);
    const again = await s.gen.starthyperlink(body, false);
    if (again.msg === 1) await s.gen.cancelhyperlink(body as any);
    const st = done?.cStatus;
    outcomes.push(`${st}${c.msg === 1 ? '!' : ''}`);
    if (c.msg === 1) cancelledRounds++;
    const bad: string[] = [];
    if (!(st === 'C' || st === 'X')) bad.push(`status=${st}`);
    if (c.msg === 1 && st !== 'X') bad.push(`cancel accepted but key=${st}`);
    if (c.msg === -1 && st !== 'C') bad.push(`cancel refused but key=${st}`);
    if (notifs.length !== 1) bad.push(`notifications=${notifs.length}`);
    if (notifs.length === 1 && ((st === 'X') !== /cancelled/.test(notifs[0]))) bad.push(`notification "${notifs[0]}" vs ${st}`);
    if (seq.terminals.length !== 1 || seq.pAfterTerminal) bad.push(`seq=${seq.seq}`);
    if (hash.finalized !== '1' || hash.notified !== '1') bad.push(`hash fin/notif=${hash.finalized}/${hash.notified}`);
    if (!(ttl > 0 && ttl <= 900)) bad.push(`ttl=${ttl}`);
    if (counts.waiting + counts.active + counts.delayed + counts.failed) bad.push(`queue=w${counts.waiting}/a${counts.active}`);
    if (again.msg !== 1) bad.push(`restart=${again.msg}`);
    if (bad.length) violations.push(`round ${i}: ${bad.join(', ')}`);
  }
  const pass = violations.length === 0;
  const numbers = `rounds=${ROUNDS} cancelledInTime=${cancelledRounds} finishedFirst=${ROUNDS - cancelledRounds} outcomes=[${outcomes.join(' ')}] invariantViolations=${violations.length}${violations.length ? ' ' + violations.slice(0, 3).join(' | ') : ''}`;
  await h.teardown();
  return verdict('Z2c', pass, numbers, { violations });
}
