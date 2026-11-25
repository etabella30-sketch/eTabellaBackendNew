import { createHash } from 'crypto';

/**
 * One Mark per gesture. Day 3 load QA (2026-10-29): 30 identical insertquickfact calls sent at once stored 30
 * QFacts; a double-click or a client retry does the same at a smaller scale. The same user writing the same
 * Mark (route, case, session, page, line, kind, text, note, coordinates, link targets) within
 * {@link MARK_DEDUPE_WINDOW_MS} gets the first request's reply. Concurrent copies wait for that first request
 * instead of racing it. A refusal or failure is not remembered, so a retry runs again. Per process, nothing
 * persists; a restart only forgets the window.
 */
export const MARK_DEDUPE_WINDOW_MS = 10_000;

const recent = new Map<string, { at: number; reply: Promise<unknown> }>();

type MarkKeyBody = {
  nCaseid?: unknown; nSesid?: unknown; nBDid?: unknown; nBundledetailid?: unknown; nPage?: unknown; nLine?: unknown;
  cFtype?: unknown; cType?: unknown; nQFSid?: unknown; jOT?: unknown; jT?: unknown; jDl?: unknown; jCordinates?: unknown;
};

/** The identity of one Mark write, or null when the caller is unknown (then nothing is deduplicated). */
export function markWriteKey(route: string, userId: string | undefined | null, body: MarkKeyBody): string | null {
  if (!userId || !body) return null;
  const coords = Array.isArray(body.jCordinates)
    ? (body.jCordinates as { p?: unknown; l?: unknown; text?: unknown }[]).map(c => [c?.p, c?.l, c?.text])
    : null;
  return createHash('sha256').update(JSON.stringify([
    route, userId, body.nCaseid, body.nSesid, body.nBDid, body.nBundledetailid, body.nPage, body.nLine,
    body.cFtype, body.cType, body.nQFSid, body.jOT, body.jT, body.jDl, coords,
  ])).digest('hex');
}

const succeeded = (reply: unknown) => !!reply && typeof reply === 'object' && Number((reply as { msg?: unknown }).msg) === 1;

/** Run `write` unless the same Mark write ran within the window; then answer that run's reply. */
export function onceWithinWindow<T>(key: string | null, write: () => Promise<T>, now: () => number = Date.now): Promise<T> {
  if (!key) return write();
  const t = now();
  for (const [k, v] of recent) if (t - v.at >= MARK_DEDUPE_WINDOW_MS) recent.delete(k);
  const hit = recent.get(key);
  if (hit) return hit.reply as Promise<T>;
  const reply = write();
  recent.set(key, { at: t, reply });
  reply.then(r => { if (!succeeded(r)) recent.delete(key); }, () => recent.delete(key));
  return reply;
}

/** Tests only. */
export function resetMarkDedupe(): void { recent.clear(); }
