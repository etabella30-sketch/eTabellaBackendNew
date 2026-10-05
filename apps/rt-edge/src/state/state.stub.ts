/**
 * SKELETON STUB of StatePort: reads return empty data, writes throw NotImplementedPortError. Replace with the
 * node:sqlite implementation (keep the STATE_PORT token; change `useClass` in state.module.ts).
 */
import { Inject, Injectable } from '@nestjs/common';

import type { Checkpoint, CheckpointInfo, CheckpointStore } from '@app/rt-ingest';

import {
    AssignmentsRepo,
    AuditRepo,
    BOX_CONFIG,
    BoxConfig,
    ConnectivityLogRepo,
    CountersRepo,
    HeldCapturesRepo,
    IdentityRepo,
    IncidentsRepo,
    JwksRepo,
    notImplemented,
    OperatorCodesRepo,
    RevocationsRepo,
    RoomCodesRepo,
    RosterRepo,
    SessionsRepo,
    StateHealth,
    StatePort,
    TransmitterSettingsRepo,
} from '../ports';

const PORT = 'StatePort';
const ni = (method: string): never => notImplemented(PORT, method);

@Injectable()
export class StateStub implements StatePort {
    constructor(@Inject(BOX_CONFIG) private readonly config: BoxConfig) {}

    readonly sessions: SessionsRepo = {
        get: () => null,
        list: () => [],
        forCase: () => [],
        upsertAssignment: () => ni('sessions.upsertAssignment'),
        requestEnd: () => ni('sessions.requestEnd'),
        setLocal: () => ni('sessions.setLocal'),
        purge: () => ni('sessions.purge'),
    };

    readonly assignments: AssignmentsRepo = {
        replaceAll: () => ni('assignments.replaceAll'),
        markSynced: () => ni('assignments.markSynced'),
        syncedAtMs: () => null,
        cases: () => [],
        case: () => null,
    };

    readonly roster: RosterRepo = {
        forCase: () => [],
        forSession: () => [],
        forUser: () => [],
        person: () => null,
        superAdmins: () => [],
        isSuperAdmin: () => false,
        counts: () => ({ people: 0, cases: 0 }),
    };

    readonly checkpoints: CheckpointStore = {
        save: async (_cp: Checkpoint): Promise<void> => ni('checkpoints.save'),
        list: async (): Promise<CheckpointInfo[]> => [],
        load: async () => null,
        latest: async () => null,
        prune: async () => 0,
        removeAll: async () => undefined,
        close: async () => undefined,
    };

    readonly revocations: RevocationsRepo = {
        applyCloud: () => ni('revocations.applyCloud'),
        cloudSince: () => 0,
        revokeUser: () => ni('revocations.revokeUser'),
        userRevokedAtMs: () => null,
        denyJti: () => ni('revocations.denyJti'),
        isJtiDenied: () => false,
        prune: () => 0,
    };

    readonly connectivityLog: ConnectivityLogRepo = {
        append: () => ni('connectivityLog.append'),
        retry: () => ni('connectivityLog.retry'),
        endRetry: () => null,
        page: (query, today) => ({
            filter: query.filter ?? 'all',
            day: query.day ?? today,
            rows: [],
            nextBefore: null,
            newest: null,
            days: [],
        }),
        tries: () => null,
        days: () => [],
        pruneBefore: () => 0,
        clearAll: () => ni('connectivityLog.clearAll'),
    };

    readonly incidents: IncidentsRepo = {
        record: () => ni('incidents.record'),
        list: () => [],
        count: () => ({ total: 0, warnings: 0 }),
    };

    readonly heldCaptures: HeldCapturesRepo = {
        upsert: () => ni('heldCaptures.upsert'),
        get: () => null,
        list: () => [],
        setOrphan: () => ni('heldCaptures.setOrphan'),
        markUploaded: () => ni('heldCaptures.markUploaded'),
        uploadState: () => null,
        setUploadState: () => ni('heldCaptures.setUploadState'),
    };

    readonly roomCodes: RoomCodesRepo = {
        insert: () => ni('roomCodes.insert'),
        get: () => null,
        findByHash: () => null,
        list: () => [],
        unusedFor: () => null,
        usedFor: () => null,
        bind: () => ni('roomCodes.bind'),
        finish: () => ni('roomCodes.finish'),
        expireSession: () => 0,
    };

    readonly operatorCodes: OperatorCodesRepo = {
        get: () => null,
        put: () => ni('operatorCodes.put'),
        recordUse: () => ni('operatorCodes.recordUse'),
        purgeBefore: () => 0,
    };

    readonly transmitter: TransmitterSettingsRepo = {
        get: () => ({ settings: null, applied: null }),
        save: () => ni('transmitter.save'),
        version: () => 0,
        bumpVersion: () => ni('transmitter.bumpVersion'),
        cloudReporter: () => null,
        cloudReporterPrevious: () => null,
        setCloudReporter: () => ni('transmitter.setCloudReporter'),
    };

    readonly counters: CountersRepo = {
        get: () => 0,
        raise: () => ni('counters.raise'),
    };

    readonly identity: IdentityRepo = {
        get: () => null,
        save: () => ni('identity.save'),
        patch: () => ni('identity.patch'),
        secret: () => ni('identity.secret'),
    };

    readonly jwks: JwksRepo = {
        get: () => null,
        save: () => ni('jwks.save'),
    };

    readonly audit: AuditRepo = {
        append: () => ni('audit.append'),
        list: () => [],
        pruneBefore: () => 0,
    };

    transaction<T>(fn: () => T): T {
        return fn();
    }

    health(): StateHealth {
        return { ok: false, file: this.config.paths.stateDb, sizeBytes: 0, walBytes: 0, schemaVersion: 0 };
    }

    async close(): Promise<void> {
        /* nothing opened */
    }
}
