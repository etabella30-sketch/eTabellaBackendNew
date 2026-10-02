import * as fs from 'fs';
import { createRequire } from 'module';
import * as net from 'net';
import * as os from 'os';
import * as path from 'path';

import { Test } from '@nestjs/testing';

import { chainSeed, encodeRecord, readJournal, RawJournalWriter, RecordType, verifyRecordBatch } from '@app/rt-ingest';

import { BOX_CONFIG, EDGE_CLOCK, EDGE_EVENT_BUS, InMemoryEdgeEventBus, KERNEL_PORT, STATE_PORT } from '../ports';
import { SqliteEdgeState } from '../state/sqlite-state';
import { EdgeKernel } from './edge-kernel';
import { JournalRewriteError, PulledRange, RecoverRefusedError, rewriteJournalFrom, scanJournal } from './journal-rewrite';
import { KernelModule } from './kernel.module';
import { nextRevFloor, readRevFloor, REV_FLOOR_STEP, writeRevFloor } from './rev-floor';
import { edgeConfig } from './testing/kernel-harness';
import { probeTransmitter, socketErrorClass } from './transmitter-probe';

jest.setTimeout(30_000);

describe('kernel parts', () => {
    let dir: string;
    beforeEach(() => {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-edge-kparts-'));
    });
    afterEach(() => {
        fs.rmSync(dir, { recursive: true, force: true });
    });

    describe('rev floor', () => {
        it('reads 0 when absent or unreadable, persists atomically, and advances half a step ahead', async () => {
            expect(await readRevFloor(dir, 'ses-1')).toBe(0);
            await writeRevFloor(dir, 'ses-1', 1234);
            expect(await readRevFloor(dir, 'ses-1')).toBe(1234);
            fs.writeFileSync(path.join(dir, 'ses-1', 'rev-floor.json'), '{oops');
            expect(await readRevFloor(dir, 'ses-1')).toBe(0);
            expect(nextRevFloor(1, 0)).toBe(1 + REV_FLOOR_STEP);
            expect(nextRevFloor(10, 1000 + 10)).toBeNull();
            expect(nextRevFloor(600, 1000)).toBe(600 + REV_FLOOR_STEP);
            await expect(writeRevFloor(dir, '../evil', 1)).rejects.toThrow(/unsafe session id/);
        });
    });

    describe('transmitter probe', () => {
        it('classifies socket errors for the Connectivity Log', () => {
            expect(socketErrorClass('ECONNREFUSED')).toBe('refused');
            expect(socketErrorClass('ETIMEDOUT')).toBe('timeout');
            expect(socketErrorClass('connect timeout')).toBe('timeout');
            expect(socketErrorClass('ECONNRESET')).toBe('reset');
            expect(socketErrorClass('ENOTFOUND')).toBe('dns');
            expect(socketErrorClass('EHOSTUNREACH')).toBe('unreachable');
            expect(socketErrorClass(null)).toBe('error');
        });

        it('times out a connect that never completes and reports an unreachable host', async () => {
            const hanging = (): net.Socket => {
                const s = new net.Socket();
                return s; // never connects, never errors
            };
            const res = await probeTransmitter({ host: '10.255.255.1', port: 9, protocol: 'bridge', connectTimeoutMs: 50, totalMs: 200, createConnection: hanging });
            expect(res).toMatchObject({ result: 'timeout', bytes: 0, protocolSeen: null });
            const erroring = (): net.Socket => {
                const s = new net.Socket();
                setImmediate(() => s.emit('error', Object.assign(new Error('no route'), { code: 'EHOSTUNREACH' })));
                return s;
            };
            expect(await probeTransmitter({ host: '10.0.0.1', port: 9, protocol: 'caseview', createConnection: erroring })).toMatchObject({ result: 'unreachable', error: 'unreachable' });
        });

        /** A socket that connects and then delivers `chunks` (then, optionally, closes). */
        const delivering = (chunks: Buffer[], close = false) => (): net.Socket => {
            const s = new net.Socket();
            setImmediate(() => {
                s.emit('connect');
                for (const c of chunks) s.emit('data', c);
                if (close) s.emit('close');
            });
            return s;
        };
        const STX = 0x02;
        const ETX = 0x03;
        const frame = (letter: string, data: number[]) => Buffer.from([STX, letter.charCodeAt(0), ...data, ETX]);
        const marker = (n: number) => Buffer.from([0xf9, ...Buffer.from(String(n).padStart(4, '0'), 'latin1'), 0xfa]);
        /** Cut into small pieces so frames and markers straddle chunks. */
        const pieces = (buf: Buffer, n: number) => Array.from({ length: Math.ceil(buf.length / n) }, (_, i) => buf.subarray(i * n, (i + 1) * n));

        it('DET-4: reads the framing, not the first byte: a Bridge stream that starts with text is Bridge, in small chunks', async () => {
            const stream = Buffer.concat([Buffer.from(' of the witness.', 'latin1'), frame('N', [3]), frame('T', [10, 2, 3, 0]), Buffer.from('Next line', 'latin1')]);
            expect(stream[0]).not.toBe(STX); // the old rule would have said CaseView
            const res = await probeTransmitter({ host: '10.0.0.2', port: 9, protocol: 'bridge', totalMs: 2_000, createConnection: delivering(pieces(stream, 3)) });
            expect(res).toMatchObject({ result: 'data', protocolSeen: 'bridge', error: null });
            const other = await probeTransmitter({ host: '10.0.0.2', port: 9, protocol: 'caseview', totalMs: 2_000, createConnection: delivering(pieces(stream, 3)) });
            expect(other).toMatchObject({ result: 'protocol-mismatch', protocolSeen: 'bridge' });
            const cv = Buffer.concat([Buffer.from('Q.  Where?', 'latin1'), marker(1), Buffer.from('A.  Home.', 'latin1'), marker(2)]);
            expect(await probeTransmitter({ host: '10.0.0.2', port: 9, protocol: 'caseview', totalMs: 2_000, createConnection: delivering(pieces(cv, 4)) })).toMatchObject({ result: 'data', protocolSeen: 'caseview' });
        });

        it('DET-4: bytes whose framing never becomes clear are data with an unknown protocol, never a mismatch', async () => {
            // 4096 bytes with neither framing: the probe stops at once (the ingest would fall back to CaseView here)
            const full = await probeTransmitter({ host: '10.0.0.3', port: 9, protocol: 'bridge', totalMs: 5_000, createConnection: delivering([Buffer.alloc(4096, 0x20)]) });
            expect(full).toMatchObject({ result: 'data', protocolSeen: null, bytes: 4096 });
            expect(full.durationMs).toBeLessThan(5_000);
            // a few unclear bytes, then nothing: the window ends with data, protocol unknown
            expect(await probeTransmitter({ host: '10.0.0.3', port: 9, protocol: 'bridge', totalMs: 150, createConnection: delivering([Buffer.from('typing')]) })).toMatchObject({
                result: 'data',
                protocolSeen: null,
                bytes: 6,
            });
            // a few unclear bytes, then the transmitter hangs up: the same
            expect(await probeTransmitter({ host: '10.0.0.3', port: 9, protocol: 'caseview', totalMs: 5_000, createConnection: delivering([Buffer.from('typing')], true) })).toMatchObject({
                result: 'data',
                protocolSeen: null,
            });
        });

        const AUTHTEST = path.resolve(__dirname, '..', '..', '..', '..', 'tools', 'eclipse-capture', 'authtest');
        const capture = fs.existsSync(AUTHTEST) ? fs.readdirSync(AUTHTEST).find(d => d.startsWith('tcp_001_')) : undefined;
        (capture ? it : it.skip)('DET-4: the real Eclipse 12 Bridge capture tcp_001 (read in place) is seen as Bridge, where the first byte said CaseView', async () => {
            // the golden gate's own loader (plain CommonJS) through node's own require (the real `module` builtin, not
            // jest's), so ts-jest has no .js file to transform
            const nodeModule = (process as unknown as { getBuiltinModule?: (id: string) => any }).getBuiltinModule?.('module');
            const corpora = (nodeModule?.createRequire ?? createRequire)(__filename)(path.resolve(__dirname, '..', '..', '..', '..', 'tools', 'ci', 'golden-replay', 'corpora.js'));
            const chunks: Array<{ bytes: Buffer }> = corpora.stripEclipseLogin(corpora.readFrames(fs, path.join(AUTHTEST, capture!, 'frames.ndjson')), capture);
            const bytes = chunks.map(c => c.bytes);
            expect(bytes[0][0]).not.toBe(STX); // counts and flags only: no capture byte is printed
            const res = await probeTransmitter({ host: '10.0.0.4', port: 9, protocol: 'caseview', totalMs: 2_000, createConnection: delivering(bytes) });
            expect(res).toMatchObject({ result: 'protocol-mismatch', protocolSeen: 'bridge' });
        });
    });

    describe('journal rewrite (RECOVER surgery)', () => {
        async function journal(n: number): Promise<void> {
            const w = await RawJournalWriter.open({ root: dir, nSesid: 'ses-r' });
            for (let i = 0; i < n; i++) w.append(RecordType.DATA, Buffer.from(`chunk-${i}`));
            await w.close();
        }

        /** Encoded records as RECOVER hands them to the rewrite (chain-verified from `prev`). */
        function rangeOf(recs: Buffer, fromSeq: number, prev: Buffer): PulledRange {
            const check = verifyRecordBatch(recs, fromSeq, prev);
            if (check.ok === false) throw new Error(`bad fixture: ${check.reason}`);
            return { fromSeq, recs, records: check.records.map(r => ({ seq: r.seq, hash: r.hash, offset: r.offset!, size: r.size })) };
        }

        it('scans tolerantly and refuses a rewrite that would leave a gap, or that the cloud gives nothing for', async () => {
            await journal(5);
            const scan = await scanJournal(dir, 'ses-r', [0, 3, 9]);
            expect(scan).toMatchObject({ corrupt: null, recordCount: 5 });
            expect(scan.head.seq).toBe(5);
            expect(scan.hashes.has(3)).toBe(true);
            expect(scan.hashes.has(9)).toBe(false);
            const later = Buffer.concat([8, 9].map(seq => encodeRecord({ type: RecordType.DATA, flags: 0, seq, tRecvMs: 1, payload: Buffer.from(`c${seq}`) })));
            await expect(rewriteJournalFrom({ root: dir, nSesid: 'ses-r', pulled: rangeOf(later, 8, chainSeed('ses-r')), nowMs: 1 })).rejects.toBeInstanceOf(JournalRewriteError);
            await expect(rewriteJournalFrom({ root: dir, nSesid: 'ses-r', pulled: { fromSeq: 6, recs: Buffer.alloc(0), records: [] }, nowMs: 1 })).rejects.toBeInstanceOf(RecoverRefusedError);
        });

        it('appending at the head of an empty journal creates the first segment', async () => {
            const w = await RawJournalWriter.open({ root: path.join(dir, 'src'), nSesid: 'ses-r' });
            for (let i = 0; i < 3; i++) w.append(RecordType.DATA, Buffer.from(`x${i}`));
            await w.close();
            const recs = fs.readFileSync(path.join(dir, 'src', 'ses-r', 'seg-00001.ej'));
            const res = await rewriteJournalFrom({ root: dir, nSesid: 'ses-r', pulled: rangeOf(recs, 1, chainSeed('ses-r')), nowMs: 1 });
            expect(res).toMatchObject({ movedRecords: 0, appended: 3, asideDir: null });
            const j = await readJournal({ root: dir, nSesid: 'ses-r', repair: false });
            expect(j.head.seq).toBe(3);
            expect(j.records[0].hash.equals(j.records[0].hash)).toBe(true);
            expect(chainSeed('ses-r')).toHaveLength(32);
        });
    });

    describe('KernelModule', () => {
        it('provides EdgeKernel behind KERNEL_PORT with the shared StatePort', async () => {
            const config = edgeConfig(dir);
            const bus = new InMemoryEdgeEventBus();
            class CoreForSpec {}
            const core = {
                module: CoreForSpec,
                global: true,
                providers: [
                    { provide: BOX_CONFIG, useValue: config },
                    { provide: EDGE_CLOCK, useValue: () => Date.now() },
                    { provide: EDGE_EVENT_BUS, useValue: bus },
                ],
                exports: [BOX_CONFIG, EDGE_CLOCK, EDGE_EVENT_BUS],
            };
            const ref = await Test.createTestingModule({ imports: [core, KernelModule] }).compile();
            try {
                const kernel = ref.get(KERNEL_PORT, { strict: false });
                expect(kernel).toBeInstanceOf(EdgeKernel);
                expect(ref.get(STATE_PORT, { strict: false })).toBeInstanceOf(SqliteEdgeState);
                expect(kernel.sessions()).toEqual([]);
            } finally {
                await (ref.get(STATE_PORT, { strict: false }) as SqliteEdgeState).close();
                await ref.close();
            }
        });
    });
});
