import { TupleKey } from '@app/global/interfaces/tuple.interface';
import { OpenFgaService } from '@app/global/open-fga/open-fga.service';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class TaskfgaService {
  private logger = new Logger(TaskfgaService.name);

  taskTag = (nTaskid: string): string => `task:${nTaskid}`;
  userTag = (nUserid: string): string => `user:${nUserid}`;
  caseTag = (nCaseid: string): string => `case:${nCaseid}`;
  private readonly relations = {
    owner: 'owner',
    in_case: 'in_case',
    assignee: 'assignee',
    can_view: 'can_view',
    can_edit_all: 'can_edit_all',
    can_edit_status: 'can_edit_status',
    can_delete: 'can_delete',
  };
  constructor(private readonly openFgaService: OpenFgaService) { }

  async createTaskTuple(
    nTaskid: string,
    nUserid: string,
    nCaseid: string,
  ): Promise<void> {
    try {
      if (!nTaskid) throw new Error('taskId is required');
      this.logger.warn('Create Task Tuple', nTaskid);
      const tuples: TupleKey[] = [];
      tuples.push({
        user: this.userTag(nUserid),
        relation: this.relations.owner,
        object: this.taskTag(nTaskid),
      });
      tuples.push({
        user: this.caseTag(nCaseid),
        relation: this.relations.in_case,
        object: this.taskTag(nTaskid),
      });
      await this.openFgaService.writeTuplesSafe(tuples);
    } catch (error) {
      this.logger.error('Failed task tuple', error);
    }
  }

  async assignTask(users: string[], nTaskid: string): Promise<void> {
    try {

      if (!nTaskid) throw new Error('taskId is required');

      // Normalize & dedupe input
      const desired = new Set(
        (users ?? [])
          .filter(Boolean)
          .map((u: any) => (typeof u === 'string' ? u : u.nUserid)),
      );

      // 1) Load current assignees (users only)
      const currentTuples = await this.openFgaService.readTuples({
        object: this.taskTag(nTaskid),
        relation: this.relations.assignee,
      });

      const currentUsers = new Set<string>(
        (currentTuples ?? [])
          // keep only user subjects (ignore team/case if you use them elsewhere)
          .filter(
            (t) => typeof t?.user === 'string' && t.user.startsWith('user:'),
          )
          .map((t) => t.user.replace(/^user:/, '')),
      );


      const toAddIds = [...desired].filter((u) => !currentUsers.has(u));
      const toRemoveIds = [...currentUsers].filter((u) => !desired.has(u));

      const toAdd: TupleKey[] = toAddIds.map((uid) => ({
        user: this.userTag(uid),
        relation: this.relations.assignee,
        object: this.taskTag(nTaskid),
      }));

      const toRemove: TupleKey[] = toRemoveIds.map((uid) => ({
        user: this.userTag(uid),
        relation: this.relations.assignee,
        object: this.taskTag(nTaskid),
      }));

      // 4) Apply changes
      if (toRemove.length > 0) {
        this.logger.log(
          `replaceAssignees: removing ${toRemove.length} assignee(s)`,
        );
        await this.openFgaService.deleteTuplesSafe(toRemove);
      }
      if (toAdd.length > 0) {
        this.logger.log(`replaceAssignees: adding ${toAdd.length} assignee(s)`);
        await this.openFgaService.writeTuplesSafe(toAdd);
      }

      if (toAdd.length === 0 && toRemove.length === 0) {
        this.logger.log(`replaceAssignees: no changes for task ${nTaskid}`);
      }
    } catch (error) {
      this.logger.error('Error in Assign Task', error);
    }
  }

  async getUserPermissions(
    nTaskid: string,
    nUserid: string,
  ): Promise<{
    can_view: boolean;
    can_edit_all: boolean;
    can_edit_status: boolean;
    can_delete: boolean;
  }> {
    if (!nTaskid) throw new Error('taskId is required');
    if (!nUserid) throw new Error('userId is required');

    const object = this.taskTag(nTaskid);
    const user = this.userTag(nUserid);

    try {
      // Query each relation separately
      const [can_view, can_edit_all, can_edit_status, can_delete] =
        await Promise.all([
          this.openFgaService.checkTupleExists({
            user,
            relation: this.relations.can_view,
            object,
          }),
          this.openFgaService.checkTupleExists({
            user,
            relation: this.relations.can_edit_all,
            object,
          }),
          this.openFgaService.checkTupleExists({
            user,
            relation: this.relations.can_edit_status,
            object,
          }),
          this.openFgaService.checkTupleExists({
            user,
            relation: this.relations.can_delete,
            object,
          }),
        ]);

      const result = { can_view, can_edit_all, can_edit_status, can_delete };
      this.logger.log(
        `Permissions for ${nUserid} on task ${nTaskid}: ${JSON.stringify(result)}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to get user permissions for task ${nTaskid}, user ${nUserid}`,
        error as any,
      );
      throw error;
    }
  }


  async getUserTasksInCase(
    caseId: string,
    userId: string,
  ): Promise<Array<{ task: string; can_view: boolean; can_edit_status: boolean; can_edit_all: boolean }>> {
    try {
      const user = this.userTag(userId);
      const caseObj = this.caseTag(caseId);
      const type = 'task';

      // 1) tasks this user can view
      // 2) tasks that belong to the case
      const [visibleRes, inCaseRes] = await Promise.all([
        this.openFgaService.listObjects({ user, relation: this.relations.can_view, type }),
        this.openFgaService.listObjects({ user: caseObj, relation: this.relations.in_case, type }),
      ]);

      const visible = new Set<string>((visibleRes.objects ?? []) as string[]);
      const inCase = new Set<string>((inCaseRes.objects ?? []) as string[]);

      // intersection = tasks in case that user can view
      const tasks = [...visible].filter((t) => inCase.has(t));

      // For each task, get edit perms
      const results = await Promise.all(
        tasks.map(async (task) => {
          const [editAll, editStatus] = await Promise.all([
            this.openFgaService.checkTupleExists({ user, relation: this.relations.can_edit_all, object: task }),
            this.openFgaService.checkTupleExists({ user, relation: this.relations.can_edit_status, object: task }),
          ]);

          return {
            task: task?.replace('task:', ''),                 // e.g. "task:456"
            can_view: true,       // by construction
            can_edit_status: editStatus,
            can_edit_all: editAll,
          };
        }),
      );

      return results;
    } catch (e) {
      console.error('getUserTasksInCase error:', e);
      return [];
    }
  }

  // ------------------------------

  /* async getMyTasks(nCaseid: string, nUserid: string): Promise<string[]> {
         if (!nCaseid) throw new Error('caseId is required');
         if (!nUserid) throw new Error('userId is required');
 
         const user = this.userTag(nUserid);
 
         try {
             // 1) List all tasks where this user is an owner
             const res = await this.openFgaService.listObjects({
                 user,
                 relation: this.relations.owner,
                 type: 'task',
             });
 
             const ownedTasks: string[] = (res.objects ?? []).map((o) =>
                 o.replace(/^task:/, ''),
             );
 
             if (ownedTasks.length === 0) {
                 this.logger.log(`getMyTasks: no owned tasks found for user ${nUserid}`);
                 return [];
             }
 
             // 2) Check which of those tasks belong to the given case
             const tuples = await this.openFgaService.readTuples({
                 relation: this.relations.in_case,
                 object: undefined, // we’ll filter manually
             });
 
             const tasksInCase = new Set(
                 (tuples ?? [])
                     .filter(
                         (t) =>
                             t.relation === this.relations.in_case &&
                             t.user === this.caseTag(nCaseid),
                     )
                     .map((t) => t.object.replace(/^task:/, '')),
             );
 
             // 3) Intersect: owned tasks ∩ tasks in case
             const result = ownedTasks.filter((id) => tasksInCase.has(id));
 
             this.logger.log(
                 `getMyTasks: found ${result.length} task(s) for user ${nUserid} in case ${nCaseid}`,
             );
             return result;
         } catch (error) {
             this.logger.error(
                 `Failed to get tasks for user ${nUserid} in case ${nCaseid}`,
                 error as any,
             );
             throw error;
         }
     }*/
  /*  async myAllTasks(nUserid: string, nCaseid: string): Promise<string[]> {
      if (!nUserid) throw new Error('userId is required');
      if (!nCaseid) throw new Error('caseId is required');
  
      const user = this.userTag(nUserid);
      const caseSubject = this.caseTag(nCaseid);
  
      try {
        // 1) All tasks this user can view
        const canViewRes = await this.openFgaService.listObjects({
          user,
          relation: this.relations.can_view,
          type: 'task',
        });
        const viewableTasks = new Set<string>(
          (canViewRes.objects ?? []).map((o) => o.replace(/^task:/, '')),
        );
        if (viewableTasks.size === 0) {
          this.logger.log(`myAllTasks: user ${nUserid} can_view no tasks`);
          return [];
        }
        // 2) All tasks that belong to this case (task#in_case@case:<id>)
        const inCaseTuples = await this.openFgaService.listObjects({
          user: caseSubject,
          relation: this.relations.in_case,
          type: 'task',
        });
        const tasksInCase = new Set<string>(
          (inCaseTuples.objects ?? []).map((o) => o.replace(/^task:/, '')),
        );
        if (tasksInCase.size === 0) {
          this.logger.log(`myAllTasks: no tasks found in case ${nCaseid}`);
          return [];
        }
        // 3) Intersection: viewable ∩ in_case
        const result = [...viewableTasks].filter((id) => tasksInCase.has(id));
  
        this.logger.log(
          `myAllTasks: user ${nUserid} has can_view on ${result.length} task(s) in case ${nCaseid}`,
        );
        return result;
      } catch (error) {
        this.logger.error(
          `myAllTasks failed for user ${nUserid} in case ${nCaseid}`,
          error as any,
        );
        throw error;
      }
    }
  */

  // async getAssigneeUsers(nTaskid: string): Promise<string[]> {
  //   if (!nTaskid) throw new Error('taskId is required');
  //   const users = await this.openFgaService.listAssigneeUsers(this.taskTag(nTaskid));
  //   return users;
  // }

  async getAssigneeUsers(nTaskid: string): Promise<string[]> {
    try {
      if (!nTaskid) throw new Error('taskId is required');

      // Read all assignee tuples for the task
      const assigneeTuples = await this.openFgaService.readTuples({
        object: this.taskTag(nTaskid),
        relation: this.relations.assignee,
      });

      this.logger.log('Raw assignee tuples:', JSON.stringify(assigneeTuples, null, 2));

      // Handle both possible data structures: t.key.user or t.user
      const userIds = (assigneeTuples ?? [])
        .map((t) => {
          // Try both possible structures
          const user = t?.key?.user ?? t?.user;
          return user;
        })
        .filter((user) => typeof user === 'string' && user.startsWith('user:'))
        .map((user) => user.replace(/^user:/, ''))
        .filter(Boolean); // Remove any empty strings

      this.logger.log(`Found ${userIds.length} assignees for task ${nTaskid}:`, userIds);
      return userIds;

    } catch (error) {
      this.logger.error('Error getting assignees for task', error);
      return []; // Return empty array on error for safety
    }
  }

}