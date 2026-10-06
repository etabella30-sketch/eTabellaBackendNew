/**
 * The failure answers each live host gave BEFORE the route moved here, kept byte for byte (plan D7: unify later,
 * route by route, with approval). The host registers these with its LegacyEnvelope (CloudPlatformModule.forRoot)
 * keyed by route id; a DomainError the TeamUsersService throws then renders as:
 * - coreapi `common/myteamusers`: HTTP 200 with one failure row, `[{ msg: -1, value: 'Failed ', error }]`
 *   (CommonService.getMyteamusers); an SP that reported failure inside a successful cursor is passed through as
 *   that row, as it was;
 * - realtime-server `factsheet/teamusers`: HTTP 500 "Failed to fetch team members" in the HttpErrorFilter body,
 *   never the database diagnostic (FactsheetService.getTeamUsers).
 * The box never uses these: its EdgeEnvelope answers the contract envelope, or the relayed answer as the cloud gave it.
 */
import type { Response } from 'express';
import { DomainError, sendLegacyHttpError } from '@app/api-kernel';

import { CORE_TEAM_USERS_ROUTE_ID } from './core-team-users.controller';
import { REALTIME_TEAM_USERS_ROUTE_ID } from './realtime-team-users.controller';
import { TEAM_USERS_FAILED } from '../team-users.service';

/** The same signature as platform-cloud's LegacyShape, written here so this lib never imports the live-only lib. */
export type LegacyShapeHandler = (res: Response, err: DomainError, routeId: string) => void;

// The ArgumentsHost helper moved to @app/api-kernel (http-error.filter.ts) in Phase 7a; kept here for its importers.
export { responseArgumentsHost } from '@app/api-kernel';

/** coreapi: the legacy failure row, or the SP's own failure row when it reported one. */
export function coreTeamUsersFailure(err: DomainError): unknown[] {
  const row = (err.detail as { row?: unknown } | undefined)?.row;
  if (row && typeof row === 'object') return [row];
  const error = (err.detail as { error?: unknown } | undefined)?.error;
  return [{ msg: -1, value: 'Failed ', error: error === undefined ? err.message : error }];
}

export const TEAM_USERS_LEGACY_SHAPES: Readonly<Record<string, LegacyShapeHandler>> = Object.freeze({
  [CORE_TEAM_USERS_ROUTE_ID]: (res: Response, err: DomainError): void => {
    res.status(200).json(coreTeamUsersFailure(err));
  },
  [REALTIME_TEAM_USERS_ROUTE_ID]: (res: Response): void => {
    sendLegacyHttpError(res, 500, TEAM_USERS_FAILED);
  },
});
