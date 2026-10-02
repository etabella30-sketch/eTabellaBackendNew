import * as fs from 'fs';
import * as path from 'path';
import { ConversionJsService } from '../conversion.js/conversion.js.service';
import { SESSION_PROVENANCE_SQL } from '../transcript-completeness/transcript-completeness.service';
import { TranscriptpublishService } from './transcript_publish.service';

/*
 * Characterization of the transcript export behind POST transcript/annothighlightexport
 * (TranscriptpublishService.getAnnotHighlightExport -> getExportDataTranscript) for a session that never had
 * a venue box (bEverEdge=false, cApply not 'C': every hearing today). Plan R-T4 / D16 ("publish and both
 * exports"): written before the transcript-completeness gate goes in and kept green after it.
 *
 * Pinned up to the renderer: which feed source a live (cStatus 'R') and a closed session are read from,
 * the SP calls and their payloads in order, and the lines handed to generateTranscriptDetail (stubbed here:
 * it renders HTML and a PDF through puppeteer). The real ConversionJsService runs over a stubbed fs.
 *
 * getExportDataTranscript reads four session ids, and each has its own value here so the specs pin which
 * id every step uses: a call site that swaps one for another fails.
 *
 * Provenance is stated, not implied (D16 landing, batch-A critic): every session's RSessionMaster row is
 * NON_VENUE below, and rowQuery answers only the gate's provenance read (the one query D16 adds to this
 * path, for the session the feed read takes; the D16 caller specs pin where it runs). Any other plain query
 * throws, and executeRef answers only today's three SPs, so a completeness SP fails the spec.
 */

/** RSessionMaster provenance of every hearing today: never a venue box, not cut mode, not a split part. */
const NON_VENUE = { bEverEdge: false, cApply: null, nPrevPartSesid: null };

/** Reads that are not the provenance read of `nSesid`, or more than one: must be none. */
const strayReads = (reads: any[][], nSesid: string) =>
  reads.filter(([sql, params], i) => i > 0 || sql !== SESSION_PROVENANCE_SQL || params?.[0] !== nSesid);

/** The request's nSessionid: a closed export reads data/dt_<it>/. */
const SES = '5e551011-0000-4000-8000-000000000010';
/** The request's nSesid (the Mark Nav session): realtime_export_othercasedetail is asked for it. */
const NAV_SES = '5e551011-0000-4000-8000-0000000000bb';
/** The nSesid on the case row realtime_export_othercasedetail returns: the live read and nMarknavSesid. */
const ROW_SES = '5e551011-0000-4000-8000-0000000000aa';
/** The nSesid on get_transcript_detail's row: it names the published JSON (cPath). */
const FORM_SES = '5e551011-0000-4000-8000-0000000000cc';
const CASE = 'ca5e1011-0000-4000-8000-000000000010';
const TRANS = '7a5e1011-0000-4000-8000-000000000010';
const ME = '11111111-1111-4111-8111-111111111111';
/** The transcript id the export falls back to when the session has no transcript row. */
const FALLBACK_TRANS = '39ce7608-e7ed-46e2-995c-bac91732e6fc';
const ORIGIN = 'https://etabella.example';

const BASE = 'rt-t10-characterization/realtime-transcripts/';
const DT_DIR = path.join('data', `dt_${SES}`);

const codes = (text: string) => Array.from(text).map((c) => c.charCodeAt(0));
/** A raw feed line as stored in page files, memory and Redis: [time, char codes, , formate, , , unicid]. */
const tuple = (time: string, text: string, formate: string, unicid: string) => [time, codes(text), 0, formate, 0, 0, unicid];

