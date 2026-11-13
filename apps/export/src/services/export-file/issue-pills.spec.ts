import {
    PILL, PILL_INK_DARK, PILL_INK_LIGHT, markPills, pillInk, pillNode, pillRows, pillTextWidth, truncateToWidth,
} from './issue-pills';

/** The Reader export prints a Mark's Issues and ticked Private Analysis Groups as the MarkNav pills (owner 2026-11-13):
 *  a Team Issue = pill in its colour with the users icon, a ticked group = pill in its colour with the lock icon,
 *  the system Unassigned Issue = yellow pill without an icon; ink that reads on the colour. */
describe('pillInk (the front end\'s issuePillInk, same sample colours)', () => {
    it('whichever ink contrasts more: dark on light and mid colours, white on dark and saturated ones', () => {
        expect(pillInk('#ffff00')).toBe(PILL_INK_DARK);
        expect(pillInk('#ffd54a')).toBe(PILL_INK_DARK);
        expect(pillInk('#ffcc99')).toBe(PILL_INK_DARK);
        expect(pillInk('#31a36b')).toBe(PILL_INK_DARK);
        expect(pillInk('#2a6fdb')).toBe(PILL_INK_LIGHT);
        expect(pillInk('#e0483f')).toBe(PILL_INK_LIGHT);
        expect(pillInk('#0b63f6')).toBe(PILL_INK_LIGHT);
    });

    it('reads the server shapes too: no "#", short hex, upper case', () => {
        expect(pillInk('ff8a63')).toBe(PILL_INK_DARK);
        expect(pillInk('FFFF00')).toBe(PILL_INK_DARK);
        expect(pillInk('#ff0')).toBe(PILL_INK_DARK);
    });

    it('an unreadable colour gets white ink', () => {
        expect(pillInk('')).toBe(PILL_INK_LIGHT);
        expect(pillInk(undefined)).toBe(PILL_INK_LIGHT);
        expect(pillInk('blue')).toBe(PILL_INK_LIGHT);
    });

    it('uses the front end\'s two inks', () => {
        expect(PILL_INK_DARK).toBe('#1b2330');
        expect(PILL_INK_LIGHT).toBe('#ffffff');
    });
});

describe('markPills (index "issuelist" -> pills)', () => {
    const liability = { nIssueid: 'i-32', cIssue: 'Liability', cClr: 'ff9163' };
    const unassigned = { nIssueid: 'i-31', cIssue: 'Unassigned', cClr: 'ffff00' };

    it('a Team Issue is a users pill, the system Unassigned Issue a plain pill, a ticked group (bPrivate) a lock pill', () => {
        const pills = markPills([
            liability, unassigned,
            { nIssueid: null, cIssue: 'Alpha', cClr: '0066FF', bPrivate: true },
            { nIssueid: null, cIssue: 'Beta', cClr: '7C5CFF', bPrivate: true },
        ]);

        expect(pills).toEqual([
            { kind: 'team', name: 'Liability', color: '#ff9163', ink: PILL_INK_DARK },
            { kind: 'plain', name: 'Unassigned', color: '#ffff00', ink: PILL_INK_DARK },
            { kind: 'private', name: 'Alpha', color: '#0066ff', ink: PILL_INK_LIGHT },
            { kind: 'private', name: 'Beta', color: '#7c5cff', ink: PILL_INK_LIGHT },
        ]);
    });

    it('keeps the order the database sends (Issues, then the ticked groups in group-list order)', () => {
        const names = markPills([
            { nIssueid: null, cIssue: 'Zulu', cClr: '111111', bPrivate: true }, liability,
        ]).map(p => p.name);
        expect(names).toEqual(['Zulu', 'Liability']);
    });

    it('old SQL (2026-11-14b): the one joined group element (nIssueid null, no bPrivate) is a lock pill with the joined names', () => {
        expect(markPills([liability, { nIssueid: null, cIssue: 'Alpha, Beta', cClr: '0066FF' }])).toEqual([
            { kind: 'team', name: 'Liability', color: '#ff9163', ink: PILL_INK_DARK },
            { kind: 'private', name: 'Alpha, Beta', color: '#0066ff', ink: PILL_INK_LIGHT },
        ]);
    });

    it('an element without nIssueid at all (fact sheet / factsheet rows) is an Issue', () => {
        expect(markPills([{ cIssue: 'Liability', cClr: 'ff9163' }])[0].kind).toBe('team');
        expect(markPills([{ cIssue: ' unassigned ', cClr: 'ffff00' }])[0].kind).toBe('plain');
    });

    it('falls back to yellow for Unassigned and the accent for any other pill without a readable colour', () => {
        expect(markPills([{ nIssueid: 'i', cIssue: 'Unassigned', cClr: null }])[0].color).toBe('#ffff00');
        expect(markPills([{ nIssueid: 'i', cIssue: 'Liability', cClr: 'nope' }])[0].color).toBe('#0066ff');
        expect(markPills([{ nIssueid: null, cIssue: 'Alpha', cClr: undefined, bPrivate: true }])[0].color).toBe('#0066ff');
        expect(markPills([{ nIssueid: 'i', cIssue: 'Liability', cColor: '#e0483f' }])[0].color).toBe('#e0483f');
    });

    it('skips empty names and collapses whitespace; anything but an array is no pill', () => {
        expect(markPills([{ nIssueid: 'i', cIssue: '  ', cClr: 'ff9163' }, { nIssueid: 'j', cIssue: ' Two\n words ', cClr: 'ff9163' }])
            .map(p => p.name)).toEqual(['Two words']);
        expect(markPills(null)).toEqual([]);
        expect(markPills(undefined)).toEqual([]);
        expect(markPills('Liability')).toEqual([]);
        expect(markPills([null, 3, 'x'])).toEqual([]);
    });
});

