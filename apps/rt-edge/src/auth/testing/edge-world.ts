/**
 * SPEC SUPPORT (never imported by the app): one venue box with three cases, their sessions, a roster, cloud token
 * keys and token minting, shared by the auth and LAN specs.
 *
 * Box "Court 3" (Europe/London). NOW = 2026-10-01 10:30 BST.
 * - Case A "Harlow v Mercer Logistics": S_LIVE (Day 3 — Morning, started 10:02, live), S_NEXT (Day 3 — Afternoon,
 *   starts 14:00 today), S_ENDED (Day 2 — Afternoon, ended yesterday 16:30).
 * - Case B "Re Ashdown Estates": S_B (today, date-only start).
 * - Case C "Okafor v Vale": no session on the box.
 * People: ADMIN (case admin of A), MEMBER (team of A and B), ASSIGNEE (session assignee of S_LIVE only), PERSON (team of
 * A, target of room codes), OUTSIDER (no team), SUPER (super-admin, no team), ADMIN_B (case admin of B only).
 */
import * as os from 'os';
import * as path from 'path';

import { SignJWT } from 'jose';
import { EdgeSigningKeyRing, generateEdgeSigningKey } from '@app/edge-token';

import { BoxConfig, parseBoxConfig } from '../../ports';
import { FakeState } from './fake-state';

export const NOW = Date.UTC(2026, 9, 1, 9, 30); // 10:30 Europe/London (BST)
export const NOW_SEC = Math.floor(NOW / 1000);
export const H = 3_600_000;

export const BOX = 'e0000000-0000-4000-8000-0000000000ed';
export const OTHER_BOX = 'e0000000-0000-4000-8000-0000000000ff';
export const CASE_A = 'ca000000-0000-4000-8000-00000000000a';
export const CASE_B = 'ca000000-0000-4000-8000-00000000000b';
export const CASE_C = 'ca000000-0000-4000-8000-00000000000c';
export const CASE_GONE = 'ca000000-0000-4000-8000-0000000000ee';
export const S_LIVE = '5e550000-0000-4000-8000-000000000001';
export const S_NEXT = '5e550000-0000-4000-8000-000000000002';
export const S_ENDED = '5e550000-0000-4000-8000-000000000003';
export const S_B = '5e550000-0000-4000-8000-000000000004';
export const S_DELETED = '5e550000-0000-4000-8000-000000000005';
export const S_UNKNOWN = '5e550000-0000-4000-8000-0000000000ff';

export const ADMIN = '11111111-1111-4111-8111-111111111111';
export const MEMBER = '22222222-2222-4222-8222-222222222222';
export const ASSIGNEE = '33333333-3333-4333-8333-333333333333';
export const PERSON = '44444444-4444-4444-8444-444444444444';
export const OUTSIDER = '55555555-5555-4555-8555-555555555555';
export const SUPER = '66666666-6666-4666-8666-666666666666';
export const ADMIN_B = '77777777-7777-4777-8777-777777777777';
export const INACTIVE = '88888888-8888-4888-8888-888888888888';

export const KID = 'edge-2026-10';

/**
 * Room codes and the operator code switched ON (`boxConfig({ features: CODES_ON })`). v1 ships both OFF (DR23,
 * box-config.ts defaults), which is what `boxConfig()` gives; the code-flow specs opt in with this.
 */
export const CODES_ON = Object.freeze({ roomCodes: true, operatorCode: true });

/** A dev box config; with no `features` given, the shipped v1 defaults (both code sign-ins off). */
export function boxConfig(extra: Record<string, unknown> = {}): BoxConfig {
    return parseBoxConfig(
        {
            mode: 'dev',
            box: { name: 'Court 3', label: 'VB-014', timeZone: 'Europe/London', roomWifiSsid: 'Court3-Transcript' },
            // `.invalid` never resolves (RFC 2606): nothing in these specs can reach a cloud.
            cloud: { origin: 'https://cloud.invalid' },
            http: { host: '127.0.0.1', port: 0, tls: null },
            transmitter: { bindAddress: '192.168.20.2', networkCidr: '192.168.20.0/24' },
            paths: { dataDir: path.join(os.tmpdir(), 'rt-edge-auth-spec'), publicDir: path.join(os.tmpdir(), 'rt-edge-auth-spec', 'public') },
            ...extra,
        },
        path.join(os.tmpdir(), 'rt-edge-auth-spec', 'rt-edge.json'),
    );
}

