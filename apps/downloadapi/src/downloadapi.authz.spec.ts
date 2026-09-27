import { INestApplication, Logger, MiddlewareConsumer, Module, NestModule, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import * as cookieParser from 'cookie-parser';
import * as jwt from 'jsonwebtoken';
import * as request from 'supertest';
import { DbService } from '@app/global/db/pg/db.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { CASE_ACCESS_SQL } from 'apps/download/src/auth/download-access';
import { JOB_ACCESS_SQL } from './auth/job-access';
import { DownloadapiModule } from './downloadapi.module';
import { DownloadapiService } from './downloadapi.service';
import { S3FileService } from './services/s3-file.service';

// A real Nest HTTP app built from DownloadapiModule's own controller list and configure() (the
// JwtMiddleware wiring), with main.ts's global ValidationPipe. The database, Redis, config and the
// job services are stand-ins, so what is tested is who may start a package of a case, who may get
// a package's download URL, and who may start, stop, retry or delete a package by its id.

const SECRET = 'downloadapi-authz-secret';
const MEMBER = '11111111-1111-4111-8111-111111111111'; // team member of CASE_A
const ADMIN = '22222222-2222-4222-8222-222222222222'; // global admin, on no team
const CASE_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const CASE_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const SEC_A = 'a5a5a5a5-a5a5-4a5a-8a5a-a5a5a5a5a5a5';
const SEC_B = 'b5b5b5b5-b5b5-4b5b-8b5b-b5b5b5b5b5b5';
const JOB_A = 'c0c0a0a0-a0a0-4a0a-8a0a-a0a0a0a0a0a0'; // a package of CASE_A
const JOB_B = 'c0c0b0b0-b0b0-4b0b-8b0b-b0b0b0b0b0b0'; // a package of CASE_B

const BROWSERS: Record<string, { id: string; a: boolean }> = {
    [MEMBER]: { id: 'browser-member', a: false },
    [ADMIN]: { id: 'browser-admin', a: true },
};
const sections: Record<string, string> = { [SEC_A]: CASE_A, [SEC_B]: CASE_B };
const jobs: Record<string, string> = { [JOB_A]: CASE_A, [JOB_B]: CASE_B };
const isAdmin = (u: string) => u === ADMIN;
const member = (u: string, c: string) => u === MEMBER && c === CASE_A;
const row = (bAllowed: boolean) => ({ success: true, data: [{ bAllowed }] });

const rowQuery = jest.fn(async (sql: string, p: any[]) => {
    if (sql === CASE_ACCESS_SQL) {
        const [u, c, s] = p;
        return row([CASE_A, CASE_B].includes(c) && (s === null || sections[s] === c) && (isAdmin(u) || member(u, c)));
    }
    if (sql === JOB_ACCESS_SQL) {
        const [u, j] = p;
        return row(isAdmin(u) || (j in jobs && member(u, jobs[j])));
    }
    return { success: false, error: 'unexpected SQL' };
});
const db = { rowQuery, executeRef: jest.fn(async () => ({ success: true, data: [] })) };
const rds = {
    getValue: jest.fn(async (key: string) => JSON.stringify(BROWSERS[key.replace('user/', '')] ?? null)),
    deleteValue: jest.fn(),
};
const jobsService = {
    insertDownloadJob: jest.fn(async (body: any) => ({ msg: 1, nDPid: JOB_A, by: body.nMasterid })),
    getDownloadUrl: jest.fn(async () => ({ cUrl: 'https://spaces.example/package.zip?sig=x' })),
    startDownloadJob: jest.fn(async (body: any) => ({ msg: 1, value: 'started', by: body.nMasterid })),
    stopAndRemoveJob: jest.fn(async (body: any) => ({ msg: 1, by: body.nMasterid })),
    retryFailedJob: jest.fn(async (body: any) => ({ msg: 1, value: 'retried', by: body.nMasterid })),
    deleteJob: jest.fn(async (body: any) => ({ msg: 1, value: 'Deleted!', by: body.nMasterid })),
};
/** The job-id routes: path, the service method behind it, and the body field naming the package. */
const JOB_ROUTES = [
    ['/startjob', 'startDownloadJob', 'jobId'],
    ['/deletejob', 'stopAndRemoveJob', 'nDPid'],
    ['/retryjob', 'retryFailedJob', 'nDPid'],
    ['/delete', 'deleteJob', 'nDPid'],
] as const;
const jobCalls = () => JOB_ROUTES.reduce((n, [, fn]) => n + jobsService[fn].mock.calls.length, 0);
const s3Files = {
    isRewriteConfigured: jest.fn(() => false),
    insertDownloadJob: jest.fn(async (body: any) => ({ msg: 1, nDPid: JOB_A, by: body.nMasterid })),
};

@Module({
    controllers: Reflect.getMetadata('controllers', DownloadapiModule),
    providers: [
        { provide: DownloadapiService, useValue: jobsService },
        { provide: S3FileService, useValue: s3Files },
        { provide: DbService, useValue: db },
        { provide: RedisDbService, useValue: rds },
        { provide: ConfigService, useValue: { get: (k: string) => (k === 'JWT_SECRET' ? SECRET : undefined) } },
    ],
})
class HarnessModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        (DownloadapiModule.prototype as any).configure.call(this, consumer);
    }
}

