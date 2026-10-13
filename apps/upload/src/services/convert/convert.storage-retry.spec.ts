jest.mock('fs', () => {
  const actual = jest.requireActual('fs');
  return { ...actual, promises: { ...actual.promises, stat: jest.fn(), rm: jest.fn() } };
});
import { promises as fs } from 'fs';
import { ConvertService } from './convert.service';
import { MovetoS3Service } from '../moveto-s3/moveto-s3.service';

const DOCUMENT = '11111111-1111-4111-8111-111111111111';
const ACTOR = '22222222-2222-4222-8222-222222222222';
function fixture() {
  const utility = { emit: jest.fn() };
  const filecopyService = { copyFile: jest.fn().mockResolvedValue(true) };
  const fileInfo = { updateConvertFileInfo: jest.fn().mockResolvedValue({ msg: 1, nBundledetailid: DOCUMENT }), convertLog: jest.fn(), findConvertedDocument: jest.fn().mockResolvedValue(null) };
  const service: ConvertService = Object.assign(Object.create(ConvertService.prototype), {
    utility, filecopyService, fileInfo,
    config: { get: () => '/fixtures/' }, fileDeleteQueue: { add: jest.fn() },
    fileVerificationService: { verifyFile: jest.fn().mockResolvedValue({ isValidate: true, totalpages: 2 }) },
    downloadFileToDisk: jest.fn().mockResolvedValue(true), fileExists: jest.fn().mockResolvedValue(true),
    convertFile: jest.fn().mockResolvedValue(true), convertLog: jest.fn(),
  });
  const data = { name: 'doc/source', filetype: 'docx', cPath: 'doc/source.docx', cFilename: 'source.docx', nBundledetailid: DOCUMENT, nMasterid: ACTOR };
  return { service, utility, filecopyService, fileInfo, data };
}
beforeEach(() => {
  jest.clearAllMocks();
  (fs.stat as jest.Mock).mockResolvedValue({ size: 20 });
  (fs.rm as jest.Mock).mockResolvedValue(undefined);
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => jest.restoreAllMocks());

it.each([false, undefined, { msg: 1 }])('rejects unsuccessful storage (%p), keeps the source, and never sends completed status', async (result) => {
  const f = fixture();
  f.filecopyService.copyFile.mockResolvedValue(result);
  await expect(f.service.handleConvert(f.data)).rejects.toThrow('File storage copy failed');
  expect(fs.rm).not.toHaveBeenCalled();
  expect(f.utility.emit.mock.calls.some(([event]) => event.data.cStatus === 'S')).toBe(false);
});

it('propagates storage rejection and lets a subsequent attempt update the same document before cleanup', async () => {
  const f = fixture();
  f.filecopyService.copyFile.mockRejectedValueOnce(new Error('queue unavailable'));
  await expect(f.service.handleConvert(f.data)).rejects.toThrow('queue unavailable');
  expect(fs.rm).not.toHaveBeenCalled();
  await expect(f.service.handleConvert(f.data)).resolves.toBe(true);
  expect(f.fileInfo.updateConvertFileInfo.mock.calls.map(([body]) => body.nBundledetailid)).toEqual([DOCUMENT, DOCUMENT]);
  expect(f.filecopyService.copyFile.mock.invocationCallOrder[1]).toBeLessThan((fs.rm as jest.Mock).mock.invocationCallOrder[0]);
  expect(f.utility.emit.mock.calls.filter(([event]) => event.data.cStatus === 'S')).toHaveLength(1);
});

it('awaits the direct conversion request and reports unsuccessful conversion instead of success', async () => {
  const f = fixture();
  f.fileInfo['get_filedata'] = jest.fn().mockResolvedValue({ cPath: 'doc/source.docx' });
  const completion = jest.spyOn(f.service, 'handleConvert').mockResolvedValue(false);
  await expect(f.service.fileConvert({ nMasterid: ACTOR, nBundledetailid: DOCUMENT } as never)).resolves.toEqual({ msg: -1 });
  expect(completion).toHaveBeenCalled();
});

it('does not copy or clean up when the metadata save returns a failure record', async () => {
  const f = fixture(); f.fileInfo.updateConvertFileInfo.mockResolvedValue({ msg: -1, nBundledetailid: DOCUMENT });
  await expect(f.service.handleConvert(f.data)).resolves.toBe(false);
  expect(f.filecopyService.copyFile).not.toHaveBeenCalled();
  expect(fs.rm).not.toHaveBeenCalled();
  expect(f.utility.emit.mock.calls.some(([event]) => event.data.cStatus === 'S')).toBe(false);
});

it('recovers a converted document saved before a failed checkpoint instead of creating a second row', async () => {
  const f = fixture();
  const CASE = '33333333-3333-4333-8333-333333333333';
  const SECTION = '44444444-4444-4444-8444-444444444444';
  const item = { cFilename: 'source.docx', nUserid: ACTOR, nCaseid: CASE, nSectionid: SECTION, nParentbundleid: null };
  const first: any = {};
  await expect(f.service.filedataProcess(first, item, null, '/fixtures/doc/dc_123.pdf', 'doc/dc_123.pdf', true)).resolves.toBe(true);
  expect(first.nNewBundledetailid).toBe(DOCUMENT);
  // Simulate metadata committed, but Bull job.update failed and redelivery contains its original data.
  const redelivered: any = {};
  f.fileInfo.findConvertedDocument.mockResolvedValue({ msg: 1, nBundledetailid: DOCUMENT });
  await expect(f.service.filedataProcess(redelivered, item, null, '/fixtures/doc/dc_123.pdf', 'doc/dc_123.pdf', true)).resolves.toBe(true);
  expect(redelivered).toMatchObject({ nNewBundledetailid: DOCUMENT, cSavepath: 'doc/dc_123.pdf' });
  expect(f.fileInfo.updateConvertFileInfo).toHaveBeenCalledTimes(1);
  expect(f.fileInfo.findConvertedDocument).toHaveBeenLastCalledWith(expect.objectContaining({ cPath: 'doc/dc_123.pdf', nMasterid: ACTOR, nSectionid: SECTION, nBundleid: null }), CASE);
});

it('recovers the committed B document after ZIP checkpoint failure and copies it under the same ID on redelivery', async () => {
  const f = fixture();
  const CASE = '33333333-3333-4333-8333-333333333333';
  const SECTION = '44444444-4444-4444-8444-444444444444';
  const original = { cSavepath: 'doc/dc_123.docx', cFilename: 'source.docx', nBundledetailid: 'native-document' };
  const job: any = { converttype: 'B', nUserid: ACTOR, nCaseid: CASE, nSectionid: SECTION, nParentbundleid: null };
  Object.assign(f.service, { convertToPdf: jest.fn().mockResolvedValue(true) });
  const copy = { copyFile: jest.fn().mockResolvedValue(true) };
  const moving: MovetoS3Service = Object.assign(Object.create(MovetoS3Service.prototype), {
    convertService: f.service, fileService: copy, config: { get: () => '/fixtures/' },
    logService: { info: jest.fn() }, fTypes: ['docx'],
    fileVerificationService: { verifyFile: jest.fn().mockResolvedValue({ isValidate: true, totalpages: 2 }) },
  });
  const checkpoint = jest.fn().mockRejectedValueOnce(new Error('Redis checkpoint unavailable')).mockResolvedValue(undefined);
  await expect(moving.MovingToS3(job, 'C', { ...original }, '/fixtures/doc/dc_123.docx', undefined, true, checkpoint)).rejects.toThrow('Redis checkpoint unavailable');
  expect(f.fileInfo.updateConvertFileInfo).toHaveBeenCalledTimes(1);
  expect(copy.copyFile).not.toHaveBeenCalled();
  f.fileInfo.findConvertedDocument.mockResolvedValue({ msg: 1, nBundledetailid: DOCUMENT });
  await expect(moving.MovingToS3(job, 'C', { ...original }, '/fixtures/doc/dc_123.docx', undefined, true, checkpoint)).resolves.toBe(true);
  expect(f.fileInfo.updateConvertFileInfo).toHaveBeenCalledTimes(1);
  expect(copy.copyFile).toHaveBeenCalledWith('doc/dc_123.pdf', 'C', undefined, DOCUMENT, null, null, null, undefined);
});

it('skips recovery lookup for a known document ID and updates that existing document', async () => {
  const f = fixture(); const item = { cFilename: 'source.docx', nUserid: ACTOR };
  await expect(f.service.filedataProcess({}, item, DOCUMENT, '/fixtures/doc/source.pdf', 'doc/source.pdf', true)).resolves.toBe(true);
  expect(f.fileInfo.findConvertedDocument).not.toHaveBeenCalled();
  expect(f.fileInfo.updateConvertFileInfo).toHaveBeenCalledWith(expect.objectContaining({ nBundledetailid: DOCUMENT }));
});

it.each(['Converted document identity is unavailable', 'Converted document identity is ambiguous'])('rejects failed identity recovery (%s) without creating another row', async (message) => {
  const f = fixture(); const item = { cFilename: 'source.docx', nUserid: ACTOR };
  f.fileInfo.findConvertedDocument.mockRejectedValue(new Error(message));
  await expect(f.service.filedataProcess({}, item, null, '/fixtures/doc/source.pdf', 'doc/source.pdf', true)).rejects.toThrow(message);
  expect(f.fileInfo.updateConvertFileInfo).not.toHaveBeenCalled();
});

it('retains exhausted conversion jobs and their checkpoints for retry', async () => {
  const f = fixture(); const convertQueue = { add: jest.fn() };
  Object.assign(f.service, { convertQueue, convertEmailQueue: { add: jest.fn() } });
  f.fileInfo['convert_fileDataMulti'] = jest.fn().mockResolvedValue([{ cPath: 'doc/source.docx', nBundledetailid: DOCUMENT }]);
  await expect(f.service.convertfile_multi({ nMasterid: ACTOR, cConvertType: 'C' } as never)).resolves.toMatchObject({ msg: 1 });
  expect(convertQueue.add).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({ removeOnFail: false, attempts: 3 }));
});
