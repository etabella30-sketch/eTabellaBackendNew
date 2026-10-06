/**
 * Purity guard for libs/api-contracts (cloned from libs/edge-token/src/edge-token.purity.spec.ts). The library is
 * pure data read by every live app, the venue box bundle and the FE JSON export, so it must stay free of framework
 * and I/O (plan R1, R2):
 *  - sources import only each other (relative, inside src/) and, type-only, @app/api-kernel; no Nest,
 *    class-validator, fs, net, ioredis, pg, socket.io, @app/global or apps/;
 *  - no require(), no dynamic import(), no process.*, no clock (Date.now, new Date), no timers, no Math.random,
 *    no console;
 *  - specs never import from apps/, except error-codes.spec.ts, which compares the error tables with the box
 *    contract (apps/rt-edge/src/contracts cannot import a lib, so the parity runs from this side);
 *  - index.ts re-exports every module, including those in sub-folders, so `@app/api-contracts` is the whole lib.
 * Comments are stripped before matching; string literals are kept, so import specifiers are always seen.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

const SRC = __dirname;

/** Every .ts file under src/, as a posix path relative to src/ (`responses/team-users.ts`), sorted. */
function walk(dir: string, prefix: string = ''): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix + entry.name;
    if (entry.isDirectory()) out.push(...walk(path.join(dir, entry.name), rel + '/'));
    else if (entry.name.endsWith('.ts')) out.push(rel);
  }
  return out.sort();
}

const files = walk(SRC);
const sources = files.filter((f) => !f.endsWith('.spec.ts'));
const specs = files.filter((f) => f.endsWith('.spec.ts'));
const read = (f: string) => stripComments(fs.readFileSync(path.join(SRC, f), 'utf8'));

/** Blank out // and block comments, keeping newlines and string literals. */
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

interface ImportRef {
  readonly spec: string;
  /** `import type … from` / `export type … from`: erased by tsc, so it never reaches a bundle. */
  readonly typeOnly: boolean;
}

/** Every module specifier of `import … from`, `export … from` and bare `import '…'`, with its type-only flag. */
function imports(code: string): ImportRef[] {
  const found: ImportRef[] = [];
  for (const m of code.matchAll(/\b(?:import|export)\s+(type\s+)?[^'";]*?\bfrom\s+['"]([^'"]+)['"]/g)) {
    found.push({ spec: m[2], typeOnly: m[1] !== undefined });
  }
  for (const m of code.matchAll(/\bimport\s+['"]([^'"]+)['"]/g)) found.push({ spec: m[1], typeOnly: false });
  return found;
}

const specifiers = (code: string): string[] => imports(code).map((i) => i.spec);

/** A relative specifier that resolves inside src/. */
function isSibling(file: string, spec: string): boolean {
  if (!spec.startsWith('./') && !spec.startsWith('../')) return false;
  const resolved = path.resolve(path.dirname(path.join(SRC, file)), spec);
  return resolved.startsWith(SRC + path.sep) || resolved === SRC;
}

/** Specs that may reach into apps/ (parity with code that cannot import the lib). */
const APPS_PARITY_SPECS: readonly string[] = ['error-codes.spec.ts'];

/** Specs that may load @app/api-kernel at runtime (they compare its tables with this lib's). */
const KERNEL_PARITY_SPECS: readonly string[] = ['error-codes.kernel-parity.spec.ts'];

describe('libs/api-contracts purity', () => {
  it('has the expected modules', () => {
    expect(sources).toEqual(
      ['error-codes.ts', 'index.ts', 'responses/team-users.ts', 'route-manifest.invariants.ts', 'route-manifest.ts', 'route-manifest.types.ts'].sort(),
    );
  });

  it.each(sources)('%s imports only sibling modules and, type-only, @app/api-kernel', (file) => {
    const bad = imports(read(file))
      .filter((i) => !isSibling(file, i.spec) && !(i.typeOnly && /^@app\/api-kernel(\/|$)/.test(i.spec)))
      .map((i) => i.spec);
    expect(bad).toEqual([]);
  });

  it.each(sources)('%s has no framework, validation, I/O, clock, timer or unseeded randomness', (file) => {
    const code = read(file);
    const banned: Array<[string, RegExp]> = [
      ['@nestjs', /@nestjs\//],
      ['class-validator', /['"]class-(validator|transformer)['"]/],
      ['fs', /['"](node:)?fs(\/promises)?['"]/],
      ['net', /['"](node:)?(net|tls|http|https|dgram|child_process|worker_threads)['"]/],
      ['socket.io', /socket\.io/],
      ['ioredis', /ioredis/],
      ['pg', /['"]pg['"]/],
      ['@app/global', /['"]@app\/(global|platform-cloud)/],
      ['apps/', /['"][^'"]*apps\//],
      ['require()', /\brequire\s*\(/],
      ['dynamic import()', /\bimport\s*\(/],
      ['process', /\bprocess\s*\./],
      ['Date.now', /\bDate\.now\b/],
      ['new Date', /\bnew\s+Date\b/],
      ['timers', /\b(setTimeout|setInterval|setImmediate)\s*\(/],
      ['Math.random', /\bMath\.random\b/],
      ['eval', /\beval\s*\(/],
      ['console', /\bconsole\s*\./],
    ];
    const hits = banned.filter(([, re]) => re.test(code)).map(([name]) => name);
    expect(hits).toEqual([]);
  });

  it('only the box-contract parity spec reaches into apps/', () => {
    const offenders = specs.filter((f) => !APPS_PARITY_SPECS.includes(f) && specifiers(read(f)).some((s) => /(^|\/)apps\//.test(s)));
    expect(offenders).toEqual([]);
  });

  it('specs import no @app/* lib but the kernel, and only the kernel-parity spec at runtime', () => {
    const offenders = specs.flatMap((f) => imports(read(f))
      .filter((i) => i.spec.startsWith('@app/') && !(/^@app\/api-kernel(\/|$)/.test(i.spec) && (i.typeOnly || KERNEL_PARITY_SPECS.includes(f))))
      .map((i) => `${f}: ${i.spec}`));
    expect(offenders).toEqual([]);
  });

  it('index.ts re-exports every module', () => {
    const exported = specifiers(read('index.ts')).sort();
    expect(exported).toEqual(sources.filter((f) => f !== 'index.ts').map((f) => './' + f.replace(/\.ts$/, '')).sort());
  });

  it('the guard itself catches what it bans', () => {
    const sample = stripComments(`// import x from 'fs'\nimport * as n from 'net';\nimport type { K } from '@app/api-kernel';\nexport * from './x';\nconst t = Date.now(); /* new Date() */\n`);
    expect(imports(sample)).toEqual([
      { spec: 'net', typeOnly: false },
      { spec: '@app/api-kernel', typeOnly: true },
      { spec: './x', typeOnly: false },
    ]);
    expect(/\bDate\.now\b/.test(sample)).toBe(true);
    expect(/\bnew\s+Date\b/.test(sample)).toBe(false);
    expect(isSibling('responses/team-users.ts', '../error-codes')).toBe(true);
    expect(isSibling('index.ts', '../../edge-token/src')).toBe(false);
  });
});
