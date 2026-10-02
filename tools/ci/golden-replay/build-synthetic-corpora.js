#!/usr/bin/env node
/**
 * Authors the SYNTHETIC golden replay corpora (corpora/*-synthetic-*):
 * writes each one's corpus.json and frames.ndjson. The bytes are made up from
 * the wire formats the parsers handle; they are not recordings.
 *
 *   node tools/ci/golden-replay/build-synthetic-corpora.js           write the files
 *   node tools/ci/golden-replay/build-synthetic-corpora.js --check   exit 1 if the committed files differ
 *
 * Why synthetic: the real Eclipse captures (tools/eclipse-capture/authtest)
 * hold only live Bridge dictation (P / N / T / D). Refresh (R..E), global
 * replace (G), backspace across a line break and the rarer framing paths
 * appear in no recording, and there is no CaseView recording at all.
 *
 * Changing a corpus here changes its input digest, so the gate fails until
 * its golden is re-recorded: run this script, then
 *   node tools/ci/golden-replay-gate.js --update --force --corpus <id>
 * and review the golden diff.
 *
 * Wire formats used (see the parsers for the handling):
 *  - Bridge: 0x02 <letter> <data> 0x03 commands between raw text bytes
 *    (bridge-framing.service.ts CMD_TYPES: F 1, P 2 LE, N 1, T 4 h/m/s/frames,
 *    D 0, K 0, G <len><search><len><replace>, R 8 = start + end timecode, E 0).
 *    Eclipse sends N, then T, then the line's words (as in the real captures).
 *  - CaseView: raw text; a line break is 0xF9 + 4 hex digits + 0xFA (decoded
 *    as ASCII to "y....z", then replaced by "\n") or a raw 0x0A; 0x08 is a
 *    backspace; a page throw is \x0F + 8-char job token and \x0C + 4-digit
 *    page number (caseview-parser.service.ts).
 */
'use strict';

const fs = require('fs');
const path = require('path');

const CORPORA_ROOT = path.join(__dirname, 'corpora');
/** Synthetic receive times start here (only DET-1 will read them). */
const BASE_MS = Date.UTC(2026, 0, 5, 10, 0, 0);

const latin1 = (s) => [...Buffer.from(s, 'latin1')];

/** Accumulates TCP chunks with receive times. */
class Stream {
  constructor() {
    this.t = BASE_MS;
    this.chunks = [];
  }

  /** One TCP chunk, `gapMs` after the previous one. */
  chunk(bytes, note, gapMs = 40) {
    if (!bytes.length) throw new Error('empty chunk: ' + note);
    this.t += gapMs;
    this.chunks.push({ bytes: Buffer.from(bytes), note, t: this.t });
    return this;
  }

  /** The same bytes cut into several chunks at the given offsets. */
  split(bytes, cuts, note, gapMs = 15) {
    let at = 0;
    [...cuts, bytes.length].forEach((cut, n) => {
      this.chunk(bytes.slice(at, cut), `${note} (part ${n + 1}/${cuts.length + 1})`, gapMs);
      at = cut;
    });
    return this;
  }

  /** Dictation the way Eclipse sends it: each word and each space its own chunk. */
  words(str, note, gapMs = 35) {
    for (const part of str.split(/( )/).filter(Boolean)) this.chunk(latin1(part), note, gapMs);
    return this;
  }

  toNdjson() {
    return this.chunks
      .map((c, n) => JSON.stringify({
        i: n + 1,
        ts: new Date(c.t).toISOString(),
        dtMs: c.t - BASE_MS,
        kind: 'tcp-data',
        bytes: c.bytes.length,
        hex: c.bytes.toString('hex'),
        note: c.note,
      }))
      .join('\n') + '\n';
  }
}

// ---------------------------------------------------------------------------
// Bridge
// ---------------------------------------------------------------------------

const STX = 0x02;
const ETX = 0x03;
const cmd = (letter, data = []) => [STX, letter.charCodeAt(0), ...data, ETX];
const tc = (h, m, s, f = 0) => [h, m, s, f];
const P = (page) => cmd('P', [page & 0xff, (page >> 8) & 0xff]);
const N = (line) => cmd('N', [line]);
const T = (timecode) => cmd('T', timecode);
const F = (code) => cmd('F', [code]);
const D = () => cmd('D');
/** CMD_TYPES maps wire byte 0x48 (ASCII 'H') to the K command. */
const K = () => [STX, 0x48, ETX];
const R = (from, to) => cmd('R', [...from, ...to]);
const E = () => cmd('E');
const G = (search, replace) => {
  const s = typeof search === 'string' ? latin1(search) : search;
  const r = typeof replace === 'string' ? latin1(replace) : replace;
  return [STX, 0x47, s.length, ...s, r.length, ...r, ETX];
};
const fmtTc = ([h, m, s, f]) => [h, m, s, f].map((v) => String(v).padStart(2, '0')).join(':');

/** A live line: N + T + the first word in one chunk, then the rest word by word. */
function liveLine(s, n, timecode, text) {
  const [first, ...rest] = text.split(/( )/).filter(Boolean);
  s.chunk([...N(n), ...T(timecode), ...latin1(first)], `live line ${n} at ${fmtTc(timecode)}`, 400);
  if (rest.length) s.words(rest.join(''), `live line ${n} words`);
}

/** A refresh replacement line, sent whole (N + T + text) in one chunk. */
function refreshLine(s, n, timecode, text) {
  s.chunk([...N(n), ...T(timecode), ...latin1(text)], `refresh line ${n} at ${fmtTc(timecode)}`, 60);
}

