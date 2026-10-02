/**
 * AuthPort (token AUTH_PORT): who is calling and what they may open (spec §8.4, D22, D24, D28, D33; DR10, DR11,
 * DR19; O-9, O-10, O-11, O-13; CONTRACTS.md §2, §6.5, §6.6). Verification works OFFLINE: online edge tokens are
 * checked with the JWKS the uplink cached from `e.hello` (`StatePort.jwks`), box-signed tokens with the box's own
 * secret, revocations from `StatePort.revocations`.
 *
 * `authenticate` refuses, in this order (ports/auth.port.ts):
 * 1. no box identity → `box_not_configured` 503;
 * 2. a missing / unreadable token, a bad signature, wrong alg / typ / iss / aud / box, an unknown kid, or claims that
 *    break D28 (> 12 h) or D24 (past auth_time + 24 h) → `unauthenticated` 401; an online token while no cloud key is
 *    cached → `box_not_linked` 503 (never signs anyone out); a room-code / operator token while that code sign-in is
 *    switched off on the box (`BoxConfig.features`, off by default in v1, DR23: email is then the only way in) →
 *    `unauthenticated` 401;
 * 3. expired → `token_expired` 401: an online token past `exp` + 5 min (box clock skew), a box token past `exp` (the
 *    box minted it with its own clock), a room-code token whose session has ended or is no longer on the box, an
 *    operator token for another box-local day;
 * 4. revoked → `token_revoked` 401: the jti is denied (sign-out, cloud list, ended room access, replaced on
 *    re-entry), or a user cut-off covers its `iat` (`isRevokedByUserCutoff`): the token's own user, and for an
 *    operator token also the case admin who minted the code (its authority is theirs, O-10).
 * Any other failure (a state read that throws) propagates as a 500: never a false 401 that would sign people out.
 *
 * The principal is built from the verified claims AND the cached roster (names, admin flags, the case list now):
 * - online: token `cases` ∩ box cases ∩ the user's active roster cases now (a super-admin: every box case); admin
 *   cases = roster case-admin rows ∩ those; box admin (O-11) = super-admin or case admin of ≥ 1 box case in the roster;
 * - room-code: exactly the code's session and its case; never a box admin;
 * - operator: the minting admin's box cases where they are case admin (a super-admin minter: every box case); box
 *   admin for that day.
 *
 * An OPEN online socket is re-derived with `reverifyOnline` (the LAN gateway's re-checks): the roster and revocations
 * now, never the expiry (D28), and following a silent renewal of the same sign-in that this box has seen.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import {
    EDGE_BOX_CLOCK_SKEW_SEC,
    EDGE_RENEWAL_CEILING_SEC,
    EDGE_UUID_RE,
    EdgeBoxClaims,
    EdgeKeyCache,
    EdgeOperatorTokenClaims,
    EdgeRevocationCheck,
    EdgeRoomTokenClaims,
    EdgeTokenClaims,
    edgeBearerFamily,
    isEdgeTokenClaims,
    isEdgeTokenError,
    verifyEdgeBoxToken,
    verifyEdgeToken,
} from '@app/edge-token';

import { edgeRenewalPlan, EdgeMeResponse, EdgeRoomGrant } from '../contracts';
import {
    AuthPort,
    BOX_CONFIG,
    BoxConfig,
    BoxIdentityRecord,
    boxDay,
    EDGE_BOX_CLOCK_SKEW_MS,
    EDGE_CLOCK,
    EDGE_EVENT_BUS,
    EdgeClock,
    EdgeEventBus,
    EdgePortError,
    EdgePrincipal,
    EdgeRequestContext,
    isRevokedByUserCutoff,
    Reply,
    STATE_PORT,
    StatePort,
} from '../ports';
import { deviceHash, usableDeviceCookie } from './codes';
import { endOfBoxDayMs } from './box-time';
import { codeFeatureOn, featureOfBoxTokenKind } from './features';
import { actorOf, OPERATOR_DISPLAY_NAME } from './principal';
import { idKey, isSessionEnded, isSessionGone, sameId } from './session-facts';

const unauthenticated = (message: string): EdgePortError<'unauthenticated'> => new EdgePortError('unauthenticated', message);

/** Online sign-ins remembered for `reverifyOnline` (a box serves a few hundred people; the oldest go first). */
const SIGN_IN_MEMORY_MAX = 4096;

/** One etabella.net sign-in (D24): the same person and the same `auth_time` across its silent renewals. */
const signInKey = (sub: string, authTimeSec: number): string => `${idKey(sub)}|${authTimeSec}`;

