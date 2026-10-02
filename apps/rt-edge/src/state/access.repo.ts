/**
 * Room codes, the daily operator code and the revocation lists (ports/state.port.ts RoomCodesRepo,
 * OperatorCodesRepo, RevocationsRepo; spec §4.10, §8.4; D33, DR7, DR10; build defaults O-9, O-10).
 *
 * Only hashes are stored: `codeHash` is computed by the auth module (HMAC with a box secret), the operator code is
 * a scrypt hash with its salt. A room code is one person, one session, one use, bound to one device on redemption
 * (`deviceHash` = sha256 of the device cookie); state changes are compare-and-set so two redemptions racing for one
 * code cannot both win. At most one UNUSED code exists per (session, person) (partial unique index).
 */
import type { EdgeRevocations } from '@app/edge-sync';
import { EDGE_JTI_MAX_LENGTH } from '@app/edge-token/constants';

import type { EdgeActor, EdgePersonRef, RoomCodeStatus } from '../contracts';
import {
    EDGE_REVOCATION_RETAIN_MS,
    EdgePortError,
    isBoxDay,
    JtiRevocationReason,
    OperatorCodeDelivery,
    OperatorCodeRecord,
    OperatorCodesRepo,
    RevocationsRepo,
    RoomCodeRecord,
    RoomCodesRepo,
    userRevocationCutoffMs,
} from '../ports';
import { col, EdgeDb, Row } from './db';
import { KvStore } from './kv';
import type { SqliteSessionsRepo } from './sessions.repo';

const invalid = (message: string): EdgePortError => new EdgePortError('invalid_request', message);
const notFound = (what: string): EdgePortError => new EdgePortError('not_found', `${what} not found`);

function actorOf(value: unknown): EdgeActor {
    const a = (value ?? {}) as Partial<EdgeActor>;
    return Object.freeze({
        nUserid: typeof a.nUserid === 'string' ? a.nUserid : null,
        name: String(a.name ?? ''),
        via: a.via === 'room-code' || a.via === 'operator' ? a.via : 'online',
        operatorName: typeof a.operatorName === 'string' ? a.operatorName : null,
    });
}

function roomCodeOf(row: Row): RoomCodeRecord {
    return Object.freeze({
        id: col.str(row, 'id'),
        nSesid: col.str(row, 'nSesid'),
        nCaseid: col.str(row, 'nCaseid'),
        nUserid: col.str(row, 'nUserid'),
        codeHash: col.str(row, 'codeHash'),
        status: col.str(row, 'status') as RoomCodeStatus,
        issuedAtMs: col.num(row, 'issuedAtMs'),
        issuedBy: actorOf(col.json(row, 'issuedBy', {})),
        replacedId: col.strOrNull(row, 'replacedId'),
        deviceHash: col.strOrNull(row, 'deviceHash'),
        deviceLabel: col.strOrNull(row, 'deviceLabel'),
        usedAtMs: col.numOrNull(row, 'usedAtMs'),
        tokenJti: col.strOrNull(row, 'tokenJti'),
        revokedAtMs: col.numOrNull(row, 'revokedAtMs'),
        endedAtMs: col.numOrNull(row, 'endedAtMs'),
        expiredAtMs: col.numOrNull(row, 'expiredAtMs'),
    });
}

const okText = (v: unknown, max = 256): v is string => typeof v === 'string' && v.length > 0 && v.length <= max;

export class SqliteRoomCodesRepo implements RoomCodesRepo {
    constructor(
        private readonly db: EdgeDb,
        private readonly sessions: SqliteSessionsRepo,
    ) {}

