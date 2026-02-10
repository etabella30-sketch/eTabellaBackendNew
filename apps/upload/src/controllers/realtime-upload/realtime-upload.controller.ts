import { Controller, Post, Body, Get, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ChunksUploadService } from '../../services/chunks-upload/chunks-upload.service';
import { ChunkStatus, ChunkStatusReq, MergeChunksReq, UploadResponce } from '../../interfaces/chunk.interface';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('realtime-upload')
export class RealtimeUploadController {


    
    constructor(private readonly chunkService: ChunksUploadService) {
    }
    @Get('status')
    async checkUploadedChunks(@Query() query: any): Promise<ChunkStatus> {
        const { identifier,nUPid,nCaseid, cPath, cTotal } = query;
        // return await this.chunkService.checkExistingChunks(identifier,0,0,'','');
        return await this.chunkService.checkExistingChunks(identifier,nUPid,nCaseid, cPath, cTotal);
    }

    @Post('upload-chunk')
    @UseInterceptors(FileInterceptor('file'))
    async uploadChunk(@UploadedFile() file: Express.Multer.File, @Body() body: any): Promise<UploadResponce> {
        return await this.chunkService.saveChunk(file, body);
    }


    @Post('complete-upload')
    async completeUpload(@Body() body: any): Promise<any>  { // { identifier: string, totalChunks: number }
        console.log('Query:', body)
        body.bisTranscript = true;
        return await this.chunkService.completeUpload(body);
    }

}
