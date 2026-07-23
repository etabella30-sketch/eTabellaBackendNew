import { Injectable, Logger } from '@nestjs/common';
import { downloadQueuePayload, filesdetail, LargeFileBatch, ProcessJobDetail, QueueSummary, SmallFileBatch } from '../../interfaces/download.interface';
import { ProcessDataService } from '../../services/process-data/process-data.service';
import { DateTimeService } from '@app/global/utility/date-time/date-time.service';
import { UpdateFileSizeService } from '../../services/batch-process/update-file-size/update-file-size.service';
import { RedisService } from '../../util/redis/redis.service';
import { LargebatchService } from '../large/largebatch/largebatch.service';
import { SmallbatchService } from '../small/smallbatch/smallbatch.service';
import { DoneCallback, Job } from 'bull';



import { join } from 'path';
import { writeFile } from 'fs/promises';
import { promises as fs } from 'fs';
import { FinalizeArchiverService } from '../../merge/finalize-archiver/finalize-archiver.service';
import { LogService } from '@app/global/utility/log/log.service';
import { PackageReportsService } from '../../services/package-reports/package-reports.service';
import { AnnotateEvidenceService } from '../../services/annotate-evidence/annotate-evidence.service';

@Injectable()
export class DownloadProcessService {
    private logger = new Logger('download-process-service');
    constructor(private readonly dataService: ProcessDataService,
        private readonly updateFileSize: UpdateFileSizeService,
        private readonly date: DateTimeService,
        private readonly redisService: RedisService,
        private readonly largeBatchService: LargebatchService,
        private readonly smallBatchService: SmallbatchService,
        private readonly finalizeArchiverService: FinalizeArchiverService,
        private readonly logService: LogService,
        private readonly packageReports: PackageReportsService,
        private readonly annotateEvidence: AnnotateEvidenceService
    ) {
    }