    insert(record: Omit<RoomCodeRecord, 'status' | 'deviceHash' | 'deviceLabel' | 'usedAtMs' | 'tokenJti' | 'revokedAtMs' | 'endedAtMs' | 'expiredAtMs'>): RoomCodeRecord {
        if (!record || !okText(record.id, 128) || !okText(record.nSesid, 64) || !okText(record.nCaseid, 64) || !okText(record.nUserid, 64) || !okText(record.codeHash, 512)) {
            throw invalid('room code record needs id, nSesid, nCaseid, nUserid and codeHash');
        }
        if (!Number.isFinite(record.issuedAtMs)) throw invalid('issuedAtMs must be epoch ms');
        return this.db.tx(() => {
            if (!this.sessions.exists(record.nSesid)) throw new EdgePortError('session_not_found', `session ${record.nSesid} is not on this box`);
            if (this.db.get('SELECT 1 AS x FROM room_codes WHERE codeHash = ?', record.codeHash)) throw invalid('duplicate code hash');
            if (this.db.get('SELECT 1 AS x FROM room_codes WHERE id = ?', record.id)) throw invalid('duplicate room code id');
            const unused = this.unusedFor(record.nSesid, record.nUserid);
            if (unused) {
                // The caller names the code this one replaces; any other unused code for the pair is a programming error.
                if (record.replacedId !== unused.id) throw invalid(`(session, person) already holds unused code ${unused.id}`);
                this.db.run(`UPDATE room_codes SET status = 'revoked', revokedAtMs = ? WHERE id = ? AND status = 'unused'`, Math.floor(record.issuedAtMs), unused.id);
            }
            this.db.run(
                `INSERT INTO room_codes (id, nSesid, nCaseid, nUserid, codeHash, status, issuedAtMs, issuedBy, replacedId)
                 VALUES (?, ?, ?, ?, ?, 'unused', ?, ?, ?)`,
                record.id,
                record.nSesid,
                record.nCaseid,
                record.nUserid,
                record.codeHash,
                Math.floor(record.issuedAtMs),
                JSON.stringify(actorOf(record.issuedBy)),
                record.replacedId ?? null,
            );
            return this.get(record.id)!;
        });
    }

    get(id: string): RoomCodeRecord | null {
        const row = this.db.get('SELECT * FROM room_codes WHERE id = ?', String(id));
        return row ? roomCodeOf(row) : null;
    }

    findByHash(codeHash: string): RoomCodeRecord | null {
        const row = this.db.get('SELECT * FROM room_codes WHERE codeHash = ?', String(codeHash));
        return row ? roomCodeOf(row) : null;
    }

    list(filter: { readonly nSesid?: string; readonly nCaseids?: readonly string[] } = {}): readonly RoomCodeRecord[] {
        const where: string[] = [];
        const params: string[] = [];
        if (filter.nSesid !== undefined) {
            where.push('nSesid = ?');
            params.push(String(filter.nSesid));
        }
        if (filter.nCaseids !== undefined) {
            if (!filter.nCaseids.length) return [];
            where.push(`nCaseid IN (${filter.nCaseids.map(() => '?').join(', ')})`);
            params.push(...filter.nCaseids.map(String));
        }
        const sql = `SELECT * FROM room_codes ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY issuedAtMs DESC, id DESC`;
        return this.db.all(sql, ...params).map(roomCodeOf);
    }

    unusedFor(nSesid: string, nUserid: string): RoomCodeRecord | null {
        const row = this.db.get(`SELECT * FROM room_codes WHERE nSesid = ? AND nUserid = ? AND status = 'unused'`, String(nSesid), String(nUserid));
        return row ? roomCodeOf(row) : null;
    }

    usedFor(nSesid: string, nUserid: string): RoomCodeRecord | null {
        const row = this.db.get(`SELECT * FROM room_codes WHERE nSesid = ? AND nUserid = ? AND status = 'used' ORDER BY usedAtMs DESC LIMIT 1`, String(nSesid), String(nUserid));
        return row ? roomCodeOf(row) : null;
    }

