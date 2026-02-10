import { Controller, Get, Query, Res, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { DownloadFile, DownloadProcess, PresentReportReq } from '../../interfaces/download.interface';
import { DownloadfileService } from '../../services/downloadfile/downloadfile.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LogInterceptor } from '@app/global/interceptor/log.interceptor';
import { ApiId } from '@app/global/decorator/apiid';
import { PresentReportService } from '../../services/present-report/present-report.service';

// @ApiBearerAuth('JWT')
@ApiTags('download')
@Controller('download')
export class DownloadfileController {

    constructor(private readonly downloadfileService: DownloadfileService,
        private readonly prService: PresentReportService
    ) {
        // this.checkMemory(); // Call the memory check function in the constructor
    }


    @Get('downloadfile')
    @UsePipes(new ValidationPipe({ transform: true }))
    @UseInterceptors(LogInterceptor)
    @ApiId(27)
    async startExportfile(@Query() query: DownloadProcess, @Res() res: Response): Promise<void> {
        return await this.downloadfileService.downloadfiles(query, res);
    }


    @Get()
    @UsePipes(new ValidationPipe({ transform: true }))
    @UseInterceptors(LogInterceptor)
    @ApiId(27)
    async downloadfile(@Query() query: DownloadFile, @Res() res: Response): Promise<void> {
        let detail = { cPath: query.cPath, cFilename: query.cFilename }
        return await this.downloadfileService.downloadSingleFileFromS3(detail, res);
    }



    @Get('hyperlink/downloadfile')
    @UsePipes(new ValidationPipe({ transform: true }))
    @UseInterceptors(LogInterceptor)
    @ApiId(27)
    async startHyperLinkfile(@Query() query: DownloadProcess, @Res() res: Response): Promise<void> {
        return await this.downloadfileService.downloadfilesWithHyperLink(query, res);
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

    @Get('downloadPresentReport')
    @UsePipes(new ValidationPipe({ transform: true }))
    @UseInterceptors(LogInterceptor)
    @ApiId(27)
    async startPresentfile(@Query() query: PresentReportReq, @Res() res: Response): Promise<void> {
        return await this.prService.downloadPresentfiles(query, res);
    }


    
    @Get('approximate/size')
    @UsePipes(new ValidationPipe({ transform: true }))
    @UseInterceptors(LogInterceptor)
    async checkForDownload(@Query() query: DownloadProcess): Promise<void> {
        return await this.downloadfileService.getApproximateSize(query);
    }


}
