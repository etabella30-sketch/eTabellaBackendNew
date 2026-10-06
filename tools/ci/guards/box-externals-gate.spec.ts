import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { createRequire } from 'module';
import { spawnSync } from 'child_process';

/*
 * tools/ci/box-externals-gate.js against fixture bundles in a temp folder: the real dist/ and the real box
 * package.json are never read here (the box file is read-only and may not exist on a CI machine). The gate is
 * the plain CommonJS node runs at the command line, so it is loaded with node's own require: ts-jest would
 * otherwise transpile the .js as TypeScript and warn about allowJs. The last block spawns the CLI for real,
 * because the exit code is the contract Phase 2's package-box.js reads.
 */

interface Verdict {
  ok: boolean;
  refusals: Array<{ name: string; reason: string }>;
  added: string[];
  removed: string[];
  unpinnedBaseline: string[];
  bundleBytes: number;
  baselineBytes: number;
  sizeDelta: number;
}

interface Baseline {
  externals: string[];
  neverOnTheBox: string[];
  mainJsBytes: number;
}

interface Gate {
  main(argv: string[], io?: { log(line: string): void; error(line: string): void }): number;
  evaluate(input: { externals: string[]; baseline: Baseline; boxDependencies: Record<string, string>; bundleBytes: number }): Verdict;
  externalsOf(source: string): string[];
  packageName(specifier: string): string;
  isNodeBuiltin(specifier: string): boolean;
  isPathSpecifier(specifier: string): boolean;
  isExactVersion(version: unknown): boolean;
  DEFAULTS: { bundle: string; baseline: string; boxPackage: string };
  GATE_SCRIPT: string;
  USAGE: string;
}

const nativeRequire = createRequire(__filename);
const gate: Gate = nativeRequire('../box-externals-gate.js');

const REPO = path.resolve(__dirname, '..', '..', '..');
const COMMITTED_BASELINE = path.join(REPO, 'tools', 'ci', 'box-externals.baseline.json');

const BASELINE: Baseline = {
  externals: ['@nestjs/common', '@nestjs/core', 'jose', 'rxjs'],
  neverOnTheBox: ['pg', 'ioredis', 'kafkajs', '@nestjs/config', '@nestjs/microservices', '@nestjs/swagger', 'jsonwebtoken', '@nestjs-modules/ioredis'],
  mainJsBytes: 100,
};
const BOX_PACKAGE = {
  name: 'etabella-rt-local',
  dependencies: { '@nestjs/common': '10.4.22', '@nestjs/core': '10.4.22', jose: '4.15.5', rxjs: '7.8.1', 'class-validator': '0.14.3', lodash: '^4.17.21', pg: '8.11.3' },
};

/** A webpack-shaped bundle: one `module.exports = require("x")` per external plus some builtin and path requires. */
function bundle(specifiers: string[]): string {
  const externals = specifiers.map((s) => 'module.exports = require("' + s + '");').join('\n');
  return [
    '/******/ (() => { // webpackBootstrap',
    externals,
    "const c = require('node:crypto'); const f = require(\"fs\"); const p = require('fs/promises');",
    'const local = require("./local-file"); const abs = require("/abs/path"); const win = require("D:/box/file.js");',
    'const text = "this string mentions require but is not a call";',
    '/******/ })();',
    '',
  ].join('\n');
}

interface Fixture {
  bundle: string;
  baseline: string;
  boxPackage: string;
}

function captured(): { io: { log(line: string): void; error(line: string): void }; out: string[]; err: string[] } {
  const out: string[] = [];
  const err: string[] = [];
  return { io: { log: (l) => out.push(l), error: (l) => err.push(l) }, out, err };
}

