/**
 * CaseView line-delivery regression — R-TODO1 / D30 (TODOS.md "Fix CaseView
 * line loss in cloud-direct hearings").
 *
 * sendToUsers used to deliver only the last two tuples of the line buffer,
 * once per chunk, so a chunk that touched three or more lines never delivered
 * the earlier ones: viewers and the cloud store kept gaps. These specs drive
 * the real CaseviewParserService through parseData() with CaseView wire bytes
 * and a recording sink that keeps a positional store the way FeedDataService
 * does (one slot per tuple[2], last write wins).
 */
import { CaseviewParserService } from './caseview-parser.service';
import { FeedSink, SessionContext, createSessionContext } from './session-context';

/** JSON round-trip: what a socket boundary hands the receiver. The parser keeps
 *  mutating the tuples it emitted, so a sink that kept references would see
 *  later edits it was never sent. */
const snapshot = (value: any) => JSON.parse(JSON.stringify(value));

const textOf = (tuple: any[]) => String.fromCharCode(...(tuple[1] || []));

class RecordingSink implements FeedSink {
  /** every emitDelivery call, snapshotted */
  public deliveries: Array<{ event: string; payload: any }> = [];
  /** every emitLocal call, snapshotted */
  public locals: Array<{ event: string; payload: any }> = [];
  public pageSaves: Array<{ payload: any; page: number; lines: number }> = [];
  /** positional store: text by tuple[2], as FeedDataService.updateFeedData writes it */
  public store: string[] = [];

  emitLocal(event: string, payload: any) { this.locals.push({ event, payload: snapshot(payload) }); }
  emitDelivery(event: string, payload: any) {
    const copy = snapshot(payload);
    this.deliveries.push({ event, payload: copy });
    for (const tuple of copy.d) this.store[tuple[2]] = textOf(tuple);
  }
  async saveLine() { return 1; }
  async saveMetaData() { return 1; }
  async removeLines() { return 1; }
  async savePageData(payload: any, page: number, lines: number) { this.pageSaves.push({ payload: snapshot(payload), page, lines }); return 1; }
  async runAnnotTransfer() { return 1; }
  log() { }
}

// ---------------------------------------------------------------------------
// CaseView wire bytes
// ---------------------------------------------------------------------------

/** Line break as Eclipse sends it: 0xF9 + 4 hex digits + 0xFA. The parser's
 *  ascii decode masks it to "y....z" and replaces that with "\n". */
let markerSeq = 0;
const br = () => Buffer.concat([
  Buffer.from([0xf9]),
  Buffer.from((++markerSeq).toString(16).toUpperCase().padStart(4, '0'), 'latin1'),
  Buffer.from([0xfa]),
]);
const text = (s: string) => Buffer.from(s, 'latin1');
const bs = (count = 1) => Buffer.alloc(count, 0x08);
/** Vendor page throw: \x0F + 8-char job token and \x0C + 4-digit page number. */
const pageThrow = (page: number) => Buffer.from(`\x0FRT100126\x0C${String(page).padStart(4, '0')}`, 'latin1');
const chunk = (...parts: Buffer[]) => Buffer.concat(parts);

/** Complete lines: each text followed by a line break. */
const linesChunk = (...lines: string[]) => chunk(...lines.flatMap((line) => [text(line), br()]));

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

function setup() {
  const sink = new RecordingSink();
  const ctx: SessionContext = createSessionContext({ nSesid: 'ses-cv', protocol: 'C', sink, nLines: 25 });
  return { parser: new CaseviewParserService(), sink, ctx };
}

/** parseData only enqueues; resolve once this session's parse lane is idle. */
function drain(ctx: SessionContext): Promise<void> {
  return new Promise<void>((resolve) => { void ctx.parseQueue.addTask(async () => resolve()); });
}

/** Feeds one TCP chunk and returns the single TCP-DATA payload it produced. */
async function feed(env: ReturnType<typeof setup>, bytes: Buffer): Promise<any> {
  const before = env.sink.deliveries.length;
  await env.parser.parseData(env.ctx, bytes);
  await drain(env.ctx);
  expect(env.sink.deliveries.length).toBe(before + 1);
  expect(env.sink.deliveries[before].event).toBe('TCP-DATA');
  return env.sink.deliveries[before].payload;
}

