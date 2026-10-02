/**
 * Fakes for the ops specs: in-memory ports (state, kernel, uplink, auth, boot), a scriptable host, manual timers and
 * an in-memory Connectivity Log that follows the repo contract (retry collapse, cursors, filters). No network, no
 * database, no timers of their own. Not a spec file; no jest globals (it compiles with the app).
 */
import * as path from 'path';

import type {
    ConnectivityLogPage,
    ConnectivityLogQuery,
    ConnectivityLogRow,
    ConnectivityLogTriesPage,
    CloudLinkStatus,
    EdgeActor,
    EdgeInternetStatus,
    TransmitterApplyRequest,
    TransmitterLinkStatus,
    TransmitterSettings,
    TransmitterTestRequest,
} from '../../contracts';
import {
    AuthPort,
    BoxCaseRecord,
    BoxConfig,
    BoxIdentityRecord,
    BoxRosterMember,
    BoxSessionRecord,
    ConnectivityLogAttempt,
    ConnectivityLogInsert,
    ConnectivityLogRepo,
    EDGE_LAN_LISTENER_NOT_STARTED,
    EdgeAuditEntry,
    EdgeBootStatus,
    EdgeCertificateStatus,
    EdgeLanListenerStatus,
    EdgePortError,
    EdgePrincipal,
    EdgeServiceStep,
    EdgeStartFailure,
    HeldCaptureRecord,
    KernelPort,
    KernelSessionView,
    KernelTransmitterState,
    KernelTransmitterTest,
    OperatorCodeRecord,
    parseBoxConfig,
    StateHealth,
    StatePort,
    UplinkLinkStatus,
    UplinkPort,
    UplinkSessionSync,
} from '../../ports';
import type { OpsClockReading, OpsDiskUsage, OpsDnsProbe, OpsHost, OpsHttpsProbe, OpsInterfaceAddress, OpsTimers } from '../ops-host';

/** 2026-10-01 10:30 in London (09:30 UTC). */
export const NOW = Date.UTC(2026, 9, 1, 9, 30);
export const TODAY = '2026-10-01';

export function testConfig(extra: Record<string, unknown> = {}, dataDir = path.join('/', 'tmp', 'rt-edge-ops-spec')): BoxConfig {
    return parseBoxConfig(
        {
            mode: 'dev',
            box: { name: 'Court 3', label: 'VB-014', timeZone: 'Europe/London' },
            cloud: { origin: 'https://cloud.invalid' },
            http: { host: '0.0.0.0', port: 0, tls: null },
            transmitter: { bindAddress: '192.168.20.2', networkCidr: '192.168.20.0/24' },
            paths: { dataDir },
            release: { version: '1.0.3', backendCommit: 'abc1234', feCommit: 'def5678' },
            shutdownTimeoutMs: 100,
            ...extra,
        },
        path.join(dataDir, 'rt-edge.json'),
    );
}

// ---------------------------------------------------------------------------------------------------------------
// Records
// ---------------------------------------------------------------------------------------------------------------

export function sessionRecord(over: Partial<BoxSessionRecord> = {}): BoxSessionRecord {
    return {
        nSesid: 's1',
        nCaseid: 'c1',
        cName: 'Day 3 — Morning',
        dStartDt: '2026-10-01 10:00:00',
        tz: 'Europe/London',
        nLines: 25,
        protocol: 'B',
        epoch: 1,
        rebaseSeq: null,
        parserVer: '1.1.0',
        fmt: 1,
        route: { user: 'eclipse-user-7', salt: 'c2FsdHNhbHRzYWx0c2FsdA==', hash: 'aGFzaGhhc2hoYXNoaGFzaGhhc2hoYXNoaGFzaGhhc2g=', scryptN: 32768 },
        hearingOperator: null,
        nPartNo: 1,
        nPrevPartSesid: null,
        next: null,
        cloudOp: 'upsert',
        deleted: false,
        localState: 'armed',
        listed: true,
        assignedAtMs: NOW - 86_400_000,
        updatedAtMs: NOW - 3_600_000,
        firstLineAtMs: null,
        endRequestedAtMs: null,
        endedAtMs: null,
        sealedAtMs: null,
        sealState: null,
        purgedAtMs: null,
        ...over,
    };
}

