/**
 * The socket.io server options of realtime-server (RT edge spec section 5.3 "Transport", section 7 row
 * `RS/main.ts`; edge-apply.port.ts "what step 8 must provide" item 9).
 *
 * realtime-server runs ONE socket.io server: the gateways on `/` (AppGateway, EventsGateway) and the venue
 * boxes' `/edge` namespace, which EdgeUplinkGateway creates with `io.of('/edge')` outside Nest (D5) on that
 * same server. `maxHttpBufferSize` and `perMessageDeflate` are Engine.IO options: they belong to the server,
 * not to a namespace, so `/edge` gets them only if the shared server is created with them. Nest creates that
 * server once, from whichever gateway it binds first, through the WebSocket adapter; so the options are set
 * here, in the adapter, where every gateway's server creation passes.
 *
 * Viewer sockets share the engine, so they get the same values. They are kept as close to today's as the
 * boxes allow:
 * - maxHttpBufferSize: Engine.IO's default is 1e6 bytes (today's limit for everyone). A round part or a
 *   single oversized page may be up to MAX_SOCKET_BUFFER_BYTES (1e6) bytes of JSON (libs/edge-sync round.ts),
 *   and socket.io frames it as `42/edge,<ack>["e.round",…]`, so 16 KiB of framing headroom is added: the
 *   inbound cap rises by 1.6 %, nothing more.
 * - perMessageDeflate: off by default in Engine.IO. On with Engine.IO's documented threshold (messages under
 *   1 KiB are never compressed: viewers' live lines stay as they are, transcript pages and rounds shrink)
 *   only where venue boxes are on (EDGE_ENABLED): a server without boxes keeps today's transport exactly,
 *   with no per-socket zlib cost for viewers. `RT_SOCKET_DEFLATE` set to yes/no overrides that either way.
 */
import { WsAuthIoAdapter } from '@app/global/utility/ws-auth/ws-auth';
import { MAX_SOCKET_BUFFER_BYTES } from '@app/edge-sync';

/** socket.io framing around the largest part the edge protocol sends (namespace, ack id, event name). */
export const SOCKET_FRAME_HEADROOM_BYTES = 16 * 1024;

/** The shared server's inbound message cap (Engine.IO `maxHttpBufferSize`). */
export const REALTIME_SOCKET_MAX_BUFFER_BYTES = MAX_SOCKET_BUFFER_BYTES + SOCKET_FRAME_HEADROOM_BYTES;

/** permessage-deflate as Engine.IO documents it: only messages of at least 1 KiB are compressed. */
export const REALTIME_SOCKET_DEFLATE = Object.freeze({ threshold: 1024 });

/**
 * Whether the shared server negotiates permessage-deflate. An explicit `RT_SOCKET_DEFLATE` wins: 0 / false /
 * off / no turns it off, any other non-empty value on. Unset (or empty), it follows `EDGE_ENABLED` (1 / true /
 * on / yes): deflate is for the boxes' rounds, so a server without venue boxes keeps today's transport.
 */
export function socketDeflateEnabled(value: unknown, edgeEnabled: unknown = undefined): boolean {
    const explicit = value === undefined || value === null ? '' : String(value).trim();
    if (explicit !== '') return !/^(0|false|off|no)$/i.test(explicit);
    const edge = edgeEnabled === undefined || edgeEnabled === null ? '' : String(edgeEnabled).trim();
    return /^(1|true|on|yes)$/i.test(edge);
}

/**
 * The options a new socket.io server is created with: the gateway's own options (cors, …) plus the shared
 * transport settings. A larger `maxHttpBufferSize` a gateway asks for is kept; deflate options a gateway
 * sets itself are kept too.
 */
export function realtimeSocketServerOptions(options: Record<string, any> | undefined, deflate = true): Record<string, any> {
    const out: Record<string, any> = { ...(options ?? {}) };
    const asked = Number(out.maxHttpBufferSize);
    out.maxHttpBufferSize = Number.isFinite(asked) && asked > REALTIME_SOCKET_MAX_BUFFER_BYTES ? asked : REALTIME_SOCKET_MAX_BUFFER_BYTES;
    if (!deflate) out.perMessageDeflate = false;
    else if (out.perMessageDeflate === undefined || out.perMessageDeflate === true) out.perMessageDeflate = { ...REALTIME_SOCKET_DEFLATE };
    return out;
}

/**
 * WsAuthIoAdapter (connection-time auth on `/`, unchanged) whose server is created with the shared transport
 * settings above. `/edge` (io.of('/edge'), outside Nest) inherits them from the server; the ws-auth middleware
 * still covers only the namespaces Nest creates.
 */
export class RealtimeIoAdapter extends WsAuthIoAdapter {
    constructor(
        app: ConstructorParameters<typeof WsAuthIoAdapter>[0],
        deps: ConstructorParameters<typeof WsAuthIoAdapter>[1],
        enforce: ConstructorParameters<typeof WsAuthIoAdapter>[2],
        private readonly deflate: () => boolean = () => true,
    ) {
        super(app, deps, enforce);
    }

    createIOServer(port: number, options?: any): any {
        return super.createIOServer(port, realtimeSocketServerOptions(options, this.deflate()));
    }
}
