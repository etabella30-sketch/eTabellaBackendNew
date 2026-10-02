import type { EdgeActor } from '../contracts';
import { EDGE_REVOCATION_RETAIN_MS, EdgePortError, isEdgePortError, isRevokedByUserCutoff } from '../ports';
import { assignment, tempState, TempState } from './testing/fixtures';

const T0 = Date.UTC(2026, 9, 1, 8, 0, 0);
const ADMIN: EdgeActor = { nUserid: 'u-admin', name: 'Priya Shah', via: 'online', operatorName: null };
const SKEW = 5 * 60_000;

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

describe('state room codes, operator codes and revocations', () => {
    let t: TempState;

    beforeEach(() => {
        t = tempState();
        t.state.sessions.upsertAssignment(assignment('ses-a'), T0);
        t.state.sessions.upsertAssignment(assignment('ses-b', { nCaseid: 'case-2' }), T0);
    });
    afterEach(async () => {
        await t.cleanup();
    });

    const issue = (id: string, extra: Record<string, unknown> = {}) =>
        t.state.roomCodes.insert({ id, nSesid: 'ses-a', nCaseid: 'case-1', nUserid: 'u-2', codeHash: `hash-${id}`, issuedAtMs: T0, issuedBy: ADMIN, replacedId: null, ...extra });

    describe('RoomCodesRepo (DR10, O-9)', () => {
        it('inserts an unused code (hash only) and finds it by id and hash', () => {
            const rc = issue('rc1');
            expect(rc).toMatchObject({ id: 'rc1', status: 'unused', codeHash: 'hash-rc1', deviceHash: null, usedAtMs: null, tokenJti: null, issuedBy: ADMIN });
            expect(Object.isFrozen(rc)).toBe(true);
            expect(t.state.roomCodes.findByHash('hash-rc1')!.id).toBe('rc1');
            expect(t.state.roomCodes.unusedFor('ses-a', 'u-2')!.id).toBe('rc1');
            expect(t.state.roomCodes.usedFor('ses-a', 'u-2')).toBeNull();
        });

        it('refuses unknown sessions, duplicate hashes, and a second unused code for the same person unless it names the one it replaces', () => {
            issue('rc1');
            expectCode(() => t.state.roomCodes.insert({ id: 'x', nSesid: 'ghost', nCaseid: 'c', nUserid: 'u', codeHash: 'hx', issuedAtMs: T0, issuedBy: ADMIN, replacedId: null }), 'session_not_found');
            expectCode(() => issue('rc2', { codeHash: 'hash-rc1', nUserid: 'u-9' }), 'invalid_request');
            expectCode(() => issue('rc2'), 'invalid_request');
            const replacement = issue('rc2', { replacedId: 'rc1', issuedAtMs: T0 + 5 });
            expect(replacement.replacedId).toBe('rc1');
            expect(t.state.roomCodes.get('rc1')).toMatchObject({ status: 'revoked', revokedAtMs: T0 + 5 });
            expect(t.state.roomCodes.unusedFor('ses-a', 'u-2')!.id).toBe('rc2');
        });

        it('binds the first redemption, re-enters on the same device with a new token, refuses another device', () => {
            issue('rc1');
            const used = t.state.roomCodes.bind('rc1', { deviceHash: 'dev-1', deviceLabel: 'iPad', tokenJti: 'jti-1', atMs: T0 + 10 })!;
            expect(used).toMatchObject({ status: 'used', deviceHash: 'dev-1', deviceLabel: 'iPad', usedAtMs: T0 + 10, tokenJti: 'jti-1' });
            const again = t.state.roomCodes.bind('rc1', { deviceHash: 'dev-1', deviceLabel: 'iPad', tokenJti: 'jti-2', atMs: T0 + 20 })!;
            expect(again).toMatchObject({ status: 'used', usedAtMs: T0 + 10, tokenJti: 'jti-2' });
            expect(t.state.roomCodes.bind('rc1', { deviceHash: 'dev-2', deviceLabel: 'Mac', tokenJti: 'jti-3', atMs: T0 + 30 })).toBeNull();
            expect(t.state.roomCodes.usedFor('ses-a', 'u-2')!.id).toBe('rc1');
            expectCode(() => t.state.roomCodes.bind('nope', { deviceHash: 'd', deviceLabel: null, tokenJti: 'j', atMs: T0 }), 'not_found');
            expectCode(() => t.state.roomCodes.bind('rc1', { deviceHash: '', deviceLabel: null, tokenJti: 'j', atMs: T0 }), 'invalid_request');
        });

        it('finish is compare-and-set: revoke/expire only unused, end only used', () => {
            issue('rc1');
            issue('rc2', { nUserid: 'u-3' });
            expect(t.state.roomCodes.finish('rc1', 'ended', T0)).toBeNull();
            expect(t.state.roomCodes.finish('rc1', 'revoked', T0 + 1)).toMatchObject({ status: 'revoked', revokedAtMs: T0 + 1 });
            expect(t.state.roomCodes.finish('rc1', 'revoked', T0 + 2)).toBeNull();
            t.state.roomCodes.bind('rc2', { deviceHash: 'd', deviceLabel: null, tokenJti: 'j', atMs: T0 + 3 });
            expect(t.state.roomCodes.finish('rc2', 'expired', T0 + 4)).toBeNull();
            expect(t.state.roomCodes.finish('rc2', 'ended', T0 + 5)).toMatchObject({ status: 'ended', endedAtMs: T0 + 5 });
            expectCode(() => t.state.roomCodes.finish('nope', 'revoked', T0), 'not_found');
            expectCode(() => t.state.roomCodes.finish('rc2', 'used' as never, T0), 'invalid_request');
        });

        it('expireSession expires every unused code of the session only; a bound code survives', () => {
            issue('rc1');
            issue('rc2', { nUserid: 'u-3' });
            t.state.roomCodes.bind('rc2', { deviceHash: 'd', deviceLabel: null, tokenJti: 'j', atMs: T0 });
            t.state.roomCodes.insert({ id: 'rc3', nSesid: 'ses-b', nCaseid: 'case-2', nUserid: 'u-2', codeHash: 'h3', issuedAtMs: T0, issuedBy: ADMIN, replacedId: null });
            expect(t.state.roomCodes.expireSession('ses-a', T0 + 9)).toBe(1);
            expect(t.state.roomCodes.get('rc1')).toMatchObject({ status: 'expired', expiredAtMs: T0 + 9 });
            expect(t.state.roomCodes.get('rc2')!.status).toBe('used');
            expect(t.state.roomCodes.get('rc3')!.status).toBe('unused');
        });

        it('lists newest first, by session or by visible cases', () => {
            issue('rc1', { issuedAtMs: T0 });
            issue('rc2', { nUserid: 'u-3', issuedAtMs: T0 + 1 });
            t.state.roomCodes.insert({ id: 'rc3', nSesid: 'ses-b', nCaseid: 'case-2', nUserid: 'u-2', codeHash: 'h3', issuedAtMs: T0 + 2, issuedBy: ADMIN, replacedId: null });
            expect(t.state.roomCodes.list().map(r => r.id)).toEqual(['rc3', 'rc2', 'rc1']);
            expect(t.state.roomCodes.list({ nSesid: 'ses-a' }).map(r => r.id)).toEqual(['rc2', 'rc1']);
            expect(t.state.roomCodes.list({ nCaseids: ['case-2'] }).map(r => r.id)).toEqual(['rc3']);
            expect(t.state.roomCodes.list({ nCaseids: [] })).toEqual([]);
        });
    });

    describe('OperatorCodesRepo (DR7, O-10)', () => {
        const code = { day: '2026-10-01', alg: 'scrypt' as const, salt: 'c2FsdA==', hash: 'aGFzaA==', scryptN: 16384, issuedAtMs: T0, mintedBy: { nUserid: 'u-admin', name: 'Priya Shah' }, source: 'relay' as const };

        it('stores a day hash, counts uses, replaces (resetting uses) and purges old days', () => {
            expect(t.state.operatorCodes.put(code)).toEqual({ replacedEarlier: false });
            expect(t.state.operatorCodes.recordUse('2026-10-01', T0 + 1)).toBe(1);
            expect(t.state.operatorCodes.recordUse('2026-10-01', T0 + 2)).toBe(2);
            expect(t.state.operatorCodes.get('2026-10-01')).toMatchObject({ uses: 2, lastUsedAtMs: T0 + 2, source: 'relay', mintedBy: { nUserid: 'u-admin', name: 'Priya Shah' } });
            expect(t.state.operatorCodes.put({ ...code, hash: 'bmV3', source: 'assignments' })).toEqual({ replacedEarlier: true });
            expect(t.state.operatorCodes.get('2026-10-01')).toMatchObject({ uses: 0, lastUsedAtMs: null, hash: 'bmV3', source: 'assignments' });
            t.state.operatorCodes.put({ ...code, day: '2026-09-30' });
            expect(t.state.operatorCodes.purgeBefore('2026-10-01')).toBe(1);
            expect(t.state.operatorCodes.get('2026-09-30')).toBeNull();
            expectCode(() => t.state.operatorCodes.recordUse('2026-09-29', T0), 'not_found');
            expectCode(() => t.state.operatorCodes.put({ ...code, day: '2026-13-01' }), 'invalid_request');
            expectCode(() => t.state.operatorCodes.put({ ...code, alg: 'md5' as never }), 'invalid_request');
            expectCode(() => t.state.operatorCodes.purgeBefore('yesterday'), 'invalid_request');
        });
    });

    describe('RevocationsRepo (§8.4)', () => {
        it('applies a cloud list with the BOX receipt time (+5 min skew), never the cloud since', () => {
            const res = t.state.revocations.applyCloud({ users: ['u-7', '', 7 as never], jtis: ['jti-1', 'jti-1', 'x'.repeat(80)], since: T0 - 3_600_000 }, T0);
            expect(res).toEqual({ newJtis: ['jti-1'], newUsers: ['u-7'] });
            expect(t.state.revocations.cloudSince()).toBe(T0 - 3_600_000);
            expect(t.state.revocations.isJtiDenied('jti-1', T0 + 1)).toBe(true);
            expect(t.state.revocations.isJtiDenied('jti-1', T0 + EDGE_REVOCATION_RETAIN_MS)).toBe(false);
            expect(t.state.revocations.userRevokedAtMs('u-7')).toBe(T0 + SKEW);
            // A token issued just after the cloud's `since` but before arrival + skew is revoked.
            expect(isRevokedByUserCutoff((T0 + 60_000) / 1000, t.state.revocations.userRevokedAtMs('u-7'))).toBe(true);
            expect(isRevokedByUserCutoff((T0 + SKEW + 1000) / 1000, t.state.revocations.userRevokedAtMs('u-7'))).toBe(false);
            // A repeat is not new, and a cut-off never moves earlier.
            expect(t.state.revocations.applyCloud({ users: ['u-7'], jtis: ['jti-1'], since: T0 }, T0 - 10_000)).toEqual({ newJtis: [], newUsers: [] });
            expect(t.state.revocations.userRevokedAtMs('u-7')).toBe(T0 + SKEW);
            expect(t.state.revocations.cloudSince()).toBe(T0);
        });

        it('revokeUser moves a cut-off only forward; denyJti keeps the later expiry', () => {
            t.state.revocations.revokeUser('u-8', T0);
            t.state.revocations.revokeUser('u-8', T0 - 60_000);
            expect(t.state.revocations.userRevokedAtMs('u-8')).toBe(T0 + SKEW);
            t.state.revocations.revokeUser('u-8', T0 + 60_000);
            expect(t.state.revocations.userRevokedAtMs('u-8')).toBe(T0 + 60_000 + SKEW);
            t.state.revocations.denyJti('jti-9', T0 + 1000, 'sign-out', T0);
            t.state.revocations.denyJti('jti-9', T0 + 500, 'replaced', T0);
            expect(t.state.revocations.isJtiDenied('jti-9', T0 + 900)).toBe(true);
            expect(t.state.revocations.isJtiDenied('jti-9', T0 + 1000)).toBe(false);
            expect(t.state.revocations.userRevokedAtMs('nobody')).toBeNull();
            expectCode(() => t.state.revocations.denyJti('jti-x', T0, 'bogus' as never, T0), 'invalid_request');
            expectCode(() => t.state.revocations.revokeUser('', T0), 'invalid_request');
        });

        it('prunes expired jti rows and user cut-offs past their keep time', () => {
            t.state.revocations.denyJti('jti-old', T0 + 10, 'sign-out', T0);
            t.state.revocations.denyJti('jti-new', T0 + 10_000_000, 'sign-out', T0);
            t.state.revocations.revokeUser('u-1', T0);
            expect(t.state.revocations.prune(T0 + 11)).toBe(1);
            expect(t.state.revocations.prune(T0 + SKEW + EDGE_REVOCATION_RETAIN_MS + 1)).toBe(2);
            expect(t.state.revocations.userRevokedAtMs('u-1')).toBeNull();
        });
    });
});
