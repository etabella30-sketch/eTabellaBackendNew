/**
 * FeedDataApplyAdapter: the EdgeApplyPort over today's FeedDataService surface (a structural fake here):
 * barriers in the feed queue, the synchronous memory swap before any Redis write, page deletion, restore +
 * read, the paced broadcast plan, the deferred end body, and resolving the live providers beside EventsGateway.
 */
import { Logger } from '@nestjs/common';
import async from 'async';
import { emptyCloudMeta, PageCutter, validateRound, buildRound } from '@app/edge-sync';

import { EventsGateway } from '../events/events.gateway';
import { EclipseSessionService } from '../services/eclipse-session/eclipse-session.service';
import { FeedDataService } from '../services/feed-data/feed-data.service';
import { SessionService } from '../services/session/session.service';
import { FeedDataApplyAdapter, FeedStoreLike, resolveLiveFeedTargets } from './edge-apply.port';
import { IDS, line } from './edge-test-kit.spec';

class FakeManager {
    data: Record<string, Record<number, any[]>> = {};
    setPageData = (s: string, p: number, d: any[]) => {
        (this.data[s] = this.data[s] || {})[p] = d;
    };
    deletePageData = (s: string, p: number) => {
        if (p === -1) delete this.data[s];
        else if (this.data[s]?.[p]) delete this.data[s][p];
        return true;
    };
    getSessionData = (s: string) => this.data[s] || null;
}

function fakeFeed(withQueue: boolean) {
    const manager = new FakeManager();
    const log: string[] = [];
    const feed: FeedStoreLike & { queue?: any; log: string[]; manager: FakeManager } = {
        manager,
        log,
        setPage: jest.fn(async (s: string, p: number, d: any[]) => {
            log.push(`redis:${p}:pages-in-memory=${Object.keys(manager.data[s] || {}).join(',')}`);
            manager.setPageData(s, p, d);
            return true;
        }),
        deleteExtraPages: jest.fn(async (s: string, max: number) => {
            log.push(`deleteExtra:${max}`);
            for (const p of Object.keys(manager.data[s] || {})) if (Number(p) > max) delete manager.data[s][Number(p)];
            return true;
        }),
        restoreFromDiskIfNeeded: jest.fn(async () => undefined),
        readSessionData: jest.fn(async (s: string) => manager.data[s] || {}),
        sessionEnd: jest.fn(async () => true),
    };
    if (withQueue) {
        feed.queue = async.queue(async (task: any, cb: any) => {
            try {
                await task();
            } catch {
                /* FeedDataService swallows task errors */
            }
            cb();
        }, 1);
    }
    return feed;
}

function roundPlan(lines: number, nSesid = IDS.ses, metaPages = 0) {
    const cutter = new PageCutter({ nSesid, rawSeqThrough: 0, rawHashThrough: '' });
    const buf = Array.from({ length: lines }, (_, i) => line(i));
    cutter.boundary(buf, 1, 'h1');
    const built = buildRound({ source: cutter.view(), epoch: 1, rebaseSeq: null, lineage: { appliedRawSeq: null, appliedRawHash: null }, cloud: { digests: [], totalLines: 0 } });
    const meta = emptyCloudMeta(nSesid);
    meta.digests = Array(metaPages).fill('0'.repeat(64));
    const d = validateRound(built.parts[0], meta, { shrinkGuard: false });
    if (d.action !== 'apply') throw new Error(`not applied: ${JSON.stringify(d)}`);
    return d.plan;
}

