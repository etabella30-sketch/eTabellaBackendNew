/**
 * Sessions, assignments and the cached roster (ports/state.port.ts SessionsRepo, AssignmentsRepo, RosterRepo).
 *
 * - A session row holds the assignment exactly as delivered (normalized JSON, compared for change detection) plus
 *   the box-local fields the kernel and the uplink write. `startAtMs` is `dStartDt` resolved in the session's zone
 *   (wall-clock.ts) and orders the lists (null starts last, then nSesid).
 * - A purged session keeps a tombstone row (`localState:'purged'`); it is never resurrected by a pull or a push.
 * - `cloudOp:'end'` is sticky: once the cloud asked for the end, a later 'upsert' cannot un-end the session (the box
 *   has drained or is draining it).
 */
import type { EdgeLocalState } from '@app/edge-sync';

import { EdgePersonRef, isIpv4 } from '../contracts';
import {
    AssignmentsDiff,
    AssignmentsRepo,
    BoxAssignmentSnapshot,
    BoxCaseRecord,
    BoxPersonRecord,
    BoxReporterAddress,
    BoxRosterMember,
    BoxSessionAssignment,
    BoxSessionLocalPatch,
    BoxSessionRecord,
    EdgePortError,
    RosterRepo,
    SessionsRepo,
} from '../ports';
import { col, deepFreeze, EdgeDb, Row } from './db';
import { OperatorCodesStore } from './access.repo';
import { KvStore } from './kv';
import { wallClockToEpochMs } from './wall-clock';

const LOCAL_STATES: ReadonlySet<EdgeLocalState> = new Set<EdgeLocalState>([
    'assigned',
    'armed',
    'live',
    'ending',
    'sealed',
    'complete',
    'purged',
    'recovering',
    'frozen',
    'fenced',
    'rebasing',
]);

const PATCH_KEYS = ['localState', 'firstLineAtMs', 'endRequestedAtMs', 'endedAtMs', 'sealedAtMs', 'sealState', 'purgedAtMs'] as const;

const SYNCED_KEY = 'assignments.syncedAtMs';

const isSafeId = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 64 && /^[A-Za-z0-9_-]+$/.test(v);

const invalid = (message: string): EdgePortError => new EdgePortError('invalid_request', message);
const notFound = (nSesid: string): EdgePortError => new EdgePortError('session_not_found', `session ${nSesid} is not on this box`);

const optMs = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? Math.floor(v) : null);

/** A usable reporter address (IPv4, port 1–65535), else null: the box never dials anything else. */
function reporterOf(r: BoxReporterAddress | null | undefined): BoxReporterAddress | null {
    if (!r || typeof r.host !== 'string' || !isIpv4(r.host)) return null;
    return Number.isInteger(r.port) && r.port >= 1 && r.port <= 65535 ? { host: r.host.trim(), port: r.port } : null;
}

