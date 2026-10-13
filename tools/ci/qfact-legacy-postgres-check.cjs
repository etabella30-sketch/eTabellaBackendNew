// Real legacy/QFACT transition proof, always rolled back.
const fs=require('node:fs'),assert=require('node:assert/strict'),{randomUUID}=require('node:crypto'),{Client}=require('pg');
const env=require('dotenv').parse(fs.readFileSync('.env.development'));assert.equal(env.DB_DATABASE,'etabella_tech_uuid');
const db=new Client({host:env.DB_HOST,port:Number(env.DB_PORT),user:env.DB_USERNAME,password:env.DB_PASSWORD,database:env.DB_DATABASE,connectionTimeoutMillis:10000,ssl:Number(env.DB_SSL)>0?{rejectUnauthorized:false}:undefined});
const sql=name=>fs.readFileSync('assets/sql-migrations/'+name,'utf8').replace(/^BEGIN;\s*$/m,'').replace(/^COMMIT;\s*$/m,'');
const sp=async(name,body,cursors)=>{await db.query(`SELECT ${name}($1::json,${cursors.map((_,i)=>`$${i+2}::refcursor`).join(',')})`,[JSON.stringify(body),...cursors]);const result=[];for(const cursor of cursors){result.push((await db.query(`FETCH ALL FROM ${cursor}`)).rows);await db.query(`CLOSE ${cursor}`);}return result;};
(async()=>{await db.connect();await db.query('BEGIN');await db.query("SET LOCAL statement_timeout='180s'");
await db.query(sql('2026-10-12_live_qfact_capture.up.sql'));await db.query(sql('2026-10-12_qfact_unassigned_reads.up.sql'));
await db.query(sql('2026-10-13_qfact_legacy_conversion.up.sql'));
const fixture=(await db.query(`SELECT s."nSesid",s."nCaseid",t."nUserid",i."nIid" FROM "RSessionMaster" s JOIN "TeamRelation" t ON t."nCaseid"=s."nCaseid" AND t."cStatus"='A' JOIN "RIssueMaster" i ON i."nCaseid"=s."nCaseid" WHERE s."dDelDt" IS NULL LIMIT 1`)).rows[0];assert.ok(fixture);
const ids=[randomUUID(),randomUUID(),randomUUID()];
for(let i=0;i<ids.length;i++)await db.query(`INSERT INTO "RHighlights"("nHid","nCaseid","nSessionId","nUserid","dCreatedt","cNote","cPageno","cLineno","cTPageno","cTLineno","cTime","cTTime","identity","tidentity","oP","oL","nLID","jCordinates")
 VALUES($1,$2,$3,$4,now(),'Legacy preservation test','1',$5,'3',$6,'10:00:00:00','10:00:10:00',$7,$8,1,$9,$10,$11::jsonb)`,
 [ids[i],fixture.nCaseid,fixture.nSesid,fixture.nUserid,String(i+1),String(i+4),'draft-'+ids[i],'final-'+ids[i],i+1,fixture.nIid,JSON.stringify([{x:10,y:20,width:30,height:40,text:'Legacy preservation test',otext:'Legacy preservation test',identity:'draft-'+ids[i],isMain:true}])]);
await db.query('INSERT INTO "RHighlightMapid"("nHid","nIid") VALUES($1,$2)',[ids[0],fixture.nIid]);
const details=(await db.query('SELECT m."nFSid",m."nUserid",m."cFType",d.* FROM "FactMaster" m JOIN "FactDetail" d USING("nFSid") WHERE m."nFSid"=ANY($1::uuid[])',[ids])).rows;
assert.equal(details.length,3);for(const d of details){assert.equal(d.nUserid,fixture.nUserid);assert.equal(d.cFType,'QF');assert.equal(d.nTPage,3);assert.equal(d.jTCordinates[0].identity,'final-'+d.nFSid);assert.equal(d.jCordinates[0].width,30);assert.equal(d.bLiveCapturePristine,false);}
assert.equal((await db.query('SELECT count(*)::int n FROM "QfactLegacyHighlights" WHERE "nHid"=ANY($1::uuid[])',[ids])).rows[0].n,0);
const nav=await sp('realtime.et_navigate_get_all',{nSesid:fixture.nSesid,nUserid:fixture.nUserid,cSortby:'asc',jFilter:'{}',bIsTranscipt:false},['legacy_nav','legacy_issues','legacy_links']);
for(const id of ids)assert.equal(nav[0].filter(r=>r.nFSid===id && r.cSource==='QF').length,1);
const marks=await sp('realtime.et_marks',{nSessionid:fixture.nSesid,nUserid:fixture.nUserid,bTranscript:true},['legacy_anno','legacy_old','legacy_doc']);
for(const id of ids){assert.equal(marks[0].filter(r=>r.id===id).length,1);assert.equal(marks[1].filter(r=>r.nHid===id).length,0);}
await sp('realtime.et_fact_quick_update',{nFSid:ids[0],nColorid:null,jIssue:'[]',jContacts:'[]',jTexts:'["Retained note"]',cIsNote:'Y'},['legacy_edit']);
assert.equal((await db.query('SELECT public.qfact_legacy_rollback_one($1) restored',[ids[0]])).rows[0].restored,false,'Never roll back an edited QFACT');
assert.equal((await db.query('SELECT public.qfact_legacy_rollback_one($1) restored',[ids[1]])).rows[0].restored,true,'Untouched QFACT restores its exact legacy row');
await db.query('SELECT public.qfact_legacy_convert_one($1)',[ids[1]]);
await db.query('DELETE FROM "FMIssue" WHERE "nFSid"=$1',[ids[2]]);await db.query('DELETE FROM "FactDetail" WHERE "nFSid"=$1',[ids[2]]);await db.query('DELETE FROM "FactMaster" WHERE "nFSid"=$1',[ids[2]]);
assert.equal((await db.query('SELECT public.qfact_legacy_rollback_one($1) restored',[ids[2]])).rows[0].restored,false);
await db.query('SELECT public.qfact_legacy_convert_one($1)',[ids[2]]);assert.equal((await db.query('SELECT count(*)::int n FROM "FactMaster" WHERE "nFSid"=$1',[ids[2]])).rows[0].n,0,'Deleted QFACT must not resurrect');
assert.deepEqual((await db.query('SELECT "jTexts" FROM "FactDetail" WHERE "nFSid"=$1',[ids[0]])).rows[0].jTexts,['Retained note']);
assert.equal((await db.query('SELECT count(*)::int n FROM "RHighlights" WHERE "nHid"=ANY($1::uuid[])',[ids])).rows[0].n,3);
console.log('PASS: stable IDs, source and final anchors, geometry, Issue links, ordinary reads/editing, mixed-version insert, rollback protection and no resurrection.');
})().catch(e=>{console.error(e.stack);process.exitCode=1;}).finally(async()=>{await db.query('ROLLBACK').catch(()=>{});await db.end();console.log('All transition test writes rolled back.');});
