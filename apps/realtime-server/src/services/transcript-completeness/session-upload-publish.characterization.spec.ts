import * as fs from 'fs';
import * as path from 'path';
import { SessionService } from '../session/session.service';
import { SESSION_PROVENANCE_SQL } from './transcript-completeness.service';

/*
 * Characterization of POST session/updatetranscriptstatus with cFlag 'P' (SessionService.updateTranscriptStatus):
 * the RT Production upload-publish pipeline that spec section 4.4 lists as a publish call site
 * (session.service.ts:819-853). For a session that never had a venue box (bEverEdge=false, cApply not 'C':
 * every hearing today). Plan R-T4 / D16: pinned (and run against the HEAD source) before the completeness
 * gate went in, and kept green after it.
 *
 * fs, the annotation transfer and the DB are stubs that record into one shared list. The paths sit under a
 * folder that does not exist, and fs is stubbed for them, so nothing is read from or written to disk.
 * Provenance is stated, not implied: the session's RSessionMaster row is NON_VENUE below, and rowQuery
 * answers only the gate's one provenance read (the D16 caller specs pin where it runs); any other plain
 * query throws, and executeRef answers only the status SP.
 */

/** RSessionMaster provenance of every hearing today: never a venue box, not cut mode, not a split part. */
const NON_VENUE = { bEverEdge: false, cApply: null, nPrevPartSesid: null };

/** Reads that are not the provenance read of `nSesid`, or more than one: must be none. */
const strayReads = (reads: any[][], nSesid: string) =>
  reads.filter(([sql, params], i) => i > 0 || sql !== SESSION_PROVENANCE_SQL || params?.[0] !== nSesid);

const SES = '5e551011-0000-4000-8000-000000000010';
const CASE = 'ca5e1011-0000-4000-8000-000000000010';
const ME = '11111111-1111-4111-8111-111111111111';

const ROOT = 'rt-t10-characterization';
const CONFIG: Record<string, string> = {
  ASSETS: `${ROOT}/assets/`,
  ANNOT_TRANSFER_DIR: `${ROOT}/annot-transfer`,
  REALTIME_PATH: `${ROOT}/realtime-transcripts/`,
};
const TXT = `${ROOT}/assets/doc/case${CASE}/s_${SES}.TXT`;
const TRANSFER_DIR = path.resolve(CONFIG.ANNOT_TRANSFER_DIR);
const REALTIME_DIR = path.resolve(CONFIG.REALTIME_PATH);

type Call = [string, ...any[]];

const statusBody = (extra: Record<string, any> = {}) =>
  ({ nSesid: SES, nCaseid: CASE, cFlag: 'P', cProtocol: 'B', nUserid: ME, ...extra }) as any;

const STATUS_ROW = { msg: 1, value: 'Transcript status updated', nSesid: SES };

interface BuildOptions {
  /** Which of our paths exist. */
  exists?: { txt?: boolean; transferDir?: boolean; realtimeDir?: boolean };
  /** What the status SP answers. */
  status?: any;
  /** startTransfer throws this. */
  transferThrows?: Error;
}

function build(opts: BuildOptions = {}) {
  const calls: Call[] = [];
  const exists = { txt: true, transferDir: true, realtimeDir: true, ...(opts.exists ?? {}) };

  const realExists = fs.existsSync;
  const realMkdir = fs.mkdirSync;
  const isOurs = (p: any) => String(p).replace(/\\/g, '/').includes(ROOT);
  jest.spyOn(fs, 'existsSync').mockImplementation(((p: any) => {
    if (!isOurs(p)) return realExists(p);
    calls.push(['fs.existsSync', p]);
    if (p === TXT) return exists.txt;
    if (p === TRANSFER_DIR) return exists.transferDir;
    if (p === REALTIME_DIR) return exists.realtimeDir;
    throw new Error(`unexpected existsSync(${p})`);
  }) as any);
  jest.spyOn(fs, 'mkdirSync').mockImplementation(((p: any, o?: any) => {
    if (!isOurs(p)) return (realMkdir as any)(p, o);
    calls.push(['fs.mkdirSync', p, o]);
    return undefined;
  }) as any);

  const reads: any[][] = [];
  const db = {
    executeRef: jest.fn(async (name: string, body: any) => {
      calls.push(['db.executeRef', name, { ...body }]);
      if (name !== 'realtime_transcript_upload_status') throw new Error(`unexpected SP ${name}`);
      return opts.status ?? { success: true, data: [[STATUS_ROW]] };
    }),
    rowQuery: jest.fn(async (sql: string, params: any[]) => {
      reads.push([sql, params]);
      if (sql !== SESSION_PROVENANCE_SQL) throw new Error(`unexpected query ${sql}`);
      return { success: true, data: [{ ...NON_VENUE }] };
    }),
  };
  const annotTransfer = {
    startTransfer: jest.fn(async (nSesid: string, filePath: string, cProtocol: string) => {
      calls.push(['annotTransfer.startTransfer', nSesid, filePath, cProtocol]);
      if (opts.transferThrows) throw opts.transferThrows;
      return { msg: 1 };
    }),
  };
  const config = { get: (key: string) => CONFIG[key] };

  // Constructor order: db, dateTimeService, annotTransfer, ios, schedulerService, firebaseService, user,
  // config, issueService, feedData, conversionJs, eclipseSession.
  const svc: SessionService = new (SessionService as any)(
    db, {}, annotTransfer, {}, {}, {}, {}, config, {}, {}, {}, {},
  );
  return { calls, reads, db, annotTransfer, svc };
}

