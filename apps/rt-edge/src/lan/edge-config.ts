/**
 * `GET /edge-config.json` (D8) and `GET /edge/ping` (DR5, DR14, O-16): the runtime identity the edge build loads before
 * bootstrap, and the reachability probe of the login page. Built from the box config file and `StatePort.identity`;
 * never a secret.
 */
import { edgeAudience } from '@app/edge-token';

import { EDGE_CONTRACT_VERSION, EdgeConfig, EdgeInternetStatus, EdgePingResponse } from '../contracts';
import { boxHostname, BoxConfig, BoxIdentityRecord, Reply } from '../ports';
import { CLOUD_SIGNIN_PATHS } from './cloud-signin';

/** The `EdgeConfig` of an enrolled box (callers answer 404 while the box has no identity: "Box not configured"). */
export function buildEdgeConfig(config: BoxConfig, identity: BoxIdentityRecord): EdgeConfig {
    return {
        contractVersion: EDGE_CONTRACT_VERSION,
        nEdgeid: identity.nEdgeid,
        boxName: config.box.name,
        venueLabel: config.box.venueLabel,
        boxHost: boxHostname(identity.slug, config.box.domain),
        roomWifiSsid: config.box.roomWifiSsid,
        timeZone: config.box.timeZone,
        cloudOrigin: config.cloud.origin,
        cloudPingUrl: config.cloud.pingUrl,
        pkce: {
            authorizeUrl: config.cloud.authorizeUrl,
            // Box paths (relative to the box origin): the box forwards both calls to `cloud.tokenUrl` /
            // `cloud.refreshUrl` itself, so the browser makes no cross-origin call to the cloud (cloud-signin.ts).
            tokenUrl: CLOUD_SIGNIN_PATHS.token,
            refreshUrl: CLOUD_SIGNIN_PATHS.refresh,
            callbackPath: '/auth/callback',
            codeChallengeMethod: 'S256',
            audience: edgeAudience(identity.nEdgeid),
        },
        features: { ...config.features },
        // Password mode (lan/cloud-signin.ts): the login page asks for the email and the password, and stays on the box.
        ...(config.box.signIn === 'password' ? { signIn: 'password' as const } : {}),
    };
}

/**
 * `EdgePingResponse` without `msg`. A box without an identity still answers (the device can reach it); `nEdgeid` is
 * then '' so the FE's "nEdgeid ≠ config" check reads it as the wrong box. `cloudLinked` = a confirmed (active)
 * identity.
 */
export function buildPing(config: BoxConfig, identity: BoxIdentityRecord | null, internet: EdgeInternetStatus, nowMs: number): Reply<EdgePingResponse> {
    return {
        nEdgeid: identity?.nEdgeid ?? '',
        nowMs,
        timeZone: config.box.timeZone,
        internet: { state: internet.state, sinceMs: internet.sinceMs },
        cloudLinked: identity?.status === 'active',
    };
}