/** data/dt_<SES>/ of a closed session: readdir order is not page order, and page 10 follows a gap. */
const DT_FILES: Record<string, any[]> = {
  'page_10.json': [tuple('10:09:00:00', 'Tenth file line', 'C', 'u4')],
  'page_2.json': [tuple('10:01:00:00', 'Second page line', 'C', 'u3')],
  'page_1.json': [tuple('10:00:01:00', 'Good morning, Tribunal.', 'Q', 'u1'), tuple('10:00:05:00', 'The quick brown fox', 'A', 'u2')],
};
const DT_LISTING = ['page_10.json', 'notes.txt', 'page_2.json', 'page_1.json'];

/** The feed store's map for a live session: real page numbers, with a gap before page 5. */
const MEMORY: Record<number, any[]> = {
  1: [tuple('11:00:01:00', 'Live first line', 'Q', 'm1'), tuple('11:00:04:00', 'A quick brown dog', 'A', 'm2')],
  2: [tuple('11:01:00:00', 'Live second page', 'C', 'm3')],
  5: [tuple('11:05:00:00', 'Live fifth page', 'C', 'm4')],
};

const line = (pageno: number, lineno: number, timestamp: string, linetext: string, unicid: string) =>
  ({ lineno, timestamp, linetext, pageno, tab_references: [], isIndex: false, unicid });

/** Lines of the closed session: files sorted by number and renumbered 1..n, so page_10 becomes page 3. */
const DT_LINES = [
  line(1, 1, '10:00:01', 'Good morning, Tribunal.', 'u1'),
  line(1, 2, '10:00:05', 'The quick brown fox', 'u2'),
  line(2, 1, '10:01:00', 'Second page line', 'u3'),
  line(3, 1, '10:09:00', 'Tenth file line', 'u4'),
];

/** Lines of the live session: real page numbers. */
const LIVE_LINES = [
  line(1, 1, '11:00:01', 'Live first line', 'm1'),
  line(1, 2, '11:00:04', 'A quick brown dog', 'm2'),
  line(2, 1, '11:01:00', 'Live second page', 'm3'),
  line(5, 1, '11:05:00', 'Live fifth page', 'm4'),
];

const caseRow = (cStatus: string) => ({ nSesid: ROW_SES, cStatus, cCasename: 'Smith v Jones', cName: 'Hearing Day 3', dSessionDt: '1 Oct 2026' });
const FORM_ROW = { cTransid: TRANS, nSesid: FORM_SES, cPath: `t_${TRANS}.json`, cThemeid: null, cCDay: 'Day 3' };
/** get_transcript_detail's row as handed on: cPath points at the published JSON of that row's nSesid. */
const FORM_DATA = { ...FORM_ROW, cPath: `s_${FORM_SES}.json` };

const exportQuery = (extra: Record<string, any> = {}) => ({
  nSessionid: SES, nSesid: NAV_SES, nCaseid: CASE, nUserid: ME, nMasterid: ME, cCasename: 'Day 3 Morning Session', cUsername: 'Jane Doe',
  cTranscript: 'N', cIsDemo: 'N', jIssues: [], jHIssues: [], jPages: [], bCoverpg: true, bTimestamp: true,
  bAnnotations: true, cAnnotations: 'ALL', cAnnotationType: 'ALL', cLayout: 'FULL_PAGE', cPgsize: 'A4',
  ...extra,
}) as any;

const DETAIL = { msg: 1, value: `Transcript detail generated for user ${ME}`, path: `t_${TRANS}_${ME}.pdf`, name: 'export.pdf' };

type Call = [string, ...any[]];

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

