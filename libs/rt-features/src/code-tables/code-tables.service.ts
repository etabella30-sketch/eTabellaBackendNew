/**
 * The live executor of the code-table lookup, the one implementation coreapi `common/getcode` and realtime-server
 * `issue/dynamiccombo` now share (plan Phase 10, D12): `public.et_combo_codemaster(nCategoryid)` through SP_EXECUTOR.
 * The SP takes no user, so nothing of the caller reaches it (coreapi used to forward the injected nMasterid, which
 * the SP ignored; realtime-server never sent one). The codes are nobody's data: no team rule, no case (the manifest
 * row is `caseless`). A failed call or a missing cursor is a DomainError `upstream` carrying what the SP said, which
 * each host's legacy shape renders as the `Failed to fetch` row it always gave (http/legacy-shapes.ts).
 *
 * Not bound on the box (no database there): the box binds a relay adapter to the same operations port.
 */
import { Inject, Injectable } from '@nestjs/common';
import { Caller, DomainError, SP_EXECUTOR, SpExecutor } from '@app/api-kernel';
import type { CodeRow } from '@app/api-contracts';

import type { CodeTableQueryFields } from './dto/code-table.query';
import type { CodeTableOperations } from './code-tables.operations';

export const CODE_TABLE_SP = 'combo_codemaster';
export const CODE_TABLE_FAILED = 'Failed to fetch';

@Injectable()
export class CodeTableService implements CodeTableOperations {
  constructor(@Inject(SP_EXECUTOR) private readonly sp: SpExecutor) {}

  async list(_caller: Caller, query: CodeTableQueryFields): Promise<readonly CodeRow[]> {
    const outcome = await this.sp.call<CodeRow>(CODE_TABLE_SP, { nCategoryid: query.nCategoryid }, 'public');
    // Equality on the discriminant: the repo compiles without strictNullChecks, where `!outcome.ok` does not narrow.
    if (outcome.ok === false) throw new DomainError('upstream', CODE_TABLE_FAILED, { error: outcome.error });
    const rows = outcome.cursors[0];
    if (!Array.isArray(rows)) throw new DomainError('upstream', CODE_TABLE_FAILED, { error: 'no_cursor' });
    return rows;
  }
}
