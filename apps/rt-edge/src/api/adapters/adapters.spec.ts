import { DomainError } from '@app/api-kernel';

import { ResponseRecorder } from '../../lan/rt-data/response-recorder';
import { AuthPort, EdgePortError, EdgePrincipal, RelayAnswer } from '../../ports';
import { callerOfPrincipal, EdgeCallerResolver } from './edge-caller.resolver';
import { EdgeCaseAccess } from './edge-case-access';
import { EdgeEnvelope, edgeErrorOfDomain, relayAnswerOf } from './edge-envelope';
import { EdgeEventDelivery } from './edge-event-delivery';

/*
 * The box's bindings of the kernel ports (plan §3.3), one by one: the Caller a box principal becomes, what a sign-in
 * failure versus a box condition does, case scope by list, the DomainError → contract code map, a relayed answer
 * written byte for byte, and the event no-op.
 */

const principal = (over: Partial<EdgePrincipal> = {}): EdgePrincipal =>
    ({ kind: 'online', userId: 'u1', name: 'Daniel', email: null, caseIds: ['CA', 'cb'], adminCaseIds: [], isBoxAdmin: false, isSuperAdmin: false, validUntil: 1, untilSessionEnds: false, jti: 'j', issuedAt: 0, authTime: null, mintedBy: null, operatorDay: null, deviceHash: null, forwardable: true, token: 't', ...over }) as EdgePrincipal;

describe('EdgeCallerResolver (CALLER_RESOLVER on the box)', () => {
    it('an online principal is an edge-online Caller with the box cases as its scope; a room code is edge-box', () => {
        expect(callerOfPrincipal(principal())).toEqual({ userId: 'u1', family: 'edge-online', isPlatformAdmin: false, caseScope: ['CA', 'cb'] });
        expect(callerOfPrincipal(principal({ kind: 'room-code', isSuperAdmin: true } as Partial<EdgePrincipal>))).toEqual(expect.objectContaining({ family: 'edge-box', isPlatformAdmin: true }));
        expect(Object.isFrozen(callerOfPrincipal(principal()))).toBe(true);
    });

    it('an operator session is not a user: online_sign_in_required', () => {
        expect(() => callerOfPrincipal(principal({ kind: 'operator', userId: null } as Partial<EdgePrincipal>))).toThrow(EdgePortError);
        try {
            callerOfPrincipal(principal({ kind: 'operator', userId: null } as Partial<EdgePrincipal>));
        } catch (err) {
            expect((err as EdgePortError).code).toBe('online_sign_in_required');
        }
    });

    it('a sign-in failure is null (401 by CallerGuard); a box condition is thrown as its own code', async () => {
        const auth = (fail: EdgePortError | null) => ({ authenticate: async () => { if (fail) throw fail; return principal(); } }) as unknown as AuthPort;
        const req = { headers: { authorization: 'Bearer x' }, socket: { remoteAddress: '::ffff:10.0.0.9' } };
        expect(await new EdgeCallerResolver(auth(null)).resolve(req)).toEqual(expect.objectContaining({ userId: 'u1', family: 'edge-online' }));
        for (const code of ['unauthenticated', 'token_expired', 'token_revoked'] as const) {
            expect([code, await new EdgeCallerResolver(auth(new EdgePortError(code, 'no'))).resolve(req)]).toEqual([code, null]);
        }
        await expect(new EdgeCallerResolver(auth(new EdgePortError('box_not_linked', 'revoked'))).resolve(req)).rejects.toMatchObject({ code: 'box_not_linked' });
        await expect(new EdgeCallerResolver(auth(new EdgePortError('rate_limited', 'slow down', { retryAfterSec: 3 }))).resolve(req)).rejects.toMatchObject({ code: 'rate_limited' });
    });
});

