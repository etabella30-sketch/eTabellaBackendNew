import * as fs from 'fs';
import * as path from 'path';

/*
 * Lib boundaries, invariants R1 and R2 of the shared-libraries plan (section 3.1; gate G1, Phase 1, 2026-10-06):
 *  R1  no lib imports apps/: imports go one way, apps import libs. Checked on production sources of every lib
 *      except the dead alpha-queue and mipl-queue (the per-lib purity specs police their own spec files).
 *  R2  the box-safe libs (api-kernel, api-contracts, permissions, rt-features) import only @nestjs/common,
 *      @nestjs/core, class-validator, class-transformer, rxjs, reflect-metadata, express TYPES and each other
 *      (@app/<lib> across libs, relative paths inside a lib). platform-cloud may add @app/global, pg, ioredis,
 *      kafkajs, @nestjs/config, @nestjs/microservices and @nestjs/swagger. Everything else, Node builtins
 *      included, is refused: these libs run on the venue box, which has no database, Redis, Kafka or swagger,
 *      and the plan's own port contract keeps even express to `import type` / `import('express').Response`.
 * Comments are stripped before matching; string literals are kept so every specifier is seen. The helpers are
 * copied from libs/edge-token/src/edge-token.purity.spec.ts: a guard must not import what it guards.
 */

const REPO = path.resolve(__dirname, '..', '..', '..');
const LIBS_DIR = path.join(REPO, 'libs');
const APPS_DIR = path.join(REPO, 'apps');

const DEAD_LIBS = ['alpha-queue', 'mipl-queue'];
const BOX_SAFE_LIBS = ['api-kernel', 'api-contracts', 'permissions', 'rt-features'];
const LIVE_ONLY_LIB = 'platform-cloud';

/** R2 packages a box-safe lib may import (compared on the package name, so `rxjs/operators` is `rxjs`). */
const BOX_SAFE_PACKAGES = ['@nestjs/common', '@nestjs/core', 'class-validator', 'class-transformer', 'rxjs', 'reflect-metadata'];
/** What platform-cloud adds: the live kernel and the live infrastructure packages. */
const LIVE_ONLY_PACKAGES = ['@app/global', 'pg', 'ioredis', 'kafkajs', '@nestjs/config', '@nestjs/microservices', '@nestjs/swagger'];

interface Import {
  specifier: string;
  /** `import type ... from` / `export type ... from`. */
  typeOnly: boolean;
  form: 'from' | 'side-effect' | 'require' | 'import()';
  line: number;
}

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

const lineAt = (code: string, index: number) => code.slice(0, index).split('\n').length;

/** Every import in comment-stripped code, with whether the statement is type-only. The `from` clause may not
 *  contain quotes, `;`, `=`, `(`, `)`, `:`, `<` or `>`, so the scan never runs past a declaration into the next
 *  statement's `from` (`export type X = ...` is cut off at its `=`). */
