/**
 * Gate G2 of the Full Fact editor: the fixtures and the answers every host that executes FactsheetService must give
 * (realtime-server's golden spec and the lib's own spec run them; the box relays, so its gate is relay parity in
 * apps/rt-edge). The stored procedures are scripted by name; `scriptedExecutor` answers them and records every call
 * as the old service made it (name, params, schema). Test code only: never imported by a source file.
 */
import type { Caller, DomainEvent, EventDelivery, SpExecutor, SpOutcome } from '@app/api-kernel';

export const ME = '11111111-1111-4111-8111-111111111111';
export const FRIEND = '22222222-2222-4222-8222-222222222222';
export const OWNER = '33333333-3333-4333-8333-333333333333';
export const FACT = '55555555-5555-4555-8555-555555555555';
export const CASE = '66666666-6666-4666-8666-666666666666';
export const ISSUE = '77777777-7777-4777-8777-777777777777';

export const CALLER: Caller = Object.freeze({ userId: ME, family: 'cloud-jwt', isPlatformAdmin: false, caseScope: 'membership' });

/** `{ ok: true, cursors: [rows] }` for one cursor, or several. */
export const ok = (...cursors: readonly unknown[][]): SpOutcome<any> => ({ ok: true, cursors });
export const failed = (error = 'relation missing'): SpOutcome<any> => ({ ok: false, error });

export const PERMITTED_ROW = Object.freeze({ nFSid: FACT, nUserid: ME, bCanView: true, bCanEdit: true, bCanReshare: true, bCanComment: true });
export const SHARED_VIEWER_ROW = Object.freeze({ nFSid: FACT, nUserid: OWNER, bCanView: true, bCanEdit: false, bCanReshare: true, bCanComment: false });
export const NOT_VIEWABLE_ROW = Object.freeze({ nFSid: FACT, nUserid: OWNER, bCanView: false, bCanEdit: false, bCanReshare: false, bCanComment: false });

export const DETAIL_ROW = Object.freeze({ nFSid: FACT, jTexts: ['secret'], cNote: 'the note', nColorid: ISSUE });
export const SHARED_ROWS = Object.freeze([{ nUserid: ME, cFname: 'Me', isSelected: true }, { nUserid: FRIEND, cFname: 'Friend', isSelected: false }]);
export const ISSUE_ROWS = Object.freeze([{ nIssueid: ISSUE, cName: 'IS-Issue1' }]);
export const CONTACT_ROWS = Object.freeze([{ nContactid: 'c1', cFname: 'Inder', cLname: 'Jeet' }]);
export const TASK_CURSORS = Object.freeze([[{ nTaskid: 't1' }], [{ nUserid: ME }], [{ nStatusid: 1 }]]);
export const LINK_ROWS = Object.freeze([{ nBundledetailid: 'b1', cName: 'Exhibit 1' }]);
export const ANNOTATION_ROWS = Object.freeze([{ page: 3, type: 'highlight', rects: [], uuid: 'a1', width: 612 }]);
export const SAVED_ROW = Object.freeze({ msg: 1, value: 'Fact updated' });
export const UNSHARED_ROW = Object.freeze({ msg: 1, value: 'Unshared' });
export const DELETED_ROW = Object.freeze({ msg: 1, value: 'Deleted' });
/** et_fact_insert_team's answer: who to tell about the new share. */
export const SHARE_NOTICE = Object.freeze({ nUserid: FRIEND, cTitle: 'Fact shared', cMsg: 'Me shared a fact with you', cType: 'FS', nCaseid: CASE, nFSid: FACT });

/** The save body the Reader sends (mark-api.service.ts ApiFactSheetSaveReq), with a share replacement. */
export const SAVE_BODY = Object.freeze({
  nFSid: FACT,
  nSesid: '88888888-8888-4888-8888-888888888888',
  jT: '["note"]',
  nFt: 0,
  nSt: 0,
  jFl: '[]',
  nColorid: ISSUE,
  jIssues: `[["${ISSUE}",0,0]]`,
  jContacts: '[]',
  jTasks: '[]',
  jDate: '{}',
  jUsers: JSON.stringify([{ nUserid: FRIEND, bCanEdit: false }]),
  bIsUserUpdated: true,
});

