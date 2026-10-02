/**
 * Small helpers over a verified `EdgePrincipal` shared by auth, the LAN controllers and the gateway.
 */
import type { EdgeActor } from '../contracts';
import type { EdgePrincipal } from '../ports';

/** Name shown for an operator-code sign-in (contract `EdgeMeResponse.name`). */
export const OPERATOR_DISPLAY_NAME = 'Operator';

/**
 * Who did something, for audit rows, "Applied 09:12 by P. Shah" and room-code issuers (contract `EdgeActor`):
 * an operator-code session is attributed to the case admin who minted the code (name) with no user id, plus the
 * operator name typed at issue (O-10) when there is one.
 */
export function actorOf(principal: EdgePrincipal, operatorName: string | null = null): EdgeActor {
    if (principal.kind === 'operator') {
        return {
            nUserid: null,
            name: principal.mintedBy?.name || OPERATOR_DISPLAY_NAME,
            via: 'operator',
            operatorName: operatorName && operatorName.trim() ? operatorName.trim() : null,
        };
    }
    return { nUserid: principal.userId, name: principal.name, via: principal.kind, operatorName: null };
}

/** Epoch ms after which no renewal can extend an online sign-in (D24: auth_time + 24 h); null for box tokens. */
export function onlineCeilingMs(principal: EdgePrincipal, ceilingMs: number): number | null {
    return principal.kind === 'online' && principal.authTime != null ? principal.authTime + ceilingMs : null;
}