function bridgeRefresh() {
  const s = new Stream();
  s.chunk(P(1), 'P: page 1');
  const page1 = [
    [1, tc(10, 0, 0), 'THE COURT:  Good morning.'],
    [2, tc(10, 0, 5), 'MR SMITH:  Good morning, my Lord.'],
    [3, tc(10, 0, 10), 'Q.  Please state your full name.'],
    [4, tc(10, 0, 15), 'A.  John Henry Smith.'],
    [5, tc(10, 0, 20), 'Q.  And your address?'],
    [6, tc(10, 0, 25), 'A.  12 Mill Lane.'],
    [7, tc(10, 0, 30), 'Q.  How long have you lived there?'],
    [8, tc(10, 0, 35), 'A.  Ten years.'],
    [9, tc(10, 0, 40), 'Q.  Thank you.'],
  ];
  for (const [n, t, text] of page1) liveLine(s, n, t, text);

  // 1. Replace [10:00:10, 10:00:20): the first line reuses its removed id, the
  //    second has a new timecode (a seeded id since DET-3; Math.random before),
  //    the third reuses a removed id (before DET-3 it was smaller than the
  //    random one, the IdentityFix path).
  s.chunk(R(tc(10, 0, 10), tc(10, 0, 20)), 'R: refresh 1 [10:00:10, 10:00:20)', 1500);
  refreshLine(s, 3, tc(10, 0, 10), 'Q.  Please state your full name for the record.');
  refreshLine(s, 4, tc(10, 0, 12), 'A.  John Henry Smith,');
  refreshLine(s, 5, tc(10, 0, 15), 'spelt S-M-I-T-H.');
  s.chunk(E(), 'E: commit refresh 1', 60);
  liveLine(s, 10, tc(10, 0, 45), 'MR SMITH:  May the witness sit, my Lord?');

  // 2. A second R before E commits the first window (D7); an in-line D inside a refresh line.
  s.chunk(R(tc(10, 0, 25), tc(10, 0, 30)), 'R: refresh 2a [10:00:25, 10:00:30)', 1500);
  refreshLine(s, 6, tc(10, 0, 25), 'A.  12 Mill Lane, Leedz');
  s.chunk(D(), 'D inside a refresh line', 60);
  s.chunk(latin1('s.'), 'refresh line 6 continues', 60);
  s.chunk(R(tc(10, 0, 30), tc(10, 0, 35)), 'R: refresh 2b before E (commits 2a first, D7)', 60);
  refreshLine(s, 7, tc(10, 0, 30), 'Q.  How long have you lived at that address?');
  s.chunk(E(), 'E: commit refresh 2b', 60);

  // 3. A window with no existing line: pure insert, id from the line before.
  s.chunk(R(tc(10, 0, 41), tc(10, 0, 42)), 'R: refresh 3 [10:00:41, 10:00:42), nothing to remove', 1500);
  refreshLine(s, 10, tc(10, 0, 41), '(Pause.)');
  s.chunk(E(), 'E: commit refresh 3', 60);

  // 4. A replacement line exactly on the end timecode: the kept boundary line
  //    and the new line share a timecode; the sort breaks the tie on [6].
  //    Since DET-3 the replacement line's id is below the kept line's, so it
  //    sorts first, where the vendor's applyRefresh splices it (before the
  //    first line with timecode >= end); 1.0.0 put it after (random ids).
  s.chunk(R(tc(10, 0, 35), tc(10, 0, 40)), 'R: refresh 4 [10:00:35, 10:00:40), new line on the end timecode', 1500);
  refreshLine(s, 8, tc(10, 0, 35), 'A.  Ten years, nearly eleven.');
  refreshLine(s, 9, tc(10, 0, 40), 'Q.  Thank you, Mr Smith.');
  s.chunk(E(), 'E: commit refresh 4', 60);

  // 5. An empty window (R then E): nothing is removed.
  s.chunk([...R(tc(10, 0, 0), tc(10, 0, 5)), ...E()], 'R + E: empty refresh 5', 1500);

  // 6. A replacement before every line. The only earlier "line" is the line-0
  //    placeholder, which has no id, so the replacement line gets a new line's
  //    id (DET-3; before, undefined + random = NaN, and the sink's
  //    `id || nextId++` handed out the next sequential id).
  s.chunk(R(tc(9, 59, 0), tc(10, 0, 0)), 'R: refresh 6 [09:59:00, 10:00:00), before the first line', 1500);
  refreshLine(s, 1, tc(9, 59, 30), '(The court sits.)');
  s.chunk(E(), 'E: commit refresh 6', 60);

  // Fill page 1 and start page 2.
  for (let n = 11; n <= 25; n++) liveLine(s, n, tc(10, 1, (n - 11) * 4), `Q.  Question ${n} on page one?`);
  s.chunk(P(2), 'P: page 2', 400);
  for (let n = 1; n <= 6; n++) liveLine(s, n, tc(10, 2, n * 5), `A.  Answer ${n} on page two.`);

  // 7. A window across the page break, three lines in for four out.
  s.chunk(R(tc(10, 1, 52), tc(10, 2, 15)), 'R: refresh 7 [10:01:52, 10:02:15) across pages 1-2', 1500);
  refreshLine(s, 24, tc(10, 1, 52), 'Q.  Question 24, corrected?');
  refreshLine(s, 25, tc(10, 1, 56), 'Q.  Question 25, corrected?');
  refreshLine(s, 1, tc(10, 2, 5), 'A.  Answers one and two, corrected.');
  s.chunk(E(), 'E: commit refresh 7', 60);

  // 8. A refresh whose commands and lines are split across TCP chunks.
  const r8 = [
    ...R(tc(10, 2, 25), tc(10, 2, 30)),
    ...N(5), ...T(tc(10, 2, 25)), ...latin1('A.  Answer five, split.'),
    ...E(),
  ];
  s.split(r8, [3, 9, 12, 16, 20, 30, r8.length - 2], 'refresh 8 split across chunks');

  // After the last E the cursor sits on the last line; text with no N extends it.
  s.words(' (continued)', 'text after E with no N');
  liveLine(s, 7, tc(10, 2, 35), 'Q.  Last question?');

  return {
    meta: {
      id: 'bridge-synthetic-refresh',
      title: 'SYNTHETIC Bridge stream: eight refresh (R..E) windows over two pages',
      protocol: 'B',
      covers: [
        'R..E replacing lines: removed-id reuse, seeded replacement ids (DET-3; Math.random and an IdentityFix run before 1.1.0)',
        'a second R before E commits the first window (D7)',
        'a pure-insert window, an empty window, a window before the first line (no previous id: a new line\'s id, DET-3)',
        'a replacement line on the end timecode: the half-open range keeps the old line, and the [6] tie-break puts the replacement line before it, where the vendor applyRefresh splices it (DET-3; 1.0.0 put it after)',
        'a window across a page break that shrinks the buffer',
        'R, E and replacement lines split across TCP chunks; text after E with no N',
      ],
    },
    stream: s,
  };
}

