import { Controller, Delete, Get, INestApplication, MiddlewareConsumer, Module, NestModule, Post, Put, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AbstractLoader, ExpressLoader, SERVE_STATIC_MODULE_OPTIONS, ServeStaticModule } from '@nestjs/serve-static';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import * as fs from 'fs';
import * as http from 'http';
import * as jwt from 'jsonwebtoken';
import * as os from 'os';
import * as path from 'path';
import { DbService } from '@app/global/db/pg/db.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { UploadController } from '../controllers/upload/upload.controller';
import { RealtimeAdminMiddleware, RealtimeAuthMiddleware } from './realtime-auth.middleware';
import { UPLOAD_ADMIN_ROUTES } from './realtime-auth.routes';
import {
  ALLOWED_METHODS,
  collectRouteRoots,
  EXTRA_ROUTE_ROOTS,
  installHttpSurfaceGuards,
  isPublicStaticPath,
  mayPassStaticGuard,
  refuseHeadRequests,
  serveStaticRoots,
  staticEntryExists,
} from './realtime-http-surface';

// A real Nest HTTP app wired like realtime-server: the main.ts guards installed right after the app
// is created, ServeStatic over an assets-shaped temp folder (same options as RealtimeServerModule),
// RealtimeAuthMiddleware on a controller with a GET route (method-scoped, like forRoutes(Controller)),
// a controller at '/' (like RealtimeServerController) and Swagger mounted as main.ts mounts it.

const SECRET = 'surface-secret';
const ME = '11111111-1111-4111-8111-111111111111';
const CASE = '33333333-3333-4333-8333-333333333333';
const SES = '44444444-4444-4444-8444-444444444444';

const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-static-'));
function fixture(rel: string, content: string) {
  const file = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}
fixture(`realtime-transcripts/s_${SES}.json`, 'RAW-SESSION-JSON');
fixture(`realtime-transcripts/s_${SES}.TXT`, 'RAW-SESSION-TXT');
fixture('realtime-transcripts/transcript_1726000000000.json', 'RAW-IMPORT-JSON');
fixture('realtime-transcripts/transcript_1726000000000.TXT', 'RAW-IMPORT-TXT');
fixture('realtime-transcripts/exports/1726000000000.docx', 'EXPORT-DOCX');
fixture(`doc/case${CASE}/s_${SES}.TXT`, 'RAW-UPLOADED-TXT');
fixture(`com 15/s_${SES}.json`, 'RAW-COPY-JSON');
fixture('com 15/transcript_1726000000000.TXT', 'RAW-COPY-TXT');
fixture(`com backup/s_${SES}.json`, 'RAW-BACKUP-JSON');
fixture('com backup/assets/doc/case289/file_1.PDF', 'RAW-BACKUP-DOC');
fixture(`export-excel/case${CASE}/logs-report.xlsx`, 'RAW-RT-LOGS');
fixture('fonts/public.css', 'RAW-FONT-CSS');
fixture('realtime-transcripts/exports/sub/1726000000001.pdf', 'EXPORT-PDF');
// A folder named like a route root ('probe'): a stray or hostile write into the shared assets folder,
// e.g. the upload service's chunk folder with identifier '../probe'.
fixture('probe/planted.txt', 'PLANTED-UNDER-ROUTE-ROOT');
fixture('probe/sub/planted.html', 'PLANTED-UNDER-ROUTE-ROOT');

// Every other top-level entry of the real assets folder, plus the folders the services create there
// at run time (not all exist in a checkout): one file in each, and each top-level file itself.
const REAL_ASSETS = path.resolve('assets');
const RUNTIME_ASSET_DIRS = [
  'doc', 'export-excel', 'export', 'downloadbatch', 'hyperlink-files', 'profile', 'temp', 'tempfiles',
  'upload-chunks', 'screenshot', 'undefinedcontacts', 'sql-migrations', 'pythons', 'com 15', 'com backup',
  'fonts', 'img', 'icon', 'icons', 'impacts', 'libs', 'js', 'workers', 'batch',
];
const realEntries = fs.existsSync(REAL_ASSETS) ? fs.readdirSync(REAL_ASSETS, { withFileTypes: true }) : [];
const OTHER_ASSET_DIRS = [...new Set([...realEntries.filter((e) => e.isDirectory()).map((e) => e.name), ...RUNTIME_ASSET_DIRS])]
  .filter((name) => name !== 'realtime-transcripts');
