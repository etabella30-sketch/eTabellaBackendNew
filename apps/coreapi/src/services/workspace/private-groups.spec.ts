import { WorkspaceService, privateGroupView } from './workspace.service';
describe('Private Group API and saved-view privacy', () => {
 const actor = '10000000-0000-4000-8000-000000000001';
 it('returns creator-scoped response from the separate function', async () => {
  const row = { msg: 1, groups: [], assignments: {} };
  const db: any = { executeRef: jest.fn().mockResolvedValue({ success: true, data: [[row]] }) };
  expect(await new WorkspaceService(db).privateGroups({ nCaseid: 'case', nMasterid: actor, operation: 'list' })).toEqual(row);
  expect(db.executeRef).toHaveBeenCalledWith('workspace_private_groups', expect.objectContaining({ nMasterid: actor }));
 });
 it('fails explicitly if group data is unavailable', async () => {
  await expect(new WorkspaceService({ executeRef: jest.fn().mockResolvedValue({ success: false }) } as any).privateGroups({ nCaseid: 'case', operation: 'list' })).rejects.toThrow();
 });
 it.each([{ table: { cols: ['privateGroup'] } }, { table: { filters: { privateGroup: { values: ['group'] } } } }, { table: { groupBy: 'privateGroup' } }])('refuses sharing personal state: %j', async state => {
  const db: any = { executeRef: jest.fn() }; const service = new WorkspaceService(db);
  expect(await service.saveView({ bShared: true, state } as any)).toMatchObject({ msg: -1 });
  expect(db.executeRef).not.toHaveBeenCalled();
 });
 it('does not disclose legacy shared views containing group IDs to colleagues', async () => {
  const personal = { nWVid: 'mine', nUserid: actor, jState: JSON.stringify({ table: { cols: ['privateGroup'] } }) };
  const db: any = { executeRef: jest.fn().mockResolvedValue({ success: true, data: [[personal, { ...personal, nWVid: 'theirs', nUserid: 'other' }, { nWVid: 'ordinary' }]] }) };
  expect((await new WorkspaceService(db).listViews({ nMasterid: actor } as any)).map(r => r.nWVid)).toEqual(['mine', 'ordinary']);
 });
 it('detects parsed and JSON-encoded private state while allowing ordinary views', () => {
  expect(privateGroupView(JSON.stringify({ groupBy: 'privateGroup' }))).toBe(true);
  expect(privateGroupView({ cols: ['issue', 'name'] })).toBe(false);
 });
});
