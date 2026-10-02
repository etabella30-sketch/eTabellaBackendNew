/**
 * Purity guard for libs/edge-sync (same idea as tools/ci/feed-parse-gate.js for
 * libs/feed-parse). The library runs inside the parser lane on the box and in
 * the cloud's queue task, so it must stay pure:
 *  - sources import only each other (relative) and node:crypto;
 *    no fs, net, socket.io, ioredis, pg, @app/global, apps/ or anything else;
 *  - no require(), no dynamic import(), no process.*, no clock (Date.now,
 *    new Date), no timers, no unseeded randomness (Math.random);
 *  - specs never import from apps/, except the two *.legacy-parity specs that
 *    compare against today's realtime-server code.
 * Comments are stripped before matching; string literals are kept, so import
 * specifiers are always seen.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

const SRC = __dirname;
const files = fs.readdirSync(SRC).filter(f => f.endsWith('.ts')).sort();
const sources = files.filter(f => !f.endsWith('.spec.ts'));
const specs = files.filter(f => f.endsWith('.spec.ts'));
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

function specifiers(code: string): string[] {
  const found: string[] = [];
  for (const re of [/\bfrom\s+['"]([^'"]+)['"]/g, /\bimport\s+['"]([^'"]+)['"]/g]) {
    for (const m of code.matchAll(re)) found.push(m[1]);
  }
  return found;
}

describe('libs/edge-sync purity', () => {
  it('has the modules the spec lists (§3.2)', () => {
    expect(sources).toEqual(
      ['broadcast-plan.ts', 'canonical.ts', 'cutter.ts', 'digest.ts', 'fingerprint.ts', 'index.ts', 'protocol.ts', 'round.ts', 'snapshot.ts'].sort(),
    );
  });

  it.each(sources)('%s imports only sibling modules and node:crypto', file => {
    const bad = specifiers(read(file)).filter(s => !s.startsWith('./') && s !== 'node:crypto');
    expect(bad).toEqual([]);
  });

  it.each(sources)('%s has no banned module, I/O, clock, timer or randomness', file => {
    const code = read(file);
    const banned: Array<[string, RegExp]> = [
      ['fs', /['"](node:)?fs(\/promises)?['"]/],
      ['net', /['"](node:)?(net|tls|http|https|dgram|child_process|worker_threads)['"]/],
      ['socket.io', /socket\.io/],
      ['ioredis', /ioredis/],
      ['pg', /['"]pg['"]/],
      ['@app/global', /@app\/global/],
      ['apps/', /['"][^'"]*apps\//],
      ['require()', /\brequire\s*\(/],
      ['dynamic import()', /\bimport\s*\(/],
      ['process', /\bprocess\s*\./],
      ['Date.now', /\bDate\.now\b/],
      ['new Date', /\bnew\s+Date\b/],
      ['timers', /\b(setTimeout|setInterval|setImmediate)\s*\(/],
      ['Math.random', /\bMath\.random\b/],
      ['eval', /\beval\s*\(/],
    ];
    const hits = banned.filter(([, re]) => re.test(code)).map(([name]) => name);
    expect(hits).toEqual([]);
  });

  it('only the legacy-parity specs reach into apps/', () => {
    const offenders = specs.filter(f => !f.endsWith('.legacy-parity.spec.ts') && specifiers(read(f)).some(s => /(^|\/)apps\//.test(s)));
    expect(offenders).toEqual([]);
    const parity = specs.filter(f => f.endsWith('.legacy-parity.spec.ts'));
    expect(parity).toEqual(['canonical.legacy-parity.spec.ts', 'snapshot.legacy-parity.spec.ts']);
  });

  it('index.ts re-exports every module', () => {
    const exported = specifiers(read('index.ts')).sort();
    expect(exported).toEqual(sources.filter(f => f !== 'index.ts').map(f => './' + f.replace(/\.ts$/, '')).sort());
  });

  it('the guard itself catches what it bans', () => {
    const sample = stripComments(`// import x from 'fs'\nimport * as n from 'net';\nconst t = Date.now(); /* new Date() */\n`);
    expect(specifiers(sample)).toEqual(['net']);
    expect(/\bDate\.now\b/.test(sample)).toBe(true);
    expect(/\bnew\s+Date\b/.test(sample)).toBe(false);
  });
});
