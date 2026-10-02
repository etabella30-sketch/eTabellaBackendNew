import { randomBytes } from 'crypto';

import { SignJWT } from 'jose';
import { EdgeBoxTokenSigner } from '@app/edge-token';

import { EdgeAccessService } from './access.service';
import { EdgeAuthService } from './auth.service';
import { endOfBoxDayMs } from './box-time';
import { FakeState } from './testing/fake-state';
import {
    ADMIN,
    ADMIN_B,
    ASSIGNEE,
    BOX,
    boxConfig,
    CASE_A,
    CASE_B,
    CASE_C,
    CASE_GONE,
    cloudKeys,
    CODES_ON,
    CloudKeys,
    edgeWorld,
    H,
    INACTIVE,
    MEMBER,
    NOW,
    NOW_SEC,
    onlineToken,
    OTHER_BOX,
    OUTSIDER,
    PERSON,
    S_B,
    S_DELETED,
    S_ENDED,
    S_LIVE,
    S_NEXT,
    S_UNKNOWN,
    SpecClock,
    SUPER,
} from './testing/edge-world';
import { AccessRevoked, EdgePortError, EdgePrincipal, InMemoryEdgeEventBus, NO_REQUEST_CONTEXT } from '../ports';

const ctx = NO_REQUEST_CONTEXT;

