import * as fs from 'fs';
import * as path from 'path';
import { createRequire } from 'module';
import { manifestRelayRows, ROUTE_MANIFEST } from '@app/api-contracts';

/*
 * ROUTE_MANIFEST against the rest of the repo (Phase 3 of the shared-libraries plan, 2026-10-06):
 *  - every row's livePath must be a route its live owner mounts and every relay cloudPath a route realtime-server
 *    mounts, both read from the committed route inventories (apps/<app>/src/route-inventory.json, each kept equal to
 *    its live module graph by the app's route-inventory.spec.ts), so a typo or a renamed controller fails here, not
 *    on a box;
 *  - when the Angular repo is checked out beside this one: its generated copy (tools/ci/export-route-manifest.js)
 *    must be current, and every /realtimeapi and /coreapi call of the four RT services (mark-api, issue-api,
 *    transcript-session-api, document-share-api) must be a row, `table` or `use_cloud`. A call missing here reaches
 *    the box as an unknown route (403 use_cloud) and nobody notices until a hearing. The FE unit-test bundle has no
 *    file system, so the source scan lives on this side.
 */

const REPO = path.resolve(__dirname, '..', '..', '..');
const FE_ROOT = path.resolve(REPO, '..', 'eTabella angular 21');
const FE_SERVICES = ['mark-api', 'issue-api', 'transcript-session-api', 'document-share-api'].map((name) => path.join(FE_ROOT, 'src', 'app', 'features', 'evidence', 'services', `${name}.service.ts`));
const requireJs = createRequire(__filename);
const exporter = requireJs(path.join(REPO, 'tools', 'ci', 'export-route-manifest.js'));

/** Which service family a URL base in the FE services names. */
const FAMILY_OF_BASE: Record<string, 'realtimeapi' | 'coreapi'> = {
  'this.realtimeBase': 'realtimeapi',
  'this.realtimeLocalBase': 'realtimeapi',
  'environment.api.realtime': 'realtimeapi',
  'environment.api.realtimeLocal': 'realtimeapi',
  'environment.api.core': 'coreapi',
  'this.coreBase': 'coreapi',
};
/** Helpers the FE services route HTTP through, and the verb each one uses. */
const HELPER_METHOD: Record<string, string> = { markRead: 'GET' };
/** mark-api.service.ts readFactSheetRows(resource) calls `factsheet/${resource}` with these. */
const FACTSHEET_RESOURCES = ['issues', 'contacts', 'links', 'shared', 'tasks'];
/**
 * FE calls to routes NO live app mounts: not manifest rows (the manifest lists real routes), listed here so the scan
 * stays exact. Each entry must still be called by the FE, or it is stale and goes. D11 (2026-10-06): the box table
 * dropped `fact/addhighlight`; the cloud has always answered it 404; the FE method is dead code to remove.
 */
const KNOWN_DEAD_CALLS: Record<string, string> = {
  // 2026-10-06: `POST /realtimeapi/fact/addhighlight` (mark-api.service.ts addFactHighlight, D11) was removed from the FE.
};

interface FeCall { method: string; path: string; where: string }

/** Every `verb(`${base}/path`)` and helper call with a base-rooted template literal in one FE service source. */
export function feCallsIn(file: string): FeCall[] {
  const src = fs.readFileSync(file, 'utf8');
  const out: FeCall[] = [];
  // `verb(`${base}/path`)`, with or without a `?query` inside the literal (the query never names the route).
  const re = /\b(\w+)\s*(?:<[^>]*>)?\(\s*`\$\{(this\.\w+|environment\.api\.\w+)\}\/([^`?]+)(?:\?[^`]*)?`/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    const [, fn, base, rawPath] = m;
    const family = FAMILY_OF_BASE[base];
    if (!family) continue; // a base outside the box's two families (downloadapi, auth, ...)
    const method = ['get', 'post', 'put', 'delete', 'patch'].includes(fn) ? fn.toUpperCase() : HELPER_METHOD[fn];
    if (!method) throw new Error(`${path.basename(file)}: ${fn}() builds a ${family} URL; name its HTTP verb in HELPER_METHOD`);
    const paths = rawPath.includes('${resource}') ? FACTSHEET_RESOURCES.map((r) => rawPath.replace('${resource}', r)) : [rawPath];
    for (const p of paths) out.push({ method, path: `/${family}/${p}`, where: `${path.basename(file)} ${fn}()` });
  }
  return out;
}

function inventory(app: string): Set<string> {
  const file = path.join(REPO, 'apps', app, 'src', 'route-inventory.json');
  const json: { app: string; routes: string[] } = JSON.parse(fs.readFileSync(file, 'utf8'));
  expect(json.app).toBe(app);
  return new Set(json.routes.map((r) => r.toLowerCase()));
}

