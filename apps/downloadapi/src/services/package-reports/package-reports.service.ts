import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DbService } from '@app/global/db/pg/db.service';
import { DataExportRenderer, MasterIndexMeta } from '@app/global/utility/data-export/renderers.service';
import { fetchDatasets } from '@app/global/utility/data-export/type-source';
import type { DataExportType, DataExportFormat } from '@app/global/utility/data-export/types';
import { S3Service } from '../s3/s3.service';
import { TransformNameService } from '../transform-name/transform-name.service';
import { filesdetail, ProcessJobDetail } from '../../interfaces/download.interface';

/** Include-flag key -> (export type, output format, filename). */
const REPORT_MAP: Record<string, { cType: DataExportType; format: DataExportFormat; name: string }> = {
  facts: { cType: 'facts', format: 'pdf', name: 'Facts' },
  tags: { cType: 'tags', format: 'xlsx', name: 'Tags' },
  doclinks: { cType: 'doclinks', format: 'xlsx', name: 'DocLinks' },
  // 'evidence' gates evidence-document inclusion (handled in the processor).
  // 'transcripts' + 'meta' are handled specially below (existing files / JSON).
};

/** Case columns kept in Metadata.json (drops presentation/session runtime fields). */
const META_CASE_FIELDS = [
  'nCaseid', 'cCasename', 'cCaseno', 'cClaimant', 'cRespondent',
  'cTClaimant', 'cTRespondent', 'cIndexheader', 'cDesc', 'cTranscriptMode',
] as const;

/** First cursor's rows from an executeRef result (empty on failure). */
function rowsOf(res: any): Record<string, any>[] {
  if (!res?.success) return [];
  const first = res.data?.[0];
  return Array.isArray(first) ? first : [];
}

/**
 * Generates the data reports a Download Case Package asks for (via jInclude) and
 * returns them as `filesdetail` entries pointing at freshly-uploaded objects in
 * the SOURCE bucket — the processor appends these to the package's file set so
 * they flow through the normal batch/tar pipeline (see docs/outputs-feature-plan.md).
 */
@Injectable()
export class PackageReportsService {
  private readonly logger = new Logger(PackageReportsService.name);

  constructor(
    private readonly db: DbService,
    private readonly renderer: DataExportRenderer,
    private readonly s3: S3Service,
    private readonly transformName: TransformNameService,
  ) {}

