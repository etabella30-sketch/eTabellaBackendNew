import * as express from 'express';
import { validateHeaderValue } from 'http';
import { Readable } from 'stream';
import * as request from 'supertest';
import { DownloadfileService } from './downloadfile.service';
import { PresentReportService } from '../present-report/present-report.service';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const contentDisposition = require('content-disposition'); // express's own parser, as a strict reader
// eslint-disable-next-line @typescript-eslint/no-var-requires
const realFs = require('fs');

// The Content-Disposition the download app sends. Its file name comes from the request (cFilename
// on GET /download, cPname inside the present-report params), from the Spaces key (the extension)
// and from stored names. None of these may add a header or a parameter, and a legal name must not
// break the download.

const config = {
    get: (k: string) => ({
        DO_SPACES_ENDPOINT: 'http://127.0.0.1:1', DO_SPACES_KEY: 'k', DO_SPACES_SECRET: 's', DO_SPACES_BUCKET_NAME: 'bucket',
    } as Record<string, string>)[k],
};
const logService = { info: jest.fn(), error: jest.fn(), log: jest.fn(), warn: jest.fn() };

function fileService(): DownloadfileService {
    const svc = new DownloadfileService({} as any, config as any, logService as any, {} as any, {} as any);
    (svc as any).s3Client = { send: jest.fn(async () => ({ Body: Readable.from([Buffer.from('%PDF-1.7 body')]) })) };
    return svc;
}

/** The single-file route as the controller calls it, on a real Node response (real header checks). */
function singleFileApp(svc: DownloadfileService) {
    const app = express();
    app.get('/f', (req, res) => svc.downloadSingleFileFromS3({ cPath: req.query.cPath, cFilename: req.query.cFilename }, res));
    return app;
}

/** Runs createZip up to its Content-Disposition header, checked the way Node checks it, then stops. */
async function zipDisposition(run: (res: any) => Promise<unknown>): Promise<string> {
    const STOP = new Error('stop after the headers');
    const headers: Record<string, string> = {};
    const res = {
        setHeader: jest.fn((name: string, value: string) => {
            validateHeaderValue(name, value);
            headers[name] = value;
            if (name === 'Content-Disposition') throw STOP;
        }),
    };
    await expect(run(res)).rejects.toBe(STOP);
    return headers['Content-Disposition'];
}

describe('download Content-Disposition', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => undefined);
        jest.spyOn(console, 'log').mockImplementation(() => undefined);
        jest.spyOn(realFs, 'existsSync').mockReturnValue(true); // createZip: no session folder on disk
    });

    afterEach(() => jest.restoreAllMocks());

    it('keeps the header unchanged for a plain ASCII name', async () => {
        const res = await request(singleFileApp(fileService())).get('/f').query({ cPath: 'doc/case1131/dc_1.pdf', cFilename: 'Exhibit A-1' });
        expect(res.status).toBe(200);
        expect(res.headers['content-disposition']).toBe('attachment; filename="Exhibit_A-1.pdf"');
        expect(res.text ?? res.body.toString()).toContain('%PDF-1.7');
    });

    it('streams a non-Latin name with an RFC 5987 filename* instead of failing with a 500', async () => {
        const res = await request(singleFileApp(fileService())).get('/f').query({ cPath: 'doc/case1131/dc_2.pdf', cFilename: '報告書 最終' });
        expect(res.status).toBe(200);
        const header = res.headers['content-disposition'];
        expect(header).toMatch(/^[\x20-\x7e]+$/);
        expect(contentDisposition.parse(header).parameters.filename).toBe('報告書_最終.pdf');
    });

    it("cannot gain a parameter from a quote in the key's extension", async () => {
        const cPath = 'doc/case1131/dc_3.pdf"; filename="evil';
        const res = await request(singleFileApp(fileService())).get('/f').query({ cPath, cFilename: 'Exhibit A-1' });
        expect(res.status).toBe(200);
        const parsed = contentDisposition.parse(res.headers['content-disposition']);
        expect(parsed.type).toBe('attachment');
        expect(parsed.parameters).toEqual({ filename: 'Exhibit_A-1.pdf"; filename="evil' });
    });

    it('never lets CR/LF from the name reach the headers', async () => {
        const res = await request(singleFileApp(fileService())).get('/f').query({ cPath: 'doc/case1131/dc_4.pdf', cFilename: 'a\r\nSet-Cookie: x=1' });
        expect(res.status).toBe(200);
        expect(res.headers['set-cookie']).toBeUndefined();
        expect(res.headers['content-disposition']).not.toMatch(/[\r\n]/);
    });

    it('present-report ZIP: cPname from the request cannot add parameters, and any script is accepted', async () => {
        const svc = new PresentReportService({} as any, config as any, logService as any,
            { createIndexFile: jest.fn(async () => false) } as any, { add: jest.fn() } as any);
        const zip = (filename: string) => zipDisposition((res) =>
            svc.createZip([{ filename, cFilename: 'a.pdf', cPath: 'doc/case1131/a.pdf', nBundledetailid: 'b1' }], res, 'log', {}));

        const injected = await zip('Hearing "Day 1"; filename=evil.exe_2026-01-01');
        expect(contentDisposition.parse(injected).parameters).toEqual({ filename: 'Hearing "Day 1"; filename=evil.exe_2026-01-01.zip' });

        const arabic = await zip('جلسة_2026-01-01');
        expect(contentDisposition.parse(arabic).parameters.filename).toBe('جلسة_2026-01-01.zip');
    });

    it('selection ZIP: a stored case name with spaces is one quoted file name', async () => {
        const svc = fileService();
        const header = await zipDisposition((res) =>
            svc.createZip([{ filename: 'Specon v SBJV Arbitration', cFilename: 'a.pdf', cPath: 'doc/case1131/a.pdf' }], res, 'log',
                { jFiles: '[]', jFolders: '[]' }));
        expect(header).toBe('attachment; filename="Specon v SBJV Arbitration.zip"');
        expect(contentDisposition.parse(header).parameters.filename).toBe('Specon v SBJV Arbitration.zip');
    });
});
