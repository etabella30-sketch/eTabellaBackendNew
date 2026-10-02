'use strict';
/**
 * rt-deploy-check core (plan R-SC1 / D6, D5): refuse a cloud deploy whose
 * parser version differs from any live venue box session.
 *
 * The deploy's version comes from a release manifest (--manifest, written by
 * release-edge) or straight from a version.ts (--version-file). Live box
 * sessions come from a JSON file (--sessions-file) or from RSessionMaster
 * (--pg). The --pg query is written against the Phase 2 columns
 * (2026-10-19_rt_edge_core): "cFeedSource" ('E' = venue box), "cParserVer",
 * "cSyncState". Until that migration is applied the columns are missing and
 * the check says so loudly; it is not a verified pass.
 *
 * Exit 0 = no live box session runs another parser (or no venue schema
 * yet, with a notice); 1 = refused, the sessions are listed; 2 = usage or
 * input error, the check could not be made (treat as refused).
 */

const path = require('path');
const { parseArgs, UsageError } = require('./args');
const { readFeedParseVersion } = require('./feed-parse-version');

const ARG_SPEC = {
  '--manifest': 'value',
  '--version-file': 'value',
  '--sessions-file': 'value',
  '--pg': 'value',
  '--help': 'flag',
};

const USAGE = [
  'Usage: node tools/ci/rt-deploy-check.js (--manifest <manifest.json> | --version-file <version.ts>)',
  '                                        (--sessions-file <sessions.json> | --pg <connection string | env:VAR>)',
  '',
  'Refuses (exit 1) when any live venue box session runs a parser version other',
  'than the deploy\'s FEED_PARSE_VERSION. Run it before every cloud deploy.',
  '',
  '  --manifest <path>       dist/release/<tag>/manifest.json from release-edge',
  '  --version-file <path>   libs/feed-parse/src/version.ts of the commit being deployed',
  '  --sessions-file <path>  JSON array of { nSesid, parserVer, cStatus } (cSyncState, cFeedSource optional)',
  '  --pg <conn>             read RSessionMaster; env:VAR reads the connection string from $VAR',
  '                          (keeps the password out of the shell history). Read-only transaction.',
  '',
  'Exit: 0 pass (or no venue schema yet, with a notice); 1 refused; 2 usage or input error.',
].join('\n');

/** Planned Phase 2 columns the query depends on (spec §4.8). */
const EDGE_COLUMNS = ['cFeedSource', 'cParserVer', 'cSyncState'];

/**
 * Whether RSessionMaster exists here, and which of EDGE_COLUMNS it has.
 * Reads pg_catalog, not information_schema: information_schema hides the
 * columns of a table the role holds no privilege on, which would look
 * exactly like "not migrated yet" and pass with the notice.
 */
const EDGE_COLUMNS_SQL = `
    SELECT current_database()::text AS "database",
           to_regclass('public."RSessionMaster"') IS NOT NULL AS "tableExists",
           ARRAY(SELECT a.attname::text
                   FROM pg_catalog.pg_attribute a
                  WHERE a.attrelid = to_regclass('public."RSessionMaster"')
                    AND a.attnum > 0
                    AND NOT a.attisdropped
                    AND a.attname::text = ANY($1::text[])
                  ORDER BY 1) AS "columns"`;

/*
 * Codes (spec §4.1). The live rule names what is NOT live, so a blank,
 * lowercase or new code counts as live and gets compared: the check must
 * not pass on what it cannot read.
 */
/** cFeedSource: D direct, E venue box, H legacy lane, W reserved. NULL is legacy provenance. */
const FEED_SOURCES = ['D', 'E', 'H', 'W'];
const NOT_BOX_FEED_SOURCES = ['D', 'H', 'W'];
/** cSyncState: L live, S end requested (box still uploading); K, W, F sealed (spec §4.4 "NOT IN ('K','W','F')"). */
const SYNC_STATES = ['L', 'S', 'K', 'W', 'F'];
const SEALED_SYNC_STATES = ['K', 'W', 'F'];
/**
 * cStatus, read only when a row has no cSyncState: R, A, L are live (the
 * eclipse route check and the FE liveness rule), C and E ended, P published.
 */
const STATUSES = ['R', 'A', 'L', 'C', 'E', 'P'];
const ENDED_STATUSES = ['C', 'E', 'P'];

const sqlList = (codes) => codes.map((c) => "'" + c + "'").join(', ');

/**
 * Live box session = not deleted, a feed source that is not known to be
 * something else, and not sealed: cSyncState not K/W/F, or, without a sync
 * state, cStatus not ended or published.
 */
const LIVE_BOX_SESSIONS_SQL = `
    SELECT r."nSesid"::text AS "nSesid",
           r."cParserVer"   AS "parserVer",
           r."cStatus"      AS "cStatus",
           r."cSyncState"   AS "cSyncState",
           r."cFeedSource"  AS "cFeedSource"
      FROM public."RSessionMaster" r
     WHERE r."dDelDt" IS NULL
       AND r."cFeedSource" IS NOT NULL
       AND r."cFeedSource" NOT IN (${sqlList(NOT_BOX_FEED_SOURCES)})
       AND (r."cSyncState" NOT IN (${sqlList(SEALED_SYNC_STATES)})
            OR (r."cSyncState" IS NULL
                AND (r."cStatus" IS NULL OR r."cStatus" NOT IN (${sqlList(ENDED_STATUSES)}))))
     ORDER BY r."nSesid"`;

