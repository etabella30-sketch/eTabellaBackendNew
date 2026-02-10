import { Body, Controller, Get, Post, Query, Res, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BatchService } from '../../services/batch/batch.service';
import { batchColumnReq, batchDwdpathReq, batchLogDetailReq, batchLogReq, batchLogRes, batchUploadReq, batchdownloadReq, batchdownloadRes } from '../../interfaces/batch.interface';
import { query } from 'express';

@ApiBearerAuth('JWT')
@ApiTags('batchfile')
@Controller('batch')
export class BatchController {
    constructor(private batchService: BatchService) {

    }

    @Get('filecolumns')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getFilecolumn(@Query() query: batchColumnReq): Promise<batchdownloadRes> {
        return await this.batchService.getFilecolumn(query);
    }

    @Get('download')
    async downloadFile(@Query() query: batchDwdpathReq, @Res() res: Response) {
        return await this.batchService.downloadFile(query, res);

    }



    @Get('uploadedfilecols')
    async getUploadedFileCols(@Query() query: batchDwdpathReq): Promise<batchdownloadRes> {
        console.log('\n\n\n\n uploadedfilecols', query)
        return await this.batchService.getUploadedFileCols(query);
    }


    @Post('getbatchfile')
    async generateBatchfile(@Body() body: batchdownloadReq): Promise<batchdownloadRes> {
        return await this.batchService.getfiledata(body);
    }


    @Post('uploadbatchfile')
    async uploadBatchfile(@Body() body: batchUploadReq): Promise<batchdownloadRes> {
        return await this.batchService.uploadfiledata(body);
    }


    @Get('getbatchlog')
    async getBatchlog(@Query() query: batchLogReq): Promise<batchLogRes> {
        return await this.batchService.getBatchlog(query);
    }


    @Get('getbatchlogdetail')
    async getBatchlogDetail(@Query() query: batchLogDetailReq): Promise<any> {
        return await this.batchService.getBatchlogDetail(query);
    }





}
