/**
 * The live executor of the Mark Navigator's box rows, the one implementation coreapi and realtime-server now share
 * (plan Phase 8): realtime.et_navigate_get_all (three cursors) and realtime.et_navigate_quick_mark (one), exactly as
 * both hosts' MarknavService called them, with the actor from the verified Caller in BOTH identity keys (R4; the
 * client's nUserid is never forwarded). A failed call answers the hosts' failure list, `[{ msg: -1, value: 'Failed ',
 * error }]`, with 200, as it always did. Not bound on the box (no database there): the box binds a relay adapter.
 */
import { Inject, Injectable } from '@nestjs/common';
import { Caller, SP_EXECUTOR, SpExecutor } from '@app/api-kernel';

import type { MarkNavigatorListFields } from './dto/marknav.dto';
import type { MarkNavigatorOperations } from './marknav.operations';

export const MARK_NAVIGATOR_SP = Object.freeze({
  all: 'navigate_get_all',
  quickMarks: 'navigate_quick_mark',
});

export const MARK_NAVIGATOR_FAILED = 'Failed ';

/** The request's fields with the caller as the actor, under both keys the SPs read. */
export function withActor(caller: Caller, query: MarkNavigatorListFields): Record<string, unknown> {
  return { ...query, nUserid: caller.userId, nMasterid: caller.userId };
}

/** The hosts' failure list for a Mark Navigator read. */
export const markNavigatorFailure = (error: unknown): readonly [{ msg: -1; value: string; error: unknown }] => [{ msg: -1, value: MARK_NAVIGATOR_FAILED, error }];

/**
 * The three `marknav/all` cursors narrowed to one mark: its rows, the Issues tagged on it (an Issue row lists every mark
 * it is on in `jFSids`; only this one is kept), and its links. The read itself is the same — the caller sees no more
 * than the full list would show them.
 */
export function oneMarkCursors(cursors: readonly unknown[], nFSid: string): unknown[] {
  const id = nFSid.toLowerCase();
  const rows = (cursor: unknown): Record<string, unknown>[] => (Array.isArray(cursor) ? cursor : []);
  const isMine = (row: Record<string, unknown>): boolean => String(row?.['nFSid'] ?? '').toLowerCase() === id;
  const ids = (value: unknown): string[] => {
    let list = value;
    if (typeof list === 'string') { try { list = JSON.parse(list); } catch { list = []; } }
    return Array.isArray(list) ? list.map(v => String(v).toLowerCase()) : [];
  };
  const issues = rows(cursors[1])
    .filter(row => (row?.['jFSids'] !== undefined ? ids(row['jFSids']).includes(id) : isMine(row)))
    .map(row => (row?.['jFSids'] !== undefined ? { ...row, jFSids: [nFSid] } : row));
  return [rows(cursors[0]).filter(isMine), issues, rows(cursors[2]).filter(isMine), ...cursors.slice(3)];
}

@Injectable()
export class MarkNavigatorService implements MarkNavigatorOperations {
  constructor(@Inject(SP_EXECUTOR) private readonly sp: SpExecutor) {}

  async all(caller: Caller, query: MarkNavigatorListFields): Promise<unknown> {
    const { nFSid, ...list } = query;
    const outcome = await this.sp.call(MARK_NAVIGATOR_SP.all, { ...withActor(caller, list), ref: 3 }, 'realtime');
    // Equality on the discriminant: the repo compiles without strictNullChecks, where `!outcome.ok` does not narrow.
    if (outcome.ok === false) return markNavigatorFailure(outcome.error);
    return nFSid ? oneMarkCursors(outcome.cursors, nFSid) : outcome.cursors;
  }

  async quickMarks(caller: Caller, query: MarkNavigatorListFields): Promise<unknown> {
    const outcome = await this.sp.call(MARK_NAVIGATOR_SP.quickMarks, withActor(caller, query), 'realtime');
    return outcome.ok === false ? markNavigatorFailure(outcome.error) : outcome.cursors[0];
  }
}
