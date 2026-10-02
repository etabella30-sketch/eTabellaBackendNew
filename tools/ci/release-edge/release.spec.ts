import * as crypto from 'crypto';
import * as path from 'path';
import { main, preflight, GATE_SCRIPT, USAGE } from './release';
import { layerDockerfile } from './components';
import { memoryFs, fakeExec, gitRepo } from './spec-fakes';

/*
 * Every spec runs against an in-memory fs and an exec that throws on any
 * command it was not given a handler for, so nothing here reaches git,
 * docker, node or the disk.
 */

const REPO = path.resolve('/work/backend');
const FE = path.resolve('/work/fe');
const HEAD = 'a'.repeat(40);
const FE_HEAD = 'b'.repeat(40);
const TAG = 'rt-edge-v1.0.0';
const RELEASE_DIR = path.join(REPO, 'dist', 'release', TAG);
const MANIFEST = path.join(RELEASE_DIR, 'manifest.json');
const IMAGE_ID = 'sha256:' + 'c'.repeat(64);
const BASE_ID = 'sha256:' + 'd'.repeat(64);
const NG_BIN = path.join(FE, 'node_modules', '@angular', 'cli', 'bin', 'ng.js');
const PACKAGE_JSON = '{"name":"etabella-backend","dependencies":{"pg":"^8.11.0"}}';
const PACKAGE_LOCK = '{"lockfileVersion":3,"packages":{}}';

const sha = (s: string) => crypto.createHash('sha256').update(s).digest('hex');
/** `sha256sum package-lock.json package.json | sha256sum` of the tagged tree. */
const DEPS_SHA = sha(sha(PACKAGE_LOCK) + '  package-lock.json\n' + sha(PACKAGE_JSON) + '  package.json\n');
const BASE_INSPECT = 'docker image inspect monorepo-base:latest --format {{.Id}} {{json .Config.Labels}}';
const IMAGE_INSPECT = `docker image inspect etabella/rt-edge:${TAG} --format {{.Id}} {{json .Config.Labels}}`;
const REBUILD_BASE = `docker build --label com.etabella.deps-sha256=${DEPS_SHA} -t monorepo-base:latest -f docker/microservices/monorepo-base.Dockerfile .`;
const inspected = (id: string, labels: Record<string, string> | null) => ({ stdout: id + ' ' + JSON.stringify(labels) + '\n' });

function angularJson(withEdge: boolean) {
  const configurations: Record<string, object> = { production: {}, net: {} };
  if (withEdge) configurations.edge = { fileReplacements: [] };
  return JSON.stringify({
    projects: {
      etabella: { projectType: 'application', architect: { build: { builder: '@angular/build:application', configurations } } },
    },
  });
}

/** Today's trees: no apps/rt-edge, no FE "edge" configuration. */
function todayFiles(): Record<string, string | null> {
  return {
    [path.join(REPO, 'tools', 'ci', 'golden-replay-gate.js')]: '// gate',
    [path.join(REPO, 'libs', 'feed-parse', 'src', 'version.ts')]: "export const FEED_PARSE_VERSION = '1.0.0';\n",
    [path.join(REPO, 'nest-cli.json')]: JSON.stringify({ projects: { 'realtime-server': { type: 'application' } } }),
    [path.join(FE, 'angular.json')]: angularJson(false),
  };
}

/** Both components present: apps/rt-edge, its nest project, the package files, the FE edge configuration and FE deps. */
function fullFiles(): Record<string, string | null> {
  return {
    ...todayFiles(),
    [path.join(REPO, 'apps', 'rt-edge')]: null,
    [path.join(REPO, 'nest-cli.json')]: JSON.stringify({ projects: { 'rt-edge': { type: 'application' } } }),
    [path.join(REPO, 'package.json')]: PACKAGE_JSON,
    [path.join(REPO, 'package-lock.json')]: PACKAGE_LOCK,
    [path.join(FE, 'angular.json')]: angularJson(true),
    [NG_BIN]: '// ng',
  };
}

type Handler = (call: any) => any;

interface Setup {
  files?: Record<string, string | null>;
  backend?: { head: string; dirty?: string[]; tags?: { name: string; annotated: boolean }[] };
  fe?: { head: string; dirty?: string[] };
  env?: Record<string, string>;
  handlers?: (fs: any) => Handler[];
}