/** Today's full cFlag 'P' sequence when every folder exists. */
const todaysSequence = (body = statusBody()): Call[] => [
  ['fs.existsSync', TXT],
  ['fs.existsSync', TRANSFER_DIR],
  ['fs.existsSync', REALTIME_DIR],
  ['annotTransfer.startTransfer', SES, TXT, 'B'],
  ['db.executeRef', 'realtime_transcript_upload_status', body],
];

describe('SessionService.updateTranscriptStatus: the upload-publish pipeline (characterization, R-T4 / D16)', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  it("cFlag 'P': checks the uploaded .TXT, transfers the annotations, then runs the status SP with the request", async () => {
    const { calls, reads, db, svc } = build();
    const body = statusBody();

    await expect(svc.updateTranscriptStatus(body)).resolves.toEqual(STATUS_ROW);

    expect(calls).toEqual(todaysSequence());
    expect(db.executeRef.mock.calls).toEqual([['realtime_transcript_upload_status', body]]);
    expect(strayReads(reads, SES)).toEqual([]);
    expect(db.executeRef.mock.calls[0][1]).toBe(body);
    expect(body).toEqual(statusBody());
  });

  it('creates a missing transfer folder and REALTIME_PATH before the transfer', async () => {
    const { calls, svc } = build({ exists: { transferDir: false, realtimeDir: false } });

    await expect(svc.updateTranscriptStatus(statusBody())).resolves.toEqual(STATUS_ROW);

    expect(calls).toEqual([
      ['fs.existsSync', TXT],
      ['fs.existsSync', TRANSFER_DIR],
      ['fs.mkdirSync', TRANSFER_DIR, { recursive: true }],
      ['fs.existsSync', REALTIME_DIR],
      ['fs.mkdirSync', REALTIME_DIR, { recursive: true }],
      ['annotTransfer.startTransfer', SES, TXT, 'B'],
      ['db.executeRef', 'realtime_transcript_upload_status', statusBody()],
    ]);
  });

  it('a missing uploaded .TXT stops before anything else', async () => {
    const { calls, svc } = build({ exists: { txt: false } });
    await expect(svc.updateTranscriptStatus(statusBody())).resolves.toEqual({ msg: -1, value: 'File Not found' });
    expect(calls).toEqual([['fs.existsSync', TXT]]);
  });

  it("a transfer that throws answers 'File Not found' with the error, and the status SP does not run", async () => {
    const boom = new Error('python missing');
    const { calls, svc } = build({ transferThrows: boom });
    await expect(svc.updateTranscriptStatus(statusBody())).resolves.toEqual({ msg: -1, value: 'File Not found', error: boom });
    expect(calls).toEqual(todaysSequence().slice(0, 4));
  });

  it("any other cFlag runs only the status SP", async () => {
    const { calls, reads, annotTransfer, svc } = build();
    const body = statusBody({ cFlag: 'C' });
    await expect(svc.updateTranscriptStatus(body)).resolves.toEqual(STATUS_ROW);
    expect(calls).toEqual([['db.executeRef', 'realtime_transcript_upload_status', statusBody({ cFlag: 'C' })]]);
    expect(annotTransfer.startTransfer).not.toHaveBeenCalled();
    expect(reads).toEqual([]);
  });

  it("a failing status SP answers 'Creation failed' with the error", async () => {
    const { svc } = build({ status: { success: false, error: 'db down' } });
    await expect(svc.updateTranscriptStatus(statusBody())).resolves.toEqual({ msg: -1, value: 'Creation failed', error: 'db down' });
  });
});
