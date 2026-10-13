/** Source timecode provenance, kept separately from display/receipt timestamps. */
export const HEARING_TIME_SLOT = 10;
export const HEARING_FRAMES_PER_SECOND = 30;
export const LIVE_QFACT_GAP_FRAMES = 30 * HEARING_FRAMES_PER_SECOND;
export const HEARING_DAY_FRAMES = 24 * 60 * 60 * HEARING_FRAMES_PER_SECOND;

export interface HearingTimecode {
  readonly source: 'hearing-timecode';
  readonly frames: number;
}

/** Only a genuine source timecode may call this; a display time is not provenance. */
export function sourceHearingTimecode(time: string): HearingTimecode | null {
  const match = /^(\d{1,2}):(\d{1,2}):(\d{1,2}):(\d{1,2})$/.exec(time);
  if (!match) return null;
  const [hour, minute, second, frame] = match.slice(1).map(Number);
  if (hour > 23 || minute > 59 || second > 59 || frame > 29) return null;
  return { source: 'hearing-timecode', frames: ((hour * 60 + minute) * 60 + second) * HEARING_FRAMES_PER_SECOND + frame };
}

export function hearingTimecode(value: unknown): HearingTimecode | null {
  if (!value || typeof value !== 'object') return null;
  const stamp = value as HearingTimecode;
  return stamp.source === 'hearing-timecode' && Number.isInteger(stamp.frames)
    && stamp.frames >= 0 && stamp.frames < HEARING_DAY_FRAMES ? stamp : null;
}

/** Pairwise source gap, including midnight. Backward/reset clocks do not qualify. */
export function withinLiveQfactGap(left: HearingTimecode | null, right: HearingTimecode | null): boolean {
  if (!left || !right) return false;
  const gap = (right.frames - left.frames + HEARING_DAY_FRAMES) % HEARING_DAY_FRAMES;
  return gap <= LIVE_QFACT_GAP_FRAMES;
}
