/**
 * DET-1…DET-12 (rt-local-edge spec §6.1) in libs/feed-parse. The golden
 * replay gate (tools/ci/golden-replay) pins the whole output on every corpus;
 * these pin each mechanism on its own.
 */
import { BridgeFramingService } from './bridge-framing.service';
import { BridgeParserService } from './bridge-parser.service';
import { CaseviewParserService } from './caseview-parser.service';
import {
  abortRefreshWindow,
  createSessionContext,
  enqueueBoundary,
  FeedSink,
  onConnectionOpen,
  parseClock,
  receiveTime,
  SessionContext,
} from './session-context';
import { isKnownTimezone, resolveTimezoneStrict, wallClockTime } from './timezone';
import {
  allocLineId,
  allocRefreshId,
  ensureLineIdState,
  LINE_ID_STRIDE,
  ratchetIdSeq,
  REFRESH_OFFSET_MAX,
  REFRESH_OFFSET_MIN,
  seededOffset,
} from './line-ids';
import { copyTuple } from './tuple-copy';
import { rebaseContext } from './rebase';

class Sink implements FeedSink {
  calls: Array<{ m: string; args: any[] }> = [];
  constructor(private readonly saveLineReturns: (id: number) => any = (id) => id) { }
  emitLocal(event: string, payload: any) { this.calls.push({ m: 'emitLocal', args: [event, payload] }); }
  emitDelivery(event: string, payload: any) { this.calls.push({ m: 'emitDelivery', args: [event, payload] }); }
  async saveLine(_n: string, id: number) { this.calls.push({ m: 'saveLine', args: [id] }); return this.saveLineReturns(id); }
  async saveMetaData() { return 1; }
  async removeLines(_n: string, ids: any[]) { this.calls.push({ m: 'removeLines', args: [ids] }); return 1; }
  async savePageData(payload: any, page: number, lines: number) { this.calls.push({ m: 'savePageData', args: [payload, page, lines] }); return 1; }
  async runAnnotTransfer() { return 1; }
  log() { }
  of(m: string, event?: string) { return this.calls.filter((c) => c.m === m && (event === undefined || c.args[0] === event)); }
}

const STX = 0x02;
const ETX = 0x03;
const latin1 = (s: string) => [...Buffer.from(s, 'latin1')];
const cmd = (letter: string, data: number[] = []) => [STX, letter.charCodeAt(0), ...data, ETX];
const P = (page: number) => cmd('P', [page & 0xff, (page >> 8) & 0xff]);
const N = (line: number) => cmd('N', [line]);
const T = (h: number, m: number, s: number, f = 0) => cmd('T', [h, m, s, f]);
const R = (from: number[], to: number[]) => cmd('R', [...from, ...to]);
const E = () => cmd('E');
const text = (line: any) => (Array.isArray(line) && Array.isArray(line[1]) ? String.fromCharCode(...line[1]) : null);
const ids = (ctx: SessionContext) => ctx.job.lineBuffer.filter((l: any) => Array.isArray(l) && typeof l[6] === 'number').map((l: any) => l[6]);

function bridge(opts: { nSesid?: string; sink?: Sink; tz?: string } = {}) {
  const sink = opts.sink || new Sink();
  const ctx = createSessionContext({ nSesid: opts.nSesid || 'det-spec', protocol: 'B', sink, nLines: 25, cTimezone: opts.tz ?? 'UTC' });
  const framing = new BridgeFramingService();
  const parser = new BridgeParserService();
  const commands: any[] = [];
  const onCommand = (cx: SessionContext, hex: Buffer, c: any) => {
    commands.push(c);
    parser.sendToParseData(cx, hex, c);
  };
  const feed = (bytes: number[], tRecv?: number) =>
    new Promise<void>((resolve) => {
      framing.splitCommands(ctx, Buffer.from(bytes), onCommand, tRecv);
      void ctx.parseQueue.addTask(async () => {
        void ctx.bridgeQueue.addTask(async () => resolve());
      });
    });
  const line = (n: number, t: number[], s: string, tRecv?: number) => feed([...N(n), ...T(t[0], t[1], t[2], t[3] ?? 0), ...latin1(s)], tRecv);
  return { sink, ctx, framing, parser, commands, feed, line };
}

