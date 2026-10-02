import * as authapi from '../../../authapi/src/services/auth/edge-token.types';

import {
    EDGE_CASE_RT_RANK,
    EDGE_CLOUD_SIGNIN_ERRORS,
    EDGE_CONTRACT_VERSION,
    EDGE_ERROR_CODES,
    EDGE_ERROR_STATUS,
    EDGE_MIN_TOKEN_LIFETIME_MS,
    EDGE_PKCE_CHALLENGE_RE,
    EDGE_PKCE_VERIFIER_RE,
    EDGE_RENEWAL_CEILING_MS,
    EDGE_ROUTES,
    EDGE_SIGNIN_FAILURE_REASON,
    EDGE_SILENT_REFRESH_LEAD_MS,
    EDGE_STATE_RE,
    EDGE_TIMING,
    EDGE_TOKEN_TTL_MS,
    EdgeConfig,
    READINESS_KEYS,
    TransmitterSettings,
    VERDICT_KINDS,
    VERDICT_SEVERITY,
    edgeContractMajor,
    edgeDeviceLinkState,
    edgePath,
    edgeRenewalPlan,
    edgeRoomChip,
    edgeSignInFailureReason,
    formatOperatorCode,
    formatRoomCode,
    isEdgeConfig,
    isEdgeErrorBody,
    isIpv4,
    isRoomCodeShape,
    normalizeEdgeCode,
    normalizeOperatorCode,
    sortVerdictProblems,
    transmitterInterruptingChanges,
    validateTransmitterSettings,
} from './index';

