import * as childProcess from 'child_process';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '@nestjs/common';
import { ConversionJsService } from '../conversion.js/conversion.js.service';
import { TranscriptpublishService, exportMarksFor } from '../transcript/transcript_publish.service';
import { PARTS_STATUS_SQL, SESSION_PROVENANCE_SQL } from './transcript-completeness.service';

/*
 * D16 caller specs for TranscriptpublishService (spec 4.4, 6.3 RC-4; plan R-T4; O-4): where the gate sits in
 * POST transcript/publish and in the transcript export (transcript/annothighlightexport), for non-venue and
 * venue sessions, and that a gated export's watermark / live stamp reaches the rendered HTML. fs, the Python
 * transfer (child_process.spawn), Kafka and the DB are stubs recording into one list; nothing touches disk.
 */

const SES = '5e551011-0000-4000-8000-0000000000a7';
const PART1 = '5e551011-0000-4000-8000-0000000000a6';
const ROW_SES = '5e551011-0000-4000-8000-0000000000a8';
const NAV_SES = '5e551011-0000-4000-8000-0000000000a9';
const CASE = 'ca5e1011-0000-4000-8000-0000000000a7';
const TRANS = '7a5e1011-0000-4000-8000-0000000000a7';
const ME = '11111111-1111-4111-8111-111111111111';

const NON_VENUE = { bEverEdge: false, cApply: null, nPrevPartSesid: null };
const VENUE = { bEverEdge: true, cApply: null, nPrevPartSesid: null };

const ROOT = 'rt-d16-publish';
const BASE = `${ROOT}/realtime-transcripts/`;
const CPATH = `t_${TRANS}.TXT`;
const FILE = BASE + CPATH;
const JSON_PATH = `${BASE}t_${TRANS}.json`;
const CONFIG: Record<string, string> = {
  REALTIME_PATH: BASE, ASSETS: `${ROOT}/assets`, pythonV: 'python3', PY_ANNOT_TRANSFER_BY_TRANSCRIPT: 'run3.py',
  DB_DATABASE: 'd', DB_USERNAME: 'u', DB_PASSWORD: 'p', DB_HOST: 'h', DB_PORT: '5432',
};

type Call = [string, ...any[]];

/** r1 / r2 of et_rt_transcript_completeness for one session (an unsplit hearing unless parts are given). */
const completeness = (nSesid: string, cReason: string, cSyncState: string | null, extra: Record<string, any> = {}, parts?: any[]) => ({
  success: true,
  data: [
    [{ msg: 1, value: cReason, nSesid, cReason, cSyncState, cFeedSource: 'E', bEverEdge: true, jIncidents: [], cSealNote: null, ...extra }],
    parts ?? [{ nOrder: 1, nSesid, nPartNo: null, cFeedSource: 'E', cSyncState, cReason, nPendingOrphans: 0, bCurrent: true }],
  ],
});

const PUBLISHED_ROW = { msg: 1, value: 'Transcript published', nSesid: SES };
const publishBody = (extra: Record<string, any> = {}) =>
  ({ cTransid: TRANS, cPath: CPATH, nCaseid: CASE, nSesid: SES, nMasterid: ME, isIgnoreErr: false, errorCount: 0, ...extra }) as any;

const isOurs = (p: any) => String(p).replace(/\\/g, '/').includes(ROOT) || String(p).replace(/\\/g, '/').startsWith('data/');