function setup(s: Setup = {}) {
  const fs = memoryFs(s.files ?? todayFiles());
  const exec = fakeExec([
    gitRepo(REPO, s.backend ?? { head: HEAD, tags: [{ name: TAG, annotated: true }] }),
    gitRepo(FE, s.fe ?? { head: FE_HEAD }),
    ...(s.handlers ? s.handlers(fs) : []),
  ]);
  const out: string[] = [];
  const err: string[] = [];
  const deps = {
    repoRoot: REPO,
    cwd: REPO,
    fs,
    exec,
    env: s.env ?? {},
    now: () => new Date('2026-10-01T10:00:00.000Z'),
    nodeVersion: 'v20.11.1',
    log: (l: string) => out.push(l),
    error: (l: string) => err.push(l),
  };
  return { deps, fs, exec, out, err, all: () => out.concat(err).join('\n') };
}

const gate = (status: number): Handler => (c) =>
  c.cmd === 'node' && c.args[0] === GATE_SCRIPT ? { status } : undefined;

/**
 * docker + node handlers for a full build; the ng build drops two files where
 * Angular would. The base carries the tag's deps label and the image inherits it.
 */
function buildHandlers(fs: any, over: { dockerBuildFails?: boolean; pushFails?: boolean } = {}): Handler[] {
  const labels = { 'etabella.role': 'monorepo-base', 'com.etabella.deps-sha256': DEPS_SHA };
  return [
    gate(0),
    (c) => (c.line === 'docker version --format {{.Server.Version}}' ? { stdout: '27.3.1\n' } : undefined),
    (c) => (c.line === BASE_INSPECT ? inspected(BASE_ID, labels) : undefined),
    (c) => {
      if (c.cmd !== 'node' || c.args[0] !== NG_BIN) return undefined;
      const out = c.args[c.args.indexOf('--output-path') + 1];
      fs.writeFileSync(path.join(out, 'browser', 'index.html'), '<html></html>');
      fs.writeFileSync(path.join(out, 'browser', 'main.js'), 'boot()');
      return { status: 0 };
    },
    (c) => (c.cmd === 'node' && c.args[0] === 'scripts/build-all-apps.js' ? { status: 0 } : undefined),
    (c) => (c.cmd === 'docker' && c.args[0] === 'build' ? { status: over.dockerBuildFails ? 1 : 0 } : undefined),
    (c) => (c.line === IMAGE_INSPECT ? inspected(IMAGE_ID, { ...labels, 'com.etabella.feed-parse-version': '1.0.0' }) : undefined),
    (c) => (c.cmd === 'docker' && c.args[0] === 'tag' ? { status: 0 } : undefined),
    (c) => (c.cmd === 'docker' && c.args[0] === 'push' ? { status: over.pushFails ? 1 : 0 } : undefined),
    (c) =>
      c.cmd === 'docker' && c.args[0] === 'image' && c.args.includes('{{json .RepoDigests}}')
        ? { stdout: JSON.stringify([`registry.example.com/etabella/rt-edge@sha256:${'e'.repeat(64)}`]) + '\n' }
        : undefined,
  ];
}

const nonGit = (exec: any) => exec.calls.filter((c: any) => c.cmd !== 'git');
const manifestOf = (fs: any) => JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));

describe('release-edge arguments', () => {
  it('requires --fe', () => {
    const t = setup();
    expect(main([], t.deps)).toBe(2);
    expect(t.all()).toContain('--fe <path to the Angular repo> is required');
    expect(t.exec.calls).toEqual([]);
  });

  it('rejects an unknown option with the usage text', () => {
    const t = setup();
    expect(main(['--fe', FE, '--force'], t.deps)).toBe(2);
    expect(t.all()).toContain('unknown option: --force');
    expect(t.all()).toContain(USAGE);
  });

  it('prints the usage for --help and does nothing else', () => {
    const t = setup();
    expect(main(['--help'], t.deps)).toBe(0);
    expect(t.out.join('\n')).toBe(USAGE);
    expect(t.exec.calls).toEqual([]);
  });

  it('resolves --fe against the working directory', () => {
    const t = setup();
    const pre = preflight({ fe: '../fe' }, { ...t.deps, cwd: path.join(path.resolve('/work'), 'backend') });
    expect(pre.ctx.feRoot).toBe(FE);
  });
});

