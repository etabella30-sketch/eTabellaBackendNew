import { sourceHearingTimecode } from '@app/api-contracts';
import { hearingTimecode } from '@app/api-contracts';
import {
  completeLiveQfacts, LIVE_QFACT_COMPLETION_FIND_SQL, LIVE_QFACT_COMPLETION_SESSION_SQL, LIVE_QFACT_COMPLETION_UPDATE_SQL,
} from './live-qfact-completion';

const SES = '44444444-4444-4444-8444-444444444444', RUN = '55555555-5555-4555-8555-555555555555';
const ME = '11111111-1111-4111-8111-111111111111', QF = '66666666-6666-4666-8666-000000000001';
const TIME = '10:00:00:00';

/** One live line on page 1 line 1, its stored capture holding `stored`, the feed now holding `now`. */
function fixture({ stored = 'assumptions', now = 'assumptions on depending on, you know', identity = '1', session = 'R', pristine = true } = {}) {
  const tuple = [TIME, [...now].map(c => c.charCodeAt(0)), 0, undefined, 1, 1, identity, null, null, null, sourceHearingTimecode(TIME)];
  const feed = { getPage: jest.fn(async (_s: string, page: number) => (page === 1 ? [tuple] : [])) };
  const coordinate = {
    identity: '1', p: 1, l: 1, oP: 1, oL: 1, text: stored, otext: stored, t: TIME, capture: 'live-instant', run: RUN, order: 1,
    hearing: hearingTimecode(sourceHearingTimecode(TIME)),
  };
  const updates: unknown[][] = [];
  const db = {
    saveAtomically: jest.fn(async (run: () => Promise<unknown>) => run()),
    rowQuery: jest.fn(async (sql: string, params: unknown[]) => {
      if (sql === LIVE_QFACT_COMPLETION_SESSION_SQL) return { success: true, data: [{ nSesid: SES, cStatus: session, nLines: 25, nEntryEventid: RUN }] };
      if (sql === LIVE_QFACT_COMPLETION_FIND_SQL) return { success: true, data: pristine ? [{ nFSid: QF, nUserid: ME, jCordinates: [coordinate] }] : [] };
      if (sql === LIVE_QFACT_COMPLETION_UPDATE_SQL) { updates.push(params); return { success: true, data: [] }; }
      return { success: true, data: [] };
    }),
  };
  return { db, feed, updates, run: () => completeLiveQfacts(db as any, feed as any, SES, 1) };
}

describe('live QFACT completion (RT QA 2026-10-29, F-30)', () => {
  it('grows a capture to the rest of its line and names the owner', async () => {
    const f = fixture();
    expect(await f.run()).toEqual([ME]);
    expect(f.updates).toHaveLength(1);
    expect(JSON.parse(f.updates[0][1] as string)).toEqual(['assumptions on depending on, you know']);
    expect(JSON.parse(f.updates[0][2] as string)[0].text).toBe('assumptions on depending on, you know');
  });
  it('leaves a corrected line alone (the new text does not start with the stored one)', async () => {
    const f = fixture({ now: 'presumptions on depending on' });
    expect(await f.run()).toEqual([]);
    expect(f.updates).toHaveLength(0);
  });
  it('leaves a line whose identity changed alone', async () => {
    const f = fixture({ identity: '99' });
    expect(await f.run()).toEqual([]);
  });
  it('writes nothing when the line has not grown', async () => {
    const f = fixture({ now: 'assumptions' });
    expect(await f.run()).toEqual([]);
    expect(f.updates).toHaveLength(0);
  });
  it('does nothing once the session is no longer live', async () => {
    const f = fixture({ session: 'P' });
    expect(await f.run()).toEqual([]);
    expect(f.db.rowQuery).toHaveBeenCalledTimes(1);
  });
  it('only reads pristine captures (an edited QFACT is not found)', async () => {
    const f = fixture({ pristine: false });
    expect(await f.run()).toEqual([]);
    expect(String(LIVE_QFACT_COMPLETION_FIND_SQL)).toContain('"bLiveCapturePristine"');
  });
  it('updates inside the capture bypass so the QFACT stays pristine', async () => {
    const f = fixture();
    await f.run();
    const sqls = f.db.rowQuery.mock.calls.map(c => c[0]);
    const on = sqls.indexOf("SELECT set_config('etabella.live_qfact_write','on',true)");
    const upd = sqls.indexOf(LIVE_QFACT_COMPLETION_UPDATE_SQL);
    const off = sqls.indexOf("SELECT set_config('etabella.live_qfact_write','off',true)");
    expect(on).toBeGreaterThan(-1);
    expect(upd).toBeGreaterThan(on);
    expect(off).toBeGreaterThan(upd);
  });
});
