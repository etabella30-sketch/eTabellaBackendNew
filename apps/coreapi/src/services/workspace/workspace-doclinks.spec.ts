import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { WORKSPACE_DOCLINKS_SQL } from './workspace-doclinks.query';

describe('Workspace DocLinks', () => {
  const query = { nCaseid: '10000000-0000-4000-8000-000000000001', nMasterid: '20000000-0000-4000-8000-000000000001' } as any;
  it('uses the authenticated case and actor with the Reader audience, including session sources', async () => {
    const rows = [{ nFSid: 'doc', cFType: 'DL', nSesid: 'session', nPage: 10, nLine: 4 }];
    const db = { rowQuery: jest.fn().mockResolvedValue({ success: true, data: rows }) };
    expect(await new WorkspaceService(db as any).getDocLinks(query)).toEqual(rows);
    expect(db.rowQuery).toHaveBeenCalledWith(WORKSPACE_DOCLINKS_SQL, [query.nCaseid, query.nMasterid]);
  });
  it('refuses an absent caller or malformed case without a database read', async () => {
    const db = { rowQuery: jest.fn() };
    const service = new WorkspaceService(db as any);
    await expect(service.getDocLinks({ ...query, nMasterid: undefined })).rejects.toThrow(BadRequestException);
    await expect(service.getDocLinks({ ...query, nCaseid: 'invalid' })).rejects.toThrow(BadRequestException);
    expect(db.rowQuery).not.toHaveBeenCalled();
  });
  it('does not disguise a failed read as a successful empty list', async () => {
    const db = { rowQuery: jest.fn().mockResolvedValue({ success: false }) };
    await expect(new WorkspaceService(db as any).getDocLinks(query)).rejects.toThrow(InternalServerErrorException);
  });
});
