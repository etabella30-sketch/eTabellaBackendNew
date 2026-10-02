/**
 * Review 5: the v1 manual certificate path. `rt-edge cert install --key <file> --chain <file>` checks a pair issued at
 * the office (it loads, matches, names the box host, is valid now, is not the device key) and installs it
 * atomically; the running box hot-reloads it. The cloud issuer (`edge/v1/cert`) answers 501 in this build.
 *
 * The command is one of the ports' commands (ports/cli.port.ts `parseEdgeArgs`, `EdgeCliCommand`, `EDGE_USAGE`),
 * installs under the cert directory's install lock the running box's own installs take too, and is audited.
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { CliOutput, EDGE_EXIT, EDGE_USAGE, EdgeCliCommand, EdgeUsageError, parseEdgeArgs, readTlsMaterial } from '../ports';
import { selfSignedCertificate } from '../ports/testing/self-signed';
import { CERT_INSTALL_LOCK_STALE_MS, certInstallLockPath, completeCertificateInstall, installCertificatePair, stagedPaths } from '../uplink/cert-install';
import { edgeBox, EdgeBox } from '../uplink/testing/edge-box';
import { FakeCloud } from '../uplink/testing/fake-cloud';
import { EdgeCli } from './edge-cli';

jest.setTimeout(60_000);

const DAY = 86_400_000;

type CertInstall = Extract<EdgeCliCommand, { name: 'cert-install' }>;

function capture(): { out: CliOutput; logs: string[]; errors: string[] } {
    const logs: string[] = [];
    const errors: string[] = [];
    return { out: { log: l => logs.push(l), error: e => errors.push(e) }, logs, errors };
}

describe('rt-edge cert install', () => {
    describe('the command line (ports/cli.port.ts)', () => {
        it('is a ports command: parsed by parseEdgeArgs, listed in EDGE_USAGE, typed in EdgeCliCommand', () => {
            const parsed = parseEdgeArgs(['cert', 'install', '--key', 'k.pem', '--chain=c.pem', '--config', '/etc/x.json']);
            expect(parsed).toEqual({ name: 'cert-install', key: 'k.pem', chain: 'c.pem' });
            const typed: CertInstall = parsed as CertInstall; // a member of the union: no cast through unknown
            expect(typed.key).toBe('k.pem');
            expect(EDGE_USAGE).toContain('cert install --key <file> --chain <file>');
            expect(parseEdgeArgs(['cert', 'install', '--help'])).toEqual({ name: 'help' });
        });

        it('refuses a cert command it does not understand (usage error, exit 64 in main)', () => {
            for (const argv of [['cert'], ['cert', 'renew'], ['cert', 'install', '--key', 'k.pem'], ['cert', 'install', '--chain', 'c.pem'], ['cert', 'install', '--key', 'k', '--chain', 'c', '--force'], ['cert', 'install', 'extra', '--key', 'k', '--chain', 'c'], ['cert', 'install', '--key', '--chain', 'c'], ['cert', 'install', '--key', 'a', '--key', 'b', '--chain', 'c']]) {
                expect(() => parseEdgeArgs(argv)).toThrow(EdgeUsageError);
            }
        });
    });

    describe('EdgeCli', () => {
        let cloud: FakeCloud;
        let box: EdgeBox;
        let cli: EdgeCli;
        let incoming: string;
        const host = 'k7q2m9x4.etabella-edge.net';
        const run = (command: CertInstall, out: CliOutput) => cli.run(command, out);
        const put = (name: string, text: string): string => {
            const file = path.join(incoming, name);
            fs.writeFileSync(file, text, { mode: 0o600 });
            return file;
        };
        const audits = () => box.state.audit.list({ limit: 50 }).filter(a => a.action === 'cert-install');

        beforeEach(async () => {
            cloud = new FakeCloud();
            await cloud.start();
            const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-edge-cert-cli-'));
            box = edgeBox({
                dir,
                cloudOrigin: cloud.origin,
                mode: 'cli',
                config: { http: { host: '127.0.0.1', port: 0, tls: { certFile: path.join(dir, 'certs', 'fullchain.pem'), keyFile: path.join(dir, 'certs', 'privkey.pem') } } },
            });
            incoming = path.join(dir, 'incoming');
            fs.mkdirSync(incoming);
            cli = new EdgeCli(box.config, () => Date.now(), box.state, box.uplink);
        });

        afterEach(async () => {
            await box.close();
            await cloud.stop();
        });

        const enrol = (): void => {
            box.state.identity.save({ nEdgeid: 'e-1', slug: 'k7q2m9x4', status: 'active', keyFingerprint: 'AA', publicKeySpki: 'not-this-key', tpmKey: false, cloudOrigin: cloud.origin, enrolledAtMs: Date.now(), confirmedAtMs: Date.now(), lastCloudContactAtMs: null, linkFailure: null });
        };

        it('installs a checked pair for the box host; the served files load; prints host, fingerprint and expiry, never key text; audited', async () => {
            enrol();
            const pair = selfSignedCertificate({ cn: host, hosts: [host], notAfterMs: Date.now() + 89 * DAY });
            const io = capture();
            expect(await run({ name: 'cert-install', key: put('key.pem', pair.key), chain: put('chain.pem', pair.cert) }, io.out)).toBe(EDGE_EXIT.ok);
            const tls = box.config.http.tls!;
            expect(fs.readFileSync(tls.certFile, 'utf8')).toBe(pair.cert);
            expect(readTlsMaterial(tls, f => fs.readFileSync(f)).ok).toBe(true);
            expect(box.uplink.certificate()).toMatchObject({ state: 'ok', coversHost: true });
            expect(io.logs[0]).toBe(`Installed the LAN certificate for ${host}`);
            expect(io.logs.join('\n')).toMatch(/fingerprint:\s+([0-9A-F]{2}:){31}[0-9A-F]{2}/);
            expect(io.logs.join('\n')).toMatch(/\(8[89] days\)/);
            expect(io.logs.join('\n')).not.toContain(pair.key.split('\n')[1]);
            expect(io.errors).toEqual([]);
            // The lock is released, and the install is in the box's audit (no key or certificate text in it).
            expect(fs.existsSync(certInstallLockPath(tls))).toBe(false);
            const rows = audits();
            expect(rows).toHaveLength(1);
            expect(rows[0]).toMatchObject({ action: 'cert-install', actor: null, outcome: 'ok', target: host, data: { via: 'console', daysLeft: expect.any(Number), notAfterMs: expect.any(Number) } });
            expect(JSON.stringify(rows)).not.toContain('BEGIN');
        });

        it('refuses another host, an expired pair, a mismatched key, an unenrolled box and a missing file, and changes nothing', async () => {
            const tls = box.config.http.tls!;
            const good = selfSignedCertificate({ cn: host, hosts: [host], notAfterMs: Date.now() + 60 * DAY });
            const unenrolled = capture();
            expect(await run({ name: 'cert-install', key: put('k0.pem', good.key), chain: put('c0.pem', good.cert) }, unenrolled.out)).toBe(EDGE_EXIT.failed);
            expect(unenrolled.errors[0]).toMatch(/not enrolled/);
            enrol();
            const cases: Array<[string, string, RegExp]> = [];
            const other = selfSignedCertificate({ cn: 'x', hosts: ['other-box.etabella-edge.net'] });
            cases.push([other.key, other.cert, /does not cover k7q2m9x4\.etabella-edge\.net/]);
            const expired = selfSignedCertificate({ cn: host, hosts: [host], notBeforeMs: Date.now() - 3 * DAY, notAfterMs: Date.now() - DAY });
            cases.push([expired.key, expired.cert, /expired/]);
            cases.push([selfSignedCertificate({ cn: host, hosts: [host] }).key, good.cert, /does not match/]);
            for (const [i, [key, chain, why]] of cases.entries()) {
                const io = capture();
                expect(await run({ name: 'cert-install', key: put(`k${i + 1}.pem`, key), chain: put(`c${i + 1}.pem`, chain) }, io.out)).toBe(EDGE_EXIT.failed);
                expect(io.errors[0]).toMatch(why);
                expect(io.errors[0]).toContain('nothing was changed');
            }
            const missing = capture();
            expect(await run({ name: 'cert-install', key: path.join(incoming, 'nope.pem'), chain: put('c9.pem', good.cert) }, missing.out)).toBe(EDGE_EXIT.failed);
            expect(missing.errors[0]).toMatch(/cannot read --key/);
            expect(fs.existsSync(tls.certFile)).toBe(false);
            expect(fs.existsSync(tls.keyFile)).toBe(false);
            expect(audits().map(a => a.outcome)).toEqual(['refused', 'refused', 'refused']);
        });

        it("never interleaves with the running box's own install: a held install lock refuses (nothing changed, audited busy); a stale one is taken over", async () => {
            enrol();
            const tls = box.config.http.tls!;
            const served = selfSignedCertificate({ cn: host, hosts: [host], notAfterMs: Date.now() + 80 * DAY });
            installCertificatePair(tls, { keyPem: served.key, chainPem: served.cert });
            const next = selfSignedCertificate({ cn: host, hosts: [host], notAfterMs: Date.now() + 89 * DAY });
            const command: CertInstall = { name: 'cert-install', key: put('k.pem', next.key), chain: put('c.pem', next.cert) };

            // The box is mid-install: its lock is fresh, and its staged files are its own.
            const lock = certInstallLockPath(tls);
            fs.writeFileSync(lock, JSON.stringify({ pid: 1, atMs: Date.now() }));
            const staged = stagedPaths(tls);
            fs.writeFileSync(staged.key, served.key);
            const busy = capture();
            expect(await run(command, busy.out)).toBe(EDGE_EXIT.failed);
            expect(busy.errors[0]).toMatch(/another LAN certificate install is in progress/);
            expect(busy.errors[0]).toContain('nothing was changed');
            expect(fs.readFileSync(tls.certFile, 'utf8')).toBe(served.cert);
            expect(fs.existsSync(staged.key)).toBe(true); // the other install's staged file is not touched
            expect(fs.existsSync(lock)).toBe(true); // nor its lock
            // The box's own completion check (listener, uplink) stands aside the same way.
            expect(completeCertificateInstall(tls)).toBe('busy');
            expect(fs.existsSync(staged.key)).toBe(true);
            expect(audits().map(a => a.outcome)).toEqual(['busy']);

            // A lock left by an install that died long ago is taken over; its stray staged key is discarded first.
            const old = (Date.now() - CERT_INSTALL_LOCK_STALE_MS - 5_000) / 1000;
            fs.utimesSync(lock, old, old);
            const io = capture();
            expect(await run(command, io.out)).toBe(EDGE_EXIT.ok);
            expect(fs.readFileSync(tls.certFile, 'utf8')).toBe(next.cert);
            expect(readTlsMaterial(tls, f => fs.readFileSync(f)).ok).toBe(true);
            expect(fs.existsSync(lock)).toBe(false);
            expect(fs.existsSync(staged.key)).toBe(false);
            expect(fs.readdirSync(path.dirname(lock)).filter(n => n.startsWith('.cert-install.lock'))).toEqual([]);
            expect(audits().map(a => a.outcome)).toEqual(['ok', 'busy']);
        });
    });
});
