/**
 * Which parser a CAT stream belongs to (live defect found by the golden replay
 * work, batch A / T7 open question 2; DET-4).
 *
 * Today IngestSessionWorker.feed
 * (apps/realtime-server/src/services/eclipse-ingest/eclipse-tcp-ingest.service.ts)
 * and libs/rt-ingest detectProtocol decide from the first fed byte:
 * `chunk[0] === 0x02 ? 'B' : 'C'`. Eclipse connects mid-page, so the first
 * byte after its login is usually text (both real captures start with 0x20),
 * and a real Bridge stream is parsed as CaseView. detectProtocol looks for
 * the framing itself instead:
 *  - Bridge: STX 0x02, a known command letter, the command's data and ETX
 *    0x03 exactly where that command's length puts it (F 1 byte, P 2, N 1,
 *    T 4, D / K / E none, R 8, G <len><search><len><replace>; the framing in
 *    bridge-framing.service.ts CMD_TYPES). A 0x03 or 0x02 inside command data
 *    (a T frame number, an N line number) cannot fake or hide a frame,
 *    because the ETX must sit at the exact offset.
 *  - CaseView: the line marker 0xF9 + 4 ASCII hex digits + 0xFA
 *    (caseview-parser.service.ts decodes it to "y....z").
 * A configured protocol (the route's or the session's) always wins.
 *
 * Pure: no I/O, no clock. Not wired into realtime-server or libs/rt-ingest
 * yet; see the README in tools/ci/golden-replay ("Protocol detection") for
 * the wiring the next wave does.
 */

export type FeedProtocolName = 'bridge' | 'caseview';
export type DetectedProtocol = FeedProtocolName | 'undecided';

/** Bytes looked at: the decision is made on the first DETECT_WINDOW_BYTES of the stream. */
export const DETECT_WINDOW_BYTES = 4096;
/** Frames (Bridge) or markers (CaseView) needed before deciding. */
export const DETECT_MIN_EVIDENCE = 2;
/** When both kinds of evidence appear, one must outnumber the other this many times over. */
export const DETECT_DOMINANCE = 4;

const STX = 0x02;
const ETX = 0x03;

/** Data length of each fixed-length Bridge command, by its wire letter (bridge-framing.service.ts CMD_TYPES). */
const FIXED_LENGTH: Readonly<Record<number, number>> = Object.freeze({
  0x46: 1, // F
  0x50: 2, // P
  0x4e: 1, // N
  0x54: 4, // T
  0x44: 0, // D
  0x48: 0, // K (wire byte 'H')
  0x45: 0, // E
  0x52: 8, // R
});
const G = 0x47;

const isHexDigit = (b: number) => (b >= 0x30 && b <= 0x39) || (b >= 0x41 && b <= 0x46) || (b >= 0x61 && b <= 0x66);

/**
 * The length of a complete Bridge frame starting at `i` (STX at i), or 0 when
 * the bytes there are not one. A frame cut off by the end of the window is
 * not counted (more bytes decide it).
 */
export function bridgeFrameLength(bytes: Uint8Array, i: number): number {
  if (bytes[i] !== STX || i + 1 >= bytes.length) return 0;
  const letter = bytes[i + 1];
  const fixed = FIXED_LENGTH[letter];
  if (fixed !== undefined) {
    const etx = i + 2 + fixed;
    return etx < bytes.length && bytes[etx] === ETX ? fixed + 3 : 0;
  }
  if (letter === G) {
    const searchLen = i + 2 < bytes.length ? bytes[i + 2] : -1;
    if (searchLen < 0) return 0;
    const replaceAt = i + 3 + searchLen;
    if (replaceAt >= bytes.length) return 0;
    const etx = replaceAt + 1 + bytes[replaceAt];
    return etx < bytes.length && bytes[etx] === ETX ? etx - i + 1 : 0;
  }
  return 0;
}

/** True when a CaseView line marker 0xF9 + 4 hex digits + 0xFA starts at `i`. */
export function isCaseviewMarker(bytes: Uint8Array, i: number): boolean {
  return bytes[i] === 0xf9 && i + 5 < bytes.length && isHexDigit(bytes[i + 1]) && isHexDigit(bytes[i + 2]) &&
    isHexDigit(bytes[i + 3]) && isHexDigit(bytes[i + 4]) && bytes[i + 5] === 0xfa;
}

/** Evidence counts in the first `window` bytes (frames and markers do not overlap). */
export function protocolEvidence(firstBytes: Uint8Array, window: number = DETECT_WINDOW_BYTES): { bridgeFrames: number; caseviewMarkers: number; scanned: number } {
  const bytes = firstBytes.subarray(0, Math.max(0, window));
  let bridgeFrames = 0;
  let caseviewMarkers = 0;
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] === STX) {
      const len = bridgeFrameLength(bytes, i);
      if (len) {
        bridgeFrames++;
        i += len - 1;
        continue;
      }
    } else if (bytes[i] === 0xf9 && isCaseviewMarker(bytes, i)) {
      caseviewMarkers++;
      i += 5;
    }
  }
  return { bridgeFrames, caseviewMarkers, scanned: bytes.length };
}

/**
 * The parser for a stream: `configured` when given; otherwise what the first
 * bytes show, or 'undecided' until they show enough. The caller keeps
 * buffering (or reads more of its journal) while undecided, and applies its
 * own fallback once DETECT_WINDOW_BYTES bytes are in and it is still
 * undecided (README "Protocol detection": the route's configured protocol,
 * else CaseView, today's default).
 *
 * Decides 'bridge' when at least DETECT_MIN_EVIDENCE complete Bridge frames
 * appear and they outnumber CaseView markers DETECT_DOMINANCE to 1 (no marker
 * at all in practice), and 'caseview' the same way round.
 */
export function detectProtocol(configured: FeedProtocolName | null | undefined, firstBytes: Uint8Array): DetectedProtocol {
  if (configured === 'bridge' || configured === 'caseview') return configured;
  if (configured !== undefined && configured !== null) {
    throw new TypeError(`detectProtocol: unknown configured protocol ${JSON.stringify(configured)} (expected 'bridge' or 'caseview')`);
  }
  if (!firstBytes || !firstBytes.length) return 'undecided';
  const { bridgeFrames, caseviewMarkers } = protocolEvidence(firstBytes);
  if (bridgeFrames >= DETECT_MIN_EVIDENCE && bridgeFrames >= DETECT_DOMINANCE * caseviewMarkers) return 'bridge';
  if (caseviewMarkers >= DETECT_MIN_EVIDENCE && caseviewMarkers >= DETECT_DOMINANCE * bridgeFrames) return 'caseview';
  return 'undecided';
}

/** The lib's protocol letter ('B' Bridge, 'C' CaseView) for a decided protocol. */
export function protocolLetter(protocol: FeedProtocolName): 'B' | 'C' {
  return protocol === 'bridge' ? 'B' : 'C';
}
