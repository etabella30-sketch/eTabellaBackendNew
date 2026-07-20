/**
 * Vendor-parity conformance tests — libs/feed-parse vs the Bridge Mobile
 * reference client. Each block pins one fix from
 * docs/bridge-vendor-parity-fix-plan.md (D2/D3/D5/D7/D9/D10/D12) to the vendor
 * behavior decoded from the GWT reference (com.eclipse.bridge.client.*).
 */
import { BridgeParserService } from './bridge-parser.service';
import { BridgeFramingService } from './bridge-framing.service';
import { mapWinByte } from './win-char-map';
import {
  SessionContext,
  FeedSink,
  createSessionContext,
} from './session-context';

/** Records every side effect; hands back monotonically increasing line ids. */
class MockSink implements FeedSink {
  public calls: Array<{ m: string; args: any[] }> = [];
  private nextId = 1000;
  emitLocal(event: string, payload: any) { this.calls.push({ m: 'emitLocal', args: [event, payload] }); }
  emitDelivery(event: string, payload: any) { this.calls.push({ m: 'emitDelivery', args: [event, payload] }); }
  async saveLine(nSesid: string, id: number, line: any) { this.calls.push({ m: 'saveLine', args: [nSesid, id, line] }); return id || this.nextId++; }
  async saveMetaData(nSesid: string, job: any) { this.calls.push({ m: 'saveMetaData', args: [nSesid] }); return 1; }
  async removeLines(nSesid: string, ids: any[]) { this.calls.push({ m: 'removeLines', args: [nSesid, ids] }); return 1; }
  async savePageData(payload: any, page: number, lines: number) { this.calls.push({ m: 'savePageData', args: [page, lines] }); return 1; }
  async runAnnotTransfer(args: any) { this.calls.push({ m: 'runAnnotTransfer', args: [args] }); return 1; }
  log(message: string) { this.calls.push({ m: 'log', args: [message] }); }
}

function ctxFor(sink: FeedSink, protocol: 'B' | 'C' = 'B'): SessionContext {
  return createSessionContext({ nSesid: 'sess-1', protocol, sink, nLines: 25 });
}

/** Full command frame: STX + cmd letter + data bytes (handlers read from idx 2). */
function frame(letter: string, data: number[]): Buffer {
  return Buffer.from([0x02, letter.charCodeAt(0), ...data]);
}

const flush = () => new Promise((r) => setTimeout(r, 60));

describe('D2 — CP1252 high-byte remap (mapWinByte)', () => {
  it('maps the defined CP1252 punctuation/symbols to vendor Unicode', () => {
    expect(mapWinByte(0x92)).toBe(0x2019); // right single quote
    expect(mapWinByte(0x91)).toBe(0x2018); // left single quote
    expect(mapWinByte(0x93)).toBe(0x201c); // left double quote
    expect(mapWinByte(0x97)).toBe(0x2014); // em dash
    expect(mapWinByte(0x96)).toBe(0x2013); // en dash
    expect(mapWinByte(0x80)).toBe(0x20ac); // euro
    expect(mapWinByte(0xa0)).toBe(0x00a0); // nbsp
    expect(mapWinByte(0xe9)).toBe(0x00e9); // é
  });

  it('passes ASCII, control bytes, and the 5 undefined slots through as identity', () => {
    expect(mapWinByte(0x41)).toBe(0x41); // 'A'
    expect(mapWinByte(0x0a)).toBe(0x0a); // LF
    expect(mapWinByte(0x20)).toBe(0x20); // space
    for (const undefinedSlot of [0x81, 0x8d, 0x8f, 0x90, 0x9d]) {
      expect(mapWinByte(undefinedSlot)).toBe(undefinedSlot);
    }
  });

  it('remaps a high byte into crLine at text ingress (handleText)', async () => {
    const parser = new BridgeParserService();
    const ctx = ctxFor(new MockSink());
    await parser.handleText(ctx, 0x41); // 'A'
    await parser.handleText(ctx, 0x92); // CP1252 right single quote
    expect(ctx.job.crLine).toEqual([0x41, 0x2019]);
  });
});

