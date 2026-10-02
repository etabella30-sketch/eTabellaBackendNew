import { EdgePortError, isEdgePortError } from '../ports';
import type { ConnectivityLogInsert } from '../ports';
import { tempState, TempState } from './testing/fixtures';

// 2026-10-01 is BST in London: 23:30 UTC on 10-01 is 00:30 on 10-02 locally.
const T0 = Date.UTC(2026, 9, 1, 9, 0, 0);
const TODAY = '2026-10-01';

function row(atMs: number, extra: Partial<ConnectivityLogInsert> = {}): ConnectivityLogInsert {
    return { atMs, event: 'connected', source: 'transmitter', code: 'tx-connected', problem: false, nSesid: 'ses-a', sessionName: 'Day 3 — Morning', peer: '192.168.20.31:8080', actor: null, data: {}, ...extra };
}

function expectCode(fn: () => unknown, code: string): void {
    let caught: unknown;
    try {
        fn();
    } catch (err) {
        caught = err;
    }
    expect(isEdgePortError(caught)).toBe(true);
    expect((caught as EdgePortError).code).toBe(code);
}

describe('state Connectivity Log (D34, DR12)', () => {
    let t: TempState;

    beforeEach(() => {
        t = tempState('Europe/London');
    });
    afterEach(async () => {
        await t.cleanup();
    });

    it('appends rows on the box-local day and pages newest first with an opaque before cursor', () => {
        for (let i = 0; i < 5; i++) t.state.connectivityLog.append(row(T0 + i * 1000, { code: i % 2 ? 'tx-refused' : 'tx-connected', problem: i % 2 === 1 }));
        t.state.connectivityLog.append(row(Date.UTC(2026, 9, 1, 23, 30), { code: 'tx-reset' })); // 00:30 on 10-02 in London
        const first = t.state.connectivityLog.page({ limit: 2 }, TODAY);
        expect(first.day).toBe(TODAY);
        expect(first.filter).toBe('all');
        expect(first.rows.map(r => r.atMs)).toEqual([T0 + 4000, T0 + 3000]);
        expect(first.rows[0]).toMatchObject({ event: 'connected', source: 'transmitter', retry: null, updatedAtMs: T0 + 4000, actor: null, data: {} });
        expect(first.nextBefore).toMatch(/^b\./);
        expect(first.days).toEqual(['2026-10-02', '2026-10-01']);
        const second = t.state.connectivityLog.page({ limit: 2, before: first.nextBefore! }, TODAY);
        expect(second.rows.map(r => r.atMs)).toEqual([T0 + 2000, T0 + 1000]);
        const third = t.state.connectivityLog.page({ limit: 2, before: second.nextBefore! }, TODAY);
        expect(third.rows.map(r => r.atMs)).toEqual([T0]);
        expect(third.nextBefore).toBeNull();
        expect(t.state.connectivityLog.page({ day: '2026-10-02' }, TODAY).rows.map(r => r.code)).toEqual(['tx-reset']);
        expect(t.state.connectivityLog.page({ day: '2026-09-30' }, TODAY)).toMatchObject({ rows: [], newest: null, nextBefore: null });
    });

    it('filters problems / transmitter / cloud and searches code, peer, session name and error', () => {
        t.state.connectivityLog.append(row(T0, { code: 'tx-refused', problem: true, data: { error: 'refused' } }));
        t.state.connectivityLog.append(row(T0 + 1, { source: 'cloud', code: 'cloud-connected', peer: null, sessionName: null, nSesid: null }));
        t.state.connectivityLog.append(row(T0 + 2, { source: 'network', code: 'internet-down', problem: true, peer: null, sessionName: null }));
        const codes = (q: object) => t.state.connectivityLog.page(q, TODAY).rows.map(r => r.code);
        expect(codes({ filter: 'problems' })).toEqual(['internet-down', 'tx-refused']);
        expect(codes({ filter: 'transmitter' })).toEqual(['tx-refused']);
        expect(codes({ filter: 'cloud' })).toEqual(['cloud-connected']);
        expect(codes({ q: 'REFUSED' })).toEqual(['tx-refused']);
        expect(codes({ q: '20.31' })).toEqual(['tx-refused']);
        expect(codes({ q: 'day 3' })).toEqual(['tx-refused']);
        expect(codes({ q: '100%_' })).toEqual([]);
    });

    it('collapses retries into one updating row with its tries, and the after poll returns it again by id', () => {
        const key = 'tx-dial:192.168.20.31:8080';
        const base = row(T0, { event: 'retrying', code: 'tx-refused', problem: true, data: { error: 'refused' } });
        const r1 = t.state.connectivityLog.retry(key, { atMs: T0, error: 'refused', peer: '192.168.20.31:8080' }, base);
        expect(r1).toMatchObject({ event: 'retrying', retry: { sinceMs: T0, tries: 1, lastError: 'refused', active: true }, updatedAtMs: T0 });
        const poll = t.state.connectivityLog.page({}, TODAY).newest!;
        for (let i = 1; i < 63; i++) t.state.connectivityLog.retry(key, { atMs: T0 + i * 3000, error: i === 62 ? 'timeout' : 'refused', peer: null }, base);
        const page = t.state.connectivityLog.page({}, TODAY);
        expect(page.rows).toHaveLength(1);
        expect(page.rows[0]).toMatchObject({ id: r1.id, atMs: T0, updatedAtMs: T0 + 62 * 3000, retry: { tries: 63, lastError: 'timeout', active: true } });
        const updates = t.state.connectivityLog.page({ after: poll }, TODAY);
        expect(updates.rows.map(r => r.id)).toEqual([r1.id]);
        expect(t.state.connectivityLog.page({ after: page.newest! }, TODAY).rows).toEqual([]);

        // Tries, newest first, paged.
        const tries = t.state.connectivityLog.tries(r1.id, null, 10)!;
        expect(tries.rowId).toBe(r1.id);
        expect(tries.rows).toHaveLength(10);
        expect(tries.rows[0]).toEqual({ atMs: T0 + 62 * 3000, error: 'timeout', peer: null });
        const more = t.state.connectivityLog.tries(r1.id, tries.nextBefore, 100)!;
        expect(more.rows).toHaveLength(53);
        expect(more.rows[52]).toEqual({ atMs: T0, error: 'refused', peer: '192.168.20.31:8080' });
        expect(more.nextBefore).toBeNull();
        expect(t.state.connectivityLog.tries('999', null, 5)).toBeNull();
        expect(t.state.connectivityLog.tries('not-a-number', null, 5)).toBeNull();

        // Ending the run updates the row once more; the next retry starts a NEW row.
        const ended = t.state.connectivityLog.endRetry(key, T0 + 999_000)!;
        expect(ended).toMatchObject({ id: r1.id, retry: { active: false, tries: 63 }, updatedAtMs: T0 + 999_000 });
        expect(t.state.connectivityLog.endRetry(key, T0 + 999_001)).toBeNull();
        const r2 = t.state.connectivityLog.retry(key, { atMs: T0 + 1_000_000, error: 'unreachable', peer: null }, base);
        expect(r2.id).not.toBe(r1.id);
        expect(r2.retry).toMatchObject({ tries: 1, active: true });
    });

    it('validates the query, cursors and rows (invalid_request), and prunes whole days', () => {
        t.state.connectivityLog.append(row(T0));
        expectCode(() => t.state.connectivityLog.page({ filter: 'bogus' as never }, TODAY), 'invalid_request');
        expectCode(() => t.state.connectivityLog.page({ day: '2026-02-30' }, TODAY), 'invalid_request');
        expectCode(() => t.state.connectivityLog.page({ limit: 0 }, TODAY), 'invalid_request');
        expectCode(() => t.state.connectivityLog.page({ limit: 201 }, TODAY), 'invalid_request');
        expectCode(() => t.state.connectivityLog.page({ before: 'abc' }, TODAY), 'invalid_request');
        expectCode(() => t.state.connectivityLog.page({ after: 'b.MTIz' }, TODAY), 'invalid_request');
        expectCode(() => t.state.connectivityLog.tries('1', 'zzz', 5), 'invalid_request');
        expectCode(() => t.state.connectivityLog.tries('1', null, 0), 'invalid_request');
        expectCode(() => t.state.connectivityLog.append(row(T0, { event: 'boom' as never })), 'invalid_request');
        expectCode(() => t.state.connectivityLog.append(row(T0, { source: 'moon' as never })), 'invalid_request');
        expectCode(() => t.state.connectivityLog.pruneBefore('soon'), 'invalid_request');

        t.state.connectivityLog.append(row(Date.UTC(2026, 8, 29, 9)));
        const retried = t.state.connectivityLog.retry('k', { atMs: Date.UTC(2026, 8, 29, 9), error: 'x', peer: null }, row(Date.UTC(2026, 8, 29, 9)));
        expect(t.state.connectivityLog.days()).toEqual(['2026-10-01', '2026-09-29']);
        expect(t.state.connectivityLog.pruneBefore('2026-10-01')).toBe(2);
        expect(t.state.connectivityLog.days()).toEqual(['2026-10-01']);
        expect(t.state.connectivityLog.tries(retried.id, null, 5)).toBeNull();
    });

    it('keeps only the documented data fields and stores the actor', () => {
        const actor = { nUserid: 'u-admin', name: 'Priya Shah', via: 'online' as const, operatorName: null };
        const r = t.state.connectivityLog.append(
            row(T0, { code: 'tx-settings-applied', actor, data: { lines: 2341, durationMs: 29 * 60_000, error: 'reset', protocol: 'bridge', secret: 'x' } as never }),
        );
        expect(r.actor).toEqual(actor);
        expect(r.data).toEqual({ lines: 2341, durationMs: 29 * 60_000, error: 'reset', protocol: 'bridge' });
    });
});
