/**
 * Turns .env.production (the settings an operator edits) into box.json (what the box program reads).
 *
 * The box program itself takes one JSON file (`main.js --config box.json`). This keeps the legacy RT local habit:
 * settings live in `.env.production`, and box.json is GENERATED from it on every start (realtime.config.js and
 * run.bat call this). Do not edit box.json by hand: the next start overwrites it.
 *
 *   node env-config.js           writes box.json, prints what it set
 *   node env-config.js --check   only checks .env.production, writes nothing
 */
const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(__dirname, '.env.production');
const OUT_FILE = path.join(__dirname, 'box.json');

/** KEY=VALUE lines; `#` starts a note; quotes around a value are dropped. */
function parseEnv(text) {
  const out = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    const hash = value.indexOf(' #');
    if (hash >= 0) value = value.slice(0, hash).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    out[key] = value;
  }
  return out;
}

function build(env) {
  const problems = [];
  const text = (key, fallback) => (env[key] !== undefined && env[key] !== '' ? env[key] : fallback);
  const port = (key, fallback, allowZero) => {
    const n = Number(text(key, String(fallback)));
    if (!Number.isInteger(n) || n < (allowZero ? 0 : 1) || n > 65535) problems.push(`${key} must be a port number (${allowZero ? '0' : '1'}-65535)`);
    return n;
  };
  const oneOf = (key, fallback, allowed) => {
    const value = String(text(key, fallback)).toLowerCase();
    if (!allowed.includes(value)) problems.push(`${key} must be one of: ${allowed.join(', ')}`);
    return value;
  };

  const name = text('BOX_NAME', '');
  if (!name) problems.push('BOX_NAME is required');
  const timeZone = text('TIME_ZONE', '');
  if (!timeZone) problems.push('TIME_ZONE is required (for example Asia/Kolkata)');
  const live = text('LIVE_URL', '');
  if (!/^https:\/\/[^/\s]+$/i.test(live.replace(/\/+$/, ''))) problems.push('LIVE_URL must look like https://etabella.net');

  const https = oneOf('HTTPS', 'off', ['on', 'off']) === 'on';
  const signIn = oneOf('SIGN_IN', 'password', ['password', 'cloud']);
  const settingsAccess = oneOf('SETTINGS_ACCESS', 'super-admin', ['super-admin', 'case-admin']);
  const pagePort = port('PORT', https ? 443 : 4000, false);
  const tcpPort = port('TCP_PORT', 2600, false);
  const consolePort = port('CONSOLE_PORT', 2601, true);
  if (signIn === 'cloud' && !https) problems.push('SIGN_IN=cloud needs HTTPS=on (the etabella.net sign-in only returns to an https address)');
  if (new Set([pagePort, tcpPort, consolePort].filter(Boolean)).size !== [pagePort, tcpPort, consolePort].filter(Boolean).length) {
    problems.push('PORT, TCP_PORT and CONSOLE_PORT must be three different ports');
  }

  const config = {
    $comment: 'GENERATED from .env.production by env-config.js on every start. Edit .env.production, not this file.',
    // "dev" is what allows plain http and a reporter on any network interface of this PC.
    mode: 'dev',
    box: { name, timeZone, signIn, settingsAccess },
    cloud: { origin: live.replace(/\/+$/, '') },
    http: {
      port: pagePort,
      tls: https ? { certFile: text('SSL_CERT', './data/certs/fullchain.pem'), keyFile: text('SSL_KEY', './data/certs/privkey.pem') } : null,
    },
    transmitter: { listenPort: tcpPort },
    console: { port: consolePort },
    paths: { dataDir: text('DATA_DIR', './data'), publicDir: text('PUBLIC_DIR', './public') },
  };
  return { config, problems };
}

/** Reads .env.production and writes box.json. Throws with every problem named when the settings are wrong. */
function apply(options = {}) {
  if (!fs.existsSync(ENV_FILE)) throw new Error('.env.production is missing in ' + __dirname);
  const { config, problems } = build(parseEnv(fs.readFileSync(ENV_FILE, 'utf8')));
  if (problems.length) throw new Error('Fix .env.production:\n  - ' + problems.join('\n  - '));
  if (!options.checkOnly) fs.writeFileSync(OUT_FILE, JSON.stringify(config, null, 2) + '\n');
  return config;
}

module.exports = { apply, build, parseEnv };

if (require.main === module) {
  try {
    const config = apply({ checkOnly: process.argv.includes('--check') });
    const where = config.http.tls ? 'https (certificate), port ' + config.http.port : 'http, port ' + config.http.port;
    console.log(' Settings OK: "' + config.box.name + '", ' + config.cloud.origin + ', page on ' + where + ', sign-in: ' + config.box.signIn + ', reporter port ' + config.transmitter.listenPort);
  } catch (err) {
    console.error(' ' + (err && err.message ? err.message : String(err)));
    process.exit(1);
  }
}
