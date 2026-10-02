import { EDGE_TIMING } from '../contracts';
import { buildSessionStatus, isLinkUp, markingOf, normalizeCloudLink, normalizeTransmitterLink, partPointer, roomStatus, sessionCloudUrl, venueOf } from './status';
import { kernelView, linkOf, NOW, sessionRecord, syncOf } from './testing/ops-fakes';

const UP = { state: 'up' as const, sinceMs: NOW - 3_600_000 };
const DOWN = { state: 'down' as const, sinceMs: NOW - 120_000 };

describe('status rules (DR6, DR8, DR9; CONTRACTS.md §9.1)', () => {
    it('venue: offline without the uplink, catching-up while anything is unconfirmed, online otherwise', () => {
        expect(venueOf(false, syncOf())).toBe('offline');
        expect(venueOf(true, null)).toBe('online');
        expect(venueOf(true, syncOf())).toBe('online');
        expect(venueOf(true, syncOf({ dirtyPages: 2 }))).toBe('catching-up');
        expect(venueOf(true, syncOf({ lagLines: 5 }))).toBe('catching-up');
        expect(venueOf(true, syncOf({ lagSec: 18 }))).toBe('catching-up');
        expect(venueOf(true, syncOf({ lagBytes: 300 }))).toBe('catching-up');
    });

    it('marking pauses only while the internet is down (unknown at boot does not pause it)', () => {
        expect(markingOf(DOWN)).toBe('paused');
        expect(markingOf(UP)).toBe('available');
        expect(markingOf({ state: 'unknown', sinceMs: null })).toBe('available');
    });

    it('room chip follows the kernel view; ended → feed stopped → waiting → offline → quiet → live', () => {
        const base = { record: sessionRecord(), internet: UP, nowMs: NOW, startAtMs: NOW - 1_800_000 };
        expect(roomStatus({ ...base, view: kernelView() }).chip).toBe('live');
        expect(roomStatus({ ...base, view: kernelView({ feed: 'quiet' }) }).chip).toBe('quiet');
        expect(roomStatus({ ...base, view: kernelView({ feed: 'quiet' }), internet: DOWN }).chip).toBe('offline');
        expect(roomStatus({ ...base, view: kernelView({ feed: 'waiting', firstLineAtMs: null }), internet: DOWN }).chip).toBe('waiting');
        const stopped = roomStatus({ ...base, view: kernelView({ feed: 'stopped', feedStoppedAtMs: NOW - 60_000 }), internet: DOWN });
        expect(stopped).toMatchObject({ chip: 'feed-stopped', feedStoppedAtMs: NOW - 60_000, internetDownSinceMs: DOWN.sinceMs, marking: 'paused' });
        expect(roomStatus({ ...base, view: kernelView({ feed: 'ended', endedAtMs: NOW - 5_000 }) })).toMatchObject({ chip: 'ended', endedAtMs: NOW - 5_000 });
        // feedStoppedAtMs is only reported while the feed IS stopped.
        expect(roomStatus({ ...base, view: kernelView({ feed: 'live', feedStoppedAtMs: NOW - 1 }) }).feedStoppedAtMs).toBeNull();
    });

    it('without a kernel view the stored record decides (not armed yet, sealed, or after a restart)', () => {
        const base = { internet: UP, nowMs: NOW, startAtMs: null, view: null };
        expect(roomStatus({ ...base, record: sessionRecord() })).toMatchObject({ feed: 'waiting', chip: 'waiting', firstLineAtMs: null, lastLineAtMs: null });
        expect(roomStatus({ ...base, record: sessionRecord({ firstLineAtMs: NOW - 60_000 }) })).toMatchObject({ feed: 'stopped', chip: 'feed-stopped', feedStoppedAtMs: null });
        expect(roomStatus({ ...base, record: sessionRecord({ firstLineAtMs: NOW - 60_000, endedAtMs: NOW - 1_000 }) })).toMatchObject({ feed: 'ended', endedAtMs: NOW - 1_000 });
    });

    it('builds the full edge-status payload, with the operator field only when given', () => {
        const status = buildSessionStatus({
            record: sessionRecord(),
            view: kernelView(),
            sync: syncOf({ lagLines: 4, lagSec: 3, dirtyPages: 1 }),
            uplinkOnline: true,
            internet: UP,
            cloudOrigin: 'https://etabella.net',
            seq: 42,
            nowMs: NOW,
            venueSince: NOW - 10_000,
            startAtMs: NOW - 1_800_000,
        });
        expect(status).toEqual({
            nSesid: 's1',
            seq: 42,
            atMs: NOW,
            venue: 'catching-up',
            lagLines: 4,
            lagSec: 3,
            since: NOW - 10_000,
            lastSyncAt: NOW - 4_000,
            catConnected: true,
            room: {
                chip: 'live',
                feed: 'live',
                marking: 'available',
                startAtMs: NOW - 1_800_000,
                firstLineAtMs: NOW - 1_800_000,
                lastLineAtMs: NOW - 2_000,
                feedStoppedAtMs: null,
                internetDownSinceMs: null,
                endedAtMs: null,
            },
            continuedAs: null,
        });
        expect('operator' in status).toBe(false);
        const operator = { checkedAtMs: NOW, stale: false, transmitter: linkOf(), cloud: normalizeCloudLink({ state: 'synced', sinceMs: 1, lagSec: 0, lagLines: 0, pendingPages: 0, lastSyncedAtMs: 2 }), problems: 0, readinessToDo: 0 };
        expect(buildSessionStatus({ record: sessionRecord(), view: null, sync: null, uplinkOnline: false, internet: UP, cloudOrigin: 'x', seq: 1, nowMs: NOW, venueSince: null, startAtMs: null, operator }).operator).toBe(operator);
    });

    it('points to Part 2 after a split (DR9), with a time even when the cloud gave none', () => {
        const next = { nSesid: 's2', nPartNo: 2, splitAtMs: NOW - 1_000 };
        expect(partPointer(sessionRecord({ next }), 'https://etabella.net/')).toEqual({ nSesid: 's2', nPartNo: 2, cloudUrl: 'https://etabella.net/rt/session/s2', splitAtMs: NOW - 1_000 });
        expect(partPointer(sessionRecord({ next: { ...next, splitAtMs: null }, endRequestedAtMs: NOW - 2_000 }), 'https://etabella.net')?.splitAtMs).toBe(NOW - 2_000);
        expect(partPointer(sessionRecord({ next: { ...next, splitAtMs: null }, endRequestedAtMs: null, updatedAtMs: NOW - 3_000 }), 'https://etabella.net')?.splitAtMs).toBe(NOW - 3_000);
        expect(partPointer(sessionRecord(), 'https://etabella.net')).toBeNull();
        expect(sessionCloudUrl('https://etabella.net', 'a b')).toBe('https://etabella.net/rt/session/a%20b');
    });

    it('operator chip transmitter segment: quiet stays neutral up to 10 min, then warn (DR6)', () => {
        const quiet = (lastLineAtMs: number | null, sinceMs: number | null) => normalizeTransmitterLink(linkOf({ state: 'quiet', lastLineAtMs, sinceMs }), NOW).quietLevel;
        expect(quiet(NOW - EDGE_TIMING.quietNeutralMs, null)).toBe('neutral');
        expect(quiet(NOW - EDGE_TIMING.quietNeutralMs - 1, null)).toBe('warn');
        expect(quiet(null, NOW - 60_000)).toBe('neutral');
        expect(quiet(null, null)).toBe('neutral');
        expect(normalizeTransmitterLink(linkOf({ state: 'live', quietLevel: 'warn' }), NOW).quietLevel).toBeNull();
        const live = linkOf();
        expect(normalizeTransmitterLink(live, NOW)).toBe(live);
    });

    it('operator chip cloud segment: "synced" only after a cloud confirmation (DR6)', () => {
        const cloud = { state: 'synced' as const, sinceMs: NOW, lagSec: 0, lagLines: 0, pendingPages: 0, lastSyncedAtMs: null };
        expect(normalizeCloudLink(cloud).state).toBe('behind');
        expect(normalizeCloudLink({ ...cloud, lastSyncedAtMs: NOW - 1 }).state).toBe('synced');
        expect(normalizeCloudLink({ ...cloud, state: 'behind', lagSec: 18 })).toEqual({ ...cloud, state: 'behind', lagSec: 18 });
    });

    it('link up means a connection is carried', () => {
        expect(['connected-no-session', 'live', 'quiet'].every(s => isLinkUp(s as never))).toBe(true);
        expect(['not-set-up', 'waiting', 'connecting', 'disconnected'].some(s => isLinkUp(s as never))).toBe(false);
    });
});
