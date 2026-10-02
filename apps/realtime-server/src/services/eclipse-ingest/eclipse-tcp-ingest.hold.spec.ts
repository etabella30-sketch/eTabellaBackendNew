import { EventEmitter } from 'events';

import { DETECT_HOLD_MS, EclipseTcpIngestService, IngestAlert, IngestSessionWorker } from './eclipse-tcp-ingest.service';

/*
 * Review item 34: the cloud Eclipse ingest holds the bytes of a stream whose protocol is not decided yet (DET-4)
 * in memory only. These specs pin how long they can be held and what decides them without more bytes:
 *  - the end of the stream (its route is gone): the box's end-of-stream rule, the framing rule else CaseView,
 *    with a PROTOCOL_FALLBACK alert (libs/rt-ingest session-worker end());
 *  - the hold limit (DETECT_HOLD_MS) and a disconnect while the hearing goes on: the framing rule, else the only
 *    kind of evidence present (a complete Bridge frame or a CaseView marker), else they stay held (plain text
 *    has no line boundary, and a blind CaseView guess would garble every later Bridge frame).
 * Nothing is parsed for real and nothing touches the disk: the parser entry points, the rehydration and the raw
 * capture are stubs.
 */

const SES = '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d';
const T0 = Date.UTC(2026, 9, 2, 10, 0, 0);

const nFrame = Buffer.from([0x02, 0x4e, 0x01, 0x03]); // Bridge N, 1 byte
const cvLine = (n: number) => Buffer.concat([Buffer.from([0xf9]), Buffer.from(n.toString(16).padStart(4, '0'), 'latin1'), Buffer.from([0xfa])]);
const text = (s: string) => Buffer.from(s, 'latin1');

function holdWorker() {
  const logger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };
  const alerts: IngestAlert[] = [];
  const worker = new IngestSessionWorker({ nSesid: SES, label: 'Day 1', nLines: 25 } as any, jest.fn(), logger as any, a => alerts.push(a));
  const framing = jest.spyOn((worker as any).framing, 'splitCommands').mockImplementation(() => { });
  const caseview = jest.spyOn((worker as any).caseview, 'parseData').mockResolvedValue(undefined);
  jest.spyOn(worker as any, 'ensureRehydrated').mockImplementation(() => { });
  (worker as any).cap = { write: jest.fn() };
  return { worker, framing, caseview, logger, alerts };
}

let now: jest.SpyInstance;
beforeEach(() => {
  now = jest.spyOn(Date, 'now').mockReturnValue(T0);
});
afterEach(() => jest.restoreAllMocks());