/** The claims of a token the handshake already verified (`EdgePrincipal.token`); null when unreadable. */
function verifiedClaims(token: string): EdgeTokenClaims | null {
    const parts = typeof token === 'string' ? token.split('.') : [];
    if (parts.length !== 3) return null;
    try {
        const claims: unknown = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
        return isEdgeTokenClaims(claims) ? claims : null;
    } catch {
        return null;
    }
}

@Injectable()
export class EdgeAuthService implements AuthPort {
    private readonly logger = new Logger('EdgeAuth');
    private keys: { readonly fingerprint: string; readonly cache: EdgeKeyCache } | null = null;
    /**
     * The newest online token this box verified per etabella.net sign-in. etabella.net revokes the token a silent
     * renewal replaced (one active token per person and box), so a LAN socket opened with it would read as signed
     * out; when the device has used its renewed token here, the socket follows that one instead (`reverifyOnline`).
     */
    private readonly newestBySignIn = new Map<string, { readonly claims: EdgeTokenClaims; readonly token: string }>();

    constructor(
        @Inject(STATE_PORT) private readonly state: StatePort,
        @Inject(BOX_CONFIG) private readonly config: BoxConfig,
        @Inject(EDGE_CLOCK) private readonly clock: EdgeClock,
        @Inject(EDGE_EVENT_BUS) private readonly bus: EdgeEventBus,
    ) {}

    // ---- verification -----------------------------------------------------------------------------------------

    async authenticate(token: string | null | undefined, _ctx: EdgeRequestContext): Promise<EdgePrincipal> {
        const identity = this.state.identity.get();
        if (!identity || !EDGE_UUID_RE.test(String(identity.nEdgeid ?? '').trim())) {
            throw new EdgePortError('box_not_configured', 'the box has no identity');
        }
        const nowMs = this.clock();
        const family = edgeBearerFamily(token);
        if (!family) throw unauthenticated('no readable bearer token');
        return family === 'online' ? this.verifyOnline(token as string, identity, nowMs) : this.verifyBoxToken(token as string, identity, nowMs);
    }

    private async verifyOnline(token: string, identity: BoxIdentityRecord, nowMs: number): Promise<EdgePrincipal> {
        const keys = this.cloudKeys();
        if (!keys) throw new EdgePortError('box_not_linked', 'no etabella.net token keys are cached on the box yet');
        let claims: EdgeTokenClaims;
        try {
            claims = await verifyEdgeToken(token, keys.resolve, {
                nowMs,
                nEdgeid: identity.nEdgeid,
                clockSkewSec: EDGE_BOX_CLOCK_SKEW_SEC,
                revocation: this.revocationCheck(nowMs),
            });
        } catch (err) {
            throw this.refusal(err);
        }
        const principal = this.onlinePrincipal(claims, token);
        this.rememberSignIn(claims, token, nowMs);
        return principal;
    }

    reverifyOnline(principal: EdgePrincipal): EdgePrincipal {
        if (!principal || principal.kind !== 'online') throw unauthenticated('not an online sign-in');
        const own = verifiedClaims(principal.token);
        if (!own || own.jti !== principal.jti) throw unauthenticated('the sign-in token cannot be read');
        const nowMs = this.clock();
        const newer = this.newestBySignIn.get(signInKey(own.sub, own.auth_time));
        const candidates = newer && newer.claims.jti !== own.jti && newer.claims.iat >= own.iat ? [newer, { claims: own, token: principal.token }] : [{ claims: own, token: principal.token }];
        for (const c of candidates) {
            if (!this.isRevokedNow(c.claims, nowMs)) return this.onlinePrincipal(c.claims, c.token);
        }
        throw new EdgePortError('token_revoked', 'the sign-in was revoked');
    }

    /** Keep the newest verified token of each online sign-in (bounded; sign-ins past the D24 ceiling go first). */
    private rememberSignIn(claims: EdgeTokenClaims, token: string, nowMs: number): void {
        const key = signInKey(claims.sub, claims.auth_time);
        const known = this.newestBySignIn.get(key);
        if (known && (known.claims.jti === claims.jti || known.claims.iat > claims.iat)) return;
        this.newestBySignIn.delete(key);
        this.newestBySignIn.set(key, { claims, token });
        if (this.newestBySignIn.size <= SIGN_IN_MEMORY_MAX) return;
        const nowSec = Math.floor(nowMs / 1000);
        for (const [k, v] of this.newestBySignIn) {
            if (v.claims.auth_time + EDGE_RENEWAL_CEILING_SEC + EDGE_BOX_CLOCK_SKEW_SEC < nowSec) this.newestBySignIn.delete(k);
        }
        for (const k of this.newestBySignIn.keys()) {
            if (this.newestBySignIn.size <= SIGN_IN_MEMORY_MAX) break;
            this.newestBySignIn.delete(k);
        }
    }

