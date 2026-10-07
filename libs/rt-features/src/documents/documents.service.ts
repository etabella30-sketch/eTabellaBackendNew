/**
 * The live executor of the document reads, the one implementation coreapi's BundlesController (its own HTTP surface,
 * with its DTOs, Swagger and API-usage log) and realtime-server's shared DocumentsController (the routes the venue box
 * relays) now share (plan Phase 10c, D12). Call for call coreapi's BundleCreationService of 2026-10-07:
 *  - sections: public.et_admin_sections, the rows sorted in the Evidence page's section-type order;
 *  - userSections: public.et_user_sections with two cursors, both answered;
 *  - bundles: public.et_bundles, on the elastic schema when the body carries jElasticBundles;
 *  - bundleDetail / bundleDetailSearch: public.et_bundledetail / et_bundledetail_search, the search request's folder
 *    scope mirrored into jFilter (cLocation 'T' + nBundleid) as the host did, because the SP scopes only from there;
 *  - folderSearch: public.et_bundle_search; bundleIndex: public.et_bundle_index;
 *  - fileData: public.et_get_filedata, behind the host's optional IDOR gate (et_can_access_filedata, switched on by
 *    the host through DOCUMENTS_OPTIONS.fileAccessGuard = DOC_ACCESS_GUARD_ENABLED): a refused document is the row
 *    `{ msg: -1, value: 'You do not have access to this document.' }`, as before.
 * The actor is the verified Caller under both identity keys (R4), never a value from the request. A failed call is a
 * DomainError `upstream` carrying what the SP said, rendered by each host as the `{ msg: -1, value: 'Failed to
 * fetch', error }` row coreapi always gave. The SPs scope every read by the caller (private, team and shared
 * folders), so nothing here filters further; the box caches per user and answers [] offline.
 *
 * Not bound on the box (no database there): the box binds a relay adapter to the same operations port.
 */
import { Inject, Injectable, Optional } from '@nestjs/common';
import { Caller, DomainError, SP_EXECUTOR, SpExecutor, SpOutcome } from '@app/api-kernel';

import type { BundleDetailFields, BundleIndexFields, BundlesFields, FileDataFields, FolderSearchFields, SectionsFields } from './dto/documents.dto';
import type { DocumentsOperations } from './documents.operations';

export const DOCUMENTS_OPTIONS = 'RT_DOCUMENTS_OPTIONS';

export interface DocumentsOptions {
  /** Run et_can_access_filedata before get_filedata (coreapi's DOC_ACCESS_GUARD_ENABLED). */
  readonly fileAccessGuard: boolean;
}

export const DOCUMENTS_SP = Object.freeze({
  sections: 'admin_sections',
  userSections: 'user_sections',
  bundles: 'bundles',
  bundleDetail: 'bundledetail',
  bundleDetailSearch: 'bundledetail_search',
  folderSearch: 'bundle_search',
  bundleIndex: 'bundle_index',
  fileData: 'get_filedata',
  fileAccess: 'can_access_filedata',
});

export const DOCUMENTS_FAILED = 'Failed to fetch';
export const FILE_NOT_ACCESSIBLE = 'You do not have access to this document.';

/** The Evidence page's section order (BundleCreationService.SECTION_TYPE_ORDER): unknown types last. */
export const SECTION_TYPE_ORDER: Readonly<Record<string, number>> = Object.freeze({
  MB: 0, // Master Bundle
  CB: 1, // Private Bundle (production label for cFoldertype='CB')
  CO: 2, // Core Assigned
  TS: 3, // Transcript
  M: 4, // Generic / My Folders
  TF: 5, // Team Folders
  CF: 6, // User Files
});

/** The request's fields with the caller as the actor under BOTH identity keys (R4). */
export function withActor(caller: Caller, fields: object): Record<string, unknown> {
  return { ...fields, nUserid: caller.userId, nMasterid: caller.userId };
}

/** Sections in the fixed type order (a stable sort: ties keep the SP's order). */
export function sortSections(rows: readonly unknown[]): unknown[] {
  const orderOf = (row: unknown): number => {
    const code = String((row as { cFoldertype?: unknown } | null)?.cFoldertype ?? '').toUpperCase();
    return code in SECTION_TYPE_ORDER ? SECTION_TYPE_ORDER[code] : 999;
  };
  return [...rows].sort((a, b) => orderOf(a) - orderOf(b));
}

