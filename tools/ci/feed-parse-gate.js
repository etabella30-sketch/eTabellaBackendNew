#!/usr/bin/env node
/**
 * feed-parse CI gate — permanent purity guard for libs/feed-parse.
 *
 * Phase-2 review graft of docs/eclipse-wss-ingest-plan.md (see
 * docs/feed-parse-quarantine.md "## CI gate"). The parser lib must stay
 * singleton-free and I/O-free: no imports from apps/, no SessionService
 * references, no @app/global, no socket.io / ioredis / child_process / fs.
 *
 * Usage (from the repo root):
 *   node tools/ci/feed-parse-gate.js
 *
 * Exit 0 = PASS. Exit 1 = violations, listed as file:line:match [rule].
 *
 * Scanning rules:
 *  - every .ts under libs/feed-parse/src, recursively;
 *  - .spec.ts files are checked ONLY against the apps/ rules (specs may
 *    reference banned names in fixtures/assertions, but must never import
 *    from apps/);
 *  - comments are stripped before matching (line numbers preserved) so
 *    port-provenance notes like "was sessionService.CurrentJob" don't trip
 *    the gate; STRING LITERALS ARE KEPT, so import/require specifiers and
 *    sneaky dynamic references are still caught.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const LIB_SRC = path.join(REPO_ROOT, 'libs', 'feed-parse', 'src');

/** Rules enforced on EVERY .ts file, including .spec.ts. */
const APPS_RULES = [
  { name: 'import-from-apps', re: /from ['"].*apps\// },
  { name: 'require-from-apps', re: /require\(.*apps\// },
];

/** Rules enforced on non-spec .ts files only. */
const LIB_RULES = [
  { name: 'sessionService-ref', re: /sessionService/i },
  { name: 'SessionService-ref', re: /SessionService/ },
  { name: 'import-@app/global', re: /from ['"]@app\/global/ },
  { name: 'socket.io', re: /socket\.io/ },
  { name: 'ioredis', re: /ioredis/ },
  { name: 'child_process', re: /child_process/ },
  { name: 'fs-import', re: /fs['"]|from ['"]fs/ },
];

/**
 * Replace // line comments and slash-star block comments with spaces,
 * preserving newlines (so reported line numbers match the source) and
 * preserving string-literal content (so banned import specifiers inside
 * quotes are still visible to the rules).
 */
function stripComments(src) {
  let out = '';
  let state = 'code'; // code | line | block | squote | dquote | template
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    const d = i + 1 < n ? src[i + 1] : '';
    switch (state) {
      case 'code':
        if (c === '/' && d === '/') {
          state = 'line';
          out += '  ';
          i += 2;
        } else if (c === '/' && d === '*') {
          state = 'block';
          out += '  ';
          i += 2;
        } else if (c === "'") {
          state = 'squote';
          out += c;
          i += 1;
        } else if (c === '"') {
          state = 'dquote';
          out += c;
          i += 1;
        } else if (c === '`') {
          state = 'template';
          out += c;
          i += 1;
        } else {
          out += c;
          i += 1;
        }
        break;
      case 'line':
        if (c === '\n') {
          state = 'code';
          out += c;
        } else {
          out += c === '\r' ? '\r' : ' ';
        }
        i += 1;
        break;
      case 'block':
        if (c === '*' && d === '/') {
          state = 'code';
          out += '  ';
          i += 2;
        } else {
          out += c === '\n' || c === '\r' ? c : ' ';
          i += 1;
        }
        break;
      case 'squote':
        if (c === '\\' && i + 1 < n) {
          out += c + d;
          i += 2;
        } else {
          if (c === "'" || c === '\n') state = 'code'; // newline = unterminated, bail to code
          out += c;
          i += 1;
        }
        break;
      case 'dquote':
        if (c === '\\' && i + 1 < n) {
          out += c + d;
          i += 2;
        } else {
          if (c === '"' || c === '\n') state = 'code';
          out += c;
          i += 1;
        }
        break;
      case 'template':
        if (c === '\\' && i + 1 < n) {
          out += c + d;
          i += 2;
        } else {
          if (c === '`') state = 'code';
          out += c;
          i += 1;
        }
        break;
      default:
        throw new Error('unreachable state: ' + state);
    }
  }
  return out;
}

/** Recursively collect .ts files under dir. */
function walk(dir) {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...walk(full));
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      found.push(full);
    }
  }
  return found;
}

function main() {
  if (!fs.existsSync(LIB_SRC)) {
    console.error('feed-parse-gate: FAIL — missing directory: ' + LIB_SRC);
    process.exit(1);
  }

  const files = walk(LIB_SRC).sort();
  const violations = [];

  for (const file of files) {
    const rel = path.relative(REPO_ROOT, file).split(path.sep).join('/');
    const isSpec = file.endsWith('.spec.ts');
    const rules = isSpec ? APPS_RULES : APPS_RULES.concat(LIB_RULES);
    const stripped = stripComments(fs.readFileSync(file, 'utf8'));
    const lines = stripped.split(/\r?\n/);
    for (let ln = 0; ln < lines.length; ln++) {
      for (const rule of rules) {
        const m = lines[ln].match(rule.re);
        if (m) {
          violations.push(rel + ':' + (ln + 1) + ':' + m[0].trim() + '  [' + rule.name + ']');
        }
      }
    }
  }

  if (violations.length > 0) {
    console.error('feed-parse-gate: FAIL — ' + violations.length + ' violation(s) in libs/feed-parse/src:');
    for (const v of violations) console.error('  ' + v);
    console.error('The parser lib must not touch apps/, SessionService, @app/global, socket.io, ioredis, child_process, or fs.');
    console.error('See docs/feed-parse-quarantine.md ("## CI gate").');
    process.exit(1);
  }

  console.log('feed-parse-gate: PASS — ' + files.length + ' file(s) scanned under libs/feed-parse/src, 0 violations.');
}

main();
