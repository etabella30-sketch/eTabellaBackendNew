/**
 * SCRATCH (untracked, investigation only): the RT page's live fit after a refresh, on a REAL box.
 *
 * A real box (apps/rt-edge, the harness's World) serves the FE edge build (dist/edge of the FE repo) and a LAN socket
 * with a live session of 30 full pages + a partial page. A headless Edge (Playwright from the FE repo) opens
 * /rt/session/<nSesid>?caseId=<nCaseid> with a test "online" token in localStorage and records the transcript zoom,
 * the stage height and the natural page height over the first 10 s after a load and after a reload.
 *
 * Run (backend repo root):
 *   npx jest --config apps/rt-edge/e2e/jest-e2e.config.js --maxWorkers=1 scratch-fit-repro
 * Env: FIT_SCEN (comma list of scenario names, default the base five), FIT_OUT (result JSON path),
 *      FIT_PARTIAL (lines on the live page at the start, default 12), FIT_LONG=1 (every 6th line is long and wraps).
 *
 * Only numbers leave the page (zooms, heights, counts): no transcript text is recorded.
 */
import * as fs from 'fs';
import * as path from 'path';

import { IDS } from './harness/cloud';
import { EclipseSender } from './harness/eclipse-sender';
import { sleep, waitFor } from './harness/pacer';
import { World } from './harness/world';

const FE_ROOT = 'D:/etabella tech/eTabella angular 21';
const FE_DIST = `${FE_ROOT}/dist/edge`;
const OUT = process.env.FIT_OUT || 'C:/Users/AlokLM/AppData/Local/Temp/claude/D--etabella-tech-eTabella-angular-21/489c33f1-8fe0-44ab-8cf3-a737945626a3/scratchpad/fit-repro.json';
const PARTIAL = Math.max(1, Math.min(24, Number(process.env.FIT_PARTIAL || 12)));
const LONG = process.env.FIT_LONG === '1';
const FULL_PAGES = Number(process.env.FIT_PAGES ?? 30);
const LONG_EVERY = Number(process.env.FIT_LONG_EVERY || 6);
const LONG_AT = Number(process.env.FIT_LONG_AT || 5);
const LAST_PAGE = 60;

// ---- the feed: Bridge wire format (0x02 <letter> <data> 0x03 between raw text bytes) -----------------------------
const STX = 0x02;
const ETX = 0x03;
const cmd = (letter: string, data: number[] = []): number[] => [STX, letter.charCodeAt(0), ...data, ETX];
const P = (page: number): number[] => cmd('P', [page & 0xff, (page >> 8) & 0xff]);
const N = (line: number): number[] => cmd('N', [line]);
const T = (sec: number): number[] => cmd('T', [Math.floor(sec / 3600), Math.floor(sec / 60) % 60, sec % 60, 0]);
const TEXTS = [
    'Q.  Can you tell the court where you were that evening?',
    'A.  I was at the office until about half past seven.',
    'Q.  And who else was present in the building at the time?',
    'A.  Only the night manager and two of the warehouse staff.',
    'Q.  Did you speak to any of them before you left?',
    'A.  I spoke briefly to the manager about the delivery.',
    'MR HARLOW:  My Lord, may I hand up the second bundle?',
    'THE COURT:  Yes, please do. Is it agreed, Ms Mercer?',
    'MS MERCER:  It is agreed, my Lord, subject to tab nine.',
    'Q.  Please turn to page forty of the bundle before you.',
    'A.  Yes, I have it. That is the invoice dated in March.',
    'Q.  Is that your signature at the foot of the page?',
    'A.  It looks like mine, but I do not recall signing it.',
];
const LONG_TEXT = 'A.  I should explain that the arrangement with the haulier was never put in writing, it was agreed on the telephone and then confirmed, as I understood it, by the depot manager a week or so later.';

/** One socket write per entry: P(page) at each page start, then N + T + text per line. */
function buildEntries(): Buffer[] {
    const out: Buffer[] = [];
    let sec = 10 * 3600;
    let k = 0;
    for (let page = 1; page <= LAST_PAGE; page++) {
        out.push(Buffer.from(P(page)));
        for (let line = 1; line <= 25; line++) {
            sec += 3;
            const text = LONG && k % LONG_EVERY === LONG_AT ? LONG_TEXT : TEXTS[k % TEXTS.length];
            k += 1;
            out.push(Buffer.from([...N(line), ...T(sec), ...Buffer.from(text, 'latin1')]));
        }
    }
    return out;
}
/** Entry index just after line `line` of page `page` (entries per page: 1 P + 25 lines). */
const entryAfter = (page: number, line: number): number => (page - 1) * 26 + 1 + line;

