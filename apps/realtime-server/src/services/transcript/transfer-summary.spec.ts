import { publishedMessage, readTransferSummary } from './transfer-summary';

/** Day - 03 re-run with the 2026-10-30 rule: 1,215 on their words, 6 by time, 8 with no time. */
const DAY3 = 'TRANSFER SUMMARY {"marks": {"text": 1215, "time": 6, "no-time": 8, "outside-hearing": 0, "delay": 4}, "quickMarks": {}}';

describe('transfer summary', () => {
    it('reads the last summary line of the run, split across chunks', () => {
        const stdout = 'Matched 2 lines for annotation a.\r\nAll issues processed.\r\n' + DAY3 + '\r\n';
        expect(readTransferSummary(stdout)).toEqual({
            marks: { text: 1215, time: 6, 'no-time': 8, 'outside-hearing': 0, delay: 4 },
            quickMarks: {},
        });
    });

    it('answers null for an old run3.py or a cut line', () => {
        expect(readTransferSummary('All issues processed.')).toBeNull();
        expect(readTransferSummary('TRANSFER SUMMARY {"marks": {"text"')).toBeNull();
    });

    it('builds the Published message from Marks and Quick Marks', () => {
        expect(publishedMessage(readTransferSummary(DAY3))).toBe('Published — 1,221 Marks moved (6 placed by time) · 8 outside the hearing');
        expect(publishedMessage({ marks: { text: 240, time: 3, 'outside-hearing': 1 }, quickMarks: { text: 2, time: 1 } }))
            .toBe('Published — 246 Marks moved (4 placed by time) · 1 outside the hearing');
        expect(publishedMessage({ marks: { text: 1 }, quickMarks: {} })).toBe('Published — 1 Mark moved');
        expect(publishedMessage(null)).toBe('Published');
    });
});
