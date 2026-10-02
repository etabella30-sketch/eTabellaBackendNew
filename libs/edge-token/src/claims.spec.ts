import {
    EDGE_BOX_TOKEN_KINDS, EDGE_BOX_TOKEN_TYP, EDGE_TOKEN_TYP, edgeAudience, edgeBoxIssuer, edgeOperatorSubject, isEdgeDay,
} from './constants';
import {
    edgeBoxIdOfIssuer, isEdgeBoxTokenClaims, isEdgeOperatorTokenClaims, isEdgeRoomTokenClaims, isEdgeTokenClaims,
} from './claims';

const H = 3600;
const BOX = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const BOX2 = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const USER = '11111111-1111-4111-8111-111111111111';
const ADMIN = '33333333-3333-4333-8333-333333333333';
const SES = '5e550000-0000-4000-8000-000000000001';
const CASE_A = 'ca000000-0000-4000-8000-00000000000a';
const NOW = 1_790_000_000;

const edge = (over: Record<string, unknown> = {}) => ({
    iss: 'etabella-authapi', sub: USER, userId: USER, aud: `edge:${BOX}`, edge: BOX, cases: [CASE_A], scope: 'rt',
    jti: 'j1', iat: NOW, exp: NOW + 12 * H, auth_time: NOW - H, ...over,
});
const room = (over: Record<string, unknown> = {}) => ({
    iss: `box:${BOX}`, aud: `edge:${BOX}`, kind: 'room-code', sub: USER, jti: 'r1', iat: NOW, exp: NOW + 24 * H, nSesid: SES, mintedBy: ADMIN, ...over,
});
const operator = (over: Record<string, unknown> = {}) => ({
    iss: `box:${BOX}`, aud: `edge:${BOX}`, kind: 'operator', sub: 'operator:2026-10-01', jti: 'o1', iat: NOW, exp: NOW + 10 * H,
    day: '2026-10-01', mintedBy: ADMIN, ...over,
});

describe('constants', () => {
    it('audience, issuer and operator subject are built in lower case from the box id', () => {
        expect(edgeAudience(BOX.toUpperCase())).toBe(`edge:${BOX}`);
        expect(edgeBoxIssuer(BOX.toUpperCase())).toBe(`box:${BOX}`);
        expect(edgeOperatorSubject('2026-10-01')).toBe('operator:2026-10-01');
    });

    it('the two token families have distinct JWS types, and the box kinds are the contract\'s non-online kinds', () => {
        expect(EDGE_TOKEN_TYP).toBe('edge+jwt');
        expect(EDGE_BOX_TOKEN_TYP).toBe('edge-box+jwt');
        expect(EDGE_BOX_TOKEN_TYP).not.toBe(EDGE_TOKEN_TYP);
        expect([...EDGE_BOX_TOKEN_KINDS]).toEqual(['room-code', 'operator']);
    });

    it('isEdgeDay accepts real calendar days only', () => {
        for (const d of ['2026-10-01', '2028-02-29', '2000-02-29', '2026-12-31', '2026-04-30']) expect(isEdgeDay(d)).toBe(true);
        for (const d of ['2026-02-29', '2100-02-29', '2026-04-31', '2026-13-01', '2026-00-10', '2026-10-00', '2026-1-01', '26-10-01',
            '2026-10-01T00:00', ' 2026-10-01', '1969-12-31', '', null, 20261001]) {
            expect(isEdgeDay(d)).toBe(false);
        }
    });
});

describe('isEdgeTokenClaims', () => {
    it('accepts authapi\'s claims', () => {
        expect(isEdgeTokenClaims(edge())).toBe(true);
        expect(isEdgeTokenClaims(edge({ auth_time: NOW }))).toBe(true); // signed in this very second
    });

    it('refuses every broken claim', () => {
        const bad: Array<Record<string, unknown>> = [
            { iss: 'x' }, { scope: 'admin' }, { sub: 'x', userId: 'x' }, { userId: ADMIN }, { edge: 'x' }, { aud: `edge:${BOX2}` },
            { aud: `EDGE:${BOX}` }, { cases: [] }, { cases: ['x'] }, { cases: CASE_A }, { jti: '' }, { jti: 'j'.repeat(65) },
            { iat: -1 }, { iat: 1.2 }, { exp: NOW }, { exp: NOW - 1 }, { auth_time: NOW + 1 }, { exp: Number.MAX_SAFE_INTEGER + 2 },
        ];
        for (const over of bad) expect(isEdgeTokenClaims(edge(over))).toBe(false);
        for (const v of [null, undefined, 'x', 1, [], [edge()]]) expect(isEdgeTokenClaims(v)).toBe(false);
    });

    it('a box token is never an edge token, and an edge token never a box token', () => {
        expect(isEdgeTokenClaims(room())).toBe(false);
        expect(isEdgeTokenClaims(operator())).toBe(false);
        expect(isEdgeBoxTokenClaims(edge())).toBe(false);
    });
});

describe('box token claims (room-code: O-9, operator: DR7 / O-10)', () => {
    it('edgeBoxIdOfIssuer reads `box:<uuid>` in lower case only', () => {
        expect(edgeBoxIdOfIssuer(`box:${BOX}`)).toBe(BOX);
        for (const iss of [`box:${BOX.toUpperCase()}`, `BOX:${BOX}`, 'box:', 'box:nope', `edge:${BOX}`, 'etabella-authapi', null, 1]) {
            expect(edgeBoxIdOfIssuer(iss)).toBeNull();
        }
    });

    it('accepts a room-code token of up to 24 h and an operator token of up to 25 h (a daylight-saving day)', () => {
        expect(isEdgeRoomTokenClaims(room())).toBe(true);
        expect(isEdgeBoxTokenClaims(room())).toBe(true);
        expect(isEdgeOperatorTokenClaims(operator())).toBe(true);
        expect(isEdgeOperatorTokenClaims(operator({ exp: NOW + 25 * H }))).toBe(true);
        expect(isEdgeBoxTokenClaims(operator())).toBe(true);
    });

    it('refuses a broken room-code token', () => {
        const bad: Array<Record<string, unknown>> = [
            { kind: 'operator' }, { kind: 'online' }, { iss: `box:${BOX2}` }, { iss: 'etabella-authapi' }, { aud: `edge:${BOX2}` },
            { sub: 'operator:2026-10-01' }, { sub: 'x' }, { nSesid: undefined }, { nSesid: 'x' }, { day: '2026-10-01' },
            { mintedBy: undefined }, { mintedBy: 'x' }, { jti: '' }, { jti: 'j'.repeat(65) }, { iat: 1.5 }, { exp: NOW },
            { exp: NOW + 24 * H + 1 },
        ];
        for (const over of bad) expect(isEdgeRoomTokenClaims(room(over))).toBe(false);
    });

    it('refuses a broken operator token', () => {
        const bad: Array<Record<string, unknown>> = [
            { kind: 'room-code' }, { day: '2026-02-30' }, { day: undefined }, { sub: 'operator:2026-10-02' }, { sub: USER },
            { nSesid: SES }, { iss: `box:${BOX2}` }, { aud: `edge:${BOX2}` }, { mintedBy: 'x' }, { exp: NOW + 25 * H + 1 }, { exp: NOW - 5 },
        ];
        for (const over of bad) expect(isEdgeOperatorTokenClaims(operator(over))).toBe(false);
        for (const v of [null, undefined, [], 'x']) expect(isEdgeBoxTokenClaims(v)).toBe(false);
    });
});
