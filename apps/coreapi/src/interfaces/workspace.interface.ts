import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";
import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";

export class workspacefactmdl {
  @ApiProperty({ example: 1, description: '' })
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: 1, description: '' })
  @IsOptional()
  @IsItUUID()
  nContactid: string;


  @ApiProperty({ example: 1, description: '' })
  @IsOptional()
  @IsItUUID()
  nIssueid: string;


  
  @ApiProperty({ example: 1, description: '' ,required:false})
  @IsOptional()
  @IsString()
  jFilter: string;


  @ApiProperty({ example: 'ALL/F/QF', description: '' })
  @IsString()
  cFacttype: string;


  @IsItUUID()
  nMasterid?: string;
}



export class workspaceIssueContact {
  @ApiProperty({ example: 1, description: '' })
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: 1, description: '' ,required:false})
  @IsOptional()
  @IsString()
  jFilter: string;


  @IsItUUID()
  nMasterid?: string;
}


/**
 * `GET /workspace/participants/list` and `/workspace/participants/companies` —
 * the case's contacts (cType 'C') / organisations for the Workspace
 * Participants scope. Read-only; visibility follows et_contact_list's
 * team rule inside the SPs.
 */
export class workspaceParticipantMdl {
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000001', description: 'Case the participants belong to' })
  @IsItUUID()
  nCaseid: string;

  @IsItUUID()
  nMasterid?: string;
}


/** `POST /workspace/tasks/factlink` — append task → fact links (FMTasks). */
export class workspaceTaskFactlinkMdl {
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000001', description: 'Task to link' })
  @IsItUUID()
  nTaskid: string;

  @ApiProperty({ example: '["<nFSid>"]', description: 'Fact ids as a JSON array string' })
  @IsString()
  jFactids: string;

  @IsItUUID()
  nMasterid?: string;
}

/** `GET /workspace/views` — the caller's saved views on a case, plus shared ones. */
export class workspaceViewListMdl {
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000001', description: 'Case the views belong to' })
  @IsItUUID()
  nCaseid: string;

  @IsItUUID()
  nMasterid?: string;
}


/**
 * `POST /workspace/views` — create or update a saved view.
 *
 * `nWVid` absent → create. Present but owned by someone else → the SP saves a
 * copy for the caller rather than rewriting a shared view.
 */
export class workspaceViewSaveMdl {
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000001' })
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ required: false, description: 'Existing view to update' })
  @IsOptional()
  @IsItUUID()
  nWVid?: string;

  @ApiProperty({ example: 'Perner cross — disputed', description: 'User-visible name' })
  @IsString()
  cName: string;

  @ApiProperty({ example: 'fact', required: false })
  @IsOptional()
  @IsString()
  cEntity?: string;

  @ApiProperty({ example: 'table', description: 'table | cards | timeline', required: false })
  @IsOptional()
  @IsString()
  cViewType?: string;

  @ApiProperty({ example: '{"assigned":true}', description: 'View-level filter (JSON)', required: false })
  @IsOptional()
  @IsString()
  jFilter?: string;

  @ApiProperty({ example: '{"cols":[],"sort":null}', description: 'Screen state (JSON)', required: false })
  @IsOptional()
  @IsString()
  jState?: string;

  @ApiProperty({ example: false, description: 'Publish to everyone on the case', required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true' || value === 1 || value === '1')
  bShared?: boolean;

  @IsItUUID()
  nMasterid?: string;
}


/** `DELETE /workspace/views` — soft delete, owner-only (enforced in the SP). */
export class workspaceViewDeleteMdl {
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000001' })
  @IsItUUID()
  nWVid: string;

  @IsItUUID()
  nMasterid?: string;
}