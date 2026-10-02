'use strict';
/**
 * Lets the gate (plain node) load the TypeScript harness and libs/feed-parse
 * the way the repo's test:debug script does: ts-node plus tsconfig-paths, so
 * '@app/feed-parse' resolves as in the apps. transpileOnly: the gate checks
 * parser output, `nest build` checks types, and skipping the type check keeps
 * a gate run to a few seconds. Nothing is written to disk.
 */

const path = require('path');

let registered = false;

function registerTypeScript(repoRoot) {
  if (registered) return;
  const project = path.join(repoRoot, 'tsconfig.json');
  require('ts-node').register({ project, transpileOnly: true });
  const tsconfigPaths = require('tsconfig-paths');
  const config = tsconfigPaths.loadConfig(repoRoot);
  if (config.resultType !== 'success') throw new Error('tsconfig-paths could not read ' + project + ': ' + config.message);
  tsconfigPaths.register({ baseUrl: config.absoluteBaseUrl, paths: config.paths });
  registered = true;
}

/** The replay harness module (replay-harness.ts), compiled on the fly. */
function loadHarness(repoRoot) {
  registerTypeScript(repoRoot);
  return require('./replay-harness');
}

module.exports = { registerTypeScript, loadHarness };