function bridgeGlobalReplace() {
  const s = new Stream();
  // Like both real captures, the stream starts mid-line, so line 0 holds text.
  // (A stream that starts with N leaves line 0 an empty placeholder, on which
  // replaceGlobal throws: see bridge-synthetic-global-replace-page-start.)
  s.words('(continuing) ', 'text before any P/N/T (mid-page connect)');
  s.chunk(P(1), 'P: page 1');
  liveLine(s, 1, tc(11, 0, 0), 'Q.  Did you see teh car?');
  liveLine(s, 2, tc(11, 0, 5), 'A.  Yes, teh blue one, um, near teh driver\x92s gate.');
  // Line 3 holds text an unescaped search would match differently (D12):
  // /Mr./ also takes "Mrs", /[inaudible]/ is a character class that hits
  // letters on every line, /(sic) / is a group that looks for "sic ".
  liveLine(s, 3, tc(11, 0, 10), 'Q.  Mr. Jones [inaudible], what did Mrs Smith (sic) do?');
  s.chunk([...N(4), ...T(tc(11, 0, 15)), ...latin1('A.  He said it'), 0x92, ...latin1('s fine, um, honestly.')], 'live line 4 with a CP1252 right quote (0x92)', 400);

  // Line 4 is still being typed when these G arrive. The next N (finalizeLine)
  // writes its typed text back, so line 4 ends with none of the replacements;
  // every replacement the final state can show lands on lines 0-3.
  s.chunk(G('teh', 'the'), 'G teh -> the (three lines)', 900);
  s.chunk(G('Mr.', 'Mr'), 'G "Mr." -> "Mr" (".", escaped, D12: unescaped it would also turn "Mrs" into "Mr")', 900);
  s.chunk(G('[inaudible]', '[indistinct]'), 'G "[inaudible]" -> "[indistinct]" ("[ ]", escaped, D12: unescaped it is a character class)', 900);
  s.chunk(G('(sic) ', ''), 'G "(sic) " -> "" ("( )", escaped, D12: unescaped it is a group that misses the text)', 900);
  s.chunk(G(', um', ''), 'G ", um" -> "" (zero-length replace, D12)', 900);
  s.chunk(G([0x92], [0x27]), 'G CP1252 0x92 -> apostrophe on line 2 (search remapped like text, D2)', 900);
  s.chunk(G('zebra', 'horse'), 'G with no match', 900);
  s.chunk(G('', 'x'), 'G with an empty search (ignored)', 900);

  liveLine(s, 5, tc(11, 0, 20), 'Q.  And teh time?');
  // Split inside the search text; it targets line 2, which is finished (line
  // 5 is still being typed, so a replacement there would be written back).
  s.split(G('blue', 'red'), [1, 3, 6], 'G blue -> red split across chunks');

  // G while a line is still being typed: the parser's crLine keeps the old
  // text, so the next keystroke writes it back over the replacement. Line 5,
  // finished by now, keeps it.
  liveLine(s, 6, tc(11, 0, 25), 'A.  About teh');
  s.chunk(G('teh', 'the'), 'G while line 6 is still being typed', 300);
  s.words(' same time.', 'line 6 continues after G');

  for (let n = 7; n <= 25; n++) liveLine(s, n, tc(11, 1, n), n % 3 ? `Q.  Line ${n}, Lord Chief Justice?` : `A.  Yes, my Lord.`);
  s.chunk(P(2), 'P: page 2', 400);
  liveLine(s, 1, tc(11, 2, 0), 'A.  My Lord, teh last one.');
  s.chunk(G('Lord', 'Lordship'), 'G Lord -> Lordship on both pages (longer replacement)', 900);

  return {
    meta: {
      id: 'bridge-synthetic-global-replace',
      title: 'SYNTHETIC Bridge stream: global replace (G) over two pages',
      protocol: 'B',
      covers: [
        'G across several lines and both pages, longer and zero-length replacements',
        'G search text with regex metacharacters (".", "[ ]", "( )") on a line where an unescaped search would match differently (D12)',
        'G search text with a CP1252 byte, remapped like text (D2)',
        'G with no match, with an empty search; a G split across TCP chunks inside its search text',
        'G while the current line is still being typed: the next keystroke or N writes the typed text back (lines 4 and 6)',
      ],
    },
    stream: s,
  };
}

