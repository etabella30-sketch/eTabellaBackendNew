import { RtReadCache } from './read-cache';

describe('RtReadCache (per-user read-through cache of the proxied RT reads)', () => {
    let now: number;
    const clock = () => now;
    const make = (over: Partial<{ freshMs: number; staleMaxMs: number; maxEntries: number; maxBytes: number }> = {}) =>
        new RtReadCache({ freshMs: 15_000, staleMaxMs: 3_600_000, maxEntries: 10, maxBytes: 4_000, ...over }, clock);
    const buf = (text: string) => Buffer.from(text, 'utf8');

    beforeEach(() => {
        now = 1_000_000;
    });

    it('keys by user (case-insensitive), route and query', () => {
        expect(RtReadCache.key('ABC', 'marknav.all', 'a=1')).toBe(RtReadCache.key('abc', 'marknav.all', 'a=1'));
        expect(RtReadCache.key('abc', 'marknav.all', 'a=1')).not.toBe(RtReadCache.key('abd', 'marknav.all', 'a=1'));
        expect(RtReadCache.key('abc', 'marknav.all', 'a=1')).not.toBe(RtReadCache.key('abc', 'issue.list', 'a=1'));
        expect(RtReadCache.key('abc', 'marknav.all', 'a=1')).not.toBe(RtReadCache.key('abc', 'marknav.all', 'a=2'));
    });

    it('is fresh below freshMs, stale after, and gone after staleMaxMs', () => {
        const cache = make();
        const key = RtReadCache.key('u1', 'r', '');
        cache.set(key, 'u1', buf('[1]'));
        expect(cache.get(key)).toMatchObject({ fresh: true, ageMs: 0 });
        now += 14_999;
        expect(cache.get(key)).toMatchObject({ fresh: true, ageMs: 14_999 });
        now += 1;
        expect(cache.get(key)).toMatchObject({ fresh: false, ageMs: 15_000 });
        now += 3_600_000 - 15_000;
        expect(cache.get(key)?.body.toString()).toBe('[1]');
        now += 1;
        expect(cache.get(key)).toBeNull();
        expect([cache.size, cache.bytes]).toEqual([0, 0]);
    });

    it('drops the least recently used entries past maxEntries or maxBytes', () => {
        const cache = make({ maxEntries: 3, maxBytes: 4_000 });
        for (const k of ['a', 'b', 'c']) cache.set(k, 'u', buf(k));
        cache.get('a'); // a is now the most recently used
        cache.set('d', 'u', buf('d'));
        expect(['a', 'b', 'c', 'd'].map(k => cache.get(k) !== null)).toEqual([true, false, true, true]);

        const small = make({ maxEntries: 100, maxBytes: 400 });
        small.set('x', 'u', Buffer.alloc(100));
        small.set('y', 'u', Buffer.alloc(100));
        small.set('z', 'u', Buffer.alloc(100));
        small.set('w', 'u', Buffer.alloc(100));
        expect(small.bytes).toBe(400);
        small.set('v', 'u', Buffer.alloc(100));
        expect(small.get('x')).toBeNull();
        expect(small.bytes).toBe(400);
    });

    it('never stores a body over a quarter of the budget (and forgets the older copy of that key)', () => {
        const cache = make({ maxBytes: 400 });
        expect(cache.set('k', 'u', Buffer.alloc(100))).toBe(true);
        expect(cache.set('k', 'u', Buffer.alloc(101))).toBe(false);
        expect(cache.get('k')).toBeNull();
        expect(cache.bytes).toBe(0);
    });

    it("dropUser removes one user's entries only (after that user's write)", () => {
        const cache = make();
        cache.set('a1', 'User-A', buf('1'));
        cache.set('a2', 'user-a', buf('2'));
        cache.set('b1', 'user-b', buf('3'));
        expect(cache.dropUser('USER-A')).toBe(2);
        expect([cache.get('a1'), cache.get('a2'), cache.get('b1')?.body.toString()]).toEqual([null, null, '3']);
        expect(cache.bytes).toBe(1);
        cache.clear();
        expect([cache.size, cache.bytes]).toEqual([0, 0]);
    });

    it('replacing a key keeps the byte count exact', () => {
        const cache = make();
        cache.set('k', 'u', Buffer.alloc(10));
        cache.set('k', 'u', Buffer.alloc(30));
        expect([cache.size, cache.bytes]).toEqual([1, 30]);
        cache.delete('k');
        cache.delete('k');
        expect([cache.size, cache.bytes]).toEqual([0, 0]);
    });
});
