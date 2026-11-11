import { ConflictException, ForbiddenException } from '@nestjs/common';
import { sourceHearingTimecode } from '@app/api-contracts';
import { captureLiveQfact, LIVE_QFACT_FIND_SQL, LIVE_QFACT_GROUP_SQL, LIVE_QFACT_ISSUES_SQL, LIVE_QFACT_SESSION_SQL, LIVE_QFACT_LEGACY_SQL, LIVE_QFACT_UNASSIGNED_SQL, liveQfactContext,
  LIVE_QFACT_RECEIPT_INSERT_SQL, LIVE_QFACT_RECEIPT_SQL, LIVE_QFACT_REMOVE_SQLS, LIVE_QFACT_UPDATE_SQL } from './live-qfact-capture';
import { LIVE_QFACT_APPLY_SQL, LIVE_QFACT_SNAPSHOT_SQL } from './live-qfact-single-call';
import { ISSUES_IN_CASE_SQL } from './mark-write-guards';
import { assertCanCreateFact } from './fact-create-gate';
import { CaptureTiming } from './live-qfact-timing';

jest.mock('./fact-create-gate', () => ({assertCanCreateFact:jest.fn().mockResolvedValue(undefined)}));
const CASE='33333333-3333-4333-8333-333333333333', SES='44444444-4444-4444-8444-444444444444';
const ME='11111111-1111-4111-8111-111111111111', OTHER='22222222-2222-4222-8222-222222222222';
const RUN='55555555-5555-4555-8555-555555555555';
const UNASSIGNED='88888888-8888-4888-8888-888888888888', ISSUE_A='99999999-9999-4999-8999-999999999999';
const user={userId:ME,isAdmin:false};
const FOREIGN_GROUP_PREFIX='ffffffff-';
/** live-qfact-capture.single-call.spec.ts runs this whole file again with LIVE_QFACT_SINGLE_CALL=1: the same captures
 *  must give the same results through the one-call path. Specs about the step-by-step calls themselves run once. */
const SINGLE=process.env.LIVE_QFACT_SINGLE_CALL==='1';
const stepIt=SINGLE ? it.skip : it;
/** Captures that went step by step (a transaction opened), by test: with the one-call path on, only a retried request may. */
export const stepByStep=new Map<string,number>();