describe('rt-edge contracts', () => {
    describe('mirror of authapi edge-token constants', () => {
        it('lists exactly the cloud sign-in error codes authapi sends', () => {
            expect([...EDGE_CLOUD_SIGNIN_ERRORS]).toEqual([...authapi.EDGE_SIGNIN_ERRORS]);
        });

        it('maps every cloud error to a DR22 reason', () => {
            expect(Object.keys(EDGE_SIGNIN_FAILURE_REASON).sort()).toEqual([...EDGE_CLOUD_SIGNIN_ERRORS].sort());
        });

        it('keeps the token lifetimes, renewal lead, ceiling and PKCE shapes of authapi', () => {
            expect(EDGE_TOKEN_TTL_MS).toBe(authapi.EDGE_TOKEN_TTL_SEC * 1000);
            expect(EDGE_RENEWAL_CEILING_MS).toBe(authapi.EDGE_RENEWAL_CEILING_SEC * 1000);
            expect(EDGE_SILENT_REFRESH_LEAD_MS).toBe(authapi.EDGE_REFRESH_LEAD_SEC * 1000);
            expect(EDGE_MIN_TOKEN_LIFETIME_MS).toBe(authapi.EDGE_MIN_TOKEN_LIFETIME_SEC * 1000);
            expect(EDGE_STATE_RE.source).toBe(authapi.EDGE_STATE_RE.source);
            expect(EDGE_PKCE_CHALLENGE_RE.source).toBe(authapi.EDGE_PKCE_CHALLENGE_RE.source);
            expect(EDGE_PKCE_VERIFIER_RE.source).toBe(authapi.EDGE_PKCE_VERIFIER_RE.source);
            expect(authapi.EDGE_CALLBACK_PATH).toBe('/auth/callback');
        });
    });

    describe('sign-in failure reasons (DR22)', () => {
        it('names cancelled, internet dropped and link expired when known', () => {
            expect(edgeSignInFailureReason('cancelled')).toBe('cancelled');
            expect(edgeSignInFailureReason('network')).toBe('internet-dropped');
            expect(edgeSignInFailureReason('code_expired')).toBe('link-expired');
            expect(edgeSignInFailureReason('code_used')).toBe('link-expired');
            expect(edgeSignInFailureReason('no_box_cases')).toBe('no-access');
            expect(edgeSignInFailureReason('account_mismatch')).toBe('other-account');
        });

        it('falls back to unknown for anything else', () => {
            expect(edgeSignInFailureReason('server_error')).toBe('unknown');
            expect(edgeSignInFailureReason('made-up')).toBe('unknown');
            expect(edgeSignInFailureReason(null)).toBe('unknown');
            expect(edgeSignInFailureReason(undefined)).toBe('unknown');
        });
    });

    describe('renewal plan (DR11, D24, O-13)', () => {
        const authTime = 1_790_000_000;

        it('places the silent refresh 2 h, Renew now 60 min and the offline warning 30 min before expiry', () => {
            const exp = authTime + 12 * 3600;
            const plan = edgeRenewalPlan(exp, authTime);
            expect(plan.expiresAtMs).toBe(exp * 1000);
            expect(plan.ceilingAtMs).toBe((authTime + 24 * 3600) * 1000);
            expect(plan.expiresAtMs - plan.silentRefreshFromMs).toBe(2 * 3_600_000);
            expect(plan.expiresAtMs - plan.renewNowFromMs).toBe(60 * 60_000);
            expect(plan.expiresAtMs - plan.offlineWarnFromMs).toBe(30 * 60_000);
            expect(plan.canRenew).toBe(true);
        });

        it('cannot renew a token that already ends at the 24 h ceiling', () => {
            expect(edgeRenewalPlan(authTime + 24 * 3600, authTime).canRenew).toBe(false);
            expect(edgeRenewalPlan(authTime + 24 * 3600 - 30, authTime).canRenew).toBe(false);
        });
    });

    describe('codes (DR5, DR7, O-9)', () => {
        it('normalizes typed room codes: case, dashes, spaces, O→0, I/L→1', () => {
            expect(normalizeEdgeCode(' k7q-4m2 ')).toBe('K7Q4M2');
            expect(normalizeEdgeCode('o1l-iab')).toBe('0111AB');
            expect(isRoomCodeShape('k7q 4m2')).toBe(true);
            expect(isRoomCodeShape('K7Q4M')).toBe(false);
            expect(isRoomCodeShape('K7Q4MU')).toBe(false);
            expect(formatRoomCode('k7q4m2')).toBe('K7Q-4M2');
            expect(formatRoomCode('abc')).toBe('ABC');
        });

        it('normalizes operator codes with or without the OPR prefix', () => {
            expect(normalizeOperatorCode('opr-6z3k-91')).toBe('OPR6Z3K91');
            expect(normalizeOperatorCode('6Z3K91')).toBe('OPR6Z3K91');
            expect(formatOperatorCode('OPR6Z3K91')).toBe('OPR-6Z3K-91');
            expect(formatOperatorCode('opr-6z3k')).toBe('OPR6Z3K');
        });
    });

    describe('errors', () => {
        it('gives every code an HTTP status and keeps 401 for invalid sign-ins only', () => {
            expect(Object.keys(EDGE_ERROR_STATUS).sort()).toEqual([...EDGE_ERROR_CODES].sort());
            const unauthorized = EDGE_ERROR_CODES.filter(code => EDGE_ERROR_STATUS[code] === 401);
            expect(unauthorized.sort()).toEqual(['token_expired', 'token_revoked', 'unauthenticated']);
            expect(EDGE_ERROR_STATUS.use_cloud).toBe(403);
            expect(EDGE_ERROR_STATUS.offline).toBe(503);
            expect(EDGE_ERROR_STATUS.reauth).toBe(503);
            expect(EDGE_ERROR_STATUS.code_locked).toBe(429);
        });

        it('recognizes error bodies', () => {
            expect(isEdgeErrorBody({ msg: -1, error: 'code_wrong', message: 'x', attemptsLeft: 4 })).toBe(true);
            expect(isEdgeErrorBody({ msg: -1, error: 'nope', message: 'x' })).toBe(false);
            expect(isEdgeErrorBody({ msg: 1 })).toBe(false);
            expect(isEdgeErrorBody(null)).toBe(false);
        });
    });

    describe('routes', () => {
        it('has one method+path per route, all absolute paths', () => {
            const keys = Object.values(EDGE_ROUTES).map(r => `${r.method} ${r.path}`);
            expect(new Set(keys).size).toBe(keys.length);
            for (const route of Object.values(EDGE_ROUTES)) expect(route.path.startsWith('/')).toBe(true);
        });

        it('serves only identity, ping and code entry without a token', () => {
            const open = Object.entries(EDGE_ROUTES).filter(([, r]) => r.auth === 'none').map(([name]) => name).sort();
            expect(open).toEqual(['config', 'operatorCodeSignIn', 'ping', 'roomCodeRedeem', 'signInStart']);
        });

        it('fills and encodes path parameters, refusing a missing one', () => {
            expect(edgePath(EDGE_ROUTES.roomCodeRevoke.path, { id: 'a b/c' })).toBe('/edge/local/room-codes/a%20b%2Fc/revoke');
            expect(() => edgePath(EDGE_ROUTES.roomCodeRevoke.path, {})).toThrow(/:id/);
            expect(edgePath(EDGE_ROUTES.me.path)).toBe('/edge/auth/me');
        });
    });

    describe('status (DR6, DR9)', () => {
        it('orders the room chip: ended, feed stopped, waiting, offline, quiet, live', () => {
            expect(edgeRoomChip('ended', 'paused')).toBe('ended');
            expect(edgeRoomChip('stopped', 'paused')).toBe('feed-stopped');
            expect(edgeRoomChip('waiting', 'paused')).toBe('waiting');
            expect(edgeRoomChip('live', 'paused')).toBe('offline');
            expect(edgeRoomChip('quiet', 'paused')).toBe('offline');
            expect(edgeRoomChip('quiet', 'available')).toBe('quiet');
            expect(edgeRoomChip('live', 'available')).toBe('live');
        });

        it('calls the box lost only after the unreachable grace with the socket down', () => {
            const now = 1_000_000;
            const base = { socketConnected: false, lastStatusAtMs: now - 1000, statusMarkedStale: false, nowMs: now };
            expect(edgeDeviceLinkState({ ...base, lastBoxContactAtMs: now - EDGE_TIMING.boxUnreachableAfterMs + 1 })).toBe('connected');
            expect(edgeDeviceLinkState({ ...base, lastBoxContactAtMs: now - EDGE_TIMING.boxUnreachableAfterMs })).toBe('lost');
            expect(edgeDeviceLinkState({ ...base, lastBoxContactAtMs: null })).toBe('lost');
        });

        it('marks old or box-flagged status stale while connected', () => {
            const now = 1_000_000;
            const base = { socketConnected: true, lastBoxContactAtMs: now, statusMarkedStale: false, nowMs: now };
            expect(edgeDeviceLinkState({ ...base, lastStatusAtMs: now - EDGE_TIMING.statusStaleAfterMs - 1 })).toBe('stale');
            expect(edgeDeviceLinkState({ ...base, lastStatusAtMs: null })).toBe('stale');
            expect(edgeDeviceLinkState({ ...base, lastStatusAtMs: now, statusMarkedStale: true })).toBe('stale');
            expect(edgeDeviceLinkState({ ...base, lastStatusAtMs: now })).toBe('connected');
        });

        it('ranks dashboard cards live, next today, today not started, other', () => {
            expect(EDGE_CASE_RT_RANK.live).toBeLessThan(EDGE_CASE_RT_RANK['next-today']);
            expect(EDGE_CASE_RT_RANK['next-today']).toBeLessThan(EDGE_CASE_RT_RANK['today-not-started']);
            expect(EDGE_CASE_RT_RANK['today-not-started']).toBeLessThan(EDGE_CASE_RT_RANK.other);
        });
    });

    describe('readiness and verdict (DR12, DR15)', () => {
        it('has the eight readiness checks', () => {
            expect(READINESS_KEYS).toHaveLength(8);
        });

        it('ranks a disk-write failure above a feed drop and keeps every problem', () => {
            expect(VERDICT_KINDS[0]).toBe('recording-failed');
            expect(Object.keys(VERDICT_SEVERITY).sort()).toEqual([...VERDICT_KINDS].sort());
            const sorted = sortVerdictProblems([
                { kind: 'clock' as const, sinceMs: 1 },
                { kind: 'feed-stopped' as const, sinceMs: 5 },
                { kind: 'recording-failed' as const, sinceMs: 9 },
                { kind: 'feed-stopped' as const, sinceMs: 2 },
            ]);
            expect(sorted.map(p => `${p.kind}@${p.sinceMs}`)).toEqual(['recording-failed@9', 'feed-stopped@2', 'feed-stopped@5', 'clock@1']);
        });
    });

    describe('transmitter (DR13)', () => {
        const dial: TransmitterSettings = {
            mode: 'dial', protocol: 'caseview', host: '192.168.20.31', port: 8080, autoReconnect: true, receivingSesid: null,
        };

        it('validates IPv4 and the port range in dial mode only', () => {
            expect(isIpv4('192.168.20.44')).toBe(true);
            expect(isIpv4('192.168.020.44')).toBe(false);
            expect(isIpv4('256.1.1.1')).toBe(false);
            expect(validateTransmitterSettings(dial)).toEqual({});
            expect(validateTransmitterSettings({ ...dial, host: 'laptop', port: 70000 })).toEqual({ host: 'ipv4', port: 'port-range' });
            expect(validateTransmitterSettings({ ...dial, host: null, port: null, protocol: null })).toEqual({ protocol: 'required', host: 'required', port: 'required' });
            expect(validateTransmitterSettings({ ...dial, receivingSesid: 's9' }, ['s1'])).toEqual({ receivingSesid: 'unknown-session' });
            expect(validateTransmitterSettings({ ...dial, mode: 'listen', host: null, port: null })).toEqual({});
        });

        it('lists the changes that interrupt a live feed', () => {
            expect(transmitterInterruptingChanges(dial, { ...dial, host: '192.168.20.44' })).toEqual(['host']);
            expect(transmitterInterruptingChanges(dial, { ...dial, autoReconnect: false })).toEqual(['autoReconnect']);
            expect(transmitterInterruptingChanges({ ...dial, autoReconnect: false }, dial)).toEqual([]);
            expect(transmitterInterruptingChanges(dial, { ...dial, mode: 'listen' })).toEqual(['mode']);
            expect(transmitterInterruptingChanges({ ...dial, mode: 'listen' }, { ...dial, mode: 'listen', host: '10.0.0.1' })).toEqual([]);
            expect(transmitterInterruptingChanges(null, dial)).toEqual([]);
        });
    });

    describe('box config (D8, §10 #22)', () => {
        const config: EdgeConfig = {
            contractVersion: EDGE_CONTRACT_VERSION,
            nEdgeid: 'e1',
            boxName: 'Court 3',
            venueLabel: 'Live transcript · Court 3',
            boxHost: 'k7q2m9x4.etabella-edge.net',
            roomWifiSsid: 'eTabella-Court3',
            timeZone: 'Europe/London',
            cloudOrigin: 'https://etabella.net',
            cloudPingUrl: 'https://etabella.net/favicon.ico',
            pkce: {
                authorizeUrl: 'https://etabella.net/auth/edge',
                tokenUrl: 'https://etabella.net/authapi/edge/token',
                refreshUrl: 'https://etabella.net/authapi/edge/refresh',
                callbackPath: '/auth/callback',
                codeChallengeMethod: 'S256',
                audience: 'edge:e1',
            },
            features: {
                roomCodes: true, operatorCode: true, transmitterDialMode: true,
                offlineMarks: false, reporterPasswordOnBox: false, documentsOnBox: false,
            },
        };

        it('accepts a complete config and refuses a missing or partial one', () => {
            expect(isEdgeConfig(config)).toBe(true);
            expect(isEdgeConfig({ ...config, roomWifiSsid: null })).toBe(true);
            expect(isEdgeConfig(null)).toBe(false);
            expect(isEdgeConfig({ ...config, nEdgeid: '' })).toBe(false);
            expect(isEdgeConfig({ ...config, pkce: { ...config.pkce, codeChallengeMethod: 'plain' } })).toBe(false);
            expect(isEdgeConfig({ ...config, features: { ...config.features, roomCodes: 'yes' } })).toBe(false);
        });

        it('reads the contract major', () => {
            expect(edgeContractMajor(EDGE_CONTRACT_VERSION)).toBe(1);
            expect(edgeContractMajor('2.3.4')).toBe(2);
            expect(Number.isNaN(edgeContractMajor('v1'))).toBe(true);
        });
    });
});