function importsOf(code: string): Import[] {
  const out: Import[] = [];
  for (const m of code.matchAll(/\b(import|export)\s+(type\s+)?[^'"`;=():<>]*?\bfrom\s*(['"])([^'"]+)\3/g)) {
    out.push({ specifier: m[4], typeOnly: m[2] !== undefined, form: 'from', line: lineAt(code, m.index ?? 0) });
  }
  for (const m of code.matchAll(/\bimport\s*(['"])([^'"]+)\1/g)) {
    out.push({ specifier: m[2], typeOnly: false, form: 'side-effect', line: lineAt(code, m.index ?? 0) });
  }
  for (const m of code.matchAll(/\brequire\s*\(\s*(['"])([^'"]+)\1\s*\)/g)) {
    out.push({ specifier: m[2], typeOnly: false, form: 'require', line: lineAt(code, m.index ?? 0) });
  }
  for (const m of code.matchAll(/\bimport\s*\(\s*(['"])([^'"]+)\1\s*\)/g)) {
    out.push({ specifier: m[2], typeOnly: false, form: 'import()', line: lineAt(code, m.index ?? 0) });
  }
  return out;
}

/** `@scope/name/deep` -> `@scope/name`, `name/deep` -> `name`. */
function packageName(specifier: string): string {
  const parts = specifier.split('/');
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

const isRelative = (s: string) => s.startsWith('./') || s.startsWith('../') || s === '.' || s === '..';

function subdirs(dir: string): string[] {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name !== 'node_modules')
    .map((e) => e.name)
    .sort();
}

/** Production TypeScript under `dir`, recursively: *.ts that is not *.spec.ts or *.d.ts. */
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

interface Offence {
  file: string;
  line: number;
  specifier: string;
  rule: string;
}

const rel = (file: string) => path.relative(REPO, file).split(path.sep).join('/');

/** R1 (every lib): no specifier into apps/, by alias, by `apps/...` or by a relative path that leaves the lib. */
function r1Offences(lib: string, file: string, imports: Import[]): Offence[] {
  const libSrc = path.join(LIBS_DIR, lib, 'src');
  const out: Offence[] = [];
  for (const i of imports) {
    if (isRelative(i.specifier)) {
      const target = path.resolve(path.dirname(file), i.specifier);
      if (target.startsWith(APPS_DIR + path.sep)) out.push({ file: rel(file), line: i.line, specifier: i.specifier, rule: 'R1 relative path into apps/' });
      else if (!target.startsWith(libSrc + path.sep) && target !== libSrc) out.push({ file: rel(file), line: i.line, specifier: i.specifier, rule: 'R1 relative path leaves libs/' + lib + '/src' });
    } else if (/(^|\/)apps\//.test(i.specifier)) {
      out.push({ file: rel(file), line: i.line, specifier: i.specifier, rule: 'R1 imports apps/' });
    }
  }
  return out;
}

/** R2 (box-safe libs and platform-cloud): only the allow-list, sibling libs by alias, own files by relative path. */
function r2Offences(lib: string, file: string, imports: Import[], packages: readonly string[], siblingLibs: readonly string[]): Offence[] {
  const out: Offence[] = [];
  for (const i of imports) {
    const s = i.specifier;
    if (isRelative(s)) continue;
    const pkg = packageName(s);
    if (pkg === 'express') {
      if (i.form === 'from' && i.typeOnly) continue;
      // `send(res: import('express').Response, ...)` in the port contract: a type reference, not a load.
      if (i.form === 'import()') continue;
      out.push({ file: rel(file), line: i.line, specifier: s, rule: 'R2 express only as `import type` (or a type-position import())' });
      continue;
    }
    if (packages.includes(pkg)) continue;
    if (pkg.startsWith('@app/')) {
      const target = pkg.slice('@app/'.length);
      if (target === lib) out.push({ file: rel(file), line: i.line, specifier: s, rule: 'R2 own lib by alias; use a relative path' });
      else if (!siblingLibs.includes(target)) out.push({ file: rel(file), line: i.line, specifier: s, rule: 'R2 lib not allowed here: @app/' + target });
      continue;
    }
    out.push({ file: rel(file), line: i.line, specifier: s, rule: 'R2 package not on the box-safe allow-list' });
  }
  return out;
}

function scan(lib: string): Array<{ file: string; imports: Import[] }> {
  return productionFiles(path.join(LIBS_DIR, lib, 'src')).map((file) => ({
    file,
    imports: importsOf(stripComments(fs.readFileSync(file, 'utf8'))),
  }));
}

const libs = subdirs(LIBS_DIR).filter((lib) => !DEAD_LIBS.includes(lib));

describe('lib boundaries (R1, R2)', () => {
  it('scans every lib under libs/ except the dead queues', () => {
    expect(libs).toEqual(expect.arrayContaining([...BOX_SAFE_LIBS, LIVE_ONLY_LIB, 'global', 'edge-token', 'edge-sync', 'rt-ingest', 'feed-parse']));
    for (const dead of DEAD_LIBS) expect(libs).not.toContain(dead);
    for (const lib of libs) expect({ lib, hasIndex: fs.existsSync(path.join(LIBS_DIR, lib, 'src', 'index.ts')) }).toEqual({ lib, hasIndex: true });
  });

  describe.each(libs)('libs/%s', (lib) => {
    const files = scan(lib);

    it('R1: production sources never import apps/ (by alias, by path or by a relative path that leaves the lib)', () => {
      expect(files.length).toBeGreaterThan(0);
      expect(files.flatMap(({ file, imports }) => r1Offences(lib, file, imports))).toEqual([]);
    });

    if (BOX_SAFE_LIBS.includes(lib)) {
      it('R2: box-safe, imports only @nestjs/common, @nestjs/core, class-validator, class-transformer, rxjs, reflect-metadata, express types and the other box-safe libs', () => {
        expect(files.flatMap(({ file, imports }) => r2Offences(lib, file, imports, BOX_SAFE_PACKAGES, BOX_SAFE_LIBS))).toEqual([]);
      });
    }

    if (lib === LIVE_ONLY_LIB) {
      it('R2: live only, may add @app/global, pg, ioredis, kafkajs, @nestjs/config, @nestjs/microservices and @nestjs/swagger', () => {
        expect(files.flatMap(({ file, imports }) => r2Offences(lib, file, imports, [...BOX_SAFE_PACKAGES, ...LIVE_ONLY_PACKAGES], [...BOX_SAFE_LIBS, 'global']))).toEqual([]);
      });
    }
  });

  describe('the scanner itself', () => {
    const file = path.join(LIBS_DIR, 'api-kernel', 'src', 'http', 'caller.guard.ts');

    it('reads every import form, keeps type-only apart and ignores comments and strings', () => {
      const code = stripComments([
        "import { Injectable } from '@nestjs/common';",
        "import type { Request, Response } from 'express';",
        "import { Response as Res } from 'express';",
        "export type { Caller } from '../caller';",
        "export type Local = { a: string }",
        "import { CASE_ADMIN_ROLE_ID } from '@app/permissions';",
        "import 'reflect-metadata';",
        "const pg = require('pg');",
        "const lazy = import('ioredis');",
        "type Env = { send(res: import('express').Response): void };",
        "// import { DbService } from '@app/global';",
        "const sql = 'select 1 from \"apps/\"';",
      ].join('\n'));
      expect(importsOf(code)).toEqual([
        { specifier: '@nestjs/common', typeOnly: false, form: 'from', line: 1 },
        { specifier: 'express', typeOnly: true, form: 'from', line: 2 },
        { specifier: 'express', typeOnly: false, form: 'from', line: 3 },
        { specifier: '../caller', typeOnly: true, form: 'from', line: 4 },
        // `export type Local = ...` stops at its `=`, so the next statement keeps its own (value) kind.
        { specifier: '@app/permissions', typeOnly: false, form: 'from', line: 6 },
        { specifier: 'reflect-metadata', typeOnly: false, form: 'side-effect', line: 7 },
        { specifier: 'pg', typeOnly: false, form: 'require', line: 8 },
        { specifier: 'ioredis', typeOnly: false, form: 'import()', line: 9 },
        { specifier: 'express', typeOnly: false, form: 'import()', line: 10 },
      ]);
    });

    it('R2 refuses the live packages, a value import of express, Node builtins, apps and the own alias; allows the rest', () => {
      const imports = importsOf(stripComments([
        "import { Injectable } from '@nestjs/common';",
        "import { map } from 'rxjs/operators';",
        "import { IsUUID } from 'class-validator';",
        "import type { Response } from 'express';",
        "import { Request } from 'express';",
        "import { DbService } from '@app/global/db/pg/db.service';",
        "import { Pool } from 'pg';",
        "import * as fs from 'node:fs';",
        "import { createHash } from 'crypto';",
        "import { CASE_ADMIN_ROLE_ID } from '@app/permissions';",
        "import { Caller } from '@app/api-kernel';",
        "import { Foo } from '@app/platform-cloud';",
        "import { Bar } from '../caller';",
        "import { ConfigService } from '@nestjs/config';",
      ].join('\n')));
      const offences = r2Offences('api-kernel', file, imports, BOX_SAFE_PACKAGES, BOX_SAFE_LIBS);
      expect(offences.map((o) => [o.specifier, o.rule])).toEqual([
        ['express', 'R2 express only as `import type` (or a type-position import())'],
        ['@app/global/db/pg/db.service', 'R2 lib not allowed here: @app/global'],
        ['pg', 'R2 package not on the box-safe allow-list'],
        ['node:fs', 'R2 package not on the box-safe allow-list'],
        ['crypto', 'R2 package not on the box-safe allow-list'],
        ['@app/api-kernel', 'R2 own lib by alias; use a relative path'],
        ['@app/platform-cloud', 'R2 lib not allowed here: @app/platform-cloud'],
        ['@nestjs/config', 'R2 package not on the box-safe allow-list'],
      ]);
      // platform-cloud may take the live packages and @app/global, and still not the box app or jsonwebtoken.
      const live = r2Offences(LIVE_ONLY_LIB, path.join(LIBS_DIR, LIVE_ONLY_LIB, 'src', 'x.ts'), imports, [...BOX_SAFE_PACKAGES, ...LIVE_ONLY_PACKAGES], [...BOX_SAFE_LIBS, 'global']);
      expect(live.map((o) => o.specifier)).toEqual(['express', 'node:fs', 'crypto', '@app/platform-cloud']);
      expect(offences.map((o) => o.file)).toEqual(new Array(offences.length).fill('libs/api-kernel/src/http/caller.guard.ts'));
    });

    it('R1 refuses apps/ by alias, by path and by a relative path that leaves the lib', () => {
      // `file` sits in libs/api-kernel/src/http, so four `..` reach the repo root and three reach libs/.
      const imports = importsOf(stripComments([
        "import { X } from 'apps/coreapi/src/x';",
        "import { Y } from '../../../../apps/rt-edge/src/ports/tokens';",
        "import { Z } from '../../../global/src/index';",
        "import { Ok } from '../caller';",
        "import { Ok2 } from './sibling';",
        "import { Lib } from '@app/global';",
      ].join('\n')));
      expect(r1Offences('api-kernel', file, imports).map((o) => [o.specifier, o.rule])).toEqual([
        ['apps/coreapi/src/x', 'R1 imports apps/'],
        ['../../../../apps/rt-edge/src/ports/tokens', 'R1 relative path into apps/'],
        ['../../../global/src/index', 'R1 relative path leaves libs/api-kernel/src'],
      ]);
    });
  });
});
