/**
 * The operations port of the DocLink routes (plan §3.3, Phase 8): what the shared controllers ask for, in domain
 * terms. The reads (detail, shared) have one live implementation, DocLinkService; the two writes (insert, delete) are
 * a second, host-bound port, DOCLINK_WRITES, because each host keeps its own create gate (realtime-server's needs its
 * session-visibility rule, coreapi's its own) and its own et_doc_delete variant (realtime-server deletes the whole
 * DocLink, coreapi one link at a time through nDMLids) until those are reconciled with approval; DocLinkService
 * delegates to it. The venue box binds a relay adapter to the whole operations port over CLOUD_RELAY.
 * Every answer is the legacy wire body (a row, the SP's cursors, or a `{ msg: -1, value, error }` failure row
 * answered with 200/201 as the routes always did); only the gates' faults and refusals are DomainErrors, rendered
 * by the host's envelope.
 */
import type { Caller } from '@app/api-kernel';

import type { DocLinkDetailFields, DocLinkIdFields, DocLinkInsertFields } from './dto/doclink.dto';

export const DOCLINK_OPS = 'RT_DOCLINK_OPS';
export const DOCLINK_WRITES = 'RT_DOCLINK_WRITES';

/** The host-bound writes (realtime-server DoclinkService, coreapi DoclinkService); never bound on the box. */
export interface DocLinkWrites {
  /** `doclink/insertdoc`: the service-level answer, `{ msg, value, nDocid?, error? }`; the controller wraps it. */
  insert(caller: Caller, body: DocLinkInsertFields): Promise<unknown>;
  /** `doclink/docdelete`: the SP's row, or the failure row. */
  remove(caller: Caller, body: DocLinkIdFields): Promise<unknown>;
}

export interface DocLinkOperations extends DocLinkWrites {
  /** `doclink/docdetail`: the three cursors of public.et_doc_detail for the DocLinks the caller may read. */
  detail(caller: Caller, query: DocLinkDetailFields): Promise<unknown>;
  /** `doclink/docshared` (cloud only): the share list of a DocLink the caller may read, `[]` otherwise. */
  shared(caller: Caller, query: DocLinkIdFields): Promise<unknown>;
}

/** The answer of the insert route, as both hosts' controllers wrap the service answer. */
export interface DocLinkInsertAnswer {
  readonly msg: number;
  readonly value: string;
  readonly nDocid?: string;
  readonly error?: unknown;
}
