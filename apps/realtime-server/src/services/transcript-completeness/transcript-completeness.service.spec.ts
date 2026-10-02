import { Logger } from '@nestjs/common';
import {
  CompletenessPartRow,
  CompletenessRow,
  PARTS_STATUS_SQL,
  PRE_MIGRATION_RECHECK_MS,
  READER_GATED_TTL_MS,
  READER_UNGATED_TTL_MS,
  SESSION_PROVENANCE_SQL,
  SESSION_SYNC_STATE_SQL,
  SESSIONS_PROVENANCE_SQL,
  TranscriptCompletenessService,
  acknowledgementRequested,
  blockMessage,
  completenessSummary,
  detailPartIds,
  evaluateCompleteness,
  isEndedRow,
  liveStampText,
  toBlockedResponse,
  ungatedPartIds,
  watermarkText,
} from './transcript-completeness.service';

/*
 * D16 gate unit specs (spec 4.4 and 6.3 RC-4; plan R-T4; build defaults O-3, O-4). The DB is a stub:
 * rowQuery answers the provenance and part-status reads, executeRef the three SPs (rt_transcript_completeness,
 * rtedge_warn_ack, rtedge_session_end) with the row shapes of 2026-10-01_rt_edge_06/07. An answer may be a
 * function of the call's parameters (the completeness SP is asked about more than one part of a split hearing).
 */

const SES = '5e551011-0000-4000-8000-0000000000d1';
const PART1 = '5e551011-0000-4000-8000-0000000000e1';
const PART2 = '5e551011-0000-4000-8000-0000000000e2';
const ADMIN = '11111111-1111-4111-8111-111111111111';
const BOX = 'ed9e0000-0000-4000-8000-000000000001';
const T0 = Date.UTC(2026, 9, 2, 10, 0, 0);

const NON_VENUE = { bEverEdge: false, cApply: null, nPrevPartSesid: null };
const VENUE = { bEverEdge: true, cApply: null, nPrevPartSesid: null };

type Answer = any | ((params: any) => any);

/** r1 of et_rt_transcript_completeness for one session. */
const r1 = (cReason: string, cSyncState: string | null, extra: Partial<CompletenessRow> = {}): CompletenessRow => ({
  msg: 1, value: cReason, nSesid: SES, bOk: ['NOT_GATED', 'COMPLETE', 'ACKED', 'FORCED'].includes(cReason),
  bComplete: ['COMPLETE', 'ACKED', 'FORCED'].includes(cReason), cReason: cReason as any, bGated: cReason !== 'NOT_GATED',
  cSyncState: cSyncState as any, nPendingOrphans: 0, nWarnings: 0, jIncidents: [], dWarnAckAt: null, nWarnAckBy: null,
  bWatermark: cSyncState === 'F', cSealNote: null, bLiveStamp: false, bUploadPending: ['L', 'S'].includes(String(cSyncState)),
  cFeedSource: 'E', cApply: null, bEverEdge: true, nEdgeid: BOX, nFinalLines: null, dSealedAt: null,
  nPartNo: null, nPrevPartSesid: null, nNextPartSesid: null, ...extra,
});

/** One r2 row: a part of the hearing. */
const part = (nOrder: number, nSesid: string, cReason: string, cSyncState: string | null, extra: Partial<CompletenessPartRow> = {}): CompletenessPartRow => ({
  nOrder, nSesid, nPartNo: nOrder, cName: `Hearing (Part ${nOrder})`, dStartDt: null, cFeedSource: 'E', cSyncState: cSyncState as any,
  bGated: cReason !== 'NOT_GATED', bComplete: ['COMPLETE', 'ACKED', 'FORCED'].includes(cReason), cReason: cReason as any,
  nPendingOrphans: 0, bCurrent: nSesid === SES, ...extra,
});

/** A part's RSessionMaster status for PARTS_STATUS_SQL: a cStatus, or the status with its publish flags. */
type PartStatus = string | null | { cStatus?: string | null; isTranscript?: boolean; isUploaded?: boolean };

/** PARTS_STATUS_SQL answer: every part asked for, ended ('C', flags false) unless `statuses` says otherwise. */
const partStatuses = (statuses: Record<string, PartStatus> = {}) => (params: any[]) =>
  ({
    success: true,
    data: params[0].map((id: string) => {
      const given = id in statuses ? statuses[id] : 'C';
      const row: Exclude<PartStatus, string | null> = given !== null && typeof given === 'object' ? given : { cStatus: given as string | null };
      return { nSesid: id, cStatus: row.cStatus ?? null, isTranscript: row.isTranscript ?? false, isUploaded: row.isUploaded ?? false };
    }),
  });

function build(opts: {
  provenance?: Answer;
  provenanceMany?: Answer;
  partStatus?: Answer;
  syncState?: Answer;
  completeness?: Answer;
  warnAck?: Answer;
  sessionEnd?: Answer;
} = {}) {
  const calls: any[][] = [];
  const answer = (a: Answer, params: any) => (typeof a === 'function' ? a(params) : a);
  const db = {
    rowQuery: jest.fn(async (sql: string, params: any[]) => {
      calls.push(['rowQuery', sql, params]);
      if (sql === SESSION_PROVENANCE_SQL) return answer(opts.provenance ?? { success: true, data: [NON_VENUE] }, params);
      if (sql === SESSIONS_PROVENANCE_SQL) return answer(opts.provenanceMany ?? { success: true, data: [] }, params);
      if (sql === PARTS_STATUS_SQL) return answer(opts.partStatus ?? partStatuses(), params);
      if (sql === SESSION_SYNC_STATE_SQL) return answer(opts.syncState, params);
      throw new Error(`unexpected query ${sql}`);
    }),
    executeRef: jest.fn(async (name: string, params: any) => {
      calls.push(['executeRef', name, { ...params }]);
      if (name === 'rt_transcript_completeness') return answer(opts.completeness, params);
      if (name === 'rtedge_warn_ack') return answer(opts.warnAck ?? { success: true, data: [[{ msg: 1, value: 'Warnings acknowledged' }]] }, params);
      if (name === 'rtedge_session_end') return answer(opts.sessionEnd, params);
      throw new Error(`unexpected SP ${name}`);
    }),
  };
  const gate = new TranscriptCompletenessService(db as any);
  return { gate, db, calls };
}

const venueGate = (completeness: Answer, extra: Parameters<typeof build>[0] = {}) =>
  build({ provenance: { success: true, data: [VENUE] }, completeness, ...extra });

const one = (row: CompletenessRow, parts?: CompletenessPartRow[]) =>
  ({ success: true, data: [[row], parts ?? [part(1, row.nSesid ?? SES, String(row.cReason), row.cSyncState ?? null, { nPartNo: null, cFeedSource: row.cFeedSource })]] });

// The gate logs refusals and failures through Nest's Logger: keep the test output quiet.
beforeEach(() => {
  jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
});
afterEach(() => jest.restoreAllMocks());