export function kernelView(over: Partial<KernelSessionView> = {}): KernelSessionView {
    return {
        nSesid: 's1',
        localState: 'live',
        phase: 'live',
        feed: 'live',
        protocol: 'B',
        mode: 'listen',
        catConnected: true,
        peer: '192.168.20.31:51000',
        heldPeers: [],
        lockout: false,
        bytesIn: 12_345,
        lastByteAtMs: NOW - 1_000,
        firstLineAtMs: NOW - 1_800_000,
        lastLineAtMs: NOW - 2_000,
        feedStoppedAtMs: null,
        lastLine: { page: 41, line: 18, atMs: NOW - 2_000 },
        endRequestedAtMs: null,
        endedAtMs: null,
        rev: 120,
        totalLines: 1018,
        page: 41,
        root: 'f'.repeat(64),
        raw: { headSeq: 900, headHash: 'a'.repeat(64), durableSeq: 900, durableHash: 'b'.repeat(64) },
        durability: 'ok',
        degradedSinceMs: null,
        journalCorrupt: false,
        recovering: null,
        incidents: { total: 0, warnings: 0 },
        parseErrors: 0,
        lastAudit: { atMs: NOW - 30_000, ok: true },
        ...over,
    };
}

export function syncOf(over: Partial<UplinkSessionSync> = {}): UplinkSessionSync {
    return {
        nSesid: 's1',
        uplinkState: 'ok',
        verdict: 'continue',
        cloudAppliedRev: 120,
        appliedRawSeq: 900,
        rawAckedSeq: 900,
        cloudRoot: '9f3c' + 'e'.repeat(56) + 'c0a1',
        dirtyPages: 0,
        lagLines: 0,
        lagBytes: 0,
        lagSec: 0,
        lastSyncedAtMs: NOW - 4_000,
        frozenAtMs: null,
        frozenReason: null,
        heldShrinkId: null,
        sealState: null,
        ...over,
    };
}

export function identity(over: Partial<BoxIdentityRecord> = {}): BoxIdentityRecord {
    return {
        nEdgeid: 'e7d1c2b0-0000-4000-8000-000000000014',
        slug: 'k7q2m9x4',
        status: 'active',
        keyFingerprint: 'AB:CD:EF:01:23:45:67:89:AB:CD:EF:01:23:45:67:89:AB:CD:EF:01:23:45:67:89:AB:CD:EF:01:23:45:67:89',
        publicKeySpki: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEdevicepublickeydevicepublickeydevicepublickey==',
        tpmKey: false,
        cloudOrigin: 'https://cloud.invalid',
        enrolledAtMs: NOW - 30 * 86_400_000,
        confirmedAtMs: NOW - 29 * 86_400_000,
        lastCloudContactAtMs: NOW - 10_000,
        linkFailure: null,
        ...over,
    };
}

export function principalOf(kind: EdgePrincipal['kind'] = 'online', over: Partial<EdgePrincipal> = {}): EdgePrincipal {
    return {
        kind,
        userId: kind === 'operator' ? null : 'u1',
        name: kind === 'operator' ? 'Operator' : 'Priya Shah',
        email: kind === 'operator' ? null : 'priya@example.test',
        caseIds: ['c1'],
        adminCaseIds: kind === 'room-code' ? [] : ['c1'],
        sessionId: kind === 'room-code' ? 's1' : undefined,
        isBoxAdmin: kind !== 'room-code',
        isSuperAdmin: false,
        validUntil: NOW + 3_600_000,
        untilSessionEnds: kind === 'room-code',
        jti: `jti-${kind}`,
        issuedAt: NOW - 60_000,
        authTime: kind === 'online' ? NOW - 60_000 : null,
        mintedBy: kind === 'operator' ? { nUserid: 'u9', name: 'Maria Admin' } : null,
        operatorDay: kind === 'operator' ? TODAY : null,
        deviceHash: null,
        forwardable: kind === 'online',
        token: `eyJhbGciOiJFUzI1NiJ9.eyJzdWIiOiJ1MSJ9secretpayload.c2lnbmF0dXJlc2lnbmF0dXJl-${kind}`,
        ...over,
    };
}

