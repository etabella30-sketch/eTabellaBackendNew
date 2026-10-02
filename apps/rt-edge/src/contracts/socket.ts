/**
 * LAN socket.io gateway on the box (default path `/socket.io`, same origin) — the parts the box screens add
 * (spec §8.2, DR6, DR8, DR9, D7).
 *
 * Unchanged from the cloud gateway and NOT redefined here: `join-room` / `leave-room` (`S<nSesid>`),
 * `fetch-data` → `previous-data` + `previous-data-end` (newest-first, rev-tagged, D11/D12), `message`,
 * `feed-refresh-data`, `realtime-events`, `on-notification` (`cStatus` 'R' at arm, 'E' at end).
 *
 * Handshake: `auth: { token }` with the same bearer token the HTTP calls use (online, room-code or operator).
 * `query.nUserid` is ignored; identity comes from the token, and `join-room` is checked against the cached roster
 * (a room-code token reaches only its own session, DR10).
 *
 * The box events below have their own names, so they never reach the feed store's `realtime-events` refetch path.
 */

import type { EdgePartPointer } from './local-cases';
import type { EdgeSessionStatus } from './status';

/** Server → client event names added by the box. */
export const EDGE_SOCKET_EVENTS = {
    /**
     * `edge-status`: one `EdgeSessionStatus` to the `S<nSesid>` room — right after `join-room`, on every change,
     * and at least every `EDGE_TIMING.statusHeartbeatMs` (the heartbeat that makes "stale" detectable).
     * Box-admin sockets get the `operator` field too.
     */
    status: 'edge-status',
    /** `edge-session`: one `EdgeSessionEvent` to the `S<nSesid>` room when the session changes phase. */
    session: 'edge-session',
} as const;

export type EdgeSocketEventName = typeof EDGE_SOCKET_EVENTS[keyof typeof EDGE_SOCKET_EVENTS];

/** Payload of `edge-status`. */
export type EdgeStatusEvent = EdgeSessionStatus;

/**
 * Payload of `edge-session` (`seq` is shared with `edge-status` for the same session):
 * - `first-line`: the first line arrived — the DR8 waiting state opens the transcript by itself (only on the page of
 *   the session the person chose; the transcript lines themselves still come by `message`);
 * - `ended`: SESSION_END journaled — DR9 "Session ended 13:02 · keep reading; the final transcript comes after
 *   publish" (the legacy `on-notification {cStatus:'E'}` is still sent too);
 * - `split`: an admin used "Split to direct cloud" (D7) — DR9 "This hearing continues on etabella.net as Part 2"
 *   with "Open Part 2". While the box itself is unreachable the FE cannot get this event; it asks the cloud instead.
 */
export type EdgeSessionEvent =
    | { readonly type: 'first-line'; readonly nSesid: string; readonly seq: number; readonly atMs: number }
    | { readonly type: 'ended'; readonly nSesid: string; readonly seq: number; readonly endedAtMs: number }
    | { readonly type: 'split'; readonly nSesid: string; readonly seq: number; readonly continuedAs: EdgePartPointer };

export type EdgeSessionEventType = EdgeSessionEvent['type'];
