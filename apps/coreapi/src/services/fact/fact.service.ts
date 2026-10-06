import { DbService } from '@app/global/db/pg/db.service';
import { Injectable, HttpException, HttpStatus, InternalServerErrorException } from '@nestjs/common';
import { addhighlight, factConvertMDL, factDetail, factDetailSingle, factNoteUpdateReq, factUpdate, highlightDelete, InsertFact, InsertFactV2, InsertQuickFact, InsertQuickFactV2, quickfactUpdate, resInsertData, resInsertFact } from '../../interfaces/fact.interface';
import { UtilityService } from '../utility/utility.service';
import { notificationReq } from '../../interfaces/notification.interface';
import { FactFgaService } from '../fact-fga/fact-fga.service';
import { assertCanCreateFact, assertCanEditFact, factReadAccess, viewableFactIds } from './fact-access';
import { isDomainError, type Caller } from '@app/api-kernel';
import { assertSameTeamRecipients, factCaseOf } from '@app/permissions';
import { PgRowQuery } from '@app/platform-cloud';
import { normalizeShareRecipients, shareListJson, shareRecipientIds } from '@app/rt-features/factsheet';

/** The refusal row of a share whose recipients are not all on the caller's teams (the Full Fact editor shows `error`). */
const CROSS_TEAM_SHARE = Object.freeze({ msg: -1, value: 'Share recipients must be on your team', error: 'cross_team_recipient' });
/** The actor of a fact write: the stamped Caller when the route passed one, else the token user JwtMiddleware wrote into nMasterid. */
const actorOf = (caller: Caller | null | undefined, body: { nMasterid?: string }) => caller ?? (body?.nMasterid ? { userId: body.nMasterid, isPlatformAdmin: false } : null);

/**
 * The normal empty body of a list read, for a caller who may not view the fact: one cursor's rows
 * (`res.data[0]`) or `cursors` empty cursors (`res.data`). Not a 403, so neither frontend's
 * interceptor navigates away from the page that asked.
 */
const emptyRows = (cursors = 1): any => (cursors === 1 ? [] : Array.from({ length: cursors }, () => []));

/** A read's existing failure body, used when the permission lookup itself failed. */
const fetchFailed = (): resInsertData => ({ msg: -1, value: 'Fetch failed' });

@Injectable()
export class FactService {
    constructor(private db: DbService,
        private utility: UtilityService
        // , private factFgaService: FactFgaService
    ) { }

    async insertFact(body: InsertFact, caller?: Caller | null): Promise<resInsertFact> {
        // Outside the try: a refusal is a 403, not a { msg: -1 } body. The case is the one named, else nBDid's (the shared rule
        // derives it, as public.et_fact_insert did); realtime.et_fact_insert (7b, D8) stores the resolved case.
        const target = await assertCanCreateFact(this.db, actorOf(caller, body), body);
        body['nCaseid'] = target.nCaseid;
        const refusal = await this.refuseCrossTeamShare(target.nCaseid, actorOf(caller, body)?.userId, body['jUsers']);
        if (refusal) return refusal as any;
        try {
            const res = await this.db.executeRef('fact_insert', body, 'realtime');
            if (res.success) {
                return res.data[0][0];
            } else {
                return { msg: -1, value: 'Failed ', error: res.error }
            }
        } catch (error) {
            return { msg: -1, value: 'Failed ', error: error }
        }
    }

    async insertFactDetail(body: any): Promise<any> {
        try {
            const res = await this.db.executeRef('fact_insert_detail', body);
            if (res.success) {
                return res.data[0];
            } else {
                return { msg: -1, value: 'Fact detail insert failed ', error: res.error }
            }
        } catch (error) {
            return { msg: -1, value: 'Fact detail insert failed ', error: error }
        }
    }

    async insertFactlink(body: any): Promise<any> {
        try {
            const res = await this.db.executeRef('fact_insert_links', body);
            if (res.success) {
                return true;
            } else {
                return { msg: -1, value: 'Fact link insert failed ', error: res.error }
            }
        } catch (error) {
            return { msg: -1, value: 'Fact link insert failed ', error: error }
        }
    }

