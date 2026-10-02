/**
 * `edge.sqlite` schema (spec §3.2 `state`, §4.10). Versioned with `PRAGMA user_version`; `migrate` runs every
 * pending step in one transaction before the StatePort is handed out (state.module.ts), so a resolved StatePort is
 * always migrated. A database written by a NEWER build is refused (pilot boxes are re-imaged, never downgraded in
 * place, D2).
 *
 * Nothing here stores a password, a code value, a token or transcript text: room codes and the operator code are
 * hashes, the Eclipse route keeps only scrypt salt/hash (as delivered), audit rows carry outcomes, never values.
 * Raw journals and held-capture bytes live in files (`journalDir`, `captureDir`); rt-ingest's checkpoint table
 * (`rt_ingest_checkpoints`) is created by `SqliteCheckpointStore` on the same connection.
 */
import { EdgeDb } from './db';

export const STATE_SCHEMA_VERSION = 1;

const V1 = `
CREATE TABLE IF NOT EXISTS kv (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS secrets (
    purpose TEXT PRIMARY KEY,
    value   BLOB NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
    nSesid           TEXT PRIMARY KEY,
    nCaseid          TEXT NOT NULL,
    assignment       TEXT NOT NULL,
    startAtMs        INTEGER,
    cloudOp          TEXT NOT NULL,
    localState       TEXT NOT NULL,
    listed           INTEGER NOT NULL,
    assignedAtMs     INTEGER NOT NULL,
    updatedAtMs      INTEGER NOT NULL,
    firstLineAtMs    INTEGER,
    endRequestedAtMs INTEGER,
    endedAtMs        INTEGER,
    sealedAtMs       INTEGER,
    sealState        TEXT,
    purgedAtMs       INTEGER
);
CREATE INDEX IF NOT EXISTS ix_sessions_case ON sessions (nCaseid);

CREATE TABLE IF NOT EXISTS cases (
    nCaseid      TEXT PRIMARY KEY,
    cCasename    TEXT NOT NULL,
    cCaseno      TEXT NOT NULL,
    assignedAtMs INTEGER
);

CREATE TABLE IF NOT EXISTS roster (
    nCaseid     TEXT NOT NULL,
    nSesid      TEXT,
    nUserid     TEXT NOT NULL,
    name        TEXT NOT NULL,
    email       TEXT,
    role        TEXT,
    isCaseAdmin INTEGER NOT NULL,
    active      INTEGER NOT NULL,
    source      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_roster_case ON roster (nCaseid);
CREATE INDEX IF NOT EXISTS ix_roster_user ON roster (nUserid);

CREATE TABLE IF NOT EXISTS super_admins (
    nUserid TEXT PRIMARY KEY,
    name    TEXT NOT NULL,
    email   TEXT
);

CREATE TABLE IF NOT EXISTS revoked_jtis (
    jti     TEXT PRIMARY KEY,
    untilMs INTEGER NOT NULL,
    reason  TEXT NOT NULL,
    atMs    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS revoked_users (
    nUserid     TEXT PRIMARY KEY,
    cutoffMs    INTEGER NOT NULL,
    keepUntilMs INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS conn_log (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    day            TEXT NOT NULL,
    atMs           INTEGER NOT NULL,
    updatedAtMs    INTEGER NOT NULL,
    changeSeq      INTEGER NOT NULL,
    event          TEXT NOT NULL,
    source         TEXT NOT NULL,
    code           TEXT NOT NULL,
    problem        INTEGER NOT NULL,
    nSesid         TEXT,
    sessionName    TEXT,
    peer           TEXT,
    actor          TEXT,
    data           TEXT NOT NULL,
    retryKey       TEXT,
    retrySinceMs   INTEGER,
    retryTries     INTEGER,
    retryLastError TEXT,
    retryActive    INTEGER
);
CREATE INDEX IF NOT EXISTS ix_conn_log_day ON conn_log (day, atMs, id);
CREATE INDEX IF NOT EXISTS ix_conn_log_change ON conn_log (day, changeSeq);
CREATE INDEX IF NOT EXISTS ix_conn_log_retry ON conn_log (retryKey, retryActive);

CREATE TABLE IF NOT EXISTS conn_log_tries (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    rowId INTEGER NOT NULL,
    atMs  INTEGER NOT NULL,
    error TEXT,
    peer  TEXT
);
CREATE INDEX IF NOT EXISTS ix_conn_log_tries_row ON conn_log_tries (rowId, atMs, id);

CREATE TABLE IF NOT EXISTS incidents (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    nSesid  TEXT NOT NULL,
    seq     INTEGER,
    kind    TEXT NOT NULL,
    level   TEXT NOT NULL,
    fromSeq INTEGER,
    toSeq   INTEGER,
    lines   INTEGER,
    note    TEXT,
    atMs    INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_incidents_seq ON incidents (nSesid, seq, kind) WHERE seq IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_incidents_ses ON incidents (nSesid, id);

CREATE TABLE IF NOT EXISTS held_captures (
    id           TEXT PRIMARY KEY,
    nSesid       TEXT NOT NULL,
    kind         TEXT NOT NULL,
    user         TEXT,
    peer         TEXT NOT NULL,
    fromMs       INTEGER NOT NULL,
    toMs         INTEGER,
    bytes        INTEGER NOT NULL,
    sha256       TEXT,
    file         TEXT NOT NULL,
    uploadedAtMs INTEGER,
    nOrphanid    TEXT
);
CREATE INDEX IF NOT EXISTS ix_held_captures_ses ON held_captures (nSesid, fromMs);

CREATE TABLE IF NOT EXISTS room_codes (
    id          TEXT PRIMARY KEY,
    nSesid      TEXT NOT NULL,
    nCaseid     TEXT NOT NULL,
    nUserid     TEXT NOT NULL,
    codeHash    TEXT NOT NULL UNIQUE,
    status      TEXT NOT NULL,
    issuedAtMs  INTEGER NOT NULL,
    issuedBy    TEXT NOT NULL,
    replacedId  TEXT,
    deviceHash  TEXT,
    deviceLabel TEXT,
    usedAtMs    INTEGER,
    tokenJti    TEXT,
    revokedAtMs INTEGER,
    endedAtMs   INTEGER,
    expiredAtMs INTEGER
);
CREATE INDEX IF NOT EXISTS ix_room_codes_ses ON room_codes (nSesid, nUserid, status);
CREATE UNIQUE INDEX IF NOT EXISTS ux_room_codes_unused ON room_codes (nSesid, nUserid) WHERE status = 'unused';

CREATE TABLE IF NOT EXISTS operator_codes (
    day          TEXT PRIMARY KEY,
    alg          TEXT NOT NULL,
    salt         TEXT NOT NULL,
    hash         TEXT NOT NULL,
    scryptN      INTEGER NOT NULL,
    issuedAtMs   INTEGER NOT NULL,
    mintedBy     TEXT NOT NULL,
    source       TEXT NOT NULL,
    uses         INTEGER NOT NULL,
    lastUsedAtMs INTEGER
);

CREATE TABLE IF NOT EXISTS audit (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    atMs       INTEGER NOT NULL,
    action     TEXT NOT NULL,
    actor      TEXT,
    outcome    TEXT NOT NULL,
    nSesid     TEXT,
    target     TEXT,
    ip         TEXT,
    deviceHash TEXT,
    data       TEXT
);
CREATE INDEX IF NOT EXISTS ix_audit_at ON audit (atMs, id);
`;

