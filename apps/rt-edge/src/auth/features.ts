/**
 * The per-box switches of the two code sign-ins (`BoxConfig.features.roomCodes` / `operatorCode`, served in
 * `/edge-config.json`). v1 ships with BOTH OFF (build decision 2026-10-01, "email sign-in only for v1", DR23): the
 * online email sign-in (PKCE on etabella.net) is then the only way in. The code paths stay built, switched off.
 *
 * With a switch off:
 * - every route of that kind answers `404 {msg:-1, error:'feature_disabled', message}` BEFORE any sign-in check (a
 *   code route has nothing to sign in to): room codes = `POST /edge/auth/room-code` and every
 *   `/edge/local/room-codes…` route; operator code = `POST /edge/auth/operator-code` and `/edge/local/operator-code…`;
 * - a box-signed token of that kind (minted before the switch went off) is no longer a valid sign-in (401
 *   `unauthenticated`, so the FE signs in again by email), on HTTP and on the LAN socket;
 * - `EdgeMeResponse.roomCodeCaseIds` is empty (nobody may issue room codes).
 *
 * `feature_disabled` is a contract error code (`EDGE_ERROR_CODES`, 404; CONTRACTS.md §3).
 */
import type { EdgeErrorBody } from '../contracts';
import { BoxConfig, EdgePortError } from '../ports';

/** The two code sign-ins a box can switch off. */
export type EdgeCodeFeature = 'roomCodes' | 'operatorCode';

/** The error code of a switched-off route (DR23). */
export const EDGE_FEATURE_DISABLED = 'feature_disabled';

/** The reply body of a switched-off route: exactly `{msg, error, message}`, no extras. */
export type EdgeFeatureDisabledBody = EdgeErrorBody<'feature_disabled'>;

/** Thrown by every route (and AccessPort method) of a switched-off code sign-in: 404 `feature_disabled`. */
export class EdgeFeatureDisabledError extends EdgePortError<'feature_disabled'> {
    constructor(readonly feature: EdgeCodeFeature) {
        super(EDGE_FEATURE_DISABLED, feature === 'roomCodes' ? 'room codes are switched off on this box' : 'the operator code is switched off on this box');
        this.name = 'EdgeFeatureDisabledError';
    }
}

export function isFeatureDisabled(err: unknown): err is EdgeFeatureDisabledError {
    return err instanceof EdgeFeatureDisabledError;
}

/** Is this code sign-in switched on for this box? Anything but an explicit `true` reads as off. */
export function codeFeatureOn(config: Pick<BoxConfig, 'features'> | null | undefined, feature: EdgeCodeFeature): boolean {
    return config?.features?.[feature] === true;
}

/** Throws `EdgeFeatureDisabledError` unless the code sign-in is switched on. */
export function requireCodeFeature(config: Pick<BoxConfig, 'features'> | null | undefined, feature: EdgeCodeFeature): void {
    if (!codeFeatureOn(config, feature)) throw new EdgeFeatureDisabledError(feature);
}

/** The switch that governs a box-signed token kind. */
export function featureOfBoxTokenKind(kind: 'room-code' | 'operator'): EdgeCodeFeature {
    return kind === 'room-code' ? 'roomCodes' : 'operatorCode';
}
