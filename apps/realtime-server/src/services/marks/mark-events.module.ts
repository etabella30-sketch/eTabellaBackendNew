import { Global, Module } from '@nestjs/common';

import { EdgeModule } from '../../edge/edge.module';
import { MARK_EVENTS_SINK } from './mark-events.port';
import { MarkEventsService } from './mark-events.service';

/**
 * Live mark sync (user decision 2026-10-05): ONE MarkEventsService for the whole app. Global because the mark
 * routes live in two modules (FactController is registered in RealtimeServerModule and TranscriptModule,
 * DoclinkController in TranscriptModule, FactsheetController in RealtimeServerModule) and MarkWriteInterceptor, made
 * in each of them, must reach the same instance EventsGateway hands the socket server to (MARK_EVENTS_SINK, the
 * same instance under a token: see mark-events.port.ts). EdgeModule (already imported by RealtimeServerModule, so
 * the same instance) gives the session's box and the /edge link.
 */
@Global()
@Module({
    imports: [EdgeModule],
    providers: [MarkEventsService, { provide: MARK_EVENTS_SINK, useExisting: MarkEventsService }],
    exports: [MarkEventsService, MARK_EVENTS_SINK],
})
export class MarkEventsModule { }
