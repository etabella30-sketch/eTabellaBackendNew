import * as path from 'path';
import {
  main,
  compareSessions,
  isLiveBoxSession,
  EDGE_COLUMNS,
  EDGE_COLUMNS_SQL,
  LIVE_BOX_SESSIONS_SQL,
  USAGE,
} from './deploy-check';
import { memoryFs } from './spec-fakes';

/*
 * No database: --pg runs go through a fake client that records its queries.
 */

const CWD = path.resolve('/work/backend');
const MANIFEST = path.join(CWD, 'dist', 'release', 'rt-edge-v1.1.0', 'manifest.json');
const VERSION_TS = path.join(CWD, 'libs', 'feed-parse', 'src', 'version.ts');
const SESSIONS = path.join(CWD, 'live.json');

function fakePg(answer: {
  columns?: string[];
  rows?: any[];
  noTable?: boolean;
  connectError?: Error;
  queryError?: Error;
}) {
  const queries: { text: string; params?: any[] }[] = [];
  const state = { ended: false, connectedWith: null as string | null };
  const client = {
    async query(text: string, params?: any[]) {
      queries.push({ text, params });
      if (answer.queryError && text === LIVE_BOX_SESSIONS_SQL) throw answer.queryError;
      if (text === EDGE_COLUMNS_SQL) {
        const tableExists = !answer.noTable;
        return { rows: [{ database: 'etabella_spec', tableExists, columns: tableExists ? answer.columns ?? [] : [] }] };
      }
      if (text === LIVE_BOX_SESSIONS_SQL) return { rows: answer.rows ?? [] };
      return { rows: [] };
    },
    async end() {
      state.ended = true;
    },
  };
  const pgConnect = async (conn: string) => {
    state.connectedWith = conn;
    if (answer.connectError) throw answer.connectError;
    return client;
  };
  return { pgConnect, queries, state };
}

function setup(files: Record<string, string> = {}, extra: Record<string, any> = {}) {
  const fs = memoryFs({
    [MANIFEST]: JSON.stringify({ tag: 'rt-edge-v1.1.0', FEED_PARSE_VERSION: '1.1.0' }),
    [VERSION_TS]: "export const FEED_PARSE_VERSION = '1.1.0';\n",
    ...files,
  });
  const out: string[] = [];
  const err: string[] = [];
  const deps = {
    cwd: CWD,
    fs,
    env: {},
    log: (l: string) => out.push(l),
    error: (l: string) => err.push(l),
    pgConnect: async () => {
      throw new Error('spec: no database');
    },
    ...extra,
  };
  return { deps, out, err, all: () => out.concat(err).join('\n') };
}

const sessions = (rows: any[]) => ({ [SESSIONS]: JSON.stringify(rows) });

describe('isLiveBoxSession', () => {
  it.each([
    [{ cSyncState: 'L' }, true],
    [{ cSyncState: 'S' }, true],
    [{ cSyncState: 'K', cStatus: 'R' }, false],
    [{ cSyncState: 'W' }, false],
    [{ cSyncState: 'F' }, false],
    [{ cStatus: 'R' }, true],
    [{ cStatus: 'A' }, true],
    [{ cStatus: 'L' }, true],
    [{ cStatus: 'C' }, false],
    [{ cStatus: 'E' }, false],
    [{ cStatus: 'P' }, false],
    [{ cFeedSource: 'D', cStatus: 'R' }, false],
    [{ cFeedSource: 'H', cStatus: 'R' }, false],
    [{ cFeedSource: 'W', cSyncState: 'L' }, false],
    [{ cFeedSource: 'E', cStatus: 'R' }, true],
    [{}, true],
  ])('%j -> %s', (row, live) => {
    expect(isLiveBoxSession(row)).toBe(live);
  });

  // Fail closed: only a known sealed, ended or non-box code makes a row not live.
  it.each([
    [{ cSyncState: '' }],
    [{ cSyncState: ' ' }],
    [{ cSyncState: 'k' }],
    [{ cSyncState: 'X', cStatus: 'C' }],
    [{ cStatus: '' }],
    [{ cStatus: 'r' }],
    [{ cStatus: 'c' }],
    [{ cStatus: 'N' }],
    [{ cFeedSource: '', cStatus: 'R' }],
    [{ cFeedSource: 'e', cStatus: 'R' }],
    [{ cFeedSource: 'd', cStatus: 'R' }],
    [{ cFeedSource: 'X', cSyncState: 'L' }],
  ])('a blank, lowercase or unknown code counts as live: %j', (row) => {
    expect(isLiveBoxSession(row)).toBe(true);
  });
});

