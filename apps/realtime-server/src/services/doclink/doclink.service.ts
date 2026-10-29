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
import { parseDocIds, viewableDocLinkIds } from './doclink-view-gate';
import { assertCanCreateDocLink } from './doclink-create-gate';
import { assertCanDeleteDocLink } from './doclink-view-gate';
import type { Caller } from '@app/api-kernel';
import { docLinkShareNotices } from '@app/permissions/share-notifications';
import type { DocLinkIdFields, DocLinkInsertFields, DocLinkWrites } from '@app/rt-features/doclink';
import type { RealtimeUser } from '../../middleware/realtime-auth.middleware';
import { assertDocLinkTargets, assertTranscriptPosition, withoutSelfShare } from '../fact/mark-write-guards';
import { markWriteKey, onceWithinWindow } from '../fact/mark-dedupe';
// import { OpenFgaService } from '../open-fga/open-fga.service';
// import { DocFgaService } from '../doc-fga/doc-fga.service';

@Injectable()
export class DoclinkService implements DocLinkWrites {
  /** DOCLINK_WRITES (shared-libraries plan Phase 8): the shared DocLinkController's insertdoc, over this app's create gate. */
  insert(caller: Caller, body: DocLinkInsertFields): Promise<unknown> {
    return this.insertDoc(body as unknown as InsertDoc, { userId: caller.userId, isAdmin: caller.isPlatformAdmin === true });
  }

  /** DOCLINK_WRITES: the shared DocLinkController's docdelete, over the owner gate and realtime.et_doc_delete. */
  remove(caller: Caller, body: DocLinkIdFields): Promise<unknown> {
    return this.docDelete(body as unknown as docID, { userId: caller.userId, isAdmin: caller.isPlatformAdmin === true });
  }

  realTimeSchema: schemaType = 'realtime';

  constructor(
    private db: DbService,
    private utility: UtilityService,
    // private openFga: OpenFgaService, // OpenFgaService,
    // private docFga: DocFgaService,
  ) { }

  insertDoc(body: InsertDoc, user: RealtimeUser | undefined): Promise<resInsertDoc> {
    // Day 3 load QA (2026-10-29): one DocLink per gesture (see mark-dedupe).
    return onceWithinWindow(markWriteKey('insertdoc', user?.userId, body), () => this.insertDocOnce(body, user));
  }

  private async insertDocOnce(body: InsertDoc, user: RealtimeUser | undefined): Promise<resInsertDoc> {
    // realtime.et_doc_insert stores the client's nCaseid / nBundledetailid / nSesid as given: 403
    // (or 500) before anything is written unless the caller may add DocLinks there.
    await assertCanCreateDocLink(this.db, user, body);
    // Day 3 load QA (2026-10-29): the linked lines and target pages must be real; no self-share row.
    assertTranscriptPosition(body);
    assertDocLinkTargets(body.jDl);
    body.jUsers = withoutSelfShare(body.jUsers, user?.userId) as string;
    let res = await this.db.executeRef('doc_insert', body, this.realTimeSchema);
    if (res.success) {
      const row = res.data?.[0]?.[0];
      if (!row || Number(row.msg) !== 1 || !row.nDocid) {
        return { msg: -1, value: row?.value || 'Doc insert failed', error: row };
      }
      try {
        // R3-003: a private DocLink (jUsers []) raises no DS row, and the creator is never told about his own link.
        const notificationlist = docLinkShareNotices(row.jNotify, body.nMasterid);
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
      // Surface the actual Postgres/SP error (was hidden behind the generic
      // "Doc insert failed", which made transcript DocLink failures undiagnosable).
      const e: any = res.error;
      const sqlMsg = (e && typeof e === 'object' ? (e.message ?? e.detail ?? e.hint ?? JSON.stringify(e)) : e) ?? 'unknown error';
      console.error('[doclink] et_doc_insert FAILED →', sqlMsg, e);
      return { msg: -1, value: `Doc insert failed: ${sqlMsg}`, error: sqlMsg };
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

  /**
   * POST doclink/docdelete: the owner only (the shared rule, doclink-view-gate.ts), 403 / 500 BEFORE realtime.et_doc_delete
   * runs (Phase 8 of the shared-libraries plan; before it the SP's own owner test was the only check and a failure answered
   * msg 1). `user` is the token user; the body's nMasterid is the same id (RealtimeAuthInjectMiddleware).
   */
  async docDelete(body: docID, user?: RealtimeUser): Promise<any> {
    await assertCanDeleteDocLink(this.db, user?.userId ?? body?.nMasterid, body?.nDocid, (body as { nDMLids?: unknown })?.nDMLids);
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

  /**
   * GET doclink/docdetail: only the DocLinks in jDocids the caller owns or was shared (see
   * doclink-view-gate.ts). The SP runs with just those ids; when none is left the answer is the SP's
   * own empty result (three empty cursors), which both frontends already read as "no DocLinks".
   */
  async docDetail(query: docIDmulti): Promise<any> {
    const asked = parseDocIds(query?.jDocids);
    if (!asked) return { msg: -1, value: 'Fetch failed' };
    const visible = await viewableDocLinkIds(this.db, query?.nMasterid, asked);
    if (!visible) return { msg: -1, value: 'Fetch failed' };
    if (!visible.length) return [[], [], []];
    try {
      // public.et_doc_detail is the only variant (no realtime.et_doc_detail exists; the realtime-qualified call failed).
      const res = await this.db.executeRef(
        'doc_detail',
        { ...query, jDocids: JSON.stringify(visible), ref: 3 },
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

  /**
   * GET doclink/docshared: the share list of a DocLink the caller owns or was shared (see
   * doclink-view-gate.ts). Anyone else gets the SP's empty list, not a 403: the legacy Mark Nav share
   * panel reads `res || []` and the legacy interceptor sends 403s outside /realtime to the dashboard.
   */
  async getDocShared(query: docID): Promise<any> {
    const visible = await viewableDocLinkIds(this.db, query?.nMasterid, [query?.nDocid]);
    if (!visible) return { msg: -1, value: 'Fetch failed' };
    if (!visible.length) return [];
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
