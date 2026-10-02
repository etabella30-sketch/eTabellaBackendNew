import { EventEmitter } from 'events';
import * as path from 'path';

import {
  buildEvents,
  checkTarget,
  liveEvents,
  lostEvents,
  parseArgs,
  parseRecording,
  parseVenuePages,
  replay,
  retargetRecording,
  run,
  RunDeps,
  syncEvents,
  UsageError,
} from './legacy-venue-replay';

/**
 * Argument parsing, the production-host guard and event building for the legacy venue replay.
 * Nothing here opens a socket or reads the disk: the socket is a fake and files come from a map.
 *
 * The repo's jest config only searches apps/ and libs/, so run this with:
 *   npx jest --roots "<rootDir>/tools/feed-replay" tools/feed-replay
 */

const STAGING = '0f1e2d3c-4b5a-4968-8776-655443322110';
const VENUE = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';

const base = ['--target', 'http://localhost:5005', '--session', STAGING];
const codes = (text: string) => Array.from(text, ch => ch.charCodeAt(0));
/** A venue line tuple; [2] is deliberately stale so the rebuild has to renumber it. */
const row = (n: number) => [`10:00:${String(n % 60).padStart(2, '0')}:00`, codes(`line ${n}`), 900 + n, 'FL', Math.floor(n / 25) + 1, (n % 25) + 1, 4000 + n, [], 0];
const rows = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => row(from + i));

describe('parseArgs', () => {
  it('needs only --target, --session and one input; the rest has the legacy defaults', () => {
    expect(parseArgs([...base, '--events', 'feed.jsonl'])).toEqual({
      target: 'http://localhost:5005',
      session: STAGING,
      events: 'feed.jsonl',
      pages: undefined,
      mode: 'live',
      lines: 25,
      lost: [],
      delayMs: 20,
      auth: 'anonymous',
      dryRun: false,
      allowProdHost: false,
      help: false,
    });
  });

  it('reads --flag=value as well as --flag value, and every option', () => {
    const args = parseArgs(['--target=http://10.0.0.5:5005', `--session=${STAGING}`, '--pages', 'dt_x', '--mode=sync',
      '--lines', '30', '--lost', '4,5', '--delay=0', '--auth', 'service', '--dry-run', '--i-know-this-is-not-prod']);
    expect(args).toMatchObject({
      target: 'http://10.0.0.5:5005', pages: 'dt_x', mode: 'sync', lines: 30, lost: [4, 5], delayMs: 0,
      auth: 'service', dryRun: true, allowProdHost: true,
    });
  });

  it('--help needs nothing else', () => {
    expect(parseArgs(['--help']).help).toBe(true);
    expect(parseArgs(['-h']).help).toBe(true);
  });

  it.each([
    [['--session', STAGING, '--events', 'f'], '--target'],
    [['--target', 'http://localhost:5005', '--events', 'f'], '--session'],
    [['--target', 'http://localhost:5005', '--session', 'not-a-uuid', '--events', 'f'], 'UUID'],
    [[...base], 'exactly one'],
    [[...base, '--events', 'f', '--pages', 'd'], 'exactly one'],
    [[...base, '--events', 'f', '--mode', 'sync'], 'only applies to --pages'],
    [[...base, '--events', 'f', '--lines', '25'], 'only applies to --pages'],
    [[...base, '--events', 'f', '--lost', '3'], 'only applies to --pages'],
    [[...base, '--pages', 'd', '--mode', 'fast'], '--mode'],
    [[...base, '--pages', 'd', '--lines', '0'], '--lines'],
    [[...base, '--pages', 'd', '--lines', '2.5'], '--lines'],
    [[...base, '--pages', 'd', '--lost', '0'], '--lost'],
    [[...base, '--pages', 'd', '--lost', '3,,4'], '--lost'],
    [[...base, '--pages', 'd', '--lost', ''], '--lost'],
    [[...base, '--events', 'f', '--delay', '-1'], '--delay'],
    [[...base, '--events', 'f', '--auth', 'admin'], '--auth'],
    [[...base, '--events', 'f', '--taget', 'x'], 'unknown option --taget'],
    [[...base, '--events', 'f', 'extra'], 'unexpected argument'],
    [[...base, '--events', 'f', '--target', 'http://other:5005'], 'given twice'],
    [[...base, '--events'], '--events needs a value'],
    [['--target', '--session', STAGING, '--events', 'f'], '--target needs a value'],
    [[...base, '--events', 'f', '--dry-run=yes'], 'takes no value'],
  ])('refuses %j (%s)', (argv, message) => {
    expect(() => parseArgs(argv as string[])).toThrow(UsageError);
    expect(() => parseArgs(argv as string[])).toThrow(message);
  });
});

