/**
 * Sub-timer-resolution waits. A Windows Node timer fires at ~16 ms granularity, far coarser than a compressed
 * transmitter pace (tcp.js sends one entry every 400 ms; the suite replays it ×100–×200 faster). `waitUntil`
 * sleeps on a timer while far from the deadline and yields with setImmediate (I/O keeps running) for the rest.
 */
import { performance } from 'perf_hooks';

export const nowMs = (): number => performance.now();

export async function waitUntil(deadlineMs: number): Promise<void> {
    for (;;) {
        const left = deadlineMs - performance.now();
        if (left <= 0) return;
        if (left > 24) await new Promise(resolve => setTimeout(resolve, left - 18));
        else await new Promise(resolve => setImmediate(resolve));
    }
}

export const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/** Poll `cond` every 10 ms until true; a timeout names `what` and appends `dump()` (counts and digests only). */
export async function waitFor(cond: () => boolean | Promise<boolean>, ms: number, what: string, dump?: () => unknown): Promise<void> {
    const deadline = Date.now() + ms;
    for (;;) {
        let ok = false;
        try {
            ok = await cond();
        } catch {
            ok = false;
        }
        if (ok) return;
        if (Date.now() > deadline) {
            let extra = '';
            if (dump) {
                try {
                    extra = `\n${JSON.stringify(dump(), null, 1)}`;
                } catch (err) {
                    extra = `\n(dump failed: ${err instanceof Error ? err.message : String(err)})`;
                }
            }
            throw new Error(`timed out after ${ms} ms waiting for ${what}${extra}`);
        }
        await sleep(10);
    }
}
