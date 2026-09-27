import { INestApplication, MiddlewareConsumer, Module, NestModule, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getQueueToken } from '@nestjs/bull';
import { MulterModule } from '@nestjs/platform-express';
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

// Phase 8 of the upload hardening: who may act on which case, image types, the multipart nMasterid,
// and identifiers named like Object members. Same harness as upload.security.spec.ts: a real Nest HTTP
// app from UploadModule's own controllers, multer registration and configure(), with the real chunk,
// profile and help-centre services; Postgres is a small model of the case rule (who is an active
// member or a global admin, which case each id belongs to), Redis a Map. Each test runs in an empty
// temp working directory, so "nothing was written" is a walk of the whole tree.

const SECRET = 'upload-case-access-secret';
const MEMBER = '11111111-1111-4111-8111-111111111111';   // active member of CASE
const MEMBER2 = '22222222-2222-4222-8222-222222222222';  // active member of CASE
const OUTSIDER = '33333333-3333-4333-8333-333333333333'; // active member of OTHER_CASE only
const ADMIN = '44444444-4444-4444-8444-444444444444';    // global admin, on no team
const VICTIM = '55555555-5555-4555-8555-555555555555';

const CASE = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const OTHER_CASE = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const id = (c: string, n: number) => `${c.slice(0, 8)}-0000-4000-8000-${String(n).padStart(12, '0')}`;
const SECTION = id(CASE, 1), BUNDLE = id(CASE, 2), DOC = id(CASE, 3), UPID = id(CASE, 4), UDID = id(CASE, 5);
const O_SECTION = id(OTHER_CASE, 1), O_BUNDLE = id(OTHER_CASE, 2), O_DOC = id(OTHER_CASE, 3), O_UPID = id(OTHER_CASE, 4), O_UDID = id(OTHER_CASE, 5);

const MEMBERS: Record<string, string[]> = { [CASE]: [MEMBER, MEMBER2], [OTHER_CASE]: [OUTSIDER] };
const CASE_OF: Record<string, string> = {
    [SECTION]: CASE, [BUNDLE]: CASE, [DOC]: CASE, [UPID]: CASE, [UDID]: CASE,
    [O_SECTION]: OTHER_CASE, [O_BUNDLE]: OTHER_CASE, [O_DOC]: OTHER_CASE, [O_UPID]: OTHER_CASE, [O_UDID]: OTHER_CASE,
};
const mayUse = (user: string, c: string) => user === ADMIN || (MEMBERS[c] ?? []).includes(user);

/** The case rule as the SQL states it: 7 params = case + ids, 2 params = one document. */
const rowQuery = jest.fn(async (_sql: string, params: any[]) => {
    if (params.length === 7) {
        const [user, c, section, bundle, docs, uploads, rows] = params;
        const inCase = (x: string) => CASE_OF[x] === c;
        return {
            success: true,
            data: [{
                bCase: c in MEMBERS, bAllowed: mayUse(user, c),
                bSectionInCase: section == null || inCase(section), bBundleInCase: bundle == null || inCase(bundle),
                bDocumentsInCase: docs.every(inCase), bUploadsInCase: uploads.every(inCase), bUploadRowsInCase: rows.every(inCase),
            }],
        };
    }
    if (params.length === 2) {
        const [user, doc] = params;
        return { success: true, data: [{ bAllowed: user === ADMIN || (!!CASE_OF[doc] && mayUse(user, CASE_OF[doc])) }] };
    }
    return { success: false, error: 'unexpected query' };
});

