import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { createReadStream, createWriteStream, existsSync, unlinkSync } from 'fs';
import { join, resolve } from 'path';
import { UploadService } from '../upload.service';
import { UtilityService } from '../services/utility/utility.service';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { ConfigService } from '@nestjs/config';
import { LogService } from '@app/global/utility/log/log.service';

@Processor('file-specific-merge')
export class FileMergeProcessor {
  constructor(private readonly upld: UploadService, private readonly redisDbService: RedisDbService,
    private readonly utility: UtilityService,
    @InjectQueue('file-merge') private fileMergeQueue: Queue,
    private config: ConfigService,
    private readonly logService: LogService
  ) {
    // console.log('FileMergeProcessor initialized');
  }

  @Process('merge')
  async handleSequentialChunkMerge(job: Job) {
    const { fileId, nUPid, startChunk, endChunk, body, path } = job.data;
    try {
      // console.log(`Merging chunks for file ${fileId}`);

      this.logService.info(`Merging chunks   ${startChunk} - ${endChunk} `, `upload/${nUPid}/${fileId}`);
      // const data = await this.redisDbService.getChunkObject(fileId, null, 10);// JSON.parse(await this.redisDbService.getValue(`file:${fileId}`));
      const savePath = path;//data.path;
      await this.mergeChunks(startChunk, endChunk, fileId, savePath);
      // console.log(`Completed merging for chunks ${startChunk} to ${endChunk} of file ${fileId}`);
      this.logService.info(`Chunk merge complete   ${startChunk} - ${endChunk} `, `upload/${nUPid}/${fileId}`);

      if (body) {
        // console.log('PUSHING TO FINAL PROCESS')
        this.logService.info(`Push To Final Merge  ${JSON.stringify(body)} `, `upload/${nUPid}/${fileId}`);
        // body.path = path;
        // `task${nUPid}`, 
        await this.fileMergeQueue.add(body, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 }); //

       /* const total = await this.redisDbService.countInc(`task:${nUPid}:count`);
        this.logService.info(`INC ${nUPid} COUNT ${total}`, `upload/notification`);*/

      }
    } catch (error) {

      this.logService.error(`Merge failed  ${error.message} `, `upload/${nUPid}/${fileId}`);
      this.utility.emit({ event: 'MERGING-FAILED', data: { identifier: fileId, nMasterid: job.data.nMasterid } });
    }
  }

  async mergeChunks(start: number, end: number, fileId: string, savePath: string) {
    return new Promise<void>(async (valid, reject) => {
      try {
        const chunksPath = join(this.upld.tempChunkPath, fileId);

        // const mergeFilePath = join(this.upld.tempChunkPath, fileId, `finalpart`);
        const mergeFilePath = join(this.config.get('ASSETS'), savePath);

        const writeStream = createWriteStream(mergeFilePath, { flags: 'a' });

        const processChunk = async (chunkIndex: number) => {
          if (chunkIndex > end) {
            // console.log(`Finished processing all chunks up to ${end} for file ${fileId}`);
            writeStream.end();
            return;
          }

          if (isNaN(chunkIndex)) {
            console.error(`Invalid chunk index: ${chunkIndex} for file ${fileId}`);
            reject(new Error('Chunk index is NaN.'));
            return;
          }

          const chunkFilePath = join(chunksPath, `${chunkIndex}`);
          if (existsSync(chunkFilePath)) {
            // console.log(`Merging chunk ${chunkIndex} for file ${fileId}`);
            return new Promise<void>((resolveChunk, rejectChunk) => {
              const readStream = createReadStream(chunkFilePath);

              readStream.pipe(writeStream, { end: false });

              readStream.on('end', () => {
                // console.log(`Chunk ${chunkIndex} merged successfully for file ${fileId}`);
                unlinkSync(chunkFilePath); // Optionally delete the chunk after merging
                resolveChunk();
              });

              readStream.on('error', (error) => {
                // console.error(`Error reading chunk ${chunkIndex} for file ${fileId}:`, error);
                rejectChunk(error);
              });
            })
              .then(() => processChunk(chunkIndex + 1))
              .catch(reject);
          } else {
            console.warn(`Chunk ${chunkIndex} does not exist for file ${fileId}, skipping...`);
            processChunk(chunkIndex + 1);
          }
        };

        processChunk(start)
          .then(() => {
            writeStream.on('finish', () => {
              // console.log(`All chunks merged successfully for file ${fileId}`);
              valid();
            });
          })
          .catch((error) => {
            writeStream.destroy();
            console.error(`Error during merging process for file ${fileId}:`, error);
            reject(error);
          });

        writeStream.on('error', (error) => {
          console.error(`Error writing to merged file for file ${fileId}:`, error);
          reject(error);
        });
      } catch (error) {
        console.error(`Error during merging process for file ${fileId}:`, error);
        reject(error);
      }
    });
  }

}
