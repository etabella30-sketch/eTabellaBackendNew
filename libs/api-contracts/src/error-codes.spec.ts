/**
 * The box envelope copy must equal the box contract byte for byte, and the DomainError statuses must agree with it
 * wherever a code exists in both: an EdgeEnvelope and a LegacyEnvelope then answer the same status for the same
 * DomainError. This is the one spec in the lib that reaches into apps/ (api-contracts.purity.spec.ts allows only it),
 * because apps/rt-edge/src/contracts may not import a lib and R1 forbids the lib importing it at runtime.
 */
import { EDGE_ERROR_CODES as BOX_ERROR_CODES, EDGE_ERROR_STATUS as BOX_ERROR_STATUS } from '../../../apps/rt-edge/src/contracts/errors';
import { DOMAIN_ERROR_CODES, DOMAIN_ERROR_STATUS, EDGE_ERROR_CODES, EDGE_ERROR_STATUS } from './error-codes';

describe('libs/api-contracts error-codes', () => {
  describe('box envelope copy', () => {
    it('lists the same codes in the same order as apps/rt-edge/src/contracts/errors.ts', () => {
      expect([...EDGE_ERROR_CODES]).toEqual([...BOX_ERROR_CODES]);
    });

    it('answers the same status per code as the box contract', () => {
      expect(EDGE_ERROR_STATUS).toEqual(BOX_ERROR_STATUS);
    });

    it('has one status per code and no stray key', () => {
      expect(Object.keys(EDGE_ERROR_STATUS).sort()).toEqual([...EDGE_ERROR_CODES].sort());
    });
  });

  describe('DomainError statuses', () => {
    it('cover every DomainError code exactly once', () => {
      expect(Object.keys(DOMAIN_ERROR_STATUS).sort()).toEqual([...DOMAIN_ERROR_CODES].sort());
      expect(new Set(DOMAIN_ERROR_CODES).size).toBe(DOMAIN_ERROR_CODES.length);
    });

    it('are all client or server error statuses', () => {
      for (const code of DOMAIN_ERROR_CODES) {
        expect(DOMAIN_ERROR_STATUS[code]).toBeGreaterThanOrEqual(400);
        expect(DOMAIN_ERROR_STATUS[code]).toBeLessThanOrEqual(599);
      }
    });

    it('agree with the box envelope wherever a code exists in both tables', () => {
      const shared = DOMAIN_ERROR_CODES.filter((code) => (BOX_ERROR_CODES as readonly string[]).includes(code));
      // the overlap is deliberate and known; a new shared code must be added here on purpose
      expect(shared).toEqual(['unauthenticated', 'not_found', 'offline', 'reauth', 'cloud_refused']);
      for (const code of shared) {
        expect([code, DOMAIN_ERROR_STATUS[code]]).toEqual([code, BOX_ERROR_STATUS[code as keyof typeof BOX_ERROR_STATUS]]);
      }
    });

    it('pins the statuses the FE edge interceptor keys on', () => {
      // 503 never signs anyone out (spec §8.2); 502 is "the cloud refused", never a sign-out either
      expect(DOMAIN_ERROR_STATUS).toEqual({
        invalid: 400,
        unauthenticated: 401,
        forbidden: 403,
        not_found: 404,
        conflict: 409,
        unavailable: 503,
        offline: 503,
        reauth: 503,
        upstream: 502,
        cloud_refused: 502,
      });
    });
  });
});
