import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { Test } from '@nestjs/testing';

import { FEED_PARSE_VERSION } from '@app/feed-parse';

import { BOX_CONFIG, BoxIdentityRecord, EDGE_SERVER_TIME, EdgePortError, isEdgePortError, parseBoxConfig, ServerTime, STATE_PORT, StatePort } from '../ports';
import { EdgeDb } from './db';
import { migrate, STATE_SCHEMA_VERSION, StateSchemaError } from './schema';
import { SqliteEdgeState } from './sqlite-state';
import { StateModule } from './state.module';
import { assignment, tempState, TempState } from './testing/fixtures';

const T0 = Date.UTC(2026, 9, 1, 8, 0, 0);
const HASH = 'a'.repeat(64);

function expectCode(fn: () => unknown, code: string): void {
    let caught: unknown;
    try {
        fn();
    } catch (err) {
        caught = err;
    }
    expect(isEdgePortError(caught)).toBe(true);
    expect((caught as EdgePortError).code).toBe(code);
}

const identity = (extra: Partial<BoxIdentityRecord> = {}): BoxIdentityRecord => ({
    nEdgeid: '3f2a8c1e-0000-4000-8000-000000000001',
    slug: 'k7q2m9x4',
    status: 'pending-confirm',
    keyFingerprint: 'AB:CD',
    publicKeySpki: 'MFkw',
    tpmKey: false,
    cloudOrigin: 'https://etabella.net',
    enrolledAtMs: T0,
    confirmedAtMs: null,
    lastCloudContactAtMs: null,
    linkFailure: null,
    ...extra,
});

