/**
 * AccessPort (token ACCESS_PORT): the online sign-in start, room-code and operator-code redemption, and Box settings →
 * Room codes / operator code (spec §4.10, §8.4; D33; DR5, DR7, DR10, DR19; O-9, O-10; CONTRACTS.md §6.1, §6.3,
 * §6.4, §8.1, §8.2). Errors are thrown as `EdgePortError`s in the order each method's port JSDoc lists.
 *
 * Rules kept here:
 * - codes exist on the box only, as hashes (codes.ts); the plaintext room code leaves the box once, on the issue reply;
 *   an operator code is never stored at all (the cloud mints it, the box keeps the delivered scrypt hash);
 * - one person, one session, one use: a redemption binds the code to the device cookie (O-9); the same device may
 *   re-enter (the earlier token is denied as `replaced`), any other device gets `code_used_elsewhere`;
 * - 5 wrong tries per device cookie and per client IP → 60 s lock (shared by both code kinds); a real but revoked or
 *   expired code is not a wrong try;
 * - issuing needs case admin of the session's case (D33; an operator session: the minting admin's cases, with the
 *   typed operator name, O-10); a person's earlier unused code for the session is revoked by a new one;
 * - every attempt and every write is audited WITHOUT the code value (outcome, device hash, client IP, time);
 * - DR23 (build decision "email sign-in only for v1"): every room-code method needs `features.roomCodes`, every
 *   operator-code method `features.operatorCode` (both OFF by default); a switched-off kind throws
 *   `EdgeFeatureDisabledError` (404 `feature_disabled`, features.ts) before anything is read, checked or audited.
 *   `signInStart` (the email sign-in) is never switched off.
 */
import { randomUUID } from 'crypto';

import { Inject, Injectable, Logger } from '@nestjs/common';
import { EDGE_UUID_RE, EdgeBoxTokenSigner } from '@app/edge-token';

import {
    EDGE_DEVICE_COOKIE,
    EDGE_PKCE_CHALLENGE_RE,
    EDGE_STATE_RE,
    EdgeActor,
    EdgeSignInStartRequest,
    EdgeSignInStartResponse,
    formatOperatorCode,
    formatRoomCode,
    IssuedRoomCode,
    IssueRoomCodesRequest,
    IssueRoomCodesResponse,
    normalizeEdgeCode,
    normalizeOperatorCode,
    OPERATOR_CODE_RE,
    OperatorCodeIssueResponse,
    OperatorCodeSignInRequest,
    OperatorCodeSignInResponse,
    OperatorCodeStatusResponse,
    ReissueRoomCodeRequest,
    ReissueRoomCodeResponse,
    ROOM_CODE_RE,
    RoomCodeIssueResult,
    RoomCodeListResponse,
    RoomCodePerson,
    RoomCodePickerPerson,
    RoomCodePickerResponse,
    RoomCodePickerSession,
    RoomCodeRedeemRequest,
    RoomCodeRedeemResponse,
    RoomCodeRow,
    RoomCodeRowResponse,
} from '../contracts';
import {
    AccessPort,
    AUTH_PORT,
    AuthPort,
    BOX_CONFIG,
    BoxConfig,
    BoxRosterMember,
    BoxSessionRecord,
    boxDay,
    EDGE_BOX_CLOCK_SKEW_MS,
    EDGE_CLOCK,
    EDGE_DEVICE_COOKIE_MAX_AGE_SEC,
    EDGE_EVENT_BUS,
    EdgeAuditEntry,
    EdgeClock,
    EdgeDeviceCookie,
    EdgeEventBus,
    EdgePortError,
    EdgePrincipal,
    EdgeRequestContext,
    KERNEL_PORT,
    KernelPort,
    OperatorCodeRecord,
    Reply,
    ROOM_CODE_ACCESS_MAX_MS,
    RoomCodeRecord,
    STATE_PORT,
    StatePort,
    UPLINK_PORT,
    UplinkPort,
} from '../ports';
import { CodeEntryLockout, lockoutKeys, SlidingWindowLimiter } from './attempt-limits';
import { addBoxDays, endOfBoxDayMs, sessionStartAtMs, usableZone } from './box-time';
import { deviceHash, deviceLabelOf, emailDigest, generateRoomCode, newDeviceCookieValue, operatorCodeMatches, roomCodeHash, usableDeviceCookie } from './codes';
import { requireCodeFeature } from './features';
import { actorOf, OPERATOR_DISPLAY_NAME } from './principal';
import { idKey, isSessionEnded, isSessionEnding, isSessionGone, sameId, sessionPhaseOf } from './session-facts';

