/**
 * Test kit for the edge module specs (a .spec.ts so the app build excludes it; its own self-tests register
 * only when Jest runs this file as a suite).
 *
 * - FakeEdgeDb: executeRef / rowQuery with the semantics of the 2026-10-01 SPs and direct reads the module
 *   uses (enough fidelity for the flows under test). Never touches a database.
 * - FakeRedis: the RedisDbService calls the module makes.
 * - MemoryApplyPort: an in-memory page store implementing EdgeApplyPort.
 * - BoxSim: a venue box: device key, raw journal (rt-ingest codec, sha256 chain), cutter, rounds, seal.
 */
import { createHash, generateKeyPairSync, KeyObject, sign } from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import {
    BroadcastCut,
    buildRound,
    BuiltRound,
    CloudView,
    EdgeHelloSession,
    EdgeIncident,
    EdgeRaw,
    EdgeSeal,
    PageCutter,
    planBroadcast,
    RoundApplyPlan,
    RoundLineage,
    sealClaims,
    sealSigningPayload,
    WARNING_INCIDENTS,
} from '@app/edge-sync';
import { chainNext, chainSeed, encodeBody, encodeRecord, RecordType } from '@app/rt-ingest';

import { QueryBuilderService } from '@app/global/db/pg/query-builder.service';

import { EdgeApplyPort, EdgeSessionEndOutcome } from './edge-apply.port';
import { edgeAuthSigningPayload } from './edge-auth.middleware';
import {
    EDGE_ADMINS_SQL,
    EDGE_BINDING_SQL,
    EDGE_CASE_ADMIN_SQL,
    EDGE_EVENTS_SQL,
    EDGE_LAST_EVENT_SQL,
    EDGE_NODE_STATUS_SQL,
    EDGE_ORPHANS_SQL,
    EDGE_SEAL_FIELDS_SQL,
    EDGE_SESSION_CREATOR_SQL,
    EDGE_SUCCESSOR_SQL,
    EDGE_USER_EMAILS_SQL,
} from './edge.types';

export const IDS = {
    admin: '11111111-1111-4111-8111-111111111111',
    operator: '22222222-2222-4222-8222-222222222222',
    user: '33333333-3333-4333-8333-333333333333',
    caseA: '44444444-4444-4444-8444-444444444444',
    caseB: '55555555-5555-4555-8555-555555555555',
    box: '66666666-6666-4666-8666-666666666666',
    box2: '77777777-7777-4777-8777-777777777777',
    ses: '88888888-8888-4888-8888-888888888888',
    ses2: '99999999-9999-4999-8999-999999999999',
    ses3: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
};

export const PARSER_VER = 'fp-1.0.0+golden';
export const WARN_KINDS = new Set<string>(WARNING_INCIDENTS);

// ---------------------------------------------------------------------------------------------------------------
// Device keys
// ---------------------------------------------------------------------------------------------------------------

export interface DeviceKey {
    privateKey: KeyObject;
    publicKey: KeyObject;
    spkiB64: string;
    fpr: string;
}

export function deviceKey(): DeviceKey {
    const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    const der = publicKey.export({ format: 'der', type: 'spki' }) as Buffer;
    return { privateKey, publicKey, spkiB64: der.toString('base64'), fpr: createHash('sha256').update(der).digest('hex') };
}

export function signWith(key: DeviceKey, payload: string, encoding: 'der' | 'ieee-p1363' = 'der'): string {
    return sign('sha256', Buffer.from(payload, 'utf8'), { key: key.privateKey, dsaEncoding: encoding }).toString('base64');
}

// ---------------------------------------------------------------------------------------------------------------
// Config, Redis
// ---------------------------------------------------------------------------------------------------------------

export class FakeConfig {
    constructor(public values: Record<string, any> = {}) { }
    get<T = any>(key: string): T {
        return this.values[key];
    }
}

export class FakeRedis {
    readonly store = new Map<string, { value: any; ttl: number | null }>();
    readonly sets: Array<[string, any, any]> = [];
    async setValue(key: string, value: any, ttl?: any): Promise<void> {
        this.sets.push([key, value, ttl]);
        this.store.set(key, { value, ttl: ttl ?? null });
    }
    async getValue(key: string): Promise<any> {
        return this.store.get(key)?.value ?? null;
    }
    async deleteValue(...keys: any[]): Promise<void> {
        for (const k of keys.flat()) this.store.delete(k);
    }
    async scanKeys(pattern: string): Promise<string[]> {
        const prefix = pattern.endsWith('*') ? pattern.slice(0, -1) : pattern;
        return [...this.store.keys()].filter(k => (pattern.endsWith('*') ? k.startsWith(prefix) : k === pattern));
    }
    /** RedisDbService.countInc: INCR (atomic in Redis; one synchronous step here) + a 24 h expiry. */
    async countInc(key: string): Promise<number> {
        const next = Number(this.store.get(key)?.value ?? 0) + 1;
        this.store.set(key, { value: String(next), ttl: 86_400 });
        return next;
    }
}

// ---------------------------------------------------------------------------------------------------------------
// Fake DB with SP semantics
// ---------------------------------------------------------------------------------------------------------------

export interface FakeNode {
    nEdgeid: string;
    cName: string;
    cVenue: string | null;
    cSlug: string;
    cStatus: string;
    cPubKey: string | null;
    cKeyFpr: string | null;
    bTpmKey: boolean;
    cEnrollHash: string | null;
    dEnrollExp: Date | null;
    nScopeAdmin: string | null;
    cLanIp: string | null;
    nCatPort: number;
    cVersion: string | null;
    cParserVer: string | null;
    dLastSeen: Date | null;
    cLastEgress: string | null;
    cLastAsn: string | null;
    dDelDt: Date | null;
}

export interface FakeSession {
    nSesid: string;
    nCaseid: string;
    cName: string;
    dStartDt: string;
    cTimezone: string;
    nLines: number;
    cProtocol: string | null;
    cStatus: string;
    cFeedSource: string | null;
    bEverEdge: boolean;
    cApply: string | null;
    nEdgeid: string | null;
    nIngestEpoch: number;
    nRebaseSeq: number | null;
    cSyncState: string | null;
    cParserVer: string | null;
    nHearingOpid: string | null;
    dDelDt: Date | null;
    nAppliedRawSeq: number | null;
    cAppliedRawHash: string | null;
    nPartNo: number | null;
    nPrevPartSesid: string | null;
    jIncidents: any[] | null;
    cFinalDigest: string | null;
    nFinalLines: number | null;
    nRawFinalSeq: number | null;
    cRawFinalHash: string | null;
    dWarnAckAt: Date | null;
    cSealNote: string | null;
    cUnicuserid?: string;
    nWarnAckBy?: string | null;
    dSealedAt?: Date | null;
    /** The reporter connection (file 11): both NULL unless the admin typed one at create. */
    cReporterIp?: string | null;
    nReporterPort?: number | null;
    /** Or a COM port of the box (file 12): both NULL unless the admin picked one at create. */
    cReporterSerial?: string | null;
    nReporterBaud?: number | null;
}

