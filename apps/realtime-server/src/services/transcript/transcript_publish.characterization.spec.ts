import * as childProcess from 'child_process';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import { TranscriptpublishService } from './transcript_publish.service';
import { SESSION_PROVENANCE_SQL } from '../transcript-completeness/transcript-completeness.service';

/*
 * Characterization of POST transcript/publish (TranscriptpublishService.transcriptPublish) for a session that
 * never had a venue box (bEverEdge=false, cApply not 'C': every hearing today). Plan R-T4 / D16: written
 * before the transcript-completeness gate goes in and kept green after it. fs, the Python annotation
 * transfer (child_process.spawn), Kafka and the DB are stubs that record into one shared list, so the specs
 * pin the order of the steps and their payloads. executeRef answers only the publish SP: a completeness SP
 * or any other SP fails the spec.
 *
 * Provenance is stated, not implied (D16 landing, batch-A critic): the session's RSessionMaster row is
 * NON_VENUE below, and rowQuery answers only the gate's provenance read for it (the one query D16 adds to
 * this path; the D16 caller specs pin where it runs). Any other plain query throws.
 */

/** RSessionMaster provenance of every hearing today: never a venue box, not cut mode, not a split part. */
const NON_VENUE = { bEverEdge: false, cApply: null, nPrevPartSesid: null };

/** Reads that are not the provenance read of `nSesid`, or more than one: must be none. */
const strayReads = (reads: any[][], nSesid: string) =>
  reads.filter(([sql, params], i) => i > 0 || sql !== SESSION_PROVENANCE_SQL || params?.[0] !== nSesid);

const SES = '5e551011-0000-4000-8000-000000000010';
const CASE = 'ca5e1011-0000-4000-8000-000000000010';
const TRANS = '7a5e1011-0000-4000-8000-000000000010';
const ME = '11111111-1111-4111-8111-111111111111';

// A REALTIME_PATH that does not exist: fs is stubbed for it, so nothing is read from or written to disk.
const BASE = 'rt-t10-characterization/realtime-transcripts/';
const CPATH = `t_${TRANS}.TXT`;
const FILE = BASE + CPATH;
const JSON_PATH = `${BASE}t_${TRANS}.json`;
const SESSION_TXT = `${BASE}s_${SES}.TXT`;

const CONFIG: Record<string, string> = {
  REALTIME_PATH: BASE,
  pythonV: 'python3',
  PY_ANNOT_TRANSFER_BY_TRANSCRIPT: 'assets/pythons/annot-transfer/run3.py',
  DB_DATABASE: 'db_name',
  DB_USERNAME: 'db_user',
  DB_PASSWORD: 'db_pass',
  DB_HOST: 'db_host',
  DB_PORT: '5432',
};

/** The arguments run3.py receives, in order. */
const PY_ARGS = ['assets/pythons/annot-transfer/run3.py', SES, FILE, BASE, 'db_name', 'db_user', 'db_pass', 'db_host', '5432'];

/** A converted transcript: two timed lines and an index line (index lines need no timestamp). */
const TRANSCRIPT_JSON = [
  { pageno: 1, lineno: 1, timestamp: '10:00:01', linetext: 'Good morning, Tribunal.' },
  { pageno: 1, lineno: 2, timestamp: '10:00:05', linetext: 'The quick brown fox' },
  { pageno: 1, lineno: 3, linetext: 'INDEX', isIndex: true },
];

const PUBLISHED_ROW = { msg: 1, value: 'Transcript published', nSesid: SES };

const publishBody = (extra: Record<string, any> = {}) =>
  ({ cTransid: TRANS, cPath: CPATH, nCaseid: CASE, nSesid: SES, nMasterid: ME, isIgnoreErr: false, errorCount: 0, ...extra }) as any;

const kafkaMsg = (data: Record<string, any>) => ({ event: 'PUBLISH-TRANSCRIPT', data: { identifier: '', nMasterid: ME, data } });
const STARTED = kafkaMsg({ status: 'P', message: 'Transferring annotations…' });
const PUBLISHED = kafkaMsg({ status: 'S', message: 'Published' });