  /**
   * The Master Index that ships INSIDE the package (plan §10), xlsx + pdf.
   * Built from the package's REAL file list: each doc's link target is
   * `sanitizeDestination(cFilename, foldername)` — the exact tar entry path
   * the writers lay down — so the index's relative hyperlinks open the sibling
   * files from the extracted folder, offline. Index metadata (Tab / Exhibit /
   * section) comes from `bundle_index`; the join by nBundledetailid naturally
   * scopes it to what was actually downloaded (reports/transcripts carry
   * synthetic ids and drop out). Returns [] on any failure — an index must
   * never sink the package.
   */
  async buildMasterIndexFiles(jobDetail: ProcessJobDetail, files: filesdetail[]): Promise<filesdetail[]> {
    const nCaseid = jobDetail?.nCaseid;
    const nSectionid = jobDetail?.nSectionid;
    if (!nCaseid || !nSectionid || !files?.length) return [];
    try {
      const idxRes = await this.db.executeRef('bundle_index', {
        nSectionid, nCaseid, nMasterid: jobDetail.nCreateId ?? '', pageNumber: 1, perPage: 10000, bOutline: false,
      });
      const idxRows = rowsOf(idxRes);

      // Per doc: its exact tar-entry path (for the hyperlink) AND its ROOT
      // bundle — the FIRST segment of the nested `foldername` (sub_info =
      // "Bundle A/A1. …/…"). One Excel sheet per root, no matter how deep the
      // sub-folders go.
      //
      // Hyperlink packages list a document TWICE when it is both a picked doc
      // and someone's link target (main tree + a `…/hyperlink doc/` copy) —
      // the index link must prefer the MAIN copy (plan §Phase C G3), and docs
      // that exist ONLY as linked copies get a fallback row below (G1).
      const isLinkedCopy = (f: filesdetail) => /hyperlink doc\/?\s*$/i.test(String(f?.foldername ?? ''));
      const relByDoc = new Map<string, string>();
      const rootByDoc = new Map<string, string>();
      const hasMainRow = new Set<string>();
      const linkedOnly = new Map<string, filesdetail>();
      for (const f of files) {
        if (!f?.nBundledetailid || !f?.cFilename) continue;
        const id = String(f.nBundledetailid);
        const copy = isLinkedCopy(f);
        if (copy) {
          if (!hasMainRow.has(id)) linkedOnly.set(id, f);
          if (relByDoc.has(id)) continue;            // never shadow a main-tree path
        } else {
          hasMainRow.add(id);
          linkedOnly.delete(id);
        }
        try {
          relByDoc.set(id, this.transformName.sanitizeDestination(f.cFilename, f.foldername));
        } catch { /* unsanitizable name — that doc just renders unlinked */ }
        const root = String(f.foldername ?? '').split('/').map(s => s.trim()).filter(Boolean)[0];
        if (root && (!copy || !rootByDoc.has(id))) rootByDoc.set(id, root);
      }

      const rows: Record<string, any>[] = idxRows
        .filter((r) => relByDoc.has(String(r.nBundledetailid)))
        .map((r) => ({
          ...r,
          relPath: relByDoc.get(String(r.nBundledetailid)),
          rootLabel: rootByDoc.get(String(r.nBundledetailid)) ?? 'Documents',
        }));

      // G1: `bundle_index` only covers the job's own section — linked documents
      // pulled in from OTHER sections would silently drop out of the index.
      // Give them a fallback row built from the package entry itself (filename
      // + extension; no tab/exhibit metadata cross-section — better listed
      // plainly than missing from a 500-document linked bundle).
      const listed = new Set(rows.map((r) => String(r.nBundledetailid)));
      for (const [id, f] of linkedOnly) {
        if (listed.has(id) || !relByDoc.has(id)) continue;
        const name = String(f.cFilename ?? '');
        const dot = name.lastIndexOf('.');
        rows.push({
          nBundledetailid: id,
          cName: dot > 0 ? name.slice(0, dot) : name,
          cFiletype: dot > 0 ? name.slice(dot + 1).toUpperCase() : '',
          relPath: relByDoc.get(id),
          rootLabel: rootByDoc.get(id) ?? 'Linked documents',
        });
      }
      if (!rows.length) return [];

      // Case metadata for the styled index header (eyebrow + case no + title).
      // Best-effort — the header falls back to row-derived values on failure.
      let meta: MasterIndexMeta | undefined;
      try {
        const det = rowsOf(await this.db.executeRef('admin_case_getdetail', { nCaseid, nMasterid: jobDetail.nCreateId ?? '' }))[0] ?? {};
        // NOTE: cIndexheader is NOT used as the heading — it's the legacy
        // multi-line legal cover header ("IN THE MATTER OF…"), which wrecks
        // the index's fixed title line.
        meta = {
          caseName: det.cCasename ?? det.cCaseName,
          caseNo: det.cCaseno ?? det.cCaseNo,
        };
      } catch { /* header just falls back to row-derived values */ }

      const out: filesdetail[] = [];
      // html: the browser-first index — its anchors carry target=_blank so a
      // click opens the document in a NEW tab (the pdf/xlsx variants cannot
      // guarantee that; PDF link-open behavior is the viewer's choice).
      for (const format of ['xlsx', 'pdf', 'html'] as const) {
        const rendered = await this.renderer.renderMasterIndex(rows, format, 'Index of Hearing Bundle Documents', meta);
        const cFilename = `Master_Index.${rendered.ext}`;
        const cPath = `packages/${jobDetail.nDPid}/reports/${cFilename}`;
        await this.s3.putSourceObject(cPath, rendered.buffer, rendered.contentType);
        // foldername '' -> the index sits at the ROOT of the archive, next to
        // the section folders its relative links point into.
        out.push({ nBundledetailid: randomUUID(), cFilename, foldername: '', cBatchType: 'S', cPath });
      }
      this.logger.log(`Prepared Master Index (xlsx+pdf+html, ${rows.length} row(s)) for nDPid=${jobDetail.nDPid}`);
      return out;
    } catch (err: any) {
      this.logger.error(`Failed to build Master Index for nDPid=${jobDetail.nDPid}: ${err?.message}`);
      return [];
    }
  }

