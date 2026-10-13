import { BadRequestException, ForbiddenException, ServiceUnavailableException } from '@nestjs/common';
import { ENTRY_CASE_SQL, ENTRY_NOTIFICATIONS_SQL, ENTRY_SCHEMA_READY_SQL, ENTRY_SESSIONS_SQL, nextHearingDay, RealtimeEntryService } from './realtime-entry.service';

const CASE='20000000-0000-4000-8000-000000000001', ME='10000000-0000-4000-8000-000000000001';
const SES='30000000-0000-4000-8000-000000000001', OLD='30000000-0000-4000-8000-000000000002';
const EVENT='40000000-0000-4000-8000-000000000001', OTHER_EVENT='40000000-0000-4000-8000-000000000002';
const user={userId:ME,isAdmin:false};
const caseRow={caseId:CASE,timezone:'Asia/Kolkata',today:'2026-10-08',scheduleStart:'2026-10-06',scheduleDays:4,days:[{date:'2026-10-06',hearingDay:1}]};
const session={sessionId:SES,eventId:EVENT,status:'R',date:'2026-10-08',hearingDay:3,eligible:true,completed:false};
function build(sessions:any[]=[session], row:any=caseRow) {
 const db={rowQuery:jest.fn(async(sql:string,_params?:any[])=>({success:true,data:sql===ENTRY_CASE_SQL?(row?[row]:[]):sql===ENTRY_SESSIONS_SQL?sessions:[]}))};
 return {db,svc:new RealtimeEntryService(db as any)};
}
describe('authoritative Realtime entry',()=>{
 it('returns only an eligible real running session with factual context',async()=>{
  const {svc,db}=build(); const result=await svc.status(CASE,SES,user,EVENT);
  expect(result).toMatchObject({current:{sessionId:SES,eventId:EVENT},lastSession:null,requestedSession:'available',nextHearingDay:{date:'2026-10-08',hearingDay:3}});
  expect(db.rowQuery.mock.calls).toEqual([[ENTRY_CASE_SQL,[CASE,ME]],[ENTRY_SESSIONS_SQL,[CASE,ME]]]);
 });
 it('a schedule and planned P session do not activate LIVE or become a last session',async()=>{
  const {svc}=build([{...session,status:'P'}]);expect(await svc.status(CASE,undefined,user)).toMatchObject({current:null,lastSession:null});
 });
 it('missing hearing dates never block a currently eligible session',async()=>{
  const {svc}=build([session],{...caseRow,scheduleStart:null,scheduleDays:null,today:null});
  expect(await svc.status(CASE,SES,user)).toMatchObject({current:{sessionId:SES},nextHearingDay:null,timezone:null,requestedSession:'available'});
 });
 it('an end of the old session cannot hide a replacement or silently enter it',async()=>{
  const {svc}=build([session,{...session,sessionId:OLD,status:'C',completed:true}]);
  expect(await svc.status(CASE,OLD,user)).toMatchObject({current:{sessionId:SES},lastSession:{sessionId:OLD},requestedSession:'changed'});
 });
 it('reactivating the same technical session changes event identity',async()=>{
  const {svc}=build();expect(await svc.status(CASE,SES,user,OTHER_EVENT)).toMatchObject({requestedSession:'changed'});
 });
 it('only a completed session with recorded activity is last; an unstarted cancellation is omitted',async()=>{
  const {svc}=build([{...session,status:'C',completed:false}]);expect(await svc.status(CASE,SES,user)).toMatchObject({lastSession:null,current:null,requestedSession:'ended'});
 });
 it('Last session uses the latest actual hearing date when an older legacy completion was recently edited',async()=>{
  // The database returns the older legacy row first after its dUpdatedt changes.
  const older={...session,sessionId:OLD,status:'P',completed:true,date:'2026-10-06',hearingDay:1};
  const newer={...session,status:'C',completed:true,date:'2026-10-07',hearingDay:2};
  const {svc}=build([older,newer]);
  expect(await svc.status(CASE,undefined,user)).toMatchObject({current:null,lastSession:{sessionId:SES,date:'2026-10-07',hearingDay:2}});
 });
 it('omits a completion without a reliable hearing date and retains the latest dated completion',async()=>{
  const undated={...session,sessionId:OLD,status:'C',completed:true,date:null,hearingDay:null};
  const dated={...session,status:'C',completed:true,date:'2026-10-06',hearingDay:1};
  const {svc}=build([undated,dated]);
  expect(await svc.status(CASE,undefined,user)).toMatchObject({lastSession:{sessionId:SES,date:'2026-10-06',hearingDay:1}});
 });
 it.each([null,undefined,'','unknown'])('omits Last session when no completion has a reliable date (%p)',async(date)=>{
  const {svc}=build([{...session,status:'C',completed:true,date}]);
  expect(await svc.status(CASE,undefined,user)).toMatchObject({current:null,lastSession:null});
 });
 it('keeps the existing completion order for technical sessions on the same hearing day',async()=>{
  const {svc}=build([{...session,sessionId:OLD,status:'C',completed:true},{...session,status:'C',completed:true}]);
  expect(await svc.status(CASE,undefined,user)).toMatchObject({lastSession:{sessionId:OLD,date:'2026-10-08'}});
 });
 it('selects the latest hearing date even when frozen hearing-day numbers are out of chronological order',async()=>{
  const {svc}=build([{...session,sessionId:OLD,status:'C',completed:true,date:'2026-10-06',hearingDay:8},
   {...session,status:'C',completed:true,date:'2026-10-07',hearingDay:7}]);
  expect(await svc.status(CASE,undefined,user)).toMatchObject({lastSession:{sessionId:SES,date:'2026-10-07',hearingDay:7}});
 });
 it('a later live, unstarted or revoked row cannot replace the last eligible completed hearing day',async()=>{
  const done={...session,sessionId:OLD,status:'C',completed:true,date:'2026-10-06',hearingDay:1};
  const {svc}=build([session,{...session,sessionId:'30000000-0000-4000-8000-000000000003',status:'P'},
   {...session,sessionId:'30000000-0000-4000-8000-000000000004',status:'C',completed:true,eligible:false},done]);
  expect(await svc.status(CASE,SES,user,EVENT)).toMatchObject({current:{sessionId:SES,eventId:EVENT},
   requestedSession:'available',lastSession:{sessionId:OLD,date:'2026-10-06',hearingDay:1}});
 });
 it('revocation removes current and last and refuses the exact action',async()=>{
  const {svc}=build([{...session,eligible:false}]);expect(await svc.status(CASE,SES,user)).toMatchObject({current:null,lastSession:null,requestedSession:'forbidden'});
 });
 it('a different-case or absent session is never replaced automatically',async()=>{
  const {svc}=build();expect(await svc.status(CASE,OLD,user)).toMatchObject({requestedSession:'forbidden',current:{sessionId:SES}});
 });
 it('ambiguous legacy concurrent live sessions fail closed',async()=>{
  const {svc}=build([session,{...session,sessionId:OLD}]);await expect(svc.status(CASE,SES,user)).rejects.toBeInstanceOf(ServiceUnavailableException);
 });
 it('case access refusal does not reveal sessions',async()=>{
  const {svc,db}=build([],null);await expect(svc.status(CASE,SES,user)).rejects.toBeInstanceOf(ForbiddenException);expect(db.rowQuery).toHaveBeenCalledTimes(1);
 });
 it('missing schema/query failure is unavailable, never no-live',async()=>{
  const {svc,db}=build();db.rowQuery.mockResolvedValue({success:false,data:[]});await expect(svc.status(CASE,SES,user)).rejects.toBeInstanceOf(ServiceUnavailableException);
 });
 it.each([null,undefined,{userId:'bad',isAdmin:true}])('fails closed without a verified UUID caller (%p)',async(actor)=>{
  const {svc,db}=build();await expect(svc.status(CASE,SES,actor as any)).rejects.toBeInstanceOf(ForbiddenException);expect(db.rowQuery).not.toHaveBeenCalled();
 });
 it.each([['bad',SES,EVENT],[CASE,'bad',EVENT],[CASE,SES,'bad']])('rejects invalid references',async(c,s,e)=>{
  const {svc}=build();await expect(svc.status(c,s,user,e)).rejects.toBeInstanceOf(BadRequestException);
 });
 it('notification discovery is read-only and constrained to token user/case',async()=>{
  const {svc,db}=build();await svc.notifications(CASE,user);expect(db.rowQuery).toHaveBeenCalledWith(ENTRY_NOTIFICATIONS_SQL,[ME,CASE]);
  expect(ENTRY_NOTIFICATIONS_SQL).toContain('rt_entry_eligible');expect(ENTRY_NOTIFICATIONS_SQL).not.toMatch(/INSERT/i);
 });
 it('dismissal keeps the persistent dedup row and cannot target another user',async()=>{
  const {svc,db}=build();db.rowQuery.mockResolvedValue({success:true,data:[{nNotificationid:EVENT}]});
  await expect(svc.updateNotification(EVENT,true,user)).resolves.toEqual({ok:true});
  expect(db.rowQuery.mock.calls[0][0]).toContain('"bDismissed"=true');expect(db.rowQuery.mock.calls[0][1]).toEqual([EVENT,ME]);
  db.rowQuery.mockResolvedValue({success:true,data:[]});await expect(svc.updateNotification(EVENT,false,user)).rejects.toBeInstanceOf(ForbiddenException);
 });
});
describe('hearing-day identity',()=>{
 it('uses the authoritative case date, including today',()=>expect(nextHearingDay(caseRow)).toEqual({date:'2026-10-08',hearingDay:3}));
 it('retains previously used day numbers after schedule amendments',()=>expect(nextHearingDay({...caseRow,scheduleStart:'2026-10-08',days:[{date:'2026-10-08',hearingDay:7}]})).toEqual({date:'2026-10-08',hearingDay:7}));
 it('new days cannot reuse a historical number',()=>expect(nextHearingDay({...caseRow,scheduleStart:'2026-10-08',days:[{date:'2026-10-06',hearingDay:7}]})).toEqual({date:'2026-10-08',hearingDay:8}));
 it('consecutive future scheduled dates advance consistently after a preserved historical identity',()=>expect(nextHearingDay({...caseRow,today:'2026-10-09',scheduleStart:'2026-10-08',days:[{date:'2026-10-06',hearingDay:7}]})).toEqual({date:'2026-10-09',hearingDay:9}));
 it('unrecorded dates before the latest historical day do not inflate future day numbers',()=>expect(nextHearingDay({...caseRow,today:'2026-10-09',days:[{date:'2026-10-08',hearingDay:3}]})).toEqual({date:'2026-10-09',hearingDay:4}));
 it('inserted dates before an already used future date receive distinct provisional numbers',()=>{
   const row={...caseRow,scheduleStart:'2026-10-08',days:[{date:'2026-10-10',hearingDay:7}]};
   expect(nextHearingDay({...row,today:'2026-10-08'})).toEqual({date:'2026-10-08',hearingDay:8});
   expect(nextHearingDay({...row,today:'2026-10-09'})).toEqual({date:'2026-10-09',hearingDay:9});
 });
 it('past schedules do not create a new scheduling state',()=>expect(nextHearingDay({...caseRow,today:'2026-11-01'})).toBeNull());
 it.each([{today:null},{scheduleStart:null},{scheduleDays:0},{scheduleDays:4000}])('unclear context is omitted %p',change=>expect(nextHearingDay({...caseRow,...change})).toBeNull());
});

