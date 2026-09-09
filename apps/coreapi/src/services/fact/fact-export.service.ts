import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DbService } from '@app/global/db/pg/db.service';
import * as fs from 'fs';
import * as path from 'path';
import { randomBytes } from 'crypto';
import * as pdfMake from 'pdfmake';
import * as cheerio from 'cheerio';
import {
    AlignmentType,
    BorderStyle,
    Document,
    Footer,
    Packer,
    PageNumber,
    PageOrientation,
    Paragraph,
    ShadingType,
    Table,
    TableCell,
    TableLayoutType,
    TableRow,
    TabStopType,
    TextRun,
    VerticalAlign,
    WidthType,
} from 'docx';
import { FactExportDownloadReq, FactExportReq } from '../../interfaces/fact.interface';

type ExportIssue = {
    nIssueid: string;
    cIName: string;
    cCategory: string;
    cColor: string;
    cImpact: string;
    cRelevance: string;
};

type ExportRow = {
    nFSid: string;
    cFType: string;
    dCreateDt: any;
    cCreated: string;
    cCreateby: string;
    cNote: string;
    cOriginal: string;
    cTitle: string;
    cSourceRef: string;
    cExhibit: string;
    issues: ExportIssue[];
};

type ExportGroup = {
    nIssueid: string | null;
    cTitle: string;
    cSub: string;
    cColor: string;
    rows: ExportRow[];
};

type ExportColumn = {
    key: string;
    header: string;
    weight: number; // relative width; weights >= 200 become '*' columns in the PDF
    get: (row: ExportRow, index: number, group: ExportGroup) => string;
};

type ExportMeta = {
    cTitle: string;
    cSummary: string;
    cFooter: string;
};

/**
 * Builds a PDF or Word document listing quick facts / facts with their notes,
 * issues, impact, relevance and source. Data comes from the same stored
 * procedures the Fact Work Space grid uses, so the export matches the screen.
 */
@Injectable()
export class FactExportService {
    private readonly logger = new Logger(FactExportService.name);
    private readonly assets: string = this.config.get<string>('ASSETS');
    private readonly exportSubdir = 'exports';
    private readonly maxAgeMs = 24 * 60 * 60 * 1000;
    /** Column weights at or above this share the leftover width instead of being fixed. */
    private readonly flexWeight = 200;
    private readonly marginPt = 28;
    /** Cell padding on each side, in points. */
    private readonly cellPadPt = 4;

    constructor(private readonly db: DbService, private readonly config: ConfigService) { }

    async export(body: FactExportReq): Promise<any> {
        try {
            const { groups, total } = await this.collect(body);
            const meta = this.buildMeta(body, total);
            const columns = this.buildColumns(body);

            const relDir = `doc/case${body.nCaseid}/${this.exportSubdir}/`;
            const absDir = path.join(this.assets, relDir);
            fs.mkdirSync(absDir, { recursive: true });
            this.cleanupOld(absDir);

            const prefix = body.cFType === 'QF' ? 'QFacts' : body.cFType === 'F' ? 'Facts' : 'Facts_QFacts';
            const ext = body.cFormat === 'DOCX' ? 'docx' : 'pdf';
            // the random tail keeps two exports made in the same second apart
            const cFilename = `${prefix}_Export_${this.fileStamp()}_${randomBytes(3).toString('hex')}.${ext}`;
            const absPath = path.join(absDir, cFilename);

            if (body.cFormat === 'DOCX') {
                await this.writeDocx(groups, meta, columns, body.cPgsize || 'A4', absPath);
            } else {
                await this.writePdf(groups, meta, columns, body.cPgsize || 'A4', absPath);
            }

            return { msg: 1, value: 'Export ready', cPath: relDir + cFilename, cFilename, nCount: total };
        } catch (error) {
            this.logger.error(`Fact export failed: ${error?.message || error}`);
            return { msg: -1, value: 'Export failed', error: error?.message || error };
        }
    }