    private isRevokedNow(claims: EdgeTokenClaims, nowMs: number): boolean {
        return this.state.revocations.isJtiDenied(claims.jti, nowMs) || this.userCutoffCovers(claims.sub, claims.iat);
    }

    private async verifyBoxToken(token: string, identity: BoxIdentityRecord, nowMs: number): Promise<EdgePrincipal> {
        // DR23: with both code sign-ins switched off no box-signed token is a valid sign-in (email is the only way in).
        if (!codeFeatureOn(this.config, 'roomCodes') && !codeFeatureOn(this.config, 'operatorCode')) {
            throw unauthenticated('code sign-ins are switched off on this box');
        }
        const today = boxDay(nowMs, this.config.box.timeZone);
        let claims: EdgeBoxClaims;
        try {
            claims = await verifyEdgeBoxToken(token, this.state.identity.secret('box-token-signing'), {
                nEdgeid: identity.nEdgeid,
                nowMs,
                today,
                revocation: this.revocationCheck(nowMs),
            });
        } catch (err) {
            throw this.refusal(err);
        }
        if (!codeFeatureOn(this.config, featureOfBoxTokenKind(claims.kind))) throw unauthenticated(`${claims.kind} sign-in is switched off on this box`);
        return claims.kind === 'room-code' ? this.roomPrincipal(claims, token) : this.operatorPrincipal(claims, token);
    }

    /** EdgeTokenError → the contract's 401 codes; anything else is an infrastructure failure and propagates. */
    private refusal(err: unknown): unknown {
        if (!isEdgeTokenError(err)) return err;
        if (err.code === 'token_expired') return new EdgePortError('token_expired', 'the sign-in has expired');
        if (err.code === 'token_revoked') return new EdgePortError('token_revoked', 'the sign-in was revoked');
        return unauthenticated(`token refused (${err.code})`);
    }

    /** The cached cloud keys (rebuilt when the uplink stores a new set); null when none is usable. */
    private cloudKeys(): EdgeKeyCache | null {
        const stored = this.state.jwks.get();
        if (!stored || !Array.isArray(stored.keys) || !stored.keys.length) return null;
        const fingerprint = `${stored.receivedAtMs}|${JSON.stringify(stored.keys)}`;
        if (!this.keys || this.keys.fingerprint !== fingerprint) {
            this.keys = { fingerprint, cache: new EdgeKeyCache(stored.keys) };
        }
        return this.keys.cache.size ? this.keys.cache : null;
    }

    /** Sign-out / end-access / cloud jti denials, and per-user cut-offs (only real user ids have one). */
    private revocationCheck(nowMs: number): EdgeRevocationCheck {
        return {
            isRevoked: (jti: string, sub: string, iat: number): boolean =>
                this.state.revocations.isJtiDenied(jti, nowMs) || this.userCutoffCovers(sub, iat),
        };
    }

    private userCutoffCovers(nUserid: string, iatSec: number): boolean {
        if (!EDGE_UUID_RE.test(String(nUserid ?? ''))) return false;
        return isRevokedByUserCutoff(iatSec, this.state.revocations.userRevokedAtMs(nUserid));
    }

    // ---- principals --------------------------------------------------------------------------------------------

    private onlinePrincipal(claims: EdgeTokenClaims, token: string): EdgePrincipal {
        const boxCases = this.state.assignments.cases();
        const isSuperAdmin = this.state.roster.isSuperAdmin(claims.sub);
        const tokenCases = new Set(claims.cases.map(idKey));
        // DR19: the token's cases (D22, as of its mint) ∩ the box's cases ∩ the cached roster NOW (case team or session
        // assignee, active): someone taken off a team after the sign-in no longer sees the case on this box.
        const rosterCases = this.rosterCases(claims.sub);
        const caseIds = boxCases.filter(c => isSuperAdmin || (tokenCases.has(idKey(c.nCaseid)) && rosterCases.has(idKey(c.nCaseid)))).map(c => c.nCaseid);
        const rosterAdmin = this.rosterAdminCases(claims.sub);
        const adminOfBoxCase = boxCases.some(c => rosterAdmin.has(idKey(c.nCaseid)));
        const person = this.state.roster.person(claims.sub);
        return Object.freeze({
            kind: 'online',
            userId: claims.sub,
            name: person?.name ?? '',
            email: person?.email ?? null,
            caseIds: Object.freeze(caseIds),
            adminCaseIds: Object.freeze(caseIds.filter(id => rosterAdmin.has(idKey(id)))),
            isBoxAdmin: isSuperAdmin || adminOfBoxCase,
            isSuperAdmin,
            validUntil: claims.exp * 1000,
            untilSessionEnds: false,
            jti: claims.jti,
            issuedAt: claims.iat * 1000,
            authTime: claims.auth_time * 1000,
            mintedBy: null,
            operatorDay: null,
            deviceHash: null,
            forwardable: true,
            token,
        });
    }