/**
 * Same rule as LIVE_BOX_SESSIONS_SQL, for every row compared. A row with no
 * cFeedSource is a box session here: the database query never returns one,
 * and a --sessions-file lists box sessions. A row with no state at all
 * counts as live.
 */
function isLiveBoxSession(s) {
  if (s.cFeedSource != null && NOT_BOX_FEED_SOURCES.includes(s.cFeedSource)) return false;
  if (s.cSyncState != null) return !SEALED_SYNC_STATES.includes(s.cSyncState);
  if (s.cStatus != null) return !ENDED_STATUSES.includes(s.cStatus);
  return true;
}

/** Returns { live, mismatched }. A live session with no parser version is a mismatch. */
function compareSessions(expected, sessions) {
  const live = sessions.filter(isLiveBoxSession);
  const mismatched = live.filter((s) => s.parserVer == null || String(s.parserVer).trim() !== expected);
  return { live, mismatched };
}

function readJsonFile(deps, file, what) {
  let text;
  try {
    text = deps.fs.readFileSync(file, 'utf8');
  } catch (err) {
    throw new Error('cannot read ' + what + ' ' + file + ': ' + err.message);
  }
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(what + ' ' + file + ' is not valid JSON: ' + err.message);
  }
}

/** The version being deployed: { version, source }. */
function readExpectedVersion(opts, deps) {
  if (opts.versionFile) {
    const file = path.resolve(deps.cwd, opts.versionFile);
    return { version: readFeedParseVersion(deps.fs, file), source: file };
  }
  const file = path.resolve(deps.cwd, opts.manifest);
  const manifest = readJsonFile(deps, file, 'manifest');
  const version = manifest && manifest.FEED_PARSE_VERSION;
  if (typeof version !== 'string' || version.trim() === '') {
    throw new Error('manifest ' + file + ' has no FEED_PARSE_VERSION');
  }
  return { version: version.trim(), source: file + (manifest.tag ? ' (tag ' + manifest.tag + ')' : '') };
}

/** Codes a --sessions-file row may carry; anything else (blank, lowercase, new) is an input error. */
const FILE_CODES = { cFeedSource: FEED_SOURCES, cSyncState: SYNC_STATES, cStatus: STATUSES };

function readSessionsFile(deps, file) {
  const rows = readJsonFile(deps, file, 'sessions file');
  if (!Array.isArray(rows)) throw new Error('sessions file ' + file + ' must hold a JSON array');
  return rows.map((row, i) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      throw new Error('sessions file ' + file + ': entry ' + i + ' is not an object');
    }
    if (row.nSesid == null || String(row.nSesid).trim() === '') {
      throw new Error('sessions file ' + file + ': entry ' + i + ' has no nSesid');
    }
    for (const [field, codes] of Object.entries(FILE_CODES)) {
      if (row[field] != null && !codes.includes(row[field])) {
        throw new Error('sessions file ' + file + ': entry ' + i + ' (nSesid ' + row.nSesid + ') has ' + field
          + ' ' + JSON.stringify(row[field]) + '; known codes are ' + codes.join(', ')
          + ', or leave it out. The check cannot tell whether that session is live.');
      }
    }
    return {
      nSesid: String(row.nSesid),
      parserVer: row.parserVer == null ? null : row.parserVer,
      cStatus: row.cStatus == null ? null : row.cStatus,
      cSyncState: row.cSyncState == null ? null : row.cSyncState,
      cFeedSource: row.cFeedSource == null ? null : row.cFeedSource,
    };
  });
}

/**
 * Reads live box sessions in a read-only transaction. Returns, with the
 * database name:
 *   { schema: 'no-table' }            RSessionMaster is not there (wrong database?);
 *   { schema: 'none' | 'partial', missing }  the Phase 2 columns are absent;
 *   { schema: 'ready', sessions }.
 */
async function loadFromPg(deps, connectionString) {
  const client = await deps.pgConnect(connectionString);
  try {
    await client.query('BEGIN TRANSACTION READ ONLY');
    const meta = (await client.query(EDGE_COLUMNS_SQL, [EDGE_COLUMNS])).rows[0] || {};
    const database = meta.database || '(unknown)';
    if (!meta.tableExists) return { schema: 'no-table', database };
    const present = new Set(meta.columns || []);
    const missing = EDGE_COLUMNS.filter((c) => !present.has(c));
    if (missing.length === EDGE_COLUMNS.length) return { schema: 'none', database, missing };
    if (missing.length > 0) return { schema: 'partial', database, missing };
    const res = await client.query(LIVE_BOX_SESSIONS_SQL);
    return { schema: 'ready', database, sessions: res.rows };
  } finally {
    try {
      await client.query('ROLLBACK');
    } catch {
      // the connection is going away anyway
    }
    try {
      await client.end();
    } catch {
      // nothing left to release
    }
  }
}

