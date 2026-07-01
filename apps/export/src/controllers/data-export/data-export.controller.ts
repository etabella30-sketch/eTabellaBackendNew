import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DataExportService } from '../../services/data-export/data-export.service';
import { DataExportReq, DataExportUrlReq, DataExportListReq } from '../../DTOs/data-export.dto';

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
  constructor(private readonly service: DataExportService) {}

  @Post('export')
  async export(@Body() body: DataExportReq): Promise<{ msg: number; nExportid?: string; error?: any }> {
    return this.service.createExport(body);
  }

  @Post('regenerate')
  async regenerate(@Body() body: DataExportUrlReq): Promise<{ msg: number; nExportid?: string; error?: any }> {
    return this.service.regenerate(body);
  }

  @Get('url')
  async url(@Query() query: DataExportUrlReq): Promise<{ cUrl: string }> {
    return this.service.getUrl(query);
  }

  @Get('list')
  async list(@Query() query: DataExportListReq): Promise<any[]> {
    return this.service.list(query);
  }
}
