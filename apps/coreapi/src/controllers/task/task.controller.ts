import { Body, Controller, Get, Post, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TaskService } from '../../services/task/task.service';
import { TaskCreateReq, TaskCreateReqV2, TaskCreateRes, TaskDetailReq, TaskFactDetailReq, TasklistReq, TasklistRes, TaskUpdateProgressReq, taskUpdateStatusReq } from '../../interfaces/task.interface';


@ApiBearerAuth('JWT')
@ApiTags('task')
@Controller('task')
export class TaskController {

    constructor(private readonly taskService: TaskService) {
    }

    @Post('taskBuilder')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getCreate(@Body() body: TaskCreateReq): Promise<TaskCreateRes> {
        const res = await this.taskService.taskCreate(body);
        body.nTaskid = res.nTaskid; // get the task id from the first result
        try {
            await this.taskService.createTaskDetail(body);
        } catch (error) { }
        try {
            await this.taskService.createTaskReminder(body);
        } catch (error) { }
        try {
            await this.taskService.createTaskAssign(body);
        } catch (error) { }


        return res;
    }

    @Post('updateTask')
    @UsePipes(new ValidationPipe({ transform: true }))
    async createTaskDetail(@Body() body: TaskCreateReq): Promise<TaskCreateRes[]> {
        return await this.taskService.createTaskDetail(body);
    }

    @Post('taskdelete')
    @UsePipes(new ValidationPipe({ transform: true }))
    async taskDelete(@Body() body: TaskDetailReq): Promise<any> {
        return await this.taskService.taskDelete(body);
    }


    @Get('gettask')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getTasklist(@Query() query: TasklistReq): Promise<any> {
        
        return await this.taskService.getTasklist(query);
    }


    @Get('gettaskdetail')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getTaskDetail(@Query() query: TaskDetailReq): Promise<any> {
        return await this.taskService.getTaskDetail(query);
    }


    @Post('facttaskdelete')
    @UsePipes(new ValidationPipe({ transform: true }))
    async facttaskdelete(@Body() body: TaskFactDetailReq): Promise<any> {
        return await this.taskService.facttaskdelete(body);
    }


    @Post('updateTaskProgress')
    @UsePipes(new ValidationPipe({ transform: true }))
    async updateTaskStatus(@Body() body: TaskUpdateProgressReq): Promise<TaskCreateRes[]> {
        return await this.taskService.updateTaskProgress(body);
    }

    @Post('taskBuilder/v2')
    @UsePipes(new ValidationPipe({ transform: true }))
    async taskBuilder(@Body() body: TaskCreateReqV2): Promise<TaskCreateRes> {
        const res = await this.taskService.taskCreateV2(body);
        body.nTaskid = res.nTaskid; // get the task id from the first result

        try {
            await this.taskService.createTaskDetailV2(body);
        } catch (error) { }
        try {
            await this.taskService.createTaskReminderV2(body);
        } catch (error) { }
        try {
            await this.taskService.createTaskAssignV2(body);
        } catch (error) { }





        return res;
    }



    @Post('taskBuilder/updatestatus')
    @UsePipes(new ValidationPipe({ transform: true }))
    async taskUpdateStatus(@Body() body: taskUpdateStatusReq): Promise<TaskCreateRes> {
        return  await this.taskService.updateTaskStatus(body);;
    }



    @Get('gettaskdetail/v2')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getTaskDetailV2(@Query() query: TaskDetailReq): Promise<any> {
        return await this.taskService.getTaskDetailV2(query);
    }

}
