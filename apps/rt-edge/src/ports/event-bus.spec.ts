import { InMemoryEdgeEventBus } from './event-bus';

const status = (nSesid: string) => ({ nSesid, cause: 'line' as const, atMs: 1 });

describe('InMemoryEdgeEventBus', () => {
    it('delivers synchronously, in subscription order, only to listeners of that event', () => {
        const bus = new InMemoryEdgeEventBus();
        const seen: string[] = [];
        bus.subscribe('session-status', e => seen.push(`a:${e.nSesid}`));
        bus.subscribe('session-status', e => seen.push(`b:${e.nSesid}`));
        bus.subscribe('lan-viewers', e => seen.push(`viewers:${e.count}`));
        bus.publish('session-status', status('s1'));
        expect(seen).toEqual(['a:s1', 'b:s1']);
        bus.publish('lan-viewers', { nSesid: 's1', count: 3 });
        expect(seen).toEqual(['a:s1', 'b:s1', 'viewers:3']);
    });

    it('publishing with no listener is a no-op', () => {
        const bus = new InMemoryEdgeEventBus();
        expect(() => bus.publish('alert', { source: 'ops', tier: 'P2', critical: false, kind: 'DISK_LOW', message: 'm', atMs: 1, nSesid: null, data: null })).not.toThrow();
        expect(bus.listenerCount('alert')).toBe(0);
    });

    it('unsubscribes once (idempotent) and counts listeners', () => {
        const bus = new InMemoryEdgeEventBus();
        const seen: string[] = [];
        const off = bus.subscribe('session-status', e => seen.push(e.nSesid));
        expect(bus.listenerCount('session-status')).toBe(1);
        off();
        off();
        expect(bus.listenerCount('session-status')).toBe(0);
        bus.publish('session-status', status('s1'));
        expect(seen).toEqual([]);
    });

    it('isolates a throwing listener and reports it', () => {
        const errors: Array<[string, unknown]> = [];
        const bus = new InMemoryEdgeEventBus((type, err) => errors.push([type, err]));
        const seen: string[] = [];
        const boom = new Error('boom');
        bus.subscribe('session-status', () => {
            throw boom;
        });
        bus.subscribe('session-status', e => seen.push(e.nSesid));
        expect(() => bus.publish('session-status', status('s1'))).not.toThrow();
        expect(seen).toEqual(['s1']);
        expect(errors).toEqual([['session-status', boom]]);
    });

    it('survives a throwing error reporter', () => {
        const bus = new InMemoryEdgeEventBus(() => {
            throw new Error('reporter down');
        });
        const seen: string[] = [];
        bus.subscribe('session-status', () => {
            throw new Error('x');
        });
        bus.subscribe('session-status', e => seen.push(e.nSesid));
        expect(() => bus.publish('session-status', status('s1'))).not.toThrow();
        expect(seen).toEqual(['s1']);
    });

    it('delivers a re-entrant publish depth-first', () => {
        const bus = new InMemoryEdgeEventBus();
        const seen: string[] = [];
        bus.subscribe('session-event', e => {
            seen.push(`event:${e.type}`);
            bus.publish('session-status', { nSesid: e.nSesid, cause: 'phase', atMs: 2 });
            seen.push('event:after');
        });
        bus.subscribe('session-status', e => seen.push(`status:${e.cause}`));
        bus.publish('session-event', { type: 'first-line', nSesid: 's1', atMs: 1 });
        expect(seen).toEqual(['event:first-line', 'status:phase', 'event:after']);
    });

    it('does not deliver the current event to a listener added during it, and skips one removed during it', () => {
        const bus = new InMemoryEdgeEventBus();
        const seen: string[] = [];
        let offB: () => void = () => undefined;
        bus.subscribe('session-status', () => {
            seen.push('a');
            bus.subscribe('session-status', () => seen.push('late'));
            offB();
        });
        offB = bus.subscribe('session-status', () => seen.push('b'));
        bus.publish('session-status', status('s1'));
        expect(seen).toEqual(['a']);
        bus.publish('session-status', status('s1'));
        expect(seen).toEqual(['a', 'a', 'late']);
    });

    it('refuses a non-function listener', () => {
        const bus = new InMemoryEdgeEventBus();
        expect(() => bus.subscribe('alert', undefined as never)).toThrow(TypeError);
    });
});