function fixture(times=['10:00:00:00','10:00:10:00','10:00:35:00','10:01:10:00']) {
  let sequence=0,requestSeq=0;
  const facts=new Map<string,any>(),receipts=new Map<string,any>();
  /** FactPrivateGroup: nFSid -> nGroupid. A group id starting with FOREIGN_GROUP_PREFIX is another user's: the SP refuses it. */
  const groups=new Map<string,string>();
  const notify=jest.fn(async (_userId:string)=>undefined);
  const record={nSesid:SES,cStatus:'R',nLines:25,nEntryEventid:RUN};
  const caseIssues=[UNASSIGNED,ISSUE_A];
  const tuples=times.map((time,index)=>[time,[...`line ${index+1}`].map(c=>c.charCodeAt(0)),index,undefined,1,index+1,String(index+1),null,null,null,sourceHearingTimecode(time)]);
  const feed={getPage:jest.fn(async (_session,page)=>page===1 ? tuples : [])};
  const db={
    saveAtomically:jest.fn(async run=>{
      const name=expect.getState().currentTestName??'';stepByStep.set(name,(stepByStep.get(name)??0)+1);
      const before=structuredClone([...facts]),groupsBefore=[...groups];
      try {return await run();} catch(error) {facts.clear();for(const [key,value] of before)facts.set(key,value);groups.clear();for(const [key,value] of groupsBefore)groups.set(key,value);throw error;}
    }),
    executeRef:jest.fn(async (name,body)=>{
      if(name==='fact_insert'){
        const nFSid=`66666666-6666-4666-8666-${String(++sequence).padStart(12,'0')}`;
        facts.set(nFSid,{nFSid,nUserid:body.nMasterid,nSesid:body.nSesid,dCreateDt:String(sequence),jCordinates:[],bLiveCapturePristine:false});
        return {success:true,data:[[{msg:1,nFSid}]]};
      }
      if(name==='fact_insert_detail') {facts.get(body.nFSid).jCordinates=body.jCordinates;return {success:true,data:[[{msg:1}]]};}
      if(name==='fact_insert_issues') {facts.get(body.nFSid).issues=JSON.parse(body.jIssues);return {success:true,data:[[{msg:1}]]};}
      if(name==='private_group_assign') {
        if(String(body.nPrivateGroupid).startsWith(FOREIGN_GROUP_PREFIX)) return {success:true,data:[[{msg:-1,value:`group ${body.nPrivateGroupid} belongs to someone else`}]]};
        if(body.nPrivateGroupid===null) groups.delete(body.nFSid); else groups.set(body.nFSid,body.nPrivateGroupid);
        return {success:true,data:[[{msg:1}]]};
      }
      throw new Error(name);
    }),
    rowQuery:jest.fn(async (sql,params)=>{
      let data:any[]=[];
      if(sql===LIVE_QFACT_SESSION_SQL) data=[record];
      else if(sql===LIVE_QFACT_UNASSIGNED_SQL) data=caseIssues.includes(UNASSIGNED)?[{id:UNASSIGNED}]:[];
      else if(sql===ISSUES_IN_CASE_SQL) data=params[0].filter(id=>caseIssues.includes(id)).map(id=>({id}));
      else if(sql===LIVE_QFACT_GROUP_SQL) data=groups.has(params[0])?[{nGroupid:groups.get(params[0])}]:[];
      else if(sql===LIVE_QFACT_ISSUES_SQL) data=(facts.get(params[0])?.issues??[]).map(([id,i,r])=>({id,nImpactid:i,nRelevanceid:r}));
      else if(sql===LIVE_QFACT_FIND_SQL) {
        const [needle]=JSON.parse(params[2]);
        data=[...facts.values()].filter(group=>group.nUserid===params[1] && group.nSesid===params[0]
          && group.jCordinates.some(line=>line.capture===needle.capture && line.run===needle.run && line.identity===needle.identity))
          // Like the real query: the group's issue ids come with it.
          .map(group=>({...group,issueIds:(group.issues??[]).map(([id])=>id)}));
      } else if(sql.startsWith('UPDATE "FactDetail"')) {
        Object.assign(facts.get(params[0]),{jOT:JSON.parse(params[1]),jCordinates:JSON.parse(params[2]),bLiveCapturePristine:true});
      } else if(sql.startsWith('DELETE FROM "FactMaster"')) facts.delete(params[0]);
      else if(sql.startsWith('SELECT "cRun"')) { const receipt=receipts.get(params.join(':'));if(receipt)data=[receipt]; }
      else if(sql.startsWith('INSERT INTO "LiveQfactRequest"')) receipts.set(params.slice(0,3).join(':'),{cRun:params[3],cIdentity:params[4],cAction:params[5],jResult:JSON.parse(params[6])});
      else if(sql.includes('FROM "FactDetail" d JOIN "FactMaster"')) {const group=facts.get(params[0]);if(group?.nUserid===params[1])data=[group];}
      else if(sql===LIVE_QFACT_SNAPSHOT_SQL) data=[await snapshotOf(params)];
      else if(sql===LIVE_QFACT_APPLY_SQL) return applyEmulated(JSON.parse(params[0]));
      return {success:true,data};
    }),
  };
  // The one-call path's read and write, emulated from this fixture's own answers to the step-by-step queries (so a
  // test that overrides one of those overrides it for both paths): realtime.live_qfact_owners / _capture_apply.
  const ask=async(sql:string,params:unknown[])=>(await db.rowQuery(sql,params)).data;
  const ownersOf=async(ses:string,actor:string,run:string,identities:string[])=>{
    const owners:Record<string,any[]>={};
    for(const identity of identities){
      owners[identity]=[];
      for(const group of await ask(LIVE_QFACT_FIND_SQL,[ses,actor,JSON.stringify([{capture:'live-instant',run,identity}])]))
        owners[identity].push(JSON.parse(JSON.stringify({nFSid:group.nFSid,dCreateDt:group.dCreateDt,jCordinates:group.jCordinates,
          bLiveCapturePristine:group.bLiveCapturePristine,issues:(await ask(LIVE_QFACT_ISSUES_SQL,[group.nFSid])).map(row=>[row.id,row.nImpactid,row.nRelevanceid])})));
    }
    return owners;
  };
  async function snapshotOf([actor,ses,req,caseId,run,identities]:any[]){
    const legacy:string[]=[];
    for(const identity of identities) if((await ask(LIVE_QFACT_LEGACY_SQL,[ses,actor,JSON.stringify([{identity}]),identity])).length) legacy.push(identity);
    const [receipt]=await ask(LIVE_QFACT_RECEIPT_SQL,[actor,ses,req]);
    const [unassigned]=await ask(LIVE_QFACT_UNASSIGNED_SQL,[caseId]);
    return {owners:await ownersOf(ses,actor,run,identities),receipt:receipt?{cRun:receipt.cRun,cIdentity:receipt.cIdentity,cAction:receipt.cAction}:null,
      legacy,unassigned:unassigned?.id??null};
  }
  /** `stale`: how many apply calls answer "stale" first (another write between the read and the write). */
  const apply={stale:0,calls:0};
  async function applyEmulated(p:any){
    apply.calls++;
    const answer=(value:unknown)=>({success:true,data:[{answer:value}]});
    if(record.cStatus!=='R'||(record as any).isUploaded||(record as any).dDelDt||(record as any).dEntryEndedAt) return answer({status:'gone'});
    if(apply.stale>0){apply.stale--;return answer({status:'stale'});}
    if((record.nEntryEventid||`session:${record.nSesid}`)!==p.cRun||(await ask(LIVE_QFACT_RECEIPT_SQL,[p.nUserid,p.nSesid,p.nRequestid])).length
      ||JSON.stringify(await ownersOf(p.nSesid,p.nUserid,p.run,p.identities))!==JSON.stringify(p.owners)) return answer({status:'stale'});
    const before=structuredClone([...facts]);
    const ids:Record<string,string>={};const real=(id:string)=>ids[id]??id;
    try{
      for(const op of p.ops){
        if(op.op==='create'){
          const body={...op.body,jCordinates:JSON.parse(op.body.jCordinates)};
          const fact=await (db.executeRef as any)('fact_insert',body,'realtime');
          const row:any=fact.success&&fact.data[0][0];
          if(!row||Number(row.msg)!==1||!row.nFSid) throw new Error('fact');
          const detail=await (db.executeRef as any)('fact_insert_detail',{...body,nFSid:row.nFSid},'realtime');
          if(!detail.success||(detail.data[0]??[]).some((item:any)=>Number(item.msg)!==1)) throw new Error('detail');
          if(JSON.parse(body.jIssues).length&&!(await (db.executeRef as any)('fact_insert_issues',{...body,nFSid:row.nFSid},'realtime')).success) throw new Error('issues');
          ids[op.ref]=row.nFSid;
        } else if(op.op==='update') await ask(LIVE_QFACT_UPDATE_SQL,[real(op.id),JSON.stringify(op.jOT),JSON.stringify(op.coordinates),op.nPage,op.nLine]);
        else for(const sql of LIVE_QFACT_REMOVE_SQLS) await ask(sql,[real(op.id)]);
      }
      let text=JSON.stringify(p.result);for(const [ref,id] of Object.entries(ids)) text=text.split(ref).join(id);
      await ask(LIVE_QFACT_RECEIPT_INSERT_SQL,[p.nUserid,p.nSesid,p.nRequestid,p.cRun,p.cIdentity,p.cAction,text]);
      return answer({status:'ok',result:JSON.parse(text)});
    }catch{facts.clear();for(const [key,value] of before)facts.set(key,value);return {success:false,data:[]};}
  }
  const request=(line:number,action:'mark'|'unmark'='mark',extra:Record<string,unknown>={})=>({nCaseid:CASE,nSesid:SES,cRun:RUN,identity:String(line),page:1,line,action,
    nRequestid:`77777777-7777-4777-8777-${String(++requestSeq).padStart(12,'0')}`,...extra});
  const capture=(line:number,action:'mark'|'unmark'='mark',actor=user,extra:Record<string,unknown>={})=>captureLiveQfact(db as any,feed as any,request(line,action,extra) as any,actor,Date.now(),undefined,notify);
  return {db,feed,facts,groups,notify,record,request,capture,tuples,caseIssues,apply};
}

