import { DbService } from '@app/global/db/pg/db.service';
import { logDataMdl } from '@app/global/interfaces/log.interface';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EventLogService {


  constructor(private db: DbService, private config: ConfigService) {

  }


  async insertLog(data: logDataMdl) {
    let origin = this.config.get('ORIGIN');
    data.jData = data.jData ? data.jData : {}
    data.jData['O'] = origin;
    // console.log('USER LOG',data)
    let res = await this.db.executeRef('log_insert', data);
    if (res.success) {
      return res.data;
    } else {
      return { msg: -1, value: 'Failed to insert log', error: res.error }
    }
  }



}