const bearer = (userId: string) => ({ Authorization: `Bearer ${jwt.sign({ userId, broweserId: BROWSERS[userId].id }, SECRET)}` });
const pick = (nCaseid: string, nSectionid?: string) => ({
    nCaseid, ...(nSectionid === undefined ? {} : { nSectionid }), jFolders: '[]', jFiles: '[]', isHyperlink: false,
});

describe('downloadapi: packages and their URLs need a member of the case', () => {
    let app: INestApplication;
    const http = () => request(app.getHttpServer());
    const started = () => jobsService.insertDownloadJob.mock.calls.length + s3Files.insertDownloadJob.mock.calls.length;

    beforeAll(async () => {
        jest.spyOn(console, 'log').mockImplementation(() => undefined); // JwtMiddleware logs every request
        jest.spyOn(console, 'error').mockImplementation(() => undefined);
        const moduleRef = await Test.createTestingModule({ imports: [HarnessModule] }).compile();
        app = moduleRef.createNestApplication({ logger: false });
        app.use(cookieParser());
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
        await app.init();
    });

    afterAll(async () => {
        await app?.close();
        jest.restoreAllMocks();
    });

    beforeEach(() => jest.clearAllMocks());

    it("refuses to package another case, or a section of another case, even for a member of the case named", async () => {
        for (const route of ['/startdownload', '/startdownloadhyperlink']) {
            for (const body of [pick(CASE_B, SEC_B), pick(CASE_B), pick(CASE_A, SEC_B), pick(CASE_B, SEC_A)]) {
                const res = await http().post(route).set(bearer(MEMBER)).send(body);
                expect({ route, body, status: res.status }).toEqual({ route, body, status: 403 });
            }
        }
        expect(started()).toBe(0);
    });

    it('packages a member\'s own case (with its section, or none), and any case for a global admin', async () => {
        for (const route of ['/startdownload', '/startdownloadhyperlink']) {
            for (const [user, body] of [[MEMBER, pick(CASE_A, SEC_A)], [MEMBER, pick(CASE_A, '')], [MEMBER, pick(CASE_A)],
                [ADMIN, pick(CASE_B, SEC_B)]] as const) {
                const res = await http().post(route).set(bearer(user)).send(body);
                expect({ route, user, status: res.status }).toEqual({ route, user, status: 201 });
                expect(res.body.by).toBe(user); // the token user, not a body nMasterid
            }
        }
        expect(started()).toBe(8);
    });

    it("refuses a URL for another case's package, or an unknown one, and mints none", async () => {
        for (const nDPid of [JOB_B, 'deadbeef-dead-4bee-8eef-deadbeefdead', '']) {
            const res = await http().get('/get/url').query({ nDPid }).set(bearer(MEMBER));
            expect({ nDPid, status: res.status }).toEqual({ nDPid, status: 403 });
        }
        expect((await http().get('/get/url').query({ nDPid: 'not-a-uuid' }).set(bearer(MEMBER))).status).toBe(400); // DTO
        expect(jobsService.getDownloadUrl).not.toHaveBeenCalled();
    });

    it("gives a member the URL of their case's package, and a global admin any", async () => {
        expect((await http().get('/get/url').query({ nDPid: JOB_A }).set(bearer(MEMBER))).status).toBe(200);
        expect((await http().get('/get/url').query({ nDPid: JOB_B }).set(bearer(ADMIN))).status).toBe(200);
        expect(jobsService.getDownloadUrl).toHaveBeenCalledTimes(2);
    });

    it('answers 500 and mints nothing when the access lookup fails', async () => {
        rowQuery.mockResolvedValueOnce({ success: false, error: 'db down' } as any);
        expect((await http().get('/get/url').query({ nDPid: JOB_A }).set(bearer(MEMBER))).status).toBe(500);
        expect(jobsService.getDownloadUrl).not.toHaveBeenCalled();
    });

    it("refuses to start, stop, retry or delete another case's package, or an unknown one, and touches none", async () => {
        for (const [route, , field] of JOB_ROUTES) {
            for (const id of [JOB_B, 'deadbeef-dead-4bee-8eef-deadbeefdead', '']) {
                const res = await http().post(route).set(bearer(MEMBER)).send({ [field]: id });
                expect({ route, id, status: res.status }).toEqual({ route, id, status: 403 });
            }
            expect((await http().post(route).set(bearer(MEMBER)).send({ [field]: 'not-a-uuid' })).status).toBe(400); // DTO
        }
        expect(rowQuery).toHaveBeenCalledWith(JOB_ACCESS_SQL, [MEMBER, JOB_B]);
        expect(jobCalls()).toBe(0);
    });

    it("lets a member start, stop, retry and delete their case's package, and a global admin any, as the token user", async () => {
        for (const [route, fn, field] of JOB_ROUTES) {
            for (const [user, id] of [[MEMBER, JOB_A], [ADMIN, JOB_B]] as const) {
                const res = await http().post(route).set(bearer(user)).send({ [field]: id, nMasterid: MEMBER });
                expect({ route, user, status: res.status }).toEqual({ route, user, status: 201 });
                expect(res.body.by).toBe(user); // JwtMiddleware's user, not the body's nMasterid
                expect(rowQuery).toHaveBeenLastCalledWith(JOB_ACCESS_SQL, [user, id]);
            }
            expect(jobsService[fn]).toHaveBeenCalledTimes(2);
        }
    });

    it('answers 500 and touches no package when the access lookup of a job-id route fails', async () => {
        for (const [route, , field] of JOB_ROUTES) {
            rowQuery.mockResolvedValueOnce({ success: false, error: 'db down' } as any);
            expect((await http().post(route).set(bearer(MEMBER)).send({ [field]: JOB_A })).status).toBe(500);
        }
        expect(jobCalls()).toBe(0);
    });
});