function resolveConnection(opts, deps) {
  if (!opts.pg.startsWith('env:')) return opts.pg;
  const name = opts.pg.slice(4);
  const value = name ? deps.env[name] : undefined;
  if (!value) throw new UsageError('--pg env:' + name + ' but $' + name + ' is not set');
  return value;
}

function noSchemaNotice(deps, database, missing) {
  const bar = 'rt-deploy-check: ' + '='.repeat(72);
  deps.error(bar);
  deps.error('rt-deploy-check: NOTICE: no venue sessions schema yet.');
  deps.error('rt-deploy-check: RSessionMaster in database ' + database + ' has no '
    + missing.map((c) => '"' + c + '"').join(', ')
    + ' column (Phase 2 migration 2026-10-19_rt_edge_core not applied),');
  deps.error('rt-deploy-check: so there are no venue box sessions to compare. This is NOT a verified pass;');
  deps.error('rt-deploy-check: the check becomes real once that migration is applied.');
  deps.error(bar);
}

/** A code as printed: '-' when absent, quoted when it is not a plain letter (blank, padded). */
function code(v) {
  if (v == null) return '-';
  return /^[A-Za-z]$/.test(v) ? v : JSON.stringify(v);
}

function describe(s) {
  return '  nSesid=' + s.nSesid
    + '  parserVer=' + (s.parserVer == null ? '(none)' : s.parserVer)
    + '  cStatus=' + code(s.cStatus)
    + '  cSyncState=' + code(s.cSyncState)
    + '  cFeedSource=' + code(s.cFeedSource);
}

function usage(deps, message) {
  deps.error('rt-deploy-check: ' + message);
  deps.error(USAGE);
  return 2;
}

/** Resolves to the process exit code. */
async function main(argv, deps) {
  let opts;
  try {
    opts = parseArgs(argv, ARG_SPEC);
  } catch (err) {
    if (!(err instanceof UsageError)) throw err;
    return usage(deps, err.message);
  }
  if (opts.help) {
    deps.log(USAGE);
    return 0;
  }
  if (Boolean(opts.manifest) === Boolean(opts.versionFile)) {
    return usage(deps, 'give exactly one of --manifest or --version-file');
  }
  if (Boolean(opts.sessionsFile) === Boolean(opts.pg)) {
    return usage(deps, 'give exactly one of --sessions-file or --pg');
  }

  let expected;
  try {
    expected = readExpectedVersion(opts, deps);
  } catch (err) {
    deps.error('rt-deploy-check: ' + err.message);
    return 2;
  }

  let sessions;
  let from;
  if (opts.sessionsFile) {
    from = path.resolve(deps.cwd, opts.sessionsFile);
    try {
      sessions = readSessionsFile(deps, from);
    } catch (err) {
      deps.error('rt-deploy-check: ' + err.message);
      return 2;
    }
  } else {
    let connection;
    try {
      connection = resolveConnection(opts, deps);
    } catch (err) {
      return usage(deps, err.message);
    }
    let loaded;
    try {
      loaded = await loadFromPg(deps, connection);
    } catch (err) {
      deps.error('rt-deploy-check: cannot read live sessions from the database: ' + err.message);
      return 2;
    }
    if (loaded.schema === 'no-table') {
      deps.error('rt-deploy-check: database ' + loaded.database + ' has no public."RSessionMaster" table;'
        + ' is --pg pointing at the eTabella database?');
      return 2;
    }
    if (loaded.schema === 'none') {
      noSchemaNotice(deps, loaded.database, loaded.missing);
      return 0;
    }
    if (loaded.schema === 'partial') {
      deps.error('rt-deploy-check: RSessionMaster in database ' + loaded.database
        + ' has only part of the venue columns (missing ' + loaded.missing.join(', ')
        + '); cannot tell which box sessions are live.');
      return 2;
    }
    sessions = loaded.sessions;
    from = 'database ' + loaded.database;
  }

  const { live, mismatched } = compareSessions(expected.version, sessions);
  if (mismatched.length > 0) {
    deps.error('rt-deploy-check: REFUSE: this deploy runs FEED_PARSE_VERSION ' + expected.version
      + ' (' + expected.source + ') but ' + mismatched.length + ' live venue box session(s) in '
      + from + ' run another parser:');
    for (const s of mismatched) deps.error(describe(s));
    deps.error('rt-deploy-check: deploy after these sessions are sealed, or deploy a build with a matching FEED_PARSE_VERSION.');
    return 1;
  }
  deps.log('rt-deploy-check: PASS: '
    + (live.length === 0
      ? 'no live venue box sessions'
      : live.length + ' live venue box session(s), all on FEED_PARSE_VERSION ' + expected.version)
    + ' in ' + from + ' (' + expected.source + ').');
  return 0;
}

module.exports = {
  main,
  compareSessions,
  isLiveBoxSession,
  loadFromPg,
  EDGE_COLUMNS,
  EDGE_COLUMNS_SQL,
  LIVE_BOX_SESSIONS_SQL,
  USAGE,
};
