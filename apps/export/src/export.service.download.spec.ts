import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import { PassThrough, Readable } from 'stream';
import { ExportService } from './export.service';

// ExportService.downloadFile streams ./assets/<cPath>. ExportController only lets recorded export
// paths through; these check the service's own second line (the path must stay under ./assets) and
// the Content-Disposition it builds from the query's cFilename. fs is stubbed for ./assets paths
// only, so nothing on disk is read.

const ASSETS = path.resolve('./assets');

/** A response that refuses header values the way Node's ServerResponse does. */
function fakeRes() {
    const res: any = new PassThrough();
    res.resume();
    res.headersSent = false;
    res.headers = {} as Record<string, string>;
    res.setHeader = jest.fn((name: string, value: string) => {
        http.validateHeaderValue(name, value);
        res.headers[name.toLowerCase()] = value;
    });
    res.status = jest.fn(() => res);
    res.send = jest.fn((body: unknown) => {
        res.body = body;
        return res;
    });
    return res;
}

describe('ExportService.downloadFile', () => {
    const service = new ExportService();
    let exists: jest.SpyInstance;
    let open: jest.SpyInstance;
    const underAssets = (p: unknown) => typeof p === 'string' && path.resolve(p).startsWith(ASSETS + path.sep);

    beforeEach(() => {
        jest.spyOn(console, 'log').mockImplementation(() => undefined); // the service logs every cPath
        const realExists = fs.existsSync;
        exists = jest.spyOn(fs, 'existsSync').mockImplementation((p: any) => (underAssets(p) ? true : realExists(p)));
        open = jest.spyOn(fs, 'createReadStream').mockImplementation(() => Readable.from(['%PDF-1.7']) as any);
    });

    afterEach(() => jest.restoreAllMocks());

    it('streams a file under ./assets', async () => {
        const res = fakeRes();
        await service.downloadFile({ cPath: 'export/ed987/modified.pdf', cFilename: 'Exhibit 1.pdf' }, res);
        expect(res.status).not.toHaveBeenCalled();
        expect(open).toHaveBeenCalledWith(path.join(ASSETS, 'export', 'ed987', 'modified.pdf'));
        expect(res.headers['content-disposition']).toBe('attachment; filename="Exhibit 1.pdf"');
        expect(res.headers['cache-control']).toBe('no-store, no-cache, must-revalidate, proxy-revalidate');
    });

    it('refuses a path that leaves ./assets, and never touches the disk for it', async () => {
        const escapes = ['../.env.production', 'export/../../.env.production', '../../etc/passwd', path.resolve('.env.production'),
            '/etc/passwd', 'export/ed987/modified.pdf\u0000.txt', '..', ''];
        for (const cPath of escapes) {
            const res = fakeRes();
            await service.downloadFile({ cPath, cFilename: 'x.pdf' }, res);
            expect({ cPath, status: res.status.mock.calls[0]?.[0] }).toEqual({ cPath, status: 400 });
        }
        const probed = exists.mock.calls.map(([p]) => String(p))
            .filter((p) => /env\.production|passwd|\u0000/.test(p) || [ASSETS, path.dirname(ASSETS)].includes(path.resolve(p)));
        expect(probed).toEqual([]);
        expect(open).not.toHaveBeenCalled();
    });

    it('keeps a name with non-Latin-1 characters instead of failing with a 500', async () => {
        const res = fakeRes();
        await service.downloadFile({ cPath: 'export/ed987/modified.pdf', cFilename: 'Überprüfung – 契約.pdf' }, res);
        expect(res.status).not.toHaveBeenCalled();
        expect(res.headers['content-disposition']).toBe(
            `attachment; filename="_berpr_fung _ __.pdf"; filename*=UTF-8''%C3%9Cberpr%C3%BCfung%20%E2%80%93%20%E5%A5%91%E7%B4%84.pdf`);
    });

    it('does not let cFilename add parameters or lines to the header', async () => {
        const res = fakeRes();
        await service.downloadFile({ cPath: 'export/ed987/modified.pdf', cFilename: `a.pdf"; filename*=UTF-8''evil.html\r\nX-Evil: 1` }, res);
        expect(res.status).not.toHaveBeenCalled();
        // One quoted filename (the `"` replaced, CR/LF dropped) and the exact name, percent-encoded.
        expect(res.headers['content-disposition']).toBe(
            `attachment; filename="a.pdf_; filename*=UTF-8''evil.htmlX-Evil: 1"; `
            + `filename*=UTF-8''a.pdf%22%3B%20filename%2A%3DUTF-8%27%27evil.htmlX-Evil%3A%201`);
    });
});