function build(opts: { cStatus?: string; caseRow?: any; transcriptRow?: any; detail?: any } = {}) {
  const calls: Call[] = [];
  const reads: any[][] = [];

  const realReaddir = fs.readdirSync;
  const realRead = fs.readFileSync;
  // REALTIME_PATH and data/ paths are stubbed (path.join gives either separator); anything else is real.
  const isOurs = (p: any) => {
    const slashed = String(p).replace(/\\/g, '/');
    return slashed.startsWith(BASE) || slashed.startsWith('data/');
  };
  jest.spyOn(fs, 'readdirSync').mockImplementation(((p: any, ...rest: any[]) => {
    if (!isOurs(p)) return (realReaddir as any)(p, ...rest);
    calls.push(['fs.readdirSync', p]);
    if (p === DT_DIR) return [...DT_LISTING];
    throw new Error(`unexpected readdir of ${p}`);
  }) as any);
  jest.spyOn(fs, 'readFileSync').mockImplementation(((p: any, ...rest: any[]) => {
    if (!isOurs(p)) return (realRead as any)(p, ...rest);
    calls.push(['fs.readFileSync', p]);
    const file = Object.keys(DT_FILES).find((f) => p === path.join(DT_DIR, f));
    if (file) return JSON.stringify(DT_FILES[file]);
    throw new Error(`unexpected read of ${p}`);
  }) as any);

  const db = {
    executeRef: jest.fn(async (name: string, body: any, ...rest: any[]) => {
      calls.push(['db.executeRef', name, clone(body), ...rest]);
      if (name === 'get_transcript_by_sesid') return { success: true, data: [[opts.transcriptRow ?? { msg: 1, cTransid: TRANS, cProtocol: 'C' }]] };
      if (name === 'realtime_export_othercasedetail') return { success: true, data: [[opts.caseRow ?? caseRow(opts.cStatus ?? 'C')]] };
      if (name === 'get_transcript_detail') return { success: true, data: [[{ ...FORM_ROW }]] };
      throw new Error(`unexpected SP ${name}`);
    }),
    rowQuery: jest.fn(async (sql: string, params: any[]) => {
      reads.push([sql, params]);
      if (sql !== SESSION_PROVENANCE_SQL || ![SES, NAV_SES, ROW_SES, FORM_SES].includes(params?.[0])) throw new Error(`unexpected query ${sql}`);
      return { success: true, data: [{ ...NON_VENUE }] };
    }),
  };
  const feedData = {
    readSessionData: jest.fn(async (nSesid: string) => {
      calls.push(['feedData.readSessionData', nSesid]);
      return clone(MEMORY);
    }),
  };
  const config = { get: (key: string) => (key === 'REALTIME_PATH' ? BASE : undefined) };

  // Constructor order: config, db, log, htmlService, transService, kafka, verifier, copier, utilityService,
  // conversion, feedData, wordIndexService, annotTransferService.
  const svc = new TranscriptpublishService(
    config as any, db as any, {} as any, {} as any, {} as any, {} as any,
    {} as any, {} as any, {} as any, new ConversionJsService(), feedData as any, {} as any, {} as any,
  );
  jest.spyOn(svc, 'generateTranscriptDetail').mockImplementation((async (...args: any[]) => {
    calls.push(['generateTranscriptDetail', ...clone(args)]);
    return opts.detail ?? DETAIL;
  }) as any);
  return { calls, reads, db, feedData, svc };
}

/** The request as getExportDataTranscript hands it to the renderer: nMarknavSesid is the case row's nSesid. */
const renderedBody = (cStatus: string, extra: Record<string, any> = {}) =>
  ({ ...exportQuery(), cTransid: TRANS, cProtocol: 'C', nMarknavSesid: ROW_SES, otherCaseData: caseRow(cStatus), ...extra });