describe('ordinary QFACT instant persistence',()=>{
  beforeEach(()=>jest.mocked(assertCanCreateFact).mockResolvedValue(undefined));
  it('creates instantly and extends consecutive clicks within 30 s of the last capture, whatever the hearing pause',async()=>{
    const f=fixture();
    const first:any=await f.capture(1), second:any=await f.capture(2),third:any=await f.capture(3),fourth:any=await f.capture(4);
    // Option B measures the click, not the testimony: the 35 s hearing pause before line 4 no longer splits.
    expect([second.nFSid,third.nFSid,fourth.nFSid]).toEqual([first.nFSid,first.nFSid,first.nFSid]);
    expect(f.facts.size).toBe(1);
    expect(f.db.executeRef).toHaveBeenCalledWith('fact_insert',expect.objectContaining({cFtype:'QF',nMasterid:ME,jIssues:JSON.stringify([[UNASSIGNED,0,0]]),nColorid:UNASSIGNED}),'realtime');
    expect(fourth.groups[0].coordinates.map(line=>line.identity)).toEqual(['1','2','3','4']);
  });
  it('uses verified hearing provenance for CaseView independently of arrival/display times',async()=>{
    const f=fixture();
    Object.assign(f.record,{cProtocol:'C'});
    f.tuples.forEach(tuple=>{tuple[0]='18:00:00';tuple[4]=undefined;tuple[5]=undefined;});
    const first:any=await f.capture(1),second:any=await f.capture(2);
    expect(second.nFSid).toBe(first.nFSid);
    expect(f.facts.size).toBe(1);
  });
  it('joins only the QFACT above a clicked line and never merges it with the QFACT below (QA N7)',async()=>{
    const f=fixture(Array.from({length:6},(_,i)=>`10:00:0${i}:00`));
    await f.capture(1);const below:any=await f.capture(5);
    expect(f.facts.size).toBe(2);
    const result:any=await f.capture(2);
    expect(f.facts.size).toBe(2);
    expect(result.groups[0].coordinates.map(line=>[line.identity,!!line.filled])).toEqual([['1',false],['2',false]]);
    expect(result.removedIds).toEqual([]);
    expect(f.facts.get(below.nFSid).jCordinates.map(line=>line.identity)).toEqual(['5']);
  });
  it('does not merge users or edited/enriched QFACTs',async()=>{
    const f=fixture();const first:any=await f.capture(1);
    f.facts.get(first.nFSid).bLiveCapturePristine=false;
    await f.capture(2);await f.capture(3,'mark',{userId:OTHER,isAdmin:false});
    expect(f.facts.size).toBe(3);
    expect(f.facts.get(first.nFSid).jCordinates.map(line=>line.identity)).toEqual(['1']);
  });
  it('captures individual QFACTs when time is missing or merely a display/receipt time',async()=>{
    const f=fixture();f.tuples.forEach(tuple=>tuple[10]=null);
    await f.capture(1);await f.capture(2);expect(f.facts.size).toBe(2);
  });
  it('uses only server transcript text/time and refuses a stale identity or formal run',async()=>{
    const f=fixture();const request=f.request(1);request.identity='not-current';
    await expect(captureLiveQfact(f.db as any,f.feed as any,request,user)).rejects.toBeInstanceOf(ConflictException);
    f.record.nEntryEventid='new-run';
    await expect(f.capture(1)).rejects.toBeInstanceOf(ConflictException);
    expect(f.facts.size).toBe(0);
  });
  it('refuses outside live sessions and preserves permission errors',async()=>{
    const f=fixture();f.record.cStatus='E';await expect(f.capture(1)).rejects.toBeInstanceOf(ConflictException);
    jest.mocked(assertCanCreateFact).mockRejectedValueOnce(new ForbiddenException());
    await expect(f.capture(1)).rejects.toBeInstanceOf(ForbiddenException);
    expect(f.db.executeRef).not.toHaveBeenCalled();
  });
  it('retries are idempotent even after the captured line has been removed',async()=>{
    const f=fixture(), request=f.request(1);
    const first:any=await captureLiveQfact(f.db as any,f.feed as any,request,user);
    await f.capture(1,'unmark');
    const retry:any=await captureLiveQfact(f.db as any,f.feed as any,request,user);
    expect(first.groups).toHaveLength(1);expect(retry.groups).toEqual([]);expect(f.facts.size).toBe(0);
  });
  it('shrinks an edge and splits a middle unmark, retaining the earliest segment id',async()=>{
    const f=fixture();const first:any=await f.capture(1);await f.capture(2);await f.capture(3);
    const split:any=await f.capture(2,'unmark');
    expect(split.groups.map(group=>group.coordinates.map(line=>line.identity))).toEqual([['1'],['3']]);
    expect(split.groups[0].nFSid).toBe(first.nFSid);
    await f.capture(3,'unmark');expect(f.facts.size).toBe(1);
  });
  it('never silently unmarks an enriched group',async()=>{
    const f=fixture();const first:any=await f.capture(1);f.facts.get(first.nFSid).bLiveCapturePristine=false;
    await expect(f.capture(1,'unmark')).rejects.toBeInstanceOf(ConflictException);
    expect(f.facts.size).toBe(1);
  });
  it('rolls back a partially staged QFACT when detail persistence fails',async()=>{
    const f=fixture();f.db.executeRef.mockImplementationOnce(async()=>{
      f.facts.set('partial',{});return {success:true,data:[[{msg:1,nFSid:'partial'}]]};
    }).mockImplementationOnce(async()=>({success:false,data:[]}));
    await expect(f.capture(1)).rejects.toThrow();expect(f.facts.size).toBe(0);
  });
  it('returns the authoritative live run context without writing',async()=>{
    const f=fixture();expect(await liveQfactContext(f.db as any,f.request(1),user)).toEqual({msg:1,cRun:RUN});
    expect(f.db.executeRef).not.toHaveBeenCalled();
  });
  it('does not duplicate or silently unmark a converted historical QFACT',async()=>{
    const f=fixture();const query=f.db.rowQuery.getMockImplementation()!;
    f.db.rowQuery.mockImplementation(async(sql,params)=>sql===LIVE_QFACT_LEGACY_SQL?{success:true,data:[{nFSid:'converted'}]}:query(sql,params));
    await expect(f.capture(1)).rejects.toThrow('already belongs to a QFACT');
    await expect(f.capture(1,'unmark')).rejects.toThrow('already belongs to a QFACT');
    expect(f.db.executeRef).not.toHaveBeenCalled();
  });
  it('never extends an earlier formal run, even with an adjacent source line',async()=>{
    const f=fixture();const first:any=await f.capture(1);
    f.record.nEntryEventid='restarted-run';const request=f.request(2);request.cRun='restarted-run';
    const second:any=await captureLiveQfact(f.db as any,f.feed as any,request,user);
    expect(second.nFSid).not.toBe(first.nFSid);expect(f.facts.size).toBe(2);
  });
  // User 2026-11-04: a late click still joins when the lines were spoken within 30 s; over 30 s spoken AND clicked late,
  // it is a new QFACT and the result says why.
  it('a late click joins when the lines were spoken within 30 s; not when they were spoken over 30 s apart',async()=>{
    jest.useFakeTimers();
    try {
      // Hearing times: 1 10:00:00, 2 10:00:10, 3 10:00:35, 4 10:01:10.
      const f=fixture();const first:any=await f.capture(1);
      jest.advanceTimersByTime(30_000);const second:any=await f.capture(2);
      expect(second.nFSid).toBe(first.nFSid);                  // clicked within 30 s
      jest.advanceTimersByTime(30_001);const third:any=await f.capture(3);
      expect(third.nFSid).toBe(first.nFSid);                   // clicked late, spoken 25 s after line 2
      jest.advanceTimersByTime(30_001);const fourth:any=await f.capture(4);
      expect(fourth.nFSid).not.toBe(first.nFSid);              // clicked late, spoken 35 s after line 3
      expect(fourth.notJoined).toBe('time');expect(f.facts.size).toBe(2);
    } finally {jest.useRealTimers();}
  });
  it('falls back to the hearing gap for a QFACT stored before capture times existed',async()=>{
    jest.useFakeTimers();
    try {
      // Hearing times: line 1 10:00:00, 2 10:00:10, 3 10:00:35, 4 10:01:10. Lines 1-2 stored without capture times.
      const legacy=async()=>{
        const f=fixture();const first:any=await f.capture(1);await f.capture(2);
        const group=f.facts.get(first.nFSid);group.jCordinates=group.jCordinates.map(({at,...line})=>line);
        jest.advanceTimersByTime(20*60*1000);return {f,first};
      };
      const a=await legacy();const third:any=await a.f.capture(3);
      expect(third.nFSid).toBe(a.first.nFSid);                 // 25 s after line 2
      const b=await legacy();const fourth:any=await b.f.capture(4);
      expect(fourth.nFSid).not.toBe(b.first.nFSid);            // 60 s after line 2
    } finally {jest.useRealTimers();}
  });
  // User 2026-11-04 (review): the writer's correction of a captured live line (same identity and clock) no longer
  // freezes the QFact — the next line joins and the QFact takes the corrected words. A moved line still does not.
  it('extends a group whose neighbour line the writer corrected in place, taking the corrected words',async()=>{
    const f=fixture();const first:any=await f.capture(1);f.tuples[0][1]=[...'corrected words'].map(c=>c.charCodeAt(0));
    const second:any=await f.capture(2);expect(second.nFSid).toBe(first.nFSid);expect(second.notJoined).toBeUndefined();
    expect(f.facts.get(first.nFSid).jCordinates[0].text).toBe('corrected words');
  });
  it('a group whose line moved in the feed (another identity) stays apart, and is not called "edited"',async()=>{
    const f=fixture();const first:any=await f.capture(1);f.tuples[0][6]='moved-1';
    const second:any=await f.capture(2);expect(second.nFSid).not.toBe(first.nFSid);expect(second.notJoined).toBeUndefined();
  });
  it('joins the next line after normal live typing completes a captured prefix',async()=>{
    const f=fixture();f.tuples[0][1]=[...'from the government'].map(c=>c.charCodeAt(0));
    const first:any=await f.capture(1);
    f.tuples[0][1]=[...'from the government of Kalia, which is our fictitious country'].map(c=>c.charCodeAt(0));
    const second:any=await f.capture(2);
    expect(second.nFSid).toBe(first.nFSid);
    expect(second.groups[0].coordinates[0].text).toBe('from the government of Kalia, which is our fictitious country');
    expect(f.facts.size).toBe(1);
  });
  it('groups adjacent source lines across a page boundary at exactly 30 seconds',async()=>{
    const f=fixture([...Array(25).fill('10:00:00:00'),'10:00:30:00']);
    f.feed.getPage.mockImplementation(async (_session,page)=>f.tuples.slice((page-1)*25,page*25));
    const first:any=await f.capture(25),request=f.request(26);request.page=2;request.line=1;
    const next:any=await captureLiveQfact(f.db as any,f.feed as any,request,user);
    expect(next.nFSid).toBe(first.nFSid);expect(next.groups[0].coordinates.map(line=>[line.p,line.l])).toEqual([[1,25],[2,1]]);
  });
});

