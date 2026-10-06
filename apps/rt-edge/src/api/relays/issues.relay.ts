/**
 * The box's binding of the issue and claim operations port (Phase 9): the shared IssuesController mounted under
 * /realtimeapi asks this adapter, which relays the nine rows the RT table answered until Phase 9 (issue.list
 * `cloud-read`, team data: no offline body, 503 offline; the eight `cloud-write` rows), through the relay adapter
 * base. PUT and DELETE handlers answer 200 on their own, POST 201: the status the relay compares against.
 */
import { Inject, Injectable } from '@nestjs/common';
import { Caller } from '@app/api-kernel';
import type {
  ClaimUpdateFields,
  IssueCategoryFields,
  IssueDeleteFields,
  IssueFields,
  IssueListFields,
  IssuesOperations,
  QFactClaimSequenceFields,
  QFactSequenceFields,
} from '@app/rt-features/issues';

import { CLOUD_RELAY, CloudRelay } from '../../ports';
import { CloudRelayAdapter } from './cloud-relay-adapter';

@Injectable()
export class IssuesRelay extends CloudRelayAdapter implements IssuesOperations {
    constructor(@Inject(CLOUD_RELAY) relay: CloudRelay) {
        super(relay, 'issues');
    }

    list(_caller: Caller, _query: IssueListFields): Promise<unknown> { return this.read('issue.list'); }
    insert(_caller: Caller, _body: IssueFields): Promise<unknown> { return this.write('issue.insert'); }
    update(_caller: Caller, _body: IssueFields): Promise<unknown> { return this.write('issue.update', 200); }
    remove(_caller: Caller, _body: IssueDeleteFields): Promise<unknown> { return this.write('issue.delete', 200); }
    removeMany(_caller: Caller, _body: IssueDeleteFields): Promise<unknown> { return this.write('issue.delete.multi', 200); }
    insertCategory(_caller: Caller, _body: IssueCategoryFields): Promise<unknown> { return this.write('issue.category.insert'); }
    qfactSequence(_caller: Caller, _body: QFactSequenceFields): Promise<unknown> { return this.write('issue.qfact.sequence'); }
    qfactClaimSequence(_caller: Caller, _body: QFactClaimSequenceFields): Promise<unknown> { return this.write('issue.qfact.claim.sequence'); }
    updateClaim(_caller: Caller, _body: ClaimUpdateFields): Promise<unknown> { return this.write('issue.claim.update', 200); }
}
