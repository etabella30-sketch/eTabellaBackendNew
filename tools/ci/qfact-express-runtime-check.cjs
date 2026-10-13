// Read-only readiness and preservation audit of the named development fixture.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { Client } = require('pg');
const Redis = require('ioredis');
const env = require('dotenv').parse(fs.readFileSync('.env.development'));
assert.equal(env.DB_DATABASE, 'etabella_tech_uuid');
const artifactRoot = process.argv.includes('--caseview') ? '.codex-artifacts/qfact-caseview' : '.codex-artifacts/qfact-legacy';
const fixture = JSON.parse(fs.readFileSync(artifactRoot+'/fixture.json'));
const gaps = fixture.protocol === 'C' ? [10,24,36] : [10,25,35];
const db = new Client({ host: env.DB_HOST, port: +env.DB_PORT, user: env.DB_USERNAME,
  password: env.DB_PASSWORD, database: env.DB_DATABASE, connectionTimeoutMillis: 10000,
  ssl: +env.DB_SSL > 0 ? { rejectUnauthorized: false } : undefined });
const redis = new Redis(env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 });
const request = url => fetch(url, { signal: AbortSignal.timeout(15000) });

(async () => {
  await db.connect();
  await redis.connect();
  await db.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  const counts = (await db.query(`SELECT
    (SELECT count(*)::int FROM "RHighlights") AS originals,
    (SELECT count(*)::int FROM "RHighlightMapid") AS original_issue_rows,
    (SELECT count(*)::int FROM "QfactLegacyConversion" WHERE "bActive") AS mappings,
    (SELECT count(DISTINCT "nFSid")::int FROM "QfactLegacyConversion" WHERE "bActive") AS unique_ids,
    (SELECT count(*)::int FROM "QfactLegacyHighlights") AS legacy_visible,
    (SELECT count(*)::int FROM "RHighlights" h JOIN "QfactLegacyConversion" m ON m."nHid"=h."nHid"
      WHERE m."jLegacyRow" IS DISTINCT FROM to_jsonb(h)) AS archive_mismatches,
    (SELECT count(*)::int FROM "QfactLegacyConversion" m WHERE m."jLegacyHistory" IS DISTINCT FROM
      (SELECT COALESCE(jsonb_agg(to_jsonb(l) ORDER BY to_jsonb(l)::text),'[]'::jsonb)
        FROM realtime."RHighlightsLog" l WHERE l."nHid"=m."nHid")) AS history_mismatches`)).rows[0];
  // Older clients can still append marks through the compatibility trigger.
  // Keep the migration baseline and audit every current source/mapping below.
  assert.ok(counts.originals >= 11889, 'Original migration baseline must remain present');
  assert.ok(counts.original_issue_rows >= 15099, 'Original Issue association baseline must remain present');
  assert.equal(counts.mappings, counts.originals);
  assert.equal(counts.unique_ids, counts.mappings);
  assert.equal(counts.legacy_visible, 0);
  assert.equal(counts.archive_mismatches, 0);
  assert.equal(counts.history_mismatches, 0);
  const session = (await db.query(`SELECT s."cStatus",s."cParserVer",s."nEntryEventid",c."nCreateId"
    FROM "RSessionMaster" s JOIN "CaseMaster" c USING("nCaseid") WHERE s."nSesid"=$1 AND s."nCaseid"=$2`,
    [fixture.sessionId, fixture.caseId])).rows[0];
  assert.equal(session.nCreateId, fixture.ownerId);
  assert.equal(session.cStatus, 'R');
  assert.equal(session.cParserVer, fixture.parserVersion);
  assert.ok(session.nEntryEventid);
  const page = JSON.parse(await redis.get(`session:${fixture.sessionId}:1`));
  assert.equal(page.length, 4);
  assert.deepEqual(page.map(line => String(line[6])), fixture.identities);
  assert.ok(page.every(line => line[10]?.source === 'hearing-timecode'));
  assert.deepEqual(page.slice(1).map((line, i) => (line[10].frames - page[i][10].frames) / 30), gaps);
  const ui = await request('http://localhost:4200/');
  assert.equal(ui.status, 200);
  const swagger = await request('http://localhost:5005/swagger-json');
  assert.equal(swagger.status, 200);
  const paths = (await swagger.json()).paths;
  assert.ok(paths['/fact/captureline']?.post);
  assert.ok(paths['/fact/livecapture-context']?.get);
  const anonymous = await request(`http://localhost:5005/fact/livecapture-context?nCaseid=${fixture.caseId}&nSesid=${fixture.sessionId}`);
  assert.ok([401,403].includes(anonymous.status), 'Capture context must require authentication');
  const report = { passed: true, environment: 'development', counts, baselineLegacyMarks:11889,
    compatibilityMarksSinceMigration:counts.originals-11889,
    parserVersion: session.cParserVer, frontendReady: true, realtimeReady: true,
    captureRoutesLoaded: true, authenticationRequired: true,
    sourceHearingGaps: gaps, ownerEmail: fixture.ownerEmail, testUrl: fixture.url };
  fs.writeFileSync(artifactRoot+'/runtime-ready.json', JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
})().catch(error => { console.error(error.message); process.exitCode = 1; })
  .finally(async () => { await db.query('ROLLBACK').catch(() => {}); await db.end(); redis.disconnect(); });
