'use strict';
/**
 * Pure parts of the golden replay gate: tuple encoding, the masked golden
 * diff, the delivery-stream digests, the output and golden-set digests, the
 * two-run determinism comparison and the report text. No I/O; gate.js wires
 * these to the replay harness and the disk.
 *
 * A line is recorded as { pos, n, f, txt }:
 *   pos  its position in ctx.job.lineBuffer;
 *   n    the tuple's length (a trailing empty slot counts);
 *   f    every tuple field, encoded so that JSON keeps what JSON alone would
 *        lose: undefined and array holes become {"$undef":1} (no consumer can
 *        tell the two apart), NaN / ±Infinity / -0 become {"$num":"…"};
 *   txt  [1] decoded for people reading a golden; derived, never compared.
 * Lines are ordered by [2] (the line index the viewers place by), then by pos.
 * Two fields are equal when their encodings serialize to the same JSON, so the
 * comparison is byte-for-byte on everything a consumer can observe.
 *
 * A delivery is one sink call the parser made (emitLocal, emitDelivery,
 * savePageData), encoded with encodeValue at the moment of the call, and
 * grouped by the chunk whose processing made it. The tuples a payload carries
 * (`d`, `newLines`, `line`) are masked like buffer lines.
 */

const crypto = require('crypto');

/**
 * Fields the default golden diff ignores, per protocol: exactly the fields the
 * two-process determinism check (--determinism) shows differing between two
 * runs of the same code on the same corpus. Every other field must match the
 * golden byte for byte, in the final buffer and in every delivery. Goldens
 * record a masked field as {"$masked":1}; a masked [6] also masks the ids a
 * removeLines call carries.
 *
 * EMPTY since DET-1…DET-12 (rt-local-edge spec §6.1, FEED_PARSE_VERSION 1.1.0).
 * Until then two fields were masked:
 *  - Bridge [6], the line id: refresh replacement lines got
 *    `previous id + Math.random()` and every other id came from the sink's
 *    `nextId`. DET-3 (one allocator owned by the lib, line-ids.ts) made it a
 *    pure function of the input.
 *  - CaseView [0], the timecode: the parser read the wall clock per byte.
 *    DET-1 (the chunk's receive time travels with the chunk) made it a pure
 *    function of the input.
 * A field goes back in here only with the evidence of a failing
 * --determinism run, and never silently (README "Masks").
 */
const MASKED_FIELDS = Object.freeze({
  B: Object.freeze([]),
  C: Object.freeze([]),
});

const PROTOCOL_NAMES = Object.freeze({ B: 'Bridge', C: 'CaseView' });

/** Tuple slots as the spec names them (§6.3 RC-1). */
const FIELD_LABELS = Object.freeze({
  0: 'timecode',
  1: 'text',
  2: 'index',
  3: 'format',
  4: 'CAT page',
  5: 'CAT line',
  6: 'line id',
  7: 'tabs',
  8: 'frame',
  9: 'refresh index',
});

/** The sink calls the harness records, in the order a chunk makes them. */
const DELIVERY_CALLS = Object.freeze(['emitLocal', 'emitDelivery', 'savePageData']);
/** Payload keys that hold a list of line tuples, and keys that hold one tuple. */
const TUPLE_LIST_KEYS = Object.freeze(['d', 'newLines']);
const TUPLE_KEYS = Object.freeze(['line']);

/** Hex digits kept of a per-chunk delivery digest (48 bits: a regression test, not a signature). */
const CHUNK_DIGEST_HEX = 12;
/** Hex digits of the golden-set digest carried in FEED_PARSE_VERSION. */
const SET_DIGEST_HEX = 16;

const MASKED = Object.freeze({ $masked: 1 });

function encodeValue(value) {
  if (value === undefined) return { $undef: 1 };
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (Number.isNaN(value)) return { $num: 'NaN' };
    if (value === Infinity) return { $num: 'Infinity' };
    if (value === -Infinity) return { $num: '-Infinity' };
    if (Object.is(value, -0)) return { $num: '-0' };
    return value;
  }
  if (Array.isArray(value)) {
    const out = new Array(value.length);
    for (let i = 0; i < value.length; i++) out[i] = encodeValue(value[i]); // a hole reads as undefined
    return out;
  }
  if (Buffer.isBuffer(value)) return { $buf: value.toString('hex') };
  if (value instanceof Set) return { $set: [...value].map(encodeValue) };
  if (typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value).sort()) out[key] = encodeValue(value[key]);
    return { $obj: out };
  }
  return { $other: typeof value + ':' + String(value) };
}