describe('TranscriptCompletenessService: provenance (one plain read, never the completeness SP)', () => {
  beforeEach(() => jest.spyOn(console, 'error').mockImplementation(() => undefined));
  afterEach(() => jest.restoreAllMocks());

  it('reads bEverEdge, cApply and nPrevPartSesid of the session with one parameterised query', async () => {
    const { gate, calls } = build();
    await expect(gate.provenance(SES)).resolves.toEqual({ nSesid: SES, gated: false, linked: false });
    expect(calls).toEqual([['rowQuery', 'SELECT "bEverEdge", "cApply", "nPrevPartSesid" FROM "RSessionMaster" WHERE "nSesid" = $1 LIMIT 1', [SES]]]);
  });

  it.each([
    ['bEverEdge true', { bEverEdge: true, cApply: null }, true],
    ['cApply C (cut mode)', { bEverEdge: false, cApply: 'C' }, true],
    ['cApply L (legacy dispatch)', { bEverEdge: false, cApply: 'L' }, false],
    ['a char(1) padded cApply', { bEverEdge: false, cApply: 'c ' }, true],
    ['no provenance set (every hearing today)', { bEverEdge: false, cApply: null }, false],
  ])('%s -> gated %s', async (_label, row, gated) => {
    const { gate } = build({ provenance: { success: true, data: [{ ...row, nPrevPartSesid: null }] } });
    expect((await gate.provenance(SES)).gated).toBe(gated);
  });

  it('a later part of a split hearing (nPrevPartSesid set) is linked but not gated by itself', async () => {
    const { gate } = build({ provenance: { success: true, data: [{ bEverEdge: false, cApply: 'L', nPrevPartSesid: PART1 }] } });
    await expect(gate.provenance(SES)).resolves.toEqual({ nSesid: SES, gated: false, linked: true });
  });

  it('a session with no row is neither gated nor linked', async () => {
    const { gate } = build({ provenance: { success: true, data: [] } });
    await expect(gate.provenance(SES)).resolves.toEqual({ nSesid: SES, gated: false, linked: false });
  });

  it('a value that is not a UUID is not read and is never gated', async () => {
    const { gate, calls } = build();
    await expect(gate.provenance('0')).resolves.toEqual({ nSesid: '0', gated: false, linked: false });
    await expect(gate.provenance(undefined as any)).resolves.toMatchObject({ gated: false });
    expect(calls).toEqual([]);
  });

  it('a failed read comes back as an error, never as "not gated"', async () => {
    const { gate } = build({ provenance: { success: false, error: 'connection refused' } });
    await expect(gate.provenance(SES)).resolves.toEqual({ nSesid: SES, gated: false, linked: false, error: 'connection refused' });
    const thrown = build({ provenance: () => { throw new Error('pool closed'); } });
    await expect(thrown.gate.provenance(SES)).resolves.toMatchObject({ error: 'pool closed' });
  });

  it('before the rt_edge migration (no provenance columns) nothing is gated; that is logged once and remembered for a minute, with no query meanwhile', async () => {
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(T0);
    const { gate, calls } = build({ provenance: { success: false, error: 'column "bEverEdge" does not exist' } });
    const pre = { nSesid: SES, gated: false, linked: false, preMigration: true };
    await expect(gate.provenance(SES)).resolves.toEqual(pre);
    nowSpy.mockReturnValue(T0 + PRE_MIGRATION_RECHECK_MS - 1);
    await expect(gate.provenance(SES)).resolves.toEqual(pre);
    await expect(gate.provenance(PART1)).resolves.toEqual({ ...pre, nSesid: PART1 });
    await expect(gate.gatedAmong([SES, PART1])).resolves.toEqual({ gated: new Set(), preMigration: true });
    // one failing SELECT (and so one DB error line) for all of that
    expect(calls).toEqual([['rowQuery', SESSION_PROVENANCE_SQL, [SES]]]);

    nowSpy.mockReturnValue(T0 + PRE_MIGRATION_RECHECK_MS);
    await expect(gate.provenance(SES)).resolves.toEqual(pre);
    expect(calls).toHaveLength(2);
    expect(Logger.prototype.warn).toHaveBeenCalledTimes(1);
    expect(Logger.prototype.warn).toHaveBeenCalledWith(expect.stringContaining('rt_edge migration not applied'));
  });

  it('once the migration has run, the next read after the minute answers normally', async () => {
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(T0);
    let migrated = false;
    const { gate } = build({ provenance: () => (migrated ? { success: true, data: [VENUE] } : { success: false, error: 'column "bEverEdge" does not exist' }) });
    await expect(gate.provenance(SES)).resolves.toMatchObject({ preMigration: true });
    migrated = true;
    await expect(gate.provenance(SES)).resolves.toMatchObject({ preMigration: true });
    nowSpy.mockReturnValue(T0 + PRE_MIGRATION_RECHECK_MS);
    await expect(gate.provenance(SES)).resolves.toEqual({ nSesid: SES, gated: true, linked: false });
    nowSpy.mockReturnValue(T0 + PRE_MIGRATION_RECHECK_MS + 1);
    await expect(gate.provenance(SES)).resolves.toEqual({ nSesid: SES, gated: true, linked: false });
  });

  it('any other read error is not remembered: every call reads again and reports it', async () => {
    const { gate, calls } = build({ provenance: { success: false, error: 'column "cFoo" does not exist' } });
    await expect(gate.provenance(SES)).resolves.toMatchObject({ error: 'column "cFoo" does not exist' });
    await expect(gate.provenance(SES)).resolves.toMatchObject({ error: 'column "cFoo" does not exist' });
    expect(calls).toHaveLength(2);
  });
});

describe('TranscriptCompletenessService.gatedAmong: one read for a list of sessions', () => {
  afterEach(() => jest.restoreAllMocks());

  it('reads every UUID once (deduplicated, lower case) and answers which ones are gated', async () => {
    const UPPER = PART2.toUpperCase();
    const { gate, calls } = build({
      provenanceMany: (params: any) => ({
        success: true,
        data: params[0].map((id: string) => ({ nSesid: id, ...(id === PART1 ? VENUE : id === PART2 ? { bEverEdge: false, cApply: 'C' } : NON_VENUE) })),
      }),
    });

    const res = await gate.gatedAmong([SES, PART1, UPPER, PART1, 'not-a-uuid', null as any]);

    expect(calls).toEqual([['rowQuery', SESSIONS_PROVENANCE_SQL, [[SES, PART1, PART2]]]]);
    expect([...res.gated].sort()).toEqual([PART1, PART2].sort());
    expect(res.error).toBeUndefined();
  });

  it('an empty list (or only non-UUIDs) reads nothing', async () => {
    const { gate, calls } = build();
    await expect(gate.gatedAmong([])).resolves.toEqual({ gated: new Set() });
    await expect(gate.gatedAmong(['x'])).resolves.toEqual({ gated: new Set() });
    expect(calls).toEqual([]);
  });

  it('a failed read is an error; a pre-migration schema gates nothing', async () => {
    const failed = build({ provenanceMany: { success: false, error: 'timeout' } });
    await expect(failed.gate.gatedAmong([SES])).resolves.toEqual({ gated: new Set(), error: 'timeout' });
    const pre = build({ provenanceMany: { success: false, error: 'column "cApply" does not exist' } });
    await expect(pre.gate.gatedAmong([SES])).resolves.toEqual({ gated: new Set(), preMigration: true });
  });
});

describe('assertTranscriptComplete: a non-venue session (every hearing today, RC-4)', () => {
  afterEach(() => jest.restoreAllMocks());

  it.each(['publish', 'export'] as const)('%s passes after the provenance read alone, without the completeness SP', async (purpose) => {
    const { gate, calls } = build();
    await expect(gate.assertTranscriptComplete(SES, purpose)).resolves.toEqual({ ok: true, gated: false, purpose, nSesid: SES });
    expect(calls).toEqual([['rowQuery', SESSION_PROVENANCE_SQL, [SES]]]);
  });

  it('an acknowledgement flag on a non-venue session records nothing', async () => {
    const { gate, calls } = build();
    await gate.assertTranscriptComplete(SES, 'publish', { acknowledgeWarnings: true, nMasterid: ADMIN });
    expect(calls.map((c) => c[0])).toEqual(['rowQuery']);
  });

  it('a failed provenance read blocks (fail closed) without consulting the SP', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const { gate, calls } = build({ provenance: { success: false, error: 'db down' } });
    const verdict = await gate.assertTranscriptComplete(SES, 'publish');
    expect(verdict).toEqual({
      ok: false, gated: true, purpose: 'publish', nSesid: SES, cCode: 'UNVERIFIED',
      message: "The transcript's completeness could not be checked. Publishing is blocked; try again.",
    });
    expect(calls).toHaveLength(1);
  });
});

