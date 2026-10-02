/**
 * The smaller StatePort repositories: incidents, held captures, transmitter settings + state version, monotonic
 * counters, the box identity and secrets, the cached cloud JWKS and the audit trail (ports/state.port.ts).
 */
import { randomBytes } from 'crypto';

import { incidentLevel, IncidentKind, IncidentLevel, isWarningIncident } from '@app/edge-sync';

import type { EdgeActor, EdgeLinkFailure, TransmitterApplied, TransmitterSettings } from '../contracts';
import {
    AuditRepo,
    BoxIdentityRecord,
    BoxIdentityStatus,
    BoxIncidentRecord,
    BoxSecretPurpose,
    CachedJwk,
    CountersRepo,
    EdgeAuditAction,
    EdgeAuditEntry,
    EdgeCounterName,
    EdgePortError,
    HeldCaptureRecord,
    HeldCapturesRepo,
    IdentityRepo,
    IncidentsRepo,
    JwksRepo,
    TransmitterSettingsRepo,
} from '../ports';
import { col, deepFreeze, EdgeDb, Row } from './db';
import { KvStore } from './kv';
import type { SqliteSessionsRepo } from './sessions.repo';

const invalid = (message: string): EdgePortError => new EdgePortError('invalid_request', message);
const sessionNotFound = (nSesid: string): EdgePortError => new EdgePortError('session_not_found', `session ${nSesid} is not on this box`);
const optInt = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? Math.floor(v) : null);

// ---------------------------------------------------------------------------------------------------------------
// Incidents
// ---------------------------------------------------------------------------------------------------------------

function incidentOf(row: Row): BoxIncidentRecord {
    const out: Record<string, unknown> = {
        nSesid: col.str(row, 'nSesid'),
        seq: col.numOrNull(row, 'seq'),
        atMs: col.num(row, 'atMs'),
        kind: col.str(row, 'kind') as IncidentKind,
        level: col.str(row, 'level') as IncidentLevel,
    };
    const fromSeq = col.numOrNull(row, 'fromSeq');
    const toSeq = col.numOrNull(row, 'toSeq');
    const lines = col.numOrNull(row, 'lines');
    const note = col.strOrNull(row, 'note');
    if (fromSeq !== null) out.fromSeq = fromSeq;
    if (toSeq !== null) out.toSeq = toSeq;
    if (lines !== null) out.lines = lines;
    if (note !== null) out.note = note;
    return Object.freeze(out) as unknown as BoxIncidentRecord;
}

export class SqliteIncidentsRepo implements IncidentsRepo {
    constructor(
        private readonly db: EdgeDb,
        private readonly sessions: SqliteSessionsRepo,
    ) {}

    record(incident: BoxIncidentRecord): void {
        if (!incident || typeof incident.kind !== 'string' || !incident.kind) throw invalid('incident.kind is required');
        if (!Number.isFinite(incident.atMs)) throw invalid('incident.atMs must be epoch ms');
        if (incident.seq !== null && !Number.isSafeInteger(incident.seq)) throw invalid('incident.seq must be an integer or null');
        const level: IncidentLevel = incident.level === 'warning' || incident.level === 'info' ? incident.level : incidentLevel(incident.kind);
        this.db.tx(() => {
            if (!this.sessions.exists(incident.nSesid)) throw sessionNotFound(incident.nSesid);
            this.db.run(
                'INSERT OR IGNORE INTO incidents (nSesid, seq, kind, level, fromSeq, toSeq, lines, note, atMs) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                incident.nSesid,
                incident.seq,
                incident.kind,
                level,
                optInt(incident.fromSeq),
                optInt(incident.toSeq),
                optInt(incident.lines),
                typeof incident.note === 'string' ? incident.note.slice(0, 500) : null,
                Math.floor(incident.atMs),
            );
        });
    }

    list(nSesid: string): readonly BoxIncidentRecord[] {
        return this.db.all('SELECT * FROM incidents WHERE nSesid = ? ORDER BY (seq IS NULL), seq, id', String(nSesid)).map(incidentOf);
    }

    count(nSesid: string): { readonly total: number; readonly warnings: number } {
        const all = this.list(nSesid);
        return Object.freeze({ total: all.length, warnings: all.filter(i => isWarningIncident(i)).length });
    }
}

// ---------------------------------------------------------------------------------------------------------------
// Held captures
// ---------------------------------------------------------------------------------------------------------------

function captureOf(row: Row): HeldCaptureRecord {
    return Object.freeze({
        id: col.str(row, 'id'),
        nSesid: col.str(row, 'nSesid'),
        kind: 'C' as const,
        user: col.strOrNull(row, 'user'),
        peer: col.str(row, 'peer'),
        fromMs: col.num(row, 'fromMs'),
        toMs: col.numOrNull(row, 'toMs'),
        bytes: col.num(row, 'bytes'),
        sha256: col.strOrNull(row, 'sha256'),
        file: col.str(row, 'file'),
        uploadedAtMs: col.numOrNull(row, 'uploadedAtMs'),
        nOrphanid: col.strOrNull(row, 'nOrphanid'),
    });
}