/** [1] as text, when it is a list of char codes. */
function decodeText(codes) {
  if (!Array.isArray(codes)) return null;
  let out = '';
  for (let i = 0; i < codes.length; i++) {
    const c = codes[i];
    if (typeof c !== 'number' || !Number.isInteger(c) || c < 0 || c > 0xffff) return null;
    out += String.fromCharCode(c);
  }
  return out;
}

/** Buffer positions in the order the gate compares lines: by [2], then by position. */
function orderByLineIndex(lineBuffer) {
  const rows = [];
  for (let pos = 0; pos < lineBuffer.length; pos++) {
    const tuple = lineBuffer[pos];
    const index = Array.isArray(tuple) && typeof tuple[2] === 'number' && Number.isFinite(tuple[2]) ? tuple[2] : pos;
    rows.push({ pos, index, tuple });
  }
  rows.sort((a, b) => a.index - b.index || a.pos - b.pos);
  return rows;
}

/**
 * Line records for one final line buffer. `mask` lists the tuple fields to
 * record as {"$masked":1} (goldens); pass [] for the full state (determinism runs).
 */
function lineRecords(lineBuffer, mask) {
  return orderByLineIndex(lineBuffer).map(({ pos, tuple }) => {
    if (!Array.isArray(tuple)) return { pos, n: null, v: encodeValue(tuple) };
    const f = new Array(tuple.length);
    for (let i = 0; i < tuple.length; i++) f[i] = mask.includes(i) ? MASKED : encodeValue(tuple[i]);
    const record = { pos, n: tuple.length, f };
    const txt = decodeText(tuple[1]);
    if (txt !== null) record.txt = txt;
    return record;
  });
}

const json = (value) => JSON.stringify(value);

