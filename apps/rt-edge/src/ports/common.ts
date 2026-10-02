/**
 * Small shared shapes of the box ports.
 */

/**
 * A contract reply without its `msg: 1`. Ports return the data; the LAN controller adds `msg: 1` (so no port can
 * get the envelope wrong) and sets `Cache-Control: no-store` (CONTRACTS.md §1).
 */
export type Reply<T extends { readonly msg: 1 }> = Omit<T, 'msg'>;

/**
 * Who is calling, as the LAN layer sees the HTTP request or socket handshake. Never trusted for identity: identity
 * comes only from the verified token (`AuthPort.authenticate`). A client-supplied `nUserid` is never read.
 */
export interface EdgeRequestContext {
    /** Client IP (`req.socket.remoteAddress`, IPv4-mapped IPv6 unwrapped); null when unknown. */
    readonly ip: string | null;
    /** `User-Agent` header; only used to derive the coarse device label ("iPad", "Mac", …). */
    readonly userAgent: string | null;
    /**
     * Raw value of the `etab_edge_device` cookie (CONTRACTS.md §2.3), or null. It is a bearer secret: ports store and
     * compare only `sha256(value)` hex, never the value itself.
     */
    readonly deviceCookie: string | null;
}

/** An empty context (CLI, internal callers). */
export const NO_REQUEST_CONTEXT: EdgeRequestContext = Object.freeze({ ip: null, userAgent: null, deviceCookie: null });