/** Longest code string the box reads (anything longer is refused before normalizing). */
export const EDGE_CODE_INPUT_MAX = 64;
/** At most this many people per bulk issue (contract `IssueRoomCodesRequest.userIds`). */
export const ROOM_CODE_ISSUE_MAX = 50;
/** O-10: the operator name typed at issue, 2–80 characters. */
export const OPERATOR_NAME_MIN = 2;
export const OPERATOR_NAME_MAX = 80;
/** Used when the issuer of an operator-issued room code can no longer be resolved (never matches a real user). */
export const UNKNOWN_MINTER = '00000000-0000-0000-0000-000000000000';
/** Other days whose operator code is recognised as "another day's code" (`code_expired`) rather than wrong. */
const OPERATOR_OTHER_DAYS = [-1, -2, 1] as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const invalid = (message: string): EdgePortError<'invalid_request'> => new EdgePortError('invalid_request', message);
const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

@Injectable()
export class EdgeAccessService implements AccessPort {
    private readonly logger = new Logger('EdgeAccess');
    /** O-9 lockout, shared by room codes and the operator code. */
    readonly lockout = new CodeEntryLockout();
    /** Sign-in starts per client IP. */
    readonly signInLimiter = new SlidingWindowLimiter();
    private readonly limitedAudited = new Map<string, number>();

    constructor(
        @Inject(STATE_PORT) private readonly state: StatePort,
        @Inject(AUTH_PORT) private readonly auth: AuthPort,
        @Inject(KERNEL_PORT) private readonly kernel: KernelPort,
        @Inject(UPLINK_PORT) private readonly uplink: UplinkPort,
        @Inject(BOX_CONFIG) private readonly config: BoxConfig,
        @Inject(EDGE_CLOCK) private readonly clock: EdgeClock,
        @Inject(EDGE_EVENT_BUS) private readonly bus: EdgeEventBus,
    ) {}

    // ---- online sign-in start (DR5, D33) -------------------------------------------------------------------------

    signInStart(req: EdgeSignInStartRequest, ctx: EdgeRequestContext): Reply<EdgeSignInStartResponse> {
        if (!isRecord(req)) throw invalid('the body must be a JSON object');
        const email = typeof req.email === 'string' ? req.email.trim() : '';
        if (!email || email.length > 254 || !EMAIL_RE.test(email)) throw invalid('email must be an email address');
        if (typeof req.state !== 'string' || !EDGE_STATE_RE.test(req.state)) throw invalid('state must be 16-128 URL-safe characters');
        if (typeof req.codeChallenge !== 'string' || !EDGE_PKCE_CHALLENGE_RE.test(req.codeChallenge)) throw invalid('codeChallenge must be an S256 PKCE challenge');
        if (req.codeChallengeMethod !== 'S256') throw invalid("codeChallengeMethod must be 'S256'");
        const identity = this.state.identity.get();
        if (!identity) throw new EdgePortError('box_not_configured', 'the box has no identity');
        if (identity.status !== 'active') throw new EdgePortError('box_not_linked', `the box identity is ${identity.status}`);
        const nowMs = this.clock();
        const ipKey = ctx?.ip ?? 'unknown';
        const verdict = this.signInLimiter.take(ipKey, nowMs);
        const digest = emailDigest(this.state.identity.secret('room-code-hmac'), email);
        if (verdict.ok === false) {
            const last = this.limitedAudited.get(ipKey) ?? 0;
            if (nowMs - last >= 60_000) {
                this.limitedAudited.set(ipKey, nowMs);
                this.audit({ atMs: nowMs, action: 'sign-in-start', actor: null, outcome: 'rate_limited', nSesid: null, target: null, ip: ctx?.ip ?? null, deviceHash: this.cookieHash(ctx), data: { emailDigest: digest } });
            }
            throw new EdgePortError('rate_limited', 'too many sign-in starts from this address', { retryAfterSec: verdict.retryAfterSec });
        }
        const query = new URLSearchParams({ edge: identity.nEdgeid, state: req.state, cc: req.codeChallenge, login_hint: email });
        this.audit({ atMs: nowMs, action: 'sign-in-start', actor: null, outcome: 'ok', nSesid: null, target: null, ip: ctx?.ip ?? null, deviceHash: this.cookieHash(ctx), data: { emailDigest: digest } });
        return { authorizeUrl: `${this.config.cloud.authorizeUrl}?${query.toString()}` };
    }

    // ---- room-code redemption (DR5, DR10, O-9) -------------------------------------------------------------------