function sha256(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

/** The differences between two line records, ignoring the `ignore` fields. Empty = equal. */
function lineDifferences(a, b, ignore) {
  const diffs = [];
  if (a.pos !== b.pos) diffs.push({ field: 'pos', a: a.pos, b: b.pos });
  if (a.n !== b.n) diffs.push({ field: 'length', a: a.n, b: b.n });
  if (a.n === null || b.n === null) {
    if (json(a.v) !== json(b.v)) diffs.push({ field: 'value', a: a.v, b: b.v });
    return diffs;
  }
  const width = Math.max(a.n, b.n);
  for (let i = 0; i < width; i++) {
    if (ignore.includes(i)) continue;
    const av = i < a.n ? a.f[i] : undefined;
    const bv = i < b.n ? b.f[i] : undefined;
    if (json(av) !== json(bv)) diffs.push({ field: i, a: av, b: bv });
  }
  return diffs;
}

/**
 * Compares two record lists line by line (the i-th line against the i-th).
 * Returns [{ at, a, b, diffs }] for the lines that differ; a line present on
 * one side only has the other side null.
 */
function diffRecords(aLines, bLines, ignore) {
  const out = [];
  const width = Math.max(aLines.length, bLines.length);
  for (let at = 0; at < width; at++) {
    const a = aLines[at] || null;
    const b = bLines[at] || null;
    if (!a || !b) {
      out.push({ at, a, b, diffs: null });
      continue;
    }
    const diffs = lineDifferences(a, b, ignore);
    if (diffs.length) out.push({ at, a, b, diffs });
  }
  return out;
}

// ---------------------------------------------------------------------------
// digests (buffer, deliveries, output, golden set)
// ---------------------------------------------------------------------------

/** Digest of a record list; `txt` is derived from f[1] and left out. */
function bufferDigest(records) {
  return sha256(json(records.map((r) => (r.n === null ? { pos: r.pos, n: null, v: r.v } : { pos: r.pos, n: r.n, f: r.f }))));
}

/** An encoded tuple with the masked slots replaced (a non-array is returned as is). */
function maskEncodedTuple(tuple, mask) {
  if (!Array.isArray(tuple) || !mask.length) return tuple;
  return tuple.map((v, i) => (mask.includes(i) ? MASKED : v));
}

/** An encoded payload with the tuples it carries masked. */
function maskEncodedPayload(payload, mask) {
  if (!mask.length || !payload || typeof payload !== 'object' || !payload.$obj) return payload;
  const obj = { ...payload.$obj };
  for (const key of TUPLE_LIST_KEYS) {
    if (Array.isArray(obj[key])) obj[key] = obj[key].map((t) => maskEncodedTuple(t, mask));
  }
  for (const key of TUPLE_KEYS) {
    if (Array.isArray(obj[key])) obj[key] = maskEncodedTuple(obj[key], mask);
  }
  return { $obj: obj };
}

/** One recorded call with its tuples masked; a masked [6] also masks the ids of a removeLines call. */
function maskCall(call, mask) {
  if (call.fn === 'removeLines') {
    if (!mask.includes(6) || !Array.isArray(call.payload)) return call;
    return { ...call, payload: call.payload.map(() => MASKED) };
  }
  return { ...call, payload: maskEncodedPayload(call.payload, mask) };
}

/**
 * Digests of a delivery stream ([{ chunk, calls }], chunk = 0-based index of
 * the corpus chunk whose processing made the calls):
 *   perChunk  "<chunk>:<calls>:<12 hex>" for every chunk that made a call;
 *   sha256    over the whole masked stream.
 */
function deliveryDigests(deliveries, mask) {
  const perChunk = [];
  const whole = crypto.createHash('sha256');
  let calls = 0;
  for (const { chunk, calls: list } of deliveries) {
    if (!list.length) continue;
    const text = json(list.map((c) => maskCall(c, mask)));
    perChunk.push(`${chunk}:${list.length}:${sha256(text).slice(0, CHUNK_DIGEST_HEX)}`);
    whole.update(`${chunk}\n${text}\n`, 'utf8');
    calls += list.length;
  }
  return { calls, chunks: perChunk.length, sha256: whole.digest('hex'), perChunk };
}

function parseChunkEntry(entry) {
  const m = /^(\d+):(\d+):([0-9a-f]+)$/.exec(String(entry));
  return m ? { chunk: Number(m[1]), calls: Number(m[2]), digest: m[3] } : null;
}

/**
 * Per-chunk differences between a golden's and a replay's perChunk lists.
 * Returns [{ chunk, golden: {calls, digest} | null, replay: … | null }] in chunk order.
 */
function diffDeliveries(goldenPerChunk, replayPerChunk) {
  const index = (list) => new Map(list.map(parseChunkEntry).filter(Boolean).map((e) => [e.chunk, e]));
  const g = index(goldenPerChunk || []);
  const r = index(replayPerChunk || []);
  const chunks = [...new Set([...g.keys(), ...r.keys()])].sort((a, b) => a - b);
  const out = [];
  for (const chunk of chunks) {
    const a = g.get(chunk) || null;
    const b = r.get(chunk) || null;
    if (a && b && a.calls === b.calls && a.digest === b.digest) continue;
    out.push({ chunk, golden: a, replay: b });
  }
  return out;
}

/** Tuples a decoded (not encoded) payload carries, with where they sit. */
function payloadTuples(payload) {
  const out = [];
  if (!payload || typeof payload !== 'object') return out;
  for (const key of TUPLE_LIST_KEYS) {
    if (Array.isArray(payload[key])) payload[key].forEach((t, i) => out.push({ where: `${key}[${i}]`, tuple: t }));
  }
  for (const key of TUPLE_KEYS) {
    if (Array.isArray(payload[key])) out.push({ where: key, tuple: payload[key] });
  }
  return out;
}

/** Turns an encodeValue result back into a plain value (for reports only). */
function decodeValue(v) {
  if (Array.isArray(v)) return v.map(decodeValue);
  if (v && typeof v === 'object') {
    if (v.$undef) return undefined;
    if (v.$masked) return '(masked)';
    if (v.$num) return Number(v.$num);
    if (v.$buf !== undefined) return Buffer.from(v.$buf, 'hex');
    if (v.$set) return v.$set.map(decodeValue);
    if (v.$obj) {
      const o = {};
      for (const k of Object.keys(v.$obj)) o[k] = decodeValue(v.$obj[k]);
      return o;
    }
  }
  return v;
}

/** Readable lines describing one chunk's recorded calls (decoded text, never digests). */
function describeCalls(calls, limit = 8) {
  const out = [];
  for (const call of calls.slice(0, limit)) {
    const payload = decodeValue(call.payload);
    if (call.fn === 'removeLines') {
      out.push(`        removeLines: ids ${JSON.stringify(payload)}`);
      continue;
    }
    const head = call.fn + (call.event ? ` '${call.event}'` : '') + (call.fn === 'savePageData' ? ` page ${call.page}, ${call.lines} lines` : '');
    const tuples = payloadTuples(payload);
    out.push(`        ${head}: ${tuples.length} tuple(s)`);
    for (const { where, tuple } of tuples.slice(0, 6)) {
      const txt = Array.isArray(tuple) ? decodeText(tuple[1]) : null;
      const shown = txt === null ? '' : ' ' + JSON.stringify(txt.length > 60 ? txt.slice(0, 57) + '...' : txt);
      out.push(`          ${where}: [2]=${Array.isArray(tuple) ? JSON.stringify(tuple[2]) : '-'}${shown}`);
    }
    if (tuples.length > 6) out.push(`          … ${tuples.length - 6} more tuple(s)`);
  }
  if (calls.length > limit) out.push(`        … ${calls.length - limit} more call(s)`);
  return out;
}

/**
 * Digest of everything the gate compares for one corpus (not the stamps, not
 * txt): the input, the final buffer, the delivery stream, the canonical root
 * and the [6] uniqueness count. Any change to what the parser leaves behind or
 * delivers changes it, so it changes the golden-set digest in FEED_PARSE_VERSION.
 */
function outputDigest(parts) {
  return sha256(json({
    protocol: parts.protocol,
    masked: parts.masked,
    input: parts.input && parts.input.sha256,
    buffer: parts.buffer && parts.buffer.sha256,
    lines: parts.buffer && parts.buffer.lines,
    deliveries: parts.deliveries && parts.deliveries.sha256,
    canonical: parts.canonical && parts.canonical.root,
    duplicateIdChunks: parts.duplicateIdChunks || 0,
  }));
}

/** Chunks per block in an extended corpus's delivery digests (its golden keeps no per-chunk digest). */
const EXTENDED_BLOCK_CHUNKS = 256;

/**
 * Groups per-chunk delivery digests into blocks of `size` corpus chunks:
 * "<first chunk>-<last chunk>:<calls>:<16 hex>" per block that made a call.
 * A block digest covers hundreds of chunks of a real hearing, so it says
 * which stretch delivers differently without being a digest of a few words.
 */
function blockDigests(perChunk, size = EXTENDED_BLOCK_CHUNKS) {
  const blocks = new Map();
  for (const entry of perChunk || []) {
    const e = parseChunkEntry(entry);
    if (!e) continue;
    const b = Math.floor(e.chunk / size);
    const block = blocks.get(b) || { calls: 0, parts: [] };
    block.calls += e.calls;
    block.parts.push(entry);
    blocks.set(b, block);
  }
  return [...blocks.keys()].sort((a, b) => a - b).map((b) => {
    const block = blocks.get(b);
    return `${b * size}-${b * size + size - 1}:${block.calls}:${sha256(block.parts.join('\n')).slice(0, 16)}`;
  });
}

/** Indices (0-based) where two digest lists differ, plus a length difference. */
function digestListDifferences(a, b) {
  const out = [];
  const width = Math.max((a || []).length, (b || []).length);
  for (let i = 0; i < width; i++) if ((a || [])[i] !== (b || [])[i]) out.push(i);
  return out;
}

/**
 * The golden-corpus digest DET-10 puts in FEED_PARSE_VERSION: over every
 * golden's (id, outputDigest), sorted by id. Any change to any golden's
 * compared output changes it.
 */
function goldenSetDigest(entries) {
  const rows = entries
    .map((e) => `${e.id}\t${e.outputDigest}`)
    .sort();
  return sha256(rows.join('\n') + '\n').slice(0, SET_DIGEST_HEX);
}

/**
 * [6] line ids that occur on more than one line of a buffer. Only finite,
 * non-zero numbers count: the line-0 placeholder and N-created lines have no
 * id yet.
 */
function duplicateIds(lineBuffer) {
  const seen = new Set();
  const dups = new Set();
  for (const tuple of lineBuffer || []) {
    if (!Array.isArray(tuple)) continue;
    const id = tuple[6];
    if (typeof id !== 'number' || !Number.isFinite(id) || id === 0) continue;
    if (seen.has(id)) dups.add(id);
    seen.add(id);
  }
  return [...dups].sort((a, b) => a - b);
}

// ---------------------------------------------------------------------------
// report text
// ---------------------------------------------------------------------------

function fieldName(field) {
  if (typeof field === 'number') return '[' + field + '] ' + (FIELD_LABELS[field] || 'field');
  if (field === 'pos') return 'buffer position';
  if (field === 'length') return 'tuple length';
  return field;
}

/** A field value for a report line: text as a quoted string, the rest as JSON. */
function showValue(field, value) {
  if (value === undefined) return '(absent)';
  if (field === 1 && Array.isArray(value)) {
    const txt = decodeText(value);
    if (txt !== null) return JSON.stringify(txt);
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    if (value.$undef) return 'undefined';
    if (value.$masked) return '(masked)';
    if (value.$num) return value.$num;
  }
  const text = JSON.stringify(value);
  return text.length > 160 ? text.slice(0, 157) + '...' : text;
}

function describeLine(record) {
  if (!record) return '(none)';
  const where = 'buffer position ' + record.pos;
  if (record.n === null) return where + ', not a tuple: ' + JSON.stringify(record.v);
  const parts = [where];
  if (record.f.length > 2 && typeof record.f[2] === 'number') parts.unshift('index ' + record.f[2]);
  if (typeof record.f[0] === 'string') parts.push('timecode ' + record.f[0]);
  if (record.txt !== undefined) parts.push(JSON.stringify(record.txt.length > 70 ? record.txt.slice(0, 67) + '...' : record.txt));
  return parts.join(', ');
}

/**
 * Readable per-line diff of a golden (side a) against a replay (side b).
 * Returns report lines; `limit` caps the number of lines described.
 */
function formatDiff(diffs, { limit = 25, aName = 'golden', bName = 'replay' } = {}) {
  const out = [];
  const width = Math.max(aName.length, bName.length);
  const pad = (s) => (s + ':').padEnd(width + 2);
  for (const d of diffs.slice(0, limit)) {
    if (!d.a) {
      out.push(`  line #${d.at}: only in the ${bName}: ${describeLine(d.b)}`);
      continue;
    }
    if (!d.b) {
      out.push(`  line #${d.at}: missing from the ${bName}: ${describeLine(d.a)}`);
      continue;
    }
    out.push(`  line #${d.at} (${describeLine(d.a)}):`);
    for (const f of d.diffs) {
      out.push(`      ${fieldName(f.field)}`);
      out.push(`        ${pad(aName)}${showValue(f.field, f.a)}`);
      out.push(`        ${pad(bName)}${showValue(f.field, f.b)}`);
    }
  }
  if (diffs.length > limit) out.push(`  … and ${diffs.length - limit} more differing line(s); --all lists every one`);
  return out;
}

/**
 * Readable delivery diff: which chunks deliver differently, and what the
 * replay delivered at the first of them. `replayCalls(chunk)` returns the
 * replay's recorded calls for that chunk (the golden keeps digests only).
 */
function formatDeliveryDiff(diffs, replayCalls, { limit = 10 } = {}) {
  const out = [];
  const side = (e) => (e ? `${e.calls} call(s), digest ${e.digest}` : 'no calls');
  for (const d of diffs.slice(0, limit)) {
    out.push(`  chunk #${d.chunk + 1}: golden ${side(d.golden)}; replay ${side(d.replay)}`);
  }
  if (diffs.length > limit) out.push(`  … and ${diffs.length - limit} more chunk(s) deliver differently`);
  if (diffs.length && replayCalls) {
    const first = diffs[0].chunk;
    const calls = replayCalls(first) || [];
    out.push(`  what the replay delivered at chunk #${first + 1} (the golden keeps a digest only; run the gate on the old tree with --show-deliveries ${first + 1} to see its side):`);
    out.push(...(calls.length ? describeCalls(calls) : ['        nothing']));
  }
  return out;
}

// ---------------------------------------------------------------------------
// determinism (two runs of the same code)
// ---------------------------------------------------------------------------

/**
 * Compares two full-state runs ({ corpora: [{ id, protocol, lines, deliveries?, digests? }] })
 * on every field. Returns per-protocol findings:
 *   { B: { fields: { '<field>': { lines, corpora: [ids] } }, lines }, C: … }
 * plus `structural` problems (a corpus missing from one run, line counts).
 * Delivery differences are counted under 'delivery [<field>]' (in-repo
 * corpora, compared tuple by tuple) or 'deliveries' (extended corpora, which
 * a run records as digests only).
 */
function compareRuns(runA, runB) {
  const byProtocol = {};
  const structural = [];
  const bIndex = new Map(runB.corpora.map((c) => [c.id, c]));
  const count = (proto, key, id, n = 1) => {
    const entry = (proto.fields[key] = proto.fields[key] || { lines: 0, corpora: [] });
    entry.lines += n;
    if (!entry.corpora.includes(id)) entry.corpora.push(id);
  };
  for (const a of runA.corpora) {
    const b = bIndex.get(a.id);
    if (!b) {
      structural.push(`${a.id}: missing from the second run`);
      continue;
    }
    bIndex.delete(a.id);
    const proto = (byProtocol[a.protocol] = byProtocol[a.protocol] || { fields: {}, lines: 0 });
    if (a.lines) {
      proto.lines += a.lines.length;
      if (a.lines.length !== b.lines.length) {
        structural.push(`${a.id}: ${a.lines.length} line(s) in the first run, ${b.lines.length} in the second`);
      }
      for (const d of diffRecords(a.lines, b.lines, [])) {
        if (!d.diffs) continue; // counted in structural above
        for (const f of d.diffs) count(proto, String(f.field), a.id);
      }
    }
    if (a.lineDigests) {
      // extended corpora: one digest per line field, never the text
      proto.lines += a.lineDigests.length;
      if (a.lineDigests.length !== b.lineDigests.length) {
        structural.push(`${a.id}: ${a.lineDigests.length} line(s) in the first run, ${b.lineDigests.length} in the second`);
      }
      const width = Math.min(a.lineDigests.length, b.lineDigests.length);
      for (let i = 0; i < width; i++) {
        const fa = a.lineDigests[i];
        const fb = b.lineDigests[i];
        for (let k = 0; k < Math.max(fa.length, fb.length); k++) if (fa[k] !== fb[k]) count(proto, String(k), a.id);
      }
    }
    if (a.deliveries && b.deliveries) {
      const bChunks = new Map(b.deliveries.map((c) => [c.chunk, c.calls]));
      const aChunks = new Set();
      for (const { chunk, calls } of a.deliveries) {
        aChunks.add(chunk);
        const other = bChunks.get(chunk);
        if (!other) {
          count(proto, 'delivery calls', a.id);
          continue;
        }
        if (json(calls) === json(other)) continue;
        if (calls.length !== other.length) {
          count(proto, 'delivery calls', a.id);
          continue;
        }
        for (let k = 0; k < calls.length; k++) {
          const fields = callFieldDifferences(calls[k], other[k]);
          for (const f of fields) count(proto, 'delivery ' + (typeof f === 'number' ? '[' + f + ']' : f), a.id);
        }
      }
      for (const chunk of bChunks.keys()) if (!aChunks.has(chunk)) count(proto, 'delivery calls', a.id);
    } else if (a.deliveryDigests && b.deliveryDigests) {
      const diffs = diffDeliveries(a.deliveryDigests, b.deliveryDigests);
      if (diffs.length) count(proto, 'deliveries', a.id, diffs.length);
    }
    if (a.canonicalRoot !== undefined && a.canonicalRoot !== b.canonicalRoot) count(proto, 'canonical root', a.id);
    for (const run of [a, b]) {
      if (run.duplicateIdChunks) structural.push(`${a.id}: [6] line ids not unique at ${run.duplicateIdChunks} chunk boundar${run.duplicateIdChunks === 1 ? 'y' : 'ies'} in ${run === a ? 'the first' : 'the second'} run`);
    }
  }
  for (const id of bIndex.keys()) structural.push(`${id}: missing from the first run`);
  return { byProtocol, structural };
}

/** The tuple fields (or 'payload') that differ between two encoded calls. */
function callFieldDifferences(a, b) {
  const fields = new Set();
  if (a.fn !== b.fn || a.event !== b.event || a.page !== b.page || a.lines !== b.lines) fields.add('call');
  const pa = decodeValueShallow(a.payload);
  const pb = decodeValueShallow(b.payload);
  const ta = payloadTuples(pa);
  const tb = payloadTuples(pb);
  if (ta.length !== tb.length) fields.add('payload');
  for (let i = 0; i < Math.min(ta.length, tb.length); i++) {
    const x = ta[i].tuple;
    const y = tb[i].tuple;
    if (!Array.isArray(x) || !Array.isArray(y)) {
      if (json(x) !== json(y)) fields.add('payload');
      continue;
    }
    if (x.length !== y.length) fields.add('length');
    for (let k = 0; k < Math.max(x.length, y.length); k++) if (json(x[k]) !== json(y[k])) fields.add(k);
  }
  const strip = (p) => {
    if (!p || typeof p !== 'object') return p;
    const o = { ...p };
    for (const k of [...TUPLE_LIST_KEYS, ...TUPLE_KEYS]) delete o[k];
    return o;
  };
  if (json(strip(pa)) !== json(strip(pb))) fields.add('payload');
  return [...fields];
}

/** Unwraps the top-level {$obj} of an encoded payload; tuples stay encoded. */
function decodeValueShallow(v) {
  return v && typeof v === 'object' && v.$obj ? { ...v.$obj } : v;
}

/** Per-field digests of every line (extended corpora: the determinism run never writes their text). */
function lineFieldDigests(records) {
  return records.map((r) => {
    if (r.n === null) return [sha256(json(r.v)).slice(0, CHUNK_DIGEST_HEX)];
    return [String(r.pos), String(r.n), ...r.f.map((v) => sha256(json(v)).slice(0, CHUNK_DIGEST_HEX))];
  });
}

/**
 * Sorts determinism findings against MASKED_FIELDS:
 *   unexpected  fields that differ between runs but are not masked (the gate
 *               would compare a nondeterministic field: report, never mask silently);
 *   covered     masked fields that did differ;
 *   unobserved  masked fields that were identical in both runs.
 * A masked tuple field also covers the same field inside deliveries.
 */
function assessDeterminism(result, masks = MASKED_FIELDS) {
  const unexpected = [];
  const covered = [];
  const unobserved = [];
  for (const protocol of Object.keys(result.byProtocol).sort()) {
    const { fields } = result.byProtocol[protocol];
    const mask = (masks[protocol] || []).map(String);
    const masked = (key) => mask.includes(key) || mask.some((m) => key === `delivery [${m}]`);
    for (const key of Object.keys(fields).sort(fieldOrder)) {
      (masked(key) ? covered : unexpected).push({ protocol, field: key, ...fields[key] });
    }
    for (const key of mask) if (!fields[key]) unobserved.push({ protocol, field: key });
  }
  return { unexpected, covered, unobserved, structural: result.structural };
}

function fieldOrder(a, b) {
  const na = /^\d+$/.test(a) ? Number(a) : Infinity;
  const nb = /^\d+$/.test(b) ? Number(b) : Infinity;
  return na - nb || (a < b ? -1 : a > b ? 1 : 0);
}

function fieldKeyName(key) {
  return /^\d+$/.test(key) ? fieldName(Number(key)) : fieldName(key);
}

module.exports = {
  MASKED_FIELDS,
  PROTOCOL_NAMES,
  FIELD_LABELS,
  DELIVERY_CALLS,
  CHUNK_DIGEST_HEX,
  SET_DIGEST_HEX,
  encodeValue,
  decodeValue,
  decodeText,
  orderByLineIndex,
  lineRecords,
  lineDifferences,
  diffRecords,
  bufferDigest,
  maskEncodedPayload,
  maskCall,
  deliveryDigests,
  diffDeliveries,
  payloadTuples,
  describeCalls,
  outputDigest,
  EXTENDED_BLOCK_CHUNKS,
  blockDigests,
  digestListDifferences,
  goldenSetDigest,
  duplicateIds,
  lineFieldDigests,
  formatDiff,
  formatDeliveryDiff,
  compareRuns,
  callFieldDifferences,
  assessDeterminism,
  fieldName,
  fieldKeyName,
  sha256,
};
