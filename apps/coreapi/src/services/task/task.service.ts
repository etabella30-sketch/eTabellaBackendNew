import { DbService } from '@app/global/db/pg/db.service';
import { Injectable, Logger } from '@nestjs/common';
import {
  TaskCreateReq,
  TaskCreateReqV2,
  TaskCreateRes,
  TaskDetailReq,
  TaskFactDetailReq,
  TasklistReq,
  TasklistRes,
  TaskUpdateProgressReq,
  taskUpdateStatusReq,
} from '../../interfaces/task.interface';
// import { get } from 'http';
// import { query } from 'express';
import { UtilityService } from '../utility/utility.service';
// import { TaskfgaService } from '../fga/taskfga/taskfga.service';

@Injectable()
export class TaskService {
  private logger = new Logger(TaskService.name);

  constructor(
    private db: DbService,
    private utility: UtilityService,
    // private readonly taskFgaService: TaskfgaService,
  ) { }

  async taskCreate(body: TaskCreateReq): Promise<TaskCreateRes> {
    let res = await this.db.executeRef('task_insert', body);
    if (res.success) {
      try {
        return res.data[0][0];
      } catch (error) {
        return { msg: -1, value: 'Failed ', error: res.error };
      }
    } else {
      return { msg: -1, value: 'Failed ', error: res.error };
    }
    // return [{ msg: 1 }]
  }

  async createTaskDetail(body: TaskCreateReq): Promise<TaskCreateRes[]> {
    let res = await this.db.executeRef('task_insert_detail', body);
    if (res.success) {
      try {
        return res.data[0];
      } catch (error) {
        return [{ msg: -1, value: 'Failed ', error: res.error }];
      }
    } else {
      return [{ msg: -1, value: 'Failed ', error: res.error }];
    }
  }

  async createTaskReminder(body: TaskCreateReq): Promise<TaskCreateRes[]> {
    let res = await this.db.executeRef('task_insert_reminder', body);
    if (res.success) {
      try {
        return res.data[0];
      } catch (error) {
        return [{ msg: -1, value: 'Failed ', error: res.error }];
      }
    } else {
      return [{ msg: -1, value: 'Failed ', error: res.error }];
    }
  }

  async createTaskAssign(body: TaskCreateReq): Promise<TaskCreateRes[]> {
    let res = await this.db.executeRef('task_insert_assign', body);
    if (res.success) {
      try {
        try {
          const notificationlist = res.data[0][0]['jNotify'] || [];
          if (notificationlist.length) {
            this.utility.sendNotification(notificationlist, body.nMasterid);
          }
        } catch (error) { }
        return res.data[0];
      } catch (error) {
        return [{ msg: -1, value: 'Failed ', error: res.error }];
      }
    } else {
      return [{ msg: -1, value: 'Failed ', error: res.error }];
    }
  }

  async taskDelete(body: TaskDetailReq): Promise<any> {
    let res = await this.db.executeRef('task_delete', body);
    if (res.success) {
      try {
        return res.data[0];
      } catch (error) {
        return [{ msg: -1, value: 'Failed ', error: res.error }];
      }
    } else {
      return [{ msg: -1, value: 'Failed ', error: res.error }];
    }
  }

  async getTasklist(query: TasklistReq): Promise<any> {
    query['ref'] = 3;
    // const taskIds = await this.taskFgaService.getUserTasksInCase(query.nCaseid, query.nMasterid);
    // query['jTaskids'] = taskIds;
    let res = await this.db.executeRef('task_list', query);
    if (res.success) {
      return res.data;
    } else {
      return [{ msg: -1, value: 'Failed to fetch', error: res.error }];
    }
  }

  async getTaskDetail(query: TaskDetailReq): Promise<any> {
    query['ref'] = 3;
    let res = await this.db.executeRef('task_detail', query);
    if (res.success) {
      return res.data;
    } else {
      return [{ msg: -1, value: 'Failed to fetch', error: res.error }];
    }
  }

  async facttaskdelete(body: TaskFactDetailReq): Promise<any> {
    let res = await this.db.executeRef('fact_task_delete', body);
    if (res.success) {
      try {
        return res.data[0];
      } catch (error) {
        return [{ msg: -1, value: 'Failed ', error: res.error }];
      }
    } else {
      return [{ msg: -1, value: 'Failed ', error: res.error }];
    }
  }

