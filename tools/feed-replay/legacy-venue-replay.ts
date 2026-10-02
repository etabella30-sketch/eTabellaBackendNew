/**
 * legacy-venue-replay — replay a recorded legacy venue feed into a STAGING realtime-server, the way the
 * legacy venue app (com-realtime-local_api, apps/realtime) sends it. This is the "staging replay of a
 * legacy 'H' venue feed through the new build" that RT edge plan R-T2 / D14 requires before deploy.
 *
 * What a legacy venue sends (com-realtime-local_api, verified 2026-10-01):
 *   - it connects with socket.io-client, `{ reconnection: false }`, NO credential, so realtime-server
 *     sees an 'anonymous' socket (accepted only while WS_AUTH_ENFORCE is not 'true');
 *   - 'TCP-DATA'          { i, d: [line tuples], date: <session id>, l: <lines per page>, p }
 *       live: the last two lines of its buffer, [2] = absolute line index (bridge-parse emitToLocalUser);
 *       on (re)connect: every page whole (socket.service syncCurrentSession);
 *   - 'feed-refresh-data' { nSesid, startInd, refreshType, endInd, newLines, start, end, startPage, current_refresh };
 *   - 'lost-data'         { msg: 1, page, data: [page file rows], totalPages, nSesid, a: [], h: [] }
 *       pages it failed to deliver, replayed on reconnect (stream-data sendFailedSessions).
 *
 * Two inputs:
 *   --events <file>  a recording of those socket events: JSON Lines (one `{"event","payload"}` object or
 *                    `["event", payload]` pair per line) or one JSON array of them. Replayed as recorded;
 *                    only the session id is rewritten to --session.
 *   --pages <dir>    a venue page folder (localdata/dt_<id>/page_N.json, or a cloud data/dt_<id>). The
 *                    events are rebuilt with the venue's own rules: --mode live (default) or sync, and
 *                    optionally --lost <pages> first, as at a venue reconnect.
 *
 * Safety: --target and --session are required; a target whose host contains etabella.net or
 * etabella.com is refused unless --i-know-this-is-not-prod is given. --dry-run prints the events and
 * connects to nothing.
 *
 * Run from the repo root (see tools/feed-replay/LEGACY-VENUE-REPLAY.md):
 *   npx ts-node tools/feed-replay/legacy-venue-replay.ts \
 *     --target http://staging-host:5005 --session <staging nSesid> --pages <venue>/localdata/dt_<id> --dry-run
 */
import * as fs from 'fs';
import * as path from 'path';
import { io } from 'socket.io-client';

/** realtime-server refuses any other session id (apps/realtime-server/src/services/utility/safe-path.ts). */
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Hosts that are production. A target host containing one of these needs --i-know-this-is-not-prod. */
export const PROD_HOST_MARKERS = ['etabella.net', 'etabella.com'];
export const LEGACY_EVENTS = ['TCP-DATA', 'feed-refresh-data', 'lost-data'] as const;
export type LegacyEvent = typeof LEGACY_EVENTS[number];

export interface ReplayEvent {
  event: LegacyEvent;
  payload: Record<string, any>;
}

export interface ReplayArgs {
  target: string;
  session: string;
  events?: string;
  pages?: string;
  mode: 'live' | 'sync';
  lines: number;
  lost: number[];
  delayMs: number;
  auth: 'anonymous' | 'service';
  dryRun: boolean;
  allowProdHost: boolean;
  help: boolean;
}

/** A bad command line or input file: printed with a pointer to --help, exit code 2, nothing sent. */
export class UsageError extends Error { }

export const USAGE = `legacy-venue-replay: replay a recorded legacy venue feed into a staging realtime-server

Required
  --target <url>              realtime-server origin, e.g. http://staging-host:5005 (no path)
  --session <uuid>            staging session id to feed; replaces the recorded one

Input (exactly one)
  --events <file>             recorded socket events (JSON Lines or a JSON array)
  --pages <dir>               venue page folder with page_N.json files
    --mode live|sync          live: two-line emits per line (default); sync: whole pages, as on reconnect
    --lines <n>               lines per page the venue used (default 25)
    --lost <p,p,...>          first replay these pages as lost-data, as the venue does on reconnect

Options
  --delay <ms>                gap between events (default 20)
  --auth anonymous|service    anonymous (default): no credential, exactly like a legacy venue;
                              service: REALTIME_SERVICE_KEY from the environment
  --dry-run                   print the events; connect to nothing
  --i-know-this-is-not-prod   allow a target whose host contains etabella.net or etabella.com
  --help                      this text`;

