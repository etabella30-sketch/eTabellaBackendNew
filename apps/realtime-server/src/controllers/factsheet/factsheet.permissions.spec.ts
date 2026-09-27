import { FACTSHEET_NOT_VIEWABLE, FactsheetService } from '../../services/factsheet/factsheet.service';
import { FactsheetController } from './factsheet.controller';

// GET factsheet/permissions returned the caller's et_fact_permissions row for ANY fact, and that row
// names the fact's owner (nUserid). Real controller and service, DB mocked.

const ME = '11111111-1111-4111-8111-111111111111';
const OWNER = '22222222-2222-4222-8222-222222222222';
const FACT = '55555555-5555-4555-8555-555555555555';

function build(permission: any) {
  const db = { executeRef: jest.fn(async () => permission) };
  const ctrl = new FactsheetController(new FactsheetService(db as any, {} as any));
  return { ctrl, db };
}

const row = (flags: Record<string, any>) => ({
  success: true,
  data: [[{ nFSid: FACT, nUserid: OWNER, bCanComment: false, bCanEdit: false, bCanReshare: false, bCanView: false, ...flags }]],
});
const query = () => ({ nFSid: FACT, nMasterid: ME }) as any;

describe('GET factsheet/permissions (owner id only for viewers)', () => {
  it.each([
    ['bCanView false', { bCanView: false }],
    ['bCanView null (no FMShared row)', { bCanView: null }],
    ['bCanView missing', { bCanView: undefined }],
  ])('%s: answers with the fact sheet refusal, naming no owner', async (_label, flags) => {
    const { ctrl, db } = build(row(flags));
    const res = await ctrl.getpermission(query());
    expect(res).toEqual(FACTSHEET_NOT_VIEWABLE);
    expect(JSON.stringify(res)).not.toContain(OWNER);
    expect(db.executeRef).toHaveBeenCalledWith('fact_permissions', { nUserid: ME, nFSid: FACT });
  });

  it('returns the whole row to a share recipient who may view the fact (the legacy fact table reads its flags)', async () => {
    const shared = row({ bCanView: true, bCanReshare: true });
    const { ctrl } = build(shared);
    await expect(ctrl.getpermission(query())).resolves.toEqual(shared.data[0][0]);
  });

  it('returns the whole row to the owner', async () => {
    const own = row({ nUserid: ME, bCanView: true, bCanEdit: true, bCanReshare: true, bCanComment: true });
    const { ctrl } = build(own);
    await expect(ctrl.getpermission(query())).resolves.toEqual(own.data[0][0]);
  });

  it('keeps the empty answer for an unknown fact and the failure shape for a failed lookup', async () => {
    await expect(build({ success: true, data: [[]] }).ctrl.getpermission(query())).resolves.toBeUndefined();
    await expect(build({ success: false, error: 'db down' }).ctrl.getpermission(query())).resolves.toEqual({ msg: -1, error: 'db down' });
  });

  it('the refusal is a fresh object each time (the frozen constant is never handed out)', async () => {
    const a = await build(row({})).ctrl.getpermission(query());
    const b = await build(row({})).ctrl.getpermission(query());
    expect(a).not.toBe(b);
    expect(Object.isFrozen(a)).toBe(false);
  });
});
