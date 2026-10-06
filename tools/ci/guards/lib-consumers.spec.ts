import * as fs from 'fs';
import * as path from 'path';

/*
 * tools/ci/lib-consumers.json must equal the real import graph: for every lib under libs/, the apps whose
 * PRODUCTION sources (apps/<app>/src/**\/*.ts, not *.spec.ts) import `@app/<lib>` or `@app/<lib>/...`.
 * Phase 2 of the shared-libraries plan (2026-10-06) makes Jenkins rebuild those apps when the lib changes, so a
 * stale entry would skip a rebuild. The file is kept honest by recomputing it here and comparing, rather than by
 * trusting a hand edit. Comments are stripped before matching, so a commented-out import is not a consumer
 * (apps/upload still carries `// import ... from '@app/alpha-queue'`); the e2e harness under apps/rt-edge/e2e is
 * outside src and does not count. On a mismatch the failure diff IS the JSON to paste under "libs".
 */

const REPO = path.resolve(__dirname, '..', '..', '..');
const LIBS_DIR = path.join(REPO, 'libs');
const APPS_DIR = path.join(REPO, 'apps');
const CONSUMERS_FILE = path.join(REPO, 'tools', 'ci', 'lib-consumers.json');

/** Blank out // and block comments, keeping newlines and string literals (copied from edge-token.purity.spec.ts). */
function stripComments(src: string): string {
  let out = '';
  let state: 'code' | 'line' | 'block' | "'" | '"' | '`' = 'code';
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    const d = src[i + 1];
    if (state === 'code') {
      if (c === '/' && d === '/') {
        state = 'line';
        out += '  ';
        i++;
      } else if (c === '/' && d === '*') {
        state = 'block';
        out += '  ';
        i++;
      } else {
        if (c === "'" || c === '"' || c === '`') state = c;
        out += c;
      }
    } else if (state === 'line') {
      if (c === '\n') {
        state = 'code';
        out += c;
      } else out += ' ';
    } else if (state === 'block') {
      if (c === '*' && d === '/') {
        state = 'code';
        out += '  ';
        i++;
      } else out += c === '\n' ? c : ' ';
    } else {
      if (c === '\\') {
        out += c + (d ?? '');
        i++;
        continue;
      }
      if (c === state || (c === '\n' && state !== '`')) state = 'code';
      out += c;
    }
  }
  return out;
}

/** Every import specifier: `from '...'`, side-effect `import '...'`, `require('...')` and `import('...')`. */
function specifiers(code: string): string[] {
  const found: string[] = [];
  const res = [
    /\bfrom\s*['"]([^'"]+)['"]/g,
    /\bimport\s*['"]([^'"]+)['"]/g,
    /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];
  for (const re of res) for (const m of code.matchAll(re)) found.push(m[1]);
  return found;
}

function subdirs(dir: string): string[] {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name !== 'node_modules')
    .map((e) => e.name)
    .sort();
}

/** Production TypeScript under `dir`, recursively: *.ts that is not *.spec.ts. */
function productionFiles(dir: string): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) {
        if (e.name !== 'node_modules' && e.name !== 'dist') walk(p);
      } else if (e.name.endsWith('.ts') && !e.name.endsWith('.spec.ts') && !e.name.endsWith('.d.ts')) out.push(p);
    }
  };
  walk(dir);
  return out.sort();
}

/** Which of `libs` a specifier names: `@app/<lib>` or `@app/<lib>/...`. */
function libOf(specifier: string, libs: readonly string[]): string | null {
  if (!specifier.startsWith('@app/')) return null;
  const name = specifier.slice('@app/'.length).split('/')[0];
  return libs.includes(name) ? name : null;
}

