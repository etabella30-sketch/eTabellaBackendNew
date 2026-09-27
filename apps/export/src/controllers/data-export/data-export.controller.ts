import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DataExportService } from '../../services/data-export/data-export.service';
import { DataExportReq, DataExportUrlReq, DataExportListReq } from '../../DTOs/data-export.dto';
import { DbService } from '@app/global/db/pg/db.service';
import { assertCaseAccess } from 'apps/download/src/auth/download-access';
import { assertCanRerunDataExport } from '../../auth/export-access';

/**
 * Case-data export endpoints (Outputs page "Export Data" card).
 *   POST data/export  -> queue a report job, returns { nExportid }
 *   GET  data/url     -> fresh short-TTL presigned download URL
 *   GET  data/list    -> the caller's data-exports for a case
 */
@ApiBearerAuth('JWT')
@ApiTags('data-export')
@Controller('data')
export class DataExportController {
  constructor(private readonly service: DataExportService, private readonly db: DbService) {}

  @Post('export')
  async export(@Body() body: DataExportReq): Promise<{ msg: number; nExportid?: string; error?: any }> {
    // Some report sources (case_doclinks, the transcript index) read the case by nCaseid alone, and
    // the caller then owns the file: only a member (or a global admin) may export a case.
    await assertCaseAccess(this.db, body.nMasterid, body.nCaseid);
    return this.service.createExport(body);
  }

  @Post('regenerate')
  async regenerate(@Body() body: DataExportUrlReq): Promise<{ msg: number; nExportid?: string; error?: any }> {
    // The re-run reads the case afresh: only its creator, and only while still a member (or an admin).
    await assertCanRerunDataExport(this.db, body.nMasterid, body.nExportid);
    return this.service.regenerate(body);
  }

  @Get('url')
  async url(@Query() query: DataExportUrlReq): Promise<{ cUrl: string }> {
    return this.service.getUrl(query);
  }

  @Post('delete')
  async delete(@Body() body: DataExportUrlReq): Promise<{ msg: number }> {
    return this.service.deleteExport(body);
  }

  @Get('list')
  async list(@Query() query: DataExportListReq): Promise<any[]> {
    return this.service.list(query);
  }
}
