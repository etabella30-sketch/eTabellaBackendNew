import { hearingTimecode, sourceHearingTimecode, withinLiveQfactGap } from './hearing-time';

describe('QFACT Express hearing-time contract', () => {
  const time = sourceHearingTimecode;
  it.each([['10:00:29:00', true], ['10:00:30:00', true], ['10:00:30:01', false], ['10:00:31:00', false]])
    ('uses the exact inclusive 30-second source gap: %s', (right, expected) => {
      expect(withinLiveQfactGap(time('10:00:00:00'), time(right))).toBe(expected);
    });
  it('applies the gap to each adjacent pair, not the first line', () => {
    const stamps = ['10:00:00:00', '10:00:10:00', '10:00:35:00', '10:01:10:00'].map(time);
    expect(stamps.slice(1).map((stamp, index) => withinLiveQfactGap(stamps[index], stamp))).toEqual([true, true, false]);
  });
  it('accepts genuine midnight and rejects backward clocks', () => {
    expect(withinLiveQfactGap(time('23:59:50:00'), time('00:00:10:00'))).toBe(true);
    expect(withinLiveQfactGap(time('10:00:10:00'), time('10:00:00:00'))).toBe(false);
    expect(time('00:00:00:00')?.frames).toBe(0);
  });
  it.each(['', '10:00:00', '24:00:00:00', '10:60:00:00', '10:00:60:00', '10:00:00:30'])
    ('rejects malformed or unavailable source time: %s', value => expect(time(value)).toBeNull());
  it('requires provenance and never substitutes a receipt/display timestamp', () => {
    expect(hearingTimecode({ source: 'receive-time', frames: 100 })).toBeNull();
    expect(hearingTimecode('10:00:00')).toBeNull();
    expect(withinLiveQfactGap(null, time('10:00:00:00'))).toBe(false);
  });
});
