import { canonicalLine } from './canonical';
import {
  UnsupportedFmtError,
  assertFmt,
  isDigest,
  isSupportedFmt,
  pageDigest,
  pageDigests,
  rootDigest,
  serializePage,
  sha256Hex,
} from './digest';
import { EDGE_FMT } from './protocol';

// Vectors computed independently (node -e with crypto.createHash over the spec's
// formulas, 2026-10-01). A change here is a change of the wire format: bump fmt.
const PAGE = [
  ['10:00:00:00', [72, 105], 0, 'FL', 1, 1, 1000000, null, null, null],
  ['00:00:00:00', [], 1],
];
const PAGE_DIGEST = 'a2d81392506c3ecf5eafa90dc8c7628473ab6d53961987da992d181c2bbd753a';
const EMPTY_PAGE_DIGEST = 'cd07eede6955d98a4f7c9c1c094ba92853ab7ce899ddaff2bc4e06551d926382';
const ROOT_EMPTY = 'dc33286d238e82c8d13b9f8d82443f93b06f30d5dc21dc3e6208207bb0d62b67';
const ROOT_ONE = '53e00a9370b77aed0ddaabf3e8984ebc6e7866892a0b6f1f84c65d3e6a432170';
const ROOT_TWO = '6674ee68d3fb29e8bb6ffa697ea17cdc73fb583df2f7e950db8693924f5a2b62';
const UNICODE_PAGE_DIGEST = '68ceb96c14c102097ab989992a5bec6acbf0cec64cd9844a7e6e88147b922f10';

describe('pure serialization digests (spec §5.2)', () => {
  it('pins fmt 1', () => {
    expect(EDGE_FMT).toBe(1);
    expect(serializePage(PAGE)).toBe('[["10:00:00:00",[72,105],0,"FL",1,1,1000000,null,null,null],["00:00:00:00",[],1]]');
  });

  it('page digest = sha256("p" + fmt + "|" + JSON.stringify(lines)) — test vectors', () => {
    expect(pageDigest(PAGE)).toBe(PAGE_DIGEST);
    expect(pageDigest(PAGE, 1)).toBe(PAGE_DIGEST);
    expect(pageDigest([])).toBe(EMPTY_PAGE_DIGEST);
    expect(pageDigest([['t', [233, 8364], 0, 'é€😀']])).toBe(UNICODE_PAGE_DIGEST);
    expect(sha256Hex('p1|[]')).toBe(EMPTY_PAGE_DIGEST);
  });

  it('root = sha256("r1|" + nSesid + "|" + totalLines + "|" + digests joined by "|") — test vectors', () => {
    expect(rootDigest('S-1', 0, [])).toBe(ROOT_EMPTY);
    expect(rootDigest('S-1', 2, [PAGE_DIGEST])).toBe(ROOT_ONE);
    expect(rootDigest('S-1', 27, [PAGE_DIGEST, EMPTY_PAGE_DIGEST])).toBe(ROOT_TWO);
  });

  it('the root binds the session, the line count and the page order', () => {
    const base = rootDigest('S-1', 27, [PAGE_DIGEST, EMPTY_PAGE_DIGEST]);
    expect(rootDigest('S-2', 27, [PAGE_DIGEST, EMPTY_PAGE_DIGEST])).not.toBe(base);
    expect(rootDigest('S-1', 26, [PAGE_DIGEST, EMPTY_PAGE_DIGEST])).not.toBe(base);
    expect(rootDigest('S-1', 27, [EMPTY_PAGE_DIGEST, PAGE_DIGEST])).not.toBe(base);
  });

  it('is deterministic across two independent runs over the same lines', () => {
    const build = () =>
      Array.from({ length: 60 }, (_, i) => canonicalLine(['10:00:' + i, Array.from(`line ${i}`, c => c.charCodeAt(0)), i, 'FL'], i));
    const a = build();
    const b = build();
    expect(a).not.toBe(b);
    expect(pageDigest(a)).toBe(pageDigest(b));
  });

  it('verifies lines as received over the wire (JSON round trip keeps the digest)', () => {
    const lines = [canonicalLine(['t', [65, 0x0c], 0, undefined, -0, NaN, { a: 1 }], 0)];
    const received = JSON.parse(JSON.stringify(lines));
    expect(pageDigest(received)).toBe(pageDigest(lines));
  });

  it('hashes every page of a list', () => {
    expect(pageDigests([PAGE, []])).toEqual([PAGE_DIGEST, EMPTY_PAGE_DIGEST]);
  });

  it('refuses a fmt it has no serializer for', () => {
    expect(isSupportedFmt(1)).toBe(true);
    expect(isSupportedFmt(2)).toBe(false);
    expect(isSupportedFmt('1')).toBe(false);
    expect(() => pageDigest(PAGE, 2)).toThrow(UnsupportedFmtError);
    expect(() => serializePage(PAGE, 0)).toThrow(UnsupportedFmtError);
    expect(() => assertFmt(undefined)).toThrow(/unsupported page format/);
    expect(assertFmt(1)).toBe(1);
  });

  it('recognises a digest', () => {
    expect(isDigest(PAGE_DIGEST)).toBe(true);
    expect(isDigest(PAGE_DIGEST.toUpperCase())).toBe(false);
    expect(isDigest('abc')).toBe(false);
    expect(isDigest(null)).toBe(false);
  });
});