const VALUE_FLAGS = ['--target', '--session', '--events', '--pages', '--mode', '--lines', '--lost', '--delay', '--auth'];
const BOOLEAN_FLAGS = ['--dry-run', '--i-know-this-is-not-prod', '--help'];

// ---------------------------------------------------------------------------
// arguments
// ---------------------------------------------------------------------------

export function parseArgs(argv: string[]): ReplayArgs {
  const values = new Map<string, string>();
  const switches = new Set<string>();
  for (let i = 0; i < argv.length; i++) {
    const raw = argv[i];
    if (raw === '-h') { switches.add('--help'); continue; }
    if (!raw.startsWith('--')) throw new UsageError(`unexpected argument ${JSON.stringify(raw)}`);
    const eq = raw.indexOf('=');
    const flag = eq > -1 ? raw.slice(0, eq) : raw;
    if (BOOLEAN_FLAGS.includes(flag)) {
      if (eq > -1) throw new UsageError(`${flag} takes no value`);
      if (switches.has(flag)) throw new UsageError(`${flag} given twice`);
      switches.add(flag);
      continue;
    }
    if (!VALUE_FLAGS.includes(flag)) throw new UsageError(`unknown option ${flag}`);
    if (values.has(flag)) throw new UsageError(`${flag} given twice`);
    let value: string | undefined;
    if (eq > -1) {
      value = raw.slice(eq + 1);
    } else {
      value = argv[i + 1];
      if (value === undefined || value.startsWith('--')) throw new UsageError(`${flag} needs a value`);
      i++;
    }
    values.set(flag, value);
  }

  const help = switches.has('--help');
  const args: ReplayArgs = {
    target: values.get('--target') ?? '',
    session: values.get('--session') ?? '',
    events: values.get('--events'),
    pages: values.get('--pages'),
    mode: 'live',
    lines: 25,
    lost: [],
    delayMs: 20,
    auth: 'anonymous',
    dryRun: switches.has('--dry-run'),
    allowProdHost: switches.has('--i-know-this-is-not-prod'),
    help,
  };
  if (help) return args;

  if (!args.target) throw new UsageError('--target <url> is required');
  if (!args.session) throw new UsageError('--session <uuid> is required');
  if (!UUID_RE.test(args.session)) throw new UsageError(`--session must be a UUID (realtime-server refuses anything else): ${JSON.stringify(args.session)}`);
  if (!args.events === !args.pages) throw new UsageError('give exactly one of --events <file> or --pages <dir>');
  if (args.events !== undefined && !args.events) throw new UsageError('--events needs a file');
  if (args.pages !== undefined && !args.pages) throw new UsageError('--pages needs a folder');

  for (const flag of ['--mode', '--lines', '--lost']) {
    if (values.has(flag) && !args.pages) throw new UsageError(`${flag} only applies to --pages`);
  }
  if (values.has('--mode')) {
    const mode = values.get('--mode');
    if (mode !== 'live' && mode !== 'sync') throw new UsageError(`--mode must be live or sync: ${JSON.stringify(mode)}`);
    args.mode = mode;
  }
  if (values.has('--lines')) args.lines = wholeNumber('--lines', values.get('--lines')!, 1);
  if (values.has('--lost')) {
    const list = values.get('--lost')!.split(',');
    args.lost = list.map(page => wholeNumber('--lost', page, 1));
  }
  if (values.has('--delay')) args.delayMs = wholeNumber('--delay', values.get('--delay')!, 0);
  if (values.has('--auth')) {
    const auth = values.get('--auth');
    if (auth !== 'anonymous' && auth !== 'service') throw new UsageError(`--auth must be anonymous or service: ${JSON.stringify(auth)}`);
    args.auth = auth;
  }
  return args;
}