describe('checkTarget', () => {
  it.each([
    'http://localhost:5005',
    'http://127.0.0.1:5005/',
    'http://[::1]:5005',
    'https://rt-staging.example.org',
    'ws://10.0.0.5:5005',
    'wss://staging.internal:443',
    'http://etabella.com@staging.example.org', // user info, not the host
  ])('lets a staging target through: %s', (target) => {
    expect(() => checkTarget(target, false)).not.toThrow();
  });

  it.each([
    'https://etabella.net',
    'https://rt.etabella.net:5005',
    'http://ETABELLA.COM',
    'https://staging.etabella.com',
    'https://etabella.com.example.org',
    'http://staging@etabella.net:5005',
  ])('refuses a production-looking host without --i-know-this-is-not-prod: %s', (target) => {
    expect(() => checkTarget(target, false)).toThrow(/production.*--i-know-this-is-not-prod/);
    expect(() => checkTarget(target, true)).not.toThrow();
  });

  it.each([
    ['localhost:5005', 'http(s)'],
    ['ftp://staging.example.org', 'http(s)'],
    ['staging host', 'not a URL'],
    ['http://localhost:5005/socket.io', 'origin only'],
    ['http://localhost:5005/?x=1', 'origin only'],
  ])('refuses %s', (target, message) => {
    expect(() => checkTarget(target, true)).toThrow(message);
  });
});

describe('recorded events', () => {
  it('reads JSON Lines of objects and [event, payload] pairs, skipping blank lines', () => {
    const text = [
      JSON.stringify({ event: 'TCP-DATA', payload: { date: VENUE, d: [] }, at: 12 }),
      '',
      JSON.stringify(['lost-data', { nSesid: VENUE, page: 2, data: [] }]),
    ].join('\r\n');
    expect(parseRecording(text)).toEqual([
      { event: 'TCP-DATA', payload: { date: VENUE, d: [] }, at: 1 },
      { event: 'lost-data', payload: { nSesid: VENUE, page: 2, data: [] }, at: 3 },
    ]);
  });

  it('reads one JSON array, and a file holding a single event', () => {
    const array = JSON.stringify([{ event: 'TCP-DATA', payload: { date: VENUE } }, ['feed-refresh-data', { nSesid: VENUE }]], null, 2);
    expect(parseRecording(array).map(e => e.event)).toEqual(['TCP-DATA', 'feed-refresh-data']);
    expect(parseRecording(JSON.stringify(['TCP-DATA', { date: VENUE }])).map(e => e.event)).toEqual(['TCP-DATA']);
  });

  it('reads a recording or a page file saved with a byte-order mark', () => {
    const bom = String.fromCharCode(0xfeff);
    expect(parseRecording(bom + JSON.stringify(['TCP-DATA', { date: VENUE }])).map(e => e.event)).toEqual(['TCP-DATA']);
    expect(parseRecording(bom + JSON.stringify(['TCP-DATA', { date: VENUE }]) + '\n' + JSON.stringify(['lost-data', { nSesid: VENUE }])).map(e => e.event))
      .toEqual(['TCP-DATA', 'lost-data']);
    expect(parseVenuePages([{ name: 'page_1.json', text: bom + JSON.stringify(rows(0, 1)) }], 25).buffer).toEqual(rows(0, 1));
  });

  it('says which line or entry is bad', () => {
    expect(() => parseRecording('{"event":"TCP-DATA","payload":{}}\n{oops')).toThrow('recording line 2 is not JSON');
    expect(() => parseRecording('{"payload":{}}')).toThrow('entry 1 has no event name');
    expect(() => parseRecording('[{"event":"TCP-DATA","payload":{}},{"event":"lost-data","payload":[1]}]')).toThrow('entry 2 (lost-data) has no payload object');
  });

  it('points each legacy event at the staging session, copies payloads, and skips other events', () => {
    const tcp = { i: 3, d: [row(3)], date: VENUE, l: 25, p: 1 };
    const refresh = { nSesid: VENUE, start: '10:00:01:00', end: '10:00:02:00', newLines: [], startPage: 1, current_refresh: 1 };
    const lost = { msg: 1, page: 1, data: [row(0)], totalPages: 3, nSesid: VENUE, a: [], h: [] };
    const records = parseRecording([
      ['TCP-DATA', tcp], ['annot-refresh-transfer', { nSesid: VENUE }], ['feed-refresh-data', refresh],
      ['lost-data', lost], ['message', { date: VENUE }], ['annot-refresh-transfer', { nSesid: VENUE }],
    ].map(pair => JSON.stringify(pair)).join('\n'));

    const { events, skipped } = retargetRecording(records, STAGING);

    expect(events).toEqual([
      { event: 'TCP-DATA', payload: { ...tcp, date: STAGING } },
      { event: 'feed-refresh-data', payload: { ...refresh, nSesid: STAGING } },
      { event: 'lost-data', payload: { ...lost, nSesid: STAGING } },
    ]);
    expect(skipped).toEqual({ 'annot-refresh-transfer': 2, message: 1 });
    expect(records[0].payload.date).toBe(VENUE);
  });
});

