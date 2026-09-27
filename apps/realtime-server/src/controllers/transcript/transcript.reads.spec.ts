import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { ForbiddenException } from '@nestjs/common';
import { SESSION_ACCESS_SQL } from '../../events/realtime-socket-access';
import { CASE_SESSIONS_AUDIENCE_SQL, SESSIONS_ACCESS_BATCH_SQL } from '../../services/session/session-access-gate';
import {
  TRANSCRIPT_SESSION_BY_ID_SQL,
  TRANSCRIPT_SESSIONS_BY_PATH_SQL,
  callerCanReadTranscriptFile,
} from '../../services/transcript/transcript-access';
import { TranscriptService } from '../../services/transcript/transcript.service';
import { TranscriptController } from './transcript.controller';

// transcript/* reads had only the login check: any user could list every produced transcript and read
// any of them. They now follow the session a transcript is published to (the socket membership rule).
// Real controller + real TranscriptService over a temp REALTIME_PATH; the DB is mocked and answers the
// membership and Transcripts lookups from the tables below. Every file and row holds "secret", so a
// refusal can be shown to read and return nothing.

const ME = '11111111-1111-4111-8111-111111111111';
const MY_SES = '33333333-3333-4333-8333-333333333333';
const OTHER_SES = '44444444-4444-4444-8444-444444444444';
const MY_T = 'a1111111-1111-4111-8111-111111111111';
const OTHER_T = 'a2222222-2222-4222-8222-222222222222';
const DRAFT_T = 'a3333333-3333-4333-8333-333333333333';

/** transcript."Transcripts": id -> { nSesid, cPath } (the draft is not published). */
const TRANSCRIPTS: Record<string, { nSesid: string | null; cPath: string }> = {
  [MY_T]: { nSesid: MY_SES, cPath: 'transcript_1.json' },
  [OTHER_T]: { nSesid: OTHER_SES, cPath: 'transcript_2.json' },
  [DRAFT_T]: { nSesid: null, cPath: 'transcript_3.json' },
};
const LIST = Object.entries(TRANSCRIPTS).map(([cTransid, t]) => ({ cTransid, cTitle: `secret ${cTransid}`, nSesid: t.nSesid, cPath: t.cPath }));
const LINES = [{ pageno: 1, lineno: 1, text: 'secret testimony' }, { pageno: 1, lineno: 2, text: 'more' }];

function build(dir: string, visible: string[] = [MY_SES]) {
  const db = {
    rowQuery: jest.fn(async (text: string, params: any[]) => {
      if (text === SESSION_ACCESS_SQL) return { success: true, data: visible.includes(params[0]) ? [{ '?column?': 1 }] : [] };
      if (text === SESSIONS_ACCESS_BATCH_SQL) return { success: true, data: (params[0] as string[]).filter((s) => visible.includes(s)).map((nSesid) => ({ nSesid })) };
      if (text === TRANSCRIPT_SESSION_BY_ID_SQL) return { success: true, data: TRANSCRIPTS[params[0]] ? [{ nSesid: TRANSCRIPTS[params[0]].nSesid }] : [] };
      if (text === TRANSCRIPT_SESSIONS_BY_PATH_SQL) {
        return { success: true, data: Object.values(TRANSCRIPTS).filter((t) => t.cPath === params[0] && t.nSesid).map((t) => ({ nSesid: t.nSesid })) };
      }
      throw new Error(`unexpected query: ${text}`);
    }),
    executeRef: jest.fn(async (name: string, params: any) => {
      if (name === 'list_transcripts') return { success: true, data: [LIST] };
      if (name === 'get_transcript_detail') {
        const t = TRANSCRIPTS[params.cTransid];
        return { success: true, data: [t ? [{ cTransid: params.cTransid, cTitle: 'secret title', cPath: t.cPath }] : []] };
      }
      throw new Error(`unexpected SP: ${name}`);
    }),
  };
  const config = { get: (k: string) => (k === 'REALTIME_PATH' ? dir + path.sep : undefined) };
  const log = { info: jest.fn(), debug: jest.fn(), error: jest.fn(), warn: jest.fn() };
  const html = { generateHtml: jest.fn(() => '<p>secret html</p>') };
  const svc = new TranscriptService(config as any, db as any, log as any, html as any);
  jest.spyOn(svc, 'savehtmlToFile').mockResolvedValue({ msg: 1 });
  const ctrl = new TranscriptController(svc, {} as any, {} as any, config as any, {} as any, db as any);
  const req = (user: any) => ({ user, get: () => 'example.com', protocol: 'https' }) as any;
  return { db, svc, ctrl, req, html };
}

