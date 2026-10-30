import * as fs from 'node:fs/promises';
import { QueryBuilderService } from '@app/global/db/pg/query-builder.service';
import { MarkNavNeedsReviewController, publishedLine } from './needs-review.controller';

jest.mock('node:fs/promises', () => ({ readFile: jest.fn() }));

const ME = '043c3b64-0e14-494d-af52-eeff4cc407f5';
const CASE = 'f54bdcb9-05cb-41b1-a8ce-cb4b32e6fe6a';
const SES = 'cab684ae-5f07-494c-863b-a1fefce80676';
/** Day - 03 page 1 as the publish stores it (s_<nSesid>.json): lineIndex is the line's place in the day. */
const PAGES = [{ msg: 1, page: 1, data: [
  { time: '09:20:46', lineIndex: 1, lines: ['   (10.29 am)'] },
  { time: '09:20:51', lineIndex: 2, lines: ['             MR DANIEL THOMAS THORPE (continued)'] },
  { time: '10:29:35', lineIndex: 3, lines: ['    PRESIDENT:  Good morning everyone.  This is day 3 of the'] },
] }];

function mount(rows: unknown[][] = [[{ msg: 1, value: 'Placed', nPlaced: 1 }]]) {
  const db = { executeRef: jest.fn().mockResolvedValue({ success: true, data: rows }) };
  const config = { get: jest.fn(() => '/data/rt/') };
  return { c: new MarkNavNeedsReviewController(db as any, config as any), db };
}

describe('Needs Review: Marks the publish could not place (2026-10-30)', () => {
  beforeEach(() => (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(PAGES)));

  it('lists only the caller\'s own unplaced Marks, whatever user the request names', async () => {
    const { c, db } = mount([[{ id: 'm1', kind: 'QF', reason: 'no-time' }]]);
    const res = await c.list({ userId: ME } as any, { nCaseid: CASE, nSesid: SES, nMasterid: 'someone-else' });
    expect(res).toEqual([{ id: 'm1', kind: 'QF', reason: 'no-time' }]);
    expect(db.executeRef).toHaveBeenCalledWith('marknav_needs_review', { nCaseid: CASE, nSesid: SES, nMasterid: ME }, 'realtime');
  });

  it('places a Mark on the published line with that line\'s own text, time and identity', async () => {
    const { c, db } = mount();
    const res = await c.place({ userId: ME } as any, { nCaseid: CASE, nSesid: SES, nMasterid: 'x', id: 'f73b9e56-0000-4000-8000-000000000001', kind: 'D', nPage: 1, nLine: 3 });
    expect(res).toEqual({ msg: 1, value: 'Placed', nPlaced: 1 });
    expect(fs.readFile).toHaveBeenCalledWith(`/data/rt/s_${SES}.json`, 'utf8');
    const [fn, params, schema] = db.executeRef.mock.calls[0];
    expect([fn, schema, params.nMasterid, params.kind, params.nTPage, params.nTLine, params.cTTime, params.tidentity])
      .toEqual(['marknav_place_mark', 'realtime', ME, 'D', 1, 3, '10:29:35', '3']);
    expect(params.jT).toEqual([{ t: '10:29:35', p: 1, l: 3, text: 'PRESIDENT: Good morning everyone. This is day 3 of the',
      identity: '3', x: 0, y: 0, width: 0, height: 21.5, match: 'manual' }]);
  });

  it('refuses a line that is not in the published transcript, or a session not yet published', async () => {
    const { c, db } = mount();
    expect(await c.place({ userId: ME } as any, { nCaseid: CASE, nSesid: SES, id: 'a', kind: 'QF', nPage: 9, nLine: 1 }))
      .toEqual({ msg: -1, value: 'That line is not in the published transcript' });
    (fs.readFile as jest.Mock).mockRejectedValueOnce(new Error('ENOENT'));
    expect(await c.place({ userId: ME } as any, { nCaseid: CASE, nSesid: SES, id: 'a', kind: 'QF', nPage: 1, nLine: 1 }))
      .toEqual({ msg: -1, value: 'The published transcript is not available' });
    expect(db.executeRef).not.toHaveBeenCalled();
  });

  it('calls realtime.et_marknav_* through the real query builder (it adds the et_ prefix itself)', async () => {
    // 2026-10-30: the first deploy passed 'et_marknav_needs_review' and the SQL named et_et_marknav_…
    const sql: string[] = [];
    const builder = new QueryBuilderService();
    const db = { executeRef: jest.fn(async (fn: string, params: any, schema: any) => {
      sql.push(builder.buildQuery({ ...params }, fn, 1, schema)); return { success: true, data: [[{ msg: 1 }]] }; }) };
    const c = new MarkNavNeedsReviewController(db as any, { get: () => '/data/rt/' } as any);
    await c.list({ userId: ME } as any, { nCaseid: CASE, nSesid: SES });
    await c.place({ userId: ME } as any, { nCaseid: CASE, nSesid: SES, id: 'f73b9e56-0000-4000-8000-000000000001', kind: 'D', nPage: 1, nLine: 3 });
    expect(sql[0]).toContain('select * from realtime.et_marknav_needs_review (');
    expect(sql[1]).toContain('select * from realtime.et_marknav_place_mark (');
  });

  it('reads the frame-stamped time as hh:mm:ss and a page wrapper with data', () => {
    expect(publishedLine({ data: [{ page: 6, data: [{ time: '10:06:20:21', lineIndex: 14, lines: ['for you'] }] }] }, 6, 1))
      .toEqual({ t: '10:06:20', text: 'for you', identity: '14' });
  });
});