describe('EdgeCaseAccess (CASE_ACCESS on the box)', () => {
    const access = new EdgeCaseAccess();
    const caller = { userId: 'u1', family: 'edge-online' as const, isPlatformAdmin: false, caseScope: ['CA000000-0000-4000-8000-00000000000A'] };

    it('a case in the sign-in scope passes, compared case-insensitively', async () => {
        await expect(access.assertMember(caller, 'ca000000-0000-4000-8000-00000000000a')).resolves.toBeUndefined();
    });

    it('a case outside the scope, or a membership-scoped caller, is forbidden naming the field', async () => {
        await expect(access.assertMember(caller, 'ca000000-0000-4000-8000-00000000000b')).rejects.toMatchObject({ code: 'forbidden', detail: { field: 'nCaseid' } });
        await expect(access.assertMember({ ...caller, caseScope: 'membership' }, 'ca000000-0000-4000-8000-00000000000a')).rejects.toMatchObject({ code: 'forbidden' });
    });
});

describe('EdgeEnvelope (ERROR_ENVELOPE on the box)', () => {
    it('maps every DomainError code to the contract code with the same meaning; EdgePortErrors and unknowns pass through', () => {
        const map = (code: ConstructorParameters<typeof DomainError>[0]) => edgeErrorOfDomain(new DomainError(code, 'why')) as EdgePortError;
        expect([map('invalid').code, map('unauthenticated').code, map('forbidden').code, map('not_found').code, map('conflict').code]).toEqual(['invalid_request', 'unauthenticated', 'use_cloud', 'not_found', 'invalid_request']);
        expect([map('offline').code, map('reauth').code, map('upstream').code, map('cloud_refused').code, map('unavailable').code]).toEqual(['offline', 'reauth', 'cloud_refused', 'cloud_refused', 'server_error']);
        expect(map('offline').extra).toEqual({ offline: true });
        expect(map('forbidden').extra).toEqual({ useCloud: true });
        expect(map('invalid').message).toBe('why');
        const port = new EdgePortError('box_not_linked', 'x');
        expect(edgeErrorOfDomain(port)).toBe(port);
        const plain = new Error('boom');
        expect(edgeErrorOfDomain(plain)).toBe(plain);
    });

    it('sends a DomainError as the contract envelope with Cache-Control: no-store', () => {
        const res = new ResponseRecorder();
        new EdgeEnvelope().send(res as never, new DomainError('invalid', 'nCaseid is required'), 'core.myteamusers');
        const a = res.answer();
        expect([a.status, a.body, a.headers['cache-control']]).toEqual([400, { msg: -1, error: 'invalid_request', message: 'nCaseid is required' }, 'no-store']);
    });

    it('a relayed answer carried by a DomainError is written byte for byte, status and headers included', () => {
        const relayed: RelayAnswer = { status: 503, headers: { 'cache-control': 'no-store', 'x-edge-source': 'box', 'x-edge-offline': '1' }, body: { msg: -1 }, raw: Buffer.from('{"msg":-1,"error":"offline","message":"m","offline":true}') };
        const err = new DomainError('offline', 'relayed', { relay: relayed });
        expect(relayAnswerOf(err)).toBe(relayed);
        expect(relayAnswerOf(new DomainError('offline', 'plain'))).toBeNull();
        expect(relayAnswerOf(new Error('x'))).toBeNull();
        const res = new ResponseRecorder();
        new EdgeEnvelope().send(res as never, err, null);
        const a = res.answer();
        expect([a.status, a.headers, a.raw.toString('utf8')]).toEqual([503, relayed.headers, relayed.raw.toString('utf8')]);
    });
});

describe('EdgeEventDelivery (EVENT_DELIVERY on the box)', () => {
    it('publishes nothing and never throws', () => {
        const delivery = new EdgeEventDelivery();
        expect(() => delivery.publish({ kind: 'notification', toUserIds: ['u'], template: 't', data: {} })).not.toThrow();
        expect(() => delivery.publish({ kind: 'marks.changed', nCaseid: 'c', nSesid: null, mark: 'F', op: 'insert', id: 'f', audienceBefore: [] })).not.toThrow();
    });
});
