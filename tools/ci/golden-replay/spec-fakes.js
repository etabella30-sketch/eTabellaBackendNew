'use strict';
/**
 * Test-only fakes for the golden replay gate specs: an in-memory fs (just the
 * calls corpora.js and gate.js make) and helpers that build corpus folders in
 * it, so a spec never reads or writes the real disk.
 */

const path = require('path');

function enoent(p) {
  const err = new Error("ENOENT: no such file or directory, '" + p + "'");
  err.code = 'ENOENT';
  return err;
}

/** `initial` maps paths to file contents. */
function memoryFs(initial = {}) {
  const files = new Map();
  const dirs = new Set();
  const writes = [];
  const norm = (p) => path.resolve(p);
  const addParents = (p) => {
    let d = path.dirname(p);
    while (!dirs.has(d)) {
      dirs.add(d);
      const up = path.dirname(d);
      if (up === d) break;
      d = up;
    }
  };
  const put = (p, data) => {
    const n = norm(p);
    files.set(n, Buffer.isBuffer(data) ? data : Buffer.from(String(data)));
    addParents(n);
  };
  for (const [p, data] of Object.entries(initial)) put(p, data);
  return {
    files,
    writes,
    existsSync: (p) => files.has(norm(p)) || dirs.has(norm(p)),
    readFileSync(p, enc) {
      const n = norm(p);
      if (!files.has(n)) throw enoent(n);
      const buf = files.get(n);
      return enc ? buf.toString(enc) : buf;
    },
    writeFileSync(p, data) {
      writes.push(norm(p));
      put(p, data);
    },
    readdirSync(p) {
      const n = norm(p);
      if (!dirs.has(n)) throw enoent(n);
      const kinds = new Map();
      for (const k of files.keys()) if (path.dirname(k) === n) kinds.set(path.basename(k), 'file');
      for (const d of dirs) if (d !== n && path.dirname(d) === n) kinds.set(path.basename(d), 'dir');
      return [...kinds].map(([name, kind]) => ({ name, isFile: () => kind === 'file', isDirectory: () => kind === 'dir' }));
    },
  };
}

/** frames.ndjson text for chunks given as byte arrays (or latin1 strings), 40 ms apart. */
function framesNdjson(chunks, baseMs = Date.UTC(2026, 0, 5, 10, 0, 0)) {
  return chunks
    .map((c, n) => {
      const bytes = Buffer.isBuffer(c) ? c : typeof c === 'string' ? Buffer.from(c, 'latin1') : Buffer.from(c);
      return JSON.stringify({ i: n + 1, ts: new Date(baseMs + 40 * (n + 1)).toISOString(), dtMs: 40 * (n + 1), kind: 'tcp-data', bytes: bytes.length, hex: bytes.toString('hex') });
    })
    .join('\n') + '\n';
}

/** Files of one "frames" corpus folder under <repo>/tools/ci/golden-replay/corpora/<id>. */
function corpusFiles(repo, id, { protocol = 'B', chunks = ['abc'], extra = {} } = {}) {
  const dir = path.join(repo, 'tools', 'ci', 'golden-replay', 'corpora', id);
  const meta = {
    id,
    title: 'spec corpus ' + id,
    protocol,
    origin: 'synthetic',
    source: { type: 'frames', file: 'frames.ndjson' },
    handshake: 'none',
    nSesid: '00000000-0000-4000-8000-000000000999',
    nLines: 25,
    cTimezone: 'UTC',
    ...extra,
  };
  return {
    [path.join(dir, 'corpus.json')]: JSON.stringify(meta),
    [path.join(dir, 'frames.ndjson')]: framesNdjson(chunks),
  };
}

/** libs/feed-parse/src/version.ts with the given FEED_PARSE_VERSION. */
function versionFile(repo, version) {
  return {
    [path.join(repo, 'libs', 'feed-parse', 'src', 'version.ts')]: `/** spec */\nexport const FEED_PARSE_VERSION = '${version}';\n`,
  };
}

/** FEED_PARSE_VERSION as the fake harness reads it from the in-memory version.ts. */
function readVersion(fs, repo) {
  const text = fs.readFileSync(path.join(repo, 'libs', 'feed-parse', 'src', 'version.ts'), 'utf8');
  const m = /FEED_PARSE_VERSION\s*=\s*'([^']*)'/.exec(text);
  if (!m) throw new Error('no FEED_PARSE_VERSION in the spec version.ts');
  return m[1];
}

/**
 * Files of one EXTENDED corpus: its corpus.json under
 * <repo>/tools/ci/golden-replay/extended/<id>, and its tcp-server-main style
 * source file (a JSON array of { cmdType?, data1?, hexCmd? } entries) in `sourceDir`.
 */
function extendedFiles(repo, id, sourceDir, { file = 'commands.json', entries = [{ data1: 'abc' }], extra = {} } = {}) {
  const dir = path.join(repo, 'tools', 'ci', 'golden-replay', 'extended', id);
  const meta = {
    id,
    title: 'spec extended corpus ' + id,
    protocol: 'B',
    origin: 'real',
    source: { type: 'tcp-server-json', file },
    handshake: 'none',
    nSesid: '00000000-0000-4000-8000-000000000998',
    nLines: 25,
    cTimezone: 'UTC',
    ...extra,
  };
  return {
    [path.join(dir, 'corpus.json')]: JSON.stringify(meta),
    [path.join(sourceDir, file)]: JSON.stringify(entries),
  };
}

module.exports = { memoryFs, framesNdjson, corpusFiles, versionFile, readVersion, extendedFiles };
