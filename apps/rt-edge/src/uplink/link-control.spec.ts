import { normalizeRefusal, PENDING_CUTS_MAX, thinPendingCuts } from './edge-uplink';
import { Backoff, InternetTracker, LIVE_ROUND_MAX_PAGES, monotonicMs, pickUplinkJob, RAW_STARVE_MS, RAW_TAIL_MAX_BYTES, rawStarveMs, TokenBucket, UplinkCandidate } from './link-control';

describe('uplink link control (pure)', () => {
    describe('Backoff (spec §10 #2: 1 → 30 s, full jitter, reset after 60 s stable)', () => {
        it('doubles the cap up to the maximum and draws uniformly below it', () => {
            const caps: number[] = [];
            const b = new Backoff(1_000, 30_000, 60_000, () => 0.999999);
            for (let i = 0; i < 8; i++) caps.push(b.next());
            expect(caps).toEqual([999, 1_999, 3_999, 7_999, 15_999, 29_999, 29_999, 29_999]);
            expect(b.attempts).toBe(8);
            const zero = new Backoff(1_000, 30_000, 60_000, () => 0);
            expect([zero.next(), zero.next()]).toEqual([0, 0]); // full jitter: 0 is a valid draw
        });

        it('resets only after a connection stayed up for the stable window', () => {
            const b = new Backoff(1_000, 30_000, 60_000, () => 0.5);
            b.next();
            b.next();
            b.connected(0);
            b.disconnected(59_999); // a flap: the backoff keeps growing
            expect(b.next()).toBe(2_000);
            b.connected(100_000);
            b.disconnected(160_000);
            expect(b.next()).toBe(500);
            b.reset();
            expect(b.attempts).toBe(0);
        });
    });

    describe('InternetTracker (EDGE_TIMING hysteresis: offline after 15 s down, online after 10 s up)', () => {
        it('reports the first evidence at once, then only after the state held for its window', () => {
            const t = new InternetTracker(15_000, 10_000);
            expect(t.status()).toEqual({ state: 'unknown', sinceMs: null });
            expect(t.evidence(true, 1_000)).toBe(true);
            expect(t.status()).toEqual({ state: 'up', sinceMs: 1_000 });
            expect(t.evidence(false, 5_000)).toBe(false);
            expect(t.evaluate(19_999)).toBe(false);
            expect(t.evaluate(20_000)).toBe(true);
            expect(t.status()).toEqual({ state: 'down', sinceMs: 5_000 });
            // A short recovery does not flip it back.
            expect(t.evidence(true, 21_000)).toBe(false);
            expect(t.evidence(false, 25_000)).toBe(false);
            expect(t.evaluate(60_000)).toBe(false);
            expect(t.evidence(true, 61_000)).toBe(false);
            expect(t.evaluate(71_000)).toBe(true);
            expect(t.status()).toEqual({ state: 'up', sinceMs: 61_000 });
        });
    });

    describe('TokenBucket (per-edge budget, §5.6)', () => {
        it('spends tokens, asks to wait for a refill, and caps a large message at one second of budget', () => {
            let now = 0;
            const b = new TokenBucket(1_000, () => now);
            expect(b.take(600)).toBe(0);
            expect(b.take(600)).toBe(200);
            now = 200;
            expect(b.take(600)).toBe(0);
            now = 200;
            expect(b.take(50_000)).toBe(1_000); // waits for a full bucket, never forever
            now = 1_200;
            expect(b.take(50_000)).toBe(0);
            b.setRate(10);
            now = 2_200;
            expect(b.take(10)).toBe(0);
            b.setRate(-1); // ignored
            expect(b.take(10)).toBe(1_000);
        });

        it('a clock that steps back costs nothing: the next small message waits at most its own cost (review 25)', () => {
            let now = 1_000_000;
            const b = new TokenBucket(1_000, () => now);
            expect(b.take(1_000)).toBe(0); // the bucket is empty now
            now -= 180_000; // the ops cloud-time fallback stepped the clock back 3 minutes
            expect(b.take(100)).toBeLessThanOrEqual(100); // before: ~180 s of owed silence
            now += 100;
            expect(b.take(100)).toBe(0);
        });

        it('the uplink paces on a monotonic clock that never goes back', () => {
            const a = monotonicMs();
            const b = monotonicMs();
            expect(b).toBeGreaterThanOrEqual(a);
            // performance.now(): milliseconds since the process started, not the wall clock ops may step.
            expect(a).toBeLessThan(Date.now() / 1000);
        });
    });

    describe('refusal codes and the pending-cut list', () => {
        it('maps the cloud refusal texts (connect_error, c.refused, hello) to what the box acts on', () => {
            expect(normalizeRefusal('REVOKED {"code":"REVOKED"}')).toBe('REVOKED');
            expect(normalizeRefusal('quarantined')).toBe('QUARANTINED');
            expect(normalizeRefusal('DUP_IDENTITY')).toBe('DUP_IDENTITY');
            expect(normalizeRefusal('PROTO_UNSUPPORTED')).toBe('PROTO_UNSUPPORTED');
            for (const key of ['KEY_UNCONFIRMED', 'NOT_ENROLLED', 'UNAUTHORIZED', 'NOT_ACTIVE', 'BAD_SIGNATURE']) expect(normalizeRefusal(key)).toBe('KEY_REFUSED');
            expect(normalizeRefusal('xhr poll error')).toBe('UNREACHABLE');
            expect(normalizeRefusal('')).toBe('UNREACHABLE');
        });

        it('thins pending cuts in pairs keeping the later rev and the earlier time', () => {
            expect(thinPendingCuts([{ rev: 1, atMs: 10 }, { rev: 2, atMs: 20 }, { rev: 3, atMs: 30 }])).toEqual([{ rev: 2, atMs: 10 }, { rev: 3, atMs: 30 }]);
            const many = Array.from({ length: PENDING_CUTS_MAX + 1 }, (_, i) => ({ rev: i + 1, atMs: 1_000 + i }));
            const thin = thinPendingCuts(many);
            expect(thin.length).toBeLessThanOrEqual(PENDING_CUTS_MAX / 2 + 1);
            expect(thin[0].atMs).toBe(1_000); // the oldest time survives
            expect(thin[thin.length - 1].rev).toBe(PENDING_CUTS_MAX + 1);
        });
    });

    describe('pickUplinkJob (§5.6 scheduler order)', () => {
        const c = (nSesid: string, x: Partial<UplinkCandidate> = {}): UplinkCandidate => ({ nSesid, round: null, raw: null, seal: false, ...x });

        it('serves degraded raw, live rounds, raw tail, catch-up rounds, raw backlog, then seals', () => {
            const all = [
                c('a', { seal: true }),
                c('b', { raw: { lagBytes: RAW_TAIL_MAX_BYTES + 1, degraded: false } }),
                c('c', { round: { dirtyPages: 9 } }),
                c('d', { raw: { lagBytes: 10, degraded: false } }),
                c('e', { round: { dirtyPages: LIVE_ROUND_MAX_PAGES } }),
                c('f', { raw: { lagBytes: 10, degraded: true } }),
            ];
            const order: string[] = [];
            let left = [...all];
            while (left.length) {
                const job = pickUplinkJob(left, null)!;
                order.push(`${job.kind}:${job.nSesid}`);
                left = left.filter(x => x.nSesid !== job.nSesid);
            }
            expect(order).toEqual(['raw-degraded:f', 'round-live:e', 'raw-tail:d', 'round-catchup:c', 'raw-backlog:b', 'seal:a']);
            expect(pickUplinkJob([], null)).toBeNull();
            expect(pickUplinkJob([c('x')], null)).toBeNull();
        });

        it('the raw floor: raw that waited past the starve time goes ahead of a live round; fresh raw does not (review 35)', () => {
            const behind3s = [c('s1', { round: { dirtyPages: 1 }, raw: { lagBytes: 10_000, degraded: false, starved: true } })];
            expect(pickUplinkJob(behind3s, null)).toEqual({ kind: 'raw-tail', nSesid: 's1' });
            const fresh = [c('s1', { round: { dirtyPages: 1 }, raw: { lagBytes: 10_000, degraded: false, starved: false } })];
            expect(pickUplinkJob(fresh, null)).toEqual({ kind: 'round-live', nSesid: 's1' });
            // Another session's starved backlog also goes first; degraded raw still leads everything.
            const mixed = [
                c('a', { round: { dirtyPages: 1 } }),
                c('b', { raw: { lagBytes: RAW_TAIL_MAX_BYTES + 1, degraded: false, starved: true } }),
            ];
            expect(pickUplinkJob(mixed, null)).toEqual({ kind: 'raw-backlog', nSesid: 'b' });
            expect(pickUplinkJob([...mixed, c('d', { raw: { lagBytes: 1, degraded: true } })], null)).toEqual({ kind: 'raw-degraded', nSesid: 'd' });
        });

        it('the starve time keeps the cloud floor (limits.rawMinBps) for the part size, within [100 ms, 2 s]', () => {
            expect(rawStarveMs(256 * 1024, null)).toBe(RAW_STARVE_MS);
            expect(rawStarveMs(256 * 1024, 32 * 1024)).toBe(RAW_STARVE_MS); // 8 s per part would also do; 2 s is the cap
            expect(rawStarveMs(32 * 1024, 32 * 1024)).toBe(1_000);
            expect(rawStarveMs(1_000, 32 * 1024)).toBe(100);
        });

        it('round-robins inside a class after the session served last', () => {
            const live = [c('s1', { round: { dirtyPages: 1 } }), c('s2', { round: { dirtyPages: 1 } }), c('s3', { round: { dirtyPages: 1 } })];
            expect(pickUplinkJob(live, null)!.nSesid).toBe('s1');
            expect(pickUplinkJob(live, 's1')!.nSesid).toBe('s2');
            expect(pickUplinkJob(live, 's2')!.nSesid).toBe('s3');
            expect(pickUplinkJob(live, 's3')!.nSesid).toBe('s1');
        });
    });
});
