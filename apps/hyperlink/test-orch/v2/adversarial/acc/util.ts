/** Small helpers shared by the K scenarios (no product code here). */
import { HarnessV2, ScanCall } from '../../harness';

/** Peak number of scans running at the same instant (a call with no tEnd is still running). */
export function maxConcurrent(calls: ScanCall[]): number {
  const ev: [number, number][] = [];
  for (const c of calls) { ev.push([c.t, 1]); ev.push([c.tEnd === undefined ? Number.MAX_SAFE_INTEGER : c.tEnd, -1]); }
  ev.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let cur = 0, max = 0;
  for (const [, d] of ev) { cur += d; if (cur > max) max = cur; }
  return max;
}

/** TTLs of every key of a batch (progress key + hash/seen/failed/jobs). -2 = missing, -1 = no expiry. */
export async function batchTtls(h: HarnessV2, progressKey: string, batchId: string) {
  const ttl = (k: string) => h.redis.ttl(k);
  return {
    key: await ttl(progressKey),
    hash: await ttl(`HYPERLINK-BATCH/${batchId}`),
    seen: await ttl(`HYPERLINK-BATCH/${batchId}/seen`),
    failed: await ttl(`HYPERLINK-BATCH/${batchId}/failed`),
    jobs: await ttl(`HYPERLINK-BATCH/${batchId}/jobs`),
  };
}

export const fmtTtls = (t: Record<string, number>) => Object.entries(t).map(([k, v]) => `${k}=${v}`).join(' ');
/** every present key has a finite TTL <= max */
export const allTtlsWithin = (t: Record<string, number>, max: number) => Object.values(t).every(v => v === -2 || (v > 0 && v <= max));

/** Order of the socket events of one progress key: did a 'P' event come after the first terminal one? Are two different terminal statuses present? */
export function eventOrder(h: HarnessV2, key: string) {
  const ev = h.responces(key).map(e => e.data.data.cStatus as string);
  const firstTerminal = ev.findIndex(s => s !== 'P');
  const pAfterTerminal = firstTerminal >= 0 ? ev.slice(firstTerminal).filter(s => s === 'P').length : 0;
  const terminals = new Set(ev.filter(s => s !== 'P'));
  return { events: ev.length, pAfterTerminal, terminalStatuses: [...terminals], sequence: ev.join('') };
}
