/**
 * The operations port of the documents feature (plan §3.3 "per-feature operations port"): the eight document reads
 * the RT page needs, in domain terms only. coreapi's BundlesController and realtime-server's shared DocumentsController
 * bind DocumentsService (the public SPs over SP_EXECUTOR); the venue box binds a relay adapter over CLOUD_RELAY. A
 * failure is a DomainError, which the host renders (coreapi: its `{ msg: -1, value: 'Failed to fetch', error }` row;
 * realtime-server: the same row through DOCUMENTS_LEGACY_SHAPES; the box: its contract envelope or the relayed
 * answer byte for byte).
 */
import type { Caller } from '@app/api-kernel';

import type { BundleDetailFields, BundleIndexFields, BundlesFields, FileDataFields, FolderSearchFields, SectionsFields } from './dto/documents.dto';

export const DOCUMENTS_OPS = 'RT_DOCUMENTS_OPS';

export interface DocumentsOperations {
  /** The global sections of a case (admin_sections), in the Evidence page's fixed type order. */
  sections(caller: Caller, query: SectionsFields): Promise<unknown>;
  /** The caller's sections of a case (user_sections): both cursors, as coreapi answered them. */
  userSections(caller: Caller, query: SectionsFields): Promise<unknown>;
  /** The child folders of a section or folder (bundles; the elastic variant when jElasticBundles is given). */
  bundles(caller: Caller, body: BundlesFields): Promise<unknown>;
  /** The documents of a folder, paged (bundledetail). */
  bundleDetail(caller: Caller, query: BundleDetailFields): Promise<unknown>;
  /** The documents of a folder matching a search (bundledetail_search, the folder scope mirrored into jFilter). */
  bundleDetailSearch(caller: Caller, query: BundleDetailFields): Promise<unknown>;
  /** Folder names matching a term across a case (bundle_search). */
  folderSearch(caller: Caller, query: FolderSearchFields): Promise<unknown>;
  /** The section index rows (bundle_index). */
  bundleIndex(caller: Caller, query: BundleIndexFields): Promise<unknown>;
  /** One document's file data (get_filedata), behind the optional access gate. */
  fileData(caller: Caller, query: FileDataFields): Promise<unknown>;
}
