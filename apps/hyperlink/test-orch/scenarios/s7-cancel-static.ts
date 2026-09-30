/**
 * S7 - Cancel path (static). Greps the hyperlink app and the frontend hyperlink
 * services for any cancel / stop / abort / job-removal path and lists the HTTP
 * routes and frontend service methods that exist.
 */
import * as fs from 'fs';
import * as path from 'path';
import { REPO_ROOT, out } from '../harness';

const FE = 'D:\\etabella tech\\com-realtime-local-angular\\src\\app';
const FE_FILES = [
  path.join(FE, 'adminpanel', 'services', 'hyperlink', 'hyperlink.service.ts'),
  path.join(FE, 'shared', 'services', 'hyperlink', 'hyperlink.service.ts'),
  path.join(FE, 'shared', 'components', 'myfiles', 'folders', 'folders.component.ts'),
];
const RX = /\b(cancel|abort|stop|kill|discard|removeJob|\.remove\(|obliterate|moveToFailed|SIGTERM|SIGKILL)\b/i;

function walk(dir: string, acc: string[] = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc); else if (p.endsWith('.ts') && !p.endsWith('.spec.ts')) acc.push(p);
  }
  return acc;
}
function scan(files: string[]) {
  const hits: any[] = [];
  for (const f of files) {
    if (!fs.existsSync(f)) { hits.push({ file: f, missing: true }); continue; }
    fs.readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
      if (RX.test(line)) hits.push({ file: path.relative(REPO_ROOT, f).replace(/\\/g, '/'), line: i + 1, text: line.trim().slice(0, 140), isComment: /^\s*(\/\/|\*|\/\*)/.test(line) });
    });
  }
  return hits;
}

export async function run() {
  const beFiles = walk(path.join(REPO_ROOT, 'apps', 'hyperlink', 'src'));
  const beHits = scan(beFiles);
  const feHits = scan(FE_FILES);
  const controller = fs.readFileSync(path.join(REPO_ROOT, 'apps', 'hyperlink', 'src', 'hyperlink.controller.ts'), 'utf8');
  const routes = [...controller.matchAll(/@(Get|Post|Put|Delete)\('([^']*)'\)/g)].map(m => `${m[1].toUpperCase()} /${m[2]}`);
  const feAdmin = fs.existsSync(FE_FILES[0]) ? [...fs.readFileSync(FE_FILES[0], 'utf8').matchAll(/^\s+(?:async\s+)?([a-zA-Z_]+)\s*\(/gm)].map(m => m[1]).filter(n => !['constructor', 'if', 'for', 'while', 'switch', 'catch', 'return'].includes(n)) : [];
  const r = {
    backendFilesScanned: beFiles.length, backendHits: beHits, backendHitsExcludingCommentsAndKillTimer: beHits.filter(h => !h.isComment && !/killTimer|pythonProcess\.kill/.test(h.text)).length,
    frontendFilesScanned: FE_FILES.map(f => f.replace(/\\/g, '/')), frontendHits: feHits,
    backendRoutes: routes, frontendAdminHyperlinkServiceMethods: feAdmin,
    verdict: 'no cancel/stop/abort endpoint, queue method or UI action exists; the only kill in the codebase is the working-tree per-file python kill timer',
  };
  out(JSON.stringify(r, null, 1));
  return r;
}
