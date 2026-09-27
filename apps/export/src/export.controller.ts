import { Controller, Get, Query, Res } from '@nestjs/common';
import { DbService } from '@app/global/db/pg/db.service';
import { ExportService } from './export.service';
import { DownloadpathReq } from './inerfaces/export.interface';
import { assertCanReadExport } from './auth/export-access';

// GET /download runs behind DownloadAuthMiddleware (export.module.ts), which puts the caller's id in
// query.nMasterid; the file is only opened once assertCanReadExport allows it.
@Controller()
export class ExportController {
  constructor(private readonly exportService: ExportService, private readonly db: DbService) { }

  // @Get()
  // getHello(): string {
  //   return this.exportService.getHello();
  // }

  @Get('download')
  async downloadFile(@Query() query: DownloadpathReq, @Res() res: Response) {
    console.log('downloadFile', query);
    await assertCanReadExport(this.db, query.nMasterid, query.cPath);
    return await this.exportService.downloadFile(query, res);
  }
}