    bind(id: string, binding: { readonly deviceHash: string; readonly deviceLabel: string | null; readonly tokenJti: string; readonly atMs: number }): RoomCodeRecord | null {
        if (!binding || !okText(binding.deviceHash, 128) || !okText(binding.tokenJti, 128) || !Number.isFinite(binding.atMs)) {
            throw invalid('binding needs deviceHash, tokenJti and atMs');
        }
        return this.db.tx(() => {
            const current = this.get(id);
            if (!current) throw notFound(`room code ${id}`);
            if (current.status === 'unused') {
                const res = this.db.run(
                    `UPDATE room_codes SET status = 'used', deviceHash = ?, deviceLabel = ?, usedAtMs = ?, tokenJti = ? WHERE id = ? AND status = 'unused'`,
                    binding.deviceHash,
                    binding.deviceLabel ?? null,
                    Math.floor(binding.atMs),
                    binding.tokenJti,
                    String(id),
                );
                return res.changes === 1 ? this.get(id) : null;
            }
            if (current.status === 'used' && current.deviceHash === binding.deviceHash) {
                // Same-device re-entry: a new token replaces the old one; the first-use time stays.
                const res = this.db.run(`UPDATE room_codes SET tokenJti = ? WHERE id = ? AND status = 'used' AND deviceHash = ?`, binding.tokenJti, String(id), binding.deviceHash);
                return res.changes === 1 ? this.get(id) : null;
            }
            return null;
        });
    }

    finish(id: string, status: 'revoked' | 'ended' | 'expired', atMs: number): RoomCodeRecord | null {
        if (status !== 'revoked' && status !== 'ended' && status !== 'expired') throw invalid(`cannot finish a code as ${String(status)}`);
        const from = status === 'ended' ? 'used' : 'unused';
        const column = status === 'revoked' ? 'revokedAtMs' : status === 'ended' ? 'endedAtMs' : 'expiredAtMs';
        return this.db.tx(() => {
            if (!this.get(id)) throw notFound(`room code ${id}`);
            const res = this.db.run(`UPDATE room_codes SET status = ?, ${column} = ? WHERE id = ? AND status = ?`, status, Math.floor(atMs), String(id), from);
            return res.changes === 1 ? this.get(id) : null;
        });
    }

    expireSession(nSesid: string, atMs: number): number {
        return this.db.run(`UPDATE room_codes SET status = 'expired', expiredAtMs = ? WHERE nSesid = ? AND status = 'unused'`, Math.floor(atMs), String(nSesid)).changes;
    }
}

function operatorCodeOf(row: Row): OperatorCodeRecord {
    const minted = col.json<EdgePersonRef>(row, 'mintedBy', { nUserid: '', name: '' });
    return Object.freeze({
        day: col.str(row, 'day'),
        alg: 'scrypt' as const,
        salt: col.str(row, 'salt'),
        hash: col.str(row, 'hash'),
        scryptN: col.num(row, 'scryptN'),
        issuedAtMs: col.num(row, 'issuedAtMs'),
        mintedBy: Object.freeze({ nUserid: String(minted.nUserid ?? ''), name: String(minted.name ?? '') }),
        source: col.str(row, 'source') === 'relay' ? 'relay' : 'assignments',
        uses: col.num(row, 'uses'),
        lastUsedAtMs: col.numOrNull(row, 'lastUsedAtMs'),
    });
}

/** The operator-code table, also used by the assignments repo for a delivered hash. */
export class OperatorCodesStore implements OperatorCodesRepo {
    constructor(private readonly db: EdgeDb) {}

    get(day: string): OperatorCodeRecord | null {
        const row = this.db.get('SELECT * FROM operator_codes WHERE day = ?', String(day));
        return row ? operatorCodeOf(row) : null;
    }

    put(record: Omit<OperatorCodeRecord, 'uses' | 'lastUsedAtMs'>): { readonly replacedEarlier: boolean } {
        validateDelivery(record);
        if (record.source !== 'assignments' && record.source !== 'relay') throw invalid('source must be assignments or relay');
        return this.db.tx(() => {
            const existed = !!this.db.get('SELECT 1 AS x FROM operator_codes WHERE day = ?', record.day);
            this.db.run(
                `INSERT INTO operator_codes (day, alg, salt, hash, scryptN, issuedAtMs, mintedBy, source, uses, lastUsedAtMs)
                 VALUES (?, 'scrypt', ?, ?, ?, ?, ?, ?, 0, NULL)
                 ON CONFLICT(day) DO UPDATE SET alg = 'scrypt', salt = excluded.salt, hash = excluded.hash, scryptN = excluded.scryptN,
                     issuedAtMs = excluded.issuedAtMs, mintedBy = excluded.mintedBy, source = excluded.source, uses = 0, lastUsedAtMs = NULL`,
                record.day,
                record.salt,
                record.hash,
                record.scryptN,
                Math.floor(record.issuedAtMs),
                JSON.stringify({ nUserid: record.mintedBy.nUserid, name: record.mintedBy.name }),
                record.source,
            );
            return Object.freeze({ replacedEarlier: existed });
        });
    }

