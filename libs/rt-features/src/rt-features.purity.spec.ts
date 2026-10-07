/**
 * Purity and layout guard for libs/rt-features (plan R2, R3; cloned from libs/edge-token/src/edge-token.purity.spec.ts).
 * Every feature folder here is loaded by authapi, coreapi, realtime-server AND the venue box, whose bundle has no
 * pg, ioredis, kafkajs, @nestjs/config, @nestjs/microservices, @nestjs/swagger or jsonwebtoken, and whose recording
 * kernel must boot even when a shared module is unbound:
 *  - R2: sources import only sibling modules (relative, inside src/), @nestjs/common, @nestjs/core, class-validator,
 *    class-transformer, rxjs, reflect-metadata, the box-safe libs (@app/api-kernel, @app/api-contracts,
 *    @app/permissions) and express TYPES (`import type`); never @app/global, @app/platform-cloud, apps/ or any other
 *    package;
 *  - R3: no side effects: no consumer.apply / NestModule, no APP_PIPE / APP_FILTER / APP_GUARD / APP_INTERCEPTOR,
 *    no @Global(), no lifecycle hooks, no schedulers / queues / gateways / microservice handlers, no timers,
 *    no process.*, no ConfigService, no require(), no dynamic import(), no console;
 *  - layout: src/ holds index.ts and one folder per feature in FEATURES, each with FEATURE_LAYOUT (plan §3.2);
 *  - specs never import apps/ or the live-only libs.
 * Adding a feature = one entry in FEATURES. Comments are stripped before matching; string literals are kept, so
 * import specifiers are always seen.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

const SRC = __dirname;

/** The feature folders under src/, one entry each (plan §3.2 order). Phase 5 added 'team-users', Phase 6 'transcript-shape', Phase 7a 'factsheet', Phase 8 'marknav' and 'doclink', Phase 9 'issues', Phase 10 'code-tables', 'comments' and 'documents'. */
const FEATURES: readonly string[] = ['team-users', 'transcript-shape', 'factsheet', 'marknav', 'doclink', 'issues', 'code-tables', 'comments', 'documents'];

/** What every feature folder holds; `<f>` is the folder name. Paths ending in `/` are folders. */
const FEATURE_LAYOUT: readonly string[] = ['index.ts', 'testing/conformance.ts'];
/**
 * What a feature that serves HTTP routes holds on top (plan §3.2): the moment one of these exists, all of them must.
 * A pure feature (code both hosts execute, such as transcript-shape) has none of them.
 */
const HTTP_FEATURE_LAYOUT: readonly string[] = ['dto/', '<f>.operations.ts', '<f>.service.ts', 'http/'];

/** R2: packages a source may import at runtime (subpaths such as `rxjs/operators` included). */
const BOX_SAFE_PACKAGES: readonly string[] = ['@nestjs/common', '@nestjs/core', 'class-validator', 'class-transformer', 'rxjs', 'reflect-metadata'];
const BOX_SAFE_LIBS: readonly string[] = ['@app/api-kernel', '@app/api-contracts', '@app/permissions'];
/** Packages a source may import as types only (erased by tsc; the host provides the runtime). */
const TYPE_ONLY_PACKAGES: readonly string[] = ['express'];
/** What a spec may import on top of that (test tooling that never ships). */
const SPEC_ONLY_PACKAGES: readonly string[] = ['@nestjs/testing', 'supertest', 'node:fs', 'node:path'];

/** Every .ts file under src/, as a posix path relative to src/, sorted. */
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

