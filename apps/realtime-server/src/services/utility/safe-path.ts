import * as path from 'path';

/** Canonical 8-4-4-4-12 hex UUID (any version). Session and case ids in this app are UUIDs. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** One file-name segment: letters, digits, dot, underscore, dash. No separators, no leading dot. */
const SAFE_BASENAME_RE = /^[A-Za-z0-9_][A-Za-z0-9._-]{0,199}$/;

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}

/** True for a single, plain file name that cannot climb out of the directory it is joined to. */
export function isSafeBasename(value: unknown): value is string {
  return typeof value === 'string' && SAFE_BASENAME_RE.test(value) && !value.includes('..');
}

/**
 * Resolves `relative` against `baseDir` and returns the absolute result only when it stays
 * strictly inside `baseDir`; returns null for traversal, absolute paths, NUL bytes or empty input.
 */
export function resolveInside(baseDir: unknown, relative: unknown): string | null {
  if (typeof baseDir !== 'string' || typeof relative !== 'string') return null;
  if (!relative || relative.includes('\0') || baseDir.includes('\0')) return null;
  const base = path.resolve(baseDir);
  const target = path.resolve(base, relative);
  const rel = path.relative(base, target);
  if (!rel || rel === '..' || rel.startsWith('..' + path.sep) || path.isAbsolute(rel)) return null;
  return target;
}
