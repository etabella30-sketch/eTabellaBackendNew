import * as path from 'path';
import { ZipService } from './zip.service';

// ZIP extraction: et_upload_unzip_extractation returns each entry's cSavepath as
// `doc/case<id>/dc_<n>.<ext>`, the ext copied from the zip entry's own name (content the uploader
// controls). performTask writes the entry there and hands the path to MovingToS3 -> s3cmd on a
// shell command line, so only that shape may be written.

const CASE = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const jobDetail = { nJobid: 'j1', nUPid: 'u1', identifier: 'zip-id', converttype: 'N' };

describe('ZipService.performTask keeps extraction paths in place', () => {
    let svc: any;
    let movetos3: { MovingToS3: jest.Mock };

    beforeEach(() => {
        jest.spyOn(console, 'log').mockImplementation(() => undefined);
        movetos3 = { MovingToS3: jest.fn(async () => true) };
        const config = { get: (k: string) => (k === 'ASSETS' ? './assets/' : undefined) };
        const logs = { info: jest.fn(), error: jest.fn(), warn: jest.fn() };
        svc = new ZipService(config as any, {} as any, {} as any, {} as any, logs as any, {} as any, {} as any, {} as any, {} as any, movetos3 as any);
        jest.spyOn(svc, 'findEntry').mockResolvedValue({ fileName: 'entry' });
        jest.spyOn(svc, 'movefiles').mockResolvedValue(true);
        jest.spyOn(svc, 'responseFile').mockResolvedValue(undefined);
    });

    afterEach(() => jest.restoreAllMocks());

    it('still extracts a normal entry to its doc path and sends it on to S3', async () => {
        const item = { path: 'folder/Report.pdf', cSavepath: `doc/case${CASE}/dc_123456.pdf` };
        await expect(svc.performTask(jobDetail, item)).resolves.toBe(true);
        expect(svc.movefiles).toHaveBeenCalledWith(expect.anything(), jobDetail, path.resolve(`assets/doc/case${CASE}/dc_123456.pdf`));
        expect(movetos3.MovingToS3).toHaveBeenCalled();
    });

    it.each([
        `doc/case${CASE}/dc_1.pdf;touch pwned`,
        `doc/case${CASE}/dc_1.$(touch pwned)`,
        `doc/case${CASE}/dc_1.x\\..\\..\\..\\escaped`,
        `doc/case${CASE}/../../escaped.pdf`,
        '../escaped.pdf',
    ])('refuses cSavepath %j: nothing written or sent to S3, entry marked failed', async (cSavepath) => {
        const item = { path: 'x', cSavepath };
        await expect(svc.performTask(jobDetail, item)).resolves.toBe(false);
        expect(svc.movefiles).not.toHaveBeenCalled();
        expect(movetos3.MovingToS3).not.toHaveBeenCalled();
        expect(svc.responseFile).toHaveBeenCalledWith(jobDetail, 'F', item);
    });
});