    private roomPrincipal(claims: EdgeRoomTokenClaims, token: string): EdgePrincipal {
        const session = this.state.sessions.get(claims.nSesid);
        if (isSessionGone(session) || isSessionEnded(session)) {
            throw new EdgePortError('token_expired', 'the room access ended with its session');
        }
        const caseIds = this.state.assignments.case(session.nCaseid) ? [session.nCaseid] : [];
        const person = this.state.roster.person(claims.sub);
        const binding = this.state.roomCodes.usedFor(session.nSesid, claims.sub);
        return Object.freeze({
            kind: 'room-code',
            userId: claims.sub,
            name: person?.name ?? '',
            email: person?.email ?? null,
            caseIds: Object.freeze(caseIds),
            adminCaseIds: Object.freeze([] as string[]),
            sessionId: session.nSesid,
            isBoxAdmin: false,
            isSuperAdmin: false,
            validUntil: claims.exp * 1000,
            untilSessionEnds: true,
            jti: claims.jti,
            issuedAt: claims.iat * 1000,
            authTime: null,
            mintedBy: Object.freeze({ nUserid: claims.mintedBy, name: this.state.roster.person(claims.mintedBy)?.name ?? '' }),
            operatorDay: null,
            deviceHash: binding?.deviceHash ?? null,
            forwardable: false,
            token,
        });
    }

    private operatorPrincipal(claims: EdgeOperatorTokenClaims, token: string): EdgePrincipal {
        if (this.userCutoffCovers(claims.mintedBy, claims.iat)) {
            throw new EdgePortError('token_revoked', 'the case admin who minted the operator code was revoked');
        }
        const boxCases = this.state.assignments.cases();
        const minterIsSuperAdmin = this.state.roster.isSuperAdmin(claims.mintedBy);
        const minterAdmin = this.rosterAdminCases(claims.mintedBy);
        const caseIds = boxCases.filter(c => minterIsSuperAdmin || minterAdmin.has(idKey(c.nCaseid))).map(c => c.nCaseid);
        return Object.freeze({
            kind: 'operator',
            userId: null,
            name: OPERATOR_DISPLAY_NAME,
            email: null,
            caseIds: Object.freeze(caseIds),
            adminCaseIds: Object.freeze([...caseIds]),
            isBoxAdmin: true,
            isSuperAdmin: false,
            validUntil: endOfBoxDayMs(claims.day, this.config.box.timeZone),
            untilSessionEnds: false,
            jti: claims.jti,
            issuedAt: claims.iat * 1000,
            authTime: null,
            mintedBy: Object.freeze({ nUserid: claims.mintedBy, name: this.state.roster.person(claims.mintedBy)?.name ?? '' }),
            operatorDay: claims.day,
            deviceHash: null,
            forwardable: false,
            token,
        });
    }

    /** Cases where the roster has `nUserid` ACTIVE (case team or session assignee), as id keys. */
    private rosterCases(nUserid: string): Set<string> {
        return new Set(
            this.state.roster
                .forUser(nUserid)
                .filter(m => m.active)
                .map(m => idKey(m.nCaseid)),
        );
    }

    /** Box cases (and others) where the roster has `nUserid` as an ACTIVE case admin, as id keys. */
    private rosterAdminCases(nUserid: string): Set<string> {
        return new Set(
            this.state.roster
                .forUser(nUserid)
                .filter(m => m.isCaseAdmin && m.active)
                .map(m => idKey(m.nCaseid)),
        );
    }

    // ---- permission checks ---------------------------------------------------------------------------------------

    requireBoxAdmin(principal: EdgePrincipal): void {
        if (!principal?.isBoxAdmin) throw new EdgePortError('not_box_admin', 'Box settings need a case admin, a super-admin or the operator code');
    }

    requireOnlineCaseAdmin(principal: EdgePrincipal): void {
        if (principal?.kind !== 'online') throw new EdgePortError('online_sign_in_required', 'this needs an online etabella.net sign-in');
        if (!principal.isSuperAdmin && !principal.isBoxAdmin) throw new EdgePortError('not_case_admin', 'not a case admin of any case on this box');
    }

