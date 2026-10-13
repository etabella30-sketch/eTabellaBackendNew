/* Development-only SQL acceptance. Every fixture and migration statement is rolled back.
 * node tools/ci/test-realtime-entry.cjs */
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
require('dotenv').config({path:path.resolve(__dirname,'../../.env.development'),quiet:true});const {Client}=require('pg');
const C='20000000-0000-4000-8000-000000000001',C2='20000000-0000-4000-8000-000000000002';
const U='10000000-0000-4000-8000-000000000001',U2='10000000-0000-4000-8000-000000000002',ADMIN='10000000-0000-4000-8000-000000000003';
const S='30000000-0000-4000-8000-000000000001',S2='30000000-0000-4000-8000-000000000002';let checks=0;
function eq(a,b){assert.deepEqual(a,b);checks++;}
async function main(){
 assert.equal(process.env.DB_DATABASE,'etabella_tech_uuid','Development database required');
 const db=new Client({host:process.env.DB_HOST,port:+process.env.DB_PORT,user:process.env.DB_USERNAME,password:process.env.DB_PASSWORD,database:process.env.DB_DATABASE,ssl:+process.env.DB_SSL?{rejectUnauthorized:false}:false});
 await db.connect();
 try{
  eq((await db.query('SELECT current_database() AS name')).rows[0].name,'etabella_tech_uuid');
  await db.query('BEGIN');
  await db.query(`CREATE TEMP TABLE "CaseMaster" ("nCaseid" uuid PRIMARY KEY,"cCasename" text,"dHearingDt" timestamp,"cHearingTimezone" text,"nHearingDays" int);
   CREATE TEMP TABLE "UserMaster" ("nUserid" uuid PRIMARY KEY,"isAdmin" bool);
   CREATE TEMP TABLE "TeamRelation" ("nCaseid" uuid,"nUserid" uuid,"cStatus" text);
   CREATE TEMP TABLE "RSessionDetail" ("nSesid" uuid,"nUserid" uuid,"dDelDt" timestamp);
   CREATE TEMP TABLE "RSessionMaster" ("nSesid" uuid PRIMARY KEY,"nCaseid" uuid,"cStatus" text DEFAULT 'P',"dStartDt" timestamp,"dUpdatedt" timestamp,"dDelDt" timestamp,"cTimezone" text,"isTranscript" bool DEFAULT false,"nFinalLines" int,"nAppliedRawSeq" bigint);
   INSERT INTO "CaseMaster" VALUES ('${C}','Case one','2026-10-06 10:00','Asia/Kolkata',4),('${C2}','Case two',NULL,NULL,NULL);
   INSERT INTO "UserMaster" VALUES ('${U}',false),('${U2}',false),('${ADMIN}',true);
   INSERT INTO "TeamRelation" VALUES ('${C}','${U}','A');
   INSERT INTO "RSessionMaster" ("nSesid","nCaseid","dStartDt") VALUES ('${S}','${C}','2026-10-08'),('${S2}','${C}','2026-10-08');`);
  const source=fs.readFileSync(path.resolve(__dirname,'../../assets/sql-migrations/2026-10-08_realtime_entry.up.sql'),'utf8');
  const sql=source.replace(/^BEGIN;\s*$/m,'').replace(/^COMMIT;\s*$/m,'').replace(/public\./g,'pg_temp.');
  // Backfill must use the configured ordered hearing dates, not the observed session count.
  await db.query('SAVEPOINT legacy_backfill');
  const legacy=S.replace(/1$/,'9');
  await db.query('UPDATE "CaseMaster" SET "dHearingDt"=\'2026-10-06\',"nHearingDays"=4,"cHearingTimezone"=\'Asia/Kolkata\' WHERE "nCaseid"=$1',[C2]);
  await db.query('INSERT INTO "RSessionMaster" ("nSesid","nCaseid","dStartDt","cStatus") VALUES ($1,$2,\'2026-10-08\',\'R\')',[legacy,C2]);
  await db.query(sql);
  eq((await db.query('SELECT "nDay" FROM pg_temp."RealtimeHearingDay" WHERE "nCaseid"=$1',[C2])).rows[0].nDay,3);
  await db.query('ROLLBACK TO SAVEPOINT legacy_backfill');
  await db.query('SAVEPOINT hearing_timezone');
  await db.query('UPDATE "CaseMaster" SET "dHearingDt"=\'2026-10-06\',"nHearingDays"=4,"cHearingTimezone"=\'Pacific/Honolulu\' WHERE "nCaseid"=$1',[C2]);
  await db.query('INSERT INTO "RSessionMaster" ("nSesid","nCaseid","dStartDt","cTimezone","cStatus") VALUES ($1,$2,\'2026-10-08 03:00\',\'UTC\',\'R\')',[legacy,C2]);
  await db.query(sql);
  eq((await db.query('SELECT "dDate"::text AS date,"nDay" FROM pg_temp."RealtimeHearingDay" WHERE "nCaseid"=$1',[C2])).rows[0],{date:'2026-10-07',nDay:2});
  await db.query('ROLLBACK TO SAVEPOINT hearing_timezone');
  // Ambiguous legacy state is rejected before any migration object is installed.
  await db.query('SAVEPOINT conflicting_legacy');
  await db.query('UPDATE "RSessionMaster" SET "cStatus"=\'R\'');
  try{await db.query(sql);assert.fail('Preflight must refuse duplicate live rows');}
  catch(e){assert.match(e.message,/Multiple live sessions exist/);checks++;await db.query('ROLLBACK TO SAVEPOINT conflicting_legacy');}
  eq((await db.query("SELECT to_regclass('pg_temp.\"RealtimeHearingDay\"') AS name")).rows[0].name,null);
  await db.query(sql);
  const count=async(table)=>Number((await db.query(`SELECT count(*) AS n FROM pg_temp."${table}"`)).rows[0].n);
  const session=async(id=S)=>(await db.query('SELECT * FROM "RSessionMaster" WHERE "nSesid"=$1',[id])).rows[0];
  eq(await count('RealtimeAvailabilityNotification'),0);eq(await count('RealtimeHearingDay'),0);
  await db.query('UPDATE "RSessionMaster" SET "cStatus"=\'R\' WHERE "nSesid"=$1',[S]);
  const started=await session();assert.ok(started.nEntryEventid);checks++;assert.ok(started.dEntryStartedAt);checks++;
  eq(await count('RealtimeAvailabilityEvent'),1);eq(await count('RealtimeAvailabilityNotification'),2);
  const service=fs.readFileSync(path.resolve(__dirname,'../../apps/realtime-server/src/services/session/realtime-entry.service.ts'),'utf8');
  const query=key=>service.match(new RegExp('export const '+key+' = `([\\s\\S]+?)`;'))[1].replace(/public\./g,'pg_temp.');
  const info=(await db.query(query('ENTRY_CASE_SQL'),[C,U])).rows[0];eq(info.caseId,C);eq(info.timezone,'Asia/Kolkata');
  eq((await db.query(query('ENTRY_CASE_SQL'),[C,U2])).rows.length,0);
  eq((await db.query(query('ENTRY_SESSIONS_SQL'),[C,U])).rows.find(x=>x.sessionId===S).completed,false);
  eq((await db.query(query('ENTRY_NOTIFICATIONS_SQL'),[U,C])).rows.length,1);
  eq((await db.query(query('ENTRY_NOTIFICATIONS_SQL'),[U,C2])).rows.length,0);
  eq((await db.query('SELECT "nDay" FROM pg_temp."RealtimeHearingDay"')).rows[0].nDay,3);
  eq((await db.query('SELECT pg_temp.rt_entry_eligible($1,$2) AS eligible',[S,U])).rows[0].eligible,true);
  eq((await db.query('SELECT pg_temp.rt_entry_eligible($1,$2) AS eligible',[S,U2])).rows[0].eligible,false);
  // Reconnect, repeated start metadata, and a repeated assignment cannot duplicate notifications.
  await db.query('UPDATE "RSessionMaster" SET "cStatus"=\'R\' WHERE "nSesid"=$1',[S]);
  eq((await session()).nEntryEventid,started.nEntryEventid);eq(await count('RealtimeAvailabilityNotification'),2);
  await db.query('INSERT INTO "RSessionDetail" VALUES ($1,$2,NULL)',[S,U2]);
  eq(await count('RealtimeAvailabilityNotification'),3);
  await db.query('UPDATE "RSessionDetail" SET "dDelDt"=NULL WHERE "nSesid"=$1',[S]);
  eq(await count('RealtimeAvailabilityNotification'),3);
  await db.query('UPDATE pg_temp."RealtimeAvailabilityNotification" SET "bSeen"=true,"bDismissed"=true WHERE "nUserid"=$1',[U2]);
  await db.query('SELECT pg_temp.rt_entry_notify($1)',[S]);eq(await count('RealtimeAvailabilityNotification'),3);
  eq((await db.query('SELECT "bDismissed" FROM pg_temp."RealtimeAvailabilityNotification" WHERE "nUserid"=$1',[U2])).rows[0].bDismissed,true);
  await db.query('SAVEPOINT concurrent_start');
  try{await db.query('UPDATE "RSessionMaster" SET "cStatus"=\'R\' WHERE "nSesid"=$1',[S2]);assert.fail('Second active session must fail');}
  catch(e){eq(e.code,'23505');await db.query('ROLLBACK TO SAVEPOINT concurrent_start');}
  eq((await session(S2)).cStatus,'P');eq(await count('RealtimeAvailabilityEvent'),1);
  await db.query('SAVEPOINT case_reassignment');
  try{await db.query('UPDATE "RSessionMaster" SET "nCaseid"=$1 WHERE "nSesid"=$2',[C2,S]);assert.fail('Used-session case cannot change');}
  catch(e){eq(e.code,'23514');await db.query('ROLLBACK TO SAVEPOINT case_reassignment');}
  await db.query('UPDATE "TeamRelation" SET "cStatus"=\'I\' WHERE "nUserid"=$1',[U]);
  eq((await db.query('SELECT pg_temp.rt_entry_eligible($1,$2) AS eligible',[S,U])).rows[0].eligible,false);
  eq((await db.query(query('ENTRY_NOTIFICATIONS_SQL'),[U,C])).rows.length,0);
  await db.query('UPDATE "RSessionDetail" SET "dDelDt"=now() WHERE "nUserid"=$1',[U2]);
  eq((await db.query('SELECT pg_temp.rt_entry_eligible($1,$2) AS eligible',[S,U2])).rows[0].eligible,false);
  await db.query('UPDATE "RSessionMaster" SET "cStatus"=\'C\' WHERE "nSesid"=$1',[S]);
  assert.ok((await session()).dEntryEndedAt);checks++;
  eq((await db.query(query('ENTRY_SESSIONS_SQL'),[C,ADMIN])).rows.find(x=>x.sessionId===S).completed,true);
  // A published legacy transcript with raw activity is completed even without new start metadata.
  await db.query('SAVEPOINT published_legacy');
  await db.query('UPDATE "RSessionMaster" SET "cStatus"=\'P\',"dEntryStartedAt"=NULL,"dEntryEndedAt"=NULL,"nAppliedRawSeq"=5 WHERE "nSesid"=$1',[S]);
  eq((await db.query(query('ENTRY_SESSIONS_SQL'),[C,ADMIN])).rows.find(x=>x.sessionId===S).completed,true);
  await db.query('ROLLBACK TO SAVEPOINT published_legacy');
  // Replacement in the same hearing day retains the fixed Day 3 identity.
  await db.query('UPDATE "CaseMaster" SET "dHearingDt"=\'2026-10-08\',"nHearingDays"=2 WHERE "nCaseid"=$1',[C]);
  await db.query('UPDATE "RSessionMaster" SET "cStatus"=\'R\' WHERE "nSesid"=$1',[S2]);
  eq(await count('RealtimeHearingDay'),1);eq((await db.query('SELECT "nDay" FROM pg_temp."RealtimeHearingDay"')).rows[0].nDay,3);
  eq(await count('RealtimeAvailabilityEvent'),2);eq(await count('RealtimeAvailabilityNotification'),4); // only admin remains eligible
  await db.query('UPDATE "TeamRelation" SET "cStatus"=\'A\' WHERE "nUserid"=$1',[U]);
  eq(await count('RealtimeAvailabilityNotification'),5);
  // A new future hearing day cannot relabel the historical day or reuse its number.
  await db.query('UPDATE "RSessionMaster" SET "cStatus"=\'C\' WHERE "nSesid"=$1',[S2]);
  await db.query('INSERT INTO "RSessionMaster" ("nSesid","nCaseid","dStartDt","cStatus") VALUES ($1,$2,\'2026-10-09\',\'R\')',[S2.replace(/2$/,'3'),C]);
  eq((await db.query('SELECT "nDay" FROM pg_temp."RealtimeHearingDay" ORDER BY "dDate"')).rows.map(x=>x.nDay),[3,4]);
  // Missing all schedule fields is never an entry restriction.
  await db.query('INSERT INTO "RSessionMaster" ("nSesid","nCaseid","cStatus") VALUES ($1,$2,\'R\')',[S2.replace(/2$/,'4'),C2]);
  eq((await db.query('SELECT count(*)::int AS n FROM pg_temp."RealtimeHearingDay" WHERE "nCaseid"=$1',[C2])).rows[0].n,0);
  const unknownContext=await session(S2.replace(/2$/,'4'));eq(unknownContext.cStatus,'R');eq(unknownContext.dHearingDay,null);
  assert.ok(unknownContext.nEntryEventid);checks++;
  // Migration reapplication retains notification read state and all historical identities.
  await db.query(sql);eq((await db.query('SELECT "nDay" FROM pg_temp."RealtimeHearingDay" WHERE "nCaseid"=$1 ORDER BY "dDate"',[C])).rows.map(x=>x.nDay),[3,4]);
  // An amended future schedule numbers each date separately after fixed historical Day 7.
  await db.query('SAVEPOINT amended_future');
  await db.query('UPDATE "RSessionMaster" SET "cStatus"=\'C\' WHERE "nCaseid"=$1',[C]);
  await db.query('DELETE FROM pg_temp."RealtimeHearingDay" WHERE "nCaseid"=$1',[C]);
  await db.query('INSERT INTO pg_temp."RealtimeHearingDay" VALUES ($1,\'2026-10-06\',7)',[C]);
  await db.query('UPDATE "CaseMaster" SET "dHearingDt"=\'2026-10-08\',"nHearingDays"=4 WHERE "nCaseid"=$1',[C]);
  await db.query('INSERT INTO "RSessionMaster" ("nSesid","nCaseid","dStartDt","cStatus") VALUES ($1,$2,\'2026-10-09\',\'R\')',[legacy,C]);
  eq((await db.query('SELECT "nDay" FROM pg_temp."RealtimeHearingDay" WHERE "nCaseid"=$1 AND "dDate"=\'2026-10-09\'',[C])).rows[0].nDay,9);
  await db.query('ROLLBACK TO SAVEPOINT amended_future');
  await db.query('SAVEPOINT inserted_before_future');
  await db.query('UPDATE "RSessionMaster" SET "cStatus"=\'C\' WHERE "nCaseid"=$1',[C]);
  await db.query('DELETE FROM pg_temp."RealtimeHearingDay" WHERE "nCaseid"=$1',[C]);
  await db.query('INSERT INTO pg_temp."RealtimeHearingDay" VALUES ($1,\'2026-10-10\',7)',[C]);
  await db.query('UPDATE "CaseMaster" SET "dHearingDt"=\'2026-10-08\',"nHearingDays"=4 WHERE "nCaseid"=$1',[C]);
  await db.query('INSERT INTO "RSessionMaster" ("nSesid","nCaseid","dStartDt","cStatus") VALUES ($1,$2,\'2026-10-09\',\'R\')',[legacy,C]);
  eq((await db.query('SELECT "nDay" FROM pg_temp."RealtimeHearingDay" WHERE "nCaseid"=$1 AND "dDate"=\'2026-10-09\'',[C])).rows[0].nDay,9);
  await db.query('ROLLBACK TO SAVEPOINT inserted_before_future');
  // A transcript record freezes its hearing day without ever activating availability.
  await db.query('SAVEPOINT transcript_identity');
  const notificationsBefore=await count('RealtimeAvailabilityNotification');
  await db.query('INSERT INTO "RSessionMaster" ("nSesid","nCaseid","dStartDt","cStatus","isTranscript") VALUES ($1,$2,\'2026-10-12\',\'P\',true)',[legacy,C]);
  eq((await db.query('SELECT count(*)::int AS n FROM pg_temp."RealtimeHearingDay" WHERE "nCaseid"=$1 AND "dDate"=\'2026-10-12\'',[C])).rows[0].n,1);
  eq((await session(legacy)).nEntryEventid,null);eq(await count('RealtimeAvailabilityNotification'),notificationsBefore);
  await db.query('ROLLBACK TO SAVEPOINT transcript_identity');
  console.log(`PASS: ${checks} SQL assertions; etabella_tech_uuid temporary fixtures, all rolled back.`);
 }finally{await db.query('ROLLBACK').catch(()=>{});await db.end();}
}
main().catch(e=>{console.error('Realtime entry SQL acceptance failed: '+e.message);process.exitCode=1;});
