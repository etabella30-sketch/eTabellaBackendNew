/**
 * Local Elasticsearch content-search STUB — DEV ONLY.
 * ---------------------------------------------------------------------------
 * The real eTabella content-search microservice (what the frontend calls at
 * `environment.api.elastic` → http://localhost:5015 in dev) is NOT in this
 * repo — it's deployed separately. This tiny stand-in lets you test the
 * frontend's "Enable file content search" end-to-end locally by answering the
 * exact same endpoints, backed by the OCR text already in Postgres `pdf_data`.
 *
 *   POST /search          -> { msg, data: bundleDetailRes[] }   (the doc list)
 *   POST /search/bundles  -> { msg, bundleIds: string[] }       (sidebar scope)
 *   POST /search/summary  -> { msg, totalBDIDs: number }        (the count)
 *   POST /search/detail   -> { msg, totalPages, totalMatches, pages[] }
 *
 * Request body (sent by the frontend):
 *   { nCaseid, searchTerm, isStartWith, isCaseSensitive, isWholeWord,
 *     page, pageSize, nSectionid, nBundleid, ... }
 *
 * NOT a production path:
 *   • unindexed ILIKE over pdf_data.extracted_text (seq scan → can be slow);
 *   • match flags are approximated (ILIKE contains / prefix only);
 *   • it reads whatever DB your .env.development points at (read-only SELECTs).
 *   The real ES service ranks, highlights, and is far faster.
 *
 * Run:   node es-search-stub.js          (from the backend repo root)
 * Needs: the `pg` package (already a backend dependency) + ./.env.development
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// ── Load DB_* from .env.development (no dotenv dependency) ──────────────────
const envPath = path.join(__dirname, '.env.development');
const env = {};
for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
  if (m) env[m[1]] = m[2].replace(/\s+#.*$/, '').replace(/^['"]|['"]$/g, '').trim();
}

const pool = new Pool({
  host: env.DB_HOST,
  port: Number(env.DB_PORT),
  user: env.DB_USERNAME,
  password: env.DB_PASSWORD,
  database: env.DB_DATABASE,
  ssl: env.DB_SSL === '1' ? { rejectUnauthorized: false } : false,
  max: 4,
});

const PORT = 5015;

/** ILIKE pattern from the match flags. Stub-level: contains / starts-with. */
function pattern(term, body) {
  const t = term.replace(/[%_]/g, ''); // strip ILIKE wildcards for safety
  return body.isStartWith ? `${t}%` : `%${t}%`;
}

// ── Endpoint handlers ───────────────────────────────────────────────────────
async function search(b) {
  const term = (b.searchTerm || '').trim();
  if (!term) return { msg: 1, data: [] };
  const page = Math.max(1, Number(b.page) || 1);
  const pageSize = Math.min(200, Number(b.pageSize) || 30);
  const { rows } = await pool.query(
    `WITH matches AS (
       SELECT DISTINCT pd."nBundledetailid"
       FROM pdf_data pd
       JOIN "BundleDetail" bd ON bd."nBundledetailid" = pd."nBundledetailid"
       LEFT JOIN "SectionMaster" sm ON sm."nSectionid" = bd."nSectionid"
       WHERE bd."cStatus" = 'C'
         AND ($1::uuid IS NULL OR bd."nSectionid" = $1::uuid)
         AND ($2::uuid IS NULL OR sm."nCaseid" = $2::uuid)
         AND pd.extracted_text ILIKE $3
     )
     SELECT bd."nBundledetailid", bd."nBundleid",
            bd."cFilename" AS "cName", bd."cTab", bd."cExhibitno",
            bd."cPage", bd."cPage" AS "cPageRange", bd."cFilename",
            bd."cFiletype", bd."cDesc" AS "cDescription", bd."cAuthor",
            bm."cBundletag"
     FROM "BundleDetail" bd
     JOIN matches m ON m."nBundledetailid" = bd."nBundledetailid"
     LEFT JOIN "BundleMaster" bm ON bm."nBundleid" = bd."nBundleid"
     ORDER BY bd."cTab"
     LIMIT $4 OFFSET $5`,
    [b.nSectionid || null, b.nCaseid || null, pattern(term, b), pageSize, (page - 1) * pageSize],
  );
  return { msg: 1, data: rows, page, pageSize };
}