/**
 * et_bundledetail_search applies the folder scope only when jFilter carries cLocation 'T' + nBundleid; the REST API
 * has long exposed a top-level nBundleid, so it is mirrored into jFilter for a search request (coreapi's
 * withSearchBundleScope). Without it a field-scoped search returned a section-wide total for a folder's rows.
 */
export function withSearchBundleScope(fields: BundleDetailFields): BundleDetailFields {
  if (!fields?.nBundleid) return fields;
  let filter: Record<string, unknown> = {};
  if (fields.jFilter) {
    try {
      const parsed: unknown = typeof fields.jFilter === 'string' ? JSON.parse(fields.jFilter) : fields.jFilter;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) filter = parsed as Record<string, unknown>;
    } catch {
      filter = {};
    }
  }
  if (filter['cLocation'] || filter['nBundleid']) return fields;
  return { ...fields, jFilter: JSON.stringify({ ...filter, cLocation: 'T', nBundleid: fields.nBundleid }) };
}

@Injectable()
export class DocumentsService implements DocumentsOperations {
  private readonly fileAccessGuard: boolean;

  constructor(
    @Inject(SP_EXECUTOR) private readonly sp: SpExecutor,
    @Optional() @Inject(DOCUMENTS_OPTIONS) options?: DocumentsOptions,
  ) {
    this.fileAccessGuard = options?.fileAccessGuard === true;
  }

  async sections(caller: Caller, query: SectionsFields): Promise<unknown> {
    const rows = await this.firstCursor(DOCUMENTS_SP.sections, withActor(caller, query));
    return Array.isArray(rows) ? sortSections(rows) : rows;
  }

  async userSections(caller: Caller, query: SectionsFields): Promise<unknown> {
    const outcome = await this.sp.call(DOCUMENTS_SP.userSections, { ...withActor(caller, query), ref: 2 });
    if (outcome.ok === false) throw this.failed(outcome);
    return outcome.cursors;
  }

  bundles(caller: Caller, body: BundlesFields): Promise<unknown> {
    return this.firstCursor(DOCUMENTS_SP.bundles, withActor(caller, body), body.jElasticBundles ? 'elastic' : undefined);
  }

  bundleDetail(caller: Caller, query: BundleDetailFields): Promise<unknown> {
    return this.firstCursor(DOCUMENTS_SP.bundleDetail, withActor(caller, query));
  }

  bundleDetailSearch(caller: Caller, query: BundleDetailFields): Promise<unknown> {
    return this.firstCursor(DOCUMENTS_SP.bundleDetailSearch, withActor(caller, withSearchBundleScope(query)));
  }

  folderSearch(caller: Caller, query: FolderSearchFields): Promise<unknown> {
    return this.firstCursor(DOCUMENTS_SP.folderSearch, withActor(caller, query));
  }

  bundleIndex(caller: Caller, query: BundleIndexFields): Promise<unknown> {
    return this.firstCursor(DOCUMENTS_SP.bundleIndex, withActor(caller, query));
  }

  async fileData(caller: Caller, query: FileDataFields): Promise<unknown> {
    if (this.fileAccessGuard) {
      const gate = await this.sp.call<{ allowed?: unknown }>(DOCUMENTS_SP.fileAccess, { nMasterid: caller.userId, nBundledetailid: query.nBundledetailid });
      // coreapi read the first cursor's first row, or the cursor itself as a row: `allowed` true either way.
      const first: unknown = gate.ok === false ? null : gate.cursors[0];
      const row = Array.isArray(first) ? first[0] : first;
      const allowed = gate.ok !== false && ((row as { allowed?: unknown } | null)?.allowed === true || ((first as { allowed?: unknown } | null)?.allowed === true));
      if (!allowed) return { msg: -1, value: FILE_NOT_ACCESSIBLE };
    }
    return this.firstCursor(DOCUMENTS_SP.fileData, withActor(caller, query));
  }

  /** The SP's first cursor (coreapi answered `res.data[0]`), or `upstream` with what the SP said. */
  private async firstCursor(sp: string, params: Record<string, unknown>, schema?: 'elastic'): Promise<unknown> {
    const outcome: SpOutcome<unknown> = schema ? await this.sp.call(sp, params, schema) : await this.sp.call(sp, params);
    // Equality on the discriminant: the repo compiles without strictNullChecks, where `!outcome.ok` does not narrow.
    if (outcome.ok === false) throw this.failed(outcome);
    return outcome.cursors[0];
  }

  private failed(outcome: { readonly error: unknown }): DomainError {
    return new DomainError('upstream', DOCUMENTS_FAILED, { error: outcome.error });
  }
}
