/**
 * Rules about a stored session that auth (room-code reach, issuing) and the LAN (dashboard, picker) must apply the
 * same way. Pure: they read a `BoxSessionRecord` (and, when the kernel holds the session open, its live view).
 */
import type { EdgeLocalState } from '@app/edge-sync';

import type { EdgeSessionLocalState, EdgeSessionPhase } from '../contracts';
import type { BoxSessionRecord, KernelSessionView } from '../ports';

/** Local states after the seal: the transcript is final, the kernel no longer holds the session. */
const SEALED_STATES: ReadonlySet<EdgeLocalState> = new Set<EdgeLocalState>(['sealed', 'complete', 'purged']);

/** Ids compare case-insensitively (uuids from the cloud, the token claims are lower case). */
export function idKey(id: unknown): string {
    return String(id ?? '').trim().toLowerCase();
}

export function sameId(a: unknown, b: unknown): boolean {
    const ka = idKey(a);
    return ka !== '' && ka === idKey(b);
}

/** Unknown, purged (tombstone) or soft-deleted in the cloud: nobody may see or open it on the box. */
export function isSessionGone(s: BoxSessionRecord | null | undefined): boolean {
    return !s || s.localState === 'purged' || s.purgedAtMs != null || s.deleted === true;
}

/** SESSION_END journaled (or sealed since): the hearing is over in the room (DR9 "Session ended"). */
export function isSessionEnded(s: BoxSessionRecord | null | undefined, view?: KernelSessionView | null): boolean {
    if (!s) return false;
    if (view && view.endedAtMs != null) return true;
    return s.endedAtMs != null || s.sealedAtMs != null || SEALED_STATES.has(s.localState);
}

/** Ended, or the cloud asked for the end (draining / split Part 1): no new room codes are issued for it. */
export function isSessionEnding(s: BoxSessionRecord | null | undefined, view?: KernelSessionView | null): boolean {
    if (!s) return false;
    return isSessionEnded(s, view) || s.cloudOp === 'end' || s.endRequestedAtMs != null || s.localState === 'ending';
}

/**
 * What a person sees of the session (contracts `EdgeSessionPhase`): the kernel's live phase when it holds the session
 * open, else from the stored record (first line kept across restarts, SESSION_END, the seal).
 */
export function sessionPhaseOf(s: BoxSessionRecord, view?: KernelSessionView | null): EdgeSessionPhase {
    if (view) return view.phase;
    if (isSessionEnded(s)) return 'ended';
    return s.firstLineAtMs != null ? 'live' : 'not-started';
}

/** The edge-local state as the contract names it (Phase-4 states never reach v1 screens; purged is never listed). */
export function contractLocalState(state: EdgeLocalState): EdgeSessionLocalState {
    switch (state) {
        case 'fenced':
        case 'rebasing':
            return 'frozen';
        case 'purged':
            return 'complete';
        default:
            return state;
    }
}