export class SqliteHeldCapturesRepo implements HeldCapturesRepo {
    constructor(
        private readonly db: EdgeDb,
        private readonly sessions: SqliteSessionsRepo,
    ) {}

    upsert(record: HeldCaptureRecord): void {
        if (!record || typeof record.id !== 'string' || !record.id) throw invalid('capture id is required');
        if (typeof record.file !== 'string' || !record.file) throw invalid('capture file is required');
        if (!Number.isFinite(record.fromMs)) throw invalid('capture fromMs must be epoch ms');
        this.db.tx(() => {
            if (!this.sessions.exists(record.nSesid)) throw sessionNotFound(record.nSesid);
            this.db.run(
                `INSERT INTO held_captures (id, nSesid, kind, user, peer, fromMs, toMs, bytes, sha256, file, uploadedAtMs, nOrphanid)
                 VALUES (?, ?, 'C', ?, ?, ?, ?, ?, ?, ?, ?, ?)
                 ON CONFLICT(id) DO UPDATE SET nSesid = excluded.nSesid, user = excluded.user, peer = excluded.peer, fromMs = excluded.fromMs,
                     toMs = excluded.toMs, bytes = excluded.bytes, sha256 = excluded.sha256, file = excluded.file,
                     uploadedAtMs = excluded.uploadedAtMs, nOrphanid = excluded.nOrphanid`,
                record.id,
                record.nSesid,
                record.user ?? null,
                String(record.peer ?? ''),
                Math.floor(record.fromMs),
                optInt(record.toMs),
                Math.max(0, Math.floor(Number(record.bytes) || 0)),
                record.sha256 ?? null,
                record.file,
                optInt(record.uploadedAtMs),
                record.nOrphanid ?? null,
            );
        });
    }

    get(id: string): HeldCaptureRecord | null {
        const row = this.db.get('SELECT * FROM held_captures WHERE id = ?', String(id));
        return row ? captureOf(row) : null;
    }

    list(filter: { readonly nSesid?: string; readonly pendingUpload?: boolean } = {}): readonly HeldCaptureRecord[] {
        const where: string[] = [];
        const params: string[] = [];
        if (filter.nSesid !== undefined) {
            where.push('nSesid = ?');
            params.push(String(filter.nSesid));
        }
        if (filter.pendingUpload === true) where.push('sha256 IS NOT NULL AND uploadedAtMs IS NULL');
        if (filter.pendingUpload === false) where.push('NOT (sha256 IS NOT NULL AND uploadedAtMs IS NULL)');
        return this.db.all(`SELECT * FROM held_captures ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY fromMs, id`, ...params).map(captureOf);
    }

    markUploaded(id: string, nOrphanid: string, atMs: number): HeldCaptureRecord {
        if (typeof nOrphanid !== 'string' || !nOrphanid) throw invalid('nOrphanid is required');
        return this.db.tx(() => {
            const res = this.db.run('UPDATE held_captures SET uploadedAtMs = ?, nOrphanid = ? WHERE id = ?', Math.floor(atMs), nOrphanid, String(id));
            if (res.changes !== 1) throw new EdgePortError('not_found', `held capture ${id} not found`);
            return this.get(id)!;
        });
    }
}

// ---------------------------------------------------------------------------------------------------------------
// Transmitter settings + state version, counters
// ---------------------------------------------------------------------------------------------------------------

const TX_SETTINGS_KEY = 'transmitter.settings';
const TX_VERSION_KEY = 'transmitter.version';

export class SqliteTransmitterRepo implements TransmitterSettingsRepo {
    constructor(private readonly kv: KvStore) {}

    get(): { readonly settings: TransmitterSettings | null; readonly applied: TransmitterApplied | null } {
        const stored = this.kv.getJson<{ settings: TransmitterSettings; applied: TransmitterApplied }>(TX_SETTINGS_KEY);
        return deepFreeze({ settings: stored?.settings ?? null, applied: stored?.applied ?? null });
    }

