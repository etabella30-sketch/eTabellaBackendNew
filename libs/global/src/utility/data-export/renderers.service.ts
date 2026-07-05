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

/** Optional case metadata for the Master Index header block (falls back to
 *  row-derived values when omitted). */
export interface MasterIndexMeta {
  caseName?: string;
  caseNo?: string;
  title?: string;
  /** Overrides the derived "Hearing Bundle · Volumes A–F · Case …" line — the
   *  per-folder linked-docs index uses synthetic root labels ("This document"
   *  / "Linked documents") that would derive a nonsense volume range. */
  subtitle?: string;
  /** Overrides the derived volume range ('' suppresses the volumes block). */
  volumes?: string;
}

/** Resolved header values shared by the pdf/html/xlsx Master Index renderers. */
interface MasterIndexHeader {
  eyebrow: string;   // case name (small-caps eyebrow)
  heading: string;   // "Index of Hearing Bundle Documents"
  subtitle: string;  // "Hearing Bundle · Volumes A–F · Case …"
  volumes: string;   // "A–F"
  issued: string;    // "04.07.2026"
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
   * html: same rows as anchors with target="_blank" — the only format where
   *       "open in a new tab" is actually controllable in a browser (PDF has
   *       no such concept; viewers decide). Ships beside the pdf/xlsx.
   */
  async renderMasterIndex(
    rows: Record<string, any>[],
    format: 'xlsx' | 'pdf' | 'html',
    title: string,
    meta?: MasterIndexMeta,
  ): Promise<RenderedFile> {
    // One tab per ROOT bundle (row.rootLabel). Within a root, sub-group by the
    // immediate sub-folder (section) so the structure is still visible as
    // divider rows — but never as extra sheets.
    const roots = this.groupByRoot(rows);
    const hdr = this.indexHeader(rows, roots, title, meta);
    if (format === 'html') {
      return {
        buffer: this.masterIndexHtml(roots, hdr),
        contentType: 'text/html; charset=utf-8',
        ext: 'html',
      };
    }
    const buffer = format === 'xlsx'
      ? await this.masterIndexXlsx(roots, hdr)
      : await this.masterIndexPdf(roots, hdr);
    return { buffer, contentType: MIME[format], ext: format };
  }

  /* ------------------- master-index field + header helpers ------------------- */

  private idxTab(r: Record<string, any>): string { return this.valOf(r, ['cTab', 'cTabno']); }
  private idxExhibit(r: Record<string, any>): string { return this.valOf(r, ['cExhibitno', 'cExhibitNo', 'cExhibit']); }
  private idxTitle(r: Record<string, any>): string { return this.valOf(r, ['cName', 'cFilename', 'cFileName', 'cTitle']); }
  /** Secondary description line (the reference's grey sub-line); '' when absent. */
  private idxDesc(r: Record<string, any>): string { return this.valOf(r, ['cDesc', 'cDescription', 'cRemark', 'cNote', 'cSubtitle']); }
  private idxPages(r: Record<string, any>): string {
    const p = this.valOf(r, ['cPage', 'cPages', 'nPages']);
    return p.replace(/(\d)\s*-\s*(\d)/, '$1–$2'); // hyphen range -> en-dash
  }
  private idxDate(r: Record<string, any>): string {
    const raw = this.valOf(r, ['cDate', 'dDate', 'jDate', 'dDocdate', 'dDocDate']);
    return this.fmtDMY(raw);
  }

  /** A date-ish string -> "DD.MM.YYYY"; passes through non-dates, '' for empty. */
  private fmtDMY(raw: string): string {
    const s = String(raw ?? '').trim();
    if (!s || s === '—' || s === '-') return '';
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    const p = (n: number) => String(n).padStart(2, '0');
    return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
  }

  /** Volume range across the roots, e.g. "A–F" (or "A" for one). */
  private deriveVolumes(roots: { label: string }[]): string {
    const letters = roots
      .map((r) => (String(r.label).match(/^\s*([A-Za-z0-9]+)/)?.[1] ?? '').toUpperCase())
      .filter(Boolean);
    const uniq = [...new Set(letters)];
    if (!uniq.length) return '';
    return uniq.length > 1 ? `${uniq[0]}–${uniq[uniq.length - 1]}` : uniq[0];
  }

