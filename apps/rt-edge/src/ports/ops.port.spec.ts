import { EDGE_LAN_LISTENER_NOT_STARTED, EdgeLanListenerStatus } from './boot';
import type { EdgeCertificateStatus } from './certificate';
import { bootEdgeSeqFloor, EDGE_SEQ_BOOT_MARGIN, edgeLinkFailure, EdgeLinkInput, nextEdgeSeq } from './ops.port';

const NOW = Date.UTC(2026, 9, 1, 9, 30);

describe('edgeLinkFailure (readiness box-linked, verdict box-not-linked)', () => {
    const goodCert: EdgeCertificateStatus = {
        state: 'ok',
        problem: null,
        info: { notBeforeMs: NOW - 86_400_000, notAfterMs: NOW + 60 * 86_400_000, hosts: ['k7.etabella-edge.net'], fingerprint256: 'AA' },
        daysLeft: 60,
        coversHost: true,
        checkedAtMs: NOW,
    };
    const listening: EdgeLanListenerStatus = { state: 'listening', sinceMs: NOW, plainHttp: false, certificate: null, error: null };
    const input = (over: Partial<EdgeLinkInput> = {}): EdgeLinkInput => ({
        identity: { status: 'active', linkFailure: null },
        certificate: goodCert,
        lanListener: listening,
        uplinkStartFailed: false,
        ...over,
    });
    const missing: EdgeCertificateStatus = { ...goodCert, state: 'missing', problem: { reason: 'missing', file: '/c.pem', message: 'ENOENT' }, info: null, daysLeft: null, coversHost: null };

    it('is null for an active, reachable box with a good certificate', () => {
        expect(edgeLinkFailure(input())).toBeNull();
    });

    it('ranks identity problems first: never-enrolled, revoked, quarantined, key-refused', () => {
        const everything = { certificate: missing, uplinkStartFailed: true };
        expect(edgeLinkFailure(input({ identity: null, ...everything }))).toBe('never-enrolled');
        expect(edgeLinkFailure(input({ identity: { status: 'revoked', linkFailure: 'unreachable' }, ...everything }))).toBe('revoked');
        expect(edgeLinkFailure(input({ identity: { status: 'quarantined', linkFailure: 'key-refused' }, ...everything }))).toBe('quarantined');
        expect(edgeLinkFailure(input({ identity: { status: 'pending-confirm', linkFailure: 'key-refused' }, ...everything }))).toBe('key-refused');
    });

    it('then the certificate: listener waiting for one, unloadable, wrong host or under 14 days — before unreachable', () => {
        const waiting: EdgeLanListenerStatus = { ...listening, state: 'waiting-certificate', certificate: { reason: 'missing', file: '/c.pem', message: 'ENOENT' } };
        const unreachable = { identity: { status: 'active' as const, linkFailure: 'unreachable' as const } };
        expect(edgeLinkFailure(input({ lanListener: waiting, ...unreachable }))).toBe('certificate');
        expect(edgeLinkFailure(input({ certificate: missing }))).toBe('certificate');
        expect(edgeLinkFailure(input({ certificate: { ...goodCert, coversHost: false } }))).toBe('certificate');
        expect(edgeLinkFailure(input({ certificate: { ...goodCert, daysLeft: 13 } }))).toBe('certificate');
        expect(edgeLinkFailure(input({ certificate: { ...goodCert, daysLeft: 14 } }))).toBeNull();
    });

    it('plain HTTP (dev) has no certificate problem; a listener that failed to bind is not a link failure', () => {
        const dev: EdgeCertificateStatus = { state: 'not-configured', problem: null, info: null, daysLeft: null, coversHost: null, checkedAtMs: NOW };
        expect(edgeLinkFailure(input({ certificate: dev, lanListener: { ...listening, plainHttp: true } }))).toBeNull();
        expect(edgeLinkFailure(input({ lanListener: { ...listening, state: 'listen-failed', error: 'EADDRINUSE' } }))).toBeNull();
        expect(edgeLinkFailure(input({ lanListener: EDGE_LAN_LISTENER_NOT_STARTED }))).toBeNull();
    });

    it('then the recorded link failure, then a failed uplink start reads unreachable', () => {
        expect(edgeLinkFailure(input({ identity: { status: 'active', linkFailure: 'unreachable' } }))).toBe('unreachable');
        expect(edgeLinkFailure(input({ uplinkStartFailed: true }))).toBe('unreachable');
        // 'certificate' is derived only by this rule; a stray recorded one is ignored.
        expect(edgeLinkFailure(input({ identity: { status: 'active', linkFailure: 'certificate' } }))).toBeNull();
    });
});

describe('LAN seq (CONTRACTS.md §9.2: a client drops anything at or below the last seq it saw)', () => {
    it('is never below the clock, so a fresh box starts above any earlier run with a sane clock', () => {
        expect(nextEdgeSeq(0, NOW)).toBe(NOW);
        expect(nextEdgeSeq(bootEdgeSeqFloor(0), NOW)).toBe(NOW);
    });

    it('is strictly increasing, also when many emissions share one millisecond or the clock steps back', () => {
        let last = 0;
        const seen: number[] = [];
        for (const now of [NOW, NOW, NOW, NOW + 1, NOW - 60_000, NOW + 5]) {
            last = nextEdgeSeq(last, now);
            seen.push(last);
        }
        expect(seen).toEqual([NOW, NOW + 1, NOW + 2, NOW + 3, NOW + 4, NOW + 5]);
    });

    it('survives a restart: the boot floor is above anything issued since the last persist, even with the clock set back', () => {
        // Run 1: the floor was persisted at `persisted`; up to a heartbeat of further seqs were issued before a crash.
        const persisted = NOW;
        let last = persisted;
        for (let i = 0; i < 10_000; i++) last = nextEdgeSeq(last, NOW + 4_999);
        // Run 2 boots with the clock a day behind.
        const first = nextEdgeSeq(bootEdgeSeqFloor(persisted), NOW - 86_400_000);
        expect(first).toBeGreaterThan(last);
        expect(first).toBe(persisted + EDGE_SEQ_BOOT_MARGIN + 1);
    });

    it('ignores non-finite or negative inputs instead of producing NaN', () => {
        expect(nextEdgeSeq(Number.NaN, NOW)).toBe(NOW);
        expect(nextEdgeSeq(5, Number.NaN)).toBe(6);
        expect(nextEdgeSeq(-3, -1)).toBe(1);
        expect(bootEdgeSeqFloor(Number.POSITIVE_INFINITY)).toBe(EDGE_SEQ_BOOT_MARGIN);
        expect(bootEdgeSeqFloor(12.7)).toBe(12 + EDGE_SEQ_BOOT_MARGIN);
    });

    it('stays a safe integer for epoch-ms clocks', () => {
        expect(Number.isSafeInteger(nextEdgeSeq(bootEdgeSeqFloor(NOW), NOW))).toBe(true);
    });
});
