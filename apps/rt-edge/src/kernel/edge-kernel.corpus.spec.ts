/**
 * Optional integration: the box's dial mode against a transmitter that replays the local tcp-server-main corpus
 * (a recorded Bridge hearing), converted exactly as tcp-server-main/tcp.js `jsonToHex` does (D34, spec §10 #5 #21).
 *
 * The corpus holds real hearing text: it is only READ at test time from its own folder and never copied into this
 * repo; the journal and database it produces live in a temp dir deleted afterwards. When the folder is absent (CI,
 * another machine) the spec reports itself as skipped.
 */
import * as fs from 'fs';
import * as net from 'net';
import * as path from 'path';

import { readJournal, RecordType } from '@app/rt-ingest';

import type { EdgeActor } from '../contracts';
import { Harness, harness, sessionAssignment, waitFor } from './testing/kernel-harness';

const TCP_SERVER_DIR = process.env.RT_EDGE_TCP_SERVER_DIR || 'D:/etabella tech/tcp-server-main';
const COMMANDS = path.join(TCP_SERVER_DIR, 'commands.json');
const available = fs.existsSync(COMMANDS);
const ACTOR: EdgeActor = { nUserid: 'u-admin', name: 'Priya Shah', via: 'online', operatorName: null };

/** tcp.js stringToAsciiHex: 2-digit lowercase hex per UTF-16 code unit. */
function stringToAsciiHex(str: string): string {
    return str
        .split('')
        .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('');
}

/** tcp.js jsonToHex + emitData: entries without cmdType are the ASCII hex of data1, the others their hexCmd. */
function corpusChunks(file: string): Buffer[] {
    const entries = JSON.parse(fs.readFileSync(file).toString('utf-8'));
    return entries.map((a: { cmdType?: string; data1?: string; hexCmd?: string }) => Buffer.from(!a.cmdType ? stringToAsciiHex(String(a.data1 ?? '')) : String(a.hexCmd ?? ''), 'hex'));
}

if (!available) {
    // eslint-disable-next-line no-console
    console.warn(`[rt-edge kernel] tcp-server-main corpus replay SKIPPED: ${COMMANDS} not found (set RT_EDGE_TCP_SERVER_DIR to run it)`);
    describe('EdgeKernel — tcp-server-main corpus through dial mode (optional integration)', () => {
        it.skip(`SKIPPED: ${COMMANDS} not found (set RT_EDGE_TCP_SERVER_DIR to run it)`, () => undefined);
    });
} else {
    describe('EdgeKernel — tcp-server-main corpus through dial mode (optional integration)', () => {
        jest.setTimeout(180_000);
        const SES = 'ses-corpus-1';
        let server: net.Server | null = null;
        let h: Harness | null = null;
        let h2: Harness | null = null;

        afterAll(async () => {
            await h2?.close();
            await h?.close();
            await new Promise<void>(resolve => (server ? server.close(() => resolve()) : resolve()));
        });

        it('journals every transmitted byte in order, parses the hearing, ends, and replays to the identical root after a restart', async () => {
            const chunks = corpusChunks(COMMANDS);
            const expected = Buffer.concat(chunks);
            expect(chunks.length).toBeGreaterThan(0);
            server = net.createServer(sock => {
                sock.on('error', () => undefined);
                void (async () => {
                    for (let i = 0; i < chunks.length; i++) {
                        if (!sock.write(chunks[i])) await new Promise(resolve => sock.once('drain', resolve));
                        if (i % 64 === 63) await new Promise(resolve => setImmediate(resolve));
                    }
                })();
            });
            await new Promise<void>(resolve => server!.listen(0, '127.0.0.1', () => resolve()));
            const port = (server.address() as net.AddressInfo).port;

            h = harness({ keepDir: true });
            h.state.sessions.upsertAssignment(sessionAssignment(SES, { route: null }), Date.now());
            await h.kernel.start();
            await waitFor(() => h!.kernel.session(SES)?.localState === 'armed');
            await h.kernel.applyTransmitter({ stateVersion: 0, settings: { mode: 'dial', protocol: 'bridge', host: '127.0.0.1', port, autoReconnect: false, receivingSesid: SES }, confirmInterrupt: false }, ACTOR);
            await h.kernel.connectTransmitter(h.state.transmitter.version(), ACTOR);
            await waitFor(() => (h!.kernel.session(SES)?.bytesIn ?? 0) >= expected.length, 120_000, 'whole corpus received');
            await h.kernel.settled();

            const live = h.kernel.view(SES)!;
            expect(live.totalLines).toBeGreaterThan(50);
            h.state.sessions.requestEnd(SES, Date.now());
            const ended = await h.kernel.requestEnd(SES, 'cloud');
            expect(ended.totalLines).toBeGreaterThanOrEqual(live.totalLines - 5);

            const journal = await readJournal({ root: h.config.paths.journalDir, nSesid: SES, repair: false });
            const data = Buffer.concat(journal.records.filter(r => r.type === RecordType.DATA).map(r => r.payload));
            expect(data.length).toBe(expected.length);
            expect(data.equals(expected)).toBe(true);
            expect(JSON.parse(journal.records.find(r => r.type === RecordType.CONN_OPEN)!.payload.toString())).toMatchObject({ mode: 'dial' });

            const dir = h.dir;
            await h.close();
            h = null;
            // A restart replays the journal deterministically to the same transcript.
            h2 = harness({ dir });
            await h2.kernel.start();
            await waitFor(() => h2!.kernel.endResult(SES) !== null, 60_000, 'reopened');
            expect(h2.kernel.endResult(SES)).toMatchObject({ root: ended.root, totalLines: ended.totalLines, rawFinalSeq: ended.rawFinalSeq, rawFinalHash: ended.rawFinalHash });
            // eslint-disable-next-line no-console
            console.log(`tcp-server-main corpus: ${chunks.length} chunks, ${expected.length} B journaled in order, ${ended.totalLines} lines, root ${ended.root.slice(0, 12)}`);
        });
    });
}
