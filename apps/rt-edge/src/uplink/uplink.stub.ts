/**
 * SKELETON STUB of UplinkPort: never connects; status reads "offline, not linked, internet unknown"; the certificate
 * is inspected from the configured files (host unknown: no identity is read); actions throw NotImplementedPortError.
 * Replace with the socket.io-client uplink (keep UPLINK_PORT; change `useClass` in uplink.module.ts).
 */
import * as fs from 'fs';

import { Inject, Injectable } from '@nestjs/common';

import type { SealReply } from '@app/edge-sync';

import type { CloudLinkStatus, EdgeInternetStatus } from '../contracts';
import {
    BOX_CONFIG,
    BoxConfig,
    certificateStatus,
    EDGE_CLOCK,
    EdgeCertificateStatus,
    EdgeClock,
    notImplemented,
    RelayedOperatorCode,
    UplinkEnrolResult,
    UplinkLinkStatus,
    UplinkPort,
    UplinkSessionSync,
} from '../ports';

const PORT = 'UplinkPort';

@Injectable()
export class UplinkStub implements UplinkPort {
    constructor(
        @Inject(BOX_CONFIG) private readonly config: BoxConfig,
        @Inject(EDGE_CLOCK) private readonly clock: EdgeClock,
    ) {}

    async start(): Promise<void> {
        /* skeleton: never connects */
    }

    async close(): Promise<void> {
        /* skeleton: nothing open */
    }

    status(): UplinkLinkStatus {
        return { online: false, lagSec: 0, pendingPages: 0, lastSyncAt: null, lastCheckedAt: this.clock(), stale: false };
    }

    cloudLink(): CloudLinkStatus {
        return { state: 'not-linked', sinceMs: null, lagSec: 0, lagLines: 0, pendingPages: 0, lastSyncedAtMs: null };
    }

    internet(): EdgeInternetStatus {
        return { state: 'unknown', sinceMs: null };
    }

    etabellaReachable(): boolean {
        return false;
    }

    session(_nSesid: string): UplinkSessionSync | null {
        return null;
    }

    sessions(): readonly UplinkSessionSync[] {
        return [];
    }

    async syncNow(): Promise<void> {
        return notImplemented(PORT, 'syncNow');
    }

    async enrol(): Promise<UplinkEnrolResult> {
        return notImplemented(PORT, 'enrol');
    }

    async relayOperatorCode(): Promise<RelayedOperatorCode> {
        return notImplemented(PORT, 'relayOperatorCode');
    }

    async seal(_nSesid: string): Promise<SealReply> {
        return notImplemented(PORT, 'seal');
    }

    async uploadCapture(_id: string): Promise<{ readonly nOrphanid: string }> {
        return notImplemented(PORT, 'uploadCapture');
    }

    certificate(): EdgeCertificateStatus {
        return certificateStatus(this.config.http.tls, file => fs.readFileSync(file), this.clock(), null);
    }

    async ensureCertificate(): Promise<EdgeCertificateStatus> {
        return notImplemented(PORT, 'ensureCertificate');
    }
}
