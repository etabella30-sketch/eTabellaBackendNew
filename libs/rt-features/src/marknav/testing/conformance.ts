/**
 * Gate G2 of the Mark Navigator's box rows: the fixtures and the answers every host that executes
 * MarkNavigatorService must give (the lib's own spec and the hosts' golden specs run them; the box relays, so its gate
 * is relay parity in apps/rt-edge). Test code only: never imported by a source file.
 */
import type { Caller, SpExecutor, SpOutcome } from '@app/api-kernel';

export const ME = '11111111-1111-4111-8111-111111111111';
export const SESSION = '22222222-2222-4222-8222-222222222222';
export const DOCUMENT = '33333333-3333-4333-8333-333333333333';

export const CALLER: Caller = Object.freeze({ userId: ME, family: 'cloud-jwt', isPlatformAdmin: false, caseScope: 'membership' });

export const ok = (...cursors: readonly unknown[][]): SpOutcome<any> => ({ ok: true, cursors });
export const failed = (error = 'relation missing'): SpOutcome<any> => ({ ok: false, error });

/** The three cursors of et_navigate_get_all: marks, their issues, their links. */
export const ALL_CURSORS = Object.freeze([
  [{ nFSid: 'f1', cFType: 'F', jTexts: ['secret'], nPage: 3, nLine: 7 }],
  [{ nFSid: 'f1', nIssueid: 'i1', cIName: 'Issue 1' }],
  [{ nFSid: 'f1', nBundledetailid: DOCUMENT, cName: 'Exhibit 1' }],
]);
/** The rows of et_navigate_quick_mark. */
export const QUICK_MARK_ROWS = Object.freeze([{ nHid: 'h1', nPage: 3, nLine: 7, cTime: '10:11:12:13', cCreateby: 'Me Caller' }]);

/** The query of `marknav/all` as the RT page sends it (mark-api.service.ts getMarkNavAll), with forged actor ids. */
export const ALL_QUERY = Object.freeze({ nSesid: SESSION, cSorttype: 'H', cSortby: 'desc', nPageNumber: 1, bIsTranscipt: false, nUserid: 'forged-by-client', nMasterid: 'forged-too' });
export const QUICK_MARKS_QUERY = Object.freeze({ nSesid: SESSION, cSorttype: 'H', nPageNumber: 1, bIsTranscipt: false, nUserid: 'forged-by-client' });

export const EXPECTED_ALL = ALL_CURSORS;
export const EXPECTED_QUICK_MARKS = QUICK_MARK_ROWS;
export const EXPECTED_FAILURE = Object.freeze([{ msg: -1, value: 'Failed ', error: 'relation missing' }]);

export interface RecordedSpCall {
  readonly name: string;
  readonly params: Record<string, unknown>;
  readonly schema: string | undefined;
}

/** An SpExecutor that answers the scripted SPs by name and records every call (name, params, schema). */
export function scriptedExecutor(script: Record<string, SpOutcome<any>>): { sp: SpExecutor; calls: RecordedSpCall[] } {
  const calls: RecordedSpCall[] = [];
  const sp: SpExecutor = {
    async call(name, params, schema) {
      calls.push({ name, params: { ...params }, schema });
      const outcome = script[name];
      if (!outcome) throw new Error(`unscripted SP ${name}`);
      return outcome;
    },
  };
  return { sp, calls };
}

export function happyScript(): Record<string, SpOutcome<any>> {
  return {
    navigate_get_all: ok(...ALL_CURSORS.map((c) => [...c])),
    navigate_quick_mark: ok([...QUICK_MARK_ROWS]),
  };
}

/** What every executing host must have asked: the realtime SP, with the caller as both identity keys, never the client's. */
export function expectActorCalls(calls: readonly RecordedSpCall[], callerId: string): void {
  expect(calls.length).toBeGreaterThan(0);
  for (const call of calls) {
    expect(call.schema).toBe('realtime');
    expect(call.params.nUserid).toBe(callerId);
    expect(call.params.nMasterid).toBe(callerId);
    expect(Object.values(call.params)).not.toContain('forged-by-client');
    expect(Object.values(call.params)).not.toContain('forged-too');
  }
}
