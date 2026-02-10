import { Controller, Get, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { DownloadService } from './download.service';

@Controller()
export class DownloadController {
  constructor(private readonly downloadService: DownloadService) { }
  // @Get()
  // getHello(): string {
  //   return this.downloadService.getHello();
  // }




}
