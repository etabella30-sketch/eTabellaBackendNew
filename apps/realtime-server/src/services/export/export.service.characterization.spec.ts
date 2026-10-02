jest.mock('child_process', () => {
  const actual = jest.requireActual('child_process');
  return { ...actual, exec: jest.fn() };
});

import { exec } from 'child_process';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as path from 'path';
import { ConversionJsService } from '../conversion.js/conversion.js.service';
import { UtilityService } from '../utility/utility.service';
import { SESSION_PROVENANCE_SQL } from '../transcript-completeness/transcript-completeness.service';
import { ExportService } from './export.service';

/*
 * Characterization of the annotation export behind POST issue/annothighlightexport (ExportService.exportFile,
 * reached from IssueService.getAnnotHighlightExport) for a session that never had a venue box
 * (bEverEdge=false, cApply not 'C': every hearing today). Plan R-T4 / D16: written before the
 * transcript-completeness gate goes in and kept green after it.
 *
 * Both feed sources are pinned: a live session (cStatus 'R') is read from the feed store in memory/Redis,
 * any other session from its page files in data/dt_<nSessionid>/. The real ConversionJsService and
 * UtilityService run over a stubbed fs; the DB, the feed store and wkhtmltopdf (child_process.exec) are
 * stubs. Every step records into one shared list, so the specs pin the order and the payloads.
 *
 * The case row carries its own nSesid (ROW_SES), apart from the request's nSessionid (SES), so the specs
 * also pin which id each read uses: the live read takes the row's, data/dt_, the summary SP and the output
 * files take the request's. A call site that swaps one for the other fails here.
 *
 * Provenance is stated, not implied (D16 landing, batch-A critic): both sessions' RSessionMaster rows are
 * NON_VENUE below, and rowQuery answers only the gate's provenance read (the one query D16 adds to this
 * path, for the session the feed read takes; the D16 caller specs pin where it runs). Any other plain query
 * throws, and executeRef answers only today's two SPs, so a completeness SP fails the spec.
 */

/** RSessionMaster provenance of every hearing today: never a venue box, not cut mode, not a split part. */
const NON_VENUE = { bEverEdge: false, cApply: null, nPrevPartSesid: null };

/** Reads that are not the provenance read of `nSesid`, or more than one: must be none. */
const strayReads = (reads: any[][], nSesid: string) =>
  reads.filter(([sql, params], i) => i > 0 || sql !== SESSION_PROVENANCE_SQL || params?.[0] !== nSesid);

/** The request's nSessionid. */
const SES = '5e551011-0000-4000-8000-000000000010';
/** The nSesid on the row realtime_export_othercasedetail returns. */
const ROW_SES = '5e551011-0000-4000-8000-0000000000aa';
const CASE = 'ca5e1011-0000-4000-8000-000000000010';
const ME = '11111111-1111-4111-8111-111111111111';

// A REALTIME_PATH that does not exist: fs is stubbed for it, so nothing is read from or written to disk.
const BASE = 'rt-t10-characterization/realtime-transcripts/';
const EXPORT_DIR = `${BASE}exports/`;
const TEMPLATE = path.join(EXPORT_DIR, 'htmlTemplate.html');
const OUTPUT_HTML = path.join(EXPORT_DIR, `output${SES}.html`);
const PUBLISHED_JSON = path.join(BASE, `s_${SES}.json`);
const DT_DIR = path.join('data', `dt_${SES}`);
const WK_COMMAND = `wkhtmltopdf --disable-local-file-access --disable-javascript --page-size A4 --margin-top 0 --margin-bottom 0 --margin-left 0 --margin-right 0 --print-media-type ${OUTPUT_HTML} ${EXPORT_DIR}s_${SES}.pdf`;
const EXPORTED = { msg: 1, path: `s_${SES}.pdf`, name: 'export.pdf' };

const TEMPLATE_HTML = '<html><body><table><tr><td class="main-content replacable-content"></td></tr></table><div id="main-content-placeholder"></div>';

