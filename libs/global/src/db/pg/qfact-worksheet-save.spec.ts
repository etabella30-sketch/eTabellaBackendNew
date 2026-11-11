import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { changedWorksheetIssues, guardQfactWorksheetSave, qfactWorksheetDetail, qfactWorksheetVersion, QFACT_WORKSHEET_STATE_SQL, QFACT_WORKSHEET_ISSUES_SQL, auditQfactWorksheetSave, QFACT_WORKSHEET_AUDIT_SQL } from './qfact-worksheet-save';
import { saveTransaction } from './save-transaction';
import { lastValueFrom, defer } from 'rxjs';
import { CaseSaveTransactionInterceptor } from '../../interceptor/case-save-transaction.interceptor';
const USER = '10000000-0000-4000-8000-000000000001', CASE = '20000000-0000-4000-8000-000000000001', FACT = '30000000-0000-4000-8000-000000000001';
const ACCESS = '40000000-0000-4000-8000-000000000001', EOT = '40000000-0000-4000-8000-000000000002', NEW = '40000000-0000-4000-8000-000000000003', NONE = '40000000-0000-4000-8000-000000000004';
const issues = [ACCESS,EOT,NEW,NONE].map(id => ({ id, system: id === NONE }));
const state = () => ({ nFSid: FACT, nUserid: USER, nCaseid: CASE, cFType: 'QF', jTexts: ['Keep my exact Note'], nColorid: ACCESS, cIsNote: 'Y', nPage: 6, nLine: 14, issues: [[ACCESS,9,7],[EOT,3,4]], contacts: [USER], bCase: true, bAuditReady: true });
function world(change: any = { action: 'replace', issueId: ACCESS, replacementId: NEW }) {
  const saved = state();
  const body: Record<string,unknown> = { nFSid: FACT, jTexts: JSON.stringify({ caseId: CASE, expected: { id: FACT, version: qfactWorksheetVersion(saved) }, change }) };
  const db = { rowQuery: jest.fn(async (sql: string) => ({ success: true, data: sql === QFACT_WORKSHEET_STATE_SQL ? [saved] : sql === QFACT_WORKSHEET_ISSUES_SQL ? issues : [] })) };
  const run = () => saveTransaction.run({ active: true, afterCommit: [], client: {} as any }, () => guardQfactWorksheetSave(db as any, USER, body));
  return { saved, body, db, run };
}
describe('private QFact worksheet saves', () => {
  it('replaces one Issue while preserving unrelated links, grades, exact Note, contacts and source position', async () => {
    const w = world();
    const audit = await w.run();
    expect(JSON.parse(w.body.jIssue as string)).toEqual([[EOT,3,4],[NEW,0,0]]);
    expect(JSON.parse(w.body.jTexts as string)).toEqual(['Keep my exact Note']);
    expect(w.body).toMatchObject({ nPage:6,nLine:14,jContacts:JSON.stringify([USER]),nColorid:NEW });
    expect(audit.before).toEqual([[ACCESS,9,7],[EOT,3,4]]);
    await auditQfactWorksheetSave(w.db as any, audit);
    expect(w.db.rowQuery).toHaveBeenCalledWith(QFACT_WORKSHEET_AUDIT_SQL, expect.arrayContaining([FACT,CASE,USER,'replace']));
    expect(w.db.rowQuery.mock.calls[0][0]).toContain('FOR UPDATE OF f,d');
    expect(w.db.rowQuery.mock.calls[1][0]).toBe(QFACT_WORKSHEET_STATE_SQL);
  });
  it.each(['owner','type','case','membership','migration','version'])('refuses %s changes before modifying the legacy payload', async kind => {
    const w = world(), before = w.body.jTexts;
    if (kind === 'owner') w.saved.nUserid = NEW;
    if (kind === 'type') w.saved.cFType = 'F';
    if (kind === 'case') w.saved.nCaseid = NEW;
    if (kind === 'membership') w.saved.bCase = false;
    if (kind === 'migration') w.saved.bAuditReady = false;
    if (kind === 'version') w.saved.jTexts = ['Newer Note'];
    await expect(w.run()).rejects.toBeInstanceOf(['migration','version'].includes(kind) ? ConflictException : ForbiddenException);
    expect(w.body.jTexts).toBe(before);
  });
  it('preserves a blank/exact Note and does not offer a bulk Note action', async () => {
    const w = world({ action:'note', note:'  Exact note\nwith spacing  ' });
    await w.run(); expect(JSON.parse(w.body.jTexts as string)).toEqual(['  Exact note\nwith spacing  ']);
    const bad = world({ action:'appendNotes', note:'Repeated task' });
    await expect(bad.run()).rejects.toBeInstanceOf(BadRequestException);
  });
  it('deduplicates replacement, keeps no-ops unchanged, restores Unassigned and rejects invalid replacement', () => {
    expect(changedWorksheetIssues([[ACCESS,0,0],[EOT,3,4],[NEW,5,6]],'replace',ACCESS,NEW,issues)).toEqual([[EOT,3,4],[NEW,5,6]]);
    expect(changedWorksheetIssues([[EOT,3,4]],'replace',ACCESS,NEW,issues)).toEqual([[EOT,3,4]]);
    expect(changedWorksheetIssues([[ACCESS,0,0]],'remove',ACCESS,undefined,issues)).toEqual([[NONE,0,0]]);
    expect(() => changedWorksheetIssues([[ACCESS,0,0]],'replace',ACCESS,ACCESS,issues)).toThrow(BadRequestException);
  });
  it('advertises the guard only on an owned, authorized QFact and gates editing on audit readiness', async () => {
    const w = world();
    expect(await qfactWorksheetDetail(w.db as any, USER, { nFSid:FACT,nUserid:USER,cFType:'QF' })).toMatchObject({ nCaseid:CASE,bWorksheetSafeEdit:true,worksheetVersion:expect.any(String) });
    w.saved.bAuditReady = false;
    expect(await qfactWorksheetDetail(w.db as any, USER, { nFSid:FACT,nUserid:USER,cFType:'QF' })).toMatchObject({ bWorksheetSafeEdit:false });
    w.db.rowQuery.mockClear();
    await qfactWorksheetDetail(w.db as any, USER, { nFSid:FACT,nUserid:NEW,cFType:'QF' });
    expect(w.db.rowQuery).not.toHaveBeenCalled();
  });
  it('returns content and version from the same snapshot when an older detail read races an edit', async () => {
    const w = world();
    w.saved.jTexts = ['Newer saved Note'];
    const result = await qfactWorksheetDetail(w.db as any,USER,{nFSid:FACT,nUserid:USER,cFType:'QF',jTexts:['Old Note']});
    expect(result).toMatchObject({jTexts:['Newer saved Note'],worksheetVersion:qfactWorksheetVersion(w.saved)});
  });
  it('guards the HTTP body before the legacy handler and marks only an audited acknowledgement',async()=>{
    const w=world();
    const db={...w.db,saveAtomically:(fn:()=>Promise<any>)=>saveTransaction.run({active:true,afterCommit:[],client:{} as any},fn)};
    const interceptor=new CaseSaveTransactionInterceptor({get:()=>db} as any);
    const handler=jest.fn(async()=>{
      expect(JSON.parse(w.body.jIssue as string)).toEqual([[EOT,3,4],[NEW,0,0]]);
      expect(JSON.parse(w.body.jTexts as string)).toEqual(['Keep my exact Note']);
      return [{msg:1,value:'Updated'}];
    });
    const request={method:'POST',path:'/realtimeapi/fact/quickfactupdate',headers:{'x-qfact-worksheet':'1'},body:w.body,etCaller:{userId:USER,family:'cloud-jwt'}};
    const result=await lastValueFrom(interceptor.intercept({switchToHttp:()=>({getRequest:()=>request})} as any,{handle:()=>defer(handler)}));
    expect(result).toEqual([{msg:1,value:'Updated',worksheetVerified:true}]);
    expect(w.db.rowQuery).toHaveBeenCalledWith(QFACT_WORKSHEET_AUDIT_SQL,expect.any(Array));
  });
});
