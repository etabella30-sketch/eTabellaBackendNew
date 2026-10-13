/* Run: node tools/ci/test-case-ui-mode.cjs
 * Compile and exercise the migration in pg_temp on the development DB, then ROLLBACK.
 * Never applies a migration or changes any application table or function. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.development'), quiet: true });
const { Client } = require('pg');
const U1 = '10000000-0000-4000-8000-000000000001', U2 = '10000000-0000-4000-8000-000000000002';
const C1 = '20000000-0000-4000-8000-000000000001', C2 = '20000000-0000-4000-8000-000000000002';
async function main() {
  assert.equal(process.env.DB_DATABASE, 'etabella_tech_uuid', 'Development DB required');
  const db = new Client({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT), user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD, database: process.env.DB_DATABASE,
    ssl: Number(process.env.DB_SSL) > 0 ? { rejectUnauthorized: false } : false, connectionTimeoutMillis: 7000 });
  await db.connect();
  try {
    assert.equal((await db.query('SELECT current_database() AS name')).rows[0].name, 'etabella_tech_uuid', 'Connected development DB required');
    await db.query('BEGIN');
    await db.query(`CREATE TEMP TABLE "UserMaster" ("nUserid" uuid PRIMARY KEY, "cUIMode" text, "isAdmin" boolean);
      CREATE TEMP TABLE "CaseMaster" ("nCaseid" uuid PRIMARY KEY);
      CREATE TEMP TABLE "TeamRelation" ("nUserid" uuid, "nCaseid" uuid, "cStatus" text);
      INSERT INTO "UserMaster" VALUES ('${U1}', 'A', false), ('${U2}', 'E', false);
      INSERT INTO "CaseMaster" VALUES ('${C1}'), ('${C2}');
      INSERT INTO "TeamRelation" SELECT u."nUserid", c."nCaseid", 'A' FROM "UserMaster" u CROSS JOIN "CaseMaster" c;`);
    const source = fs.readFileSync(path.resolve(__dirname, '../../assets/sql-migrations/2026-10-08_user_case_ui_mode.up.sql'), 'utf8');
    // The statements and function bodies stay identical. Explicit public targets point at temporary fixtures.
    const fixtureSql = source.replace(/^BEGIN;\s*$/m, '').replace(/^COMMIT;\s*$/m, '').replace(/public\./g, 'pg_temp.');
    // CREATE TABLE pg_temp creates a temporary table in the session's existing temporary schema.
    await db.query(fixtureSql);
    async function call(kind, actor, caseId, mode) {
      await db.query(`SELECT pg_temp.et_user_case_uimode_${kind}($1::json, 'case_mode_result'::refcursor)`,
        [JSON.stringify({ nMasterid: actor, nCaseid: caseId, ...(mode ? { cUIMode: mode } : {}) })]);
      const answer = await db.query('FETCH ALL FROM case_mode_result'); await db.query('CLOSE case_mode_result');
      return answer.rows[0];
    }
    assert.equal((await call('get', U1, C1)).cUIMode, 'A');
    assert.equal((await call('get', U1, C2)).cUIMode, 'A');
    assert.equal((await call('set', U1, C1, 'E')).msg, 1);
    assert.equal((await call('get', U1, C1)).cUIMode, 'E');
    const policySource = fs.readFileSync(path.resolve(__dirname, '../../libs/permissions/src/case-ui-mode.ts'), 'utf8');
    const policySql = policySource.match(/CASE_MODE_SQL = `([^`]+)`/)[1];
    assert.equal((await db.query(policySql, [U1, C1])).rows[0].cUIMode, 'E');
    assert.equal((await db.query(policySql, [U1, C2])).rows[0].cUIMode, 'A');
    assert.equal((await call('get', U1, C2)).cUIMode, 'A');
    assert.equal((await call('get', U2, C1)).cUIMode, 'E');
    assert.equal((await call('set', U2, C1, 'A')).cUIMode, 'A');
    assert.equal((await call('get', U1, C1)).cUIMode, 'E');
    assert.equal((await db.query('SELECT "cUIMode" FROM "UserMaster" WHERE "nUserid"=$1', [U1])).rows[0].cUIMode, 'A');
    assert.equal((await call('set', U1, C1, 'X')).msg, -1);
    assert.equal((await call('get', U1, C1)).cUIMode, 'E');
    await db.query('UPDATE "TeamRelation" SET "cStatus"=\'I\' WHERE "nUserid"=$1 AND "nCaseid"=$2', [U1, C1]);
    assert.equal((await call('set', U1, C1, 'A')).msg, -1);
    assert.equal((await call('get', U1, C1)).msg, -1);
    await db.query('UPDATE "UserMaster" SET "isAdmin"=true WHERE "nUserid"=$1', [U1]);
    assert.equal((await call('get', U1, '20000000-0000-4000-8000-000000000099')).msg, -1);
    assert.equal((await call('set', U1, C1, 'A')).msg, 1);
    // Idempotent backfill must not overwrite a deliberate case preference.
    await db.query(fixtureSql); assert.equal((await call('get', U2, C2)).cUIMode, 'E');
    console.log('PASS: 19 SQL assertions; temporary fixtures only, rolled back.');
  } finally { await db.query('ROLLBACK').catch(() => {}); await db.end(); }
}
main().catch(error => { console.error('Case mode SQL test failed: ' + error.message); process.exitCode = 1; });
