import { Controller, Get, Query, Res } from '@nestjs/common';
import { ExportService } from './export.service';
import { DownloadpathReq } from './inerfaces/export.interface';

@Controller()
export class ExportController {
  constructor(private readonly exportService: ExportService) { }

  // @Get()
  // getHello(): string {
  //   return this.exportService.getHello();
  // }

  @Get('download')
  async downloadFile(@Query() query: DownloadpathReq, @Res() res: Response) {
    console.log('downloadFile', query);
    return await this.exportService.downloadFile(query, res);
  }
}
