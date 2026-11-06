import { DbService } from './db.service';
import { QFACT_PRIVATE } from '@app/permissions';
const ME='10000000-0000-4000-8000-000000000001', QF='20000000-0000-4000-8000-000000000001';
describe('QFACT protection across cloud stored-procedure callers',()=>{
 it.each(['fact_insert_team','factsheet_submit','fact_update','fact_insert'])('%s refuses QFACT shares before constructing or running a stored procedure',async fn=>{
  const service=Object.create(DbService.prototype) as DbService;
  const client={query:jest.fn(async()=>({rows:[{cFType:'QF',nUserid:ME}]})),release:jest.fn()};
  (service as any).pool={connect:jest.fn().mockResolvedValue(client)};
  service.queryBuilder={buildQuery:jest.fn()} as any;
  const result=await service.executeRef(fn,{nMasterid:ME,nFSid:QF,cFtype:'F',jUsers:JSON.stringify([{nUserid:ME}]),jU:JSON.stringify([ME])});
  expect(result).toEqual({success:false,error:QFACT_PRIVATE,code:'forbidden'});
  expect(service.queryBuilder.buildQuery).not.toHaveBeenCalled();
  expect(client.query).toHaveBeenLastCalledWith('ROLLBACK');
  expect(client.release).toHaveBeenCalledTimes(1);
 });
 it('overrides a legacy permission grant on the live read boundary',async()=>{
  const service=Object.create(DbService.prototype) as DbService;
  (service as any).pool={query:jest.fn().mockResolvedValue({rows:[{cFType:'QF',nUserid:ME}]})};
  service.queryBuilder={buildQuery:jest.fn().mockReturnValue('read;fetch')} as any;
  service.query=jest.fn().mockResolvedValue({success:true,data:[[{bCanView:true,bCanEdit:true,bCanReshare:true}]]});
  const answer=await service.executeRef('fact_permissions',{nUserid:QF,nFSid:QF});
  expect(answer.data[0][0]).toMatchObject({bCanView:false,bCanEdit:false,bCanReshare:false});
 });
});

describe('QFACT list filtering at the common cloud read boundary',()=>{
 it('filters every cursor after a legacy stored procedure returns shared QFACTs',async()=>{
  const service=Object.create(DbService.prototype) as DbService;
  (service as any).pool={query:jest.fn().mockResolvedValue({rows:[{nFSid:QF,cFType:'QF',nUserid:QF}]})};
  service.queryBuilder={buildQuery:jest.fn().mockReturnValue('read;fetch')} as any;
  service.query=jest.fn().mockResolvedValue({success:true,data:[[{id:QF,cType:'QF'}],[{jFSids:[QF],cIName:'Secret'}],[{nFSid:QF,cName:'Link'}]]});
  expect(await service.executeRef('marks',{nUserid:ME})).toEqual({success:true,data:[[],[],[]]});
 });
});

it('allows ordinary saved Full FACT sharing in Advanced mode and commits normally',async()=>{
 const service=Object.create(DbService.prototype) as DbService;
 const client={query:jest.fn(async(sql:string)=>sql==='share;fetch'?[{command:'FETCH',rows:[{msg:1}]}]:{rows:sql.includes('FactMaster')?[{cFType:'F',nUserid:ME,nCaseid:QF}]:[{cUIMode:'A'}]}),release:jest.fn()};
 (service as any).pool={connect:jest.fn().mockResolvedValue(client)};
 service.queryBuilder={buildQuery:jest.fn().mockReturnValue('share;fetch')} as any;
 expect(await service.executeRef('fact_insert_team',{nMasterid:ME,nFSid:QF,jUsers:JSON.stringify([{nUserid:QF}])})).toEqual({success:true,data:[[{msg:1}]]});
 expect(service.queryBuilder.buildQuery).toHaveBeenCalled();
 expect(client.query).toHaveBeenLastCalledWith('COMMIT');
});
