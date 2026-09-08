/**
 * X9 - the orchestrator's "first snapshot" (step 5) is written AFTER addBulk
 * with a read-then-write of the progress key. If every file job finishes
 * before that write (tiny batch, instant scans), the final C snapshot written
 * by the Lua can be overwritten by a 'P' snapshot with the batch TTL: the
 * batch then shows P (and blocks the scope) although the hash is finalized.
 * 30 rounds of a 2-file batch with 0 ms scans and 5 workers.
 */
import { HarnessV2, bodyFor, makeFiles, verdict, sleep } from '../../harness';

export async function run() {
  const h = new HarnessV2({ label: 'X9' });
  await h.flush();
  h.scan = { delayMs: 0, result: true };
  const s = await h.stack('w1', { HYPERLINK_WORKERS: '5' });
  let stuck = 0, rounds = 0, blocked = 0;
  const samples: string[] = [];
  for (let r = 0; r < 30; r++) {
    h.db.getfiles = () => makeFiles(2, `x9r${r}`);
    const body = bodyFor({ nSectionid: `S-X9-${r}`, nBundleid: 'B' });
    const res = await s.gen.starthyperlink(body, false);
    const key = res.data.queueName, hashKey = `HYPERLINK-BATCH/${res.data.batchId}`;
    const fin = await h.waitFor(async () => (await h.redis.hget(hashKey, 'finalized')) === '1', 5000, 5);
    await sleep(150);
    const snap = await h.snapshot(key);
    const ttl = await h.redis.ttl(key);
    rounds++;
    if (fin >= 0 && snap?.cStatus === 'P') {
      stuck++;
      const again = await s.gen.starthyperlink(body, false);
      if (again.msg === -1) blocked++;
      if (samples.length < 3) samples.push(`r${r}: hash finalized=1 done=${await h.redis.hget(hashKey, 'done')} but key=${snap.cStatus} ${snap.nCompleted}/${snap.nTotal} ttl=${ttl}s restart=${again.msg}`);
    }
  }
  const pass = stuck === 0;
  const numbers = `rounds=${rounds} keyLeftAs'P'AfterFinalize=${stuck} restartBlocked=${blocked} ${samples.length ? '| ' + samples.join(' | ') : ''}`;
  await h.teardown();
  return verdict('X9', pass, numbers);
}
