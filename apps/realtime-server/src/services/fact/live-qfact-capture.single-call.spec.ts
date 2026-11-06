/**
 * LIVE_QFACT_SINGLE_CALL=1 (2026-11-04: each database call costs ~64 ms on etabella.net; a mark made 12-19). Every
 * capture spec in live-qfact-capture.spec.ts runs again here through the one-call path and must give the same results;
 * then what is particular to that path: three calls, a stale read read again, an ended session, the timing.
 */
process.env.LIVE_QFACT_SINGLE_CALL = '1';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { stepByStep } = require('./live-qfact-capture.spec') as { stepByStep: Map<string, number> };

import { ConflictException } from '@nestjs/common';
import { sourceHearingTimecode } from '@app/api-contracts';
import { assertCanCreateFact } from './fact-create-gate';
import { captureLiveQfact, LIVE_QFACT_FIND_SQL, LIVE_QFACT_SESSION_SQL } from './live-qfact-capture';
import { LIVE_QFACT_APPLY_SQL, LIVE_QFACT_SNAPSHOT_SQL } from './live-qfact-single-call';
import { CaptureTiming } from './live-qfact-timing';

afterAll(() => {
  delete process.env.LIVE_QFACT_SINGLE_CALL;
  // The captures above went through the one-call path: only a retried request (its receipt) goes step by step.
  expect([...stepByStep.keys()]).toEqual(['ordinary QFACT instant persistence retries are idempotent even after the captured line has been removed']);
});

describe('the one-call capture path', () => {
  beforeEach(() => jest.mocked(assertCanCreateFact).mockResolvedValue(undefined));
  const ME = '11111111-1111-4111-8111-111111111111';
  const user = { userId: ME, isAdmin: false };
  /** A live session whose rowQuery answers the one-call read and write directly (no step-by-step query may run). */
  const live = (answers: unknown[]) => {
    const times = ['10:00:00:00', '10:00:05:00', '10:00:10:00'];
    const tuples = times.map((time, i) => [time, [...`line ${i + 1}`].map(c => c.charCodeAt(0)), i, undefined, 1, i + 1, String(i + 1), null, null, null, sourceHearingTimecode(time)]);
    const record = { nSesid: '44444444-4444-4444-8444-444444444444', cStatus: 'R', nLines: 25, nEntryEventid: '55555555-5555-4555-8555-555555555555' };
    const empty = { owners: { '1': [], '2': [] }, receipt: null, legacy: [], unassigned: '88888888-8888-4888-8888-888888888888' };
    const queue = [...answers];
    const db: any = {
      saveAtomically: jest.fn(async (run: () => unknown) => run()),
      executeRef: jest.fn(),
      rowQuery: jest.fn(async (sql: string) => {
        if (sql === LIVE_QFACT_SESSION_SQL) return { success: true, data: [record] };
        if (sql === LIVE_QFACT_SNAPSHOT_SQL) return { success: true, data: [empty] };
        if (sql === LIVE_QFACT_APPLY_SQL) return { success: true, data: [{ answer: queue.shift() }] };
        if (sql === LIVE_QFACT_FIND_SQL) throw new Error('a step-by-step query ran');
        return { success: true, data: [] };
      }),
    };
    const feed = { getPage: jest.fn(async (_s: string, page: number) => page === 1 ? tuples : []) };
    const request = { nCaseid: '33333333-3333-4333-8333-333333333333', nSesid: record.nSesid, cRun: record.nEntryEventid, identity: '1', page: 1, line: 1,
      action: 'mark', nRequestid: '77777777-7777-4777-8777-000000000001' };
    return { db, feed, request, sqls: () => db.rowQuery.mock.calls.map(([sql]: [string]) => sql) };
  };
  const ok = { status: 'ok', result: { msg: 1, nFSid: 'F1', groups: [], removedIds: [] } };

  it('reads once and writes once; a new QFACT is created inside the write, with the ids the database gives', async () => {
    const f = live([ok]);
    await expect(captureLiveQfact(f.db, f.feed as any, f.request as any, user as any)).resolves.toEqual(ok.result);
    expect(f.sqls().filter((sql: string) => sql === LIVE_QFACT_SNAPSHOT_SQL)).toHaveLength(1);
    expect(f.sqls().filter((sql: string) => sql === LIVE_QFACT_APPLY_SQL)).toHaveLength(1);
    expect(f.db.executeRef).not.toHaveBeenCalled();
    expect(f.db.saveAtomically).not.toHaveBeenCalled();
    const payload = JSON.parse(f.db.rowQuery.mock.calls.find(([sql]: [string]) => sql === LIVE_QFACT_APPLY_SQL)[1][0]);
    expect(payload.identities).toEqual(['1', '2']);   // the clicked line and the line below (no line above line 1)
    expect(payload.ops.map((op: any) => op.op)).toEqual(['create', 'update']);
    // fact_insert gets what executeRef gave it: JSON fields as text.
    expect(typeof payload.ops[0].body.jCordinates).toBe('string');
    expect(payload.ops[1].id).toBe(payload.ops[0].ref);
  });

  it('a read made stale by another write is read again', async () => {
    const f = live([{ status: 'stale' }, ok]);
    await expect(captureLiveQfact(f.db, f.feed as any, f.request as any, user as any)).resolves.toEqual(ok.result);
    expect(f.sqls().filter((sql: string) => sql === LIVE_QFACT_SNAPSHOT_SQL)).toHaveLength(2);
    expect(f.sqls().filter((sql: string) => sql === LIVE_QFACT_APPLY_SQL)).toHaveLength(2);
  });

  it('a session that ended between the read and the write refuses the capture', async () => {
    const f = live([{ status: 'gone' }]);
    await expect(captureLiveQfact(f.db, f.feed as any, f.request as any, user as any)).rejects.toBeInstanceOf(ConflictException);
  });

  it('times the checks, the read and the write', async () => {
    const f = live([ok]);
    const timing = new CaptureTiming();
    await captureLiveQfact(f.db, f.feed as any, f.request as any, user as any, Date.now(), timing);
    expect(timing.header().split(', ').slice(0, 3).map(entry => entry.split(';')[0])).toEqual(['checks', 'read', 'apply']);
  });
});
