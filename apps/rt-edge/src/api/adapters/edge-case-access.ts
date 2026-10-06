/**
 * CASE_ACCESS on the box (plan §3.3): a case is the caller's only when it is in the sign-in's `caseScope`, the list
 * AUTH_PORT built from the token's cases, the box's assignments and the roster (DR19). The box never asks a database:
 * it has none, and a case that is not on the box is not this box's to answer for. The refusal is `forbidden` with
 * the field named, which EdgeEnvelope sends as the table's own answer for the same case, `403 use_cloud` (unknown
 * and not-mine alike, so a case id can never be probed).
 */
import { Injectable } from '@nestjs/common';
import { Caller, CaseAccess, DomainError } from '@app/api-kernel';

import { sameId } from '../../auth/session-facts';

@Injectable()
export class EdgeCaseAccess implements CaseAccess {
    async assertMember(caller: Caller, nCaseid: string): Promise<void> {
        const scope = caller.caseScope;
        if (scope === 'membership' || !scope.some(id => sameId(id, nCaseid))) {
            throw new DomainError('forbidden', 'this case is not on this box for this sign-in', { field: 'nCaseid' });
        }
    }
}
