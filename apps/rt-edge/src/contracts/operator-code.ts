/**
 * Daily operator code, box side (DR7, §4.10, build default O-10).
 *
 * The code is MINTED IN THE CLOUD, when a case admin marks the box ready (RT Production "Venue box ready") or asks
 * for it from Box settings while signed in online. The box keeps only a day-expiring hash, delivered with its
 * assignments; it never stores the code. What the box exposes:
 * - `GET /edge/local/operator-code`: whether today's code exists (the "Ready for today" check, DR15);
 * - `POST /edge/local/operator-code/issue`: an online relay to the cloud mint, so the "Issue operator code" fix-it
 *   action works from the box. The plaintext passes through once on its way to the browser and is not kept.
 * Signing in with the code is `POST /edge/auth/operator-code` (auth.ts).
 */

import type { EdgePersonRef } from './common';

/** `GET /edge/local/operator-code` — box admins. Never contains the code. */
export interface OperatorCodeStatusResponse {
    readonly msg: 1;
    /** Today in the box time zone (YYYY-MM-DD). */
    readonly day: string;
    /** The box holds a hash for today's code. */
    readonly issued: boolean;
    readonly issuedAtMs: number | null;
    readonly mintedBy: EdgePersonRef | null;
    /** End of today in the box time zone; null when not issued. */
    readonly validUntilMs: number | null;
    /** Operator-code sign-ins today (every use is audited). */
    readonly usesToday: number;
}

/**
 * `POST /edge/local/operator-code/issue` — no body; an ONLINE case admin of at least one box case (or a
 * super-admin), signed in with an edge token. The box relays to the cloud, which mints and returns the code; the
 * box stores the new hash (replacing today's, if any) and returns the code once ("Print or save it now").
 * Errors: `offline` 503, `online_sign_in_required` 403 (room-code or operator session), `not_case_admin` 403,
 * `cloud_refused` 502.
 */
export interface OperatorCodeIssueResponse {
    readonly msg: 1;
    /** Normalized, e.g. `OPR6Z3K91`. */
    readonly code: string;
    /** `OPR-6Z3K-91` */
    readonly display: string;
    readonly day: string;
    /** "Valid until 23:59 today." */
    readonly validUntilMs: number;
    readonly mintedBy: EdgePersonRef;
    /** Today's earlier code, if any, no longer works. */
    readonly replacedEarlier: boolean;
}