const codes = (text: string) => Array.from(text).map((c) => c.charCodeAt(0));
/** A raw feed line as stored in page files, memory and Redis: [time, char codes, , formate, , , unicid]. */
const tuple = (time: string, text: string, formate: string, unicid: string) => [time, codes(text), 0, formate, 0, 0, unicid];

/**
 * data/dt_<SES>/ of a closed session. readdir order is not page order, page 10 follows a gap, and a
 * non-page file sits beside the pages.
 */
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

const caseRow = (cStatus: string) => ({
  nSesid: ROW_SES, cStatus, cCasename: 'Smith v Jones', cName: 'Hearing Day 3', dDay: 'Wednesday', dSessionDt: '1 Oct 2026',
  cIndexheader: 'IN THE MATTER OF AN ARBITRATION', cClaimant: 'Smith Ltd', cRespondent: 'Jones plc',
});

/** The request after IssueService.getAnnotHighlightExport (it adds ref: 2). */
const exportQuery = (extra: Record<string, any> = {}) => ({
  nSessionid: SES, nCaseid: CASE, nUserid: ME, cCasename: 'Day 3 Morning Session', cUsername: 'Jane Doe',
  cTranscript: 'N', cIsDemo: 'N', jIssues: [], jHIssues: [], jPages: [], bCoverpg: true, bPagination: false,
  bQfact: true, bQmark: true, bTimestamp: true, cOrientation: 'P', cQMsize: 'S', cQFsize: 'S', cPgsize: 'A4', ref: 2,
  ...extra,
}) as any;

/** res.data of realtime_get_issue_annotation_highlight_export: [issue annotations, line highlights]. */
const annotationRes = () => [
  [{ nIDid: 'qf1', pageIndex: 1, color: 'ffd400', cONote: 'quick brown', cordinates: [{ p: 1, l: 2, t: '10:00:05', text: 'quick brown' }] }],
  [{ nHid: 'h1', cPageno: 1, cLineno: 1, cColor: 'EBCAFF' }],
];

/** realtime_export_annotations_summary: [annotations, issue rows]. */
const SUMMARY_ROWS = [
  [
    { cSource: 'QF', nFSid: 'qf1', nPage: 1, nLine: 2, jCordinates: [{ text: 'quick brown' }], jOT: ['ignored'], jTexts: ['Identity'] },
    { cSource: 'F', nFSid: 'f1', nPage: 2, nLine: 1, jCordinates: [], jOT: ['Second page'], jTexts: ['A fact note'] },
    { cSource: 'QM', id: 'qm1', nGroupid: 'g1', cPageno: 1, cLineno: '1', cNote: 'Opening' },
    { cSource: 'QM', id: 'qm2', nGroupid: 'g1', cPageno: 1, cLineno: '2', cNote: 'Follow-up' },
  ],
  [{ jFSids: ['qf1'], cIName: 'Credibility', cColor: 'f5c242', nImpactid: 2, cRelevance: 'High', cImpact: 'Major' }],
];
const SUMMARY_OF_ANNOTS = [
  {
    title: 'QFact',
    data: [{ pageIndex: 1, cLineno: 2, cONote: 'quick brown', cNote: 'Identity', issues: [{ cIName: 'Credibility', cColor: 'f5c242', nImpactid: 2, cRel: 'High', cImp: 'Major' }] }],
  },
  { title: 'Full Fact', data: [{ pageIndex: 2, cLineno: 1, cONote: 'Second page', cNote: 'A fact note', issues: [] }] },
];
const SUMMARY_OF_HIGHLIGHTS = [{ title: 'Quick Mark', data: [{ nGroupid: 'g1', data: [SUMMARY_ROWS[0][2], SUMMARY_ROWS[0][3]] }] }];