describe('Realtime entry while the additive schema is not installed',()=>{
 const missingTable='relation "public.RealtimeHearingDay" does not exist';
 function legacy(sessions:any[]=[session],row:any={caseId:CASE},error:any=missingTable) {
  const db={rowQuery:jest.fn()
   .mockResolvedValueOnce({success:false,error})
   .mockResolvedValueOnce({success:true,data:row?[row]:[]})
   .mockResolvedValueOnce({success:true,data:sessions})};
  return {db,svc:new RealtimeEntryService(db as any)};
 }
 it('restores only an authorized unique running entry without inventing unavailable context',async()=>{
  const {svc,db}=legacy();
  await expect(svc.status(CASE,SES,user)).resolves.toEqual({
   caseId:CASE,timezone:null,current:{sessionId:SES,hearingDay:null,date:null},lastSession:null,nextHearingDay:null,requestedSession:'available'
  });
  const calls=db.rowQuery.mock.calls;
  expect(calls).toHaveLength(3);
  expect(calls[1][1]).toEqual([CASE,ME]);expect(calls[2][1]).toEqual([CASE,ME]);
  expect(calls[1][0]).toContain('"TeamRelation"');expect(calls[1][0]).toContain('"RSessionDetail"');
  expect(calls[1][0]).toContain('"isAdmin" IS TRUE');expect(calls[2][0]).toContain('r."nCaseid"=$1');
  expect(calls.slice(1).map(c=>c[0]).join('\n')).not.toMatch(/RealtimeHearingDay|rt_entry_|nEntryEventid|dEntryStartedAt|INSERT|UPDATE/);
 });
 it('keeps case refusal authoritative without querying its sessions',async()=>{
  const {svc,db}=legacy([],null);await expect(svc.status(CASE,SES,user)).rejects.toBeInstanceOf(ForbiddenException);
  expect(db.rowQuery).toHaveBeenCalledTimes(2);
 });
 it('does not expose a session revoked from the caller',async()=>{
  const {svc}=legacy([{...session,eligible:false}]);
  await expect(svc.status(CASE,SES,user)).resolves.toMatchObject({current:null,requestedSession:'forbidden'});
 });
 it('counts all live rows before eligibility and refuses ambiguous legacy cases',async()=>{
  const {svc}=legacy([session,{...session,sessionId:OLD,eligible:false}]);
  await expect(svc.status(CASE,SES,user)).rejects.toBeInstanceOf(ServiceUnavailableException);
 });
 it('a foreign-case reference is not silently replaced by the current session',async()=>{
  const {svc}=legacy();await expect(svc.status(CASE,OLD,user)).resolves.toMatchObject({current:{sessionId:SES},requestedSession:'forbidden'});
 });
 it('does not validate a referenced availability event against a legacy running row',async()=>{
  const {svc}=legacy();await expect(svc.status(CASE,SES,user,EVENT)).resolves.toMatchObject({requestedSession:'changed'});
 });
 it('an ended legacy session never validates an event or becomes an invented last session',async()=>{
  const {svc}=legacy([{...session,status:'C',completed:true}]);
  await expect(svc.status(CASE,SES,user,EVENT)).resolves.toMatchObject({current:null,lastSession:null,nextHearingDay:null,requestedSession:'ended'});
 });
 it.each([
  'function public.rt_entry_eligible(uuid, unknown) does not exist',
  'column r.nEntryEventid does not exist',
  'column r.dEntryStartedAt does not exist',
  {code:'42703',message:'column r.dHearingDay does not exist'}
 ])('allows only missing additive entry function or column failures (%p)',async(error)=>{
  const {svc}=legacy(undefined,undefined,error);await expect(svc.status(CASE,SES,user)).resolves.toMatchObject({current:{sessionId:SES}});
 });
 it('can detect an entry column missing only when the full session query executes',async()=>{
  const db={rowQuery:jest.fn()
   .mockResolvedValueOnce({success:true,data:[caseRow]})
   .mockResolvedValueOnce({success:false,error:'column r.dEntryEndedAt does not exist'})
   .mockResolvedValueOnce({success:true,data:[{caseId:CASE}]})
   .mockResolvedValueOnce({success:true,data:[session]})};
  await expect(new RealtimeEntryService(db as any).status(CASE,SES,user)).resolves.toMatchObject({current:{sessionId:SES},requestedSession:'available'});
 });
 it.each([
  'connection terminated unexpectedly','permission denied for table RealtimeHearingDay',
  'relation "public.CaseMaster" does not exist','column c.cHearingTimezone does not exist',
  'function public.another_function(uuid) does not exist',
  {code:'42501',message:missingTable},undefined
 ])('never substitutes legacy data for other database failures (%p)',async(error)=>{
  const {svc,db}=legacy(undefined,undefined,error===undefined?'unavailable':error);
  await expect(svc.status(CASE,SES,user)).rejects.toBeInstanceOf(ServiceUnavailableException);
  expect(db.rowQuery).toHaveBeenCalledTimes(1);
 });
 it('keeps a failed legacy read unavailable rather than pretending no session is live',async()=>{
  const {svc,db}=legacy();db.rowQuery.mockReset().mockResolvedValueOnce({success:false,error:missingTable})
   .mockResolvedValueOnce({success:false,error:'connection terminated unexpectedly'});
  await expect(svc.status(CASE,SES,user)).rejects.toBeInstanceOf(ServiceUnavailableException);
 });
 it('does not fabricate persistent notifications while the entry schema is missing',async()=>{
  const {svc,db}=legacy();await expect(svc.notifications(CASE,user)).rejects.toBeInstanceOf(ServiceUnavailableException);
  expect(db.rowQuery).toHaveBeenCalledTimes(1);
 });
 it('probes catalog readiness after a known schema absence without repeating failing modern SQL or caching access',async()=>{
  const {svc,db}=legacy();db.rowQuery
   .mockResolvedValueOnce({success:true,data:[{ready:false}]})
   .mockResolvedValueOnce({success:true,data:[{caseId:CASE}]})
   .mockResolvedValueOnce({success:true,data:[{...session,eligible:false}]});
  await expect(svc.status(CASE,SES,user)).resolves.toMatchObject({current:{sessionId:SES}});
  await expect(svc.status(CASE,SES,user)).resolves.toMatchObject({current:null,requestedSession:'forbidden'});
  expect(db.rowQuery.mock.calls.filter(c=>c[0]===ENTRY_CASE_SQL)).toHaveLength(1);
  expect(db.rowQuery.mock.calls[3]).toEqual([ENTRY_SCHEMA_READY_SQL,[]]);
 });
 it('automatically resumes full factual context on the next read after the migration appears',async()=>{
  const {svc,db}=legacy();db.rowQuery
   .mockResolvedValueOnce({success:true,data:[{ready:true}]})
   .mockResolvedValueOnce({success:true,data:[caseRow]})
   .mockResolvedValueOnce({success:true,data:[session]});
  await svc.status(CASE,SES,user);
  await expect(svc.status(CASE,SES,user,EVENT)).resolves.toMatchObject({
   current:{sessionId:SES,eventId:EVENT,hearingDay:3},requestedSession:'available'
  });
  expect(db.rowQuery.mock.calls.filter(c=>c[0]===ENTRY_CASE_SQL)).toHaveLength(2);
 });
 it('a catalog connection failure remains unavailable rather than serving stale authorization',async()=>{
  const {svc,db}=legacy();db.rowQuery.mockResolvedValueOnce({success:false,error:'connection terminated unexpectedly'});
  await svc.status(CASE,SES,user);
  await expect(svc.status(CASE,SES,user)).rejects.toBeInstanceOf(ServiceUnavailableException);
  expect(db.rowQuery).toHaveBeenCalledTimes(4);
 });
});
