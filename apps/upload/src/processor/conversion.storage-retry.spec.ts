jest.mock('../services/convert/convert.service', () => ({ ConvertService: class ConvertService {} }));
jest.mock('../services/convert/email/email.service', () => ({ EmailService: class EmailService {} }));
import { promises as fs } from 'fs';
import { ConvertProcessor } from './convert.processor';
import { ConvertEmailProcessor } from './convert_email.processor';
import { conversionOutputPath } from './conversion-resource';
import { UpdatefileinfoService } from '../services/updatefileinfo/updatefileinfo.service';

const DOCUMENT = '11111111-1111-4111-8111-111111111111';
const UPLOAD = '22222222-2222-4222-8222-222222222222';
const ACTOR = '33333333-3333-4333-8333-333333333333';
const CASE = '44444444-4444-4444-8444-444444444444';
const SECTION = '55555555-5555-4555-8555-555555555555';
const BUNDLE = '66666666-6666-4666-8666-666666666666';
const UPLOAD_DETAIL = '77777777-7777-4777-8777-777777777777';
function fixture(kind: 'convert' | 'convert-email') {
  const config = { get: (key: string) => key === 'ASSETS' ? '/fixtures' : '' };
  const utility = { emit: jest.fn() };
  const log = { info: jest.fn(), error: jest.fn() };
  const verification = { verifyFile: jest.fn().mockResolvedValue({ isValidate: true, totalpages: 2, pagerotation: 0 }) };
  const saved = { msg: 1, nBundledetailid: DOCUMENT };
  const fileInfo = {
    updateConvertFileInfo: jest.fn().mockResolvedValue(saved), updateFileInfo: jest.fn().mockResolvedValue(saved),
    findConvertedDocument: jest.fn().mockResolvedValue(null),
    findUploadDocument: jest.fn().mockResolvedValue(DOCUMENT), replaceFIleDetail: jest.fn().mockResolvedValue({ msg: 1 }),
  };
  const convert = { downloadFileToDisk: jest.fn(), convertLog: jest.fn(), filedataProcess: jest.fn(async (item, _data, id) => { item.nNewBundledetailid = id; return true; }) };
  const copy = { copyFile: jest.fn().mockResolvedValue(true) };
  const ocr = { add: jest.fn().mockResolvedValue({}) };
  const deleted = { add: jest.fn().mockResolvedValue({}) };
  const args: any[] = [config, utility, log, verification, fileInfo, convert];
  const processor = kind === 'convert'
    ? new ConvertProcessor(...[...args, copy, ocr, deleted] as [any, any, any, any, any, any, any, any, any])
    : new ConvertEmailProcessor(...[...args, {}, copy, ocr, deleted] as [any, any, any, any, any, any, any, any, any, any]);
  const conversion = jest.spyOn(processor as any, kind === 'convert' ? 'convertToPdf' : 'convertEmail').mockResolvedValue(true);
  const original = {
    cPath: 'doc/native.docx',
    data: { identifier: 'operation', nCaseid: CASE, nUPid: UPLOAD, nMasterid: ACTOR, nSectionid: SECTION,
      nBundleid: BUNDLE, name: 'native', cFilename: 'native.docx', converttype: 'B' },
  };
  let persisted = JSON.parse(JSON.stringify(original));
  function makeJob(data: any = persisted): any {
    return { id: 'job-42', data: JSON.parse(JSON.stringify(data)), update: jest.fn(async (next) => { persisted = JSON.parse(JSON.stringify(next)); }) };
  }
  return { processor, conversion, utility, fileInfo, convert, copy, ocr, deleted, makeJob, original, persisted: () => persisted };
}
beforeEach(() => {
  jest.spyOn(fs, 'access').mockResolvedValue(undefined);
  jest.spyOn(fs, 'stat').mockResolvedValue({ size: 12 } as never);
  jest.spyOn(fs, 'rm').mockResolvedValue(undefined);
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

it('resolves the native fallback from this exact upload, checkpoints it, and retries without creating a new resource', async () => {
  const f = fixture('convert'); const first = f.makeJob(); first.data.data.nUDid = UPLOAD_DETAIL;
  f.conversion.mockResolvedValue(false);
  f.copy.copyFile.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
  await expect(f.processor.handleConvert(first)).rejects.toThrow('storage has not completed');
  expect(f.fileInfo.findUploadDocument).toHaveBeenCalledWith(UPLOAD_DETAIL, UPLOAD, CASE, ACTOR);
  expect(f.convert.filedataProcess.mock.calls[0][2]).toBe(DOCUMENT);
  expect((f.convert.filedataProcess.mock.calls[0] as any[])[6]).toBe(false);
  expect(f.persisted().documentCopy).toMatchObject({ output: 'doc/native.docx', nativeFallback: true, res: { nBundledetailid: DOCUMENT } });
  expect(fs.rm).not.toHaveBeenCalled(); expect(f.fileInfo.replaceFIleDetail).not.toHaveBeenCalled();
  await expect(f.processor.handleConvert(f.makeJob())).resolves.toBe(false);
  expect(f.conversion).toHaveBeenCalledTimes(1);
  expect(f.convert.filedataProcess).toHaveBeenCalledTimes(1);
  expect(f.copy.copyFile.mock.calls.map(args => args[3])).toEqual([DOCUMENT, DOCUMENT]);
  expect(f.fileInfo.replaceFIleDetail).toHaveBeenCalledTimes(1);
  expect(f.fileInfo.updateConvertFileInfo).not.toHaveBeenCalled();
  expect(f.utility.emit.mock.calls.filter(([n]) => ['FILE-INSERT-COMPLETE', 'CONVERTING-SUCCESS'].includes(n.event))).toHaveLength(0);
});

it('keeps the native fallback identity stable even when its first checkpoint failed', async () => {
  const f = fixture('convert'); const original = JSON.parse(JSON.stringify(f.original)); original.data.nUDid = UPLOAD_DETAIL;
  f.conversion.mockResolvedValue(false);
  const first = f.makeJob(original); first.update.mockRejectedValueOnce(new Error('redis checkpoint unavailable'));
  await expect(f.processor.handleConvert(first)).rejects.toThrow('redis checkpoint unavailable');
  expect(f.copy.copyFile).not.toHaveBeenCalled(); expect(fs.rm).not.toHaveBeenCalled();
  await expect(f.processor.handleConvert(f.makeJob(original))).resolves.toBe(false);
  expect(f.convert.filedataProcess.mock.calls.map(args => args[2])).toEqual([DOCUMENT, DOCUMENT]);
  expect(f.fileInfo.updateConvertFileInfo).not.toHaveBeenCalled();
});
afterEach(() => jest.restoreAllMocks());

describe.each(['convert', 'convert-email'] as const)('%s storage retry', kind => {
  it('rejects failed admission without success or cleanup, then resumes the same document without another insert', async () => {
    const f = fixture(kind);
    f.copy.copyFile.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    await expect(f.processor.handleConvert(f.makeJob())).rejects.toThrow('storage has not completed');
    expect(f.persisted().documentCopy.res.nBundledetailid).toBe(DOCUMENT);
    expect(fs.rm).not.toHaveBeenCalled();
    expect(f.utility.emit.mock.calls.filter(([n]) => ['FILE-INSERT-COMPLETE', 'CONVERTING-SUCCESS'].includes(n.event))).toHaveLength(0);
    await expect(f.processor.handleConvert(f.makeJob())).resolves.toBe(true);
    expect(f.conversion).toHaveBeenCalledTimes(1);
    expect(f.fileInfo.updateConvertFileInfo).toHaveBeenCalledTimes(1);
    expect(f.copy.copyFile.mock.calls.map(args => args[3])).toEqual([DOCUMENT, DOCUMENT]);
    expect(f.copy.copyFile.mock.calls.map(args => args[7])).toEqual([UPLOAD, UPLOAD]);
    expect(f.copy.copyFile.mock.calls.every(args => args[10] === true)).toBe(true);
    expect(f.persisted().documentCopy.storageComplete).toBe(true);
    expect(f.utility.emit.mock.calls.filter(([n]) => n.event === 'FILE-INSERT-COMPLETE')).toHaveLength(1);
  });

  it('recovers the newly created operation after its first Redis identity checkpoint failed', async () => {
    const f = fixture(kind);
    const first = f.makeJob();
    first.update.mockRejectedValueOnce(new Error('redis unavailable'));
    await expect(f.processor.handleConvert(first)).rejects.toThrow('redis unavailable');
    expect(f.copy.copyFile).not.toHaveBeenCalled();
    expect(fs.rm).not.toHaveBeenCalled();
    f.fileInfo.findConvertedDocument.mockResolvedValueOnce({ msg: 1, nBundledetailid: DOCUMENT, cStatus: 'V' });
    await expect(f.processor.handleConvert(f.makeJob(f.original))).resolves.toBe(true);
    expect(f.fileInfo.updateConvertFileInfo).toHaveBeenCalledTimes(1);
    expect(f.fileInfo.findConvertedDocument.mock.calls[0][0].cPath).toBe(f.fileInfo.findConvertedDocument.mock.calls[1][0].cPath);
    expect(f.copy.copyFile.mock.calls[0][3]).toBe(DOCUMENT);
  });

  it('rejects an unsuccessful metadata save without storage, cleanup or completion', async () => {
    const f = fixture(kind);
    f.fileInfo.updateConvertFileInfo.mockResolvedValueOnce({ msg: -1 });
    await expect(f.processor.handleConvert(f.makeJob())).rejects.toThrow('metadata has not completed');
    expect(f.copy.copyFile).not.toHaveBeenCalled();
    expect(fs.rm).not.toHaveBeenCalled();
    expect(f.utility.emit.mock.calls.filter(([n]) => ['FILE-INSERT-COMPLETE', 'CONVERTING-SUCCESS'].includes(n.event))).toHaveLength(0);
  });

  it('also recovers a new converted document associated with an UploadDetail before its first checkpoint', async () => {
    const f = fixture(kind); const original = JSON.parse(JSON.stringify(f.original)); original.data.nUDid = UPLOAD_DETAIL;
    const first = f.makeJob(original); first.update.mockRejectedValueOnce(new Error('redis unavailable'));
    await expect(f.processor.handleConvert(first)).rejects.toThrow('redis unavailable');
    expect(f.fileInfo.updateFileInfo).toHaveBeenCalledTimes(1);
    f.fileInfo.findConvertedDocument.mockResolvedValueOnce({ msg: 1, nBundledetailid: DOCUMENT });
    await expect(f.processor.handleConvert(f.makeJob(original))).resolves.toBe(true);
    expect(f.fileInfo.updateFileInfo).toHaveBeenCalledTimes(1);
    expect(f.copy.copyFile.mock.calls[0][3]).toBe(DOCUMENT);
  });

  it('retains the source if the storage-complete checkpoint fails, and retries with the same resolved resource', async () => {
    const f = fixture(kind);
    const first = f.makeJob();
    first.update.mockImplementationOnce(async next => { (f as any).saved = next; })
      .mockRejectedValueOnce(new Error('redis checkpoint unavailable'));
    await expect(f.processor.handleConvert(first)).rejects.toThrow('redis checkpoint unavailable');
    expect(fs.rm).not.toHaveBeenCalled();
    const resume = f.makeJob(first.data);
    await expect(f.processor.handleConvert(resume)).resolves.toBe(true);
    expect(f.conversion).toHaveBeenCalledTimes(1);
    expect(f.fileInfo.updateConvertFileInfo).toHaveBeenCalledTimes(1);
    expect(f.copy.copyFile.mock.calls.map(args => args[3])).toEqual([DOCUMENT, DOCUMENT]);
  });

  it('retries an OCR admission failure without repeating storage or metadata insertion', async () => {
    const f = fixture(kind);
    const job = f.makeJob(); job.data.data.bIsocr = true;
    f.ocr.add.mockRejectedValueOnce(new Error('ocr queue unavailable'));
    await expect(f.processor.handleConvert(job)).rejects.toThrow('ocr queue unavailable');
    expect(fs.rm).not.toHaveBeenCalled();
    await expect(f.processor.handleConvert(f.makeJob())).resolves.toBe(true);
    expect(f.copy.copyFile).toHaveBeenCalledTimes(1);
    expect(f.fileInfo.updateConvertFileInfo).toHaveBeenCalledTimes(1);
  });
});

it('scopes new converted paths to queue/job/upload identity while retaining the visible filename', () => {
  const f = fixture('convert'); const a = f.makeJob();
  const path = conversionOutputPath(a, 'convert', 'doc/case-id', 'native');
  expect(path).toMatch(/^doc\/case-id\/native_conversion_[a-f0-9]{24}\.pdf$/);
  expect(conversionOutputPath(f.makeJob(), 'convert', 'doc/case-id', 'native')).toBe(path);
  for (const other of [
    { ...a, id: 'another-job' },
    { ...a, data: { ...a.data, data: { ...a.data.data, nUPid: 'another-upload' } } },
  ]) expect(conversionOutputPath(other, 'convert', 'doc/case-id', 'native')).not.toBe(path);
  expect(conversionOutputPath(a, 'convert-email', 'doc/case-id', 'native')).not.toBe(path);
  expect(() => conversionOutputPath({ ...a, id: undefined }, 'convert', 'doc/case-id', 'native')).toThrow('identity');
});

it('requires exact current operation path, case, section, bundle and creator, and refuses ambiguous recovery', async () => {
  const db = { rowQuery: jest.fn().mockResolvedValue({ success: true, data: [{ msg: 1, nBundledetailid: DOCUMENT }] }) };
  const service = new UpdatefileinfoService(db as never);
  const body = { cPath: 'doc/case/native_conversion_jobidentity.pdf', nSectionid: SECTION, nBundleid: BUNDLE, nMasterid: ACTOR } as any;
  await expect(service.findConvertedDocument(body, CASE)).resolves.toMatchObject({ nBundledetailid: DOCUMENT });
  const [sql, args] = db.rowQuery.mock.calls[0];
  expect(args).toEqual([body.cPath, CASE, SECTION, BUNDLE, ACTOR]);
  expect(sql).toContain('d."cPath"=$1'); expect(sql).toContain('s."nCaseid"=$2');
  expect(sql).toContain('d."nSectionid"=$3'); expect(sql).toContain('d."nBundleid" IS NOT DISTINCT FROM $4');
  expect(sql).toContain('d."nCreateId"=$5');
  expect(sql).toContain('d."cStatus" IN (\'C\',\'V\')');
  db.rowQuery.mockResolvedValueOnce({ success: true, data: [] });
  await expect(service.findConvertedDocument({ ...body, cPath: 'doc/case/different_upload_job.pdf' }, CASE)).resolves.toBeNull();
  db.rowQuery.mockResolvedValueOnce({ success: true, data: [{ msg: 1 }, { msg: 1 }] });
  await expect(service.findConvertedDocument(body, CASE)).rejects.toThrow('ambiguous');
  db.rowQuery.mockResolvedValueOnce({ success: false } as any);
  await expect(service.findConvertedDocument(body, CASE)).rejects.toThrow('unavailable');
});

it('recovers a native upload only when detail, upload, case and original uploader agree', async () => {
  const db = { rowQuery: jest.fn().mockResolvedValue({ success: true, data: [{ nBundledetailid: DOCUMENT }] }) };
  const service = new UpdatefileinfoService(db as never);
  await expect(service.findUploadDocument(UPLOAD_DETAIL, UPLOAD, CASE, ACTOR)).resolves.toBe(DOCUMENT);
  const [sql, params] = db.rowQuery.mock.calls[0];
  expect(params).toEqual([UPLOAD_DETAIL, UPLOAD, CASE, ACTOR]);
  expect(sql).toContain('ud."nUDid"=$1'); expect(sql).toContain('um."nUPid"=$2');
  expect(sql).toContain('um."nCaseid"=$3'); expect(sql).toContain('s."nCaseid"=um."nCaseid"');
  expect(sql).toContain('um."nUserid"=$4');
  for (const result of [ { success: true, data: [] }, { success: true, data: [{ nBundledetailid: DOCUMENT }, { nBundledetailid: DOCUMENT }] }, { success: false } ]) {
    db.rowQuery.mockResolvedValueOnce(result as any);
    await expect(service.findUploadDocument(UPLOAD_DETAIL, UPLOAD, CASE, ACTOR)).rejects.toThrow('identity is unavailable');
  }
});
