/**
 * SPEC SUPPORT (never imported by the app): an in-memory `StatePort` that keeps the repository rules auth and the LAN
 * rely on (ports/state.port.ts): frozen records, compare-and-set room-code transitions, `session_not_found` /
 * `not_found` / `invalid_request` refusals, the user cut-off rule, newest-first room-code lists, sync audit rows.
 * Repositories auth/lan never call answer `notImplemented`.
 */
import { randomBytes } from 'crypto';

import type { EdgeRevocations } from '@app/edge-sync';

import type { RoomCodeStatus } from '../../contracts';
import {
    AssignmentsDiff,
    AssignmentsRepo,
    AuditRepo,
    BoxAssignmentSnapshot,
    BoxCaseRecord,
    BoxIdentityRecord,
    BoxPersonRecord,
    BoxRosterMember,
    BoxSecretPurpose,
    BoxSessionAssignment,
    BoxSessionLocalPatch,
    BoxSessionRecord,
    CachedJwk,
    ConnectivityLogRepo,
    CountersRepo,
    EdgeAuditEntry,
    EdgePortError,
    HeldCapturesRepo,
    IdentityRepo,
    IncidentsRepo,
    JtiRevocationReason,
    JwksRepo,
    notImplemented,
    OperatorCodeRecord,
    OperatorCodesRepo,
    RevocationsRepo,
    RoomCodeRecord,
    RoomCodesRepo,
    RosterRepo,
    SessionsRepo,
    StateHealth,
    StatePort,
    TransmitterSettingsRepo,
    userRevocationCutoffMs,
} from '../../ports';
import type { CheckpointStore } from '@app/rt-ingest';

const freeze = <T>(v: T): T => Object.freeze({ ...(v as object) }) as T;
const key = (id: string): string => String(id).toLowerCase();

/** A session record with sensible defaults (a live-able, not-started session of today). */
export function sessionRecord(over: Partial<BoxSessionRecord> & Pick<BoxSessionRecord, 'nSesid' | 'nCaseid'>): BoxSessionRecord {
    return {
        cName: 'Day 3 — Morning',
        dStartDt: null,
        tz: 'Europe/London',
        nLines: 25,
        protocol: null,
        epoch: 1,
        rebaseSeq: null,
        parserVer: 'fp-test',
        fmt: 1,
        route: null,
        hearingOperator: null,
        nPartNo: 1,
        nPrevPartSesid: null,
        next: null,
        cloudOp: 'upsert',
        deleted: false,
        reporter: null,
        localState: 'assigned',
        listed: true,
        assignedAtMs: 0,
        updatedAtMs: 0,
        firstLineAtMs: null,
        endRequestedAtMs: null,
        endedAtMs: null,
        sealedAtMs: null,
        sealState: null,
        purgedAtMs: null,
        ...over,
    };
}

export class FakeState implements StatePort {
    readonly sessionRows = new Map<string, BoxSessionRecord>();
    readonly caseRows = new Map<string, BoxCaseRecord>();
    rosterRows: BoxRosterMember[] = [];
    superAdminRows: BoxPersonRecord[] = [];
    syncedAt: number | null = null;
    identityRow: BoxIdentityRecord | null = null;
    jwksRow: { keys: readonly CachedJwk[]; receivedAtMs: number } | null = null;
    readonly secretRows = new Map<BoxSecretPurpose, Buffer>();
    readonly deniedJtis = new Map<string, { untilMs: number; reason: JtiRevocationReason }>();
    readonly userCutoffs = new Map<string, number>();
    readonly roomCodeRows = new Map<string, RoomCodeRecord>();
    readonly operatorCodeRows = new Map<string, OperatorCodeRecord>();
    readonly auditRows: EdgeAuditEntry[] = [];
    transactions = 0;
    /** Set to make the next repository read throw (fail-closed specs). */
    failReads: Error | null = null;

    // ---- spec helpers ------------------------------------------------------------------------------------------

    addCase(c: Partial<BoxCaseRecord> & Pick<BoxCaseRecord, 'nCaseid'>): this {
        this.caseRows.set(key(c.nCaseid), freeze({ cCasename: 'Harlow v Mercer Logistics', cCaseno: 'HC-2026-001', assignedAtMs: null, ...c }));
        return this;
    }

    addSession(s: Partial<BoxSessionRecord> & Pick<BoxSessionRecord, 'nSesid' | 'nCaseid'>): this {
        this.sessionRows.set(key(s.nSesid), freeze(sessionRecord(s)));
        return this;
    }