    async redeemRoomCode(req: RoomCodeRedeemRequest, ctx: EdgeRequestContext): Promise<{ readonly reply: Reply<RoomCodeRedeemResponse>; readonly deviceCookie: EdgeDeviceCookie | null }> {
        requireCodeFeature(this.config, 'roomCodes');
        const raw = isRecord(req) ? req.code : undefined;
        if (typeof raw !== 'string' || raw.length > EDGE_CODE_INPUT_MAX) throw invalid('code must be a string');
        const code = normalizeEdgeCode(raw);
        if (!ROOM_CODE_RE.test(code)) throw invalid('a room code is 6 letters and digits');

        const nowMs = this.clock();
        const presented = usableDeviceCookie(ctx?.deviceCookie);
        const presentedHash = presented ? deviceHash(presented) : null;
        const keys = lockoutKeys(ctx?.ip ?? null, presentedHash);
        const base = { atMs: nowMs, action: 'room-code-redeem' as const, actor: null, ip: ctx?.ip ?? null, deviceHash: presentedHash };

        const locked = this.lockout.lockedFor(keys, nowMs);
        if (locked > 0) {
            this.audit({ ...base, outcome: 'code_locked', nSesid: null, target: null, data: null });
            throw new EdgePortError('code_locked', 'too many wrong codes', { retryAfterSec: locked });
        }

        const row = this.state.roomCodes.findByHash(roomCodeHash(this.state.identity.secret('room-code-hmac'), code));
        if (!row) {
            const verdict = this.lockout.fail(keys, nowMs);
            if (verdict.retryAfterSec > 0) {
                this.audit({ ...base, outcome: 'code_locked', nSesid: null, target: null, data: { wrong: true } });
                throw new EdgePortError('code_locked', 'too many wrong codes', { retryAfterSec: verdict.retryAfterSec });
            }
            this.audit({ ...base, outcome: 'code_wrong', nSesid: null, target: null, data: null });
            throw new EdgePortError('code_wrong', 'no such room code', { attemptsLeft: verdict.attemptsLeft });
        }

        const session = this.state.sessions.get(row.nSesid);
        const refusal = this.redeemRefusal(row, session, presentedHash);
        if (refusal) {
            this.audit({ ...base, outcome: refusal.code, nSesid: row.nSesid, target: row.id, data: null });
            throw refusal;
        }

        const identity = this.state.identity.get();
        if (!identity) throw new EdgePortError('box_not_configured', 'the box has no identity');
        const reentry = row.status === 'used';
        const cookieValue = presented ?? newDeviceCookieValue();
        const boundHash = presentedHash ?? deviceHash(cookieValue);
        const signer = EdgeBoxTokenSigner.create(identity.nEdgeid, this.state.identity.secret('box-token-signing'));
        // Sign first (no side effect), bind second: a failed signature never leaves a code bound to a device that got
        // no token (and no cookie).
        const minted = await signer.mintRoomToken({ nUserid: row.nUserid, nSesid: row.nSesid, mintedBy: this.issuerIdOf(row), nowMs });
        const bound = this.state.roomCodes.bind(row.id, {
            deviceHash: boundHash,
            deviceLabel: reentry ? row.deviceLabel ?? deviceLabelOf(ctx?.userAgent) : deviceLabelOf(ctx?.userAgent),
            tokenJti: minted.claims.jti,
            atMs: nowMs,
        });
        if (!bound) {
            // Lost a race (another device bound it, or an admin revoked it meanwhile): answer from the row as it is now.
            const now = this.state.roomCodes.get(row.id);
            const late = (now && this.redeemRefusal(now, this.state.sessions.get(row.nSesid), presentedHash)) ?? this.usedElsewhere(now ?? row);
            this.audit({ ...base, outcome: late.code, nSesid: row.nSesid, target: row.id, data: null });
            throw late;
        }
        if (reentry && row.tokenJti && row.tokenJti !== minted.claims.jti) {
            // The device's earlier token stops working on this box (a copied one included); its open sockets are left alone.
            this.state.revocations.denyJti(row.tokenJti, nowMs + ROOM_CODE_ACCESS_MAX_MS + EDGE_BOX_CLOCK_SKEW_MS, 'replaced', nowMs);
        }
        this.lockout.succeed(keys);
        this.audit({ ...base, deviceHash: boundHash, outcome: 'ok', nSesid: row.nSesid, target: row.id, data: { reentry } });

        const caseRecord = this.state.assignments.case(session.nCaseid);
        const reply: Reply<RoomCodeRedeemResponse> = {
            status: 'ok',
            token: minted.token,
            kind: 'room-code',
            nUserid: row.nUserid,
            name: this.state.roster.person(row.nUserid)?.name ?? '',
            room: { nSesid: session.nSesid, nCaseid: session.nCaseid, sessionName: session.cName, caseName: caseRecord?.cCasename ?? '', via: 'room-code' },
            validUntilMs: minted.claims.exp * 1000,
            untilSessionEnds: true,
            reentry,
        };
        const deviceCookie: EdgeDeviceCookie | null = presented
            ? null
            : { name: EDGE_DEVICE_COOKIE, value: cookieValue, maxAgeSec: EDGE_DEVICE_COOKIE_MAX_AGE_SEC, httpOnly: true, secure: true, sameSite: 'strict', path: '/' };
        return { reply, deviceCookie };
    }

    /** Why a FOUND code cannot be redeemed by this device now (port order: revoked, expired, used elsewhere). */
    private redeemRefusal(row: RoomCodeRecord, session: BoxSessionRecord | null, presentedHash: string | null): EdgePortError | null {
        if (row.status === 'revoked' || row.status === 'ended') return new EdgePortError('code_revoked', 'the code was revoked or its room access ended');
        if (row.status === 'expired' || isSessionGone(session) || isSessionEnded(session, this.kernelView(row.nSesid))) {
            return new EdgePortError('code_expired', 'the code was for a session that has ended', {
                sessionName: session?.cName ?? null,
                endedAtMs: row.expiredAtMs ?? session?.endedAtMs ?? null,
            });
        }
        if (row.status === 'used' && (!presentedHash || presentedHash !== row.deviceHash)) return this.usedElsewhere(row);
        return null;
    }

