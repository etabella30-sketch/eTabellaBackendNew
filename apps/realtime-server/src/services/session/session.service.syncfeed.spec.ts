import * as fs from 'fs';
import * as path from 'path';
import { SessionService } from './session.service';

const SES = '000b14bd-7494-4908-9eab-a2fe0defb666';

describe('SessionService.syncFeedData path inputs', () => {
  const syncFeedData = (body: any) => SessionService.prototype.syncFeedData.call({}, body);
  let mkdir: jest.SpyInstance;
  let writeFile: jest.SpyInstance;

  beforeEach(() => {
    mkdir = jest.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined);
    writeFile = jest.spyOn(fs.promises, 'writeFile').mockResolvedValue(undefined);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it('refuses a non-UUID session id without creating anything', async () => {
    await expect(syncFeedData({ nSesid: '../../x', jData: [['page1.json', []]] })).resolves.toEqual({ msg: -1, value: 'Invalid session id' });
    expect(mkdir).not.toHaveBeenCalled();
    expect(writeFile).not.toHaveBeenCalled();
  });

  it('writes only plain *.json names inside data/dt_<nSesid>', async () => {
    const res = await syncFeedData({
      nSesid: SES,
      jData: [['page1.json', [1]], ['../../evil.json', [2]], ['sub/page2.json', [3]], ['notes.txt', [4]]],
    });
    expect(res).toEqual({ msg: 1, value: 'Success' });
    expect(writeFile).toHaveBeenCalledTimes(1);
    expect(writeFile.mock.calls[0][0]).toBe(path.join(`data/dt_${SES}`, 'page1.json'));
  });
});
