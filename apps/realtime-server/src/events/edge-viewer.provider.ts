/**
 * The Nest provider of EDGE_VIEWER_PORT (edge-viewer.port.ts): the venue-box state EventsGateway reads for
 * the viewer banner (`edge-status` on fetch-data and its 5 s refresh), the rev of venue snapshots (D20) and
 * the admin alert of a refused legacy ingest (D14).
 *
 * It belongs in the providers of the module that declares EventsGateway (RealtimeServerModule), which
 * imports EdgeModule and so reaches EdgeSyncService and EdgeRegistryService (both exported):
 *
 *     providers: [..., EventsGateway, EDGE_VIEWER_PROVIDER, ...]
 *
 * Kept in its own file: EventsGateway itself must never import the edge services at runtime (the edge module
 * imports the gateway; edge-viewer.port.ts imports them as types only). Without the provider the gateway
 * behaves exactly as before the edge work (no edge-status, untagged venue snapshots, logged alerts).
 */
import type { Provider } from '@nestjs/common';

import { EdgeRegistryService } from '../edge/edge-registry.service';
import { EdgeSyncService } from '../edge/edge-sync.service';
import { EDGE_VIEWER_PORT, EdgeViewerAdapter, EdgeViewerPort } from './edge-viewer.port';

export const EDGE_VIEWER_PROVIDER: Provider = {
    provide: EDGE_VIEWER_PORT,
    useFactory: (sync: EdgeSyncService, registry: EdgeRegistryService): EdgeViewerPort => new EdgeViewerAdapter(sync, registry),
    inject: [EdgeSyncService, EdgeRegistryService],
};