// ---- page instrumentation (plain JS, injected before any page script on every load) ------------------------------
const INSTRUMENT = String.raw`
(() => {
  if (window.top !== window) return;
  const T0 = performance.now();
  const S = window.__fit = { t0: T0, frames: [], muts: [], samples: [], probing: false, errors: 0 };
  const now = () => Math.round(performance.now() - T0);
  const q = (s, r) => (r || document).querySelector(s);
  const host = () => q('app-reader-transcript.rt-transcript') || q('app-reader-transcript');
  const num = v => (v === '' || v == null ? null : Number(v));
  const r1 = v => (v == null ? null : Math.round(v * 10) / 10);

  function parts() {
    const h = host();
    const body = h && q('.rt-scroll', h);
    const paper = body && q('.rt-paper', body);
    const cards = paper ? [...paper.querySelectorAll(':scope > .rt-page')] : [];
    return { h, body, paper, cards };
  }
  function stageOf(h, body) {
    if (!h) return null;
    const pad = body ? parseFloat(getComputedStyle(body).paddingTop) || 0 : 22;
    return Math.max(0, h.clientHeight - 60 - pad);
  }
  // The component's naturalPageHeight(): completed pages among the last 4 cards, else the live page's estimate.
  function natural(z) {
    const { body, cards } = parts();
    if (!body || !cards.length) return { natural: 0, estimated: false, used: [] };
    const livePage = Number(cards[cards.length - 1].dataset.page);
    let best = 0; const used = [];
    for (const card of cards.slice(-4)) {
      if (Number(card.dataset.page) === livePage) continue;
      const lines = card.querySelectorAll('.rt-line');
      if (!lines.length) continue;
      const hh = lines[lines.length - 1].getBoundingClientRect().bottom - card.getBoundingClientRect().top;
      used.push({ page: Number(card.dataset.page), lines: lines.length, h: r1(hh) });
      if (hh > 0) best = Math.max(best, hh / z + 23);
    }
    if (best) return { natural: best, estimated: false, used };
    const live = cards[cards.length - 1];
    const lines = live.querySelectorAll('.rt-line');
    if (!lines.length) return { natural: 0, estimated: false, used };
    const first = lines[0].getBoundingClientRect();
    const last = lines[lines.length - 1].getBoundingClientRect();
    const perLine = (last.bottom - first.top) / lines.length;
    if (perLine <= 0) return { natural: 0, estimated: false, used };
    const rows = Math.max(25, ...cards.map(c => c.querySelectorAll('.rt-line').length));
    return { natural: (first.top - live.getBoundingClientRect().top + perLine * rows) / z + 23, estimated: true, used: [{ page: livePage, lines: lines.length, perLine: r1(perLine) }] };
  }
  function light(tag) {
    const { h, body, paper, cards } = parts();
    return {
      t: now(), tag,
      hostZoom: h ? num(h.style.getPropertyValue('--rt-zoom')) : null,
      paperZoom: paper ? num(paper.style.zoom) : null,
      stageVar: body ? body.style.getPropertyValue('--rt-stage-h') : null,
      hostH: h ? h.clientHeight : null,
      hostW: h ? h.clientWidth : null,
      stage: stageOf(h, body),
      pagesInDom: cards.length,
      firstPage: cards.length ? Number(cards[0].dataset.page) : null,
      lastPage: cards.length ? Number(cards[cards.length - 1].dataset.page) : null,
      liveLines: cards.length ? cards[cards.length - 1].querySelectorAll('.rt-line').length : 0,
      two: !!(paper && paper.classList.contains('rt-paper--two')),
      skeleton: !!q('app-transcript-skeleton'),
      scrollTop: body ? Math.round(body.scrollTop) : null,
    };
  }
  const hOf = sel => { const el = q(sel); return el ? r1(el.getBoundingClientRect().height) : null; };
  function full(tag) {
    const base = light(tag);
    const { h, body, paper, cards } = parts();
    const z = base.paperZoom || base.hostZoom || 1;
    const nat = natural(z);
    const page = q('app-realtime-page');
    const ws = q('.rt-workspace');
    const top = q('.rt-top');
    const err = q('.rt-error');
    const live = cards[cards.length - 1];
    const bodyRect = body ? body.getBoundingClientRect() : null;
    const liveRect = live ? live.getBoundingClientRect() : null;
    const prev = cards.length > 1 ? cards[cards.length - 2].getBoundingClientRect() : null;
    return Object.assign(base, {
      path: location.pathname,
      natural: r1(nat.natural), estimated: nat.estimated, used: nat.used,
      topH: hOf('.rt-top'), topHidden: !!(top && top.classList.contains('rt-top--hidden')),
      toolbarH: hOf('.rt-toolbar'),
      roomBannerH: hOf('app-edge-room-banner'), cloudBannerH: hOf('app-cloud-venue-banner'),
      errorH: err ? r1(err.getBoundingClientRect().height) : null, errorLen: err ? (err.textContent || '').length : 0,
      wsTop: ws ? r1(ws.getBoundingClientRect().top) : null, wsH: ws ? r1(ws.getBoundingClientRect().height) : null,
      chromeZoom: page ? page.style.getPropertyValue('--rt-chrome-zoom') : null,
      rootZoom: getComputedStyle(document.documentElement).zoom, bodyCssZoom: getComputedStyle(document.body).zoom,
      innerW: innerWidth, innerH: innerHeight, dpr: devicePixelRatio,
      fonts: document.fonts ? document.fonts.status : null,
      peek: !!q('.rt-live-peek__close'),
      waiting: !!q('app-edge-waiting-state'), loader: !!q('app-gavel-loader'), expiryPanelH: hOf('app-room-signin-expiry-panel'),
      bodyTop: bodyRect ? r1(bodyRect.top) : null, bodyBottom: bodyRect ? r1(bodyRect.bottom) : null, bodyClientH: body ? body.clientHeight : null,
      scrollH: body ? body.scrollHeight : null,
      liveTop: liveRect ? r1(liveRect.top) : null, liveBottom: liveRect ? r1(liveRect.bottom) : null,
      prevTop: prev ? r1(prev.top) : null, prevBottom: prev ? r1(prev.bottom) : null,
    });
  }
  // The component's measureFit(), drawn on the same three elements and put back afterwards.
  function probe(startZoom) {
    const { h, body, paper } = parts();
    if (!h || !body || !paper) return null;
    const stage = stageOf(h, body);
    const hostW = h.clientWidth;
    const two = paper.classList.contains('rt-paper--two');
    const keep = { hz: h.style.getPropertyValue('--rt-zoom'), bz: body.style.getPropertyValue('--rt-zoom'), pz: paper.style.zoom, st: body.scrollTop };
    S.probing = true;
    const draw = zoom => { const z = String(zoom / 100); h.style.setProperty('--rt-zoom', z); body.style.setProperty('--rt-zoom', z); paper.style.setProperty('zoom', z); };
    const at = zoom => {
      draw(zoom);
      const n = natural(zoom / 100);
      if (!n.natural) return null;
      const heightFit = (stage / n.natural) * 100;
      const widthFit = two && hostW ? ((hostW - 57) / (2 * 480 + 20)) * 100 : 100;
      return { fit: Math.max(65, Math.min(100, heightFit, widthFit)), natural: n.natural, estimated: n.estimated };
    };
    const fits = (zoom, m) => Math.floor(m.fit + 1e-6) >= zoom;
    const run = () => {
      let z = startZoom || 100;
      const tried = new Map();
      for (let i = 0; i < 4; i++) {
        const m = at(z);
        if (!m) return null;
        const next = Math.floor(m.fit + 1e-6);
        if (next === z) return m;
        tried.set(z, m);
        if (tried.has(next)) break;
        z = next;
      }
      const zooms = [...tried.keys()].sort((a, b) => a - b);
      let lo = zooms.filter(k => fits(k, tried.get(k))).at(-1) ?? null;
      if (lo === null) { const floor = at(65); if (!floor) return null; tried.set(65, floor); lo = 65; }
      let hi = zooms.find(k => k > lo && !fits(k, tried.get(k))) ?? null;
      if (hi === null) return tried.get(lo);
      let best = tried.get(lo);
      while (hi - lo > 1) {
        const mid = Math.floor((lo + hi) / 2);
        const m = at(mid);
        if (!m) return null;
        if (fits(mid, m)) { lo = mid; best = m; } else hi = mid;
      }
      return { fit: lo, natural: best.natural, estimated: best.estimated };
    };
    let res = null;
    try { res = run(); } finally {
      h.style.setProperty('--rt-zoom', keep.hz); body.style.setProperty('--rt-zoom', keep.bz); paper.style.setProperty('zoom', keep.pz);
      body.scrollTop = keep.st;
    }
    // mutation records of the probe are delivered in a microtask: drop them there
    Promise.resolve().then(() => { S.probing = false; });
    return res ? { stage, hostW, two, fit: Math.floor(res.fit + 1e-6), rawFit: r1(res.fit), natural: r1(res.natural), estimated: res.estimated } : null;
  }
  S.full = full; S.probe = probe; S.light = light;

  // every animation frame for 10.5 s: keep a row whenever anything but the time changed
  let lastKey = '';
  function frame() {
    const s = light('raf');
    const key = JSON.stringify(Object.assign({}, s, { t: 0, scrollTop: 0 }));
    if (key !== lastKey) { lastKey = key; S.frames.push(s); }
    if (performance.now() - T0 < 10500) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // fixed samples
  for (const ms of [300, 600, 1000, 1500, 2000, 3000, 5000, 8000, 10000]) setTimeout(() => S.samples.push(full('t' + ms)), ms);

  // every write of the zoom (host var, scroll box var, paper zoom), with what the fit would have measured right then
  const seen = new WeakSet();
  const mo = new MutationObserver(recs => {
    if (S.probing) return;
    const { h, body, paper, cards } = parts();
    const seq = [];
    for (const r of recs) {
      const el = r.target;
      const name = el === paper ? 'paper' : el === body ? 'body' : el === h ? 'host' : 'old';
      const old = name === 'paper' ? /(?:^|;)\s*zoom:\s*([0-9.]+)/.exec(r.oldValue || '') : /--rt-zoom:\s*([0-9.]+)/.exec(r.oldValue || '');
      seq.push(name + ':' + (old ? old[1] : '-'));
    }
    const z = paper ? num(paper.style.zoom) || 1 : 1;
    const nat = natural(z);
    S.muts.push({
      t: now(), writes: seq.join(' '),
      hostZoom: h ? num(h.style.getPropertyValue('--rt-zoom')) : null, paperZoom: paper ? num(paper.style.zoom) : null,
      hostH: h ? h.clientHeight : null, stage: stageOf(h, body), stageVar: body ? body.style.getPropertyValue('--rt-stage-h') : null,
      pagesInDom: cards.length, lastPage: cards.length ? Number(cards[cards.length - 1].dataset.page) : null,
      liveLines: cards.length ? cards[cards.length - 1].querySelectorAll('.rt-line').length : 0,
      natural: r1(nat.natural), estimated: nat.estimated, used: nat.used,
      skeleton: !!q('app-transcript-skeleton'), topH: hOf('.rt-top'), toolbarH: hOf('.rt-toolbar'), roomBannerH: hOf('app-edge-room-banner'), errorH: hOf('.rt-error'),
      fonts: document.fonts ? document.fonts.status : null,
    });
  });
  const attach = () => {
    const { h, body, paper } = parts();
    for (const el of [h, body, paper]) {
      if (el && !seen.has(el)) { seen.add(el); mo.observe(el, { attributes: true, attributeFilter: ['style'], attributeOldValue: true }); }
    }
  };
  new MutationObserver(attach).observe(document, { childList: true, subtree: true });
  window.addEventListener('error', () => { S.errors += 1; });

  S.report = () => ({ samples: S.samples, frames: S.frames, muts: S.muts, errors: S.errors, final: full('final'), probeFromCurrent: probe(Math.round(((parts().paper && Number(parts().paper.style.zoom)) || 1) * 100)), probeFrom100: probe(100) });
})();
`;

