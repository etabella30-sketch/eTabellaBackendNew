/**
 * Jest config of the rt-edge END-TO-END suite (apps/rt-edge/e2e/*.e2e-spec.ts). Kept out of the default run: the
 * root config (package.json "jest") only matches `*.spec.ts`, and these files are named `*.e2e-spec.ts`.
 *
 * Run (from anywhere; one command):
 *   node "D:/etabella tech/etabella_backend-tech-rt-edge/node_modules/jest/bin/jest.js" --config "D:/etabella tech/etabella_backend-tech-rt-edge/apps/rt-edge/e2e/jest-e2e.config.js" --maxWorkers=2
 *
 * ts-jest runs transpile-only (isolatedModules): the suite boots the whole box module graph, and a type error in a
 * module the suite does not exercise must not hide the end-to-end result. Type-check the e2e files (and everything
 * they import) separately when editing them:
 *   node "D:/etabella tech/etabella_backend-tech-rt-edge/node_modules/typescript/bin/tsc" -p "D:/etabella tech/etabella_backend-tech-rt-edge/apps/rt-edge/e2e/tsconfig.e2e.json"
 */
const path = require('path');

const root = path.resolve(__dirname, '..', '..', '..');

module.exports = {
    rootDir: root,
    roots: ['<rootDir>/apps/rt-edge/e2e'],
    testRegex: '\\.e2e-spec\\.ts$',
    moduleFileExtensions: ['js', 'json', 'ts'],
    transform: {
        // TypeScript only: plain .js (tools/ci/golden-replay/compare.js) is CommonJS node loads as it is.
        '^.+\\.ts$': ['ts-jest', { isolatedModules: true, diagnostics: false }],
    },
    testEnvironment: 'node',
    moduleNameMapper: {
        '^@app/global(|/.*)$': '<rootDir>/libs/global/src/$1',
        '^@app/feed-parse(|/.*)$': '<rootDir>/libs/feed-parse/src/$1',
        '^@app/edge-sync(|/.*)$': '<rootDir>/libs/edge-sync/src/$1',
        '^@app/rt-ingest(|/.*)$': '<rootDir>/libs/rt-ingest/src/$1',
        '^@app/edge-token(|/.*)$': '<rootDir>/libs/edge-token/src/$1',
        // Phase 1 of the shared-libraries plan (2026-10-06): the box-safe libs the local API host will import.
        '^@app/api-kernel(|/.*)$': '<rootDir>/libs/api-kernel/src/$1',
        '^@app/api-contracts(|/.*)$': '<rootDir>/libs/api-contracts/src/$1',
        '^@app/permissions(|/.*)$': '<rootDir>/libs/permissions/src/$1',
        '^@app/rt-features(|/.*)$': '<rootDir>/libs/rt-features/src/$1',
        '^@app/platform-cloud(|/.*)$': '<rootDir>/libs/platform-cloud/src/$1',
        '^apps/(.*)$': '<rootDir>/apps/$1',
    },
    // One file; its tests run in sequence (one box, one cloud, one transmitter each). Run with --maxWorkers=2 at most:
    // more workers ran this machine out of memory.
    maxWorkers: 2,
    testTimeout: 240_000,
};
