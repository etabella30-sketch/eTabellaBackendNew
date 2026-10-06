/**
 * The failure answers each live host gave BEFORE the route moved here, kept byte for byte (plan D7): both answered
 * HTTP 200 with the row `{ msg: -1, value: 'Failed to fetch', error }` (CommonService.getcCodeMaster,
 * IssueService.getcCodeMaster), coreapi's inside a one-row list, realtime-server's bare. The host registers these
 * with its LegacyEnvelope (CloudPlatformModule.forRoot) keyed by route id. The box never uses them: its EdgeEnvelope
 * answers the contract envelope, or the relayed answer as the cloud gave it.
 */
import type { Response } from 'express';
import { DomainError } from '@app/api-kernel';

import { CORE_CODE_TABLE_ROUTE_ID, REALTIME_CODE_TABLE_ROUTE_ID } from './code-tables.controllers';
import { CODE_TABLE_FAILED } from '../code-tables.service';

/** The same signature as platform-cloud's LegacyShape, written here so this lib never imports the live-only lib. */
export type LegacyShapeHandler = (res: Response, err: DomainError, routeId: string) => void;

/** The row both hosts built: what the SP said under `error`, the DomainError's message when it said nothing. */
export function codeTableFailureRow(err: DomainError): { msg: -1; value: string; error: unknown } {
  const error = (err.detail as { error?: unknown } | undefined)?.error;
  return { msg: -1, value: CODE_TABLE_FAILED, error: error === undefined ? err.message : error };
}

export const CODE_TABLE_LEGACY_SHAPES: Readonly<Record<string, LegacyShapeHandler>> = Object.freeze({
  [CORE_CODE_TABLE_ROUTE_ID]: (res: Response, err: DomainError): void => {
    res.status(200).json([codeTableFailureRow(err)]);
  },
  [REALTIME_CODE_TABLE_ROUTE_ID]: (res: Response, err: DomainError): void => {
    res.status(200).json(codeTableFailureRow(err));
  },
});
