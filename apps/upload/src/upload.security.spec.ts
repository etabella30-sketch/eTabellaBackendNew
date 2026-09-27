import { INestApplication, MiddlewareConsumer, Module, NestModule, ValidationPipe } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common/enums/request-method.enum';
import { ConfigService } from '@nestjs/config';
import { getQueueToken } from '@nestjs/bull';
import { MulterModule } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import * as cookieParser from 'cookie-parser';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import * as os from 'os';
import * as path from 'path';
import * as request from 'supertest';
import { DbService } from '@app/global/db/pg/db.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { LogService } from '@app/global/utility/log/log.service';
import { UploadModule } from './upload.module';
import { UploadService } from './upload.service';
import { ChunksUploadService } from './services/chunks-upload/chunks-upload.service';
import { UtilityService } from './services/utility/utility.service';
import { QueueManageService } from './services/queue-manage/queue-manage.service';
import { ExportsService } from './services/exports/exports.service';
import { ConvertService } from './services/convert/convert.service';
import { EmailService } from './services/convert/email/email.service';
import { OcrService } from './services/ocr/ocr.service';
import { ProfileService } from './services/profile/profile.service';
import { HelpcenterService } from './services/helpcenter/helpcenter.service';
import { filecopyService } from './services/filecopy/filecopy.service';

// A real Nest HTTP app built from the upload app's own controller list, its own multer registration
// (UploadModule's MulterModule.register) and its own UploadModule.configure() (the JwtMiddleware
// wiring), with the ValidationPipe and cookie parser main.ts installs. The chunk service, profile and
// help-centre services are the real ones; only Redis, Postgres, the Bull queues, logging, s3cmd and
// the conversion services are stand-ins. Every test runs in its own empty temp working directory, so
// "nothing was written" is checked by walking the whole directory tree.

const SECRET = 'upload-security-secret';
const USER = '11111111-1111-4111-8111-111111111111';
const CASE = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const OTHER_CASE = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const UPID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
// The legacy uploader's identifier is `${file.name}_${uuid}`: spaces, brackets, '&', an apostrophe,
// a dot and a non-ASCII dash all occur in real file names.
const LEGACY_ID = `Exhibit 12 (final) – Smith & Co's.pdf_2b8c7a9e-4f1d-4c3a-9d2e-7a6b5c4d3e2f`;
const VENUE_ID = '5d0c4b3a-2e1f-4a9b-8c7d-6e5f4a3b2c1d';
// The venue's cases come from realtime-server's et_realtime_caselist (cloud CaseMaster uuids).
const VENUE_CASE = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

// Plain values (the upload-owner records /status writes); cleared before every test.
const redisValues = new Map<string, string>();
const rds = {
    getValue: jest.fn(async (key: string) => (key === `user/${USER}` ? JSON.stringify({ id: 'browser-1', a: false }) : (redisValues.get(key) ?? null))),
    setValue: jest.fn(async (key: string, value: string) => { redisValues.set(key, value); }),
    deleteValue: jest.fn(async () => undefined),
    getMaxFromList: jest.fn(async () => NaN),
    getChunkObject: jest.fn(async () => ({ maxChunk: 10 })),
    setChunkObject: jest.fn(async () => undefined),
    getChunkArray: jest.fn(async () => []),
    setChunkArray: jest.fn(async () => undefined),
    pushAndTrimList: jest.fn(async () => undefined),
    countInc: jest.fn(async () => 1),
    deleteChunks: jest.fn(async () => undefined),
};
// USER is an active member of every case here (case rules: upload.case-access.spec.ts).
const db = {
    executeRef: jest.fn(async () => ({ success: true, data: [[]] })),
    rowQuery: jest.fn(async () => ({
        success: true,
        data: [{ bCase: true, bAllowed: true, bSectionInCase: true, bBundleInCase: true, bDocumentsInCase: true, bUploadsInCase: true, bUploadRowsInCase: true }],
    })),
};
const queue = () => ({ on: jest.fn(), add: jest.fn(async () => ({ id: 1 })), clean: jest.fn(async () => []) });
const queues = {
    'file-merge': queue(),
    'sequence-file-merge': queue(),
    'fileocr-process': queue(),
    convert: queue(),
};
const CONFIG: Record<string, string> = {
    JWT_SECRET: SECRET,
    ASSETS: './assets/',
    USER_PROFILE_PATH: 'profile/',
    HELPCENTER_FILE_PATH: 'helpcenter/',
    TICKET_FILE_PATH: 'ticket/',
};
const config = { get: (key: string) => CONFIG[key] };
const logs = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), report: jest.fn(), log: jest.fn() };
const s3 = { copyFile: jest.fn(async () => true) };
const exportsService = { generateExport: jest.fn(async () => ({ msg: 1 })), deleteFiles: jest.fn(async () => ({ msg: 1 })) };
const convertService = { fileConvert: jest.fn(async () => ({})), convertfile_multi: jest.fn(async () => ({})), getQueueLength: jest.fn(async () => 0) };
const emailService = { emailParse: jest.fn(async () => ({})), getSignedUrl: jest.fn(async () => 'signed') };
const ocrService = { fileOcr: jest.fn(async () => ({})), folderOcr: jest.fn(async () => ({})) };

