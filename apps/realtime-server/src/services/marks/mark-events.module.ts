import { Global, Module } from '@nestjs/common';
import { MARK_WRITE_HOOK } from '@app/api-kernel';

import { EdgeModule } from '../../edge/edge.module';
import { markWriteHookProvider } from '../../interceptors/mark-write.interceptor';
import { MARK_EVENTS_SINK } from './mark-events.port';
import { MarkEventsService } from './mark-events.service';

/**
 * Live mark sync (user decision 2026-10-05): ONE MarkEventsService for the whole app. Global because the mark
 * routes live in two modules (FactController is registered in RealtimeServerModule and TranscriptModule,
 * DoclinkController in TranscriptModule, FactsheetController in RealtimeServerModule) and MarkWriteInterceptor, made
 * in each of them, must reach the same instance EventsGateway hands the socket server to (MARK_EVENTS_SINK, the
 * same instance under a token: see mark-events.port.ts). EdgeModule (already imported by RealtimeServerModule, so
 * the same instance) gives the session's box and the /edge link. MARK_WRITE_HOOK (shared-libraries plan Phase 7a)
 * is the kernel port the shared factsheet controller's @MarkWrite handlers run through: the same interceptor.
 */
@Global()
@Module({
    imports: [EdgeModule],
    providers: [MarkEventsService, { provide: MARK_EVENTS_SINK, useExisting: MarkEventsService }, markWriteHookProvider()],
    exports: [MarkEventsService, MARK_EVENTS_SINK, MARK_WRITE_HOOK],
})
export class MarkEventsModule { }