export const goodCertificate = (over: Partial<EdgeCertificateStatus> = {}): EdgeCertificateStatus => ({
    state: 'ok',
    problem: null,
    info: {
        notBeforeMs: NOW - 10 * 86_400_000,
        notAfterMs: NOW + 80 * 86_400_000,
        hosts: ['k7q2m9x4.etabella-edge.net'],
        fingerprint256: 'AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99',
    },
    daysLeft: 80,
    coversHost: true,
    checkedAtMs: NOW,
    ...over,
});

// ---------------------------------------------------------------------------------------------------------------
// Connectivity Log (reference in-memory implementation of the repo contract)
// ---------------------------------------------------------------------------------------------------------------

interface StoredRow {
    row: ConnectivityLogRow;
    day: string;
    changed: number;
    attempts: ConnectivityLogAttempt[];
}

const enc = (o: unknown): string => Buffer.from(JSON.stringify(o)).toString('base64url');
function dec<T>(cursor: string): T {
    try {
        return JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as T;
    } catch {
        throw new EdgePortError('invalid_request', 'bad cursor');
    }
}

export class FakeConnectivityLog implements ConnectivityLogRepo {
    private readonly rows: StoredRow[] = [];
    private readonly activeRuns = new Map<string, StoredRow>();
    private nextId = 1;
    private changeSeq = 0;

    constructor(private readonly dayOf: (ms: number) => string) {}

    append(insert: ConnectivityLogInsert): ConnectivityLogRow {
        const row: ConnectivityLogRow = { ...insert, id: `r${this.nextId++}`, updatedAtMs: insert.atMs, retry: null };
        this.rows.push({ row, day: this.dayOf(insert.atMs), changed: ++this.changeSeq, attempts: [] });
        return row;
    }

    retry(key: string, attempt: ConnectivityLogAttempt, insert: ConnectivityLogInsert): ConnectivityLogRow {
        const active = this.activeRuns.get(key);
        if (active && active.row.retry?.active) {
            active.row = {
                ...active.row,
                updatedAtMs: attempt.atMs,
                retry: { ...active.row.retry, tries: active.row.retry.tries + 1, lastError: attempt.error },
            };
            active.attempts.push(attempt);
            active.changed = ++this.changeSeq;
            return active.row;
        }
        const row: ConnectivityLogRow = {
            ...insert,
            event: 'retrying',
            id: `r${this.nextId++}`,
            updatedAtMs: attempt.atMs,
            retry: { sinceMs: attempt.atMs, tries: 1, lastError: attempt.error, active: true },
        };
        const stored: StoredRow = { row, day: this.dayOf(insert.atMs), changed: ++this.changeSeq, attempts: [attempt] };
        this.rows.push(stored);
        this.activeRuns.set(key, stored);
        return row;
    }

    endRetry(key: string, atMs: number): ConnectivityLogRow | null {
        const active = this.activeRuns.get(key);
        if (!active || !active.row.retry?.active) return null;
        active.row = { ...active.row, updatedAtMs: atMs, retry: { ...active.row.retry, active: false } };
        active.changed = ++this.changeSeq;
        this.activeRuns.delete(key);
        return active.row;
    }