describe('compareSessions', () => {
  it('flags live sessions on another version (older or newer) or with none, and ignores ended ones', () => {
    const rows = [
      { nSesid: 's1', parserVer: '1.1.0', cStatus: 'R' },
      { nSesid: 's2', parserVer: '1.0.0', cStatus: 'R' },
      { nSesid: 's3', parserVer: null, cSyncState: 'S' },
      { nSesid: 's4', parserVer: '0.9.0', cStatus: 'C' },
      { nSesid: 's5', parserVer: ' 1.1.0 ', cSyncState: 'L' },
      { nSesid: 's6', parserVer: '1.2.0', cSyncState: 'L' },
      { nSesid: 's7', parserVer: '1.1.0-rc1', cStatus: 'A' },
      { nSesid: 's8', parserVer: '', cStatus: 'R' },
    ];
    const { live, mismatched } = compareSessions('1.1.0', rows);
    expect(live.map((s: any) => s.nSesid)).toEqual(['s1', 's2', 's3', 's5', 's6', 's7', 's8']);
    expect(mismatched.map((s: any) => s.nSesid)).toEqual(['s2', 's3', 's6', 's7', 's8']);
  });

  it('refuses a downgrade: every live session on a newer parser is a mismatch', () => {
    const rows = [
      { nSesid: 'n1', parserVer: '1.2.0', cSyncState: 'L' },
      { nSesid: 'n2', parserVer: '2.0.0', cSyncState: 'S' },
      { nSesid: 'n3', parserVer: '1.10.0', cStatus: 'R' },
    ];
    expect(compareSessions('1.1.0', rows).mismatched.map((s: any) => s.nSesid)).toEqual(['n1', 'n2', 'n3']);
  });
});

