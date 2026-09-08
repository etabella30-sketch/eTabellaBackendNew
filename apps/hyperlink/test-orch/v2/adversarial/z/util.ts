/** Helpers of the Z scenarios (test-side only, no product code). */
import { HarnessV2, ScanCall } from '../../harness';

/** Peak number of stub scans running at the same instant (no tEnd = still running). */
export function peakConcurrent(calls: ScanCall[]): number {
  const ev: [number, number][] = [];
  for (const c of calls) { ev.push([c.t, 1]); ev.push([c.tEnd === undefined ? Number.MAX_SAFE_INTEGER : c.tEnd, -1]); }
  ev.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let cur = 0, max = 0;
  for (const [, d] of ev) { cur += d; if (cur > max) max = cur; }
  return max;
}

export async function ttls(h: HarnessV2, progressKey: string, batchId: string) {
  const t = (k: string) => h.redis.ttl(k);
  return { key: await t(progressKey), hash: await t(`HYPERLINK-BATCH/${batchId}`), seen: await t(`HYPERLINK-BATCH/${batchId}/seen`), failed: await t(`HYPERLINK-BATCH/${batchId}/failed`), jobs: await t(`HYPERLINK-BATCH/${batchId}/jobs`) };
}
export const fmt = (o: Record<string, any>) => Object.entries(o).map(([k, v]) => `${k}=${v}`).join(' ');
/** every present key (-2 = missing) has a finite TTL in (0, max] */
export const within = (t: Record<string, number>, max: number) => Object.values(t).every(v => v === -2 || (v > 0 && v <= max));

/** statuses of the HYPERLINK-RESPONCE events of one key, in order */
export function statusSeq(h: HarnessV2, key: string) {
  const seq = h.responces(key).map(e => e.data.data.cStatus as string);
  const firstT = seq.findIndex(s => s !== 'P');
  return { seq: seq.join(''), terminals: [...new Set(seq.filter(s => s !== 'P'))], pAfterTerminal: firstT < 0 ? 0 : seq.slice(firstT).filter(s => s === 'P').length, terminalEmits: seq.filter(s => s !== 'P').length };
}

export const age = async (h: HarnessV2, key: string, minutes: number) => {
  const raw = await h.redis.get(key); const snap = JSON.parse(raw);
  const old = new Date(Date.now() - minutes * 60000).toISOString();
  snap.dUpdate = old; snap.dStart = old;
  const ttl = await h.redis.ttl(key);
  await h.redis.set(key, JSON.stringify(snap), 'EX', ttl > 0 ? ttl : 172800);
  return snap;
};
