import { DbService } from '@app/global/db/pg/db.service';
import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { CommentListReq, CommentManageReq, CommentUsersReq } from '../../interfaces/comment.interface';
import { schemaType } from '@app/global/interfaces/db.interface';
import { UtilityService } from '../utility/utility.service';

@Injectable()
export class CommentsService {

    realTimeSchema: schemaType = 'realtime';
    private readonly logger = new Logger(CommentsService.name);
    constructor(private db: DbService, private utility: UtilityService) { }

    async manageComment(body: CommentManageReq): Promise<any> {
        try {
            const res = await this.db.executeRef('manage_comments', body, this.realTimeSchema);

            if (res.success) {
                try {
                    if (res.data[0][0]["msg"] == 1) {
                        const msgDetail: any[] = await this.getCommentsGrid({ nMasterid: body.nMasterid, nFSid: body.nFSid, nCid: res.data[0][0].nCid });
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


    async getCommentsGrid(query: CommentListReq): Promise<any> {
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

    async getCommentsUsers(query: CommentUsersReq): Promise<any> {
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
