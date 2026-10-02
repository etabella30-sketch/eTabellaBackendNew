/**
 * SKELETON STUB of LanPort: no controllers, no gateway, no sockets. Replace with the LAN module (controllers for
 * EDGE_ROUTES, `/edge-config.json`, `/edge/ping`, the static FE bundle, the `/realtimeapi` proxy and the socket.io
 * gateway; keep LAN_PORT; change `useClass` in lan.module.ts).
 */
import { Injectable } from '@nestjs/common';

import { LanPort } from '../ports';

@Injectable()
export class LanStub implements LanPort {
    async start(): Promise<void> {
        /* skeleton: nothing to start */
    }

    async close(): Promise<void> {
        /* skeleton: no sockets */
    }

    viewerCount(_nSesid?: string): number {
        return 0;
    }
}
