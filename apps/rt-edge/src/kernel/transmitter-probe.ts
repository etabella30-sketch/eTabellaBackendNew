/**
 * "Test only" (DR13, CONTRACTS.md §8.7): open one TCP connection to the DRAFT transmitter address, wait a short
 * window for bytes, say what arrived, close. It never feeds a session and never touches the dialer's socket.
 *
 *   refused / timeout / unreachable   no TCP connection (ECONNREFUSED / connect timeout / no route)
 *   connected-no-data                 connected, nothing within the window (Eclipse output not started?)
 *   data | protocol-mismatch          bytes arrived and their framing says Bridge or CaseView (DET-4, the ingest's
 *                                     rule: complete Bridge frames vs CaseView line markers, libs/feed-parse
 *                                     detectProtocol). The probe keeps reading until the framing is clear.
 *   data with protocolSeen null       bytes arrived but the framing never became clear (4096 bytes, the window
 *                                     ended or the transmitter closed): "seen: unknown", never a mismatch.
 */
import * as net from 'net';

import { CatProtocol, StreamProtocolDetector } from '@app/rt-ingest';

import { TRANSMITTER_TEST_MAX_MS, TransmitterProtocol, TransmitterTestResult } from '../contracts';

export interface ProbeOptions {
    readonly host: string;
    readonly port: number;
    readonly protocol: TransmitterProtocol;
    /** Connect timeout (default 5 s, never beyond the total budget). */
    readonly connectTimeoutMs?: number;
    /** Total budget (default TRANSMITTER_TEST_MAX_MS). */
    readonly totalMs?: number;
    readonly createConnection?: (opts: net.NetConnectOpts) => net.Socket;
    readonly clock?: () => number;
}

export interface ProbeResult {
    readonly result: TransmitterTestResult;
    readonly protocolSeen: TransmitterProtocol | null;
    readonly bytes: number;
    readonly durationMs: number;
    /** errno class for the log ("refused", "timeout", "unreachable") or null. */
    readonly error: string | null;
}

const UNREACHABLE = new Set(['EHOSTUNREACH', 'ENETUNREACH', 'EHOSTDOWN', 'EADDRNOTAVAIL', 'ENOTFOUND', 'EAI_AGAIN', 'ENETDOWN']);

const SEEN: Readonly<Record<CatProtocol, TransmitterProtocol>> = Object.freeze({ B: 'bridge', C: 'caseview' });

/** Socket error → the Connectivity Log's error class. */
export function socketErrorClass(code: string | null | undefined): string {
    const c = String(code ?? '').toUpperCase();
    if (c === 'ECONNREFUSED' || c.includes('REFUSED')) return 'refused';
    if (c === 'ETIMEDOUT' || c.includes('TIMEOUT')) return 'timeout';
    if (c === 'ECONNRESET' || c === 'EPIPE') return 'reset';
    if (c === 'ENOTFOUND' || c === 'EAI_AGAIN') return 'dns';
    if (UNREACHABLE.has(c)) return 'unreachable';
    return c ? c.toLowerCase() : 'error';
}

export function probeTransmitter(opts: ProbeOptions): Promise<ProbeResult> {
    const clock = opts.clock ?? Date.now;
    const total = Math.min(opts.totalMs ?? TRANSMITTER_TEST_MAX_MS, TRANSMITTER_TEST_MAX_MS);
    const connectMs = Math.min(opts.connectTimeoutMs ?? 5_000, total);
    const create = opts.createConnection ?? ((o: net.NetConnectOpts) => net.createConnection(o));
    const t0 = clock();
    return new Promise<ProbeResult>(resolve => {
        let done = false;
        let bytes = 0;
        let connected = false;
        let timer: NodeJS.Timeout | null = null;
        const detector = new StreamProtocolDetector();
        const sock = create({ host: opts.host, port: opts.port });
        const finish = (result: TransmitterTestResult, protocolSeen: TransmitterProtocol | null, error: string | null) => {
            if (done) return;
            done = true;
            if (timer) clearTimeout(timer);
            sock.removeAllListeners('data');
            sock.destroy();
            resolve({ result, protocolSeen, bytes, durationMs: Math.max(0, clock() - t0), error });
        };
        timer = setTimeout(() => finish('timeout', null, 'timeout'), connectMs);
        sock.on('error', (err: NodeJS.ErrnoException) => {
            if (connected) {
                finish(bytes ? 'data' : 'connected-no-data', null, socketErrorClass(err?.code));
                return;
            }
            const cls = socketErrorClass(err?.code ?? err?.message);
            finish(cls === 'refused' ? 'refused' : cls === 'timeout' ? 'timeout' : 'unreachable', null, cls);
        });
        sock.once('connect', () => {
            connected = true;
            if (timer) clearTimeout(timer);
            const left = Math.max(0, total - (clock() - t0));
            // bytes that never showed a clear framing within the window: data, protocol unknown
            timer = setTimeout(() => finish(bytes ? 'data' : 'connected-no-data', null, null), left);
        });
        sock.on('data', (chunk: Buffer) => {
            if (!chunk.length) return;
            bytes += chunk.length;
            detector.push(chunk);
            const letter = detector.detected();
            if (letter) {
                const seen = SEEN[letter];
                finish(seen === opts.protocol ? 'data' : 'protocol-mismatch', seen, null);
            } else if (detector.windowFull) {
                // the ingest would fall back to CaseView here; the probe says what it saw: unknown
                finish('data', null, null);
            }
        });
        sock.on('close', () => {
            if (connected) finish(bytes ? 'data' : 'connected-no-data', null, null);
        });
    });
}
