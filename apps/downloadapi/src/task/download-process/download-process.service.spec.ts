import { DownloadProcessService } from './download-process.service';

describe('DownloadProcessService package annotations', () => {
  it('burns Facts and QFacts into evidence PDFs when the facts option is selected', async () => {
    const jobDetail = {
      nDPid: 'DP-037',
      nCaseid: 'CASE-037',
      nCreateId: 'USER-037',
      nSectionid: 'SECTION-037',
      jInclude: { includes: ['evidence', 'facts'], folders: ['FOLDER-037'] },
    };
    const files = [{
      nBundledetailid: 'DOC-037',
      cFilename: 'Evidence.pdf',
      foldername: 'Bundle A',
      cPath: 'source/Evidence.pdf',
      cBatchType: 'S',
    }];
    const dataService = {
      getProcessJobDetail: jest.fn().mockResolvedValue(jobDetail),
      getFiles: jest.fn().mockResolvedValue(files),
    };
    const updateFileSize = {
      updateFileSize: jest.fn().mockResolvedValue({ largeBatches: [], smallBatches: [] }),
    };
    const redisService = {
      getQueueSummary: jest.fn().mockResolvedValue({ isAllPartsUploaded: true }),
      updateActionStatus: jest.fn(),
      setupBatchSizes: jest.fn(),
      updateTotalPartsCount: jest.fn().mockResolvedValue(undefined),
    };
    const finalizeArchiverService = { finalizeArchive: jest.fn() };
    const logService = { info: jest.fn(), error: jest.fn() };
    const packageReports = {
      buildReportFiles: jest.fn().mockResolvedValue([]),
      buildMasterIndexFiles: jest.fn().mockResolvedValue([]),
    };
    const annotateEvidence = { annotateEvidence: jest.fn().mockResolvedValue(undefined) };
    const mainJob = { progress: jest.fn().mockResolvedValue(undefined) };

    const service = new DownloadProcessService(
      dataService as never,
      updateFileSize as never,
      {} as never,
      redisService as never,
      {} as never,
      {} as never,
      finalizeArchiverService as never,
      logService as never,
      packageReports as never,
      annotateEvidence as never,
    );

    await service.startDownload({ nDPid: jobDetail.nDPid } as never, mainJob as never, jest.fn());

    expect(annotateEvidence.annotateEvidence).toHaveBeenCalledWith(jobDetail, files);
  });
});
