import { randomBytes, scryptSync } from 'crypto';
import { EventEmitter } from 'events';

import { EclipseTcpIngestService, HeldConnection, IngestSessionWorker, isHeldRoute } from './eclipse-tcp-ingest.service';
import { EclipseSessionService, EDGE_ROUTE_SCRYPT_N } from '../eclipse-session/eclipse-session.service';

/*
 * Spec §4.5 "Direct handshake for a live 'E' session" (edge-apply.port.ts "what step 8 must provide" item 8): when a
 * reporter's Eclipse reaches the CLOUD listener with the login of a venue-box session, the handshake is verified
 * against the session's dormant route (feedSource 'E', scrypt cost 2^15) and the connection is HELD: every
 * post-handshake byte goes, in order, to EdgeRawStoreService.openHeldStream's handle; nothing is parsed; the handle
 * is closed with the socket. Without the edge module the connection is dropped, never parsed.
 */

const SES = '7e0e0000-0000-4000-8000-0000000000e1';
const SES_D = '7e0e0000-0000-4000-8000-0000000000d1';
const BOX = 'b0c5b0c5-0000-4000-8000-0000000000b1';
const CASE = 'ca5e0000-0000-4000-8000-0000000000c1';

class FakeSocket extends EventEmitter {
  destroyed = false;
  remoteAddress = '203.0.113.7';
  destroy(): void { this.destroyed = true; }
}

/** A route as EclipseSessionService writes it; `edge` makes it a venue-box session's dormant route. */
function routeFor(nSesid: string, user: string, password: string, edge = false) {
  const salt = randomBytes(16);
  const hash = edge
    ? scryptSync(password, salt, 32, { N: EDGE_ROUTE_SCRYPT_N, maxmem: 64 * 1024 * 1024 })
    : scryptSync(password, salt, 32);
  return {
    nSesid,
    nCaseid: CASE,
    label: 'Hearing day 1',
    nLines: 25,
    user,
    passwordSalt: salt.toString('base64'),
    passwordHash: hash.toString('base64'),
    ...(edge ? { scryptN: EDGE_ROUTE_SCRYPT_N, feedSource: 'E', nEdgeid: BOX, epoch: 1 } : {}),
  };
}

/** A raw store whose held handle records what it is given; `open` resolves when the test says so. */
function fakeRawStore(opts: { fail?: boolean } = {}) {
  const writes: Array<[string, number | undefined]> = [];
  const closes: string[] = [];
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  const handle = {
    nOrphanid: 'orphan-1',
    nSesid: SES,
    write: jest.fn((chunk: Buffer, t?: number) => { writes.push([chunk.toString('latin1'), t]); return true; }),
    close: jest.fn(async (reason?: string) => { closes.push(String(reason)); return null; }),
  };
  const rawStore = {
    openHeldStream: jest.fn(async () => {
      await gate;
      if (opts.fail) throw new Error('capture dir not writable');
      return handle;
    }),
  };
  return { rawStore, handle, writes, closes, release };
}

function makeService(routes: Record<string, unknown>[], rawStore?: unknown) {
  const service = Object.create(EclipseTcpIngestService.prototype) as EclipseTcpIngestService;
  const logger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };
  const readEclipseRoutes = jest.fn().mockResolvedValue(routes);
  Object.assign(service as object, {
    logger,
    workers: new Map(),
    config: { get: jest.fn((key: string) => (key === 'ECLIPSE_TCP_INGEST' ? '1' : undefined)) },
    gateway: { ingestTcpData: jest.fn(), ingestFeedRefresh: jest.fn(), ingestAnnotRefresh: jest.fn(), server: { to: jest.fn(() => ({ emit: jest.fn() })) } },
    eclipseSession: {
      readEclipseRoutes,
      // the real check: the 'E' route's scrypt cost must be honoured
      eclipsePasswordMatches: (route: any, pass: string) => EclipseSessionService.prototype.eclipsePasswordMatches.call({}, route, pass),
    },
    rawStore,
  });
  const connect = () => {
    const sock = new FakeSocket();
    (service as any).handleConnection(sock);
    return sock;
  };
  return { service, logger, readEclipseRoutes, connect, workers: (service as any).workers as Map<string, IngestSessionWorker> };
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
const bytes = (text: string) => Buffer.from(text, 'latin1');

let parsed: string[];
beforeEach(() => {
  parsed = [];
  jest.spyOn(IngestSessionWorker.prototype, 'feed').mockImplementation(function (this: IngestSessionWorker, chunk: Buffer) {
    parsed.push(chunk.toString('latin1'));
  });
});
afterEach(() => jest.restoreAllMocks());

