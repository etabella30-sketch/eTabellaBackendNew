// Dedicated, idempotent development fixture. Never resets an existing session or marks.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{randomUUID}=require('node:crypto'),{Client}=require('pg'),Redis=require('ioredis');
require('ts-node').register({transpileOnly:true});require('tsconfig-paths/register');
const {BridgeFramingService,BridgeParserService,CaseviewParserService,createSessionContext,FEED_PARSE_VERSION}=require('../../libs/feed-parse/src');
const {FeedDataService}=require('../../apps/realtime-server/src/services/feed-data/feed-data.service');
const {UtilityService}=require('../../apps/realtime-server/src/services/utility/utility.service');
const env=require('dotenv').parse(fs.readFileSync('.env.development'));assert.equal(env.DB_DATABASE,'etabella_tech_uuid');
const email=process.argv.find(a=>a.startsWith('--owner='))?.slice(8);assert.ok(email,'Use --owner=email');
const protocol=process.argv.includes('--caseview')?'C':'B';
const db=new Client({host:env.DB_HOST,port:+env.DB_PORT,user:env.DB_USERNAME,password:env.DB_PASSWORD,database:env.DB_DATABASE,ssl:+env.DB_SSL>0?{rejectUnauthorized:false}:undefined});
const redis=new Redis(env.REDIS_URL,{lazyConnect:true,maxRetriesPerRequest:1});
const out=path.resolve(protocol==='C'?'.codex-artifacts/qfact-caseview/fixture.json':'.codex-artifacts/qfact-legacy/fixture.json');let service;
(async()=>{await db.connect();await redis.connect();
const users=(await db.query('SELECT "nUserid","isAdmin" FROM "UserMaster" WHERE lower("cEmail")=lower($1)',[email])).rows;assert.equal(users.length,1,'Owner account must resolve exactly once');const user=users[0];
if(fs.existsSync(out)){const saved=JSON.parse(fs.readFileSync(out));if(saved.ownerId===user.nUserid&&(await db.query('SELECT 1 FROM "RSessionMaster" WHERE "nSesid"=$1',[saved.sessionId])).rows.length){console.log(JSON.stringify({...saved,reused:true}));return;}}
const role=(await db.query('SELECT "nRoleid" FROM "RoleMaster" WHERE "nSrno"=1 LIMIT 1')).rows[0];assert.ok(role);
const caseId=randomUUID(),teamId=randomUUID(),sessionId=randomUUID();
await db.query('BEGIN');
await db.query(`INSERT INTO "CaseMaster"("nCaseid","nCreateId","nUpdateId","cCasename","cCaseno","cDesc","dCreateDt","isArchived","cHearingTimezone","dHearingDt","nHearingDays")
 VALUES($1,$2,$2,$4,$3,$5,now(),false,'Asia/Calcutta',CURRENT_DATE,1)`,[caseId,user.nUserid,'QFX-20261013-'+caseId.slice(0,8),protocol==='C'?'QFACT Express CaseView Test — 13 October 2026':'QFACT Express Test — 13 October 2026',`Dedicated controlled ${protocol==='C'?'CaseView':'Bridge'} test. Existing cases and records are not used.`]);
await db.query(`INSERT INTO "TeamMaster"("nTeamid","nCaseid","nCreateId","nUpdateId","cTeamname","cFlag","dCreateDt") VALUES($1,$2,$3,$3,'QFACT Express Test Team','C',now())`,[teamId,caseId,user.nUserid]);
await db.query(`INSERT INTO "TeamRelation"("nTRid","nCaseid","nTeamid","nUserid","nRoleid","cStatus","dModifyDt") VALUES($1,$2,$3,$4,$5,'A',now())`,[randomUUID(),caseId,teamId,user.nUserid,role.nRoleid]);
await db.query(`INSERT INTO "RSessionMaster"("nSesid","nCaseid","cName","dStartDt","dCreatedt","nDays","nLines","nPageno","cUnicuserid","cStatus","isTranscript","isUploaded","cTimezone","cSType","cProtocol","cFeedSource","cParserVer")
 VALUES($1,$2,'QFACT Express Live Test',now(),now(),1,25,1,$3,'R',false,false,'Asia/Calcutta','R',$5,'D',$4)`,[sessionId,caseId,'qfact-test-'+sessionId.slice(0,8),FEED_PARSE_VERSION,protocol]);
await db.query('COMMIT');
const framing=new BridgeFramingService(),parser=new BridgeParserService();let sequence=0;
const sink={emitLocal:()=>{},emitDelivery:()=>{},saveLine:async(_s,id)=>id||++sequence,saveMetaData:async()=>1,removeLines:async()=>1,savePageData:async()=>1,runAnnotTransfer:async()=>1,log:()=>{}};
const ctx=createSessionContext({nSesid:sessionId,protocol,sink,nLines:25,cTimezone:'Asia/Calcutta'});
const command=(letter,bytes)=>[2,letter.charCodeAt(0),...bytes,3];
const texts=['Q. Describe the arrangement.','A. We agreed the delivery date.','Q. Was the delivery completed?','A. Delivery was delayed.'];
const times=protocol==='C'?[[10,0,0,0],[10,0,10,0],[10,0,34,0],[10,1,10,0]]:[[10,0,0,0],[10,0,10,0],[10,0,35,0],[10,1,10,0]];
if(protocol==='C'){
 const cat=new CaseviewParserService();
 const wire=Buffer.concat(texts.flatMap((text,i)=>{const clock=Buffer.alloc(2);const [h,m,s]=times[i];clock.writeUInt16LE((h<<11)|(m<<5)|(s/2));return [Buffer.from([0xf9]),Buffer.from(clock.toString('hex')),Buffer.from([0xfa]),Buffer.from(text,'latin1')];}));
 // Identical receipt clock on every chunk proves that source time determines grouping.
 for(let i=0;i<wire.length;i+=3){await cat.parseData(ctx,wire.subarray(i,i+3),Date.UTC(2026,9,13,2,55,0));await new Promise(resolve=>ctx.parseQueue.addTask(resolve));}
}else{
 const wire=[...command('P',[1,0]),...texts.flatMap((t,i)=>[...command('N',[i+1]),...command('T',times[i]),...Buffer.from(t,'latin1')])];
 await new Promise(resolve=>{framing.splitCommands(ctx,Buffer.from(wire),(c,hex,cmd)=>parser.sendToParseData(c,hex,cmd));ctx.parseQueue.addTask(async()=>ctx.bridgeQueue.addTask(async()=>resolve()));});
}
const rows=ctx.job.lineBuffer.filter(row=>Array.isArray(row?.[1])&&row[1].length).map((row,i)=>{const copy=structuredClone(row);copy[2]=i;return copy;});assert.equal(rows.length,4);assert.ok(rows.every(row=>row[10]?.source==='hearing-timecode'));
const cache={scanKeys:async()=>[],getValue:key=>redis.get(key),setValue:(key,value,ttl)=>redis.set(key,value,'EX',ttl||172800),getAllValues:async()=>({})};
service=new FeedDataService({server:{to:()=>({emit:()=>{}})}},cache,{error:()=>{},info:()=>{}},new UtilityService({}));
service.feedReceive({date:sessionId,d:rows,i:3,p:1,l:25});const queue=service.queue;if(!queue.idle())await queue.drain();await service.flushDirtyPages();
const page=JSON.parse(await redis.get(`session:${sessionId}:1`));assert.equal(page.length,4);assert.ok(page.every(row=>row[10]?.source==='hearing-timecode'));
const fixture={ownerEmail:email,ownerId:user.nUserid,isAdmin:user.isAdmin,caseId,teamId,sessionId,protocol,parserVersion:FEED_PARSE_VERSION,createdAt:new Date().toISOString(),hearingTimes:times.map(t=>t.slice(0,3).map(x=>String(x).padStart(2,'0')).join(':')),receiptTimes:rows.map(row=>row[0]),identities:rows.map(row=>String(row[6])),url:`http://localhost:4200/rt/session/${sessionId}?caseId=${caseId}`};
fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(fixture,null,2));console.log(JSON.stringify(fixture));
})().catch(async e=>{await db.query('ROLLBACK').catch(()=>{});console.error(e.stack);process.exitCode=1;}).finally(async()=>{if(service)clearInterval(service.flushTimer);await db.end();redis.disconnect();});
