import { SavedServerTime, SERVER_TIME_MAX_RTT_MS, ServerTime, ServerTimeStore } from './server-time';

const T0 = Date.UTC(2026, 9, 5, 1, 40, 0); // 2026-10-05 05:40 in Dubai

/** A box PC clock and a monotonic clock the spec moves by hand (`jump` moves only the PC clock). */
function clocks(rawStart = T0) {
    let raw = rawStart;
    let mono = 1_000;
    return {
        raw: () => raw,
        mono: () => mono,
        advance(ms: number) {
            raw += ms;
            mono += ms;
        },
        jump(ms: number) {
            raw += ms;
        },
    };
}

class MemoryStore implements ServerTimeStore {
    saved: SavedServerTime | null = null;
    saves = 0;
    load(): SavedServerTime | null {
        return this.saved;
    }
    save(saved: SavedServerTime | null): void {
        this.saves += 1;
        this.saved = saved;
    }
}

describe('ServerTime (etabella.net time on the box, user decision 2026-10-05)', () => {
    it('with no reading and nothing saved, it is the box clock itself', () => {
        const c = clocks();
        const t = new ServerTime(c.raw, c.mono);
        expect(t.now()).toBe(T0);
        expect(t.raw()).toBe(T0);
        expect(t.status()).toEqual({ source: 'box', correctionMs: 0, targetMs: 0, checkedAtMs: null });
        c.advance(1_234);
        expect(t.now()).toBe(T0 + 1_234);
    });

    it('the first etabella.net reading applies at once, even backwards (no etabella.net time yet → switch as soon as it arrives)', () => {
        const c = clocks(T0 + 300_000); // the box PC is 5 min fast
        const t = new ServerTime(c.raw, c.mono);
        expect(t.observe({ offsetMs: 300_000, rttMs: 80, atMs: c.raw() })).toBe(true);
        expect(t.now()).toBe(T0);
        expect(t.status()).toEqual({ source: 'etabella', correctionMs: 300_000, targetMs: 300_000, checkedAtMs: T0 + 300_000 });
        c.advance(10_000);
        expect(t.now()).toBe(T0 + 10_000);
        // The raw clock is never corrected.
        expect(t.raw()).toBe(T0 + 310_000);
    });

    it('uses the lowest round trip of the last 5 readings, and ignores readings slower than 5 s', () => {
        const c = clocks();
        const t = new ServerTime(c.raw, c.mono);
        t.observe({ offsetMs: 400, rttMs: 300, atMs: c.raw() });
        c.advance(60_000);
        t.observe({ offsetMs: 347, rttMs: 40, atMs: c.raw() });
        c.advance(60_000);
        t.observe({ offsetMs: 380, rttMs: 200, atMs: c.raw() });
        expect(t.status().targetMs).toBe(347);
        // A slow reply is not used at all.
        expect(t.observe({ offsetMs: 9_000, rttMs: SERVER_TIME_MAX_RTT_MS + 1, atMs: c.raw() })).toBe(false);
        expect(t.observe({ offsetMs: Number.NaN, rttMs: 10, atMs: c.raw() })).toBe(false);
        expect(t.status().targetMs).toBe(347);
        // Four more readings push the 40 ms one out of the last five; of equal round trips the newest is used.
        for (const offsetMs of [360, 361, 362, 363]) {
            c.advance(60_000);
            t.observe({ offsetMs, rttMs: 100, atMs: c.raw() });
        }
        expect(t.status().targetMs).toBe(363);
        // checkedAtMs is the newest reading (etabella.net was heard from then), not the one in use.
        expect(t.status().checkedAtMs).toBe(c.raw());
    });

    it('a correction that moves time forward applies at once', () => {
        const c = clocks();
        const t = new ServerTime(c.raw, c.mono);
        t.observe({ offsetMs: 2_000, rttMs: 50, atMs: c.raw() });
        expect(t.now()).toBe(T0 - 2_000);
        c.advance(60_000);
        t.observe({ offsetMs: -1_000, rttMs: 10, atMs: c.raw() });
        expect(t.now()).toBe(T0 + 60_000 + 1_000);
    });

    it('a backward correction never makes time go back: it is applied at most 100 ms per second', () => {
        const c = clocks();
        const t = new ServerTime(c.raw, c.mono);
        t.observe({ offsetMs: 0, rttMs: 50, atMs: c.raw() });
        c.advance(1_000);
        const before = t.now();
        t.observe({ offsetMs: 3_000, rttMs: 10, atMs: c.raw() });
        expect(t.now()).toBe(before);
        expect(t.status()).toMatchObject({ source: 'etabella', correctionMs: 0, targetMs: 3_000 });
        let last = t.now();
        for (let i = 0; i < 40; i++) {
            c.advance(1_000);
            const now = t.now();
            expect(now - last).toBeGreaterThanOrEqual(900); // 0.9 s per second: line times never stall
            expect(Number.isInteger(now)).toBe(true); // the journal writes it as an integer
            last = now;
        }
        expect(t.status().correctionMs).toBe(3_000);
        expect(t.now()).toBe(c.raw() - 3_000);
        // A small backward one too (no run of lines with the same time).
        t.observe({ offsetMs: 3_400, rttMs: 5, atMs: c.raw() });
        const at = t.now();
        c.advance(1_000);
        expect(t.now() - at).toBe(900);
        c.advance(10_000);
        expect(t.now()).toBe(c.raw() - 3_400);
    });

    it('folds a PC clock jump (Windows syncing its clock) into the correction at once', () => {
        const c = clocks(T0 + 300_000);
        const t = new ServerTime(c.raw, c.mono);
        t.checkJump();
        t.observe({ offsetMs: 300_000, rttMs: 60, atMs: c.raw() });
        c.advance(250);
        expect(t.checkJump()).toBe(0);
        const before = t.now();
        // Windows sets the PC clock right: 5 min back. etabella.net time does not move.
        c.jump(-300_000);
        c.advance(250);
        expect(t.checkJump()).toBe(-300_000);
        expect(t.now()).toBe(before + 250);
        expect(t.status()).toMatchObject({ source: 'etabella', correctionMs: 0, targetMs: 0 });
        // The readings kept are moved with it: the next one (now about 0) is not a jump back.
        c.advance(60_000);
        t.observe({ offsetMs: 2, rttMs: 300, atMs: c.raw() });
        expect(t.status().targetMs).toBe(0);
        // Small drift between the two clocks is not a jump.
        c.jump(400);
        c.advance(250);
        expect(t.checkJump()).toBe(0);
    });

    it('a PC clock jump while following the box clock changes nothing (it is the box clock)', () => {
        const c = clocks();
        const t = new ServerTime(c.raw, c.mono);
        t.checkJump();
        c.jump(120_000);
        expect(t.checkJump()).toBe(0);
        expect(t.now()).toBe(c.raw());
    });

    it('reset goes back to the box clock until the next reading (after the box clock was stepped to the cloud)', () => {
        const store = new MemoryStore();
        const c = clocks(T0 + 90_000);
        const t = new ServerTime(c.raw, c.mono);
        t.attach(store);
        t.checkJump();
        t.observe({ offsetMs: 90_000, rttMs: 40, atMs: c.raw() });
        expect(store.saved).toEqual({ offsetMs: 90_000, targetMs: 90_000, checkedAtMs: T0 + 90_000, rttMs: 40 });
        // ops stepped the OS clock to the cloud's time, then resets: the correction is not applied twice.
        c.jump(-90_000);
        t.reset();
        expect(t.now()).toBe(T0);
        expect(t.status()).toEqual({ source: 'box', correctionMs: 0, targetMs: 0, checkedAtMs: null });
        expect(store.saved).toBeNull();
        // The step is not folded later either.
        c.advance(250);
        expect(t.checkJump()).toBe(0);
        t.observe({ offsetMs: 3, rttMs: 40, atMs: c.raw() });
        expect(t.now()).toBe(c.raw() - 3);
    });

    it('keeps the correction across a restart: a saved one is used until etabella.net answers again', () => {
        const store = new MemoryStore();
        const c = clocks(T0 + 300_000);
        const first = new ServerTime(c.raw, c.mono);
        first.attach(store);
        first.observe({ offsetMs: 300_000, rttMs: 60, atMs: c.raw() });
        expect(store.saves).toBe(1);

        // The box reboots offline (PM2 does not start it by itself).
        c.advance(3_600_000);
        const again = new ServerTime(c.raw, c.mono);
        again.attach(store);
        expect(again.status()).toEqual({ source: 'saved', correctionMs: 300_000, targetMs: 300_000, checkedAtMs: T0 + 300_000 });
        expect(again.now()).toBe(T0 + 3_600_000);
        // etabella.net answers again: a backward change from a saved correction is gradual too.
        again.observe({ offsetMs: 301_000, rttMs: 60, atMs: c.raw() });
        expect(again.status()).toMatchObject({ source: 'etabella', correctionMs: 300_000, targetMs: 301_000 });

        // Nothing usable saved: the box clock.
        store.saved = { offsetMs: Number.NaN, targetMs: Number.NaN, checkedAtMs: T0, rttMs: null };
        const broken = new ServerTime(c.raw, c.mono);
        broken.attach(store);
        expect(broken.status().source).toBe('box');
    });

    it('a store that fails does not stop the correction', () => {
        const c = clocks();
        const t = new ServerTime(c.raw, c.mono);
        const errors: unknown[] = [];
        t.attach(
            {
                load: () => {
                    throw new Error('disk');
                },
                save: () => {
                    throw new Error('disk');
                },
            },
            err => errors.push(err),
        );
        expect(t.observe({ offsetMs: 500, rttMs: 20, atMs: c.raw() })).toBe(true);
        expect(t.now()).toBe(T0 - 500);
        expect(errors).toHaveLength(2);
    });
});