const member = { userId: ME, isAdmin: false };
const admin = { userId: ME, isAdmin: true };

describe('transcript/* reads (session membership)', () => {
  let dir: string;
  let readFileSync: jest.SpyInstance;

  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-transcripts-'));
    for (const name of ['transcript_1.json', 'transcript_2.json', 'transcript_3.json', `s_${MY_SES}.json`, `s_${OTHER_SES}.json`]) {
      fs.writeFileSync(path.join(dir, name), JSON.stringify(LINES));
    }
  });
  afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));
  beforeEach(() => { readFileSync = jest.spyOn(fs, 'readFileSync'); });
  /** Reads of the transcript files (jest itself reads source files when it prints console output). */
  const transcriptReads = () => readFileSync.mock.calls.filter((c) => path.resolve(String(c[0])).startsWith(path.resolve(dir)));
  afterEach(() => jest.restoreAllMocks());

  describe('GET transcript/get_transcripts', () => {
    it('lists only transcripts published to a session the caller can see, in one membership query', async () => {
      const { db, ctrl, req } = build(dir);
      const res: any = await ctrl.gettranscripts({ nMasterid: ME } as any, req(member));
      expect(res.map((r: any) => r.cTransid)).toEqual([MY_T]);
      expect(db.rowQuery).toHaveBeenCalledTimes(1);
      expect(db.rowQuery).toHaveBeenCalledWith(SESSIONS_ACCESS_BATCH_SQL, [[MY_SES, OTHER_SES], ME]);
    });

    it('lists nothing to a caller who can see none of them, or with no token user', async () => {
      await expect(build(dir, []).ctrl.gettranscripts({} as any, build(dir).req(member))).resolves.toEqual([]);
      await expect(build(dir).ctrl.gettranscripts({} as any, build(dir).req(undefined))).resolves.toEqual([]);
    });

    it('lists every transcript, drafts included, to a global admin', async () => {
      const { db, ctrl, req } = build(dir, []);
      await expect(ctrl.gettranscripts({} as any, req(admin))).resolves.toEqual(LIST);
      expect(db.rowQuery).not.toHaveBeenCalled();
    });
  });

  describe('GET transcript/get_transcript_detail', () => {
    it('answers "not found" for a transcript of another session, and for an unpublished draft, running no SP', async () => {
      for (const cTransid of [OTHER_T, DRAFT_T, 'b9999999-9999-4999-8999-999999999999', 'nope']) {
        const { db, ctrl, req } = build(dir);
        const res = await ctrl.gettranscriptDetail({ cTransid, nMasterid: ME } as any, req(member));
        expect(res).toEqual({ msg: -1, value: 'Failed to fetch' });
        expect(db.executeRef).not.toHaveBeenCalled();
      }
    });

    it('returns the detail of a transcript published to a session the caller can see (legacy cover page)', async () => {
      const { ctrl, req } = build(dir);
      await expect(ctrl.gettranscriptDetail({ cTransid: MY_T, nMasterid: ME } as any, req(member))).resolves.toMatchObject({ cTransid: MY_T });
    });

    it('returns any transcript, drafts included, to a global admin', async () => {
      const { ctrl, req } = build(dir, []);
      await expect(ctrl.gettranscriptDetail({ cTransid: DRAFT_T } as any, req(admin))).resolves.toMatchObject({ cTransid: DRAFT_T });
    });
  });

  describe('GET transcript/filedata and transcript/summary', () => {
    const refusedPaths = [
      `s_${OTHER_SES}.json`, // published transcript of a session the caller cannot see
      'transcript_2.json', // source file of another session's transcript
      'transcript_3.json', // source file of an unpublished draft
      `./s_${MY_SES}.json`, // anything but a plain file name
      `x/../s_${MY_SES}.json`,
      'unknown.json',
    ];

    it.each(refusedPaths)('refuses %s with the route\'s "file not found" answer, reading nothing', async (cPath) => {
      const { ctrl, req } = build(dir);
      await expect(ctrl.getTranscriptFiledata({ cPath } as any, req(member))).resolves.toEqual({ msg: -1, message: 'Error reading transcript file' });
      await expect(ctrl.getTranscriptSummary({ cPath } as any, req(member)))
        .resolves.toEqual({ msg: -1, value: 'Error processing transcript file', error: 'Could not read the transcript file' });
      expect(transcriptReads()).toEqual([]);
    });

    it.each([`s_${MY_SES}.json`, 'transcript_1.json'])('reads %s for a caller who can see its session', async (cPath) => {
      const { ctrl, req } = build(dir);
      await expect(ctrl.getTranscriptFiledata({ cPath } as any, req(member))).resolves.toEqual(LINES);
      await expect(ctrl.getTranscriptSummary({ cPath } as any, req(member))).resolves.toMatchObject({ msg: 1, totalPages: 1 });
    });

    it('reads any file for a global admin (draft uploads are not in Transcripts yet)', async () => {
      const { db, ctrl, req } = build(dir, []);
      await expect(ctrl.getTranscriptFiledata({ cPath: 'transcript_3.json' } as any, req(admin))).resolves.toEqual(LINES);
      expect(db.rowQuery).not.toHaveBeenCalled();
    });
  });

  describe('GET transcript/html-file and transcript/html', () => {
    it('html-file refuses a transcript of another session without rendering or caching it', async () => {
      const { db, ctrl, req, html } = build(dir);
      const res: any = await ctrl.getTranscriptHtmlFile({ cTransid: OTHER_T, cPath: 'x', type: 'FST' } as any, req(member));
      expect(res).toEqual({ msg: -1, value: 'Failed to generate HTML', error: 'File does not exist at server' });
      expect(db.executeRef).not.toHaveBeenCalled();
      expect(html.generateHtml).not.toHaveBeenCalled();
    });

    it('html-file renders a transcript published to a session the caller can see', async () => {
      const { ctrl, req } = build(dir);
      const res: any = await ctrl.getTranscriptHtmlFile({ cTransid: MY_T, cPath: 'ignored', type: 'FST' } as any, req(member));
      expect(res.msg).toBe(1);
    });

    it('html refuses (403) a file the caller cannot read, without rendering it', async () => {
      const { ctrl, req, html } = build(dir);
      await expect(ctrl.getTranscriptHtml({ cPath: 'transcript_2.json' } as any, req(member))).rejects.toBeInstanceOf(ForbiddenException);
      expect(html.generateHtml).not.toHaveBeenCalled();
      expect(transcriptReads()).toEqual([]);
    });

    it('html renders for a global admin', async () => {
      const { ctrl, req } = build(dir, []);
      await expect(ctrl.getTranscriptHtml({ cPath: 'transcript_3.json' } as any, req(admin))).resolves.toHaveProperty('base64');
    });
  });

  it('callerCanReadTranscriptFile checks the session a differently-cased s_<id>.json names (Windows opens the same file)', async () => {
    const { db } = build(dir, [MY_SES]);
    await expect(callerCanReadTranscriptFile(db, member, `S_${MY_SES.toUpperCase()}.JSON`)).resolves.toBe(true);
    await expect(callerCanReadTranscriptFile(db, member, `S_${OTHER_SES.toUpperCase()}.JSON`)).resolves.toBe(false);
    expect(db.rowQuery).toHaveBeenCalledWith(SESSION_ACCESS_SQL, [OTHER_SES, ME]);
  });

  it('callerCanReadTranscriptFile fails closed when the Transcripts lookup fails', async () => {
    const db = { rowQuery: jest.fn(async () => ({ success: false, error: 'down' })) };
    await expect(callerCanReadTranscriptFile(db, member, 'transcript_1.json')).resolves.toBe(false);
    const throwing = { rowQuery: jest.fn(async () => { throw new Error('boom'); }) };
    await expect(callerCanReadTranscriptFile(throwing, member, 'transcript_1.json')).resolves.toBe(false);
  });
});