  /**
   * Per-source-folder linked-documents index (plan §Phase D2): for every source
   * document that carries `hyperlink doc/` link-target copies, render ONE small
   * index.html placed INSIDE that document's folder (`A2.3/index.html`).
   * Anchors are WITHIN-folder relative (`<source>.pdf`, `hyperlink doc/<x>.pdf`)
   * with target=_blank, so the extracted folder is self-contained and clickable
   * in any browser — independent of PDF-viewer link quirks. Replaces the
   * archive-root Master Index when `jInclude.indexMode === 'folder-html'`
   * (the reader "Export linked Bundle" lane). Returns [] on any failure — an
   * index must never sink the package.
   */
  async buildFolderIndexFiles(jobDetail: ProcessJobDetail, files: filesdetail[]): Promise<filesdetail[]> {
    const nCaseid = jobDetail?.nCaseid;
    if (!nCaseid || !files?.length) return [];
    try {
      // bundle_index metadata (tab/exhibit/name/date) where it resolves; docs
      // outside the job's section fall back to filename-derived rows — the
      // same G1 trade-off the Master Index accepts.
      const idxById = new Map<string, Record<string, any>>();
      if (jobDetail.nSectionid) {
        const idxRes = await this.db.executeRef('bundle_index', {
          nSectionid: jobDetail.nSectionid, nCaseid, nMasterid: jobDetail.nCreateId ?? '', pageNumber: 1, perPage: 10000, bOutline: false,
        });
        for (const r of rowsOf(idxRes)) idxById.set(String(r.nBundledetailid), r);
      }

      // Group by SOURCE folder. The insert SP builds a linked copy's folder as
      // `<source foldername> || 'hyperlink doc/'` verbatim, so a raw suffix
      // strip recovers the source folder for both the jFiles lane ("A2.3/")
      // and the jFolders lane ("Bundle A/A2.3/").
      const LINKED_RE = /hyperlink doc\/?\s*$/i;
      const groups = new Map<string, { source: filesdetail[]; linked: filesdetail[] }>();
      const groupOf = (key: string) => {
        if (!groups.has(key)) groups.set(key, { source: [], linked: [] });
        return groups.get(key)!;
      };
      // A linked row remembers its ACTUAL sub-folder text (the matched
      // "hyperlink doc/" suffix as-written), so the href mirrors the tar entry
      // even if casing/spacing ever diverges from the SP's literal.
      const linkedSub = new Map<filesdetail, string>();
      for (const f of files) {
        if (!f?.cFilename) continue;
        const folder = String(f.foldername ?? '');
        const m = LINKED_RE.exec(folder);
        if (m) {
          linkedSub.set(f, m[0]);
          groupOf(folder.slice(0, m.index)).linked.push(f);
        } else {
          groupOf(folder).source.push(f);
        }
      }

      let meta: MasterIndexMeta | undefined;
      try {
        const det = rowsOf(await this.db.executeRef('admin_case_getdetail', { nCaseid, nMasterid: jobDetail.nCreateId ?? '' }))[0] ?? {};
        const caseNo = det.cCaseno ?? det.cCaseNo;
        meta = {
          caseName: det.cCasename ?? det.cCaseName,
          caseNo,
          // Synthetic root labels ("This document"/"Linked documents") would
          // derive a nonsense "Volumes T–L" — override both derived lines.
          subtitle: caseNo ? `Case ${caseNo}` : '',
          volumes: '',
        };
      } catch { meta = { subtitle: '', volumes: '' }; }

      const out: filesdetail[] = [];
      let seq = 0;
      for (const [folder, g] of groups) {
        if (!g.linked.length) continue; // no linked docs — nothing to index
        const rows: Record<string, any>[] = [];
        const pushRow = (f: filesdetail, relFolder: string, rootLabel: string) => {
          const id = String(f.nBundledetailid ?? '');
          let relPath = '';
          // WITHIN-folder path, sanitized exactly like the tar writers
          // (sanitizeDestination is per-segment, so the sub-path of an entry
          // equals the entry's sub-path — the burned /URI targets rely on the
          // same invariant).
          try { relPath = this.transformName.sanitizeDestination(f.cFilename, relFolder); }
          catch { /* unsanitizable name — listed unlinked */ }
          const idx = id ? idxById.get(id) : undefined;
          if (idx) {
            // Strip the SP's section columns: the renderer sub-groups by them,
            // which under the synthetic "This document"/"Linked documents"
            // roots stamps misleading bundle-section dividers — and rows whose
            // metadata did NOT resolve (cross-section targets) would visually
            // fall under the previous divider, misattributing them.
            const { cFolder, cFoldername, cFolderTag, cFoldertag, cSection, cSectionName, cVolume, cVolumeTag, ...rest } = idx;
            rows.push({ ...rest, relPath, rootLabel });
          } else {
            const name = String(f.cFilename ?? '');
            const dot = name.lastIndexOf('.');
            rows.push({
              nBundledetailid: id || randomUUID(),
              cName: dot > 0 ? name.slice(0, dot) : name,
              cFiletype: dot > 0 ? name.slice(dot + 1).toUpperCase() : '',
              relPath, rootLabel,
            });
          }
        };
        for (const f of g.source) pushRow(f, '', 'This document');
        const seen = new Set<string>();
        for (const f of g.linked) {
          const key = `${f.nBundledetailid}|${f.cFilename}`;
          if (seen.has(key)) continue; // targets are deduped in the SP; belt-and-braces
          seen.add(key);
          pushRow(f, linkedSub.get(f) ?? 'hyperlink doc', 'Linked documents');
        }
        if (!rows.length) continue;

        const rendered = await this.renderer.renderMasterIndex(rows, 'html', 'Index of Linked Documents', meta);
        // Unique staging key per folder; the archive entry itself is always
        // `<source folder>/index.html` (a source PDF named index.html is not a
        // realistic collision — bundle docs are documents, not web assets).
        const cPath = `packages/${jobDetail.nDPid}/reports/folder-index/${++seq}.html`;
        await this.s3.putSourceObject(cPath, rendered.buffer, rendered.contentType);
        out.push({ nBundledetailid: randomUUID(), cFilename: 'index.html', foldername: folder, cBatchType: 'S', cPath });
      }
      this.logger.log(`Prepared ${out.length} per-folder linked-doc index(es) for nDPid=${jobDetail.nDPid}`);
      return out;
    } catch (err: any) {
      this.logger.error(`Failed to build per-folder indexes for nDPid=${jobDetail.nDPid}: ${err?.message}`);
      return [];
    }
  }

