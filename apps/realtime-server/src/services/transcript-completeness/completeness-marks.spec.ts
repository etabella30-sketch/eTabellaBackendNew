import { applyCompletenessMarks, completenessMarks } from './completeness-marks';
import type { CompletenessVerdict } from './transcript-completeness.service';

const verdict = (extra: Partial<CompletenessVerdict>): CompletenessVerdict =>
  ({ ok: true, gated: true, purpose: 'export', nSesid: '5e551011-0000-4000-8000-0000000000d1', watermark: null, liveStamp: null, ...extra });

describe('completeness marks on a gated export (spec 4.4, S-D8)', () => {
  it('asks for nothing when the export is ungated, refused, or complete', () => {
    expect(completenessMarks(null)).toBeNull();
    expect(completenessMarks({ ok: true, gated: false, purpose: 'export', nSesid: 'x' })).toBeNull();
    expect(completenessMarks(verdict({ ok: false, watermark: 'INCOMPLETE — venue data missing' }))).toBeNull();
    expect(completenessMarks(verdict({}))).toBeNull();
  });

  it("asks for the watermark of an 'F' session and the stamp of a live one", () => {
    expect(completenessMarks(verdict({ watermark: 'INCOMPLETE — venue data missing' }))).toEqual({ watermark: 'INCOMPLETE — venue data missing', liveStamp: null });
    expect(completenessMarks(verdict({ liveStamp: 'Live — as of 10:00:00' }))).toEqual({ watermark: null, liveStamp: 'Live — as of 10:00:00' });
  });

  it('returns the very same HTML when there is nothing to mark', () => {
    const html = '<html><body><p>Line</p></body></html>';
    expect(applyCompletenessMarks(html, null)).toBe(html);
    expect(applyCompletenessMarks(html, { watermark: null, liveStamp: null })).toBe(html);
    expect(applyCompletenessMarks(undefined as any, { watermark: 'x' })).toBeUndefined();
  });

  // What is proven here is the HTML handed to the printers: a position:fixed block right after <body>. That
  // Chromium repeats it on every printed page is established; that wkhtmltopdf (QtWebKit) does is documented
  // but not rendered and checked in this repository.
  it('inserts the watermark right after <body>, escaped, as a position:fixed block with the -webkit- rotation QtWebKit needs', () => {
    const html = '<html><body class="t"><p>Line</p></body></html>';
    const out = applyCompletenessMarks(html, { watermark: 'INCOMPLETE — venue data missing <10:00-10:05> & more' });
    expect(out.startsWith('<html><body class="t"><div class="rt-completeness-watermark" style="position:fixed;')).toBe(true);
    expect(out).toContain('-webkit-transform:rotate(-30deg);transform:rotate(-30deg)');
    expect(out).toContain('>INCOMPLETE — venue data missing &lt;10:00-10:05&gt; &amp; more</div><p>Line</p></body></html>');
  });

  it('adds the live stamp after the watermark, and puts both in front of HTML without a body tag', () => {
    const out = applyCompletenessMarks('<p>Line</p>', { watermark: 'W', liveStamp: 'Live — as of 10:00:00' });
    expect(out).toMatch(/^<div class="rt-completeness-watermark"[^>]*>W<\/div><div class="rt-completeness-live"[^>]*>Live — as of 10:00:00<\/div><p>Line<\/p>$/);
  });
});