async function bundles(b) {
  const term = (b.searchTerm || '').trim();
  if (!term) return { msg: 1, bundleIds: [] };
  const { rows } = await pool.query(
    `SELECT DISTINCT bd."nBundleid"
     FROM pdf_data pd
     JOIN "BundleDetail" bd ON bd."nBundledetailid" = pd."nBundledetailid"
     LEFT JOIN "SectionMaster" sm ON sm."nSectionid" = bd."nSectionid"
     WHERE bd."cStatus" = 'C'
       AND ($1::uuid IS NULL OR bd."nSectionid" = $1::uuid)
       AND ($2::uuid IS NULL OR sm."nCaseid" = $2::uuid)
       AND pd.extracted_text ILIKE $3`,
    [b.nSectionid || null, b.nCaseid || null, pattern(term, b)],
  );
  return { msg: 1, bundleIds: rows.map(r => r.nBundleid) };
}

async function summary(b) {
  const term = (b.searchTerm || '').trim();
  if (!term) return { msg: 1, totalBDIDs: 0 };
  const { rows } = await pool.query(
    `SELECT count(DISTINCT pd."nBundledetailid")::int AS total
     FROM pdf_data pd
     JOIN "BundleDetail" bd ON bd."nBundledetailid" = pd."nBundledetailid"
     LEFT JOIN "SectionMaster" sm ON sm."nSectionid" = bd."nSectionid"
     WHERE bd."cStatus" = 'C'
       AND ($1::uuid IS NULL OR bd."nSectionid" = $1::uuid)
       AND ($2::uuid IS NULL OR sm."nCaseid" = $2::uuid)
       AND pd.extracted_text ILIKE $3`,
    [b.nSectionid || null, b.nCaseid || null, pattern(term, b)],
  );
  return { msg: 1, totalBDIDs: rows[0]?.total ?? 0 };
}

async function detail(b) {
  const term = (b.searchTerm || '').trim();
  if (!term || !b.nBundledetailid) return { msg: 1, totalPages: 0, totalMatches: 0, pages: [] };
  const { rows } = await pool.query(
    `SELECT pd.page::int AS page, count(*)::int AS matches
     FROM pdf_data pd
     WHERE pd."nBundledetailid" = $1::uuid AND pd.extracted_text ILIKE $2
     GROUP BY pd.page ORDER BY pd.page`,
    [b.nBundledetailid, pattern(term, b)],
  );
  const totalMatches = rows.reduce((s, r) => s + r.matches, 0);
  return { msg: 1, totalPages: rows.length, totalMatches, pages: rows };
}

const ROUTES = {
  '/search': search,
  '/search/bundles': bundles,
  '/search/summary': summary,
  '/search/detail': detail,
};

// ── HTTP server (+ permissive CORS for the Angular dev server) ──────────────
function cors(req, res) {
  // Reflect origin + requested headers (and allow credentials) so the preflight
  // passes regardless of what the Angular HttpClient sends (Authorization,
  // custom headers, withCredentials). A wildcard `*` is REJECTED by the browser
  // once a request is credentialed — echoing the exact origin avoids that.
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers',
    req.headers['access-control-request-headers'] || 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '600');
}

http.createServer(async (req, res) => {
  cors(req, res);
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  const url = (req.url || '').split('?')[0];
  if (req.method === 'GET' && url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end('es-search-stub OK — POST /search, /search/bundles, /search/summary, /search/detail');
  }

  const handler = ROUTES[url];
  if (req.method !== 'POST' || !handler) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ msg: -1, error: 'not found' }));
  }

  let raw = '';
  req.on('data', c => (raw += c));
  req.on('end', async () => {
    let body = {};
    try { body = JSON.parse(raw || '{}'); } catch { /* ignore */ }
    const t0 = Date.now();
    try {
      const out = await handler(body);
      console.log(`${url}  "${body.searchTerm || ''}"  sec=${body.nSectionid || '-'}  -> ${Date.now() - t0}ms`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(out));
    } catch (e) {
      console.error(`${url} ERROR`, e.message);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ msg: -1, error: e.message, data: [], bundleIds: [], totalBDIDs: 0 }));
    }
  });
}).listen(PORT, () => {
  console.log(`\n  es-search-stub listening on http://localhost:${PORT}`);
  console.log(`  DB: ${env.DB_DATABASE} @ ${env.DB_HOST}:${env.DB_PORT} (read-only)\n`);
  console.log(`  Enable "file content search" in the app and search a common word.\n`);
});
