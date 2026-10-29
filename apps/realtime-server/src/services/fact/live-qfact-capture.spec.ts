import { ConflictException, ForbiddenException } from '@nestjs/common';
import { sourceHearingTimecode } from '@app/api-contracts';
import { captureLiveQfact, LIVE_QFACT_FIND_SQL, LIVE_QFACT_ISSUES_SQL, LIVE_QFACT_SESSION_SQL, LIVE_QFACT_LEGACY_SQL, LIVE_QFACT_UNASSIGNED_SQL, liveQfactContext } from './live-qfact-capture';
import { ISSUES_IN_CASE_SQL } from './mark-write-guards';
import { assertCanCreateFact } from './fact-create-gate';

jest.mock('./fact-create-gate', () => ({assertCanCreateFact:jest.fn().mockResolvedValue(undefined)}));
const CASE='33333333-3333-4333-8333-333333333333', SES='44444444-4444-4444-8444-444444444444';
const ME='11111111-1111-4111-8111-111111111111', OTHER='22222222-2222-4222-8222-222222222222';
const RUN='55555555-5555-4555-8555-555555555555';
const UNASSIGNED='88888888-8888-4888-8888-888888888888', ISSUE_A='99999999-9999-4999-8999-999999999999';
const user={userId:ME,isAdmin:false};

function fixture(times=['10:00:00:00','10:00:10:00','10:00:35:00','10:01:10:00']) {
  let sequence=0,requestSeq=0;
  const facts=new Map<string,any>(),receipts=new Map<string,any>();
  const record={nSesid:SES,cStatus:'R',nLines:25,nEntryEventid:RUN};
  const caseIssues=[UNASSIGNED,ISSUE_A];
  const tuples=times.map((time,index)=>[time,[...`line ${index+1}`].map(c=>c.charCodeAt(0)),index,undefined,1,index+1,String(index+1),null,null,null,sourceHearingTimecode(time)]);
  const feed={getPage:jest.fn(async (_session,page)=>page===1 ? tuples : [])};
  const db={
    saveAtomically:jest.fn(async run=>{
      const before=structuredClone([...facts]);
      try {return await run();} catch(error) {facts.clear();for(const [key,value] of before)facts.set(key,value);throw error;}
    }),
    executeRef:jest.fn(async (name,body)=>{
      if(name==='fact_insert'){
        const nFSid=`66666666-6666-4666-8666-${String(++sequence).padStart(12,'0')}`;
        facts.set(nFSid,{nFSid,nUserid:body.nMasterid,nSesid:body.nSesid,dCreateDt:String(sequence),jCordinates:[],bLiveCapturePristine:false});
        return {success:true,data:[[{msg:1,nFSid}]]};
      }
      if(name==='fact_insert_detail') {facts.get(body.nFSid).jCordinates=body.jCordinates;return {success:true,data:[[{msg:1}]]};}
      if(name==='fact_insert_issues') {facts.get(body.nFSid).issues=JSON.parse(body.jIssues);return {success:true,data:[[{msg:1}]]};}
      throw new Error(name);
    }),
    rowQuery:jest.fn(async (sql,params)=>{
      let data:any[]=[];
      if(sql===LIVE_QFACT_SESSION_SQL) data=[record];
      else if(sql===LIVE_QFACT_UNASSIGNED_SQL) data=caseIssues.includes(UNASSIGNED)?[{id:UNASSIGNED}]:[];
      else if(sql===ISSUES_IN_CASE_SQL) data=params[0].filter(id=>caseIssues.includes(id)).map(id=>({id}));
      else if(sql===LIVE_QFACT_ISSUES_SQL) data=(facts.get(params[0])?.issues??[]).map(([id,i,r])=>({id,nImpactid:i,nRelevanceid:r}));
      else if(sql===LIVE_QFACT_FIND_SQL) {
        const [needle]=JSON.parse(params[2]);
        data=[...facts.values()].filter(group=>group.nUserid===params[1] && group.nSesid===params[0]
          && group.jCordinates.some(line=>line.capture===needle.capture && line.run===needle.run && line.identity===needle.identity));
      } else if(sql.startsWith('UPDATE "FactDetail"')) {
        Object.assign(facts.get(params[0]),{jOT:JSON.parse(params[1]),jCordinates:JSON.parse(params[2]),bLiveCapturePristine:true});
      } else if(sql.startsWith('DELETE FROM "FactMaster"')) facts.delete(params[0]);
      else if(sql.startsWith('SELECT "cRun"')) { const receipt=receipts.get(params.join(':'));if(receipt)data=[receipt]; }
      else if(sql.startsWith('INSERT INTO "LiveQfactRequest"')) receipts.set(params.slice(0,3).join(':'),{cRun:params[3],cIdentity:params[4],cAction:params[5],jResult:JSON.parse(params[6])});
      else if(sql.includes('FROM "FactDetail" d JOIN "FactMaster"')) {const group=facts.get(params[0]);if(group?.nUserid===params[1])data=[group];}
      return {success:true,data};
    }),
  };
  const request=(line:number,action:'mark'|'unmark'='mark',extra:Record<string,unknown>={})=>({nCaseid:CASE,nSesid:SES,cRun:RUN,identity:String(line),page:1,line,action,
    nRequestid:`77777777-7777-4777-8777-${String(++requestSeq).padStart(12,'0')}`,...extra});
  const capture=(line:number,action:'mark'|'unmark'='mark',actor=user,extra:Record<string,unknown>={})=>captureLiveQfact(db as any,feed as any,request(line,action,extra) as any,actor);
  return {db,feed,facts,record,request,capture,tuples,caseIssues};
}

