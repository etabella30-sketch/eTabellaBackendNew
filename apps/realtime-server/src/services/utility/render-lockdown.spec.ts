import * as fs from 'fs';
import * as http from 'http';
import * as os from 'os';
import * as path from 'path';
import { pathToFileURL } from 'url';
import * as puppeteer from 'puppeteer';
import * as lockdown from './render-lockdown';
import { decideRenderRequest, lockDownRenderPage, RenderDecision, renderPolicyFor } from './render-lockdown';
import { TranscriptpublishService } from '../transcript/transcript_publish.service';
import { ExporttranscriptService } from '../exporttranscript/exporttranscript.service';
import { GenerateWordIndexService } from '../exporttranscript/generate_word_index/generate_word_index.service';
import { TranscriptHtmlService } from '../transcript/transcript-html.service';
import { ThemeCssService } from '../transcript/theme-css.service';
import { UtilityService } from './utility.service';

jest.setTimeout(90_000);

/** The URL shape the services pass to page.goto. */
const serviceFileUrl = (p: string) => 'file:///' + path.resolve(p).split(path.sep).join('/');

describe('render lockdown: request policy', () => {
  const root = path.join(os.tmpdir(), 'lockdown-policy');
  const doc = path.join(root, 'exports', 't_1_0.html');
  const policy = renderPolicyFor(doc);
  const decide = (url: string, nav = false, main = true) => decideRenderRequest(policy, url, nav, main).action;

  it('lets the export page itself load in the main frame only', () => {
    expect(decide(pathToFileURL(doc).href, true, true)).toBe('continue');
    expect(decide(serviceFileUrl(doc), true, true)).toBe('continue');
    expect(decide(pathToFileURL(doc).href, true, false)).toBe('abort');
  });

  it('refuses every other navigation: file:// iframes, meta refresh, links, data: frames', () => {
    expect(decide('file:///etc/passwd', true, false)).toBe('abort');
    expect(decide('file:///etc/passwd', true, true)).toBe('abort');
    expect(decide(pathToFileURL(path.join(root, 'exports', 't_2_0.html')).href, true, true)).toBe('abort');
    expect(decide('http://127.0.0.1:8080/', true, true)).toBe('abort');
    expect(decide('data:text/html,<p>x</p>', true, false)).toBe('abort');
  });

  it('allows the theme fonts / images next to the page, and nothing else on disk', () => {
    const assets = path.join(root, 'exports', 'assets');
    expect(decide(pathToFileURL(path.join(assets, 'fonts', 'styles', 'calibri-regular.ttf')).href)).toBe('continue');
    expect(decide(pathToFileURL(path.join(assets, 'fonts', 'styles', 'times.woff')).href)).toBe('continue');
    expect(decide(pathToFileURL(path.join(assets, 'x.html')).href)).toBe('abort');
    expect(decide(pathToFileURL(path.join(assets, 'fonts', '..', '..', 's_1.json')).href)).toBe('abort');
    expect(decide(pathToFileURL(path.join(root, 'exports', 'assetsX', 'f.ttf')).href)).toBe('abort');
    expect(decide(pathToFileURL(path.join(root, 'exports', 't_2_0.html')).href)).toBe('abort');
    expect(decide('file:///etc/passwd')).toBe('abort');
    expect(decide('file:///C:/Windows/win.ini')).toBe('abort');
    expect(decide('file://fileserver/share/f.ttf')).toBe('abort');
  });

  it('blocks all http(s) (internal hosts, metadata, CDNs) except the bglayer stand-in, served from disk', () => {
    expect(decide('http://169.254.169.254/latest/meta-data/')).toBe('abort');
    expect(decide('http://localhost:5432/')).toBe('abort');
    expect(decide('https://fonts.gstatic.com/s/opensans/v40/x.woff2')).toBe('abort');
    expect(decide('https://etabella.tech/docs/impacts/1.png')).toBe('abort');
    const bg = decideRenderRequest(policy, 'https://attacker.example/assets/bglayer.png', false, true);
    expect(bg).toEqual({ action: 'respond', file: path.resolve('assets', 'bglayer.png'), contentType: 'image/png' });
    // Linux-local origin (process.cwd()) resolves the same image to a file:// URL.
    expect(decide(pathToFileURL(path.resolve('assets', 'bglayer.png')).href)).toBe('continue');
  });

  it('allows data: URIs (embedded impact icons) and refuses other schemes', () => {
    expect(decide('data:image/png;base64,iVBORw0KGgo=')).toBe('continue');
    for (const url of ['blob:null/1234', 'about:blank', 'chrome://settings', 'ftp://x/y', 'ws://127.0.0.1/', 'javascript:alert(1)', 'not a url']) {
      expect(decide(url)).toBe('abort');
    }
  });
});

