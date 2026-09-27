import { DbService } from '@app/global/db/pg/db.service';
import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { activityFeedReq, dashInfoReq, userCaseListReq } from '../../interfaces/user-dashboard.interface';
import { ACTIVITY_FEED, ACTIVITY_PAGE_DEFAULT, ACTIVITY_PAGE_MAX, ACTIVITY_WINDOW_DAYS } from './activity-feed.query';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CURSOR_ID = /^[a-z]+:[0-9A-Za-z:-]{1,150}$/;

@Injectable()
export class UserDashboardService {


    constructor(private db: DbService) {

    }


    async getCaseList(body: userCaseListReq): Promise<any> {
        // ref=4 → SP returns [casesPage, teams, users, totalCountRow]. The
        // 4th cursor is a single { nTotalCount } row that the frontend uses
        // to display the unpaginated total. See et_dashboard.sql.
        body.ref = 4;
        let res = await this.db.executeRef('dashboard', body);
        if (res.success) {
            return res.data;
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }


    /**
     * The dashboard's Activity feed: recent events across the caller's cases, newest first,
     * one page at a time (see activity-feed.query.ts for what counts and who may see it).
     * The caller is always the token's user; a page asks for one row more than it returns
     * to know whether another page exists.
     */
    async getActivity(query: activityFeedReq): Promise<{ items: any[]; nextBefore: { before: string; beforeId: string } | null; windowDays: number }> {
        if (!UUID.test(query.nMasterid || '')) throw new BadRequestException('Invalid user');
        const requested = Number(query.limit ?? ACTIVITY_PAGE_DEFAULT);
        const limit = Number.isInteger(requested) ? Math.min(ACTIVITY_PAGE_MAX, Math.max(1, requested)) : ACTIVITY_PAGE_DEFAULT;
        let before: string | null = null;
        if (query.before !== undefined && query.before !== null && query.before !== '') {
            const at = Date.parse(query.before);
            if (!Number.isFinite(at)) throw new BadRequestException('Invalid cursor');
            before = new Date(at).toISOString();
        }
        const beforeId = query.beforeId ? query.beforeId : null;
        if (beforeId && (!before || !CURSOR_ID.test(beforeId))) throw new BadRequestException('Invalid cursor');

        const result = await this.db.rowQuery(ACTIVITY_FEED, [query.nMasterid, limit + 1, before, beforeId, ACTIVITY_WINDOW_DAYS]);
        if (!result.success) throw new InternalServerErrorException('Unable to load activity');
        const rows: any[] = result.data ?? [];
        const items = rows.slice(0, limit);
        const last = items[items.length - 1];
        const nextBefore = rows.length > limit && last
            ? { before: new Date(last.occurredAt).toISOString(), beforeId: String(last.id) }
            : null;
        return { items, nextBefore, windowDays: ACTIVITY_WINDOW_DAYS };
    }


    async getDashInfo(query: dashInfoReq): Promise<any> {
        query.ref = 3;
        let res = await this.db.executeRef('dashboard_info', query);
        if (res.success) {
            return res.data;
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }


}
