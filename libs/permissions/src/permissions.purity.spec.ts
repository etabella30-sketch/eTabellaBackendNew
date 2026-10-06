/**
 * Purity and boundary guard for libs/permissions (gate G1, invariants R2 and R3 of the shared-libraries plan; same
 * machinery as libs/edge-token/src/edge-token.purity.spec.ts). The library runs in authapi, coreapi, realtime-server
 * and on the venue box, whose bundle must never pull a database, Redis, Kafka or config client:
 *  - sources import only each other (relative), @app/api-kernel and the box-safe packages (@nestjs/common,
 *    @nestjs/core, class-validator, class-transformer, rxjs, reflect-metadata); express only as `import type`;
 *  - never @app/global, @app/platform-cloud, pg, ioredis, kafkajs, @nestjs/config, @nestjs/microservices,
 *    @nestjs/swagger, jsonwebtoken, fs, net or apps/ (R2);
 *  - no require(), dynamic import(), process.*, ConfigService, consumer.apply, APP_PIPE / APP_FILTER / APP_GUARD (R3),
 *    no clock, timers, Math.random or console: a rule is a pure function of its inputs;
 *  - jest globals only in the contract template (team-scope.contract.ts), which index.ts does not re-export;
 *  - specs never import from apps/.
 * Comments are stripped before matching; string literals are kept, so import specifiers are always seen.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

const SRC = __dirname;
const files = fs.readdirSync(SRC).filter(f => f.endsWith('.ts')).sort();
const sources = files.filter(f => !f.endsWith('.spec.ts'));
const specs = files.filter(f => f.endsWith('.spec.ts'));
const read = (f: string) => stripComments(fs.readFileSync(path.join(SRC, f), 'utf8'));

/** Test templates: sources that register jest blocks for hosts to run; reached by path, never from index.ts. */
const TEST_TEMPLATES = ['team-scope.contract.ts'];

/** R2: what a box-safe lib may import, besides its own modules. */
const ALLOWED_PACKAGES = ['@nestjs/common', '@nestjs/core', 'class-validator', 'class-transformer', 'rxjs', 'reflect-metadata'];
const ALLOWED_LIBS = ['@app/api-kernel'];
const TYPE_ONLY_PACKAGES = ['express'];

/** A jest global called as a bare identifier (not a method such as `UUID_RE.test(...)`). */
const JEST_GLOBAL_CALL = /(?<![.\w$])(describe|it|test|expect|beforeAll|beforeEach|afterAll|afterEach)\s*\(/;

function allowed(spec: string): boolean {
  if (spec.startsWith('./')) return true;
  if (ALLOWED_PACKAGES.includes(spec) || spec.startsWith('rxjs/')) return true;
  if (TYPE_ONLY_PACKAGES.includes(spec)) return true;
  return ALLOWED_LIBS.some(lib => spec === lib || spec.startsWith(`${lib}/`));
}

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

/** Import statements that are not `import type`, with their specifier. */
function valueImports(code: string): string[] {
  const found: string[] = [];
  for (const m of code.matchAll(/\bimport\s+(type\s+)?[^;'"]*?\bfrom\s+['"]([^'"]+)['"]/g)) {
    if (!m[1]) found.push(m[2]);
  }
  return found;
}

describe('libs/permissions purity', () => {
  it('has the expected modules', () => {
    expect(sources).toEqual(['case-admin.ts', 'case-membership.ts', 'doclink.ts', 'fact-audience.ts', 'fact-create.ts', 'fact-visibility.ts', 'index.ts', 'mark-audience.ts', 'quick-mark.ts', 'team-scope.contract.ts', 'team-scope.ts'].sort());
  });

  it.each(sources)('%s imports only sibling modules, @app/api-kernel and the box-safe packages (R2)', file => {
    const bad = specifiers(read(file)).filter(s => !allowed(s));
    expect(bad).toEqual([]);
  });

  it.each(sources)('%s imports express, if at all, as types only', file => {
    const bad = valueImports(read(file)).filter(s => TYPE_ONLY_PACKAGES.includes(s));
    expect(bad).toEqual([]);
  });

  it.each(sources)('%s has no live infrastructure, I/O, side effects, clock, timer or randomness (R2, R3)', file => {
    const code = read(file);
    const banned: Array<[string, RegExp]> = [
      ['@app/global', /['"]@app\/global/],
      ['@app/platform-cloud', /['"]@app\/platform-cloud/],
      ['@nestjs/config', /@nestjs\/config/],
      ['@nestjs/microservices', /@nestjs\/microservices/],
      ['@nestjs/swagger', /@nestjs\/swagger/],
      ['jsonwebtoken', /jsonwebtoken/],
      ['kafkajs', /kafkajs/],
      ['ioredis', /ioredis/],
      ['pg', /['"]pg['"]/],
      ['fs', /['"](node:)?fs(\/promises)?['"]/],
      ['net', /['"](node:)?(net|tls|http|https|dgram|child_process|worker_threads)['"]/],
      ['socket.io', /socket\.io/],
      ['apps/', /['"][^'"]*apps\//],
      ['require()', /\brequire\s*\(/],
      ['dynamic import()', /\bimport\s*\(/],
      ['process', /\bprocess\s*\./],
      ['ConfigService', /\bConfigService\b/],
      ['consumer.apply', /\bconsumer\s*\.\s*apply\b/],
      ['APP_PIPE/FILTER/GUARD', /\bAPP_(PIPE|FILTER|GUARD|INTERCEPTOR)\b/],
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

  it.each(sources.filter(f => !TEST_TEMPLATES.includes(f)))('%s uses no jest globals (only a test template may)', file => {
    // Bare calls only: `re.test(x)` and `obj.expect(...)` are methods, not the globals.
    expect(read(file)).not.toMatch(JEST_GLOBAL_CALL);
  });

  it('no spec reaches into apps/', () => {
    const offenders = specs.filter(f => specifiers(read(f)).some(s => /(^|\/)apps\//.test(s)));
    expect(offenders).toEqual([]);
  });

  it('index.ts re-exports every module except the test templates', () => {
    const exported = specifiers(read('index.ts')).sort();
    const expected = sources
      .filter(f => f !== 'index.ts' && !TEST_TEMPLATES.includes(f))
      .map(f => './' + f.replace(/\.ts$/, ''))
      .sort();
    expect(exported).toEqual(expected);
  });

  it('the guard itself catches what it bans', () => {
    const sample = stripComments(`// import x from 'fs'\nimport * as n from 'net';\nimport type { Response } from 'express';\nimport { Request } from 'express';\nconst t = Date.now(); /* new Date() */\n`);
    expect(specifiers(sample)).toEqual(['net', 'express', 'express']);
    expect(valueImports(sample)).toEqual(['net', 'express']);
    expect(/\bDate\.now\b/.test(sample)).toBe(true);
    expect(/\bnew\s+Date\b/.test(sample)).toBe(false);
    expect(allowed('@app/global/db/pg/db.service')).toBe(false);
    expect(allowed('@app/api-kernel/errors')).toBe(true);
    expect(JEST_GLOBAL_CALL.test('const ok = UUID_RE.test(value);')).toBe(false);
    expect(JEST_GLOBAL_CALL.test('  it("lists", () => {})')).toBe(true);
    expect(JEST_GLOBAL_CALL.test('describe(`x`, () => {})')).toBe(true);
  });
});
