import { Body, Controller, Delete, Get, Post, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { WorkspaceService } from '../../services/workspace/workspace.service';
import {
  workspacefactmdl,
  workspaceIssueContact,
  workspaceParticipantMdl,
  workspaceTaskFactlinkMdl,
  workspaceViewDeleteMdl,
  workspaceViewListMdl,
  workspaceViewSaveMdl,
} from '../../interfaces/workspace.interface';

@ApiBearerAuth('JWT')
@ApiTags('workspace')
@Controller('workspace')
export class WorkspaceController {
  constructor(private workspaceservice: WorkspaceService) {

  }

  @Get('facts/list')
  async getFactList(@Query() query: workspacefactmdl): Promise<any> {
    return await this.workspaceservice.getDataByFunction(query, 'workspace_fact_list');
  }

  @Get('facts/issues')
  async getFactIssue(@Query() query: workspacefactmdl): Promise<any> {
    return await this.workspaceservice.getDataByFunction(query, 'workspace_fact_issues');
  }

  @Get('facts/files')
  async getFactFiles(@Query() query: workspacefactmdl): Promise<any> {
    return await this.workspaceservice.getDataByFunction(query, 'workspace_fact_files');
  }

  @Get('issues')
  async getIssueList(@Query() query: workspaceIssueContact): Promise<any> {
    return await this.workspaceservice.getIssueContactByFunction(query, 'workspace_issues_list');
  }

  @Get('contacts')
  async getContactList(@Query() query: workspaceIssueContact): Promise<any> {
    return await this.workspaceservice.getIssueContactByFunction(query, 'workspace_contacts_list');
  }

  @Get('organize')
  async getOrganize(@Query() query: workspaceIssueContact): Promise<any> {
    return await this.workspaceservice.getIssueContactByFunction(query, 'workspace_organize');
  }

  /* --------------------------- participants ---------------------------
   * The Workspace "Participants" scope over the legacy contacts model:
   * ContactMaster (cType 'C') with role / company / party lookups and
   * fact (FMContact) + document (BDContacts) counts. */

  @Get('participants/list')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getParticipantList(@Query() query: workspaceParticipantMdl): Promise<any> {
    return await this.workspaceservice.getDataByFunction(query as unknown as workspacefactmdl, 'workspace_participant_list');
  }

  @Get('participants/companies')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getParticipantCompanies(@Query() query: workspaceParticipantMdl): Promise<any> {
    return await this.workspaceservice.getDataByFunction(query as unknown as workspacefactmdl, 'workspace_company_list');
  }

  /**
   * Participant ↔ fact edges (FMContact), under the fact pool's own visibility
   * rule. The Participants Overview folds its involvement cards out of these
   * edges joined against the fact list / issues the client already holds.
   */
  @Get('participants/factlinks')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getParticipantFactLinks(@Query() query: workspaceParticipantMdl): Promise<any> {
    return await this.workspaceservice.getDataByFunction(query as unknown as workspacefactmdl, 'workspace_participant_factlinks');
  }

  /* ------------------------------ tasks ------------------------------
   * Reads over the legacy task model (TaskMaster/TaskDetail/TaskShared/
   * FMTasks). Mutations stay on the existing task/* endpoints
   * (taskBuilder/v2, taskBuilder/updatestatus, taskdelete). */

  @Get('tasks/list')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getTaskList(@Query() query: workspaceParticipantMdl): Promise<any> {
    return await this.workspaceservice.getDataByFunction(query as unknown as workspacefactmdl, 'workspace_task_list');
  }

  @Get('tasks/users')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getTaskUsers(@Query() query: workspaceParticipantMdl): Promise<any> {
    return await this.workspaceservice.getDataByFunction(query as unknown as workspacefactmdl, 'workspace_task_users');
  }

  /** Append task → fact links (FMTasks) — the New-task dialog's "Fact" basis. */
  @Post('tasks/factlink')
  @UsePipes(new ValidationPipe({ transform: true }))
  async linkTaskFacts(@Body() body: workspaceTaskFactlinkMdl): Promise<any> {
    return await this.workspaceservice.getDataByFunction(body as unknown as workspacefactmdl, 'workspace_task_factlink');
  }


  /* ----------------------------- saved views -----------------------------
   * A saved view is a named display over the case's facts (filter + screen
   * state). Private to its author unless `bShared`; ownership checks live in
   * the SPs, and `nMasterid` comes from the JWT — never from the client. */

  @Get('views')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getViews(@Query() query: workspaceViewListMdl): Promise<any> {
    return await this.workspaceservice.listViews(query);
  }

  @Post('views')
  @UsePipes(new ValidationPipe({ transform: true }))
  async saveView(@Body() body: workspaceViewSaveMdl): Promise<any> {
    return await this.workspaceservice.saveView(body);
  }

  @Delete('views')
  @UsePipes(new ValidationPipe({ transform: true }))
  async deleteView(@Body() body: workspaceViewDeleteMdl): Promise<any> {
    return await this.workspaceservice.deleteView(body);
  }

}