function caseview(opts: { sink?: Sink; tz?: string } = {}) {
  const sink = opts.sink || new Sink();
  const ctx = createSessionContext({ nSesid: 'det-cv', protocol: 'C', sink, nLines: 25, cTimezone: opts.tz ?? 'UTC' });
  const parser = new CaseviewParserService();
  const feed = (bytes: number[], tRecv?: number) =>
    new Promise<void>((resolve) => {
      void parser.parseData(ctx, Buffer.from(bytes), tRecv);
      void ctx.parseQueue.addTask(async () => resolve());
    });
  return { sink, ctx, parser, feed };
}

const br = (n: number) => [0xf9, ...latin1(n.toString(16).toUpperCase().padStart(4, '0')), 0xfa];
const T0 = Date.UTC(2020, 1, 3, 4, 5, 6); // 04:05:06 UTC, years before any wall clock this spec runs at

describe('DET-1: the clock travels with the chunk', () => {
  it('CaseView [0] is the chunk\'s receive time in the session zone, never the wall clock', async () => {
    const s = caseview({ tz: 'Asia/Kolkata' });
    await s.feed([...latin1('Q.  One?'), ...br(1), ...latin1('A.  Two.')], T0);
    await s.feed([...br(2), ...latin1('Q.  Three?')], T0 + 3_600_000);
    expect(s.ctx.job.lineBuffer.map((l: any) => [l[0], text(l)])).toEqual([
      ['09:35:06', 'Q.  One?'],
      ['09:35:06', 'A.  Two.'],
      ['10:35:06', 'Q.  Three?'],
    ]);
    expect(s.ctx.clockMs).toBe(T0 + 3_600_000);
  });

  it('a line keeps the time of the chunk that started it', async () => {
    const s = caseview();
    await s.feed(latin1('Q.  Long'), T0);
    await s.feed(latin1(' question?'), T0 + 10_000);
    expect(s.ctx.job.lineBuffer[0][0]).toBe('04:05:06');
  });

  it('a chunk that waits in the lane still gets its own receive time', async () => {
    const s = caseview();
    const parser = s.parser;
    void parser.parseData(s.ctx, Buffer.from(latin1('A')), T0);
    void parser.parseData(s.ctx, Buffer.from([...br(1), ...latin1('B')]), T0 + 61_000);
    await new Promise<void>((resolve) => void s.ctx.parseQueue.addTask(async () => resolve()));
    expect(s.ctx.job.lineBuffer.map((l: any) => l[0])).toEqual(['04:05:06', '04:06:07']);
  });

  it('a CaseView chunk with no receive time is stamped with the time of the call', async () => {
    const s = caseview();
    const before = Date.now();
    await s.feed(latin1('x'));
    expect(s.ctx.clockMs).toBeGreaterThanOrEqual(before);
    expect(s.ctx.job.lineBuffer[0][0]).toBe(wallClockTime('UTC', new Date(s.ctx.clockMs!)));
  });

  it('Bridge: every framed command carries the receive time of the chunk that completed it, and the parser runs on it', async () => {
    const s = bridge({ tz: 'Europe/London' });
    const whole = [...P(1), ...N(1), ...T(10, 0, 0)];
    await s.feed(whole.slice(0, 7), T0); // P, and N cut before its ETX
    await s.feed(whole.slice(7), T0 + 5000);
    await s.feed(latin1('Hi'), T0 + 9000);
    expect(s.commands.map((c) => [c.cmdType || 'text', c.tRecv])).toEqual([
      ['P', T0],
      ['N', T0 + 5000],
      ['T', T0 + 5000],
      ['text', T0 + 9000], // the framing hands text over byte by byte
      ['text', T0 + 9000],
    ]);
    expect(s.ctx.clockMs).toBe(T0 + 9000);
    expect(s.ctx.job.customTimestamp).toBe(wallClockTime('Europe/London', new Date(T0 + 9000)));
  });

  it('the framing journal is not stamped (only what reaches the parser is)', async () => {
    const s = bridge();
    await s.feed([...P(1), ...N(1)], T0);
    for (const c of s.ctx.framing.commands) expect(c.tRecv).toBeUndefined();
  });

  it('parseClock falls back to the wall clock only when nothing set a receive time; receiveTime keeps a given time', () => {
    const ctx = createSessionContext({ nSesid: 'x', protocol: 'B', sink: new Sink() });
    const now = Date.now();
    expect(parseClock(ctx).getTime()).toBeGreaterThanOrEqual(now);
    ctx.clockMs = T0;
    expect(parseClock(ctx).getTime()).toBe(T0);
    expect(receiveTime(T0)).toBe(T0);
    expect(receiveTime(NaN)).toBeGreaterThanOrEqual(now);
  });
});

