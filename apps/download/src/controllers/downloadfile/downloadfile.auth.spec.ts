import { INestApplication, MiddlewareConsumer, Module, NestModule, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import * as cookieParser from 'cookie-parser';
import * as jwt from 'jsonwebtoken';
import * as request from 'supertest';
import { DbService } from '@app/global/db/pg/db.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { HttpErrorFilter } from '@app/global/middleware/exception';
import { EventLogService } from '@app/global/utility/event-log/event-log.service';
import { CASE_ACCESS_SQL, FILES_IN_CASE_SQL, KEY_CASE_ACCESS_SQL, KEY_DOCUMENT_ACCESS_SQL } from '../../auth/download-access';
import { issueDownloadTicket } from '../../auth/download-ticket';
import { DownloadModule } from '../../download.module';
import { DownloadService } from '../../download.service';
import { DownloadfileService } from '../../services/downloadfile/downloadfile.service';
import { PresentReportService } from '../../services/present-report/present-report.service';

// A real Nest HTTP app built from the download app's own controller list and its own
// DownloadModule.configure() (the middleware wiring), with the global pipe and filter main.ts
// installs. Only Redis, the database, config and the file-streaming services are stand-ins, so what
// is tested is: who gets in (DownloadAuthMiddleware, tickets) and what they may read (the gates in
// DownloadfileController).

const SECRET = 'download-auth-secret';
const MEMBER = '11111111-1111-4111-8111-111111111111'; // team member of CASE_A
const ADMIN = '22222222-2222-4222-8222-222222222222'; // global admin, on no team
const STRANGER = '33333333-3333-4333-8333-333333333333'; // team member of CASE_B only
const CASE_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const CASE_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const SEC_A = 'a5a5a5a5-a5a5-4a5a-8a5a-a5a5a5a5a5a5';
const SEC_B = 'b5b5b5b5-b5b5-4b5b-8b5b-b5b5b5b5b5b5';

const BROWSERS: Record<string, { id: string; a: boolean }> = {
    [MEMBER]: { id: 'browser-member', a: false },
    [ADMIN]: { id: 'browser-admin', a: true },
    [STRANGER]: { id: 'browser-stranger', a: false },
};

// Stand-in for the three access queries, with their meaning: admins, TeamRelation rows, cases
// (uuid + legacy ZnCaseid), sections, and one document whose file sits under a folder named after
// a case that does not exist (dev has 10 such documents in case 1131, under doc/case1154/).
const cases = [{ id: CASE_A, zn: 1131 }, { id: CASE_B, zn: 1085 }];
const sections = [{ id: SEC_A, c: CASE_A }, { id: SEC_B, c: CASE_B }];
const team = [{ u: MEMBER, c: CASE_A }, { u: STRANGER, c: CASE_B }];
const admins = new Set([ADMIN]);
const documents = [{ cPath: 'doc/case1154/dc_77.pdf', section: SEC_A }];
// Documents by id, for the jFiles check (FILES_IN_CASE_SQL).
const DOC_A = 'd0c0a0a0-a0a0-4a0a-8a0a-a0a0a0a0a0a0'; // in SEC_A (CASE_A)
const DOC_B = 'd0c0b0b0-b0b0-4b0b-8b0b-b0b0b0b0b0b0'; // in SEC_B (CASE_B)
const docCase: Record<string, string> = { [DOC_A]: CASE_A, [DOC_B]: CASE_B };
const member = (u: string, c: string) => team.some((t) => t.u === u && t.c === c);
const row = (bAllowed: boolean) => ({ success: true, data: [{ bAllowed }] });

const rowQuery = jest.fn(async (sql: string, p: any[]) => {
    if (sql === KEY_CASE_ACCESS_SQL) {
        const [u, c, zn] = p;
        return row(admins.has(u) || cases.some((k) => (k.id === c || k.zn === zn) && member(u, k.id)));
    }
    if (sql === KEY_DOCUMENT_ACCESS_SQL) {
        const [u, key] = p;
        return row(documents.some((d) => d.cPath === key && member(u, sections.find((s) => s.id === d.section)?.c)));
    }
    if (sql === CASE_ACCESS_SQL) {
        const [u, c, s] = p;
        return row(cases.some((k) => k.id === c)
            && (s === null || sections.some((x) => x.id === s && x.c === c))
            && (admins.has(u) || member(u, c)));
    }
    if (sql === FILES_IN_CASE_SQL) {
        const [c, ids] = p;
        return row(!ids.some((id: string) => id in docCase && docCase[id] !== c));
    }
    return { success: false, error: 'unexpected SQL' };
});
const db = { rowQuery, executeRef: jest.fn(async () => ({ success: true, data: [] })) };
const rds = {
    getValue: jest.fn(async (key: string) => JSON.stringify(BROWSERS[key.replace('user/', '')] ?? null)),
    deleteValue: jest.fn(),
};
const files = {
    downloadSingleFileFromS3: jest.fn(async (detail: any, res: any) => { res.status(200).json({ streamed: detail }); }),
    downloadfiles: jest.fn(async (query: any, res: any) => { res.status(200).json({ zip: { ...query } }); }),
    downloadfilesWithHyperLink: jest.fn(async (query: any, res: any) => { res.status(200).json({ zip: { ...query } }); }),
    getApproximateSize: jest.fn(async (query: any) => ({ msg: 1, isValidForStream: true, nMasterid: query.nMasterid })),
};
const reports = { downloadPresentfiles: jest.fn(async (query: any, res: any) => { res.status(200).json({ report: { ...query } }); }) };
const eventLog = { insertLog: jest.fn(async () => undefined) };

@Module({
    controllers: Reflect.getMetadata('controllers', DownloadModule),
    providers: [
        { provide: DownloadService, useValue: {} },
        { provide: DownloadfileService, useValue: files },
        { provide: PresentReportService, useValue: reports },
        { provide: EventLogService, useValue: eventLog },
        { provide: DbService, useValue: db },
        { provide: RedisDbService, useValue: rds },
        { provide: ConfigService, useValue: { get: (k: string) => (k === 'JWT_SECRET' ? SECRET : undefined) } },
    ],
})
class HarnessModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        (DownloadModule.prototype as any).configure?.call(this, consumer);
    }
}

