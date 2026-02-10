import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { fileContact, sidenaveData, taskFileReq, tasksbyissues, taskStatusUpdate } from '../../interfaces/sidenav.interface';
import { SidenavService } from '../../services/sidenav/sidenav.service';

@ApiBearerAuth('JWT')
@ApiTags('sidenav')
@Controller('sidenav')
export class SidenavController {


  constructor(private sidenavservice: SidenavService) {

  }


  @Get('facts/issues')
  async getFactIssueList(@Query() query: sidenaveData): Promise<any> {
    return await this.sidenavservice.getDataByFunction(query, 'sidenave_tasks_facttaskissues');
  }


  @Get('file/tasks')
  async getFactTasks(@Query() query: sidenaveData): Promise<any> {
    return await this.sidenavservice.getDataByFunction(query, 'sidenave_tasks_filetasks');
  }

  @Get('tasksbyissue')
  async getTaskByIssue(@Query() query: tasksbyissues): Promise<any> {
    return await this.sidenavservice.getTaskByIssue(query);
  }

  @Get('contact/filecontacts')
  async getfileContactList(@Query() query: fileContact): Promise<any> {
    return await this.sidenavservice.getFileContactByFunction(query, 'sidenav_filecontacts_list');
  }

  @Get('filetask/files')
  async getTaskFiles(@Query() query: taskFileReq): Promise<any> {
    return await this.sidenavservice.getTaskFiles(query);
  }
  @Post('task/status/update')
  async updateTaskStatus(@Body() body: taskStatusUpdate): Promise<any> {
    return await this.sidenavservice.updateTaskStatus(body);
  }


}