    patchSession(nSesid: string, patch: Partial<BoxSessionRecord>): this {
        const s = this.sessionRows.get(key(nSesid));
        if (!s) throw new Error(`no session ${nSesid}`);
        this.sessionRows.set(key(nSesid), freeze({ ...s, ...patch }));
        return this;
    }

    addMember(m: Partial<BoxRosterMember> & Pick<BoxRosterMember, 'nUserid' | 'nCaseid'>): this {
        this.rosterRows.push(freeze({ name: `User ${m.nUserid.slice(0, 4)}`, email: null, nSesid: null, role: null, isCaseAdmin: false, active: true, source: 'team', ...m }));
        return this;
    }

    addSuperAdmin(p: BoxPersonRecord): this {
        this.superAdminRows.push(freeze(p));
        return this;
    }

    setIdentity(over: Partial<BoxIdentityRecord> = {}): this {
        this.identityRow = freeze({
            nEdgeid: 'e0000000-0000-4000-8000-0000000000ed',
            slug: 'k7q2m9x4',
            status: 'active',
            keyFingerprint: 'aa:bb',
            publicKeySpki: '',
            tpmKey: false,
            cloudOrigin: 'https://cloud.invalid',
            enrolledAtMs: 0,
            confirmedAtMs: 0,
            lastCloudContactAtMs: null,
            linkFailure: null,
            ...over,
        });
        return this;
    }

    private guard(): void {
        if (this.failReads) {
            const err = this.failReads;
            this.failReads = null;
            throw err;
        }
    }

    // ---- sessions ------------------------------------------------------------------------------------------------

    readonly sessions: SessionsRepo = {
        get: (nSesid: string) => {
            this.guard();
            return this.sessionRows.get(key(nSesid)) ?? null;
        },
        list: (opts?: { includePurged?: boolean }) =>
            [...this.sessionRows.values()].filter(s => opts?.includePurged || s.localState !== 'purged').sort(byStart),
        forCase: (nCaseid: string) => [...this.sessionRows.values()].filter(s => key(s.nCaseid) === key(nCaseid) && s.localState !== 'purged').sort(byStart),
        upsertAssignment: (_a: BoxSessionAssignment, _atMs: number) => notImplemented('FakeState', 'sessions.upsertAssignment'),
        requestEnd: (_nSesid: string, _atMs: number) => notImplemented('FakeState', 'sessions.requestEnd'),
        setLocal: (nSesid: string, patch: BoxSessionLocalPatch, atMs: number) => {
            const s = this.sessionRows.get(key(nSesid));
            if (!s || s.localState === 'purged') throw new EdgePortError('session_not_found', 'no such session');
            const next = freeze({ ...s, ...patch, updatedAtMs: atMs });
            this.sessionRows.set(key(nSesid), next);
            return next;
        },
        purge: (_nSesid: string, _atMs: number) => notImplemented('FakeState', 'sessions.purge'),
    };

    readonly assignments: AssignmentsRepo = {
        replaceAll: (_snapshot: BoxAssignmentSnapshot, _atMs: number): AssignmentsDiff => notImplemented('FakeState', 'assignments.replaceAll'),
        markSynced: (atMs: number) => {
            this.syncedAt = atMs;
        },
        syncedAtMs: () => this.syncedAt,
        cases: () => {
            this.guard();
            return [...this.caseRows.values()].sort((a, b) => a.cCasename.localeCompare(b.cCasename));
        },
        case: (nCaseid: string) => this.caseRows.get(key(nCaseid)) ?? null,
    };

    readonly roster: RosterRepo = {
        forCase: (nCaseid: string) => this.rosterRows.filter(m => key(m.nCaseid) === key(nCaseid)).sort(byName),
        forSession: (nSesid: string) => {
            const s = this.sessionRows.get(key(nSesid));
            if (!s) return [];
            return this.rosterRows
                .filter(m => m.active && key(m.nCaseid) === key(s.nCaseid) && (m.source === 'team' || (m.nSesid && key(m.nSesid) === key(nSesid))))
                .sort(byName);
        },
        forUser: (nUserid: string) => this.rosterRows.filter(m => m.active && key(m.nUserid) === key(nUserid)),
        person: (nUserid: string) => {
            const m = this.rosterRows.find(r => key(r.nUserid) === key(nUserid)) ?? this.superAdminRows.find(r => key(r.nUserid) === key(nUserid));
            return m ? freeze({ nUserid: m.nUserid, name: m.name, email: m.email }) : null;
        },
        superAdmins: () => [...this.superAdminRows],
        isSuperAdmin: (nUserid: string) => this.superAdminRows.some(p => key(p.nUserid) === key(nUserid)),
        counts: () => ({ people: new Set(this.rosterRows.filter(m => m.active).map(m => key(m.nUserid))).size, cases: new Set(this.rosterRows.map(m => key(m.nCaseid))).size }),
    };