/** The assignment fields in a fixed order (the stored JSON is compared to detect a change). */
export function normalizeAssignment(a: BoxSessionAssignment): BoxSessionAssignment {
    if (!a || typeof a !== 'object') throw invalid('assignment must be an object');
    if (!isSafeId(a.nSesid)) throw invalid('assignment.nSesid must be a safe id');
    if (typeof a.nCaseid !== 'string' || !a.nCaseid) throw invalid('assignment.nCaseid is required');
    const person = (p: EdgePersonRef | null | undefined): EdgePersonRef | null =>
        p && typeof p.nUserid === 'string' && p.nUserid ? { nUserid: p.nUserid, name: String(p.name ?? p.nUserid) } : null;
    const route = a.route && typeof a.route.user === 'string' && a.route.user ? { user: a.route.user, salt: String(a.route.salt ?? ''), hash: String(a.route.hash ?? ''), scryptN: Number(a.route.scryptN) || 0 } : null;
    const next = a.next && typeof a.next.nSesid === 'string' && a.next.nSesid ? { nSesid: a.next.nSesid, nPartNo: Number(a.next.nPartNo) || 2, splitAtMs: optMs(a.next.splitAtMs) } : null;
    return {
        nSesid: a.nSesid,
        nCaseid: a.nCaseid,
        cName: String(a.cName ?? ''),
        dStartDt: typeof a.dStartDt === 'string' && a.dStartDt ? a.dStartDt : null,
        tz: String(a.tz ?? ''),
        nLines: Number.isInteger(a.nLines) && a.nLines > 0 ? a.nLines : 25,
        protocol: a.protocol === 'B' || a.protocol === 'C' ? a.protocol : null,
        epoch: Number.isInteger(a.epoch) && a.epoch > 0 ? a.epoch : 1,
        rebaseSeq: Number.isSafeInteger(a.rebaseSeq) ? a.rebaseSeq : null,
        parserVer: String(a.parserVer ?? ''),
        fmt: Number.isInteger(a.fmt) ? a.fmt : 1,
        route,
        hearingOperator: person(a.hearingOperator),
        nPartNo: Number.isInteger(a.nPartNo) && a.nPartNo > 0 ? a.nPartNo : 1,
        nPrevPartSesid: typeof a.nPrevPartSesid === 'string' && a.nPrevPartSesid ? a.nPrevPartSesid : null,
        next,
        cloudOp: a.cloudOp === 'end' ? 'end' : 'upsert',
        deleted: a.deleted === true,
        reporter: reporterOf(a.reporter),
    };
}

/**
 * The stored assignment as this build would write it: a row written before a field existed (`reporter`) compares
 * equal to a delivery that leaves that field empty, so an upgrade alone never reports every session as updated.
 * Null when the stored JSON cannot be read (the next delivery then rewrites it).
 */
function storedAssignmentJson(row: Row): string | null {
    try {
        const stored = col.json<BoxSessionAssignment | null>(row, 'assignment', null);
        return stored ? JSON.stringify(normalizeAssignment(stored)) : null;
    } catch {
        return null;
    }
}

function toRecord(row: Row): BoxSessionRecord {
    const assignment = col.json<BoxSessionAssignment>(row, 'assignment', null as unknown as BoxSessionAssignment);
    return deepFreeze({
        ...assignment,
        // A row written before the cloud could set a reporter has no such key.
        reporter: reporterOf(assignment?.reporter),
        cloudOp: col.str(row, 'cloudOp') === 'end' ? 'end' : 'upsert',
        localState: col.str(row, 'localState') as EdgeLocalState,
        listed: col.bool(row, 'listed'),
        assignedAtMs: col.num(row, 'assignedAtMs'),
        updatedAtMs: col.num(row, 'updatedAtMs'),
        firstLineAtMs: col.numOrNull(row, 'firstLineAtMs'),
        endRequestedAtMs: col.numOrNull(row, 'endRequestedAtMs'),
        endedAtMs: col.numOrNull(row, 'endedAtMs'),
        sealedAtMs: col.numOrNull(row, 'sealedAtMs'),
        sealState: (col.strOrNull(row, 'sealState') as 'K' | 'W' | null) ?? null,
        purgedAtMs: col.numOrNull(row, 'purgedAtMs'),
    } as BoxSessionRecord);
}

const ORDER = 'ORDER BY (startAtMs IS NULL), startAtMs, nSesid';

export class SqliteSessionsRepo implements SessionsRepo {
    constructor(private readonly db: EdgeDb) {}

    get(nSesid: string): BoxSessionRecord | null {
        const row = this.db.get('SELECT * FROM sessions WHERE nSesid = ?', String(nSesid));
        return row ? toRecord(row) : null;
    }

    list(opts: { includePurged?: boolean } = {}): readonly BoxSessionRecord[] {
        const rows = opts.includePurged
            ? this.db.all(`SELECT * FROM sessions ${ORDER}`)
            : this.db.all(`SELECT * FROM sessions WHERE localState <> 'purged' ${ORDER}`);
        return rows.map(toRecord);
    }

    forCase(nCaseid: string): readonly BoxSessionRecord[] {
        return this.db.all(`SELECT * FROM sessions WHERE nCaseid = ? AND localState <> 'purged' ${ORDER}`, String(nCaseid)).map(toRecord);
    }

