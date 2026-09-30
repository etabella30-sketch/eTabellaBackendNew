import { DbService } from '@app/global/db/pg/db.service';
import { Injectable } from '@nestjs/common';
import { AssignBundlesReq, AssignBundlesRes, assigncontactReq, AssignCustomBundlesReq, assignTagReq, assignTaskReq, checkAssignBundleExistsReq, FileMetadataReq, unassignContactReq, unassignTagReq, unassignTaskReq, UndoAssignmentReq, ViewBundlesReq, ViewContactReq, ViewTaskReq } from '../../interfaces/assign.interface';
import { query } from 'express';

@Injectable()
export class AssignService {

    constructor(private db: DbService) {

    }

    async bundlesAssignment(body: AssignBundlesReq): Promise<AssignBundlesRes> {
        let res = await this.db.executeRef('assign_bundles', body)

        if (res.success) {
            // et_assign_bundles returns a single row carrying jNewBDAids / nAssigned.
            // This used to hand back the rows array, so the client's res.data.newBDids
            // read undefined and undo had nothing to work with.
            return { msg: 1, value: 'Assigned', data: res.data[0][0] };
        } else {
            return { msg: -1, value: 'File assign is failed' };
        };
    }

    /**
     * Removes exactly the BDAssignment rows a preceding assign created, by their
     * primary keys. et_unassign_bundles is not usable here: it deletes assignment
     * rows without filtering nUserid, so it takes teammates' assignments with it,
     * and it also deletes BundleMaster rows.
     */
    async undoAssignment(body: UndoAssignmentReq): Promise<AssignBundlesRes> {
        let res = await this.db.executeRef('assign_undo_bdaids', body)
        if (res.success) {
            return { msg: 1, value: 'Undone', data: res.data[0][0] };
        } else {
            return { msg: -1, value: 'Undo failed' };
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



    async assignTask(body: assignTaskReq): Promise<any> {
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

    async unassignTask(body: unassignTaskReq): Promise<any> {
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
