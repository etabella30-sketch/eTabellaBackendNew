import { INestApplication, MiddlewareConsumer, Module, NestModule, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import * as cookieParser from 'cookie-parser';
import * as jwt from 'jsonwebtoken';
import * as request from 'supertest';
import { DbService } from '@app/global/db/pg/db.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { HttpErrorFilter } from '@app/global/middleware/exception';
import { CASE_ACCESS_SQL, FILES_IN_CASE_SQL } from 'apps/download/src/auth/download-access';
import { issueDownloadTicket } from 'apps/download/src/auth/download-ticket';
import { EXPORT_KEY_ACCESS_SQL, EXPORT_RERUN_ACCESS_SQL } from './auth/export-access';
import { ExportModule } from './export.module';
import { ExportService } from './export.service';
import { ExportFileService } from './services/export-file/export-file.service';
import { DataExportService } from './services/data-export/data-export.service';

// A real Nest HTTP app built from the export app's own controller list and its own
// ExportModule.configure() (the middleware wiring), with the global pipe, filter and cookie parser
// main.ts installs. Only Redis, the database, config and the services behind the controllers are
// stand-ins, so what is tested is: who gets in (tickets, bearer, cookie) and what they may read or
// run (the gates in the controllers).

const SECRET = 'export-auth-secret';
const MEMBER = '11111111-1111-4111-8111-111111111111'; // team member of CASE_A
const ADMIN = '22222222-2222-4222-8222-222222222222'; // global admin, on no team
const STRANGER = '33333333-3333-4333-8333-333333333333'; // team member of CASE_B only
const COLLEAGUE = '44444444-4444-4444-8444-444444444444'; // team member of CASE_A, not MEMBER
const CASE_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const CASE_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const DOC_A = 'd0c0a0a0-a0a0-4a0a-8a0a-a0a0a0a0a0a0'; // document of CASE_A
const DOC_B = 'd0c0b0b0-b0b0-4b0b-8b0b-b0b0b0b0b0b0'; // document of CASE_B

const BROWSERS: Record<string, { id: string; a: boolean }> = {
    [MEMBER]: { id: 'browser-member', a: false },
    [ADMIN]: { id: 'browser-admin', a: true },
    [STRANGER]: { id: 'browser-stranger', a: false },
    [COLLEAGUE]: { id: 'browser-colleague', a: false },
};

// Exports and the paths they recorded (ExportMaster.cExppath / ExportDetail.cPath), in the shapes
// dev holds: ed<uuid>, ed<int>, ex<int>, and the merged ex<uuid> the current code writes.
const EXP_A1 = 'e1e1e1e1-e1e1-4e1e-8e1e-e1e1e1e1e1e1';
const EXP_A2 = 'e2e2e2e2-e2e2-4e2e-8e2e-e2e2e2e2e2e2';
const EXP_B1 = 'eb1eb1eb-eb1e-4b1e-8b1e-b1eb1eb1eb1e';
const A_SINGLE = 'export/ed5c0de5c0-de5c-4de5-8de5-c0de5c0de5c0/modified.pdf';
const A_PAGED = 'export/ed6c0de6c0-de6c-4de6-8de6-c0de6c0de6c0/modified_1.pdf';
const A_MERGED = `export/ex${EXP_A2}/final.pdf`;
const A_LEGACY_ED = 'export/ed987/modified.pdf';
const A_LEGACY_EX = 'export/ex1234/final_1.pdf';
const B_SINGLE = 'export/ed7c0de7c0-de7c-4de7-8de7-c0de7c0de7c0/modified.pdf';
const exportsTable = [
    { id: EXP_A1, c: CASE_A, creator: MEMBER, paths: [A_SINGLE, A_PAGED, A_LEGACY_ED, A_LEGACY_EX] },
    { id: EXP_A2, c: CASE_A, creator: COLLEAGUE, paths: [A_MERGED] },
    { id: EXP_B1, c: CASE_B, creator: STRANGER, paths: [B_SINGLE] },
];
// Case-data exports (OutputDataExport). DX_LEFT: MEMBER made it on CASE_B, a case MEMBER has since
// been taken off (MEMBER is not on CASE_B's team).
const DX_A = 'da0a0a0a-0a0a-4a0a-8a0a-0a0a0a0a0a0a';
const DX_LEFT = 'da1e1e1e-1e1e-4e1e-8e1e-1e1e1e1e1e1e';
const DX_ADMIN = 'daadadad-adad-4ada-8ada-dadadadadada';
const dataExportsTable = [
    { id: DX_A, c: CASE_A, creator: MEMBER },
    { id: DX_LEFT, c: CASE_B, creator: MEMBER },
    { id: DX_ADMIN, c: CASE_B, creator: ADMIN },
];
const team = [{ u: MEMBER, c: CASE_A }, { u: COLLEAGUE, c: CASE_A }, { u: STRANGER, c: CASE_B }];
const admins = new Set([ADMIN]);
const docCase: Record<string, string> = { [DOC_A]: CASE_A, [DOC_B]: CASE_B };
const member = (u: string, c: string) => team.some((t) => t.u === u && t.c === c);
const row = (bAllowed: boolean) => ({ success: true, data: [{ bAllowed }] });

const lookups = async (sql: string, p: any[]) => {
    if (sql === EXPORT_KEY_ACCESS_SQL) {
        const [u, key] = p;
        return row(exportsTable.some((e) => e.paths.includes(key) && (admins.has(u) || member(u, e.c))));
    }
    if (sql === EXPORT_RERUN_ACCESS_SQL) {
        const [u, id] = p;
        return row(exportsTable.some((e) => e.id === id && e.creator === u && (admins.has(u) || member(u, e.c))));
    }
    if (sql === CASE_ACCESS_SQL) {
        const [u, c, s] = p;
        return row([CASE_A, CASE_B].includes(c) && s === null && (admins.has(u) || member(u, c)));
    }
    if (sql === FILES_IN_CASE_SQL) {
        const [c, ids] = p;
        return row(!ids.some((id: string) => id in docCase && docCase[id] !== c));
    }
    if (sql.includes('"OutputDataExport"')) {
        const [u, id] = p;
        return row(dataExportsTable.some((e) => e.id === id && e.creator === u && (admins.has(u) || member(u, e.c))));
    }
    return { success: false, error: 'unexpected SQL' };
};
const rowQuery = jest.fn(lookups);
const db = { rowQuery, executeRef: jest.fn(async () => ({ success: true, data: [] })) };
const boundBrowser = async (key: string) => JSON.stringify(BROWSERS[key.replace('user/', '')] ?? null);
const rds = {
    getValue: jest.fn(boundBrowser),
    deleteValue: jest.fn(),
};
const exportService = {
    downloadFile: jest.fn(async (query: any, res: any) => { res.status(200).json({ streamed: { ...query } }); }),
};
const exportFileService = {
    exportWithannot: jest.fn(async () => ({ nExportid: 'new-export' })),
    startExportProcess: jest.fn(async (q: any) => ({ started: { ...q } })),
};
const dataExportService = {
    createExport: jest.fn(async (body: any) => ({ msg: 1, nExportid: 'data-export', nMasterid: body.nMasterid })),
    regenerate: jest.fn(async (body: any) => ({ msg: 1, nExportid: body.nExportid })),
};

@Module({
    controllers: Reflect.getMetadata('controllers', ExportModule),
    providers: [
        { provide: ExportService, useValue: exportService },
        { provide: ExportFileService, useValue: exportFileService },
        { provide: DataExportService, useValue: dataExportService },
        { provide: DbService, useValue: db },
        { provide: RedisDbService, useValue: rds },
        { provide: ConfigService, useValue: { get: (k: string) => (k === 'JWT_SECRET' ? SECRET : undefined) } },
    ],
})
class HarnessModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        (ExportModule.prototype as any).configure?.call(this, consumer);
    }
}