describe('D3 — timecode frame math', () => {
  const parser = new BridgeParserService();

  it('frameToTimestamp is the exact inverse of convertToFrame', () => {
    for (const ts of ['00:00:00:00', '00:00:10:00', '17:05:12:04', '23:59:59:29']) {
      expect(parser.frameToTimestamp(parser.convertToFrame(ts))).toBe(ts);
    }
  });

  it('bumps a backward live timecode to prev+1 frame', async () => {
    const ctx = ctxFor(new MockSink());
    // seed a live line already at 00:00:10:00 (frame 300)
    ctx.job.lineBuffer[0] = ['00:00:10:00', [], 0, 'FL', 1, 1, 500];
    ctx.job.lineCount = 0;
    await parser.handleCommand(ctx, 'T', {}, frame('T', [0, 0, 5, 0])); // backward → 00:00:05:00
    expect(ctx.job.currentTimestamp).toBe('00:00:10:01'); // frame 301
    expect(ctx.job.lineBuffer[0][0]).toBe('00:00:10:01');
  });

  it('leaves a forward timecode untouched', async () => {
    const ctx = ctxFor(new MockSink());
    ctx.job.lineBuffer[0] = ['00:00:05:00', [], 0, 'FL', 1, 1, 500];
    ctx.job.lineCount = 0;
    await parser.handleCommand(ctx, 'T', {}, frame('T', [0, 0, 10, 0])); // forward
    expect(ctx.job.currentTimestamp).toBe('00:00:10:00');
  });
});

describe('D5 — refresh range is half-open [start, end)', () => {
  const parser = new BridgeParserService();

  it('keeps the line sitting exactly on the end timecode', () => {
    const rows = [
      ['00:00:01:00', [], 0, 'FL', 1, 1, 1],
      ['00:00:05:00', [], 1, 'FL', 1, 2, 2],
      ['00:00:10:00', [], 2, 'FL', 1, 3, 3], // exactly on end
    ];
    const { newData, removedData } = parser.removeTimestampsInRange(rows, ['00:00:05:00', '00:00:10:00']);
    const kept = newData.map((r: any) => r[0]);
    expect(kept).toContain('00:00:01:00');
    expect(kept).toContain('00:00:10:00'); // end-boundary line SURVIVES (half-open)
    expect(kept).not.toContain('00:00:05:00'); // start-boundary line replaced
    expect(removedData.map((r: any) => r[6])).toEqual([2]);
  });

  it('excludes timecode-0 lines from any positive range', () => {
    const rows = [
      ['0:0:0:0', [], 0, 'FL', 1, 1, 9],
      ['00:00:05:00', [], 1, 'FL', 1, 2, 2],
    ];
    const { newData } = parser.removeTimestampsInRange(rows, ['00:00:05:00', '00:00:20:00']);
    expect(newData.map((r: any) => r[0])).toContain('0:0:0:0');
  });
});

describe('D9 — F is inert on the line model', () => {
  it('does not clear in-progress crLine on a mid-line format change', async () => {
    const parser = new BridgeParserService();
    const ctx = ctxFor(new MockSink());
    await parser.handleText(ctx, 0x61); // 'a'
    await parser.handleText(ctx, 0x62); // 'b'
    await parser.handleCommand(ctx, 'F', {}, frame('F', [0x01])); // Question format
    expect(ctx.job.crLine).toEqual([0x61, 0x62]); // chars retained
    expect(ctx.job.currentFormat).toBe('QES'); // format still tracked
  });
});

