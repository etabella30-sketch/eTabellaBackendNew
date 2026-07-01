import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DbService } from '@app/global/db/pg/db.service';
import { DataExportRenderer } from '@app/global/utility/data-export/renderers.service';
import { fetchDatasets } from '@app/global/utility/data-export/type-source';
import type { DataExportType, DataExportFormat } from '@app/global/utility/data-export/types';
import { S3Service } from '../s3/s3.service';
import { filesdetail, ProcessJobDetail } from '../../interfaces/download.interface';

/** Include-flag key -> (export type, output format, filename). */
const REPORT_MAP: Record<string, { cType: DataExportType; format: DataExportFormat; name: string }> = {
  facts: { cType: 'facts', format: 'pdf', name: 'Facts' },
  tags: { cType: 'tags', format: 'xlsx', name: 'Tags' },
  doclinks: { cType: 'doclinks', format: 'xlsx', name: 'DocLinks' },
  // 'evidence'/'transcripts' gate document inclusion (handled in the processor);
  // 'meta' (case metadata) has no case-wide SP yet — skipped here.
};

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
  ) {}

  /** Build + upload the selected reports; returns their package file entries. */
  async buildReportFiles(jobDetail: ProcessJobDetail): Promise<filesdetail[]> {
    const includes = jobDetail?.jInclude?.includes ?? [];
    const nCaseid = jobDetail?.nCaseid;
    const nMasterid = jobDetail?.nCreateId ?? '';
    if (!Array.isArray(includes) || !nCaseid) return [];

    const out: filesdetail[] = [];
    for (const key of includes) {
      const spec = REPORT_MAP[key];
      if (!spec) continue;
      try {
        const datasets = await fetchDatasets(this.db, spec.cType, nCaseid, nMasterid);
        const rendered = await this.renderer.render(datasets, spec.format, spec.name);
        const cFilename = `${spec.name}.${rendered.ext}`;
        const cPath = `packages/${jobDetail.nDPid}/reports/${cFilename}`;
        await this.s3.putSourceObject(cPath, rendered.buffer, rendered.contentType);
        out.push({ nBundledetailid: randomUUID(), cFilename, foldername: 'Reports', cBatchType: 'S', cPath });
        this.logger.log(`Prepared package report ${cFilename} for nDPid=${jobDetail.nDPid}`);
      } catch (err: any) {
        // A failed report must not sink the whole package — log + skip it.
        this.logger.error(`Failed to build package report '${key}' for nDPid=${jobDetail.nDPid}: ${err?.message}`);
      }
    }
    return out;
  }
}