function bridgeGlobalReplacePageStart() {
  const s = new Stream();
  s.chunk(P(1), 'P: page 1 (the stream starts with a command)');
  liveLine(s, 1, tc(12, 0, 0), 'Q.  Did you see teh car?');
  liveLine(s, 2, tc(12, 0, 5), 'A.  Yes, teh blue one.');
  s.chunk(G('teh', 'the'), 'G teh -> the: lines 1 and 2 (line 0 is the [ , , 0] placeholder, which G skips)', 900);
  liveLine(s, 3, tc(12, 0, 10), 'Q.  And teh driver?');
  s.chunk(G('teh', 'the'), 'G again: line 3', 900);

  return {
    meta: {
      id: 'bridge-synthetic-global-replace-page-start',
      title: 'SYNTHETIC Bridge stream: G in a session whose first command is N (the line-0 placeholder)',
      protocol: 'B',
      covers: [
        'a session that starts at a page start: line 0 stays an empty placeholder that emitToLocalUser gives [2] = 0',
        'G in that session replaces on every line with text and skips the placeholder (fixed 2026-10-01; before, replaceGlobal read line[1].length of the placeholder, threw, and the catch swallowed the whole replace, so G changed nothing)',
      ],
    },
    stream: s,
  };
}

function bridgeGlobalReplaceAllMatches() {
  const s = new Stream();
  // Starts mid-line, like the real captures, so line 0 is a real line and the
  // page-start defect (bridge-synthetic-global-replace-page-start) is not in play.
  s.words('(continuing) ', 'text before any P/N/T (mid-page connect)');
  s.chunk(P(1), 'P: page 1');
  liveLine(s, 1, tc(13, 0, 0), 'Q.  teh car, teh bus and teh train?');
  liveLine(s, 2, tc(13, 0, 5), 'A.  Yes, um, all of them, um, every day.');
  liveLine(s, 3, tc(13, 0, 10), 'Q.  aaaa or aa?');
  // Line 4 is still being typed when the G arrive, so every G targets lines
  // 1-3, which are finished; each is hit by exactly ONE G for its search.
  liveLine(s, 4, tc(13, 0, 15), 'A.  Fine.');
  s.chunk(G('teh', 'the'), 'G teh -> the: three matches on line 1, one G', 900);
  s.chunk(G(', um', ''), 'G ", um" -> "": two matches on line 2, one G (zero-length replace)', 900);
  s.chunk(G('aa', 'b'), 'G aa -> b: "aaaa" holds two non-overlapping matches, "aa" one', 900);
  liveLine(s, 5, tc(13, 0, 20), 'Q.  Done.');

  return {
    meta: {
      id: 'bridge-synthetic-global-replace-all-matches',
      title: 'SYNTHETIC Bridge stream: one G replaces every match on a finished line (regex g)',
      protocol: 'B',
      covers: [
        'one G per search on finished lines that hold that search two or three times: every match is replaced, not only the first',
        'non-overlapping matches ("aa" in "aaaa"), a zero-length replacement with two matches',
      ],
    },
    stream: s,
  };
}