    private usedElsewhere(row: RoomCodeRecord): EdgePortError<'code_used_elsewhere'> {
        return new EdgePortError('code_used_elsewhere', 'the code is bound to another device', { usedAtMs: row.usedAtMs ?? 0, deviceLabel: row.deviceLabel ?? null });
    }

    /**
     * The case admin a room token names as `mintedBy`: the issuer; for a code issued in an operator-code session, the
     * admin who minted that day's operator code (O-10); `UNKNOWN_MINTER` when neither can be resolved any more.
     */
    private issuerIdOf(row: RoomCodeRecord): string {
        if (row.issuedBy?.nUserid && EDGE_UUID_RE.test(row.issuedBy.nUserid)) return row.issuedBy.nUserid;
        try {
            const day = boxDay(row.issuedAtMs, this.config.box.timeZone);
            const minter = this.state.operatorCodes.get(day)?.mintedBy?.nUserid;
            if (minter && EDGE_UUID_RE.test(minter)) return minter;
        } catch (err) {
            this.logger.warn(`could not resolve the operator-code minter of room code ${row.id}: ${describe(err)}`);
        }
        return UNKNOWN_MINTER;
    }

    // ---- operator-code sign-in (DR7, O-10) ------------------------------------------------------------------------

    async operatorSignIn(req: OperatorCodeSignInRequest, ctx: EdgeRequestContext): Promise<Reply<OperatorCodeSignInResponse>> {
        requireCodeFeature(this.config, 'operatorCode');
        const raw = isRecord(req) ? req.code : undefined;
        if (typeof raw !== 'string' || raw.length > EDGE_CODE_INPUT_MAX) throw invalid('code must be a string');
        const code = normalizeOperatorCode(raw);
        if (!OPERATOR_CODE_RE.test(code)) throw invalid('an operator code is OPR plus 6 letters and digits');

        const nowMs = this.clock();
        const presented = usableDeviceCookie(ctx?.deviceCookie);
        const presentedHash = presented ? deviceHash(presented) : null;
        const keys = lockoutKeys(ctx?.ip ?? null, presentedHash);
        const base = { atMs: nowMs, action: 'operator-code-sign-in' as const, actor: null, nSesid: null, target: null, ip: ctx?.ip ?? null, deviceHash: presentedHash };

        const locked = this.lockout.lockedFor(keys, nowMs);
        if (locked > 0) {
            this.audit({ ...base, outcome: 'code_locked', data: null });
            throw new EdgePortError('code_locked', 'too many wrong codes', { retryAfterSec: locked });
        }

        const tz = this.config.box.timeZone;
        const today = boxDay(nowMs, tz);
        const record = this.state.operatorCodes.get(today);
        if (!record || !(await operatorCodeMatches(code, record))) {
            for (const offset of OPERATOR_OTHER_DAYS) {
                const other = this.state.operatorCodes.get(addBoxDays(today, offset));
                if (other && (await operatorCodeMatches(code, other))) {
                    this.audit({ ...base, outcome: 'code_expired', data: { day: other.day } });
                    throw new EdgePortError('code_expired', "the operator code is for another day", { sessionName: null, endedAtMs: null });
                }
            }
            const verdict = this.lockout.fail(keys, nowMs);
            if (verdict.retryAfterSec > 0) {
                this.audit({ ...base, outcome: 'code_locked', data: { wrong: true } });
                throw new EdgePortError('code_locked', 'too many wrong codes', { retryAfterSec: verdict.retryAfterSec });
            }
            this.audit({ ...base, outcome: 'code_wrong', data: null });
            throw new EdgePortError('code_wrong', 'not today\'s operator code', { attemptsLeft: verdict.attemptsLeft });
        }

        const identity = this.state.identity.get();
        if (!identity) throw new EdgePortError('box_not_configured', 'the box has no identity');
        const validUntilMs = endOfBoxDayMs(today, tz);
        const signer = EdgeBoxTokenSigner.create(identity.nEdgeid, this.state.identity.secret('box-token-signing'));
        const minted = await signer.mintOperatorToken({ day: today, mintedBy: record.mintedBy.nUserid, nowMs, validUntilMs });
        try {
            this.state.operatorCodes.recordUse(today, nowMs);
        } catch (err) {
            this.logger.warn(`operator-code use not counted: ${describe(err)}`);
        }
        this.lockout.succeed(keys);
        this.audit({ ...base, outcome: 'ok', data: { day: today, mintedBy: record.mintedBy.nUserid } });
        return { status: 'ok', token: minted.token, kind: 'operator', name: OPERATOR_DISPLAY_NAME, day: today, validUntilMs, mintedBy: { ...record.mintedBy } };
    }

