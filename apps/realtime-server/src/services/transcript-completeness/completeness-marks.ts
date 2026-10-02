import { escapeHtml } from '../utility/html-escape';
import type { CompletenessVerdict } from './transcript-completeness.service';

/*
 * What a gated export must carry on every page (spec 4.4, S-D8): the INCOMPLETE watermark of a forced
 * ('F') session, or the "Live - as of HH:MM:SS" stamp of a live ('L') one. Both are inserted into the
 * rendered HTML right after <body>, as position:fixed blocks. Chromium (the transcript export, puppeteer)
 * repeats a fixed block on every printed page. The annotation export is printed by wkhtmltopdf (QtWebKit,
 * export.service.ts generatePdfWithWkhtml), which is documented to repeat fixed blocks per page as well,
 * but that has NOT been rendered and checked in this repository (wkhtmltopdf is not on the build machine):
 * the specs prove only the HTML the printers receive. The rotation carries the -webkit- prefix QtWebKit
 * needs. An ungated or unmarked export is returned untouched (same string).
 */

export interface CompletenessMarks {
  watermark?: string | null;
  liveStamp?: string | null;
}

/** The marks a passing verdict asks for, or null (ungated, refused, or nothing to mark). */
export function completenessMarks(verdict: CompletenessVerdict | null | undefined): CompletenessMarks | null {
  if (!verdict || !verdict.gated || !verdict.ok) return null;
  if (!verdict.watermark && !verdict.liveStamp) return null;
  return { watermark: verdict.watermark ?? null, liveStamp: verdict.liveStamp ?? null };
}

const WATERMARK_STYLE = [
  'position:fixed', 'top:42%', 'left:0', 'right:0', 'text-align:center', '-webkit-transform:rotate(-30deg)', 'transform:rotate(-30deg)',
  'font:bold 34px Arial,Helvetica,sans-serif', 'color:rgba(190,0,0,0.25)', 'z-index:9999', 'pointer-events:none',
].join(';');

const LIVE_STYLE = [
  'position:fixed', 'top:0', 'left:0', 'right:0', 'text-align:center', 'font:bold 11px Arial,Helvetica,sans-serif',
  'color:#7a4b00', 'background:#fff3d6', 'padding:2px 0', 'z-index:9999',
].join(';');

/** The HTML with the marks inserted after <body> (or in front, when there is no body tag). */
export function applyCompletenessMarks(html: string, marks: CompletenessMarks | null | undefined): string {
  if (typeof html !== 'string' || !marks || (!marks.watermark && !marks.liveStamp)) return html;
  let markup = '';
  if (marks.watermark) {
    markup += `<div class="rt-completeness-watermark" style="${WATERMARK_STYLE}">${escapeHtml(marks.watermark)}</div>`;
  }
  if (marks.liveStamp) {
    markup += `<div class="rt-completeness-live" style="${LIVE_STYLE}">${escapeHtml(marks.liveStamp)}</div>`;
  }
  const body = /<body\b[^>]*>/i.exec(html);
  if (!body) return markup + html;
  const at = body.index + body[0].length;
  return html.slice(0, at) + markup + html.slice(at);
}
