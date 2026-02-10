import { Controller, Get } from '@nestjs/common';
import { BatchfileService } from './batchfile.service';

@Controller()
export class BatchfileController {
  constructor(private readonly batchfileService: BatchfileService) { }

  // @Get()
  getHello(): string {
    return this.batchfileService.getHello();
  }
}