    async startDownload(payload: downloadQueuePayload, mainJob: Job, mainQueueCallBack: DoneCallback): Promise<void> {
        const { nDPid } = payload;
        try {

            const summary: QueueSummary = await this.redisService.getQueueSummary(nDPid);
            this.logger.log(`Starting download process`);
            this.logService.info(`Starting download process for nDPid=${nDPid}`, `queue/${nDPid}`);
            const jobDetail: ProcessJobDetail = await this.dataService.getProcessJobDetail(nDPid);

            let files: filesdetail[] = await this.dataService.getFiles(nDPid);

            // Honor the "Download Case Package" include-flags (jInclude): drop the
            // evidence documents when unchecked, and append generated data reports
            // (facts/tags/doclinks) so they ride the normal batch/tar pipeline.
            const includes = jobDetail?.jInclude?.includes;
            if (Array.isArray(includes)) {
                if (!includes.includes('evidence')) files = [];
                // "Facts and Notes" must be visible in the downloaded PDFs as well
                // as included in the separate Facts report. The broader 'annotate'
                // option can still burn marks without requesting that report.
                // Swap cPath before reports/index are appended so only real
                // evidence documents reach AnnotateEvidenceService.
                if ((includes.includes('facts') || includes.includes('annotate')) && includes.includes('evidence')) {
                    await this.annotateEvidence.annotateEvidence(jobDetail, files);
                }
                const reports = await this.packageReports.buildReportFiles(jobDetail);
                if (reports.length) {
                    this.logService.info(`Appending ${reports.length} generated report(s) to package`, `queue/${nDPid}`);
                    files = [...files, ...reports];
                }
                if (jobDetail?.jInclude?.indexMode === 'folder-html') {
                    // Reader "Export linked Bundle" (plan §Phase D): NO archive-root
                    // Master Index; instead one index.html INSIDE each source-doc
                    // folder listing that doc + its `hyperlink doc/` link targets.
                    const folderIdx = await this.packageReports.buildFolderIndexFiles(jobDetail, files);
                    if (folderIdx.length) {
                        this.logService.info(`Appending ${folderIdx.length} per-folder linked-doc index(es) to package`, `queue/${nDPid}`);
                        files = [...files, ...folderIdx];
                    }
                } else {
                    // Master Index (plan §10): xlsx + pdf at the archive ROOT, with
                    // relative hyperlinks derived from THIS files list — so links
                    // resolve locally in the extracted folder. New-FE jobs only
                    // (jInclude present); legacy callers keep byte-identical output.
                    const indexFiles = await this.packageReports.buildMasterIndexFiles(jobDetail, files);
                    if (indexFiles.length) {
                        this.logService.info(`Appending Master Index (${indexFiles.length} file(s)) to package`, `queue/${nDPid}`);
                        files = [...files, ...indexFiles];
                    }
                }
            }

            if (files.length <= 0) {
                this.logService.error(`No files found for nDPid=${nDPid}`, `queue/${nDPid}`);
                this.logger.error(`No files found for nDPid=${nDPid}`);
                throw new Error(`No files found for nDPid=${nDPid}`);
            }


            this.logger.log(`Fetched ${files.length} files for nDPid=${nDPid}`);

            this.logService.info(`Fetched ${files.length} files`, `queue/${nDPid}`);
            let largeBatches: LargeFileBatch[] = [], smallBatches: SmallFileBatch[] = [];

            if (!jobDetail?.isBatchUpdated) {
                this.redisService.updateActionStatus(nDPid, mainJob, 'SIZE-UPDATING');
                const batchFiles = await this.updateFileSize.updateFileSize(jobDetail, files);
                largeBatches = batchFiles?.largeBatches || [];
                smallBatches = batchFiles?.smallBatches || [];
                this.redisService.setupBatchSizes(nDPid, smallBatches?.length, largeBatches?.length);
                
                await this.updateTotalPratsCount(nDPid, largeBatches, smallBatches, mainJob);

                this.redisService.updateActionStatus(nDPid, mainJob, 'SIZE-UPDATED');



            } else {
                this.logService.info(`Job detail indicates no batch update needed`, `queue/${nDPid}`);
                this.logger.warn(`Job detail for nDPid=${nDPid} indicates no batch update needed.`);
                const batchFiles = await this.updateFileSize.createDirectBatches(files);
                largeBatches = batchFiles?.largeBatches || [];
                smallBatches = batchFiles?.smallBatches || [];

            }

            // BATCH SAVE TO JSON
            /*for (const [index, batch] of largeBatches.entries()) {
                this.logService.info(`Processing batch ${index + 1}/${largeBatches.length} (${batch.files.length} items)`, `queue/${nDPid}`);
                this.logger.log(`Processing batch ${index + 1}/${largeBatches.length} (${batch.files.length} items)`);
                await this.saveJSONFile(jobDetail?.nCaseid, batch.files, index + 1, 'large');
            }*/

            /*for (const [index, batch] of smallBatches.entries()) {
                this.logger.log(`Processing batch ${index + 1}/${smallBatches.length} `);
                await this.saveJSONFile(jobDetail?.nCaseid, batch, index + 1, 'small');
            }*/

            // await this.setupBatchSummary(nDPid, largeBatches, smallBatches);

            this.redisService.updateActionStatus(nDPid, mainJob, 'BATCH-STARTED');

            this.logger.log(`Download process started for nDPid=${nDPid} with ${files.length} files.`);
            this.logService.info(`Download process started with ${files.length} files.`, `queue/${nDPid}`);


            if (summary?.isAllPartsUploaded) {
                this.finalizeArchiverService.finalizeArchive(nDPid, mainJob, mainQueueCallBack, largeBatches, smallBatches, jobDetail)
            } else {
                if (largeBatches?.length) {
                    await this.largeBatchService.startProcessing(nDPid, mainJob, largeBatches, (err?: any) => {
                        if (err) {
                            mainQueueCallBack(err);
                        } else {
                            this.finalizeArchiverService.finalizeArchive(nDPid, mainJob, mainQueueCallBack, largeBatches, smallBatches, jobDetail)
                        }
                    });
                } else {
                    this.logService.info(`No large batches found`, `queue/${nDPid}`);
                    this.logger.warn(`No large batches found for nDPid=${nDPid}.`);
                }

                if (smallBatches?.length) {
                    await this.smallBatchService.startProcessing(nDPid, mainJob, smallBatches, (err?: any) => {
                        if (err) {
                            mainQueueCallBack(err);
                        } else {
                            this.finalizeArchiverService.finalizeArchive(nDPid, mainJob, mainQueueCallBack, largeBatches, smallBatches, jobDetail)
                        }
                    });
                } else {
                    this.logService.info(`No small batches found`, `queue/${nDPid}`);
                    this.logger.warn(`No small batches found for nDPid=${nDPid}.`);
                }
            }



            // TODO: CHECK IF ALL JOBS COMPLETED THEN STAR MERGING 

            // this.logService.info(`No small batches found`, `queue/${nDPid}`);
            // this.logger.log(`Download process completed for nDPid=${nDPid} at ${this.date.getCurrentTime()}`);
        } catch (error) {
            this.logService.error(`Failed to start download process: ${error.message}`, `queue/${nDPid}`);
            this.logger.error('Error in startDownload:', error);
            throw new Error(`Failed to start download process: ${error.message}`);
        }

    }


    // TODO:  NOT REQUIRED BECOUSE BULL QUEUE ALREADY HOLD EVERY DETAIL
    /* async setupBatchSummary(nDPid: number, largeBatches: LargeFileBatch[], smallBatches: SmallFileBatch[]): Promise<void> {
         try {
             this.logger.log(`Setting up batch summary for nDPid=${nDPid} with ${largeBatches?.length} large batches and ${smallBatches?.length} small batches`);
 
             await this.redisService.setupBatchSummary(nDPid, 'large', largeBatches);
 
             await this.redisService.setupBatchSummary(nDPid, 'small', smallBatches);
             this.logger.log(`Batch summary setup completed for nDPid=${nDPid}`);
 
 
         } catch (error) {
             this.logger.error(`Error setting up batch summary for nDPid=${nDPid}: ${error.message}`, error.stack);
             throw error;
         }
 
     }*/


