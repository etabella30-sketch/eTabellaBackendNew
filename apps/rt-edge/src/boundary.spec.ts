import * as fs from 'fs';
import * as path from 'path';

/**
 * Boundary guard for the venue box app (gate G1, invariant R2 of the shared-libraries plan, Phase 1, 2026-10-06):
 * rt-edge production sources (apps/rt-edge/src/**, not *.spec.ts; the e2e suite lives outside src) never import
 * the live-only packages. The box has no Postgres, Redis or Kafka and installs only its own package.json, so one of
 * these imports would either fail to boot (exit 70 at stage module-graph, before the kernel records anything) or
 * quietly pull the live kernel in: @app/global reads process.env and its DbService exits the process on a pg idle
 * error. tools/ci/box-externals-gate.js checks the built bundle; this spec fails at `jest` time, before a build.
 * Comments are stripped before matching; string literals are kept so every specifier is seen (helpers copied from
 * libs/edge-token/src/edge-token.purity.spec.ts).
 */

const SRC = __dirname;
const REPO = path.resolve(SRC, '..', '..', '..');

/** Never on the box: the live kernel, the live infrastructure clients and the live-only lib that binds them. */
const BANNED_PACKAGES = [
    '@app/global',
    '@app/platform-cloud',
    'pg',
    'ioredis',
    'kafkajs',
    '@nestjs/config',
    '@nestjs/microservices',
    '@nestjs/swagger',
    'jsonwebtoken',
    '@nestjs-modules/ioredis',
];

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

/** Every import specifier with its line: `from '...'`, side-effect `import '...'`, `require('...')`, `import('...')`. */
function specifiers(code: string): Array<{ specifier: string; line: number }> {
    const found: Array<{ specifier: string; line: number }> = [];
    const res = [
        /\bfrom\s*['"]([^'"]+)['"]/g,
        /\bimport\s*['"]([^'"]+)['"]/g,
        /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
        /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    ];
    for (const re of res) {
        for (const m of code.matchAll(re)) found.push({ specifier: m[1], line: code.slice(0, m.index ?? 0).split('\n').length });
    }
    return found;
}

/** `@scope/name/deep` -> `@scope/name`, `name/deep` -> `name`. */
function packageName(specifier: string): string {
    const parts = specifier.split('/');
    return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

/** Production TypeScript under `dir`, recursively: *.ts that is not *.spec.ts or *.d.ts. */
function productionFiles(dir: string): string[] {
    const out: string[] = [];
    const walk = (d: string) => {
        for (const e of fs.readdirSync(d, { withFileTypes: true })) {
            const p = path.join(d, e.name);
            if (e.isDirectory()) {
                if (e.name !== 'node_modules') walk(p);
            } else if (e.name.endsWith('.ts') && !e.name.endsWith('.spec.ts') && !e.name.endsWith('.d.ts')) out.push(p);
        }
    };
    walk(dir);
    return out.sort();
}

function offencesIn(code: string, file: string): string[] {
    return specifiers(code)
        .filter(({ specifier }) => BANNED_PACKAGES.includes(packageName(specifier)))
        .map(({ specifier, line }) => path.relative(REPO, file).split(path.sep).join('/') + ':' + line + ' ' + specifier);
}

describe('rt-edge boundary', () => {
    const files = productionFiles(SRC);

    it('scans the production sources of apps/rt-edge/src (and only those)', () => {
        expect(files.length).toBeGreaterThan(50);
        expect(files).toContain(path.join(SRC, 'main.ts'));
        expect(files).toContain(path.join(SRC, 'app.module.ts'));
        expect(files.some(f => f.endsWith('.spec.ts'))).toBe(false);
        expect(files.some(f => f.includes(path.sep + 'e2e' + path.sep))).toBe(false);
    });

    it('never imports @app/global, @app/platform-cloud, pg, ioredis, kafkajs, @nestjs/config, @nestjs/microservices, @nestjs/swagger, jsonwebtoken or @nestjs-modules/ioredis', () => {
        const offences = files.flatMap(file => offencesIn(stripComments(fs.readFileSync(file, 'utf8')), file));
        expect(offences).toEqual([]);
    });

    it('the guard itself catches every import form, deep specifiers included, and ignores comments and strings', () => {
        const sample = stripComments([
            "import { Module } from '@nestjs/common';",
            "import { DbService } from '@app/global/db/pg/db.service';",
            "import type { CloudPlatformModule } from '@app/platform-cloud';",
            "import '@nestjs-modules/ioredis';",
            "const { Pool } = require('pg');",
            "const kafka = import('kafkajs/types');",
            "// import { ConfigService } from '@nestjs/config';",
            "const note = 'uses jsonwebtoken on the cloud';",
            "import { verify } from 'jose';",
        ].join('\n'));
        expect(offencesIn(sample, path.join(SRC, 'x.ts'))).toEqual([
            'apps/rt-edge/src/x.ts:2 @app/global/db/pg/db.service',
            'apps/rt-edge/src/x.ts:3 @app/platform-cloud',
            'apps/rt-edge/src/x.ts:4 @nestjs-modules/ioredis',
            'apps/rt-edge/src/x.ts:5 pg',
            'apps/rt-edge/src/x.ts:6 kafkajs/types',
        ]);
    });
});
