/**
 * StatePort over ONE node:sqlite connection (`BoxConfig.paths.stateDb`, `edge.sqlite`; spec §3.2 `state`, §4.10).
 *
 * `SqliteEdgeState.open` opens the file (creating its directory), sets `journal_mode=WAL`, `synchronous=NORMAL`,
 * `foreign_keys=ON`, `busy_timeout=5000`, runs the schema migrations and builds rt-ingest's SqliteCheckpointStore on
 * the same connection (it raises `synchronous` to FULL around its own writes). Every repository method is
 * synchronous (checkpoints and close excepted) and atomic on its own; `transaction(fn)` groups several (nested
 * calls join). State never publishes bus events.
 */
import * as fs from 'fs';

import { CheckpointStore, SqliteCheckpointStore } from '@app/rt-ingest';

import {
    AssignmentsRepo,
    AuditRepo,
    ClockCorrectionRepo,
    ConnectivityLogRepo,
    CountersRepo,
    HeldCapturesRepo,
    IdentityRepo,
    IncidentsRepo,
    JwksRepo,
    OperatorCodesRepo,
    RevocationsRepo,
    RoomCodesRepo,
    RosterRepo,
    SessionsRepo,
    StateHealth,
    StatePort,
    TransmitterSettingsRepo,
} from '../ports';
import { OperatorCodesStore, SqliteRevocationsRepo, SqliteRoomCodesRepo } from './access.repo';
import { col, EdgeDb } from './db';
import { KvStore } from './kv';
import { SqliteConnectivityLogRepo } from './log.repo';
import {
    SqliteAuditRepo,
    SqliteClockCorrectionRepo,
    SqliteCountersRepo,
    SqliteHeldCapturesRepo,
    SqliteIdentityRepo,
    SqliteIncidentsRepo,
    SqliteJwksRepo,
    SqliteTransmitterRepo,
} from './records.repo';
import { migrate, schemaVersion } from './schema';
import { SqliteAssignmentsRepo, SqliteRosterRepo, SqliteSessionsRepo } from './sessions.repo';

export interface SqliteEdgeStateOptions {
    /** `BoxConfig.paths.stateDb` (or ':memory:' in specs). */
    readonly file: string;
    /** `BoxConfig.box.timeZone`: the Connectivity Log's days. */
    readonly timeZone: string;
}

export class SqliteEdgeState implements StatePort {
    readonly sessions: SessionsRepo;
    readonly assignments: AssignmentsRepo;
    readonly roster: RosterRepo;
    readonly checkpoints: CheckpointStore;
    readonly revocations: RevocationsRepo;
    readonly connectivityLog: ConnectivityLogRepo;
    readonly incidents: IncidentsRepo;
    readonly heldCaptures: HeldCapturesRepo;
    readonly roomCodes: RoomCodesRepo;
    readonly operatorCodes: OperatorCodesRepo;
    readonly transmitter: TransmitterSettingsRepo;
    readonly counters: CountersRepo;
    readonly clockCorrection: ClockCorrectionRepo;
    readonly identity: IdentityRepo;
    readonly jwks: JwksRepo;
    readonly audit: AuditRepo;

    /** The concrete repositories (specs and the CLI use a few helpers beyond the port). */
    readonly impl: {
        readonly sessions: SqliteSessionsRepo;
        readonly connectivityLog: SqliteConnectivityLogRepo;
        readonly kv: KvStore;
    };

    private closing: Promise<void> | null = null;

    private constructor(
        private readonly db: EdgeDb,
        readonly file: string,
        timeZone: string,
    ) {
        const kv = new KvStore(db);
        const sessions = new SqliteSessionsRepo(db);
        const operatorCodes = new OperatorCodesStore(db);
        const log = new SqliteConnectivityLogRepo(db, kv, timeZone);
        this.sessions = sessions;
        this.assignments = new SqliteAssignmentsRepo(db, sessions, kv, operatorCodes);
        this.roster = new SqliteRosterRepo(db);
        this.checkpoints = new SqliteCheckpointStore({ db: db.raw });
        this.revocations = new SqliteRevocationsRepo(db, kv);
        this.connectivityLog = log;
        this.incidents = new SqliteIncidentsRepo(db, sessions);
        this.heldCaptures = new SqliteHeldCapturesRepo(db, sessions, kv);
        this.roomCodes = new SqliteRoomCodesRepo(db, sessions);
        this.operatorCodes = operatorCodes;
        this.transmitter = new SqliteTransmitterRepo(kv);
        this.counters = new SqliteCountersRepo(db, kv);
        this.clockCorrection = new SqliteClockCorrectionRepo(db);
        this.identity = new SqliteIdentityRepo(db, kv);
        this.jwks = new SqliteJwksRepo(kv);
        this.audit = new SqliteAuditRepo(db);
        this.impl = Object.freeze({ sessions, connectivityLog: log, kv });
    }

    /** Open, configure and migrate. Throws when the file cannot be opened or its schema is newer than this build. */
    static open(opts: SqliteEdgeStateOptions): SqliteEdgeState {
        const db = EdgeDb.open(opts.file);
        try {
            db.exec('PRAGMA journal_mode=WAL');
            db.exec('PRAGMA synchronous=NORMAL');
            db.exec('PRAGMA foreign_keys=ON');
            db.exec('PRAGMA busy_timeout=5000');
            migrate(db);
            return new SqliteEdgeState(db, opts.file, opts.timeZone);
        } catch (err) {
            db.close();
            throw err;
        }
    }

    transaction<T>(fn: () => T): T {
        return this.db.tx(fn);
    }

    health(): StateHealth {
        let ok = false;
        let version = 0;
        try {
            const rows = this.db.all('PRAGMA quick_check');
            ok = rows.length === 1 && col.str(rows[0], 'quick_check') === 'ok';
            version = schemaVersion(this.db);
        } catch {
            ok = false;
        }
        const size = (file: string): number => {
            try {
                return fs.statSync(file).size;
            } catch {
                return 0;
            }
        };
        return Object.freeze({
            ok,
            file: this.file,
            sizeBytes: this.file === ':memory:' ? 0 : size(this.file),
            walBytes: this.file === ':memory:' ? 0 : size(`${this.file}-wal`),
            schemaVersion: version,
        });
    }

    /** Close the database (after the kernel closed its checkpoint writes). Idempotent. */
    close(): Promise<void> {
        if (!this.closing) {
            this.closing = (async () => {
                await this.checkpoints.close().catch(() => undefined);
                if (!this.db.isClosed) {
                    try {
                        this.db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
                    } catch {
                        /* best effort */
                    }
                    this.db.close();
                }
            })();
        }
        return this.closing;
    }

    get isClosed(): boolean {
        return this.db.isClosed;
    }
}