interface Scenario {
    readonly name: string;
    readonly w: number;
    readonly h: number;
    readonly dsf: number;
    readonly feed: 'idle' | 'live';
    /** Page-side steps after the first load's 10 s (each then settles 1.5 s): 'compact' | 'two' | 'times'. */
    readonly afterLoad?: readonly string[];
    /** Resize the window this long after each load (ms) to this size. */
    readonly resize?: { readonly atMs: number; readonly w: number; readonly h: number };
    /** Lines to add to the live page before this scenario (feed advanced fast, then idle). */
    readonly advanceLines?: number;
    /** Extra localStorage entries set before the app starts. */
    readonly ls?: Record<string, string>;
    /** Cut the box's internet after the first load (the room banner shows), reload with it cut, then restore. */
    readonly banner?: boolean;
}

const SCENARIOS: Record<string, Scenario> = {
    'A-1536x743@1.25-idle': { name: 'A-1536x743@1.25-idle', w: 1536, h: 743, dsf: 1.25, feed: 'idle' },
    'B-1920x945@1-idle': { name: 'B-1920x945@1-idle', w: 1920, h: 945, dsf: 1, feed: 'idle' },
    'C-1366x650@1-idle': { name: 'C-1366x650@1-idle', w: 1366, h: 650, dsf: 1, feed: 'idle' },
    'D-1536x743@1.25-idle-again': { name: 'D-1536x743@1.25-idle-again', w: 1536, h: 743, dsf: 1.25, feed: 'idle' },
    'E-1536x743@1.25-live300ms': { name: 'E-1536x743@1.25-live300ms', w: 1536, h: 743, dsf: 1.25, feed: 'live' },
    // step 6 variants
    'F-1536x743@1.25-compact': { name: 'F-1536x743@1.25-compact', w: 1536, h: 743, dsf: 1.25, feed: 'idle', afterLoad: ['compact'] },
    'G-1536x743@1.25-two': { name: 'G-1536x743@1.25-two', w: 1536, h: 743, dsf: 1.25, feed: 'idle', afterLoad: ['two'] },
    'H-1536x743@1.25-times': { name: 'H-1536x743@1.25-times', w: 1536, h: 743, dsf: 1.25, feed: 'idle', afterLoad: ['times'] },
    'I-1536x743@1.25-resize': { name: 'I-1536x743@1.25-resize', w: 1536, h: 600, dsf: 1.25, feed: 'idle', resize: { atMs: 1200, w: 1536, h: 743 } },
    'J-1536x743@1.25-nearly-full': { name: 'J-1536x743@1.25-nearly-full', w: 1536, h: 743, dsf: 1.25, feed: 'idle', advanceLines: 24 - PARTIAL },
    'K-1536x743@1.25-nearly-empty': { name: 'K-1536x743@1.25-nearly-empty', w: 1536, h: 743, dsf: 1.25, feed: 'idle', advanceLines: 2 },
    'P-1536x733@1.25-idle': { name: 'P-1536x733@1.25-idle', w: 1536, h: 733, dsf: 1.25, feed: 'idle' },
    'Q-1536x836@1.25-idle': { name: 'Q-1536x836@1.25-idle', w: 1536, h: 836, dsf: 1.25, feed: 'idle' },
    'R-1536x743@1.25-banner': { name: 'R-1536x743@1.25-banner', w: 1536, h: 743, dsf: 1.25, feed: 'idle', banner: true },
    'S-1536x743@1.25-advanced': { name: 'S-1536x743@1.25-advanced', w: 1536, h: 743, dsf: 1.25, feed: 'idle', ls: { 'etabella.uiMode': 'A' } },
    'T-1536x743@1.25-scale-off': { name: 'T-1536x743@1.25-scale-off', w: 1536, h: 743, dsf: 1.25, feed: 'idle', ls: { 'etabella.displayScale': 'off' } },
    'U-1536x743@1.25-advanced-scale-off': { name: 'U-1536x743@1.25-advanced-scale-off', w: 1536, h: 743, dsf: 1.25, feed: 'idle', ls: { 'etabella.uiMode': 'A', 'etabella.displayScale': 'off' } },
    'V-1366x650@1-advanced': { name: 'V-1366x650@1-advanced', w: 1366, h: 650, dsf: 1, feed: 'idle', ls: { 'etabella.uiMode': 'A' } },
    'W-dpr-change': { name: 'W-dpr-change', w: 1536, h: 743, dsf: 1.25, feed: 'idle', afterLoad: ['dpr:1920x945@1', 'dpr:1536x743@1.25', 'size:1536x836', 'size:1536x733'] },
    'X-review-resize': { name: 'X-review-resize', w: 1536, h: 743, dsf: 1.25, feed: 'idle', afterLoad: ['scrollup', 'size:1536x900', 'tolive'] },
    'L-1920x945@1.25-idle': { name: 'L-1920x945@1.25-idle', w: 1920, h: 945, dsf: 1.25, feed: 'idle' },
    'M-1707x830@1.5-idle': { name: 'M-1707x830@1.5-idle', w: 1707, h: 830, dsf: 1.5, feed: 'idle' },
    'N-2560x1300@1-idle': { name: 'N-2560x1300@1-idle', w: 2560, h: 1300, dsf: 1, feed: 'idle' },
    'O-1920x945@1-live300ms': { name: 'O-1920x945@1-live300ms', w: 1920, h: 945, dsf: 1, feed: 'live' },
    // conclusion step: the windows this machine's two monitors give (2560x1440 and 1920x1080, both at 100% Windows scaling)
    'Z1-1536x729@1.25-idle': { name: 'Z1-1536x729@1.25-idle', w: 1536, h: 729, dsf: 1.25, feed: 'idle' },
    'Z2-2048x1030@1.25-idle': { name: 'Z2-2048x1030@1.25-idle', w: 2048, h: 1030, dsf: 1.25, feed: 'idle' },
    'Z3-2560x1290@1-idle': { name: 'Z3-2560x1290@1-idle', w: 2560, h: 1290, dsf: 1, feed: 'idle' },
    'Z4-1920x930@1-idle': { name: 'Z4-1920x930@1-idle', w: 1920, h: 930, dsf: 1, feed: 'idle' },
    // conclusion step: a reader in review (scrolled back by script), the window grows, then back to live
    'Y-review-resize-js': { name: 'Y-review-resize-js', w: 1536, h: 743, dsf: 1.25, feed: 'idle', afterLoad: ['jsscrollup', 'size:1536x900', 'tolive', 'size:1536x902'] },
};
const BASE = ['A-1536x743@1.25-idle', 'B-1920x945@1-idle', 'C-1366x650@1-idle', 'D-1536x743@1.25-idle-again', 'E-1536x743@1.25-live300ms'];