    async insertFactissues(body: any): Promise<any> {
        try {
            const res = await this.db.executeRef('fact_insert_issues', body);
            if (res.success) {
                return true;
            } else {
                return { msg: -1, value: 'Fact issues insert failed ', error: res.error }
            }
        } catch (error) {
            return { msg: -1, value: 'Fact issues insert failed ', error: error }
        }
    }

    async insertFactcontact(body: any): Promise<any> {
        try {
            const res = await this.db.executeRef('fact_insert_contact', body);
            if (res.success) {
                return true;
            } else {
                return { msg: -1, value: 'Fact contact insert failed ', error: res.error }
            }
        } catch (error) {
            return { msg: -1, value: 'Fact contact insert failed ', error: error }
        }
    }

    async insertFacttask(body: any): Promise<any> {
        try {
            const res = await this.db.executeRef('fact_insert_task', body);
            if (res.success) {
                return true;
            } else {
                return { msg: -1, value: 'Fact task insert failed ', error: res.error }
            }
        } catch (error) {
            return { msg: -1, value: 'Fact task insert failed ', error: error }
        }
    }

    async insertFactteam(body: any): Promise<any> {
        // 7b item 4: one share-list shape and schema for the v1 route too (realtime.et_fact_insert_team).
        return this.insertFactteamV2(body);
    }

    /**
     * The refusal row when a share list names someone outside the caller's teams on the case (the shared team rule,
     * checked BEFORE any write), the failure row on a lookup fault, null to proceed. Bare ids and objects alike.
     */
    private async refuseCrossTeamShare(nCaseid: string | null | undefined, callerId: string | undefined, jUsers: unknown): Promise<any | null> {
        const recipients = callerId ? shareRecipientIds(normalizeShareRecipients(jUsers), callerId) : [];
        if (!recipients.length) return null;
        try {
            await assertSameTeamRecipients(new PgRowQuery(this.db), nCaseid ?? '', callerId, recipients);
            return null;
        } catch (error) {
            if (isDomainError(error) && error.code === 'forbidden') return { ...CROSS_TEAM_SHARE };
            return { msg: -1, value: 'Fact team insert failed ', error: 'team_scope_lookup_failed' };
        }
    }

    /** @deprecated the public-schema share write; kept until the legacy :4200 audit, unused by any route. */
    private async insertFactteamPublic(body: any): Promise<any> {
        try {
            const res = await this.db.executeRef('fact_insert_team', body);
            if (res.success) {
                try {
                    const notificationlist = res.data[0][0]["jNotify"] || []
                    if (notificationlist.length) {
                        this.utility.sendNotification(notificationlist, body.nMasterid);
                    }
                } catch (error) {
                }

                return true;
            } else {
                return { msg: -1, value: 'Fact team insert failed ', error: res.error }
            }
        } catch (error) {
            return { msg: -1, value: 'Fact team insert failed ', error: error }
        }
    }

    async getFactdetail(query: factDetail): Promise<resInsertData> {
        // et_fact_get_detail reads every id in jFSids with no viewer filter: keep only the facts
        // the caller may view (et_fact_permissions bCanView).
        const visible = await viewableFactIds(this.db, query.nMasterid, query.jFSids);
        if (!visible) return fetchFailed();
        if (!visible.length) return emptyRows();
        query.jFSids = JSON.stringify(visible);
        try {
            const res = await this.db.executeRef('fact_get_detail', query);
            if (res.success) {
                return res.data[0];
            } else {
                return { msg: -1, value: 'Fetch failed', error: res.error }
            }
        } catch (error) {
            return { msg: -1, value: 'Fetch failed', error: error }
        }
    }

    async getFactIssue(query: factDetailSingle): Promise<resInsertData> {
        try {
            const res = await this.db.executeRef('fact_get_issue', query);
            if (res.success) {
                return res.data[0];
            } else {
                return { msg: -1, value: 'Fetch failed', error: res.error }
            }
        } catch (error) {
            return { msg: -1, value: 'Fetch failed', error: error }
        }
    }

