/**
 * The box's binding of the comments operations port (plan §3.3 "Relay adapters", Phase 10): the shared
 * CommentsController mounted under /coreapi asks this adapter for the two rows the box relays, `core.comments`
 * (a cloud-read of realtime-server `comments/grid`: per-user cache, the mock's [] offline or for a box-signed sign-in)
 * and `core.comments.add` (a cloud-write of `comments/add`: online only, 503 offline). The answer is the table's,
 * byte for byte (CloudRelayAdapter). The commenters, the edit and the delete are coreapi's own (CommentsLiveController
 * is cloud only); their adapter methods answer the table's refusal for a route the box does not serve, `use_cloud`.
 */
import { Inject, Injectable } from '@nestjs/common';
import type { Caller } from '@app/api-kernel';
import type { CommentListFields, CommentManageFields, CommentPermission, CommentsOperations, CommentUsersFields } from '@app/rt-features/comments';

import { CLOUD_RELAY, CloudRelay } from '../../ports';
import { CloudRelayAdapter, notServed } from './cloud-relay-adapter';

@Injectable()
export class CommentsRelay extends CloudRelayAdapter implements CommentsOperations {
    constructor(@Inject(CLOUD_RELAY) relay: CloudRelay) {
        super(relay, 'comments');
    }

    grid(_caller: Caller, _query: CommentListFields): Promise<readonly unknown[]> {
        return this.read('core.comments') as Promise<readonly unknown[]>;
    }

    users(_caller: Caller, _query: CommentUsersFields): Promise<readonly unknown[]> {
        throw notServed();
    }

    manage(_caller: Caller, _body: CommentManageFields, permission: CommentPermission): Promise<unknown> {
        if (permission !== 'N') throw notServed();
        return this.write('core.comments.add');
    }
}
