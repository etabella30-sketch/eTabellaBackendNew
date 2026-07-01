import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DbService } from '@app/global/db/pg/db.service';
import { S3Service } from '../s3/s3.service';

/**
 * Nightly rolling-retention for generated download packages.
 *
 * The download bucket's S3 lifecycle rule is the primary deleter (auto-expires
 * objects after RETENTION_DAYS). This cron keeps the DB in step: it flips
 * completed `ProcessMaster` rows older than the window from 'C' -> 'X'
 * (expired) via `et_expire_downloads`, so the Outputs UI shows
 * Expired -> Regenerate, and belt-and-suspenders deletes any archive the
 * lifecycle rule hasn't collected yet.
 *
 * Runs at 03:00 server time daily (matches the coreapi maintenance cadence).
 */
@Injectable()
export class OutputExpiryService {
  /** Keep in sync with the download-bucket S3 lifecycle expiration (see scripts/apply-download-lifecycle.ts). */
  private static readonly RETENTION_DAYS = 7;
  private readonly logger = new Logger(OutputExpiryService.name);

  constructor(private readonly db: DbService, private readonly s3: S3Service) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async expireOldDownloads(): Promise<void> {
    const days = OutputExpiryService.RETENTION_DAYS;
    const startedAt = Date.now();
    const res = await this.db.executeRef('expire_downloads', { nRetentionDays: days }, 'download');
    if (!res?.success) {
      this.logger.error(`Download expiry failed: ${res?.error ?? 'unknown'}`);
      return;
    }
    const rows: Array<{ nDPid?: string }> = res.data?.[0] ?? [];
    this.logger.log(`Expired ${rows.length} downloads older than ${days} days in ${Date.now() - startedAt} ms`);

    // Belt-and-suspenders object cleanup — the bucket lifecycle rule is the
    // primary deleter; this removes anything it hasn't collected yet.
    for (const row of rows) {
      const nDPid = row?.nDPid;
      if (!nDPid) continue;
      try {
        await this.s3.deleteFolder(nDPid);
      } catch (err: any) {
        this.logger.error(`Failed to delete archive for expired nDPid=${nDPid}: ${err?.message}`);
      }
    }
  }
}
