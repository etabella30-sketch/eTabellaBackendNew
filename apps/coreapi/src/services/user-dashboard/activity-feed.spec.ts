import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { UserDashboardService } from './user-dashboard.service';
import { ACTIVITY_FEED, ACTIVITY_WINDOW_DAYS } from './activity-feed.query';

describe('Dashboard activity feed (GET user-dashboard/activity)', () => {
  const me = '00000000-0000-4000-8000-000000000002';
  let service: UserDashboardService;
  let rowQuery: jest.Mock;
  const row = (i: number) => ({ id: `case:0000000${i}-0000-4000-8000-000000000000`, occurredAt: new Date(Date.UTC(2026, 8, 20 - i)) });

  beforeEach(() => {
    service = Object.create(UserDashboardService.prototype);
    rowQuery = jest.fn().mockResolvedValue({ success: true, data: [] });
    Object.assign(service, { db: { rowQuery } });
  });

  it('runs one parameterised query for the token user, a page plus one row, no cursor, the 90-day window', async () => {
    const result = await service.getActivity({ nMasterid: me });
    expect(rowQuery).toHaveBeenCalledWith(ACTIVITY_FEED, [me, 31, null, null, ACTIVITY_WINDOW_DAYS]);
    expect(result).toEqual({ items: [], nextBefore: null, windowDays: 90 });
  });

  it('returns a cursor only when another page exists', async () => {
    rowQuery.mockResolvedValue({ success: true, data: [row(1), row(2), row(3)] });
    const page = await service.getActivity({ nMasterid: me, limit: 2 });
    expect(page.items).toHaveLength(2);
    expect(page.nextBefore).toEqual({ before: row(2).occurredAt.toISOString(), beforeId: row(2).id });
    rowQuery.mockResolvedValue({ success: true, data: [row(1)] });
    expect((await service.getActivity({ nMasterid: me, limit: 2 })).nextBefore).toBeNull();
  });

  it('passes the cursor through, normalised to ISO', async () => {
    await service.getActivity({ nMasterid: me, before: '2026-09-20T10:00:00+05:30', beforeId: 'docs:abc-1:-:-:1790000000' });
    expect(rowQuery.mock.calls[0][1]).toEqual([me, 31, '2026-09-20T04:30:00.000Z', 'docs:abc-1:-:-:1790000000', 90]);
  });

  it('clamps the page size', async () => {
    await service.getActivity({ nMasterid: me, limit: 500 });
    expect(rowQuery.mock.calls[0][1][1]).toBe(51);
    await service.getActivity({ nMasterid: me, limit: 0 });
    expect(rowQuery.mock.calls[1][1][1]).toBe(2);
  });

  it('rejects a missing user, a bad cursor, or a cursor id without its time', async () => {
    await expect(service.getActivity({})).rejects.toThrow(BadRequestException);
    await expect(service.getActivity({ nMasterid: me, before: 'yesterday' })).rejects.toThrow(BadRequestException);
    await expect(service.getActivity({ nMasterid: me, beforeId: 'case:x' })).rejects.toThrow(BadRequestException);
    await expect(service.getActivity({ nMasterid: me, before: '2026-09-20T00:00:00Z', beforeId: "x'; drop" })).rejects.toThrow(BadRequestException);
    expect(rowQuery).not.toHaveBeenCalled();
  });

  it('fails closed when the query fails', async () => {
    rowQuery.mockResolvedValue({ success: false, error: 'boom' });
    await expect(service.getActivity({ nMasterid: me })).rejects.toThrow(InternalServerErrorException);
  });

  it('scopes to the dashboard grid\'s cases and applies each record\'s own access rule', () => {
    // The same membership rule as et_dashboard: active team row, case not archived, no admin bypass.
    expect(ACTIVITY_FEED).toMatch(/"TeamRelation" t[\s\S]*t\."nUserid" = \$1::uuid AND t\."cStatus" = 'A' AND NOT coalesce\(c\."isArchived", false\)/);
    expect(ACTIVITY_FEED).not.toMatch(/isAdmin/);
    // Documents: the attention query's per-document filter.
    for (const rule of ['"BDPermission"', 'denied_folders', 'shared_folders', '"BDShare"', '"BDAssignment"', 's."nUserid" IS NULL OR s."nUserid" = $1::uuid']) {
      expect(ACTIVITY_FEED).toContain(rule);
    }
    // Regression (user 2026-09-24: "my activities, and other users' only if shared"): being
    // able to open a document is not enough to see someone else's upload in the feed — it
    // must be the caller's own, or shared with them (file, folder above it, or its section).
    // An assignment alone is not a share.
    const sharedOnly = ACTIVITY_FEED.slice(ACTIVITY_FEED.indexOf('...and the feed only reports it'), ACTIVITY_FEED.indexOf('), doc_batches AS ('));
    expect(sharedOnly).toContain('d."nCreateId" = $1::uuid');
    expect(sharedOnly).toContain('sh."nBundledetailid" = d."nBundledetailid"');
    expect(sharedOnly).toContain('shared_folders f WHERE f."nBundleid" = d."nBundleid"');
    expect(sharedOnly).toMatch(/sh\."nSectionid" = d\."nSectionid"\s+AND sh\."nBundleid" IS NULL AND sh\."nBundledetailid" IS NULL/);
    expect(sharedOnly).not.toContain('BDAssignment');
    expect(sharedOnly).not.toContain('s."nUserid" IS NULL');
    // Facts and their comments: the caller's own, or shared with them.
    expect(ACTIVITY_FEED).toMatch(/f\."nUserid" = \$1::uuid\s+OR EXISTS \(SELECT 1 FROM "FMShared" sh WHERE sh\."nFSid" = f\."nFSid" AND sh\."nUserid" = \$1::uuid\)/);
    expect(ACTIVITY_FEED).toContain('JOIN visible_facts f ON f."nFSid" = cm."nFSid"');
    // Deleted sessions and comments stay out; every source is windowed.
    expect(ACTIVITY_FEED).toContain('WHERE r."dDelDt" IS NULL');
    // Regression (2026-09-24): dev has no RSessionMaster."bDeleted" — "column r.bDeleted does not exist".
    // Only columns present on every database (sp-audit/schema-dump-output.txt) may be used.
    expect(ACTIVITY_FEED).not.toContain('bDeleted');
    expect(ACTIVITY_FEED).toContain('cm."dDelDt" IS NULL');
    expect(ACTIVITY_FEED.match(/>= \(SELECT ts FROM since\)/g)?.length).toBe(5);
  });

  it('returns what a click opens: the document, the transcript, or a bulk upload\'s hour', () => {
    for (const col of ['"bundleDetailId"', '"factId"', '"sessionId"', '"docTab"', '"docName"', '"docExhibit"', '"sessionName"', '"batchStart"']) {
      expect(ACTIVITY_FEED).toContain(`AS ${col}`);
    }
  });
});
