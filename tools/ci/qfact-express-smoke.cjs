// Parser-generated source -> real Redis feed store -> real DbService/SPs -> ordinary QFACT reads/edit.
// Only creates/removes this run's test QFACTs in the dedicated fixture case.
const fs=require('node:fs'),assert=require('node:assert/strict'),{randomUUID}=require('node:crypto'),Redis=require('ioredis');
require('ts-node').register({transpileOnly:true});require('tsconfig-paths/register');
const {ConfigService}=require('@nestjs/config'),{DbService}=require('../../libs/global/src/db/pg/db.service'),{QueryBuilderService}=require('../../libs/global/src/db/pg/query-builder.service');
const {FactService}=require('../../apps/realtime-server/src/services/fact/fact.service'),{FeedDataService}=require('../../apps/realtime-server/src/services/feed-data/feed-data.service'),{UtilityService}=require('../../apps/realtime-server/src/services/utility/utility.service');
const e=require('dotenv').parse(fs.readFileSync('.env.development'));assert.equal(e.DB_DATABASE,'etabella_tech_uuid');
const artifactRoot=process.argv.includes('--caseview')?'.codex-artifacts/qfact-caseview':'.codex-artifacts/qfact-legacy';
const f=JSON.parse(fs.readFileSync(artifactRoot+'/fixture.json'));
const db=new DbService(new QueryBuilderService(),new ConfigService(e));const redis=new Redis(e.REDIS_URL);const ids=new Set(),events=[];
const cache={scanKeys:async()=>[`session:${f.sessionId}:1`],getValue:key=>redis.get(key),setValue:(key,value,ttl)=>redis.set(key,value,'EX',ttl||172800)};
const feed=new FeedDataService({server:{to:()=>({emit:()=>{}})}},cache,{error:()=>{},info:()=>{}},new UtilityService({}));
const svc=new FactService(db,new UtilityService({}),feed,{changed:payload=>events.push(payload)});
(async()=>{const existing=await db.rowQuery('SELECT count(*)::int n FROM "FactMaster" WHERE "nCaseid"=$1',[f.caseId]);assert.equal(existing.data[0].n,0,'Fixture already has user marks; refusing to change them');
const ctx=await svc.liveCaptureContext({nCaseid:f.caseId,nSesid:f.sessionId},{userId:f.ownerId,isAdmin:f.isAdmin});assert.equal(ctx.msg,1);
const request=(line,action='mark')=>({nCaseid:f.caseId,nSesid:f.sessionId,nRequestid:randomUUID(),cRun:ctx.cRun,identity:f.identities[line-1],page:1,line,action});
const call=async req=>{const r=await svc.captureLiveLine(req,{userId:f.ownerId,isAdmin:f.isAdmin});assert.equal(r.msg,1);r.groups.forEach(g=>ids.add(g.nFSid));return r;};
const firstRequest=request(1),a=await call(firstRequest),b=await call(request(2)),c=await call(request(3)),d=await call(request(4));
assert.equal(a.nFSid,b.nFSid);assert.equal(a.nFSid,c.nFSid);assert.notEqual(a.nFSid,d.nFSid);
assert.deepEqual(c.groups[0].coordinates.map(x=>x.l),[1,2,3]);
const retry=await call(firstRequest);assert.equal(retry.replayed,true);assert.equal(events.length,4);
const nav=await db.executeRef('navigate_get_all',{ref:3,nSesid:f.sessionId,nUserid:f.ownerId,cSortby:'asc',jFilter:'{}',bIsTranscipt:false},'realtime');assert.equal(nav.success,true);
assert.equal(nav.data[0].filter(row=>row.nFSid===a.nFSid && row.cSource==='QF').length,1);
const split=await call(request(2,'unmark'));assert.equal(split.groups.length,2);assert.equal(split.groups[0].nFSid,a.nFSid);
await svc.quickfactUpdate({nFSid:a.nFSid,nMasterid:f.ownerId,nColorid:null,jIssue:'[]',jContacts:'[]',jTexts:'["QFACT Express smoke note"]',cIsNote:'Y'});
await assert.rejects(()=>call(request(1,'unmark')),/edited/);
const detail=await db.rowQuery('SELECT "jTexts","bLiveCapturePristine" FROM "FactDetail" WHERE "nFSid"=$1',[a.nFSid]);assert.deepEqual(detail.data[0].jTexts,['QFACT Express smoke note']);assert.equal(detail.data[0].bLiveCapturePristine,false);
const report={passed:true,protocol:f.protocol||'B',parserVersion:f.parserVersion,hearingTimes:f.hearingTimes,realRedis:true,realDbService:true,pairwiseGrouping:true,idempotence:true,normalNavigation:true,middleSplit:true,unassignedNoteEditing:true,enrichmentProtected:true,ownerOnlyEvents:events.every(x=>x.users.length===1&&x.users[0]===f.ownerId)};
fs.writeFileSync(artifactRoot+'/smoke.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
})().catch(error=>{console.error(error.stack);process.exitCode=1;}).finally(async()=>{
if(ids.size)await db.saveAtomically(async()=>{const selected=await db.rowQuery('SELECT "nFSid" FROM "FactMaster" WHERE "nFSid"=ANY($1::uuid[]) AND "nCaseid"=$2 AND "nUserid"=$3 AND "cFType"=\'QF\'',[Array.from(ids),f.caseId,f.ownerId]);const owned=selected.data.map(x=>x.nFSid);for(const table of ['FMIssue','FactDetail','FactMaster'])await db.rowQuery(`DELETE FROM "${table}" WHERE "nFSid"=ANY($1::uuid[])`,[owned]);});
clearInterval(feed.flushTimer);await db.pool.end();redis.disconnect();console.log('Removed only the smoke run QFACTs; dedicated case/session/source remain ready for manual testing.');});