const STEP_JS: Record<string, string> = {
    compact: `(() => { const b = document.querySelector('.rt-compact-toggle'); if (b) b.click(); return !!b; })()`,
    two: `(() => { const b = document.querySelectorAll('.rt-view-sub--lead .rt-view-btn')[1]; if (b) b.click(); return !!b; })()`,
    tolive: `(() => { const b = document.querySelector('.rt-live-peek__close'); if (b) b.click(); return !!b; })()`,
    jsscrollup: `(async () => { const b = document.querySelector('app-reader-transcript .rt-scroll'); if (!b) return false; const from = b.scrollTop; for (let i = 0; i < 6; i++) { b.scrollTop = Math.max(0, b.scrollTop - 200); await new Promise(r => setTimeout(r, 60)); } return from + '->' + b.scrollTop; })()`,
    times: `(async () => { const m = document.querySelector('.rt-more-btn'); if (!m) return false; m.click(); await new Promise(r => setTimeout(r, 300)); const t = [...document.querySelectorAll('.rt-more-menu [role=menuitemcheckbox]')][0]; if (t) t.click(); await new Promise(r => setTimeout(r, 200)); m.click(); return !!t; })()`,
};
const ZOOM_LABEL_JS = `(async () => { const m = document.querySelector('.rt-more-btn'); if (!m) return null; m.click(); await new Promise(r => setTimeout(r, 300)); const v = document.querySelector('.rt-mm-zoom__val'); const text = v ? v.textContent.trim() : null; m.click(); return text; })()`;

