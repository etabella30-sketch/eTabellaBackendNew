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