    save(settings: TransmitterSettings, applied: TransmitterApplied): void {
        if (!settings || (settings.mode !== 'listen' && settings.mode !== 'dial')) throw invalid('settings.mode must be listen or dial');
        if (!applied || !Number.isFinite(applied.atMs) || !applied.by) throw invalid('applied needs atMs and by');
        const clean: TransmitterSettings = {
            mode: settings.mode,
            protocol: settings.protocol === 'bridge' || settings.protocol === 'caseview' ? settings.protocol : null,
            host: typeof settings.host === 'string' && settings.host.trim() ? settings.host.trim() : null,
            port: Number.isInteger(settings.port) ? settings.port : null,
            autoReconnect: settings.autoReconnect !== false,
            receivingSesid: typeof settings.receivingSesid === 'string' && settings.receivingSesid ? settings.receivingSesid : null,
        };
        this.kv.setJson(TX_SETTINGS_KEY, { settings: clean, applied: { atMs: Math.floor(applied.atMs), by: applied.by } });
    }

    version(): number {
        return this.kv.getNumber(TX_VERSION_KEY);
    }

    bumpVersion(): number {
        return this.kv.increment(TX_VERSION_KEY);
    }
}

const COUNTERS: ReadonlySet<string> = new Set<EdgeCounterName>(['lan-seq']);

export class SqliteCountersRepo implements CountersRepo {
    constructor(
        private readonly db: EdgeDb,
        private readonly kv: KvStore,
    ) {}

    get(name: EdgeCounterName): number {
        if (!COUNTERS.has(name)) throw invalid(`unknown counter ${String(name)}`);
        return this.kv.getNumber(`counter.${name}`);
    }

    raise(name: EdgeCounterName, value: number): number {
        if (!COUNTERS.has(name)) throw invalid(`unknown counter ${String(name)}`);
        if (!Number.isSafeInteger(value) || value < 0) throw invalid('counter value must be a non-negative safe integer');
        return this.db.tx(() => {
            const next = Math.max(this.kv.getNumber(`counter.${name}`), value);
            this.kv.set(`counter.${name}`, String(next));
            return next;
        });
    }
}

// ---------------------------------------------------------------------------------------------------------------
// Identity, secrets, JWKS
// ---------------------------------------------------------------------------------------------------------------

const IDENTITY_KEY = 'identity';
const JWKS_KEY = 'jwks';
const STATUSES: ReadonlySet<BoxIdentityStatus> = new Set<BoxIdentityStatus>(['pending-confirm', 'active', 'quarantined', 'revoked']);
const FAILURES: ReadonlySet<EdgeLinkFailure> = new Set<EdgeLinkFailure>(['never-enrolled', 'revoked', 'quarantined', 'key-refused', 'certificate', 'unreachable']);
const PURPOSES: ReadonlySet<BoxSecretPurpose> = new Set<BoxSecretPurpose>(['room-code-hmac', 'box-token-signing']);

function checkIdentity(r: BoxIdentityRecord): BoxIdentityRecord {
    if (!r || typeof r.nEdgeid !== 'string' || !r.nEdgeid) throw invalid('identity.nEdgeid is required');
    if (typeof r.slug !== 'string' || !/^[a-z0-9-]{1,63}$/.test(r.slug)) throw invalid('identity.slug must be a DNS label');
    if (!STATUSES.has(r.status)) throw invalid(`unknown identity status ${String(r.status)}`);
    if (typeof r.keyFingerprint !== 'string' || typeof r.publicKeySpki !== 'string') throw invalid('identity key fields are required');
    if (r.linkFailure !== null && !FAILURES.has(r.linkFailure)) throw invalid(`unknown linkFailure ${String(r.linkFailure)}`);
    return {
        nEdgeid: r.nEdgeid,
        slug: r.slug,
        status: r.status,
        keyFingerprint: r.keyFingerprint,
        publicKeySpki: r.publicKeySpki,
        tpmKey: r.tpmKey === true,
        cloudOrigin: String(r.cloudOrigin ?? ''),
        enrolledAtMs: Math.floor(Number(r.enrolledAtMs) || 0),
        confirmedAtMs: optInt(r.confirmedAtMs),
        lastCloudContactAtMs: optInt(r.lastCloudContactAtMs),
        linkFailure: r.linkFailure ?? null,
    };
}

export class SqliteIdentityRepo implements IdentityRepo {
    constructor(
        private readonly db: EdgeDb,
        private readonly kv: KvStore,
    ) {}

    get(): BoxIdentityRecord | null {
        const stored = this.kv.getJson<BoxIdentityRecord>(IDENTITY_KEY);
        return stored ? Object.freeze({ ...stored }) : null;
    }

    save(record: BoxIdentityRecord): void {
        this.kv.setJson(IDENTITY_KEY, checkIdentity(record));
    }

    patch(patch: Partial<Omit<BoxIdentityRecord, 'nEdgeid'>>): BoxIdentityRecord {
        return this.db.tx(() => {
            const current = this.get();
            if (!current) throw new EdgePortError('box_not_configured', 'the box is not enrolled');
            const next = checkIdentity({ ...current, ...(patch ?? {}), nEdgeid: current.nEdgeid } as BoxIdentityRecord);
            this.kv.setJson(IDENTITY_KEY, next);
            return Object.freeze(next);
        });
    }

