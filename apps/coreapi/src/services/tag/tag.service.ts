import { DbService } from '@app/global/db/pg/db.service';
import { Injectable } from '@nestjs/common';
import { TagCreateReq, TagCreateRes, TagReq } from '../../interfaces/tag.interface';
import { query } from 'express';

@Injectable()
export class TagService {
    constructor(private db: DbService) {

    }

    async tagBuilder(body: TagCreateReq): Promise<TagCreateRes> {
        let res = await this.db.executeRef('tag_builder', body);
        if (res.success) {
            try {
                return res.data[0][0];
            } catch (error) {
                return { msg: -1, value: 'Failed ', error: res.error }
            }
        } else {
            return { msg: -1, value: 'Failed ', error: res.error }
        }
        // return [{ msg: 1 }]
    }

    async taglist(query: TagReq): Promise<any> {
        query['ref'] = 2;
        let res = await this.db.executeRef('tag_list', query);
        if (res.success) {
            try {
                return res.data;
            } catch (error) {
                return { msg: -1, value: 'Failed ', error: res.error }
            }
        } else {
            return { msg: -1, value: 'Failed ', error: res.error }
        }
        // return [{ msg: 1 }]
    }

}
