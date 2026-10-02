'use strict';
/**
 * golden-replay-gate (plan R-T1 / D13, spec §6.3 RC-1, DET-10): replays every
 * golden corpus through the real libs/feed-parse parser and diffs, per corpus,
 * against its recorded golden:
 *   - the final line buffer, line by line and field by field;
 *   - the delivery stream: every emitLocal / emitDelivery / savePageData /
 *     removeLines call, digested per chunk (a delivery-only regression fails
 *     even when the buffer is unchanged);
 *   - the canonical pages' root (libs/edge-sync canonical.ts);
 *   - [6] uniqueness: no two buffer lines share a line id at any chunk boundary.
 * It also checks that FEED_PARSE_VERSION carries the digest of every
 * committed golden, the extended corpora's included (DET-10), so golden
 * output never changes without a version change.
 * release-edge runs it before tagging; a non-zero exit blocks the release.
 * Modes, corpora, masks and the update policy: README.md in this folder.
 *
 * Everything with a side effect comes in through `deps` (systemDeps below),
 * so the specs run the gate without spawning, sleeping or touching the disk.
 */

const os = require('os');
const path = require('path');
const corpora = require('./corpora');
const compare = require('./compare');

const GATE_SCRIPT = 'tools/ci/golden-replay-gate.js';
const GOLDEN_FORMAT = 'golden-replay/2';
const EXTENDED_GOLDEN_FORMAT = 'golden-replay-extended/1';
const RUN_FORMAT = 'golden-replay-run/2';
/** Where FEED_PARSE_VERSION lives; --update rewrites its golden-set digest. */
const VERSION_FILE = 'libs/feed-parse/src/version.ts';
/** Host zones of the two --determinism runs; the corpora pin cTimezone, so these only expose a host-zone read. */
const DETERMINISM_TZ = ['UTC', 'Asia/Kolkata'];
/** FEED_PARSE_VERSION = <semver>+<16 hex golden-set digest> (DET-10). */
const VERSION_RE = /^(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)(?:\+([0-9a-f]+))?$/;

const USAGE = `golden-replay-gate: replay the golden corpora through libs/feed-parse and diff what the parser
leaves behind and what it delivers against the recorded goldens

  node tools/ci/golden-replay-gate.js                  the gate: exit 0 = every corpus matches its golden and
                                                       FEED_PARSE_VERSION carries the goldens' digest,
                                                       1 = a difference or an error (blocks release-edge)
  node tools/ci/golden-replay-gate.js --determinism    replay twice in two separate node processes and
                                                       compare every field; lists the fields that differ
  node tools/ci/golden-replay-gate.js --update         re-record the goldens and the digest in FEED_PARSE_VERSION;
                                                       refused while a golden is stamped with the tree's semver
  node tools/ci/golden-replay-gate.js --update --force re-record regardless of the stamp
  node tools/ci/golden-replay-gate.js --corpus <id> --show-deliveries <n>
                                                       print what the parser delivers at chunk n of an in-repo corpus

Options
  --corpus <id>          only this corpus (repeatable); default every corpus. A partial run is not a release check.
  --extended-dir <dir>   where the extended corpora's source files are (default ../tcp-server-main next to the
                         repo, or $${corpora.EXTENDED_ENV}); the extended corpora run when it exists
  --no-extended          skip the extended corpora even when their folder exists
  --all                  describe every differing line (default: the first 25 per corpus)
  --verbose              let the parser's own console output through while replaying
  --help                 this text

Exit 0 = pass, 1 = difference / refused / error / stalled replay, 2 = usage error. Details: tools/ci/golden-replay/README.md`;

class UsageError extends Error { }

function parseArgs(argv) {
  const opts = {
    determinism: false, update: false, force: false, all: false, verbose: false, help: false,
    corpus: [], emit: null, extendedDir: null, noExtended: false, showDeliveries: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const value = () => {
      const v = argv[++i];
      if (v === undefined || v.startsWith('--')) throw new UsageError(arg + ' needs a value');
      return v;
    };
    switch (arg) {
      case '--determinism': opts.determinism = true; break;
      case '--update': opts.update = true; break;
      case '--force': opts.force = true; break;
      case '--all': opts.all = true; break;
      case '--verbose': opts.verbose = true; break;
      case '--help': case '-h': opts.help = true; break;
      case '--corpus': opts.corpus.push(value()); break;
      case '--extended-dir': opts.extendedDir = value(); break;
      case '--no-extended': opts.noExtended = true; break;
      case '--show-deliveries': {
        const v = value();
        if (!/^[1-9]\d*$/.test(v)) throw new UsageError('--show-deliveries needs a chunk number (1-based)');
        opts.showDeliveries = Number(v);
        break;
      }
      // internal: one replay run written to a file, for --determinism
      case '--emit': opts.emit = value(); break;
      default: throw new UsageError('unknown argument: ' + arg);
    }
  }
  if (opts.determinism && opts.update) throw new UsageError('--determinism and --update cannot be combined');
  if (opts.force && !opts.update) throw new UsageError('--force only applies to --update');
  if (opts.showDeliveries !== null) {
    if (opts.update || opts.determinism) throw new UsageError('--show-deliveries cannot be combined with --update or --determinism');
    if (opts.corpus.length !== 1) throw new UsageError('--show-deliveries needs exactly one --corpus');
  }
  return opts;
}

// ---------------------------------------------------------------------------
// version (DET-10)
// ---------------------------------------------------------------------------

/** { semver, digest, wellFormed } of a FEED_PARSE_VERSION string. */
function splitVersion(version) {
  const m = VERSION_RE.exec(String(version));
  if (!m) return { semver: String(version), digest: null, wellFormed: false };
  return { semver: m[1], digest: m[2] || null, wellFormed: true };
}

