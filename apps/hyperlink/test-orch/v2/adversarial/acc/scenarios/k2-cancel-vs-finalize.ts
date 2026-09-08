/**
 * K2 (b) - cancel racing the finalize.
 *   K2a: 20 rounds, 5 files x 30 ms, one worker; the cancel is fired the
 *        instant hash.done reaches 4 (the last file is in flight). Whatever
 *        wins, per round: exactly ONE terminal status (never both X and C
 *        events), no 'P' event after the terminal one, exactly one
 *        notification, snapshot counters == hash counters, key TTL <= done
 *        TTL, 5 scans (no re-scan), queue empty, cancel msg 1 when X / -1
 *        when C, hash.cancelled consistent with the status.
 *   K2b: cancel while the ORCHESTRATOR is still enqueueing (addBulk chunks
 *        slowed to 300 ms, 1000 files, cancel at 450 ms): no scan may start
 *        after the cancel returns, the jobs added after the cancel must
 *        drain themselves (queue empty), the key stays X, every batch key
 *        must end with the done TTL (the late markEnqueueDone must not
 *        re-arm a 48 h TTL), and a restart of the scope is accepted and
 *        finishes clean.
 */
import { HarnessV2, bodyFor, makeFiles, now, verdict, sleep } from '../../../harness';
import { batchTtls, fmtTtls, allTtlsWithin, eventOrder } from '../util';

export async function run() {
  return [await race(), await cancelDuringEnqueue()];
}

async function race() {
  const ROUNDS = 20, N = 5;
  const h = new HarnessV2({ label: 'K2a' });
  await h.flush();
  h.scan = { delayMs: 30, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '1' });
  const outcomes: string[] = [];
  const violations: string[] = [];
  let lagRounds = 0;   // X snapshot behind the hash by the file that finished after the cancel
  for (let r = 0; r < ROUNDS; r++) {
    const files = makeFiles(N, `k2r${r}`);
    h.db.getfiles = () => files;
    const body = bodyFor({ nSectionid: 'S-K2', nBundleid: `B${r}` });
    const notifBefore = h.notifications().length;
    const res = await s.gen.starthyperlink(body, false);
    if (res.msg !== 1) { violations.push(`r${r}: start refused ${res.value}`); continue; }
    const key = res.data.queueName, batchId = res.data.batchId, hashKey = `HYPERLINK-BATCH/${batchId}`;
    const reached = await h.waitFor(async () => Number(await h.redis.hget(hashKey, 'done')) >= N - 1, 10000, 3);
    // odd rounds: give the in-flight last file (30 ms) a head start so the finalize can win the race too
    if (r % 2 === 1) await sleep(15 + (r % 5) * 7);
    const cancel = await s.gen.cancelhyperlink({ nCaseid: body.nCaseid, nSectionid: body.nSectionid, nBundleid: body.nBundleid } as any);
    // settle: terminal key + straggler
    await h.waitFor(async () => { const snap = await h.snapshot(key); return !!snap && snap.cStatus !== 'P'; }, 5000, 5);
    await sleep(250);
    const snap = await h.snapshot(key);
    const hash = await h.redis.hgetall(hashKey);
    const ttl = await h.redis.ttl(key);
    const ord = eventOrder(h, key);
    const notifs = h.notifications().length - notifBefore;
    const scans = h.scanStats(batchId).totalCalls;
    const counts = await h.counts(s.fq);
    const st = snap?.cStatus;
    outcomes.push(`${st}${cancel.msg === 1 ? '!' : ''}`);
    const bad: string[] = [];
    if (reached < 0) bad.push('never reached N-1');
    if (st !== 'X' && st !== 'C') bad.push(`status ${st}`);
    if (ord.terminalStatuses.length !== 1) bad.push(`terminal events ${ord.sequence}`);
    if (ord.pAfterTerminal) bad.push(`P after terminal ${ord.sequence}`);
    if (notifs !== 1) bad.push(`notifications ${notifs}`);
    const lag = Number(hash.done) + Number(hash.failed) - ((snap?.nCompleted || 0) + (snap?.nFailed || 0));
    if (lag !== 0) { lagRounds++; if (st === 'C' || lag < 0 || lag > 1) bad.push(`snapshot ${snap?.nCompleted}/${snap?.nFailed} vs hash ${hash.done}/${hash.failed}`); }
    if (!(ttl > 0 && ttl <= 900)) bad.push(`ttl ${ttl}`);
    if (scans !== N) bad.push(`scans ${scans}`);
    if (counts.waiting + counts.active + counts.delayed + counts.failed) bad.push(`queue w${counts.waiting}/a${counts.active}/d${counts.delayed}/f${counts.failed}`);
    if (st === 'X' && (cancel.msg !== 1 || hash.cancelled !== '1' || hash.finalized !== '1')) bad.push(`X but cancel.msg=${cancel.msg} cancelled=${hash.cancelled} finalized=${hash.finalized}`);
    if (st === 'C' && (cancel.msg !== -1 || hash.cancelled === '1' || hash.finalized !== '1' || snap?.nCompleted !== N)) bad.push(`C but cancel.msg=${cancel.msg} "${cancel.value}" cancelled=${hash.cancelled} done=${snap?.nCompleted}`);
    if (bad.length) violations.push(`r${r}[${st}]: ${bad.join('; ')}`);
  }
  const xs = outcomes.filter(o => o.startsWith('X')).length, cs = outcomes.filter(o => o.startsWith('C')).length;
  const pass = violations.length === 0 && xs + cs === ROUNDS;
  const numbers = `rounds=${ROUNDS} cancelWon=${xs} finalizeWon=${cs} outcomes=[${outcomes.join(' ')}] xSnapshotBehindHashBy1=${lagRounds} (last file counted in hash + SP after the X snapshot, popup not updated) invariantViolations=${violations.length}${violations.length ? ' ' + JSON.stringify(violations.slice(0, 5)) : ''}`;
  await h.teardown();
  return verdict('K2a', pass, numbers, { violations });
}

