/**
 * Normalizes what the cloud delivers about the box's sessions (hello reply `assignments`, `c.assign{op:'upsert'}`)
 * into the StatePort shapes (spec §4.2 "Delivery to the edge"; CONTRACTS.md §12.3 open item).
 *
 * Accepted wire shapes:
 * - the protocol's `AssignedSession[]` (libs/edge-sync protocol.ts): `{nSesid, nCaseid, cName, dStartDt, tz, nLines,
 *   epoch, rebaseSeq, parserVer, fmt, route:{user,salt,hash,scryptN}, team:[{nUserid,isCaseAdmin}],
 *   hearingOperator, case:{cCaseno,cName}}`;
 * - with the extensions the box needs and the SP `et_rtedge_assignments` already returns (r2–r5): per team member
 *   `name`, `email`, `role`, `active`; session `assignees`, `protocol`/`cProtocol`, `nPartNo`, `nPrevPartSesid`,
 *   `next`/`nNextPartSesid`, `cOp`/`cloudOp`, `bDeleted`/`deleted`, `hearingOperatorName`;
 * - the reporter machine the box dials for the session: `reporter:{host,port}` (or flat `cReporterIp` /
 *   `nReporterPort`, as r3 returns them). Not an IPv4 address, a port outside 1–65535 or only one of the two reads
 *   as no reporter (null): the session is still delivered and the reporter's Eclipse connects to the box as before;
 * - or an object `{sessions, cases?, roster?, superAdmins?, operatorCode?}` carrying the full snapshot.
 * Malformed entries are skipped (counted), never fatal: the rest of the pull still applies.
 */
import type { AssignedSession } from '@app/edge-sync';

import { EdgePersonRef } from '../contracts';
import { normalizeBoxReporter } from '../ports';
import type { BoxAssignmentSnapshot, BoxCaseRecord, BoxPersonRecord, BoxReporterAddress, BoxRosterMember, BoxSessionAssignment, OperatorCodeDelivery } from '../ports';

type Raw = Record<string, unknown>;

const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;
const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' && v.trim() && Number.isFinite(Number(v)) ? Number(v) : null);
const int = (v: unknown, def: number): number => {
    const n = num(v);
    return n !== null && Number.isInteger(n) ? n : def;
};
const isObj = (v: unknown): v is Raw => !!v && typeof v === 'object' && !Array.isArray(v);

export interface SessionDelivery {
    readonly assignment: BoxSessionAssignment;
    readonly cases: readonly BoxCaseRecord[];
    readonly roster: readonly BoxRosterMember[];
}

function memberOf(raw: unknown, nCaseid: string, nSesid: string | null, source: 'team' | 'session'): BoxRosterMember | null {
    if (!isObj(raw)) return null;
    const nUserid = str(raw.nUserid);
    if (!nUserid) return null;
    const first = str(raw.cFname);
    const last = str(raw.cLname);
    const name = str(raw.name) ?? ([first, last].filter(Boolean).join(' ') || nUserid);
    const status = raw.cUserStatus;
    const active = typeof raw.active === 'boolean' ? raw.active : status === undefined || status === null ? true : String(status).toUpperCase() === 'A';
    return {
        nUserid,
        name,
        email: str(raw.email) ?? str(raw.cEmail),
        nCaseid,
        nSesid,
        role: str(raw.role) ?? str(raw.cRole),
        isCaseAdmin: raw.isCaseAdmin === true || raw.isCaseAdmin === 1 || raw.isCaseAdmin === 'true',
        active,
        source,
    };
}

/**
 * The session's reporter connection: the wire object when there is one, else the flat SP columns (`cReporterIp` /
 * `nReporterPort`, or `cReporterSerial` / `nReporterBaud` for a COM port of the box). Both parts of one kind, or null.
 */
function reporterOf(s: Raw): BoxReporterAddress | null {
    const wire = isObj(s.reporter) ? s.reporter : null;
    return normalizeBoxReporter(
        wire
            ? { host: str(wire.host), port: num(wire.port), serialPath: str(wire.serialPath), baudRate: num(wire.baudRate) }
            : { host: str(s.cReporterIp), port: num(s.nReporterPort), serialPath: str(s.cReporterSerial), baudRate: num(s.nReporterBaud) },
    );
}

