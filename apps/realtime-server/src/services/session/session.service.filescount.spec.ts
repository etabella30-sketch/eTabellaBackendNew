import * as fs from 'fs';
import { SessionService } from './session.service';

const SES = '359625be-102d-4908-836b-a95df19074f0';

describe('SessionService.getFilesCount (draft page folder)', () => {
  const getFilesCount = (nSesid: string) => SessionService.prototype.getFilesCount.call({}, nSesid, false);
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it('a live session with no lines yet (no folder) counts 0 pages without logging an error', async () => {
    jest.spyOn(fs.promises, 'readdir').mockRejectedValue(Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' }));
    await expect(getFilesCount(SES)).resolves.toEqual({ pageRes: null, maxNumber: 0 });
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('an empty page folder counts 0 pages and never opens page_0.json', async () => {
    jest.spyOn(fs.promises, 'readdir').mockResolvedValue([] as any);
    const readFile = jest.spyOn(fs.promises, 'readFile');
    await expect(getFilesCount(SES)).resolves.toEqual({ pageRes: null, maxNumber: 0 });
    expect(readFile).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('still logs a real read failure', async () => {
    jest.spyOn(fs.promises, 'readdir').mockRejectedValue(Object.assign(new Error('EACCES: permission denied'), { code: 'EACCES' }));
    await expect(getFilesCount(SES)).resolves.toEqual({ pageRes: null, maxNumber: 0 });
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('EACCES'));
  });
});