describe('D10 — backspace across a line boundary', () => {
  it('drops the orphan tail line and clamps the cursor (no Math.abs jump)', async () => {
    const parser = new BridgeParserService();
    const sink = new MockSink();
    const ctx = ctxFor(sink);
    ctx.job.lineBuffer = [
      ['00:00:01:00', [0x61], 0, 'FL', 1, 1, 11],
      ['00:00:02:00', [], 1, 'FL', 1, 2, 22], // empty tail
    ];
    ctx.job.lineCount = 1;
    ctx.job.crLine = [];
    await parser.handleCommand(ctx, 'D', {}, frame('D', []));
    expect(ctx.job.lineBuffer.length).toBe(1); // orphan removed
    expect(ctx.job.lineCount).toBe(0); // cursor clamped, not jumped to 1
    expect(sink.calls.some((c) => c.m === 'removeLines' && c.args[1][0] === 22)).toBe(true);
  });

  it('empties safely when the only line is deleted', async () => {
    const parser = new BridgeParserService();
    const ctx = ctxFor(new MockSink());
    ctx.job.lineBuffer = [['00:00:01:00', [], 0, 'FL', 1, 1, 11]];
    ctx.job.lineCount = 0;
    ctx.job.crLine = [];
    await parser.handleCommand(ctx, 'D', {}, frame('D', []));
    expect(ctx.job.lineBuffer.length).toBe(0);
    expect(ctx.job.crLine).toEqual([]);
    expect(ctx.job.lineCount).toBe(0);
  });
});

describe('D12 — G global-replace framing terminates on a zero-length replace', () => {
  it('frames a delete (search "ab" → replace "") without stalling', async () => {
    const framing = new BridgeFramingService();
    const ctx = ctxFor(new MockSink());
    const got: any[] = [];
    // STX G, startlen=2, 'a','b', endlen=0, ETX
    const bytes = Buffer.from([0x02, 0x47, 0x02, 0x61, 0x62, 0x00, 0x03]);
    framing.splitCommands(ctx, bytes, (_c, _hex, cmd) => got.push(cmd));
    await flush();
    expect(got.length).toBe(1);
    expect(got[0].cmdType).toBe('G');
    expect(got[0].searchString).toBe('ab');
    expect(got[0].replaceString).toBe('');
  });

  it('remaps a high byte inside the search string via CP1252', async () => {
    const framing = new BridgeFramingService();
    const ctx = ctxFor(new MockSink());
    const got: any[] = [];
    // search = single byte 0x92 (→ ’), replace = "x"
    const bytes = Buffer.from([0x02, 0x47, 0x01, 0x92, 0x01, 0x78, 0x03]);
    framing.splitCommands(ctx, bytes, (_c, _hex, cmd) => got.push(cmd));
    await flush();
    expect(got.length).toBe(1);
    expect(got[0].searchString).toBe('’'); // ’ not U+0092
    expect(got[0].replaceString).toBe('x');
  });
});

describe('D7 — repeat R before E commits the first window', () => {
  it('flushes the pending refresh when a second R arrives', async () => {
    const parser = new BridgeParserService();
    const ctx = ctxFor(new MockSink());
    // enter refresh with a captured range + one buffered replacement line
    ctx.job.isRefresh = true;
    ctx.job.refreshTimeStamp = ['00:00:01:00', '00:00:02:00'];
    ctx.job.relaceLines = [['00:00:01:00', [0x61], 0, 'FL', 1, 1, null]];
    ctx.job.lineBuffer = [['00:00:01:00', [0x7a], 0, 'FL', 1, 1, 5]];
    let committed = false;
    const orig = (parser as any).onRefreshEnd.bind(parser);
    (parser as any).onRefreshEnd = async (c: any) => { committed = true; return orig(c); };
    await parser.handleCommand(ctx, 'R', {}, frame('R', [0, 0, 3, 0, 0, 0, 4, 0]));
    expect(committed).toBe(true); // pending window was committed on repeat-R
    expect(ctx.job.isRefresh).toBe(true); // new window opened
    expect(ctx.job.relaceLines).toEqual([]); // reset for the new window
  });
});
