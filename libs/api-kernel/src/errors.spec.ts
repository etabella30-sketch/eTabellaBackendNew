import { DOMAIN_ERROR_STATUS, DomainError, DomainErrorCode, ERROR_ENVELOPE, isDomainError, SHARED_VALIDATION } from './errors';

// The error contract other libs and the hosts' envelopes link against: codes, statuses and token strings are pinned.

describe('DomainError', () => {
  it('is an Error that carries its code, message and server-side detail', () => {
    const err = new DomainError('forbidden', 'Not a member.', { nCaseid: 'c1' });
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('DomainError');
    expect(err.code).toBe('forbidden');
    expect(err.message).toBe('Not a member.');
    expect(err.detail).toEqual({ nCaseid: 'c1' });
    expect(new DomainError('invalid', 'x').detail).toBeUndefined();
  });

  it('isDomainError narrows only real DomainErrors', () => {
    expect(isDomainError(new DomainError('offline', 'no cloud'))).toBe(true);
    expect(isDomainError(new Error('offline'))).toBe(false);
    expect(isDomainError({ code: 'offline', message: 'no cloud' })).toBe(false);
    expect(isDomainError(null)).toBe(false);
  });

  it('maps every code to the agreed plain status', () => {
    const expected: Record<DomainErrorCode, number> = {
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
    };
    expect(DOMAIN_ERROR_STATUS).toEqual(expected);
    expect(Object.isFrozen(DOMAIN_ERROR_STATUS)).toBe(true);
  });

  it('pins the envelope token and the shared validation options of every host', () => {
    expect(ERROR_ENVELOPE).toBe('ET_ERROR_ENVELOPE');
    expect(SHARED_VALIDATION).toEqual({ whitelist: true, forbidNonWhitelisted: true, transform: true });
  });
});
