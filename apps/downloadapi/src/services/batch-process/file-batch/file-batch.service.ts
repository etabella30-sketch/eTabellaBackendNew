import { Injectable, Logger } from '@nestjs/common';
import { EnrichedFile, LargeFileBatch, SmallFileBatch, SmallFilePart } from 'apps/downloadapi/src/interfaces/download.interface';
import { FilePartService } from '../file-part/file-part.service';
import { DefaultService } from '../../default/default.service';

@Injectable()
export class FileBatchService extends DefaultService {

    private readonly logger = new Logger(FileBatchService.name);
    constructor(private readonly filePartService: FilePartService) {
        super();
    }


    /**
     * Split large files into batches of given size
     */
    async createLargeBatches(files: EnrichedFile[]): Promise<LargeFileBatch[]> {
        try {
            this.logger.log(`Creating large batches for ${files.length} files`);
            if (files?.length === 0) {
                this.logger.warn('No files provided for large batch creation');
                return [];
            }
            const batches: LargeFileBatch[] = [];
            let fromPartNo = 1;
            let batchIndex = 1;
            let totalParts = 0;
            let totalSize = 0;
            batches.push({ batchIndex, files: [], totalSize: 0, totalParts: 0 });
            let isHaveJobs = false;
            for (const [index, file] of files.entries()) {
                if (file.isExists) {
                    const { parts, nextPartNo } = await this.filePartService.FileParts(Number(file?.size || 0), fromPartNo);
                    fromPartNo = nextPartNo;
                    file.parts = parts;
                    totalParts += parts.length;
                    totalSize += Number(file?.size || 0);
                    let currrentBatch: LargeFileBatch = batches.find(b => b.batchIndex == batchIndex);


                    if (totalParts > this.S3_MAX_PARTS || totalSize > this.S3_MAX_BATCH_SIZE) {
                        // this.logger.log(`Batch ${batchIndex} exceeded at max parts (${totalParts}), creating new batch`);
                        batchIndex++;
                        batches.push({ batchIndex, files: [], totalSize: 0, totalParts: 0 });
                        currrentBatch = batches.find(b => b.batchIndex == batchIndex);
                        fromPartNo = 1; // reset part number for new batch
                        totalSize = Number(file?.size || 0); // reset size for new batch
                        const { parts, nextPartNo } = await this.filePartService.FileParts(Number(file?.size || 0), fromPartNo);
                        fromPartNo = nextPartNo;
                        file.parts = parts;
                        totalParts = parts.length; // reset for new batch
                    }
                    file.size = Number(file?.size || 0);
                    currrentBatch.files.push(file);
                    currrentBatch.totalSize = Number(totalSize);
                    currrentBatch.totalParts = totalParts;


                    isHaveJobs = true;

                }
            }
            if (!isHaveJobs) {
                this.logger.warn('No valid files found for large batch creation');
                return [];
            }
            this.logger.log(`Created ${batches.length} large batches with total parts: ${totalParts}`);
            return batches;
        } catch (error) {
            this.logger.error('Error creating batches', error);
            throw error;
        }

    }


    async createSmallBatches(files: EnrichedFile[]): Promise<SmallFileBatch[]> {
        try {
            this.logger.log(`Creating small batches for ${files.length} files`);
            const batches: SmallFileBatch[] = [];


            let batchIndex = 1;
            let totalSize = 0;
            let currentPartNumber = 1;
            let currentPart;
            batches.push({ batchIndex, parts: [], totalSize: 0, totalParts: 0 });

            let isHaveJobs = false;
            for (const [index, file] of files.entries()) {
                if (file.isExists) {
                    const batchCurrent = batches.find(b => b.batchIndex == batchIndex);
                    currentPart = batchCurrent.parts.find(p => p.partNumber == currentPartNumber);
                    if (!currentPart) {
                        // this.logger.log(`Creating new part for file ${file.cFilename} in batch ${batchIndex}`);
                        batchCurrent.parts.push({
                            partNumber: currentPartNumber,
                            files: [],
                            totalSize: 0
                        });
                        currentPart = batchCurrent.parts.find(p => p.partNumber == currentPartNumber);
                    }
                    totalSize += Number(file?.size || 0);
                    if (totalSize > this.SMALL_PART_MAX_SIZE) {
                        // this.logger.log(`Part ${currentPartNumber} exceeded max size (${totalSize}), creating new part`);
                        currentPartNumber++;
                        batchCurrent.parts.push({
                            partNumber: currentPartNumber,
                            files: [],
                            totalSize: 0
                        });
                        totalSize = Number(file?.size || 0); // reset size for new part
                        currentPart = batchCurrent.parts.find(p => p.partNumber == currentPartNumber);
                    }
                    currentPart.files.push(file);
                    currentPart.totalSize = totalSize;
                    batchCurrent.totalParts = batchCurrent.parts.length;
                    batchCurrent.totalSize += Number(file?.size || 0); //Number(totalSize);
                    // this.logger.log(`Added file ${file.cFilename} to part ${currentPartNumber} in batch ${batchIndex}`);
                    if (batchCurrent.parts.length > this.S3_MAX_PARTS) {
                        batchIndex++;
                        batches.push({ batchIndex, parts: [], totalSize: 0, totalParts: 0 });
                        currentPartNumber = 1; // reset part number for new batch
                        totalSize = 0; // reset size for new batch
                        // this.logger.log(`Batch ${batchIndex} exceeded max parts (${this.S3_MAX_PARTS}), creating new batch`);
                    }
                    isHaveJobs = true;
                }
            }

            if (!isHaveJobs) {
                this.logger.warn('No valid files found for small batch creation');
                return [];
            }

            this.logger.log(`Created ${batches.length} small batches with total parts: ${batches.reduce((acc, b) => acc + b.parts.length, 0)}`);

            return batches;
        } catch (error) {
            this.logger.error('Error creating small batches', error);
            throw error;
        }
    }


}