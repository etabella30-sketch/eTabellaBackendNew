/**
 * MarkEventsService: tells devices that the marks of a session changed, so an open Realtime page (main and compare
 * panes) reloads them without a refresh (user decision 2026-10-05).
 *
 * - It never sends a mark: each device reloads its own marks with its own rights, so the private-by-default rule
 *   (the author on any device plus the people a mark is shared with; Quick Marks the author only) keeps deciding
 *   who sees what.
 * - MarkWriteInterceptor calls `changed()` after a successful mark write, with the mark's audience before and after
 *   the write (people removed from a share are told too, so the mark disappears for them).
 * - Devices: per (session, user), the notices of MARK_EVENTS_WINDOW_MS (300 ms, from the first one) become ONE
 *   `marks-changed {nSesid, kinds, by, atMs}` to that user's own room `U<user>` on the root namespace. Not the
 *   session room (owner-only Quick Marks would make every viewer reload for nothing, and reviewers of an ended
 *   session are not in it), and never `realtime-events` (the live feed store re-syncs the transcript text on every
 *   type it does not know).
 * - The venue box: per session, the same window gathers the users into ONE `c.marks {nSesid, users, kinds, atMs}`
 *   (at most 200 users each) on /edge, fire and forget, only when EDGE_ENABLED is on and the session's box is
 *   online. Writes made on the box reach the cloud as ordinary HTTP, so the box's other devices get the echo too.
 * - RT_MARK_EVENTS=0 / false / off / no turns all of it off (default on).
 *
 * EventsGateway hands it the root socket.io server in afterInit, the same hand-off AnnotTransferService uses.
 * Provided once, app-wide (MarkEventsModule), because FactController is registered in two modules.
 */
