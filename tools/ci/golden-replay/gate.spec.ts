import * as path from 'path';
import { spawnSync } from 'child_process';
import { EventEmitter } from 'events';
import {
  main,
  cli,
  parseArgs,
  splitVersion,
  versionProblems,
  rewriteVersionFile,
  USAGE,
  GATE_SCRIPT,
  STALLED,
  GOLDEN_FORMAT,
  EXTENDED_GOLDEN_FORMAT,
} from './gate';
import { lineRecords, encodeValue, deliveryDigests, sha256, MASKED_FIELDS } from './compare';
import { memoryFs, corpusFiles, versionFile, readVersion, extendedFiles } from './spec-fakes';

/*
 * The gate runs here against an in-memory fs and a fake harness, so nothing
 * sleeps, compiles TypeScript or touches the disk. The fake harness turns
 * each chunk into one line (with a deterministic [6]) and one TCP-DATA
 * delivery, and reads FEED_PARSE_VERSION from the in-memory version.ts, which
 * --update rewrites. Nothing spawns except the last block, which runs the CLI
 * entry in a real node process because what it guards against is node's own
 * exit behaviour.
 */

const REPO = path.resolve('/work/backend');
const EXT_SRC = path.resolve('/work/tcp-server-main');
/** An extended source folder that does not exist (a machine without the hearings). */
const NO_EXT_SRC = path.resolve('/work/no-such-folder');
const CORPORA = path.join(REPO, 'tools', 'ci', 'golden-replay', 'corpora');
const EXTENDED = path.join(REPO, 'tools', 'ci', 'golden-replay', 'extended');
const VERSION_TS = path.join(REPO, 'libs', 'feed-parse', 'src', 'version.ts');
const TMP = path.resolve('/tmp/golden-replay-spec');
const golden = (id: string) => path.join(CORPORA, id, 'golden.json');
const extGolden = (id: string) => path.join(EXTENDED, id, 'golden.json');
const codes = (s: string) => [...s].map((c) => c.charCodeAt(0));

interface FakeOpts {
  text?: (id: string, t: string) => string;
  deliveredText?: (id: string, t: string) => string;
  canonicalSalt?: string;
  duplicates?: (id: string) => number;
  detect?: (corpus: any) => string | null;
  fail?: Error;
  never?: boolean;
}

function fakeHarness(fs: any, o: FakeOpts = {}) {
  return {
    feedParseVersion: () => readVersion(fs, REPO),
    detectedProtocol: (corpus: any) => {
      if (o.detect) return o.detect(corpus);
      const own = corpus.meta.protocol === 'B' ? 'bridge' : 'caseview';
      if (corpus.meta.legacyMisroute) return own === 'bridge' ? 'caseview' : 'bridge';
      return corpus.input.bytes ? own : 'undecided';
    },
    async replayAll(inputs: any[]) {
      if (o.never) return new Promise<never>(() => { });
      if (o.fail) throw o.fail;
      return {
        consoleLines: ['log: Global replace 0'],
        outputs: inputs.map((input) => {
          const texts = input.chunks.map((c: any) => (o.text || ((_id: string, s: string) => s))(input.id, c.bytes.toString('latin1')));
          const lineBuffer = texts.map((t: string, n: number) => (input.protocol === 'B'
            ? ['10:00:00:00', codes(t), n, 'FL', 1, n + 1, (n + 1) * 1e6, undefined, 1080000]
            : ['10:00:00', codes(t), n, , , , , []])); // eslint-disable-line no-sparse-arrays
          const deliveries = texts.map((t: string, n: number) => {
            const shown = o.deliveredText ? o.deliveredText(input.id, t) : t;
            const tuple = [...lineBuffer[n]];
            tuple[1] = codes(shown);
            return { chunk: n, calls: [{ fn: 'emitDelivery', event: 'TCP-DATA', payload: encodeValue({ i: n, d: [tuple], date: input.nSesid }) }] };
          });
          const dups = o.duplicates ? o.duplicates(input.id) : 0;
          return {
            id: input.id,
            protocol: input.protocol,
            nSesid: input.nSesid,
            nLines: input.nLines,
            fed: input.chunks.length,
            saveLineCalls: 0,
            lineBuffer,
            deliveries: input.keepCalls === false ? [] : deliveries,
            deliveryDigest: deliveryDigests(deliveries, input.mask || []),
            canonical: {
              pages: Math.ceil(lineBuffer.length / 25),
              root: sha256(JSON.stringify(encodeValue(lineBuffer)) + (o.canonicalSalt || '')),
              pageDigests: [sha256('page-1' + (o.canonicalSalt || ''))],
            },
            duplicateIds: dups ? [{ chunk: 0, ids: [1e6] }] : [],
            duplicateIdChunks: dups,
          };
        }),
      };
    },
  };
}

function setup(opts: { files?: Record<string, string>; version?: string } = {}) {
  const fs = memoryFs({
    ...versionFile(REPO, opts.version || '1.0.0'),
    ...(opts.files || {
      ...corpusFiles(REPO, 'bridge-a', { chunks: ['Good morning.', 'Thank you.'] }),
      ...corpusFiles(REPO, 'caseview-b', { protocol: 'C', chunks: ['Q.  Name?'] }),
    }),
  });
  const out: string[] = [];
  const err: string[] = [];
  const sleeps: number[] = [];
  let clock = Date.UTC(2026, 9, 1, 9, 0, 0, 300);
  const deps: any = {
    repoRoot: REPO,
    fs,
    env: { TZ: 'UTC' },
    pid: 4242,
    now: () => clock,
    sleep: async (ms: number) => {
      sleeps.push(ms);
      clock += ms;
    },
    log: (line: string) => out.push(line),
    error: (line: string) => err.push(line),
    loadHarness: () => fakeHarness(fs),
    exec: () => {
      throw new Error('unexpected exec');
    },
    mkdtemp: () => TMP,
    rmdir: jest.fn(),
  };
  const harness = (o: FakeOpts) => {
    deps.loadHarness = () => fakeHarness(fs, o);
  };
  return { deps, fs, out, err, sleeps, harness, text: () => out.concat(err).join('\n'), reset: () => { out.length = 0; err.length = 0; fs.writes.length = 0; } };
}

