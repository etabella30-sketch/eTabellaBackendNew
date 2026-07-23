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
    expect(db.rowQuery).toHaveBeenCalledTimes(2);
    const [sql, params] = db.rowQuery.mock.calls[0];
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
