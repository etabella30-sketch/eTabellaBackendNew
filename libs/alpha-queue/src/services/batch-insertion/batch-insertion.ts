import { AlphaQueueOptions } from "@app/alpha-queue/interfaces/queue.interface";
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { StorageManageService } from "../storage/storage.service";
import { LogService } from "@app/global/utility/log/log.service";
import { dbManagerService } from "../db/db.manager";
import { logList } from "@app/alpha-queue/interfaces/queue-log.interface";

@Injectable()
export class BatchInsertionManager implements OnModuleInit, OnModuleDestroy {

  private readonly appName: string = `queue/${this.config.name}`;

  private runningTimeout: any;

  private readonly logger = new Logger('alpha-queue-batch-process');
  private readonly MAX_RETRIES = 3;
  constructor(@Inject('QUEUE_CONFIG') private config: AlphaQueueOptions, private readonly storage: StorageManageService, private readonly logService: LogService, private readonly db: dbManagerService) {

  }

  async onModuleInit() {
  }


  startInsertion() {
    try {
      this.batchProcess();
    } catch (error) {

    }

  }


  async batchProcess() {

    try {
      clearTimeout(this.runningTimeout);
    } catch (error) {
    }
    try {



      const isHaveData = await this.storage.hasAnyHashLog();


      if (isHaveData) {
        this.logger.warn('Inserting log')
      
        const list: logList[] = await this.storage.getHashLog()

        this.logger.warn(`Found total ${list?.length}`);
        if (list) {


          let retries = 0;
          let isSaved = false;

          while (!isSaved && retries < this.MAX_RETRIES) {
            isSaved = await this.db.insertLog(list);
            if (!isSaved) {
              this.logger.error(`Saved failed retrying... `);
              retries++;
              await new Promise(resolve => setTimeout(resolve, 1000 * retries));
            }
          }

          if (isSaved) {
            this.logger.warn('Saved');
            await this.storage.deleteProcessedFields(list);
            // await this.storage.deleteHashLog(`queue:log:${this.config.name}:*`);
          }
        }
      } 




    } catch (error) {
      this.logger.error(error);
      this.logService.error(`Error in batch process ${error?.message}`, this.appName);
    }

    this.runningTimeout = setTimeout(() => {
      this.batchProcess();
    }, 3000);

  }


  async onModuleDestroy() {
    try {
      clearTimeout(this.runningTimeout);
    } catch (error) {
    }
  }




}