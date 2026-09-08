/**
 * A12 - Cancel semantics (owner decision D3).
 *  (a) cancel of a FINISHED batch: C (normal end), F (getfiles threw) -> msg -1
 *      and the snapshot is byte-for-byte unchanged (no rewrite, no X emit, no
 *      notification, TTL not extended); X (already cancelled) -> msg 1
 *      idempotent, snapshot unchanged.
 *  (b) cancel racing with finalize: 24 rounds of a 4-file batch (2 workers,
 *      15 ms per file), the cancel sent at moments spread from "before the
 *      first scan" to "after the last one". Invariants per round: final key
 *      C or X (never P/F), exactly ONE terminal state emitted, exactly ONE
 *      notification ("Hyperlink Successful" when C, "Hyperlink cancelled"
 *      when X), cancel msg 1 <=> X, hash finalized + notified.
 */
import { HarnessV2, bodyFor, makeFiles, verdict, sleep } from '../harness';

export async function run() {
  const a = await cancelFinished();
  const b = await race();
  const pass = a.pass && b.pass;
  return verdict('A12', pass, `${a.numbers} || ${b.numbers}`, { a: a.details, b: b.details });
}

async function cancelFinished() {
  const h = new HarnessV2({ label: 'A12a' });
  await h.flush();
  h.db.getfiles = (q) => { if (q.nBundleid === 'ERR') throw new Error('getfiles exploded'); return makeFiles(5, 'a12a'); };
  h.scan = { delayMs: 10, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '3' });
  const results: string[] = [];
  let ok = true;
  const check = async (label: string, body: any, expectMsg: number) => {
    const r = await s.gen.starthyperlink(body, false);
    const key = r.data.queueName;
    const done = await h.waitForDone(key, 10000);
    if (label === 'X') { /* cancelled below */ }
    await sleep(200);
    const rawBefore = await h.redis.get(key);
    const ttlBefore = await h.redis.ttl(key);
    const notifBefore = h.notifications().length;
    const emitsBefore = h.responces(key).length;
    await sleep(1100);                                                // so a rewrite would move dUpdate / TTL
    const c = await s.gen.cancelhyperlink({ nCaseid: body.nCaseid, nSectionid: body.nSectionid, nBundleid: body.nBundleid } as any);
    const rawAfter = await h.redis.get(key);
    const ttlAfter = await h.redis.ttl(key);
    const notifAfter = h.notifications().length;
    const emitsAfter = h.responces(key).length;
    const unchanged = rawBefore === rawAfter;
    const good = c.msg === expectMsg && unchanged && ttlAfter <= ttlBefore && notifAfter === notifBefore && emitsAfter === emitsBefore;
    if (!good) ok = false;
    results.push(`${label}: final=${done?.cStatus} cancel msg=${c.msg} "${c.value}" snapshotUnchanged=${unchanged} ttl ${ttlBefore}->${ttlAfter} extraNotif=${notifAfter - notifBefore} extraEmits=${emitsAfter - emitsBefore}`);
  };
  await check('C', bodyFor({ nSectionid: 'S-A12a', nBundleid: 'C' }), -1);
  await check('F', bodyFor({ nSectionid: 'S-A12a', nBundleid: 'ERR' }), -1);
  // X: a 40-file batch cancelled while running, then cancelled again
  h.db.getfiles = () => makeFiles(40, 'a12x');
  h.scan = { delayMs: 60, result: true };
  const bodyX = bodyFor({ nSectionid: 'S-A12a', nBundleid: 'X' });
  const rX = await s.gen.starthyperlink(bodyX, false);
  await sleep(300);
  const c1 = await s.gen.cancelhyperlink({ nCaseid: 'c1', nSectionid: 'S-A12a', nBundleid: 'X' } as any);
  await h.waitFor(() => h.scanCalls.every(x => !!x.tEnd), 5000);
  await sleep(200);
  const rawBefore = await h.redis.get(rX.data.queueName);
  const notifBefore = h.notifications().length;
  await sleep(1100);
  const c2 = await s.gen.cancelhyperlink({ nCaseid: 'c1', nSectionid: 'S-A12a', nBundleid: 'X' } as any);
  const rawAfter = await h.redis.get(rX.data.queueName);
  const xUnchanged = rawBefore === rawAfter;
  const xOk = c1.msg === 1 && c2.msg === 1 && xUnchanged && h.notifications().length === notifBefore && JSON.parse(rawAfter).cStatus === 'X';
  if (!xOk) ok = false;
  results.push(`X: cancel msg=${c1.msg} again msg=${c2.msg} snapshotUnchanged=${xUnchanged} extraNotif=${h.notifications().length - notifBefore}`);
  await h.teardown();
  return { pass: ok, numbers: `(a) ${results.join(' ; ')}`, details: results };
}

