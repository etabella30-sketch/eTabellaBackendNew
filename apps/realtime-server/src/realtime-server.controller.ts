import { Controller, Get } from '@nestjs/common';
import { RealtimeServerService } from './realtime-server.service';

@Controller()
export class RealtimeServerController {
  constructor(private readonly realtimeServerService: RealtimeServerService) {}

  @Get()
  getHello(): string {
    return this.realtimeServerService.getHello();
  }
}
