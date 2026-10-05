/**
 * Every box route the box screens call, with its method, path (relative to the box origin) and who may call it.
 * The box controllers and the FE service both read their paths from here (O-17: exact paths decided by this file).
 *
 * Auth levels:
 * - `none`: no token (the box ignores any Authorization header);
 * - `signed-in`: any valid bearer token (online, room-code or operator);
 * - `box-admin`: O-11 — case admin of ≥1 box case, super-admin, or today's operator-code session (`logClear` then
 *   lets only a super-admin through, user decision 2026-10-04: anyone else gets `not_box_admin`);
 * - `online-case-admin`: an ONLINE edge token of a case admin of ≥1 box case, or of a super-admin.
 */

export type EdgeHttpMethod = 'GET' | 'POST' | 'PUT';
export type EdgeRouteAuth = 'none' | 'signed-in' | 'box-admin' | 'online-case-admin';

export interface EdgeRouteDef {
    readonly method: EdgeHttpMethod;
    readonly path: string;
    readonly auth: EdgeRouteAuth;
}

export const EDGE_ROUTES = {
    // identity and reachability
    config: { method: 'GET', path: '/edge-config.json', auth: 'none' },
    ping: { method: 'GET', path: '/edge/ping', auth: 'none' },
    // sign-in
    signInStart: { method: 'POST', path: '/edge/auth/sign-in/start', auth: 'none' },
    roomCodeRedeem: { method: 'POST', path: '/edge/auth/room-code', auth: 'none' },
    operatorCodeSignIn: { method: 'POST', path: '/edge/auth/operator-code', auth: 'none' },
    me: { method: 'GET', path: '/edge/auth/me', auth: 'signed-in' },
    signOut: { method: 'POST', path: '/edge/auth/sign-out', auth: 'signed-in' },
    // dashboard and chips
    localCases: { method: 'GET', path: '/edge/local/cases', auth: 'signed-in' },
    status: { method: 'GET', path: '/edge/local/status', auth: 'signed-in' },
    // room codes
    roomCodes: { method: 'GET', path: '/edge/local/room-codes', auth: 'box-admin' },
    roomCodePicker: { method: 'GET', path: '/edge/local/room-codes/picker', auth: 'box-admin' },
    roomCodesIssue: { method: 'POST', path: '/edge/local/room-codes', auth: 'box-admin' },
    roomCodeRevoke: { method: 'POST', path: '/edge/local/room-codes/:id/revoke', auth: 'box-admin' },
    roomCodeEndAccess: { method: 'POST', path: '/edge/local/room-codes/:id/end-access', auth: 'box-admin' },
    roomCodeReissue: { method: 'POST', path: '/edge/local/room-codes/:id/reissue', auth: 'box-admin' },
    // operator code (box side)
    operatorCode: { method: 'GET', path: '/edge/local/operator-code', auth: 'box-admin' },
    operatorCodeIssue: { method: 'POST', path: '/edge/local/operator-code/issue', auth: 'online-case-admin' },
    // status & troubleshooting
    readiness: { method: 'GET', path: '/edge/local/ops/readiness', auth: 'box-admin' },
    readinessRun: { method: 'POST', path: '/edge/local/ops/readiness/run', auth: 'box-admin' },
    verdict: { method: 'GET', path: '/edge/local/ops/verdict', auth: 'box-admin' },
    recoveryDismiss: { method: 'POST', path: '/edge/local/ops/verdict/recoveries/:id/dismiss', auth: 'box-admin' },
    log: { method: 'GET', path: '/edge/local/ops/log', auth: 'box-admin' },
    logTries: { method: 'GET', path: '/edge/local/ops/log/:id/tries', auth: 'box-admin' },
    logClear: { method: 'POST', path: '/edge/local/ops/log/clear', auth: 'box-admin' },
    network: { method: 'GET', path: '/edge/local/ops/network', auth: 'box-admin' },
    networkRun: { method: 'POST', path: '/edge/local/ops/network/run', auth: 'box-admin' },
    boxDetails: { method: 'GET', path: '/edge/local/ops/box', auth: 'box-admin' },
    diagnostics: { method: 'GET', path: '/edge/local/ops/diagnostics', auth: 'box-admin' },
    // transmitter
    transmitter: { method: 'GET', path: '/edge/local/ops/transmitter', auth: 'box-admin' },
    transmitterApply: { method: 'PUT', path: '/edge/local/ops/transmitter', auth: 'box-admin' },
    transmitterConnect: { method: 'POST', path: '/edge/local/ops/transmitter/connect', auth: 'box-admin' },
    transmitterReconnect: { method: 'POST', path: '/edge/local/ops/transmitter/reconnect', auth: 'box-admin' },
    transmitterTest: { method: 'POST', path: '/edge/local/ops/transmitter/test', auth: 'box-admin' },
    transmitterSerialPorts: { method: 'GET', path: '/edge/local/ops/transmitter/serial-ports', auth: 'box-admin' },
    reporterCard: { method: 'POST', path: '/edge/local/ops/reporter-card', auth: 'box-admin' },
} as const satisfies Readonly<Record<string, EdgeRouteDef>>;

export type EdgeRouteName = keyof typeof EDGE_ROUTES;

/** Fills `:name` segments with URI-encoded values: `edgePath('/x/:id/revoke', {id:'a b'})` → `/x/a%20b/revoke`. */
export function edgePath(path: string, params: Readonly<Record<string, string>> = {}): string {
    return path.replace(/:([A-Za-z][A-Za-z0-9]*)/g, (_whole: string, name: string) => {
        const value = params[name];
        if (value === undefined || value === null || String(value) === '') {
            throw new Error(`edgePath: missing value for :${name} in ${path}`);
        }
        return encodeURIComponent(String(value));
    });
}
