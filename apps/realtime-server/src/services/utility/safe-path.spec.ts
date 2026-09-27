import * as path from 'path';
import { isSafeBasename, isUuid, resolveInside } from './safe-path';

describe('isUuid', () => {
  it('accepts canonical UUIDs only', () => {
    expect(isUuid('000b14bd-7494-4908-9eab-a2fe0defb666')).toBe(true);
    expect(isUuid('000B14BD-7494-4908-9EAB-A2FE0DEFB666')).toBe(true);
    for (const bad of ['', '0', 'null', '../x', '000b14bd-7494-4908-9eab-a2fe0defb666/..', '000b14bd74944908', 42, null, undefined]) {
      expect(isUuid(bad)).toBe(false);
    }
  });
});

describe('isSafeBasename', () => {
  it('accepts plain file names used by the callers', () => {
    for (const ok of ['transcript_1726000000000', 's_000b14bd-7494-4908-9eab-a2fe0defb666', 'page12.json', 'page_3.json', 'notes.txt']) {
      expect(isSafeBasename(ok)).toBe(true);
    }
  });

  it('rejects separators, traversal, hidden and odd names', () => {
    for (const bad of ['', '..', '../x', 'a/../b', 'a/b', 'a\\b', '.env', '..json', 'x..json', 'a b.txt', 'C:\\x', 'x\0.json', 'x'.repeat(201), undefined, 7]) {
      expect(isSafeBasename(bad)).toBe(false);
    }
  });
});

describe('resolveInside', () => {
  const base = path.resolve('assets', 'realtime-transcripts');

  it('returns the absolute path for names inside the base', () => {
    expect(resolveInside('assets/realtime-transcripts/', 'transcript_1.TXT')).toBe(path.join(base, 'transcript_1.TXT'));
    expect(resolveInside(base, 'exports/a.pdf')).toBe(path.join(base, 'exports', 'a.pdf'));
    expect(resolveInside(base, '..notes.json')).toBe(path.join(base, '..notes.json'));
  });

  it('rejects traversal, absolute paths, the base itself, NUL bytes and non-strings', () => {
    for (const bad of ['../x.json', '../../etabella-firebase.json', 'a/../../x', path.resolve('/etc/passwd'), '.', '', 'x\0.json', undefined, 5]) {
      expect(resolveInside(base, bad)).toBeNull();
    }
    expect(resolveInside(undefined, 'x.json')).toBeNull();
  });
});