function expectedFit(final: any): number | null {
    if (!final || !final.natural || !final.stage) return null;
    const heightFit = (final.stage / final.natural) * 100;
    const widthFit = final.two && final.hostW ? ((final.hostW - 57) / (2 * 480 + 20)) * 100 : 100;
    return Math.floor(Math.max(65, Math.min(100, heightFit, widthFit)) + 1e-6);
}

function timeline(samples: any[]): string {
    return samples.map(s => `${s.t / 1000}s:${s.paperZoom == null ? (s.skeleton ? 'skel' : '-') : Math.round(s.paperZoom * 100)}${s.skeleton && s.paperZoom != null ? '(skel)' : ''}`).join(' ');
}

describe('scratch: RT live fit after a refresh, real box + FE edge build', () => {
    let w: World | null = null;
    let browser: any = null;

    afterAll(async () => {
        await browser?.close().catch(() => undefined);
        await w?.close();
    });

    it('records the zoom over the first 10 s after a load and after a reload', async () => {
        if (!fs.existsSync(path.join(FE_DIST, 'index.html'))) throw new Error(`FE edge build missing: ${FE_DIST}`);
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { chromium } = require(`${FE_ROOT}/node_modules/playwright`);

        // ---- the box, serving the FE edge build ----
        w = await World.create();
        await w.box!.stop();
        const cfg = JSON.parse(fs.readFileSync(w.configFile, 'utf8'));
        cfg.paths.publicDir = FE_DIST;
        fs.writeFileSync(w.configFile, JSON.stringify(cfg, null, 2));
        await w.startBox();
        await w.bindSession();

        // ---- the feed: FULL_PAGES full pages + PARTIAL lines ----
        const entries = buildEntries();
        const sender: EclipseSender = w.sender({ entries, msPerEntry: 2 });
        let cursor = entryAfter(FULL_PAGES + 1, PARTIAL);
        const paused = sender.pauseAt(cursor);
        sender.start();
        await paused;
        const wantLines = FULL_PAGES * 25 + PARTIAL;
        await waitFor(() => (w!.box!.kernel.view(w!.nSesid)?.totalLines ?? 0) >= wantLines, 60_000, `the box holds ${wantLines} lines`, () => w!.dump());
        await sleep(800);
        const boxState = (): Record<string, unknown> => ({
            totalLines: w!.box!.kernel.view(w!.nSesid)?.totalLines ?? null,
            pages: w!.box!.kernel.pages(w!.nSesid).length,
            protocol: w!.box!.kernel.session(w!.nSesid)?.protocol ?? null,
        });

        // ---- the token and the identity the page restores ----
        const token = await w.token(IDS.user);
        const claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
        const identity = {
            kind: 'online', nUserid: IDS.user, name: 'Rita Reader', email: 'rita.reader@example.com', validUntilMs: claims.exp * 1000, untilSessionEnds: false,
            room: null, rooms: [], isBoxAdmin: false, isSuperAdmin: false, roomCodeCaseIds: [], operator: null, signedInAtMs: Date.now(),
        };
        const SIGNED_IN = `try { localStorage.setItem('etabella.edge.token', ${JSON.stringify(token)}); localStorage.setItem('etabella.edge.identity', ${JSON.stringify(JSON.stringify(identity))}); } catch (e) {}`;
        const url = `http://127.0.0.1:${w.ports.http}/rt/session/${w.nSesid}?caseId=${IDS.caseA}`;

        browser = await chromium.launch({ channel: 'msedge', headless: true });
        const names = (process.env.FIT_SCEN ? process.env.FIT_SCEN.split(',').map(s => s.trim()).filter(Boolean) : BASE);
        const results: any[] = [];
        const summary: any[] = [];

        for (const name of names) {
            const sc = SCENARIOS[name];
            if (!sc) throw new Error(`unknown scenario ${name}`);
            if (sc.advanceLines) {
                const target = Math.min(entries.length, cursor + sc.advanceLines);
                (sender as any).o.msPerEntry = 2;
                await sender.resumeUntil(target);
                cursor = target;
                await sleep(1200);
            }
            const context = await browser.newContext({ viewport: { width: sc.w, height: sc.h }, deviceScaleFactor: sc.dsf });
            const extraLs = Object.entries(sc.ls ?? {}).map(([k, v]) => `try { localStorage.setItem(${JSON.stringify(k)}, ${JSON.stringify(v)}); } catch (e) {}`).join('\n');
            await context.addInitScript({ content: `${SIGNED_IN}\n${extraLs}\n${INSTRUMENT}` });
            const page = await context.newPage();
            const consoleErrors: string[] = [];
            const failed: string[] = [];
            page.on('console', (m: any) => { if (m.type() === 'error' && consoleErrors.length < 8) consoleErrors.push(String(m.text()).slice(0, 160)); });
            page.on('response', (r: any) => { if (r.status() >= 400 && failed.length < 12) failed.push(`${r.status()} ${new URL(r.url()).pathname}`); });

            let liveTimer: Promise<void> | null = null;
            let liveStop = false;
            if (sc.feed === 'live') {
                (sender as any).o.msPerEntry = 300;
                sender.resume();
                liveTimer = (async () => { while (!liveStop) await sleep(100); })();
            }

            const phase = async (kind: 'load' | 'reload'): Promise<any> => {
                const before = boxState();
                if (kind === 'load') await page.goto(url, { waitUntil: 'commit' });
                else await page.reload({ waitUntil: 'commit' });
                if (sc.resize) {
                    await page.waitForFunction(`window.__fit && performance.now() - window.__fit.t0 > ${sc.resize.atMs}`, null, { timeout: 30_000, polling: 50 });
                    await page.setViewportSize({ width: sc.resize.w, height: sc.resize.h });
                }
                await page.waitForFunction('window.__fit && performance.now() - window.__fit.t0 > 10300', null, { timeout: 40_000, polling: 100 });
                const report = await page.evaluate('window.__fit.report()');
                const zoomLabel = await page.evaluate(ZOOM_LABEL_JS).catch(() => null);
                const steps: any[] = [];
                if (kind === 'load') {
                    for (const step of sc.afterLoad ?? []) {
                        let done: unknown = true;
                        const dpr = /^dpr:(\d+)x(\d+)@([\d.]+)$/.exec(step);
                        const size = /^size:(\d+)x(\d+)$/.exec(step);
                        if (dpr) {
                            const cdp = await context.newCDPSession(page);
                            await cdp.send('Emulation.setDeviceMetricsOverride', { width: Number(dpr[1]), height: Number(dpr[2]), deviceScaleFactor: Number(dpr[3]), mobile: false });
                        } else if (size) {
                            await page.setViewportSize({ width: Number(size[1]), height: Number(size[2]) });
                        } else if (step === 'scrollup') {
                            const box = await page.evaluate(`(() => { const r = document.querySelector('app-reader-transcript .rt-scroll').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
                            await page.mouse.move(box.x, box.y);
                            for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, -300); await sleep(80); }
                        } else {
                            done = await page.evaluate(STEP_JS[step]);
                        }
                        await sleep(2200);
                        if (process.env.FIT_SHOT) await page.screenshot({ path: process.env.FIT_SHOT + "-" + sc.name.replace(/[^a-zA-Z0-9]+/g, "_") + "-" + kind + "-" + step.replace(/[^a-zA-Z0-9]+/g, "_") + ".png" });
                        steps.push({ step, done, after: await page.evaluate(`({ final: window.__fit.full('after-${step}'), probeFromCurrent: window.__fit.probe(Math.round((Number(document.querySelector('.rt-paper')?.style.zoom) || 1) * 100)), probeFrom100: window.__fit.probe(100) })`) });
                    }
                }
                if (sc.banner) {
                    const SNAP = (tag: string): string => `({ final: window.__fit.full('${tag}'), probeFromCurrent: window.__fit.probe(Math.round((Number(document.querySelector('.rt-paper')?.style.zoom) || 1) * 100)), probeFrom100: window.__fit.probe(100) })`;
                    if (kind === 'load') {
                        w!.proxy.cut('reset');
                        await sleep(6000);
                        steps.push({ step: 'internet-cut', done: true, after: await page.evaluate(SNAP('after-cut')) });
                    } else {
                        w!.proxy.restore();
                        await sleep(8000);
                        steps.push({ step: 'internet-restored', done: true, after: await page.evaluate(SNAP('after-restore')) });
                    }
                }
                if (kind === 'reload' && sc.resize) await page.setViewportSize({ width: sc.w, height: sc.h }).catch(() => undefined);
                return { scenario: sc.name, kind, viewport: `${sc.w}x${sc.h}@${sc.dsf}`, boxBefore: before, boxAfter: boxState(), zoomLabel, steps, ...report };
            };

            for (const kind of ['load', 'reload'] as const) {
                if (kind === 'reload' && sc.resize) await page.setViewportSize({ width: sc.w, height: sc.h });
                const r = await phase(kind);
                r.consoleErrors = consoleErrors.slice();
                r.failed = failed.slice();
                results.push(r);
                const f = r.final;
                const row = {
                    scenario: `${sc.name} / ${kind}`,
                    viewport: r.viewport,
                    path: f.path,
                    zoomTimeline: timeline(r.samples),
                    finalZoom: f.paperZoom == null ? null : Math.round(f.paperZoom * 100),
                    zoomLabel: r.zoomLabel,
                    stageHeight: f.stage,
                    naturalPageHeight: f.natural,
                    estimated: f.estimated,
                    expectedFit: expectedFit(f),
                    probeFromCurrent: r.probeFromCurrent?.fit ?? null,
                    probeFrom100: r.probeFrom100?.fit ?? null,
                    pagesInDom: f.pagesInDom,
                    lastPage: f.lastPage,
                    liveLines: f.liveLines,
                    two: f.two,
                    skeleton: f.skeleton,
                    topH: f.topH, topHidden: f.topHidden, toolbarH: f.toolbarH, roomBannerH: f.roomBannerH, errorH: f.errorH, wsTop: f.wsTop, wsH: f.wsH,
                    chromeZoom: f.chromeZoom, rootZoom: f.rootZoom, hostH: f.hostH, hostW: f.hostW,
                    fullPagePxAtZoom: f.natural && f.paperZoom ? Math.round(f.natural * f.paperZoom * 10) / 10 : null,
                    bodyTop: f.bodyTop, bodyBottom: f.bodyBottom, liveTop: f.liveTop, liveBottom: f.liveBottom, prevTop: f.prevTop, prevBottom: f.prevBottom,
                    muts: r.muts.length,
                    steps: r.steps.map((s: any) => ({ step: s.step, done: s.done, zoom: s.after.final.paperZoom, stage: s.after.final.stage, natural: s.after.final.natural, probe100: s.after.probeFrom100?.fit ?? null, topHidden: s.after.final.topHidden, two: s.after.final.two, dpr: s.after.final.dpr, inner: s.after.final.innerW + 'x' + s.after.final.innerH, chromeZoom: s.after.final.chromeZoom, topH: s.after.final.topH, peek: s.after.final.peek, roomBannerH: s.after.final.roomBannerH, hostH: s.after.final.hostH })),
                    box: r.boxAfter,
                    failed: r.failed,
                };
                summary.push(row);
                fs.writeFileSync(OUT, JSON.stringify({ url, summary, results }, null, 1));
            }

            if (sc.feed === 'live') {
                liveStop = true;
                await liveTimer;
                const stopAt = sender.next + 1;
                await sender.pauseAt(stopAt);
                cursor = sender.next;
                (sender as any).o.msPerEntry = 2;
            }
            await context.close();
        }

        fs.writeFileSync(OUT, JSON.stringify({ url, summary, results }, null, 1));
        // eslint-disable-next-line no-console
        console.log(`[fit-repro] ${JSON.stringify(summary.map(s => ({ scenario: s.scenario, viewport: s.viewport, path: s.path, zoom: s.zoomTimeline, final: s.finalZoom, label: s.zoomLabel, stage: s.stageHeight, natural: s.naturalPageHeight, expected: s.expectedFit, probe100: s.probeFrom100 })), null, 1)}`);
    }, 40 * 60_000);
});
