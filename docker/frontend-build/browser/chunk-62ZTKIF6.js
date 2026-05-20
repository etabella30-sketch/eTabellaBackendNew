import {
  FeedDisplayService
} from "./chunk-SD32Y426.js";
import {
  environment
} from "./chunk-UA722RUW.js";
import {
  HttpClient,
  HttpParams
} from "./chunk-EVEACXQX.js";
import {
  __async,
  __spreadValues,
  firstValueFrom,
  ɵɵdefineInjectable,
  ɵɵinject
} from "./chunk-OLJKHPOW.js";

// src/app/rt/services/index/feed-index/helpingWords.ts
var helpingWords = class {
  constructor() {
    this.avoid = [
      `a`,
      `above`,
      `about`,
      `accordance`,
      `according`,
      `accordingly`,
      `across`,
      `actually`,
      `adj`,
      `affected`,
      `affecting`,
      `affects`,
      `after`,
      `afterwards`,
      `again`,
      `against`,
      `all`,
      `almost`,
      `alone`,
      `along`,
      `already`,
      `also`,
      `although`,
      `always`,
      `am`,
      `among`,
      `amongst`,
      `an`,
      `and`,
      `another`,
      `any`,
      `anyhow`,
      `anyone`,
      `anything`,
      `anywhere`,
      `are`,
      `aren't`,
      `arise`,
      `around`,
      `as`,
      `ask`,
      `at`,
      `away`,
      `be`,
      `became`,
      `because`,
      `become`,
      `becomes`,
      `been`,
      `before`,
      `beforehand`,
      `begin`,
      `behind`,
      `being`,
      `below`,
      `beside`,
      `besides`,
      `between`,
      `both`,
      `but`,
      `by`,
      `came`,
      `can`,
      `cannot`,
      `can't`,
      `co`,
      `could`,
      `couldn't`,
      `did`,
      `didn't`,
      `do`,
      `does`,
      `doesn't`,
      `done`,
      `don't`,
      `down`,
      `during`,
      `each`,
      `eg`,
      `else`,
      `elsewhere`,
      `end`,
      `ending`,
      `enough`,
      `etc`,
      `even`,
      `ever`,
      `every`,
      `everyone`,
      `everything`,
      `everywhere`,
      `except`,
      `few`,
      `for`,
      `from`,
      `gave`,
      `get`,
      `gets`,
      `gone`,
      `got`,
      `had`,
      `hadn't`,
      `hardly`,
      `has`,
      `hasn't`,
      `have`,
      `haven't`,
      `having`,
      `he`,
      `he'd`,
      `hence`,
      `her`,
      `here`,
      `hereafter`,
      `hereby`,
      `herein`,
      `here's`,
      `hereupon`,
      `hers`,
      `herself`,
      `he's`,
      `him`,
      `himself`,
      `his`,
      `how`,
      `however`,
      `i`,
      `i'd`,
      `ie`,
      `if`,
      `i'll`,
      `i'm`,
      `in`,
      `inc`,
      `indeed`,
      `instead`,
      `into`,
      `is`,
      `isn't`,
      `it`,
      `its`,
      `it's`,
      `itself`,
      `i've`,
      `just`,
      `last`,
      `later`,
      `latter`,
      `latterly`,
      `least`,
      `less`,
      `let`,
      `lets`,
      `like`,
      `likely`,
      `ll`,
      `ltd`,
      `made`,
      `mainly`,
      `make`,
      `makes`,
      `many`,
      `may`,
      `maybe`,
      `me`,
      `meantime`,
      `meanwhile`,
      `might`,
      `miss`,
      `more`,
      `moreover`,
      `most`,
      `mostly`,
      `mr`,
      `mrs`,
      `ms`,
      `much`,
      `must`,
      `my`,
      `myself`,
      `na`,
      `namely`,
      `next`,
      `no`,
      `nobody`,
      `none`,
      `nonetheless`,
      `noone`,
      `nor`,
      `not`,
      `nothing`,
      `now`,
      `nowhere`,
      `of`,
      `off`,
      `often`,
      `on`,
      `one`,
      `only`,
      `onto`,
      `or`,
      `other`,
      `others`,
      `otherwise`,
      `our`,
      `ours`,
      `ourselves`,
      `out`,
      `over`,
      `own`,
      `past`,
      `per`,
      `perhaps`,
      `q`,
      `rather`,
      `re`,
      `recent`,
      `recently`,
      `said`,
      `same`,
      `say`,
      `seem`,
      `seemed`,
      `seeming`,
      `seems`,
      `several`,
      `shall`,
      `she`,
      `she's`,
      `should`,
      `shouldn't`,
      `since`,
      `so`,
      `some`,
      `somehow`,
      `someone`,
      `something`,
      `sometime`,
      `sometimes`,
      `somewhere`,
      `still`,
      `such`,
      `taking`,
      `than`,
      `that`,
      `that'll`,
      `that's`,
      `the`,
      `their`,
      `them`,
      `themselves`,
      `then`,
      `thence`,
      `there`,
      `thereafter`,
      `thereby`,
      `there'd`,
      `therefore`,
      `therein`,
      `there'll`,
      `there're`,
      `there's`,
      `thereupon`,
      `there've`,
      `these`,
      `they`,
      `theyd`,
      `they'll`,
      `they're`,
      `they've`,
      `this`,
      `those`,
      `though`,
      `through`,
      `throughout`,
      `thru`,
      `thus`,
      `til`,
      `to`,
      `together`,
      `too`,
      `took`,
      `toward`,
      `towards`,
      `under`,
      `unless`,
      `unlike`,
      `unlikely`,
      `until`,
      `unto`,
      `up`,
      `upon`,
      `us`,
      `used`,
      `using`,
      `ve`,
      `very`,
      `via`,
      `was`,
      `was'nt`,
      `we`,
      `we'd`,
      `well`,
      `were`,
      `werent`,
      `what`,
      `whatever`,
      `what'll`,
      `what's`,
      `what've`,
      `when`,
      `whence`,
      `whenever`,
      `where`,
      `whereafter`,
      `whereas`,
      `whereby`,
      `wherein`,
      `where's`,
      `whereupon`,
      `wherever`,
      `whether`,
      `which`,
      `while`,
      `who`,
      `who'd`,
      `whoever`,
      `whole`,
      `who'll`,
      `whom`,
      `whomever`,
      `who's`,
      `whose`,
      `why`,
      `will`,
      `with`,
      `within`,
      `without`,
      `won't`,
      `would`,
      `would'nt`,
      `yes`,
      `yet`,
      `you`,
      `you'd`,
      `you'll`,
      `your`,
      `you're`,
      `yours`,
      `yourself`,
      `yourselves`,
      `you've`,
      "--"
    ];
  }
};

