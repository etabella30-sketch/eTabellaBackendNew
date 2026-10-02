jest.mock('child_process', () => {
  const actual = jest.requireActual('child_process');
  return { ...actual, exec: jest.fn() };
});

import { exec } from 'child_process';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as path from 'path';
import { Logger } from '@nestjs/common';
import { ConversionJsService } from '../conversion.js/conversion.js.service';
import { UtilityService } from '../utility/utility.service';
import { ExportService } from '../export/export.service';
import { SESSION_PROVENANCE_SQL } from './transcript-completeness.service';

/*
 * D16 caller specs for the annotation export behind POST issue/annothighlightexport (ExportService.exportFile;
 * spec 4.4 call site "export.service.ts:33-58"): where the gate sits, which session it checks (the one the
 * feed read takes), and that the INCOMPLETE watermark / live stamp reaches the HTML wkhtmltopdf prints.
 * The real ConversionJsService, UtilityService and HTML renderer run over a stubbed fs; DB, feed store and
 * wkhtmltopdf are stubs recording into one list.
 */

const SES = '5e551011-0000-4000-8000-0000000000b7';
const ROW_SES = '5e551011-0000-4000-8000-0000000000b8';
const CASE = 'ca5e1011-0000-4000-8000-0000000000b7';
const ME = '11111111-1111-4111-8111-111111111111';

const NON_VENUE = { bEverEdge: false, cApply: null, nPrevPartSesid: null };
const VENUE = { bEverEdge: true, cApply: null, nPrevPartSesid: null };

const BASE = 'rt-d16-export/realtime-transcripts/';
const EXPORT_DIR = `${BASE}exports/`;
const TEMPLATE = path.join(EXPORT_DIR, 'htmlTemplate.html');
const OUTPUT_HTML = path.join(EXPORT_DIR, `output${SES}.html`);
const DT_DIR = path.join('data', `dt_${SES}`);
const EXPORTED = { msg: 1, path: `s_${SES}.pdf`, name: 'export.pdf' };
const TEMPLATE_HTML = '<html><body><table><tr><td class="main-content replacable-content"></td></tr></table><div id="main-content-placeholder"></div>';

const codes = (text: string) => Array.from(text).map((c) => c.charCodeAt(0));
const tuple = (time: string, text: string) => [time, codes(text), 0, 'C', 0, 0, 'u1'];

type Call = [string, ...any[]];

const caseRow = (cStatus: string) => ({ nSesid: ROW_SES, cStatus, cCasename: 'Smith v Jones', cName: 'Day 3', dDay: 'Wednesday', dSessionDt: '1 Oct 2026' });
const exportQuery = (extra: Record<string, any> = {}) => ({
  nSessionid: SES, nCaseid: CASE, nUserid: ME, cCasename: 'Day 3', cUsername: 'Jane Doe', cTranscript: 'N', cIsDemo: 'N',
  jIssues: [], jHIssues: [], jPages: [], bCoverpg: true, bQfact: false, bQmark: false, bTimestamp: true, cPgsize: 'A4', ...extra,
}) as any;

const completeness = (nSesid: string, cReason: string, cSyncState: string, extra: Record<string, any> = {}) => ({
  success: true,
  data: [
    [{ msg: 1, value: cReason, nSesid, cReason, cSyncState, cFeedSource: 'E', bEverEdge: true, jIncidents: [], cSealNote: null, ...extra }],
    [{ nOrder: 1, nSesid, nPartNo: null, cFeedSource: 'E', cSyncState, cReason, nPendingOrphans: 0, bCurrent: true }],
  ],
});

