/* Development integration checks. Application rows are only read/locked;
 * fixture writes are TEMP or explicitly rolled back on both connections. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { Client } = require('pg');
const cfg = require('dotenv').parse(fs.readFileSync(path.resolve(__dirname, '../../.env.development')));
assert.equal(cfg.DB_DATABASE, 'etabella_tech_uuid', 'Only the development database is allowed');
require('ts-node').register({ transpileOnly: true });
require('tsconfig-paths/register');
const { DbService } = require('../../libs/global/src/db/pg/db.service');
const { CASE_MODE_SQL } = require('../../libs/permissions/src/case-ui-mode');
const { FACT_EXPORT_ACCESS_SQL, TASK_EXPORT_ACCESS_SQL, DOCLINK_EXPORT_SQL } = require('../../libs/global/src/utility/data-export/type-source');
const U1 = '10000000-0000-4000-8000-000000000001', U2 = '10000000-0000-4000-8000-000000000002';
const C1 = '20000000-0000-4000-8000-000000000001', C2 = '20000000-0000-4000-8000-000000000002';
const F1 = '30000000-0000-4000-8000-000000000001';
let checks = 0;
function check(actual, expected, message) { assert.deepEqual(actual, expected, message); checks++; }
async function connect() {
  const db = new Client({ host: cfg.DB_HOST, port: Number(cfg.DB_PORT), user: cfg.DB_USERNAME,
    password: cfg.DB_PASSWORD, database: cfg.DB_DATABASE,
    ssl: Number(cfg.DB_SSL) > 0 ? { rejectUnauthorized: false } : false, connectionTimeoutMillis: 7000 });
  await db.connect();
  check((await db.query('SELECT current_database() AS name')).rows[0].name, 'etabella_tech_uuid', 'Connected DB');
  return db;
}
async function main() {
  const db = await connect();
  let contender;
  try {
    const source = fs.readFileSync(path.resolve(__dirname, '../../assets/sql-migrations/2026-10-08_user_case_ui_mode.up.sql'), 'utf8');
    const installed = (await db.query(`SELECT p.proname, p.prosrc, p.proconfig FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='public' AND p.proname IN ('et_user_case_uimode_get','et_user_case_uimode_set')`)).rows;
    check(installed.length, 2, 'Both installed mode functions');
    for (const fn of installed) {
      const expected = source.match(new RegExp('FUNCTION public\\.' + fn.proname + '[\\s\\S]*?AS \\$fn\\$([\\s\\S]*?)\\$fn\\$;'))[1];
      check(fn.prosrc.trim().replace(/\r/g, ''), expected.trim().replace(/\r/g, ''), 'Installed function matches reviewed migration');
      check(fn.proconfig, null, 'No search_path override: temporary fixtures shadow data tables');
    }
    check((await db.query(`SELECT to_regclass('public."UserCaseUiMode"') IS NOT NULL AS exists`)).rows[0].exists, true, 'Installed preference table');
    // Actual public functions use these same-named temporary fixtures for every table.
    await db.query(`CREATE TEMP TABLE "UserMaster" ("nUserid" uuid PRIMARY KEY, "cUIMode" text, "isAdmin" boolean);
      CREATE TEMP TABLE "CaseMaster" ("nCaseid" uuid PRIMARY KEY);
      CREATE TEMP TABLE "TeamRelation" ("nUserid" uuid, "nCaseid" uuid, "cStatus" text);
      CREATE TEMP TABLE "UserCaseUiMode" ("nUserid" uuid, "nCaseid" uuid, "cUIMode" varchar(1), "dUpdateDt" timestamptz DEFAULT now(), PRIMARY KEY ("nUserid","nCaseid"));
      CREATE TEMP TABLE "FactMaster" ("nFSid" uuid PRIMARY KEY, "nCaseid" uuid, "cFType" text);
      CREATE TEMP TABLE "CaseModeSaveFixture" (stage text);
      INSERT INTO "UserMaster" VALUES ('${U1}', 'A', false), ('${U2}', 'E', false);
      INSERT INTO "CaseMaster" VALUES ('${C1}'), ('${C2}');
      INSERT INTO "TeamRelation" SELECT u."nUserid", c."nCaseid", 'A' FROM "UserMaster" u CROSS JOIN "CaseMaster" c;
      INSERT INTO "FactMaster" VALUES ('${F1}','${C1}','F');`);
    async function mode(kind, user, caseId, value) {
      await db.query('BEGIN');
      try {
        await db.query(`SELECT public.et_user_case_uimode_${kind}($1::json, 'result'::refcursor)`, [JSON.stringify({ nMasterid: user, nCaseid: caseId, cUIMode: value })]);
        const result = (await db.query('FETCH ALL FROM result')).rows[0];
        await db.query('COMMIT'); // all tables in this call are temporary fixtures
        return result;
      } catch (error) { await db.query('ROLLBACK'); throw error; }
    }
    check((await mode('get', U1, C1)).cUIMode, 'E', 'Unseeded pair defaults Essential');
    check((await mode('set', U1, C1, 'A')).msg, 1, 'Set Advanced');
    check((await mode('get', U1, C1)).cUIMode, 'A', 'Authoritative read');
    check((await mode('get', U1, C2)).cUIMode, 'E', 'Case independence');
    check((await mode('get', U2, C1)).cUIMode, 'E', 'User independence');
    check((await mode('set', U1, C1, 'E')).cUIMode, 'E', 'Switch Essential');
    check((await mode('set', U1, C1, 'X')).msg, -1, 'Invalid mode denied');
    check((await mode('get', U1, C1)).cUIMode, 'E', 'Failure leaves confirmed mode');
    await db.query('UPDATE "TeamRelation" SET "cStatus"=\'I\' WHERE "nUserid"=$1 AND "nCaseid"=$2', [U1, C1]);
    check((await mode('get', U1, C1)).msg, -1, 'Revoked access denies mode read');
    check((await mode('set', U1, C1, 'A')).msg, -1, 'Switch cannot restore revoked access');
    check((await db.query('SELECT "cStatus" FROM "TeamRelation" WHERE "nUserid"=$1 AND "nCaseid"=$2', [U1, C1])).rows[0].cStatus, 'I', 'Membership unchanged');
    check((await db.query('SELECT "cUIMode" FROM "UserMaster" WHERE "nUserid"=$1', [U1])).rows[0].cUIMode, 'A', 'Legacy account preference unchanged');
    await db.query('UPDATE "TeamRelation" SET "cStatus"=\'A\' WHERE "nUserid"=$1 AND "nCaseid"=$2', [U1, C1]);
    await mode('set', U1, C1, 'A');
    // Exercise the real DbService against PostgreSQL: repeated refcursor names,
    // application-level failures, SQL failures and full transaction rollback.
    await db.query(`CREATE FUNCTION pg_temp.mode_save_fixture(parameter json, ref refcursor) RETURNS refcursor LANGUAGE plpgsql AS $f$
      BEGIN
        INSERT INTO "CaseModeSaveFixture" VALUES (parameter->>'stage');
        IF parameter->>'stage'='throw' THEN RAISE EXCEPTION 'simulated save failure'; END IF;
        OPEN ref FOR SELECT CASE WHEN parameter->>'stage'='reject' THEN -1 ELSE 1 END AS msg;
        RETURN ref;
      END $f$`);
    const service = Object.create(DbService.prototype);
    service.pool = { connect: async () => ({ query: (...args) => db.query(...args), release() {} }) };
    service.logger = { warn() {}, error() {} };
    service.queryBuilder = { buildQuery: (body) => `SELECT pg_temp.mode_save_fixture('${JSON.stringify(body).replace(/'/g, "''")}'::json,'r1'::refcursor); FETCH ALL FROM r1` };
    for (const lastStage of ['reject', 'throw']) {
      const result = await service.saveAtomically(async () => {
        await service.executeRef('fact_insert_detail', { nMasterid: U1, nFSid: F1, stage: 'first' });
        await service.executeRef('fact_insert_team', { nMasterid: U1, nFSid: F1, stage: lastStage });
        return { msg: 1, nFSid: F1 }; // mimic legacy controller swallowing its child failure
      });
      check(result.msg, -1, lastStage + ' cannot be reported as save success');
      check(result.nFSid, undefined, 'No rolled-back id in failure');
      check((await db.query('SELECT count(*)::int AS n FROM "CaseModeSaveFixture"')).rows[0].n, 0, 'All stages rolled back');
    }
    check(await service.saveAtomically(async () => {
      await service.executeRef('fact_insert_detail', { nMasterid: U1, nFSid: F1, stage: 'first' });
      await service.executeRef('fact_insert_team', { nMasterid: U1, nFSid: F1, stage: 'second' });
      return { msg: 1, value: 'Saved' };
    }), { msg: 1, value: 'Saved' }, 'Successful response unchanged');
    check((await db.query('SELECT stage FROM "CaseModeSaveFixture" ORDER BY stage')).rows.map(r => r.stage), ['first', 'second'], 'All stages commit together');

    // Real permission SQL, with read-visible shared records whose separate copy
    // permission is false. Every relation below is a temporary fixture.
    await db.query(`ALTER TABLE "FactMaster" ADD COLUMN "nUserid" uuid;
      UPDATE "FactMaster" SET "nUserid"='${U2}';
      ALTER TABLE "UserMaster" ADD COLUMN "cFname" text DEFAULT 'Test';
      ALTER TABLE "UserMaster" ADD COLUMN "cLname" text DEFAULT 'User';
      CREATE TEMP TABLE "FMShared" ("nFSid" uuid,"nUserid" uuid,"bCanCopy" boolean);
      CREATE TEMP TABLE "TaskMaster" ("nTaskid" uuid,"nCaseid" uuid,"nUserid" uuid);
      CREATE TEMP TABLE "TaskShared" ("nTaskid" uuid,"nUserid" uuid,"bCanCopy" boolean);
      CREATE TEMP TABLE "DocMaster" ("nDocid" uuid,"nCaseid" uuid,"nUserid" uuid,"nBundledetailid" uuid,"dCreateDt" timestamptz DEFAULT now());
      CREATE TEMP TABLE "DMShared" ("nDocid" uuid,"nUserid" uuid,"bCanCopy" boolean);
      CREATE TEMP TABLE "DocDetail" ("nDocid" uuid,"cType" text,"jLinktype" jsonb,"nPage" int,"nLine" int,"jTexts" jsonb);
      CREATE TEMP TABLE "BundleDetail" ("nBundledetailid" uuid,"cTab" text,"cFilename" text);
      CREATE TEMP TABLE "DMLinks" ("nDocid" uuid,"nBundledetailid" uuid);
      CREATE TEMP TABLE bundlesource ("nBundledetailid" uuid,"nCaseid" uuid);
      INSERT INTO "FMShared" VALUES ('${F1}','${U1}',false);
      INSERT INTO "TaskMaster" VALUES ('${F1}','${C1}','${U2}');
      INSERT INTO "TaskShared" VALUES ('${F1}','${U1}',false);
      INSERT INTO "DocMaster" ("nDocid","nCaseid","nUserid","nBundledetailid") VALUES ('${F1}','${C1}','${U2}','${F1}');
      INSERT INTO "DMShared" VALUES ('${F1}','${U1}',false);
      INSERT INTO "DocDetail" ("nDocid","jTexts") VALUES ('${F1}','["Live note"]');
      INSERT INTO "BundleDetail" VALUES ('${F1}','A1','Document');
      INSERT INTO "DMLinks" VALUES ('${F1}','${F1}');
      INSERT INTO bundlesource VALUES ('${F1}','${C1}');`);
    for (const [kind, sql, shared] of [['Fact', FACT_EXPORT_ACCESS_SQL, 'FMShared'], ['Task', TASK_EXPORT_ACCESS_SQL, 'TaskShared'], ['DocLink', DOCLINK_EXPORT_SQL, 'DMShared']]) {
      const params = kind === 'DocLink' ? [C1, U1] : [[F1], C1, U1];
      check((await db.query(sql, params)).rowCount, 0, kind + ' read access does not grant copy');
      await db.query(`UPDATE "${shared}" SET "bCanCopy"=true`);
      check((await db.query(sql, params)).rowCount, 1, kind + ' explicit copy permission allows export');
      await db.query('UPDATE "TeamRelation" SET "cStatus"=\'I\' WHERE "nUserid"=$1 AND "nCaseid"=$2', [U1, C1]);
      check((await db.query(sql, params)).rowCount, 0, kind + ' revoked case access still denies export');
      await db.query('UPDATE "TeamRelation" SET "cStatus"=\'A\' WHERE "nUserid"=$1 AND "nCaseid"=$2', [U1, C1]);
      const ownerParams = kind === 'DocLink' ? [C1, U2] : [[F1], C1, U2];
      check((await db.query(sql, ownerParams)).rowCount, 1, kind + ' owner retains export');
    }

    // Two clients on an existing application preference: lock/read only in the
    // first, UPDATE in a rolled-back second transaction. No committed data edits.
    const existing = (await db.query('SELECT "nUserid", "nCaseid", "cUIMode" FROM public."UserCaseUiMode" LIMIT 1')).rows[0];
    assert.ok(existing, 'A development preference is needed for the lock check');
    contender = await connect();
    await db.query('BEGIN');
    const lockSql = CASE_MODE_SQL.replace('FROM "UserCaseUiMode"', 'FROM public."UserCaseUiMode"');
    await db.query(lockSql, [existing.nUserid, existing.nCaseid]);
    await contender.query('BEGIN');
    await contender.query("SET LOCAL lock_timeout='150ms'");
    let code;
    try { await contender.query('UPDATE public."UserCaseUiMode" SET "cUIMode"=$3 WHERE "nUserid"=$1 AND "nCaseid"=$2', [existing.nUserid, existing.nCaseid, existing.cUIMode === 'A' ? 'E' : 'A']); }
    catch (error) { code = error.code; }
    check(code, '55P03', 'Mode switch waits while the save holds its share lock');
    await contender.query('ROLLBACK');
    await db.query('ROLLBACK');
    await contender.query('BEGIN');
    await contender.query("SET LOCAL lock_timeout='1s'");
    await contender.query('UPDATE public."UserCaseUiMode" SET "cUIMode"=$3 WHERE "nUserid"=$1 AND "nCaseid"=$2', [existing.nUserid, existing.nCaseid, existing.cUIMode]);
    checks++;
    await contender.query('ROLLBACK');
    check((await contender.query('SELECT "cUIMode" FROM public."UserCaseUiMode" WHERE "nUserid"=$1 AND "nCaseid"=$2', [existing.nUserid, existing.nCaseid])).rows[0].cUIMode, existing.cUIMode, 'Application preference unchanged after rollback');
    console.log(`PASS: ${checks} installed-schema, real DbService rollback/refcursor and two-client locking checks on etabella_tech_uuid. No committed application-data changes.`);
  } finally {
    if (contender) { await contender.query('ROLLBACK').catch(() => {}); await contender.end(); }
    await db.query('ROLLBACK').catch(() => {}); await db.end();
  }
}
main().catch(error => { console.error('Deep case mode test failed: ' + error.message); process.exitCode = 1; });