function wholeNumber(flag: string, text: string, min: number): number {
  if (!/^\d{1,9}$/.test(text) || Number(text) < min) {
    throw new UsageError(`${flag} must be ${min === 0 ? 'a whole number' : 'a whole number of at least ' + min}: ${JSON.stringify(text)}`);
  }
  return Number(text);
}

/**
 * The target must be a plain origin (a path would become a socket.io namespace the gateway does not
 * serve) on http(s)/ws(s), and not a production host unless the operator says otherwise.
 */
export function checkTarget(target: string, allowProdHost: boolean): URL {
  let url: URL;
  try {
    url = new URL(target);
  } catch {
    throw new UsageError(`--target is not a URL: ${JSON.stringify(target)}`);
  }
  if (!['http:', 'https:', 'ws:', 'wss:'].includes(url.protocol)) {
    throw new UsageError(`--target must be http(s):// or ws(s)://, got ${url.protocol}`);
  }
  if ((url.pathname && url.pathname !== '/') || url.search || url.hash) {
    throw new UsageError(`--target must be the server origin only (no path or query): ${JSON.stringify(target)}`);
  }
  const host = url.hostname.toLowerCase();
  const marker = PROD_HOST_MARKERS.find(name => host.includes(name));
  if (marker && !allowProdHost) {
    throw new UsageError(`refusing ${host}: it contains "${marker}", which is production. This replay is for staging. `
      + 'If this host really is not production, add --i-know-this-is-not-prod.');
  }
  return url;
}

// ---------------------------------------------------------------------------
// recorded socket events
// ---------------------------------------------------------------------------

export interface RecordedEvent {
  event: string;
  payload: Record<string, any>;
  /** 1-based line (JSON Lines) or element (JSON array) it came from. */
  at: number;
}

/** A file saved by a Windows editor may start with a byte-order mark, which JSON.parse refuses. */
const withoutBom = (text: string): string => (text.charCodeAt(0) === 0xfeff ? text.slice(1) : text);

/** Reads JSON Lines or a JSON array of `{ event, payload }` objects or `[event, payload]` pairs. */
export function parseRecording(text: string): RecordedEvent[] {
  const body = withoutBom(text);
  let entries: Array<{ value: unknown; at: number }> = [];
  let whole: unknown;
  let isWhole = false;
  try {
    whole = JSON.parse(body);
    isWhole = true;
  } catch {
    // Not one JSON document: JSON Lines.
  }
  if (isWhole) {
    if (isPair(whole) || !Array.isArray(whole)) entries = [{ value: whole, at: 1 }];
    else entries = whole.map((value, index) => ({ value, at: index + 1 }));
  } else {
    body.split(/\r?\n/).forEach((lineText, index) => {
      if (!lineText.trim()) return;
      try {
        entries.push({ value: JSON.parse(lineText), at: index + 1 });
      } catch {
        throw new UsageError(`recording line ${index + 1} is not JSON`);
      }
    });
  }
  return entries.map(({ value, at }) => {
    const [event, payload] = isPair(value) ? value : [(value as any)?.event, (value as any)?.payload];
    if (typeof event !== 'string' || !event) throw new UsageError(`recording entry ${at} has no event name`);
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new UsageError(`recording entry ${at} (${event}) has no payload object`);
    return { event, payload, at };
  });
}

/** One `["event", payload]` socket.io-style pair. */
function isPair(value: unknown): value is [string, any] {
  return Array.isArray(value) && value.length === 2 && typeof value[0] === 'string';
}

/**
 * Keeps the three legacy ingest events and points each at the staging session: TCP-DATA names its
 * session in `date`, feed-refresh-data and lost-data in `nSesid` (as events.gateway.ts reads them).
 * Payloads are copied, never changed in place. Other events are counted, not sent.
 */
export function retargetRecording(records: RecordedEvent[], session: string): { events: ReplayEvent[]; skipped: Record<string, number> } {
  const events: ReplayEvent[] = [];
  const skipped: Record<string, number> = {};
  for (const record of records) {
    if (!(LEGACY_EVENTS as readonly string[]).includes(record.event)) {
      skipped[record.event] = (skipped[record.event] ?? 0) + 1;
      continue;
    }
    const event = record.event as LegacyEvent;
    const payload = JSON.parse(JSON.stringify(record.payload));
    if (event === 'TCP-DATA') payload.date = session;
    else payload.nSesid = session;
    events.push({ event, payload });
  }
  return { events, skipped };
}