const OTHER_ASSET_FILES = [...new Set([...realEntries.filter((e) => e.isFile()).map((e) => e.name), 'bglayer.png', 'index.html'])];
for (const dir of OTHER_ASSET_DIRS) fixture(`${dir}/probe.txt`, `RAW-${dir}`);
for (const file of OTHER_ASSET_FILES) fixture(file, `RAW-${file}`); // index.html: what ServeStatic's fallback would send

const handled = jest.fn();

@Controller('probe')
class ProbeController {
  @Get('secret') secret(@Query('nFSid') nFSid: string) { handled(nFSid); return { ok: true }; }
  @Post('secret') write() { handled('post'); return { ok: true }; }
}

/** Like RealtimeServerController: a GET at '/'. */
@Controller()
class RootController {
  @Get() hello() { return 'realtime-server'; }
}

let session = { id: 'browser-1', a: false };
const rds = { getValue: jest.fn(async () => JSON.stringify(session)), deleteValue: jest.fn() };
const env: Record<string, string> = { JWT_SECRET: SECRET };
const providers = [
  { provide: RedisDbService, useValue: rds },
  { provide: ConfigService, useValue: { get: (k: string) => env[k] } },
  { provide: DbService, useValue: { executeRef: jest.fn(), rowQuery: jest.fn() } },
];

@Module({
  imports: [ServeStaticModule.forRoot({ rootPath: ROOT, serveStaticOptions: { index: false } })],
  controllers: [ProbeController, RootController],
  providers,
})
class SurfaceModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RealtimeAuthMiddleware).forRoutes(ProbeController);
  }
}

type RawResponse = { status: number; body: string; headers: http.IncomingHttpHeaders };

/** Sends the request target byte for byte (no client-side normalisation of '..', '%2F' or '\'). */
function raw(port: number, method: string, target: string, headers: Record<string, string> = {}): Promise<RawResponse> {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, method, path: target, headers }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body, headers: res.headers }));
    });
    req.on('error', reject);
    req.end();
  });
}

const token = () => jwt.sign({ userId: ME, broweserId: 'browser-1' }, SECRET);

