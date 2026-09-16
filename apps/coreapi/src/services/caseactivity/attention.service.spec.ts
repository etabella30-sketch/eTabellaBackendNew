import { BadRequestException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { CaseactivityService } from './caseactivity.service';
import { ATTENTION_ACCESS, ATTENTION_LIST, ATTENTION_SUMMARY } from './attention-documents.query';

describe('Case attention endpoints', () => {
  const identity = { nCaseid: '00000000-0000-4000-8000-000000000001', nMasterid: '00000000-0000-4000-8000-000000000002' };
  let service: CaseactivityService;
  let rowQuery: jest.Mock;
  beforeEach(() => {
    // These endpoints use only DbService, avoiding unrelated S3/excel setup.
    service = Object.create(CaseactivityService.prototype);
    rowQuery = jest.fn().mockResolvedValue({ success: true, data: [{ allowed: true }] });
    Object.assign(service, { db: { rowQuery } });
  });
  it('requires case access before querying document activity', async () => {
    rowQuery.mockResolvedValue({ success: true, data: [{ allowed: false }] });
    await expect(service.attentionSummary({ ...identity, day: '2026-09-15', timeZone: 'UTC' })).rejects.toThrow(ForbiddenException);
    expect(rowQuery).toHaveBeenCalledTimes(1);
    expect(rowQuery).toHaveBeenCalledWith(ATTENTION_ACCESS, [identity.nCaseid, identity.nMasterid]);
  });
  it('fails closed when the permission query fails', async () => {
    rowQuery.mockResolvedValue({ success: false });
    await expect(service.attentionSummary(identity)).rejects.toThrow(InternalServerErrorException);
  });
  it.each([
    ['2026-03-08', '2026-03-08T05:00:00.000Z', '2026-03-09T04:00:00.000Z'],
    ['2026-11-01', '2026-11-01T04:00:00.000Z', '2026-11-02T05:00:00.000Z'],
  ])('resolves local midnight across DST for %s', async (day, from, to) => {
    rowQuery.mockResolvedValueOnce({ success: true, data: [{ allowed: true }] })
      .mockResolvedValueOnce({ success: true, data: [{ documentsAddedToday: 2, documentsUpdatedYesterday: 1 }] });
    const result = await service.attentionSummary({ ...identity, day, timeZone: 'America/New_York' });
    expect(result).toMatchObject({ addedFrom: from, addedTo: to, updatedTo: from });
    expect(rowQuery.mock.calls[1][0]).toBe(ATTENTION_SUMMARY);
    expect(rowQuery.mock.calls[1][1].slice(0, 2)).toEqual([identity.nCaseid, identity.nMasterid]);
  });
  it('rejects invalid calendar dates and timezones', async () => {
    for (const params of [{ day: '2026-02-30', timeZone: 'UTC' }, { day: '2026-09-15', timeZone: 'invalid' }]) {
      await expect(service.attentionSummary({ ...identity, ...params })).rejects.toThrow(BadRequestException);
    }
  });
  const filter = { kind: 'updated', from: '2026-09-14T00:00:00Z', to: '2026-09-15T00:00:00Z', asOf: '2026-09-15T00:00:00Z' };
  it('uses parameterized snapshot filters and a bounded page size', async () => {
    rowQuery.mockResolvedValueOnce({ success: true, data: [{ allowed: true }] })
      .mockResolvedValueOnce({ success: true, data: [{ total: 51, rows: [] }] });
    const result = await service.attentionDocuments({ ...identity, ...filter, page: '2' });
    expect(result).toEqual({ total: 51, rows: [], page: 2, pageSize: 50 });
    expect(rowQuery).toHaveBeenLastCalledWith(ATTENTION_LIST, [...Object.values(identity), filter.from, filter.to, filter.asOf, 'updated', 50]);
  });
  it('rejects reversed intervals, missing offsets and invalid pages', async () => {
    for (const patch of [{ page: '-1' }, { from: filter.to }, { from: '2026-09-14' }, { kind: 'all' }, { page: '1.5' }]) {
      await expect(service.attentionDocuments({ ...identity, ...filter, ...patch })).rejects.toThrow(BadRequestException);
    }
  });
});