/** Migration steps; index i migrates from version i to i+1. Append only. */
const STEPS: ReadonlyArray<string> = [V1];

export class StateSchemaError extends Error {
    constructor(message: string) {
        super(`rt-edge state: ${message}`);
        this.name = 'StateSchemaError';
    }
}

/** The stored schema version (`PRAGMA user_version`). */
export function schemaVersion(db: EdgeDb): number {
    return Number(db.get<{ user_version: number }>('PRAGMA user_version')?.user_version ?? 0);
}

/** Bring the database to STATE_SCHEMA_VERSION; returns the version it started from. */
export function migrate(db: EdgeDb): number {
    const from = schemaVersion(db);
    if (from > STATE_SCHEMA_VERSION) {
        throw new StateSchemaError(`edge.sqlite has schema ${from}, newer than this build (${STATE_SCHEMA_VERSION}); re-image the box instead of downgrading`);
    }
    if (from === STATE_SCHEMA_VERSION) return from;
    db.tx(() => {
        for (let v = from; v < STATE_SCHEMA_VERSION; v++) db.exec(STEPS[v]);
        // PRAGMA cannot take a bound parameter; the value is a constant of this build.
        db.exec(`PRAGMA user_version = ${STATE_SCHEMA_VERSION}`);
    });
    return from;
}
