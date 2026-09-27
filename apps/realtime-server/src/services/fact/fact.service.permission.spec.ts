import { ForbiddenException, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { FactService } from './fact.service';
import { FactController } from '../../controllers/fact/fact.controller';

const ME = '11111111-1111-4111-8111-111111111111';
const FACT = '55555555-5555-4555-8555-555555555555';

/** What each reader SP answers when it runs: three cursors, like et_fact_get_detail_single. */
const SP_DATA = [[{ nFSid: FACT, jTexts: ['secret'] }], [{ nIid: 'issue' }], [{ nBundledetailid: 'doc' }]];

function build(permission: any) {
  const db = {
    executeRef: jest.fn(async (name: string) => {
      if (name === 'fact_permissions') return permission;
      return { success: true, data: SP_DATA };
    }),
  };
  return { svc: new FactService(db as any, {} as any), db };
}

const query = () => ({ nFSid: FACT, nMasterid: ME }) as any;
const readers = [
  ['getFactDetailById', 'fact_get_detail_single'],
  ['getFactcontact', 'fact_get_contact'],
  ['getFactshared', 'fact_get_shared'],
  ['getFacttask', 'fact_get_task'],
] as const;

/**
 * List reads answer a caller who may not view the fact with their SP's empty result instead of 403:
 * the legacy interceptor redirects a 403 to /user/dashboard, and the legacy task table reads
 * fact/factshared for a task's fact the assignee may not see.
 */
const listReaders = [
  ['getFactcontact', 'fact_get_contact', []],
  ['getFactshared', 'fact_get_shared', []],
  ['getFacttask', 'fact_get_task', [[], [], []]],
] as const;

const allowed = { success: true, data: [[{ nFSid: FACT, bCanView: true }]] };
const refused = { success: true, data: [[{ nFSid: FACT, nUserid: 'owner', bCanView: false }]] };

describe('FactService read gate (same et_fact_permissions rule as factsheet/*)', () => {
  afterEach(() => jest.restoreAllMocks());

  it('getFactDetailById returns 403 for a caller who may not view the fact, without running fact_get_detail_single', async () => {
    const { svc, db } = build(refused);
    await expect(svc.getFactDetailById(query())).rejects.toBeInstanceOf(ForbiddenException);
    expect(db.executeRef).toHaveBeenCalledTimes(1);
    expect(db.executeRef).toHaveBeenCalledWith('fact_permissions', { nUserid: ME, nFSid: FACT });
    expect(db.executeRef.mock.calls.map((c) => c[0])).not.toContain('fact_get_detail_single');
  });

  it.each(listReaders)('%s answers a caller who may not view the fact with the empty result and never runs %s', async (method, sp, empty) => {
    const { svc, db } = build(refused);
    await expect((svc as any)[method](query())).resolves.toEqual(empty);
    expect(db.executeRef).toHaveBeenCalledTimes(1);
    expect(db.executeRef).toHaveBeenCalledWith('fact_permissions', { nUserid: ME, nFSid: FACT });
    expect(db.executeRef.mock.calls.map((c) => c[0])).not.toContain(sp);
  });

  it.each(listReaders)('%s treats a null / missing bCanView as not viewable', async (method, _sp, empty) => {
    for (const bCanView of [null, undefined]) {
      const { svc, db } = build({ success: true, data: [[{ nFSid: FACT, nUserid: 'owner', bCanView }]] });
      await expect((svc as any)[method](query())).resolves.toEqual(empty);
      expect(db.executeRef).toHaveBeenCalledTimes(1);
    }
  });

  it.each(readers)('%s returns 404 for a fact that does not exist', async (method) => {
    const { svc } = build({ success: true, data: [[]] });
    await expect((svc as any)[method](query())).rejects.toBeInstanceOf(NotFoundException);
  });

  it.each(readers)('%s answers 500 when the permission lookup fails', async (method) => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const { svc, db } = build({ success: false, error: 'db down' });
    await expect((svc as any)[method](query())).rejects.toBeInstanceOf(InternalServerErrorException);
    expect(db.executeRef).toHaveBeenCalledTimes(1);
  });

  it.each(readers)('%s runs %s for an owner / share recipient / admin (bCanView)', async (method, sp) => {
    const { svc, db } = build(allowed);
    await (svc as any)[method](query());
    expect(db.executeRef).toHaveBeenCalledTimes(2);
    expect(db.executeRef.mock.calls[0][0]).toBe('fact_permissions');
    expect(db.executeRef.mock.calls[1][0]).toBe(sp);
  });

  it('keeps each response shape for a permitted caller', async () => {
    const { svc } = build(allowed);
    await expect(svc.getFactDetailById(query())).resolves.toEqual(SP_DATA);
    await expect(svc.getFactcontact(query())).resolves.toEqual(SP_DATA[0]);
    await expect(svc.getFactshared(query())).resolves.toEqual(SP_DATA[0]);
    await expect(svc.getFacttask(query())).resolves.toEqual(SP_DATA);
  });

  it('the controller answers a non-viewer 403 on detail and the empty result on the list routes', async () => {
    const { svc, db } = build(refused);
    const ctrl = new FactController(svc);
    await expect(ctrl.getFactDetail(query())).rejects.toBeInstanceOf(ForbiddenException);
    await expect(ctrl.getFactContact(query())).resolves.toEqual([]);
    await expect(ctrl.getFactshared(query())).resolves.toEqual([]);
    await expect(ctrl.getFacttask(query())).resolves.toEqual([[], [], []]);
    expect(db.executeRef.mock.calls.every((c) => c[0] === 'fact_permissions')).toBe(true);
  });

  it('the controller lets 404 / 500 through on every read route, including facttask', async () => {
    const missing = new FactController(build({ success: true, data: [[]] }).svc);
    await expect(missing.getFactDetail(query())).rejects.toBeInstanceOf(NotFoundException);
    await expect(missing.getFactContact(query())).rejects.toBeInstanceOf(NotFoundException);
    await expect(missing.getFactshared(query())).rejects.toBeInstanceOf(NotFoundException);
    await expect(missing.getFacttask(query())).rejects.toBeInstanceOf(NotFoundException);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const broken = new FactController(build({ success: false, error: 'db down' }).svc);
    await expect(broken.getFacttask(query())).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});

describe('FactService.quickfactUpdate edit gate (bCanEdit, as factsheet/save)', () => {
  afterEach(() => jest.restoreAllMocks());

  const UPDATED = [{ msg: 1, value: 'Updated', nFSid: FACT, color: 'ff0000' }];
  const body = () => ({
    nFSid: FACT, nMasterid: ME, nColorid: null, jTexts: '["changed"]', jIssue: '[]', jContacts: '[]',
    cIsNote: 'N', nPage: 1, nLine: 1,
  }) as any;

  function buildWrite(permission: any) {
    const db = {
      executeRef: jest.fn(async (name: string) => {
        if (name === 'fact_permissions') return permission;
        if (name === 'fact_quick_update') return { success: true, data: [UPDATED] };
        return { success: true, data: [[]] };
      }),
    };
    return { svc: new FactService(db as any, {} as any), db };
  }

  const spNames = (db: any) => db.executeRef.mock.calls.map((c: any[]) => c[0]);

  it.each([
    ['a viewer without edit rights', { nFSid: FACT, nUserid: 'owner', bCanView: true, bCanEdit: false }],
    ['a caller with no share at all', { nFSid: FACT, nUserid: 'owner', bCanView: false, bCanEdit: null }],
    ['a row with no bCanEdit column', { nFSid: FACT, nUserid: 'owner', bCanView: true }],
  ])('refuses %s with 403 and never runs fact_quick_update', async (_label, row) => {
    const { svc, db } = buildWrite({ success: true, data: [[row]] });
    await expect(svc.quickfactUpdate(body())).rejects.toBeInstanceOf(ForbiddenException);
    expect(db.executeRef).toHaveBeenCalledWith('fact_permissions', { nUserid: ME, nFSid: FACT });
    expect(spNames(db)).not.toContain('fact_quick_update');
  });

  it('checks the token user (nMasterid), not a client-sent owner', async () => {
    const { svc, db } = buildWrite({ success: true, data: [[{ nFSid: FACT, bCanView: true, bCanEdit: true }]] });
    await svc.quickfactUpdate({ ...body(), nUserid: 'someone-else' });
    expect(db.executeRef.mock.calls[0]).toEqual(['fact_permissions', { nUserid: ME, nFSid: FACT }]);
  });

  it('returns 404 for a fact that does not exist and 500 when the lookup fails, writing nothing', async () => {
    const missing = buildWrite({ success: true, data: [[]] });
    await expect(missing.svc.quickfactUpdate(body())).rejects.toBeInstanceOf(NotFoundException);
    expect(spNames(missing.db)).not.toContain('fact_quick_update');
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const broken = buildWrite({ success: false, error: 'db down' });
    await expect(broken.svc.quickfactUpdate(body())).rejects.toBeInstanceOf(InternalServerErrorException);
    expect(spNames(broken.db)).not.toContain('fact_quick_update');
  });

  it('runs fact_quick_update for the owner or an edit-share recipient and keeps the response shape', async () => {
    const { svc, db } = buildWrite({ success: true, data: [[{ nFSid: FACT, bCanView: true, bCanEdit: true }]] });
    await expect(svc.quickfactUpdate(body())).resolves.toEqual(UPDATED);
    expect(spNames(db)).toEqual(['fact_permissions', 'fact_quick_update']);
  });

  it('the quickfactupdate route lets the 403 through', async () => {
    const { svc } = buildWrite({ success: true, data: [[{ nFSid: FACT, bCanView: true, bCanEdit: false }]] });
    await expect(new FactController(svc).quickfactupdate(body())).rejects.toBeInstanceOf(ForbiddenException);
  });
});