    async getFactlinks(query: factDetailSingle): Promise<resInsertData> {
        const access = await factReadAccess(this.db, query.nMasterid, query.nFSid);
        if (access === 'failed') return fetchFailed();
        if (access === 'hidden') return emptyRows();
        try {
            const res = await this.db.executeRef('fact_get_links', query);
            if (res.success) {
                return res.data[0];
            } else {
                return { msg: -1, value: 'Fetch failed', error: res.error }
            }
        } catch (error) {
            return { msg: -1, value: 'Fetch failed', error: error }
        }
    }

    async getFactcontact(query: factDetailSingle): Promise<resInsertData> {
        const access = await factReadAccess(this.db, query.nMasterid, query.nFSid);
        if (access === 'failed') return fetchFailed();
        if (access === 'hidden') return emptyRows();
        try {
            const res = await this.db.executeRef('fact_get_contact', query, 'realtime'); // 7b item 1: + mention tag, role, party, company, occupation (cEmail kept)
            if (res.success) {
                return res.data[0];
            } else {
                return { msg: -1, value: 'Fetch failed', error: res.error }
            }
        } catch (error) {
            return { msg: -1, value: 'Fetch failed', error: error }
        }
    }

    async getFactshared(query: factDetailSingle): Promise<resInsertData> {
        const access = await factReadAccess(this.db, query.nMasterid, query.nFSid);
        if (access === 'failed') return fetchFailed();
        if (access === 'hidden') return emptyRows();
        try {
            // let permission = await this.factFgaService.getFactUserPermissions(query.nFSid);
            // if (permission.length) {
            //     query['jUserIds'] = permission.filter(e => e.userId != '*').map(e => e.userId);
            // }
            const res = await this.db.executeRef('fact_get_shared', query, 'realtime'); // 7b item 2: + bCanComment / bCanEdit / bCanReshare
            if (res.success) {
                return res.data[0];
            } else {
                return { msg: -1, value: 'Fetch failed', error: res.error }
            }
        } catch (error) {
            return { msg: -1, value: 'Fetch failed', error: error }
        }
    }


    async getFacttask(query: factDetailSingle): Promise<resInsertData> {
        const access = await factReadAccess(this.db, query.nMasterid, query.nFSid);
        if (access === 'failed') return fetchFailed();
        if (access === 'hidden') return emptyRows(3); // [tasks, assignees, reminders]
        try {
            query["ref"] = 3;
            const res = await this.db.executeRef('fact_get_task', query);
            if (res.success) {
                return res.data;
            } else {
                return { msg: -1, value: 'Fetch failed', error: res.error };
            }
        } catch (error) {
            return { msg: -1, value: 'Fetch failed', error: error }
        }
    }


    async getFactIssuelinks(query: factDetail): Promise<resInsertData> {
        // Same filter as getFactdetail: et_fact_get_issue_links reads every id in jFSids.
        const visible = await viewableFactIds(this.db, query.nMasterid, query.jFSids);
        if (!visible) return fetchFailed();
        if (!visible.length) return emptyRows(2); // [issues, links]
        query.jFSids = JSON.stringify(visible);
        try {
            query["ref"] = 2;
            const res = await this.db.executeRef('fact_get_issue_links', query);
            if (res.success) {
                return res.data;
            } else {
                return { msg: -1, value: 'Fetch failed', error: res.error }
            }
        } catch (error) {
            return { msg: -1, value: 'Fetch failed', error: error }
        }
    }

    async FactDelete(body: factDetailSingle): Promise<resInsertData> {
        try {
            const res = await this.db.executeRef('fact_delete', body);
            if (res.success) {
                return res.data[0];
            } else {
                return { msg: -1, value: 'Delete failed', error: res.error }
            }
        } catch (error) {
            return { msg: -1, value: 'Delete failed', error: error }
        }
    }


    async factUpdate(body: factUpdate): Promise<resInsertData> {
        // et_fact_update rewrites any fact by nFSid alone: bCanEdit first.
        const permission = await assertCanEditFact(this.db, body.nMasterid, body.nFSid);
        if (!permission.bCanReshare) {
            // It also replaces FMShared with jU. Only a caller with bCanReshare may change who the
            // fact is shared with (the rule factsheet/submit applies), so keep the current list.
            body.jU = JSON.stringify(await this.sharedUserIds(body.nFSid));
        }
        try {
            const res = await this.db.executeRef('fact_update', body);
            if (res.success) {
                try {
                    const notificationlist = res.data[0][0]["jNotify"] || []
                    if (notificationlist.length) {
                        this.utility.sendNotification(notificationlist, body.nMasterid);
                    }
                } catch (error) { }
                return res.data[0];
            } else {
                return { msg: -1, value: 'Delete failed', error: res.error }
            }
        } catch (error) {
            return { msg: -1, value: 'Delete failed', error: error }
        }
    }