const chromeAvailable = (() => {
  try { return fs.existsSync(puppeteer.executablePath()); } catch { return false; }
})();
const describeChrome = chromeAvailable ? describe : describe.skip;

describeChrome('render lockdown: real headless renders', () => {
  let tmp: string;
  let exportsDir: string;
  let secretPath: string;
  let server: http.Server;
  let port: number;
  let hits: string[];

  const maliciousHtml = (refresh = true) => `<!DOCTYPE html><html><head><title>t</title>
${refresh ? `<meta http-equiv="refresh" content="0;url=http://127.0.0.1:${port}/refresh">` : ''}
<link rel="stylesheet" href="http://127.0.0.1:${port}/style.css">
<style>@font-face{font-family:'f';src:url('./assets/fonts/styles/f.ttf') format('truetype')} body{font-family:'f'} .bg{background:url(http://127.0.0.1:${port}/cssbg.png)}</style>
</head><body><p class="bg">EXPORT-TEXT</p>
<iframe src="${pathToFileURL(secretPath).href}"></iframe>
<object data="${pathToFileURL(secretPath).href}"></object>
<img src="http://127.0.0.1:${port}/leak.png">
<img src="http://127.0.0.1:${port}/assets/bglayer.png">
<script>document.title = 'js-ran'; new Image().src = 'http://127.0.0.1:${port}/js';</script>
</body></html>`;

  beforeAll(async () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lockdown-'));
    exportsDir = path.join(tmp, 'exports');
    fs.mkdirSync(path.join(exportsDir, 'assets', 'fonts', 'styles'), { recursive: true });
    fs.writeFileSync(path.join(exportsDir, 'assets', 'fonts', 'styles', 'f.ttf'), Buffer.alloc(64));
    secretPath = path.join(tmp, 'secret.txt');
    fs.writeFileSync(secretPath, 'TOPSECRET-4f1c');
    hits = [];
    server = http.createServer((req, res) => { hits.push(req.url || ''); res.end('x'); });
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', () => r()));
    port = (server.address() as any).port;
  });
  afterAll(async () => {
    await new Promise((r) => server.close(r));
    fs.rmSync(tmp, { recursive: true, force: true });
  });
  beforeEach(() => { hits.length = 0; });
  afterEach(() => jest.restoreAllMocks());

  /** Records every decision the services' lockdown makes, via the real implementation. */
  function recordLockdown() {
    const decisions: [string, RenderDecision][] = [];
    const real = lockdown.lockDownRenderPage;
    const spy = jest.spyOn(lockdown, 'lockDownRenderPage').mockImplementation((page, policy) =>
      real(page, policy, (url, d) => decisions.push([url, d])));
    return { decisions, spy };
  }
  const actionFor = (decisions: [string, RenderDecision][], fragment: string) =>
    decisions.filter(([u]) => u.includes(fragment)).map(([, d]) => d.action);

  it('a page with injected markup renders, but no request leaves, no other file loads and no script runs', async () => {
    const htmlPath = path.join(exportsDir, 'direct.html');
    fs.writeFileSync(htmlPath, maliciousHtml(false));
    const bgPng = path.join(tmp, 'bg.png');
    fs.writeFileSync(bgPng, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'));
    const policy = { ...renderPolicyFor(htmlPath), standIns: { '/assets/bglayer.png': bgPng } };
    const decisions: [string, RenderDecision][] = [];
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    try {
      const page = await browser.newPage();
      await lockDownRenderPage(page, policy, (url, d) => decisions.push([url, d]));
      await page.goto(serviceFileUrl(htmlPath), { waitUntil: 'networkidle0', timeout: 30_000 }).catch(() => undefined);
      const pdf = await page.pdf({ format: 'A4' });
      expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
      expect(await page.title()).toBe('t');
      const frameText = await Promise.all(page.frames().map((f) => f.content().catch(() => '')));
      expect(frameText.join('\n')).not.toContain('TOPSECRET');
      expect(frameText[0]).toContain('EXPORT-TEXT');
    } finally {
      await browser.close();
    }
    expect(hits).toEqual([]);
    expect(actionFor(decisions, 'secret.txt').every((a) => a === 'abort')).toBe(true);
    expect(actionFor(decisions, 'secret.txt').length).toBeGreaterThan(0);
    expect(actionFor(decisions, '/leak.png')).toEqual(['abort']);
    expect(actionFor(decisions, '/style.css')).toEqual(['abort']);
    expect(actionFor(decisions, 'f.ttf')).toEqual(['continue']);
    expect(actionFor(decisions, '/assets/bglayer.png')).toEqual(['respond']);
  });

  it('a meta refresh cannot navigate the renderer to another URL', async () => {
    const htmlPath = path.join(exportsDir, 'refresh.html');
    fs.writeFileSync(htmlPath, maliciousHtml(true));
    const decisions: [string, RenderDecision][] = [];
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    try {
      const page = await browser.newPage();
      await lockDownRenderPage(page, renderPolicyFor(htmlPath), (url, d) => decisions.push([url, d]));
      await page.goto(serviceFileUrl(htmlPath), { waitUntil: 'networkidle0', timeout: 30_000 }).catch(() => undefined);
      await new Promise((r) => setTimeout(r, 500));
    } finally {
      await browser.close();
    }
    expect(hits).toEqual([]);
    expect(actionFor(decisions, `127.0.0.1:${port}/refresh`)).toEqual(['abort']);
  });

  it('transcript publish / annotated export PDF (TranscriptpublishService.generatePdf) renders locked down', async () => {
    const { decisions, spy } = recordLockdown();
    const htmlPath = path.join(exportsDir, 't_publish_0.html');
    const pdfPath = path.join(tmp, 't_publish_0.pdf');
    fs.writeFileSync(htmlPath, maliciousHtml());
    const svc: any = Object.assign(Object.create(TranscriptpublishService.prototype), { log: { error: jest.fn() }, logTag: 'spec' });
    await expect(svc.generatePdf(htmlPath, pdfPath, 'A4')).resolves.toBe(true);
    expect(fs.readFileSync(pdfPath).subarray(0, 5).toString()).toBe('%PDF-');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][1].documentPath).toBe(path.resolve(htmlPath));
    expect(hits).toEqual([]);
    expect(actionFor(decisions, 'secret.txt').length).toBeGreaterThan(0);
    expect(actionFor(decisions, 'secret.txt').every((a) => a === 'abort')).toBe(true);
  });

  it('a real annotated export renders end to end (generateHtml -> generatePdf); the cover image is served from disk', async () => {
    const { decisions } = recordLockdown();
    const PAYLOAD = `<iframe src="${pathToFileURL(secretPath).href}"></iframe><img src="http://127.0.0.1:${port}/note.png"> Tom & Jerry's`;
    const lines = [1, 2].flatMap((p) => ['THE CHAIRMAN: Good morning.', 'Q. Could you state your name', `A. ${p === 1 ? PAYLOAD : 'John Brown.'}`]
      .map((linetext, i) => ({ pageno: p, lineno: i + 1, timestamp: `09:3${p}:0${i}`, linetext })));
    const html = new TranscriptHtmlService(new ThemeCssService(), Object.create(UtilityService.prototype)).generateHtml(
      { cTitle: 'Acme v Beta', cTVolume: 'Day 3', cCasetype: 'ARBITRATION', cCCaseno: '12345', cClaiment: 'ACME', cRespondent: 'BETA', cArbitrator: 'Sir John', cCDay: 'Day 3', cBClaiment: 'Mr A', cBRespondent: 'Mr C' } as any,
      lines as any, { jBBold: 'SQ', bLMbrand: true, cPNAlignRL: 'Right', cPNAlignTB: 'Bottom', cPCaseName: 'TL' } as any, 'FST', `http://127.0.0.1:${port}`, true,
      { cTranscript: 'Y', bQfact: true, bQmark: false, jPages: [], bPagination: true, bTimestamp: true },
      [[{ pageIndex: 1, color: 'f5c242', cordinates: [{ l: 3, startIndex: 3, endIndex: 12 }] }], [], []],
      [{ title: 'QFact', data: [{ pageIndex: 1, cLineno: 3, cONote: 'src', cNote: PAYLOAD, issues: [{ cIName: PAYLOAD, cColor: 'f5c242', nImpactid: 1, cImp: 'Major' }], jCordinates: [], list: [] }] }], [], false);
    const htmlPath = path.join(exportsDir, 't_e2e_0.html');
    const pdfPath = path.join(tmp, 't_e2e_0.pdf');
    fs.writeFileSync(htmlPath, html);
    const svc: any = Object.assign(Object.create(TranscriptpublishService.prototype), { log: { error: jest.fn() }, logTag: 'spec' });
    await expect(svc.generatePdf(htmlPath, pdfPath, 'A4')).resolves.toBe(true);
    expect(fs.statSync(pdfPath).size).toBeGreaterThan(1000);
    expect(hits).toEqual([]);
    expect(actionFor(decisions, `127.0.0.1:${port}/assets/bglayer.png`)).toContain('respond');
    expect(actionFor(decisions, 'etabella.tech/docs/impacts/1.png')).toEqual(['abort']);
  });

  it('.docx pre-render (ExporttranscriptService.generatePdf) renders locked down', async () => {
    const { decisions, spy } = recordLockdown();
    const htmlPath = path.join(exportsDir, 's_docx_FST.html');
    const pdfPath = path.join(tmp, 's_docx.pdf');
    fs.writeFileSync(htmlPath, maliciousHtml());
    const svc: any = Object.assign(Object.create(ExporttranscriptService.prototype), { kafka: { sendMessage: jest.fn() } });
    await expect(svc.generatePdf(htmlPath, pdfPath, 'm1')).resolves.toBe(pdfPath);
    expect(fs.readFileSync(pdfPath).subarray(0, 5).toString()).toBe('%PDF-');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][1].documentPath).toBe(path.resolve(htmlPath));
    expect(hits).toEqual([]);
    expect(actionFor(decisions, 'secret.txt').every((a) => a === 'abort')).toBe(true);
  });

  it('word index (GenerateWordIndexService.generateIndex) renders locked down', async () => {
    const { spy } = recordLockdown();
    fs.writeFileSync(path.join(tmp, 's_wi.json'), JSON.stringify([{ pageno: 1, lineno: 1, linetext: 'Contract formation evidence' }]));
    const db = { executeRef: jest.fn().mockResolvedValue({ data: [[{ cCasename: `<img src="http://127.0.0.1:${port}/wi.png">`, cTVolume: 'Day 3', dTranscribedDate: '2026-03-02T12:00:00Z', cCompany: 'LM', cCompanyinfo: 'x' }]] }) };
    const svc = new GenerateWordIndexService({ get: (k: string) => (k === 'REALTIME_PATH' ? tmp + path.sep : undefined) } as any, { report: jest.fn() } as any, {} as any, db as any);
    const pdf = await svc.generateIndex('s_wi.json', 'wi1');
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][1].documentPath).toBe(path.resolve(exportsDir, 'wi_wi1.html'));
    expect(hits).toEqual([]);
  });
});