const redisValues = new Map<string, string>();
const chunkArrays = new Map<string, number[]>();
const rds = {
    getValue: jest.fn(async (key: string) => {
        const user = /^user\/(.+)$/.exec(key)?.[1];
        if (user) return JSON.stringify({ id: 'browser-1', a: user === ADMIN });
        return redisValues.get(key) ?? null;
    }),
    setValue: jest.fn(async (key: string, value: string) => { redisValues.set(key, value); }),
    deleteValue: jest.fn(async () => undefined),
    getMaxFromList: jest.fn(async () => NaN),
    getChunkObject: jest.fn(async () => ({ maxChunk: 10 })),
    setChunkObject: jest.fn(async () => undefined),
    getChunkArray: jest.fn(async (identifier: string) => [...(chunkArrays.get(identifier) ?? [])]),
    setChunkArray: jest.fn(async () => undefined),
    pushAndTrimList: jest.fn(async () => undefined),
    countInc: jest.fn(async () => 1),
    deleteChunks: jest.fn(async () => undefined),
};
const db = { executeRef: jest.fn(async () => ({ success: true, data: [[]] })), rowQuery };
const queue = () => ({ on: jest.fn(), add: jest.fn(async () => ({ id: 1 })), clean: jest.fn(async () => []) });
const queues = { 'file-merge': queue(), 'sequence-file-merge': queue(), 'fileocr-process': queue(), convert: queue() };
const CONFIG: Record<string, string> = {
    JWT_SECRET: SECRET, ASSETS: './assets/', USER_PROFILE_PATH: 'profile/', HELPCENTER_FILE_PATH: 'helpcenter/', TICKET_FILE_PATH: 'ticket/',
};
const logs = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), report: jest.fn(), log: jest.fn() };
const s3 = { copyFile: jest.fn(async () => true) };
const exportsService = { generateExport: jest.fn(async () => ({ msg: 1 })), deleteFiles: jest.fn(async () => ({ msg: 1 })) };
const convertService = { fileConvert: jest.fn(async () => ({ msg: 1 })), convertfile_multi: jest.fn(async () => ({ msg: 1 })), getQueueLength: jest.fn(async () => 0) };
const emailService = { emailParse: jest.fn(async () => ({ msg: 1 })), getSignedUrl: jest.fn(async () => 'signed') };
const ocrService = { fileOcr: jest.fn(async () => ({ msg: 1 })), folderOcr: jest.fn(async () => ({ msg: 1 })) };

const multerImport = (Reflect.getMetadata('imports', UploadModule) as any[]).find((m) => m?.module === MulterModule);

