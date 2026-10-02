'use strict';
/**
 * Flag parser shared by release-edge.js and rt-deploy-check.js.
 *
 * `spec` maps each accepted flag to 'flag' (no value) or 'value'. Both
 * "--name value" and "--name=value" work. Keys come back camelCased
 * ("--dry-run" -> dryRun). Unknown flags, a missing value, a flag given
 * twice and positional arguments are usage errors: a release tool must not
 * guess what was meant.
 */

class UsageError extends Error {}

function camel(flag) {
  return flag.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function parseArgs(argv, spec) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const raw = argv[i];
    if (!raw.startsWith('--')) throw new UsageError('unexpected argument: ' + raw);
    const eq = raw.indexOf('=');
    const name = eq === -1 ? raw : raw.slice(0, eq);
    const kind = spec[name];
    if (!kind) throw new UsageError('unknown option: ' + name);
    const key = camel(name);
    if (Object.prototype.hasOwnProperty.call(out, key)) throw new UsageError('option given twice: ' + name);
    if (kind === 'flag') {
      if (eq !== -1) throw new UsageError(name + ' takes no value');
      out[key] = true;
      continue;
    }
    let value;
    if (eq !== -1) {
      value = raw.slice(eq + 1);
    } else {
      value = argv[i + 1];
      if (value === undefined || value.startsWith('--')) throw new UsageError(name + ' needs a value');
      i += 1;
    }
    if (value === '') throw new UsageError(name + ' needs a value');
    out[key] = value;
  }
  return out;
}

module.exports = { parseArgs, UsageError };
