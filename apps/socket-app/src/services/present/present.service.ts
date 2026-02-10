
import { Server } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { presentCompare, presentCompareData, presentCurrentTab, presentPosition } from '../../interfaces/present.interface';
import { DbService } from '@app/global/db/pg/db.service';

type presentStatus = 'B' | 'I' | 'P' | 'L' | 'C';
@Injectable()
export class PresentService {
  private server: Server;
  public setServer(server: Server) {
    this.server = server;
  }

  constructor(private redis: RedisDbService, private db: DbService) {
  }

  async emitPresent(value: any) {
    this.server.to(`P${value.data.nPresentid}`).emit("presentation-tools", value);
  }

  async emitPresentTools(value: any) {
    this.server.to(`U${value.data.nUserid}`).emit("presentation-tools", value);
  }

  async emitHighlight(value: any) {
    this.server.to(`P${value.data.nPresentid}`).emit("presentation-highlights", value);
  }

  async savePosition(value: presentPosition) {
    this.redis.setValue(`PRESENT:${value.nPresentid}:POSITION:${value.nBundledetailid}`, JSON.stringify(value), 24 * 3600);


    const cPresentStatus = await this.presentStatus(value.nPresentid);
    if (cPresentStatus == 'L') {
      this.server.to(`P${value.nPresentid}`).emit("presentation-position", value);
    }
  }


  async saveCompare(value: presentCompare) {
    if (!value.compareMode) {
      this.redis.deleteValue(`PRESENT:${value.nPresentid}:COMPARE`);
      this.redis.deleteValue(`PRESENT:${value.nPresentid}:COMPARE:DATA`);
    } else {
      this.redis.setValue(`PRESENT:${value.nPresentid}:COMPARE`, JSON.stringify(value), 24 * 3600);
    }
    const cPresentStatus = await this.presentStatus(value.nPresentid);
    if (cPresentStatus == 'L') {
      this.server.to(`P${value.nPresentid}`).emit("presentation-compare", value);
    }
  }

  async saveCompareData(value: presentCompareData) {
    if (!value.compareMode) {
      this.redis.deleteValue(`PRESENT:${value.nPresentid}:COMPARE:DATA`);
    } else {
      this.redis.setValue(`PRESENT:${value.nPresentid}:COMPARE:DATA`, JSON.stringify(value), 24 * 3600);
    }
    const cPresentStatus = await this.presentStatus(value.nPresentid);
    if (cPresentStatus == 'L') {
      this.server.to(`P${value.nPresentid}`).emit("presentation-compare-data", value);
    }
  }

  async saveCurrentTab(value: presentCurrentTab) {
    this.redis.setValue(`PRESENT:${value.nPresentid}:TAB`, JSON.stringify({ nBundledetailid: value.nBundledetailid }), 24 * 3600);


    const cPresentStatus = await this.presentStatus(value.nPresentid);
    if (cPresentStatus == 'L') {
      this.server.to(`P${value.nPresentid}`).emit("presentation-tab", value);
    }
  }




  async presentStatus(nPresentid: string): Promise<presentStatus> {
    try {
      const status: presentStatus = await this.redis.getValue(`PRESENT:${nPresentid}:STATUS`);
      if (!status) {
        const res = await this.db.executeRef('present_status', { nPresentid }, 'present');
        if (res.success) {
          const status = res.data[0][0]["cStatus"];
          this.redis.setValue(`PRESENT:${nPresentid}:STATUS`, status, 24 * 3600);
          return status;
        }
      }
      return status;
    } catch (error) {
      console.error(error);
    }
    return null;
  }

  async setupScreenSharing(data: any) {
    try {
      // if (data.event == 'SCREEN-SHARE-START') {
      //   this.redis.setValue(`PRESENT:${data.data.nPresentid}:SCREEN:SHARE`, JSON.stringify(data?.data), 24 * 3600);
      // } else if (data.event == 'SCREEN-SHARE-STOP') {
      //   this.redis.deleteValue(`PRESENT:${data.data.nPresentid}:SCREEN:SHARE`);
      // } 
    } catch (error) {
      
    }
  }

}