describe('No gap fill (user 2026-11-04): a skipped line always starts a new QFACT',()=>{
  beforeEach(()=>jest.mocked(assertCanCreateFact).mockResolvedValue(undefined));
  const sixteen=()=>fixture(Array.from({length:16},(_,i)=>`10:00:${String(i*3).padStart(2,'0')}:00`));
  const ids=(result:any)=>result.groups.map(group=>group.coordinates.map(line=>Number(line.identity)));
  const all=(f:any)=>[...f.facts.values()].map((group:any)=>group.jCordinates.map(line=>Number(line.identity))).sort((a,b)=>a[0]-b[0]);
  it('10, 11, 13 within 30 s: two QFACTs, line 12 is not filled in',async()=>{
    const f=sixteen();const first:any=await f.capture(10);await f.capture(11);const last:any=await f.capture(13);
    expect(last.nFSid).not.toBe(first.nFSid);expect(f.facts.size).toBe(2);
    expect(all(f)).toEqual([[10,11],[13]]);
    expect(last.groups.flatMap(group=>group.coordinates).some(line=>line.filled)).toBe(false);
  });
  it('10 then 12 within 30 s: two QFACTs',async()=>{
    const f=sixteen();await f.capture(10);const last:any=await f.capture(12);
    expect(f.facts.size).toBe(2);expect(ids(last)).toEqual([[12]]);
  });
  it('a click two lines above a QFACT stays its own QFACT (the gap rule holds downward too)',async()=>{
    const f=sixteen();await f.capture(13);const last:any=await f.capture(11);
    expect(f.facts.size).toBe(2);expect(ids(last)).toEqual([[11]]);expect(last.removedIds).toEqual([]);
  });
  it('the user\'s sequence: 12, 13, then 16, 15, 14 within 30 s is ONE QFACT 12-16 (user 2026-11-04)',async()=>{
    const f=sixteen();const first:any=await f.capture(12);await f.capture(13);
    await f.capture(16);
    const up:any=await f.capture(15);                 // directly above 16: joins it
    expect(all(f)).toEqual([[12,13],[15,16]]);expect(up.removedIds).toEqual([]);
    const fill:any=await f.capture(14);               // between 13 and 15: merges both
    expect(all(f)).toEqual([[12,13,14,15,16]]);
    expect(fill.nFSid).toBe(first.nFSid);expect(fill.removedIds).toHaveLength(1);
  });
  // User 2026-11-04 replaces QA N7 here: each click fills a one-line gap within 30 s, so the QFACTs either side merge.
  it('QFACTs at 9, 11, 13, 15; clicks 10, 12, 14 fill the gaps and merge them into one QFACT',async()=>{
    const f=sixteen();
    for (const line of [15,13,11,9]) await f.capture(line);
    expect(f.facts.size).toBe(4);
    for (const [line,left] of [[10,3],[12,2],[14,1]] as const) {const result:any=await f.capture(line);expect(result.removedIds).toHaveLength(1);expect(f.facts.size).toBe(left);}
    expect(all(f)).toEqual([[9,10,11,12,13,14,15]]);
  });
  it('never joins an edited QFACT',async()=>{
    const f=sixteen();const edited:any=await f.capture(10);f.facts.get(edited.nFSid).bLiveCapturePristine=false;
    await f.capture(11);
    expect(f.facts.size).toBe(2);
    expect(f.facts.get(edited.nFSid).jCordinates.map(line=>line.identity)).toEqual(['10']);
  });
  it('gap fill: 5, 6, then 8, then 7 within 30 s is one QFACT 5-8; the upper QFACT keeps its id',async()=>{
    const f=sixteen();const upper:any=await f.capture(5);await f.capture(6);const lowerQf:any=await f.capture(8);
    expect(all(f)).toEqual([[5,6],[8]]);
    const merged:any=await f.capture(7);
    expect(all(f)).toEqual([[5,6,7,8]]);
    expect(merged.nFSid).toBe(upper.nFSid);
    expect(merged.removedIds).toEqual([lowerQf.nFSid]);
    expect(ids(merged)).toEqual([[5,6,7,8]]);
    // The merged-away QFact's issue rows go with it (review 2026-11-04).
    expect(f.db.rowQuery).toHaveBeenCalledWith('DELETE FROM "FMIssue" WHERE "nFSid"=$1::uuid',[lowerQf.nFSid]);
  });
  // User 2026-11-04: a gap filled long after still merges when the lines were spoken within 30 s; when line 8 was
  // spoken over 30 s after line 7 and clicked long before the fill, it stays its own QFACT.
  it('a late gap fill merges lines spoken within 30 s, not a line spoken over 30 s later',async()=>{
    const t0=Date.now();
    const spoken=fixture(Array.from({length:16},(_,i)=>`10:00:${String(i*3).padStart(2,'0')}:00`));
    const at=(f:any,line:number,now:number)=>captureLiveQfact(f.db as any,f.feed as any,f.request(line) as any,user,now);
    await at(spoken,5,t0);await at(spoken,6,t0+1_000);await at(spoken,8,t0+2_000);
    const merged:any=await at(spoken,7,t0+10*60_000);  // ten minutes later; 7 and 8 were spoken 3 s apart
    expect(merged.removedIds).toHaveLength(1);expect(all(spoken)).toEqual([[5,6,7,8]]);
    const paused=fixture(Array.from({length:16},(_,i)=>i<7 ? `10:00:${String(i*3).padStart(2,'0')}:00` : `10:01:${String(i*3).padStart(2,'0')}:00`));
    await at(paused,5,t0);await at(paused,6,t0+1_000);await at(paused,8,t0+2_000);
    const alone:any=await at(paused,7,t0+10*60_000);    // 8 was spoken 63 s after 7, and clicked long ago
    expect(alone.removedIds).toEqual([]);expect(all(paused)).toEqual([[5,6,7],[8]]);
  });
  it('a click directly above a QFACT joins it; that QFACT keeps its id',async()=>{
    const f=sixteen();const below:any=await f.capture(8);const result:any=await f.capture(7);
    expect(result.removedIds).toEqual([]);expect(all(f)).toEqual([[7,8]]);expect(result.nFSid).toBe(below.nFSid);
  });
  it('never merges an edited QFACT below, nor another user\'s',async()=>{
    const f=sixteen();await f.capture(5);const edited:any=await f.capture(7);f.facts.get(edited.nFSid).bLiveCapturePristine=false;
    const result:any=await f.capture(6);
    expect(result.removedIds).toEqual([]);expect(all(f)).toEqual([[5,6],[7]]);
    const g=sixteen();await g.capture(5);await g.capture(7,'mark',{userId:OTHER,isAdmin:false} as any);
    const other:any=await g.capture(6);
    expect(other.removedIds).toEqual([]);expect(g.facts.size).toBe(2);
  });
  it('unmarking a middle line splits the passage as before',async()=>{
    const f=sixteen();await f.capture(10);await f.capture(11);const joined:any=await f.capture(12);
    const split:any=await f.capture(11,'unmark');
    expect(ids(split)).toEqual([[10],[12]]);expect(split.groups[0].nFSid).toBe(joined.nFSid);
  });
});

