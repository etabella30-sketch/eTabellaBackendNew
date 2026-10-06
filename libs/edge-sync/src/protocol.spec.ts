import {
  ACK_TIMEOUT_MS,
  CATCH_UP_ROUND_PAGES,
  C_MARKS_MAX_USERS,
  EDGE_FMT,
  EDGE_PROTO,
  EDGE_PROTO_MIN_SUPPORTED,
  EdgeEvent,
  INFO_INCIDENTS,
  MARK_KINDS,
  MARKS_CHANGED_EVENT,
  MAX_PART_BYTES,
  MAX_SOCKET_BUFFER_BYTES,
  PHASE4_ONLY,
  ROUND_STAGE_TTL_MS,
  SHRINK_GUARD,
  STATUS_INTERVAL_MS,
  SUPPORTED_FMTS,
  ViewerEventType,
  WARNING_INCIDENTS,
  cMarksProblem,
  cloudSupportsProto,
  incidentLevel,
  isPhase4Only,
  isWarningIncident,
  negotiateProto,
  parseCMarks,
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

  it('names every §5.4 event, plus c.marks (live mark sync, user decision 2026-10-05)', () => {
    expect(Object.values(EdgeEvent).sort()).toEqual(
      ['c.assign', 'c.cmd', 'c.marks', 'c.need', 'e.capture', 'e.drained', 'e.hello', 'e.outbox', 'e.pagespull', 'e.raw', 'e.rawpull', 'e.ready', 'e.round', 'e.seal', 'e.status'].sort(),
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

  describe('c.marks: "the marks of a session changed" (cloud → box, no ack; user decision 2026-10-05)', () => {
    const SES = '33333333-3333-4333-8333-333333333333';
    const A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const ok = () => ({ nSesid: SES, users: [A, B], kinds: ['F', 'Q'], atMs: 1_760_000_000_000 });

    it('is a plain cloud → box event: not Phase 4, protocol version unchanged, no new viewer realtime-events type', () => {
      expect(EdgeEvent.marks).toBe('c.marks');
      expect(isPhase4Only(EdgeEvent.marks)).toBe(false);
      expect(PHASE4_ONLY.events).not.toContain('c.marks');
      expect(EDGE_PROTO).toBe(1);
      expect(Object.values(ViewerEventType)).not.toContain(MARKS_CHANGED_EVENT);
    });

    it('pins the viewer event, the kinds and the user cap', () => {
      expect(MARKS_CHANGED_EVENT).toBe('marks-changed');
      expect(MARK_KINDS).toEqual(['Q', 'F', 'D']);
      expect(Object.isFrozen(MARK_KINDS)).toBe(true);
      expect(C_MARKS_MAX_USERS).toBe(200);
    });

    it('accepts a well-formed notice and returns only its four fields, ids lower-cased, users and kinds de-duplicated', () => {
      expect(cMarksProblem(ok())).toBeNull();
      const parsed = parseCMarks({ ...ok(), users: [A.toUpperCase(), B, A], kinds: ['D', 'Q', 'D'], nSesid: SES.toUpperCase(), jCordinates: [{ p: 1 }], cNote: 'secret' });
      expect(parsed).toEqual({ nSesid: SES, users: [A, B], kinds: ['Q', 'D'], atMs: 1_760_000_000_000 });
    });

    it('refuses bad ids: the session, any user', () => {
      for (const nSesid of [undefined, null, '', '42', 'not-a-uuid', `${SES}x`, 7]) {
        expect({ nSesid, problem: cMarksProblem({ ...ok(), nSesid }) }).toEqual({ nSesid, problem: expect.stringMatching(/nSesid/) });
        expect(parseCMarks({ ...ok(), nSesid })).toBeNull();
      }
      for (const users of [[A, 'nope'], [A, null], [A, 12], ['']]) {
        expect(cMarksProblem({ ...ok(), users })).toMatch(/users/);
        expect(parseCMarks({ ...ok(), users })).toBeNull();
      }
    });

    it('refuses an oversized or empty user list (the cloud splits more than 200 users over several events)', () => {
      const many = (n: number) => Array.from({ length: n }, (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`);
      expect(cMarksProblem({ ...ok(), users: many(200) })).toBeNull();
      expect(cMarksProblem({ ...ok(), users: many(201) })).toMatch(/users/);
      expect(parseCMarks({ ...ok(), users: many(201) })).toBeNull();
      expect(cMarksProblem({ ...ok(), users: [] })).toMatch(/users/);
      expect(cMarksProblem({ ...ok(), users: A })).toMatch(/users/);
    });

    it('refuses unknown or missing kinds, a bad time and a non-object', () => {
      for (const kinds of [[], ['X'], ['Q', 'issue'], 'Q', undefined]) expect(cMarksProblem({ ...ok(), kinds })).toMatch(/kinds/);
      for (const atMs of [undefined, -1, 1.5, '1760000000000', NaN, Infinity]) expect(cMarksProblem({ ...ok(), atMs })).toMatch(/atMs/);
      for (const value of [null, undefined, 'c.marks', 42, [ok()]]) {
        expect(cMarksProblem(value)).toMatch(/object/);
        expect(parseCMarks(value)).toBeNull();
      }
    });
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