/** One delivered session → the stored assignment plus what it says about its case and team. Null when unusable. */
export function sessionDeliveryFrom(raw: unknown): SessionDelivery | null {
    if (!isObj(raw)) return null;
    const s = raw as Raw & Partial<AssignedSession>;
    const nSesid = str(s.nSesid);
    const nCaseid = str(s.nCaseid);
    if (!nSesid || !SAFE_ID.test(nSesid) || !nCaseid) return null;
    const route = isObj(s.route) && str(s.route.user) && str(s.route.salt) && str(s.route.hash) ? { user: String(s.route.user), salt: String(s.route.salt), hash: String(s.route.hash), scryptN: int(s.route.scryptN, 16_384) } : null;
    const teamRaw = Array.isArray(s.team) ? s.team : [];
    const team = teamRaw.map(m => memberOf(m, nCaseid, null, 'team')).filter((m): m is BoxRosterMember => !!m);
    const assigneesRaw = Array.isArray(s.assignees) ? (s.assignees as unknown[]) : [];
    const assignees = assigneesRaw.map(m => memberOf(m, nCaseid, nSesid, 'session')).filter((m): m is BoxRosterMember => !!m);
    let hearingOperator: EdgePersonRef | null = null;
    if (isObj(s.hearingOperator) && str(s.hearingOperator.nUserid)) {
        hearingOperator = { nUserid: String(s.hearingOperator.nUserid), name: str(s.hearingOperator.name) ?? String(s.hearingOperator.nUserid) };
    } else if (str(s.hearingOperator)) {
        const id = String(s.hearingOperator);
        hearingOperator = { nUserid: id, name: str(s.hearingOperatorName) ?? team.find(m => m.nUserid === id)?.name ?? id };
    } else if (str(s.nHearingOpid)) {
        const id = String(s.nHearingOpid);
        const name = [str(s.cHearingOpFname), str(s.cHearingOpLname)].filter(Boolean).join(' ');
        hearingOperator = { nUserid: id, name: name || team.find(m => m.nUserid === id)?.name || id };
    }
    const protocolRaw = s.protocol ?? s.cProtocol;
    const protocol = protocolRaw === 'B' || protocolRaw === 'C' ? protocolRaw : null;
    const nextRaw = isObj(s.next) ? s.next : null;
    const nextId = str(nextRaw?.nSesid) ?? str(s.nNextPartSesid);
    const nPartNo = int(s.nPartNo, 1);
    const op = str(s.cOp) ?? str(s.cloudOp);
    const assignment: BoxSessionAssignment = {
        nSesid,
        nCaseid,
        cName: str(s.cName) ?? '',
        dStartDt: str(s.dStartDt),
        tz: str(s.tz) ?? str(s.cTimezone) ?? '',
        nLines: int(s.nLines, 25) > 0 ? int(s.nLines, 25) : 25,
        protocol,
        epoch: int(s.epoch ?? s.nIngestEpoch, 1),
        rebaseSeq: num(s.rebaseSeq ?? s.nRebaseSeq),
        parserVer: str(s.parserVer) ?? str(s.cParserVer) ?? '',
        fmt: int(s.fmt, 1),
        route,
        hearingOperator,
        nPartNo,
        nPrevPartSesid: str(s.nPrevPartSesid),
        next: nextId ? { nSesid: nextId, nPartNo: int(nextRaw?.nPartNo, nPartNo + 1), splitAtMs: num(nextRaw?.splitAtMs) } : null,
        cloudOp: op === 'end' ? 'end' : 'upsert',
        deleted: s.deleted === true || s.bDeleted === true,
        reporter: reporterOf(s),
    };
    const cases: BoxCaseRecord[] = [];
    if (isObj(s.case)) {
        const c = s.case as Raw;
        cases.push({ nCaseid, cCasename: str(c.cName) ?? str(c.cCasename) ?? '', cCaseno: str(c.cCaseno) ?? '', assignedAtMs: null });
    }
    return { assignment, cases, roster: [...team, ...assignees] };
}