describe('venue page folder', () => {
  const file = (name: string, value: unknown) => ({ name, text: JSON.stringify(value) });

  it('orders pages by number, ignores other files and builds the line buffer', () => {
    const venue = parseVenuePages([
      file('page_10.json', rows(225, 226)),
      file('page_2.json', rows(25, 49)),
      file('page_1.json', rows(0, 24)),
      file('page_3.json.tmp', rows(0, 1)),
      file('notes.txt', 'x'),
      ...Array.from({ length: 7 }, (_, i) => file(`page_${i + 3}.json`, rows(50 + i * 25, 74 + i * 25))),
    ], 25);

    expect([...venue.pages.keys()].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(venue.buffer).toHaveLength(9 * 25 + 2);
    expect(venue.buffer[25]).toEqual(row(25));
    expect(venue.warnings).toEqual([]);
  });

  it('warns when a page is missing, short or has empty slots, since later indexes shift', () => {
    const venue = parseVenuePages([
      file('page_1.json', [...rows(0, 22), null]),
      file('page_3.json', rows(50, 51)),
    ], 25);
    expect(venue.warnings).toEqual([
      'page 1: 1 empty slot(s) skipped',
      'page 1 has 23 lines, expected 25: line indexes after it shift',
      'page 2 is missing: line indexes after it shift down',
    ]);
    expect(venue.buffer).toHaveLength(25);
  });

  it('refuses a folder with no page files, or a page that is not a JSON array', () => {
    expect(() => parseVenuePages([file('notes.json', [])], 25)).toThrow('no page_N.json files');
    expect(() => parseVenuePages([file('page_1.json', { lines: [] })], 25)).toThrow('page_1.json is not a JSON array');
    expect(() => parseVenuePages([{ name: 'page_1.json', text: '[{' }], 25)).toThrow('page_1.json is not JSON');
  });

  it('live: one TCP-DATA per line with the last two lines, as bridge-parse emitToLocalUser builds it', () => {
    const numbered = (n: number, index: number) => { const r = row(n); r[2] = index; return r; };
    const events = liveEvents(rows(0, 2), 25, STAGING);
    expect(events.map(e => e.event)).toEqual(['TCP-DATA', 'TCP-DATA', 'TCP-DATA']);
    expect(events.map(e => e.payload)).toEqual([
      // The venue numbers line 0 as -1 in its first emit (realtime-server drops it); it arrives next time.
      { i: 0, d: [numbered(0, -1)], date: STAGING, l: 25, p: 1 },
      { i: 1, d: [numbered(0, 0), numbered(1, 1)], date: STAGING, l: 25, p: 1 },
      { i: 2, d: [numbered(1, 1), numbered(2, 2)], date: STAGING, l: 25, p: 1 },
    ]);
  });

  it('live: the emit for line 25 carries lines 24 and 25 with p 2 (the page boundary)', () => {
    const events = liveEvents(rows(0, 25), 25, STAGING);
    const indexesAndPage = events.map(e => [e.payload.d.map((r: any[]) => r[2]), e.payload.p]);
    expect(indexesAndPage[24]).toEqual([[23, 24], 1]);
    expect(indexesAndPage[25]).toEqual([[24, 25], 2]);
  });

  it('live and sync never change the venue\'s own rows', () => {
    const buffer = rows(0, 30);
    const before = JSON.stringify(buffer);
    liveEvents(buffer, 25, STAGING);
    syncEvents(buffer, 25, STAGING);
    expect(JSON.stringify(buffer)).toBe(before);
  });

  it('sync: every page whole, indexes renumbered from the page start, as socket.service syncCurrentSession sends them', () => {
    const events = syncEvents(rows(0, 26), 25, STAGING);
    expect(events.map(e => [e.event, e.payload.i, e.payload.p, e.payload.l, e.payload.date, e.payload.d.length])).toEqual([
      ['TCP-DATA', 27, 1, 25, STAGING, 25],
      ['TCP-DATA', 27, 2, 25, STAGING, 2],
    ]);
    expect(events[0].payload.d.map((r: any[]) => r[2])).toEqual(Array.from({ length: 25 }, (_, i) => i));
    expect(events[1].payload.d.map((r: any[]) => r[2])).toEqual([25, 26]);
  });

  it('lost: the failed pages plus the two before the first, as stream-data sendFailedSessions sends them', () => {
    const pages = new Map<number, any[]>([[3, rows(50, 74)], [4, rows(75, 99)], [5, [...rows(100, 101), null]]]);
    expect(lostEvents(pages, [5], STAGING)).toEqual([
      { event: 'lost-data', payload: { msg: 1, page: 3, data: rows(50, 74), totalPages: 3, nSesid: STAGING, a: [], h: [] } },
      { event: 'lost-data', payload: { msg: 1, page: 4, data: rows(75, 99), totalPages: 3, nSesid: STAGING, a: [], h: [] } },
      { event: 'lost-data', payload: { msg: 1, page: 5, data: [...rows(100, 101), null], totalPages: 3, nSesid: STAGING, a: [], h: [] } },
    ]);
  });

  it('lost: pages below 1, missing or empty are skipped; totalPages still counts them', () => {
    const pages = new Map<number, any[]>([[1, rows(0, 1)], [2, []]]);
    expect(lostEvents(pages, [1], STAGING).map(e => [e.payload.page, e.payload.totalPages])).toEqual([[1, 3]]);
    expect(lostEvents(pages, [2, 7], STAGING).map(e => [e.payload.page, e.payload.totalPages])).toEqual([[1, 4]]);
    expect(lostEvents(pages, [], STAGING)).toEqual([]);
  });

  it('builds lost-data first, then the stream, as at a venue reconnect', () => {
    const dir = path.join('venue', 'dt_x');
    const disk: Record<string, string> = {
      [path.join(dir, 'page_1.json')]: JSON.stringify(rows(0, 24)),
      [path.join(dir, 'page_2.json')]: JSON.stringify(rows(25, 26)),
    };
    const files = { readText: (p: string) => disk[p], listDir: () => ['page_2.json', 'page_1.json', 'page_1.json.tmp'] };
    const args = parseArgs([...base, '--pages', dir, '--mode', 'sync', '--lost', '2']);

    const built = buildEvents(args, files);

    expect(built.events.map(e => [e.event, e.payload.page ?? e.payload.p])).toEqual([
      ['lost-data', 1], ['lost-data', 2], ['TCP-DATA', 1], ['TCP-DATA', 2],
    ]);
  });
});

/** A socket.io-client stand-in: connects (or fails) on the next tick, records emits. */
class FakeSocket extends EventEmitter {
  sent: Array<[string, any]> = [];
  disconnected = false;
  constructor(outcome: 'connect' | Error) {
    super();
    setImmediate(() => (outcome === 'connect' ? super.emit('connect') : super.emit('connect_error', outcome)));
  }
  emit(event: string, ...args: any[]): boolean {
    this.sent.push([event, args[0]]);
    return true;
  }
  disconnect() { this.disconnected = true; return this; }
}

describe('replay', () => {
  const events = [
    { event: 'TCP-DATA' as const, payload: { date: STAGING, d: [] } },
    { event: 'lost-data' as const, payload: { nSesid: STAGING, page: 1, data: [] } },
  ];

  it('connects like a legacy venue (no credential, no reconnection), sends in order with the gap, then disconnects', async () => {
    const socket = new FakeSocket('connect');
    const connect = jest.fn(() => socket);
    const sleep = jest.fn().mockResolvedValue(undefined);

    const sent = await replay(events, { url: 'http://localhost:5005', auth: 'anonymous', delayMs: 15, connect, sleep, log: jest.fn() });

    expect(connect).toHaveBeenCalledWith('http://localhost:5005', { reconnection: false });
    expect(socket.sent).toEqual([['TCP-DATA', events[0].payload], ['lost-data', events[1].payload]]);
    expect(sleep.mock.calls.map(c => c[0])).toEqual([15, 15, 500]);
    expect(sent).toEqual({ 'TCP-DATA': 1, 'lost-data': 1 });
    expect(socket.disconnected).toBe(true);
  });

  it('as a service socket it presents the key in the handshake auth', async () => {
    const connect = jest.fn(() => new FakeSocket('connect'));
    await replay(events, { url: 'http://localhost:5005', auth: 'service', serviceKey: 'k', delayMs: 0, connect, sleep: async () => { }, log: jest.fn() });
    expect(connect).toHaveBeenCalledWith('http://localhost:5005', { reconnection: false, auth: { serviceKey: 'k' } });
  });

  it('explains a refused connection and sends nothing', async () => {
    const socket = new FakeSocket(new Error('unauthorized'));
    await expect(replay(events, { url: 'http://localhost:5005', auth: 'anonymous', delayMs: 0, connect: () => socket, sleep: async () => { }, log: jest.fn() }))
      .rejects.toThrow('WS_AUTH_ENFORCE=true');
    expect(socket.sent).toEqual([]);
    expect(socket.disconnected).toBe(true);
  });

  it('stops when the server closes the connection part-way', async () => {
    const socket = new FakeSocket('connect');
    const sleep = jest.fn(async () => { EventEmitter.prototype.emit.call(socket, 'disconnect', 'io server disconnect'); });
    await expect(replay(events, { url: 'http://localhost:5005', auth: 'anonymous', delayMs: 5, connect: () => socket, sleep, log: jest.fn() }))
      .rejects.toThrow('closed the connection (io server disconnect) after 1 event(s)');
    expect(socket.sent).toHaveLength(1);
  });
});

describe('run', () => {
  function deps(overrides: Partial<RunDeps> = {}) {
    const out: string[] = [];
    const err: string[] = [];
    const d: RunDeps = {
      readText: jest.fn(() => [
        JSON.stringify(['TCP-DATA', { i: 0, d: [row(0)], date: VENUE, l: 25, p: 1 }]),
        JSON.stringify(['feed-refresh-data', { nSesid: VENUE, start: '10:00:00:00', end: '10:00:01:00', newLines: [], startPage: 1 }]),
      ].join('\n')),
      listDir: jest.fn(() => []),
      connect: jest.fn(() => new FakeSocket('connect')),
      sleep: jest.fn().mockResolvedValue(undefined),
      log: (m: string) => out.push(m),
      error: (m: string) => err.push(m),
      ...overrides,
    };
    return { d, out, err };
  }

  it('refuses a production host before reading the recording or connecting', async () => {
    const { d, err } = deps();
    const code = await run(['--target', 'https://rt.etabella.net', '--session', STAGING, '--events', 'feed.jsonl'], {}, d);
    expect(code).toBe(2);
    expect(err.join('\n')).toContain('--i-know-this-is-not-prod');
    expect(d.readText).not.toHaveBeenCalled();
    expect(d.connect).not.toHaveBeenCalled();
  });

  it('a dry run prints the retargeted events and never connects, even to an allowed host', async () => {
    const { d, out } = deps();
    const code = await run(['--target', 'https://rt.etabella.net', '--session', STAGING, '--events', 'feed.jsonl', '--dry-run', '--i-know-this-is-not-prod'], {}, d);
    expect(code).toBe(0);
    expect(d.connect).not.toHaveBeenCalled();
    expect(out.join('\n')).toContain(`date=${STAGING}`);
    expect(out.join('\n')).toContain('dry run: nothing was sent');
  });

  it('--auth service without REALTIME_SERVICE_KEY is refused before connecting', async () => {
    const { d, err } = deps();
    const code = await run([...base, '--events', 'feed.jsonl', '--auth', 'service'], {}, d);
    expect(code).toBe(2);
    expect(err.join('\n')).toContain('REALTIME_SERVICE_KEY');
    expect(d.connect).not.toHaveBeenCalled();
  });

  it('replays the recording into the staging session and never prints the service key', async () => {
    const socket = new FakeSocket('connect');
    const { d, out } = deps({ connect: jest.fn(() => socket) });
    const code = await run([...base, '--events', 'feed.jsonl', '--auth', 'service'], { REALTIME_SERVICE_KEY: 'secret-key' }, d);

    expect(code).toBe(0);
    expect(d.connect).toHaveBeenCalledWith('http://localhost:5005', { reconnection: false, auth: { serviceKey: 'secret-key' } });
    expect(socket.sent.map(([event, payload]) => [event, payload.date ?? payload.nSesid])).toEqual([
      ['TCP-DATA', STAGING],
      ['feed-refresh-data', STAGING],
    ]);
    expect(out.join('\n')).not.toContain('secret-key');
  });

  it('an unreadable input is refused with nothing sent', async () => {
    const { d, err } = deps({ readText: jest.fn(() => { throw new Error('ENOENT: no such file'); }) });
    expect(await run([...base, '--events', 'missing.jsonl'], {}, d)).toBe(2);
    expect(err.join('\n')).toContain('ENOENT');
    expect(d.connect).not.toHaveBeenCalled();
  });

  it('--help prints the usage', async () => {
    const { d, out } = deps();
    expect(await run(['--help'], {}, d)).toBe(0);
    expect(out.join('\n')).toContain('--i-know-this-is-not-prod');
  });
});