const ok = (fields: Record<string, any> = {}, value = 'ok') => ({ msg: 1, value, ...fields });
const bad = (msg: number, value: string, cCode: string) => ({ msg, value, cCode });

// ---------------------------------------------------------------------------------------------------------------
// The SP contract of the 2026-10-01 migrations (names, cursor counts, parameter keys), parsed from the SQL files
// ---------------------------------------------------------------------------------------------------------------

export const SQL_MIGRATIONS_DIR = path.resolve(__dirname, '..', '..', '..', '..', 'assets', 'sql-migrations');
// Files 01-10 are dated 2026-10-01, file 11 (the reporter connection) 2026-10-02. Read in name order, so a later
// file's CREATE OR REPLACE is the contract (file 11 sorts after 10, 98 and 99, which create no public.et_* function).
// File 12 (the COM port) is dated 2026-10-03 and sorts after 11.
export const EDGE_SQL_FILE_RE = /^2026-10-0[123]_rt_edge_\d\d_[a-z0-9_]+\.sql$/;

export interface SpContract {
    /** et_<name>, as created */
    fn: string;
    file: string;
    /** the argument list as written, e.g. `parameter json, ref refcursor` */
    signature: string;
    /** refcursor arguments after `parameter json` (executeRef's `ref`) */
    cursors: number;
    /** every `parameter ->> 'key'` / `parameter -> 'key'` the body reads */
    keys: Set<string>;
}

let contractsCache: Map<string, SpContract> | null = null;

/** Every `public.et_*` function of the 2026-10-01 rt_edge migrations, keyed by `et_<name>`. */
export function edgeSpContracts(dir = SQL_MIGRATIONS_DIR): Map<string, SpContract> {
    if (dir === SQL_MIGRATIONS_DIR && contractsCache) return contractsCache;
    const out = new Map<string, SpContract>();
    for (const file of fs.readdirSync(dir).filter(f => EDGE_SQL_FILE_RE.test(f)).sort()) {
        const text = fs.readFileSync(path.join(dir, file), 'utf8');
        const head = /CREATE OR REPLACE FUNCTION public\.(et_[a-z0-9_]+)\s*\(([^)]*)\)/g;
        let m: RegExpExecArray | null;
        while ((m = head.exec(text))) {
            const start = text.indexOf('$function$', m.index);
            const end = start >= 0 ? text.indexOf('$function$', start + 10) : -1;
            const body = start >= 0 && end > start ? text.slice(start, end) : '';
            const args = m[2].split(',').map(a => a.trim().replace(/\s+/g, ' '));
            const cursors = args.slice(1).filter(a => /^\w+ refcursor$/.test(a)).length;
            const keys = new Set<string>();
            const key = /parameter\s*(?:->>|->)\s*'([A-Za-z0-9_]+)'/g;
            let k: RegExpExecArray | null;
            while ((k = key.exec(body))) keys.add(k[1]);
            out.set(m[1], { fn: m[1], file, signature: args.join(', '), cursors, keys });
        }
    }
    if (dir === SQL_MIGRATIONS_DIR) contractsCache = out;
    return out;
}

/** A call that does not match the migrations: unknown SP, wrong cursor count, or a key the SP never reads. */
export function spContractProblems(name: string, params: Record<string, unknown>, contracts = edgeSpContracts()): string[] {
    const c = contracts.get(`et_${name}`);
    if (!c) return [`et_${name} is not created by the 2026-10-01 rt_edge migrations`];
    const problems: string[] = [];
    const ref = params?.ref === undefined ? 1 : Number(params.ref);
    if (ref !== c.cursors) problems.push(`et_${name} opens ${c.cursors} cursor(s), the call fetches ${ref}`);
    for (const k of Object.keys(params ?? {})) {
        if (k !== 'ref' && !c.keys.has(k)) problems.push(`et_${name} never reads parameter "${k}"`);
    }
    return problems;
}

/** Contract problems seen by every FakeEdgeDb in this test file (checked after each test, below). */
export const SP_CONTRACT_VIOLATIONS: string[] = [];

const queryBuilder = new QueryBuilderService();

/**
 * What the SP actually receives: the params after QueryBuilderService.setNullValues (the executeRef path, e.g.
 * j* values JSON-stringified, c* values defaulted to '') and the JSON round trip of buildQuery.
 */
export function asSpParameter(params: Record<string, unknown>): any {
    const p = { ...params };
    delete p.ref;
    return JSON.parse(JSON.stringify(queryBuilder.setNullValues(p)));
}

export class FakeEdgeDb {
    readonly nodes = new Map<string, FakeNode>();
    readonly cases = new Map<string, Set<string>>();
    readonly caseInfo = new Map<string, { cCaseno: string; cCasename: string }>();
    readonly sessions = new Map<string, FakeSession>();
    readonly events: Array<{ nId: number; cType: string; nEdgeid: string | null; nSesid: string | null; jData: any; nByUser: string | null }> = [];
    readonly orphans = new Map<string, any>();
    readonly admins = new Set<string>([IDS.admin]);
    readonly caseAdmins = new Set<string>();
    readonly team: Array<{ nCaseid: string; nUserid: string; isCaseAdmin: boolean; cFname: string; cLname: string }> = [];
    readonly emails = new Map<string, string>();
    /** UserMaster names (the warning acknowledgement's "who"). */
    readonly users = new Map<string, { cFname: string; cLname: string }>();
    readonly calls: Array<[string, any]> = [];
    readonly sql: Array<[string, any[]]> = [];
    readonly fail = new Map<string, string>();
    /** One-shot answers: the next call of `name` gets `row` (cursor 1) instead of the simulated SP (contract still checked). */
    readonly answerOnce: Array<{ name: string; row: any }> = [];

    addNode(n: Partial<FakeNode> & { nEdgeid: string }): FakeNode {
        const node: FakeNode = {
            cName: 'Box', cVenue: null, cSlug: `slug${this.nodes.size}abcdef`, cStatus: 'A', cPubKey: null, cKeyFpr: null, bTpmKey: false,
            cEnrollHash: null, dEnrollExp: null, nScopeAdmin: IDS.admin, cLanIp: '10.0.0.5', nCatPort: 2500, cVersion: null, cParserVer: PARSER_VER,
            dLastSeen: null, cLastEgress: null, cLastAsn: null, dDelDt: null, ...n,
        };
        this.nodes.set(node.nEdgeid, node);
        return node;
    }

    assignCase(nEdgeid: string, nCaseid: string, info = { cCaseno: 'C-1', cCasename: 'Case One' }) {
        if (!this.cases.has(nEdgeid)) this.cases.set(nEdgeid, new Set());
        this.cases.get(nEdgeid).add(nCaseid);
        this.caseInfo.set(nCaseid, info);
    }

