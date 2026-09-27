import { findDocumentRowForReference, pageCountFromRange } from './rt-demo-reference';

// Parity with the RT page's own picker (realtime-page.component.ts findDocumentRowForReference).
describe('RT Simulation document link -> index row', () => {
    const row = (id: string | null, extra: Record<string, unknown>) => ({ nBundledetailid: id, ...extra });

    it('prefers the exact tab over a longer tab that merely starts with it', () => {
        const rows = [row('a20', { cTab: 'A20' }), row('ca2', { cTab: 'CA2' }), row('a2', { cTab: 'A2' })];
        expect(findDocumentRowForReference(rows, 'A2')?.nBundledetailid).toBe('a2');
    });

    it('matches tab spellings with a dot or dash', () => {
        expect(findDocumentRowForReference([row('x', { cTab: 'E.2' })], 'E2')?.nBundledetailid).toBe('x');
        expect(findDocumentRowForReference([row('y', { cTab: 'E-2' })], 'E2')?.nBundledetailid).toBe('y');
    });

    it('falls back to the exhibit number, then folder tag + tab, then a contains match', () => {
        expect(findDocumentRowForReference([row('ex', { cTab: '7', cExhibitno: 'C1' })], 'C1')?.nBundledetailid).toBe('ex');
        expect(findDocumentRowForReference([row('ft', { cTab: 'B1', cFolderTag: 'D' })], 'DB1')?.nBundledetailid).toBe('ft');
        expect(findDocumentRowForReference([row('nm', { cTab: '9', cName: 'Exhibit F1 letter' })], 'F1')?.nBundledetailid).toBe('nm');
    });

    it('skips rows that cannot be opened and returns null when nothing matches', () => {
        expect(findDocumentRowForReference([row(null, { cTab: 'A2' })], 'A2')).toBeNull();
        expect(findDocumentRowForReference([row('b', { cTab: 'B3' })], 'A2')).toBeNull();
        expect(findDocumentRowForReference([row('b', { cTab: 'B3' })], '')).toBeNull();
    });

    it('reads a page range as a page count', () => {
        expect(pageCountFromRange('5-24')).toBe(20);
        expect(pageCountFromRange(' 1 - 1 ')).toBe(1);
        expect(pageCountFromRange('12')).toBeNull();
        expect(pageCountFromRange(null)).toBeNull();
    });
});
