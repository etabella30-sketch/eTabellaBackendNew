import { randomBytes, scryptSync } from 'crypto';
import { EventEmitter } from 'events';

import { EclipseTcpIngestService, IngestSessionWorker } from './eclipse-tcp-ingest.service';
import { EclipseSessionService } from '../eclipse-session/eclipse-session.service';
import { EventsGateway } from '../../events/events.gateway';
import { UsersService } from '../users/users.service';

/**
 * Characterization of today's in-process path for cloud-direct Eclipse sessions (RT edge plan
 * R-T2 / D14, preserved behaviour (1): "with ECLIPSE_CUT_APPLY off, cloud-direct sessions keep
 * today's in-process dispatch").
 *
 * ECLIPSE_CUT_APPLY does not exist in the code yet (checked 2026-10-01), and the route records that
 * POST /session/eclipse writes today carry no `apply` field. "Off" is therefore today's path, pinned
 * here with real route records: handshake -> credential match -> one IngestSessionWorker per session
 * -> parser deliveries dispatched straight into the gateway's ingest* bodies.
 *
 * Deliberately NOT pinned, because the ledger lists them as intended changes: a second concurrent
 * CAT connection for a session (to be held), chunk ordering under slow route reads (serialized chunk
 * lane), and what happens when the route file cannot be read (route cache keeps the last good routes).
 *
 * Already pinned in eclipse-tcp-ingest.service.spec.ts, not repeated: disabled without
 * ECLIPSE_TCP_INGEST=1, a valid handshake feeding its remainder (with resolveWorker stubbed), invalid
 * credentials dropped, the stream killed once its route is gone, Bridge/CaseView detection, and the
 * event-to-gateway mapping of `dispatch`.
 *
 * Nothing listens or touches the disk: sockets are fakes and IngestSessionWorker.feed is replaced by
 * a recorder (the real one writes captures under tools/feed-replay).
 */

const SES = '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d';
const SES_B = '1b2c3d4e-5f6a-4b7c-8d9e-0f1a2b3c4d5e';
const CASE = '44444444-4444-4444-8444-444444444444';

class FakeSocket extends EventEmitter {
  destroyed = false;
  remoteAddress = '10.0.0.5';
  destroy(): void { this.destroyed = true; }
}

/** A route record as EclipseSessionService.writeEclipseRoute writes it (salted scrypt hash). */
function routeFor(nSesid: string, user: string, password: string, extra: Record<string, unknown> = {}) {
  const salt = randomBytes(16);
  return {
    nSesid,
    nCaseid: CASE,
    label: 'Hearing day 1',
    nLines: 25,
    user,
    cTimezone: 'Europe/London',
    passwordSalt: salt.toString('base64'),
    passwordHash: scryptSync(password, salt, 32).toString('base64'),
    ...extra,
  };
}

function makeService(routes: Record<string, unknown>[], gateway?: any) {
  const service = Object.create(EclipseTcpIngestService.prototype) as EclipseTcpIngestService;
  const env: Record<string, string | undefined> = { ECLIPSE_TCP_INGEST: '1', ECLIPSE_CUT_APPLY: undefined };
  const logger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };
  const eclipseSession = {
    readEclipseRoutes: jest.fn().mockResolvedValue(routes),
    // The real check, so a handshake is matched exactly as in production.
    eclipsePasswordMatches: jest.fn((route: any, pass: string) => EclipseSessionService.prototype.eclipsePasswordMatches.call({}, route, pass)),
  };
  Object.assign(service as object, {
    logger,
    workers: new Map(),
    config: { get: jest.fn((key: string) => env[key]) },
    gateway: gateway ?? {
      ingestTcpData: jest.fn().mockResolvedValue(undefined),
      ingestFeedRefresh: jest.fn().mockResolvedValue(undefined),
      ingestAnnotRefresh: jest.fn().mockResolvedValue(undefined),
      server: { to: jest.fn(() => ({ emit: jest.fn() })) },
    },
    eclipseSession,
  });
  const workers = (service as any).workers as Map<string, IngestSessionWorker>;
  /** Opens a fake Eclipse connection on the listener. */
  const connect = () => {
    const sock = new FakeSocket();
    (service as any).handleConnection(sock);
    return sock;
  };
  return { service, logger, eclipseSession, workers, connect };
}

/** Handshake handling is async (route re-read); let it finish. */
const settle = () => new Promise(resolve => setTimeout(resolve, 0));
const bytes = (text: string) => Buffer.from(text, 'latin1');

