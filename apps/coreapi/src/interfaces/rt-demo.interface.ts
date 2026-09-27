import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsInt, IsOptional, IsString, Matches, Max, Min } from "class-validator";

/**
 * GET rt-demo/document - one document link clicked in the RT Simulation.
 * There is deliberately no nCaseid: the server resolves the super-admin chosen
 * source case itself, so a client can never point this at another case.
 */
export class RtDemoDocumentReq {
  @ApiProperty({ example: 'A2', description: 'Document tab from the link, e.g. A2 in {A2-3}', required: true })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value), { toClassOnly: true })
  @IsString()
  @Matches(/^[A-Z][A-Z0-9.]{0,49}$/, { message: 'cTab must be a document tab such as A2' })
  cTab: string;

  @ApiProperty({ example: 3, description: 'Page within the document (defaults to 1)', required: false })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null || value === undefined ? undefined : Number(value)), { toClassOnly: true })
  @IsInt()
  @Min(1)
  @Max(100000)
  nPage?: number;

  @IsItUUID()
  nMasterid?: string;
}

/** Only what the RT page needs to open the file - no ids, folders or case data. */
export interface RtDemoDocumentRes {
  cTab: string;
  cName: string;
  cFiletype: string | null;
  cPath: string | null;
  nPage: number;
  nPageCount: number | null;
}
