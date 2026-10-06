/**
 * The error answers the hosts gave on the DocLink routes BEFORE they moved here, kept as close as the shared envelope
 * allows (plan D7). realtime-server threw plain-message HttpExceptions (403 'You do not have a permission for delete',
 * 403 'You are not permitted to add document links to this case', 500 'Could not check access to this case' /
 * '... this DocLink'); the gates now report a lookup fault as DomainError 'unavailable', whose default live rendering
 * would be 503, so every route id of the feature maps it back to 500 here; every other code renders as Nest's class
 * for its status (403 for a refusal), which is what the LegacyEnvelope does on its own. coreapi used to wrap its
 * refusals as `{ msg: -1, value }` objects inside the exception; it now answers the same statuses with the message
 * text (a recorded D7 difference: the legacy app reads the status only). The box never uses these: its EdgeEnvelope
 * answers the relayed answer as the cloud gave it.
 */
import type { Response } from 'express';
import { DOMAIN_ERROR_STATUS, DomainError, sendLegacyHttpError } from '@app/api-kernel';

import { DOCLINK_BOX_ROUTE_IDS } from './doclink.controller';
import { DOCLINK_LIVE_ROUTE_IDS } from './doclink-live.controller';

/** The same signature as platform-cloud's LegacyShape, written here so this lib never imports the live-only lib. */
export type LegacyShapeHandler = (res: Response, err: DomainError, routeId: string) => void;

/** Every route id of the feature. */
export const DOCLINK_ROUTE_IDS: readonly string[] = Object.freeze([...DOCLINK_BOX_ROUTE_IDS, ...DOCLINK_LIVE_ROUTE_IDS]);

/** The live status of a DocLink DomainError: a lookup fault is the hosts' 500, the rest Nest's mapping. */
export function doclinkLegacyStatus(err: DomainError): number {
  return err.code === 'unavailable' ? 500 : DOMAIN_ERROR_STATUS[err.code] ?? 500;
}

export function doclinkLegacyShape(res: Response, err: DomainError): void {
  sendLegacyHttpError(res, doclinkLegacyStatus(err), err.message);
}

export const DOCLINK_LEGACY_SHAPES: Readonly<Record<string, LegacyShapeHandler>> = Object.freeze(
  Object.fromEntries(DOCLINK_ROUTE_IDS.map((id) => [id, doclinkLegacyShape])),
);