describe('IngestSessionWorker: how long undecided bytes are held (review item 34)', () => {
  it('a CaseView marker held for DETECT_HOLD_MS decides CaseView: the held bytes are parsed in order, with an alert', () => {
    const { worker, caseview, framing, alerts } = holdWorker();
    const first = Buffer.concat([text(' the witness said'), cvLine(1)]);
    worker.feed(first, 1000);
    worker.feed(text('  Q.  And then?'), 1001);
    expect(worker.expireHeld(T0 + DETECT_HOLD_MS - 1)).toBeNull();
    expect(worker.undecided).toBe(true);

    now.mockReturnValue(T0 + DETECT_HOLD_MS);
    expect(worker.expireHeld(T0 + DETECT_HOLD_MS)).toBe('C');
    expect(worker.undecided).toBe(false);
    expect(caseview.mock.calls.map(c => [c[1], c[2]])).toEqual([[first, 1000], [text('  Q.  And then?'), 1001]]);
    expect(framing).not.toHaveBeenCalled();
    expect(alerts).toEqual([expect.objectContaining({
      kind: 'PROTOCOL_FALLBACK', tier: 'P2', nSesid: SES,
      data: expect.objectContaining({ protocol: 'C', how: 'hold-limit', bridgeFrames: 0, caseviewMarkers: 1 }),
    })]);
    // decided once: what follows is parsed at once
    worker.feed(text('A.  Nothing.'), 1002);
    expect(caseview).toHaveBeenCalledTimes(3);
  });

  it('a Bridge frame and no marker decides Bridge at the hold limit', () => {
    const { worker, framing, caseview } = holdWorker();
    worker.feed(text(' mid-line text'), 2000);
    worker.feed(nFrame, 2001);
    expect(worker.expireHeld(T0 + DETECT_HOLD_MS)).toBe('B');
    expect(framing.mock.calls.map(c => c[3])).toEqual([2000, 2001]);
    expect(caseview).not.toHaveBeenCalled();
  });

  it('plain text with no frame and no marker stays held at the hold limit (said once); the first frame then decides', () => {
    const { worker, framing, caseview, logger, alerts } = holdWorker();
    worker.feed(text(' a pause in the middle of a line'), 3000);
    expect(worker.expireHeld(T0 + DETECT_HOLD_MS)).toBeNull();
    expect(worker.expireHeld(T0 + DETECT_HOLD_MS + 400)).toBeNull();
    expect(worker.undecided).toBe(true);
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('still holding them'));
    expect(alerts).toEqual([]);

    worker.feed(nFrame, 3001); // one frame: not enough for the framing rule, enough for the hold limit
    expect(worker.undecided).toBe(true);
    expect(worker.expireHeld(T0 + DETECT_HOLD_MS + 800)).toBe('B');
    expect(framing.mock.calls.map(c => c[3])).toEqual([3000, 3001]);
    expect(caseview).not.toHaveBeenCalled();
  });

  it('both kinds of evidence without a majority stay held at the hold limit (the window still decides them)', () => {
    const { worker } = holdWorker();
    worker.feed(Buffer.concat([nFrame, cvLine(1)]), 4000);
    expect(worker.expireHeld(T0 + DETECT_HOLD_MS)).toBeNull();
    expect(worker.decideHeld('disconnect')).toBeNull();
    expect(worker.undecided).toBe(true);
  });

  it('the hold limit counts from the first held byte, and starts again after a decision', () => {
    const { worker } = holdWorker();
    worker.feed(cvLine(1), 5000);
    now.mockReturnValue(T0 + DETECT_HOLD_MS - 10);
    worker.feed(text('more'), 5001);
    expect(worker.expireHeld(T0 + DETECT_HOLD_MS)).toBe('C');
    expect(worker.expireHeld(T0 + 10 * DETECT_HOLD_MS)).toBeNull();
  });

  it("'end': the stream is over before the format was clear: CaseView, the box's default, with the alert", () => {
    const { worker, caseview, alerts } = holdWorker();
    worker.feed(text(' last words'), 6000);
    expect(worker.decideHeld('end')).toBe('C');
    expect(caseview.mock.calls.map(c => c[2])).toEqual([6000]);
    expect(alerts).toEqual([expect.objectContaining({
      kind: 'PROTOCOL_FALLBACK', tier: 'P2',
      message: `Session ${SES} ended before the feed format was clear (11 bytes); parsing them as CaseView (the default)`,
      data: expect.objectContaining({ protocol: 'C', how: 'end', bytes: 11 }),
    })]);
  });

  it("a stream the framing rule decides is never held: 'end' and the hold limit have nothing to do", () => {
    const { worker, framing, alerts } = holdWorker();
    worker.feed(Buffer.concat([nFrame, nFrame]), 7000); // two frames: the rule decides at once
    expect(worker.undecided).toBe(false);
    expect(framing).toHaveBeenCalledTimes(1);
    expect(worker.decideHeld('end')).toBeNull();
    expect(worker.expireHeld(T0 + DETECT_HOLD_MS)).toBeNull();
    expect(alerts).toEqual([]);
  });

  it('nothing held: no decision, no alert', () => {
    const { worker, alerts } = holdWorker();
    expect(worker.decideHeld('end')).toBeNull();
    expect(worker.expireHeld(T0 + DETECT_HOLD_MS)).toBeNull();
    expect(alerts).toEqual([]);
  });

  it('the 4096-byte window fallback raises the alert too', () => {
    const { worker, alerts } = holdWorker();
    worker.feed(Buffer.alloc(4096, 0x61), 8000);
    expect(alerts).toEqual([expect.objectContaining({ kind: 'PROTOCOL_FALLBACK', data: expect.objectContaining({ how: 'window', bytes: 4096 }) })]);
  });

  it('a throwing alert sink never breaks the feed', () => {
    const logger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };
    const worker = new IngestSessionWorker({ nSesid: SES, label: 'Day 1', nLines: 25 } as any, jest.fn(), logger as any, () => { throw new Error('sink down'); });
    jest.spyOn((worker as any).caseview, 'parseData').mockResolvedValue(undefined);
    jest.spyOn(worker as any, 'ensureRehydrated').mockImplementation(() => { });
    (worker as any).cap = { write: jest.fn() };
    worker.feed(text('x'), 9000);
    expect(worker.decideHeld('end')).toBe('C');
  });
});

class FakeSocket extends EventEmitter {
  destroyed = false;
  remoteAddress = '127.0.0.1';
  destroy(): void { this.destroyed = true; }
}