    readonly checkpoints = {} as CheckpointStore;

    readonly revocations: RevocationsRepo = {
        applyCloud: (_rev: EdgeRevocations, _receivedAtMs: number) => notImplemented('FakeState', 'revocations.applyCloud'),
        cloudSince: () => 0,
        revokeUser: (nUserid: string, receivedAtMs: number) => {
            this.userCutoffs.set(key(nUserid), userRevocationCutoffMs(receivedAtMs, this.userCutoffs.get(key(nUserid)) ?? null));
        },
        userRevokedAtMs: (nUserid: string) => this.userCutoffs.get(key(nUserid)) ?? null,
        denyJti: (jti: string, untilMs: number, reason: JtiRevocationReason, _atMs: number) => {
            const known = this.deniedJtis.get(jti);
            if (!known || known.untilMs < untilMs) this.deniedJtis.set(jti, { untilMs, reason });
        },
        isJtiDenied: (jti: string, nowMs: number) => {
            this.guard();
            const row = this.deniedJtis.get(jti);
            return !!row && row.untilMs > nowMs;
        },
        prune: (_nowMs: number) => 0,
    };

    readonly connectivityLog = {} as ConnectivityLogRepo;
    readonly incidents = {} as IncidentsRepo;
    readonly heldCaptures = {} as HeldCapturesRepo;

    readonly roomCodes: RoomCodesRepo = {
        insert: record => {
            if (!this.sessionRows.has(key(record.nSesid))) throw new EdgePortError('session_not_found', 'no such session');
            if ([...this.roomCodeRows.values()].some(r => r.codeHash === record.codeHash)) throw new EdgePortError('invalid_request', 'duplicate code hash');
            const row: RoomCodeRecord = freeze({
                ...record,
                status: 'unused' as RoomCodeStatus,
                deviceHash: null,
                deviceLabel: null,
                usedAtMs: null,
                tokenJti: null,
                revokedAtMs: null,
                endedAtMs: null,
                expiredAtMs: null,
            });
            this.roomCodeRows.set(row.id, row);
            return row;
        },
        get: (id: string) => this.roomCodeRows.get(id) ?? null,
        findByHash: (codeHash: string) => [...this.roomCodeRows.values()].find(r => r.codeHash === codeHash) ?? null,
        list: filter =>
            [...this.roomCodeRows.values()]
                .filter(r => !filter?.nSesid || key(r.nSesid) === key(filter.nSesid))
                .filter(r => !filter?.nCaseids || filter.nCaseids.some(c => key(c) === key(r.nCaseid)))
                .sort((a, b) => b.issuedAtMs - a.issuedAtMs || (b.id < a.id ? -1 : 1)),
        unusedFor: (nSesid: string, nUserid: string) =>
            [...this.roomCodeRows.values()].find(r => r.status === 'unused' && key(r.nSesid) === key(nSesid) && key(r.nUserid) === key(nUserid)) ?? null,
        usedFor: (nSesid: string, nUserid: string) =>
            [...this.roomCodeRows.values()].find(r => r.status === 'used' && key(r.nSesid) === key(nSesid) && key(r.nUserid) === key(nUserid)) ?? null,
        bind: (id, binding) => {
            const row = this.roomCodeRows.get(id);
            if (!row) throw new EdgePortError('not_found', 'no such room code');
            const first = row.status === 'unused';
            const reentry = row.status === 'used' && row.deviceHash === binding.deviceHash;
            if (!first && !reentry) return null;
            const next = freeze({
                ...row,
                status: 'used' as RoomCodeStatus,
                deviceHash: binding.deviceHash,
                deviceLabel: binding.deviceLabel,
                tokenJti: binding.tokenJti,
                usedAtMs: first ? binding.atMs : row.usedAtMs,
            });
            this.roomCodeRows.set(id, next);
            return next;
        },
        finish: (id, status, atMs) => {
            const row = this.roomCodeRows.get(id);
            if (!row) throw new EdgePortError('not_found', 'no such room code');
            const from: RoomCodeStatus = status === 'ended' ? 'used' : 'unused';
            if (row.status !== from) return null;
            const next = freeze({
                ...row,
                status,
                revokedAtMs: status === 'revoked' ? atMs : row.revokedAtMs,
                endedAtMs: status === 'ended' ? atMs : row.endedAtMs,
                expiredAtMs: status === 'expired' ? atMs : row.expiredAtMs,
            });
            this.roomCodeRows.set(id, next);
            return next;
        },
        expireSession: (nSesid: string, atMs: number) => {
            let n = 0;
            for (const row of this.roomCodeRows.values()) {
                if (row.status === 'unused' && key(row.nSesid) === key(nSesid)) {
                    this.roomCodeRows.set(row.id, freeze({ ...row, status: 'expired' as RoomCodeStatus, expiredAtMs: atMs }));
                    n++;
                }
            }
            return n;
        },
    };