function build(opts: { cStatus?: string; provenance?: Record<string, any>; sp?: Record<string, any> } = {}) {
  const calls: Call[] = [];
  const written: Record<string, string> = {};
  const isOurs = (p: any) => {
    const slashed = String(p).replace(/\\/g, '/');
    return slashed.startsWith(BASE) || slashed.startsWith('data/');
  };
  const realReaddir = fs.readdirSync;
  const realRead = fs.readFileSync;
  const realWrite = fs.writeFileSync;
  jest.spyOn(fs, 'readdirSync').mockImplementation(((p: any, ...rest: any[]) => {
    if (!isOurs(p)) return (realReaddir as any)(p, ...rest);
    calls.push(['fs.readdirSync', p]);
    return ['page_1.json'];
  }) as any);
  jest.spyOn(fs, 'readFileSync').mockImplementation(((p: any, ...rest: any[]) => {
    if (!isOurs(p)) return (realRead as any)(p, ...rest);
    calls.push(['fs.readFileSync', p]);
    if (p === TEMPLATE) return TEMPLATE_HTML;
    if (p === path.join(DT_DIR, 'page_1.json')) return JSON.stringify([tuple('10:00:01:00', 'Closed line')]);
    if (p === path.join(BASE, `s_${SES}.json`) || p === path.join(BASE, 'demo-stream.json')) {
      return JSON.stringify([{ msg: 1, page: 1, data: [{ time: '09:00:00:00', lineIndex: 1, lines: ['Published line'] }] }]);
    }
    throw new Error(`unexpected read of ${p}`);
  }) as any);
  jest.spyOn(fs, 'writeFileSync').mockImplementation(((p: any, content: any, ...rest: any[]) => {
    if (!isOurs(p)) return (realWrite as any)(p, content, ...rest);
    calls.push(['fs.writeFileSync', p]);
    written[String(p)] = String(content);
  }) as any);
  (exec as unknown as jest.Mock).mockImplementation((command: string, cb: (err: any, out?: any) => void) => {
    calls.push(['exec']);
    cb(null, { stdout: '', stderr: '' });
  });

  const db = {
    rowQuery: jest.fn(async (sql: string, params: any[]) => {
      calls.push(['db.rowQuery', sql, params]);
      if (sql !== SESSION_PROVENANCE_SQL) throw new Error(`unexpected query ${sql}`);
      return { success: true, data: [opts.provenance?.[params[0]] ?? NON_VENUE] };
    }),
    executeRef: jest.fn(async (name: string, body: any) => {
      calls.push(['db.executeRef', name, { ...body }]);
      if (name === 'realtime_export_othercasedetail') return { success: true, data: [[caseRow(opts.cStatus ?? 'C')]] };
      if (name === 'realtime_export_annotations_summary') return { success: true, data: [[], []] };
      const answer = opts.sp?.[name];
      if (answer === undefined) throw new Error(`unexpected SP ${name}`);
      return answer;
    }),
  };
  const feedData = {
    readSessionData: jest.fn(async (nSesid: string) => {
      calls.push(['feedData.readSessionData', nSesid]);
      return { 1: [tuple('11:00:01:00', 'Live line')] };
    }),
  };
  const config = { get: (key: string) => (key === 'REALTIME_PATH' ? BASE : undefined) };
  const svc = new ExportService(new UtilityService({} as any), config as any, new ConversionJsService(), db as any, feedData as any);
  return { calls, written, svc };
}

/** Today's closed-session steps after the case detail, with the provenance read D16 adds in front of the page files. */
const closedSteps = (): Call[] => [
  ['fs.readdirSync', DT_DIR],
  ['fs.readFileSync', path.join(DT_DIR, 'page_1.json')],
  ['db.executeRef', 'realtime_export_annotations_summary', { nCaseid: CASE, ref: 2, nUserid: ME, nSesid: SES, cTranscript: 'N', isAnnotations: false, isHighlight: false }],
  ['fs.readFileSync', TEMPLATE],
  ['fs.writeFileSync', OUTPUT_HTML],
  ['exec'],
];
const caseDetail: Call = ['db.executeRef', 'realtime_export_othercasedetail', { nCaseid: CASE, nSesid: SES }];