/** The semver a golden was recorded under (format 2: feedParseSemver; format 1: feedParseVersion). */
function stampOf(golden) {
  if (golden && typeof golden.feedParseSemver === 'string') return golden.feedParseSemver;
  if (golden && typeof golden.feedParseVersion === 'string') return splitVersion(golden.feedParseVersion).semver;
  return null;
}

/**
 * Digest DET-10 puts in FEED_PARSE_VERSION: over the outputDigest of every
 * COMMITTED golden, as recorded on disk: the in-repo corpora's and the
 * extended corpora's (keyed `extended/<id>`). Both are files in the repo, so
 * every machine computes the same digest whether or not the extended
 * corpora's source folder is there, and an output change that shows only on
 * the real hearings still changes the version string once it is re-recorded.
 * An extended corpus whose golden was never recorded is listed in
 * `unrecorded` (it cannot be recorded without its folder); an unreadable
 * golden, or one with no outputDigest, is `missing` and fails the version check.
 */
function goldenSetFromDisk(deps) {
  const entries = [];
  const missing = [];
  const unrecorded = [];
  let repo = 0;
  let extended = 0;
  for (const id of corpora.listCorpora(deps.fs, deps.repoRoot)) {
    const read = readGolden(deps, path.join(deps.repoRoot, corpora.CORPORA_DIR, id, 'golden.json'));
    if (read.golden && typeof read.golden.outputDigest === 'string') {
      entries.push({ id, outputDigest: read.golden.outputDigest });
      repo++;
    } else missing.push(id);
  }
  for (const id of corpora.listExtended(deps.fs, deps.repoRoot)) {
    const read = readGolden(deps, path.join(deps.repoRoot, corpora.EXTENDED_DIR, id, 'golden.json'));
    if (read.golden && typeof read.golden.outputDigest === 'string') {
      entries.push({ id: 'extended/' + id, outputDigest: read.golden.outputDigest });
      extended++;
    } else if (read.missing) unrecorded.push(id);
    else missing.push('extended/' + id);
  }
  return { digest: compare.goldenSetDigest(entries), count: entries.length, repo, extended, missing, unrecorded };
}

/** "13 golden(s) (11 in-repo, 2 extended)" */
function setText(set) {
  return `${set.count} golden(s) (${set.repo} in-repo, ${set.extended} extended)`;
}

/** Problems with FEED_PARSE_VERSION against the goldens on disk; empty = consistent. */
function versionProblems(version, set) {
  const v = splitVersion(version);
  const want = `${v.semver}+${set.digest}`;
  const problems = [];
  if (set.missing.length) problems.push(`golden(s) with no outputDigest (record them with --update): ${set.missing.join(', ')}`);
  if (!v.wellFormed) {
    problems.push(`FEED_PARSE_VERSION ${JSON.stringify(version)} is not <semver>+<golden-set digest> (DET-10)`);
  } else if (!v.digest) {
    problems.push(`FEED_PARSE_VERSION ${version} carries no golden-set digest; DET-10 needs ${want} (--update writes it)`);
  } else if (v.digest !== set.digest) {
    problems.push(`the goldens' digest is ${set.digest}, FEED_PARSE_VERSION says ${v.digest}: golden output changed without a version change (DET-10). Bump the semver in ${VERSION_FILE} and run --update.`);
  }
  return problems;
}

