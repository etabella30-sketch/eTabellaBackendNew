import { DbService } from './db.service';
import { ADVANCED_VIEW_ONLY } from '@app/permissions';

describe('case mode at the shared cloud write boundary', () => {
  it('never builds or runs an Advanced write from an old Essential tab', async () => {
    const service = Object.create(DbService.prototype) as DbService;
    const client = { query: jest.fn().mockResolvedValue({ rows: [{ cUIMode: 'E' }] }), release: jest.fn() };
    (service as any).pool = { connect: jest.fn().mockResolvedValue(client) };
    service.queryBuilder = { buildQuery: jest.fn() } as any;
    service.query = jest.fn();
    const result = await service.executeRef('task_insert', { nMasterid: '10000000-0000-4000-8000-000000000001', nCaseid: '20000000-0000-4000-8000-000000000001', permission: 'N' });
    expect(result).toEqual({ success: false, error: ADVANCED_VIEW_ONLY });
    expect(service.queryBuilder.buildQuery).not.toHaveBeenCalled(); expect(service.query).not.toHaveBeenCalled();
    expect(client.query).toHaveBeenLastCalledWith('ROLLBACK'); expect(client.release).toHaveBeenCalledTimes(1);
  });
  it('holds the case mode lock through the stored procedure and commits the save before releasing it', async () => {
    const service = Object.create(DbService.prototype) as DbService;
    const client = { query: jest.fn(async (sql: string) => sql === 'write;fetch'
      ? [{ command: 'SELECT', rows: [] }, { command: 'FETCH', rows: [{ msg: 1 }] }]
      : { rows: [{ cUIMode: 'A' }] }), release: jest.fn() };
    (service as any).pool = { connect: jest.fn().mockResolvedValue(client) };
    service.queryBuilder = { buildQuery: jest.fn().mockReturnValue('write;fetch') } as any;
    const result = await service.executeRef('task_insert', { nMasterid: '10000000-0000-4000-8000-000000000001', nCaseid: '20000000-0000-4000-8000-000000000001', permission: 'N' });
    expect(result).toEqual({ success: true, data: [[{ msg: 1 }]] });
    expect(client.query.mock.calls.map(c => c[0])).toEqual(['BEGIN', expect.stringContaining('FOR SHARE'), 'write;fetch', 'COMMIT']);
    expect(client.release).toHaveBeenCalledTimes(1);
  });
});
