/**
 * Regression specs for two live Bridge parser defects (user approval
 * 2026-10-01, "fix 2 and 3"). Both drive the REAL framing service and parser
 * with Bridge wire bytes, the way the Eclipse ingest feeds them.
 *
 * (a) G (global replace) did nothing in a session whose first command is N.
 *     Line 0 stays a placeholder; emitToLocalUser writes [2] = 0 into it, so it
 *     becomes [ , , 0]; replaceGlobal then read `line[1].length` on it, threw,
 *     and its catch swallowed the whole replace, silently.
 * (b) D (backspace) at the start of a refresh replacement line (inside an open
 *     R..E window) ran the D10 pop on the LIVE buffer: it removed the last live
 *     line (and its stored id), and the replacement line picked up the text of
 *     the live line before it. Completed after review: a D right after R
 *     (before any N, T, P or text) popped the text of the line the cursor was
 *     on before the window and turned it into a replacement line, and after E
 *     then R or a repeat R (D7) crLine was that live line's own [1] array, so
 *     the D (or a keystroke) edited the live line in place. Each spec below
 *     marked "found by the wave-2c review" failed on the first version of the
 *     fix; the P and N-without-T specs pin branches no test covered before.
 */
import { BridgeFramingService } from './bridge-framing.service';
import { BridgeParserService } from './bridge-parser.service';
import { createSessionContext, FeedSink, SessionContext } from './session-context';

class RecordingSink implements FeedSink {
  calls: Array<{ m: string; args: any[] }> = [];
  private nextId = 1;
  emitLocal(event: string, payload: any) { this.calls.push({ m: 'emitLocal', args: [event, JSON.parse(JSON.stringify(payload))] }); }
  emitDelivery(event: string, payload: any) { this.calls.push({ m: 'emitDelivery', args: [event, JSON.parse(JSON.stringify(payload))] }); }
  async saveLine(_n: string, id: number) { this.calls.push({ m: 'saveLine', args: [id] }); return id || this.nextId++; }
  async saveMetaData() { return 1; }
  async removeLines(_n: string, ids: any[]) { this.calls.push({ m: 'removeLines', args: [ids] }); return 1; }
  async savePageData() { return 1; }
  async runAnnotTransfer() { return 1; }
  log(message: string, level?: string) { this.calls.push({ m: 'log', args: [message, level] }); }
  deliveries(event: string) { return this.calls.filter((c) => c.m === 'emitDelivery' && c.args[0] === event).map((c) => c.args[1]); }
}

const STX = 0x02;
const ETX = 0x03;
const latin1 = (s: string) => [...Buffer.from(s, 'latin1')];
const cmd = (letter: string, data: number[] = []) => [STX, letter.charCodeAt(0), ...data, ETX];
const P = (page: number) => cmd('P', [page & 0xff, (page >> 8) & 0xff]);
const N = (line: number) => cmd('N', [line]);
const T = (h: number, m: number, s: number, f = 0) => cmd('T', [h, m, s, f]);
const D = () => cmd('D');
const R = (from: number[], to: number[]) => cmd('R', [...from, ...to]);
const E = () => cmd('E');
const G = (search: string, replace: string) => {
  const s = latin1(search);
  const r = latin1(replace);
  return [STX, 0x47, s.length, ...s, r.length, ...r, ETX];
};

const text = (line: any) => (Array.isArray(line) && Array.isArray(line[1]) ? String.fromCharCode(...line[1]) : null);

function session(nSesid = 'live-defects') {
  const sink = new RecordingSink();
  const ctx = createSessionContext({ nSesid, protocol: 'B', sink, nLines: 25, cTimezone: 'UTC' });
  const framing = new BridgeFramingService();
  const parser = new BridgeParserService();
  const onCommand = (cx: SessionContext, hex: Buffer, c: any) => parser.sendToParseData(cx, hex, c);
  /** Feeds one chunk and resolves once the parser has processed all of it. */
  const feed = (bytes: number[]) =>
    new Promise<void>((resolve) => {
      framing.splitCommands(ctx, Buffer.from(bytes), onCommand);
      ctx.parseQueue.addTask(async () => {
        ctx.bridgeQueue.addTask(async () => resolve());
      });
    });
  /** One live line the way Eclipse sends it: N + T + text. */
  const line = (n: number, t: number[], s: string) => feed([...N(n), ...T(t[0], t[1], t[2], t[3] ?? 0), ...latin1(s)]);
  return { sink, ctx, parser, feed, line };
}

