import { InternalServerErrorException } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';

describe('Workspace Home count read failures', () => {
  const functions = ['workspace_task_list', 'workspace_fact_list', 'workspace_fact_issues', 'workspace_participant_list', 'workspace_participant_factlinks'];
  const query = { nCaseid: '00000000-0000-4000-8000-000000000001' } as any;
  function make(response: unknown): WorkspaceService {
    return new WorkspaceService({ executeRef: jest.fn().mockResolvedValue(response) } as any);
  }
  it.each(functions)('%s reports database failures', async fn => {
    await expect(make({ success: false }).getDataByFunction(query, fn)).rejects.toThrow(InternalServerErrorException);
    await expect(make({ success: true, data: null }).getDataByFunction(query, fn)).rejects.toThrow(InternalServerErrorException);
  });
  it.each(functions)('%s preserves successful zero results', async fn => {
    await expect(make({ success: true, data: [[]] }).getDataByFunction(query, fn)).resolves.toEqual([]);
  });
});


describe('Workspace facts expose independent copy permission for timeline CSV', () => {
  const allowed = '10000000-0000-4000-8000-000000000001';
  const denied = '10000000-0000-4000-8000-000000000002';
  const rows = [{ nFSid: allowed, title: 'Allowed' }, { nFSid: denied, title: 'Read only' }];
  const query = { nCaseid: '20000000-0000-4000-8000-000000000001', nMasterid: '30000000-0000-4000-8000-000000000001' } as any;
  it('keeps both readable facts but marks only the authorised fact copyable', async () => {
    const db = { executeRef: jest.fn().mockResolvedValue({ success: true, data: [rows] }), rowQuery: jest.fn().mockResolvedValue({ success: true, data: [{ id: allowed }] }) };
    const result = await new WorkspaceService(db as any).getDataByFunction(query, 'workspace_fact_list');
    expect(result).toEqual([{ ...rows[0], bCanCopy: true }, { ...rows[1], bCanCopy: false }]);
    expect(db.rowQuery).toHaveBeenCalledWith(expect.stringContaining('"bCanCopy"=true'), [[allowed, denied], query.nCaseid, query.nMasterid]);
  });
  it('permission lookup failure disables export without hiding readable facts', async () => {
    const db = { executeRef: jest.fn().mockResolvedValue({ success: true, data: [rows] }), rowQuery: jest.fn().mockRejectedValue(new Error('Database unavailable')) };
    expect(await new WorkspaceService(db as any).getDataByFunction(query, 'workspace_fact_list')).toEqual(rows.map(row => ({ ...row, bCanCopy: false })));
  });
});