    /**
     * Store a delivered hash unless that exact hash is already stored for the day (a repeated pull must not reset the
     * day's use count). Returns true when the stored hash changed.
     */
    deliver(delivery: OperatorCodeDelivery, source: 'assignments' | 'relay'): boolean {
        validateDelivery(delivery);
        const current = this.get(delivery.day);
        if (current && current.salt === delivery.salt && current.hash === delivery.hash && current.scryptN === delivery.scryptN) return false;
        this.put({ ...delivery, source });
        return true;
    }

    recordUse(day: string, atMs: number): number {
        return this.db.tx(() => {
            const res = this.db.run('UPDATE operator_codes SET uses = uses + 1, lastUsedAtMs = ? WHERE day = ?', Math.floor(atMs), String(day));
            if (res.changes !== 1) throw notFound(`operator code for ${day}`);
            return col.num(this.db.get('SELECT uses FROM operator_codes WHERE day = ?', String(day))!, 'uses');
        });
    }

    purgeBefore(day: string): number {
        if (!isBoxDay(day)) throw invalid('day must be YYYY-MM-DD');
        return this.db.run('DELETE FROM operator_codes WHERE day < ?', day).changes;
    }
}

function validateDelivery(d: OperatorCodeDelivery): void {
    if (!d || !isBoxDay(d.day)) throw invalid('operator code day must be YYYY-MM-DD');
    if (d.alg !== 'scrypt') throw invalid('operator code alg must be scrypt');
    if (!okText(d.salt, 256) || !okText(d.hash, 256)) throw invalid('operator code needs salt and hash');
    if (!Number.isInteger(d.scryptN) || d.scryptN < 2) throw invalid('operator code scryptN must be an integer ≥ 2');
    if (!Number.isFinite(d.issuedAtMs)) throw invalid('operator code issuedAtMs must be epoch ms');
    if (!d.mintedBy || !okText(d.mintedBy.nUserid, 64)) throw invalid('operator code mintedBy is required');
}

const JTI_RE = /^[\x21-\x7e]+$/;
const isJti = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= EDGE_JTI_MAX_LENGTH && JTI_RE.test(v);
const isUserId = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 64 && JTI_RE.test(v);
const REASONS: ReadonlySet<JtiRevocationReason> = new Set<JtiRevocationReason>(['cloud', 'sign-out', 'room-access-ended', 'replaced']);

const SINCE_KEY = 'revocations.cloudSince';

export class SqliteRevocationsRepo implements RevocationsRepo {
    constructor(
        private readonly db: EdgeDb,
        private readonly kv: KvStore,
    ) {}

