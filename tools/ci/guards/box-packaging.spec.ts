import * as fs from 'fs';
import * as path from 'path';
import { createRequire } from 'module';

/*
 * apps/rt-edge/packaging/windows is the venue box launcher as a release ships it (Phase 2 of the shared-libraries
 * plan, 2026-10-06). It used to live only on the installed box. These checks keep it shippable: the exact file set
 * package:box expects, nothing of an installed box in it, every runtime package pinned, the PM2 shape the plan
 * fixes, a settings template the box accepts, CRLF for cmd.exe, and a README that tells the operator the update
 * order. The plain-JS tools are loaded through createRequire so ts-jest never compiles them.
 */

const REPO = path.resolve(__dirname, '..', '..', '..');
const PKG = path.join(REPO, 'apps', 'rt-edge', 'packaging', 'windows');
const requireJs = createRequire(__filename);
const core = requireJs(path.join(REPO, 'tools', 'ci', 'package-box', 'core.js'));
const envConfig = requireJs(path.join(PKG, 'env-config.js'));
const baseline = JSON.parse(fs.readFileSync(path.join(REPO, 'tools', 'ci', 'box-externals.baseline.json'), 'utf8'));
const read = (name: string) => fs.readFileSync(path.join(PKG, name), 'utf8');

describe('apps/rt-edge/packaging/windows (the venue box launcher a release ships)', () => {
  it('holds exactly the files package:box ships, plus .gitattributes', () => {
    expect(fs.readdirSync(PKG).sort()).toEqual([...core.PACKAGING_FILES, '.gitattributes'].sort());
  });

  it("never holds an installed box's identity, recordings, settings or generated config", () => {
    for (const name of core.NEVER_PACKAGED) expect({ name, present: fs.existsSync(path.join(PKG, name)) }).toEqual({ name, present: false });
  });

  it('package.json pins every runtime package exactly and covers every baseline external', () => {
    const pkg = JSON.parse(read('package.json'));
    expect(pkg.devDependencies).toBeUndefined();
    expect(pkg.engines.node).toBe('>=22.5');
    for (const [name, version] of Object.entries(pkg.dependencies)) expect({ name, version }).toEqual({ name, version: expect.stringMatching(/^\d+\.\d+\.\d+$/) });
    for (const external of baseline.externals) expect({ external, pinned: external in pkg.dependencies }).toEqual({ external, pinned: true });
    for (const never of baseline.neverOnTheBox) expect({ never, pinned: never in pkg.dependencies }).toEqual({ never, pinned: false });
    const lock = JSON.parse(read('package-lock.json'));
    expect(lock.packages[''].dependencies).toEqual(pkg.dependencies);
  });

  it('realtime.config.js keeps the PM2 shape the plan fixes', () => {
    const text = read('realtime.config.js');
    for (const line of ["name: 'eTabella RT box'", "script: 'main.js'", "args: '--config box.json'", "exec_mode: 'fork'", 'instances: 1', 'kill_timeout: 20000', "require('./env-config').apply()"]) {
      expect({ line, present: text.includes(line) }).toEqual({ line, present: true });
    }
  });

  it('.env.production.example is a complete settings file the box accepts, with the documented defaults', () => {
    const { config, problems } = envConfig.build(envConfig.parseEnv(read('.env.production.example')));
    expect(problems).toEqual([]);
    expect(config.box).toEqual({ name: 'New venue box', timeZone: 'Asia/Kolkata', signIn: 'password', settingsAccess: 'super-admin' });
    expect(config.cloud).toEqual({ origin: 'https://etabella.net' });
    expect(config.http).toEqual({ port: 4000, tls: null });
    expect(config.transmitter).toEqual({ listenPort: 2600 });
    expect(config.console).toEqual({ port: 2601 });
    expect(config.paths).toEqual({ dataDir: './data', publicDir: './public' });
  });

  it('run.bat makes .env.production from the template only when it is missing, and starts PM2 the documented way', () => {
    const text = read('run.bat');
    expect(text).toContain(':ENSURE_SETTINGS_FILE');
    expect(text).toContain('if exist ".env.production" exit /b 0');
    expect(text).toContain('copy ".env.production.example" ".env.production"');
    expect(text).toMatch(/:APPLY_SETTINGS\r?\ncall :ENSURE_SETTINGS_FILE\r?\nnode env-config\.js/);
    expect(text).toContain('pm2 startOrRestart realtime.config.js --env production --update-env');
    expect(text).not.toMatch(/[A-Z]:\\/); // nothing of the developer's PC
  });

  it('cmd and PowerShell files are CRLF on disk and pinned so by .gitattributes', () => {
    const attributes = read('.gitattributes');
    expect(attributes).toContain('*.bat text eol=crlf');
    expect(attributes).toContain('*.ps1 text eol=crlf');
    for (const name of ['run.bat', 'stop.bat', 'make-cert.ps1']) {
      const text = read(name);
      expect({ name, crlf: text.includes('\r\n'), loneLf: /(^|[^\r])\n/.test(text) }).toEqual({ name, crlf: true, loneLf: false });
    }
  });

  it('send-to-box.js takes its recording from an argument or RT_COMMANDS_JSON, not only a path on one PC', () => {
    expect(read('send-to-box.js')).toContain('RT_COMMANDS_JSON');
  });

  it('the README tells the operator the update order, depsChanged, the staging rule and the build command', () => {
    const text = read('README.md');
    for (const heading of ['## Updating', '## Staging rule', '## Building a release']) expect(text).toContain(heading);
    for (const phrase of ['depsChanged', 'npm ci --omit=dev', 'package:box', 'affected.js', 'rt-deploy-check', 'main.prev-', '.env.production.example']) {
      expect({ phrase, present: text.includes(phrase) }).toEqual({ phrase, present: true });
    }
  });
});
