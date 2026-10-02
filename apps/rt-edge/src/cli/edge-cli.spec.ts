import { createHash, randomBytes } from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { FEED_PARSE_VERSION } from '@app/feed-parse';

import { runCli } from '../main';
import { CliOutput, EDGE_EXIT, parseBoxConfig } from '../ports';
import { bridgeLines, copyDir, eclipse, harness, Harness, sessionAssignment, waitFor } from '../kernel/testing/kernel-harness';
import { edgeBox, EdgeBox } from '../uplink/testing/edge-box';
import { FakeCloud } from '../uplink/testing/fake-cloud';
import { EdgeCli, RecoveredTranscript } from './edge-cli';

jest.setTimeout(60_000);

function capture(): { out: CliOutput; logs: string[]; errors: string[] } {
    const logs: string[] = [];
    const errors: string[] = [];
    return { out: { log: l => logs.push(l), error: e => errors.push(e) }, logs, errors };
}

const fileHashes = (dir: string): Record<string, string> =>
    Object.fromEntries(
        fs
            .readdirSync(dir)
            .sort()
            .map(n => [n, createHash('sha256').update(fs.readFileSync(path.join(dir, n))).digest('hex')]),
    );

describe('rt-edge CLI (EdgeCli behind CLI_PORT)', () => {
    let cloud: FakeCloud;
    let box: EdgeBox;
    let cli: EdgeCli;
    const dirs: string[] = [];
    const tempDir = (): string => {
        const d = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-edge-cli-'));
        dirs.push(d);
        return d;
    };

    beforeEach(async () => {
        cloud = new FakeCloud();
        await cloud.start();
        box = edgeBox({ cloudOrigin: cloud.origin, mode: 'cli' });
        cli = new EdgeCli(box.config, () => Date.now(), box.state, box.uplink, { diskFreeMb: async () => 42_000 });
    });

    afterEach(async () => {
        await box.close();
        await cloud.stop();
        for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
    });

    describe('enroll', () => {
        it('generates the device key, enrols with the one-time code and prints only the fingerprint', async () => {
            const code = randomBytes(13).toString('hex');
            const nEdgeid = cloud.addEnrollCode(code, { autoConfirm: false, slug: 'k7q2m9x4' });
            const io = capture();
            expect(await cli.run({ name: 'enroll', code, cloud: null, rekey: false }, io.out)).toBe(EDGE_EXIT.ok);
            const identity = box.state.identity.get()!;
            expect(identity).toMatchObject({ nEdgeid, slug: 'k7q2m9x4', status: 'pending-confirm', tpmKey: false, cloudOrigin: cloud.origin });
            expect(io.logs).toEqual([
                `Enrolled with ${cloud.origin} as box ${nEdgeid} (k7q2m9x4.etabella-edge.net)`,
                `Key fingerprint: ${identity.keyFingerprint}`,
                expect.stringMatching(/^Status: waiting for an admin to confirm this fingerprint/),
            ]);
            expect(identity.keyFingerprint).toMatch(/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/);
            // The fingerprint is the sha256 of the key the cloud stored.
            const stored = cloud.nodes.get(nEdgeid)!.pubKey!;
            expect(identity.keyFingerprint.replace(/:/g, '').toLowerCase()).toBe(createHash('sha256').update(Buffer.from(stored, 'base64')).digest('hex'));
            const pem = fs.readFileSync(box.config.paths.deviceKeyFile, 'utf8');
            expect(io.logs.join('\n')).not.toContain(pem.split('\n')[1]);
            expect(box.state.audit.list({ limit: 10 }).map(a => a.action)).toContain('enrol');
        });

        it('reports a refused code, a malformed code, an existing key without --rekey, a different --cloud and an unreachable cloud as failures', async () => {
            const refused = capture();
            expect(await cli.run({ name: 'enroll', code: 'A'.repeat(26), cloud: null, rekey: false }, refused.out)).toBe(EDGE_EXIT.failed);
            expect(refused.errors[0]).toMatch(/^rt-edge: enroll failed: the cloud refused: enrolment refused \(400 INVALID_CODE\)/);
            const malformed = capture();
            expect(await cli.run({ name: 'enroll', code: 'short', cloud: null, rekey: false }, malformed.out)).toBe(EDGE_EXIT.failed);
            expect(malformed.errors[0]).toMatch(/malformed/);
            const other = capture();
            expect(await cli.run({ name: 'enroll', code: 'B'.repeat(26), cloud: 'https://elsewhere.example', rekey: false }, other.out)).toBe(EDGE_EXIT.failed);
            expect(other.errors[0]).toMatch(/differs from the box config/);
            expect(box.state.identity.get()).toBeNull();

            const code = randomBytes(13).toString('hex');
            cloud.addEnrollCode(code);
            expect(await cli.run({ name: 'enroll', code, cloud: cloud.origin, rekey: false }, capture().out)).toBe(EDGE_EXIT.ok);
            const first = box.state.identity.get()!.keyFingerprint;
            const again = capture();
            expect(await cli.run({ name: 'enroll', code: 'C'.repeat(26), cloud: null, rekey: false }, again.out)).toBe(EDGE_EXIT.failed);
            expect(again.errors[0]).toMatch(/--rekey/);
            const code2 = randomBytes(13).toString('hex');
            cloud.addEnrollCode(code2);
            expect(await cli.run({ name: 'enroll', code: code2, cloud: null, rekey: true }, capture().out)).toBe(EDGE_EXIT.ok);
            expect(box.state.identity.get()!.keyFingerprint).not.toBe(first);

            await cloud.stop();
            const off = capture();
            expect(await cli.run({ name: 'enroll', code: 'D'.repeat(26), cloud: null, rekey: true }, off.out)).toBe(EDGE_EXIT.failed);
            expect(off.errors[0]).toMatch(/cannot reach http:\/\/127\.0\.0\.1:\d+/);
        });
    });

    describe('status', () => {
        it('says the box is not enrolled', async () => {
            const io = capture();
            expect(await cli.run({ name: 'status', json: false }, io.out)).toBe(EDGE_EXIT.ok);
            expect(io.logs).toContain('  not enrolled: run "rt-edge enroll --code <code>" (Venue boxes → Add)');
            const json = capture();
            expect(await cli.run({ name: 'status', json: true }, json.out)).toBe(EDGE_EXIT.ok);
            expect(JSON.parse(json.logs[0])).toMatchObject({ identity: null, sessions: [], certificate: { state: 'not-configured' }, link: { linked: false } });
        });

        it('lists identity, sessions (calling out unsealed ones), transmitter, disk, held captures, certificate and state health', async () => {
            const code = randomBytes(13).toString('hex');
            cloud.addEnrollCode(code);
            await cli.run({ name: 'enroll', code, cloud: null, rekey: false }, capture().out);
            const now = Date.now();
            for (const id of ['ses-a', 'ses-b', 'ses-c']) box.state.sessions.upsertAssignment(sessionAssignment(id), now);
            box.state.sessions.setLocal('ses-a', { localState: 'sealed', endedAtMs: now - 5_000, sealedAtMs: now - 1_000, sealState: 'K' }, now);
            box.state.sessions.setLocal('ses-b', { endedAtMs: now - 2_000 }, now);
            box.state.sessions.requestEnd('ses-c', now);
            fs.mkdirSync(path.join(box.config.paths.journalDir, 'ses-b'), { recursive: true });
            fs.writeFileSync(path.join(box.config.paths.journalDir, 'ses-b', 'seg-00001.ej'), Buffer.alloc(2048));
            box.state.heldCaptures.upsert({ id: 'cap-1', nSesid: 'ses-b', kind: 'C', user: 'eclipse-x', peer: '10.0.0.9', fromMs: now - 9_000, toMs: now - 8_000, bytes: 10, sha256: 'ab'.repeat(32), file: path.join(box.config.paths.captureDir, 'cap-1.bin'), uploadedAtMs: null, nOrphanid: null });

            const json = capture();
            expect(await cli.run({ name: 'status', json: true }, json.out)).toBe(EDGE_EXIT.ok);
            const report = JSON.parse(json.logs[0]);
            expect(report).toMatchObject({
                release: { version: '0.0.0-dev', parserVer: FEED_PARSE_VERSION },
                identity: { host: 'k7q2m9x4.etabella-edge.net', status: 'active', linkFailure: null },
                unsealed: { count: 2, ending: 1, endedAwaitingSeal: 1 },
                transmitter: { mode: 'listen' },
                disk: { freeMB: 42_000, journalBytes: 2048 },
                heldCaptures: { total: 1, pendingUpload: 1, open: 0 },
                certificate: { state: 'not-configured', host: 'k7q2m9x4.etabella-edge.net' },
                state: { ok: true },
            });
            expect(report.sessions.map((s: { nSesid: string; sealState: string | null }) => [s.nSesid, s.sealState])).toEqual([
                ['ses-a', 'K'],
                ['ses-b', null],
                ['ses-c', null],
            ]);
            expect(JSON.stringify(report)).not.toContain('publicKeySpki');

            const text = capture();
            expect(await cli.run({ name: 'status', json: false }, text.out)).toBe(EDGE_EXIT.ok);
            const all = text.logs.join('\n');
            expect(all).toContain('Sessions (3; 2 not sealed)');
            expect(all).toMatch(/ses-a .* sealed K/);
            expect(all).toMatch(/ses-b .* ended, awaiting the seal/);
            expect(all).toMatch(/ses-c .* ending/);
            expect(all).toContain('! sessions not sealed');
            expect(all).toContain(box.state.identity.get()!.keyFingerprint);
        });
    });

    describe('recover --journal', () => {
        let h: Harness | null = null;
        afterEach(async () => {
            await h?.close();
            h = null;
        });

        async function recordedJournal(end: boolean): Promise<{ dir: string; root: string; totalLines: number; pages: string }> {
            h = harness();
            h.state.sessions.upsertAssignment(sessionAssignment('ses-rec-1'), Date.now());
            await h.kernel.start();
            await waitFor(() => h!.kernel.session('ses-rec-1')?.localState === 'armed');
            const c = await eclipse(h.kernel.listenAddress()!.port, 'eclipse-ses-rec-1', 'pw-ses-rec-1');
            await c.send(bridgeLines(0, 40));
            await waitFor(() => (h!.kernel.view('ses-rec-1')?.totalLines ?? 0) >= 41);
            await h.kernel.settled();
            let root = h.kernel.view('ses-rec-1')!.root;
            let totalLines = h.kernel.view('ses-rec-1')!.totalLines;
            if (end) {
                h.state.sessions.requestEnd('ses-rec-1', Date.now());
                const res = await h.kernel.requestEnd('ses-rec-1', 'cloud');
                root = res.root;
                totalLines = res.totalLines;
            }
            await waitFor(() => h!.kernel.rawHead('ses-rec-1')!.durableSeq === h!.kernel.rawHead('ses-rec-1')!.headSeq);
            const pages = JSON.stringify(h.kernel.pages('ses-rec-1'));
            const dir = path.join(tempDir(), 'ses-rec-1');
            copyDir(path.join(h.config.paths.journalDir, 'ses-rec-1'), dir);
            await c.end();
            return { dir, root, totalLines, pages };
        }

        it('rebuilds an ended session from a copied journal: same root, lines and pages as the box, journal untouched', async () => {
            const rec = await recordedJournal(true);
            const before = fileHashes(rec.dir);
            const io = capture();
            expect(await cli.run({ name: 'recover', journal: rec.dir, out: null }, io.out)).toBe(EDGE_EXIT.ok);
            const file = `${rec.dir}.transcript.json`;
            const t = JSON.parse(fs.readFileSync(file, 'utf8')) as RecoveredTranscript;
            expect(t).toMatchObject({ format: 'rt-edge-recover/1', nSesid: 'ses-rec-1', nCaseid: 'case-1', parserVer: FEED_PARSE_VERSION, nLines: 25, protocol: 'B', totalLines: rec.totalLines, root: rec.root });
            expect(t.ended).toMatchObject({ endedBy: 'cloud' });
            expect(JSON.stringify(t.pages)).toBe(rec.pages);
            expect(t.text.filter(l => /^Line \d+ text$/.test(l))).toEqual(Array.from({ length: 40 }, (_, i) => `Line ${i} text`));
            expect(io.logs[0]).toMatch(/^Recovered session ses-rec-1 from \d+ journal record\(s\)/);
            expect(io.logs.join('\n')).toContain(`root ${rec.root}`);
            expect(io.logs.join('\n')).not.toContain('Line 3 text'); // never transcript text on the console
            expect(fileHashes(rec.dir)).toEqual(before);
            // Never overwrites.
            const twice = capture();
            expect(await cli.run({ name: 'recover', journal: rec.dir, out: file }, twice.out)).toBe(EDGE_EXIT.failed);
            expect(twice.errors[0]).toMatch(/exists/);
        });

        it('rebuilds a session that never ended (power cut) and says so; refuses bad inputs', async () => {
            const rec = await recordedJournal(false);
            const out = path.join(tempDir(), 'nested', 'out.json');
            const io = capture();
            expect(await cli.run({ name: 'recover', journal: rec.dir, out }, io.out)).toBe(EDGE_EXIT.ok);
            const t = JSON.parse(fs.readFileSync(out, 'utf8')) as RecoveredTranscript;
            expect(t).toMatchObject({ ended: null, root: rec.root, totalLines: rec.totalLines });
            expect(io.logs.join('\n')).toContain('NOT ended');

            const missing = capture();
            expect(await cli.run({ name: 'recover', journal: path.join(tempDir(), 'nope'), out: null }, missing.out)).toBe(EDGE_EXIT.failed);
            expect(missing.errors[0]).toMatch(/not a readable journal directory/);
            const empty = path.join(tempDir(), 'ses-empty');
            fs.mkdirSync(empty);
            const none = capture();
            expect(await cli.run({ name: 'recover', journal: empty, out: null }, none.out)).toBe(EDGE_EXIT.failed);
            expect(none.errors[0]).toMatch(/no journal segments/);
            const badName = path.join(tempDir(), 'not a session');
            copyDir(rec.dir, badName);
            const bad = capture();
            expect(await cli.run({ name: 'recover', journal: badName, out: null }, bad.out)).toBe(EDGE_EXIT.failed);
            expect(bad.errors[0]).toMatch(/not a session id/);
            const inside = capture();
            expect(await cli.run({ name: 'recover', journal: rec.dir, out: path.join(rec.dir, 'x.json') }, inside.out)).toBe(EDGE_EXIT.failed);
            expect(inside.errors[0]).toMatch(/outside the journal directory/);
        });
    });

    describe('capture list / upload', () => {
        const writeCapture = (id: string, bytes: Buffer, extra: Record<string, unknown> = {}) => {
            const file = path.join(box.config.paths.captureDir, `${id}.bin`);
            fs.mkdirSync(path.dirname(file), { recursive: true });
            fs.writeFileSync(file, bytes);
            box.state.heldCaptures.upsert({
                id,
                nSesid: 'ses-cap',
                kind: 'C',
                user: 'eclipse-x',
                peer: '10.0.0.9',
                fromMs: Date.now() - 60_000,
                toMs: Date.now() - 30_000,
                bytes: bytes.length,
                sha256: createHash('sha256').update(bytes).digest('hex'),
                file,
                uploadedAtMs: null,
                nOrphanid: null,
                ...extra,
            });
        };

        beforeEach(() => {
            box.state.sessions.upsertAssignment(sessionAssignment('ses-cap'), Date.now());
        });

        it('lists pending uploads first, then held, then uploaded', async () => {
            const empty = capture();
            expect(await cli.run({ name: 'capture-list' }, empty.out)).toBe(EDGE_EXIT.ok);
            expect(empty.logs).toEqual(['No held captures.']);
            writeCapture('cap-up', Buffer.from('a'), { uploadedAtMs: Date.now(), nOrphanid: 'orph-1' });
            writeCapture('cap-open', Buffer.from('b'), { toMs: null, sha256: null });
            writeCapture('cap-wait', Buffer.from('c'));
            const io = capture();
            expect(await cli.run({ name: 'capture-list' }, io.out)).toBe(EDGE_EXIT.ok);
            expect(io.logs.map(l => l.split(' ')[0])).toEqual(['cap-wait', 'cap-open', 'cap-up']);
            expect(io.logs[0]).toMatch(/waiting to upload$/);
            expect(io.logs[1]).toMatch(/held \(connection still open\)$/);
            expect(io.logs[2]).toMatch(/uploaded .* \(orphan orph-1\)$/);
        });

        it('uploads every pending capture over a one-shot connection (no hello) and refuses while the box service is connected', async () => {
            cloud.bind({ nSesid: 'ses-cap', parserVer: FEED_PARSE_VERSION, route: null });
            const code = randomBytes(13).toString('hex');
            cloud.addEnrollCode(code);
            await cli.run({ name: 'enroll', code, cloud: null, rekey: false }, capture().out);
            writeCapture('cap-1', Buffer.from('held bytes one'));
            writeCapture('cap-2', Buffer.from('held bytes two'));

            // The box service said hello 10 s ago: it is connected (and uploads held captures itself).
            box.state.identity.patch({ lastCloudContactAtMs: Date.now() - 10_000 });
            const busy = capture();
            expect(await cli.run({ name: 'capture-upload', id: null }, busy.out)).toBe(EDGE_EXIT.failed);
            expect(busy.errors[0]).toMatch(/talked to the cloud 10 s ago; it uploads held captures itself/);
            expect(cloud.log.connects).toEqual([]);

            box.state.identity.patch({ lastCloudContactAtMs: Date.now() - 10 * 60_000 });
            const io = capture();
            expect(await cli.run({ name: 'capture-upload', id: null }, io.out)).toBe(EDGE_EXIT.ok);
            expect(io.logs).toEqual([expect.stringMatching(/^cap-1: uploaded \(orphan [0-9a-f-]{36}\)$/), expect.stringMatching(/^cap-2: uploaded \(orphan [0-9a-f-]{36}\)$/)]);
            expect([...cloud.log.uploads.values()].map(b => b.toString()).sort()).toEqual(['held bytes one', 'held bytes two']);
            expect(cloud.log.hellos).toEqual([]);
            expect(cloud.log.connects.length).toBe(2); // one one-shot connection per capture
            expect(box.state.identity.get()!.lastCloudContactAtMs).toBeLessThan(Date.now() - 5 * 60_000); // the CLI is not the service
            expect(box.state.heldCaptures.list({ pendingUpload: true })).toEqual([]);
            expect(box.state.heldCaptures.get('cap-1')!.nOrphanid).toMatch(/^[0-9a-f-]{36}$/);

            const nothing = capture();
            expect(await cli.run({ name: 'capture-upload', id: null }, nothing.out)).toBe(EDGE_EXIT.ok);
            expect(nothing.logs).toEqual(['No held capture is waiting to upload.']);
            const unknown = capture();
            expect(await cli.run({ name: 'capture-upload', id: 'ghost' }, unknown.out)).toBe(EDGE_EXIT.failed);
            expect(unknown.errors[0]).toMatch(/ghost: held capture ghost not found/);
        });
    });
});

describe('rt-edge CLI through runCli (the real AppModule graph in cli mode)', () => {
    it('builds every real module in cli mode, prints status as JSON and opens no socket', async () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-edge-cli-app-'));
        try {
            const config = parseBoxConfig(
                {
                    mode: 'dev',
                    box: { name: 'Court 3', label: 'VB-014', timeZone: 'Europe/London' },
                    cloud: { origin: 'https://cloud.invalid' },
                    http: { host: '127.0.0.1', port: 0, tls: null },
                    transmitter: { bindAddress: '127.0.0.1', networkCidr: '127.0.0.0/8', listenPort: 0 },
                    paths: { dataDir: dir },
                    shutdownTimeoutMs: 2_000,
                },
                path.join(dir, 'rt-edge.json'),
            );
            const io = capture();
            expect(await runCli(config, { name: 'status', json: true }, { logger: false, out: io.out, holdProcess: () => () => undefined })).toBe(EDGE_EXIT.ok);
            expect(io.errors).toEqual([]);
            expect(JSON.parse(io.logs.join('\n'))).toMatchObject({ identity: null, box: { name: 'Court 3', label: 'VB-014' }, state: { ok: true } });
        } finally {
            fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
        }
    });
});