describe('DET-2: a strict zone with no host fallback', () => {
  it('accepts a zone the runtime knows', () => {
    expect(resolveTimezoneStrict('Asia/Kolkata')).toBe('Asia/Kolkata');
    expect(isKnownTimezone('Europe/London')).toBe(true);
  });

  it.each([undefined, null, '', 'Not/AZone'])('refuses %j instead of falling back to the host zone', (tz) => {
    expect(isKnownTimezone(tz as any)).toBe(false);
    expect(() => resolveTimezoneStrict(tz as any)).toThrow(RangeError);
  });
});

describe('DET-3: one line-id allocator owned by the lib', () => {
  it('gives new lines k * 1e6 in order, whatever the sink\'s saveLine returns', async () => {
    const s = bridge({ sink: new Sink(() => 'the sink is not authoritative') });
    await s.feed(P(1));
    await s.line(1, [10, 0, 0], 'Q.  One?');
    await s.line(2, [10, 0, 5], 'A.  Two.');
    await s.line(3, [10, 0, 10], 'Q.  Three?');
    expect(ids(s.ctx)).toEqual([1e6, 2e6, 3e6]);
    expect(s.sink.of('saveLine').map((c) => c.args[0]).filter((v, i, a) => a.indexOf(v) === i)).toEqual([1e6, 2e6, 3e6]);
    expect(s.ctx.job.idSeq).toBe(3);
    expect([...s.ctx.job.issuedIds!]).toEqual([1e6, 2e6, 3e6]);
  });

  it('a sink that returns nothing (replay mode, DET-11) leaves the same buffer as one that echoes the id', async () => {
    const run = async (sink: Sink) => {
      const s = bridge({ sink });
      await s.feed(P(1));
      await s.line(1, [10, 0, 0], 'Q.  One?');
      await s.line(2, [10, 0, 5], 'A.  Two.');
      await s.feed(R([10, 0, 5, 0], [10, 0, 10, 0]));
      await s.line(2, [10, 0, 5], 'A.  Two, again.');
      await s.line(3, [10, 0, 7], 'And more.');
      await s.feed(E());
      return JSON.stringify(s.ctx.job.lineBuffer);
    };
    expect(await run(new Sink(() => undefined))).toBe(await run(new Sink((id) => id)));
  });

  it('refresh: same-frame reuse keeps the removed id; a new frame gets prev + a seeded offset; then idSeq moves past', async () => {
    const s = bridge({ nSesid: 'refresh-ids' });
    await s.feed(P(1));
    await s.line(1, [10, 0, 0], 'Q.  One?');
    await s.line(2, [10, 0, 5], 'A.  Two.');
    await s.line(3, [10, 0, 10], 'Q.  Three?');
    await s.feed(R([10, 0, 5, 0], [10, 0, 10, 0]));
    await s.line(2, [10, 0, 5], 'A.  Two, corrected.');
    await s.line(3, [10, 0, 7], 'A.  An inserted line.');
    await s.feed(E());
    const byText = Object.fromEntries(s.ctx.job.lineBuffer.filter((l: any) => text(l)).map((l: any) => [text(l), l[6]]));
    expect(byText['A.  Two, corrected.']).toBe(2e6); // reuses the removed line's id
    expect(byText['A.  An inserted line.']).toBe(2e6 + seededOffset('refresh-ids', 1, 1));
    expect(byText['Q.  Three?']).toBe(3e6);
    // spec §6.1: after a refresh idSeq = max(idSeq, floor(maxIssued / 1e6) + 1)
    // = floor(3e6 / 1e6) + 1 = 4; the next new line takes ++idSeq
    expect(s.ctx.job.idSeq).toBe(4);
    await s.line(4, [10, 0, 15], 'Q.  Four?');
    expect(s.ctx.job.lineBuffer[s.ctx.job.lineBuffer.length - 1][6]).toBe(5e6);
  });

  it('seededOffset is a pure function in [200, 1000]', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) {
      const v = seededOffset('ses', 7, i);
      expect(v).toBeGreaterThanOrEqual(REFRESH_OFFSET_MIN);
      expect(v).toBeLessThanOrEqual(REFRESH_OFFSET_MAX);
      expect(seededOffset('ses', 7, i)).toBe(v);
      seen.add(v);
    }
    expect(seen.size).toBeGreaterThan(500); // spread over the range
    expect(seededOffset('ses', 7, 1)).not.toBe(seededOffset('ses', 8, 1));
  });

  it('allocRefreshId probes past issued ids and gives a new line\'s id when there is no previous id', () => {
    const ctx = createSessionContext({ nSesid: 'probe', protocol: 'B', sink: new Sink() });
    const want = 5e6 + seededOffset('probe', 0, 0);
    ctx.job.issuedIds = new Set([5e6, want, want + 1]);
    ctx.job.idSeq = 5;
    expect(allocRefreshId(ctx, 5e6, 0)).toBe(want + 2);
    expect(allocRefreshId(ctx, undefined, 1)).toBe(6e6);
    expect(allocRefreshId(ctx, NaN, 2)).toBe(7e6);
  });

  it('property: a 5,000-line refresh window with no same-frame match issues no id twice', async () => {
    const s = bridge({ nSesid: 'property' });
    await s.feed(P(1));
    for (let n = 1; n <= 40; n++) await s.line(n % 25 || 25, [10, 0, n], `L${n}`);
    // 5,000 replacement lines, each with its own timecode, none on the frame
    // of the one removed line (10:00:20), so no id is reused: every id comes
    // from prev + seeded offset, and they climb across the strides of the
    // live lines after the window (21e6, 22e6, ...), which the probe skips.
    const window: number[] = [...R([10, 0, 20, 0], [10, 0, 21, 0])];
    for (let i = 0; i < 5000; i++) {
      window.push(...N(1 + (i % 25)), ...T(12 + Math.floor(i / 3600), Math.floor(i / 60) % 60, i % 60), ...latin1(`r${i}`));
    }
    window.push(...E());
    await s.feed(window);
    const all = ids(s.ctx);
    expect(new Set(all).size).toBe(all.length);
    expect(all.length).toBeGreaterThan(5000);
    // and the next new line's id is above every id
    await s.line(1, [11, 0, 0], 'after');
    const last = s.ctx.job.lineBuffer[s.ctx.job.lineBuffer.length - 1][6];
    expect(last).toBeGreaterThan(Math.max(...all));
    expect(last % LINE_ID_STRIDE).toBe(0);
  }, 60000);

  it('seeds from a rehydrated buffer: no restored id is issued again (legacy small ids and 1e6 ids)', () => {
    const ctx = createSessionContext({ nSesid: 'rehydrate', protocol: 'B', sink: new Sink() });
    ctx.job.lineBuffer = [['10:00:00:00', [65], 0, 'FL', 1, 1, 7], ['10:00:01:00', [66], 1, 'FL', 1, 2, 3e6], ['10:00:02:00', [67], 2, 'FL', 1, 3, 3e6 + 412]];
    expect(allocLineId(ctx)).toBe(4e6); // idSeq moves to floor(3000412 / 1e6) = 3, the smallest whose next id is above them all
    expect([...ctx.job.issuedIds!].sort((a, b) => a - b)).toEqual([7, 3e6, 3e6 + 412, 4e6]);
  });

  it('recovers a job restored through JSON (issuedIds became {}) or from before DET-3 (no idSeq)', () => {
    const ctx = createSessionContext({ nSesid: 'json', protocol: 'B', sink: new Sink() });
    ctx.job = JSON.parse(JSON.stringify({ ...ctx.job, lineBuffer: [['t', [1], 0, 'FL', 1, 1, 2e6]], issuedIds: new Set([2e6]) }));
    delete (ctx.job as any).idSeq;
    ensureLineIdState(ctx.job);
    expect(ctx.job.issuedIds).toBeInstanceOf(Set);
    expect(allocLineId(ctx)).toBe(3e6);
  });

  it('a checkpoint restored with v8 (a Set from another realm) keeps every issued id and its idSeq exactly', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const v8 = require('v8');
    const ctx = createSessionContext({ nSesid: 'v8', protocol: 'B', sink: new Sink() });
    ctx.job.lineBuffer = [['t', [1], 0, 'FL', 1, 1, 7e6]];
    ctx.job.issuedIds = new Set([5e6, 7e6, 9e6 + 300]); // 9000300: a removed refresh line's id, no longer in the buffer
    ctx.job.idSeq = 9;
    ctx.job = v8.deserialize(v8.serialize(ctx.job));
    expect(ctx.job.issuedIds instanceof Set).toBe(false); // the jest sandbox's Set is not v8's: the case that matters
    ensureLineIdState(ctx.job);
    expect(ctx.job.idSeq).toBe(9);
    expect([...ctx.job.issuedIds!].sort((a, b) => a - b)).toEqual([5e6, 7e6, 9e6 + 300]);
    expect(allocLineId(ctx)).toBe(10e6);
  });

  it('ratchetIdSeq never moves idSeq back', () => {
    const ctx = createSessionContext({ nSesid: 'r', protocol: 'B', sink: new Sink() });
    ctx.job.idSeq = 9;
    ctx.job.issuedIds = new Set([2e6 + 5]);
    ratchetIdSeq(ctx.job);
    expect(ctx.job.idSeq).toBe(9);
    ctx.job.issuedIds.add(12e6 + 3);
    ratchetIdSeq(ctx.job);
    expect(ctx.job.idSeq).toBe(13);
  });

  it('an id IdentityFix chose that was already issued is not used: the line keeps the id it was given', async () => {
    const s = bridge({ nSesid: 'idfix' });
    await s.feed(P(1));
    await s.line(1, [10, 0, 0], 'Q.  One?');
    await s.line(2, [10, 0, 5], 'A.  Two.');
    await s.line(3, [10, 0, 10], 'Q.  Three?');
    const fix = (s.parser as any).identityFixService;
    jest.spyOn(fix, 'validateValues').mockReturnValue({ ok: false, errors: ['forced'] });
    jest.spyOn(fix, 'attemptFix').mockImplementation((values: any[]) => ({ ok: true, values: values.map((v: any, i: number) => [i === 1 ? 1e6 : v[0], v[1] === true]) }));
    await s.feed(R([10, 0, 5, 0], [10, 0, 10, 0]));
    await s.line(2, [10, 0, 5], 'A.  Two, corrected.');
    await s.line(3, [10, 0, 7], 'A.  Inserted.');
    await s.feed(E());
    const all = ids(s.ctx);
    expect(new Set(all).size).toBe(all.length);
    const inserted = s.ctx.job.lineBuffer.find((l: any) => text(l) === 'A.  Inserted.');
    expect(inserted[6]).toBe(2e6 + seededOffset('idfix', 1, 1));
  });
});

