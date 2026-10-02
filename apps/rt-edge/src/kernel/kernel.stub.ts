/**
 * SKELETON STUB of KernelPort: queries return empty data (no sessions, no cuts, a never-configured transmitter in
 * listen mode), actions throw NotImplementedPortError, start/close do nothing. Replace with the rt-ingest wiring
 * (keep the KERNEL_PORT token; change `useClass` in kernel.module.ts).
 */
import { Inject, Injectable } from '@nestjs/common';

import type { BoxJournalView, CanonicalPage, Cut, CutterView } from '@app/edge-sync';

import type { TransmitterLinkStatus } from '../contracts';
import {
    BOX_CONFIG,
    BoxConfig,
    CutListener,
    KernelArmResult,
    KernelEndResult,
    KernelPort,
    KernelRawRange,
    KernelRecoverResult,
    KernelSessionView,
    KernelTransmitterState,
    KernelTransmitterTest,
    notImplemented,
    Unsubscribe,
} from '../ports';

const PORT = 'KernelPort';

@Injectable()
export class KernelStub implements KernelPort {
    constructor(@Inject(BOX_CONFIG) private readonly config: BoxConfig) {}

    async start(): Promise<void> {
        /* skeleton: no CAT link */
    }

    async close(): Promise<void> {
        /* skeleton: nothing to flush */
    }

    sessions(): readonly KernelSessionView[] {
        return [];
    }

    session(_nSesid: string): KernelSessionView | null {
        return null;
    }

    async arm(_nSesid: string): Promise<KernelArmResult> {
        return notImplemented(PORT, 'arm');
    }

    async requestEnd(_nSesid: string, _endedBy: string): Promise<KernelEndResult> {
        return notImplemented(PORT, 'requestEnd');
    }

    endResult(_nSesid: string): KernelEndResult | null {
        return null;
    }

    onCut(_listener: CutListener): Unsubscribe {
        return () => undefined;
    }

    currentCut(_nSesid: string): Cut | null {
        return null;
    }

    view(_nSesid: string): CutterView | null {
        return null;
    }

    pages(_nSesid: string): readonly CanonicalPage[] {
        return [];
    }

    rawHead(_nSesid: string): KernelSessionView['raw'] | null {
        return null;
    }

    async readRaw(_nSesid: string, _fromSeq: number, _maxBytes: number): Promise<KernelRawRange | null> {
        return notImplemented(PORT, 'readRaw');
    }

    async rawHashAt(_nSesid: string, _seq: number): Promise<string | null> {
        return null;
    }

    async journalView(_nSesid: string, _seqs: readonly number[]): Promise<BoxJournalView> {
        return notImplemented(PORT, 'journalView');
    }

    async recoverFromCloud(): Promise<KernelRecoverResult> {
        return notImplemented(PORT, 'recoverFromCloud');
    }

    transmitterState(): KernelTransmitterState {
        return {
            stateVersion: 0,
            settings: null,
            applied: null,
            link: this.transmitterLink(),
            sessions: [],
            listen: { boxTransmitterAddress: this.config.transmitter.bindAddress, port: this.config.transmitter.listenPort },
            actions: { connect: false, testOnly: false, reconnect: false },
        };
    }

    transmitterLink(): TransmitterLinkStatus {
        return {
            state: 'waiting',
            mode: 'listen',
            protocol: null,
            sinceMs: null,
            attempt: null,
            quietLevel: null,
            peer: null,
            bytesIn: 0,
            lastLineAtMs: null,
            receivingSesid: null,
            heldPeers: 0,
            lockout: false,
        };
    }

    async applyTransmitter(): Promise<KernelTransmitterState> {
        return notImplemented(PORT, 'applyTransmitter');
    }

    async connectTransmitter(): Promise<KernelTransmitterState> {
        return notImplemented(PORT, 'connectTransmitter');
    }

    async reconnectTransmitter(): Promise<KernelTransmitterState> {
        return notImplemented(PORT, 'reconnectTransmitter');
    }

    async testTransmitter(): Promise<KernelTransmitterTest> {
        return notImplemented(PORT, 'testTransmitter');
    }
}
