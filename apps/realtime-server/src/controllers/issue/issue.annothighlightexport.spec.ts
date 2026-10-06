import { ForbiddenException } from '@nestjs/common';
import { SESSION_ACCESS_SQL } from '../../events/realtime-socket-access';
import { IssueService } from '../../services/issue/issue.service';
import { FactService } from '../../services/fact/fact.service';
import { IssueController } from './issue.controller';

// POST issue/annothighlightexport runs the same export as transcript/annothighlightexport (the feed or
// published transcript of nSessionid, nCaseid's name on the cover). Real controller + real IssueService,
// only the DB and the export renderer mocked: a refused call must reach neither the export SP nor the
// renderer.

const ME = '11111111-1111-4111-8111-111111111111';
const SES = '33333333-3333-4333-8333-333333333333';
const CASE = '66666666-6666-4666-8666-666666666666';
const OTHER_CASE = '77777777-7777-4777-8777-777777777777';

const EXPORTED = { msg: 1, path: 'export/s_x.pdf' };

/** `visible` sessions pass the socket membership SQL; `cases` is RSessionMaster.nCaseid per session. */
function build(visible: string[], cases: Record<string, string> = { [SES]: CASE }) {
  const db = {
    rowQuery: jest.fn(async (text: string, params: any[]) => {
      if (text === SESSION_ACCESS_SQL) return { success: true, data: visible.includes(params[0]) ? [{ '?column?': 1 }] : [] };
      if (text.includes('"nCaseid" FROM "RSessionMaster"')) return { success: true, data: cases[params[0]] ? [{ nCaseid: cases[params[0]] }] : [] };
      throw new Error(`unexpected query: ${text}`);
    }),
    executeRef: jest.fn(async () => ({ success: true, data: [[{ secret: 'annotation' }], []] })),
  };
  const exportService = { exportFile: jest.fn().mockResolvedValue(EXPORTED) };
  const ctrl = new IssueController(new IssueService(db as any, exportService as any, new FactService(db as any, {} as any)));
  const req = (user: any) => ({ user }) as any;
  return { db, exportService, ctrl, req };
}

const body = (extra: Record<string, any> = {}) =>
  ({ nSessionid: SES, nCaseid: CASE, nUserid: ME, cTranscript: 'Y', cCasename: 'c', cUsername: 'u', ...extra }) as any;
const member = { userId: ME, isAdmin: false };

describe('POST issue/annothighlightexport (session membership)', () => {
  it('403 for a session the caller cannot see, without running the export SP or the renderer', async () => {
    const { db, exportService, ctrl, req } = build([]);
    await expect(ctrl.getAnnotHighlightExport(body(), req(member))).rejects.toBeInstanceOf(ForbiddenException);
    expect(db.rowQuery).toHaveBeenCalledWith(SESSION_ACCESS_SQL, [SES, ME]);
    expect(db.executeRef).not.toHaveBeenCalled();
    expect(exportService.exportFile).not.toHaveBeenCalled();
  });

  it("403 when a visible session is paired with another case's nCaseid (its name would be printed)", async () => {
    const { db, exportService, ctrl, req } = build([SES]);
    await expect(ctrl.getAnnotHighlightExport(body({ nCaseid: OTHER_CASE }), req(member))).rejects.toBeInstanceOf(ForbiddenException);
    expect(db.executeRef).not.toHaveBeenCalled();
    expect(exportService.exportFile).not.toHaveBeenCalled();
  });

  it('403 when no session is named or no token user is attached', async () => {
    const { db, exportService, ctrl, req } = build([SES]);
    await expect(ctrl.getAnnotHighlightExport(body({ nSessionid: null }), req(member))).rejects.toBeInstanceOf(ForbiddenException);
    await expect(ctrl.getAnnotHighlightExport(body(), req(undefined))).rejects.toBeInstanceOf(ForbiddenException);
    await expect(ctrl.getAnnotHighlightExport(body(), undefined as any)).rejects.toBeInstanceOf(ForbiddenException);
    expect(db.executeRef).not.toHaveBeenCalled();
    expect(exportService.exportFile).not.toHaveBeenCalled();
  });

  it('exports for a member of the session, with the case it belongs to', async () => {
    const { db, exportService, ctrl, req } = build([SES]);
    await expect(ctrl.getAnnotHighlightExport(body(), req(member))).resolves.toEqual(EXPORTED);
    expect(db.executeRef).toHaveBeenCalledWith('realtime_get_issue_annotation_highlight_export', expect.objectContaining({ nSessionid: SES, nCaseid: CASE }));
    expect(exportService.exportFile).toHaveBeenCalledTimes(1);
  });

  it('exports for a global admin without the membership query, still checking the case', async () => {
    const { db, exportService, ctrl, req } = build([]);
    await expect(ctrl.getAnnotHighlightExport(body(), req({ userId: ME, isAdmin: true }))).resolves.toEqual(EXPORTED);
    expect(db.rowQuery.mock.calls.map((c) => c[0])).not.toContain(SESSION_ACCESS_SQL);
    expect(exportService.exportFile).toHaveBeenCalledTimes(1);

    const other = build([]);
    await expect(other.ctrl.getAnnotHighlightExport(body({ nCaseid: OTHER_CASE }), other.req({ userId: ME, isAdmin: true })))
      .rejects.toBeInstanceOf(ForbiddenException);
    expect(other.exportService.exportFile).not.toHaveBeenCalled();
  });
});
