import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { DownloadapiService } from './downloadapi.service';
import { deleteJobReq, downloadJobReq, downloadJobsListReq, downloadReq, getUrlReq, retryJobReq, StopJobReq } from './DTOs/download.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { S3FileService } from './services/s3-file.service';

@ApiBearerAuth('JWT')
@ApiTags()
@Controller()
export class DownloadapiController {
  constructor(private readonly downloadapiService: DownloadapiService, private readonly s3FileService: S3FileService) { }

  @Get('report')
  getHello(): any[] {
    return [];
  }

  @Post('startdownload')
  async startDownload(@Body() body: downloadReq): Promise<{ msg: number, value: string, error?: any }> {
    return await this.downloadapiService.insertDownloadJob(body);
  }

  @Post('startjob')
  async startDownloadJob(@Body() body: downloadJobReq): Promise<{ msg: number, value: string, error?: any }> {
    return await this.downloadapiService.startDownloadJob(body);
  }

  @Post('deletejob')
  async deleteDownloadJob(@Body() body: StopJobReq): Promise<{ msg: number, error?: any }> {
    return await this.downloadapiService.stopAndRemoveJob(body);
  }

  @Post('retryjob')
  async retryJob(@Body() body: retryJobReq): Promise<{ msg: number, value?: string, error?: any }> {
    return await this.downloadapiService.retryFailedJob(body);
  }

  @Post('delete')
  async deleteJob(@Body() body: deleteJobReq): Promise<{ msg: number, value?: string, error?: any }> {
    return await this.downloadapiService.deleteJob(body);
  }

  @Get('getdownload')
  async getDownload(@Query() query: downloadJobsListReq): Promise<any[]> {
    return await this.downloadapiService.getDownloadJobs(query);
  }

  @Get('get/url')
  async getUrl(@Query() query: getUrlReq): Promise<{ url: string }> {
    return await this.downloadapiService.getDownloadUrl(query);
  }


  @Post('startdownloadhyperlink')
  async starthyperlinkDownload(@Body() body: downloadReq): Promise<{ msg: number, value: string, error?: any }> {
    return await this.s3FileService.insertDownloadJob(body);
  }


}