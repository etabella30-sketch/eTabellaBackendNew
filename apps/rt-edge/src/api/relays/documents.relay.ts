/**
 * The box's binding of the documents operations port (plan §3.3 "Relay adapters", Phase 10c): the shared
 * DocumentsController mounted under /coreapi asks this adapter, which asks CLOUD_RELAY for the manifest row of each
 * read, a cloud-read of realtime-server `bundles/<x>` with the caller's edge token (per-user cache, the mock's []
 * offline or for a box-signed sign-in), except the child-folder read the frontend sends as POST (`bundles/bundle`),
 * a cloud-write: forwarded online, 503 offline. The answer is the table's, byte for byte (CloudRelayAdapter).
 */
import { Inject, Injectable } from '@nestjs/common';
import type { Caller } from '@app/api-kernel';
import type {
  BundleDetailFields,
  BundleIndexFields,
  BundlesFields,
  DocumentsOperations,
  FileDataFields,
  FolderSearchFields,
  SectionsFields,
} from '@app/rt-features/documents';
import { DOCUMENTS_ROUTE_IDS } from '@app/rt-features/documents';

import { CLOUD_RELAY, CloudRelay } from '../../ports';
import { CloudRelayAdapter } from './cloud-relay-adapter';

@Injectable()
export class DocumentsRelay extends CloudRelayAdapter implements DocumentsOperations {
    constructor(@Inject(CLOUD_RELAY) relay: CloudRelay) {
        super(relay, 'documents');
    }

    sections(_caller: Caller, _query: SectionsFields): Promise<unknown> {
        return this.read(DOCUMENTS_ROUTE_IDS.sections);
    }

    userSections(_caller: Caller, _query: SectionsFields): Promise<unknown> {
        return this.read(DOCUMENTS_ROUTE_IDS.userSections);
    }

    bundles(_caller: Caller, _body: BundlesFields): Promise<unknown> {
        return this.write(DOCUMENTS_ROUTE_IDS.bundles);
    }

    bundleDetail(_caller: Caller, _query: BundleDetailFields): Promise<unknown> {
        return this.read(DOCUMENTS_ROUTE_IDS.bundleDetail);
    }

    bundleDetailSearch(_caller: Caller, _query: BundleDetailFields): Promise<unknown> {
        return this.read(DOCUMENTS_ROUTE_IDS.bundleDetailSearch);
    }

    folderSearch(_caller: Caller, _query: FolderSearchFields): Promise<unknown> {
        return this.read(DOCUMENTS_ROUTE_IDS.folderSearch);
    }

    bundleIndex(_caller: Caller, _query: BundleIndexFields): Promise<unknown> {
        return this.read(DOCUMENTS_ROUTE_IDS.bundleIndex);
    }

    fileData(_caller: Caller, _query: FileDataFields): Promise<unknown> {
        return this.read(DOCUMENTS_ROUTE_IDS.fileData);
    }
}