  /** Split "A. Procedural Documents - Key Documents" -> { letter:'A', name:'Procedural…' }.
   *  The separator is REQUIRED: a plain multi-word label ("Bundle A", "This
   *  document", "Linked documents") is a name, not a tag + name — treating the
   *  first word as a volume tag typeset it in the blue tag style. */
  private splitSection(label: string): { letter: string; name: string } {
    const m = String(label).match(/^\s*([A-Za-z0-9]+)\s*[.\-–)]+\s*(.*)$/);
    if (m && m[2]) return { letter: m[1], name: m[2].trim() };
    return { letter: '', name: String(label).trim() };
  }

  /** Assemble the styled index header block shared by all three formats. */
  private indexHeader(
    rows: Record<string, any>[],
    roots: { label: string }[],
    title: string,
    meta?: MasterIndexMeta,
  ): MasterIndexHeader {
    const first = rows[0] ?? {};
    const caseName = (meta?.caseName || this.valOf(first, ['cCasename', 'cCaseName']) || '').trim();
    const caseNo = (meta?.caseNo || this.valOf(first, ['cCaseno', 'cCaseNo']) || '').trim();
    const heading = (meta?.title || title || 'Index of Hearing Bundle Documents').trim();
    const volumes = meta?.volumes !== undefined ? meta.volumes : this.deriveVolumes(roots);
    const subtitle = meta?.subtitle !== undefined
      ? meta.subtitle
      : ['Hearing Bundle', volumes ? `Volumes ${volumes}` : '', caseNo ? `Case ${caseNo}` : '']
        .filter(Boolean).join('  ·  ');
    return { eyebrow: caseName, heading, subtitle, volumes, issued: this.fmtDMY(new Date().toISOString()) };
  }

  /** Group by root bundle (row.rootLabel), first-seen order; inside each root,
   *  sub-group by section for divider rows. */
  private groupByRoot(rows: Record<string, any>[]): {
    label: string; sections: { label: string; rows: Record<string, any>[] }[];
  }[] {
    const map = new Map<string, Record<string, any>[]>();
    for (const row of rows) {
      const label = String(row['rootLabel'] ?? '').trim() || this.sectionLabel(row);
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(row);
    }
    return [...map.entries()].map(([label, rs]) => ({ label, sections: this.groupBySectionMaster(rs) }));
  }

  /** Master-index sub-grouping: like groupBySection but yields a BLANK label
   *  when a doc has no real sub-folder (so the renderers skip the sub-header
   *  instead of stamping a redundant "Documents" divider under every root). */
  private groupBySectionMaster(rows: Record<string, any>[]): { label: string; rows: Record<string, any>[] }[] {
    const map = new Map<string, Record<string, any>[]>();
    for (const row of rows) {
      const tag = this.valOf(row, ['cFolderTag', 'cFoldertag', 'cSection', 'cVolumeTag']);
      const name = this.valOf(row, ['cFolder', 'cFoldername', 'cVolume', 'cSectionName']);
      // The SP's cFolder usually ALREADY carries the tag prefix ("B. Pleadings",
      // tag "B") — prepending again would render "B. B. Pleadings".
      const prefixed = tag && name.toLowerCase().startsWith(tag.toLowerCase())
        && /^[\s.)\-–]/.test(name.slice(tag.length));
      const label = tag && name && !prefixed ? `${tag}. ${name}` : (name || tag || '');
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(row);
    }
    return [...map.entries()].map(([label, rs]) => ({ label, rows: rs }));
  }

  /** True when a sub-folder label is just the root's own label again — the SP
   *  labels and the archive folder names can differ by sanitization only, so
   *  compare with the tag prefix + punctuation stripped. */
  private sameSectionLabel(a: string, b: string): boolean {
    const norm = (s: string) => String(s)
      .replace(/^\s*[A-Za-z0-9]{1,6}\s*[.)\-–]\s*/, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    return norm(a) === norm(b);
  }

  /**
   * URL-encoded relative link target — for the HTML index only. A browser
   * <a href> is a URL: it percent-decodes `%20` back to a space and resolves
   * it, so encoding is correct (and required for chars like `#`/`?` that are
   * URL-special). '' = no link.
   */
  private relLink(row: Record<string, any>): string {
    const rel = String(row['relPath'] ?? '').trim();
    if (!rel) return '';
    return rel.split('/').map(encodeURIComponent).join('/');
  }

  /**
   * RAW relative link target — for the PDF and Excel indexes. These are FILE
   * specs (PDF `/Launch /F`, Excel local hyperlink), NOT URLs: the viewer does
   * NOT percent-decode them, so a URL-encoded value makes it look for a file
   * literally named "…%20…" → "file not found". Must be the exact archive path
   * (real spaces/apostrophes, forward slashes) so it equals the extracted file.
   */
  private relRaw(row: Record<string, any>): string {
    return String(row['relPath'] ?? '').trim();
  }

  private async masterIndexXlsx(
    roots: { label: string; sections: { label: string; rows: Record<string, any>[] }[] }[],
    hdr: MasterIndexHeader,
  ): Promise<Buffer> {
    const NAVY = 'FF12305F', BLUE = 'FF2F6BFF', GREY = 'FF6B7688', INK = 'FF1A2436', DOT = 'FFDDE4EF';
    const SERIF = 'Georgia', SANS = 'Arial', MONO = 'Consolas';
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Master Index', { views: [{ showGridLines: false }] });
    ws.columns = [{ width: 10 }, { width: 12 }, { width: 68 }, { width: 15 }, { width: 10 }];

    let ri = 1;
    const mergeRow = (value: any, font: any, height?: number, align?: any) => {
      ws.mergeCells(ri, 1, ri, 5);
      const c = ws.getCell(ri, 1);
      c.value = value; c.font = font;
      c.alignment = { vertical: 'middle', ...(align || {}) };
      if (height) ws.getRow(ri).height = height;
      ri++;
    };

    // ---- header block ----
    if (hdr.eyebrow) mergeRow(hdr.eyebrow.toUpperCase(), { name: SANS, size: 9, bold: true, color: { argb: GREY } });
    mergeRow(hdr.heading, { name: SERIF, size: 20, bold: true, color: { argb: NAVY } }, 28);
    if (hdr.subtitle) mergeRow(hdr.subtitle, { name: SANS, size: 10, color: { argb: GREY } });
    if (hdr.volumes || hdr.issued) {
      const bits = [hdr.volumes ? `Volumes ${hdr.volumes}` : '', hdr.issued ? `issued ${hdr.issued}` : ''].filter(Boolean);
      mergeRow(bits.join('  ·  '), { name: MONO, size: 9, color: { argb: GREY } });
    }
    ri++; // spacer row

    // ---- column header ----
    const heads = ['TAB', 'EXHIBIT', 'DOCUMENT & DESCRIPTION', 'DATE', 'PAGES'];
    const hrow = ws.getRow(ri);
    heads.forEach((h, i) => {
      const c = hrow.getCell(i + 1);
      c.value = h;
      c.font = { name: SANS, size: 9, bold: true, color: { argb: GREY } };
      c.alignment = { vertical: 'middle', horizontal: i === 4 ? 'right' : 'left' };
      c.border = { bottom: { style: 'medium', color: { argb: NAVY } } };
    });
    hrow.height = 20; ri++;

    const sectionRow = (label: string, big: boolean) => {
      const { letter, name } = this.splitSection(label);
      ws.mergeCells(ri, 1, ri, 5);
      const c = ws.getCell(ri, 1);
      c.value = {
        richText: [
          ...(letter ? [{ font: { name: SANS, bold: true, size: big ? 11 : 10, color: { argb: BLUE } }, text: `${letter}    ` }] : []),
          { font: { name: SERIF, bold: true, size: big ? 13 : 11, color: { argb: NAVY } }, text: name },
        ],
      };
      c.alignment = { vertical: 'middle' };
      ws.getRow(ri).height = big ? 24 : 20;
      for (let k = 1; k <= 5; k++) ws.getCell(ri, k).border = { bottom: { style: big ? 'medium' : 'thin', color: { argb: NAVY } } };
      ri++;
    };

    const list = roots.length ? roots : [{ label: 'Master Index', sections: [] as { label: string; rows: Record<string, any>[] }[] }];
    for (const root of list) {
      sectionRow(root.label, true);
      for (const sec of root.sections) {
        if (sec.label && !this.sameSectionLabel(sec.label, root.label)) sectionRow(sec.label, false);
        for (const r of sec.rows) {
          const link = this.relRaw(r); // Excel local hyperlink = literal path (not URL-decoded)
          const desc = this.idxDesc(r);
          const row = ws.getRow(ri);

          const tab = row.getCell(1);
          tab.value = link ? { text: this.idxTab(r) || '—', hyperlink: link } as ExcelJS.CellHyperlinkValue : (this.idxTab(r) || '—');
          tab.font = { name: MONO, size: 11, bold: true, color: { argb: BLUE } };
          tab.alignment = { vertical: 'top' };

          const ex = row.getCell(2);
          ex.value = this.idxExhibit(r) || '—';
          ex.font = { name: MONO, size: 10, color: { argb: GREY } };
          ex.alignment = { vertical: 'top' };

          const doc = row.getCell(3);
          doc.value = {
            richText: [
              { font: { name: SERIF, size: 11, color: { argb: INK } }, text: this.idxTitle(r) || '—' },
              ...(desc ? [{ font: { name: SANS, size: 9, color: { argb: GREY } }, text: `\n${desc}` }] : []),
            ],
          };
          doc.alignment = { vertical: 'top', wrapText: true };

          const dt = row.getCell(4);
          dt.value = this.idxDate(r) || '—';
          dt.font = { name: MONO, size: 10, color: { argb: GREY } };
          dt.alignment = { vertical: 'top' };

          const pg = row.getCell(5);
          pg.value = link ? { text: this.idxPages(r) || '—', hyperlink: link } as ExcelJS.CellHyperlinkValue : (this.idxPages(r) || '—');
          pg.font = { name: MONO, size: 10, color: { argb: BLUE } };
          pg.alignment = { vertical: 'top', horizontal: 'right' };

          for (let k = 1; k <= 5; k++) row.getCell(k).border = { bottom: { style: 'hair', color: { argb: DOT } } };
          if (desc) row.height = 30;
          ri++;
        }
      }
    }
    return Buffer.from(await wb.xlsx.writeBuffer());
  }

  /**
   * Standalone HTML Master Index — the browser-first variant. Anchors carry
   * `target="_blank" rel="noopener"` so clicking opens the document in a NEW
   * tab and the index stays put (impossible to guarantee from a PDF: link-open
   * behavior there is the viewer's choice). Hrefs are the same RELATIVE
   * archive paths as the pdf/xlsx links, so the file works from the extracted
   * folder wherever it is moved as a whole.
   */
  private masterIndexHtml(
    roots: { label: string; sections: { label: string; rows: Record<string, any>[] }[] }[],
    hdr: MasterIndexHeader,
  ): Buffer {
    const esc = (s: string) => String(s ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

    const bodyRows: string[] = [];
    for (const root of roots) {
      const { letter, name } = this.splitSection(root.label);
      bodyRows.push(
        `<tr class="sec"><td colspan="5">` +
        (letter ? `<span class="sec-l">${esc(letter)}</span>` : '') +
        `<span class="sec-n">${esc(name)}</span></td></tr>`,
      );
      for (const sec of root.sections) {
        if (sec.label && !this.sameSectionLabel(sec.label, root.label)) {
          const s = this.splitSection(sec.label);
          bodyRows.push(
            `<tr class="sub"><td colspan="5">` +
            (s.letter ? `<span class="sub-l">${esc(s.letter)}</span>` : '') +
            `<span class="sub-n">${esc(s.name)}</span></td></tr>`,
          );
        }
        for (const r of sec.rows) {
          const link = this.relLink(r);
          const tab = esc(this.idxTab(r)) || '—';
          const ex = esc(this.idxExhibit(r)) || '—';
          const title = esc(this.idxTitle(r)) || '—';
          const desc = esc(this.idxDesc(r));
          const date = esc(this.idxDate(r)) || '—';
          const pages = esc(this.idxPages(r)) || '—';
          const tabCell = link ? `<a href="${esc(link)}" target="_blank" rel="noopener">${tab}</a>` : tab;
          const titleLink = link ? `<a href="${esc(link)}" target="_blank" rel="noopener">${title}</a>` : title;
          const pagesCell = link ? `<a href="${esc(link)}" target="_blank" rel="noopener">${pages}</a>` : pages;
          bodyRows.push(
            `<tr>` +
            `<td class="tab">${tabCell}</td>` +
            `<td class="ex">${ex}</td>` +
            `<td class="doc"><div class="doc-t">${titleLink}</div>${desc ? `<div class="doc-d">${desc}</div>` : ''}</td>` +
            `<td class="date">${date}</td>` +
            `<td class="pages">${pagesCell}</td>` +
            `</tr>`,
          );
        }
      }
    }

    const volBlock = hdr.volumes
      ? `<div class="vol"><div class="vol-l">Volumes</div><div class="vol-r">${esc(hdr.volumes)}</div>` +
        (hdr.issued ? `<div class="vol-d">issued ${esc(hdr.issued)}</div>` : '') + `</div>`
      : '';

    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(hdr.heading)}</title>
<style>
  :root { --navy:#12305f; --blue:#2f6bff; --ink:#1a2436; --grey:#6b7688; --line:#c9d3e2; --dot:#dde4ef; }
  * { box-sizing: border-box; }
  body { font: 15px/1.55 Georgia, 'Times New Roman', serif; color: var(--ink); margin: 0; background:#fff; }
  .page { max-width: 920px; margin: 0 auto; padding: 48px 40px 64px; }
  .head { display:flex; justify-content:space-between; align-items:flex-start; gap:24px; }
  .eyebrow { font-family: Arial, 'Segoe UI', sans-serif; font-size:11px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; color:var(--grey); }
  h1 { font-family: Georgia, 'Times New Roman', serif; font-size:31px; line-height:1.15; color:var(--navy); font-weight:700; margin:10px 0 6px; }
  .sub { font-family: Arial, 'Segoe UI', sans-serif; font-size:12.5px; color:var(--grey); }
  .vol { text-align:right; white-space:nowrap; flex-shrink:0; }
  .vol-l { font-family:Arial,sans-serif; font-size:10px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; color:var(--grey); }
  .vol-r { font-family:Georgia,serif; font-size:36px; line-height:1; color:var(--navy); font-weight:700; margin:2px 0 4px; }
  .vol-d { font-family:'SFMono-Regular','Consolas','Courier New',monospace; font-size:11px; color:var(--grey); }
  .rule { border:0; border-top:2px solid var(--navy); margin:18px 0 0; }
  table { border-collapse:collapse; width:100%; margin-top:2px; table-layout:fixed; }
  col.c-tab{width:64px;} col.c-ex{width:78px;} col.c-date{width:104px;} col.c-pg{width:70px;}
  thead th { font-family:Arial,'Segoe UI',sans-serif; font-size:10px; font-weight:700; letter-spacing:.11em; text-transform:uppercase; color:var(--grey); text-align:left; padding:14px 10px 9px; border-bottom:2px solid var(--navy); }
  th.r, td.pages { text-align:right; }
  tbody td { padding:13px 10px; border-bottom:1px dotted var(--dot); vertical-align:top; word-wrap:break-word; }
  tr.sec td { padding:26px 10px 9px; border-bottom:1.5px solid var(--navy); }
  .sec-l { font-family:Arial,sans-serif; font-weight:700; font-size:13px; color:var(--blue); margin-right:12px; }
  .sec-n { font-family:Georgia,serif; font-weight:700; font-size:18px; color:var(--navy); }
  tr.sub td { padding:16px 10px 7px; border-bottom:1px solid var(--line); }
  .sub-l { font-family:Arial,sans-serif; font-weight:700; font-size:11px; color:var(--blue); margin-right:10px; }
  .sub-n { font-family:Georgia,serif; font-weight:700; font-size:14px; color:var(--ink); }
  td.tab a, td.tab { font-family:'SFMono-Regular','Consolas','Courier New',monospace; font-weight:700; font-size:13px; color:var(--blue); text-decoration:none; }
  td.ex { font-family:'SFMono-Regular','Consolas','Courier New',monospace; font-size:12px; color:var(--grey); }
  .doc-t { font-size:14.5px; color:var(--ink); }
  .doc-t a { color:var(--blue); text-decoration:none; }
  .doc-t a:hover { text-decoration:underline; }
  .doc-d { font-family:Arial,'Segoe UI',sans-serif; font-size:12px; color:var(--grey); margin-top:3px; }
  td.date { font-family:'SFMono-Regular','Consolas','Courier New',monospace; font-size:12px; color:var(--grey); }
  td.pages a, td.pages { font-family:'SFMono-Regular','Consolas','Courier New',monospace; font-size:12px; color:var(--blue); text-decoration:none; }
  .foot { margin-top:26px; font-family:Arial,'Segoe UI',sans-serif; font-size:11px; color:var(--grey); }
</style>
</head>
<body>
<div class="page">
  <div class="head">
    <div>
      ${hdr.eyebrow ? `<div class="eyebrow">${esc(hdr.eyebrow)}</div>` : ''}
      <h1>${esc(hdr.heading)}</h1>
      ${hdr.subtitle ? `<div class="sub">${esc(hdr.subtitle)}</div>` : ''}
    </div>
    ${volBlock}
  </div>
  <hr class="rule">
  <table>
    <colgroup><col class="c-tab"><col class="c-ex"><col><col class="c-date"><col class="c-pg"></colgroup>
    <thead><tr>
      <th>Tab</th><th>Exhibit</th><th>Document &amp; Description</th><th>Date</th><th class="r">Pages</th>
    </tr></thead>
    <tbody>
${bodyRows.join('\n')}
    </tbody>
  </table>
  <p class="foot">Links open each document in a new tab. Keep this file inside the extracted package folder — targets are referenced relative to it.</p>
</div>
</body>
</html>
`;
    return Buffer.from(html, 'utf8');
  }

  private masterIndexPdf(
    roots: { label: string; sections: { label: string; rows: Record<string, any>[] }[] }[],
    hdr: MasterIndexHeader,
  ): Promise<Buffer> {
    const NAVY = '#12305f', BLUE = '#2f6bff', GREY = '#6b7688', INK = '#1a2436', DOT = '#dde4ef';
    // pdfMake link cell — /URI action carrying the RAW relative path (viewers do
    // not percent-decode a file path). '' link -> plain text (no empty action).
    const linked = (text: string, link: string, extra: any = {}) =>
      link ? { text, link, ...extra } : { text, ...extra };

    // ---- header block ----
    const left: any[] = [];
    if (hdr.eyebrow) left.push({ text: hdr.eyebrow.toUpperCase(), style: 'eyebrow' });
    left.push({ text: hdr.heading, style: 'h1' });
    if (hdr.subtitle) left.push({ text: hdr.subtitle, style: 'sub' });
    const right: any[] = [];
    if (hdr.volumes) {
      right.push({ text: 'VOLUMES', style: 'volL', alignment: 'right' });
      right.push({ text: hdr.volumes, style: 'volR', alignment: 'right' });
      if (hdr.issued) right.push({ text: `issued ${hdr.issued}`, style: 'volD', alignment: 'right' });
    }

    // ---- one continuous table: header row, section rows, doc rows ----
    const th = (t: string, align: 'left' | 'right' = 'left') => ({ text: t.toUpperCase(), style: 'th', alignment: align });
    const body: any[][] = [[th('Tab'), th('Exhibit'), th('Document & Description'), th('Date'), th('Pages', 'right')]];
    const solidLines = new Set<number>(); // line indices that get a solid (not dotted) rule
    solidLines.add(1); // under the column header

    const pushSection = (label: string, big: boolean) => {
      const { letter, name } = this.splitSection(label);
      body.push([{
        colSpan: 5,
        text: [
          letter ? { text: `${letter}    `, color: BLUE, bold: true, fontSize: big ? 11 : 9 } : '',
          { text: name, color: NAVY, bold: true, fontSize: big ? 13 : 10.5 },
        ],
        margin: [0, big ? 10 : 5, 0, big ? 4 : 2],
      }, {}, {}, {}, {}]);
      solidLines.add(body.length); // bottom rule of this section row = solid
    };

    for (const root of roots) {
      pushSection(root.label, true);
      for (const sec of root.sections) {
        if (sec.label && !this.sameSectionLabel(sec.label, root.label)) pushSection(sec.label, false);
        for (const r of sec.rows) {
          const link = this.relRaw(r);
          const title = this.idxTitle(r) || '—';
          const desc = this.idxDesc(r);
          const docStack: any[] = [linked(title, link, { color: link ? BLUE : INK, fontSize: 9 })];
          if (desc) docStack.push({ text: desc, color: GREY, fontSize: 7.5, margin: [0, 1.5, 0, 0] });
          body.push([
            linked(this.idxTab(r) || '—', link, { color: link ? BLUE : GREY, bold: true, style: 'mono' }),
            { text: this.idxExhibit(r) || '—', color: GREY, style: 'mono' },
            { stack: docStack },
            { text: this.idxDate(r) || '—', color: GREY, style: 'mono' },
            linked(this.idxPages(r) || '—', link, { color: link ? BLUE : GREY, style: 'mono', alignment: 'right' }),
          ]);
        }
      }
    }

    const content: any[] = [
      { columns: [{ stack: left, width: '*' }, { stack: right, width: 'auto' }], columnGap: 18 },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.5, lineColor: NAVY }], margin: [0, 12, 0, 6] },
      {
        table: { headerRows: 1, widths: [34, 52, '*', 66, 40], body },
        layout: {
          hLineWidth: (i: number) => (i === 0 ? 0 : solidLines.has(i) ? 1 : 0.5),
          hLineColor: (i: number) => (solidLines.has(i) ? NAVY : DOT),
          hLineStyle: (i: number) => (solidLines.has(i) ? null : { dash: { length: 1, space: 2 } }),
          vLineWidth: () => 0,
          paddingLeft: () => 7, paddingRight: () => 7, paddingTop: () => 7, paddingBottom: () => 7,
        },
      },
      { text: 'Links open each document in a new tab from Master_Index.html. In a browser PDF viewer, Ctrl+click (Cmd+click on Mac) to open a link in a new tab.', style: 'foot', margin: [0, 16, 0, 0] },
    ];

    const docDef = {
      pageSize: 'A4', pageMargins: [40, 44, 40, 50], content,
      defaultStyle: { fontSize: 9, color: INK, lineHeight: 1.15 },
      styles: {
        eyebrow: { fontSize: 8, bold: true, color: GREY, characterSpacing: 1.4 },
        h1: { fontSize: 22, bold: true, color: NAVY, margin: [0, 6, 0, 3] },
        sub: { fontSize: 9.5, color: GREY },
        volL: { fontSize: 7.5, bold: true, color: GREY, characterSpacing: 1.4 },
        volR: { fontSize: 26, bold: true, color: NAVY, margin: [0, 1, 0, 2] },
        volD: { fontSize: 8, color: GREY, style: 'mono' },
        th: { fontSize: 7.5, bold: true, color: GREY, characterSpacing: 0.8 },
        mono: { fontSize: 8.5 },
        foot: { fontSize: 8, italics: true, color: GREY },
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
}
// NOTE: an earlier version post-processed the index PDF to rewrite links to
// GoToR + /NewWindow (new window in Acrobat). Reverted: Chrome's built-in PDF
// viewer BLOCKS GoToR/Launch to local files, so a click did nothing. pdfMake's
// default /URI action (with the raw relative path from relRaw) is the most
// compatible — Chrome and Acrobat both follow it. New-tab from a PDF is not
// possible in a browser; Master_Index.html (target="_blank") is that path.