    page(query: ConnectivityLogQuery, today: string): Omit<ConnectivityLogPage, 'msg'> {
        const filter = query.filter ?? 'all';
        if (!['all', 'problems', 'transmitter', 'cloud'].includes(filter)) throw new EdgePortError('invalid_request', 'filter');
        const day = query.day ?? today;
        const limit = query.limit ?? 50;
        if (!Number.isInteger(limit) || limit < 1 || limit > 200) throw new EdgePortError('invalid_request', 'limit');
        const q = query.q?.toLowerCase() ?? null;
        const matches = (s: StoredRow): boolean => {
            if (s.day !== day) return false;
            if (filter === 'problems' && !s.row.problem) return false;
            if (filter === 'transmitter' && s.row.source !== 'transmitter') return false;
            if (filter === 'cloud' && s.row.source !== 'cloud') return false;
            if (q && ![s.row.code, s.row.peer, s.row.sessionName, s.row.data.error].some(v => typeof v === 'string' && v.toLowerCase().includes(q))) return false;
            return true;
        };
        const ofDay = this.rows.filter(s => s.day === day);
        const newestChange = ofDay.length ? Math.max(...ofDay.map(s => s.changed)) : null;
        const newest = newestChange === null ? null : enc({ c: newestChange });
        const sorted = this.rows.filter(matches).sort((a, b) => b.row.atMs - a.row.atMs || Number(b.row.id.slice(1)) - Number(a.row.id.slice(1)));
        if (query.after !== undefined) {
            const { c } = dec<{ c: number }>(query.after);
            if (typeof c !== 'number') throw new EdgePortError('invalid_request', 'bad cursor');
            return { filter, day, rows: sorted.filter(s => s.changed > c).map(s => s.row), nextBefore: null, newest, days: this.days() };
        }
        let start = 0;
        if (query.before !== undefined) {
            const { at, id } = dec<{ at: number; id: number }>(query.before);
            if (typeof at !== 'number' || typeof id !== 'number') throw new EdgePortError('invalid_request', 'bad cursor');
            start = sorted.findIndex(s => s.row.atMs < at || (s.row.atMs === at && Number(s.row.id.slice(1)) < id));
            if (start < 0) start = sorted.length;
        }
        const pageRows = sorted.slice(start, start + limit);
        const last = pageRows[pageRows.length - 1];
        const nextBefore = start + limit < sorted.length && last ? enc({ at: last.row.atMs, id: Number(last.row.id.slice(1)) }) : null;
        return { filter, day, rows: pageRows.map(s => s.row), nextBefore, newest, days: this.days() };
    }

    tries(rowId: string, before: string | null, limit: number): Omit<ConnectivityLogTriesPage, 'msg'> | null {
        const stored = this.rows.find(s => s.row.id === rowId);
        if (!stored) return null;
        const all = [...stored.attempts].reverse();
        let start = 0;
        if (before !== null) {
            const { i } = dec<{ i: number }>(before);
            if (typeof i !== 'number') throw new EdgePortError('invalid_request', 'bad cursor');
            start = i;
        }
        const rows = all.slice(start, start + limit);
        return { rowId, rows, nextBefore: start + limit < all.length ? enc({ i: start + limit }) : null };
    }

    days(): readonly string[] {
        return [...new Set(this.rows.map(s => s.day))].sort().reverse();
    }

    pruneBefore(beforeDay: string): number {
        const keep = this.rows.filter(s => s.day >= beforeDay);
        const removed = this.rows.length - keep.length;
        this.rows.splice(0, this.rows.length, ...keep);
        return removed;
    }

    all(): ConnectivityLogRow[] {
        return this.rows.map(s => s.row);
    }
}

// ---------------------------------------------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------------------------------------------

const unused = (name: string) => (): never => {
    throw new Error(`FakeState: ${name} is not used by ops`);
};

export class FakeState {
    sessionsData: BoxSessionRecord[] = [];
    cases: BoxCaseRecord[] = [{ nCaseid: 'c1', cCasename: 'Acme v Beta', cCaseno: 'HC-2026-001', assignedAtMs: NOW - 86_400_000 }];
    roster: BoxRosterMember[] = [
        { nUserid: 'u1', name: 'Priya Shah', email: 'priya@example.test', nCaseid: 'c1', nSesid: null, role: 'Counsel', isCaseAdmin: true, active: true, source: 'team' },
        { nUserid: 'u2', name: 'Daniel Okafor', email: 'daniel@example.test', nCaseid: 'c1', nSesid: null, role: 'Paralegal', isCaseAdmin: false, active: true, source: 'team' },
    ];
    syncedAtMs: number | null = NOW - 60_000;
    identityRecord: BoxIdentityRecord | null = identity();
    operatorCodesByDay = new Map<string, OperatorCodeRecord>();
    captures: HeldCaptureRecord[] = [];
    auditRows: Array<EdgeAuditEntry & { id: string }> = [];
    counterValue = 0;
    raised: number[] = [];
    purged: string[] = [];
    pruned: Array<[string, unknown]> = [];
    failCounters = false;
    readonly log: FakeConnectivityLog;

    constructor(private readonly timeZone = 'Europe/London') {
        this.log = new FakeConnectivityLog(ms => new Intl.DateTimeFormat('en-CA', { timeZone: this.timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms)));
    }