  /** Build + upload the selected reports; returns their package file entries. */
  async buildReportFiles(jobDetail: ProcessJobDetail): Promise<filesdetail[]> {
    const includes = jobDetail?.jInclude?.includes ?? [];
    const nCaseid = jobDetail?.nCaseid;
    const nMasterid = jobDetail?.nCreateId ?? '';
    if (!Array.isArray(includes) || !nCaseid) return [];

    const out: filesdetail[] = [];
    for (const key of includes) {
      try {
        if (key === 'transcripts') {
          out.push(...await this.buildTranscriptFiles(nCaseid));
          continue;
        }
        if (key === 'meta') {
          const meta = await this.buildMetadataFile(jobDetail, nMasterid);
          if (meta) out.push(meta);
          continue;
        }
        const spec = REPORT_MAP[key];
        if (!spec) continue;
        // "Include facts and notes" covers the reviewer's Facts AND QFacts. QFact
        // Mode captures are cFacttype 'QF', and the package has no separate QFacts
        // toggle — so a reviewer who worked only in QFact Mode would otherwise get
        // an empty Facts report. Render both as sections of the one Facts file.
        const datasets = key === 'facts'
          ? [
              ...await fetchDatasets(this.db, 'facts', nCaseid, nMasterid),
              ...await fetchDatasets(this.db, 'qfacts', nCaseid, nMasterid),
            ]
          : await fetchDatasets(this.db, spec.cType, nCaseid, nMasterid);
        const rendered = await this.renderer.render(datasets, spec.format, spec.name);
        const cFilename = `${spec.name}.${rendered.ext}`;
        const cPath = `packages/${jobDetail.nDPid}/reports/${cFilename}`;
        await this.s3.putSourceObject(cPath, rendered.buffer, rendered.contentType);
        out.push({ nBundledetailid: randomUUID(), cFilename, foldername: 'Reports', cBatchType: 'S', cPath });
        this.logger.log(`Prepared package report ${cFilename} for nDPid=${jobDetail.nDPid}`);
      } catch (err: any) {
        // A failed extra must not sink the whole package — log + skip it.
        this.logger.error(`Failed to build package extra '${key}' for nDPid=${jobDetail.nDPid}: ${err?.message}`);
      }
    }
    return out;
  }