    /** Users the fact is shared with now (FMShared), for an update that must not change them. */
    private async sharedUserIds(nFSid: string): Promise<string[]> {
        let res: any;
        try {
            res = await this.db.executeRef('fact_get_shared', { nFSid });
        } catch (error) {
            res = { success: false, error };
        }
        if (!res?.success) {
            throw new InternalServerErrorException({ msg: -1, value: 'Could not read who this fact is shared with' });
        }
        return (res.data?.[0] ?? []).map((row: any) => row?.nUserid).filter(Boolean);
    }

    async quickfactUpdate(body: quickfactUpdate): Promise<resInsertData> {
        // et_fact_quick_update overwrites jTexts, contacts and issues by nFSid alone.
        await assertCanEditFact(this.db, body.nMasterid, body.nFSid);
        try {
            const res = await this.db.executeRef('fact_quick_update', body, 'realtime');
            if (res.success) {
                return res.data[0];
            } else {
                return { msg: -1, value: 'Delete failed', error: res.error }
            }
        } catch (error) {
            return { msg: -1, value: 'Delete failed', error: error }
        }
    }


    async insertQuickFact(body: InsertQuickFact, caller?: Caller | null): Promise<any> {
        const target = await assertCanCreateFact(this.db, actorOf(caller, body), body);
        body['nCaseid'] = target.nCaseid;
        try {
            const res = await this.db.executeRef('fact_insert', body, 'realtime');
            if (res.success) {
                return res.data[0][0];
            } else {
                return { msg: -1, value: 'Fact insert  failed', error: res.error }
            }
        } catch (error) {
            return { msg: -1, value: 'Fact insert  failed', error: error }
        }
    }

    async deletehighlight(body: highlightDelete): Promise<any> {
        await assertCanEditFact(this.db, body.nMasterid, body.nFSid);
        try {
            const res = await this.db.executeRef('fact_highlight_delete_by_uuid', body, 'realtime');
            if (res.success) {
                return res.data[0];
            } else {
                return { msg: -1, value: 'highlight delet failed', error: res.error }
            }
        } catch (error) {
            return { msg: -1, value: 'highlight delet failed', error: error }
        }
    }


    async addhighlight(body: addhighlight): Promise<any> {
        await assertCanEditFact(this.db, body.nMasterid, body.nFSid);
        try {
            const res = await this.db.executeRef('fact_highlight_add', body, 'realtime');
            if (res.success) {
                return res.data[0];
            } else {
                return { msg: -1, value: 'highlight add failed', error: res.error }
            }
        } catch (error) {
            return { msg: -1, value: 'highlight add failed', error: error }
        }
    }

    async convertFact(body: factConvertMDL): Promise<any> {
        await assertCanEditFact(this.db, body.nMasterid, body.nFSid);
        try {
            const res = await this.db.executeRef('fact_convert', body, 'realtime');
            if (res.success) {
                return res.data[0];
            } else {
                return { msg: -1, value: 'fact convert failed', error: res.error }
            }
        } catch (error) {
            return { msg: -1, value: 'fact convert failed', error: error }
        }
    }

    async updateFactNote(body: factNoteUpdateReq): Promise<any> {
        // et_individual_update_facts_note overwrites jTexts by nFSid alone.
        await assertCanEditFact(this.db, body.nMasterid, body.nFSid);
        try {
            const res = await this.db.executeRef('individual_update_facts_note', body, 'realtime');
            if (res.success) {
                return res.data[0];
            } else {
                return { msg: -1, value: 'fact note update failed', error: res.error }
            }
        } catch (error) {
            return { msg: -1, value: 'fact note update failed', error: error }
        }
    }