/** { lib: [apps that import it in production code] } for every lib directory, sorted both ways. */
function computeConsumers(): Record<string, string[]> {
  const libs = subdirs(LIBS_DIR);
  const apps = subdirs(APPS_DIR).filter((app) => fs.existsSync(path.join(APPS_DIR, app, 'src')));
  const consumers: Record<string, Set<string>> = Object.fromEntries(libs.map((lib) => [lib, new Set<string>()]));
  for (const app of apps) {
    for (const file of productionFiles(path.join(APPS_DIR, app, 'src'))) {
      const code = stripComments(fs.readFileSync(file, 'utf8'));
      for (const specifier of specifiers(code)) {
        const lib = libOf(specifier, libs);
        if (lib) consumers[lib].add(app);
      }
    }
  }
  return Object.fromEntries(libs.map((lib) => [lib, [...consumers[lib]].sort()]));
}

describe('tools/ci/lib-consumers.json', () => {
  const committed: { comment?: string; libs: Record<string, string[]> } = JSON.parse(fs.readFileSync(CONSUMERS_FILE, 'utf8'));
  const actual = computeConsumers();

  it('has one entry per directory under libs/, in order', () => {
    expect(Object.keys(committed.libs)).toEqual(subdirs(LIBS_DIR));
  });

  it('lists exactly the apps whose production sources import each lib (the diff is the JSON to paste)', () => {
    expect(JSON.stringify(committed.libs, null, 2)).toBe(JSON.stringify(actual, null, 2));
  });

  it('names only apps that exist, each once and sorted', () => {
    const apps = subdirs(APPS_DIR);
    for (const [lib, users] of Object.entries(committed.libs)) {
      expect({ lib, users }).toEqual({ lib, users: [...new Set(users)].sort() });
      for (const app of users) expect({ lib, app, exists: apps.includes(app) }).toEqual({ lib, app, exists: true });
    }
  });

  it('keeps the box out of the live-only libs and the dead queues out of everything', () => {
    // R2 for the one app that runs on the venue box (apps/rt-edge/src/boundary.spec.ts says the same at file level).
    expect(actual.global).not.toContain('rt-edge');
    expect(actual['platform-cloud']).not.toContain('rt-edge');
    // The live apps still own the live kernel; the edge libs are shared by the cloud realtime server and the box.
    expect(actual.global).toEqual(expect.arrayContaining(['authapi', 'coreapi', 'realtime-server']));
    for (const lib of ['edge-sync', 'feed-parse', 'rt-ingest']) expect({ lib, users: actual[lib] }).toEqual({ lib, users: ['realtime-server', 'rt-edge'] });
    expect(actual['edge-token']).toEqual(['authapi', 'realtime-server', 'rt-edge']);
    for (const lib of ['alpha-queue', 'mipl-queue']) expect({ lib, users: actual[lib] }).toEqual({ lib, users: [] });
  });

  it('the scanner ignores commented-out imports and spec files, and sees every import form', () => {
    const code = stripComments([
      "// import { AlphaQueueService } from '@app/alpha-queue';",
      "/* import x from '@app/mipl-queue' */",
      "import { DbService } from '@app/global/db/pg/db.service';",
      "export * from '@app/edge-token';",
      "import '@app/feed-parse/side-effect';",
      "const lazy = import('@app/rt-ingest');",
      "const cjs = require('@app/edge-sync');",
      "const text = 'from @app/permissions';",
    ].join('\n'));
    const libs = subdirs(LIBS_DIR);
    const seen = specifiers(code).map((s) => libOf(s, libs)).filter((l): l is string => l !== null).sort();
    expect(seen).toEqual(['edge-sync', 'edge-token', 'feed-parse', 'global', 'rt-ingest']);
    expect(productionFiles(path.join(APPS_DIR, 'rt-edge', 'src')).some((f) => f.endsWith('.spec.ts'))).toBe(false);
    expect(productionFiles(path.join(APPS_DIR, 'rt-edge', 'src')).some((f) => f.endsWith(path.join('rt-edge', 'src', 'main.ts')))).toBe(true);
  });
});
