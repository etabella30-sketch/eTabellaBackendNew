/**
 * detectProtocol: which parser a CAT stream belongs to. The live defect it
 * fixes (once wired): IngestSessionWorker.feed decides with
 * `chunk[0] === 0x02 ? 'B' : 'C'`, so a real Eclipse Bridge stream that
 * starts mid-page (both real captures start with 0x20 after the login) is
 * parsed as CaseView. Uses the real captures' bytes and the CaseView corpora.
 */
import * as fs from 'fs';
import * as path from 'path';
import {
  bridgeFrameLength,
  DETECT_WINDOW_BYTES,
  detectProtocol,
  isCaseviewMarker,
  protocolEvidence,
  protocolLetter,
} from './protocol-detect';

const REPO = path.resolve(__dirname, '..', '..', '..');
const CAPTURES = path.join(REPO, 'tools', 'eclipse-capture', 'authtest');
const CORPORA = path.join(REPO, 'tools', 'ci', 'golden-replay', 'corpora');

/** A capture's bytes after the Eclipse login (username CRLF password CRLF), as the ingest feeds them. */
function captureAfterLogin(prefix: string): Buffer {
  const dir = fs.readdirSync(CAPTURES).find((d) => d.startsWith(prefix));
  if (!dir) throw new Error('no capture ' + prefix);
  const payload = fs.readFileSync(path.join(CAPTURES, dir, 'payload.bin'));
  if (!payload.length) return payload;
  const first = payload.indexOf('\r\n');
  const second = payload.indexOf('\r\n', first + 2);
  return payload.subarray(second + 2);
}

/** A corpus's frames.ndjson bytes, concatenated. */
function corpusBytes(id: string): Buffer {
  const lines = fs.readFileSync(path.join(CORPORA, id, 'frames.ndjson'), 'utf8').split('\n').filter((l) => l.trim());
  return Buffer.concat(lines.map((l) => JSON.parse(l)).filter((r) => r.kind === 'tcp-data').map((r) => Buffer.from(r.hex, 'hex')));
}

const STX = 0x02;
const ETX = 0x03;
const latin1 = (s: string) => [...Buffer.from(s, 'latin1')];
const frame = (letter: string, data: number[] = []) => [STX, letter.charCodeAt(0), ...data, ETX];
const marker = (n: number) => [0xf9, ...latin1(n.toString(16).toUpperCase().padStart(4, '0')), 0xfa];

describe('detectProtocol on the real Eclipse Bridge captures', () => {
  const c1 = captureAfterLogin('tcp_001');
  const c2 = captureAfterLogin('tcp_002');

  it('the captures start with text, not STX: the first-byte rule sends them to CaseView (the defect)', () => {
    expect(c1[0]).toBe(0x20);
    expect(c2[0]).toBe(0x20);
    expect(c1[0] === STX ? 'B' : 'C').toBe('C');
  });

  it('routes both to Bridge from their first bytes', () => {
    expect(detectProtocol(undefined, c1)).toBe('bridge');
    expect(detectProtocol(undefined, c2)).toBe('bridge');
    expect(detectProtocol(null, c1.subarray(0, 120))).toBe('bridge');
  });

  it('stays undecided until it has seen two whole frames, then decides', () => {
    // capture 001: text, then P (5 bytes) at 57, N (4 bytes) at 62, T (7 bytes) at 66
    const firstStx = c1.indexOf(STX);
    expect(detectProtocol(undefined, c1.subarray(0, firstStx))).toBe('undecided');
    expect(detectProtocol(undefined, c1.subarray(0, firstStx + 5))).toBe('undecided'); // P only
    expect(detectProtocol(undefined, c1.subarray(0, firstStx + 8))).toBe('undecided'); // N cut before its ETX
    expect(detectProtocol(undefined, c1.subarray(0, firstStx + 9))).toBe('bridge');
  });

  it('decides the same with the login still in front (no frame or marker in it)', () => {
    const dir = fs.readdirSync(CAPTURES).find((d) => d.startsWith('tcp_001'))!;
    const raw = fs.readFileSync(path.join(CAPTURES, dir, 'payload.bin'));
    expect(detectProtocol(undefined, raw)).toBe('bridge');
  });

  it('reads a T frame whose data holds 0x0C (the frame number) and whole real streams as frames', () => {
    const ev = protocolEvidence(c1);
    expect(ev.caseviewMarkers).toBe(0);
    expect(ev.bridgeFrames).toBeGreaterThan(50);
    expect(ev.scanned).toBe(Math.min(c1.length, DETECT_WINDOW_BYTES));
  });

  it('is undecided on the empty captures (003, 004)', () => {
    expect(detectProtocol(undefined, captureAfterLogin('tcp_003'))).toBe('undecided');
    expect(detectProtocol(undefined, captureAfterLogin('tcp_004'))).toBe('undecided');
  });
});

describe('detectProtocol on the CaseView corpora', () => {
  it.each(['caseview-synthetic-lines', 'caseview-synthetic-edits'])('routes %s to CaseView', (id) => {
    const bytes = corpusBytes(id);
    expect(detectProtocol(undefined, bytes)).toBe('caseview');
    expect(protocolEvidence(bytes).bridgeFrames).toBe(0);
  });

  it('routes every synthetic Bridge corpus to Bridge', () => {
    for (const id of fs.readdirSync(CORPORA).filter((d) => d.startsWith('bridge-synthetic-'))) {
      expect([id, detectProtocol(undefined, corpusBytes(id))]).toEqual([id, 'bridge']);
    }
  });

  it('needs two markers: one CaseView line break alone is undecided', () => {
    expect(detectProtocol(undefined, Buffer.from([...latin1('Q.  Name?'), ...marker(1), ...latin1('A.  Smith')]))).toBe('undecided');
    expect(detectProtocol(undefined, Buffer.from([...latin1('Q.'), ...marker(1), ...latin1('A.'), ...marker(2)]))).toBe('caseview');
  });
});