    upsertAssignment(assignment: BoxSessionAssignment, atMs: number): 'added' | 'updated' | 'unchanged' {
        return this.upsert(assignment, atMs).result;
    }

    /** As upsertAssignment, plus whether `cloudOp` BECAME 'end' in this write. */
    upsert(assignment: BoxSessionAssignment, atMs: number): { result: 'added' | 'updated' | 'unchanged'; endRequested: boolean } {
        const a = normalizeAssignment(assignment);
        const now = Math.floor(atMs);
        return this.db.tx(() => {
            const row = this.db.get('SELECT * FROM sessions WHERE nSesid = ?', a.nSesid);
            const startAtMs = wallClockToEpochMs(a.dStartDt, a.tz);
            if (!row) {
                this.db.run(
                    `INSERT INTO sessions (nSesid, nCaseid, assignment, startAtMs, cloudOp, localState, listed, assignedAtMs, updatedAtMs, endRequestedAtMs)
                     VALUES (?, ?, ?, ?, ?, 'assigned', 1, ?, ?, ?)`,
                    a.nSesid,
                    a.nCaseid,
                    JSON.stringify(a),
                    startAtMs,
                    a.cloudOp,
                    now,
                    now,
                    a.cloudOp === 'end' ? now : null,
                );
                return { result: 'added' as const, endRequested: a.cloudOp === 'end' };
            }
            if (col.str(row, 'localState') === 'purged') return { result: 'unchanged' as const, endRequested: false };
            const wasEnd = col.str(row, 'cloudOp') === 'end';
            const stored: BoxSessionAssignment = wasEnd ? { ...a, cloudOp: 'end' } : a;
            const json = JSON.stringify(stored);
            const changed = json !== storedAssignmentJson(row) || !col.bool(row, 'listed');
            if (!changed) return { result: 'unchanged' as const, endRequested: false };
            const becameEnd = !wasEnd && stored.cloudOp === 'end';
            this.db.run(
                `UPDATE sessions SET nCaseid = ?, assignment = ?, startAtMs = ?, cloudOp = ?, listed = 1, updatedAtMs = ?,
                     endRequestedAtMs = COALESCE(endRequestedAtMs, ?)
                 WHERE nSesid = ?`,
                stored.nCaseid,
                json,
                startAtMs,
                stored.cloudOp,
                now,
                becameEnd ? now : null,
                a.nSesid,
            );
            return { result: 'updated' as const, endRequested: becameEnd };
        });
    }

    requestEnd(nSesid: string, atMs: number): BoxSessionRecord {
        return this.db.tx(() => {
            const row = this.liveRow(nSesid);
            if (col.str(row, 'cloudOp') !== 'end' || col.numOrNull(row, 'endRequestedAtMs') === null) {
                const assignment = { ...col.json<BoxSessionAssignment>(row, 'assignment', {} as BoxSessionAssignment), cloudOp: 'end' as const };
                this.db.run(
                    `UPDATE sessions SET cloudOp = 'end', assignment = ?, endRequestedAtMs = COALESCE(endRequestedAtMs, ?), updatedAtMs = ? WHERE nSesid = ?`,
                    JSON.stringify(assignment),
                    Math.floor(atMs),
                    Math.floor(atMs),
                    String(nSesid),
                );
            }
            return this.get(nSesid)!;
        });
    }

    setLocal(nSesid: string, patch: BoxSessionLocalPatch, atMs: number): BoxSessionRecord {
        if (!patch || typeof patch !== 'object') throw invalid('patch must be an object');
        const sets: string[] = [];
        const values: Array<string | number | null> = [];
        for (const key of Object.keys(patch)) {
            if (!(PATCH_KEYS as readonly string[]).includes(key)) throw invalid(`setLocal cannot set ${key}`);
            const value = (patch as Record<string, unknown>)[key];
            if (value === undefined) continue;
            if (key === 'localState') {
                if (!LOCAL_STATES.has(value as EdgeLocalState)) throw invalid(`unknown localState ${String(value)}`);
                values.push(String(value));
            } else if (key === 'sealState') {
                if (value !== null && value !== 'K' && value !== 'W') throw invalid('sealState must be K, W or null');
                values.push(value as string | null);
            } else {
                if (value !== null && !(typeof value === 'number' && Number.isFinite(value))) throw invalid(`${key} must be epoch ms or null`);
                values.push(value === null ? null : Math.floor(value as number));
            }
            sets.push(`${key} = ?`);
        }
        return this.db.tx(() => {
            this.liveRow(nSesid);
            this.db.run(`UPDATE sessions SET ${[...sets, 'updatedAtMs = ?'].join(', ')} WHERE nSesid = ?`, ...values, Math.floor(atMs), String(nSesid));
            return this.get(nSesid)!;
        });
    }

