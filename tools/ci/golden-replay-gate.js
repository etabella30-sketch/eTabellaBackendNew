#!/usr/bin/env node
/**
 * golden-replay-gate: the parser's regression gate (plan R-T1 / D13, spec
 * §6.3 RC-1, §6.1 DET-10).
 *
 * Replays every corpus under tools/ci/golden-replay/corpora/ (real Eclipse
 * Bridge captures and synthetic Bridge / CaseView streams) and, when their
 * source folder exists, the extended corpora under tools/ci/golden-replay/
 * extended/ (real hearings read in place from ../tcp-server-main), through
 * the real libs/feed-parse services, chunk by chunk. Per corpus it diffs
 * against golden.json: the final line tuples, everything the parser
 * delivered (per chunk), the canonical root and [6] uniqueness; and it checks
 * that FEED_PARSE_VERSION carries the goldens' digest. No field is masked
 * since FEED_PARSE_VERSION 1.1.0 (MASKED_FIELDS in golden-replay/compare.js).
 *
 * Run from anywhere:
 *   node tools/ci/golden-replay-gate.js                  gate (release-edge runs this before tagging)
 *   node tools/ci/golden-replay-gate.js --determinism    two separate processes, every field compared
 *   node tools/ci/golden-replay-gate.js --update         re-record goldens and the version digest (needs a semver bump, or --force)
 *
 * Exit 0 = every corpus matches, 1 = a difference, a refusal, an error or a
 * replay that stalled (a blocked release), 2 = usage error. The exit code is
 * 1 until the gate reaches a verdict (cli in golden-replay/gate.js). Details:
 * tools/ci/golden-replay/README.md.
 */
'use strict';

const path = require('path');
const { cli, systemDeps } = require('./golden-replay/gate');

cli(process.argv.slice(2), systemDeps(path.resolve(__dirname, '..', '..')), process);
