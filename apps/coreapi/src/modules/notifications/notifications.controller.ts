import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Caller } from '@app/api-kernel';
import { InboxMutation, InboxQuery, NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}
  @Get('inbox') inbox(@Caller() caller: Caller,@Query() query: InboxQuery) { return this.notifications.inbox(caller,query); }
  @Get(':id/target') target(@Caller() caller: Caller,@Param('id') id: string) { return this.notifications.target(caller,id); }
  @Post('seen') seen(@Caller() caller: Caller,@Body() body: InboxMutation) { return this.notifications.change(caller,body,'seen'); }
  @Post('dismiss') dismiss(@Caller() caller: Caller,@Body() body: InboxMutation) { return this.notifications.change(caller,body,'dismiss'); }
}