// ---------------------------------------------------------------------------
// venue page folder -> the events the venue app would send
// ---------------------------------------------------------------------------

export interface VenuePages {
  /** page number -> the page file's array as stored (what lost-data sends). */
  pages: Map<number, any[]>;
  /** The venue's line buffer: every line of every page in page order. */
  buffer: any[][];
  warnings: string[];
}

const PAGE_FILE = /^page_(\d+)\.json$/;

/** Reads page_N.json files (any other file, e.g. page_3.json.tmp, is ignored). */
export function parseVenuePages(files: Array<{ name: string; text: string }>, lines: number): VenuePages {
  const pages = new Map<number, any[]>();
  for (const file of files) {
    const match = PAGE_FILE.exec(file.name);
    if (!match) continue;
    let rows: unknown;
    try {
      rows = JSON.parse(withoutBom(file.text));
    } catch {
      throw new UsageError(`${file.name} is not JSON`);
    }
    if (!Array.isArray(rows)) throw new UsageError(`${file.name} is not a JSON array of lines`);
    pages.set(Number(match[1]), rows);
  }
  if (!pages.size) throw new UsageError('no page_N.json files found');

  const numbers = [...pages.keys()].sort((a, b) => a - b);
  const warnings: string[] = [];
  const buffer: any[][] = [];
  const last = numbers[numbers.length - 1];
  for (let page = 1; page <= last; page++) {
    const rows = pages.get(page);
    if (!rows) {
      warnings.push(`page ${page} is missing: line indexes after it shift down`);
      continue;
    }
    const lineRows = rows.filter(row => Array.isArray(row));
    if (lineRows.length !== rows.length) warnings.push(`page ${page}: ${rows.length - lineRows.length} empty slot(s) skipped`);
    if (page !== last && lineRows.length !== lines) warnings.push(`page ${page} has ${lineRows.length} lines, expected ${lines}: line indexes after it shift`);
    buffer.push(...lineRows);
  }
  return { pages, buffer, warnings };
}

/**
 * The venue's live emit after each line (bridge-parse emitToLocalUser): the last two lines of its
 * buffer, the first numbered length-2 and the second length-1, page from the last line. Faithfully,
 * the very first emit numbers line 0 as -1, which realtime-server drops; line 0 arrives with the next.
 */
export function liveEvents(buffer: any[][], lines: number, session: string): ReplayEvent[] {
  const events: ReplayEvent[] = [];
  for (let length = 1; length <= buffer.length; length++) {
    const window = length === 1 ? [buffer[0]] : buffer.slice(length - 2, length);
    const d = window.map((row, index) => {
      const copy = [...row];
      copy[2] = index === 0 ? length - 2 : length - 1;
      return copy;
    });
    events.push({ event: 'TCP-DATA', payload: { i: length - 1, d, date: session, l: lines, p: Math.floor((length - 1) / lines) + 1 } });
  }
  return events;
}

/** The venue's page sync on (re)connect (socket.service syncCurrentSession): every page whole. */
export function syncEvents(buffer: any[][], lines: number, session: string): ReplayEvent[] {
  const events: ReplayEvent[] = [];
  const totalPages = Math.ceil(buffer.length / lines);
  for (let page = 1; page <= totalPages; page++) {
    const start = (page - 1) * lines;
    const d = buffer.slice(start, page * lines).map((row, index) => {
      const copy = [...row];
      if (copy.length > 2) copy[2] = start + index;
      return copy;
    });
    events.push({ event: 'TCP-DATA', payload: { i: buffer.length, d, date: session, l: lines, p: page } });
  }
  return events;
}

/**
 * The venue's failed-page replay (stream-data sendFailedSessions): the two pages before the first
 * failed one are sent too, totalPages is the length of that list, and pages that are missing, empty or
 * not positive are skipped.
 */