describe('assertTranscriptComplete: venue sessions by cSyncState', () => {
  afterEach(() => jest.restoreAllMocks());

  it("asks et_rt_transcript_completeness with cPurpose 'P' for a publish and 'X' for an export, two cursors", async () => {
    const { gate, calls } = venueGate(one(r1('COMPLETE', 'K')));
    await gate.assertTranscriptComplete(SES, 'publish');
    await gate.assertTranscriptComplete(SES, 'export');
    expect(calls.filter((c) => c[0] === 'executeRef')).toEqual([
      ['executeRef', 'rt_transcript_completeness', { nSesid: SES, cPurpose: 'P', ref: 2 }],
      ['executeRef', 'rt_transcript_completeness', { nSesid: SES, cPurpose: 'X', ref: 2 }],
    ]);
  });

  it("'S' blocks publish: AWAITING_SEAL, waiting for the venue box to upload", async () => {
    const { gate } = venueGate(one(r1('AWAITING_SEAL', 'S')));
    const verdict = await gate.assertTranscriptComplete(SES, 'publish');
    expect(verdict).toMatchObject({
      ok: false, gated: true, cCode: 'AWAITING_SEAL', cSyncState: 'S', blockingPartNo: null,
      message: 'Waiting for the venue box to upload. Publishing is blocked until the transcript is complete.',
    });
  });

  it("'S' blocks an export too", async () => {
    const { gate } = venueGate(one(r1('AWAITING_SEAL', 'S')));
    await expect(gate.assertTranscriptComplete(SES, 'export')).resolves.toMatchObject({
      ok: false, cCode: 'AWAITING_SEAL', message: 'Waiting for the venue box to upload. Exporting is blocked until the transcript is complete.',
    });
  });

  it("'S' on a cut-mode cloud-direct session says the transcript is being sealed", async () => {
    const { gate } = build({
      provenance: { success: true, data: [{ bEverEdge: false, cApply: 'C', nPrevPartSesid: null }] },
      completeness: one(r1('AWAITING_SEAL', 'S', { cFeedSource: 'D', cApply: 'C', bEverEdge: false })),
    });
    await expect(gate.assertTranscriptComplete(SES, 'publish')).resolves.toMatchObject({
      ok: false, cCode: 'AWAITING_SEAL', message: 'Waiting for the transcript to be sealed. Publishing is blocked until it is complete.',
    });
  });

  it("'K' passes with no watermark and no stamp", async () => {
    const { gate } = venueGate(one(r1('COMPLETE', 'K')));
    const verdict = await gate.assertTranscriptComplete(SES, 'publish');
    expect(verdict).toMatchObject({ ok: true, gated: true, cSyncState: 'K', cReason: 'COMPLETE', watermark: null, liveStamp: null, acknowledged: [] });
    expect(verdict.parts).toEqual([expect.objectContaining({ nSesid: SES, cReason: 'COMPLETE', bComplete: true, bPasses: true, bCurrent: true })]);
    expect(completenessSummary(verdict)).toMatchObject({ bGated: true, bIncomplete: false, cWatermark: null, cLiveStamp: null });
  });

  it("'W' without an acknowledgement blocks: NEEDS_ACK, and nothing is recorded", async () => {
    const incidents = [{ kind: 'ABORTED_WINDOW', at: 120 }];
    const { gate, calls } = venueGate(one(r1('NEEDS_ACK', 'W', { jIncidents: incidents, nWarnings: 1 })));
    const verdict = await gate.assertTranscriptComplete(SES, 'publish');
    expect(verdict).toMatchObject({
      ok: false, cCode: 'NEEDS_ACK', incidents,
      message: 'The venue upload finished with warnings. Acknowledge the listed incidents before publishing.',
    });
    expect(calls.map((c) => c[1])).not.toContain('rtedge_warn_ack');
  });

  it("'W' with the acknowledgement flag records it (et_rtedge_warn_ack, the acting user) and passes", async () => {
    const { gate, calls } = venueGate(one(r1('NEEDS_ACK', 'W')));
    const verdict = await gate.assertTranscriptComplete(SES, 'publish', { acknowledgeWarnings: true, nMasterid: ADMIN });
    expect(calls).toEqual([
      ['rowQuery', SESSION_PROVENANCE_SQL, [SES]],
      ['executeRef', 'rt_transcript_completeness', { nSesid: SES, cPurpose: 'P', ref: 2 }],
      ['executeRef', 'rtedge_warn_ack', { nSesid: SES, nMasterid: ADMIN }],
    ]);
    expect(verdict).toMatchObject({ ok: true, cReason: 'ACKED', acknowledged: [SES] });
    expect(verdict.parts[0]).toMatchObject({ cReason: 'ACKED', bAcknowledged: true, bComplete: true, bPasses: true });
  });

  it("'W' already acknowledged (dWarnAckAt set, ACKED) passes without a new acknowledgement", async () => {
    const { gate, calls } = venueGate(one(r1('ACKED', 'W', { dWarnAckAt: '2026-10-01T10:00:00Z', nWarnAckBy: ADMIN })));
    await expect(gate.assertTranscriptComplete(SES, 'publish', { acknowledgeWarnings: true, nMasterid: ADMIN })).resolves.toMatchObject({ ok: true, acknowledged: [] });
    expect(calls.map((c) => c[1])).not.toContain('rtedge_warn_ack');
  });

  it("'W' stays blocked when the acknowledgement is refused (not an admin, case admin or hearing operator)", async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { gate } = venueGate(one(r1('NEEDS_ACK', 'W')), {
      warnAck: { success: true, data: [[{ msg: -3, value: 'Admin, case admin or hearing operator rights required', cCode: 'NOT_ALLOWED' }]] },
    });
    await expect(gate.assertTranscriptComplete(SES, 'publish', { acknowledgeWarnings: true, nMasterid: ADMIN }))
      .resolves.toMatchObject({ ok: false, cCode: 'NEEDS_ACK', acknowledged: [] });
  });

  it("'W' with the flag but no acting user records nothing and stays blocked", async () => {
    const { gate, calls } = venueGate(one(r1('NEEDS_ACK', 'W')));
    await expect(gate.assertTranscriptComplete(SES, 'export', { acknowledgeWarnings: true })).resolves.toMatchObject({ ok: false, cCode: 'NEEDS_ACK' });
    expect(calls.map((c) => c[1])).not.toContain('rtedge_warn_ack');
  });

  it("'F' passes with the INCOMPLETE watermark naming the missing interval", async () => {
    const { gate } = venueGate(one(r1('FORCED', 'F', { cSealNote: 'venue data missing 2026-10-01 10:00:00-10:20:00' })));
    const verdict = await gate.assertTranscriptComplete(SES, 'export');
    expect(verdict).toMatchObject({ ok: true, cReason: 'FORCED', watermark: 'INCOMPLETE — venue data missing 2026-10-01 10:00:00-10:20:00' });
    expect(completenessSummary(verdict)).toMatchObject({ bIncomplete: true, cWatermark: 'INCOMPLETE — venue data missing 2026-10-01 10:00:00-10:20:00' });
  });

  it("'F' with a free-text super-admin note gets the 'venue data missing' prefix", async () => {
    const { gate } = venueGate(one(r1('FORCED', 'F', { cSealNote: 'box stolen after 11:40' })));
    await expect(gate.assertTranscriptComplete(SES, 'publish')).resolves.toMatchObject({ ok: true, watermark: 'INCOMPLETE — venue data missing box stolen after 11:40' });
  });

  it("'L' blocks a publish but lets an export through with the 'Live - as of' stamp", async () => {
    const now = () => new Date(2026, 9, 1, 14, 5, 9);
    const pub = venueGate(one(r1('LIVE', 'L')));
    await expect(pub.gate.assertTranscriptComplete(SES, 'publish', { now })).resolves.toMatchObject({
      ok: false, cCode: 'LIVE', message: 'The session is still live. End it and wait for the venue box to upload before publishing.',
    });
    const exp = venueGate(one(r1('LIVE', 'L')));
    await expect(exp.gate.assertTranscriptComplete(SES, 'export', { now })).resolves.toMatchObject({ ok: true, liveStamp: 'Live — as of 14:05:09', watermark: null });
  });

  it('pending held venue data blocks: PENDING_ORPHANS', async () => {
    const { gate } = venueGate(one(r1('PENDING_ORPHANS', 'K', { nPendingOrphans: 2 })));
    await expect(gate.assertTranscriptComplete(SES, 'publish')).resolves.toMatchObject({
      ok: false, cCode: 'PENDING_ORPHANS', message: 'Venue data held outside the transcript is waiting for review. Dismiss it or record an addendum before publishing.',
    });
  });

  it('a gated session without a completeness state blocks: NO_STATE', async () => {
    const { gate } = venueGate(one(r1('NO_STATE', null)));
    await expect(gate.assertTranscriptComplete(SES, 'export')).resolves.toMatchObject({ ok: false, cCode: 'NO_STATE' });
  });

  it('a session the SP cannot find (or a deleted one) blocks: NOT_FOUND', async () => {
    const { gate } = venueGate({ success: true, data: [[{ msg: -1, value: 'Session not found', cCode: 'NOT_FOUND', bOk: false }], []] });
    await expect(gate.assertTranscriptComplete(SES, 'publish')).resolves.toEqual({
      ok: false, gated: true, purpose: 'publish', nSesid: SES, cCode: 'NOT_FOUND', message: 'Session not found. Publishing is blocked.',
    });
  });

  it('a failing completeness SP blocks: UNVERIFIED', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const { gate } = venueGate({ success: false, error: 'function et_rt_transcript_completeness does not exist' });
    await expect(gate.assertTranscriptComplete(SES, 'export')).resolves.toMatchObject({ ok: false, gated: true, cCode: 'UNVERIFIED' });
  });
});

