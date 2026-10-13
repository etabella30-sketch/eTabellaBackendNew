import { MovetoS3Service } from './moveto-s3.service';
const DOCUMENT = '11111111-1111-4111-8111-111111111111';
const CONVERTED = '22222222-2222-4222-8222-222222222222';
function fixture() {
  const copy = { copyFile: jest.fn().mockResolvedValue(true) };
  const convertService = { convertLog: jest.fn(), convertToPdf: jest.fn().mockResolvedValue(true), filedataProcess: jest.fn().mockResolvedValue(true) };
  const service: MovetoS3Service = Object.assign(Object.create(MovetoS3Service.prototype), {
    fileService: copy, convertService,
    logService: { info: jest.fn() }, config: { get: () => '/fixtures/' },
    fileVerificationService: { verifyFile: jest.fn().mockResolvedValue({ isValidate: true, totalpages: 1 }) },
    fTypes: ['docx'],
  });
  const job: any = { nUPid: 'upload', converttype: 'C' };
  const item = { cSavepath: 'doc/source.pdf', nBundledetailid: DOCUMENT };
  return { service, copy, convertService, job, item };
}
beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
});
afterEach(() => jest.restoreAllMocks());

it.each([false, undefined, { msg: 1 }])('rejects unsuccessful ZIP storage (%p) so its Bull caller can retry', async (result) => {
  const f = fixture(); f.copy.copyFile.mockResolvedValue(result);
  await expect(f.service.MovingToS3(f.job, 'C', f.item, '/fixtures/doc/source.pdf')).rejects.toThrow('File storage copy failed');
});

it('propagates a rejected copy and does not turn it into true', async () => {
  const f = fixture(); f.copy.copyFile.mockRejectedValue(new Error('queue unavailable'));
  await expect(f.service.MovingToS3(f.job, 'C', f.item, '/fixtures/doc/source.pdf')).rejects.toThrow('queue unavailable');
});

it('checkpoints the converted resource before copy and reuses that same ID on retry', async () => {
  const f = fixture(); f.item.cSavepath = 'doc/source.docx';
  const convert = jest.spyOn(f.service, 'convert').mockImplementation(async (_job, item) => {
    item.cSavepath = 'doc/source.pdf'; item.nNewBundledetailid = CONVERTED; return true;
  });
  const checkpoint = jest.fn().mockResolvedValue(undefined);
  f.copy.copyFile.mockResolvedValueOnce(false);
  await expect(f.service.MovingToS3(f.job, 'C', f.item, '/fixtures/doc/source.docx', 'doc/source.docx', true, checkpoint)).rejects.toThrow();
  expect(checkpoint.mock.invocationCallOrder[0]).toBeLessThan(f.copy.copyFile.mock.invocationCallOrder[0]);
  await expect(f.service.MovingToS3(f.job, 'C', f.item, '/fixtures/doc/source.pdf', 'doc/source.docx', true, checkpoint)).resolves.toBe(true);
  expect(convert).toHaveBeenCalledTimes(1);
  expect(f.copy.copyFile.mock.calls.map((args) => args[3])).toEqual([CONVERTED, CONVERTED]);
});

it('stops before storage when checkpoint persistence fails', async () => {
  const f = fixture(); const checkpoint = jest.fn().mockRejectedValue(new Error('checkpoint unavailable'));
  await expect(f.service.MovingToS3(f.job, 'C', f.item, '/fixtures/doc/source.pdf', undefined, false, checkpoint)).rejects.toThrow('checkpoint unavailable');
  expect(f.copy.copyFile).not.toHaveBeenCalled();
});

it('regenerates a B conversion into an already resolved ID instead of creating another document', async () => {
  const f = fixture(); f.job.converttype = 'B';
  const item = { ...f.item, cSavepath: 'doc/source.docx', nNewBundledetailid: CONVERTED };
  await expect(f.service.convert(f.job, item)).resolves.toBe(true);
  expect(f.convertService.filedataProcess.mock.calls[0][2]).toBe(CONVERTED);
});

it('propagates a failed metadata save before copy or checkpointing a falsely completed resource', async () => {
  const f = fixture(); f.item.cSavepath = 'doc/source.docx';
  f.convertService.filedataProcess.mockResolvedValue(false);
  const checkpoint = jest.fn().mockResolvedValue(undefined);
  await expect(f.service.MovingToS3(f.job, 'C', f.item, '/fixtures/doc/source.docx', undefined, true, checkpoint)).rejects.toThrow('Failed to save converted file information');
  expect(f.copy.copyFile).not.toHaveBeenCalled();
  expect(checkpoint).not.toHaveBeenCalled();
});