    // ---- Box settings → Room codes (DR10, §4.10) ------------------------------------------------------------------

    listRoomCodes(principal: EdgePrincipal, nSesid: string | null): Reply<RoomCodeListResponse> {
        requireCodeFeature(this.config, 'roomCodes');
        if (nSesid !== null && nSesid !== undefined && (typeof nSesid !== 'string' || !nSesid.trim() || nSesid.length > 64)) throw invalid('nSesid must be a session id');
        if (!principal.caseIds.length) return { rows: [], unusedCount: 0 };
        const records = this.state.roomCodes.list({ ...(nSesid ? { nSesid: nSesid.trim() } : {}), nCaseids: principal.caseIds });
        const toRow = this.rowMapper(principal);
        const rows = records.filter(r => this.auth.canSeeCase(principal, r.nCaseid)).map(toRow);
        return { rows, unusedCount: rows.filter(r => r.status === 'unused').length };
    }

    roomCodePicker(principal: EdgePrincipal): Reply<RoomCodePickerResponse> {
        requireCodeFeature(this.config, 'roomCodes');
        const sessions: Array<RoomCodePickerSession & { readonly order: number }> = [];
        for (const nCaseid of principal.caseIds) {
            const caseName = this.state.assignments.case(nCaseid)?.cCasename ?? '';
            for (const s of this.state.sessions.forCase(nCaseid)) {
                if (isSessionGone(s) || s.sealedAtMs != null || s.localState === 'sealed' || s.localState === 'complete') continue;
                if (!this.auth.canOpenSession(principal, s.nSesid)) continue;
                const view = this.kernelView(s.nSesid);
                const phase = sessionPhaseOf(s, view);
                const admin = this.isCaseAdmin(principal, s.nCaseid);
                const ended = isSessionEnding(s, view);
                const blockedReason = !admin ? 'not-case-admin' : ended ? 'session-ended' : null;
                sessions.push({
                    nSesid: s.nSesid,
                    nCaseid: s.nCaseid,
                    sessionName: s.cName,
                    caseName,
                    startAtMs: sessionStartAtMs(s.dStartDt, usableZone(s.tz, this.config.box.timeZone)),
                    phase,
                    canIssue: blockedReason === null,
                    blockedReason,
                    people: this.pickerPeople(s.nSesid),
                    order: phase === 'live' ? 0 : phase === 'not-started' ? 1 : 2,
                });
            }
        }
        sessions.sort((a, b) => a.order - b.order || startOrder(a.startAtMs, b.startAtMs) || a.sessionName.localeCompare(b.sessionName));
        return { sessions: sessions.map(({ order: _order, ...s }) => s), operatorNameRequired: principal.kind === 'operator' };
    }

    issueRoomCodes(principal: EdgePrincipal, req: IssueRoomCodesRequest, ctx: EdgeRequestContext): Reply<IssueRoomCodesResponse> {
        requireCodeFeature(this.config, 'roomCodes');
        this.auth.requireBoxAdmin(principal);
        if (!isRecord(req)) throw invalid('the body must be a JSON object');
        const nSesid = typeof req.nSesid === 'string' ? req.nSesid.trim() : '';
        if (!nSesid || nSesid.length > 64) throw invalid('nSesid must be a session id');
        if (!Array.isArray(req.userIds) || req.userIds.length < 1 || req.userIds.length > ROOM_CODE_ISSUE_MAX) throw invalid(`userIds must list 1-${ROOM_CODE_ISSUE_MAX} people`);
        if (!req.userIds.every(u => typeof u === 'string' && u.trim() && u.length <= 64)) throw invalid('userIds must be user ids');
        const userIds = req.userIds.map(u => u.trim());
        if (new Set(userIds.map(idKey)).size !== userIds.length) throw invalid('userIds must be distinct');
        if (req.operatorName !== undefined && req.operatorName !== null && typeof req.operatorName !== 'string') throw invalid('operatorName must be a string');

        const session = this.issuableSession(principal, nSesid);
        const operatorName = this.operatorName(principal, req.operatorName);
        const actor = actorOf(principal, operatorName);
        const nowMs = this.clock();
        const members = this.sessionMembers(session.nSesid);
        const results: RoomCodeIssueResult[] = this.state.transaction(() =>
            userIds.map((nUserid): RoomCodeIssueResult => {
                const member = members.get(idKey(nUserid));
                if (!member) {
                    const known = EDGE_UUID_RE.test(nUserid) && !!this.state.roster.person(nUserid);
                    return { status: 'refused', nUserid, error: known ? 'not_on_case_team' : 'user_not_found' };
                }
                return { status: 'issued', nUserid, issued: this.issueOne(session, member, actor, nowMs) };
            }),
        );
        for (const r of results) {
            this.audit({
                atMs: nowMs,
                action: 'room-code-issue',
                actor,
                outcome: r.status === 'issued' ? 'ok' : r.error,
                nSesid: session.nSesid,
                target: r.status === 'issued' ? r.issued.id : null,
                ip: ctx?.ip ?? null,
                deviceHash: this.cookieHash(ctx),
                data: r.status === 'issued' ? { nUserid: r.nUserid, replacedId: r.issued.replacedId } : { nUserid: r.nUserid },
            });
        }
        return { nSesid: session.nSesid, sessionName: session.cName, caseName: this.state.assignments.case(session.nCaseid)?.cCasename ?? '', results };
    }

