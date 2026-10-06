/**
 * The operations port of the Full Fact editor (plan §3.3): what the shared factsheet controllers ask for, in domain
 * terms. realtime-server binds FactsheetService (the SPs over SP_EXECUTOR); the venue box binds a relay adapter over
 * CLOUD_RELAY for the eight rows it serves. Every answer is the legacy wire body (a row, a list, the SP's cursors,
 * or a `{ msg: -1, value, error }` failure row answered with 200/201 as the routes always did); only the permission
 * lookup's fault (unavailable) and an unknown fact (not_found) are DomainErrors, rendered by the host's envelope.
 */
import type { Caller } from '@app/api-kernel';

import type { FactsheetQueryFields, FactsheetSaveFields } from './dto/factsheet.dto';

export const FACTSHEET_OPS = 'RT_FACTSHEET_OPS';

/** A failure the routes answer as a 2xx body. */
export interface FactsheetFailure {
  readonly msg: -1;
  readonly value: string;
  readonly error?: unknown;
}

export interface FactsheetOperations {
  /** `factsheet/detail`: the fact row, or the refusal row for a caller who may not view it. */
  detail(caller: Caller, query: FactsheetQueryFields): Promise<unknown>;
  /** `factsheet/permissions`: the caller's et_fact_permissions row (it names the owner: viewers only). */
  permissions(caller: Caller, query: FactsheetQueryFields): Promise<unknown>;
  shared(caller: Caller, query: FactsheetQueryFields): Promise<unknown>;
  issues(caller: Caller, query: FactsheetQueryFields): Promise<unknown>;
  contacts(caller: Caller, query: FactsheetQueryFields): Promise<unknown>;
  /** `factsheet/tasks`: the three cursors of et_factsheet_tasks. */
  tasks(caller: Caller, query: FactsheetQueryFields): Promise<unknown>;
  links(caller: Caller, query: FactsheetQueryFields): Promise<unknown>;
  /** `factsheet/factannotation`: the fact's highlight geometry (no owner filter in the SP). */
  annotation(caller: Caller, query: FactsheetQueryFields): Promise<unknown>;
  /** `factsheet/save`: edit the fact; with bIsUserUpdated and reshare rights, replace its share list. */
  save(caller: Caller, body: FactsheetSaveFields): Promise<unknown>;
  /** `factsheet/unshare`: "Remove from my list". */
  unshare(caller: Caller, body: FactsheetQueryFields): Promise<unknown>;
  /** `factsheet/delete`. */
  remove(caller: Caller, body: FactsheetQueryFields): Promise<unknown>;
}
