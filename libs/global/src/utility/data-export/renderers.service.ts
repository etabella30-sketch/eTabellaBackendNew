import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as ExcelJS from 'exceljs';
import * as pdfMake from 'pdfmake';
import { Document, Packer, Paragraph, HeadingLevel, Table, TableRow, TableCell, WidthType } from 'docx';
import type { Dataset, DataExportFormat } from './types';

export interface RenderedFile {
  buffer: Buffer;
  contentType: string;
  ext: string;
}

const MIME: Record<DataExportFormat, string> = {
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv',
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

/**
 * Generic renderers for case-data exports. Each takes the fetched dataset(s)
 * (rows of arbitrary columns) and emits a file buffer — columns are derived
 * from the data, so unknown/added SP columns render without code changes.
 *
 * Shared by the export app (Export Data card) and the downloadapi package
 * builder (Download Case Package include-flags).
 */
@Injectable()
export class DataExportRenderer {
  private readonly printer: any;

  constructor(private readonly config: ConfigService) {
    const assets = this.config.get<string>('ASSETS');
    const fonts = {
      Roboto: {
        normal: `${assets}fonts/Roboto/Roboto-Regular.ttf`,
        bold: `${assets}fonts/Roboto/Roboto-Medium.ttf`,
        italics: `${assets}fonts/Roboto/Roboto-Italic.ttf`,
        bolditalics: `${assets}fonts/Roboto/Roboto-MediumItalic.ttf`,
      },
    };
    this.printer = new (pdfMake as any)(fonts);
  }

  async render(datasets: Dataset[], format: DataExportFormat, title: string): Promise<RenderedFile> {
    const buffer =
      format === 'xlsx' ? await this.xlsx(datasets)
      : format === 'csv' ? this.csv(datasets)
      : format === 'docx' ? await this.docx(datasets, title)
      : await this.pdf(datasets, title);
    return { buffer, contentType: MIME[format], ext: format };
  }

  /**
   * Evidence-Index layout: the master-index design — rows grouped by bundle
   * section (A. …, B. …) with fixed columns (Tab / Exhibit / Document &
   * Description / Kind / Date / Pages / Relevance) instead of a generic dump.
   */
  async renderIndex(rows: Record<string, any>[], format: DataExportFormat, title: string): Promise<RenderedFile> {
    const groups = this.groupBySection(rows);
    const buffer =
      format === 'xlsx' ? await this.indexXlsx(groups)
      : format === 'csv' ? this.indexCsv(groups)
      : format === 'docx' ? await this.indexDocx(groups, title)
      : await this.indexPdf(groups, title);
    return { buffer, contentType: MIME[format], ext: format };
  }

  // ------------------------------ helpers ------------------------------

  /** Union of column keys across a dataset's rows (stable first-seen order). */
  private columns(rows: Record<string, any>[]): string[] {
    const seen: string[] = [];
    for (const row of rows) for (const k of Object.keys(row)) if (!seen.includes(k)) seen.push(k);
    return seen;
  }

  /** "cFilename" -> "Filename", "nIssues" -> "Issues", "created_by" -> "Created By". */
  private humanize(key: string): string {
    let k = key.replace(/^[cnjdb](?=[A-Z])/, ''); // drop hungarian prefix
    k = k.replace(/[_-]+/g, ' ').replace(/([a-z0-9])([A-Z])/g, '$1 $2');
    return k.charAt(0).toUpperCase() + k.slice(1);
  }

  /** Render any cell value to a string (objects/arrays -> JSON). */
  private cell(v: any): string {
    if (v === null || v === undefined) return '';
    if (typeof v === 'object') { try { return JSON.stringify(v); } catch { return String(v); } }
    return String(v);
  }

  // ------------------------------ xlsx ------------------------------

  private async xlsx(datasets: Dataset[]): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    for (const ds of datasets.length ? datasets : [{ name: 'Sheet1', rows: [] }]) {
      const ws = wb.addWorksheet((ds.name || 'Sheet').slice(0, 31));
      const cols = this.columns(ds.rows);
      if (cols.length) {
        ws.columns = cols.map((c) => ({ header: this.humanize(c), key: c, width: 24 }));
        ws.getRow(1).font = { bold: true };
        for (const row of ds.rows) {
          const out: Record<string, string> = {};
          for (const c of cols) out[c] = this.cell(row[c]);
          ws.addRow(out);
        }
      } else {
        ws.addRow(['No data']);
      }
    }
    return Buffer.from(await wb.xlsx.writeBuffer());
  }

  // ------------------------------ csv ------------------------------

  private csv(datasets: Dataset[]): Buffer {
    const esc = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
    const parts: string[] = [];
    datasets.forEach((ds, i) => {
      if (datasets.length > 1) parts.push(`# ${ds.name}`);
      const cols = this.columns(ds.rows);
      if (!cols.length) { parts.push('No data'); }
      else {
        parts.push(cols.map((c) => esc(this.humanize(c))).join(','));
        for (const row of ds.rows) parts.push(cols.map((c) => esc(this.cell(row[c]))).join(','));
      }
      if (datasets.length > 1 && i < datasets.length - 1) parts.push('');
    });
    return Buffer.from(parts.join('\n'), 'utf8');
  }

  // ------------------------------ pdf ------------------------------

  private pdf(datasets: Dataset[], title: string): Promise<Buffer> {
    const content: any[] = [{ text: title, style: 'title' }];
    for (const ds of datasets) {
      content.push({ text: ds.name, style: 'section' });
      const cols = this.columns(ds.rows);
      if (!cols.length) { content.push({ text: 'No data', italics: true, margin: [0, 0, 0, 10] }); continue; }
      const body = [cols.map((c) => ({ text: this.humanize(c), bold: true }))];
      for (const row of ds.rows) body.push(cols.map((c) => ({ text: this.cell(row[c]) } as any)));
      content.push({
        table: { headerRows: 1, widths: cols.map(() => 'auto'), body },
        layout: 'lightHorizontalLines', fontSize: 7, margin: [0, 0, 0, 12],
      });
    }
    const docDef = {
      pageOrientation: 'landscape',
      pageSize: 'A4',
      content,
      defaultStyle: { fontSize: 7 },
      styles: {
        title: { fontSize: 16, bold: true, margin: [0, 0, 0, 10] },
        section: { fontSize: 11, bold: true, margin: [0, 8, 0, 4] },
      },
    };
    return new Promise<Buffer>((resolve, reject) => {
      try {
        const doc = this.printer.createPdfKitDocument(docDef);
        const chunks: Buffer[] = [];
        doc.on('data', (c: Buffer) => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        doc.end();
      } catch (err) { reject(err); }
    });
  }

  // ------------------------------ docx ------------------------------

  private async docx(datasets: Dataset[], title: string): Promise<Buffer> {
    const children: any[] = [new Paragraph({ text: title, heading: HeadingLevel.HEADING_1 })];
    for (const ds of datasets) {
      children.push(new Paragraph({ text: ds.name, heading: HeadingLevel.HEADING_2 }));
      const cols = this.columns(ds.rows);
      if (!cols.length) { children.push(new Paragraph({ text: 'No data' })); continue; }
      const headerRow = new TableRow({
        children: cols.map((c) => new TableCell({ children: [new Paragraph({ text: this.humanize(c) })] })),
      });
      const dataRows = ds.rows.map((row) => new TableRow({
        children: cols.map((c) => new TableCell({ children: [new Paragraph({ text: this.cell(row[c]) })] })),
      }));
      children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, ...dataRows] }));
      children.push(new Paragraph({ text: '' }));
    }
    const doc = new Document({ sections: [{ children }] });
    return Buffer.from(await Packer.toBuffer(doc));
  }

  // ------------------------------ evidence index ------------------------------

  private readonly INDEX_COLS: { header: string; keys: string[] }[] = [
    { header: 'Tab', keys: ['cTab'] },
    { header: 'Exhibit', keys: ['cExhibitno', 'cExhibitNo', 'cExhibit'] },
    { header: 'Document & Description', keys: ['cFilename', 'cFileName', 'cName', 'cDescription', 'cDesc'] },
    { header: 'Kind', keys: ['cFiletype', 'cFileType', 'cKind'] },
    { header: 'Date', keys: ['cDate', 'dDate', 'jDate', 'dDocdate', 'dCreateDt'] },
    { header: 'Pages', keys: ['cPage', 'cPages', 'nPages'] },
    { header: 'Relevance', keys: ['cRelevance', 'nRelevance', 'cRel'] },
  ];

  /** First non-empty stringified value across candidate keys. */
  private valOf(row: Record<string, any>, keys: string[]): string {
    for (const k of keys) { const v = row[k]; if (v !== null && v !== undefined && v !== '') return this.cell(v); }
    return '';
  }

  /** "A" + "Procedural Documents" -> "A. Procedural Documents". */
  private sectionLabel(row: Record<string, any>): string {
    const tag = this.valOf(row, ['cFolderTag', 'cFoldertag', 'cSection', 'cVolumeTag']);
    const name = this.valOf(row, ['cFolder', 'cFoldername', 'cVolume', 'cSectionName']);
    if (tag && name) return `${tag}. ${name}`;
    return name || tag || 'Documents';
  }

  /** Group rows into ordered sections, preserving first-seen order. */
  private groupBySection(rows: Record<string, any>[]): { label: string; rows: Record<string, any>[] }[] {
    const map = new Map<string, Record<string, any>[]>();
    for (const row of rows) {
      const label = this.sectionLabel(row);
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(row);
    }
    return [...map.entries()].map(([label, rs]) => ({ label, rows: rs }));
  }

  private indexRow(row: Record<string, any>): string[] {
    return this.INDEX_COLS.map((c) => this.valOf(row, c.keys) || '—');
  }

  // ---- index: xlsx (section title rows merged across the columns) ----
  private async indexXlsx(groups: { label: string; rows: Record<string, any>[] }[]): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Evidence Index');
    const n = this.INDEX_COLS.length;
    ws.columns = this.INDEX_COLS.map((c, i) => ({ header: c.header, key: 'c' + i, width: i === 2 ? 60 : 16 }));
    ws.getRow(1).font = { bold: true };
    for (const g of groups) {
      const titleRow = ws.addRow([g.label]);
      ws.mergeCells(titleRow.number, 1, titleRow.number, n);
      titleRow.font = { bold: true };
      titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF3FB' } };
      for (const row of g.rows) ws.addRow(this.indexRow(row));
    }
    return Buffer.from(await wb.xlsx.writeBuffer());
  }

  // ---- index: csv ----
  private indexCsv(groups: { label: string; rows: Record<string, any>[] }[]): Buffer {
    const esc = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
    const parts: string[] = [this.INDEX_COLS.map((c) => esc(c.header)).join(',')];
    for (const g of groups) {
      parts.push('');
      parts.push(esc(g.label));
      for (const row of g.rows) parts.push(this.indexRow(row).map(esc).join(','));
    }
    return Buffer.from(parts.join('\n'), 'utf8');
  }

  // ---- index: pdf (landscape, per-section table) ----
  private indexPdf(groups: { label: string; rows: Record<string, any>[] }[], title: string): Promise<Buffer> {
    const headerCells = this.INDEX_COLS.map((c) => ({ text: c.header, bold: true }));
    const content: any[] = [{ text: title, style: 'title' }];
    for (const g of groups) {
      content.push({ text: g.label, style: 'section' });
      const body = [headerCells, ...g.rows.map((r) => this.indexRow(r).map((t) => ({ text: t } as any)))];
      content.push({
        table: { headerRows: 1, widths: ['auto', 'auto', '*', 'auto', 'auto', 'auto', 'auto'], body },
        layout: 'lightHorizontalLines', fontSize: 7, margin: [0, 0, 0, 12],
      });
    }
    const docDef = {
      pageOrientation: 'landscape', pageSize: 'A4', content, defaultStyle: { fontSize: 7 },
      styles: { title: { fontSize: 16, bold: true, margin: [0, 0, 0, 10] }, section: { fontSize: 11, bold: true, margin: [0, 8, 0, 4] } },
    };
    return new Promise<Buffer>((resolve, reject) => {
      try {
        const doc = this.printer.createPdfKitDocument(docDef);
        const chunks: Buffer[] = [];
        doc.on('data', (c: Buffer) => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        doc.end();
      } catch (err) { reject(err); }
    });
  }

  // ---- index: docx ----
  private async indexDocx(groups: { label: string; rows: Record<string, any>[] }[], title: string): Promise<Buffer> {
    const children: any[] = [new Paragraph({ text: title, heading: HeadingLevel.HEADING_1 })];
    // Fresh header TableRow per table — docx row instances can't be shared.
    const headerRow = () => new TableRow({
      children: this.INDEX_COLS.map((c) => new TableCell({ children: [new Paragraph({ text: c.header })] })),
    });
    for (const g of groups) {
      children.push(new Paragraph({ text: g.label, heading: HeadingLevel.HEADING_2 }));
      const dataRows = g.rows.map((r) => new TableRow({
        children: this.indexRow(r).map((t) => new TableCell({ children: [new Paragraph({ text: t })] })),
      }));
      children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow(), ...dataRows] }));
      children.push(new Paragraph({ text: '' }));
    }
    const doc = new Document({ sections: [{ children }] });
    return Buffer.from(await Packer.toBuffer(doc));
  }

  // ------------------- Master Index (package-injected, linked) -------------------

  /**
   * The Master Index that ships INSIDE a Download Case Package (plan §10):
   * grouped per section, and each row's Tab/Document cell hyperlinks to the
   * document's RELATIVE path within the package — so opening the index from
   * the extracted folder opens the sibling file, offline, no app needed.
   *
   * `rows` must carry `relPath` (the exact tar entry path for the document,
   * e.g. "C. Witness Statements/statement.pdf"). Rows without relPath render
   * unlinked.
   *
   * xlsx: ONE worksheet per section (Excel tabs "A. …", "B. …").
   * pdf:  per-section tables with clickable link annotations. Relative URI
   *       actions resolve against the PDF's own location in desktop viewers.
   */
  async renderMasterIndex(
    rows: Record<string, any>[],
    format: 'xlsx' | 'pdf',
    title: string,
  ): Promise<RenderedFile> {
    const groups = this.groupBySection(rows);
    const buffer = format === 'xlsx'
      ? await this.masterIndexXlsx(groups)
      : await this.masterIndexPdf(groups, title);
    return { buffer, contentType: MIME[format], ext: format };
  }

  /** Relative link target for a row ('' = no link). Segments are URI-encoded
   *  (spaces etc.) — Excel and PDF viewers decode them when resolving. */
  private relLink(row: Record<string, any>): string {
    const rel = String(row['relPath'] ?? '').trim();
    if (!rel) return '';
    return rel.split('/').map(encodeURIComponent).join('/');
  }

  /** Excel sheet names: <=31 chars, no []:*?/\ and unique per workbook. */
  private sheetName(label: string, used: Set<string>): string {
    let base = label.replace(/[[\]:*?/\\]/g, ' ').trim().slice(0, 31) || 'Section';
    let name = base, i = 2;
    while (used.has(name.toLowerCase())) name = `${base.slice(0, 28)} ${i++}`;
    used.add(name.toLowerCase());
    return name;
  }

  private async masterIndexXlsx(groups: { label: string; rows: Record<string, any>[] }[]): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    const used = new Set<string>();
    for (const g of groups.length ? groups : [{ label: 'Master Index', rows: [] as Record<string, any>[] }]) {
      const ws = wb.addWorksheet(this.sheetName(g.label, used));
      ws.columns = this.INDEX_COLS.map((c, i) => ({ header: c.header, key: 'c' + i, width: i === 2 ? 60 : 16 }));
      ws.getRow(1).font = { bold: true };
      for (const row of g.rows) {
        const added = ws.addRow(this.indexRow(row));
        const link = this.relLink(row);
        if (link) {
          // Link the Tab cell (col 1) AND the Document cell (col 3) — the
          // document name is the natural click target; Tab is what the user
          // asked for. Same relative target on both.
          for (const col of [1, 3]) {
            const cell = added.getCell(col);
            const text = String(cell.value ?? '');
            cell.value = { text, hyperlink: link } as ExcelJS.CellHyperlinkValue;
            cell.font = { color: { argb: 'FF0563C1' }, underline: true };
          }
        }
      }
    }
    return Buffer.from(await wb.xlsx.writeBuffer());
  }

  private masterIndexPdf(groups: { label: string; rows: Record<string, any>[] }[], title: string): Promise<Buffer> {
    const headerCells = this.INDEX_COLS.map((c) => ({ text: c.header, bold: true }));
    const content: any[] = [{ text: title, style: 'title' }];
    for (const g of groups) {
      content.push({ text: g.label, style: 'section' });
      const body = [headerCells, ...g.rows.map((r) => {
        const link = this.relLink(r);
        return this.indexRow(r).map((t, i) =>
          link && (i === 0 || i === 2)
            ? ({ text: t, link, color: '#0563C1', decoration: 'underline' } as any)
            : ({ text: t } as any));
      })];
      content.push({
        table: { headerRows: 1, widths: ['auto', 'auto', '*', 'auto', 'auto', 'auto', 'auto'], body },
        layout: 'lightHorizontalLines', fontSize: 7, margin: [0, 0, 0, 12],
      });
    }
    const docDef = {
      pageOrientation: 'landscape', pageSize: 'A4', content, defaultStyle: { fontSize: 7 },
      styles: { title: { fontSize: 16, bold: true, margin: [0, 0, 0, 10] }, section: { fontSize: 11, bold: true, margin: [0, 8, 0, 4] } },
    };
    return new Promise<Buffer>((resolve, reject) => {
      try {
        const doc = this.printer.createPdfKitDocument(docDef);
        const chunks: Buffer[] = [];
        doc.on('data', (c: Buffer) => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        doc.end();
      } catch (err) { reject(err); }
    });
  }
}