    addSession(s: Partial<FakeSession> & { nSesid: string }): FakeSession {
        const ses: FakeSession = {
            nCaseid: IDS.caseA, cName: 'Day 1', dStartDt: '2026-10-01 10:00:00', cTimezone: 'Europe/London', nLines: 25, cProtocol: null, cStatus: 'R',
            cFeedSource: 'E', bEverEdge: true, cApply: null, nEdgeid: IDS.box, nIngestEpoch: 1, nRebaseSeq: null, cSyncState: 'L', cParserVer: PARSER_VER,
            nHearingOpid: IDS.operator, dDelDt: null, nAppliedRawSeq: null, cAppliedRawHash: null, nPartNo: null, nPrevPartSesid: null, jIncidents: null,
            cFinalDigest: null, nFinalLines: null, nRawFinalSeq: null, cRawFinalHash: null, dWarnAckAt: null, cSealNote: null, ...s,
        };
        this.sessions.set(ses.nSesid, ses);
        return ses;
    }

    private event(cType: string, nEdgeid: string | null, nSesid: string | null, jData: any, nByUser: string | null = null) {
        this.events.push({ nId: this.events.length + 1, cType, nEdgeid, nSesid, jData, nByUser });
    }

    eventsOf(cType: string) {
        return this.events.filter(e => e.cType === cType);
    }

    callsOf(name: string) {
        return this.calls.filter(c => c[0] === name).map(c => c[1]);
    }

    private nodeRow(n: FakeNode) {
        const now = Date.now();
        return {
            nEdgeid: n.nEdgeid, cName: n.cName, cVenue: n.cVenue, cSlug: n.cSlug, cStatus: n.cStatus, cPubKey: n.cPubKey, cKeyFpr: n.cKeyFpr, bTpmKey: n.bTpmKey,
            cLanIp: n.cLanIp, nCatPort: n.nCatPort, cVersion: n.cVersion, cParserVer: n.cParserVer, dLastSeen: n.dLastSeen,
            bOnline: !!n.dLastSeen && now - n.dLastSeen.getTime() < 120_000, cLastEgress: n.cLastEgress, cLastAsn: n.cLastAsn, jHealth: null, dCertExp: null,
            nScopeAdmin: n.nScopeAdmin, nCreatedBy: IDS.admin, dCreatedt: new Date(), bEnrollPending: !!n.cEnrollHash && !!n.dEnrollExp && n.dEnrollExp.getTime() > now,
            dEnrollExp: n.dEnrollExp,
        };
    }

    private isAdmin(id: any) {
        return !!id && this.admins.has(String(id).toLowerCase());
    }

    /** Calls that broke the SP contract of the migrations (also collected in SP_CONTRACT_VIOLATIONS). */
    readonly contractViolations: string[] = [];

    async executeRef(name: string, params: any): Promise<any> {
        const p = { ...params };
        delete p.ref;
        this.calls.push([name, p]);
        const problems = spContractProblems(name, params ?? {});
        if (problems.length) {
            this.contractViolations.push(...problems);
            SP_CONTRACT_VIOLATIONS.push(...problems);
            return { success: false, error: problems.join('; ') };
        }
        if (this.fail.has(name)) return { success: false, error: this.fail.get(name) };
        const once = this.answerOnce.findIndex(a => a.name === name);
        if (once >= 0) return { success: true, data: [[this.answerOnce.splice(once, 1)[0].row]] };
        const data = this.sp(name, asSpParameter(p));
        return { success: true, data };
    }

