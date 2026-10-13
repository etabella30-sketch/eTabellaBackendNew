import { ADVANCED_VIEW_ONLY, CASE_MODE_SQL, assertCaseModeWrite, modeRestrictedWrite } from './case-ui-mode';
import { RowQuery } from '@app/api-kernel';

const USER = '10000000-0000-4000-8000-000000000001';
const CASE = '20000000-0000-4000-8000-000000000001';
const OTHER = '20000000-0000-4000-8000-000000000002';
const FACT = '30000000-0000-4000-8000-000000000001';
const SECOND = '30000000-0000-4000-8000-000000000002';
function db(mode = 'E', type = 'F') {
  const rows = jest.fn(async (sql: string, values: unknown[]) => sql === CASE_MODE_SQL
    ? [{ cUIMode: mode }]
    : [{ nCaseid: CASE, cFType: type }]);
  return { rows, port: { rows } as RowQuery };
}
describe('server User × Case capability policy', () => {
  it.each(['fact_update', 'factsheet_submit', 'fact_insert_team', 'fact_insert_links', 'fact_insert_issues', 'manage_comments'])('refuses Full Fact %s in Essential, including stale tabs', async fn => {
    const query = db();
    await expect(assertCaseModeWrite(query.port, fn, { nMasterid: USER, nFSid: FACT, nCaseid: OTHER, cFtype: 'QF' })).rejects.toThrow(ADVANCED_VIEW_ONLY);
    expect(query.rows).toHaveBeenLastCalledWith(CASE_MODE_SQL, [USER, CASE]);
  });
  it.each(['task_update_status', 'task_insert_assign_V2', 'assign_task', 'unassign_task', 'sidenav_task_update_status'])('refuses task mutation %s', async fn => {
    const query = db();
    await expect(assertCaseModeWrite(query.port, fn, { nMasterid: USER, nTaskid: FACT, nCaseid: OTHER })).rejects.toThrow(ADVANCED_VIEW_ONLY);
    expect(query.rows).toHaveBeenLastCalledWith(CASE_MODE_SQL, [USER, CASE]);
  });
  it.each(['contactbuilder', 'case_contactbuilder', 'assign_contact', 'unassign_contact'])('refuses participant mutation %s', async fn => {
    const query = db();
    await expect(assertCaseModeWrite(query.port, fn, { nMasterid: USER, nContactid: FACT })).rejects.toThrow(ADVANCED_VIEW_ONLY);
  });
  it.each(['doc_insert', 'doc_delete'])('refuses Doc Link mutation %s', async fn => {
    const query = db();
    await expect(assertCaseModeWrite(query.port, fn, { nMasterid: USER, nDocid: FACT })).rejects.toThrow(ADVANCED_VIEW_ONLY);
  });
  it.each(['fact_quick_update', 'fact_delete', 'individual_update_facts_note', 'fact_insert_issues', 'fact_insert_contact', 'fact_insert_detail', 'fact_insert_team'])('keeps normal QFACT %s usable regardless of its creation mode', async fn => {
    const query = db('E', 'QF'); await assertCaseModeWrite(query.port, fn, { nMasterid: USER, nFSid: FACT });
    expect(query.rows).not.toHaveBeenCalledWith(CASE_MODE_SQL, expect.anything());
  });
  it('allows new QFACTs and rejects conversion of a stored QFACT to a Full Fact', async () => {
    const query = db('E', 'QF');
    await assertCaseModeWrite(query.port, 'fact_insert', { nMasterid: USER, nCaseid: CASE, cFtype: 'QF' });
    await expect(assertCaseModeWrite(query.port, 'fact_insert', { nMasterid: USER, nFSid: FACT, cFtype: 'F' })).rejects.toThrow(ADVANCED_VIEW_ONLY);
  });
  it('checks every target of a bulk write before the operation', async () => {
    const query = db('E', 'QF');
    query.rows.mockImplementation(async (sql, values) => sql === CASE_MODE_SQL ? [{ cUIMode: 'E' }]
      : [{ nCaseid: CASE, cFType: values[0] === FACT ? 'QF' : 'F' }]);
    await expect(assertCaseModeWrite(query.port, 'fact_delete', { nMasterid: USER, jFSids: JSON.stringify([FACT, SECOND]) })).rejects.toThrow(ADVANCED_VIEW_ONLY);
    expect(query.rows).toHaveBeenCalledWith(expect.stringContaining('FactMaster'), [SECOND]);
  });
  it('resolves conversion from nQFSid against the stored case instead of a request case', async () => {
    const query = db('E', 'QF');
    await expect(assertCaseModeWrite(query.port, 'fact_insert', {
      nMasterid: USER, nQFSid: FACT, nCaseid: OTHER, cFtype: 'F',
    })).rejects.toThrow(ADVANCED_VIEW_ONLY);
    expect(query.rows).toHaveBeenLastCalledWith(CASE_MODE_SQL, [USER, CASE]);
  });
  it('passes Advanced capability without rewriting permissions or skipping the downstream permission checks', async () => {
    const query = db('A'); const request = { nMasterid: USER, nFSid: FACT, bCanEdit: false };
    await assertCaseModeWrite(query.port, 'fact_update', request); expect(request.bCanEdit).toBe(false);
  });
  it.each(['fact_get_detail', 'task_list', 'contact_list', 'issue_delete', 'issue_insert', 'claim_update', 'workspace_view_save'])('leaves consumption, personal views, Claims & Issues operation %s to existing permissions', async fn => {
    const query = db(); await assertCaseModeWrite(query.port, fn, { nMasterid: USER, nCaseid: CASE }); expect(query.rows).not.toHaveBeenCalled();
  });
  it('fails closed when the mode lookup is unavailable', async () => {
    const query = db(); query.rows.mockRejectedValue(new Error('Database unavailable'));
    await expect(assertCaseModeWrite(query.port, 'task_insert', { nMasterid: USER, nCaseid: CASE, permission: 'N' })).rejects.toThrow('Database unavailable');
  });
});