describe('assertTranscriptComplete: the part chain of a split hearing (D7, O-4)', () => {
  afterEach(() => jest.restoreAllMocks());

  /** Part 2 (the current session, SES) is a cloud-direct 'D' session: not gated by itself, linked to Part 1. */
  const part2Provenance = { success: true, data: [{ bEverEdge: false, cApply: 'L', nPrevPartSesid: PART1 }] };
  const part2Row = (extra: Partial<CompletenessRow> = {}) =>
    r1('NOT_GATED', null, { cFeedSource: 'D', cApply: 'L', bEverEdge: false, nEdgeid: null, nPartNo: 2, nPrevPartSesid: PART1, ...extra });
  const chain = (part1Reason: string, part1State: string, part2: Partial<CompletenessPartRow> = {}) => [
    part(1, PART1, part1Reason, part1State, { nPartNo: 1 }),
    part(2, SES, 'NOT_GATED', null, { nPartNo: 2, cFeedSource: 'D', bGated: false, ...part2 }),
  ];
  const PART1_INCIDENTS = [{ kind: 'ABORTED_WINDOW', level: 'warning', at: 120 }];
  /**
   * The completeness SP for this hearing: asked about Part 2 (the request) it answers Part 2's r1 and the
   * chain; asked about Part 1 (the detail read, cPurpose 'X') it answers Part 1's own r1.
   */
  const hearing = (part1Reason: string, part1State: string, part1Extra: Partial<CompletenessRow> = {}) => (params: any) =>
    params.nSesid === PART1
      ? { success: true, data: [[r1(part1Reason, part1State, { nSesid: PART1, nPartNo: 1, nNextPartSesid: SES, ...part1Extra })], chain(part1Reason, part1State)] }
      : { success: true, data: [[part2Row()], chain(part1Reason, part1State)] };

  it("a publish of Part 2 waits for Part 1: Part 1 'S' blocks, naming the part", async () => {
    const { gate, calls } = build({ provenance: part2Provenance, completeness: { success: true, data: [[part2Row()], chain('AWAITING_SEAL', 'S')] } });
    const verdict = await gate.assertTranscriptComplete(SES, 'publish');
    expect(calls.map((c) => c[1])).toContain('rt_transcript_completeness');
    expect(verdict).toMatchObject({
      ok: false, gated: true, cCode: 'AWAITING_SEAL', blockingPartNo: 1,
      message: 'Part 1: Waiting for the venue box to upload. Publishing is blocked until the transcript is complete.',
    });
    expect(verdict.parts.map((p) => [p.nPartNo, p.nSesid, p.bPasses])).toEqual([[1, PART1, false], [2, SES, true]]);
  });

  it('an export of Part 2 reads only Part 2: not gated, no SP', async () => {
    const { gate, calls } = build({ provenance: part2Provenance });
    await expect(gate.assertTranscriptComplete(SES, 'export')).resolves.toEqual({ ok: true, gated: false, purpose: 'export', nSesid: SES });
    expect(calls).toHaveLength(1);
  });

  it('lists the parts in nPartNo order whatever order the rows arrive in, and passes when every part passes', async () => {
    const rows = chain('COMPLETE', 'K').reverse();
    const { gate } = build({ provenance: part2Provenance, completeness: { success: true, data: [[part2Row()], rows] } });
    const verdict = await gate.assertTranscriptComplete(SES, 'publish');
    expect(verdict.ok).toBe(true);
    expect(verdict.parts.map((p) => p.nPartNo)).toEqual([1, 2]);
    expect(completenessSummary(verdict).parts.map((p: any) => p.nSesid)).toEqual([PART1, SES]);
  });

  it("a forced Part 1 ('F') lets the hearing publish with a per-part INCOMPLETE watermark naming Part 1's missing interval, read from Part 1's own row", async () => {
    const { gate, calls } = build({ provenance: part2Provenance, completeness: hearing('FORCED', 'F', { cSealNote: 'venue data missing 10:00:00-10:20:00' }) });
    const verdict = await gate.assertTranscriptComplete(SES, 'publish');
    expect(verdict).toMatchObject({ ok: true, watermark: 'INCOMPLETE — Part 1: venue data missing 10:00:00-10:20:00' });
    expect(verdict.parts[0]).toMatchObject({ nSesid: PART1, cReason: 'FORCED', cSealNote: 'venue data missing 10:00:00-10:20:00' });
    expect(calls.filter((c) => c[0] === 'executeRef')).toEqual([
      ['executeRef', 'rt_transcript_completeness', { nSesid: SES, cPurpose: 'P', ref: 2 }],
      ['executeRef', 'rt_transcript_completeness', { nSesid: PART1, cPurpose: 'X', ref: 2 }],
    ]);
  });

  describe("Part 1 'W': the refusal lists Part 1's incidents, and the flag acknowledges exactly those", () => {
    it("without the flag: NEEDS_ACK naming Part 1, carrying Part 1's incidents (read from its own row); nothing recorded", async () => {
      const { gate, calls } = build({ provenance: part2Provenance, completeness: hearing('NEEDS_ACK', 'W', { jIncidents: PART1_INCIDENTS, nWarnings: 1 }) });
      const verdict = await gate.assertTranscriptComplete(SES, 'publish');
      expect(verdict).toMatchObject({
        ok: false, cCode: 'NEEDS_ACK', blockingPartNo: 1, incidents: PART1_INCIDENTS, acknowledged: [],
        message: 'Part 1: The venue upload finished with warnings. Acknowledge the listed incidents before publishing.',
      });
      expect(verdict.parts.map((p) => [p.nPartNo, p.cReason, p.incidents])).toEqual([[1, 'NEEDS_ACK', PART1_INCIDENTS], [2, 'NOT_GATED', []]]);
      expect(toBlockedResponse(verdict).incidents).toEqual(PART1_INCIDENTS);
      expect(calls).toEqual([
        ['rowQuery', SESSION_PROVENANCE_SQL, [SES]],
        ['executeRef', 'rt_transcript_completeness', { nSesid: SES, cPurpose: 'P', ref: 2 }],
        ['rowQuery', PARTS_STATUS_SQL, [[SES]]],
        ['executeRef', 'rt_transcript_completeness', { nSesid: PART1, cPurpose: 'X', ref: 2 }],
      ]);
    });

    it("with the flag: Part 1's incidents are read, the acknowledgement is recorded on Part 1 for the acting user, and the hearing passes", async () => {
      const { gate, calls } = build({ provenance: part2Provenance, completeness: hearing('NEEDS_ACK', 'W', { jIncidents: PART1_INCIDENTS }) });
      const verdict = await gate.assertTranscriptComplete(SES, 'publish', { acknowledgeWarnings: true, nMasterid: ADMIN });
      expect(calls).toEqual([
        ['rowQuery', SESSION_PROVENANCE_SQL, [SES]],
        ['executeRef', 'rt_transcript_completeness', { nSesid: SES, cPurpose: 'P', ref: 2 }],
        ['rowQuery', PARTS_STATUS_SQL, [[SES]]],
        ['executeRef', 'rt_transcript_completeness', { nSesid: PART1, cPurpose: 'X', ref: 2 }],
        ['executeRef', 'rtedge_warn_ack', { nSesid: PART1, nMasterid: ADMIN }],
      ]);
      expect(verdict).toMatchObject({ ok: true, acknowledged: [PART1], watermark: null });
      expect(verdict.parts[0]).toMatchObject({ nSesid: PART1, cReason: 'ACKED', bAcknowledged: true, bPasses: true, incidents: PART1_INCIDENTS });
    });

    it('with the flag while the requested Part 2 is still recording: nothing is recorded, and the refusal names Part 2 (the real obstacle)', async () => {
      const { gate, calls } = build({
        provenance: part2Provenance,
        completeness: hearing('NEEDS_ACK', 'W', { jIncidents: PART1_INCIDENTS }),
        partStatus: partStatuses({ [SES]: 'R' }),
      });
      const verdict = await gate.assertTranscriptComplete(SES, 'publish', { acknowledgeWarnings: true, nMasterid: ADMIN });
      expect(verdict).toMatchObject({
        ok: false, cCode: 'LIVE', blockingPartNo: 2, acknowledged: [],
        message: 'Part 2: The session is still live. End it before publishing.',
      });
      expect(verdict.parts.map((p) => [p.nPartNo, p.cReason])).toEqual([[1, 'NEEDS_ACK'], [2, 'LIVE']]);
      expect(calls.map((c) => c[1])).not.toContain('rtedge_warn_ack');
    });

    it('without the flag, that hearing is refused for Part 1 first: the parts in order', async () => {
      const { gate } = build({ provenance: part2Provenance, completeness: hearing('NEEDS_ACK', 'W'), partStatus: partStatuses({ [SES]: 'R' }) });
      await expect(gate.assertTranscriptComplete(SES, 'publish')).resolves.toMatchObject({ ok: false, cCode: 'NEEDS_ACK', blockingPartNo: 1 });
    });

    it("a refused acknowledgement (not an admin, case admin or hearing operator) leaves the hearing blocked on Part 1", async () => {
      jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      const { gate } = build({
        provenance: part2Provenance,
        completeness: hearing('NEEDS_ACK', 'W'),
        warnAck: { success: true, data: [[{ msg: -3, value: 'Admin, case admin or hearing operator rights required', cCode: 'NOT_ALLOWED' }]] },
      });
      await expect(gate.assertTranscriptComplete(SES, 'publish', { acknowledgeWarnings: true, nMasterid: ADMIN }))
        .resolves.toMatchObject({ ok: false, cCode: 'NEEDS_ACK', blockingPartNo: 1, acknowledged: [] });
    });

    it("a failed read of Part 1's row blocks UNVERIFIED and records nothing", async () => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined);
      const failing = (params: any) => (params.nSesid === PART1 ? { success: false, error: 'down' } : hearing('NEEDS_ACK', 'W')(params));
      const { gate, calls } = build({ provenance: part2Provenance, completeness: failing });
      await expect(gate.assertTranscriptComplete(SES, 'publish', { acknowledgeWarnings: true, nMasterid: ADMIN })).resolves.toEqual({
        ok: false, gated: true, purpose: 'publish', nSesid: SES, cCode: 'UNVERIFIED',
        message: "The transcript's completeness could not be checked. Publishing is blocked; try again.",
      });
      expect(calls.map((c) => c[1])).not.toContain('rtedge_warn_ack');
      const gone = (params: any) => (params.nSesid === PART1 ? { success: true, data: [[{ msg: -1, value: 'Session not found', cCode: 'NOT_FOUND' }], []] } : hearing('NEEDS_ACK', 'W')(params));
      await expect(build({ provenance: part2Provenance, completeness: gone }).gate.assertTranscriptComplete(SES, 'publish')).resolves.toMatchObject({ ok: false, cCode: 'UNVERIFIED' });
    });
  });

  it('a publish of Part 1 waits for a later cut-mode part that is still live', async () => {
    const current = r1('COMPLETE', 'K', { nSesid: SES, nPartNo: 1, nNextPartSesid: PART2 });
    const rows = [
      part(1, SES, 'COMPLETE', 'K', { nPartNo: 1 }),
      part(2, PART2, 'LIVE', 'L', { nPartNo: 2, cFeedSource: 'D' }),
    ];
    const { gate } = venueGate({ success: true, data: [[current], rows] });
    await expect(gate.assertTranscriptComplete(SES, 'publish')).resolves.toMatchObject({ ok: false, cCode: 'LIVE', blockingPartNo: 2 });
    // An export of Part 1 reads Part 1 only.
    const exp = venueGate({ success: true, data: [[current], rows] });
    await expect(exp.gate.assertTranscriptComplete(SES, 'export')).resolves.toMatchObject({ ok: true });
  });

  describe('a not-gated (cloud-direct legacy) part counts only once it has ended (O-4)', () => {
    /** Part 1 (the current session, SES) is the sealed venue part; Part 2 is the default split: cApply 'L', never gated. */
    const part1Current = r1('COMPLETE', 'K', { nSesid: SES, nPartNo: 1, nNextPartSesid: PART2 });
    const legacyChain = () => [
      part(1, SES, 'COMPLETE', 'K', { nPartNo: 1 }),
      part(2, PART2, 'NOT_GATED', null, { nPartNo: 2, cFeedSource: 'D', bGated: false }),
    ];

    it('a publish of Part 1 is blocked while the legacy Part 2 is still recording (cStatus R): LIVE, naming Part 2', async () => {
      const { gate, calls } = venueGate({ success: true, data: [[part1Current], legacyChain()] }, { partStatus: partStatuses({ [PART2]: 'R' }) });
      const verdict = await gate.assertTranscriptComplete(SES, 'publish');
      expect(calls).toEqual([
        ['rowQuery', SESSION_PROVENANCE_SQL, [SES]],
        ['executeRef', 'rt_transcript_completeness', { nSesid: SES, cPurpose: 'P', ref: 2 }],
        ['rowQuery', PARTS_STATUS_SQL, [[PART2]]],
      ]);
      expect(verdict).toMatchObject({
        ok: false, gated: true, cCode: 'LIVE', blockingPartNo: 2, cReason: 'COMPLETE',
        message: 'Part 2: The session is still live. End it before publishing.',
      });
      expect(verdict.parts.map((p) => [p.nPartNo, p.cReason, p.bPasses])).toEqual([[1, 'COMPLETE', true], [2, 'LIVE', false]]);
    });

    it.each([['R'], ['A'], ['L'], [null]])('cStatus %s is not ended: the publish stays blocked', async (cStatus) => {
      const { gate } = venueGate({ success: true, data: [[part1Current], legacyChain()] }, { partStatus: partStatuses({ [PART2]: cStatus }) });
      await expect(gate.assertTranscriptComplete(SES, 'publish')).resolves.toMatchObject({ ok: false, cCode: 'LIVE', blockingPartNo: 2 });
    });

    it("a published legacy Part 2 (cStatus 'P', set by the publish SPs) has ended: the sealed Part 1 can still be published after it", async () => {
      const published = { cStatus: 'P', isTranscript: true, isUploaded: true };
      const { gate } = venueGate({ success: true, data: [[part1Current], legacyChain()] }, { partStatus: partStatuses({ [PART2]: published }) });
      const verdict = await gate.assertTranscriptComplete(SES, 'publish');
      expect(verdict).toMatchObject({ ok: true, watermark: null });
      expect(verdict.parts.map((p) => [p.nPartNo, p.cReason, p.bPasses])).toEqual([[1, 'COMPLETE', true], [2, 'NOT_GATED', true]]);
    });

    it("'P' alone counts as published (the app reads cStatus 'P' as RT-published), and so do both publish flags on another status; one flag does not", async () => {
      const rows = () => ({ success: true, data: [[part1Current], legacyChain()] });
      await expect(venueGate(rows(), { partStatus: partStatuses({ [PART2]: 'P' }) }).gate.assertTranscriptComplete(SES, 'publish')).resolves.toMatchObject({ ok: true });
      await expect(venueGate(rows(), { partStatus: partStatuses({ [PART2]: { cStatus: 'R', isTranscript: true, isUploaded: true } }) }).gate.assertTranscriptComplete(SES, 'publish')).resolves.toMatchObject({ ok: true });
      await expect(venueGate(rows(), { partStatus: partStatuses({ [PART2]: { cStatus: 'R', isTranscript: true, isUploaded: false } }) }).gate.assertTranscriptComplete(SES, 'publish')).resolves.toMatchObject({ ok: false, cCode: 'LIVE', blockingPartNo: 2 });
    });

    it('a re-publish of the published legacy Part 2 itself passes (after Part 1)', async () => {
      const rows = [
        part(1, PART1, 'COMPLETE', 'K', { nPartNo: 1 }),
        part(2, SES, 'NOT_GATED', null, { nPartNo: 2, cFeedSource: 'D', bGated: false }),
      ];
      const current = r1('NOT_GATED', null, { cFeedSource: 'D', cApply: 'L', bEverEdge: false, nEdgeid: null, nPartNo: 2, nPrevPartSesid: PART1 });
      const { gate } = build({
        provenance: { success: true, data: [{ bEverEdge: false, cApply: 'L', nPrevPartSesid: PART1 }] },
        completeness: { success: true, data: [[current], rows] },
        partStatus: partStatuses({ [SES]: { cStatus: 'P', isTranscript: true, isUploaded: true } }),
      });
      const verdict = await gate.assertTranscriptComplete(SES, 'publish');
      expect(verdict).toMatchObject({ ok: true, cReason: 'NOT_GATED' });
      expect(verdict.parts.map((p) => [p.nPartNo, p.cReason, p.bPasses])).toEqual([[1, 'COMPLETE', true], [2, 'NOT_GATED', true]]);
    });

    it("passes once the legacy Part 2 has ended (cStatus 'C', a char(1) padded value too)", async () => {
      const ended = venueGate({ success: true, data: [[part1Current], legacyChain()] });
      const verdict = await ended.gate.assertTranscriptComplete(SES, 'publish');
      expect(verdict).toMatchObject({ ok: true, watermark: null });
      expect(verdict.parts.map((p) => [p.nPartNo, p.cReason, p.bPasses])).toEqual([[1, 'COMPLETE', true], [2, 'NOT_GATED', true]]);
      const padded = venueGate({ success: true, data: [[part1Current], legacyChain()] }, { partStatus: partStatuses({ [PART2]: 'c ' }) });
      await expect(padded.gate.assertTranscriptComplete(SES, 'publish')).resolves.toMatchObject({ ok: true });
    });

    it('a publish of the legacy Part 2 itself waits for Part 2 to end, after Part 1 passes', async () => {
      const rows = [
        part(1, PART1, 'COMPLETE', 'K', { nPartNo: 1 }),
        part(2, SES, 'NOT_GATED', null, { nPartNo: 2, cFeedSource: 'D', bGated: false }),
      ];
      const current = r1('NOT_GATED', null, { cFeedSource: 'D', cApply: 'L', bEverEdge: false, nEdgeid: null, nPartNo: 2, nPrevPartSesid: PART1 });
      const { gate, calls } = build({
        provenance: { success: true, data: [{ bEverEdge: false, cApply: 'L', nPrevPartSesid: PART1 }] },
        completeness: { success: true, data: [[current], rows] },
        partStatus: partStatuses({ [SES]: 'R' }),
      });
      await expect(gate.assertTranscriptComplete(SES, 'publish')).resolves.toMatchObject({
        ok: false, cCode: 'LIVE', blockingPartNo: 2, cReason: 'LIVE',
        message: 'Part 2: The session is still live. End it before publishing.',
      });
      expect(calls).toContainEqual(['rowQuery', PARTS_STATUS_SQL, [[SES]]]);
    });

    it('a failed part-status read blocks (UNVERIFIED), and so does a part with no row', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined);
      const failed = venueGate({ success: true, data: [[part1Current], legacyChain()] }, { partStatus: { success: false, error: 'db down' } });
      await expect(failed.gate.assertTranscriptComplete(SES, 'publish')).resolves.toEqual({
        ok: false, gated: true, purpose: 'publish', nSesid: SES, cCode: 'UNVERIFIED',
        message: "The transcript's completeness could not be checked. Publishing is blocked; try again.",
      });
      const thrown = venueGate({ success: true, data: [[part1Current], legacyChain()] }, { partStatus: () => { throw new Error('pool closed'); } });
      await expect(thrown.gate.assertTranscriptComplete(SES, 'publish')).resolves.toMatchObject({ ok: false, cCode: 'UNVERIFIED' });
      const missing = venueGate({ success: true, data: [[part1Current], legacyChain()] }, { partStatus: { success: true, data: [] } });
      await expect(missing.gate.assertTranscriptComplete(SES, 'publish')).resolves.toMatchObject({ ok: false, cCode: 'UNVERIFIED' });
    });

    it('the acknowledgement of a W part is not recorded when the part-status read fails', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined);
      const rows = [
        part(1, SES, 'NEEDS_ACK', 'W', { nPartNo: 1 }),
        part(2, PART2, 'NOT_GATED', null, { nPartNo: 2, cFeedSource: 'D', bGated: false }),
      ];
      const { gate, calls } = venueGate({ success: true, data: [[r1('NEEDS_ACK', 'W', { nPartNo: 1 })], rows] }, { partStatus: { success: false, error: 'db down' } });
      await expect(gate.assertTranscriptComplete(SES, 'publish', { acknowledgeWarnings: true, nMasterid: ADMIN })).resolves.toMatchObject({ ok: false, cCode: 'UNVERIFIED' });
      expect(calls.map((c) => c[1])).not.toContain('rtedge_warn_ack');
    });

    it('an export of Part 1 reads Part 1 only: no part-status read', async () => {
      const { gate, calls } = venueGate({ success: true, data: [[part1Current], legacyChain()] }, { partStatus: partStatuses({ [PART2]: 'R' }) });
      await expect(gate.assertTranscriptComplete(SES, 'export')).resolves.toMatchObject({ ok: true });
      expect(calls.map((c) => c[1])).not.toContain(PARTS_STATUS_SQL);
    });
  });
});

