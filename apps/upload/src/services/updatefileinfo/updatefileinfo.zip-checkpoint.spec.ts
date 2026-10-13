import { UpdatefileinfoService } from './updatefileinfo.service';

const CASE = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const DOC = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const OWNER = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const SECTION = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const detail: any = { nJobid: 'job-id', nUDid: 'detail-id', nUPid: 'upload-id', nCaseid: CASE,
  nUserid: OWNER, nSectionid: SECTION, nBundleid: null, cPath: `doc/case${CASE}/file_1.zip`, identifier: 'zip-1' };
const entry = { nBundledetailid: DOC, nParentbundleid: null, cSavepath: `doc/case${CASE}/dc_1.docx` };
const row = { nBundledetailid: DOC, nCreateId: OWNER, nSectionid: SECTION, nBundleid: null,
  cPath: entry.cSavepath, cStatus: 'P', nCaseid: CASE };

describe('ZIP resource checkpoint transaction', () => {
  it('rolls back the first save when Redis fails, so a fresh job creates no duplicate committed resource', async () => {
    let pending: any[] = [];
    const committed: any[] = [];
    const order: string[] = [];
    const db: any = {
      executeRef: jest.fn(async () => {
        const saved = { ...entry, nBundledetailid: pending.length ? 'another-id' : DOC };
        pending.push(saved);
        order.push('save');
        return { success: true, data: [[saved]] };
      }),
      saveAtomically: jest.fn(async (work: any) => {
        pending = [];
        try {
          const result = await work();
          committed.push(...pending);
          order.push('commit');
          return result;
        } catch (error) {
          pending = [];
          order.push('rollback');
          throw error;
        }
      }),
    };
    const service = new UpdatefileinfoService(db);
    await expect(service.saveBundleWithCheckpoint(detail, [], async () => {
      order.push('checkpoint-failed');
      throw new Error('Redis unavailable');
    })).rejects.toThrow('Redis unavailable');
    expect(committed).toEqual([]);
    expect(order).toEqual(['save', 'checkpoint-failed', 'rollback']);
    const accepted: any[] = [];
    const result = await service.saveBundleWithCheckpoint({ ...detail }, [], async rows => {
      accepted.push(...rows);
      order.push('checkpoint');
    });
    expect(committed).toEqual([entry]);
    expect(accepted).toEqual(result);
    expect(order.slice(-3)).toEqual(['save', 'checkpoint', 'commit']);
  });

  it('requires an exact job/upload owner/case identity before accepting cached resources', async () => {
    const db = { rowQuery: jest.fn().mockResolvedValueOnce({ success: true, data: [] }) };
    await expect(new UpdatefileinfoService(db as any).validateZipExtraction(detail, [entry])).rejects.toThrow('upload identity');
    expect(db.rowQuery).toHaveBeenCalledTimes(1);
    expect(db.rowQuery.mock.calls[0][0]).toContain('um."nUserid"=j."nUserid"');
    expect(db.rowQuery.mock.calls[0][1]).toEqual([detail.nJobid, detail.nUDid, detail.nUPid, CASE, OWNER,
      SECTION, null, detail.cPath, detail.identifier]);
  });

  it('returns false only when none of a valid job snapshot resources committed', async () => {
    const db = { rowQuery: jest.fn().mockResolvedValueOnce({ success: true, data: [{ nJobid: detail.nJobid }] })
      .mockResolvedValueOnce({ success: true, data: [] }) };
    await expect(new UpdatefileinfoService(db as any).validateZipExtraction(detail, [entry])).resolves.toBe(false);
  });

  it('accepts an original resource updated to its own derived PDF path', async () => {
    const db = { rowQuery: jest.fn().mockResolvedValueOnce({ success: true, data: [{ nJobid: detail.nJobid }] })
      .mockResolvedValueOnce({ success: true, data: [{ ...row, cStatus: 'C', cPath: row.cPath.replace('.docx', '.pdf') }] }) };
    await expect(new UpdatefileinfoService(db as any).validateZipExtraction(detail, [entry])).resolves.toBe(true);
  });

  it.each([
    { ...row, nCreateId: 'foreign-owner' }, { ...row, nCaseid: 'foreign-case' },
    { ...row, nSectionid: 'foreign-section' }, { ...row, nBundleid: 'foreign-bundle' },
    { ...row, cPath: `doc/case${CASE}/dc_other.pdf` }, { ...row, cStatus: 'D' },
  ])('rejects foreign, changed, or deleted resource identity %#', async resource => {
    const db = { rowQuery: jest.fn().mockResolvedValueOnce({ success: true, data: [{ nJobid: detail.nJobid }] })
      .mockResolvedValueOnce({ success: true, data: [resource] }) };
    await expect(new UpdatefileinfoService(db as any).validateZipExtraction(detail, [entry])).rejects.toThrow('does not match');
  });

  it('rejects a partial snapshot instead of creating another resource set', async () => {
    const db = { rowQuery: jest.fn().mockResolvedValueOnce({ success: true, data: [{ nJobid: detail.nJobid }] })
      .mockResolvedValueOnce({ success: true, data: [row] }) };
    await expect(new UpdatefileinfoService(db as any).validateZipExtraction(detail,
      [entry, { ...entry, nBundledetailid: 'another-id' }])).rejects.toThrow('incomplete');
  });
});
