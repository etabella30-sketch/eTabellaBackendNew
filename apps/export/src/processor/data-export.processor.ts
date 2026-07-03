import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { DbService } from '@app/global/db/pg/db.service';
import { ExportS3Service } from '../services/s3/s3.service';
import { DataExportRenderer } from '../services/data-export/renderers.service';
import { fetchDatasets } from '../services/data-export/type-source';
import { UtilityService } from '../utility/utility.service';
import { DataExportJob } from '../DTOs/data-export.dto';

/** Human filename base + report title per export type. */
const TYPE_LABEL: Record<string, string> = {
  facts: 'Case_Facts', qfacts: 'QFacts', doclinks: 'DocLinks', tags: 'Tags', tasks: 'Tasks',
  evidence_index: 'Evidence_Index', transcript_index: 'Transcript_Index', full_workspace: 'Workspace_Export',
};

/**
 * Generates a case-data export off the `data-export` queue: fetch dataset(s)
 * for the type, render to the requested format, upload to the download bucket,
 * mark the job complete, and push progress to the browser (via Kafka ->
 * socket-app -> `export-messages`).
 */
@Processor('data-export')
export class DataExportProcessor {
  private readonly logger = new Logger(DataExportProcessor.name);

  constructor(
    private readonly db: DbService,
    private readonly s3: ExportS3Service,
    private readonly renderer: DataExportRenderer,
    private readonly utility: UtilityService,
  ) {}

  // NOTE: a data-export is a single fetch+render+upload with no meaningful
  // sub-steps to count, so we emit only COMPLETE/FAILED — no comp_progres/
  // total_prog. The FE renders that as an honest indeterminate bar (it only
  // switches to a percentage if those counters ever arrive). Intentional; do
  // not fake a percentage here.
  @Process({ concurrency: 3 })
  async handle(job: Job<DataExportJob>): Promise<void> {
    const { nExportid, nCaseid, nMasterid, cType, cFormat } = job.data;
    const label = TYPE_LABEL[cType] ?? 'Export';
    try {
      const datasets = await fetchDatasets(this.db, cType, nCaseid, nMasterid);
      const title = label.replace(/_/g, ' ');
      // Evidence Index gets the master-index layout (grouped by section); every
      // other type uses the generic column renderer.
      const { buffer, contentType, ext } = cType === 'evidence_index'
        ? await this.renderer.renderIndex(datasets[0]?.rows ?? [], cFormat, title)
        : await this.renderer.render(datasets, cFormat, title);
      const cName = `${label}.${ext}`;
      const cKey = `outputs/exports/${nExportid}/${cName}`;
      await this.s3.putObject(cKey, buffer, contentType);
      // nSize: artifact byte size for the Outputs list's Size column (D3.3).
      await this.db.executeRef('output_data_export_complete', { nExportid, cStatus: 'C', cKey, cName, nSize: buffer.length });
      this.emit('DATA-EXPORT-COMPLETE', { nExportid, nCaseid, nMasterid, cType, cStatus: 'C', finalPath: cName });
      this.logger.log(`Data-export ${nExportid} (${cType}/${cFormat}) complete: ${cKey}`);
    } catch (err: any) {
      this.logger.error(`Data-export ${nExportid} failed: ${err?.message}`, err?.stack);
      await this.db.executeRef('output_data_export_complete', { nExportid, cStatus: 'F', cKey: null, cName: null });
      this.emit('DATA-EXPORT-FAILED', { nExportid, nCaseid, nMasterid, cType, cStatus: 'F', finalPath: null });
    }
  }

  /**
   * Emit onto the shared `export-response` Kafka topic; socket-app relays it to
   * room U<nMasterid> as `export-messages`. Fields are duplicated flat (for the
   * client) and under `data` (for socket-app's `data.nMasterid` routing).
   */
  private emit(event: string, p: { nExportid: string; nCaseid: string; nMasterid: string; cType: string; cStatus: string; finalPath: string | null }): void {
    this.utility.emit({
      event,
      nExportid: p.nExportid, cStatus: p.cStatus, cType: p.cType, nCaseid: p.nCaseid, finalPath: p.finalPath,
      data: { identifier: '', nMasterid: p.nMasterid, data: { nExportid: p.nExportid, cStatus: p.cStatus, cType: p.cType, nCaseid: p.nCaseid, finalPath: p.finalPath } },
    });
  }
}
