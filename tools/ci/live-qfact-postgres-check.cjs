// Exercise real QFACT SPs and freeze triggers inside one always-rolled-back transaction.
const fs=require('node:fs'),assert=require('node:assert/strict'),{randomUUID}=require('node:crypto');
require('ts-node').register({transpileOnly:true});require('tsconfig-paths/register');
const {Client}=require('pg'), env=require('dotenv').parse(fs.readFileSync('.env.development'));
const {captureLiveQfact}=require('../../apps/realtime-server/src/services/fact/live-qfact-capture');
const {sourceHearingTimecode}=require('../../libs/api-contracts/src/responses/hearing-time');
const client=new Client({host:env.DB_HOST,port:Number(env.DB_PORT),user:env.DB_USERNAME,password:env.DB_PASSWORD,database:env.DB_DATABASE,
  connectionTimeoutMillis:10000,ssl:Number(env.DB_SSL)>0?{rejectUnauthorized:false}:undefined});
let savepoint=0;
const db={
  rowQuery:async(sql,params)=>{try{return {success:true,data:(await client.query(sql,params)).rows};}catch(error){return {success:false,error:error.message};}},
  executeRef:async(name,body)=>{
    assert.ok(['fact_insert','fact_insert_detail'].includes(name));
    await client.query(`SELECT realtime.et_${name}($1::json,'capturetest'::refcursor)`,[JSON.stringify(body)]);
    const result=await client.query('FETCH ALL FROM capturetest');await client.query('CLOSE capturetest');
    return {success:true,data:[result.rows]};
  },
  saveAtomically:async(run)=>{
    const name=`capture_${++savepoint}`;await client.query(`SAVEPOINT ${name}`);
    try {const result=await run();await client.query(`RELEASE SAVEPOINT ${name}`);return result;}
    catch(error){await client.query(`ROLLBACK TO SAVEPOINT ${name}`);throw error;}
  },
};
(async()=>{
  await client.connect();await client.query('BEGIN');
  assert.equal((await client.query('SELECT current_database() AS name')).rows[0].name,'etabella_tech_uuid');
  const migration=fs.readFileSync('assets/sql-migrations/2026-10-12_live_qfact_capture.up.sql','utf8')
    .replace(/^BEGIN;\s*$/m,'').replace(/^COMMIT;\s*$/m,'');
  await client.query(migration);
  await client.query(fs.readFileSync('assets/sql-migrations/2026-10-12_qfact_unassigned_reads.up.sql','utf8')
    .replace(/^BEGIN;\s*$/m,'').replace(/^COMMIT;\s*$/m,''));
  await client.query(fs.readFileSync('assets/sql-migrations/2026-10-13_qfact_legacy_conversion.up.sql','utf8')
    .replace(/^BEGIN;\s*$/m,'').replace(/^COMMIT;\s*$/m,''));
  const row=(await client.query(`SELECT s."nSesid",s."nCaseid",s."nEntryEventid",s."nLines",u."nUserid"
    FROM "RSessionMaster" s JOIN "TeamRelation" tr ON tr."nCaseid"=s."nCaseid" AND tr."cStatus"='A'
    JOIN "UserMaster" u ON u."nUserid"=tr."nUserid"
    WHERE s."cStatus"='R' AND s."nEntryEventid" IS NOT NULL AND s."dDelDt" IS NULL AND s."dEntryEndedAt" IS NULL
      AND COALESCE(s."isUploaded",false)=false LIMIT 1`)).rows[0];
  assert.ok(row,'A development live-session/admin fixture is required');
  const user={userId:row.nUserid,isAdmin:true};
  const times=['10:00:00:00','10:00:10:00','10:00:35:00','10:01:10:00'];
  const identities=times.map(()=>`test-${randomUUID()}`);
  const lines=times.map((time,index)=>[time,[...'QFACT rollback test'].map(c=>c.charCodeAt(0)),index,'FL',1,index+1,identities[index],null,null,null,sourceHearingTimecode(time)]);
  const feed={getPage:async(_session,page)=>page===1?lines:[]};
  const req=(line,action='mark')=>({nCaseid:row.nCaseid,nSesid:row.nSesid,cRun:row.nEntryEventid,nRequestid:randomUUID(),identity:identities[line-1],page:1,line,action});
  const capture=(line,action='mark')=>captureLiveQfact(db,feed,req(line,action),user);
  const firstRequest=req(1), first=await captureLiveQfact(db,feed,firstRequest,user);
  const second=await capture(2),third=await capture(3),fourth=await capture(4);
  assert.equal(first.nFSid,second.nFSid);assert.equal(first.nFSid,third.nFSid);assert.notEqual(first.nFSid,fourth.nFSid);
  const stored=(await client.query('SELECT "cFType","nUserid" FROM "FactMaster" WHERE "nFSid"=$1',[first.nFSid])).rows[0];
  assert.equal(stored.cFType,'QF');assert.equal(stored.nUserid,user.userId);
  assert.equal((await client.query('SELECT count(*)::int n FROM "FMIssue" WHERE "nFSid"=$1',[first.nFSid])).rows[0].n,0);
  await client.query(`SELECT realtime.et_navigate_get_all($1::json,'capture_nav'::refcursor,'capture_issues'::refcursor,'capture_links'::refcursor)`,
    [JSON.stringify({nSesid:row.nSesid,nUserid:row.nUserid,cSortby:'asc',nPageNumber:1,jFilter:'{}',historyEnabled:false,bIsTranscipt:false})]);
  const navigation=(await client.query('FETCH ALL FROM capture_nav')).rows;
  assert.ok(navigation.some(mark=>mark.nFSid===first.nFSid && mark.cSource==='QF'),'Unassigned QFACT must survive the ordinary navigation read');
  const filtered=(await client.query(`SELECT * FROM realtime.filter_marknav('{}'::jsonb,$1::uuid,$2::uuid,'QF',NULL::uuid,true)`,[row.nSesid,row.nUserid])).rows;
  assert.ok(filtered.some(mark=>mark.id===first.nFSid),'Empty ordinary filters must include Unassigned QFACTs');
  await client.query('CLOSE capture_nav');await client.query('CLOSE capture_issues');await client.query('CLOSE capture_links');
  await client.query(`SELECT public.et_realtime_get_issue_annotation_highlight_export($1::json,'capture_export'::refcursor,'capture_old_export'::refcursor)`,
    [JSON.stringify({nSessionid:row.nSesid,nCaseid:row.nCaseid,nUserid:row.nUserid,cTranscript:'N',bQfact:true,bQmark:false,jIssues:'[]',jHIssues:'[]',jPages:'[]'})]);
  const exported=(await client.query('FETCH ALL FROM capture_export')).rows;
  assert.ok(exported.some(mark=>mark.nIDid===first.nFSid),'Unassigned QFACT must survive the ordinary export read');
  await client.query('CLOSE capture_export');await client.query('CLOSE capture_old_export');
  const split=await capture(2,'unmark');assert.equal(split.groups.length,2);
  assert.equal(split.groups[0].nFSid,first.nFSid);assert.deepEqual(split.groups.map(g=>g.coordinates.map(line=>line.l)),[[1],[3]]);
  await capture(1,'unmark');
  const retry=await captureLiveQfact(db,feed,firstRequest,user);assert.equal(retry.groups.length,0);
  await client.query('UPDATE "FactDetail" SET "jTexts"=$2::jsonb WHERE "nFSid"=$1',[fourth.nFSid,'["edited note"]']);
  assert.equal((await client.query('SELECT "bLiveCapturePristine" FROM "FactDetail" WHERE "nFSid"=$1',[fourth.nFSid])).rows[0].bLiveCapturePristine,false);
  await assert.rejects(()=>capture(4,'unmark'),/edited/);
  await client.query('UPDATE "FactDetail" SET "jTexts"=$2::jsonb WHERE "nFSid"=$1',[fourth.nFSid,'[]']);
  assert.equal((await client.query('SELECT "bLiveCapturePristine" FROM "FactDetail" WHERE "nFSid"=$1',[fourth.nFSid])).rows[0].bLiveCapturePristine,false);
  console.log('PASS: real QFACT storage, Unassigned capture, pairwise grouping, split, retry idempotence and persistent enrichment freeze.');
})().catch(error=>{console.error(error.stack);process.exitCode=1;}).finally(async()=>{
  await client.query('ROLLBACK').catch(()=>{});await client.end();console.log('Development transaction rolled back; no migration or QFACT records retained.');
});
