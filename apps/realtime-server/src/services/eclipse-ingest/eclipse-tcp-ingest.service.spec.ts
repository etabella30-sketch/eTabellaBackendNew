import { EventEmitter } from 'events';

import { EclipseTcpIngestService, IngestSessionWorker } from './eclipse-tcp-ingest.service';

class FakeSocket extends EventEmitter {
  destroyed = false;
  remoteAddress = '127.0.0.1';
  destroy(): void { this.destroyed = true; }
}

function makeService(overrides: Partial<Record<string, any>> = {}): EclipseTcpIngestService {
  const service = Object.create(EclipseTcpIngestService.prototype) as EclipseTcpIngestService;
  Object.assign(service as object, {
    logger: { log: jest.fn(), warn: jest.fn(), error: jest.fn() },
    workers: new Map(),
    config: { get: jest.fn() },
    gateway: {
      handleTcpData: jest.fn().mockResolvedValue(undefined),
      feedRefreshData: jest.fn().mockResolvedValue(undefined),
      handleAnnotTransferData: jest.fn().mockResolvedValue(undefined),
      server: { to: jest.fn(() => ({ emit: jest.fn() })) },
    },
    eclipseSession: {
      readEclipseRoutes: jest.fn().mockResolvedValue([]),
      eclipsePasswordMatches: jest.fn().mockReturnValue(false),
    },
    ...overrides,
  });
  return service;
}

const route = { nSesid: 'ses-1', nCaseid: 'case-1', label: 'Day 01', nLines: 25, user: 'alok' };

async function settle(): Promise<void> {
  // handshake handling is async (route re-read); let the microtask queue drain
  await new Promise(resolve => setTimeout(resolve, 0));
}

describe('EclipseTcpIngestService', () => {
  it('stays disabled without ECLIPSE_TCP_INGEST=1', () => {
    const service = makeService();
    service.onModuleInit();
    // Object.create skips field initializers, so "never bound" shows as a
    // falsy server (undefined here, null in a real instance).
    expect((service as any).server).toBeFalsy();
  });

  it('routes a valid handshake to the session worker and feeds the remainder', async () => {
    const service = makeService({
      eclipseSession: {
        readEclipseRoutes: jest.fn().mockResolvedValue([route]),
        eclipsePasswordMatches: jest.fn((r: any, pass: string) => pass === 'jha'),
      },
    });
    const worker = { nSesid: 'ses-1', label: 'Day 01', feed: jest.fn() };
    jest.spyOn(service as any, 'resolveWorker').mockResolvedValue(worker);

    const sock = new FakeSocket();
    (service as any).handleConnection(sock);
    sock.emit('data', Buffer.from('alok\r\njha\r\nFEEDBYTES'));
    await settle();

    expect((service as any).resolveWorker).toHaveBeenCalledWith('alok', 'jha');
    expect(worker.feed).toHaveBeenCalledWith(Buffer.from('FEEDBYTES'));
    expect(sock.destroyed).toBe(false);
  });

  it('drops a connection with invalid credentials', async () => {
    const service = makeService();
    const sock = new FakeSocket();
    (service as any).handleConnection(sock);
    sock.emit('data', Buffer.from('alok\r\nwrong\r\nFEEDBYTES'));
    await settle();

    expect(sock.destroyed).toBe(true);
  });

  it('kills the stream once the route disappears (session ended)', async () => {
    const routes = jest.fn().mockResolvedValue([route]);
    const service = makeService({
      eclipseSession: {
        readEclipseRoutes: routes,
        eclipsePasswordMatches: jest.fn().mockReturnValue(true),
      },
    });
    const worker = { nSesid: 'ses-1', label: 'Day 01', feed: jest.fn() };
    jest.spyOn(service as any, 'resolveWorker').mockResolvedValue(worker);

    const sock = new FakeSocket();
    (service as any).handleConnection(sock);
    sock.emit('data', Buffer.from('alok\r\njha\r\n'));
    await settle();
    sock.emit('data', Buffer.from('MORE'));
    await settle();
    expect(worker.feed).toHaveBeenCalledWith(Buffer.from('MORE'));

    routes.mockResolvedValue([]);
    sock.emit('data', Buffer.from('AFTER-END'));
    await settle();
    expect(sock.destroyed).toBe(true);
    expect(worker.feed).not.toHaveBeenCalledWith(Buffer.from('AFTER-END'));
  });

  it('detects Bridge format from the STX first byte and routes to the Bridge framer', () => {
    const worker = new IngestSessionWorker(
      { nSesid: 'ses-1', label: 'Day 01', nLines: 25 },
      jest.fn(),
      { log: jest.fn(), warn: jest.fn(), error: jest.fn() } as any,
    );
    const framing = jest.spyOn((worker as any).framing, 'splitCommands').mockImplementation(() => { });
    const caseview = jest.spyOn((worker as any).caseview, 'parseData').mockResolvedValue(undefined);
    jest.spyOn(worker as any, 'ensureRehydrated').mockImplementation(() => { });
    (worker as any).cap = { write: jest.fn() };

    worker.feed(Buffer.from([0x02, 0x46, 0x01, 0x03]));

    expect((worker as any).protocol).toBe('B');
    expect(framing).toHaveBeenCalled();
    expect(caseview).not.toHaveBeenCalled();
  });

  it('detects CaseView format from a non-STX first byte and routes to the CaseView parser', () => {
    const worker = new IngestSessionWorker(
      { nSesid: 'ses-1', label: 'Day 01', nLines: 25 },
      jest.fn(),
      { log: jest.fn(), warn: jest.fn(), error: jest.fn() } as any,
    );
    const framing = jest.spyOn((worker as any).framing, 'splitCommands').mockImplementation(() => { });
    const caseview = jest.spyOn((worker as any).caseview, 'parseData').mockResolvedValue(undefined);
    jest.spyOn(worker as any, 'ensureRehydrated').mockImplementation(() => { });
    (worker as any).cap = { write: jest.fn() };

    worker.feed(Buffer.from('  THE COURT:  Good morning.\r\n', 'ascii'));

    expect((worker as any).protocol).toBe('C');
    expect(caseview).toHaveBeenCalled();
    expect(framing).not.toHaveBeenCalled();
  });

  it('dispatches parser deliveries to the in-process gateway handlers', () => {
    const service = makeService();
    const gateway = (service as any).gateway;

    (service as any).dispatch('TCP-DATA', { date: 'ses-1', p: 1 });
    (service as any).dispatch('feed-refresh-data', { nSesid: 'ses-1' });
    (service as any).dispatch('annot-refresh-transfer', { nSesid: 'ses-1' });
    (service as any).dispatch('line-replace', { date: 'ses-1' });

    expect(gateway.handleTcpData).toHaveBeenCalledWith({ date: 'ses-1', p: 1 });
    expect(gateway.feedRefreshData).toHaveBeenCalledWith({ nSesid: 'ses-1' });
    expect(gateway.handleAnnotTransferData).toHaveBeenCalledWith({ nSesid: 'ses-1' });
    expect(gateway.server.to).toHaveBeenCalledWith('Sses-1');
  });
});