/** User 2026-11-04 (boss's recording + same-issue rule): lines spoken within 30 s join whenever they are clicked, in any
 *  order, and only lines marked with the same issues join or merge. */
describe('round trips per mark (live test 2026-11-04: ~20 of ~50 ms each made a mark take 1.1-1.8 s)',()=>{
  beforeEach(()=>jest.mocked(assertCanCreateFact).mockResolvedValue(undefined));
  stepIt('sets the write flag with the lock, never turns it off, reads Unassigned once and no neighbour issues separately',async()=>{
    const f=fixture();
    await f.capture(1);
    f.db.rowQuery.mockClear();
    const second:any=await f.capture(2);
    expect(f.facts.size).toBe(1);
    expect(second.groups[0].coordinates.map(line=>line.identity)).toEqual(['1','2']);
    const sqls=f.db.rowQuery.mock.calls.map(([sql])=>sql as string);
    expect(sqls.filter(sql=>sql.includes('set_config'))).toEqual([expect.stringContaining('pg_advisory_xact_lock')]);
    expect(sqls.some(sql=>sql.includes("'off'"))).toBe(false);
    expect(sqls.filter(sql=>sql===LIVE_QFACT_UNASSIGNED_SQL)).toHaveLength(1);
    expect(sqls).not.toContain(LIVE_QFACT_ISSUES_SQL);
  });
});

