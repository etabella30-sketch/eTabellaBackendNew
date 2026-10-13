// Idempotent isolated venue-test setup. Never changes an existing case/box/session.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {randomUUID,randomBytes}=require('node:crypto'),{execFileSync}=require('node:child_process');
require('ts-node').register({transpileOnly:true});require('tsconfig-paths/register');
const {ConfigService}=require('@nestjs/config');
const {DbService}=require('../../libs/global/src/db/pg/db.service');
const {QueryBuilderService}=require('../../libs/global/src/db/pg/query-builder.service');
const {EdgeRegistryService}=require('../../apps/realtime-server/src/edge/edge-registry.service');
const {EclipseSessionService}=require('../../apps/realtime-server/src/services/eclipse-session/eclipse-session.service');
const {DeviceKey}=require('../../apps/rt-edge/src/uplink/device-key');
const {FEED_PARSE_VERSION}=require('../../libs/feed-parse/src');
const env=require('dotenv').parse(fs.readFileSync('.env.development'));assert.equal(env.DB_DATABASE,'etabella_tech_uuid');
const config=new ConfigService({...env,EDGE_CLOUD_ORIGIN:'http://192.168.1.5:5100'});
const db=new DbService(new QueryBuilderService(),config);
const registry=new EdgeRegistryService(db,{},config);
const boxRoot='D:/etabella tech/rt-edge-box';
const artifact='.codex-artifacts/qfact-caseview/edge-fixture.json';
let f=fs.existsSync(artifact)?JSON.parse(fs.readFileSync(artifact)):{};
const save=()=>fs.writeFileSync(artifact,JSON.stringify(f,null,2));
const query=async(sql,args=[])=>{const r=await db.rowQuery(sql,args);assert.ok(r.success,r.error);return r.data;};
(async()=>{
 const [owner]=await query('SELECT "nUserid","isAdmin" FROM "UserMaster" WHERE lower("cEmail")=lower($1)',['akj@lloymichaux.com']);
 assert.ok(owner?.isAdmin,'Named owner must be a global admin for the dedicated venue test');
 const actor={userId:owner.nUserid,isAdmin:true};f.ownerId=owner.nUserid;f.ownerEmail='akj@lloymichaux.com';
 if(!f.caseId){
   const [role]=await query('SELECT "nRoleid" FROM "RoleMaster" WHERE "nSrno"=1 LIMIT 1');
   f.caseId=randomUUID();f.teamId=randomUUID();
   await db.saveAtomically(async()=>{
     await query(`INSERT INTO "CaseMaster"("nCaseid","nCreateId","nUpdateId","cCasename","cCaseno","cDesc","dCreateDt","isArchived","cHearingTimezone","dHearingDt","nHearingDays") VALUES($1,$2,$2,'QFACT Express — Local Venue Test',$3,'Isolated CaseView development box test; original sessions remain untouched.',now(),false,'Asia/Kolkata',CURRENT_DATE,1)`,[f.caseId,f.ownerId,'QFX-EDGE-'+f.caseId.slice(0,8)]);
     await query(`INSERT INTO "TeamMaster"("nTeamid","nCaseid","nCreateId","nUpdateId","cTeamname","cFlag","dCreateDt") VALUES($1,$2,$3,$3,'QFACT Test Team','C',now())`,[f.teamId,f.caseId,f.ownerId]);
     await query(`INSERT INTO "TeamRelation"("nTRid","nCaseid","nTeamid","nUserid","nRoleid","cStatus","dModifyDt") VALUES($1,$2,$3,$4,$5,'A',now())`,[randomUUID(),f.caseId,f.teamId,f.ownerId,role.nRoleid]);
   });save();
 }
 const [testCase]=await query('SELECT "nCreateId","cCasename" FROM "CaseMaster" WHERE "nCaseid"=$1',[f.caseId]);
 assert.equal(testCase?.nCreateId,f.ownerId);assert.equal(testCase.cCasename,'QFACT Express — Local Venue Test');
 if(!f.edgeId){const created=await registry.createNode(actor,{cName:'QFACT Express Local Development',cVenue:'Local CaseView test',nCatPort:5655});f.edgeId=created.node.nEdgeid;save();
   // The one-time code stays in this process and is consumed by the real enrollment CLI.
   execFileSync(process.execPath,[path.join(boxRoot,'updates/20261013-qfact-express-1.3.0/main.js'),'enroll','--config',path.join(boxRoot,'box.qfact-test.json'),'--code',created.enroll.code],{cwd:boxRoot,stdio:'pipe'});
 }
 const key=await DeviceKey.load(path.join(boxRoot,'data-qfact-test/device-key.pem'));
 const node=await registry.getNode(f.edgeId);assert.ok(node);assert.equal(node.node.cKeyFpr,key.fingerprintHex());
 if(node.node.cStatus==='C')await registry.confirmKey(actor,f.edgeId,key.fingerprintHex());
 await registry.setCase(actor,f.edgeId,f.caseId,'I');
 if(!f.sessionId){
   f.sessionId=randomUUID();
   await query(`INSERT INTO "RSessionMaster"("nSesid","nCaseid","cName","dStartDt","dCreatedt","nDays","nLines","nPageno","cUnicuserid","cStatus","isTranscript","isUploaded","cTimezone","cSType","cProtocol") VALUES($1,$2,'QFACT CaseView Live Test',now(),now(),1,25,1,$3,'R',false,false,'Asia/Kolkata','R','C')`,[f.sessionId,f.caseId,'qfact-edge-'+f.sessionId.slice(0,8)]);save();
 }
 const bind=await db.executeRef('rtedge_session_bind',{nSesid:f.sessionId,nEdgeid:f.edgeId,nHearingOpid:f.ownerId,nMasterid:f.ownerId,cParserVer:FEED_PARSE_VERSION,cReporterSerial:'COM13',nReporterBaud:9600});
 assert.ok(bind.success,bind.error);assert.equal(bind.data[0][0].msg,1,bind.data[0][0].value);
 const eclipse=new EclipseSessionService(db,config,{emit(){},to(){return{emit(){}}}},registry);
 const existing=await eclipse.readEclipseRoutes();
 if(!existing.some(r=>r.nSesid===f.sessionId))await eclipse.writeEclipseRoute({nSesid:f.sessionId,nCaseid:f.caseId,cName:'QFACT CaseView Live Test',username:'qfact-dev-'+f.sessionId.slice(0,8),password:randomBytes(24).toString('base64url'),nLines:25,cTimezone:'Asia/Kolkata',edge:{nEdgeid:f.edgeId,epoch:1}});
 const pull=await registry.assignments(f.edgeId,{alertMissingRoutes:false});assert.ok(pull.ok);assert.equal(pull.missingRoutes.length,0);assert.equal(pull.snapshot.sessions.length,1);
 assert.equal(pull.snapshot.sessions[0].protocol,'C');assert.equal(pull.snapshot.sessions[0].parserVer,FEED_PARSE_VERSION);
 f.parserVersion=FEED_PARSE_VERSION;f.cloudOrigin='http://192.168.1.5:5100';f.url=`http://192.168.1.5:4000/rt/session/${f.sessionId}?caseId=${f.caseId}`;f.ready=true;save();console.log(JSON.stringify(f));
})().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(async()=>db.pool.end());
