import * as fs from 'fs';
import * as path from 'path';
import { createRequire } from 'module';

/*
 * package:box (tools/ci/package-box/core.js) against fakes: an in-memory file system and an exec that answers git
 * from a scripted repo state and records every build command. Nothing real runs: the spec proves the refusals, the
 * step order, what the stage holds and what release.json says, for a clean tree, a dirty tree, --wip, --dry-run and
 * a bundle that needs a package the box does not have.
 */

const REPO = path.resolve(__dirname, '..', '..', '..');
const requireJs = createRequire(__filename);
const core = requireJs(path.join(REPO, 'tools', 'ci', 'package-box', 'core.js'));
const smoke = requireJs(path.join(REPO, 'tools', 'ci', 'package-box', 'smoke.js'));
const { memoryFs, fakeExec, gitRepo } = requireJs(path.join(REPO, 'tools', 'ci', 'release-edge', 'spec-fakes.js'));
const realVersionTs = fs.readFileSync(path.join(REPO, 'libs', 'feed-parse', 'src', 'version.ts'), 'utf8');

const ROOT = path.resolve('/wd/backend');
const FE = path.resolve('/wd/eTabella angular 21');
const BE_HEAD = 'a'.repeat(40);
const FE_HEAD = 'b'.repeat(40);
const NOW = new Date('2026-10-06T12:00:00Z');

function at(root: string, rel: string): string {
  return path.join(root, ...rel.split('/'));
}

interface Scenario {
  beDirty?: string[];
  feDirty?: string[];
  bundleRequires?: string[];
  installed?: Record<string, string> | null;
  withoutPackagingFile?: string;
  extraPackagingFile?: string;
}

function world(s: Scenario = {}) {
  const packaging = 'apps/rt-edge/packaging/windows';
  const packageJson = JSON.stringify({ dependencies: { '@nestjs/common': '10.4.22', jose: '4.15.5', rxjs: '7.8.1' } });
  const files: Record<string, string | null> = {
    [at(ROOT, 'tools/ci/box-externals.baseline.json')]: JSON.stringify({ mainJsBytes: 100, externals: ['@nestjs/common', 'jose', 'rxjs'], neverOnTheBox: ['pg', 'ioredis'] }),
    [at(ROOT, 'tools/ci/box-externals-gate.js')]: '// gate',
    [at(ROOT, 'scripts/build-all-apps.js')]: '// build',
    [at(ROOT, 'node_modules/jest/bin/jest.js')]: '// jest',
    [at(ROOT, 'libs/feed-parse/src/version.ts')]: realVersionTs,
    [at(ROOT, 'libs/api-kernel/src/index.ts')]: 'export {};',
    [at(ROOT, 'dist/apps/rt-edge/main.js')]: (s.bundleRequires || ['@nestjs/common', 'jose', 'rxjs/operators', 'fs', 'node:crypto', './chunk'])
      .map((r) => 'module.exports = require("' + r + '");').join('\n'),
    [at(FE, 'node_modules/@angular/cli/bin/ng.js')]: '// ng',
    [at(FE, 'dist/edge/index.html')]: '<html>',
    [at(FE, 'dist/edge/main-abc.js')]: 'console.log(1)',
    [at(FE, 'dist/edge/.claude-flow/state.json')]: '{}',
  };
  for (const name of core.PACKAGING_FILES) {
    if (name === s.withoutPackagingFile) continue;
    files[at(ROOT, packaging + '/' + name)] = name === 'package.json' ? packageJson : name === 'package-lock.json' ? '{"lock":1}' : '# ' + name;
  }
  if (s.extraPackagingFile) files[at(ROOT, packaging + '/' + s.extraPackagingFile)] = 'x';
  if (s.installed) files[at('/wd/installed-box', 'package.json')] = JSON.stringify({ dependencies: s.installed });
  const fsx = memoryFs(files);
  const exec = fakeExec([
    gitRepo(ROOT, { head: BE_HEAD, dirty: s.beDirty || [] }),
    gitRepo(FE, { head: FE_HEAD, dirty: s.feDirty || [] }),
    (call: any) => (call.cmd === 'node' || /(^|[\\/])tar(\.exe)?$/.test(call.cmd) ? {} : undefined),
  ]);
  const log: string[] = [];
  const error: string[] = [];
  const deps = { repoRoot: ROOT, cwd: ROOT, exec, fs: fsx, env: {}, now: () => NOW, nodeVersion: 'v22.5.0', log: (l: string) => log.push(l), error: (l: string) => error.push(l) };
  return { fsx, exec, deps, log, error };
}