import { Injectable, Logger, OnModuleDestroy, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { C_MARKS_MAX_USERS, CMarks, EdgeEvent, MARK_KINDS, MarkKind, MARKS_CHANGED_EVENT, MarksChangedNotice } from '@app/edge-sync';

import { EdgeRegistryService } from '../../edge/edge-registry.service';
import { EdgeSyncService } from '../../edge/edge-sync.service';
import { edgeEnabled } from '../../edge/edge.types';
import { markId } from './mark-audience.sql';

/** Notices for one (session, user), or one session's box, within this long become one. */
export const MARK_EVENTS_WINDOW_MS = 300;

/** The kill switch: any of these turns live mark sync off; anything else (or nothing) leaves it on. */
export const MARK_EVENTS_CONFIG = 'RT_MARK_EVENTS';
const OFF_VALUES = new Set(['0', 'false', 'off', 'no']);

/** One successful mark write, as MarkWriteInterceptor reports it. */
export interface MarkChange {
    nSesid: string;
    kind: MarkKind;
    /** the writer (the token user; a box write arrives with the real user's edge token) */
    by: string;
    /** who could see the mark before or after the write */
    users: string[];
}

/** The part of the socket.io server used: rooms on the root namespace. */
export interface MarkEventsServer {
    to(room: string): { emit(event: string, payload: unknown): unknown };
}

interface UserGroup {
    nSesid: string;
    user: string;
    kinds: Set<MarkKind>;
    /** writers in arrival order, each once */
    writers: string[];
    atMs: number;
    timer: ReturnType<typeof setTimeout>;
}

interface BoxGroup {
    users: Set<string>;
    kinds: Set<MarkKind>;
    atMs: number;
    timer: ReturnType<typeof setTimeout>;
}

const ordered = (kinds: Set<MarkKind>): MarkKind[] => MARK_KINDS.filter(k => kinds.has(k));

@Injectable()
export class MarkEventsService implements OnModuleDestroy {
    private readonly logger = new Logger('MarkEvents');
    /** The root socket.io server; set by EventsGateway.afterInit. Null until then: nothing is sent. */
    server: MarkEventsServer | null = null;
    private readonly userGroups = new Map<string, UserGroup>();
    private readonly boxGroups = new Map<string, BoxGroup>();

    constructor(
        private readonly config: ConfigService,
        // From EdgeModule; absent in a container without it (nothing then goes to a box).
        @Optional() private readonly edgeSync?: EdgeSyncService,
        @Optional() private readonly edgeRegistry?: EdgeRegistryService,
    ) { }

    /** False when RT_MARK_EVENTS turns live mark sync off. */
    enabled(): boolean {
        const raw = String(this.config?.get(MARK_EVENTS_CONFIG) ?? '').trim().toLowerCase();
        return !OFF_VALUES.has(raw);
    }

    /** A mark write succeeded: queue the notices. Never throws, never waits. */
    changed(change: MarkChange): void {
        if (!this.enabled()) return;
        const nSesid = markId(change?.nSesid);
        const by = markId(change?.by);
        const kind = change?.kind;
        if (!nSesid || !by || !(MARK_KINDS as readonly string[]).includes(kind)) return;
        const users = [...new Set((Array.isArray(change.users) ? change.users : []).map(markId).filter((u): u is string => !!u))];
        if (!users.length) return;
        const atMs = Date.now();
        for (const user of users) this.queueUser(nSesid, user, kind, by, atMs);
        if (edgeEnabled(this.config) && this.edgeSync && this.edgeRegistry) this.queueBox(nSesid, users, kind, atMs);
    }

    onModuleDestroy(): void {
        for (const g of this.userGroups.values()) clearTimeout(g.timer);
        for (const g of this.boxGroups.values()) clearTimeout(g.timer);
        this.userGroups.clear();
        this.boxGroups.clear();
    }

    // -----------------------------------------------------------------------------------------------------------
    // Devices: U<user>
    // -----------------------------------------------------------------------------------------------------------

    private queueUser(nSesid: string, user: string, kind: MarkKind, by: string, atMs: number): void {
        const key = `${nSesid} ${user}`;
        const group = this.userGroups.get(key);
        if (group) {
            group.kinds.add(kind);
            if (!group.writers.includes(by)) group.writers.push(by);
            group.atMs = atMs;
            return;
        }
        const timer = setTimeout(() => this.flushUser(key), MARK_EVENTS_WINDOW_MS);
        timer.unref?.();
        this.userGroups.set(key, { nSesid, user, kinds: new Set([kind]), writers: [by], atMs, timer });
    }

    private flushUser(key: string): void {
        const g = this.userGroups.get(key);
        this.userGroups.delete(key);
        if (!g || !this.server) return;
        const notice: MarksChangedNotice = { nSesid: g.nSesid, kinds: ordered(g.kinds), by: MarkEventsService.byFor(g.writers, g.user), atMs: g.atMs };
        try {
            this.server.to(`U${g.user}`).emit(MARKS_CHANGED_EVENT, notice);
        } catch (error) {
            this.logger.warn(`marks-changed to U${g.user} not sent: ${(error as Error)?.message ?? error}`);
        }
    }

    /**
     * Who the notice names as the writer. The page skips a notice "by" itself right after its own save (it already
     * reloaded), so when someone else wrote in the same window, the notice names one of them: the recipient then
     * reloads and sees both changes.
     */
    static byFor(writers: string[], recipient: string): string {
        const others = writers.filter(w => w !== recipient);
        return others.length ? others[others.length - 1] : writers[writers.length - 1];
    }

    // -----------------------------------------------------------------------------------------------------------
    // The venue box: c.marks on /edge
    // -----------------------------------------------------------------------------------------------------------

    private queueBox(nSesid: string, users: string[], kind: MarkKind, atMs: number): void {
        const group = this.boxGroups.get(nSesid);
        if (group) {
            for (const u of users) group.users.add(u);
            group.kinds.add(kind);
            group.atMs = atMs;
            return;
        }
        const timer = setTimeout(() => void this.flushBox(nSesid), MARK_EVENTS_WINDOW_MS);
        timer.unref?.();
        this.boxGroups.set(nSesid, { users: new Set(users), kinds: new Set([kind]), atMs, timer });
    }

    private async flushBox(nSesid: string): Promise<void> {
        const g = this.boxGroups.get(nSesid);
        this.boxGroups.delete(nSesid);
        if (!g) return;
        try {
            if (!this.edgeRegistry?.gateway) return;
            const binding = await this.edgeSync?.binding(nSesid);
            const box = binding && !binding.bDeleted ? markId(binding.nEdgeid) : null;
            const link = this.edgeRegistry.gateway;
            if (!box || !link || typeof link.notify !== 'function' || !link.connection(box)) return;
            const users = [...g.users];
            for (let i = 0; i < users.length; i += C_MARKS_MAX_USERS) {
                const body: CMarks = { nSesid, users: users.slice(i, i + C_MARKS_MAX_USERS), kinds: ordered(g.kinds), atMs: g.atMs };
                if (!link.notify(box, EdgeEvent.marks, body)) return;
            }
        } catch (error) {
            this.logger.warn(`c.marks for session ${nSesid} not sent: ${(error as Error)?.message ?? error}`);
        }
    }
}