/** The populated box state (identity active, cloud keys cached when `keys` is given). */
export function edgeWorld(keys?: readonly Record<string, unknown>[]): FakeState {
    const state = new FakeState().setIdentity({ nEdgeid: BOX });
    state
        .addCase({ nCaseid: CASE_A, cCasename: 'Harlow v Mercer Logistics', cCaseno: 'HC-2026-001' })
        .addCase({ nCaseid: CASE_B, cCasename: 'Re Ashdown Estates', cCaseno: 'HC-2026-002' })
        .addCase({ nCaseid: CASE_C, cCasename: 'Okafor v Vale', cCaseno: 'HC-2026-003' });
    state
        .addSession({ nSesid: S_LIVE, nCaseid: CASE_A, cName: 'Day 3 — Morning', dStartDt: '2026-10-01 10:00:00', localState: 'live', firstLineAtMs: Date.UTC(2026, 9, 1, 9, 2) })
        .addSession({ nSesid: S_NEXT, nCaseid: CASE_A, cName: 'Day 3 — Afternoon', dStartDt: '2026-10-01 14:00:00' })
        .addSession({ nSesid: S_ENDED, nCaseid: CASE_A, cName: 'Day 2 — Afternoon', dStartDt: '2026-09-30 14:00:00', localState: 'ending', firstLineAtMs: Date.UTC(2026, 8, 30, 13, 1), endedAtMs: Date.UTC(2026, 8, 30, 15, 30), cloudOp: 'end' })
        .addSession({ nSesid: S_B, nCaseid: CASE_B, cName: 'Directions hearing', dStartDt: '2026-10-01' })
        .addSession({ nSesid: S_DELETED, nCaseid: CASE_A, cName: 'Deleted', dStartDt: '2026-10-01 09:00:00', deleted: true });
    state
        .addMember({ nUserid: ADMIN, nCaseid: CASE_A, name: 'Priya Shah', email: 'priya@firm.example', role: 'Counsel', isCaseAdmin: true })
        .addMember({ nUserid: MEMBER, nCaseid: CASE_A, name: 'Ann Lee', email: 'ann@firm.example', role: 'Paralegal' })
        .addMember({ nUserid: MEMBER, nCaseid: CASE_B, name: 'Ann Lee', email: 'ann@firm.example', role: 'Paralegal' })
        .addMember({ nUserid: ASSIGNEE, nCaseid: CASE_A, nSesid: S_LIVE, source: 'session', name: 'Sam Reporter', role: 'Expert' })
        .addMember({ nUserid: PERSON, nCaseid: CASE_A, name: 'Daniel Okafor', email: 'daniel@client.example', role: 'Client' })
        .addMember({ nUserid: ADMIN_B, nCaseid: CASE_B, name: 'Bea Admin', isCaseAdmin: true })
        .addMember({ nUserid: INACTIVE, nCaseid: CASE_A, name: 'Old Member', active: false, isCaseAdmin: true });
    state.addSuperAdmin({ nUserid: SUPER, name: 'Sue Super', email: 'sue@etabella.example' });
    state.syncedAt = NOW - 30 * 60_000;
    if (keys) state.jwksRow = { keys: [...keys], receivedAtMs: NOW - H };
    return state;
}

export interface CloudKeys {
    readonly ring: EdgeSigningKeyRing;
    /** The public keys as `e.hello` delivers them (`edgeTokenKeys`). */
    readonly keys: readonly Record<string, unknown>[];
}

export async function cloudKeys(kid = KID): Promise<CloudKeys> {
    const ring = await EdgeSigningKeyRing.create({ signingKey: await generateEdgeSigningKey(kid) });
    return { ring, keys: ring.jwks().keys.map(k => ({ ...k })) };
}

let jtiCounter = 0;

/** An etabella.net edge token (ES256) for this box; `over` replaces any claim, `header` any header field. */
export function onlineToken(cloud: CloudKeys, over: Record<string, unknown> = {}, header: Record<string, unknown> = {}): Promise<string> {
    const sub = (over.sub as string) ?? ADMIN;
    return new SignJWT({
        iss: 'etabella-authapi',
        sub,
        userId: sub,
        aud: `edge:${BOX}`,
        edge: BOX,
        cases: [CASE_A, CASE_B].sort(),
        scope: 'rt',
        jti: `online-${++jtiCounter}`,
        iat: NOW_SEC - 600,
        exp: NOW_SEC - 600 + 12 * 3600,
        auth_time: NOW_SEC - 3600,
        ...over,
    })
        .setProtectedHeader({ alg: 'ES256', kid: cloud.ring.kid, typ: 'edge+jwt', ...header })
        .sign(cloud.ring.signingKey);
}

/** A mutable spec clock. */
export class SpecClock {
    constructor(public nowMs: number = NOW) {}
    readonly now = (): number => this.nowMs;
    advance(ms: number): void {
        this.nowMs += ms;
    }
}