describe('ServerTime — time correctness (review 2026-10-05)', () => {
    describe('a PC clock jump is folded on every read, not only on the uplink tick', () => {
        it('now() and status() between the jump and the next tick do not move with it; the tick reports it once', () => {
            const c = clocks(T0 + 120_000); // the box PC is 2 min fast
            const t = new ServerTime(c.raw, c.mono);
            t.observe({ offsetMs: 120_000, rttMs: 40, atMs: c.raw() });
            c.advance(250);
            t.checkJump();
            const before = t.now();
            expect(before).toBe(T0 + 250);
            // Windows resyncs and moves the PC clock forward 5 min; a chunk arrives 100 ms later, before the tick.
            c.jump(300_000);
            c.advance(100);
            expect(t.now()).toBe(before + 100);
            expect(t.status()).toEqual({ source: 'etabella', correctionMs: 420_000, targetMs: 420_000, checkedAtMs: T0 + 420_000 });
            // The tick stays a heartbeat: it reports the jump once (for the log) and does not fold it again.
            c.advance(150);
            expect(t.checkJump()).toBe(300_000);
            expect(t.now()).toBe(before + 250);
            c.advance(250);
            expect(t.checkJump()).toBe(0);
            expect(t.now()).toBe(before + 500);
        });

        it('an observe() after a jump but before the tick is not shifted twice', () => {
            const c = clocks(T0 + 300_000); // the box PC is 5 min fast
            const t = new ServerTime(c.raw, c.mono);
            t.observe({ offsetMs: 300_000, rttMs: 60, atMs: c.raw() });
            c.advance(250);
            t.checkJump();
            // Windows sets the PC clock right (5 min back); a hello measured on the corrected PC clock completes before
            // the tick.
            c.jump(-300_000);
            c.advance(1_000);
            expect(t.observe({ offsetMs: 0, rttMs: 40, atMs: c.raw() })).toBe(true);
            expect(t.status()).toMatchObject({ source: 'etabella', correctionMs: 0, targetMs: 0, checkedAtMs: T0 + 1_250 });
            expect(t.now()).toBe(T0 + 1_250);
            // The tick finds nothing left to fold.
            c.advance(250);
            t.checkJump();
            expect(t.status()).toMatchObject({ correctionMs: 0, targetMs: 0 });
            expect(t.now()).toBe(T0 + 1_500);
            // The readings kept are in one frame: the next hello changes nothing.
            c.advance(60_000);
            t.observe({ offsetMs: 0, rttMs: 50, atMs: c.raw() });
            expect(t.now()).toBe(T0 + 61_500);
        });
    });

    describe('restoring the saved correction', () => {
        it('a saved correction from the PC clock\'s future (the clock went back while rt-edge was stopped) is not used: the box clock', () => {
            const store = new MemoryStore();
            store.saved = { offsetMs: 347, targetMs: 347, checkedAtMs: T0, rttMs: 40 };
            // A flat CMOS battery: the PC boots at 2020-01-01.
            const c = clocks(Date.UTC(2020, 0, 1));
            const t = new ServerTime(c.raw, c.mono);
            t.attach(store);
            expect(t.status()).toEqual({ source: 'box', correctionMs: 0, targetMs: 0, checkedAtMs: null });
            expect(t.now()).toBe(c.raw());
            // The PC clock at or past the reading: used.
            const ok = clocks(T0);
            const u = new ServerTime(ok.raw, ok.mono);
            u.attach(store);
            expect(u.status()).toEqual({ source: 'saved', correctionMs: 347, targetMs: 347, checkedAtMs: T0 });
        });

        it('a saved correction the first reading does not confirm (over a few seconds off) is replaced at once', () => {
            const store = new MemoryStore();
            // A Leap 3 box saved -300 s while its PC clock was 5 min slow; Windows set the clock right while rt-edge was
            // stopped, and it starts offline: 5 min ahead until etabella.net answers.
            store.saved = { offsetMs: -300_000, targetMs: -300_000, checkedAtMs: T0 - 600_000, rttMs: 40 };
            const c = clocks(T0);
            const t = new ServerTime(c.raw, c.mono);
            t.attach(store);
            expect(t.status().source).toBe('saved');
            expect(t.now()).toBe(T0 + 300_000);
            c.advance(1_000);
            t.observe({ offsetMs: 0, rttMs: 40, atMs: c.raw() });
            expect(t.status()).toEqual({ source: 'etabella', correctionMs: 0, targetMs: 0, checkedAtMs: T0 + 1_000 });
            expect(t.now()).toBe(T0 + 1_000);
            expect(store.saved).toEqual({ offsetMs: 0, targetMs: 0, checkedAtMs: T0 + 1_000, rttMs: 40 });
        });
    });

    it('a restart while a backward correction is being applied continues it: now() does not move back', () => {
        const store = new MemoryStore();
        const c = clocks(T0);
        const first = new ServerTime(c.raw, c.mono);
        first.attach(store);
        // The first reading (the box clock until then) applies at once; a later one 300 s back is applied at 100 ms/s.
        first.observe({ offsetMs: -300_000, rttMs: 60, atMs: c.raw() });
        c.advance(60_000);
        first.observe({ offsetMs: 0, rttMs: 40, atMs: c.raw() });
        expect(first.status()).toMatchObject({ correctionMs: -300_000, targetMs: 0 });
        expect(store.saved).toMatchObject({ offsetMs: -300_000, targetMs: 0 });
        // 10 min of uplink ticks: 240 s of it still to apply, and the progress is saved every few seconds.
        for (let i = 0; i < 2_400; i++) {
            c.advance(250);
            first.checkJump();
        }
        expect(first.status()).toMatchObject({ correctionMs: -240_000, targetMs: 0 });
        expect(store.saved!.targetMs).toBe(0);
        expect(store.saved!.offsetMs).toBeGreaterThanOrEqual(-240_500);
        expect(store.saved!.offsetMs).toBeLessThanOrEqual(-240_000);
        const before = first.now();

        // rt-edge restarts (a crash, a PM2 restart, a deploy) 2 s later and comes up offline.
        c.advance(2_000);
        const again = new ServerTime(c.raw, c.mono);
        again.attach(store);
        expect(again.status()).toMatchObject({ source: 'saved', targetMs: 0 });
        expect(again.now()).toBeGreaterThanOrEqual(before + 2_000);
        // The slew goes on from where it was: 0.9 s per second.
        const t1 = again.now();
        c.advance(1_000);
        expect(again.now() - t1).toBe(900);
        // etabella.net answers with the same target: still gradual, never a jump back.
        const t2 = again.now();
        again.observe({ offsetMs: 0, rttMs: 40, atMs: c.raw() });
        expect(again.status()).toMatchObject({ source: 'etabella', targetMs: 0 });
        expect(again.now()).toBe(t2);
        expect(again.status().correctionMs).toBeLessThan(-200_000);
    });

    it('the tick saves a backward correction every few seconds while it is applied, once more when complete, then no more', () => {
        const store = new MemoryStore();
        const c = clocks(T0);
        const t = new ServerTime(c.raw, c.mono);
        t.attach(store);
        t.observe({ offsetMs: 0, rttMs: 60, atMs: c.raw() });
        c.advance(1_000);
        t.observe({ offsetMs: 2_000, rttMs: 40, atMs: c.raw() }); // 2 s back: 20 s at 100 ms/s
        const saves = store.saves;
        for (let i = 0; i < 80; i++) {
            c.advance(250);
            t.checkJump();
        }
        // 20 s: a save each 5 s (the last one is the completion).
        expect(store.saves - saves).toBe(4);
        expect(store.saved).toMatchObject({ offsetMs: 2_000, targetMs: 2_000 });
        for (let i = 0; i < 80; i++) {
            c.advance(250);
            t.checkJump();
        }
        expect(store.saves - saves).toBe(4);
    });
});