    private sp(name: string, p: any): any[][] {
        switch (name) {
            case 'rtedge_get': {
                const n = this.nodes.get(String(p.nEdgeid ?? '').toLowerCase());
                if (!n || n.dDelDt) return [[bad(-1, 'Venue box not found', 'NOT_FOUND')], []];
                const cases = [...(this.cases.get(n.nEdgeid) ?? [])].map(c => ({ nCaseid: c, ...this.caseInfo.get(c), isArchived: false, dAssignedAt: new Date() }));
                return [[ok(this.nodeRow(n), 'Venue box')], cases];
            }
            case 'rtedge_list':
                return [[...this.nodes.values()].filter(n => p.bAll || n.cStatus !== 'X').map(n => ok({ ...this.nodeRow(n), nCases: this.cases.get(n.nEdgeid)?.size ?? 0, nLiveSessions: 0 }))];
            case 'rtedge_create': {
                if (!this.isAdmin(p.nMasterid)) return [[bad(-3, 'Admin rights required', 'NOT_ALLOWED')]];
                const id = `bbbbbbbb-bbbb-4bbb-8bbb-${String(this.nodes.size).padStart(12, '0')}`;
                const n = this.addNode({ nEdgeid: id, cName: p.cName, cStatus: 'P', cEnrollHash: p.cEnrollHash ?? null, dEnrollExp: p.cEnrollHash ? new Date(Date.now() + 15 * 60_000) : null, cPubKey: null, cKeyFpr: null, cSlug: p.cSlug ?? `gen${id.slice(-6)}` });
                this.event('create', id, null, { cName: p.cName }, p.nMasterid);
                return [[ok({ nEdgeid: n.nEdgeid, cName: n.cName, cVenue: n.cVenue, cSlug: n.cSlug, cStatus: n.cStatus, dEnrollExp: n.dEnrollExp, nCatPort: n.nCatPort, nScopeAdmin: n.nScopeAdmin, dCreatedt: new Date() })]];
            }
            case 'rtedge_enroll_code': {
                if (!this.isAdmin(p.nMasterid)) return [[bad(-3, 'Admin rights required', 'NOT_ALLOWED')]];
                const n = this.nodes.get(p.nEdgeid);
                if (!n) return [[bad(-1, 'Venue box not found', 'NOT_FOUND')]];
                if (n.cStatus === 'X') return [[bad(-2, 'The venue box is revoked', 'REVOKED')]];
                n.cEnrollHash = p.cEnrollHash;
                n.dEnrollExp = new Date(Date.now() + 15 * 60_000);
                this.event('enroll_code', n.nEdgeid, null, {}, p.nMasterid);
                return [[ok({ nEdgeid: n.nEdgeid, cStatus: n.cStatus, dEnrollExp: n.dEnrollExp })]];
            }
            case 'rtedge_enroll': {
                const n = [...this.nodes.values()].find(x => x.cEnrollHash && x.cEnrollHash === p.cEnrollHash);
                if (!n || n.cStatus === 'X') return [[bad(-1, 'Invalid or expired enrollment code', 'INVALID_CODE')]];
                if (!n.dEnrollExp || n.dEnrollExp.getTime() <= Date.now()) {
                    n.cEnrollHash = null;
                    return [[bad(-1, 'Invalid or expired enrollment code', 'INVALID_CODE')]];
                }
                let der: Buffer;
                try {
                    der = Buffer.from(String(p.cPubKey), 'base64');
                } catch {
                    der = Buffer.alloc(0);
                }
                if (der.length !== 91) return [[bad(-1, 'cPubKey must be a base64 P-256 SubjectPublicKeyInfo', 'INVALID')]];
                const fpr = createHash('sha256').update(der).digest('hex');
                const had = !!n.cPubKey;
                Object.assign(n, { cPubKey: der.toString('base64'), cKeyFpr: fpr, cStatus: 'C', cEnrollHash: null, dEnrollExp: null, bTpmKey: !!p.bTpmKey });
                this.event(had ? 'reenroll' : 'enroll', n.nEdgeid, null, { cKeyFpr: fpr });
                return [[ok({ nEdgeid: n.nEdgeid, cSlug: n.cSlug, cKeyFpr: fpr, cStatus: 'C' })]];
            }
            case 'rtedge_confirm_key': {
                if (!this.isAdmin(p.nMasterid)) return [[bad(-3, 'Admin rights required', 'NOT_ALLOWED')]];
                const n = this.nodes.get(p.nEdgeid);
                if (!n) return [[bad(-1, 'Venue box not found', 'NOT_FOUND')]];
                if (n.cStatus !== 'C') return [[bad(-2, 'There is no presented key to confirm', 'STATE')]];
                const typed = String(p.cKeyFpr ?? '').replace(/[^0-9A-Fa-f]/g, '').toLowerCase();
                if (typed !== n.cKeyFpr) {
                    this.event('confirm_key_mismatch', n.nEdgeid, null, {}, p.nMasterid);
                    return [[bad(-2, 'The fingerprint does not match the key the box presented', 'MISMATCH')]];
                }
                n.cStatus = 'A';
                this.event('confirm_key', n.nEdgeid, null, {}, p.nMasterid);
                return [[ok({ nEdgeid: n.nEdgeid, cStatus: 'A', cKeyFpr: n.cKeyFpr })]];
            }
            case 'rtedge_quarantine': {
                const n = this.nodes.get(p.nEdgeid);
                if ((p.cAction === 'A' || p.nMasterid) && !this.isAdmin(p.nMasterid)) return [[bad(-3, 'Admin rights required', 'NOT_ALLOWED')]];
                if (!n) return [[bad(-1, 'Venue box not found', 'NOT_FOUND')]];
                if (n.cStatus === p.cAction) return [[ok({ bChanged: false, nEdgeid: n.nEdgeid, cStatus: n.cStatus })]];
                if ((p.cAction === 'Q' && n.cStatus !== 'A') || (p.cAction === 'A' && n.cStatus !== 'Q')) return [[bad(-2, 'Not possible', 'STATE')]];
                n.cStatus = p.cAction;
                this.event(p.cAction === 'Q' ? 'quarantine' : 'unquarantine', n.nEdgeid, null, { cNote: p.cNote ?? null }, p.nMasterid ?? null);
                return [[ok({ bChanged: true, nEdgeid: n.nEdgeid, cStatus: n.cStatus })]];
            }
            case 'rtedge_revoke': {
                if (!this.isAdmin(p.nMasterid)) return [[bad(-3, 'Admin rights required', 'NOT_ALLOWED')]];
                const n = this.nodes.get(p.nEdgeid);
                if (!n) return [[bad(-1, 'Venue box not found', 'NOT_FOUND')]];
                const already = n.cStatus === 'X';
                const open = [...this.sessions.values()].filter(s => s.nEdgeid === n.nEdgeid && s.cFeedSource === 'E' && ['L', 'S'].includes(s.cSyncState));
                n.cStatus = 'X';
                n.cEnrollHash = null;
                if (!already) this.event('revoke', n.nEdgeid, null, {}, p.nMasterid);
                return [[ok({
                    bAlready: already, nEdgeid: n.nEdgeid, cSlug: n.cSlug, cStatus: 'X',
                    nUnsealed: open.filter(s => !s.dDelDt).length, jUnsealed: open.filter(s => !s.dDelDt).map(s => s.nSesid),
                    nUnsealedDeleted: open.filter(s => s.dDelDt).length, jUnsealedDeleted: open.filter(s => s.dDelDt).map(s => s.nSesid),
                })]];
            }
            case 'rtedge_heartbeat': {
                const n = this.nodes.get(p.nEdgeid);
                if (!n) return [[bad(-1, 'Venue box not found', 'NOT_FOUND')]];
                const prev = { cPrevEgress: n.cLastEgress, cPrevAsn: n.cLastAsn, cPrevVersion: n.cVersion, cPrevParserVer: n.cParserVer };
                n.dLastSeen = new Date();
                if (p.cLastEgress) n.cLastEgress = p.cLastEgress;
                if (p.cLastAsn) n.cLastAsn = p.cLastAsn;
                if (p.cVersion) n.cVersion = p.cVersion;
                if (p.cParserVer) n.cParserVer = p.cParserVer;
                return [[ok({ bWritten: true, nEdgeid: n.nEdgeid, cStatus: n.cStatus, dLastSeen: n.dLastSeen, dCertExp: null, ...prev })]];
            }
            case 'rtedge_case_set': {
                if (!this.isAdmin(p.nMasterid)) return [[bad(-3, 'Admin rights required', 'NOT_ALLOWED')]];
                const n = this.nodes.get(p.nEdgeid);
                if (!n) return [[bad(-1, 'Venue box not found', 'NOT_FOUND')]];
                if (p.permission === 'I') {
                    this.assignCase(n.nEdgeid, p.nCaseid);
                    return [[ok({ bChanged: true, bAssigned: true, nEdgeid: n.nEdgeid, nCaseid: p.nCaseid })]];
                }
                const open = [...this.sessions.values()].some(s => s.nEdgeid === n.nEdgeid && s.nCaseid === p.nCaseid && ['L', 'S'].includes(s.cSyncState));
                if (open) return [[bad(-2, 'unsealed sessions', 'UNSEALED_SESSIONS')]];
                this.cases.get(n.nEdgeid)?.delete(p.nCaseid);
                return [[ok({ bChanged: true, bAssigned: false, nEdgeid: n.nEdgeid, nCaseid: p.nCaseid })]];
            }
            case 'rtedge_assignments': {
                const n = this.nodes.get(String(p.nEdgeid));
                const okBox = n?.cStatus === 'A';
                const head = { msg: okBox ? 1 : n ? -2 : -1, value: '', cCode: okBox ? null : !n ? 'NOT_FOUND' : n.cStatus === 'Q' ? 'QUARANTINED' : n.cStatus === 'X' ? 'REVOKED' : 'NOT_ACTIVE', nEdgeid: p.nEdgeid, cStatus: n?.cStatus ?? null, dServerNow: new Date() };
                if (!okBox) return [[head], [], [], [], []];
                const cases = [...(this.cases.get(n.nEdgeid) ?? [])].map(c => ({ nCaseid: c, ...this.caseInfo.get(c), isArchived: false, dAssignedAt: new Date('2026-09-30T10:00:00Z') }));
                const ses = [...this.sessions.values()].filter(s => s.nEdgeid === n.nEdgeid && s.cFeedSource === 'E' && ['L', 'S'].includes(s.cSyncState));
                const succ = (id: string) => [...this.sessions.values()].find(x => x.nPrevPartSesid === id && !x.dDelDt)?.nSesid ?? null;
                const r3 = ses.map(s => ({
                    nSesid: s.nSesid, nCaseid: s.nCaseid, cName: s.cName, dStartDt: s.dStartDt, cTimezone: s.cTimezone, nLines: s.nLines, nPageno: 1, nDays: 1,
                    cProtocol: s.cProtocol, cStatus: s.cStatus, cSyncState: s.cSyncState, nIngestEpoch: s.nIngestEpoch, nRebaseSeq: s.nRebaseSeq, cParserVer: s.cParserVer,
                    nHearingOpid: s.nHearingOpid, cHearingOpFname: 'Hana', cHearingOpLname: 'Operator', nPartNo: s.nPartNo, nPrevPartSesid: s.nPrevPartSesid,
                    nNextPartSesid: succ(s.nSesid), cReporterIp: s.cReporterIp ?? null, nReporterPort: s.nReporterPort ?? null,
                    cReporterSerial: s.cReporterSerial ?? null, nReporterBaud: s.nReporterBaud ?? null,
                    bDeleted: !!s.dDelDt, cOp: s.cSyncState === 'L' && !s.dDelDt ? 'upsert' : 'end',
                }));
                const r4 = this.team
                    .filter(t => this.cases.get(n.nEdgeid)?.has(t.nCaseid))
                    .map(t => ({ nCaseid: t.nCaseid, nSesid: null, nUserid: t.nUserid, cFname: t.cFname, cLname: t.cLname, cUserStatus: 'A', isCaseAdmin: t.isCaseAdmin, cSource: 'T' }));
                const r5 = [...this.admins].map(id => ({ nUserid: id, cFname: 'Ada', cLname: 'Admin' }));
                return [[head], cases, r3, r4, r5];
            }
            case 'rtedge_session_split': {
                const s = this.sessions.get(p.nSesid);
                if (!s || s.dDelDt) return [[bad(-1, 'Session not found', 'NOT_FOUND')]];
                if (!(this.isAdmin(p.nMasterid) || p.nMasterid === s.nHearingOpid)) return [[bad(-3, 'Only a super-admin or the hearing operator', 'NOT_ALLOWED')]];
                if (s.cFeedSource !== 'E') return [[bad(-2, 'Only a venue-box session can be split', 'STATE')]];
                const next = [...this.sessions.values()].find(x => x.nPrevPartSesid === s.nSesid && !x.dDelDt);
                const row = (p2: FakeSession, already: boolean, copied: number) => [[ok({
                    bAlready: already, nSesid: s.nSesid, nPart2Sesid: p2.nSesid, nPartNo: p2.nPartNo, nCaseid: p2.nCaseid, cName: p2.cName, dStartDt: p2.dStartDt,
                    cUnicuserid: p2.cUnicuserid, cApply: p2.cApply, cSyncState: p2.cSyncState, nLines: p2.nLines, cTimezone: p2.cTimezone, cProtocol: p2.cProtocol,
                    nEdgeid: s.nEdgeid, nAssigneesCopied: copied,
                }, already ? 'Already split' : 'Split to direct cloud')]];
                if (next) return row(next, true, 0);
                if (!['L', 'S'].includes(s.cSyncState)) return [[bad(-2, 'The session is sealed', 'SEALED')]];
                const no = s.nPartNo ?? 1;
                s.cSyncState = 'S';
                s.cStatus = 'C';
                s.nPartNo = no;
                const p2id = `cccccccc-cccc-4ccc-8ccc-${String(this.sessions.size).padStart(12, '0')}`;
                const p2 = this.addSession({
                    nSesid: p2id, nCaseid: s.nCaseid, cName: p.cName ?? `${s.cName} (Part ${no + 1})`, cStatus: 'R', cFeedSource: 'D', bEverEdge: false, cApply: p.cApply ?? 'L',
                    nEdgeid: null, cSyncState: (p.cApply ?? 'L') === 'C' ? 'L' : null, nPrevPartSesid: s.nSesid, nPartNo: no + 1, cUnicuserid: p.cUnicuserid, nHearingOpid: s.nHearingOpid,
                });
                this.event('split', s.nEdgeid, s.nSesid, { nPart2Sesid: p2id, bCredentialCopy: true, cEclipseUsername: p.cEclipseUsername ?? null }, p.nMasterid);
                return row(p2, false, 0);
            }
            case 'rtedge_session_rebind_direct': {
                // File 09: one guarded UPDATE; CONFLICT when the session is not (or no longer) live, never fed and on that box.
                if (!p.nSesid || !p.nEdgeid) return [[bad(-1, 'nSesid and nEdgeid are required', 'INVALID')]];
                const s = this.sessions.get(p.nSesid);
                const orphan = [...this.orphans.values()].some(o => o.nSesid === p.nSesid);
                if (!s || s.nEdgeid !== p.nEdgeid || s.cFeedSource !== 'E' || s.cSyncState !== 'L' || s.dDelDt || s.nAppliedRawSeq !== null || orphan) {
                    return [[bad(-2, 'The session is no longer a live, never-fed session on this venue box', 'CONFLICT')]];
                }
                Object.assign(s, { cFeedSource: 'D', cApply: 'L', nEdgeid: null, bEverEdge: false, cSyncState: null, nIngestEpoch: 1, nRebaseSeq: null, nAppliedRawSeq: null, cAppliedRawHash: null });
                return [[ok({ nSesid: s.nSesid, nCaseid: s.nCaseid }, 'The session now feeds the cloud directly')]];
            }
            case 'rtedge_applied': {
                const s = this.sessions.get(p.nSesid);
                if (!s) return [[bad(-1, 'Session not found', 'NOT_FOUND')]];
                if (!(s.cFeedSource === 'E' || s.cApply === 'C')) return [[bad(-2, 'Not gated', 'NOT_GATED')]];
                if (p.nEdgeid && p.nEdgeid !== s.nEdgeid) return [[bad(-2, 'not bound', 'NOT_BOUND')]];
                let adv = false;
                if (['K', 'W', 'F'].includes(s.cSyncState)) {
                    /* sealed */
                } else if (s.nAppliedRawSeq === null || p.nAppliedRawSeq > s.nAppliedRawSeq) {
                    s.nAppliedRawSeq = p.nAppliedRawSeq;
                    s.cAppliedRawHash = p.cAppliedRawHash ?? null;
                    adv = true;
                } else if (p.nAppliedRawSeq === s.nAppliedRawSeq && p.cAppliedRawHash && s.cAppliedRawHash && s.cAppliedRawHash !== p.cAppliedRawHash) {
                    this.event('alert', s.nEdgeid, s.nSesid, { kind: 'FORK' });
                    return [[bad(-2, 'Another raw hash is already stored for this seq', 'FORK')]];
                }
                return [[ok({ bAdvanced: adv, nSesid: s.nSesid, nAppliedRawSeq: s.nAppliedRawSeq, cAppliedRawHash: s.cAppliedRawHash })]];
            }
            case 'rtedge_session_seal': {
                const s = this.sessions.get(p.nSesid);
                if (!s) return [[bad(-1, 'Session not found', 'NOT_FOUND')]];
                if (!(s.bEverEdge || s.cApply === 'C')) return [[bad(-2, 'Not gated', 'NOT_GATED')]];
                if (['K', 'W', 'F'].includes(s.cSyncState)) {
                    if (s.cFinalDigest === p.cFinalDigest && s.nFinalLines === p.nFinalLines && s.nRawFinalSeq === p.nRawFinalSeq && s.cRawFinalHash === p.cRawFinalHash) {
                        return [[ok({ bAlready: true, nSesid: s.nSesid, nCaseid: s.nCaseid, nEdgeid: s.nEdgeid, cSyncState: s.cSyncState })]];
                    }
                    return [[bad(-2, 'The session is already sealed with different values', 'SEALED')]];
                }
                if (s.cFeedSource === 'E' && p.nEdgeid !== s.nEdgeid) return [[bad(-2, 'not bound', 'NOT_BOUND')]];
                if (s.cFeedSource === 'E' && p.nEpoch !== s.nIngestEpoch) return [[bad(-2, 'Lineage mismatch', 'LINEAGE')]];
                const incidents = typeof p.jIncidents === 'string' ? JSON.parse(p.jIncidents) : p.jIncidents ?? [];
                const warn = incidents.filter((i: any) => WARN_KINDS.has(String(i.kind)) || i.level === 'warning').length;
                const pending = [...this.orphans.values()].filter(o => o.nSesid === s.nSesid && o.cStatus === 'P').length;
                const state = warn > 0 || pending > 0 ? 'W' : 'K';
                Object.assign(s, { cSyncState: state, jIncidents: incidents, cFinalDigest: p.cFinalDigest, nFinalLines: p.nFinalLines, nRawFinalSeq: p.nRawFinalSeq, cRawFinalHash: p.cRawFinalHash, nAppliedRawSeq: p.nRawFinalSeq, cAppliedRawHash: p.cRawFinalHash, cStatus: s.cStatus === 'R' ? 'C' : s.cStatus });
                this.event('seal', s.nEdgeid, s.nSesid, { cSyncState: state, seal: p.jSeal });
                return [[ok({ bAlready: false, nSesid: s.nSesid, nCaseid: s.nCaseid, nEdgeid: s.nEdgeid, cSyncState: state, nWarnings: warn, nPendingOrphans: pending })]];
            }
            case 'rtedge_session_forceseal': {
                if (!this.isAdmin(p.nMasterid)) return [[bad(-3, 'Super-admin rights required', 'NOT_ALLOWED')]];
                const s = this.sessions.get(p.nSesid);
                if (!s) return [[bad(-1, 'Session not found', 'NOT_FOUND')]];
                if (s.cSyncState === 'F') return [[ok({ bAlready: true, nSesid: s.nSesid, cSyncState: 'F', cSealNote: s.cSealNote })]];
                if (s.cSyncState !== 'S') return [[bad(-2, 'End the session (or split it) before a forced close', 'STATE')]];
                Object.assign(s, { cSyncState: 'F', cSealNote: p.cSealNote });
                this.event('forceseal', s.nEdgeid, s.nSesid, {}, p.nMasterid);
                return [[ok({ bAlready: false, nSesid: s.nSesid, cSyncState: 'F', cSealNote: p.cSealNote, nDismissedOrphans: 0 })]];
            }
            case 'rtedge_warn_ack': {
                const s = this.sessions.get(p.nSesid);
                if (!s) return [[bad(-1, 'Session not found', 'NOT_FOUND')]];
                if (!(this.isAdmin(p.nMasterid) || this.caseAdmins.has(p.nMasterid) || p.nMasterid === s.nHearingOpid)) return [[bad(-3, 'not allowed', 'NOT_ALLOWED')]];
                if (s.cSyncState !== 'W') return [[bad(-2, 'Nothing to acknowledge', 'STATE')]];
                s.dWarnAckAt = new Date();
                s.nWarnAckBy = p.nMasterid;
                return [[ok({ bAlready: false, nSesid: s.nSesid, cSyncState: 'W', dWarnAckAt: s.dWarnAckAt, nWarnAckBy: p.nMasterid })]];
            }
            case 'rtedge_session_parser_pin': {
                // File 10 (G5): pins a NULL cParserVer of a live 'E' session of that box; never changes a pinned one.
                if (!p.nSesid || !p.nEdgeid || !p.cParserVer || String(p.cParserVer).length > 60) return [[bad(-1, 'invalid', 'INVALID')]];
                const s = this.sessions.get(p.nSesid);
                if (!s) return [[bad(-1, 'Session not found', 'NOT_FOUND')]];
                if (s.cFeedSource !== 'E' || s.nEdgeid !== p.nEdgeid) return [[bad(-2, 'The session is not bound to this venue box', 'NOT_BOUND')]];
                let pinned = false;
                if (!s.cParserVer && ['L', 'S'].includes(s.cSyncState)) {
                    s.cParserVer = p.cParserVer;
                    pinned = true;
                    this.event('parser_pin', s.nEdgeid, s.nSesid, { cParserVer: p.cParserVer });
                }
                return [[ok({ bPinned: pinned, nSesid: s.nSesid, cParserVer: s.cParserVer }, pinned ? 'Parser version pinned' : 'Unchanged')]];
            }
            case 'rtedge_event_insert':
                this.event(p.cType, p.nEdgeid ?? null, p.nSesid ?? null, typeof p.jData === 'string' ? JSON.parse(p.jData) : p.jData ?? null, p.nMasterid ?? null);
                return [[ok({ nId: this.events.length, dAt: new Date() })]];
            case 'rtedge_orphan_insert': {
                if (!['H', 'C'].includes(p.cKind)) return [[bad(-1, 'cKind must be H or C', 'INVALID')]];
                const id = p.nOrphanid ?? `dddddddd-dddd-4ddd-8ddd-${String(this.orphans.size).padStart(12, '0')}`;
                const prev = this.orphans.get(id);
                this.orphans.set(id, { ...(prev ?? { cStatus: 'P' }), ...p, nOrphanid: id });
                return [[ok({ bDuplicate: !!prev, bReopened: false, nOrphanid: id, nSesid: p.nSesid, cKind: p.cKind, cStatus: 'P', nBytes: p.nBytes ?? 0 })]];
            }
            case 'rtedge_orphan_resolve': {
                const o = this.orphans.get(p.nOrphanid);
                if (!o) return [[bad(-1, 'Orphan not found', 'NOT_FOUND')]];
                if (p.cStatus === 'D' && !this.isAdmin(p.nMasterid)) return [[bad(-3, 'Super-admin rights required', 'NOT_ALLOWED')]];
                o.cStatus = p.cStatus;
                return [[ok({ bAlready: false, nOrphanid: o.nOrphanid, nSesid: o.nSesid, cStatus: o.cStatus, nPendingLeft: 0 })]];
            }
            default:
                return [[bad(-1, `fake: unknown SP ${name}`, 'UNKNOWN')]];
        }
    }

