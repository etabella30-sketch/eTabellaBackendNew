import { FactExportService } from './fact-export.service';

/**
 * Notes captured from the PDF viewer carry a hard line break at every PDF.js
 * text-layer EOL marker — one per word on an OCR'd exhibit — which the HTML
 * grid hides but pdfmake and docx both render. The viewer now unwraps at
 * capture time; these cover the export-side unwrap that rescues the notes
 * already saved with the breaks in them.
 */
describe('FactExportService unwrapSoftBreaks', () => {
    // The constructor only reads ASSETS off ConfigService; a stub is enough
    // to exercise the pure text helpers.
    const config = { get: () => '' } as any;
    const service = new FactExportService(null as any, config);
    const unwrap = (text: string): string => (service as any).unwrapSoftBreaks(text);

    // Verbatim from a customer export: one break per word, 55 lines for what
    // is really three sentences.
    const perWordBreaks = [
        'However,', 'in', 'addition to', 'the', 'release', 'of', 'the', 'first', 'half', 'of',
        'the Retention', 'Money,', 'the Engineer', 'has', 'considered', 'the', 'completion',
        'status', 'as', 'on', 'the date', 'of', 'this letter', 'and', 'has', 'also', 'accounted',
        'for', 'the', 'following:', '(a)', 'Liquidated', 'Damages', 'and', 'Engineer’s', 'damages',
        'pursuant', 'to', 'Sub-Clause', '47.1;', '(b)', 'Costs,', 'Losses', 'and', 'Damages',
        'incurred', 'by', 'the', 'Employer', 'to bring', 'the', 'Works', 'to', 'substantial',
        'completion.',
    ].join('\n');

    it('rejoins a note broken one word per line', () => {
        expect(unwrap(perWordBreaks).split('\n')).toEqual([
            'However, in addition to the release of the first half of the Retention Money, the Engineer '
            + 'has considered the completion status as on the date of this letter and has also accounted '
            + 'for the following:',
            '(a) Liquidated Damages and Engineer’s damages pursuant to Sub-Clause 47.1;',
            '(b) Costs, Losses and Damages incurred by the Employer to bring the Works to substantial completion.',
        ]);
    });

    it('keeps lettered and bulleted list items on their own lines', () => {
        const out = unwrap(perWordBreaks);
        expect(out).toContain('\n(a) Liquidated');
        expect(out).toContain('\n(b) Costs,');
    });

    it('rejoins a note broken at the source document line ends', () => {
        const perLineBreaks = [
            'Upon the Engineer’s issuance of the Taking-Over Certificate with an effective date of 16 May 2021, the',
            'Engineer is, pursuant to Sub-Clause 60.3 of the Contract, required to certify one half of the Retention',
            'Money for payment to the Contract. The corresponding interim payment certificate is enclosed herewith',
            'for Arabtec’s records.',
        ].join('\n');

        expect(unwrap(perLineBreaks)).toBe(
            'Upon the Engineer’s issuance of the Taking-Over Certificate with an effective date of 16 May 2021, '
            + 'the Engineer is, pursuant to Sub-Clause 60.3 of the Contract, required to certify one half of the '
            + 'Retention Money for payment to the Contract. The corresponding interim payment certificate is '
            + 'enclosed herewith for Arabtec’s records.'
        );
    });

    it('leaves a hand-typed checklist alone', () => {
        const checklist = [
            'Check completion date',
            'Check signature page',
            'Cross-ref Exhibit C-085',
            'Ask counsel',
        ].join('\n');
        expect(unwrap(checklist)).toBe(checklist);
    });

    it('leaves a hand-typed bullet list alone', () => {
        const bullets = ['• First point', '• Second point', '• Third point', '• Fourth point'].join('\n');
        expect(unwrap(bullets)).toBe(bullets);
    });

    it('leaves short notes and single lines alone', () => {
        expect(unwrap('Certification of First Half of Retention Money'))
            .toBe('Certification of First Half of Retention Money');
        expect(unwrap('one\ntwo\nthree')).toBe('one\ntwo\nthree');
    });

    it('handles empty input', () => {
        expect(unwrap('')).toBe('');
        expect(unwrap(null as any)).toBe('');
        expect(unwrap(undefined as any)).toBe('');
    });
});
