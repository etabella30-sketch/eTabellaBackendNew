import { assertQfactShareWrite, qfactPermissionRow, privateQfactListRows, QFACT_PRIVATE } from './qfact-privacy';
const ME='10000000-0000-4000-8000-000000000001', QF='20000000-0000-4000-8000-000000000001', FACT='30000000-0000-4000-8000-000000000001';
const users=JSON.stringify([{nUserid:ME}]);
function world(){return {rows:jest.fn(async (_sql:string, ids:readonly unknown[]) => [{cFType:ids[0]===QF?'QF':'F',nUserid:ME}] as never)};}
describe('QFACT private sharing boundary',()=>{
 it.each(['fact_insert_team','fact_update','factsheet_submit'])('rejects QFACT recipient writes through %s despite a forged Full FACT flag',async fn=>{
  await expect(assertQfactShareWrite(world(),fn,{nFSid:QF,cFtype:'F',jUsers:users,jU:users})).rejects.toMatchObject({code:'forbidden',message:QFACT_PRIVATE});
 });
 it('rejects sharing during conversion before any Full FACT exists',async()=>{
  await expect(assertQfactShareWrite(world(),'fact_insert',{nQFSid:QF,cFtype:'F',jUsers:users})).rejects.toMatchObject({code:'forbidden'});
 });
 it('refuses a mixed bulk selection as a whole and allows a saved Full FACT',async()=>{
  await expect(assertQfactShareWrite(world(),'fact_update',{jFSids:JSON.stringify([FACT,QF]),jU:users})).rejects.toMatchObject({code:'forbidden'});
  await expect(assertQfactShareWrite(world(),'fact_insert_team',{nFSid:FACT,jUsers:users})).resolves.toBeUndefined();
 });
 it('creates/edits/converts private QFACTs without recipients normally',async()=>{
  const db=world();
  await expect(assertQfactShareWrite(db,'fact_insert',{nQFSid:QF,cFtype:'F',jUsers:'[]'})).resolves.toBeUndefined();
  await expect(assertQfactShareWrite(db,'fact_insert_team',{nFSid:QF,jUsers:'[]'})).resolves.toBeUndefined();
  expect(db.rows).toHaveBeenCalledTimes(2);
 });
 it('refuses malformed recipients rather than treating them as empty',async()=>{
  await expect(assertQfactShareWrite(world(),'fact_insert_team',{nFSid:QF,jUsers:'broken'})).rejects.toMatchObject({code:'forbidden'});
 });
 it('ignores legacy sharing permissions for other users, and disables resharing even for the owner',async()=>{
  const legacy={bCanView:true,bCanEdit:true,bCanDelete:true,bCanComment:true,bCanCopy:true,bCanReshare:true};
  expect(await qfactPermissionRow(world(),FACT,QF,legacy)).toEqual({...legacy,cFType:'QF',bCanView:false,bCanEdit:false,bCanDelete:false,bCanComment:false,bCanCopy:false,bCanReshare:false});
  expect(await qfactPermissionRow(world(),ME,QF,legacy)).toEqual({...legacy,cFType:'QF',bCanReshare:false});
  expect(await qfactPermissionRow(world(),ME,FACT,legacy)).toEqual(legacy);
 });
});

describe('QFACT legacy lists remain owner-only',()=>{
 const OTHER='40000000-0000-4000-8000-000000000001';
 const input=[[
  {nFSid:QF,cSource:'QF',jOT:['private passage']},
  {nFSid:FACT,cSource:'F',jOT:['shared Full FACT'],dCreateDt:new Date('2026-01-01')},
  {id:ME,cType:'QM',cTime:'10:00:00'},
 ],[{jFSids:[QF,FACT],cIName:'Mixed Issue'},{jFSids:JSON.stringify([QF]),cIName:'Private Issue'}],[{nFSid:QF,cName:'private link'},{nFSid:FACT,cName:'FACT link'}]];
 const db=()=>({rows:jest.fn(async()=>[{nFSid:QF,cFType:'QF',nUserid:OTHER},{nFSid:FACT,cFType:'F',nUserid:OTHER}] as never)});
 it.each(['marks','navigate_factlist','navigate_get_all','workspace_fact_list','workspace_fact_files','workspace_participant_factlinks','marknav_factlinks','realtime_navigate_get_all_fact_list','realtime_get_annotation_by_session_v2'])('%s removes foreign QFACT passages, their Issue IDs and links, while preserving shared FACTs/Quick Marks and native dates',async fn=>{
  const result=await privateQfactListRows(db(),fn,ME,input);
  expect(result).toEqual([[input[0][1],input[0][2]],[{jFSids:[FACT],cIName:'Mixed Issue'}],[input[2][1]]]);
  expect(JSON.stringify(result)).not.toContain('private');
  expect((result[0][0] as any).dCreateDt).toBe((input[0][1] as any).dCreateDt);
 });
 it('preserves the owners complete list and does not modify the input',async()=>{
  expect(await privateQfactListRows(db(),'navigate_get_all',OTHER,input)).toEqual(input);
  expect((input[0][0] as any).jOT).toEqual(['private passage']);
 });
 it('fails closed when the ownership query fails and refuses unauthenticated list access',async()=>{
  await expect(privateQfactListRows({rows:async()=>{throw Error('offline')}},'marks',ME,input)).rejects.toThrow('offline');
  expect(await privateQfactListRows(db(),'marks',null,input)).toEqual([[],[],[]]);
 });
});

it('filters global annotation ID aggregates even when legacy kind F includes both FACT and QFACT',async()=>{
 const db:any={rows:jest.fn().mockResolvedValue([{nFSid:QF,cFType:'QF',nUserid:FACT},{nFSid:FACT,cFType:'F',nUserid:FACT}])};
 const cursors=[[{type:'F',id:[QF,FACT]},{type:'D',id:[QF]}]];
 expect(await privateQfactListRows(db,'individual_annotations_global',ME,cursors)).toEqual([[{type:'F',id:[FACT]},{type:'D',id:[QF]}]]);
});

it('does not reactivate dormant legacy shares when converting a QFACT; saved FACT sharing remains allowed',async()=>{
 const db:any={rows:jest.fn(async(sql:string)=>sql.includes('SELECT EXISTS')?[{bLegacyShared:true}]:[{cFType:'QF',nUserid:ME}])};
 await expect(assertQfactShareWrite(db,'fact_convert',{nFSid:QF,jUsers:'[]'})).rejects.toThrow('legacy sharing permissions');
});

it('hides a legacy linked-document lookup that lacks fact IDs when no owner/Full FACT link authorizes it',async()=>{
 const db:any={rows:jest.fn().mockResolvedValue([{nBundledetailid:FACT}])};
 const rows=[[{nBundledetailid:QF,cFilename:'QFACT-only link'},{nBundledetailid:FACT,cFilename:'Full FACT link'}]];
 expect(await privateQfactListRows(db,'marknav_factlinks',ME,rows)).toEqual([[rows[0][1]]]);
 expect(db.rows.mock.calls[0][0]).toContain('IS DISTINCT FROM');
});