const session = (userId: string, secret = SECRET) => jwt.sign({ userId, broweserId: BROWSERS[userId].id }, secret);
const bearer = (userId: string) => ({ Authorization: `Bearer ${session(userId)}` });
const fileUrl = (cPath: string, extra = '') => `/download?cPath=${encodeURIComponent(cPath)}&cFilename=Exhibit%201.pdf&v=1695000000000${extra}`;

/** A valid export-file/exportwithannot body (ExportFilewithAnnot). */
const annotBody = (nCaseid: string | undefined, jFiles: string[]) => ({
    cPdftype: 'S', bPagination: false, bDoc: true, bFact: true, bQfact: true, bCoverpg: true, bFitpg: true,
    cDsize: 'S', cFsize: 'S', cQFsize: 'S', cOrientation: 'A', cPgsize: 'A4', cTranscript: 'N',
    jFContact: [], jFIssue: [], jQFContact: [], jQFIssue: [], jPages: [], jFiles, nCaseid,
});

describe('export app: sign-in and gates', () => {
    let app: INestApplication;
    let logSpy: jest.SpyInstance;
    const http = () => request(app.getHttpServer());

    const ticketFor = async (userId: string): Promise<string> => {
        const res = await http().get('/download/ticket').set(bearer(userId));
        expect(res.status).toBe(200);
        return res.body.ticket;
    };

    beforeAll(async () => {
        logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined); // JwtMiddleware and the controller log
        jest.spyOn(console, 'error').mockImplementation(() => undefined);
        const moduleRef = await Test.createTestingModule({ imports: [HarnessModule] }).compile();
        app = moduleRef.createNestApplication({ logger: false });
        app.use(cookieParser());
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
        app.useGlobalFilters(new HttpErrorFilter());
        await app.init();
    });

    afterAll(async () => {
        await app?.close();
        jest.restoreAllMocks();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        // Drop a one-off answer a test queued but no gate consumed, so it cannot leak into the next test.
        rowQuery.mockReset().mockImplementation(lookups);
        rds.getValue.mockReset().mockImplementation(boundBrowser);
    });

    describe('GET /download needs a signed-in caller', () => {
        it('refuses a request with no credential, whatever nMasterid the query names', async () => {
            // nginx sends /export/download?... as /download?...; Express also ignores case and a trailing slash.
            const url = fileUrl(A_SINGLE, `&nMasterid=${MEMBER}`);
            for (const u of [url, url.replace('/download?', '/download/?'), url.replace('/download?', '/DOWNLOAD?')]) {
                const res = await http().get(u);
                expect({ u, status: res.status }).toEqual({ u, status: 403 });
            }
            expect(exportService.downloadFile).not.toHaveBeenCalled();
        });

        it('serves the bearer-token user, not the nMasterid in the query', async () => {
            const res = await http().get(fileUrl(A_SINGLE, `&nMasterid=${STRANGER}`)).set(bearer(MEMBER));
            expect(res.status).toBe(200);
            expect(res.body.streamed).toEqual({ cPath: A_SINGLE, cFilename: 'Exhibit 1.pdf', v: '1695000000000', nMasterid: MEMBER });
        });

        it('accepts the httpOnly access_token cookie (same-host <a href> / window.open downloads)', async () => {
            const res = await http().get(fileUrl(A_SINGLE)).set('Cookie', `access_token=${session(MEMBER)}`);
            expect(res.status).toBe(200);
            expect(exportService.downloadFile).toHaveBeenCalledTimes(1);
        });

        it('refuses a token signed with another key, and one whose browser is no longer bound', async () => {
            expect((await http().get(fileUrl(A_SINGLE)).set({ Authorization: `Bearer ${session(MEMBER, 'not-the-secret')}` })).status).toBe(401);
            const stale = jwt.sign({ userId: MEMBER, broweserId: 'old-browser' }, SECRET);
            expect((await http().get(fileUrl(A_SINGLE)).set({ Authorization: `Bearer ${stale}` })).status).toBe(401);
            expect(exportService.downloadFile).not.toHaveBeenCalled();
        });
    });

    describe('download tickets (?dlt=)', () => {
        it('GET /download/ticket issues a short-lived, uncached ticket to a bearer session only', async () => {
            const res = await http().get('/download/ticket').set(bearer(MEMBER));
            expect(res.status).toBe(200);
            expect(res.headers['cache-control']).toBe('no-store');
            expect(res.body).toEqual({ msg: 1, param: 'dlt', ticket: expect.any(String), expiresIn: 60 });
            expect((await http().get('/download/ticket')).status).toBe(403);
            expect((await http().get('/download/ticket').set('Cookie', `access_token=${session(MEMBER)}`)).status).toBe(401);
            expect((await http().get(`/download/ticket?dlt=${res.body.ticket}`)).status).toBe(403);
        });

        it('lets a ticket stand in for the header, as the ticket user, and keeps it out of the handler and the log', async () => {
            const ticket = await ticketFor(MEMBER);
            logSpy.mockClear();
            const res = await http().get(fileUrl(A_SINGLE, `&nMasterid=${STRANGER}&dlt=${ticket}`));
            expect(res.status).toBe(200);
            expect(res.body.streamed).toEqual({ cPath: A_SINGLE, cFilename: 'Exhibit 1.pdf', v: '1695000000000', nMasterid: MEMBER });
            expect(JSON.stringify(logSpy.mock.calls)).not.toContain(ticket);
        });

        it("accepts a ticket the download app issued (same key), since the frontend may ask either app", async () => {
            const ticket = issueDownloadTicket(SECRET, { userId: MEMBER, broweserId: BROWSERS[MEMBER].id });
            expect((await http().get(fileUrl(A_SINGLE, `&dlt=${ticket}`))).status).toBe(200);
        });

        it('refuses a bad ticket, a session token passed as one, and a ticket whose session was replaced', async () => {
            const ticket = await ticketFor(MEMBER);
            for (const bad of [session(MEMBER), 'not-a-ticket', `${ticket}x`]) {
                expect((await http().get(fileUrl(A_SINGLE, `&dlt=${encodeURIComponent(bad)}`))).status).toBe(401);
            }
            rds.getValue.mockResolvedValueOnce(JSON.stringify({ id: 'another-browser', a: false }));
            expect((await http().get(fileUrl(A_SINGLE, `&dlt=${ticket}`))).status).toBe(401);
            expect(exportService.downloadFile).not.toHaveBeenCalled();
        });
    });

    describe('GET /download only serves exports of a case the caller may read', () => {
        it('serves a member every export file of their case, whoever made it, in each recorded shape', async () => {
            for (const cPath of [A_SINGLE, A_PAGED, A_MERGED, A_LEGACY_ED, A_LEGACY_EX]) {
                const res = await http().get(fileUrl(cPath)).set(bearer(MEMBER));
                expect({ cPath, status: res.status }).toEqual({ cPath, status: 200 });
                expect(res.body.streamed.cPath).toBe(cPath);
            }
        });

        it("refuses another case's export, and a path no export recorded", async () => {
            const unrecorded = ['export/ed5c0de5c0-de5c-4de5-8de5-c0de5c0de5c0/indx.pdf', 'export/ed988/modified.pdf'];
            for (const cPath of [B_SINGLE, ...unrecorded]) {
                const res = await http().get(fileUrl(cPath)).set(bearer(MEMBER));
                expect({ cPath, status: res.status }).toEqual({ cPath, status: 403 });
            }
            for (const cPath of unrecorded) expect((await http().get(fileUrl(cPath)).set(bearer(ADMIN))).status).toBe(403);
            expect(exportService.downloadFile).not.toHaveBeenCalled();
        });

        it('refuses anything outside export/e[dx]<id>/<file>, to members and admins, before any lookup', async () => {
            const keys = [
                '../.env.production', '../../etc/passwd', '/etc/passwd', 'export/../.env.production',
                `export/ed5c0de5c0-de5c-4de5-8de5-c0de5c0de5c0/../../../.env.production`, 'export/ed987/..', 'export/ed987/.',
                'export/ed987\\modified.pdf', 'export/ed987/sub/modified.pdf', 'export/ed987/modified.pdf\u0000.txt',
                'export/ed987/a\r\nb.pdf', '/export/ed987/modified.pdf', 'export//ed987/modified.pdf', 'export/ed0987/modified.pdf',
                'export/ed-1/modified.pdf', 'export/xx987/modified.pdf', 'EXPORT/ed987/modified.pdf', 'doc/case1131/dc_1.pdf',
                'fonts/Roboto/Roboto-Regular.ttf', 'pythons/export/exportfile.py', '',
            ];
            for (const user of [MEMBER, ADMIN]) {
                for (const cPath of keys) {
                    const res = await http().get(fileUrl(cPath)).set(bearer(user));
                    expect({ user, cPath, status: res.status }).toEqual({ user, cPath, status: 403 });
                }
            }
            expect(exportService.downloadFile).not.toHaveBeenCalled();
            expect(rowQuery).not.toHaveBeenCalled();
        });

        it('serves a global admin any recorded export', async () => {
            for (const cPath of [A_SINGLE, B_SINGLE]) expect((await http().get(fileUrl(cPath)).set(bearer(ADMIN))).status).toBe(200);
        });

        it('answers 500 and opens nothing when the access lookup fails', async () => {
            rowQuery.mockResolvedValueOnce({ success: false, error: 'db down' } as any);
            expect((await http().get(fileUrl(A_SINGLE)).set(bearer(MEMBER))).status).toBe(500);
            expect(exportService.downloadFile).not.toHaveBeenCalled();
        });
    });

    describe('export-file: an export is made of the caller\'s case, and only its creator re-runs it', () => {
        it('exportwithannot: a member exports documents of their own case', async () => {
            for (const jFiles of [[DOC_A], []]) {
                const res = await http().post('/export-file/exportwithannot').set(bearer(MEMBER)).send(annotBody(CASE_A, jFiles));
                expect({ jFiles, status: res.status }).toEqual({ jFiles, status: 201 });
            }
            expect(exportFileService.exportWithannot).toHaveBeenCalledWith(expect.objectContaining({ nCaseid: CASE_A, nMasterid: MEMBER }));
        });

        it("exportwithannot: refuses another case, another case's document under the caller's case, and no case", async () => {
            for (const [nCaseid, jFiles] of [[CASE_B, [DOC_B]], [CASE_A, [DOC_B]], [CASE_A, [DOC_A, DOC_B]], [undefined, [DOC_A]]] as const) {
                const res = await http().post('/export-file/exportwithannot').set(bearer(MEMBER)).send(annotBody(nCaseid, [...jFiles]));
                expect({ nCaseid, jFiles, status: res.status }).toEqual({ nCaseid, jFiles, status: 403 });
            }
            // An admin may export any case, but still only that case's documents.
            expect((await http().post('/export-file/exportwithannot').set(bearer(ADMIN)).send(annotBody(CASE_B, [DOC_B]))).status).toBe(201);
            expect((await http().post('/export-file/exportwithannot').set(bearer(ADMIN)).send(annotBody(CASE_B, [DOC_A]))).status).toBe(403);
            expect(exportFileService.exportWithannot).toHaveBeenCalledTimes(1);
        });

        it("exportwithannot: refuses another case's document spelled the way ::uuid still reads it, instead of skipping it", async () => {
            // et_export_insert_data_1 casts each jFiles entry with ::uuid, which also takes braces, upper
            // case and missing hyphens; the download app's reading (canonical ids only) skipped those, so
            // the document went into the export unchecked.
            const spellings = [`{${DOC_B}}`, DOC_B.replace(/-/g, ''), `{${DOC_B.toUpperCase().replace(/-/g, '')}}`, 'not-a-uuid', ''];
            for (const odd of spellings) {
                const res = await http().post('/export-file/exportwithannot').set(bearer(MEMBER)).send(annotBody(CASE_A, [DOC_A, odd]));
                expect({ odd, status: res.status }).toEqual({ odd, status: 403 });
            }
            expect(exportFileService.exportWithannot).not.toHaveBeenCalled();
            // The canonical id in upper case is the same document to both readings, so it is checked, not refused.
            expect((await http().post('/export-file/exportwithannot').set(bearer(MEMBER)).send(annotBody(CASE_A, [DOC_A.toUpperCase()]))).status).toBe(201);
            expect((await http().post('/export-file/exportwithannot').set(bearer(MEMBER)).send(annotBody(CASE_A, [DOC_B.toUpperCase()]))).status).toBe(403);
        });

        it('retryexport: the creator re-runs their export; a colleague, a stranger and an admin cannot', async () => {
            expect((await http().post('/export-file/retryexport').set(bearer(MEMBER)).send({ nExportid: EXP_A1 })).status).toBe(201);
            expect(exportFileService.startExportProcess).toHaveBeenCalledWith(expect.objectContaining({ nExportid: EXP_A1, nMasterid: MEMBER }));
            exportFileService.startExportProcess.mockClear();
            for (const user of [COLLEAGUE, STRANGER, ADMIN]) {
                const res = await http().post('/export-file/retryexport').set(bearer(user)).send({ nExportid: EXP_A1 });
                expect({ user, status: res.status }).toEqual({ user, status: 403 });
            }
            expect((await http().post('/export-file/retryexport').set(bearer(MEMBER)).send({ nExportid: EXP_A2 })).status).toBe(403);
            expect(exportFileService.startExportProcess).not.toHaveBeenCalled();
        });

        it('retryexport: the legacy form-encoded body (HttpParams) still works for the creator', async () => {
            const res = await http().post('/export-file/retryexport').set(bearer(MEMBER)).type('form').send(`nExportid=${EXP_A1}`);
            expect(res.status).toBe(201);
            expect(res.body).toEqual({ msg: 1, value: 'Export in Process', nExportid: EXP_A1 });
        });

        it('startexportfile: refuses an id that names no export of the caller (its DTO turns ids into numbers)', async () => {
            for (const id of ['5', '12345678-1234-4234-8234-123456789012']) {
                const res = await http().get(`/export-file/startexportfile?nExportid=${id}`).set(bearer(MEMBER));
                expect({ id, status: res.status }).toEqual({ id, status: 403 });
            }
            expect(exportFileService.startExportProcess).not.toHaveBeenCalled();
        });
    });

    describe('data/export: only a member (or an admin) exports a case', () => {
        const body = (nCaseid: string) => ({ nCaseid, cType: 'doclinks', cFormat: 'xlsx' });

        it('serves a member their case and an admin any case', async () => {
            expect((await http().post('/data/export').set(bearer(MEMBER)).send(body(CASE_A))).status).toBe(201);
            expect((await http().post('/data/export').set(bearer(ADMIN)).send(body(CASE_B))).status).toBe(201);
            expect(dataExportService.createExport).toHaveBeenCalledWith(expect.objectContaining({ nCaseid: CASE_A, nMasterid: MEMBER }));
        });

        it('refuses another case', async () => {
            expect((await http().post('/data/export').set(bearer(STRANGER)).send(body(CASE_A))).status).toBe(403);
            expect(dataExportService.createExport).not.toHaveBeenCalled();
        });

        it('data/regenerate: the creator re-runs it while still a member (or an admin); not once off the case', async () => {
            // The re-run reads the case's data afresh; et_output_data_export_get only checks the creator.
            expect((await http().post('/data/regenerate').set(bearer(MEMBER)).send({ nExportid: DX_A })).status).toBe(201);
            expect((await http().post('/data/regenerate').set(bearer(ADMIN)).send({ nExportid: DX_ADMIN })).status).toBe(201);
            expect(dataExportService.regenerate).toHaveBeenCalledWith(expect.objectContaining({ nExportid: DX_A, nMasterid: MEMBER }));
            dataExportService.regenerate.mockClear();
            for (const [user, nExportid] of [[MEMBER, DX_LEFT], [COLLEAGUE, DX_A], [STRANGER, DX_A], [ADMIN, DX_A]]) {
                const res = await http().post('/data/regenerate').set(bearer(user)).send({ nExportid });
                expect({ user, nExportid, status: res.status }).toEqual({ user, nExportid, status: 403 });
            }
            expect(dataExportService.regenerate).not.toHaveBeenCalled();
        });
    });
});
