/**
 * The manifest itself: sound under manifestInvariants, frozen (no host can patch a row at runtime and make the box
 * table and the cloud allowlist disagree), and shaped the way the two derivations and the FE export expect. The
 * checks against the apps' route inventories live beside the apps (apps/realtime-server/src/route-manifest.spec.ts,
 * tools/ci/guards/route-manifest.spec.ts): this lib never imports apps/.
 */
import { manifestBoxRows, manifestRelayRows, manifestTableRows, ROUTE_MANIFEST } from './route-manifest';
import { manifestInvariants } from './route-manifest.invariants';
import type { RouteManifestRow } from './route-manifest.types';

const byId = (id: string): RouteManifestRow => ROUTE_MANIFEST.find((row) => row.id === id)!;

describe('libs/api-contracts ROUTE_MANIFEST', () => {
  it('satisfies every manifest invariant', () => {
    expect(manifestInvariants(ROUTE_MANIFEST)).toEqual([]);
  });

  it('is frozen, row by row, bodies included', () => {
    expect(Object.isFrozen(ROUTE_MANIFEST)).toBe(true);
    expect(() => (ROUTE_MANIFEST as unknown[]).push({})).toThrow();
    for (const row of ROUTE_MANIFEST) {
      expect(Object.isFrozen(row)).toBe(true);
      if (row.offlineBody) expect([row.id, Object.isFrozen(row.offlineBody)]).toEqual([row.id, true]);
      if (row.localBody) expect([row.id, Object.isFrozen(row.localBody)]).toEqual([row.id, true]);
      if (row.targetFields) expect([row.id, Object.isFrozen(row.targetFields)]).toEqual([row.id, true]);
    }
  });

  it('every row id is unique and non-empty, every row has a note', () => {
    const ids = ROUTE_MANIFEST.map((row) => row.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id: string) => id.length > 0)).toBe(true);
    for (const row of ROUTE_MANIFEST) expect([row.id, row.note.length > 10]).toEqual([row.id, true]);
  });

  it('seeds the 2026-10-06 tables: 42 box rows (43 minus fact.highlight, D11) relaying 33 cloud paths, plus the use_cloud rows the RT services call', () => {
    expect(manifestBoxRows()).toHaveLength(42);
    // Phase 5: the team-users row is the first served by a shared controller on the box; 41 stay in the table.
    expect(manifestTableRows()).toHaveLength(41);
    expect(ROUTE_MANIFEST.filter((row) => row.boxOwner === 'controller').map((row) => row.id)).toEqual(['core.myteamusers']);
    expect(manifestRelayRows()).toHaveLength(33);
    expect(ROUTE_MANIFEST.filter((row) => row.boxOwner === 'use_cloud')).toHaveLength(17);
    expect(ROUTE_MANIFEST.filter((row) => row.boxOwner === 'edge')).toEqual([]);
    expect(ROUTE_MANIFEST.some((row) => /addhighlight/i.test(row.path) || /addhighlight/i.test(row.cloudPath ?? ''))).toBe(false);
  });

  it('paths carry the family prefix as the FE calls them; livePath is the live owner\'s own spelling; the box serves only realtimeapi and coreapi', () => {
    for (const row of ROUTE_MANIFEST) {
      expect([row.id, row.path.startsWith('/' + row.family + '/')]).toEqual([row.id, true]);
      expect([row.id, row.livePath.startsWith('/'), row.livePath.length > 0]).toEqual([row.id, false, true]);
      expect([row.id, row.family === 'realtimeapi' ? 'realtime-server' : row.family === 'coreapi' ? 'coreapi' : row.liveOwner]).toEqual([row.id, row.liveOwner]);
      expect([row.id, row.legacyShape]).toEqual([row.id, row.liveOwner]);
      // The FE may spell a path in another case (fact/inserthighlights); the live owner declares it once.
      if (row.boxOwner === 'table') expect([row.id, ['realtimeapi', 'coreapi'].includes(row.family)]).toEqual([row.id, true]);
      if (row.cloudPath && row.family === 'realtimeapi') {
        expect([row.id, row.livePath]).toEqual([row.id, row.cloudPath]);
        expect([row.id, row.path.toLowerCase()]).toEqual([row.id, ('/realtimeapi/' + row.cloudPath).toLowerCase()]);
      }
    }
    // The one relay that changes service: the coreapi sharing picker answered by the scoped realtime endpoint.
    expect(byId('core.myteamusers')).toEqual(expect.objectContaining({ family: 'coreapi', livePath: 'common/myteamusers', cloudPath: 'factsheet/teamusers', boxOwner: 'controller', boxKind: 'cloud-read', teamScoped: true, offlineBody: null }));
  });

  it('the box table never serves PATCH; reads are GETs and writes never are', () => {
    for (const row of manifestTableRows()) {
      expect([row.id, row.method === 'PATCH']).toEqual([row.id, false]);
      if (row.boxKind === 'cloud-write') expect([row.id, row.method === 'GET']).toEqual([row.id, false]);
      else expect([row.id, row.method]).toEqual([row.id, 'GET']);
    }
  });

  it('R5 today: the team-scoped rows are exactly the Full Fact reads and the team-users lookup, each with offlineBody null', () => {
    expect(ROUTE_MANIFEST.filter((row) => row.teamScoped).map((row) => row.id).sort()).toEqual([
      'core.myteamusers',
      'factsheet.contacts',
      'factsheet.detail',
      'factsheet.issues',
      'factsheet.links',
      'factsheet.shared',
      'factsheet.tasks',
    ]);
  });

  it('R4 today: the rows whose body names other users are the four jUsers writes', () => {
    expect(ROUTE_MANIFEST.filter((row) => row.identity === 'actor+target').map((row) => [row.id, row.targetFields])).toEqual([
      ['fact.qfact.insert', ['jUsers']],
      ['fact.insert', ['jUsers']],
      ['factsheet.save', ['jUsers']],
      ['doclink.insert', ['jUsers']],
    ]);
  });

  it('offline answers: the mock\'s empty cursors for the mark lists, none (503) for Full Fact details and sharing recipients', () => {
    const offline = Object.fromEntries(ROUTE_MANIFEST.filter((row) => row.boxKind === 'cloud-read').map((row) => [row.id, row.offlineBody]));
    expect(offline).toEqual({
      'marknav.all': [[], [], []],
      'marknav.quickmarks': [],
      'feed.annotations': [[], [], []],
      'doclink.detail': [],
      'issue.list': [[], []],
      'factsheet.detail': null,
      'factsheet.issues': null,
      'factsheet.contacts': null,
      'factsheet.links': null,
      'factsheet.shared': null,
      'factsheet.tasks': null,
      'core.myteamusers': null,
    });
    expect(ROUTE_MANIFEST.filter((row) => row.localBody !== undefined).map((row) => row.id)).toEqual(['core.getcode', 'core.contacts', 'core.tasks', 'core.comments', 'core.annotations']);
  });
});