describe('(a) G in a session whose first command is N', () => {
  it('replaces on every finished line, skipping the line-0 placeholder', async () => {
    const s = session();
    await s.feed(P(1));
    await s.line(1, [12, 0, 0], 'Q.  Did you see teh car?');
    await s.line(2, [12, 0, 5], 'A.  Yes, teh blue one.');
    await s.line(3, [12, 0, 10], 'Q.  And');
    // the placeholder the defect trips on
    expect(Array.isArray(s.ctx.job.lineBuffer[0])).toBe(true);
    expect(s.ctx.job.lineBuffer[0][1]).toBeUndefined();
    expect(s.ctx.job.lineBuffer[0][2]).toBe(0);

    await s.feed(G('teh', 'the'));

    expect(text(s.ctx.job.lineBuffer[1])).toBe('Q.  Did you see the car?');
    expect(text(s.ctx.job.lineBuffer[2])).toBe('A.  Yes, the blue one.');
    // the placeholder is left exactly as it was
    expect(s.ctx.job.lineBuffer[0].length).toBe(3);
    expect(s.ctx.job.lineBuffer[0][1]).toBeUndefined();
    // one line-replace per changed line, carrying the replaced text
    const replaced = s.sink.deliveries('line-replace');
    expect(replaced.map((p: any) => text(p.line))).toEqual(['Q.  Did you see the car?', 'A.  Yes, the blue one.']);
    expect(replaced.map((p: any) => [p.page, p.lineno])).toEqual([[1, 1], [1, 2]]);
  });

  it('replaces every match on a line (regex g), not only the first', async () => {
    const s = session();
    await s.feed(P(1));
    await s.line(1, [12, 0, 0], 'Q.  teh car, teh bus and teh train?');
    await s.line(2, [12, 0, 5], 'A.  Yes.');
    await s.feed(G('teh', 'the'));
    expect(text(s.ctx.job.lineBuffer[1])).toBe('Q.  the car, the bus and the train?');
  });

  it('keeps the replacement on finished lines when later lines arrive', async () => {
    const s = session();
    await s.feed(P(1));
    await s.line(1, [12, 0, 0], 'Q.  Did you see teh car?');
    await s.line(2, [12, 0, 5], 'A.  No.');
    await s.feed(G('teh', 'the'));
    await s.line(3, [12, 0, 10], 'Q.  And teh driver?');
    await s.line(4, [12, 0, 15], 'A.  No.');
    await s.feed(G('teh', 'the'));
    expect(s.ctx.job.lineBuffer.slice(1).map(text)).toEqual(['Q.  Did you see the car?', 'A.  No.', 'Q.  And the driver?', 'A.  No.']);
  });

  it('does not swallow an unexpected error silently: it is logged', async () => {
    const s = session();
    await s.feed(P(1));
    await s.line(1, [12, 0, 0], 'Q.  teh');
    await s.line(2, [12, 0, 5], 'A.  No.');
    (s.parser as any).sendGlobalReplace = async () => {
      throw new Error('boom from a sink');
    };
    await s.feed(G('teh', 'the'));
    const logged = s.sink.calls.filter((c) => c.m === 'log' && /boom from a sink/.test(String(c.args[0])));
    expect(logged.length).toBe(1);
    expect(logged[0].args[1]).toBe('error');
  });
});