    download(query: FactExportDownloadReq, res: any): void {
        const root = path.resolve(this.assets);
        const target = path.resolve(root, query.cPath || '');
        const inside = target.startsWith(root + path.sep);
        const inExports = target.split(path.sep).includes(this.exportSubdir);
        if (!inside || !inExports || !fs.existsSync(target)) {
            res.status(404).send({ msg: -1, value: 'File not found' });
            return;
        }
        res.download(target, path.basename(target), (err) => {
            if (err && !res.headersSent) {
                res.status(500).send({ msg: -1, value: 'Could not download the file' });
            }
        });
    }

    // ---------------------------------------------------------------- data

    private async collect(body: FactExportReq): Promise<{ groups: ExportGroup[]; total: number }> {
        const base = () => ({
            nCaseid: body.nCaseid,
            nContactid: null,
            nIssueid: null,
            cFacttype: 'ALL',
            jFilter: '[]',
            nMasterid: body.nMasterid,
        });
        const [listRes, issuesRes, filesRes] = await Promise.all([
            this.db.executeRef('workspace_fact_list', base()),
            this.db.executeRef('workspace_fact_issues', base()),
            this.db.executeRef('workspace_fact_files', base()),
        ]);
        if (!listRes.success) throw new Error(listRes.error?.message || 'workspace_fact_list failed');

        const list: any[] = listRes.data?.[0] || [];
        const issueRows: any[] = issuesRes.success ? issuesRes.data?.[0] || [] : [];
        const fileRows: any[] = filesRes.success ? filesRes.data?.[0] || [] : [];

        const issuesBy = new Map<string, ExportIssue[]>();
        for (const r of issueRows) {
            if (!r?.nFSid) continue;
            const arr = issuesBy.get(r.nFSid) || [];
            arr.push({
                nIssueid: r.nIssueid,
                cIName: r.cIName || '',
                cCategory: r.cCategory || '',
                cColor: this.hex(r.cColor),
                cImpact: r.cImpact || '',
                cRelevance: r.cRelevance || '',
            });
            issuesBy.set(r.nFSid, arr);
        }
        const pageBy = new Map<string, string>();
        for (const f of fileRows) {
            if (f?.nFSid && !pageBy.has(f.nFSid)) pageBy.set(f.nFSid, f.cPage ? String(f.cPage) : '');
        }

        const wantType = (t: string) => body.cFType === 'ALL' ? (t === 'F' || t === 'QF') : t === body.cFType;
        const idSet = body.jFSids?.length ? new Set(body.jFSids) : null;
        const issueSet = body.jIssues?.length ? new Set(body.jIssues) : null;

        let rows: ExportRow[] = list
            .filter(f => wantType(f.cFType))
            .filter(f => !idSet || idSet.has(f.nFSid))
            .map(f => this.toRow(f, issuesBy.get(f.nFSid) || [], pageBy.get(f.nFSid) || ''));

        if (issueSet) {
            rows = rows.filter(r => r.issues.some(i => issueSet.has(i.nIssueid)));
        }
        rows.sort((a, b) => this.time(b.dCreateDt) - this.time(a.dCreateDt));

        const groups: ExportGroup[] = [];
        if (body.bGroupByIssue) {
            const seen = new Map<string, ExportIssue>();
            for (const r of rows) {
                for (const i of r.issues) {
                    if ((!issueSet || issueSet.has(i.nIssueid)) && !seen.has(i.nIssueid)) seen.set(i.nIssueid, i);
                }
            }
            const ordered = [...seen.values()].sort((a, b) =>
                a.cCategory.localeCompare(b.cCategory) || a.cIName.localeCompare(b.cIName));
            for (const i of ordered) {
                const grpRows = rows.filter(r => r.issues.some(x => x.nIssueid === i.nIssueid));
                groups.push({
                    nIssueid: i.nIssueid,
                    cTitle: i.cIName || 'Untitled issue',
                    cSub: `${i.cCategory ? i.cCategory + ' · ' : ''}${this.countLabel(grpRows.length)}`,
                    cColor: i.cColor || '#9CA3AF',
                    rows: grpRows,
                });
            }
            if (!issueSet) {
                const unassigned = rows.filter(r => !r.issues.length);
                if (unassigned.length) {
                    groups.push({
                        nIssueid: null,
                        cTitle: 'Unassigned',
                        cSub: this.countLabel(unassigned.length),
                        cColor: '#F59E0B',
                        rows: unassigned,
                    });
                }
            }
        } else {
            groups.push({ nIssueid: null, cTitle: '', cSub: '', cColor: '', rows });
        }
        return { groups, total: rows.length };
    }

