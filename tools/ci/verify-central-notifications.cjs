// Actual installed schema + CoreAPI service, read-only coherent transaction. No tokens or private labels printed.
const fs=require('fs');const path=require('path');const assert=require('assert/strict');const pg=require('pg');const dotenv=require('dotenv');
const root=path.resolve(__dirname,'../..');const cfg=dotenv.parse(fs.readFileSync(path.join(root,'.env.development')));
if(cfg.DB_DATABASE!=='etabella_tech_uuid')throw new Error('Development database configuration required');
require('ts-node').register({transpileOnly:true,project:path.join(root,'tsconfig.json')});require('tsconfig-paths/register');
const {NotificationsService}=require(path.join(root,'apps/coreapi/src/modules/notifications/notifications.service.ts'));
const {INBOX_SQL,TARGET_SQL}=require(path.join(root,'apps/coreapi/src/modules/notifications/notifications.query.ts'));
const db=new pg.Client({host:cfg.DB_HOST,port:Number(cfg.DB_PORT),user:cfg.DB_USERNAME,password:cfg.DB_PASSWORD,database:cfg.DB_DATABASE,ssl:Number(cfg.DB_SSL)>0 ? {rejectUnauthorized:false} : undefined});
let active=false;let checks=0;const check=(a,msg)=>{assert(a,msg);checks++;};
(async()=>{await db.connect();try{
  check((await db.query('SELECT current_database() AS name')).rows[0].name==='etabella_tech_uuid','actual database');
  await db.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');active=true;await db.query("SET LOCAL statement_timeout='15000ms'");
  check((await db.query(`SELECT count(*)::int AS n FROM information_schema.columns WHERE table_schema='public' AND table_name='Notifications' AND column_name IN('cEventKey','jTarget','bDismissed')`)).rows[0].n===3,'installed metadata');
  const recipient=(await db.query(`SELECT n."nUserid" AS id,count(*)::int AS n FROM public."Notifications" n JOIN public."UserMaster" u ON u."nUserid"=n."nUserid"
    WHERE NOT coalesce(u."isAdmin",false) AND EXISTS(SELECT 1 FROM public."TeamRelation" t WHERE t."nUserid"=n."nUserid" AND t."cStatus"='A')
    GROUP BY n."nUserid" ORDER BY count(*) DESC LIMIT 1`)).rows[0];
  if(!recipient)throw new Error('No existing nonadmin active-member inbox to verify');
  const service=new NotificationsService({rowQuery:async(sql,params)=>{
    if(sql!==INBOX_SQL && sql!==TARGET_SQL)throw new Error('Read-only runtime harness rejected a write');
    const result=await db.query(sql,params);return {success:true,data:result.rows};
  }});
  const caller={userId:recipient.id,family:'cloud-jwt',caseScope:'membership',isPlatformAdmin:false};
  const started=Date.now();const page=await service.inbox(caller,{limit:30});const duration=Date.now()-started;
  check(Array.isArray(page.items) && page.items.length<=30,'service page shape');
  const raw=(await db.query(INBOX_SQL,[recipient.id,31,null,null])).rows[0];
  check(page.unseenCount===raw.unseenCount,'service unseen count agrees with fresh coherent database view');
  const owned=(await db.query('SELECT "nNTid"::text AS id FROM public."Notifications" WHERE "nUserid"=$1 AND "nNTid"=ANY($2::uuid[])',[recipient.id,page.items.map(i=>i.id)])).rows;
  check(owned.length===page.items.length,'all items owned by recipient');
  const kinds=[...new Set(page.items.map(i=>i.kind))];const targetTypes=[];
  if(page.items[0]){const target=await service.target(caller,page.items[0].id);check(['document','annotation','evidence','workspace','presentation','case','information'].includes(target.type),'typed target');targetTypes.push(target.type);}
  if(page.nextCursor){const next=await service.inbox(caller,{limit:30,...page.nextCursor});check(!next.items.some(i=>page.items.some(p=>p.id===i.id)),'pagination has no duplicates');}
  const foreign=(await db.query('SELECT "nNTid" AS id FROM public."Notifications" WHERE "nUserid"<>$1 LIMIT 1',[recipient.id])).rows[0];
  if(foreign){let refused=false;try{await service.target(caller,foreign.id);}catch(e){refused=e.getStatus?.()===404;}check(refused,'foreign recipient notice cannot resolve');}
  await db.query('ROLLBACK');active=false;
  const report={at:new Date().toISOString(),ok:true,database:'etabella_tech_uuid',readOnly:true,checks,recipient:'existing nonadmin active member',storedRows:recipient.n,pageRows:page.items.length,unseenCount:page.unseenCount,kinds,targetTypes,durationMs:duration};
  fs.mkdirSync(path.join(root,'.codex-artifacts/central-notifications'),{recursive:true});fs.writeFileSync(path.join(root,'.codex-artifacts/central-notifications/runtime-readonly.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}catch(e){console.error(JSON.stringify({ok:false,readOnly:true,checks,error:e.message}));process.exitCode=1;}finally{if(active)await db.query('ROLLBACK').catch(()=>{});await db.end();}})();