async function recorded(env = setup()) {
  expect(await main(['--update'], env.deps)).toBe(0);
  env.reset();
  return env;
}

const readJson = (env: ReturnType<typeof setup>, file: string) => JSON.parse(env.fs.readFileSync(file, 'utf8'));

describe('arguments', () => {
  it('prints the usage for --help', async () => {
    const env = setup();
    expect(await main(['--help'], env.deps)).toBe(0);
    expect(env.out[0]).toBe(USAGE);
  });

  it.each([
    [['--bogus'], 'unknown argument: --bogus'],
    [['--force'], '--force only applies to --update'],
    [['--update', '--determinism'], 'cannot be combined'],
    [['--corpus'], '--corpus needs a value'],
    [['--show-deliveries', '3'], '--show-deliveries needs exactly one --corpus'],
    [['--show-deliveries', 'x', '--corpus', 'a'], '--show-deliveries needs a chunk number'],
    [['--show-deliveries', '2', '--corpus', 'a', '--update'], 'cannot be combined with --update'],
  ])('rejects %j with exit 2', async (argv, message) => {
    const env = setup();
    expect(await main(argv, env.deps)).toBe(2);
    expect(env.text()).toContain(message);
  });

  it('rejects an unknown corpus with exit 2', async () => {
    const env = setup();
    expect(await main(['--corpus', 'nope'], env.deps)).toBe(2);
    expect(env.text()).toContain('no corpus "nope" (have: bridge-a, caseview-b)');
  });

  it('parses repeatable --corpus, --extended-dir and --no-extended', () => {
    const opts = parseArgs(['--corpus', 'a', '--corpus', 'b', '--all', '--extended-dir', '/x', '--no-extended']);
    expect(opts).toMatchObject({ corpus: ['a', 'b'], all: true, extendedDir: '/x', noExtended: true });
  });
});

describe('FEED_PARSE_VERSION = <semver>+<golden-set digest> (DET-10)', () => {
  it('splits the version', () => {
    expect(splitVersion('1.1.0+def991bd7ad98a87')).toEqual({ semver: '1.1.0', digest: 'def991bd7ad98a87', wellFormed: true });
    expect(splitVersion('2.0.0-det.1')).toEqual({ semver: '2.0.0-det.1', digest: null, wellFormed: true });
    expect(splitVersion('fp-7').wellFormed).toBe(false);
  });

  it('names what is wrong', () => {
    const set = { digest: 'aaaaaaaaaaaaaaaa', count: 2, missing: [] as string[] };
    expect(versionProblems('1.0.0+aaaaaaaaaaaaaaaa', set)).toEqual([]);
    expect(versionProblems('1.0.0', set)[0]).toContain('carries no golden-set digest; DET-10 needs 1.0.0+aaaaaaaaaaaaaaaa');
    expect(versionProblems('1.0.0+bbbbbbbbbbbbbbbb', set)[0]).toContain('golden output changed without a version change');
    expect(versionProblems('fp-7', set)[0]).toContain('is not <semver>+<golden-set digest>');
    expect(versionProblems('1.0.0+aaaaaaaaaaaaaaaa', { ...set, missing: ['x'] })[0]).toContain('no outputDigest');
  });

  it('rewrites only the literal in version.ts', () => {
    const env = setup({ version: '1.0.0' });
    expect(rewriteVersionFile(env.deps, '1.1.0+0123456789abcdef')).toBeNull();
    expect(env.fs.readFileSync(VERSION_TS, 'utf8')).toBe("/** spec */\nexport const FEED_PARSE_VERSION = '1.1.0+0123456789abcdef';\n");
    env.fs.writeFileSync(VERSION_TS, 'export const OTHER = 1;');
    expect(rewriteVersionFile(env.deps, 'x')).toContain('no FEED_PARSE_VERSION literal');
  });
});

