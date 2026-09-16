/** Integration check against PostgreSQL using connection-local temporary tables only.
 * No application records or schema are changed. Always rolls back and disconnects.
 * Run: node scripts/check-attention-documents.cjs [.env.development]
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { Client } = require('pg');
const root = path.resolve(__dirname, '..');
const cfg = require('dotenv').parse(fs.readFileSync(path.resolve(root, process.argv[2] || '.env.development')));
const db = new Client({ host: cfg.DB_HOST, port: Number(cfg.DB_PORT), database: cfg.DB_DATABASE,
  user: cfg.DB_USERNAME, password: cfg.DB_PASSWORD, ...(Number(cfg.DB_SSL) > 0 ? { ssl: { rejectUnauthorized: false } } : {}) });
const source = fs.readFileSync(path.join(root, 'apps/coreapi/src/services/caseactivity/attention-documents.query.ts'), 'utf8');
const sql = {};
new Function('exports', require('typescript').transpileModule(source, { compilerOptions: { module: 1 } }).outputText)(sql);
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

(async () => {
  await db.connect();
  try {
    await db.query('BEGIN');
    await db.query("SET LOCAL search_path TO pg_temp; SET LOCAL TIME ZONE 'UTC'; SET LOCAL statement_timeout = '10s'");
    await db.query(`
      CREATE TEMP TABLE "CaseMaster" ("nCaseid" uuid);
      CREATE TEMP TABLE "UserMaster" ("nUserid" uuid, "isAdmin" boolean);
      CREATE TEMP TABLE "TeamRelation" ("nCaseid" uuid, "nUserid" uuid, "cStatus" text);
      CREATE TEMP TABLE "SectionMaster" ("nSectionid" uuid, "nCaseid" uuid, "nUserid" uuid);
      CREATE TEMP TABLE "BundleMaster" ("nBundleid" uuid, "nParentBundleid" uuid);
      CREATE TEMP TABLE "BundleDetail" ("nBundledetailid" uuid, "nBundleid" uuid, "nSectionid" uuid,
        "cStatus" text, "cIsindex" boolean, "dCreateDt" timestamp, "cFilename" text, "cTab" text, "cFiletype" text);
      CREATE TEMP TABLE "LogBundleDetail" ("nBundledetailid" uuid, "nLCatid" int, "dCreateDt" timestamp);
      CREATE TEMP TABLE "BMPermission" ("nUserid" uuid, "nBundleid" uuid);
      CREATE TEMP TABLE "BDPermission" ("nUserid" uuid, "nBundledetailid" uuid);
      CREATE TEMP TABLE "BDShare" ("nUserid" uuid, "nBundleid" uuid, "nBundledetailid" uuid);
      CREATE TEMP TABLE "BDAssignment" ("nUserid" uuid, "nBundledetailid" uuid);
    `);
    const caseId = id(1000), userId = id(2000), other = id(2001), section = id(3000), privateSection = id(3001);
    await db.query('INSERT INTO pg_temp."CaseMaster" VALUES ($1)', [caseId]);
    await db.query('INSERT INTO pg_temp."TeamRelation" VALUES ($1,$2,\'A\')', [caseId, userId]);
    await db.query('INSERT INTO pg_temp."SectionMaster" VALUES ($1,$2,NULL),($3,$2,$4),($5,$6,NULL)', [section, caseId, privateSection, other, id(3002), id(1001)]);
    await db.query('INSERT INTO pg_temp."BundleMaster" VALUES ($1,NULL),($2,$1),($3,NULL),($4,$3)', [id(4000), id(4001), id(4002), id(4003)]);
    await db.query('INSERT INTO pg_temp."BMPermission" VALUES ($1,$2)', [userId, id(4000)]);
    await db.query('INSERT INTO pg_temp."BDPermission" VALUES ($1,$2)', [userId, id(4)]);
    await db.query('INSERT INTO pg_temp."BDShare" VALUES ($1,NULL,$2),($1,$3,NULL)', [userId, id(7), id(4002)]);
    await db.query('INSERT INTO pg_temp."BDAssignment" VALUES ($1,$2)', [userId, id(9)]);
    for (let n = 1; n <= 74; n++) {
      const ownerSection = [6,7,8,9].includes(n) ? privateSection : n === 12 ? id(3002) : section;
      const created = n === 10 ? '2026-09-16 00:00:00' : [13,14].includes(n) ? '2026-09-10 00:00:00' : '2026-09-15 00:00:00';
      await db.query('INSERT INTO pg_temp."BundleDetail" VALUES ($1,$2,$3,$4,$5,$6,$7,$8,\'PDF\')',
        [id(n), n === 5 ? id(4001) : n === 8 ? id(4003) : null, ownerSection, n === 2 ? 'D' : 'C', n === 3, created, `Document ${n}`, `A${n}`]);
    }
    for (const n of [1,1,2,3,4,5,6,12,13]) {
      await db.query('INSERT INTO pg_temp."LogBundleDetail" VALUES ($1,20,\'2026-09-14 12:00:00\')', [id(n)]);
    }
    // A newer update must not erase yesterday's event; reads must not count.
    await db.query('INSERT INTO pg_temp."LogBundleDetail" VALUES ($1,20,\'2026-09-15 01:00:00\'),($2,21,\'2026-09-14 12:00:00\'),($3,20,\'2026-09-15 00:00:00\')', [id(1),id(11),id(14)]);
    const yesterday = '2026-09-14T00:00:00Z', today = '2026-09-15T00:00:00Z', tomorrow = '2026-09-16T00:00:00Z', asOf = '2026-09-15T12:00:00Z';
    assert.equal((await db.query(sql.ATTENTION_ACCESS, [caseId,userId])).rows[0].allowed, true);
    assert.equal((await db.query(sql.ATTENTION_ACCESS, [caseId,other])).rows[0].allowed, false);
    const counts = (await db.query(sql.ATTENTION_SUMMARY, [caseId,userId,yesterday,today,asOf,tomorrow])).rows[0];
    assert.deepEqual(counts, { documentsAddedToday: 65, documentsUpdatedYesterday: 2 });
    const added = [];
    for (const offset of [0,50]) {
      const result = (await db.query(sql.ATTENTION_LIST, [caseId,userId,today,tomorrow,asOf,'added',offset])).rows[0];
      assert.equal(result.total, counts.documentsAddedToday); added.push(...result.rows.map(r => r.id));
    }
    assert.equal(new Set(added).size, 65);
    for (const n of [2,3,4,5,6,10,12,13,14]) assert.equal(added.includes(id(n)), false);
    for (const n of [1,7,8,9,11]) assert.equal(added.includes(id(n)), true);
    const updated = (await db.query(sql.ATTENTION_LIST, [caseId,userId,yesterday,today,asOf,'updated',0])).rows[0];
    assert.equal(updated.total, counts.documentsUpdatedYesterday);
    assert.deepEqual(updated.rows.map(r => r.id).sort(), [id(1),id(13)]);
    const emptyPage = (await db.query(sql.ATTENTION_LIST, [caseId,userId,yesterday,today,asOf,'updated',50])).rows[0];
    assert.equal(emptyPage.total, 2); assert.deepEqual(emptyPage.rows, []);
    console.log('PASS: access, recursive denies/shares, assignments, duplicate events, date boundaries, summary/list parity and pagination');
  } finally {
    await db.query('ROLLBACK'); await db.end();
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
