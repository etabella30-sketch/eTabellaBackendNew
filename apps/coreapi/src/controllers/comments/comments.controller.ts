import { Body, Controller, Delete, Get, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CommentsService } from '../../services/comments/comments.service';
import { CommentListReq, CommentManageReq, CommentUsersReq } from '../../interfaces/comment.interface';

@ApiBearerAuth('JWT')
@ApiTags('Comments')
@Controller('comments')
export class CommentsController {

    constructor(private readonly commentsService: CommentsService) { }

    @Get('grid')
    async getCommentsGrid(@Query() query: CommentListReq): Promise<any> {
        return this.commentsService.getCommentsGrid(query);
    }

    @Get('users')
    async getCommentsUsers(@Query() query: CommentUsersReq): Promise<any> {
        return this.commentsService.getCommentsUsers(query);
    }

    @Post('add')
    async addComment(@Body() body: CommentManageReq): Promise<any> {
        body.cPermission = 'N';
        return this.commentsService.manageComment(body);
    }

    @Put('edit')
    async editComment(@Body() body: CommentManageReq): Promise<any> {
        body.cPermission = 'E';
        return this.commentsService.manageComment(body);
    }

    @Delete('delete')
    async deleteComment(@Body() body: CommentManageReq): Promise<any> {
        body.cPermission = 'D';
        return this.commentsService.manageComment(body);
    }
}
