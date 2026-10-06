/**
 * The live executor of the DocLink reads, the one implementation realtime-server and coreapi now share (plan Phase 8):
 * `docdetail` and `docshared` run only for the DocLinks the caller owns or was shared (the view rule of
 * @app/permissions doclink.ts), with the SPs each host called (public.et_doc_detail, the only variant that exists;
 * realtime.et_doc_get_shared) and the actor from the verified Caller (R4). A caller who may read none of the ids gets
 * the SP's own empty result ([[], [], []] / []), not a 403: both frontends read it as "no DocLinks", and the legacy
 * interceptor sends 403s to the dashboard. A bad jDocids or a failed lookup answers the route's failure row.
 * The two writes go to the host-bound DOCLINK_WRITES port (see doclink.operations.ts).
 */
import { Inject, Injectable } from '@nestjs/common';
import { Caller, ROW_QUERY, RowQuery, SP_EXECUTOR, SpExecutor } from '@app/api-kernel';
import { parseDocIds, viewableDocLinkIds } from '@app/permissions';

import type { DocLinkDetailFields, DocLinkIdFields, DocLinkInsertFields } from './dto/doclink.dto';
import { DOCLINK_WRITES, DocLinkOperations, DocLinkWrites } from './doclink.operations';

export const DOCLINK_SP = Object.freeze({
  detail: 'doc_detail',
  shared: 'doc_get_shared',
});

export const DOCLINK_FETCH_FAILED = 'Fetch failed';

/** The hosts' failure row for a DocLink read. */
export const fetchFailed = (error?: unknown): { msg: -1; value: string; error?: unknown } =>
  error === undefined ? { msg: -1, value: DOCLINK_FETCH_FAILED } : { msg: -1, value: DOCLINK_FETCH_FAILED, error };

/** The request's fields with the caller as the actor (both keys), as the SP executor takes them. */
export function withActor(caller: Caller, query: object): Record<string, unknown> {
  return { ...query, nUserid: caller.userId, nMasterid: caller.userId };
}

@Injectable()
export class DocLinkService implements DocLinkOperations {
  constructor(
    @Inject(SP_EXECUTOR) private readonly sp: SpExecutor,
    @Inject(ROW_QUERY) private readonly rows: RowQuery,
    @Inject(DOCLINK_WRITES) private readonly writes: DocLinkWrites,
  ) {}

  insert(caller: Caller, body: DocLinkInsertFields): Promise<unknown> {
    return this.writes.insert(caller, body);
  }

  remove(caller: Caller, body: DocLinkIdFields): Promise<unknown> {
    return this.writes.remove(caller, body);
  }

  async detail(caller: Caller, query: DocLinkDetailFields): Promise<unknown> {
    const asked = parseDocIds(query?.jDocids);
    if (!asked) return fetchFailed();
    const visible = await this.visible(caller, asked);
    if (!visible) return fetchFailed();
    if (!visible.length) return [[], [], []];
    const outcome = await this.sp.call(DOCLINK_SP.detail, { ...withActor(caller, query), jDocids: JSON.stringify(visible), ref: 3 }, 'public');
    // Equality on the discriminant: the repo compiles without strictNullChecks, where `!outcome.ok` does not narrow.
    return outcome.ok === false ? fetchFailed(outcome.error) : outcome.cursors;
  }

  async shared(caller: Caller, query: DocLinkIdFields): Promise<unknown> {
    const visible = await this.visible(caller, [query?.nDocid]);
    if (!visible) return fetchFailed();
    if (!visible.length) return [];
    const outcome = await this.sp.call(DOCLINK_SP.shared, withActor(caller, query), 'realtime');
    return outcome.ok === false ? fetchFailed(outcome.error) : outcome.cursors[0];
  }

  /** The ids the caller may read, or null when the lookup failed (the route then answers its failure row). */
  private async visible(caller: Caller, ids: readonly unknown[]): Promise<string[] | null> {
    try {
      return await viewableDocLinkIds(this.rows, caller.userId, ids);
    } catch {
      return null;
    }
  }
}