/** What each session worker was fed, in order: [nSesid, bytes]. */
let fed: Array<[string, string]>;

beforeEach(() => {
  fed = [];
  jest.spyOn(console, 'log').mockImplementation(() => { });
  jest.spyOn(IngestSessionWorker.prototype, 'feed').mockImplementation(function (this: IngestSessionWorker, chunk: Buffer) {
    fed.push([this.nSesid, chunk.toString('latin1')]);
  });
});
afterEach(() => jest.restoreAllMocks());

describe('EclipseTcpIngestService (characterization): handshake to session worker', () => {
  it('a valid handshake binds the stream to a worker configured from the route, and feeds it what follows', async () => {
    const { workers, connect } = makeService([routeFor(SES, 'court1', 'secret-pw')]);
    const sock = connect();
    sock.emit('data', bytes('court1\r\nsecret-pw\r\n\x02P\x01\x00\x03'));
    await settle();

    const worker = workers.get(SES);
    expect(worker).toBeInstanceOf(IngestSessionWorker);
    expect((worker as any).cfg).toEqual({ nSesid: SES, label: 'Hearing day 1', nLines: 25, cTimezone: 'Europe/London' });
    expect(fed).toEqual([[SES, '\x02P\x01\x00\x03']]);
    expect(sock.destroyed).toBe(false);
  });

  it('route defaults: the label falls back to the Eclipse user, lines per page to 25, the timezone to the server zone', async () => {
    const bare = routeFor(SES, 'court1', 'pw');
    delete (bare as any).label;
    delete (bare as any).nLines;
    delete (bare as any).cTimezone;
    const { workers, connect } = makeService([bare, routeFor(SES_B, 'court2', 'pw', { nLines: '25' })]);
    connect().emit('data', bytes('court1\r\npw\r\n'));
    connect().emit('data', bytes('court2\r\npw\r\n'));
    await settle();

    expect((workers.get(SES) as any).cfg).toEqual({ nSesid: SES, label: 'court1', nLines: 25, cTimezone: undefined });
    expect((workers.get(SES_B) as any).cfg.nLines).toBe(25);
  });

  it('the user name must match exactly and the password must match the route\'s salted hash', async () => {
    const { workers, connect } = makeService([routeFor(SES, 'court1', 'secret-pw')]);
    const attempts = ['court1\r\nwrong\r\n', 'Court1\r\nsecret-pw\r\n', 'court1 \r\nsecret-pw\r\n', ' court1\r\nsecret-pw\r\n', 'court1\r\nsecret-pw \r\n'];
    const socks = attempts.map(handshake => {
      const sock = connect();
      sock.emit('data', bytes(`${handshake}FEED`));
      return sock;
    });
    await settle();

    expect(socks.map(sock => sock.destroyed)).toEqual([true, true, true, true, true]);
    expect(workers.size).toBe(0);
    expect(fed).toEqual([]);
  });

  // The default route file is tools/feed-replay/sessions.runtime.json, the one multi-session-bridge
  // also reads, where a hand-written route may still carry a plain `pass` instead of a salted hash.
  it('a hand-written route with a plain `pass` still matches, exactly', async () => {
    const { workers, connect } = makeService([{ nSesid: SES, user: 'court1', pass: 'plain-pw', label: 'Hand-written', nLines: 25 }]);
    const wrong = connect();
    wrong.emit('data', bytes('court1\r\nplain-pw2\r\nX'));
    const right = connect();
    right.emit('data', bytes('court1\r\nplain-pw\r\nFEED'));
    await settle();

    expect(wrong.destroyed).toBe(true);
    expect(right.destroyed).toBe(false);
    expect((workers.get(SES) as any).cfg).toEqual({ nSesid: SES, label: 'Hand-written', nLines: 25, cTimezone: undefined });
    expect(fed).toEqual([[SES, 'FEED']]);
  });

  it('a matching route without a session id drops the connection', async () => {
    const { workers, connect } = makeService([routeFor('', 'court1', 'pw')]);
    const sock = connect();
    sock.emit('data', bytes('court1\r\npw\r\nFEED'));
    await settle();

    expect(sock.destroyed).toBe(true);
    expect(workers.size).toBe(0);
  });

  it('the handshake may arrive in pieces; everything after it goes to the worker in order', async () => {
    const { eclipseSession, connect } = makeService([routeFor(SES, 'court1', 'secret-pw')]);
    const sock = connect();
    sock.emit('data', bytes('cou'));
    sock.emit('data', bytes('rt1\r\nsecret'));
    expect(eclipseSession.readEclipseRoutes).not.toHaveBeenCalled();
    sock.emit('data', bytes('-pw\r\nAB'));
    await settle();
    sock.emit('data', bytes('CD'));
    await settle();

    expect(fed).toEqual([[SES, 'AB'], [SES, 'CD']]);
    expect(sock.destroyed).toBe(false);
  });

  it('an unfinished handshake waits up to 512 bytes, then the connection is dropped', async () => {
    const { eclipseSession, connect } = makeService([routeFor(SES, 'court1', 'pw')]);
    const waiting = [connect(), connect()];
    waiting[0].emit('data', Buffer.alloc(512, 0x78)); // no CRLF yet, exactly 512 bytes
    waiting[1].emit('data', bytes(`court1\r\n${'p'.repeat(504)}`)); // second line unfinished, 512 bytes
    const dropped = [connect(), connect()];
    dropped[0].emit('data', Buffer.alloc(513, 0x78));
    dropped[1].emit('data', bytes(`court1\r\n${'p'.repeat(505)}`));
    await settle();

    expect(waiting.map(sock => sock.destroyed)).toEqual([false, false]);
    expect(dropped.map(sock => sock.destroyed)).toEqual([true, true]);
    expect(eclipseSession.readEclipseRoutes).not.toHaveBeenCalled();
  });

  it('one worker per session: Eclipse reconnecting after its stream closed continues on the same worker', async () => {
    const { workers, connect } = makeService([routeFor(SES, 'court1', 'pw')]);
    const first = connect();
    first.emit('data', bytes('court1\r\npw\r\nONE'));
    await settle();
    const worker = workers.get(SES);
    first.emit('close');

    const second = connect();
    second.emit('data', bytes('court1\r\npw\r\nTWO'));
    await settle();

    expect(workers.size).toBe(1);
    expect(workers.get(SES)).toBe(worker);
    expect(fed).toEqual([[SES, 'ONE'], [SES, 'TWO']]);
  });

  it('two hearings on the one listener stay apart: each stream feeds only its own session', async () => {
    const { workers, connect } = makeService([routeFor(SES, 'court1', 'pw1'), routeFor(SES_B, 'court2', 'pw2')]);
    const a = connect();
    const b = connect();
    a.emit('data', bytes('court1\r\npw1\r\nA1'));
    b.emit('data', bytes('court2\r\npw2\r\nB1'));
    await settle();
    b.emit('data', bytes('B2'));
    await settle();
    a.emit('data', bytes('A2'));
    await settle();

    expect(workers.size).toBe(2);
    expect(fed.filter(([sesid]) => sesid === SES).map(([, text]) => text)).toEqual(['A1', 'A2']);
    expect(fed.filter(([sesid]) => sesid === SES_B).map(([, text]) => text)).toEqual(['B1', 'B2']);
  });
});