describe('downloadapi delete: a package et_delete refused to delete keeps its Spaces folder', () => {
    const build = (answer: any) => {
        const db = { executeRef: jest.fn(async () => answer) };
        const deleteTarQueue = { add: jest.fn(async () => ({})) };
        const svc = new DownloadapiService(db as any, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any, deleteTarQueue as any);
        return { svc, db, deleteTarQueue };
    };
    const sp = (row: Record<string, any>) => ({ success: true, data: [[{ msg: 1, cUrl: null, value: 'Deleted!', ...row }]] });

    beforeAll(() => jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined));
    afterAll(() => jest.restoreAllMocks());

    it('does not clear the folder when et_delete answers isNeedToClear false (the caller does not hold the package)', async () => {
        const { svc, db, deleteTarQueue } = build(sp({ isNeedToClear: false }));
        await expect(svc.deleteJob({ nDPid: JOB_A, nMasterid: MEMBER } as any)).resolves.toEqual({ msg: -1, value: 'This package is not in your downloads' });
        expect(db.executeRef).toHaveBeenCalledWith('delete', { nDPid: JOB_A, nMasterid: MEMBER }, 'download');
        expect(deleteTarQueue.add).not.toHaveBeenCalled();
    });

    it('clears the folder when et_delete deleted the package, or answers as an older SP does (true / null)', async () => {
        for (const isNeedToClear of [true, null, undefined]) {
            const { svc, deleteTarQueue } = build(sp({ isNeedToClear }));
            await expect(svc.deleteJob({ nDPid: JOB_A, nMasterid: MEMBER } as any)).resolves.toEqual({ msg: 1, value: 'Deleted!' });
            expect(deleteTarQueue.add).toHaveBeenCalledWith({ isJobDelete: true, nDPid: JOB_A }, expect.objectContaining({ jobId: JOB_A }));
        }
    });
});
