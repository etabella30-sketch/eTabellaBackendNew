/**
 * Review 24 (and 5): the LAN certificate pair is installed atomically and recoverably (cert-install.ts). A crash at
 * any step leaves the served pair whole; the next start finishes or discards the interrupted install. Also the
 * checks every pair passes before it is written (the uplink's fetched chain, the console's manual one).
 */
import { createPublicKey } from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { BoxTlsConfig, readTlsMaterial } from '../ports';
import { selfSignedCertificate } from '../ports/testing/self-signed';
import {
    CERT_INSTALL_LOCK_STALE_MS,
    certInstallLockPath,
    CertFs,
    CertificateInstallBusyError,
    CertificateRefusedError,
    checkCertificatePair,
    completeCertificateInstall,
    installCertificatePair,
    nodeCertFs,
    stagedPaths,
} from './cert-install';

const HOST = 'k7q2m9x4.etabella-edge.net';
const DAY = 86_400_000;

describe('LAN certificate install (cert-install.ts)', () => {
    let dir: string;
    let tls: BoxTlsConfig;
    const loads = (): boolean => readTlsMaterial(tls, f => fs.readFileSync(f)).ok;
    const served = (): string => fs.readFileSync(tls.certFile, 'utf8');

    beforeEach(() => {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-edge-cert-'));
        tls = { certFile: path.join(dir, 'certs', 'fullchain.pem'), keyFile: path.join(dir, 'certs', 'privkey.pem'), caFile: null, reloadPollMs: 1_000 } as BoxTlsConfig;
    });
    afterEach(() => {
        fs.rmSync(dir, { recursive: true, force: true });
    });

    const pair = () => {
        const p = selfSignedCertificate({ cn: HOST, hosts: [HOST], notAfterMs: Date.now() + 90 * DAY });
        return { keyPem: p.key, chainPem: p.cert };
    };

    it('installs a pair: staged, checked, renamed in; nothing staged is left', () => {
        const p = pair();
        installCertificatePair(tls, p);
        expect(served()).toBe(p.chainPem);
        expect(fs.readFileSync(tls.keyFile, 'utf8')).toBe(p.keyPem);
        expect(loads()).toBe(true);
        expect(fs.existsSync(stagedPaths(tls).key)).toBe(false);
        expect(fs.existsSync(stagedPaths(tls).cert)).toBe(false);
        expect(completeCertificateInstall(tls)).toBe('none');
    });

    it('a crash between the key and the chain rename is finished at the next start, with no internet (the served pair loads)', () => {
        const old = pair();
        installCertificatePair(tls, old);
        const next = pair();
        // A filesystem that "loses power" right after the first rename.
        let renames = 0;
        const crashing: CertFs = {
            ...nodeCertFs,
            rename: (from, to) => {
                renames += 1;
                if (renames === 2) throw new Error('power cut');
                nodeCertFs.rename(from, to);
            },
        };
        expect(() => installCertificatePair(tls, next, crashing)).toThrow('power cut');
        // Before the fix this state (new key, old chain) did not load and stayed so until a new certificate came.
        expect(loads()).toBe(false);
        expect(completeCertificateInstall(tls)).toBe('completed');
        expect(loads()).toBe(true);
        expect(served()).toBe(next.chainPem);
        expect(fs.existsSync(stagedPaths(tls).cert)).toBe(false);
    });

    it('a crash before any rename installs the staged pair; a crash while staging leaves the old pair untouched', () => {
        const old = pair();
        installCertificatePair(tls, old);
        const next = pair();
        const noRename: CertFs = {
            ...nodeCertFs,
            rename: () => {
                throw new Error('power cut');
            },
        };
        expect(() => installCertificatePair(tls, next, noRename)).toThrow('power cut');
        expect(served()).toBe(old.chainPem);
        expect(completeCertificateInstall(tls)).toBe('completed');
        expect(served()).toBe(next.chainPem);
        expect(loads()).toBe(true);

        // Staging interrupted after the key: the served pair never changed and the stray key goes.
        const third = pair();
        let writes = 0;
        const crashWhileStaging: CertFs = {
            ...nodeCertFs,
            writeFileDurably: (file, data, mode) => {
                writes += 1;
                if (writes === 2) throw new Error('power cut');
                nodeCertFs.writeFileDurably(file, data, mode);
            },
        };
        expect(() => installCertificatePair(tls, third, crashWhileStaging)).toThrow('power cut');
        expect(completeCertificateInstall(tls)).toBe('discarded');
        expect(served()).toBe(next.chainPem);
        expect(loads()).toBe(true);
        expect(fs.existsSync(stagedPaths(tls).key)).toBe(false);
    });

    it('one install at a time: an install in progress holds the cert-dir lock; a crash that left it is finished once the lock is stale', () => {
        const old = pair();
        installCertificatePair(tls, old);
        expect(fs.existsSync(certInstallLockPath(tls))).toBe(false); // released after every install
        // A process that died between the two renames (a real power cut: no `finally` ran) left its lock and its
        // staged chain.
        const next = pair();
        let renames = 0;
        const dies: CertFs = {
            ...nodeCertFs,
            remove: file => {
                if (file === certInstallLockPath(tls)) return; // the process is gone: its lock stays
                nodeCertFs.remove(file);
            },
            rename: (from, to) => {
                renames += 1;
                if (renames === 2) throw new Error('power cut');
                nodeCertFs.rename(from, to);
            },
        };
        expect(() => installCertificatePair(tls, next, dies)).toThrow('power cut');
        expect(fs.existsSync(certInstallLockPath(tls))).toBe(true);
        // Restarted at once: the lock is fresh, so it may be a live install (the console's): nothing is touched.
        expect(completeCertificateInstall(tls)).toBe('busy');
        expect(() => installCertificatePair(tls, pair())).toThrow(CertificateInstallBusyError);
        expect(fs.existsSync(stagedPaths(tls).cert)).toBe(true);
        // Once the lock is older than any install takes, it is taken over and the interrupted install finished.
        const stale = (Date.now() - CERT_INSTALL_LOCK_STALE_MS - 1_000) / 1000;
        fs.utimesSync(certInstallLockPath(tls), stale, stale);
        expect(completeCertificateInstall(tls)).toBe('completed');
        expect(served()).toBe(next.chainPem);
        expect(loads()).toBe(true);
        expect(fs.existsSync(certInstallLockPath(tls))).toBe(false);
    });

    it('a staged chain that does not load with its key is discarded and the served pair stays', () => {
        const old = pair();
        installCertificatePair(tls, old);
        fs.writeFileSync(stagedPaths(tls).cert, pair().chainPem); // a chain for another key
        expect(completeCertificateInstall(tls)).toBe('discarded');
        expect(served()).toBe(old.chainPem);
        expect(loads()).toBe(true);
        // A pair that does not load is never installed.
        const mismatched = { keyPem: pair().keyPem, chainPem: pair().chainPem };
        expect(() => installCertificatePair(tls, mismatched)).toThrow();
        expect(served()).toBe(old.chainPem);
        expect(fs.existsSync(stagedPaths(tls).cert)).toBe(false);
        expect(fs.existsSync(stagedPaths(tls).key)).toBe(false);
    });

    describe('checkCertificatePair', () => {
        it('accepts a pair for the box host that is valid now and reports its days left', () => {
            const p = pair();
            const checked = checkCertificatePair({ ...p, host: HOST, nowMs: Date.now() });
            expect(checked.daysLeft).toBeGreaterThanOrEqual(89);
            expect(checked.info.hosts).toEqual([HOST]);
        });

        it('refuses another host, an expired or not-yet-valid one, a key that does not match, an encrypted key and the device key', () => {
            const now = Date.now();
            const refuse = (opts: Parameters<typeof checkCertificatePair>[0], why: RegExp) => {
                let err: unknown;
                try {
                    checkCertificatePair(opts);
                } catch (e) {
                    err = e;
                }
                expect(err).toBeInstanceOf(CertificateRefusedError);
                expect((err as Error).message).toMatch(why);
            };
            const other = selfSignedCertificate({ cn: 'other', hosts: ['other-box.etabella-edge.net'] });
            refuse({ keyPem: other.key, chainPem: other.cert, host: HOST, nowMs: now }, /does not cover k7q2m9x4\.etabella-edge\.net/);
            const expired = selfSignedCertificate({ cn: HOST, hosts: [HOST], notBeforeMs: now - 3 * DAY, notAfterMs: now - DAY });
            refuse({ keyPem: expired.key, chainPem: expired.cert, host: HOST, nowMs: now }, /expired/);
            const future = selfSignedCertificate({ cn: HOST, hosts: [HOST], notBeforeMs: now + 10 * DAY, notAfterMs: now + 90 * DAY });
            refuse({ keyPem: future.key, chainPem: future.cert, host: HOST, nowMs: now }, /not valid before/);
            const p = pair();
            refuse({ keyPem: pair().keyPem, chainPem: p.chainPem, host: HOST, nowMs: now }, /does not match/);
            refuse({ keyPem: p.keyPem, chainPem: 'not a certificate', host: HOST, nowMs: now }, /not a PEM certificate/);
            refuse({ keyPem: '-----BEGIN ENCRYPTED PRIVATE KEY-----\nAAAA\n-----END ENCRYPTED PRIVATE KEY-----\n', chainPem: p.chainPem, host: HOST, nowMs: now }, /unencrypted PEM private key/);
            const spki = createPublicKey(p.keyPem).export({ type: 'spki', format: 'der' }).toString('base64');
            refuse({ ...p, host: HOST, nowMs: now, deviceKeySpkiB64: spki }, /device key/);
        });
    });
});