    async rowQuery(sql: string, params: any[] = []): Promise<any> {
        this.sql.push([sql, params]);
        if (this.fail.has('rowQuery')) return { success: false, error: this.fail.get('rowQuery') };
        if (sql === EDGE_BINDING_SQL) {
            const ids: string[] = params[0];
            const rows = ids.map(id => this.sessions.get(id)).filter(Boolean).map(s => ({ ...s, bDeleted: !!s.dDelDt }));
            return { success: true, data: rows };
        }
        if (sql === EDGE_ADMINS_SQL) return { success: true, data: [...this.admins].map(nUserid => ({ nUserid })) };
        if (sql === EDGE_CASE_ADMIN_SQL) {
            const [nCaseid, nUserid] = params;
            const yes = this.caseAdmins.has(nUserid) || this.team.some(t => t.nCaseid === nCaseid && t.nUserid === nUserid && t.isCaseAdmin);
            return { success: true, data: [{ bCaseAdmin: yes }] };
        }
        if (sql === EDGE_USER_EMAILS_SQL) return { success: true, data: (params[0] as string[]).filter(id => this.emails.has(id)).map(id => ({ nUserid: id, cEmail: this.emails.get(id) })) };
        if (sql === EDGE_LAST_EVENT_SQL) {
            const last = [...this.events].reverse().find(e => e.nEdgeid === params[0]);
            return { success: true, data: last ? [{ cType: last.cType }] : [] };
        }
        if (sql === EDGE_SUCCESSOR_SQL) {
            const next = [...this.sessions.values()].find(x => x.nPrevPartSesid === params[0] && !x.dDelDt);
            return { success: true, data: next ? [{ nSesid: next.nSesid }] : [] };
        }
        if (sql === EDGE_ORPHANS_SQL) return { success: true, data: [...this.orphans.values()].filter(o => (!params[0] || o.nSesid === params[0]) && (!params[2] || o.cStatus === params[2])) };
        if (sql === EDGE_EVENTS_SQL) return { success: true, data: this.events.filter(e => (!params[0] || e.nEdgeid === params[0]) && (!params[1] || e.nSesid === params[1]) && (!params[2] || e.cType === params[2])).map(e => ({ ...e, jData: e.jData && typeof e.jData === 'object' ? { ...e.jData } : e.jData })) };
        if (sql === EDGE_NODE_STATUS_SQL) {
            const ids: string[] = params[0];
            return { success: true, data: ids.map(id => this.nodes.get(id)).filter(Boolean).map(n => ({ nEdgeid: n.nEdgeid, cStatus: n.cStatus })) };
        }
        if (sql === EDGE_SESSION_CREATOR_SQL) {
            const bind = [...this.events].reverse().find(e => e.cType === 'bind' && e.nSesid === params[0] && e.nByUser);
            return { success: true, data: bind ? [{ nByUser: bind.nByUser }] : [] };
        }
        if (sql === EDGE_SEAL_FIELDS_SQL) {
            const s = this.sessions.get(params[0]);
            if (!s) return { success: true, data: [] };
            const by = s.nWarnAckBy ?? null;
            const who = by ? this.users.get(by) : undefined;
            return {
                success: true,
                data: [{
                    jIncidents: s.jIncidents, dWarnAckAt: s.dWarnAckAt, nWarnAckBy: by, cWarnAckFname: who?.cFname ?? null, cWarnAckLname: who?.cLname ?? null,
                    cSealNote: s.cSealNote, dSealedAt: s.dSealedAt ?? null, nFinalLines: s.nFinalLines,
                    nRawFinalSeq: s.nRawFinalSeq ?? null, cRawFinalHash: s.cRawFinalHash ?? null,
                }],
            };
        }
        return { success: false, error: `fake: unknown SQL ${sql.slice(0, 60)}` };
    }
}