describe('EclipseTcpIngestService: held bytes at a disconnect, at the end, on the tick and at shutdown', () => {
  const route = { nSesid: SES, nCaseid: 'case-1', label: 'Day 1', nLines: 25, user: 'court1' };
  const settle = () => new Promise(resolve => setTimeout(resolve, 0));

  function makeService() {
    const routes = jest.fn().mockResolvedValue([route]);
    const adminAlert = jest.fn();
    const logger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };
    const service = Object.create(EclipseTcpIngestService.prototype) as EclipseTcpIngestService;
    Object.assign(service as object, {
      logger,
      workers: new Map(),
      config: { get: jest.fn() },
      gateway: {
        ingestTcpData: jest.fn().mockResolvedValue(undefined),
        ingestFeedRefresh: jest.fn().mockResolvedValue(undefined),
        ingestAnnotRefresh: jest.fn().mockResolvedValue(undefined),
        server: { to: jest.fn(() => ({ emit: jest.fn() })) },
        adminAlert,
      },
      eclipseSession: { readEclipseRoutes: routes, eclipsePasswordMatches: jest.fn((_r: any, pass: string) => pass === 'pw') },
    });
    // No parsing, no rehydration, no capture file: only which parser got which bytes.
    const parsed: Array<[string, string]> = [];
    jest.spyOn(IngestSessionWorker.prototype as any, 'capture').mockImplementation(() => { });
    jest.spyOn(IngestSessionWorker.prototype as any, 'ensureRehydrated').mockImplementation(() => { });
    jest.spyOn(IngestSessionWorker.prototype as any, 'parse').mockImplementation(function (this: any, chunk: Buffer) {
      parsed.push([this.protocol, chunk.toString('latin1')]);
    });
    const workers = (service as any).workers as Map<string, IngestSessionWorker>;
    return { service, routes, adminAlert, logger, parsed, workers };
  }

  async function connectWith(service: EclipseTcpIngestService, bytes: string) {
    const sock = new FakeSocket();
    (service as any).handleConnection(sock);
    sock.emit('data', text(`court1\r\npw\r\n${bytes}`));
    await settle();
    return sock;
  }

  it("a stream whose route is gone when it closes is over: its held bytes are parsed as CaseView, with the alert", async () => {
    const { service, routes, adminAlert, parsed, workers } = makeService();
    const sock = await connectWith(service, ' the last words');
    expect(workers.get(SES)!.undecided).toBe(true);

    routes.mockResolvedValue([]); // the session ended: its route was removed
    sock.emit('close');
    await settle();

    expect(parsed).toEqual([['C', ' the last words']]);
    expect(workers.get(SES)!.undecided).toBe(false);
    expect(adminAlert).toHaveBeenCalledWith(expect.objectContaining({ kind: 'PROTOCOL_FALLBACK', tier: 'P2', nSesid: SES, data: expect.objectContaining({ how: 'end' }) }));
  });

  it('a disconnect while the session goes on decides only on what the bytes show; Eclipse reconnects into the same worker', async () => {
    const { service, parsed, workers, adminAlert } = makeService();
    const first = await connectWith(service, ' plain text');
    first.emit('close');
    await settle();
    expect(parsed).toEqual([]);
    expect(workers.get(SES)!.undecided).toBe(true);

    const second = await connectWith(service, '\x02N\x01\x03');
    second.emit('close');
    await settle();
    expect(parsed).toEqual([['B', ' plain text'], ['B', '\x02N\x01\x03']]);
    expect(adminAlert).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ how: 'disconnect', protocol: 'B' }) }));
  });

  it('a route file that cannot be read at the close counts as "still there"', async () => {
    const { service, routes, parsed, workers } = makeService();
    const sock = await connectWith(service, ' plain text');
    routes.mockRejectedValue(new Error('EIO'));
    sock.emit('close');
    await settle();
    expect(parsed).toEqual([]);
    expect(workers.get(SES)!.undecided).toBe(true);
  });

  it('the 400 ms tick decides bytes held past the limit, then writes pages; one failing worker does not stop the others', async () => {
    const { service, parsed, workers, logger } = makeService();
    await connectWith(service, Buffer.concat([text(' words'), cvLine(1)]).toString('latin1'));
    const broken = { label: 'broken', expireHeld: jest.fn(() => { throw new Error('boom'); }), flush: jest.fn() };
    workers.set('broken', broken as any);
    const flush = jest.spyOn(workers.get(SES)!, 'flush').mockImplementation(() => { });

    (service as any).tick(T0 + DETECT_HOLD_MS - 1);
    expect(parsed).toEqual([]);
    (service as any).tick(T0 + DETECT_HOLD_MS);
    expect(parsed.map(p => p[0])).toEqual(['C']);
    expect(broken.flush).toHaveBeenCalledTimes(2);
    expect(flush).toHaveBeenCalledTimes(2);
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('[broken] deciding the held feed bytes failed: boom'));
  });

  it('at shutdown, held bytes that show their format are decided and written; plain text is not guessed', async () => {
    const { service, parsed, workers } = makeService();
    await connectWith(service, Buffer.concat([text(' words'), cvLine(7)]).toString('latin1'));
    const flush = jest.spyOn(workers.get(SES)!, 'flush').mockImplementation(() => { });
    await service.onModuleDestroy();
    expect(parsed.map(p => p[0])).toEqual(['C']);
    expect(flush).toHaveBeenCalledTimes(1);
  });
});