const summaryPayload = (extra: Record<string, any> = {}) =>
  ({ nCaseid: CASE, ref: 2, nUserid: ME, nSesid: SES, cTranscript: 'N', isAnnotations: true, isHighlight: true, ...extra });

type Call = [string, ...any[]];

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

function build(opts: { cStatus?: string; caseData?: any; memory?: any } = {}) {
  const calls: Call[] = [];
  const written: Record<string, string> = {};

  const realReaddir = fs.readdirSync;
  const realRead = fs.readFileSync;
  const realWrite = fs.writeFileSync;
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
    if (p === TEMPLATE) return TEMPLATE_HTML;
    if (p === PUBLISHED_JSON) return JSON.stringify([{ msg: 1, page: 1, data: [{ time: '09:00:00:00', lineIndex: 1, lines: ['Published line'] }] }]);
    const file = Object.keys(DT_FILES).find((f) => p === path.join(DT_DIR, f));
    if (file) return JSON.stringify(DT_FILES[file]);
    throw new Error(`unexpected read of ${p}`);
  }) as any);
  jest.spyOn(fs, 'writeFileSync').mockImplementation(((p: any, content: any, ...rest: any[]) => {
    if (!isOurs(p)) return (realWrite as any)(p, content, ...rest);
    calls.push(['fs.writeFileSync', p]);
    written[String(p)] = String(content);
  }) as any);
  (exec as unknown as jest.Mock).mockImplementation((command: string, cb: (err: any, out?: any) => void) => {
    calls.push(['exec', command]);
    cb(null, { stdout: '', stderr: '' });
  });

  const reads: any[][] = [];
  const db = {
    executeRef: jest.fn(async (name: string, body: any, ...rest: any[]) => {
      calls.push(['db.executeRef', name, clone(body), ...rest]);
      if (name === 'realtime_export_othercasedetail') return opts.caseData ?? { success: true, data: [[caseRow(opts.cStatus ?? 'C')]] };
      if (name === 'realtime_export_annotations_summary') return { success: true, data: clone(SUMMARY_ROWS) };
      throw new Error(`unexpected SP ${name}`);
    }),
    rowQuery: jest.fn(async (sql: string, params: any[]) => {
      reads.push([sql, params]);
      if (sql !== SESSION_PROVENANCE_SQL || ![SES, ROW_SES].includes(params?.[0])) throw new Error(`unexpected query ${sql}`);
      return { success: true, data: [{ ...NON_VENUE }] };
    }),
  };
  const feedData = {
    readSessionData: jest.fn(async (nSesid: string) => {
      calls.push(['feedData.readSessionData', nSesid]);
      return clone(opts.memory ?? MEMORY);
    }),
  };
  const config = { get: (key: string) => (key === 'REALTIME_PATH' ? BASE : undefined) };

  const svc = new ExportService(new UtilityService({} as any), config as any, new ConversionJsService(), db as any, feedData as any);

  // What exportFile hands the HTML renderer, copied at the call (the renderer mutates line objects).
  const rendered: any[][] = [];
  const realRender = svc.generateHtmlContent.bind(svc);
  jest.spyOn(svc, 'generateHtmlContent').mockImplementation(((...args: any[]) => {
    rendered.push(clone(args));
    return (realRender as any)(...args);
  }) as any);

  return { calls, reads, written, rendered, db, feedData, svc };
}

/** The page objects a closed session's export renders: files sorted by number and renumbered 1..n. */
const DT_PAGES = [
  {
    msg: 1, page: 1, data: [
      { time: '10:00:01:00', lineIndex: 1, lines: ['Good morning, Tribunal.'], formate: 'Q', unicid: 'u1' },
      { time: '10:00:05:00', lineIndex: 2, lines: ['The quick brown fox'], formate: 'A', unicid: 'u2' },
    ],
  },
  { msg: 2, page: 2, data: [{ time: '10:01:00:00', lineIndex: 1, lines: ['Second page line'], formate: 'C', unicid: 'u3' }] },
  // page_10.json, rendered as page 3.
  { msg: 3, page: 3, data: [{ time: '10:09:00:00', lineIndex: 1, lines: ['Tenth file line'], formate: 'C', unicid: 'u4' }] },
];