describe('DET-5: payloads carry copies, never the buffer\'s own tuples', () => {
  it('Bridge: a consumer that rewrites a TCP-DATA tuple in place (the gateway scrub) cannot reach the buffer', async () => {
    const sink = new Sink();
    sink.emitDelivery = (event: string, payload: any) => {
      sink.calls.push({ m: 'emitDelivery', args: [event, payload] });
      for (const t of payload.d || []) { t[1] = [0x58]; t[2] = 999; }
    };
    const s = bridge({ sink });
    await s.feed(P(1));
    await s.line(1, [10, 0, 0], 'Q.  Intact?');
    await s.line(2, [10, 0, 5], 'A.  Yes.');
    expect(s.ctx.job.lineBuffer.slice(1).map(text)).toEqual(['Q.  Intact?', 'A.  Yes.']);
    expect(s.ctx.job.lineBuffer.slice(1).map((l: any) => l[2])).toEqual([1, 2]);
  });

  it('Bridge: emitLocal and emitDelivery each get their own copy; the buffer keeps the [2] it always wrote', async () => {
    const s = bridge();
    await s.feed(P(1));
    await s.line(1, [10, 0, 0], 'Q.  One?');
    const local = s.sink.of('emitLocal', 'message').pop()!.args[1];
    const delivered = s.sink.of('emitDelivery', 'TCP-DATA').pop()!.args[1];
    expect(local.d).toEqual(delivered.d);
    expect(local.d[1]).not.toBe(delivered.d[1]);
    expect(delivered.d[1]).not.toBe(s.ctx.job.lineBuffer[1]);
    expect(s.ctx.job.lineBuffer[0]).toEqual([, , 0]); // eslint-disable-line no-sparse-arrays
  });

  it('Bridge: line-replace and feed-refresh-data payloads are copies too', async () => {
    const s = bridge();
    await s.feed(P(1));
    await s.line(1, [10, 0, 0], 'Q.  teh?');
    await s.line(2, [10, 0, 5], 'A.  No.');
    await s.feed([STX, 0x47, 3, ...latin1('teh'), 3, ...latin1('the'), ETX]);
    const replaced = s.sink.of('emitDelivery', 'line-replace').pop()!.args[1];
    expect(replaced.line).not.toBe(s.ctx.job.lineBuffer[1]);
    expect(replaced.line).toEqual(s.ctx.job.lineBuffer[1]);
    await s.feed(R([10, 0, 5, 0], [10, 0, 6, 0]));
    await s.line(2, [10, 0, 5], 'A.  Yes.');
    await s.feed(E());
    const refresh = s.sink.of('emitDelivery', 'feed-refresh-data').pop()!.args[1];
    const inBuffer = s.ctx.job.lineBuffer.find((l: any) => text(l) === 'A.  Yes.');
    expect(refresh.newLines[0]).toEqual(inBuffer);
    expect(refresh.newLines[0]).not.toBe(inBuffer);
  });

  it('CaseView: payload tuples are copies, crLine is no longer shared with a consumer, and the buffer still keeps [7]', async () => {
    const sink = new Sink();
    sink.emitDelivery = (event: string, payload: any) => {
      sink.calls.push({ m: 'emitDelivery', args: [event, payload] });
      for (const t of payload.d || []) t[1].push(0x21);
    };
    const s = caseview({ sink });
    (s.ctx as any).caseTabs = ['EX'];
    await s.feed([...latin1('Q.  See {EX-1}'), ...br(1), ...latin1('A.  ok')]);
    expect(s.ctx.job.lineBuffer.map(text)).toEqual(['Q.  See {EX-1}', 'A.  ok']);
    expect(s.ctx.job.lineBuffer.map((l: any) => l[7])).toEqual([['{EX-1}'], []]);
    await s.feed(latin1('!'));
    expect(text(s.ctx.job.lineBuffer[1])).toBe('A.  ok!');
    const page = s.sink.of('savePageData').pop()!.args[0];
    expect(page.d[1]).not.toBe(s.ctx.job.lineBuffer[1]);
  });

  it('copyTuple keeps holes as holes and undefined as undefined', () => {
    // eslint-disable-next-line no-sparse-arrays
    const t: any[] = ['t', [65], 0, , undefined, null, [['x']]];
    const c = copyTuple(t);
    expect(c).not.toBe(t);
    expect(c[6]).not.toBe(t[6]);
    expect(3 in c).toBe(false);
    expect(4 in c).toBe(true);
    expect(c).toEqual(t);
  });
});

