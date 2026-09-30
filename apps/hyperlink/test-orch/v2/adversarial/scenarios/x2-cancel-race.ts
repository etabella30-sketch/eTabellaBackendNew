/**
 * X2 (b) - cancel racing with finalize.
 *   X2a: 8 rounds; 6 files, 1 worker, 40 ms each; the cancel is fired the
 *        instant the hash shows done == 5 (last file in flight). Record, per
 *        round, the final status / notifications / key history and check that
 *        the outcome is consistent: X with 1 notification ("cancelled", D3), or C with 1 and
 *        the cancel reporting it was too late.
 *   X2b: cancel AFTER the batch completed (key C, hash still present): must
 *        not rewrite a finished batch to X.
 *   X2c: cancel 30 ms after start while the orchestrator is still adding
 *        2,000 file jobs: X, queue drains to 0, no counting after cancel.
 */
import { HarnessV2, bodyFor, makeFiles, now, verdict, sleep } from '../../harness';

export async function run() {
  return [await raceRounds(), await cancelAfterComplete(), await cancelDuringEnqueue()];
}

async function raceRounds() {
  const h = new HarnessV2({ label: 'X2a' });
  await h.flush();
  const N = 6;
  h.scan = { delayMs: 40, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '1' });
  const rounds: string[] = [];
  let inconsistent = 0, flipped = 0;
  for (let r = 0; r < 8; r++) {
    h.db.getfiles = () => makeFiles(N, `x2a${r}`);
    h.events.length = 0;
    const body = bodyFor({ nSectionid: `S-X2a-${r}`, nBundleid: 'B' });
    const res = await s.gen.starthyperlink(body, false);
    const key = res.data.queueName, batchId = res.data.batchId;
    const hashKey = `HYPERLINK-BATCH/${batchId}`;
    // spin until the last file is in flight
    const armed = await h.waitFor(async () => Number(await h.redis.hget(hashKey, 'done')) >= N - 1, 5000, 1);
    const cres = await s.gen.cancelhyperlink({ nCaseid: body.nCaseid, nSectionid: body.nSectionid, nBundleid: body.nBundleid } as any);
    // sample the key status for 400 ms
    const hist: string[] = [];
    const tEnd = now() + 400;
    while (now() < tEnd) { const st = (await h.snapshot(key))?.cStatus || '-'; if (hist[hist.length - 1] !== st) hist.push(st); await sleep(2); }
    await sleep(300);
    const fin = await h.snapshot(key);
    const hash = await h.redis.hgetall(hashKey);
    const notif = h.notifications().length;
    const emits = h.responces(key).map(e => e.data.data.cStatus).join('');
    const ok = (fin?.cStatus === 'X' && notif === 1) || (fin?.cStatus === 'C' && notif === 1 && cres.msg !== 1);
    if (!ok) inconsistent++;
    if (hist.includes('C') && fin?.cStatus === 'X') flipped++;
    rounds.push(`r${r}:armed@done=${armed >= 0 ? 'ok' : 'late'} cancel=${cres.msg} final=${fin?.cStatus} ${fin?.nCompleted}/${fin?.nTotal} hash=${hash.done}/${hash.total} notif=${notif} keyHist=${hist.join('>')} emits=${emits}`);
  }
  const pass = inconsistent === 0;
  const numbers = `inconsistentRounds=${inconsistent}/8 completedThenFlippedToX=${flipped} | ${rounds.join(' | ')}`;
  await h.teardown();
  return verdict('X2a', pass, numbers);
}

async function cancelAfterComplete() {
  const h = new HarnessV2({ label: 'X2b' });
  await h.flush();
  h.db.getfiles = () => makeFiles(5, 'x2b');
  h.scan = { delayMs: 10, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '3' });
  const body = bodyFor({ nSectionid: 'S-X2b', nBundleid: 'B' });
  const res = await s.gen.starthyperlink(body, false);
  const key = res.data.queueName;
  const done = await h.waitForDone(key, 10000);
  await sleep(200);
  const notifBefore = h.notifications().length;
  const cres = await s.gen.cancelhyperlink({ nCaseid: body.nCaseid, nSectionid: body.nSectionid, nBundleid: body.nBundleid } as any);
  const after = await h.snapshot(key);
  const hash = await h.redis.hgetall(`HYPERLINK-BATCH/${res.data.batchId}`);
  const xEmits = h.responces(key).filter(e => e.data.data.cStatus === 'X').length;
  const pass = done?.cStatus === 'C' && after?.cStatus === 'C';
  const numbers = `finished=${done?.cStatus} ${done?.nCompleted}/${done?.nTotal} -> cancel msg=${cres.msg} "${cres.value}" -> key now=${after?.cStatus} ${after?.nCompleted}/${after?.nTotal} hash.cancelled=${hash.cancelled} X-emits=${xEmits} notifications=${notifBefore}`;
  await h.teardown();
  return verdict('X2b', pass, numbers);
}

async function cancelDuringEnqueue() {
  const N = 2000;
  const h = new HarnessV2({ label: 'X2c' });
  await h.flush();
  h.db.getfiles = () => makeFiles(N, 'x2c');
  h.scan = { delayMs: 30, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '3' });
  const body = bodyFor({ nSectionid: 'S-X2c', nBundleid: 'B' });
  const res = await s.gen.starthyperlink(body, false);
  const key = res.data.queueName, batchId = res.data.batchId;
  await sleep(30);
  const tCancel = now();
  const enqueueDoneAtCancel = (await h.redis.hget(`HYPERLINK-BATCH/${batchId}`, 'enqueueDone')) === '1';
  const cres = await s.gen.cancelhyperlink({ nCaseid: body.nCaseid, nSectionid: body.nSectionid, nBundleid: body.nBundleid } as any);
  const scansAtCancel = h.scanCalls.length;
  const idle = await h.waitFor(async () => { const c = await h.counts(s.fq); return c.waiting + c.active + c.delayed === 0; }, 20000, 50);
  await sleep(500);
  const counts = await h.counts(s.fq);
  const scansAfter = h.scanCalls.filter(c => c.t > tCancel + 5).length;
  const snap = await h.snapshot(key);
  const hash = await h.redis.hgetall(`HYPERLINK-BATCH/${batchId}`);
  const orchestratorErr = h.logs.filter(l => /Error in hyperlink batch/.test(l)).length;
  const pass = cres.msg === 1 && snap?.cStatus === 'X' && idle >= 0 && scansAfter <= 5
    && Number(hash.done) + Number(hash.failed) <= scansAtCancel + 5 && orchestratorErr === 0;
  const numbers = `cancelAt=30ms enqueueDoneAtCancel=${enqueueDoneAtCancel} cancel=${cres.msg} removed=${cres.removed} scansAtCancel=${scansAtCancel} scansAfterCancel=${scansAfter} `
    + `queueIdleAfter=${idle}ms queue=w${counts.waiting}/a${counts.active}/d${counts.delayed} final=${snap?.cStatus} ${snap?.nCompleted}/${snap?.nTotal} hash=${hash.done}/${hash.total} enqueueDone=${hash.enqueueDone} orchestratorErrors=${orchestratorErr}`;
  await h.teardown();
  return verdict('X2c', pass, numbers, { counts, hash });
}
