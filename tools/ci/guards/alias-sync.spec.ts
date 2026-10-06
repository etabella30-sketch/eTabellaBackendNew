import * as fs from 'fs';
import * as path from 'path';
import { createRequire } from 'module';

/*
 * The `@app/<lib>` aliases are declared in four places that must agree (Phase 1 of the shared-libraries plan,
 * step 1, 2026-10-06):
 *   nest-cli.json            projects of type "library"           (what `nest build` knows)
 *   tsconfig.json            paths `@app/x` and `@app/x/*`        (what tsc and webpack resolve)
 *   package.json             jest moduleNameMapper                (what the unit suite resolves)
 *   apps/rt-edge/e2e/jest-e2e.config.js  moduleNameMapper         (what the box e2e suite resolves)
 * A lib missing from one of them builds in some places and fails in others, late. Each source is parsed the way
 * its consumer reads it; the e2e config is a CommonJS module, loaded with node's own require so ts-jest does
 * not try to transpile it. alpha-queue and mipl-queue are dead and registered nowhere; every other directory
 * under libs/ must be registered everywhere.
 */

const REPO = path.resolve(__dirname, '..', '..', '..');
const LIBS_DIR = path.join(REPO, 'libs');
const DEAD_LIBS = ['alpha-queue', 'mipl-queue'];

const nativeRequire = createRequire(__filename);
const readJson = (file: string) => JSON.parse(fs.readFileSync(path.join(REPO, file), 'utf8'));

interface NestProject {
  type: string;
  root: string;
  entryFile: string;
  sourceRoot: string;
  compilerOptions?: { tsConfigPath?: string };
}

/** `^@app/<lib>(|/.*)$` -> `<lib>`; anything else (the `^apps/(.*)$` mapper) -> null. */
function libOfMapperKey(key: string): string | null {
  const m = /^\^@app\/([^(]+)\(\|\/\.\*\)\$$/.exec(key);
  return m ? m[1] : null;
}

function nestLibraries(): Record<string, NestProject> {
  const projects: Record<string, NestProject> = readJson('nest-cli.json').projects;
  return Object.fromEntries(Object.entries(projects).filter(([, p]) => p.type === 'library'));
}

function tsconfigPaths(): Record<string, string[]> {
  return readJson('tsconfig.json').compilerOptions.paths;
}

function jestMapper(): Record<string, string> {
  return readJson('package.json').jest.moduleNameMapper;
}

function e2eMapper(): Record<string, string> {
  return nativeRequire(path.join(REPO, 'apps', 'rt-edge', 'e2e', 'jest-e2e.config.js')).moduleNameMapper;
}

const libsFrom = {
  nestCli: () => Object.keys(nestLibraries()).sort(),
  tsconfigPaths: () =>
    Object.keys(tsconfigPaths())
      .filter((k) => k.startsWith('@app/') && !k.endsWith('/*'))
      .map((k) => k.slice('@app/'.length))
      .sort(),
  jestMapper: () => Object.keys(jestMapper()).map(libOfMapperKey).filter((l): l is string => l !== null).sort(),
  e2eMapper: () => Object.keys(e2eMapper()).map(libOfMapperKey).filter((l): l is string => l !== null).sort(),
};

describe('lib alias sync', () => {
  const registered = libsFrom.nestCli();

  it('nest-cli.json, tsconfig.json paths, the jest moduleNameMapper and the e2e moduleNameMapper name the same libs', () => {
    expect({ tsconfigPaths: libsFrom.tsconfigPaths(), jestMapper: libsFrom.jestMapper(), e2eMapper: libsFrom.e2eMapper() }).toEqual({
      tsconfigPaths: registered,
      jestMapper: registered,
      e2eMapper: registered,
    });
  });

  it('registers the Phase 1 libs', () => {
    expect(registered).toEqual(expect.arrayContaining(['api-kernel', 'api-contracts', 'permissions', 'rt-features', 'platform-cloud', 'global', 'edge-token', 'edge-sync', 'rt-ingest', 'feed-parse']));
  });

  it('every directory under libs/ is registered, except the dead queues, and every registered lib exists with an index.ts', () => {
    const dirs = fs
      .readdirSync(LIBS_DIR, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();
    expect(dirs.filter((d) => !DEAD_LIBS.includes(d))).toEqual(registered);
    for (const dead of DEAD_LIBS) expect(registered).not.toContain(dead);
    for (const lib of registered) {
      expect({ lib, index: fs.existsSync(path.join(LIBS_DIR, lib, 'src', 'index.ts')) }).toEqual({ lib, index: true });
      expect({ lib, tsconfig: fs.existsSync(path.join(LIBS_DIR, lib, 'tsconfig.lib.json')) }).toEqual({ lib, tsconfig: true });
    }
  });

  it('each nest-cli.json library block points at libs/<name>', () => {
    for (const [name, p] of Object.entries(nestLibraries())) {
      expect({ name, ...p }).toEqual({
        name,
        type: 'library',
        root: 'libs/' + name,
        entryFile: 'index',
        sourceRoot: 'libs/' + name + '/src',
        compilerOptions: { tsConfigPath: 'libs/' + name + '/tsconfig.lib.json' },
      });
    }
  });

  it('each tsconfig.json alias has both forms, pointing at libs/<name>/src', () => {
    const paths = tsconfigPaths();
    for (const lib of registered) {
      expect({ lib, bare: paths['@app/' + lib], deep: paths['@app/' + lib + '/*'] }).toEqual({
        lib,
        bare: ['libs/' + lib + '/src'],
        deep: ['libs/' + lib + '/src/*'],
      });
    }
  });

  it('each jest mapper (unit and e2e) maps @app/<lib> to <rootDir>/libs/<lib>/src/$1', () => {
    for (const [which, mapper] of [['jest', jestMapper()], ['e2e', e2eMapper()]] as const) {
      for (const lib of registered) {
        expect({ which, lib, target: mapper['^@app/' + lib + '(|/.*)$'] }).toEqual({ which, lib, target: '<rootDir>/libs/' + lib + '/src/$1' });
      }
      // The only non-lib mapper is the one that lets specs import another app's source for parity checks.
      expect(Object.keys(mapper).filter((k) => libOfMapperKey(k) === null)).toEqual(['^apps/(.*)$']);
    }
  });

  it('the mapper-key parser reads the house pattern and nothing else', () => {
    expect(libOfMapperKey('^@app/api-kernel(|/.*)$')).toBe('api-kernel');
    expect(libOfMapperKey('^@app/global(|/.*)$')).toBe('global');
    expect(libOfMapperKey('^apps/(.*)$')).toBeNull();
    expect(libOfMapperKey('^@app/global$')).toBeNull();
  });
});
