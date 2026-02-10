import { Controller, Post, Body, Get, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ChunksUploadService } from '../../services/chunks-upload/chunks-upload.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ChunkStatus, ChunkStatusReq, MergeChunksReq, UploadJob, UploadResponce, uploadStatusSet } from '../../interfaces/chunk.interface';
import { FileInterceptor } from '@nestjs/platform-express';


@ApiBearerAuth('JWT')
@ApiTags('upload')
@Controller('upload')
export class ChunkManagementController {

    constructor(private readonly chunkService: ChunksUploadService) {
    }



    @Post('set-upload-status')
    async setUploadProperty(@Body() body: uploadStatusSet): Promise<any> {
        return await this.chunkService.setUploadStatus(body);
    }

    @Get('status')
    async checkUploadedChunks(@Query() query: ChunkStatusReq): Promise<ChunkStatus> {
        const { identifier,nUPid,nCaseid, cPath, cTotal } = query;
        return await this.chunkService.checkExistingChunks(identifier,nUPid,nCaseid, cPath, cTotal);
    }

    @Post('upload-chunk')
    @UseInterceptors(FileInterceptor('file'))
    async uploadChunk(@UploadedFile() file: Express.Multer.File, @Body() body: any): Promise<UploadResponce> {
        return await this.chunkService.saveChunk(file, body);
    }


    @Post('complete-upload')
    async completeUpload(@Body() body: MergeChunksReq): Promise<any> { // { identifier: string, totalChunks: number }
        // console.log('Query:', body)
        return await this.chunkService.completeUpload(body);
    }



    
    @Post('upload-job')
    async uploadJob(@Body() body: UploadJob): Promise<any> {
        return await this.chunkService.uploadJob(body);
    }


}