describe('TranscriptpublishService.getAnnotHighlightExport on a non-venue session (characterization, R-T4 / D16)', () => {
  afterEach(() => jest.restoreAllMocks());

  it("a closed session (cStatus not R) is read from data/dt_<the request's nSessionid>/ and rendered in this order", async () => {
    const { calls, reads, feedData, svc } = build({ cStatus: 'C' });

    await expect(svc.getAnnotHighlightExport(exportQuery(), ORIGIN)).resolves.toEqual(DETAIL);
    expect(strayReads(reads, SES)).toEqual([]);

    // The case detail is asked for the request's nSesid; the page files are those of its nSessionid,
    // not of the nSesid on the row that comes back.
    expect(calls).toEqual([
      ['db.executeRef', 'get_transcript_by_sesid', exportQuery(), 'transcript'],
      ['db.executeRef', 'realtime_export_othercasedetail', { nCaseid: CASE, nSesid: NAV_SES }],
      ['db.executeRef', 'get_transcript_detail', { ...exportQuery(), cTransid: TRANS, cProtocol: 'C' }, 'transcript'],
      ['fs.readdirSync', DT_DIR],
      ['fs.readFileSync', path.join(DT_DIR, 'page_1.json')],
      ['fs.readFileSync', path.join(DT_DIR, 'page_2.json')],
      ['fs.readFileSync', path.join(DT_DIR, 'page_10.json')],
      ['generateTranscriptDetail', renderedBody('C'), FORM_DATA, DT_LINES, {}, ME, ME, ORIGIN, 'realtime-transcripts/exports/', false],
    ]);
    expect(feedData.readSessionData).not.toHaveBeenCalled();
  });

  it("a live session (cStatus R) is read from the feed store by the case row's nSesid, not either request id, never from disk", async () => {
    const { calls, reads, svc } = build({ cStatus: 'R' });

    await expect(svc.getAnnotHighlightExport(exportQuery(), ORIGIN)).resolves.toEqual(DETAIL);
    expect(strayReads(reads, ROW_SES)).toEqual([]);

    expect(calls).toEqual([
      ['db.executeRef', 'get_transcript_by_sesid', exportQuery(), 'transcript'],
      ['db.executeRef', 'realtime_export_othercasedetail', { nCaseid: CASE, nSesid: NAV_SES }],
      ['db.executeRef', 'get_transcript_detail', { ...exportQuery(), cTransid: TRANS, cProtocol: 'C' }, 'transcript'],
      ['feedData.readSessionData', ROW_SES],
      ['generateTranscriptDetail', renderedBody('R'), FORM_DATA, LIVE_LINES, {}, ME, ME, ORIGIN, 'realtime-transcripts/exports/', false],
    ]);
  });

  it("a case row without an nSesid leaves nMarknavSesid on the request's nSesid", async () => {
    const row = { ...caseRow('C'), nSesid: null };
    const { calls, svc } = build({ caseRow: row });

    await expect(svc.getAnnotHighlightExport(exportQuery(), ORIGIN)).resolves.toEqual(DETAIL);

    expect(calls[calls.length - 1]).toEqual([
      'generateTranscriptDetail', renderedBody('C', { nMarknavSesid: NAV_SES, otherCaseData: row }), FORM_DATA, DT_LINES, {}, ME, ME, ORIGIN, 'realtime-transcripts/exports/', false,
    ]);
  });

  it('a session with no transcript row is exported under the fallback transcript id, with that row\'s protocol', async () => {
    const { calls, svc } = build({ cStatus: 'C', transcriptRow: { msg: -1, value: 'Transcript not found', cProtocol: 'B' } });

    await expect(svc.getAnnotHighlightExport(exportQuery(), ORIGIN)).resolves.toEqual(DETAIL);

    expect(calls[2]).toEqual(['db.executeRef', 'get_transcript_detail', { ...exportQuery(), cProtocol: 'B', cTransid: FALLBACK_TRANS }, 'transcript']);
    expect(calls[calls.length - 1]).toEqual([
      'generateTranscriptDetail', renderedBody('C', { cTransid: FALLBACK_TRANS, cProtocol: 'B' }), FORM_DATA, DT_LINES, {}, ME, ME, ORIGIN, 'realtime-transcripts/exports/', false,
    ]);
  });

  it("a renderer failure comes back as 'Export failed'", async () => {
    const { svc } = build({ cStatus: 'C', detail: { msg: -1, value: 'PDF generation failed' } });
    await expect(svc.getAnnotHighlightExport(exportQuery(), ORIGIN)).resolves.toEqual({ msg: -1, value: 'Export failed' });
  });
});
