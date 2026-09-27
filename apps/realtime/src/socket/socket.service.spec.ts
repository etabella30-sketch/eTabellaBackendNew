const ioMock = jest.fn();
jest.mock('socket.io-client', () => ({ io: (...args: any[]) => ioMock(...args) }));

import { SocketService } from './socket.service';
import { SERVICE_KEY_HEADER } from '../utility/live-server-auth';

/** Minimal socket.io-client socket: records handlers so a test can fire events. */
function fakeClientSocket() {
  const handlers: Record<string, (...a: any[]) => void> = {};
  return {
    connected: false,
    on: jest.fn((ev: string, h: (...a: any[]) => void) => { handlers[ev] = h; }),
    emit: jest.fn(),
    close: jest.fn(),
    fire: (ev: string, ...a: any[]) => handlers[ev]?.(...a),
  };
}

function configOf(values: Record<string, string | undefined>) {
  return { get: (key: string) => values[key] } as any;
}

function makeService(env: Record<string, string | undefined>, servers: any[] = []) {
  const log = { info: jest.fn(), error: jest.fn() };
  const sessionServers = { getSessionsServers: jest.fn().mockResolvedValue(servers), currentSessionid: null };
  const ios = { server: { emit: jest.fn() } };
  const service = new SocketService(ios as any, sessionServers as any, {} as any, {} as any, log as any, configOf(env));
  return { service, log, sessionServers };
}

describe('SocketService (venue -> live realtime-server sockets)', () => {
  beforeEach(() => {
    ioMock.mockReset();
    ioMock.mockImplementation(() => fakeClientSocket());
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('presents REALTIME_SERVICE_KEY as auth.serviceKey on a live-server connection', () => {
    const { service } = makeService({ REALTIME_SERVICE_KEY: 'svc-key-1' });
    service.connectToWebSocket('http://live.example.test:2086');

    expect(ioMock).toHaveBeenCalledTimes(1);
    const [url, opts] = ioMock.mock.calls[0];
    expect(url).toBe('http://live.example.test:2086');
    expect(opts).toEqual({ reconnection: false, auth: { serviceKey: 'svc-key-1' } });
    // Never in the query string (it would end up in access logs).
    expect(opts.query).toBeUndefined();
  });

  it('sends no auth when no key is configured (unchanged behaviour)', () => {
    const { service } = makeService({});
    service.connectToWebSocket('http://live.example.test:2086');
    const [, opts] = ioMock.mock.calls[0];
    expect(opts).toEqual({ reconnection: false });
    expect(opts).not.toHaveProperty('auth');
  });

  it('uses the same key lookup as the HTTP sync routes', () => {
    const { service } = makeService({ REALTIME_SERVICE_KEY: 'k2' });
    expect(service.liveServerSocketAuth()).toEqual({ serviceKey: 'k2' });
    expect(SERVICE_KEY_HEADER).toBe('x-etabella-service-key');
    expect(makeService({ REALTIME_SERVICE_KEY: '' }).service.liveServerSocketAuth()).toBeUndefined();
  });

  it('dials every session server of the case with the key', async () => {
    const { service, sessionServers } = makeService({ REALTIME_SERVICE_KEY: 'k3' }, [
      { cUrl: 'rt-a.example.test', nPort: 2086 },
      { cUrl: 'rt-b.example.test', nPort: 5005 },
      { cUrl: '', nPort: 1 }, // skipped, as before
    ]);
    await service.fetchAllServerDetail('7f1b2c3d-0000-4000-8000-000000000001');
    expect(sessionServers.getSessionsServers).toHaveBeenCalled();
    expect(ioMock.mock.calls.map(c => c[0])).toEqual(['http://rt-a.example.test:2086', 'http://rt-b.example.test:5005']);
    for (const [, opts] of ioMock.mock.calls) expect(opts.auth).toEqual({ serviceKey: 'k3' });
  });

  it('a refused handshake is logged with a hint and retried on the usual timer', () => {
    const { service, log } = makeService({ REALTIME_SERVICE_KEY: 'wrong' });
    service.connectToWebSocket('http://live.example.test:2086');
    const socket = ioMock.mock.results[0].value;

    socket.fire('connect_error', new Error('unauthorized'));
    expect(log.error).toHaveBeenCalledWith(expect.stringContaining('REALTIME_SERVICE_KEY'), 'realtime/socket');

    jest.advanceTimersByTime(3000);
    expect(ioMock).toHaveBeenCalledTimes(2);
    expect(ioMock.mock.calls[1][1].auth).toEqual({ serviceKey: 'wrong' });
  });
});