describe('EdgeAuthService (AuthPort)', () => {
    let cloud: CloudKeys;
    let state: FakeState;
    let clock: SpecClock;
    let bus: InMemoryEdgeEventBus;
    let auth: EdgeAuthService;
    let revoked: AccessRevoked[];

    beforeAll(async () => {
        cloud = await cloudKeys();
    });

    beforeEach(() => {
        state = edgeWorld(cloud.keys);
        clock = new SpecClock();
        bus = new InMemoryEdgeEventBus();
        revoked = [];
        bus.subscribe('access-revoked', e => revoked.push(e));
        auth = new EdgeAuthService(state, boxConfig({ features: CODES_ON }), clock.now, bus);
    });

    const signer = (): EdgeBoxTokenSigner => EdgeBoxTokenSigner.create(BOX, state.identity.secret('box-token-signing'));
    const roomToken = async (over: { nUserid?: string; nSesid?: string; nowMs?: number; validUntilMs?: number; jti?: string } = {}) =>
        (await signer().mintRoomToken({ nUserid: PERSON, nSesid: S_LIVE, mintedBy: ADMIN, nowMs: NOW - 60_000, ...over })).token;
    const operatorToken = async (over: { day?: string; mintedBy?: string; nowMs?: number; validUntilMs?: number } = {}) => {
        const day = over.day ?? '2026-10-01';
        return (await signer().mintOperatorToken({ day, mintedBy: ADMIN, nowMs: NOW - 60_000, validUntilMs: endOfBoxDayMs(day, 'Europe/London'), ...over })).token;
    };

    async function refusal(work: Promise<unknown>): Promise<EdgePortError> {
        try {
            await work;
        } catch (err) {
            if (err instanceof EdgePortError) return err;
            throw err;
        }
        throw new Error('expected a refusal');
    }

    describe('authenticate: refusals in port order', () => {
        it('answers box_not_configured (503) before looking at the token when the box has no identity', async () => {
            state.identityRow = null;
            for (const token of [undefined, null, '', 'garbage', await onlineToken(cloud)]) {
                const err = await refusal(auth.authenticate(token as string, ctx));
                expect([err.code, err.status]).toEqual(['box_not_configured', 503]);
            }
        });

        it('treats an identity whose nEdgeid is not a uuid as not configured (never as "any box")', async () => {
            state.setIdentity({ nEdgeid: 'not-a-uuid' });
            expect((await refusal(auth.authenticate(await onlineToken(cloud), ctx))).code).toBe('box_not_configured');
        });

        it('answers unauthenticated (401) for a missing or unreadable token', async () => {
            for (const token of [undefined, null, '', 'Bearer x', 'a.b', 'a.b.c', 'x'.repeat(9000)]) {
                const err = await refusal(auth.authenticate(token as string, ctx));
                expect([err.code, err.status]).toEqual(['unauthenticated', 401]);
            }
        });

        it('answers box_not_linked (503, never a sign-out) for an online token while no cloud key is cached', async () => {
            state.jwksRow = null;
            expect((await refusal(auth.authenticate(await onlineToken(cloud), ctx))).code).toBe('box_not_linked');
            state.jwksRow = { keys: [{ kty: 'RSA', kid: 'x' }], receivedAtMs: NOW };
            const err = await refusal(auth.authenticate(await onlineToken(cloud), ctx));
            expect([err.code, err.status]).toEqual(['box_not_linked', 503]);
        });

        it('refuses forged and foreign online tokens as unauthenticated', async () => {
            const other = await cloudKeys(cloud.ring.kid); // same kid, another key: a forged signature
            const cases: Array<[string, Promise<string>]> = [
                ['bad signature', onlineToken(other)],
                ['unknown kid', onlineToken(cloud, {}, { kid: 'nope' })],
                ['wrong typ', onlineToken(cloud, {}, { typ: 'JWT' })],
                ['other box', onlineToken(cloud, { aud: `edge:${OTHER_BOX}`, edge: OTHER_BOX })],
                ['wrong issuer', onlineToken(cloud, { iss: 'someone' })],
                ['life over 12 h (D28)', onlineToken(cloud, { iat: NOW_SEC - 60, exp: NOW_SEC - 60 + 13 * 3600, auth_time: NOW_SEC - 120 })],
                ['past auth_time + 24 h (D24)', onlineToken(cloud, { iat: NOW_SEC - 60, exp: NOW_SEC + 3600, auth_time: NOW_SEC - 24 * 3600 })],
                ['no cases', onlineToken(cloud, { cases: [] })],
            ];
            for (const [label, token] of cases) {
                const err = await refusal(auth.authenticate(await token, ctx));
                expect([label, err.code]).toEqual([label, 'unauthenticated']);
            }
            const hs = await new SignJWT({ sub: ADMIN }).setProtectedHeader({ alg: 'HS256', typ: 'edge+jwt', kid: cloud.ring.kid }).sign(randomBytes(32));
            expect((await refusal(auth.authenticate(hs, ctx))).code).toBe('unauthenticated');
        });

        it('refuses box tokens of another box or another secret as unauthenticated', async () => {
            const foreign = EdgeBoxTokenSigner.create(OTHER_BOX, state.identity.secret('box-token-signing'));
            const t1 = (await foreign.mintRoomToken({ nUserid: PERSON, nSesid: S_LIVE, mintedBy: ADMIN, nowMs: NOW })).token;
            const forged = EdgeBoxTokenSigner.create(BOX, randomBytes(32));
            const t2 = (await forged.mintRoomToken({ nUserid: PERSON, nSesid: S_LIVE, mintedBy: ADMIN, nowMs: NOW })).token;
            expect((await refusal(auth.authenticate(t1, ctx))).code).toBe('unauthenticated');
            expect((await refusal(auth.authenticate(t2, ctx))).code).toBe('unauthenticated');
        });

        it('accepts an online token up to 5 min past exp (box clock skew), then answers token_expired', async () => {
            const token = await onlineToken(cloud, { iat: NOW_SEC - 3600, exp: NOW_SEC, auth_time: NOW_SEC - 7200 });
            clock.nowMs = NOW + 299_000;
            await expect(auth.authenticate(token, ctx)).resolves.toMatchObject({ kind: 'online' });
            clock.nowMs = NOW + 300_000;
            const err = await refusal(auth.authenticate(token, ctx));
            expect([err.code, err.status]).toEqual(['token_expired', 401]);
        });

        it('expires a box token at its exp on the box clock (no skew: the box minted it)', async () => {
            const token = await roomToken({ nowMs: NOW - 2 * H, validUntilMs: NOW });
            clock.nowMs = NOW - 1000;
            await expect(auth.authenticate(token, ctx)).resolves.toMatchObject({ kind: 'room-code' });
            clock.nowMs = NOW;
            expect((await refusal(auth.authenticate(token, ctx))).code).toBe('token_expired');
        });

        it('expires a room-code token once its session ended, was deleted, purged or is unknown (O-9)', async () => {
            await expect(auth.authenticate(await roomToken(), ctx)).resolves.toMatchObject({ sessionId: S_LIVE });
            expect((await refusal(auth.authenticate(await roomToken({ nSesid: S_ENDED }), ctx))).code).toBe('token_expired');
            expect((await refusal(auth.authenticate(await roomToken({ nSesid: S_DELETED }), ctx))).code).toBe('token_expired');
            expect((await refusal(auth.authenticate(await roomToken({ nSesid: S_UNKNOWN }), ctx))).code).toBe('token_expired');
            const token = await roomToken();
            state.patchSession(S_LIVE, { endedAtMs: NOW - 1000 });
            expect((await refusal(auth.authenticate(token, ctx))).code).toBe('token_expired');
            state.patchSession(S_LIVE, { endedAtMs: null, localState: 'purged', purgedAtMs: NOW });
            expect((await refusal(auth.authenticate(token, ctx))).code).toBe('token_expired');
        });

        it("expires an operator token on any other box-local day (DR7 'that day only')", async () => {
            const token = await operatorToken();
            await expect(auth.authenticate(token, ctx)).resolves.toMatchObject({ kind: 'operator' });
            const yesterday = await operatorToken({ day: '2026-09-30', nowMs: NOW - 20 * H });
            expect((await refusal(auth.authenticate(yesterday, ctx))).code).toBe('token_expired');
            clock.nowMs = endOfBoxDayMs('2026-10-01', 'Europe/London') + 1; // midnight in London
            expect((await refusal(auth.authenticate(token, ctx))).code).toBe('token_expired');
        });

        it('answers token_revoked for a denied jti (sign-out, end access, cloud list)', async () => {
            const token = await onlineToken(cloud, { jti: 'jti-signed-out' });
            state.revocations.denyJti('jti-signed-out', NOW + H, 'sign-out', NOW);
            const err = await refusal(auth.authenticate(token, ctx));
            expect([err.code, err.status]).toEqual(['token_revoked', 401]);
            const room = await roomToken({ jti: 'room-jti' });
            state.revocations.denyJti('room-jti', NOW + H, 'room-access-ended', NOW);
            expect((await refusal(auth.authenticate(room, ctx))).code).toBe('token_revoked');
        });

        it('answers token_revoked when a user cut-off covers the token, and not for a token issued after it', async () => {
            const before = await onlineToken(cloud, { sub: MEMBER, iat: NOW_SEC - 600 }); // issued NOW - 10 min
            state.revocations.revokeUser(MEMBER, NOW - 10 * 60_000); // cut-off = arrival + 5 min = NOW - 5 min
            expect((await refusal(auth.authenticate(before, ctx))).code).toBe('token_revoked');
            const after = await onlineToken(cloud, { sub: MEMBER, iat: NOW_SEC - 60, exp: NOW_SEC + 3600, auth_time: NOW_SEC - 60 });
            await expect(auth.authenticate(after, ctx)).resolves.toMatchObject({ userId: MEMBER });
            state.revocations.revokeUser(PERSON, NOW);
            expect((await refusal(auth.authenticate(await roomToken(), ctx))).code).toBe('token_revoked');
        });

        it('revokes an operator token when the case admin who minted the code was revoked (O-10 authority)', async () => {
            const token = await operatorToken();
            state.revocations.revokeUser(ADMIN, NOW);
            expect((await refusal(auth.authenticate(token, ctx))).code).toBe('token_revoked');
        });

        it('fails closed on a state failure: the error propagates (500), never a 401 that signs people out', async () => {
            const token = await onlineToken(cloud);
            state.failReads = new Error('SQLITE_IOERR');
            await expect(auth.authenticate(token, ctx)).rejects.toThrow('SQLITE_IOERR');
        });
    });

    describe('principals', () => {
        it('online: token cases ∩ box cases, admin flags and names from the roster, forwardable', async () => {
            const token = await onlineToken(cloud, { sub: ADMIN, cases: [CASE_A, CASE_GONE].sort(), jti: 'j-admin' });
            const p = await auth.authenticate(token, ctx);
            expect(p).toMatchObject({
                kind: 'online',
                userId: ADMIN,
                name: 'Priya Shah',
                email: 'priya@firm.example',
                caseIds: [CASE_A],
                adminCaseIds: [CASE_A],
                isBoxAdmin: true,
                isSuperAdmin: false,
                validUntil: (NOW_SEC - 600 + 12 * 3600) * 1000,
                untilSessionEnds: false,
                jti: 'j-admin',
                issuedAt: (NOW_SEC - 600) * 1000,
                authTime: (NOW_SEC - 3600) * 1000,
                mintedBy: null,
                operatorDay: null,
                deviceHash: null,
                forwardable: true,
                token,
            });
            expect(Object.isFrozen(p)).toBe(true);
        });

        it('online: a team member is not a box admin; an inactive admin row grants nothing; a super-admin sees every box case', async () => {
            const member = await auth.authenticate(await onlineToken(cloud, { sub: MEMBER }), ctx);
            expect(member).toMatchObject({ caseIds: [CASE_A, CASE_B], adminCaseIds: [], isBoxAdmin: false });
            const inactive = await auth.authenticate(await onlineToken(cloud, { sub: INACTIVE, cases: [CASE_A] }), ctx);
            expect(inactive).toMatchObject({ isBoxAdmin: false, adminCaseIds: [] });
            const sup = await auth.authenticate(await onlineToken(cloud, { sub: SUPER, cases: [CASE_A] }), ctx);
            // Box cases come in case-name order: Harlow (A), Okafor (C), Re Ashdown (B).
            expect(sup).toMatchObject({ isSuperAdmin: true, isBoxAdmin: true, caseIds: [CASE_A, CASE_C, CASE_B], adminCaseIds: [], name: 'Sue Super' });
            const adminB = await auth.authenticate(await onlineToken(cloud, { sub: ADMIN_B, cases: [CASE_B] }), ctx);
            expect(adminB).toMatchObject({ isBoxAdmin: true, adminCaseIds: [CASE_B], caseIds: [CASE_B] });
            const stranger = await auth.authenticate(await onlineToken(cloud, { sub: OUTSIDER, cases: [CASE_GONE] }), ctx);
            expect(stranger).toMatchObject({ caseIds: [], isBoxAdmin: false, name: '', email: null });
        });

        it('as shipped (box.settingsAccess super-admin): Box settings are for super-admins; a case admin keeps the cases, not the box', async () => {
            const shipped = new EdgeAuthService(state, boxConfig({ box: { name: 'Court 3', timeZone: 'Europe/London' } }), clock.now, bus);
            const admin = await shipped.authenticate(await onlineToken(cloud, { sub: ADMIN_B, cases: [CASE_B] }), ctx);
            expect(admin).toMatchObject({ isSuperAdmin: false, isBoxAdmin: false, adminCaseIds: [CASE_B], caseIds: [CASE_B] });
            expect(() => shipped.requireBoxAdmin(admin)).toThrow('Box settings need a super-admin or the operator code');
            expect(shipped.me(admin, NOW)).toMatchObject({ isBoxAdmin: false, isSuperAdmin: false });
            const sup = await shipped.authenticate(await onlineToken(cloud, { sub: SUPER, cases: [CASE_A] }), ctx);
            expect(sup).toMatchObject({ isSuperAdmin: true, isBoxAdmin: true });
            expect(() => shipped.requireBoxAdmin(sup)).not.toThrow();
        });

        it('room-code: exactly its session and case, never a box admin, never forwardable, bound device hash', async () => {
            state.roomCodes.insert({ id: 'rc1', nSesid: S_LIVE, nCaseid: CASE_A, nUserid: PERSON, codeHash: 'h1', issuedAtMs: NOW - H, issuedBy: { nUserid: ADMIN, name: 'Priya Shah', via: 'online', operatorName: null }, replacedId: null });
            state.roomCodes.bind('rc1', { deviceHash: 'dev-hash', deviceLabel: 'iPad', tokenJti: 'room-1', atMs: NOW - 60_000 });
            const token = await roomToken({ jti: 'room-1' });
            const p = await auth.authenticate(token, ctx);
            expect(p).toMatchObject({
                kind: 'room-code',
                userId: PERSON,
                name: 'Daniel Okafor',
                caseIds: [CASE_A],
                adminCaseIds: [],
                sessionId: S_LIVE,
                isBoxAdmin: false,
                isSuperAdmin: false,
                untilSessionEnds: true,
                authTime: null,
                mintedBy: { nUserid: ADMIN, name: 'Priya Shah' },
                deviceHash: 'dev-hash',
                forwardable: false,
            });
            expect(p.validUntil).toBe((Math.floor((NOW - 60_000) / 1000) + 24 * 3600) * 1000);
        });

        it("operator: the minting admin's box cases, box admin, valid to 23:59:59.999 box time", async () => {
            const p = await auth.authenticate(await operatorToken(), ctx);
            expect(p).toMatchObject({
                kind: 'operator',
                userId: null,
                name: 'Operator',
                email: null,
                caseIds: [CASE_A],
                adminCaseIds: [CASE_A],
                isBoxAdmin: true,
                operatorDay: '2026-10-01',
                mintedBy: { nUserid: ADMIN, name: 'Priya Shah' },
                forwardable: false,
                validUntil: Date.UTC(2026, 9, 1, 22, 59, 59, 999),
            });
            const bySuper = await auth.authenticate(await operatorToken({ mintedBy: SUPER }), ctx);
            expect(bySuper.caseIds).toEqual([CASE_A, CASE_C, CASE_B]);
        });
    });

    describe('scope (DR19)', () => {
        const online = async (sub: string, cases = [CASE_A, CASE_B]): Promise<EdgePrincipal> => auth.authenticate(await onlineToken(cloud, { sub, cases: [...cases].sort() }), ctx);

        it('canOpenSession: case team, session assignees, case admins and super-admins; never deleted or unknown sessions', async () => {
            const admin = await online(ADMIN);
            const member = await online(MEMBER);
            const assignee = await online(ASSIGNEE, [CASE_A]);
            const sup = await online(SUPER);
            const outsider = await online(OUTSIDER, [CASE_A]);
            const open = (p: EdgePrincipal): string[] => [S_LIVE, S_NEXT, S_ENDED, S_B, S_DELETED, S_UNKNOWN].filter(s => auth.canOpenSession(p, s));
            expect(open(admin)).toEqual([S_LIVE, S_NEXT, S_ENDED]);
            expect(open(member)).toEqual([S_LIVE, S_NEXT, S_ENDED, S_B]);
            expect(open(assignee)).toEqual([S_LIVE]);
            expect(open(sup)).toEqual([S_LIVE, S_NEXT, S_ENDED, S_B]);
            expect(open(outsider)).toEqual([]);
            expect(auth.canOpenSession(admin, '')).toBe(false);
            expect(auth.canOpenSession(admin, undefined as unknown as string)).toBe(false);
            expect(auth.canOpenSession(admin, S_LIVE.toUpperCase())).toBe(true);
        });

        it('a room-code principal opens only its own session; an operator every session of its cases', async () => {
            const room = await auth.authenticate(await roomToken(), ctx);
            expect([S_LIVE, S_NEXT, S_B].filter(s => auth.canOpenSession(room, s))).toEqual([S_LIVE]);
            expect(auth.canSeeCase(room, CASE_A)).toBe(true);
            expect(auth.canSeeCase(room, CASE_B)).toBe(false);
            const op = await auth.authenticate(await operatorToken(), ctx);
            expect([S_LIVE, S_NEXT, S_ENDED, S_B].filter(s => auth.canOpenSession(op, s))).toEqual([S_LIVE, S_NEXT, S_ENDED]);
        });

        it('rooms() lists what join-room accepts, with the reason', async () => {
            const member = await online(MEMBER);
            expect(auth.rooms(member).map(r => [r.nSesid, r.caseName, r.via])).toEqual([
                [S_ENDED, 'Harlow v Mercer Logistics', 'case-team'],
                [S_LIVE, 'Harlow v Mercer Logistics', 'case-team'],
                [S_NEXT, 'Harlow v Mercer Logistics', 'case-team'],
                [S_B, 'Re Ashdown Estates', 'case-team'],
            ]);
            const room = await auth.authenticate(await roomToken(), ctx);
            expect(auth.rooms(room)).toEqual([{ nSesid: S_LIVE, nCaseid: CASE_A, sessionName: 'Day 3 — Morning', caseName: 'Harlow v Mercer Logistics', via: 'room-code' }]);
            const op = await auth.authenticate(await operatorToken(), ctx);
            expect(auth.rooms(op).every(r => r.via === 'operator')).toBe(true);
        });
    });

    describe('me()', () => {
        it('online: the DR11 renewal plan from exp and auth_time (O-13), room-code case ids, rooms', async () => {
            const token = await onlineToken(cloud, { sub: ADMIN, iat: NOW_SEC - 600, exp: NOW_SEC + 3600, auth_time: NOW_SEC - 7200 });
            const me = auth.me(await auth.authenticate(token, ctx), NOW);
            const exp = (NOW_SEC + 3600) * 1000;
            expect(me).toMatchObject({
                kind: 'online',
                nUserid: ADMIN,
                name: 'Priya Shah',
                email: 'priya@firm.example',
                validUntilMs: exp,
                untilSessionEnds: false,
                isBoxAdmin: true,
                isSuperAdmin: false,
                roomCodeCaseIds: [CASE_A],
                operator: null,
                nowMs: NOW,
                renewal: {
                    expiresAtMs: exp,
                    authTimeMs: (NOW_SEC - 7200) * 1000,
                    ceilingAtMs: (NOW_SEC - 7200) * 1000 + 24 * H,
                    silentRefreshFromMs: exp - 2 * H,
                    renewNowFromMs: exp - H,
                    offlineWarnFromMs: exp - 30 * 60_000,
                    canRenew: true,
                },
            });
            expect(me.rooms.map(r => r.nSesid)).toEqual([S_ENDED, S_LIVE, S_NEXT]);
        });

        it('room-code and operator: no renewal; the operator block names the day and the minting admin', async () => {
            const room = auth.me(await auth.authenticate(await roomToken(), ctx), NOW);
            expect(room).toMatchObject({ kind: 'room-code', nUserid: PERSON, renewal: null, untilSessionEnds: true, isBoxAdmin: false, roomCodeCaseIds: [], operator: null });
            expect(room.rooms).toHaveLength(1);
            const op = auth.me(await auth.authenticate(await operatorToken(), ctx), NOW);
            expect(op).toMatchObject({ kind: 'operator', nUserid: null, name: 'Operator', email: null, renewal: null, isBoxAdmin: true, roomCodeCaseIds: [CASE_A], operator: { day: '2026-10-01', mintedBy: { nUserid: ADMIN, name: 'Priya Shah' } } });
        });

        it('canRenew is false once exp is within a minute of the 24 h ceiling', async () => {
            const authTime = NOW_SEC - 23 * 3600;
            const token = await onlineToken(cloud, { iat: NOW_SEC - 600, exp: authTime + 24 * 3600 - 30, auth_time: authTime });
            expect(auth.me(await auth.authenticate(token, ctx), NOW).renewal.canRenew).toBe(false);
        });
    });

    describe('permission guards (O-11)', () => {
        it('requireBoxAdmin refuses room-code and plain team members with not_box_admin (403)', async () => {
            const member = await auth.authenticate(await onlineToken(cloud, { sub: MEMBER }), ctx);
            const room = await auth.authenticate(await roomToken(), ctx);
            for (const p of [member, room]) {
                const err = (() => {
                    try {
                        auth.requireBoxAdmin(p);
                    } catch (e) {
                        return e as EdgePortError;
                    }
                    return null;
                })();
                expect([err?.code, err?.status]).toEqual(['not_box_admin', 403]);
            }
            const op = await auth.authenticate(await operatorToken(), ctx);
            expect(() => auth.requireBoxAdmin(op)).not.toThrow();
        });

        it('requireOnlineCaseAdmin: online_sign_in_required for box tokens, then not_case_admin', async () => {
            const op = await auth.authenticate(await operatorToken(), ctx);
            const room = await auth.authenticate(await roomToken(), ctx);
            const member = await auth.authenticate(await onlineToken(cloud, { sub: MEMBER }), ctx);
            const admin = await auth.authenticate(await onlineToken(cloud, { sub: ADMIN }), ctx);
            const sup = await auth.authenticate(await onlineToken(cloud, { sub: SUPER, cases: [CASE_A] }), ctx);
            expect(() => auth.requireOnlineCaseAdmin(op)).toThrow(expect.objectContaining({ code: 'online_sign_in_required' }));
            expect(() => auth.requireOnlineCaseAdmin(room)).toThrow(expect.objectContaining({ code: 'online_sign_in_required' }));
            expect(() => auth.requireOnlineCaseAdmin(member)).toThrow(expect.objectContaining({ code: 'not_case_admin', status: 403 }));
            expect(() => auth.requireOnlineCaseAdmin(admin)).not.toThrow();
            expect(() => auth.requireOnlineCaseAdmin(sup)).not.toThrow();
        });
    });

    describe('signOut (CONTRACTS.md §6.6)', () => {
        it('denies the jti until expiry + skew, publishes access-revoked, audits, and the token stops working', async () => {
            const token = await onlineToken(cloud, { sub: MEMBER, jti: 'j-out' });
            const p = await auth.authenticate(token, ctx);
            await auth.signOut(p, { ip: '10.0.0.7', userAgent: 'x', deviceCookie: null });
            expect(state.deniedJtis.get('j-out')).toEqual({ untilMs: p.validUntil + 300_000, reason: 'sign-out' });
            expect(revoked).toEqual([{ jtis: ['j-out'], userIds: [], reason: 'sign-out', atMs: NOW }]);
            expect(state.audited('sign-out')).toEqual([
                expect.objectContaining({ actor: { nUserid: MEMBER, name: 'Ann Lee', via: 'online', operatorName: null }, outcome: 'ok', ip: '10.0.0.7', data: { kind: 'online' } }),
            ]);
            expect((await refusal(auth.authenticate(token, ctx))).code).toBe('token_revoked');
            await expect(auth.signOut(p, ctx)).resolves.toBeUndefined(); // idempotent
        });

        it('signs out a room-code and an operator sign-in the same way (jti denied until expiry + skew)', async () => {
            const room = await auth.authenticate(await roomToken({ jti: 'room-out' }), ctx);
            await auth.signOut(room, ctx);
            expect(state.deniedJtis.get('room-out')).toEqual({ untilMs: room.validUntil + 300_000, reason: 'sign-out' });
            const op = await auth.authenticate(await operatorToken(), ctx);
            await auth.signOut(op, ctx);
            expect(state.audited('sign-out').map(r => r.actor)).toEqual([
                { nUserid: PERSON, name: 'Daniel Okafor', via: 'room-code', operatorName: null },
                { nUserid: null, name: 'Priya Shah', via: 'operator', operatorName: null },
            ]);
        });

        it('keeps a room-code binding: the same device may re-enter with the same code', async () => {
            const access = new EdgeAccessService(state, auth, { session: () => null } as never, {} as never, boxConfig({ features: CODES_ON }), clock.now, bus);
            const issued = access.issueRoomCodes(await auth.authenticate(await onlineToken(cloud, { sub: ADMIN }), ctx), { nSesid: S_LIVE, userIds: [PERSON] }, ctx);
            const code = (issued.results[0] as { issued: { code: string } }).issued.code;
            const first = await access.redeemRoomCode({ code }, { ip: '10.0.0.9', userAgent: 'iPad', deviceCookie: null });
            const device = first.deviceCookie.value;
            const p = await auth.authenticate(first.reply.token, ctx);
            await auth.signOut(p, { ip: '10.0.0.9', userAgent: 'iPad', deviceCookie: device });
            expect((await refusal(auth.authenticate(first.reply.token, ctx))).code).toBe('token_revoked');
            const again = await access.redeemRoomCode({ code }, { ip: '10.0.0.9', userAgent: 'iPad', deviceCookie: device });
            expect(again.reply.reentry).toBe(true);
            await expect(auth.authenticate(again.reply.token, ctx)).resolves.toMatchObject({ kind: 'room-code' });
        });
    });

    describe('DR19 roster scope of an online sign-in', () => {
        it("drops a case the token lists but the cached roster no longer has the person on (taken off the team after sign-in)", async () => {
            const token = await onlineToken(cloud, { sub: MEMBER });
            expect((await auth.authenticate(token, ctx)).caseIds).toEqual([CASE_A, CASE_B]);
            state.rosterRows = state.rosterRows.filter(m => !(m.nUserid === MEMBER && m.nCaseid === CASE_B));
            const p = await auth.authenticate(token, ctx);
            expect(p.caseIds).toEqual([CASE_A]);
            expect(auth.canSeeCase(p, CASE_B)).toBe(false);
            expect(auth.canOpenSession(p, S_B)).toBe(false);
            // an inactive roster row counts as off the team; a session assignee keeps the case of their session
            expect((await auth.authenticate(await onlineToken(cloud, { sub: INACTIVE, cases: [CASE_A] }), ctx)).caseIds).toEqual([]);
            expect((await auth.authenticate(await onlineToken(cloud, { sub: ASSIGNEE, cases: [CASE_A] }), ctx)).caseIds).toEqual([CASE_A]);
        });
    });

    describe('reverifyOnline: the principal an open LAN socket holds now (D24, D28)', () => {
        const codeOf = (work: () => unknown): string | null => {
            try {
                work();
            } catch (err) {
                return err instanceof EdgePortError ? err.code : 'not an EdgePortError';
            }
            return null;
        };

        it('re-derives roster, admin flags and cases now, past exp inside the ceiling, and refuses a revoked token', async () => {
            const token = await onlineToken(cloud, { sub: ADMIN, jti: 'o-1', iat: NOW_SEC - 3600, exp: NOW_SEC + 600, auth_time: NOW_SEC - 7200 });
            const atHandshake = await auth.authenticate(token, ctx);
            expect(atHandshake).toMatchObject({ caseIds: [CASE_A], adminCaseIds: [CASE_A], isBoxAdmin: true });
            clock.nowMs = NOW + 2 * H; // past exp + 5 min: a new handshake would be refused
            expect((await refusal(auth.authenticate(token, ctx))).code).toBe('token_expired');
            state.rosterRows = state.rosterRows.map(m => (m.nUserid === ADMIN && m.nCaseid === CASE_A ? { ...m, isCaseAdmin: false } : m));
            expect(auth.reverifyOnline(atHandshake)).toMatchObject({ jti: 'o-1', caseIds: [CASE_A], adminCaseIds: [], isBoxAdmin: false, token });
            state.rosterRows = state.rosterRows.filter(m => !(m.nUserid === ADMIN && m.nCaseid === CASE_A));
            expect(auth.reverifyOnline(atHandshake)).toMatchObject({ caseIds: [], adminCaseIds: [] });
            state.revocations.denyJti('o-1', NOW + 12 * H, 'cloud', NOW);
            expect(codeOf(() => auth.reverifyOnline(atHandshake))).toBe('token_revoked');
        });

        it('follows a newer token of the SAME sign-in the box has verified (a silent renewal), never another sign-in or person', async () => {
            const first = await auth.authenticate(await onlineToken(cloud, { sub: MEMBER, jti: 'f-1', iat: NOW_SEC - 7200, exp: NOW_SEC + 3600, auth_time: NOW_SEC - 7200 }), ctx);
            await auth.authenticate(await onlineToken(cloud, { sub: MEMBER, jti: 'x-1', iat: NOW_SEC - 30, auth_time: NOW_SEC - 1800 }), ctx); // another sign-in
            await auth.authenticate(await onlineToken(cloud, { sub: ADMIN, jti: 'x-2', iat: NOW_SEC - 30, auth_time: NOW_SEC - 7200 }), ctx); // another person
            expect(auth.reverifyOnline(first).jti).toBe('f-1');
            state.revocations.denyJti('f-1', NOW + 12 * H, 'cloud', NOW);
            expect(codeOf(() => auth.reverifyOnline(first))).toBe('token_revoked');

            // The device renews on etabella.net (same auth_time, cases re-scoped) and uses the new token here.
            const renewed = await onlineToken(cloud, { sub: MEMBER, jti: 'f-2', iat: NOW_SEC - 60, exp: NOW_SEC + 11 * 3600, auth_time: NOW_SEC - 7200, cases: [CASE_A] });
            await auth.authenticate(renewed, ctx);
            expect(auth.reverifyOnline(first)).toMatchObject({ jti: 'f-2', caseIds: [CASE_A], token: renewed, authTime: (NOW_SEC - 7200) * 1000 });
            // An older token of the sign-in seen later never replaces the newest.
            await auth.authenticate(await onlineToken(cloud, { sub: MEMBER, jti: 'f-0', iat: NOW_SEC - 7100, exp: NOW_SEC + 3600, auth_time: NOW_SEC - 7200 }), ctx);
            expect(auth.reverifyOnline(first).jti).toBe('f-2');
            // A user cut-off covers every token of the person, the renewal included.
            state.revocations.revokeUser(MEMBER, NOW);
            expect(codeOf(() => auth.reverifyOnline(first))).toBe('token_revoked');
        });

        it('a revoked renewal is not followed: the sign-in is over', async () => {
            const first = await auth.authenticate(await onlineToken(cloud, { sub: MEMBER, jti: 'g-1', iat: NOW_SEC - 7200, exp: NOW_SEC + 3600, auth_time: NOW_SEC - 7200 }), ctx);
            await auth.authenticate(await onlineToken(cloud, { sub: MEMBER, jti: 'g-2', iat: NOW_SEC - 60, exp: NOW_SEC + 11 * 3600, auth_time: NOW_SEC - 7200 }), ctx);
            expect(auth.reverifyOnline(first).jti).toBe('g-2'); // preferred while valid, even before g-1 is listed
            state.revocations.denyJti('g-2', NOW + 12 * H, 'cloud', NOW);
            expect(auth.reverifyOnline(first).jti).toBe('g-1'); // its own token is still valid
            state.revocations.denyJti('g-1', NOW + 12 * H, 'cloud', NOW);
            expect(codeOf(() => auth.reverifyOnline(first))).toBe('token_revoked');
        });

        it('is for online sign-ins only', async () => {
            const room = await auth.authenticate(await roomToken(), ctx);
            expect(codeOf(() => auth.reverifyOnline(room))).toBe('unauthenticated');
        });
    });

    describe('email sign-in only (DR23: code sign-ins switched off, the v1 default)', () => {
        const withFeatures = (features: Record<string, boolean>): EdgeAuthService => new EdgeAuthService(state, boxConfig({ features }), clock.now, bus);

        it('with both off (boxConfig() defaults) a room-code or operator token is unauthenticated (401); an online token works', async () => {
            const shipped = new EdgeAuthService(state, boxConfig(), clock.now, bus);
            for (const token of [await roomToken(), await operatorToken()]) {
                const err = await refusal(shipped.authenticate(token, ctx));
                expect([err.code, err.status]).toEqual(['unauthenticated', 401]);
            }
            const p = await shipped.authenticate(await onlineToken(cloud, { sub: ADMIN }), ctx);
            expect(shipped.me(p, NOW)).toMatchObject({ kind: 'online', isBoxAdmin: true, roomCodeCaseIds: [] });
        });

        it('each switch governs its own token kind', async () => {
            const roomsOnly = withFeatures({ roomCodes: true, operatorCode: false });
            await expect(roomsOnly.authenticate(await roomToken(), ctx)).resolves.toMatchObject({ kind: 'room-code' });
            expect((await refusal(roomsOnly.authenticate(await operatorToken(), ctx))).code).toBe('unauthenticated');
            const operatorOnly = withFeatures({ roomCodes: false, operatorCode: true });
            expect((await refusal(operatorOnly.authenticate(await roomToken(), ctx))).code).toBe('unauthenticated');
            const op = await operatorOnly.authenticate(await operatorToken(), ctx);
            // nobody may issue room codes while they are off, an operator included
            expect(operatorOnly.me(op, NOW)).toMatchObject({ kind: 'operator', isBoxAdmin: true, roomCodeCaseIds: [] });
        });

        it('a garbage or foreign box token is still just unauthenticated (no hint that codes exist)', async () => {
            const shipped = new EdgeAuthService(state, boxConfig(), clock.now, bus);
            const forged = (await EdgeBoxTokenSigner.create(BOX, randomBytes(32)).mintRoomToken({ nUserid: PERSON, nSesid: S_LIVE, mintedBy: ADMIN, nowMs: NOW })).token;
            expect((await refusal(shipped.authenticate(forged, ctx))).code).toBe('unauthenticated');
        });
    });
});