describe('capture timing (Server-Timing, 2026-11-04)',()=>{
  beforeEach(()=>jest.mocked(assertCanCreateFact).mockResolvedValue(undefined));
  stepIt('times the phases in order and every database call and feed page of a capture',async()=>{
    const f=fixture();
    await f.capture(1);
    f.db.rowQuery.mockClear();f.db.executeRef.mockClear();f.feed.getPage.mockClear();
    const timing=new CaptureTiming();
    const result:any=await captureLiveQfact(f.db as any,f.feed as any,f.request(2) as any,user,Date.now(),timing);
    expect(result.groups[0].coordinates.map(line=>line.identity)).toEqual(['1','2']);
    const header=timing.header();
    expect(header.split(', ').slice(0,4).map(entry=>entry.split(';')[0])).toEqual(['gate','begin','work','commit']);
    const calls=f.db.rowQuery.mock.calls.length+f.db.executeRef.mock.calls.length;
    expect(header).toContain(`desc="${calls} calls"`);
    expect(header).toContain(`desc="${f.feed.getPage.mock.calls.length} pages"`);
  });
});

describe('joining by transcript time and issues (user 2026-11-04)',()=>{
  beforeEach(()=>jest.mocked(assertCanCreateFact).mockResolvedValue(undefined));
  const ISSUE_B='aaaaaaaa-bbbb-4ccc-8ddd-000000000002', ISSUE_C='aaaaaaaa-bbbb-4ccc-8ddd-000000000003';
  const all=(f:any)=>[...f.facts.values()].map((group:any)=>group.jCordinates.map(line=>Number(line.identity))).sort((a,b)=>a[0]-b[0]);
  const issuesOf=(f:any)=>[...f.facts.values()].sort((a:any,b:any)=>Number(a.jCordinates[0].identity)-Number(b.jCordinates[0].identity))
    .map((group:any)=>(group.issues??[]).map(tuple=>tuple[0]));
  const pick=(...ids:string[])=>({jIssues:JSON.stringify(ids.map(id=>[id,0,0]))});
  const setup=(times:string[])=>{const f=fixture(times);f.caseIssues.push(ISSUE_B,ISSUE_C);
    const at=(line:number,now:number,extra:Record<string,unknown>={})=>captureLiveQfact(f.db as any,f.feed as any,f.request(line,'mark',extra) as any,user,now);
    return {f,at};};
  const twenty=()=>Array.from({length:20},(_,i)=>`10:00:${String(i*2).padStart(2,'0')}:00`);

  it('the recording: 14, 15, then 18, 16, 17 a minute apart (spoken 11:29:38-11:30:01) is ONE QFACT 14-18',async()=>{
    const times=Array.from({length:20},(_,i)=>`11:29:${String(Math.min(59,i*3)).padStart(2,'0')}:00`);
    Object.assign(times,{13:'11:29:38:00',14:'11:29:48:00',15:'11:29:51:00',16:'11:29:57:00',17:'11:30:01:00'});
    const {f,at}=setup(times);const t0=Date.now();
    const first:any=await at(14,t0);await at(15,t0+5_000);await at(18,t0+40_000);await at(16,t0+80_000);
    const last:any=await at(17,t0+120_000);
    expect(all(f)).toEqual([[14,15,16,17,18]]);expect(last.nFSid).toBe(first.nFSid);
  });

  it('quick clicks still join over a witness pause of more than 30 s (line 11 spoken 40 s after 10)',async()=>{
    const times=twenty();times[10]='10:00:58:00';           // line 11 spoken 40 s after line 10 (10:00:18)
    const {f,at}=setup(times);const t0=Date.now();
    await at(10,t0);const second:any=await at(11,t0+2_000);
    expect(all(f)).toEqual([[10,11]]);expect(second.notJoined).toBeUndefined();
  });

  it('5, 6, 7 with A; 9, 10 with B; 8 with C is THREE QFACTs, and 8 says why',async()=>{
    const {f,at}=setup(twenty());const t0=Date.now();
    for (const line of [5,6,7]) await at(line,t0,pick(ISSUE_A));
    for (const line of [9,10]) await at(line,t0,pick(ISSUE_B));
    const eight:any=await at(8,t0+1_000,pick(ISSUE_C));
    expect(all(f)).toEqual([[5,6,7],[8],[9,10]]);
    expect(issuesOf(f)).toEqual([[ISSUE_A],[ISSUE_C],[ISSUE_B]]);
    expect(eight.removedIds).toEqual([]);expect(eight.notJoined).toBe('issues');
  });

  it('8 with A joins 5-7 only; 8 with B joins 9-10 only — nobody\'s issues are lost',async()=>{
    for (const [issue,expected] of [[ISSUE_A,[[5,6,7,8],[9,10]]],[ISSUE_B,[[5,6,7],[8,9,10]]]] as const) {
      const {f,at}=setup(twenty());const t0=Date.now();
      for (const line of [5,6,7]) await at(line,t0,pick(ISSUE_A));
      for (const line of [9,10]) await at(line,t0,pick(ISSUE_B));
      const eight:any=await at(8,t0,pick(issue));
      expect(all(f)).toEqual(expected);expect(eight.removedIds).toEqual([]);expect(eight.notJoined).toBeUndefined();
      expect(issuesOf(f)).toEqual([[ISSUE_A],[ISSUE_B]]);
    }
  });

  it('the same issues in another order join; "A + Unassigned" joins "A"; Unassigned does not join A',async()=>{
    const {f,at}=setup(twenty());const t0=Date.now();
    await at(5,t0,pick(ISSUE_A,ISSUE_B));await at(6,t0,pick(ISSUE_B,ISSUE_A));
    await at(7,t0,pick(ISSUE_A,ISSUE_B,UNASSIGNED));
    expect(all(f)).toEqual([[5,6,7]]);
    const g=setup(twenty());await g.at(5,t0,pick(ISSUE_A));await g.at(6,t0,pick(ISSUE_A,UNASSIGNED));
    const plain:any=await g.at(7,t0);                     // nothing picked = Unassigned
    expect(all(g.f)).toEqual([[5,6],[7]]);expect(plain.notJoined).toBe('issues');
  });

  it('a QFACT stored with no issue rows counts as Unassigned',async()=>{
    const {f,at}=setup(twenty());const t0=Date.now();
    const old:any=await at(5,t0);delete f.facts.get(old.nFSid).issues;
    await at(6,t0);expect(all(f)).toEqual([[5,6]]);
  });

  it('an edited QFACT next to the click: a new QFACT, and the result says so',async()=>{
    const {f,at}=setup(twenty());const t0=Date.now();
    const edited:any=await at(5,t0);f.facts.get(edited.nFSid).bLiveCapturePristine=false;
    const six:any=await at(6,t0);expect(six.notJoined).toBe('edited');
  });

  it('a joining click with an issue that is not in the case is refused, writing nothing',async()=>{
    const {f,at}=setup(twenty());const t0=Date.now();
    await at(5,t0,pick(ISSUE_A));
    await expect(at(6,t0,pick('99999999-0000-4000-8000-00000000dead'))).rejects.toThrow();
    expect(all(f)).toEqual([[5]]);
  });
});