describe('SqliteEdgeState (edge.sqlite)', () => {
    let t: TempState;

    beforeEach(() => {
        t = tempState();
        t.state.sessions.upsertAssignment(assignment('ses-a'), T0);
    });
    afterEach(async () => {
        await t.cleanup();
    });

    it('opens in WAL mode, migrated, and reports its health', () => {
        const h = t.state.health();
        expect(h).toMatchObject({ ok: true, file: t.file, schemaVersion: STATE_SCHEMA_VERSION });
        expect(h.sizeBytes).toBeGreaterThan(0);
        expect(fs.existsSync(`${t.file}-wal`)).toBe(true);
    });

    it('refuses a database written by a newer build, and migrating twice is a no-op', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-edge-schema-'));
        const file = path.join(dir, 'edge.sqlite');
        try {
            const db = EdgeDb.open(file);
            expect(migrate(db)).toBe(0);
            expect(migrate(db)).toBe(STATE_SCHEMA_VERSION);
            db.exec(`PRAGMA user_version = ${STATE_SCHEMA_VERSION + 1}`);
            db.close();
            expect(() => SqliteEdgeState.open({ file, timeZone: 'UTC' })).toThrow(StateSchemaError);
        } finally {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });

    it('transaction groups writes, rolls back on a throw, joins nested calls, and refuses an async fn', () => {
        expect(() =>
            t.state.transaction(() => {
                t.state.sessions.setLocal('ses-a', { localState: 'live' }, T0 + 1);
                t.state.transaction(() => t.state.counters.raise('lan-seq', 50));
                throw new Error('boom');
            }),
        ).toThrow('boom');
        expect(t.state.sessions.get('ses-a')!.localState).toBe('assigned');
        expect(t.state.counters.get('lan-seq')).toBe(0);
        expect(t.state.transaction(() => t.state.counters.raise('lan-seq', 7))).toBe(7);
        expect(() => t.state.transaction(() => Promise.resolve(1))).toThrow(/synchronous/);
    });

    describe('incidents', () => {
        it('records idempotently on (nSesid, seq, kind), lists oldest first, counts warnings', () => {
            t.state.incidents.record({ nSesid: 'ses-a', seq: 9, atMs: T0, kind: 'CAT_DISCONNECT', level: 'info', note: 'peer closed' });
            t.state.incidents.record({ nSesid: 'ses-a', seq: 9, atMs: T0 + 5, kind: 'CAT_DISCONNECT', level: 'info' });
            t.state.incidents.record({ nSesid: 'ses-a', seq: 4, atMs: T0, kind: 'ABORTED_WINDOW', level: 'warning', fromSeq: 4 });
            t.state.incidents.record({ nSesid: 'ses-a', seq: null, atMs: T0, kind: 'DEGRADED_DURABILITY', level: 'warning' });
            t.state.incidents.record({ nSesid: 'ses-a', seq: null, atMs: T0, kind: 'DEGRADED_DURABILITY', level: 'warning' });
            const list = t.state.incidents.list('ses-a');
            expect(list.map(i => `${i.seq}:${i.kind}`)).toEqual(['4:ABORTED_WINDOW', '9:CAT_DISCONNECT', 'null:DEGRADED_DURABILITY', 'null:DEGRADED_DURABILITY']);
            expect(list[1]).toEqual({ nSesid: 'ses-a', seq: 9, atMs: T0, kind: 'CAT_DISCONNECT', level: 'info', note: 'peer closed' });
            expect(t.state.incidents.count('ses-a')).toEqual({ total: 4, warnings: 3 });
            expectCode(() => t.state.incidents.record({ nSesid: 'ghost', seq: 1, atMs: T0, kind: 'LOCKOUT', level: 'info' }), 'session_not_found');
        });
    });

    describe('held captures', () => {
        const cap = { id: 'C-1-l-x', nSesid: 'ses-a', kind: 'C' as const, user: 'eclipse1', peer: '192.168.20.40', fromMs: T0, toMs: null, bytes: 0, sha256: null, file: '/c/x.ej', uploadedAtMs: null, nOrphanid: null };

        it('upserts, lists pending uploads (closed and not uploaded), marks uploaded', () => {
            t.state.heldCaptures.upsert(cap);
            expect(t.state.heldCaptures.list({ pendingUpload: true })).toEqual([]);
            t.state.heldCaptures.upsert({ ...cap, toMs: T0 + 10, bytes: 512, sha256: HASH });
            expect(t.state.heldCaptures.list({ pendingUpload: true }).map(c => c.id)).toEqual(['C-1-l-x']);
            expect(t.state.heldCaptures.list({ nSesid: 'ses-a' })).toHaveLength(1);
            const done = t.state.heldCaptures.markUploaded('C-1-l-x', 'orph-1', T0 + 20);
            expect(done).toMatchObject({ uploadedAtMs: T0 + 20, nOrphanid: 'orph-1', bytes: 512, sha256: HASH });
            expect(t.state.heldCaptures.list({ pendingUpload: true })).toEqual([]);
            expect(t.state.heldCaptures.list({ pendingUpload: false })).toHaveLength(1);
            expectCode(() => t.state.heldCaptures.markUploaded('nope', 'o', T0), 'not_found');
            expectCode(() => t.state.heldCaptures.upsert({ ...cap, nSesid: 'ghost' }), 'session_not_found');
        });

        it('keeps the orphan id of a reported capture that still waits, and the upload wait, across a reopen (review 2026-10-04)', () => {
            t.state.heldCaptures.upsert({ ...cap, toMs: T0 + 10, bytes: 512, sha256: HASH });
            expect(t.state.heldCaptures.setOrphan('C-1-l-x', 'orph-7')).toMatchObject({ nOrphanid: 'orph-7', uploadedAtMs: null });
            // Reported is not uploaded: it still waits.
            expect(t.state.heldCaptures.list({ pendingUpload: true }).map(c => c.id)).toEqual(['C-1-l-x']);
            expectCode(() => t.state.heldCaptures.setOrphan('nope', 'o'), 'not_found');
            expectCode(() => t.state.heldCaptures.setOrphan('C-1-l-x', ''), 'invalid_request');

            expect(t.state.heldCaptures.uploadState()).toBeNull();
            const kept = { notConfigured: 2, nextTryAtMs: T0 + 3_600_000, lastError: { atMs: T0, status: 503, code: 'NOT_CONFIGURED' } };
            t.state.heldCaptures.setUploadState(kept);
            const again = t.reopen();
            expect(again.heldCaptures.get('C-1-l-x')).toMatchObject({ nOrphanid: 'orph-7', uploadedAtMs: null });
            expect(again.heldCaptures.uploadState()).toEqual(kept);
            again.heldCaptures.setUploadState(null);
            expect(again.heldCaptures.uploadState()).toBeNull();
        });
    });

    describe('transmitter settings and the state version (DR13)', () => {
        it('is empty on first run, persists applied settings, and the version only grows (across reopen)', async () => {
            expect(t.state.transmitter.get()).toEqual({ settings: null, applied: null });
            expect(t.state.transmitter.version()).toBe(0);
            const by = { nUserid: 'u-admin', name: 'Priya Shah', via: 'online' as const, operatorName: null };
            t.state.transmitter.save({ mode: 'dial', protocol: 'bridge', host: ' 192.168.20.31 ', port: 8080, autoReconnect: true, receivingSesid: null }, { atMs: T0, by });
            expect(t.state.transmitter.bumpVersion()).toBe(1);
            expect(t.state.transmitter.bumpVersion()).toBe(2);
            expect(t.state.transmitter.get()).toEqual({ settings: { mode: 'dial', protocol: 'bridge', host: '192.168.20.31', port: 8080, autoReconnect: true, receivingSesid: null }, applied: { atMs: T0, by } });
            await t.state.close();
            const again = t.reopen();
            expect(again.transmitter.version()).toBe(2);
            expect(again.transmitter.bumpVersion()).toBe(3);
            expectCode(() => again.transmitter.save({ mode: 'radio' } as never, { atMs: T0, by }), 'invalid_request');
        });

        it('remembers the reporter connection last taken from the cloud beside the settings (same schema), across a reopen', async () => {
            const fingerprint = 'ses-a|192.168.1.20|1337|bridge';
            expect(t.state.transmitter.cloudReporter()).toBeNull();
            t.state.transmitter.setCloudReporter(fingerprint);
            expect(t.state.transmitter.cloudReporter()).toBe(fingerprint);
            // Neither the applied settings nor the state version move with it.
            expect(t.state.transmitter.get()).toEqual({ settings: null, applied: null });
            expect(t.state.transmitter.version()).toBe(0);
            expect(t.state.health().schemaVersion).toBe(STATE_SCHEMA_VERSION);
            await t.state.close();
            const again = t.reopen();
            expect(again.transmitter.cloudReporter()).toBe(fingerprint);
            again.transmitter.setCloudReporter(null);
            expect(again.transmitter.cloudReporter()).toBeNull();
            expectCode(() => again.transmitter.setCloudReporter(''), 'invalid_request');
            expectCode(() => again.transmitter.setCloudReporter(7 as never), 'invalid_request');
            // A rolled-back apply leaves the remembered value alone.
            again.transmitter.setCloudReporter(fingerprint);
            expect(() =>
                again.transaction(() => {
                    again.transmitter.setCloudReporter(null);
                    throw new Error('boom');
                }),
            ).toThrow('boom');
            expect(again.transmitter.cloudReporter()).toBe(fingerprint);
        });

        it('keeps the settings that were in force before a cloud value beside it, and forgets them with it', async () => {
            const fingerprint = 'ses-a|192.168.1.20|1337|bridge';
            const theirs = { mode: 'dial', protocol: 'caseview', host: '192.168.20.31', port: 8080, autoReconnect: true, receivingSesid: null } as const;
            expect(t.state.transmitter.cloudReporterPrevious()).toBeNull();
            t.state.transmitter.setCloudReporter(fingerprint, theirs);
            expect(t.state.transmitter.cloudReporterPrevious()).toEqual(theirs);
            // Another cloud value without `previous`: what was remembered stays.
            t.state.transmitter.setCloudReporter('ses-b|192.168.1.21|1337|bridge');
            expect(t.state.transmitter.cloudReporterPrevious()).toEqual(theirs);
            await t.state.close();
            const again = t.reopen();
            expect(again.transmitter.cloudReporter()).toBe('ses-b|192.168.1.21|1337|bridge');
            expect(again.transmitter.cloudReporterPrevious()).toEqual(theirs);
            // `previous: null` forgets them and keeps the fingerprint.
            again.transmitter.setCloudReporter(fingerprint, null);
            expect(again.transmitter.cloudReporter()).toBe(fingerprint);
            expect(again.transmitter.cloudReporterPrevious()).toBeNull();
            // Clearing the fingerprint forgets them too.
            again.transmitter.setCloudReporter(fingerprint, theirs);
            again.transmitter.setCloudReporter(null);
            expect(again.transmitter.cloudReporter()).toBeNull();
            expect(again.transmitter.cloudReporterPrevious()).toBeNull();
            // Both move together inside a transaction: a rolled-back clear leaves both.
            again.transmitter.setCloudReporter(fingerprint, theirs);
            expect(() =>
                again.transaction(() => {
                    again.transmitter.setCloudReporter(null);
                    throw new Error('boom');
                }),
            ).toThrow('boom');
            expect(again.transmitter.cloudReporter()).toBe(fingerprint);
            expect(again.transmitter.cloudReporterPrevious()).toEqual(theirs);
        });
    });

    describe('counters', () => {
        it('raise keeps the maximum and refuses bad values or names', () => {
            expect(t.state.counters.get('lan-seq')).toBe(0);
            expect(t.state.counters.raise('lan-seq', 100)).toBe(100);
            expect(t.state.counters.raise('lan-seq', 40)).toBe(100);
            expectCode(() => t.state.counters.raise('lan-seq', -1), 'invalid_request');
            expectCode(() => t.state.counters.raise('lan-seq', 1.5), 'invalid_request');
            expectCode(() => t.state.counters.get('other' as never), 'invalid_request');
        });
    });

    describe('the etabella.net time correction (user decision 2026-10-05)', () => {
        it('one row: empty first, replaced (it may go down, unlike a counter), cleared, kept across a reopen', async () => {
            expect(t.state.clockCorrection.get()).toBeNull();
            t.state.clockCorrection.save({ offsetMs: 300_412, targetMs: 300_412, checkedAtMs: T0, rttMs: 61 });
            t.state.clockCorrection.save({ offsetMs: -347, targetMs: -347, checkedAtMs: T0 + 60_000, rttMs: null });
            expect(t.state.clockCorrection.get()).toEqual({ offsetMs: -347, targetMs: -347, checkedAtMs: T0 + 60_000, rttMs: null });
            const raw = (t.state as unknown as { db: EdgeDb }).db;
            expect(raw.get('SELECT COUNT(*) AS n FROM clock_correction')).toEqual({ n: 1 });
            // A backward correction still being applied keeps the one in use AND its target (review 2026-10-05).
            t.state.clockCorrection.save({ offsetMs: -240_000, targetMs: 0, checkedAtMs: T0 + 60_000, rttMs: 40 });
            await t.state.close();
            const again = t.reopen();
            expect(again.clockCorrection.get()).toEqual({ offsetMs: -240_000, targetMs: 0, checkedAtMs: T0 + 60_000, rttMs: 40 });
            again.clockCorrection.save(null);
            expect(again.clockCorrection.get()).toBeNull();
            expectCode(() => again.clockCorrection.save({ offsetMs: Number.NaN, targetMs: 0, checkedAtMs: T0, rttMs: null }), 'invalid_request');
            expectCode(() => again.clockCorrection.save({ offsetMs: 1, targetMs: 1, checkedAtMs: 'soon' as never, rttMs: null }), 'invalid_request');
            expectCode(() => again.clockCorrection.save({ offsetMs: 1, targetMs: Number.NaN, checkedAtMs: T0, rttMs: null }), 'invalid_request');
        });

        it('a schema-2 database from before the target column gains it on open (guarded ALTER, idempotent; review 2026-10-05)', async () => {
            const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-edge-schema2a-'));
            const file = path.join(dir, 'edge.sqlite');
            try {
                // Schema 2 as first written (2026-10-05): no targetMs column; its row held the target as offsetMs.
                const early = SqliteEdgeState.open({ file, timeZone: 'UTC' });
                const db = (early as unknown as { db: EdgeDb }).db;
                db.exec('DROP TABLE clock_correction');
                db.exec('CREATE TABLE clock_correction (id INTEGER PRIMARY KEY CHECK (id = 1), offsetMs INTEGER NOT NULL, checkedAtMs INTEGER NOT NULL, rttMs INTEGER)');
                db.run('INSERT INTO clock_correction (id, offsetMs, checkedAtMs, rttMs) VALUES (1, ?, ?, ?)', 347, T0, 40);
                expect(early.health().schemaVersion).toBe(2);
                await early.close();

                const upgraded = SqliteEdgeState.open({ file, timeZone: 'UTC' });
                expect(upgraded.health().schemaVersion).toBe(2);
                expect(upgraded.clockCorrection.get()).toEqual({ offsetMs: 347, targetMs: 347, checkedAtMs: T0, rttMs: 40 });
                upgraded.clockCorrection.save({ offsetMs: -240_000, targetMs: 0, checkedAtMs: T0, rttMs: 40 });
                await upgraded.close();
                // Opening again alters nothing and keeps it.
                const again = SqliteEdgeState.open({ file, timeZone: 'UTC' });
                expect(again.clockCorrection.get()).toEqual({ offsetMs: -240_000, targetMs: 0, checkedAtMs: T0, rttMs: 40 });
                const cols = (again as unknown as { db: EdgeDb }).db.all<{ name: string }>('PRAGMA table_info(clock_correction)').map(c => c.name);
                expect(cols).toEqual(['id', 'offsetMs', 'checkedAtMs', 'rttMs', 'targetMs']);
                await again.close();
            } finally {
                fs.rmSync(dir, { recursive: true, force: true });
            }
        });

        it('a schema-1 box upgrades in place: its rows stay and the correction table comes in (schema 2)', async () => {
            const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-edge-schema1-'));
            const file = path.join(dir, 'edge.sqlite');
            try {
                // A box written by the build before: schema 1, no correction table.
                const old = SqliteEdgeState.open({ file, timeZone: 'UTC' });
                old.sessions.upsertAssignment(assignment('ses-old'), T0);
                const db = (old as unknown as { db: EdgeDb }).db;
                db.exec('DROP TABLE clock_correction');
                db.exec('PRAGMA user_version = 1');
                await old.close();

                const upgraded = SqliteEdgeState.open({ file, timeZone: 'UTC' });
                expect(STATE_SCHEMA_VERSION).toBe(2);
                expect(upgraded.health().schemaVersion).toBe(2);
                expect(upgraded.sessions.get('ses-old')).not.toBeNull();
                expect(upgraded.clockCorrection.get()).toBeNull();
                upgraded.clockCorrection.save({ offsetMs: 12, targetMs: 12, checkedAtMs: T0, rttMs: 3 });
                await upgraded.close();
                // Opening again migrates nothing and keeps it.
                const again = SqliteEdgeState.open({ file, timeZone: 'UTC' });
                expect(again.clockCorrection.get()).toEqual({ offsetMs: 12, targetMs: 12, checkedAtMs: T0, rttMs: 3 });
                await again.close();
            } finally {
                fs.rmSync(dir, { recursive: true, force: true });
            }
        });
    });

    describe('identity, secrets, JWKS', () => {
        it('null before enrolment; save/patch; patch without identity is box_not_configured', () => {
            expect(t.state.identity.get()).toBeNull();
            expectCode(() => t.state.identity.patch({ status: 'active' }), 'box_not_configured');
            t.state.identity.save(identity());
            const patched = t.state.identity.patch({ status: 'active', confirmedAtMs: T0 + 1, linkFailure: null, nEdgeid: 'other' } as never);
            expect(patched).toMatchObject({ status: 'active', confirmedAtMs: T0 + 1, nEdgeid: identity().nEdgeid });
            expect(t.state.identity.get()).toEqual(patched);
            expectCode(() => t.state.identity.patch({ status: 'zombie' as never }), 'invalid_request');
            expectCode(() => t.state.identity.save(identity({ slug: 'Not A Label' })), 'invalid_request');
        });

        it('creates each secret once (32 random bytes) and keeps it', async () => {
            const a = t.state.identity.secret('room-code-hmac');
            const b = t.state.identity.secret('box-token-signing');
            expect(a).toHaveLength(32);
            expect(a.equals(b)).toBe(false);
            expect(t.state.identity.secret('room-code-hmac').equals(a)).toBe(true);
            await t.state.close();
            expect(t.reopen().identity.secret('room-code-hmac').equals(a)).toBe(true);
            expectCode(() => t.state.identity.secret('nope' as never), 'invalid_request');
        });

        it('caches the cloud key set', () => {
            expect(t.state.jwks.get()).toBeNull();
            t.state.jwks.save([{ kty: 'EC', kid: 'k1' }, { kty: 'EC', kid: 'k2' }], T0);
            expect(t.state.jwks.get()).toEqual({ keys: [{ kty: 'EC', kid: 'k1' }, { kty: 'EC', kid: 'k2' }], receivedAtMs: T0 });
            expectCode(() => t.state.jwks.save('x' as never, T0), 'invalid_request');
        });
    });

    describe('audit', () => {
        it('appends, lists newest first with a since filter, validates, prunes', () => {
            const actor = { nUserid: 'u-admin', name: 'Priya Shah', via: 'online' as const, operatorName: null };
            t.state.audit.append({ atMs: T0, action: 'transmitter-apply', actor, outcome: 'ok', nSesid: null, target: null, ip: '10.0.0.5', deviceHash: null, data: { fields: ['host'] } });
            t.state.audit.append({ atMs: T0 + 1, action: 'room-code-redeem', actor: null, outcome: 'code_wrong', nSesid: 'ses-a', target: null, ip: '10.0.0.6', deviceHash: HASH, data: null });
            const all = t.state.audit.list({ limit: 10 });
            expect(all.map(e => e.action)).toEqual(['room-code-redeem', 'transmitter-apply']);
            expect(all[1]).toMatchObject({ actor, data: { fields: ['host'] }, ip: '10.0.0.5' });
            expect(typeof all[0].id).toBe('string');
            expect(t.state.audit.list({ limit: 10, sinceMs: T0 + 1 })).toHaveLength(1);
            expectCode(() => t.state.audit.list({ limit: 0 }), 'invalid_request');
            expectCode(() => t.state.audit.append({ ...all[0], action: 'hack' as never }), 'invalid_request');
            expect(t.state.audit.pruneBefore(T0 + 1)).toBe(1);
        });
    });

    describe('checkpoints (rt-ingest SqliteCheckpointStore on the shared connection)', () => {
        it('saves, loads, lists and prunes on the same file, synchronous FULL only around its writes', async () => {
            const cp = (rawSeq: number) => ({ nSesid: 'ses-a', rawSeq, rawHash: HASH, parserVer: FEED_PARSE_VERSION, createdAt: T0, lane: null, extra: { rev: rawSeq } });
            for (let i = 1; i <= 5; i++) await t.state.checkpoints.save(cp(i));
            expect((await t.state.checkpoints.list('ses-a')).map(c => c.rawSeq)).toEqual([5, 4, 3]);
            expect((await t.state.checkpoints.latest('ses-a'))!.extra).toEqual({ rev: 5 });
            const raw = (t.state as unknown as { db: EdgeDb }).db;
            expect(raw.get('PRAGMA synchronous')).toEqual({ synchronous: 1 });
        });
    });

    it('close is idempotent; reads after close fail', async () => {
        await t.state.close();
        await t.state.close();
        expect(t.state.isClosed).toBe(true);
        expect(() => t.state.sessions.list()).toThrow(/closed/);
    });

    it('StateModule provides one migrated StatePort from BOX_CONFIG', async () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-edge-state-module-'));
        const config = parseBoxConfig(
            { mode: 'dev', box: { name: 'Court 3', timeZone: 'Europe/London' }, cloud: { origin: 'https://cloud.invalid' }, http: { port: 0, tls: null }, paths: { dataDir: dir } },
            path.join(dir, 'rt-edge.json'),
        );
        class CoreForSpec {}
        const core = { module: CoreForSpec, global: true, providers: [{ provide: BOX_CONFIG, useValue: config }], exports: [BOX_CONFIG] };
        const ref = await Test.createTestingModule({ imports: [core, StateModule] }).compile();
        try {
            const state = ref.get<StatePort>(STATE_PORT, { strict: false });
            expect(state).toBeInstanceOf(SqliteEdgeState);
            expect(state.health()).toMatchObject({ ok: true, file: path.join(dir, 'edge.sqlite'), schemaVersion: STATE_SCHEMA_VERSION });
            await state.close();
        } finally {
            await ref.close();
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });

    it('StateModule restores the saved etabella.net time correction as the database opens, and saves new ones there', async () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-edge-state-time-'));
        const config = parseBoxConfig(
            { mode: 'dev', box: { name: 'Court 3', timeZone: 'Europe/London' }, cloud: { origin: 'https://cloud.invalid' }, http: { port: 0, tls: null }, paths: { dataDir: dir } },
            path.join(dir, 'rt-edge.json'),
        );
        const raw = T0 + 300_000; // the box PC is 5 min fast
        const compile = async (serverTime: ServerTime) => {
            class CoreForSpec {}
            const core = {
                module: CoreForSpec,
                global: true,
                providers: [
                    { provide: BOX_CONFIG, useValue: config },
                    { provide: EDGE_SERVER_TIME, useValue: serverTime },
                ],
                exports: [BOX_CONFIG, EDGE_SERVER_TIME],
            };
            const ref = await Test.createTestingModule({ imports: [core, StateModule] }).compile();
            return { ref, state: ref.get<StatePort>(STATE_PORT, { strict: false }) };
        };
        try {
            const first = new ServerTime(() => raw);
            const a = await compile(first);
            expect(first.status().source).toBe('box');
            first.observe({ offsetMs: 300_000, rttMs: 40, atMs: raw });
            expect(a.state.clockCorrection.get()).toEqual({ offsetMs: 300_000, targetMs: 300_000, checkedAtMs: raw, rttMs: 40 });
            await a.state.close();
            await a.ref.close();

            const second = new ServerTime(() => raw + 1_000);
            const b = await compile(second);
            expect(second.status()).toEqual({ source: 'saved', correctionMs: 300_000, targetMs: 300_000, checkedAtMs: raw });
            expect(second.now()).toBe(T0 + 1_000);
            await b.state.close();
            await b.ref.close();
        } finally {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });
});