describe('DET-6: a new CAT connection gets fresh framing, and an open window is aborted (S-D11)', () => {
  it('a command half-sent on the old connection never completes with the new one\'s bytes', async () => {
    const s = bridge();
    await s.feed(P(1));
    await s.line(1, [10, 0, 0], 'Q.  One?');
    await s.feed([STX, 0x54, 10]); // a T cut after one data byte
    expect(onConnectionOpen(s.ctx)).toEqual({ abortedWindow: false });
    await s.feed([...latin1(' more')]);
    expect(text(s.ctx.job.lineBuffer[1])).toBe('Q.  One? more');
    expect(s.commands.filter((c) => c.cmdType === 'T')).toHaveLength(1);
  });

  it('aborts an open R..E window: pending lines dropped, text kept, cursor back on the last line', async () => {
    const s = bridge();
    await s.feed(P(1));
    await s.line(1, [10, 0, 0], 'Q.  One?');
    await s.line(2, [10, 0, 5], 'A.  Two.');
    const before = JSON.stringify(s.ctx.job.lineBuffer);
    await s.feed(R([10, 0, 0, 0], [10, 0, 9, 0]));
    await s.line(1, [10, 0, 0], 'half a replacement');
    const result = await enqueueBoundary(s.ctx, () => onConnectionOpen(s.ctx));
    expect(result).toEqual({ abortedWindow: true });
    expect(s.ctx.job.isRefresh).toBe(false);
    expect(s.ctx.job.relaceLines).toEqual([]);
    expect(JSON.stringify(s.ctx.job.lineBuffer)).toBe(before);
    await s.feed(latin1(' Yes.'));
    expect(text(s.ctx.job.lineBuffer[2])).toBe('A.  Two. Yes.');
    expect(abortRefreshWindow(s.ctx.job)).toBe(false);
  });
});

