#!/usr/bin/env node
/**
 * package:box: stage one venue box package from the working trees (Phase 2 of the shared-libraries plan).
 *
 *   npm run package:box                       refuses a tree with uncommitted changes
 *   npm run package:box -- --wip              packages them, stamped "+wip"
 *   npm run package:box -- --smoke            also boots the result once in dist/box-smoke/<version>
 *   node tools/ci/package-box.js --dry-run    prints the checks and the plan only
 *
 * Output: dist/box/<version>/ (main.js, public/, the launcher files, release.json) and dist/box/<version>.zip.
 * Steps, gates and the release.json fields: tools/ci/package-box/core.js. Install order: the packaging README.
 * Which apps a change touched, so the right cloud bundles go up first: node tools/ci/affected.js.
 * Exit 0 = staged, 1 = refused / a gate, build or smoke failed, 2 = usage error.
 */
'use strict';

const path = require('path');
const { main } = require('./package-box/core');
const { systemDeps } = require('./release-edge/system');

main(process.argv.slice(2), systemDeps(path.resolve(__dirname, '..', '..'))).then(
  (code) => { process.exitCode = code; },
  (err) => {
    console.error('package-box: ' + ((err && err.stack) || err));
    process.exitCode = 1;
  },
);
