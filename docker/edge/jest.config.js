'use strict';
/**
 * Jest config for the venue box deploy specs in this folder (edge-deploy.spec.ts).
 *
 * The repo's config (package.json "jest") only searches apps/ and libs/, so `npx jest docker/edge` finds nothing.
 * Run these with:
 *
 *   npx jest -c docker/edge/jest.config.js
 *
 * Same settings as the repo's config, rooted here. preflight-check.js is plain CommonJS and runs as a child
 * process, so only the TypeScript spec (and the rt-edge files it imports) goes through ts-jest.
 */
const path = require('path');
const base = require('../../package.json').jest;

module.exports = {
  ...base,
  rootDir: path.resolve(__dirname, '..', '..'),
  roots: ['<rootDir>/docker/edge/'],
  transform: { '^.+\\.ts$': 'ts-jest' },
};