/** Today's full sequence for publishBody(extra) when nothing fails and run3.py prints nothing. */
const todaysSequence = (extra: Record<string, any> = {}): Call[] => [
  ['fs.existsSync', FILE],
  ['fs.existsSync', JSON_PATH],
  ['fs.readFileSync', JSON_PATH, 'utf8'],
  ['kafka.sendMessage', 'realtime-response', STARTED],
  ['fs.copyFile', FILE, SESSION_TXT],
  ['spawn', 'python3', PY_ARGS],
  ['annotTransfer.notifyTransferComplete', SES],
  ['db.executeRef', 'transcript_publish', publishBody(extra), 'transcript'],
  ['kafka.sendMessage', 'realtime-response', PUBLISHED],
];

type Call = [string, ...any[]];

/** A clock for the progress messages (elapsed time and the 800 ms throttle read Date.now()). */
const clock = { now: 0 };

interface BuildOptions {
  /** Contents of the transcript JSON beside cPath. */
  json?: any;
  /** false: the transcript JSON beside cPath is missing. */
  jsonExists?: boolean;
  /** What the publish SP answers. */
  publish?: any;
  /** The publish SP throws this instead of answering. */
  publishThrows?: Error;
  /** run3.py's exit code and the stdout chunks it prints first (`at` moves the clock before a chunk). */
  run?: { code: number; stdout?: { text: string; at?: number }[] };
}

function build(opts: BuildOptions = {}) {
  const calls: Call[] = [];
  const run = opts.run ?? { code: 0 };

  const realExists = fs.existsSync;
  const realRead = fs.readFileSync;
  const realCopy = fs.copyFile;
  jest.spyOn(fs, 'existsSync').mockImplementation(((p: any) => {
    if (!String(p).startsWith(BASE)) return realExists(p);
    calls.push(['fs.existsSync', p]);
    return p === FILE || (p === JSON_PATH && opts.jsonExists !== false);
  }) as any);
  jest.spyOn(fs, 'readFileSync').mockImplementation(((p: any, ...rest: any[]) => {
    if (!String(p).startsWith(BASE)) return (realRead as any)(p, ...rest);
    calls.push(['fs.readFileSync', p, ...rest]);
    if (p === JSON_PATH) return JSON.stringify(opts.json ?? TRANSCRIPT_JSON);
    throw new Error(`unexpected read of ${p}`);
  }) as any);
  jest.spyOn(fs, 'copyFile').mockImplementation(((src: any, dest: any, cb: any) => {
    if (!String(src).startsWith(BASE)) return (realCopy as any)(src, dest, cb);
    calls.push(['fs.copyFile', src, dest]);
    cb(null);
  }) as any);
  jest.spyOn(childProcess, 'spawn').mockImplementation(((cmd: string, args: string[]) => {
    calls.push(['spawn', cmd, [...args]]);
    const proc: any = new EventEmitter();
    proc.stdout = new EventEmitter();
    proc.stderr = new EventEmitter();
    // Output and exit in one turn, so the 2 s heartbeat timer can never fire in between.
    setImmediate(() => {
      for (const chunk of run.stdout ?? []) {
        if (chunk.at !== undefined) clock.now = chunk.at;
        proc.stdout.emit('data', Buffer.from(chunk.text));
      }
      proc.emit('close', run.code);
    });
    return proc;
  }) as any);

  const reads: any[][] = [];
  const db = {
    executeRef: jest.fn(async (name: string, body: any, schema?: string) => {
      calls.push(['db.executeRef', name, { ...body }, schema]);
      if (name !== 'transcript_publish') throw new Error(`unexpected SP ${name}`);
      if (opts.publishThrows) throw opts.publishThrows;
      return opts.publish ?? { success: true, data: [[PUBLISHED_ROW]] };
    }),
    rowQuery: jest.fn(async (sql: string, params: any[]) => {
      reads.push([sql, params]);
      if (sql !== SESSION_PROVENANCE_SQL) throw new Error(`unexpected query ${sql}`);
      return { success: true, data: [{ ...NON_VENUE }] };
    }),
  };
  const kafka = {
    sendMessage: jest.fn((topic: string, value: any) => {
      calls.push(['kafka.sendMessage', topic, JSON.parse(JSON.stringify(value))]);
    }),
  };
  const annotTransfer = {
    notifyTransferComplete: jest.fn((nSesid: string) => {
      calls.push(['annotTransfer.notifyTransferComplete', nSesid]);
    }),
  };
  const config = { get: (key: string) => CONFIG[key] };
  const log = { info: jest.fn(), error: jest.fn(), debug: jest.fn(), warn: jest.fn() };

  // Constructor order: config, db, log, htmlService, transService, kafka, verifier, copier, utilityService,
  // conversion, feedData, wordIndexService, annotTransferService. The unused ones are empty objects, so
  // publish touching any of them fails these specs.
  const svc = new TranscriptpublishService(
    config as any, db as any, log as any, {} as any, {} as any, kafka as any,
    {} as any, {} as any, {} as any, {} as any, {} as any, {} as any, annotTransfer as any,
  );
  return { calls, reads, db, kafka, annotTransfer, log, svc };
}

