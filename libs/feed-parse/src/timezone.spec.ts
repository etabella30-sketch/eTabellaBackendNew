import { resolveTimezone, serverTimezone, wallClockTime } from './timezone';

describe('timezone helpers', () => {
  it('resolves a valid IANA zone to itself', () => {
    expect(resolveTimezone('Europe/London')).toBe('Europe/London');
    expect(resolveTimezone('Asia/Kolkata')).toBe('Asia/Kolkata');
  });

  it('falls back to the server zone for absent or invalid names', () => {
    const server = serverTimezone();
    expect(resolveTimezone(undefined)).toBe(server);
    expect(resolveTimezone(null)).toBe(server);
    expect(resolveTimezone('')).toBe(server);
    expect(resolveTimezone('Not/AZone')).toBe(server);
  });

  it('stamps HH:mm:ss wall clock in the requested zone', () => {
    // 2026-08-06T12:00:00Z → 13:00:00 London (BST), 17:30:00 Kolkata.
    const noonUtc = new Date('2026-08-06T12:00:00Z');
    expect(wallClockTime('Europe/London', noonUtc)).toBe('13:00:00');
    expect(wallClockTime('Asia/Kolkata', noonUtc)).toBe('17:30:00');
  });

  it('keeps the legacy HH:mm:ss shape (2-digit 24h, no 24:xx midnight)', () => {
    const midnightLondon = new Date('2026-01-15T00:30:00Z');
    expect(wallClockTime('Europe/London', midnightLondon)).toBe('00:30:00');
    expect(wallClockTime('Europe/London', midnightLondon)).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });
});