const multerImport = (Reflect.getMetadata('imports', UploadModule) as any[]).find((m) => m?.module === MulterModule);

@Module({
    imports: [multerImport],
    controllers: Reflect.getMetadata('controllers', UploadModule),
    providers: [
        UploadService,
        ChunksUploadService,
        ProfileService,
        HelpcenterService,
        { provide: ConfigService, useValue: config },
        { provide: RedisDbService, useValue: rds },
        { provide: DbService, useValue: db },
        { provide: LogService, useValue: logs },
        { provide: UtilityService, useValue: { emit: jest.fn(), getUploadUser: jest.fn(async () => []) } },
        { provide: QueueManageService, useValue: {} },
        { provide: filecopyService, useValue: s3 },
        { provide: ExportsService, useValue: exportsService },
        { provide: ConvertService, useValue: convertService },
        { provide: EmailService, useValue: emailService },
        { provide: OcrService, useValue: ocrService },
        ...Object.entries(queues).map(([name, value]) => ({ provide: getQueueToken(name), useValue: value })),
    ],
})
class HarnessModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        (UploadModule.prototype as any).configure.call(this, consumer);
    }
}

const bearer = (secret = SECRET) => ({ Authorization: `Bearer ${jwt.sign({ userId: USER, broweserId: 'browser-1' }, secret)}` });

/** Every file and folder under `root`, relative, '/'-separated, sorted. */
function tree(root: string): string[] {
    const out: string[] = [];
    const walk = (dir: string) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            out.push(path.relative(root, full).split(path.sep).join('/'));
            if (entry.isDirectory()) walk(full);
        }
    };
    walk(root);
    return out.sort();
}

/** Every route of every upload controller, as [METHOD, url], from Nest's own route metadata. */
function allRoutes(): Array<[string, string]> {
    const routes: Array<[string, string]> = [];
    for (const ctrl of Reflect.getMetadata('controllers', UploadModule) as any[]) {
        const base = String(Reflect.getMetadata(PATH_METADATA, ctrl) ?? '');
        for (const key of Object.getOwnPropertyNames(ctrl.prototype)) {
            const handler = ctrl.prototype[key];
            if (key === 'constructor' || typeof handler !== 'function') continue;
            const method = Reflect.getMetadata(METHOD_METADATA, handler);
            if (method === undefined) continue;
            const sub = String(Reflect.getMetadata(PATH_METADATA, handler) ?? '');
            routes.push([RequestMethod[method], '/' + [base, sub].filter((p) => p && p !== '/').join('/')]);
        }
    }
    return routes;
}

