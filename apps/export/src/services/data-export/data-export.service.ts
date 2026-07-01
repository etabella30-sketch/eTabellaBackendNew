import { DbService } from '@app/global/db/pg/db.service';
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ExportS3Service } from '../s3/s3.service';
import { DataExportReq, DataExportUrlReq, DataExportListReq, DataExportJob } from '../../DTOs/data-export.dto';

/**
 * Orchestrates case-data exports (facts/tags/indexes → pdf/xlsx/csv/docx).
 * Inserts a tracked job row, queues the heavy generation on the `data-export`
 * Bull queue, and mints short-TTL presigned URLs on demand. See
 * docs/outputs-feature-plan.md (Phase 3).
 */
@Injectable()
export class DataExportService {
  private readonly logger = new Logger(DataExportService.name);

  constructor(
    private readonly db: DbService,
    @InjectQueue('data-export') private readonly queue: Queue,
    private readonly s3: ExportS3Service,
  ) {}

  /** Create + enqueue an export. Returns the new nExportid immediately. */
  async createExport(body: DataExportReq): Promise<{ msg: number; nExportid?: string; error?: any }> {
    const res = await this.db.executeRef('output_data_export_insert', {
      nCaseid: body.nCaseid, nMasterid: body.nMasterid, cType: body.cType, cFormat: body.cFormat,
    });
    if (!res.success || !res.data?.[0]?.[0]?.nExportid) {
      this.logger.error('Failed to insert data-export job', res.error);
      return { msg: -1, error: res.error ?? 'insert failed' };
    }
    const nExportid: string = res.data[0][0].nExportid;
    const job: DataExportJob = {
      nExportid, nCaseid: body.nCaseid, nMasterid: body.nMasterid, cType: body.cType, cFormat: body.cFormat,
    };
    await this.queue.add(job, { removeOnComplete: true, removeOnFail: true, attempts: 2, timeout: 30 * 60 * 1000 });
    return { msg: 1, nExportid };
  }

  /**
   * Re-run an EXISTING export in place: reset its row to processing and re-queue
   * the SAME nExportid (the processor overwrites the same DB row + S3 object), so
   * "Regenerate" refreshes the file/link without creating a duplicate row.
   */
  async regenerate(query: DataExportUrlReq): Promise<{ msg: number; nExportid?: string; error?: any }> {
    const res = await this.db.executeRef('output_data_export_get', {
      nExportid: query.nExportid, nMasterid: query.nMasterid,
    });
    const row = res.data?.[0]?.[0];
    if (!res.success || !row) return { msg: -1, error: 'Export not found' };

    // Reset the existing row to processing (clears the stale key/name).
    await this.db.executeRef('output_data_export_complete', {
      nExportid: query.nExportid, cStatus: 'P', cKey: null, cName: null,
    });
    const job: DataExportJob = {
      nExportid: query.nExportid, nCaseid: row.nCaseid, nMasterid: query.nMasterid,
      cType: row.cType, cFormat: row.cFormat,
    };
    await this.queue.add(job, { removeOnComplete: true, removeOnFail: true, attempts: 2, timeout: 30 * 60 * 1000 });
    return { msg: 1, nExportid: query.nExportid };
  }

  /** Fresh short-TTL presigned URL for a completed export (owner-scoped). */
  async getUrl(query: DataExportUrlReq): Promise<{ cUrl: string }> {
    const res = await this.db.executeRef('output_data_export_get', {
      nExportid: query.nExportid, nMasterid: query.nMasterid,
    });
    const row = res.data?.[0]?.[0];
    if (!res.success || !row) throw new InternalServerErrorException('Export not found');
    if (row.cStatus !== 'C' || !row.cKey) throw new InternalServerErrorException('Export is not ready.');
    const key = await this.s3.resolveKey(row.cKey);
    if (!key) throw new InternalServerErrorException('This export has expired. Please regenerate it.');
    return { cUrl: await this.s3.getPresignedUrl(key) };
  }

  /** Delete a data-export (owner-scoped): remove the DB row + its S3 object. */
  async deleteExport(query: DataExportUrlReq): Promise<{ msg: number }> {
    const res = await this.db.executeRef('output_data_export_delete', {
      nExportid: query.nExportid, nMasterid: query.nMasterid,
    });
    const cKey = res.data?.[0]?.[0]?.cKey;
    if (cKey) await this.s3.deleteObject(cKey);
    return { msg: 1 };
  }

  /** List a user's data-exports for a case (maps to the FE Recent Outputs rows). */
  async list(query: DataExportListReq): Promise<any[]> {
    const res = await this.db.executeRef('output_data_export_list', {
      nCaseid: query.nCaseid, nMasterid: query.nMasterid,
    });
    return res.success ? (res.data?.[0] ?? []) : [];
  }
}