describe('pill geometry and pdfmake nodes', () => {
    it('measures the name in Inter SemiBold at the pill size', () => {
        // Inter SemiBold advance widths (units per em 2048): "Liability" = 7684 units.
        expect(pillTextWidth('Liability')).toBeCloseTo(7684 / 2048 * PILL.fontSize * 1.03, 3);
        expect(pillTextWidth('')).toBe(0);
        expect(pillTextWidth('Ünïcode')).toBeGreaterThan(pillTextWidth('Unicode'));
    });

    it('shortens a name that does not fit with an ellipsis, and leaves one that fits alone', () => {
        expect(truncateToWidth('Liability', 1000)).toBe('Liability');
        const cut = truncateToWidth('A very long Private Analysis Group name indeed', 60);
        expect(cut.endsWith('…')).toBe(true);
        expect(pillTextWidth(cut)).toBeLessThanOrEqual(60);
    });

    it('a lock pill: a rounded rectangle in the group colour, the lock icon in the ink, then the name as real text', () => {
        const { node, width } = pillNode({ kind: 'private', name: 'Alpha', color: '#0066ff', ink: PILL_INK_LIGHT });

        expect(width).toBeCloseTo(PILL.padX + PILL.icon + PILL.iconGap + pillTextWidth('Alpha') + PILL.padX, 5);
        expect(node.width).toBe(width);
        const rect = node.stack[0].canvas[0];
        expect(rect).toEqual(expect.objectContaining({ type: 'rect', x: 0, y: 0, w: width, h: PILL.height, r: PILL.height / 2, color: '#0066ff' }));
        expect(rect.lineColor).toBe('#0054d1');            // 82 % of the colour: the card's darker edge
        const [icon, text] = node.stack[1].columns;
        expect(icon.svg).toContain('<rect x="5" y="10" width="14" height="11" rx="2"/>');
        expect(icon.svg).toContain(`stroke="${PILL_INK_LIGHT}"`);
        expect(text).toEqual(expect.objectContaining({ text: 'Alpha', color: PILL_INK_LIGHT, bold: true, noWrap: true }));
    });

    it('a Team Issue pill has the users icon; the Unassigned pill has no icon', () => {
        const team = pillNode({ kind: 'team', name: 'Liability', color: '#ff9163', ink: PILL_INK_DARK });
        expect(team.node.stack[1].columns[0].svg).toContain('<circle cx="9" cy="7" r="4"/>');
        expect(team.node.stack[1].columns[0].svg).toContain(`stroke="${PILL_INK_DARK}"`);

        const plain = pillNode({ kind: 'plain', name: 'Unassigned', color: '#ffff00', ink: PILL_INK_DARK });
        expect(plain.width).toBeCloseTo(2 * PILL.padX + pillTextWidth('Unassigned'), 5);
        expect(plain.node.stack[1].columns).toHaveLength(1);
        expect(plain.node.stack[1].columns[0]).toEqual(expect.objectContaining({ text: 'Unassigned', color: PILL_INK_DARK }));
        expect(JSON.stringify(plain.node)).not.toContain('<svg');
    });

    it('never prints the words "Private" or "Team" for a pill: only the name', () => {
        const json = JSON.stringify(pillNode({ kind: 'private', name: 'Alpha', color: '#0066ff', ink: PILL_INK_LIGHT }).node);
        expect(json).not.toMatch(/private|team/i);
    });

    it('wraps pills into rows that fit the width, in order', () => {
        const pills = ['Alpha', 'Beta', 'Gamma', 'Delta'].map(name => ({ kind: 'private' as const, name, color: '#0066ff', ink: PILL_INK_LIGHT }));
        const w = pills.map(p => pillNode(p).width);
        const width = Math.max(w[0] + PILL.gap + w[1], w[2] + PILL.gap + w[3]) + 1;
        expect(w[0] + PILL.gap + w[1] + PILL.gap + w[2]).toBeGreaterThan(width);
        const rows = pillRows(pills, width);

        expect(rows).toHaveLength(2);
        expect(rows[0].columns.slice(0, -1).map((c: any) => c.stack[1].columns[1].text)).toEqual(['Alpha', 'Beta']);
        expect(rows[1].columns.slice(0, -1).map((c: any) => c.stack[1].columns[1].text)).toEqual(['Gamma', 'Delta']);
        expect(rows[0].columnGap).toBe(PILL.gap);
        expect(rows[0].columns[rows[0].columns.length - 1]).toEqual({ text: '', width: '*' });
        expect(pillRows([], 300)).toEqual([]);
    });

    it('a pill wider than the row is shortened to fit', () => {
        const rows = pillRows([{ kind: 'team', name: 'An extremely long Team Issue name that cannot fit', color: '#ff9163', ink: PILL_INK_DARK }], 80);
        expect(rows).toHaveLength(1);
        expect(rows[0].columns[0].width).toBeLessThanOrEqual(80);
        expect(rows[0].columns[0].stack[1].columns[1].text.endsWith('…')).toBe(true);
    });
});