// ---------------------------------------------------------------------------------------------------------------
// In-memory page store
// ---------------------------------------------------------------------------------------------------------------

export class MemoryApplyPort implements EdgeApplyPort {
    readonly pages = new Map<string, Map<number, unknown[]>>();
    readonly broadcasts: Array<{ nSesid: string; cut: BroadcastCut; kind: string }> = [];
    readonly emits: Array<{ to: string; event: string; payload: any }> = [];
    readonly ended: Array<{ nSesid: string; nCaseid: string | null }> = [];
    readonly applied: Array<{ nSesid: string; plan: RoundApplyPlan }> = [];
    isReady = true;
    barrierDepth = 0;
    maxBarrierDepth = 0;
    private chain: Promise<unknown> = Promise.resolve();

    ready() {
        return this.isReady;
    }
    runBarrier<T>(_nSesid: string, fn: () => Promise<T>): Promise<T> {
        const run = this.chain.then(async () => {
            this.barrierDepth += 1;
            this.maxBarrierDepth = Math.max(this.maxBarrierDepth, this.barrierDepth);
            try {
                return await fn();
            } finally {
                this.barrierDepth -= 1;
            }
        });
        this.chain = run.then(() => undefined, () => undefined);
        return run;
    }
    store(nSesid: string) {
        let m = this.pages.get(nSesid);
        if (!m) this.pages.set(nSesid, (m = new Map()));
        return m;
    }
    async currentPages(nSesid: string) {
        return new Map(this.store(nSesid));
    }
    async applyRoundAtomic(nSesid: string, plan: RoundApplyPlan) {
        const m = this.store(nSesid);
        for (const pg of plan.pages) m.set(pg.p, JSON.parse(JSON.stringify(pg.lines)));
        for (const p of [...m.keys()]) if (p > plan.deletePagesAbove) m.delete(p);
        this.applied.push({ nSesid, plan });
        return { appliedPages: plan.pages.length, deletedAbove: plan.droppedPages.length ? plan.deletePagesAbove : null, redisBatched: false };
    }
    async deletePagesAbove(nSesid: string, maxPage: number) {
        const m = this.store(nSesid);
        for (const p of [...m.keys()]) if (p > maxPage) m.delete(p);
    }
    broadcastCut(nSesid: string, cut: BroadcastCut) {
        this.broadcasts.push({ nSesid, cut, kind: planBroadcast(cut).kind });
    }
    emitToSession(nSesid: string, event: string, payload: unknown) {
        this.emits.push({ to: `S${nSesid}`, event, payload });
    }
    emitToAll(event: string, payload: unknown) {
        this.emits.push({ to: '*', event, payload });
    }
    async completeSessionEnd(nSesid: string, nCaseid: string | null): Promise<EdgeSessionEndOutcome> {
        this.ended.push({ nSesid, nCaseid });
        return { ok: true, via: 'session-service' };
    }
    /** sessions whose feed path change reached the port (the gateway forgets their ingest-lane verdict) */
    readonly feedPathChanges: string[] = [];
    feedPathChanged(nSesid: string) {
        this.feedPathChanges.push(nSesid);
    }
}

