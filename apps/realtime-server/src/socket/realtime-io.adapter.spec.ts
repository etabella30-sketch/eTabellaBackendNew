import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Server } from 'socket.io';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';

import { MAX_SOCKET_BUFFER_BYTES } from '@app/edge-sync';
import { WsAuthIoAdapter } from '@app/global/utility/ws-auth/ws-auth';
import {
  REALTIME_SOCKET_DEFLATE,
  REALTIME_SOCKET_MAX_BUFFER_BYTES,
  RealtimeIoAdapter,
  realtimeSocketServerOptions,
  socketDeflateEnabled,
} from './realtime-io.adapter';

/**
 * The shared socket.io server's transport options (RT edge spec 5.3; edge-apply.port.ts item 9): set in the
 * adapter, so the venue boxes' /edge namespace, which EdgeUplinkGateway creates with io.of('/edge') OUTSIDE
 * Nest once the gateways are bound, gets them from the server it shares with the viewers.
 */

describe('realtimeSocketServerOptions', () => {
  it('adds the 1 MB part cap with framing headroom and permessage-deflate (1 KiB threshold), keeping the gateway\'s own options', () => {
    const cors = { origin: true, credentials: true };
    expect(realtimeSocketServerOptions({ cors })).toEqual({ cors, maxHttpBufferSize: REALTIME_SOCKET_MAX_BUFFER_BYTES, perMessageDeflate: { threshold: 1024 } });
    expect(realtimeSocketServerOptions(undefined)).toEqual({ maxHttpBufferSize: REALTIME_SOCKET_MAX_BUFFER_BYTES, perMessageDeflate: { threshold: 1024 } });
    // The protocol's largest part, plus no more than 16 KiB of headroom over Engine.IO's 1e6 default.
    expect(MAX_SOCKET_BUFFER_BYTES).toBe(1_000_000);
    expect(REALTIME_SOCKET_MAX_BUFFER_BYTES).toBe(1_000_000 + 16 * 1024);
  });

  it('keeps a larger cap or deflate settings a gateway asks for, and turns deflate off when told', () => {
    expect(realtimeSocketServerOptions({ maxHttpBufferSize: 5e6 }).maxHttpBufferSize).toBe(5e6);
    expect(realtimeSocketServerOptions({ maxHttpBufferSize: 10 }).maxHttpBufferSize).toBe(REALTIME_SOCKET_MAX_BUFFER_BYTES);
    expect(realtimeSocketServerOptions({ perMessageDeflate: { threshold: 4096 } }).perMessageDeflate).toEqual({ threshold: 4096 });
    expect(realtimeSocketServerOptions({}, false).perMessageDeflate).toBe(false);
    expect(REALTIME_SOCKET_DEFLATE).toEqual({ threshold: 1024 });
  });

  it('deflate follows EDGE_ENABLED unless RT_SOCKET_DEFLATE says otherwise', () => {
    // Unset RT_SOCKET_DEFLATE: on only where venue boxes are on.
    for (const unset of [undefined, null, '', '  ']) {
      expect(socketDeflateEnabled(unset)).toBe(false);
      expect(socketDeflateEnabled(unset, undefined)).toBe(false);
      expect(socketDeflateEnabled(unset, '0')).toBe(false);
      for (const edgeOn of ['1', 'true', 'ON', ' yes ']) expect(socketDeflateEnabled(unset, edgeOn)).toBe(true);
    }
    // Explicit RT_SOCKET_DEFLATE wins either way.
    for (const on of ['1', 'true', 'on', 'yes']) {
      expect(socketDeflateEnabled(on)).toBe(true);
      expect(socketDeflateEnabled(on, '0')).toBe(true);
    }
    for (const off of ['0', 'false', 'OFF', ' no ', 0, false]) {
      expect(socketDeflateEnabled(off)).toBe(false);
      expect(socketDeflateEnabled(off, '1')).toBe(false);
    }
  });
});

@WebSocketGateway({ cors: { origin: true, credentials: true } })
class ProbeGateway {
  @WebSocketServer() server: Server;
}

describe('RealtimeIoAdapter over a real socket.io server (loopback, ephemeral port)', () => {
  let app: INestApplication;
  let io: Server;
  let url: string;
  const clients: ClientSocket[] = [];

  const connectEdge = (): Promise<ClientSocket> => new Promise((resolve, reject) => {
    const socket = ioClient(`${url}/edge`, { transports: ['websocket'], reconnection: false, forceNew: true });
    clients.push(socket);
    socket.once('connect', () => resolve(socket));
    socket.once('connect_error', reject);
  });

  /** A payload whose JSON is exactly `bytes` long (an e.round part of that size). */
  const partOf = (bytes: number) => ({ pages: 'x'.repeat(bytes - JSON.stringify({ pages: '' }).length) });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ providers: [ProbeGateway] }).compile();
    moduleRef.useLogger(false);
    app = moduleRef.createNestApplication({ logger: false });
    app.useWebSocketAdapter(new RealtimeIoAdapter(app, () => ({ jwtSecret: 'probe', serviceKey: 'probe', getValue: async () => null }), () => false));
    await app.listen(0, '127.0.0.1');
    const { port } = app.getHttpServer().address();
    url = `http://127.0.0.1:${port}`;
    io = app.get(ProbeGateway).server;
    // As EdgeUplinkGateway.attach does, after Nest bound its gateways: a namespace made outside Nest.
    io.of('/edge').on('connection', socket => {
      socket.on('e.round', (part: any, ack: (reply: unknown) => void) => ack({ ok: true, bytes: JSON.stringify(part).length }));
    });
  });

  afterEach(() => {
    while (clients.length) clients.pop()!.disconnect();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('creates the one shared server with the cap and deflate; the ws-auth adapter is still the one in use', () => {
    expect((io as any).engine.opts.maxHttpBufferSize).toBe(REALTIME_SOCKET_MAX_BUFFER_BYTES);
    expect((io as any).engine.opts.perMessageDeflate).toMatchObject({ threshold: 1024 });
    expect(io.of('/edge').server).toBe(io);
    // ws-auth's connection middleware sits on the namespaces Nest created, never on /edge.
    expect((io.of('/') as any)._fns.length).toBe(1);
    expect((io.of('/edge') as any)._fns.length).toBe(0);
    expect(new RealtimeIoAdapter(app, () => ({} as any), () => false)).toBeInstanceOf(WsAuthIoAdapter);
  });

  it('a box on /edge negotiates permessage-deflate and gets a 1 MB part (the protocol\'s hard maximum) through', async () => {
    const box = await connectEdge();
    expect(String((box.io as any).engine.transport.ws.extensions)).toContain('permessage-deflate');
    const reply = await box.timeout(10_000).emitWithAck('e.round', partOf(MAX_SOCKET_BUFFER_BYTES));
    expect(reply).toEqual({ ok: true, bytes: MAX_SOCKET_BUFFER_BYTES });
  });

  it('still refuses a message above the cap: the limit is raised by the framing headroom only', async () => {
    const box = await connectEdge();
    const closed = new Promise<string>(resolve => box.once('disconnect', reason => resolve(String(reason))));
    box.emit('e.round', partOf(REALTIME_SOCKET_MAX_BUFFER_BYTES + 4096));
    await expect(closed).resolves.toMatch(/transport (close|error)/);
  });
});
