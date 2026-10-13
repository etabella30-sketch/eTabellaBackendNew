// Default: read-only preflight. Root/operator may use --apply-dev-authorized after reviewing the migration.
// No fixture writes. SQL function backups and existing inbox row digest are saved before DDL.
const fs=require('fs');const path=require('path');const crypto=require('crypto');const pg=require('pg');const dotenv=require('dotenv');
const root=path.resolve(__dirname,'../..');const cfg=dotenv.parse(fs.readFileSync(path.join(root,'.env.development')));
const captureGuard=require(path.join(root,'.codex-artifacts/realtime-entry/symmetric-development-pause-common.cjs'));
if(cfg.DB_DATABASE!=='etabella_tech_uuid')throw new Error('Only development etabella_tech_uuid is allowed');
const db=new pg.Client({host:cfg.DB_HOST,port:Number(cfg.DB_PORT),user:cfg.DB_USERNAME,password:cfg.DB_PASSWORD,database:cfg.DB_DATABASE,ssl:Number(cfg.DB_SSL)>0 ? {rejectUnauthorized:false} : undefined});
const apply=process.argv.includes('--apply-dev-authorized');
const migrationPath=path.join(root,'assets/sql-migrations/2026-10-08_central_notifications.up.sql');
const source=fs.readFileSync(migrationPath,'utf8');const migration=source.replace(/^BEGIN;\s*$/m,'').replace(/^COMMIT;\s*$/m,'');
const digest=value=>crypto.createHash('sha256').update(typeof value==='string' ? value : JSON.stringify(value)).digest('hex');
const migrationDigest=digest(source);let committed=false;let active=false;let backupPath;let receiptPath;
function writeDurable(file,value){fs.mkdirSync(path.dirname(file),{recursive:true});const fd=fs.openSync(file,'wx');try{fs.writeFileSync(fd,JSON.stringify(value,null,2)+'\n');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}}
async function suppression(){await db.query("SELECT set_config('symmetric.triggers_disabled','2',true)");const r=await db.query('SELECT sym.sym_triggers_disabled() AS disabled');if(String(r.rows[0].disabled)!=='2')throw new Error('Supported SymmetricDS capture suppression failed');}
async function snapshot(){
  const columns=(await db.query(`SELECT column_name,data_type,is_nullable,column_default FROM information_schema.columns WHERE table_schema='public' AND table_name='Notifications' ORDER BY ordinal_position`)).rows;
  const indexes=(await db.query(`SELECT tablename,indexname,indexdef FROM pg_indexes WHERE schemaname='public' AND tablename IN('Notifications','TeamRelation','UploadDetail','BDAssignment') ORDER BY tablename,indexname`)).rows;
  const functions=(await db.query(`SELECT p.proname AS name,pg_get_function_identity_arguments(p.oid) AS signature,pg_get_functiondef(p.oid) AS definition FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN('nt_uuid','nt_case_visible','nt_file_visible','nt_folder_visible','nt_resolve_target','nt_notice_target','et_notification_delete','et_notification_list') ORDER BY p.proname,p.oid`)).rows;
  return {columns,indexes,functions};
}
async function rowState(){return (await db.query(`SELECT count(*)::int AS count,md5(coalesce(string_agg(jsonb_build_array("nNTid","nUserid","nCaseid","dDate","cStatus","bIsseen","nFSid","nDocid","nWebid","nBundledetailid","nUPid","nPresentid","nRefuserid")::text,'' ORDER BY "nNTid"),'')) AS digest FROM public."Notifications"`)).rows[0];}
function checkAbsent(s){if(s.columns.some(c=>['cEventKey','jTarget','bDismissed'].includes(c.column_name)) || s.functions.some(f=>f.name.startsWith('nt_')))throw new Error('Central inbox metadata is already present or partial; review this state before reapplying');}
(async()=>{await db.connect();try{
  if((await db.query('SELECT current_database() AS database')).rows[0].database!=='etabella_tech_uuid')throw new Error('Actual database guard refused');
  await db.query('BEGIN READ ONLY');active=true;await suppression();const supportedCaptureFunctions=await captureGuard.verifyCaptureGate(db);const before=await snapshot();const rows=await rowState();await db.query('ROLLBACK');active=false;
  if(!apply){console.log(JSON.stringify({ok:true,mode:'dry-run',database:'etabella_tech_uuid',supportedSuppression:2,supportedCaptureFunctions,migrationDigest,schemaDigest:digest(before),noticeRows:rows.count,rowDigest:rows.digest,alreadyInstalled:before.columns.some(c=>c.column_name==='jTarget'),replacesLegacyFunctions:['et_notification_delete','et_notification_list'],newFunctions:6}));return;}
  checkAbsent(before);
  await db.query('BEGIN');active=true;await db.query("SET LOCAL lock_timeout='2000ms'");await db.query("SET LOCAL statement_timeout='45000ms'");await suppression();
  await db.query('LOCK TABLE public."Notifications" IN ACCESS EXCLUSIVE MODE NOWAIT');
  await captureGuard.verifyCaptureGate(db);
  const locked=await snapshot();if(digest(locked)!==digest(before))throw new Error('Notification schema changed since preflight');checkAbsent(locked);
  const previousRows=await rowState();const floor=(await db.query('SELECT coalesce(max(data_id),0)::text AS floor FROM sym.sym_data')).rows[0].floor;
  const tx=(await db.query('SELECT txid_current()::text AS tx')).rows[0].tx;
  const stamp=new Date().toISOString().replace(/[:.]/g,'-');const dir=path.join(root,'.codex-artifacts/central-notifications');
  backupPath=path.join(dir,`migration-backup-${stamp}.json`);receiptPath=path.join(dir,`migration-receipt-${stamp}.json`);
  writeDurable(backupPath,{at:new Date().toISOString(),database:'etabella_tech_uuid',migrationDigest,schemaDigest:digest(locked),before:locked,rows:previousRows,captureWatermark:floor,transactionId:tx,scope:'notification metadata/functions only; existing rows preserved'});
  await db.query(migration);
  const afterRows=await rowState();if(afterRows.count!==previousRows.count || afterRows.digest!==previousRows.digest)throw new Error('Existing inbox identity/read/delivery state changed during metadata migration');
  const captureRows=(await db.query('SELECT count(*)::int AS n FROM sym.sym_data WHERE data_id>$1::bigint AND transaction_id=$2',[floor,tx])).rows[0].n;
  if(captureRows!==0)throw new Error('Migration writes were unexpectedly captured by SymmetricDS');
  const after=await snapshot();for(const name of ['cEventKey','jTarget','bDismissed'])if(!after.columns.some(c=>c.column_name===name))throw new Error('Missing inbox metadata column '+name);
  if(after.functions.length!==8)throw new Error('Unexpected inbox function count');
  await db.query('COMMIT');active=false;committed=true;
  const receipt={at:new Date().toISOString(),committed:true,database:'etabella_tech_uuid',transactionId:tx,migrationDigest,backupPath,schemaDigest:digest(after),noticeRows:afterRows.count,rowDigest:afterRows.digest,captureRows};
  writeDurable(receiptPath,receipt);console.log(JSON.stringify({ok:true,...receipt,receiptPath}));
}catch(e){if(active){await db.query('ROLLBACK').catch(()=>{});active=false;}console.error(JSON.stringify({ok:false,committed,error:e.message,backupPath,receiptPath}));process.exitCode=1;}finally{await db.end();}})();