    purge(nSesid: string, atMs: number): BoxSessionRecord {
        return this.db.tx(() => {
            const row = this.db.get('SELECT * FROM sessions WHERE nSesid = ?', String(nSesid));
            if (!row) throw notFound(nSesid);
            if (col.str(row, 'localState') === 'purged') return toRecord(row);
            this.db.run('DELETE FROM room_codes WHERE nSesid = ?', String(nSesid));
            this.db.run('DELETE FROM incidents WHERE nSesid = ?', String(nSesid));
            this.db.run('DELETE FROM held_captures WHERE nSesid = ? AND uploadedAtMs IS NOT NULL', String(nSesid));
            this.db.run(`UPDATE sessions SET localState = 'purged', purgedAtMs = ?, updatedAtMs = ? WHERE nSesid = ?`, Math.floor(atMs), Math.floor(atMs), String(nSesid));
            return this.get(nSesid)!;
        });
    }

    /** Known and not purged, else session_not_found. */
    liveRow(nSesid: string): Row {
        const row = this.db.get('SELECT * FROM sessions WHERE nSesid = ?', String(nSesid));
        if (!row || col.str(row, 'localState') === 'purged') throw notFound(nSesid);
        return row;
    }

    /** True when the session exists and is not purged (writes that name a session check this). */
    exists(nSesid: string): boolean {
        const row = this.db.get('SELECT localState FROM sessions WHERE nSesid = ?', String(nSesid));
        return !!row && col.str(row, 'localState') !== 'purged';
    }
}

function caseOf(row: Row): BoxCaseRecord {
    return Object.freeze({
        nCaseid: col.str(row, 'nCaseid'),
        cCasename: col.str(row, 'cCasename'),
        cCaseno: col.str(row, 'cCaseno'),
        assignedAtMs: col.numOrNull(row, 'assignedAtMs'),
    });
}

function memberOf(row: Row): BoxRosterMember {
    return Object.freeze({
        nUserid: col.str(row, 'nUserid'),
        name: col.str(row, 'name'),
        email: col.strOrNull(row, 'email'),
        nCaseid: col.str(row, 'nCaseid'),
        nSesid: col.strOrNull(row, 'nSesid'),
        role: col.strOrNull(row, 'role'),
        isCaseAdmin: col.bool(row, 'isCaseAdmin'),
        active: col.bool(row, 'active'),
        source: col.str(row, 'source') === 'session' ? 'session' : 'team',
    });
}

function rosterKey(m: BoxRosterMember): string {
    return JSON.stringify([m.nCaseid, m.nSesid, m.nUserid, m.name, m.email, m.role, m.isCaseAdmin, m.active, m.source]);
}

export class SqliteAssignmentsRepo implements AssignmentsRepo {
    constructor(
        private readonly db: EdgeDb,
        private readonly sessions: SqliteSessionsRepo,
        private readonly kv: KvStore,
        private readonly operatorCodes: OperatorCodesStore,
    ) {}