describe('realtime-server HTTP surface guards (main.ts)', () => {
  let app: INestApplication;
  let port: number;

  beforeAll(async () => {
    // ServeStatic picks its loader while providers are built. NestFactory.create() sets the HTTP
    // adapter first (so production gets the ExpressLoader); a testing module only gets it at
    // createNestApplication(), so the Express loader is supplied explicitly.
    const moduleRef = await Test.createTestingModule({ imports: [SurfaceModule] })
      .overrideProvider(AbstractLoader).useValue(new ExpressLoader())
      .compile();
    app = moduleRef.createNestApplication({ logger: false });
    installHttpSurfaceGuards(app); // same place as main.ts: before init, so first on the stack
    SwaggerModule.setup('swagger', app, SwaggerModule.createDocument(app, new DocumentBuilder().setTitle('probe').build()));
    await app.listen(0, '127.0.0.1');
    port = (app.getHttpServer().address() as any).port;
  });

  afterAll(async () => {
    await app?.close();
    fs.rmSync(ROOT, { recursive: true, force: true });
  });

  beforeEach(() => {
    handled.mockClear();
    session = { id: 'browser-1', a: false };
  });

  it('sits ahead of the Nest routes and the ServeStatic handler on the Express stack', () => {
    const stack: any[] = app.getHttpAdapter().getInstance()._router.stack;
    const head = stack.findIndex((l) => l.handle === refuseHeadRequests);
    const guard = stack.findIndex((l) => l.name === 'blockNonPublicStaticFiles');
    const serveStatic = stack.findIndex((l) => l.name === 'serveStatic');
    const firstRoute = stack.findIndex((l) => l.route);
    expect(head).toBeGreaterThan(-1);
    expect(guard).toBeGreaterThan(head);
    expect(serveStatic).toBeGreaterThan(guard);
    expect(firstRoute).toBeGreaterThan(guard);
  });

  describe('HEAD', () => {
    it('never reaches the handler of a protected GET route', async () => {
      // The probe itself works: no token is refused by the auth middleware, a token gets through.
      expect((await raw(port, 'GET', '/probe/secret?nFSid=x')).status).toBe(403);
      expect(handled).not.toHaveBeenCalled();
      expect((await raw(port, 'GET', '/probe/secret?nFSid=x', { Authorization: `Bearer ${token()}` })).status).toBe(200);
      expect(handled).toHaveBeenCalledTimes(1);
      handled.mockClear();

      for (const target of ['/probe/secret?nFSid=x', '/PROBE/Secret/?nFSid=x']) {
        const res = await raw(port, 'HEAD', target);
        expect(res.status).toBe(405);
        expect(res.headers.allow).toBe(ALLOWED_METHODS);
      }
      expect(handled).not.toHaveBeenCalled();
    });

    it('is refused for static files too; GET still serves them', async () => {
      expect((await raw(port, 'HEAD', '/realtime-transcripts/exports/1726000000000.docx')).status).toBe(405);
      const get = await raw(port, 'GET', '/realtime-transcripts/exports/1726000000000.docx');
      expect(get.status).toBe(200);
      expect(get.body).toBe('EXPORT-DOCX');
    });

    it('leaves the other methods alone', async () => {
      const res = await raw(port, 'POST', '/probe/secret', { Authorization: `Bearer ${token()}` });
      expect(res.status).toBe(201);
      expect(handled).toHaveBeenCalledWith('post');
      expect((await raw(port, 'OPTIONS', '/probe/secret')).status).not.toBe(405);
    });
  });

  describe('routes', () => {
    it('leaves the API routes, the root route and Swagger (Docker healthcheck: GET /swagger-json) alone', async () => {
      expect((await raw(port, 'GET', '/probe/secret?nFSid=x')).status).toBe(403); // reaches the auth middleware
      for (const target of ['/probe/secret?nFSid=x', '/PROBE/Secret/?nFSid=x']) {
        expect((await raw(port, 'GET', target, { Authorization: `Bearer ${token()}` })).status).toBe(200);
      }
      expect(handled).toHaveBeenCalledTimes(2);

      const root = await raw(port, 'GET', '/');
      expect(root.status).toBe(200);
      expect(root.body).toBe('realtime-server');

      const doc = await raw(port, 'GET', '/swagger-json');
      expect(doc.status).toBe(200);
      expect(JSON.parse(doc.body).info.title).toBe('probe');
      expect((await raw(port, 'GET', '/swagger')).status).toBe(200);
      expect((await raw(port, 'GET', '/swagger/swagger-ui.css')).status).toBe(200); // the UI's own assets
      expect((await raw(port, 'GET', '/swagger-yaml')).status).toBe(200);
    });
  });

  describe('static files', () => {
    it('serves the export downloads', async () => {
      for (const [target, body] of [
        ['/realtime-transcripts/exports/1726000000000.docx', 'EXPORT-DOCX'],
        ['/realtime-transcripts/exports/1726000000000.docx?id:0.123', 'EXPORT-DOCX'], // legacy rt export cache-buster
        ['/realtime-transcripts/exports/sub/1726000000001.pdf', 'EXPORT-PDF'],
      ]) {
        const res = await raw(port, 'GET', target);
        expect(res.status).toBe(200);
        expect(res.body).toBe(body);
      }
    });

    it('404s files under a folder named like a route root; the route itself still answers', async () => {
      // express.static sees /probe/... whenever no Nest route matches it.
      for (const target of ['/probe/planted.txt', '/probe/sub/planted.html', '/probe/sub/../planted.txt', '/probe/%70lanted.txt']) {
        const res = await raw(port, 'GET', target);
        expect({ target, status: res.status }).toEqual({ target, status: 404 });
        expect(res.body).not.toContain('PLANTED');
      }
      // Spellings a case-insensitive file system folds onto assets/probe/planted.txt (404 there);
      // elsewhere they name nothing and end at the index.html fallback.
      for (const target of ['/PROBE/planted.txt', '/probe./planted.txt', '/probe%20/planted.txt',
        '/probe::$INDEX_ALLOCATION/planted.txt', '/probe/PLANTED.TXT', '/probe/planted.txt.', '/probe/planted.txt::$DATA']) {
        expect({ target, body: (await raw(port, 'GET', target)).body.includes('PLANTED') }).toEqual({ target, body: false });
      }
      expect((await raw(port, 'GET', '/probe/secret?nFSid=x', { Authorization: `Bearer ${token()}` })).status).toBe(200);
      expect((await raw(port, 'GET', '/probe/secret?nFSid=x')).status).toBe(403);
    });

    it('404s every other top-level assets folder and file', async () => {
      expect(OTHER_ASSET_DIRS.length).toBeGreaterThanOrEqual(RUNTIME_ASSET_DIRS.length);
      const targets = [
        ...OTHER_ASSET_DIRS.map((dir) => `/${encodeURIComponent(dir)}/probe.txt`),
        ...OTHER_ASSET_FILES.map((file) => `/${encodeURIComponent(file)}`),
      ];
      for (const target of targets) {
        const res = await raw(port, 'GET', target);
        expect({ target, status: res.status }).toEqual({ target, status: 404 });
        expect(res.body).not.toContain('RAW-');
      }
    });

    it('404s unknown paths outside the routes instead of falling back to index.html', async () => {
      for (const target of ['/no-such-file', '/favicon.ico', '/index.html', '/.', '//', '/%2e', '/%20']) {
        const res = await raw(port, 'GET', target);
        expect({ target, status: res.status }).toEqual({ target, status: 404 });
        expect(res.body).not.toContain('RAW-');
      }
    });

    it.each([
      `/realtime-transcripts/s_${SES}.json`,
      `/realtime-transcripts/s_${SES}.TXT`,
      '/realtime-transcripts/transcript_1726000000000.json',
      '/realtime-transcripts/transcript_1726000000000.TXT',
      `/doc/case${CASE}/s_${SES}.TXT`,
      // Checked-in copies of realtime-transcripts/doc, and the rt-logs export written per case.
      `/com%2015/s_${SES}.json`,
      '/com%2015/transcript_1726000000000.TXT',
      `/COM%2015/S_${SES}.JSON`,
      `/com%20backup/s_${SES}.json`,
      '/com%20backup/assets/doc/case289/file_1.PDF',
      `/export-excel/case${CASE}/logs-report.xlsx`,
      `/Export-Excel./case${CASE}/logs-report.xlsx`,
      `/realtime-transcripts/exports/../../export-excel/case${CASE}/logs-report.xlsx`,
      '/fonts/public.css',
    ])('404s the raw file %s', async (target) => {
      const res = await raw(port, 'GET', target);
      expect(res.status).toBe(404);
      expect(res.body).not.toContain('RAW-');
    });

    it.each([
      `/realtime-transcripts%2Fs_${SES}.json`,
      `/realtime-transcripts%2fs_${SES}.json`,
      `/realtime-transcripts%5Cs_${SES}.json`,
      `/realtime-transcripts\\s_${SES}.json`,
      `/%72ealtime-transcripts/s_${SES}.json`,
      `/REALTIME-TRANSCRIPTS/s_${SES}.json`,
      `/Realtime-Transcripts/S_${SES.toUpperCase()}.JSON`,
      `/realtime-transcripts./s_${SES}.json`,
      `/realtime-transcripts%20/s_${SES}.json`,
      `/realtime-transcripts/s_${SES}.json.`,
      `/realtime-transcripts::$INDEX_ALLOCATION/s_${SES}.json`,
      `/REALTI~1/s_${SES}.json`,
      `//realtime-transcripts/s_${SES}.json`,
      `/./realtime-transcripts/s_${SES}.json`,
      `/realtime-transcripts/exports/../s_${SES}.json`,
      `/realtime-transcripts/exports/%2e%2e/s_${SES}.json`,
      `/realtime-transcripts/exports%2F..%2Fs_${SES}.json`,
      `/realtime-transcripts/exports/.../s_${SES}.json`,
      `/realtime-transcripts/exports/..%20/s_${SES}.json`,
      `/realtime-transcripts/EXPORTS./../s_${SES}.json`,
      `/realtime-transcripts/exports/../../doc/case${CASE}/s_${SES}.TXT`,
      `/DOC/case${CASE}/s_${SES}.TXT`,
      `/doc./case${CASE}/s_${SES}.TXT`,
      `/doc%2Fcase${CASE}%2Fs_${SES}.TXT`,
      `http://example.test/realtime-transcripts/s_${SES}.json`,
      `/realtime-transcripts/s_${SES}.json?download=1`,
      // Spellings of the public prefix that are not the prefix itself, and ways out of it.
      '/REALTIME-TRANSCRIPTS/EXPORTS/1726000000000.docx',
      '/realtime-transcripts/Exports/1726000000000.docx',
      '/realtime-transcripts/exports./1726000000000.docx',
      '/realtime-transcripts/exports::$INDEX_ALLOCATION/1726000000000.docx',
      `/realtime-transcripts/exports/..%5Cs_${SES}.json`,
      `/realtime-transcripts/exports%5C..%5Cs_${SES}.json`,
      `/realtime-transcripts/exports/%2e%2e%5cs_${SES}.json`,
      `/realtime-transcripts/exports/..::$INDEX_ALLOCATION/s_${SES}.json`,
      `/realtime-transcripts/exports/sub/../../s_${SES}.json`,
      // Route roots used as a detour: dot segments are resolved before the route-root check.
      `/probe/../realtime-transcripts/s_${SES}.json`,
      `/probe%2F..%2Frealtime-transcripts%2Fs_${SES}.json`,
      `/probe/..%5Crealtime-transcripts%5Cs_${SES}.json`,
      `/PROBE./../doc/case${CASE}/s_${SES}.TXT`,
      '/swagger/../sql-migrations/probe.txt',
      '/swagger-json/%2e%2e/pythons/probe.txt',
      `/.../doc/case${CASE}/s_${SES}.TXT`,
      '/probe/.../sql-migrations/probe.txt',
      // Windows spellings of the other folders.
      '/SQL-MIGRATIONS/probe.txt',
      '/sql-migrations./probe.txt',
      '/sql-migrations%20/probe.txt',
      '/SQL-MI~1/probe.txt',
      '/pythons::$INDEX_ALLOCATION/probe.txt',
      '/upload-chunks%5Cprobe.txt',
    ])('404s the variant %s', async (target) => {
      const res = await raw(port, 'GET', target);
      expect(res.status).toBe(404);
      expect(res.body).not.toContain('RAW-');
    });
  });
});

