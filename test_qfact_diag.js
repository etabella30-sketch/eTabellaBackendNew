const { Client } = require('pg');
const c = new Client({
  host: 'public-vultr-prod-244eaba4-aab7-4423-baec-cee3af09d5b7-vultr-pr.vultrdb.com',
  port: 16751,
  user: 'vultradmin',
  password: 'AVNS_VqdeFp4-sE6s4BCPhoU',
  database: 'dev.etabella.com.uuid',
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 8000,
});
(async () => {
  await c.connect();

  // 1. Does the qfact prefs table exist? Does it have any rows?
  const t = await c.query(`
    SELECT to_regclass('public."RUserQFactPref"') AS issue_pref,
           to_regclass('public."RUserQFactClaimPref"') AS claim_pref
  `);
  console.log('Tables exist:', t.rows[0]);

  if (t.rows[0].issue_pref) {
    const cnt = await c.query(`SELECT COUNT(*)::int AS n FROM "RUserQFactPref"`);
    console.log(`RUserQFactPref rows: ${cnt.rows[0].n}`);
    const sample = await c.query(`SELECT * FROM "RUserQFactPref" ORDER BY "dModifyDt" DESC LIMIT 10`);
    sample.rows.forEach(r => console.log(`  user=${r.nUserid?.slice(0,8)} iid=${r.nIid?.slice(0,8)} seq=${r.nQFactSequence} vis=${r.bVisible} mod=${r.dModifyDt?.toISOString?.()}`));
  }

  // 2. Find the "1st" and "2nd" issues in the case
  console.log('\nLooking for "1st" and "2nd" issues:');
  const issues = await c.query(`
    SELECT i."nIid", i."cIName", i."nICid", c."cCategory", i."nSequence" AS fact_seq
    FROM "RIssueMaster" i
    JOIN "RIssueCategoryMaster" c ON c."nICid" = i."nICid"
    WHERE i."cIName" IN ('1st','2nd')
    ORDER BY c."cCategory", i."nSequence"
    LIMIT 10
  `);
  issues.rows.forEach(r => console.log(`  ${r.cCategory} / ${r.cIName}  nIid=${r.nIid?.slice(0,8)}  nICid=${r.nICid?.slice(0,8)}  factSeq=${r.fact_seq}`));

  // 3. Check the issuelist_V2 SP — does it project nQFactSequence?
  console.log('\nChecking et_realtime_issuelist_group for nQFactSequence projection:');
  const sp = await c.query(`
    SELECT pg_get_functiondef(p.oid) AS def
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'et_realtime_issuelist_group' LIMIT 1
  `);
  if (sp.rows.length === 0) {
    console.log('  SP not found');
  } else {
    const def = sp.rows[0].def;
    const hasNQ = /nQFactSequence/i.test(def);
    const hasJoin = /RUserQFactPref/i.test(def);
    console.log(`  Projects nQFactSequence: ${hasNQ}`);
    console.log(`  LEFT JOINs RUserQFactPref: ${hasJoin}`);
    if (hasNQ || hasJoin) {
      const lines = def.split('\n').filter(l => /RUserQFactPref|nQFactSequence|bVisible/i.test(l));
      console.log('  Relevant lines:');
      lines.forEach(l => console.log(`    ${l.trim()}`));
    }
  }

  await c.end();
})().catch(e => { console.error(e.message); process.exit(1); });