const DECLARATION_RE = /(export\s+const\s+FEED_PARSE_VERSION\s*(?::\s*string\s*)?=\s*)(['"])([^'"\r\n]*)\2/;

/** Rewrites the FEED_PARSE_VERSION literal in version.ts. Returns null on success, else why not. */
function rewriteVersionFile(deps, next) {
  const file = path.join(deps.repoRoot, VERSION_FILE);
  if (!deps.fs.existsSync(file)) return `${VERSION_FILE} does not exist`;
  const text = deps.fs.readFileSync(file, 'utf8');
  if (!DECLARATION_RE.test(text)) return `no FEED_PARSE_VERSION literal in ${VERSION_FILE}`;
  deps.fs.writeFileSync(file, text.replace(DECLARATION_RE, (_m, head, q) => `${head}${q}${next}${q}`));
  return null;
}

// ---------------------------------------------------------------------------
// replay
// ---------------------------------------------------------------------------

const maskOf = (protocol) => [...(compare.MASKED_FIELDS[protocol] || [])];

function selectCorpora(opts, deps) {
  const inRepo = corpora.listCorpora(deps.fs, deps.repoRoot);
  if (!inRepo.length) throw new Error('no corpora under ' + corpora.CORPORA_DIR + '; a gate over nothing would pass vacuously');
  const extended = corpora.listExtended(deps.fs, deps.repoRoot);
  const extDir = corpora.extendedSourceDir(deps.env, deps.repoRoot, opts.extendedDir);
  const extPresent = !opts.noExtended && deps.fs.existsSync(extDir);
  const known = [...inRepo, ...extended];
  for (const id of opts.corpus) if (!known.includes(id)) throw new UsageError('no corpus "' + id + '" (have: ' + known.join(', ') + ')');
  const pick = (ids) => (opts.corpus.length ? ids.filter((id) => opts.corpus.includes(id)) : ids);
  const repoIds = pick(inRepo);
  const extIds = pick(extended);
  if (extIds.length && !extPresent && opts.corpus.length) {
    throw new UsageError(`extended corpus ${extIds.join(', ')} reads its source from ${extDir}, which ${opts.noExtended ? 'is skipped (--no-extended)' : 'does not exist'}`);
  }
  const extendedState = !extended.length ? 'none' : opts.noExtended ? 'skipped' : extPresent ? 'run' : 'absent';
  return {
    repoIds,
    extIds: extPresent ? extIds : [],
    extDir,
    extendedState,
    extendedTotal: extended.length,
    partial: opts.corpus.length > 0,
    total: inRepo.length,
  };
}

async function replaySelected(opts, deps, { emit = false } = {}) {
  const selection = selectCorpora(opts, deps);
  const loaded = [
    ...selection.repoIds.map((id) => corpora.loadCorpus(deps.fs, deps.repoRoot, id)),
    ...selection.extIds.map((id) => corpora.loadCorpus(deps.fs, deps.repoRoot, id, { extended: true, extendedDir: selection.extDir })),
  ];
  const harness = deps.loadHarness();
  const version = harness.feedParseVersion();
  const inputs = loaded.map((corpus) => ({
    ...corpora.replayInput(corpus),
    // the masks apply to the delivery digests and the canonical root; an emit
    // run keeps the in-repo calls unmasked and compares them field by field
    mask: maskOf(corpus.meta.protocol),
    keepCalls: !corpus.extended,
  }));
  const { outputs, consoleLines } = await harness.replayAll(inputs, { verbose: opts.verbose });
  const items = loaded.map((corpus, n) => ({
    corpus,
    output: outputs[n],
    detected: typeof harness.detectedProtocol === 'function' ? harness.detectedProtocol(corpus) : null,
  }));
  return { selection, version, items, consoleLines, emit };
}

function maskText(mask) {
  return mask.length ? mask.map((f) => compare.fieldName(f)).join(', ') : 'none';
}

function maskSummary() {
  const parts = Object.keys(compare.MASKED_FIELDS).map((p) => compare.PROTOCOL_NAMES[p] + ' ' + maskText(maskOf(p)));
  const none = Object.keys(compare.MASKED_FIELDS).every((p) => !maskOf(p).length);
  return none ? 'masked fields: none (every tuple field is compared, in the buffer and in every delivery)' : 'masked fields: ' + parts.join('; ');
}

function extendedLine(selection) {
  switch (selection.extendedState) {
    case 'run': return `golden-replay-gate: extended corpora: ${selection.extIds.length} run (${selection.extDir})`;
    case 'absent': return `golden-replay-gate: extended corpora: folder absent (${selection.extDir}); ${selection.extendedTotal} not run`;
    case 'skipped': return `golden-replay-gate: extended corpora: skipped (--no-extended); ${selection.extendedTotal} not run`;
    default: return 'golden-replay-gate: extended corpora: none defined';
  }
}

function consoleNote(run, opts, deps) {
  if (!opts.verbose && run.consoleLines.length) {
    deps.log(`golden-replay-gate: the parser wrote ${run.consoleLines.length} console line(s) while replaying (suppressed; --verbose shows them)`);
  }
}

const PROTOCOL_WORDS = { B: 'bridge', C: 'caseview' };

/** detectProtocol's verdict on this corpus, against what the corpus says. Null = fine. */
function detectionProblem(item) {
  if (item.detected === null || item.detected === undefined) return null;
  const { meta, input } = item.corpus;
  const own = PROTOCOL_WORDS[meta.protocol];
  if (meta.legacyMisroute) {
    if (item.detected === own) return `the corpus is marked legacyMisroute, but detectProtocol routes it to ${item.detected} (its own parser): drop the mark`;
    return null;
  }
  if (item.detected === own) return null;
  if (item.detected === 'undecided' && input.bytes === 0) return null;
  return `detectProtocol routes this corpus to ${item.detected}, but it is replayed as ${own}` +
    ' (production would parse it with the other parser: mark it legacyMisroute, or fix detectProtocol)';
}

// ---------------------------------------------------------------------------
// goldens
// ---------------------------------------------------------------------------

/** What the gate compares for one replayed corpus. */
function summarize(item) {
  const { meta, input } = item.corpus;
  const mask = maskOf(meta.protocol);
  const out = item.output;
  const records = compare.lineRecords(out.lineBuffer, mask);
  const buffer = { lines: records.length, sha256: compare.bufferDigest(records) };
  const deliveries = out.deliveryDigest;
  const canonical = out.canonical;
  const duplicateIdChunks = out.duplicateIdChunks || 0;
  const outputDigest = compare.outputDigest({ protocol: meta.protocol, masked: mask, input, buffer, deliveries, canonical, duplicateIdChunks });
  return { mask, records, buffer, deliveries, canonical, duplicateIdChunks, outputDigest };
}

function buildGolden(item, s, semver) {
  const { meta, input } = item.corpus;
  const head = {
    format: item.corpus.extended ? EXTENDED_GOLDEN_FORMAT : GOLDEN_FORMAT,
    corpus: meta.id,
    title: meta.title,
    protocol: meta.protocol,
    origin: meta.origin,
  };
  if (meta.legacyMisroute) head.legacyMisroute = true;
  if (item.corpus.extended) head.source = { type: meta.source.type, file: meta.source.file };
  Object.assign(head, {
    feedParseSemver: semver,
    masked: s.mask,
    input,
    detectedProtocol: item.detected === undefined ? null : item.detected,
    lineCount: s.buffer.lines,
    bufferSha256: s.buffer.sha256,
    deliveries: { calls: s.deliveries.calls, chunks: s.deliveries.chunks, sha256: s.deliveries.sha256 },
    canonical: { pages: s.canonical.pages, root: s.canonical.root },
    duplicateIdChunks: s.duplicateIdChunks,
    outputDigest: s.outputDigest,
  });
  if (item.corpus.extended) {
    // digests and counts only: an extended corpus is a real hearing, and no
    // text, and no digest of a few words, may enter the repo
    head.deliveryBlocks = compare.blockDigests(s.deliveries.perChunk);
    head.canonicalPageDigests = s.canonical.pageDigests;
    return head;
  }
  head.deliveryChunks = s.deliveries.perChunk;
  head.lines = s.records;
  return head;
}

/** Keys whose arrays are written one item per line, so a golden diff reads well in review. */
const LIST_KEYS = ['deliveryChunks', 'deliveryBlocks', 'canonicalPageDigests', 'lines'];

function serializeGolden(golden) {
  const parts = Object.keys(golden).map((key) => {
    const value = golden[key];
    if (LIST_KEYS.includes(key) && Array.isArray(value)) {
      const body = value.length ? '[\n' + value.map((v) => '    ' + JSON.stringify(v)).join(',\n') + '\n  ]' : '[]';
      return `  ${JSON.stringify(key)}: ${body}`;
    }
    return `  ${JSON.stringify(key)}: ${JSON.stringify(value)}`;
  });
  return '{\n' + parts.join(',\n') + '\n}\n';
}

/** { golden } when present and parseable, { missing: true }, or { error }. */
function readGolden(deps, file) {
  if (!deps.fs.existsSync(file)) return { missing: true };
  try {
    const golden = JSON.parse(deps.fs.readFileSync(file, 'utf8'));
    if (!golden || typeof golden !== 'object' || Array.isArray(golden)) return { error: 'not a golden' };
    return { golden };
  } catch (err) {
    return { error: err.message };
  }
}

function rel(deps, file) {
  return path.relative(deps.repoRoot, file).split(path.sep).join('/');
}

// ---------------------------------------------------------------------------
// gate (default mode)
// ---------------------------------------------------------------------------

/** The reasons a golden cannot be compared as-is, beyond output differences. */
function goldenProblems(item, golden, semver, s) {
  const { meta, input } = item.corpus;
  const problems = [];
  const format = item.corpus.extended ? EXTENDED_GOLDEN_FORMAT : GOLDEN_FORMAT;
  if (golden.format !== format) problems.push(`golden format is ${JSON.stringify(golden.format)}, this gate reads ${format}: re-record it (--update --force --corpus ${meta.id})`);
  if (golden.protocol !== meta.protocol) problems.push(`golden was recorded for protocol ${golden.protocol}, the corpus says ${meta.protocol}`);
  if (JSON.stringify(golden.masked) !== JSON.stringify(s.mask)) {
    problems.push(`golden was recorded with ${maskText(golden.masked || [])} masked; the gate now masks ${maskText(s.mask)}. Re-record it (README "Masks").`);
  }
  if (!golden.input || golden.input.sha256 !== input.sha256) {
    const was = golden.input ? `${golden.input.chunks} chunks / ${golden.input.bytes} bytes, sha256 ${String(golden.input.sha256).slice(0, 12)}…` : 'no input digest';
    problems.push(`the corpus input changed since the golden was recorded (golden: ${was}; corpus now: ${input.chunks} chunks / ${input.bytes} bytes, sha256 ${input.sha256.slice(0, 12)}…). Re-record it (--update --force --corpus ${meta.id}).`);
  }
  const stamp = stampOf(golden);
  if (stamp !== semver) {
    problems.push(`golden was recorded under FEED_PARSE_VERSION ${stamp}, the tree says ${semver}: re-record the goldens (--update) in the same commit as the bump.`);
  }
  return problems;
}

/** [6] uniqueness: a failure whatever the golden says. */
function uniquenessProblem(item) {
  const out = item.output;
  if (!out.duplicateIdChunks) return null;
  const first = out.duplicateIds && out.duplicateIds[0];
  return `[6] line ids are not unique: two buffer lines shared an id at ${out.duplicateIdChunks} chunk boundar${out.duplicateIdChunks === 1 ? 'y' : 'ies'}` +
    (first ? `, first after chunk #${first.chunk + 1} (ids ${first.ids.join(', ')})` : '');
}

function checkRepoItem(item, golden, s, opts) {
  const report = [];
  const lineDiffs = compare.diffRecords(golden.lines || [], s.records, s.mask);
  const deliveryDiffs = compare.diffDeliveries(golden.deliveryChunks || [], s.deliveries.perChunk);
  const extra = [];
  if (!deliveryDiffs.length && (!golden.deliveries || golden.deliveries.sha256 !== s.deliveries.sha256)) {
    extra.push(`the delivery stream digest differs (golden ${golden.deliveries ? String(golden.deliveries.sha256).slice(0, 12) : 'none'}…, replay ${s.deliveries.sha256.slice(0, 12)}…) although no chunk does: the golden was edited`);
  }
  const canonicalDiffers = !golden.canonical || golden.canonical.root !== s.canonical.root;
  if (canonicalDiffers && !lineDiffs.length) {
    extra.push(`the canonical root differs (golden ${golden.canonical ? String(golden.canonical.root).slice(0, 12) : 'none'}…, replay ${String(s.canonical.root).slice(0, 12)}…) while every buffer line matches: libs/edge-sync canonical.ts changed the canonical form (DET-10: that needs a FEED_PARSE_VERSION bump)`);
  }
  if (!lineDiffs.length && !deliveryDiffs.length && !extra.length && golden.outputDigest !== s.outputDigest) {
    extra.push(`the output digest differs (golden ${String(golden.outputDigest).slice(0, 12)}…, replay ${s.outputDigest.slice(0, 12)}…): the golden was edited`);
  }
  const summary = [];
  if (lineDiffs.length) summary.push(`${lineDiffs.length} line(s) differ (golden ${(golden.lines || []).length} lines, replay ${s.records.length})`);
  if (deliveryDiffs.length) summary.push(`${deliveryDiffs.length} chunk(s) deliver differently`);
  report.push(...extra.map((e) => '  ' + e));
  if (lineDiffs.length) report.push(...compare.formatDiff(lineDiffs, { limit: opts.all ? Infinity : 25 }));
  if (deliveryDiffs.length) {
    report.push('  deliveries (emitLocal / emitDelivery / savePageData / removeLines, per chunk):');
    const byChunk = new Map((item.output.deliveries || []).map((d) => [d.chunk, d.calls]));
    report.push(...compare.formatDeliveryDiff(deliveryDiffs, (chunk) => byChunk.get(chunk), { limit: opts.all ? Infinity : 10 }));
  }
  return { failed: lineDiffs.length > 0 || deliveryDiffs.length > 0 || extra.length > 0, summary, report };
}

function checkExtendedItem(golden, s) {
  const summary = [];
  if (golden.lineCount !== s.buffer.lines || golden.bufferSha256 !== s.buffer.sha256) {
    summary.push(`the final buffer differs (golden ${golden.lineCount} lines, replay ${s.buffer.lines})`);
  }
  const blocks = compare.blockDigests(s.deliveries.perChunk);
  if (!golden.deliveries || golden.deliveries.sha256 !== s.deliveries.sha256) {
    const at = compare.digestListDifferences(golden.deliveryBlocks || [], blocks);
    const where = at.length ? `, first in chunks ${(blocks[at[0]] || (golden.deliveryBlocks || [])[at[0]] || '?').split(':')[0]}` : '';
    summary.push(`the deliveries differ (golden ${golden.deliveries ? golden.deliveries.calls : '?'} calls, replay ${s.deliveries.calls}; ${at.length} block(s) of ${compare.EXTENDED_BLOCK_CHUNKS} chunks${where})`);
  }
  if (!golden.canonical || golden.canonical.root !== s.canonical.root) {
    const at = compare.digestListDifferences(golden.canonicalPageDigests || [], s.canonical.pageDigests);
    summary.push(`the canonical pages differ (${at.length} of ${Math.max((golden.canonicalPageDigests || []).length, s.canonical.pageDigests.length)} page(s)${at.length ? `, first page ${at[0] + 1}` : ''})`);
  }
  if (!summary.length && golden.outputDigest !== s.outputDigest) summary.push('the output digest differs: the golden was edited');
  return { failed: summary.length > 0, summary, report: [] };
}

async function runGate(opts, deps) {
  const run = await replaySelected(opts, deps);
  const { semver } = splitVersion(run.version);
  const repoCount = run.selection.repoIds.length;
  deps.log(`golden-replay-gate: FEED_PARSE_VERSION ${run.version}; ${repoCount} corpus(es) in the repo${run.selection.partial ? ` of ${run.selection.total} (partial run, not a release check)` : ''}`);
  deps.log(`golden-replay-gate: ${maskSummary()}`);
  deps.log(extendedLine(run.selection));

  let failed = 0;
  let lineTotal = 0;
  let callTotal = 0;
  for (const item of run.items) {
    const { meta, goldenFile } = item.corpus;
    const label = `${meta.id} (${compare.PROTOCOL_NAMES[meta.protocol]}, ${meta.origin}${item.corpus.extended ? ', extended' : ''}${meta.legacyMisroute ? ', legacy misroute' : ''})`;
    const read = readGolden(deps, goldenFile);
    if (read.missing || read.error) {
      failed++;
      deps.error(`FAIL ${label}: ${read.missing ? 'no golden' : 'unreadable golden: ' + read.error} at ${rel(deps, goldenFile)}. Record it with --update --corpus ${meta.id}.`);
      continue;
    }
    const s = summarize(item);
    lineTotal += s.buffer.lines;
    callTotal += s.deliveries.calls;
    const problems = goldenProblems(item, read.golden, semver, s);
    const unique = uniquenessProblem(item);
    if (unique) problems.push(unique);
    const detection = detectionProblem(item);
    if (detection) problems.push(detection);
    const check = item.corpus.extended ? checkExtendedItem(read.golden, s) : checkRepoItem(item, read.golden, s, opts);
    if (!problems.length && !check.failed) {
      deps.log(`PASS ${label}: ${s.buffer.lines} line(s), ${s.deliveries.calls} delivery call(s) in ${s.deliveries.chunks} chunk(s), canonical root ${String(s.canonical.root).slice(0, 12)}…: identical`);
      continue;
    }
    failed++;
    deps.error(`FAIL ${label}: ${check.summary.length ? check.summary.join('; ') : 'output identical'}`);
    for (const p of problems) deps.error('  ' + p);
    for (const line of check.report) deps.error(line);
  }

  const set = goldenSetFromDisk(deps);
  const vProblems = versionProblems(run.version, set);
  if (vProblems.length) {
    failed++;
    deps.error(`FAIL FEED_PARSE_VERSION ${run.version} (DET-10):`);
    for (const p of vProblems) deps.error('  ' + p);
  } else {
    deps.log(`golden-replay-gate: FEED_PARSE_VERSION ${run.version} carries the digest of ${setText(set)} (DET-10)`);
  }
  if (set.unrecorded.length) {
    deps.log(`golden-replay-gate: note: extended corpus(es) with no golden yet, not in the version digest: ${set.unrecorded.join(', ')} (record them where their source folder exists: --update --corpus <id>)`);
  }

  consoleNote(run, opts, deps);
  if (failed) {
    deps.error(`golden-replay-gate: FAIL: ${failed} check(s) failed over ${run.items.length} corpus(es). A release is blocked.`);
    deps.error('  An intended change: bump the semver in FEED_PARSE_VERSION (libs/feed-parse/src/version.ts) and run --update in the same commit.');
    return 1;
  }
  deps.log(`golden-replay-gate: PASS: ${run.items.length} corpus(es), ${lineTotal} line(s), ${callTotal} delivery call(s); every compared field byte-identical, [6] unique.`);
  return 0;
}

// ---------------------------------------------------------------------------
// --update
// ---------------------------------------------------------------------------

function updateStatus(p) {
  if (p.read.missing) return 'recorded (new)';
  if (p.read.error) return 're-recorded (the old golden was unreadable)';
  const old = p.read.golden;
  if (serializeGolden(p.next) === serializeGolden(old)) return 'unchanged';
  const changed = [];
  if (old.format !== p.next.format) changed.push(`format ${old.format} -> ${p.next.format}`);
  if (Array.isArray(old.lines) && Array.isArray(p.next.lines)) {
    const diffs = compare.diffRecords(old.lines, p.next.lines, p.next.masked);
    if (diffs.length) changed.push(`${diffs.length} line(s) differ from the old golden`);
  } else if (old.bufferSha256 !== undefined && old.bufferSha256 !== p.next.bufferSha256) {
    changed.push(`final buffer changed (${old.lineCount} -> ${p.next.lineCount} lines)`);
  }
  if (old.deliveries && old.deliveries.sha256 !== p.next.deliveries.sha256) {
    const d = Array.isArray(old.deliveryChunks) ? compare.diffDeliveries(old.deliveryChunks, p.next.deliveryChunks || []).length : null;
    changed.push(d === null ? 'deliveries changed' : `${d} chunk(s) deliver differently`);
  }
  if (old.canonical && old.canonical.root !== p.next.canonical.root) changed.push('canonical root changed');
  return 're-recorded: ' + (changed.length ? changed.join('; ') : 'output identical, header changed');
}

async function runUpdate(opts, deps) {
  const run = await replaySelected(opts, deps);
  const { semver } = splitVersion(run.version);
  deps.log(extendedLine(run.selection));
  const plan = run.items.map((item) => {
    const s = summarize(item);
    return { item, s, read: readGolden(deps, item.corpus.goldenFile), next: buildGolden(item, s, semver) };
  });

  // Policy: a golden stamped with the tree's own semver is the expectation for
  // that version; replacing it needs a semver bump or --force.
  const blocked = plan.filter((p) => p.read.error || (p.read.golden && stampOf(p.read.golden) === semver));
  if (blocked.length && !opts.force) {
    deps.error(`golden-replay-gate --update: REFUSED: FEED_PARSE_VERSION's semver is still ${semver}, the version these goldens were recorded under:`);
    for (const p of blocked) deps.error(`  ${p.item.corpus.meta.id}: ${p.read.error ? 'unreadable golden (' + p.read.error + ')' : 'stamped ' + stampOf(p.read.golden)}`);
    deps.error('  A parser change that alters the output (the buffer or any delivery) must bump the semver in libs/feed-parse/src/version.ts.');
    deps.error('  To re-record without a bump (a corpus edit, a new mask, a new golden format), add --force. Nothing was written.');
    return 1;
  }

  for (const p of plan) {
    const { meta, goldenFile } = p.item.corpus;
    const status = updateStatus(p);
    deps.fs.writeFileSync(goldenFile, serializeGolden(p.next));
    deps.log(`${meta.id}: ${status} (${p.next.lineCount} lines, ${p.next.deliveries.calls} delivery calls) -> ${rel(deps, goldenFile)}`);
    const unique = uniquenessProblem(p.item);
    if (unique) deps.error(`  warning: ${meta.id}: ${unique}; the gate fails on this until the parser is fixed`);
    const detection = detectionProblem(p.item);
    if (detection) deps.error(`  warning: ${meta.id}: ${detection}`);
  }

  // DET-10: FEED_PARSE_VERSION carries the digest of every committed golden,
  // the extended corpora's included.
  const set = goldenSetFromDisk(deps);
  const next = `${semver}+${set.digest}`;
  consoleNote(run, opts, deps);
  if (set.missing.length) {
    deps.error(`golden-replay-gate --update: golden(s) still unrecorded: ${set.missing.join(', ')}; run --update without --corpus to record them, then the digest in FEED_PARSE_VERSION is complete.`);
  }
  if (!run.selection.partial && run.selection.extendedTotal && run.selection.extendedState !== 'run') {
    deps.error(`golden-replay-gate --update: warning: the ${run.selection.extendedTotal} extended corpus(es) were not re-recorded (${run.selection.extendedState === 'skipped' ? '--no-extended' : 'folder absent: ' + run.selection.extDir}); the version digest keeps their recorded output. A parser change must also be re-recorded where that folder exists, before a release, or the gate fails there.`);
  }
  if (next !== run.version) {
    const why = rewriteVersionFile(deps, next);
    if (why) {
      deps.error(`golden-replay-gate --update: could not write FEED_PARSE_VERSION (${why}); set it to '${next}' by hand.`);
      return 1;
    }
    deps.log(`golden-replay-gate --update: FEED_PARSE_VERSION ${run.version} -> ${next} (${VERSION_FILE}; golden-set digest over ${setText(set)}, DET-10)`);
  } else {
    deps.log(`golden-replay-gate --update: FEED_PARSE_VERSION ${run.version} unchanged (the golden-set digest is the same)`);
  }
  deps.log(`golden-replay-gate --update: ${plan.length} golden(s) written under semver ${semver}. Review the golden diff before committing.`);
  return 0;
}

// ---------------------------------------------------------------------------
// --show-deliveries
// ---------------------------------------------------------------------------

async function runShowDeliveries(opts, deps) {
  const run = await replaySelected(opts, deps);
  const item = run.items[0];
  if (!item) throw new UsageError('no corpus to show');
  if (item.corpus.extended) throw new UsageError('--show-deliveries works on in-repo corpora only (an extended corpus is a real hearing; the gate never prints its text)');
  const chunk = opts.showDeliveries - 1;
  if (chunk >= item.corpus.chunks.length) throw new UsageError(`${item.corpus.meta.id} has ${item.corpus.chunks.length} chunk(s)`);
  const entry = (item.output.deliveries || []).find((d) => d.chunk === chunk);
  const digest = (item.output.deliveryDigest.perChunk || []).find((e) => e.startsWith(`${chunk}:`));
  const read = readGolden(deps, item.corpus.goldenFile);
  const goldenDigest = read.golden && Array.isArray(read.golden.deliveryChunks) ? read.golden.deliveryChunks.find((e) => e.startsWith(`${chunk}:`)) : undefined;
  deps.log(`golden-replay-gate: ${item.corpus.meta.id} chunk #${opts.showDeliveries} under FEED_PARSE_VERSION ${run.version}`);
  deps.log(`  replay digest ${digest || 'none (no calls)'}; golden digest ${goldenDigest || 'none (no calls)'}`);
  for (const line of entry ? compare.describeCalls(entry.calls, Infinity) : ['        nothing']) deps.log(line);
  return 0;
}

// ---------------------------------------------------------------------------
// --emit (internal) and --determinism
// ---------------------------------------------------------------------------

async function runEmit(opts, deps) {
  const startedAt = new Date(deps.now()).toISOString();
  const run = await replaySelected(opts, deps, { emit: true });
  const payload = {
    format: RUN_FORMAT,
    feedParseVersion: run.version,
    pid: deps.pid,
    tz: deps.env.TZ || null,
    startedAt,
    endedAt: new Date(deps.now()).toISOString(),
    extended: run.selection.extendedState,
    corpora: run.items.map((item) => {
      const out = item.output;
      const records = compare.lineRecords(out.lineBuffer, []);
      const base = {
        id: item.corpus.meta.id,
        protocol: item.corpus.meta.protocol,
        duplicateIdChunks: out.duplicateIdChunks || 0,
        canonicalRoot: out.canonical.root,
      };
      // an extended corpus is a real hearing: the run file holds digests, never its text
      if (item.corpus.extended) return { ...base, extended: true, lineDigests: compare.lineFieldDigests(records), deliveryDigests: out.deliveryDigest.perChunk };
      return { ...base, lines: records, deliveries: out.deliveries };
    }),
  };
  deps.fs.writeFileSync(opts.emit, JSON.stringify(payload));
  const lines = payload.corpora.reduce((n, c) => n + (c.lines ? c.lines.length : c.lineDigests.length), 0);
  deps.log(`golden-replay-gate --emit: ${payload.corpora.length} corpus(es), ${lines} line(s) -> ${opts.emit}`);
  return 0;
}

function spawnRun(deps, file, tz, opts, name) {
  const args = [GATE_SCRIPT, '--emit', file];
  for (const id of opts.corpus) args.push('--corpus', id);
  if (opts.extendedDir) args.push('--extended-dir', opts.extendedDir);
  if (opts.noExtended) args.push('--no-extended');
  deps.log(`golden-replay-gate --determinism: run ${name}: a separate node process, TZ=${tz}`);
  const res = deps.exec(args, { TZ: tz });
  if (res.error || res.status !== 0) {
    deps.error(`golden-replay-gate --determinism: run ${name} failed (${res.error || 'exit ' + res.status})`);
    if (res.stdout) deps.error(res.stdout.trimEnd());
    if (res.stderr) deps.error(res.stderr.trimEnd());
    return null;
  }
  const run = JSON.parse(deps.fs.readFileSync(file, 'utf8'));
  if (run.format !== RUN_FORMAT) throw new Error(`run ${name} wrote format ${run.format}`);
  return run;
}

async function runDeterminism(opts, deps) {
  const selection = selectCorpora(opts, deps);
  deps.log(extendedLine(selection));
  const dir = deps.mkdtemp();
  try {
    const a = spawnRun(deps, path.join(dir, 'run-a.json'), DETERMINISM_TZ[0], opts, 'A');
    if (!a) return 1;
    // Start run B in a later wall-clock second than run A ended, so a field
    // read from the clock (HH:mm:ss) cannot match by luck.
    await deps.sleep(1000 - (deps.now() % 1000) + 50);
    const b = spawnRun(deps, path.join(dir, 'run-b.json'), DETERMINISM_TZ[1], opts, 'B');
    if (!b) return 1;
    if (a.pid === b.pid) throw new Error('both runs report the same process id; they were not separate processes');

    deps.log(`  run A: pid ${a.pid}, TZ=${a.tz}, ${a.startedAt} .. ${a.endedAt}`);
    deps.log(`  run B: pid ${b.pid}, TZ=${b.tz}, ${b.startedAt} .. ${b.endedAt}`);
    const result = compare.compareRuns(a, b);
    const verdict = compare.assessDeterminism(result);

    deps.log(`golden-replay-gate --determinism: fields that differ between the two runs (every field of every line and delivery compared; ${maskSummary()}):`);
    const rows = [...verdict.covered.map((r) => ({ ...r, masked: true })), ...verdict.unexpected.map((r) => ({ ...r, masked: false }))]
      .sort((x, y) => (x.protocol < y.protocol ? -1 : x.protocol > y.protocol ? 1 : 0));
    if (!rows.length) deps.log('  none');
    for (const r of rows) {
      const total = result.byProtocol[r.protocol].lines;
      deps.log(`  ${compare.PROTOCOL_NAMES[r.protocol].padEnd(8)} ${compare.fieldKeyName(r.field).padEnd(18)} differs on ${r.lines} of ${total} line(s) in ${r.corpora.join(', ')}` +
        (r.masked ? '   [masked by the gate]' : '   [NOT MASKED]'));
    }
    for (const proto of Object.keys(result.byProtocol).sort()) {
      if (!Object.keys(result.byProtocol[proto].fields).length) {
        deps.log(`  ${compare.PROTOCOL_NAMES[proto].padEnd(8)} every field identical on ${result.byProtocol[proto].lines} line(s), and in every delivery`);
      }
    }
    for (const u of verdict.unobserved) {
      deps.log(`  note: ${compare.PROTOCOL_NAMES[u.protocol]} ${compare.fieldKeyName(u.field)} is masked but was identical in both runs on these corpora`);
    }

    if (verdict.structural.length || verdict.unexpected.length) {
      for (const s of verdict.structural) deps.error('  ' + s);
      deps.error('golden-replay-gate --determinism: FAIL: nondeterminism outside the masked fields. The default gate would compare a field that');
      deps.error('  changes between runs; report it (do not just add it to MASKED_FIELDS) and fix the source.');
      return 1;
    }
    deps.log(`golden-replay-gate --determinism: PASS: ${verdict.covered.length ? 'only masked fields differ' : 'every field identical'} between two separate processes (${a.corpora.length} corpus(es)).`);
    return 0;
  } finally {
    deps.rmdir(dir);
  }
}

// ---------------------------------------------------------------------------

async function main(argv, deps) {
  let opts;
  try {
    opts = parseArgs(argv);
  } catch (err) {
    deps.error('golden-replay-gate: ' + err.message + ' (--help lists the options)');
    return 2;
  }
  if (opts.help) {
    deps.log(USAGE);
    return 0;
  }
  try {
    if (opts.emit) return await runEmit(opts, deps);
    if (opts.determinism) return await runDeterminism(opts, deps);
    if (opts.update) return await runUpdate(opts, deps);
    if (opts.showDeliveries !== null) return await runShowDeliveries(opts, deps);
    return await runGate(opts, deps);
  } catch (err) {
    if (err instanceof UsageError) {
      deps.error('golden-replay-gate: ' + err.message);
      return 2;
    }
    deps.error('golden-replay-gate: FAILED: ' + (err && err.stack ? err.stack : err));
    return 1;
  }
}

const STALLED = 'golden-replay-gate: FAIL: the replay stopped before it finished (work it was waiting on never settled and nothing was left to run). A release is blocked.';

/**
 * The CLI entry (tools/ci/golden-replay-gate.js). It fails closed: the exit
 * code is 1 until main() settles. If main() never settles and the event loop
 * drains (a parser lane awaiting a promise that never settles, outside the
 * harness's per-chunk watchdog), node would otherwise exit 0 with no verdict,
 * and release-edge only blocks on a non-zero exit. `proc` is `process`.
 */
function cli(argv, deps, proc) {
  let settled = false;
  let reported = false;
  proc.exitCode = 1;
  proc.on('beforeExit', () => {
    if (settled || reported) return;
    reported = true; // beforeExit fires again if anything is scheduled; report once
    deps.error(STALLED);
    proc.exitCode = 1;
  });
  return main(argv, deps).then(
    (code) => {
      settled = true;
      proc.exitCode = code;
      return code;
    },
    (err) => {
      settled = true;
      deps.error('golden-replay-gate: ' + (err && err.stack ? err.stack : err));
      proc.exitCode = 1;
      return 1;
    },
  );
}

/** The real side effects. */
function systemDeps(repoRoot) {
  const fs = require('fs');
  const { spawnSync } = require('child_process');
  return {
    repoRoot,
    fs,
    env: process.env,
    pid: process.pid,
    now: () => Date.now(),
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    log: (line) => console.log(line),
    error: (line) => console.error(line),
    loadHarness: () => require('./register-ts').loadHarness(repoRoot),
    exec: (args, env) => {
      const res = spawnSync(process.execPath, args, {
        cwd: repoRoot,
        env: { ...process.env, ...env },
        encoding: 'utf8',
        windowsHide: true,
        maxBuffer: 64 * 1024 * 1024,
      });
      return { status: res.status, stdout: res.stdout || '', stderr: res.stderr || '', error: res.error ? res.error.message : null };
    },
    mkdtemp: () => fs.mkdtempSync(path.join(os.tmpdir(), 'golden-replay-')),
    rmdir: (dir) => fs.rmSync(dir, { recursive: true, force: true }),
  };
}

module.exports = {
  GATE_SCRIPT,
  GOLDEN_FORMAT,
  EXTENDED_GOLDEN_FORMAT,
  VERSION_FILE,
  USAGE,
  parseArgs,
  splitVersion,
  stampOf,
  versionProblems,
  rewriteVersionFile,
  summarize,
  buildGolden,
  serializeGolden,
  goldenProblems,
  detectionProblem,
  main,
  cli,
  STALLED,
  systemDeps,
};
