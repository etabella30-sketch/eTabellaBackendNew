import { Injectable, Logger } from '@nestjs/common';
import { EnrichedFile, LargeFileBatch, filesdetail, ProcessJobDetail, SmallFileBatch, UpdateFileSizePayload } from 'apps/downloadapi/src/interfaces/download.interface';
import { FileSizeService } from '../file-size/file-size.service';
import { FileBatchService } from '../file-batch/file-batch.service';
import { join } from 'path';
import { writeFile } from 'fs/promises';
import { promises as fs } from 'fs';
import { BatchSplitService } from '../batch-split/batch-split.service';
import { DefaultService } from '../../default/default.service';
import { ProcessDataService } from '../../process-data/process-data.service';

@Injectable()
export class UpdateFileSizeService extends DefaultService {
    private readonly logger = new Logger(UpdateFileSizeService.name);

    constructor(
        private readonly fileSizeService: FileSizeService,
        private readonly fileBatchService: FileBatchService,
        private readonly batchSplitService: BatchSplitService,
        private readonly processDataService: ProcessDataService
        // private readonly dbService: YourDbService,
    ) {
        super()
    }

    /**
     * Orchestrates fetching sizes and updating DB in batches
     */
    async updateFileSize(jobDetail: ProcessJobDetail, files: filesdetail[]): Promise<{ largeBatches: LargeFileBatch[], smallBatches: SmallFileBatch[] }> {
        const { nDPid, nCaseid } = jobDetail;
        this.logger.log(`Starting update for nDPid=${nDPid}`);


        // 1. Fetch enriched data
        const enriched: EnrichedFile[] = await this.fileSizeService.getFileSizes(files);


        // 2. Split in files
        const { smallFiles, largeFiles, invalidFiles } = this.batchSplitService.splitBatchFiles(enriched);


        this.logger.verbose(`Found ${smallFiles.length} small files, ${largeFiles.length} large files, and ${invalidFiles.length} invalid files.`);





        // 3. Create batches
        const largeBatches = await this.fileBatchService.createLargeBatches(largeFiles);
        const smallBatches = await this.fileBatchService.createSmallBatches(smallFiles);


        await this.createUpdateBatches(largeBatches, smallBatches, invalidFiles, nDPid);

        /*for (const [index, batch] of largeBatches.entries()) {
            this.logger.log(`Processing batch ${index + 1}/${largeBatches.length} (${batch.files.length} items)`);
            await this.saveJSONFile(nCaseid, batch.files, index + 1);
        }

        for (const [index, batch] of smallBatches.entries()) {
            this.logger.log(`Processing batch ${index + 1}/${smallBatches.length} `);
            await this.saveJSONFile(nCaseid, batch, index + 1);
        }*/
        this.logger.log(`Completed update for nDPid=${nDPid}`);
        return { largeBatches, smallBatches };
    }

    async createDirectBatches(files: filesdetail[]): Promise<{ largeBatches: LargeFileBatch[], smallBatches: SmallFileBatch[] }> {
        this.logger.log(`Creating direct batches for ${files.length} files`);

        const largeFiles = files.filter(file => file.cBatchType == 'L');
        const smallFiles = files.filter(file => file.cBatchType == 'S');

        const largeBatches = await this.fileBatchService.createLargeBatches(largeFiles as EnrichedFile[]);
        const smallBatches = await this.fileBatchService.createSmallBatches(smallFiles as EnrichedFile[]);

        this.logger.log(`Created ${largeBatches.length} large batches and ${smallBatches.length} small batches`);
        return { largeBatches, smallBatches };
    }



    async createUpdateBatches(largeBatches: LargeFileBatch[], smallBatches: SmallFileBatch[], invalidFiles: EnrichedFile[], nDPid: string): Promise<void> {
        this.logger.log(`Creating update batches for nDPid=${nDPid}`);
        const bundleList: UpdateFileSizePayload[] = [];

        if (largeBatches?.length) {
            this.logger.log(`Processing ${largeBatches.length} large batches`);
            for (const batch of largeBatches) {
                for (const file of batch.files) {
                    bundleList.push({
                        bd: file.nBundledetailid,
                        s: String(file.size),
                        x: file.isExists,
                        t: 'L',
                        b: batch.batchIndex
                    });
                }
            }
        }

        if (smallBatches?.length) {
            this.logger.log(`Processing ${smallBatches.length} small batches`);
            for (const batch of smallBatches) {
                for (const part of batch.parts) {
                    for (const file of part.files) {
                        bundleList.push({
                            bd: file.nBundledetailid,
                            s: String(file.size),
                            x: file.isExists,
                            t: 'S',
                            b: batch.batchIndex
                        });
                    }

                }
            }
        }



        if (invalidFiles?.length) {
            this.logger.warn(`Found ${invalidFiles.length} invalid files, adding to bundle list`);
            for (const file of invalidFiles) {
                bundleList.push({
                    bd: file.nBundledetailid,
                    s: String(file.size),
                    x: false,
                    t: 'I',
                    b: 0 // Invalid files don't belong to any batch
                });
            }
        }

        this.logger.log(`Total bundles to updating : ${bundleList.length}`);

        if (bundleList?.length) {
            // for (let i = 0; i < bundleList.length; i += this.UPDATE_BATCH_TO_DB) {
            //     const chunk = bundleList.slice(i, i + this.UPDATE_BATCH_TO_DB);
            //     await this.processDataService.updateFileSizeBatch(nDPid, chunk);
            // }

            const BATCH_SIZE = this.UPDATE_BATCH_TO_DB;
            const total = bundleList.length;

            for (let i = 0; i < total; i += BATCH_SIZE) {
                const chunk = bundleList.slice(i, i + BATCH_SIZE);
                const isLast = i + BATCH_SIZE >= total;              // ⟵ true on the final iteration :contentReference[oaicite:0]{index=0}
                this.logger.log(`Updating batch ${i / BATCH_SIZE + 1} of ${Math.ceil(total / BATCH_SIZE)}; isLast=${isLast}`);
                await this.processDataService.updateFileSizeBatch(nDPid, chunk, isLast);
            }

        }

    }




    /*async saveJSONFile(nCaseid: string, data: any, batchIndex: number): Promise<void> {
        // 2.a — save batches to disk
        try {
            // ensure the directory exists (creates nested folders as needed)
            const dirPath = join('assets', 'downloadbatch', String(nCaseid));
            await fs.mkdir(dirPath, { recursive: true });

            // now write the file
            const outPath = join(dirPath, `batches${batchIndex}.json`);
            await fs.writeFile(outPath, JSON.stringify(data, null, 2), 'utf8');
            this.logger.log(`Saved ${data.length} batches to ${outPath}`);
        } catch (err: any) {
            this.logger.error(`Failed to write batches JSON: ${err.message}`);
        }
    }*/

}