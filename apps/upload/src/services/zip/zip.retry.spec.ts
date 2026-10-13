import * as fs from 'fs';
import * as path from 'path';
import { ZipService } from './zip.service';

const CASE = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const NATIVE = `doc/case${CASE}/dc_1.docx`;
const PDF = `doc/case${CASE}/dc_1.pdf`;
const detail = { nJobid: 'job-1', nUPid: 'upload-1', identifier: 'zip-1', converttype: 'B' };

describe('ZIP entry retries', () => {
  let service: any;
  let mover: any;

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const config = { get: (key: string) => key === 'ASSETS' ? './assets/' : undefined };
    const logs = { info: jest.fn(), error: jest.fn() };
    mover = { MovingToS3: jest.fn().mockResolvedValue(true) };
    service = new ZipService(config as any, {} as any, {} as any, { emit: jest.fn() } as any,
      logs as any, {} as any, {} as any, {} as any, {} as any, mover);
    jest.spyOn(service, 'findEntry').mockResolvedValue({ fileName: 'Report.docx' });
    jest.spyOn(service, 'movefiles').mockResolvedValue(true);
    jest.spyOn(service, 'responseFile').mockResolvedValue(undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it('rejects rather than hanging when MovingToS3 rejects', async () => {
    mover.MovingToS3.mockRejectedValue(new Error('storage failed'));
    await expect(service.performTask(detail, { path: 'Report.docx', cSavepath: NATIVE })).rejects.toThrow('storage failed');
    expect(service.responseFile).not.toHaveBeenCalled();
  });

  it('waits for running entries, then rejects the extraction if any admission failed', async () => {
    let finish: () => void;
    const slow = new Promise<void>(resolve => { finish = resolve; });
    jest.spyOn(service, 'performTask').mockImplementation(async (_detail: any, item: any) => {
      if (item.path === 'failed') throw new Error('queue unavailable');
      await slow;
      return true;
    });
    const extraction = service.extrationIndividual(detail, [{ path: 'failed' }, { path: 'slow' }]);
    const outcome = extraction.then(() => 'complete', () => 'failed');
    await new Promise(resolve => setImmediate(resolve));
    expect(service.pendingTasks).toBe(1);
    finish();
    await expect(outcome).resolves.toBe('failed');
    expect(service.pendingTasks).toBe(0);
    expect(service.clearLogAction).toBeDefined();
  });

  it('reuses a checkpointed B conversion without overwriting its PDF with the native ZIP bytes', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    const checkpoint = jest.fn().mockResolvedValue(undefined);
    const item: any = { path: 'Report.docx', cSavepath: PDF, _zipExtractionPath: NATIVE,
      _zipNativeCopied: true, nNewBundledetailid: 'converted-document-id' };
    await expect(service.performTask(detail, item, checkpoint)).resolves.toBe(true);
    expect(service.movefiles).toHaveBeenCalledWith(expect.anything(), detail, path.resolve('assets', NATIVE));
    expect(mover.MovingToS3).toHaveBeenCalledTimes(1);
    expect(mover.MovingToS3).toHaveBeenCalledWith(detail, 'C', item, path.resolve('assets', PDF), NATIVE, true, checkpoint);
    expect(item.cSavepath).toBe(PDF);
    expect(item.nNewBundledetailid).toBe('converted-document-id');
    expect(item._zipComplete).toBe(true);
  });

  it('regenerates a missing converted source while preserving the converted resource ID', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    const item = { path: 'Report.docx', cSavepath: PDF, _zipExtractionPath: NATIVE,
      _zipNativeCopied: true, nNewBundledetailid: 'converted-document-id' };
    await expect(service.performTask(detail, item)).resolves.toBe(true);
    expect(mover.MovingToS3.mock.calls[0][2]).toMatchObject({ cSavepath: NATIVE, nNewBundledetailid: 'converted-document-id' });
  });

  it('refuses an unsafe converted path even when the saved native extraction path is safe', async () => {
    const item = { path: 'Report.docx', cSavepath: '../unsafe.pdf', _zipExtractionPath: NATIVE };
    await expect(service.performTask(detail, item)).resolves.toBe(false);
    expect(mover.MovingToS3).not.toHaveBeenCalled();
    expect(service.responseFile).toHaveBeenCalledWith(detail, 'F', item);
  });
});
