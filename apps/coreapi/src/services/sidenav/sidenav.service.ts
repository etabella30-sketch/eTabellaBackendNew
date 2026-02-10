import { DbService } from '@app/global/db/pg/db.service';
import { Injectable } from '@nestjs/common';
import { fileContact, sidenaveData, taskFileReq, tasksbyissues, taskStatusUpdate } from '../../interfaces/sidenav.interface';
// import { ContactFgaService } from '../contact-fga/contact-fga.service';
// import { TaskfgaService } from '../fga/taskfga/taskfga.service';

@Injectable()
export class SidenavService {

  constructor(private db: DbService,
    //  private contactFgaService: ContactFgaService,
    //  private taskFgaService: TaskfgaService
    ) {

  }



  async getTaskByIssue(query: tasksbyissues): Promise<any[]> {
    // const taskIds = await this.taskFgaService.getUserTasksInCase(query.nCaseid, query.nMasterid);
    // query['jTaskids'] = taskIds;
    query["ref"] = 3;
    let res = await this.db.executeRef('sidenave_tasks_facttasks', query);
    if (res.success) {
      try {
        return res.data;
      } catch (error) {
        return []
      }
    } else {
      return []
    }
  }



  async getDataByFunction(query: sidenaveData, fn_name: string): Promise<any[]> {
    if (fn_name == 'sidenave_tasks_filetasks') {
      // const taskIds = await this.taskFgaService.getUserTasksInCase(query.nCaseid, query.nMasterid);
      // query['jTaskids'] = taskIds;
      query["ref"] = 3;
    }
    if( fn_name == 'sidenave_tasks_facttaskissues'){
      // const taskIds = await this.taskFgaService.getUserTasksInCase(query.nCaseid, query.nMasterid);
      // query['jTaskids'] = taskIds;     
    }
    let res = await this.db.executeRef(fn_name, query);
    if (res.success) {
      try {
        return fn_name == 'sidenave_tasks_filetasks' ? res.data : res.data[0];
      } catch (error) {
        return []
      }
    } else {
      return []
    }
  }



  async getFileContactByFunction(query: fileContact, fn_name: string): Promise<any[]> {
    // const contactPermissions =
    //   await this.contactFgaService.getContactPermissionsJson(query.nMasterid);

    // // 2. Extract contact IDs that user can view
    // query['jContactIds'] = contactPermissions
    //   .filter((p) => p.view)
    //   .map((p) => p.contactId);

    let res = await this.db.executeRef(fn_name, query);
    if (res.success) {
      try {
        return res.data[0];
      } catch (error) {
        return [];
      }
    } else {
      return [];
    }
  }

  async updateTaskStatus(body: taskStatusUpdate): Promise<any[]> {
    let res = await this.db.executeRef('sidenav_task_update_status', body);
    if (res.success) {
      try {
        return res.data[0];
      } catch (error) {
        return [];
      }
    } else {
      return [];
    }
  }

  async getTaskFiles(body: taskFileReq): Promise<any[]> {
    let res = await this.db.executeRef('sidenave_tasks_filetasks_files', body);
    if (res.success) {
      try {
        return res.data[0];
      } catch (error) {
        return [];
      }
    } else {
      return [];
    }
  }

}