    revokeRoomCode(principal: EdgePrincipal, id: string, ctx: EdgeRequestContext): Reply<RoomCodeRowResponse> {
        requireCodeFeature(this.config, 'roomCodes');
        this.auth.requireBoxAdmin(principal);
        const row = this.adminRow(principal, id);
        if (row.status === 'used' || row.status === 'ended') throw new EdgePortError('code_already_used', 'the code was used: end the room access instead');
        let updated = row;
        if (row.status === 'unused') {
            const nowMs = this.clock();
            updated = this.state.roomCodes.finish(row.id, 'revoked', nowMs) ?? this.state.roomCodes.get(row.id) ?? row;
            if (updated.status === 'used' || updated.status === 'ended') throw new EdgePortError('code_already_used', 'the code was used meanwhile: end the room access instead');
            this.audit({ atMs: nowMs, action: 'room-code-revoke', actor: actorOf(principal), outcome: 'ok', nSesid: row.nSesid, target: row.id, ip: ctx?.ip ?? null, deviceHash: this.cookieHash(ctx), data: { nUserid: row.nUserid } });
        }
        return { row: this.rowMapper(principal)(updated) };
    }

    endRoomAccess(principal: EdgePrincipal, id: string, ctx: EdgeRequestContext): Reply<RoomCodeRowResponse> {
        requireCodeFeature(this.config, 'roomCodes');
        this.auth.requireBoxAdmin(principal);
        const row = this.adminRow(principal, id);
        if (row.status === 'unused' || row.status === 'revoked' || row.status === 'expired') throw new EdgePortError('code_not_used', 'the code was never used: revoke it instead');
        let updated = row;
        if (row.status === 'used') {
            const nowMs = this.clock();
            updated = this.state.roomCodes.finish(row.id, 'ended', nowMs) ?? this.state.roomCodes.get(row.id) ?? row;
            if (updated.status !== 'ended') throw new EdgePortError('code_not_used', 'the code is not in use');
            const jti = updated.tokenJti ?? row.tokenJti;
            if (jti) {
                this.state.revocations.denyJti(jti, nowMs + ROOM_CODE_ACCESS_MAX_MS + EDGE_BOX_CLOCK_SKEW_MS, 'room-access-ended', nowMs);
                try {
                    this.bus.publish('access-revoked', { jtis: [jti], userIds: [], reason: 'room-access-ended', atMs: nowMs });
                } catch (err) {
                    this.logger.error(`could not publish access-revoked for an ended room access: ${describe(err)}`);
                }
            }
            this.audit({ atMs: nowMs, action: 'room-code-end-access', actor: actorOf(principal), outcome: 'ok', nSesid: row.nSesid, target: row.id, ip: ctx?.ip ?? null, deviceHash: this.cookieHash(ctx), data: { nUserid: row.nUserid } });
        }
        return { row: this.rowMapper(principal)(updated) };
    }

    reissueRoomCode(principal: EdgePrincipal, id: string, req: ReissueRoomCodeRequest, ctx: EdgeRequestContext): Reply<ReissueRoomCodeResponse> {
        requireCodeFeature(this.config, 'roomCodes');
        this.auth.requireBoxAdmin(principal);
        const body = req === undefined || req === null ? {} : req;
        if (!isRecord(body)) throw invalid('the body must be a JSON object');
        if (body.operatorName !== undefined && body.operatorName !== null && typeof body.operatorName !== 'string') throw invalid('operatorName must be a string');
        const row = this.adminRow(principal, id);
        const session = this.state.sessions.get(row.nSesid);
        if (isSessionGone(session)) throw new EdgePortError('not_found', 'no such room code');
        if (isSessionEnding(session, this.kernelView(session.nSesid))) throw new EdgePortError('session_ended', 'the session has ended');
        const operatorName = this.operatorName(principal, body.operatorName);
        const actor = actorOf(principal, operatorName);
        // The issue rule holds for a re-issue too: only someone who may still open the session gets a new code.
        const member = this.sessionMembers(session.nSesid).get(idKey(row.nUserid));
        if (!member) throw invalid('the person is no longer on the case team of this session');
        const nowMs = this.clock();
        const issued = this.state.transaction(() => this.issueOne(session, member, actor, nowMs));
        this.audit({ atMs: nowMs, action: 'room-code-reissue', actor, outcome: 'ok', nSesid: session.nSesid, target: issued.id, ip: ctx?.ip ?? null, deviceHash: this.cookieHash(ctx), data: { from: row.id, nUserid: row.nUserid, replacedId: issued.replacedId } });
        return { issued, row: this.rowMapper(principal)(this.state.roomCodes.get(row.id) ?? row) };
    }

