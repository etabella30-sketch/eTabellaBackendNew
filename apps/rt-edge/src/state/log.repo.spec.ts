import { EdgePortError, isEdgePortError } from '../ports';
import type { ConnectivityLogInsert } from '../ports';
import type { EdgeDb } from './db';
import { assignment, tempState, TempState } from './testing/fixtures';

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

    it("names the session's pinned zone on every row about a session, as the row is read; box rows none (user decision 2026-10-05)", () => {
        t.state.sessions.upsertAssignment(assignment('ses-a', { tz: 'Asia/Dubai' }), T0);
        const appended = t.state.connectivityLog.append(row(T0));
        expect(appended.sessionTz).toBe('Asia/Dubai');
        t.state.connectivityLog.append(row(T0 + 1, { nSesid: null, sessionName: null, source: 'box', code: 'box-started', event: 'success', peer: null }));
        t.state.connectivityLog.append(row(T0 + 2, { nSesid: 'ses-gone' }));
        const retried = t.state.connectivityLog.retry('dial', { atMs: T0 + 3, error: 'refused', peer: null }, row(T0 + 3, { event: 'retrying', code: 'tx-refused', problem: true }));
        expect(retried.sessionTz).toBe('Asia/Dubai');
        const rows = t.state.connectivityLog.page({}, TODAY).rows;
        expect(rows.map(r => [r.nSesid, r.sessionTz])).toEqual([
            ['ses-a', 'Asia/Dubai'],
            ['ses-gone', null],
            [null, null],
            ['ses-a', 'Asia/Dubai'],
        ]);
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

    describe('Clear log (super admins, user decision 2026-10-04)', () => {
        const SUPER = { nUserid: 'u-super', name: 'A. Jha', via: 'online' as const, operatorName: null };
        const trace = (atMs: number): ConnectivityLogInsert => ({ atMs, event: 'success', source: 'box', code: 'log-cleared', problem: false, nSesid: null, sessionName: null, peer: null, actor: SUPER, data: {} });
        const count = (table: 'conn_log' | 'conn_log_tries'): number => Number((t.state as unknown as { db: EdgeDb }).db.get(`SELECT COUNT(*) AS n FROM ${table}`)!['n']);

        it('deletes every day and every try in one go and leaves ONE row naming who cleared it', () => {
            const key = 'tx-dial:192.168.20.31:8080';
            const base = row(T0, { event: 'retrying', code: 'tx-refused', problem: true, data: { error: 'refused' } });
            t.state.connectivityLog.append(row(Date.UTC(2026, 8, 29, 9)));
            t.state.connectivityLog.append(row(T0));
            t.state.connectivityLog.append(row(T0 + 1000, { source: 'cloud', code: 'cloud-connected' }));
            let run = t.state.connectivityLog.retry(key, { atMs: T0 + 2000, error: 'refused', peer: null }, base);
            for (let i = 1; i < 3; i++) run = t.state.connectivityLog.retry(key, { atMs: T0 + 2000 + i * 1000, error: 'refused', peer: null }, base);
            expect(t.state.connectivityLog.days()).toEqual([TODAY, '2026-09-29']);
            expect([count('conn_log'), count('conn_log_tries')]).toEqual([4, 3]);

            const cleared = t.state.connectivityLog.clearAll(trace(T0 + 60_000));
            expect(cleared.removed).toBe(4);
            expect(cleared.row).toMatchObject({ atMs: T0 + 60_000, updatedAtMs: T0 + 60_000, event: 'success', source: 'box', code: 'log-cleared', problem: false, nSesid: null, peer: null, actor: SUPER, data: {}, retry: null });
            expect([count('conn_log'), count('conn_log_tries')]).toEqual([1, 0]);
            expect(t.state.connectivityLog.days()).toEqual([TODAY]);
            expect(t.state.connectivityLog.page({}, TODAY).rows).toEqual([cleared.row]);
            expect(t.state.connectivityLog.page({ day: '2026-09-29' }, TODAY)).toMatchObject({ rows: [], newest: null, nextBefore: null });
            expect(t.state.connectivityLog.tries(run.id, null, 5)).toBeNull();

            // A malformed trace row is refused before anything is deleted.
            expectCode(() => t.state.connectivityLog.clearAll({ ...trace(T0 + 61_000), event: 'boom' as never }), 'invalid_request');
            expect(t.state.connectivityLog.page({}, TODAY).rows).toEqual([cleared.row]);
        });

        it('keeps the change counter and ids counting: an old after cursor gets only the trace row, an old before cursor an empty page', () => {
            const key = 'tx-dial:192.168.20.31:8080';
            const base = row(T0, { event: 'retrying', code: 'tx-refused', problem: true, data: { error: 'refused' } });
            t.state.connectivityLog.append(row(T0));
            const run = t.state.connectivityLog.retry(key, { atMs: T0 + 1000, error: 'refused', peer: null }, base);
            t.state.connectivityLog.retry(key, { atMs: T0 + 2000, error: 'refused', peer: null }, base);
            t.state.connectivityLog.append(row(T0 + 3000, { code: 'tx-reset' }));
            const first = t.state.connectivityLog.page({ limit: 1 }, TODAY);
            const changeSeq = t.state.impl.kv.getNumber('connlog.changeSeq');
            expect(first.rows.map(r => r.code)).toEqual(['tx-reset']);
            expect(first.nextBefore).toMatch(/^b\./);
            expect(first.newest).toMatch(/^a\./);

            const cleared = t.state.connectivityLog.clearAll(trace(T0 + 60_000));
            expect(t.state.impl.kv.getNumber('connlog.changeSeq')).toBe(changeSeq + 1);
            expect(Number(cleared.row.id)).toBeGreaterThan(Math.max(Number(run.id), Number(first.rows[0].id)));
            expect(t.state.connectivityLog.page({ after: first.newest! }, TODAY).rows).toEqual([cleared.row]);
            expect(t.state.connectivityLog.page({ before: first.nextBefore!, limit: 1 }, TODAY)).toMatchObject({ rows: [], nextBefore: null });
            const after = t.state.connectivityLog.page({}, TODAY);
            expect(after.newest).not.toBe(first.newest);
            expect(t.state.connectivityLog.page({ after: after.newest! }, TODAY).rows).toEqual([]);
        });

        it('the trace row passes every filter and search, so a page open on any of them learns of the clear by its after poll', () => {
            t.state.connectivityLog.append(row(T0, { event: 'retrying', code: 'tx-refused', problem: true, data: { error: 'refused' } }));
            t.state.connectivityLog.append(row(T0 + 1000, { source: 'cloud', code: 'cloud-refused', problem: true }));
            const queries = [{}, { filter: 'problems' as const }, { filter: 'transmitter' as const }, { filter: 'cloud' as const }, { q: 'refused' }, { filter: 'problems' as const, q: 'cloud' }];
            const open = queries.map(q => ({ q, newest: t.state.connectivityLog.page(q, TODAY).newest! }));
            expect(open.every(o => /^a\./.test(o.newest))).toBe(true);

            const cleared = t.state.connectivityLog.clearAll(trace(T0 + 60_000));
            for (const o of open) {
                expect([o.q, t.state.connectivityLog.page({ ...o.q, after: o.newest }, TODAY).rows]).toEqual([o.q, [cleared.row]]);
                expect([o.q, t.state.connectivityLog.page(o.q, TODAY).rows]).toEqual([o.q, [cleared.row]]);
            }
            // Filters and search still narrow every other row.
            t.state.connectivityLog.append(row(T0 + 61_000, { source: 'cloud', code: 'cloud-connected' }));
            expect(t.state.connectivityLog.page({ filter: 'transmitter' }, TODAY).rows.map(r => r.code)).toEqual(['log-cleared']);
            expect(t.state.connectivityLog.page({ filter: 'cloud' }, TODAY).rows.map(r => r.code)).toEqual(['cloud-connected', 'log-cleared']);
        });

        it('a retry run active before the clear is gone: endRetry finds nothing and the next retry of its key starts a new row', () => {
            const key = 'tx-dial:192.168.20.31:8080';
            const base = row(T0, { event: 'retrying', code: 'tx-refused', problem: true, data: { error: 'refused' } });
            const run = t.state.connectivityLog.retry(key, { atMs: T0, error: 'refused', peer: '192.168.20.31:8080' }, base);
            t.state.connectivityLog.retry(key, { atMs: T0 + 3000, error: 'refused', peer: null }, base);
            const cleared = t.state.connectivityLog.clearAll(trace(T0 + 60_000));
            expect(t.state.connectivityLog.endRetry(key, T0 + 61_000)).toBeNull();

            const again = t.state.connectivityLog.retry(key, { atMs: T0 + 70_000, error: 'timeout', peer: null }, row(T0 + 70_000, { event: 'retrying', code: 'tx-timeout', problem: true }));
            expect(again.id).not.toBe(run.id);
            expect(again).toMatchObject({ event: 'retrying', code: 'tx-timeout', atMs: T0 + 70_000, retry: { sinceMs: T0 + 70_000, tries: 1, lastError: 'timeout', active: true } });
            expect(t.state.connectivityLog.tries(again.id, null, 10)!.rows).toEqual([{ atMs: T0 + 70_000, error: 'timeout', peer: null }]);
            expect(t.state.connectivityLog.page({}, TODAY).rows.map(r => r.id)).toEqual([again.id, cleared.row.id]);
            // The run counts on in that new row.
            expect(t.state.connectivityLog.retry(key, { atMs: T0 + 73_000, error: 'timeout', peer: null }, base)).toMatchObject({ id: again.id, retry: { tries: 2 } });
        });
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