    secret(purpose: BoxSecretPurpose): Buffer {
        if (!PURPOSES.has(purpose)) throw invalid(`unknown secret purpose ${String(purpose)}`);
        return this.db.tx(() => {
            this.db.run('INSERT OR IGNORE INTO secrets (purpose, value) VALUES (?, ?)', purpose, randomBytes(32));
            return col.buffer(this.db.get('SELECT value FROM secrets WHERE purpose = ?', purpose)!, 'value');
        });
    }
}

export class SqliteJwksRepo implements JwksRepo {
    constructor(private readonly kv: KvStore) {}

    get(): { readonly keys: readonly CachedJwk[]; readonly receivedAtMs: number } | null {
        const stored = this.kv.getJson<{ keys: CachedJwk[]; receivedAtMs: number }>(JWKS_KEY);
        return stored && Array.isArray(stored.keys) ? deepFreeze({ keys: stored.keys, receivedAtMs: Number(stored.receivedAtMs) }) : null;
    }

    save(keys: readonly CachedJwk[], atMs: number): void {
        if (!Array.isArray(keys)) throw invalid('keys must be an array');
        const clean = keys.filter(k => k && typeof k === 'object' && !Array.isArray(k)).map(k => ({ ...k }));
        this.kv.setJson(JWKS_KEY, { keys: clean, receivedAtMs: Math.floor(atMs) });
    }
}

// ---------------------------------------------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------------------------------------------

const ACTIONS: ReadonlySet<EdgeAuditAction> = new Set<EdgeAuditAction>([
    'sign-in-start',
    'room-code-redeem',
    'operator-code-sign-in',
    'sign-out',
    'room-code-issue',
    'room-code-revoke',
    'room-code-end-access',
    'room-code-reissue',
    'operator-code-issue',
    'transmitter-apply',
    'transmitter-connect',
    'transmitter-reconnect',
    'transmitter-test',
    'reporter-card',
    'diagnostics-download',
    'readiness-run',
    'network-run',
    'recovery-dismiss',
    'enrol',
    'cert-install',
]);

function auditOf(row: Row): EdgeAuditEntry & { readonly id: string } {
    return deepFreeze({
        id: String(col.num(row, 'id')),
        atMs: col.num(row, 'atMs'),
        action: col.str(row, 'action') as EdgeAuditAction,
        actor: col.json<EdgeActor | null>(row, 'actor', null),
        outcome: col.str(row, 'outcome'),
        nSesid: col.strOrNull(row, 'nSesid'),
        target: col.strOrNull(row, 'target'),
        ip: col.strOrNull(row, 'ip'),
        deviceHash: col.strOrNull(row, 'deviceHash'),
        data: col.json<Record<string, unknown> | null>(row, 'data', null),
    });
}

export class SqliteAuditRepo implements AuditRepo {
    constructor(private readonly db: EdgeDb) {}

    append(entry: EdgeAuditEntry): void {
        if (!entry || !ACTIONS.has(entry.action)) throw invalid(`unknown audit action ${String(entry?.action)}`);
        if (!Number.isFinite(entry.atMs)) throw invalid('audit atMs must be epoch ms');
        if (typeof entry.outcome !== 'string' || !entry.outcome) throw invalid('audit outcome is required');
        this.db.run(
            'INSERT INTO audit (atMs, action, actor, outcome, nSesid, target, ip, deviceHash, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            Math.floor(entry.atMs),
            entry.action,
            entry.actor ? JSON.stringify(entry.actor) : null,
            entry.outcome,
            entry.nSesid ?? null,
            entry.target ?? null,
            entry.ip ?? null,
            entry.deviceHash ?? null,
            entry.data ? JSON.stringify(entry.data) : null,
        );
    }

    list(opts: { readonly sinceMs?: number; readonly limit: number }): readonly (EdgeAuditEntry & { readonly id: string })[] {
        const limit = opts?.limit;
        if (!Number.isInteger(limit) || limit < 1 || limit > 1000) throw invalid('limit must be 1-1000');
        if (opts.sinceMs !== undefined && !Number.isFinite(opts.sinceMs)) throw invalid('sinceMs must be epoch ms');
        const rows =
            opts.sinceMs !== undefined
                ? this.db.all('SELECT * FROM audit WHERE atMs >= ? ORDER BY atMs DESC, id DESC LIMIT ?', Math.floor(opts.sinceMs), limit)
                : this.db.all('SELECT * FROM audit ORDER BY atMs DESC, id DESC LIMIT ?', limit);
        return rows.map(auditOf);
    }

    pruneBefore(beforeMs: number): number {
        return this.db.run('DELETE FROM audit WHERE atMs < ?', Math.floor(beforeMs)).changes;
    }
}
