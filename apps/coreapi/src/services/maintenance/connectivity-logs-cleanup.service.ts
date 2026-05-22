import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DbService } from '@app/global/db/pg/db.service';

/**
 * Nightly cleanup of RTConnectivityLogs older than 30 days.
 *
 * Rationale: TimescaleDB on the Vultr managed cluster is Apache-licensed,
 * so `add_retention_policy` is unavailable. We get the same rolling-window
 * behavior with a plain Postgres DELETE driven by a NestJS cron.
 *
 * The DELETE is index-supported (`ix_rtconnectivitylogs_ddt` on dDt) so it
 * stays cheap as the table refills. Runs at 03:00 server time, every day.
 */
@Injectable()
export class ConnectivityLogsCleanupService {
  private static readonly RETENTION_DAYS = 30;
  private readonly logger = new Logger(ConnectivityLogsCleanupService.name);

  constructor(private readonly db: DbService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async deleteOldEntries(): Promise<void> {
    const days = ConnectivityLogsCleanupService.RETENTION_DAYS;
    // `rowQuery` is the raw-text path on DbService (see libs/global/src/db/pg/db.service.ts).
    // RETURNING 1 lets us count deleted rows without an extra round-trip.
    const sql = `
      DELETE FROM "RTConnectivityLogs"
      WHERE "dDt" < now() - INTERVAL '${days} days'
      RETURNING 1
    `;
    const startedAt = Date.now();
    const res = await this.db.rowQuery(sql);
    if (!res?.success) {
      this.logger.error(
        `RTConnectivityLogs cleanup failed: ${res?.error ?? 'unknown'}`,
      );
      return;
    }
    const deleted = Array.isArray(res.data) ? res.data.length : 0;
    this.logger.log(
      `Trimmed RTConnectivityLogs: removed ${deleted} rows older than ${days} days in ${Date.now() - startedAt} ms`,
    );
  }
}
