import { Module, Type } from '@nestjs/common';
import { FactsheetRealtimeHttpModule } from '@app/rt-features/factsheet';
import { MarkNavigatorHttpModule } from '@app/rt-features/marknav';
import { DocLinkHttpModule } from '@app/rt-features/doclink';
import { IssuesHttpModule } from '@app/rt-features/issues';

import { FactsheetRelay } from '../relays/factsheet.relay';
import { MarkNavigatorRelay } from '../relays/marknav.relay';
import { DocLinkRelay } from '../relays/doclink.relay';
import { IssuesRelay } from '../relays/issues.relay';

/**
 * The shared feature HTTP modules mounted under /realtimeapi, by class: api.module.ts registers them as the router
 * children of this module, because a RouterModule prefix reaches only the routed module and its listed children,
 * not the modules it imports. One entry per feature; route-ownership.spec.ts checks the list equals the imports.
 */
export const LOCAL_REALTIME_FEATURE_MODULES: Type<unknown>[] = [FactsheetRealtimeHttpModule, MarkNavigatorHttpModule, DocLinkHttpModule, IssuesHttpModule];

/**
 * `/realtimeapi` on the box (api.module.ts mounts it under that prefix): the realtime HTTP modules of @app/rt-features
 * over the box's adapter of their operations port. Phase 7a mounted the first, the Full Fact editor (eight
 * `controller` rows over FactsheetRelay); Phase 8 adds the Mark Navigator (marknav.all, marknav.quickmarks over
 * MarkNavigatorRelay) and the DocLinks (doclink.detail, doclink.insert, doclink.delete over DocLinkRelay; mount
 * 'rows': the cloud-only docshared is not mounted); Phase 9 the issues and claims (the nine issue.* rows over
 * IssuesRelay). Every other realtimeapi row of ROUTE_MANIFEST is still a table row (RtDataMiddleware) or `use_cloud`.
 */
@Module({
    imports: [
        FactsheetRealtimeHttpModule.register({ operations: FactsheetRelay, mount: 'box' }),
        MarkNavigatorHttpModule.register({ operations: MarkNavigatorRelay }),
        DocLinkHttpModule.register({ operations: DocLinkRelay, mount: 'rows' }),
        IssuesHttpModule.register({ operations: IssuesRelay }),
    ],
})
export class LocalRealtimeModule {}
