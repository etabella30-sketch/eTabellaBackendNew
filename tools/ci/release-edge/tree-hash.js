'use strict';
/**
 * sha256 of a built directory (the FE edge bundle).
 *
 * One "<sha256 of file>  <path>\n" line per file, paths relative and
 * '/'-separated, sorted; the tree hash is the sha256 of those lines. That is
 * the format sha256sum prints, so it can be checked by hand on the box:
 *
 *   cd <bundle> && find . -type f -printf '%P\n' | LC_ALL=C sort \
 *     | while IFS= read -r f; do sha256sum "$f"; done | sha256sum
 */

const crypto = require('crypto');
const path = require('path');

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function listFiles(fs, dir, prefix, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? prefix + '/' + entry.name : entry.name;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) listFiles(fs, full, rel, out);
    else if (entry.isFile()) out.push({ rel, full });
  }
  return out;
}

function hashLines(fs, files) {
  const sorted = [...files].sort((a, b) => (a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0));
  let lines = '';
  let bytes = 0;
  for (const f of sorted) {
    const data = fs.readFileSync(f.full);
    bytes += data.length;
    lines += sha256(data) + '  ' + f.rel + '\n';
  }
  return { sha256: sha256(lines), files: sorted.length, bytes };
}

/** Returns { sha256, files, bytes }. An empty or missing directory throws. */
function hashTree(fs, dir) {
  if (!fs.existsSync(dir)) throw new Error('bundle directory missing: ' + dir);
  const files = listFiles(fs, dir, '', []);
  if (files.length === 0) throw new Error('bundle directory is empty: ' + dir);
  return hashLines(fs, files);
}

/**
 * The same hash over named files in `dir` ('/'-separated paths). For
 * package.json and package-lock.json it equals
 *   sha256sum package-lock.json package.json | sha256sum
 * A missing file throws.
 */
function hashFiles(fs, dir, rels) {
  const files = rels.map((rel) => ({ rel, full: path.join(dir, ...rel.split('/')) }));
  for (const f of files) if (!fs.existsSync(f.full)) throw new Error('file missing: ' + f.full);
  return hashLines(fs, files);
}

module.exports = { hashTree, hashFiles, sha256 };