describe("EclipseTcpIngestService: a direct stream of a venue-box ('E') session is held, never parsed", () => {
  it('isHeldRoute: only a route with feedSource E', () => {
    expect(isHeldRoute({ feedSource: 'E' })).toBe(true);
    expect(isHeldRoute({ feedSource: 'e' })).toBe(true);
    expect(isHeldRoute({ feedSource: 'D' })).toBe(false);
    expect(isHeldRoute({})).toBe(false);
    expect(isHeldRoute(null)).toBe(false);
  });

  it('verifies the login against the dormant route (scrypt 2^15), opens a held capture and writes every byte in order', async () => {
    const store = fakeRawStore();
    const { workers, connect } = makeService([routeFor(SES, 'court1', 'venue-password-1', true)], store.rawStore);
    const sock = connect();
    sock.emit('data', bytes('court1\r\nvenue-password-1\r\nAB'));
    await settle();
    // bytes keep arriving while the capture is being opened
    sock.emit('data', bytes('CD'));
    sock.emit('data', bytes('EF'));
    expect(store.writes).toEqual([]);
    store.release();
    await settle();
    sock.emit('data', bytes('GH'));
    await settle();

    expect(store.rawStore.openHeldStream).toHaveBeenCalledTimes(1);
    expect(store.rawStore.openHeldStream).toHaveBeenCalledWith({ nSesid: SES, user: 'court1', peer: '203.0.113.7', connId: expect.any(String), nEdgeid: BOX });
    expect(store.writes.map(([text]) => text)).toEqual(['AB', 'CD', 'EF', 'GH']);
    expect(store.writes.every(([, t]) => typeof t === 'number')).toBe(true);
    expect(workers.size).toBe(0);
    expect(parsed).toEqual([]);
    expect(sock.destroyed).toBe(false);

    sock.emit('close');
    await settle();
    expect(store.closes).toEqual(['closed']);
  });

  it('a wrong password for the dormant route is refused like any other', async () => {
    const store = fakeRawStore();
    const { connect } = makeService([routeFor(SES, 'court1', 'venue-password-1', true)], store.rawStore);
    const sock = connect();
    sock.emit('data', bytes('court1\r\nvenue-password-2\r\nAB'));
    await settle();
    expect(sock.destroyed).toBe(true);
    expect(store.rawStore.openHeldStream).not.toHaveBeenCalled();
  });

  it('a socket that closes before the capture is open: its bytes are still written, then the capture is closed', async () => {
    const store = fakeRawStore();
    const { connect } = makeService([routeFor(SES, 'court1', 'venue-password-1', true)], store.rawStore);
    const sock = connect();
    sock.emit('data', bytes('court1\r\nvenue-password-1\r\nONLY'));
    await settle();
    sock.emit('close');
    store.release();
    await settle();
    expect(store.writes.map(([text]) => text)).toEqual(['ONLY']);
    expect(store.closes).toEqual(['closed']);
  });

  it('without the edge module the connection is dropped and nothing is parsed', async () => {
    const { connect, logger, workers } = makeService([routeFor(SES, 'court1', 'venue-password-1', true)], undefined);
    const sock = connect();
    sock.emit('data', bytes('court1\r\nvenue-password-1\r\nAB'));
    await settle();
    sock.emit('data', bytes('CD'));
    await settle();
    expect(sock.destroyed).toBe(true);
    expect(workers.size).toBe(0);
    expect(parsed).toEqual([]);
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('edge module is not loaded'));
  });

  it('a capture that cannot be opened drops the connection (never parsed)', async () => {
    const store = fakeRawStore({ fail: true });
    const { connect, logger } = makeService([routeFor(SES, 'court1', 'venue-password-1', true)], store.rawStore);
    const sock = connect();
    sock.emit('data', bytes('court1\r\nvenue-password-1\r\nAB'));
    await settle();
    store.release();
    await settle();
    expect(sock.destroyed).toBe(true);
    expect(parsed).toEqual([]);
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('could not be opened'));
  });

  it.each([
    ['removed (split or seal)', [] as any[]],
    ["rewritten as direct cloud ('D')", [{ ...routeFor(SES, 'court1', 'venue-password-1'), feedSource: 'D' }]],
  ])('the held stream ends when its route is %s, so the reconnect is matched afresh', async (_why, after) => {
    const store = fakeRawStore();
    const { connect, readEclipseRoutes } = makeService([routeFor(SES, 'court1', 'venue-password-1', true)], store.rawStore);
    const sock = connect();
    sock.emit('data', bytes('court1\r\nvenue-password-1\r\nAB'));
    await settle();
    store.release();
    await settle();
    readEclipseRoutes.mockResolvedValue(after);
    sock.emit('data', bytes('CD'));
    await settle();
    expect(sock.destroyed).toBe(true);
    expect(store.closes).toEqual(['route-gone']);
    // the chunk that arrived before the route read is still recorded (arrival order, held bytes are kept)
    expect(store.writes.map(([text]) => text)).toEqual(['AB', 'CD']);
  });

  it('a direct-cloud route beside it keeps today\'s parsed path', async () => {
    const store = fakeRawStore();
    const { connect, workers } = makeService([routeFor(SES, 'court1', 'venue-password-1', true), routeFor(SES_D, 'court2', 'direct-pw')], store.rawStore);
    const sock = connect();
    sock.emit('data', bytes('court2\r\ndirect-pw\r\nLIVE'));
    await settle();
    expect(workers.has(SES_D)).toBe(true);
    expect(parsed).toEqual(['LIVE']);
    expect(store.rawStore.openHeldStream).not.toHaveBeenCalled();
  });
});

describe('HeldConnection', () => {
  const logger = { error: jest.fn(), warn: jest.fn() };

  it('ignores empty chunks and anything after close', async () => {
    const writes: string[] = [];
    const stream = { nOrphanid: 'o', nSesid: SES, write: (b: Buffer) => { writes.push(b.toString()); return true; }, close: jest.fn(async () => null) };
    const held = new HeldConnection(SES, logger as any);
    held.attach(Promise.resolve(stream), jest.fn());
    held.push(Buffer.alloc(0));
    held.push(bytes('a'));
    await settle();
    held.push(bytes('b'));
    held.close('closed');
    held.close('again');
    held.push(bytes('c'));
    expect(writes).toEqual(['a', 'b']);
    expect(stream.close).toHaveBeenCalledTimes(1);
    expect(stream.close).toHaveBeenCalledWith('closed');
    expect(held.isClosed).toBe(true);
  });
});