    asPort(): StatePort {
        const self = this;
        const live = (): BoxSessionRecord[] => self.sessionsData.filter(s => s.localState !== 'purged');
        return {
            sessions: {
                get: (id: string) => self.sessionsData.find(s => s.nSesid === id) ?? null,
                list: (opts?: { includePurged?: boolean }) => (opts?.includePurged ? [...self.sessionsData] : live()),
                forCase: (c: string) => live().filter(s => s.nCaseid === c),
                upsertAssignment: unused('upsertAssignment'),
                requestEnd: unused('requestEnd'),
                setLocal: unused('setLocal'),
                purge: (id: string, atMs: number) => {
                    const i = self.sessionsData.findIndex(s => s.nSesid === id);
                    if (i < 0) throw new EdgePortError('session_not_found', id);
                    self.sessionsData[i] = { ...self.sessionsData[i], localState: 'purged', purgedAtMs: atMs };
                    self.purged.push(id);
                    self.captures = self.captures.filter(c => c.nSesid !== id);
                    return self.sessionsData[i];
                },
            },
            assignments: {
                replaceAll: unused('replaceAll'),
                markSynced: unused('markSynced'),
                syncedAtMs: () => self.syncedAtMs,
                cases: () => [...self.cases],
                case: (id: string) => self.cases.find(c => c.nCaseid === id) ?? null,
            },
            roster: {
                forCase: (c: string) => self.roster.filter(r => r.nCaseid === c),
                forSession: unused('forSession'),
                forUser: (u: string) => self.roster.filter(r => r.nUserid === u && r.active),
                person: unused('person'),
                superAdmins: () => [],
                isSuperAdmin: () => false,
                counts: () => ({
                    people: new Set(self.roster.filter(r => r.active).map(r => r.nUserid)).size,
                    cases: new Set(self.roster.filter(r => r.active).map(r => r.nCaseid)).size,
                }),
            },
            checkpoints: {} as StatePort['checkpoints'],
            revocations: {
                applyCloud: unused('applyCloud'),
                cloudSince: () => 0,
                revokeUser: unused('revokeUser'),
                userRevokedAtMs: () => null,
                denyJti: unused('denyJti'),
                isJtiDenied: () => false,
                prune: (now: number) => {
                    self.pruned.push(['revocations', now]);
                    return 0;
                },
            },
            connectivityLog: self.log,
            incidents: {
                record: unused('incidents.record'),
                list: () => [{ nSesid: 's1', seq: 12, atMs: NOW - 600_000, kind: 'CAT_DISCONNECT', level: 'info', note: 'TRANSCRIPT SNIPPET IN A NOTE' }],
                count: () => ({ total: 1, warnings: 0 }),
            },
            heldCaptures: {
                upsert: unused('heldCaptures.upsert'),
                get: (id: string) => self.captures.find(c => c.id === id) ?? null,
                list: (filter?: { nSesid?: string; pendingUpload?: boolean }) =>
                    self.captures.filter(c => (!filter?.nSesid || c.nSesid === filter.nSesid) && (!filter?.pendingUpload || (c.sha256 !== null && c.uploadedAtMs === null))),
                markUploaded: unused('markUploaded'),
            },
            roomCodes: {} as StatePort['roomCodes'],
            operatorCodes: {
                get: (day: string) => self.operatorCodesByDay.get(day) ?? null,
                put: unused('operatorCodes.put'),
                recordUse: unused('recordUse'),
                purgeBefore: (day: string) => {
                    self.pruned.push(['operatorCodes', day]);
                    return 0;
                },
            },
            transmitter: {} as StatePort['transmitter'],
            counters: {
                get: () => {
                    if (self.failCounters) throw new Error('sqlite: disk I/O error');
                    return self.counterValue;
                },
                raise: (_name: string, value: number) => {
                    if (self.failCounters) throw new Error('sqlite: disk I/O error');
                    self.raised.push(value);
                    self.counterValue = Math.max(self.counterValue, value);
                    return self.counterValue;
                },
            },
            identity: {
                get: () => self.identityRecord,
                save: unused('identity.save'),
                patch: unused('identity.patch'),
                secret: unused('identity.secret'),
            },
            jwks: {} as StatePort['jwks'],
            audit: {
                append: (entry: EdgeAuditEntry) => {
                    self.auditRows.push({ ...entry, id: `a${self.auditRows.length + 1}` });
                },
                list: (opts: { sinceMs?: number; limit: number }) =>
                    [...self.auditRows]
                        .filter(a => opts.sinceMs === undefined || a.atMs >= opts.sinceMs)
                        .reverse()
                        .slice(0, opts.limit),
                pruneBefore: (beforeMs: number) => {
                    self.pruned.push(['audit', beforeMs]);
                    return 0;
                },
            },
            transaction: <T>(fn: () => T): T => fn(),
            health: (): StateHealth => ({ ok: true, file: '/var/lib/etabella-edge/edge.sqlite', sizeBytes: 4096, walBytes: 0, schemaVersion: 1 }),
            close: async () => undefined,
        } as unknown as StatePort;
    }
}

