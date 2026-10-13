jest.mock('fs', () => {
  const actual = jest.requireActual('fs');
  return { ...actual, existsSync: jest.fn(), mkdirSync: jest.fn(), copyFileSync: jest.fn(), unlinkSync: jest.fn(), promises: { ...actual.promises, stat: jest.fn(), mkdir: jest.fn(), copyFile: jest.fn(), unlink: jest.fn() } };
});
import { promises as fs, existsSync } from 'fs';
import { resolve } from 'path';
import { EmailService } from './email.service';

const DOCUMENT = '11111111-1111-4111-8111-111111111111';
function fixture() {
  const copy = { copyFile: jest.fn().mockResolvedValue(true) };
  const service: EmailService = Object.assign(Object.create(EmailService.prototype), {
    filecopyService: copy, ASSETS_PATH: '/fixtures/',
    fileDeleteQueue: { add: jest.fn() },
    fileInfo: { updateConvertFileInfo: jest.fn().mockResolvedValue({ msg: 1, nBundledetailid: DOCUMENT }) },
    fileVerificationService: { verifyFile: jest.fn().mockResolvedValue({ isValidate: true, totalpages: 1 }) },
    getFilesFromDirectory: jest.fn().mockResolvedValue([{ fileName: 'attachment.pdf', cPath: '/source/attachment.pdf' }]),
  });
  return { service, copy };
}
beforeEach(() => {
  jest.clearAllMocks();
  (fs.stat as jest.Mock).mockResolvedValue({ size: 20 });
  (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
  (fs.copyFile as jest.Mock).mockResolvedValue(undefined);
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => jest.restoreAllMocks());

it.each([false, undefined, { msg: 1 }])('rejects a copy that did not succeed (%p)', async (result) => {
  const f = fixture(); f.copy.copyFile.mockResolvedValue(result);
  await expect(f.service.queueFileForProcessing('doc/attachment.pdf', DOCUMENT)).rejects.toThrow('File storage copy failed');
  expect(fs.unlink).not.toHaveBeenCalled();
});

it('propagates rejected storage through all attachment catches and Promise.allSettled', async () => {
  const f = fixture(); f.copy.copyFile.mockRejectedValue(new Error('queue unavailable'));
  await expect(f.service.processAttachments('/source', { dirPath: 'doc/case', nMasterid: 'owner' })).rejects.toThrow('queue unavailable');
  expect(fs.unlink).not.toHaveBeenCalled();
});

it('propagates unsuccessful storage through the legacy attachment path', async () => {
  const f = fixture(); f.copy.copyFile.mockResolvedValue(false);
  await expect(f.service.processAttachments_old('/source', { nMasterid: 'owner' })).rejects.toThrow('File storage copy failed');
  expect(fs.unlink).not.toHaveBeenCalled();
});

it('still completes attachments when storage succeeds', async () => {
  const f = fixture();
  await expect(f.service.processAttachments('/source', { dirPath: 'doc/case', nMasterid: 'owner' })).resolves.toBe(true);
});

it.each([
  ['/fixtures/doc/mail_conversion_jobhash.pdf', '/fixtures/doc/mail_conversion_jobhash.pdf'],
  [undefined, resolve('/fixtures/', 'doc/mail.pdf')],
])('writes converted email to the requested output (%p), preserving the legacy fallback', async (requested, expected) => {
  const f = fixture(); (existsSync as jest.Mock).mockReturnValue(true);
  const createPdfFromHtml = jest.spyOn(f.service, 'createPdfFromHtml').mockResolvedValue(true);
  Object.assign(f.service, {
    config: { get: (key: string) => key === 'TMP_PATH' ? '/temp' : '/fixtures/' },
    readData: jest.fn().mockResolvedValue(true), uploadFolderToS3: jest.fn().mockResolvedValue(true),
    deleteFolder: jest.fn().mockResolvedValue(undefined),
    fileInfo: { converStatus: jest.fn() },
  });
  await expect(f.service.getemailparse({ cPath: 'doc/mail.msg', cOutputpath: requested, nId: DOCUMENT, dirPath: 'doc/case' } as never, 'C')).resolves.toBe(true);
  expect(createPdfFromHtml).toHaveBeenCalledWith(expect.stringMatching(/mail\.html$/), expected);
});
