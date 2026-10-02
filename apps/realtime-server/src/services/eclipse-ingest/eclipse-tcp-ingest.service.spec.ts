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
      ingestTcpData: jest.fn().mockResolvedValue(undefined),
      ingestFeedRefresh: jest.fn().mockResolvedValue(undefined),
      ingestAnnotRefresh: jest.fn().mockResolvedValue(undefined),
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

  // DET-4 (spec §6.1). These two tests used to pin first-byte detection (`chunk[0] === 0x02 ? 'B' : 'C'`), the live
  // defect that parsed real Bridge streams (which start mid-page with text) as CaseView. They now pin the spec's
  // rule: libs/feed-parse detectProtocol over the stream's framing; eclipse-tcp-ingest.protocol.spec.ts proves it
  // on the in-repo captures and golden corpora.
  function detectionWorker(extra: Record<string, unknown> = {}) {
    const logger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };
    const worker = new IngestSessionWorker({ nSesid: 'ses-1', label: 'Day 01', nLines: 25, ...extra } as any, jest.fn(), logger as any);
    const framing = jest.spyOn((worker as any).framing, 'splitCommands').mockImplementation(() => { });
    const caseview = jest.spyOn((worker as any).caseview, 'parseData').mockResolvedValue(undefined);
    jest.spyOn(worker as any, 'ensureRehydrated').mockImplementation(() => { });
    const cap = { write: jest.fn() };
    (worker as any).cap = cap;
    return { worker, framing, caseview, cap, logger };
  }
  const nFrame = Buffer.from([0x02, 0x4e, 0x01, 0x03]); // N, 1 byte
  const tFrame = Buffer.from([0x02, 0x54, 0x0a, 0x00, 0x05, 0x00, 0x03]); // T, 4 bytes
  const cvLine = (n: number) => Buffer.concat([Buffer.from([0xf9]), Buffer.from(n.toString(16).padStart(4, '0'), 'latin1'), Buffer.from([0xfa])]);

  it('decides Bridge from its frames even when the stream starts with text, and parses the held bytes in order', () => {
    const { worker, framing, caseview, cap } = detectionWorker();
    const text = Buffer.from(' the witness', 'latin1');

    worker.feed(text, 1000);
    worker.feed(nFrame, 1001);
    expect((worker as any).protocol).toBeNull();
    expect(framing).not.toHaveBeenCalled();
    worker.feed(tFrame, 1002);

    expect((worker as any).protocol).toBe('B');
    expect(caseview).not.toHaveBeenCalled();
    expect(framing.mock.calls.map(c => [c[1], c[3]])).toEqual([[text, 1000], [nFrame, 1001], [tFrame, 1002]]);
    // the raw capture keeps every byte as it arrived, decided or not
    expect(cap.write.mock.calls.map(c => c[0])).toEqual([text, nFrame, tFrame]);

    worker.feed(Buffer.from('X'), 1003);
    expect(framing).toHaveBeenLastCalledWith((worker as any).ctx, Buffer.from('X'), expect.any(Function), 1003);
  });

  it('decides CaseView from its line markers', () => {
    const { worker, framing, caseview } = detectionWorker();
    worker.feed(Buffer.concat([Buffer.from('  THE COURT:  Good morning.', 'ascii'), cvLine(1)]), 2000);
    expect((worker as any).protocol).toBeNull();
    worker.feed(Buffer.concat([Buffer.from('  MR SMITH:  Good morning.', 'ascii'), cvLine(2)]), 2001);

    expect((worker as any).protocol).toBe('C');
    expect(framing).not.toHaveBeenCalled();
    expect(caseview.mock.calls.map(c => c[2])).toEqual([2000, 2001]);
  });

  it('a stream that shows neither is held back, then parsed as CaseView (the default) once 4096 bytes are in', () => {
    const { worker, framing, caseview, logger } = detectionWorker();
    worker.feed(Buffer.alloc(4000, 0x61), 3000);
    expect((worker as any).protocol).toBeNull();
    expect(worker.undecided).toBe(true);
    worker.feed(Buffer.alloc(96, 0x62), 3001);

    expect((worker as any).protocol).toBe('C');
    expect(worker.undecided).toBe(false);
    expect(caseview.mock.calls.map(c => [(c[1] as Buffer).length, c[2]])).toEqual([[4000, 3000], [96, 3001]]);
    expect(framing).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('parsing as CaseView (the default)'));
  });

  it('a protocol the route configures wins at once, before any framing is seen', () => {
    const { worker, framing } = detectionWorker({ protocol: 'bridge' });
    worker.feed(Buffer.from('text'), 4000);
    expect((worker as any).protocol).toBe('B');
    expect(framing).toHaveBeenCalledTimes(1);
  });

  it('dispatches parser deliveries to the in-process gateway handlers', () => {
    const service = makeService();
    const gateway = (service as any).gateway;

    (service as any).dispatch('TCP-DATA', { date: 'ses-1', p: 1 });
    (service as any).dispatch('feed-refresh-data', { nSesid: 'ses-1' });
    (service as any).dispatch('annot-refresh-transfer', { nSesid: 'ses-1' });
    (service as any).dispatch('line-replace', { date: 'ses-1' });

    expect(gateway.ingestTcpData).toHaveBeenCalledWith({ date: 'ses-1', p: 1 });
    expect(gateway.ingestFeedRefresh).toHaveBeenCalledWith({ nSesid: 'ses-1' });
    expect(gateway.ingestAnnotRefresh).toHaveBeenCalledWith({ nSesid: 'ses-1' });
    expect(gateway.server.to).toHaveBeenCalledWith('Sses-1');
  });
});