describe('instant QFACT issues (RT QA 2026-10-29, F-19)',()=>{
  beforeEach(()=>jest.mocked(assertCanCreateFact).mockResolvedValue(undefined));
  it('stores the issues the user pre-selected',async()=>{
    const f=fixture();
    const res:any=await f.capture(1,'mark',user,{jIssues:JSON.stringify([[ISSUE_A,0,0]])});
    expect(f.facts.get(res.nFSid).issues).toEqual([[ISSUE_A,0,0]]);
    expect(f.db.executeRef).toHaveBeenCalledWith('fact_insert',expect.objectContaining({nColorid:ISSUE_A}),'realtime');
  });
  it('falls back to the case Unassigned issue when none is picked',async()=>{
    const f=fixture();
    const res:any=await f.capture(1);
    expect(f.facts.get(res.nFSid).issues).toEqual([[UNASSIGNED,0,0]]);
  });
  it('refuses an issue that is not in the case, writing nothing',async()=>{
    const f=fixture();
    await expect(f.capture(1,'mark',user,{jIssues:JSON.stringify([['12121212-1212-4212-8212-121212121212',0,0]])})).rejects.toThrow(/Unknown issue/);
    expect(f.facts.size).toBe(0);
  });
  it('a segment split off by an unmark keeps the issues of its QFACT',async()=>{
    const f=fixture(['10:00:00:00','10:00:05:00','10:00:10:00','10:00:15:00']);
    const pick={jIssues:JSON.stringify([[ISSUE_A,0,0]])};
    await f.capture(1,'mark',user,pick); await f.capture(2,'mark',user,pick); await f.capture(3,'mark',user,pick);
    const res:any=await f.capture(2,'unmark');
    expect(res.groups).toHaveLength(2);
    for(const group of res.groups) expect(f.facts.get(group.nFSid).issues).toEqual([[ISSUE_A,0,0]]);
  });
});