describe('isPublicStaticPath', () => {
  it.each([
    '/realtime-transcripts/exports/a.docx',
    '/realtime-transcripts/exports/sub/a.pdf',
    '/realtime-transcripts/exports/a%20b.docx',
    '/realtime-transcripts/exports/sub/../a.docx', // resolves inside exports
    '/realtime-transcripts//exports/a.docx',
  ])('serves %s', (p) => {
    expect(isPublicStaticPath(p)).toBe(true);
  });

  it.each([
    '/realtime-transcripts/exports',
    '/realtime-transcripts/exports/',
    '/realtime-transcripts',
    '/realtime-transcripts/s_x.json',
    '/realtime-transcripts/exports/../s_x.json',
    '/realtime-transcripts/exports/.../s_x.json',
    '/realtime-transcripts/exports/.. /s_x.json',
    '/realtime-transcripts/exports/::$DATA',
    '/realtime-transcripts/exports\\a.docx',
    '/realtime-transcripts/exports/a%5Cb.docx',
    '/realtime-transcripts/exports/a%00.docx',
    '/REALTIME-TRANSCRIPTS/exports/a.docx',
    '/realtime-transcripts/EXPORTS/a.docx',
    '/realtime-transcripts/exports./a.docx',
    '/realtime-transcripts/exports:x/a.docx',
    '/REALTI~1/exports/a.docx',
    '/fonts/a.woff',
    '/doc/case1/x.TXT',
    '/',
    '',
    '/%E0%A4%A', // undecodable
  ])('refuses %s', (p) => {
    expect(isPublicStaticPath(p)).toBe(false);
  });
});