describe('DET-7: the framing journal keeps only its last entry', () => {
  it('never grows past one entry, and the output is identical to an untrimmed run', async () => {
    const stream = [...P(1)];
    for (let n = 1; n <= 30; n++) stream.push(...N(n % 25 || 25), ...T(10, 1, n), ...latin1(`Line ${n} text`));
    stream.push(STX, 0x47, 4, ...latin1('text'), 4, ...latin1('word'), ETX);
    const trimmed = bridge();
    await trimmed.feed(stream.slice(0, 50), T0);
    await trimmed.feed(stream.slice(50), T0 + 1);
    expect(trimmed.ctx.framing.commands.length).toBe(1);

    const untrimmed = bridge();
    (untrimmed.framing as any).keepLastCommand = () => undefined;
    await untrimmed.feed(stream.slice(0, 50), T0);
    await untrimmed.feed(stream.slice(50), T0 + 1);
    expect(untrimmed.ctx.framing.commands.length).toBeGreaterThan(60);
    expect(trimmed.ctx.framing.commands[0]).toEqual(untrimmed.ctx.framing.commands[untrimmed.ctx.framing.commands.length - 1]);
    expect(JSON.stringify(trimmed.ctx.job.lineBuffer)).toBe(JSON.stringify(untrimmed.ctx.job.lineBuffer));
    expect(JSON.stringify(trimmed.commands)).toBe(JSON.stringify(untrimmed.commands));
  });
});

