import { WorkspaceService, qfactView } from './workspace.service';
const ME='10000000-0000-4000-8000-000000000001';
describe('QFACT WorkSpace saved views',()=>{
 it.each([{jFilter:JSON.stringify({assigned:false})},{jState:JSON.stringify({tpl:{base:'qfacts'}})},{jState:JSON.stringify({tpl:{base:'qexpress'}})},{jState:JSON.stringify({tpl:{base:'qissues'}})},{jFilter:JSON.stringify({markingType:'QF'})},{jState:JSON.stringify({table:{filters:{type:['QFact']}}})}])('rejects publishing explicit QFACT metadata before a save: %j',async fields=>{
  const db:any={executeRef:jest.fn()};
  expect(await new WorkspaceService(db).saveView({...fields,nCaseid:'case',nMasterid:ME,cName:'Anything',bShared:true})).toMatchObject({msg:-1});
  expect(db.executeRef).not.toHaveBeenCalled();
 });
 it('retains owners legacy QFACT views privately and hides them from colleagues',async()=>{
  const qf={jState:JSON.stringify({tpl:{base:'qfacts'}}),bShared:true};
  const db:any={executeRef:jest.fn().mockResolvedValue({success:true,data:[[{...qf,nWVid:'mine',nUserid:ME},{...qf,nWVid:'theirs',nUserid:'other'},{nWVid:'mixed',jFilter:'{}',bShared:true}]]})};
  expect(await new WorkspaceService(db).listViews({nCaseid:'case',nMasterid:ME})).toEqual([{...qf,nWVid:'mine',nUserid:ME,bShared:false},{nWVid:'mixed',jFilter:'{}',bShared:true}]);
 });
 it('allows mixed views, saved Full FACT views, and duplicate editable names',async()=>{
  const db:any={executeRef:jest.fn().mockResolvedValue({success:true,data:[[{msg:1}]]})};
  const body:any={cName:'QFACTs',jFilter:'{}',jState:JSON.stringify({table:{filters:{type:['Fact','QFact']}}}),bShared:true};
  expect(qfactView(body)).toBe(false);
  await new WorkspaceService(db).saveView(body); await new WorkspaceService(db).saveView(body);
  expect(db.executeRef).toHaveBeenCalledTimes(2);
 });
});

it('does not treat unassigned Task views as QFACT-only',()=>{
 expect(qfactView({cEntity:'task',jFilter:JSON.stringify({assigned:false})})).toBe(false);
 expect(qfactView({cEntity:'fact',jFilter:JSON.stringify({assigned:false})})).toBe(true);
});