describe('mayPassStaticGuard', () => {
  const roots = new Set(['', 'probe', 'session', ...EXTRA_ROUTE_ROOTS]);

  it.each([
    '/',
    '/probe/secret',
    '/PROBE/Secret/',
    '/probe./secret', // a Windows spelling of a route root still only names the (absent) assets/probe
    '/session/getsessionsbycaseid',
    '/swagger',
    '/swagger/swagger-ui.css',
    '/swagger-json',
    '/realtime-transcripts/exports/a.docx',
  ])('lets %s through', (p) => {
    expect(mayPassStaticGuard(p, roots)).toBe(true);
  });

  it.each([
    '//',
    '/.',
    '',
    '/index.html',
    '/favicon.ico',
    '/sql-migrations/x.sql',
    '/probe/../sql-migrations/x.sql',
    '/probe%2F..%2Fsql-migrations%2Fx.sql',
    '/probe%5C..%5Csql-migrations%5Cx.sql',
    '/probe/x%5Cy', // a backslash is refused even under a route root
    '/.../sql-migrations/x.sql',
    '/probe/.../x',
    '/PROBE~1/x',
    '/SESSIO~1/x',
    '/%E0%A4%A',
  ])('404s %s', (p) => {
    expect(mayPassStaticGuard(p, roots)).toBe(false);
  });

  it('only lets "/" through when the app has a route there', () => {
    expect(mayPassStaticGuard('/', new Set(['probe']))).toBe(false);
  });
});