describe('DET-8: enqueueBoundary runs after everything handed to the parser before it', () => {
  it('Bridge: runs after the commands of a chunk that was not framed yet, with the parse-stage result', async () => {
    const s = bridge();
    s.framing.splitCommands(s.ctx, Buffer.from([...P(1), ...N(1), ...T(10, 0, 0), ...latin1('abc')]), (cx, hex, c) => s.parser.sendToParseData(cx, hex, c));
    const seen = await enqueueBoundary(s.ctx, (pre) => ({ pre, text: text(s.ctx.job.lineBuffer[1]) }), () => s.ctx.framing.commands.length);
    expect(seen).toEqual({ pre: 1, text: 'abc' });
  });

  it('CaseView: runs after the chunk; an error in fn rejects', async () => {
    const s = caseview();
    void s.parser.parseData(s.ctx, Buffer.from(latin1('xyz')), T0);
    expect(await enqueueBoundary(s.ctx, () => text(s.ctx.job.lineBuffer[0]))).toBe('xyz');
    await expect(enqueueBoundary(s.ctx, () => { throw new Error('boom'); })).rejects.toThrow('boom');
  });
});

describe('DET-9: external input comes from the context, set in-lane', () => {
  it('Bridge [7] follows ctx.caseTabs as set at a boundary, with no read of its own', async () => {
    const s = bridge();
    await s.feed(P(1));
    await s.line(1, [10, 0, 0], 'See {EX-1}');
    expect(s.ctx.job.lineBuffer[1][7]).toBeUndefined(); // no case tabs: [7] is never written
    await enqueueBoundary(s.ctx, () => { s.ctx.caseTabs = ['EX']; });
    await s.line(2, [10, 0, 5], 'See {EX-2}');
    expect(s.ctx.job.lineBuffer[2][7]).toEqual(['{EX-2}']);
  });
});