describe('rt-deploy-check with --sessions-file', () => {
  it('passes when every live box session runs the manifest version', async () => {
    const t = setup(sessions([
      { nSesid: 's1', parserVer: '1.1.0', cStatus: 'R' },
      { nSesid: 's2', parserVer: '1.0.0', cStatus: 'C' },
    ]));
    expect(await main(['--manifest', MANIFEST, '--sessions-file', SESSIONS], t.deps)).toBe(0);
    expect(t.out.join('\n')).toContain('PASS: 1 live venue box session(s), all on FEED_PARSE_VERSION 1.1.0');
    expect(t.out.join('\n')).toContain('(tag rt-edge-v1.1.0)');
  });

  it('passes with no live box sessions', async () => {
    const t = setup(sessions([]));
    expect(await main(['--manifest', MANIFEST, '--sessions-file', SESSIONS], t.deps)).toBe(0);
    expect(t.out.join('\n')).toContain('PASS: no live venue box sessions');
  });

  it('refuses and lists every live session on another parser version, older or newer', async () => {
    const t = setup(sessions([
      { nSesid: 's1', parserVer: '1.1.0', cStatus: 'R' },
      { nSesid: 's2', parserVer: '1.0.0', cStatus: 'R' },
      { nSesid: 7, cStatus: 'A' },
      { nSesid: 's4', parserVer: '1.2.0', cSyncState: 'L', cFeedSource: 'E' },
    ]));
    expect(await main(['--manifest', MANIFEST, '--sessions-file', SESSIONS], t.deps)).toBe(1);
    expect(t.err[0]).toContain('REFUSE: this deploy runs FEED_PARSE_VERSION 1.1.0');
    expect(t.err[0]).toContain('3 live venue box session(s) in ' + SESSIONS + ' run another parser');
    expect(t.err).toContain('  nSesid=s2  parserVer=1.0.0  cStatus=R  cSyncState=-  cFeedSource=-');
    expect(t.err).toContain('  nSesid=7  parserVer=(none)  cStatus=A  cSyncState=-  cFeedSource=-');
    expect(t.err).toContain('  nSesid=s4  parserVer=1.2.0  cStatus=-  cSyncState=L  cFeedSource=E');
    expect(t.err.join('\n')).not.toContain('nSesid=s1');
  });

  it('refuses a deploy that would downgrade the parser under a live session', async () => {
    const t = setup(sessions([{ nSesid: 's1', parserVer: '1.2.0', cStatus: 'R' }]));
    expect(await main(['--manifest', MANIFEST, '--sessions-file', SESSIONS], t.deps)).toBe(1);
    expect(t.err).toContain('  nSesid=s1  parserVer=1.2.0  cStatus=R  cSyncState=-  cFeedSource=-');
  });

  it.each([
    ['a blank cSyncState', { cStatus: 'R', cSyncState: '' }, 'cSyncState ""; known codes are L, S, K, W, F'],
    ['a blank cFeedSource', { cStatus: 'R', cFeedSource: '' }, 'cFeedSource ""; known codes are D, E, H, W'],
    ['a lowercase cStatus', { cStatus: 'r' }, 'cStatus "r"; known codes are R, A, L, C, E, P'],
    ['an unknown cSyncState', { cSyncState: 'X' }, 'cSyncState "X"'],
    ['an unknown cStatus', { cStatus: 'N' }, 'cStatus "N"'],
    ['a padded cStatus', { cStatus: 'R ' }, 'cStatus "R "'],
    ['a numeric cStatus', { cStatus: 1 }, 'cStatus 1;'],
  ])('exits 2, never PASS, on %s', async (_what, codes, message) => {
    const t = setup(sessions([
      { nSesid: 's1', parserVer: '1.1.0', cStatus: 'R' },
      { nSesid: 'x1', parserVer: '0.9.0', ...codes },
    ]));
    expect(await main(['--manifest', MANIFEST, '--sessions-file', SESSIONS], t.deps)).toBe(2);
    const text = t.err.join('\n');
    expect(text).toContain('entry 1 (nSesid x1) has ' + message);
    expect(text).toContain('The check cannot tell whether that session is live.');
    expect(t.out.join('\n')).not.toContain('PASS');
  });

  it('takes the version from a version.ts instead of a manifest', async () => {
    const t = setup(sessions([{ nSesid: 's1', parserVer: '1.0.0', cStatus: 'R' }]));
    expect(await main(['--version-file', VERSION_TS, '--sessions-file', SESSIONS], t.deps)).toBe(1);
    expect(t.err[0]).toContain('FEED_PARSE_VERSION 1.1.0 (' + VERSION_TS + ')');
  });

  it.each([
    ['not JSON', '{', /is not valid JSON/],
    ['not an array', '{"nSesid":"s1"}', /must hold a JSON array/],
    ['an entry without nSesid', '[{"parserVer":"1.1.0"}]', /entry 0 has no nSesid/],
    ['a non-object entry', '["s1"]', /entry 0 is not an object/],
  ])('exits 2 on a sessions file that is %s', async (_what, text, message) => {
    const t = setup({ [SESSIONS]: text });
    expect(await main(['--manifest', MANIFEST, '--sessions-file', SESSIONS], t.deps)).toBe(2);
    expect(t.err.join('\n')).toMatch(message);
  });

  it('exits 2 when the manifest has no FEED_PARSE_VERSION or cannot be read', async () => {
    const t = setup({ [MANIFEST]: JSON.stringify({ tag: 'x' }), ...sessions([]) });
    expect(await main(['--manifest', MANIFEST, '--sessions-file', SESSIONS], t.deps)).toBe(2);
    expect(t.err.join('\n')).toContain('has no FEED_PARSE_VERSION');

    const t2 = setup(sessions([]));
    expect(await main(['--manifest', path.join(CWD, 'nope.json'), '--sessions-file', SESSIONS], t2.deps)).toBe(2);
    expect(t2.err.join('\n')).toContain('cannot read manifest');
  });
});

describe('rt-deploy-check arguments', () => {
  it.each([
    [[], 'give exactly one of --manifest or --version-file'],
    [['--manifest', 'm', '--version-file', 'v', '--pg', 'x'], 'give exactly one of --manifest or --version-file'],
    [['--manifest', 'm'], 'give exactly one of --sessions-file or --pg'],
    [['--manifest', 'm', '--sessions-file', 's', '--pg', 'x'], 'give exactly one of --sessions-file or --pg'],
    [['--manifest', 'm', '--bogus'], 'unknown option: --bogus'],
  ])('%j is a usage error', async (argv, message) => {
    const t = setup();
    expect(await main(argv, t.deps)).toBe(2);
    expect(t.err[0]).toBe('rt-deploy-check: ' + message);
    expect(t.err).toContain(USAGE);
  });

  it('prints the usage for --help', async () => {
    const t = setup();
    expect(await main(['--help'], t.deps)).toBe(0);
    expect(t.out).toEqual([USAGE]);
  });
});

