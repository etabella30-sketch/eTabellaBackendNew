import { EdgeRevocationList, edgeRevocationsReply } from '@app/edge-token';

import { EDGE_BOX_CLOCK_SKEW_MS } from './auth.port';
import { EDGE_REVOCATION_RETAIN_MS, isRevokedByUserCutoff, userRevocationCutoffMs } from './state.port';

const R = Date.UTC(2026, 9, 1, 10, 0, 0); // the cloud revokes the user at R
const USER = '6f1c2a40-1111-4222-8333-444455556666';

describe('user revocation cut-off (spec §8.4 "Revocation")', () => {
    it('is arrival + the 5 min box clock skew, never earlier than before', () => {
        expect(userRevocationCutoffMs(R)).toBe(R + EDGE_BOX_CLOCK_SKEW_MS);
        expect(userRevocationCutoffMs(R, null)).toBe(R + 300_000);
        expect(userRevocationCutoffMs(R, R + 10 * 60_000)).toBe(R + 10 * 60_000);
        expect(userRevocationCutoffMs(R + 0.9)).toBe(R + 300_000);
    });

    it('refuses a non-time arrival', () => {
        expect(() => userRevocationCutoffMs(Number.NaN)).toThrow(RangeError);
        expect(() => userRevocationCutoffMs(-1)).toThrow(RangeError);
    });

    it("revokes a token issued shortly before the revocation, which the cloud's `since` (read − 60 s) would miss", () => {
        // The 60 s pull reads the index at R + 30 s; authapi's since = R + 30 s − 60 s = R − 30 s.
        const reply = edgeRevocationsReply([{ jti: 'j-old', at: R }], R + 30_000);
        expect(reply.since).toBe(R - 30_000);
        const iatSec = Math.floor((R - 10_000) / 1000); // issued 10 s before the revocation
        expect(isRevokedByUserCutoff(iatSec, reply.since)).toBe(false); // the bug the rule prevents
        expect(isRevokedByUserCutoff(iatSec, userRevocationCutoffMs(R + 30_000))).toBe(true);
    });

    it('also covers a box clock behind the cloud by up to the skew', () => {
        const boxReceivedAt = R - 4 * 60_000; // box clock 4 min slow
        expect(isRevokedByUserCutoff(Math.floor(R / 1000), userRevocationCutoffMs(boxReceivedAt))).toBe(true);
    });

    it('matches libs/edge-token EdgeRevocationList (the auth module may use either)', () => {
        for (const received of [R, R + 999, R + 59_000]) {
            const list = new EdgeRevocationList();
            list.applyCloud({ users: [USER], jtis: [], since: received - 60_000 }, received);
            const cutoff = userRevocationCutoffMs(received);
            for (const iatSec of [Math.floor(cutoff / 1000) - 1, Math.floor(cutoff / 1000), Math.floor(cutoff / 1000) + 1]) {
                expect([received, iatSec, isRevokedByUserCutoff(iatSec, cutoff)]).toEqual([received, iatSec, list.isRevoked('other-jti', USER, iatSec)]);
            }
        }
    });

    it('does not revoke without a cut-off or for a non-numeric iat', () => {
        expect(isRevokedByUserCutoff(1, null)).toBe(false);
        expect(isRevokedByUserCutoff(Number.NaN, R)).toBe(false);
    });

    it('keeps rows for 24 h + 5 min (no edge token outlives auth_time + 24 h)', () => {
        expect(EDGE_REVOCATION_RETAIN_MS).toBe((24 * 3600 + 300) * 1000);
    });
});
