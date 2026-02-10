import { DbService } from '@app/global/db/pg/db.service';
import { schemaType } from '@app/global/interfaces/db.interface';
import { Injectable, NotFoundException } from '@nestjs/common';
import { AnnotMarks } from '../../interfaces/feed.interface';
import { OpenFgaService } from '../open-fga/open-fga.service';

@Injectable()
export class MarksService {
  realTimeSchema: schemaType = 'realtime';

  constructor(
    private db: DbService,
    // private openFga: OpenFgaService,
  ) {}

  async getMarks(body: AnnotMarks): Promise<any> {
    body['ref'] = 3;
    // let factIds = await this.openFga.listViewableFactIds(body.nUserid);
    // let docLinkIds = await this.openFga.listViewableDocLinkIds(body.nUserid);
    // console.log('Fact IDs:', factIds);
    // body['jFactids'] = factIds;
    // body['jDoclinkIds'] = docLinkIds;
    let res = await this.db.executeRef('marks', body, this.realTimeSchema);
    if (res.success) {
      return res.data;
    } else {
      throw new NotFoundException(res.err || 'Failed to fetch marjs');
    }
  }
}
