import { ExportFileService } from './export-file.service';
import { PILL_INK_DARK, PILL_INK_LIGHT } from './issue-pills';

/** Owner decisions 2026-11-13: the Reader export ("Export with Marks") prints a Mark's Issues as the MarkNav pills:
 *  each Team Issue = pill (Issue colour, users icon, name), each TICKED Private Analysis Group = pill (group colour,
 *  lock icon, name), the system Unassigned Issue = yellow pill without an icon. The database sends the ticked groups
 *  as "issuelist" elements with bPrivate true (2026-11-15); the 2026-11-14b shape (one joined element, no bPrivate)
 *  must still print. */
function service(): any {
    const svc: any = Object.create(ExportFileService.prototype);
    svc.configService = { get: jest.fn(() => '') };
    svc.logService = { info: jest.fn(), log: jest.fn(), error: jest.fn() };
    svc.logger = { verbose: jest.fn(), error: jest.fn() };
    svc.IDX = {
        navy: '#002f64', ink: '#12233f', ink2: '#2a3a55', mute: '#5b6b85', mute2: '#8b99b2',
        line: '#e1eaf6', line2: '#eef3fb', paper: '#f6f9ff', thead: '#eef2f8',
        accent: '#0066ff', link: '#c2570f', rowAlt: '#fbfcfe',
    };
    return svc;
}

/** Every pill (pdfmake node with a rounded canvas rect) under `node`, as {name, fill, icon}. */
function pillsIn(node: any): { name: string; fill: string; icon: 'users' | 'lock' | null }[] {
    const out: { name: string; fill: string; icon: 'users' | 'lock' | null }[] = [];
    const walk = (n: any) => {
        if (!n || typeof n !== 'object') return;
        if (Array.isArray(n)) { n.forEach(walk); return; }
        const rect = Array.isArray(n.stack) && n.stack[0]?.canvas?.[0];
        if (rect && rect.type === 'rect' && rect.r > 0 && Array.isArray(n.stack[1]?.columns)) {
            const cols = n.stack[1].columns;
            const text = cols[cols.length - 1].text;
            const svg = cols.length > 1 ? String(cols[0].svg) : '';
            out.push({ name: text, fill: rect.color, icon: svg.includes('<circle cx="9"') ? 'users' : svg.includes('rx="2"/>') ? 'lock' : null });
            return;
        }
        Object.values(n).forEach(walk);
    };
    walk(node);
    return out;
}

const liability = { nIssueid: 'i-32', cIssue: 'Liability', cClr: 'ff9163' };
const unassigned = { nIssueid: 'i-31', cIssue: 'Unassigned', cClr: 'ffff00' };
const alpha = { nIssueid: null, cIssue: 'Alpha', cClr: '0066FF', bPrivate: true };
const beta = { nIssueid: null, cIssue: 'Beta', cClr: '7C5CFF', bPrivate: true };

