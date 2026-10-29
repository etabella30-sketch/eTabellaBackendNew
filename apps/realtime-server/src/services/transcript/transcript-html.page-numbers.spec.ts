import { TranscriptHtmlService } from './transcript-html.service';
import { ThemeCssService, clampBodyLetterSpacing } from './theme-css.service';
import { UtilityService } from '../utility/utility.service';

/*
 * Production module QA 2026-10-29 (Day 2 copy on etabella.net): with the shipped theme "Arbitration 2025"
 * (nPNStart 1) transcript page 1 printed "Page | 2" and the 292-page day ended on "293": the cover page was
 * always counted and nPNStart was never read. Printed page numbers must match the transcript's own pages,
 * the ones the Reader, Marks and the reporter's file cite.
 */

const htmlService = () => new TranscriptHtmlService(new ThemeCssService(), Object.create(UtilityService.prototype));

const theme = (over: Record<string, unknown> = {}): any => ({
  jBBold: 'SQ', bLMbrand: true, cPNAlignRL: 'Right', cPNAlignTB: 'Bottom', cPNPosition: 'P',
  cPCaseName: 'TL', cPVolumeDate: 'TR', cPCompany: 'BL', cPCompanyInfo: 'BR', bPInclude: true,
  nBFont: 3, nBFontsize: 12, nCFontsize: 12, nLFontsize: 10, nTFontsize: 10, nHFontsize: 10, nPNFontsize: 10,
  ...over,
});

const formData = (): any => ({
  cTransid: '11111111-1111-4111-8111-111111111111', cTitle: 'Acme v Beta', cTVolume: 'Day 2',
  dTranscribedDate: '2026-10-28T10:00:00Z', cCompany: 'LM', cCompanyinfo: 'Transcripts',
  cCasetype: 'ARBITRATION', cCCaseno: '123', cClaiment: 'ACME', cClaimentH: 'Claimant',
  cRespondent: 'BETA', cRespondentH: 'Respondent', cArbitrator: 'Sir John Smith KC', cCDay: 'Day 2',
  dCDate: '2026-10-28T10:00:00Z', cBClaiment: 'Mr A', cBClaimentH: 'On Behalf of Claimant',
  cBRespondent: 'Mr C', cBRespondentH: 'On Behalf of Respondent', cCAlign: 'C', cBehalfAlign: 'C', nCSpacing: 1,
});

/** A transcript of `pages` pages × 25 numbered lines. */
const lines = (pages: number): any[] => {
  const out: any[] = [];
  for (let p = 1; p <= pages; p++) {
    for (let l = 1; l <= 25; l++) out.push({ pageno: p, lineno: l, timestamp: '10:00:00', linetext: `Page ${p} line ${l} words` });
  }
  return out;
};

/** Every "Page n" label printed on the transcript pages ("Page n" is cPNPosition 'P'). */
const printedPageNumbers = (html: string): number[] =>
  [...html.matchAll(/>\s*Page (\d+)\s*</g)].map(m => Number(m[1]));

describe('printed transcript page numbers (Production QA 2026-10-29)', () => {
  it('with a cover page, transcript page n prints n (nPNStart 1, the default)', () => {
    const html = htmlService().generateHtml(formData(), lines(3), theme({ nPNStart: 1 }), 'FST');
    expect(html).toContain('titlepage');
    expect(printedPageNumbers(html)).toEqual([1, 2, 3]);
  });

  it('a theme with no nPNStart numbers the transcript pages the same way', () => {
    const html = htmlService().generateHtml(formData(), lines(2), theme(), 'FST');
    expect(printedPageNumbers(html)).toEqual([1, 2]);
  });

  it('"continue from cover" (nPNStart 2) keeps counting the cover page first', () => {
    const html = htmlService().generateHtml(formData(), lines(2), theme({ nPNStart: 2 }), 'FST');
    const numbers = printedPageNumbers(html);
    expect(numbers.length).toBe(2);
    expect(numbers[0]).toBeGreaterThan(1);
    expect(numbers[1]).toBe(numbers[0] + 1);
  });

  it('4-up sheets label each quarter with its transcript page number', () => {
    const html = htmlService().generateHtml(formData(), lines(4), theme({ nPNStart: 1 }), '4UP');
    const quarters = [...html.matchAll(/secondarypageno customfont">\s*Page (\d+)/g)].map(m => Number(m[1]));
    // The 2×2 grid lists its quarters column by column.
    expect([...quarters].sort((a, b) => a - b)).toEqual([1, 2, 3, 4]);
  });
});

describe('body letter spacing and line wrapping (Production QA 2026-10-29)', () => {
  const letterSpacing = (html: string) => html.match(/--body-letter-spacing:\s*([^;"]+)/)?.[1]?.trim();

  it('clamps a theme\'s letter spacing to 0–2px (themes saved with 10, 99 or -5 still exist)', () => {
    expect(clampBodyLetterSpacing(10)).toBe(2);
    expect(clampBodyLetterSpacing(99)).toBe(2);
    expect(clampBodyLetterSpacing(-5)).toBe(0);
    expect(clampBodyLetterSpacing(1.6)).toBe(2);
    expect(clampBodyLetterSpacing('abc')).toBe(0);
    expect(letterSpacing(htmlService().generateHtml(formData(), lines(1), theme({ nBLetterspacing: 10 }), 'FST'))).toBe('2px');
    expect(letterSpacing(htmlService().generateHtml(formData(), lines(1), theme({ nBLetterspacing: 1 }), 'FST'))).toBe('1px');
  });

  it('keeps every numbered line on one printed row (no wrapping into the rows below)', () => {
    const html = htmlService().generateHtml(formData(), lines(1), theme(), 'FST');
    const rule = html.match(/\.line-text pre\s*{[^}]*}/)?.[0] ?? '';
    expect(rule).toMatch(/white-space:\s*pre;/);
  });
});
