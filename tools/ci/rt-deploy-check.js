#!/usr/bin/env node
/**
 * rt-deploy-check: refuse a cloud deploy whose parser version differs from
 * any live venue box session (plan R-SC1 / D6; lives in tools/ci per D5).
 *
 * Run before every cloud deploy of realtime-server:
 *   node tools/ci/rt-deploy-check.js --manifest dist/release/<tag>/manifest.json --pg env:RT_DEPLOY_CHECK_PG
 *   node tools/ci/rt-deploy-check.js --version-file libs/feed-parse/src/version.ts --sessions-file live.json
 *
 * Exit 0 = pass (or no venue sessions schema yet, printed as a loud notice),
 * 1 = refused (the mismatched sessions are listed), 2 = usage or input
 * error (the check could not be made; treat as refused).
 * Details: tools/ci/release-edge/README.md.
 */
'use strict';

const path = require('path');
const { main } = require('./release-edge/deploy-check');
const { systemDeps } = require('./release-edge/system');

main(process.argv.slice(2), systemDeps(path.resolve(__dirname, '..', '..'))).then(
  (code) => {
    process.exitCode = code;
  },
  (err) => {
    console.error('rt-deploy-check: ' + (err && err.message ? err.message : err));
    process.exitCode = 2;
  },
);