describe('the gate (default mode)', () => {
  it('passes when every corpus matches its golden and the version carries the goldens\' digest; it never writes', async () => {
    const env = await recorded();
    expect(await main([], env.deps)).toBe(0);
    const text = env.text();
    expect(text).toContain('PASS bridge-a (Bridge, synthetic): 2 line(s), 2 delivery call(s) in 2 chunk(s)');
    expect(text).toContain('PASS caseview-b (CaseView, synthetic): 1 line(s), 1 delivery call(s) in 1 chunk(s)');
    expect(text).toContain('masked fields: none (every tuple field is compared, in the buffer and in every delivery)');
    expect(text).toContain('extended corpora: none defined');
    expect(text).toMatch(/FEED_PARSE_VERSION 1\.0\.0\+[0-9a-f]{16} carries the digest of 2 golden\(s\) \(2 in-repo, 0 extended\) \(DET-10\)/);
    expect(text).toContain('golden-replay-gate: PASS: 2 corpus(es), 3 line(s), 3 delivery call(s); every compared field byte-identical, [6] unique.');
    expect(text).toContain('the parser wrote 1 console line(s) while replaying (suppressed; --verbose shows them)');
    expect(env.fs.writes).toEqual([]); // the gate never writes: release-edge needs a clean tree
  });

  it('masks nothing: every field is compared (DET-1 and DET-3 made the old masks unnecessary)', () => {
    expect(MASKED_FIELDS).toEqual({ B: [], C: [] });
  });

  it('fails with exit 1 and a per-line diff when a buffer field changes', async () => {
    const env = await recorded();
    env.harness({ text: (id, t) => (id === 'bridge-a' ? t.replace('Thank', 'Thanks') : t) });
    expect(await main([], env.deps)).toBe(1);
    const text = env.text();
    expect(text).toContain('FAIL bridge-a (Bridge, synthetic): 1 line(s) differ (golden 2 lines, replay 2); 1 chunk(s) deliver differently');
    expect(text).toContain('line #1 (index 1, buffer position 1, timecode 10:00:00:00, "Thank you.")');
    expect(text).toContain('golden: "Thank you."');
    expect(text).toContain('replay: "Thanks you."');
    expect(text).toContain('A release is blocked.');
  });

  it('fails when only the deliveries change, the final buffer identical, and shows what the replay delivered', async () => {
    const env = await recorded();
    env.harness({ deliveredText: (id, t) => (id === 'caseview-b' ? t + ' (delivered)' : t) });
    expect(await main([], env.deps)).toBe(1);
    const text = env.text();
    expect(text).toContain('FAIL caseview-b (CaseView, synthetic): 1 chunk(s) deliver differently');
    expect(text).not.toContain('line(s) differ');
    expect(text).toMatch(/chunk #1: golden 1 call\(s\), digest [0-9a-f]{12}; replay 1 call\(s\), digest [0-9a-f]{12}/);
    expect(text).toContain("emitDelivery 'TCP-DATA': 1 tuple(s)");
    expect(text).toContain('d[0]: [2]=0 "Q.  Name? (delivered)"');
  });

  it('fails when [6] ids are not unique, whatever the golden says', async () => {
    const env = await recorded();
    env.harness({ duplicates: (id) => (id === 'bridge-a' ? 3 : 0) });
    expect(await main([], env.deps)).toBe(1);
    expect(env.text()).toContain('[6] line ids are not unique: two buffer lines shared an id at 3 chunk boundaries, first after chunk #1 (ids 1000000)');
  });

  it('fails when the canonical form changes while every line matches (libs/edge-sync canonical.ts is covered)', async () => {
    const env = await recorded();
    env.harness({ canonicalSalt: 'canonical.ts changed' });
    expect(await main([], env.deps)).toBe(1);
    expect(env.text()).toContain('the canonical root differs');
    expect(env.text()).toContain('libs/edge-sync canonical.ts changed the canonical form');
  });

  it('fails when detectProtocol would route a corpus to the other parser, unless it is marked legacyMisroute', async () => {
    const env = await recorded();
    env.harness({ detect: () => 'caseview' });
    expect(await main(['--corpus', 'bridge-a'], env.deps)).toBe(1);
    expect(env.text()).toContain('detectProtocol routes this corpus to caseview, but it is replayed as bridge');

    const mis = setup({ files: corpusFiles(REPO, 'misroute', { protocol: 'C', chunks: ['\x02N\x01\x03'], extra: { legacyMisroute: true } }) });
    await recorded(mis);
    expect(await main([], mis.deps)).toBe(0);
    expect(mis.text()).toContain('PASS misroute (CaseView, synthetic, legacy misroute)');
    mis.harness({ detect: () => 'caseview' });
    expect(await main([], mis.deps)).toBe(1);
    expect(mis.text()).toContain('marked legacyMisroute, but detectProtocol routes it to caseview (its own parser): drop the mark');
  });

  it('fails when a golden was edited by hand', async () => {
    const env = await recorded();
    const g = readJson(env, golden('caseview-b'));
    g.lines[0].f[2] = 7;
    env.fs.writeFileSync(golden('caseview-b'), JSON.stringify(g));
    expect(await main([], env.deps)).toBe(1);
    expect(env.text()).toMatch(/\[2\] index\s+golden: 7\s+replay: 0/);
  });

  it('fails when a golden is missing or unreadable', async () => {
    const env = setup();
    expect(await main([], env.deps)).toBe(1);
    expect(env.text()).toContain('FAIL bridge-a (Bridge, synthetic): no golden at tools/ci/golden-replay/corpora/bridge-a/golden.json. Record it with --update --corpus bridge-a.');
    env.fs.writeFileSync(golden('bridge-a'), '{"lines":');
    expect(await main(['--corpus', 'bridge-a'], env.deps)).toBe(1);
    expect(env.text()).toContain('unreadable golden');
  });

  it('fails when the semver moved without re-recording, even with identical output', async () => {
    const env = await recorded();
    const digest = splitVersion(readVersion(env.fs, REPO)).digest;
    env.fs.writeFileSync(VERSION_TS, `export const FEED_PARSE_VERSION = '1.1.0+${digest}';\n`);
    expect(await main([], env.deps)).toBe(1);
    expect(env.text()).toContain('FAIL bridge-a (Bridge, synthetic): output identical');
    expect(env.text()).toContain('golden was recorded under FEED_PARSE_VERSION 1.0.0, the tree says 1.1.0');
  });

  it('fails when the goldens\' digest is not the one in FEED_PARSE_VERSION (golden output changed without a version change)', async () => {
    const env = await recorded();
    env.fs.writeFileSync(VERSION_TS, "export const FEED_PARSE_VERSION = '1.0.0+0000000000000000';\n");
    expect(await main([], env.deps)).toBe(1);
    expect(env.text()).toContain('FAIL FEED_PARSE_VERSION 1.0.0+0000000000000000 (DET-10):');
    expect(env.text()).toContain('golden output changed without a version change (DET-10)');
    env.fs.writeFileSync(VERSION_TS, "export const FEED_PARSE_VERSION = '1.0.0';\n");
    expect(await main([], env.deps)).toBe(1);
    expect(env.text()).toContain('carries no golden-set digest');
  });

  it('fails when the corpus input changed since recording', async () => {
    const env = await recorded();
    for (const [p, c] of Object.entries(corpusFiles(REPO, 'bridge-a', { chunks: ['Good morning.', 'Thank you!'] }))) env.fs.writeFileSync(p, c);
    expect(await main([], env.deps)).toBe(1);
    expect(env.text()).toContain('the corpus input changed since the golden was recorded');
    expect(env.text()).toContain('--update --force --corpus bridge-a');
  });

  it('fails when a golden was recorded under another mask or another golden format', async () => {
    const env = await recorded();
    const g = readJson(env, golden('bridge-a'));
    env.fs.writeFileSync(golden('bridge-a'), JSON.stringify({ ...g, masked: [6] }));
    expect(await main([], env.deps)).toBe(1);
    expect(env.text()).toContain('golden was recorded with [6] line id masked; the gate now masks none');
    env.fs.writeFileSync(golden('bridge-a'), JSON.stringify({ ...g, format: 'golden-replay/1' }));
    expect(await main([], env.deps)).toBe(1);
    expect(env.text()).toContain(`golden format is "golden-replay/1", this gate reads ${GOLDEN_FORMAT}`);
  });

  it('fails with exit 1 when the replay itself fails', async () => {
    const env = await recorded();
    env.harness({ fail: new Error('ts-node exploded') });
    expect(await main([], env.deps)).toBe(1);
    expect(env.text()).toContain('golden-replay-gate: FAILED: Error: ts-node exploded');
  });

  it('fails when there are no corpora at all', async () => {
    const env = setup({ files: { [path.join(CORPORA, 'README.md')]: 'x' } });
    expect(await main([], env.deps)).toBe(1);
    expect(env.text()).toContain('a gate over nothing would pass vacuously');
  });

  it('notes a partial run', async () => {
    const env = await recorded();
    expect(await main(['--corpus', 'bridge-a'], env.deps)).toBe(0);
    expect(env.text()).toContain('1 corpus(es) in the repo of 2 (partial run, not a release check)');
  });
});

describe('extended corpora (real hearings, read in place, digest-only goldens)', () => {
  const SECRET = 'SECRET HEARING WORDS';
  const files = () => ({
    ...corpusFiles(REPO, 'bridge-a', { chunks: ['Good morning.'] }),
    ...extendedFiles(REPO, 'ext-a', EXT_SRC, { entries: [{ data1: SECRET }, { cmdType: 'N', hexCmd: '024e0103' }, { data1: ' more' }] }),
  });

  it('says the folder is absent and runs the in-repo corpora alone', async () => {
    const env = setup({ files: { ...corpusFiles(REPO, 'bridge-a', { chunks: ['Good morning.'] }), [path.join(EXTENDED, 'ext-a', 'corpus.json')]: '{}' } });
    expect(await main(['--update'], env.deps)).toBe(0);
    env.reset();
    expect(await main([], env.deps)).toBe(0);
    expect(env.text()).toContain(`extended corpora: folder absent (${EXT_SRC}); 1 not run`);
  });

  it('runs them when the folder exists; the golden holds digests and counts, never the text', async () => {
    const env = setup({ files: files() });
    expect(await main(['--update'], env.deps)).toBe(0);
    expect(env.text()).toContain('extended corpora: 1 run');
    const raw = env.fs.readFileSync(extGolden('ext-a'), 'utf8');
    expect(raw).not.toContain('SECRET');
    expect(raw).not.toContain('"lines"');
    const g = JSON.parse(raw);
    expect(g).toMatchObject({ format: EXTENDED_GOLDEN_FORMAT, corpus: 'ext-a', source: { type: 'tcp-server-json', file: 'commands.json' }, lineCount: 3 });
    expect(g.deliveryBlocks).toHaveLength(1);
    expect(g.deliveryChunks).toBeUndefined();
    env.reset();
    expect(await main([], env.deps)).toBe(0);
    expect(env.text()).toContain('PASS ext-a (Bridge, real, extended): 3 line(s)');
    // the version digest covers the committed extended golden too
    expect(env.text()).toContain('carries the digest of 2 golden(s) (1 in-repo, 1 extended)');
  });

  it('the version digest reads the committed extended goldens, so a machine without the folder computes the same one', async () => {
    const env = setup({ files: files() });
    await recorded(env);
    const version = readVersion(env.fs, REPO);
    // a machine without the extended source folder (CI, another box): same version, still consistent
    expect(await main(['--extended-dir', NO_EXT_SRC], env.deps)).toBe(0);
    expect(env.text()).toContain(`extended corpora: folder absent (${NO_EXT_SRC}); 1 not run`);
    expect(env.text()).toContain(`FEED_PARSE_VERSION ${version} carries the digest of 2 golden(s) (1 in-repo, 1 extended)`);
    // an edited extended golden fails the version check even there
    env.reset();
    const g = readJson(env, extGolden('ext-a'));
    env.fs.writeFileSync(extGolden('ext-a'), JSON.stringify({ ...g, outputDigest: 'f'.repeat(64) }));
    expect(await main(['--extended-dir', NO_EXT_SRC], env.deps)).toBe(1);
    expect(env.text()).toContain('golden output changed without a version change (DET-10)');
  });

  it('an output change only the extended corpora show changes FEED_PARSE_VERSION once re-recorded, even with --force', async () => {
    const env = setup({ files: files() });
    await recorded(env);
    const before = readVersion(env.fs, REPO);
    env.harness({ text: (id, t) => (id === 'ext-a' ? t.toUpperCase() : t) });
    expect(await main([], env.deps)).toBe(1); // the gate sees it where the folder exists
    env.reset();
    expect(await main(['--update', '--force'], env.deps)).toBe(0);
    expect(env.text()).toContain('bridge-a: unchanged');
    const after = readVersion(env.fs, REPO);
    expect(splitVersion(after).semver).toBe(splitVersion(before).semver);
    expect(after).not.toBe(before); // rt-deploy-check sees a different parser
    env.reset();
    expect(await main([], env.deps)).toBe(0);
  });

  it('an extended corpus with no golden yet is noted and left out of the digest; an unreadable one fails', async () => {
    const env = setup({ files: { ...corpusFiles(REPO, 'bridge-a', { chunks: ['Good morning.'] }), [path.join(EXTENDED, 'ext-a', 'corpus.json')]: '{}' } });
    await recorded(env);
    expect(await main([], env.deps)).toBe(0);
    expect(env.text()).toContain('carries the digest of 1 golden(s) (1 in-repo, 0 extended)');
    expect(env.text()).toContain('extended corpus(es) with no golden yet, not in the version digest: ext-a');
    env.reset();
    env.fs.writeFileSync(extGolden('ext-a'), '{"outputDigest":');
    expect(await main([], env.deps)).toBe(1);
    expect(env.text()).toContain('golden(s) with no outputDigest (record them with --update): extended/ext-a');
  });

  it('--update warns when the extended corpora could not be re-recorded', async () => {
    const env = setup({ files: files() });
    await recorded(env);
    env.fs.writeFileSync(VERSION_TS, `export const FEED_PARSE_VERSION = '1.1.0+${splitVersion(readVersion(env.fs, REPO)).digest}';\n`);
    expect(await main(['--update', '--extended-dir', NO_EXT_SRC], env.deps)).toBe(0);
    expect(env.text()).toContain('warning: the 1 extended corpus(es) were not re-recorded (folder absent');
    expect(env.text()).toContain('must also be re-recorded where that folder exists');
  });

  it('a difference fails by digest, block and page, without printing the hearing text', async () => {
    const env = setup({ files: files() });
    await recorded(env);
    env.harness({ text: (id, t) => (id === 'ext-a' ? t.toUpperCase() : t), canonicalSalt: 'x' });
    expect(await main([], env.deps)).toBe(1);
    const text = env.text();
    expect(text).toContain('FAIL ext-a (Bridge, real, extended): the final buffer differs (golden 3 lines, replay 3); the deliveries differ');
    expect(text).toContain('1 block(s) of 256 chunks, first in chunks 0-255');
    expect(text).toContain('the canonical pages differ (1 of 1 page(s), first page 1)');
    expect(text).not.toContain('SECRET');
    expect(text).not.toContain('HEARING');
  });

  it('--no-extended skips them; --corpus naming one with no folder is a usage error', async () => {
    const env = setup({ files: files() });
    await recorded(env);
    expect(await main(['--no-extended'], env.deps)).toBe(0);
    expect(env.text()).toContain('extended corpora: skipped (--no-extended); 1 not run');
    expect(await main(['--corpus', 'ext-a', '--no-extended'], env.deps)).toBe(2);
    expect(env.text()).toContain('is skipped (--no-extended)');
  });

  it('--show-deliveries refuses an extended corpus (it would print hearing text)', async () => {
    const env = setup({ files: files() });
    await recorded(env);
    expect(await main(['--corpus', 'ext-a', '--show-deliveries', '1'], env.deps)).toBe(2);
    expect(env.text()).toContain('works on in-repo corpora only');
  });
});

describe('--update', () => {
  it('records missing goldens without --force and writes the golden-set digest into FEED_PARSE_VERSION', async () => {
    const env = setup();
    expect(await main(['--update'], env.deps)).toBe(0);
    const g = readJson(env, golden('bridge-a'));
    expect(g).toMatchObject({ format: GOLDEN_FORMAT, corpus: 'bridge-a', protocol: 'B', feedParseSemver: '1.0.0', masked: [], lineCount: 2, detectedProtocol: 'bridge', duplicateIdChunks: 0 });
    expect(g.deliveries).toMatchObject({ calls: 2, chunks: 2 });
    expect(g.deliveryChunks).toHaveLength(2);
    expect(g.outputDigest).toMatch(/^[0-9a-f]{64}$/);
    expect(g.lines[0]).toMatchObject({ pos: 0, n: 9, txt: 'Good morning.' });
    expect(g.lines[0].f[6]).toBe(1e6);
    expect(g.lines[0].f[7]).toEqual({ $undef: 1 });
    expect(readJson(env, golden('caseview-b')).lines[0].f[0]).toBe('10:00:00');
    expect(env.text()).toContain('bridge-a: recorded (new) (2 lines, 2 delivery calls) -> tools/ci/golden-replay/corpora/bridge-a/golden.json');
    const version = readVersion(env.fs, REPO);
    expect(version).toMatch(/^1\.0\.0\+[0-9a-f]{16}$/);
    expect(env.text()).toContain(`FEED_PARSE_VERSION 1.0.0 -> ${version}`);
  });

  it('writes one line record and one delivery digest per line of the file', async () => {
    const env = setup();
    expect(await main(['--update', '--corpus', 'bridge-a'], env.deps)).toBe(0);
    const text = env.fs.readFileSync(golden('bridge-a'), 'utf8');
    expect(text.split('\n').filter((l: string) => l.startsWith('    {"pos":'))).toHaveLength(2);
    expect(text.split('\n').filter((l: string) => /^ {4}"\d+:\d+:[0-9a-f]{12}"/.test(l))).toHaveLength(2);
    expect(text.endsWith('\n  ]\n}\n')).toBe(true);
  });

  it('refuses, writing nothing, while the goldens carry the tree\'s semver', async () => {
    const env = await recorded();
    expect(await main(['--update'], env.deps)).toBe(1);
    expect(env.fs.writes).toEqual([]);
    expect(env.text()).toContain("REFUSED: FEED_PARSE_VERSION's semver is still 1.0.0");
    expect(env.text()).toContain('bridge-a: stamped 1.0.0');
    expect(env.text()).toContain('the buffer or any delivery');
  });

  it('re-records after a semver bump, reports what changed, rewrites the digest, and the gate then passes', async () => {
    const env = await recorded();
    const before = readVersion(env.fs, REPO);
    env.fs.writeFileSync(VERSION_TS, `export const FEED_PARSE_VERSION = '1.1.0+${splitVersion(before).digest}';\n`);
    env.harness({ text: (id, t) => (id === 'bridge-a' ? t.toUpperCase() : t) });
    expect(await main(['--update'], env.deps)).toBe(0);
    expect(env.text()).toContain('bridge-a: re-recorded: 2 line(s) differ from the old golden; 2 chunk(s) deliver differently; canonical root changed');
    expect(env.text()).toContain('caseview-b: re-recorded: output identical, header changed');
    expect(readJson(env, golden('caseview-b')).feedParseSemver).toBe('1.1.0');
    const after = readVersion(env.fs, REPO);
    expect(after).toMatch(/^1\.1\.0\+[0-9a-f]{16}$/);
    expect(after).not.toBe(`1.1.0+${splitVersion(before).digest}`);
    env.reset();
    expect(await main([], env.deps)).toBe(0);
  });

  it('a delivery-only change also needs the bump (the version rule covers deliveries)', async () => {
    const env = await recorded();
    env.harness({ deliveredText: (_id, t) => t + '!' });
    expect(await main(['--update'], env.deps)).toBe(1);
    expect(env.text()).toContain('REFUSED');
  });

  it('--force re-records under the same semver; an unchanged golden is rewritten byte for byte and the version kept', async () => {
    const env = await recorded();
    const before = env.fs.readFileSync(golden('bridge-a'), 'utf8');
    const version = readVersion(env.fs, REPO);
    expect(await main(['--update', '--force'], env.deps)).toBe(0);
    expect(env.text()).toContain('bridge-a: unchanged (2 lines, 2 delivery calls)');
    expect(env.text()).toContain(`FEED_PARSE_VERSION ${version} unchanged`);
    expect(env.fs.readFileSync(golden('bridge-a'), 'utf8')).toBe(before);
  });

  it('--corpus limits the policy and the writes to that corpus (and the version digest)', async () => {
    const env = await recorded();
    for (const [p, c] of Object.entries(corpusFiles(REPO, 'new-one', { chunks: ['fresh'] }))) env.fs.writeFileSync(p, c);
    env.fs.writes.length = 0;
    expect(await main(['--update', '--corpus', 'new-one'], env.deps)).toBe(0);
    expect(env.fs.writes).toEqual([golden('new-one'), VERSION_TS]);
  });

  it('warns when a recorded corpus has duplicate [6] ids', async () => {
    const env = setup();
    env.harness({ duplicates: (id) => (id === 'bridge-a' ? 1 : 0) });
    expect(await main(['--update'], env.deps)).toBe(0);
    expect(env.text()).toContain('warning: bridge-a: [6] line ids are not unique');
  });
});

describe('--show-deliveries', () => {
  it('prints, decoded, what an in-repo corpus delivers at one chunk, with both digests', async () => {
    const env = await recorded();
    expect(await main(['--corpus', 'bridge-a', '--show-deliveries', '2'], env.deps)).toBe(0);
    const text = env.text();
    expect(text).toContain('bridge-a chunk #2 under FEED_PARSE_VERSION');
    expect(text).toMatch(/replay digest 1:1:([0-9a-f]{12}); golden digest 1:1:\1/);
    expect(text).toContain('d[0]: [2]=1 "Thank you."');
  });
});

describe('--emit (one run of --determinism)', () => {
  it('writes every field of every line and every delivery unmasked, with the process facts; extended corpora as digests only', async () => {
    const env = setup({ files: { ...corpusFiles(REPO, 'bridge-a', { chunks: ['Good morning.'] }), ...extendedFiles(REPO, 'ext-a', EXT_SRC, { entries: [{ data1: 'SECRET' }] }) } });
    const file = path.join(TMP, 'run.json');
    expect(await main(['--emit', file], env.deps)).toBe(0);
    const raw = env.fs.readFileSync(file, 'utf8');
    expect(raw).not.toContain('SECRET');
    const run = JSON.parse(raw);
    expect(run).toMatchObject({ format: 'golden-replay-run/2', pid: 4242, tz: 'UTC', extended: 'run' });
    expect(run.corpora.map((c: any) => c.id)).toEqual(['bridge-a', 'ext-a']);
    expect(run.corpora[0].lines[0].f[6]).toBe(1e6);
    expect(run.corpora[0].deliveries[0].calls[0].event).toBe('TCP-DATA');
    expect(run.corpora[1].lines).toBeUndefined();
    expect(run.corpora[1].lineDigests[0].length).toBeGreaterThan(3);
    expect(run.corpora[1].deliveryDigests).toHaveLength(1);
  });
});

describe('--determinism', () => {
  const runFile = (args: string[]) => args[args.indexOf('--emit') + 1];

  function payload(pid: number, tz: string, id6: number, clock: string, text = 'Good morning.', delivered = text) {
    const line = ['10:00:00:00', codes(text), 0, 'FL', 1, 1, id6];
    return {
      format: 'golden-replay-run/2',
      feedParseVersion: '1.1.0+0000000000000000',
      pid,
      tz,
      startedAt: '2026-10-01T09:00:00.000Z',
      endedAt: '2026-10-01T09:00:02.000Z',
      corpora: [
        {
          id: 'bridge-a', protocol: 'B', duplicateIdChunks: 0, canonicalRoot: 'r',
          lines: lineRecords([line], []),
          deliveries: [{ chunk: 0, calls: [{ fn: 'emitDelivery', event: 'TCP-DATA', payload: encodeValue({ d: [['10:00:00:00', codes(delivered), 0, 'FL', 1, 1, id6]] }) }] }],
        },
        { id: 'caseview-b', protocol: 'C', duplicateIdChunks: 0, canonicalRoot: 'r', lines: lineRecords([[clock, codes('Q.'), 0]], []), deliveries: [] },
      ],
    };
  }

  /** spawnSync stand-in: "the other process" writes its run file before exec returns. */
  function execWriting(env: ReturnType<typeof setup>, runs: any[], status = 0) {
    const calls: Array<{ args: string[]; env: any }> = [];
    env.deps.exec = (args: string[], extraEnv: any) => {
      calls.push({ args, env: extraEnv });
      if (status === 0) env.fs.writeFileSync(runFile(args), JSON.stringify(runs[calls.length - 1]));
      return { status, stdout: status ? 'child stdout' : '', stderr: status ? 'child stderr' : '', error: null };
    };
    return calls;
  }

  it('replays in two separate processes, the second in a later second and another TZ; passes when every field is identical', async () => {
    const env = setup();
    const calls = execWriting(env, [payload(11, 'UTC', 1e6, '09:00:01'), payload(12, 'Asia/Kolkata', 1e6, '09:00:01')]);
    expect(await main(['--determinism'], env.deps)).toBe(0);
    expect(calls.map((c) => c.args)).toEqual([
      [GATE_SCRIPT, '--emit', path.join(TMP, 'run-a.json')],
      [GATE_SCRIPT, '--emit', path.join(TMP, 'run-b.json')],
    ]);
    expect(calls.map((c) => c.env)).toEqual([{ TZ: 'UTC' }, { TZ: 'Asia/Kolkata' }]);
    expect(env.sleeps).toEqual([750]); // clock at .300: wait for the next whole second + 50 ms
    const text = env.text();
    expect(text).toContain('Bridge   every field identical on 1 line(s), and in every delivery');
    expect(text).toContain('PASS: every field identical between two separate processes (2 corpus(es)).');
    expect(env.deps.rmdir).toHaveBeenCalledWith(TMP);
  });

  it('fails on a differing [6] or CaseView [0]: they are no longer masked', async () => {
    const env = setup();
    execWriting(env, [payload(11, 'UTC', 523, '09:00:01'), payload(12, 'Asia/Kolkata', 918, '09:00:03')]);
    expect(await main(['--determinism'], env.deps)).toBe(1);
    expect(env.text()).toMatch(/Bridge\s+\[6\] line id\s+differs on 1 of 1 line\(s\) in bridge-a\s+\[NOT MASKED\]/);
    expect(env.text()).toMatch(/Bridge\s+delivery \[6\]\s+differs/);
    expect(env.text()).toMatch(/CaseView\s+\[0\] timecode\s+differs on 1 of 1 line\(s\) in caseview-b\s+\[NOT MASKED\]/);
    expect(env.text()).toContain('report it (do not just add it to MASKED_FIELDS)');
  });

  it('fails when only a delivery differs between the runs', async () => {
    const env = setup();
    execWriting(env, [payload(11, 'UTC', 5, '09:00:01'), payload(12, 'Asia/Kolkata', 5, '09:00:01', 'Good morning.', 'Good morning!')]);
    expect(await main(['--determinism'], env.deps)).toBe(1);
    expect(env.text()).toMatch(/Bridge\s+delivery \[1\]\s+differs on 1 of 1 line\(s\) in bridge-a\s+\[NOT MASKED\]/);
  });

  it('fails when a run reports duplicate [6] ids', async () => {
    const env = setup();
    const b = payload(12, 'Asia/Kolkata', 5, '09:00:01');
    b.corpora[0].duplicateIdChunks = 2;
    execWriting(env, [payload(11, 'UTC', 5, '09:00:01'), b]);
    expect(await main(['--determinism'], env.deps)).toBe(1);
    expect(env.text()).toContain('bridge-a: [6] line ids not unique at 2 chunk boundaries in the second run');
  });

  it('fails when a run fails, showing its output', async () => {
    const env = setup();
    execWriting(env, [], 1);
    expect(await main(['--determinism'], env.deps)).toBe(1);
    expect(env.text()).toContain('run A failed (exit 1)');
    expect(env.text()).toContain('child stderr');
    expect(env.deps.rmdir).toHaveBeenCalledWith(TMP);
  });

  it('refuses two runs that report the same process id', async () => {
    const env = setup();
    execWriting(env, [payload(11, 'UTC', 5, '09:00:01'), payload(11, 'UTC', 5, '09:00:01')]);
    expect(await main(['--determinism'], env.deps)).toBe(1);
    expect(env.text()).toContain('they were not separate processes');
  });

  it('passes --corpus, --extended-dir and --no-extended through to both runs', async () => {
    const env = setup();
    const one = payload(11, 'UTC', 5, '09:00:01');
    const two = payload(12, 'Asia/Kolkata', 5, '09:00:01');
    one.corpora.pop();
    two.corpora.pop();
    const calls = execWriting(env, [one, two]);
    expect(await main(['--determinism', '--corpus', 'bridge-a', '--extended-dir', '/x', '--no-extended'], env.deps)).toBe(0);
    expect(calls[1].args).toEqual([GATE_SCRIPT, '--emit', path.join(TMP, 'run-b.json'), '--corpus', 'bridge-a', '--extended-dir', '/x', '--no-extended']);
  });
});

describe('the CLI entry fails closed (cli)', () => {
  /** Stands in for `process`: an event emitter with an exitCode. */
  const fakeProcess = () => Object.assign(new EventEmitter(), { exitCode: undefined as number | undefined });
  const drain = () => new Promise((resolve) => setImmediate(resolve));

  it('holds exit code 1 until the gate reaches a verdict, then exits with the verdict', async () => {
    for (const [argv, code] of [[['--help'], 0], [['--bogus'], 2], [[], 1]] as Array<[string[], number]>) {
      const env = setup(); // no goldens recorded: the default run fails
      const proc = fakeProcess();
      const done = cli(argv, env.deps, proc);
      expect(proc.exitCode).toBe(1);
      expect(await done).toBe(code);
      expect(proc.exitCode).toBe(code);
    }
  });

  it('exits 1 with a stall message when the event loop drains before the replay finishes', async () => {
    const env = setup();
    env.harness({ never: true });
    const proc = fakeProcess();
    void cli([], env.deps, proc);
    await drain();
    proc.emit('beforeExit', 1);
    proc.emit('beforeExit', 1); // node emits it again if anything was scheduled; report once
    expect(proc.exitCode).toBe(1);
    expect(env.err).toEqual([STALLED]);
  });

  it('says nothing at exit once the gate has a verdict', async () => {
    const env = await recorded();
    const proc = fakeProcess();
    expect(await cli([], env.deps, proc)).toBe(0);
    proc.emit('beforeExit', 0);
    expect(proc.exitCode).toBe(0);
    expect(env.err).toEqual([]);
  });

  it('exits 1 when main itself throws', async () => {
    const env = setup();
    env.deps.log = () => {
      throw new Error('stdout closed');
    };
    const proc = fakeProcess();
    expect(await cli(['--help'], env.deps, proc)).toBe(1);
    expect(proc.exitCode).toBe(1);
    expect(env.err.join('\n')).toContain('Error: stdout closed');
  });
});

describe('the CLI entry in a real node process', () => {
  /**
   * Runs cli() in a child node with an in-memory corpus and the given harness
   * source, so the exit code is node's own. A replay that never settles
   * leaves nothing on the event loop: without cli() failing closed, node
   * exits 0 and release-edge would tag the release.
   */
  function runEntry(harness: string, argv: string[] = []) {
    const script = `
      const path = require('path');
      const { cli } = require(${JSON.stringify(path.join(__dirname, 'gate.js'))});
      const { memoryFs, corpusFiles, versionFile } = require(${JSON.stringify(path.join(__dirname, 'spec-fakes.js'))});
      const repo = path.resolve('/work/backend');
      const fail = (what) => () => { throw new Error('unexpected ' + what); };
      cli(${JSON.stringify(argv)}, {
        repoRoot: repo,
        fs: memoryFs({ ...versionFile(repo, '1.0.0'), ...corpusFiles(repo, 'bridge-a', { chunks: ['Good morning.'] }) }),
        env: {}, pid: process.pid, now: () => Date.now(), sleep: async () => {},
        log: (line) => console.log(line), error: (line) => console.error(line),
        loadHarness: () => (${harness}),
        exec: fail('exec'), mkdtemp: fail('mkdtemp'), rmdir: fail('rmdir'),
      }, process);
    `;
    return spawnSync(process.execPath, ['-e', script], { encoding: 'utf8', timeout: 60000, windowsHide: true });
  }

  it('exits 1 with the stall message when the replay never settles', () => {
    const res = runEntry(`{ feedParseVersion: () => '1.0.0', replayAll: () => new Promise(() => {}) }`);
    expect(res.error).toBeUndefined();
    expect(res.stderr).toContain(STALLED);
    expect(res.status).toBe(1);
  });

  it('exits with the verdict when the gate finishes', () => {
    expect(runEntry('null', ['--help']).status).toBe(0);
    expect(runEntry('null', ['--bogus']).status).toBe(2);
  });
});
