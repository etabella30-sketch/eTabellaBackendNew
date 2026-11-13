/**
 * A Mark's Issues and ticked Private Analysis Groups as the MarkNav pills, for the server-built Reader export (owner
 * decisions 2026-11-13: "both exports mirror the MarkNav pills"). Pure functions returning pdfmake nodes.
 *
 * - Team Issue: a pill in the Issue's colour, the "users" icon, then the name.
 * - Ticked Private Analysis Group: a pill in the group's colour, the "lock" icon, then the name. The database lists a
 *   group only when the exporter ticked it in this export (2026-11-15: one "issuelist" element per ticked group with
 *   bPrivate true; 2026-11-13b / 2026-11-14b: one element with nIssueid null and the ticked names joined).
 * - The system Unassigned Issue: a yellow pill, no icon (the MarkNav rule: an Issue named "Unassigned").
 * Ink = whichever of the front end's two inks contrasts more with the pill (issuePillInk / inkOn in the web app).
 * Only the name is printed, as real text; never a word such as "Private" or "Team".
 */

/** The transcript export's pill (SUMMARY_PILL, mm) in points: 4.42 mm high, 2.2 mm side padding, 3.19 mm icon. */
export const PILL = { fontSize: 8, height: 12.5, padX: 6.2, icon: 9, iconGap: 3.1, gap: 3.5, rowGap: 2.8, border: 0.7 };

export const PILL_INK_DARK = '#1b2330';
export const PILL_INK_LIGHT = '#ffffff';
/** A pill with no readable colour: the accent (the cards' `var(--pill, var(--accent))`); Unassigned: its yellow. */
const FALLBACK_COLOR = '#0066ff';
const UNASSIGNED_COLOR = '#ffff00';

export type PillKind = 'team' | 'private' | 'plain';
export interface MarkPill { kind: PillKind; name: string; color: string; ink: string }

