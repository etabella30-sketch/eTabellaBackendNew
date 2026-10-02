#!/usr/bin/env node
/**
 * release-edge: build and record one venue box release (plan R-SC1 / D6).
 *
 * Run from a clean checkout whose HEAD is an annotated tag:
 *   node tools/ci/release-edge.js --fe <path to the Angular repo> --dry-run
 *   node tools/ci/release-edge.js --fe <path to the Angular repo> [--allow-missing] [--push]
 *
 * It refuses a dirty backend or FE tree, an untagged HEAD and a missing
 * golden replay gate; runs tools/ci/golden-replay-gate.js (a non-zero exit
 * blocks the release, D13); builds the FE edge bundle and the rt-edge image;
 * writes dist/release/<tag>/manifest.json (backend commit, FE commit,
 * FEED_PARSE_VERSION); and pushes to $REGISTRY only with --push.
 *
 * Steps and the manifest format: tools/ci/release-edge/README.md.
 * Exit 0 = released, 1 = refused / blocked / failed, 2 = usage error.
 */
'use strict';

const path = require('path');
const { main } = require('./release-edge/release');
const { systemDeps } = require('./release-edge/system');

process.exitCode = main(process.argv.slice(2), systemDeps(path.resolve(__dirname, '..', '..')));
