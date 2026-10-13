import { HearingTimecode } from '@app/api-contracts';

/** Per-job framing state, including in parser checkpoints. */
export interface CaseviewWireState {
  caseviewCarry?: number[];
  caseviewHearingTime?: HearingTimecode | null;
}
export type CaseviewToken = { kind: 'text'; bytes: number[] }
  | { kind: 'line'; hearing: HearingTimecode | null };

/** Eclipse CaseView F9/FA payload: ASCII hex of a little-endian packed DOS time.
 * Its seconds have two-second precision. Receipt/display clocks are never input.
 * Captured 3843, 3A43, 3D43, 4043 encode 08:25:48, :52, :58, 08:26:00.
 */
export function caseviewHearingTime(bytes: readonly number[]): HearingTimecode | null {
  if (bytes.length !== 4) return null;
  const hex = String.fromCharCode(...bytes);
  if (!/^[0-9a-f]{4}$/i.test(hex)) return null;
  const packed = parseInt(hex.slice(0,2),16) | (parseInt(hex.slice(2),16) << 8);
  const h = packed >>> 11, m = (packed >>> 5) & 63, s = (packed & 31) * 2;
  if (h > 23 || m > 59 || s > 59) return null;
  return { source: 'hearing-timecode', frames: ((h * 60 + m) * 60 + s) * 30 };
}

/** Decode real byte delimiters before ASCII masks F9/FA into ordinary y/z.
 * A timestamp boundary applies to the following source line. Unknown marker
 * formats remain line boundaries without a trusted clock. Carry is bounded.
 */
export function caseviewTokens(state: CaseviewWireState, incoming: Uint8Array): CaseviewToken[] {
  const data = [...(state.caseviewCarry ?? []), ...incoming];
  state.caseviewCarry = [];
  const out: CaseviewToken[] = []; let text: number[] = [];
  const flush = () => { if (text.length) { out.push({kind:'text',bytes:text}); text=[]; } };
  for (let i=0;i<data.length;i++) {
    if (data[i] !== 0xf9) { text.push(data[i]); continue; }
    const end = data.indexOf(0xfa,i+1);
    if (end < 0 && data.length-i <= 17) {
      flush(); state.caseviewCarry=data.slice(i); break;
    }
    if (end < 0 || end-i > 17) { text.push(data[i]); continue; }
    flush(); out.push({kind:'line',hearing:caseviewHearingTime(data.slice(i+1,end))}); i=end;
  }
  flush(); return out;
}