    // ---- operator code, box side (DR7, O-10) -----------------------------------------------------------------------

    operatorCodeStatus(_principal: EdgePrincipal, nowMs: number): Reply<OperatorCodeStatusResponse> {
        requireCodeFeature(this.config, 'operatorCode');
        const tz = this.config.box.timeZone;
        const day = boxDay(nowMs, tz);
        const record: OperatorCodeRecord | null = this.state.operatorCodes.get(day);
        return {
            day,
            issued: !!record,
            issuedAtMs: record?.issuedAtMs ?? null,
            mintedBy: record ? { ...record.mintedBy } : null,
            validUntilMs: record ? endOfBoxDayMs(day, tz) : null,
            usesToday: record?.uses ?? 0,
        };
    }

    async issueOperatorCode(principal: EdgePrincipal, ctx: EdgeRequestContext): Promise<Reply<OperatorCodeIssueResponse>> {
        requireCodeFeature(this.config, 'operatorCode');
        this.auth.requireOnlineCaseAdmin(principal);
        const base = { action: 'operator-code-issue' as const, actor: actorOf(principal), nSesid: null, target: null, ip: ctx?.ip ?? null, deviceHash: this.cookieHash(ctx) };
        let relayed;
        try {
            relayed = await this.uplink.relayOperatorCode(principal);
        } catch (err) {
            this.audit({ ...base, atMs: this.clock(), outcome: err instanceof EdgePortError ? err.code : 'server_error', data: null });
            throw err;
        }
        const code = normalizeOperatorCode(relayed.code);
        this.audit({ ...base, atMs: this.clock(), outcome: 'ok', data: { day: relayed.day, replacedEarlier: relayed.replacedEarlier } });
        return {
            code,
            display: formatOperatorCode(code),
            day: relayed.day,
            validUntilMs: relayed.validUntilMs,
            mintedBy: { ...relayed.mintedBy },
            replacedEarlier: relayed.replacedEarlier,
        };
    }

    // ---- helpers -----------------------------------------------------------------------------------------------------

    /** Request-level checks of an issue, in port order: session_not_found, not_case_admin, session_ended. */
    private issuableSession(principal: EdgePrincipal, nSesid: string): BoxSessionRecord {
        const session = this.state.sessions.get(nSesid);
        if (isSessionGone(session) || !this.auth.canSeeCase(principal, session.nCaseid)) throw new EdgePortError('session_not_found', 'no such session on this box');
        if (!this.isCaseAdmin(principal, session.nCaseid)) throw new EdgePortError('not_case_admin', 'room codes need case admin of the session\'s case');
        if (isSessionEnding(session, this.kernelView(session.nSesid))) throw new EdgePortError('session_ended', 'the session has ended');
        return session;
    }

    /** O-10: an operator session must name the person issuing (2–80 characters); others never record one. */
    private operatorName(principal: EdgePrincipal, raw: unknown): string | null {
        if (principal.kind !== 'operator') return null;
        const name = typeof raw === 'string' ? raw.trim() : '';
        if (name.length < OPERATOR_NAME_MIN || name.length > OPERATOR_NAME_MAX) throw new EdgePortError('operator_name_required', 'type the operator name (2-80 characters)');
        return name;
    }

    /** A room-code row the principal may administer, or `not_found` / `not_case_admin` (port order). */
    private adminRow(principal: EdgePrincipal, id: string): RoomCodeRecord {
        if (typeof id !== 'string' || !id.trim() || id.length > 64) throw new EdgePortError('not_found', 'no such room code');
        const row = this.state.roomCodes.get(id.trim());
        if (!row || !this.auth.canSeeCase(principal, row.nCaseid)) throw new EdgePortError('not_found', 'no such room code');
        if (!this.isCaseAdmin(principal, row.nCaseid)) throw new EdgePortError('not_case_admin', 'room codes need case admin of the session\'s case');
        return row;
    }

    private isCaseAdmin(principal: EdgePrincipal, nCaseid: string): boolean {
        return principal.adminCaseIds.some(id => sameId(id, nCaseid));
    }

    /** Active people who may open the session (case team ∪ session assignees), one per user, by name. */
    private sessionMembers(nSesid: string): Map<string, BoxRosterMember> {
        const members = new Map<string, BoxRosterMember>();
        for (const m of this.state.roster.forSession(nSesid)) {
            if (!m.active) continue;
            const key = idKey(m.nUserid);
            const known = members.get(key);
            if (!known || (known.source === 'session' && m.source === 'team')) members.set(key, m);
        }
        return members;
    }

    private pickerPeople(nSesid: string): RoomCodePickerPerson[] {
        return [...this.sessionMembers(nSesid).values()]
            .map(m => ({
                ...personOf(m),
                hasUnusedCode: !!this.state.roomCodes.unusedFor(nSesid, m.nUserid),
                hasAccess: !!this.state.roomCodes.usedFor(nSesid, m.nUserid),
            }))
            .sort((a, b) => a.name.localeCompare(b.name) || a.nUserid.localeCompare(b.nUserid));
    }

