import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn } from 'child_process';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';
import { DbService } from '@app/global/db/pg/db.service';
import { S3Service } from '../s3/s3.service';
import { filesdetail, ProcessJobDetail } from '../../interfaces/download.interface';

/** A per-document row from `export_get_data_1` — carries the burn geometry. */
interface ExportDataRow {
  nBundledetailid?: string;
  nEDid?: string | number;
  cPath?: string;
  bPagination?: boolean;
  cOrientation?: string;
  /** Mark geometry in the exact shape exportfile.py consumes. */
  highlights?: any[];
}

/**
 * Burns the package creator's marks (Facts / QFacts / DocLinks) INTO each
 * evidence PDF, reusing the annotated-PDF export lane end-to-end:
 *   export_insert_data_1  → a transient export request (no pipeline side effects)
 *   export_get_data_1     → the real per-doc `highlights[]` geometry (same SP the
 *                           working Annotated-PDF lane feeds to python)
 *   export_delete_file    → drop the transient export immediately
 * then the same PyMuPDF burner (`exportfile.py`, config `PY_EXPEDIT`) writes the
 * annotated copy, which is uploaded to the source bucket and swapped into the
 * package file's `cPath` in-memory (no DB writeback — mirrors PackageReportsService).
 *
 * Reusing the proven SP pair avoids hand-authoring geometry SQL. The transient
 * export exists only for the insert→get→delete round-trip (before the slow burns),
 * so it never lingers in the user's export list.
 */
@Injectable()
export class AnnotateEvidenceService {
  private readonly logger = new Logger(AnnotateEvidenceService.name);

  private readonly pythonV = this.config.get<string>('pythonV');
  private readonly editScript = this.config.get<string>('PY_EXPEDIT');
  private readonly rootPath = this.config.get<string>('ROOT_PATH') ?? './';
  private readonly assets = this.config.get<string>('ASSETS') ?? './assets/';

  /** Cap concurrent burns — each spawns PyMuPDF over a whole PDF. */
  private readonly CONCURRENCY = 4;

  constructor(
    private readonly db: DbService,
    private readonly s3: S3Service,
    private readonly config: ConfigService,
  ) {}

  /** The burn stage can only run when python + the export script are configured. */
  private isConfigured(): boolean {
    return !!(String(this.pythonV ?? '').trim() && String(this.editScript ?? '').trim());
  }