const session = (userId: string, secret = SECRET) => jwt.sign({ userId, broweserId: BROWSERS[userId].id }, secret);
const bearer = (userId: string) => ({ Authorization: `Bearer ${session(userId)}` });
const docUrl = (cPath: string, extra = '') => `/download?cPath=${encodeURIComponent(cPath)}&cFilename=Exhibit%201${extra}`;
const selection = (nCaseid: string, nSectionid: string) =>
    `nCaseid=${nCaseid}&nSectionid=${nSectionid}&jFiles=%5B%5D&jFolders=%5B%5D`;
const presentParams = (obj: unknown) => encodeURIComponent(btoa(JSON.stringify(obj)));

/** Every file route, asked about CASE_A as MEMBER would ask. */
const FILE_ROUTES = [
    docUrl(`doc/case${CASE_A}/dc_1.pdf`),
    `/download/downloadfile?${selection(CASE_A, SEC_A)}`,
    `/download/hyperlink/downloadfile?${selection(CASE_A, SEC_A)}`,
    `/download/approximate/size?${selection(CASE_A, SEC_A)}`,
    `/download/downloadPresentReport?params=${presentParams({ nCaseid: CASE_A })}`,
];

const served = () =>
    files.downloadSingleFileFromS3.mock.calls.length + files.downloadfiles.mock.calls.length
    + files.downloadfilesWithHyperLink.mock.calls.length + files.getApproximateSize.mock.calls.length
    + reports.downloadPresentfiles.mock.calls.length;

