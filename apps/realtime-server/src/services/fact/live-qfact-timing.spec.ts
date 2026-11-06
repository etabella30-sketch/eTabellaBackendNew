import { CaptureTiming } from './live-qfact-timing';

describe('CaptureTiming (Server-Timing on instant QFACT captures, 2026-11-04)', () => {
  it('times each database call and feed page through the same services, and names the slowest', async () => {
    const timing = new CaptureTiming();
    const db: any = { pool: 'kept', rowQuery: jest.fn(async () => ({ success: true, data: [1] })), executeRef: jest.fn(async () => ({ success: true })) };
    const feed: any = { getPage: jest.fn(async () => [['10:00']]) };
    const tdb: any = timing.db(db), tfeed: any = timing.feed(feed);
    expect(tdb.pool).toBe('kept');
    expect(await tdb.rowQuery('SELECT "x"\n  FROM "FactMaster" WHERE 1=$1', [1])).toEqual({ success: true, data: [1] });
    await tdb.executeRef('fact_insert', { a: 1 }, 'realtime');
    expect(await tfeed.getPage('s', 3)).toEqual([['10:00']]);
    expect(db.rowQuery).toHaveBeenCalledWith('SELECT "x"\n  FROM "FactMaster" WHERE 1=$1', [1]);
    expect(db.executeRef).toHaveBeenCalledWith('fact_insert', { a: 1 }, 'realtime');
    timing.phase('work');
    const header = timing.header();
    expect(header).toMatch(/^work;dur=[\d.]+, db;dur=[\d.]+;desc="2 calls", feed;dur=[\d.]+;desc="1 pages", slow1;dur=[\d.]+;desc="[^"]+", slow2;.*slow3;.*, total;dur=[\d.]+$/);
    expect(header).toContain('desc="SELECT x FROM FactMaster WHERE 1=$1"');
    expect(header).toContain('desc="sp fact_insert"');
  });

  it('counts a failed call and never throws when sending', async () => {
    const timing = new CaptureTiming();
    const tdb: any = timing.db({ rowQuery: async () => { throw new Error('down'); } } as any);
    await expect(tdb.rowQuery('SELECT 1')).rejects.toThrow('down');
    expect(timing.header()).toContain('db;dur=');
    expect(timing.header()).toContain('desc="1 calls"');
    const setHeader = jest.fn(() => { throw new Error('closed'); });
    expect(() => timing.send({ headersSent: false, setHeader } as any)).not.toThrow();
    expect(() => timing.send(undefined)).not.toThrow();
  });
});
