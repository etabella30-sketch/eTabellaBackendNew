import * as fs from 'fs/promises';
import { UnzipProcessor } from './unzip.processor';
import { ZipService } from '../services/zip/zip.service';

jest.mock('fs/promises', () => ({ unlink: jest.fn().mockResolvedValue(undefined) }));

const CASE = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const DOCUMENT = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

describe('ZIP storage and notification retry', () => {
  let processor: UnzipProcessor;
  let instances: ZipService[];
  let fileInfo: any;
  let utility: any;
  let mover: any;
  let job: any;

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    instances = [];
    const detail = { nJobid: 'job-1', nCaseid: CASE, cPath: `doc/case${CASE}/file_1.zip`,
      nUserid: 'owner', identifier: 'zip-1', converttype: 'N' };
    fileInfo = {
      getJobDetail: jest.fn(async () => ({ ...detail })),
      saveBundle: jest.fn(async () => [{ nBundledetailid: DOCUMENT, path: 'Report.pdf',
        cSavepath: `doc/case${CASE}/dc_1.pdf` }]),
      finalUpdate: jest.fn(async () => ({ msg: 1 })), jobFailed: jest.fn(),
      validateZipExtraction: jest.fn().mockResolvedValue(true),
    };
    fileInfo.saveBundleWithCheckpoint = jest.fn(async (detail: any, entries: any[], checkpoint: any) => {
      const rows = await fileInfo.saveBundle(detail, entries);
      await checkpoint(rows);
      return rows;
    });
    const config = { get: (key: string) => key === 'ASSETS' ? './assets/' : undefined };
    const logs = { info: jest.fn(), error: jest.fn() };
    utility = { emit: jest.fn() };
    mover = { MovingToS3: jest.fn().mockResolvedValue(true) };
    const moduleRef = { create: jest.fn(async () => {
      const zip = new ZipService(config as any, {} as any, fileInfo, utility, logs as any,
        {} as any, {} as any, {} as any, {} as any, mover);
      zip.zipFile = { close: jest.fn() };
      jest.spyOn(zip, 'openZipFile').mockResolvedValue(true);
      jest.spyOn(zip, 'readFiles').mockResolvedValue([{ path: 'Report.pdf', entry: {} }]);
      jest.spyOn(zip, 'formateData').mockImplementation(async () => {
        zip.result = [{ id: 'generated-plan-id' }];
        return zip.result;
      });
      jest.spyOn(zip, 'movefiles').mockResolvedValue(true);
      instances.push(zip);
      return zip;
    }) };
    processor = new UnzipProcessor(fileInfo, utility, moduleRef as any, logs as any, config as any);
    job = { data: { nJobid: 'job-1', nUPid: 'upload-1', nUDid: 'detail-1', identifier: 'zip-1' },
      opts: { attempts: 3 }, attemptsMade: 0,
      update: jest.fn(async (data: any) => { job.data = JSON.parse(JSON.stringify(data)); }),
    };
    (fs.unlink as jest.Mock).mockClear();
  });

  afterEach(() => jest.restoreAllMocks());

  it('rejects admission failure to Bull without completing or deleting the archive, then reuses document IDs', async () => {
    mover.MovingToS3.mockRejectedValueOnce(new Error('notification queue unavailable'));
    await expect(processor.handleUnzip(job)).rejects.toThrow('notification queue unavailable');
    expect(fileInfo.finalUpdate).not.toHaveBeenCalled();
    expect(fileInfo.jobFailed).not.toHaveBeenCalled();
    expect(utility.emit).not.toHaveBeenCalledWith(expect.objectContaining({ event: 'ZIP-COMPLETE' }));
    expect(fs.unlink).not.toHaveBeenCalled();
    expect(job.data.zipExtraction.items[0]).toMatchObject({ nBundledetailid: DOCUMENT });
    expect(instances[0].zipFile.close).toHaveBeenCalled();

    job.attemptsMade = 1;
    await expect(processor.handleUnzip(job)).resolves.toBeUndefined();
    expect(fileInfo.saveBundle).toHaveBeenCalledTimes(1);
    expect(mover.MovingToS3.mock.calls.map((call: any[]) => call[2].nBundledetailid)).toEqual([DOCUMENT, DOCUMENT]);
    expect(fileInfo.finalUpdate).toHaveBeenCalledWith(expect.objectContaining({ cIsFinal: 'Y' }));
    expect(utility.emit).toHaveBeenCalledWith(expect.objectContaining({ event: 'ZIP-COMPLETE' }));
    expect(fs.unlink).toHaveBeenCalledTimes(1);
  });

  it('refuses to extract when the resource checkpoint cannot be stored', async () => {
    job.update.mockRejectedValueOnce(new Error('Redis checkpoint failed'));
    await expect(processor.handleUnzip(job)).rejects.toThrow('Redis checkpoint failed');
    expect(mover.MovingToS3).not.toHaveBeenCalled();
    expect(fileInfo.finalUpdate).not.toHaveBeenCalled();
    expect(fs.unlink).not.toHaveBeenCalled();
  });

  it('keeps a completed entry checkpoint when final database status fails and retries only that status', async () => {
    fileInfo.finalUpdate.mockResolvedValueOnce({ msg: -1 });
    await expect(processor.handleUnzip(job)).rejects.toThrow('ZIP final status could not be saved');
    expect(job.data.zipExtraction.items[0]._zipComplete).toBe(true);
    expect(fs.unlink).not.toHaveBeenCalled();
    job.attemptsMade = 1;
    await processor.handleUnzip(job);
    expect(fileInfo.saveBundle).toHaveBeenCalledTimes(1);
    expect(mover.MovingToS3).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fileInfo.finalUpdate.mock.calls[1][0].jFiles)[0]).toMatchObject({ nBundledetailid: DOCUMENT });
    expect(fs.unlink).toHaveBeenCalledTimes(1);
  });

  it('retains the archive on exhausted failure and records a failed job', async () => {
    job.attemptsMade = 2;
    mover.MovingToS3.mockResolvedValue(false);
    await expect(processor.handleUnzip(job)).rejects.toThrow('storage or notification admission failed');
    expect(fileInfo.jobFailed).toHaveBeenCalledWith('job-1');
    expect(fs.unlink).not.toHaveBeenCalled();
  });

  it('rejects a foreign or partial checkpoint before creating or copying resources', async () => {
    job.data.zipExtraction = { nJobid: 'job-1', items: [{ nBundledetailid: DOCUMENT }] };
    fileInfo.validateZipExtraction.mockRejectedValueOnce(new Error('ZIP resource checkpoint does not match its upload'));
    await expect(processor.handleUnzip(job)).rejects.toThrow('does not match its upload');
    expect(fileInfo.saveBundle).not.toHaveBeenCalled();
    expect(mover.MovingToS3).not.toHaveBeenCalled();
    expect(fs.unlink).not.toHaveBeenCalled();
  });

  it('recreates only rolled-back resource IDs when a process stops after Redis admission before DB commit', async () => {
    const committedId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
    fileInfo.saveBundleWithCheckpoint.mockImplementationOnce(async (detail: any, entries: any[], checkpoint: any) => {
      await checkpoint(await fileInfo.saveBundle(detail, entries));
      throw new Error('Database commit failed');
    });
    await expect(processor.handleUnzip(job)).rejects.toThrow('Database commit failed');
    expect(job.data.zipExtraction.items[0].nBundledetailid).toBe(DOCUMENT);
    expect(mover.MovingToS3).not.toHaveBeenCalled();
    // Simulate a fresh Bull job loaded from the persisted Redis snapshot, with no DB rows.
    job.data = JSON.parse(JSON.stringify(job.data));
    job.attemptsMade = 1;
    fileInfo.validateZipExtraction.mockResolvedValueOnce(false);
    fileInfo.saveBundle.mockResolvedValueOnce([{ nBundledetailid: committedId, path: 'Report.pdf',
      cSavepath: `doc/case${CASE}/dc_2.pdf` }]);
    await processor.handleUnzip(job);
    expect(mover.MovingToS3).toHaveBeenCalledTimes(1);
    expect(mover.MovingToS3.mock.calls[0][2].nBundledetailid).toBe(committedId);
    expect(job.data.zipExtraction.items[0].nBundledetailid).toBe(committedId);
  });
});