    async insertQuickFactV2(body: InsertQuickFactV2, caller?: Caller | null): Promise<any> {
        // realtime.et_fact_insert stores the client's nCaseid as given, so check it and that nBDid is in it.
        await assertCanCreateFact(this.db, actorOf(caller, body), body);
        try {
            const res = await this.db.executeRef('fact_insert', body, 'realtime');
            if (res.success) {
                return res.data[0][0];
            } else {
                return { msg: -1, value: 'Fact insert  failed', error: res.error }
            }
        } catch (error) {
            return { msg: -1, value: 'Fact insert  failed', error: error }
        }
    }

    async insertFactDetailV2(body: any): Promise<any> {
        try {
            const res = await this.db.executeRef('fact_insert_detail', body, 'realtime');
            if (res.success) {
                return res.data[0];
            } else {
                return { msg: -1, value: 'Fact detail insert failed ', error: res.error }
            }
        } catch (error) {
            return { msg: -1, value: 'Fact detail insert failed ', error: error }
        }
    }

    async insertFactissuesV2(body: any): Promise<any> {
        try {
            const res = await this.db.executeRef('fact_insert_issues', body, 'realtime');
            if (res.success) {
                return true;
            } else {
                return { msg: -1, value: 'Fact issues insert failed ', error: res.error }
            }
        } catch (error) {
            return { msg: -1, value: 'Fact issues insert failed ', error: error }
        }
    }

    async insertFactcontactV2(body: any): Promise<any> {
        try {
            const res = await this.db.executeRef('fact_insert_contact', body, 'realtime');
            if (res.success) {
                return true;
            } else {
                return { msg: -1, value: 'Fact contact insert failed ', error: res.error }
            }
        } catch (error) {
            return { msg: -1, value: 'Fact contact insert failed ', error: error }
        }
    }


    async insertFactV2(body: InsertFactV2, caller?: Caller | null): Promise<resInsertFact> {
        await assertCanCreateFact(this.db, actorOf(caller, body), body);
        const refusal = await this.refuseCrossTeamShare(body.nCaseid, actorOf(caller, body)?.userId, body.jUsers);
        if (refusal) return refusal as any;
        try {
            const res = await this.db.executeRef('fact_insert', body, 'realtime');
            if (res.success) {
                return res.data[0][0];
            } else {
                return { msg: -1, value: 'Failed ', error: res.error }
            }
        } catch (error) {
            return { msg: -1, value: 'Failed ', error: error }
        }
    }

    async insertFactlinkV2(body: any): Promise<any> {
        try {
            const res = await this.db.executeRef('fact_insert_links', body, 'realtime');
            if (res.success) {
                return true;
            } else {
                return { msg: -1, value: 'Fact link insert failed ', error: res.error }
            }
        } catch (error) {
            return { msg: -1, value: 'Fact link insert failed ', error: error }
        }
    }
    async insertFacttaskV2(body: any): Promise<any> {
        try {
            const res = await this.db.executeRef('fact_insert_task', body, 'realtime');
            if (res.success) {
                return true;
            } else {
                return { msg: -1, value: 'Fact task insert failed ', error: res.error }
            }
        } catch (error) {
            return { msg: -1, value: 'Fact task insert failed ', error: error }
        }
    }

    async insertFactteamV2(body: any): Promise<any> {
        // One share-list shape for realtime.et_fact_insert_team (7b item 4): bare ids become view-only rows.
        const list = normalizeShareRecipients(body?.jUsers);
        const nCaseid = body?.nCaseid || await factCaseOf(new PgRowQuery(this.db), body?.nFSid).catch(() => null);
        const refusal = await this.refuseCrossTeamShare(nCaseid, body?.nMasterid, list);
        if (refusal) return refusal;
        try {
            const res = await this.db.executeRef('fact_insert_team', { ...body, jUsers: shareListJson(list) }, 'realtime');
            if (res.success) {
                try {
                    const notificationlist = res.data[0][0]["jNotify"] || []
                    if (notificationlist.length) {
                        this.utility.sendNotification(notificationlist, body.nMasterid);
                    }
                } catch (error) {
                }

                return true;
            } else {
                return { msg: -1, value: 'Fact team insert failed ', error: res.error }
            }
        } catch (error) {
            return { msg: -1, value: 'Fact team insert failed ', error: error }
        }
    }

}
