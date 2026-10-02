/**
 * Optional integration: replay the local tcp-server-main corpus (a recorded
 * Bridge hearing) through the dial mode, the way tcp-server-main/tcp.js serves
 * it to a box that connects to it (D34, spec §10 #5 #21).
 *
 * The corpus holds real hearing text, so it is only READ at test time from
 * its own folder and never copied into this repo; the journal it produces
 * lives in a temp dir that is deleted afterwards. When the folder is absent
 * (CI, another machine) the spec reports itself as skipped.
 */
import * as fs from 'fs';
import * as net from 'net';
import * as os from 'os';
import * as path from 'path';

import { CatDialer } from './cat-dialer';
import { FeedArbiter } from './feed-arbiter';
import { readJournal, RecordType } from './raw-journal';
import { SessionWorker } from './session-worker';

const TCP_SERVER_DIR = process.env.RT_INGEST_TCP_SERVER_DIR || 'D:/etabella tech/tcp-server-main';
const COMMANDS = path.join(TCP_SERVER_DIR, 'commands.json');
const available = fs.existsSync(COMMANDS);

/** tcp.js stringToAsciiHex, verbatim semantics: 2-digit lowercase hex per UTF-16 code unit. */
function stringToAsciiHex(str: string): string {
    return str
        .split('')
        .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('');
}

/** tcp.js jsonToHex: entries without cmdType are sent as the ASCII hex of data1, the others as their hexCmd. */
function jsonToHexChunks(file: string): Buffer[] {
    const finalData = JSON.parse(fs.readFileSync(file).toString('utf-8'));
    const chunks = finalData.map((a: any) => ({ hex: !a.cmdType ? stringToAsciiHex(a.data1) : a.hexCmd, cmdType: a.cmdType }));
    // tcp.js emitData: Buffer.from(hx, 'hex') per chunk
    return chunks.map((c: { hex: string }) => Buffer.from(c.hex, 'hex'));
}

if (!available) {
    // eslint-disable-next-line no-console
    console.warn(`[rt-ingest] tcp-server-main replay SKIPPED: ${COMMANDS} not found (set RT_INGEST_TCP_SERVER_DIR to run it)`);
    describe('tcp-server-main replay through the dial mode (optional integration)', () => {
        it.skip(`SKIPPED: ${COMMANDS} not found (set RT_INGEST_TCP_SERVER_DIR to run it)`, () => undefined);
    });
} else {
    describe('tcp-server-main replay through the dial mode (optional integration)', () => {
        jest.setTimeout(120_000);
        const SES = 'ses-tcp-server-replay';
        let root: string;
        let server: net.Server;
        let arbiter: FeedArbiter;
        let dialer: CatDialer;

        beforeAll(() => {
            root = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-ingest-tcpserver-'));
        });
        afterAll(async () => {
            await dialer?.close();
            await arbiter?.close();
            await new Promise<void>(resolve => (server ? server.close(() => resolve()) : resolve()));
            fs.rmSync(root, { recursive: true, force: true });
        });

        it('journals every byte the transmitter sent, in order, and the Bridge parser produces lines', async () => {
            const chunks = jsonToHexChunks(COMMANDS);
            const expected = Buffer.concat(chunks);
            expect(chunks.length).toBeGreaterThan(0);

            // the transmitter: waits for the box, then streams the corpus (no 400 ms pacing, no hold at R)
            server = net.createServer(sock => {
                sock.on('error', () => undefined);
                void (async () => {
                    for (let i = 0; i < chunks.length; i++) {
                        if (!sock.write(chunks[i])) await new Promise(resolve => sock.once('drain', resolve));
                        if (i % 64 === 63) await new Promise(resolve => setImmediate(resolve)); // vary TCP chunk boundaries
                    }
                })();
            });
            await new Promise<void>(resolve => server.listen(0, '127.0.0.1', () => resolve()));
            const port = (server.address() as net.AddressInfo).port;

            let worker: SessionWorker | null = null;
            let lastBoundaryLines = 0;
            arbiter = new FeedArbiter({
                openWorker: async nSesid => {
                    worker = await SessionWorker.open({
                        meta: { nSesid, nLines: 25, tz: 'Asia/Kolkata', parserVer: '1.0.0' },
                        journalRoot: root,
                        parserVer: '1.0.0',
                        boundaryMs: 50,
                        onBoundary: b => {
                            lastBoundaryLines = (b.ctx.job.lineBuffer || []).filter((l: any) => Array.isArray(l) && Array.isArray(l[1]) && l[1].length).length;
                        },
                    });
                    return worker;
                },
            });
            dialer = new CatDialer({ arbiter });
            const applied = dialer.apply({ settings: { protocol: 'bridge', host: '127.0.0.1', port, autoReconnect: false }, nSesid: SES }, dialer.version);
            expect(applied.ok).toBe(true);
            expect(dialer.connect().ok).toBe(true);

            const deadline = Date.now() + 90_000;
            while ((dialer.status().bytes < expected.length || !worker) && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 50));
            expect(dialer.status().bytes).toBe(expected.length);
            await worker!.settled();
            await worker!.journal.flush();

            const journal = await readJournal({ root, nSesid: SES, repair: false });
            const data = Buffer.concat(journal.records.filter(r => r.type === RecordType.DATA).map(r => r.payload));
            expect(data.length).toBe(expected.length);
            expect(data.equals(expected)).toBe(true);
            const ctxSet = journal.records.find(r => r.type === RecordType.CTX_SET)!;
            expect(JSON.parse(ctxSet.payload.toString('utf8'))).toEqual({ protocol: 'B' });
            const open = journal.records.find(r => r.type === RecordType.CONN_OPEN)!;
            expect(JSON.parse(open.payload.toString('utf8'))).toMatchObject({ mode: 'dial' });

            const lines = worker!.applier.lane!.ctx.job.lineBuffer.filter((l: any) => Array.isArray(l) && Array.isArray(l[1]) && l[1].length);
            expect(lines.length).toBeGreaterThan(50);
            expect(worker!.status().lines).toBeGreaterThan(0);
            const t0 = Date.now();
            while (lastBoundaryLines === 0 && Date.now() - t0 < 2_000) await new Promise(resolve => setTimeout(resolve, 20));
            expect(lastBoundaryLines).toBeGreaterThan(0);
            // eslint-disable-next-line no-console
            console.log(`tcp-server-main replay: ${chunks.length} chunks, ${expected.length} B journaled in order, ${lines.length} lines parsed`);
        });
    });
}