describe('EclipseTcpIngestService (characterization): in-process dispatch into the gateway', () => {
  function realGateway() {
    const emitted: Array<{ room: string; event: string; payload: any }> = [];
    const feed = {
      sanitizeLineCodes: jest.fn((codes: any) => codes),
      feedReceive: jest.fn(),
      refreshReceive: jest.fn(),
      checkSessionExists: jest.fn().mockReturnValue(false),
      streamSessionData: jest.fn(),
    };
    const gateway = new EventsGateway(
      { stopDemoStream: jest.fn(), streamData: jest.fn(), streamDataByPage: jest.fn(), streamDemoData: jest.fn() } as any,
      { saveLostData: jest.fn() } as any,
      { joiningLog: jest.fn(), getSessiondata: jest.fn() } as any,
      new UsersService(),
      { getAnnotationOfPages: jest.fn() } as any,
      {} as any,
      feed as any,
      {} as any,
      { rowQuery: jest.fn() } as any,
    );
    gateway.server = { to: jest.fn((room: string) => ({ emit: (event: string, payload: any) => emitted.push({ room, event, payload }) })) } as any;
    (gateway as any).logger = { log: jest.fn(), warn: jest.fn(), error: jest.fn(), fatal: jest.fn(), verbose: jest.fn() };
    return { gateway, feed, emitted };
  }

  /** The worker's sink, as the parser sees it, after a real handshake. */
  async function sinkAfterHandshake(gateway: any) {
    const ctx = makeService([routeFor(SES, 'court1', 'pw')], gateway);
    ctx.connect().emit('data', bytes('court1\r\npw\r\n'));
    await settle();
    return { ...ctx, sink: (ctx.workers.get(SES) as any).sink };
  }

  it('parser deliveries reach the gateway ingest bodies: the feed store and room S<nSesid>, payloads unchanged', async () => {
    const { gateway, feed, emitted } = realGateway();
    const { sink } = await sinkAfterHandshake(gateway);
    const tcpData = { i: 0, d: [['10:00:00:00', [65], 0, 'FL', 1, 1, 1, [], 0]], date: SES, l: 25, p: 1 };
    const refresh = { nSesid: SES, startInd: 0, endInd: 1, newLines: [], start: '10:00:00:00', end: '10:00:01:00', startPage: 1, current_refresh: 1 };
    const annot = { nSesid: SES, cType: 'R', data: [] };
    const replace = { date: SES, d: [] };

    sink.emitDelivery('TCP-DATA', tcpData);
    sink.emitDelivery('feed-refresh-data', refresh);
    sink.emitDelivery('annot-refresh-transfer', annot);
    sink.emitDelivery('line-replace', replace);
    await settle();

    expect(feed.feedReceive).toHaveBeenCalledWith(tcpData);
    expect(feed.refreshReceive).toHaveBeenCalledWith(refresh);
    expect(emitted).toEqual([
      { room: `S${SES}`, event: 'message', payload: tcpData },
      { room: `S${SES}`, event: 'feed-refresh-data', payload: refresh },
      { room: `S${SES}`, event: 'annot-refresh-transfer', payload: annot },
      { room: `S${SES}`, event: 'line-replace', payload: replace },
    ]);
  });

  it('the parser\'s local emits go nowhere: only deliveries reach viewers', async () => {
    const { gateway, feed, emitted } = realGateway();
    const { sink } = await sinkAfterHandshake(gateway);
    sink.emitLocal('message', { date: SES, d: [] });
    sink.emitLocal('feed-refresh-data', { nSesid: SES });
    await settle();

    expect(feed.feedReceive).not.toHaveBeenCalled();
    expect(emitted).toEqual([]);
  });

  it('an unmapped delivery goes to S<date>, else S<nSesid>; one naming neither is dropped with a warning', async () => {
    const { gateway, emitted } = realGateway();
    const { sink, logger } = await sinkAfterHandshake(gateway);
    sink.emitDelivery('line-replace', { nSesid: SES, d: [] });
    sink.emitDelivery('line-replace', { d: [] });

    expect(emitted).toEqual([{ room: `S${SES}`, event: 'line-replace', payload: { nSesid: SES, d: [] } }]);
    expect(logger.warn).toHaveBeenCalledWith("Eclipse ingest: unroutable delivery 'line-replace'");
  });

  // With the real gateway only the unmapped branch can throw synchronously, e.g. while the socket.io
  // server is not attached yet: `server.to` then throws inside dispatch's try.
  it('a synchronous throw while dispatching is logged, not thrown back into the parser', async () => {
    const { gateway } = realGateway();
    const { sink, logger } = await sinkAfterHandshake(gateway);
    gateway.server = undefined as any;

    expect(() => sink.emitDelivery('line-replace', { date: SES, d: [] })).not.toThrow();
    expect(logger.error).toHaveBeenCalledWith(expect.stringMatching(/^Eclipse ingest dispatch 'line-replace' failed: /));
  });

  // Today's gap, pinned so that a change to it shows up here; the ledger does not ask to keep it. The
  // gateway's ingest* bodies are async, so a failure inside one (here the feed store throwing) is a
  // rejected promise that dispatch discards with `void`: its try/catch never sees it and nothing is
  // logged. Nothing else in apps/realtime-server handles the rejection either (no unhandledRejection
  // handler), so under Node's default it surfaces as an uncaught exception. When a change awaits and
  // logs these failures, rewrite this test to that outcome.
  it('an async failure inside a gateway ingest body is neither caught nor logged by dispatch (today\'s gap)', async () => {
    const { gateway, feed, emitted } = realGateway();
    feed.feedReceive.mockImplementation(() => { throw new Error('store down'); });
    const ingest = jest.spyOn(gateway, 'ingestTcpData'); // calls through to the real async body
    const { sink, logger } = await sinkAfterHandshake(gateway);

    expect(() => sink.emitDelivery('TCP-DATA', { date: SES, d: [] })).not.toThrow();
    expect(ingest).toHaveBeenCalledTimes(1);
    // Observed here, in the same turn, so the rejection does not escape into the jest run.
    await expect(ingest.mock.results[0].value).rejects.toThrow('store down');
    expect(logger.error).not.toHaveBeenCalled();
    expect(emitted).toEqual([]);
  });
});
