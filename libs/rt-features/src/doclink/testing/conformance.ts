/**
 * Gate G2 of the DocLink reads: the fixtures and the answers every host that executes DocLinkService must give (the
 * lib's own spec and the hosts' golden specs run them; the box relays, so its gate is relay parity in apps/rt-edge).
 * The view rule's SQL is scripted by text, the stored procedures by name; a recording writes port stands in for the
 * host-bound DOCLINK_WRITES. Test code only: never imported by a source file.
 */
import type { Caller, RowQuery, SpExecutor, SpOutcome } from '@app/api-kernel';
import { DOCLINK_VIEW_SQL } from '@app/permissions';

import type { DocLinkIdFields, DocLinkInsertFields } from '../dto/doclink.dto';
import type { DocLinkWrites } from '../doclink.operations';

export const ME = '11111111-1111-4111-8111-111111111111';
export const MINE = '22222222-2222-4222-8222-222222222222';
export const SHARED_WITH_ME = '33333333-3333-4333-8333-333333333333';
export const OTHERS = '44444444-4444-4444-8444-444444444444';
export const CASE = '55555555-5555-4555-8555-555555555555';
export const TARGET = '66666666-6666-4666-8666-666666666666';

export const CALLER: Caller = Object.freeze({ userId: ME, family: 'cloud-jwt', isPlatformAdmin: false, caseScope: 'membership' });

export const ok = (...cursors: readonly unknown[][]): SpOutcome<any> => ({ ok: true, cursors });
export const failed = (error = 'relation missing'): SpOutcome<any> => ({ ok: false, error });

/** The three cursors of public.et_doc_detail: the DocLinks, their link targets, their share lists. */
export const DETAIL_CURSORS = Object.freeze([
  [{ nDocid: MINE, nBundledetailid: TARGET, nUserid: ME, cType: 'S', jLinktype: 'P' }],
  [{ nDocid: MINE, nDMLids: 'l1', nBundledetailid: TARGET, cFilename: 'Exhibit 1' }],
  [{ docids: [MINE], nUserid: ME, cFname: 'Me' }],
]);
export const SHARED_ROWS = Object.freeze([{ nDocid: MINE, nUserid: OTHERS, cFname: 'Other', bCanEdit: false }]);

/** A docdetail query naming every kind of id, with forged actor ids. */
export const DETAIL_QUERY = Object.freeze({ jDocids: JSON.stringify([OTHERS, MINE, SHARED_WITH_ME.toUpperCase(), MINE]), nMasterid: 'forged-by-client', nUserid: 'forged-too' });
export const EXPECTED_DETAIL = DETAIL_CURSORS;
export const EXPECTED_NONE_VISIBLE = Object.freeze([[], [], []]);
export const EXPECTED_FETCH_FAILED = Object.freeze({ msg: -1, value: 'Fetch failed' });

/** The insert body the Reader sends (mark-api.service.ts insertDoc), with forged actor ids. */
export const INSERT_BODY: DocLinkInsertFields = Object.freeze({
  nBundledetailid: TARGET,
  nCaseid: CASE,
  cType: 'S',
  cDFrom: 'I',
  jDl: JSON.stringify([[TARGET, 'P', [], []]]),
  jT: '["note"]',
  jOT: '["source"]',
  jUsers: '[]',
  jAn: [],
  nMasterid: 'forged-by-client',
});

export interface RecordedSpCall {
  readonly name: string;
  readonly params: Record<string, unknown>;
  readonly schema: string | undefined;
}

/** An SpExecutor that answers the scripted SPs by name and records every call. */
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

/** A RowQuery answering DOCLINK_VIEW_SQL: ME owns MINE and was shared SHARED_WITH_ME; `fail` makes the lookup throw. */
export function viewRule(fail = false): { rows: RowQuery; queries: Array<{ sql: string; params: readonly unknown[] }> } {
  const queries: Array<{ sql: string; params: readonly unknown[] }> = [];
  const rows: RowQuery = {
    async rows<R>(sql: string, params: readonly unknown[]): Promise<readonly R[]> {
      queries.push({ sql, params });
      if (fail) throw new Error('db down');
      if (sql !== DOCLINK_VIEW_SQL) throw new Error(`unexpected sql: ${sql}`);
      const [ids, caller] = params as [string[], string];
      const visible = caller === ME ? ids.filter((id) => id === MINE || id === SHARED_WITH_ME) : [];
      return visible.map((nDocid) => ({ nDocid })) as unknown as R[];
    },
  };
  return { rows, queries };
}

/** A DOCLINK_WRITES port that records what it was asked and answers fixed rows. */
export function recordingWrites(): { writes: DocLinkWrites; calls: Array<{ op: 'insert' | 'remove'; caller: Caller; body: unknown }> } {
  const calls: Array<{ op: 'insert' | 'remove'; caller: Caller; body: unknown }> = [];
  const writes: DocLinkWrites = {
    async insert(caller: Caller, body: DocLinkInsertFields): Promise<unknown> {
      calls.push({ op: 'insert', caller, body });
      return { msg: 1, value: 'Doc inserted successfully', nDocid: MINE };
    },
    async remove(caller: Caller, body: DocLinkIdFields): Promise<unknown> {
      calls.push({ op: 'remove', caller, body });
      return { msg: 1, value: 'Deleted' };
    },
  };
  return { writes, calls };
}

export function happyScript(): Record<string, SpOutcome<any>> {
  return {
    doc_detail: ok(...DETAIL_CURSORS.map((c) => [...c])),
    doc_get_shared: ok([...SHARED_ROWS]),
  };
}
