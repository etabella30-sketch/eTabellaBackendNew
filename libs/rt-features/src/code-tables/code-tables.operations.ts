/**
 * The operations port of the code-tables feature (plan §3.3 "per-feature operations port"): what the two shared
 * controllers ask for, in domain terms only. The live hosts bind CodeTableService (the SP over SP_EXECUTOR); the
 * venue box binds a relay adapter over CLOUD_RELAY. A failure is a DomainError, which the host's ERROR_ENVELOPE
 * renders (both live hosts: 200 with the `{ msg: -1, value: 'Failed to fetch' }` row they always gave, coreapi's in a
 * list; the box: its contract envelope or the relayed answer byte for byte).
 */
import type { Caller } from '@app/api-kernel';
import type { CodeRow } from '@app/api-contracts';

import type { CodeTableQueryFields } from './dto/code-table.query';

export const CODE_TABLE_OPS = 'RT_CODE_TABLE_OPS';

export interface CodeTableOperations {
  /** The rows of one code table, as `public.et_combo_codemaster(nCategoryid)` lists them. */
  list(caller: Caller, query: CodeTableQueryFields): Promise<readonly CodeRow[]>;
}

export type { CodeRow };
