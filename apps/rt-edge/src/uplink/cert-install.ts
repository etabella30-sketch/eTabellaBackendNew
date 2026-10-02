/**
 * Installing the box's LAN certificate/key pair (spec §8.3; review items 5 and 24): checked before anything is
 * written, then installed so that a crash or a power cut at any point leaves the served pair whole.
 *
 * Two files (`http.tls.keyFile`, `http.tls.certFile`) cannot be swapped by one rename, so the install is a small
 * roll-forward protocol:
 *   1. stage `<keyFile>.next` and `<certFile>.next`, each written, fsynced and its directory fsynced;
 *   2. check that the staged pair loads (`readTlsMaterial`: OpenSSL accepts it and the key matches the chain);
 *   3. rename the key into place and fsync its directory, then rename the chain into place and fsync its directory.
 * `completeCertificateInstall` finishes or discards whatever a crash left, at the next start (main.ts, before the
 * LAN listener reads the pair), before the uplink renews, and before the next install:
 *   - `<certFile>.next` with `<keyFile>.next`: step 3 never ran: the staged pair is installed if it loads;
 *   - `<certFile>.next` alone: the key was renamed, the chain was not: the chain is renamed if it loads with the key;
 *   - `<keyFile>.next` alone: staging was interrupted (the served pair never changed): it is removed;
 *   - a staged chain that does not load with its key: removed (the served pair never changed).
 *
 * One install at a time, whoever runs it: the running box (the uplink's renewal; the listener's and the uplink's
 * `completeCertificateInstall`) and the console command (`rt-edge cert install`, run by `docker compose exec` in the
 * box's container or in a one-off container beside it) share the cert directory, so they serialise on a lock file
 * there (`.cert-install.lock`, created with O_EXCL). An install or a completion finding a fresh lock does nothing:
 * `installCertificatePair` throws CertificateInstallBusyError (the console says "try again", the uplink retries at
 * its next check) and `completeCertificateInstall` answers 'busy' (the listener checks again). A lock older than
 * CERT_INSTALL_LOCK_STALE_MS was left by a process that died mid-install (an install takes well under a second): it
 * is taken over, and the staged files it left are finished or discarded as above. The age, not a pid, decides,
 * because the console command may run in another container (another pid namespace).
 *
 * Every file operation here is synchronous: the files are a few KB and the install runs at most once per renewal.
 */
import { createPrivateKey, createPublicKey, KeyObject, X509Certificate } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

import {
    BoxTlsConfig,
    certDaysLeft,
    certificateCoversHost,
    EDGE_BOX_CLOCK_SKEW_MS,
    EdgeCertificateInfo,
    EdgeTlsError,
    inspectCertificatePem,
    readTlsMaterial,
} from '../ports';

/** Suffix of the staged files beside `keyFile` / `certFile`. */
export const CERT_STAGE_SUFFIX = '.next';

/** The install lock, in the directory of `certFile` (the cert directory): see the file comment. */
export const CERT_INSTALL_LOCK_NAME = '.cert-install.lock';
/** A lock older than this was left by an install that died (an install takes well under a second). */
export const CERT_INSTALL_LOCK_STALE_MS = 60_000;

export function certInstallLockPath(tls: Pick<BoxTlsConfig, 'certFile'>): string {
    return path.join(path.dirname(tls.certFile), CERT_INSTALL_LOCK_NAME);
}

/** Another install (the box's or the console's) holds the lock: nothing was changed. */
export class CertificateInstallBusyError extends Error {
    constructor(
        readonly lockFile: string,
        readonly ageMs: number | null,
    ) {
        super(`another LAN certificate install is in progress (${lockFile}${ageMs !== null ? `, taken ${Math.max(0, Math.round(ageMs / 1000))} s ago` : ''}); try again in a minute`);
        this.name = 'CertificateInstallBusyError';
    }
}

/** The file operations the install uses (specs inject failures to simulate a crash between two steps). */
export interface CertFs {
    readFile(file: string): Buffer;
    exists(file: string): boolean;
    /** create `dir` (and parents) with `mode` when missing */
    mkdirp(dir: string, mode: number): void;
    /** write `data` to `file` (mode `mode`), fsync it */
    writeFileDurably(file: string, data: string, mode: number): void;
    rename(from: string, to: string): void;
    /** remove a file; a missing one is fine */
    remove(file: string): void;
    /** best-effort directory fsync (no-op where unsupported) */
    syncDir(dir: string): void;
    /** create `file` holding `data` only if it does not exist yet (O_EXCL); false when it exists */
    createExclusive(file: string, data: string, mode: number): boolean;
    /** ms since `file` was last modified (its own clock: the file system's); null when it does not exist */
    ageMs(file: string): number | null;
}