describe('private group on a live QFACT capture',()=>{
  beforeEach(()=>jest.mocked(assertCanCreateFact).mockResolvedValue(undefined));
  // With LIVE_QFACT_SINGLE_CALL=1 the group is assigned inside a transaction the one-call path opens itself; the
  // single-call spec's check that "only a retried request goes step by step" is about captures without a group.
  afterEach(()=>{ stepByStep.delete(expect.getState().currentTestName??''); });
  const G1='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', G2='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const assignCalls=(f:any)=>f.db.executeRef.mock.calls.filter(([name]:any[])=>name==='private_group_assign');

  it('a marked line is filed in the group once, inside the transaction, after the capture write',async()=>{
    const f=fixture();
    const res:any=await f.capture(1,'mark',user,{nPrivateGroupid:G1});
    expect(assignCalls(f)).toEqual([['private_group_assign',{nMasterid:ME,nFSid:res.nFSid,nPrivateGroupid:G1}]]);
    expect(f.groups.get(res.nFSid)).toBe(G1);
    expect(f.db.saveAtomically).toHaveBeenCalled();
    const order=f.db.executeRef.mock.calls.map(([name]:any[])=>name as string);
    expect(order[order.length-1]).toBe('private_group_assign');
    expect(f.notify).toHaveBeenCalledTimes(1);
    expect(f.notify).toHaveBeenCalledWith(ME);
  });

  it('a refused assignment rolls the capture back, answers a failure with the generic message and sends no notice',async()=>{
    const f=fixture();
    const foreign=`${FOREIGN_GROUP_PREFIX}ffff-4fff-8fff-ffffffffffff`;
    const res:any=await f.capture(1,'mark',user,{nPrivateGroupid:foreign});
    expect(res.msg).toBe(-1);
    expect(res.value).toBe('Private Group could not be saved');
    expect(JSON.stringify(res)).not.toContain(foreign);
    expect(JSON.stringify(res)).not.toContain('someone else');
    expect(f.facts.size).toBe(0);
    expect(f.groups.size).toBe(0);
    expect(f.notify).not.toHaveBeenCalled();
  });

  it('leaves the group alone when the field is absent',async()=>{
    const f=fixture();
    await f.capture(1);
    expect(assignCalls(f)).toHaveLength(0);
    expect(f.notify).not.toHaveBeenCalled();
  });

  it('null files the QFACT in no group',async()=>{
    const f=fixture();
    const res:any=await f.capture(1,'mark',user,{nPrivateGroupid:null});
    expect(assignCalls(f)).toEqual([['private_group_assign',{nMasterid:ME,nFSid:res.nFSid,nPrivateGroupid:null}]]);
  });

  it('an unmark ignores the field',async()=>{
    const f=fixture();
    await f.capture(1);
    await f.capture(1,'unmark',user,{nPrivateGroupid:G1});
    expect(assignCalls(f)).toHaveLength(0);
  });

  it('a line joins a neighbouring QFACT with the same Issues only when the group is the same',async()=>{
    const same=fixture();
    const first:any=await same.capture(1,'mark',user,{nPrivateGroupid:G1});
    const joined:any=await same.capture(2,'mark',user,{nPrivateGroupid:G1});
    expect(joined.nFSid).toBe(first.nFSid);
    expect(same.facts.size).toBe(1);

    const other=fixture();
    const a:any=await other.capture(1,'mark',user,{nPrivateGroupid:G1});
    const b:any=await other.capture(2,'mark',user,{nPrivateGroupid:G2});
    expect(b.nFSid).not.toBe(a.nFSid);
    expect(other.facts.size).toBe(2);
    expect(other.groups.get(a.nFSid)).toBe(G1);
    expect(other.groups.get(b.nFSid)).toBe(G2);

    const grouped=fixture();
    await grouped.capture(1,'mark',user,{nPrivateGroupid:G1});
    await grouped.capture(2,'mark',user,{nPrivateGroupid:null});
    expect(grouped.facts.size).toBe(2);
  });

  it('both without a group still join, as before',async()=>{
    const f=fixture();
    const first:any=await f.capture(1,'mark',user,{nPrivateGroupid:null});
    const second:any=await f.capture(2,'mark',user,{nPrivateGroupid:null});
    expect(second.nFSid).toBe(first.nFSid);
    const g=fixture();
    const one:any=await g.capture(1);
    const two:any=await g.capture(2);
    expect(two.nFSid).toBe(one.nFSid);
  });

  it('twenty captures with a group are twenty assignments and no list call',async()=>{
    const f=fixture(Array.from({length:20},(_,i)=>`10:00:${String(i).padStart(2,'0')}:00`));
    for(let line=1;line<=20;line++) await f.capture(line,'mark',user,{nPrivateGroupid:G1});
    expect(assignCalls(f)).toHaveLength(20);
    expect(f.db.executeRef.mock.calls.map(([name]:any[])=>name as string).filter((name:string)=>/list/i.test(name))).toEqual([]);
    expect(f.notify).toHaveBeenCalledTimes(20);
  });
});
