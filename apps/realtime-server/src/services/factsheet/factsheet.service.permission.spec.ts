import { InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { FACTSHEET_NOT_VIEWABLE, FactsheetService } from './factsheet.service';

const ME = '11111111-1111-4111-8111-111111111111';
const FACT = '55555555-5555-4555-8555-555555555555';

function build(permission: any) {
  const db = {
    executeRef: jest.fn(async (name: string) => {
      if (name === 'fact_permissions') return permission;
      if (name === 'factsheet_tasks') return { success: true, data: [[], [], []] };
      return { success: true, data: [[{ nFSid: FACT, jTexts: ['secret'] }]] };
    }),
  };
  return { svc: new FactsheetService(db as any, {} as any), db };
}

const query = () => ({ nFSid: FACT, nMasterid: ME }) as any;
const readers = ['getFactDetail', 'getFactAnnotation', 'getFactIssues', 'getFactContacts', 'getFactTasks', 'getFactLinks', 'getFactShared'] as const;

/**
 * What a caller who may not view the fact gets back: each reader's normal empty result (detail: the
 * service's failure shape), never a 403. The legacy fact sheet and workspace pages read these for
 * facts the caller may not see, and the legacy interceptor redirects a 403 to /user/dashboard.
 */
const notViewable: Record<(typeof readers)[number], unknown> = {
  getFactDetail: FACTSHEET_NOT_VIEWABLE,
  getFactAnnotation: [],
  getFactIssues: [],
  getFactContacts: [],
  getFactTasks: [[], [], []],
  getFactLinks: [],
  getFactShared: [],
};

describe('FactsheetService read gate', () => {
  afterEach(() => jest.restoreAllMocks());

  it.each(readers)('%s answers a caller who may not view the fact with no fact data, without running the reader SP', async (method) => {
    const { svc, db } = build({ success: true, data: [[{ nFSid: FACT, bCanView: false }]] });
    const res = await (svc as any)[method](query());
    expect(res).toEqual(notViewable[method]);
    expect(JSON.stringify(res)).not.toContain('secret');
    expect(db.executeRef).toHaveBeenCalledTimes(1);
    expect(db.executeRef).toHaveBeenCalledWith('fact_permissions', { nUserid: ME, nFSid: FACT });
  });

  it('the detail refusal is the msg -1 shape both frontends read as "no fact"', async () => {
    const { svc } = build({ success: true, data: [[{ nFSid: FACT, bCanView: false }]] });
    const res = await svc.getFactDetail(query());
    expect(res).toEqual({ msg: -1, value: 'You are not permitted to view this fact' });
    expect(res).not.toBe(FACTSHEET_NOT_VIEWABLE);
  });

  it.each(readers)('%s runs for an owner / FMShared recipient / admin (bCanView)', async (method) => {
    const { svc, db } = build({ success: true, data: [[{ nFSid: FACT, bCanView: true }]] });
    await expect((svc as any)[method](query())).resolves.toBeDefined();
    expect(db.executeRef).toHaveBeenCalledTimes(2);
  });

  it.each(readers)('%s answers 500, not 403, when the permission lookup fails, and runs no reader SP', async (method) => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const { svc, db } = build({ success: false, error: 'db down' });
    await expect((svc as any)[method](query())).rejects.toBeInstanceOf(InternalServerErrorException);
    expect(db.executeRef).toHaveBeenCalledTimes(1);
  });

  it('answers 500 when the permission lookup throws', async () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const db = { executeRef: jest.fn().mockRejectedValue(new Error('connection reset')) };
    const svc = new FactsheetService(db as any, {} as any);
    await expect(svc.getFactLinks(query())).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it.each([false, null, undefined])('an existing fact with no share row for the caller (bCanView %p) is not viewable', async (bCanView) => {
    const { svc, db } = build({ success: true, data: [[{ nFSid: FACT, nUserid: 'someone-else', bCanView }]] });
    await expect(svc.getFactDetail(query())).resolves.toEqual(FACTSHEET_NOT_VIEWABLE);
    await expect(svc.getFactShared(query())).resolves.toEqual([]);
    expect(db.executeRef.mock.calls.every((c) => c[0] === 'fact_permissions')).toBe(true);
  });

  it.each(readers)('%s still returns 404 for a fact that does not exist', async (method) => {
    const { svc } = build({ success: true, data: [[]] });
    await expect((svc as any)[method](query())).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns the detail row when permitted', async () => {
    const { svc } = build({ success: true, data: [[{ nFSid: FACT, bCanView: true }]] });
    await expect(svc.getFactDetail(query())).resolves.toEqual({ nFSid: FACT, jTexts: ['secret'] });
  });
});