  /**
   * Annotate the evidence PDFs in `files` in place. Which mark kinds burn is
   * derived from the sibling content flags — 'facts' → Facts+QFacts, 'doclinks'
   * → DocLinks — so the checkbox the reviewer already ticked drives it. Marks are
   * owner-scoped to the package creator (`nCreateId`). A per-doc failure logs and
   * leaves the original document untouched: an annotation must never sink the
   * package.
   */
  async annotateEvidence(jobDetail: ProcessJobDetail, files: filesdetail[]): Promise<void> {
    const includes = jobDetail?.jInclude?.includes ?? [];
    const nCaseid = jobDetail?.nCaseid;
    const nMasterid = jobDetail?.nCreateId ?? '';
    if (!Array.isArray(includes) || !nCaseid) return;

    // "Annotate evidence PDFs (burn in marks)" is its own concern: burn the
    // creator's marks INTO the PDFs. The 'facts'/'doclinks' include-flags control
    // whether separate REPORT files ride along — orthogonal. If the reviewer
    // ticked Annotate but neither report kind, burn BOTH mark kinds rather than
    // silently doing nothing (the old early-return made Annotate look broken
    // unless you also happened to include facts or doclinks). An explicit report
    // choice is still honoured (facts-only → burn facts only).
    let bFact = includes.includes('facts');
    let bDoc = includes.includes('doclinks');
    if (!bFact && !bDoc) { bFact = true; bDoc = true; }
    if (!this.isConfigured()) {
      this.logger.warn(`Annotate on but python/PY_EXPEDIT not configured — evidence left un-annotated for nDPid=${jobDetail.nDPid}`);
      return;
    }
    if (!nMasterid) {
      this.logger.warn(`Annotate on but package has no creator id — cannot scope marks, skipping for nDPid=${jobDetail.nDPid}`);
      return;
    }

    // Evidence PDFs only: reports/index are appended after this step, and images
    // can't carry PDF annotations.
    const pdfs = files.filter(f => f.nBundledetailid && /\.pdf$/i.test(f.cFilename ?? ''));
    if (!pdfs.length) return;

    // Pull the burn geometry through the proven export SP pair, then drop the
    // transient export right away (before the slow burns) so it never surfaces
    // in the user's export list.
    let rows: ExportDataRow[] = [];
    let nExportid: string | number | undefined;
    try {
      nExportid = await this.insertTransientExport(nCaseid, nMasterid, pdfs.map(f => f.nBundledetailid), bFact, bDoc);
      if (nExportid === undefined || nExportid === null) {
        this.logger.warn(`export_insert_data_1 returned no id for nDPid=${jobDetail.nDPid} — evidence left un-annotated`);
        return;
      }
      rows = await this.getExportRows(nExportid, nMasterid);
    } catch (err: any) {
      this.logger.error(`Failed to resolve mark geometry for nDPid=${jobDetail.nDPid}: ${err?.message}`);
      return;
    } finally {
      if (nExportid !== undefined && nExportid !== null) {
        // Best-effort — a lingering transient export is cosmetic, never fatal.
        try { await this.deleteTransientExport(nCaseid, nExportid, nMasterid); }
        catch (err: any) { this.logger.warn(`Failed to delete transient export ${nExportid}: ${err?.message}`); }
      }
    }

    const byId = new Map(pdfs.map(f => [f.nBundledetailid, f]));
    const jobs = rows.filter(r => r?.nBundledetailid && byId.has(String(r.nBundledetailid))
      && Array.isArray(r.highlights) && r.highlights.length);
    if (!jobs.length) {
      this.logger.log(`No marked evidence docs to annotate for nDPid=${jobDetail.nDPid}`);
      return;
    }
    this.logger.log(`Annotating ${jobs.length} evidence doc(s) for nDPid=${jobDetail.nDPid}`);

    for (let i = 0; i < jobs.length; i += this.CONCURRENCY) {
      const slice = jobs.slice(i, i + this.CONCURRENCY);
      await Promise.all(slice.map(r => this.burnAndSwap(jobDetail, r, byId.get(String(r.nBundledetailid))!)));
    }
  }

  /**
   * Insert a transient annotated-export request (no pipeline is started — that's
   * a separate call), returning its nExportid. Field defaults mirror the legacy
   * `ExportFilewithAnnot` contract; bQfact tracks bFact ("facts and notes" covers
   * Facts + QFacts). cPdftype 'M' = per-document (we burn each doc, never merge).
   */
  private async insertTransientExport(
    nCaseid: string, nMasterid: string, jFiles: string[], bFact: boolean, bDoc: boolean,
  ): Promise<string | number | undefined> {
    const res = await this.db.executeRef('export_insert_data_1', {
      nCaseid, nMasterid,
      jFiles,
      cPdftype: 'M',
      bPagination: false,
      bDoc, bFact, bQfact: bFact,
      bCoverpg: false, bFitpg: false,
      cDsize: 'N', cFsize: 'N', cQFsize: 'N',
      cOrientation: 'A', cPgsize: 'A4', cTranscript: 'N',
      jFContact: [], jFIssue: [], jQFContact: [], jQFIssue: [], jPages: [],
    });
    if (!res?.success) return undefined;
    return res.data?.[0]?.[0]?.nExportid;
  }

  /** Fetch the per-document burn geometry for a transient export (owner-scoped). */
  private async getExportRows(nExportid: string | number, nMasterid: string): Promise<ExportDataRow[]> {
    const res = await this.db.executeRef('export_get_data_1', { nExportid, nMasterid });
    if (!res?.success) return [];
    const rows = res.data?.[0];
    return Array.isArray(rows) ? (rows as ExportDataRow[]) : [];
  }

