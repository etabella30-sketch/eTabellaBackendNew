/**
 * OpsService over the REAL node:sqlite state (state/sqlite-state.ts, a temp dir under os.tmpdir()): the Connectivity
 * Log exactly as the operator pages it (D34, DR12; CONTRACTS.md §8.5) — newest first, opaque cursors, the four
 * filters, search, other days, the "N new events" poll, collapsed retry runs with their tries count, and no delete —
 * plus the reporter card from a real session record. Kernel, uplink, auth, host and timers stay fakes; no network.
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { Logger } from '@nestjs/common';

import { ConnectivityLogQuery, ConnectivityLogRow } from '../contracts';
import { sessionAssignment } from '../kernel/testing/kernel-harness';
import { ConnectivityLogInsert, EdgePortError, InMemoryEdgeEventBus } from '../ports';
import { SqliteEdgeState } from '../state/sqlite-state';
import { DEFAULT_OPS_TUNING } from './ops.constants';
import { OpsService } from './ops.service';
import { FakeAuth, FakeBoot, FakeKernel, FakeOpsHost, FakeUplink, ManualTimers, NOW, principalOf, testConfig, TODAY } from './testing/ops-fakes';

const YESTERDAY = '2026-09-30';
const PEER = '192.168.20.31:8080';

function row(over: Partial<ConnectivityLogInsert>): ConnectivityLogInsert {
    return { atMs: NOW, event: 'connected', source: 'transmitter', code: 'tx-connected', problem: false, nSesid: null, sessionName: null, peer: null, actor: null, data: {}, ...over };
}

async function refusal(work: () => unknown): Promise<EdgePortError> {
    try {
        await work();
    } catch (err) {
        expect(err).toBeInstanceOf(EdgePortError);
        return err as EdgePortError;
    }
    throw new Error('expected a refusal');
}

beforeAll(() => Logger.overrideLogger(false));
afterAll(() => Logger.overrideLogger(['log', 'error', 'warn', 'debug', 'verbose']));

describe('OpsService over the real sqlite state', () => {
    let dir: string;
    let state: SqliteEdgeState;
    let ops: OpsService;
    let auth: FakeAuth;

    beforeEach(() => {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-edge-ops-'));
        const config = testConfig({}, dir);
        state = SqliteEdgeState.open({ file: config.paths.stateDb, timeZone: config.box.timeZone });
        auth = new FakeAuth();
        ops = new OpsService(config, () => NOW, new InMemoryEdgeEventBus(), new FakeBoot(), state, new FakeKernel().asPort(), new FakeUplink().asPort(), auth.asPort(), new FakeOpsHost(), new ManualTimers(), {
            ...DEFAULT_OPS_TUNING,
            probeTimeoutMs: 20,
            syncTimeoutMs: 20,
        });
    });

    afterEach(async () => {
        await ops.close();
        await state.close();
        fs.rmSync(dir, { recursive: true, force: true });
    });

    /** A day of rows: a connect, a cloud row, a 63-try dial run, an internet drop, and one row yesterday. */
    function seed(): { retry: ConnectivityLogRow } {
        const log = state.connectivityLog;
        log.append(row({ atMs: NOW - 86_400_000, source: 'box', event: 'success', code: 'box-started' }));
        log.append(row({ atMs: NOW - 60_000, code: 'tx-connected', nSesid: 's1', sessionName: 'Day 3 — Morning', peer: PEER, data: { protocol: 'bridge' } }));
        log.append(row({ atMs: NOW - 55_000, source: 'cloud', code: 'cloud-connected' }));
        let retry!: ConnectivityLogRow;
        for (let i = 0; i < 63; i++) {
            retry = log.retry(
                `tx-dial:${PEER}`,
                { atMs: NOW - 50_000 + i * 100, error: i === 62 ? 'timeout' : 'refused', peer: PEER },
                row({ atMs: NOW - 50_000 + i * 100, event: 'retrying', code: 'tx-refused', problem: true, peer: PEER, data: { error: 'refused' } }),
            );
        }
        log.append(row({ atMs: NOW - 30_000, source: 'network', event: 'error', code: 'internet-down', problem: true }));
        return { retry };
    }

    it('pages a day newest first with the defaults; the dial retries are ONE row with a tries count', () => {
        const { retry } = seed();
        const page = ops.connectivityLog({});
        expect(page).toMatchObject({ filter: 'all', day: TODAY, nextBefore: null, days: [TODAY, YESTERDAY] });
        expect(page.newest).toEqual(expect.any(String));
        expect(page.rows.map(r => r.code)).toEqual(['internet-down', 'tx-refused', 'cloud-connected', 'tx-connected']);
        const collapsed = page.rows[1];
        expect(collapsed).toMatchObject({ id: retry.id, event: 'retrying', atMs: NOW - 50_000, updatedAtMs: NOW - 50_000 + 6_200, problem: true, peer: PEER });
        expect(collapsed.retry).toEqual({ sinceMs: NOW - 50_000, tries: 63, lastError: 'timeout', active: true });
        // "No events today" on a day without rows; the other day is listed.
        expect(ops.connectivityLog({ day: '2026-09-29' })).toEqual({ filter: 'all', day: '2026-09-29', rows: [], nextBefore: null, newest: null, days: [TODAY, YESTERDAY] });
        expect(ops.connectivityLog({ day: YESTERDAY }).rows.map(r => r.code)).toEqual(['box-started']);
    });

    it('follows the opaque older-page cursor to the end without gaps or repeats', () => {
        seed();
        const seen: string[] = [];
        let before: string | undefined;
        for (let guard = 0; guard < 10; guard++) {
            const page = ops.connectivityLog({ limit: 1, ...(before ? { before } : {}) });
            seen.push(...page.rows.map(r => r.code));
            if (!page.nextBefore) break;
            before = page.nextBefore;
        }
        expect(seen).toEqual(['internet-down', 'tx-refused', 'cloud-connected', 'tx-connected']);
    });

    it('filters All / Problems / Transmitter / Cloud and searches code, peer, session and error text', () => {
        seed();
        const codes = (q: ConnectivityLogQuery) => ops.connectivityLog(q).rows.map(r => r.code);
        expect(codes({ filter: 'problems' })).toEqual(['internet-down', 'tx-refused']);
        expect(codes({ filter: 'transmitter' })).toEqual(['tx-refused', 'tx-connected']);
        expect(codes({ filter: 'cloud' })).toEqual(['cloud-connected']);
        expect(codes({ q: 'REFUSED' })).toEqual(['tx-refused']);
        expect(codes({ q: '192.168.20.31' })).toEqual(['tx-refused', 'tx-connected']);
        expect(codes({ q: 'morning' })).toEqual(['tx-connected']);
        expect(codes({ q: '   ' })).toHaveLength(4);
        expect(codes({ filter: 'cloud', q: 'refused' })).toEqual([]);
    });

    it('"N new events": rows created OR updated after the cursor, the collapsed row again with its id', () => {
        const { retry } = seed();
        const cursor = ops.connectivityLog({}).newest!;
        expect(ops.connectivityLog({ after: cursor }).rows).toEqual([]);
        state.connectivityLog.retry(`tx-dial:${PEER}`, { atMs: NOW, error: 'refused', peer: PEER }, row({ atMs: NOW, event: 'retrying', code: 'tx-refused', problem: true }));
        state.connectivityLog.append(row({ atMs: NOW, source: 'cloud', code: 'cloud-synced', event: 'success' }));
        const fresh = ops.connectivityLog({ after: cursor });
        expect(fresh.rows.map(r => [r.id === retry.id ? 'retry-row' : r.code, r.retry?.tries ?? null])).toEqual([
            ['cloud-synced', null],
            ['retry-row', 64],
        ]);
        // The run ends (connected): the same row stops counting.
        state.connectivityLog.endRetry(`tx-dial:${PEER}`, NOW + 1);
        const ended = ops.connectivityLog({ after: fresh.newest! });
        expect(ended.rows.map(r => [r.id, r.retry])).toEqual([[retry.id, { sinceMs: NOW - 50_000, tries: 64, lastError: 'refused', active: false }]]);
    });

    it('"Show tries": every attempt of a collapsed row, newest first, paged by cursor', () => {
        const { retry } = seed();
        const first = ops.connectivityLogTries(retry.id, null, 50);
        expect(first).toMatchObject({ rowId: retry.id });
        expect(first.rows).toHaveLength(50);
        expect(first.rows[0]).toEqual({ atMs: NOW - 50_000 + 6_200, error: 'timeout', peer: PEER });
        const rest = ops.connectivityLogTries(retry.id, first.nextBefore, 50);
        expect(rest.rows).toHaveLength(13);
        expect(rest.nextBefore).toBeNull();
        expect(rest.rows[rest.rows.length - 1]).toEqual({ atMs: NOW - 50_000, error: 'refused', peer: PEER });
        expect(ops.connectivityLogTries(retry.id, null, null).rows).toHaveLength(50);
        // A plain row has no tries; an unknown row is not_found.
        const plain = ops.connectivityLog({ filter: 'cloud' }).rows[0];
        expect(ops.connectivityLogTries(plain.id, null, 10).rows).toEqual([]);
    });

    it('refuses cursors it did not mint and unknown rows; offers no way to delete', async () => {
        seed();
        const page = ops.connectivityLog({ limit: 1 });
        for (const q of [{ before: 'garbage' }, { after: 'garbage' }, { before: page.newest! }, { after: page.nextBefore! }, { day: '01-10-2026' }]) {
            expect((await refusal(() => ops.connectivityLog(q))).code).toBe('invalid_request');
        }
        expect((await refusal(() => ops.connectivityLogTries('999999', null, 10))).code).toBe('not_found');
        expect((await refusal(() => ops.connectivityLogTries('nope', null, 10))).code).toBe('not_found');
        expect((await refusal(() => ops.connectivityLogTries('1', 'garbage', 10))).code).toBe('invalid_request');
        const proto = Object.getOwnPropertyNames(OpsService.prototype);
        expect(proto.filter(n => /delete|clear|remove|truncate/i.test(n))).toEqual([]);
    });

    it('reporter card from a real session record: the Eclipse username, never a password or the hash', () => {
        state.sessions.upsertAssignment(sessionAssignment('s-real'), NOW - 3_600_000);
        auth.openable = new Set(['s-real']);
        const card = ops.reporterCard(principalOf('online'), { nSesid: 's-real' });
        expect(card).toMatchObject({ nSesid: 's-real', sessionName: 'Day 3 — s-real', username: 'eclipse-s-real', password: null, passwordSource: 'rt-production', serverAddress: '192.168.20.2', port: 2500 });
        const record = state.sessions.get('s-real')!;
        expect(JSON.stringify(card)).not.toContain(record.route!.hash);
        expect(JSON.stringify(card)).not.toContain(record.route!.salt);
        expect(state.audit.list({ limit: 10 })).toEqual([expect.objectContaining({ action: 'reporter-card', outcome: 'ok', nSesid: 's-real' })]);
    });
});