export function lostEvents(pages: Map<number, any[]>, failed: number[], session: string): ReplayEvent[] {
  if (!failed.length) return [];
  const list = [failed[0] - 2, failed[0] - 1, ...failed];
  const events: ReplayEvent[] = [];
  for (const page of list) {
    const rows = page > 0 ? pages.get(page) : undefined;
    if (!rows || !rows.length) continue;
    events.push({ event: 'lost-data', payload: { msg: 1, page, data: JSON.parse(JSON.stringify(rows)), totalPages: list.length, nSesid: session, a: [], h: [] } });
  }
  return events;
}

export interface FileAccess {
  readText(file: string): string;
  listDir(dir: string): string[];
}

export interface BuiltEvents {
  events: ReplayEvent[];
  skipped: Record<string, number>;
  warnings: string[];
}

export function buildEvents(args: ReplayArgs, files: FileAccess): BuiltEvents {
  if (args.events) {
    const { events, skipped } = retargetRecording(parseRecording(files.readText(args.events)), args.session);
    return { events, skipped, warnings: [] };
  }
  const names = files.listDir(args.pages!).filter(name => PAGE_FILE.test(name));
  const venue = parseVenuePages(names.map(name => ({ name, text: files.readText(path.join(args.pages!, name)) })), args.lines);
  const stream = args.mode === 'sync'
    ? syncEvents(venue.buffer, args.lines, args.session)
    : liveEvents(venue.buffer, args.lines, args.session);
  return { events: [...lostEvents(venue.pages, args.lost, args.session), ...stream], skipped: {}, warnings: venue.warnings };
}

/** One line per event for --dry-run and the summary. */
export function describeEvent(e: ReplayEvent): string {
  const p = e.payload;
  if (e.event === 'TCP-DATA') {
    const indexes = Array.isArray(p.d) ? p.d.map((row: any) => row?.[2]).join(',') : '-';
    return `TCP-DATA          date=${p.date} p=${p.p} l=${p.l} lines=[${indexes}]`;
  }
  if (e.event === 'feed-refresh-data') {
    return `feed-refresh-data nSesid=${p.nSesid} ${p.start}..${p.end} newLines=${Array.isArray(p.newLines) ? p.newLines.length : 0} startPage=${p.startPage}`;
  }
  return `lost-data         nSesid=${p.nSesid} page=${p.page} rows=${Array.isArray(p.data) ? p.data.length : 0} totalPages=${p.totalPages}`;
}

// ---------------------------------------------------------------------------
// sending
// ---------------------------------------------------------------------------

/** The part of a socket.io-client Socket the replay uses. */
export interface SocketLike {
  on(event: string, listener: (...args: any[]) => void): unknown;
  emit(event: string, ...args: any[]): unknown;
  disconnect(): unknown;
}

export type Connect = (url: string, options: Record<string, unknown>) => SocketLike;

export interface ReplayOptions {
  url: string;
  auth: 'anonymous' | 'service';
  serviceKey?: string;
  delayMs: number;
  connect: Connect;
  sleep: (ms: number) => Promise<void>;
  log: (message: string) => void;
  connectTimeoutMs?: number;
}

/** Connects once (like the venue: no reconnection), sends every event in order, then disconnects. */
export async function replay(events: ReplayEvent[], opts: ReplayOptions): Promise<Record<string, number>> {
  const options: Record<string, unknown> = { reconnection: false };
  if (opts.auth === 'service') options.auth = { serviceKey: opts.serviceKey };
  const socket = opts.connect(opts.url, options);
  let closedBy: string | null = null;
  const sent: Record<string, number> = {};
  try {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('connect timeout')), opts.connectTimeoutMs ?? 10_000);
      socket.on('connect', () => { clearTimeout(timer); resolve(); });
      socket.on('connect_error', (error: any) => {
        clearTimeout(timer);
        reject(new Error(error?.message === 'unauthorized'
          ? 'realtime-server refused the connection (unauthorized): '
            + (opts.auth === 'service' ? 'check REALTIME_SERVICE_KEY.' : 'it enforces socket auth (WS_AUTH_ENFORCE=true); legacy venues cannot feed it.')
          : `connect failed: ${error?.message ?? error}`));
      });
    });
    socket.on('disconnect', (reason: any) => { closedBy = String(reason ?? 'disconnect'); });
    opts.log(`connected to ${opts.url} as ${opts.auth === 'service' ? 'a service socket' : 'an anonymous socket (as a legacy venue)'}`);

    for (const { event, payload } of events) {
      if (closedBy) throw new Error(`realtime-server closed the connection (${closedBy}) after ${Object.values(sent).reduce((a, b) => a + b, 0)} event(s)`);
      socket.emit(event, payload);
      sent[event] = (sent[event] ?? 0) + 1;
      if (opts.delayMs > 0) await opts.sleep(opts.delayMs);
    }
    // Let the last emits leave before closing.
    await opts.sleep(500);
    if (closedBy) throw new Error(`realtime-server closed the connection (${closedBy}) at the end of the replay`);
    return sent;
  } finally {
    socket.disconnect();
  }
}

