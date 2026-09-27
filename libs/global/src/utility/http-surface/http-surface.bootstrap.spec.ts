import * as fs from 'fs';
import * as path from 'path';
import { refuseHeadRequests } from './http-surface';

// Runs each app's real bootstrap() (its main.ts) against a recording stand-in for the Nest app, to
// pin where the shared HEAD refusal goes: it only works as the first handler on the Express stack,
// i.e. installed straight after NestFactory.create() and before any other app.use(), CORS,
// microservice or listen(). http-surface.spec.ts proves what it does there. realtime-server and
// coreapi install their own guards (checked by their own main specs); they are listed below only so
// the coverage check knows about them.

const APPS_DIR = path.resolve(__dirname, '../../../../../apps');

/** Apps whose main.ts installs the shared guard from libs/global. */
const SHARED_GUARD_APPS = [
  'authapi', 'batchfile', 'download', 'downloadapi', 'export', 'hyperlink', 'indexapi',
  'pagination', 'presentation', 'sfu', 'upload', 'socket-app', 'realtime',
];
/** Apps that install an app-specific guard of the same kind. */
const OWN_GUARD_APPS = ['coreapi', 'realtime-server'];

type Recording = { steps: string[]; app: any; listened: Promise<void> };
const mockRecordings = new Map<string, Recording>();

/** The stand-in NestFactory.create() returns, recorded under the root module's class name. */
function mockNewApp(rootModuleName: string) {
  const steps: string[] = ['create'];
  let listening: () => void;
  const listened = new Promise<void>((resolve) => (listening = resolve));
  const record = (name: string) => () => { steps.push(name); };
  const app = {
    use: jest.fn((...handlers: any[]) => { steps.push(`use:${handlers[0]?.name || 'anonymous'}`); }),
    get: jest.fn(() => ({ get: (): undefined => undefined, getValue: async (): Promise<null> => null })),
    useWebSocketAdapter: jest.fn(record('useWebSocketAdapter')),
    connectMicroservice: jest.fn(record('connectMicroservice')),
    startAllMicroservices: jest.fn(async () => { steps.push('startAllMicroservices'); }),
    enableCors: jest.fn(record('enableCors')),
    useGlobalPipes: jest.fn(record('useGlobalPipes')),
    useGlobalFilters: jest.fn(record('useGlobalFilters')),
    init: jest.fn(async () => { steps.push('init'); }),
    listen: jest.fn(async () => { steps.push('listen'); listening(); }),
  };
  mockRecordings.set(rootModuleName, { steps, app, listened });
  return app;
}

jest.mock('dotenv', () => ({ config: jest.fn() }));
jest.mock('@nestjs/swagger', () => ({
  ...jest.requireActual('@nestjs/swagger'),
  SwaggerModule: { createDocument: jest.fn(() => ({})), setup: jest.fn() },
}));
jest.mock('@nestjs/core', () => ({
  ...jest.requireActual('@nestjs/core'),
  NestFactory: { create: jest.fn(async (rootModule: any) => mockNewApp(rootModule?.name)) },
}));

const mainPath = (app: string) => path.join(APPS_DIR, app, 'src', 'main.ts');

/** Every .ts under dir except specs. */
function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : sourceFiles(full);
    return entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts') ? [full] : [];
  });
}

/** True when a file applies route-scoped middleware (a live, not commented-out, `.forRoutes(`). */
function appliesRouteScopedMiddleware(file: string): boolean {
  return fs.readFileSync(file, 'utf8').split(/\r?\n/).some((line) => {
    const code = line.trim();
    return !code.startsWith('//') && !code.startsWith('*') && code.split('//')[0].includes('.forRoutes(');
  });
}

describe('main.ts of every app installs the HEAD refusal first', () => {
  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined); // kafka options and ports are logged
    jest.spyOn(process, 'on').mockImplementation(() => process); // indexapi/realtime add exit handlers
  });

  afterAll(() => jest.restoreAllMocks());

  it('covers every app that applies route-scoped middleware with forRoutes()', () => {
    const apps = fs.readdirSync(APPS_DIR).filter((app) => fs.existsSync(path.join(APPS_DIR, app, 'src')));
    const scoped = apps.filter((app) => sourceFiles(path.join(APPS_DIR, app, 'src')).some(appliesRouteScopedMiddleware));
    expect(scoped.length).toBeGreaterThan(0);
    for (const app of scoped) {
      expect([...SHARED_GUARD_APPS, ...OWN_GUARD_APPS]).toContain(app);
    }
    for (const app of OWN_GUARD_APPS) {
      expect(fs.readFileSync(mainPath(app), 'utf8')).toContain('installHttpSurfaceGuards(app);');
    }
  });

  describe.each(SHARED_GUARD_APPS)('%s', (appName) => {
    let run: Recording;

    beforeAll(async () => {
      // Stand in for the root module (importing the real one would load the whole app).
      const source = fs.readFileSync(mainPath(appName), 'utf8');
      const [, rootModule, rootFile] = source.match(/^import \{ (\w+Module) \} from '\.\/([\w.-]+)';/m) ?? [];
      expect(rootModule).toBeDefined();
      jest.doMock(path.join(APPS_DIR, appName, 'src', rootFile), () => ({ [rootModule]: { [rootModule]: class { } }[rootModule] }));

      require(mainPath(appName)); // main.ts calls bootstrap() itself
      run = mockRecordings.get(rootModule);
      expect(run).toBeDefined();
      let timer: NodeJS.Timeout;
      await Promise.race([
        run.listened,
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error(`${appName}: bootstrap() never reached listen(); steps: ${run.steps.join(', ')}`)), 15000);
        }),
      ]).finally(() => clearTimeout(timer));
    }, 30000);

    it('installs the shared refuseHeadRequests right after NestFactory.create()', () => {
      expect(run.steps.slice(0, 2)).toEqual(['create', 'use:refuseHeadRequests']);
      expect(run.app.use.mock.calls[0][0]).toBe(refuseHeadRequests); // the libs/global handler itself
    });

    it('installs it once, before every other handler, CORS, microservice and listen()', () => {
      expect(run.steps.filter((s) => s === 'use:refuseHeadRequests')).toHaveLength(1);
      const later = run.steps.slice(2);
      expect(later).toContain('listen');
      expect(later.length).toBeGreaterThan(1);
    });
  });
});