    async saveJSONFile(nCaseid: string, data: any, batchIndex: number, batchType: 'small' | 'large'): Promise<void> {
        // 2.a — save batches to disk
        try {
            // ensure the directory exists (creates nested folders as needed)
            const dirPath = join('assets', 'downloadbatch', String(nCaseid), batchType);
            await fs.mkdir(dirPath, { recursive: true });

            // now write the file
            const outPath = join(dirPath, `batches${batchIndex}.json`);
            await fs.writeFile(outPath, JSON.stringify(data, null, 2), 'utf8');
            this.logger.log(`Saved ${data.length} batches to ${outPath}`);
        } catch (err: any) {
            this.logger.error(`Failed to write batches JSON: ${err.message}`);
        }
    }


    /* async updateTotalPratsCount(nDPid: string, largeBatches: LargeFileBatch[], smallBatches: SmallFileBatch[], mainJob: Job): Promise<void> {
         try {
             const totalLargeParts = largeBatches.reduce((batchAcc, batch) => {
                 // if you already precomputed batch.totalParts, you can use that:
                 if (batch.totalParts != null) {
                     return batchAcc + batch.totalParts;
                 }
                 // otherwise count each file.parts array
                 return (
                     batchAcc +
                     batch.files.reduce(
                         (fileAcc, file) => fileAcc + (file.parts?.length ?? 0),
                         0
                     )
                 );
             }, 0);
 
             // 2) Sum up each small-file batch’s part groups:
             const totalSmallParts = smallBatches.reduce((acc, batch) => {
                 // if batch.totalParts exists, use it; else count parts.length
                 return acc + (batch.totalParts ?? batch.parts.length);
             }, 0);
 
             // 3) Grand total:
             const totalParts = totalLargeParts + totalSmallParts;
             await this.redisService.updateTotalPartsCount(nDPid, totalParts);
 
 
 
 
             await mainJob.progress({ event: 'DOWNLOAD-PROGRESS', totalParts });
 
         } catch (error) {
             this.logService.error(`Error updating total parts count ${error.message}`, `queue/${nDPid}`);
             this.logger.error(`Error updating total parts count for nDPid=${nDPid}: ${error.message}`);
             throw error;
         }
     }*/

    async updateTotalPratsCount(
        nDPid: string,
        largeBatches: LargeFileBatch[],
        smallBatches: SmallFileBatch[],
        mainJob: Job
    ): Promise<void> {
        try {
            // 1) Sum up all "parts"
            const totalLargeParts = largeBatches.reduce((batchAcc, batch) => {
                if (batch.totalParts != null) {
                    return batchAcc + batch.totalParts;
                }
                return batchAcc + batch.files.reduce(
                    (fileAcc, file) => fileAcc + (file.parts?.length ?? 0),
                    0
                );
            }, 0);

            const totalSmallParts = smallBatches.reduce((acc, batch) => {
                return acc + (batch.totalParts ?? batch.parts.length);
            }, 0);

            const totalParts = totalLargeParts + totalSmallParts;

            // 2) Sum up all sizes
            const totalLargeSize = largeBatches.reduce((batchAcc, batch) => {
                if (batch.totalSize != null) {
                    return batchAcc + batch.totalSize;
                }
                return batchAcc + batch.files.reduce(
                    (fileAcc, file) => fileAcc + (file.size ?? 0),
                    0
                );
            }, 0);

            const totalSmallSize = smallBatches.reduce((acc, batch) => {
                if (batch.totalSize != null) {
                    return acc + batch.totalSize;
                }
                return acc + batch.parts.reduce(
                    (partAcc, part) => partAcc + (part.totalSize ?? 0),
                    0
                );
            }, 0);

            const totalSize = totalLargeSize + totalSmallSize;

            // 3) Persist counts and sizes
            await this.redisService.updateTotalPartsCount(nDPid, totalParts,totalSize);
            // Assuming you have a corresponding Redis helper for size:
            // await this.redisService.updateTotalSizeCount(nDPid, totalSize);

            // 4) Report progress with both values
            await mainJob.progress({
                event: 'DOWNLOAD-PROGRESS',
                totalParts,
                totalSize,
            });
        } catch (error) {
            this.logService.error(
                `Error updating total parts/size for ${nDPid}: ${error.message}`,
                `queue/${nDPid}`
            );
            this.logger.error(
                `Error updating total parts/size for nDPid=${nDPid}: ${error.message}`
            );
            throw error;
        }
    }
}