describe('the gate helpers', () => {
  it('evaluateCompleteness without a part list treats the session as its only part', () => {
    const verdict = evaluateCompleteness({ nSesid: SES, purpose: 'publish', current: r1('AWAITING_SEAL', 'S') });
    expect(verdict).toMatchObject({ ok: false, cCode: 'AWAITING_SEAL', blockingPartNo: null });
    expect(verdict.parts).toHaveLength(1);
  });

  it('toBlockedResponse keeps today\'s {msg:-1, value, error} and adds the gate detail', () => {
    const verdict = evaluateCompleteness({ nSesid: SES, purpose: 'export', current: r1('AWAITING_SEAL', 'S') });
    expect(toBlockedResponse(verdict)).toEqual({
      msg: -1,
      value: 'Waiting for the venue box to upload. Exporting is blocked until the transcript is complete.',
      error: 'Waiting for the venue box to upload. Exporting is blocked until the transcript is complete.',
      cCode: 'AWAITING_SEAL',
      bGated: true,
      cSyncState: 'S',
      nBlockingPartNo: null,
      incidents: [],
      parts: verdict.parts,
    });
  });

  it('watermarkText, liveStampText and blockMessage', () => {
    expect(watermarkText([{ nPartNo: null, nOrder: 1, note: null }], false)).toBe('INCOMPLETE — venue data missing');
    expect(watermarkText([{ nPartNo: 1, nOrder: 1, note: 'venue data missing 10:00-10:05' }, { nPartNo: 3, nOrder: 3 }], true))
      .toBe('INCOMPLETE — Part 1: venue data missing 10:00-10:05; Part 3: venue data missing');
    expect(liveStampText(new Date(2026, 0, 2, 3, 4, 5))).toBe('Live — as of 03:04:05');
    expect(blockMessage('AWAITING_SEAL', 'publish', { partNo: 2 })).toBe('Part 2: Waiting for the venue box to upload. Publishing is blocked until the transcript is complete.');
  });

  it('ungatedPartIds names the not-gated parts of a split hearing, for a publish only', () => {
    const current = r1('COMPLETE', 'K');
    const rows = [part(1, SES, 'COMPLETE', 'K'), part(2, PART2, 'NOT_GATED', null, { bGated: false })];
    expect(ungatedPartIds('publish', current, rows)).toEqual([PART2]);
    expect(ungatedPartIds('export', current, rows)).toEqual([]);
    expect(ungatedPartIds('publish', current, [rows[0]])).toEqual([]);
    expect(ungatedPartIds('publish', current, undefined)).toEqual([]);
    // The current part's own verdict comes from r1.
    const legacyCurrent = r1('NOT_GATED', null, { bEverEdge: false, cFeedSource: 'D' });
    expect(ungatedPartIds('publish', legacyCurrent, [part(1, PART1, 'COMPLETE', 'K'), part(2, SES, 'COMPLETE', null)])).toEqual([SES]);
  });

  it('evaluateCompleteness counts a not-gated part of a split publish as not ended unless endedParts lists it (fail closed)', () => {
    const rows = [part(1, SES, 'COMPLETE', 'K'), part(2, PART2, 'NOT_GATED', null, { cFeedSource: 'D', bGated: false })];
    const unknown = evaluateCompleteness({ nSesid: SES, purpose: 'publish', current: r1('COMPLETE', 'K'), parts: rows });
    expect(unknown).toMatchObject({ ok: false, cCode: 'LIVE', blockingPartNo: 2 });
    const ended = evaluateCompleteness({ nSesid: SES, purpose: 'publish', current: r1('COMPLETE', 'K'), parts: rows, endedParts: new Set([PART2]) });
    expect(ended).toMatchObject({ ok: true });
    const exported = evaluateCompleteness({ nSesid: SES, purpose: 'export', current: r1('COMPLETE', 'K'), parts: rows });
    expect(exported).toMatchObject({ ok: true });
  });

  it("blockMessage for LIVE: the venue wording, or a plain 'End it' for a part with no venue box", () => {
    expect(blockMessage('LIVE', 'publish')).toBe('The session is still live. End it and wait for the venue box to upload before publishing.');
    expect(blockMessage('LIVE', 'publish', { partNo: 2, venue: false })).toBe('Part 2: The session is still live. End it before publishing.');
  });

  it('isEndedRow: C or P, or both publish flags on any status; anything else (R, A, null, one flag, no row) is not ended', () => {
    expect(isEndedRow({ cStatus: 'C' })).toBe(true);
    expect(isEndedRow({ cStatus: 'P' })).toBe(true);
    expect(isEndedRow({ cStatus: 'p ' })).toBe(true);
    expect(isEndedRow({ cStatus: 'R', isTranscript: true, isUploaded: true })).toBe(true);
    expect(isEndedRow({ cStatus: 'R', isTranscript: 't', isUploaded: 't' })).toBe(true);
    expect(isEndedRow({ cStatus: 'R', isTranscript: true, isUploaded: false })).toBe(false);
    expect(isEndedRow({ cStatus: 'R' })).toBe(false);
    expect(isEndedRow({ cStatus: 'A' })).toBe(false);
    expect(isEndedRow({ cStatus: null })).toBe(false);
    expect(isEndedRow(null)).toBe(false);
  });

  it('detailPartIds names the other parts whose incidents (W) or seal note (F) a publish needs, never the requested one, never for an export', () => {
    const current = r1('COMPLETE', 'K');
    const rows = [part(1, SES, 'COMPLETE', 'K'), part(2, PART1, 'NEEDS_ACK', 'W'), part(3, PART2, 'FORCED', 'F')];
    expect(detailPartIds('publish', current, rows)).toEqual([PART1, PART2]);
    expect(detailPartIds('export', current, rows)).toEqual([]);
    expect(detailPartIds('publish', r1('NEEDS_ACK', 'W'), [part(1, SES, 'NEEDS_ACK', 'W'), part(2, PART2, 'COMPLETE', 'K')])).toEqual([]);
    expect(detailPartIds('publish', r1('NEEDS_ACK', 'W'), [part(1, SES, 'NEEDS_ACK', 'W'), part(2, PART2, 'ACKED', 'W')])).toEqual([]);
    expect(detailPartIds('publish', current, [rows[0]])).toEqual([]);
    expect(detailPartIds('publish', current, undefined)).toEqual([]);
  });

  it("evaluateCompleteness takes another part's incidents and seal note from `details`, and lists the blocking part's incidents", () => {
    const details = { [PART1]: { jIncidents: '[{"kind":"CONCURRENT_CAT"}]', cSealNote: 'venue data missing 11:00-11:05' } };
    const forced = evaluateCompleteness({
      nSesid: SES, purpose: 'publish', current: r1('COMPLETE', 'K', { nPartNo: 2, jIncidents: [{ kind: 'MINE' }] }),
      parts: [part(1, PART1, 'FORCED', 'F'), part(2, SES, 'COMPLETE', 'K')], details,
    });
    expect(forced).toMatchObject({ ok: true, watermark: 'INCOMPLETE — Part 1: venue data missing 11:00-11:05', incidents: [{ kind: 'MINE' }] });
    expect(forced.parts[0]).toMatchObject({ nSesid: PART1, incidents: [{ kind: 'CONCURRENT_CAT' }], cSealNote: 'venue data missing 11:00-11:05' });
    const waiting = evaluateCompleteness({
      nSesid: SES, purpose: 'publish', current: r1('COMPLETE', 'K', { nPartNo: 2, jIncidents: [{ kind: 'MINE' }] }),
      parts: [part(1, PART1, 'NEEDS_ACK', 'W'), part(2, SES, 'COMPLETE', 'K')], details,
    });
    expect(waiting).toMatchObject({ ok: false, cCode: 'NEEDS_ACK', blockingPartNo: 1, incidents: [{ kind: 'CONCURRENT_CAT' }] });
  });

  it('evaluateCompleteness with deferAck names a NEEDS_ACK part as the blocker only when nothing else blocks', () => {
    const rows = [part(1, PART1, 'NEEDS_ACK', 'W'), part(2, SES, 'NOT_GATED', null, { cFeedSource: 'D', bGated: false })];
    const current = r1('NOT_GATED', null, { cFeedSource: 'D', bEverEdge: false, nPartNo: 2 });
    expect(evaluateCompleteness({ nSesid: SES, purpose: 'publish', current, parts: rows })).toMatchObject({ cCode: 'NEEDS_ACK', blockingPartNo: 1 });
    expect(evaluateCompleteness({ nSesid: SES, purpose: 'publish', current, parts: rows, deferAck: true })).toMatchObject({ cCode: 'LIVE', blockingPartNo: 2 });
    expect(evaluateCompleteness({ nSesid: SES, purpose: 'publish', current, parts: rows, deferAck: true, endedParts: new Set([SES]) })).toMatchObject({ cCode: 'NEEDS_ACK', blockingPartNo: 1 });
  });

  it('acknowledgementRequested reads only an explicit bAckWarnings', () => {
    expect(acknowledgementRequested({ bAckWarnings: true })).toBe(true);
    expect(acknowledgementRequested({ bAckWarnings: 'true' })).toBe(true);
    expect(acknowledgementRequested({ bAckWarnings: 1 })).toBe(false);
    expect(acknowledgementRequested({})).toBe(false);
    expect(acknowledgementRequested(null)).toBe(false);
  });
});