  /**
   * Drop the transient export (master + ALL details). Two gotchas, both required:
   *  - `cType` is the delete-SP's MODE selector (NOT the export's cPdftype):
   *    et_export_delete_file deletes the whole ExportMaster+ExportDetail only for
   *    cType='S'; any other value deletes a single detail by nEDid.
   *  - `nMasterid` MUST be supplied. The SP now authorizes the delete via
   *    et_is_case_member(caseId, nMasterid); with no nMasterid (this service calls
   *    the DB directly, so no JWT middleware injects it) the guard fails and the
   *    delete is a silent no-op — the transient then lingers forever as a phantom
   *    "Processing" annotated-PDF row in the Outputs list. Pass the creator's id.
   */
  private async deleteTransientExport(nCaseid: string, nExportid: string | number, nMasterid: string): Promise<void> {
    await this.db.executeRef('export_delete_file', { nCaseid, nExportid, nMasterid, nEDid: '', cType: 'S' });
  }

  private async burnAndSwap(jobDetail: ProcessJobDetail, row: ExportDataRow, file: filesdetail): Promise<void> {
    const nEDid = String(row.nEDid ?? row.nBundledetailid);   // temp folder ed<id>
    const outDir = join(this.rootPath, 'assets', 'export', `ed${nEDid}`);
    const outFile = join(outDir, 'new_pdf.pdf');              // exportfile.py's fixed output name
    try {
      mkdirSync(outDir, { recursive: true });
      const ok = await this.runBurn({
        // row.cPath is the source PDF the geometry was computed against (matches
        // the proven export lane); fall back to the package file's current path.
        cPath: row.cPath ?? file.cPath,
        nEDid,
        bPagination: false,
        cOrientation: row.cOrientation ?? 'A',
        highlights: row.highlights,
      });
      if (!ok || !existsSync(outFile)) {
        this.logger.warn(`Burn produced no output for ${file.cFilename} (${row.nBundledetailid}) — keeping original`);
        return;
      }
      const key = `packages/${jobDetail.nDPid}/annotated/${row.nBundledetailid}.pdf`;
      await this.s3.putSourceObject(key, readFileSync(outFile), 'application/pdf');
      file.cPath = key;                                        // in-memory swap → tar stage streams this key
      this.logger.log(`Annotated ${file.cFilename} → ${key}`);
    } catch (err: any) {
      this.logger.error(`Failed to annotate ${file.cFilename} (${row.nBundledetailid}): ${err?.message} — keeping original`);
    } finally {
      try { rmSync(outDir, { recursive: true, force: true }); } catch { /* best-effort cleanup */ }
    }
  }

  private runBurn(jsonData: any): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const proc = spawn(this.pythonV as string, [this.editScript as string, JSON.stringify(jsonData)], {
        env: {
          ...process.env,
          PYTHONIOENCODING: 'UTF-8',
          ASSETS: this.assets,
          ROOT_PATH: this.rootPath,
          DO_SPACES_BUCKET_NAME: this.config.get('DO_SPACES_BUCKET_NAME'),
          DO_SPACES_KEY: this.config.get('DO_SPACES_KEY'),
          DO_SPACES_SECRET: this.config.get('DO_SPACES_SECRET'),
          DO_SPACES_ENDPOINT: this.config.get('DO_SPACES_ENDPOINT'),
          DO_TOKEN: this.config.get('DO_TOKEN'),
          DO_CDN_ID: this.config.get('DO_CDN_ID'),
        },
      });
      proc.stdout.on('data', d => this.logger.log(`[exportfile.py] ${String(d).trim()}`));
      proc.stderr.on('data', d => this.logger.error(`[exportfile.py] ${String(d).trim()}`));
      proc.on('error', e => { this.logger.error(`Failed to spawn exportfile.py: ${e.message}`); resolve(false); });
      proc.on('close', code => resolve(code === 0));
    });
  }
}
