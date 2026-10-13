import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import type { RealtimeRequest } from '../../middleware/realtime-auth.middleware';
import { RealtimeEntryService } from '../../services/session/realtime-entry.service';

@Controller('session')
export class RealtimeEntryController {
  constructor(private readonly entry: RealtimeEntryService) {}
  @Get('entry-status')
  status(@Query('nCaseid') caseId: string, @Query('nSesid') sessionId: string | undefined, @Query('nEventid') eventId: string | undefined, @Req() req: RealtimeRequest) {
    return this.entry.status(caseId, sessionId, req.user, eventId);
  }
  @Get('entry-notifications')
  notifications(@Query('nCaseid') caseId: string | undefined, @Req() req: RealtimeRequest) {
    return this.entry.notifications(caseId, req.user);
  }
  @Post('entry-notifications/seen')
  seen(@Body('notificationId') id: string, @Req() req: RealtimeRequest) {
    return this.entry.updateNotification(id, false, req.user);
  }
  @Post('entry-notifications/dismiss')
  dismiss(@Body('notificationId') id: string, @Req() req: RealtimeRequest) {
    return this.entry.updateNotification(id, true, req.user);
  }
}