// Review follow-up: the RT Production pickers reached the same cross-case data with only the login
// check. get_field_data returns distinct values of any Transcripts column over every transcript
// (cHtmlpath names the exports/ HTML served without a token), case_combo every case, and
// session_combo any case's sessions (the getSessionsByCaseId list).
describe('transcript/* RT Production pickers', () => {
  const MY_CASE = '66666666-6666-4666-8666-666666666666';
  const OTHER_CASE = '77777777-7777-4777-8777-777777777777';
  const SECRET = [[{ cHtmlpath: `s_${OTHER_T}_FST.html`, cCasename: 'secret case' }]];

  function pickers() {
    const db = {
      rowQuery: jest.fn(async (text: string, params: any[]) => {
        if (text === CASE_SESSIONS_AUDIENCE_SQL) return { success: true, data: params[0] === MY_CASE && params[1] === ME ? [{ '?column?': 1 }] : [] };
        throw new Error(`unexpected query: ${text}`);
      }),
      executeRef: jest.fn(async () => ({ success: true, data: SECRET })),
    };
    const log = { info: jest.fn(), debug: jest.fn(), error: jest.fn(), warn: jest.fn() };
    const svc = new TranscriptService({ get: () => undefined } as any, db as any, log as any, {} as any);
    const ctrl = new TranscriptController(svc, {} as any, {} as any, {} as any, {} as any, db as any);
    return { db, ctrl, req: (user: any) => ({ user }) as any };
  }

  it('get_field_data and case_combo answer [] to a non-admin (and with no token user), running no SP', async () => {
    for (const user of [member, undefined]) {
      const { db, ctrl, req } = pickers();
      await expect(ctrl.get_field_data({ searchstr: '', column_nm: 'cHtmlpath', nMasterid: ME } as any, req(user))).resolves.toEqual([]);
      await expect(ctrl.caseCombo({ nMasterid: ME } as any, req(user))).resolves.toEqual([]);
      expect(db.executeRef).not.toHaveBeenCalled();
    }
  });

  it('get_field_data and case_combo still answer a global admin', async () => {
    const { db, ctrl, req } = pickers();
    await expect(ctrl.get_field_data({ searchstr: 's_', column_nm: 'cHtmlpath' } as any, req(admin))).resolves.toEqual(SECRET[0]);
    await expect(ctrl.caseCombo({} as any, req(admin))).resolves.toEqual(SECRET[0]);
    expect(db.executeRef).toHaveBeenCalledWith('get_field_data', expect.objectContaining({ column_nm: 'cHtmlpath' }), 'transcript');
    expect(db.executeRef).toHaveBeenCalledWith('get_case_combo', expect.anything(), 'transcript');
  });

  it("session_combo lists nothing for a case the caller is neither on nor assigned in, or with no nCaseid", async () => {
    for (const q of [{ nCaseid: OTHER_CASE }, { nCaseid: null }, { nCaseid: 'x' }]) {
      const { db, ctrl, req } = pickers();
      await expect(ctrl.sessionCombo({ ...q, nMasterid: ME } as any, req(member))).resolves.toEqual([]);
      expect(db.executeRef).not.toHaveBeenCalled();
    }
  });

  it("session_combo lists the sessions of the caller's own case, and of any case for an admin", async () => {
    for (const [nCaseid, user] of [[MY_CASE, member], [OTHER_CASE, admin]] as const) {
      const { db, ctrl, req } = pickers();
      await expect(ctrl.sessionCombo({ nCaseid } as any, req(user))).resolves.toEqual(SECRET[0]);
      expect(db.executeRef).toHaveBeenCalledWith('get_session', { nCaseid }, 'transcript');
    }
  });
});