function build(opts: { provenance?: Record<string, any>; status?: Record<string, string>; sp?: Record<string, any>; json?: any } = {}) {
  const calls: Call[] = [];
  const realExists = fs.existsSync;
  const realRead = fs.readFileSync;
  const realReaddir = fs.readdirSync;
  jest.spyOn(fs, 'existsSync').mockImplementation(((p: any) => {
    if (!isOurs(p)) return realExists(p);
    calls.push(['fs.existsSync', p]);
    return true;
  }) as any);
  jest.spyOn(fs, 'readFileSync').mockImplementation(((p: any, ...rest: any[]) => {
    if (!isOurs(p)) return (realRead as any)(p, ...rest);
    calls.push(['fs.readFileSync', p]);
    if (p === JSON_PATH) return JSON.stringify(opts.json ?? [{ pageno: 1, lineno: 1, timestamp: '10:00:01', linetext: 'Good morning.' }]);
    const file = path.basename(String(p));
    if (file === 'page_1.json') return JSON.stringify([['10:00:01:00', Array.from('Closed line').map((c) => c.charCodeAt(0)), 0, 'C', 0, 0, 'u1']]);
    throw new Error(`unexpected read of ${p}`);
  }) as any);
  jest.spyOn(fs, 'readdirSync').mockImplementation(((p: any, ...rest: any[]) => {
    if (!isOurs(p)) return (realReaddir as any)(p, ...rest);
    calls.push(['fs.readdirSync', p]);
    return ['page_1.json'];
  }) as any);
  jest.spyOn(fs, 'copyFile').mockImplementation(((src: any, dest: any, cb: any) => { calls.push(['fs.copyFile', src, dest]); cb(null); }) as any);
  jest.spyOn(fs, 'unlinkSync').mockImplementation(((p: any) => { calls.push(['fs.unlinkSync', p]); }) as any);
  jest.spyOn(childProcess, 'spawn').mockImplementation(((cmd: string, args: string[]) => {
    calls.push(['spawn', cmd, args[1]]);
    const proc: any = new EventEmitter();
    proc.stdout = new EventEmitter();
    proc.stderr = new EventEmitter();
    setImmediate(() => proc.emit('close', 0));
    return proc;
  }) as any);

  const db = {
    rowQuery: jest.fn(async (sql: string, params: any[]) => {
      calls.push(['db.rowQuery', sql, params]);
      // The O-4 part-status read: every part ended ('C') unless `status` says otherwise.
      if (sql === PARTS_STATUS_SQL) return { success: true, data: params[0].map((id: string) => ({ nSesid: id, cStatus: opts.status?.[id] ?? 'C' })) };
      if (sql !== SESSION_PROVENANCE_SQL) throw new Error(`unexpected query ${sql}`);
      return { success: true, data: [opts.provenance?.[params[0]] ?? NON_VENUE] };
    }),
    executeRef: jest.fn(async (name: string, body: any, ...rest: any[]) => {
      calls.push(['db.executeRef', name, { ...body }, ...rest]);
      const answer = opts.sp?.[name];
      if (answer === undefined) throw new Error(`unexpected SP ${name}`);
      return typeof answer === 'function' ? answer(body) : answer;
    }),
  };
  const kafka = { sendMessage: jest.fn((topic: string, value: any) => { calls.push(['kafka', value?.data?.data?.status]); }) };
  const annotTransfer = { notifyTransferComplete: jest.fn((nSesid: string) => { calls.push(['annotTransfer.notifyTransferComplete', nSesid]); }) };
  const saved: string[] = [];
  const transService = {
    savehtmlToFile: jest.fn(async (html: string, file: string) => { saved.push(html); calls.push(['transService.savehtmlToFile', file]); }),
    getThemeDetail: jest.fn(async () => ({})),
  };
  const htmlService = { generateHtml: jest.fn(() => '<html><body><p>Transcript</p></body></html>') };
  const feedData = { readSessionData: jest.fn(async (nSesid: string) => { calls.push(['feedData.readSessionData', nSesid]); return { 1: [['11:00:01:00', [76], 0, 'C', 0, 0, 'm1']] }; }) };
  const log = { info: jest.fn(), error: jest.fn(), debug: jest.fn(), warn: jest.fn() };
  const config = { get: (key: string) => CONFIG[key] };

  // Constructor order: config, db, log, htmlService, transService, kafka, verifier, copier, utilityService,
  // conversion, feedData, wordIndexService, annotTransferService.
  const svc = new TranscriptpublishService(
    config as any, db as any, log as any, htmlService as any, transService as any, kafka as any,
    {} as any, {} as any, {} as any, new ConversionJsService(), feedData as any, {} as any, annotTransfer as any,
  );
  return { calls, db, kafka, log, saved, htmlService, svc };
}

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
});
afterEach(() => jest.restoreAllMocks());