    applyCloud(rev: EdgeRevocations, receivedAtMs: number): { readonly newJtis: readonly string[]; readonly newUsers: readonly string[] } {
        if (!Number.isFinite(receivedAtMs) || receivedAtMs < 0) throw invalid('receivedAtMs must be epoch ms');
        const now = Math.floor(receivedAtMs);
        const jtis = Array.isArray(rev?.jtis) ? rev.jtis.filter(isJti) : [];
        const users = Array.isArray(rev?.users) ? rev.users.filter(isUserId) : [];
        return this.db.tx(() => {
            const newJtis: string[] = [];
            for (const jti of new Set(jtis)) {
                const row = this.db.get('SELECT untilMs FROM revoked_jtis WHERE jti = ?', jti);
                const until = now + EDGE_REVOCATION_RETAIN_MS;
                if (!row) {
                    newJtis.push(jti);
                    this.db.run('INSERT INTO revoked_jtis (jti, untilMs, reason, atMs) VALUES (?, ?, ?, ?)', jti, until, 'cloud', now);
                } else if (col.num(row, 'untilMs') < until) {
                    this.db.run('UPDATE revoked_jtis SET untilMs = ? WHERE jti = ?', until, jti);
                }
            }
            const newUsers: string[] = [];
            for (const user of new Set(users)) {
                const row = this.db.get('SELECT cutoffMs FROM revoked_users WHERE nUserid = ?', user);
                if (!row) newUsers.push(user);
                this.setCutoff(user, userRevocationCutoffMs(now, row ? col.num(row, 'cutoffMs') : null));
            }
            const since = Number(rev?.since);
            if (Number.isFinite(since) && since >= 0) this.kv.set(SINCE_KEY, String(Math.max(Math.floor(since), this.cloudSince())));
            return Object.freeze({ newJtis: Object.freeze(newJtis), newUsers: Object.freeze(newUsers) });
        });
    }

    cloudSince(): number {
        return this.kv.getNumber(SINCE_KEY);
    }

    revokeUser(nUserid: string, receivedAtMs: number): void {
        if (!isUserId(nUserid)) throw invalid('nUserid is required');
        if (!Number.isFinite(receivedAtMs) || receivedAtMs < 0) throw invalid('receivedAtMs must be epoch ms');
        this.db.tx(() => {
            const row = this.db.get('SELECT cutoffMs FROM revoked_users WHERE nUserid = ?', nUserid);
            this.setCutoff(nUserid, userRevocationCutoffMs(receivedAtMs, row ? col.num(row, 'cutoffMs') : null));
        });
    }

    userRevokedAtMs(nUserid: string): number | null {
        const row = this.db.get('SELECT cutoffMs FROM revoked_users WHERE nUserid = ?', String(nUserid));
        return row ? col.num(row, 'cutoffMs') : null;
    }

    denyJti(jti: string, untilMs: number, reason: JtiRevocationReason, atMs: number): void {
        if (!isJti(jti)) throw invalid('jti is required');
        if (!Number.isFinite(untilMs) || !Number.isFinite(atMs)) throw invalid('untilMs and atMs must be epoch ms');
        if (!REASONS.has(reason)) throw invalid(`unknown revocation reason ${String(reason)}`);
        this.db.run(
            `INSERT INTO revoked_jtis (jti, untilMs, reason, atMs) VALUES (?, ?, ?, ?)
             ON CONFLICT(jti) DO UPDATE SET untilMs = MAX(untilMs, excluded.untilMs)`,
            jti,
            Math.floor(untilMs),
            reason,
            Math.floor(atMs),
        );
    }

    isJtiDenied(jti: string, nowMs: number): boolean {
        const row = this.db.get('SELECT untilMs FROM revoked_jtis WHERE jti = ?', String(jti));
        return !!row && col.num(row, 'untilMs') > nowMs;
    }

    prune(nowMs: number): number {
        return this.db.tx(() => {
            const a = this.db.run('DELETE FROM revoked_jtis WHERE untilMs <= ?', Math.floor(nowMs)).changes;
            const b = this.db.run('DELETE FROM revoked_users WHERE keepUntilMs <= ?', Math.floor(nowMs)).changes;
            return a + b;
        });
    }

    private setCutoff(nUserid: string, cutoffMs: number): void {
        this.db.run(
            `INSERT INTO revoked_users (nUserid, cutoffMs, keepUntilMs) VALUES (?, ?, ?)
             ON CONFLICT(nUserid) DO UPDATE SET cutoffMs = MAX(cutoffMs, excluded.cutoffMs), keepUntilMs = MAX(keepUntilMs, excluded.keepUntilMs)`,
            nUserid,
            cutoffMs,
            cutoffMs + EDGE_REVOCATION_RETAIN_MS,
        );
    }
}