describe('download app: sign-in, tickets and read gates', () => {
    let app: INestApplication;
    let logSpy: jest.SpyInstance;
    const http = () => request(app.getHttpServer());

    const ticketFor = async (userId: string): Promise<string> => {
        const res = await http().get('/download/ticket').set(bearer(userId));
        expect(res.status).toBe(200);
        return res.body.ticket;
    };

    beforeAll(async () => {
        logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined); // JwtMiddleware logs every request
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
    });

    describe('sign-in', () => {
        it('refuses every file route without a credential, whatever nMasterid the query names', async () => {
            // nginx sends /download/download/?cPath= as /download/?cPath=; Express also ignores case.
            const spellings = [docUrl(`doc/case${CASE_A}/dc_1.pdf`).replace('/download?', '/download/?'),
                docUrl(`doc/case${CASE_A}/dc_1.pdf`).replace('/download?', '/DOWNLOAD?'),
                `/Download/DownloadFile/?${selection(CASE_A, SEC_A)}`];
            for (const url of [...FILE_ROUTES, ...spellings]) {
                const res = await http().get(`${url}&nMasterid=${MEMBER}`);
                expect({ url, status: res.status }).toEqual({ url, status: 403 });
            }
            expect(served()).toBe(0);
        });

        it('runs as the bearer-token user, not the nMasterid in the query', async () => {
            const res = await http().get(`/download/approximate/size?${selection(CASE_A, SEC_A)}&nMasterid=${STRANGER}`).set(bearer(MEMBER));
            expect(res.status).toBe(200);
            expect(res.body.nMasterid).toBe(MEMBER);
        });

        it('accepts the httpOnly access_token cookie (same-host <a href> downloads)', async () => {
            const res = await http().get(docUrl(`doc/case${CASE_A}/dc_1.pdf`)).set('Cookie', `access_token=${session(MEMBER)}`);
            expect(res.status).toBe(200);
            expect(files.downloadSingleFileFromS3).toHaveBeenCalledTimes(1);
        });

        it('refuses a token signed with another key, and one whose browser is no longer bound', async () => {
            const forged = { Authorization: `Bearer ${session(MEMBER, 'not-the-secret')}` };
            expect((await http().get(docUrl(`doc/case${CASE_A}/dc_1.pdf`)).set(forged)).status).toBe(401);
            const stale = { Authorization: `Bearer ${jwt.sign({ userId: MEMBER, broweserId: 'old-browser' }, SECRET)}` };
            expect((await http().get(docUrl(`doc/case${CASE_A}/dc_1.pdf`)).set(stale)).status).toBe(401);
            expect(served()).toBe(0);
        });
    });

    describe('download tickets (?dlt=)', () => {
        it('issues a short-lived, uncached ticket to a bearer session', async () => {
            const res = await http().get('/download/ticket').set(bearer(MEMBER));
            expect(res.status).toBe(200);
            expect(res.headers['cache-control']).toBe('no-store');
            expect(res.body).toEqual({ msg: 1, param: 'dlt', ticket: expect.any(String), expiresIn: 60 });
            const payload: any = jwt.decode(res.body.ticket);
            expect(payload.exp - payload.iat).toBe(60);
            expect(payload.userId).toBe(MEMBER);
        });

        it('lets a ticket stand in for the header on every file route, as the ticket user', async () => {
            const ticket = await ticketFor(MEMBER);
            for (const url of FILE_ROUTES) {
                const res = await http().get(`${url}&nMasterid=${STRANGER}&dlt=${ticket}`);
                expect({ url, status: res.status }).toEqual({ url, status: 200 });
            }
            expect(files.getApproximateSize).toHaveBeenCalledWith(expect.objectContaining({ nMasterid: MEMBER }));
            expect(files.downloadfiles).toHaveBeenCalledWith(expect.objectContaining({ nMasterid: MEMBER }), expect.anything());
            expect(reports.downloadPresentfiles).toHaveBeenCalledWith(expect.objectContaining({ nMasterid: MEMBER }), expect.anything());
            expect(files.downloadSingleFileFromS3).toHaveBeenCalledWith({ cPath: `doc/case${CASE_A}/dc_1.pdf`, cFilename: 'Exhibit 1' }, expect.anything());
        });

        it('keeps the ticket out of the handler, the event log and the request log', async () => {
            const ticket = await ticketFor(MEMBER);
            logSpy.mockClear();
            // With a header the header wins, and JwtMiddleware logs the URL: the ticket must not be in it.
            const url = `/download/downloadfile?${selection(CASE_A, SEC_A)}&dlt=${ticket}`;
            expect((await http().get(url).set(bearer(MEMBER))).status).toBe(200);
            expect((await http().get(url)).status).toBe(200);
            for (const [query] of files.downloadfiles.mock.calls) expect(query).not.toHaveProperty('dlt');
            expect(JSON.stringify(eventLog.insertLog.mock.calls)).not.toContain(ticket);
            expect(logSpy.mock.calls.length).toBeGreaterThan(0);
            expect(JSON.stringify(logSpy.mock.calls)).not.toContain(ticket);
        });

        it('never turns a ticket or a cookie alone into another ticket', async () => {
            const ticket = await ticketFor(MEMBER);
            expect((await http().get(`/download/ticket?dlt=${ticket}`)).status).toBe(403);
            expect((await http().get('/download/ticket').set('Cookie', `access_token=${session(MEMBER)}`)).status).toBe(401);
            expect((await http().get('/download/ticket').set({ Authorization: `Bearer ${ticket}` })).status).toBe(401);
        });

        it('refuses expired, tampered and wrongly signed tickets, and a session token passed as one', async () => {
            const good = await ticketFor(MEMBER);
            const [h, p, s] = good.split('.');
            const payload = JSON.parse(Buffer.from(p, 'base64url').toString());
            const tampered = [h, Buffer.from(JSON.stringify({ ...payload, userId: ADMIN })).toString('base64url'), s].join('.');
            // A genuine ticket issued 61 seconds ago.
            const now = Date.now();
            const clock = jest.spyOn(Date, 'now').mockReturnValue(now - 61_000);
            const expired = issueDownloadTicket(SECRET, { userId: MEMBER, broweserId: BROWSERS[MEMBER].id });
            clock.mockRestore();
            // Right claims, but signed with JWT_SECRET itself (the session key) or another key.
            const claims = { userId: MEMBER, broweserId: BROWSERS[MEMBER].id, typ: 'download-ticket' };
            const sessionKeySigned = jwt.sign(claims, SECRET, { audience: 'etabella-download', expiresIn: 60 });
            const otherKeySigned = jwt.sign(claims, 'another-key', { audience: 'etabella-download', expiresIn: 60 });
            for (const bad of [tampered, expired, sessionKeySigned, otherKeySigned, session(MEMBER), 'not-a-ticket', '']) {
                const res = await http().get(docUrl(`doc/case${CASE_A}/dc_1.pdf`, `&dlt=${encodeURIComponent(bad)}`));
                expect(res.status).toBe(401);
            }
            expect(served()).toBe(0);
        });

        it('stops honouring a ticket once its session is signed out or replaced', async () => {
            const ticket = await ticketFor(MEMBER);
            rds.getValue.mockResolvedValueOnce(JSON.stringify({ id: 'another-browser', a: false }));
            const res = await http().get(docUrl(`doc/case${CASE_A}/dc_1.pdf`, `&dlt=${ticket}`));
            expect(res.status).toBe(401);
            expect(res.body.message).toBe('Old Token');
            rds.getValue.mockResolvedValueOnce(null as any);
            expect((await http().get(docUrl(`doc/case${CASE_A}/dc_1.pdf`, `&dlt=${ticket}`))).status).toBe(401);
            expect(served()).toBe(0);
        });

        it('is not a session token: the shared JwtMiddleware refuses it in the Authorization header', async () => {
            const ticket = await ticketFor(MEMBER);
            expect((await http().get(docUrl(`doc/case${CASE_A}/dc_1.pdf`)).set({ Authorization: `Bearer ${ticket}` })).status).toBe(401);
            expect(served()).toBe(0);
        });

        it('refuses odd ticket spellings instead of passing them on', async () => {
            const ticket = await ticketFor(MEMBER);
            for (const extra of [`&dlt[]=${ticket}`, `&dlt=${ticket}&dlt=${ticket}`, `&dlt[x]=${ticket}`]) {
                expect((await http().get(docUrl(`doc/case${CASE_A}/dc_1.pdf`, extra))).status).toBe(401);
            }
            expect(served()).toBe(0);
        });
    });

    describe('GET /download?cPath= only serves case documents the caller may read', () => {
        it('serves a member the documents of their case, under uuid and legacy integer folders', async () => {
            for (const cPath of [`doc/case${CASE_A}/dc_1.pdf`, `doc/case${CASE_A.toUpperCase()}/dc_2.xlsx`, 'doc/case1131/dc_3.pdf',
                'doc/case1131/dc_4. 2 - notes (draft), v1~2.pdf']) {
                const res = await http().get(docUrl(cPath)).set(bearer(MEMBER));
                expect({ cPath, status: res.status }).toEqual({ cPath, status: 200 });
                expect(res.body.streamed.cPath).toBe(cPath);
            }
        });

        it("refuses a member another case's documents, and streams nothing", async () => {
            for (const cPath of [`doc/case${CASE_B}/dc_1.pdf`, 'doc/case1085/dc_1.pdf', 'doc/case9999/dc_1.pdf']) {
                const res = await http().get(docUrl(cPath)).set(bearer(MEMBER));
                expect({ cPath, status: res.status }).toEqual({ cPath, status: 403 });
            }
            expect(files.downloadSingleFileFromS3).not.toHaveBeenCalled();
        });

        it('refuses any key outside doc/case<id>/<file>, even to an admin', async () => {
            const keys = [
                'profile/users/avatar.png', 'downloads/package.zip', 'backup/db.sql', `doc/case${CASE_A}`,
                `doc/case${CASE_A}/`, `doc/case${CASE_A}/sub/dc_1.pdf`, `doc/case${CASE_A}/..`, `doc/case${CASE_A}/.`,
                `doc/case${CASE_A}/../case${CASE_B}/dc_1.pdf`, `doc/case${CASE_A}\\dc_1.pdf`, `doc/case${CASE_A}/dc\\1.pdf`,
                `doc/case${CASE_A}/dc_1.pdf\u0000.txt`, `doc/case${CASE_A}/dc_1.pdf\r\nX: y`, `/doc/case${CASE_A}/dc_1.pdf`,
                `doc//case${CASE_A}/dc_1.pdf`, 'doc/case0/dc_1.pdf', 'doc/case01131/dc_1.pdf', 'doc/case-1/dc_1.pdf',
                'doc/caseabc/dc_1.pdf', 'doc/case1234567890/dc_1.pdf', `DOC/case${CASE_A}/dc_1.pdf`, '',
            ];
            for (const user of [MEMBER, ADMIN]) {
                for (const cPath of keys) {
                    const res = await http().get(docUrl(cPath)).set(bearer(user));
                    expect({ user, cPath, status: res.status }).toEqual({ user, cPath, status: 403 });
                }
            }
            expect(files.downloadSingleFileFromS3).not.toHaveBeenCalled();
        });

        it('serves a global admin any case document', async () => {
            for (const cPath of [`doc/case${CASE_B}/dc_1.pdf`, 'doc/case1085/dc_1.pdf']) {
                expect((await http().get(docUrl(cPath)).set(bearer(ADMIN))).status).toBe(200);
            }
        });

        it("serves a file kept under another case's folder to members of the case whose document stores it", async () => {
            expect((await http().get(docUrl('doc/case1154/dc_77.pdf')).set(bearer(MEMBER))).status).toBe(200);
            expect((await http().get(docUrl('doc/case1154/dc_77.pdf')).set(bearer(STRANGER))).status).toBe(403);
            expect((await http().get(docUrl('doc/case1154/dc_78.pdf')).set(bearer(MEMBER))).status).toBe(403);
        });

        it('answers 500 and streams nothing when the access lookup fails', async () => {
            rowQuery.mockResolvedValueOnce({ success: false, error: 'db down' } as any);
            expect((await http().get(docUrl(`doc/case${CASE_A}/dc_1.pdf`)).set(bearer(MEMBER))).status).toBe(500);
            expect(files.downloadSingleFileFromS3).not.toHaveBeenCalled();
        });
    });

    describe('selection routes need the case, and a section of that case', () => {
        const routes = ['/download/downloadfile', '/download/hyperlink/downloadfile', '/download/approximate/size'];

        it('serve a member their own case and section', async () => {
            for (const route of routes) {
                expect((await http().get(`${route}?${selection(CASE_A, SEC_A)}`).set(bearer(MEMBER))).status).toBe(200);
            }
        });

        it("refuse another case, another case's section, or no case at all", async () => {
            for (const route of routes) {
                for (const q of [selection(CASE_B, SEC_B), selection(CASE_A, SEC_B), selection(CASE_B, SEC_A),
                    `nSectionid=${SEC_A}&jFiles=%5B%5D&jFolders=%5B%5D`, `nCaseid=&nSectionid=${SEC_A}&jFiles=%5B%5D&jFolders=%5B%5D`]) {
                    const res = await http().get(`${route}?${q}`).set(bearer(MEMBER));
                    expect({ route, q, status: res.status }).toEqual({ route, q, status: 403 });
                }
            }
            expect(served()).toBe(0);
        });

        it('serve a global admin any case', async () => {
            for (const route of routes) {
                expect((await http().get(`${route}?${selection(CASE_B, SEC_B)}`).set(bearer(ADMIN))).status).toBe(200);
            }
        });

        it('check the case inside the present-report params', async () => {
            const url = (obj: unknown) => `/download/downloadPresentReport?params=${presentParams(obj)}`;
            expect((await http().get(url({ nCaseid: CASE_A, cPname: 'Day 1' })).set(bearer(MEMBER))).status).toBe(200);
            expect((await http().get(url({ nCaseid: CASE_B })).set(bearer(MEMBER))).status).toBe(403);
            expect((await http().get(url({ cPname: 'x' })).set(bearer(MEMBER))).status).toBe(403);
            expect((await http().get('/download/downloadPresentReport?params=%%%').set(bearer(MEMBER))).status).toBe(403);
            expect(reports.downloadPresentfiles).toHaveBeenCalledTimes(1);
        });
    });

    describe('hyperlink/downloadfile only takes documents of the case it names', () => {
        // et_download_with_linkfiles: with no nSectionid it picks jFiles by id alone, from any case.
        const hyperlink = (jFiles: string, section = '') =>
            `/download/hyperlink/downloadfile?nCaseid=${CASE_A}&nSectionid=${section}&jFiles=${encodeURIComponent(jFiles)}&jFolders=%5B%5D`;

        it("refuses another case's document named in jFiles, with or without a section", async () => {
            for (const url of [
                hyperlink(JSON.stringify([DOC_B])), hyperlink(JSON.stringify([DOC_A, DOC_B])),
                hyperlink(JSON.stringify([DOC_B.toUpperCase()])), hyperlink(JSON.stringify([DOC_B]), SEC_A),
                `${hyperlink(JSON.stringify([DOC_B]))}`.replace('nSectionid=&', 'nSectionid=null&'),
            ]) {
                for (const user of [MEMBER, ADMIN]) {
                    const res = await http().get(url).set(bearer(user));
                    expect({ url, user, status: res.status }).toEqual({ url, user, status: 403 });
                }
            }
            expect(files.downloadfilesWithHyperLink).not.toHaveBeenCalled();
        });

        it('refuses a jFiles that is not a JSON array', async () => {
            for (const jFiles of [`{${DOC_B}}`, `"${DOC_B}"`, `{"a":"${DOC_B}"}`, 'not json']) {
                const res = await http().get(hyperlink(jFiles)).set(bearer(MEMBER));
                expect({ jFiles, status: res.status }).toEqual({ jFiles, status: 403 });
            }
            expect(files.downloadfilesWithHyperLink).not.toHaveBeenCalled();
        });

        it("still serves the member's own document with no section (legacy toolbar), and an empty pick", async () => {
            for (const url of [hyperlink(JSON.stringify([DOC_A])), hyperlink(JSON.stringify([DOC_A, 'not-a-uuid', 7])), hyperlink('[]'), hyperlink('[]', SEC_A)]) {
                const res = await http().get(url).set(bearer(MEMBER));
                expect({ url, status: res.status }).toEqual({ url, status: 200 });
            }
            expect(files.downloadfilesWithHyperLink).toHaveBeenCalledTimes(4);
        });
    });
});
