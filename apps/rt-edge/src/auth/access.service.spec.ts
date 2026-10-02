import { createHash, randomBytes, scryptSync } from 'crypto';

import { EdgeBoxTokenSigner } from '@app/edge-token';

import { EdgeAccessService, UNKNOWN_MINTER } from './access.service';
import { EdgeAuthService } from './auth.service';
import { roomCodeHash } from './codes';
import { FakeState } from './testing/fake-state';
import {
    ADMIN,
    ADMIN_B,
    ASSIGNEE,
    BOX,
    boxConfig,
    CASE_A,
    CASE_B,
    cloudKeys,
    CloudKeys,
    CODES_ON,
    edgeWorld,
    H,
    MEMBER,
    NOW,
    onlineToken,
    OUTSIDER,
    PERSON,
    S_B,
    S_ENDED,
    S_LIVE,
    S_NEXT,
    S_UNKNOWN,
    SpecClock,
    SUPER,
} from './testing/edge-world';
import { RoomCodeRedeemResponse } from '../contracts';
import {
    AccessRevoked,
    EdgePortError,
    EdgePrincipal,
    EdgeRequestContext,
    InMemoryEdgeEventBus,
    KernelPort,
    KernelSessionView,
    NO_REQUEST_CONTEXT,
    RelayedOperatorCode,
    Reply,
    UplinkPort,
} from '../ports';

const IPAD = 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15';
const WINDOWS = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/129.0';
const sha = (v: string): string => createHash('sha256').update(v).digest('hex');
const device = (n: number): string => Buffer.alloc(32, n).toString('base64url');
const STATE = 'state-0123456789abcdef';
const CHALLENGE = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';

function errOf(work: () => unknown): EdgePortError {
    try {
        work();
    } catch (err) {
        if (err instanceof EdgePortError) return err;
        throw err;
    }
    throw new Error('expected a refusal');
}

async function rejection(work: Promise<unknown>): Promise<EdgePortError> {
    try {
        await work;
    } catch (err) {
        if (err instanceof EdgePortError) return err;
        throw err;
    }
    throw new Error('expected a refusal');
}

