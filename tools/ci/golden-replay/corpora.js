'use strict';
/**
 * Golden replay corpora: discovery, chunk loading and the input digest.
 *
 * A corpus is a folder holding a corpus.json and, once recorded, its
 * golden.json. Two sets:
 *   - tools/ci/golden-replay/corpora/<id>: always replayed. Bytes from
 *       "eclipse-capture": a tools/eclipse-capture rig capture directory, read
 *         in place (frames.ndjson keeps every TCP chunk with its receive time;
 *         payload.bin is their concatenation and is cross-checked);
 *       "frames": a frames.ndjson in the corpus folder, same line format as the
 *         rig writes ({ i, ts, dtMs, kind: "tcp-data", bytes, hex, … }).
 *   - tools/ci/golden-replay/extended/<id>: EXTENDED corpora, replayed only
 *     when their source folder exists (default ../tcp-server-main next to the
 *     repo, or $GOLDEN_REPLAY_EXTENDED_DIR, or --extended-dir). Bytes from
 *       "tcp-server-json": a tcp-server-main commands.json / cmd.json, READ IN
 *         PLACE (it holds real hearing text and is never copied into this
 *         repo), converted exactly like tcp-server-main/tcp.js jsonToHex: an
 *         entry with no cmdType is sent as the ASCII hex of data1, any other
 *         as its hexCmd, one socket write per entry.
 *     Their goldens hold digests and counts only, never text.
 * See README.md for the corpus.json fields.
 */

const crypto = require('crypto');
const path = require('path');

const CORPORA_DIR = 'tools/ci/golden-replay/corpora';
const EXTENDED_DIR = 'tools/ci/golden-replay/extended';
/** Overrides where the extended corpora's source files live. */
const EXTENDED_ENV = 'GOLDEN_REPLAY_EXTENDED_DIR';
const PROTOCOLS = ['B', 'C'];
const ORIGINS = ['real', 'synthetic'];
const HANDSHAKES = ['none', 'eclipse-login'];
/** IngestSessionWorker's handshake guard: no login within this many bytes drops the socket. */
const LOGIN_LIMIT = 512;
/** tcp-server-main/tcp.js writes one entry every delayMs = 400 ms; the replay stamps receive times the same way. */
const TCP_SERVER_GAP_MS = 400;
const TCP_SERVER_BASE_MS = Date.UTC(2026, 0, 6, 9, 0, 0);

/** Reads a frames.ndjson; returns the data chunks in file order as { bytes, tRecv }. */
function readFrames(fs, file) {
  const text = fs.readFileSync(file, 'utf8');
  const chunks = [];
  let lastI = 0;
  text.split('\n').forEach((line, n) => {
    if (!line.trim()) return;
    let rec;
    try {
      rec = JSON.parse(line);
    } catch (err) {
      throw new Error(`${file}:${n + 1}: not JSON (${err.message})`);
    }
    if (rec.kind !== 'tcp-data') return; // the rig also logs socket errors
    if (typeof rec.hex !== 'string' || !/^(?:[0-9a-f]{2})*$/i.test(rec.hex)) throw new Error(`${file}:${n + 1}: bad hex`);
    if (!(rec.i > lastI)) throw new Error(`${file}:${n + 1}: frame numbers must increase (got ${rec.i} after ${lastI})`);
    lastI = rec.i;
    const bytes = Buffer.from(rec.hex, 'hex');
    if (typeof rec.bytes === 'number' && rec.bytes !== bytes.length) throw new Error(`${file}:${n + 1}: "bytes" says ${rec.bytes}, hex holds ${bytes.length}`);
    const tRecv = Date.parse(rec.ts);
    if (!Number.isFinite(tRecv)) throw new Error(`${file}:${n + 1}: bad "ts"`);
    chunks.push({ bytes, tRecv });
  });
  return chunks;
}

