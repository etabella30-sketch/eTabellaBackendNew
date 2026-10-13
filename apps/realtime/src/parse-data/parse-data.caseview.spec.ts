import { ParseDataService } from './parse-data.service';
import { createSessionContext } from '@app/feed-parse/session-context';

describe('legacy CaseView ingest hearing metadata', () => {
  it('uses the same split-marker clock and stable identities as the venue parser', async () => {
    const service = new ParseDataService({
      fileLog: jest.fn(), saveData: jest.fn(), stripPageFrames: (_job, text) => text,
      getSessionTM: () => '02:55:00',
    } as any, { currentSessionDetail: { cTimezone: 'UTC' } } as any, {} as any, {} as any, {} as any);
    jest.spyOn(service,'addToLocalFile').mockResolvedValue(undefined);
    jest.spyOn(service,'sendToUsers').mockResolvedValue(undefined);
    const job = createSessionContext({ nSesid:'legacy-clock-test', protocol:'C', sink:{} as any }).job;
    const feed = (bytes: Buffer) => service.parseDataQueue(bytes,'legacy-clock-test',job as any,{});
    await feed(Buffer.concat([Buffer.from([0xf9]),Buffer.from('38')]));
    await feed(Buffer.concat([Buffer.from('43'),Buffer.from([0xfa]),Buffer.from('Mr Fayez')]));
    const first = job.lineBuffer.find(row=>row[1]?.length);
    const id = first[6];
    await feed(Buffer.concat([Buffer.from(' finished.'),Buffer.from([0xf9]),Buffer.from('3A43'),Buffer.from([0xfa]),Buffer.from('Next.')]));
    const rows = job.lineBuffer.filter(row=>row[1]?.length);
    expect(rows.map(row=>String.fromCharCode(...row[1]))).toEqual(['Mr Fayez finished.','Next.']);
    expect(rows[0][6]).toBe(id);
    expect(new Set(rows.map(row=>row[6])).size).toBe(2);
    expect(rows.map(row=>row[10])).toEqual([
      {source:'hearing-timecode',frames:((8*60+25)*60+48)*30},
      {source:'hearing-timecode',frames:((8*60+25)*60+52)*30},
    ]);
    expect(rows.map(row=>row[0])).toEqual(['02:55:00','02:55:00']);
  });
});
