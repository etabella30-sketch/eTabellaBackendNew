import { DbService } from '@app/global/db/pg/db.service';
import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { CommentListReq, CommentManageReq, CommentUsersReq } from '../../interfaces/comment.interface';
import { schemaType } from '@app/global/interfaces/db.interface';
import { UtilityService } from '../utility/utility.service';
import { assertCanViewFact, factReadAccess } from '../fact/fact-access';
import { sameId } from '../team/team-access';

@Injectable()
export class CommentsService {

    realTimeSchema: schemaType = 'realtime';
    private readonly logger = new Logger(CommentsService.name);
    constructor(private db: DbService, private utility: UtilityService) { }

    async manageComment(body: CommentManageReq): Promise<any> {
        // Outside the try below, so a refusal reaches the client as 403 rather than a 500.
        await this.assertCanManage(body);
        try {
            const res = await this.db.executeRef('manage_comments', body, this.realTimeSchema);

            if (res.success) {
                try {
                    if (res.data[0][0]["msg"] == 1) {
                        const msgDetail: any[] = await this.readCommentsGrid({ nMasterid: body.nMasterid, nFSid: body.nFSid, nCid: res.data[0][0].nCid });
                        if (msgDetail?.length) {
                        this.emitMsg(msgDetail[0], body.cPermission);
                        }else{
                            this.logger.error('No Msg Detail Found for nCid:',res.data[0][0].nCid)
                        }
                    }
                } catch (error) {
                    this.logger.error(error);
                }
                return res.data[0][0];
            } else {
                throw new BadRequestException({
                    msg: -1,
                    value: 'Failed to manage comment',
                    error: res.error
                });
            }
        } catch (error) {
            this.logger.error(error);
            throw new InternalServerErrorException({
                msg: -1,
                value: 'Failed to manage comment',
                error: error.message
            });
        }
    }


    /**
     * realtime.et_manage_comments checks nothing about the caller. Adding ('N') needs view access to
     * the fact (et_fact_permissions bCanView); editing ('E') and deleting ('D') need the comment to be
     * the caller's own and on the fact named, as the legacy fact-discuss panel only offers editing on
     * your own comment and nothing offers delete.
     */
    private async assertCanManage(body: CommentManageReq): Promise<void> {
        if (body.cPermission === 'N') {
            await assertCanViewFact(this.db, body.nMasterid, body.nFSid);
            return;
        }
        const refused = new ForbiddenException({ msg: -1, value: 'You can only change your own comments' });
        if (!body.nMasterid || !body.nCid || !body.nFSid) throw refused;
        let res: any;
        try {
            res = await this.db.executeRef('comments_grid', { nFSid: body.nFSid, nCid: body.nCid, nMasterid: body.nMasterid }, this.realTimeSchema);
        } catch (error) {
            res = { success: false, error };
        }
        if (!res?.success) {
            this.logger.error(`comment owner lookup failed for ${body.nCid}: ${res?.error?.message ?? res?.error}`);
            throw new InternalServerErrorException({ msg: -1, value: 'Failed to manage comment' });
        }
        const rows: any[] = Array.isArray(res.data?.[0]) ? res.data[0] : [];
        const comment = rows.find((row) => sameId(row?.nCid, body.nCid));
        if (!comment || !sameId(comment.nUserid, body.nMasterid)) throw refused;
    }

    /**
     * Comments on one fact, for a caller who may view it (et_fact_permissions bCanView). Anyone else
     * gets the normal empty list rather than a 403, so neither frontend's interceptor navigates away.
     */
    async getCommentsGrid(query: CommentListReq): Promise<any> {
        const access = await factReadAccess(this.db, query.nMasterid, query.nFSid);
        if (access === 'failed') {
            throw new InternalServerErrorException({ msg: -1, value: 'Failed to get comments grid' });
        }
        if (access === 'hidden') return [];
        return this.readCommentsGrid(query);
    }

    /** realtime.et_comments_grid with no access check; callers check first. */
    private async readCommentsGrid(query: CommentListReq): Promise<any> {
        try {
            const res = await this.db.executeRef('comments_grid', query, this.realTimeSchema);
            if (res.success) {
                return res.data[0];
            } else {
                throw new BadRequestException({
                    msg: -1,
                    value: 'Failed to get comments grid',
                    error: res.error
                });
            }
        } catch (error) {
            throw new InternalServerErrorException({
                msg: -1,
                value: 'Failed to get comments grid',
                error: error.message
            });
        }
    }

    /** Who has commented on one fact; same gate and empty answer as getCommentsGrid. */
    async getCommentsUsers(query: CommentUsersReq): Promise<any> {
        const access = await factReadAccess(this.db, query.nMasterid, query.nFSid);
        if (access === 'failed') {
            throw new InternalServerErrorException({ msg: -1, value: 'Failed to get comments users' });
        }
        if (access === 'hidden') return [];
        try {
            const res = await this.db.executeRef('comments_users', query, this.realTimeSchema);
            if (res.success) {
                return res.data[0];
            } else {
                throw new BadRequestException({
                    msg: -1,
                    value: 'Failed to get comments users',
                    error: res.error
                });
            }
        } catch (error) {
            throw new InternalServerErrorException({
                msg: -1,
                value: 'Failed to get comments users',
                error: error.message
            });
        }
    }


    emitMsg(msgData, permission: string) {
        try {
            delete msgData.msg;
            delete msgData.value;
        } catch (error) {
        }
        const data = {
            type:'FACT-MESSAGE',
            ...msgData,
            permission: permission
        };
        this.utility.emit(data, `factsheet-comments`);
    }


}