describe('collectRouteRoots', () => {
  const containerOf = (...controllers: any[]) => new Map([['m', { controllers: new Map(controllers.map((c) => [c, { metatype: c }])) }]]);

  it('reads the first segment of every HTTP route, lower-cased, plus the Swagger roots', () => {
    @Controller('Alpha') class A {
      @Get('x') x() { return 1; }
      @Post() y() { return 1; }
      helper() { return 1; } // not a route
    }
    @Controller() class R {
      @Get() home() { return 1; }
      @Put('beta/y') b() { return 1; }
    }
    @Controller(['gamma', 'delta']) class G {
      @Delete() g() { return 1; }
    }
    expect([...collectRouteRoots(containerOf(A, R, G))].sort()).toEqual(
      ['', 'alpha', 'beta', 'delta', 'gamma', ...EXTRA_ROUTE_ROOTS].sort(),
    );
  });

  it('refuses a route whose first segment is not a fixed name', () => {
    @Controller() class P { @Get(':id') one() { return 1; } }
    expect(() => collectRouteRoots(containerOf(P))).toThrow(/no fixed first segment/);
  });

  it('covers every route root realtime-server clients call, and none is also an assets entry', () => {
    // The real controller lists of RealtimeServerModule and the modules it imports (TranscriptModule).
    const { RealtimeServerModule } = require('../realtime-server.module');
    const controllers = new Set<any>();
    const seen = new Set<any>();
    const walk = (mod: any) => {
      const type = mod?.module ?? mod;
      if (!type || seen.has(mod)) return;
      seen.add(mod);
      for (const c of [...(Reflect.getMetadata('controllers', type) ?? []), ...(mod?.controllers ?? [])]) controllers.add(c);
      for (const i of [...(Reflect.getMetadata('imports', type) ?? []), ...(mod?.imports ?? [])]) walk(i);
    };
    walk(RealtimeServerModule);
    const roots = collectRouteRoots(containerOf(...controllers));

    // First segments the new frontend, the legacy frontend, the venue app and the healthcheck use.
    for (const used of ['', 'case-tuple', 'doclink', 'fact', 'factsheet', 'feed', 'issue', 'marknav', 'session', 'sync', 'transcript', 'upload', 'swagger-json']) {
      expect(roots).toContain(used);
    }
    const assetNames = [...OTHER_ASSET_DIRS, ...OTHER_ASSET_FILES, 'realtime-transcripts']
      .map((n) => n.split(':')[0].replace(/[. ]+$/, '').toLowerCase());
    for (const root of roots) expect(assetNames).not.toContain(root);
  });
});