describe('upload app: sign-in on every route, and every upload path kept in place', () => {
    let app: INestApplication;
    let home: string;
    let work: string;
    const savedEnv: Record<string, string | undefined> = {};
    const http = () => request(app.getHttpServer());

    const chunk = (url: string, fields: Array<[string, string]>, headers: Record<string, string> = {}) => {
        const req = http().post(url).set(headers);
        for (const [k, v] of fields) req.field(k, v);
        return req.attach('file', Buffer.from('chunk-bytes'), 'blob');
    };

    beforeAll(async () => {
        jest.spyOn(console, 'log').mockImplementation(() => undefined); // JwtMiddleware logs every request
        jest.spyOn(console, 'error').mockImplementation(() => undefined);
        jest.spyOn(console, 'warn').mockImplementation(() => undefined);
        for (const k of ['ASSETS', 'USER_PROFILE_PATH', 'HELPCENTER_FILE_PATH', 'TICKET_FILE_PATH']) {
            savedEnv[k] = process.env[k];
            process.env[k] = CONFIG[k];
        }
        home = process.cwd();
        const moduleRef = await Test.createTestingModule({ imports: [HarnessModule] }).compile();
        app = moduleRef.createNestApplication({ logger: false });
        app.use(cookieParser());
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
        SwaggerModule.setup('swagger', app, SwaggerModule.createDocument(app, new DocumentBuilder().build())); // as main.ts
        await app.init();
    });

    afterAll(async () => {
        await app?.close();
        for (const [k, v] of Object.entries(savedEnv)) {
            if (v === undefined) delete process.env[k];
            else process.env[k] = v;
        }
        jest.restoreAllMocks();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        redisValues.clear();
        work = fs.mkdtempSync(path.join(os.tmpdir(), 'upload-security-'));
        process.chdir(work);
    });

    afterEach(() => {
        process.chdir(home);
        fs.rmSync(work, { recursive: true, force: true });
    });

    describe('JwtMiddleware on every route', () => {
        it('covers both upload-chunk routes and every other controller route', () => {
            const routes = allRoutes().map(([m, u]) => `${m} ${u}`);
            expect(routes).toEqual(expect.arrayContaining([
                'POST /upload/upload-chunk',
                'POST /realtime-upload/upload-chunk',
                'GET /realtime-upload/status',
                'POST /realtime-upload/complete-upload',
                'GET /fileconvert/get-file-url',
                'POST /helpcenter/upload-image',
                'POST /helpcenter/upload-image-ticket',
                'GET /',
            ]));
            expect(routes.length).toBeGreaterThanOrEqual(21);
        });

        it('refuses every route without a token before its handler runs', async () => {
            for (const [method, url] of allRoutes()) {
                const res = await (http() as any)[method.toLowerCase()](url).send({});
                expect({ route: `${method} ${url}`, status: res.status, body: res.body })
                    .toEqual({ route: `${method} ${url}`, status: 403, body: { message: 'A token is required for authentication' } });
            }
            for (const fn of [
                ...Object.values(exportsService), ...Object.values(convertService),
                ...Object.values(emailService), ...Object.values(ocrService),
                s3.copyFile, rds.pushAndTrimList, rds.setChunkObject, queues['sequence-file-merge'].add,
            ]) {
                expect(fn).not.toHaveBeenCalled();
            }
            expect(tree(work)).toEqual([]);
        });

        it('leaves /swagger-json (the Docker healthcheck) open: the GET / guard matches "/" only', async () => {
            const res = await http().get('/swagger-json');
            expect(res.status).toBe(200);
            expect(res.body.paths).toHaveProperty('/upload/upload-chunk');
            expect((await http().get('/no-such-route')).status).toBe(404);
        });

        it.each(['/upload/upload-chunk', '/realtime-upload/upload-chunk'])(
            '%s: an unauthenticated chunk (legit or traversal) is refused and nothing is written',
            async (url) => {
                for (const identifier of [LEGACY_ID, '../escaped', '../../escaped']) {
                    const res = await chunk(url, [['identifier', identifier], ['chunkNumber', '0'], ['nUPid', UPID]]);
                    expect(res.status).toBe(403);
                }
                const forged = await chunk(url, [['identifier', '../escaped'], ['chunkNumber', '0']], bearer('some-other-secret'));
                expect(forged.status).toBe(401);
                expect(rds.pushAndTrimList).not.toHaveBeenCalled();
                expect(tree(work)).toEqual([]);
            },
        );

        // Express matches routes case-insensitively and with a trailing slash; Nest registers the
        // middleware through the same router, so every spelling that reaches the handler is refused.
        it.each([
            ['/UPLOAD/Upload-Chunk', 403],
            ['/upload/upload-chunk/', 403],
            ['/Realtime-Upload/UPLOAD-CHUNK/', 403],
            ['/upload//upload-chunk', 404],
        ])('%s: other spellings of the chunk route are refused without a token (%i) and write nothing', async (url, status) => {
            const res = await chunk(url, [['identifier', '../escaped'], ['chunkNumber', '0'], ['nUPid', UPID]]);
            expect(res.status).toBe(status);
            expect(rds.pushAndTrimList).not.toHaveBeenCalled();
            expect(tree(work)).toEqual([]);
        });

        // JwtMiddleware writes nMasterid into the query of every GET, and main.ts's ValidationPipe
        // (forbidNonWhitelisted) refuses a query DTO that does not declare it: each newly covered GET
        // must still answer its signed-in caller.
        it('GET /fileconvert/get-file-url still answers a signed-in caller (legacy doc-viewer email attachments)', async () => {
            const res = await http().get('/fileconvert/get-file-url').query({ cPath: `doc/case${CASE}/att_1.pdf` }).set(bearer());
            expect({ status: res.status, body: res.body }).toEqual({ status: 200, body: { url: 'signed' } });
            expect(emailService.getSignedUrl).toHaveBeenCalledWith(`doc/case${CASE}/att_1.pdf`);
        });

        it('GET / still answers a signed-in caller', async () => {
            expect((await http().get('/').set(bearer())).status).toBe(200);
        });

        it.each([
            ['POST', '/profile/upload-image'],
            ['POST', '/helpcenter/upload-image'],
            ['POST', '/helpcenter/upload-image-ticket'],
        ])('%s %s: an unauthenticated image upload writes nothing', async (_m, url) => {
            const res = await http().post(url).field('rootPath', '../../escaped').attach('file', Buffer.from('img'), 'x.png');
            expect(res.status).toBe(403);
            expect(s3.copyFile).not.toHaveBeenCalled();
            expect(tree(work)).toEqual([]);
        });
    });

    describe('chunk uploads (multer destination / file name)', () => {
        // Clients always open an upload with /status before its chunks (the chunk gate needs it).
        const open = (url: string, q: Record<string, string>) => http().get(url).query(q).set(bearer()).expect(200);

        it('a legit legacy chunk is still written under the chunk root', async () => {
            await open('/upload/status', { identifier: LEGACY_ID, nUPid: UPID, nCaseid: CASE, cPath: `doc/case${CASE}/file_123.PDF`, cTotal: '1' });
            const res = await chunk('/upload/upload-chunk', [['identifier', LEGACY_ID], ['chunkNumber', '0'], ['nUPid', UPID]], bearer());
            expect(res.status).toBe(201);
            expect(res.body).toEqual({ m: 1, i: '0' });
            expect(tree(work)).toEqual([
                'assets', 'assets/doc', `assets/doc/case${CASE}`,
                'assets/upload-chunks', `assets/upload-chunks/${LEGACY_ID}`, `assets/upload-chunks/${LEGACY_ID}/0`,
            ]);
            expect(fs.readFileSync(path.join(work, 'assets/upload-chunks', LEGACY_ID, '0'), 'utf8')).toBe('chunk-bytes');
            expect(rds.pushAndTrimList).toHaveBeenCalledWith(`chunk/${LEGACY_ID}`, 0, expect.any(Number));
        });

        it('a legit venue chunk (uuid identifier, nUPid 0) is still written under the chunk root', async () => {
            await open('/realtime-upload/status', { identifier: VENUE_ID, nUPid: '0', nCaseid: VENUE_CASE, cPath: `doc/case${VENUE_CASE}/s_9f8e7d6c-5b4a-4c3d-8e2f-1a0b9c8d7e6f.txt`, cTotal: '13' });
            const res = await chunk('/realtime-upload/upload-chunk', [['identifier', VENUE_ID], ['chunkNumber', '12'], ['nUPid', '0']], bearer());
            expect(res.status).toBe(201);
            expect(res.body).toEqual({ m: 1, i: '12' });
            expect(tree(work)).toEqual([
                'assets', 'assets/doc', `assets/doc/case${VENUE_CASE}`,
                'assets/upload-chunks', `assets/upload-chunks/${VENUE_ID}`, `assets/upload-chunks/${VENUE_ID}/12`,
            ]);
        });

        it.each([
            ['/upload/upload-chunk', '../escaped-id', '0'],
            ['/upload/upload-chunk', '..', '0'],
            ['/upload/upload-chunk', '.', '0'],
            ['/upload/upload-chunk', 'ok/../../escaped-nested', '0'],
            ['/upload/upload-chunk', 'ok/sub', '0'],
            ['/upload/upload-chunk', '..\\escaped-backslash', '0'],
            ['/upload/upload-chunk', 'a..b', '0'],
            ['/upload/upload-chunk', 'ctl\u0001char', '0'],
            ['/upload/upload-chunk', 'ok-id', '../../../escaped-chunk'],
            ['/upload/upload-chunk', 'ok-id', '1.js'],
            ['/upload/upload-chunk', 'ok-id', '-1'],
            ['/upload/upload-chunk', 'ok-id', 'abc'],
            ['/realtime-upload/upload-chunk', '../escaped-rt', '0'],
            ['/realtime-upload/upload-chunk', 'ok-id', '../../../escaped-rt-chunk'],
        ])('%s refuses identifier %j / chunkNumber %j with 400 and writes nothing', async (url, identifier, chunkNumber) => {
            const res = await chunk(url, [['identifier', identifier], ['chunkNumber', chunkNumber], ['nUPid', UPID]], bearer());
            expect(res.status).toBe(400);
            expect(rds.pushAndTrimList).not.toHaveBeenCalled();
            expect(tree(work)).toEqual([]);
        });

        it('refuses an unsafe nUPid (it names a log folder) before writing', async () => {
            const res = await chunk('/upload/upload-chunk', [['identifier', 'ok-id'], ['chunkNumber', '0'], ['nUPid', '../../escaped-log']], bearer());
            expect(res.status).toBe(400);
            expect(logs.info).not.toHaveBeenCalled();
            expect(tree(work)).toEqual([]);
        });
    });

    describe('status (the merge target path)', () => {
        const status = (url: string, q: Record<string, string>) => http().get(url).query(q).set(bearer());
        const legit = { identifier: LEGACY_ID, nUPid: UPID, nCaseid: CASE, cPath: `doc/case${CASE}/file_123.PDF`, cTotal: '3' };

        it('a legit status still answers and makes the case folder', async () => {
            const res = await status('/upload/status', legit);
            expect(res.status).toBe(200);
            expect(res.body).toEqual({ max: 0, msg: 1 });
            expect(tree(work)).toEqual(['assets', 'assets/doc', `assets/doc/case${CASE}`]);
            expect(rds.setChunkObject).toHaveBeenCalledWith(LEGACY_ID, expect.objectContaining({ path: legit.cPath }));
        });

        it.each([
            ['/upload/status', { cPath: '../../escaped-status.PDF' }],
            ['/upload/status', { cPath: `doc/case${CASE}/../../../escaped.PDF` }],
            ['/upload/status', { cPath: `doc/case${OTHER_CASE}/file_123.PDF` }],
            ['/upload/status', { cPath: `doc/case${CASE}/file_123.PDF;touch pwned` }],
            ['/upload/status', { cPath: `doc/case${CASE}/sub/file_123.PDF` }],
            ['/upload/status', { identifier: '../escaped-id' }],
            ['/realtime-upload/status', { identifier: '..' }],
            ['/realtime-upload/status', { nCaseid: '/../../escaped-case', cPath: 'doc/case/../../escaped-case/file_1.PDF' }],
            ['/realtime-upload/status', { nUPid: '../../escaped-log' }],
        ])('%s refuses %j with 400 and records / makes nothing', async (url, override) => {
            const res = await status(url, { ...legit, ...override });
            expect(res.status).toBe(400);
            expect(rds.setChunkObject).not.toHaveBeenCalled();
            expect(logs.info).not.toHaveBeenCalled();
            expect(tree(work)).toEqual([]);
        });
    });

    describe('complete-upload (the merged document name)', () => {
        const body = {
            identifier: LEGACY_ID, nUPid: UPID, nCaseid: CASE, name: 'file_123', filetype: 'PDF',
            cFilename: 'Exhibit 12.pdf', totalChunks: 1, filesize: 11,
        };

        it('a legit completion still queues the merge', async () => {
            await http().get('/upload/status').set(bearer())
                .query({ identifier: LEGACY_ID, nUPid: UPID, nCaseid: CASE, cPath: `doc/case${CASE}/file_123.PDF`, cTotal: '1' })
                .expect(200);
            const res = await http().post('/upload/complete-upload').set(bearer()).send(body);
            expect(res.status).toBe(201);
            expect(res.body).toEqual({ msg: 1, value: 'Merge started...' });
            expect(queues['sequence-file-merge'].add).toHaveBeenCalledWith(
                expect.objectContaining({ fileId: LEGACY_ID, path: `doc/case${CASE}/file_123.PDF` }),
                expect.anything(),
            );
        });

        it('a legit venue completion (uuid case, zero ids, lower-case type) still queues the merge', async () => {
            await http().get('/realtime-upload/status').set(bearer())
                .query({ identifier: VENUE_ID, nUPid: '0', nCaseid: VENUE_CASE, cPath: `doc/case${VENUE_CASE}/s_9f8e7d6c-5b4a-4c3d-8e2f-1a0b9c8d7e6f.txt`, cTotal: '1' })
                .expect(200);
            const res = await http().post('/realtime-upload/complete-upload').set(bearer()).send({
                nUDid: 0, nUPid: 0, identifier: VENUE_ID, totalChunks: 1, nCaseid: VENUE_CASE, filetype: 'txt', filesize: 5,
                name: 's_9f8e7d6c-5b4a-4c3d-8e2f-1a0b9c8d7e6f', nSectionid: 0, nBundleid: 0, nBundledetailid: 0, cFilename: 'day1.txt',
            });
            expect(res.status).toBe(201);
            expect(queues['sequence-file-merge'].add).toHaveBeenCalledWith(
                expect.objectContaining({ fileId: VENUE_ID, body: expect.objectContaining({ bisTranscript: true, nMasterid: USER }) }),
                expect.anything(),
            );
        });

        it.each([
            ['/upload/complete-upload', { name: '../../escaped' }],
            ['/upload/complete-upload', { name: 'file_1;touch pwned' }],
            ['/upload/complete-upload', { filetype: 'PDF;touch${IFS}pwned' }],
            ['/upload/complete-upload', { filetype: 'PDF x' }],
            ['/upload/complete-upload', { filetype: 'x/../../y' }],
            ['/upload/complete-upload', { identifier: '..' }],
            ['/upload/complete-upload', { identifier: '../../victim' }],
            ['/realtime-upload/complete-upload', { nCaseid: '../x' }],
            ['/realtime-upload/complete-upload', { name: '$(touch pwned)' }],
            ['/realtime-upload/complete-upload', { nUPid: '../../escaped-log' }],
        ])('%s refuses %j with 400 and queues nothing', async (url, override) => {
            const res = await http().post(url).set(bearer()).send({ ...body, ...override });
            expect(res.status).toBe(400);
            expect(queues['sequence-file-merge'].add).not.toHaveBeenCalled();
            expect(rds.countInc).not.toHaveBeenCalled();
        });
    });

    describe('profile and help-centre images (rootPath, stored name)', () => {
        const image = (url: string, fields: Array<[string, string]>, filename: string, after: Array<[string, string]> = []) => {
            const req = http().post(url).set(bearer());
            for (const [k, v] of fields) req.field(k, v);
            req.attach('file', Buffer.from('image-bytes'), filename);
            for (const [k, v] of after) req.field(k, v);
            return req;
        };

        it('a legit profile photo is still stored under profile/<rootPath> and sent to S3', async () => {
            const res = await image('/profile/upload-image', [['rootPath', 'users']], 'avatar.webp');
            expect(res.status).toBe(201);
            expect(res.body).toEqual({ msg: 1, value: expect.stringMatching(/^user\d+\.webp$/) });
            expect(tree(work)).toEqual(['assets', 'assets/profile', 'assets/profile/users', `assets/profile/users/${res.body.value}`]);
            expect(s3.copyFile).toHaveBeenCalledWith(`profile/users/${res.body.value}`, 'C', undefined, undefined, undefined, undefined, undefined, undefined, undefined, true);
        });

        it('a legit help-centre image is still stored under helpcenter/<rootPath>', async () => {
            const res = await image('/helpcenter/upload-image', [['rootPath', 'help']], 'diagram.PNG');
            expect(res.status).toBe(201);
            expect(res.body).toEqual({ msg: 1, value: expect.stringMatching(/^module\d+\.PNG$/) });
            expect(s3.copyFile).toHaveBeenCalledWith(`helpcenter/help/${res.body.value}`, 'C');
        });

        it.each([
            ['/profile/upload-image', '../../escaped-profile'],
            ['/profile/upload-image', 'users/../../../escaped'],
            ['/profile/upload-image', '..'],
            ['/helpcenter/upload-image', '../../escaped-help'],
            ['/helpcenter/upload-image', 'help;touch pwned'],
        ])('%s refuses rootPath %j with 400 and writes nothing', async (url, rootPath) => {
            const res = await image(url, [['rootPath', rootPath]], 'x.png');
            expect(res.status).toBe(400);
            expect(s3.copyFile).not.toHaveBeenCalled();
            expect(tree(work)).toEqual([]);
        });

        it.each([
            ['/profile/upload-image', [['rootPath', 'users']]],
            ['/helpcenter/upload-image', [['rootPath', 'help']]],
            ['/helpcenter/upload-image-ticket', []],
        ] as Array<[string, Array<[string, string]>]>)('%s refuses a file name whose extension is not plain letters/digits', async (url, fields) => {
            const res = await image(url, fields, 'x.png;touch pwned');
            expect(res.status).toBe(400);
            expect(s3.copyFile).not.toHaveBeenCalled();
            expect(tree(work)).toEqual([]);
        });

        it.each([
            ['/profile/upload-image', 'users'],
            ['/helpcenter/upload-image', 'help'],
        ])('%s: a second rootPath sent after the file never reaches the S3 key', async (url, rootPath) => {
            const res = await image(url, [['rootPath', rootPath]], 'x.webp', [['rootPath', `${rootPath};touch pwned`]]);
            expect(res.status).toBe(201);
            expect(res.body).toEqual({ msg: -1, error: 'Invalid rootPath' });
            expect(s3.copyFile).not.toHaveBeenCalled();
        });
    });
});
