import { DbService } from '@app/global/db/pg/db.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { PermissionService } from './permission.service';

describe('PermissionService', () => {
  const db = { executeRef: jest.fn() };
  const service = new PermissionService(db as unknown as DbService, {} as RedisDbService);

  beforeEach(() => jest.resetAllMocks());

  it('returns the case permissions from the database for the requested user and case', async () => {
    const query = { nCaseid: 'case-1', nMasterid: 'user-1' } as never;
    const permissions = { canRead: true, canWrite: false };
    db.executeRef.mockResolvedValue({ success: true, data: [[permissions]] });

    await expect(service.getUserCasepermission(query)).resolves.toEqual(permissions);
    expect(db.executeRef).toHaveBeenCalledWith('pm_get_case_permission', query);
  });

  it('returns a failure instead of permissions when the database lookup fails', async () => {
    db.executeRef.mockResolvedValue({ success: false, error: 'unavailable' });

    await expect(service.getUserCasepermission({} as never)).resolves.toEqual({
      msg: -1, value: 'Failed to fetch', error: 'unavailable',
    });
  });

  it('reports a failed permission reset rather than claiming success', async () => {
    const body = { nCaseid: 'case-1', nMasterid: 'admin-1' } as never;
    db.executeRef.mockResolvedValue({ success: false, error: 'write failed' });

    await expect(service.resetPermission(body)).resolves.toEqual({
      msg: -1, value: 'updation failed', error: 'write failed',
    });
    expect(db.executeRef).toHaveBeenCalledWith('pm_reset_permission', body);
  });
});
