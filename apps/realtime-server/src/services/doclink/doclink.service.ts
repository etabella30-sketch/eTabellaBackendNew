import { DbService } from '@app/global/db/pg/db.service';
import { Injectable } from '@nestjs/common';
import { UtilityService } from '../utility/utility.service';
import {
  docID,
  docIDmulti,
  InsertDoc,
  resInsertDoc,
} from '../../interfaces/doc.interface';
import { schemaType } from '@app/global/interfaces/db.interface';
// import { OpenFgaService } from '../open-fga/open-fga.service';
// import { DocFgaService } from '../doc-fga/doc-fga.service';

@Injectable()
export class DoclinkService {
  realTimeSchema: schemaType = 'realtime';

  constructor(
    private db: DbService,
    private utility: UtilityService,
    // private openFga: OpenFgaService, // OpenFgaService,
    // private docFga: DocFgaService,
  ) { }

  async insertDoc(body: InsertDoc): Promise<resInsertDoc> {
    let res = await this.db.executeRef('doc_insert', body, this.realTimeSchema);
    if (res.success) {
      try {
        const notificationlist = res.data[0][0]['jNotify'] || [];
        if (notificationlist.length) {
          this.utility.sendNotification(notificationlist, body.nMasterid);
        }
      } catch (error) { }

      try {
        // Mirror FactService.markAsTranscriptIfPublished — when a doc-link
        // is created on a published-transcript session, seed the transferred
        // coords (jTCordinates / nTPage / nTLine) directly from the live
        // values so the new row passes the orphan filter and shows correct
        // page+line on the published view (et_navigate_get_all,
        // et_marknav_doclinks). Without this, new doc-links on published
        // transcripts are invisible until a republish runs run3.py.
        await this.markAsTranscriptIfPublished(body.nSesid, res.data[0][0].nDocid);

        /*  const document = res.data[0][0];
          const tuples = [];
          if (document.nDocid && body.nMasterid) {
            tuples.push({
              user: `user:${body.nMasterid}`,
              relation: 'owner',
              object: `doclink:${document.nDocid}`,
            });
          }
          if (tuples.length > 0) {
            await this.openFga.writeTuplesSafe(tuples);
          }
          if (document.nDocid && body.jUsers.length > 0) {
            await this.docFga.insertFGATuples(document.nDocid, JSON.parse(body.jUsers));
          }*/
        return {
          msg: 1,
          value: 'Doc inserted successfully',
          nDocid: res.data[0][0].nDocid,
        };
      } catch (error) { }
    } else {
      return { msg: -1, value: 'Doc insert failed', error: res.error };
    }
  }

  /**
   * Doc-link counterpart to FactService.markAsTranscriptIfPublished. Same
   * logic, same dual publish-path detection (cStatus='P' OR
   * isTranscript+isUploaded), same idempotent gate (jTCordinates IS NULL).
   * See the fact-service version for the full rationale; the only
   * difference here is the table (DocDetail) and key column (nDocid).
   */
  async markAsTranscriptIfPublished(nSesid: string, nDocid: string): Promise<void> {
    if (!nSesid || !nDocid) return;
    try {
      await this.db.rowQuery(
        `UPDATE "DocDetail" dd
            SET "jTCordinates"    = dd."jCordinates",
                "nTPage"          = dd."nPage",
                "nTLine"          = dd."nLine",
                "cTransferStatus" = 'T'
          WHERE dd."nDocid" = $1
            AND dd."jTCordinates" IS NULL
            AND EXISTS (
              SELECT 1 FROM "RSessionMaster" s
              JOIN "DocMaster" m ON m."nSesid" = s."nSesid"
              WHERE m."nDocid" = $1
                AND s."nSesid" = $2
                AND (
                  s."cStatus" = 'P'
                  OR (s."isTranscript" = true AND s."isUploaded" = true)
                )
            )`,
        [nDocid, nSesid],
      );
    } catch (err) {
      console.error('[doclink] markAsTranscriptIfPublished error:', err);
    }
  }

  async docDelete(body: docID): Promise<any> {
    try {
      const res = await this.db.executeRef(
        'doc_delete',
        body,
        this.realTimeSchema,
      );
      if (res.success) {
        return res.data[0];
      } else {
        return { msg: -1, value: 'Delete failed', error: res.error };
      }
    } catch (error) {
      return { msg: -1, value: 'Delete failed', error: error };
    }
  }

  async docDetail(query: docIDmulti): Promise<any> {
    try {
      query['ref'] = 3;
      const res = await this.db.executeRef(
        'doc_detail',
        query,
        this.realTimeSchema,
      );
      if (res.success) {
        return res.data;
      } else {
        return { msg: -1, value: 'Fetch failed', error: res.error };
      }
    } catch (error) {
      return { msg: -1, value: 'Fetch failed', error: error };
    }
  }

  async getDocShared(query: docID): Promise<any> {
    try {
      const res = await this.db.executeRef(
        'doc_get_shared',
        query,
        this.realTimeSchema,
      );
      if (res.success) {
        return res.data[0];
      } else {
        return { msg: -1, value: 'Fetch failed', error: res.error };
      }
    } catch (error) {
      return { msg: -1, value: 'Fetch failed', error: error };
    }
  }

}
