import { DbService } from '@app/global/db/pg/db.service';
import { Injectable } from '@nestjs/common';
import { AssignBundlesReq, AssignBundlesRes, assigncontactReq, AssignCustomBundlesReq, assignTagReq, assignTaskReq, checkAssignBundleExistsReq, FileMetadataReq, unassignContactReq, unassignTagReq, unassignTaskReq, ViewBundlesReq, ViewContactReq, ViewTaskReq } from '../../interfaces/assign.interface';
import { query } from 'express';
import { assertTaskAccess } from '../task/task-access';
import { assertTaskDocsInCase } from './assign-access';

@Injectable()
export class AssignService {

    constructor(private db: DbService) {

    }

    async bundlesAssignment(body: AssignBundlesReq): Promise<AssignBundlesRes> {
        let res = await this.db.executeRef('assign_bundles', body)

        if (res.success) {
            return { msg: 1, value: 'Assigned', data: res.data[0] };
        } else {
            return { msg: -1, value: 'File assign is failed' };
        };
    }

    async custombundlesAssignment(body: AssignCustomBundlesReq): Promise<AssignBundlesRes> {
        let res = await this.db.executeRef('assign_custombundles', body)
        if (res.success) {
            return { msg: 1, value: 'Assigned', data: res.data[0] };
        } else {
            return { msg: -1, value: 'File assign is failed' };
        };
    }


    async bundlesUnAssignment(body: AssignBundlesReq): Promise<AssignBundlesRes> {
        let res = await this.db.executeRef('unassign_bundles', body)
        if (res.success) {
            return { msg: 1, value: 'Unassigned', data: res.data[0] };
        } else {
            return { msg: -1, value: 'File assign is failed' };
        };
    }

    async viewCustombundle(query: ViewBundlesReq): Promise<any> {
        let res = await this.db.executeRef('assign_custom_list', query)
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Fatch failed' };
        };
    }

    async assignContact(body: assigncontactReq): Promise<any> {
        let res = await this.db.executeRef('assign_contact', body)
        if (res.success) {
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Assign failed' };
        };
    }



    /**
     * assign/assigntask: et_assign_task links the documents in jFiles to nTaskid (BDTasks rows owned by
     * the caller) for any task id it is given. The caller must hold the task's edit right (creator,
     * assignee or global admin, active member of the task's case; assignees link documents to their tasks
     * from the legacy file Properties picker), and every document must be in the task's case.
     */
    async assignTask(body: assignTaskReq): Promise<any> {
        await assertTaskAccess(this.db, body?.nMasterid, body?.nTaskid, 'edit');
        await assertTaskDocsInCase(this.db, body.nTaskid, body?.jFiles);
        let res = await this.db.executeRef('assign_task', body)
        if (res.success) {
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Assign failed' };
        };
    }

    async unassignTag(body: unassignTagReq): Promise<any> {
        let res = await this.db.executeRef('unassign_tag', body)
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Unassign failed' };
        };
    }

    /**
     * assign/unassigntask: et_unassign_task removes the caller's own BDTasks links of nTaskid. Same task
     * gate as assignTask, so only someone who may still link documents to the task may unlink them.
     */
    async unassignTask(body: unassignTaskReq): Promise<any> {
        await assertTaskAccess(this.db, body?.nMasterid, body?.nTaskid, 'edit');
        let res = await this.db.executeRef('unassign_task', body)
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Unassign failed' };
        };
    }

    async unassignContact(body: unassignContactReq): Promise<any> {
        let res = await this.db.executeRef('unassign_contact', body)
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Unassign failed' };
        };
    }

    async assignTag(body: assignTagReq): Promise<any> {
        let res = await this.db.executeRef('assign_tag', body)
        if (res.success) {
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Assign failed' };
        };
    }


    async viewcontact(query: ViewContactReq): Promise<any> {
        let res = await this.db.executeRef('assign_contact_list', query)
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Fatch failed' };
        };
    }



    async viewtask(query: ViewTaskReq): Promise<any> {
        let res = await this.db.executeRef('assign_task_list', query)
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Fatch failed' };
        };
    }


    async viewTag(query: ViewContactReq): Promise<any> {
        let res = await this.db.executeRef('assign_tag_list', query)
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Fatch failed' };
        };
    }


    async checkCustomBundle(body: checkAssignBundleExistsReq): Promise<any> {
        let res = await this.db.executeRef('assign_checkbundle_exists', body)
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Unassign failed' };
        };
    }

    async file_metadata(query: FileMetadataReq): Promise<any> {
        let res = await this.db.executeRef('get_file_metadata', query)
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Fatch failed' };
        };
    }


}