describe('(b) D at the start of a refresh replacement line', () => {
  /** Five live lines with distinct timecodes, then the cursor on line 5. */
  async function liveTranscript() {
    const s = session('refresh-d');
    await s.feed(P(1));
    await s.line(1, [10, 0, 0], 'Q.  One.');
    await s.line(2, [10, 0, 5], 'A.  Two.');
    await s.line(3, [10, 0, 10], 'Q.  Three.');
    await s.line(4, [10, 0, 15], 'A.  Four.');
    await s.line(5, [10, 0, 20], 'Q.  Five.');
    return s;
  }
  const liveTexts = (s: ReturnType<typeof session>) => s.ctx.job.lineBuffer.map(text);
  const removed = (s: ReturnType<typeof session>) => s.sink.calls.filter((c) => c.m === 'removeLines');

  it('deletes back into the previous replacement line, never the live buffer', async () => {
    const s = await liveTranscript();
    const before = JSON.parse(JSON.stringify(s.ctx.job.lineBuffer));
    await s.feed(R([10, 0, 5, 0], [10, 0, 15, 0]));
    await s.line(2, [10, 0, 5], 'A.  Two, corrected');
    await s.feed([...N(3), ...T(10, 0, 10)]);
    await s.feed(D()); // at the start of replacement line 3

    // the live buffer is untouched while the window is open
    expect(JSON.parse(JSON.stringify(s.ctx.job.lineBuffer))).toEqual(before);
    expect(removed(s)).toEqual([]);
    // the empty replacement line is gone and the cursor is back on line 2
    expect(s.ctx.job.relaceLines.map((l: any) => [l[5], text(l)])).toEqual([[2, 'A.  Two, corrected']]);

    await s.feed(latin1('.'));
    await s.feed(E());
    expect(liveTexts(s).slice(1)).toEqual(['Q.  One.', 'A.  Two, corrected.', 'A.  Four.', 'Q.  Five.']);
    // only the replaced range's ids were removed from the store (at E)
    expect(removed(s).length).toBe(1);
  });

  it('is a no-op at the start of the first replacement line', async () => {
    const s = await liveTranscript();
    const before = JSON.parse(JSON.stringify(s.ctx.job.lineBuffer));
    await s.feed(R([10, 0, 5, 0], [10, 0, 10, 0]));
    await s.feed([...N(2), ...T(10, 0, 5)]);
    const pending = JSON.parse(JSON.stringify(s.ctx.job.relaceLines));
    await s.feed(D());

    expect(JSON.parse(JSON.stringify(s.ctx.job.lineBuffer))).toEqual(before);
    expect(JSON.parse(JSON.stringify(s.ctx.job.relaceLines))).toEqual(pending);
    expect(removed(s)).toEqual([]);

    await s.feed(latin1('A.  Two, again.'));
    await s.feed(E());
    expect(liveTexts(s).slice(1)).toEqual(['Q.  One.', 'A.  Two, again.', 'Q.  Three.', 'A.  Four.', 'Q.  Five.']);
  });

  it('a D right after N in the window (no T, no replacement line yet) leaves both buffers alone', async () => {
    const s = await liveTranscript();
    const before = JSON.parse(JSON.stringify(s.ctx.job.lineBuffer));
    await s.feed(R([10, 0, 15, 0], [10, 0, 20, 0]));
    await s.feed([...N(4)]);
    await s.feed(D());
    expect(JSON.parse(JSON.stringify(s.ctx.job.lineBuffer))).toEqual(before);
    expect(s.ctx.job.relaceLines).toEqual([]);
    expect(removed(s)).toEqual([]);
  });

  // The cases below were found by the wave-2c review: the first version of the
  // fix covered an EMPTY crLine only. Right after R, crLine still holds the text
  // of the line the cursor was on before the window (a live line being typed,
  // the last line after an E, or the line a repeat R just committed), and
  // after E or a repeat R it is that line's own [1] array.
  const snap = (s: ReturnType<typeof session>) => JSON.parse(JSON.stringify(s.ctx.job.lineBuffer));
  const pending = (s: ReturnType<typeof session>) => s.ctx.job.relaceLines.map((l: any) => [l[5], text(l)]);

  it('a D right after R, before any N, T, P or text, is a no-op on both buffers (the cursor was mid-line)', async () => {
    const s = await liveTranscript(); // the cursor is still typing live line 5
    const before = snap(s);
    await s.feed(R([10, 0, 5, 0], [10, 0, 15, 0]));
    await s.feed(D());
    expect(snap(s)).toEqual(before);
    expect(s.ctx.job.relaceLines).toEqual([]);
    expect(removed(s)).toEqual([]);

    await s.line(2, [10, 0, 5], 'A.  Two, again.');
    await s.feed(E());
    // no copy of live line 5 is added as a replacement line
    expect(liveTexts(s).slice(1)).toEqual(['Q.  One.', 'A.  Two, again.', 'A.  Four.', 'Q.  Five.']);
  });

  it('a D right after E then R does not edit the live line E left the cursor on', async () => {
    const s = await liveTranscript();
    await s.feed(R([10, 0, 5, 0], [10, 0, 10, 0]));
    await s.line(2, [10, 0, 5], 'A.  Two, corrected.');
    await s.feed(E()); // the cursor goes back to the last line, 'Q.  Five.'
    const before = snap(s);
    await s.feed(R([10, 0, 10, 0], [10, 0, 15, 0]));
    await s.feed(D());
    expect(snap(s)).toEqual(before);
    expect(s.ctx.job.relaceLines).toEqual([]);

    await s.line(3, [10, 0, 10], 'Q.  Three, again.');
    await s.feed(E());
    expect(liveTexts(s).slice(1)).toEqual(['Q.  One.', 'A.  Two, corrected.', 'Q.  Three, again.', 'A.  Four.', 'Q.  Five.']);
    expect(removed(s).length).toBe(2); // one per window, at its E
  });

  it('a D right after a repeat R (D7) does not edit the replacement line the first window committed', async () => {
    const s = await liveTranscript();
    await s.feed(R([10, 0, 5, 0], [10, 0, 10, 0]));
    await s.line(2, [10, 0, 5], 'A.  Two, corrected.');
    await s.feed(R([10, 0, 10, 0], [10, 0, 15, 0])); // commits the first window (D7)
    const before = snap(s);
    expect(before.map(text)).toContain('A.  Two, corrected.');
    await s.feed(D());
    expect(snap(s)).toEqual(before);
    expect(s.ctx.job.relaceLines).toEqual([]);

    await s.line(3, [10, 0, 10], 'Q.  Three, again.');
    await s.feed(E());
    expect(liveTexts(s).slice(1)).toEqual(['Q.  One.', 'A.  Two, corrected.', 'Q.  Three, again.', 'A.  Four.', 'Q.  Five.']);
  });

  it('text and D right after E then R edit the window only, never the live line E left the cursor on', async () => {
    const s = await liveTranscript();
    await s.feed(R([10, 0, 5, 0], [10, 0, 10, 0]));
    await s.line(2, [10, 0, 5], 'A.  Two, corrected.');
    await s.feed(E());
    const before = snap(s);
    await s.feed(R([10, 0, 10, 0], [10, 0, 15, 0]));
    await s.feed(latin1('!'));
    await s.feed([...D(), ...D()]); // in-line: the '!' and one more character
    expect(snap(s)).toEqual(before);
    expect(removed(s).length).toBe(1); // only the first window's, at its E
  });

  it('a D after a P inside the window goes back to the end of the replacement line P left (nothing is deleted)', async () => {
    const s = await liveTranscript();
    const before = snap(s);
    await s.feed(R([10, 0, 5, 0], [10, 0, 10, 0]));
    await s.line(2, [10, 0, 5], 'A.  Two, once mor');
    await s.feed(P(2)); // crLine is reset; replacement line 2 keeps its text
    await s.feed(D());
    expect(snap(s)).toEqual(before);
    expect(pending(s)).toEqual([[2, 'A.  Two, once mor']]);
    // the cursor is back on replacement line 2, page 1
    expect([s.ctx.job.currentLineNumber, s.ctx.job.currentPage]).toEqual([2, 1]);

    await s.feed(latin1('e.'));
    expect(pending(s)).toEqual([[2, 'A.  Two, once more.']]);
    await s.feed(E());
    expect(liveTexts(s).slice(1)).toEqual(['Q.  One.', 'A.  Two, once more.', 'Q.  Three.', 'A.  Four.', 'Q.  Five.']);
  });

  it('a D after N with no T goes back to the end of the previous replacement line', async () => {
    const s = await liveTranscript();
    const before = snap(s);
    await s.feed(R([10, 0, 5, 0], [10, 0, 15, 0]));
    await s.line(2, [10, 0, 5], 'A.  Two, corrected');
    await s.feed(N(3)); // no T: there is no replacement line 3 yet
    await s.feed(D());
    expect(snap(s)).toEqual(before);
    expect(pending(s)).toEqual([[2, 'A.  Two, corrected']]);
    expect(s.ctx.job.currentLineNumber).toBe(2);

    await s.feed(latin1('.'));
    expect(pending(s)).toEqual([[2, 'A.  Two, corrected.']]);
    await s.feed(E());
    expect(liveTexts(s).slice(1)).toEqual(['Q.  One.', 'A.  Two, corrected.', 'A.  Four.', 'Q.  Five.']);
  });

  it('still deletes one character inside a replacement line (unchanged)', async () => {
    const s = await liveTranscript();
    await s.feed(R([10, 0, 5, 0], [10, 0, 10, 0]));
    await s.line(2, [10, 0, 5], 'A.  Twoo');
    await s.feed(D());
    expect(s.ctx.job.relaceLines.map(text)).toEqual(['A.  Two']);
    await s.feed(latin1('.'));
    await s.feed(E());
    expect(liveTexts(s).slice(1)).toEqual(['Q.  One.', 'A.  Two.', 'Q.  Three.', 'A.  Four.', 'Q.  Five.']);
  });

  it('a D at the start of a live line outside any window still pops it (D10, unchanged)', async () => {
    const s = await liveTranscript();
    await s.feed([...N(6), ...T(10, 0, 25)]);
    expect(s.ctx.job.lineBuffer.length).toBe(7);
    await s.feed(D());
    expect(s.ctx.job.lineBuffer.length).toBe(6);
    expect(text(s.ctx.job.lineBuffer[5])).toBe('Q.  Five.');
  });
});