async function race() {
  const ROUNDS = 24, N = 4, FILE_MS = 15;
  const h = new HarnessV2({ label: 'A12b' });
  await h.flush();
  h.scan = { delayMs: FILE_MS, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '2' });
  const outcomes: string[] = [];
  const problems: string[] = [];
  const span = N * FILE_MS + 80;
  for (let i = 0; i < ROUNDS; i++) {
    const files = makeFiles(N, `a12b${i}`);
    h.db.getfiles = () => files;
    const section = `S-A12b-${i}`;
    const body = bodyFor({ nSectionid: section, nBundleid: 'B' });
    const evBefore = h.events.length;
    const r = await s.gen.starthyperlink(body, false);
    if (r.msg !== 1) { problems.push(`round ${i}: start msg ${r.msg}`); continue; }
    const key = r.data.queueName, batchId = r.data.batchId;
    await sleep(Math.floor(span * i / (ROUNDS - 1)));
    const c = await s.gen.cancelhyperlink({ nCaseid: 'c1', nSectionid: section, nBundleid: 'B' } as any);
    await h.waitFor(async () => { const sn = await h.snapshot(key); return !!sn && sn.cStatus !== 'P'; }, 5000, 10);
    await h.waitFor(() => h.scanCalls.filter(x => x.batchId === batchId).every(x => !!x.tEnd), 3000, 10);
    await sleep(150);
    const snap = await h.snapshot(key);
    const hash = await h.redis.hgetall(`HYPERLINK-BATCH/${batchId}`);
    const evs = h.events.slice(evBefore);
    const notifs = evs.filter(e => e.topic === 'notification').map(e => String(e.data.cMsg));
    const terminalEmits = evs.filter(e => e.topic === 'hyperlink-response' && e.data?.data?.queueName === key && e.data.data.cStatus !== 'P').map(e => e.data.data.cStatus);
    const distinctTerminal = new Set(terminalEmits);
    const st = snap?.cStatus;
    outcomes.push(`${st}${c.msg === 1 ? '!' : ''}`);
    if (st !== 'C' && st !== 'X') problems.push(`round ${i}: final key ${st}`);
    if (notifs.length !== 1) problems.push(`round ${i}: ${notifs.length} notifications [${notifs.join('|')}]`);
    if (c.msg === 1 && (st !== 'X' || !/cancelled/.test(notifs[0] || ''))) problems.push(`round ${i}: cancel claimed but key=${st} notif=${notifs[0]}`);
    if (c.msg !== 1 && (st !== 'C' || !/Successful/.test(notifs[0] || ''))) problems.push(`round ${i}: cancel refused (${c.value}) but key=${st} notif=${notifs[0]}`);
    if (distinctTerminal.size !== 1) problems.push(`round ${i}: terminal emits ${terminalEmits.join(',') || 'none'}`);
    if (hash.finalized !== '1' || hash.notified !== '1') problems.push(`round ${i}: hash finalized=${hash.finalized} notified=${hash.notified}`);
  }
  const cancelled = outcomes.filter(o => o.endsWith('!')).length;
  const pass = problems.length === 0 && cancelled > 0 && cancelled < ROUNDS;
  const numbers = `(b) rounds=${ROUNDS} cancelledInTime=${cancelled} finishedFirst=${ROUNDS - cancelled} outcomes=[${outcomes.join(' ')}] invariantViolations=${problems.length}${problems.length ? ' :: ' + problems.slice(0, 4).join(' | ') : ''}`;
  await h.teardown();
  return { pass, numbers, details: problems };
}