// src/app/rt/services/index/feed-index/feed-index.service.ts
var FeedIndexService = class _FeedIndexService extends helpingWords {
  constructor(fds) {
    super();
    this.fds = fds;
  }
  // Build WordIndex from feeds:
  // - tokens from lines.join('') -> [a-z]+, lowercased
  // - ALSO index time string exactly as-is (e.g., "10:20:44")
  // - skip stopwords (case-insensitive) for word tokens
  // - per-line de-dupe
  // - store position "page:lineIndex" with minimal numeric payload (0)
  /* async getIndexData(): Promise<WordIndex> {
      const indexData: WordIndex = {};
      const feedData: feeds[] = this.fds.getActiveFeedData() ?? [];
  
      const avoidSet = new Set((this.avoid ?? []).map(w => w.toLowerCase()));
  
      for (const feed of feedData) {
        const page = feed?.page ?? 0;
        const rows: finalFeedData[] = feed?.data ?? [];
  
        for (const [index,row] of rows.entries()) {
          const text = (row?.lines ?? []).join('');
          const posKey = `${page}:${index + 1}`;
  
          // Collect tokens for THIS line (deduped)
          const perLine = new Set<string>();
  
          // 1) word tokens from text (lowercased, stopword-filtered)
          const tokens = text.toLowerCase().match(/[a-z]+/g);
          if (tokens) {
            for (const t of tokens) {
              if (!avoidSet.has(t)) perLine.add(t);
            }
          }
  
          // 2) time token (add exactly as provided, if present & non-empty)
          const timeToken = typeof row.time === 'string' ? row.time.trim() : '';
          if (timeToken) perLine.add(timeToken);
  
          // Write tokens to index
          for (const tok of perLine) {
            const bucket = tok.charAt(0).toUpperCase(); // e.g. 'T' or '1'
            if (!bucket) continue;
  
            const wordMap = indexData[bucket] ?? (indexData[bucket] = {});
            const cat = wordMap[tok] ?? (wordMap[tok] = {});
  
            if (!(posKey in cat)) cat[posKey] = null; // minimal payload
          }
        }
      }
  
      return indexData;
    }*/
  getIndexData(searchTerm) {
    return __async(this, null, function* () {
      const indexData = {};
      const feedData = this.fds.getActiveFeedData() ?? [];
      const avoidSet = new Set((this.avoid ?? []).map((w) => w.toLowerCase()));
      const q = (searchTerm ?? "").trim();
      const hasQuery = q.length > 0;
      const qLower = q.toLowerCase();
      for (const feed of feedData) {
        const page = feed?.page ?? 0;
        const rows = feed?.data ?? [];
        for (const [index, row] of rows.entries()) {
          const text = (row?.lines ?? []).join("");
          const posKey = `${page}:${index + 1}`;
          const perLine = /* @__PURE__ */ new Set();
          const tokens = text.toLowerCase().match(/[a-z0-9_-]+/g);
          if (tokens) {
            for (const t of tokens) {
              if (avoidSet.has(t))
                continue;
              if (!hasQuery || t.includes(qLower))
                perLine.add(t);
            }
          }
          const timeToken = typeof row.time === "string" ? row.time.trim().slice(0, -3) : "";
          if (timeToken && (!hasQuery || timeToken.includes(q)))
            perLine.add(timeToken);
          for (const tok of perLine) {
            const bucket = tok.charAt(0).toUpperCase();
            if (!bucket)
              continue;
            const wordMap = indexData[bucket] ?? (indexData[bucket] = {});
            const cat = wordMap[tok] ?? (wordMap[tok] = {});
            if (!(posKey in cat))
              cat[posKey] = null;
          }
        }
      }
      return indexData;
    });
  }
  static {
    this.\u0275fac = function FeedIndexService_Factory(t) {
      return new (t || _FeedIndexService)(\u0275\u0275inject(FeedDisplayService));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _FeedIndexService, factory: _FeedIndexService.\u0275fac, providedIn: "root" });
  }
};

