/**
 * Purity guard for libs/api-kernel (cloned from libs/edge-token/src/edge-token.purity.spec.ts). The library is loaded
 * by authapi, coreapi, realtime-server AND the venue box, whose bundle has no pg, Redis, Kafka, config, swagger or
 * jsonwebtoken package (plan invariant R2), and whose boot must never depend on a shared module's side effects (R3):
 *  - sources import only each other (relative), @nestjs/common, @nestjs/core, class-validator, class-transformer,
 *    rxjs, reflect-metadata and express TYPES (`import type` only: express itself is the host's);
 *  - no @app/* (api-kernel is the bottom of the lib graph), no apps/, no fs, net, sockets, ioredis, pg, kafkajs,
 *    @nestjs/config, @nestjs/microservices, @nestjs/swagger, jsonwebtoken;
 *  - no require(), no dynamic import(), no process.*, no ConfigService, no console, no APP_PIPE / APP_FILTER /
 *    APP_GUARD, no consumer.apply (shared modules never register anything app-wide);
 *  - specs never import from apps/ or @app/global, except the two move specs, which compare the moved IsItUUID and
 *    HttpErrorFilter with the libs/global paths that now re-export them.
 * Comments are stripped before matching; string literals are kept, so import specifiers are always seen.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

const SRC = __dirname;
const files = fs.readdirSync(SRC).filter(f => f.endsWith('.ts')).sort();
const sources = files.filter(f => !f.endsWith('.spec.ts'));
const specs = files.filter(f => f.endsWith('.spec.ts'));
const read = (f: string) => stripComments(fs.readFileSync(path.join(SRC, f), 'utf8'));

/** R2: what a box-safe source may import besides its siblings. */
const ALLOWED_PACKAGES = ['@nestjs/common', '@nestjs/core', 'class-validator', 'class-transformer', 'rxjs', 'reflect-metadata', 'express'];

/** The two specs that may reach the legacy libs/global paths, and the one path each may touch. */
const MOVE_SPECS: Readonly<Record<string, string>> = {
  'is-it-uuid.spec.ts': '@app/global/decorator/is-uuid-nullable.decorator',
  'http-error.filter.spec.ts': '@app/global/middleware/exception',
};

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

/** Every `import ... from 'express'` that is not an `import type`. */
function expressValueImports(code: string): string[] {
  return [...code.matchAll(/\bimport\s+(?!type\b)[^;]*?\bfrom\s+['"]express['"]/g)].map(m => m[0].replace(/\s+/g, ' '));
}

describe('libs/api-kernel purity', () => {
  it('has the expected modules', () => {
    expect(sources).toEqual(
      ['actor-fields.ts', 'caller.guard.ts', 'caller.ts', 'case-access.guard.ts', 'case-access.ts', 'domain-error.filter.ts', 'errors.ts',
        'events.ts', 'http-error.filter.ts', 'index.ts', 'is-it-uuid.ts', 'mark-write.ts', 'route-id.ts', 'storage.ts'].sort(),
    );
  });

  it.each(sources)('%s imports only sibling modules and the R2 packages', file => {
    const bad = specifiers(read(file)).filter(s => !s.startsWith('./') && !ALLOWED_PACKAGES.includes(s));
    expect(bad).toEqual([]);
  });

  it.each(sources)('%s imports express as types only', file => {
    expect(expressValueImports(read(file))).toEqual([]);
  });

  it.each(sources)('%s has no live infrastructure, I/O, config, module side effects or console', file => {
    const code = read(file);
    const banned: Array<[string, RegExp]> = [
      ['@nestjs/config|microservices|swagger|platform-*|websockets', /@nestjs\/(config|microservices|swagger|platform-[a-z-]+|websockets)/],
      ['@app/', /['"]@app\//],
      ['apps/', /['"][^'"]*apps\//],
      ['fs', /['"](node:)?fs(\/promises)?['"]/],
      ['net', /['"](node:)?(net|tls|http|https|dgram|child_process|worker_threads)['"]/],
      ['socket.io', /socket\.io/],
      ['ioredis', /ioredis/],
      ['pg', /['"]pg['"]/],
      ['kafkajs', /kafkajs/],
      ['jsonwebtoken', /jsonwebtoken/],
      ['require()', /\brequire\s*\(/],
      ['dynamic import()', /\bimport\s*\(/],
      ['process', /\bprocess\s*\./],
      ['ConfigService', /\bConfigService\b/],
      ['APP_PIPE/APP_FILTER/APP_GUARD', /\bAPP_(PIPE|FILTER|GUARD|INTERCEPTOR)\b/],
      ['consumer.apply', /\.apply\s*\(\s*[A-Z]/],
      ['eval', /\beval\s*\(/],
      ['console', /\bconsole\s*\./],
    ];
    const hits = banned.filter(([, re]) => re.test(code)).map(([name]) => name);
    expect(hits).toEqual([]);
  });

  it('specs reach into neither apps/ nor @app/global, except the two move specs on their one legacy path', () => {
    const offenders = specs.filter(f => {
      const allowed = MOVE_SPECS[f];
      return specifiers(read(f)).some(s => (/(^|\/)apps\//.test(s) || s.startsWith('@app/')) && s !== allowed);
    });
    expect(offenders).toEqual([]);
  });

  it('index.ts re-exports every module', () => {
    const exported = specifiers(read('index.ts')).sort();
    expect(exported).toEqual(sources.filter(f => f !== 'index.ts').map(f => './' + f.replace(/\.ts$/, '')).sort());
  });

  it('the guard itself catches what it bans', () => {
    const sample = stripComments(`// import x from 'fs'\nimport * as n from 'net';\nconst t = process.env.X; /* ConfigService */\n`);
    expect(specifiers(sample)).toEqual(['net']);
    expect(/\bprocess\s*\./.test(sample)).toBe(true);
    expect(/\bConfigService\b/.test(sample)).toBe(false);
    expect(expressValueImports(`import type { Response } from 'express';\nimport { Request,\n Response } from 'express';`)).toEqual([
      "import { Request, Response } from 'express'",
    ]);
    expect(expressValueImports(`import type {\n Request, Response } from 'express';`)).toEqual([]);
  });
});