function bridgeRefreshBackspace() {
  const s = new Stream();
  s.chunk(P(1), 'P: page 1');
  const page1 = [
    [1, tc(15, 0, 0), 'Q.  One.'],
    [2, tc(15, 0, 5), 'A.  Two.'],
    [3, tc(15, 0, 10), 'Q.  Three.'],
    [4, tc(15, 0, 15), 'A.  Four.'],
    [5, tc(15, 0, 20), 'Q.  Five.'],
    [6, tc(15, 0, 25), 'A.  Six.'],
    [7, tc(15, 0, 30), 'Q.  Seven.'],
    [8, tc(15, 0, 35), 'A.  Eight.'],
  ];
  for (const [n, t, text] of page1) liveLine(s, n, t, text);

  // 1. D at the start of the second replacement line: it deletes back into the
  //    replacement content (the empty line goes, the cursor returns to the end
  //    of replacement line 2). It must never touch the live buffer.
  s.chunk(R(tc(15, 0, 5), tc(15, 0, 15)), 'R: refresh 1 [15:00:05, 15:00:15)', 1500);
  refreshLine(s, 2, tc(15, 0, 5), 'A.  Two, corrected');
  s.chunk([...N(3), ...T(tc(15, 0, 10))], 'replacement line 3 starts (N + T, no text)', 60);
  s.chunk(D(), 'D at the start of replacement line 3', 60);
  s.chunk(latin1('.'), 'typing continues replacement line 2', 60);
  s.chunk(E(), 'E: commit refresh 1', 60);

  // 2. D at the start of the FIRST replacement line: nothing in the
  //    replacement content to delete, so a no-op.
  s.chunk(R(tc(15, 0, 20), tc(15, 0, 25)), 'R: refresh 2 [15:00:20, 15:00:25)', 1500);
  s.chunk([...N(5), ...T(tc(15, 0, 20))], 'the first replacement line starts', 60);
  s.chunk(D(), 'D at the start of the first replacement line', 60);
  s.chunk(latin1('Q.  Five, again.'), 'replacement line 5 text', 60);
  s.chunk(E(), 'E: commit refresh 2', 60);

  // 3. D right after N (no T, no replacement line yet): a no-op.
  s.chunk(R(tc(15, 0, 25), tc(15, 0, 30)), 'R: refresh 3 [15:00:25, 15:00:30)', 1500);
  s.chunk(N(6), 'N only', 60);
  s.chunk(D(), 'D right after N in the window', 60);
  s.chunk([...T(tc(15, 0, 25)), ...latin1('A.  Six, again.')], 'T + text', 60);
  s.chunk(E(), 'E: commit refresh 3', 60);

  // 4. An in-line D inside a replacement line (unchanged), then two D at the
  //    start of the next one: the first goes back to the end of the previous
  //    replacement line, the second deletes its last character.
  s.chunk(R(tc(15, 0, 30), tc(15, 0, 35)), 'R: refresh 4 [15:00:30, 15:00:35)', 1500);
  refreshLine(s, 7, tc(15, 0, 30), 'Q.  Sevenn');
  s.chunk(D(), 'in-line D inside a replacement line', 60);
  s.chunk(latin1('.'), 'replacement line 7 continues', 60);
  s.chunk([...N(8), ...T(tc(15, 0, 31))], 'replacement line 8 starts', 60);
  s.chunk([...D(), ...D()], 'two D: back into line 7, then delete its "."', 60);
  s.chunk(latin1('?'), 'typing continues replacement line 7', 60);
  s.chunk(E(), 'E: commit refresh 4', 60);

  // Live typing after the windows extends the transcript normally.
  liveLine(s, 9, tc(15, 0, 40), 'A.  After the windows.');

  // 5. R while live line 10 is still being typed, then D before any N, T, P or
  //    text: crLine holds live text, not replacement content, so a no-op. (It
  //    used to pop that live text and add it as a replacement line, so live
  //    line 10 appeared twice.)
  liveLine(s, 10, tc(15, 0, 45), 'Q.  Ten.');
  s.chunk(R(tc(15, 0, 40), tc(15, 0, 45)), 'R: refresh 5 [15:00:40, 15:00:45) while live line 10 is being typed', 1500);
  s.chunk(D(), 'D right after R, before any N/T/P/text', 60);
  refreshLine(s, 9, tc(15, 0, 40), 'A.  Nine, again.');
  s.chunk(E(), 'E: commit refresh 5', 60);

  // 6. D right after E then R: E leaves crLine on the last line's own text
  //    (live line 10). A no-op. (It used to delete the "." of live line 10 in
  //    place and add a copy of the line.)
  s.chunk(R(tc(15, 0, 40), tc(15, 0, 45)), 'R: refresh 6 [15:00:40, 15:00:45), straight after the E', 1500);
  s.chunk(D(), 'D right after E then R', 60);
  refreshLine(s, 9, tc(15, 0, 40), 'A.  Nine, once more.');
  s.chunk(E(), 'E: commit refresh 6', 60);

  // 7. D right after a repeat R (D7): the second R commits the first window
  //    and crLine is the committed line's own text. A no-op. (It used to delete
  //    the "." of committed line 9 in place and add a copy of it.)
  s.chunk(R(tc(15, 0, 40), tc(15, 0, 45)), 'R: refresh 7 [15:00:40, 15:00:45)', 1500);
  refreshLine(s, 9, tc(15, 0, 40), 'A.  Nine, a third time.');
  s.chunk(R(tc(15, 0, 45), tc(15, 0, 50)), 'R: refresh 8 [15:00:45, 15:00:50); commits refresh 7 first (D7)', 60);
  s.chunk(D(), 'D right after the repeat R', 60);
  refreshLine(s, 10, tc(15, 0, 45), 'Q.  Ten, again.');
  s.chunk(E(), 'E: commit refresh 8', 60);

  // 8. D after a P inside the window: P resets crLine, but replacement line 10
  //    keeps its text. The D goes back to the end of that text (no character
  //    is deleted, the cursor's page is the line's own) and typing continues it.
  s.chunk(R(tc(15, 0, 45), tc(15, 0, 50)), 'R: refresh 9 [15:00:45, 15:00:50)', 1500);
  refreshLine(s, 10, tc(15, 0, 45), 'Q.  Ten, once mor');
  s.chunk(P(2), 'P: page 2 inside the window', 60);
  s.chunk(D(), 'D after P: back to the end of replacement line 10', 60);
  s.chunk(latin1('e.'), 'typing continues replacement line 10', 60);
  s.chunk(E(), 'E: commit refresh 9', 60);

  // 9. D after N with no T while an earlier replacement line exists: there is
  //    no replacement line 11 yet, so the D goes back to the end of replacement
  //    line 10 and typing continues it.
  liveLine(s, 11, tc(15, 0, 55), 'A.  Eleven.');
  s.chunk(R(tc(15, 0, 45), tc(15, 1, 0)), 'R: refresh 10 [15:00:45, 15:01:00)', 1500);
  refreshLine(s, 10, tc(15, 0, 45), 'Q.  Ten, last time');
  s.chunk(N(11), 'N with no T: no replacement line 11 yet', 60);
  s.chunk(D(), 'D after N: back to the end of replacement line 10', 60);
  s.chunk(latin1('.'), 'typing continues replacement line 10', 60);
  s.chunk(E(), 'E: commit refresh 10', 60);

  liveLine(s, 12, tc(15, 1, 5), 'Q.  The end.');

  return {
    meta: {
      id: 'bridge-synthetic-refresh-backspace',
      title: 'SYNTHETIC Bridge stream: D (backspace) inside open R..E refresh windows',
      protocol: 'B',
      covers: [
        'D at the start of a refresh replacement line deletes within the replacement content (the empty line goes, the cursor returns to the previous replacement line) and never the live buffer',
        'D at the start of the first replacement line, and D right after N with no replacement line yet: no-ops',
        'an in-line D inside a replacement line; two D across the start of a replacement line',
        'D right after R while a live line is being typed, right after E then R, and right after a repeat R (D7): no-ops that never touch the live buffer',
        'D after a P inside the window: back to the end of the replacement line P left; D after N with no T: back to the end of the previous replacement line',
        'live typing between and after the windows',
      ],
    },
    stream: s,
  };
}

