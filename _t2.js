// Trigger a REAL bundle-A+B case package for the case, then poll to completion.
const fs = require('fs');
const http = require('http');
const jwt = require('jsonwebtoken');
const Redis = require('ioredis');

const env = {};
for (const line of fs.readFileSync('D:/etabella tech/etabella_backend-tech/.env.development', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '');
}

const CASE = 'ba227412-a817-4bbe-a3dc-b60a5e239559';
const SECTION = '716f3dbc-ad45-4d7b-a495-f5ca823528cd';
const BUNDLE_A = '729c4175-4f14-4535-b571-305c6b052e48';
const BUNDLE_B = '2aebddc8-cbc0-4a4b-b740-863dfa39c72f';
const USER = 'db761b9c-c7a8-42a1-9f7b-a9309f24c82f';
const BROWSER = 'link-test-browser';

function post(path, body, headers) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({ host: 'localhost', port: Number(env.PORT_DOWNLOADAPI), path, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), ...headers } },
      (res) => { let b = ''; res.on('data', c => b += c); res.on('end', () => resolve({ status: res.statusCode, body: b })); });
    req.on('error', reject); req.write(data); req.end();
  });
}
function get(path, headers) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: 'localhost', port: Number(env.PORT_DOWNLOADAPI), path, method: 'GET', headers },
      (res) => { let b = ''; res.on('data', c => b += c); res.on('end', () => resolve({ status: res.statusCode, body: b })); });
    req.on('error', reject); req.end();
  });
}

(async () => {
  const redis = new Redis({ host: env.REDIS_IP, port: Number(env.REDIS_PORT), password: env.REDIS_PASSWORD || undefined });
  await redis.set(`user/${USER}`, JSON.stringify({ id: BROWSER, a: true }));
  const token = jwt.sign({ userId: USER, broweserId: BROWSER }, env.JWT_SECRET, { expiresIn: '2h' });
  const auth = { Authorization: `Bearer ${token}` };

  const res = await post('/startdownload', {
    nCaseid: CASE, nSectionid: SECTION,
    jFolders: JSON.stringify([BUNDLE_B]),
    jFiles: '[]', isHyperlink: false,
    jInclude: JSON.stringify({ includes: ['evidence'], folders: [BUNDLE_B] }),
  }, auth);
  console.log('startdownload:', res.status, res.body.slice(0, 200));
  const nDPid = (() => { try { return JSON.parse(res.body).nDPid; } catch { return null; } })();
  if (!nDPid) { console.log('NO nDPid — aborting'); await redis.quit(); process.exit(1); }
  console.log('nDPid:', nDPid);

  // poll getdownload for this job's status
  for (let i = 0; i < 120; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const g = await get(`/getdownload?nCaseid=${CASE}&PageNumber=1&cSortBy=N&nDPid=${nDPid}`, auth);
    let job = null; try { const arr = JSON.parse(g.body); job = Array.isArray(arr) ? arr.find(j => j.nDPid === nDPid) : null; } catch {}
    const st = job?.cStatus;
    process.stdout.write(`  [${i}] status=${st} parts=${job?.completedParts||0}/${job?.totalParts||0} action=${job?.actionStatus||''}\n`);
    if (st === 'C') { console.log('DONE nDPid=' + nDPid); await redis.quit(); process.exit(0); }
    if (st === 'F') { console.log('FAILED'); await redis.quit(); process.exit(1); }
  }
  console.log('timed out'); await redis.quit(); process.exit(1);
})().catch(e => { console.error(e); process.exit(1); });