describe('ExportFileService annotation index: Issues and ticked groups as pills', () => {
    it('prints every element of a mixed Mark: the Team Issue with the users icon, then each ticked group with the lock icon', () => {
        const svc = service();
        const cell = svc.idxSourceCell({ jTexts: ['text 61'], issuelist: [liability, alpha, beta], cColor: 'ff9163' }, 'QF', '#ff9163');

        expect(pillsIn(cell)).toEqual([
            { name: 'Liability', fill: '#ff9163', icon: 'users' },
            { name: 'Alpha', fill: '#0066ff', icon: 'lock' },
            { name: 'Beta', fill: '#7c5cff', icon: 'lock' },
        ]);
        // The passage itself is unchanged and first.
        expect(cell.table.body[0][0].stack[0].text).toBe('text 61');
    });

    it('the system Unassigned Issue is a yellow pill without an icon, in dark ink', () => {
        const svc = service();
        const cell = svc.idxSourceCell({ jTexts: ['text 64'], issuelist: [unassigned], cColor: 'ffff00' }, 'QF', '#ffff00');

        expect(pillsIn(cell)).toEqual([{ name: 'Unassigned', fill: '#ffff00', icon: null }]);
        expect(JSON.stringify(cell)).toContain(`"color":"${PILL_INK_DARK}"`);
    });

    it('a dark pill gets white ink', () => {
        const svc = service();
        const cell = svc.idxSourceCell({ jTexts: ['t'], issuelist: [alpha] }, 'QF', '#0066ff');
        expect(JSON.stringify(cell)).toContain(`"text":"Alpha","color":"${PILL_INK_LIGHT}"`);
    });

    it('no issuelist: the passage only, no pill and no stray dot', () => {
        const svc = service();
        const cell = svc.idxSourceCell({ jTexts: ['plain'] }, 'D', '#0066ff');
        expect(pillsIn(cell)).toEqual([]);
        expect(JSON.stringify(cell)).not.toContain('<circle cx="4.5"');
    });

    it('old SQL (2026-11-14b): the one joined group element still prints, as one lock pill with the joined names', () => {
        const svc = service();
        const cell = svc.idxSourceCell({ jTexts: ['t'], issuelist: [liability, { nIssueid: null, cIssue: 'Alpha, Beta', cClr: '7C5CFF' }] }, 'QF', '#ff9163');
        expect(pillsIn(cell)).toEqual([
            { name: 'Liability', fill: '#ff9163', icon: 'users' },
            { name: 'Alpha, Beta', fill: '#7c5cff', icon: 'lock' },
        ]);
    });

    it('the row tone of a private-only Mark is its burned colour (cColor), not the first group pill\'s', () => {
        const svc = service();
        // 62 in Beta then Alpha, both ticked: pills in name order (Alpha first), burned in Alpha's... here the most
        // recently added ticked group is Beta: cColor 7C5CFF.
        expect(svc.idxRowTone({ issuelist: [alpha, beta], cColor: '7C5CFF' }, 'QF')).toBe('#7C5CFF');
        // A Mark with a Team Issue keeps the first Issue's colour, as before.
        expect(svc.idxRowTone({ issuelist: [liability, alpha], cColor: 'ff9163' }, 'QF')).toBe('#ff9163');
        // Old SQL: the single group element without bPrivate - the row's own colour first too.
        expect(svc.idxRowTone({ issuelist: [{ nIssueid: null, cIssue: 'Alpha, Beta', cClr: '0066FF' }], cColor: '0066FF' }, 'QF')).toBe('#0066FF');
        // No colour at all: the per-type accent, as before.
        expect(svc.idxRowTone({}, 'F')).toBe('#1c7a4b');
    });

    it('a whole index row renders with the pills (no exception, no logged error)', () => {
        const svc = service();
        svc.getPageno = jest.fn(() => 0);
        const table = svc.idxRowsTable([{ nFSid: 'f62', nPage: 2, cFType: 'QF', jTexts: ['t'], issuelist: [alpha, beta], cColor: '7C5CFF' }], 'QF');
        expect(pillsIn(table).map(p => p.name)).toEqual(['Alpha', 'Beta']);
        expect(svc.logService.error).not.toHaveBeenCalled();
    });
});

describe('ExportFileService other places that print a Mark\'s Issues', () => {
    it('the appendix Issues column prints one pill per Issue', () => {
        const svc = service();
        expect(pillsIn(svc.getIssues([liability, unassigned]))).toEqual([
            { name: 'Liability', fill: '#ff9163', icon: 'users' },
            { name: 'Unassigned', fill: '#ffff00', icon: null },
        ]);
        expect(svc.getIssues([])).toEqual([]);
        expect(svc.getIssues(null)).toEqual([]);
    });

    it('the fact sheet Issues table prints the Issue name as a pill (relevance and impact columns unchanged)', () => {
        const svc = service();
        expect(pillsIn(svc.factsheetIssueCell({ cIssue: 'Liability', cClr: 'ff9163', cRelevance: 'High', cImpact: 'For us' }))).toEqual([
            { name: 'Liability', fill: '#ff9163', icon: 'users' },
        ]);
        expect(pillsIn(svc.factsheetIssueCell({ cIssue: 'Unassigned', cClr: 'FFFF00' }))).toEqual([
            { name: 'Unassigned', fill: '#ffff00', icon: null },
        ]);
        // No name: an empty cell, not an exception.
        expect(pillsIn(svc.factsheetIssueCell({ cClr: 'ff9163' }))).toEqual([]);
    });
});
