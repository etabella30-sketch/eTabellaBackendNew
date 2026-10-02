/**
 * SKELETON STUB of OpsPort: no sessions in the status, an empty Connectivity Log, everything else throws
 * NotImplementedPortError; start/close do nothing. Replace with the real ops module (keep OPS_PORT; change
 * `useClass` in ops.module.ts).
 */
import { Inject, Injectable } from '@nestjs/common';

import {
    BoxDetailsResponse,
    ConnectivityLogPage,
    ConnectivityLogQuery,
    ConnectivityLogTriesPage,
    EDGE_TIMING,
    EdgeOperatorStatus,
    EdgeSessionStatus,
    EdgeStatusSnapshot,
    NetworkChecksResponse,
    ReadinessResponse,
    ReporterCardResponse,
    VerdictResponse,
} from '../contracts';
import {
    BOX_CONFIG,
    BoxConfig,
    boxDay,
    EDGE_CLOCK,
    EdgeClock,
    EdgeDiagnosticsFile,
    notImplemented,
    OpsPort,
    Reply,
} from '../ports';

const PORT = 'OpsPort';

@Injectable()
export class OpsStub implements OpsPort {
    constructor(
        @Inject(BOX_CONFIG) private readonly config: BoxConfig,
        @Inject(EDGE_CLOCK) private readonly clock: EdgeClock,
    ) {}

    async start(): Promise<void> {
        /* skeleton: no timers */
    }

    async close(): Promise<void> {
        /* skeleton: no timers */
    }

    nextSeq(_nSesid: string): number {
        return notImplemented(PORT, 'nextSeq');
    }

    sessionStatus(_nSesid: string): EdgeSessionStatus | null {
        return null;
    }

    statusSnapshot(): Reply<EdgeStatusSnapshot> {
        return {
            nowMs: this.clock(),
            heartbeatMs: EDGE_TIMING.statusHeartbeatMs,
            staleAfterMs: EDGE_TIMING.statusStaleAfterMs,
            internet: { state: 'unknown', sinceMs: null },
            sessions: [],
        };
    }

    operatorStatus(): EdgeOperatorStatus {
        return notImplemented(PORT, 'operatorStatus');
    }

    readiness(): Reply<ReadinessResponse> {
        return notImplemented(PORT, 'readiness');
    }

    async runReadiness(): Promise<Reply<ReadinessResponse>> {
        return notImplemented(PORT, 'runReadiness');
    }

    verdict(): Reply<VerdictResponse> {
        return notImplemented(PORT, 'verdict');
    }

    dismissRecovery(): void {
        notImplemented(PORT, 'dismissRecovery');
    }

    connectivityLog(query: ConnectivityLogQuery): Reply<ConnectivityLogPage> {
        return {
            filter: query.filter ?? 'all',
            day: query.day ?? boxDay(this.clock(), this.config.box.timeZone),
            rows: [],
            nextBefore: null,
            newest: null,
            days: [],
        };
    }

    connectivityLogTries(): Reply<ConnectivityLogTriesPage> {
        return notImplemented(PORT, 'connectivityLogTries');
    }

    network(): Reply<NetworkChecksResponse> {
        return notImplemented(PORT, 'network');
    }

    async runNetwork(): Promise<Reply<NetworkChecksResponse>> {
        return notImplemented(PORT, 'runNetwork');
    }

    boxDetails(): Reply<BoxDetailsResponse> {
        return notImplemented(PORT, 'boxDetails');
    }

    async diagnostics(): Promise<EdgeDiagnosticsFile> {
        return notImplemented(PORT, 'diagnostics');
    }

    reporterCard(): Reply<ReporterCardResponse> {
        return notImplemented(PORT, 'reporterCard');
    }

    metrics(): string {
        return '';
    }
}