function bridgeEdits() {
  const s = new Stream();
  s.chunk(D(), 'D on an empty buffer', 100);
  s.words('before the first command ', 'text before any P/N/T (mid-page connect)');
  s.chunk(P(3), 'P: page 3', 400);
  liveLine(s, 10, tc(14, 0, 0), 'Q.  Where were you on the night of the 4th?');
  s.chunk(F(2), 'F: answer format before the line', 200);
  liveLine(s, 11, tc(14, 0, 5), 'A.  At home.');
  s.chunk(F(1), 'F: question format', 200);
  s.chunk([...N(12), ...T(tc(14, 0, 10)), ...latin1('Q.  Al')], 'live line 12', 400);
  s.chunk(F(3), 'F mid-line keeps the typed characters (D9)', 40);
  s.words('one?', 'line 12 continues');

  // In-line backspaces.
  s.chunk([...N(13), ...T(tc(14, 0, 15)), ...latin1('A.  Yess')], 'live line 13 with a typo', 400);
  s.chunk(D(), 'D in-line', 40);
  s.words(', with my wiif', 'line 13 continues');
  s.chunk([...D(), ...D(), ...D()], 'three D in one chunk', 40);
  s.chunk(latin1('ife.'), 'line 13 fixed', 40);

  // Backspace across a line boundary (D10): the new line is still empty.
  s.chunk([...N(14), ...T(tc(14, 0, 20))], 'live line 14 starts', 400);
  s.chunk(D(), 'D on the empty new line: drops it, back to line 13 (D10)', 300);
  s.chunk([...D(), ...D()], 'two more D edit line 13', 40);
  s.chunk(latin1('e and son.'), 'line 13 rewritten', 40);
  liveLine(s, 14, tc(14, 0, 25), 'Q.  What time did you arrive?');

  // Timecodes: backward (bumped to previous + 1 frame = 14:00:25:01, D3),
  // equal to that (kept), then forward.
  liveLine(s, 15, tc(14, 0, 22), 'A.  About nine.');
  liveLine(s, 16, tc(14, 0, 25, 1), 'Q.  Nine exactly?');
  liveLine(s, 17, tc(14, 0, 30), 'A.  Roughly.');

  // Text bytes: CP1252 punctuation and an undefined slot, LF inside a line, a raw 0x08.
  s.chunk([...N(18), ...T(tc(14, 0, 35)), ...latin1('A.  Caf'), 0xe9, 0x20, 0x93, ...latin1('Le Bon'), 0x94, 0x20, 0x96, 0x20, ...latin1('open'), 0x85, 0x20, 0x81], 'CP1252 text (D2)', 400);
  s.chunk([...N(19), ...T(tc(14, 0, 40)), ...latin1('Q.  first part'), 0x0a, ...latin1('after a LF')], 'LF inside a line', 400);
  s.chunk([...N(20), ...T(tc(14, 0, 45)), ...latin1('A.  raw'), 0x08, ...latin1(' backspace byte')], 'a raw 0x08 text byte', 400);

  // Framing oddities: K, an unknown command letter, a stray ETX, commands split across chunks.
  s.chunk(K(), 'K (framed; the parser has no handler)', 300);
  s.chunk([STX, 0x5a, ...latin1('ulu')], 'STX + unknown letter Z: STX and Z become text', 300);
  s.chunk([ETX], 'a stray ETX after text (stale T length): becomes text', 300);
  s.split([...N(21), ...T(tc(14, 0, 50)), ...latin1('Q.  Split commands?')], [1, 2, 4, 6, 9], 'N and T split across chunks');
  s.chunk([...N(22), ...latin1('A.  No timecode on this line.')], 'N with no T', 400);
  s.chunk(F(0x20), 'F with an unknown format code', 200);

  // Page rollover.
  for (let n = 23; n <= 25; n++) liveLine(s, n, tc(14, 1, n), `Q.  Page three line ${n}?`);
  s.chunk(P(4), 'P: page 4', 400);
  for (let n = 1; n <= 3; n++) liveLine(s, n, tc(14, 2, n), `A.  Page four line ${n}.`);

  return {
    meta: {
      id: 'bridge-synthetic-edits',
      title: 'SYNTHETIC Bridge stream: backspace, formats, timecodes and framing edge cases',
      protocol: 'B',
      covers: [
        'D in-line, D on an empty buffer, D across a line boundary (D10)',
        'text before the first command, F mid-line (D9), an unknown F code',
        'a backward T timecode (bumped, D3) and one equal to the bumped value (kept)',
        'CP1252 text bytes (D2), LF and a raw 0x08 inside a line',
        'K (wire byte 0x48), an unknown command letter, a stray ETX, N and T split across chunks, N with no T',
        'page rollover P3 -> P4',
      ],
    },
    stream: s,
  };
}

// ---------------------------------------------------------------------------
// CaseView
// ---------------------------------------------------------------------------

function caseviewKit() {
  let marker = 0;
  return {
    /** Vendor line break: 0xF9 + 4 hex digits + 0xFA. */
    br: () => [0xf9, ...latin1((++marker).toString(16).toUpperCase().padStart(4, '0')), 0xfa],
    bs: (count) => new Array(count).fill(0x08),
    /** Vendor page throw: job token, then page number. */
    pageThrow: (page) => latin1(`\x0FRT050126\x0C${String(page).padStart(4, '0')}`),
  };
}

