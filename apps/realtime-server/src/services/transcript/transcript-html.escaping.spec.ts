import * as fs from 'fs';
import { TranscriptHtmlService } from './transcript-html.service';
import { ThemeCssService } from './theme-css.service';
import { UtilityService } from '../utility/utility.service';
import { GenerateWordIndexService } from '../exporttranscript/generate_word_index/generate_word_index.service';
import { ExporttranscriptService } from '../exporttranscript/exporttranscript.service';
import { ExportService } from '../export/export.service';
import { cssColor, escapeHtml, escapeRichText } from '../utility/html-escape';

/*
 * The export HTML is rendered by headless Chrome (puppeteer, file:// page) or wkhtmltopdf, so any
 * markup that reaches it from a client field (cCasename, cUsername, body flags) or stored text
 * (transcript lines, notes, issue names, link metadata, cover fields) runs there. Every builder
 * must escape that text.
 *
 * The "unchanged output" snapshots were recorded from the builders BEFORE escaping was added:
 * for text without & < > " ' the HTML must stay byte-identical.
 */

const NOW = new Date('2026-03-02T12:00:00Z');

const IFRAME = '<iframe src="file:///etc/passwd"></iframe>';
const IMG = "<img src='http://169.254.169.254/latest/meta-data/'>";
const PAYLOAD = `${IFRAME}${IMG} A & B < C`;
const PAYLOAD_ESC = '&lt;iframe src=&quot;file:///etc/passwd&quot;&gt;&lt;/iframe&gt;&lt;img src=&#39;http://169.254.169.254/latest/meta-data/&#39;&gt; A &amp; B &lt; C';