  async updateTaskProgress(
    body: TaskUpdateProgressReq,
  ): Promise<TaskCreateRes[]> {
    let res = await this.db.executeRef('task_insert_detail', body);
    if (res.success) {
      try {
        return res.data[0];
      } catch (error) {
        return [{ msg: -1, value: 'Failed ', error: res.error }];
      }
    } else {
      return [{ msg: -1, value: 'Failed ', error: res.error }];
    }
  }

  async taskCreateV2(body: TaskCreateReqV2): Promise<TaskCreateRes> {
    let res = await this.db.executeRef('task_insert', body);
    if (res.success) {
      try {
        // if (body.permission == 'N') {
        //   const nTaskid = res.data[0][0]['nTaskid'];
        //   if (nTaskid)
        //     await this.taskFgaService.createTaskTuple(
        //       nTaskid,
        //       body.nMasterid,
        //       body.nCaseid,
        //     );
        // }

        return res.data[0][0];
      } catch (error) {
        return { msg: -1, value: 'Failed ', error: res.error };
      }
    } else {
      return { msg: -1, value: 'Failed ', error: res.error };
    }
    // return [{ msg: 1 }]
  }

  async createTaskDetailV2(body: TaskCreateReqV2): Promise<TaskCreateRes[]> {
    let res = await this.db.executeRef('task_insert_detail_v2', body);
    if (res.success) {
      try {
        return res.data[0];
      } catch (error) {
        return [{ msg: -1, value: 'Failed ', error: res.error }];
      }
    } else {
      return [{ msg: -1, value: 'Failed ', error: res.error }];
    }
  }

  async createTaskReminderV2(body: TaskCreateReqV2): Promise<TaskCreateRes[]> {
    let res = await this.db.executeRef('task_insert_reminder_v2', body);
    if (res.success) {
      try {
        return res.data[0];
      } catch (error) {
        return [{ msg: -1, value: 'Failed ', error: res.error }];
      }
    } else {
      return [{ msg: -1, value: 'Failed ', error: res.error }];
    }
  }

  async createTaskAssignV2(body: TaskCreateReqV2): Promise<void> {
    // try {
    //   const users = JSON.parse(body.jUsers);
    //   if (users?.length) {
    //     this.taskFgaService.assignTask(users, body.nTaskid);
    //   }
    // } catch (error) { }
    let res = await this.db.executeRef('task_insert_assign_V2', body);
    if (res.success) {
      try {
        try {
          const notificationlist = res.data[0][0]["jNotify"] || [];
          if (notificationlist.length) {
            this.utility.sendNotification(notificationlist, body.nMasterid);
          }
        } catch (error) { }
        return res.data[0];
      } catch (error) {
        // return [{ msg: -1, value: 'Failed ', error: res.error }]
      }
    } else {
      // return [{ msg: -1, value: 'Failed ', error: res.error }]
    }
  }

  async getTaskDetailV2(query: TaskDetailReq): Promise<any> {
    query['ref'] = 3;
    let res = await this.db.executeRef('task_detail_v2', query);
    if (res.success) {
      const taskDetail = res.data[0][0];
      let taskShared = res.data[1]
      try {
        // if (taskDetail.nTaskid) {
        //   const userPermissions = await this.taskFgaService.getUserPermissions(taskDetail.nTaskid, query.nMasterid);
        //   taskDetail.can_view = userPermissions?.can_view;
        //   taskDetail.can_edit_all = userPermissions?.can_edit_all;
        //   taskDetail.can_edit_status = userPermissions?.can_edit_status;
        //   taskDetail.in_case = userPermissions?.can_delete;
        //   taskShared = await this.taskFgaService.getAssigneeUsers(taskDetail?.nTaskid);
        // }




      } catch (error) {

      }
      return [[taskDetail], taskShared, res.data[2]];
    } else {
      return [{ msg: -1, value: 'Failed to fetch', error: res.error }];
    }
  }


  async updateTaskStatus(body: taskUpdateStatusReq): Promise<any> {
    let res = await this.db.executeRef('task_update_status', body);
    if (res.success) {
      try {
        return res.data[0];
      } catch (error) {
        return [{ msg: -1, value: 'Failed ', error: res.error }];
      }
    } else {
      return [{ msg: -1, value: 'Failed ', error: res.error }];
    }
  }

}