describe('FeedDataApplyAdapter', () => {
    beforeAll(() => Logger.overrideLogger(false));

    it('runs a barrier as one task of the feed queue, in order with other tasks, passing results and rejections', async () => {
        const feed = fakeFeed(true);
        const adapter = new FeedDataApplyAdapter(() => ({ feed, io: null }));
        const order: string[] = [];
        feed.queue.push(async () => {
            await new Promise(r => setTimeout(r, 20));
            order.push('flush');
        });
        const a = adapter.runBarrier(IDS.ses, async () => {
            order.push('round');
            return 7;
        });
        const b = adapter.runBarrier(IDS.ses, async () => {
            throw new Error('nope');
        });
        expect(await a).toBe(7);
        await expect(b).rejects.toThrow('nope');
        expect(order).toEqual(['flush', 'round']);
    });

    it('serializes barriers on a local chain when the store exposes no queue', async () => {
        const adapter = new FeedDataApplyAdapter(() => ({ feed: fakeFeed(false), io: null }));
        const order: number[] = [];
        await Promise.all([1, 2, 3].map(n => adapter.runBarrier(IDS.ses, async () => {
            await new Promise(r => setTimeout(r, 5 * (4 - n)));
            order.push(n);
        })));
        expect(order).toEqual([1, 2, 3]);
    });

    it('swaps every page of the round into memory before the first Redis write, and deletes pages above the new total', async () => {
        const feed = fakeFeed(true);
        const adapter = new FeedDataApplyAdapter(() => ({ feed, io: null }));
        feed.manager.setPageData(IDS.ses, 9, [line(200)]);
        const plan = roundPlan(60, IDS.ses, 4);
        const out = await adapter.applyRoundAtomic(IDS.ses, plan);
        expect(out).toEqual({ appliedPages: 3, deletedAbove: 3, redisBatched: false });
        expect(feed.log[0]).toBe('redis:1:pages-in-memory=1,2,3');
        expect(feed.log).toContain('deleteExtra:3');
        expect(Object.keys(feed.manager.data[IDS.ses]).map(Number)).toEqual([1, 2, 3]);
        expect(feed.setPage).toHaveBeenCalledTimes(3);
    });

    it('reads the current pages after the disk restore, with numeric page keys', async () => {
        const feed = fakeFeed(false);
        feed.manager.setPageData(IDS.ses, 2, [line(25)]);
        const adapter = new FeedDataApplyAdapter(() => ({ feed, io: null }));
        const pages = await adapter.currentPages(IDS.ses);
        expect(feed.restoreFromDiskIfNeeded).toHaveBeenCalledWith(IDS.ses);
        expect([...pages.keys()]).toEqual([2]);
        await adapter.deletePagesAbove(IDS.ses, 1);
        expect(feed.deleteExtraPages).toHaveBeenCalledWith(IDS.ses, 1);
    });

    it('broadcasts a pure append at once and paces a large rewrite (20 pages per 100 ms)', () => {
        const emits: Array<[string, string, any]> = [];
        const io = { to: (room: string) => ({ emit: (e: string, p: any) => emits.push([room, e, p]) }), emit: jest.fn() };
        const later: Array<[() => void, number]> = [];
        const adapter = new FeedDataApplyAdapter(() => ({ feed: fakeFeed(false), io }), { setTimeout: (fn, ms) => later.push([fn, ms]) });
        adapter.broadcastCut(IDS.ses, { nSesid: IDS.ses, nLines: 25, rev: 4, prevTotal: 10, totalLines: 11, changed: [10], pages: [{ p: 1, d: 'd', lines: Array.from({ length: 11 }, (_, i) => line(i)) }] } as any);
        expect(emits).toEqual([[`S${IDS.ses}`, 'message', expect.objectContaining({ rev: 4, i: 11, date: IDS.ses })]]);
        emits.length = 0;
        const pages = Array.from({ length: 45 }, (_, k) => ({ p: k + 1, d: 'd', lines: [line(k * 25)] }));
        adapter.broadcastCut(IDS.ses, { nSesid: IDS.ses, nLines: 25, rev: 5, prevTotal: 1125, totalLines: 1125, changed: [0], pages } as any);
        expect(emits).toHaveLength(20);
        expect(later.map(l => l[1])).toEqual([100, 200]);
        later.forEach(([fn]) => fn());
        expect(emits).toHaveLength(45);
        expect(emits.every(e => e[1] === 'previous-data' && e[2].rev === 5)).toBe(true);
    });

    it('emits to a session room and to everyone, and survives a missing socket server', () => {
        const emits: any[] = [];
        const io = { to: (room: string) => ({ emit: (e: string, p: any) => emits.push([room, e, p]) }), emit: (e: string, p: any) => emits.push(['*', e, p]) };
        const adapter = new FeedDataApplyAdapter(() => ({ feed: fakeFeed(false), io }));
        adapter.emitToSession(IDS.ses, 'edge-status', { s: 1 });
        adapter.emitToAll('on-notification', { n: 1 });
        expect(emits).toEqual([[`S${IDS.ses}`, 'edge-status', { s: 1 }], ['*', 'on-notification', { n: 1 }]]);
        const none = new FeedDataApplyAdapter(() => ({ feed: null, io: null }));
        expect(() => none.broadcastCut(IDS.ses, { nSesid: IDS.ses, nLines: 25, rev: 1, prevTotal: 0, totalLines: 1, changed: [0], pages: [{ p: 1, d: 'd', lines: [line(0)] }] } as any)).not.toThrow();
        expect(none.ready()).toBe(false);
    });

    it('sends edge-status through the gateway (full cloud-viewer payload), falling back to the narrow emit', () => {
        const emits: any[] = [];
        const io = { to: (room: string) => ({ emit: (e: string, p: any) => emits.push([room, e, p]) }), emit: (e: string, p: any) => emits.push(['*', e, p]) };
        const announced: string[] = [];
        let known = true;
        const viewers = { announceEdgeStatus: (s: string) => (announced.push(s), known) };
        const adapter = new FeedDataApplyAdapter(() => ({ feed: fakeFeed(false), io, viewers }));
        adapter.emitToSession(IDS.ses, 'edge-status', { s: 1 });
        expect(announced).toEqual([IDS.ses]);
        expect(emits).toEqual([]);
        // Not a venue session for the gateway (or no provider): the module's own payload goes out.
        known = false;
        adapter.emitToSession(IDS.ses, 'edge-status', { s: 2 });
        expect(emits).toEqual([[`S${IDS.ses}`, 'edge-status', { s: 2 }]]);
        // Other events never go through the gateway.
        adapter.emitToSession(IDS.ses, 'realtime-events', { e: 1 });
        expect(announced).toEqual([IDS.ses, IDS.ses]);
        expect(emits[1]).toEqual([`S${IDS.ses}`, 'realtime-events', { e: 1 }]);
    });

    it('C5: a feed-path change makes the viewer gateway forget the session\'s ingest-lane verdict; without one nothing throws', () => {
        const forgot: string[] = [];
        const viewers = { announceEdgeStatus: () => true, forgetIngestLane: (s: string) => void forgot.push(s) };
        new FeedDataApplyAdapter(() => ({ feed: fakeFeed(false), io: null, viewers })).feedPathChanged(IDS.ses);
        expect(forgot).toEqual([IDS.ses]);
        // No gateway, an older gateway without the method, a throwing one, an unresolvable target: all quiet.
        expect(() => new FeedDataApplyAdapter(() => ({ feed: fakeFeed(false), io: null })).feedPathChanged(IDS.ses)).not.toThrow();
        expect(() => new FeedDataApplyAdapter(() => ({ feed: fakeFeed(false), io: null, viewers: { announceEdgeStatus: () => true } })).feedPathChanged(IDS.ses)).not.toThrow();
        const throwing = { announceEdgeStatus: () => true, forgetIngestLane: () => { throw new Error('x'); } };
        expect(() => new FeedDataApplyAdapter(() => ({ feed: fakeFeed(false), io: null, viewers: throwing })).feedPathChanged(IDS.ses)).not.toThrow();
        expect(() => new FeedDataApplyAdapter(() => { throw new Error('not yet'); }).feedPathChanged(IDS.ses)).not.toThrow();
    });

    it('runs the deferred end body through SessionService when present, else the same steps itself', async () => {
        const session = { completeGatedSessionEnd: jest.fn(async () => ({ msg: 1 })) };
        const viaSession = new FeedDataApplyAdapter(() => ({ feed: fakeFeed(false), io: null, session }));
        expect(await viaSession.completeSessionEnd(IDS.ses, IDS.caseA)).toMatchObject({ ok: true, via: 'session-service' });
        expect(session.completeGatedSessionEnd).toHaveBeenCalledWith(IDS.ses, IDS.caseA);

        const feed = fakeFeed(false);
        const routes = { removeEclipseRoute: jest.fn(async () => undefined) };
        const emits: any[] = [];
        const io = { to: () => ({ emit: jest.fn() }), emit: (e: string, p: any) => emits.push([e, p]) };
        const fallback = new FeedDataApplyAdapter(() => ({ feed, io, session: null, routes }));
        expect(await fallback.completeSessionEnd(IDS.ses, IDS.caseA)).toEqual({ ok: true, via: 'fallback' });
        expect(feed.sessionEnd).toHaveBeenCalledWith(IDS.ses);
        expect(routes.removeEclipseRoute).toHaveBeenCalledWith(IDS.ses);
        expect(emits).toEqual([['on-notification', { msg: 1, nSesid: IDS.ses, nCaseid: IDS.caseA, cStatus: 'E' }]]);

        const throwing = new FeedDataApplyAdapter(() => ({ feed, io: null, session: { completeGatedSessionEnd: async () => { throw new Error('x'); } } }));
        expect(await throwing.completeSessionEnd(IDS.ses, null)).toMatchObject({ ok: false, via: 'session-service' });
        expect(await new FeedDataApplyAdapter(() => ({ feed: null, io: null })).completeSessionEnd(IDS.ses, null)).toEqual({ ok: false, via: 'none' });
    });

    it('treats a failing target resolver as "not ready" (rounds then answer BUSY)', () => {
        const adapter = new FeedDataApplyAdapter(() => {
            throw new Error('not yet');
        });
        expect(adapter.ready()).toBe(false);
    });

    it('finds the FeedDataService that lives beside EventsGateway, not another module\'s copy', () => {
        const live = { live: true };
        const other = { live: false };
        const wrap = (entries: Array<[any, any]>) => ({ providers: new Map(entries.map(([t, i]) => [t, { instance: i }])) });
        const modules = new Map<string, any>([
            ['transcript', wrap([[FeedDataService, other]])],
            ['realtime', wrap([[EventsGateway, {}], [FeedDataService, live], [SessionService, { s: 1 }], [EclipseSessionService, { e: 1 }]])],
        ]);
        expect(resolveLiveFeedTargets(modules)).toEqual({ feed: live, session: { s: 1 }, routes: { e: 1 }, viewers: {} });
        expect(resolveLiveFeedTargets(new Map([['transcript', wrap([[FeedDataService, other]])]]))).toEqual({ feed: null });
        expect(resolveLiveFeedTargets(null)).toEqual({ feed: null });
    });
});