// ---------------------------------------------------------------------------------------------------------------
// Kernel
// ---------------------------------------------------------------------------------------------------------------

export function linkOf(over: Partial<TransmitterLinkStatus> = {}): TransmitterLinkStatus {
    return {
        state: 'live',
        mode: 'listen',
        protocol: 'bridge',
        sinceMs: NOW - 1_800_000,
        attempt: null,
        quietLevel: null,
        peer: '192.168.20.31:51000',
        bytesIn: 12_345,
        lastLineAtMs: NOW - 2_000,
        receivingSesid: 's1',
        heldPeers: 0,
        lockout: false,
        ...over,
    };
}

export const DIAL: TransmitterSettings = { mode: 'dial', protocol: 'bridge', host: '192.168.20.31', port: 8080, autoReconnect: true, receivingSesid: null };
export const LISTEN: TransmitterSettings = { mode: 'listen', protocol: null, host: null, port: null, autoReconnect: true, receivingSesid: null };

export class FakeKernel {
    views: KernelSessionView[] = [];
    link: TransmitterLinkStatus = linkOf();
    settings: TransmitterSettings | null = LISTEN;
    stateVersion = 7;
    calls: Array<[string, unknown[]]> = [];
    testResult: KernelTransmitterTest = { result: 'data', protocolSeen: 'bridge', bytes: 512, durationMs: 1_200 };
    failNext: Error | null = null;
    pagesText = 'SECRET TRANSCRIPT TEXT THAT MUST NEVER LEAVE';

    state(): KernelTransmitterState {
        return {
            stateVersion: this.stateVersion,
            settings: this.settings,
            applied: this.settings ? { atMs: NOW - 3_600_000, by: { nUserid: 'u1', name: 'Priya Shah', via: 'online', operatorName: null } } : null,
            link: this.link,
            sessions: [{ nSesid: 's1', sessionName: 'Day 3 — Morning', caseName: 'Acme v Beta', phase: 'live', isToday: true }],
            listen: { boxTransmitterAddress: '192.168.20.2', port: 2500 },
            actions: { connect: true, testOnly: true, reconnect: true },
        };
    }

    asPort(): KernelPort {
        const self = this;
        const write = <T>(name: string, args: unknown[], result: () => T): Promise<T> => {
            self.calls.push([name, args]);
            if (self.failNext) {
                const err = self.failNext;
                self.failNext = null;
                return Promise.reject(err);
            }
            return Promise.resolve(result());
        };
        return {
            start: async () => undefined,
            close: async () => undefined,
            sessions: () => [...self.views],
            session: (id: string) => self.views.find(v => v.nSesid === id) ?? null,
            arm: unused('arm'),
            requestEnd: unused('requestEnd'),
            endResult: () => null,
            onCut: () => () => undefined,
            currentCut: () => null,
            view: () => null,
            pages: () => [[['00:00:00:00', [self.pagesText], 0]]] as unknown as ReturnType<KernelPort['pages']>,
            rawHead: () => null,
            readRaw: unused('readRaw'),
            rawHashAt: async () => null,
            journalView: unused('journalView'),
            recoverFromCloud: unused('recoverFromCloud'),
            transmitterState: () => self.state(),
            transmitterLink: () => self.link,
            applyTransmitter: (req: TransmitterApplyRequest, actor: EdgeActor) =>
                write('applyTransmitter', [req, actor], () => {
                    self.settings = req.settings;
                    self.stateVersion += 1;
                    return self.state();
                }),
            connectTransmitter: (v: number, actor: EdgeActor) =>
                write('connectTransmitter', [v, actor], () => {
                    self.stateVersion += 1;
                    self.link = linkOf({ state: 'connecting', mode: 'dial', attempt: 1 });
                    return self.state();
                }),
            reconnectTransmitter: (v: number, actor: EdgeActor) =>
                write('reconnectTransmitter', [v, actor], () => {
                    self.stateVersion += 1;
                    return self.state();
                }),
            testTransmitter: (req: TransmitterTestRequest, actor: EdgeActor) => write('testTransmitter', [req, actor], () => self.testResult),
        } as unknown as KernelPort;
    }
}

