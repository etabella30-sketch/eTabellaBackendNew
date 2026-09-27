import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { DownloadapiService } from './downloadapi.service';
import { deleteJobReq, downloadJobReq, downloadJobsListReq, downloadReq, getUrlReq, retryJobReq, StopJobReq } from './DTOs/download.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { S3FileService } from './services/s3-file.service';
import { DbService } from '@app/global/db/pg/db.service';
import { assertCaseAccess } from 'apps/download/src/auth/download-access';
import { assertJobAccess } from './auth/job-access';

// JwtMiddleware (downloadapi.module.ts) puts the caller's id in nMasterid. A package is built from
// the case and section the caller names, and get/url mints a URL for any nDPid, so those routes also
// check the caller is a member of that case (or a global admin): without it any signed-in user could
// package another case's documents and download them.
@ApiBearerAuth('JWT')
@ApiTags()
@Controller()
export class DownloadapiController {
  constructor(private readonly downloadapiService: DownloadapiService, private readonly s3FileService: S3FileService,
    private readonly db: DbService) { }

  @Get('report')
  getHello(): any[] {
    return [];
  }

  @Post('startdownload')
  async startDownload(@Body() body: downloadReq): Promise<{ msg: number, value: string, error?: any }> {
    await assertCaseAccess(this.db, body.nMasterid, body.nCaseid, body.nSectionid);
    // Hyperlink packages run the PDF link-rewrite stage (python GoToR burn via
    // the s3-file-processing queue) BEFORE the shared archive pipeline; plain
    // packages go straight to the archive queue. Same job row, same progress
    // events either way — see docs/reader-export-plan.md §Phase C L3.
    //
    // The rewrite path only runs when python is actually configured; otherwise
    // a hyperlink job takes the plain archive path (still bundles the source +
    // linked docs + Master Index, just no burned-in links) instead of hanging
    // on a missing python binary. Lets local/un-provisioned envs work.
    return body?.isHyperlink && this.s3FileService.isRewriteConfigured()
      ? await this.s3FileService.insertDownloadJob(body)
      : await this.downloadapiService.insertDownloadJob(body);
  }

  // startjob, deletejob, retryjob and delete act on the package id they are given (queue it, pull it
  // from the queue, re-run it, delete it and its <nDPid>/ folder in Spaces), so each needs the same
  // case rule as get/url first. Where et_process_retry / et_delete refuse a caller themselves (the
  // 2026-07-02 and 2026-07-09 SPs), the queue and Spaces steps after them did not look at that answer.
  @Post('startjob')
  async startDownloadJob(@Body() body: downloadJobReq): Promise<{ msg: number, value: string, error?: any }> {
    await assertJobAccess(this.db, body.nMasterid, body.jobId);
    return await this.downloadapiService.startDownloadJob(body);
  }

  @Post('deletejob')
  async deleteDownloadJob(@Body() body: StopJobReq): Promise<{ msg: number, error?: any }> {
    await assertJobAccess(this.db, body.nMasterid, body.nDPid);
    return await this.downloadapiService.stopAndRemoveJob(body);
  }

  @Post('retryjob')
  async retryJob(@Body() body: retryJobReq): Promise<{ msg: number, value?: string, error?: any }> {
    await assertJobAccess(this.db, body.nMasterid, body.nDPid);
    return await this.downloadapiService.retryFailedJob(body);
  }

  @Post('delete')
  async deleteJob(@Body() body: deleteJobReq): Promise<{ msg: number, value?: string, error?: any }> {
    await assertJobAccess(this.db, body.nMasterid, body.nDPid);
    return await this.downloadapiService.deleteJob(body);
  }

  @Get('getdownload')
  async getDownload(@Query() query: downloadJobsListReq): Promise<any[]> {
    return await this.downloadapiService.getDownloadJobs(query);
  }

  @Get('get/url')
  async getUrl(@Query() query: getUrlReq): Promise<{ cUrl: string }> {
    await assertJobAccess(this.db, query.nMasterid, query.nDPid);
    return await this.downloadapiService.getDownloadUrl(query);
  }


  @Post('startdownloadhyperlink')
  async starthyperlinkDownload(@Body() body: downloadReq): Promise<{ msg: number, value: string, error?: any }> {
    await assertCaseAccess(this.db, body.nMasterid, body.nCaseid, body.nSectionid);
    return await this.s3FileService.insertDownloadJob(body);
  }


}