describe('ordinary QFACT instant persistence',()=>{
  beforeEach(()=>jest.mocked(assertCanCreateFact).mockResolvedValue(undefined));
  it('creates instantly and extends using each source pair, with no first-line window',async()=>{
    const f=fixture();
    const first:any=await f.capture(1), second:any=await f.capture(2),third:any=await f.capture(3),fourth:any=await f.capture(4);
    expect([second.nFSid,third.nFSid]).toEqual([first.nFSid,first.nFSid]);
    expect(fourth.nFSid).not.toBe(first.nFSid);
    expect(f.facts.size).toBe(2);
    expect(f.db.executeRef).toHaveBeenCalledWith('fact_insert',expect.objectContaining({cFtype:'QF',nMasterid:ME,jIssues:JSON.stringify([[UNASSIGNED,0,0]]),nColorid:UNASSIGNED}),'realtime');
    expect(third.groups[0].coordinates.map(line=>line.identity)).toEqual(['1','2','3']);
  });
  it('uses verified hearing timestamps for CaseView independently of arrival/display times',async()=>{
    const f=fixture();
    Object.assign(f.record,{cProtocol:'C'});
    f.tuples.forEach(tuple=>{tuple[0]='18:00:00';tuple[4]=undefined;tuple[5]=undefined;});
    const first:any=await f.capture(1),second:any=await f.capture(2),third:any=await f.capture(3),fourth:any=await f.capture(4);
    expect([second.nFSid,third.nFSid]).toEqual([first.nFSid,first.nFSid]);
    expect(fourth.nFSid).not.toBe(first.nFSid);
    expect(f.facts.size).toBe(2);
  });
  it('can fill a previously unmarked hole but does not include the hole before capture',async()=>{
    const f=fixture();await f.capture(1);await f.capture(3);
    expect(f.facts.size).toBe(2);
    const result:any=await f.capture(2);
    expect(f.facts.size).toBe(1);
    expect(result.groups[0].coordinates.map(line=>line.identity)).toEqual(['1','2','3']);
    expect(result.removedIds).toHaveLength(1);
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
  it('keeps the hearing gap rule when the user marks the adjacent line much later',async()=>{
    jest.useFakeTimers();
    try {
      const f=fixture();const first:any=await f.capture(1);
      jest.advanceTimersByTime(20*60*1000);const second:any=await f.capture(2);
      expect(second.nFSid).toBe(first.nFSid);
    } finally {jest.useRealTimers();}
  });
  it('does not extend a group after its neighbour text has been corrected',async()=>{
    const f=fixture();const first:any=await f.capture(1);f.tuples[0][1]=[...'corrected words'].map(c=>c.charCodeAt(0));
    const second:any=await f.capture(2);expect(second.nFSid).not.toBe(first.nFSid);
    expect(f.facts.get(first.nFSid).jCordinates[0].text).toBe('line 1');
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
