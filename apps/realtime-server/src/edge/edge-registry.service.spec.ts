/**
 * EdgeRegistryService against the in-memory fake DB (SP semantics of 2026-10-01_rt_edge_05..08) and a
 * temp route file: enrolment codes, enrol + fingerprint confirmation + revoke, quarantine, case scoping,
 * the assignment pull, hello extras, status / heartbeat / new-ASN quarantine, alerts and the route file.
 */
import { Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

import { formatFingerprint } from './edge-auth.middleware';
import {
    adminNodeView,
    EdgeLink,
    EdgeRegistryService,
    enrollCodeHash,
    formatEnrollCode,
    newEnrollCode,
    nodeFromRow,
    normalizeEnrollCode,
    reporterEndpoint,
    reporterSerialEndpoint,
    UnconfiguredCertificateIssuer,
    wallClock,
} from './edge-registry.service';
import { EDGE_NODE_STATUS_SQL } from './edge.types';
import { deviceKey, FakeConfig, FakeEdgeDb, FakeRedis, IDS, rmTemp, tempDir } from './edge-test-kit.spec';

const ADMIN = { userId: IDS.admin, isAdmin: true };
const USER = { userId: IDS.user, isAdmin: false };

describe('EdgeRegistryService', () => {
    let dir: string;
    let config: FakeConfig;
    let db: FakeEdgeDb;
    let redis: FakeRedis;
    let link: jest.Mocked<EdgeLink>;
    let posts: Array<[string, any]>;
    let emitted: Array<[string, string, any]>;
    let clock: { now: number };
    let asn: string | null;

    const make = (extra: { issuer?: any } = {}) => {
        const server = { to: (room: string) => ({ emit: (event: string, payload: any) => emitted.push([room, event, payload]) }) };
        const r = new EdgeRegistryService(db as any, redis as any, config as any, { server }, extra.issuer, async () => asn, async (url, body) => {
            posts.push([url, body]);
        }, { clock: () => clock.now });
        r.bindLink(link);
        return r;
    };

    beforeAll(() => Logger.overrideLogger(false));
    beforeEach(() => {
        dir = tempDir('reg');
        config = new FakeConfig({ ECLIPSE_SESSION_CONFIG: path.join(dir, 'routes.json') });
        db = new FakeEdgeDb();
        redis = new FakeRedis();
        posts = [];
        emitted = [];
        clock = { now: 1_800_000_000_000 };
        asn = null;
        link = {
            push: jest.fn(async (_i: string, _e: string, _p: unknown) => ({ delivered: true, reply: { ok: true } as unknown })),
            disconnect: jest.fn(),
            connection: jest.fn((_i: string) => null),
            setStatus: jest.fn(),
        } as any;
    });
    afterEach(() => rmTemp(dir));

    // -----------------------------------------------------------------------------------------------------------
    describe('enrolment codes', () => {
        it('are 128 random bits as 26 base32 characters, shown in groups of 5, hashed with sha256 after normalisation', () => {
            const code = newEnrollCode(Buffer.alloc(16, 0xff));
            expect(code).toBe('7'.repeat(25) + '4');
            expect(newEnrollCode()).toMatch(/^[A-Z2-7]{26}$/);
            const shown = formatEnrollCode(code);
            expect(shown).toBe('77777-77777-77777-77777-77777-4');
            expect(normalizeEnrollCode(shown.toLowerCase())).toBe(code);
            expect(normalizeEnrollCode(' 77777 77777-77777-77777-77777-4 ')).toBe(code);
            expect(normalizeEnrollCode('ABC')).toBeNull();
            expect(normalizeEnrollCode('1'.repeat(26))).toBeNull();
            expect(normalizeEnrollCode(42)).toBeNull();
            expect(enrollCodeHash(shown)).toBe(createHash('sha256').update(code).digest('hex'));
        });
    });

    // -----------------------------------------------------------------------------------------------------------
    describe('device lifecycle', () => {
        it('creates a box with a 15-minute code shown once (QR text), storing only its hash', async () => {
            const r = make();
            config.values.EDGE_CLOUD_ORIGIN = 'https://staging.etabella.net/';
            const res = await r.createNode(ADMIN, { cName: 'Court 3', cVenue: 'Rolls Building', nCatPort: 2600 });
            expect(res.node).toMatchObject({ cName: 'Court 3', cStatus: 'P' });
            expect(res.enroll.code).toMatch(/^([A-Z2-7]{5}-){5}[A-Z2-7]$/);
            expect(res.enroll.qrText).toBe(`etabella-edge enroll --cloud https://staging.etabella.net --code ${res.enroll.code}`);
            expect(res.enroll.bits).toBe(128);
            expect(Date.parse(res.enroll.dEnrollExp)).toBeGreaterThan(Date.now() + 14 * 60_000);
            const sp = db.callsOf('rtedge_create')[0];
            expect(sp).toMatchObject({ nMasterid: IDS.admin, cName: 'Court 3', cVenue: 'Rolls Building', nCatPort: '2600', cEnrollHash: enrollCodeHash(res.enroll.code) });
            expect(JSON.stringify(db.calls)).not.toContain(normalizeEnrollCode(res.enroll.code));
        });

        it('refuses a non-admin creator and a revoked box new codes', async () => {
            const r = make();
            await expect(r.createNode(USER, { cName: 'x' })).rejects.toMatchObject({ code: 'NOT_ALLOWED' });
            db.addNode({ nEdgeid: IDS.box, cStatus: 'X' });
            await expect(r.issueEnrollCode(ADMIN, IDS.box)).rejects.toMatchObject({ code: 'STATE' });
        });

        it('enrols with a valid code (key → C, fingerprint shown as on the console), then the admin confirms (→ A), then revokes (→ X)', async () => {
            const r = make({ issuer: { issue: jest.fn(), revoke: jest.fn(async () => undefined) } });
            const created = await r.createNode(ADMIN, { cName: 'Court 3' });
            const key = deviceKey();
            const enrolled = await r.enroll({ code: created.enroll.code.toLowerCase(), cPubKey: key.spkiB64, cVersion: '1.2.0', cParserVer: 'fp-1' });
            expect(enrolled).toMatchObject({ nEdgeid: created.node.nEdgeid, cStatus: 'C', cKeyFpr: key.fpr, keyFingerprint: formatFingerprint(key.fpr) });
            expect(link.disconnect).toHaveBeenCalledWith(created.node.nEdgeid, 'KEY_UNCONFIRMED', expect.any(String));
            await expect(r.enroll({ code: created.enroll.code, cPubKey: key.spkiB64 })).rejects.toMatchObject({ code: 'INVALID' });

            await expect(r.confirmKey(ADMIN, created.node.nEdgeid, 'ab'.repeat(32))).rejects.toMatchObject({ code: 'STATE', extra: { cCode: 'MISMATCH' } });
            expect(r.recentAlerts().find(a => a.kind === 'KEY_FINGERPRINT_MISMATCH')?.tier).toBe('P2');
            const confirmed = await r.confirmKey(ADMIN, created.node.nEdgeid, formatFingerprint(key.fpr));
            expect(confirmed).toMatchObject({ cStatus: 'A', keyFingerprint: formatFingerprint(key.fpr) });
            await expect(r.confirmKey(ADMIN, created.node.nEdgeid, key.fpr)).rejects.toMatchObject({ code: 'STATE' });

            const revoked = await r.revokeNode(ADMIN, created.node.nEdgeid, 'stolen');
            expect(revoked).toMatchObject({ cStatus: 'X', bAlready: false, unsealed: [], certRevoked: true });
            expect(link.setStatus).toHaveBeenCalledWith(created.node.nEdgeid, 'X');
            expect(link.disconnect).toHaveBeenCalledWith(created.node.nEdgeid, 'REVOKED', expect.any(String));
        });

        it('refuses a malformed code without touching the DB, an unknown or expired code, and a bad key', async () => {
            const r = make();
            await expect(r.enroll({ code: 'nope', cPubKey: 'x' })).rejects.toMatchObject({ code: 'INVALID', extra: { cCode: 'INVALID_CODE' } });
            expect(db.callsOf('rtedge_enroll')).toHaveLength(0);
            await expect(r.enroll({ code: newEnrollCode(), cPubKey: deviceKey().spkiB64 })).rejects.toMatchObject({ code: 'INVALID' });
            const created = await r.createNode(ADMIN, { cName: 'b' });
            await expect(r.enroll({ code: created.enroll.code, cPubKey: 'AAAA' })).rejects.toMatchObject({ code: 'INVALID' });
            db.nodes.get(created.node.nEdgeid).dEnrollExp = new Date(Date.now() - 1000);
            await expect(r.enroll({ code: created.enroll.code, cPubKey: deviceKey().spkiB64 })).rejects.toMatchObject({ code: 'INVALID' });
        });

        it('pages P1 on a re-enrol (key change) and needs a new confirmation', async () => {
            const r = make();
            const created = await r.createNode(ADMIN, { cName: 'b' });
            const k1 = deviceKey();
            await r.enroll({ code: created.enroll.code, cPubKey: k1.spkiB64 });
            await r.confirmKey(ADMIN, created.node.nEdgeid, k1.fpr);
            const code2 = await r.issueEnrollCode(ADMIN, created.node.nEdgeid);
            expect(code2).toMatchObject({ cStatus: 'A', bits: 128 });
            const k2 = deviceKey();
            const again = await r.enroll({ code: code2.code, cPubKey: k2.spkiB64, bTpmKey: true });
            expect(again.cStatus).toBe('C');
            expect(r.recentAlerts().find(a => a.kind === 'REENROLL')).toMatchObject({ tier: 'P1', nEdgeid: created.node.nEdgeid });
        });

        it('quarantines (system or admin), tells the connected box, and re-approves only by an admin', async () => {
            const r = make();
            db.addNode({ nEdgeid: IDS.box });
            const q = await r.quarantine(null, IDS.box, 'Q', 'new ASN');
            expect(q).toMatchObject({ cStatus: 'Q', bChanged: true });
            expect(link.setStatus).toHaveBeenCalledWith(IDS.box, 'Q');
            expect(link.push).toHaveBeenCalledWith(IDS.box, 'c.assign', { op: 'quarantine' });
            expect(r.recentAlerts().find(a => a.kind === 'BOX_QUARANTINED')?.tier).toBe('P1');
            expect(await r.quarantine(ADMIN, IDS.box, 'Q')).toMatchObject({ bChanged: false });
            await expect(r.quarantine(USER, IDS.box, 'A')).rejects.toMatchObject({ code: 'NOT_ALLOWED' });
            await expect(r.quarantine(null, IDS.box, 'A')).rejects.toMatchObject({ code: 'NOT_ALLOWED' });
            (link as any).drop = jest.fn();
            expect(await r.quarantine(ADMIN, IDS.box, 'A')).toMatchObject({ cStatus: 'A', bChanged: true });
            expect(link.setStatus).toHaveBeenLastCalledWith(IDS.box, 'A');
            // Re-approval has no c.assign op: the socket is dropped so the box re-hellos now (§5.3 'Q' → 'A').
            expect((link as any).drop).toHaveBeenCalledWith(IDS.box, 're-approved');
        });

        it('assigns and unassigns cases, refusing to unassign a case with an unsealed session', async () => {
            const r = make();
            db.addNode({ nEdgeid: IDS.box });
            await expect(r.setCase(ADMIN, IDS.box, IDS.caseB, 'I')).resolves.toMatchObject({ bAssigned: true });
            await expect(r.setCase(ADMIN, IDS.box, IDS.caseB, 'D')).resolves.toMatchObject({ bAssigned: false });
            db.assignCase(IDS.box, IDS.caseA);
            db.addSession({ nSesid: IDS.ses });
            await expect(r.setCase(ADMIN, IDS.box, IDS.caseA, 'D')).rejects.toMatchObject({ code: 'STATE', extra: { cCode: 'UNSEALED_SESSIONS' } });
            await expect(r.setCase(USER, IDS.box, IDS.caseA, 'I')).rejects.toMatchObject({ code: 'NOT_ALLOWED' });
        });

        it('reads boxes (get keeps cPubKey for the auth path; unknown → null) and lists them', async () => {
            const r = make();
            const key = deviceKey();
            db.addNode({ nEdgeid: IDS.box, cPubKey: key.spkiB64, cKeyFpr: key.fpr });
            db.assignCase(IDS.box, IDS.caseA);
            const got = await r.getNode(IDS.box.toUpperCase());
            expect(got.node).toMatchObject({ nEdgeid: IDS.box, cStatus: 'A', cPubKey: key.spkiB64 });
            expect(got.cases).toEqual([expect.objectContaining({ nCaseid: IDS.caseA, cCaseno: 'C-1' })]);
            expect(await r.getNode(IDS.box2)).toBeNull();
            expect(await r.getNode('bad')).toBeNull();
            expect(await r.listNodes({})).toEqual([expect.objectContaining({ nEdgeid: IDS.box, nCases: 1 })]);
        });

        it('shows admins no device key, and the fingerprint only once an admin confirmed it (G1)', () => {
            const fpr = 'a'.repeat(64);
            const view = (cStatus: string) => adminNodeView(nodeFromRow({ nEdgeid: IDS.box, cStatus, cPubKey: 'KEY', cKeyFpr: fpr }));
            for (const s of ['P', 'C']) {
                expect(view(s).cKeyFpr).toBeNull();
                expect(view(s)).not.toHaveProperty('cPubKey');
            }
            for (const s of ['A', 'Q', 'X']) {
                expect(view(s).cKeyFpr).toBe(fpr);
                expect(view(s)).not.toHaveProperty('cPubKey');
            }
        });

        it("leaves the presented key's fingerprint out of the audit trail until it is confirmed, failing closed (G1)", async () => {
            const r = make();
            const created = await r.createNode(ADMIN, { cName: 'b' });
            const id = created.node.nEdgeid;
            const key = deviceKey();
            await r.enroll({ code: created.enroll.code, cPubKey: key.spkiB64 });
            await r.confirmKey(ADMIN, id, 'ab'.repeat(32)).catch(() => undefined);
            let events = await r.events({ nEdgeid: id });
            expect(events.map((e: any) => e.cType)).toEqual(expect.arrayContaining(['enroll', 'confirm_key_mismatch']));
            expect(JSON.stringify(events)).not.toContain(key.fpr);
            await r.confirmKey(ADMIN, id, key.fpr);
            events = await r.events({ nEdgeid: id });
            expect(events.find((e: any) => e.cType === 'enroll').jData.cKeyFpr).toBe(key.fpr);
            // The box states cannot be read: every box's key fields are redacted.
            const real = db.rowQuery.bind(db);
            jest.spyOn(db, 'rowQuery').mockImplementation(async (sql: string, params?: any[]) => (sql === EDGE_NODE_STATUS_SQL ? { success: false, error: 'down' } : real(sql, params)));
            events = await r.events({ nEdgeid: id });
            expect(JSON.stringify(events)).not.toContain(key.fpr);
            expect(events.length).toBeGreaterThan(0);
        });

        it('C3: narrows the audit trail to one event type, so a type is not pushed out of the newest 200 by the others', async () => {
            const r = make();
            db.events.push(
                { nId: 900, cType: 'ready', nEdgeid: IDS.box, nSesid: IDS.ses, jData: {}, nByUser: null },
                { nId: 901, cType: 'online', nEdgeid: IDS.box, nSesid: null, jData: {}, nByUser: null },
                { nId: 902, cType: 'ready', nEdgeid: IDS.box, nSesid: IDS.ses2, jData: {}, nByUser: null },
            );
            expect((await r.events({ nEdgeid: IDS.box, cType: 'ready' })).map((e: any) => e.nId).sort()).toEqual([900, 902]);
            expect((await r.events({ nSesid: IDS.ses, cType: 'ready' })).map((e: any) => e.nId)).toEqual([900]);
            expect((await r.events({ nEdgeid: IDS.box })).map((e: any) => e.cType)).toEqual(expect.arrayContaining(['ready', 'online']));
            // The type is the query's third parameter ($3), null when absent: one bound value, never interpolated.
            const reads = db.sql.filter(([sql]) => sql.includes('"RtEdgeEvent"'));
            expect(reads.map(([, params]) => params[2])).toEqual(['ready', 'ready', null]);
        });

        it('C5: passes a feed-path change on to its listeners (the sync service), and a failing listener stops nothing', () => {
            const r = make();
            const heard: string[] = [];
            r.onFeedPathChanged(() => {
                throw new Error('boom');
            });
            r.onFeedPathChanged(id => heard.push(id));
            r.noteFeedPathChanged(IDS.ses.toUpperCase());
            r.noteFeedPathChanged('not-a-session');
            expect(heard).toEqual([IDS.ses]);
        });

        it('defaults certificate issuance to NOT_IMPLEMENTED (Phase 3)', async () => {
            const r = make();
            await expect(r.issueCertificate({ nEdgeid: IDS.box, cSlug: 's' } as any, 'csr')).rejects.toMatchObject({ code: 'NOT_IMPLEMENTED', status: 501 });
            await expect(new UnconfiguredCertificateIssuer().revoke({ nEdgeid: IDS.box, cSlug: 's' })).resolves.toBeUndefined();
        });
    });

    // -----------------------------------------------------------------------------------------------------------
    describe('assignment pull', () => {
        const route = (nSesid: string, extra: any = {}) => ({ nSesid, user: `u-${nSesid.slice(0, 4)}`, passwordSalt: 'c2FsdA==', passwordHash: 'aGFzaA==', passwordEnc: 'v1.secret', ...extra });

        beforeEach(() => {
            db.addNode({ nEdgeid: IDS.box });
            db.assignCase(IDS.box, IDS.caseA);
            db.team.push({ nCaseid: IDS.caseA, nUserid: IDS.operator, isCaseAdmin: true, cFname: 'Hana', cLname: 'Operator' });
            db.team.push({ nCaseid: IDS.caseA, nUserid: IDS.user, isCaseAdmin: false, cFname: 'Lee', cLname: 'Counsel' });
            db.emails.set(IDS.user, 'lee@example.com');
        });

        it('delivers upserts with route hash and team, ends, Part 2 pointers and the full snapshot (never passwordEnc)', async () => {
            db.addSession({ nSesid: IDS.ses, cProtocol: 'B' });
            db.addSession({ nSesid: IDS.ses2, cSyncState: 'S', nPartNo: 1 });
            db.addSession({ nSesid: IDS.ses3, cFeedSource: 'D', nEdgeid: null, bEverEdge: false, cSyncState: null, nPrevPartSesid: IDS.ses2, nPartNo: 2 });
            fs.writeFileSync(config.values.ECLIPSE_SESSION_CONFIG, JSON.stringify([route(IDS.ses, { scryptN: 32768 }), route(IDS.ses2)]));
            const pull = await make().assignments(IDS.box);
            expect(pull).toMatchObject({ ok: true, ends: [IDS.ses2], missingRoutes: [] });
            expect(pull.assigned).toEqual([
                expect.objectContaining({
                    nSesid: IDS.ses,
                    route: { user: `u-${IDS.ses.slice(0, 4)}`, salt: 'c2FsdA==', hash: 'aGFzaA==', scryptN: 32768 },
                    team: [{ nUserid: IDS.operator, isCaseAdmin: true }, { nUserid: IDS.user, isCaseAdmin: false }],
                    hearingOperator: IDS.operator,
                    case: { cCaseno: 'C-1', cName: 'Case One' },
                    dStartDt: '2026-10-01T10:00:00',
                    tz: 'Europe/London',
                    fmt: 1,
                }),
            ]);
            const p1 = pull.snapshot.sessions.find(s => s.nSesid === IDS.ses2);
            expect(p1).toMatchObject({ cloudOp: 'end', nPartNo: 1, next: { nSesid: IDS.ses3, nPartNo: 2, splitAtMs: null } });
            expect(pull.snapshot.sessions.find(s => s.nSesid === IDS.ses).protocol).toBe('B');
            expect(pull.snapshot.roster).toEqual(expect.arrayContaining([expect.objectContaining({ nUserid: IDS.user, name: 'Lee Counsel', email: 'lee@example.com', active: true, source: 'team' })]));
            expect(pull.snapshot.superAdmins).toEqual([expect.objectContaining({ nUserid: IDS.admin, name: 'Ada Admin' })]);
            expect(pull.snapshot.operatorCode).toBeNull();
            expect(JSON.stringify(pull)).not.toContain('v1.secret');
        });

        it('leaves out (and alerts on) a live session without a route, and answers not-ok for a quarantined box', async () => {
            db.addSession({ nSesid: IDS.ses });
            const r = make();
            const pull = await r.assignments(IDS.box);
            expect(pull.assigned).toEqual([]);
            expect(pull.missingRoutes).toEqual([IDS.ses]);
            expect(r.recentAlerts().find(a => a.kind === 'ROUTE_MISSING')?.tier).toBe('P2');
            db.nodes.get(IDS.box).cStatus = 'Q';
            expect(await r.assignments(IDS.box)).toMatchObject({ ok: false, code: 'QUARANTINED', status: 'Q', assigned: [], ends: [] });
        });

        it('raises nothing for an admin read of the same pull (G2: reads have no side effect)', async () => {
            db.addSession({ nSesid: IDS.ses });
            const r = make();
            const pull = await r.assignments(IDS.box, { alertMissingRoutes: false });
            expect(pull.missingRoutes).toEqual([IDS.ses]);
            expect(r.recentAlerts()).toEqual([]);
            await new Promise(res => setTimeout(res, 10));
            expect(db.eventsOf('alert')).toHaveLength(0);
        });

        it('treats an unreadable route file as no routes (logged), not as a failed pull', async () => {
            db.addSession({ nSesid: IDS.ses });
            fs.writeFileSync(config.values.ECLIPSE_SESSION_CONFIG, '{oops');
            const pull = await make().assignments(IDS.box);
            expect(pull.ok).toBe(true);
            expect(pull.missingRoutes).toEqual([IDS.ses]);
        });

        it('pushes c.assign upsert for one bound session (§4.2 step 5), with the snapshot extensions and never passwordEnc', async () => {
            db.addSession({ nSesid: IDS.ses });
            db.addSession({ nSesid: IDS.ses2 });
            fs.writeFileSync(config.values.ECLIPSE_SESSION_CONFIG, JSON.stringify([route(IDS.ses), route(IDS.ses2)]));
            const r = make();
            expect(await r.pushSessionUpsert(IDS.box, IDS.ses.toUpperCase())).toEqual({ delivered: true });
            expect(link.push).toHaveBeenCalledTimes(1);
            const [to, event, msg] = link.push.mock.calls[0] as [string, string, any];
            expect([to, event, msg.op]).toEqual([IDS.box, 'c.assign', 'upsert']);
            expect(msg.session).toMatchObject({
                nSesid: IDS.ses,
                route: { user: `u-${IDS.ses.slice(0, 4)}`, salt: 'c2FsdA==', hash: 'aGFzaA==', scryptN: 16384 },
                hearingOperator: { nUserid: IDS.operator, name: 'Hana Operator' },
                cloudOp: 'upsert',
                case: { cCaseno: 'C-1', cName: 'Case One' },
            });
            expect(msg.session.team).toEqual(expect.arrayContaining([expect.objectContaining({ nUserid: IDS.user, name: 'Lee Counsel', email: 'lee@example.com', isCaseAdmin: false })]));
            expect(JSON.stringify(msg)).not.toContain('v1.secret');
        });

        // The reporter connection typed in cloud admin (file 11: r3 cReporterIp / nReporterPort): the box dials it by itself.
        it('carries the reporter connection on each snapshot session and assigned session: an object when both are stored, else null', async () => {
            db.addSession({ nSesid: IDS.ses, cReporterIp: '192.168.1.20', nReporterPort: 2500 });
            db.addSession({ nSesid: IDS.ses2 });
            fs.writeFileSync(config.values.ECLIPSE_SESSION_CONFIG, JSON.stringify([route(IDS.ses), route(IDS.ses2)]));
            const pull = await make().assignments(IDS.box);
            const snap = (id: string) => pull.snapshot.sessions.find(s => s.nSesid === id);
            expect(snap(IDS.ses).reporter).toEqual({ host: '192.168.1.20', port: 2500 });
            expect(snap(IDS.ses2).reporter).toBeNull();
            expect(pull.assigned.find(s => s.nSesid === IDS.ses).reporter).toEqual({ host: '192.168.1.20', port: 2500 });
            expect(pull.assigned.find(s => s.nSesid === IDS.ses2).reporter).toBeNull();
            // A session the box must end still says where its reporter was (the box decides what to do with it).
            db.sessions.get(IDS.ses).cSyncState = 'S';
            const ended = await make().assignments(IDS.box);
            expect(ended.ends).toEqual([IDS.ses]);
            expect(ended.snapshot.sessions.find(s => s.nSesid === IDS.ses)).toMatchObject({ cloudOp: 'end', reporter: { host: '192.168.1.20', port: 2500 } });
        });

        it.each([
            ['only the address', { cReporterIp: '192.168.1.20', nReporterPort: null }],
            ['only the port', { cReporterIp: null, nReporterPort: 2500 }],
            ['an empty address', { cReporterIp: '', nReporterPort: 2500 }],
            ['a host name', { cReporterIp: 'reporter-laptop', nReporterPort: 2500 }],
            ['a leading zero', { cReporterIp: '192.168.01.20', nReporterPort: 2500 }],
            ['port 0', { cReporterIp: '192.168.1.20', nReporterPort: 0 }],
            ['port 65536', { cReporterIp: '192.168.1.20', nReporterPort: 65536 }],
            ['a fractional port', { cReporterIp: '192.168.1.20', nReporterPort: 2500.5 }],
        ])('sends reporter null for %s (never half a connection, never an address the box would not accept)', async (_what, stored) => {
            db.addSession({ nSesid: IDS.ses, ...(stored as any) });
            fs.writeFileSync(config.values.ECLIPSE_SESSION_CONFIG, JSON.stringify([route(IDS.ses)]));
            const pull = await make().assignments(IDS.box);
            expect(pull.snapshot.sessions[0].reporter).toBeNull();
            expect(pull.assigned[0].reporter).toBeNull();
        });

        it('reads the columns as the driver returns them (a padded address, a port as text) and sends null from a database before file 11', async () => {
            expect(reporterEndpoint(' 10.0.0.7 ', '2500')).toEqual({ host: '10.0.0.7', port: 2500 });
            expect(reporterEndpoint('10.0.0.7', 65535)).toEqual({ host: '10.0.0.7', port: 65535 });
            expect(reporterEndpoint(undefined, undefined)).toBeNull();
            expect(reporterEndpoint('10.0.0.7', '')).toBeNull();
            expect(reporterEndpoint('10.0.0.7', 'abc')).toBeNull();
            expect(reporterEndpoint('10.0.0.7', '0x50')).toBeNull();
            expect(reporterEndpoint('10.0.0.7', true)).toBeNull();
            expect(reporterEndpoint(167772167, 2500)).toBeNull();
            // r3 of the older et_rtedge_assignments has neither column.
            db.addSession({ nSesid: IDS.ses, cReporterIp: '192.168.1.20', nReporterPort: 2500 });
            fs.writeFileSync(config.values.ECLIPSE_SESSION_CONFIG, JSON.stringify([route(IDS.ses)]));
            const executeRef = db.executeRef.bind(db);
            jest.spyOn(db, 'executeRef').mockImplementation(async (name: string, params: any) => {
                const res: any = await executeRef(name, params);
                if (name === 'rtedge_assignments') res.data[2] = res.data[2].map(({ cReporterIp: _ip, nReporterPort: _port, ...row }: any) => row);
                return res;
            });
            const pull = await make().assignments(IDS.box);
            expect(pull.snapshot.sessions[0].reporter).toBeNull();
            expect(pull.assigned).toEqual([expect.objectContaining({ nSesid: IDS.ses, reporter: null })]);
        });

        it('sends a COM port of the box (file 12) as { serialPath, baudRate }; an invalid pair or a database before file 12 sends no COM port', async () => {
            expect(reporterSerialEndpoint(' com3 ', '9600')).toEqual({ serialPath: 'COM3', baudRate: 9600 });
            expect(reporterSerialEndpoint('/dev/ttyUSB0', 115200)).toEqual({ serialPath: '/dev/ttyUSB0', baudRate: 115200 });
            for (const [path, baud] of [['COM3', 9601], ['COM0', 9600], ['LPT1', 9600], ['COM3', null], [undefined, undefined], ['COM3', '96e2']] as const) {
                expect(reporterSerialEndpoint(path, baud)).toBeNull();
            }
            db.addSession({ nSesid: IDS.ses, cReporterSerial: 'COM5', nReporterBaud: 19200 } as any);
            fs.writeFileSync(config.values.ECLIPSE_SESSION_CONFIG, JSON.stringify([route(IDS.ses)]));
            const pull = await make().assignments(IDS.box);
            expect(pull.snapshot.sessions[0].reporter).toEqual({ serialPath: 'COM5', baudRate: 19200 });
            expect(pull.assigned).toEqual([expect.objectContaining({ nSesid: IDS.ses, reporter: { serialPath: 'COM5', baudRate: 19200 } })]);
        });

        // An older et_rtedge_assignments silently turns every reporter into null: the session is never dialed.
        it('warns once per process, naming migration file 11, when r3 lacks the reporter columns', async () => {
            db.addSession({ nSesid: IDS.ses, cReporterIp: '192.168.1.20', nReporterPort: 2500 });
            db.addSession({ nSesid: IDS.ses2 });
            fs.writeFileSync(config.values.ECLIPSE_SESSION_CONFIG, JSON.stringify([route(IDS.ses), route(IDS.ses2)]));
            const executeRef = db.executeRef.bind(db);
            jest.spyOn(db, 'executeRef').mockImplementation(async (name: string, params: any) => {
                const res: any = await executeRef(name, params);
                if (name === 'rtedge_assignments') res.data[2] = res.data[2].map(({ cReporterIp: _ip, nReporterPort: _port, ...row }: any) => row);
                return res;
            });
            const r = make();
            const warn = jest.spyOn((r as any).logger, 'warn');
            const missing = () => warn.mock.calls.map(c => String(c[0])).filter(line => line.includes('cReporterIp'));
            // Two sessions in one pull, then more pulls (the box's hello, a bind push, an admin read): one line.
            const pull = await r.assignments(IDS.box);
            expect(pull.snapshot.sessions.map(s => s.reporter)).toEqual([null, null]);
            await r.assignments(IDS.box);
            await r.pushSessionUpsert(IDS.box, IDS.ses);
            await r.assignments(IDS.box, { alertMissingRoutes: false });
            expect(missing()).toHaveLength(1);
            expect(missing()[0]).toContain('et_rtedge_assignments');
            expect(missing()[0]).toContain('2026-10-02_rt_edge_11_reporter_connection.sql');
        });

        it('does not warn when the reporter columns are present: null (no address typed), a stored address, or no session at all', async () => {
            const r = make();
            const warn = jest.spyOn((r as any).logger, 'warn');
            await r.assignments(IDS.box);
            db.addSession({ nSesid: IDS.ses });
            db.addSession({ nSesid: IDS.ses2, cReporterIp: '192.168.1.20', nReporterPort: 2500 });
            fs.writeFileSync(config.values.ECLIPSE_SESSION_CONFIG, JSON.stringify([route(IDS.ses), route(IDS.ses2)]));
            const executeRef = jest.spyOn(db, 'executeRef');
            const pull = await r.assignments(IDS.box);
            // What the function answered: the key is there, with null for the session nobody typed an address for.
            const call = executeRef.mock.calls.findIndex(c => c[0] === 'rtedge_assignments');
            const r3 = ((await executeRef.mock.results[call].value) as any).data[2];
            expect(r3.find((row: any) => row.nSesid === IDS.ses)).toMatchObject({ cReporterIp: null, nReporterPort: null });
            expect(pull.snapshot.sessions.map(s => s.reporter)).toEqual(expect.arrayContaining([null, { host: '192.168.1.20', port: 2500 }]));
            expect(warn.mock.calls.map(c => String(c[0])).filter(line => line.includes('cReporterIp'))).toEqual([]);
        });

        it('the pushed c.assign upsert carries the reporter connection (object, or null when none was typed)', async () => {
            db.addSession({ nSesid: IDS.ses, cReporterIp: '192.168.1.20', nReporterPort: 2500 });
            db.addSession({ nSesid: IDS.ses2 });
            fs.writeFileSync(config.values.ECLIPSE_SESSION_CONFIG, JSON.stringify([route(IDS.ses), route(IDS.ses2)]));
            const r = make();
            expect(await r.pushSessionUpsert(IDS.box, IDS.ses)).toEqual({ delivered: true });
            expect(await r.pushSessionUpsert(IDS.box, IDS.ses2)).toEqual({ delivered: true });
            const [first, second] = link.push.mock.calls.map(c => c[2] as any);
            expect(first).toMatchObject({ op: 'upsert', session: { nSesid: IDS.ses, cloudOp: 'upsert', reporter: { host: '192.168.1.20', port: 2500 } } });
            expect(second.session).toMatchObject({ nSesid: IDS.ses2, reporter: null });
            expect(Object.keys(second.session)).toContain('reporter');
        });

        it('says why nothing was pushed: offline box, box refusal, missing route, not assigned, inactive box', async () => {
            db.addSession({ nSesid: IDS.ses });
            const r = make();
            expect(await r.pushSessionUpsert(IDS.box, IDS.ses)).toEqual({ delivered: false, reason: 'ROUTE_MISSING' });
            fs.writeFileSync(config.values.ECLIPSE_SESSION_CONFIG, JSON.stringify([route(IDS.ses)]));
            expect(await r.pushSessionUpsert(IDS.box, IDS.ses2)).toEqual({ delivered: false, reason: 'NOT_ASSIGNED' });
            link.push.mockResolvedValueOnce({ delivered: false, error: 'not connected' });
            expect(await r.pushSessionUpsert(IDS.box, IDS.ses)).toEqual({ delivered: false, reason: 'not connected' });
            link.push.mockResolvedValueOnce({ delivered: true, reply: { ok: false } });
            expect(await r.pushSessionUpsert(IDS.box, IDS.ses)).toEqual({ delivered: false, reason: 'BOX_REFUSED' });
            db.nodes.get(IDS.box).cStatus = 'Q';
            expect(await r.pushSessionUpsert(IDS.box, IDS.ses)).toEqual({ delivered: false, reason: 'QUARANTINED' });
            expect(await r.pushSessionUpsert('nope', IDS.ses)).toEqual({ delivered: false, reason: 'INVALID' });
        });
    });

    // -----------------------------------------------------------------------------------------------------------
    describe('hello extras', () => {
        it('serves only public EC P-256 edge-token keys from EDGE_TOKEN_JWKS', () => {
            config.values.EDGE_TOKEN_JWKS = JSON.stringify({
                keys: [
                    { kty: 'EC', crv: 'P-256', x: 'xx', y: 'yy', kid: 'k1', d: 'PRIVATE' },
                    { kty: 'RSA', n: 'n', e: 'AQAB', kid: 'r' },
                    { kty: 'EC', crv: 'P-384', x: 'x', y: 'y', kid: 'k3' },
                ],
            });
            expect(make().edgeTokenKeys()).toEqual([{ kty: 'EC', crv: 'P-256', x: 'xx', y: 'yy', kid: 'k1', alg: 'ES256', use: 'sig' }]);
            config.values.EDGE_TOKEN_JWKS = '[not json';
            expect(make().edgeTokenKeys()).toEqual([]);
            delete config.values.EDGE_TOKEN_JWKS;
            expect(make().edgeTokenKeys()).toEqual([]);
        });

        it("lists authapi's revoked jtis from Redis", async () => {
            await redis.setValue('edge:revoked:jti-1', '1');
            await redis.setValue('edge:revoked:bad jti', '1');
            await redis.setValue('edge:revoked', 'index');
            expect(await make().revocations()).toEqual({ users: [], jtis: ['jti-1'], since: clock.now });
        });
    });

    // -----------------------------------------------------------------------------------------------------------
    describe('status, heartbeat, new-ASN rule', () => {
        beforeEach(() => db.addNode({ nEdgeid: IDS.box, cLastAsn: 'AS100' }));

        it('stores e.status in Redis (30 s), raises P1 for degraded durability and held peers, P2 for lag, and throttles the heartbeat', async () => {
            const r = make();
            const status = { sessions: [{ nSesid: IDS.ses, durability: 'degraded' as const, lagSec: 45, heldPeers: ['10.0.0.9'] }], device: { sw: '1.0.0', parserVer: 'fp-1' } };
            await r.recordStatus(IDS.box, status, '198.51.100.7');
            expect(redis.sets.find(s => s[0] === `edge:status:${IDS.box}`)?.[2]).toBe(30);
            const kinds = r.recentAlerts().map(a => `${a.kind}:${a.tier}`);
            expect(kinds).toEqual(expect.arrayContaining(['DEGRADED_DURABILITY:P1', 'LAG:P2', 'HELD_CAT_CONNECTION:P1']));
            expect(db.callsOf('rtedge_heartbeat')[0]).toMatchObject({ nEdgeid: IDS.box, cLastEgress: '198.51.100.7', cVersion: '1.0.0', cParserVer: 'fp-1', jHealth: { sw: '1.0.0', parserVer: 'fp-1' } });
            clock.now += 5_000;
            await r.recordStatus(IDS.box, { sessions: [], device: {} }, '198.51.100.7');
            expect(db.callsOf('rtedge_heartbeat')).toHaveLength(1);
            clock.now += 56_000;
            await r.recordStatus(IDS.box, { sessions: [], device: { dCertExp: '2026-12-30T00:00:00.000Z' } }, '198.51.100.7');
            expect(db.callsOf('rtedge_heartbeat')).toHaveLength(2);
            // The box's certificate expiry reaches RtEdgeNode.dCertExp (Venue boxes, §12 "cert < 14 days").
            expect(db.callsOf('rtedge_heartbeat')[1]).toMatchObject({ dCertExp: '2026-12-30T00:00:00.000Z' });
            clock.now += 56_000;
            await r.recordStatus(IDS.box, { sessions: [], device: { dCertExp: 'soon' } }, '198.51.100.7');
            expect(db.callsOf('rtedge_heartbeat')[2].dCertExp).toBeUndefined();
            expect(await r.liveStatus(IDS.box)).toMatchObject({ ip: '198.51.100.7' });
            expect(r.sessionStatus(IDS.box, IDS.ses)).toMatchObject({ reported: false });
        });

        it('moves the heartbeat timer only when the SP wrote: a throttled heartbeat is retried with the next e.status, a failed one after 15 s (review #16)', async () => {
            const r = make();
            const status = () => r.recordStatus(IDS.box, { sessions: [], device: {} }, '198.51.100.7');
            const calls = () => db.callsOf('rtedge_heartbeat').length;
            await status();
            expect(calls()).toBe(1);
            // 55 s later the SP still throttles (its last write was a little later than this process's clock says).
            clock.now += 55_000;
            db.answerOnce.push({ name: 'rtedge_heartbeat', row: { msg: 1, value: 'Throttled', bWritten: false, nEdgeid: IDS.box, cStatus: 'A' } });
            await status();
            expect(calls()).toBe(2);
            // The next e.status (5 s) writes: dLastSeen never ages to ~110 s against the 2 min online window.
            clock.now += 5_000;
            await status();
            expect(calls()).toBe(3);
            clock.now += 5_000;
            await status();
            expect(calls()).toBe(3);
            // A failed heartbeat is retried after heartbeatRetryMs (15 s), not after another 55 s.
            clock.now += 55_000;
            db.fail.set('rtedge_heartbeat', 'pg down');
            await status();
            expect(calls()).toBe(4);
            db.fail.delete('rtedge_heartbeat');
            clock.now += 10_000;
            await status();
            expect(calls()).toBe(4);
            clock.now += 5_000;
            await status();
            expect(calls()).toBe(5);
        });

        it('never runs two heartbeats of one box at once from e.status (a slow database)', async () => {
            const r = make();
            let release!: () => void;
            const real = db.executeRef.bind(db);
            jest.spyOn(db, 'executeRef').mockImplementation(async (name: string, params: any) => {
                if (name === 'rtedge_heartbeat') await new Promise<void>(res => (release = res));
                return real(name, params);
            });
            const first = r.recordStatus(IDS.box, { sessions: [], device: {} }, null);
            await new Promise(res => setTimeout(res, 5));
            clock.now += 60_000;
            await r.recordStatus(IDS.box, { sessions: [], device: {} }, null);
            release();
            await first;
            expect(db.callsOf('rtedge_heartbeat')).toHaveLength(1);
        });

        it("forwards the box's own P1/P2 alerts from e.status into the cloud pipeline (pager, admins); info and junk are not", async () => {
            config.values.EDGE_ALERT_WEBHOOK = 'https://pager.example/hook';
            const r = make();
            const alerts = [
                { source: 'ingest', tier: 'P1', critical: true, kind: 'HELD_PEER', message: 'second peer\n127.0.0.2 held', atMs: 5, nSesid: IDS.ses.toUpperCase() },
                { source: 'ops', tier: 'P2', critical: false, kind: 'disk low!', message: 'disk below 5 GB', atMs: 6, nSesid: null },
                { source: 'ops', tier: 'info', kind: 'CAT_SILENT', message: 'quiet' },
                'junk',
            ];
            await r.recordStatus(IDS.box, { sessions: [], device: {}, alerts } as any, null);
            const got = r.recentAlerts().map(a => ({ kind: a.kind, tier: a.tier, critical: a.critical, nSesid: a.nSesid, message: a.message, data: a.data }));
            expect(got).toEqual([
                { kind: 'HELD_PEER', tier: 'P1', critical: true, nSesid: IDS.ses, message: `Box ${IDS.box}: second peer 127.0.0.2 held`, data: { reportedBy: 'box', source: 'ingest', atMs: 5 } },
                { kind: 'DISK_LOW_', tier: 'P2', critical: false, nSesid: null, message: `Box ${IDS.box}: disk below 5 GB`, data: { reportedBy: 'box', source: 'ops', atMs: 6 } },
            ]);
            await new Promise(res => setImmediate(res));
            expect(posts.map(p => p[1].kind)).toEqual(['HELD_PEER', 'DISK_LOW_']);
            // Sent once by the box; a repeat within the dedup window is not paged again.
            await r.recordStatus(IDS.box, { sessions: [], device: {}, alerts: alerts.slice(0, 1) } as any, null);
            expect(r.recentAlerts()).toHaveLength(2);
        });

        it('quarantines a box seen on a new egress ASN outside a hearing (P1); only alerts during one (P2)', async () => {
            asn = 'AS200';
            const r = make();
            await r.heartbeat(IDS.box, { ip: '203.0.113.1', liveSessions: 1 });
            expect(db.nodes.get(IDS.box).cStatus).toBe('A');
            expect(r.recentAlerts().find(a => a.kind === 'NEW_EGRESS_ASN')?.tier).toBe('P2');
            db.nodes.get(IDS.box).cLastAsn = 'AS100';
            await r.heartbeat(IDS.box, { ip: '203.0.113.1', liveSessions: 0 });
            expect(db.nodes.get(IDS.box).cStatus).toBe('Q');
            expect(r.recentAlerts().find(a => a.kind === 'BOX_QUARANTINED')?.tier).toBe('P1');
        });

        it('falls back to Redis for the live status and returns null when nothing is known', async () => {
            const r = make();
            expect(await r.liveStatus(IDS.box2)).toBeNull();
            await redis.setValue(`edge:status:${IDS.box2}`, JSON.stringify({ status: { sessions: [] }, receivedAtMs: 1, ip: null }));
            expect(await r.liveStatus(IDS.box2)).toMatchObject({ receivedAtMs: 1 });
        });
    });

    // -----------------------------------------------------------------------------------------------------------
    describe('alerts', () => {
        it('logs, audits (RtEdgeEvent alert), fans out to admin U rooms and posts P1/P2 to the pager; deduplicates; info is chip-only', async () => {
            config.values.EDGE_ALERT_WEBHOOK = 'https://pager.example/hook';
            const r = make();
            r.alert({ kind: 'FORK', tier: 'P1', critical: true, nEdgeid: IDS.box, nSesid: IDS.ses, message: 'forked', data: { nHearingOpid: IDS.operator } });
            r.alert({ kind: 'FORK', tier: 'P1', nEdgeid: IDS.box, nSesid: IDS.ses, message: 'again' });
            r.alert({ kind: 'CAT_SILENT', tier: 'info', nEdgeid: IDS.box, message: 'quiet' });
            await new Promise(res => setTimeout(res, 20));
            expect(db.eventsOf('alert')).toHaveLength(1);
            expect(db.eventsOf('alert')[0].jData).toMatchObject({ kind: 'FORK', tier: 'P1', critical: true });
            expect(posts).toHaveLength(1);
            expect(posts[0]).toEqual(['https://pager.example/hook', expect.objectContaining({ source: 'etabella-rt-edge', kind: 'FORK', tier: 'P1' })]);
            expect(emitted.map(e => e[0]).sort()).toEqual([`U${IDS.admin}`, `U${IDS.operator}`].sort());
            expect(r.recentAlerts().map(a => a.kind)).toEqual(['FORK', 'CAT_SILENT']);
            clock.now += 61_000;
            r.alert({ kind: 'FORK', tier: 'P1', nEdgeid: IDS.box, nSesid: IDS.ses, message: 'later' });
            expect(r.recentAlerts().filter(a => a.kind === 'FORK')).toHaveLength(2);
        });

        it('never throws, even when every sink fails', async () => {
            const r = make();
            db.fail.set('rtedge_event_insert', 'down');
            db.fail.set('rowQuery', 'down');
            expect(() => r.alert({ kind: 'X', tier: 'P2', message: 'm' })).not.toThrow();
            await new Promise(res => setTimeout(res, 10));
        });
    });

    // -----------------------------------------------------------------------------------------------------------
    describe('route file', () => {
        it('reads [] when absent, refuses an unreadable file, and writes atomically with serialized updates', async () => {
            const r = make();
            expect(await r.readRoutes()).toEqual([]);
            await Promise.all([
                r.updateRoutes(routes => [...routes, { nSesid: IDS.ses, user: 'a' }]),
                r.updateRoutes(routes => [...routes, { nSesid: IDS.ses2, user: 'b' }]),
            ]);
            expect((await r.readRoutes()).map(x => x.nSesid)).toEqual([IDS.ses, IDS.ses2]);
            expect(await r.routeFor(IDS.ses2.toUpperCase())).toMatchObject({ user: 'b' });
            await r.removeRoute(IDS.ses);
            expect((await r.readRoutes()).map(x => x.nSesid)).toEqual([IDS.ses2]);
            expect(fs.readdirSync(dir).filter(n => n.endsWith('.tmp'))).toEqual([]);
            fs.writeFileSync(config.values.ECLIPSE_SESSION_CONFIG, '{"not":"an array"}');
            await expect(r.readRoutes()).rejects.toMatchObject({ code: 'UNAVAILABLE' });
        });

        it('defaults to the EclipseSessionService path', () => {
            delete config.values.ECLIPSE_SESSION_CONFIG;
            expect(make().routeFilePath()).toBe(path.join(process.cwd(), 'tools', 'feed-replay', 'sessions.runtime.json'));
        });
    });

    it('wallClock keeps the hearing wall clock (no UTC shift)', () => {
        expect(wallClock('2026-10-01 10:00:00')).toBe('2026-10-01T10:00:00');
        expect(wallClock('2026-10-01T10:00:00.000Z')).toBe('2026-10-01T10:00:00');
        expect(wallClock(new Date(2026, 9, 1, 10, 5, 7))).toBe('2026-10-01T10:05:07');
        expect(wallClock(null)).toBeNull();
        expect(wallClock('garbage-date' as any)).toBe('garbage-date');
    });
});
