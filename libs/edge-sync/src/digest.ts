/**
 * Pure serialization digests (spec §5.2), versioned by `fmt`.
 *
 *   pageDigest = sha256("p" + fmt + "|" + JSON.stringify(lines))
 *   root       = sha256("r1|" + nSesid + "|" + totalLines + "|" + pageDigest_1..N joined by "|")
 *
 * `lines` is a canonical page: a JSON array of arrays, strings, numbers and
 * nulls (canonical.ts), so the serialization round-trips byte for byte and the
 * cloud can check `digest(lines as received)` without re-canonicalising.
 *
 * `fmt` is pinned per session (SESSION_HEADER, c.assign). The cloud keeps a
 * verifier for every fmt that has unsealed sessions (§5.3 "Compatibility"):
 * add a case to serializePage for a new fmt, never change an existing one.
 *
 * All digests are lowercase hex sha256. Only node:crypto is used.
 */
import { createHash } from 'node:crypto';
import { EDGE_FMT, SUPPORTED_FMTS } from './protocol';

/** Thrown for a page format this build has no serializer for. */
export class UnsupportedFmtError extends Error {
  constructor(readonly fmt: unknown) {
    super(`edge-sync: unsupported page format fmt=${String(fmt)} (supported: ${SUPPORTED_FMTS.join(', ')})`);
    this.name = 'UnsupportedFmtError';
  }
}

/** True for a fmt this build can serialize and verify. */
export function isSupportedFmt(fmt: unknown): fmt is number {
  return typeof fmt === 'number' && SUPPORTED_FMTS.includes(fmt);
}

/** Throws UnsupportedFmtError unless fmt is supported. */
export function assertFmt(fmt: unknown): number {
  if (!isSupportedFmt(fmt)) throw new UnsupportedFmtError(fmt);
  return fmt;
}

/** The exact bytes (as a string) a page digest covers, for the given fmt. */
export function serializePage(lines: readonly unknown[], fmt: number = EDGE_FMT): string {
  switch (assertFmt(fmt)) {
    case 1:
      return JSON.stringify(lines);
    default:
      throw new UnsupportedFmtError(fmt);
  }
}

/** Lowercase hex sha256 of a UTF-8 string. */
export function sha256Hex(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

/** Digest of one canonical page. */
export function pageDigest(lines: readonly unknown[], fmt: number = EDGE_FMT): string {
  return sha256Hex('p' + fmt + '|' + serializePage(lines, fmt));
}

/** Digests of pages 1..N (array index p-1 holds page p). */
export function pageDigests(pages: readonly (readonly unknown[])[], fmt: number = EDGE_FMT): string[] {
  return pages.map(page => pageDigest(page, fmt));
}

/**
 * Root over a whole transcript state: the session, its line count and the
 * digest of every page in order (index p-1 holds page p). The root does not
 * carry fmt; every page digest does.
 */
export function rootDigest(nSesid: string, totalLines: number, digests: readonly string[]): string {
  return sha256Hex('r1|' + nSesid + '|' + totalLines + '|' + digests.join('|'));
}

const DIGEST_RE = /^[0-9a-f]{64}$/;

/** True for a lowercase hex sha256 string. */
export function isDigest(value: unknown): value is string {
  return typeof value === 'string' && DIGEST_RE.test(value);
}
