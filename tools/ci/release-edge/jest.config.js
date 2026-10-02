'use strict';
/**
 * Jest config for the release tooling specs in this folder.
 *
 * The repo's config (package.json "jest") only searches apps/ and libs/, so
 * `npx jest tools/ci/release-edge` finds nothing. Run these with:
 *
 *   npx jest -c tools/ci/release-edge/jest.config.js
 *
 * Same settings as the repo's config, rooted here. The tools are plain
 * CommonJS, so only the TypeScript specs (and the libs they import) go
 * through ts-jest.
 */
const path = require('path');
const base = require('../../../package.json').jest;

module.exports = {
  ...base,
  rootDir: path.resolve(__dirname, '..', '..', '..'),
  roots: ['<rootDir>/tools/ci/release-edge/'],
  transform: { '^.+\\.ts$': 'ts-jest' },
};