    private toRow(f: any, issues: ExportIssue[], cPage: string): ExportRow {
        const notes = this.asArray(f.jTexts).map(t => this.htmlToText(t)).filter(Boolean);
        const note = notes.length ? notes.join('\n') : this.htmlToText(f.cFact || '');
        const original = this.asArray(f.jOT).map(t => this.htmlToText(t)).filter(Boolean).join('\n');
        const tag = f.cBundletag || '-';
        const tab = f.cTab || '-';
        return {
            nFSid: f.nFSid,
            cFType: f.cFType,
            dCreateDt: f.dCreateDt,
            cCreated: this.fmtDate(f.dCreateDt),
            cCreateby: f.cCreateby || f.cCreatedBy || '',
            cNote: note,
            cOriginal: original,
            cTitle: f.cName || f.cFilename || '',
            cSourceRef: `[ ${tag} | ${tab} | ${cPage || '-'} ]`,
            cExhibit: f.cExhibitno || '',
            issues,
        };
    }

    // ------------------------------------------------------------- layout

    private buildMeta(body: FactExportReq, total: number): ExportMeta {
        const what = body.cFType === 'QF' ? 'Quick Facts' : body.cFType === 'F' ? 'Facts' : 'Facts & Quick Facts';
        const parts = [this.countLabel(total)];
        parts.push(body.jIssues?.length
            ? `${body.jIssues.length} selected ${body.jIssues.length === 1 ? 'issue' : 'issues'}`
            : 'All issues');
        if (body.jFSids?.length) parts.push('current filters applied');
        if (body.bGroupByIssue) parts.push('grouped by issue');
        return {
            cTitle: `${body.cCasename ? body.cCasename + ' — ' : ''}${what}`,
            cSummary: parts.join(' · '),
            cFooter: `Generated ${this.fmtDate(new Date())} from eTabella Fact Work Space`,
        };
    }

    private buildColumns(body: FactExportReq): ExportColumn[] {
        const cols: ExportColumn[] = [];
        cols.push({ key: 'idx', header: '#', weight: 18, get: (_r, i) => String(i + 1) });
        if (body.cFType === 'ALL') {
            cols.push({ key: 'type', header: 'Type', weight: 34, get: r => r.cFType === 'QF' ? 'Q Fact' : 'Fact' });
        }
        cols.push({ key: 'created', header: 'Created', weight: 70, get: r => r.cCreateby ? `${r.cCreated}\nBy ${r.cCreateby}` : r.cCreated });
        cols.push({ key: 'note', header: 'Note', weight: 240, get: r => r.cNote || '—' });
        if (body.bIncludeOT) {
            cols.push({ key: 'original', header: 'Original text', weight: 200, get: r => r.cOriginal || '—' });
        }
        cols.push({
            key: 'issues', header: 'Issues', weight: 110,
            get: r => r.issues.length
                ? r.issues.map(i => i.cCategory ? `${i.cIName} (${i.cCategory})` : i.cIName).join('\n')
                : 'Unassigned',
        });
        cols.push({ key: 'impact', header: 'Impact', weight: 58, get: (r, _i, g) => this.pick(r, g, 'cImpact') });
        cols.push({ key: 'relevance', header: 'Relevance', weight: 58, get: (r, _i, g) => this.pick(r, g, 'cRelevance') });
        cols.push({
            key: 'source', header: 'Source', weight: 120,
            get: r => [r.cTitle, r.cSourceRef, r.cExhibit ? `Exhibit No ${r.cExhibit}` : ''].filter(Boolean).join('\n'),
        });
        return cols;
    }