/** The page objects a live session's export renders: real page numbers, no formate or unicid. */
const LIVE_PAGES = [
  {
    msg: 1, page: 1, data: [
      { time: '11:00:01:00', lineIndex: 1, lines: ['Live first line'] },
      { time: '11:00:04:00', lineIndex: 2, lines: ['A quick brown dog'] },
    ],
  },
  { msg: 2, page: 2, data: [{ time: '11:01:00:00', lineIndex: 1, lines: ['Live second page'] }] },
  { msg: 5, page: 5, data: [{ time: '11:05:00:00', lineIndex: 1, lines: ['Live fifth page'] }] },
];

/** res as exportFile hands it to the renderer: the annotation's coordinates resolved against the line read. */
const resolvedRes = (startIndex: number, endIndex: number) => {
  const res: any[] = annotationRes();
  res[0][0].cordinates[0] = { ...res[0][0].cordinates[0], startIndex, endIndex };
  return res;
};

const COVER = { CaseName: 'Day 3 Morning Session', ExportBy: 'Jane Doe', cTranscript: 'N' };

describe('ExportService.exportFile on a non-venue session (characterization, R-T4 / D16)', () => {
  const nodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    // The server runs with NODE_ENV=production: wkhtmltopdf then reads the very file exportFile wrote.
    process.env.NODE_ENV = 'production';
    jest.spyOn(fse, 'ensureDir').mockImplementation((async () => undefined) as any);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });
  afterEach(() => {
    if (nodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = nodeEnv;
    jest.restoreAllMocks();
    (exec as unknown as jest.Mock).mockReset();
  });

  it("a closed session (cStatus not R) is read from data/dt_<the request's nSessionid>/, not the row's nSesid, and exported in this order", async () => {
    const { calls, reads, written, rendered, feedData, svc } = build({ cStatus: 'C' });
    const query = exportQuery();
    const res = annotationRes();

    await expect(svc.exportFile(query, res)).resolves.toEqual(EXPORTED);
    expect(strayReads(reads, SES)).toEqual([]);

    expect(calls).toEqual([
      ['db.executeRef', 'realtime_export_othercasedetail', { nCaseid: CASE, nSesid: SES }],
      ['fs.readdirSync', DT_DIR],
      ['fs.readFileSync', path.join(DT_DIR, 'page_1.json')],
      ['fs.readFileSync', path.join(DT_DIR, 'page_2.json')],
      ['fs.readFileSync', path.join(DT_DIR, 'page_10.json')],
      ['db.executeRef', 'realtime_export_annotations_summary', summaryPayload()],
      ['fs.readFileSync', TEMPLATE],
      ['fs.writeFileSync', OUTPUT_HTML],
      ['exec', WK_COMMAND],
    ]);
    expect(feedData.readSessionData).not.toHaveBeenCalled();

    // 'The quick brown fox' holds 'quick brown' at [4, 15).
    expect(rendered).toEqual([[query, DT_PAGES, resolvedRes(4, 15), true, COVER, caseRow('C'), SUMMARY_OF_ANNOTS, SUMMARY_OF_HIGHLIGHTS]]);

    const html = written[OUTPUT_HTML];
    expect(html.startsWith('<html><body><table><tr><td class="main-content">')).toBe(true);
    expect(html).toContain('<h1 class="case-name">Day 3 Morning Session</h1>');
    expect(html).toContain('The <span style="background:#ffd400">quick brown</span> fox');
    expect(html).toContain('Tenth file line');
    const headers = html.match(/Page No\. \d+/g);
    expect(headers).toEqual(['Page No. 1', 'Page No. 2', 'Page No. 3']);
    expect(html.endsWith('</body></html>')).toBe(true);
  });

  it("a live session (cStatus R) is read from the feed store by the case row's nSesid, not the request's nSessionid, never from disk", async () => {
    const { calls, reads, written, rendered, svc } = build({ cStatus: 'R' });
    const query = exportQuery();

    await expect(svc.exportFile(query, annotationRes())).resolves.toEqual(EXPORTED);
    expect(strayReads(reads, ROW_SES)).toEqual([]);

    // Only the feed read takes the row's id: the summary SP, the HTML and the PDF stay on the request's.
    expect(calls).toEqual([
      ['db.executeRef', 'realtime_export_othercasedetail', { nCaseid: CASE, nSesid: SES }],
      ['feedData.readSessionData', ROW_SES],
      ['db.executeRef', 'realtime_export_annotations_summary', summaryPayload()],
      ['fs.readFileSync', TEMPLATE],
      ['fs.writeFileSync', OUTPUT_HTML],
      ['exec', WK_COMMAND],
    ]);

    // 'A quick brown dog' holds 'quick brown' at [2, 13).
    expect(rendered).toEqual([[query, LIVE_PAGES, resolvedRes(2, 13), true, COVER, caseRow('R'), SUMMARY_OF_ANNOTS, SUMMARY_OF_HIGHLIGHTS]]);

    const html = written[OUTPUT_HTML];
    expect(html).toContain('A <span style="background:#ffd400">quick brown</span> dog');
    expect(html.match(/Page No\. \d+/g)).toEqual(['Page No. 1', 'Page No. 2', 'Page No. 5']);
  });

  it('a live session with nothing in the feed store fails the export without writing or rendering a PDF', async () => {
    const { calls, written, svc } = build({ cStatus: 'R', memory: {} });

    await expect(svc.exportFile(exportQuery(), annotationRes())).resolves.toEqual({ msg: -1 });

    expect(calls).toEqual([
      ['db.executeRef', 'realtime_export_othercasedetail', { nCaseid: CASE, nSesid: SES }],
      ['feedData.readSessionData', ROW_SES],
      ['db.executeRef', 'realtime_export_annotations_summary', summaryPayload()],
      ['fs.readFileSync', TEMPLATE],
    ]);
    expect(written).toEqual({});
  });

  it('a published transcript (cTranscript Y) is read from REALTIME_PATH/s_<nSessionid>.json whatever the case row says', async () => {
    const { calls, feedData, svc } = build({ cStatus: 'R' });

    await expect(svc.exportFile(exportQuery({ cTranscript: 'Y' }), annotationRes())).resolves.toEqual(EXPORTED);

    expect(calls.slice(0, 3)).toEqual([
      ['db.executeRef', 'realtime_export_othercasedetail', { nCaseid: CASE, nSesid: SES }],
      ['fs.readFileSync', PUBLISHED_JSON],
      ['db.executeRef', 'realtime_export_annotations_summary', summaryPayload({ cTranscript: 'Y' })],
    ]);
    expect(feedData.readSessionData).not.toHaveBeenCalled();
  });

  it('without a case row nothing is read and the failure shape comes back', async () => {
    const { calls, svc } = build({ caseData: { success: false, error: 'db down' } });

    await expect(svc.exportFile(exportQuery(), annotationRes())).resolves.toEqual({ msg: -1, value: 'No case data found!' });

    expect(calls).toEqual([['db.executeRef', 'realtime_export_othercasedetail', { nCaseid: CASE, nSesid: SES }]]);
  });

  it('today an export without the cover page fails before anything is written (the renderer reads the cover fields)', async () => {
    const { calls, written, svc } = build({ cStatus: 'C' });

    await expect(svc.exportFile(exportQuery({ bCoverpg: false }), annotationRes())).resolves.toEqual({ msg: -1 });

    expect(calls.map((c) => c[0])).not.toContain('fs.writeFileSync');
    expect(calls.map((c) => c[0])).not.toContain('exec');
    expect(written).toEqual({});
  });
});