describe('ROUTE_MANIFEST against the route inventories', () => {
  const inventories: Record<string, Set<string>> = {};
  const mounted = (app: string): Set<string> => (inventories[app] ??= inventory(app));

  it('every row names a live owner with an inventory, and its livePath is mounted there', () => {
    const missing: string[] = [];
    for (const row of ROUTE_MANIFEST) {
      if (row.liveOwner === 'none') continue;
      if (!mounted(row.liveOwner).has(`${row.method} /${row.livePath}`.toLowerCase())) missing.push(`${row.id}: ${row.method} /${row.livePath} not on ${row.liveOwner}`);
    }
    expect(missing).toEqual([]);
  });

  it('every relay cloudPath is a route realtime-server mounts', () => {
    const rs = mounted('realtime-server');
    const missing = manifestRelayRows().filter((row) => !rs.has(`${row.method} /${row.cloudPath}`.toLowerCase())).map((row) => `${row.id}: ${row.method} /${row.cloudPath}`);
    expect(missing).toEqual([]);
  });

  it('the removed fact/addhighlight is mounted nowhere, which is why it left the manifest (D11)', () => {
    expect(mounted('realtime-server').has('post /fact/addhighlight')).toBe(false);
  });
});

describe('the FE copy of the manifest (export-route-manifest.js)', () => {
  const feFile = path.join(FE_ROOT, ...exporter.FE_FILE);
  const feChecked = fs.existsSync(feFile) && FE_SERVICES.every((f) => fs.existsSync(f));
  const whenFe = feChecked ? it : it.skip;

  it('exports the FE-relevant fields only, deterministically, as a typed module', () => {
    const rows = exporter.manifestRows(ROUTE_MANIFEST);
    expect(rows).toHaveLength(ROUTE_MANIFEST.length);
    for (const row of rows) {
      expect(Object.keys(row).every((k: string) => exporter.FIELDS.includes(k))).toBe(true);
      expect(row).not.toHaveProperty('note');
      expect(row).not.toHaveProperty('offlineBody');
    }
    const text = exporter.render(ROUTE_MANIFEST);
    expect(text).toBe(exporter.render(ROUTE_MANIFEST));
    expect(text).toContain('export const RT_ROUTE_MANIFEST: readonly RtRouteManifestRow[] = Object.freeze([');
    expect(text).toContain('export interface RtRouteManifestRow');
  });

  whenFe('is current in the Angular checkout beside this repo (run the export and commit it when this fails)', () => {
    expect(fs.readFileSync(feFile, 'utf8')).toBe(exporter.render(ROUTE_MANIFEST));
  });

  whenFe('every /realtimeapi and /coreapi call of the four RT services is a manifest row (table or use_cloud), or a known dead call', () => {
    const known = new Set(ROUTE_MANIFEST.map((row) => `${row.method} ${row.path}`.toLowerCase()));
    const dead = new Set(Object.keys(KNOWN_DEAD_CALLS).map((k) => k.toLowerCase()));
    const calls = FE_SERVICES.flatMap(feCallsIn);
    expect(calls.length).toBeGreaterThan(40);
    const keys = new Set(calls.map((c) => `${c.method} ${c.path}`.toLowerCase()));
    const missing = calls.filter((c) => !known.has(`${c.method} ${c.path}`.toLowerCase()) && !dead.has(`${c.method} ${c.path}`.toLowerCase())).map((c) => `${c.method} ${c.path} (${c.where})`);
    expect(missing).toEqual([]);
    // A dead call the FE no longer makes is a stale entry: delete it here.
    for (const k of Object.keys(KNOWN_DEAD_CALLS)) expect([k, keys.has(k.toLowerCase())]).toEqual([k, true]);
    // And a dead call must never be a manifest row (the manifest lists routes that exist).
    for (const k of Object.keys(KNOWN_DEAD_CALLS)) expect([k, known.has(k.toLowerCase())]).toEqual([k, false]);
  });

  it('the FE scanner reads verbs, generic verbs, helpers and the factsheet resource template, and ignores other bases', () => {
    const sample = path.join(REPO, 'dist', 'guard-scan-sample.service.ts');
    fs.mkdirSync(path.dirname(sample), { recursive: true });
    fs.writeFileSync(sample, [
      'this.http.get<unknown>(`${this.realtimeBase}/session/activesession`, { params })',
      "this.http.post(`${environment.api.core}/comments/add`, body)",
      'this.markRead(`${this.realtimeBase}/marknav/all`, params, options)',
      'this.http.get<unknown>(`${this.realtimeBase}/factsheet/${resource}`, { params })',
      'this.http.get(`${environment.api.downloadapi}/jobs?x=1`)',
      'this.http.delete<unknown>(`${this.realtimeLocalBase}/issue/deleteIssue?nIid=${id}`)',
    ].join('\n'));
    try {
      expect(feCallsIn(sample).map((c) => `${c.method} ${c.path}`)).toEqual([
        'GET /realtimeapi/session/activesession',
        'POST /coreapi/comments/add',
        'GET /realtimeapi/marknav/all',
        ...FACTSHEET_RESOURCES.map((r) => `GET /realtimeapi/factsheet/${r}`),
        'DELETE /realtimeapi/issue/deleteIssue',
      ]);
    } finally {
      fs.rmSync(sample, { force: true });
    }
  });
});