/** `#rgb`, `#rrggbb`, or the same without `#` as six lower-case hex digits; null otherwise (web app's hexColor). */
export function hexColor(color: unknown): string | null {
    const raw = String(color ?? '').trim().replace(/^#/, '');
    const full = /^[0-9a-f]{3}$/i.test(raw) ? raw.split('').map(c => c + c).join('') : raw;
    return /^[0-9a-f]{6}$/i.test(full) ? full.toLowerCase() : null;
}

function relativeLuminance(color: unknown): number | null {
    const hex = hexColor(color);
    if (!hex) return null;
    const channel = (at: number) => {
        const c = parseInt(hex.slice(at, at + 2), 16) / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
}

function contrastRatio(a: unknown, b: unknown): number | null {
    const la = relativeLuminance(a), lb = relativeLuminance(b);
    if (la === null || lb === null) return null;
    const [light, dark] = la >= lb ? [la, lb] : [lb, la];
    return (light + 0.05) / (dark + 0.05);
}

/** The ink for a pill of this colour: the higher WCAG contrast of the two inks; white for an unreadable colour. */
export function pillInk(color: string | null | undefined): string {
    const onDark = contrastRatio(color, PILL_INK_DARK);
    const onLight = contrastRatio(color, PILL_INK_LIGHT);
    if (onDark === null || onLight === null) return PILL_INK_LIGHT;
    return onDark > onLight ? PILL_INK_DARK : PILL_INK_LIGHT;
}

function oneRun(value: unknown): string {
    return String(value ?? '').split(/\s+/).filter(Boolean).join(' ');
}

/** A ticked group element: bPrivate true (2026-11-15), or the older group element (nIssueid present and null, no
 *  bPrivate key: 2026-11-13b / 2026-11-14b, where only a ticked group had no Issue id). */
export function isGroupElement(el: any): boolean {
    if (!el || typeof el !== 'object') return false;
    if (el.bPrivate === true) return true;
    return el.bPrivate === undefined && 'nIssueid' in el && el.nIssueid === null;
}

/** The pills of one "issuelist", in the order the database sends it (Issues, then ticked groups). */
export function markPills(list: unknown): MarkPill[] {
    if (!Array.isArray(list)) return [];
    const out: MarkPill[] = [];
    for (const el of list) {
        if (!el || typeof el !== 'object') continue;
        const name = oneRun((el as any).cIssue);
        if (!name) continue;
        const kind: PillKind = isGroupElement(el) ? 'private' : name.toLowerCase() === 'unassigned' ? 'plain' : 'team';
        const hex = hexColor((el as any).cClr) ?? hexColor((el as any).cColor);
        const color = hex ? `#${hex}` : kind === 'plain' ? UNASSIGNED_COLOR : FALLBACK_COLOR;
        out.push({ kind, name, color, ink: pillInk(color) });
    }
    return out;
}

// Inter SemiBold (the export's bold Inter, assets/fonts/Inter/Inter-SemiBold.ttf) advance widths of ASCII 32-126, in
// font units (2048 per em), read from the font file with fontkit. Other characters count as a wide 1400.
const INTER_SEMIBOLD_ASCII = [
    516, 658, 1071, 1318, 1332, 2057, 1357, 667, 764, 764, 1105, 1378, 653, 953, 653, 776, 1351, 866, 1276, 1303, 1364,
    1254, 1310, 1180, 1311, 1310, 653, 674, 1378, 1378, 1378, 1113, 2046, 1490, 1350, 1509, 1479, 1240, 1204, 1534,
    1527, 567, 1187, 1440, 1158, 1889, 1555, 1574, 1321, 1583, 1336, 1332, 1352, 1507, 1490, 2089, 1474, 1461, 1336,
    764, 776, 764, 986, 961, 719, 1176, 1278, 1193, 1278, 1211, 796, 1281, 1254, 536, 536, 1166, 536, 1844, 1253, 1247,
    1278, 1278, 813, 1125, 723, 1254, 1202, 1719, 1165, 1205, 1159, 931, 735, 931, 1378,
];
const UNITS_PER_EM = 2048;
const OTHER_CHAR_UNITS = 1400;
/** Kerning and rounding margin, so the name never runs past the pill's end. */
const WIDTH_SAFETY = 1.03;

/** The name's width in points at the pill's font size. */
export function pillTextWidth(text: string): number {
    let units = 0;
    for (const ch of String(text ?? '')) {
        const code = ch.codePointAt(0) ?? 0;
        units += code >= 32 && code <= 126 ? INTER_SEMIBOLD_ASCII[code - 32] : OTHER_CHAR_UNITS;
    }
    return units / UNITS_PER_EM * PILL.fontSize * WIDTH_SAFETY;
}

/** The text, shortened with an ellipsis until it fits maxWidth points (the whole text when it fits). */
export function truncateToWidth(text: string, maxWidth: number): string {
    if (pillTextWidth(text) <= maxWidth) return text;
    const chars = [...text];
    while (chars.length && pillTextWidth(chars.join('').trimEnd() + '…') > maxWidth) chars.pop();
    return chars.join('').trimEnd() + '…';
}

/** The MarkNav cards' icons (24-unit, stroked), as in the web app's markCatTeam / markCatPrivate templates. */
const ICON_PATHS: Record<'team' | 'private', string> = {
    team: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11"/>',
    private: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
};

function iconSvg(kind: 'team' | 'private', ink: string): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${PILL.icon}" height="${PILL.icon}" viewBox="0 0 24 24" fill="none" stroke="${ink}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[kind]}</svg>`;
}

/** The card's slightly darker 1 px edge: 82 % of the colour (`color-mix(... 82%, #000)`). */
function edgeColor(color: string): string {
    const hex = hexColor(color) ?? hexColor(FALLBACK_COLOR)!;
    const to2 = (x: number) => Math.round(x * 0.82).toString(16).padStart(2, '0');
    return `#${to2(parseInt(hex.slice(0, 2), 16))}${to2(parseInt(hex.slice(2, 4), 16))}${to2(parseInt(hex.slice(4, 6), 16))}`;
}

/** Inter's line box is 1.211 em (ascent 1984 + descent 494 over 2048): the name's top inside the pill. */
const TEXT_TOP = (PILL.height - PILL.fontSize * (1984 + 494) / UNITS_PER_EM) / 2;

/**
 * One pill as a pdfmake node of fixed width: a rounded rectangle (canvas) in the pill's colour, then - drawn over it
 * with a negative top margin, as elsewhere in this export - the icon (svg, none for Unassigned) and the name as text.
 * maxWidth shortens the name with an ellipsis so the pill fits.
 */
export function pillNode(pill: MarkPill, maxWidth = Infinity): { node: any; width: number } {
    const iconW = pill.kind === 'plain' ? 0 : PILL.icon + PILL.iconGap;
    const name = truncateToWidth(pill.name, Math.max(0, maxWidth - 2 * PILL.padX - iconW));
    const width = PILL.padX + iconW + pillTextWidth(name) + PILL.padX;
    const columns: any[] = [];
    if (pill.kind !== 'plain') {
        columns.push({ svg: iconSvg(pill.kind, pill.ink), width: PILL.icon, height: PILL.icon, margin: [0, (PILL.height - PILL.icon) / 2 - TEXT_TOP, 0, 0] });
    }
    columns.push({ text: name, color: pill.ink, bold: true, fontSize: PILL.fontSize, lineHeight: 1, noWrap: true, width: 'auto' });
    return {
        width,
        node: {
            width,
            stack: [
                { canvas: [{ type: 'rect', x: 0, y: 0, w: width, h: PILL.height, r: PILL.height / 2, color: pill.color, lineColor: edgeColor(pill.color), lineWidth: PILL.border }] },
                { columns, columnGap: pill.kind === 'plain' ? 0 : PILL.iconGap, margin: [PILL.padX, -PILL.height + TEXT_TOP, 0, 0] },
            ],
        },
    };
}

/** Pills wrapped into rows no wider than maxWidth (pdfmake columns do not wrap), in order. */
export function pillRows(pills: MarkPill[], maxWidth: number): any[] {
    const rows: any[][] = [];
    let row: any[] = [];
    let used = 0;
    for (const pill of pills) {
        const { node, width } = pillNode(pill, maxWidth);
        const need = row.length ? used + PILL.gap + width : width;
        if (row.length && need > maxWidth) {
            rows.push(row);
            row = [node];
            used = width;
        } else {
            row.push(node);
            used = need;
        }
    }
    if (row.length) rows.push(row);
    return rows.map((r, i) => ({ columns: [...r, { text: '', width: '*' }], columnGap: PILL.gap, margin: [0, i === 0 ? 0 : PILL.rowGap, 0, 0] }));
}
