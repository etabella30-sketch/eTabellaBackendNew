const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(process.env.TEST_BUILD_SOURCE || path.join(__dirname, 'build-all-apps.js'), 'utf8');

function build(args = [], fail = []) {
  const root = path.resolve(__dirname, '..');
  const bundle = app => path.join(root, 'docker', 'microservices', 'apps', app, 'main.js');
  const files = new Map(['authapi', 'coreapi'].map(app => [bundle(app), `old-${app}`]));
  const calls = [];
  const config = {
    compilerOptions: { deleteOutDir: true },
    projects: Object.fromEntries(['authapi', 'coreapi', 'backup'].map(app => [app, { type: 'application' }])),
  };
  const proc = { argv: ['node', 'build-all-apps.js', ...args], pid: 123, execPath: process.execPath,
    exitCode: 0, stdout: { write() {} }, on() {},
    exit(code) { this.exitCode = code; throw new Error('TEST_EXIT'); },
  };
  const fakeFs = {
    readFileSync() { return JSON.stringify(config); },
    mkdirSync() {},
    writeFileSync(file, data) { files.set(file, data); },
    existsSync(file) { return files.has(file); },
    copyFileSync(from, to) { files.set(to, files.get(from)); },
    rmSync(file, options) {
      for (const name of files.keys()) {
        if (name === file || (options?.recursive && name.startsWith(file + path.sep))) files.delete(name);
      }
    },
  };
  const mockRequire = name => {
    if (name === 'fs') return fakeFs;
    if (name === 'path') return path;
    if (name === 'child_process') return { spawnSync(exe, argv) {
      const app = argv[argv.indexOf('build') + 1];
      calls.push(app);
      if (fail.includes(app)) return { status: 1, stdout: Buffer.from('Compilation failed') };
      files.set(path.join(root, 'dist', 'apps', app, 'main.js'), `new-${app}`);
      return { status: 0 };
    } };
    throw new Error(`Unexpected require: ${name}`);
  };
  mockRequire.resolve = () => 'nest.js';
  try {
    vm.runInNewContext(source, {
      require: mockRequire, __dirname, process: proc,
      console: { log() {}, error() {} },
    });
  } catch (error) {
    if (error.message !== 'TEST_EXIT') throw error;
  }
  return { calls, files, bundle, code: proc.exitCode };
}

test('a failed compile returns failure and cannot redeploy its stale bundle', () => {
  const result = build(['authapi'], ['authapi']);
  assert.equal(result.code, 1);
  assert.equal(result.files.has(result.bundle('authapi')), false);
  assert.equal(result.files.get(result.bundle('coreapi')), 'old-coreapi');
});

test('targeted rebuild replaces only the selected application', () => {
  const result = build(['authapi']);
  assert.equal(result.code, 0);
  assert.deepEqual(result.calls, ['authapi']);
  assert.equal(result.files.get(result.bundle('authapi')), 'new-authapi');
  assert.equal(result.files.get(result.bundle('coreapi')), 'old-coreapi');
});

test('unknown application fails before changing any existing bundles', () => {
  const result = build(['not-an-app']);
  assert.equal(result.code, 1);
  assert.deepEqual(result.calls, []);
  assert.equal(result.files.get(result.bundle('authapi')), 'old-authapi');
});

test('default build excludes the disabled legacy backup application', () => {
  const result = build();
  assert.equal(result.code, 0);
  assert.deepEqual(result.calls, ['authapi', 'coreapi']);
});