    /** Impact / relevance for the row: the link to the group's issue when grouped, otherwise all distinct values. */
    private pick(row: ExportRow, group: ExportGroup, field: 'cImpact' | 'cRelevance'): string {
        if (group.nIssueid) {
            const link = row.issues.find(i => i.nIssueid === group.nIssueid);
            return link?.[field] || 'Missing';
        }
        const vals = [...new Set(row.issues.map(i => i[field]).filter(Boolean))];
        return vals.length ? vals.join(', ') : 'Missing';
    }

    // ------------------------------------------------- shared page geometry

    /** Landscape page size in points, matching what pdfmake uses for the same name. */
    private pageWidthPt(pageSize: string): number {
        return pageSize === 'LETTER' ? 792 : 841.89; // long edge, landscape
    }

    private pageHeightPt(pageSize: string): number {
        return pageSize === 'LETTER' ? 612 : 595.28;
    }

    /**
     * Final column widths in points. Fixed columns keep their weight; columns
     * marked as flexible (weight >= 200) split whatever is left, which is what
     * pdfmake's '*' does. Both renderers use this so the two files line up.
     */
    private pointWidths(columns: ExportColumn[], availablePt: number): number[] {
        const flexible = columns.filter(c => c.weight >= this.flexWeight);
        const fixedTotal = columns.filter(c => c.weight < this.flexWeight).reduce((s, c) => s + c.weight, 0);
        const share = flexible.length ? Math.max(70, (availablePt - fixedTotal) / flexible.length) : 0;
        return columns.map(c => c.weight >= this.flexWeight ? share : c.weight);
    }

    // ---------------------------------------------------------------- PDF