// ---------------------------------------------------------------------------------------------------------------
// Uplink, auth, boot
// ---------------------------------------------------------------------------------------------------------------

export class FakeUplink {
    online = true;
    linkStatus: Partial<UplinkLinkStatus> = {};
    cloud: CloudLinkStatus = { state: 'synced', sinceMs: NOW - 600_000, lagSec: 0, lagLines: 0, pendingPages: 0, lastSyncedAtMs: NOW - 4_000 };
    net: EdgeInternetStatus = { state: 'up', sinceMs: NOW - 7_200_000 };
    reachable = true;
    syncs: UplinkSessionSync[] = [];
    cert: EdgeCertificateStatus = goodCertificate();
    syncNowCalls = 0;
    syncNowImpl: () => Promise<void> = async () => undefined;
    cloudClock: { offsetMs: number; rttMs: number | null; atMs: number } | null = null;

    asPort(withCloudClock = false): UplinkPort {
        const self = this;
        const port = {
            start: async () => undefined,
            close: async () => undefined,
            status: (): UplinkLinkStatus => ({ online: self.online, lagSec: 0, pendingPages: 0, lastSyncAt: NOW - 4_000, lastCheckedAt: NOW, stale: false, ...self.linkStatus }),
            cloudLink: () => self.cloud,
            internet: () => self.net,
            etabellaReachable: () => self.reachable,
            session: (id: string) => self.syncs.find(s => s.nSesid === id) ?? null,
            sessions: () => [...self.syncs],
            syncNow: () => {
                self.syncNowCalls++;
                return self.syncNowImpl();
            },
            enrol: unused('enrol'),
            relayOperatorCode: unused('relayOperatorCode'),
            seal: unused('seal'),
            uploadCapture: unused('uploadCapture'),
            certificate: () => self.cert,
            ensureCertificate: unused('ensureCertificate'),
            ...(withCloudClock ? { cloudClockOffset: () => self.cloudClock } : {}),
        };
        return port as unknown as UplinkPort;
    }
}

export class FakeAuth {
    /** token → principal; anything else is unauthenticated. */
    tokens = new Map<string, EdgePrincipal>();
    openable = new Set<string>(['s1']);
    authenticateCalls: Array<{ token: string | null | undefined; ip: string | null }> = [];

    asPort(): AuthPort {
        const self = this;
        return {
            authenticate: async (token: string | null | undefined, ctx: { ip: string | null }) => {
                self.authenticateCalls.push({ token, ip: ctx.ip });
                const principal = token ? self.tokens.get(token) : undefined;
                if (!principal) throw new EdgePortError('unauthenticated', 'no valid token');
                return principal;
            },
            requireBoxAdmin: (p: EdgePrincipal) => {
                if (!p.isBoxAdmin) throw new EdgePortError('not_box_admin', 'box admins only');
            },
            requireOnlineCaseAdmin: unused('requireOnlineCaseAdmin'),
            canSeeCase: () => true,
            canOpenSession: (p: EdgePrincipal, id: string) => (p.kind === 'room-code' ? p.sessionId === id : self.openable.has(id)),
            rooms: () => [],
            me: unused('me'),
            signOut: unused('signOut'),
        } as unknown as AuthPort;
    }
}