// ---------------------------------------------------------------------------------------------------------------
// Box simulator
// ---------------------------------------------------------------------------------------------------------------

export function line(i: number, text = `line ${i}`): unknown[] {
    return ['10:00:00:00', Array.from(text, c => c.charCodeAt(0)), i, 1, i + 1, 1, (i + 1) * 1_000_000, [], 0];
}

export class BoxSim {
    readonly encoded: Buffer[] = [];
    readonly hashes: string[];
    readonly lines: unknown[][] = [];
    cutter: PageCutter;
    t = 1_700_000_000_000;
    incidents: EdgeIncident[] = [];

    constructor(readonly nSesid: string, readonly key: DeviceKey, readonly nEdgeid = IDS.box, public bootId = 'boot-1') {
        this.hashes = [chainSeed(nSesid).toString('hex')];
        this.cutter = new PageCutter({ nSesid, rawSeqThrough: 0, rawHashThrough: this.hashes[0] });
    }

    get headSeq() {
        return this.hashes.length - 1;
    }
    get headHash() {
        return this.hashes[this.hashes.length - 1];
    }

    append(type: RecordType, body: any, flags = 0): number {
        const seq = this.headSeq + 1;
        this.t += 10;
        const rec = encodeRecord({ type, flags, seq, tRecvMs: this.t, payload: encodeBody(type, body) });
        this.encoded.push(rec);
        this.hashes.push(chainNext(Buffer.from(this.headHash, 'hex'), rec).toString('hex'));
        return seq;
    }

