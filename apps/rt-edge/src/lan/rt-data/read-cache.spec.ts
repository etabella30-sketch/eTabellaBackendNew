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

    it("a write makes one user's entries stale, kept under that user's key only (never found under another user's); clear empties the cache", () => {
        const cache = make();
        const a = RtReadCache.key('User-A', 'marknav.all', 'nSesid=1');
        const b = RtReadCache.key('user-b', 'marknav.all', 'nSesid=1');
        cache.set(a, 'User-A', buf('1'));
        cache.set(b, 'user-b', buf('3'));
        expect(cache.expireUser('USER-A')).toBe(1);
        expect(cache.get(a)).toMatchObject({ fresh: false, expired: true });
        expect(cache.get(a)?.body.toString()).toBe('1');
        expect(cache.get(b)).toMatchObject({ fresh: true, expired: false });
        expect(cache.get(b)?.body.toString()).toBe('3');
        expect([cache.size, cache.bytes]).toEqual([2, 2]);
        cache.clear();
        expect([cache.size, cache.bytes]).toEqual([0, 0]);
    });

    it('expireUser keeps the copies but makes them stale at once (a busy or offline read still serves them); expireAll does it for everyone (user decision 2026-10-05)', () => {
        const cache = make();
        cache.set('a1', 'User-A', buf('1'));
        cache.set('a2', 'user-a', buf('2'));
        cache.set('b1', 'user-b', buf('3'));
        expect(cache.expireUser('USER-A')).toBe(2);
        expect(cache.get('a1')).toMatchObject({ fresh: false, ageMs: 0 });
        expect([cache.get('a1')?.body.toString(), cache.get('a2')?.body.toString()]).toEqual(['1', '2']);
        expect(cache.get('b1')).toMatchObject({ fresh: true });
        expect([cache.size, cache.bytes]).toEqual([3, 3]);
        // A copy stored again after the expiry is fresh again.
        cache.set('a1', 'user-a', buf('4'));
        expect(cache.get('a1')).toMatchObject({ fresh: true });
        expect(cache.expireUser('nobody')).toBe(0);

        expect(cache.expireAll()).toBe(3);
        expect(['a1', 'a2', 'b1'].map(k => cache.get(k)?.fresh)).toEqual([false, false, false]);
        expect(cache.size).toBe(3);
        // Stale copies still age out.
        now += 3_600_001;
        expect(cache.get('b1')).toBeNull();
    });

    it('a read that started before its user\'s expiry is stored stale and never replaces a newer copy; one started after is fresh', () => {
        const cache = make();
        const a0 = cache.stamp('user-a');
        const b0 = cache.stamp('user-b');
        expect(cache.expireUser('User-A')).toBe(0);
        expect(cache.stamp('USER-A')).toBeGreaterThan(a0);
        expect(cache.stamp('user-b')).toBe(b0);
        expect(cache.set('late', 'user-a', buf('may miss the change'), a0)).toBe(true);
        expect(cache.get('late')).toMatchObject({ fresh: false });
        cache.set('other', 'user-b', buf('b'), b0);
        expect(cache.get('other')).toMatchObject({ fresh: true });

        // The read after the notice finished first; the one in flight before it must not overwrite it.
        cache.set('k', 'user-a', buf('after'), cache.stamp('user-a'));
        expect(cache.set('k', 'user-a', buf('before'), a0)).toBe(false);
        expect([cache.get('k')?.body.toString(), cache.get('k')?.fresh]).toEqual(['after', true]);

        // expireAll moves every user's stamp; a write (expireUser) moves the writer's.
        const beforeAll = cache.stamp('user-b');
        cache.expireAll();
        cache.set('b2', 'user-b', buf('x'), beforeAll);
        expect(cache.get('b2')).toMatchObject({ fresh: false });
        const beforeWrite = cache.stamp('user-a');
        cache.expireUser('user-a');
        cache.set('a3', 'user-a', buf('y'), beforeWrite);
        expect(cache.get('a3')).toMatchObject({ fresh: false });
        // Without a stamp (no read in flight to compare with) a copy is stored fresh, as before.
        cache.set('a4', 'user-a', buf('z'));
        expect(cache.get('a4')).toMatchObject({ fresh: true });
    });

    it("a refusal leaves a marker in place of the copy: never served; a read that started before it never brings the copy back; a later good read replaces it", () => {
        const cache = make({ maxEntries: 2 });
        const s0 = cache.stamp('u');
        cache.set('k', 'u', buf('the detail'), s0);
        cache.expireUser('u');
        const s1 = cache.stamp('u');
        cache.expireUser('u');
        const s2 = cache.stamp('u');
        cache.refuse('k', 'U', s2);
        expect(cache.get('k')).toBeNull();
        // Reads in flight across the refusal: never stored, and one too large to keep does not drop the marker either.
        expect(cache.set('k', 'u', Buffer.alloc(1_001), s1)).toBe(false);
        expect(cache.set('k', 'u', buf('the detail'), s0)).toBe(false);
        expect(cache.get('k')).toBeNull();
        // Counted like a copy, with no bytes.
        expect([cache.size, cache.bytes]).toEqual([1, 0]);
        // A good read that started at the refusal's stamp or later replaces it as usual.
        expect(cache.set('k', 'u', buf('allowed again'), s2)).toBe(true);
        expect([cache.get('k')?.body.toString(), cache.get('k')?.fresh]).toEqual(['allowed again', true]);

        // A refusal replaces even a copy from a read that started later, and keeps that copy's stamp as its own.
        cache.expireUser('u');
        const s3 = cache.stamp('u');
        cache.set('k', 'u', buf('newer'), s3);
        cache.refuse('k', 'u', s2);
        expect(cache.get('k')).toBeNull();
        expect(cache.set('k', 'u', buf('older'), s2)).toBe(false);
        // Dropped like a copy: past maxEntries the least recently used goes first, here the marker.
        cache.set('a', 'u', buf('a'));
        cache.set('b', 'u', buf('b'));
        expect(cache.size).toBe(2);
        expect(cache.set('k', 'u', buf('older'), s2)).toBe(true);
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