describe('DET-12: rebaseContext starts a parser from pages', () => {
  const page = (rows: any[]) => Object.freeze(rows.map((r) => Object.freeze(r)));

  it('Bridge: copies the (frozen) pages, puts the cursor on the last line, and never re-issues a page or anchor id', async () => {
    const s = bridge();
    const pages = [page([
      ['10:00:00:00', [...latin1('Q.  One?')], 0, 'QES', 3, 1, 4e6],
      ['10:00:05:00', [...latin1('A.  Tw')], 1, 'ANS', 3, 2, 7e6 + 300],
    ])];
    s.ctx.job.isRefresh = true;
    s.ctx.job.relaceLines = [['x']];
    const res = rebaseContext(s.ctx, pages, [9e6]);
    expect(res).toEqual({ lines: 2, idSeq: 10, issuedIds: 3 });
    expect(s.ctx.job.isRefresh).toBe(false);
    expect(s.ctx.job.relaceLines).toEqual([]);
    expect(s.ctx.framing.commands).toEqual([]);
    expect(s.ctx.job.crLine).not.toBe(s.ctx.job.lineBuffer[1][1]);
    expect(Object.isFrozen(s.ctx.job.lineBuffer[1])).toBe(false);
    await s.feed(latin1('o.'));
    expect(s.ctx.job.lineBuffer.map(text)).toEqual(['Q.  One?', 'A.  Two.']);
    expect(s.ctx.job.lineBuffer[1].slice(3, 7)).toEqual(['ANS', 3, 2, 7e6 + 300]);
    await s.line(3, [10, 0, 10], 'Q.  Three?');
    expect(s.ctx.job.lineBuffer[2][6]).toBe(11e6);
  });

  it('CaseView: a backspace after the rebase steps back over the break as after typing the same text', async () => {
    const s = caseview();
    rebaseContext(s.ctx, [page([['04:05:06', [...latin1('Q.  One?')], 0], ['04:05:07', [], 1]])]);
    await s.feed([0x08, ...latin1('!')], T0);
    expect(s.ctx.job.lineBuffer.map(text)).toEqual(['Q.  One!']);
  });
});