describe('release-edge refusals', () => {
  const refusedWith = (t: ReturnType<typeof setup>, argv: string[], text: string | RegExp) => {
    expect(main(argv, t.deps)).toBe(1);
    expect(t.err[0]).toBe('release-edge: REFUSED:');
    expect(t.err.join('\n')).toMatch(text);
    // A refusal happens before the gate, any build, any write and any push.
    expect(nonGit(t.exec)).toEqual([]);
    expect(t.fs.ops).toEqual([]);
  };

  it('refuses a dirty backend tree', () => {
    const t = setup({ backend: { head: HEAD, tags: [{ name: TAG, annotated: true }], dirty: [' M apps/realtime-server/src/main.ts', '?? notes.txt'] } });
    refusedWith(t, ['--fe', FE, '--allow-missing'], 'backend working tree is not clean (2 change(s)): M apps/realtime-server/src/main.ts, ?? notes.txt');
  });

  it('refuses an untagged HEAD', () => {
    const t = setup({ backend: { head: HEAD, tags: [] } });
    refusedWith(t, ['--fe', FE, '--allow-missing'], `HEAD (${HEAD.slice(0, 9)}) is not at a tag; tag the release first (git tag -a <name>)`);
  });

  it('refuses a HEAD that carries only a lightweight tag', () => {
    const t = setup({ backend: { head: HEAD, tags: [{ name: 'v1', annotated: false }] } });
    refusedWith(t, ['--fe', FE, '--allow-missing'], 'carries only lightweight tag(s) v1; a release needs an annotated tag (git tag -a)');
  });

  it('refuses two annotated tags on HEAD unless --tag picks one', () => {
    const tags = [{ name: 'rt-edge-v1.0.0', annotated: true }, { name: 'rt-edge-v1.0.0-rc1', annotated: true }];
    const t = setup({ backend: { head: HEAD, tags } });
    refusedWith(t, ['--fe', FE, '--allow-missing'], 'carries 2 annotated tags (rt-edge-v1.0.0, rt-edge-v1.0.0-rc1); choose one with --tag');

    const picked = setup({ backend: { head: HEAD, tags } });
    expect(preflight({ fe: FE, tag: 'rt-edge-v1.0.0-rc1', allowMissing: true }, picked.deps).ctx.tag).toBe('rt-edge-v1.0.0-rc1');
  });

  it('refuses a --tag that is not on HEAD, or is lightweight', () => {
    const t = setup({ backend: { head: HEAD, tags: [{ name: TAG, annotated: true }, { name: 'light', annotated: false }] } });
    refusedWith(t, ['--fe', FE, '--tag', 'rt-edge-v0.9.0', '--allow-missing'], `tag rt-edge-v0.9.0 does not point at HEAD (${HEAD.slice(0, 9)})`);
    const t2 = setup({ backend: { head: HEAD, tags: [{ name: TAG, annotated: true }, { name: 'light', annotated: false }] } });
    refusedWith(t2, ['--fe', FE, '--tag', 'light', '--allow-missing'], 'tag light is a lightweight tag');
  });

  it('refuses a tag that cannot name an image or a folder', () => {
    const t = setup({ backend: { head: HEAD, tags: [{ name: 'edge/v1', annotated: true }] } });
    refusedWith(t, ['--fe', FE, '--allow-missing'], 'tag edge/v1 cannot name an image or a release folder');
  });

  it('refuses a dirty FE tree and a missing FE path', () => {
    const t = setup({ fe: { head: FE_HEAD, dirty: [' M src/app/app.ts'] } });
    const posix = (p: string) => p.split(path.sep).join('/');
    refusedWith(t, ['--fe', FE, '--allow-missing'], `FE working tree ${posix(FE)} is not clean (1 change(s)): M src/app/app.ts`);

    const gone = path.resolve('/work/no-such-fe');
    const t2 = setup();
    refusedWith(t2, ['--fe', gone, '--allow-missing'], `--fe ${posix(gone)} does not exist`);
  });

  it('refuses when the golden replay gate is missing, even with --allow-missing', () => {
    const files = todayFiles();
    delete files[path.join(REPO, 'tools', 'ci', 'golden-replay-gate.js')];
    const t = setup({ files });
    refusedWith(t, ['--fe', FE, '--allow-missing'], 'golden replay gate missing: tools/ci/golden-replay-gate.js does not exist; a release cannot run without it (D13)');
  });

  it('refuses when FEED_PARSE_VERSION cannot be read', () => {
    const files = todayFiles();
    files[path.join(REPO, 'libs', 'feed-parse', 'src', 'version.ts')] = 'export const OTHER = 1;';
    const t = setup({ files });
    refusedWith(t, ['--fe', FE, '--allow-missing'], /version\.ts: no `export const FEED_PARSE_VERSION/);
  });

  it('refuses missing components without --allow-missing and names each one', () => {
    const t = setup();
    refusedWith(t, ['--fe', FE], 'component fe-edge is missing (not built yet: no "edge" build configuration in the FE angular.json); pass --allow-missing');
    expect(t.err.join('\n')).toContain('component rt-edge is missing (not built yet: apps/rt-edge missing); pass --allow-missing');
  });

  it('refuses a component that exists but cannot be built, even with --allow-missing', () => {
    const files = fullFiles();
    delete files[NG_BIN];
    files[path.join(REPO, 'nest-cli.json')] = JSON.stringify({ projects: {} });
    const t = setup({ files, handlers: () => [] });
    refusedWith(t, ['--fe', FE, '--allow-missing'], 'component fe-edge cannot be built: FE dependencies are not installed');
    expect(t.err.join('\n')).toContain('component rt-edge cannot be built: apps/rt-edge exists but nest-cli.json has no "rt-edge" application project');
  });

  it('refuses when docker or the base image is unavailable', () => {
    const noDocker = setup({
      files: fullFiles(),
      handlers: () => [(c) => (c.cmd === 'docker' ? { status: null, error: 'spawnSync docker ENOENT' } : undefined)],
    });
    expect(main(['--fe', FE], noDocker.deps)).toBe(1);
    expect(noDocker.err.join('\n')).toContain('component rt-edge cannot be built: docker is not reachable: spawnSync docker ENOENT');

    const noBase = setup({
      files: fullFiles(),
      handlers: () => [
        (c) => (c.line === 'docker version --format {{.Server.Version}}' ? { stdout: '27\n' } : undefined),
        (c) => (c.line.startsWith('docker image inspect monorepo-base:latest') ? { status: 1, stderr: 'No such image' } : undefined),
      ],
    });
    expect(main(['--fe', FE], noBase.deps)).toBe(1);
    expect(noBase.err.join('\n')).toContain('base image monorepo-base:latest not found; build it first: ' + REBUILD_BASE);
    // Only read-only docker queries ran.
    expect(nonGit(noBase.exec).map((c: any) => c.args.slice(0, 2).join(' '))).toEqual(['version --format', 'image inspect']);
  });

  describe('the base image must be built from the tag\'s package.json and package-lock.json', () => {
    const withBase = (labels: Record<string, string> | null) =>
      setup({
        files: fullFiles(),
        handlers: () => [
          (c) => (c.line === 'docker version --format {{.Server.Version}}' ? { stdout: '27\n' } : undefined),
          (c) => (c.line === BASE_INSPECT ? inspected(BASE_ID, labels) : undefined),
        ],
      });

    it('refuses a base image with no deps label (built by hand, or docker load), with the rebuild command', () => {
      for (const labels of [null, { 'etabella.role': 'monorepo-base' }]) {
        const t = withBase(labels);
        expect(main(['--fe', FE, '--allow-missing'], t.deps)).toBe(1);
        expect(t.err.join('\n')).toContain(
          'component rt-edge cannot be built: base image monorepo-base:latest does not say which package files it was built from'
          + ' (no com.etabella.deps-sha256 label); rebuild it from this tag: ' + REBUILD_BASE,
        );
        expect(nonGit(t.exec).map((c: any) => c.line)).toEqual(['docker version --format {{.Server.Version}}', BASE_INSPECT]);
        expect(t.fs.ops).toEqual([]);
      }
    });

    it('refuses a base image built from other package files', () => {
      const other = 'f'.repeat(64);
      const t = withBase({ 'com.etabella.deps-sha256': other });
      expect(main(['--fe', FE, '--allow-missing'], t.deps)).toBe(1);
      expect(t.err.join('\n')).toContain(
        `base image monorepo-base:latest was built from other package files (com.etabella.deps-sha256 ${other.slice(0, 12)}…, this tag ${DEPS_SHA.slice(0, 12)}…); rebuild it from this tag: ${REBUILD_BASE}`,
      );
    });

    it('follows the package files: a changed package-lock.json makes the same base image stale', () => {
      const files = fullFiles();
      files[path.join(REPO, 'package-lock.json')] = '{"lockfileVersion":3,"packages":{"node_modules/pg":{}}}';
      const t = setup({ files, handlers: (fs) => buildHandlers(fs) });
      expect(main(['--fe', FE, '--dry-run'], t.deps)).toBe(1);
      expect(t.err.join('\n')).toContain('base image monorepo-base:latest was built from other package files');
    });

    it('refuses when package-lock.json is missing, before asking docker anything', () => {
      const files = fullFiles();
      delete files[path.join(REPO, 'package-lock.json')];
      const t = setup({ files, handlers: () => [] });
      expect(main(['--fe', FE, '--allow-missing'], t.deps)).toBe(1);
      expect(t.err.join('\n')).toContain('component rt-edge cannot be built: cannot hash package.json and package-lock.json: file missing: '
        + path.join(REPO, 'package-lock.json'));
      expect(nonGit(t.exec)).toEqual([]);
    });

    it('refuses output it cannot read rather than guess', () => {
      const t = setup({
        files: fullFiles(),
        handlers: () => [
          (c) => (c.line === 'docker version --format {{.Server.Version}}' ? { stdout: '27\n' } : undefined),
          (c) => (c.line === BASE_INSPECT ? { stdout: BASE_ID + ' {not json\n' } : undefined),
        ],
      });
      expect(main(['--fe', FE, '--allow-missing'], t.deps)).toBe(1);
      expect(t.err.join('\n')).toContain('component rt-edge cannot be built: cannot read the labels of monorepo-base:latest');
    });
  });

  it('refuses --push without REGISTRY, or with a URL instead of a registry', () => {
    const t = setup();
    refusedWith(t, ['--fe', FE, '--allow-missing', '--push'], '--push needs the REGISTRY environment variable');
    const t2 = setup({ env: { REGISTRY: 'https://registry.example.com' } });
    refusedWith(t2, ['--fe', FE, '--allow-missing', '--push'], 'REGISTRY "https://registry.example.com" is not a registry host[/namespace]');
  });

  it('lists every reason at once', () => {
    const t = setup({ backend: { head: HEAD, tags: [], dirty: ['?? x'] }, fe: { head: FE_HEAD, dirty: ['?? y'] } });
    expect(main(['--fe', FE], t.deps)).toBe(1);
    expect(t.err.filter((l) => l.startsWith('  - '))).toHaveLength(5);
  });
});

describe('release-edge --dry-run', () => {
  it('prints checks, plan and manifest, and runs, builds, writes and pushes nothing', () => {
    const t = setup({ env: { REGISTRY: 'registry.example.com/etabella' } });
    expect(main(['--fe', FE, '--allow-missing', '--dry-run', '--push'], t.deps)).toBe(0);
    const text = t.out.join('\n');
    expect(t.out[0]).toBe('release-edge: DRY RUN: nothing is run, built, written or pushed.');
    expect(text).toContain('1. node tools/ci/golden-replay-gate.js');
    expect(text).toContain('skip fe-edge: not built yet: no "edge" build configuration in the FE angular.json');
    expect(text).toContain('skip rt-edge: not built yet: apps/rt-edge missing');
    expect(text).toContain(`write dist/release/${TAG}/manifest.json`);
    expect(text).toContain('push: nothing to push (no image is built)');
    expect(text).toContain(`a real run would release ${TAG}.`);
    const json = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
    expect(json).toMatchObject({
      tag: TAG,
      backendCommit: HEAD,
      feCommit: FE_HEAD,
      FEED_PARSE_VERSION: '1.0.0',
      gate: { script: GATE_SCRIPT, exitCode: null },
      components: [
        { name: 'fe-edge', status: 'missing' },
        { name: 'rt-edge', status: 'missing' },
      ],
      push: { requested: true, registry: 'registry.example.com/etabella', status: 'would-push' },
    });
    expect(nonGit(t.exec)).toEqual([]);
    expect(t.fs.ops).toEqual([]);
  });

  it('shows every build step when both components exist, without running one', () => {
    const t = setup({ files: fullFiles(), handlers: (fs) => buildHandlers(fs) });
    expect(main(['--fe', FE, '--dry-run'], t.deps)).toBe(0);
    const plan = t.out.filter((l) => /^ {2}\d+\. /.test(l)).map((l) => l.replace(/^ {2}\d+\. /, ''));
    // Paths outside the backend root print absolute, inside it relative; '/' either way.
    const ng = NG_BIN.split(path.sep).join('/');
    const feOut = path.relative(REPO, path.join(RELEASE_DIR, 'fe-edge')).split(path.sep).join('/');
    expect(plan).toEqual([
      'node tools/ci/golden-replay-gate.js   (exit 0 = pass; anything else blocks the release)',
      `remove ${feOut}`,
      `(in ${FE.split(path.sep).join('/')}) node ${ng} build etabella --configuration edge --output-path ${feOut}`,
      'node scripts/build-all-apps.js rt-edge',
      `docker build -f docker/microservices/service.Dockerfile --build-arg APP_NAME=rt-edge -t etabella/rt-edge-app:${TAG} .`,
      `write dist/release/${TAG}/rt-edge.Dockerfile`,
      `docker build -f dist/release/${TAG}/rt-edge.Dockerfile -t etabella/rt-edge:${TAG} dist/release/${TAG}`,
      `write dist/release/${TAG}/manifest.json`,
      'no push (pass --push with REGISTRY set to push)',
    ]);
    // Only the read-only docker preflight ran.
    expect(nonGit(t.exec).map((c: any) => c.line)).toEqual([
      'docker version --format {{.Server.Version}}',
      BASE_INSPECT,
    ]);
    expect(t.fs.ops).toEqual([]);
    const text = t.out.join('\n');
    const json = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
    expect(json.components[1]).toEqual({
      name: 'rt-edge',
      kind: 'docker-image',
      status: 'would-build',
      baseImage: 'monorepo-base:latest',
      baseImageId: BASE_ID,
      depsSha256: DEPS_SHA,
    });
  });

  it('exits 1 and lists the refusals when a real run would refuse', () => {
    const t = setup({ backend: { head: HEAD, tags: [] } });
    expect(main(['--fe', FE, '--dry-run'], t.deps)).toBe(1);
    expect(t.err[0]).toBe('release-edge: a real run would REFUSE:');
    expect(t.err.join('\n')).toContain('is not at a tag');
    expect(t.out.join('\n')).toContain('"tag": null');
    expect(nonGit(t.exec)).toEqual([]);
    expect(t.fs.ops).toEqual([]);
  });
});

describe('release-edge run', () => {
  it('stops when the golden replay gate fails: nothing built, no manifest', () => {
    const t = setup({ handlers: () => [gate(3)] });
    expect(main(['--fe', FE, '--allow-missing'], t.deps)).toBe(1);
    expect(t.err.join('\n')).toContain('BLOCKED: the golden replay gate exited 3; nothing was built.');
    expect(nonGit(t.exec).map((c: any) => c.line)).toEqual(['node tools/ci/golden-replay-gate.js']);
    expect(nonGit(t.exec)[0].opts).toMatchObject({ cwd: REPO, inherit: true });
    expect(t.fs.ops).toEqual([]);
  });

  it('stops when the gate cannot start', () => {
    const t = setup({ handlers: () => [(c) => (c.cmd === 'node' ? { status: null, error: 'spawn EPERM' } : undefined)] });
    expect(main(['--fe', FE, '--allow-missing'], t.deps)).toBe(1);
    expect(t.err.join('\n')).toContain('the golden replay gate did not run (spawn EPERM)');
    expect(t.fs.ops).toEqual([]);
  });

  it('writes the manifest with both components missing under --allow-missing', () => {
    const t = setup({ handlers: () => [gate(0)] });
    expect(main(['--fe', FE, '--allow-missing'], t.deps)).toBe(0);
    expect(manifestOf(t.fs)).toEqual({
      schemaVersion: 1,
      tag: TAG,
      backendCommit: HEAD,
      feCommit: FE_HEAD,
      FEED_PARSE_VERSION: '1.0.0',
      node: 'v20.11.1',
      createdAt: '2026-10-01T10:00:00.000Z',
      gate: { script: 'tools/ci/golden-replay-gate.js', exitCode: 0 },
      allowMissing: true,
      components: [
        { name: 'fe-edge', kind: 'fe-bundle', status: 'missing', reason: 'not built yet: no "edge" build configuration in the FE angular.json' },
        { name: 'rt-edge', kind: 'docker-image', status: 'missing', reason: 'not built yet: apps/rt-edge missing' },
      ],
      push: { requested: false, registry: null, status: 'not-requested', images: [] },
    });
    expect(t.fs.ops).toEqual([['mkdir', RELEASE_DIR], ['write', MANIFEST]]);
    expect(t.out.join('\n')).toContain(`RELEASED ${TAG} (FEED_PARSE_VERSION 1.0.0)`);
  });

  it('does not push when REGISTRY is set but --push is not given', () => {
    const t = setup({ env: { REGISTRY: 'registry.example.com/etabella' }, handlers: () => [gate(0)] });
    expect(main(['--fe', FE, '--allow-missing'], t.deps)).toBe(0);
    expect(t.out.join('\n')).toContain('REGISTRY is set but --push was not given; nothing pushed.');
    expect(manifestOf(t.fs).push.status).toBe('not-requested');
  });

  it('builds the FE bundle, then the image with the bundle layered in, and records both', () => {
    const t = setup({ files: fullFiles(), handlers: (fs) => buildHandlers(fs) });
    expect(main(['--fe', FE], t.deps)).toBe(0);

    expect(nonGit(t.exec).map((c: any) => c.cmd + ' ' + c.args[0] + (c.args[1] ? ' ' + c.args[1] : ''))).toEqual([
      'docker version --format',
      'docker image inspect',
      'node tools/ci/golden-replay-gate.js',
      `node ${NG_BIN} build`,
      'node scripts/build-all-apps.js rt-edge',
      'docker build -f',
      'docker build -f',
      'docker image inspect',
    ]);
    const ngCall = nonGit(t.exec)[3];
    expect(ngCall.args).toEqual([NG_BIN, 'build', 'etabella', '--configuration', 'edge', '--output-path', path.join(RELEASE_DIR, 'fe-edge')]);
    expect(ngCall.opts).toMatchObject({ cwd: FE, inherit: true, env: { NG_CLI_ANALYTICS: 'false' } });
    const layerBuild = nonGit(t.exec)[6];
    expect(layerBuild.args).toEqual(['build', '-f', path.join(RELEASE_DIR, 'rt-edge.Dockerfile'), '-t', `etabella/rt-edge:${TAG}`, RELEASE_DIR]);

    expect(t.fs.readFileSync(path.join(RELEASE_DIR, 'rt-edge.Dockerfile'), 'utf8')).toBe(
      [
        `# Generated by tools/ci/release-edge.js for ${TAG}. Not checked in.`,
        `FROM etabella/rt-edge-app:${TAG}`,
        'COPY fe-edge/browser/ /usr/src/app/fe-edge/',
        `LABEL org.opencontainers.image.version="${TAG}" \\`,
        `      org.opencontainers.image.revision="${HEAD}" \\`,
        `      com.etabella.fe-commit="${FE_HEAD}" \\`,
        '      com.etabella.feed-parse-version="1.0.0"',
        '',
      ].join('\n'),
    );

    const lines = sha('<html></html>') + '  index.html\n' + sha('boot()') + '  main.js\n';
    expect(manifestOf(t.fs).components).toEqual([
      {
        name: 'fe-edge',
        kind: 'fe-bundle',
        status: 'built',
        project: 'etabella',
        configuration: 'edge',
        bundleDir: 'fe-edge/browser',
        sha256: sha(lines),
        files: 2,
        bytes: 13 + 6,
      },
      {
        name: 'rt-edge',
        kind: 'docker-image',
        status: 'built',
        image: `etabella/rt-edge:${TAG}`,
        imageId: IMAGE_ID,
        baseImage: 'monorepo-base:latest',
        baseImageId: BASE_ID,
        depsSha256: DEPS_SHA,
        feBundle: true,
        feImageDir: '/usr/src/app/fe-edge',
      },
    ]);
    expect(manifestOf(t.fs).allowMissing).toBe(false);
  });

  it('fails without a manifest when a build step fails', () => {
    const t = setup({ files: fullFiles(), handlers: (fs) => buildHandlers(fs, { dockerBuildFails: true }) });
    expect(main(['--fe', FE], t.deps)).toBe(1);
    expect(t.err.join('\n')).toMatch(/FAILED building rt-edge: docker build .* failed: exit 1; no manifest written\./);
    expect(t.fs.existsSync(MANIFEST)).toBe(false);
  });

  it('fails without a manifest when the built image does not carry the checked base\'s deps label', () => {
    // monorepo-base:latest was swapped between the checks and the build.
    const swapped = (c: any) => (c.line === IMAGE_INSPECT ? inspected(IMAGE_ID, { 'com.etabella.deps-sha256': 'f'.repeat(64) }) : undefined);
    const t = setup({ files: fullFiles(), handlers: (fs) => [swapped, ...buildHandlers(fs)] });
    expect(main(['--fe', FE], t.deps)).toBe(1);
    expect(t.err.join('\n')).toContain(
      `FAILED building rt-edge: etabella/rt-edge:${TAG} carries com.etabella.deps-sha256 ${'f'.repeat(64)}, expected ${DEPS_SHA}`
      + ' (was monorepo-base:latest rebuilt during the release?); no manifest written.',
    );
    expect(t.fs.existsSync(MANIFEST)).toBe(false);
  });

  it('pushes the built image only with --push and records the registry digest', () => {
    const t = setup({ files: fullFiles(), env: { REGISTRY: 'registry.example.com/etabella/' }, handlers: (fs) => buildHandlers(fs) });
    expect(main(['--fe', FE, '--push'], t.deps)).toBe(0);
    const ref = `registry.example.com/etabella/rt-edge:${TAG}`;
    expect(nonGit(t.exec).slice(-3).map((c: any) => c.line)).toEqual([
      `docker tag etabella/rt-edge:${TAG} ${ref}`,
      `docker push ${ref}`,
      `docker image inspect ${ref} --format {{json .RepoDigests}}`,
    ]);
    expect(manifestOf(t.fs).push).toEqual({
      requested: true,
      registry: 'registry.example.com/etabella',
      status: 'pushed',
      images: [{ image: `etabella/rt-edge:${TAG}`, ref, repoDigest: `registry.example.com/etabella/rt-edge@sha256:${'e'.repeat(64)}` }],
    });
  });

  it('warns when the registry digest of a pushed image cannot be found', () => {
    const t = setup({
      files: fullFiles(),
      env: { REGISTRY: 'registry.example.com/etabella' },
      handlers: (fs) => [
        (c: any) => (c.cmd === 'docker' && c.args.includes('{{json .RepoDigests}}') ? { stdout: '[]\n' } : undefined),
        ...buildHandlers(fs),
      ],
    });
    expect(main(['--fe', FE, '--push'], t.deps)).toBe(0);
    expect(manifestOf(t.fs).push.images[0].repoDigest).toBeNull();
    expect(t.err.join('\n')).toContain(`WARNING: pushed registry.example.com/etabella/rt-edge:${TAG} but docker reports no registry.example.com/etabella/rt-edge@sha256 digest`);
  });

  it('records a failed push in the manifest and exits 1', () => {
    const t = setup({ files: fullFiles(), env: { REGISTRY: 'registry.example.com/etabella' }, handlers: (fs) => buildHandlers(fs, { pushFails: true }) });
    expect(main(['--fe', FE, '--push'], t.deps)).toBe(1);
    const push = manifestOf(t.fs).push;
    expect(push.status).toBe('failed');
    expect(push.error).toContain(`docker push registry.example.com/etabella/rt-edge:${TAG} failed: exit 1`);
    expect(t.err.join('\n')).toContain('PUSH FAILED');
  });

  it('with --push and --allow-missing and no image, pushes nothing and says so', () => {
    const t = setup({ env: { REGISTRY: 'registry.example.com/etabella' }, handlers: () => [gate(0)] });
    expect(main(['--fe', FE, '--allow-missing', '--push'], t.deps)).toBe(0);
    expect(manifestOf(t.fs).push.status).toBe('nothing-to-push');
    expect(nonGit(t.exec).filter((c: any) => c.cmd === 'docker')).toEqual([]);
  });

  it('builds the image without the FE layer when only the FE is missing', () => {
    const files = fullFiles();
    files[path.join(FE, 'angular.json')] = angularJson(false);
    const t = setup({ files, handlers: (fs) => buildHandlers(fs) });
    expect(main(['--fe', FE, '--allow-missing'], t.deps)).toBe(0);
    const dockerfile = t.fs.readFileSync(path.join(RELEASE_DIR, 'rt-edge.Dockerfile'), 'utf8');
    expect(dockerfile).not.toContain('COPY');
    expect(dockerfile).toContain('# No FE edge bundle in this release (released with --allow-missing).');
    expect(manifestOf(t.fs).components[1]).toMatchObject({ status: 'built', feBundle: false, feImageDir: null });
  });
});

describe('layerDockerfile', () => {
  it('copies a browser-builder bundle from fe-edge itself', () => {
    const ctx = { tag: 'v1', backendCommit: HEAD, feCommit: FE_HEAD, feedParseVersion: '1.0.0' };
    expect(layerDockerfile(ctx, { bundleDir: 'fe-edge' })).toContain('COPY fe-edge/ /usr/src/app/fe-edge/');
  });
});