function caseviewLines() {
  const s = new Stream();
  const { br, pageThrow } = caseviewKit();
  const lines = (...texts) => texts.flatMap((t) => [...latin1(t), ...br()]);

  for (const ch of 'THE COURT:  Good morning.') s.chunk(latin1(ch), 'line 0 typed one byte per chunk', 25);
  s.chunk(br(), 'line break marker', 25);
  s.chunk(lines('MR SMITH:  Good morning, my Lord.', 'THE COURT:  Please be seated.', 'Q.  Your full name, please?'), 'three complete lines in one chunk (D30)', 600);
  s.chunk(latin1('A.  John Hen'), 'a line split mid-word', 300);
  s.chunk(latin1('ry Smith.'), 'the rest of it', 80);
  s.chunk(br(), 'break', 80);
  s.chunk([...latin1('Q.  Your address?'), 0x0d, 0x0a, ...latin1('A.  12 Mill Lane.'), 0x0a], 'CRLF and a raw LF as line breaks', 600);
  s.chunk([...latin1('Q.  How long there?'), 0xf9, ...latin1('00')], 'a break marker split across chunks (first half)', 600);
  s.chunk([...latin1('A1'), 0xfa, ...latin1('A.  Ten years.')], 'second half: the per-chunk pattern misses it', 80);
  s.chunk(br(), 'break', 80);
  s.chunk(lines('Q.  Do you know Mr Fayez?', 'A.  Yes, Mr Fayez is my neighbour.'), 'a name that matches the y<hex>z marker pattern', 600);
  s.chunk(lines('Q.  Exhibit {EX-12}, please.', 'A.  I have it.'), 'a {tab} token (no case tabs: [7] = [])', 600);
  s.chunk([...latin1('Q.  Caf'), 0xe9, ...latin1(' Rouge?'), ...br()], 'a high byte (ASCII decode clears bit 7)', 600);

  // Fill page 1 in multi-line chunks (the "Fayez" lines split, so the buffer
  // already holds 15 lines here), then the vendor throws the page.
  let n = 15;
  while (n < 25) {
    const batch = [];
    for (let k = 0; k < 4 && n < 25; k++, n++) batch.push(`Q.  Question ${n + 1}?`);
    s.chunk(lines(...batch), `${batch.length} lines in one chunk`, 700);
  }
  s.chunk([...pageThrow(2), ...lines('A.  First line of page two.')], 'page throw in vendor order (\\x0F token, \\x0C page)', 700);
  s.chunk([...latin1('\x0C0002\x0FRT050126'), ...lines('Q.  Page throw in reverse order.')], 'page throw in reverse order', 700);
  s.chunk([...latin1('A.  Before a split throw.'), ...br(), ...latin1('\x0FRT05')], 'a page throw split across chunks (first part)', 700);
  s.chunk([...latin1('0126\x0C00'), ], 'second part (held back by frameCarry)', 40);
  s.chunk([...latin1('02Q.  After the split throw.'), ...br()], 'third part', 40);
  s.chunk([...latin1('A.  A lone \x0Cform feed.'), ...br()], 'a lone \\x0C in text', 700);
  s.chunk(br(), 'an empty line (two breaks in a row)', 300);

  n = 0;
  while (n < 30) {
    const batch = [];
    for (let k = 0; k < 6 && n < 30; k++, n++) batch.push(n % 2 ? `A.  Answer ${n}.` : `Q.  Question ${n} on page two or three?`);
    s.chunk(lines(...batch), `${batch.length} lines in one chunk (page rollover)`, 900);
  }
  s.chunk(pageThrow(3), 'page throw to page 3', 300);
  s.chunk(latin1('THE COURT:  We will rise.'), 'last line, no break', 600);

  return {
    meta: {
      id: 'caseview-synthetic-lines',
      title: 'SYNTHETIC CaseView stream: line breaks, multi-line chunks, page throws and page rollover',
      protocol: 'C',
      covers: [
        'one-byte chunks, three complete lines in one chunk (R-TODO1 / D30), a line split mid-word',
        'line breaks as 0xF9 xxxx 0xFA markers, CRLF and raw LF; a marker split across chunks',
        'text that matches the y<hex>z marker pattern ("Mr Fayez")',
        'page throws in vendor order, reversed, split across three chunks (frameCarry), a lone \\x0C',
        'a {tab} token, a high byte, an empty line, page rollover past lines 25 and 50, a last line with no break',
      ],
    },
    stream: s,
  };
}

