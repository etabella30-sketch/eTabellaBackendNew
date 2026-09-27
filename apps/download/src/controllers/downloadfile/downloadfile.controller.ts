import { Controller, Get, Query, Res, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { DownloadFile, DownloadProcess, PresentReportReq } from '../../interfaces/download.interface';
import { DownloadfileService } from '../../services/downloadfile/downloadfile.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LogInterceptor } from '@app/global/interceptor/log.interceptor';
import { ApiId } from '@app/global/decorator/apiid';
import { PresentReportService } from '../../services/present-report/present-report.service';
import { DbService } from '@app/global/db/pg/db.service';
import { assertCanReadObject, assertCaseAccess, assertFilesInCase, presentReportCase } from '../../auth/download-access';

// Every route here runs behind DownloadAuthMiddleware (download.module.ts), which puts the caller's
// id in query.nMasterid. Each route then checks what that caller may read (auth/download-access.ts)
// before anything is fetched or streamed.
@ApiBearerAuth('JWT')
@ApiTags('download')
@Controller('download')
export class DownloadfileController {

    constructor(private readonly downloadfileService: DownloadfileService,
        private readonly prService: PresentReportService,
        private readonly db: DbService
    ) {
        // this.checkMemory(); // Call the memory check function in the constructor
    }


    @Get('downloadfile')
    @UsePipes(new ValidationPipe({ transform: true }))
    @UseInterceptors(LogInterceptor)
    @ApiId(27)
    async startExportfile(@Query() query: DownloadProcess, @Res() res: Response): Promise<void> {
        await assertCaseAccess(this.db, query.nMasterid, query.nCaseid, query.nSectionid);
        return await this.downloadfileService.downloadfiles(query, res);
    }


    @Get()
    @UsePipes(new ValidationPipe({ transform: true }))
    @UseInterceptors(LogInterceptor)
    @ApiId(27)
    async downloadfile(@Query() query: DownloadFile, @Res() res: Response): Promise<void> {
        await assertCanReadObject(this.db, query.nMasterid, query.cPath);
        let detail = { cPath: query.cPath, cFilename: query.cFilename }
        return await this.downloadfileService.downloadSingleFileFromS3(detail, res);
    }



    @Get('hyperlink/downloadfile')
    @UsePipes(new ValidationPipe({ transform: true }))
    @UseInterceptors(LogInterceptor)
    @ApiId(27)
    async startHyperLinkfile(@Query() query: DownloadProcess, @Res() res: Response): Promise<void> {
        await assertCaseAccess(this.db, query.nMasterid, query.nCaseid, query.nSectionid);
        // With no nSectionid (the legacy toolbar sends none) et_download_with_linkfiles picks jFiles by
        // id alone, from any case: every named document must be in the case just checked.
        await assertFilesInCase(this.db, query.nCaseid, query.jFiles);
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
        await assertCaseAccess(this.db, query.nMasterid, presentReportCase(query.params), null);
        return await this.prService.downloadPresentfiles(query, res);
    }


    
    @Get('approximate/size')
    @UsePipes(new ValidationPipe({ transform: true }))
    @UseInterceptors(LogInterceptor)
    async checkForDownload(@Query() query: DownloadProcess): Promise<void> {
        await assertCaseAccess(this.db, query.nMasterid, query.nCaseid, query.nSectionid);
        return await this.downloadfileService.getApproximateSize(query);
    }


}