export interface SnapshotParse {
    readonly snapshot: BoxAssignmentSnapshot;
    /** Sessions or rows that could not be used. */
    readonly skipped: number;
}

function personOf(raw: unknown): BoxPersonRecord | null {
    if (!isObj(raw)) return null;
    const nUserid = str(raw.nUserid);
    if (!nUserid) return null;
    const name = str(raw.name) ?? ([str(raw.cFname), str(raw.cLname)].filter(Boolean).join(' ') || nUserid);
    return { nUserid, name, email: str(raw.email) };
}

function operatorCodeOf(raw: unknown): OperatorCodeDelivery | null {
    if (!isObj(raw)) return null;
    const minted = isObj(raw.mintedBy) ? raw.mintedBy : null;
    const day = str(raw.day);
    const salt = str(raw.salt);
    const hash = str(raw.hash);
    const scryptN = num(raw.scryptN);
    const issuedAtMs = num(raw.issuedAtMs);
    if (!day || !salt || !hash || scryptN === null || issuedAtMs === null || !minted || !str(minted.nUserid)) return null;
    return { day, alg: 'scrypt', salt, hash, scryptN, issuedAtMs, mintedBy: { nUserid: String(minted.nUserid), name: str(minted.name) ?? String(minted.nUserid) } };
}

/** A full pull (hello reply `assignments`); null when the value is not an assignments payload at all. */
export function assignmentSnapshotFrom(raw: unknown): SnapshotParse | null {
    let sessionsRaw: unknown[];
    let extra: Raw = {};
    if (Array.isArray(raw)) sessionsRaw = raw;
    else if (isObj(raw) && Array.isArray(raw.sessions)) {
        sessionsRaw = raw.sessions as unknown[];
        extra = raw;
    } else return null;
    let skipped = 0;
    const sessions: BoxSessionAssignment[] = [];
    const cases = new Map<string, BoxCaseRecord>();
    const roster = new Map<string, BoxRosterMember>();
    const addMember = (m: BoxRosterMember): void => {
        roster.set(JSON.stringify([m.nCaseid, m.nSesid, m.nUserid, m.source]), m);
    };
    for (const entry of sessionsRaw) {
        const d = sessionDeliveryFrom(entry);
        if (!d) {
            skipped += 1;
            continue;
        }
        sessions.push(d.assignment);
        for (const c of d.cases) if (!cases.has(c.nCaseid)) cases.set(c.nCaseid, c);
        for (const m of d.roster) addMember(m);
    }
    if (Array.isArray(extra.cases)) {
        for (const c of extra.cases as unknown[]) {
            if (!isObj(c) || !str(c.nCaseid)) {
                skipped += 1;
                continue;
            }
            cases.set(String(c.nCaseid), { nCaseid: String(c.nCaseid), cCasename: str(c.cCasename) ?? str(c.cName) ?? '', cCaseno: str(c.cCaseno) ?? '', assignedAtMs: num(c.assignedAtMs) ?? num(c.dAssignedAt) });
        }
    }
    if (Array.isArray(extra.roster)) {
        for (const r of extra.roster as unknown[]) {
            const nCaseid = isObj(r) ? str(r.nCaseid) : null;
            const source: 'team' | 'session' = isObj(r) && (r.source === 'session' || r.cSource === 'S') ? 'session' : 'team';
            const m = nCaseid ? memberOf(r, nCaseid, isObj(r) ? str(r.nSesid) : null, source) : null;
            if (m) addMember(m);
            else skipped += 1;
        }
    }
    // Every session's case must exist as a case row (the dashboard lists cases).
    for (const s of sessions) if (!cases.has(s.nCaseid)) cases.set(s.nCaseid, { nCaseid: s.nCaseid, cCasename: '', cCaseno: '', assignedAtMs: null });
    const superAdmins = Array.isArray(extra.superAdmins) ? (extra.superAdmins as unknown[]).map(personOf).filter((p): p is BoxPersonRecord => !!p) : [];
    return {
        snapshot: { cases: [...cases.values()], sessions, roster: [...roster.values()], superAdmins, operatorCode: operatorCodeOf(extra.operatorCode) },
        skipped,
    };
}