    private writePdf(groups: ExportGroup[], meta: ExportMeta, columns: ExportColumn[], pageSize: string, absPath: string): Promise<void> {
        const fonts = {
            Roboto: {
                normal: `${this.assets}fonts/Roboto/Roboto-Regular.ttf`,
                bold: `${this.assets}fonts/Roboto/Roboto-Medium.ttf`,
                italics: `${this.assets}fonts/Roboto/Roboto-Italic.ttf`,
                bolditalics: `${this.assets}fonts/Roboto/Roboto-MediumItalic.ttf`,
            },
        };
        const printer = new pdfMake(fonts);

        // pointWidths gives the full column slot. Word counts padding inside that
        // slot, pdfmake adds it outside, so take the padding off here to keep the
        // two files the same width on the page.
        const pad = this.cellPadPt * 2;
        const widths = this.pointWidths(columns, this.pageWidthPt(pageSize) - this.marginPt * 2)
            .map(w => Math.max(10, w - pad));
        const content: any[] = [
            { text: meta.cTitle, style: 'title' },
            { text: meta.cSummary, style: 'meta', margin: [0, 2, 0, 12] },
        ];
        if (!groups.some(g => g.rows.length)) {
            content.push({ text: 'No records match the selected options.', italics: true, color: '#666666' });
        }
        for (const g of groups) {
            if (!g.rows.length) continue;
            if (g.cTitle) {
                content.push({
                    table: {
                        widths: [4, '*'],
                        body: [[
                            { text: '', fillColor: g.cColor },
                            {
                                margin: [6, 3, 0, 3],
                                text: [
                                    { text: g.cTitle, bold: true, fontSize: 10.5 },
                                    { text: g.cSub ? `   ${g.cSub}` : '', color: '#6B7280', fontSize: 8 },
                                ],
                            },
                        ]],
                    },
                    layout: 'noBorders',
                    margin: [0, 10, 0, 4],
                });
            }
            const header = columns.map(c => ({ text: c.header, style: 'th' }));
            const body = g.rows.map((r, i) => columns.map(c => ({ text: c.get(r, i, g), style: 'td' })));
            content.push({
                table: { headerRows: 1, widths, body: [header, ...body] },
                layout: {
                    hLineWidth: (i: number, node: any) => (i === 0 || i === 1 || i === node.table.body.length) ? 0.8 : 0.4,
                    vLineWidth: () => 0,
                    hLineColor: (i: number) => i <= 1 ? '#333333' : '#E5E7EB',
                    paddingTop: () => this.cellPadPt,
                    paddingBottom: () => this.cellPadPt,
                    paddingLeft: () => this.cellPadPt,
                    paddingRight: () => this.cellPadPt,
                    fillColor: (i: number) => i === 0 ? '#333333' : (i % 2 === 0 ? '#FAFAFA' : null),
                },
                margin: [0, 0, 0, 6],
            });
        }

        const docDefinition: any = {
            pageSize: pageSize === 'LETTER' ? 'LETTER' : 'A4',
            pageOrientation: 'landscape',
            pageMargins: [this.marginPt, 36, this.marginPt, 40],
            info: { title: meta.cTitle, author: 'eTabella' },
            footer: (current: number, total: number) => ({
                margin: [28, 12, 28, 0],
                columns: [
                    { text: meta.cFooter, fontSize: 7, color: '#9CA3AF' },
                    { text: `Page ${current} of ${total}`, fontSize: 7, color: '#9CA3AF', alignment: 'right' },
                ],
            }),
            content,
            styles: {
                title: { fontSize: 14, bold: true, color: '#111827' },
                meta: { fontSize: 8.5, color: '#6B7280' },
                th: { bold: true, color: '#FFFFFF', fontSize: 8 },
                td: { fontSize: 8, color: '#1F2937' },
            },
            defaultStyle: { font: 'Roboto', fontSize: 8, lineHeight: 1.15 },
        };

        return new Promise<void>((resolve, reject) => {
            try {
                const pdfDoc = printer.createPdfKitDocument(docDefinition);
                const stream = fs.createWriteStream(absPath);
                stream.on('finish', () => resolve());
                stream.on('error', reject);
                pdfDoc.on('error', reject);
                pdfDoc.pipe(stream);
                pdfDoc.end();
            } catch (err) {
                reject(err);
            }
        });
    }

    // --------------------------------------------------------------- DOCX

    private async writeDocx(groups: ExportGroup[], meta: ExportMeta, columns: ExportColumn[], pageSize: string, absPath: string): Promise<void> {
        const pt = (v: number) => Math.round(v * 20); // points -> twips
        const marginTw = pt(this.marginPt);
        // docx swaps width and height itself for landscape, so hand it the
        // portrait pair: short edge as width, long edge as height.
        const shortEdge = pt(this.pageHeightPt(pageSize));
        const longEdge = pt(this.pageWidthPt(pageSize));
        const usable = longEdge - marginTw * 2;
        const widths = this.pointWidths(columns, this.pageWidthPt(pageSize) - this.marginPt * 2).map(pt);
        // rounding can push the last column past the margin, so trim it back
        const drift = widths.reduce((s, w) => s + w, 0) - usable;
        if (drift > 0) widths[widths.length - 1] -= drift;

        const children: any[] = [
            new Paragraph({
                spacing: { after: 40 },
                children: [new TextRun({ text: meta.cTitle, bold: true, size: 28, color: '111827' })],
            }),
            new Paragraph({
                spacing: { after: 240 },
                children: [new TextRun({ text: meta.cSummary, size: 17, color: '6B7280' })],
            }),
        ];
        if (!groups.some(g => g.rows.length)) {
            children.push(new Paragraph({ children: [new TextRun({ text: 'No records match the selected options.', italics: true, size: 16, color: '666666' })] }));
        }
        for (const g of groups) {
            if (!g.rows.length) continue;
            if (g.cTitle) {
                children.push(this.docxGroupHeader(g, usable));
            }
            children.push(this.docxTable(g, columns, widths));
            children.push(new Paragraph({ spacing: { after: 160 }, children: [] }));
        }

        const doc = new Document({
            creator: 'eTabella',
            title: meta.cTitle,
            styles: {
                default: {
                    document: { run: { font: 'Roboto', size: 16, color: '1F2937' } },
                },
            },
            sections: [{
                properties: {
                    page: {
                        size: { width: shortEdge, height: longEdge, orientation: PageOrientation.LANDSCAPE },
                        margin: { top: pt(36), right: marginTw, bottom: pt(40), left: marginTw },
                    },
                },
                footers: {
                    default: new Footer({
                        children: [new Paragraph({
                            tabStops: [{ type: TabStopType.RIGHT, position: usable }],
                            children: [
                                new TextRun({ text: meta.cFooter, size: 14, color: '9CA3AF' }),
                                new TextRun({
                                    size: 14,
                                    color: '9CA3AF',
                                    children: ['\t', 'Page ', PageNumber.CURRENT, ' of ', PageNumber.TOTAL_PAGES],
                                }),
                            ],
                        })],
                    }),
                },
                children,
            }],
        });
        const buffer = await Packer.toBuffer(doc);
        fs.writeFileSync(absPath, buffer);
    }