describe('a configured protocol wins', () => {
  it('over any bytes', () => {
    const c1 = captureAfterLogin('tcp_001');
    expect(detectProtocol('caseview', c1)).toBe('caseview');
    expect(detectProtocol('bridge', Buffer.from([...marker(1), ...marker(2)]))).toBe('bridge');
    expect(detectProtocol('bridge', Buffer.alloc(0))).toBe('bridge');
  });

  it('refuses an unknown configured value instead of guessing', () => {
    expect(() => detectProtocol('B' as any, Buffer.alloc(0))).toThrow(TypeError);
  });
});

describe('Bridge frame recognition', () => {
  it('knows each command\'s length (F 1, P 2, N 1, T 4, D/K/E 0, R 8) and the G layout', () => {
    expect(bridgeFrameLength(Buffer.from(frame('F', [1])), 0)).toBe(4);
    expect(bridgeFrameLength(Buffer.from(frame('P', [1, 0])), 0)).toBe(5);
    expect(bridgeFrameLength(Buffer.from(frame('N', [3])), 0)).toBe(4); // N line 3: a 0x03 inside the data
    expect(bridgeFrameLength(Buffer.from(frame('T', [10, 3, 2, 12])), 0)).toBe(7); // 0x03, 0x02, 0x0C inside
    expect(bridgeFrameLength(Buffer.from(frame('D')), 0)).toBe(3);
    expect(bridgeFrameLength(Buffer.from([STX, 0x48, ETX]), 0)).toBe(3); // K is wire byte 'H'
    expect(bridgeFrameLength(Buffer.from(frame('E')), 0)).toBe(3);
    expect(bridgeFrameLength(Buffer.from(frame('R', [10, 0, 0, 0, 10, 0, 5, 0])), 0)).toBe(11);
    const g = [STX, 0x47, 3, ...latin1('teh'), 3, ...latin1('the'), ETX];
    expect(bridgeFrameLength(Buffer.from(g), 0)).toBe(g.length);
    expect(bridgeFrameLength(Buffer.from([STX, 0x47, 2, ...latin1('ab'), 0, ETX]), 0)).toBe(7); // a zero-length replace
  });

  it('rejects an unknown letter, a missing or misplaced ETX, and a frame cut off by the window', () => {
    expect(bridgeFrameLength(Buffer.from([STX, 0x5a, ETX]), 0)).toBe(0); // 'Z'
    expect(bridgeFrameLength(Buffer.from([STX, 0x4e, 1, 0x20]), 0)).toBe(0);
    expect(bridgeFrameLength(Buffer.from([STX, 0x54, 1, 2, ETX]), 0)).toBe(0); // T with 2 of 4 bytes
    expect(bridgeFrameLength(Buffer.from([STX, 0x54, 1, 2]), 0)).toBe(0);
    expect(bridgeFrameLength(Buffer.from([STX, 0x47, 5, ...latin1('ab')]), 0)).toBe(0);
  });

  it('does not count text that only looks like a frame start, and is undecided on plain text', () => {
    const text = Buffer.from(latin1('Q.  The witness said N and T and P.  A.  Yes. '.repeat(100)));
    expect(protocolEvidence(text)).toMatchObject({ bridgeFrames: 0, caseviewMarkers: 0 });
    expect(detectProtocol(undefined, text)).toBe('undecided');
  });

  it('recognises the CaseView marker exactly (0xF9, four hex digits, 0xFA)', () => {
    expect(isCaseviewMarker(Buffer.from(marker(0x1a)), 0)).toBe(true);
    expect(isCaseviewMarker(Buffer.from([0xf9, ...latin1('00G1'), 0xfa]), 0)).toBe(false);
    expect(isCaseviewMarker(Buffer.from([0xf9, ...latin1('0001'), 0x20]), 0)).toBe(false);
  });

  it('stays undecided on mixed evidence, and decides when one side clearly dominates', () => {
    const mixed = Buffer.from([...frame('N', [1]), ...frame('T', [1, 2, 3, 4]), ...marker(1), ...marker(2)]);
    expect(detectProtocol(undefined, mixed)).toBe('undecided');
    const bridgeHeavy = Buffer.from([...Array.from({ length: 8 }, (_, i) => frame('N', [i + 1])).flat(), ...marker(1)]);
    expect(detectProtocol(undefined, bridgeHeavy)).toBe('bridge');
  });

  it('looks only at the first DETECT_WINDOW_BYTES bytes', () => {
    const late = Buffer.concat([Buffer.alloc(DETECT_WINDOW_BYTES, 0x20), Buffer.from([...frame('N', [1]), ...frame('N', [2])])]);
    expect(detectProtocol(undefined, late)).toBe('undecided');
  });

  it('maps a decision to the lib\'s protocol letter', () => {
    expect(protocolLetter('bridge')).toBe('B');
    expect(protocolLetter('caseview')).toBe('C');
  });
});
