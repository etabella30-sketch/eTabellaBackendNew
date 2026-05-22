/* eslint-disable */
// One-shot SP audit: connects to Postgres, dumps every user-schema function
// to ../sp-audit/sp/<schema>/<name>.sql, then runs static-pattern checks
// and writes inventory.csv, findings.csv, and REPORT.md.
//
// Read-only on pg_proc. Single connection. Run:  node scripts/sp-audit.js

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

function loadEnv(file) {
  const env = {};
  const text = fs.readFileSync(file, 'utf8');
  for (let line of text.split(/\r?\n/)) {
    line = line.trim();
    if (!line || line.startsWith('#') || line.startsWith('//')) continue;
    const idx = line.indexOf('=');
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1);
    // Strip trailing inline comments only when there is whitespace before #
    const m = val.match(/^([^#]*?)(\s+#.*)?$/);
    if (m) val = m[1];
    val = val.trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

const ROOT = path.resolve(__dirname, '..');
const env = loadEnv(path.join(ROOT, '.env.development'));
const OUT_DIR = path.join(ROOT, 'sp-audit');
const DUMP_DIR = path.join(OUT_DIR, 'sp');

function csvEsc(v) {
  if (v == null) return '';
  const s = String(v);
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function safeName(n) {
  return n.replace(/[^a-zA-Z0-9_]/g, '_');
}

function stripComments(s) {
  return s.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
}

function runChecks(inv, def, findings) {
  const { schema, name, lines, volatility, return_type, security_definer } = inv;
  const code = stripComments(def);

  const exceptOthers = (code.match(/EXCEPTION\s+WHEN\s+OTHERS/gi) || []).length;
  if (exceptOthers > 0) findings.push({ schema, name, severity: 'MEDIUM', issue: 'EXCEPTION_WHEN_OTHERS', details: `${exceptOthers} occurrence(s)` });

  const raiseNotice = (code.match(/RAISE\s+NOTICE/gi) || []).length;
  if (raiseNotice > 0) findings.push({ schema, name, severity: 'LOW', issue: 'RAISE_NOTICE_DEBUG', details: `${raiseNotice} statement(s)` });

  if (security_definer) findings.push({ schema, name, severity: 'MEDIUM', issue: 'SECURITY_DEFINER', details: 'runs as owner' });

  const hasMutation = /\b(INSERT\s+INTO|UPDATE\s+\"?\w|DELETE\s+FROM|TRUNCATE|MERGE\s+INTO|PERFORM\s+\w)/i.test(code);
  if (!hasMutation && volatility === 'v' && return_type !== 'void' && return_type !== 'trigger' && !/^event_trigger/i.test(return_type || '')) {
    findings.push({ schema, name, severity: 'MEDIUM', issue: 'VOLATILE_BUT_READ_ONLY', details: 'no INSERT/UPDATE/DELETE — should be STABLE' });
  }

  const selectInto = (code.match(/\bSELECT\b[\s\S]{0,400}?\bINTO\b/gi) || []).length;
  if (selectInto >= 3) findings.push({ schema, name, severity: 'LOW', issue: 'MULTIPLE_SELECT_INTO', details: `${selectInto} SELECT INTO statements` });

  const selectStar = (code.match(/SELECT\s+\*/gi) || []).length;
  if (selectStar > 0) findings.push({ schema, name, severity: 'LOW', issue: 'SELECT_STAR', details: `${selectStar} SELECT *` });

  const execStmt = (code.match(/\bEXECUTE\s+/gi) || []).length;
  if (execStmt > 0) {
    const usingClause = (code.match(/\bEXECUTE\b[\s\S]{0,800}?\bUSING\b/gi) || []).length;
    const noUsing = Math.max(0, execStmt - usingClause);
    if (noUsing > 0) findings.push({ schema, name, severity: 'HIGH', issue: 'EXECUTE_NO_USING', details: `${noUsing} EXECUTE without USING — possible SQL injection` });
    else findings.push({ schema, name, severity: 'LOW', issue: 'DYNAMIC_SQL', details: `${execStmt} EXECUTE w/ USING` });
  }

  if (lines > 300) findings.push({ schema, name, severity: 'LOW', issue: 'VERY_LONG_BODY', details: `${lines} lines` });

  const leftJoins = (code.match(/\bLEFT\s+JOIN\b/gi) || []).length;
  const distinctCount = (code.match(/SELECT\s+DISTINCT/gi) || []).length;
  const opensRefcursor = /OPEN\s+\w+\s+FOR/i.test(code);
  if (leftJoins >= 4 && distinctCount === 0 && opensRefcursor) {
    findings.push({ schema, name, severity: 'LOW', issue: 'MANY_LEFT_JOINS_NO_DISTINCT', details: `${leftJoins} LEFT JOIN(s), no DISTINCT — verify no row duplication` });
  }

  const openRef = (code.match(/\bOPEN\s+\w+\s+FOR\b/gi) || []).length;
  if (openRef >= 5) findings.push({ schema, name, severity: 'LOW', issue: 'MANY_REFCURSORS', details: `${openRef} refcursors` });

  const paramAccess = (code.match(/parameter\s*->>?/gi) || []).length;
  if (paramAccess > 30) findings.push({ schema, name, severity: 'LOW', issue: 'HEAVY_JSON_PARAM_PARSING', details: `${paramAccess} parameter ->> accesses` });

  const noTimeout = !/SET\s+statement_timeout/i.test(code);
  // (no finding — informational only at SP level)

  // FOR loops with implicit cursor over a query that mutates the same table
  const forLoop = (code.match(/\bFOR\s+\w+\s+IN\s+SELECT/gi) || []).length;
  if (forLoop >= 3) findings.push({ schema, name, severity: 'LOW', issue: 'ROW_BY_ROW_LOOP', details: `${forLoop} FOR ... IN SELECT loops — usually rewriteable as set-based UPDATE/INSERT ... SELECT` });
}

function issueDescription(issue) {
  const desc = {
    EXCEPTION_WHEN_OTHERS: 'Catches every exception class, hides deadlocks, timeouts, OOM, query cancellations behind a generic handler. Replace with specific exception classes (`unique_violation`, `foreign_key_violation`, etc.) and let everything else propagate.',
    RAISE_NOTICE_DEBUG: 'NOTICE statements left in shipping code. Each one round-trips a message to the client and dominates log volume in tight loops.',
    SECURITY_DEFINER: 'Function runs with owner privileges, not caller privileges. Audit each one for privilege escalation paths and confirm `search_path` is set inside the function.',
    VOLATILE_BUT_READ_ONLY: 'No INSERT/UPDATE/DELETE in body but defaults to VOLATILE. Mark `STABLE` so the planner can cache results within a query and parallelize.',
    MULTIPLE_SELECT_INTO: '3+ sequential `SELECT … INTO` scalars are usually consolidatable into one CTE. Each is a separate plan + round-trip.',
    SELECT_STAR: '`SELECT *` inside `OPEN ref FOR …` is fragile (column add changes wire format) and often returns columns the frontend never reads.',
    EXECUTE_NO_USING: 'Dynamic SQL built without parameter binding. **High SQL injection risk** if any input flows into the EXECUTE string. Audit each one.',
    DYNAMIC_SQL: 'EXECUTE with proper USING binding. Worth reviewing for plan-cache-defeating patterns.',
    VERY_LONG_BODY: '> 300 lines. Refactoring candidate — split into helper SPs or move orchestration to the application.',
    MANY_LEFT_JOINS_NO_DISTINCT: 'Multiple LEFT JOINs feeding a refcursor with no DISTINCT. This is the `et_marks` bug class (April 15 fix) — verify with row-count tests.',
    MANY_REFCURSORS: '5+ refcursors in one SP. Frontend rarely needs all of them per call. Consider splitting endpoints.',
    HEAVY_JSON_PARAM_PARSING: '30+ `parameter ->>` accesses. SP is taking too many inputs. Each access re-parses the JSON.',
    ROW_BY_ROW_LOOP: '`FOR row IN SELECT … LOOP` patterns are usually rewriteable as one set-based `INSERT … SELECT` or `UPDATE … FROM` — orders of magnitude faster.',
  };
  return desc[issue] || '';
}

function generateReport(inventory, findings) {
  const bySchema = {};
  inventory.forEach(s => { (bySchema[s.schema] = bySchema[s.schema] || []).push(s); });

  const byIssue = {};
  findings.forEach(f => { (byIssue[f.issue] = byIssue[f.issue] || []).push(f); });

  const perSp = {};
  findings.forEach(f => { const k = `${f.schema}.${f.name}`; (perSp[k] = perSp[k] || []).push(f); });
  const ranked = Object.entries(perSp).map(([k, fs]) => ({ key: k, count: fs.length, issues: fs }))
    .sort((a, b) => b.count - a.count);

  const sevPriority = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  const issueOrder = Object.keys(byIssue).sort((a, b) =>
    (sevPriority[byIssue[a][0].severity] - sevPriority[byIssue[b][0].severity]) ||
    (byIssue[b].length - byIssue[a].length)
  );

  let md = `# Stored Procedure Audit — ${env.DB_DATABASE}\n\n`;
  md += `**Host:** ${env.DB_HOST}:${env.DB_PORT}\n`;
  md += `**Generated:** ${new Date().toISOString()}\n`;
  md += `**Total SPs scanned:** ${inventory.length}\n`;
  md += `**Total findings:** ${findings.length}\n\n`;

  md += `## SPs by schema\n\n| Schema | SPs |\n|---|---|\n`;
  Object.entries(bySchema).sort((a, b) => b[1].length - a[1].length).forEach(([s, list]) => { md += `| ${s} | ${list.length} |\n`; });

  md += `\n## SPs by language\n\n| Language | Count |\n|---|---|\n`;
  const byLang = {};
  inventory.forEach(s => { byLang[s.language] = (byLang[s.language] || 0) + 1; });
  Object.entries(byLang).sort((a, b) => b[1] - a[1]).forEach(([l, c]) => { md += `| ${l} | ${c} |\n`; });

  md += `\n## SPs by volatility\n\n| Volatility | Count |\n|---|---|\n`;
  const volMap = { i: 'IMMUTABLE', s: 'STABLE', v: 'VOLATILE (default)' };
  const byVol = {};
  inventory.forEach(s => { const k = volMap[s.volatility] || s.volatility; byVol[k] = (byVol[k] || 0) + 1; });
  Object.entries(byVol).sort((a, b) => b[1] - a[1]).forEach(([v, c]) => { md += `| ${v} | ${c} |\n`; });

  md += `\n## Largest SPs (top 20 by line count)\n\n| Lines | SP |\n|---|---|\n`;
  inventory.slice().sort((a, b) => b.lines - a.lines).slice(0, 20).forEach(s => {
    md += `| ${s.lines} | \`${s.schema}.${s.name}\` |\n`;
  });

  md += `\n## Findings summary\n\n| Severity | Issue | SPs affected |\n|---|---|---|\n`;
  issueOrder.forEach(issue => {
    const list = byIssue[issue];
    md += `| ${list[0].severity} | ${issue} | ${list.length} |\n`;
  });

  md += `\n## Top 30 SPs by issue count\n\n| Rank | SP | Issues |\n|---|---|---|\n`;
  ranked.slice(0, 30).forEach((r, i) => {
    md += `| ${i + 1} | \`${r.key}\` | ${r.issues.map(x => x.issue).join(', ')} |\n`;
  });

  md += `\n## Findings by issue type\n\n`;
  issueOrder.forEach(issue => {
    const list = byIssue[issue];
    md += `### ${list[0].severity} — ${issue} (${list.length} SPs)\n\n`;
    md += `${issueDescription(issue)}\n\n`;
    md += `<details><summary>Affected SPs (${list.length})</summary>\n\n`;
    list.slice(0, 80).forEach(f => { md += `- \`${f.schema}.${f.name}\` — ${f.details}\n`; });
    if (list.length > 80) md += `- … and ${list.length - 80} more (see findings.csv)\n`;
    md += `\n</details>\n\n`;
  });

  fs.writeFileSync(path.join(OUT_DIR, 'REPORT.md'), md);
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(DUMP_DIR, { recursive: true });

  if (!env.DB_HOST) { console.error('DB_HOST missing from .env.development'); process.exit(1); }
  console.log(`Connecting to ${env.DB_HOST}:${env.DB_PORT}/${env.DB_DATABASE} as ${env.DB_USERNAME} ...`);

  const client = new Client({
    host: env.DB_HOST,
    port: Number(env.DB_PORT),
    user: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: env.DB_DATABASE,
    ssl: Number(env.DB_SSL) > 0 ? { rejectUnauthorized: false } : false,
    statement_timeout: 120000,
    connectionTimeoutMillis: 15000,
    application_name: 'sp-audit-script',
  });

  await client.connect();
  console.log('Connected. Fetching SP catalog (this can take 10-30s for 600+ SPs)...');

  const sql = `
    SELECT
      n.nspname AS schema_name,
      p.proname AS function_name,
      pg_get_function_identity_arguments(p.oid) AS args,
      pg_get_function_result(p.oid) AS return_type,
      l.lanname AS language,
      p.provolatile AS volatility,
      p.prosecdef AS security_definer,
      pg_get_functiondef(p.oid) AS definition
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    JOIN pg_language l ON l.oid = p.prolang
    WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
      AND n.nspname NOT LIKE 'pg_%'
      AND l.lanname IN ('plpgsql', 'sql', 'plpython3u', 'plperl', 'c')
    ORDER BY n.nspname, p.proname;
  `;
  const result = await client.query(sql);
  console.log(`Fetched ${result.rows.length} SPs.`);
  await client.end();
  console.log('Disconnected.');

  const inventory = [];
  const findings = [];
  const seen = new Set();

  for (const row of result.rows) {
    const schemaDir = path.join(DUMP_DIR, row.schema_name);
    fs.mkdirSync(schemaDir, { recursive: true });
    let base = safeName(row.function_name);
    let filename = `${base}.sql`;
    let key = `${row.schema_name}.${filename}`;
    let n = 0;
    while (seen.has(key)) { n++; filename = `${base}__${n}.sql`; key = `${row.schema_name}.${filename}`; }
    seen.add(key);
    fs.writeFileSync(path.join(schemaDir, filename), row.definition);

    const lines = row.definition.split(/\r?\n/).length;
    const inv = {
      schema: row.schema_name,
      name: row.function_name,
      args: row.args,
      return_type: row.return_type,
      language: row.language,
      volatility: row.volatility,
      security_definer: row.security_definer,
      lines,
      bytes: Buffer.byteLength(row.definition, 'utf8'),
      filename: `${row.schema_name}/${filename}`,
    };
    inventory.push(inv);
    if (inv.language === 'plpgsql' || inv.language === 'sql') runChecks(inv, row.definition, findings);
  }

  const invHeader = 'schema,name,args,return_type,language,volatility,security_definer,lines,bytes,filename';
  const invRows = inventory.map(r => [r.schema, r.name, csvEsc(r.args), csvEsc(r.return_type), r.language, r.volatility, r.security_definer, r.lines, r.bytes, r.filename].join(','));
  fs.writeFileSync(path.join(OUT_DIR, 'inventory.csv'), [invHeader, ...invRows].join('\n'));

  const fHeader = 'schema,name,severity,issue,details';
  const fRows = findings.map(f => [f.schema, f.name, f.severity, f.issue, csvEsc(f.details)].join(','));
  fs.writeFileSync(path.join(OUT_DIR, 'findings.csv'), [fHeader, ...fRows].join('\n'));

  generateReport(inventory, findings);

  console.log(`\nWrote:`);
  console.log(`  ${path.relative(ROOT, OUT_DIR)}/inventory.csv  (${inventory.length} SPs)`);
  console.log(`  ${path.relative(ROOT, OUT_DIR)}/findings.csv   (${findings.length} findings)`);
  console.log(`  ${path.relative(ROOT, OUT_DIR)}/REPORT.md`);
  console.log(`  ${path.relative(ROOT, OUT_DIR)}/sp/<schema>/<name>.sql  (${inventory.length} files)`);
})().catch(err => { console.error('FAILED:', err); process.exit(1); });
