import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { ConnectivityLogsCleanupService } from '../../services/maintenance/connectivity-logs-cleanup.service';

/**
 * Background-maintenance jobs that run inside the coreapi process.
 *
 * Today: nightly RTConnectivityLogs trim (30-day rolling window).
 * Add additional `@Cron`-decorated services here as more cleanup needs arise.
 *
 * Imports `SharedModule` for `DbService` — matches every other coreapi
 * feature module. `ScheduleModule.forRoot()` is imported once at the root
 * (CoreapiModule).
 */
@Module({
  imports: [SharedModule],
  providers: [ConnectivityLogsCleanupService],
})
export class MaintenanceModule {}