export class FakeBoot implements EdgeBootStatus {
    failures: EdgeStartFailure[] = [];
    failed = new Set<EdgeServiceStep>();
    listener: EdgeLanListenerStatus = { ...EDGE_LAN_LISTENER_NOT_STARTED, state: 'listening', sinceMs: NOW - 60_000, plainHttp: true };

    phase(): 'started' {
        return 'started';
    }

    phaseSinceMs(): number {
        return NOW - 60_000;
    }

    startFailures(): readonly EdgeStartFailure[] {
        return this.failures;
    }

    stepFailed(step: EdgeServiceStep): boolean {
        return this.failed.has(step);
    }

    lanListener(): EdgeLanListenerStatus {
        return this.listener;
    }
}

// ---------------------------------------------------------------------------------------------------------------
// Host and timers
// ---------------------------------------------------------------------------------------------------------------

export const okDns = (ms = 12, resolver = '192.168.10.1'): OpsDnsProbe => ({ ok: true, ms, resolver, error: null });
export const failedDns = (error = 'ENOTFOUND'): OpsDnsProbe => ({ ok: false, ms: null, resolver: '192.168.10.1', error });

export class FakeOpsHost implements OpsHost {
    diskUsage: OpsDiskUsage | null = { freeMB: 212_000, totalMB: 480_000 };
    bytes: Record<string, number | null> = {};
    addresses: OpsInterfaceAddress[] = [
        { name: 'lo', address: '127.0.0.1', internal: true },
        { name: 'eth0', address: '10.40.1.5', internal: false },
        { name: 'eth1', address: '192.168.20.2', internal: false },
    ];
    uptime = 3_600;
    chronyReading: OpsClockReading | null = { offsetMs: 2, synced: true, source: 'chrony' };
    ups: boolean | null = false;
    dns: Record<string, OpsDnsProbe> = {};
    https: OpsHttpsProbe = { ok: true, status: 204, ms: 48, serverDateMs: NOW, sentAtMs: NOW, receivedAtMs: NOW + 48, error: null };
    removed: string[] = [];
    removeFails = new Set<string>();
    steps: number[] = [];
    stepResult = true;
    calls: string[] = [];
    /** Hold `resolve` / `httpsProbe` until released (to observe a run in flight). */
    gate: Promise<void> | null = null;

    disk(dir: string): OpsDiskUsage | null {
        this.calls.push(`disk:${dir}`);
        return this.diskUsage;
    }

    dirBytes(dir: string): number | null {
        return dir in this.bytes ? this.bytes[dir] : 1_048_576 * 3;
    }

    ipv4Addresses(): readonly OpsInterfaceAddress[] {
        return this.addresses;
    }

    uptimeSec(): number {
        return this.uptime;
    }

    async chrony(): Promise<OpsClockReading | null> {
        this.calls.push('chrony');
        return this.chronyReading;
    }

    async upsOnBattery(): Promise<boolean | null> {
        return this.ups;
    }

    async resolve(host: string): Promise<OpsDnsProbe> {
        this.calls.push(`resolve:${host}`);
        if (this.gate) await this.gate;
        return this.dns[host] ?? okDns();
    }

    async httpsProbe(url: string): Promise<OpsHttpsProbe> {
        this.calls.push(`https:${url}`);
        if (this.gate) await this.gate;
        return this.https;
    }

    async remove(target: string): Promise<void> {
        if (this.removeFails.has(target)) throw new Error('EBUSY');
        this.removed.push(target);
    }

    async stepClock(targetMs: number): Promise<boolean> {
        this.steps.push(targetMs);
        return this.stepResult;
    }
}

export class ManualTimers implements OpsTimers {
    private nextId = 1;
    readonly active = new Map<number, { fn: () => void; ms: number }>();

    setInterval(fn: () => void, ms: number): unknown {
        const id = this.nextId++;
        this.active.set(id, { fn, ms });
        return id;
    }

    clearInterval(handle: unknown): void {
        this.active.delete(handle as number);
    }

    /** Run every interval registered with period `ms`. */
    fire(ms: number): void {
        for (const t of [...this.active.values()]) if (t.ms === ms) t.fn();
    }
}

/** Let queued promise callbacks run. */
export async function flush(times = 10): Promise<void> {
    for (let i = 0; i < times; i++) await new Promise(resolve => setImmediate(resolve));
}
