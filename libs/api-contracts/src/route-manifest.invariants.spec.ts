/**
 * manifestInvariants is the gate Phase 3 seeds against, so each rule gets one passing and one failing fixture, and
 * the messages are asserted by their row id prefix: the box and realtime-server manifest specs will print them as
 * they are.
 */
import { manifestInvariants } from './route-manifest.invariants';
import type { RouteManifestRow } from './route-manifest.types';

/** A sound cloud-read relay row; every fixture below overrides one thing. */
const relay = (over: Partial<RouteManifestRow> = {}): RouteManifestRow => ({
  id: 'marknav.all',
  family: 'realtimeapi',
  method: 'GET',
  path: '/realtimeapi/marknav/all',
  liveOwner: 'realtime-server',
  livePath: 'marknav/all',
  boxOwner: 'table',
  boxKind: 'cloud-read',
  cloudPath: 'marknav/all',
  offlineBody: [[], [], []],
  teamScoped: false,
  identity: 'actor',
  ...over,
});

const teamScoped = (over: Partial<RouteManifestRow> = {}): RouteManifestRow => relay({
  id: 'core.myteamusers',
  family: 'coreapi',
  path: '/coreapi/common/myteamusers',
  liveOwner: 'coreapi',
  livePath: 'common/myteamusers',
  cloudPath: 'factsheet/teamusers',
  offlineBody: null,
  teamScoped: true,
  ...over,
});

const useCloud = (over: Partial<RouteManifestRow> = {}): RouteManifestRow => ({
  id: 'core.bundles.list',
  family: 'coreapi',
  method: 'GET',
  path: '/coreapi/bundles/list',
  liveOwner: 'coreapi',
  livePath: 'bundles/list',
  boxOwner: 'use_cloud',
  teamScoped: false,
  identity: 'actor',
  ...over,
});

const local = (over: Partial<RouteManifestRow> = {}): RouteManifestRow => ({
  id: 'session.list',
  family: 'realtimeapi',
  method: 'GET',
  path: '/realtimeapi/session/getSessionsByCaseId',
  liveOwner: 'realtime-server',
  livePath: 'session/getSessionsByCaseId',
  boxOwner: 'table',
  boxKind: 'local',
  teamScoped: false,
  identity: 'actor',
  ...over,
});

