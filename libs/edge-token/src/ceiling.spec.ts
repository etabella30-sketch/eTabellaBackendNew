import { edgeCanRenew, edgeCeilingSec, edgeTokenExpirySec, isPastEdgeRenewalCeiling, isWithinEdgeLifetime } from './ceiling';
import { EDGE_RENEWAL_CEILING_SEC, EDGE_TOKEN_TTL_SEC } from './constants';

// D24: no token ever expires later than auth_time + 24 h. D28: one token lives at most 12 h.

const H = 3600;
const AUTH = 1_790_000_000;

describe('the 24 h auth_time ceiling (D24) and the 12 h life (D28)', () => {
    it('ledger values', () => {
        expect(EDGE_TOKEN_TTL_SEC).toBe(12 * H);
        expect(EDGE_RENEWAL_CEILING_SEC).toBe(24 * H);
    });

    it('edgeCeilingSec is auth_time + 24 h, or a configured ceiling', () => {
        expect(edgeCeilingSec(AUTH)).toBe(AUTH + 24 * H);
        expect(edgeCeilingSec(AUTH, 2 * H)).toBe(AUTH + 2 * H);
    });

    it('edgeTokenExpirySec gives a full 12 h while the ceiling is far, and stops at the ceiling after', () => {
        expect(edgeTokenExpirySec(AUTH, AUTH)).toBe(AUTH + 12 * H);
        expect(edgeTokenExpirySec(AUTH + 11 * H, AUTH)).toBe(AUTH + 23 * H);
        expect(edgeTokenExpirySec(AUTH + 12 * H, AUTH)).toBe(AUTH + 24 * H);
        expect(edgeTokenExpirySec(AUTH + 20 * H, AUTH)).toBe(AUTH + 24 * H);
        expect(edgeTokenExpirySec(AUTH + 30 * H, AUTH)).toBe(AUTH + 24 * H); // already past: the caller refuses to issue
        expect(edgeTokenExpirySec(AUTH, AUTH, { ttlSec: H, ceilingSec: 90 * 60 })).toBe(AUTH + H);
        expect(edgeTokenExpirySec(AUTH + H, AUTH, { ttlSec: H, ceilingSec: 90 * 60 })).toBe(AUTH + 90 * 60);
    });

    it('edgeCanRenew is true until a token already ends at the ceiling', () => {
        expect(edgeCanRenew({ exp: AUTH + 12 * H, auth_time: AUTH })).toBe(true);
        expect(edgeCanRenew({ exp: AUTH + 24 * H - 1, auth_time: AUTH })).toBe(true);
        expect(edgeCanRenew({ exp: AUTH + 24 * H, auth_time: AUTH })).toBe(false);
        expect(edgeCanRenew({ exp: AUTH + 2 * H, auth_time: AUTH }, 2 * H)).toBe(false);
    });

    it('isPastEdgeRenewalCeiling: a sign-in more than 24 h old, or a token ending at the ceiling, cannot be renewed', () => {
        const fresh = { exp: AUTH + 12 * H, auth_time: AUTH };
        expect(isPastEdgeRenewalCeiling(fresh, AUTH + H)).toBe(false);
        expect(isPastEdgeRenewalCeiling(fresh, AUTH + 24 * H)).toBe(false); // exactly 24 h: the exp test decides
        expect(isPastEdgeRenewalCeiling(fresh, AUTH + 24 * H + 1)).toBe(true);
        expect(isPastEdgeRenewalCeiling({ exp: AUTH + 24 * H, auth_time: AUTH }, AUTH + 13 * H)).toBe(true);
        expect(isPastEdgeRenewalCeiling({ exp: AUTH + 25 * H, auth_time: AUTH }, AUTH + 13 * H)).toBe(true);
    });

    it('isWithinEdgeLifetime checks the token\'s own claims against both bounds', () => {
        expect(isWithinEdgeLifetime({ iat: AUTH, exp: AUTH + 12 * H, auth_time: AUTH })).toBe(true);
        expect(isWithinEdgeLifetime({ iat: AUTH, exp: AUTH + 12 * H + 1, auth_time: AUTH })).toBe(false);
        expect(isWithinEdgeLifetime({ iat: AUTH + 13 * H, exp: AUTH + 24 * H, auth_time: AUTH })).toBe(true);
        expect(isWithinEdgeLifetime({ iat: AUTH + 13 * H, exp: AUTH + 24 * H + 1, auth_time: AUTH })).toBe(false);
        expect(isWithinEdgeLifetime({ iat: AUTH, exp: AUTH + 2 * H, auth_time: AUTH }, { ttlSec: H })).toBe(false);
    });

    it('renewing every 10 h from the sign-in never passes the ceiling, and ends with "sign in again"', () => {
        let iat = AUTH;
        let exp = edgeTokenExpirySec(iat, AUTH);
        const exps = [exp];
        while (!isPastEdgeRenewalCeiling({ exp, auth_time: AUTH }, iat + 10 * H)) {
            iat += 10 * H;
            exp = edgeTokenExpirySec(iat, AUTH);
            exps.push(exp);
            expect(isWithinEdgeLifetime({ iat, exp, auth_time: AUTH })).toBe(true);
        }
        expect(exps).toEqual([AUTH + 12 * H, AUTH + 22 * H, AUTH + 24 * H]);
        expect(Math.max(...exps)).toBe(edgeCeilingSec(AUTH));
        expect(edgeCanRenew({ exp, auth_time: AUTH })).toBe(false);
    });
});
