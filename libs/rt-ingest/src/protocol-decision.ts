/**
 * DET-4 on the box: which parser a CAT stream belongs to.
 *
 * The rule is libs/feed-parse detectProtocol (complete Bridge frames vs
 * CaseView line markers in the first DETECT_WINDOW_BYTES of the stream),
 * wrapped exactly as the cloud wires it (IngestSessionWorker.decideProtocol,
 * apps/realtime-server/src/services/eclipse-ingest/eclipse-tcp-ingest.service.ts):
 *  - a configured protocol wins (on the box: the dial setting, D34);
 *  - otherwise the framing decides, evaluated after every chunk over the
 *    first DETECT_WINDOW_BYTES bytes received so far;
 *  - still undecided once DETECT_WINDOW_BYTES bytes are in: CaseView, the
 *    default before detection existed (the caller warns).
 *
 * The first-byte rule this replaces (`chunk[0] === 0x02 ? 'B' : 'C'`) parsed
 * every real Eclipse Bridge stream as CaseView: Eclipse connects mid-page, so
 * the first byte after its login is text.
 *
 * Pure: no I/O, no clock.
 */
import { DETECT_WINDOW_BYTES, detectProtocol, protocolLetter } from '@app/feed-parse';

import { CatProtocol } from './types';

/** How a session's protocol was decided. */
export type ProtocolDecisionHow =
    /** the connection's configured protocol (dial mode) */
    | 'configured'
    /** the stream's framing (detectProtocol) */
    | 'detected'
    /** still unclear after DETECT_WINDOW_BYTES bytes: CaseView, the default */
    | 'window'
    /** the session ended before the framing was clear: CaseView, the default */
    | 'end';

export interface ProtocolDecision {
    protocol: CatProtocol;
    how: ProtocolDecisionHow;
    /** stream bytes seen when it was decided */
    bytes: number;
}

/**
 * The bytes of a stream whose protocol is not decided yet, in arrival order:
 * the first DETECT_WINDOW_BYTES (all detectProtocol looks at) are kept, the
 * rest only counted.
 */
export class StreamProtocolDetector {
    private window: Buffer = Buffer.alloc(0);
    private total = 0;

    push(bytes: Uint8Array): void {
        if (!bytes?.length) return;
        this.total += bytes.length;
        const room = DETECT_WINDOW_BYTES - this.window.length;
        if (room > 0) this.window = Buffer.concat([this.window, Buffer.from(bytes.buffer, bytes.byteOffset, Math.min(room, bytes.length))]);
    }

    /** Bytes pushed since the last reset. */
    get bytes(): number {
        return this.total;
    }

    /** DETECT_WINDOW_BYTES bytes are in: the framing will not get another look. */
    get windowFull(): boolean {
        return this.total >= DETECT_WINDOW_BYTES;
    }

    /** What the framing shows so far ('B' / 'C'), or null while it shows neither clearly. */
    detected(): CatProtocol | null {
        if (!this.window.length) return null;
        const verdict = detectProtocol(null, this.window);
        return verdict === 'undecided' ? null : protocolLetter(verdict);
    }

    /** The cloud's rule without a configured protocol: the framing, else CaseView once the window is full, else null. */
    decide(): ProtocolDecision | null {
        const seen = this.detected();
        if (seen) return { protocol: seen, how: 'detected', bytes: this.total };
        if (this.windowFull) return { protocol: 'C', how: 'window', bytes: this.total };
        return null;
    }

    reset(): void {
        this.window = Buffer.alloc(0);
        this.total = 0;
    }
}

/** The protocol for a stream: `configured` when given, else what `detector` decides (null while undecided). */
export function decideStreamProtocol(configured: CatProtocol | null | undefined, detector: StreamProtocolDetector): ProtocolDecision | null {
    if (configured === 'B' || configured === 'C') return { protocol: configured, how: 'configured', bytes: detector.bytes };
    return detector.decide();
}