/** tcp-server-main/tcp.js stringToAsciiHex, verbatim: 2-digit lowercase hex per UTF-16 code unit. */
function stringToAsciiHex(str) {
  return str
    .split('')
    .map((char) => char.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('');
}

/**
 * tcp-server-main/tcp.js jsonToHex + emitData: one chunk per JSON entry,
 * `!a.cmdType ? stringToAsciiHex(a.data1) : a.hexCmd`, through
 * Buffer.from(hex, 'hex') exactly as tcp.js writes it. An entry that
 * converts to no bytes is kept (socket.write of an empty buffer delivers
 * nothing; the replay skips empty chunks as the ingest does). Receive times
 * are the tcp.js pacing (400 ms apart).
 */
function tcpServerJsonChunks(text, label) {
  let entries;
  try {
    entries = JSON.parse(text);
  } catch (err) {
    throw new Error(`${label}: not JSON (${err.message})`);
  }
  if (!Array.isArray(entries)) throw new Error(`${label}: not a JSON array of tcp.js entries`);
  return entries.map((a, i) => {
    if (!a || typeof a !== 'object') throw new Error(`${label}: entry ${i} is not an object`);
    // tcp.js would throw on these entries; so does the loader, rather than guess
    if (!a.cmdType && typeof a.data1 !== 'string') throw new Error(`${label}: entry ${i} has no cmdType and no string data1`);
    if (a.cmdType && typeof a.hexCmd !== 'string') throw new Error(`${label}: entry ${i} (cmdType ${a.cmdType}) has no string hexCmd`);
    const hex = !a.cmdType ? stringToAsciiHex(a.data1) : a.hexCmd;
    return { bytes: Buffer.from(hex, 'hex'), tRecv: TCP_SERVER_BASE_MS + TCP_SERVER_GAP_MS * (i + 1) };
  });
}

/**
 * Drops the Eclipse "Socket Connection" login exactly as
 * EclipseTcpIngestService.handleConnection does: buffer until two
 * CRLF-terminated lines (username, password), feed the rest of that buffer as
 * one chunk when non-empty, then every later chunk unchanged. The credentials
 * never leave this function.
 */
function stripEclipseLogin(chunks, label) {
  const out = [];
  let buf = Buffer.alloc(0);
  let done = false;
  for (const chunk of chunks) {
    if (done) {
      out.push(chunk);
      continue;
    }
    buf = Buffer.concat([buf, chunk.bytes]);
    const first = buf.indexOf('\r\n');
    const second = first < 0 ? -1 : buf.indexOf('\r\n', first + 2);
    if (second < 0) {
      if (buf.length > LOGIN_LIMIT) throw new Error(`${label}: no Eclipse login within ${LOGIN_LIMIT} bytes (the ingest would drop this socket)`);
      continue;
    }
    done = true;
    const rest = buf.subarray(second + 2);
    if (rest.length) out.push({ bytes: Buffer.from(rest), tRecv: chunk.tRecv });
  }
  if (!done && chunks.length) throw new Error(`${label}: the capture ends before the Eclipse login is complete`);
  return out;
}

function validateCorpus(meta, dirName, { extended = false } = {}) {
  const where = `${extended ? EXTENDED_DIR : CORPORA_DIR}/${dirName}/corpus.json`;
  const fail = (msg) => {
    throw new Error(`${where}: ${msg}`);
  };
  if (meta.id !== dirName) fail(`"id" must equal the folder name "${dirName}"`);
  if (!PROTOCOLS.includes(meta.protocol)) fail(`"protocol" must be one of ${PROTOCOLS.join(', ')}`);
  if (!ORIGINS.includes(meta.origin)) fail(`"origin" must be one of ${ORIGINS.join(', ')}`);
  if (!HANDSHAKES.includes(meta.handshake)) fail(`"handshake" must be one of ${HANDSHAKES.join(', ')}`);
  if (typeof meta.nSesid !== 'string' || !meta.nSesid) fail('"nSesid" is required');
  if (!Number.isInteger(meta.nLines) || meta.nLines < 1) fail('"nLines" must be a positive integer');
  if (meta.cTimezone !== undefined && typeof meta.cTimezone !== 'string') fail('"cTimezone" must be a string');
  if (typeof meta.title !== 'string' || !meta.title) fail('"title" is required');
  if (meta.legacyMisroute !== undefined && typeof meta.legacyMisroute !== 'boolean') fail('"legacyMisroute" must be a boolean');
  const src = meta.source || {};
  if (extended) {
    if (src.type !== 'tcp-server-json') fail('an extended corpus needs "source.type": "tcp-server-json"');
    if (typeof src.file !== 'string' || !src.file || /[\\/]/.test(src.file)) fail('"source.file" must be a file name inside the extended folder');
    return;
  }
  if (src.type === 'eclipse-capture') {
    if (typeof src.dir !== 'string' || !src.dir) fail('"source.dir" is required for an eclipse-capture source');
  } else if (src.type === 'frames') {
    if (typeof src.file !== 'string' || !src.file) fail('"source.file" is required for a frames source');
  } else {
    fail('"source.type" must be "eclipse-capture" or "frames"');
  }
}

function listFolders(fs, repoRoot, rel, { required }) {
  const root = path.join(repoRoot, rel);
  if (!fs.existsSync(root)) {
    if (required) throw new Error(`no corpora folder: ${rel}`);
    return [];
  }
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isDirectory() && fs.existsSync(path.join(root, e.name, 'corpus.json')))
    .map((e) => e.name)
    .sort();
}

