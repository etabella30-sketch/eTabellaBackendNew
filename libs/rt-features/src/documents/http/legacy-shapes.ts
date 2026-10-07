/**
 * The failure answer coreapi's document reads always gave, kept for the shared controller realtime-server mounts for
 * the venue box (plan D7): HTTP 200 with the row `{ msg: -1, value: 'Failed to fetch', error }`
 * (BundleCreationService, every read). The box relays that answer byte for byte. One recorded difference: `error`
 * carries the database's words where coreapi serialised the raw error object.
 */
import type { Response } from 'express';
import { DomainError } from '@app/api-kernel';

import { DOCUMENTS_ROUTE_IDS } from './documents.controller';
import { DOCUMENTS_FAILED } from '../documents.service';

/** The same signature as platform-cloud's LegacyShape, written here so this lib never imports the live-only lib. */
export type LegacyShapeHandler = (res: Response, err: DomainError, routeId: string) => void;

/** coreapi's failure row: what the SP said under `error`, the DomainError's message when it said nothing. */
export function documentsFailureRow(err: DomainError): { msg: -1; value: string; error: unknown } {
  const error = (err.detail as { error?: unknown } | undefined)?.error;
  return { msg: -1, value: err.code === 'upstream' ? DOCUMENTS_FAILED : err.message, error: error === undefined ? err.message : error };
}

export const DOCUMENTS_LEGACY_SHAPES: Readonly<Record<string, LegacyShapeHandler>> = Object.freeze(
  Object.fromEntries(
    Object.values(DOCUMENTS_ROUTE_IDS).map((id) => [
      id,
      (res: Response, err: DomainError): void => {
        res.status(200).json(documentsFailureRow(err));
      },
    ]),
  ),
);
