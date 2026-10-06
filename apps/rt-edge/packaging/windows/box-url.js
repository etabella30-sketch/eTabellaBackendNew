// Prints the address of this box's page, from box.json:
//   plain HTTP (http.tls is null)  ->  http://<this PC's network IP>:<port>   (simple mode: open it from any device in the room)
//   HTTPS (a certificate is set)   ->  https://<box host name>
// Used by run.bat. "node box-url.js --all" lists every network address of this PC.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'box.json'), 'utf8'));
const http = config.http || {};
const plain = http.tls === null;

function lanAddresses() {
  const out = [];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const info of list || []) if (info.family === 'IPv4' && !info.internal) out.push(info.address);
  }
  // Private room networks first (192.168.x, 10.x, 172.16-31.x), then anything else.
  const rank = a => (/^192\.168\./.test(a) ? 0 : /^10\./.test(a) ? 1 : /^172\.(1[6-9]|2\d|3[01])\./.test(a) ? 2 : 3);
  return out.sort((a, b) => rank(a) - rank(b));
}

if (plain) {
  const port = http.port || 4000;
  const suffix = port === 80 ? '' : ':' + port;
  const addresses = lanAddresses();
  if (process.argv.includes('--all')) {
    for (const a of addresses) console.log('http://' + a + suffix);
    console.log('http://localhost' + suffix + '   (this PC only)');
  } else {
    process.stdout.write('http://' + (addresses[0] || 'localhost') + suffix);
  }
} else {
  let host = '';
  try {
    const status = JSON.parse(execFileSync(process.execPath, ['main.js', 'status', '--json', '--config', 'box.json'], { cwd: __dirname, encoding: 'utf8' }));
    host = (status.identity && status.identity.host) || '';
  } catch (e) {
    host = '';
  }
  process.stdout.write(host ? 'https://' + host : '');
}