/** Every in-repo corpus folder (one with a corpus.json), sorted by id. */
function listCorpora(fs, repoRoot) {
  return listFolders(fs, repoRoot, CORPORA_DIR, { required: true });
}

/** Every extended corpus folder, sorted by id (their goldens live in the repo; their bytes do not). */
function listExtended(fs, repoRoot) {
  return listFolders(fs, repoRoot, EXTENDED_DIR, { required: false });
}

/** Where the extended corpora's source files are read from. */
function extendedSourceDir(env, repoRoot, override) {
  return path.resolve(override || (env && env[EXTENDED_ENV]) || path.join(repoRoot, '..', 'tcp-server-main'));
}

function readMeta(fs, dir, rel, id, extended) {
  let meta;
  try {
    meta = JSON.parse(fs.readFileSync(path.join(dir, 'corpus.json'), 'utf8'));
  } catch (err) {
    throw new Error(`${rel}/${id}/corpus.json: ${err.message}`);
  }
  validateCorpus(meta, id, { extended });
  return meta;
}

/**
 * Loads one corpus: its metadata, the chunks the ingest would hand the parser
 * (login stripped), and the digest of that input. `opts.extended` loads from
 * the extended set, reading the source file from `opts.extendedDir`.
 */
function loadCorpus(fs, repoRoot, id, opts = {}) {
  const extended = !!opts.extended;
  const rel = extended ? EXTENDED_DIR : CORPORA_DIR;
  const dir = path.join(repoRoot, rel, id);
  const meta = readMeta(fs, dir, rel, id, extended);

  let raw;
  if (extended) {
    const file = path.join(opts.extendedDir, meta.source.file);
    if (!fs.existsSync(file)) throw new Error(`extended corpus ${id}: ${file} not found (the extended folder ${opts.extendedDir} exists, so the gate will not skip it)`);
    raw = tcpServerJsonChunks(fs.readFileSync(file).toString('utf-8'), `extended corpus ${id} (${meta.source.file})`);
  } else if (meta.source.type === 'eclipse-capture') {
    const capDir = path.resolve(repoRoot, meta.source.dir);
    raw = readFrames(fs, path.join(capDir, 'frames.ndjson'));
    const payload = fs.readFileSync(path.join(capDir, 'payload.bin'));
    if (!Buffer.concat(raw.map((c) => c.bytes)).equals(payload)) {
      throw new Error(`${meta.source.dir}: frames.ndjson does not concatenate to payload.bin; the capture is torn`);
    }
  } else {
    raw = readFrames(fs, path.join(dir, meta.source.file));
  }
  const chunks = meta.handshake === 'eclipse-login' ? stripEclipseLogin(raw, id) : raw;

  return {
    meta,
    dir,
    extended,
    goldenFile: path.join(dir, 'golden.json'),
    chunks,
    input: inputSummary(meta, chunks),
  };
}

/**
 * What the parser is fed, as a digest: the session settings that reach the
 * parser and every chunk's receive time, length and bytes. A golden recorded
 * from a different input is stale.
 */
function inputSummary(meta, chunks) {
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify({ protocol: meta.protocol, nSesid: meta.nSesid, nLines: meta.nLines, cTimezone: meta.cTimezone ?? null }));
  let bytes = 0;
  for (const c of chunks) {
    hash.update(`\n${c.tRecv}:${c.bytes.length}:`);
    hash.update(c.bytes);
    bytes += c.bytes.length;
  }
  return { chunks: chunks.length, bytes, sha256: hash.digest('hex') };
}

/** The harness's ReplayInput for a loaded corpus. */
function replayInput(corpus) {
  const { meta } = corpus;
  return {
    id: meta.id,
    protocol: meta.protocol,
    nSesid: meta.nSesid,
    nLines: meta.nLines,
    cTimezone: meta.cTimezone,
    chunks: corpus.chunks,
  };
}

module.exports = {
  CORPORA_DIR,
  EXTENDED_DIR,
  EXTENDED_ENV,
  TCP_SERVER_GAP_MS,
  TCP_SERVER_BASE_MS,
  readFrames,
  stringToAsciiHex,
  tcpServerJsonChunks,
  stripEclipseLogin,
  validateCorpus,
  listCorpora,
  listExtended,
  extendedSourceDir,
  loadCorpus,
  inputSummary,
  replayInput,
};