function caseviewEdits() {
  const s = new Stream();
  const { br, bs, pageThrow } = caseviewKit();

  s.chunk(bs(2), 'backspaces before any text', 100);
  s.chunk([...latin1('Q.  Where were yuo'), ...bs(2), ...latin1('ou that night.'), ...br()], 'in-line correction', 600);
  s.chunk([...bs(1), ...latin1('?')], 'one backspace across the break, then "?"', 600);
  s.chunk(br(), 'break', 80);
  s.chunk(latin1('A.  At home.'), 'line 1', 600);
  s.chunk(br(), 'break', 80);
  s.chunk([...bs(1), ...latin1('!'), ...br(), ...latin1('Q.  Alone?'), ...br(), ...latin1('A.  Yes.'), ...br()], 'backspace across the break, then two more lines in the same chunk', 600);
  s.chunk([...latin1('Q.  And the next day'), ...br(), ...latin1('A.  At')], 'two lines, the second unfinished (6 characters)', 600);
  s.chunk(bs(7), 'seven backspaces: six empty the line, the seventh steps back over the break', 600);
  s.chunk([...latin1('?'), ...br(), ...latin1('A.  At work.'), ...br()], 'retype', 300);
  s.chunk([...latin1('Q.  Two lines'), ...br(), ...latin1('to remove'), ...br()], 'two lines about to be removed', 600);
  s.chunk(bs(14), 'backspaces across two breaks', 600);
  s.chunk([...latin1('Q.  One line instead.'), ...br()], 'retype', 300);
  s.chunk([...latin1('A.  Ending in LF'), 0x0a], 'a raw LF break', 600);
  s.chunk([...bs(1), ...latin1(' and edited.'), 0x0a], 'backspace across the raw LF', 300);
  s.chunk([...latin1('Q.  Long tail'), ...bs(20)], 'a backspace storm longer than the line, into the line before', 600);
  s.chunk([...latin1('Q.  Recovered.'), ...br()], 'retype', 300);

  // Fill toward the end of page 1, throw the page, then step back over the throw.
  for (let n = 10; n < 25; n += 5) {
    const batch = [];
    for (let k = n; k < n + 5; k++) batch.push(...latin1(`Q.  Filler ${k}.`), ...br());
    s.chunk(batch, 'five lines in one chunk', 700);
  }
  s.chunk([...pageThrow(2), ...latin1('A.  Page two starts.'), ...br()], 'page throw, first line of page 2', 700);
  s.chunk([...bs(1)], 'backspace back over the break after the throw', 600);
  s.chunk([...latin1('?'), ...br()], 'retype the break', 300);
  s.chunk([...pageThrow(3), ...bs(3), ...latin1('xyz'), ...br()], 'page throw then backspaces in the same chunk', 600);
  s.chunk(latin1('THE COURT:  Adjourned.'), 'a line, no break yet', 600);

  // End on a take-back with nothing retyped. Every step-back above is followed
  // by new lines that overwrite the slots it left, so only here does the final
  // buffer show removeExtraLines cutting the tail: without it two empty lines
  // stay behind, with an off-by-one cut one does. 19 backspaces: 1 crosses the
  // second break, 17 empty "(Off the record.)", 1 crosses the first break and
  // leaves "THE COURT:  Adjourned" (a cross-break backspace also takes a
  // character from the line above).
  s.chunk([...br(), ...latin1('(Off the record.)'), ...br()], 'one more line and a break, about to be taken back', 600);
  s.chunk(bs(19), 'backspaces back across both breaks, nothing retyped: the stream ends here', 600);

  return {
    meta: {
      id: 'caseview-synthetic-edits',
      title: 'SYNTHETIC CaseView stream: backspace within and across lines',
      protocol: 'C',
      covers: [
        'backspaces before any text (empty globalBuffer), an in-line correction',
        'a backspace across a break at the start of a chunk, and mid-chunk before more lines',
        'seven backspaces that empty a line and step back, backspaces across two breaks',
        'a backspace across a raw LF, a storm longer than the line, backspaces right after page throws',
        'a stream that ends on a take-back across two breaks with nothing retyped, so the tail cut (removeExtraLines) shows in the final buffer',
      ],
    },
    stream: s,
  };
}

// ---------------------------------------------------------------------------

const BUILDERS = [
  bridgeRefresh,
  bridgeGlobalReplace,
  bridgeGlobalReplacePageStart,
  bridgeGlobalReplaceAllMatches,
  bridgeRefreshBackspace,
  bridgeEdits,
  caseviewLines,
  caseviewEdits,
];

/** Synthetic session ids: one per corpus, recognisably fake. */
const SESIDS = {
  'bridge-synthetic-refresh': '00000000-0000-4000-8000-000000000101',
  'bridge-synthetic-global-replace': '00000000-0000-4000-8000-000000000102',
  'bridge-synthetic-edits': '00000000-0000-4000-8000-000000000103',
  'bridge-synthetic-global-replace-page-start': '00000000-0000-4000-8000-000000000104',
  'bridge-synthetic-global-replace-all-matches': '00000000-0000-4000-8000-000000000105',
  'bridge-synthetic-refresh-backspace': '00000000-0000-4000-8000-000000000106',
  'caseview-synthetic-lines': '00000000-0000-4000-8000-000000000201',
  'caseview-synthetic-edits': '00000000-0000-4000-8000-000000000202',
};

/** { [relative path]: file content } for every synthetic corpus. */
function buildFiles() {
  const files = {};
  for (const build of BUILDERS) {
    const { meta, stream } = build();
    const corpus = {
      id: meta.id,
      title: meta.title,
      protocol: meta.protocol,
      origin: 'synthetic',
      source: { type: 'frames', file: 'frames.ndjson' },
      handshake: 'none',
      nSesid: SESIDS[meta.id],
      nLines: 25,
      cTimezone: 'UTC',
      covers: meta.covers,
      generator: 'tools/ci/golden-replay/build-synthetic-corpora.js',
    };
    files[`${meta.id}/corpus.json`] = JSON.stringify(corpus, null, 2) + '\n';
    files[`${meta.id}/frames.ndjson`] = stream.toNdjson();
  }
  return files;
}

/** Relative paths whose committed content differs from what the builders produce. */
function staleFiles(root = CORPORA_ROOT) {
  const out = [];
  for (const [rel, content] of Object.entries(buildFiles())) {
    const file = path.join(root, rel);
    const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n') : null;
    if (current !== content) out.push(rel);
  }
  return out;
}

function main(argv) {
  if (argv.includes('--check')) {
    const stale = staleFiles();
    if (stale.length) {
      console.error('build-synthetic-corpora: these files differ from the generator: ' + stale.join(', '));
      return 1;
    }
    console.log('build-synthetic-corpora: committed synthetic corpora match the generator.');
    return 0;
  }
  for (const [rel, content] of Object.entries(buildFiles())) {
    const file = path.join(CORPORA_ROOT, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
    console.log('wrote ' + path.relative(process.cwd(), file));
  }
  return 0;
}

if (require.main === module) process.exitCode = main(process.argv.slice(2));

module.exports = { buildFiles, staleFiles };
