import type { EdgeLocalState } from '@app/edge-sync';

import { EDGE_TIMING, edgeRoomChip } from '../contracts';
import { deriveFeedState, FeedStateInput, KernelSessionFacts, phaseOfFeed, resendFromMs, sessionArmable, sessionEndPending, sessionStaysOpen } from './kernel.port';

const T = 1_000_000_000;
const base: FeedStateInput = { endedAtMs: null, firstLineAtMs: null, lastLineAtMs: null, linkUp: false, nowMs: T };

describe('deriveFeedState (contracts/status.ts EdgeFeedState)', () => {
    it('is waiting before the first line, link up or down', () => {
        expect(deriveFeedState(base)).toBe('waiting');
        expect(deriveFeedState({ ...base, linkUp: true })).toBe('waiting');
    });

    it('is ended once SESSION_END is journaled, whatever else holds', () => {
        expect(deriveFeedState({ ...base, endedAtMs: T - 1 })).toBe('ended');
        expect(deriveFeedState({ ...base, endedAtMs: T - 1, lastLineAtMs: T, linkUp: true })).toBe('ended');
        expect(deriveFeedState({ ...base, endedAtMs: 0 })).toBe('ended');
    });

    it('is stopped when lines arrived and the link is down', () => {
        expect(deriveFeedState({ ...base, firstLineAtMs: T - 10, lastLineAtMs: T - 1 })).toBe('stopped');
    });

    it('is live within the live window (inclusive), quiet after it', () => {
        const at = (age: number) => deriveFeedState({ ...base, linkUp: true, firstLineAtMs: T - 10 * 60_000, lastLineAtMs: T - age });
        expect(at(0)).toBe('live');
        expect(at(EDGE_TIMING.liveLineWindowMs)).toBe('live');
        expect(at(EDGE_TIMING.liveLineWindowMs + 1)).toBe('quiet');
    });

    it('falls back to the first line when no last line is recorded', () => {
        expect(deriveFeedState({ ...base, linkUp: true, firstLineAtMs: T - 1 })).toBe('live');
        expect(deriveFeedState({ ...base, linkUp: true, firstLineAtMs: T - EDGE_TIMING.liveLineWindowMs - 1 })).toBe('quiet');
    });

    it('treats undefined like null (non-strict callers)', () => {
        expect(deriveFeedState({ ...base, endedAtMs: undefined, firstLineAtMs: undefined, lastLineAtMs: undefined } as unknown as FeedStateInput)).toBe('waiting');
    });

    it('feeds the room chip with the contract precedence', () => {
        expect(edgeRoomChip(deriveFeedState({ ...base, firstLineAtMs: T - 1, lastLineAtMs: T - 1 }), 'paused')).toBe('feed-stopped');
        expect(edgeRoomChip(deriveFeedState({ ...base, linkUp: true, lastLineAtMs: T }), 'paused')).toBe('offline');
    });
});

describe('phaseOfFeed', () => {
    it('maps feed states to the dashboard phase', () => {
        expect(phaseOfFeed('waiting')).toBe('not-started');
        expect(phaseOfFeed('live')).toBe('live');
        expect(phaseOfFeed('quiet')).toBe('live');
        expect(phaseOfFeed('stopped')).toBe('live');
        expect(phaseOfFeed('ended')).toBe('ended');
    });
});

describe('resendFromMs', () => {
    it('floors the gap start to the minute', () => {
        const tenThirtyOne = Date.UTC(2026, 9, 1, 10, 31, 0);
        expect(resendFromMs(tenThirtyOne + 5_000)).toBe(tenThirtyOne);
        expect(resendFromMs(tenThirtyOne)).toBe(tenThirtyOne);
        expect(resendFromMs(tenThirtyOne + 59_999)).toBe(tenThirtyOne);
    });
});

describe('which stored sessions the kernel opens, arms and ends (start() and assignments-changed)', () => {
    const live: KernelSessionFacts = { localState: 'live', cloudOp: 'upsert', endedAtMs: null, sealedAtMs: null, purgedAtMs: null };
    const rules = (s: KernelSessionFacts) => [sessionStaysOpen(s), sessionArmable(s), sessionEndPending(s)];

    it('arms every recording state, a frozen uplink included (D19: still live in the room)', () => {
        for (const localState of ['assigned', 'armed', 'live', 'recovering', 'frozen'] as EdgeLocalState[]) {
            expect([localState, ...rules({ ...live, localState })]).toEqual([localState, true, true, false]);
        }
    });

    it('resumes the end of a session the cloud asked to end before a restart (cloudOp end, not yet ended)', () => {
        expect(rules({ ...live, cloudOp: 'end' })).toEqual([true, false, true]);
        expect(rules({ ...live, localState: 'assigned', cloudOp: 'end' })).toEqual([true, false, true]);
    });

    it('resumes a drain interrupted by a restart (ending, not yet ended)', () => {
        expect(rules({ ...live, localState: 'ending' })).toEqual([true, false, true]);
        expect(rules({ ...live, localState: 'ending', cloudOp: 'end' })).toEqual([true, false, true]);
    });

    it('keeps an ended but unsealed session open, read-only (uplink pushes and seals it; the room keeps reading)', () => {
        expect(rules({ ...live, localState: 'ending', cloudOp: 'end', endedAtMs: 1 })).toEqual([true, false, false]);
        expect(rules({ ...live, endedAtMs: 1 })).toEqual([true, false, false]);
        expect(rules({ ...live, endedAtMs: 0 })).toEqual([true, false, false]);
    });

    it('drops a sealed, complete or purged session (and never runs the Phase-4 states)', () => {
        expect(rules({ ...live, localState: 'ending', endedAtMs: 1, sealedAtMs: 2 })).toEqual([false, false, false]);
        expect(rules({ ...live, localState: 'sealed', endedAtMs: 1 })).toEqual([false, false, false]);
        expect(rules({ ...live, localState: 'complete', endedAtMs: 1, sealedAtMs: 2 })).toEqual([false, false, false]);
        expect(rules({ ...live, localState: 'purged', purgedAtMs: 3 })).toEqual([false, false, false]);
        expect(rules({ ...live, purgedAtMs: 3 })).toEqual([false, false, false]);
        expect(rules({ ...live, localState: 'fenced' })).toEqual([false, false, false]);
        expect(rules({ ...live, localState: 'rebasing' })).toEqual([false, false, false]);
    });

    it('treats undefined like null (non-strict callers)', () => {
        const loose = { ...live, endedAtMs: undefined, sealedAtMs: undefined, purgedAtMs: undefined } as unknown as KernelSessionFacts;
        expect(rules(loose)).toEqual([true, true, false]);
    });

    it('never arms and ends the same session', () => {
        const states: EdgeLocalState[] = ['assigned', 'armed', 'live', 'ending', 'sealed', 'complete', 'purged', 'recovering', 'frozen', 'fenced', 'rebasing'];
        for (const localState of states) {
            for (const cloudOp of ['upsert', 'end'] as const) {
                for (const endedAtMs of [null, 5]) {
                    const s = { ...live, localState, cloudOp, endedAtMs };
                    expect(sessionArmable(s) && sessionEndPending(s)).toBe(false);
                    if (sessionArmable(s) || sessionEndPending(s)) expect(sessionStaysOpen(s)).toBe(true);
                }
            }
        }
    });
});