    replaceAll(snapshot: BoxAssignmentSnapshot, atMs: number): AssignmentsDiff {
        if (!snapshot || typeof snapshot !== 'object') throw invalid('snapshot must be an object');
        const now = Math.floor(atMs);
        const sessions = Array.isArray(snapshot.sessions) ? snapshot.sessions : [];
        const cases = Array.isArray(snapshot.cases) ? snapshot.cases : [];
        const roster = Array.isArray(snapshot.roster) ? snapshot.roster : [];
        const supers = Array.isArray(snapshot.superAdmins) ? snapshot.superAdmins : [];
        // Validate everything before writing anything.
        const normalized = sessions.map(normalizeAssignment);
        return this.db.tx(() => {
            const added: string[] = [];
            const updated: string[] = [];
            const endRequested: string[] = [];
            const seen = new Set<string>();
            for (const a of normalized) {
                if (seen.has(a.nSesid)) continue;
                seen.add(a.nSesid);
                const res = this.sessions.upsert(a, now);
                if (res.result === 'added') added.push(a.nSesid);
                if (res.result === 'updated') updated.push(a.nSesid);
                if (res.endRequested) endRequested.push(a.nSesid);
            }
            const unlisted: string[] = [];
            for (const row of this.db.all(`SELECT nSesid FROM sessions WHERE listed = 1 AND localState <> 'purged'`)) {
                const id = col.str(row, 'nSesid');
                if (!seen.has(id)) unlisted.push(id);
            }
            for (const id of unlisted) this.db.run('UPDATE sessions SET listed = 0, updatedAtMs = ? WHERE nSesid = ?', now, id);

            const beforeCases = new Set(this.db.all('SELECT nCaseid FROM cases').map(r => col.str(r, 'nCaseid')));
            this.db.run('DELETE FROM cases');
            const afterCases = new Set<string>();
            for (const c of cases) {
                if (!c || typeof c.nCaseid !== 'string' || !c.nCaseid || afterCases.has(c.nCaseid)) continue;
                afterCases.add(c.nCaseid);
                this.db.run(
                    'INSERT INTO cases (nCaseid, cCasename, cCaseno, assignedAtMs) VALUES (?, ?, ?, ?)',
                    c.nCaseid,
                    String(c.cCasename ?? ''),
                    String(c.cCaseno ?? ''),
                    optMs(c.assignedAtMs),
                );
            }

            const beforeRoster = this.rosterSignature();
            this.db.run('DELETE FROM roster');
            for (const m of roster) {
                if (!m || typeof m.nUserid !== 'string' || !m.nUserid || typeof m.nCaseid !== 'string' || !m.nCaseid) continue;
                this.db.run(
                    'INSERT INTO roster (nCaseid, nSesid, nUserid, name, email, role, isCaseAdmin, active, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    m.nCaseid,
                    m.nSesid ?? null,
                    m.nUserid,
                    String(m.name ?? m.nUserid),
                    m.email ?? null,
                    m.role ?? null,
                    m.isCaseAdmin === true,
                    m.active !== false,
                    m.source === 'session' ? 'session' : 'team',
                );
            }
            this.db.run('DELETE FROM super_admins');
            for (const p of supers) {
                if (!p || typeof p.nUserid !== 'string' || !p.nUserid) continue;
                this.db.run('INSERT OR REPLACE INTO super_admins (nUserid, name, email) VALUES (?, ?, ?)', p.nUserid, String(p.name ?? p.nUserid), p.email ?? null);
            }
            const rosterChanged = beforeRoster !== this.rosterSignature();

            let operatorCodeChanged = false;
            if (snapshot.operatorCode) operatorCodeChanged = this.operatorCodes.deliver(snapshot.operatorCode, 'assignments');

            this.kv.set(SYNCED_KEY, String(now));
            const sorted = (xs: Iterable<string>): string[] => [...xs].sort();
            return Object.freeze({
                atMs: now,
                full: true,
                sessionsAdded: sorted(added),
                sessionsUpdated: sorted(updated),
                sessionsEndRequested: sorted(endRequested),
                sessionsUnlisted: sorted(unlisted),
                sessionsPurged: [],
                casesAdded: sorted([...afterCases].filter(c => !beforeCases.has(c))),
                casesRemoved: sorted([...beforeCases].filter(c => !afterCases.has(c))),
                rosterChanged,
                operatorCodeChanged,
            });
        });
    }

    markSynced(atMs: number): void {
        this.kv.set(SYNCED_KEY, String(Math.floor(atMs)));
    }

    syncedAtMs(): number | null {
        const v = this.kv.get(SYNCED_KEY);
        return v === null ? null : Number(v);
    }