  /**
   * Published transcript files for the case: the TS-section BundleDetail rows
   * already live in the SOURCE bucket (put there at publish time), so we reuse
   * their existing `cPath` — no rendering, no re-upload. They ride the normal
   * batch/tar pipeline like evidence docs (size is probed downstream). Only the
   * "Include transcript files" toggle reaches here. Draft/unpublished sessions
   * are not bundle files yet and are intentionally out of scope.
   */
  private async buildTranscriptFiles(nCaseid: string): Promise<filesdetail[]> {
    const rows = rowsOf(await this.db.executeRef('realtime_transcriptfiles', { nCaseid }));
    const out: filesdetail[] = [];
    const used = new Set<string>();
    for (const r of rows) {
      const cPath = String(r.cPath ?? '').trim();
      if (!cPath) continue;
      // De-collide filenames within the Transcripts folder (sessions can repeat names).
      let cFilename = String(r.cFilename ?? '').trim() || `${r.nBundledetailid ?? randomUUID()}.pdf`;
      if (used.has(cFilename.toLowerCase())) {
        const dot = cFilename.lastIndexOf('.');
        const stem = dot > 0 ? cFilename.slice(0, dot) : cFilename;
        const ext = dot > 0 ? cFilename.slice(dot) : '';
        cFilename = `${stem}_${used.size}${ext}`;
      }
      used.add(cFilename.toLowerCase());
      // Synthetic id (like reports) so size-writeback never mutates the real row.
      out.push({ nBundledetailid: randomUUID(), cFilename, foldername: 'Transcripts', cBatchType: 'S', cPath });
    }
    this.logger.log(`Prepared ${out.length} transcript file(s) for nCaseid=${nCaseid}`);
    return out;
  }

  /**
   * A small Metadata.json describing the case + what this package includes.
   * Uploaded to the source bucket like the rendered reports. Case fields come
   * from the existing case-detail SP (no raw SQL / column guessing).
   */
  private async buildMetadataFile(jobDetail: ProcessJobDetail, nMasterid: string): Promise<filesdetail | null> {
    const nCaseid = jobDetail.nCaseid;
    const row = rowsOf(await this.db.executeRef('admin_case_getdetail', { nCaseid, nMasterid }))[0] ?? {};
    const caseInfo: Record<string, any> = {};
    for (const f of META_CASE_FIELDS) if (row[f] !== undefined) caseInfo[f] = row[f];

    const metadata = {
      case: caseInfo,
      package: {
        nDPid: jobDetail.nDPid,
        includes: jobDetail?.jInclude?.includes ?? [],
        folders: jobDetail?.jInclude?.folders ?? [],
      },
      generatedAt: new Date().toISOString(),
    };

    const cFilename = 'Metadata.json';
    const cPath = `packages/${jobDetail.nDPid}/reports/${cFilename}`;
    const buffer = Buffer.from(JSON.stringify(metadata, null, 2), 'utf8');
    await this.s3.putSourceObject(cPath, buffer, 'application/json');
    this.logger.log(`Prepared package metadata for nDPid=${jobDetail.nDPid}`);
    return { nBundledetailid: randomUUID(), cFilename, foldername: 'Reports', cBatchType: 'S', cPath };
  }
}