    /** SESSION_HEADER + EPOCH (armed, no feed yet). */
    arm() {
        this.append(RecordType.SESSION_HEADER, { nSesid: this.nSesid, nCaseid: IDS.caseA, nLines: 25, tz: 'Europe/London', parserVer: PARSER_VER, fmt: 1, createdAt: this.t });
        this.append(RecordType.EPOCH, { epoch: 1, owner: 'edge' });
        return this;
    }

    connOpen() {
        this.append(RecordType.CONN_OPEN, { connId: 'l-1', remote: '10.0.0.9', user: 'courtroom-1', mode: 'listen' });
        return this;
    }

    /** Add n lines (one DATA record) and cut. */
    addLines(n: number) {
        const start = this.lines.length;
        for (let k = 0; k < n; k++) this.lines.push(line(start + k));
        this.append(RecordType.DATA, Buffer.from(`data ${start}-${start + n}`));
        return this.cut();
    }

    /** Rewrite line i (a refresh) and cut. */
    rewrite(i: number, text: string) {
        this.lines[i] = line(i, text);
        this.append(RecordType.DATA, Buffer.from(`refresh ${i}`));
        return this.cut();
    }

    /** Drop lines down to n (backspace / refresh shrink) and cut. */
    shrinkTo(n: number) {
        this.lines.length = n;
        this.append(RecordType.DATA, Buffer.from(`shrink ${n}`));
        return this.cut('backspace');
    }

    incident(kind: string, level: 'warning' | 'info' = 'warning') {
        const body = { kind, level, note: `test ${kind}` } as any;
        this.append(RecordType.INCIDENT, body);
        this.incidents.push(body);
        return this;
    }

    end(endedBy = 'cloud') {
        this.append(RecordType.SESSION_END, { endedBy, at: this.t });
        return this;
    }

    cut(cause?: string) {
        return this.cutter.boundary(this.lines, this.headSeq, this.headHash, cause);
    }

    journal() {
        return { headSeq: this.headSeq, hashAt: (seq: number) => this.hashes[seq] };
    }

    rawBatch(fromSeq: number, toSeq = this.headSeq, epoch = 1): EdgeRaw {
        return {
            nSesid: this.nSesid,
            epoch,
            fromSeq,
            toSeq,
            prevHash: this.hashes[fromSeq - 1],
            recs: Buffer.concat(this.encoded.slice(fromSeq - 1, toSeq)),
        };
    }

    helloSession(lastRound: { rawSeqThrough: number; rawHashThrough: string } | null = null): EdgeHelloSession {
        const v = this.cutter.view();
        return {
            nSesid: this.nSesid,
            epoch: 1,
            rebaseSeq: null,
            rev: v.rev,
            totalLines: v.totalLines,
            root: v.root,
            raw: { headSeq: this.headSeq, headHash: this.headHash },
            lastRound,
            state: 'live',
            incidents: [],
        };
    }

    round(cloud: CloudView, lineage: RoundLineage, maxPartBytes?: number): BuiltRound | null {
        return buildRound({ source: this.cutter.view(), epoch: 1, rebaseSeq: null, lineage, cloud, ...(maxPartBytes ? { maxPartBytes } : {}) });
    }

    sign(payload: string): string {
        return signWith(this.key, payload);
    }

    auth(nonce: string) {
        return { edgeId: this.nEdgeid, nonce, bootId: this.bootId, sig: this.sign(edgeAuthSigningPayload(nonce, this.nEdgeid, this.bootId)) };
    }

    seal(appliedRev: number, cloud: CloudView, incidents: EdgeIncident[] = this.incidents): EdgeSeal {
        const claims = sealClaims({
            source: this.cutter.view(),
            cloud,
            appliedRev,
            epoch: 1,
            rawFinalSeq: this.headSeq,
            rawFinalHash: this.headHash,
            endedAtEdgeMs: this.t,
            endedBy: 'cloud',
            incidents,
        });
        if (!claims) throw new Error('BoxSim.seal: a round is still needed');
        return { ...claims, sig: this.sign(sealSigningPayload(claims)) };
    }
}

// ---------------------------------------------------------------------------------------------------------------
// Temp dirs
// ---------------------------------------------------------------------------------------------------------------

export function tempDir(prefix: string): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), `rt-edge-${prefix}-`));
}

export function rmTemp(dir: string): void {
    try {
        fs.rmSync(dir, { recursive: true, force: true });
    } catch {
        /* best effort */
    }
}

export async function until(cond: () => boolean | Promise<boolean>, ms = 3000): Promise<void> {
    const end = Date.now() + ms;
    while (Date.now() < end) {
        if (await cond()) return;
        await new Promise(r => setTimeout(r, 10));
    }
    throw new Error('condition not met in time');
}

// Every suite that imports this kit fails a test whose module code called an SP outside the migrations' contract
// (unknown SP, wrong cursor count, a parameter the SP never reads), even where the module swallows the DB error.
afterEach(() => {
    if (!SP_CONTRACT_VIOLATIONS.length) return;
    const seen = [...new Set(SP_CONTRACT_VIOLATIONS.splice(0))];
    throw new Error(`SP contract violations (assets/sql-migrations/2026-10-01_rt_edge_*.sql): ${seen.join('; ')}`);
});

// Self-tests, only when this file runs as its own suite.
if (String((expect as any).getState?.().testPath ?? '').replace(/\\/g, '/').endsWith('edge/edge-test-kit.spec.ts')) {
    describe('edge test kit', () => {
        it('BoxSim journals a verifiable chain and cuts pages', () => {
            const box = new BoxSim(IDS.ses, deviceKey()).arm().connOpen();
            const cut = box.addLines(30);
            expect(cut.totalLines).toBe(30);
            expect(box.headSeq).toBe(4);
            expect(box.rawBatch(1).recs.length).toBeGreaterThan(0);
        });

        it('FakeEdgeDb answers the binding read', async () => {
            const db = new FakeEdgeDb();
            db.addSession({ nSesid: IDS.ses });
            const res = await db.rowQuery(EDGE_BINDING_SQL, [[IDS.ses]]);
            expect(res.data[0].cFeedSource).toBe('E');
        });
    });
}