@Module({
    imports: [multerImport],
    controllers: Reflect.getMetadata('controllers', UploadModule),
    providers: [
        UploadService, ChunksUploadService, ProfileService, HelpcenterService,
        { provide: ConfigService, useValue: { get: (key: string) => CONFIG[key] } },
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

const token = (user: string) => ({ Authorization: `Bearer ${jwt.sign({ userId: user, broweserId: 'browser-1' }, SECRET)}` });

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

const settle = async (done: () => boolean) => {
    for (let i = 0; i < 100 && !done(); i++) await new Promise((r) => setTimeout(r, 10));
};

const ROUTES = [['upload'], ['realtime-upload']] as const;
const ID = 'Exhibit 7 (final).pdf_7b1c2d3e-4f5a-4b6c-8d7e-9f0a1b2c3d4e';

describe('upload app: case rule, image types, token nMasterid, Object-named identifiers', () => {
    let app: INestApplication;
    let home: string;
    let work: string;
    const savedEnv: Record<string, string | undefined> = {};
    const http = () => request(app.getHttpServer());

    const statusQuery = (identifier: string, over: Record<string, string> = {}) =>
        ({ identifier, nUPid: UPID, nCaseid: CASE, cPath: `doc/case${CASE}/file_1.PDF`, cTotal: '2', ...over });
    const status = (route: string, user: string, query: Record<string, string>) =>
        http().get(`/${route}/status`).query(query).set(token(user));
    const chunk = (route: string, user: string, fields: Array<[string, string]>) => {
        const req = http().post(`/${route}/upload-chunk`).set(token(user));
        for (const [k, v] of fields) req.field(k, v);
        return req.attach('file', Buffer.from('chunk-bytes'), 'blob');
    };
    const completeBody = (identifier: string, over: Record<string, unknown> = {}) => ({
        identifier, nUPid: UPID, nUDid: UDID, nCaseid: CASE, nSectionid: SECTION, nBundleid: BUNDLE,
        name: 'file_1', filetype: 'PDF', cFilename: 'Exhibit 7.pdf', totalChunks: 2, filesize: 11, ...over,
    });
    const complete = (route: string, user: string, body: Record<string, unknown>) =>
        http().post(`/${route}/complete-upload`).set(token(user)).send(body);

    beforeAll(async () => {
        jest.spyOn(console, 'log').mockImplementation(() => undefined);
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
        chunkArrays.clear();
        work = fs.mkdtempSync(path.join(os.tmpdir(), 'upload-case-access-'));
        process.chdir(work);
    });

    afterEach(() => {
        process.chdir(home);
        fs.rmSync(work, { recursive: true, force: true });
    });

    describe('1. status: only a global admin or an active member of the case opens an upload', () => {
        it.each(ROUTES)('/%s/status: a user from another case is refused, and nothing is recorded or made', async (route) => {
            const res = await status(route, OUTSIDER, statusQuery(ID));
            expect(res.status).toBe(403);
            expect(rds.setChunkObject).not.toHaveBeenCalled();
            expect(redisValues.size).toBe(0);
            expect(tree(work)).toEqual([]);
        });

        it.each(ROUTES)('/%s/status: a member and a global admin are still answered', async (route) => {
            expect((await status(route, MEMBER, statusQuery(ID))).body).toEqual({ max: 0, msg: 1 });
            expect((await status(route, ADMIN, statusQuery(`${ID}-admin`))).body).toEqual({ max: 0, msg: 1 });
            expect(tree(work)).toEqual(['assets', 'assets/doc', `assets/doc/case${CASE}`]);
        });

        it('refuses an upload job (nUPid) of another case', async () => {
            const res = await status('upload', MEMBER, statusQuery(ID, { nUPid: O_UPID }));
            expect(res.status).toBe(403);
            expect(rds.setChunkObject).not.toHaveBeenCalled();
            expect(tree(work)).toEqual([]);
        });

        it('refuses a case id that is not a cloud case uuid (the venue sends CaseMaster uuids)', async () => {
            const res = await status('realtime-upload', MEMBER, statusQuery(ID, { nCaseid: '1091', cPath: 'doc/case1091/s_1.PDF' }));
            expect(res.status).toBe(403);
            expect(tree(work)).toEqual([]);
        });

        it('refuses a second user re-opening an identifier someone else opened; the owner may re-open it (resume)', async () => {
            expect((await status('upload', MEMBER, statusQuery(ID))).status).toBe(200);
            rds.setChunkObject.mockClear();
            const res = await status('upload', MEMBER2, statusQuery(ID, { cPath: `doc/case${CASE}/file_2.PDF` }));
            expect(res.status).toBe(403);
            expect(rds.setChunkObject).not.toHaveBeenCalled();
            expect((await status('upload', MEMBER, statusQuery(ID))).status).toBe(200);
        });
    });

    describe('1. upload-chunk: only the user who opened the upload adds chunks to it', () => {
        it.each(ROUTES)('/%s/upload-chunk: a chunk for an identifier nobody opened is refused; nothing is written', async (route) => {
            const res = await chunk(route, MEMBER, [['identifier', ID], ['chunkNumber', '0'], ['nUPid', UPID]]);
            expect(res.status).toBe(403);
            expect(rds.pushAndTrimList).not.toHaveBeenCalled();
            expect(tree(work)).toEqual([]);
        });

        it.each(ROUTES)('/%s/upload-chunk: a chunk for another user\'s upload is refused; nothing is written', async (route) => {
            await status(route, MEMBER, statusQuery(ID)).expect(200);
            for (const user of [OUTSIDER, MEMBER2]) {
                const res = await chunk(route, user, [['identifier', ID], ['chunkNumber', '0'], ['nUPid', UPID]]);
                expect(res.status).toBe(403);
            }
            expect(rds.pushAndTrimList).not.toHaveBeenCalled();
            expect(tree(work)).toEqual(['assets', 'assets/doc', `assets/doc/case${CASE}`]);
        });

        it.each(ROUTES)('/%s/upload-chunk: the owner\'s chunks are still written', async (route) => {
            await status(route, MEMBER, statusQuery(ID)).expect(200);
            const res = await chunk(route, MEMBER, [['identifier', ID], ['chunkNumber', '0'], ['nUPid', UPID]]);
            expect(res.status).toBe(201);
            expect(tree(work)).toContain(`assets/upload-chunks/${ID}/0`);
        });
    });

    describe('1. complete-upload: the case, every id in it, and the opened path', () => {
        it.each(ROUTES)('/%s/complete-upload: a user from another case cannot complete into the case', async (route) => {
            await status(route, MEMBER, statusQuery(ID)).expect(200);
            const res = await complete(route, OUTSIDER, completeBody(ID));
            expect(res.status).toBe(403);
            expect(queues['sequence-file-merge'].add).not.toHaveBeenCalled();
            expect(rds.countInc).not.toHaveBeenCalled();
        });

        it.each([
            ['nSectionid', O_SECTION],
            ['nBundleid', O_BUNDLE],
            ['nBundledetailid', O_DOC],   // a replace: et_upload_updatefileinfo rewrites that document's path
            ['nUPid', O_UPID],
            ['nUDid', O_UDID],
        ])('refuses %s of another case (member of the case named)', async (field, value) => {
            await status('upload', MEMBER, statusQuery(ID)).expect(200);
            const res = await complete('upload', MEMBER, completeBody(ID, { [field]: value }));
            expect(res.status).toBe(403);
            expect(queues['sequence-file-merge'].add).not.toHaveBeenCalled();
        });

        it('refuses completing into another name than the one opened (the chunks went to the opened path)', async () => {
            await status('upload', MEMBER, statusQuery(ID)).expect(200);
            const res = await complete('upload', MEMBER, completeBody(ID, { name: 'file_2' }));
            expect(res.status).toBe(403);
            expect(queues['sequence-file-merge'].add).not.toHaveBeenCalled();
        });

        it.each(ROUTES)('/%s/complete-upload: refuses an upload another member opened, and one nobody opened', async (route) => {
            await status(route, MEMBER, statusQuery(ID)).expect(200);
            expect((await complete(route, MEMBER2, completeBody(ID))).status).toBe(403);
            expect((await complete(route, MEMBER, completeBody(`${ID}-never-opened`))).status).toBe(403);
            expect(queues['sequence-file-merge'].add).not.toHaveBeenCalled();
        });

        it('a legit legacy completion (member, the case\'s own section, bundle, document and upload rows) queues the merge as the token user', async () => {
            await status('upload', MEMBER, statusQuery(ID)).expect(200);
            const res = await complete('upload', MEMBER, completeBody(ID, { nBundledetailid: DOC }));
            expect(res.status).toBe(201);
            expect(res.body).toEqual({ msg: 1, value: 'Merge started...' });
            expect(queues['sequence-file-merge'].add).toHaveBeenCalledWith(
                expect.objectContaining({ fileId: ID, path: `doc/case${CASE}/file_1.PDF`, body: expect.objectContaining({ nMasterid: MEMBER }) }),
                expect.anything(),
            );
        });

        it('a legit venue completion (uuid case, zero ids) and a global admin\'s still queue the merge', async () => {
            const venue = { identifier: '5d0c4b3a-2e1f-4a9b-8c7d-6e5f4a3b2c1d', nUPid: '0', nCaseid: CASE, cPath: `doc/case${CASE}/s_9f8e.txt`, cTotal: '1' };
            await status('realtime-upload', MEMBER, venue).expect(200);
            const res = await complete('realtime-upload', MEMBER, {
                nUDid: 0, nUPid: 0, identifier: venue.identifier, totalChunks: 1, nCaseid: CASE, filetype: 'txt', filesize: 5,
                name: 's_9f8e', nSectionid: SECTION, nBundleid: 0, nBundledetailid: 0, cFilename: 'day1.txt', cPath: venue.cPath,
            });
            expect(res.status).toBe(201);
            await status('upload', ADMIN, statusQuery(`${ID}-admin`)).expect(200);
            expect((await complete('upload', ADMIN, completeBody(`${ID}-admin`))).status).toBe(201);
            expect(queues['sequence-file-merge'].add).toHaveBeenCalledTimes(2);
        });
    });

    describe('1. get-file-url: only doc/case<uuid>/ keys of a case the caller may use', () => {
        const url = (user: string, cPath: string) => http().get('/fileconvert/get-file-url').query({ cPath }).set(token(user));

        it('a user from another case cannot presign the case\'s key', async () => {
            const res = await url(OUTSIDER, `doc/case${CASE}/${DOC}/mail.html`);
            expect(res.status).toBe(403);
            expect(emailService.getSignedUrl).not.toHaveBeenCalled();
        });

        it.each([
            'profile/users/user1.webp',
            '.env',
            `doc/case${CASE}/../case${OTHER_CASE}/x.pdf`,
            `doc/case${CASE}/./x.pdf`,
            `doc/case${CASE}//x.pdf`,
            `doc/case${CASE}/a\\b.pdf`,
            `doc/case${CASE}`,
            `doc/case${CASE}/`,
            'doc/case1091/file_1.PDF',
            `doc/case${OTHER_CASE}/file_1.PDF`,
        ])('refuses key %j even for a member of CASE', async (key) => {
            const res = await url(MEMBER, key);
            expect(res.status).toBe(403);
            expect(emailService.getSignedUrl).not.toHaveBeenCalled();
        });

        it('a member still gets the doc-viewer\'s e-mail key and a document key of its case', async () => {
            for (const key of [`doc/case${CASE}/${DOC}/mail.html`, `doc/case${CASE}/file_1.PDF`]) {
                const res = await url(MEMBER, key);
                expect({ status: res.status, body: res.body }).toEqual({ status: 200, body: { url: 'signed' } });
            }
        });
    });

    describe('1. the other routes that name a case, a section, a document or upload rows', () => {
        const cases: Array<[string, string, string, Record<string, unknown>, jest.Mock]> = [
            ['POST', '/fileconvert/convertfile', OUTSIDER, { nCaseid: CASE, nBundledetailid: DOC }, convertService.fileConvert],
            ['POST', '/fileconvert/convertfile', MEMBER, { nCaseid: CASE, nBundledetailid: O_DOC }, convertService.fileConvert],
            ['POST', '/fileconvert/email_parse', OUTSIDER, { nCaseid: CASE, nBundledetailid: DOC }, emailService.emailParse],
            ['POST', '/fileconvert/email_parse', MEMBER, { nCaseid: CASE, nBundledetailid: O_DOC }, emailService.emailParse],
            ['POST', '/fileconvert/convertfile_multi', OUTSIDER, { nCaseid: CASE, nSectionid: SECTION, jBids: '{}' }, convertService.convertfile_multi],
            ['POST', '/fileconvert/convertfile_multi', MEMBER, { nCaseid: CASE, nSectionid: O_SECTION, jBids: '{}' }, convertService.convertfile_multi],
            ['GET', '/fileconvert/convertlength', OUTSIDER, { nCaseid: CASE }, convertService.getQueueLength],
            ['POST', '/ocr/ocrfile', MEMBER, { nBundledetailid: O_DOC, nOcrtype: 1 }, ocrService.fileOcr],
            ['POST', '/ocr/ocrfile', OUTSIDER, { nBundledetailid: DOC, nOcrtype: 1 }, ocrService.fileOcr],
            ['POST', '/ocr/ocrfile_multi', OUTSIDER, { nCaseid: CASE, nSectionid: SECTION, jBids: '{}', nOcrtype: 1 }, ocrService.folderOcr],
            ['POST', '/ocr/ocrfile_multi', MEMBER, { nCaseid: CASE, nSectionid: O_SECTION, jBids: '{}', nOcrtype: 1 }, ocrService.folderOcr],
            ['POST', '/exports/upload-report', OUTSIDER, { nCaseid: CASE, nUPid: UPID }, exportsService.generateExport],
            ['POST', '/exports/upload-report', MEMBER, { nCaseid: CASE, nUPid: O_UPID }, exportsService.generateExport],
            ['DELETE', '/exports/delete-files', OUTSIDER, { nCaseid: CASE, jFiles: JSON.stringify([UDID]) }, exportsService.deleteFiles],
            ['DELETE', '/exports/delete-files', MEMBER, { nCaseid: CASE, jFiles: JSON.stringify([UDID, O_UDID]) }, exportsService.deleteFiles],
            ['DELETE', '/exports/delete-files', MEMBER, { nCaseid: CASE, jFiles: JSON.stringify({ x: O_UDID }) }, exportsService.deleteFiles],
        ];
        const send = (method: string, url: string, user: string, payload: Record<string, unknown>) =>
            method === 'GET'
                ? http().get(url).query(payload as any).set(token(user))
                : (http() as any)[method.toLowerCase()](url).set(token(user)).send(payload);

        it.each(cases)('%s %s as %s with %j is refused before the service runs', async (method, url, user, payload, service) => {
            const res = await send(method, url, user, payload);
            expect(res.status).toBe(403);
            expect(service).not.toHaveBeenCalled();
        });

        it.each([
            ['POST', '/fileconvert/convertfile', { nCaseid: CASE, nBundledetailid: DOC }, convertService.fileConvert],
            ['POST', '/fileconvert/email_parse', { nCaseid: CASE, nBundledetailid: DOC }, emailService.emailParse],
            ['POST', '/fileconvert/convertfile_multi', { nCaseid: CASE, nSectionid: SECTION, jBids: '{}' }, convertService.convertfile_multi],
            ['GET', '/fileconvert/convertlength', { nCaseid: CASE }, convertService.getQueueLength],
            ['POST', '/ocr/ocrfile', { nBundledetailid: DOC, nOcrtype: 1 }, ocrService.fileOcr],
            ['POST', '/ocr/ocrfile_multi', { nCaseid: CASE, nSectionid: SECTION, jBids: '{}', nOcrtype: 1 }, ocrService.folderOcr],
            ['POST', '/exports/upload-report', { nCaseid: CASE, nUPid: UPID }, exportsService.generateExport],
            ['DELETE', '/exports/delete-files', { nCaseid: CASE, jFiles: JSON.stringify([UDID]) }, exportsService.deleteFiles],
        ] as Array<[string, string, Record<string, unknown>, jest.Mock]>)('%s %s still serves a member of the case', async (method, url, payload, service) => {
            const res = await send(method, url, MEMBER, payload);
            expect(res.status).toBeLessThan(300);
            expect(service).toHaveBeenCalledTimes(1);
        });

        it('a failed access lookup answers 500 and runs nothing', async () => {
            rowQuery.mockResolvedValueOnce({ success: false, error: 'db down' } as any);
            const res = await send('POST', '/fileconvert/convertfile', MEMBER, { nCaseid: CASE, nBundledetailid: DOC });
            expect(res.status).toBe(500);
            expect(convertService.fileConvert).not.toHaveBeenCalled();
        });
    });

    describe('2. image routes keep image types only (the stored file is served from the site)', () => {
        const image = (url: string, fields: Array<[string, string]>, filename: string) => {
            const req = http().post(url).set(token(MEMBER));
            for (const [k, v] of fields) req.field(k, v);
            return req.attach('file', Buffer.from('<svg onload=alert(1)>'), filename);
        };
        const users: Array<[string, string]> = [['rootPath', 'users']];
        const help: Array<[string, string]> = [['rootPath', 'help']];

        it.each([
            ['/profile/upload-image', 'page.html', users],
            ['/profile/upload-image', 'icon.svg', users],
            ['/profile/upload-image', 'x.js', users],
            ['/profile/upload-image', 'anim.gif', users],     // never reached S3: no webp is made for it
            ['/profile/upload-image', 'blob', users],
            ['/helpcenter/upload-image', 'x.svg', help],
            ['/helpcenter/upload-image', 'x.html', help],
            ['/helpcenter/upload-image', 'x.xhtml', help],
            ['/helpcenter/upload-image-ticket', 'x.SVG', []],
            ['/helpcenter/upload-image-ticket', 'x.htm', []],
            ['/helpcenter/upload-image-ticket', 'noext', []],
        ] as Array<[string, string, Array<[string, string]>]>)('%s refuses %j with 400 before anything is written', async (url, filename, fields) => {
            const res = await image(url, fields, filename);
            expect(res.status).toBe(400);
            expect(s3.copyFile).not.toHaveBeenCalled();
            expect(tree(work)).toEqual([]);
        });

        it.each([
            ['/profile/upload-image', 'avatar.webp', users],
            ['/profile/upload-image', 'Photo.JPG', users],
            ['/profile/upload-image', 'scan.jpeg', users],
            ['/helpcenter/upload-image', 'diagram.PNG', help],
            ['/helpcenter/upload-image', 'loop.gif', help],
            ['/helpcenter/upload-image-ticket', 'Screen Shot 2026-09-23.png', []],
        ] as Array<[string, string, Array<[string, string]>]>)('%s still takes %j', async (url, filename, fields) => {
            const res = await image(url, fields, filename);
            expect(res.status).toBe(201);
        });
    });

    describe('3. nMasterid on the multipart chunk routes is the token user', () => {
        it.each(ROUTES)('/%s/upload-chunk: a form field nMasterid cannot name the merge-job user', async (route) => {
            const identifier = `${ID}-${route}`;
            chunkArrays.set(identifier, [0, 1, 2, 3, 4, 5, 6, 7, 8]); // chunk 9 completes a group of 10
            await status(route, MEMBER, statusQuery(identifier)).expect(200);
            const res = await chunk(route, MEMBER, [['identifier', identifier], ['chunkNumber', '9'], ['nUPid', UPID], ['nMasterid', VICTIM]]);
            expect(res.status).toBe(201);
            const add = queues['sequence-file-merge'].add;
            await settle(() => add.mock.calls.length > 0);
            expect(add).toHaveBeenCalledWith(expect.objectContaining({ fileId: identifier, nMasterid: MEMBER }), expect.anything());
            expect(JSON.stringify(add.mock.calls)).not.toContain(VICTIM);
        });
    });

    describe('4. identifiers named like Object members are plain uploads', () => {
        it('"__proto__" does not replace the chunk map\'s prototype', async () => {
            await status('upload', MEMBER, statusQuery('__proto__')).expect(200);
            expect((await chunk('upload', MEMBER, [['identifier', '__proto__'], ['chunkNumber', '0'], ['nUPid', UPID]])).status).toBe(201);
            const map = (app.get(ChunksUploadService) as any).chunkSet;
            expect(Array.isArray(Object.getPrototypeOf(map))).toBe(false);
            expect(Object.prototype.hasOwnProperty.call(map, '__proto__')).toBe(true);
            expect(map['__proto__']).toEqual([0]);
        });

        it('"constructor": a chunk retried after its upload completed is still taken (it was a 500)', async () => {
            await status('upload', MEMBER, statusQuery('constructor')).expect(200);
            expect((await complete('upload', MEMBER, completeBody('constructor'))).status).toBe(201);
            const res = await chunk('upload', MEMBER, [['identifier', 'constructor'], ['chunkNumber', '1'], ['nUPid', UPID]]);
            expect(res.status).toBe(201);
            expect(res.body).toEqual({ m: 1, i: '1' });
        });

        it('identifiers "records:obj_<id>" + "obj_<id>" cannot swap another upload\'s merge path (its chunks stay in its own case file)', async () => {
            // Real Redis semantics for the chunk object and list (libs/global redis-db.service.ts
            // getChunkObject / setChunkObject / getChunkArray / setChunkArray): `file:<id>` and `file:records:<id>`.
            const fns = ['getChunkObject', 'setChunkObject', 'getChunkArray', 'setChunkArray'] as const;
            const saved = fns.map((f) => rds[f].getMockImplementation());
            rds.getChunkObject.mockImplementation((async (identifier: string, chunkObj: any, groupSize: number) => {
                if (chunkObj) return chunkObj;
                const raw = redisValues.get(`file:${identifier}`);
                return raw ? JSON.parse(raw) : { maxChunk: groupSize, path: '' };
            }) as any);
            rds.setChunkObject.mockImplementation((async (identifier: string, obj: any) => { redisValues.set(`file:${identifier}`, JSON.stringify(obj)); }) as any);
            rds.getChunkArray.mockImplementation((async (identifier: string) => {
                const raw = redisValues.get(`file:records:${identifier}`);
                return raw ? JSON.parse(raw) : [];
            }) as any);
            rds.setChunkArray.mockImplementation((async (identifier: string, arr: number[]) => { redisValues.set(`file:records:${identifier}`, JSON.stringify(arr || [])); }) as any);
            try {
                const victim = `${ID}-victim`;
                redisValues.set(`file:records:${victim}`, JSON.stringify([0, 1, 2, 3, 4, 5, 6, 7, 8])); // chunk 9 completes a group of 10
                await status('upload', MEMBER, statusQuery(victim)).expect(200);
                // A user of another case opens two uploads of their own named after it: 'records:obj_<id>' stores
                // its chunk object (with their path) at the key 'obj_<id>'s chunk list is read from, and opening
                // 'obj_<id>' then reads that object into the in-memory slot of the victim's chunk object.
                const theirs = { nUPid: O_UPID, nCaseid: OTHER_CASE, cPath: `doc/case${OTHER_CASE}/file_9.PDF` };
                await status('upload', OUTSIDER, statusQuery(`records:obj_${victim}`, theirs)).expect(200);
                await status('upload', OUTSIDER, statusQuery(`obj_${victim}`, theirs)).expect(200);
                expect((await chunk('upload', MEMBER, [['identifier', victim], ['chunkNumber', '9'], ['nUPid', UPID]])).status).toBe(201);
                const add = queues['sequence-file-merge'].add;
                await settle(() => add.mock.calls.length > 0);
                expect(add).toHaveBeenCalledWith(expect.objectContaining({ fileId: victim, path: `doc/case${CASE}/file_1.PDF` }), expect.anything());
                expect(JSON.stringify(add.mock.calls)).not.toContain(`case${OTHER_CASE}`);
            } finally {
                fns.forEach((f, i) => rds[f].mockImplementation(saved[i] as any));
            }
        });
    });
});