export const nodeCertFs: CertFs = {
    readFile: file => fs.readFileSync(file),
    exists: file => fs.existsSync(file),
    createExclusive(file, data, mode) {
        let fd: number;
        try {
            fd = fs.openSync(file, 'wx', mode);
        } catch (err) {
            if ((err as NodeJS.ErrnoException).code === 'EEXIST') return false;
            throw err;
        }
        try {
            fs.writeFileSync(fd, data, 'utf8');
        } finally {
            fs.closeSync(fd);
        }
        return true;
    },
    ageMs(file) {
        try {
            return Date.now() - fs.statSync(file).mtimeMs;
        } catch {
            return null;
        }
    },
    mkdirp: (dir, mode) => {
        fs.mkdirSync(dir, { recursive: true, mode });
    },
    writeFileDurably(file, data, mode) {
        fs.rmSync(file, { force: true });
        const fd = fs.openSync(file, 'w', mode);
        try {
            fs.writeFileSync(fd, data, 'utf8');
            fs.fsyncSync(fd);
        } finally {
            fs.closeSync(fd);
        }
    },
    rename: (from, to) => fs.renameSync(from, to),
    remove: file => fs.rmSync(file, { force: true }),
    syncDir(dir) {
        let fd: number | null = null;
        try {
            fd = fs.openSync(dir, 'r');
            fs.fsyncSync(fd);
        } catch {
            /* Windows cannot fsync a directory */
        } finally {
            if (fd !== null) fs.closeSync(fd);
        }
    },
};

export function stagedPaths(tls: Pick<BoxTlsConfig, 'certFile' | 'keyFile'>): { readonly key: string; readonly cert: string } {
    return { key: `${tls.keyFile}${CERT_STAGE_SUFFIX}`, cert: `${tls.certFile}${CERT_STAGE_SUFFIX}` };
}

/** 'busy': another install holds the lock (its staged files are its own): nothing was touched, check again later. */
export type CertInstallRecovery = 'none' | 'completed' | 'discarded' | 'busy';

/** The key directory first (0700), then the cert directory, so a shared directory keeps the key's mode. */
function ensureCertDirs(tls: BoxTlsConfig, cfs: CertFs): void {
    cfs.mkdirp(path.dirname(tls.keyFile), 0o700);
    cfs.mkdirp(path.dirname(tls.certFile), 0o755);
}

/**
 * Take the install lock (see the file comment); the returned function releases it (idempotent). Throws
 * CertificateInstallBusyError while another install holds a fresh one.
 */
function acquireInstallLock(tls: BoxTlsConfig, cfs: CertFs): () => void {
    const lock = certInstallLockPath(tls);
    const owner = (): string => JSON.stringify({ pid: process.pid, atMs: Date.now() });
    if (!cfs.createExclusive(lock, owner(), 0o600)) {
        const age = cfs.ageMs(lock);
        if (age !== null && age < CERT_INSTALL_LOCK_STALE_MS) throw new CertificateInstallBusyError(lock, age);
        if (age !== null) {
            // Left by an install that died: take it over. Only one taker's rename succeeds; a taker that finds it
            // moved a FRESH lock (another taker's, created in between) puts it back and stands aside.
            const aside = `${lock}.stale-${process.pid}-${Date.now()}`;
            try {
                cfs.rename(lock, aside);
            } catch {
                throw new CertificateInstallBusyError(lock, cfs.ageMs(lock));
            }
            const movedAge = cfs.ageMs(aside);
            if (movedAge !== null && movedAge < CERT_INSTALL_LOCK_STALE_MS) {
                cfs.rename(aside, lock);
                throw new CertificateInstallBusyError(lock, movedAge);
            }
            cfs.remove(aside);
        }
        // Released (or taken over) in between: one more try.
        if (!cfs.createExclusive(lock, owner(), 0o600)) throw new CertificateInstallBusyError(lock, cfs.ageMs(lock));
    }
    let held = true;
    return () => {
        if (!held) return;
        held = false;
        cfs.remove(lock);
    };
}

/**
 * Finish or discard an install a crash interrupted (see the file comment), under the install lock: 'busy' while
 * another install holds it. Never throws for a bad staged pair.
 */
export function completeCertificateInstall(tls: BoxTlsConfig, cfs: CertFs = nodeCertFs): CertInstallRecovery {
    const staged = stagedPaths(tls);
    if (!cfs.exists(staged.cert) && !cfs.exists(staged.key)) return 'none';
    ensureCertDirs(tls, cfs);
    let release: () => void;
    try {
        release = acquireInstallLock(tls, cfs);
    } catch (err) {
        if (err instanceof CertificateInstallBusyError) return 'busy';
        throw err;
    }
    try {
        return completeUnlocked(tls, cfs);
    } finally {
        release();
    }
}

