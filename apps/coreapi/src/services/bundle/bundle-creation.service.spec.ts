import { BundleCreationService } from './bundle-creation.service';
import { getbundleSharedReq, shareSectionbundleReq } from '../../interfaces/bundle.interface';

describe('BundleCreationService', () => {
  const okCursor = { success: true, data: [[{ msg: 1, value: 'Shared successfully' }]] };

  function createService() {
    const db = {
      executeRef: jest.fn().mockResolvedValue(okCursor),
      rowQuery: jest.fn().mockResolvedValue({ success: true, data: [] }),
    };
    const utility = { emit: jest.fn() };
    const service = new BundleCreationService(
      db as any,
      {} as any,
      {} as any,
      {} as any,
      utility as any,
    );
    return { service, db, utility };
  }

  it('is defined', () => {
    expect(createService().service).toBeDefined();
  });

  it('expands bulk UUID share ids into single stored-procedure calls', async () => {
    const { service, db } = createService();
    const body: shareSectionbundleReq = {
      nSectionid: '11111111-1111-1111-1111-111111111111',
      nBundleid: '0',
      nBundledetailid: '0',
      jUsers: ['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'],
      jShareids: [
        ['22222222-2222-2222-2222-222222222222', null],
        ['44444444-4444-4444-4444-444444444444', null],
      ],
      bIsannotation: true,
      bIsalert: true,
      nMasterid: '66666666-6666-6666-6666-666666666666',
    };

    await service.share_sectionbundle(body);

    expect(db.executeRef).toHaveBeenCalledTimes(2);
    expect(db.executeRef).toHaveBeenNthCalledWith(1, 'share_sectionbundle', expect.objectContaining({
      nBundleid: '22222222-2222-2222-2222-222222222222',
      nBundledetailid: null,
      jShareids: [],
      bIsalert: true,
    }));
    expect(db.executeRef).toHaveBeenNthCalledWith(2, 'share_sectionbundle', expect.objectContaining({
      nBundleid: '44444444-4444-4444-4444-444444444444',
      nBundledetailid: null,
      jShareids: [],
      bIsalert: false,
    }));
    expect(db.rowQuery).toHaveBeenCalledTimes(2);
  });

  it('shares a single document directly so duplicate annotation shares do not fail the request', async () => {
    const { service, db } = createService();
    db.rowQuery.mockResolvedValueOnce({ success: true, data: [{ bAllowed: true }] });
    const body: shareSectionbundleReq = {
      nSectionid: '11111111-1111-1111-1111-111111111111',
      nBundleid: '22222222-2222-2222-2222-222222222222',
      nBundledetailid: '33333333-3333-3333-3333-333333333333',
      jUsers: ['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'],
      jShareids: [],
      bIsannotation: true,
      bIsalert: true,
      nMasterid: '66666666-6666-6666-6666-666666666666',
    };

    await service.share_sectionbundle(body);

    expect(db.executeRef).not.toHaveBeenCalled();
    // guard, share, recipient reconcile
    expect(db.rowQuery).toHaveBeenCalledTimes(3);
    const [sql, params] = db.rowQuery.mock.calls[1];
    expect(sql).toContain('INSERT INTO "BDShare"');
    expect(sql).toContain('ON CONFLICT ("nFSid", "nUserid") DO NOTHING');
    expect(sql).toContain('AND fm."nBundledetailid" = $3::uuid');
    expect(sql).toContain('AND fm."nUserid" = $4::uuid');
    expect(params).toEqual([
      '11111111-1111-1111-1111-111111111111',
      '22222222-2222-2222-2222-222222222222',
      '33333333-3333-3333-3333-333333333333',
      '66666666-6666-6666-6666-666666666666',
      ['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'],
      true,
      true,
    ]);
  });

  describe('direct single-document share guard (mirrors et_share_sectionbundle, 2026-09-23 sec)', () => {
    const SECTION = '11111111-1111-1111-1111-111111111111';
    const BUNDLE = '22222222-2222-2222-2222-222222222222';
    const DOC = '33333333-3333-3333-3333-333333333333';
    const OTHER_DOC = '44444444-4444-4444-4444-444444444444';
    const CALLER = '66666666-6666-6666-6666-666666666666';
    const RECIPIENT = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const REFUSAL = { msg: -1, value: 'You are not authorized to share from this section', bIsalert: true };

    function docShare(overrides: Partial<shareSectionbundleReq> = {}): shareSectionbundleReq {
      return {
        nSectionid: SECTION,
        nBundleid: BUNDLE,
        nBundledetailid: DOC,
        jUsers: [RECIPIENT],
        jShareids: [],
        bIsannotation: true,
        bIsalert: true,
        nMasterid: CALLER,
        ...overrides,
      };
    }

    it('checks membership of the section case (or global admin) and that the document is of that case before writing', async () => {
      const { service, db } = createService();
      db.rowQuery.mockResolvedValueOnce({ success: true, data: [{ bAllowed: true }] });

      await service.share_sectionbundle(docShare());

      const [guardSql, guardParams] = db.rowQuery.mock.calls[0];
      expect(guardSql).not.toContain('INSERT');
      expect(guardSql).toContain('su."isAdmin" = true');
      expect(guardSql).toContain('JOIN "TeamRelation" tr ON tr."nCaseid" = ssm."nCaseid"');
      expect(guardSql).toContain('tr."nUserid" = $3::uuid');
      expect(guardSql).toContain('FROM "BundleDetail" sbd');
      expect(guardSql).toContain('sds."nCaseid" = ssm."nCaseid"');
      expect(guardParams).toEqual([SECTION, DOC, CALLER]);
      expect(db.rowQuery.mock.calls[1][0]).toContain('INSERT INTO "BDShare"');
    });

    it('refuses a caller who is not a member of the section case, with the stored procedure refusal row, and writes nothing', async () => {
      const { service, db, utility } = createService();
      db.rowQuery.mockResolvedValueOnce({ success: true, data: [{ bAllowed: false }] });

      const res = await service.share_sectionbundle(docShare());

      expect(res).toEqual(REFUSAL);
      expect(db.rowQuery).toHaveBeenCalledTimes(1);
      expect(db.executeRef).not.toHaveBeenCalled();
      expect(utility.emit).not.toHaveBeenCalled();
    });

    it('refuses a document of another case listed under the caller section (guard row missing) and never reconciles recipients', async () => {
      const { service, db } = createService();
      db.rowQuery.mockResolvedValueOnce({ success: true, data: [] });

      const res = await service.share_sectionbundle(docShare({ nBundledetailid: OTHER_DOC, bIsalert: false }));

      expect(res).toEqual({ ...REFUSAL, bIsalert: false });
      expect(db.rowQuery).toHaveBeenCalledTimes(1);
      expect(db.rowQuery.mock.calls[0][1]).toEqual([SECTION, OTHER_DOC, CALLER]);
    });

    it('fails closed when the guard query errors', async () => {
      const { service, db } = createService();
      db.rowQuery.mockResolvedValueOnce({ success: false, error: 'boom' });

      const res = await service.share_sectionbundle(docShare());

      expect(res).toEqual({ msg: -1, value: 'Failed to fetch', error: 'boom' });
      expect(db.rowQuery).toHaveBeenCalledTimes(1);
      // the failed query was the read-only guard, not the share write
      expect(db.rowQuery.mock.calls[0][0]).not.toContain('INSERT');
    });

    it('guards every document of a bulk selection and stops at the first refused one', async () => {
      const { service, db } = createService();
      db.rowQuery
        .mockResolvedValueOnce({ success: true, data: [{ bAllowed: true }] }) // guard doc 1
        .mockResolvedValueOnce({ success: true, data: [] }) // share doc 1
        .mockResolvedValueOnce({ success: true, data: [] }) // reconcile doc 1
        .mockResolvedValueOnce({ success: true, data: [{ bAllowed: false }] }); // guard doc 2

      const res = await service.share_sectionbundle(docShare({
        nBundleid: '0',
        nBundledetailid: '0',
        jShareids: [[BUNDLE, DOC], [BUNDLE, OTHER_DOC]],
      }));

      expect(res).toEqual({ ...REFUSAL, bIsalert: false });
      expect(db.rowQuery).toHaveBeenCalledTimes(4);
      expect(db.rowQuery.mock.calls[0][1]).toEqual([SECTION, DOC, CALLER]);
      expect(db.rowQuery.mock.calls[3][1]).toEqual([SECTION, OTHER_DOC, CALLER]);
    });

    it('copies only the sharer\'s own facts and doclinks, and reconciles only the sharer\'s own rows', async () => {
      const { service, db } = createService();
      db.rowQuery.mockResolvedValueOnce({ success: true, data: [{ bAllowed: true }] });

      await service.share_sectionbundle(docShare());

      const [shareSql] = db.rowQuery.mock.calls[1];
      expect(shareSql).toMatch(/FROM "FactMaster" fm[\s\S]*AND fm\."nUserid" = \$4::uuid[\s\S]*INSERT INTO "DMShared"/);
      expect(shareSql).toMatch(/FROM "DocMaster" dm[\s\S]*AND dm\."nUserid" = \$4::uuid/);
      const [reconcileSql, reconcileParams] = db.rowQuery.mock.calls[2];
      expect(reconcileSql).toContain('AND bs."nMasterid" = $2::uuid');
      expect(reconcileSql).toContain('AND fm."nUserid" = $2::uuid');
      expect(reconcileSql).toContain('AND dm."nUserid" = $2::uuid');
      expect(reconcileParams[1]).toBe(CALLER);
    });

    it('does not notify or reconcile when the stored procedure refuses a folder share', async () => {
      const { service, db, utility } = createService();
      db.executeRef.mockResolvedValueOnce({ success: true, data: [[REFUSAL]] });

      const res = await service.share_sectionbundle(docShare({ nBundledetailid: null as any }));

      expect(res).toEqual(REFUSAL);
      expect(db.executeRef).toHaveBeenCalledTimes(1);
      expect(utility.emit).not.toHaveBeenCalled();
      expect(db.rowQuery).not.toHaveBeenCalled();
    });

    it('still notifies recipients of a stored-procedure share that succeeded', async () => {
      const { service, db, utility } = createService();
      db.executeRef.mockResolvedValueOnce({
        success: true,
        data: [[{ msg: 1, value: 'Shared successfully', bIsalert: true, nUserid: RECIPIENT, cTitle: 'Shared X' }]],
      });

      await service.share_sectionbundle(docShare({ nBundledetailid: null as any }));

      expect(utility.emit).toHaveBeenCalledTimes(1);
      expect(utility.emit.mock.calls[0][0]).toMatchObject({ nUserid: RECIPIENT, nRefuserid: CALLER, cType: 'CS' });
    });
  });

  it('loads incoming shares across source sections in the same case as the owner team folder', async () => {
    const { service, db } = createService();
    const body: getbundleSharedReq = {
      nSectionid: '11111111-1111-1111-1111-111111111111',
      nMasterid: '22222222-2222-2222-2222-222222222222',
      nUserid: '33333333-3333-3333-3333-333333333333',
    };

    await service.getBundleShares(body);

    expect(db.rowQuery).toHaveBeenCalledTimes(1);
    const [sql, params] = db.rowQuery.mock.calls[0];
    expect(sql).toContain('case_scope AS');
    expect(sql).toContain('JOIN case_scope cs ON cs."nCaseid" = sm."nCaseid"');
    expect(sql).not.toContain('WHERE bs."nSectionid" = $1::uuid');
    expect(params).toEqual([body.nSectionid, body.nMasterid, body.nUserid]);
  });
});
