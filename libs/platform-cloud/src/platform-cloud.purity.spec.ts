/**
 * Boundary guard for libs/platform-cloud (gate G1, invariants R1, R2 and R3 of the shared-libraries plan; same
 * machinery as libs/permissions/src/permissions.purity.spec.ts). This is the ONE lib that may touch the live
 * infrastructure, and it never runs on the venue box, so the rules are the mirror image of the box-safe libs':
 *  - sources import only each other, @app/global, @app/api-kernel, @app/permissions, @nestjs/*, pg, ioredis, kafkajs
 *    and rxjs; express only as `import type`;
 *  - never apps/ (R1: libs do not import apps), never another lib (@app/edge-token, edge-sync, rt-ingest, feed-parse,
 *    rt-features, api-contracts): the adapters bind ports, they hold no feature code;
 *  - no process.env, no ConfigService, no consumer.apply, no APP_PIPE / APP_FILTER / APP_GUARD (R3: the host's
 *    configuration and app-wide registrations stay the host's), no require(), dynamic import(), eval or console;
 *  - specs never import from apps/ either (they may use @app/global for the host service tokens).
 * Comments are stripped before matching; string literals are kept, so import specifiers are always seen.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

const SRC = __dirname;
const files = fs.readdirSync(SRC).filter(f => f.endsWith('.ts')).sort();
const sources = files.filter(f => !f.endsWith('.spec.ts'));
const specs = files.filter(f => f.endsWith('.spec.ts'));
const read = (f: string) => stripComments(fs.readFileSync(path.join(SRC, f), 'utf8'));

/** What a live-only source may import besides its own modules. */
const ALLOWED_PACKAGES = ['pg', 'ioredis', 'kafkajs', 'rxjs', 'reflect-metadata'];
const ALLOWED_PACKAGE_PREFIXES = ['@nestjs/', 'rxjs/'];
const ALLOWED_LIBS = ['@app/global', '@app/api-kernel', '@app/permissions'];
const TYPE_ONLY_PACKAGES = ['express'];

function allowed(spec: string): boolean {
  if (spec.startsWith('./')) return true;
  if (ALLOWED_PACKAGES.includes(spec) || TYPE_ONLY_PACKAGES.includes(spec)) return true;
  if (ALLOWED_PACKAGE_PREFIXES.some(prefix => spec.startsWith(prefix))) return true;
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

describe('libs/platform-cloud boundaries', () => {
  it('has the expected modules', () => {
    expect(sources).toEqual(
      ['cloud-platform.module.ts', 'event-delivery.ts', 'host-services.ts', 'index.ts', 'legacy-envelope.ts', 'pg-case-access.ts',
        'pg-row-query.ts', 'pg-sp-executor.ts', 'stamped-caller.resolver.ts'].sort(),
    );
  });

  it.each(sources)('%s imports only sibling modules, @app/global, @app/api-kernel, @app/permissions and the live packages', file => {
    const bad = specifiers(read(file)).filter(s => !allowed(s));
    expect(bad).toEqual([]);
  });

  it.each(sources)('%s imports express, if at all, as types only', file => {
    const bad = valueImports(read(file)).filter(s => TYPE_ONLY_PACKAGES.includes(s));
    expect(bad).toEqual([]);
  });

  it.each(sources)('%s reads no configuration, registers nothing app-wide and reaches into no app (R1, R3)', file => {
    const code = read(file);
    const banned: Array<[string, RegExp]> = [
      ['apps/', /['"][^'"]*apps\//],
      ['other libs', /['"]@app\/(edge-token|edge-sync|rt-ingest|feed-parse|rt-features|api-contracts|alpha-queue|mipl-queue)/],
      ['@app/platform-cloud (self)', /['"]@app\/platform-cloud/],
      ['require()', /\brequire\s*\(/],
      ['dynamic import()', /\bimport\s*\(/],
      ['process', /\bprocess\s*\./],
      ['ConfigService', /\bConfigService\b/],
      ['consumer.apply', /\bconsumer\s*\.\s*apply\b/],
      ['APP_PIPE/FILTER/GUARD', /\bAPP_(PIPE|FILTER|GUARD|INTERCEPTOR)\b/],
      ['eval', /\beval\s*\(/],
      ['console', /\bconsole\s*\./],
    ];
    const hits = banned.filter(([, re]) => re.test(code)).map(([name]) => name);
    expect(hits).toEqual([]);
  });

  it('no spec reaches into apps/ (this guard names the path only in its own sample)', () => {
    const self = path.basename(__filename);
    const offenders = specs.filter(f => f !== self && specifiers(read(f)).some(s => /(^|\/)apps\//.test(s)));
    expect(offenders).toEqual([]);
  });

  it('index.ts re-exports every module', () => {
    const exported = specifiers(read('index.ts')).sort();
    expect(exported).toEqual(sources.filter(f => f !== 'index.ts').map(f => './' + f.replace(/\.ts$/, '')).sort());
  });

  it('the guard itself catches what it bans', () => {
    const sample = stripComments(`// import x from 'apps/x'\nimport { a } from 'apps/coreapi/src/x';\nimport type { Response } from 'express';\nimport { Request } from 'express';\nconst t = process.env.X; /* ConfigService */\n`);
    expect(specifiers(sample)).toEqual(['apps/coreapi/src/x', 'express', 'express']);
    expect(valueImports(sample)).toEqual(['apps/coreapi/src/x', 'express']);
    expect(/\bprocess\s*\./.test(sample)).toBe(true);
    expect(/\bConfigService\b/.test(sample)).toBe(false);
    expect(allowed('@app/global/db/pg/db.service')).toBe(true);
    expect(allowed('@nestjs/microservices')).toBe(true);
    expect(allowed('@app/edge-token')).toBe(false);
    expect(allowed('@app/rt-features/team-users')).toBe(false);
    expect(allowed('apps/coreapi/src/x')).toBe(false);
    expect(allowed('fs')).toBe(false);
  });
});