// ---------------------------------------------------------------------------
// command line
// ---------------------------------------------------------------------------

export interface RunDeps extends FileAccess {
  connect: Connect;
  sleep: (ms: number) => Promise<void>;
  log: (message: string) => void;
  error: (message: string) => void;
}

/** Everything run() needs before it may connect. Throws; nothing has been sent yet. */
function prepare(argv: string[], env: Record<string, string | undefined>, files: FileAccess): { args: ReplayArgs; url: URL | null; built: BuiltEvents | null } {
  const args = parseArgs(argv);
  if (args.help) return { args, url: null, built: null };
  // Checked before any file is read or any socket is opened.
  const url = checkTarget(args.target, args.allowProdHost);
  if (args.auth === 'service' && !env.REALTIME_SERVICE_KEY) throw new UsageError('--auth service needs REALTIME_SERVICE_KEY in the environment');
  return { args, url, built: buildEvents(args, files) };
}

/**
 * The whole command. Exit codes: 0 done; 1 the replay failed part-way (some events may have been
 * sent); 2 refused or unreadable input, nothing was sent.
 */
export async function run(argv: string[], env: Record<string, string | undefined>, deps: RunDeps): Promise<number> {
  let prepared: ReturnType<typeof prepare>;
  try {
    prepared = prepare(argv, env, deps);
  } catch (error) {
    deps.error(`legacy-venue-replay: ${(error as Error)?.message ?? error}`
      + (error instanceof UsageError ? '\n(run with --help for usage)' : ''));
    return 2;
  }
  const { args, url, built } = prepared;
  if (!url || !built) {
    deps.log(USAGE);
    return 0;
  }

  for (const warning of built.warnings) deps.log(`warning: ${warning}`);
  for (const [event, count] of Object.entries(built.skipped)) deps.log(`skipped ${count} recorded '${event}' event(s): not a legacy ingest event`);
  const counts = built.events.reduce<Record<string, number>>((acc, e) => ({ ...acc, [e.event]: (acc[e.event] ?? 0) + 1 }), {});
  deps.log(`${built.events.length} event(s) for session ${args.session} -> ${url.origin}: ${JSON.stringify(counts)}`);
  if (!built.events.length) {
    deps.error('legacy-venue-replay: nothing to replay');
    return 2;
  }

  if (args.dryRun) {
    built.events.forEach((e, index) => deps.log(`${String(index + 1).padStart(5)}  ${describeEvent(e)}`));
    deps.log('dry run: nothing was sent');
    return 0;
  }

  try {
    const sent = await replay(built.events, {
      url: url.origin,
      auth: args.auth,
      serviceKey: env.REALTIME_SERVICE_KEY,
      delayMs: args.delayMs,
      connect: deps.connect,
      sleep: deps.sleep,
      log: deps.log,
    });
    deps.log(`sent ${JSON.stringify(sent)}. Now open /rt/session/${args.session} on staging and compare it with the venue's pages.`);
    return 0;
  } catch (error) {
    deps.error(`legacy-venue-replay: ${(error as Error)?.message ?? error}`);
    return 1;
  }
}

if (require.main === module) {
  run(process.argv.slice(2), process.env, {
    readText: file => fs.readFileSync(file, 'utf8'),
    listDir: dir => fs.readdirSync(dir),
    connect: (url, options) => io(url, options as any) as unknown as SocketLike,
    sleep: ms => new Promise(resolve => setTimeout(resolve, ms)),
    log: message => console.log(message),
    error: message => console.error(message),
  }).then(code => { process.exitCode = code; });
}
