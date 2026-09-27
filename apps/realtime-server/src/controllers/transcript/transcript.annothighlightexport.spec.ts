import { ForbiddenException } from '@nestjs/common';
import { SESSION_ACCESS_SQL } from '../../events/realtime-socket-access';
import { TranscriptController } from './transcript.controller';

const ME = '11111111-1111-4111-8111-111111111111';
const SES = '33333333-3333-4333-8333-333333333333';
const OTHER_SES = '44444444-4444-4444-8444-444444444444';
const CASE = '66666666-6666-4666-8666-666666666666';
const OTHER_CASE = '77777777-7777-4777-8777-777777777777';

const EXPORTED = { msg: 1, path: 'realtime-transcripts/exports/x.pdf' };

/** `visible` sessions pass the socket membership SQL; `cases` is RSessionMaster.nCaseid per session. */
function build(visible: string[], cases: Record<string, string> = { [SES]: CASE, [OTHER_SES]: CASE }) {
  const db = {
    rowQuery: jest.fn(async (text: string, params: any[]) => {
      if (text === SESSION_ACCESS_SQL) return { success: true, data: visible.includes(params[0]) ? [{ '?column?': 1 }] : [] };
      if (text.includes('"nCaseid" FROM "RSessionMaster"')) return { success: true, data: cases[params[0]] ? [{ nCaseid: cases[params[0]] }] : [] };
      throw new Error(`unexpected query: ${text}`);
    }),
  };
  const publish = { getAnnotHighlightExport: jest.fn().mockResolvedValue(EXPORTED) };
  const ctrl = new TranscriptController({} as any, {} as any, {} as any, {} as any, publish as any, db as any);
  const req = (user: any) => ({ user, get: () => 'example.com', protocol: 'https' }) as any;
  return { db, publish, ctrl, req };
}

const body = (extra: Record<string, any> = {}) =>
  ({ nSessionid: SES, nCaseid: CASE, nUserid: ME, nMasterid: ME, cTranscript: 'Y', ...extra }) as any;
const member = { userId: ME, isAdmin: false };

describe('POST transcript/annothighlightexport (session membership)', () => {
  it('403 for a session the caller cannot see, without exporting', async () => {
    const { db, publish, ctrl, req } = build([]);
    await expect(ctrl.getAnnotHighlightExport(body(), req(member))).rejects.toBeInstanceOf(ForbiddenException);
    expect(db.rowQuery).toHaveBeenCalledWith(SESSION_ACCESS_SQL, [SES, ME]);
    expect(publish.getAnnotHighlightExport).not.toHaveBeenCalled();
  });

  it('403 when the second session id (nSesid, the Mark Nav session) is not visible', async () => {
    const { publish, ctrl, req } = build([SES]);
    await expect(ctrl.getAnnotHighlightExport(body({ nSesid: OTHER_SES }), req(member))).rejects.toBeInstanceOf(ForbiddenException);
    expect(publish.getAnnotHighlightExport).not.toHaveBeenCalled();
  });

  it("403 when a visible session is paired with another case's nCaseid (its name would be printed)", async () => {
    const { publish, ctrl, req } = build([SES]);
    await expect(ctrl.getAnnotHighlightExport(body({ nCaseid: OTHER_CASE }), req(member))).rejects.toBeInstanceOf(ForbiddenException);
    expect(publish.getAnnotHighlightExport).not.toHaveBeenCalled();
  });

  it('403 when no session is named or no token user is attached', async () => {
    const { publish, ctrl, req } = build([SES]);
    await expect(ctrl.getAnnotHighlightExport(body({ nSessionid: null }), req(member))).rejects.toBeInstanceOf(ForbiddenException);
    await expect(ctrl.getAnnotHighlightExport(body(), req(undefined))).rejects.toBeInstanceOf(ForbiddenException);
    expect(publish.getAnnotHighlightExport).not.toHaveBeenCalled();
  });

  it('exports for a member, with both session ids (the legacy export-transcript payload)', async () => {
    const { publish, ctrl, req } = build([SES]);
    const b = body({ nSesid: SES });
    await expect(ctrl.getAnnotHighlightExport(b, req(member))).resolves.toEqual(EXPORTED);
    expect(publish.getAnnotHighlightExport).toHaveBeenCalledWith(b, 'https://example.com');
  });

  it('exports for a global admin without the membership query, still checking the case', async () => {
    const { db, publish, ctrl, req } = build([]);
    await expect(ctrl.getAnnotHighlightExport(body(), req({ userId: ME, isAdmin: true }))).resolves.toEqual(EXPORTED);
    expect(db.rowQuery.mock.calls.map((c) => c[0])).not.toContain(SESSION_ACCESS_SQL);
    expect(publish.getAnnotHighlightExport).toHaveBeenCalledTimes(1);
  });
});