    readonly operatorCodes: OperatorCodesRepo = {
        get: (day: string) => this.operatorCodeRows.get(day) ?? null,
        put: record => {
            const replacedEarlier = this.operatorCodeRows.has(record.day);
            this.operatorCodeRows.set(record.day, freeze({ ...record, uses: 0, lastUsedAtMs: null }));
            return { replacedEarlier };
        },
        recordUse: (day: string, atMs: number) => {
            const row = this.operatorCodeRows.get(day);
            if (!row) throw new EdgePortError('not_found', 'no operator code for that day');
            const next = freeze({ ...row, uses: row.uses + 1, lastUsedAtMs: atMs });
            this.operatorCodeRows.set(day, next);
            return next.uses;
        },
        purgeBefore: (_day: string) => 0,
    };

    readonly transmitter = {} as TransmitterSettingsRepo;
    readonly counters = {} as CountersRepo;

    readonly identity: IdentityRepo = {
        get: () => {
            this.guard();
            return this.identityRow;
        },
        save: (record: BoxIdentityRecord) => {
            this.identityRow = freeze(record);
        },
        patch: patch => {
            if (!this.identityRow) throw new EdgePortError('box_not_configured', 'no identity');
            this.identityRow = freeze({ ...this.identityRow, ...patch });
            return this.identityRow;
        },
        secret: (purpose: BoxSecretPurpose) => {
            if (!this.secretRows.has(purpose)) this.secretRows.set(purpose, randomBytes(32));
            return this.secretRows.get(purpose);
        },
    };

    readonly jwks: JwksRepo = {
        get: () => this.jwksRow,
        save: (keys: readonly CachedJwk[], atMs: number) => {
            this.jwksRow = { keys: [...keys], receivedAtMs: atMs };
        },
    };

    readonly audit: AuditRepo = {
        append: (entry: EdgeAuditEntry) => {
            this.auditRows.push(entry);
        },
        list: opts => this.auditRows.map((e, i) => ({ ...e, id: String(i + 1) })).reverse().slice(0, opts.limit),
        pruneBefore: () => 0,
    };

    transaction<T>(fn: () => T): T {
        this.transactions++;
        const snapshot = new Map(this.roomCodeRows);
        try {
            return fn();
        } catch (err) {
            this.roomCodeRows.clear();
            for (const [k, v] of snapshot) this.roomCodeRows.set(k, v);
            throw err;
        }
    }

    health(): StateHealth {
        return { ok: true, file: ':memory:', sizeBytes: 0, walBytes: 0, schemaVersion: 1 };
    }

    async close(): Promise<void> {
        /* nothing to close */
    }

    /** Audit rows of one action (specs). */
    audited(action: EdgeAuditEntry['action']): EdgeAuditEntry[] {
        return this.auditRows.filter(e => e.action === action);
    }
}

function byStart(a: BoxSessionRecord, b: BoxSessionRecord): number {
    if (a.dStartDt === b.dStartDt) return a.nSesid.localeCompare(b.nSesid);
    if (a.dStartDt === null) return 1;
    if (b.dStartDt === null) return -1;
    return a.dStartDt.localeCompare(b.dStartDt);
}

function byName(a: BoxPersonRecord, b: BoxPersonRecord): number {
    return a.name.localeCompare(b.name) || a.nUserid.localeCompare(b.nUserid);
}
