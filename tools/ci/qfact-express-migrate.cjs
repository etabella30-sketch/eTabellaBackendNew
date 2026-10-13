// Development-only migration runner. --verify rolls back; --apply commits after preservation proof.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{Client}=require('pg');
const apply=process.argv.includes('--apply');if(!apply&&!process.argv.includes('--verify'))throw Error('Use --verify or --apply');
const env=require('dotenv').parse(fs.readFileSync('.env.development'));
assert.equal(env.DB_DATABASE,'etabella_tech_uuid','Only the named development database is supported');
const db=new Client({host:env.DB_HOST,port:Number(env.DB_PORT),user:env.DB_USERNAME,password:env.DB_PASSWORD,database:env.DB_DATABASE,connectionTimeoutMillis:10000,ssl:Number(env.DB_SSL)>0?{rejectUnauthorized:false}:undefined});
const out=path.resolve('.codex-artifacts/qfact-legacy');fs.mkdirSync(out,{recursive:true});
const sql=name=>fs.readFileSync(path.join('assets/sql-migrations',name),'utf8').replace(/^BEGIN;\s*$/m,'').replace(/^COMMIT;\s*$/m,'');
const digest=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
(async()=>{await db.connect();await db.query('BEGIN ISOLATION LEVEL REPEATABLE READ');await db.query("SET LOCAL lock_timeout='10s'");await db.query("SET LOCAL statement_timeout='180s'");
const before=(await db.query('SELECT to_jsonb(h) data FROM "RHighlights" h ORDER BY "nHid"')).rows;
const beforeIssues=(await db.query('SELECT to_jsonb(h) data FROM "RHighlightMapid" h ORDER BY "nMapid"')).rows;
const stamp=new Date().toISOString().replace(/[:.]/g,'-');
fs.writeFileSync(path.join(out,`native-backup-${stamp}.json`),JSON.stringify({database:env.DB_DATABASE,before,beforeIssues}));
const entry=(await db.query(`SELECT count(*)::int n FROM information_schema.columns WHERE table_schema='public' AND table_name='RSessionMaster' AND column_name=ANY(ARRAY['nEntryEventid','dEntryStartedAt','dEntryEndedAt'])`)).rows[0].n;
if(entry!==3)await db.query(sql('2026-10-08_realtime_entry.up.sql'));
for(const name of ['2026-10-12_live_qfact_capture.up.sql','2026-10-12_qfact_unassigned_reads.up.sql','2026-10-13_qfact_legacy_conversion.up.sql']){await db.query(sql(name));console.log('Verified migration: '+name);}
assert.equal(digest((await db.query('SELECT to_jsonb(h) data FROM "RHighlights" h ORDER BY "nHid"')).rows),digest(before),'Legacy source rows changed');
assert.equal(digest((await db.query('SELECT to_jsonb(h) data FROM "RHighlightMapid" h ORDER BY "nMapid"')).rows),digest(beforeIssues),'Legacy Issue associations changed');
const converted=(await db.query(`SELECT count(*)::int total,count(DISTINCT "nFSid")::int unique_ids FROM "QfactLegacyConversion" WHERE "bActive"`)).rows[0];
assert.equal(converted.total,converted.unique_ids);
assert.equal((await db.query('SELECT count(*)::int n FROM "QfactLegacyHighlights"')).rows[0].n,0,'Duplicate legacy read path remains');
assert.equal((await db.query(`SELECT count(*)::int n FROM "RHighlights" h LEFT JOIN "QfactLegacyConversion" m ON m."nHid"=h."nHid" AND m."bActive" WHERE m."nHid" IS NULL`)).rows[0].n,0,'Unmapped legacy mark');
// Exact raw rows and their full associations are available through the durable mapping too.
assert.equal((await db.query(`SELECT count(*)::int n FROM "RHighlights" h JOIN "QfactLegacyConversion" m ON m."nHid"=h."nHid" WHERE m."jLegacyRow" IS DISTINCT FROM to_jsonb(h)`)).rows[0].n,0,'Archive mismatch');
const countBefore=(await db.query('SELECT count(*)::int n FROM "FactMaster"')).rows[0].n;
await db.query(sql('2026-10-13_qfact_legacy_conversion.up.sql'));
assert.equal((await db.query('SELECT count(*)::int n FROM "FactMaster"')).rows[0].n,countBefore,'Retry duplicated QFACTs');
const report={date:new Date().toISOString(),environment:'development',committed:apply,legacyMarks:before.length,legacyIssueRows:beforeIssues.length,converted:converted.total,uniqueQfactIds:converted.unique_ids,sourceRowsUnchanged:true,issueRowsUnchanged:true,idempotent:true,legacyReadsSuppressed:true};
await db.query(apply?'COMMIT':'ROLLBACK');fs.writeFileSync(path.join(out,apply?'applied.json':'verified.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
})().catch(async e=>{await db.query('ROLLBACK').catch(()=>{});console.error(e.message);process.exitCode=1;}).finally(()=>db.end());