describe('TranscriptpublishService.transcriptPublish on a non-venue session (characterization, R-T4 / D16)', () => {
  const T0 = 1_000_000;

  beforeEach(() => {
    clock.now = T0;
    jest.spyOn(Date, 'now').mockImplementation(() => clock.now);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  it('checks the files, announces, copies the .TXT, transfers annotations, runs the publish SP, then announces Published', async () => {
    const { calls, reads, db, svc } = build();
    const body = publishBody();

    const res = await svc.transcriptPublish(body, 'https://etabella.example');

    expect(calls).toEqual(todaysSequence());
    // One SP: the request object itself is its payload, unchanged. At most the provenance read besides.
    expect(db.executeRef.mock.calls).toEqual([['transcript_publish', body, 'transcript']]);
    expect(strayReads(reads, SES)).toEqual([]);
    expect(db.executeRef.mock.calls[0][1]).toBe(body);
    expect(body).toEqual(publishBody());
    expect(res).toEqual(PUBLISHED_ROW);
  });

  it('with isIgnoreErr the transcript JSON is not read; every other step is the same', async () => {
    const { calls, svc } = build({ json: [{ pageno: 1, lineno: 1, linetext: 'no timestamp' }] });

    await expect(svc.transcriptPublish(publishBody({ isIgnoreErr: true }), '')).resolves.toEqual(PUBLISHED_ROW);

    expect(calls).toEqual(todaysSequence({ isIgnoreErr: true }).filter((c) => c[0] !== 'fs.readFileSync'));
  });

  it("forwards run3.py's progress lines as 'P' messages between the start and the end", async () => {
    const { calls, svc } = build({
      run: {
        code: 0,
        stdout: [
          { text: 'Fetching issues from DB...\n' },
          { text: 'Found 2 issues to transfer\n', at: T0 + 500 },
          { text: 'Matched 4 lines for annotation a1\n', at: T0 + 1500 },
          { text: 'Matched 2 lines for annotation a2\n', at: T0 + 1700 },
        ],
      },
    });

    await expect(svc.transcriptPublish(publishBody(), '')).resolves.toEqual(PUBLISHED_ROW);

    expect(calls.filter((c) => c[0] === 'kafka.sendMessage').map((c) => c[2])).toEqual([
      STARTED,
      kafkaMsg({ status: 'P', message: 'Fetching annotations from database…', elapsed: '0s' }),
      kafkaMsg({ status: 'P', message: 'Transferring annotations — 0/2 (0%)', percent: 0, elapsed: '0s' }),
      kafkaMsg({ status: 'P', message: 'Transferring annotations — 1/2 (50%)', percent: 50, elapsed: '1s' }),
      // The fourth line lands 200 ms after the third: throttled (at most one progress message per 800 ms).
      PUBLISHED,
    ]);
    expect(calls.map((c) => c[0])).toEqual([
      'fs.existsSync', 'fs.existsSync', 'fs.readFileSync',
      'kafka.sendMessage', 'fs.copyFile', 'spawn',
      'kafka.sendMessage', 'kafka.sendMessage', 'kafka.sendMessage',
      'annotTransfer.notifyTransferComplete', 'db.executeRef', 'kafka.sendMessage',
    ]);
  });

  it('a failed annotation transfer stops before the publish SP (the .TXT copy has already run)', async () => {
    const { calls, svc } = build({ run: { code: 1 } });

    await expect(svc.transcriptPublish(publishBody(), '')).resolves.toEqual(
      { msg: -1, value: 'Annotation transfer failed', error: 'Annotation transfer failed' },
    );

    expect(calls).toEqual([
      ...todaysSequence().slice(0, 6),
      ['kafka.sendMessage', 'realtime-response', kafkaMsg({ status: 'F', message: 'Annotation transfer failed' })],
    ]);
  });

  it("a failed publish SP announces 'F' after the transfer and returns the SP error", async () => {
    const { calls, log, svc } = build({ publish: { success: false, error: 'constraint violation' } });

    await expect(svc.transcriptPublish(publishBody(), '')).resolves.toEqual(
      { msg: -1, value: 'DB publish failed', error: 'constraint violation' },
    );

    expect(calls).toEqual([
      ...todaysSequence().slice(0, 8),
      ['kafka.sendMessage', 'realtime-response', kafkaMsg({ status: 'F', message: 'DB publish failed' })],
    ]);
    expect(log.error).toHaveBeenCalledWith('DB publish failed | constraint violation', `realtime/transcript/${TRANS}`);
  });

  it("a publish SP that throws announces 'F' with the error text", async () => {
    const { calls, svc } = build({ publishThrows: new Error('connection reset') });

    await expect(svc.transcriptPublish(publishBody(), '')).resolves.toEqual(
      { msg: -1, value: 'Unexpected error: connection reset', error: 'Unexpected error: connection reset' },
    );

    expect(calls).toEqual([
      ...todaysSequence().slice(0, 8),
      ['kafka.sendMessage', 'realtime-response', kafkaMsg({ status: 'F', message: 'Publish failed: connection reset' })],
    ]);
  });

  it('a transcript line without a timestamp stops the publish before anything is announced, copied or run', async () => {
    const { calls, svc } = build({ json: [...TRANSCRIPT_JSON, { pageno: 2, lineno: 7, linetext: 'untimed line' }] });

    await expect(svc.transcriptPublish(publishBody(), '')).resolves.toEqual({
      msg: -1,
      value: 'Missing timestamps or text in: Page: 2, Line: 7',
      error: 'Missing timestamps or text in: Page: 2, Line: 7',
    });

    expect(calls).toEqual(todaysSequence().slice(0, 3));
  });

  it('an empty transcript JSON stops the publish with nothing announced', async () => {
    const { calls, svc } = build({ json: [] });

    await expect(svc.transcriptPublish(publishBody(), '')).resolves.toEqual(
      { msg: -1, value: 'Transcript JSON is empty or malformed', error: 'Transcript JSON is empty or malformed' },
    );

    expect(calls).toEqual(todaysSequence().slice(0, 3));
  });

  it('a missing transcript JSON stops the publish before it is read', async () => {
    const { calls, svc } = build({ jsonExists: false });

    await expect(svc.transcriptPublish(publishBody(), '')).resolves.toEqual(
      { msg: -1, value: `Transcript JSON not found for: ${CPATH}`, error: `Transcript JSON not found for: ${CPATH}` },
    );

    expect(calls).toEqual(todaysSequence().slice(0, 2));
  });
});
