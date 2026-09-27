import { IndividualService } from './individual.service';

describe('IndividualService document sharing', () => {
  const DOC_ID = '11111111-1111-1111-1111-111111111111';
  const OWNER_ID = '22222222-2222-2222-2222-222222222222';
  const RECIPIENT_ID = '33333333-3333-3333-3333-333333333333';

  function createService() {
    const db = {
      executeRef: jest.fn(),
      rowQuery: jest.fn(),
    };
    const utility = {
      sendNotification: jest.fn(),
    };
    const service = new IndividualService(db as never, utility as never);
    return { service, db, utility };
  }

  it('mirrors Quick View recipients into BDShare so Team Folders can read them', async () => {
    const { service, db, utility } = createService();
    const notifications = [{ nUserid: RECIPIENT_ID, cType: 'LS' }];
    db.executeRef.mockResolvedValue({
      success: true,
      data: [[{ msg: 1, value: 'Shared', jNotify: notifications }]],
    });
    db.rowQuery
      .mockResolvedValueOnce({ success: true, data: [{ bAllowed: true }] })
      .mockResolvedValueOnce({
        success: true,
        data: [{ targetCount: 1, insertedShares: 1, removedShares: 0 }],
      });

    const result = await service.locationshareSharetousers({
      nBundledetailid: DOC_ID,
      nMasterid: OWNER_ID,
      jUsers: JSON.stringify([RECIPIENT_ID]),
    });

    expect(result.msg).toBe(1);
    // share guard, then the BDShare mirror
    expect(db.rowQuery).toHaveBeenCalledTimes(2);
    const [sql, params] = db.rowQuery.mock.calls[1];
    expect(sql).toContain('INSERT INTO "BDShare"');
    expect(sql).toContain('DELETE FROM "BDShare"');
    expect(params).toEqual([DOC_ID, OWNER_ID, [RECIPIENT_ID]]);
    expect(utility.sendNotification).toHaveBeenCalledWith(notifications, OWNER_ID);
  });

  it('does not claim success or notify when the Team Folder mirror fails', async () => {
    const { service, db, utility } = createService();
    db.executeRef.mockResolvedValue({
      success: true,
      data: [[{ msg: 1, value: 'Shared', jNotify: [{ nUserid: RECIPIENT_ID }] }]],
    });
    db.rowQuery
      .mockResolvedValueOnce({ success: true, data: [{ bAllowed: true }] })
      .mockResolvedValueOnce({ success: false, error: 'database unavailable' });

    const result = await service.locationshareSharetousers({
      nBundledetailid: DOC_ID,
      nMasterid: OWNER_ID,
      jUsers: JSON.stringify([RECIPIENT_ID]),
    });

    expect(result).toMatchObject({ msg: -1, error: 'database unavailable' });
    expect(utility.sendNotification).not.toHaveBeenCalled();
  });

  it('loads current Reader recipients from BDShare, the Team Folder source of truth', async () => {
    const { service, db } = createService();
    db.rowQuery.mockResolvedValue({ success: true, data: [{ nUserid: RECIPIENT_ID }] });

    const result = await service.getSharesUsers({
      nBundledetailid: DOC_ID,
      nMasterid: OWNER_ID,
    });

    expect(result).toEqual([{ nUserid: RECIPIENT_ID }]);
    expect(db.executeRef).not.toHaveBeenCalled();
    const [sql, params] = db.rowQuery.mock.calls[0];
    expect(sql).toContain('FROM "BDShare"');
    expect(params).toEqual([DOC_ID, OWNER_ID]);
  });

  it('rejects malformed recipient JSON before changing either share store', async () => {
    const { service, db } = createService();

    const result = await service.locationshareSharetousers({
      nBundledetailid: DOC_ID,
      nMasterid: OWNER_ID,
      jUsers: 'not-json',
    });

    expect(result).toMatchObject({ msg: -1, error: 'Invalid document share recipients' });
    expect(db.executeRef).not.toHaveBeenCalled();
    expect(db.rowQuery).not.toHaveBeenCalled();
  });

  describe('share guard (mirrors et_share_sectionbundle, 2026-09-23 sec)', () => {
    it('checks global admin or membership of the document case before either share store is written', async () => {
      const { service, db } = createService();
      db.rowQuery.mockResolvedValueOnce({ success: true, data: [{ bAllowed: true }] })
        .mockResolvedValueOnce({ success: true, data: [{ targetCount: 1 }] });
      db.executeRef.mockResolvedValue({ success: true, data: [[{ msg: 1, jNotify: [] }]] });

      await service.locationshareSharetousers({
        nBundledetailid: DOC_ID,
        nMasterid: OWNER_ID,
        jUsers: JSON.stringify([RECIPIENT_ID]),
      });

      const [guardSql, guardParams] = db.rowQuery.mock.calls[0];
      expect(guardSql).not.toMatch(/INSERT|DELETE/);
      expect(guardSql).toContain('su."isAdmin" = true');
      expect(guardSql).toContain('JOIN "TeamRelation" tr ON tr."nCaseid" = sds."nCaseid"');
      expect(guardSql).toContain('tr."nUserid" = $2::uuid');
      expect(guardParams).toEqual([DOC_ID, OWNER_ID]);
      expect(db.rowQuery.mock.invocationCallOrder[0]).toBeLessThan(db.executeRef.mock.invocationCallOrder[0]);
    });

    it('refuses a caller outside the document case and writes neither LocationShare nor BDShare', async () => {
      const { service, db, utility } = createService();
      db.rowQuery.mockResolvedValueOnce({ success: true, data: [{ bAllowed: false }] });

      const result = await service.locationshareSharetousers({
        nBundledetailid: DOC_ID,
        nMasterid: OWNER_ID,
        jUsers: JSON.stringify([OWNER_ID]),
      });

      expect(result).toEqual({ msg: -1, value: 'Failed ', error: 'You are not authorized to share this document' });
      expect(db.executeRef).not.toHaveBeenCalled();
      expect(db.rowQuery).toHaveBeenCalledTimes(1);
      expect(utility.sendNotification).not.toHaveBeenCalled();
    });

    it('fails closed when the guard query errors', async () => {
      const { service, db } = createService();
      db.rowQuery.mockResolvedValueOnce({ success: false, error: 'boom' });

      const result = await service.locationshareSharetousers({
        nBundledetailid: DOC_ID,
        nMasterid: OWNER_ID,
        jUsers: JSON.stringify([RECIPIENT_ID]),
      });

      expect(result).toEqual({ msg: -1, value: 'Failed ', error: 'boom' });
      expect(db.executeRef).not.toHaveBeenCalled();
      expect(db.rowQuery).toHaveBeenCalledTimes(1);
    });
  });
});
