import { logList } from "@app/alpha-queue/interfaces/queue-log.interface";
import { AlphaQueueOptions, queueLog, StepProgress } from "@app/alpha-queue/interfaces/queue.interface";
import { DbService } from "@app/global/db/pg/db.service";
import { schemaType } from "@app/global/interfaces/db.interface";
import { LogService } from "@app/global/utility/log/log.service";
import { Inject, Injectable } from "@nestjs/common";

@Injectable()
export class dbManagerService {
  schema: schemaType = 'task';
  private readonly appName: string = `queue/${this.config.name}`;
  constructor(@Inject('QUEUE_CONFIG') private config: AlphaQueueOptions, private readonly db: DbService, private readonly logService: LogService) {

  }



  async getTasks(masterId: string, nPageno: number, nBatchsize: number): Promise<any[]> {
    try {
      let res = await this.db.executeRef('task_detail', { nTid: (masterId), nPageno, nBatchsize }, this.schema);
      if (res.success) {
        try {
          return res.data[0];
        } catch (error) {
          return [];
        }
      } else {
        return [];
      }
    } catch (error) {
    }

  }



  async updateTasksummary(masterId: string, completed: number, failed: number, startDt: string, lastUpdated: string, steps: Record<number, StepProgress>): Promise<void> {
    try {
      const jSteps = [];
      try {
        const keys = Object.keys(steps);

        keys.forEach(a => {
          jSteps.push({ ...steps[a], nRid: Number(a) })
        })

      } catch (error) {

      }

      await this.db.executeRef('task_update', { nTid: (masterId), nCompleted: completed || 0, nFailed: failed || 0, dStartDt: startDt, dLastUpdateDt: lastUpdated, jSteps: JSON.stringify(jSteps || []) }, this.schema);
    } catch (error) {
      throw new Error(`Error to save tasks`);
    }

  }



  async updateTaskDetail(masterId: string, list: queueLog[]): Promise<void> {
    try {
      await this.db.executeRef('task_detail_update', { nTid: (masterId), jList: JSON.stringify(list || []) }, this.schema);
    } catch (error) {
      throw new Error(`Error to save tasks`);
    }

  }



  async insertLog(list: logList[]): Promise<boolean> {
    try {
      const res = await this.db.executeRef('task_detail_log_insert', { jList: JSON.stringify(list || []) }, this.schema);
      if (res.success) {
        if (res.data[0][0]["msg"] == 1) {
          return true;
        }
      }
      this.logService.error(`Error in insert log ${res?.error}`, this.appName)
      return false
    } catch (error) {
      this.logService.error(`Error in insert log ${error?.message}`, this.appName)
      return false;
    }

  }





}