import { DbService } from '@app/global/db/pg/db.service';
import { BadRequestException, ForbiddenException, Injectable, Logger } from '@nestjs/common';
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
import { assertCanEditFact } from '../fact/fact-access';
import { assertCanCreateTask, assertTaskAccess, requestedAssigneeIds, sameAssignees, taskAccess } from './task-access';
// import { TaskfgaService } from '../fga/taskfga/taskfga.service';

@Injectable()
export class TaskService {
  private logger = new Logger(TaskService.name);

  constructor(
    private db: DbService,
    private utility: UtilityService,
    // private readonly taskFgaService: TaskfgaService,
  ) { }

  /**
   * Gate for task/taskBuilder (`format` 'ids') and taskBuilder/v2 ('objects'), run before the first
   * write; see task-access.ts for the rules. Permission 'N' creates a new task in body.nCaseid (the SPs
   * ignore the client nTaskid there), so the caller must be an active member of that case. Any other
   * permission rewrites body.nTaskid: et_task_insert, the detail and reminder SPs write it for every
   * value but 'N', and the assign SP replaces its assignees whatever the permission. That needs `edit`;
   * an editor without `assign` (an assignee) may save only when jUsers names the current assignees, and
   * the assign step is then skipped, so their save neither changes the TaskShared flags nor re-notifies
   * everyone. Returns whether the caller may run the assign step.
   */
  async authorizeTaskBuild(body: TaskCreateReq | TaskCreateReqV2, format: 'ids' | 'objects'): Promise<{ assign: boolean }> {
    if (body?.permission === 'N') {
      await assertCanCreateTask(this.db, body.nMasterid, body.nCaseid);
      return { assign: true };
    }
    const access = await assertTaskAccess(this.db, body?.nMasterid, body?.nTaskid, 'edit');
    if (access.assign) return { assign: true };
    const asked = requestedAssigneeIds(body?.jUsers, format);
    if (!asked || !sameAssignees(asked, access.assignees)) {
      throw new ForbiddenException({ msg: -1, value: 'Only the task creator can change who is assigned' });
    }
    return { assign: false };
  }

  /**
   * task/updateTask: the task's fields (et_task_insert_detail with the client permission) need `edit`.
   * Only the SP's 'E' and 'S' branches update an existing task; 'N' inserts a second TaskDetail row for
   * it (the task then lists twice, with the caller's text), so any other permission is a 400. No
   * frontend calls this route.
   */
  async updateTask(body: TaskCreateReq): Promise<TaskCreateRes[]> {
    await assertTaskAccess(this.db, body?.nMasterid, body?.nTaskid, 'edit');
    if (body?.permission !== 'E' && body?.permission !== 'S') {
      throw new BadRequestException({ msg: -1, value: "permission must be 'E' or 'S' for an existing task" });
    }
    return this.createTaskDetail(body);
  }

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

  /** Creator (or global admin) only, 403 otherwise; et_task_delete also refuses anyone but the creator. */
  async taskDelete(body: TaskDetailReq): Promise<any> {
    await assertTaskAccess(this.db, body?.nMasterid, body?.nTaskid, 'delete');
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

  /**
   * The empty answer of gettaskdetail(/v2) for a task the caller may not view (or that does not exist):
   * et_task_detail(_v2)'s own three empty cursors, not a 403, since the legacy interceptor sends a 403
   * from coreservice to the dashboard. null when the caller may view it, and the routes' failure shape
   * when the lookup failed.
   */
  private async hiddenTaskDetail(query: TaskDetailReq): Promise<any[] | null> {
    const access = await taskAccess(this.db, query?.nMasterid, query?.nTaskid);
    if (access === 'failed') return [{ msg: -1, value: 'Failed to fetch' }];
    return access.view ? null : [[], [], []];
  }

  async getTaskDetail(query: TaskDetailReq): Promise<any> {
    const hidden = await this.hiddenTaskDetail(query);
    if (hidden) return hidden;
    query['ref'] = 3;
    let res = await this.db.executeRef('task_detail', query);
    if (res.success) {
      return res.data;
    } else {
      return [{ msg: -1, value: 'Failed to fetch', error: res.error }];
    }
  }

  /**
   * Unlink a task from a fact (FMTasks). et_fact_task_delete checks nothing about the caller, so this
   * needs edit access to the fact (et_fact_permissions bCanEdit): 403 / 404 / 500 from the gate. That is
   * the authority et_fact_update already has over a fact's task links (it rewrites them from jTasks),
   * and the legacy task table only offers the unlink on the caller's own facts. The task's own
   * visibility is not required: a fact owner may remove a task someone else attached to their fact.
   */
  async facttaskdelete(body: TaskFactDetailReq): Promise<any> {
    await assertCanEditFact(this.db, body.nMasterid, body.nFSid);
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

  /**
   * Progress only: needs `status` (creator or assignee), and always runs the detail SP's 'S' branch,
   * whatever permission the client sends ('E' would blank the other fields, 'N' add a second TaskDetail
   * row). Its one caller, the legacy task table, sends 'S'.
   */
  async updateTaskProgress(
    body: TaskUpdateProgressReq,
  ): Promise<TaskCreateRes[]> {
    await assertTaskAccess(this.db, body?.nMasterid, body?.nTaskid, 'status');
    let res = await this.db.executeRef('task_insert_detail', { ...body, permission: 'S' });
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
    const hidden = await this.hiddenTaskDetail(query);
    if (hidden) return hidden;
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


  /** taskBuilder/updatestatus: status + progress, creator or assignee (`status`). */
  async updateTaskStatus(body: taskUpdateStatusReq): Promise<any> {
    await assertTaskAccess(this.db, body?.nMasterid, body?.nTaskid, 'status');
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