describe('EdgeAccessService (AccessPort)', () => {
    let cloud: CloudKeys;
    let state: FakeState;
    let clock: SpecClock;
    let bus: InMemoryEdgeEventBus;
    let auth: EdgeAuthService;
    let access: EdgeAccessService;
    let kernelViews: Map<string, Partial<KernelSessionView>>;
    let relay: jest.Mock;
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
        kernelViews = new Map();
        relay = jest.fn();
        const kernel = { session: (nSesid: string) => (kernelViews.get(nSesid) as KernelSessionView) ?? null } as unknown as KernelPort;
        const uplink = { relayOperatorCode: relay } as unknown as UplinkPort;
        auth = new EdgeAuthService(state, boxConfig({ features: CODES_ON }), clock.now, bus);
        access = new EdgeAccessService(state, auth, kernel, uplink, boxConfig({ features: CODES_ON }), clock.now, bus);
    });

    const online = async (sub: string, cases = [CASE_A, CASE_B]): Promise<EdgePrincipal> =>
        auth.authenticate(await onlineToken(cloud, { sub, cases: [...cases].sort() }), NO_REQUEST_CONTEXT);
    const signer = (): EdgeBoxTokenSigner => EdgeBoxTokenSigner.create(BOX, state.identity.secret('box-token-signing'));
    const operator = async (): Promise<EdgePrincipal> => {
        const { token } = await signer().mintOperatorToken({ day: '2026-10-01', mintedBy: ADMIN, nowMs: NOW - 60_000, validUntilMs: Date.UTC(2026, 9, 1, 22, 59, 59, 999) });
        return auth.authenticate(token, NO_REQUEST_CONTEXT);
    };
    const ctxOf = (ip: string | null, deviceCookie: string | null = null, userAgent: string | null = IPAD): EdgeRequestContext => ({ ip, userAgent, deviceCookie });

    /** Issue one code as ADMIN and return its plaintext. */
    async function issue(nUserid = PERSON, nSesid = S_LIVE): Promise<{ code: string; id: string }> {
        const reply = access.issueRoomCodes(await online(ADMIN), { nSesid, userIds: [nUserid] }, NO_REQUEST_CONTEXT);
        const result = reply.results[0];
        if (result.status !== 'issued') throw new Error(`refused: ${result.error}`);
        return { code: result.issued.code, id: result.issued.id };
    }

    // -------------------------------------------------------------------------------------------------------------

    describe('signInStart (DR5, D33)', () => {
        const req = { email: ' priya@firm.example ', state: STATE, codeChallenge: CHALLENGE, codeChallengeMethod: 'S256' as const };

        it("builds the authorize URL from the box's own identity, prefilled with the email, and audits a keyed email digest", () => {
            const reply = access.signInStart(req, ctxOf('10.0.0.5', device(1)));
            expect(reply.authorizeUrl).toBe(`https://cloud.invalid/auth/edge?edge=${BOX}&state=${STATE}&cc=${CHALLENGE}&login_hint=priya%40firm.example`);
            const [row] = state.audited('sign-in-start');
            expect(row).toMatchObject({ outcome: 'ok', actor: null, ip: '10.0.0.5', deviceHash: sha(device(1)) });
            expect(JSON.stringify(row)).not.toContain('priya');
            expect((row.data as { emailDigest: string }).emailDigest).toMatch(/^[0-9a-f]{64}$/);
        });

        it('refuses malformed requests with invalid_request (400), before anything else', () => {
            state.identityRow = null;
            const bad = [
                null,
                'x',
                { ...req, email: 'not-an-email' },
                { ...req, email: `${'a'.repeat(250)}@x.io` },
                { ...req, state: 'short' },
                { ...req, state: 'has spaces in it 1234' },
                { ...req, codeChallenge: 'abc' },
                { ...req, codeChallengeMethod: 'plain' },
            ];
            for (const body of bad) {
                const err = errOf(() => access.signInStart(body as never, NO_REQUEST_CONTEXT));
                expect([err.code, err.status]).toEqual(['invalid_request', 400]);
            }
        });

        it('answers box_not_configured without an identity and box_not_linked unless the identity is active', () => {
            state.identityRow = null;
            expect(errOf(() => access.signInStart(req, NO_REQUEST_CONTEXT)).code).toBe('box_not_configured');
            for (const status of ['pending-confirm', 'quarantined', 'revoked'] as const) {
                state.setIdentity({ nEdgeid: BOX, status });
                const err = errOf(() => access.signInStart(req, NO_REQUEST_CONTEXT));
                expect([status, err.code, err.status]).toEqual([status, 'box_not_linked', 503]);
            }
        });

        it('rate-limits to 20 starts per minute per client IP (429 with retryAfterSec)', () => {
            for (let i = 0; i < 20; i++) access.signInStart(req, ctxOf('10.0.0.5'));
            const err = errOf(() => access.signInStart(req, ctxOf('10.0.0.5')));
            expect([err.code, err.status, err.extra]).toEqual(['rate_limited', 429, { retryAfterSec: 60 }]);
            expect(() => access.signInStart(req, ctxOf('10.0.0.6'))).not.toThrow();
            clock.advance(60_000);
            expect(() => access.signInStart(req, ctxOf('10.0.0.5'))).not.toThrow();
            expect(state.audited('sign-in-start').filter(r => r.outcome === 'rate_limited')).toHaveLength(1);
        });
    });

    // -------------------------------------------------------------------------------------------------------------

    describe('redeemRoomCode (DR5, DR10, O-9)', () => {
        it('accepts the code as typed (case, dashes, spaces, O/0, I/L/1) and signs the device in with a box token', async () => {
            const { code, id } = await issue();
            const typed = `${code.slice(0, 3).toLowerCase()} - ${code.slice(3)}`.replace(/0/g, 'o').replace(/1/g, 'l');
            const { reply, deviceCookie } = await access.redeemRoomCode({ code: typed }, ctxOf('10.0.0.9', null, IPAD));
            expect(reply).toMatchObject({
                status: 'ok',
                kind: 'room-code',
                nUserid: PERSON,
                name: 'Daniel Okafor',
                room: { nSesid: S_LIVE, nCaseid: CASE_A, sessionName: 'Day 3 — Morning', caseName: 'Harlow v Mercer Logistics', via: 'room-code' },
                validUntilMs: (Math.floor(NOW / 1000) + 24 * 3600) * 1000,
                untilSessionEnds: true,
                reentry: false,
            });
            expect(deviceCookie).toMatchObject({ name: 'etab_edge_device', maxAgeSec: 7 * 24 * 3600, httpOnly: true, secure: true, sameSite: 'strict', path: '/' });
            expect(deviceCookie.value).toMatch(/^[A-Za-z0-9_-]{43}$/);
            const row = state.roomCodes.get(id);
            expect(row).toMatchObject({ status: 'used', deviceHash: sha(deviceCookie.value), deviceLabel: 'iPad', usedAtMs: NOW });
            const p = await auth.authenticate(reply.token, NO_REQUEST_CONTEXT);
            expect(p).toMatchObject({ kind: 'room-code', userId: PERSON, sessionId: S_LIVE, jti: row.tokenJti, mintedBy: { nUserid: ADMIN, name: 'Priya Shah' } });
        });

        it('binds to the cookie the device already has (no new cookie), and lets the same device re-enter', async () => {
            const { code, id } = await issue();
            const first = await access.redeemRoomCode({ code }, ctxOf('10.0.0.9', device(7)));
            expect(first.deviceCookie).toBeNull();
            const firstJti = state.roomCodes.get(id).tokenJti;
            clock.advance(10 * 60_000);
            const again = await access.redeemRoomCode({ code }, ctxOf('10.0.0.10', device(7), WINDOWS));
            expect(again.reply.reentry).toBe(true);
            expect(again.deviceCookie).toBeNull();
            const row = state.roomCodes.get(id);
            expect(row).toMatchObject({ status: 'used', usedAtMs: NOW, deviceLabel: 'iPad' });
            expect(row.tokenJti).not.toBe(firstJti);
            expect(state.deniedJtis.get(firstJti)?.reason).toBe('replaced');
            expect((await rejection(auth.authenticate(first.reply.token, NO_REQUEST_CONTEXT))).code).toBe('token_revoked');
            await expect(auth.authenticate(again.reply.token, NO_REQUEST_CONTEXT)).resolves.toMatchObject({ kind: 'room-code' });
        });

        it('refuses another device with code_used_elsewhere {usedAtMs, deviceLabel} (409)', async () => {
            const { code } = await issue();
            await access.redeemRoomCode({ code }, ctxOf('10.0.0.9', device(1), IPAD));
            for (const other of [device(2), null]) {
                const err = await rejection(access.redeemRoomCode({ code }, ctxOf('10.0.0.11', other)));
                expect([err.code, err.status, err.extra]).toEqual(['code_used_elsewhere', 409, { usedAtMs: NOW, deviceLabel: 'iPad' }]);
            }
        });

        it('answers code_revoked (410) for a revoked code or ended room access, and code_expired (410) once the session ended', async () => {
            const admin = await online(ADMIN);
            const a = await issue();
            access.revokeRoomCode(admin, a.id, NO_REQUEST_CONTEXT);
            expect((await rejection(access.redeemRoomCode({ code: a.code }, ctxOf('10.0.0.9', device(1))))).code).toBe('code_revoked');

            const b = await issue(MEMBER);
            await access.redeemRoomCode({ code: b.code }, ctxOf('10.0.0.9', device(1)));
            access.endRoomAccess(admin, b.id, NO_REQUEST_CONTEXT);
            const ended = await rejection(access.redeemRoomCode({ code: b.code }, ctxOf('10.0.0.9', device(1))));
            expect([ended.code, ended.status]).toEqual(['code_revoked', 410]);

            const c = await issue(ASSIGNEE);
            state.patchSession(S_LIVE, { endedAtMs: NOW + 1000 });
            clock.advance(2000);
            const expired = await rejection(access.redeemRoomCode({ code: c.code }, ctxOf('10.0.0.9', device(1))));
            expect([expired.code, expired.status, expired.extra]).toEqual(['code_expired', 410, { sessionName: 'Day 3 — Morning', endedAtMs: NOW + 1000 }]);

            state.roomCodes.expireSession(S_LIVE, NOW + 1500);
            const marked = await rejection(access.redeemRoomCode({ code: c.code }, ctxOf('10.0.0.9', device(1))));
            expect(marked.extra).toEqual({ sessionName: 'Day 3 — Morning', endedAtMs: NOW + 1500 });
        });

        it('treats the kernel ending the session as ended even before the record says so', async () => {
            const { code } = await issue();
            kernelViews.set(S_LIVE, { endedAtMs: NOW - 1 });
            expect((await rejection(access.redeemRoomCode({ code }, ctxOf('10.0.0.9')))).code).toBe('code_expired');
        });

        it('refuses a malformed code with invalid_request (400) without counting a try', async () => {
            for (const code of [undefined, 42, '', 'K7Q4M', 'K7Q4M2X', 'UUUUUU', 'K7Q-4M!', 'x'.repeat(65)]) {
                const err = await rejection(access.redeemRoomCode({ code } as never, ctxOf('10.0.0.9')));
                expect([err.code, err.status]).toEqual(['invalid_request', 400]);
            }
            expect(access.lockout.size).toBe(0);
        });

        it('counts wrong codes: attemptsLeft 4..1, the 5th locks for 60 s (429, retryAfterSec), the lock is not extended', async () => {
            const { code } = await issue();
            const ctx = ctxOf('10.0.0.9', device(3));
            for (const left of [4, 3, 2, 1]) {
                const err = await rejection(access.redeemRoomCode({ code: 'ZZZZZZ' }, ctx));
                expect([err.code, err.status, err.extra]).toEqual(['code_wrong', 400, { attemptsLeft: left }]);
            }
            const fifth = await rejection(access.redeemRoomCode({ code: 'ZZZZZZ' }, ctx));
            expect([fifth.code, fifth.status, fifth.extra]).toEqual(['code_locked', 429, { retryAfterSec: 60 }]);
            clock.advance(8_000);
            const right = await rejection(access.redeemRoomCode({ code }, ctx)); // even the right code waits
            expect([right.code, right.extra]).toEqual(['code_locked', { retryAfterSec: 52 }]);
            clock.advance(52_000);
            await expect(access.redeemRoomCode({ code }, ctx)).resolves.toMatchObject({ reply: { status: 'ok' } });
        });

        it('locks per client IP across device cookies, and per device cookie across IPs', async () => {
            for (let i = 0; i < 5; i++) await rejection(access.redeemRoomCode({ code: 'ZZZZZZ' }, ctxOf('10.0.0.9', device(10 + i))));
            expect((await rejection(access.redeemRoomCode({ code: 'ZZZZZZ' }, ctxOf('10.0.0.9', device(99))))).code).toBe('code_locked');
            expect((await rejection(access.redeemRoomCode({ code: 'ZZZZZZ' }, ctxOf('10.0.0.50', device(99))))).code).toBe('code_wrong');
            for (let i = 0; i < 5; i++) await rejection(access.redeemRoomCode({ code: 'ZZZZZZ' }, ctxOf(`10.0.1.${i}`, device(42))));
            expect((await rejection(access.redeemRoomCode({ code: 'ZZZZZZ' }, ctxOf('10.0.2.1', device(42))))).code).toBe('code_locked');
        });

        it('does not count a real code that was revoked or expired as a wrong try', async () => {
            const admin = await online(ADMIN);
            const { code, id } = await issue();
            access.revokeRoomCode(admin, id, NO_REQUEST_CONTEXT);
            for (let i = 0; i < 6; i++) expect((await rejection(access.redeemRoomCode({ code }, ctxOf('10.0.0.9')))).code).toBe('code_revoked');
            expect((await rejection(access.redeemRoomCode({ code: 'ZZZZZZ' }, ctxOf('10.0.0.9')))).extra).toEqual({ attemptsLeft: 4 });
        });

        it('a correct code clears the wrong tries of that device and IP', async () => {
            const { code } = await issue();
            for (let i = 0; i < 3; i++) await rejection(access.redeemRoomCode({ code: 'ZZZZZZ' }, ctxOf('10.0.0.9', device(5))));
            await access.redeemRoomCode({ code }, ctxOf('10.0.0.9', device(5)));
            expect((await rejection(access.redeemRoomCode({ code: 'ZZZZZZ' }, ctxOf('10.0.0.9', device(5))))).extra).toEqual({ attemptsLeft: 4 });
        });

        it('answers from the row as it is now when another device won the bind race', async () => {
            const { code, id } = await issue();
            const bind = state.roomCodes.bind;
            (state.roomCodes as { bind: typeof bind }).bind = (rowId, binding) => {
                bind(rowId, { ...binding, deviceHash: 'someone-else', deviceLabel: 'Mac' });
                return bind(rowId, binding);
            };
            const err = await rejection(access.redeemRoomCode({ code }, ctxOf('10.0.0.9', device(1))));
            expect([err.code, err.extra]).toEqual(['code_used_elsewhere', { usedAtMs: NOW, deviceLabel: 'Mac' }]);
            expect(state.roomCodes.get(id).deviceHash).toBe('someone-else');
        });

        it('audits every attempt with outcome, device hash and IP, never the code value', async () => {
            const { code } = await issue();
            await rejection(access.redeemRoomCode({ code: 'ZZZZZZ' }, ctxOf('10.0.0.9', device(1))));
            await access.redeemRoomCode({ code }, ctxOf('10.0.0.9', device(1)));
            await rejection(access.redeemRoomCode({ code }, ctxOf('10.0.0.8', device(2))));
            const rows = state.audited('room-code-redeem');
            expect(rows.map(r => [r.outcome, r.ip, r.deviceHash])).toEqual([
                ['code_wrong', '10.0.0.9', sha(device(1))],
                ['ok', '10.0.0.9', sha(device(1))],
                ['code_used_elsewhere', '10.0.0.8', sha(device(2))],
            ]);
            const text = JSON.stringify(state.auditRows);
            expect(text).not.toContain(code);
            expect(text).not.toContain('ZZZZZZ');
            expect(text).not.toContain(device(1));
        });

        it('names the operator-code minter as mintedBy for a code issued in an operator session (O-10)', async () => {
            state.operatorCodes.put({ day: '2026-10-01', alg: 'scrypt', salt: 'AA==', hash: 'AA==', scryptN: 1024, issuedAtMs: NOW - H, mintedBy: { nUserid: ADMIN, name: 'Priya Shah' }, source: 'assignments' });
            const op = await operator();
            const reply = access.issueRoomCodes(op, { nSesid: S_LIVE, userIds: [PERSON], operatorName: 'Jo Smith' }, NO_REQUEST_CONTEXT);
            const code = (reply.results[0] as { issued: { code: string } }).issued.code;
            const { reply: redeemed } = await access.redeemRoomCode({ code }, ctxOf('10.0.0.9'));
            expect((await auth.authenticate(redeemed.token, NO_REQUEST_CONTEXT)).mintedBy.nUserid).toBe(ADMIN);
            state.operatorCodeRows.clear();
            const again = access.issueRoomCodes(op, { nSesid: S_LIVE, userIds: [MEMBER], operatorName: 'Jo Smith' }, NO_REQUEST_CONTEXT);
            const code2 = (again.results[0] as { issued: { code: string } }).issued.code;
            const { reply: second } = await access.redeemRoomCode({ code: code2 }, ctxOf('10.0.0.9'));
            expect((await auth.authenticate(second.token, NO_REQUEST_CONTEXT)).mintedBy.nUserid).toBe(UNKNOWN_MINTER);
        });

        it('answers box_not_configured when the box lost its identity', async () => {
            const { code } = await issue();
            state.identityRow = null;
            expect((await rejection(access.redeemRoomCode({ code }, ctxOf('10.0.0.9')))).code).toBe('box_not_configured');
        });
    });

    // -------------------------------------------------------------------------------------------------------------

    describe('operatorSignIn (DR7, O-10)', () => {
        const CODE = 'OPR6Z3K91';
        const putCode = (day: string, code = CODE, over: Record<string, unknown> = {}): void => {
            const salt = randomBytes(16);
            state.operatorCodes.put({
                day,
                alg: 'scrypt',
                salt: salt.toString('base64'),
                hash: scryptSync(code, salt, 32, { N: 1024 }).toString('base64'),
                scryptN: 1024,
                issuedAtMs: NOW - H,
                mintedBy: { nUserid: ADMIN, name: 'Priya Shah' },
                source: 'assignments',
                ...over,
            } as never);
        };

        it("opens Box settings for today with today's code, typed any way, and counts the use", async () => {
            putCode('2026-10-01');
            for (const typed of ['opr-6z3k-91', '6Z3K91', 'OPR 6Z3K 91']) {
                const reply = await access.operatorSignIn({ code: typed }, ctxOf('10.0.0.9', device(1)));
                expect(reply).toMatchObject({ status: 'ok', kind: 'operator', name: 'Operator', day: '2026-10-01', validUntilMs: Date.UTC(2026, 9, 1, 22, 59, 59, 999), mintedBy: { nUserid: ADMIN, name: 'Priya Shah' } });
                await expect(auth.authenticate(reply.token, NO_REQUEST_CONTEXT)).resolves.toMatchObject({ kind: 'operator', isBoxAdmin: true });
            }
            expect(state.operatorCodes.get('2026-10-01').uses).toBe(3);
            expect(state.audited('operator-code-sign-in').map(r => r.outcome)).toEqual(['ok', 'ok', 'ok']);
            expect(JSON.stringify(state.auditRows)).not.toContain('6Z3K');
        });

        it("answers code_expired {sessionName:null, endedAtMs:null} for another day's code, without counting a try", async () => {
            putCode('2026-09-30');
            for (let i = 0; i < 6; i++) {
                const err = await rejection(access.operatorSignIn({ code: CODE }, ctxOf('10.0.0.9')));
                expect([err.code, err.status, err.extra]).toEqual(['code_expired', 410, { sessionName: null, endedAtMs: null }]);
            }
        });

        it('answers code_wrong for no code today, a mismatch or a malformed delivery; the lock is shared with room codes', async () => {
            expect((await rejection(access.operatorSignIn({ code: CODE }, ctxOf('10.0.0.9')))).extra).toEqual({ attemptsLeft: 4 });
            putCode('2026-10-01', 'OPRAAAAAA');
            expect((await rejection(access.operatorSignIn({ code: CODE }, ctxOf('10.0.0.9')))).extra).toEqual({ attemptsLeft: 3 });
            putCode('2026-10-01', CODE, { scryptN: 1000 });
            expect((await rejection(access.operatorSignIn({ code: CODE }, ctxOf('10.0.0.9')))).extra).toEqual({ attemptsLeft: 2 });
            await rejection(access.redeemRoomCode({ code: 'ZZZZZZ' }, ctxOf('10.0.0.9')));
            const locked = await rejection(access.operatorSignIn({ code: 'OPRZZZZZZ' }, ctxOf('10.0.0.9')));
            expect([locked.code, locked.extra]).toEqual(['code_locked', { retryAfterSec: 60 }]);
        });

        it('refuses a malformed code with invalid_request', async () => {
            for (const code of [null, '', 'OPR', 'OPR12345', 'XYZ6Z3K91', 'x'.repeat(65)]) {
                expect((await rejection(access.operatorSignIn({ code } as never, ctxOf('10.0.0.9')))).code).toBe('invalid_request');
            }
        });
    });

    // -------------------------------------------------------------------------------------------------------------

    describe('Box settings → Room codes (DR10, D33)', () => {
        it('issues one code per person, in request order, refusing strangers per person; codes are stored hashed only', async () => {
            const admin = await online(ADMIN);
            const reply = access.issueRoomCodes(admin, { nSesid: S_LIVE, userIds: [PERSON, OUTSIDER, ASSIGNEE, 'not-a-user', MEMBER] }, ctxOf('10.0.0.2'));
            expect(reply).toMatchObject({ nSesid: S_LIVE, sessionName: 'Day 3 — Morning', caseName: 'Harlow v Mercer Logistics' });
            expect(reply.results.map(r => [r.nUserid, r.status, r.status === 'refused' ? r.error : r.issued.person.name])).toEqual([
                [PERSON, 'issued', 'Daniel Okafor'],
                [OUTSIDER, 'refused', 'user_not_found'],
                [ASSIGNEE, 'issued', 'Sam Reporter'],
                ['not-a-user', 'refused', 'user_not_found'],
                [MEMBER, 'issued', 'Ann Lee'],
            ]);
            const issued = reply.results.filter(r => r.status === 'issued') as Array<{ issued: { id: string; code: string; display: string; person: { role: string } } }>;
            for (const { issued: i } of issued) {
                expect(i.code).toMatch(/^[0-9A-HJKMNP-TV-Z]{6}$/);
                expect(i.display).toBe(`${i.code.slice(0, 3)}-${i.code.slice(3)}`);
                const stored = state.roomCodes.get(i.id);
                expect(stored.codeHash).toBe(roomCodeHash(state.identity.secret('room-code-hmac'), i.code));
                expect(JSON.stringify(stored)).not.toContain(i.code);
                expect(stored.issuedBy).toEqual({ nUserid: ADMIN, name: 'Priya Shah', via: 'online', operatorName: null });
            }
            expect(issued[0].issued.person.role).toBe('Client');
            expect(state.audited('room-code-issue').map(r => r.outcome)).toEqual(['ok', 'user_not_found', 'ok', 'user_not_found', 'ok']);
            expect(JSON.stringify(state.auditRows)).not.toContain(issued[0].issued.code);
        });

        it('refuses a known person outside the session with not_on_case_team', async () => {
            const admin = await online(ADMIN);
            const reply = access.issueRoomCodes(admin, { nSesid: S_NEXT, userIds: [ASSIGNEE] }, NO_REQUEST_CONTEXT);
            expect(reply.results).toEqual([{ status: 'refused', nUserid: ASSIGNEE, error: 'not_on_case_team' }]);
        });

        it("replaces a person's earlier unused code for the session (replacedId) and revokes it", async () => {
            const first = await issue();
            const admin = await online(ADMIN);
            const second = access.issueRoomCodes(admin, { nSesid: S_LIVE, userIds: [PERSON] }, NO_REQUEST_CONTEXT).results[0] as { issued: { id: string; replacedId: string } };
            expect(second.issued.replacedId).toBe(first.id);
            expect(state.roomCodes.get(first.id)).toMatchObject({ status: 'revoked', revokedAtMs: NOW });
            expect((await rejection(access.redeemRoomCode({ code: first.code }, ctxOf('10.0.0.9')))).code).toBe('code_revoked');
        });

        it('checks the request in port order: invalid_request, session_not_found, not_case_admin, session_ended, operator_name_required', async () => {
            const admin = await online(ADMIN);
            const member = await online(MEMBER);
            const adminB = await online(ADMIN_B, [CASE_B]);
            const many = Array.from({ length: 51 }, (_, i) => `u${i}`);
            for (const body of [null, {}, { nSesid: S_LIVE }, { nSesid: S_LIVE, userIds: [] }, { nSesid: S_LIVE, userIds: many }, { nSesid: S_LIVE, userIds: [PERSON, PERSON.toUpperCase()] }, { nSesid: 7, userIds: [PERSON] }, { nSesid: S_LIVE, userIds: [PERSON], operatorName: 5 }]) {
                expect(errOf(() => access.issueRoomCodes(admin, body as never, NO_REQUEST_CONTEXT)).code).toBe('invalid_request');
            }
            expect(errOf(() => access.issueRoomCodes(admin, { nSesid: S_UNKNOWN, userIds: [PERSON] }, NO_REQUEST_CONTEXT)).code).toBe('session_not_found');
            expect(errOf(() => access.issueRoomCodes(adminB, { nSesid: S_LIVE, userIds: [PERSON] }, NO_REQUEST_CONTEXT)).code).toBe('session_not_found'); // case not visible
            expect(errOf(() => access.issueRoomCodes(member, { nSesid: S_LIVE, userIds: [PERSON] }, NO_REQUEST_CONTEXT)).code).toBe('not_box_admin');
            const err = errOf(() => access.issueRoomCodes({ ...admin, adminCaseIds: [] }, { nSesid: S_LIVE, userIds: [PERSON] }, NO_REQUEST_CONTEXT));
            expect([err.code, err.status]).toEqual(['not_case_admin', 403]);
            const ended = errOf(() => access.issueRoomCodes(admin, { nSesid: S_ENDED, userIds: [PERSON] }, NO_REQUEST_CONTEXT));
            expect([ended.code, ended.status]).toEqual(['session_ended', 409]);
            const op = await operator();
            for (const operatorName of [undefined, '', ' J ', 'x'.repeat(81)]) {
                const e = errOf(() => access.issueRoomCodes(op, { nSesid: S_LIVE, userIds: [PERSON], operatorName }, NO_REQUEST_CONTEXT));
                expect([e.code, e.status]).toEqual(['operator_name_required', 400]);
            }
        });

        it('records an operator-session issue against the minting admin and the typed operator name (O-10)', async () => {
            const op = await operator();
            const reply = access.issueRoomCodes(op, { nSesid: S_LIVE, userIds: [PERSON], operatorName: '  Jo Smith ' }, NO_REQUEST_CONTEXT);
            const id = (reply.results[0] as { issued: { id: string } }).issued.id;
            expect(state.roomCodes.get(id).issuedBy).toEqual({ nUserid: null, name: 'Priya Shah', via: 'operator', operatorName: 'Jo Smith' });
        });

        it('treats a session the cloud asked to end (draining) as ended for issuing', async () => {
            state.patchSession(S_NEXT, { cloudOp: 'end', endRequestedAtMs: NOW - 1000 });
            expect(errOf(() => access.issueRoomCodes(admin0(), { nSesid: S_NEXT, userIds: [PERSON] }, NO_REQUEST_CONTEXT)).code).toBe('session_ended');
            function admin0(): EdgePrincipal {
                return { kind: 'online', userId: ADMIN, name: 'Priya Shah', email: null, caseIds: [CASE_A], adminCaseIds: [CASE_A], isBoxAdmin: true, isSuperAdmin: false, validUntil: NOW + H, untilSessionEnds: false, jti: 'j', issuedAt: NOW, authTime: NOW, mintedBy: null, operatorDay: null, deviceHash: null, forwardable: true, token: 't' };
            }
        });

        it('lists rows newest first with what the viewer may do, never the code; unusedCount counts unused rows', async () => {
            const a = await issue(PERSON);
            clock.advance(1000);
            const b = await issue(MEMBER);
            await access.redeemRoomCode({ code: b.code }, ctxOf('10.0.0.9', device(1), WINDOWS));
            clock.advance(1000);
            const c = await issue(ASSIGNEE);
            const admin = await online(ADMIN);
            const list = access.listRoomCodes(admin, null);
            expect(list.unusedCount).toBe(2);
            expect(list.rows.map(r => [r.id, r.status, r.can])).toEqual([
                [c.id, 'unused', { revoke: true, endAccess: false, reissue: true }],
                [b.id, 'used', { revoke: false, endAccess: true, reissue: true }],
                [a.id, 'unused', { revoke: true, endAccess: false, reissue: true }],
            ]);
            expect(list.rows[1]).toMatchObject({
                nSesid: S_LIVE,
                nCaseid: CASE_A,
                sessionName: 'Day 3 — Morning',
                caseName: 'Harlow v Mercer Logistics',
                person: { nUserid: MEMBER, name: 'Ann Lee', role: 'Paralegal' },
                issuedBy: { nUserid: ADMIN, name: 'Priya Shah', via: 'online', operatorName: null },
                usedAtMs: NOW + 1000,
                deviceLabel: 'Windows',
                revokedAtMs: null,
                endedAtMs: null,
            });
            expect(JSON.stringify(list)).not.toContain(a.code);
            expect(access.listRoomCodes(admin, S_NEXT).rows).toEqual([]);
            // A box admin of another case sees nothing of case A (DR19); a viewer who is not case admin sees no actions.
            expect(access.listRoomCodes(await online(ADMIN_B, [CASE_B]), null).rows).toEqual([]);
            const sup = await online(SUPER, [CASE_A]);
            expect(access.listRoomCodes(sup, null).rows.every(r => !r.can.revoke && !r.can.endAccess && !r.can.reissue)).toBe(true);
            expect(() => access.listRoomCodes(admin, 5 as never)).toThrow(expect.objectContaining({ code: 'invalid_request' }));
        });

        it('revoke: unused → revoked; used → code_already_used; unknown or invisible → not_found; not admin → not_case_admin', async () => {
            const admin = await online(ADMIN);
            const a = await issue();
            const reply = access.revokeRoomCode(admin, a.id, ctxOf('10.0.0.2'));
            expect(reply.row).toMatchObject({ id: a.id, status: 'revoked', revokedAtMs: NOW, can: { revoke: false, endAccess: false, reissue: true } });
            expect(access.revokeRoomCode(admin, a.id, NO_REQUEST_CONTEXT).row.status).toBe('revoked'); // idempotent
            const b = await issue(MEMBER);
            await access.redeemRoomCode({ code: b.code }, ctxOf('10.0.0.9'));
            expect(errOf(() => access.revokeRoomCode(admin, b.id, NO_REQUEST_CONTEXT))).toMatchObject({ code: 'code_already_used', status: 409 });
            expect(errOf(() => access.revokeRoomCode(admin, 'nope', NO_REQUEST_CONTEXT))).toMatchObject({ code: 'not_found', status: 404 });
            const adminB = await online(ADMIN_B, [CASE_B]);
            const sup = await online(SUPER, [CASE_A]);
            expect(errOf(() => access.revokeRoomCode(adminB, b.id, NO_REQUEST_CONTEXT)).code).toBe('not_found');
            expect(errOf(() => access.revokeRoomCode(sup, b.id, NO_REQUEST_CONTEXT)).code).toBe('not_case_admin');
            expect(state.audited('room-code-revoke')).toHaveLength(1);
        });

        it("end access: used → ended, the device's token is denied and its sockets are told to close", async () => {
            const admin = await online(ADMIN);
            const { code, id } = await issue();
            const { reply } = await access.redeemRoomCode({ code }, ctxOf('10.0.0.9', device(1)));
            const jti = state.roomCodes.get(id).tokenJti;
            const ended = access.endRoomAccess(admin, id, ctxOf('10.0.0.2'));
            expect(ended.row).toMatchObject({ status: 'ended', endedAtMs: NOW, can: { revoke: false, endAccess: false, reissue: true } });
            expect(state.deniedJtis.get(jti)?.reason).toBe('room-access-ended');
            expect(revoked).toEqual([{ jtis: [jti], userIds: [], reason: 'room-access-ended', atMs: NOW }]);
            expect((await rejection(auth.authenticate(reply.token, NO_REQUEST_CONTEXT))).code).toBe('token_revoked');
            expect(access.endRoomAccess(admin, id, NO_REQUEST_CONTEXT).row.status).toBe('ended'); // idempotent
            const unused = await issue(MEMBER);
            expect(errOf(() => access.endRoomAccess(admin, unused.id, NO_REQUEST_CONTEXT))).toMatchObject({ code: 'code_not_used', status: 409 });
            expect(state.audited('room-code-end-access')).toHaveLength(1);
        });

        it('re-issue: a new code for the same person; an unused old code is revoked, a used one keeps its device', async () => {
            const admin = await online(ADMIN);
            const old = await issue();
            const reply = access.reissueRoomCode(admin, old.id, {}, NO_REQUEST_CONTEXT);
            expect(reply.issued).toMatchObject({ person: { nUserid: PERSON, name: 'Daniel Okafor', role: 'Client' }, replacedId: old.id });
            expect(reply.row).toMatchObject({ id: old.id, status: 'revoked' });
            const used = await issue(MEMBER);
            await access.redeemRoomCode({ code: used.code }, ctxOf('10.0.0.9'));
            const again = access.reissueRoomCode(admin, used.id, undefined as never, NO_REQUEST_CONTEXT);
            expect(again.issued.replacedId).toBeNull();
            expect(again.row).toMatchObject({ id: used.id, status: 'used' });
            await expect(access.redeemRoomCode({ code: again.issued.code }, ctxOf('10.0.0.30'))).resolves.toMatchObject({ reply: { nUserid: MEMBER } });
            expect(state.audited('room-code-reissue')).toHaveLength(2);
        });

        it('re-issue refusals: not_found, not_case_admin, session_ended, operator_name_required, a person off the team', async () => {
            const admin = await online(ADMIN);
            expect(errOf(() => access.reissueRoomCode(admin, 'nope', {}, NO_REQUEST_CONTEXT)).code).toBe('not_found');
            const a = await issue();
            const sup = await online(SUPER, [CASE_A]);
            expect(errOf(() => access.reissueRoomCode(sup, a.id, {}, NO_REQUEST_CONTEXT)).code).toBe('not_case_admin');
            const op = await operator();
            expect(errOf(() => access.reissueRoomCode(op, a.id, {}, NO_REQUEST_CONTEXT)).code).toBe('operator_name_required');
            expect(access.reissueRoomCode(op, a.id, { operatorName: 'Jo Smith' }, NO_REQUEST_CONTEXT).issued.person.nUserid).toBe(PERSON);
            state.rosterRows = state.rosterRows.filter(m => m.nUserid !== PERSON);
            const current = state.roomCodes.unusedFor(S_LIVE, PERSON);
            expect(errOf(() => access.reissueRoomCode(admin, current.id, {}, NO_REQUEST_CONTEXT)).code).toBe('invalid_request');
            state.patchSession(S_LIVE, { endedAtMs: NOW });
            expect(errOf(() => access.reissueRoomCode(admin, current.id, {}, NO_REQUEST_CONTEXT))).toMatchObject({ code: 'session_ended', status: 409 });
        });

        it('picker: unsealed sessions of the visible cases, live first then by start, with blocked reasons and people', async () => {
            const a = await issue(PERSON);
            const used = await issue(MEMBER);
            await access.redeemRoomCode({ code: used.code }, ctxOf('10.0.0.9'));
            kernelViews.set(S_LIVE, { phase: 'live' } as Partial<KernelSessionView>);
            state.addSession({ nSesid: '5e550000-0000-4000-8000-000000000009', nCaseid: CASE_A, cName: 'Sealed', dStartDt: '2026-09-29 10:00:00', localState: 'sealed', sealedAtMs: NOW - 2 * H });
            const member = await online(MEMBER); // sees A and B, admin of neither (would be refused as box admin by the route)
            const admin = await online(ADMIN);
            const picker = access.roomCodePicker(admin);
            expect(picker.operatorNameRequired).toBe(false);
            expect(picker.sessions.map(s => [s.nSesid, s.phase, s.canIssue, s.blockedReason])).toEqual([
                [S_LIVE, 'live', true, null],
                [S_NEXT, 'not-started', true, null],
                [S_ENDED, 'ended', false, 'session-ended'],
            ]);
            const live = picker.sessions[0];
            expect(live).toMatchObject({ nCaseid: CASE_A, sessionName: 'Day 3 — Morning', caseName: 'Harlow v Mercer Logistics', startAtMs: Date.UTC(2026, 9, 1, 9, 0) });
            expect(live.people.map(p => [p.name, p.role, p.hasUnusedCode, p.hasAccess])).toEqual([
                ['Ann Lee', 'Paralegal', false, true],
                ['Daniel Okafor', 'Client', true, false],
                ['Priya Shah', 'Counsel', false, false],
                ['Sam Reporter', 'Expert', false, false],
            ]);
            expect(picker.sessions[1].people.map(p => p.name)).toEqual(['Ann Lee', 'Daniel Okafor', 'Priya Shah']);
            const forMember = access.roomCodePicker(member);
            expect(forMember.sessions.map(s => [s.nSesid, s.blockedReason])).toEqual([
                [S_LIVE, 'not-case-admin'],
                [S_NEXT, 'not-case-admin'],
                [S_B, 'not-case-admin'],
                [S_ENDED, 'not-case-admin'],
            ]);
            expect(access.roomCodePicker(await operator()).operatorNameRequired).toBe(true);
            expect(a.code).toBeTruthy();
        });
    });

    // -------------------------------------------------------------------------------------------------------------

    describe('operator code, box side (DR7)', () => {
        it("status: today's day, never the code; issued, minter, valid until end of day, uses", async () => {
            const admin = await online(ADMIN);
            expect(access.operatorCodeStatus(admin, NOW)).toEqual({ day: '2026-10-01', issued: false, issuedAtMs: null, mintedBy: null, validUntilMs: null, usesToday: 0 });
            state.operatorCodes.put({ day: '2026-10-01', alg: 'scrypt', salt: 'AA==', hash: 'AA==', scryptN: 1024, issuedAtMs: NOW - H, mintedBy: { nUserid: ADMIN, name: 'Priya Shah' }, source: 'relay' });
            state.operatorCodes.recordUse('2026-10-01', NOW);
            expect(access.operatorCodeStatus(admin, NOW)).toEqual({
                day: '2026-10-01',
                issued: true,
                issuedAtMs: NOW - H,
                mintedBy: { nUserid: ADMIN, name: 'Priya Shah' },
                validUntilMs: Date.UTC(2026, 9, 1, 22, 59, 59, 999),
                usesToday: 1,
            });
            expect(access.operatorCodeStatus(admin, Date.UTC(2026, 9, 1, 23, 0)).day).toBe('2026-10-02'); // midnight in London
        });

        it('issue: relays for an online case admin, returns the code once (formatted), audits without it', async () => {
            const relayed: RelayedOperatorCode = { code: 'opr6z3k91', day: '2026-10-01', validUntilMs: Date.UTC(2026, 9, 1, 22, 59, 59, 999), mintedBy: { nUserid: ADMIN, name: 'Priya Shah' }, replacedEarlier: true };
            relay.mockResolvedValue(relayed);
            const admin = await online(ADMIN);
            const reply: Reply<{ msg: 1; code: string }> = await access.issueOperatorCode(admin, ctxOf('10.0.0.2'));
            expect(reply).toEqual({ code: 'OPR6Z3K91', display: 'OPR-6Z3K-91', day: '2026-10-01', validUntilMs: relayed.validUntilMs, mintedBy: relayed.mintedBy, replacedEarlier: true });
            expect(relay).toHaveBeenCalledWith(admin);
            expect(state.audited('operator-code-issue')).toEqual([expect.objectContaining({ outcome: 'ok', data: { day: '2026-10-01', replacedEarlier: true } })]);
            expect(JSON.stringify(state.auditRows)).not.toContain('6Z3K');
        });

        it('issue refusals: online_sign_in_required, not_case_admin, then the relay\'s offline / cloud_refused (audited)', async () => {
            expect((await rejection(access.issueOperatorCode(await operator(), NO_REQUEST_CONTEXT))).code).toBe('online_sign_in_required');
            expect((await rejection(access.issueOperatorCode(await online(MEMBER), NO_REQUEST_CONTEXT))).code).toBe('not_case_admin');
            expect(relay).not.toHaveBeenCalled();
            relay.mockRejectedValueOnce(new EdgePortError('offline', 'no internet', { offline: true }));
            const offline = await rejection(access.issueOperatorCode(await online(ADMIN), NO_REQUEST_CONTEXT));
            expect([offline.code, offline.status, offline.extra]).toEqual(['offline', 503, { offline: true }]);
            relay.mockRejectedValueOnce(new EdgePortError('cloud_refused', 'nope'));
            expect((await rejection(access.issueOperatorCode(await online(ADMIN), NO_REQUEST_CONTEXT))).status).toBe(502);
            expect(state.audited('operator-code-issue').map(r => r.outcome)).toEqual(['offline', 'cloud_refused']);
        });
    });

    it('a redeemed reply is a RoomCodeRedeemResponse without msg (the LAN adds it)', async () => {
        const { code } = await issue();
        const { reply } = await access.redeemRoomCode({ code }, ctxOf('10.0.0.9'));
        const typed: Reply<RoomCodeRedeemResponse> = reply;
        expect('msg' in typed).toBe(false);
        expect(S_UNKNOWN).toBeTruthy();
    });

    // -------------------------------------------------------------------------------------------------------------

    describe('email sign-in only (DR23: code sign-ins switched off, the v1 default)', () => {
        const disabledOf = async (work: () => unknown): Promise<EdgePortError> => {
            try {
                await work();
            } catch (err) {
                if (err instanceof EdgePortError) return err;
                throw err;
            }
            throw new Error('expected a refusal');
        };

        it('every room-code and operator-code method throws 404 feature_disabled before reading, checking or auditing anything', async () => {
            const admin = await online(ADMIN); // signed in while the codes were on
            const { id } = await issue();
            const shipped = new EdgeAccessService(state, auth, { session: () => null } as unknown as KernelPort, { relayOperatorCode: relay } as unknown as UplinkPort, boxConfig(), clock.now, bus);
            const audits = state.auditRows.length;
            const attempts: Array<[string, () => unknown]> = [
                ['redeemRoomCode', () => shipped.redeemRoomCode({ code: 'K7Q4M2' }, ctxOf('10.0.0.9'))],
                ['operatorSignIn', () => shipped.operatorSignIn({ code: 'OPR6Z3K91' }, ctxOf('10.0.0.9'))],
                ['listRoomCodes', () => shipped.listRoomCodes(admin, null)],
                ['roomCodePicker', () => shipped.roomCodePicker(admin)],
                ['issueRoomCodes', () => shipped.issueRoomCodes(admin, { nSesid: S_LIVE, userIds: [PERSON] }, NO_REQUEST_CONTEXT)],
                ['revokeRoomCode', () => shipped.revokeRoomCode(admin, id, NO_REQUEST_CONTEXT)],
                ['endRoomAccess', () => shipped.endRoomAccess(admin, id, NO_REQUEST_CONTEXT)],
                ['reissueRoomCode', () => shipped.reissueRoomCode(admin, id, {}, NO_REQUEST_CONTEXT)],
                ['operatorCodeStatus', () => shipped.operatorCodeStatus(admin, NOW)],
                ['issueOperatorCode', () => shipped.issueOperatorCode(admin, NO_REQUEST_CONTEXT)],
            ];
            for (const [name, work] of attempts) {
                const err = await disabledOf(work);
                expect([name, err.status, err.toBody()]).toEqual([name, 404, { msg: -1, error: 'feature_disabled', message: expect.any(String) }]);
            }
            expect(state.auditRows).toHaveLength(audits);
            expect(state.roomCodes.get(id)?.status).toBe('unused');
            expect(relay).not.toHaveBeenCalled();
        });

        it('the email sign-in start is never switched off', () => {
            const shipped = new EdgeAccessService(state, auth, {} as KernelPort, {} as UplinkPort, boxConfig(), clock.now, bus);
            const reply = shipped.signInStart({ email: 'ann@firm.example', state: STATE, codeChallenge: CHALLENGE, codeChallengeMethod: 'S256' }, ctxOf('10.0.0.3'));
            expect(reply.authorizeUrl).toContain('login_hint=ann%40firm.example');
        });

        it('one switch on, the other off: only the switched-off kind refuses', async () => {
            const roomsOnly = new EdgeAccessService(state, auth, { session: () => null } as unknown as KernelPort, { relayOperatorCode: relay } as unknown as UplinkPort, boxConfig({ features: { roomCodes: true } }), clock.now, bus);
            const admin = await online(ADMIN);
            expect(roomsOnly.listRoomCodes(admin, null)).toEqual({ rows: [], unusedCount: 0 });
            expect((await disabledOf(() => roomsOnly.operatorCodeStatus(admin, NOW))).toBody()).toMatchObject({ error: 'feature_disabled' });
            expect((await disabledOf(() => roomsOnly.operatorSignIn({ code: 'OPR6Z3K91' }, ctxOf('10.0.0.4')))).status).toBe(404);
        });
    });
});