describe('libs/api-contracts manifestInvariants', () => {
  it('accepts an empty manifest (Phase 1) and a sound mixed one', () => {
    expect(manifestInvariants([])).toEqual([]);
    expect(manifestInvariants([relay(), teamScoped(), useCloud(), local(), relay({ id: 'fact.insert', method: 'POST', path: '/realtimeapi/fact/insertfact', livePath: 'fact/insertfact', boxKind: 'cloud-write', cloudPath: 'fact/insertfact', offlineBody: undefined })])).toEqual([]);
  });

  it('refuses duplicate and empty ids', () => {
    expect(manifestInvariants([relay(), relay()])).toEqual(['marknav.all: duplicate id', 'marknav.all: duplicate route "realtimeapi GET /realtimeapi/marknav/all"']);
    expect(manifestInvariants([relay({ id: '' })])).toEqual(['<row 0>: empty id']);
  });

  it('refuses two rows on one route of a family, compared case-insensitively like Express', () => {
    const upper = relay({ id: 'marknav.all.upper', path: '/realtimeapi/MARKNAV/all' });
    expect(manifestInvariants([relay(), upper])).toEqual(['marknav.all.upper: duplicate route "realtimeapi GET /realtimeapi/marknav/all"']);
    // the same path under another family or method is a different route
    expect(manifestInvariants([relay(), relay({ id: 'x', family: 'coreapi' }), relay({ id: 'y', method: 'POST', boxKind: 'cloud-write' })])).toEqual([]);
  });

  describe('R5: teamScoped rows', () => {
    it('must be a table row or a controller', () => {
      expect(manifestInvariants([teamScoped({ boxOwner: 'controller' })])).toEqual([]);
      expect(manifestInvariants([teamScoped({ boxOwner: 'use_cloud', boxKind: undefined, cloudPath: undefined })])).toEqual([
        'core.myteamusers: teamScoped row must be a box table row or controller, not "use_cloud"',
        'core.myteamusers: teamScoped row must relay (cloud-read or cloud-write), not "undefined"',
      ]);
      expect(manifestInvariants([teamScoped({ boxOwner: 'edge' })])).toEqual(['core.myteamusers: teamScoped row must be a box table row or controller, not "edge"']);
    });

    it('must relay: cloud-read or cloud-write, never local or local-or-cloud', () => {
      expect(manifestInvariants([teamScoped({ boxKind: 'cloud-write' })])).toEqual([]);
      expect(manifestInvariants([teamScoped({ boxKind: 'local', cloudPath: undefined })])).toEqual(['core.myteamusers: teamScoped row must relay (cloud-read or cloud-write), not "local"']);
      expect(manifestInvariants([teamScoped({ boxKind: 'local-or-cloud' })])).toEqual(['core.myteamusers: teamScoped row must relay (cloud-read or cloud-write), not "local-or-cloud"']);
    });

    it('must write offlineBody null down: an empty list or a missing field is a leak of "[]" offline', () => {
      expect(manifestInvariants([teamScoped({ offlineBody: [] })])).toEqual(['core.myteamusers: teamScoped row must have offlineBody null (503 offline, never [])']);
      expect(manifestInvariants([teamScoped({ offlineBody: undefined })])).toEqual(['core.myteamusers: teamScoped row must have offlineBody null (503 offline, never [])']);
    });
  });

  describe('R6: box ownership', () => {
    it('use_cloud rows carry no boxKind', () => {
      expect(manifestInvariants([useCloud({ boxKind: 'cloud-read', cloudPath: 'bundles/list' })])).toEqual(['core.bundles.list: use_cloud row carries boxKind "cloud-read"']);
    });

    it('table rows need a boxKind, controllers and edge rows may omit it', () => {
      expect(manifestInvariants([local({ boxKind: undefined })])).toEqual(['session.list: table row needs a boxKind']);
      expect(manifestInvariants([local({ boxOwner: 'controller', boxKind: undefined })])).toEqual([]);
      expect(manifestInvariants([local({ id: 'edge.ping', family: 'edge', path: '/edge/ping', liveOwner: 'none', livePath: '', boxOwner: 'edge', boxKind: undefined })])).toEqual([]);
    });

    it('relay kinds need a cloudPath', () => {
      expect(manifestInvariants([relay({ cloudPath: undefined })])).toEqual(['marknav.all: cloud-read row needs a cloudPath']);
      expect(manifestInvariants([relay({ boxKind: 'cloud-write', cloudPath: '' })])).toEqual(['marknav.all: cloud-write row needs a cloudPath']);
      expect(manifestInvariants([relay({ boxKind: 'local-or-cloud', cloudPath: undefined })])).toEqual(['marknav.all: local-or-cloud row needs a cloudPath']);
    });
  });

  describe('R4: identity', () => {
    it('actor+target rows name their target fields; actor rows name none', () => {
      expect(manifestInvariants([relay({ identity: 'actor+target', targetFields: ['nUserid'] })])).toEqual([]);
      expect(manifestInvariants([relay({ identity: 'actor+target' })])).toEqual(['marknav.all: actor+target row names no targetFields']);
      expect(manifestInvariants([relay({ identity: 'actor+target', targetFields: [] })])).toEqual(['marknav.all: actor+target row names no targetFields']);
      expect(manifestInvariants([relay({ targetFields: ['nUserid'] })])).toEqual(['marknav.all: actor row names targetFields [nUserid]; declare identity actor+target']);
    });
  });

  it('reports every violation of every row, not only the first', () => {
    const messages = manifestInvariants([teamScoped({ boxOwner: 'use_cloud', boxKind: 'local', offlineBody: [], identity: 'actor+target' }), relay({ id: 'marknav.all' })]);
    expect(messages.map((m: string) => m.split(':')[0])).toEqual(['core.myteamusers', 'core.myteamusers', 'core.myteamusers', 'core.myteamusers', 'core.myteamusers']);
    expect(messages.length).toBe(5);
    expect(manifestInvariants([relay(), relay(), relay({ identity: 'actor+target' })]).length).toBe(5);
  });
});