    /** Coloured bar plus issue name, mirroring the group heading drawn in the PDF. */
    private docxGroupHeader(group: ExportGroup, usable: number): Table {
        const bar = 80; // 4pt, same as the PDF
        const none = { style: BorderStyle.NONE, size: 0, color: 'auto' };
        const noBorders = { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none };
        const fill = this.hex(group.cColor).replace('#', '') || '9CA3AF';
        return new Table({
            layout: TableLayoutType.FIXED,
            width: { size: usable, type: WidthType.DXA },
            columnWidths: [bar, usable - bar],
            borders: noBorders,
            rows: [new TableRow({
                children: [
                    new TableCell({
                        width: { size: bar, type: WidthType.DXA },
                        shading: { type: ShadingType.CLEAR, color: 'auto', fill },
                        borders: noBorders,
                        margins: { top: 0, bottom: 0, left: 0, right: 0 },
                        children: [new Paragraph({ children: [new TextRun({ text: '', size: 16 })] })],
                    }),
                    new TableCell({
                        width: { size: usable - bar, type: WidthType.DXA },
                        borders: noBorders,
                        verticalAlign: VerticalAlign.CENTER,
                        margins: { top: 40, bottom: 40, left: 120, right: 0 },
                        children: [new Paragraph({
                            children: [
                                new TextRun({ text: group.cTitle, bold: true, size: 21, color: '111827' }),
                                new TextRun({ text: group.cSub ? `   ${group.cSub}` : '', size: 16, color: '6B7280' }),
                            ],
                        })],
                    }),
                ],
            })],
        });
    }