const builds = (exec: any) => exec.calls.filter((c: any) => c.cmd !== 'git').map((c: any) => [c.cmd, ...c.args].join(' ').split(path.sep).join('/'));

describe('tools/ci/package-box (core)', () => {
  it('a clean pair of trees gives a version without +wip and the full plan in order', () => {
    const w = world();
    const pre = core.preflight({}, w.deps);
    expect(pre.refusals).toEqual([]);
    expect(pre.ctx.version).toBe('20261006-aaaaaaaaa-bbbbbbbbb');
    expect(pre.ctx.wip).toBe(false);
    const labels = core.plan(pre.ctx, {}).map((s: any) => s.label.split(' ')[0]);
    expect(labels).toEqual(['G1', 'build', 'G6', 'build', 'stage', 'zip']);
    // The smoke verdict must be inside the zip, so --smoke runs between the stage and the zip.
    expect(core.plan(pre.ctx, { smoke: true }).map((s: any) => s.label.split(' ')[0])).toEqual(['G1', 'build', 'G6', 'build', 'stage', 'smoke', 'zip']);
  });

  it('refuses real uncommitted changes without --wip, sets tool-state noise aside, and stamps +wip with it', () => {
    const noisy = world({ beDirty: [' M .claude-flow/metrics/x.json', ' M src/app/.claude-flow/policy/state.json', '?? .swarm/backups/a.db', ' M .mcp.json'] });
    const noisyPre = core.preflight({}, noisy.deps);
    expect(noisyPre.refusals).toEqual([]);
    expect(noisyPre.ctx.wip).toBe(false);
    expect(noisyPre.ctx.backend.noise).toHaveLength(4);

    const dirty = world({ feDirty: [' M src/app/x.ts', 'R  a.ts -> b.ts'] });
    const refused = core.preflight({}, dirty.deps);
    expect(refused.refusals).toEqual([expect.stringContaining('FE working tree has uncommitted changes')]);
    expect(refused.refusals[0]).toContain('--wip');

    const wip = core.preflight({ wip: true }, dirty.deps);
    expect(wip.refusals).toEqual([]);
    expect(wip.ctx.version).toBe('20261006-aaaaaaaaa-bbbbbbbbb+wip');
    expect(wip.ctx.fe.real).toEqual(['src/app/x.ts', 'b.ts']);
    expect(wip.ctx.version.length).toBeLessThanOrEqual(core.BOX_VERSION_MAX);
  });

  it('refuses a launcher folder that is incomplete or carries an installed box file', () => {
    expect(core.preflight({}, world({ withoutPackagingFile: 'env-config.js' }).deps).refusals).toEqual([expect.stringContaining('missing env-config.js')]);
    expect(core.preflight({}, world({ extraPackagingFile: 'box.json' }).deps).refusals).toEqual([expect.stringContaining('box.json')]);
  });

  it('--dry-run prints the plan, writes and builds nothing, and exits 1 when a real run would refuse', async () => {
    const w = world({ beDirty: [' M libs/global/src/x.ts'] });
    expect(await core.main(['--dry-run'], w.deps)).toBe(1);
    expect(w.fsx.ops).toEqual([]);
    expect(builds(w.exec)).toEqual([]);
    expect(w.log.some((l) => l.includes('tools/ci/guards boundary.spec purity.spec'))).toBe(true);
    expect(w.error).toEqual([expect.stringContaining('would REFUSE'), expect.stringContaining('--wip')]);

    const clean = world();
    expect(await core.main(['--dry-run'], clean.deps)).toBe(0);
    expect(clean.fsx.ops).toEqual([]);
  });

  it('a full run executes the gates and builds in order, stages the package and writes release.json', async () => {
    const w = world();
    expect(await core.main([], w.deps)).toBe(0);
    expect(w.error).toEqual([]);

    const ran = builds(w.exec);
    expect(ran).toHaveLength(5);
    expect(ran[0]).toMatch(/jest\.js tools\/ci\/guards boundary\.spec purity\.spec$/);
    expect(ran[1]).toBe('node scripts/build-all-apps.js rt-edge');
    expect(ran[2]).toBe('node tools/ci/box-externals-gate.js --bundle dist/apps/rt-edge/main.js --box-package apps/rt-edge/packaging/windows/package.json');
    expect(ran[3]).toMatch(/ng\.js build --configuration edge$/);
    expect(w.exec.calls.find((c: any) => c.args[1] === 'build').opts.cwd).toBe(FE);
    expect(ran[4]).toMatch(/tar(\.exe)? -a -c -f .*20261006-aaaaaaaaa-bbbbbbbbb\.zip -C .*20261006-aaaaaaaaa-bbbbbbbbb \.$/);

    const stage = at(ROOT, 'dist/box/20261006-aaaaaaaaa-bbbbbbbbb');
    expect(w.fsx.existsSync(path.join(stage, 'main.js'))).toBe(true);
    expect(w.fsx.existsSync(path.join(stage, 'public', 'index.html'))).toBe(true);
    expect(w.fsx.existsSync(path.join(stage, 'public', 'main-abc.js'))).toBe(true);
    expect(w.fsx.existsSync(path.join(stage, 'public', '.claude-flow'))).toBe(false);
    for (const name of core.PACKAGING_FILES) expect({ name, staged: w.fsx.existsSync(path.join(stage, name)) }).toEqual({ name, staged: true });
    for (const name of core.NEVER_PACKAGED) expect({ name, staged: w.fsx.existsSync(path.join(stage, name)) }).toEqual({ name, staged: false });

    const release = JSON.parse(w.fsx.readFileSync(path.join(stage, 'release.json'), 'utf8'));
    expect(release).toEqual(expect.objectContaining({
      schemaVersion: 2,
      version: '20261006-aaaaaaaaa-bbbbbbbbb',
      backendCommit: 'aaaaaaaaa',
      feCommit: 'bbbbbbbbb',
      backendCommitFull: BE_HEAD,
      wip: false,
      externals: ['@nestjs/common', 'jose', 'rxjs'],
      externalsNew: [],
      depsChanged: false,
      depsComparedTo: null,
      gates: { g1: 'passed', g6: 'passed' },
      node: 'v22.5.0',
      builtAt: NOW.toISOString(),
    }));
    expect(release.FEED_PARSE_VERSION).toMatch(/^\d+\.\d+\.\d+/);
    expect(release.public).toEqual({ files: 2, bytes: expect.any(Number), sha256: expect.stringMatching(/^[0-9a-f]{64}$/) });
    expect(release.mainSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(release.libsHash).toMatch(/^[0-9a-f]{64}$/);
    expect(release.sizeDeltaBytes).toBe(release.mainJsBytes - 100);
    expect(w.log.find((l) => l.includes('STAGED'))).toContain('STAGED dist/box/20261006-aaaaaaaaa-bbbbbbbbb');
  });

  it('depsChanged follows a new external against the baseline and a package.json that differs from the installed box', async () => {
    const extra = world({ bundleRequires: ['@nestjs/common', 'jose', 'rxjs', 'left-pad'] });
    expect(await core.main(['--skip-gates'], extra.deps)).toBe(0);
    const r1 = JSON.parse(extra.fsx.readFileSync(at(ROOT, 'dist/box/20261006-aaaaaaaaa-bbbbbbbbb/release.json'), 'utf8'));
    expect(r1.externalsNew).toEqual(['left-pad']);
    expect(r1.depsChanged).toBe(true);

    // A new external the installed box already pins (Phase 4's class-validator) needs no install.
    const pinned = world({ bundleRequires: ['@nestjs/common', 'jose', 'rxjs', 'left-pad'], installed: { '@nestjs/common': '10.4.22', jose: '4.15.5', rxjs: '7.8.1', 'left-pad': '1.3.0' } });
    expect(await core.main(['--skip-gates', '--installed', '/wd/installed-box'], pinned.deps)).toBe(0);
    const r3 = JSON.parse(pinned.fsx.readFileSync(at(ROOT, 'dist/box/20261006-aaaaaaaaa-bbbbbbbbb/release.json'), 'utf8'));
    expect([r3.externalsNew, r3.externalsToInstall, r3.depsDiff, r3.depsChanged]).toEqual([['left-pad'], [], ['left-pad: 1.3.0 -> absent'], true]);

    const older = world({ installed: { '@nestjs/common': '10.4.22', jose: '4.15.4', rxjs: '7.8.1', 'socket.io': '4.7.5' } });
    expect(await core.main(['--installed', '/wd/installed-box'], older.deps)).toBe(0);
    const r2 = JSON.parse(older.fsx.readFileSync(at(ROOT, 'dist/box/20261006-aaaaaaaaa-bbbbbbbbb/release.json'), 'utf8'));
    expect(r2.depsChanged).toBe(true);
    expect(r2.depsDiff).toEqual(['jose: 4.15.4 -> 4.15.5', 'socket.io: 4.7.5 -> absent']);
    expect(r2.depsComparedTo).toBe(path.resolve('/wd/installed-box').split(path.sep).join('/'));
    expect(r2.install.npmCi).toContain('npm ci --omit=dev');
  });

  it('a bundle that requires a live-kernel package never stages, even when the gate step was skipped', async () => {
    const w = world({ bundleRequires: ['@nestjs/common', 'pg'] });
    expect(await core.main(['--skip-gates'], w.deps)).toBe(1);
    expect(w.error[0]).toContain('pg');
    expect(w.error[0]).toContain('never be on the box');
  });

  it('the skip flags shrink the plan to the stage alone and --no-zip drops the archive', () => {
    const w = world();
    const pre = core.preflight({ skipGates: true, skipBeBuild: true, skipFeBuild: true, noZip: true }, w.deps);
    expect(pre.refusals).toEqual([]);
    expect(core.plan(pre.ctx, { skipGates: true, skipBeBuild: true, skipFeBuild: true, noZip: true }).map((s: any) => s.label)).toEqual(['stage dist/box/20261006-aaaaaaaaa-bbbbbbbbb']);
    const noBundle = world();
    noBundle.fsx.rmSync(at(ROOT, 'dist/apps/rt-edge/main.js'));
    expect(core.preflight({ skipBeBuild: true }, noBundle.deps).refusals).toEqual([expect.stringContaining('--skip-be-build')]);
  });

  it('usage errors exit 2 and --help exits 0', async () => {
    const w = world();
    expect(await core.main(['--bogus'], w.deps)).toBe(2);
    expect(await core.main(['--help'], w.deps)).toBe(0);
    expect(w.log[0]).toBe(core.USAGE);
  });

  it('externalsOf names packages, not builtins, node: specifiers, deep paths or relative chunks', () => {
    expect(core.externalsOf('require("@nestjs/common/x"); require("rxjs/operators"); require("fs"); require("node:crypto"); require("./chunk"); require("jose"); require("jose")')).toEqual(['@nestjs/common', 'jose', 'rxjs']);
    expect(core.packageOf('serialport')).toBe('serialport');
    expect(core.packageOf('node:sqlite')).toBeNull();
    expect(core.packageOf('fs/promises')).toBeNull();
  });

  it('--smoke: the settings file takes the smoke ports and a cloud that cannot exist, keeping every other template line', () => {
    const template = '# note\nNODE_ENV=production\nBOX_NAME=New venue box\nPORT=4000\nTCP_PORT=2600\nLIVE_URL=https://etabella.net\n';
    const env = smoke.smokeEnv(template);
    expect(env).toContain('# note\nNODE_ENV=production\n');
    expect(env).toContain('BOX_NAME=Package smoke test\n');
    expect(env).toContain('PORT=4100\n');
    expect(env).toContain('TCP_PORT=5655\n');
    expect(env).toContain('LIVE_URL=https://smoke.invalid\n');
    expect(env).toContain('CONSOLE_PORT=2701\n'); // appended: the template lacked it
    expect(env.match(/^PORT=/gm)).toHaveLength(1);
  });

  it('--smoke: the judge accepts what a never-enrolled box answers and refuses a missing route or a crash', () => {
    const ok = {
      envConfig: { exitCode: 0 },
      status: { exitCode: 0, json: { linked: false } },
      ping: { code: 200, json: { msg: 1, cloudLinked: false } },
      index: { code: 200, body: '<!doctype html>\n<html>' },
      config: { code: 404, json: { msg: -1, error: 'not_found', message: 'the box is not configured yet (no identity)' } },
      localStatus: { code: 503, json: { msg: -1, error: 'box_not_configured', message: 'the box has no identity' } },
      serve: { exit: { code: null, signal: 'SIGTERM', beforeKill: false } },
    };
    expect(smoke.judge(ok)).toEqual([]);
    // An enrolled staging box: config served, status wants a sign-in.
    expect(smoke.judge({ ...ok, config: { code: 200, json: { signIn: 'password' } }, localStatus: { code: 401, json: null } })).toEqual([]);
    // The route is gone (the generic 404), the box crashed (500), the FE build is missing, the box died on its own.
    expect(smoke.judge({ ...ok, config: { code: 404, json: { msg: -1, error: 'not_found', message: 'no such route' } } })).toEqual([expect.stringContaining('/edge-config.json answered 404 not_found')]);
    expect(smoke.judge({ ...ok, localStatus: { code: 500, json: { msg: -1, error: 'server_error', message: 'x' } } })).toEqual([expect.stringContaining('/edge/local/status answered 500 server_error')]);
    expect(smoke.judge({ ...ok, localStatus: { code: 404, json: { msg: -1, error: 'not_found', message: 'no such route' } } })).toEqual([expect.stringContaining('404 means the route is gone')]);
    expect(smoke.judge({ ...ok, index: { code: 200, body: '{"msg":-1}' } })).toEqual([expect.stringContaining('index.html')]);
    expect(smoke.judge({ ...ok, ping: { code: null, error: 'ECONNREFUSED' } })).toEqual([expect.stringContaining('/edge/ping answered nothing (ECONNREFUSED)')]);
    expect(smoke.judge({ ...ok, serve: { exit: { code: 70, signal: null, beforeKill: true } } })).toEqual([expect.stringContaining('exited by itself with code 70')]);
  });

  it('porcelain paths take the new name of a rename and the noise list matches the tool-state files of both repos', () => {
    expect(core.porcelainPath('R  old/a.ts -> new/b.ts')).toBe('new/b.ts');
    expect(core.porcelainPath('?? dir/file')).toBe('dir/file');
    const { real, noise } = core.splitNoise(['.claude-flow/daemon.pid', 'src/app/features/.claude-flow/neural/stats.json', '.swarm/x.db', '.mcp.json', '.vscode/mcp.json', 'TODOS.md', 'src/app/x.ts']);
    expect(noise).toHaveLength(5);
    expect(real).toEqual(['TODOS.md', 'src/app/x.ts']);
  });
});