    cases(): readonly BoxCaseRecord[] {
        return this.db.all('SELECT * FROM cases ORDER BY cCasename COLLATE NOCASE, nCaseid').map(caseOf);
    }

    case(nCaseid: string): BoxCaseRecord | null {
        const row = this.db.get('SELECT * FROM cases WHERE nCaseid = ?', String(nCaseid));
        return row ? caseOf(row) : null;
    }

    private rosterSignature(): string {
        const members = this.db.all('SELECT * FROM roster').map(memberOf).map(rosterKey).sort();
        const supers = this.db.all('SELECT * FROM super_admins ORDER BY nUserid').map(r => JSON.stringify([col.str(r, 'nUserid'), col.str(r, 'name'), col.strOrNull(r, 'email')]));
        return JSON.stringify([members, supers]);
    }
}

const BY_NAME = 'ORDER BY name COLLATE NOCASE, nUserid, source';

export class SqliteRosterRepo implements RosterRepo {
    constructor(private readonly db: EdgeDb) {}

    forCase(nCaseid: string): readonly BoxRosterMember[] {
        return this.db.all(`SELECT * FROM roster WHERE nCaseid = ? ${BY_NAME}`, String(nCaseid)).map(memberOf);
    }

    forSession(nSesid: string): readonly BoxRosterMember[] {
        const ses = this.db.get(`SELECT nCaseid FROM sessions WHERE nSesid = ? AND localState <> 'purged'`, String(nSesid));
        if (!ses) return [];
        const rows = this.db
            .all(
                `SELECT * FROM roster WHERE active = 1 AND ((nCaseid = ? AND source = 'team') OR (nSesid = ? AND source = 'session')) ${BY_NAME}`,
                col.str(ses, 'nCaseid'),
                String(nSesid),
            )
            .map(memberOf);
        // One row per person: the team row wins (it carries the case role); a session row adds nothing but access.
        const byUser = new Map<string, BoxRosterMember>();
        for (const m of rows) {
            const prev = byUser.get(m.nUserid);
            if (!prev) byUser.set(m.nUserid, m);
            else if (prev.source === 'session' && m.source === 'team') byUser.set(m.nUserid, m);
            else if (m.isCaseAdmin && !prev.isCaseAdmin) byUser.set(m.nUserid, Object.freeze({ ...prev, isCaseAdmin: true }));
        }
        return [...byUser.values()];
    }

    forUser(nUserid: string): readonly BoxRosterMember[] {
        return this.db.all('SELECT * FROM roster WHERE nUserid = ? AND active = 1 ORDER BY nCaseid, source, nSesid', String(nUserid)).map(memberOf);
    }

    person(nUserid: string): BoxPersonRecord | null {
        const row =
            this.db.get('SELECT nUserid, name, email FROM roster WHERE nUserid = ? ORDER BY active DESC, (email IS NULL) LIMIT 1', String(nUserid)) ??
            this.db.get('SELECT nUserid, name, email FROM super_admins WHERE nUserid = ?', String(nUserid));
        return row ? Object.freeze({ nUserid: col.str(row, 'nUserid'), name: col.str(row, 'name'), email: col.strOrNull(row, 'email') }) : null;
    }

    superAdmins(): readonly BoxPersonRecord[] {
        return this.db
            .all('SELECT * FROM super_admins ORDER BY name COLLATE NOCASE, nUserid')
            .map(row => Object.freeze({ nUserid: col.str(row, 'nUserid'), name: col.str(row, 'name'), email: col.strOrNull(row, 'email') }));
    }

    isSuperAdmin(nUserid: string): boolean {
        return !!this.db.get('SELECT 1 AS x FROM super_admins WHERE nUserid = ?', String(nUserid));
    }

    counts(): { readonly people: number; readonly cases: number } {
        const row = this.db.get<{ people: number; cases: number }>('SELECT COUNT(DISTINCT nUserid) AS people, COUNT(DISTINCT nCaseid) AS cases FROM roster WHERE active = 1');
        return Object.freeze({ people: Number(row?.people ?? 0), cases: Number(row?.cases ?? 0) });
    }
}
