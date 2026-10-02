/**
 * LanPort (token LAN_PORT, module lan/): the box's LAN surface — HTTP controllers for every `EDGE_ROUTES` entry,
 * `/edge-config.json`, `/edge/ping`, the static FE `edge` bundle (`BoxConfig.paths.publicDir`), the allowlisted
 * `/realtimeapi` proxy (spec §8.2), and the socket.io LAN gateway (CONTRACTS.md §9). Nothing else calls into the
 * LAN; it consumes every other port and the event bus. This port only exposes what the app lifecycle and the
 * other modules need from it.
 *
 * LAN conventions the implementation follows (CONTRACTS.md §1, §2.4):
 * - success bodies get `msg: 1` added to the port's `Reply<…>`; errors go through `edgeErrorResponse(err)`;
 * - every `/edge-config.json`, `/edge/ping` and `/edge/*` reply carries `Cache-Control: no-store`;
 * - routes never served by the box answer `use_cloud` 403 `{useCloud:true}`; box-signed tokens on a proxied route
 *   answer `reauth` 503 `{reauth:true}`; proxied writes while offline answer `offline` 503 within 300 ms;
 * - the gateway authenticates the handshake `auth.token` with `AuthPort.authenticate`, checks `join-room` with
 *   `AuthPort.canOpenSession`, ignores `query.nUserid`, and closes sockets on `access-revoked`.
 */

export interface LanPort {
    /**
     * Bus subscriptions and the status fan-out; controllers and the gateway are attached to the HTTP server at init
     * and serve from whenever it listens. Called last, after the LAN listener's first attempt, which may not have
     * bound (production waiting for its certificate, or a failed bind: `EdgeBootStatus.lanListener()`; main.ts binds
     * later without calling this again). Resolves PROMPTLY and does not reject for a runtime condition; rejects only
     * on a programming error (the lifecycle then logs it, alerts and keeps the box recording). Idempotent.
     */
    start(): Promise<void>;
    /**
     * Disconnect every LAN socket (reason 'server shutting down') and stop timers. Idempotent; works also when
     * `start` never ran or failed (sockets accepted since `listen` are still closed).
     */
    close(): Promise<void>;
    /** Sockets joined to `S<nSesid>`; total LAN sockets when `nSesid` is omitted. */
    viewerCount(nSesid?: string): number;
}