/** The scripted SPs when the caller may view and edit the fact and every read works. */
export function happyScript(): Record<string, SpOutcome<any>> {
  return {
    fact_permissions: ok([{ ...PERMITTED_ROW }]),
    factsheet_detail: ok([{ ...DETAIL_ROW }]),
    factsheet_shared: ok([...SHARED_ROWS]),
    factsheet_issues: ok([...ISSUE_ROWS]),
    factsheet_contacts: ok([...CONTACT_ROWS]),
    factsheet_tasks: ok(...TASK_CURSORS.map((c) => [...c])),
    factsheet_links: ok([...LINK_ROWS]),
    getfact_annotation: ok([...ANNOTATION_ROWS]),
    factsheet_submit: ok([{ ...SAVED_ROW }]),
    fact_insert_team: ok([{ jNotify: [{ ...SHARE_NOTICE }] }]),
    factsheet_unshare_withme: ok([{ ...UNSHARED_ROW }]),
    factsheet_delete: ok([{ ...DELETED_ROW }]),
  };
}

export interface RecordedSpCall {
  readonly fn: string;
  readonly params: Record<string, unknown>;
  readonly schema: string | undefined;
}

/** An SpExecutor over a script; `calls` is what the service asked, params copied at call time. */
export function scriptedExecutor(script: Record<string, SpOutcome<any>>): { sp: SpExecutor; calls: RecordedSpCall[] } {
  const calls: RecordedSpCall[] = [];
  const sp: SpExecutor = {
    async call(fn, params, schema) {
      calls.push({ fn, params: JSON.parse(JSON.stringify(params)), schema });
      const outcome = script[fn];
      if (!outcome) throw new Error(`conformance: no scripted answer for ${fn}`);
      return outcome;
    },
  };
  return { sp, calls };
}

/** An EventDelivery that keeps what was published. */
export function recordingEvents(): { events: EventDelivery; published: DomainEvent[] } {
  const published: DomainEvent[] = [];
  return { events: { publish: (e) => void published.push(e) }, published };
}

/** The SP call the old service made for a read: the request's fields plus the caller, realtime schema. */
export const readCall = (fn: string, extra: Record<string, unknown> = {}): RecordedSpCall => ({ fn, params: { nFSid: FACT, nMasterid: ME, ...extra }, schema: 'realtime' });
/** The permission lookup every read and the save make first: public schema (no schema argument). */
export const PERMISSION_CALL: RecordedSpCall = Object.freeze({ fn: 'fact_permissions', params: { nUserid: ME, nFSid: FACT }, schema: undefined });

/** What every host must answer per route when the caller may view the fact and the SPs work. */
export const EXPECTED_HAPPY: Readonly<Record<string, unknown>> = Object.freeze({
  detail: DETAIL_ROW,
  permissions: PERMITTED_ROW,
  shared: SHARED_ROWS,
  issues: ISSUE_ROWS,
  contacts: CONTACT_ROWS,
  tasks: TASK_CURSORS,
  links: LINK_ROWS,
  annotation: ANNOTATION_ROWS,
  save: SAVED_ROW,
  unshare: UNSHARED_ROW,
  remove: DELETED_ROW,
});

/** What every host must answer per read when the fact exists but the caller may not view it. */
export const EXPECTED_NOT_VIEWABLE: Readonly<Record<string, unknown>> = Object.freeze({
  detail: { msg: -1, value: 'You are not permitted to view this fact' },
  permissions: { msg: -1, value: 'You are not permitted to view this fact' },
  shared: [],
  issues: [],
  contacts: [],
  tasks: [[], [], []],
  links: [],
  annotation: [],
});

/** The Kafka `notification` message UtilityService.sendNotification emitted for SHARE_NOTICE (platform-cloud reproduces it). */
export const EXPECTED_SHARE_MESSAGE = Object.freeze({
  nUserid: FRIEND,
  cTitle: 'Fact shared',
  cMsg: 'Me shared a fact with you',
  cStatus: 'P',
  cType: 'FS',
  nCaseid: CASE,
  cToken: undefined,
  nFSid: FACT,
  nDocid: null,
  nWebid: null,
  nBundledetailid: null,
  nRefuserid: ME,
});

/** Throws with the difference when an answer is not the conformant one. */
export function expectConformant(route: string, answer: unknown, expected: unknown): void {
  const got = JSON.stringify(answer);
  const want = JSON.stringify(expected);
  if (got !== want) throw new Error(`factsheet conformance (${route}): expected ${want}\n   got ${got}`);
}
