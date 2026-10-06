/**
 * The box's binding of the team-users operations port (plan §3.3 "Relay adapters"): the shared CoreTeamUsersController
 * mounted under /coreapi asks this adapter, which asks CLOUD_RELAY for the manifest row the RT table answered until
 * Phase 5 (`core.myteamusers`: cloud-read of realtime-server `factsheet/teamusers` with the caller's edge token,
 * per-user cache, offline and box-signed fallbacks). The answer is the table's, byte for byte: every header the
 * relay recorded goes onto the response, and anything but a 2xx JSON list is thrown as a DomainError carrying the
 * recorded answer, which EdgeEnvelope writes as it was. The caller's own ids in the query (nUserid, nMasterid) are
 * forwarded as before, so the relay replaces them with the verified sign-in exactly as the table did.
 */
import { Inject, Injectable } from '@nestjs/common';
import { Caller, DomainError } from '@app/api-kernel';
import type { TeamUserRow, TeamUsersOperations, TeamUsersQueryFields } from '@app/rt-features/team-users';

import { apiRequestContext } from '../api-context';
import { CLOUD_RELAY, CloudRelay, RelayAnswer } from '../../ports';

export const TEAM_USERS_ROUTE_ID = 'core.myteamusers';
/** Headers the controller's own serialisation sets; everything else the relay recorded is copied. */
const NOT_COPIED = new Set(['content-type', 'content-length']);

/** The query as the table received it from the FE: the case, and the actor fields the relay overwrites. */
export function relayQueryOf(query: TeamUsersQueryFields): Record<string, string> {
    const out: Record<string, string> = {};
    if (query.nCaseid !== undefined && query.nCaseid !== null) out.nCaseid = query.nCaseid;
    if (typeof query.nUserid === 'string') out.nUserid = query.nUserid;
    if (typeof query.nMasterid === 'string') out.nMasterid = query.nMasterid;
    return out;
}

@Injectable()
export class TeamUsersRelay implements TeamUsersOperations {
    constructor(@Inject(CLOUD_RELAY) private readonly relay: CloudRelay) {}

    async listMyTeamUsers(_caller: Caller, query: TeamUsersQueryFields): Promise<readonly TeamUserRow[]> {
        const ctx = apiRequestContext();
        if (!ctx) throw new DomainError('unavailable', 'the team-users relay runs only inside a local API request');
        const answer: RelayAnswer = await this.relay.call(TEAM_USERS_ROUTE_ID, relayQueryOf(query), null, ctx);
        for (const [name, value] of Object.entries(answer.headers)) if (!NOT_COPIED.has(name)) ctx.res.setHeader(name, value);
        if (answer.status < 200 || answer.status >= 300 || !Array.isArray(answer.body)) {
            throw new DomainError('upstream', 'relayed answer', { relay: answer });
        }
        return answer.body as TeamUserRow[];
    }
}
