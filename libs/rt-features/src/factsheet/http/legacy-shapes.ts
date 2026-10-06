/**
 * The error answers realtime-server gave on the Full Fact editor's routes BEFORE they moved here, kept byte for byte
 * (plan D7). Only two outcomes are errors there (everything else is a 2xx body the service builds): the permission
 * lookup's fault, `throw new InternalServerErrorException('Could not check access to this fact')` (HTTP 500 in the
 * HttpErrorFilter body), and an unknown fact, `throw new NotFoundException('Fact not found')` (404). The visibility
 * rule reports the fault as DomainError 'unavailable', whose default live rendering would be 503, so every route id
 * of the feature maps it back to 500 here; every other code renders as Nest's class for its status, which is what
 * the LegacyEnvelope does on its own. The box never uses these: its EdgeEnvelope answers the relayed answer as the
 * cloud gave it.
 */
import type { Response } from 'express';
import { DOMAIN_ERROR_STATUS, DomainError, sendLegacyHttpError } from '@app/api-kernel';

import { FACTSHEET_BOX_ROUTE_IDS } from './factsheet.controller';
import { FACTSHEET_LIVE_ROUTE_IDS } from './factsheet-live.controller';

/** The same signature as platform-cloud's LegacyShape, written here so this lib never imports the live-only lib. */
export type LegacyShapeHandler = (res: Response, err: DomainError, routeId: string) => void;

/** Every route id of the feature. */
export const FACTSHEET_ROUTE_IDS: readonly string[] = Object.freeze([...FACTSHEET_BOX_ROUTE_IDS, ...FACTSHEET_LIVE_ROUTE_IDS]);

/** The live status of a factsheet DomainError: the lookup fault is realtime-server's 500, the rest Nest's mapping. */
export function factsheetLegacyStatus(err: DomainError): number {
  return err.code === 'unavailable' ? 500 : DOMAIN_ERROR_STATUS[err.code] ?? 500;
}

export function factsheetLegacyShape(res: Response, err: DomainError): void {
  sendLegacyHttpError(res, factsheetLegacyStatus(err), err.message);
}

export const FACTSHEET_LEGACY_SHAPES: Readonly<Record<string, LegacyShapeHandler>> = Object.freeze(
  Object.fromEntries(FACTSHEET_ROUTE_IDS.map((id) => [id, factsheetLegacyShape])),
);
