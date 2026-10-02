import * as path from 'path';

import {
    boxHostname,
    certDaysLeft,
    certificateBlocksReady,
    certificateCoversHost,
    certificateRenewalDue,
    certificateStatus,
    EDGE_CERT_READY_MIN_DAYS,
    EDGE_TLS_MIN_VERSION,
    EdgeCertificateStatus,
    EdgeTlsError,
    inspectCertificatePem,
    readTlsMaterial,
} from './certificate';
import type { BoxTlsConfig } from './box-config';
import { selfSignedCertificate } from './testing/self-signed';

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 9, 1, 9, 30);
const HOST = 'k7q2m9x4.etabella-edge.net';

const tls: BoxTlsConfig = { certFile: '/certs/fullchain.pem', keyFile: '/certs/privkey.pem', caFile: null, reloadPollMs: 30_000 };
const errno = (code: string): Error => Object.assign(new Error(code), { code });

describe('box LAN certificate (ports/certificate.ts)', () => {
    const a = selfSignedCertificate({ cn: HOST, hosts: [HOST], notBeforeMs: NOW - 10 * DAY, notAfterMs: NOW + 80 * DAY });
    const b = selfSignedCertificate({ cn: 'other' });
    const files = (map: Record<string, string | Buffer | Error>) => (file: string): Buffer => {
        const v = map[path.basename(file)];
        if (v === undefined) throw errno('ENOENT');
        if (v instanceof Error) throw v;
        return Buffer.isBuffer(v) ? v : Buffer.from(v);
    };

    describe('readTlsMaterial', () => {
        it('accepts a matching pair, with the TLS minimum version in the options', () => {
            const m = readTlsMaterial(tls, files({ 'fullchain.pem': a.cert, 'privkey.pem': a.key }));
            expect(m.ok).toBe(true);
            expect(m.problem).toBeNull();
            expect(m.options!.minVersion).toBe(EDGE_TLS_MIN_VERSION);
            expect(String(m.options!.cert)).toBe(a.cert);
            expect(String(m.options!.key)).toBe(a.key);
            expect(m.options!.ca).toBeUndefined();
            expect(String(m.certPem)).toBe(a.cert);
            expect(Object.isFrozen(m.options)).toBe(true);
        });

        it('reads the CA bundle when configured', () => {
            const read = jest.fn(files({ 'fullchain.pem': a.cert, 'privkey.pem': a.key, 'ca.pem': b.cert }));
            const m = readTlsMaterial({ ...tls, caFile: '/certs/ca.pem' }, read);
            expect(m.ok).toBe(true);
            expect(String(m.options!.ca)).toBe(b.cert);
            expect(read.mock.calls.map(c => path.basename(c[0]))).toEqual(['fullchain.pem', 'privkey.pem', 'ca.pem']);
        });

        it('reports a missing file (a box before its first certificate), the certificate first', () => {
            expect(readTlsMaterial(tls, files({})).problem).toEqual({ reason: 'missing', file: tls.certFile, message: 'ENOENT' });
            expect(readTlsMaterial(tls, files({ 'fullchain.pem': a.cert })).problem).toEqual({ reason: 'missing', file: tls.keyFile, message: 'ENOENT' });
            expect(readTlsMaterial(tls, files({ 'fullchain.pem': errno('ENOTDIR') })).problem!.reason).toBe('missing');
            const ca = readTlsMaterial({ ...tls, caFile: '/certs/ca.pem' }, files({ 'fullchain.pem': a.cert, 'privkey.pem': a.key }));
            expect(ca.problem).toEqual({ reason: 'missing', file: '/certs/ca.pem', message: 'ENOENT' });
        });

        it('reports an unreadable file with its errno code', () => {
            const m = readTlsMaterial(tls, files({ 'fullchain.pem': a.cert, 'privkey.pem': errno('EACCES') }));
            expect(m).toEqual({ ok: false, options: null, certPem: null, problem: { reason: 'unreadable', file: tls.keyFile, message: 'EACCES' } });
            expect(readTlsMaterial(tls, files({ 'fullchain.pem': new Error('disk on fire') })).problem).toEqual({ reason: 'unreadable', file: tls.certFile, message: 'disk on fire' });
        });

        it('refuses an empty file, PEM garbage and a key that does not match the certificate', () => {
            expect(readTlsMaterial(tls, files({ 'fullchain.pem': Buffer.alloc(0), 'privkey.pem': a.key })).problem).toEqual({ reason: 'invalid', file: tls.certFile, message: 'empty file' });
            const garbage = readTlsMaterial(tls, files({ 'fullchain.pem': 'not a pem', 'privkey.pem': a.key }));
            expect(garbage.problem!.reason).toBe('invalid');
            expect(garbage.problem!.file).toBeNull();
            const mismatch = readTlsMaterial(tls, files({ 'fullchain.pem': a.cert, 'privkey.pem': b.key }));
            expect(mismatch.problem!.reason).toBe('invalid');
            expect(mismatch.problem!.file).toBeNull();
            expect(mismatch.problem!.message).toMatch(/key values mismatch/i);
            // The message never carries key material.
            expect(mismatch.problem!.message).not.toContain('PRIVATE KEY');
        });

        it('EdgeTlsError names the problem', () => {
            const err = new EdgeTlsError({ reason: 'missing', file: '/c.pem', message: 'ENOENT' });
            expect(err.message).toBe('TLS missing /c.pem: ENOENT');
            expect(new EdgeTlsError({ reason: 'invalid', file: null, message: 'key values mismatch' }).message).toBe('TLS invalid: key values mismatch');
        });
    });

    describe('inspectCertificatePem', () => {
        it('reads the dates, the SAN DNS names and the fingerprint of the leaf of a chain', () => {
            const info = inspectCertificatePem(`${a.cert}${b.cert}`);
            expect(info.notBeforeMs).toBe(NOW - 10 * DAY);
            expect(info.notAfterMs).toBe(NOW + 80 * DAY);
            expect(info.hosts).toEqual([HOST]);
            expect(info.fingerprint256).toMatch(/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/);
        });

        it('lists no host without a SAN, lower-cases them, and throws for a non-certificate', () => {
            expect(inspectCertificatePem(b.cert).hosts).toEqual([]);
            const mixed = selfSignedCertificate({ cn: 'x', hosts: ['Box.Example.NET', 'second.example.net'] });
            expect(inspectCertificatePem(mixed.cert).hosts).toEqual(['box.example.net', 'second.example.net']);
            expect(() => inspectCertificatePem('nope')).toThrow();
        });
    });

    describe('hosts and days', () => {
        it('boxHostname is <slug>.<domain>, lower case', () => {
            expect(boxHostname('K7Q2M9X4', 'etabella-edge.net')).toBe(HOST);
        });

        it('covers an exact name (any case) or a one-label wildcard only', () => {
            expect(certificateCoversHost([HOST], HOST.toUpperCase())).toBe(true);
            expect(certificateCoversHost(['*.etabella-edge.net'], HOST)).toBe(true);
            expect(certificateCoversHost(['*.etabella-edge.net'], `a.${HOST}`)).toBe(false);
            expect(certificateCoversHost(['*.etabella-edge.net'], 'etabella-edge.net')).toBe(false);
            expect(certificateCoversHost(['other.etabella-edge.net'], HOST)).toBe(false);
            expect(certificateCoversHost([], HOST)).toBe(false);
        });

        it('certDaysLeft floors, and goes negative once expired', () => {
            expect(certDaysLeft(NOW + 14 * DAY, NOW)).toBe(14);
            expect(certDaysLeft(NOW + 14 * DAY - 1, NOW)).toBe(13);
            expect(certDaysLeft(NOW, NOW)).toBe(0);
            expect(certDaysLeft(NOW - 1, NOW)).toBe(-1);
        });
    });

    describe('certificateStatus', () => {
        it('is not-configured for plain HTTP, without reading anything', () => {
            const read = jest.fn();
            expect(certificateStatus(null, read, NOW, HOST)).toEqual({ state: 'not-configured', problem: null, info: null, daysLeft: null, coversHost: null, checkedAtMs: NOW });
            expect(read).not.toHaveBeenCalled();
        });

        it('carries the problem of a pair that does not load', () => {
            const s = certificateStatus(tls, files({}), NOW, HOST);
            expect(s).toEqual({ state: 'missing', problem: { reason: 'missing', file: tls.certFile, message: 'ENOENT' }, info: null, daysLeft: null, coversHost: null, checkedAtMs: NOW });
        });

        it('describes a loadable pair: days left and whether it covers the box host (null before enrolment)', () => {
            const read = files({ 'fullchain.pem': a.cert, 'privkey.pem': a.key });
            const s = certificateStatus(tls, read, NOW, HOST);
            expect(s.state).toBe('ok');
            expect(s.daysLeft).toBe(80);
            expect(s.coversHost).toBe(true);
            expect(s.info!.hosts).toEqual([HOST]);
            expect(certificateStatus(tls, read, NOW, null).coversHost).toBeNull();
            expect(certificateStatus(tls, read, NOW, 'zzz.etabella-edge.net').coversHost).toBe(false);
        });

        it('reads invalid when the leaf cannot be parsed although OpenSSL loaded the pair', () => {
            const s = certificateStatus(tls, files({ 'fullchain.pem': 'x', 'privkey.pem': 'y' }), NOW, HOST, () => undefined);
            expect(s.state).toBe('invalid');
            expect(s.problem!.file).toBe(tls.certFile);
        });
    });

    describe('renewal and readiness rules (spec §8.3)', () => {
        const ok = (notBeforeMs: number, notAfterMs: number, coversHost: boolean | null = true): EdgeCertificateStatus => ({
            state: 'ok',
            problem: null,
            info: { notBeforeMs, notAfterMs, hosts: [HOST], fingerprint256: 'AA' },
            daysLeft: certDaysLeft(notAfterMs, NOW),
            coversHost,
            checkedAtMs: NOW,
        });
        const bad = (state: 'missing' | 'unreadable' | 'invalid'): EdgeCertificateStatus => ({
            state,
            problem: { reason: state, file: null, message: 'x' },
            info: null,
            daysLeft: null,
            coversHost: null,
            checkedAtMs: NOW,
        });
        const none: EdgeCertificateStatus = { state: 'not-configured', problem: null, info: null, daysLeft: null, coversHost: null, checkedAtMs: NOW };

        it('renews once less than two thirds of the lifetime remain (90-day certificate: after day 30)', () => {
            const issued = NOW - 29 * DAY;
            expect(certificateRenewalDue(ok(issued, issued + 90 * DAY), NOW)).toBe(false); // 61 of 90 days left
            const older = NOW - 31 * DAY;
            expect(certificateRenewalDue(ok(older, older + 90 * DAY), NOW)).toBe(true); // 59 of 90 days left
            const exact = NOW - 30 * DAY;
            expect(certificateRenewalDue(ok(exact, exact + 90 * DAY), NOW)).toBe(false); // exactly two thirds left
            expect(certificateRenewalDue(ok(exact, exact + 90 * DAY), NOW + 1)).toBe(true);
        });

        it('renews an expired, not-yet-valid, wrong-host, zero-lifetime or unloadable certificate; never plain HTTP', () => {
            expect(certificateRenewalDue(ok(NOW - 90 * DAY, NOW - DAY), NOW)).toBe(true);
            expect(certificateRenewalDue(ok(NOW + DAY, NOW + 90 * DAY), NOW)).toBe(true);
            expect(certificateRenewalDue(ok(NOW - DAY, NOW + 89 * DAY, false), NOW)).toBe(true);
            expect(certificateRenewalDue(ok(NOW, NOW), NOW)).toBe(true);
            expect(certificateRenewalDue(ok(NOW - DAY, NOW + 89 * DAY, null), NOW)).toBe(false);
            for (const state of ['missing', 'unreadable', 'invalid'] as const) expect(certificateRenewalDue(bad(state), NOW)).toBe(true);
            expect(certificateRenewalDue(none, NOW)).toBe(false);
        });

        it('blocks "ready" below 14 days, for the wrong host, or when the pair does not load; never plain HTTP', () => {
            expect(certificateBlocksReady(ok(NOW - DAY, NOW + EDGE_CERT_READY_MIN_DAYS * DAY))).toBe(false);
            expect(certificateBlocksReady(ok(NOW - DAY, NOW + EDGE_CERT_READY_MIN_DAYS * DAY - 1))).toBe(true);
            expect(certificateBlocksReady(ok(NOW - DAY, NOW + 60 * DAY, false))).toBe(true);
            expect(certificateBlocksReady(ok(NOW - DAY, NOW + 60 * DAY, null))).toBe(false);
            expect(certificateBlocksReady(bad('missing'))).toBe(true);
            expect(certificateBlocksReady(none)).toBe(false);
        });
    });
});