    canSeeCase(principal: EdgePrincipal, nCaseid: string): boolean {
        return !!principal && principal.caseIds.some(id => sameId(id, nCaseid));
    }

    canOpenSession(principal: EdgePrincipal, nSesid: string): boolean {
        if (!principal || typeof nSesid !== 'string' || !nSesid.trim()) return false;
        const session = this.state.sessions.get(nSesid.trim());
        if (isSessionGone(session)) return false;
        if (!this.canSeeCase(principal, session.nCaseid)) return false;
        if (principal.kind === 'room-code') return !!principal.sessionId && sameId(principal.sessionId, session.nSesid);
        if (principal.isSuperAdmin || principal.kind === 'operator') return true;
        if (principal.adminCaseIds.some(id => sameId(id, session.nCaseid))) return true;
        return !!principal.userId && this.state.roster.forSession(session.nSesid).some(m => m.active && sameId(m.nUserid, principal.userId));
    }

    rooms(principal: EdgePrincipal): readonly EdgeRoomGrant[] {
        if (!principal) return [];
        const via: EdgeRoomGrant['via'] = principal.kind === 'online' ? 'case-team' : principal.kind;
        const grants: EdgeRoomGrant[] = [];
        for (const nCaseid of principal.caseIds) {
            const caseName = this.state.assignments.case(nCaseid)?.cCasename ?? '';
            for (const session of this.state.sessions.forCase(nCaseid)) {
                if (isSessionGone(session) || !this.canOpenSession(principal, session.nSesid)) continue;
                grants.push({ nSesid: session.nSesid, nCaseid: session.nCaseid, sessionName: session.cName, caseName, via });
            }
        }
        return grants;
    }

    me(principal: EdgePrincipal, nowMs: number): Reply<EdgeMeResponse> {
        const renewal =
            principal.kind === 'online' && principal.authTime != null
                ? edgeRenewalPlan(Math.floor(principal.validUntil / 1000), Math.floor(principal.authTime / 1000))
                : null;
        return {
            kind: principal.kind,
            nUserid: principal.userId,
            name: principal.name,
            email: principal.email,
            validUntilMs: principal.validUntil,
            untilSessionEnds: principal.untilSessionEnds,
            renewal,
            isBoxAdmin: principal.isBoxAdmin,
            isSuperAdmin: principal.isSuperAdmin,
            // With room codes switched off (DR23) nobody may issue one.
            roomCodeCaseIds: codeFeatureOn(this.config, 'roomCodes') ? [...principal.adminCaseIds] : [],
            rooms: this.rooms(principal),
            operator: principal.kind === 'operator' && principal.operatorDay && principal.mintedBy ? { day: principal.operatorDay, mintedBy: principal.mintedBy } : null,
            nowMs,
        };
    }

    // ---- sign-out --------------------------------------------------------------------------------------------------

    async signOut(principal: EdgePrincipal, ctx: EdgeRequestContext): Promise<void> {
        const nowMs = this.clock();
        const untilMs = Math.max(principal.validUntil, nowMs) + EDGE_BOX_CLOCK_SKEW_MS;
        this.state.revocations.denyJti(principal.jti, untilMs, 'sign-out', nowMs);
        try {
            this.bus.publish('access-revoked', { jtis: [principal.jti], userIds: [], reason: 'sign-out', atMs: nowMs });
        } catch (err) {
            this.logger.error(`could not publish access-revoked for a sign-out: ${err instanceof Error ? err.message : String(err)}`);
        }
        const cookie = usableDeviceCookie(ctx?.deviceCookie);
        this.audit({
            atMs: nowMs,
            action: 'sign-out',
            actor: actorOf(principal),
            outcome: 'ok',
            nSesid: principal.sessionId ?? null,
            target: null,
            ip: ctx?.ip ?? null,
            deviceHash: cookie ? deviceHash(cookie) : principal.deviceHash,
            data: { kind: principal.kind },
        });
    }

    /** Audit rows never fail the action they record (the action already happened); a failure is logged. */
    private audit(entry: Parameters<StatePort['audit']['append']>[0]): void {
        try {
            this.state.audit.append(entry);
        } catch (err) {
            this.logger.error(`audit '${entry.action}' could not be written: ${err instanceof Error ? err.message : String(err)}`);
        }
    }
}

/** D24 ceiling of the online sign-in a principal carries (auth_time + 24 h), for the LAN's socket bookkeeping. */
export const EDGE_ONLINE_CEILING_MS = EDGE_RENEWAL_CEILING_SEC * 1000;