describe('endedAmong: one status read for the not-gated parts', () => {
  it('reads each id once, lower case, and answers which ended', async () => {
    const { gate, calls } = build({ partStatus: partStatuses({ [PART2]: 'R' }) });
    const res = await gate.endedAmong([PART1.toUpperCase(), PART1, PART2]);
    expect(calls).toEqual([['rowQuery', PARTS_STATUS_SQL, [[PART1, PART2]]]]);
    expect(res).toEqual({ ended: new Set([PART1]) });
  });

  it('a non-UUID id is an error and reads nothing', async () => {
    const { gate, calls } = build();
    await expect(gate.endedAmong(['x'])).resolves.toEqual({ error: 'a part id is not a UUID' });
    expect(calls).toEqual([]);
  });
});

describe('uploadPending (session/realtimedatabysesid, spec 4.4)', () => {
  it('a non-venue session: { gated: false } after the provenance read alone, no SP', async () => {
    const { gate, calls } = build();
    await expect(gate.uploadPending(SES)).resolves.toEqual({ gated: false });
    expect(calls).toEqual([['rowQuery', SESSION_PROVENANCE_SQL, [SES]]]);
  });

  it.each([['L', true], ['S', true], ['K', false], ['W', false], ['F', false]])(
    "a venue session in '%s': uploadPending %s, from bUploadPending of the export read",
    async (state, pending) => {
      const { gate, calls } = venueGate(one(r1('COMPLETE', state)));
      await expect(gate.uploadPending(SES)).resolves.toEqual({ gated: true, uploadPending: pending });
      expect(calls).toEqual([
        ['rowQuery', SESSION_PROVENANCE_SQL, [SES]],
        ['executeRef', 'rt_transcript_completeness', { nSesid: SES, cPurpose: 'X', ref: 2 }],
      ]);
    },
  );

  it('a failed provenance read cannot tell: { gated: false, error }', async () => {
    const { gate } = build({ provenance: { success: false, error: 'db down' } });
    await expect(gate.uploadPending(SES)).resolves.toEqual({ gated: false, error: 'db down' });
  });

  it('a venue session whose state cannot be read says uploadPending true (fail closed)', async () => {
    const failed = venueGate({ success: false, error: 'down' });
    await expect(failed.gate.uploadPending(SES)).resolves.toEqual({ gated: true, uploadPending: true, error: 'down' });
    const notFound = venueGate({ success: true, data: [[{ msg: -1, value: 'Session not found', cCode: 'NOT_FOUND', bOk: false }], []] });
    await expect(notFound.gate.uploadPending(SES)).resolves.toEqual({ gated: true, uploadPending: true, error: 'NOT_FOUND' });
  });

  describe('the provenance is remembered per session (one read a minute, not one per fetch)', () => {
    const provenanceReads = (calls: any[][]) => calls.filter((c) => c[1] === SESSION_PROVENANCE_SQL).length;

    it('a non-venue session is read once a minute, whatever the letter case of the id', async () => {
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(T0);
      const { gate, calls } = build();
      await expect(gate.uploadPending(SES)).resolves.toEqual({ gated: false });
      nowSpy.mockReturnValue(T0 + READER_UNGATED_TTL_MS - 1);
      await expect(gate.uploadPending(SES.toUpperCase())).resolves.toEqual({ gated: false });
      expect(provenanceReads(calls)).toBe(1);
      nowSpy.mockReturnValue(T0 + READER_UNGATED_TTL_MS);
      await gate.uploadPending(SES);
      expect(provenanceReads(calls)).toBe(2);
    });

    it('a venue session keeps its verdict for ten minutes; its state is still read on every fetch', async () => {
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(T0);
      let state = 'L';
      const { gate, calls } = venueGate(() => one(r1('LIVE', state)));
      await expect(gate.uploadPending(SES)).resolves.toEqual({ gated: true, uploadPending: true });
      state = 'K';
      nowSpy.mockReturnValue(T0 + READER_GATED_TTL_MS - 1);
      await expect(gate.uploadPending(SES)).resolves.toEqual({ gated: true, uploadPending: false });
      expect(provenanceReads(calls)).toBe(1);
      expect(calls.filter((c) => c[1] === 'rt_transcript_completeness')).toHaveLength(2);
      nowSpy.mockReturnValue(T0 + READER_GATED_TTL_MS);
      await gate.uploadPending(SES);
      expect(provenanceReads(calls)).toBe(2);
    });

    it('concurrent fetches of one session share one read', async () => {
      const { gate, calls } = build();
      await Promise.all([gate.uploadPending(SES), gate.uploadPending(SES), gate.uploadPending(SES)]);
      expect(provenanceReads(calls)).toBe(1);
    });

    it('a failed read is not remembered: the next fetch reads again', async () => {
      const { gate, calls } = build({ provenance: { success: false, error: 'db down' } });
      await expect(gate.uploadPending(SES)).resolves.toEqual({ gated: false, error: 'db down' });
      await expect(gate.uploadPending(SES)).resolves.toEqual({ gated: false, error: 'db down' });
      expect(provenanceReads(calls)).toBe(2);
    });

    it('before the migration: today\'s answer with no error, and one failing read a minute for every session', async () => {
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(T0);
      const { gate, calls } = build({ provenance: { success: false, error: 'column "bEverEdge" does not exist' } });
      for (const id of [SES, PART1, PART2, SES]) await expect(gate.uploadPending(id)).resolves.toEqual({ gated: false });
      expect(provenanceReads(calls)).toBe(1);
      nowSpy.mockReturnValue(T0 + PRE_MIGRATION_RECHECK_MS);
      await gate.uploadPending(SES);
      expect(provenanceReads(calls)).toBe(2);
    });

    it('the publish and export gates still read the provenance afresh every time', async () => {
      const { gate, calls } = build();
      await gate.uploadPending(SES);
      await gate.assertTranscriptComplete(SES, 'publish');
      await gate.assertTranscriptComplete(SES, 'export');
      expect(provenanceReads(calls)).toBe(3);
    });
  });
});

