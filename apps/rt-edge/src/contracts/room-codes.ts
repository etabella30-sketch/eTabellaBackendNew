/**
 * Box settings → Room codes (D33, DR10, §4.10, O-9, O-10). Box admins only; issuing is further limited to case
 * admins of that session's case (an operator-code session: the minting admin's cases). Codes live only on the box
 * as hashes, never in the cloud. Every issue / revoke / end-access / re-issue is audited on the box.
 */

import type { EdgeActor } from './common';
import type { EdgeSessionPhase } from './local-cases';

/**
 * State of one issued code:
 * `unused` → `used` (bound to a device) → `ended` ("End <name>'s room access");
 * `unused` → `revoked` ("Revoke unused code"); `unused` → `expired` (its session ended first).
 */
export type RoomCodeStatus = 'unused' | 'used' | 'revoked' | 'ended' | 'expired';

/** A person on a case team, from the cached roster. */
export interface RoomCodePerson {
    readonly nUserid: string;
    readonly name: string;
    /** "Counsel", "Paralegal"; null when the roster has none. */
    readonly role: string | null;
}

/** One row of the issued list (wireframe frame 14). The code itself is never listed: it was shown once. */
export interface RoomCodeRow {
    readonly id: string;
    readonly nSesid: string;
    readonly nCaseid: string;
    readonly sessionName: string;
    readonly caseName: string;
    readonly person: RoomCodePerson;
    readonly status: RoomCodeStatus;
    readonly issuedAtMs: number;
    /** "10:51 · P. Shah"; an operator-code issue carries the typed operator name too (O-10). */
    readonly issuedBy: EdgeActor;
    /** "Used 10:48 · iPad" */
    readonly usedAtMs: number | null;
    /** Coarse device class from the redeeming browser: "iPad", "iPhone", "Mac", "Windows", "Android", "Other". */
    readonly deviceLabel: string | null;
    readonly revokedAtMs: number | null;
    readonly endedAtMs: number | null;
    /** What the viewer may do with this row (false with no reason shown when not case admin of the case). */
    readonly can: {
        readonly revoke: boolean;
        readonly endAccess: boolean;
        readonly reissue: boolean;
    };
}

/** `GET /edge/local/room-codes[?nSesid=]` — newest first; only cases the viewer can see (DR19). */
export interface RoomCodeListResponse {
    readonly msg: 1;
    readonly rows: readonly RoomCodeRow[];
    /** "N unused codes" and the side-nav count (across the listed rows). */
    readonly unusedCount: number;
}

/** Why the issue control is disabled for a session, shown as the reason (DR10). */
export type RoomCodeIssueBlock = 'not-case-admin' | 'session-ended';

/** A case-team member as the picker lists them for one session. */
export interface RoomCodePickerPerson extends RoomCodePerson {
    /** Already holds an unused code for this session (issuing again replaces it). */
    readonly hasUnusedCode: boolean;
    /** Already has room access on a device for this session. */
    readonly hasAccess: boolean;
}

export interface RoomCodePickerSession {
    readonly nSesid: string;
    readonly nCaseid: string;
    readonly sessionName: string;
    readonly caseName: string;
    readonly startAtMs: number | null;
    readonly phase: EdgeSessionPhase;
    readonly canIssue: boolean;
    /** Null when `canIssue`. */
    readonly blockedReason: RoomCodeIssueBlock | null;
    /** The case team from the cached roster, by name. */
    readonly people: readonly RoomCodePickerPerson[];
}

/** `GET /edge/local/room-codes/picker` — the Session and People (case team) pickers' source. */
export interface RoomCodePickerResponse {
    readonly msg: 1;
    /** Unsealed box sessions of the cases the viewer can see, live first then by start. */
    readonly sessions: readonly RoomCodePickerSession[];
    /** The viewer is signed in with today's operator code: `operatorName` is required when issuing (O-10). */
    readonly operatorNameRequired: boolean;
}

/** `POST /edge/local/room-codes` — "Issue 2 codes" ("Issue for several people", DR10). */
export interface IssueRoomCodesRequest {
    readonly nSesid: string;
    /** 1–50 distinct people from the session's case team. */
    readonly userIds: readonly string[];
    /** Required for an operator-code session (2–80 characters), ignored otherwise (O-10). */
    readonly operatorName?: string;
}

/** A freshly issued code: shown once on the read-out card, never retrievable again. */
export interface IssuedRoomCode {
    readonly id: string;
    readonly person: RoomCodePerson;
    /** Normalized, e.g. `K7Q4M2`. */
    readonly code: string;
    /** For reading out: `K7Q-4M2`. */
    readonly display: string;
    /** The person's previous unused code for this session, now revoked; null when there was none. */
    readonly replacedId: string | null;
}

/** Per-person refusal inside a bulk issue ("one row per person"). */
export type RoomCodeIssueRefusal = 'not_on_case_team' | 'user_not_found';

export type RoomCodeIssueResult =
    | { readonly status: 'issued'; readonly nUserid: string; readonly issued: IssuedRoomCode }
    | { readonly status: 'refused'; readonly nUserid: string; readonly error: RoomCodeIssueRefusal };

/**
 * 200 — results in request order. "Works once, until the session ends." The card clears when the picker changes
 * (FE rule). Request-level errors: `not_case_admin` 403, `session_not_found` 404, `session_ended` 409,
 * `operator_name_required` 400, `invalid_request` 400.
 */
export interface IssueRoomCodesResponse {
    readonly msg: 1;
    readonly nSesid: string;
    readonly sessionName: string;
    readonly caseName: string;
    readonly results: readonly RoomCodeIssueResult[];
}

/**
 * `POST /edge/local/room-codes/:id/revoke` — "Revoke unused code". Replies the updated `RoomCodeRow` wrapped in
 * `RoomCodeRowResponse`. Errors: `code_already_used` 409 (use end-access), `not_found` 404, `not_case_admin` 403.
 *
 * `POST /edge/local/room-codes/:id/end-access` — "End <name>'s room access" (confirmed in the UI). The box revokes
 * the device's token and closes its LAN sockets at once. Errors: `code_not_used` 409 (use revoke), `not_found`,
 * `not_case_admin`.
 */
export interface RoomCodeRowResponse {
    readonly msg: 1;
    readonly row: RoomCodeRow;
}

/**
 * `POST /edge/local/room-codes/:id/reissue` — one-tap "Re-issue" (DR10): a new code for the same person and session.
 * The old code is revoked if unused; a used code's device keeps its access (use end-access for that).
 * Errors: `session_ended` 409, `operator_name_required` 400, `not_found` 404, `not_case_admin` 403.
 */
export interface ReissueRoomCodeRequest {
    readonly operatorName?: string;
}

export interface ReissueRoomCodeResponse {
    readonly msg: 1;
    readonly issued: IssuedRoomCode;
    readonly row: RoomCodeRow;
}