describe('ExportService.exportFile with the D16 gate', () => {
  const nodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.NODE_ENV = 'production';
    jest.spyOn(fse, 'ensureDir').mockImplementation((async () => undefined) as any);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => {
    if (nodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = nodeEnv;
    jest.restoreAllMocks();
    (exec as unknown as jest.Mock).mockReset();
  });

  it("a non-venue closed session: one read of the request's nSessionid, then today's steps; the HTML carries no mark", async () => {
    const { calls, written, svc } = build();
    await expect(svc.exportFile(exportQuery(), [[], []])).resolves.toEqual(EXPORTED);
    expect(calls).toEqual([caseDetail, ['db.rowQuery', SESSION_PROVENANCE_SQL, [SES]], ...closedSteps()]);
    expect(written[OUTPUT_HTML]).not.toContain('rt-completeness');
  });

  it("a non-venue live session: the read checks the case row's nSesid, the one the feed read takes", async () => {
    const { calls, svc } = build({ cStatus: 'R' });
    await expect(svc.exportFile(exportQuery(), [[], []])).resolves.toEqual(EXPORTED);
    expect(calls.slice(0, 3)).toEqual([caseDetail, ['db.rowQuery', SESSION_PROVENANCE_SQL, [ROW_SES]], ['feedData.readSessionData', ROW_SES]]);
  });

  it.each([
    ['the published transcript (cTranscript Y)', { cTranscript: 'Y' }],
    ['the demo stream', { cIsDemo: 'Y' }],
  ])('%s is not gated: no read', async (_label, extra) => {
    const { calls, svc } = build();
    await svc.exportFile(exportQuery(extra), [[], []]);
    expect(calls.map((c) => c[0])).not.toContain('db.rowQuery');
  });

  it("a venue session still 'S' is refused before anything is read, written or printed", async () => {
    const { calls, written, svc } = build({ provenance: { [SES]: VENUE }, sp: { rt_transcript_completeness: completeness(SES, 'AWAITING_SEAL', 'S') } });
    await expect(svc.exportFile(exportQuery(), [[], []])).resolves.toMatchObject({
      msg: -1, cCode: 'AWAITING_SEAL', bGated: true,
      value: 'Waiting for the venue box to upload. Exporting is blocked until the transcript is complete.',
    });
    expect(calls).toEqual([
      caseDetail,
      ['db.rowQuery', SESSION_PROVENANCE_SQL, [SES]],
      ['db.executeRef', 'rt_transcript_completeness', { nSesid: SES, cPurpose: 'X', ref: 2 }],
    ]);
    expect(written).toEqual({});
  });

  it("a complete ('K') venue session exports as today and reports its completeness", async () => {
    const { calls, written, svc } = build({ provenance: { [SES]: VENUE }, sp: { rt_transcript_completeness: completeness(SES, 'COMPLETE', 'K') } });
    await expect(svc.exportFile(exportQuery(), [[], []])).resolves.toMatchObject({ ...EXPORTED, completeness: { bGated: true, cSyncState: 'K', bIncomplete: false } });
    expect(calls.slice(3)).toEqual(closedSteps());
    expect(written[OUTPUT_HTML]).not.toContain('rt-completeness');
  });

  // Proven here: the HTML wkhtmltopdf receives carries the watermark as a position:fixed block right after
  // <body>. That wkhtmltopdf repeats it on every page is documented but not rendered and checked here.
  it("'F' exports with the INCOMPLETE watermark in the HTML wkhtmltopdf prints (a fixed block right after <body>)", async () => {
    const { written, svc } = build({
      provenance: { [SES]: VENUE },
      sp: { rt_transcript_completeness: completeness(SES, 'FORCED', 'F', { cSealNote: 'venue data missing 09:00:00-09:15:00' }) },
    });
    await expect(svc.exportFile(exportQuery(), [[], []])).resolves.toMatchObject({
      msg: 1, completeness: { bIncomplete: true, cWatermark: 'INCOMPLETE — venue data missing 09:00:00-09:15:00' },
    });
    expect(written[OUTPUT_HTML]).toMatch(/^<html><body><div class="rt-completeness-watermark" style="position:fixed;[^"]*">INCOMPLETE — venue data missing 09:00:00-09:15:00<\/div><table>/);
    expect(written[OUTPUT_HTML]).toContain('Closed line');
  });

  it("a live venue session ('L', cStatus R) exports with the 'Live - as of' stamp, checked on the row's nSesid", async () => {
    const { calls, written, svc } = build({ cStatus: 'R', provenance: { [ROW_SES]: VENUE }, sp: { rt_transcript_completeness: completeness(ROW_SES, 'LIVE', 'L') } });
    await expect(svc.exportFile(exportQuery(), [[], []])).resolves.toMatchObject({ msg: 1, completeness: { cLiveStamp: expect.stringMatching(/^Live — as of /) } });
    expect(calls[2]).toEqual(['db.executeRef', 'rt_transcript_completeness', { nSesid: ROW_SES, cPurpose: 'X', ref: 2 }]);
    expect(written[OUTPUT_HTML]).toMatch(/<div class="rt-completeness-live"[^>]*>Live — as of \d\d:\d\d:\d\d<\/div>/);
  });

  it("'W' is refused without the acknowledgement flag; with it the acknowledgement is recorded for the token user", async () => {
    const sp = { rt_transcript_completeness: completeness(SES, 'NEEDS_ACK', 'W'), rtedge_warn_ack: { success: true, data: [[{ msg: 1 }]] } };
    const refused = build({ provenance: { [SES]: VENUE }, sp });
    await expect(refused.svc.exportFile(exportQuery(), [[], []])).resolves.toMatchObject({
      msg: -1, cCode: 'NEEDS_ACK', value: 'The venue upload finished with warnings. Acknowledge the listed incidents before exporting.',
    });
    expect(refused.written).toEqual({});
    jest.restoreAllMocks();
    jest.spyOn(fse, 'ensureDir').mockImplementation((async () => undefined) as any);

    const acked = build({ provenance: { [SES]: VENUE }, sp });
    await expect(acked.svc.exportFile(exportQuery({ bAckWarnings: true }), [[], []])).resolves.toMatchObject({ msg: 1, completeness: { acknowledged: [SES] } });
    expect(acked.calls).toContainEqual(['db.executeRef', 'rtedge_warn_ack', { nSesid: SES, nMasterid: ME }]);
  });
});