describe('serveStaticRoots / staticEntryExists', () => {
  const exists = (pathname: string, roots: string[]) => new Promise<boolean>((resolve) => staticEntryExists(pathname, roots, resolve));

  it('reads the rootPath of every ServeStatic registration mounted at "/"', () => {
    const app = (options: unknown) => ({
      get: (token: any) => {
        if (token !== SERVE_STATIC_MODULE_OPTIONS) throw new Error(`unexpected token ${String(token)}`);
        return options;
      },
    });
    expect(serveStaticRoots(app([{ rootPath: '/a' }, { rootPath: '/b', serveRoot: '/x' }, {}]))).toEqual(['/a']);
    expect(serveStaticRoots(app({ rootPath: '/single' }))).toEqual(['/single']);
    expect(serveStaticRoots({ get: () => { throw new Error('no ServeStatic in this app'); } })).toEqual([]);
  });

  it("finds RealtimeServerModule's assets root, so the check runs in production", () => {
    const { RealtimeServerModule } = require('../realtime-server.module');
    const registrations = (Reflect.getMetadata('imports', RealtimeServerModule) ?? [])
      .filter((i: any) => i?.module === ServeStaticModule)
      .flatMap((i: any) => i.providers ?? [])
      .filter((p: any) => p?.provide === SERVE_STATIC_MODULE_OPTIONS);
    expect(registrations).toHaveLength(1);
    expect(serveStaticRoots({ get: () => registrations[0].useValue })).toEqual([path.join(process.cwd(), 'assets')]);
  });

  it('reports an entry only where send would open one', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-static-exists-'));
    try {
      fs.mkdirSync(path.join(root, 'probe', 'sub'), { recursive: true });
      fs.writeFileSync(path.join(root, 'probe', 'planted.txt'), 'PLANTED');
      expect(await exists('/probe/planted.txt', [root])).toBe(true);
      expect(await exists('/probe', [root])).toBe(true); // a folder: send would redirect, so it counts
      expect(await exists('/probe/sub/../planted.txt', [root])).toBe(true);
      expect(await exists('/probe/missing.txt', [root])).toBe(false);
      expect(await exists('/probe/planted.txt/x', [root])).toBe(false); // ENOTDIR
      expect(await exists('/probe/planted.txt', [])).toBe(false);
      expect(await exists('/probe/planted.txt', [path.join(root, 'none'), root])).toBe(true);
      expect(await exists('/', [root])).toBe(false); // the root route, never a static file
      expect(await exists('/probe%5Cplanted.txt', [root])).toBe(false); // refused before any lookup
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('upload routes behind the global-admin gate', () => {
  // The real UploadController, wired like RealtimeServerModule: login middleware on the controller,
  // then RealtimeAdminMiddleware on UPLOAD_ADMIN_ROUTES. Middleware runs before the multer
  // interceptor, so a refused upload must not create anything on disk.
  const probeCase = '99999999-9999-4999-8999-999999999999';
  const probeName = `gate_probe_${process.pid}_${Date.now()}`;
  const caseDir = path.resolve('assets', 'doc', `case${probeCase}`);
  const transcriptFile = path.resolve('assets', 'realtime-transcripts', `${probeName}.TXT`);
  let app: INestApplication;
  let port: number;

  @Module({ controllers: [UploadController], providers })
  class UploadGateModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
      consumer.apply(RealtimeAuthMiddleware).forRoutes(UploadController);
      consumer.apply(RealtimeAdminMiddleware).forRoutes(...UPLOAD_ADMIN_ROUTES);
    }
  }

  function multipart(fields: Record<string, string>): { body: Buffer; type: string } {
    const boundary = '----gateprobe' + Date.now();
    const parts = Object.entries(fields).map(([k, v]) => `--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`);
    parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="t.txt"\r\nContent-Type: text/plain\r\n\r\nTAMPERED\r\n`);
    parts.push(`--${boundary}--\r\n`);
    return { body: Buffer.from(parts.join('')), type: `multipart/form-data; boundary=${boundary}` };
  }

  function post(target: string, fields: Record<string, string>): Promise<number> {
    const { body, type } = multipart(fields);
    return new Promise((resolve, reject) => {
      const req = http.request({
        host: '127.0.0.1', port, method: 'POST', path: target,
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': type, 'Content-Length': body.length },
      }, (res) => { res.resume(); res.on('end', () => resolve(res.statusCode)); });
      req.on('error', reject);
      req.end(body);
    });
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [UploadGateModule] }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    await app.listen(0, '127.0.0.1');
    port = (app.getHttpServer().address() as any).port;
  });

  afterAll(async () => {
    await app?.close();
    // Only present if the gate failed and multer wrote the probe files.
    fs.rmSync(caseDir, { recursive: true, force: true });
    fs.rmSync(transcriptFile, { force: true });
  });

  it('refuses a non-admin login on both routes before multer writes anything', async () => {
    session = { id: 'browser-1', a: false };
    expect(await post('/upload', { caseid: probeCase, filename: `s_${SES}` })).toBe(403);
    expect(await post('/upload/transcript-file', { filename: probeName })).toBe(403);
    expect(await post('/Upload/Transcript-File/', { filename: probeName })).toBe(403);
    expect(fs.existsSync(caseDir)).toBe(false);
    expect(fs.existsSync(transcriptFile)).toBe(false);
  });

  it('still lets a global admin upload (the gate runs after the login middleware has set req.user)', async () => {
    session = { id: 'browser-1', a: true };
    try {
      expect(await post('/upload/transcript-file', { filename: probeName })).toBe(201);
      expect(fs.readFileSync(transcriptFile, 'utf8')).toBe('TAMPERED');
    } finally {
      fs.rmSync(transcriptFile, { force: true });
      session = { id: 'browser-1', a: false };
    }
  });
});
