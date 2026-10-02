import * as fs from 'fs';

import { StreamDataService } from './stream-data.service';

/**
 * Characterization of the disk snapshot a viewer gets for a session that is no longer in memory
 * (RT edge plan R-T2 / D14, preserved behaviour (3)). realtime-server's `fetch-data` falls back to
 * `streamData('data', ...)` when data/dt_<nSesid> exists and the live store has nothing.
 *
 * This path is shared with the legacy `apps/realtime` lane and stays untouched (D11); D12 makes the
 * live memory path match its newest-first order, so the order is pinned here as preserved.
 * The directory listing and file reads are stubbed: nothing touches the disk.
 */

const SES = '33333333-3333-4333-8333-333333333333';

function makeService() {
  const emitted: Array<{ room: string; event: string; payload: any }> = [];
  const server = { to: (room: string) => ({ emit: (event: string, payload: any) => emitted.push({ room, event, payload }) }) };
  const service = new StreamDataService({ server } as any, {} as any);
  (service as any).logger = { verbose: jest.fn(), error: jest.fn(), log: jest.fn(), warn: jest.fn() };
  return { service, emitted };
}

/** Page files as the live flusher / session end write them. */
const files: Record<string, string> = {
  'page_1.json': JSON.stringify([['10:00:00:00', [65], 0, 'FL', 1, 1, 1, [], 0]], null, 2),
  'page_2.json': JSON.stringify([['10:00:25:00', [66], 25, 'FL', 2, 1, 26, [], 0]], null, 2),
  'page_10.json': JSON.stringify([['10:03:45:00', [67], 225, 'FL', 10, 1, 226, [], 0]], null, 2),
};

let readdir: jest.SpyInstance;
let readFile: jest.SpyInstance;

beforeEach(() => {
  readdir = jest.spyOn(fs.promises, 'readdir').mockResolvedValue(['page_1.json', 'page_10.json', 'page_2.json'] as any);
  readFile = jest.spyOn(fs.promises, 'readFile').mockImplementation(async (p: any) => {
    const name = String(p).split(/[\\/]/).pop()!;
    if (!(name in files)) throw new Error(`ENOENT ${name}`);
    return files[name] as any;
  });
});
afterEach(() => jest.restoreAllMocks());

describe('StreamDataService.streamData disk snapshot (characterization)', () => {
  it('reads data/dt_<nSesid> and sends every page to the asking socket, highest page number first', async () => {
    const { service, emitted } = makeService();
    const done = jest.fn();
    await service.streamData('data', 'sock-1', { nSesid: SES, tab: 3 }, done, [], []);

    expect(readdir).toHaveBeenCalledWith(`data/dt_${SES}`);
    expect(emitted.map(e => [e.room, e.event, e.payload.page])).toEqual([
      ['sock-1', 'previous-data', 10],
      ['sock-1', 'previous-data', 2],
      ['sock-1', 'previous-data', 1],
    ]);
    expect(done).toHaveBeenCalledWith({ msg: 1 });
  });

  it('sends each page file\'s text as it is, with the file count, the fetch tab and that page\'s facts and marks', async () => {
    const facts = [{ nIDid: 'f2', pageIndex: '2' }, { nIDid: 'f5', pageIndex: 5 }];
    const marks = [{ nHid: 'h10', cPageno: 10 }, { nHid: 'h2', cPageno: '2' }];
    const { service, emitted } = makeService();
    await service.streamData('data', 'sock-1', { nSesid: SES, tab: 3 }, jest.fn(), facts, marks);

    expect(emitted.map(e => e.payload)).toEqual([
      { msg: 1, page: 10, data: files['page_10.json'], totalPages: 3, nSesid: SES, a: [], h: [marks[0]], tab: 3 },
      { msg: 1, page: 2, data: files['page_2.json'], totalPages: 3, nSesid: SES, a: [facts[0]], h: [marks[1]], tab: 3 },
      { msg: 1, page: 1, data: files['page_1.json'], totalPages: 3, nSesid: SES, a: [], h: [], tab: 3 },
    ]);
    expect(Object.keys(emitted[0].payload)).toEqual(['msg', 'page', 'data', 'totalPages', 'nSesid', 'a', 'h', 'tab']);
  });

  it('skips a page it cannot read or that is empty; totalPages still counts the listed files', async () => {
    readdir.mockResolvedValue(['page_1.json', 'page_2.json', 'page_3.json', 'page_4.json'] as any);
    const withEmpty = { ...files, 'page_4.json': '' };
    readFile.mockImplementation(async (p: any) => {
      const name = String(p).split(/[\\/]/).pop()!;
      if (!(name in withEmpty)) throw new Error(`ENOENT ${name}`);
      return (withEmpty as Record<string, string>)[name] as any;
    });
    const { service, emitted } = makeService();
    const done = jest.fn();
    await service.streamData('data', 'sock-1', { nSesid: SES, tab: 1 }, done, [], []);

    expect(emitted.map(e => [e.payload.page, e.payload.totalPages])).toEqual([[2, 4], [1, 4]]);
    expect(done).toHaveBeenCalledWith({ msg: 1 });
  });

  it('a session folder that cannot be listed sends nothing and reports msg -1', async () => {
    readdir.mockRejectedValue(new Error('ENOENT'));
    const { service, emitted } = makeService();
    const done = jest.fn();
    await service.streamData('data', 'sock-1', { nSesid: SES, tab: 1 }, done, [], []);

    expect(emitted).toEqual([]);
    expect(done).toHaveBeenCalledWith({ msg: -1 });
  });
});