    /** Issue one code (inside the caller's transaction): revoke the person's earlier unused one, store the new hash. */
    private issueOne(session: BoxSessionRecord, member: Pick<BoxRosterMember, 'nUserid' | 'name' | 'role'>, actor: EdgeActor, nowMs: number): IssuedRoomCode {
        const previous = this.state.roomCodes.unusedFor(session.nSesid, member.nUserid);
        if (previous) this.state.roomCodes.finish(previous.id, 'revoked', nowMs);
        const secret = this.state.identity.secret('room-code-hmac');
        for (let attempt = 0; attempt < 16; attempt++) {
            const code = generateRoomCode();
            const codeHash = roomCodeHash(secret, code);
            if (this.state.roomCodes.findByHash(codeHash)) continue;
            const record = this.state.roomCodes.insert({
                id: randomUUID(),
                nSesid: session.nSesid,
                nCaseid: session.nCaseid,
                nUserid: member.nUserid,
                codeHash,
                issuedAtMs: nowMs,
                issuedBy: actor,
                replacedId: previous?.id ?? null,
            });
            return { id: record.id, person: personOf(member), code, display: formatRoomCode(code), replacedId: previous?.id ?? null };
        }
        throw new EdgePortError('server_error', 'could not draw an unused room code');
    }

    /** Maps stored rows to contract rows for one viewer; session, case and roster reads are shared across the rows. */
    private rowMapper(principal: EdgePrincipal): (r: RoomCodeRecord) => RoomCodeRow {
        const sessions = new Map<string, { readonly name: string; readonly open: boolean; readonly members: Map<string, BoxRosterMember> }>();
        const caseNames = new Map<string, string>();
        const sessionFacts = (nSesid: string) => {
            let facts = sessions.get(nSesid);
            if (!facts) {
                const s = this.state.sessions.get(nSesid);
                facts = { name: s?.cName ?? '', open: !isSessionGone(s) && !isSessionEnding(s, this.kernelView(nSesid)), members: this.sessionMembers(nSesid) };
                sessions.set(nSesid, facts);
            }
            return facts;
        };
        const caseName = (nCaseid: string): string => {
            if (!caseNames.has(nCaseid)) caseNames.set(nCaseid, this.state.assignments.case(nCaseid)?.cCasename ?? '');
            return caseNames.get(nCaseid);
        };
        return (r: RoomCodeRecord): RoomCodeRow => {
            const facts = sessionFacts(r.nSesid);
            const admin = this.isCaseAdmin(principal, r.nCaseid);
            const member = facts.members.get(idKey(r.nUserid)) ?? this.state.roster.forCase(r.nCaseid).find(m => sameId(m.nUserid, r.nUserid));
            const person: RoomCodePerson = member ? personOf(member) : { nUserid: r.nUserid, name: this.state.roster.person(r.nUserid)?.name ?? '', role: null };
            return {
                id: r.id,
                nSesid: r.nSesid,
                nCaseid: r.nCaseid,
                sessionName: facts.name,
                caseName: caseName(r.nCaseid),
                person,
                status: r.status,
                issuedAtMs: r.issuedAtMs,
                issuedBy: r.issuedBy,
                usedAtMs: r.usedAtMs,
                deviceLabel: r.deviceLabel,
                revokedAtMs: r.revokedAtMs,
                endedAtMs: r.endedAtMs,
                can: {
                    revoke: admin && r.status === 'unused',
                    endAccess: admin && r.status === 'used',
                    reissue: admin && facts.open && r.status !== 'expired',
                },
            };
        };
    }

    /** The kernel's live view when it holds the session open; null otherwise (or when the kernel is unavailable). */
    private kernelView(nSesid: string) {
        try {
            return this.kernel.session(nSesid);
        } catch {
            return null;
        }
    }

    private cookieHash(ctx: EdgeRequestContext | null | undefined): string | null {
        const cookie = usableDeviceCookie(ctx?.deviceCookie);
        return cookie ? deviceHash(cookie) : null;
    }

    /** Audit rows never fail the action they record; a failure is logged (the action itself already happened). */
    private audit(entry: EdgeAuditEntry): void {
        try {
            this.state.audit.append(entry);
        } catch (err) {
            this.logger.error(`audit '${entry.action}' could not be written: ${describe(err)}`);
        }
    }
}

function personOf(m: Pick<BoxRosterMember, 'nUserid' | 'name' | 'role'>): RoomCodePerson {
    return { nUserid: m.nUserid, name: m.name, role: m.role ?? null };
}

/** Earliest start first; sessions without a start last. */
function startOrder(a: number | null, b: number | null): number {
    if (a === b) return 0;
    if (a === null) return 1;
    if (b === null) return -1;
    return a - b;
}

function describe(err: unknown): string {
    return err instanceof Error ? err.message : String(err);
}
