import { DEFAULT_LOCKOUT_POLICY, HandshakeLockout } from './lockout';
import { IngestAlert } from './types';

function setup(policy = {}) {
    let now = 1_000_000;
    const alerts: IngestAlert[] = [];
    const lockout = new HandshakeLockout({ clock: () => now, onAlert: a => alerts.push(a), policy });
    return {
        lockout,
        alerts,
        advance: (ms: number) => {
            now += ms;
        },
        now: () => now,
    };
}

describe('HandshakeLockout (spec §3.2)', () => {
    it('uses the spec numbers: 5 wrong passwords / 1 min → 5 min; 30 unknown / min; alert over 100 / h', () => {
        expect(DEFAULT_LOCKOUT_POLICY).toMatchObject({
            failuresToBlock: 5,
            failureWindowMs: 60_000,
            blockMs: 300_000,
            unknownPerIpLimit: 30,
            unknownWindowMs: 60_000,
            floodThreshold: 100,
            floodWindowMs: 3_600_000,
        });
    });

    it('blocks an (IP, user) pair on the 5th wrong password within a minute, with one LOCKOUT alert', () => {
        const { lockout, alerts, advance } = setup();
        for (let i = 1; i <= 4; i++) {
            const r = lockout.recordFailure('10.0.0.9', 'alok', 'ses-1');
            expect(r).toMatchObject({ blocked: false, justBlocked: false, failures: i });
            advance(5_000);
        }
        expect(lockout.check('10.0.0.9', 'alok').blocked).toBe(false);
        const fifth = lockout.recordFailure('10.0.0.9', 'alok', 'ses-1');
        expect(fifth.blocked).toBe(true);
        expect(fifth.justBlocked).toBe(true);
        expect(lockout.check('10.0.0.9', 'alok')).toMatchObject({ blocked: true });
        expect(alerts.filter(a => a.kind === 'LOCKOUT')).toHaveLength(1);
        expect(alerts[0]).toMatchObject({ kind: 'LOCKOUT', tier: 'info', nSesid: 'ses-1', user: 'alok', peer: '10.0.0.9' });
        expect(alerts[0].message).not.toMatch(/pass(word)?\s*[:=]/i);
    });

    it('does not block when the 5 failures are spread over more than a minute (sliding window)', () => {
        const { lockout, advance } = setup();
        for (let i = 0; i < 5; i++) {
            expect(lockout.recordFailure('10.0.0.9', 'alok').blocked).toBe(false);
            advance(16_000); // 5 failures over 64 s: the oldest has always aged out
        }
        expect(lockout.isBlocked('10.0.0.9', 'alok')).toBe(false);
    });

    it('scopes the block to the pair: another IP or another user is unaffected', () => {
        const { lockout } = setup();
        for (let i = 0; i < 5; i++) lockout.recordFailure('10.0.0.9', 'alok');
        expect(lockout.check('10.0.0.9', 'alok').blocked).toBe(true);
        expect(lockout.check('10.0.0.10', 'alok').blocked).toBe(false);
        expect(lockout.check('10.0.0.9', 'other').blocked).toBe(false);
    });

    it('drops attempts while blocked and NEVER extends the block', () => {
        const { lockout, advance, now } = setup();
        for (let i = 0; i < 5; i++) lockout.recordFailure('10.0.0.9', 'alok');
        const until = lockout.check('10.0.0.9', 'alok').until!;
        expect(until).toBe(now() + 300_000);
        for (let i = 0; i < 20; i++) {
            advance(10_000);
            expect(lockout.check('10.0.0.9', 'alok')).toEqual({ blocked: true, until });
            const r = lockout.recordFailure('10.0.0.9', 'alok');
            expect(r.until).toBe(until);
            expect(r.justBlocked).toBe(false);
        }
        expect(lockout.status()[0]).toMatchObject({ ip: '10.0.0.9', user: 'alok', blockedUntil: until });
        // the 21 check()s were drops; the 20 failures reported while blocked had been verified, so they are not
        expect(lockout.status()[0].droppedWhileBlocked).toBe(21);
        advance(until - now()); // exactly 5 min after the block started
        expect(lockout.check('10.0.0.9', 'alok').blocked).toBe(false);
        // after expiry the counter starts over: one more failure does not re-block
        expect(lockout.recordFailure('10.0.0.9', 'alok').blocked).toBe(false);
    });

    it('a correct password clears the failure count but does not lift an active block', () => {
        const { lockout } = setup();
        for (let i = 0; i < 4; i++) lockout.recordFailure('10.0.0.9', 'alok');
        lockout.recordSuccess('10.0.0.9', 'alok');
        expect(lockout.recordFailure('10.0.0.9', 'alok').failures).toBe(1);
        for (let i = 0; i < 4; i++) lockout.recordFailure('10.0.0.9', 'alok');
        expect(lockout.isBlocked('10.0.0.9', 'alok')).toBe(true);
        lockout.recordSuccess('10.0.0.9', 'alok');
        expect(lockout.isBlocked('10.0.0.9', 'alok')).toBe(true);
    });

    it('Unlock clears matching blocks (by IP, user, session or all)', () => {
        const { lockout } = setup();
        for (const [ip, user, ses] of [['1.1.1.1', 'a', 's1'], ['1.1.1.1', 'b', 's2'], ['2.2.2.2', 'a', 's1']]) {
            for (let i = 0; i < 5; i++) lockout.recordFailure(ip, user, ses);
        }
        expect(lockout.status()).toHaveLength(3);
        expect(lockout.unlock({ ip: '1.1.1.1', user: 'b' })).toBe(1);
        expect(lockout.isBlocked('1.1.1.1', 'b')).toBe(false);
        expect(lockout.unlock({ nSesid: 's1' })).toBe(2);
        expect(lockout.status()).toHaveLength(0);
        for (let i = 0; i < 5; i++) lockout.recordFailure('3.3.3.3', 'c');
        expect(lockout.unlock()).toBe(1);
        expect(lockout.isBlocked('3.3.3.3', 'c')).toBe(false);
    });

    it('unknown usernames never lock anyone out: refused + alerted up to 30 per IP per minute, the excess dropped', () => {
        const { lockout, advance } = setup();
        const verdicts = Array.from({ length: 35 }, () => lockout.noteUnknown('10.0.0.66').action);
        expect(verdicts.slice(0, 30).every(v => v === 'refuse-alert')).toBe(true);
        expect(verdicts.slice(30).every(v => v === 'drop')).toBe(true);
        // no pair was ever blocked
        expect(lockout.status()).toHaveLength(0);
        expect(lockout.isBlocked('10.0.0.66', 'anyone')).toBe(false);
        // another IP is unaffected; the same IP recovers after the minute
        expect(lockout.noteUnknown('10.0.0.67').action).toBe('refuse-alert');
        advance(60_000);
        expect(lockout.noteUnknown('10.0.0.66').action).toBe('refuse-alert');
        expect(lockout.unknownStatus().find(e => e.ip === '10.0.0.66')!.dropped).toBe(5);
    });

    it('raises HANDSHAKE_FLOOD once when one IP exceeds 100 unknown handshakes in an hour', () => {
        const { lockout, alerts, advance } = setup();
        let floods = 0;
        for (let i = 0; i < 100; i++) {
            if (lockout.noteUnknown('10.0.0.66').flood) floods += 1;
            advance(20_000); // 100 attempts over ~33 min: within the per-minute limit
        }
        expect(floods).toBe(0);
        const verdict = lockout.noteUnknown('10.0.0.66'); // the 101st within the hour
        expect(verdict.flood).toBe(true);
        expect(verdict.lastHour).toBe(101);
        for (let i = 0; i < 10; i++) expect(lockout.noteUnknown('10.0.0.66').flood).toBe(false);
        expect(alerts.filter(a => a.kind === 'HANDSHAKE_FLOOD')).toHaveLength(1);
        expect(alerts.find(a => a.kind === 'HANDSHAKE_FLOOD')).toMatchObject({ tier: 'P2', peer: '10.0.0.66' });
    });

    it('counts dropped unknown handshakes toward the hourly flood figure', () => {
        const { lockout } = setup();
        let flood = false;
        for (let i = 0; i < 101; i++) flood = lockout.noteUnknown('10.0.0.70').flood || flood;
        expect(flood).toBe(true);
    });

    describe('reserved verifications (parallel handshakes)', () => {
        it('a verification in flight holds a failure slot: at most 5 guesses are ever verified, the rest are busy', () => {
            const { lockout, alerts } = setup();
            const granted = Array.from({ length: 20 }, () => lockout.reserve('10.0.0.9', 'alok'));
            const tickets = granted.filter(r => r.ok === true).map(r => (r as { ok: true; ticket: any }).ticket);
            expect(tickets).toHaveLength(5);
            expect(granted.slice(5).every(r => r.ok === false && r.reason === 'busy')).toBe(true);
            expect(lockout.isBlocked('10.0.0.9', 'alok')).toBe(false); // nothing failed yet
            const results = tickets.map(t => lockout.settle(t, 'failure', 'ses-1')!);
            expect(results.map(r => r.justBlocked)).toEqual([false, false, false, false, true]);
            expect(alerts.filter(a => a.kind === 'LOCKOUT')).toHaveLength(1);
            expect(lockout.reserve('10.0.0.9', 'alok')).toMatchObject({ ok: false, reason: 'blocked' });
            expect(lockout.status()[0]).toMatchObject({ failures: 0, droppedBusy: 15, droppedWhileBlocked: 1, inFlight: 0 });
        });

        it('counts failures and in-flight verifications together, so a 6th guess is never verified inside the minute', () => {
            const { lockout } = setup();
            for (let i = 0; i < 3; i++) lockout.recordFailure('10.0.0.9', 'alok');
            const a = lockout.reserve('10.0.0.9', 'alok');
            const b = lockout.reserve('10.0.0.9', 'alok');
            expect([a.ok, b.ok]).toEqual([true, true]);
            expect(lockout.reserve('10.0.0.9', 'alok')).toMatchObject({ ok: false, reason: 'busy', inFlight: 2 });
            // a success frees the budget (the window starts over) without lifting anything else
            lockout.settle((a as any).ticket, 'success');
            expect(lockout.reserve('10.0.0.9', 'alok').ok).toBe(true);
            expect(lockout.settle((b as any).ticket, 'failure')!.failures).toBe(1);
        });

        it("'uncounted' frees the slot without a failure; a second settle is a no-op", () => {
            const { lockout } = setup();
            const r = lockout.reserve('10.0.0.9', 'alok');
            expect(lockout.inFlight('10.0.0.9')).toBe(1);
            expect(lockout.settle((r as any).ticket, 'uncounted')).toBeNull();
            expect(lockout.inFlight('10.0.0.9')).toBe(0);
            expect(lockout.settle((r as any).ticket, 'failure')).toBeNull(); // already settled: not counted
            expect(lockout.status()).toEqual([]);
            expect(lockout.settle({ ip: '10.0.0.9', user: 'alok' }, 'failure')).toBeNull(); // not a ticket this class issued
            expect(lockout.status()).toEqual([]);
        });

        it('caps verifications in flight per IP across users', () => {
            const { lockout } = setup({ maxVerifyPerIp: 2 });
            const a = lockout.reserve('10.0.0.9', 'alok');
            const b = lockout.reserve('10.0.0.9', 'bina');
            expect([a.ok, b.ok]).toEqual([true, true]);
            expect(lockout.reserve('10.0.0.9', 'chen')).toMatchObject({ ok: false, reason: 'busy', inFlight: 2 });
            expect(lockout.reserve('10.0.0.10', 'chen').ok).toBe(true); // another IP has its own cap
            lockout.settle((a as any).ticket, 'uncounted');
            expect(lockout.reserve('10.0.0.9', 'chen').ok).toBe(true);
            expect(DEFAULT_LOCKOUT_POLICY.maxVerifyPerIp).toBe(8);
        });

        it('Unlock keeps the slots of verifications still in flight, and eviction never drops them', () => {
            const { lockout } = setup({ maxTrackedKeys: 3 });
            for (let i = 0; i < 3; i++) lockout.recordFailure('10.0.0.9', 'alok');
            const r = lockout.reserve('10.0.0.9', 'alok');
            expect(lockout.unlock({ ip: '10.0.0.9' })).toBe(1);
            expect(lockout.status()).toEqual([]);
            for (let i = 0; i < 20; i++) lockout.recordFailure(`10.0.2.${i}`, 'x'); // churn past maxTrackedKeys
            // the in-flight slot survived: 4 more reserves fit (1 + 4 = 5), the 5th is busy
            const more = Array.from({ length: 5 }, () => lockout.reserve('10.0.0.9', 'alok').ok);
            expect(more).toEqual([true, true, true, true, false]);
            lockout.settle((r as any).ticket, 'failure');
            expect(lockout.status().find(e => e.ip === '10.0.0.9')).toMatchObject({ failures: 1, inFlight: 4 });
        });
    });

    it('keeps its maps bounded but never evicts an active block', () => {
        const { lockout } = setup({ maxTrackedKeys: 10 });
        for (let i = 0; i < 5; i++) lockout.recordFailure('9.9.9.9', 'victim');
        for (let i = 0; i < 50; i++) lockout.recordFailure(`10.0.1.${i}`, 'x');
        expect(lockout.isBlocked('9.9.9.9', 'victim')).toBe(true);
        expect(lockout.status().length).toBeLessThanOrEqual(10);
    });
});
