import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { WorkspaceService } from '../../services/workspace/workspace.service';
import { workspacefactmdl, workspaceIssueContact } from '../../interfaces/workspace.interface';

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

}