describe('transcriptPublish with the D16 gate', () => {
  const head: Call[] = [['fs.existsSync', FILE], ['fs.existsSync', JSON_PATH], ['fs.readFileSync', JSON_PATH]];
  const tail: Call[] = [
    ['kafka', 'P'],
    ['fs.copyFile', FILE, `${BASE}s_${SES}.TXT`],
    ['spawn', 'python3', SES],
    ['annotTransfer.notifyTransferComplete', SES],
    ['db.executeRef', 'transcript_publish', publishBody(), 'transcript'],
    ['kafka', 'S'],
  ];

  it('a non-venue session: one provenance read after the transcript checks, before anything is announced; the answer is unchanged', async () => {
    const { calls, svc } = build({ sp: { transcript_publish: { success: true, data: [[PUBLISHED_ROW]] } } });
    await expect(svc.transcriptPublish(publishBody(), '')).resolves.toEqual(PUBLISHED_ROW);
    expect(calls).toEqual([...head, ['db.rowQuery', SESSION_PROVENANCE_SQL, [SES]], ...tail]);
  });

  it('a transcript that fails its own checks is refused before the gate reads anything', async () => {
    const { calls, svc } = build({ json: [{ pageno: 1, lineno: 1, linetext: 'untimed' }] });
    await expect(svc.transcriptPublish(publishBody(), '')).resolves.toMatchObject({ msg: -1, value: 'Missing timestamps or text in: Page: 1, Line: 1' });
    expect(calls).toEqual(head);
  });

  it("a venue session still 'S' is refused: nothing announced, copied, transferred or published", async () => {
    const { calls, log, svc } = build({ provenance: { [SES]: VENUE }, sp: { rt_transcript_completeness: completeness(SES, 'AWAITING_SEAL', 'S') } });
    const res = await svc.transcriptPublish(publishBody(), '');
    expect(res).toMatchObject({
      msg: -1, cCode: 'AWAITING_SEAL', bGated: true, cSyncState: 'S',
      value: 'Waiting for the venue box to upload. Publishing is blocked until the transcript is complete.',
      error: 'Waiting for the venue box to upload. Publishing is blocked until the transcript is complete.',
    });
    expect(calls).toEqual([
      ...head,
      ['db.rowQuery', SESSION_PROVENANCE_SQL, [SES]],
      ['db.executeRef', 'rt_transcript_completeness', { nSesid: SES, cPurpose: 'P', ref: 2 }],
    ]);
    expect(log.error).toHaveBeenCalledWith(expect.stringContaining('Publish blocked (AWAITING_SEAL)'), `realtime/transcript/${TRANS}`);
  });

  it("a complete ('K') venue session publishes as today and reports its parts", async () => {
    const { calls, svc } = build({
      provenance: { [SES]: VENUE },
      sp: { rt_transcript_completeness: completeness(SES, 'COMPLETE', 'K'), transcript_publish: { success: true, data: [[PUBLISHED_ROW]] } },
    });
    const res = await svc.transcriptPublish(publishBody(), '');
    expect(res).toMatchObject({ ...PUBLISHED_ROW, completeness: { bGated: true, cSyncState: 'K', bIncomplete: false, cWatermark: null } });
    expect(res.completeness.parts).toEqual([expect.objectContaining({ nSesid: SES, cReason: 'COMPLETE', bPasses: true })]);
    expect(calls.slice(-6)).toEqual(tail);
  });

  it("'F' publishes with the INCOMPLETE watermark flag", async () => {
    const { svc } = build({
      provenance: { [SES]: VENUE },
      sp: {
        rt_transcript_completeness: completeness(SES, 'FORCED', 'F', { cSealNote: 'venue data missing 11:00:00-11:30:00' }),
        transcript_publish: { success: true, data: [[PUBLISHED_ROW]] },
      },
    });
    await expect(svc.transcriptPublish(publishBody(), '')).resolves.toMatchObject({
      msg: 1, completeness: { bIncomplete: true, cWatermark: 'INCOMPLETE — venue data missing 11:00:00-11:30:00' },
    });
  });

  it("'W' is refused without the acknowledgement flag and published with it (recorded for the token user)", async () => {
    const sp = {
      rt_transcript_completeness: completeness(SES, 'NEEDS_ACK', 'W', { jIncidents: [{ kind: 'CONCURRENT_CAT' }] }),
      rtedge_warn_ack: { success: true, data: [[{ msg: 1 }]] },
      transcript_publish: { success: true, data: [[PUBLISHED_ROW]] },
    };
    const refused = build({ provenance: { [SES]: VENUE }, sp });
    await expect(refused.svc.transcriptPublish(publishBody(), '')).resolves.toMatchObject({ msg: -1, cCode: 'NEEDS_ACK', incidents: [{ kind: 'CONCURRENT_CAT' }] });
    expect(refused.calls.map((c) => c[0])).not.toContain('spawn');
    jest.restoreAllMocks();

    const acked = build({ provenance: { [SES]: VENUE }, sp });
    await expect(acked.svc.transcriptPublish(publishBody({ bAckWarnings: true }), '')).resolves.toMatchObject({ msg: 1, completeness: { acknowledged: [SES] } });
    expect(acked.calls).toContainEqual(['db.executeRef', 'rtedge_warn_ack', { nSesid: SES, nMasterid: ME }]);
  });

  it('a later part of a split hearing waits for Part 1, listing the parts in order (O-4)', async () => {
    const parts = [
      { nOrder: 2, nSesid: SES, nPartNo: 2, cFeedSource: 'D', cSyncState: null, cReason: 'NOT_GATED', nPendingOrphans: 0, bCurrent: true },
      { nOrder: 1, nSesid: PART1, nPartNo: 1, cFeedSource: 'E', cSyncState: 'S', cReason: 'AWAITING_SEAL', nPendingOrphans: 0, bCurrent: false },
    ];
    const { calls, svc } = build({
      provenance: { [SES]: { bEverEdge: false, cApply: 'L', nPrevPartSesid: PART1 } },
      sp: { rt_transcript_completeness: completeness(SES, 'NOT_GATED', null, { cFeedSource: 'D', bEverEdge: false, nPartNo: 2, nPrevPartSesid: PART1 }, parts) },
    });
    const res = await svc.transcriptPublish(publishBody(), '');
    expect(res).toMatchObject({
      msg: -1, cCode: 'AWAITING_SEAL', nBlockingPartNo: 1,
      value: 'Part 1: Waiting for the venue box to upload. Publishing is blocked until the transcript is complete.',
    });
    expect(res.parts.map((p: any) => [p.nPartNo, p.nSesid])).toEqual([[1, PART1], [2, SES]]);
    expect(calls.map((c) => c[0])).not.toContain('kafka');
  });

  describe("a split hearing whose Part 2 is the default cloud-direct legacy part (cApply 'L', never gated)", () => {
    const PART2 = '5e551011-0000-4000-8000-0000000000b2';
    /** SES is the sealed venue Part 1; Part 2 has no cSyncState, so the SP calls it NOT_GATED. */
    const sp = (extra: Record<string, any> = {}) => ({
      rt_transcript_completeness: completeness(SES, 'COMPLETE', 'K', { nPartNo: 1, nNextPartSesid: PART2 }, [
        { nOrder: 1, nSesid: SES, nPartNo: 1, cFeedSource: 'E', cSyncState: 'K', cReason: 'COMPLETE', nPendingOrphans: 0, bCurrent: true },
        { nOrder: 2, nSesid: PART2, nPartNo: 2, cFeedSource: 'D', cSyncState: null, cReason: 'NOT_GATED', nPendingOrphans: 0, bCurrent: false },
      ]),
      ...extra,
    });

    it('a publish of the sealed Part 1 is refused while Part 2 is still recording: nothing announced, copied or published', async () => {
      const { calls, svc } = build({ provenance: { [SES]: VENUE }, status: { [PART2]: 'R' }, sp: sp() });
      const res = await svc.transcriptPublish(publishBody(), '');
      expect(res).toMatchObject({
        msg: -1, cCode: 'LIVE', nBlockingPartNo: 2, bGated: true,
        value: 'Part 2: The session is still live. End it before publishing.',
      });
      expect(res.parts.map((p: any) => [p.nPartNo, p.cReason, p.bPasses])).toEqual([[1, 'COMPLETE', true], [2, 'LIVE', false]]);
      expect(calls).toEqual([
        ...head,
        ['db.rowQuery', SESSION_PROVENANCE_SQL, [SES]],
        ['db.executeRef', 'rt_transcript_completeness', { nSesid: SES, cPurpose: 'P', ref: 2 }],
        ['db.rowQuery', PARTS_STATUS_SQL, [[PART2]]],
      ]);
    });

    it('publishes once Part 2 has ended, listing both parts in order', async () => {
      const { calls, svc } = build({ provenance: { [SES]: VENUE }, sp: sp({ transcript_publish: { success: true, data: [[PUBLISHED_ROW]] } }) });
      const res = await svc.transcriptPublish(publishBody(), '');
      expect(res).toMatchObject({ ...PUBLISHED_ROW, completeness: { bGated: true, bIncomplete: false } });
      expect(res.completeness.parts.map((p: any) => [p.nPartNo, p.cReason, p.bPasses])).toEqual([[1, 'COMPLETE', true], [2, 'NOT_GATED', true]]);
      expect(calls.slice(-6)).toEqual(tail);
    });
  });
});

