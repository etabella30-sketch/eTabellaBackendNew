import { Body, Controller, Get, Post, Query, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { fileListReq, fileListRes } from '../../interfaces/index.interface';
import { GenerateindexService } from '../../services/generateindex/generateindex.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IndexDataService } from '../../services/generateindex/indexdata.service';
import { IndexFinalService } from '../../services/generateindex/indexfinal.service';
import { LogInterceptor } from '@app/global/interceptor/log.interceptor';
import { ApiId } from '@app/global/decorator/apiid';

@ApiBearerAuth('JWT')
@ApiTags('generateindex')
@Controller('generateindex')
export class GenerateindexController {

    constructor(private indexFinal: IndexFinalService) {
        // try {
        //     this.checkMemory()
        // } catch (error) {
        //     console.error('Error while monitoring memory:', error);
        // }
    }

    @Post('indexdata')
    @UseInterceptors(LogInterceptor)
    @ApiId(30)
    @UsePipes(new ValidationPipe({ transform: true }))
    async getIndexData(@Body() body: fileListReq): Promise<fileListRes> {
        return await this.indexFinal.getIndexData(body);
    }

    checkMemory() {
        try {
            setInterval(() => {
                const memoryUsage = process.memoryUsage();
                console.log('Memory usage:', {
                    rss: (memoryUsage.rss / 1024 / 1024).toFixed(2) + ' MB',
                    heapTotal: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2) + ' MB',
                    heapUsed: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
                    external: (memoryUsage.external / 1024 / 1024).toFixed(2) + ' MB',
                    arrayBuffers: (memoryUsage.arrayBuffers / 1024 / 1024).toFixed(2) + ' MB',
                });
            }, 5000);   // Log memory usage every 2 seconds

        } catch (error) {
            console.error('Error while monitoring memory:', error);
        }

    }
}