async function cancelDuringEnqueue() {
  const N = 1000, FILE_MS = 20;
  const h = new HarnessV2({ label: 'K2b' });
  await h.flush();
  const files = makeFiles(N, 'k2b');
  h.db.getfiles = () => files;
  h.scan = { delayMs: FILE_MS, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '3' });
  // every addBulk chunk takes 300 ms (slow Redis / big chunks): the orchestrator is still enqueueing when the cancel arrives
  const origAddBulk = s.fq.addBulk.bind(s.fq);
  let chunks = 0, lastChunkAt = 0;
  (s.fq as any).addBulk = async (jobs: any[]) => { chunks++; await sleep(300); const r = await origAddBulk(jobs); lastChunkAt = now(); return r; };
  const body = bodyFor({ nSectionid: 'S-K2b', nBundleid: 'B-K2b' });
  const res = await s.gen.starthyperlink(body, false);
  const key = res.data.queueName, batchId = res.data.batchId;
  await sleep(450);
  const chunksAtCancel = chunks;
  const jobsRecordedAtCancel = await h.redis.scard(`HYPERLINK-BATCH/${batchId}/jobs`);
  const tCancel = now();
  const cancel = await s.gen.cancelhyperlink({ nCaseid: body.nCaseid, nSectionid: body.nSectionid, nBundleid: body.nBundleid } as any);
  const tCancelDone = now();
  const scansAtCancel = h.scanCalls.length;
  // wait for the orchestrator to finish its (now pointless) enqueue and the queue to drain
  await h.waitFor(() => chunks >= 2 && lastChunkAt > 0 && now() - lastChunkAt > 400, 5000, 50);
  const drained = await h.waitFor(async () => { const c = await h.counts(s.fq); return c.waiting + c.active + c.delayed === 0; }, 20000, 100);
  await sleep(500);
  const scansAfterCancel = h.scanCalls.filter(c => c.t > tCancelDone).length;
  const snap = await h.snapshot(key);
  const hash = await h.redis.hgetall(`HYPERLINK-BATCH/${batchId}`);
  const ttls = await batchTtls(h, key, batchId);
  const counts = await h.counts(s.fq);
  const ord = eventOrder(h, key);
  const notifs = h.notifications().length;
  const orchErrors = h.logs.filter(l => /Error in hyperlink batch/.test(l)).length;
  // restart the scope: must be accepted and run clean
  const res2 = await s.gen.starthyperlink(body, false);
  const done2 = res2.msg === 1 ? await h.waitForDone(res2.data.queueName, 60000) : null;
  const sc2 = h.scanCalls.filter(c => c.t > tCancelDone + 600 && c.batchId === batchId).length;
  const { hash: hashTtl, ...otherTtls } = ttls;   // the hash TTL leak is judged by K8d
  const pass = cancel.msg === 1 && snap?.cStatus === 'X' && scansAfterCancel === 0 && drained >= 0 && hash.cancelled === '1' && hash.finalized === '1'
    && allTtlsWithin(otherTtls, 900) && ord.terminalStatuses.length === 1 && ord.pAfterTerminal === 0 && notifs === 1
    && res2.msg === 1 && done2?.cStatus === 'C' && done2.nCompleted === N;
  const numbers = `cancel@450ms while enqueueing (chunksStarted=${chunksAtCancel}/2 jobsRecorded=${jobsRecordedAtCancel}) msg=${cancel.msg} removed=${cancel.removed} took=${tCancelDone - tCancel}ms scansAtCancel=${scansAtCancel} scansAfterCancel=${scansAfterCancel} `
    + `queueDrainedAfter=${drained >= 0 ? drained + 'ms' : 'never'} queue=w${counts.waiting}/a${counts.active}/d${counts.delayed} key=${snap?.cStatus} ${snap?.nCompleted}/${snap?.nTotal} hash: cancelled=${hash.cancelled} finalized=${hash.finalized} enqueueDone=${hash.enqueueDone} total=${hash.total} `
    + `TTLs after cancel+late enqueue: ${fmtTtls(ttls)} (hashTtlLeak=${hashTtl > 900 ? 'YES (' + hashTtl + 's, see K8d)' : 'no'}) events=${ord.sequence} notifications=${notifs} orchestratorErrors=${orchErrors} | restart msg=${res2.msg} -> ${done2?.cStatus} ${done2?.nCompleted}/${done2?.nTotal} scansOfRestart=${sc2}`;
  await h.teardown();
  return verdict('K2b', pass, numbers, { ttls, hash, counts });
}