// src/app/rt/services/toolbar/toolbar.service.ts
var ToolbarService = class _ToolbarService {
  constructor(http) {
    this.http = http;
  }
  getSessionList(nCaseid, nUserid, cType) {
    return __async(this, null, function* () {
      let params = new HttpParams().set("nCaseid", nCaseid);
      params = params.set("nUserid", nUserid);
      if (cType) {
        params = params.set("cType", cType);
      }
      try {
        const res = yield firstValueFrom(this.http.get(`${environment.cloudUrl2}${environment.realtimeserive}/session/getsessionsbycaseid`, { params }));
        if (!res.length) {
          return [];
        }
        return res;
      } catch (error) {
        console.error(error);
        return [];
      }
    });
  }
  static {
    this.\u0275fac = function ToolbarService_Factory(t) {
      return new (t || _ToolbarService)(\u0275\u0275inject(HttpClient));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _ToolbarService, factory: _ToolbarService.\u0275fac, providedIn: "root" });
  }
};

// src/app/rt/services/transcript-renderer/render-options.interface.ts
var DEFAULT_RENDER_OPTIONS = {
  includeTimestamps: true,
  includePageBreaks: true,
  includeLineNumbers: true,
  cssMode: "linked"
};

// src/app/rt/services/transcript-renderer/transcript-renderer.service.ts
var TranscriptRendererService = class _TranscriptRendererService {
  /**
   * Converts structured feed data into semantic HTML string.
   * This is the canonical renderer — its output is what gets persisted
   * and used as the source-of-truth for published transcripts.
   */
  renderToHtml(pages, options = {}) {
    const opts = __spreadValues(__spreadValues({}, DEFAULT_RENDER_OPTIONS), options);
    const pagesHtml = this.renderPages(pages, opts);
    if (opts.cssMode === "inline") {
      return this.wrapWithInlineStyles(pagesHtml);
    }
    return this.wrapWithLinkedStyles(pagesHtml);
  }
  /**
   * Renders all pages to HTML
   */
  renderPages(pages, opts) {
    let html = "";
    for (const page of pages) {
      if (opts.pageRange) {
        if (page.page < opts.pageRange.start || page.page > opts.pageRange.end) {
          continue;
        }
      }
      html += this.renderPage(page, opts);
    }
    return html;
  }
  /**
   * Renders a single page with its lines
   */
  renderPage(page, opts) {
    const pageBreakClass = opts.includePageBreaks ? " transcript-page-break" : "";
    let html = `<div class="transcript-page${pageBreakClass}" data-page="${page.page}">
`;
    html += `  <div class="transcript-page-header">Page ${page.page}</div>
`;
    if (page.data && page.data.length) {
      for (const line of page.data) {
        html += this.renderLine(line, page.page, opts);
      }
    }
    html += `</div>
`;
    return html;
  }
  /**
   * Renders a single transcript line with semantic classes
   */
  renderLine(line, pageno, opts) {
    const classes = this.getLineClasses(line);
    const dataAttrs = this.getLineDataAttributes(line, pageno);
    let html = `  <div class="transcript-line ${classes.join(" ")}" ${dataAttrs}>
`;
    if (opts.includeLineNumbers) {
      const lineNumDisplay = line.lineIndex === 1 ? `${pageno}.${line.lineIndex}` : `${line.lineIndex}`;
      html += `    <span class="line-number">${this.escapeHtml(lineNumDisplay)}</span>
`;
    }
    if (opts.includeTimestamps && line.time) {
      html += `    <span class="timestamp">${this.escapeHtml(this.formatTimestamp(line.time))}</span>
`;
    }
    const textContent = line.lines ? line.lines.join(" ") : "";
    const textWithLinks = this.processLinks(textContent, line.links);
    html += `    <span class="line-text">${textWithLinks}</span>
`;
    html += `  </div>
`;
    return html;
  }
  /**
   * Determines CSS classes for a line based on its metadata
   */
  getLineClasses(line) {
    const classes = [];
    if (line.formate === "QES" || line.formate === "QES-CONTINUE") {
      classes.push("question-block");
    }
    if (line.formate === "PRNTH") {
      classes.push("parenthetical");
    }
    if (line.formate === "FL") {
      classes.push("first-line");
    }
    if (line.isBold) {
      classes.push("is-bold");
    }
    if (line.nHid) {
      classes.push("highlighted");
    }
    return classes;
  }
  /**
   * Generates data-* attributes for annotation anchoring
   */
  getLineDataAttributes(line, pageno) {
    const attrs = [];
    attrs.push(`data-line="${line.lineIndex}"`);
    attrs.push(`data-page="${pageno}"`);
    if (line.unicid) {
      attrs.push(`data-identity="${this.escapeAttr(line.unicid)}"`);
    }
    if (line.oPage != null) {
      attrs.push(`data-opage="${line.oPage}"`);
    }
    if (line.oLine != null) {
      attrs.push(`data-oline="${line.oLine}"`);
    }
    if (line.nHid) {
      attrs.push(`data-hid="${this.escapeAttr(line.nHid)}"`);
    }
    if (line.time) {
      attrs.push(`data-time="${this.escapeAttr(line.time)}"`);
    }
    return attrs.join(" ");
  }
  /**
   * Formats timestamp from raw format (e.g., HH:MM:SS:MS) to display format
   */
  formatTimestamp(time) {
    if (!time)
      return "";
    const parts = time.split(":");
    if (parts.length >= 3) {
      return parts.slice(0, 3).join(":");
    }
    return time;
  }
  /**
   * Processes hyperlinks found in a line's text
   */
  processLinks(text, links) {
    let escaped = this.escapeHtml(text);
    if (links && links.length > 0) {
      for (const link of links) {
        const escapedLink = this.escapeHtml(link);
        escaped = escaped.replace(escapedLink, `<a class="transcript-link" href="${this.escapeAttr(link)}" target="_blank">${escapedLink}</a>`);
      }
    }
    return escaped;
  }
  /**
   * Wraps rendered pages HTML with linked stylesheet reference
   */
  wrapWithLinkedStyles(pagesHtml) {
    return `<div class="transcript-document">
${pagesHtml}</div>`;
  }
  /**
   * Wraps rendered pages HTML with inline styles for self-contained output
   * (used for PDF generation and email/export scenarios)
   */
  wrapWithInlineStyles(pagesHtml) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Transcript</title>
  <style>
    ${INLINE_CSS}
  </style>
</head>
<body>
  <div class="transcript-document">
    ${pagesHtml}
  </div>
</body>
</html>`;
  }
  /**
   * Escapes HTML special characters in text content
   */
  escapeHtml(text) {
    if (!text)
      return "";
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
  /**
   * Escapes attribute values
   */
  escapeAttr(value) {
    if (!value)
      return "";
    return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#039;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  static {
    this.\u0275fac = function TranscriptRendererService_Factory(t) {
      return new (t || _TranscriptRendererService)();
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _TranscriptRendererService, factory: _TranscriptRendererService.\u0275fac, providedIn: "root" });
  }
};
var INLINE_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }

  .transcript-document {
    font-family: 'Courier New', Courier, monospace;
    font-size: 15px;
    line-height: 1.5;
    color: #1a1a1a;
    background: #fff;
  }

  .transcript-page {
    position: relative;
    padding: 16px 40px 24px 40px;
    min-width: 956px;
    max-width: fit-content;
    width: fit-content;
    background: #fff;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .transcript-page-break {
    page-break-after: always;
    break-after: page;
  }

  .transcript-page-header {
    background: #737373;
    color: #fff;
    font-size: 12px;
    padding: 6px 10px;
    margin-bottom: 24px;
    height: 36px;
    display: flex;
    align-items: center;
  }

  .transcript-line {
    display: flex;
    align-items: flex-start;
    position: relative;
    font-size: 15px;
  }

  .line-number {
    display: inline-flex;
    justify-content: flex-end;
    width: 65px;
    min-width: 65px;
    padding: 0 6px;
    text-align: right;
    user-select: none;
    letter-spacing: -0.3px;
    background: #f5f5f5;
    margin-right: 12px;
    flex-shrink: 0;
  }

  .timestamp {
    white-space: nowrap;
    padding: 0 6px;
    width: 75px;
    min-width: 75px;
    font-size: 12px;
    user-select: none;
    overflow: hidden;
    letter-spacing: -0.3px;
    flex-shrink: 0;
  }

  .line-text {
    flex: 1;
    text-align: left;
    white-space: pre-wrap;
    word-break: break-word;
    user-select: text;
    cursor: text;
  }

  .question-block .line-text,
  .is-bold .line-text {
    font-weight: bold;
  }

  .parenthetical .line-text {
    padding-left: 2em;
    font-style: italic;
  }

  .highlighted {
    background-color: var(--highlightcolor, #ffff00);
  }

  .transcript-link {
    color: #2563eb;
    text-decoration: underline;
    cursor: pointer;
  }

  .transcript-link:hover {
    color: #1d4ed8;
  }

  @media print {
    .transcript-page {
      padding: 0;
      min-width: unset;
      width: 100%;
    }

    .transcript-page-header {
      background: #737373 !important;
      color: #fff !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .line-number {
      background: #f5f5f5 !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
`;

export {
  FeedIndexService,
  ToolbarService,
  TranscriptRendererService
};
//# sourceMappingURL=chunk-62ZTKIF6.js.map
