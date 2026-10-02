import { SessionService, SESSION_VENUE_FIELDS_SQL } from './session.service';

/*
 * Spec §9 RT Production lane: GET session/getSessionsByCaseId (et_realtime_combo_sessionlist) carries the venue-edge
 * columns RT Production reads (rtpVenueFieldsFromRow: cFeedSource, nEdgeid, nPartNo, nPrevPartSesid) for venue and
 * split sessions, only while the venue edge is on. Every other row, and the whole answer with the edge off, is
 * today's.
 */

const VENUE = '5e550000-0000-4000-8000-0000000000e1';
const PART2 = '5e550000-0000-4000-8000-0000000000e2';
const DIRECT = '5e550000-0000-4000-8000-0000000000d1';
const BOX = 'b0c5b0c5-0000-4000-8000-0000000000b1';

const listRows = () => [
  { nSesid: VENUE, dStartDt: '2026-10-05 10:00:00', cName: 'Day 3', cStatus: 'R', isTranscript: false, isUploaded: false, cProtocol: 'B' },
  { nSesid: PART2, dStartDt: '2026-10-05 11:00:00', cName: 'Day 3 (Part 2)', cStatus: 'R', isTranscript: false, isUploaded: false, cProtocol: 'B' },
  { nSesid: DIRECT, dStartDt: '2026-10-04 10:00:00', cName: 'Day 2', cStatus: 'C', isTranscript: true, isUploaded: true, cProtocol: 'C' },
];

function build(env: Record<string, string | undefined>, venueRead: any = {
  success: true,
  data: [
    { nSesid: VENUE, cFeedSource: 'E', nEdgeid: BOX, nPartNo: 1, nPrevPartSesid: null, cSyncState: 'S' },
    { nSesid: PART2, cFeedSource: 'D', nEdgeid: null, nPartNo: 2, nPrevPartSesid: VENUE, cSyncState: null },
  ],
}) {
  const db = {
    executeRef: jest.fn(async (name: string) => {
      if (name !== 'realtime_combo_sessionlist') throw new Error(`unexpected SP ${name}`);
      return { success: true, data: [listRows()] };
    }),
    rowQuery: jest.fn(async (sql: string) => {
      if (sql !== SESSION_VENUE_FIELDS_SQL) throw new Error(`unexpected query ${sql}`);
      return venueRead;
    }),
  };
  const config = { get: (key: string) => env[key] };
  const svc: SessionService = new (SessionService as any)(db, {}, {}, {}, {}, {}, {}, config, {}, {}, {}, {});
  return { svc, db };
}

describe('SessionService.getSessionByCaseId venue fields (RT Production lane)', () => {
  it("edge off (today's production): the SP's rows exactly, no extra read", async () => {
    const { svc, db } = build({});
    await expect(svc.getSessionByCaseId({ nCaseid: 'c', nUserid: 'u' } as any)).resolves.toEqual(listRows());
    expect(db.rowQuery).not.toHaveBeenCalled();
  });

  it('edge on: one read; venue and split rows gain their non-null columns, a direct row is unchanged', async () => {
    const { svc, db } = build({ EDGE_ENABLED: '1' });
    const rows = await svc.getSessionByCaseId({ nCaseid: 'c', nUserid: 'u' } as any);
    expect(db.rowQuery).toHaveBeenCalledTimes(1);
    expect(db.rowQuery).toHaveBeenCalledWith(SESSION_VENUE_FIELDS_SQL, [[VENUE, PART2, DIRECT]]);
    expect(rows[0]).toEqual({ ...listRows()[0], cFeedSource: 'E', nEdgeid: BOX, nPartNo: 1, cSyncState: 'S' });
    expect(rows[1]).toEqual({ ...listRows()[1], cFeedSource: 'D', nPartNo: 2, nPrevPartSesid: VENUE });
    expect(rows[2]).toEqual(listRows()[2]);
  });

  it('edge on but the read fails (migration not applied): the SP rows untouched', async () => {
    const { svc } = build({ EDGE_ENABLED: 'true' }, { success: false, error: 'column "cFeedSource" does not exist' });
    await expect(svc.getSessionByCaseId({ nCaseid: 'c' } as any)).resolves.toEqual(listRows());
  });
});