describe('case mode adversarial targets and operation catalog', () => {
  it.each(['task_insert_detail', 'task_delete', 'task_update_status', 'assign_task'])('%s resolves the task instead of a supplied unrelated fact', async fn => {
    const query = db('E');
    await expect(assertCaseModeWrite(query.port, fn, { nMasterid: USER, nTaskid: FACT, nFSid: SECOND, nCaseid: OTHER })).rejects.toThrow(ADVANCED_VIEW_ONLY);
    expect(query.rows.mock.calls[0][0]).toContain('TaskMaster');
    expect(query.rows).toHaveBeenLastCalledWith(CASE_MODE_SQL, [USER, CASE]);
  });
  it.each(['doc_delete', 'contactbuilder', 'companybuilder', 'contact_rolebuilder'])('%s ignores an unrelated fact id', async fn => {
    const query = db('E');
    await expect(assertCaseModeWrite(query.port, fn, { nMasterid: USER, nFSid: SECOND, nDocid: FACT, nContactid: FACT, nCompanyid: FACT, nCRoleid: FACT, nCaseid: OTHER })).rejects.toThrow(ADVANCED_VIEW_ONLY);
    expect(query.rows.mock.calls[0][0]).not.toContain('FactMaster');
    expect(query.rows).toHaveBeenLastCalledWith(CASE_MODE_SQL, [USER, CASE]);
  });
  it('a new task is gated in its creation case even when a stale task id accompanies it', async () => {
    const query = db('E');
    await expect(assertCaseModeWrite(query.port, 'task_insert', { nMasterid: USER, nTaskid: FACT, nCaseid: OTHER, permission: 'N' })).rejects.toThrow(ADVANCED_VIEW_ONLY);
    expect(query.rows).toHaveBeenCalledTimes(1);
    expect(query.rows).toHaveBeenLastCalledWith(CASE_MODE_SQL, [USER, OTHER]);
  });
  it.each(['not json', '[]', '[null]', '["bad"]', '{}'])('rejects invalid bulk target %s before querying or writing', async jFSids => {
    const query = db('A');
    await expect(assertCaseModeWrite(query.port, 'fact_delete', { nMasterid: USER, jFSids })).rejects.toThrow('Valid fact ids');
    expect(query.rows).not.toHaveBeenCalled();
  });
  it('locks each distinct bulk fact once in a stable order', async () => {
    const query = db('A');
    await assertCaseModeWrite(query.port, 'fact_delete', { nMasterid: USER, jFSids: [SECOND, FACT, SECOND] });
    expect(query.rows.mock.calls.filter(c => c[0].includes('FactMaster')).map(c => c[1][0])).toEqual([FACT, SECOND]);
  });
  it.each(['fact_convert', 'fact_insert_task', 'fact_task_delete'])('QFACT does not bypass Advanced task/conversion action %s', async fn => {
    const query = db('E', 'QF');
    await expect(assertCaseModeWrite(query.port, fn, { nMasterid: USER, nFSid: FACT })).rejects.toThrow(ADVANCED_VIEW_ONLY);
  });
  it('requires a verified actor even if the client claims Advanced and admin rights', async () => {
    const query = db('A');
    await expect(assertCaseModeWrite(query.port, 'fact_update', { nFSid: FACT, cUIMode: 'A', isAdmin: true })).rejects.toThrow('Sign in');
    expect(query.rows).not.toHaveBeenCalled();
  });
  it.each(['task_insert_detail_v2', 'TASK_INSERT_ASSIGN_V2', 'contact_case_rolebuilder', 'companybuilder', 'factsheet_unshare_withme', 'manage_comments', 'unassign_fact'])('recognizes alternate write %s', fn => expect(modeRestrictedWrite(fn)).toBe(true));
});


describe('Workspace alternate bulk task/fact relationship route', () => {
  it('refuses a stale Essential tab even with no facts, using the actual task case', async () => {
    const query = db('E');
    await expect(assertCaseModeWrite(query.port, 'workspace_task_factlink', { nMasterid: USER, nTaskid: FACT, nCaseid: OTHER, jFactids: '[]' })).rejects.toThrow(ADVANCED_VIEW_ONLY);
    expect(query.rows).toHaveBeenLastCalledWith(CASE_MODE_SQL, [USER, CASE]);
  });
  it('checks each affected fact before task linking, including QFACT task relationships', async () => {
    const query = db('E', 'QF');
    await expect(assertCaseModeWrite(query.port, 'workspace_task_factlink', { nMasterid: USER, nTaskid: SECOND, jFactids: JSON.stringify([FACT]) })).rejects.toThrow(ADVANCED_VIEW_ONLY);
    expect(query.rows.mock.calls[0][0]).toContain('FactMaster');
  });
  it('allows the existing permission-gated link only when every affected case is Advanced', async () => {
    const query = db('A');
    await assertCaseModeWrite(query.port, 'workspace_task_factlink', { nMasterid: USER, nTaskid: SECOND, jFactids: JSON.stringify([FACT]) });
    expect(query.rows.mock.calls.map(c => c[0])).toEqual([expect.stringContaining('FactMaster'), CASE_MODE_SQL, expect.stringContaining('TaskMaster'), CASE_MODE_SQL]);
  });
});
