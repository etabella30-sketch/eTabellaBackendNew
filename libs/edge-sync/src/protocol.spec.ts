import {
  ACK_TIMEOUT_MS,
  CATCH_UP_ROUND_PAGES,
  EDGE_FMT,
  EDGE_PROTO,
  EDGE_PROTO_MIN_SUPPORTED,
  EdgeEvent,
  INFO_INCIDENTS,
  MAX_PART_BYTES,
  MAX_SOCKET_BUFFER_BYTES,
  PHASE4_ONLY,
  ROUND_STAGE_TTL_MS,
  SHRINK_GUARD,
  STATUS_INTERVAL_MS,
  SUPPORTED_FMTS,
  ViewerEventType,
  WARNING_INCIDENTS,
  cloudSupportsProto,
  incidentLevel,
  isPhase4Only,
  isWarningIncident,
  negotiateProto,
} from './protocol';

describe('edge protocol constants and helpers (spec §5.3, §5.4)', () => {
  it('speaks protocol 1 and page format 1', () => {
    expect(EDGE_PROTO).toBe(1);
    expect(EDGE_PROTO_MIN_SUPPORTED).toBe(1);
    expect(EDGE_FMT).toBe(1);
    expect(SUPPORTED_FMTS).toEqual([1]);
    expect(Object.isFrozen(SUPPORTED_FMTS)).toBe(true);
  });

  it('pins the spec limits', () => {
    expect(MAX_PART_BYTES).toBe(256 * 1024);
    expect(MAX_SOCKET_BUFFER_BYTES).toBe(1_000_000);
    expect(ACK_TIMEOUT_MS).toBe(15_000);
    expect(ROUND_STAGE_TTL_MS).toBe(60_000);
    expect(STATUS_INTERVAL_MS).toBe(5_000);
    expect(SHRINK_GUARD).toEqual({ maxLines: 500, maxFraction: 0.05 });
    expect(CATCH_UP_ROUND_PAGES).toBe(8);
  });

  it('the cloud accepts N and N-1 (never below 1)', () => {
    expect(cloudSupportsProto(EDGE_PROTO)).toBe(true);
    expect(cloudSupportsProto(EDGE_PROTO + 1)).toBe(false);
    expect(cloudSupportsProto(0)).toBe(false);
    expect(cloudSupportsProto(1.5)).toBe(false);
    expect(cloudSupportsProto(EDGE_PROTO_MIN_SUPPORTED)).toBe(true);
  });

  it('negotiates the highest common version', () => {
    expect(negotiateProto(1, 1)).toBe(1);
    expect(negotiateProto(3, 1)).toBe(1); // a newer box that still speaks 1
    expect(negotiateProto(3)).toBeNull(); // a newer box that does not
    expect(negotiateProto(0, 0)).toBeNull();
    expect(negotiateProto(2, 3)).toBeNull(); // nonsense range
    expect(negotiateProto(NaN, 1)).toBeNull();
  });

  it('names every §5.4 event', () => {
    expect(Object.values(EdgeEvent).sort()).toEqual(
      ['c.assign', 'c.cmd', 'c.need', 'e.capture', 'e.drained', 'e.hello', 'e.outbox', 'e.pagespull', 'e.raw', 'e.rawpull', 'e.ready', 'e.round', 'e.seal', 'e.status'].sort(),
    );
    expect(ViewerEventType).toEqual({ feedShrink: 'feed-shrink', feedResync: 'feed-resync', edgeSessionReady: 'edge-session-ready' });
  });

  it('marks the Phase-4-only items of rev 3 (D1): REBASE, pagespull, switch', () => {
    expect(PHASE4_ONLY.events).toEqual(['e.pagespull', 'e.drained', 'e.outbox']);
    expect(PHASE4_ONLY.helloVerdicts).toEqual(['rebase', 'fenced']);
    expect(PHASE4_ONLY.assignOps).toEqual(['drain', 'fence']);
    expect(PHASE4_ONLY.restRoutes).toEqual(['session/edge/switch']);
    expect(PHASE4_ONLY.incidents).toEqual(['SWITCH_UNDRAINED']);
    for (const name of ['e.pagespull', 'rebase', 'fenced', 'drain', 'fence', 'session/edge/switch', 'SWITCH_UNDRAINED']) {
      expect(isPhase4Only(name)).toBe(true);
    }
    for (const name of ['e.hello', 'e.round', 'e.seal', 'continue', 'frozen', 'upsert', 'end', 'ABORTED_WINDOW']) {
      expect(isPhase4Only(name)).toBe(false);
    }
  });

  it('classifies incidents (§4.1)', () => {
    expect(WARNING_INCIDENTS).toHaveLength(10);
    expect(INFO_INCIDENTS).toEqual(['CAT_DISCONNECT', 'TAIL_TRUNCATED', 'LOCKOUT']);
    expect(incidentLevel('ABORTED_WINDOW')).toBe('warning');
    expect(incidentLevel('LOCKOUT')).toBe('info');
    expect(incidentLevel('SOMETHING_NEW')).toBe('warning');
    expect(isWarningIncident({ kind: 'CAT_DISCONNECT' })).toBe(false);
    expect(isWarningIncident({ kind: 'CAT_DISCONNECT', level: 'warning' })).toBe(true); // G0 may upgrade it
    expect(isWarningIncident({ kind: 'AUDIT_MISMATCH', level: 'warning' })).toBe(true);
  });
});