/** `rxjs/operators` → `rxjs`, `@nestjs/common/interfaces` → `@nestjs/common`. */
function packageOf(spec: string): string {
  const parts = spec.split('/');
  return spec.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

/** A relative specifier that resolves inside src/. */
function isSibling(file: string, spec: string): boolean {
  if (!spec.startsWith('./') && !spec.startsWith('../')) return false;
  const resolved = path.resolve(path.dirname(path.join(SRC, file)), spec);
  return resolved.startsWith(SRC + path.sep) || resolved === SRC;
}

function allowedInSource(file: string, ref: ImportRef): boolean {
  if (isSibling(file, ref.spec)) return true;
  const pkg = packageOf(ref.spec);
  if (BOX_SAFE_PACKAGES.includes(pkg) || BOX_SAFE_LIBS.includes(pkg)) return true;
  return ref.typeOnly && TYPE_ONLY_PACKAGES.includes(pkg);
}

const allowedInSpec = (file: string, ref: ImportRef): boolean => allowedInSource(file, ref) || SPEC_ONLY_PACKAGES.includes(packageOf(ref.spec));

/** R3 and the box bundle rules, by token; the import allow-list above already refuses the packages themselves. */
const BANNED_IN_SOURCES: ReadonlyArray<[string, RegExp]> = [
  ['@app/global or @app/platform-cloud', /['"]@app\/(global|platform-cloud)/],
  ['apps/', /['"][^'"]*apps\//],
  ['@nestjs/swagger (D9: live docs live in platform-cloud)', /@nestjs\/swagger/],
  ['consumer.apply / NestModule (hosts bind middleware by controller class)', /\bconsumer\s*\.\s*apply\s*\(|\bNestModule\b|\bMiddlewareConsumer\b/],
  ['APP_PIPE / APP_FILTER / APP_GUARD / APP_INTERCEPTOR', /\bAPP_(PIPE|FILTER|GUARD|INTERCEPTOR)\b/],
  ['@Global()', /@Global\s*\(/],
  ['lifecycle hooks (R7: the box kernel boots first)', /\b[oO]n(ModuleInit|ApplicationBootstrap|ModuleDestroy|ApplicationShutdown)\b|\b[bB]eforeApplicationShutdown\b/],
  ['schedulers, queues, gateways, microservice handlers', /@(Cron|Interval|Timeout|Processor|Process|WebSocketGateway|SubscribeMessage|MessagePattern|EventPattern)\s*\(/],
  ['timers', /\b(setTimeout|setInterval|setImmediate)\s*\(/],
  ['process', /\bprocess\s*\./],
  ['ConfigService', /\bConfigService\b/],
  ['require()', /\brequire\s*\(/],
  ['dynamic import() (only the inline type import("express") is allowed)', /\bimport\s*\((?!\s*['"]express['"]\s*\))/],
  ['eval', /\beval\s*\(/],
  ['console (use the Nest Logger)', /\bconsole\s*\./],
];

describe('libs/rt-features purity and layout', () => {
  it('src/ holds index.ts and one folder per feature, nothing else', () => {
    const topLevelSources = sources.filter((f) => !f.includes('/'));
    const topLevelDirs = fs.readdirSync(SRC, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort();
    expect(topLevelSources).toEqual(['index.ts']);
    expect(topLevelDirs).toEqual([...FEATURES].sort());
  });

  it('every feature folder has the plan §3.2 layout; an HTTP feature has all of its extra pieces or none', () => {
    const missing: string[] = [];
    const present = (feature: string, item: string): boolean => {
      const full = path.join(SRC, feature, item.replace('<f>', feature));
      return item.endsWith('/') ? fs.existsSync(full) && fs.statSync(full).isDirectory() : fs.existsSync(full) && fs.statSync(full).isFile();
    };
    for (const feature of FEATURES) {
      for (const item of FEATURE_LAYOUT) if (!present(feature, item)) missing.push(feature + '/' + item.replace('<f>', feature));
      const http = HTTP_FEATURE_LAYOUT.filter((item) => present(feature, item));
      if (http.length > 0 && http.length < HTTP_FEATURE_LAYOUT.length) {
        for (const item of HTTP_FEATURE_LAYOUT) if (!present(feature, item)) missing.push(feature + '/' + item.replace('<f>', feature) + ' (an HTTP feature needs every piece)');
      }
    }
    expect(missing).toEqual([]);
    // team-users is an HTTP feature, transcript-shape a pure one.
    expect(HTTP_FEATURE_LAYOUT.every((item) => present('team-users', item))).toBe(true);
    expect(HTTP_FEATURE_LAYOUT.some((item) => present('transcript-shape', item))).toBe(false);
  });

  it('index.ts exports nothing: hosts import @app/rt-features/<feature>, so a bundle carries only what it mounts', () => {
    expect(specifiers(read('index.ts'))).toEqual([]);
  });

  it.each(sources)('%s imports only sibling modules, the box-safe packages and libs, and express types', (file) => {
    const bad = imports(read(file)).filter((i) => !allowedInSource(file, i)).map((i) => i.spec + (i.typeOnly ? ' (type)' : ''));
    expect(bad).toEqual([]);
  });

  it.each(sources)('%s has no side effect, host wiring, live-only lib, I/O, timer or clock-free violation', (file) => {
    const code = read(file);
    const hits = BANNED_IN_SOURCES.filter(([, re]) => re.test(code)).map(([name]) => name);
    expect(hits).toEqual([]);
  });

  it.each(specs)('%s imports no apps/ code and no live-only lib', (file) => {
    const bad = imports(read(file)).filter((i) => !allowedInSpec(file, i)).map((i) => i.spec);
    expect(bad).toEqual([]);
  });

  it('the guard itself catches what it bans', () => {
    // The sample holds only allowed specifiers in import position: this spec scans itself, so a banned one written
    // as `from '…'` here would fail the spec check above. Refusals are exercised through constructed refs instead.
    const sample = stripComments(
      `// import x from '@nestjs/core'\nimport { Module } from '@nestjs/common';\nimport type { Request } from 'express';\n`
      + `import { map } from 'rxjs/operators';\nexport * from './dto';\nconst p = process.env.X; const s = '@app/global'; /* consumer.apply() */\n`,
    );
    expect(imports(sample)).toEqual([
      { spec: '@nestjs/common', typeOnly: false },
      { spec: 'express', typeOnly: true },
      { spec: 'rxjs/operators', typeOnly: false },
      { spec: './dto', typeOnly: false },
    ]);
    expect(imports(sample).filter((i) => !allowedInSource('x/x.service.ts', i))).toEqual([]);
    const refused: ImportRef[] = [
      { spec: 'express', typeOnly: false },
      { spec: '@app/global', typeOnly: false },
      { spec: '@app/platform-cloud', typeOnly: true },
      { spec: 'pg', typeOnly: false },
      { spec: '@nestjs/swagger', typeOnly: false },
      { spec: '@nestjs/config', typeOnly: false },
      { spec: 'jsonwebtoken', typeOnly: false },
      { spec: 'node:fs', typeOnly: false },
      { spec: '../../api-kernel/src/errors', typeOnly: false },
    ];
    expect(refused.filter((i) => allowedInSource('x/x.service.ts', i))).toEqual([]);
    expect(allowedInSpec('x/x.spec.ts', { spec: 'node:fs', typeOnly: false })).toBe(true);
    expect(allowedInSpec('x/x.spec.ts', { spec: '@app/global', typeOnly: false })).toBe(false);
    const hits = BANNED_IN_SOURCES.filter(([, re]) => re.test(sample)).map(([name]) => name);
    expect(hits).toEqual(['@app/global or @app/platform-cloud', 'process']);
    const dynamicImport = BANNED_IN_SOURCES.find(([name]) => name.startsWith('dynamic import()'))[1];
    expect(dynamicImport.test(`send(res: import('express').Response)`)).toBe(false);
    expect(dynamicImport.test(`const m = await import(name)`)).toBe(true);
    expect(isSibling('team-users/http/x.controller.ts', '../team-users.operations')).toBe(true);
    expect(isSibling('team-users/index.ts', '../../../api-kernel/src')).toBe(false);
  });
});
