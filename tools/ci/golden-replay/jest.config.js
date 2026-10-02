'use strict';
/**
 * Jest config for the golden replay gate specs in this folder.
 *
 * The repo's config (package.json "jest") only searches apps/ and libs/, so
 * `npx jest tools/ci/golden-replay` finds nothing. Run these with:
 *
 *   npx jest -c tools/ci/golden-replay/jest.config.js
 *
 * Same settings as the repo's config, rooted here. The gate modules are plain
 * CommonJS, so only the TypeScript specs, the harness and the libs it imports
 * go through ts-jest.
 */
const path = require('path');
const base = require('../../../package.json').jest;

module.exports = {
  ...base,
  rootDir: path.resolve(__dirname, '..', '..', '..'),
  roots: ['<rootDir>/tools/ci/golden-replay/'],
  transform: { '^.+\\.ts$': 'ts-jest' },
};
