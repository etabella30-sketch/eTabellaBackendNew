const assert = require('node:assert/strict');
const fs = require('node:fs');
require('dotenv').config({ path: '.env.development', quiet: true });
const { Client } = require('pg');
const id = n => `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
async function main() {
  assert.equal(process.env.DB_DATABASE, 'etabella_tech_uuid');
  const db = new Client({ host: process.env.DB_HOST, port: +process.env.DB_PORT, user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD, database: process.env.DB_DATABASE,
    ssl: +process.env.DB_SSL > 0 ? { rejectUnauthorized: false } : false, connectionTimeoutMillis: 7000 });
  await db.connect();
  let checks = 0;
  const equal = (a,b) => { assert.deepEqual(a,b); checks++; };
  try {
    equal((await db.query('SELECT current_database() AS db')).rows[0].db, 'etabella_tech_uuid');
    await db.query('BEGIN');
    await db.query(`CREATE TEMP TABLE "CaseMaster"("nCaseid" uuid PRIMARY KEY);
      CREATE TEMP TABLE "UserMaster"("nUserid" uuid PRIMARY KEY,"isAdmin" boolean);
      CREATE TEMP TABLE "TeamRelation"("nCaseid" uuid,"nUserid" uuid,"cStatus" text);
      CREATE TEMP TABLE "UserCaseUiMode"("nCaseid" uuid,"nUserid" uuid,"cUIMode" text);
      CREATE TEMP TABLE "FactMaster"("nFSid" uuid PRIMARY KEY,"nCaseid" uuid,"nUserid" uuid,"cFType" text);
      CREATE TEMP TABLE "RIssueMaster"("nIid" uuid PRIMARY KEY,"nUserid" uuid,"cIName" text);
      CREATE TEMP TABLE "FMIssue"("nFSid" uuid,"nIssueid" uuid,"nImpactid" int,"nRelevanceid" int);`);
    for (const u of [id(1),id(2)]) {
      await db.query('INSERT INTO "UserMaster" VALUES($1,false)',[u]);
      for (const c of [id(11),id(12)]) {
        await db.query('INSERT INTO "CaseMaster" VALUES($1) ON CONFLICT DO NOTHING',[c]);
        await db.query('INSERT INTO "TeamRelation" VALUES($1,$2,\'A\')',[c,u]);
        await db.query('INSERT INTO "UserCaseUiMode" VALUES($1,$2,\'A\')',[c,u]);
      }
    }
    for (const [fid,uid,type] of [[id(21),id(1),'F'],[id(22),id(1),'QF'],[id(23),id(2),'F']]) {
      await db.query('INSERT INTO "FactMaster" VALUES($1,$2,$3,$4)',[fid,id(11),uid,type]);
    }
    await db.query('INSERT INTO "RIssueMaster" VALUES($1,null,\'Unassigned\'),($2,$3,\'Named Issue under Unassigned Claim\')',[id(31),id(32),id(1)]);
    const source = fs.readFileSync('assets/sql-migrations/2026-10-09_private_fact_groups.up.sql','utf8');
    await db.query(source.replace(/^BEGIN;\s*$/m,'').replace(/^COMMIT;\s*$/m,'').replace(/public\./g,'pg_temp.'));
    async function call(fn, fields, actor=id(1), cid=id(11)) {
      await db.query(`SELECT pg_temp.et_${fn}($1::json,'private_result'::refcursor)`,[JSON.stringify({nMasterid:actor,nCaseid:cid,...fields})]);
      const result=(await db.query('FETCH ALL FROM private_result')).rows[0];await db.query('CLOSE private_result');return result;
    }
    const groups = fields => call('workspace_private_groups',fields);
    const assign = (fid,gid,actor=id(1)) => call('private_group_assign',{nFSid:fid,nPrivateGroupid:gid},actor);
    equal((await groups({})).groups,[]);
    const created=await groups({operation:'create',cName:'My working group'}), gid=created.nGroupid;
    equal(created.msg,1); equal(created.groups[0].count,0);
    equal((await groups({operation:'create',cName:' MY WORKING GROUP '})).msg,-1);
    equal((await assign(id(21),gid)).msg,1);
    equal((await groups({})).assignments,{[id(21)]:gid});
    equal((await call('workspace_private_groups',{},id(2))).groups,[]);
    equal((await assign(id(21),gid,id(2))).msg,-1);
    equal((await assign(id(22),gid)).msg,-1);
    equal((await assign(id(23),gid)).msg,-1);
    const other=await call('workspace_private_groups',{operation:'create',cName:'Other case'},id(1),id(12));
    equal((await assign(id(21),other.nGroupid)).msg,-1);
    equal((await groups({operation:'rename',nGroupid:gid,cName:'Renamed group'})).nGroupid,gid);
    equal((await groups({})).groups[0].name,'Renamed group');
    await db.query('INSERT INTO "FMIssue" VALUES($1,$2,4,5)',[id(21),id(31)]);
    equal((await db.query('SELECT "nImpactid","nRelevanceid" FROM "FMIssue"')).rows[0],{nImpactid:0,nRelevanceid:0});
    await db.query('SAVEPOINT failed_save');
    await db.query('DELETE FROM "FMIssue" WHERE "nFSid"=$1',[id(21)]);
    await db.query('INSERT INTO "FMIssue" VALUES($1,$2,4,5)',[id(21),id(32)]);
    equal((await groups({})).assignments,{});
    await db.query('ROLLBACK TO SAVEPOINT failed_save');
    equal((await groups({})).assignments,{[id(21)]:gid});
    await db.query('DELETE FROM "FMIssue" WHERE "nFSid"=$1',[id(21)]);
    await db.query('INSERT INTO "FMIssue" VALUES($1,$2,4,5)',[id(21),id(32)]);
    equal((await assign(id(21),gid)).msg,-1);
    equal((await groups({})).groups[0].count,0); // empty group is reusable
    await db.query('DELETE FROM "FMIssue" WHERE "nFSid"=$1',[id(21)]);
    equal((await assign(id(21),gid)).msg,1);
    equal((await assign(id(21),null)).msg,1);
    equal((await groups({})).groups.length,1);
    equal((await assign(id(21),gid)).msg,1);
    equal((await groups({operation:'delete',nGroupid:gid})).assignments,{});
    equal((await db.query('SELECT count(*)::int AS n FROM "FactMaster"')).rows[0].n,3);
    equal((await assign(id(21),gid)).msg,-1);
    const replacement=await groups({operation:'create',cName:'Renamed group'});
    assert.notEqual(replacement.nGroupid,gid);checks++;
    equal((await groups({})).eligibleFactIds.sort(),[id(21)].sort());
    equal((await call('workspace_private_groups',{},id(2))).eligibleFactIds,[id(23)]);
    equal((await groups({})).systemIssueIds,[id(31)]);
    equal((await assign(id(21),replacement.nGroupid)).msg,1);
    for (const [column,value] of [['cFType','QF'],['nUserid',id(2)],['nCaseid',id(12)]]) {
      await db.query('SAVEPOINT identity_change');
      await db.query(`UPDATE "FactMaster" SET "${column}"=$1 WHERE "nFSid"=$2`,[value,id(21)]);
      equal((await db.query('SELECT count(*)::int n FROM "FactPrivateGroup"')).rows[0].n,0);
      await db.query('ROLLBACK TO SAVEPOINT identity_change');
      equal((await groups({})).assignments,{[id(21)]:replacement.nGroupid});
    }
    await db.query('UPDATE "UserCaseUiMode" SET "cUIMode"=\'E\' WHERE "nUserid"=$1',[id(1)]);
    equal((await groups({})).msg,1);
    equal((await groups({operation:'create',cName:'Essential write'})).msg,-1);
    equal((await assign(id(21),replacement.nGroupid)).msg,-1);
    await db.query('UPDATE "TeamRelation" SET "cStatus"=\'I\' WHERE "nUserid"=$1',[id(1)]);
    equal((await groups({})).msg,-1);
    console.log(`PASS: ${checks} PostgreSQL assertions; temporary fixtures only, rolled back.`);
  } finally { await db.query('ROLLBACK').catch(()=>{});await db.end(); }
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
