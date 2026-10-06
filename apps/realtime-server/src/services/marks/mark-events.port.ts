/**
 * How EventsGateway hands the root socket.io server to MarkEventsService (live mark sync, user decision 2026-10-05)
 * without importing the class. MarkEventsService imports the edge services, and edge-apply.port imports
 * EventsGateway; a class import here would close a require cycle in which EDGE_APPLY_PORT (or EdgeSyncService) is
 * still undefined when the other side is decorated, depending on which file loads first. This file imports nothing.
 */

/** The injection token MarkEventsModule binds to the one MarkEventsService. */
export const MARK_EVENTS_SINK = 'RT_MARK_EVENTS_SINK';

/** What EventsGateway sets: the root namespace server (U<user> rooms). */
export interface MarkEventsServerSink {
    server: { to(room: string): { emit(event: string, payload: unknown): unknown } } | null;
}