describe('rt-deploy-check with --pg', () => {
  it('without the Phase 2 columns: exit 0 with a loud notice, not a silent pass', async () => {
    const pg = fakePg({ columns: [] });
    const t = setup({}, { pgConnect: pg.pgConnect });
    expect(await main(['--manifest', MANIFEST, '--pg', 'postgres://u:secret@db/x'], t.deps)).toBe(0);
    const text = t.err.join('\n');
    expect(text).toContain('NOTICE: no venue sessions schema yet.');
    expect(text).toContain('RSessionMaster in database etabella_spec has no "cFeedSource", "cParserVer", "cSyncState" column');
    expect(text).toContain('This is NOT a verified pass');
    expect(t.out.join('\n')).not.toContain('PASS');
    // It never ran the sessions query, and it cleaned up.
    expect(pg.queries.map((q) => q.text)).toEqual(['BEGIN TRANSACTION READ ONLY', EDGE_COLUMNS_SQL, 'ROLLBACK']);
    expect(pg.queries[1].params).toEqual([EDGE_COLUMNS]);
    expect(pg.state.ended).toBe(true);
    expect(t.all()).not.toContain('secret');
  });

  it('without RSessionMaster at all: exit 2 (wrong database), never the no-schema notice', async () => {
    const pg = fakePg({ noTable: true });
    const t = setup({}, { pgConnect: pg.pgConnect });
    expect(await main(['--manifest', MANIFEST, '--pg', 'postgres://db/postgres'], t.deps)).toBe(2);
    expect(t.err[0]).toBe('rt-deploy-check: database etabella_spec has no public."RSessionMaster" table; is --pg pointing at the eTabella database?');
    expect(t.all()).not.toContain('NOTICE');
    expect(pg.queries.map((q) => q.text)).toEqual(['BEGIN TRANSACTION READ ONLY', EDGE_COLUMNS_SQL, 'ROLLBACK']);
    expect(pg.state.ended).toBe(true);
  });

  it('with only part of the columns: exit 2, it cannot tell which sessions are live', async () => {
    const pg = fakePg({ columns: ['cFeedSource'] });
    const t = setup({}, { pgConnect: pg.pgConnect });
    expect(await main(['--manifest', MANIFEST, '--pg', 'postgres://db/x'], t.deps)).toBe(2);
    expect(t.err.join('\n')).toContain('missing cParserVer, cSyncState');
    expect(pg.queries.map((q) => q.text)).not.toContain(LIVE_BOX_SESSIONS_SQL);
  });

  it('compares the live box sessions it reads, in a read-only transaction', async () => {
    const pg = fakePg({
      columns: EDGE_COLUMNS,
      rows: [
        { nSesid: 'u1', parserVer: '1.1.0', cStatus: 'R', cSyncState: 'L', cFeedSource: 'E' },
        { nSesid: 'u2', parserVer: '1.0.0', cStatus: 'C', cSyncState: 'S', cFeedSource: 'E' },
        { nSesid: 'u3', parserVer: '1.2.0', cStatus: 'R', cSyncState: 'L', cFeedSource: 'E' },
      ],
    });
    const t = setup({}, { pgConnect: pg.pgConnect });
    expect(await main(['--manifest', MANIFEST, '--pg', 'postgres://db/x'], t.deps)).toBe(1);
    expect(t.err[0]).toContain('2 live venue box session(s) in database etabella_spec run another parser');
    expect(t.err).toContain('  nSesid=u2  parserVer=1.0.0  cStatus=C  cSyncState=S  cFeedSource=E');
    expect(t.err).toContain('  nSesid=u3  parserVer=1.2.0  cStatus=R  cSyncState=L  cFeedSource=E');
    expect(pg.queries.map((q) => q.text)).toEqual(['BEGIN TRANSACTION READ ONLY', EDGE_COLUMNS_SQL, LIVE_BOX_SESSIONS_SQL, 'ROLLBACK']);
    expect(pg.state.ended).toBe(true);
  });

  it('compares rows with blank or unknown codes as live, and shows those codes quoted', async () => {
    // char(1) columns come back padded: a blank code is ' '.
    const pg = fakePg({
      columns: EDGE_COLUMNS,
      rows: [
        { nSesid: 'u1', parserVer: '1.0.0', cStatus: 'R', cSyncState: ' ', cFeedSource: 'E' },
        { nSesid: 'u2', parserVer: '1.0.0', cStatus: 'R', cSyncState: 'L', cFeedSource: ' ' },
        { nSesid: 'u3', parserVer: '1.0.0', cStatus: 'r', cSyncState: null, cFeedSource: 'E' },
      ],
    });
    const t = setup({}, { pgConnect: pg.pgConnect });
    expect(await main(['--manifest', MANIFEST, '--pg', 'postgres://db/x'], t.deps)).toBe(1);
    expect(t.err[0]).toContain('3 live venue box session(s) in database etabella_spec run another parser');
    expect(t.err).toContain('  nSesid=u1  parserVer=1.0.0  cStatus=R  cSyncState=" "  cFeedSource=E');
    expect(t.err).toContain('  nSesid=u2  parserVer=1.0.0  cStatus=R  cSyncState=L  cFeedSource=" "');
    expect(t.err).toContain('  nSesid=u3  parserVer=1.0.0  cStatus=r  cSyncState=-  cFeedSource=E');
  });

  it('passes when the live box sessions match', async () => {
    const pg = fakePg({ columns: EDGE_COLUMNS, rows: [{ nSesid: 'u1', parserVer: '1.1.0', cStatus: 'R', cSyncState: 'L', cFeedSource: 'E' }] });
    const t = setup({}, { pgConnect: pg.pgConnect });
    expect(await main(['--manifest', MANIFEST, '--pg', 'postgres://db/x'], t.deps)).toBe(0);
    expect(t.out.join('\n')).toContain('PASS: 1 live venue box session(s), all on FEED_PARSE_VERSION 1.1.0 in database etabella_spec');
  });

  it('reads the connection string from the environment with env:VAR', async () => {
    const pg = fakePg({ columns: EDGE_COLUMNS, rows: [] });
    const t = setup({}, { pgConnect: pg.pgConnect, env: { RT_DEPLOY_CHECK_PG: 'postgres://from-env/x' } });
    expect(await main(['--manifest', MANIFEST, '--pg', 'env:RT_DEPLOY_CHECK_PG'], t.deps)).toBe(0);
    expect(pg.state.connectedWith).toBe('postgres://from-env/x');

    const unset = setup({}, { pgConnect: pg.pgConnect });
    expect(await main(['--manifest', MANIFEST, '--pg', 'env:NOT_SET'], unset.deps)).toBe(2);
    expect(unset.err[0]).toBe('rt-deploy-check: --pg env:NOT_SET but $NOT_SET is not set');
  });

  it('exits 2 when the database cannot be read, and still closes the client', async () => {
    const down = fakePg({ connectError: new Error('connect ECONNREFUSED 10.0.0.1:5432') });
    const t = setup({}, { pgConnect: down.pgConnect });
    expect(await main(['--manifest', MANIFEST, '--pg', 'postgres://db/x'], t.deps)).toBe(2);
    expect(t.err[0]).toBe('rt-deploy-check: cannot read live sessions from the database: connect ECONNREFUSED 10.0.0.1:5432');

    const broken = fakePg({ columns: EDGE_COLUMNS, queryError: new Error('permission denied for table RSessionMaster') });
    const t2 = setup({}, { pgConnect: broken.pgConnect });
    expect(await main(['--manifest', MANIFEST, '--pg', 'postgres://db/x'], t2.deps)).toBe(2);
    expect(t2.err[0]).toContain('permission denied for table RSessionMaster');
    expect(broken.queries[broken.queries.length - 1].text).toBe('ROLLBACK');
    expect(broken.state.ended).toBe(true);
  });

  it('queries undeleted sessions not known to be sealed or another feed, on the planned columns', () => {
    expect(LIVE_BOX_SESSIONS_SQL).toContain('r."cParserVer"   AS "parserVer"');
    expect(LIVE_BOX_SESSIONS_SQL).toContain('r."dDelDt" IS NULL');
    // Fail closed: name what is NOT a live box session, never list the live codes.
    expect(LIVE_BOX_SESSIONS_SQL).toContain(`r."cFeedSource" IS NOT NULL`);
    expect(LIVE_BOX_SESSIONS_SQL).toContain(`r."cFeedSource" NOT IN ('D', 'H', 'W')`);
    expect(LIVE_BOX_SESSIONS_SQL).toContain(`r."cSyncState" NOT IN ('K', 'W', 'F')`);
    expect(LIVE_BOX_SESSIONS_SQL).toContain(`(r."cStatus" IS NULL OR r."cStatus" NOT IN ('C', 'E', 'P'))`);
    expect(LIVE_BOX_SESSIONS_SQL).not.toMatch(/"cSyncState" IN \(|"cStatus" IN \(|"cFeedSource" = /);
    expect(LIVE_BOX_SESSIONS_SQL).toContain('FROM public."RSessionMaster" r');
  });

  it('probes the schema through pg_catalog, so missing privileges cannot pose as a missing column', () => {
    expect(EDGE_COLUMNS_SQL).toContain(`to_regclass('public."RSessionMaster"') IS NOT NULL AS "tableExists"`);
    expect(EDGE_COLUMNS_SQL).toContain('FROM pg_catalog.pg_attribute a');
    expect(EDGE_COLUMNS_SQL).toContain('NOT a.attisdropped');
    expect(EDGE_COLUMNS_SQL).not.toContain('information_schema');
  });
});