const indices = (payload: any) => payload.d.map((tuple: any[]) => tuple[2]);
const range = (from: number, to: number) => Array.from({ length: Math.max(0, to - from) }, (_, n) => from + n);
const texts = (payload: any) => payload.d.map(textOf);
const parserLines = (ctx: SessionContext) => ctx.job.lineBuffer.map((tuple: any[]) => textOf(tuple));

/** Every line the parser holds has reached the store at its own position. */
function expectStoreInSync(env: ReturnType<typeof setup>): void {
  const truth = parserLines(env.ctx);
  expect(env.sink.store.slice(0, truth.length)).toEqual(truth);
}

describe('CaseviewParserService — line delivery (R-TODO1 / D30)', () => {
  beforeEach(() => { markerSeq = 0; });

  describe('(a) a chunk touching three or more lines', () => {
    it('delivers all three lines of one chunk that ends three complete lines', async () => {
      const env = setup();
      const payload = await feed(env, linesChunk(
        'THE COURT:  Good morning.',
        'MR. SMITH:  Good morning, Your Honor.',
        'THE COURT:  Please be seated.',
      ));

      expect(indices(payload)).toEqual([0, 1, 2]);
      expect(texts(payload)).toEqual([
        'THE COURT:  Good morning.',
        'MR. SMITH:  Good morning, Your Honor.',
        'THE COURT:  Please be seated.',
      ]);
      // payload shape and per-line processing unchanged
      expect(Object.keys(payload).sort()).toEqual(['d', 'date', 'i', 'l', 'p']);
      expect(payload).toMatchObject({ i: 3, date: 'ses-cv', l: 25, p: 1 });
      expect(payload.d.every((tuple: any[]) => Array.isArray(tuple[7]) && tuple[7].length === 0)).toBe(true);
      // the local broadcast and the page save carry the same set
      expect(env.sink.locals).toHaveLength(1);
      expect(env.sink.locals[0].event).toBe('message');
      expect(Object.keys(env.sink.locals[0].payload).sort()).toEqual(['d', 'date', 'i']);
      expect(env.sink.locals[0].payload.d).toEqual(payload.d);
      expect(env.sink.pageSaves).toHaveLength(1);
      expect(env.sink.pageSaves[0]).toMatchObject({ page: 1, lines: 25 });
      expect(env.sink.pageSaves[0].payload.d).toEqual(payload.d);
      expectStoreInSync(env);
    });

    it('delivers the line a chunk finishes along with the two lines it starts', async () => {
      const env = setup();
      expect(indices(await feed(env, text('Q.  Where were')))).toEqual([0]);

      const payload = await feed(env, chunk(text(' you that night?'), br(), text('A.  At home.'), br(), text('Q.  Alone?')));

      expect(indices(payload)).toEqual([0, 1, 2]);
      expect(texts(payload)).toEqual(['Q.  Where were you that night?', 'A.  At home.', 'Q.  Alone?']);
      expect(payload.i).toBe(2);
      expectStoreInSync(env);
    });
  });

  describe('(b) one- and two-line chunks', () => {
    it('deliver exactly the legacy last-two window', async () => {
      const env = setup();

      // one line, buffer of one
      let payload = await feed(env, text('THE COURT:  Good morning.'));
      expect(indices(payload)).toEqual([0]);
      expect(payload.i).toBe(0);

      // more text on the same line
      payload = await feed(env, text('  Please be seated.'));
      expect(indices(payload)).toEqual([0]);
      expect(texts(payload)).toEqual(['THE COURT:  Good morning.  Please be seated.']);

      // two lines: the break finishes line 0, then line 1 starts
      payload = await feed(env, chunk(br(), text('MR. SMITH:  Thank you')));
      expect(indices(payload)).toEqual([0, 1]);
      expect(payload.i).toBe(1);

      // only line 1 changes: the window still carries the last two, as before
      payload = await feed(env, text(', Your Honor.'));
      expect(indices(payload)).toEqual([0, 1]);
      expect(texts(payload)).toEqual(['THE COURT:  Good morning.  Please be seated.', 'MR. SMITH:  Thank you, Your Honor.']);

      // two lines mid-transcript
      payload = await feed(env, chunk(br(), text('Q.  Please state your name.')));
      expect(indices(payload)).toEqual([1, 2]);

      // a chunk ending on a break: the next line does not exist yet
      payload = await feed(env, br());
      expect(indices(payload)).toEqual([1, 2]);
      expect(payload.i).toBe(3);

      expect(env.sink.deliveries.map((delivery) => delivery.payload.p)).toEqual([1, 1, 1, 1, 1, 1]);
      expectStoreInSync(env);
    });

    it('deliver the legacy window for a chunk the page-frame strip empties', async () => {
      const env = setup();
      await feed(env, linesChunk('Line one.', 'Line two.', 'Line three.', 'Line four.'));

      const payload = await feed(env, pageThrow(2));

      expect(indices(payload)).toEqual([2, 3]);
      expect(payload.i).toBe(4);
    });

    it('never re-send a rehydrated buffer the chunk did not touch', async () => {
      const env = setup();
      // Seed the job the way IngestSessionWorker.rehydrate does after a
      // restart: restored tuples, lineCount on the last restored line.
      env.ctx.job.lineBuffer = Array.from({ length: 40 }, (_, n) => ['10:00:00', Array.from(text(`Restored ${n}.`)), n]);
      env.ctx.job.lineCount = 39;

      // Only which lines go out is pinned here; the text of line 39 is the
      // rehydrate path's business (it does not restore crLine).
      expect(indices(await feed(env, text(' more')))).toEqual([38, 39]);
      expect(indices(await feed(env, chunk(br(), text('Next.'), br(), text('Then.'), br())))).toEqual([39, 40, 41]);
    });
  });

  describe('(c) a later chunk editing the previous line', () => {
    it('re-delivers the line a backspace across the break edited', async () => {
      const env = setup();
      expect(indices(await feed(env, linesChunk('Q.  Where were you that night.')))).toEqual([0]);

      // The backspace steps back over the break; the parser drops the line's
      // last character with it (legacy byte-loop semantics, unchanged).
      const payload = await feed(env, chunk(bs(), text('?')));

      expect(indices(payload)).toEqual([0]);
      expect(texts(payload)).toEqual(['Q.  Where were you that night?']);
      expect(env.ctx.job.lineBuffer).toHaveLength(1);
      expectStoreInSync(env);
    });

    it('still re-delivers the edited line when the same chunk goes on to write two more lines', async () => {
      const env = setup();
      await feed(env, linesChunk('Q.  Where were you that night.'));

      const payload = await feed(env, chunk(bs(), text('?'), br(), text('A.  At home.'), br(), text('Q.  Alone?'), br()));

      expect(indices(payload)).toEqual([0, 1, 2]);
      expect(texts(payload)).toEqual(['Q.  Where were you that night?', 'A.  At home.', 'Q.  Alone?']);
      expect(payload.i).toBe(3);
      expectStoreInSync(env);
    });
  });

  describe('(d) a long chunk crossing a page boundary', () => {
    it('delivers every line exactly once at its own position', async () => {
      const env = setup();
      const first = Array.from({ length: 12 }, (_, n) => `Line ${n + 1} of the opening.`);
      expect(indices(await feed(env, linesChunk(...first)))).toEqual(Array.from({ length: 12 }, (_, n) => n));

      // 30 lines: indices 12..41, crossing the 25-line page edge (24 -> 25),
      // with the vendor's page throw sitting between line 24 and line 25.
      const long = Array.from({ length: 30 }, (_, n) => `Line ${n + 13} of the long answer.`);
      const parts: Buffer[] = [];
      long.forEach((line, n) => {
        parts.push(text(line), br());
        if (n + 12 === 24) parts.push(pageThrow(2));
      });
      const payload = await feed(env, chunk(...parts));

      const expected = Array.from({ length: 30 }, (_, n) => n + 12);
      expect(indices(payload)).toEqual(expected);
      expect(new Set(indices(payload)).size).toBe(30);
      expect(texts(payload)).toEqual(long);
      expect(payload.d.some((tuple: any[]) => tuple[1].includes(0x0c) || tuple[1].includes(0x0f))).toBe(false);
      // page is still taken from the last delivered line
      expect(payload).toMatchObject({ i: 42, l: 25, p: 2 });
      expect(env.sink.pageSaves[env.sink.pageSaves.length - 1]).toMatchObject({ page: 2, lines: 25 });

      expect(env.sink.store).toEqual([...first, ...long]);
      expectStoreInSync(env);
    });
  });

  describe('(e) after removeExtraLines trims the buffer', () => {
    it('keeps the next delivery correct', async () => {
      const env = setup();
      let payload = await feed(env, chunk(text('Q.  Where were you?'), br(), text('A.  At home.'), br(), text('Q.  Al')));
      expect(indices(payload)).toEqual([0, 1, 2]);

      // Six backspaces empty line 2; the seventh crosses the break, so the
      // parser trims line 2 off the buffer and edits line 1.
      payload = await feed(env, bs(7));
      expect(env.ctx.job.lineBuffer).toHaveLength(2);
      expect(env.ctx.job.lineCount).toBe(1);
      expect(indices(payload)).toEqual([0, 1]);
      expect(texts(payload)).toEqual(['Q.  Where were you?', 'A.  At home']);

      // The next chunk finishes line 1 again and writes two new lines over
      // the trimmed slot.
      payload = await feed(env, chunk(text('.'), br(), text('Q.  Alone?'), br(), text('A.  Yes.'), br()));
      expect(indices(payload)).toEqual([1, 2, 3]);
      expect(texts(payload)).toEqual(['A.  At home.', 'Q.  Alone?', 'A.  Yes.']);
      expect(payload.i).toBe(4);

      expect(env.sink.store).toEqual(['Q.  Where were you?', 'A.  At home.', 'Q.  Alone?', 'A.  Yes.']);
      expectStoreInSync(env);
    });
  });

  describe('any chunking of one stream', () => {
    // In-line corrections only (a backspace never follows a break here), so
    // the expected transcript is plain text.
    const script: Array<Buffer | 'br'> = [];
    const expected: string[] = [];
    const say = (line: string, typo?: { at: number; wrong: string }) => {
      if (typo) {
        script.push(text(line.slice(0, typo.at) + typo.wrong), bs(typo.wrong.length), text(line.slice(typo.at)));
      } else {
        script.push(text(line));
      }
      script.push('br');
      expected.push(line);
    };
    for (let n = 0; n < 40; n++) {
      if (n % 7 === 3) say(`A.  Yes.`);
      else if (n % 5 === 1) say(`Q.  And question number ${n}, please?`, { at: 4, wrong: 'Ad' });
      else say(`THE WITNESS:  Answer ${n}.`);
    }

    /** Atoms: one per byte, except a whole line break (never split mid-marker). */
    function atoms(): Buffer[] {
      markerSeq = 0;
      return script.flatMap((part) => (part === 'br' ? [br()] : Array.from(part, (byte) => Buffer.from([byte]))));
    }

    it.each([1, 2, 3, 5, 8, 13, 40, 100, 400, 100000])('lands every line in the store when chunks hold %i atoms', async (size) => {
      const env = setup();
      const all = atoms();
      for (let at = 0; at < all.length; at += size) {
        const delivered = indices(await feed(env, chunk(...all.slice(at, at + size))));
        const length = env.ctx.job.lineBuffer.length;
        const legacy = range(length - 2, length).filter((index) => index >= 0);
        // contiguous to the end of the buffer, never smaller than the legacy
        // last-two window, and exactly that window when a chunk is too small
        // to touch more than two lines
        expect(delivered).toEqual(range(delivered[0], length));
        expect(delivered.slice(-legacy.length)).toEqual(legacy);
        if (size <= 2) expect(delivered).toEqual(legacy);
      }

      expect(parserLines(env.ctx)).toEqual(expected);
      expect(env.sink.store).toEqual(expected);
    });
  });
});
