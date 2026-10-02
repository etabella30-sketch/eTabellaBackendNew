import { unzip } from './testing/unzip';
import { buildZip, dosDateTime } from './zip';

const AT = Date.UTC(2026, 9, 1, 9, 30, 44);

describe('buildZip (diagnostics archive)', () => {
    it('round-trips text and binary entries, deflating what compresses and storing what does not', () => {
        const big = JSON.stringify({ rows: Array.from({ length: 200 }, (_, i) => ({ i, code: 'tx-refused' })) });
        const random = Buffer.from(Array.from({ length: 64 }, (_, i) => (i * 97 + 13) % 256));
        const zip = buildZip([
            { name: 'README.txt', data: 'hello', mtimeMs: AT },
            { name: 'log/connectivity.json', data: big, mtimeMs: AT },
            { name: 'blob.bin', data: random, mtimeMs: AT },
            { name: 'naïve-ünïcode.json', data: '{"ok":true}', mtimeMs: AT },
        ]);
        const entries = unzip(zip);
        expect(entries.map(e => e.name)).toEqual(['README.txt', 'log/connectivity.json', 'blob.bin', 'naïve-ünïcode.json']);
        expect(entries[0].data.toString()).toBe('hello');
        expect(entries[1].data.toString()).toBe(big);
        expect(entries[1].method).toBe(8);
        expect(entries[2].data.equals(random)).toBe(true);
        expect(entries[2].method).toBe(0);
        expect(entries[3].data.toString()).toBe('{"ok":true}');
    });

    it('writes an empty archive as a lone end record', () => {
        const zip = buildZip([]);
        expect(zip.length).toBe(22);
        expect(unzip(zip)).toEqual([]);
    });

    it('stamps MS-DOS dates in UTC with 2-second resolution and clamps to 1980', () => {
        const { time, date } = dosDateTime(AT);
        expect(date).toBe(((2026 - 1980) << 9) | (10 << 5) | 1);
        expect(time).toBe((9 << 11) | (30 << 5) | 22);
        expect(dosDateTime(0)).toEqual({ time: 0, date: (1 << 5) | 1 });
        expect(dosDateTime(Number.NaN)).toEqual({ time: 0, date: (1 << 5) | 1 });
        const entries = unzip(buildZip([{ name: 'a.txt', data: 'x', mtimeMs: AT }]));
        expect([entries[0].dosTime, entries[0].dosDate]).toEqual([time, date]);
    });

    it('refuses unsafe or duplicate names', () => {
        for (const name of ['', '/abs.txt', '../up.txt', 'a/../b.txt', 'a\\b.txt', 'a//b.txt']) {
            expect(() => buildZip([{ name, data: 'x', mtimeMs: AT }])).toThrow(/invalid entry name/);
        }
        expect(() =>
            buildZip([
                { name: 'a.txt', data: 'x', mtimeMs: AT },
                { name: 'a.txt', data: 'y', mtimeMs: AT },
            ]),
        ).toThrow(/duplicate/);
    });
});