function completeUnlocked(tls: BoxTlsConfig, cfs: CertFs): CertInstallRecovery {
    const staged = stagedPaths(tls);
    const hasCert = cfs.exists(staged.cert);
    const hasKey = cfs.exists(staged.key);
    if (!hasCert && !hasKey) return 'none';
    if (!hasCert) {
        cfs.remove(staged.key);
        cfs.syncDir(path.dirname(staged.key));
        return 'discarded';
    }
    const material = readTlsMaterial({ ...tls, certFile: staged.cert, keyFile: hasKey ? staged.key : tls.keyFile }, file => cfs.readFile(file));
    if (!material.ok) {
        cfs.remove(staged.cert);
        if (hasKey) cfs.remove(staged.key);
        cfs.syncDir(path.dirname(staged.cert));
        if (hasKey) cfs.syncDir(path.dirname(staged.key));
        return 'discarded';
    }
    commit(tls, hasKey, cfs);
    return 'completed';
}

/**
 * Install a checked pair under the install lock: stage, verify the staged pair loads, then rename key and chain into
 * place (see the file comment). Throws CertificateInstallBusyError (nothing touched) while another install holds the
 * lock, and EdgeTlsError (nothing installed, the staged files removed) when the staged pair does not load.
 */
export function installCertificatePair(tls: BoxTlsConfig, pair: { readonly keyPem: string; readonly chainPem: string }, cfs: CertFs = nodeCertFs): void {
    ensureCertDirs(tls, cfs);
    const release = acquireInstallLock(tls, cfs);
    try {
        completeUnlocked(tls, cfs);
        const staged = stagedPaths(tls);
        cfs.writeFileDurably(staged.key, pair.keyPem, 0o600);
        cfs.writeFileDurably(staged.cert, pair.chainPem, 0o644);
        cfs.syncDir(path.dirname(staged.key));
        if (path.dirname(staged.cert) !== path.dirname(staged.key)) cfs.syncDir(path.dirname(staged.cert));
        const material = readTlsMaterial({ ...tls, certFile: staged.cert, keyFile: staged.key }, file => cfs.readFile(file));
        if (!material.ok) {
            cfs.remove(staged.cert);
            cfs.remove(staged.key);
            throw new EdgeTlsError(material.problem);
        }
        commit(tls, true, cfs);
    } finally {
        release();
    }
}

function commit(tls: BoxTlsConfig, withKey: boolean, cfs: CertFs): void {
    const staged = stagedPaths(tls);
    if (withKey) {
        cfs.rename(staged.key, tls.keyFile);
        cfs.syncDir(path.dirname(tls.keyFile));
    }
    cfs.rename(staged.cert, tls.certFile);
    cfs.syncDir(path.dirname(tls.certFile));
}

/** Why a pair was refused before anything was written. */
export class CertificateRefusedError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CertificateRefusedError';
    }
}

export interface CheckedCertificate {
    readonly info: EdgeCertificateInfo;
    readonly daysLeft: number;
}

/**
 * The checks every pair passes before it is installed (the uplink's fetched chain and the console's manual one):
 * the chain parses, the key is an unencrypted private key that matches the leaf, the leaf names `host`
 * (`<slug>.<domain>`), it is valid now (not expired, not before its start beyond the clock skew), and the key is
 * not the device key (the TLS key is its own, spec §8.3). Throws CertificateRefusedError.
 */
export function checkCertificatePair(opts: {
    readonly keyPem: string;
    readonly chainPem: string;
    readonly host: string;
    readonly nowMs: number;
    /** the device key's SPKI (base64 DER), when known */
    readonly deviceKeySpkiB64?: string | null;
}): CheckedCertificate {
    let info: EdgeCertificateInfo;
    let leaf: X509Certificate;
    try {
        info = inspectCertificatePem(opts.chainPem);
        leaf = new X509Certificate(opts.chainPem);
    } catch (err) {
        throw new CertificateRefusedError(`the chain is not a PEM certificate: ${err instanceof Error ? err.message : String(err)}`);
    }
    let key: KeyObject;
    try {
        key = createPrivateKey(opts.keyPem);
    } catch (err) {
        throw new CertificateRefusedError(`the key is not an unencrypted PEM private key: ${err instanceof Error ? err.message : String(err)}`);
    }
    if (!leaf.checkPrivateKey(key)) throw new CertificateRefusedError('the key does not match the certificate');
    if (opts.deviceKeySpkiB64) {
        const spki = createPublicKey(key).export({ type: 'spki', format: 'der' }).toString('base64');
        if (spki === opts.deviceKeySpkiB64) throw new CertificateRefusedError('the key is the device key: the LAN certificate needs its own key');
    }
    if (!certificateCoversHost(info.hosts, opts.host)) {
        throw new CertificateRefusedError(`the certificate does not cover ${opts.host} (it names ${info.hosts.length ? info.hosts.join(', ') : 'no DNS host'})`);
    }
    if (info.notAfterMs <= opts.nowMs) throw new CertificateRefusedError(`the certificate expired on ${new Date(info.notAfterMs).toISOString()}`);
    if (info.notBeforeMs > opts.nowMs + EDGE_BOX_CLOCK_SKEW_MS) throw new CertificateRefusedError(`the certificate is not valid before ${new Date(info.notBeforeMs).toISOString()}`);
    return { info, daysLeft: certDaysLeft(info.notAfterMs, opts.nowMs) };
}