    private docxTable(group: ExportGroup, columns: ExportColumn[], widths: number[]): Table {
        const line = { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' };
        const dark = { style: BorderStyle.SINGLE, size: 6, color: '333333' };
        const none = { style: BorderStyle.NONE, size: 0, color: 'auto' };
        // the PDF draws horizontal rules only, so drop every vertical line here too.
        // the table-level set matters: without it docx falls back to a full grid.
        const bodyBorders = { top: line, bottom: line, left: none, right: none };
        const headBorders = { top: dark, bottom: dark, left: none, right: none };
        const tableBorders = { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none };
        const margins = { top: 80, bottom: 80, left: 80, right: 80 }; // 4pt padding, as in the PDF

        const headerRow = new TableRow({
            tableHeader: true,
            children: columns.map((c, i) => new TableCell({
                width: { size: widths[i], type: WidthType.DXA },
                shading: { type: ShadingType.CLEAR, color: 'auto', fill: '333333' },
                verticalAlign: VerticalAlign.CENTER,
                borders: headBorders,
                margins,
                children: [new Paragraph({ children: [new TextRun({ text: c.header, bold: true, color: 'FFFFFF', size: 16 })] })],
            })),
        });

        const rows = group.rows.map((r, idx) => new TableRow({
            children: columns.map((c, i) => new TableCell({
                width: { size: widths[i], type: WidthType.DXA },
                shading: idx % 2 === 1 ? { type: ShadingType.CLEAR, color: 'auto', fill: 'FAFAFA' } : undefined,
                verticalAlign: VerticalAlign.TOP,
                borders: bodyBorders,
                margins,
                children: this.docxLines(c.get(r, idx, group)),
            })),
        }));

        return new Table({
            layout: TableLayoutType.FIXED,
            width: { size: widths.reduce((s, w) => s + w, 0), type: WidthType.DXA },
            columnWidths: widths,
            borders: tableBorders,
            rows: [headerRow, ...rows],
        });
    }

    private docxLines(text: string): Paragraph[] {
        const lines = String(text || '').split('\n');
        return lines.map(line => new Paragraph({
            spacing: { after: 0, line: 276, lineRule: 'auto' as any },
            alignment: AlignmentType.LEFT,
            children: [new TextRun({ text: line, size: 16, color: '1F2937' })],
        }));
    }

    // ------------------------------------------------------------ helpers

    private countLabel(n: number): string {
        return `${n} ${n === 1 ? 'record' : 'records'}`;
    }

    private asArray(value: any): string[] {
        if (!value) return [];
        if (Array.isArray(value)) return value.map(v => v == null ? '' : String(v));
        if (typeof value === 'string') {
            const s = value.trim();
            if (s.startsWith('[')) {
                try {
                    const parsed = JSON.parse(s);
                    return Array.isArray(parsed) ? parsed.map(v => v == null ? '' : String(v)) : [s];
                } catch {
                    return [s];
                }
            }
            return [s];
        }
        return [String(value)];
    }

    private htmlToText(html: string): string {
        if (!html) return '';
        let s = String(html);
        if (!/<[a-z][\s\S]*>/i.test(s)) return s.replace(/[ \t]+\n/g, '\n').trim();
        s = s
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/(p|div|li|h[1-6]|tr|blockquote)>/gi, '\n')
            .replace(/<li[^>]*>/gi, '• ');
        try {
            const $ = cheerio.load(`<div id="__root">${s}</div>`);
            s = $('#__root').text();
        } catch {
            s = s.replace(/<[^>]+>/g, '');
        }
        return s.replace(/ /g, ' ').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    }

    private hex(color: string): string {
        if (!color) return '';
        const c = String(color).trim();
        return c.startsWith('#') ? c : `#${c}`;
    }

    private time(d: any): number {
        const t = new Date(d).getTime();
        return isNaN(t) ? 0 : t;
    }

    private fmtDate(d: any): string {
        if (!d) return '';
        const dt = new Date(d);
        if (isNaN(dt.getTime())) return String(d);
        const p = (n: number) => String(n).padStart(2, '0');
        return `${p(dt.getDate())}-${p(dt.getMonth() + 1)}-${dt.getFullYear()} ${p(dt.getHours())}:${p(dt.getMinutes())}`;
    }

    private fileStamp(): string {
        const dt = new Date();
        const p = (n: number) => String(n).padStart(2, '0');
        return `${dt.getFullYear()}${p(dt.getMonth() + 1)}${p(dt.getDate())}_${p(dt.getHours())}${p(dt.getMinutes())}${p(dt.getSeconds())}`;
    }

    /** Best-effort removal of export files older than a day so the folder does not grow forever. */
    private cleanupOld(absDir: string): void {
        try {
            const now = Date.now();
            for (const name of fs.readdirSync(absDir)) {
                const full = path.join(absDir, name);
                const stat = fs.statSync(full);
                if (stat.isFile() && now - stat.mtimeMs > this.maxAgeMs) fs.unlinkSync(full);
            }
        } catch {
            // ignore cleanup failures
        }
    }
}
