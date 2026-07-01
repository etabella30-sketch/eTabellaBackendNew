import { IsItUUID } from '@app/global/decorator/is-uuid-nullable.decorator';
import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import {
  DATA_EXPORT_TYPES, DATA_EXPORT_FORMATS,
  type DataExportType, type DataExportFormat,
} from '@app/global/utility/data-export/types';

// Re-export so existing import sites (`from '../DTOs/data-export.dto'`) keep working.
export { DATA_EXPORT_TYPES, DATA_EXPORT_FORMATS };
export type { DataExportType, DataExportFormat };

export class DataExportReq {
  @ApiProperty({ example: '007a3614-ac77-40e4-bad1-4962b6571c58', description: 'Case id', required: true })
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: 'facts', enum: DATA_EXPORT_TYPES, description: 'What case data to export' })
  @IsString()
  @IsIn(DATA_EXPORT_TYPES as unknown as string[])
  cType: DataExportType;

  @ApiProperty({ example: 'xlsx', enum: DATA_EXPORT_FORMATS, description: 'Output format' })
  @IsString()
  @IsIn(DATA_EXPORT_FORMATS as unknown as string[])
  cFormat: DataExportFormat;

  // Injected server-side by JwtMiddleware (never sent by the client). Declared
  // so the global whitelist ValidationPipe doesn't strip/reject it.
  @ApiProperty({ required: false })
  @IsOptional()
  @IsItUUID()
  nMasterid?: string;
}

export class DataExportUrlReq {
  @ApiProperty({ example: '2a0df4fc-301a-4e2c-8b21-2b9f8cd6f0ca', description: 'Export id' })
  @IsItUUID()
  nExportid: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsItUUID()
  nMasterid?: string;
}

export class DataExportListReq {
  @ApiProperty({ example: '007a3614-ac77-40e4-bad1-4962b6571c58', description: 'Case id' })
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsItUUID()
  nMasterid?: string;
}

/** Payload placed on the `data-export` Bull queue. */
export interface DataExportJob {
  nExportid: string;
  nCaseid: string;
  nMasterid: string;
  cType: DataExportType;
  cFormat: DataExportFormat;
}
