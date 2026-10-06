import * as fs from 'fs';
import * as path from 'path';
import { manifestRelayRows } from '@app/api-contracts';

import { EDGE_TOKEN_ROUTES, isEdgeTokenRoute } from './middleware/realtime-edge-token';

/*
 * Phase 3 of the shared-libraries plan (2026-10-06): the edge-token allowlist is derived from ROUTE_MANIFEST. This
 * spec pins what that gives today (the 34 hand-written entries of 2026-10-06 minus `POST fact/addhighlight`, D11:
 * no controller here ever declared it) and checks that every allowlisted path is a route this app mounts, read from
 * the committed route inventory (route-inventory.json, kept equal to the live module graph by route-inventory.spec.ts).
 * A relay row whose cloud path is not mounted would make the box forward requests into a 404.
 */

const SNAPSHOT_2026_10_06 = [
  'GET session/activesession/detail',
  'GET session/realtimedatabysesid',
  'GET feed/pages/total',
  'GET feed/pages/data',
  'GET marknav/all',
  'GET marknav/quickmarklist',
  'GET feed/annotations',
  'GET doclink/docdetail',
  'GET issue/issuelist_V2',
  'GET factsheet/detail',
  'GET factsheet/issues',
  'GET factsheet/contacts',
  'GET factsheet/links',
  'GET factsheet/shared',
  'GET factsheet/tasks',
  'GET factsheet/teamusers',
  'GET issue/dynamiccombo',
  'POST fact/insertHighlights',
  'POST fact/deleteHighlights',
  'POST fact/insertquickfact',
  'POST fact/quickfactupdate',
  'POST fact/insertfact',
  'POST factsheet/save',
  'POST factsheet/delete',
  'POST doclink/insertdoc',
  'POST doclink/docdelete',
  'PUT issue/updateIssue',
  'POST issue/insertIssue',
  'DELETE issue/deleteIssue',
  'DELETE issue/delete/multi/issue',
  'POST issue/insertCategory',
  'POST issue/qfact/sequence',
  'POST issue/qfact/claim/sequence',
  'PUT issue/updateClaimDetail',
];

const inventory: { app: string; routes: string[] } = JSON.parse(fs.readFileSync(path.join(__dirname, 'route-inventory.json'), 'utf8'));
const mounted = new Set(inventory.routes.map((r) => r.toLowerCase()));

describe('realtime-server EDGE_TOKEN_ROUTES from ROUTE_MANIFEST', () => {
  it('is the 2026-10-06 allowlist minus fact/addhighlight (D11) plus issue/dynamiccombo (Phase 10, the code tables), as a set (the middleware matches on a Set; the order is the manifest\'s)', () => {
    expect([...EDGE_TOKEN_ROUTES.map((r) => `${r.method} ${r.path}`)].sort()).toEqual([...SNAPSHOT_2026_10_06].sort());
    expect(EDGE_TOKEN_ROUTES).toHaveLength(34);
    expect(new Set(EDGE_TOKEN_ROUTES.map((r) => `${r.method} ${r.path.toLowerCase()}`)).size).toBe(34);
  });

  it('is exactly the relay rows of the manifest', () => {
    expect(EDGE_TOKEN_ROUTES.map((r) => `${r.method} ${r.path}`)).toEqual(manifestRelayRows().map((r) => `${r.method} ${r.cloudPath}`));
  });

  it('every allowlisted path is a route this app mounts (route-inventory.json)', () => {
    expect(inventory.app).toBe('realtime-server');
    const missing = EDGE_TOKEN_ROUTES.filter((r) => !mounted.has(`${r.method} /${r.path}`.toLowerCase())).map((r) => `${r.method} /${r.path}`);
    expect(missing).toEqual([]);
  });

  it('isEdgeTokenRoute accepts each allowlisted route and refuses the removed one', () => {
    for (const r of EDGE_TOKEN_ROUTES) expect([r.method, r.path, isEdgeTokenRoute(r.method, '/' + r.path)]).toEqual([r.method, r.path, true]);
    expect(isEdgeTokenRoute('POST', '/fact/addhighlight')).toBe(false);
  });
});