/** Markup the builders must never emit from data: a live iframe/img/script tag or a broken-out attribute. */
function expectNoInjectedMarkup(html: string) {
  expect(html).not.toMatch(/<iframe/i);
  expect(html).not.toMatch(/<img[^>]*169\.254/i);
  expect(html).not.toMatch(/<script/i);
  expect(html).not.toMatch(/"><iframe|'><img/i);
}

const htmlService = () => new TranscriptHtmlService(new ThemeCssService(), Object.create(UtilityService.prototype));

const theme = (): any => ({
  jBBold: 'SQ', bLMbrand: true, cPNAlignRL: 'Right', cPNAlignTB: 'Bottom', cPNPosition: 'P',
  cPCaseName: 'TL', cPVolumeDate: 'TR', cPCompany: 'BL', cPCompanyInfo: 'BR',
  nBFont: 3, nBFontsize: 12, nCFontsize: 12, nLFontsize: 10, nTFontsize: 10, nHFontsize: 10, nPNFontsize: 10,
});

const formData = (): any => ({
  cTransid: '11111111-1111-4111-8111-111111111111',
  cTitle: 'Acme Holdings v Beta Trading', cTVolume: 'Day 3', dTranscribedDate: '2026-03-02T12:00:00Z',
  cCompany: 'Lloyd Michaux', cCompanyinfo: 'Transcript services',
  cCasetype: 'ARBITRATION UNDER THE RULES\nOF THE LCIA', cCCaseno: 'Case No 12345',
  cClaiment: 'ACME HOLDINGS LIMITED', cClaimentH: 'Claimant',
  cRespondent: 'BETA TRADING CO', cRespondentH: 'Respondent',
  cArbitrator: 'Sir John Smith KC\nMs Jane Doe', cCDay: 'Day 3', dCDate: '2026-03-02T12:00:00Z',
  cBClaiment: 'Mr A Barrister KC\nMs B Junior', cBClaimentH: 'On Behalf of Claimant',
  cBRespondent: 'Mr C Counsel', cBRespondentH: 'On Behalf of Respondent',
  cCAlign: 'C', cBehalfAlign: 'C', nCSpacing: 1,
});

const PAGE_TEXT = [
  ['THE CHAIRMAN: Good morning everyone.', 'MR SMITH: Good morning, sir. May I begin', 'Q. Could you state your full name for the record', 'A. My name is John Albert Brown.', 'Q. And you are the managing director of Acme'],
  ['A. That is correct.', 'Q. When did you first see the contract', 'A. In March 2019, at the board meeting.', 'THE CHAIRMAN: Thank you. Please continue.', 'MR SMITH: I am grateful.'],
];

const lines = (pages = 2): any[] => {
  const out = [];
  for (let p = 1; p <= pages; p++) {
    PAGE_TEXT[(p - 1) % 2].forEach((linetext, i) => out.push({ pageno: p, lineno: i + 1, timestamp: `09:3${p}:0${i}`, linetext }));
  }
  return out;
};

const annotres = (): any[] => [
  [
    { pageIndex: 1, color: 'ffd400', cordinates: [{ l: 1, p: 1, startIndex: 4, endIndex: 20 }] },
    { pageIndex: 1, color: 'f5c242', cordinates: [{ l: 4, p: 1, startIndex: 3, endIndex: 24 }] },
    { pageIndex: 2, color: '7dbaff', cordinates: [{ l: 3, p: 2, startIndex: 6, endIndex: 16 }] },
  ],
  [{ cPageno: 1, cLineno: 2, cColor: 'EBCAFF' }, { cPageno: 2, cLineno: 4, cColor: 'C8F7C5' }],
  [{ pageIndex: 2, color: '7DBAFF', cordinates: [{ l: 2, p: 2, startIndex: 3, endIndex: 20 }] }],
];

const summaryOfAnnots = (): any[] => [
  { title: 'QFact', data: [{
    pageIndex: 1, cLineno: 4, cONote: 'My name is John Albert Brown.', cNote: 'Witness identity confirmed',
    issues: [{ cIName: 'Witness Credibility', cColor: 'f5c242', nImpactid: 2, cRel: 'High', cImp: 'Major', impactImgSrc: 'data:image/png;base64,AAAA' }],
    cCreateby: 'Jane Doe', dCreateDt: '02/03/2026', jCordinates: [{ l: 4, p: 1, t: '09:30', text: 'My name is John Albert Brown.' }], list: [],
  }] },
  { title: 'Full Fact', data: [{
    pageIndex: 2, cLineno: 3, cONote: 'In March 2019, at the board meeting.', cNote: 'Date of first sight',
    issues: [{ cIName: 'Contract Formation', cColor: '7dbaff', nImpactid: 1, cRel: 'Medium', cImp: 'Minor' }],
    cCreateby: 'John Roe', dCreateDt: '02/03/2026', jCordinates: [],
    list: [{ jLinktype: { type: 'C' }, cFilename: 'Board Minutes March 2019.pdf', cExhibitno: 'C-12', cRefpage: '4', cBundletag: 'B1', cBetween: 'Acme and Beta', cType: 'Minutes', cStatus: 'Agreed', cNote: 'See paragraph 3' }],
  }] },
  { title: 'DocLink', data: [{
    pageIndex: 2, cLineno: 2, cONote: 'When did you first see the contract', cNote: '', issues: [],
    cCreateby: 'Jane Doe', dCreateDt: '02/03/2026', jCordinates: [{ l: 2, p: 2, t: '09:31', text: 'When did you first see the contract' }],
    list: [{ jLinktype: { type: 'L' }, cFilename: 'Contract.pdf', dFrom: '01/01/2019', dTo: '31/12/2019', cDoctype: 'Agreement', cDesc: 'Signed copy' }],
  }] },
];

const summaryOfHighlights = (): any[] => [
  { title: 'Quick Mark', data: [
    { nGroupid: 'g1', data: [{ cPageno: 1, pageIndex: 1, cLineno: '2', cONote: 'MR SMITH: Good morning, sir. May I begin', cNote: 'Opening', cCreateby: 'Jane Doe', dCreateDt: '02/03/2026', jCordinates: [{ l: 2, p: 1, t: '09:30', text: 'MR SMITH: Good morning, sir. May I begin' }], cColor: 'EBCAFF', issues: [{ cIName: 'Procedure', cColor: 'aaaaaa', nImpactid: 3, cRel: 'Low', cImp: 'None' }] }] },
    { nGroupid: 'g2', data: [{ cPageno: 2, pageIndex: 2, cLineno: '4', cONote: 'THE CHAIRMAN: Thank you. Please continue.', cNote: 'Direction', cCreateby: 'John Roe', dCreateDt: '02/03/2026', jCordinates: [], cColor: '#C8F7C5' }] },
  ] },
];

const exportQuery = (over: any = {}): any => ({
  cTranscript: 'Y', bCoverpg: true, cExportName: 'Day 3 Export', bQfact: true, bQmark: true, bAnnotations: true,
  cAnnotationType: 'ALL', bPagination: true, bTimestamp: true, jPages: [], ...over,
});

/** Publish-style FST export with cover, annotation summary, inline highlights and doclinks. */
const renderAnnotatedFst = (fd = formData(), q = exportQuery(), ls = lines(), ar = annotres(), sa = summaryOfAnnots(), sh = summaryOfHighlights(), origin = 'https://rt.example.test') =>
  htmlService().generateHtml(fd, ls, theme(), 'FST', origin, true, q, ar, sa, sh, false);

/** Condensed export with the "session" cover (cTranscript N), as the annothighlightexport path builds it. */
const renderSessionCover4Up = (q: any = {}) =>
  htmlService().generateHtml(formData(), lines(5), theme(), '4UP', 'https://rt.example.test', false,
    exportQuery({ cTranscript: 'N', cCasename: 'Day 3 Morning Session', cUsername: 'Jane Doe', otherCaseData: { cCasename: 'Acme v Beta' }, ...q }));

const wordIndexService = () => new GenerateWordIndexService({ get: () => 'assets/realtime-transcripts/' } as any, {} as any, {} as any, {} as any);
const wordMap = () => ({ acme: [{ pageno: 1, lineno: 5 }], board: [{ pageno: 2, lineno: 3 }], contract: [{ pageno: 2, lineno: 2 }], morning: [{ pageno: 1, lineno: 1 }, { pageno: 1, lineno: 2 }] });
const wiFiledata = (over: any = {}) => ({ cCasename: 'Acme Holdings v Beta Trading', cTVolume: 'Day 3', dTranscribedDate: '2026-03-02T12:00:00Z', cCompany: 'Lloyd Michaux', cCompanyinfo: 'Transcript services', ...over });

const WK_TEMPLATE = '<html><head><title>t</title></head><body><table><tr><td class="main-content replacable-content"></td></tr></table><div id="main-content-placeholder"></div>';

const exportService = () => Object.assign(Object.create(ExportService.prototype), { exportPath: 'x/exports/', utilityService: Object.create(UtilityService.prototype) }) as ExportService;
const feedData = (text = PAGE_TEXT) => text.map((pg, i) => ({ page: i + 1, data: pg.map((t, j) => ({ time: `09:3${i}:0${j}`, lines: [t], formate: 'N', lineIndex: j + 1 })) }));
const caseRow = (over: any = {}) => ({ cCasename: 'Acme v Beta', cIndexheader: 'LONDON COURT OF INTERNATIONAL ARBITRATION', cClaimant: 'ACME HOLDINGS LIMITED', cRespondent: 'BETA TRADING CO', cName: 'Day 3', dDay: 'Monday', dSessionDt: '02 Mar 2026', ...over });
const wkAnnots = () => [[{ pageIndex: 1, color: 'f5c242', cordinates: [{ l: 4, startIndex: 3, endIndex: 24, text: 'My name is John Alber' }] }], [{ cPageno: 2, cLineno: 4, cColor: 'C8F7C5' }]];
const wkIssues = () => [{ title: 'QFact', data: [{ pageIndex: 1, cLineno: 4, cONote: 'My name is John Albert Brown.', cNote: 'Identity', issues: [{ cIName: 'Credibility', cColor: 'f5c242', nImpactid: 2, cRel: 'High', cImp: 'Major' }] }] }];
const wkHighlights = () => [{ title: 'Quick Mark', data: [{ nGroupid: 'g1', data: [{ cPageno: 1, cLineno: '2', cNote: 'Opening', issues: [] }] }] }];
const renderWk = (query: any = {}, x = caseRow(), data = feedData(), res = wkAnnots(), sa = wkIssues(), sh = wkHighlights()) =>
  exportService().generateHtmlContent({ jPages: [], bPagination: true, ...query } as any, data, res, true,
    { CaseName: query.cCasename ?? 'Day 3 Morning Session', ExportBy: query.cUsername ?? 'Jane Doe', cTranscript: 'N' }, x, sa, sh);

const exportTranscriptService = () => Object.assign(Object.create(ExporttranscriptService.prototype), { exportPath: 'x/exports/', log: { report: jest.fn() } }) as ExporttranscriptService;

describe('export HTML builders escape client and stored text', () => {
  beforeAll(() => { jest.useFakeTimers({ now: NOW }); });
  afterAll(() => { jest.useRealTimers(); });
  beforeEach(() => {
    const real = fs.readFileSync;
    jest.spyOn(fs, 'readFileSync').mockImplementation(((p: any, ...rest: any[]) =>
      String(p).endsWith('htmlTemplate.html') ? WK_TEMPLATE : (real as any)(p, ...rest)) as any);
  });
  afterEach(() => jest.restoreAllMocks());

  describe('escapeHtml', () => {
    it('escapes the five HTML metacharacters and nothing else', () => {
      expect(escapeHtml(`<a href="x" title='y'>&amp;</a>`)).toBe('&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;amp;&lt;/a&gt;');
      expect(escapeHtml('Plain text, 12:30 - Q. A. #ff00aa data:image/png;base64,AB+/=')).toBe('Plain text, 12:30 - Q. A. #ff00aa data:image/png;base64,AB+/=');
    });
    it('renders values exactly as a template literal would (undefined, null, numbers)', () => {
      expect(escapeHtml(undefined)).toBe(`${undefined}`);
      expect(escapeHtml(null)).toBe(`${null}`);
      expect(escapeHtml(12)).toBe('12');
    });
  });

  describe('unchanged output for text without special characters (recorded before escaping)', () => {
    it('annotated FST export', () => { expect(renderAnnotatedFst()).toMatchSnapshot(); });
    it('condensed export with the session cover', () => { expect(renderSessionCover4Up()).toMatchSnapshot(); });
    it('issue / highlight index blocks', () => {
      const s = htmlService();
      expect(s.bindIssuesIndex(summaryOfAnnots()) + s.bindHighlightsIndex(summaryOfHighlights(), theme()) + s.bindAllIssues(summaryOfAnnots()[0].data[0])).toMatchSnapshot();
    });
    it('word index', () => { expect(wordIndexService().generateIndexHtml(wordMap(), wiFiledata())).toMatchSnapshot(); });
    it('issue/annothighlightexport (wkhtmltopdf) export', () => { expect(renderWk()).toMatchSnapshot(); });
    it('legacy exporttranscript builders', () => {
      const svc = exportTranscriptService();
      const x = { ...caseRow(), CaseName: 'Day 3 Morning Session', ExportBy: 'Jane Doe', cTClaimant: 'Mr A Barrister KC', cTRespondent: 'Mr C Counsel' };
      expect(svc.generateHtmlContent(feedData(), [], x) + svc.generateIndexHtml(wordMap(), wiFiledata())).toMatchSnapshot();
    });
  });

  describe('client-sent names (annothighlightexport / publish cover)', () => {
    it('cCasename, cUsername and the stored case name render as text on the session cover', () => {
      const html = renderSessionCover4Up({ cCasename: PAYLOAD, cUsername: PAYLOAD, otherCaseData: { cCasename: PAYLOAD } });
      expectNoInjectedMarkup(html);
      expect(html).toContain(`<p style="font-size:20px">${PAYLOAD_ESC}</p>`);
      expect(html).toContain(` Exported By ${PAYLOAD_ESC}</p>`);
    });

    it('a crafted Host origin cannot break out of the cover image src', () => {
      const html = renderAnnotatedFst(undefined, undefined, undefined, undefined, undefined, undefined, `https://x"><iframe src="file:///etc/passwd"></iframe>`);
      expectNoInjectedMarkup(html);
      expect(html).toContain('<img src="https://x&quot;&gt;&lt;iframe src=&quot;file:///etc/passwd&quot;&gt;&lt;/iframe&gt;/assets/bglayer.png"');
    });
  });

  describe('stored text', () => {
    it('cover fields (case type, parties, tribunal, appearances) render as text', () => {
      const fd = formData();
      for (const k of ['cCasetype', 'cCCaseno', 'cClaiment', 'cClaimentH', 'cRespondent', 'cRespondentH', 'cArbitrator', 'cCDay', 'cBClaiment', 'cBClaimentH', 'cBRespondent', 'cBRespondentH']) fd[k] = `${k} ${PAYLOAD}`;
      const html = renderAnnotatedFst(fd);
      expectNoInjectedMarkup(html);
      expect(html).toContain(`<pre id="cCasetype" class="text-1 customfont">cCasetype ${PAYLOAD_ESC}</pre>`);
      expect(html).toContain(`<pre class="cArbitrator">cArbitrator ${PAYLOAD_ESC}</pre>`);
      expect(html).toContain(`<pre id="cBClaimentH">cBClaimentH ${PAYLOAD_ESC}</pre>`);
      expect(html).toContain(`[cClaimentH ${PAYLOAD_ESC}]`);
    });

    it('page header / footer values render as text', () => {
      const fd = formData();
      fd.cTitle = PAYLOAD; fd.cTVolume = PAYLOAD; fd.cCompany = PAYLOAD; fd.cCompanyinfo = PAYLOAD;
      const html = renderAnnotatedFst(fd);
      expectNoInjectedMarkup(html);
      expect(html).toContain(`[data-postion1]="TL">${PAYLOAD_ESC}</pre>`);
      expect(html).toContain(`[data-postion1]="BR">${PAYLOAD_ESC}</pre>`);
    });

    it('transcript line text and timestamps render as text', () => {
      const ls = lines();
      ls[2].linetext = `Q. ${PAYLOAD}`;
      ls[2].timestamp = '<b>09:30</b>';
      const html = renderAnnotatedFst(undefined, undefined, ls);
      expectNoInjectedMarkup(html);
      // Speaker bolding stops at the first colon (file:), question bolding wraps the whole line.
      expect(html).toContain(`<strong><strong>Q. &lt;iframe src=&quot;file:</strong>${PAYLOAD_ESC.slice(PAYLOAD_ESC.indexOf('///etc'))}</strong></pre>`);
      expect(html).toContain('<span class="timestamp customfont">&lt;b&gt;09:30&lt;/b&gt;</span>');
    });

    it('highlights still wrap the right characters when the line holds escaped characters', () => {
      const ls = lines();
      ls[3].linetext = `A. Tom & Jerry's <cat> said "no"`;
      const ar = annotres();
      // plain-text range of Jerry's <cat> in the raw line
      const start = ls[3].linetext.indexOf('Jerry');
      ar[0][1].cordinates[0] = { l: 4, p: 1, startIndex: start, endIndex: start + "Jerry's <cat>".length };
      const html = renderAnnotatedFst(undefined, undefined, ls, ar);
      expect(html).toContain('>A. Tom &amp; <span class="inline-highlight" style="background:#f5c242;opacity:0.8;mix-blend-mode:darken;">Jerry&#39;s &lt;cat&gt;</span> said &quot;no&quot;</pre>');
    });

    it('a highlight crossing the bold speaker tag still splits around it', () => {
      const html = renderAnnotatedFst();
      expect(html).toContain('<strong>THE <span class="inline-highlight" style="background:#ffd400;opacity:0.8;mix-blend-mode:darken;">CHAIRMAN:</span></strong><span class="inline-highlight" style="background:#ffd400;opacity:0.8;mix-blend-mode:darken;"> Good m</span>orning everyone.');
    });

    it('annotation cards: notes, source text, issue names, authors and link metadata render as text', () => {
      const sa = summaryOfAnnots();
      const q = sa[0].data[0];
      q.cNote = PAYLOAD; q.cONote = `src ${PAYLOAD}`; q.cCreateby = PAYLOAD; q.dCreateDt = PAYLOAD;
      q.issues[0].cIName = PAYLOAD; q.issues[0].cRel = PAYLOAD; q.issues[0].impactImgSrc = `x" onerror="alert(1)`;
      q.jCordinates[0].text = PAYLOAD; q.jCordinates[0].t = PAYLOAD; q.jCordinates[0].l = PAYLOAD;
      const link = sa[1].data[0].list[0];
      for (const k of ['cFilename', 'cExhibitno', 'cRefpage', 'cBundletag', 'cBetween', 'cType', 'cStatus', 'cNote']) link[k] = PAYLOAD;
      const html = renderAnnotatedFst(undefined, undefined, undefined, undefined, sa);
      expectNoInjectedMarkup(html);
      expect(html).not.toContain('onerror="alert');
      expect(html).toContain(`<div class="ac-note">Note: ${PAYLOAD_ESC}</div>`);
      expect(html).toContain(`<div class="ac-fl-note">${PAYLOAD_ESC}</div>`);
      expect(html).toContain(`<span class="ac-issue-name">${PAYLOAD_ESC}</span>`);
      expect(html).toContain(`Created by ${PAYLOAD_ESC} &nbsp;|&nbsp; ${PAYLOAD_ESC}</div>`);
    });

    it('quick-mark cards and the unused index builders render notes and colours as text', () => {
      const sh = summaryOfHighlights();
      const m = sh[0].data[0].data[0];
      m.cNote = PAYLOAD; m.cONote = PAYLOAD; m.cColor = `EBCAFF"><iframe src="file:///etc/passwd"></iframe>`; m.jCordinates[0].text = PAYLOAD;
      m.issues[0].cIName = PAYLOAD; m.issues[0].cColor = `x" ><iframe src=file:///x>`;
      const s = htmlService();
      const html = renderAnnotatedFst(undefined, undefined, undefined, undefined, undefined, sh) + s.bindHighlightsIndex(sh, theme()) + s.bindAllIssues(m);
      expectNoInjectedMarkup(html);
      expect(html).toContain(`<div class="ac-note">Note: ${PAYLOAD_ESC}</div>`);
    });

    it('highlight / doclink colours cannot break out of their style attribute', () => {
      const ar = annotres();
      ar[0][1].color = `f00;"><iframe src="file:///etc/passwd"></iframe><span style="`;
      ar[1][0].cColor = `fff"><iframe src="file:///etc/passwd"></iframe>`;
      ar[2][0].color = `7DBAFF"><iframe src="file:///etc/passwd"></iframe>`;
      expectNoInjectedMarkup(renderAnnotatedFst(undefined, undefined, undefined, ar));
    });

    it('theme values cannot close the style block or the class attribute', () => {
      const t = theme();
      t.nBFontsize = '12pt;}</style><iframe src="file:///etc/passwd"></iframe><style>';
      t.cPNAlignRL = 'Right"><iframe src="file:///etc/passwd"></iframe>';
      t.bPNSwap = true;
      const html = htmlService().generateHtml(formData(), lines(), t, 'FST', 'https://rt.example.test', false, exportQuery());
      expectNoInjectedMarkup(html);
      expect(html.match(/<\/style>/gi)).toHaveLength(1);
    });

    it('word index header / footer render as text', () => {
      const html = wordIndexService().generateIndexHtml(wordMap(), wiFiledata({ cCasename: PAYLOAD, cTVolume: PAYLOAD, cCompany: PAYLOAD, cCompanyinfo: PAYLOAD }));
      expectNoInjectedMarkup(html);
      expect(html).toContain(`<pre> ${PAYLOAD_ESC}</pre>`);
      expect(html).toContain(`<div class="footer-right">${PAYLOAD_ESC} </div>`);
    });
  });

  describe('issue/annothighlightexport (wkhtmltopdf) builder', () => {
    it('client names, case fields, lines, notes and issue names render as text', () => {
      const data = feedData();
      data[0].data[1].lines = [PAYLOAD];
      data[0].data[1].time = PAYLOAD;
      const sa = wkIssues();
      sa[0].data[0].cNote = PAYLOAD; sa[0].data[0].cONote = PAYLOAD; sa[0].data[0].issues[0].cIName = PAYLOAD; sa[0].data[0].issues[0].cColor = `x"><iframe src=file:///x>`;
      const sh = wkHighlights();
      sh[0].data[0].data[0].cNote = PAYLOAD;
      const html = renderWk({ cCasename: PAYLOAD, cUsername: PAYLOAD }, caseRow({ cCasename: PAYLOAD, cIndexheader: PAYLOAD, cClaimant: PAYLOAD, cRespondent: PAYLOAD, cName: PAYLOAD, dSessionDt: PAYLOAD }), data, wkAnnots(), sa, sh);
      expectNoInjectedMarkup(html);
      expect(html).toContain(`<h1 class="case-name">${PAYLOAD_ESC}</h1>`);
      expect(html).toContain(`By ${PAYLOAD_ESC} <br>`);
      expect(html).toContain(`<td class="line-text"><span> ${PAYLOAD_ESC}<span></td>`);
    });

    it('the highlight span wraps the right characters of an escaped line', () => {
      const data = feedData();
      data[0].data[3].lines = [`A. Tom & Jerry's <cat>`];
      const start = 'A. Tom & '.length;
      const res = [[{ pageIndex: 1, color: 'f5c242', cordinates: [{ l: 4, startIndex: start, endIndex: start + "Jerry's".length, text: "Jerry's" }] }], []];
      const html = renderWk({}, caseRow(), data, res);
      expect(html).toContain('<span> A. Tom &amp; <span style="background:#f5c242">Jerry&#39;s</span> &lt;cat&gt;<span></td>');
    });
  });

  describe('legacy exporttranscript builders', () => {
    it('render names, lines and index header as text', () => {
      const svc = exportTranscriptService();
      const data = feedData();
      data[0].data[0].lines = [PAYLOAD];
      const x = { ...caseRow({ cCasename: PAYLOAD, cName: PAYLOAD }), CaseName: PAYLOAD, ExportBy: PAYLOAD, cTClaimant: PAYLOAD, cTRespondent: PAYLOAD };
      const html = svc.generateHtmlContent(data, [], x) + svc.generateIndexHtml(wordMap(), wiFiledata({ cCasename: PAYLOAD, cCompany: PAYLOAD }));
      expectNoInjectedMarkup(html);
      expect(html).toContain(`<td class="line-text">${PAYLOAD_ESC}</td>`);
    });
  });

  /*
   * Fact notes (jTexts) and source text (jOT) come from the legacy contenteditable editors and are
   * stored as HTML (`text<br>`, `a<div>b</div>`, `&nbsp;`, `<span class="alias_mention">`); the
   * exports always rendered them as HTML. Escaping them like plain text printed the tags.
   */
  describe('stored editor markup in notes', () => {
    const EDITOR_NOTE = `Does not include rates<br><div>- no permit&nbsp;needed</div><div><br></div><span class="alias_mention" contenteditable="false">@Jane</span>`;
    const EDITOR_NOTE_HTML = 'Does not include rates<br><div>- no permit&nbsp;needed</div><div><br></div><span>@Jane</span>';

    it('escapeRichText keeps the editor line structure and character references, and nothing else', () => {
      expect(escapeRichText(EDITOR_NOTE)).toBe(EDITOR_NOTE_HTML);
      expect(escapeRichText(PAYLOAD)).toBe(PAYLOAD_ESC);
      expect(escapeRichText('<p onclick="x">a</p><B>b</B><br/>')).toBe('<p>a</p><b>b</b><br>');
      expect(escapeRichText('<div style="background:url(http://169.254.169.254/)">x</div>')).toBe('<div>x</div>');
      // An end tag with nothing open is dropped, so a note cannot close the card around it.
      expect(escapeRichText('</span></div></div>x<div>y')).toBe('x<div>y</div>');
      expect(escapeRichText('<b><i>x</b></i>')).toBe('<b><i>x</i></b>');
      expect(escapeRichText(`Tom & Jerry's "cat" &amp; &bogus`)).toBe('Tom &amp; Jerry&#39;s &quot;cat&quot; &amp; &amp;bogus');
      expect(escapeRichText('Plain text, 12:30 - Q. A.')).toBe('Plain text, 12:30 - Q. A.');
    });

    it('publish / annotated export: notes and source text keep their line breaks; injected tags stay text', () => {
      const sa = summaryOfAnnots();
      const fact = sa[1].data[0];
      fact.cNote = `${EDITOR_NOTE}${IFRAME}`;
      fact.cONote = EDITOR_NOTE;
      fact.list[0].cNote = EDITOR_NOTE;
      const sh = summaryOfHighlights();
      sh[0].data[1].data[0].cONote = EDITOR_NOTE;
      const html = renderAnnotatedFst(undefined, undefined, undefined, undefined, sa, sh);
      expectNoInjectedMarkup(html);
      expect(html).toContain(`<div class="ac-note">Note: ${EDITOR_NOTE_HTML}&lt;iframe src=&quot;file:///etc/passwd&quot;&gt;&lt;/iframe&gt;</div>`);
      expect(html).toContain(`<span class="ac-lt">${EDITOR_NOTE_HTML}</span>`);
      expect(html).toContain(`<div class="ac-fl-note">${EDITOR_NOTE_HTML}</div>`);
      expect(html).not.toContain('&lt;br&gt;');
      expect(html).not.toContain('&amp;nbsp;');
      expect(html).not.toContain('alias_mention');
      const index = htmlService().bindHighlightsIndex([{ title: 'Quick Mark', data: [{ nGroupid: 'g', data: [{ cPageno: 1, cNote: EDITOR_NOTE, cONote: EDITOR_NOTE, jCordinates: [] }] }] }], theme());
      expect(index).toContain(`<div class="ac-note">Note: ${EDITOR_NOTE_HTML}</div>`);
    });

    it('issue/annothighlightexport (wkhtmltopdf): notes keep their line breaks; injected tags stay text', () => {
      const sa = wkIssues();
      sa[0].data[0].cNote = `${EDITOR_NOTE}${IFRAME}`;
      sa[0].data[0].cONote = EDITOR_NOTE;
      const sh = wkHighlights();
      sh[0].data[0].data[0].cNote = EDITOR_NOTE;
      const html = renderWk({}, caseRow(), feedData(), wkAnnots(), sa, sh);
      expectNoInjectedMarkup(html);
      expect(html).toContain(`<div class="source">${EDITOR_NOTE_HTML}</div>`);
      expect(html).toContain(`<div class="note">${EDITOR_NOTE_HTML}&lt;iframe src=&quot;file:///etc/passwd&quot;&gt;&lt;/iframe&gt;</div>`);
      expect(html).not.toContain('&lt;br&gt;');
    });
  });

  /*
   * wkhtmltopdf cannot block requests one by one, so a stored colour that adds a declaration
   * (`fff;background-image:url(http://169.254.169.254/)`) would make the server fetch that URL.
   */
  describe('colours in the wkhtmltopdf export cannot add CSS', () => {
    const SSRF = 'f5c242;background-image:url(http://169.254.169.254/latest/meta-data/)';

    it('cssColor passes colour values through and drops anything that could add a declaration or url', () => {
      for (const c of ['#ffd400', 'ffd400', 'EBCAFF', 'rgba(0, 0, 0, 0.5)', 'yellow', undefined, '']) expect(cssColor(c)).toBe(String(c));
      for (const c of [SSRF, 'fff" onload="x', 'url(//evil.example/x)', 'red\\3b x', 'red}body{x:y']) expect(cssColor(c)).toBe('');
    });

    it('line highlight, quick-mark and issue colours cannot inject url() into the page', () => {
      const res: any[] = wkAnnots();
      res[0][0].color = SSRF;
      res[1][0].cColor = SSRF;
      const sa = wkIssues();
      sa[0].data[0].issues[0].cColor = SSRF;
      const html = renderWk({}, caseRow(), feedData(), res, sa);
      expect(html).not.toMatch(/url\(/i);
      expect(html).not.toContain('169.254.169.254');
      // the highlight / row / issue elements are still there, just without a colour
      expect(html).toContain('<span style="background:">');
      expect(html).toContain('<tr style="background:#" class="line-N">');
      expect(html).toContain('<span class="issuebar" style="background:# !important"></span>');
    });
  });
});
