import { DbService } from '@app/global/db/pg/db.service';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { docID, docIDmulti, InsertDoc, resInsertDoc } from '../../interfaces/doc.interface';
import { query } from 'express';
import { UtilityService } from '../utility/utility.service';
import { assertCanDeleteDocLink, parseDocIds, viewableDocLinkIds } from './doclink-access';
import { assertCanCreateDocLink } from './doclink-create-gate';
import type { FactCreateActor } from '../fact/fact-access';

@Injectable()
export class DoclinkService {

    constructor(private db: DbService, private utility: UtilityService) {

    }

    /**
     * realtime.et_doc_insert stores the client's nCaseid, source document and jDl targets as given, so
     * the create gate (doclink-create-gate.ts, realtime-server's rule) runs first: 403 / 500 before any
     * write. The controller has no try/catch here, so the status reaches the client.
     */
    async insertDoc(body: InsertDoc, caller?: FactCreateActor | null): Promise<resInsertDoc> {
        await assertCanCreateDocLink(this.db, body, caller);
        let res = await this.db.executeRef('doc_insert', body,'realtime');
        if (res.success) {
            try {
                const notificationlist = res.data[0][0]["jNotify"] || []
                if (notificationlist.length) {
                    this.utility.sendNotification(notificationlist, body.nMasterid);
                }
            } catch (error) {
            }

            try {
                return { msg: 1, value: '   Doc inserted successfully', nDocid: res.data[0][0].nDocid };
            } catch (error) {

            }
        } else {
            return { msg: -1, value: 'Doc insert failed', error: res.error }
        }
    }


    /**
     * Owner only, and nDMLids must be one of nDocid's links (doclink-access.ts): 403 / 500 before
     * et_doc_delete runs. The controller rethrows it.
     */
    async docDelete(body: docID): Promise<any> {
        await assertCanDeleteDocLink(this.db, body?.nMasterid, body?.nDocid, body?.nDMLids);
        try {
            const res = await this.db.executeRef('doc_delete', body);
            if (res.success) {
                return res.data[0];
            } else {
                return { msg: -1, value: 'Delete failed', error: res.error }
            }
        } catch (error) {
            return { msg: -1, value: 'Delete failed', error: error }
        }
    }


    /**
     * GET doclink/docdetail: public.et_doc_detail returns every DocLink named, with its targets and
     * share list, whoever asks. It now runs with only the ids the caller owns or was shared (the rule of
     * realtime-server's doclink/docdetail, doclink-access.ts). When none is left the answer is the SP's
     * own empty result (three empty cursors), not a 403: the legacy compare view (individual.service
     * fetchAllDocs) reads it as "no linked documents", and the legacy interceptor sends a 403 from
     * coreservice to the dashboard. A bad jDocids or a failed lookup gets the route's failure shape.
     */
    async docDetail(query: docIDmulti): Promise<any> {
        const asked = parseDocIds(query?.jDocids);
        if (!asked) return { msg: -1, value: 'Fetch failed' };
        const visible = await viewableDocLinkIds(this.db, query?.nMasterid, asked);
        if (!visible) return { msg: -1, value: 'Fetch failed' };
        if (!visible.length) return [[], [], []];
        query.jDocids = JSON.stringify(visible);
        try {
            query["ref"] = 3;
            const res = await this.db.executeRef('doc_detail', query);
            if (res.success) {
                return res.data;
            } else {
                return { msg: -1, value: 'Fetch failed', error: res.error }
            }
        } catch (error) {
            return { msg: -1, value: 'Fetch failed', error: error }
        }
    }


}