describe('requestEnd and isSealed', () => {
  it('requestEnd calls et_rtedge_session_end (with the acting user when known) and returns its row', async () => {
    const row = { msg: 1, bGated: true, bPending: true, bSealed: false, bChanged: true, nSesid: SES, cSyncState: 'S', cFeedSource: 'E', nEdgeid: BOX };
    const { gate, calls } = build({ sessionEnd: { success: true, data: [[row]] } });
    await expect(gate.requestEnd(SES)).resolves.toEqual({ row });
    await expect(gate.requestEnd(SES, ADMIN)).resolves.toEqual({ row });
    expect(calls).toEqual([
      ['executeRef', 'rtedge_session_end', { nSesid: SES }],
      ['executeRef', 'rtedge_session_end', { nSesid: SES, nMasterid: ADMIN }],
    ]);
  });

  it('requestEnd reports a failed or empty SP as an error', async () => {
    await expect(build({ sessionEnd: { success: false, error: 'boom' } }).gate.requestEnd(SES)).resolves.toEqual({ error: 'boom' });
    await expect(build({ sessionEnd: { success: true, data: [[]] } }).gate.requestEnd(SES)).resolves.toEqual({ error: 'et_rtedge_session_end returned no row' });
  });

  it.each([['K', true], ['W', true], ['F', true], ['S', false], ['L', false]])('isSealed for %s is %s: one plain read of the row, never the completeness SP', async (state, sealed) => {
    const { gate, calls } = build({ syncState: { success: true, data: [{ cSyncState: state }] } });
    await expect(gate.isSealed(SES)).resolves.toEqual({ sealed, cSyncState: state });
    expect(calls).toEqual([['rowQuery', 'SELECT "cSyncState" FROM "RSessionMaster" WHERE "nSesid" = $1 LIMIT 1', [SES]]]);
  });

  it('isSealed reads a soft-deleted row too: a deleted venue session that sealed is sealed (the SP would say NOT_FOUND)', async () => {
    const { gate, calls } = build({
      syncState: { success: true, data: [{ cSyncState: 'K ' }] },
      completeness: { success: true, data: [[{ msg: -1, value: 'Session not found', cCode: 'NOT_FOUND', bOk: false }], []] },
    });
    await expect(gate.isSealed(SES)).resolves.toEqual({ sealed: true, cSyncState: 'K' });
    expect(calls.map((c) => c[0])).toEqual(['rowQuery']);
  });

  it('isSealed: no row, no state, or a value that is not a UUID is not sealed; a failed read is the error', async () => {
    await expect(build({ syncState: { success: true, data: [] } }).gate.isSealed(SES)).resolves.toEqual({ sealed: false, cSyncState: null });
    await expect(build({ syncState: { success: true, data: [{ cSyncState: null }] } }).gate.isSealed(SES)).resolves.toEqual({ sealed: false, cSyncState: null });
    const bad = build();
    await expect(bad.gate.isSealed('not-a-session')).resolves.toEqual({ sealed: false, cSyncState: null });
    expect(bad.calls).toEqual([]);
    await expect(build({ syncState: { success: false, error: 'down' } }).gate.isSealed(SES)).resolves.toEqual({ sealed: false, error: 'down' });
    await expect(build({ syncState: () => { throw new Error('pool closed'); } }).gate.isSealed(SES)).resolves.toEqual({ sealed: false, error: 'pool closed' });
  });
});