describe('the transcript export (getAnnotHighlightExport) with the D16 gate', () => {
  const DT_DIR = path.join('data', `dt_${SES}`);
  const caseRow = (cStatus: string) => ({ nSesid: ROW_SES, cStatus, cCasename: 'Smith v Jones', cName: 'Day 3' });
  const FORM_ROW = { cTransid: TRANS, nSesid: SES, cPath: `t_${TRANS}.json`, cThemeid: null };
  const exportQuery = (extra: Record<string, any> = {}) => ({
    nSessionid: SES, nSesid: NAV_SES, nCaseid: CASE, nUserid: ME, nMasterid: ME, cTranscript: 'N', cIsDemo: 'N',
    jIssues: [], jHIssues: [], jPages: [], bCoverpg: true, cLayout: 'FULL_PAGE', ...extra,
  }) as any;
  const sp = (cStatus: string, extra: Record<string, any> = {}) => ({
    get_transcript_by_sesid: { success: true, data: [[{ msg: 1, cTransid: TRANS, cProtocol: 'C' }]] },
    realtime_export_othercasedetail: { success: true, data: [[caseRow(cStatus)]] },
    get_transcript_detail: { success: true, data: [[{ ...FORM_ROW }]] },
    ...extra,
  });
  const DETAIL = { msg: 1, value: 'Transcript detail generated', path: 'x.pdf', name: 'export.pdf' };
  const stubRenderer = (svc: TranscriptpublishService, calls: Call[], marks: any[]) =>
    jest.spyOn(svc, 'generateTranscriptDetail').mockImplementation((async (body: any) => {
      calls.push(['generateTranscriptDetail']);
      marks.push(exportMarksFor(body));
      return DETAIL;
    }) as any);
  const lead: Call[] = [
    ['db.executeRef', 'get_transcript_by_sesid', exportQuery(), 'transcript'],
    ['db.executeRef', 'realtime_export_othercasedetail', { nCaseid: CASE, nSesid: NAV_SES }],
    ['db.executeRef', 'get_transcript_detail', { ...exportQuery(), cTransid: TRANS, cProtocol: 'C' }, 'transcript'],
  ];

  it("a non-venue closed session: one read of the request's nSessionid before the page files; marks none, answer unchanged", async () => {
    const { calls, svc } = build({ sp: sp('C') });
    const marks: any[] = [];
    stubRenderer(svc, calls, marks);
    await expect(svc.getAnnotHighlightExport(exportQuery(), '')).resolves.toEqual(DETAIL);
    expect(calls).toEqual([
      ...lead,
      ['db.rowQuery', SESSION_PROVENANCE_SQL, [SES]],
      ['fs.readdirSync', DT_DIR],
      ['fs.readFileSync', path.join(DT_DIR, 'page_1.json')],
      ['generateTranscriptDetail'],
    ]);
    expect(marks).toEqual([null]);
  });

  it("a non-venue live session: the read checks the case row's nSesid, the one the feed read takes", async () => {
    const { calls, svc } = build({ sp: sp('R') });
    stubRenderer(svc, calls, []);
    await svc.getAnnotHighlightExport(exportQuery(), '');
    expect(calls.slice(3, 5)).toEqual([['db.rowQuery', SESSION_PROVENANCE_SQL, [ROW_SES]], ['feedData.readSessionData', ROW_SES]]);
  });

  it('the published transcript (cTranscript Y) is not gated: no read', async () => {
    const { calls, svc } = build({ sp: sp('C') });
    (svc as any).transService.getTranscriptFiledata = jest.fn(async () => []);
    stubRenderer(svc, calls, []);
    await svc.getAnnotHighlightExport(exportQuery({ cTranscript: 'Y' }), '');
    expect(calls.map((c) => c[0])).not.toContain('db.rowQuery');
  });

  it("a venue session still 'S' is refused before its page files are read", async () => {
    const { calls, svc } = build({ provenance: { [SES]: VENUE }, sp: sp('C', { rt_transcript_completeness: completeness(SES, 'AWAITING_SEAL', 'S') }) });
    stubRenderer(svc, calls, []);
    await expect(svc.getAnnotHighlightExport(exportQuery(), '')).resolves.toMatchObject({
      msg: -1, cCode: 'AWAITING_SEAL', value: 'Waiting for the venue box to upload. Exporting is blocked until the transcript is complete.',
    });
    expect(calls).toEqual([
      ...lead,
      ['db.rowQuery', SESSION_PROVENANCE_SQL, [SES]],
      ['db.executeRef', 'rt_transcript_completeness', { nSesid: SES, cPurpose: 'X', ref: 2 }],
    ]);
  });

  it("'F' exports with the INCOMPLETE watermark recorded for the renderer and reported in the answer", async () => {
    const { calls, svc } = build({
      provenance: { [SES]: VENUE },
      sp: sp('C', { rt_transcript_completeness: completeness(SES, 'FORCED', 'F', { cSealNote: 'venue data missing 12:00:00-12:10:00' }) }),
    });
    const marks: any[] = [];
    stubRenderer(svc, calls, marks);
    await expect(svc.getAnnotHighlightExport(exportQuery(), '')).resolves.toMatchObject({
      ...DETAIL, completeness: { bIncomplete: true, cWatermark: 'INCOMPLETE — venue data missing 12:00:00-12:10:00' },
    });
    expect(marks).toEqual([{ watermark: 'INCOMPLETE — venue data missing 12:00:00-12:10:00', liveStamp: null }]);
  });

  it("a live venue session ('L') exports with the 'Live - as of' stamp", async () => {
    const { svc, calls } = build({ provenance: { [ROW_SES]: VENUE }, sp: sp('R', { rt_transcript_completeness: completeness(ROW_SES, 'LIVE', 'L') }) });
    const marks: any[] = [];
    stubRenderer(svc, calls, marks);
    await svc.getAnnotHighlightExport(exportQuery(), '');
    expect(marks[0]).toEqual({ watermark: null, liveStamp: expect.stringMatching(/^Live — as of \d\d:\d\d:\d\d$/) });
  });

  it("a complete ('K') venue session exports as today: no marks for the renderer, completeness reported", async () => {
    const { calls, svc } = build({ provenance: { [SES]: VENUE }, sp: sp('C', { rt_transcript_completeness: completeness(SES, 'COMPLETE', 'K') }) });
    const marks: any[] = [];
    stubRenderer(svc, calls, marks);
    const res = await svc.getAnnotHighlightExport(exportQuery(), '');
    expect(res).toMatchObject({
      ...DETAIL,
      completeness: { bGated: true, cSyncState: 'K', bIncomplete: false, cWatermark: null, cLiveStamp: null, acknowledged: [] },
    });
    expect(res.completeness.parts).toEqual([expect.objectContaining({ nSesid: SES, cReason: 'COMPLETE', bPasses: true })]);
    expect(marks).toEqual([null]);
    expect(calls).toEqual([
      ...lead,
      ['db.rowQuery', SESSION_PROVENANCE_SQL, [SES]],
      ['db.executeRef', 'rt_transcript_completeness', { nSesid: SES, cPurpose: 'X', ref: 2 }],
      ['fs.readdirSync', DT_DIR],
      ['fs.readFileSync', path.join(DT_DIR, 'page_1.json')],
      ['generateTranscriptDetail'],
    ]);
  });

  describe("'W' (sealed with warnings) needs the acknowledgement flag", () => {
    const INCIDENTS = [{ kind: 'CONCURRENT_CAT', level: 'warning' }];
    const wSp = () => sp('C', {
      rt_transcript_completeness: completeness(SES, 'NEEDS_ACK', 'W', { jIncidents: INCIDENTS }),
      rtedge_warn_ack: { success: true, data: [[{ msg: 1, value: 'Warnings acknowledged' }]] },
    });

    it('without the flag the export is refused: nothing acknowledged, no page file read, nothing rendered', async () => {
      const { calls, svc } = build({ provenance: { [SES]: VENUE }, sp: wSp() });
      stubRenderer(svc, calls, []);
      await expect(svc.getAnnotHighlightExport(exportQuery(), '')).resolves.toMatchObject({
        msg: -1, cCode: 'NEEDS_ACK', bGated: true, cSyncState: 'W', incidents: INCIDENTS,
        value: 'The venue upload finished with warnings. Acknowledge the listed incidents before exporting.',
      });
      expect(calls).toEqual([
        ...lead,
        ['db.rowQuery', SESSION_PROVENANCE_SQL, [SES]],
        ['db.executeRef', 'rt_transcript_completeness', { nSesid: SES, cPurpose: 'X', ref: 2 }],
      ]);
    });

    it('with the flag the acknowledgement is recorded for the token user (nMasterid), then the export runs', async () => {
      const OTHER = '22222222-2222-4222-8222-222222222222';
      const { calls, svc } = build({ provenance: { [SES]: VENUE }, sp: wSp() });
      const marks: any[] = [];
      stubRenderer(svc, calls, marks);
      const res = await svc.getAnnotHighlightExport(exportQuery({ bAckWarnings: true, nUserid: OTHER }), '');
      expect(res).toMatchObject({ ...DETAIL, completeness: { bGated: true, cSyncState: 'W', acknowledged: [SES], bIncomplete: false } });
      expect(calls.slice(3)).toEqual([
        ['db.rowQuery', SESSION_PROVENANCE_SQL, [SES]],
        ['db.executeRef', 'rt_transcript_completeness', { nSesid: SES, cPurpose: 'X', ref: 2 }],
        ['db.executeRef', 'rtedge_warn_ack', { nSesid: SES, nMasterid: ME }],
        ['fs.readdirSync', DT_DIR],
        ['fs.readFileSync', path.join(DT_DIR, 'page_1.json')],
        ['generateTranscriptDetail'],
      ]);
      expect(marks).toEqual([null]);
    });

    it('with the flag but a refused acknowledgement the export stays blocked', async () => {
      const { calls, svc } = build({
        provenance: { [SES]: VENUE },
        sp: { ...wSp(), rtedge_warn_ack: { success: true, data: [[{ msg: -3, value: 'Admin, case admin or hearing operator rights required', cCode: 'NOT_ALLOWED' }]] } },
      });
      stubRenderer(svc, calls, []);
      await expect(svc.getAnnotHighlightExport(exportQuery({ bAckWarnings: true }), '')).resolves.toMatchObject({ msg: -1, cCode: 'NEEDS_ACK' });
      expect(calls.map((c) => c[0])).not.toContain('generateTranscriptDetail');
    });
  });

  describe('generateTranscriptDetail puts the recorded marks into the HTML it saves', () => {
    const rendererSp = (cStatus: string, extra: Record<string, any> = {}) => sp(cStatus, {
      navigate_get_all: { success: true, data: [[], []] },
      realtime_get_issue_annotation_highlight_export: { success: true, data: [[], []] },
      ...extra,
    });
    const stubPdf = (svc: TranscriptpublishService) => jest.spyOn(svc, 'generatePdf').mockImplementation((async () => false) as any);

    it('a non-venue export saves exactly the HTML the renderer produced', async () => {
      const { saved, svc } = build({ sp: rendererSp('C') });
      stubPdf(svc);
      await svc.getAnnotHighlightExport(exportQuery(), '');
      expect(saved).toEqual(['<html><body><p>Transcript</p></body></html>']);
    });

    it("an 'F' export saves the HTML with the watermark right after <body>", async () => {
      const { saved, svc } = build({
        provenance: { [SES]: VENUE },
        sp: rendererSp('C', { rt_transcript_completeness: completeness(SES, 'FORCED', 'F', { cSealNote: 'venue data missing 12:00:00-12:10:00' }) }),
      });
      stubPdf(svc);
      await svc.getAnnotHighlightExport(exportQuery(), '');
      expect(saved).toHaveLength(1);
      expect(saved[0]).toMatch(/^<html><body><div class="rt-completeness-watermark" style="[^"]+">INCOMPLETE — venue data missing 12:00:00-12:10:00<\/div><p>Transcript<\/p><\/body><\/html>$/);
    });
  });
});