describe('box-externals-gate', () => {
  let dir: string;
  const fixtures: Record<string, Fixture> = {};

  function writeFixture(name: string, specifiers: string[], baseline: Baseline = BASELINE, boxPackage: unknown = BOX_PACKAGE): Fixture {
    const folder = path.join(dir, name);
    fs.mkdirSync(folder, { recursive: true });
    const f: Fixture = {
      bundle: path.join(folder, 'main.js'),
      baseline: path.join(folder, 'baseline.json'),
      boxPackage: path.join(folder, 'package.json'),
    };
    fs.writeFileSync(f.bundle, bundle(specifiers));
    fs.writeFileSync(f.baseline, JSON.stringify(baseline, null, 2));
    fs.writeFileSync(f.boxPackage, JSON.stringify(boxPackage, null, 2));
    fixtures[name] = f;
    return f;
  }

  function argsOf(f: Fixture): string[] {
    return ['--bundle', f.bundle, '--baseline', f.baseline, '--box-package', f.boxPackage];
  }

  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'box-externals-gate-'));
    writeFixture('pass', ['@nestjs/common', '@nestjs/core', 'jose', 'rxjs/operators']);
    writeFixture('pinned-extra', ['@nestjs/common', '@nestjs/core', 'jose', 'rxjs', 'class-validator']);
    writeFixture('unknown', ['@nestjs/common', 'jose', 'left-pad']);
    writeFixture('range', ['@nestjs/common', 'jose', 'lodash']);
    writeFixture('never', ['@nestjs/common', 'jose', 'pg', 'kafkajs/types']);
  });

  afterAll(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  describe('specifier handling', () => {
    it.each([
      ['@nestjs/common', '@nestjs/common'],
      ['@nestjs/common/decorators', '@nestjs/common'],
      ['rxjs/operators', 'rxjs'],
      ['socket.io-client', 'socket.io-client'],
      ['jose', 'jose'],
    ])('packageName(%s) = %s', (specifier, expected) => {
      expect(gate.packageName(specifier)).toBe(expected);
    });

    it.each(['fs', 'fs/promises', 'crypto', 'node:crypto', 'node:sqlite', 'node:test', 'dgram', 'perf_hooks'])('%s is a Node builtin', (s) => {
      expect(gate.isNodeBuiltin(s)).toBe(true);
    });

    it.each(['pg', 'jose', '@nestjs/common', 'rxjs', 'serialport', 'fsx'])('%s is a package, not a builtin', (s) => {
      expect(gate.isNodeBuiltin(s)).toBe(false);
    });

    it.each(['./x', '../x', '/abs', 'C:/x', 'D:\\x'])('%s is a path, not a package', (s) => {
      expect(gate.isPathSpecifier(s)).toBe(true);
    });

    it('externalsOf lists each package once, sorted, without builtins or paths', () => {
      const src = bundle(['rxjs', '@nestjs/core', '@nestjs/common', 'rxjs/operators', "jose"]) + "\nconst again = require('jose');\n";
      expect(gate.externalsOf(src)).toEqual(['@nestjs/common', '@nestjs/core', 'jose', 'rxjs']);
    });

    it('externalsOf finds nothing in a bundle of builtins only', () => {
      expect(gate.externalsOf(bundle([]))).toEqual([]);
    });

    it.each([
      ['1.2.3', true],
      ['10.4.22', true],
      ['1.2.3-beta.1', true],
      ['1.2.3+build.7', true],
      ['^1.2.3', false],
      ['~1.2', false],
      ['>=1.0.0', false],
      ['1.x', false],
      ['*', false],
      ['latest', false],
      ['file:../lib', false],
      ['', false],
      [undefined, false],
    ])('isExactVersion(%j) = %s', (version, expected) => {
      expect(gate.isExactVersion(version)).toBe(expected);
    });
  });

  describe('evaluate', () => {
    const deps = BOX_PACKAGE.dependencies;

    it('passes a bundle whose externals are exactly the baseline, even with no box dependencies at all', () => {
      const v = gate.evaluate({ externals: [...BASELINE.externals], baseline: BASELINE, boxDependencies: {}, bundleBytes: 100 });
      expect(v.ok).toBe(true);
      expect(v.refusals).toEqual([]);
      expect(v.added).toEqual([]);
      expect(v.removed).toEqual([]);
      expect(v.sizeDelta).toBe(0);
      // The box has none of them pinned: a warning, not a refusal (the baseline is the contract).
      expect(v.unpinnedBaseline).toEqual([...BASELINE.externals]);
    });

    it('passes an external off the baseline when the box pins it, and reports it as added', () => {
      const v = gate.evaluate({ externals: ['@nestjs/common', 'class-validator'], baseline: BASELINE, boxDependencies: deps, bundleBytes: 120 });
      expect(v.ok).toBe(true);
      expect(v.added).toEqual(['class-validator']);
      expect(v.removed).toEqual(['@nestjs/core', 'jose', 'rxjs']);
      expect(v.unpinnedBaseline).toEqual([]);
      expect(v.sizeDelta).toBe(20);
    });

    it('refuses an external that is neither on the baseline nor in the box package.json', () => {
      const v = gate.evaluate({ externals: ['jose', 'left-pad'], baseline: BASELINE, boxDependencies: deps, bundleBytes: 90 });
      expect(v.ok).toBe(false);
      expect(v.refusals).toEqual([{ name: 'left-pad', reason: 'not on the baseline and not in the box package.json dependencies' }]);
      expect(v.sizeDelta).toBe(-10);
    });

    it('refuses an external the box lists with a range instead of an exact pin', () => {
      const v = gate.evaluate({ externals: ['lodash'], baseline: BASELINE, boxDependencies: deps, bundleBytes: 100 });
      expect(v.ok).toBe(false);
      expect(v.refusals).toEqual([{ name: 'lodash', reason: 'not on the baseline and the box package.json has "^4.17.21", not an exact pin' }]);
    });

    it('always refuses the neverOnTheBox packages, even when the box pins them', () => {
      const v = gate.evaluate({ externals: ['pg', 'kafkajs', 'jose'], baseline: BASELINE, boxDependencies: deps, bundleBytes: 100 });
      expect(v.ok).toBe(false);
      expect(v.refusals.map((r) => r.name)).toEqual(['pg', 'kafkajs']);
      expect(v.refusals.every((r) => r.reason === 'never allowed on the box (baseline neverOnTheBox)')).toBe(true);
    });

    it('refuses a neverOnTheBox package that someone also put on the externals baseline', () => {
      const tampered: Baseline = { ...BASELINE, externals: [...BASELINE.externals, 'ioredis'] };
      const v = gate.evaluate({ externals: ['ioredis'], baseline: tampered, boxDependencies: deps, bundleBytes: 100 });
      expect(v.ok).toBe(false);
      expect(v.refusals.map((r) => r.name)).toEqual(['ioredis']);
    });
  });

  describe('main (in-process, fixture files)', () => {
    it('passes the baseline bundle and prints the externals, the box file, the delta and the size', () => {
      const f = fixtures.pass;
      const { io, out, err } = captured();
      expect(gate.main(argsOf(f), io)).toBe(0);
      expect(err).toEqual([]);
      expect(out[0]).toBe('box-externals-gate: ' + f.bundle);
      expect(out).toContain('  externals (4): @nestjs/common, @nestjs/core, jose, rxjs');
      expect(out).toContain('  box package.json: ' + f.boxPackage + ' (7 dependencies)');
      expect(out).toContain('  vs baseline: +none  -none');
      const bytes = fs.statSync(f.bundle).size;
      expect(out).toContain('  size: ' + bytes.toLocaleString('en-US') + ' B = baseline 100 B +' + (bytes - 100).toLocaleString('en-US') + ' B (+' + (((bytes - 100) / 100) * 100).toFixed(2) + '%)');
      expect(out[out.length - 1]).toBe('PASS');
    });

    it('passes an extra external the box pins and names the pin in the delta', () => {
      const { io, out } = captured();
      expect(gate.main(argsOf(fixtures['pinned-extra']), io)).toBe(0);
      expect(out).toContain('  vs baseline: +class-validator (pinned 0.14.3 on the box)  -none');
      expect(out[out.length - 1]).toBe('PASS');
    });

    it('refuses an unknown external and lists it, still printing the size delta', () => {
      const { io, out, err } = captured();
      expect(gate.main(argsOf(fixtures.unknown), io)).toBe(1);
      expect(err).toEqual([]);
      expect(out).toContain('REFUSED: 1 package(s)');
      expect(out).toContain('  left-pad: not on the baseline and not in the box package.json dependencies');
      expect(out).toContain('  vs baseline: +left-pad  -@nestjs/core, rxjs');
      expect(out.some((l) => l.startsWith('  size: '))).toBe(true);
    });

    it('refuses a range pin', () => {
      const { io, out } = captured();
      expect(gate.main(argsOf(fixtures.range), io)).toBe(1);
      expect(out).toContain('  lodash: not on the baseline and the box package.json has "^4.17.21", not an exact pin');
    });

    it('refuses the never-on-the-box packages (pg pinned on the box, kafkajs via a deep specifier)', () => {
      const { io, out } = captured();
      expect(gate.main(argsOf(fixtures.never), io)).toBe(1);
      expect(out).toContain('REFUSED: 2 package(s)');
      expect(out).toContain('  kafkajs: never allowed on the box (baseline neverOnTheBox)');
      expect(out).toContain('  pg: never allowed on the box (baseline neverOnTheBox)');
    });

    it('warns, without refusing, when a baseline external is not pinned on the box', () => {
      const f = writeFixture('unpinned-baseline', ['@nestjs/common', 'jose'], BASELINE, { dependencies: { '@nestjs/common': '10.4.22' } });
      const { io, out } = captured();
      expect(gate.main(argsOf(f), io)).toBe(0);
      expect(out).toContain('  WARNING on the baseline but not pinned on the box: jose');
    });

    it('treats a box package.json without dependencies as pinning nothing', () => {
      const f = writeFixture('no-deps', ['@nestjs/common', 'class-validator'], BASELINE, { name: 'bare' });
      const { io, out } = captured();
      expect(gate.main(argsOf(f), io)).toBe(1);
      expect(out).toContain('  box package.json: ' + f.boxPackage + ' (0 dependencies)');
      expect(out).toContain('  class-validator: not on the baseline and not in the box package.json dependencies');
    });

    it.each([
      ['a missing bundle', (f: Fixture) => ['--bundle', f.bundle + '.missing', '--baseline', f.baseline, '--box-package', f.boxPackage], 'bundle not readable'],
      ['a missing box package.json', (f: Fixture) => ['--bundle', f.bundle, '--baseline', f.baseline, '--box-package', f.boxPackage + '.missing'], 'box package.json (pass --box-package) not readable'],
      ['a missing baseline', (f: Fixture) => ['--bundle', f.bundle, '--baseline', f.baseline + '.missing', '--box-package', f.boxPackage], 'baseline not readable'],
      ['an unknown flag', (f: Fixture) => [...argsOf(f), '--nope'], 'unknown option: --nope'],
      ['a flag without a value', (f: Fixture) => ['--bundle'], '--bundle needs a value'],
    ])('exits 2 on %s, with the usage line', (_name, argv, message) => {
      const { io, out, err } = captured();
      expect(gate.main(argv(fixtures.pass), io)).toBe(2);
      expect(out).toEqual([]);
      expect(err[0]).toContain(message);
      expect(err[1]).toBe(gate.USAGE);
    });

    it('exits 2 on a baseline that lacks the three keys', () => {
      const f = writeFixture('bad-baseline', ['jose'], { externals: ['jose'] } as Baseline);
      const { io, err } = captured();
      expect(gate.main(argsOf(f), io)).toBe(2);
      expect(err[0]).toContain('baseline needs string lists "externals" and "neverOnTheBox" and an integer "mainJsBytes"');
    });

    it('exits 2 on a box package.json that is not JSON', () => {
      const f = writeFixture('bad-box', ['jose']);
      fs.writeFileSync(f.boxPackage, '{ not json');
      const { io, err } = captured();
      expect(gate.main(argsOf(f), io)).toBe(2);
      expect(err[0]).toContain('is not JSON');
    });

    it('never writes: the fixture files are byte-identical after a refused run', () => {
      const f = fixtures.never;
      const before = [f.bundle, f.baseline, f.boxPackage].map((p) => fs.readFileSync(p, 'utf8'));
      gate.main(argsOf(f), captured().io);
      expect([f.bundle, f.baseline, f.boxPackage].map((p) => fs.readFileSync(p, 'utf8'))).toEqual(before);
    });
  });

  describe('defaults and the committed baseline', () => {
    it('defaults to the rt-edge bundle, the committed baseline and the installed box package.json', () => {
      expect(gate.DEFAULTS.bundle).toBe(path.join(REPO, 'dist', 'apps', 'rt-edge', 'main.js'));
      expect(gate.DEFAULTS.baseline).toBe(COMMITTED_BASELINE);
      expect(gate.DEFAULTS.boxPackage).toBe('D:/etabella tech/rt-edge-box/package.json');
    });

    it('the committed baseline names the box bundle: the installed 8 externals plus the 2 of the Phase 4 local API host, 8 never-on-the-box packages, 1,346,003 B', () => {
      const baseline: Baseline = JSON.parse(fs.readFileSync(COMMITTED_BASELINE, 'utf8'));
      expect(baseline.externals).toEqual(['@nestjs/common', '@nestjs/core', '@nestjs/websockets', 'class-transformer', 'class-validator', 'cookie-parser', 'jose', 'rxjs', 'serialport', 'socket.io-client']);
      expect(baseline.neverOnTheBox).toEqual(['pg', 'ioredis', 'kafkajs', '@nestjs/config', '@nestjs/microservices', '@nestjs/swagger', 'jsonwebtoken', '@nestjs-modules/ioredis']);
      expect(baseline.mainJsBytes).toBe(1346003);
      // The two lists never overlap, so a baseline bundle can never be refused.
      expect(baseline.externals.filter((e) => baseline.neverOnTheBox.includes(e))).toEqual([]);
      const v = gate.evaluate({ externals: [...baseline.externals], baseline, boxDependencies: {}, bundleBytes: baseline.mainJsBytes });
      expect(v.ok).toBe(true);
      expect(v.sizeDelta).toBe(0);
    });
  });

  describe('command line', () => {
    const run = (argv: string[]) => spawnSync(process.execPath, [gate.GATE_SCRIPT, ...argv], { encoding: 'utf8' });

    it('exits 0 and prints PASS for the baseline bundle', () => {
      const r = run(argsOf(fixtures.pass));
      expect(r.status).toBe(0);
      expect(r.stdout.trim().split(/\r?\n/).pop()).toBe('PASS');
      expect(r.stderr).toBe('');
    });

    it('exits 1 and lists the offender for a refused bundle', () => {
      const r = run(argsOf(fixtures.never));
      expect(r.status).toBe(1);
      expect(r.stdout).toContain('REFUSED: 2 package(s)');
      expect(r.stdout).toContain('  pg: never allowed on the box (baseline neverOnTheBox)');
    });

    it('exits 2 with the usage line on a bad flag', () => {
      const r = run(['--nope']);
      expect(r.status).toBe(2);
      expect(r.stderr).toContain('unknown option: --nope');
      expect(r.stderr).toContain(gate.USAGE);
    });
  });
});
